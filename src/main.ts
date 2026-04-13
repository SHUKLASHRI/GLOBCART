import { CONFIG, supabase } from './config';

/* =====================================================
   GLOBCART — main.ts
   Dynamic UI, State Management, Causality Logic
   ===================================================== */

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
  category?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const ORIGINS = [
  'Japan', 'Morocco', 'Peru', 'Switzerland', 'India',
  'Italy', 'Kenya', 'Colombia', 'Norway', 'Portugal',
  'Mexico', 'Thailand', 'France', 'Ghana', 'Turkey',
];

// ---- Utility ----
function getOrigin(id: number): string {
  return ORIGINS[id % ORIGINS.length];
}

function escapeHTML(str: string): string {
  return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]!));
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

// ---- State Management ----
class CartManager {
  private items: CartItem[] = [];

  constructor() {
    this.load();
    this.updateUI();
  }

  private load() {
    const saved = localStorage.getItem('globcart_cart');
    this.items = saved ? JSON.parse(saved) : [];
  }

  private save() {
    localStorage.setItem('globcart_cart', JSON.stringify(this.items));
    this.updateUI();
  }

  add(product: Product) {
    const existing = this.items.find(item => item.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.save();
    showToast(`${product.name} added to cart!`);
  }

  remove(id: number) {
    this.items = this.items.filter(item => item.id !== id);
    this.save();
  }

  updateQuantity(id: number, delta: number) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.quantity += delta;
      if (item.quantity <= 0) this.remove(id);
      else this.save();
    }
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getItems() {
    return this.items;
  }

  clear() {
    this.items = [];
    this.save();
  }

  private updateUI() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
      countEl.textContent = String(this.getCount());
      countEl.style.transform = 'scale(1.4)';
      setTimeout(() => { countEl.style.transform = ''; }, 200);
    }
    if (window.location.pathname.includes('cart.html')) {
      renderCartPage();
    }
  }
}

const cart = new CartManager();
let allProducts: Product[] = [];
let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ---- Auth UI Update ----
async function checkUserSession(): Promise<void> {
    const authUserLink = document.getElementById('auth-user-link');
    if (!authUserLink) return;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
            const user = session.user;
            const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
            authUserLink.innerHTML = `<span class="nav-link-v2">Hello, ${escapeHTML(displayName)}<br/><b>Accounts</b></span>`;
            
            if (!document.getElementById('logout-btn')) {
                const logoutBtn = document.createElement('a');
                logoutBtn.id = 'logout-btn';
                logoutBtn.href = '#';
                logoutBtn.style.color = '#ef4444';
                logoutBtn.style.fontSize = '12px';
                logoutBtn.style.display = 'block';
                logoutBtn.textContent = 'Sign Out';
                logoutBtn.onclick = async (e) => {
                    e.preventDefault();
                    await supabase.auth.signOut();
                    window.location.reload();
                };
                authUserLink.appendChild(logoutBtn);
            }
        }
    } catch (err) {
        console.error('[GLOBCART] Session check failed:', err);
    }
}

