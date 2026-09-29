/* ============================================================
   ঘরোয়া (Ghoroa) — Main Application JavaScript
   বাংলাদেশের হোমমেড প্রোডাক্ট মার্কেটপ্লেস
   ============================================================ */

// ==================== HELPER FUNCTIONS ====================

function toBanglaNumber(num) {
  const banglaDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
  return String(num).replace(/[0-9]/g, d => banglaDigits[d]);
}

function formatPrice(num) {
  return `৳ ${toBanglaNumber(num.toLocaleString('en-IN'))}`;
}

function getNextDay(dayOfWeek) {
  const today = new Date();
  const result = new Date(today);
  const diff = (7 + dayOfWeek - today.getDay()) % 7 || 7;
  result.setDate(today.getDate() + diff);
  result.setHours(10, 0, 0, 0);
  return result;
}

function getNextFriday() { return getNextDay(5); }
function getNextSaturday() { return getNextDay(6); }
function getNextSunday() { return getNextDay(0); }

function formatBanglaDate(date) {
  const days = ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'];
  const months = ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'];
  return `${days[date.getDay()]}, ${toBanglaNumber(date.getDate())} ${months[date.getMonth()]}`;
}

function generateStars(rating) {
  let html = '';
  const rounded = Math.round(rating);
  for (let i = 0; i < rounded; i++) html += '★';
  for (let i = rounded; i < 5; i++) html += '☆';
  return html;
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

// ==================== DATA ====================

// All data loads dynamically from Firebase Firestore
let PRODUCTS = [];
let HAATS = [];

const AREAS = [
  { id: 'adabor', name: 'আদাবর', sellers: 32 },
  { id: 'airport', name: 'বিমানবন্দর', sellers: 18 },
  { id: 'badda', name: 'বাড্ডা', sellers: 55 },
  { id: 'banani', name: 'বনানী', sellers: 28 },
  { id: 'bangshal', name: 'বংশাল', sellers: 22 },
  { id: 'bhatara', name: 'ভাটারা', sellers: 38 },
  { id: 'bhashantek', name: 'ভাষানটেক', sellers: 25 },
  { id: 'cantonment', name: 'ক্যান্টনমেন্ট', sellers: 15 },
  { id: 'chawkbazar', name: 'চকবাজার', sellers: 42 },
  { id: 'darus-salam', name: 'দারুস সালাম', sellers: 30 },
  { id: 'dakshinkhan', name: 'দক্ষিণখান', sellers: 35 },
  { id: 'demra', name: 'ডেমরা', sellers: 29 },
  { id: 'dhanmondi', name: 'ধানমন্ডি', sellers: 62 },
  { id: 'gendaria', name: 'গেন্ডারিয়া', sellers: 27 },
  { id: 'gulshan', name: 'গুলশান', sellers: 34 },
  { id: 'hazaribag', name: 'হাজারীবাগ', sellers: 31 },
  { id: 'hatirjheel', name: 'হাতিরঝিল', sellers: 20 },
  { id: 'jatrabari', name: 'যাত্রাবাড়ী', sellers: 39 },
  { id: 'kafrul', name: 'কাফরুল', sellers: 44 },
  { id: 'kalabagan', name: 'কলাবাগান', sellers: 26 },
  { id: 'kamrangirchar', name: 'কামরাঙ্গীরচর', sellers: 33 },
  { id: 'khilgaon', name: 'খিলগাঁও', sellers: 41 },
  { id: 'khilkhet', name: 'খিলক্ষেত', sellers: 36 },
  { id: 'kotwali', name: 'কোতোয়ালি', sellers: 19 },
  { id: 'kadamtali', name: 'কদমতলী', sellers: 23 },
  { id: 'lalbag', name: 'লালবাগ', sellers: 37 },
  { id: 'mirpur', name: 'মিরপুর', sellers: 78 },
  { id: 'mohammadpur', name: 'মোহাম্মদপুর', sellers: 53 },
  { id: 'motijheel', name: 'মতিঝিল', sellers: 25 },
  { id: 'mugda', name: 'মুগদা', sellers: 28 },
  { id: 'newmarket', name: 'নিউ মার্কেট', sellers: 21 },
  { id: 'pallabi', name: 'পল্লবী', sellers: 46 },
  { id: 'paltan', name: 'পল্টন', sellers: 17 },
  { id: 'ramna', name: 'রমনা', sellers: 24 },
  { id: 'rampura', name: 'রামপুরা', sellers: 47 },
  { id: 'rupnagar', name: 'রূপনগর', sellers: 33 },
  { id: 'sabujbag', name: 'সবুজবাগ', sellers: 30 },
  { id: 'shah-ali', name: 'শাহ আলী', sellers: 22 },
  { id: 'shahbag', name: 'শাহবাগ', sellers: 19 },
  { id: 'shahjahanpur', name: 'শাহজাহানপুর', sellers: 26 },
  { id: 'sher-e-bangla', name: 'শেরেবাংলা নগর', sellers: 29 },
  { id: 'shyampur', name: 'শ্যামপুর', sellers: 34 },
  { id: 'sutrapur', name: 'সূত্রাপুর', sellers: 31 },
  { id: 'tejgaon', name: 'তেজগাঁও', sellers: 38 },
  { id: 'tejgaon-industrial', name: 'তেজগাঁও শিল্পাঞ্চল', sellers: 16 },
  { id: 'turag', name: 'তুরাগ', sellers: 40 },
  { id: 'uttara-east', name: 'উত্তরা পূর্ব', sellers: 45 },
  { id: 'uttara-west', name: 'উত্তরা পশ্চিম', sellers: 37 },
  { id: 'uttarkhan', name: 'উত্তরখান', sellers: 32 }
];

const CATEGORIES = [
  { id: 'food', name: 'ঘরে তৈরি খাবার', icon: '🍯', count: 342, desc: 'আচার, পিঠা, মিষ্টি, ঐতিহ্যবাহী খাবার' },
  { id: 'bakery', name: 'বেকারি ও ডেজার্ট', icon: '🧁', count: 145, desc: 'কেক, পেস্ট্রি, কুকিজ, ডেজার্ট' },
  { id: 'spices', name: 'মসলা, ঘি ও তেল', icon: '🫙', count: 98, desc: 'খাঁটি সরিষার তেল, ঘি, খাঁটি গুঁড়া মসলা' },
  { id: 'handicraft', name: 'হস্তশিল্প ও কারুশিল্প', icon: '🧵', count: 187, desc: 'নকশিকাঁথা, মাটির পাত্র, বাঁশের কাজ' },
  { id: 'clothing', name: 'ঐতিহ্যবাহী পোশাক', icon: '👗', count: 156, desc: 'জামদানি, টাঙ্গাইল, হ্যান্ডলুম, ব্লক প্রিন্ট' },
  { id: 'organic', name: 'অর্গানিক ও হারবাল', icon: '🌿', count: 124, desc: 'ঘানির তেল, সুন্দরবনের মধু, ভেষজ সাবান' },
  { id: 'art', name: 'আর্ট ও হোম ডেকর', icon: '🎨', count: 98, desc: 'রিকশা আর্ট, আলপনা, ক্যালিগ্রাফি' },
  { id: 'gift', name: 'কাস্টম ও ক্রাফট গিফট', icon: '🎁', count: 76, desc: 'গিফট বক্স, পার্সোনালাইজড আইটেম' }
];

const TESTIMONIALS = [
  {
    name: 'ফাতেমা বেগম',
    area: 'মিরপুর',
    text: 'আগে ফেসবুক গ্রুপে আচার বিক্রি করতাম, মাসে ৫-৬ হাজার টাকা আয় হতো। ঘরোয়ায় দোকান খোলার পর এখন মাসে ২৫,০০০+ টাকা আয় করি!',
    earnings: '২৫,০০০+',
    months: '৬ মাস'
  },
  {
    name: 'রাহেলা আক্তার',
    area: 'যাত্রাবাড়ী',
    text: 'নকশিকাঁথা বানানো আমার নেশা ছিল, এখন পেশা। ঘরোয়ার "গল্পের দোকান" ফিচারের কারণে কাস্টমাররা আমার কাজের মূল্য বোঝেন।',
    earnings: '৩৫,০০০+',
    months: '৮ মাস'
  },
  {
    name: 'কামরুল হাসান',
    area: 'পুরান ঢাকা',
    text: 'রিকশা আর্ট এখন শুধু রিকশায় না, ঘরে ঘরে শোভা পাচ্ছে। ঘরোয়া আমাকে সারা ঢাকায় পরিচিত করে দিয়েছে।',
    earnings: '২০,০০০+',
    months: '৪ মাস'
  },
  {
    name: 'তানজিনা আহমেদ',
    area: 'গুলশান',
    text: 'কর্পোরেট চাকরি ছেড়ে কাস্টম গিফট বিজনেস শুরু করেছি। ঘরোয়ার এরিয়া-ভিত্তিক সিস্টেম আমাকে গুলশান-বনানীর কাস্টমার পেতে সাহায্য করেছে।',
    earnings: '৪৫,০০০+',
    months: '১০ মাস'
  }
];

const FAQS = [
  { q: 'ঘরোয়ায় দোকান খুলতে কত খরচ?', a: 'সম্পূর্ণ ফ্রি! কোনো রেজিস্ট্রেশন ফি, মাসিক চার্জ বা কমিশন নেই। আপনি যা বিক্রি করবেন, পুরো টাকাটাই আপনার।' },
  { q: 'কীভাবে পেমেন্ট নেব?', a: 'বিকাশ, নগদ, রকেট — যেকোনো মোবাইল ব্যাংকিং-এ সরাসরি পেমেন্ট নিতে পারবেন। ক্যাশ অন ডেলিভারিও সাপোর্ট করি।' },
  { q: 'ডেলিভারি কীভাবে হবে?', a: 'আপনার এলাকায় নিজে ডেলিভারি দিতে পারেন (ফ্রি), অথবা আমাদের পার্টনার — পাঠাও, রেডএক্স, স্টেডফাস্ট-এর মাধ্যমে সারা ঢাকায় ডেলিভারি দিতে পারবেন।' },
  { q: 'কী কী প্রোডাক্ট বিক্রি করতে পারব?', a: 'ঘরে তৈরি খাবার, হস্তশিল্প, পোশাক, আর্ট, প্রাকৃতিক প্রোডাক্ট, কাস্টম গিফট — যেকোনো হোমমেড বা হ্যান্ডমেড প্রোডাক্ট বিক্রি করতে পারবেন।' },
  { q: '"হাটবার" কী?', a: 'হাটবার হলো আমাদের ইউনিক ফিচার — নির্দিষ্ট দিনে ও সময়ে আপনি একটি "ফ্ল্যাশ হাট" বসাতে পারবেন। যেমন "প্রতি শুক্রবার পিঠার হাট"। এতে কাস্টমারদের মধ্যে excitement তৈরি হয়, বিক্রি বাড়ে।' },
  { q: 'আমি কি একাধিক ক্যাটাগরিতে প্রোডাক্ট রাখতে পারব?', a: 'অবশ্যই! আপনি একই দোকানে যত খুশি ক্যাটাগরিতে প্রোডাক্ট রাখতে পারবেন।' },
  { q: 'ঘরোয়া কি শুধু ঢাকার জন্য?', a: 'আপাতত ঢাকার সব এলাকায় সার্ভিস দিচ্ছি। শীঘ্রই চট্টগ্রাম, সিলেট, রাজশাহীসহ সারা বাংলাদেশে সম্প্রসারিত হবে।' }
];

// ==================== STATE ====================

let currentCategoryFilter = 'all';
let currentAreaFilter = '';
let currentShopFilter = '';
let searchQuery = '';
let allSellersMap = {};

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initMobileMenu();
  initSmoothScroll();
  initNavbarScroll();
  initSearch();

  // Load data from Firebase first, fallback to hardcoded
  await loadFirebaseData();

  renderCategories();
  renderAreas();
  renderProducts();
  renderHaats();
  renderTestimonials();
  renderFAQs();
  renderFilterButtons();

  initScrollAnimations();

  initCountdown();
  initCounterAnimation();
  initSellerForm();
  initModalEvents();
  checkUrlShopFilter();
  handleProductHash();
  window.addEventListener('hashchange', handleProductHash);
});

