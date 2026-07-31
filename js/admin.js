/**
 * admin.js - Admin Panel Logic for Ghoroa
 * This script handles the administrative operations including authentication, 
 * dashboard statistics, product CRUD operations, and seller management.
 * Uses Firebase compat SDK (firebase.auth, firebase.firestore, firebase.storage).
 */

// ==========================================
// Constants & Configuration
// ==========================================

const CATEGORIES = [
  { id: 'food', name: 'ঘরোয়া খাবার', emoji: '🍯' },
  { id: 'handicraft', name: 'হস্তশিল্প', emoji: '🧵' },
  { id: 'clothing', name: 'পোশাক ও ফ্যাশন', emoji: '👗' },
  { id: 'art', name: 'শিল্প ও আর্ট', emoji: '🎨' },
  { id: 'natural', name: 'প্রাকৃতিক প্রোডাক্ট', emoji: '🌿' },
  { id: 'gift', name: 'কাস্টম গিফট', emoji: '🎁' }
];

// List of 49 DMP Thanas (Dhaka Metropolitan Police Areas)
const DMP_AREAS = [
    "Adabor", "Badda", "Banasree", "Bangshal", "Bimanbandar", "Cantonment", 
    "Chawkbazar", "Dakshinkhan", "Darus Salam", "Demra", "Dhanmondi", "Gendaria", 
    "Gulshan", "Hatirjheel", "Hazaribagh", "Jatrabari", "Kadamtali", "Kafrul", 
    "Kalabagan", "Kamrangirchar", "Khilgaon", "Khilkhet", "Kotwali", "Lalbagh", 
    "Mirpur Model", "Mohammadpur", "Motijheel", "Mugda", "New Market", "Pallabi", 
    "Paltan", "Panthapath", "Pellabi", "Ramna", "Rampura", "Sabujbagh", "Shah Ali", 
    "Shahbagh", "Sher-e-Bangla Nagar", "Shyampur", "Sutrapur", "Tejgaon", 
    "Tejgaon Industrial Area", "Turag", "Uttara East", "Uttara West", 
    "Vashantek", "Vatara", "Wari"
].sort();

// ==========================================
// Global State Variables
// ==========================================

let allProducts = [];
let isEditing = false;
let currentImageFile = null;

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    setupEventListeners();
    populateSelects();
});

// ==========================================
// Authentication Logic
// ==========================================

/**
 * Initializes authentication listener.
 * Checks if the logged-in user is the admin.
 */
function initAuth() {
    auth.onAuthStateChanged((user) => {
        const loginScreen = document.getElementById('login-screen');
        const adminApp = document.getElementById('admin-app');
        
        if (user) {
            if (user.email === ADMIN_EMAIL) {
                // Admin is authenticated
                if (loginScreen) loginScreen.style.display = 'none';
                if (adminApp) adminApp.style.display = 'block';
                
                const userNameEl = document.getElementById('user-name');
                const userAvatarEl = document.getElementById('user-avatar');
                if (userNameEl) userNameEl.textContent = user.displayName || 'Admin';
                if (userAvatarEl) userAvatarEl.src = user.photoURL || 'https://via.placeholder.com/40';
                
                initAdminPanel();
            } else {
                // Unauthorized user
                auth.signOut();
                showToast('অনুমতি নেই। শুধুমাত্র অ্যাডমিন লগইন করতে পারবেন।', 'error');
            }
        } else {
            // User is logged out
            if (loginScreen) loginScreen.style.display = 'flex';
            if (adminApp) adminApp.style.display = 'none';
        }
    });
}

/**
 * Initiates Google Sign-In popup.
 */
async function loginWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithPopup(provider);
    } catch (error) {
        console.error("Login error: ", error);
        showToast('লগইন ব্যর্থ হয়েছে: ' + error.message, 'error');
    }
}

/**
 * Signs out the current user.
 */
async function logout() {
    try {
        await auth.signOut();
        showToast('লগআউট সফল', 'success');
    } catch (error) {
        console.error("Logout error: ", error);
        showToast('লগআউট ব্যর্থ হয়েছে', 'error');
    }
}

// ==========================================
// Event Listeners & Setup
// ==========================================

