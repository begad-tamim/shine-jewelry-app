require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const STORE_OWNER_EMAIL = process.env.STORE_OWNER_EMAIL || 'begadtamim.a@gmail.com';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure uploads directory exists
const uploadsRoot = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsRoot)) fs.mkdirSync(uploadsRoot, { recursive: true });

// Multer storage: category subfolder (provided later in route handler)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Category passed in body (multipart -> field) or query; fallback to 'misc'
    const cat = (req.body.category || 'misc').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const catDir = path.join(uploadsRoot, cat);
    if (!fs.existsSync(catDir)) fs.mkdirSync(catDir, { recursive: true });
    cb(null, catDir);
  },
  filename: function (req, file, cb) {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, ts + '_' + safe);
  }
});
const upload = multer({ storage });

// Basic auth middleware (simple)
const ADMIN_USER = 'rehab';
const ADMIN_PASS = 'rehab';
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) return res.status(401).set('WWW-Authenticate','Basic realm="Admin"').json({ error: 'Auth required' });
  const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const [user, pass] = decoded.split(':');
  if (user === ADMIN_USER && pass === ADMIN_PASS) return next();
  return res.status(403).json({ error: 'Invalid credentials' });
}

// Data file utilities
const dataFile = path.join(__dirname, 'data', 'products.json');
function loadData() {
  try {
    if (!fs.existsSync(dataFile)) {
      return { categories: [], products: [], removedProducts: [], removedCategories: [] };
    }
    const d = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    // ensure defaults
    if (!Array.isArray(d.removedProducts)) d.removedProducts = [];
    if (!Array.isArray(d.removedCategories)) d.removedCategories = [];
    if (!Array.isArray(d.categories)) d.categories = [];
    if (!Array.isArray(d.products)) d.products = [];
    return d;
  } catch (e) {
    console.error('Failed to load data file', e);
    return { categories: [], products: [], removedProducts: [], removedCategories: [] };
  }
}
function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Failed to save data file', e);
  }
}

// Load static seed products (from public assets)
const staticSeedPath = path.join(__dirname, 'data', 'static_products.json');
function loadStaticProducts() {
  try {
    if (fs.existsSync(staticSeedPath)) {
      const j = JSON.parse(fs.readFileSync(staticSeedPath, 'utf8'));
      return Array.isArray(j.products) ? j.products : [];
    }
  } catch (e) {
    console.warn('Failed to load static products seed', e);
  }
  return [];
}

// Products retrieval (merge static + dynamic)
app.get('/api/products', (req, res) => {
  const data = loadData();
  const staticProducts = loadStaticProducts();
  // Merge by id, dynamic overwrites static
  const map = new Map();
  staticProducts.forEach(p => map.set(p.id, p));
  (data.products || []).forEach(p => map.set(p.id, p));
  // Apply tombstones/removed filters
  const removedIds = new Set(data.removedProducts || []);
  const removedCats = new Set(data.removedCategories || []);
  let merged = Array.from(map.values()).filter(p => !removedIds.has(p.id) && !removedCats.has(p.category));
  // Categories list excludes removed categories and normalizes section
  const cats = (data.categories || [])
    .filter(c => !removedCats.has(c.id))
    .map(c => {
      let sec = (c.section || '').toString().toLowerCase();
      if (sec === 'stainless steel' || sec === 'steel' || sec === 'stainless-steel') sec = 'stainless';
      if (sec !== 'stainless' && sec !== 'silver') sec = 'silver';
      return { ...c, section: sec };
    });
  res.json({ ok: true, categories: cats, products: merged });
});

// Add category endpoint
app.post('/api/add-category', adminAuth, (req, res) => {
  try {
    const { id, name, description, section } = req.body || {};
    if (!id || !name) return res.status(400).json({ error: 'id and name are required' });
    const safeId = id.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const data = loadData();
    if (data.categories.find(c => c.id === safeId)) return res.status(409).json({ error: 'Category already exists' });
    // normalize section to two fixed values
    let sec = (section || '').toString().toLowerCase().trim();
    if (sec === 'stainless steel' || sec === 'steel' || sec === 'stainless-steel') sec = 'stainless';
    if (sec !== 'stainless' && sec !== 'silver') sec = 'silver';
    data.categories.push({ id: safeId, name, description: description || '', section: sec });
    saveData(data);
    return res.json({ ok: true, category: { id: safeId, name, description: description || '', section: sec } });
  } catch (err) {
    console.error('Add category error', err);
    return res.status(500).json({ error: 'Failed to add category' });
  }
});

