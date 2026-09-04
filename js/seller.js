/**
 * seller.js - Seller Panel Logic for Ghoroa
 * Handles seller authentication, registration, product management
 */

// ==========================================
// Constants
// ==========================================

const CATEGORIES = [
  { id: 'food', name: 'ঘরোয়া খাবার ও মিষ্টি', emoji: '🍯' },
  { id: 'bakery', name: 'বেকারি ও পেস্ট্রি', emoji: '🍰' },
  { id: 'spices', name: 'মসলা, খাঁটি ঘি ও তেল', emoji: '🌶️' },
  { id: 'handicraft', name: 'হস্তশিল্প ও নকশিকাঁথা', emoji: '🧵' },
  { id: 'clothing', name: 'পোশাক ও ফ্যাশন', emoji: '👗' },
  { id: 'organic', name: 'ভেষজ ও অর্গানিক পণ্য', emoji: '🌿' },
  { id: 'art', name: 'শিল্প, আর্ট ও ডেকোরেশন', emoji: '🎨' },
  { id: 'gift', name: 'কাস্টম গিফট ও প্যাকেজ', emoji: '🎁' }
];

const DMP_AREAS = [
  "Adabor", "Badda", "Banasree", "Bangshal", "Bimanbandar", "Cantonment",
  "Chawkbazar", "Dakshinkhan", "Darus Salam", "Demra", "Dhanmondi", "Gendaria",
  "Gulshan", "Hatirjheel", "Hazaribagh", "Jatrabari", "Kadamtali", "Kafrul",
  "Kalabagan", "Kamrangirchar", "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh",
  "Mirpur Model", "Mohammadpur", "Motijheel", "Mugda", "New Market", "Pallabi",
  "Paltan", "Panthapath", "Ramna", "Rampura", "Sabujbagh", "Shah Ali",
  "Shahbagh", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon",
  "Tejgaon Industrial Area", "Turag", "Uttara East", "Uttara West",
  "Vashantek", "Vatara", "Wari"
].sort();

// ==========================================
// Global State
// ==========================================

let currentUser = null;
let sellerProfile = null;
let myProducts = [];
let myOrders = [];
let currentOrderFilter = 'all';
let productSearchQuery = '';
let productCategoryFilter = 'all';
let currentImageFile = null;
let isEditing = false;

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  setupEventListeners();
  populateAreaSelects();
  populateCategorySelect();
});

// ==========================================
// Authentication
// ==========================================

function initAuth() {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      await checkSellerProfile(user);
    } else {
      currentUser = null;
      sellerProfile = null;
      showScreen('login-screen');
    }
  });
}

async function loginWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
  } catch (error) {
    console.error("Login error:", error);
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
      errorEl.textContent = 'লগইন ব্যর্থ: ' + error.message;
      errorEl.style.display = 'block';
    }
  }
}

async function logout() {
  try {
    await auth.signOut();
    showToast('লগআউট সফল', 'success');
  } catch (error) {
    console.error("Logout error:", error);
  }
}

// ==========================================
// Seller Profile Management
// ==========================================

async function checkSellerProfile(user) {
  try {
    const doc = await db.collection('sellers').doc(user.uid).get();

    if (!doc.exists) {
      // New seller - show registration
      showScreen('registration-screen');
      // Check query params or local storage for pre-filled data from landing page
      const urlParams = new URLSearchParams(window.location.search);
      let prefill = {};
      try {
        prefill = JSON.parse(localStorage.getItem('ghoroa_pending_seller') || '{}');
      } catch (err) {}

      const nameInput = document.getElementById('reg-name');
      if (nameInput) nameInput.value = urlParams.get('name') || prefill.name || user.displayName || '';
      
      const phoneInput = document.getElementById('reg-phone');
      if (phoneInput && (urlParams.get('phone') || prefill.phone)) {
        phoneInput.value = urlParams.get('phone') || prefill.phone;
      }

      const shopNameInput = document.getElementById('reg-shop-name');
      if (shopNameInput && (urlParams.get('shopName') || prefill.shopName || prefill.name)) {
        shopNameInput.value = urlParams.get('shopName') || prefill.shopName || `${prefill.name || user.displayName || 'আমার'} কিচেন`;
      }

      const areaInput = document.getElementById('reg-area');
      if (areaInput && (urlParams.get('area') || prefill.area)) {
        areaInput.value = urlParams.get('area') || prefill.area;
      }

      const storyInput = document.getElementById('reg-story');
      if (storyInput && (urlParams.get('story') || prefill.story)) {
        storyInput.value = urlParams.get('story') || prefill.story;
      }
    } else {
      sellerProfile = doc.data();

      if (sellerProfile.approved === false) {
        // Pending approval
        showScreen('pending-screen');
      } else {
        // Approved or no approval check - show dashboard
        showScreen('seller-app');
        setupDashboard(user);
        initSellerPanel();
      }
    }
  } catch (error) {
    console.error("Error checking seller profile:", error);
    showToast('প্রোফাইল লোড করতে সমস্যা', 'error');
  }
}