/**
 * Attaches event listeners to DOM elements.
 */
function setupEventListeners() {
    // Auth
    document.getElementById('login-btn')?.addEventListener('click', loginWithGoogle);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
    
    // Sidebar Tabs Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const tabName = e.currentTarget.getAttribute('data-tab');
            if (tabName) switchTab(tabName);
        });
    });

    // Product Modal & Form
    document.getElementById('add-product-btn')?.addEventListener('click', openAddProductModal);
    document.getElementById('close-modal-btn')?.addEventListener('click', closeModal);
    document.getElementById('cancel-btn')?.addEventListener('click', closeModal);
    document.getElementById('product-form')?.addEventListener('submit', saveProduct);
    
    // Image Upload Preview
    document.getElementById('product-image-upload')?.addEventListener('change', handleImageSelection);
    
    // Search Products
    document.getElementById('products-search')?.addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });
}

/**
 * Populates dropdown selects with categories and areas.
 */
function populateSelects() {
    const categorySelect = document.getElementById('product-category');
    if (categorySelect) {
        CATEGORIES.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = `${cat.emoji} ${cat.name}`;
            categorySelect.appendChild(option);
        });
    }

    const areaSelect = document.getElementById('product-area');
    if (areaSelect) {
        DMP_AREAS.forEach(area => {
            const option = document.createElement('option');
            option.value = area;
            option.textContent = area;
            areaSelect.appendChild(option);
        });
    }
}

/**
 * Switches between different sections of the admin panel.
 * @param {string} tabName - The data-tab value to switch to.
 */
function switchTab(tabName) {
    // Update active state on nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        }
    });

    // Show selected tab content, hide others
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
        if (tab.getAttribute('data-tab') === tabName) {
            tab.style.display = 'block';
        }
    });

    // Load necessary data when switching tabs
    if (tabName === 'dashboard') loadDashboardStats();
    if (tabName === 'products') loadProducts();
    if (tabName === 'sellers') loadSellers();
}

/**
 * Initializes the admin panel after successful login.
 */
async function initAdminPanel() {
    switchTab('dashboard');
}

// ==========================================
// Dashboard Logic
// ==========================================

/**
 * Fetches and displays statistics for the dashboard.
 */
