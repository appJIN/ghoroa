/**
 * seller.js - Seller Panel Logic for Ghoroa
 * Handles seller authentication, registration, product management
 */

// ==========================================
// Constants
// ==========================================

const CATEGORIES = [
  { id: 'food', name: 'ঘরোয়া খাবার', emoji: '🍯' },
  { id: 'handicraft', name: 'হস্তশিল্প', emoji: '🧵' },
  { id: 'clothing', name: 'পোশাক ও ফ্যাশন', emoji: '👗' },
  { id: 'art', name: 'শিল্প ও আর্ট', emoji: '🎨' },
  { id: 'natural', name: 'প্রাকৃতিক প্রোডাক্ট', emoji: '🌿' },
  { id: 'gift', name: 'কাস্টম গিফট', emoji: '🎁' }
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
      // Pre-fill name and email
      const nameInput = document.getElementById('reg-name');
      if (nameInput && user.displayName) nameInput.value = user.displayName;
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

  // Update page title
  const titles = {
    'dashboard': 'ড্যাশবোর্ড',
    'my-products': 'আমার প্রোডাক্ট',
    'my-shop': 'দোকান সেটিংস'
  };
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = titles[tabName] || 'ড্যাশবোর্ড';

  // Load data
  if (tabName === 'dashboard') loadDashboardStats();
  if (tabName === 'my-products') loadMyProducts();
}

// ==========================================
// Dashboard Stats
// ==========================================

async function loadDashboardStats() {
  try {
    const snapshot = await db.collection('products')
      .where('seller', '==', currentUser.uid)
      .get();

    const products = [];
    snapshot.forEach(doc => products.push(doc.data()));

    const statProducts = document.getElementById('stat-my-products');
    const statFeatured = document.getElementById('stat-featured');
    const statViews = document.getElementById('stat-views');

    if (statProducts) statProducts.textContent = products.length;
    if (statFeatured) statFeatured.textContent = products.filter(p => p.featured).length;
    if (statViews) statViews.textContent = products.reduce((sum, p) => sum + (p.views || 0), 0);
  } catch (error) {
    console.error("Error loading stats:", error);
  }
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

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">কোনো প্রোডাক্ট নেই। ➕ নতুন প্রোডাক্ট যোগ করুন!</td></tr>';
    return;
  }

  tbody.innerHTML = '';
  products.forEach(product => {
    const cat = CATEGORIES.find(c => c.id === product.category);
    const catName = cat ? `${cat.emoji} ${cat.name}` : (product.category || 'N/A');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <img src="${product.imageUrl || 'https://via.placeholder.com/50'}"
             alt="${product.name}"
             style="width:50px; height:50px; object-fit:cover; border-radius:4px;">
      </td>
      <td><strong>${product.name || 'Unnamed'}</strong></td>
      <td>৳${product.price || 0}</td>
      <td>${catName}</td>
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
      category,
      area: sellerProfile.area || '',
      areaName: sellerProfile.area || '',
      seller: currentUser.uid,
      sellerName: sellerProfile.name || currentUser.displayName || '',
      shopName: sellerProfile.shopName || '',
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
}

async function saveShopSettings(e) {
  e.preventDefault();

  const shopName = document.getElementById('shop-name').value.trim();
  const phone = document.getElementById('shop-phone').value.trim();
  const area = document.getElementById('shop-area').value;
  const story = document.getElementById('shop-story').value.trim();

  try {
    await db.collection('sellers').doc(currentUser.uid).update({
      shopName,
      phone,
      area,
      story,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    sellerProfile.shopName = shopName;
    sellerProfile.phone = phone;
    sellerProfile.area = area;
    sellerProfile.story = story;

    showToast('দোকান সেটিংস সেভ হয়েছে! ✅', 'success');
  } catch (error) {
    console.error("Save settings error:", error);
    showToast('সেভ করতে সমস্যা', 'error');
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

  // Mobile menu toggle
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar')?.classList.toggle('open');
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
  const select = document.getElementById('product-category');
  if (select) {
    CATEGORIES.forEach(cat => {
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = `${cat.emoji} ${cat.name}`;
      select.appendChild(option);
    });
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