function handleProductHash() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#product-')) {
    const productId = hash.replace('#product-', '');
    if (productId && PRODUCTS.length > 0) {
      setTimeout(() => { openProductModal(productId); }, 500);
    }
  }
}

// ==================== FIREBASE DATA LOADING ====================

async function loadFirebaseData() {
  // Check if Firebase is available
  if (typeof db === 'undefined') return;

  try {
    // Load sellers map from Firestore first
    try {
      const sellersSnap = await db.collection('sellers').get();
      sellersSnap.forEach(doc => {
        allSellersMap[doc.id] = doc.data();
      });
    } catch (err) {
      console.warn('Could not load sellers map:', err.message);
    }

    // Load products from Firestore
    const productsSnap = await db.collection('products').get();

    if (!productsSnap.empty) {
      const firebaseProducts = [];
      productsSnap.forEach(doc => {
        const data = doc.data();
        const sellerInfo = allSellersMap[data.seller] || {};
        firebaseProducts.push({
          id: doc.id,
          name: data.name || '',
          price: parseInt(data.price) || 0,
          unit: data.unit || '',
          stockStatus: data.stockStatus || 'in_stock',
          category: data.category || '',
          area: (data.area || sellerInfo.area || '').toLowerCase(),
          areaName: data.areaName || data.area || sellerInfo.area || '',
          seller: data.sellerName || sellerInfo.name || data.seller || '',
          sellerId: data.seller || '',
          sellerPhone: data.sellerPhone || sellerInfo.phone || '',
          shopName: data.shopName || sellerInfo.shopName || '',
          shopBkash: data.shopBkash || sellerInfo.bkash || '',
          shopNagad: data.shopNagad || sellerInfo.nagad || '',
          deliveryCharge: sellerInfo.deliveryCharge || '',
          deliveryInfo: sellerInfo.deliveryInfo || '',
          pickupAvailable: sellerInfo.pickupAvailable || false,
          detailedAddress: sellerInfo.detailedAddress || sellerInfo.address || '',
          facebook: sellerInfo.facebook || '',
          instagram: sellerInfo.instagram || '',
          logoUrl: sellerInfo.logoUrl || '',
          coverUrl: sellerInfo.coverUrl || '',
          rating: parseFloat(data.rating) || 4.8,
          reviews: parseInt(data.reviews) || 15,
          image: data.imageUrl || data.image || (data.category === 'bakery' ? 'assets/chitoi.jpg' : data.category === 'clothing' ? 'assets/jamdani.jpg' : data.category === 'art' ? 'assets/rickshaw.jpg' : data.category === 'handicraft' ? 'assets/kantha.jpg' : data.category === 'spices' || data.category === 'organic' ? 'assets/oil.jpg' : data.category === 'gift' ? 'assets/gift.jpg' : 'assets/achar.jpg'),
          story: data.story || '',
          badge: data.badge || '',
          featured: data.featured || false
        });
      });
      console.log('🔥 Firebase products:', firebaseProducts.length);
      // Real Firebase products only
      PRODUCTS = firebaseProducts;
    } else {
      PRODUCTS = [];
    }

    // Load only approved haats from Firestore
    const haatsSnap = await db.collection('haats')
      .where('approved', '==', true)
      .get();
    if (!haatsSnap.empty) {
      const firebaseHaats = [];
      haatsSnap.forEach(doc => {
        const data = doc.data();
        firebaseHaats.push({
          id: doc.id,
          title: data.title || '',
          seller: data.seller || '',
          area: data.area || '',
          description: data.description || '',
          date: data.date ? data.date.toDate() : new Date(),
          products: data.products || 0,
          isLive: data.isLive || false
        });
      });
      // Approved Firebase haats only
      HAATS = firebaseHaats;
    } else {
      HAATS = [];
    }

    console.log(`✅ Firebase: ${productsSnap.size} products, haats loaded`);
  } catch (error) {
    console.warn('Firebase load failed:', error.message);
  }
}