async function loadDashboardStats() {
    try {
        const productsSnap = await db.collection('products').get();
        const sellersSnap = await db.collection('sellers').get();
        
        const totalProducts = productsSnap.size;
        const totalSellers = sellersSnap.size;
        
        let pendingCount = 0;
        sellersSnap.forEach(doc => {
            if (doc.data().approved === false || !doc.data().hasOwnProperty('approved')) {
                pendingCount++;
            }
        });

        const statProducts = document.getElementById('stat-products');
        const statSellers = document.getElementById('stat-sellers');
        const statPending = document.getElementById('stat-pending');
        const statAreas = document.getElementById('stat-areas');

        if (statProducts) statProducts.textContent = totalProducts;
        if (statSellers) statSellers.textContent = totalSellers;
        if (statPending) statPending.textContent = pendingCount;
        if (statAreas) statAreas.textContent = DMP_AREAS.length;
        
    } catch (error) {
        console.error("Error loading stats:", error);
        showToast('স্ট্যাটস লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// ==========================================
// Products CRUD Operations
// ==========================================

/**
 * Loads products from Firestore and displays them in the table.
 */
async function loadProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><br>লোড হচ্ছে...</td></tr>';
    
    try {
        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        allProducts = [];
        snapshot.forEach(doc => {
            allProducts.push({ id: doc.id, ...doc.data() });
        });
        
        renderProductsTable(allProducts);
    } catch (error) {
        console.error("Error loading products:", error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">প্রোডাক্ট লোড করতে ব্যর্থ</td></tr>';
        showToast('প্রোডাক্ট লোড করতে সমস্যা হয়েছে', 'error');
    }
}

/**
 * Renders the products array into the table body.
 * @param {Array} products - The list of product objects.
 */
function renderProductsTable(products) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">কোনো প্রোডাক্ট পাওয়া যায়নি</td></tr>';
        return;
    }

    products.forEach(product => {
        const tr = document.createElement('tr');
        
        // Match category for proper display name
        const cat = CATEGORIES.find(c => c.id === product.category);
        const catName = cat ? `${cat.emoji} ${cat.name}` : (product.category || 'N/A');
        
        tr.innerHTML = `
            <td>
                <img src="${product.imageUrl || 'https://via.placeholder.com/50'}" 
                     alt="${product.name}" 
                     style="width:50px; height:50px; object-fit:cover; border-radius:4px; border: 1px solid #ddd;">
            </td>
            <td class="fw-bold">${product.name || 'Unnamed'}</td>
            <td>৳${product.price || 0}</td>
            <td>${catName}</td>
            <td>${product.sellerName || product.seller || 'Unknown'}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" role="switch" 
                           id="featured-${product.id}" ${product.featured ? 'checked' : ''}
                           onchange="toggleFeatured('${product.id}', this.checked)">
                </div>
            </td>
            <td>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary" onclick="openEditProductModal('${product.id}')" title="এডিট">
                        <i class="bi bi-pencil"></i> এডিট
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product.id}')" title="ডিলিট">
                        <i class="bi bi-trash"></i> ডিলিট
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Filters the product list based on a search query.
 * @param {string} query - The search text.
 */
function searchProducts(query) {
    if (!query || query.trim() === '') {
        renderProductsTable(allProducts);
        return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    const filtered = allProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(lowerQuery)) || 
        (p.category && p.category.toLowerCase().includes(lowerQuery)) ||
        (p.seller && p.seller.toLowerCase().includes(lowerQuery)) ||
        (p.sellerName && p.sellerName.toLowerCase().includes(lowerQuery)) ||
        (p.area && p.area.toLowerCase().includes(lowerQuery))
    );
    
    renderProductsTable(filtered);
}

/**
 * Opens the modal to add a new product.
 */
function openAddProductModal() {
    isEditing = false;
    
    const form = document.getElementById('product-form');
    if (form) form.reset();
    
    document.getElementById('product-id').value = '';
    document.getElementById('modal-title').textContent = 'নতুন প্রোডাক্ট যোগ করুন';
    
    const preview = document.getElementById('image-preview');
    if (preview) {
        preview.src = 'https://via.placeholder.com/150';
        preview.style.display = 'block';
    }
    
    currentImageFile = null;
    document.getElementById('product-modal').style.display = 'flex';
}

/**
 * Opens the modal to edit an existing product.
 * @param {string} productId - The ID of the product to edit.
 */
function openEditProductModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    isEditing = true;
    
    document.getElementById('product-id').value = product.id;
    document.getElementById('modal-title').textContent = 'প্রোডাক্ট এডিট করুন';
    
    // Fill form fields
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-price').value = product.price || '';
    document.getElementById('product-category').value = product.category || '';
    document.getElementById('product-area').value = product.area || '';
    document.getElementById('product-seller').value = product.sellerName || product.seller || '';
    document.getElementById('product-story').value = product.story || '';
    document.getElementById('product-badge').value = product.badge || '';
    document.getElementById('product-featured').checked = product.featured || false;
    
    // Setup image preview
    const imgPreview = document.getElementById('image-preview');
    if (imgPreview) {
        if (product.imageUrl) {
            imgPreview.src = product.imageUrl;
        } else {
            imgPreview.src = 'https://via.placeholder.com/150';
        }
        imgPreview.style.display = 'block';
    }
    
    currentImageFile = null;
    document.getElementById('product-modal').style.display = 'flex';
}

/**
 * Closes the product modal.
 */
function closeModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';
}

/**
 * Handles image selection and previews it.
 * @param {Event} e - The file input change event.
 */
function handleImageSelection(e) {
    const file = e.target.files[0];
    if (file) {
        currentImageFile = file;
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('image-preview');
            if (preview) preview.src = event.target.result;
        }
        reader.readAsDataURL(file);
    }
}

/**
 * Saves a new or updated product to Firestore.
 * Handles image upload to Firebase Storage if an image is selected.
 * @param {Event} e - The form submit event.
 */
async function saveProduct(e) {
    e.preventDefault();
    
    const btn = document.querySelector('#product-form button[type="submit"]');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> সেভ হচ্ছে...';
    btn.disabled = true;

    try {
        const id = document.getElementById('product-id').value;
        const name = document.getElementById('product-name').value;
        const price = Number(document.getElementById('product-price').value);
        const category = document.getElementById('product-category').value;
        const area = document.getElementById('product-area').value;
        const seller = document.getElementById('product-seller').value;
        const story = document.getElementById('product-story').value;
        const badge = document.getElementById('product-badge').value;
        const featured = document.getElementById('product-featured').checked;

        let imageUrl = null;

        // Upload image if a new file is selected
        if (currentImageFile) {
            const timestamp = Date.now();
            const fileName = `${timestamp}_${currentImageFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
            const storageRef = storage.ref(`products/${fileName}`);
            
            const snapshot = await storageRef.put(currentImageFile);
            imageUrl = await snapshot.ref.getDownloadURL();
        }

        const productData = {
            name,
            price,
            category,
            area,
            sellerName: seller,
            story,
            badge,
            featured,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (imageUrl) {
            productData.imageUrl = imageUrl;
        }

        if (isEditing && id) {
            // Update existing product
            await db.collection('products').doc(id).update(productData);
            showToast('প্রোডাক্ট সফলভাবে আপডেট হয়েছে', 'success');
        } else {
            // Add new product
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            productData.seller = auth.currentUser.uid; 
            
            await db.collection('products').add(productData);
            showToast('নতুন প্রোডাক্ট যোগ করা হয়েছে', 'success');
        }
        
        closeModal();
        loadProducts(); // Refresh list
        loadDashboardStats(); // Update dashboard stats

    } catch (error) {
        console.error("Error saving product:", error);
        showToast('প্রোডাক্ট সেভ করতে ব্যর্থ হয়েছে: ' + error.message, 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Deletes a product from Firestore after confirmation.
 * @param {string} productId - The ID of the product to delete.
 */
async function deleteProduct(productId) {
    if (!confirm('আপনি কি নিশ্চিত যে এই প্রোডাক্টটি মুছে ফেলতে চান?')) return;
    
    try {
        await db.collection('products').doc(productId).delete();
        showToast('প্রোডাক্ট ডিলিট করা হয়েছে', 'success');
        loadProducts();
        loadDashboardStats();
    } catch (error) {
        console.error("Error deleting product:", error);
        showToast('প্রোডাক্ট ডিলিট করতে ব্যর্থ', 'error');
    }
}

// ==========================================
// Sellers Management
// ==========================================

/**
 * Loads sellers from Firestore and displays them in the table.
 */
async function loadSellers() {
    const tbody = document.getElementById('sellers-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><br>লোড হচ্ছে...</td></tr>';
    
    try {
        const snapshot = await db.collection('sellers').orderBy('createdAt', 'desc').get();
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">কোনো বিক্রেতা পাওয়া যায়নি</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const seller = { id: doc.id, ...doc.data() };
            const tr = document.createElement('tr');
            
            const isApproved = seller.approved === true;
            const statusBadge = isApproved 
                ? '<span class="badge bg-success">অ্যাপ্রুভড</span>' 
                : '<span class="badge bg-warning text-dark">পেন্ডিং</span>';
                
            tr.innerHTML = `
                <td class="fw-bold">${seller.name || 'N/A'}</td>
                <td>${seller.phone || 'N/A'}</td>
                <td>${seller.area || 'N/A'}</td>
                <td>${statusBadge}</td>
                <td>${formatDate(seller.createdAt)}</td>
                <td>
                    ${!isApproved ? 
                        `<button class="btn btn-sm btn-success me-1" onclick="approveSeller('${seller.id}')" title="অ্যাপ্রুভ">
                            <i class="bi bi-check-circle"></i> অ্যাপ্রুভ
                        </button>` 
                        : 
                        `<button class="btn btn-sm btn-warning me-1" onclick="rejectSeller('${seller.id}')" title="বাতিল">
                            <i class="bi bi-x-circle"></i> বাতিল
                        </button>`
                    }
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading sellers:", error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">বিক্রেতা লোড করতে ব্যর্থ</td></tr>';
        showToast('বিক্রেতাদের তথ্য লোড করতে সমস্যা হয়েছে', 'error');
    }
}

/**
 * Approves a seller by updating the document.
 * @param {string} sellerId - The ID of the seller to approve.
 */
window.approveSeller = async function(sellerId) {
    if (!confirm('এই বিক্রেতাকে অ্যাপ্রুভ করতে চান?')) return;
    try {
        await db.collection('sellers').doc(sellerId).update({
            approved: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('বিক্রেতা অ্যাপ্রুভ করা হয়েছে', 'success');
        loadSellers();
        loadDashboardStats();
    } catch (error) {
        console.error("Error approving seller:", error);
        showToast('অ্যাপ্রুভ করতে ব্যর্থ', 'error');
    }
};

/**
 * Rejects (un-approves) a seller by updating the document.
 * @param {string} sellerId - The ID of the seller to reject.
 */
window.rejectSeller = async function(sellerId) {
    if (!confirm('এই বিক্রেতার অ্যাপ্রুভাল বাতিল করতে চান?')) return;
    try {
        await db.collection('sellers').doc(sellerId).update({
            approved: false,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        showToast('বিক্রেতার অ্যাপ্রুভাল বাতিল করা হয়েছে', 'success');
        loadSellers();
        loadDashboardStats();
    } catch (error) {
        console.error("Error rejecting seller:", error);
        showToast('বাতিল করতে ব্যর্থ', 'error');
    }
};

// ==========================================
// Expose specific functions globally for inline HTML handlers
// ==========================================

window.openEditProductModal = openEditProductModal;
window.deleteProduct = deleteProduct;

/**
 * Toggles the featured status of a product directly from the switch in the table.
 * @param {string} productId - Product ID
 * @param {boolean} isFeatured - True if checking the switch, false if unchecking
 */
window.toggleFeatured = async function(productId, isFeatured) {
    try {
        await db.collection('products').doc(productId).update({
            featured: isFeatured,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`প্রোডাক্ট ${isFeatured ? 'ফিচার্ড করা হয়েছে' : 'ফিচার্ড থেকে সরানো হয়েছে'}`, 'success');
        
        // Update local array state so search continues to work properly
        const pIndex = allProducts.findIndex(p => p.id === productId);
        if (pIndex > -1) {
            allProducts[pIndex].featured = isFeatured;
        }
    } catch (error) {
        console.error("Error toggling featured status:", error);
        showToast('স্ট্যাটাস আপডেট করতে ব্যর্থ', 'error');
        
        // Revert checkbox state visually on failure
        const checkbox = document.getElementById(`featured-${productId}`);
        if (checkbox) checkbox.checked = !isFeatured;
    }
};

// ==========================================
// Utility Functions
// ==========================================

/**
 * Displays a toast notification message.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or 'info'.
 */
function showToast(message, type = 'info') {
    const toastEl = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    // Fallback if toast HTML elements are missing
    if (!toastEl || !toastMessage) {
        alert(message);
        return;
    }
    
    toastMessage.textContent = message;
    
    // Reset classes
    toastEl.className = 'toast align-items-center text-white border-0';
    
    // Apply styling based on type
    if (type === 'success') {
        toastEl.classList.add('bg-success');
    } else if (type === 'error') {
        toastEl.classList.add('bg-danger');
    } else {
        toastEl.classList.add('bg-primary');
    }
    
    // Use Bootstrap Toast API if available
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const bsToast = new bootstrap.Toast(toastEl, { delay: 3000 });
        bsToast.show();
    } else {
        // Simple manual display fallback
        toastEl.classList.add('show');
        setTimeout(() => toastEl.classList.remove('show'), 3000);
    }
}

/**
 * Formats a Firestore timestamp into a Bengali localized date string.
 * @param {Object|number|string} timestamp - Firestore Timestamp, Date object, or timestamp integer.
 * @returns {string} Formatted date string (e.g., ১ জানুয়ারি, ২০২৩).
 */
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    // Check if it's a Firestore Timestamp with toDate() method
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    
    try {
        return new Intl.DateTimeFormat('bn-BD', options).format(date);
    } catch (e) {
        // Fallback for environments lacking 'bn-BD' locale support
        return date.toLocaleDateString();
    }
}