// Add product endpoint (multipart)
// Fields: title, price, category, desc, images[]
app.post('/api/add-product', adminAuth, upload.array('images', 8), (req, res) => {
  try {
    const { title, price, category, desc } = req.body;
    if (!title || !price || !category) return res.status(400).json({ error: 'title, price, category required' });
    const data = loadData();
    const cat = data.categories.find(c => c.id === category);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    const files = (req.files || []).map(f => path.relative(path.join(__dirname, 'public'), f.path).replace(/\\/g,'/'));
    const id = (title.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,40) + '_' + Date.now()).replace(/__+/g,'_');
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) return res.status(400).json({ error: 'Invalid price' });
    const product = { id, title, price: priceNum, category, images: files, desc: desc || '' };
    data.products.push(product);
    saveData(data);
    return res.json({ ok: true, product });
  } catch (err) {
    console.error('Add product error', err);
    return res.status(500).json({ error: 'Failed to add product' });
  }
});

// Helper to ensure a path is inside uploads root
function isPathInsideUploads(p) {
  const full = path.resolve(p);
  const root = path.resolve(uploadsRoot);
  return full.startsWith(root + path.sep);
}

// Delete a product by id (and its images under uploads)
app.delete('/api/product/:id', adminAuth, (req, res) => {
  try {
    const data = loadData();
    const id = req.params.id;
    const idx = data.products.findIndex(p => p.id === id);
    if (idx === -1) {
      // Might be a static product: mark as removed
      if (!data.removedProducts.includes(id)) data.removedProducts.push(id);
      saveData(data);
      return res.json({ ok: true, tombstoned: true });
    }
    const prod = data.products[idx];
    // Delete images if under uploads
    (prod.images || []).forEach(rel => {
      try {
        const abs = path.join(__dirname, 'public', rel);
        if (isPathInsideUploads(abs) && fs.existsSync(abs)) fs.unlinkSync(abs);
      } catch {}
    });
    data.products.splice(idx, 1);
    saveData(data);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Delete product error', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Edit a product (title, price, desc) and optionally replace/append images
// Accepts multipart/form-data with fields: title?, price?, desc?, replaceImages? ("true"/"1"), images[]
app.patch('/api/product/:id', adminAuth, upload.array('images', 8), (req, res) => {
  try {
    const data = loadData();
    const id = req.params.id;
    let prod = data.products.find(p => p.id === id);
    // If editing a static product for the first time, create a dynamic override copy
    if (!prod) {
      const staticProd = loadStaticProducts().find(p => p.id === id);
      if (!staticProd) return res.status(404).json({ error: 'Product not found' });
      prod = { ...staticProd };
      data.products.push(prod);
    }
    const { title, price, desc, replaceImages } = req.body;
    if (title) prod.title = title;
    if (typeof desc !== 'undefined') prod.desc = desc;
    if (typeof price !== 'undefined') {
      const n = parseFloat(price);
      if (isNaN(n) || n < 0) return res.status(400).json({ error: 'Invalid price' });
      prod.price = n;
    }
    const newFiles = (req.files || []).map(f => path.relative(path.join(__dirname, 'public'), f.path).replace(/\\/g,'/'));
    const doReplace = (replaceImages === 'true' || replaceImages === '1' || replaceImages === true);
    if (newFiles.length) {
      if (doReplace) {
        // delete old images under uploads
        (prod.images || []).forEach(rel => {
          try {
            const abs = path.join(__dirname, 'public', rel);
            if (isPathInsideUploads(abs) && fs.existsSync(abs)) fs.unlinkSync(abs);
          } catch {}
        });
        prod.images = newFiles;
      } else {
        // append
        prod.images = Array.from(new Set([...(prod.images || []), ...newFiles]));
      }
    } else if (doReplace) {
      // Replace with nothing -> clear images and delete old ones
      (prod.images || []).forEach(rel => {
        try {
          const abs = path.join(__dirname, 'public', rel);
          if (isPathInsideUploads(abs) && fs.existsSync(abs)) fs.unlinkSync(abs);
        } catch {}
      });
      prod.images = [];
    }
    saveData(data);
    return res.json({ ok: true, product: prod });
  } catch (err) {
    console.error('Edit product error', err);
    return res.status(500).json({ error: 'Failed to edit product' });
  }
});

// Delete category by id, cascade delete its products and images, and remove uploads folder
app.delete('/api/category/:id', adminAuth, (req, res) => {
  try {
    const data = loadData();
    const id = (req.params.id || '').toLowerCase();
    const catIdx = data.categories.findIndex(c => c.id === id);
    // If not in dynamic categories, it may be a static-only category: tombstone it
    if (catIdx === -1) {
      if (!data.removedCategories.includes(id)) data.removedCategories.push(id);
    } else {
      // Remove category
      data.categories.splice(catIdx, 1);
    }
    // Collect products to delete
    const toDelete = data.products.filter(p => p.category === id);
    // Delete images of those products
    toDelete.forEach(prod => {
      (prod.images || []).forEach(rel => {
        try {
          const abs = path.join(__dirname, 'public', rel);
          if (isPathInsideUploads(abs) && fs.existsSync(abs)) fs.unlinkSync(abs);
        } catch {}
      });
    });
    // Remove products
    data.products = data.products.filter(p => p.category !== id);
    // Tombstone all static products of this category
    const staticProducts = loadStaticProducts().filter(p => p.category === id);
    staticProducts.forEach(p => { if (!data.removedProducts.includes(p.id)) data.removedProducts.push(p.id); });
    saveData(data);
    // Remove uploads directory for the category
    try {
      const dir = path.join(uploadsRoot, id);
      if (isPathInsideUploads(dir) && fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    } catch {}
    return res.json({ ok: true, deletedProducts: toDelete.length, tombstoned: true });
  } catch (err) {
    console.error('Delete category error', err);
    return res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Create transporter with Gmail and Outlook fallback for Railway reliability
let transporter;

try {
  // Try Gmail first (simplified config)
  transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
} catch (err) {
  console.log('Gmail config failed, using fallback');
}

// Fallback: If you have outlook credentials
if (!transporter && process.env.OUTLOOK_USER && process.env.OUTLOOK_PASS) {
  transporter = nodemailer.createTransport({
    service: 'Outlook365',
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

// Email retry helper for Railway/Cloud reliability
async function sendEmailWithRetry(mailOptions, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.error(`Email attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, attempt * 2000));
    }
  }
}

// Health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });

    const mailOptions = {
      from: `"Website Contact" <${process.env.SMTP_USER}>`,
      to: STORE_OWNER_EMAIL,
      replyTo: email,
      subject: `Contact message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    };

    await sendEmailWithRetry(mailOptions);
    return res.json({ ok: true, message: 'Message sent' });
  } catch (err) {
    console.error('Contact error', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// Order endpoint
app.post('/api/order', async (req, res) => {
  try {
  const { customer, items, total, paymentType, shipping = 80 } = req.body;
  // Generate simple order reference (timestamp + random)
  const orderRef = 'SJ-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2,4).toUpperCase();
    if (!customer || !customer.email || !items || !Array.isArray(items) || !paymentType)
      return res.status(400).json({ error: 'Missing order fields' });

    // Escape helper to avoid HTML injection in textual sections
    const esc = (v) => (v || '').toString().replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

    // Build table rows for items
    const itemsRows = items.map(i => {
      const imgCell = i.img ? `<td style='padding:8px 12px;vertical-align:middle;'><img src='cid:${i.img}' alt='${esc(i.title)}' style='width:60px;height:60px;object-fit:contain;border-radius:8px;background:#fffbe9;border:1px solid #f1d9a6;'/></td>` : `<td style='padding:8px 12px;vertical-align:middle;'></td>`;
      return `
        <tr style='background:#fff;'>
          ${imgCell}
          <td style='padding:8px 12px;font-weight:600;color:#7c4d00;'>${esc(i.title)}</td>
          <td style='padding:8px 12px;text-align:center;color:#7c4d00;'>${i.qty}</td>
          <td style='padding:8px 12px;text-align:right;color:#7c4d00;'>${i.price} EGP</td>
        </tr>`;
    }).join('');

    const paymentLabel = paymentType === 'COD' ? 'Cash On Delivery' : 'Instapay (Paid)';
    const summaryHtml = `
      <table style='width:100%;border-collapse:collapse;margin-top:8px;font-size:0.9rem;'>
        <thead>
          <tr style='background:#fdf2d6;'>
            <th style='padding:10px 12px;text-align:left;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Item</th>
            <th style='padding:10px 12px;text-align:left;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Title</th>
            <th style='padding:10px 12px;text-align:center;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Qty</th>
            <th style='padding:10px 12px;text-align:right;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Price</th>
          </tr>
        </thead>
        <tbody>${itemsRows}</tbody>
      </table>
      <div style='margin-top:16px;padding:14px 18px;background:#fffbe9;border:1px solid #f1d9a6;border-radius:14px;'>
        <div style='display:flex;justify-content:space-between;margin-bottom:6px;font-weight:600;color:#7c4d00;'><span style='padding-right:12px;'>Subtotal</span><span style='margin-left:12px;'>${(total - shipping).toFixed(2)} EGP</span></div>
        <div style='display:flex;justify-content:space-between;margin-bottom:6px;font-weight:600;color:#7c4d00;'><span style='padding-right:12px;'>Shipping</span><span style='margin-left:12px;'>${shipping.toFixed(2)} EGP</span></div>
        <div style='height:1px;background:#e8c980;margin:10px 0;'></div>
        <div style='display:flex;justify-content:space-between;font-weight:800;color:#a97a2f;font-size:1.05rem;'><span style='padding-right:12px;'>Total</span><span style='margin-left:12px;'>${total.toFixed(2)} EGP</span></div>
        <div style='margin-top:10px;font-size:0.8rem;color:#7c4d00;'><strong>Payment:</strong> ${paymentLabel}</div>
      </div>`;

    // Owner email
    let ownerHtml = `
      <div style='text-align:center;margin-bottom:18px;'>
        <img src='cid:logoimg' alt='Logo' style='height:96px;width:auto;border-radius:24px;'>
      </div>
      <h2 style='color:#a97a2f;margin:0 0 6px;font-size:1.4rem;'>New Order Received</h2>
      <div style='font-size:0.9rem;color:#7c4d00;margin-bottom:14px;'>Order Reference: <strong>${orderRef}</strong></div>
      <div style='background:#fffbe9;border:1px solid #f1d9a6;border-radius:14px;padding:14px 18px;margin-bottom:18px;'>
        <div style='font-weight:700;color:#a97a2f;margin-bottom:8px;'>Customer Details</div>
        <div style='font-size:0.85rem;line-height:1.5;color:#7c4d00;'>
          <strong>Name:</strong> ${esc(customer.name)}<br>
          <strong>Email:</strong> ${esc(customer.email)}<br>
          <strong>Phone:</strong> ${esc(customer.phone || 'N/A')}<br>
          <strong>Address:</strong> ${esc(customer.address || 'N/A')}<br>
          <strong>City:</strong> ${esc(customer.city || 'N/A')}<br>
          <strong>Governorate:</strong> ${esc(customer.governorate || 'N/A')}
        </div>
      </div>
      <div style='font-weight:700;color:#a97a2f;margin-bottom:8px;'>Items</div>
      ${summaryHtml}
      <div style='margin-top:18px;font-size:0.75rem;color:#9c6d16;'>Generated automatically • ${new Date().toLocaleString()}</div>`;

    let instapayConfirmId;
    if (paymentType === 'Instapay') {
      instapayConfirmId = Math.random().toString(36).substr(2, 12);
      ownerHtml += `<div style='margin-top:24px;'><a href='${process.env.BASE_URL || 'http://localhost:' + PORT}/api/confirm-payment?id=${instapayConfirmId}&email=${encodeURIComponent(customer.email)}' style='background:#4bb543;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700;'>Confirm Instapay Payment</a></div>`;
    }

    const ownerMail = {
      from: `"Order Notification" <${process.env.SMTP_USER}>`,
      to: STORE_OWNER_EMAIL,
      subject: `New order from ${customer.name} (${customer.email})`,
      html: ownerHtml,
      attachments: [
        ...items.filter(i => i.img).map(i => ({
          filename: i.img.split('/').pop(),
          path: require('path').join(__dirname, 'public', i.img),
          cid: i.img
        })),
          {
            filename: 'shine-jewelry.png',
            path: require('path').join(__dirname, 'public', 'assets/Logo/shine-jewelry.png'),
            cid: 'logoimg'
          }
      ]
    };

    // Customer email
    const customerItemsHtmlRows = items.map((i, idx) => {
      const cid = i.img ? `customer_${idx}_${i.img.replace(/[^a-zA-Z0-9]/g, '')}` : '';
      const imgCell = i.img ? `<td style='padding:8px 12px;vertical-align:middle;'><img src='cid:${cid}' alt='${esc(i.title)}' style='width:60px;height:60px;object-fit:contain;border-radius:8px;background:#fffbe9;border:1px solid #f1d9a6;' onerror="this.style.display='none'"/></td>` : `<td style='padding:8px 12px;'></td>`;
      return `<tr style='background:#fff;'>${imgCell}<td style='padding:8px 12px;font-weight:600;color:#7c4d00;'>${esc(i.title)}</td><td style='padding:8px 12px;text-align:center;color:#7c4d00;'>${i.qty}</td><td style='padding:8px 12px;text-align:right;color:#7c4d00;'>${i.price} EGP</td></tr>`;
    }).join('');
    const customerAttachments = items.filter(i => i.img).map((i, idx) => ({
      filename: i.img.split('/').pop(),
      path: require('path').join(__dirname, 'public', i.img),
      cid: `customer_${idx}_${i.img.replace(/[^a-zA-Z0-9]/g, '')}`
    }));
    const customerMail = {
      from: `"Shine Jewelry" <${process.env.SMTP_USER}>`,
      to: customer.email,
      subject: `Order confirmation - Shine Jewelry`,
      html: `
        <div style='text-align:center;margin-bottom:18px;'>
          <img src='cid:logoimg' alt='Logo' style='height:96px;width:auto;border-radius:24px;'>
        </div>
        <h2 style='color:#a97a2f;margin:0 0 6px;font-size:1.5rem;'>Order Confirmed</h2>
        <p style='font-size:0.95rem;color:#7c4d00;line-height:1.55;margin:0 0 14px;'>Hi ${esc(customer.name)},<br><br>
        Thank you for shopping with <strong>Shine Jewelry</strong>. Your order has been <strong>successfully received</strong> and is now being prepared. Estimated delivery: <strong>3–4 business days</strong>.<br><br>
        Below is a summary of your order (<strong>Reference:</strong> ${orderRef}).</p>
        <div style='background:#fffbe9;border:1px solid #f1d9a6;border-radius:14px;padding:14px 18px;margin-bottom:16px;'>
          <div style='font-weight:700;color:#a97a2f;margin-bottom:8px;'>Your Details</div>
          <div style='font-size:0.85rem;line-height:1.5;color:#7c4d00;'>
            <strong>Name:</strong> ${esc(customer.name)}<br>
            <strong>Email:</strong> ${esc(customer.email)}<br>
            <strong>Phone:</strong> ${esc(customer.phone || 'N/A')}<br>
            <strong>Address:</strong> ${esc(customer.address || 'N/A')}<br>
            <strong>City:</strong> ${esc(customer.city || 'N/A')}<br>
            <strong>Governorate:</strong> ${esc(customer.governorate || 'N/A')}<br>
            <strong>Payment:</strong> ${paymentLabel}
          </div>
        </div>
        <table style='width:100%;border-collapse:collapse;margin-top:8px;font-size:0.9rem;'>
          <thead>
            <tr style='background:#fdf2d6;'>
              <th style='padding:10px 12px;text-align:left;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Item</th>
              <th style='padding:10px 12px;text-align:left;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Title</th>
              <th style='padding:10px 12px;text-align:center;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Qty</th>
              <th style='padding:10px 12px;text-align:right;font-size:0.75rem;letter-spacing:1px;text-transform:uppercase;color:#a97a2f;border-bottom:2px solid #e8c980;'>Price</th>
            </tr>
          </thead>
          <tbody>${customerItemsHtmlRows}</tbody>
        </table>
        <div style='margin-top:16px;padding:14px 18px;background:#fffbe9;border:1px solid #f1d9a6;border-radius:14px;'>
          <div style='display:flex;justify-content:space-between;margin-bottom:6px;font-weight:600;color:#7c4d00;'><span style='padding-right:12px;'>Subtotal</span><span style='margin-left:12px;'>${(total - shipping).toFixed(2)} EGP</span></div>
          <div style='display:flex;justify-content:space-between;margin-bottom:6px;font-weight:600;color:#7c4d00;'><span style='padding-right:12px;'>Shipping</span><span style='margin-left:12px;'>${shipping.toFixed(2)} EGP</span></div>
          <div style='height:1px;background:#e8c980;margin:10px 0;'></div>
          <div style='display:flex;justify-content:space-between;font-weight:800;color:#a97a2f;font-size:1.05rem;'><span style='padding-right:12px;'>Total</span><span style='margin-left:12px;'>${total.toFixed(2)} EGP</span></div>
        </div>
        <p style='font-size:0.82rem;line-height:1.55;color:#7c4d00;margin:18px 0 8px;'>If you have any questions, problems, or feedback, please send us a message using the contact form on our website and we will get back to you shortly.<br><br>
        Warm regards,<br>— Shine Jewelry Team</p>
        <div style='margin-top:10px;font-size:0.7rem;color:#b08844;text-align:center;'>This email was generated automatically. Please do not reply directly.</div>
      `,
      attachments: [
        ...customerAttachments,
          {
            filename: 'shine-jewelry.png',
            path: require('path').join(__dirname, 'public', 'assets/Logo/shine-jewelry.png'),
            cid: 'logoimg'
          }
      ]
    };

    // COD
    if (paymentType === 'COD') {
      await sendEmailWithRetry(ownerMail);
      await sendEmailWithRetry(customerMail);
      return res.json({ ok: true, message: 'Order placed and emails sent' });
    }

    if (paymentType === 'Instapay') {
      if (!global.instapayPending) global.instapayPending = {};
      global.instapayPending[instapayConfirmId] = customerMail;

      await sendEmailWithRetry(ownerMail);
      return res.json({ ok: true, message: 'Order placed, owner must confirm payment' });
    }

    return res.status(400).json({ error: 'Unknown payment type' });
  } catch (err) {
    console.error('Order error', err);
    return res.status(500).json({ error: 'Failed to place order' });
  }
});

// Endpoint for owner to confirm Instapay payment
app.get('/api/confirm-payment', async (req, res) => {
  const { id, email, confirm } = req.query;
  if (!id || !email) return res.status(400).send('Missing parameters');
  if (!global.instapayPending || !global.instapayPending[id]) return res.status(404).send('No pending confirmation');

  if (confirm === 'true') {
    const mail = global.instapayPending[id];
    try {
      await sendEmailWithRetry(mail);
      delete global.instapayPending[id];
      return res.send('<h2>Instapay payment confirmed!</h2><p>The customer will now receive their confirmation email.</p>');
    } catch (err) {
      return res.status(500).send('Failed to send confirmation email');
    }
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Confirm Instapay Payment</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #fffbe9; color: #7c4d00; display: flex; align-items: center; justify-content: center; height: 100vh; }
        .confirm-box { background: #fff; padding: 32px 36px; border-radius: 18px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); text-align: center; min-width: 320px; }
        .confirm-btn { background: #4bb543; color: #fff; border: 0; padding: 10px 18px; border-radius: 10px; font-weight: 700; font-size: 1rem; margin-top: 18px; cursor: pointer; }
        .details { margin-bottom: 18px; font-size: 1.08em; }
        label { display: flex; align-items: center; gap: 10px; justify-content: center; font-size: 1.1rem; margin-bottom: 18px; }
      </style>
    </head>
    <body>
      <div class="confirm-box">
        <h2 style="color:#a97a2f;margin-bottom:12px;">Confirm Instapay Payment</h2>
        <div class="details">
          <strong>Customer Email:</strong> ${email}<br>
          <strong>Order ID:</strong> ${id}
        </div>
        <form method="GET" action="/api/confirm-payment">
          <input type="hidden" name="id" value="${id}">
          <input type="hidden" name="email" value="${email}">
          <input type="hidden" name="confirm" value="true">
          <label>
            <input type="checkbox" name="owner_confirmed" id="owner_confirmed" style="width:22px;height:22px;">
            I confirm the money has been received
          </label><br>
          <button type="submit" class="confirm-btn" id="confirmBtn" disabled>Confirm</button>
        </form>
      </div>
      <script>
        const cb = document.getElementById('owner_confirmed');
        const btn = document.getElementById('confirmBtn');
        cb.addEventListener('change', function() { btn.disabled = !cb.checked; });
      </script>
    </body>
    </html>
  `);
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
