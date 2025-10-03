// --- Smooth scroll for nav links ---
document.addEventListener('DOMContentLoaded', () => {
  // Nav hover logic: highlight only hovered link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('mouseenter', function() {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('nav-hover'));
      this.classList.add('nav-hover');
    });
    link.addEventListener('mouseleave', function() {
      this.classList.remove('nav-hover');
    });
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href.startsWith('#')) {
        let target;
        if (href === '#home') {
          const mainCarousel = document.getElementById('main-carousel');
          e.preventDefault();
          if (mainCarousel) {
            const rect = mainCarousel.getBoundingClientRect();
            if (rect.top <= 80 && rect.bottom > 80) {
              mainCarousel.classList.remove('vibrate-section');
              void mainCarousel.offsetWidth;
              mainCarousel.classList.add('vibrate-section');
              setTimeout(() => mainCarousel.classList.remove('vibrate-section'), 400);
            } else {
              mainCarousel.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          this.classList.add('active');
        } else if (href === '#about-contact') {
          const aboutCard = document.querySelector('.about-card');
          const contactCard = document.querySelector('.contact-card');
          e.preventDefault();
          const aboutSection = document.getElementById('about');
          const aboutSectionRect = aboutSection ? aboutSection.getBoundingClientRect() : {top:0,bottom:0};
          const navHeight = 80;
          // Always vibrate About & Contact when button is clicked and section is in view
          if (aboutSectionRect.top <= navHeight && aboutSectionRect.bottom > navHeight) {
            [aboutCard, contactCard].forEach(card => {
              if (card) {
                card.classList.remove('vibrate-section');
                void card.offsetWidth;
                card.classList.add('vibrate-section');
                setTimeout(() => card.classList.remove('vibrate-section'), 400);
              }
            });
          }
          // Always scroll to About section top if not in view
          if (!(aboutSectionRect.top <= navHeight && aboutSectionRect.bottom > navHeight)) {
            aboutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          this.classList.add('active');
        } else if (href === '#shop') {
          const shopSec = document.getElementById('shop');
          e.preventDefault();
          // Always scroll to top of Shop section
          shopSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
          this.classList.add('active');
        } else {
          target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            // Check if already in view
            const rect = target.getBoundingClientRect();
            if (rect.top <= 80 && rect.bottom > 80) {
              // Vibrate animation
              target.classList.remove('vibrate-section');
              void target.offsetWidth;
              target.classList.add('vibrate-section');
              setTimeout(() => target.classList.remove('vibrate-section'), 400);
            } else {
              target.scrollIntoView({ behavior: 'smooth' });
            }
            // Force highlight after click
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
          }
        }
      }
    });
    link.addEventListener('mouseenter', function() {
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('nav-hover'));
      this.classList.add('nav-hover');
    });
    link.addEventListener('mouseleave', function() {
      this.classList.remove('nav-hover');
    });
  });

  // Section highlight logic for merged About & Contact
  // Improved nav highlight: always match section in view
  const navLinks = [
    document.querySelector('a[href="#home"]'),
    document.querySelector('a[href="#shop"]'),
    document.querySelector('a[href="#about-contact"]')
  ];
  function updateActiveNav() {
    const scrollY = window.scrollY || window.pageYOffset;
    const navHeight = 80;
    const mainCarousel = document.getElementById('main-carousel');
    const shopSec = document.getElementById('shop');
    const aboutSec = document.getElementById('about');
    let activeIdx = 0;
    // Use bounding rect for About section
    const aboutRect = aboutSec.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    // If any part of About section is visible, highlight About & Contact
    if (aboutRect.top < windowHeight && aboutRect.bottom > 0) {
      activeIdx = 2;
    } else if (scrollY + navHeight < shopSec.offsetTop) {
      activeIdx = 0;
    } else {
      activeIdx = 1;
    }
    if (!document.querySelector('.nav-link.nav-hover')) {
      navLinks.forEach((l, idx) => l && l.classList.toggle('active', idx === activeIdx));
    }
  }
  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();
});
// app.js - frontend logic
// --- Loops Carousel for Home Card ---
document.addEventListener('DOMContentLoaded', function() {
  const loopsImages = [
    'assets/Loops/loop.jpg',
    'assets/Loops/loop(1).jpg',
    'assets/Loops/loop(2).jpg',
    'assets/Loops/loop copy.jpg',
    'assets/Loops/loop(1) copy.jpg',
    'assets/Loops/loop(2) copy.jpg'
  ];
  let loopsIdx = 0;
  const loopsImgEl = document.getElementById('loops-carousel-img');
  if (loopsImgEl) {
    setInterval(() => {
      loopsIdx = (loopsIdx + 1) % loopsImages.length;
      loopsImgEl.style.opacity = 0;
      setTimeout(() => {
        loopsImgEl.src = loopsImages[loopsIdx];
        loopsImgEl.style.opacity = 1;
      }, 400);
    }, 3000);
  }
});

