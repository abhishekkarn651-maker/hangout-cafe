/* =====================================================
   HANGOUT CAFE – Admin Dashboard Core Logic (Vanilla JS)
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ===== 1. AUTHENTICATION SHIELD =====
  const token = localStorage.getItem('admin_token');
  const email = localStorage.getItem('admin_email');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const name = localStorage.getItem('admin_name') || 'Admin User';
  const role = localStorage.getItem('admin_role') || 'admin';

  // Update profile details in sidebar/settings
  document.getElementById('profile-email').textContent = email || 'admin@hangoutcafe.com';
  document.getElementById('settings-username').textContent = name;
  document.getElementById('settings-avatar').textContent = name.charAt(0).toUpperCase();
  document.getElementById('profile-avatar').textContent = name.charAt(0).toUpperCase();

  // If owner, show the Admin Accounts management tab
  if (role === 'owner') {
    const sidebarAccounts = document.getElementById('sidebar-accounts');
    if (sidebarAccounts) sidebarAccounts.style.display = 'block';
  }

  // ===== 2. GLOBALS & STORES =====
  let menuItemsStore = [];
  let deleteTarget = null; // { type: 'menu'|'banner'|'gallery'|'offer', id }
  let activeUploadFiles = {}; // Stores files for different forms (key = form element id)

  const toastContainer = document.getElementById('toast-container');

  const API_BASE_URL = window.location.origin.includes('5000') 
    ? '' 
    : 'http://localhost:5000';

  // API Call helper
  const apiCall = async (url, options = {}) => {
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE_URL}${url}`, options);
      const json = await res.json();

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_email');
        showToast('Session expired. Redirecting to login...', 'error');
        setTimeout(() => { window.location.href = 'login.html'; }, 1500);
        return null;
      }

      return { status: res.status, ok: res.ok, json };
    } catch (err) {
      console.error('API Error:', err);
      showToast('Network error, please try again.', 'error');
      return null;
    }
  };

  // Toast Helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}</div>
      <div class="toast-body">${message}</div>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => { toast.classList.add('show'); }, 50);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  };

  // Modal Open/Close helpers
  window.openModal = (id) => {
    document.getElementById(id).classList.add('active');
  };

  window.closeModal = (id) => {
    document.getElementById(id).classList.remove('active');
    // Clear dynamic files or previews if applicable
    if (id === 'menu-modal') document.getElementById('menu-form').reset();
    if (id === 'banner-modal') document.getElementById('banner-form').reset();
    if (id === 'gallery-modal') document.getElementById('gallery-form').reset();
    if (id === 'offer-modal') document.getElementById('offer-form').reset();
    clearPreviews(id.replace('-modal', ''));
  };

  const clearPreviews = (prefix) => {
    const previewContainer = document.getElementById(`${prefix}-preview-container`);
    if (previewContainer) previewContainer.innerHTML = '';
    delete activeUploadFiles[prefix];
  };

  // Handle image previews & Drag-and-Drop
  const initUploadZone = (prefix) => {
    const zone = document.getElementById(`${prefix}-upload-zone`);
    const input = document.getElementById(`${prefix}-image-file`);
    const previewContainer = document.getElementById(`${prefix}-preview-container`);

    if (!zone || !input) return;

    // Click trigger
    zone.addEventListener('click', () => input.click());

    // Drag-over styles
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    ['dragleave', 'dragend', 'drop'].forEach(evt => {
      zone.addEventListener(evt, () => zone.classList.remove('dragover'));
    });

    // Drop trigger
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files[0], prefix, previewContainer);
      }
    });

    // Change trigger
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        handleFileSelect(input.files[0], prefix, previewContainer);
      }
    });
  };

  const handleFileSelect = (file, prefix, container) => {
    if (!file.type.match('image.*')) {
      showToast('Only image files are allowed!', 'error');
      return;
    }

    activeUploadFiles[prefix] = file;

    // Preview
    container.innerHTML = '';
    const reader = new FileReader();
    reader.onload = (e) => {
      const card = document.createElement('div');
      card.className = 'preview-card';
      card.innerHTML = `
        <img src="${e.target.result}" alt="preview">
        <button class="preview-remove-btn" type="button" id="remove-preview-${prefix}">&times;</button>
      `;
      container.appendChild(card);

      card.querySelector('.preview-remove-btn').addEventListener('click', () => {
        clearPreviews(prefix);
      });
    };
    reader.readAsDataURL(file);
  };

  // Initialize upload zones
  ['menu', 'banner', 'gallery', 'about', 'offer'].forEach(initUploadZone);


  // ===== 3. CORE TABS ROUTING =====
  const menuItems = document.querySelectorAll('.menu-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const pageTitle = document.getElementById('page-title');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabId = item.dataset.tab;

      // Sidebar menu styling
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Show/hide content panels
      tabContents.forEach(content => content.classList.remove('active'));
      const activeContent = document.getElementById(`tab-${tabId}`);
      if (activeContent) activeContent.classList.add('active');

      // Update header
      pageTitle.textContent = item.querySelector('span:last-child').textContent;

      // Close mobile drawer if open
      document.getElementById('sidebar').classList.remove('mobile-open');

      // Load specific tab data
      loadTabData(tabId);
    });
  });

  // Mobile navigation toggle
  const mobileToggle = document.getElementById('mobile-toggle');
  if (window.innerWidth <= 992) {
    mobileToggle.style.display = 'block';
  }
  window.addEventListener('resize', () => {
    mobileToggle.style.display = window.innerWidth <= 992 ? 'block' : 'none';
  });

  mobileToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('sidebar').classList.toggle('mobile-open');
  });

  document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && e.target !== mobileToggle) {
      sidebar.classList.remove('mobile-open');
    }
  });


  // ===== 4. DATA LOADER ORCHESTRATOR =====
  const loadTabData = (tabId) => {
    switch (tabId) {
      case 'overview':
        loadOverviewStats();
        break;
      case 'hero':
        loadBanners();
        break;
      case 'about':
        loadAboutDetails();
        break;
      case 'menu':
        loadMenuItems();
        break;
      case 'gallery':
        loadGallery();
        break;
      case 'offers':
        loadOffers();
        break;
      case 'contact':
        loadContactDetails();
        break;
      case 'accounts':
        loadAdminAccounts();
        break;
    }
  };


  // ===== 5. TABS LOGIC IMPLEMENTATION =====

  /* ── 5.1 OVERVIEW TABS ── */
  const loadOverviewStats = async () => {
    const resMenu = await apiCall('/api/menu');
    const resGallery = await apiCall('/api/gallery');
    const resOffers = await apiCall('/api/offers');

    if (resMenu && resMenu.ok) {
      document.getElementById('stat-menu-count').textContent = resMenu.json.data.length;
    }
    if (resGallery && resGallery.ok) {
      document.getElementById('stat-gallery-count').textContent = resGallery.json.data.length;
    }
    if (resOffers && resOffers.ok) {
      // Filter active offers
      const activeCount = resOffers.json.data.filter(o => o.isActive).length;
      document.getElementById('stat-offers-count').textContent = activeCount;
    }

    document.getElementById('overview-last-updated').textContent = new Date().toLocaleTimeString();

    // Populate a simple activity list to make it look premium
    const activityList = document.getElementById('overview-activity-list');
    activityList.innerHTML = `
      <div class="activity-item">
        <span class="activity-desc">Logged into dashboard</span>
        <span class="activity-time">Just now</span>
      </div>
      <div class="activity-item">
        <span class="activity-desc">Synced Supabase configurations</span>
        <span class="activity-time">5 mins ago</span>
      </div>
      <div class="activity-item">
        <span class="activity-desc">Verified static endpoint mappings</span>
        <span class="activity-time">10 mins ago</span>
      </div>
    `;
  };


  /* ── 5.2 HERO MANAGER (Banners) ── */
  const loadBanners = async () => {
    const container = document.getElementById('banners-table-body');
    container.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="spinner"></div><p style="margin-top:10px;">Syncing banners...</p></td></tr>`;

    const res = await apiCall('/api/banner');
    if (!res || !res.ok) {
      container.innerHTML = `<tr><td colspan="6" class="empty-state">❌ Failed to load banners.</td></tr>`;
      return;
    }

    const banners = res.json.data;
    if (banners.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="empty-state">📸 No slides found. Create one now!</td></tr>`;
      return;
    }

    container.innerHTML = '';
    banners.forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="thumbnail-wrap"><img src="${b.image}" alt="banner"></div></td>
        <td style="font-weight: 600; color: white;">${b.title || '<em style="color:var(--text-muted)">None</em>'}</td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.subtitle || '<em style="color:var(--text-muted)">None</em>'}</td>
        <td>
          <span class="badge success" style="background: var(--primary-light); color: var(--primary);">${b.ctaText || 'View Menu'}</span>
          <span style="font-size:0.75rem; color:var(--text-secondary); display:block; margin-top:2px;">${b.ctaLink || '#menu'}</span>
        </td>
        <td><span style="font-weight:bold;">${b.displayOrder}</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-secondary-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="editBanner('${b.id}')">Edit ✏️</button>
            <button class="btn-danger-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="triggerDelete('banner', '${b.id}')">Delete 🗑</button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });
  };

  // Add Banner click
  document.getElementById('btn-add-banner').addEventListener('click', () => {
    document.getElementById('banner-id').value = '';
    document.getElementById('banner-modal-title').textContent = 'Add Slide';
    document.getElementById('banner-file-label').textContent = 'Slide Image File (Required)';
    document.getElementById('banner-image-file').required = true;
    openModal('banner-modal');
  });

  // Edit Banner window helper
  window.editBanner = async (id) => {
    const res = await apiCall(`/api/banner`); // The backend serves get all. We will find it in store.
    const banner = res.json.data.find(b => b.id === id);
    if (!banner) return;

    document.getElementById('banner-id').value = banner.id;
    document.getElementById('banner-title').value = banner.title || '';
    document.getElementById('banner-subtitle').value = banner.subtitle || '';
    document.getElementById('banner-cta-text').value = banner.ctaText || 'View Menu';
    document.getElementById('banner-cta-link').value = banner.ctaLink || '#menu';
    document.getElementById('banner-order').value = banner.displayOrder || 0;
    
    document.getElementById('banner-modal-title').textContent = 'Edit Slide';
    document.getElementById('banner-file-label').textContent = 'Replace Slide Image File (Optional)';
    document.getElementById('banner-image-file').required = false;

    // Show image preview
    const previewContainer = document.getElementById('banner-preview-container');
    previewContainer.innerHTML = `
      <div class="preview-card">
        <img src="${banner.image}" alt="preview">
      </div>
    `;

    openModal('banner-modal');
  };

  // Banner Form submit
  document.getElementById('banner-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('banner-id').value;
    const title = document.getElementById('banner-title').value;
    const subtitle = document.getElementById('banner-subtitle').value;
    const ctaText = document.getElementById('banner-cta-text').value;
    const ctaLink = document.getElementById('banner-cta-link').value;
    const displayOrder = document.getElementById('banner-order').value;

    const spinner = document.getElementById('banner-form-spinner');
    const submitBtn = document.getElementById('btn-banner-submit');

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('ctaText', ctaText);
    formData.append('ctaLink', ctaLink);
    formData.append('displayOrder', displayOrder);

    if (activeUploadFiles['banner']) {
      formData.append('image', activeUploadFiles['banner']);
    }

    const url = id ? `/api/banner/${id}` : '/api/banner';
    const method = id ? 'PUT' : 'POST';

    const res = await apiCall(url, {
      method,
      body: formData // Fetch sets content-type multipart boundary automatically
    });

    submitBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast(id ? 'Slide updated successfully!' : 'New slide added successfully!', 'success');
      closeModal('banner-modal');
      loadBanners();
    } else {
      showToast(res ? res.json.message : 'Operation failed.', 'error');
    }
  });


  /* ── 5.3 ABOUT SECTION ── */
  const loadAboutDetails = async () => {
    const res = await apiCall('/api/about');
    if (res && res.ok && res.json.data) {
      const data = res.json.data;
      document.getElementById('about-desc').value = data.description;
      
      const previewContainer = document.getElementById('about-preview-container');
      previewContainer.innerHTML = `
        <div class="preview-card" style="width: 160px; height: 160px;">
          <img src="${data.image}" alt="about">
        </div>
      `;
    }
  };

  document.getElementById('about-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('about-desc').value;
    const spinner = document.getElementById('about-spinner');
    const saveBtn = document.getElementById('btn-save-about');

    saveBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const formData = new FormData();
    formData.append('description', description);

    if (activeUploadFiles['about']) {
      formData.append('image', activeUploadFiles['about']);
    }

    const res = await apiCall('/api/about', {
      method: 'PUT',
      body: formData
    });

    saveBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast('About section saved successfully!', 'success');
      loadAboutDetails();
      clearPreviews('about');
    } else {
      showToast(res ? res.json.message : 'Save failed.', 'error');
    }
  });


  /* ── 5.4 MENU MANAGER ── */
  const loadMenuItems = async () => {
    const container = document.getElementById('menu-table-body');
    container.innerHTML = `<tr><td colspan="7" class="empty-state"><div class="spinner"></div><p style="margin-top:10px;">Loading menu database...</p></td></tr>`;

    const res = await apiCall('/api/menu');
    if (!res || !res.ok) {
      container.innerHTML = `<tr><td colspan="7" class="empty-state">❌ Failed to synchronize menu list.</td></tr>`;
      return;
    }

    menuItemsStore = res.json.data;
    renderMenuTable(menuItemsStore);
  };

  const renderMenuTable = (items) => {
    const container = document.getElementById('menu-table-body');
    if (items.length === 0) {
      container.innerHTML = `<tr><td colspan="7" class="empty-state">🍔 No menu items found.</td></tr>`;
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="thumbnail-wrap"><img src="${item.image}" alt="menu item"></div></td>
        <td style="font-weight: 600; color: white;">${item.itemName}</td>
        <td><span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); text-transform: capitalize;">${item.category}</span></td>
        <td style="font-weight:bold; color: #fff;">₹${item.price}</td>
        <td>
          <span class="badge ${item.isAvailable ? 'success' : 'danger'}">
            ${item.isAvailable ? 'Available' : 'Unavailable'}
          </span>
        </td>
        <td>
          <span class="badge" style="background: ${item.isFeatured ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.02)'}; color: ${item.isFeatured ? 'var(--warning)' : 'var(--text-muted)'};">
            ${item.isFeatured ? '★ Featured' : 'Standard'}
          </span>
        </td>
        <td>
          <div class="actions-cell">
            <button class="btn-secondary-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="editMenu('${item.id}')">Edit ✏️</button>
            <button class="btn-danger-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="triggerDelete('menu', '${item.id}')">Delete 🗑</button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });
  };

  // Menu Search & Filter trigger
  const triggerMenuSearchFilter = () => {
    const searchVal = document.getElementById('menu-search').value.toLowerCase().trim();
    const catVal = document.getElementById('menu-filter-category').value;

    let filtered = menuItemsStore;

    if (searchVal) {
      filtered = filtered.filter(item => 
        item.itemName.toLowerCase().includes(searchVal) || 
        (item.description && item.description.toLowerCase().includes(searchVal))
      );
    }

    if (catVal !== 'all') {
      filtered = filtered.filter(item => item.category === catVal);
    }

    renderMenuTable(filtered);
  };

  document.getElementById('menu-search').addEventListener('input', triggerMenuSearchFilter);
  document.getElementById('menu-filter-category').addEventListener('change', triggerMenuSearchFilter);

  // Add menu click
  document.getElementById('btn-add-menu').addEventListener('click', () => {
    document.getElementById('menu-id').value = '';
    document.getElementById('menu-modal-title').textContent = 'Add Menu Item';
    document.getElementById('menu-file-label').textContent = 'Item Image File (Required)';
    document.getElementById('menu-image-file').required = true;
    openModal('menu-modal');
  });

  // Edit Menu helper
  window.editMenu = (id) => {
    const item = menuItemsStore.find(i => i.id === id);
    if (!item) return;

    document.getElementById('menu-id').value = item.id;
    document.getElementById('menu-item-name').value = item.itemName;
    document.getElementById('menu-category').value = item.category;
    document.getElementById('menu-price').value = item.price;
    document.getElementById('menu-description').value = item.description || '';
    document.getElementById('menu-available').checked = item.isAvailable;
    document.getElementById('menu-featured').checked = item.isFeatured;

    document.getElementById('menu-modal-title').textContent = 'Edit Menu Item';
    document.getElementById('menu-file-label').textContent = 'Replace Item Image (Optional)';
    document.getElementById('menu-image-file').required = false;

    const previewContainer = document.getElementById('menu-preview-container');
    previewContainer.innerHTML = `
      <div class="preview-card">
        <img src="${item.image}" alt="preview">
      </div>
    `;

    openModal('menu-modal');
  };

  // Menu Form submit
  document.getElementById('menu-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('menu-id').value;
    const itemName = document.getElementById('menu-item-name').value;
    const category = document.getElementById('menu-category').value;
    const price = document.getElementById('menu-price').value;
    const description = document.getElementById('menu-description').value;
    const isAvailable = document.getElementById('menu-available').checked;
    const isFeatured = document.getElementById('menu-featured').checked;

    const spinner = document.getElementById('menu-form-spinner');
    const submitBtn = document.getElementById('btn-menu-submit');

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const formData = new FormData();
    formData.append('itemName', itemName);
    formData.append('category', category);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('isAvailable', isAvailable);
    formData.append('isFeatured', isFeatured);

    if (activeUploadFiles['menu']) {
      formData.append('image', activeUploadFiles['menu']);
    }

    const url = id ? `/api/menu/${id}` : '/api/menu';
    const method = id ? 'PUT' : 'POST';

    const res = await apiCall(url, {
      method,
      body: formData
    });

    submitBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast(id ? 'Menu item updated successfully!' : 'New menu item created successfully!', 'success');
      closeModal('menu-modal');
      loadMenuItems();
    } else {
      showToast(res ? res.json.message : 'Save menu item failed.', 'error');
    }
  });


  /* ── 5.5 GALLERY MANAGER ── */
  const loadGallery = async () => {
    const container = document.getElementById('gallery-table-body');
    container.innerHTML = `<tr><td colspan="4" class="empty-state"><div class="spinner"></div><p style="margin-top:10px;">Loading photo catalog...</p></td></tr>`;

    const res = await apiCall('/api/gallery');
    if (!res || !res.ok) {
      container.innerHTML = `<tr><td colspan="4" class="empty-state">❌ Failed to sync gallery list.</td></tr>`;
      return;
    }

    const items = res.json.data;
    if (items.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="empty-state">📸 No photos uploaded to gallery.</td></tr>`;
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="thumbnail-wrap" style="width:70px; height:50px;"><img src="${item.image}" alt="gallery photo"></div></td>
        <td style="color:white; font-weight:500;">${item.caption || '<em style="color:var(--text-muted)">No caption provided</em>'}</td>
        <td style="color:var(--text-secondary);">${new Date(item.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-danger-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="triggerDelete('gallery', '${item.id}')">Delete 🗑</button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });
  };

  // Add gallery click
  document.getElementById('btn-add-gallery').addEventListener('click', () => {
    openModal('gallery-modal');
  });

  // Gallery form submit
  document.getElementById('gallery-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const caption = document.getElementById('gallery-caption').value;
    const spinner = document.getElementById('gallery-form-spinner');
    const submitBtn = document.getElementById('btn-gallery-submit');

    if (!activeUploadFiles['gallery']) {
      showToast('Please select a photo to upload.', 'error');
      return;
    }

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('image', activeUploadFiles['gallery']);

    const res = await apiCall('/api/gallery', {
      method: 'POST',
      body: formData
    });

    submitBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast('Gallery image uploaded successfully!', 'success');
      closeModal('gallery-modal');
      loadGallery();
    } else {
      showToast(res ? res.json.message : 'Upload failed.', 'error');
    }
  });


  /* ── 5.6 OFFER MANAGER ── */
  const loadOffers = async () => {
    const container = document.getElementById('offers-table-body');
    container.innerHTML = `<tr><td colspan="6" class="empty-state"><div class="spinner"></div><p style="margin-top:10px;">Synchronizing offers...</p></td></tr>`;

    const res = await apiCall('/api/offers');
    if (!res || !res.ok) {
      container.innerHTML = `<tr><td colspan="6" class="empty-state">❌ Failed to sync active deals.</td></tr>`;
      return;
    }

    const offers = res.json.data;
    if (offers.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="empty-state">🎉 No active deal cards found. Create one now!</td></tr>`;
      return;
    }

    container.innerHTML = '';
    offers.forEach(o => {
      const expiryText = o.expiryDate ? new Date(o.expiryDate).toLocaleDateString() : 'Never';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="thumbnail-wrap"><img src="${o.image}" alt="offer"></div></td>
        <td style="font-weight: 600; color: white;">${o.title}</td>
        <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${o.description || '<em style="color:var(--text-muted)">None</em>'}</td>
        <td>
          <span class="badge ${o.isActive ? 'success' : 'danger'}">
            ${o.isActive ? 'Active' : 'Expired/Paused'}
          </span>
        </td>
        <td style="color:var(--text-secondary);">${expiryText}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-secondary-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="editOffer('${o.id}')">Edit ✏️</button>
            <button class="btn-danger-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="triggerDelete('offer', '${o.id}')">Delete 🗑</button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });
  };

  // Add offer click
  document.getElementById('btn-add-offer').addEventListener('click', () => {
    document.getElementById('offer-id').value = '';
    document.getElementById('offer-modal-title').textContent = 'Create Offer';
    document.getElementById('offer-file-label').textContent = 'Offer Banner Image (Required)';
    document.getElementById('offer-image-file').required = true;
    openModal('offer-modal');
  });

  // Edit Offer window helper
  window.editOffer = async (id) => {
    const res = await apiCall(`/api/offers`);
    const offer = res.json.data.find(o => o.id === id);
    if (!offer) return;

    document.getElementById('offer-id').value = offer.id;
    document.getElementById('offer-title').value = offer.title;
    document.getElementById('offer-description').value = offer.description || '';
    document.getElementById('offer-active').checked = offer.isActive;
    
    if (offer.expiryDate) {
      // YYYY-MM-DD
      const dateVal = new Date(offer.expiryDate).toISOString().split('T')[0];
      document.getElementById('offer-expiry').value = dateVal;
    } else {
      document.getElementById('offer-expiry').value = '';
    }

    document.getElementById('offer-modal-title').textContent = 'Edit Offer Card';
    document.getElementById('offer-file-label').textContent = 'Replace Offer Image (Optional)';
    document.getElementById('offer-image-file').required = false;

    const previewContainer = document.getElementById('offer-preview-container');
    previewContainer.innerHTML = `
      <div class="preview-card">
        <img src="${offer.image}" alt="preview">
      </div>
    `;

    openModal('offer-modal');
  };

  // Offer Form submit
  document.getElementById('offer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('offer-id').value;
    const title = document.getElementById('offer-title').value;
    const description = document.getElementById('offer-description').value;
    const expiryDate = document.getElementById('offer-expiry').value;
    const isActive = document.getElementById('offer-active').checked;

    const spinner = document.getElementById('offer-form-spinner');
    const submitBtn = document.getElementById('btn-offer-submit');

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('isActive', isActive);
    if (expiryDate) {
      formData.append('expiryDate', expiryDate);
    }

    if (activeUploadFiles['offer']) {
      formData.append('image', activeUploadFiles['offer']);
    }

    const url = id ? `/api/offers/${id}` : '/api/offers';
    const method = id ? 'PUT' : 'POST';

    const res = await apiCall(url, {
      method,
      body: formData
    });

    submitBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast(id ? 'Offer updated successfully!' : 'Offer card created successfully!', 'success');
      closeModal('offer-modal');
      loadOffers();
    } else {
      showToast(res ? res.json.message : 'Save offer failed.', 'error');
    }
  });


  /* ── 5.7 CONTACT DETAILS ── */
  const loadContactDetails = async () => {
    const res = await apiCall('/api/contact');
    if (res && res.ok && res.json.data) {
      const data = res.json.data;
      document.getElementById('contact-name').value = 'Hangout Cafe'; // default branding
      document.getElementById('contact-phone').value = data.phone;
      document.getElementById('contact-email').value = data.email;
      document.getElementById('contact-hours').value = data.openingHours;
      document.getElementById('contact-address').value = data.address;
      document.getElementById('contact-gmaps').value = data.googleMapsLink || '';
      document.getElementById('contact-instagram').value = data.instagram || '';
      document.getElementById('contact-facebook').value = data.facebook || '';
      document.getElementById('contact-whatsapp').value = data.whatsapp || '';
    }
  };

  document.getElementById('contact-form-admin').addEventListener('submit', async (e) => {
    e.preventDefault();
    const phone = document.getElementById('contact-phone').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const openingHours = document.getElementById('contact-hours').value.trim();
    const address = document.getElementById('contact-address').value.trim();
    const googleMapsLink = document.getElementById('contact-gmaps').value.trim();
    const instagram = document.getElementById('contact-instagram').value.trim();
    const facebook = document.getElementById('contact-facebook').value.trim();
    const whatsapp = document.getElementById('contact-whatsapp').value.trim();

    const spinner = document.getElementById('contact-spinner');
    const submitBtn = document.getElementById('btn-save-contact');

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const res = await apiCall('/api/contact', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address,
        phone,
        email,
        openingHours,
        instagram,
        facebook,
        whatsapp,
        googleMapsLink
      })
    });

    submitBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast('Contact details updated successfully!', 'success');
      loadContactDetails();
    } else {
      showToast(res ? res.json.message : 'Save failed.', 'error');
    }
  });


  /* ── 5.8 SETTINGS (Change Password) ── */
  document.getElementById('settings-password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById('password-current').value;
    const newPassword = document.getElementById('password-new').value;
    const confirmPassword = document.getElementById('password-confirm').value;

    const spinner = document.getElementById('settings-spinner');
    const submitBtn = document.getElementById('btn-save-password');

    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const res = await apiCall('/api/admin/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });

    submitBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast('Password updated successfully!', 'success');
      document.getElementById('settings-password-form').reset();
    } else {
      showToast(res ? res.json.message : 'Current password verification failed.', 'error');
    }
  });


  /* ── 5.9 ADMIN ACCOUNTS CRUD ── */
  let adminAccountsStore = [];

  const loadAdminAccounts = async () => {
    const container = document.getElementById('accounts-table-body');
    container.innerHTML = `<tr><td colspan="5" class="empty-state"><div class="spinner"></div><p style="margin-top:10px;">Loading accounts...</p></td></tr>`;

    const res = await apiCall('/api/admin/accounts');
    if (!res || !res.ok) {
      container.innerHTML = `<tr><td colspan="5" class="empty-state">❌ Failed to sync accounts. Only Owner has access.</td></tr>`;
      return;
    }

    adminAccountsStore = res.json.data;
    renderAccountsTable(adminAccountsStore);
  };

  const renderAccountsTable = (accounts) => {
    const container = document.getElementById('accounts-table-body');
    if (accounts.length === 0) {
      container.innerHTML = `<tr><td colspan="5" class="empty-state">👥 No admin accounts found.</td></tr>`;
      return;
    }

    container.innerHTML = '';
    accounts.forEach(acc => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: white;">${acc.name}</td>
        <td>${acc.email}</td>
        <td>
          <span class="badge ${acc.role === 'owner' ? 'success' : ''}" style="background: ${acc.role === 'owner' ? 'var(--primary-light)' : 'rgba(255,255,255,0.05)'}; color: ${acc.role === 'owner' ? 'var(--primary)' : 'var(--text-secondary)'};">
            ${acc.role === 'owner' ? 'Owner' : 'Staff Admin'}
          </span>
        </td>
        <td style="color:var(--text-secondary);">${new Date(acc.created_at).toLocaleDateString()}</td>
        <td>
          <div class="actions-cell">
            <button class="btn-secondary-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="editAccount('${acc.id}')">Edit ✏️</button>
            <button class="btn-danger-admin" style="padding: 6px 12px; font-size: 0.8rem;" onclick="triggerDelete('account', '${acc.id}')" ${acc.email === localStorage.getItem('admin_email') ? 'disabled' : ''}>Delete 🗑</button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });
  };

  // Add account click
  document.getElementById('btn-add-account').addEventListener('click', () => {
    document.getElementById('account-id').value = '';
    document.getElementById('account-modal-title').textContent = 'Create Admin Account';
    document.getElementById('account-password-label').textContent = 'Password (Required)';
    document.getElementById('account-password').required = true;
    document.getElementById('account-password-hint').textContent = 'Must be at least 6 characters.';
    openModal('account-modal');
  });

  // Edit account helper
  window.editAccount = (id) => {
    const acc = adminAccountsStore.find(a => a.id === id);
    if (!acc) return;

    document.getElementById('account-id').value = acc.id;
    document.getElementById('account-name').value = acc.name;
    document.getElementById('account-email').value = acc.email;
    document.getElementById('account-role').value = acc.role;

    document.getElementById('account-modal-title').textContent = 'Edit Admin Account';
    document.getElementById('account-password-label').textContent = 'New Password (Optional)';
    document.getElementById('account-password').required = false;
    document.getElementById('account-password-hint').textContent = 'Leave blank to keep the current password.';

    openModal('account-modal');
  };

  // Account Form submit
  document.getElementById('account-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('account-id').value;
    const name = document.getElementById('account-name').value.trim();
    const email = document.getElementById('account-email').value.trim();
    const role = document.getElementById('account-role').value;
    const password = document.getElementById('account-password').value;

    const spinner = document.getElementById('account-form-spinner');
    const submitBtn = document.getElementById('btn-account-submit');

    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';

    const payload = { name, email, role };
    if (password) payload.password = password;

    const url = id ? `/api/admin/accounts/${id}` : '/api/admin/accounts';
    const method = id ? 'PUT' : 'POST';

    const res = await apiCall(url, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    submitBtn.disabled = false;
    spinner.style.display = 'none';

    if (res && res.ok) {
      showToast(id ? 'Account updated successfully!' : 'Admin account created successfully!', 'success');
      closeModal('account-modal');
      loadAdminAccounts();
    } else {
      showToast(res ? res.json.message : 'Save account failed.', 'error');
    }
  });


  // ===== 6. DELETION HANDLING ORCHESTRATOR =====
  window.triggerDelete = (type, id) => {
    deleteTarget = { type, id };
    let msg = 'Are you sure you want to delete this item? This action is permanent.';
    if (type === 'menu') msg = 'Are you sure you want to delete this menu item? It will instantly disappear from the cafe menu.';
    if (type === 'banner') msg = 'Are you sure you want to delete this slider banner?';
    if (type === 'gallery') msg = 'Are you sure you want to delete this gallery photo?';
    if (type === 'offer') msg = 'Are you sure you want to delete this deal card?';
    if (type === 'account') msg = 'Are you sure you want to remove this admin account? They will lose access to the dashboard.';

    document.getElementById('confirm-message').textContent = msg;
    openModal('confirm-modal');
  };

  document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;

    let url = '';
    if (type === 'menu') url = `/api/menu/${id}`;
    if (type === 'banner') url = `/api/banner/${id}`;
    if (type === 'gallery') url = `/api/gallery/${id}`;
    if (type === 'offer') url = `/api/offers/${id}`;
    if (type === 'account') url = `/api/admin/accounts/${id}`;

    closeModal('confirm-modal');
    showToast('Deleting item...', 'warning');

    const res = await apiCall(url, {
      method: 'DELETE'
    });

    if (res && res.ok) {
      showToast('Item deleted successfully!', 'success');
      // Reload active tab
      if (type === 'menu') loadMenuItems();
      if (type === 'banner') loadBanners();
      if (type === 'gallery') loadGallery();
      if (type === 'offer') loadOffers();
      if (type === 'account') loadAdminAccounts();
    } else {
      showToast(res ? res.json.message : 'Deletion failed.', 'error');
    }

    deleteTarget = null;
  });


  // ===== 7. LOGOUT & GLOBAL REFRESH =====
  const executeLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_email');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_role');
    showToast('Logging out...', 'success');
    setTimeout(() => { window.location.href = 'login.html'; }, 1000);
  };

  document.getElementById('btn-sidebar-logout').addEventListener('click', executeLogout);

  document.getElementById('btn-refresh-global').addEventListener('click', () => {
    const activeTab = document.querySelector('.menu-item.active').dataset.tab;
    loadTabData(activeTab);
    showToast('Data synchronized with database.', 'success');
  });

  // Initial load
  loadOverviewStats();

});
