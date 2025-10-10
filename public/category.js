// category.js - Category detail page functionality
const STATIC_PRODUCTS = [];  // Could be populated if needed

let PRODUCTS = [];
let currentCategory = null;

// Extract category ID from URL
function getCategoryFromURL() {
  const path = window.location.pathname;
  const match = path.match(/^\/category\/([^\/]+)$/);
  return match ? match[1] : null;
}

// --- Utilities / Cart (same as main page) ---
function getCart() {
  try { return JSON.parse(localStorage.getItem('sj_cart') || '[]'); }
  catch { return []; }
}

function saveCart(cart){ localStorage.setItem('sj_cart', JSON.stringify(cart)); }

function updateCartCount(){
  const count = getCart().reduce((s,i)=>s+i.qty,0);
  const el = document.getElementById('cart-count');
  if (el) el.textContent = count;
}

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function capitalize(str) {
  if (typeof str !== 'string' || !str.length) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- Load and render category products ---
async function loadCategoryData() {
  const categoryId = getCategoryFromURL();
  if (!categoryId) {
    window.location.href = '/';
    return;
  }

  try {
    const resp = await fetch('/api/products');
    if (!resp.ok) throw new Error('Failed to load');
    const data = await resp.json();
    
    if (!data || !data.ok) throw new Error('Invalid data');
    
    // Merge products (same logic as main page)
    const map = new Map();
    STATIC_PRODUCTS.forEach(p => map.set(p.id, p));
    (data.products || []).forEach(p => map.set(p.id, p));
    PRODUCTS = Array.from(map.values());
    
    // Find the category
    const categories = Array.isArray(data.categories) ? data.categories : [];
    currentCategory = categories.find(cat => cat.id === categoryId);
    
    if (!currentCategory) {
      // Category not found, redirect to home
      window.location.href = '/';
      return;
    }
    
    // Update page title and category display
    const categoryName = currentCategory.name || capitalize(currentCategory.id);
    document.title = `${categoryName} - Shine Jewelry`;
    document.getElementById('category-title').textContent = categoryName;
    
    // Render products for this category
    renderCategoryProducts(categoryId, categoryName);
    
  } catch (e) {
    console.error('Failed to load category data:', e);
    // Show error message or redirect to home
    document.getElementById('products').innerHTML = `
      <div class="empty-products-card">
        <div class="empty-products-inner">
          <div class="empty-icon">⚠️</div>
          <div class="empty-title">Failed to load category</div>
          <div class="empty-sub"><a href="/">Return to Home</a></div>
        </div>
      </div>`;
  }
}

function renderCategoryProducts(categoryId, categoryName) {
  const container = document.getElementById('products');
  if (!container) return;
  
  container.innerHTML = '';
  
  // Filter products for this category
  const categoryProducts = PRODUCTS.filter(p => p.category === categoryId);
  
  // Update product count
  const countEl = document.getElementById('category-count');
  if (countEl) {
    countEl.textContent = `${categoryProducts.length} item${categoryProducts.length !== 1 ? 's' : ''}`;
  }
  
  // Show products or empty state
  if (!categoryProducts.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-products-card';
    empty.innerHTML = `
      <div class="empty-products-inner">
        <div class="empty-icon">📦</div>
        <div class="empty-title">No products in ${escapeHtml(categoryName)}</div>
        <div class="empty-sub"><a href="/">Browse other categories</a></div>
      </div>`;
    container.appendChild(empty);
    return;
  }
  
  // Render product cards
  categoryProducts.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    let cover = '/assets/Loops/loop.jpg'; // Default image
    if (p.images && p.images.length > 0 && p.images[0]) {
      cover = p.images[0].startsWith('/') ? p.images[0] : `/${p.images[0]}`;
    }
    
    // Check if product has offer (both oldPrice and offerPrice must be set)
    const oldPrice = parseFloat(p.oldPrice);
    const offerPrice = parseFloat(p.offerPrice);
    const hasOffer = !isNaN(oldPrice) && !isNaN(offerPrice) && oldPrice > 0 && offerPrice > 0;
    
    console.log('Product:', p.title, 'oldPrice:', p.oldPrice, 'offerPrice:', p.offerPrice, 'hasOffer:', hasOffer);
    let priceHTML = '';
    let offerBadge = '';
    
    if (hasOffer) {
      // Show strikeout old price and new offer price
      priceHTML = `
        <div class="price-container">
          <span class="old-price">${oldPrice} EGP</span>
          <span class="offer-price">${offerPrice} EGP</span>
        </div>
      `;
      offerBadge = '<div class="offer-badge">OFFER</div>';
    } else {
      // Regular price display - use price field (fallback for products without offer pricing)
      const displayPrice = p.price || p.offerPrice || 0;
      priceHTML = `<div class="price">${displayPrice} EGP</div>`;
    }
    
    card.innerHTML = `
      <div class="product-image-container">
        <img src="${cover}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.src='/assets/Loops/loop.jpg'" />
        ${offerBadge}
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(p.title)}</div>
        <div class="card-meta">
          ${priceHTML}
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      openProductModal(p.id);
    });
    container.appendChild(card);
  });
}

// --- Product Modal (complete functionality like main page) ---
let currentModalIndex = 0;
let modalImages = [];
let activeProduct = null;

function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;
  
  activeProduct = product;
  modalImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  // Ensure all image paths start with /
  modalImages = modalImages.map(img => img.startsWith('/') ? img : `/${img}`);
  if (!modalImages.length) modalImages = ['/assets/Loops/loop.jpg'];
  
  currentModalIndex = 0;
  document.getElementById('modal-img').src = modalImages[0] || '/assets/Loops/loop.jpg';
  document.getElementById('modal-title').textContent = product.title;
  
  // Handle offer pricing in modal
  const modalPriceEl = document.getElementById('modal-price');
  const modalOldPrice = parseFloat(product.oldPrice);
  const modalOfferPrice = parseFloat(product.offerPrice);
  const hasModalOffer = !isNaN(modalOldPrice) && !isNaN(modalOfferPrice) && modalOldPrice > 0 && modalOfferPrice > 0;
  
  if (hasModalOffer) {
    modalPriceEl.innerHTML = `
      <span class="modal-old-price">${modalOldPrice} EGP</span>
      <span class="modal-offer-price">${modalOfferPrice} EGP</span>
    `;
  } else {
    // Use regular price or fallback to offerPrice if no regular price
    const displayPrice = product.price || product.offerPrice || 0;
    modalPriceEl.textContent = `${displayPrice} EGP`;
  }
  
  // Only show description if it exists and is not empty
  const descElement = document.getElementById('modal-desc');
  if (product.desc && product.desc.trim()) {
    descElement.textContent = product.desc;
    descElement.style.display = 'block';
  } else {
    descElement.style.display = 'none';
  }
  
  document.getElementById('overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Navigate images in modal
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

function closeProductModal() {
  document.getElementById('overlay').classList.remove('active');
  document.body.style.overflow = '';
  activeProduct = null;
}

// --- Cart functionality (same as main page) ---
function addToCart() {
  if (!activeProduct) return;
  const cart = getCart();
  const existing = cart.find(i => i.id === activeProduct.id);
  if (existing) {
    existing.qty += 1;
  } else {
    const imgPath = activeProduct.images && activeProduct.images[0] 
      ? (activeProduct.images[0].startsWith('/') ? activeProduct.images[0] : `/${activeProduct.images[0]}`)
      : '/assets/Loops/loop.jpg';
    cart.push({ 
      id: activeProduct.id, 
      qty: 1, 
      title: activeProduct.title, 
      price: activeProduct.price, 
      img: imgPath
    });
  }
  saveCart(cart);
  updateCartCount();
  closeProductModal();
  showToast('Added to cart');
}

function showToast(message) {
  // Simple toast notification
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4bb543;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-weight: 600;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
}

// Cart functionality handled by cart.html page

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  loadCategoryData();
  
  // Modal controls
  document.getElementById('modal-close')?.addEventListener('click', closeProductModal);
  document.getElementById('overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'overlay') closeProductModal();
  });
  
  // Gallery navigation
  document.getElementById('prev-img')?.addEventListener('click', (e) => { e.stopPropagation(); prevModalImage(); });
  document.getElementById('next-img')?.addEventListener('click', (e) => { e.stopPropagation(); nextModalImage(); });
  
  // Add to cart
  document.getElementById('add-to-cart-btn')?.addEventListener('click', addToCart);
  
  // Cart controls - navigate to cart page like main app
  document.getElementById('cart-btn')?.addEventListener('click', () => {
    const overlay = document.getElementById('fade-overlay');
    if (overlay) {
      overlay.style.display = 'block';
      overlay.style.opacity = 0;
      setTimeout(() => {
        overlay.style.opacity = 1;
        setTimeout(() => {
          location.href = '/cart.html';
        }, 400);
      }, 10);
    } else {
      location.href = '/cart.html';
    }
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (document.getElementById('overlay').classList.contains('active')) {
      if (e.key === 'Escape') closeProductModal();
      if (e.key === 'ArrowLeft') prevModalImage();
      if (e.key === 'ArrowRight') nextModalImage();
    }
  });
});