// --- Products data (each product has images array) ---
// --- About Shine Jewelry letter-by-letter animation ---
const aboutText = "We craft timeless pieces with careful attention to detail. Each item is selected and photographed to show its true beauty.";
let aboutTimer = null;

function typeAboutText() {
  const el = document.getElementById("about-desc");
  if (!el) return;
  el.textContent = "";
  let i = 0;
  clearInterval(aboutTimer);
  aboutTimer = setInterval(() => {
    el.textContent = aboutText.slice(0, i);
    i++;
    if (i > aboutText.length) {
      clearInterval(aboutTimer);
    }
  }, 32);
}

function handleAboutSection() {
  if (window.location.hash === "#about" || document.getElementById("about-desc")) {
    typeAboutText();
  }
}

window.addEventListener("hashchange", () => {
  if (window.location.hash === "#about") {
    typeAboutText();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("about-desc")) {
    typeAboutText();
  }
});
// Base (static) products loaded in page (cleared; admin will add new ones)
const STATIC_PRODUCTS = [];
// Will hold combined list (static + dynamic from server)
let PRODUCTS = STATIC_PRODUCTS.slice();

// Dynamic load from server (categories & products added by admin)
async function loadDynamicProducts() {
  try {
    const resp = await fetch('/api/products');
    if (!resp.ok) return; // fail silently
    const data = await resp.json();
    if (!data || !data.ok) return;
    // Merge: Avoid ID collisions (if collision, keep dynamic overwriting static)
    const map = new Map();
    STATIC_PRODUCTS.forEach(p => map.set(p.id, p));
    (data.products || []).forEach(p => map.set(p.id, p));
    PRODUCTS = Array.from(map.values());
    // Populate legacy select with sections and categories
    window.SJ_CATEGORIES = Array.isArray(data.categories) ? data.categories.slice() : [];
    // Build custom dropdown with collapsible sections
    const dd = document.getElementById('filter-dropdown');
    if (dd) buildCollapsibleFilter(dd, window.SJ_CATEGORIES);
    renderProducts('all');
  } catch (e) {
    console.warn('Dynamic products load failed', e);
  }
}


// --- Utilities / Cart ---
function getCart() {
  try { return JSON.parse(localStorage.getItem('sj_cart') || '[]'); }
  catch { return []; }
}
function saveCart(cart){ localStorage.setItem('sj_cart', JSON.stringify(cart)); }
function updateCartCount(){
  const count = getCart().reduce((s,i)=>s+i.qty,0);
  const el = document.getElementById('cart-count');
  const top = document.getElementById('cart-count-top');
  if (el) el.textContent = count;
  if (top) top.textContent = count;
}


