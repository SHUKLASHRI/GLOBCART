import { CONFIG, supabase } from './config';

/* =====================================================
   GLOBCART — main.ts
   DOM logic, API integration, interactions
   ===================================================== */

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  image_url: string;
}

interface ApiResponse {
  data: Product[];
}

// ---- State ----
let cartCount = 0;
let allProducts: Product[] = [];
let activeFilter = 'all';
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const ORIGINS = [
  'Japan', 'Morocco', 'Peru', 'Switzerland', 'India',
  'Italy', 'Kenya', 'Colombia', 'Norway', 'Portugal',
  'Mexico', 'Thailand', 'France', 'Ghana', 'Turkey',
];

// ---- DOM Refs ----
const skeletonGrid  = document.getElementById('skeleton-grid');
const productsGrid  = document.getElementById('products-grid');
const errorState    = document.getElementById('error-state');
const emptyState    = document.getElementById('empty-state');
const cartCountEl   = document.getElementById('cart-count');
const retryBtn      = document.getElementById('retry-btn');
const exploreBtn    = document.getElementById('explore-btn');
const filterBar     = document.getElementById('filter-bar');
const toast         = document.getElementById('cart-toast');
const toastMsg      = document.getElementById('toast-msg');
const header        = document.getElementById('site-header');

// ---- Auth UI Update ----
async function checkUserSession(): Promise<void> {
    const authUserLink = document.getElementById('auth-user-link');
    if (!authUserLink) return;

    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
            const user = session.user;
            const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member';
            
            authUserLink.innerHTML = `Hello, ${escapeHTML(displayName)}<br/><b>Accounts & Lists</b>`;
            
            // Add logout option if not already there
            if (!document.getElementById('logout-btn')) {
                const logoutBtn = document.createElement('a');
                logoutBtn.id = 'logout-btn';
                logoutBtn.href = '#';
                logoutBtn.style.color = '#ff9900';
                logoutBtn.style.fontSize = '11px';
                logoutBtn.style.display = 'block';
                logoutBtn.textContent = 'Sign Out';
                logoutBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await supabase.auth.signOut();
                    window.location.reload();
                });
                authUserLink.appendChild(logoutBtn);
            }
        }
    } catch (err) {
        console.error('[GLOBCART] Session check failed:', err);
    }
}

