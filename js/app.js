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

// All data now loads from Firebase Firestore via loadFirebaseData()
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
  { id: 'food', name: 'ঘরে তৈরি খাবার', icon: '🍯', count: 342, desc: 'আচার, পিঠা, মিষ্টি, ভর্তা' },
  { id: 'handicraft', name: 'হস্তশিল্প', icon: '🧵', count: 187, desc: 'নকশিকাঁথা, মাটির পাত্র, বাঁশের কাজ' },
  { id: 'clothing', name: 'ঐতিহ্যবাহী পোশাক', icon: '👗', count: 156, desc: 'জামদানি, টাঙ্গাইল, ব্লক প্রিন্ট' },
  { id: 'art', name: 'আর্ট ও ডিজাইন', icon: '🎨', count: 98, desc: 'রিকশা আর্ট, আলপনা, ক্যালিগ্রাফি' },
  { id: 'natural', name: 'প্রাকৃতিক প্রোডাক্ট', icon: '🌿', count: 124, desc: 'ঘানির তেল, মধু, ভেষজ সাবান' },
  { id: 'gift', name: 'কাস্টম গিফট', icon: '🎁', count: 76, desc: 'গিফট বক্স, পার্সোনালাইজড আইটেম' }
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
let searchQuery = '';

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initMobileMenu();
  initSmoothScroll();
  initScrollAnimations();
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

  initCountdown();
  initCounterAnimation();
  initSellerForm();
  initModalEvents();
});

// ==================== FIREBASE DATA LOADING ====================

async function loadFirebaseData() {
  // Check if Firebase is available
  if (typeof db === 'undefined') return;

  try {
    // Load products from Firestore
    const productsSnap = await db.collection('products').get();

    if (!productsSnap.empty) {
      const firebaseProducts = [];
      productsSnap.forEach(doc => {
        const data = doc.data();
        firebaseProducts.push({
          id: doc.id,
          name: data.name || '',
          price: parseInt(data.price) || 0,
          category: data.category || '',
          area: (data.area || '').toLowerCase(),
          areaName: data.areaName || data.area || '',
          seller: data.sellerName || data.seller || '',
          sellerId: data.seller || '',
          sellerPhone: data.sellerPhone || '',
          rating: parseFloat(data.rating) || 4.5,
          reviews: parseInt(data.reviews) || 0,
          image: data.imageUrl || data.image || 'assets/achar.jpg',
          story: data.story || '',
          badge: data.badge || '',
          featured: data.featured || false
        });
      });
      console.log('🔥 Firebase products:', firebaseProducts.length);
      // Firebase products replace hardcoded data
      PRODUCTS = [...firebaseProducts, ...PRODUCTS];
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
      // Approved Firebase haats replace hardcoded
      HAATS = [...firebaseHaats, ...HAATS];
    }

    console.log(`✅ Firebase: ${productsSnap.size} products, haats loaded`);
  } catch (error) {
    console.warn('Firebase load failed, using hardcoded data:', error.message);
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
      (p.areaName || '').includes(q) ||
      (p.story || '').toLowerCase().includes(q)
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

  grid.innerHTML = filtered.map(p => `
    <div class="product-card glass animate-on-scroll" onclick="openProductModal('${p.id}')">
      <div class="product-image">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.badge ? `<span class="product-badge">${p.badge}</span>` : ''}
        <div class="product-overlay">
          <span>বিস্তারিত দেখুন →</span>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-seller">🏪 ${p.seller} · 📍 ${p.areaName}</p>
        <p class="product-story-snippet">${(p.story || '').substring(0, 60)}...</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(p.price)}</span>
          <span class="product-rating">
            <span class="stars">${generateStars(p.rating)}</span>
            <span class="review-count">${toBanglaNumber(p.rating)} (${toBanglaNumber(p.reviews)})</span>
          </span>
        </div>
      </div>
    </div>
  `).join('');

  // Re-observe new elements
  initScrollAnimations();
}

// ==================== RENDER: HAATS ====================

function renderHaats() {
  const grid = document.getElementById('haat-grid');
  if (!grid) return;

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
    <div class="faq-item glass animate-on-scroll">
      <button class="faq-question" onclick="toggleFAQ(this)" aria-expanded="false">
        <span>${faq.q}</span>
        <span class="faq-icon">+</span>
      </button>
      <div class="faq-answer">
        <p>${faq.a}</p>
      </div>
    </div>
  `).join('');
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
  searchQuery = '';
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
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
  document.getElementById('modal-rating').innerHTML = `${generateStars(product.rating)} ${toBanglaNumber(product.rating)} (${toBanglaNumber(product.reviews)} রিভিউ)`;
  document.getElementById('modal-badge').textContent = product.badge || '';
  document.getElementById('modal-story-text').textContent = product.story;
  document.getElementById('seller-name').textContent = product.seller;
  document.getElementById('seller-area').textContent = `📍 ${product.areaName}`;
  document.getElementById('seller-avatar').textContent = product.seller.charAt(0);

  // WhatsApp link - use seller's phone if available
  const waMsg = encodeURIComponent(`হ্যালো, আমি ঘরোয়া থেকে "${product.name}" পণ্যটি কিনতে চাই। মূল্য: ${formatPrice(product.price)}`);
  let sellerPhone = product.sellerPhone || '';
  if (sellerPhone && !sellerPhone.startsWith('88')) {
    sellerPhone = '88' + sellerPhone;
  }
  const waLink = sellerPhone 
    ? `https://wa.me/${sellerPhone}?text=${waMsg}` 
    : `https://wa.me/?text=${waMsg}`;
  document.getElementById('modal-whatsapp').href = waLink;
  document.getElementById('modal-messenger').href = `https://m.me/ghoroa.bd`;

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
      option.value = area.id;
      option.textContent = area.name;
      areaSelect.appendChild(option);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('seller-name-input')?.value;
    showToast(`🎉 অভিনন্দন ${name}! আপনার দোকান সফলভাবে রেজিস্ট্রেশন হয়েছে!`);
    form.reset();
  });
}
