// admin.js - Admin via ?admin or dedicated /admin.html
(function(){
  const FULL_PAGE = /\/admin\.html$/i.test(location.pathname);
  if (!FULL_PAGE) {
    // If query has 'admin', redirect to dedicated admin page
    if (location.search.toLowerCase().includes('admin')) {
      const base = location.origin;
      location.replace(base + '/admin.html');
      return;
    }
    // Not admin mode at all
    return;
  }

  const ADMIN_USER = 'rehab';
  const ADMIN_PASS = 'rehab';
  let authHeader = null;

  // Inject minimal styles
  const style = document.createElement('style');
  style.textContent = `
    .admin-overlay { position:relative; width:100%; height:100vh; background:#fffbe9; border-left:0; box-shadow:none; z-index:1; font-family:inherit; display:flex; flex-direction:column; }
    .admin-header { padding:14px 16px; background:#a97a2f; color:#fff; font-weight:700; display:flex; align-items:center; justify-content:center; text-align:center; }
    .admin-nav { display:flex; gap:8px; }
    .admin-nav .admin-btn { background:#e6c37a; color:#3a2c13; }
    .admin-body { padding:14px 16px 80px; overflow:auto; font-size:0.85rem; color:#3a2c13; max-width:920px; width:100%; margin:0 auto; }
    .admin-section { margin-bottom:18px; border:1px solid #e6c37a; background:#fff; border-radius:10px; padding:12px 14px; }
    .admin-section h4 { margin:0 0 8px; font-size:0.9rem; color:#a97a2f; }
    .admin-section label { display:block; font-size:0.7rem; text-transform:uppercase; letter-spacing:1px; font-weight:600; color:#7c4d00; margin:6px 0 2px; }
    .admin-section input[type=text], .admin-section input[type=number], .admin-section textarea, .admin-section select { width:100%; padding:6px 8px; border:1px solid #d5b26a; border-radius:6px; font:inherit; background:#fffdf6; }
    .admin-section textarea { min-height:60px; resize:vertical; }
    .admin-btn { background:#a97a2f; color:#fff; border:0; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.75rem; letter-spacing:0.5px; margin-top:8px; }
    .admin-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .admin-small { font-size:0.65rem; color:#7c4d00; margin-top:4px; }
    .admin-login-box { padding:28px 26px; background:#fff; border:1px solid #e6c37a; border-radius:12px; max-width:640px; margin:0 auto; }
    .admin-login-box h3 { margin:0 0 14px; font-size:1rem; color:#a97a2f; }
    /* Align login labels beside inputs */
    .admin-login-grid { display:grid; grid-template-columns: max-content 1fr; column-gap:12px; row-gap:10px; align-items:center; }
    .admin-login-grid label { font-size:0.8rem; font-weight:700; color:#7c4d00; white-space:nowrap; }
    .admin-login-grid input { width:100%; padding:8px 10px; border:1px solid #d5b26a; border-radius:6px; background:#fffdf6; font:inherit; }
    @media (max-width:480px){
      .admin-login-grid { grid-template-columns: 1fr; }
      .admin-login-grid label { margin-top:2px; }
    }
    .admin-close { display:none; }
    .admin-tag { display:inline-block; background:#fffbe9; border:1px solid #e6c37a; padding:2px 6px; border-radius:6px; font-size:0.6rem; margin:3px 4px 0 0; }
    .admin-product-list { font-size:0.65rem; margin-top:6px; max-height:140px; overflow:auto; }
    .admin-product-list div { padding:3px 0; border-bottom:1px solid #f1d9a6; }
    .admin-images-preview { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
    .admin-images-preview img { width:54px; height:54px; object-fit:cover; border:1px solid #e6c37a; border-radius:6px; }
    .admin-toast { position:fixed; bottom:14px; right:14px; background:#4bb543; color:#fff; padding:10px 14px; border-radius:8px; font-size:0.75rem; font-weight:600; box-shadow:0 4px 14px rgba(0,0,0,0.15); z-index:1000000; }
    .admin-error { background:#e53935 !important; }
  `;
  document.head.appendChild(style);

  function toast(msg, isErr, duration = 2800){
    // Remove existing toasts if too many
    const existing = document.querySelectorAll('.admin-toast');
    if (existing.length > 2) {
      existing.forEach((toast, index) => {
        if (index < existing.length - 2) {
          toast.remove();
        }
      });
    }
    
    const t = document.createElement('div');
    t.className = 'admin-toast' + (isErr ? ' admin-error' : '');
    
    // Add icon based on message type
    const icon = isErr ? '⚠️' : '✅';
    t.innerHTML = `<span style="margin-right:6px;">${icon}</span>${msg}`;
    
    document.body.appendChild(t);
    
    // Slide in animation
    t.style.transform = 'translateX(100%)';
    t.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
      t.style.transform = 'translateX(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      t.style.transform = 'translateX(100%)';
      setTimeout(() => t.remove(), 300);
    }, duration);
  }

  function buildOverlay(){
    const wrap = document.createElement('div');
    wrap.className = 'admin-overlay';
    wrap.innerHTML = `
      <div class="admin-header">
        <span style="width:100%;text-align:center;">Admin Panel</span>
      </div>
      <div class="admin-body" id="admin-body"></div>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(wrap);
    return document.getElementById('admin-body');
  }

  function buildLogin(target){
    target.innerHTML = `
      <div class="admin-login-box">
        <h3>Login Required</h3>
        <div class="admin-login-grid">
          <label for="adm_user">Username</label>
          <input id="adm_user" type="text" autocomplete="off" />
          <label for="adm_pass">Password</label>
          <input id="adm_pass" type="password" />
        </div>
        <button id="adm_login_btn" class="admin-btn" style="width:100%;margin-top:12px;">Login</button>
        <div class="admin-small">Enter your admin credentials to manage categories & products.</div>
      </div>`;
    target.querySelector('#adm_login_btn').addEventListener('click', ()=>{
      const u = target.querySelector('#adm_user').value.trim();
      const p = target.querySelector('#adm_pass').value;
      if (u === ADMIN_USER && p === ADMIN_PASS){
        authHeader = 'Basic ' + btoa(u + ':' + p);
        toast('Logged in');
        loadPanel(target);
      } else {
        toast('Invalid credentials', true);
      }
    });
  }

  async function apiGetProducts(){
    try {
      const r = await fetch('/api/products');
      if (!r.ok) throw new Error('Failed');
      return await r.json();
    } catch(e){ toast('Load failed', true); return { categories:[], products:[] }; }
  }

  async function addCategory(id,name,description,section){
    try {
      const r = await fetch('/api/add-category', {
        method:'POST',
        headers: { 'Authorization': authHeader, 'Content-Type':'application/json' },
        body: JSON.stringify({ id, name, description, section })
      });
      const ct = r.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await r.json() : {};
      if (!r.ok) throw new Error(data.error || 'Error');
      toast('Category added');
      return true;
    } catch(e){ toast(e.message, true); return false; }
  }

  async function addProductBackground(form){
    try {
      const fd = new FormData(form);
      const r = await fetch('/api/add-product-background', { 
        method:'POST', 
        headers:{ 'Authorization': authHeader }, 
        body: fd 
      });
      const ct = r.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await r.json() : {};
      if (!r.ok) throw new Error(data.error || 'Error');
      toast('Product queued for background processing');
      return data;
    } catch(e){ toast(e.message, true); return null; }
  }

  async function getCarouselImages() {
    try {
      const r = await fetch('/api/carousel-images');
      if (!r.ok) return [];
      const data = await r.json();
      return data.images || [];
    } catch (e) {
      return [];
    }
  }

  function buildPanelHtml(cats, prods, carouselImages){
    const silverCats = cats.filter(c=> (c.section||'silver') === 'silver');
    const stainlessCats = cats.filter(c=> (c.section||'silver') === 'stainless');
    return `
      <div class='admin-section'>
        <h4>Homepage Carousel</h4>
        <form id='adm_carousel_form'>
          <label>Images (replaces all existing)</label><input name='images' type='file' accept='image/*' multiple required />
          <div class='admin-images-preview' id='adm_carousel_preview'>${carouselImages.map(src => `<img src='/${src}' />`).join('')}</div>
          <button class='admin-btn' type='submit'>Update Carousel</button>
        </form>
      </div>
      <div class='admin-section'>
        <h4>Categories</h4>
        <div>
          ${cats.map(c=>`<span class='admin-tag' title='${(c.description||'').replace(/'/g,'')}'>${c.id} · ${c.section||'silver'}</span>`).join('') || '<em>No categories</em>'}
        </div>
        <form id='adm_cat_form'>
          <label>ID (url-safe)</label><input name='id' required />
          <label>Name</label><input name='name' required />
          <label>Description</label><textarea name='description'></textarea>
          <label>Section</label>
          <select name='section' required>
            <option value='silver'>Silver</option>
            <option value='stainless'>Stainless</option>
          </select>
          <button class='admin-btn' type='submit'>Add Category</button>
        </form>
        <div style='margin-top:8px;border-top:1px solid #f1d9a6;padding-top:8px;'>
          <label>Delete Category</label>
          <div style='display:flex;gap:6px;align-items:center;'>
            <select id='adm_cat_del_select' style='flex:1;'>${cats.map(c=>`<option value='${c.id}'>${(c.name || c.id)} — ${(c.section||'silver')}</option>`).join('')}</select>
            <button id='adm_cat_del_btn' class='admin-btn' style='background:#e53935;'>Delete</button>
          </div>
          <div class='admin-small'>Deleting a category will also delete its products and uploaded images.</div>
        </div>
      </div>
      <div class='admin-section'>
        <h4>Add Product</h4>
        <form id='adm_prod_form'>
          <label>Title</label><input name='title' required />
          <label>Price</label>
          <input name='price' type='number' step='0.01' min='0' placeholder='Product price (e.g., 300)' required />
          <div class='admin-small' style='color:#666;'>💡 You can add offer pricing later using the edit feature</div>
          <label>Category</label>
          <select name='category' required>
            <optgroup label='Silver'>${silverCats.map(c=>`<option value='${c.id}'>${c.name || c.id}</option>`).join('')}</optgroup>
            <optgroup label='Stainless'>${stainlessCats.map(c=>`<option value='${c.id}'>${c.name || c.id}</option>`).join('')}</optgroup>
          </select>
          <label>Description</label><textarea name='desc'></textarea>
          <label>Images</label><input name='images' type='file' accept='image/*' multiple />
          <div class='admin-images-preview' id='adm_img_preview'></div>

          <button class='admin-btn' type='submit'>Add Product (Background)</button>
        </form>
      </div>
      <div class='admin-section'>
        <h4>Manage Products</h4>
        <div style='display:grid;grid-template-columns:1fr;gap:8px;'>
          <div>
            <label>Category</label>
            <select id='adm_m_cat'>
              <optgroup label='Silver'>${silverCats.map(c=>`<option value='${c.id}'>${c.name || c.id}</option>`).join('')}</optgroup>
              <optgroup label='Stainless'>${stainlessCats.map(c=>`<option value='${c.id}'>${c.name || c.id}</option>`).join('')}</optgroup>
            </select>
          </div>
          <div>
            <label>Product</label>
            <select id='adm_m_prod'></select>
          </div>
        </div>
        <form id='adm_edit_form' style='margin-top:8px;'>
          <label>Title</label><input name='title' />
          <div class='admin-pricing-section'>
            <label>Pricing Options</label>
            <div class='admin-small' style='margin-bottom:10px;color:#666;'>Use either regular price OR offer pricing (old + new price)</div>
            
            <div style='margin-bottom:15px;'>
              <label>Regular Price</label>
              <input name='price' type='number' step='0.01' min='0' placeholder='Regular price' />
            </div>
            
            <div class='admin-offer-section'>
              <label>OR Offer Pricing</label>
              <div style='display:grid;grid-template-columns:1fr 1fr;gap:10px;'>
                <div>
                  <label style='font-size:0.9rem;color:#666;'>Old Price</label>
                  <input name='oldPrice' type='number' step='0.01' min='0' placeholder='Original price' />
                </div>
                <div>
                  <label style='font-size:0.9rem;color:#666;'>New Price</label>
                  <input name='offerPrice' type='number' step='0.01' min='0' placeholder='Offer price' />
                </div>
              </div>
              <div class='admin-small' style='color:#e53935;'>💡 Fill both offer fields to create offer pricing</div>
            </div>
          </div>
          <label>Description</label><textarea name='desc'></textarea>
          <label>Images</label><input name='images' type='file' accept='image/*' multiple />
          <div class='admin-small'><label style='display:inline-flex;align-items:center;gap:6px;'><input type='checkbox' name='replaceImages' value='true'/> Replace existing images</label></div>
          <div class='admin-images-preview' id='adm_edit_preview'></div>

          <div style='display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;'>
            <button class='admin-btn' type='submit'>Save Changes</button>
            <button class='admin-btn' id='adm_del_prod_btn' type='button' style='background:#e53935;'>Delete Product</button>
          </div>
        </form>
      </div>
      <div class='admin-section'>
        <h4>Recent Products</h4>
        <div class='admin-product-list' id='adm_prod_list'>${prods.slice(-30).reverse().map(p=>`<div><strong>${p.title}</strong> <span style='opacity:0.7'>(EGP ${p.price})</span> — ${p.category}</div>`).join('') || '<em>None</em>'}</div>
      </div>`;
  }

  async function loadPanel(container){
    const data = await apiGetProducts();
    const carouselImages = await getCarouselImages();
    const cats = data.categories || []; const prods = data.products || [];
    container.innerHTML = buildPanelHtml(cats, prods, carouselImages);

    // Carousel form
    const carouselForm = container.querySelector('#adm_carousel_form');
    const carouselPreview = container.querySelector('#adm_carousel_preview');
    carouselForm.images.addEventListener('change', () => {
      carouselPreview.innerHTML = '';
      Array.from(carouselForm.images.files).forEach(f => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f);
        carouselPreview.appendChild(img);
      });
    });
    carouselForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(carouselForm);
      const r = await fetch('/api/carousel-images', { method: 'POST', headers: { 'Authorization': authHeader }, body: fd });
      const d = await r.json();
      if (!r.ok) return toast(d.error || 'Upload failed', true);
      toast('Carousel updated!');
      loadPanel(container); // Reload to show new images from server
    });

    // Category form
    const catForm = container.querySelector('#adm_cat_form');
    catForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const id = catForm.id.value.trim();
      const name = catForm.name.value.trim();
      if (!id || !name) return toast('Fill id & name', true);
      const ok = await addCategory(id, name, catForm.description.value.trim(), catForm.section.value);
      if (ok) loadPanel(container);
    });

    // Category delete
    const catDelBtn = container.querySelector('#adm_cat_del_btn');
    const catDelSel = container.querySelector('#adm_cat_del_select');
    if (catDelBtn && catDelSel) {
      catDelBtn.addEventListener('click', async ()=>{
        const id = catDelSel.value;
        if (!id) return;
        if (!confirm(`Delete category "${id}" and all its products?`)) return;
        try {
          const r = await fetch(`/api/category/${encodeURIComponent(id)}`, { method:'DELETE', headers:{ 'Authorization': authHeader } });
          const ct = r.headers.get('content-type') || '';
          const d = ct.includes('application/json') ? await r.json() : {};
          if (!r.ok) throw new Error(d.error || 'Delete failed');
          toast('Category deleted');
          loadPanel(container);
        } catch(e){ toast(e.message, true); }
      });
    }

    // Product form - Background processing
    const prodForm = container.querySelector('#adm_prod_form');
    const preview = container.querySelector('#adm_img_preview');
    prodForm.images.addEventListener('change', ()=>{
      preview.innerHTML='';
      Array.from(prodForm.images.files).forEach(f=>{
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f); preview.appendChild(img);
      });
    });
    prodForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      
      // Validate that price is provided
      const regularPrice = prodForm.price.value.trim();
      
      if (!regularPrice) {
        toast('Please provide a price for the product', true);
        return;
      }
      
      const added = await addProductBackground(prodForm);
      if (added){
        prodForm.reset(); 
        preview.innerHTML=''; 
        toast('Product will be processed in background and appear shortly on the main site');
      }
    });

    // Manage products
    const mCat = container.querySelector('#adm_m_cat');
    const mProd = container.querySelector('#adm_m_prod');
    const editForm = container.querySelector('#adm_edit_form');
    const editPreview = container.querySelector('#adm_edit_preview');

    function populateProductsFor(catId){
      const list = prods.filter(p=>p.category === catId);
      mProd.innerHTML = list.map(p=>`<option value='${p.id}'>${p.title}</option>`).join('');
      if (list.length) fillEditForm(list[0]);
      else fillEditForm(null);
    }
    function fillEditForm(prod){
      editForm.reset(); editPreview.innerHTML='';
      if (!prod){ mProd.innerHTML=''; return; }
      editForm.title.value = prod.title || '';
      editForm.price.value = (typeof prod.price === 'number') ? prod.price : '';
      editForm.oldPrice.value = (typeof prod.oldPrice === 'number') ? prod.oldPrice : '';
      editForm.offerPrice.value = (typeof prod.offerPrice === 'number') ? prod.offerPrice : '';
      editForm.desc.value = prod.desc || '';
      (prod.images||[]).forEach(src=>{
        const img = document.createElement('img'); img.src = src; editPreview.appendChild(img);
      });
    }
    mCat.addEventListener('change', ()=> populateProductsFor(mCat.value));
    mProd.addEventListener('change', ()=>{
      const prod = prods.find(p=>p.id === mProd.value);
      fillEditForm(prod || null);
    });
    // initial
    if (cats.length){ populateProductsFor(cats[0].id); }

    // preview new images for edit
    editForm.images.addEventListener('change', ()=>{
      // Show only newly selected files below current preview section
      Array.from(editForm.images.files).forEach(f=>{
        const img = document.createElement('img');
        img.src = URL.createObjectURL(f); editPreview.appendChild(img);
      });
    });
    // save changes
    editForm.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const id = mProd.value; if (!id) return;
      
      // Validate pricing when updating
      const regularPrice = editForm.price.value.trim();
      const oldPrice = editForm.oldPrice.value.trim();
      const offerPrice = editForm.offerPrice.value.trim();
      
      const hasRegularPrice = regularPrice !== '';
      const hasOfferPrices = oldPrice !== '' && offerPrice !== '';
      
      // Allow clearing all prices (will use existing product price)
      if (hasRegularPrice && hasOfferPrices) {
        toast('Please use either regular price OR offer pricing, not both', true);
        return;
      }
      
      if ((oldPrice !== '' && offerPrice === '') || (oldPrice === '' && offerPrice !== '')) {
        toast('For offer pricing, please fill both old price and new price', true);
        return;
      }
      
      try {
        const fd = new FormData();
        if (editForm.title.value.trim()) fd.append('title', editForm.title.value.trim());
        if (editForm.price.value !== '') fd.append('price', editForm.price.value);
        if (editForm.oldPrice.value !== '') fd.append('oldPrice', editForm.oldPrice.value);
        if (editForm.offerPrice.value !== '') fd.append('offerPrice', editForm.offerPrice.value);
        fd.append('desc', editForm.desc.value || '');
        if (editForm.replaceImages.checked) fd.append('replaceImages', 'true');
        Array.from(editForm.images.files).forEach(f=> fd.append('images', f));
        const r = await fetch(`/api/product/${encodeURIComponent(id)}`, { method:'PATCH', headers:{ 'Authorization': authHeader }, body: fd });
        const ct = r.headers.get('content-type') || '';
        const d = ct.includes('application/json') ? await r.json() : {};
        if (!r.ok) throw new Error(d.error || 'Update failed');
        toast('Product updated');
        loadPanel(container);
      } catch(e){ toast(e.message, true); }
    });
    // delete product
    container.querySelector('#adm_del_prod_btn').addEventListener('click', async ()=>{
      const id = mProd.value; if (!id) return;
      const prod = prods.find(p=>p.id === id);
      const title = prod ? prod.title : id;
      if (!confirm(`Delete product "${title}"?`)) return;
      try {
        const r = await fetch(`/api/product/${encodeURIComponent(id)}`, { method:'DELETE', headers:{ 'Authorization': authHeader } });
        const ct = r.headers.get('content-type') || '';
        const d = ct.includes('application/json') ? await r.json() : {};
        if (!r.ok) throw new Error(d.error || 'Delete failed');
        toast('Product deleted');
        loadPanel(container);
      } catch(e){ toast(e.message, true); }
    });
  }

  // INIT
  const body = buildOverlay();
  buildLogin(body);
})();