// ---- Noise Canvas ----
function renderNoise(): void {
  const canvas = document.getElementById('noise-canvas') as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const imageData = ctx.createImageData(canvas.width, canvas.height);
  const buf = imageData.data;

  for (let i = 0; i < buf.length; i += 4) {
    const v = Math.random() * 255;
    buf[i]     = v;
    buf[i + 1] = v;
    buf[i + 2] = v;
    buf[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
}

function initScrollHeader(): void {
  if (!header) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
}

function initExploreBtn(): void {
  if (!exploreBtn) return;
  exploreBtn.addEventListener('click', () => {
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function updateCartBadge(): void {
  if (!cartCountEl) return;
  cartCountEl.textContent = String(cartCount);
  cartCountEl.style.transform = 'scale(1.4)';
  setTimeout(() => { cartCountEl.style.transform = ''; }, 200);
}

function showToast(message: string): void {
  if (!toast || !toastMsg) return;
  toastMsg.textContent = message;
  toast.classList.add('show');

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  }).format(price);
}

function getOrigin(id: number): string {
  return ORIGINS[id % ORIGINS.length];
}

function renderProducts(products: Product[]): void {
  if (!productsGrid || !emptyState) return;
  productsGrid.innerHTML = '';

  if (products.length === 0) {
    productsGrid.style.display = 'none';
    emptyState.style.display   = 'block';
    return;
  }

  emptyState.style.display   = 'none';
  productsGrid.style.display = 'grid';

  products.forEach((product, index) => {
    const origin = getOrigin(product.id);
    const card   = document.createElement('div');
    card.className = 'product-card';
    card.style.animationDelay = `${index * 0.07}s`;
    card.setAttribute('data-id', String(product.id));

    card.innerHTML = `
      <div class="card-image-wrap">
        <img
          class="card-img"
          src="${escapeHTML(product.image_url)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=70'; this.onerror=null;"
        />
        <span class="card-origin-badge">⊕ ${origin}</span>
        <button class="card-wishlist" aria-label="Wishlist" data-wishlist="${product.id}">♡</button>
      </div>
      <div class="card-body">
        <h3 class="card-name">${escapeHTML(product.name)}</h3>
        <p class="card-desc">${escapeHTML(product.description || '')}</p>
        <div class="card-footer">
          <div>
            <span class="card-price">${formatPrice(product.price)}</span>
            <span class="card-price-note">Free worldwide shipping</span>
          </div>
          <button class="card-add-btn" data-add="${product.id}" aria-label="Add to cart">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add
          </button>
        </div>
      </div>
    `;

    productsGrid.appendChild(card);
  });

  productsGrid.querySelectorAll<HTMLButtonElement>('[data-add]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id   = btn.dataset.add!;
      const prod = allProducts.find(p => p.id === Number(id));
      if (!prod) return;

      cartCount++;
      updateCartBadge();
      showToast(`${prod.name} added to cart`);

      btn.classList.add('added');
      btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        Added
      `;
      btn.disabled = true;
    });
  });

  productsGrid.querySelectorAll<HTMLButtonElement>('[data-wishlist]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const liked = btn.classList.toggle('liked');
      btn.textContent = liked ? '♥' : '♡';
      if (liked) showToast('Saved to wishlist');
    });
  });
}

function initFilters(): void {
  if (!filterBar) return;
  filterBar.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (!target.matches('.filter-btn')) return;

    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    target.classList.add('active');

    activeFilter = target.dataset.filter || 'all';
    applyFilter();
  });
}

function applyFilter(): void {
  const filterKeywords: Record<string, string[]> = {
    ceramics : ['ceramic', 'pot', 'bowl', 'vase', 'clay', 'porcelain'],
    textiles : ['textile', 'cloth', 'fabric', 'silk', 'wool', 'woven', 'scarf', 'blanket', 'rug'],
    food     : ['spice', 'coffee', 'tea', 'honey', 'cocoa', 'saffron', 'vanilla', 'oil', 'sauce'],
    home     : ['lamp', 'candle', 'basket', 'wood', 'furniture', 'decor', 'glass'],
  };

  let filtered = allProducts;
  if (activeFilter !== 'all') {
    const keywords = filterKeywords[activeFilter] || [];
    filtered = allProducts.filter(p => {
      const text = (p.name + ' ' + p.description).toLowerCase();
      return keywords.some(k => text.includes(k));
    });
    if (filtered.length === 0) filtered = allProducts;
  }

  renderProducts(filtered);
}

async function fetchProducts(): Promise<void> {
  if (!skeletonGrid || !productsGrid || !errorState || !emptyState) return;
  skeletonGrid.style.display  = 'grid';
  productsGrid.style.display  = 'none';
  errorState.style.display    = 'none';
  emptyState.style.display    = 'none';

  try {
    const res = await fetch(`${CONFIG.BACKEND_API_URL}/products`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json: ApiResponse = await res.json();
    allProducts = json.data ?? [];

    skeletonGrid.style.display = 'none';
    applyFilter();

  } catch (err) {
    console.error('[GLOBCART] Failed to fetch products:', err);
    skeletonGrid.style.display = 'none';
    productsGrid.style.display = 'none';
    errorState.style.display   = 'block';
  }
}

function initRetry(): void {
  if (!retryBtn) return;
  retryBtn.addEventListener('click', fetchProducts);
}

function initRevealObserver(): void {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('.stat-item').forEach(el => io.observe(el));
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

function initAuthButton(): void {
  const googleBtn = document.getElementById('google-login-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('[GLOBCART] Google login requested');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) {
        console.error('[GLOBCART] Google Auth error:', error.message);
        alert('Sign in failed: ' + error.message);
      }
    });
  }
}

function init(): void {
  renderNoise();
  window.addEventListener('resize', () => renderNoise(), { passive: true });

  initScrollHeader();
  initExploreBtn();
  initFilters();
  initRetry();
  initRevealObserver();
  initAuthButton();
  
  // Global Session Check
  checkUserSession();
  
  fetchProducts();
}

document.addEventListener('DOMContentLoaded', init);