// ==================== THEME ====================

function initTheme() {
  const saved = localStorage.getItem('ghoroa-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeToggle(saved);

  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ghoroa-theme', next);
  updateThemeToggle(next);
}

function updateThemeToggle(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ==================== MOBILE MENU ====================

function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    btn.classList.toggle('active');
    menu.classList.toggle('active');
  });

  // Close on link click
  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      btn.classList.remove('active');
      menu.classList.remove('active');
    });
  });
}

// ==================== SMOOTH SCROLL ====================

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const y = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });
}

// ==================== SCROLL ANIMATIONS ====================

function initScrollAnimations() {
  if (!window.IntersectionObserver) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

// ==================== NAVBAR SCROLL ====================

function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

// ==================== RENDER: CATEGORIES ====================

function renderCategories() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;

  grid.innerHTML = CATEGORIES.map(cat => `
    <div class="category-card glass animate-on-scroll" onclick="filterByCategory('${cat.id}')">
      <div class="category-icon">${cat.icon}</div>
      <h3 class="category-name">${cat.name}</h3>
      <p class="category-desc">${cat.desc}</p>
      <span class="category-count">${toBanglaNumber(cat.count)}টি পণ্য</span>
    </div>
  `).join('');
}

// ==================== RENDER: FILTER BUTTONS ====================

function renderFilterButtons() {
  const filterContainer = document.getElementById('product-filter');
  if (!filterContainer) return;

  const allBtn = `<button class="filter-btn active" data-filter="all" onclick="filterByCategory('all')">সব</button>`;
  const catBtns = CATEGORIES.map(cat =>
    `<button class="filter-btn" data-filter="${cat.id}" onclick="filterByCategory('${cat.id}')">${cat.icon} ${cat.name}</button>`
  ).join('');

  filterContainer.innerHTML = allBtn + catBtns;
}

// ==================== RENDER: AREAS ====================

function renderAreas() {
  const grid = document.getElementById('area-grid');
  if (!grid) return;

  grid.innerHTML = AREAS.map(area => `
    <button class="area-tag ${currentAreaFilter === area.id ? 'active' : ''}" 
            onclick="filterByArea('${area.id}')"
            data-area="${area.id}">
      📍 ${area.name}
      <span class="area-seller-count">${toBanglaNumber(area.sellers)} সেলার</span>
    </button>
  `).join('');
}

// ==================== RENDER: PRODUCTS ====================