async function registerSeller(e) {
  e.preventDefault();

  const shopName = document.getElementById('reg-shop-name').value.trim();
  const name = document.getElementById('reg-name').value.trim();
  const phone = document.getElementById('reg-phone').value.trim();
  const area = document.getElementById('reg-area').value;
  const story = document.getElementById('reg-story').value.trim();

  if (!shopName || !name || !phone || !area) {
    showToast('সব প্রয়োজনীয় ফিল্ড পূরণ করুন', 'error');
    return;
  }

  try {
    await db.collection('sellers').doc(currentUser.uid).set({
      shopName,
      name,
      email: currentUser.email,
      phone,
      area,
      story,
      photoURL: currentUser.photoURL || '',
      approved: true, // Auto-approve for now
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    showToast('রেজিস্ট্রেশন সফল! 🎉', 'success');

    // Reload profile
    await checkSellerProfile(currentUser);
  } catch (error) {
    console.error("Registration error:", error);
    showToast('রেজিস্ট্রেশন ব্যর্থ: ' + error.message, 'error');
  }
}

function setupDashboard(user) {
  const userNameEl = document.getElementById('user-name');
  const userAvatarEl = document.getElementById('user-avatar');
  if (userNameEl) userNameEl.textContent = sellerProfile.shopName || user.displayName || 'সেলার';
  if (userAvatarEl) userAvatarEl.src = user.photoURL || 'https://via.placeholder.com/40';

  // Shareable shop URL
  const baseUrl = window.location.href.split('seller.html')[0];
  const shopUrl = `${baseUrl}index.html?shop=${user.uid}`;
  const shopUrlDisplay = document.getElementById('shop-url-display');
  if (shopUrlDisplay) shopUrlDisplay.textContent = shopUrl;
  const visitBtn = document.getElementById('visit-shop-url-btn');
  if (visitBtn) visitBtn.href = shopUrl;
}

// ==========================================
// Seller Panel Init
// ==========================================

async function initSellerPanel() {
  switchTab('dashboard');
  loadShopSettings();
}

// ==========================================
// Tab Navigation
// ==========================================

function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-tab') === tabName) {
      item.classList.add('active');
    }
  });

  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
    if (tab.getAttribute('data-tab') === tabName) {
      tab.classList.add('active');
      tab.style.display = 'block';
    }
  });

  // Close sidebar on mobile
  document.querySelector('.sidebar')?.classList.remove('open', 'show');

  // Update page title
  const titles = {
    'dashboard': 'ড্যাশবোর্ড',
    'my-orders': 'অর্ডার খাতা',
    'my-products': 'আমার প্রোডাক্ট',
    'my-shop': 'দোকান সেটিংস',
    'my-haats': 'আমার হাটবার'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[tabName] || 'ড্যাশবোর্ড';

  // Load data
  if (tabName === 'dashboard') loadDashboardStats();
  if (tabName === 'my-orders') loadMyOrders();
  if (tabName === 'my-products') loadMyProducts();
  if (tabName === 'my-haats') loadMyHaats();
}

// ==========================================
// Dashboard Stats
// ==========================================