// ---- Components ----
function initScrollHeader(): void {
  const header = document.getElementById('site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

function showToast(message: string): void {
  const toast = document.getElementById('cart-toast');
  const toastMsg = document.getElementById('toast-msg');
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// ---- Page Logic ----
async function fetchProducts(renderHome = true): Promise<void> {
  const skeleton = document.getElementById('skeleton-grid');
  try {
    const res = await fetch(`${CONFIG.BACKEND_API_URL}/products`);
    const json = await res.json();
    allProducts = json.data || [];
    if (skeleton) skeleton.style.display = 'none';
    if (renderHome) renderProducts(allProducts);
  } catch (err) {
    console.error('[GLOBCART] Failed to fetch products:', err);
  }
}

function renderProducts(products: Product[]): void {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) return;
  productsGrid.innerHTML = '';
  productsGrid.style.display = 'grid';
  products.forEach((product, index) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.05}s`;
    card.innerHTML = `
      <div class="card-image-wrap" onclick="window.location.href='/product.html?id=${product.id}'" style="cursor:pointer">
        <img class="card-img" src="${escapeHTML(product.image_url)}" alt="${escapeHTML(product.name)}" loading="lazy" />
        <span class="card-origin-badge">${getOrigin(product.id)}</span>
        <button class="card-wishlist">♡</button>
      </div>
      <div class="card-body">
        <h3 class="card-name">${escapeHTML(product.name)}</h3>
        <p class="card-desc">${escapeHTML(product.description || '')}</p>
        <div class="card-footer">
          <span class="card-price">${formatPrice(product.price)}</span>
          <button class="card-add-btn" data-id="${product.id}">Add to Cart</button>
        </div>
      </div>
    `;
    productsGrid.appendChild(card);
  });
  productsGrid.querySelectorAll('.card-add-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      const product = allProducts.find(p => p.id === Number(id));
      if (product) cart.add(product);
    });
  });
}

function renderCartPage() {
  const container = document.getElementById('cart-items-container');
  const summaryEl = document.getElementById('cart-summary');
  if (!container || !summaryEl) return;
  const items = cart.getItems();
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<div class="text-center" style="padding: 40px">Your cart is empty. <a href="/" style="color:var(--accent)">Start shopping</a></div>';
    summaryEl.style.display = 'none';
    return;
  }
  summaryEl.style.display = 'block';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'product-card';
    row.style.flexDirection = 'row';
    row.style.alignItems = 'center';
    row.style.padding = '12px';
    row.style.gap = '20px';
    row.innerHTML = `
      <img src="${item.image_url}" style="width:80px; height:80px; object-fit:cover; border-radius:12px;" />
      <div style="flex-grow:1">
        <h4 style="font-weight:700">${item.name}</h4>
        <p style="font-size:14px; color:var(--text-muted)">${formatPrice(item.price)}</p>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="qty-btn" onclick="document.dispatchEvent(new CustomEvent('update-qty', {detail: {id: ${item.id}, delta: -1}}))" style="background:var(--bg-secondary); border:none; width:32px; height:32px; border-radius:8px;">-</button>
        <span>${item.quantity}</span>
        <button class="qty-btn" onclick="document.dispatchEvent(new CustomEvent('update-qty', {detail: {id: ${item.id}, delta: 1}}))" style="background:var(--bg-secondary); border:none; width:32px; height:32px; border-radius:8px;">+</button>
      </div>
      <div style="font-weight:800; width:80px; text-align:right">
        ${formatPrice(item.price * item.quantity)}
      </div>
    `;
    container.appendChild(row);
  });
  const subtotal = cart.getTotal();
  const tax = subtotal * 0.08;
  summaryEl.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:12px;"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
    <div style="display:flex; justify-content:space-between; margin-bottom:12px;"><span>Tax (8%)</span><span>${formatPrice(tax)}</span></div>
    <hr style="border:none; border-top:1px solid var(--border); margin:12px 0;" />
    <div style="display:flex; justify-content:space-between; margin-bottom:24px; font-weight:800; font-size:20px;"><span>Total</span><span>${formatPrice(subtotal + tax)}</span></div>
    <button class="btn-primary-v2 w-full" id="checkout-btn">Proceed to Checkout</button>
  `;
  document.getElementById('checkout-btn')?.addEventListener('click', () => { window.location.href = '/checkout.html'; });
}

document.addEventListener('update-qty', (e: any) => { cart.updateQuantity(e.detail.id, e.detail.delta); });

function initCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button');
    if (btn) { btn.disabled = true; btn.textContent = 'Processing Payment...'; }
    setTimeout(() => { cart.clear(); window.location.href = '/success.html'; }, 2000);
  });
}

async function renderProductPage() {
  const container = document.getElementById('product-detail-container');
  if (!container) return;
  const urlParams = new URLSearchParams(window.location.search);
  const id = Number(urlParams.get('id'));
  if (!id) { container.innerHTML = '<h1>Product not found</h1>'; return; }
  if (allProducts.length === 0) await fetchProducts(false);
  const product = allProducts.find(p => p.id === id);
  if (!product) { container.innerHTML = '<h1>Product doesn\'t exist</h1>'; return; }
  container.innerHTML = `
    <div style="aspect-ratio:1; background:var(--bg-secondary); border-radius:var(--radius-xl); overflow:hidden;">
        <img src="${product.image_url}" style="width:100%; height:100%; object-fit:cover;" />
    </div>
    <div>
        <p class="hero-eyebrow">Direct Import / ${getOrigin(product.id)}</p>
        <h1 class="hero-title" style="font-size:40px; margin-bottom:16px;">${product.name}</h1>
        <div class="card-price" style="font-size:32px; color:var(--accent); margin-bottom:24px;">${formatPrice(product.price)}</div>
        <p style="color:var(--text-muted); font-size:16px; margin-bottom:40px; line-height:1.8;">${product.description}</p>
        <div style="display:flex; gap:16px;">
            <button class="btn-primary-v2" id="detail-add-btn">Add to Collection</button>
            <a href="/" style="display:flex; align-items:center; padding:0 24px; font-weight:700; font-size:14px;">Back Home</a>
        </div>
        <div style="margin-top:60px; padding-top:40px; border-top:1px solid var(--border);">
            <p style="font-weight:800; text-transform:uppercase; font-size:12px; margin-bottom:16px;">Shipping & Origin</p>
            <p style="font-size:14px; color:var(--text-muted);">This item ships directly from our partner warehouse in <b>${getOrigin(product.id)}</b>.</p>
        </div>
    </div>
  `;
  document.getElementById('detail-add-btn')?.addEventListener('click', () => { cart.add(product); });
}

async function init(): Promise<void> {
  initScrollHeader();
  await checkUserSession();
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') {
    fetchProducts(true);
  } else if (path.includes('cart.html')) {
    renderCartPage();
  } else if (path.includes('checkout.html')) {
    initCheckout();
  } else if (path.includes('product.html')) {
    renderProductPage();
  }
}

document.addEventListener('DOMContentLoaded', init);
export { cart };