function renderProducts() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let filtered = [...PRODUCTS];

  if (currentShopFilter) {
    filtered = filtered.filter(p => (p.sellerId && p.sellerId === currentShopFilter) || (p.seller && p.seller === currentShopFilter));
  }
  if (currentCategoryFilter !== 'all') {
    filtered = filtered.filter(p => p.category === currentCategoryFilter);
  }
  if (currentAreaFilter) {
    filtered = filtered.filter(p => p.area === currentAreaFilter);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.seller || '').toLowerCase().includes(q) ||
      (p.shopName || '').toLowerCase().includes(q) ||
      (p.areaName || '').includes(q) ||
      (p.area || '').toLowerCase().includes(q) ||
      (p.story || '').toLowerCase().includes(q) ||
      (p.badge || '').toLowerCase().includes(q) ||
      String(p.price).includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="no-products">
        <span class="no-products-icon">🔍</span>
        <p>দুঃখিত, কোনো পণ্য পাওয়া যায়নি।</p>
        <button class="btn btn-secondary" onclick="resetFilters()">সব পণ্য দেখুন</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    let stockBadgeHtml = '';
    if (p.stockStatus === 'made_to_order') {
      stockBadgeHtml = '<span class="stock-pill made-to-order" style="position:absolute;bottom:10px;left:10px;z-index:2;">⏳ প্রি-অর্ডার</span>';
    } else if (p.stockStatus === 'out_of_stock') {
      stockBadgeHtml = '<span class="stock-pill out-of-stock" style="position:absolute;bottom:10px;left:10px;z-index:2;">❌ স্টক শেষ</span>';
    }

    const unitHtml = p.unit ? `<small style="font-size:0.8rem;font-weight:normal;color:var(--text-muted);"> / ${p.unit}</small>` : '';

    return `
      <div class="product-card glass animate-on-scroll" onclick="openProductModal('${p.id}')">
        <div class="product-image" style="position:relative;">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
          ${stockBadgeHtml}
          <div class="product-overlay">
            <span>বিস্তারিত দেখুন →</span>
          </div>
        </div>
        <div class="product-info">
          <h3 class="product-name">${p.name}</h3>
          <p class="product-seller">🏪 ${p.shopName || p.seller} · 📍 ${p.areaName}</p>
          <p class="product-story-snippet">${(p.story || '').substring(0, 60)}...</p>
          <div class="product-footer">
            <span class="product-price">${formatPrice(p.price)}${unitHtml}</span>
            <span class="product-rating">
              <span class="stars">${generateStars(p.rating)}</span>
              <span class="review-count">${toBanglaNumber(p.rating)} (${toBanglaNumber(p.reviews)})</span>
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Re-observe new elements
  initScrollAnimations();
}

// ==================== RENDER: HAATS ====================

function renderHaats() {
  const grid = document.getElementById('haat-grid');
  if (!grid) return;

  if (HAATS.length === 0) {
    grid.innerHTML = `
      <div class="haat-empty-state glass animate-on-scroll" style="grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; border-radius: 16px;">
        <span style="font-size: 3.5rem; display: block; margin-bottom: 0.75rem;">🎪</span>
        <h3 style="font-size: 1.5rem; margin-bottom: 0.5rem;">পরবর্তী ফ্ল্যাশ হাটবার শীঘ্রই আসছে!</h3>
        <p style="color: var(--text-muted); max-width: 520px; margin: 0 auto 1.5rem auto; line-height: 1.6;">
          প্রতি শুক্রবার ও শনিবার আমাদের ঘরে তৈরি খাবারের বিশেষ ফ্ল্যাশ হাট বসে। আপনিও কি নিজের ঘরে তৈরি পণ্য নিয়ে হাট বসাতে চান?
        </p>
        <div style="display: inline-flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
          <button class="btn btn-secondary" onclick="showToast('শুক্রবার সকাল ১০টায় শুরু হলে নোটিফিকেশন পাবেন! 🔔')">
            🔔 রিমাইন্ডার সেট করুন
          </button>
          <a href="seller.html" class="btn btn-primary">
            🏪 সেলার প্যানেল থেকে হাট বসান
          </a>
        </div>
      </div>
    `;
    initScrollAnimations();
    return;
  }

  grid.innerHTML = HAATS.map(haat => `
    <div class="haat-card glass animate-on-scroll">
      ${haat.isLive ? '<div class="live-badge"><span class="live-dot"></span> LIVE</div>' : ''}
      <div class="haat-header">
        <h3 class="haat-title">${haat.title}</h3>
        <span class="haat-products">${toBanglaNumber(haat.products)}টি পণ্য</span>
      </div>
      <p class="haat-description">${haat.description}</p>
      <div class="haat-meta">
        <span class="haat-seller">🏪 ${haat.seller}</span>
        <span class="haat-area">📍 ${haat.area}</span>
      </div>
      <div class="haat-date">
        <span class="haat-date-icon">📅</span>
        <span>${formatBanglaDate(haat.date)}</span>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="showToast('রিমাইন্ডার সেট করা হয়েছে! 🔔')">
        🔔 রিমাইন্ডার সেট করুন
      </button>
    </div>
  `).join('');
}

// ==================== RENDER: TESTIMONIALS ====================

function renderTestimonials() {
  const slider = document.getElementById('testimonial-slider');
  if (!slider) return;

  slider.innerHTML = TESTIMONIALS.map(t => `
    <div class="testimonial-card glass animate-on-scroll">
      <div class="testimonial-quote">❝</div>
      <p class="testimonial-text">${t.text}</p>
      <div class="testimonial-author">
        <div class="testimonial-avatar">${t.name.charAt(0)}</div>
        <div class="testimonial-info">
          <h4>${t.name}</h4>
          <span>📍 ${t.area}</span>
        </div>
      </div>
      <div class="testimonial-stats">
        <div class="testimonial-stat">
          <span class="stat-value">৳ ${t.earnings}</span>
          <span class="stat-label">মাসিক আয়</span>
        </div>
        <div class="testimonial-stat">
          <span class="stat-value">${t.months}</span>
          <span class="stat-label">ঘরোয়ায় আছেন</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ==================== RENDER: FAQ ====================

function renderFAQs() {
  const list = document.getElementById('faq-list');
  if (!list) return;

  list.innerHTML = FAQS.map((faq, i) => `
    <div class="faq-item glass animate-on-scroll visible">
      <button class="faq-question" onclick="toggleFAQ(this)" aria-expanded="false">
        <span>${faq.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <p>${faq.a}</p>
      </div>
    </div>
  `).join('');
  initScrollAnimations();
}

function toggleFAQ(btn) {
  const item = btn.parentElement;
  const isOpen = item.classList.contains('open');

  // Close all
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
  });

  // Open clicked if was closed
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

// ==================== FILTERS ====================

function filterByCategory(categoryId) {
  currentCategoryFilter = categoryId;

  // Update filter button active state
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === categoryId);
  });

  renderProducts();

  // Scroll to products
  const section = document.getElementById('products');
  if (section) {
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
    const y = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

function filterByArea(areaId) {
  // Toggle: if same area, deselect
  currentAreaFilter = currentAreaFilter === areaId ? '' : areaId;

  // Update area tag active states
  document.querySelectorAll('.area-tag').forEach(tag => {
    tag.classList.toggle('active', tag.dataset.area === currentAreaFilter);
  });

  renderProducts();

  const section = document.getElementById('products');
  if (section) {
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
    const y = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

function resetFilters() {
  currentCategoryFilter = 'all';
  currentAreaFilter = '';
  currentShopFilter = '';
  searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  const banner = document.getElementById('shop-banner-container');
  if (banner) banner.innerHTML = '';
  renderFilterButtons();
  renderAreas();
  renderProducts();
}

// ==================== SEARCH ====================

function initSearch() {
  const input = document.getElementById('search-input');
  const mobileInput = document.getElementById('mobile-search-input');
  const searchBtn = document.querySelector('.search-btn');

  function performSearch(query) {
    searchQuery = query.trim();
    renderProducts();
    // Auto scroll to products section
    if (searchQuery) {
      const section = document.getElementById('products');
      if (section) {
        const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
        const y = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      // Close mobile menu if open
      document.getElementById('mobile-menu')?.classList.remove('active');
      document.getElementById('mobile-menu-btn')?.classList.remove('active');
    }
  }

  if (input) {
    let debounceTimer;
    input.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performSearch(e.target.value);
        if (mobileInput) mobileInput.value = e.target.value;
      }, 300);
    });
  }

  if (mobileInput) {
    let debounceTimer;
    mobileInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performSearch(e.target.value);
        if (input) input.value = e.target.value;
      }, 300);
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = input?.value || '';
      performSearch(query);
    });
  }
}

// ==================== MODAL ====================