async function loadDashboardStats() {
  try {
    const [productsSnap, ordersSnap] = await Promise.all([
      db.collection('products').where('seller', '==', currentUser.uid).get(),
      db.collection('orders').where('sellerId', '==', currentUser.uid).get()
    ]);

    const products = [];
    productsSnap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

    myOrders = [];
    ordersSnap.forEach(doc => myOrders.push({ id: doc.id, ...doc.data() }));

    const statProducts = document.getElementById('stat-my-products');
    const statFeatured = document.getElementById('stat-featured');
    const statViews = document.getElementById('stat-views');
    const statOrders = document.getElementById('stat-orders');

    if (statProducts) statProducts.textContent = products.length;
    if (statFeatured) statFeatured.textContent = products.filter(p => p.featured).length;
    if (statViews) statViews.textContent = products.reduce((sum, p) => sum + (p.views || 0), 0);
    if (statOrders) statOrders.textContent = myOrders.length;

    // Sidebar badge count for pending orders
    const badgeEl = document.getElementById('orders-badge-count');
    const pendingOrders = myOrders.filter(o => o.status === 'pending');
    if (badgeEl) {
      if (pendingOrders.length > 0) {
        badgeEl.textContent = pendingOrders.length;
        badgeEl.style.display = 'inline-block';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    // Dynamic Recent Activity
    renderRecentActivity(products, myOrders);
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}

function renderRecentActivity(products, orders) {
  const container = document.getElementById('recent-activity');
  if (!container) return;

  const activities = [];

  products.forEach(p => {
    activities.push({
      type: 'product',
      title: `📦 প্রোডাক্ট যোগ: "${p.name || ''}"`,
      time: p.createdAt ? (p.createdAt.toDate ? p.createdAt.toDate() : new Date(p.createdAt)) : new Date(),
      desc: `৳${p.price || 0}`
    });
  });

  orders.forEach(o => {
    activities.push({
      type: 'order',
      title: `📋 নতুন অর্ডার: ${o.customerName || 'ক্রেতা'} (${o.productName || 'পণ্য'})`,
      time: o.createdAt ? (o.createdAt.toDate ? o.createdAt.toDate() : new Date(o.createdAt)) : new Date(),
      desc: `৳${o.totalPrice || o.price || 0} · স্ট্যাটাস: ${o.status || 'পেন্ডিং'}`
    });
  });

  activities.sort((a, b) => b.time - a.time);

  if (activities.length === 0) {
    container.innerHTML = '<p>🚀 প্রোডাক্ট যোগ করে বিক্রি শুরু করুন!</p>';
    return;
  }

  container.className = 'activity-list';
  container.innerHTML = activities.slice(0, 6).map(act => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--border);">
      <div>
        <strong style="display:block;font-size:0.95rem;">${act.title}</strong>
        <small style="color:var(--text-muted);">${act.desc}</small>
      </div>
      <small style="color:var(--text-muted);">${act.time.toLocaleDateString('bn-BD')}</small>
    </div>
  `).join('');
}

// ==========================================
// Products CRUD
// ==========================================

async function loadMyProducts() {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">লোড হচ্ছে...</td></tr>';

  try {
    const snapshot = await db.collection('products')
      .where('seller', '==', currentUser.uid)
      .get();

    myProducts = [];
    snapshot.forEach(doc => {
      myProducts.push({ id: doc.id, ...doc.data() });
    });

    renderProductsTable(myProducts);
  } catch (error) {
    console.error("Error loading products:", error);
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">প্রোডাক্ট লোড করতে ব্যর্থ</td></tr>';
    showToast('প্রোডাক্ট লোড করতে সমস্যা', 'error');
  }
}

function renderProductsTable(products) {
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  let filtered = [...products];
  if (productSearchQuery) {
    const q = productSearchQuery.toLowerCase();
    filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(q) || (p.story || '').toLowerCase().includes(q));
  }
  if (productCategoryFilter !== 'all') {
    filtered = filtered.filter(p => p.category === productCategoryFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">কোনো প্রোডাক্ট পাওয়া যায়নি। ➕ নতুন প্রোডাক্ট যোগ করুন!</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(product => {
    const cat = CATEGORIES.find(c => c.id === product.category);
    const catName = cat ? `${cat.emoji} ${cat.name}` : (product.category || 'N/A');

    let stockBadge = '<span class="status-badge approved">✅ ইন স্টক</span>';
    if (product.stockStatus === 'made_to_order') {
      stockBadge = '<span class="status-badge pending">⏳ প্রি-অর্ডার</span>';
    } else if (product.stockStatus === 'out_of_stock') {
      stockBadge = '<span class="status-badge rejected">❌ স্টক শেষ</span>';
    }

    const unitDisplay = product.unit ? `<br><small style="color:var(--text-muted);">${product.unit}</small>` : '';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <img src="${product.imageUrl || 'assets/achar.jpg'}"
             alt="${product.name}"
             style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
      </td>
      <td><strong>${product.name || 'Unnamed'}</strong></td>
      <td>৳${product.price || 0}${unitDisplay}</td>
      <td>${catName}</td>
      <td>${stockBadge}</td>
      <td><span class="status-badge approved">লাইভ</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditProductModal('${product.id}')" title="এডিট">
          ✏️ এডিট
        </button>
        <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);" onclick="deleteProduct('${product.id}')" title="ডিলিট">
          🗑️ ডিলিট
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ==========================================
// Product Modal
// ==========================================

function openAddProductModal() {
  isEditing = false;
  const form = document.getElementById('product-form');
  if (form) form.reset();

  document.getElementById('product-id').value = '';
  document.getElementById('modal-title').textContent = 'নতুন প্রোডাক্ট যোগ করুন';

  const unitInput = document.getElementById('product-unit');
  if (unitInput) unitInput.value = '';
  const stockInput = document.getElementById('product-stock-status');
  if (stockInput) stockInput.value = 'in_stock';

  const preview = document.getElementById('image-preview');
  if (preview) {
    preview.style.display = 'none';
  }
  const placeholder = document.getElementById('upload-placeholder');
  if (placeholder) placeholder.style.display = 'block';

  currentImageFile = null;

  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

function openEditProductModal(productId) {
  const product = myProducts.find(p => p.id === productId);
  if (!product) return;

  isEditing = true;
  document.getElementById('product-id').value = product.id;
  document.getElementById('modal-title').textContent = 'প্রোডাক্ট এডিট করুন';

  document.getElementById('product-name').value = product.name || '';
  document.getElementById('product-price').value = product.price || '';
  document.getElementById('product-category').value = product.category || '';
  document.getElementById('product-story').value = product.story || '';
  document.getElementById('product-badge').value = product.badge || '';

  const unitInput = document.getElementById('product-unit');
  if (unitInput) unitInput.value = product.unit || '';
  const stockInput = document.getElementById('product-stock-status');
  if (stockInput) stockInput.value = product.stockStatus || 'in_stock';

  const preview = document.getElementById('image-preview');
  if (preview && product.imageUrl) {
    preview.src = product.imageUrl;
    preview.style.display = 'block';
    const placeholder = document.getElementById('upload-placeholder');
    if (placeholder) placeholder.style.display = 'none';
  }

  currentImageFile = null;

  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

function closeModal() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
}

// ==========================================
// Save Product
// ==========================================

async function saveProduct(e) {
  e.preventDefault();

  const productId = document.getElementById('product-id').value;
  const name = document.getElementById('product-name').value.trim();
  const price = parseInt(document.getElementById('product-price').value);
  const unit = document.getElementById('product-unit')?.value.trim() || '';
  const stockStatus = document.getElementById('product-stock-status')?.value || 'in_stock';
  const category = document.getElementById('product-category').value;
  const story = document.getElementById('product-story').value.trim();
  const badge = document.getElementById('product-badge').value;

  if (!name || !price || !category || !story) {
    showToast('সব প্রয়োজনীয় ফিল্ড পূরণ করুন', 'error');
    return;
  }

  try {
    let imageUrl = '';

    // Upload image if selected
    if (currentImageFile && storage) {
      const storageRef = storage.ref(`products/${Date.now()}_${currentImageFile.name}`);
      const uploadTask = await storageRef.put(currentImageFile);
      imageUrl = await uploadTask.ref.getDownloadURL();
    }

    const productData = {
      name,
      price,
      unit,
      stockStatus,
      category,
      area: sellerProfile.area || '',
      areaName: sellerProfile.area || '',
      seller: currentUser.uid,
      sellerName: sellerProfile.name || currentUser.displayName || '',
      sellerPhone: sellerProfile.phone || '',
      shopName: sellerProfile.shopName || '',
      shopBkash: sellerProfile.bkash || '',
      shopNagad: sellerProfile.nagad || '',
      story,
      badge,
      featured: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (imageUrl) {
      productData.imageUrl = imageUrl;
    }

    if (isEditing && productId) {
      // Update existing
      await db.collection('products').doc(productId).update(productData);
      showToast('প্রোডাক্ট আপডেট হয়েছে! ✅', 'success');
    } else {
      // Create new
      productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      productData.views = 0;
      await db.collection('products').add(productData);
      showToast('প্রোডাক্ট যোগ হয়েছে! 🎉', 'success');
    }

    closeModal();
    loadMyProducts();
    loadDashboardStats();
  } catch (error) {
    console.error("Save product error:", error);
    showToast('সেভ করতে সমস্যা: ' + error.message, 'error');
  }
}

// ==========================================
// Delete Product
// ==========================================

async function deleteProduct(productId) {
  if (!confirm('আপনি কি নিশ্চিত এই প্রোডাক্ট ডিলিট করতে চান?')) return;

  try {
    await db.collection('products').doc(productId).delete();
    showToast('প্রোডাক্ট ডিলিট হয়েছে', 'success');
    loadMyProducts();
    loadDashboardStats();
  } catch (error) {
    console.error("Delete error:", error);
    showToast('ডিলিট করতে সমস্যা', 'error');
  }
}

// ==========================================
// Image Upload
// ==========================================

function handleImageSelection(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('ছবি ৫ MB এর বেশি হতে পারবে না', 'error');
    return;
  }

  if (!file.type.startsWith('image/')) {
    showToast('শুধুমাত্র ছবি ফাইল আপলোড করুন', 'error');
    return;
  }

  currentImageFile = file;

  const reader = new FileReader();
  reader.onload = (event) => {
    const preview = document.getElementById('image-preview');
    if (preview) {
      preview.src = event.target.result;
      preview.style.display = 'block';
    }
    const placeholder = document.getElementById('upload-placeholder');
    if (placeholder) placeholder.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ==========================================
// Shop Settings
// ==========================================

function loadShopSettings() {
  if (!sellerProfile) return;

  const shopName = document.getElementById('shop-name');
  const shopPhone = document.getElementById('shop-phone');
  const shopArea = document.getElementById('shop-area');
  const shopStory = document.getElementById('shop-story');

  if (shopName) shopName.value = sellerProfile.shopName || '';
  if (shopPhone) shopPhone.value = sellerProfile.phone || '';
  if (shopArea) shopArea.value = sellerProfile.area || '';
  if (shopStory) shopStory.value = sellerProfile.story || '';

  // Branding & Social
  const shopLogo = document.getElementById('shop-logo');
  const shopCover = document.getElementById('shop-cover');
  const shopFacebook = document.getElementById('shop-facebook');
  const shopInstagram = document.getElementById('shop-instagram');
  const shopAddress = document.getElementById('shop-address');

  if (shopLogo) shopLogo.value = sellerProfile.logoUrl || '';
  if (shopCover) shopCover.value = sellerProfile.coverUrl || '';
  if (shopFacebook) shopFacebook.value = sellerProfile.facebook || '';
  if (shopInstagram) shopInstagram.value = sellerProfile.instagram || '';
  if (shopAddress) shopAddress.value = sellerProfile.detailedAddress || '';

  // Payment & Delivery
  const bkash = document.getElementById('shop-bkash');
  const nagad = document.getElementById('shop-nagad');
  const rocket = document.getElementById('shop-rocket');
  const deliveryCharge = document.getElementById('shop-delivery-charge');
  const deliveryInfo = document.getElementById('shop-delivery-info');
  const pickupAvailable = document.getElementById('shop-pickup-available');

  if (bkash) bkash.value = sellerProfile.bkash || '';
  if (nagad) nagad.value = sellerProfile.nagad || '';
  if (rocket) rocket.value = sellerProfile.rocket || '';
  if (deliveryCharge) deliveryCharge.value = sellerProfile.deliveryCharge || '';
  if (deliveryInfo) deliveryInfo.value = sellerProfile.deliveryInfo || '';
  if (pickupAvailable) pickupAvailable.checked = !!sellerProfile.pickupAvailable;
}

async function saveShopSettings(e) {
  e.preventDefault();

  const shopName = document.getElementById('shop-name').value.trim();
  const phone = document.getElementById('shop-phone').value.trim();
  const area = document.getElementById('shop-area').value;
  const story = document.getElementById('shop-story').value.trim();

  const logoUrl = document.getElementById('shop-logo')?.value.trim() || '';
  const coverUrl = document.getElementById('shop-cover')?.value.trim() || '';
  const facebook = document.getElementById('shop-facebook')?.value.trim() || '';
  const instagram = document.getElementById('shop-instagram')?.value.trim() || '';
  const detailedAddress = document.getElementById('shop-address')?.value.trim() || '';

  const bkash = document.getElementById('shop-bkash')?.value.trim() || '';
  const nagad = document.getElementById('shop-nagad')?.value.trim() || '';
  const rocket = document.getElementById('shop-rocket')?.value.trim() || '';
  const deliveryCharge = parseInt(document.getElementById('shop-delivery-charge')?.value) || 0;
  const deliveryInfo = document.getElementById('shop-delivery-info')?.value.trim() || '';
  const pickupAvailable = !!document.getElementById('shop-pickup-available')?.checked;

  try {
    const updateData = {
      shopName,
      phone,
      area,
      story,
      logoUrl,
      coverUrl,
      facebook,
      instagram,
      detailedAddress,
      bkash,
      nagad,
      rocket,
      deliveryCharge,
      deliveryInfo,
      pickupAvailable,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('sellers').doc(currentUser.uid).update(updateData);

    Object.assign(sellerProfile, updateData);

    showToast('দোকান সেটিংস সেভ হয়েছে! ✅', 'success');
    setupDashboard(currentUser);
  } catch (error) {
    console.error("Save settings error:", error);
    showToast('সেভ করতে সমস্যা', 'error');
  }
}

// ==========================================
// Order Khata Management
// ==========================================

async function loadMyOrders() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">অর্ডার লোড হচ্ছে...</td></tr>';

  try {
    const snapshot = await db.collection('orders')
      .where('sellerId', '==', currentUser.uid)
      .get();

    myOrders = [];
    snapshot.forEach(doc => {
      myOrders.push({ id: doc.id, ...doc.data() });
    });

    // Sort by createdAt desc
    myOrders.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const tB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return tB - tA;
    });

    updateOrderFilterCounts();
    renderOrdersTable();
  } catch (error) {
    console.error('Error loading orders:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">অর্ডার লোড করতে সমস্যা হয়েছে</td></tr>';
  }
}

function updateOrderFilterCounts() {
  const countAll = document.getElementById('count-all-orders');
  const countPending = document.getElementById('count-pending-orders');
  const countShipped = document.getElementById('count-shipped-orders');
  const countDelivered = document.getElementById('count-delivered-orders');
  const countCancelled = document.getElementById('count-cancelled-orders');

  if (countAll) countAll.textContent = myOrders.length;
  if (countPending) countPending.textContent = myOrders.filter(o => o.status === 'pending').length;
  if (countShipped) countShipped.textContent = myOrders.filter(o => o.status === 'shipped').length;
  if (countDelivered) countDelivered.textContent = myOrders.filter(o => o.status === 'delivered').length;
  if (countCancelled) countCancelled.textContent = myOrders.filter(o => o.status === 'cancelled').length;
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  let filtered = [...myOrders];
  if (currentOrderFilter !== 'all') {
    filtered = filtered.filter(o => o.status === currentOrderFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">কোনো অর্ডার পাওয়া যায়নি</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  filtered.forEach(order => {
    let dateStr = 'আজ';
    if (order.createdAt) {
      const d = order.createdAt.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      dateStr = d.toLocaleDateString('bn-BD');
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><small>${dateStr}</small></td>
      <td>
        <strong>${order.customerName || 'N/A'}</strong><br>
        <a href="tel:${order.customerPhone}" style="font-size:0.85rem;">📞 ${order.customerPhone || ''}</a>
      </td>
      <td>${order.productName || 'N/A'}</td>
      <td><strong>৳ ${order.totalPrice || order.price || 0}</strong><br><small style="color:var(--text-muted);">${order.paymentMethod || 'COD'}</small></td>
      <td><small style="max-width:180px;display:block;word-break:break-word;">${order.customerAddress || order.address || 'N/A'}</small></td>
      <td>
        <select onchange="updateOrderStatus('${order.id}', this.value)" style="background:var(--surface-2);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:0.25rem 0.5rem;font-size:0.85rem;">
          <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ পেন্ডিং</option>
          <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>🚚 পাঠানো হয়েছে</option>
          <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>✅ সফল</option>
          <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>❌ বাতিল</option>
        </select>
      </td>
      <td>
        <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);" onclick="deleteOrder('${order.id}')" title="ডিলিট">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    await db.collection('orders').doc(orderId).update({
      status: newStatus,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    const order = myOrders.find(o => o.id === orderId);
    if (order) order.status = newStatus;
    updateOrderFilterCounts();
    loadDashboardStats();
    showToast('অর্ডার স্ট্যাটাস আপডেট হয়েছে! ✅', 'success');
  } catch (error) {
    console.error('Error updating order:', error);
    showToast('স্ট্যাটাস আপডেট করতে সমস্যা', 'error');
  }
}

async function deleteOrder(orderId) {
  if (!confirm('এই অর্ডারটি ডিলিট করতে চান?')) return;
  try {
    await db.collection('orders').doc(orderId).delete();
    myOrders = myOrders.filter(o => o.id !== orderId);
    updateOrderFilterCounts();
    renderOrdersTable();
    loadDashboardStats();
    showToast('অর্ডার ডিলিট হয়েছে', 'success');
  } catch (error) {
    console.error('Error deleting order:', error);
    showToast('ডিলিট করতে সমস্যা', 'error');
  }
}

function openAddOrderModal() {
  const form = document.getElementById('order-form');
  if (form) form.reset();
  document.getElementById('order-id').value = '';
  document.getElementById('order-modal-title').textContent = 'নতুন অর্ডার রেকর্ড করুন';
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
}

async function saveOrder(e) {
  e.preventDefault();
  const customerName = document.getElementById('order-customer-name')?.value.trim();
  const customerPhone = document.getElementById('order-customer-phone')?.value.trim();
  const productName = document.getElementById('order-product-name')?.value.trim();
  const totalPrice = parseInt(document.getElementById('order-total-price')?.value) || 0;
  const customerAddress = document.getElementById('order-customer-address')?.value.trim();
  const paymentMethod = document.getElementById('order-payment-method')?.value;
  const status = document.getElementById('order-status')?.value || 'pending';

  if (!customerName || !customerPhone || !productName) {
    showToast('সব প্রয়োজনীয় ফিল্ড পূরণ করুন', 'error');
    return;
  }

  try {
    const orderData = {
      sellerId: currentUser.uid,
      sellerName: sellerProfile?.shopName || currentUser.displayName || 'সেলার',
      customerName,
      customerPhone,
      productName,
      totalPrice,
      customerAddress,
      paymentMethod,
      status,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('orders').add(orderData);
    showToast('অর্ডার সফলভাবে রেকর্ড হয়েছে! 🎉', 'success');
    closeOrderModal();
    loadMyOrders();
    loadDashboardStats();
  } catch (error) {
    console.error('Error saving order:', error);
    showToast('অর্ডার সেভ করতে সমস্যা', 'error');
  }
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners() {
  // Auth
  document.getElementById('login-btn')?.addEventListener('click', loginWithGoogle);
  document.getElementById('logout-btn')?.addEventListener('click', logout);
  document.getElementById('pending-logout-btn')?.addEventListener('click', logout);

  // Registration
  document.getElementById('registration-form')?.addEventListener('submit', registerSeller);

  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabName = e.currentTarget.getAttribute('data-tab');
      if (tabName) switchTab(tabName);
    });
  });

  // Product modal
  document.getElementById('add-product-btn')?.addEventListener('click', openAddProductModal);
  document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
  document.getElementById('cancel-btn')?.addEventListener('click', closeModal);
  document.getElementById('product-form')?.addEventListener('submit', saveProduct);

  // Image upload
  const uploadZone = document.getElementById('image-upload-zone');
  const fileInput = document.getElementById('product-image-upload');
  if (uploadZone && fileInput) {
    uploadZone.addEventListener('click', () => fileInput.click());
  }
  fileInput?.addEventListener('change', handleImageSelection);

  // Shop settings
  document.getElementById('shop-settings-form')?.addEventListener('submit', saveShopSettings);

  // Copy shop URL button
  document.getElementById('copy-shop-url-btn')?.addEventListener('click', () => {
    const baseUrl = window.location.href.split('seller.html')[0];
    const shopUrl = `${baseUrl}index.html?shop=${currentUser?.uid || ''}`;
    navigator.clipboard?.writeText(shopUrl).then(() => {
      showToast('দোকানের লিংক কপি হয়েছে! 📋', 'success');
    });
  });

  // Haat modal
  document.getElementById('add-haat-btn')?.addEventListener('click', openAddHaatModal);
  document.getElementById('close-haat-modal-btn')?.addEventListener('click', closeHaatModal);
  document.getElementById('cancel-haat-btn')?.addEventListener('click', closeHaatModal);
  document.getElementById('haat-form')?.addEventListener('submit', saveMyHaat);

  // Product search & filter in seller panel
  document.getElementById('seller-product-search')?.addEventListener('input', (e) => {
    productSearchQuery = e.target.value.trim();
    renderProductsTable(myProducts);
  });

  document.getElementById('seller-product-cat-filter')?.addEventListener('change', (e) => {
    productCategoryFilter = e.target.value;
    renderProductsTable(myProducts);
  });

  // Order modal & filters
  document.getElementById('add-order-btn')?.addEventListener('click', openAddOrderModal);
  document.getElementById('close-order-modal-btn')?.addEventListener('click', closeOrderModal);
  document.getElementById('cancel-order-btn')?.addEventListener('click', closeOrderModal);
  document.getElementById('order-form')?.addEventListener('submit', saveOrder);

  document.querySelectorAll('.order-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.order-filter-btn').forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-outline');
      });
      e.currentTarget.classList.add('active', 'btn-primary');
      e.currentTarget.classList.remove('btn-outline');
      currentOrderFilter = e.currentTarget.getAttribute('data-status') || 'all';
      renderOrdersTable();
    });
  });

  // Mobile menu toggle (Fix for mobile view)
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    const sb = document.querySelector('.sidebar');
    sb?.classList.toggle('open');
    sb?.classList.toggle('show');
  });

  // Close sidebar on click outside on mobile
  document.addEventListener('click', (e) => {
    const sb = document.querySelector('.sidebar');
    const toggle = document.getElementById('menu-toggle');
    if (sb && sb.classList.contains('show') && !sb.contains(e.target) && !toggle?.contains(e.target)) {
      sb.classList.remove('open', 'show');
    }
  });
}

// ==========================================
// Populate Selects
// ==========================================

function populateAreaSelects() {
  const selects = ['reg-area', 'shop-area'];
  selects.forEach(selectId => {
    const select = document.getElementById(selectId);
    if (select) {
      DMP_AREAS.forEach(area => {
        const option = document.createElement('option');
        option.value = area;
        option.textContent = area;
        select.appendChild(option);
      });
    }
  });
}

function populateCategorySelect() {
  const selects = ['product-category', 'seller-product-cat-filter'];
  selects.forEach(selId => {
    const select = document.getElementById(selId);
    if (!select) return;

    if (selId === 'seller-product-cat-filter') {
      select.innerHTML = '<option value="all">সব ক্যাটাগরি</option>';
      CATEGORIES.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.emoji} ${cat.name}`;
        select.appendChild(option);
      });
    } else {
      select.innerHTML = '<option value="">নির্বাচন করুন</option>';
      CATEGORIES.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.emoji} ${cat.name}`;
        select.appendChild(option);
      });
    }
  });
}

// ==========================================
// My Haats CRUD
// ==========================================

let myHaats = [];

async function loadMyHaats() {
  const tbody = document.getElementById('haats-table-body');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">লোড হচ্ছে...</td></tr>';

  try {
    const snapshot = await db.collection('haats')
      .where('sellerId', '==', currentUser.uid)
      .get();

    myHaats = [];
    snapshot.forEach(doc => {
      myHaats.push({ id: doc.id, ...doc.data() });
    });
    renderMyHaatsTable(myHaats);
  } catch (error) {
    console.error('Error loading haats:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">হাটবার লোড করতে সমস্যা</td></tr>';
  }
}

function renderMyHaatsTable(haats) {
  const tbody = document.getElementById('haats-table-body');
  if (!tbody) return;

  if (haats.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4">কোনো হাটবার নেই। ➕ নতুন হাটবার তৈরি করুন!</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  haats.forEach(haat => {
    const tr = document.createElement('tr');
    let statusHtml = '';
    if (haat.approved === true) {
      statusHtml = '<span class="status-badge approved">✅ অনুমোদিত</span>';
    } else if (haat.approved === false) {
      statusHtml = '<span class="status-badge rejected">❌ প্রত্যাখ্যান</span>';
    } else {
      statusHtml = '<span class="status-badge pending">⏳ অনুমোদন বাকি</span>';
    }

    let dateStr = 'N/A';
    if (haat.date) {
      const d = haat.date.toDate ? haat.date.toDate() : new Date(haat.date);
      dateStr = d.toLocaleDateString('bn-BD');
    }

    tr.innerHTML = `
      <td><strong>${haat.title || ''}</strong></td>
      <td>${dateStr}</td>
      <td>${haat.products || 0}টি</td>
      <td>${statusHtml}</td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="openEditHaatModal('${haat.id}')">✏️</button>
        <button class="btn btn-sm btn-outline" style="color:var(--danger);border-color:var(--danger);" onclick="deleteMyHaat('${haat.id}')">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function openAddHaatModal() {
  const form = document.getElementById('haat-form');
  if (form) form.reset();
  document.getElementById('haat-id').value = '';
  document.getElementById('haat-modal-title').textContent = 'নতুন হাটবার তৈরি করুন';

  const modal = document.getElementById('haat-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

function openEditHaatModal(haatId) {
  const haat = myHaats.find(h => h.id === haatId);
  if (!haat) return;

  document.getElementById('haat-id').value = haat.id;
  document.getElementById('haat-modal-title').textContent = 'হাটবার এডিট করুন';
  document.getElementById('haat-title').value = haat.title || '';
  document.getElementById('haat-description').value = haat.description || '';
  document.getElementById('haat-products-count').value = haat.products || 0;

  if (haat.date) {
    const d = haat.date.toDate ? haat.date.toDate() : new Date(haat.date);
    document.getElementById('haat-date').value = d.toISOString().split('T')[0];
  }

  const modal = document.getElementById('haat-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.classList.add('active');
  }
}

function closeHaatModal() {
  const modal = document.getElementById('haat-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
  }
}

async function saveMyHaat(e) {
  e.preventDefault();

  const haatId = document.getElementById('haat-id').value;
  const title = document.getElementById('haat-title').value.trim();
  const dateStr = document.getElementById('haat-date').value;
  const productsCount = parseInt(document.getElementById('haat-products-count').value) || 0;
  const description = document.getElementById('haat-description').value.trim();

  if (!title || !dateStr || !description) {
    showToast('সব প্রয়োজনীয় ফিল্ড পূরণ করুন', 'error');
    return;
  }

  try {
    const haatData = {
      title,
      description,
      date: firebase.firestore.Timestamp.fromDate(new Date(dateStr)),
      products: productsCount,
      seller: sellerProfile.name || currentUser.displayName || '',
      sellerId: currentUser.uid,
      area: sellerProfile.area || '',
      shopName: sellerProfile.shopName || '',
      isLive: false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    if (haatId) {
      await db.collection('haats').doc(haatId).update(haatData);
      showToast('হাটবার আপডেট হয়েছে! ✅', 'success');
    } else {
      haatData.approved = null; // pending
      haatData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection('haats').add(haatData);
      showToast('হাটবার তৈরি হয়েছে! অ্যাডমিন অনুমোদনের অপেক্ষায় 🎉', 'success');
    }

    closeHaatModal();
    loadMyHaats();
  } catch (error) {
    console.error('Error saving haat:', error);
    showToast('হাটবার সেভ করতে সমস্যা', 'error');
  }
}

async function deleteMyHaat(haatId) {
  if (!confirm('এই হাটবার ডিলিট করতে চান?')) return;

  try {
    await db.collection('haats').doc(haatId).delete();
    showToast('হাটবার ডিলিট হয়েছে', 'success');
    loadMyHaats();
  } catch (error) {
    console.error('Error deleting haat:', error);
    showToast('ডিলিট করতে সমস্যা', 'error');
  }
}

// ==========================================
// Utility Functions
// ==========================================

function showScreen(screenId) {
  const screens = ['login-screen', 'registration-screen', 'pending-screen', 'seller-app'];
  screens.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = (id === screenId) ? (id === 'seller-app' ? 'flex' : 'flex') : 'none';
  });
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.style.display = 'block';
  toast.style.backgroundColor = type === 'error' ? 'var(--danger)' : 'var(--primary)';
  toast.style.color = '#fff';
  toast.style.padding = '1rem 1.5rem';
  toast.style.borderRadius = '8px';
  toast.style.position = 'fixed';
  toast.style.bottom = '2rem';
  toast.style.right = '2rem';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  toast.style.transition = 'all 0.3s ease';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}