// --- Render products ---
function renderProducts(filter = 'all') {
  const container = document.getElementById('products');
  if (!container) return;
  container.innerHTML = '';
  let list = PRODUCTS.slice();
  if (filter !== 'all') list = list.filter(p => p.category === filter);

  // Show friendly placeholder when no products
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-products-card';
    empty.innerHTML = `
      <div class="empty-products-inner">
        <div class="empty-icon">🛍️</div>
        <div class="empty-title">No products yet</div>
        <div class="empty-sub">Please check back soon.</div>
      </div>`;
    container.appendChild(empty);
    return;
  }

  // Vertically scrollable grid, show all products
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    const cover = (p.images && p.images[0]) ? p.images[0] : 'assets/Loops/loop.jpg';
    card.innerHTML = `
      <img src="${cover}" alt="${escapeHtml(p.title)}" loading="lazy" />
      <div class="card-body">
        <div class="card-title">${escapeHtml(p.title)}</div>
        <div class="card-meta">
          <div class="price">${p.price} EGP</div>
        </div>
      </div>
    `;
    card.addEventListener('click', (e) => {
      openProductModal(p.id);
    });
    container.appendChild(card);
  });

}

// --- open modal with gallery ---
let currentModalIndex = 0;
let modalImages = [];
let activeProduct = null;