function initModalEvents() {
  const modal = document.getElementById('product-modal');
  const closeBtn = document.getElementById('modal-close');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Share buttons
  document.querySelectorAll('.share-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const platform = btn.dataset.platform;
      const url = window.location.href;
      if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent('ঘরোয়া থেকে দেখুন! ' + url)}`, '_blank');
      } else if (platform === 'copy') {
        navigator.clipboard?.writeText(url).then(() => showToast('লিংক কপি হয়েছে! 📋'));
      }
    });
  });

  // Review Form Toggle Button
  const toggleReviewBtn = document.getElementById('toggle-review-form-btn');
  const reviewForm = document.getElementById('product-review-form');
  if (toggleReviewBtn && reviewForm) {
    toggleReviewBtn.addEventListener('click', () => {
      const isHidden = reviewForm.style.display === 'none' || !reviewForm.style.display;
      reviewForm.style.display = isHidden ? 'block' : 'none';
      toggleReviewBtn.textContent = isHidden ? '✕ বন্ধ করুন' : '✍️ রিভিউ লিখুন';
    });
  }

  // Direct Online Order Form Submit
  const orderForm = document.getElementById('modal-direct-order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const productId = document.getElementById('order-product-id')?.value;
      const productName = document.getElementById('order-product-name')?.value;
      const productPrice = parseInt(document.getElementById('order-product-price')?.value) || 0;
      const sellerId = document.getElementById('order-seller-id')?.value;
      const sellerName = document.getElementById('order-seller-name')?.value;

      const custName = document.getElementById('order-cust-name')?.value.trim();
      const custPhone = document.getElementById('order-cust-phone')?.value.trim();
      const quantity = parseInt(document.getElementById('order-quantity')?.value) || 1;
      const deliveryType = document.getElementById('order-delivery-type')?.value || 'delivery';
      const custAddress = document.getElementById('order-cust-address')?.value.trim();
      const notes = document.getElementById('order-notes')?.value.trim();

      const totalPrice = quantity * productPrice;
      const submitBtn = document.getElementById('order-submit-btn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'অর্ডার পাঠানো হচ্ছে...';
      }

      try {
        if (typeof db !== 'undefined') {
          await db.collection('orders').add({
            productId: String(productId),
            productName: productName,
            productPrice: productPrice,
            sellerId: String(sellerId),
            sellerName: sellerName,
            customerName: custName,
            customerPhone: custPhone,
            customerAddress: custAddress,
            deliveryType: deliveryType,
            quantity: quantity,
            totalPrice: totalPrice,
            notes: notes || '',
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        showToast(`🎉 অভিনন্দন ${custName}! আপনার অর্ডারটি সফলভাবে সেলারের কাছে পৌঁছেছে। সেলার দ্রুত ফোনে যোগাযোগ করবেন।`);
        orderForm.reset();
        const preview = document.getElementById('order-total-price-preview');
        if (preview) preview.textContent = '৳ ০';
      } catch (err) {
        console.error('Order submit error:', err);
        showToast('⚠️ অর্ডার পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে সরাসরি WhatsApp বা ফোনে যোগাযোগ করুন।');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'অর্ডার কনফার্ম করুন 🚀';
        }
      }
    });
  }

  // Customer Review Form Submit
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const productId = document.getElementById('order-product-id')?.value;
      const name = document.getElementById('review-author-name')?.value.trim();
      const rating = parseInt(document.getElementById('review-rating-select')?.value) || 5;
      const comment = document.getElementById('review-comment-text')?.value.trim();

      if (!productId) return;

      try {
        if (typeof db !== 'undefined') {
          await db.collection('reviews').add({
            productId: String(productId),
            name: name || 'সম্মানিত ক্রেতা',
            rating: rating,
            comment: comment,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
        showToast('⭐ আপনার মূল্যবান রিভিউ যুক্ত হয়েছে! ধন্যবাদ।');
        reviewForm.reset();
        reviewForm.style.display = 'none';
        if (toggleReviewBtn) toggleReviewBtn.textContent = '✍️ রিভিউ লিখুন';
        loadProductReviews(productId);
      } catch (err) {
        console.error('Review submit error:', err);
        showToast('⚠️ রিভিউ যুক্ত করতে সমস্যা হয়েছে।');
      }
    });
  }
}

async function loadProductReviews(productId) {
  const container = document.getElementById('modal-reviews-list');
  if (!container) return;

  container.innerHTML = '<p style="font-size:0.85rem;color:var(--text-muted);">রিভিউ লোড হচ্ছে...</p>';
  const reviews = [];

  if (typeof db !== 'undefined') {
    try {
      const snap = await db.collection('reviews').where('productId', '==', String(productId)).get();
      snap.forEach(doc => {
        reviews.push(doc.data());
      });
    } catch (err) {
      console.warn('Reviews fetch error:', err);
    }
  }

  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 1rem; color: var(--text-muted); font-size: 0.85rem; background: var(--surface); border-radius: 8px;">
        এখনও কোনো কাস্টমার রিভিউ জমা পড়েনি। প্রথম রিভিউটি আপনিই লিখুন! ⭐
      </div>
    `;
    return;
  }

  container.innerHTML = reviews.map(r => `
    <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 0.75rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
        <span style="font-weight: 600; font-size: 0.9rem;">${r.name || 'সম্মানিত ক্রেতা'}</span>
        <span style="color: var(--secondary); font-size: 0.85rem;">${generateStars(r.rating || 5)}</span>
      </div>
      <p style="margin: 0; font-size: 0.85rem; color: var(--text); line-height: 1.4;">${r.comment || ''}</p>
    </div>
  `).join('');
}

function openProductModal(productId) {
  const product = PRODUCTS.find(p => String(p.id) === String(productId));
  if (!product) return;

  const modal = document.getElementById('product-modal');
  if (!modal) return;

  // Fill modal data
  document.getElementById('modal-image').src = product.image;
  document.getElementById('modal-image').alt = product.name;
  document.getElementById('modal-title').textContent = product.name;
  document.getElementById('modal-price').textContent = formatPrice(product.price);

  const unitEl = document.getElementById('modal-unit');
  if (unitEl) {
    unitEl.textContent = product.unit ? `/ ${product.unit}` : '';
  }

  const stockEl = document.getElementById('modal-stock-status');
  if (stockEl) {
    if (product.stockStatus === 'made_to_order') {
      stockEl.innerHTML = '<span class="stock-pill made-to-order">⏳ প্রি-অর্ডার</span>';
    } else if (product.stockStatus === 'out_of_stock') {
      stockEl.innerHTML = '<span class="stock-pill out-of-stock">❌ স্টক শেষ</span>';
    } else {
      stockEl.innerHTML = '<span class="stock-pill in-stock">✅ ইন স্টক</span>';
    }
  }

  document.getElementById('modal-rating').innerHTML = `${generateStars(product.rating)} ${toBanglaNumber(product.rating)} (${toBanglaNumber(product.reviews)} রিভিউ)`;
  document.getElementById('modal-badge').textContent = product.badge || '';
  document.getElementById('modal-story-text').textContent = product.story;
  document.getElementById('seller-name').textContent = product.shopName || product.seller;
  document.getElementById('seller-area').textContent = `📍 ${product.areaName}`;

  // Seller avatar / custom logo
  const avatarEl = document.getElementById('seller-avatar');
  if (avatarEl) {
    if (product.logoUrl) {
      avatarEl.innerHTML = `<img src="${product.logoUrl}" alt="${product.shopName || product.seller}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
    } else {
      avatarEl.textContent = (product.shopName || product.seller || 'ঘ').charAt(0);
    }
  }

  // Seller micro-store link
  const shopLink = document.getElementById('modal-seller-shop-link');
  if (shopLink) {
    if (product.sellerId || product.seller) {
      shopLink.style.display = 'inline-block';
      shopLink.onclick = (e) => {
        e.preventDefault();
        closeModal();
        filterByShop(product.sellerId || product.seller);
      };
    } else {
      shopLink.style.display = 'none';
    }
  }

  // Delivery, Payment, and Detailed Pickup Address info box
  const metaBox = document.getElementById('modal-seller-meta-box');
  const delRow = document.getElementById('modal-delivery-row');
  const delText = document.getElementById('modal-delivery-text');
  const payRow = document.getElementById('modal-payment-row');
  const payText = document.getElementById('modal-payment-text');
  const addrRow = document.getElementById('modal-address-row');
  const addrText = document.getElementById('modal-address-text');

  let hasMeta = false;
  if (product.deliveryInfo || product.deliveryCharge) {
    hasMeta = true;
    if (delRow && delText) {
      delRow.style.display = 'flex';
      delText.textContent = product.deliveryInfo || `ডেলিভারি চার্জ ৳ ${toBanglaNumber(product.deliveryCharge)}`;
    }
  } else if (delRow) {
    delRow.style.display = 'none';
  }

  if (product.shopBkash || product.shopNagad) {
    hasMeta = true;
    if (payRow && payText) {
      payRow.style.display = 'flex';
      const methods = [];
      if (product.shopBkash) methods.push(`বিকাশ: ${product.shopBkash}`);
      if (product.shopNagad) methods.push(`নগদ: ${product.shopNagad}`);
      payText.textContent = methods.join(' | ');
    }
  } else if (payRow) {
    payRow.style.display = 'none';
  }

  if (product.detailedAddress && product.pickupAvailable) {
    hasMeta = true;
    if (addrRow && addrText) {
      addrRow.style.display = 'flex';
      addrText.textContent = product.detailedAddress;
    }
  } else if (addrRow) {
    addrRow.style.display = 'none';
  }

  if (metaBox) {
    metaBox.style.display = hasMeta ? 'flex' : 'none';
  }

  // Real WhatsApp link to seller's number
  const sellerPhone = product.sellerPhone || '01913362221';
  let cleanPhone = sellerPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '88' + cleanPhone;

  const unitStr = product.unit ? ` (${product.unit})` : '';
  const waMsg = encodeURIComponent(`হ্যালো! আমি ঘরোয়া থেকে আপনার "${product.name}"${unitStr} অর্ডার করতে চাই। মূল্য: ${formatPrice(product.price)}। এটি কি এখন পাওয়া যাবে?`);
  const waBtn = document.getElementById('modal-whatsapp');
  if (waBtn) waBtn.href = `https://wa.me/${cleanPhone}?text=${waMsg}`;

  // Direct Call link to seller's number
  const phoneBtn = document.getElementById('modal-phone');
  if (phoneBtn) {
    phoneBtn.href = `tel:${sellerPhone}`;
    phoneBtn.innerHTML = `📞 সরাসরি কল (${sellerPhone})`;
  }

  // Seller Facebook Page Link
  const fbBtn = document.getElementById('modal-facebook');
  if (fbBtn) {
    if (product.facebook) {
      fbBtn.href = product.facebook.startsWith('http') ? product.facebook : `https://${product.facebook}`;
      fbBtn.style.display = 'inline-block';
    } else {
      fbBtn.style.display = 'none';
    }
  }

  // Messenger link
  const msgBtn = document.getElementById('modal-messenger');
  if (msgBtn) {
    msgBtn.href = 'https://m.me/ghoroa.bd';
  }

  // Setup Direct Order Form Hidden Fields & Live Price Calculation
  const orderProdId = document.getElementById('order-product-id');
  const orderProdName = document.getElementById('order-product-name');
  const orderProdPrice = document.getElementById('order-product-price');
  const orderSellerId = document.getElementById('order-seller-id');
  const orderSellerName = document.getElementById('order-seller-name');
  const orderQty = document.getElementById('order-quantity');
  const orderTotalPreview = document.getElementById('order-total-price-preview');

  if (orderProdId) orderProdId.value = product.id;
  if (orderProdName) orderProdName.value = product.name;
  if (orderProdPrice) orderProdPrice.value = product.price;
  if (orderSellerId) orderSellerId.value = product.sellerId || product.seller;
  if (orderSellerName) orderSellerName.value = product.shopName || product.seller;
  if (orderQty) orderQty.value = 1;

  function updateOrderTotal() {
    const qty = parseInt(orderQty?.value) || 1;
    const total = qty * product.price;
    if (orderTotalPreview) {
      orderTotalPreview.textContent = formatPrice(total);
    }
  }
  updateOrderTotal();
  if (orderQty) {
    orderQty.oninput = updateOrderTotal;
  }

  // Reset and hide Review form, and load reviews
  const reviewForm = document.getElementById('product-review-form');
  if (reviewForm) {
    reviewForm.reset();
    reviewForm.style.display = 'none';
  }
  const toggleReviewBtn = document.getElementById('toggle-review-form-btn');
  if (toggleReviewBtn) toggleReviewBtn.textContent = '✍️ রিভিউ লিখুন';

  loadProductReviews(product.id);

  // If no phone, try to look up from sellers collection
  if (!sellerPhone && product.sellerId && typeof db !== 'undefined') {
    db.collection('sellers').doc(product.sellerId).get().then(doc => {
      if (doc.exists && doc.data().phone) {
        let phone = doc.data().phone;
        if (!phone.startsWith('88')) phone = '88' + phone;
        document.getElementById('modal-whatsapp').href = `https://wa.me/${phone}?text=${waMsg}`;
      }
    }).catch(() => {});
  }

  // Store product data for orders & reviews
  const modalTitle = document.getElementById('modal-title');
  if (modalTitle) {
    modalTitle.dataset.productId = String(product.id);
    modalTitle.dataset.sellerId = product.sellerId || '';
    modalTitle.dataset.productName = product.name || '';
    modalTitle.dataset.productPrice = String(product.price || 0);
    modalTitle.dataset.productImage = product.image || '';
  }

  // Reset review form if open
  toggleReviewForm(false);

  // Show modal
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
  toggleReviewForm(false);
}

// ==================== COUNTDOWN TIMER ====================

function initCountdown() {
  const daysEl = document.getElementById('countdown-days');
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  if (!daysEl) return;

  // Find the nearest upcoming haat
  const now = new Date();
  const upcomingDates = HAATS.map(h => h.date).filter(d => d > now);
  const nextHaat = upcomingDates.length > 0
    ? upcomingDates.reduce((a, b) => a < b ? a : b)
    : getNextFriday();

  let countdownInterval;

  function update() {
    const now = new Date();
    const diff = nextHaat - now;

    if (diff <= 0) {
      daysEl.textContent = '০০';
      hoursEl.textContent = '০০';
      minutesEl.textContent = '০০';
      secondsEl.textContent = '০০';
      if (countdownInterval) clearInterval(countdownInterval);
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = toBanglaNumber(String(days).padStart(2, '0'));
    hoursEl.textContent = toBanglaNumber(String(hours).padStart(2, '0'));
    minutesEl.textContent = toBanglaNumber(String(minutes).padStart(2, '0'));
    secondsEl.textContent = toBanglaNumber(String(seconds).padStart(2, '0'));
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

// ==================== COUNTER ANIMATION ====================

function initCounterAnimation() {
  const statNumbers = document.querySelectorAll('.stat-number[data-target]');
  if (statNumbers.length === 0 || !window.IntersectionObserver) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target, 10);
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(el, target) {
  const duration = 2000;
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = toBanglaNumber(current) + '+';

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = toBanglaNumber(target) + '+';
    }
  }

  requestAnimationFrame(step);
}

// ==================== SELLER FORM ====================

function initSellerForm() {
  const form = document.getElementById('seller-form');
  if (!form) return;

  // Auto-populate area dropdown from AREAS data
  const areaSelect = document.getElementById('seller-area-select');
  if (areaSelect) {
    AREAS.forEach(area => {
      const option = document.createElement('option');
      option.value = area.name;
      option.textContent = area.name;
      areaSelect.appendChild(option);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('seller-name-input')?.value.trim();
    const phone = document.getElementById('seller-phone')?.value.trim();
    const area = document.getElementById('seller-area-select')?.value;
    const category = document.getElementById('seller-category-select')?.value;
    const story = document.getElementById('seller-story')?.value.trim();

    if (!name || !phone || !area) {
      showToast('অনুগ্রহ করে নাম, ফোন নম্বর এবং এলাকা দিন');
      return;
    }

    const sellerData = { name, phone, area, category, story };
    try {
      localStorage.setItem('ghoroa_pending_seller', JSON.stringify(sellerData));
    } catch (err) {}

    try {
      if (typeof db !== 'undefined') {
        await db.collection('seller_leads').add({
          name, phone, area,
          category: category || '',
          story: story || '',
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (err) {
      console.warn('Lead save notice:', err.message);
    }

    showToast(`🎉 অভিনন্দন ${name}! আপনার আবেদন গ্রহণ করা হয়েছে!`);
    form.reset();

    // Friendly prompt to complete shop setup
    setTimeout(() => {
      if (confirm('অভিনন্দন! আপনার দোকান খোলার আবেদন জমা হয়েছে। আপনি কি এখনই Google দিয়ে লগইন করে পণ্য যোগ করতে চান?')) {
        window.location.href = 'seller.html';
      }
    }, 800);
  });
}

// ==================== SINGLE SELLER SHOP VIEW ====================

function checkUrlShopFilter() {
  const params = new URLSearchParams(window.location.search);
  const shopId = params.get('shop') || params.get('seller');
  if (shopId) {
    filterByShop(shopId);
  }
}

function filterByShop(shopId) {
  currentShopFilter = shopId;
  currentCategoryFilter = 'all';
  currentAreaFilter = '';

  // Update filter buttons active state
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

  // Find seller info from map or products
  const sellerData = allSellersMap[shopId] || {};
  const sampleProduct = PRODUCTS.find(p => p.sellerId === shopId || p.seller === shopId);
  const shopName = sellerData.shopName || sampleProduct?.shopName || sampleProduct?.seller || 'ঘরোয়া স্টোর';
  const ownerName = sellerData.name || sampleProduct?.seller || 'স্বত্বাধিকারী';
  const areaName = sellerData.area || sampleProduct?.areaName || 'ঢাকা';
  const phone = sellerData.phone || sampleProduct?.sellerPhone || '01913362221';
  const story = sellerData.story || sampleProduct?.story || 'স্বাগতম আমাদের অনলাইন দোকানে!';
  const deliveryCharge = sellerData.deliveryCharge || sampleProduct?.deliveryCharge;
  const bkash = sellerData.bkash || sampleProduct?.shopBkash;
  const nagad = sellerData.nagad || sampleProduct?.shopNagad;
  const logoUrl = sellerData.logoUrl || sampleProduct?.logoUrl;
  const facebook = sellerData.facebook || sampleProduct?.facebook;
  const detailedAddress = sellerData.detailedAddress || sampleProduct?.detailedAddress;

  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) cleanPhone = '88' + cleanPhone;

  const banner = document.getElementById('shop-banner-container');
  if (banner) {
    const avatarHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${shopName}" class="shop-avatar-large" style="object-fit:cover;border-radius:12px;width:64px;height:64px;">`
      : `<div class="shop-avatar-large">${shopName.charAt(0)}</div>`;

    const fbBtnHtml = facebook
      ? `<a href="${facebook.startsWith('http') ? facebook : 'https://' + facebook}" target="_blank" class="btn btn-outline btn-sm">📘 ফেসবুক পেজ</a>`
      : '';

    const addressDetailHtml = detailedAddress
      ? `<div class="shop-detail-item"><span>📍</span> পিকআপ ঠিকানা: <strong>${detailedAddress}</strong></div>`
      : '';

    banner.innerHTML = `
      <div class="shop-header-banner animate-on-scroll visible">
        <div class="shop-header-top">
          <div class="shop-badge-title">
            ${avatarHtml}
            <div class="shop-info-hgroup">
              <h2>${shopName}</h2>
              <p>👤 ${ownerName} · 📍 ${areaName}</p>
            </div>
          </div>
          <div class="shop-header-actions">
            <a href="https://wa.me/${cleanPhone}?text=${encodeURIComponent('হ্যালো, আমি আপনার ঘরোয়া স্টোর থেকে যোগাযোগ করছি।')}" target="_blank" class="btn btn-success btn-sm">💬 WhatsApp-এ মেসেজ</a>
            <a href="tel:${phone}" class="btn btn-outline btn-sm">📞 ${phone}</a>
            ${fbBtnHtml}
            <button onclick="resetFilters()" class="btn btn-secondary btn-sm">✕ সব পণ্য দেখুন</button>
          </div>
        </div>
        <p style="margin:0;font-size:0.95rem;color:var(--text);">${story}</p>
        <div class="shop-header-details">
          ${deliveryCharge ? `<div class="shop-detail-item"><span>🚚</span> ডেলিভারি চার্জ: <strong>৳ ${toBanglaNumber(deliveryCharge)}</strong></div>` : ''}
          ${bkash ? `<div class="shop-detail-item"><span>💳</span> বিকাশ: <strong>${bkash}</strong></div>` : ''}
          ${nagad ? `<div class="shop-detail-item"><span>💳</span> নগদ: <strong>${nagad}</strong></div>` : ''}
          ${addressDetailHtml}
          <div class="shop-detail-item"><span>🛡️</span> ভেরিফাইড ঘরোয়া সেলার</div>
        </div>
      </div>
    `;
  }

  renderProducts();

  const section = document.getElementById('products');
  if (section) {
    const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
    const y = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

// ==================== REVIEWS ====================

function toggleReviewForm(show) {
  const form = document.getElementById('review-form');
  const btn = document.getElementById('toggle-review-btn');
  if (!form) return;

  const willShow = show !== undefined ? show : (form.style.display === 'none');
  form.style.display = willShow ? 'block' : 'none';
  if (btn) btn.textContent = willShow ? '✕ বন্ধ করুন' : '✍️ রিভিউ দিন';
}

function setReviewRating(rating) {
  const hiddenInput = document.getElementById('review-rating-val');
  if (hiddenInput) hiddenInput.value = rating;

  const stars = document.querySelectorAll('#star-rating-select span');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.textContent = '★';
      star.style.color = '#f39c12';
    } else {
      star.textContent = '☆';
      star.style.color = 'var(--text-muted)';
    }
  });
}

async function handleReviewSubmit(e) {
  e.preventDefault();
  const modalTitle = document.getElementById('modal-title');
  const productId = modalTitle?.dataset?.productId;
  if (!productId) {
    showToast('প্রোডাক্ট পাওয়া যায়নি');
    return;
  }

  const name = document.getElementById('review-user-name')?.value.trim() || 'শুভাকাঙ্ক্ষী ক্রেতা';
  const rating = parseInt(document.getElementById('review-rating-val')?.value) || 5;
  const text = document.getElementById('review-user-text')?.value.trim();

  if (!text) {
    showToast('আপনার মন্তব্য লিখুন');
    return;
  }

  const submitBtn = document.getElementById('submit-review-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'জমা হচ্ছে...';
  }

  try {
    if (typeof db === 'undefined') throw new Error('Firebase সংযোগ নেই');

    await db.collection('products').doc(productId).collection('reviews').add({
      name,
      rating,
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast('ধন্যবাদ! আপনার রিভিউ সফলভাবে জমা হয়েছে ⭐');
    document.getElementById('review-form')?.reset();
    setReviewRating(5);
    toggleReviewForm(false);
    loadProductReviews(productId);
  } catch (error) {
    console.error('Review submit error:', error);
    showToast('রিভিউ জমা দিতে সমস্যা হয়েছে');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'জমা দিন';
    }
  }
}

async function loadProductReviews(productId) {
  const container = document.getElementById('modal-reviews');
  if (!container || typeof db === 'undefined') return;
  container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">রিভিউ লোড হচ্ছে...</p>';

  try {
    const snap = await db.collection('products').doc(productId).collection('reviews').orderBy('createdAt', 'desc').limit(10).get();
    if (snap.empty) {
      container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;padding:0.5rem 0;">এখনো কোনো রিভিউ নেই। প্রথম রিভিউ দিন!</p>';
      return;
    }
    let html = '';
    snap.forEach(doc => {
      const r = doc.data();
      const rating = r.rating || 5;
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
      let dateStr = '';
      if (r.createdAt) {
        const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
        dateStr = ` · ${formatBanglaDate(d)}`;
      }
      html += `
        <div style="padding:0.75rem 0;border-bottom:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.25rem;">
            <strong>${r.name || 'Anonymous'}</strong>
            <span style="color:#f39c12;font-size:0.95rem;">${stars}</span>
          </div>
          <p style="color:var(--text);font-size:0.9rem;margin:0.25rem 0;">${r.text || ''}</p>
          <small style="color:var(--text-muted);font-size:0.75rem;">${dateStr}</small>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (e) {
    console.error('Review load error:', e);
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">রিভিউ লোড করা যায়নি</p>';
  }
}

function submitReview(productId) {
  toggleReviewForm(true);
}

// ==================== DIRECT ORDER HANDLING ====================

let currentOrderProduct = null;

function openOrderModal() {
  const modalTitle = document.getElementById('modal-title');
  if (!modalTitle) return;

  const productId = modalTitle.dataset.productId;
  const product = PRODUCTS.find(p => String(p.id) === String(productId));

  currentOrderProduct = product || {
    id: productId,
    name: modalTitle.dataset.productName || 'পণ্য',
    price: parseInt(modalTitle.dataset.productPrice) || 0,
    image: modalTitle.dataset.productImage || 'assets/achar.jpg',
    sellerId: modalTitle.dataset.sellerId || '',
    sellerPhone: ''
  };

  document.getElementById('order-product-id').value = currentOrderProduct.id;
  document.getElementById('order-seller-id').value = currentOrderProduct.sellerId || '';
  document.getElementById('order-summary-title').textContent = currentOrderProduct.name;
  document.getElementById('order-summary-price').textContent = formatPrice(currentOrderProduct.price);
  document.getElementById('order-summary-img').src = currentOrderProduct.image;
  document.getElementById('order-quantity').value = 1;

  // Auto-populate area select in order modal
  const areaSelect = document.getElementById('order-buyer-area');
  if (areaSelect && areaSelect.options.length <= 1) {
    AREAS.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.name;
      opt.textContent = a.name;
      areaSelect.appendChild(opt);
    });
  }

  updateOrderTotal();

  const orderModal = document.getElementById('order-modal');
  if (orderModal) {
    orderModal.style.display = 'flex';
    orderModal.classList.add('active');
  }
}

function closeOrderModal() {
  const orderModal = document.getElementById('order-modal');
  if (orderModal) {
    orderModal.classList.remove('active');
    setTimeout(() => { orderModal.style.display = 'none'; }, 250);
  }
}

function updateOrderTotal() {
  if (!currentOrderProduct) return;
  const qtyInput = document.getElementById('order-quantity');
  const qty = Math.max(1, parseInt(qtyInput?.value) || 1);
  const total = currentOrderProduct.price * qty;
  const totalEl = document.getElementById('order-total-amount');
  if (totalEl) totalEl.textContent = formatPrice(total);
}

async function handleDirectOrderSubmit(e) {
  e.preventDefault();
  if (!currentOrderProduct) return;

  const buyerName = document.getElementById('order-buyer-name')?.value.trim();
  const buyerPhone = document.getElementById('order-buyer-phone')?.value.trim();
  const quantity = parseInt(document.getElementById('order-quantity')?.value) || 1;
  const buyerArea = document.getElementById('order-buyer-area')?.value;
  const buyerAddress = document.getElementById('order-buyer-address')?.value.trim();
  const paymentMethod = document.querySelector('input[name="order-payment"]:checked')?.value || 'cod';

  if (!buyerName || !buyerPhone || !buyerArea || !buyerAddress) {
    showToast('সবগুলো প্রয়োজনীয় তথ্য পূরণ করুন');
    return;
  }

  const submitBtn = document.getElementById('order-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'অর্ডার প্রক্রিয়াধীন...';
  }

  const totalAmount = currentOrderProduct.price * quantity;

  const orderData = {
    productId: currentOrderProduct.id,
    productName: currentOrderProduct.name,
    productImage: currentOrderProduct.image || '',
    unitPrice: currentOrderProduct.price,
    quantity,
    totalAmount,
    buyerName,
    buyerPhone,
    buyerArea,
    buyerAddress,
    paymentMethod,
    sellerId: currentOrderProduct.sellerId || '',
    sellerName: currentOrderProduct.seller || '',
    status: 'pending',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (typeof db !== 'undefined') {
      await db.collection('orders').add(orderData);
    }

    closeOrderModal();
    closeModal();
    showToast(`🎉 অর্ডার সম্পন্ন হয়েছে! ধন্যবাদ ${buyerName}! বিক্রেতা শীঘ্রই আপনার সাথে যোগাযোগ করবেন।`);
    document.getElementById('direct-order-form')?.reset();

    // Offer to ping seller on WhatsApp if sellerPhone exists
    if (currentOrderProduct.sellerPhone) {
      let ph = currentOrderProduct.sellerPhone;
      if (!ph.startsWith('88')) ph = '88' + ph;
      const payText = paymentMethod === 'bkash' ? 'বিকাশ/নগদ' : 'ক্যাশ অন ডেলিভারি';
      const msg = encodeURIComponent(`হ্যালো, আমি ঘরোয়া থেকে "${currentOrderProduct.name}" (${toBanglaNumber(quantity)}টি) অর্ডার করেছি।\nমোট: ${formatPrice(totalAmount)}\nপেমেন্ট: ${payText}\nনাম: ${buyerName}\nফোন: ${buyerPhone}\nঠিকানা: ${buyerAddress}, ${buyerArea}`);
      setTimeout(() => {
        if (confirm('আপনার অর্ডার সফল হয়েছে! আপনি কি বিক্রেতাকে WhatsApp-এ অর্ডার বিবরণ পাঠাতে চান?')) {
          window.open(`https://wa.me/${ph}?text=${msg}`, '_blank');
        }
      }, 500);
    }
  } catch (error) {
    console.error('Order placement error:', error);
    showToast('অর্ডার সম্পন্ন করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✅ অর্ডার নিশ্চিত করুন';
    }
  }
}