function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  activeProduct = product;
  modalImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  currentModalIndex = 0;
  document.getElementById('modal-img').src = modalImages[0] || 'assets/Loops/loop.jpg';
  document.getElementById('modal-title').textContent = product.title;
  document.getElementById('modal-price').textContent = `${product.price} EGP`;
  document.getElementById('modal-desc').textContent = product.desc;
  document.getElementById('overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// navigate images in modal
function nextModalImage(){
  if (!modalImages.length) return;
  currentModalIndex = (currentModalIndex + 1) % modalImages.length;
  document.getElementById('modal-img').src = modalImages[currentModalIndex];
}
function prevModalImage(){
  if (!modalImages.length) return;
  currentModalIndex = (currentModalIndex - 1 + modalImages.length) % modalImages.length;
  document.getElementById('modal-img').src = modalImages[currentModalIndex];
}
function closeModal(){
  document.getElementById('overlay').classList.remove('active');
  document.body.style.overflow = '';
  activeProduct = null;
}

// add product (from modal) to cart
function addActiveToCart(){
  if (!activeProduct) return;
  const cart = getCart();
  const existing = cart.find(i=>i.id === activeProduct.id);
  if (existing) existing.qty += 1;
  else cart.push({ id: activeProduct.id, qty: 1, title: activeProduct.title, price: activeProduct.price, img: activeProduct.images[0]});
  saveCart(cart);
  updateCartCount();
  closeModal();
  showToast('Added to cart');
}

// --- Cart page render (cart.html & navbar count) ---
function renderCartPageIfNeeded(){
  const cartList = document.getElementById('cart-list');
  if (!cartList) return;
  const cart = getCart();
  console.log('Cart contents:', cart);
  cartList.innerHTML = '';
    if (cart.length === 0){
      cartList.innerHTML = `<div class="cart-empty-message">
        <span style="font-size:1.15rem;font-weight:600;color:#a97a2f;">🛒 Your cart is empty!</span><br>
  <span class="cart-empty-phrase" style="color:#3a2c13;font-size:1.05rem;font-weight:700;">Looks like you haven't added <span style="white-space:nowrap">anything yet.</span></span><br>
        <a href="index.html#shop" class="browse-products-btn" style="margin-top:10px;">Browse products</a>
      </div>`;
    updateTotals();
    return;
  }
  cart.forEach((item, idx) => {
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img src="${item.img}" alt="${escapeHtml(item.title)}" />
      <div class="meta">
        <div><strong>${escapeHtml(item.title)}</strong></div>
        <div>${item.price} EGP × <span class="qty">${item.qty}</span></div>
      </div>
      <div class="controls">
        <button class="btn-ghost dec" data-i="${idx}">-</button>
        <button class="btn-ghost inc" data-i="${idx}">+</button>
        <button class="btn-ghost rem" data-i="${idx}">Remove</button>
      </div>
    `;
    cartList.appendChild(el);
  });

  // attach handlers
  cartList.querySelectorAll('.inc').forEach(b=>b.addEventListener('click', (e)=>{
    const i = +b.dataset.i;
    const cart = getCart();
    cart[i].qty += 1;
    saveCart(cart);
    renderCartPageIfNeeded();
    updateCartCount();
  }));
  cartList.querySelectorAll('.dec').forEach(b=>b.addEventListener('click', (e)=>{
    const i = +b.dataset.i;
    const cart = getCart();
    cart[i].qty = Math.max(1, cart[i].qty - 1);
    saveCart(cart);
    renderCartPageIfNeeded();
    updateCartCount();
  }));
  cartList.querySelectorAll('.rem').forEach(b=>b.addEventListener('click', (e)=>{
    const i = +b.dataset.i;
    let cart = getCart();
    cart = cart.filter((_,idx)=>idx!==i);
    saveCart(cart);
    renderCartPageIfNeeded();
    updateCartCount();
  }));

  updateTotals();
}
function updateTotals(){
  const cart = getCart();
  const subtotal = cart.reduce((s,i)=>s + i.price * i.qty, 0);
  document.getElementById('subtotal') && (document.getElementById('subtotal').textContent = `${subtotal.toFixed(2)} EGP`);
  const shipping = document.getElementById('shipping') ? 80 : 0;
  document.getElementById('shipping') && (document.getElementById('shipping').textContent = `${shipping.toFixed(2)} EGP`);
  document.getElementById('total') && (document.getElementById('total').textContent = `${(subtotal + shipping).toFixed(2)} EGP`);
}

// --- Contact form submit (index) ---
async function setupContactForm(){
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = document.getElementById('cname').value.trim();
    const email = document.getElementById('cemail').value.trim();
    const message = document.getElementById('cmessage').value.trim();
    try {
      const resp = await fetch('/api/contact', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ name, email, message })
      });
      const data = await resp.json();
      if (resp.ok) {
        form.reset();
        showToast('Message sent. Thank you!');
      } else {
        showToast('Failed to send message: ' + (data.error || 'Unknown'));
      }
    } catch (err) {
      console.error(err); showToast('Network error sending message');
    }
  });
}

// --- Order form submit (cart page) ---
async function setupOrderForm(){
  const form = document.getElementById('order-form');
  if (!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    // Do nothing here, order will be processed after payment confirmation
  });
}

// --- UI small helpers ---
function escapeHtml(str){
  if (!str) return '';
  return str.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
// Smoothly scroll element into view with a sticky-header offset (better on phones)
function smoothScrollIntoView(el, extraOffset){
  if (!el) return;
  const headerEl = document.querySelector('.cart-header-bar') || document.querySelector('.navbar');
  const headerH = (headerEl ? headerEl.offsetHeight : 0) + 12; // small breathing room
  const offset = (typeof extraOffset === 'number' ? extraOffset : 0) + headerH;
  const rect = el.getBoundingClientRect();
  const top = rect.top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}
function showToast(msg){
  // Unified inline validation tooltip near the first empty required field
  const requiredIds = ['cust-name','cust-email','cust-phone','cust-address','cust-city'];
  let targetInput = null;
  for (const id of requiredIds){
    const el = document.getElementById(id);
    if (el && !el.value.trim()) { targetInput = el; break; }
  }
  const t = document.createElement('div');
  t.className = 'inline-warning-tooltip';
  t.textContent = msg;
  // Ensure style only added once
  if (!document.getElementById('inline-warning-style')){
    const style = document.createElement('style');
    style.id = 'inline-warning-style';
    style.textContent = `
      .inline-warning-tooltip { position:absolute; background:#fffbe9; color:#7c4d00; border:1px solid #e0b96a; box-shadow:0 4px 16px rgba(180,138,68,0.18); font-weight:600; font-size:0.85rem; padding:8px 12px 8px 10px; border-radius:8px; z-index:9999; max-width:240px; line-height:1.3; display:flex; align-items:flex-start; gap:8px; }
      .inline-warning-tooltip::before { content:'❗'; font-size:1.05rem; line-height:1; }
      .input-invalid-highlight { animation: input-shake 0.42s; border-color:#e53935 !important; box-shadow:0 0 0 3px rgba(229,57,53,0.18) !important; }
      @keyframes input-shake { 0%,100%{transform:translateX(0);} 20%{transform:translateX(-5px);} 40%{transform:translateX(5px);} 60%{transform:translateX(-5px);} 80%{transform:translateX(5px);} }
    `;
    document.head.appendChild(style);
  }
  if (targetInput){
    // Ensure the field is visible (especially on phones)
    smoothScrollIntoView(targetInput);
    // Avoid native scroll jump when focusing
    if (targetInput.focus) targetInput.focus({ preventScroll: true });
    // highlight
    targetInput.classList.add('input-invalid-highlight');
    setTimeout(()=> targetInput.classList.remove('input-invalid-highlight'), 900);
    const rect = targetInput.getBoundingClientRect();
    t.style.left = (rect.right + window.scrollX + 10) + 'px';
    t.style.top = (rect.top + window.scrollY - 4) + 'px';
  } else {
    // fallback center top if somehow none found
    t.style.position = 'fixed';
    t.style.left = '50%';
    t.style.top = '24px';
    t.style.transform = 'translateX(-50%)';
  }
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 2500);
}

// --- Navigation helpers ---
document.addEventListener('click', (ev)=>{
  if (ev.target.matches('#cart-btn') || ev.target.closest('#cart-btn')) {
    const overlay = document.getElementById('fade-overlay');
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.style.opacity = 1;
        setTimeout(() => {
          location.href = 'cart.html';
        }, 400);
      }, 10);
    } else {
      location.href = 'cart.html';
    }
  }
});

// --- Wire modal buttons ---
document.addEventListener('DOMContentLoaded', ()=>{
  // Simple centered carousel logic
  const carouselImages = [
    'assets/first.jpg',
    'assets/second.jpg'
  ];
  let carouselIdx = 0;
  const carouselImg = document.getElementById('carousel-img');
  if (carouselImg) {
    setInterval(() => {
      carouselIdx = (carouselIdx + 1) % carouselImages.length;
      carouselImg.style.opacity = 0;
      setTimeout(() => {
        carouselImg.src = carouselImages[carouselIdx];
        carouselImg.style.opacity = 1;
      }, 400);
    }, 2500);
  }
  // Payment modal logic for cart page
  const placeOrderBtn = document.getElementById('place-order-btn');
  const orderModal = document.getElementById('order-modal');
  const payCashBtn = document.getElementById('pay-cash-btn');
  const payInstapayBtn = document.getElementById('pay-instapay-btn');
  const closeModalBtn = document.getElementById('close-modal-btn');

  if (placeOrderBtn && orderModal) {
      placeOrderBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const name = document.getElementById('cust-name').value.trim();
        const email = document.getElementById('cust-email').value.trim();
        const phone = document.getElementById('cust-phone').value.trim();
        const address = document.getElementById('cust-address') ? document.getElementById('cust-address').value.trim() : '';
        const city = document.getElementById('cust-city') ? document.getElementById('cust-city').value.trim() : '';
        const governorate = document.getElementById('cust-governorate') ? document.getElementById('cust-governorate').value.trim() : '';
        const cart = (typeof getCart === 'function') ? getCart() : [];
        // Basic front-end validation
        // When a field is missing, show inline tooltip + scroll into view
        if (!name) { showToast('Please fill out your full name.'); return; }
        if (!email) { showToast('Please fill out your email.'); return; }
        if (!phone) { showToast('Please fill out your phone.'); return; }
        if (!address) { showToast('Please fill out your address.'); return; }
        if (!city) { showToast('Please fill out your city.'); return; }
        if (!cart || cart.length === 0) {
          // Find cart section
          const cartList = document.getElementById('cart-list');
          if (cartList) {
            smoothScrollIntoView(cartList, 10);
            // Find the default empty message
            const emptyPhrase = cartList.querySelector('.cart-empty-phrase');
            if (emptyPhrase) {
              emptyPhrase.classList.add('cart-empty-error');
              cartList.style.animation = 'vibrate-cart 0.4s';
              setTimeout(() => {
                cartList.style.animation = '';
                emptyPhrase.classList.remove('cart-empty-error');
              }, 400);
              // Add keyframes if not present
              if (!document.getElementById('vibrate-cart-style')) {
                const style = document.createElement('style');
                style.id = 'vibrate-cart-style';
                style.textContent = `@keyframes vibrate-cart { 0% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-6px); } 80% { transform: translateX(6px); } 100% { transform: translateX(0); } }`;
                document.head.appendChild(style);
              }
            }
          }
          return;
        }
        orderModal.style.display = 'flex';
        orderModal.style.alignItems = 'center';
        orderModal.style.justifyContent = 'center';
    document.body.classList.add('modal-open');
      });
  }
  if (closeModalBtn && orderModal) {
    closeModalBtn.addEventListener('click', () => {
      orderModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    });
  }
  if (payInstapayBtn) {
      payInstapayBtn.addEventListener('click', () => {
        // Show Instapay confirmation popup instead of sending email immediately
        orderModal.style.display = 'none';
        document.body.classList.remove('modal-open');
        // Show Instapay confirmation popup (checkbox)
        const instapayPopup = document.getElementById('instapay-confirm-popup');
        if (instapayPopup) {
          instapayPopup.style.display = 'flex';
        }
        // Open Instapay payment link
        window.open('https://ipn.eg/S/rehablasheen/instapay/6cntzD', '_blank');
        // Email will be sent after user confirms in popup
      });
  }
  if (payCashBtn) {
    payCashBtn.addEventListener('click', async () => {
      orderModal.style.display = 'none';
      document.body.classList.remove('modal-open');
      // Send order email only after COD is chosen
      await sendOrderEmail('COD');
    });
// Send order email only after payment confirmation
async function sendOrderEmail() {
  const name = document.getElementById('cust-name').value.trim();
  const email = document.getElementById('cust-email').value.trim();
  const phone = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address') ? document.getElementById('cust-address').value.trim() : '';
  const city = document.getElementById('cust-city') ? document.getElementById('cust-city').value.trim() : '';
  const governorate = document.getElementById('cust-governorate') ? document.getElementById('cust-governorate').value.trim() : '';
  const cart = (typeof getCart === 'function') ? getCart() : [];
  if (!name || !email || !phone || !address || !city || cart.length === 0) return;
  const shipping = 80;
  const total = cart.reduce((s,i)=>s + i.price * i.qty, 0) + shipping;
  // Ensure each item has an img property for email
  const itemsWithImg = cart.map(i => ({ ...i, img: i.img || (i.images && i.images[0]) || '' }));
  const paymentType = arguments[0] || 'Instapay';
  const payload = { customer: { name, email, phone, address, city, governorate }, items: itemsWithImg, total, paymentType, shipping };
  try {
    const resp = await fetch('/api/order', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    if (resp.ok) {
      localStorage.removeItem('sj_cart');
      updateCartCount();
      showToast('Order placed! Check your email for confirmation.');
      // setTimeout(()=> location.href = 'index.html', 1200); // Disabled - modal handles navigation
    } else {
      showToast('Failed to place order: ' + (data.error || 'Unknown'));
    }
  } catch (err) {
    console.error(err); showToast('Network error placing order');
  }
}
// For Instapay, expose sendOrderEmail for cart.html popup
window.sendInstapayOrder = function() { sendOrderEmail('Instapay'); };
  }
  // Hero image slider loop
  const heroSlider = document.getElementById('hero-slider');
  if (heroSlider) {
    const slides = heroSlider.querySelectorAll('.hero-slide');
    let current = 0;
    function showSlide(idx) {
      slides.forEach((img, i) => {
        img.style.opacity = (i === idx) ? '1' : '0';
        img.style.transition = 'opacity 1s';
      });
    }
    function nextSlide() {
      current = (current + 1) % slides.length;
      showSlide(current);
    }
    showSlide(current);
    setInterval(nextSlide, 2500); // Change every 2.5s
  }

  renderProducts('all');
  loadDynamicProducts();
  updateCartCount();
  setupContactForm();
  renderCartPageIfNeeded();
  setupOrderForm();

  // Always update cart count on cart page
  if (document.getElementById('cart-count-top')) {
    updateCartCount();
    renderCartPageIfNeeded();
  }

  // filter select
  // Native select removed per request; custom dropdown handles filtering

  // hero pills
  document.querySelectorAll('.pill').forEach(b=>{
    b.addEventListener('click', ()=> {
      const cat = b.getAttribute('data-cat');
      if (typeof window.SJ_selectFilter === 'function') {
        window.SJ_selectFilter(cat);
      } else {
        renderProducts(cat);
        document.getElementById('shop-title').textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      }
      document.querySelector('#shop').scrollIntoView({behavior:'smooth'});
    });
  });

  // overlay controls
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-close-2').addEventListener('click', closeModal);
  document.getElementById('prev-img').addEventListener('click', (e)=>{ e.stopPropagation(); prevModalImage();});
  document.getElementById('next-img').addEventListener('click', (e)=>{ e.stopPropagation(); nextModalImage();});
  document.getElementById('modal-add').addEventListener('click', addActiveToCart);
  // close overlay when clicking outside modal
  document.getElementById('overlay').addEventListener('click', (e)=>{
    if (e.target.id === 'overlay') closeModal();
  });

  // support arrow keys for modal images
  document.addEventListener('keydown', (e)=>{
    if (!document.getElementById('overlay').classList.contains('active')) return;
    if (e.key === 'ArrowRight') nextModalImage();
    if (e.key === 'ArrowLeft') prevModalImage();
    if (e.key === 'Escape') closeModal();
  });
});

// ---- Select-based filter helpers ----
function capitalize(s){ return (s && s.length) ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
function populateFilterSelect(sel, categories){
  // Clear and add base option
  sel.innerHTML = '';
  const all = document.createElement('option'); all.value = 'all'; all.textContent = 'All categories'; sel.appendChild(all);
  // Normalize sections
  const cats = categories.map(c=>({ id: c.id, name: c.name || capitalize(c.id), section: (c.section==='stainless'||c.section==='silver')?c.section:'silver' }));
  const silver = cats.filter(c=>c.section==='silver');
  const steel = cats.filter(c=>c.section==='stainless');
  const ogSilver = document.createElement('optgroup'); ogSilver.label = 'Silver';
  silver.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; ogSilver.appendChild(o); });
  sel.appendChild(ogSilver);
  const ogSteel = document.createElement('optgroup'); ogSteel.label = 'Stainless Steel';
  steel.forEach(c=>{ const o=document.createElement('option'); o.value=c.id; o.textContent=c.name; ogSteel.appendChild(o); });
  sel.appendChild(ogSteel);
}
// Title update is managed directly in dropdown selection

// Build a custom collapsible dropdown with bold section headers
function buildCollapsibleFilter(container, categories){
  const trigger = container.querySelector('#filter-trigger');
  const menu = container.querySelector('#filter-menu');
  const cats = categories.map(c=>({ id:c.id, name:c.name||capitalize(c.id), section:(c.section==='stainless'||c.section==='silver')?c.section:'silver' }));
  const silver = cats.filter(c=>c.section==='silver');
  const steel = cats.filter(c=>c.section==='stainless');
  let currentVal = 'all';

  function item(label, value, isHeader=false){
    const div = document.createElement('div');
    div.className = isHeader ? 'filter-section' : 'filter-item';
    div.setAttribute('role', isHeader ? 'button' : 'menuitem');
    if (!isHeader) div.dataset.value = value;
    if (isHeader) {
      const txt = document.createElement('span'); txt.textContent = label; txt.className = 'filter-section-title';
      const arrow = document.createElement('span'); arrow.className = 'filter-arrow'; arrow.textContent = '▸';
      div.appendChild(txt); div.appendChild(arrow);
    } else {
      div.textContent = label;
    }
    return div;
  }

  menu.innerHTML = '';
  // All categories
  const itAll = document.createElement('div');
  itAll.className = 'filter-item filter-all'; itAll.dataset.value = 'all'; itAll.textContent = 'All categories';
  menu.appendChild(itAll);

  // Silver block
  const headSilver = item('Silver', '', true);
  const listSilver = document.createElement('div'); listSilver.className = 'filter-sublist'; listSilver.hidden = true;
  silver.forEach(c=> listSilver.appendChild(item(c.name, c.id)));
  menu.appendChild(headSilver); menu.appendChild(listSilver);

  // Stainless block
  const headSteel = item('Stainless Steel', '', true);
  const listSteel = document.createElement('div'); listSteel.className = 'filter-sublist'; listSteel.hidden = true;
  steel.forEach(c=> listSteel.appendChild(item(c.name, c.id)));
  menu.appendChild(headSteel); menu.appendChild(listSteel);

  // Toggle menu open/close
  trigger.addEventListener('click', ()=>{
    const open = menu.hasAttribute('hidden') ? false : true;
    if (open) { menu.setAttribute('hidden',''); container.setAttribute('aria-expanded','false'); }
    else { menu.removeAttribute('hidden'); container.setAttribute('aria-expanded','true'); updateActiveHighlight(); }
  });
  document.addEventListener('click', (e)=>{
    if (!container.contains(e.target)) { menu.setAttribute('hidden',''); container.setAttribute('aria-expanded','false'); }
  });

  // Section header toggles
  headSilver.addEventListener('click', ()=>{ listSilver.hidden = !listSilver.hidden; headSilver.querySelector('.filter-arrow').classList.toggle('open', !listSilver.hidden); });
  headSteel.addEventListener('click', ()=>{ listSteel.hidden = !listSteel.hidden; headSteel.querySelector('.filter-arrow').classList.toggle('open', !listSteel.hidden); });

  // Selection handler
  function selectValue(val, label){
    currentVal = val;
    // If option doesn’t exist yet, fall back to rendering with val
    renderProducts(val);
    const title = document.getElementById('shop-title');
    if (title) title.textContent = (val==='all') ? 'All Products' : label;
    trigger.firstChild.nodeValue = label + ' ';
    updateActiveHighlight();
    menu.setAttribute('hidden',''); container.setAttribute('aria-expanded','false');
  }
  itAll.addEventListener('click', ()=> selectValue('all','All categories'));
  listSilver.querySelectorAll('.filter-item').forEach(di=>{
    di.addEventListener('click', ()=> selectValue(di.dataset.value, di.textContent));
  });
  listSteel.querySelectorAll('.filter-item').forEach(di=>{
    di.addEventListener('click', ()=> selectValue(di.dataset.value, di.textContent));
  });

  // Initialize label
  trigger.firstChild.nodeValue = 'All categories ';

  // Highlight management and auto-expand
  function updateActiveHighlight(){
    // Clear active
    menu.querySelectorAll('.filter-item').forEach(it=> it.classList.remove('active'));
    // Highlight selected
    const target = menu.querySelector(`.filter-item[data-value="${CSS.escape(currentVal)}"]`);
    if (target) target.classList.add('active');
    else menu.querySelector('.filter-all')?.classList.add('active');
    // Expand containing section
    const isSilver = silver.some(c=> c.id === currentVal);
    const isSteel = steel.some(c=> c.id === currentVal);
    if (isSilver) { listSilver.hidden = false; headSilver.querySelector('.filter-arrow').classList.add('open'); }
    if (isSteel) { listSteel.hidden = false; headSteel.querySelector('.filter-arrow').classList.add('open'); }
  }
  // initial state
  updateActiveHighlight();
}

// Expose a helper to select from outside (e.g., hero pills)
window.SJ_selectFilter = function(val){
  const item = document.querySelector(`#filter-menu .filter-item[data-value="${CSS.escape(val)}"]`);
  if (item) { item.click(); return; }
  if (val === 'all') { document.querySelector('#filter-menu .filter-all')?.click(); return; }
  // Fallback: render and update labels
  renderProducts(val);
  const title = document.getElementById('shop-title'); if (title) title.textContent = capitalize(val);
  const trig = document.getElementById('filter-trigger'); if (trig) trig.firstChild.nodeValue = capitalize(val) + ' ';
};
