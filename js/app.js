/**
 * DOLANESIA - Main Application Controller
 * Mengatur SPA Multi-Page Navigation, Autentikasi Pengguna & Administrator,
 * Profil Traveler Lengkap, Auto-Planner AI Interaktif, Direktori Solo Raya, 
 * Keranjang Rencana, dan Travel Buddy Matching.
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. DATA SEEDING & STATE INITIALIZATION
  // =========================================================================

  // Pre-seeded demo accounts
  const DEMO_CUSTOMER = {
    id: 'user-rian',
    name: 'Rian Setyawan',
    phone: '0812-3456-7890',
    email: 'rian.traveler@gmail.com',
    city: 'Jakarta Selatan',
    bio: 'Pecinta kuliner legendaris dan penikmat suasana tenang kota Solo. Senang berteman dengan sesama solo traveler!',
    role: 'customer',
    roleLabel: 'Solo Traveler Explorer',
    joinedAt: 'Maret 2026',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    preference: 'Kuliner Otentik & Cagar Budaya'
  };

  const DEMO_ADMIN = {
    id: 'admin-budi',
    name: 'Budi Santoso',
    phone: '0811-9876-5432',
    email: 'admin@dolanesia.id',
    city: 'Surakarta (Solo)',
    bio: 'Staff Kurasi Pariwisata & Komunitas Dolanesia Solo Raya.',
    role: 'admin',
    roleLabel: 'Super Administrator',
    joinedAt: 'Januari 2026',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    preference: 'Manajemen Destinasi'
  };

  // Pristine default destinations helper
  function getPristineDestinations() {
    const raw = window.SOLO_DESTINATIONS_DEFAULT || window.SOLO_DESTINATIONS || [];
    return JSON.parse(JSON.stringify(raw));
  }

  // Load unified destinations catalog from localStorage, falling back to pristine SOLO_DESTINATIONS
  let allDestinations = [];
  const storedAllDest = localStorage.getItem('dolanesia_all_destinations');
  if (storedAllDest) {
    try {
      allDestinations = JSON.parse(storedAllDest);
      if (!Array.isArray(allDestinations) || allDestinations.length === 0) {
        allDestinations = getPristineDestinations();
      }
    } catch (e) {
      allDestinations = getPristineDestinations();
    }
  } else {
    // Check legacy custom destinations if user previously added some
    const legacyCustom = JSON.parse(localStorage.getItem('dolanesia_custom_destinations')) || [];
    allDestinations = [...getPristineDestinations(), ...legacyCustom];
    localStorage.setItem('dolanesia_all_destinations', JSON.stringify(allDestinations));
  }
  const initialDestinations = allDestinations;

  // Default initial registered users list for demo lookup
  let registeredUsers = JSON.parse(localStorage.getItem('dolanesia_registered_users')) || [
    DEMO_ADMIN,
    DEMO_CUSTOMER,
    {
      id: 'user-nadia',
      name: 'Nadia Safira',
      phone: '0857-1122-3344',
      email: 'nadia.safira@gmail.com',
      city: 'Bandung',
      bio: 'Suka berburu foto arsitektur keraton dan belanja batik klasik.',
      role: 'customer',
      roleLabel: 'Solo Traveler Explorer',
      joinedAt: 'Februari 2026',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      preference: 'Sejarah & Belanja'
    }
  ];

  // Active user session
  // Clean up legacy auto-seeded demo customer session so website starts as guest by default
  const authMigrated = localStorage.getItem('dolanesia_auth_v2');
  if (!authMigrated) {
    localStorage.removeItem('dolanesia_user');
    localStorage.setItem('dolanesia_auth_v2', 'true');
  }

  let activeUser = null;
  const storedUser = localStorage.getItem('dolanesia_user');
  if (storedUser) {
    try {
      activeUser = JSON.parse(storedUser);
    } catch (e) {
      activeUser = null;
    }
  }

  // Notification preferences
  const savedNotificationPrefs = JSON.parse(localStorage.getItem('dolanesia_notification_prefs')) || {
    waReminders: true,
    buddyNotifications: true
  };

  const state = {
    destinations: initialDestinations,
    openTrips: JSON.parse(localStorage.getItem('dolanesia_open_trips')) || (window.SOLO_OPEN_TRIPS || []),
    customItinerary: JSON.parse(localStorage.getItem('dolanesia_custom_itinerary')) || [],
    currentUser: activeUser,
    registeredUsers: registeredUsers,
    activePage: 'beranda',
    activeFilterCategory: 'all',
    activeFilterRegion: 'all',
    activeSort: 'popular',
    searchQuery: '',
    currentGeneratedPlan: null,
    isCartPlan: false,
    activeDayTab: 1,
    activeProfileTab: 'edit-info',
    notificationPrefs: savedNotificationPrefs
  };

  const planner = new DolanesiaPlanner(state.destinations);

  // Initialize Lucide Icons
  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
  refreshIcons();

  // =========================================================================
  // 2. DOM ELEMENTS CACHE
  // =========================================================================
  const elements = {
    // Nav & Drawers
    mobileMenuBtn: document.getElementById('btn-mobile-menu'),
    mobileMenuDrawer: document.getElementById('mobile-drawer'),
    closeMobileMenuBtn: document.getElementById('btn-close-mobile-menu'),
    navAuthContainer: document.getElementById('nav-auth-container'),
    mobileDrawerAuthBanner: document.getElementById('mobile-drawer-auth-banner'),
    mobileDrawerAdminBtn: document.getElementById('btn-mobile-drawer-admin'),
    desktopNavLinks: document.getElementById('desktop-nav-links'),
    btnCartFloating: document.getElementById('btn-cart-floating'),
    navbarAdminCenter: document.getElementById('navbar-admin-center'),
    adminPreviewBanner: document.getElementById('admin-preview-top-banner'),
    btnNavbarReturnAdmin: document.getElementById('btn-navbar-return-admin'),
    bottomNav: document.getElementById('bottom-nav'),

    // PWA & Download App Elements
    btnInstallAppHeader: document.getElementById('btn-install-app-header'),
    drawerInstallAppBanner: document.getElementById('drawer-install-app-banner'),
    btnInstallAppDrawer: document.getElementById('btn-install-app-drawer'),
    pwaInstallModal: document.getElementById('pwa-install-modal'),
    btnClosePwaModal: document.getElementById('btn-close-pwa-modal'),
    btnDonePwaModal: document.getElementById('btn-done-pwa-modal'),
    pwaPromptContainer: document.getElementById('pwa-prompt-container'),
    btnPwaDirectPrompt: document.getElementById('btn-pwa-direct-prompt'),
    btnToggleAppPreview: document.getElementById('btn-toggle-app-preview'),
    btnToggleAppPreviewText: document.getElementById('btn-toggle-app-preview-text'),

    // Auto Planner
    plannerForm: document.getElementById('auto-planner-form'),
    durationSelect: document.getElementById('plan-duration'),
    interestSelect: document.getElementById('plan-interest'),
    budgetSelect: document.getElementById('plan-budget'),
    transportSelect: document.getElementById('plan-transport'),
    plannerLoading: document.getElementById('planner-loading'),
    plannerResults: document.getElementById('planner-results'),
    dayTabsContainer: document.getElementById('day-tabs-container'),
    itineraryTimeline: document.getElementById('itinerary-timeline'),
    planSummaryStats: document.getElementById('plan-summary-stats'),
    btnShareWA: document.getElementById('btn-share-itinerary-wa'),
    btnPrintItinerary: document.getElementById('btn-print-itinerary'),
    cartPlanBanner: document.getElementById('cart-plan-banner'),
    btnResetToAutoPlan: document.getElementById('btn-reset-to-auto-plan'),
    printableItinerary: document.getElementById('printable-itinerary'),

    // Quick Add Slot Modal
    addToDayModal: document.getElementById('add-to-day-modal'),
    btnCloseAddDayModal: document.getElementById('btn-close-add-day-modal'),
    quickAddSearch: document.getElementById('quick-add-search'),
    quickAddDestList: document.getElementById('quick-add-dest-list'),

    // Directory
    directoryGrid: document.getElementById('directory-grid'),
    directoryCountBadge: document.getElementById('directory-count-badge'),
    categoryFilters: document.querySelectorAll('.category-filter-btn'),
    regionFilter: document.getElementById('region-filter-select'),
    directorySortSelect: document.getElementById('directory-sort-select'),
    directorySearchInput: document.getElementById('directory-search-input'),

    // Home Spotlight
    homeSpotlightGrid: document.getElementById('home-spotlight-grid'),

    // Custom Itinerary (Cart) Drawer
    cartFloatingBtn: document.getElementById('btn-cart-floating'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartDrawerBackdrop: document.getElementById('cart-drawer-backdrop'),
    closeCartBtn: document.getElementById('btn-close-cart'),
    cartItemsList: document.getElementById('cart-items-list'),
    cartTotalCost: document.getElementById('cart-total-cost'),
    cartBadge: document.getElementById('cart-badge-count'),
    btnClearCart: document.getElementById('btn-clear-cart'),
    btnGenerateFromCart: document.getElementById('btn-generate-from-cart'),

    // Travel Buddy
    openTripsGrid: document.getElementById('open-trips-grid'),
    btnCreateTrip: document.getElementById('btn-create-trip-modal'),

    // Modals
    loginModal: document.getElementById('login-modal'),
    closeLoginModalBtn: document.getElementById('btn-close-login-modal'),
    detailModal: document.getElementById('destination-detail-modal'),
    closeDetailModalBtn: document.getElementById('btn-close-detail-modal'),
    joinTripModal: document.getElementById('join-trip-modal'),
    closeJoinTripModalBtn: document.getElementById('btn-close-join-trip-modal'),
    createTripModal: document.getElementById('create-trip-modal'),
    closeCreateTripModalBtn: document.getElementById('btn-close-create-trip-modal'),

    // Forms
    formLoginCustomer: document.getElementById('form-login-customer'),
    formRegisterCustomer: document.getElementById('form-register-customer'),
    formLoginAdmin: document.getElementById('form-login-admin'),
    formUpdateProfile: document.getElementById('form-update-profile'),
    formChangePassword: document.getElementById('form-change-password'),
    formAdminDestModal: document.getElementById('form-admin-dest-modal'),

    // Admin Specific
    adminCountTrips: document.getElementById('admin-count-trips'),
    adminCountDestinations: document.getElementById('admin-count-destinations'),
    adminCountUsers: document.getElementById('admin-count-users'),
    badgeTabDestCount: document.getElementById('badge-tab-dest-count'),
    badgeTabTripsCount: document.getElementById('badge-tab-trips-count'),
    badgeTabUsersCount: document.getElementById('badge-tab-users-count'),
    adminDestModal: document.getElementById('admin-dest-modal'),
    adminAllDestTable: document.getElementById('admin-all-destinations-table'),
    adminDestSearch: document.getElementById('admin-dest-search'),
    adminDestFilterCat: document.getElementById('admin-dest-filter-cat'),
    adminDestFilterRegion: document.getElementById('admin-dest-filter-region'),
    adminDestEmptyState: document.getElementById('admin-dest-empty-state'),
    adminOpenTripsTable: document.getElementById('admin-open-trips-table'),
    adminUsersTable: document.getElementById('admin-users-table'),
    adminCategoryDistribution: document.getElementById('admin-category-distribution'),
    adminRegionDistribution: document.getElementById('admin-region-distribution'),
    adminActivityLogs: document.getElementById('admin-activity-logs'),

    // Settings
    settingWaReminders: document.getElementById('setting-wa-reminders'),
    settingBuddyNotifications: document.getElementById('setting-buddy-notifications')
  };

  // =========================================================================
  // 3. UI HELPERS: TOAST NOTIFICATIONS & MODALS
  // =========================================================================
  function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-600 text-white shadow-emerald-600/30',
      warning: 'bg-amber-600 text-white shadow-amber-600/30',
      error: 'bg-red-600 text-white shadow-red-600/30',
      info: 'bg-slate-800 text-white shadow-slate-900/30'
    };

    const icons = {
      success: '<i data-lucide="check-circle-2" class="w-4 h-4 flex-shrink-0"></i>',
      warning: '<i data-lucide="alert-triangle" class="w-4 h-4 flex-shrink-0"></i>',
      error: '<i data-lucide="x-circle" class="w-4 h-4 flex-shrink-0"></i>',
      info: '<i data-lucide="info" class="w-4 h-4 flex-shrink-0"></i>'
    };

    toast.className = `pointer-events-auto p-3.5 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold transform translate-y-3 opacity-0 transition-all duration-300 ${bgColors[type] || bgColors.success}`;
    toast.innerHTML = `
      ${icons[type] || icons.success}
      <span class="flex-grow leading-tight">${message}</span>
      <button class="opacity-70 hover:opacity-100 p-0.5 rounded transition-opacity" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
    `;

    toastContainer.appendChild(toast);
    refreshIcons();

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    });

    // Auto dismiss after 3.8s
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-3');
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  }

  // Expose to window for global inline accessibility
  window.showToast = showToast;

  function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove('hidden');
    modalEl.classList.add('flex');
    document.body.style.overflow = 'hidden';
    refreshIcons();
  }

  function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add('hidden');
    modalEl.classList.remove('flex');
    document.body.style.overflow = '';
  }

  // Cart Drawer open/close helpers with backdrop
  function openCartDrawer() {
    if (elements.cartDrawer) elements.cartDrawer.classList.remove('translate-x-full');
    if (elements.cartDrawerBackdrop) elements.cartDrawerBackdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    if (elements.cartDrawer) elements.cartDrawer.classList.add('translate-x-full');
    if (elements.cartDrawerBackdrop) elements.cartDrawerBackdrop.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // =========================================================================
  // 4. MULTI-PAGE SPA ROUTER & VIEW SWITCHER
  // =========================================================================
  const VALID_PAGES = ['beranda', 'planner', 'direktori', 'buddy', 'tentang', 'profil', 'admin'];

  // PWA Standalone Detection State (Web Browser vs Downloaded Mobile App)
  let isAppPreviewActive = false;

  function isStandaloneMode() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      window.location.search.includes('source=pwa') ||
      window.location.search.includes('mode=app') ||
      document.referrer.includes('android-app://') ||
      isAppPreviewActive
    );
  }

  // Dynamic Navbar Mode Switcher: Separates Admin Workspace from Tourist Views
  function updateNavbarMode() {
    const isAdmin = state.currentUser && state.currentUser.role === 'admin';
    const isViewingAdmin = state.activePage === 'admin';
    const isApp = isStandaloneMode();

    const desktopNavLinks = document.getElementById('desktop-nav-links');
    const btnCartFloating = document.getElementById('btn-cart-floating');
    const navbarAdminCenter = document.getElementById('navbar-admin-center');
    const adminPreviewBanner = document.getElementById('admin-preview-top-banner');
    const btnNavbarReturnAdmin = document.getElementById('btn-navbar-return-admin');
    const bottomNav = document.getElementById('bottom-nav');
    const mobileDrawerAdminBtn = document.getElementById('btn-mobile-drawer-admin');

    if (isViewingAdmin) {
      // 1. In Admin Panel View (#view-admin)
      // Hide tourist nav links and cart bookmark trigger
      if (desktopNavLinks) {
        desktopNavLinks.classList.add('hidden');
        desktopNavLinks.classList.remove('lg:flex');
      }
      if (btnCartFloating) btnCartFloating.classList.add('hidden');
      if (navbarAdminCenter) {
        navbarAdminCenter.classList.remove('hidden');
        navbarAdminCenter.classList.add('flex');
      }
      if (adminPreviewBanner) adminPreviewBanner.classList.add('hidden');
      if (btnNavbarReturnAdmin) {
        btnNavbarReturnAdmin.classList.add('hidden');
        btnNavbarReturnAdmin.classList.remove('flex');
      }
      if (bottomNav) {
        bottomNav.classList.add('hidden');
        bottomNav.classList.remove('flex');
      }
      const mobileMenuBtn = elements.mobileMenuBtn || document.getElementById('btn-mobile-menu');
      if (mobileMenuBtn) {
        mobileMenuBtn.classList.add('hidden');
        mobileMenuBtn.classList.remove('flex');
      }
    } else {
      // 2. In Tourist Views (Beranda, Planner, Direktori, Buddy, Tentang, Profil)
      // Show tourist nav links ONLY on desktop (hidden on mobile, lg:flex on desktop)
      if (desktopNavLinks) {
        desktopNavLinks.classList.add('hidden');
        desktopNavLinks.classList.add('lg:flex');
      }
      if (btnCartFloating) btnCartFloating.classList.remove('hidden');
      if (navbarAdminCenter) {
        navbarAdminCenter.classList.add('hidden');
        navbarAdminCenter.classList.remove('flex');
      }

      // NAVIGASI MOBILE:
      // 1. Saat di-download (Mode Aplikasi Standalone di HP):
      //    - Navbarnya ditaruh di BAGIAN BAWAH (#bottom-nav)
      //    - Tombol garis 3 (#btn-mobile-menu) GA USAH / DISEMBUNYIKAN!
      // 2. Saat belum di-download (Mode Web Browser biasa):
      //    - Navbar bawah disembunyikan
      //    - Tombol garis 3 (#btn-mobile-menu) DITAMPILKAN di mobile untuk buka menu drawer
      const mobileMenuBtn = elements.mobileMenuBtn || document.getElementById('btn-mobile-menu');

      if (isApp) {
        if (bottomNav) {
          bottomNav.classList.remove('hidden');
          bottomNav.classList.add('flex');
        }
        if (mobileMenuBtn) {
          mobileMenuBtn.classList.add('hidden');
          mobileMenuBtn.classList.remove('flex');
        }
      } else {
        if (bottomNav) {
          bottomNav.classList.add('hidden');
          bottomNav.classList.remove('flex');
        }
        if (mobileMenuBtn) {
          mobileMenuBtn.classList.remove('hidden');
          mobileMenuBtn.classList.add('flex');
        }
      }

      // Admin controls when in tourist view (Only for logged-in admins!)
      if (isAdmin) {
        if (adminPreviewBanner) adminPreviewBanner.classList.remove('hidden');
        if (btnNavbarReturnAdmin) {
          btnNavbarReturnAdmin.classList.remove('hidden');
          btnNavbarReturnAdmin.classList.add('flex');
        }
      } else {
        if (adminPreviewBanner) adminPreviewBanner.classList.add('hidden');
        if (btnNavbarReturnAdmin) {
          btnNavbarReturnAdmin.classList.add('hidden');
          btnNavbarReturnAdmin.classList.remove('flex');
        }
      }
    }

    // Toggle Mobile Drawer Download Banner
    if (elements.drawerInstallAppBanner) {
      elements.drawerInstallAppBanner.classList.toggle('hidden', isApp);
    }

    if (mobileDrawerAdminBtn) {
      if (isAdmin) {
        mobileDrawerAdminBtn.classList.remove('hidden');
      } else {
        mobileDrawerAdminBtn.classList.add('hidden');
      }
    }
  }

  function switchPage(pageId, updateHash = true) {
    if (!VALID_PAGES.includes(pageId)) {
      pageId = 'beranda';
    }

    // Role Guard: Administrator Page
    if (pageId === 'admin') {
      if (!state.currentUser || state.currentUser.role !== 'admin') {
        showToast('Akses Khusus: Silakan login sebagai Administrator Dolanesia terlebih dahulu.', 'warning');
        openModal(elements.loginModal);
        switchAuthModalTab('admin');
        return;
      }
    }

    // Auth Guard: Profile Page
    if (pageId === 'profil') {
      if (!state.currentUser) {
        showToast('Silakan masuk ke akun Anda terlebih dahulu.', 'info');
        openModal(elements.loginModal);
        switchAuthModalTab('customer');
        return;
      }
    }

    // Hide all views
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.add('hidden');
      view.classList.remove('page-view-active');
    });

    // Show target view
    const targetView = document.getElementById(`view-${pageId}`);
    if (targetView) {
      targetView.classList.remove('hidden');
      targetView.classList.add('page-view-active');
    }

    // Update active nav links in Desktop Header
    document.querySelectorAll('.desktop-nav-link').forEach(link => {
      const target = link.getAttribute('data-page-target');
      const isActive = target === pageId;
      link.classList.toggle('nav-link-active', isActive);
      link.classList.toggle('text-amber-600', isActive);
      link.classList.toggle('text-slate-600', !isActive);
    });

    // Update mobile drawer links
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      const target = link.getAttribute('data-page-target');
      const isActive = target === pageId;
      link.classList.toggle('bg-amber-50', isActive);
      link.classList.toggle('text-amber-700', isActive);
      link.classList.toggle('text-slate-700', !isActive);
    });

    // Update Mobile Bottom Navigation
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      const target = item.getAttribute('data-page-target');
      const isActive = target === pageId;
      item.classList.toggle('bottom-nav-active', isActive);
      item.classList.toggle('text-amber-600', isActive);
      item.classList.toggle('text-slate-400', !isActive);
    });

    // Close mobile drawer if opened
    if (elements.mobileMenuDrawer) {
      elements.mobileMenuDrawer.classList.add('-translate-x-full');
    }

    // Smooth scroll to top of window
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update URL hash
    if (updateHash) {
      window.location.hash = pageId;
    }

    state.activePage = pageId;

    // Apply Admin vs Tourist Navbar Mode
    updateNavbarMode();

    // View-specific trigger updates
    if (pageId === 'beranda') {
      renderHomeSpotlight();
    } else if (pageId === 'direktori') {
      renderDirectory();
    } else if (pageId === 'buddy') {
      renderOpenTrips();
    } else if (pageId === 'profil') {
      renderProfileView();
    } else if (pageId === 'admin') {
      renderAdminDashboard();
    }

    refreshIcons();
  }

  // Intercept all data-page-target clicks anywhere in the DOM
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-page-target]');
    if (trigger) {
      e.preventDefault();
      const targetPage = trigger.getAttribute('data-page-target');
      if (elements.mobileMenuDrawer) {
        elements.mobileMenuDrawer.classList.add('-translate-x-full');
      }
      switchPage(targetPage);
    }
  });

  // Listen to browser forward/back buttons via hashchange
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash && VALID_PAGES.includes(hash)) {
      switchPage(hash, false);
    }
  });

  // =========================================================================
  // 5. AUTHENTICATION & SESSION CONTROLLER
  // =========================================================================
  function renderAuthUI() {
    const user = state.currentUser;

    // A. Desktop Header Auth Container
    if (elements.navAuthContainer) {
      if (user) {
        const isAdmin = user.role === 'admin';
        const roleBadgeClass = isAdmin ? 'bg-purple-100 text-purple-800 border-purple-200' : 'bg-amber-100 text-amber-800 border-amber-200';
        
        elements.navAuthContainer.innerHTML = `
          <div class="relative" id="user-dropdown-wrapper">
            <button id="btn-user-dropdown-toggle" type="button" class="flex items-center gap-1.5 sm:gap-2 p-1 pl-2 sm:pl-2.5 rounded-2xl border ${isAdmin ? 'border-purple-200 bg-purple-50/70 hover:bg-purple-100/70 text-purple-900' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'} transition-all shadow-sm active:scale-98">
              <span class="w-2 h-2 rounded-full ${isAdmin ? 'bg-purple-600 animate-pulse' : 'bg-emerald-500'}"></span>
              <span class="text-xs font-bold hidden sm:inline max-w-[90px] truncate">${user.name.split(' ')[0]}</span>
              <img src="${user.avatar}" alt="${user.name}" class="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white">
              <i data-lucide="chevron-down" class="w-3.5 h-3.5 text-slate-400 transition-transform"></i>
            </button>

            <!-- Dropdown Menu (supports click toggle & hover) -->
            <div id="user-dropdown-menu" class="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 hidden transition-all z-50 animate-fadeInPage">
              <div class="px-4 py-2.5 border-b border-slate-100">
                <p class="text-xs font-bold text-slate-800 truncate">${user.name}</p>
                <p class="text-[10px] text-slate-400 truncate">${user.phone} • ${user.city}</p>
                <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${roleBadgeClass}">
                  ${user.roleLabel}
                </span>
              </div>

              ${isAdmin ? `
                <button data-page-target="admin" class="w-full text-left px-4 py-2.5 text-xs text-purple-700 hover:bg-purple-50 font-bold flex items-center gap-2.5 transition-colors">
                  <i data-lucide="shield" class="w-4 h-4 text-purple-600"></i>
                  <span>Dashboard Administrator</span>
                </button>
              ` : ''}

              <button data-page-target="profil" class="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 font-bold flex items-center gap-2.5 transition-colors">
                <i data-lucide="user-cog" class="w-4 h-4 text-amber-600"></i>
                <span>Profil & Pengaturan Akun</span>
              </button>

              <button id="btn-dropdown-open-cart" class="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 font-bold flex items-center justify-between transition-colors">
                <div class="flex items-center gap-2.5">
                  <i data-lucide="bookmark" class="w-4 h-4 text-amber-600"></i>
                  <span>Keranjang Rencana</span>
                </div>
                <span class="px-2 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  ${state.customItinerary.length}
                </span>
              </button>

              <button id="btn-dropdown-pwa-modal" class="w-full text-left px-4 py-2.5 text-xs text-amber-700 hover:bg-amber-50 font-bold flex items-center gap-2.5 transition-colors">
                <i data-lucide="download" class="w-4 h-4 text-amber-600"></i>
                <span>Download Aplikasi (PWA)</span>
              </button>

              <div class="border-t border-slate-100 my-1"></div>

              <button id="btn-dropdown-logout" class="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 font-bold flex items-center gap-2.5 transition-colors">
                <i data-lucide="log-out" class="w-4 h-4"></i>
                <span>Keluar (Logout)</span>
              </button>
            </div>
          </div>
        `;

        // Click toggle listener for user dropdown
        const toggleBtn = document.getElementById('btn-user-dropdown-toggle');
        const menuEl = document.getElementById('user-dropdown-menu');
        if (toggleBtn && menuEl) {
          toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuEl.classList.toggle('hidden');
          });
        }
      } else {
        elements.navAuthContainer.innerHTML = `
          <button id="btn-open-login-modal" class="px-2.5 sm:px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 transition-all active:scale-95">
            <i data-lucide="user" class="w-4 h-4"></i>
            <span class="hidden sm:inline">Masuk / Daftar</span>
            <span class="sm:hidden">Masuk</span>
          </button>
        `;
      }
    }

    // Close user dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const menuEl = document.getElementById('user-dropdown-menu');
      if (menuEl && !menuEl.classList.contains('hidden')) {
        const wrapper = document.getElementById('user-dropdown-wrapper');
        if (wrapper && !wrapper.contains(e.target)) {
          menuEl.classList.add('hidden');
        }
      }
    });

    // B. Mobile Drawer Auth Banner
    if (elements.mobileDrawerAuthBanner) {
      if (user) {
        const isAdmin = user.role === 'admin';
        elements.mobileDrawerAuthBanner.innerHTML = `
          <div class="flex items-center gap-3">
            <img src="${user.avatar}" alt="${user.name}" class="w-11 h-11 rounded-full object-cover ring-2 ring-amber-400 shadow-sm flex-shrink-0">
            <div class="min-w-0 flex-grow">
              <p class="text-xs font-bold text-slate-900 truncate">${user.name}</p>
              <p class="text-[10px] text-slate-500 truncate">${user.phone} (${user.city})</p>
              <span class="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[9px] font-bold ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}">
                ${user.roleLabel}
              </span>
            </div>
          </div>
          <div class="mt-3 pt-2.5 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold">
            <button data-page-target="profil" class="text-amber-800 hover:text-amber-900 flex items-center gap-1">
              <i data-lucide="user" class="w-3.5 h-3.5"></i> Akun Saya
            </button>
            <button id="btn-drawer-logout" class="text-red-600 hover:text-red-700 flex items-center gap-1">
              <i data-lucide="log-out" class="w-3.5 h-3.5"></i> Keluar
            </button>
          </div>
        `;
      } else {
        elements.mobileDrawerAuthBanner.innerHTML = `
          <div class="text-center py-1">
            <p class="text-xs font-bold text-slate-800">Sudah punya akun traveler?</p>
            <p class="text-[11px] text-slate-500 mt-0.5">Simpan jadwal liburan & gabung open trip</p>
            <button id="btn-mobile-open-login" class="mt-2.5 w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all">
              Masuk / Daftar Akun
            </button>
          </div>
        `;
      }
    }

    // Toggle Mobile Drawer Admin Button
    if (elements.mobileDrawerAdminBtn) {
      if (user && user.role === 'admin') {
        elements.mobileDrawerAdminBtn.classList.remove('hidden');
      } else {
        elements.mobileDrawerAdminBtn.classList.add('hidden');
      }
    }

    // Bind Dynamic Event Listeners inside Auth Containers
    const btnOpenLogin = document.getElementById('btn-open-login-modal');
    if (btnOpenLogin) {
      btnOpenLogin.addEventListener('click', () => openModal(elements.loginModal));
    }
    const btnMobileOpenLogin = document.getElementById('btn-mobile-open-login');
    if (btnMobileOpenLogin) {
      btnMobileOpenLogin.addEventListener('click', () => {
        if (elements.mobileMenuDrawer) elements.mobileMenuDrawer.classList.add('-translate-x-full');
        openModal(elements.loginModal);
      });
    }

    const btnDropdownLogout = document.getElementById('btn-dropdown-logout');
    if (btnDropdownLogout) {
      btnDropdownLogout.addEventListener('click', handleLogout);
    }
    const btnDrawerLogout = document.getElementById('btn-drawer-logout');
    if (btnDrawerLogout) {
      btnDrawerLogout.addEventListener('click', handleLogout);
    }
    const btnDropdownOpenCart = document.getElementById('btn-dropdown-open-cart');
    if (btnDropdownOpenCart) {
      btnDropdownOpenCart.addEventListener('click', openCartDrawer);
    }

    updateNavbarMode();
    refreshIcons();
  }

  function handleLogout() {
    state.currentUser = null;
    localStorage.removeItem('dolanesia_user');
    renderAuthUI();
    showToast('Anda telah berhasil keluar dari akun Dolanesia.', 'info');
    if (state.activePage === 'profil' || state.activePage === 'admin') {
      switchPage('beranda');
    }
  }

  // Auth Modal Tab Switcher
  function switchAuthModalTab(tabKey) {
    const tabBtnCustomer = document.getElementById('tab-btn-login-customer');
    const tabBtnRegister = document.getElementById('tab-btn-register');

    const formCustomer = document.getElementById('form-login-customer');
    const formRegister = document.getElementById('form-register-customer');

    // Reset tab active styles
    [tabBtnCustomer, tabBtnRegister].forEach(btn => {
      if (!btn) return;
      btn.classList.remove('bg-white', 'text-amber-700', 'shadow-sm');
      btn.classList.add('text-slate-600');
    });

    // Hide all forms
    if (formCustomer) formCustomer.classList.add('hidden');
    if (formRegister) formRegister.classList.add('hidden');

    if (tabKey === 'register') {
      if (tabBtnRegister) {
        tabBtnRegister.classList.add('bg-white', 'text-amber-700', 'shadow-sm');
        tabBtnRegister.classList.remove('text-slate-600');
      }
      if (formRegister) formRegister.classList.remove('hidden');
    } else {
      if (tabBtnCustomer) {
        tabBtnCustomer.classList.add('bg-white', 'text-amber-700', 'shadow-sm');
        tabBtnCustomer.classList.remove('text-slate-600');
      }
      if (formCustomer) formCustomer.classList.remove('hidden');
    }

    refreshIcons();
  }

  // Tab click listeners
  const tabBtnCustomer = document.getElementById('tab-btn-login-customer');
  if (tabBtnCustomer) tabBtnCustomer.addEventListener('click', () => switchAuthModalTab('customer'));

  const tabBtnRegister = document.getElementById('tab-btn-register');
  if (tabBtnRegister) tabBtnRegister.addEventListener('click', () => switchAuthModalTab('register'));

  const tabBtnAdmin = document.getElementById('tab-btn-login-admin');
  if (tabBtnAdmin) tabBtnAdmin.addEventListener('click', () => switchAuthModalTab('admin'));

  // Quick Demo Buttons inside Auth Modal
  const btnDemoCustomer = document.getElementById('btn-quick-demo-customer');
  if (btnDemoCustomer) {
    btnDemoCustomer.addEventListener('click', () => {
      state.currentUser = DEMO_CUSTOMER;
      localStorage.setItem('dolanesia_user', JSON.stringify(DEMO_CUSTOMER));
      closeModal(elements.loginModal);
      renderAuthUI();
      showToast(`Selamat datang kembali, ${DEMO_CUSTOMER.name}! 👋`);
    });
  }

  const btnDemoAdmin = document.getElementById('btn-quick-demo-admin');
  if (btnDemoAdmin) {
    btnDemoAdmin.addEventListener('click', () => {
      state.currentUser = DEMO_ADMIN;
      localStorage.setItem('dolanesia_user', JSON.stringify(DEMO_ADMIN));
      closeModal(elements.loginModal);
      renderAuthUI();
      showToast(`Selamat datang, Administrator ${DEMO_ADMIN.name}! 🛡️`);
      switchPage('admin');
    });
  }

  // Form Submissions: Login Form (Unified for Tourist & Administrator)
  if (elements.formLoginCustomer) {
    elements.formLoginCustomer.addEventListener('submit', (e) => {
      e.preventDefault();
      const loginId = document.getElementById('login-cust-id').value.trim();
      const loginPass = document.getElementById('login-cust-pass') ? document.getElementById('login-cust-pass').value.trim() : '';

      // Check Administrator credentials
      if (loginId.toLowerCase() === 'admin@dolanesia.id') {
        if (loginPass === 'admin123') {
          state.currentUser = DEMO_ADMIN;
          localStorage.setItem('dolanesia_user', JSON.stringify(DEMO_ADMIN));
          closeModal(elements.loginModal);
          renderAuthUI();
          showToast(`Selamat datang, Administrator ${DEMO_ADMIN.name}! 🛡️`);
          switchPage('admin');
          elements.formLoginCustomer.reset();
          return;
        } else {
          showToast('Kata sandi administrator salah!', 'warning');
          return;
        }
      }

      // Check against registered users or fallback for regular travelers
      let matchedUser = state.registeredUsers.find(u => 
        u.email.toLowerCase() === loginId.toLowerCase() || 
        u.phone.replace(/[^0-9]/g, '') === loginId.replace(/[^0-9]/g, '')
      );

      if (!matchedUser) {
        // Create user session dynamically based on input
        matchedUser = {
          id: 'user-' + Date.now(),
          name: loginId.includes('@') ? loginId.split('@')[0] : 'Solo Traveler',
          phone: loginId.includes('@') ? '0812-3456-7890' : loginId,
          email: loginId.includes('@') ? loginId : 'traveler@dolanesia.id',
          city: 'Kota Solo',
          bio: 'Penggemar jalan-jalan dan penikmat kuliner khas Solo Raya.',
          role: 'customer',
          roleLabel: 'Solo Traveler Explorer',
          joinedAt: 'November 2026',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          preference: 'Kuliner & Budaya'
        };
        state.registeredUsers.push(matchedUser);
        localStorage.setItem('dolanesia_registered_users', JSON.stringify(state.registeredUsers));
      }

      state.currentUser = matchedUser;
      localStorage.setItem('dolanesia_user', JSON.stringify(matchedUser));
      closeModal(elements.loginModal);
      renderAuthUI();
      showToast(`Selamat datang, ${matchedUser.name}!`);
      elements.formLoginCustomer.reset();
    });
  }

  // Form Submissions: Register Customer
  if (elements.formRegisterCustomer) {
    elements.formRegisterCustomer.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-cust-name').value.trim();
      const phone = document.getElementById('reg-cust-phone').value.trim();
      const city = document.getElementById('reg-cust-city').value.trim() || 'Solo Raya';
      const email = document.getElementById('reg-cust-email').value.trim();

      if (!name || !phone || !email) {
        showToast('Mohon lengkapi semua kolom pendaftaran!', 'warning');
        return;
      }

      const newUser = {
        id: 'user-' + Date.now(),
        name,
        phone,
        city,
        email,
        bio: `Solo traveler asal ${city}. Siap menjelajahi ragam budaya dan kuliner Solo Raya!`,
        role: 'customer',
        roleLabel: 'Solo Traveler Explorer',
        joinedAt: 'November 2026',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        preference: 'Kuliner & Wisata Budaya'
      };

      state.registeredUsers.push(newUser);
      localStorage.setItem('dolanesia_registered_users', JSON.stringify(state.registeredUsers));

      state.currentUser = newUser;
      localStorage.setItem('dolanesia_user', JSON.stringify(newUser));

      closeModal(elements.loginModal);
      renderAuthUI();
      elements.formRegisterCustomer.reset();
      showToast(`Pendaftaran berhasil! Selamat datang di Dolanesia, ${newUser.name}! 🎉`);
      switchPage('profil');
    });
  }

  // Form Submissions: Login Admin
  if (elements.formLoginAdmin) {
    elements.formLoginAdmin.addEventListener('submit', (e) => {
      e.preventDefault();
      const adminEmail = document.getElementById('login-admin-email').value.trim();
      const adminPass = document.getElementById('login-admin-pass').value.trim();

      if (adminEmail === 'admin@dolanesia.id' && adminPass === 'admin123') {
        state.currentUser = DEMO_ADMIN;
        localStorage.setItem('dolanesia_user', JSON.stringify(DEMO_ADMIN));
        closeModal(elements.loginModal);
        renderAuthUI();
        showToast(`Selamat datang, Administrator ${DEMO_ADMIN.name}! 🛡️`);
        switchPage('admin');
      } else {
        showToast('Kredensial Admin tidak valid! Periksa email dan kata sandi Anda.', 'warning');
      }
    });
  }

  // Profile View Logout Triggers
  const btnLogoutProfil = document.getElementById('btn-logout-profil');
  if (btnLogoutProfil) btnLogoutProfil.addEventListener('click', handleLogout);

  const btnLogoutFull = document.getElementById('btn-logout-full');
  if (btnLogoutFull) btnLogoutFull.addEventListener('click', handleLogout);

  const btnAdminLogout = document.getElementById('btn-admin-logout');
  if (btnAdminLogout) btnAdminLogout.addEventListener('click', handleLogout);

  // Close Login Modal Trigger
  if (elements.closeLoginModalBtn) {
    elements.closeLoginModalBtn.addEventListener('click', () => closeModal(elements.loginModal));
  }

  // =========================================================================
  // 6. PROFILE & SETTINGS VIEW CONTROLLER (#view-profil)
  // =========================================================================
  function renderProfileView() {
    const user = state.currentUser;
    if (!user) {
      showToast('Silakan masuk ke akun Anda terlebih dahulu.', 'info');
      openModal(elements.loginModal);
      return;
    }

    // Update Header Display
    const nameEl = document.getElementById('user-profile-name');
    const roleEl = document.getElementById('user-role-badge');
    const cityEl = document.getElementById('user-profile-city');
    const phoneEl = document.getElementById('user-profile-phone');
    const emailEl = document.getElementById('user-profile-email');
    const avatarEl = document.getElementById('user-profile-avatar');

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.roleLabel || 'Solo Traveler';
    if (cityEl) cityEl.innerHTML = `<i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-200"></i> Asal: ${user.city}`;
    if (phoneEl) phoneEl.textContent = user.phone;
    if (emailEl) emailEl.textContent = user.email;
    if (avatarEl) avatarEl.src = user.avatar;

    // Populate Edit Form Inputs
    const editName = document.getElementById('edit-user-name');
    const editPhone = document.getElementById('edit-user-phone');
    const editEmail = document.getElementById('edit-user-email');
    const editCity = document.getElementById('edit-user-city');
    const editBio = document.getElementById('edit-user-bio');

    if (editName) editName.value = user.name;
    if (editPhone) editPhone.value = user.phone;
    if (editEmail) editEmail.value = user.email;
    if (editCity) editCity.value = user.city;
    if (editBio) editBio.value = user.bio || '';

    // Render Saved Trips Tab (Cart items)
    const cartCountEl = document.getElementById('profile-cart-count');
    if (cartCountEl) cartCountEl.textContent = state.customItinerary.length;

    const savedListEl = document.getElementById('profile-saved-list');
    if (savedListEl) {
      if (state.customItinerary.length === 0) {
        savedListEl.innerHTML = `
          <div class="col-span-full py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
            <i data-lucide="compass" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
            <p class="font-bold text-slate-700 text-sm">Belum Ada Destinasi Tersimpan</p>
            <p class="text-xs text-slate-400 mt-1">Eksplorasi direktori kuliner & budaya, lalu klik "+ Itinerary".</p>
            <button data-page-target="direktori" class="mt-3 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20">
              Jelajahi Direktori
            </button>
          </div>
        `;
      } else {
        savedListEl.innerHTML = state.customItinerary.map(item => `
          <div class="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover flex-shrink-0">
            <div class="flex-grow min-w-0">
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">${item.categoryName}</span>
              <h4 class="text-xs sm:text-sm font-bold text-slate-900 truncate mt-1">${item.name}</h4>
              <p class="text-[11px] text-slate-500">${item.region} • <strong class="text-amber-700">${item.priceRange}</strong></p>
            </div>
            <button data-remove-cart="${item.id}" class="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Hapus">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `).join('');

        savedListEl.querySelectorAll('[data-remove-cart]').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-remove-cart');
            removeFromCart(id);
            renderProfileView();
          });
        });
      }
    }

    // Render Joined Open Trips Tab (Filtered strictly for current user)
    const joinedTripsListEl = document.getElementById('profile-joined-trips-list');
    if (joinedTripsListEl) {
      const userLower = user.name.toLowerCase();
      const joinedTrips = state.openTrips.filter(t => 
        t.joinedUsers.some(u => u.name && u.name.toLowerCase() === userLower) || 
        (t.host && t.host.name && t.host.name.toLowerCase() === userLower)
      );

      if (joinedTrips.length === 0) {
        joinedTripsListEl.innerHTML = `
          <div class="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
            <i data-lucide="users" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
            <p class="font-bold text-slate-700 text-sm">Belum Ada Open Trip yang Diikuti</p>
            <p class="text-xs text-slate-400 mt-1">Gabung bersama solo traveler lain di Solo Raya untuk liburan seru!</p>
            <button data-page-target="buddy" class="mt-3 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20">
              Lihat Jadwal Open Trip
            </button>
          </div>
        `;
      } else {
        joinedTripsListEl.innerHTML = joinedTrips.map(trip => `
          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Terkonfirmasi
                </span>
                <span class="text-xs text-slate-500 font-semibold">${trip.schedule}</span>
              </div>
              <h4 class="text-sm font-bold text-slate-900 mt-1">${trip.title}</h4>
              <p class="text-xs text-slate-500 mt-0.5">
                Meeting Point: <strong>${trip.meetingPoint}</strong> • Host: ${trip.host.name}
              </p>
            </div>
            <div class="flex items-center gap-2 sm:self-center">
              <a href="https://wa.me/?text=Halo%20Host%20Dolanesia!%20Saya%20${encodeURIComponent(user.name)}%20siap%20kumpul%20untuk%20trip%20'${encodeURIComponent(trip.title)}'." target="_blank" rel="noopener noreferrer" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors">
                <i data-lucide="message-circle" class="w-4 h-4"></i>
                <span>Grup WhatsApp</span>
              </a>
            </div>
          </div>
        `).join('');
      }
    }

    // Settings Preferences state sync
    if (elements.settingWaReminders) {
      elements.settingWaReminders.checked = state.notificationPrefs.waReminders !== false;
      elements.settingWaReminders.onchange = () => {
        state.notificationPrefs.waReminders = elements.settingWaReminders.checked;
        localStorage.setItem('dolanesia_notification_prefs', JSON.stringify(state.notificationPrefs));
        showToast('Preferensi notifikasi WhatsApp disimpan.');
      };
    }
    if (elements.settingBuddyNotifications) {
      elements.settingBuddyNotifications.checked = state.notificationPrefs.buddyNotifications !== false;
      elements.settingBuddyNotifications.onchange = () => {
        state.notificationPrefs.buddyNotifications = elements.settingBuddyNotifications.checked;
        localStorage.setItem('dolanesia_notification_prefs', JSON.stringify(state.notificationPrefs));
        showToast('Preferensi notifikasi Travel Buddy disimpan.');
      };
    }

    refreshIcons();
  }

  // Profile Inner Subtabs Switching
  document.querySelectorAll('.profile-subtab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-profile-tab');
      state.activeProfileTab = tabTarget;

      // Update button styles
      document.querySelectorAll('.profile-subtab-btn').forEach(b => {
        const isCurrent = b === btn;
        b.classList.toggle('border-amber-600', isCurrent);
        b.classList.toggle('text-amber-600', isCurrent);
        b.classList.toggle('border-transparent', !isCurrent);
        b.classList.toggle('text-slate-600', !isCurrent);
      });

      // Toggle tab content containers
      const tabContainers = {
        'edit-info': document.getElementById('tab-content-edit-info'),
        'saved-trips': document.getElementById('tab-content-saved-trips'),
        'joined-trips': document.getElementById('tab-content-joined-trips'),
        'settings': document.getElementById('tab-content-settings')
      };

      Object.keys(tabContainers).forEach(key => {
        if (tabContainers[key]) {
          tabContainers[key].classList.toggle('hidden', key !== tabTarget);
        }
      });

      refreshIcons();
    });
  });

  // Profile Form Update Handler
  if (elements.formUpdateProfile) {
    elements.formUpdateProfile.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!state.currentUser) return;

      const newName = document.getElementById('edit-user-name').value.trim();
      const newPhone = document.getElementById('edit-user-phone').value.trim();
      const newEmail = document.getElementById('edit-user-email').value.trim();
      const newCity = document.getElementById('edit-user-city').value.trim();
      const newBio = document.getElementById('edit-user-bio').value.trim();

      state.currentUser.name = newName;
      state.currentUser.phone = newPhone;
      state.currentUser.email = newEmail;
      state.currentUser.city = newCity;
      state.currentUser.bio = newBio;

      localStorage.setItem('dolanesia_user', JSON.stringify(state.currentUser));

      // Update registered users array
      const idx = state.registeredUsers.findIndex(u => u.id === state.currentUser.id);
      if (idx !== -1) {
        state.registeredUsers[idx] = { ...state.currentUser };
        localStorage.setItem('dolanesia_registered_users', JSON.stringify(state.registeredUsers));
      }

      renderAuthUI();
      renderProfileView();
      showToast('Profil akun dan nomor kontak berhasil diperbarui! ✨');
    });
  }

  // Password Change Handler
  if (elements.formChangePassword) {
    elements.formChangePassword.addEventListener('submit', (e) => {
      e.preventDefault();
      const p1 = elements.inputNewPassword ? elements.inputNewPassword.value : '';
      const p2 = elements.inputConfirmPassword ? elements.inputConfirmPassword.value : '';

      if (p1.length < 6) {
        showToast('Kata sandi baru minimal 6 karakter!', 'warning');
        return;
      }
      if (p1 !== p2) {
        showToast('Konfirmasi kata sandi tidak cocok. Silakan cek kembali!', 'warning');
        return;
      }

      elements.formChangePassword.reset();
      showToast('Kata sandi Anda berhasil diperbarui dan tersimpan dengan aman! 🔒');
    });
  }

  // =========================================================================
  // 7. ADMINISTRATOR DASHBOARD CONTROLLER (#view-admin)
  // =========================================================================
  let adminActiveSubTab = 'overview';

  function getCategoryBadgeColor(cat) {
    switch (cat) {
      case 'culinary': return 'bg-orange-100 text-orange-800';
      case 'culture': return 'bg-amber-100 text-amber-800';
      case 'nature': return 'bg-emerald-100 text-emerald-800';
      case 'shopping': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  function switchAdminTab(tabName) {
    adminActiveSubTab = tabName;
    const tabConfigs = [
      { id: 'overview', btn: document.getElementById('btn-admin-tab-overview'), panel: document.getElementById('admin-panel-overview') },
      { id: 'destinations', btn: document.getElementById('btn-admin-tab-destinations'), panel: document.getElementById('admin-panel-destinations') },
      { id: 'trips', btn: document.getElementById('btn-admin-tab-trips'), panel: document.getElementById('admin-panel-trips') },
      { id: 'users', btn: document.getElementById('btn-admin-tab-users'), panel: document.getElementById('admin-panel-users') }
    ];

    tabConfigs.forEach(tab => {
      if (!tab.btn || !tab.panel) return;
      if (tab.id === tabName) {
        tab.btn.className = 'admin-tab-btn px-4 py-2.5 rounded-2xl text-xs font-bold bg-amber-600 text-white shadow-md shadow-amber-600/20 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap';
        tab.panel.classList.remove('hidden');
      } else {
        tab.btn.className = 'admin-tab-btn px-4 py-2.5 rounded-2xl text-xs font-bold bg-white text-slate-600 hover:text-amber-600 border border-slate-200 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap';
        tab.panel.classList.add('hidden');
      }
    });

    renderAdminDashboard();
    refreshIcons();
  }

  // Hook up admin sub-tab buttons
  const tabBtnOverview = document.getElementById('btn-admin-tab-overview');
  const tabBtnDestinations = document.getElementById('btn-admin-tab-destinations');
  const tabBtnTrips = document.getElementById('btn-admin-tab-trips');
  const tabBtnUsers = document.getElementById('btn-admin-tab-users');

  if (tabBtnOverview) tabBtnOverview.addEventListener('click', () => switchAdminTab('overview'));
  if (tabBtnDestinations) tabBtnDestinations.addEventListener('click', () => switchAdminTab('destinations'));
  if (tabBtnTrips) tabBtnTrips.addEventListener('click', () => switchAdminTab('trips'));
  if (tabBtnUsers) tabBtnUsers.addEventListener('click', () => switchAdminTab('users'));

  // Quick Action Buttons on Overview Tab
  const btnAdminQuickAddDest = document.getElementById('btn-admin-quick-add-dest');
  const btnAdminQuickAddTrip = document.getElementById('btn-admin-quick-add-trip');
  const btnAdminQuickManageDest = document.getElementById('btn-admin-quick-manage-dest');
  const btnAdminOpenAddDest = document.getElementById('btn-admin-open-add-dest');

  if (btnAdminQuickAddDest) btnAdminQuickAddDest.addEventListener('click', openAddDestinationModal);
  if (btnAdminOpenAddDest) btnAdminOpenAddDest.addEventListener('click', openAddDestinationModal);
  if (btnAdminQuickManageDest) btnAdminQuickManageDest.addEventListener('click', () => switchAdminTab('destinations'));
  if (btnAdminQuickAddTrip) {
    btnAdminQuickAddTrip.addEventListener('click', () => {
      openModal(elements.createTripModal);
    });
  }

  // Destination Modal Open in ADD mode
  function openAddDestinationModal() {
    const modal = document.getElementById('admin-dest-modal');
    const form = document.getElementById('form-admin-dest-modal');
    if (!modal || !form) return;

    form.reset();
    document.getElementById('admin-dest-input-id').value = '';
    document.getElementById('admin-dest-modal-title').textContent = 'Tambah Destinasi Baru';
    document.getElementById('admin-dest-modal-desc').textContent = 'Lengkapi data tempat wisata atau kuliner Solo Raya';
    document.getElementById('admin-dest-input-cat').value = 'culinary';
    document.getElementById('admin-dest-input-region').value = 'Kota Surakarta';
    document.getElementById('admin-dest-input-hours').value = '08.00 - 20.00 WIB';
    document.getElementById('admin-dest-input-price').value = 'Rp 20.000 - Rp 45.000';
    document.getElementById('admin-dest-input-price-num').value = '25000';
    document.getElementById('admin-dest-input-image').value = 'assets/img/pura-mangkunegaran.jpg';
    document.getElementById('admin-dest-image-preview').src = 'assets/img/pura-mangkunegaran.jpg';
    document.getElementById('btn-submit-admin-dest-label').textContent = 'Simpan ke Direktori';

    // Reset upload UI elements
    const fileInput = document.getElementById('admin-dest-file-input');
    const uploadStatus = document.getElementById('upload-file-status');
    const badgeSource = document.getElementById('badge-photo-source');
    const altPanel = document.getElementById('admin-alt-photo-panel');
    const altUrl = document.getElementById('admin-dest-alt-url');
    const btnResetPhoto = document.getElementById('btn-reset-photo');

    if (fileInput) fileInput.value = '';
    if (uploadStatus) uploadStatus.classList.add('hidden');
    if (altPanel) altPanel.classList.add('hidden');
    if (altUrl) altUrl.value = '';
    if (btnResetPhoto) btnResetPhoto.classList.add('hidden');
    if (badgeSource) {
      badgeSource.textContent = 'Foto Standar';
      badgeSource.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs';
    }

    openModal(modal);
  }

  // Destination Modal Open in EDIT mode
  function openEditDestinationModal(destId) {
    const modal = document.getElementById('admin-dest-modal');
    const dest = state.destinations.find(d => d.id === destId);
    if (!modal || !dest) return;

    document.getElementById('admin-dest-input-id').value = dest.id;
    document.getElementById('admin-dest-input-name').value = dest.name || '';
    document.getElementById('admin-dest-input-cat').value = dest.category || 'culinary';
    document.getElementById('admin-dest-input-region').value = dest.region || 'Kota Surakarta';
    document.getElementById('admin-dest-input-hours').value = dest.openingHours || '08.00 - 20.00 WIB';
    document.getElementById('admin-dest-input-price').value = dest.priceRange || '';
    document.getElementById('admin-dest-input-price-num').value = dest.priceNumeric !== undefined ? dest.priceNumeric : 25000;
    document.getElementById('admin-dest-input-menu').value = dest.favoriteMenu || '';
    document.getElementById('admin-dest-input-image').value = dest.image || 'assets/img/pura-mangkunegaran.jpg';
    document.getElementById('admin-dest-image-preview').src = dest.image || 'assets/img/pura-mangkunegaran.jpg';
    document.getElementById('admin-dest-input-desc').value = dest.description || '';
    document.getElementById('admin-dest-input-tip').value = dest.localTip || '';
    document.getElementById('admin-dest-input-tags').value = Array.isArray(dest.tags) ? dest.tags.join(', ') : (dest.tags || '');
    document.getElementById('admin-dest-input-maps').value = dest.locationUrl || '';

    document.getElementById('admin-dest-modal-title').textContent = `Edit Destinasi: ${dest.name}`;
    document.getElementById('admin-dest-modal-desc').textContent = `Perbarui rincian tempat wisata atau kuliner di ${dest.region}`;
    document.getElementById('btn-submit-admin-dest-label').textContent = 'Simpan Perubahan';

    // Reset upload UI elements for Edit
    const fileInput = document.getElementById('admin-dest-file-input');
    const uploadStatus = document.getElementById('upload-file-status');
    const badgeSource = document.getElementById('badge-photo-source');
    const altPanel = document.getElementById('admin-alt-photo-panel');
    const altUrl = document.getElementById('admin-dest-alt-url');
    const btnResetPhoto = document.getElementById('btn-reset-photo');

    if (fileInput) fileInput.value = '';
    if (uploadStatus) uploadStatus.classList.add('hidden');
    if (altPanel) altPanel.classList.add('hidden');
    if (altUrl) altUrl.value = dest.image && !dest.image.startsWith('data:') ? dest.image : '';
    if (btnResetPhoto) btnResetPhoto.classList.remove('hidden');

    if (badgeSource) {
      if (dest.image && dest.image.startsWith('data:')) {
        badgeSource.textContent = 'Foto Berkas Tersimpan';
        badgeSource.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-700 text-white shadow-xs';
      } else {
        badgeSource.textContent = 'Foto Terpasang';
        badgeSource.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs';
      }
    }

    openModal(modal);
  }

  // Close Destination Modal handler
  const btnCloseDestModal = document.getElementById('btn-close-admin-dest-modal');
  const btnCancelDestModal = document.getElementById('btn-cancel-admin-dest-modal');
  const adminDestModal = document.getElementById('admin-dest-modal');

  if (btnCloseDestModal && adminDestModal) {
    btnCloseDestModal.addEventListener('click', () => closeModal(adminDestModal));
  }
  if (btnCancelDestModal && adminDestModal) {
    btnCancelDestModal.addEventListener('click', () => closeModal(adminDestModal));
  }
  if (adminDestModal) {
    adminDestModal.addEventListener('click', (e) => {
      if (e.target === adminDestModal) closeModal(adminDestModal);
    });
  }

  // =========================================================================
  // IMAGE UPLOAD & COMPRESSION HANDLER (HTML5 FileReader + Canvas Compressor)
  // =========================================================================
  const adminDestFileInput = document.getElementById('admin-dest-file-input');
  const adminDestDropzone = document.getElementById('admin-dest-dropzone');
  const btnTriggerUpload = document.getElementById('btn-trigger-upload');
  const adminDestImgHidden = document.getElementById('admin-dest-input-image');
  const adminDestImgPreview = document.getElementById('admin-dest-image-preview');
  const uploadStatus = document.getElementById('upload-file-status');
  const uploadFileName = document.getElementById('upload-file-name');
  const badgePhotoSource = document.getElementById('badge-photo-source');
  const btnToggleAltPhoto = document.getElementById('btn-toggle-alt-photo');
  const adminAltPhotoPanel = document.getElementById('admin-alt-photo-panel');
  const adminDestAltUrl = document.getElementById('admin-dest-alt-url');
  const btnResetPhoto = document.getElementById('btn-reset-photo');

  function processUploadedFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar yang valid (JPG, PNG, atau WEBP).', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // High quality web compression via Canvas: max dimension 1200px, 0.82 quality
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        // Update hidden input and preview thumbnail
        if (adminDestImgHidden) adminDestImgHidden.value = compressedDataUrl;
        if (adminDestImgPreview) adminDestImgPreview.src = compressedDataUrl;
        if (adminDestAltUrl) adminDestAltUrl.value = '';

        // Display file uploaded badge and info
        if (uploadStatus && uploadFileName) {
          const approxKb = Math.round((compressedDataUrl.length * 3 / 4) / 1024);
          uploadFileName.textContent = `${file.name} (${approxKb} KB dioptimasi)`;
          uploadStatus.classList.remove('hidden');
        }

        if (badgePhotoSource) {
          badgePhotoSource.textContent = 'Foto Diunggah (File)';
          badgePhotoSource.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-600 text-white shadow-xs';
        }

        if (btnResetPhoto) btnResetPhoto.classList.remove('hidden');
        refreshIcons();
        showToast(`Foto "${file.name}" berhasil diunggah & dioptimasi! 📷`);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Trigger file dialog from dropzone or button
  if (adminDestDropzone && adminDestFileInput) {
    adminDestDropzone.addEventListener('click', () => adminDestFileInput.click());

    // Drag and drop event listeners
    ['dragenter', 'dragover'].forEach(eventName => {
      adminDestDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        adminDestDropzone.classList.add('border-amber-600', 'bg-amber-100/70');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      adminDestDropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        adminDestDropzone.classList.remove('border-amber-600', 'bg-amber-100/70');
      });
    });

    adminDestDropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        processUploadedFile(dt.files[0]);
      }
    });
  }

  if (btnTriggerUpload && adminDestFileInput) {
    btnTriggerUpload.addEventListener('click', (e) => {
      e.stopPropagation();
      adminDestFileInput.click();
    });
  }

  if (adminDestFileInput) {
    adminDestFileInput.addEventListener('change', () => {
      if (adminDestFileInput.files && adminDestFileInput.files[0]) {
        processUploadedFile(adminDestFileInput.files[0]);
      }
    });
  }

  // Toggle Alt URL / Presets Panel
  if (btnToggleAltPhoto && adminAltPhotoPanel) {
    btnToggleAltPhoto.addEventListener('click', () => {
      adminAltPhotoPanel.classList.toggle('hidden');
      refreshIcons();
    });
  }

  // Input listener for external URL
  if (adminDestAltUrl && adminDestImgHidden && adminDestImgPreview) {
    adminDestAltUrl.addEventListener('input', () => {
      const url = adminDestAltUrl.value.trim();
      if (url) {
        adminDestImgHidden.value = url;
        adminDestImgPreview.src = url;
        if (badgePhotoSource) {
          badgePhotoSource.textContent = 'Tautan Web';
          badgePhotoSource.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-600 text-white shadow-xs';
        }
        if (uploadStatus) uploadStatus.classList.add('hidden');
        if (btnResetPhoto) btnResetPhoto.classList.remove('hidden');
      }
    });
  }

  // Preset buttons click handler
  document.querySelectorAll('.preset-img-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const imgPath = btn.getAttribute('data-preset-img');
      if (imgPath && adminDestImgHidden && adminDestImgPreview) {
        adminDestImgHidden.value = imgPath;
        adminDestImgPreview.src = imgPath;
        if (adminDestAltUrl) adminDestAltUrl.value = imgPath;
        if (badgePhotoSource) {
          badgePhotoSource.textContent = 'Preset Solo';
          badgePhotoSource.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-600 text-white shadow-xs';
        }
        if (uploadStatus) uploadStatus.classList.add('hidden');
        if (btnResetPhoto) btnResetPhoto.classList.remove('hidden');
        showToast('Preset foto diterapkan.');
      }
    });
  });

  // Reset photo to default
  if (btnResetPhoto) {
    btnResetPhoto.addEventListener('click', () => {
      if (adminDestImgHidden) adminDestImgHidden.value = 'assets/img/pura-mangkunegaran.jpg';
      if (adminDestImgPreview) adminDestImgPreview.src = 'assets/img/pura-mangkunegaran.jpg';
      if (adminDestFileInput) adminDestFileInput.value = '';
      if (adminDestAltUrl) adminDestAltUrl.value = '';
      if (uploadStatus) uploadStatus.classList.add('hidden');
      if (btnResetPhoto) btnResetPhoto.classList.add('hidden');
      if (badgePhotoSource) {
        badgePhotoSource.textContent = 'Foto Bawaan';
        badgePhotoSource.className = 'absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 text-white backdrop-blur-xs';
      }
      showToast('Foto direset ke bawaan.');
    });
  }

  // Form Submit Handler for Add / Edit
  const formAdminDestModal = document.getElementById('form-admin-dest-modal');
  if (formAdminDestModal) {
    formAdminDestModal.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = document.getElementById('admin-dest-input-id').value.trim();
      const name = document.getElementById('admin-dest-input-name').value.trim();
      const cat = document.getElementById('admin-dest-input-cat').value;
      const region = document.getElementById('admin-dest-input-region').value.trim() || 'Kota Surakarta';
      const hours = document.getElementById('admin-dest-input-hours').value.trim() || '08.00 - 20.00 WIB';
      const price = document.getElementById('admin-dest-input-price').value.trim() || 'Rp 20.000 - Rp 50.000';
      const priceNum = parseInt(document.getElementById('admin-dest-input-price-num').value, 10) || 25000;
      const menu = document.getElementById('admin-dest-input-menu').value.trim() || 'Kuliner Khas Pilihan';
      const image = document.getElementById('admin-dest-input-image').value.trim() || 'assets/img/pura-mangkunegaran.jpg';
      const desc = document.getElementById('admin-dest-input-desc').value.trim() || `${name} adalah rekomendasi destinasi unggulan di ${region} terkurasi oleh Tim Dolanesia.`;
      const tip = document.getElementById('admin-dest-input-tip').value.trim() || 'Disarankan datang sebelum jam sibuk untuk mendapatkan suasana paling autentik.';
      const rawTags = document.getElementById('admin-dest-input-tags').value.trim();
      const tags = rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : ['Solo Raya', cat];
      const maps = document.getElementById('admin-dest-input-maps').value.trim() || `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + region)}`;

      const categoryLabels = {
        culinary: 'Kuliner Otentik',
        culture: 'Sejarah & Budaya',
        nature: 'Alam & Rekreasi',
        shopping: 'Belanja & Modern'
      };

      if (id) {
        // EDIT MODE: Update existing destination
        const existing = state.destinations.find(d => d.id === id);
        if (existing) {
          existing.name = name;
          existing.category = cat;
          existing.categoryName = categoryLabels[cat] || 'Destinasi Solo Raya';
          existing.region = region;
          existing.openingHours = hours;
          existing.priceRange = price;
          existing.priceNumeric = priceNum;
          existing.favoriteMenu = menu;
          existing.image = image;
          existing.description = desc;
          existing.localTip = tip;
          existing.tags = tags;
          existing.locationUrl = maps;
          showToast(`Destinasi "${name}" berhasil diperbarui! ✅`);
        }
      } else {
        // ADD MODE: Insert new destination at beginning
        const newDest = {
          id: 'dest-custom-' + Date.now(),
          name,
          category: cat,
          categoryName: categoryLabels[cat] || 'Destinasi Solo Raya',
          region,
          rating: 4.8,
          reviewCount: 95,
          priceNumeric: priceNum,
          priceRange: price,
          openingHours: hours,
          favoriteMenu: menu,
          durationMinutes: cat === 'culinary' ? 60 : 90,
          tags,
          image,
          locationUrl: maps,
          description: desc,
          localTip: tip
        };
        state.destinations.unshift(newDest);
        showToast(`Destinasi baru "${name}" berhasil ditambahkan ke direktori! ✨`);
      }

      // Save master all destinations
      localStorage.setItem('dolanesia_all_destinations', JSON.stringify(state.destinations));
      planner.setDestinations(state.destinations);

      // Close modal & re-render
      if (adminDestModal) closeModal(adminDestModal);
      renderAdminDashboard();
      renderDirectory();
      renderHomeSpotlight();
    });
  }

  // Delete Destination function
  function deleteDestination(destId) {
    const dest = state.destinations.find(d => d.id === destId);
    if (!dest) return;

    if (confirm(`Apakah Anda yakin ingin menghapus "${dest.name}" dari katalog direktori Solo Raya?\n\nDestinasi ini akan terhapus dari direktori, auto-planner, dan keranjang liburan.`)) {
      state.destinations = state.destinations.filter(d => d.id !== destId);
      localStorage.setItem('dolanesia_all_destinations', JSON.stringify(state.destinations));
      planner.setDestinations(state.destinations);

      // Clean up from itinerary cart if present
      if (state.customItinerary && state.customItinerary.includes(destId)) {
        state.customItinerary = state.customItinerary.filter(id => id !== destId);
        localStorage.setItem('dolanesia_custom_itinerary', JSON.stringify(state.customItinerary));
        updateCartUI();
      }

      renderAdminDashboard();
      renderDirectory();
      renderHomeSpotlight();
      showToast(`Destinasi "${dest.name}" berhasil dihapus.`);
    }
  }

  // Reset Catalog to Default
  const btnAdminResetCatalog = document.getElementById('btn-admin-reset-catalog');
  if (btnAdminResetCatalog) {
    btnAdminResetCatalog.addEventListener('click', () => {
      if (confirm('Kembalikan seluruh katalog ke 16 destinasi kurasi bawaan Dolanesia?\n\nSemua perubahan, pengeditan, atau tempat baru yang pernah Anda tambahkan akan direset ke data asli Solo Raya.')) {
        state.destinations = getPristineDestinations();
        localStorage.setItem('dolanesia_all_destinations', JSON.stringify(state.destinations));
        planner.setDestinations(state.destinations);
        renderAdminDashboard();
        renderDirectory();
        renderHomeSpotlight();
        showToast('Katalog destinasi berhasil direset ke 16 spot bawaan Solo Raya! 🔄');
      }
    });
  }

  // Filter & Search Listeners for Destinations Table
  const adminDestSearch = document.getElementById('admin-dest-search');
  const adminDestFilterCat = document.getElementById('admin-dest-filter-cat');
  const adminDestFilterRegion = document.getElementById('admin-dest-filter-region');

  if (adminDestSearch) adminDestSearch.addEventListener('input', () => renderAdminDestinationsTable());
  if (adminDestFilterCat) adminDestFilterCat.addEventListener('change', () => renderAdminDestinationsTable());
  if (adminDestFilterRegion) adminDestFilterRegion.addEventListener('change', () => renderAdminDestinationsTable());

  function renderAdminDestinationsTable() {
    const tableBody = document.getElementById('admin-all-destinations-table');
    const emptyState = document.getElementById('admin-dest-empty-state');
    if (!tableBody) return;

    const query = (adminDestSearch ? adminDestSearch.value : '').trim().toLowerCase();
    const catFilter = adminDestFilterCat ? adminDestFilterCat.value : 'all';
    const regFilter = adminDestFilterRegion ? adminDestFilterRegion.value : 'all';

    const filtered = state.destinations.filter(dest => {
      if (catFilter !== 'all' && dest.category !== catFilter) return false;
      if (regFilter !== 'all' && !dest.region.toLowerCase().includes(regFilter.toLowerCase())) return false;
      if (query) {
        const matchName = dest.name.toLowerCase().includes(query);
        const matchRegion = dest.region.toLowerCase().includes(query);
        const matchMenu = (dest.favoriteMenu || '').toLowerCase().includes(query);
        const matchDesc = (dest.description || '').toLowerCase().includes(query);
        const matchTags = Array.isArray(dest.tags) && dest.tags.some(t => t.toLowerCase().includes(query));
        if (!matchName && !matchRegion && !matchMenu && !matchDesc && !matchTags) return false;
      }
      return true;
    });

    if (filtered.length === 0) {
      tableBody.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      tableBody.innerHTML = filtered.map(dest => `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <img src="${dest.image}" onerror="this.src='assets/img/pura-mangkunegaran.jpg'" alt="${dest.name}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0 shadow-xs">
              <div>
                <div class="font-bold text-slate-900 text-xs">${dest.name}</div>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="text-[10px] text-amber-700 font-bold">★ ${dest.rating || 4.8}</span>
                  <span class="text-[10px] text-slate-300">•</span>
                  <span class="text-[10px] text-slate-500">${dest.tags ? dest.tags.slice(0, 2).join(', ') : ''}</span>
                </div>
              </div>
            </div>
          </td>
          <td class="py-3 px-3 whitespace-nowrap">
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${getCategoryBadgeColor(dest.category)}">
              ${dest.categoryName}
            </span>
          </td>
          <td class="py-3 px-3 text-slate-600 text-xs">
            <div class="truncate max-w-[140px]" title="${dest.region}">${dest.region}</div>
          </td>
          <td class="py-3 px-3 text-xs">
            <div class="font-bold text-amber-800">${dest.priceRange}</div>
            <div class="text-[10px] text-slate-400 mt-0.5">${dest.openingHours || '08.00 - 20.00 WIB'}</div>
          </td>
          <td class="py-3 px-3 text-xs text-slate-600">
            <div class="truncate max-w-[170px]" title="${dest.favoriteMenu}">${dest.favoriteMenu || '-'}</div>
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
            <button data-admin-edit-dest="${dest.id}" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>Edit</span>
            </button>
            <button data-admin-delete-dest="${dest.id}" class="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors inline-flex items-center gap-1 cursor-pointer shadow-xs">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              <span>Hapus</span>
            </button>
          </td>
        </tr>
      `).join('');

      tableBody.querySelectorAll('[data-admin-edit-dest]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-admin-edit-dest');
          openEditDestinationModal(id);
        });
      });

      tableBody.querySelectorAll('[data-admin-delete-dest]').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-admin-delete-dest');
          deleteDestination(id);
        });
      });
    }

    refreshIcons();
  }

  function renderAdminDashboard() {
    if (!state.currentUser || state.currentUser.role !== 'admin') return;

    // Stat metric counters
    if (elements.adminCountTrips) elements.adminCountTrips.textContent = `${state.openTrips.length} Trip`;
    if (elements.adminCountDestinations) elements.adminCountDestinations.textContent = `${state.destinations.length} Spot`;
    if (elements.adminCountUsers) elements.adminCountUsers.textContent = state.registeredUsers.length + 1250;

    // Sub-tab count badges
    const badgeDest = document.getElementById('badge-tab-dest-count');
    const badgeTrips = document.getElementById('badge-tab-trips-count');
    const badgeUsers = document.getElementById('badge-tab-users-count');
    if (badgeDest) badgeDest.textContent = state.destinations.length;
    if (badgeTrips) badgeTrips.textContent = state.openTrips.length;
    if (badgeUsers) badgeUsers.textContent = state.registeredUsers.length;

    // Render Sub-tab 1: Category & Region Distribution in Overview
    const catContainer = document.getElementById('admin-category-distribution');
    if (catContainer) {
      const total = Math.max(1, state.destinations.length);
      const catConfig = [
        { key: 'culinary', label: 'Kuliner Otentik Solo', barColor: 'bg-orange-500' },
        { key: 'culture', label: 'Sejarah & Budaya Keraton', barColor: 'bg-amber-600' },
        { key: 'nature', label: 'Alam & Rekreasi Pegunungan', barColor: 'bg-emerald-600' },
        { key: 'shopping', label: 'Belanja & Pasar Tradisional', barColor: 'bg-blue-600' }
      ];

      catContainer.innerHTML = catConfig.map(c => {
        const count = state.destinations.filter(d => d.category === c.key).length;
        const percent = Math.round((count / total) * 100);
        return `
          <div class="space-y-1.5">
            <div class="flex justify-between items-center text-xs">
              <span class="font-bold text-slate-700">${c.label}</span>
              <span class="text-slate-500 font-semibold">${count} Spot (${percent}%)</span>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div class="${c.barColor} h-2.5 rounded-full transition-all duration-500" style="width: ${percent}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    const regContainer = document.getElementById('admin-region-distribution');
    if (regContainer) {
      const regions = [
        { name: 'Kota Surakarta', match: 'surakarta' },
        { name: 'Karanganyar', match: 'karanganyar' },
        { name: 'Boyolali', match: 'boyolali' },
        { name: 'Sukoharjo', match: 'sukoharjo' },
        { name: 'Klaten', match: 'klaten' }
      ];

      regContainer.innerHTML = regions.map(r => {
        const count = state.destinations.filter(d => d.region.toLowerCase().includes(r.match)).length;
        return `
          <span class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5">
            <span>📍 ${r.name}</span>
            <span class="px-1.5 py-0.5 rounded-md bg-white font-bold text-amber-700 text-[10px] shadow-xs">${count}</span>
          </span>
        `;
      }).join('');
    }

    // Render Activity Logs
    const logContainer = document.getElementById('admin-activity-logs');
    if (logContainer) {
      const logs = [
        { title: 'Katalog Destinasi Solo Raya Terhubung', desc: `${state.destinations.length} spot aktif terkurasi siap dikunjungi wisatawan.`, icon: 'map-pin', color: 'text-amber-600 bg-amber-50' },
        { title: 'Komunitas Travel Buddy Berjalan', desc: `${state.openTrips.length} ajakan trip komunitas terverifikasi aktif.`, icon: 'users', color: 'text-emerald-600 bg-emerald-50' },
        { title: 'Sistem PWA Cache v5 Berjalan', desc: 'Aset offline, logo, dan rute tersimpan stabil di perangkat.', icon: 'check-circle', color: 'text-blue-600 bg-blue-50' },
        { title: 'Hak Akses Administrator Aktif', desc: `Sesi ${state.currentUser.name} (${state.currentUser.email}) terverifikasi aman.`, icon: 'shield', color: 'text-purple-600 bg-purple-50' }
      ];

      logContainer.innerHTML = logs.map(l => `
        <div class="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="w-8 h-8 rounded-xl ${l.color} flex items-center justify-center flex-shrink-0 mt-0.5">
            <i data-lucide="${l.icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="font-bold text-slate-800 text-xs">${l.title}</div>
            <div class="text-[11px] text-slate-500 mt-0.5 leading-relaxed">${l.desc}</div>
          </div>
        </div>
      `).join('');
    }

    // Render Sub-tab 2: Destinations Table
    renderAdminDestinationsTable();

    // Render Sub-tab 3: Open Trips Table
    const tripsTableBody = document.getElementById('admin-open-trips-table');
    if (tripsTableBody) {
      tripsTableBody.innerHTML = state.openTrips.map(trip => {
        const isFull = trip.quotaJoined >= trip.quotaMax;
        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4 font-semibold text-slate-800">
              <div class="font-bold text-slate-900 text-xs line-clamp-1">${trip.title}</div>
              <div class="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <i data-lucide="map-pin" class="w-3 h-3 text-amber-600"></i> ${trip.meetingPoint} • ${trip.schedule}
              </div>
            </td>
            <td class="py-3 px-3">
              <div class="flex items-center gap-1.5 font-medium text-slate-700 text-xs">
                <img src="${trip.host.avatar}" class="w-6 h-6 rounded-full object-cover">
                <span class="truncate max-w-[90px]">${trip.host.name}</span>
              </div>
            </td>
            <td class="py-3 px-3 font-semibold">
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isFull ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}">
                ${trip.quotaJoined} / ${trip.quotaMax} Buddy
              </span>
            </td>
            <td class="py-3 px-3 text-amber-800 font-bold text-xs">${trip.costSplit}</td>
            <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
              <button data-admin-toggle-trip="${trip.id}" class="px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${isFull ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'} transition-colors cursor-pointer shadow-xs">
                ${isFull ? 'Buka Slot' : 'Tutup Kuota'}
              </button>
              <button data-admin-delete-trip="${trip.id}" class="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer shadow-xs">
                Hapus
              </button>
            </td>
          </tr>
        `;
      }).join('');

      tripsTableBody.querySelectorAll('[data-admin-toggle-trip]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tripId = btn.getAttribute('data-admin-toggle-trip');
          const targetTrip = state.openTrips.find(t => t.id === tripId);
          if (targetTrip) {
            if (targetTrip.quotaJoined >= targetTrip.quotaMax) {
              targetTrip.quotaJoined = Math.max(1, targetTrip.quotaMax - 2);
              showToast(`Kuota trip "${targetTrip.title}" dibuka kembali.`);
            } else {
              targetTrip.quotaJoined = targetTrip.quotaMax;
              showToast(`Trip "${targetTrip.title}" ditandai Kuota Penuh.`, 'info');
            }
            localStorage.setItem('dolanesia_open_trips', JSON.stringify(state.openTrips));
            renderAdminDashboard();
            renderOpenTrips();
          }
        });
      });

      tripsTableBody.querySelectorAll('[data-admin-delete-trip]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tripId = btn.getAttribute('data-admin-delete-trip');
          if (confirm('Apakah Anda yakin ingin menghapus open trip ini?')) {
            state.openTrips = state.openTrips.filter(t => t.id !== tripId);
            localStorage.setItem('dolanesia_open_trips', JSON.stringify(state.openTrips));
            renderAdminDashboard();
            renderOpenTrips();
            showToast('Trip berhasil dihapus oleh Administrator.');
          }
        });
      });
    }

    // Render Sub-tab 4: Users Management Table
    const usersTableBody = document.getElementById('admin-users-table');
    if (usersTableBody) {
      usersTableBody.innerHTML = state.registeredUsers.map(u => {
        const isAdmin = u.role === 'admin';
        return `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-3 px-4">
              <div class="flex items-center gap-2.5">
                <img src="${u.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200">
                <div>
                  <div class="font-bold text-slate-900 text-xs">${u.name}</div>
                  <div class="text-[10px] text-slate-400">Bergabung ${u.joinedAt || '2026'}</div>
                </div>
              </div>
            </td>
            <td class="py-3 px-3 text-xs text-slate-600">
              <div>${u.email}</div>
              <div class="text-[10px] text-slate-400 mt-0.5">${u.phone || '-'}</div>
            </td>
            <td class="py-3 px-3 text-xs text-slate-600">${u.city || 'Solo Raya'}</td>
            <td class="py-3 px-3 text-xs text-slate-600">
              <span class="truncate max-w-[130px] block" title="${u.preference}">${u.preference || '-'}</span>
            </td>
            <td class="py-3 px-3">
              <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}">
                ${isAdmin ? 'Administrator' : 'Wisatawan'}
              </span>
            </td>
            <td class="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
              <button data-admin-toggle-role="${u.id}" class="px-2.5 py-1.5 rounded-xl text-[10px] font-bold ${isAdmin ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'} transition-colors cursor-pointer shadow-xs">
                ${isAdmin ? 'Jadikan Wisatawan' : 'Jadikan Admin'}
              </button>
              <button data-admin-delete-user="${u.id}" class="px-2.5 py-1.5 rounded-xl text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer shadow-xs">
                Hapus
              </button>
            </td>
          </tr>
        `;
      }).join('');

      usersTableBody.querySelectorAll('[data-admin-toggle-role]').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.getAttribute('data-admin-toggle-role');
          const targetUser = state.registeredUsers.find(u => u.id === userId);
          if (!targetUser) return;

          if (targetUser.role === 'admin') {
            targetUser.role = 'customer';
            targetUser.roleLabel = 'Solo Traveler Explorer';
            showToast(`Role ${targetUser.name} diubah menjadi Wisatawan.`);
          } else {
            targetUser.role = 'admin';
            targetUser.roleLabel = 'Administrator';
            showToast(`Role ${targetUser.name} diubah menjadi Administrator! 🛡️`);
          }

          localStorage.setItem('dolanesia_registered_users', JSON.stringify(state.registeredUsers));
          if (state.currentUser && state.currentUser.id === targetUser.id) {
            state.currentUser = targetUser;
            localStorage.setItem('dolanesia_user', JSON.stringify(targetUser));
            renderAuthUI();
          }
          renderAdminDashboard();
        });
      });

      usersTableBody.querySelectorAll('[data-admin-delete-user]').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.getAttribute('data-admin-delete-user');
          const targetUser = state.registeredUsers.find(u => u.id === userId);
          if (!targetUser) return;

          if (state.currentUser && state.currentUser.id === targetUser.id) {
            showToast('Anda tidak dapat menghapus akun yang sedang Anda gunakan!', 'warning');
            return;
          }

          if (confirm(`Apakah Anda yakin ingin menghapus akun pengguna "${targetUser.name}"?`)) {
            state.registeredUsers = state.registeredUsers.filter(u => u.id !== userId);
            localStorage.setItem('dolanesia_registered_users', JSON.stringify(state.registeredUsers));
            renderAdminDashboard();
            showToast(`Pengguna "${targetUser.name}" berhasil dihapus.`);
          }
        });
      });
    }

    refreshIcons();
  }

  // =========================================================================
  // 8. HOME SPOTLIGHT SECTION CONTROLLER
  // =========================================================================
  function renderHomeSpotlight() {
    if (!elements.homeSpotlightGrid) return;

    // Pick 4 standout highlights with exact matching IDs
    const highlightIds = ['pura-mangkunegaran', 'serabi-notosuman', 'selat-solo-mbak-lies', 'solo-safari'];
    let highlights = state.destinations.filter(d => highlightIds.includes(d.id));
    if (highlights.length < 4) {
      highlights = state.destinations.slice(0, 4);
    }

    elements.homeSpotlightGrid.innerHTML = highlights.map(item => {
      const isCulinary = item.category === 'culinary';
      return `
        <div class="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-slate-100 hover:-translate-y-1">
          <div class="relative h-44 overflow-hidden">
            <img src="${item.image}" alt="${item.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"></div>
            
            <span class="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[11px] font-semibold backdrop-blur-md ${isCulinary ? 'bg-orange-100 text-orange-800' : 'bg-amber-100 text-amber-800'}">
              ${item.categoryName}
            </span>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
              <span class="flex items-center gap-1 font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                <i data-lucide="star" class="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"></i> ${item.rating}
              </span>
              <span class="text-[11px] font-semibold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                ${item.region.split('(')[0].trim()}
              </span>
            </div>
          </div>

          <div class="p-4 flex flex-col flex-grow">
            <h3 class="text-sm font-bold text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">
              ${item.name}
            </h3>
            
            <p class="text-xs text-slate-500 mt-1 line-clamp-1">
              ${item.favoriteMenu}
            </p>

            <div class="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span class="font-bold text-amber-700">${item.priceRange}</span>
              <button data-detail-id="${item.id}" class="btn-spotlight-detail text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1">
                Detail <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    elements.homeSpotlightGrid.querySelectorAll('.btn-spotlight-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-detail-id');
        openDestinationDetail(id);
      });
    });

    refreshIcons();
  }

  // =========================================================================
  // 9. CUSTOM ITINERARY DRAWER (CART)
  // =========================================================================
  function updateCartUI() {
    const count = state.customItinerary.length;
    if (elements.cartBadge) elements.cartBadge.textContent = count;

    const profileCartCount = document.getElementById('profile-cart-count');
    if (profileCartCount) profileCartCount.textContent = count;

    if (!elements.cartItemsList) return;

    if (count === 0) {
      elements.cartItemsList.innerHTML = `
        <div class="text-center py-12 px-4 text-slate-400">
          <i data-lucide="compass" class="w-12 h-12 mx-auto mb-3 stroke-[1.5] text-slate-300"></i>
          <p class="font-medium text-slate-600">Keranjang Liburan Masih Kosong</p>
          <p class="text-xs text-slate-400 mt-1">Eksplorasi destinasi & kuliner di direktori lalu klik "+ Itinerary".</p>
        </div>
      `;
      if (elements.cartTotalCost) elements.cartTotalCost.textContent = 'Rp 0';
      refreshIcons();
      return;
    }

    let totalEstimate = 0;
    elements.cartItemsList.innerHTML = state.customItinerary.map(item => {
      totalEstimate += item.priceNumeric || 0;
      return `
        <div class="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-amber-200 transition-all">
          <img src="${item.image}" alt="${item.name}" class="w-14 h-14 rounded-lg object-cover flex-shrink-0">
          <div class="flex-grow min-w-0">
            <h4 class="text-sm font-semibold text-slate-800 truncate">${item.name}</h4>
            <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <i data-lucide="map-pin" class="w-3 h-3 text-amber-600"></i>
              <span class="truncate">${item.region}</span>
            </p>
            <p class="text-xs font-medium text-amber-700 mt-1">${item.priceRange}</p>
          </div>
          <button data-remove-id="${item.id}" class="btn-remove-cart p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus dari daftar">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      `;
    }).join('');

    if (elements.cartTotalCost) {
      elements.cartTotalCost.textContent = `Rp ${totalEstimate.toLocaleString('id-ID')}`;
    }

    elements.cartItemsList.querySelectorAll('.btn-remove-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const idToRemove = btn.getAttribute('data-remove-id');
        removeFromCart(idToRemove);
      });
    });

    refreshIcons();
  }

  function addToCart(destination) {
    const exists = state.customItinerary.some(item => item.id === destination.id);
    if (exists) {
      showToast(`"${destination.name}" sudah ada di keranjang liburan Anda!`, 'info');
      return;
    }
    state.customItinerary.push(destination);
    localStorage.setItem('dolanesia_custom_itinerary', JSON.stringify(state.customItinerary));
    updateCartUI();
    showToast(`Berhasil menambahkan "${destination.name}" ke rencana liburan!`);
  }

  function removeFromCart(destinationId) {
    state.customItinerary = state.customItinerary.filter(item => item.id !== destinationId);
    localStorage.setItem('dolanesia_custom_itinerary', JSON.stringify(state.customItinerary));
    updateCartUI();
    showToast('Destinasi dihapus dari keranjang liburan', 'info');
  }

  function clearCart() {
    if (state.customItinerary.length === 0) return;
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang liburan Anda?')) {
      state.customItinerary = [];
      localStorage.setItem('dolanesia_custom_itinerary', JSON.stringify(state.customItinerary));
      updateCartUI();
      showToast('Keranjang liburan telah dikosongkan.');
    }
  }

  // =========================================================================
  // 10. DIREKTORI WISATA & KULINER (CATALOG VIEW)
  // =========================================================================
  function renderDirectory() {
    if (!elements.directoryGrid) return;

    // Filter
    let filtered = state.destinations.filter(item => {
      const matchCategory = state.activeFilterCategory === 'all' || item.category === state.activeFilterCategory;
      const matchRegion = state.activeFilterRegion === 'all' || item.region.toLowerCase().includes(state.activeFilterRegion.toLowerCase());
      const query = state.searchQuery.toLowerCase();
      const matchSearch = !query || 
        item.name.toLowerCase().includes(query) || 
        item.region.toLowerCase().includes(query) || 
        (item.favoriteMenu && item.favoriteMenu.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.tags && item.tags.some(t => t.toLowerCase().includes(query)));

      return matchCategory && matchRegion && matchSearch;
    });

    // Sort
    const sortMode = state.activeSort || 'popular';
    filtered.sort((a, b) => {
      if (sortMode === 'rating') {
        return b.rating - a.rating;
      } else if (sortMode === 'price-low') {
        return (a.priceNumeric || 0) - (b.priceNumeric || 0);
      } else if (sortMode === 'price-high') {
        return (b.priceNumeric || 0) - (a.priceNumeric || 0);
      } else if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // 'popular'
        return ((b.reviewCount || 100) * (b.rating || 4.5)) - ((a.reviewCount || 100) * (a.rating || 4.5));
      }
    });

    if (elements.directoryCountBadge) {
      elements.directoryCountBadge.textContent = `${filtered.length} Destinasi & Kuliner`;
    }

    if (filtered.length === 0) {
      elements.directoryGrid.innerHTML = `
        <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8">
          <i data-lucide="search-x" class="w-12 h-12 mx-auto text-slate-300 mb-3"></i>
          <h3 class="text-base font-semibold text-slate-700">Tidak ada destinasi yang cocok</h3>
          <p class="text-sm text-slate-400 mt-1 max-w-sm mx-auto">Coba ganti kata kunci pencarian atau ubah filter kategori/wilayah Solo Raya.</p>
          <button id="btn-reset-filter" class="mt-4 px-4 py-2 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl hover:bg-amber-100 transition-colors">
            Reset Semua Filter
          </button>
        </div>
      `;
      const resetBtn = document.getElementById('btn-reset-filter');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          state.activeFilterCategory = 'all';
          state.activeFilterRegion = 'all';
          state.activeSort = 'popular';
          state.searchQuery = '';
          if (elements.directorySearchInput) elements.directorySearchInput.value = '';
          if (elements.regionFilter) elements.regionFilter.value = 'all';
          if (elements.directorySortSelect) elements.directorySortSelect.value = 'popular';
          elements.categoryFilters.forEach(btn => {
            btn.classList.toggle('bg-amber-600', btn.dataset.category === 'all');
            btn.classList.toggle('text-white', btn.dataset.category === 'all');
            btn.classList.toggle('bg-slate-100', btn.dataset.category !== 'all');
            btn.classList.toggle('text-slate-600', btn.dataset.category !== 'all');
          });
          renderDirectory();
        });
      }
      refreshIcons();
      return;
    }

    elements.directoryGrid.innerHTML = filtered.map(item => {
      const isCulinary = item.category === 'culinary';
      const categoryBadgeBg = isCulinary ? 'bg-orange-100 text-orange-700' : 
        (item.category === 'culture' ? 'bg-amber-100 text-amber-800' : 
        (item.category === 'nature' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'));

      return `
        <div class="glass-card rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-slate-100 hover:-translate-y-1">
          <!-- Thumbnail & Badges -->
          <div class="relative h-48 overflow-hidden">
            <img src="${item.image}" alt="${item.name}" loading="lazy" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-70"></div>
            
            <span class="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${categoryBadgeBg}">
              ${item.categoryName}
            </span>

            <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
              <span class="flex items-center gap-1 font-semibold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md">
                <i data-lucide="star" class="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"></i>
                ${item.rating} <span class="text-white/70 font-normal">(${item.reviewCount})</span>
              </span>
              <span class="bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1">
                <i data-lucide="clock" class="w-3 h-3 text-amber-300"></i>
                ${item.openingHours.split('(')[0].trim()}
              </span>
            </div>
          </div>

          <!-- Content Body -->
          <div class="p-4 flex flex-col flex-grow">
            <h3 class="text-base font-bold text-slate-800 line-clamp-1 group-hover:text-amber-600 transition-colors">
              ${item.name}
            </h3>
            
            <p class="text-xs text-slate-500 flex items-center gap-1 mt-1">
              <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-600 flex-shrink-0"></i>
              <span class="truncate">${item.region}</span>
            </p>

            <!-- Highlight Menu or Feature -->
            <div class="mt-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-100/80 text-xs">
              <div class="font-semibold text-amber-800 flex items-center gap-1 mb-0.5">
                <i data-lucide="${isCulinary ? 'utensils' : 'sparkles'}" class="w-3.5 h-3.5 text-amber-600"></i>
                <span>${isCulinary ? 'Menu Legendaris:' : 'Highlight Utama:'}</span>
              </div>
              <p class="text-slate-700 line-clamp-1">${item.favoriteMenu}</p>
            </div>

            <!-- Price & Duration -->
            <div class="mt-3 flex items-center justify-between text-xs">
              <span class="font-bold text-slate-900">${item.priceRange}</span>
              <span class="text-[11px] text-slate-400 flex items-center gap-1">
                <i data-lucide="compass" class="w-3 h-3"></i> ~${item.durationMinutes} menit
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button data-detail-id="${item.id}" class="btn-open-detail py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
                <i data-lucide="info" class="w-3.5 h-3.5 text-slate-500"></i> Detail
              </button>
              <button data-add-cart-id="${item.id}" class="btn-add-to-cart py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm shadow-amber-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95">
                <i data-lucide="plus" class="w-3.5 h-3.5"></i> + Itinerary
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    elements.directoryGrid.querySelectorAll('.btn-open-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-detail-id');
        openDestinationDetail(id);
      });
    });

    elements.directoryGrid.querySelectorAll('.btn-add-to-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-add-cart-id');
        const dest = state.destinations.find(d => d.id === id);
        if (dest) addToCart(dest);
      });
    });

    refreshIcons();
  }

  // Destination Detail Modal
  function openDestinationDetail(destinationId) {
    const item = state.destinations.find(d => d.id === destinationId);
    if (!item || !elements.detailModal) return;

    const modalBody = document.getElementById('detail-modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
      <div class="relative h-64 md:h-72 overflow-hidden rounded-t-3xl">
        <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover">
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div class="absolute bottom-4 left-4 right-4 text-white">
          <span class="inline-block px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-600 mb-2">
            ${item.categoryName}
          </span>
          <h2 class="text-xl md:text-2xl font-bold font-serif-jawa">${item.name}</h2>
          <p class="text-xs text-white/80 flex items-center gap-1 mt-1">
            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-amber-300"></i> ${item.region}
          </p>
        </div>
      </div>

      <div class="p-6 space-y-5">
        <!-- Quick stats bar -->
        <div class="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs">
          <div>
            <p class="text-slate-400">Rating Google</p>
            <p class="font-bold text-slate-800 flex items-center justify-center gap-1 mt-0.5">
              <i data-lucide="star" class="w-3.5 h-3.5 text-yellow-500 fill-yellow-500"></i> ${item.rating}
            </p>
          </div>
          <div>
            <p class="text-slate-400">Biaya / Harga</p>
            <p class="font-bold text-amber-700 mt-0.5 truncate">${item.priceRange}</p>
          </div>
          <div>
            <p class="text-slate-400">Jam Operasional</p>
            <p class="font-bold text-slate-800 mt-0.5 truncate">${item.openingHours.split('(')[0].trim()}</p>
          </div>
        </div>

        <!-- Description -->
        <div>
          <h4 class="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
            <i data-lucide="book-open" class="w-4 h-4 text-amber-600"></i> Tentang Tempat Ini
          </h4>
          <p class="text-xs sm:text-sm text-slate-600 leading-relaxed">${item.description}</p>
        </div>

        <!-- Favorite Menu / Attraction -->
        <div class="p-4 bg-orange-50/60 rounded-2xl border border-orange-100">
          <h4 class="text-xs font-bold text-orange-900 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <i data-lucide="award" class="w-4 h-4 text-orange-600"></i> Highlight / Menu Paling Dicari
          </h4>
          <p class="text-sm font-semibold text-slate-800">${item.favoriteMenu}</p>
        </div>

        <!-- Local Tip "Wong Solo" -->
        <div class="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
              💡
            </div>
            <div>
              <h5 class="text-xs font-bold text-emerald-950 uppercase tracking-wide">Tips Rahasia Wong Solo</h5>
              <p class="text-xs text-emerald-800 mt-1 leading-relaxed">${item.localTip}</p>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${(item.tags || []).map(tag => `<span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">#${tag}</span>`).join('')}
        </div>

        <!-- Modal Footer Actions -->
        <div class="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <a href="${item.locationUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5">
            <i data-lucide="external-link" class="w-4 h-4 text-amber-600"></i> Buka Google Maps
          </a>
          <button id="btn-modal-add-cart" class="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 transition-all">
            <i data-lucide="plus" class="w-4 h-4"></i> Masukkan ke Itinerary
          </button>
        </div>
      </div>
    `;

    const addCartBtn = document.getElementById('btn-modal-add-cart');
    if (addCartBtn) {
      addCartBtn.addEventListener('click', () => {
        addToCart(item);
        closeModal(elements.detailModal);
      });
    }

    openModal(elements.detailModal);
  }

  // =========================================================================
  // 11. SOLO-TO-SOCIAL TRAVEL BUDDY (OPEN TRIPS)
  // =========================================================================
  function renderOpenTrips() {
    if (!elements.openTripsGrid) return;

    elements.openTripsGrid.innerHTML = state.openTrips.map(trip => {
      const remainingSlots = trip.quotaMax - trip.quotaJoined;
      const isFull = remainingSlots <= 0;
      const percentFilled = Math.min(100, Math.round((trip.quotaJoined / trip.quotaMax) * 100));

      return `
        <div class="glass-card rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
          <div>
            <!-- Trip Header & Badge -->
            <div class="flex items-start justify-between gap-2 mb-3">
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 pulse-green"></span>
                ${trip.schedule}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[11px] font-bold ${isFull ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}">
                ${isFull ? 'Kuota Penuh' : `Sisa ${remainingSlots} Slot`}
              </span>
            </div>

            <h3 class="text-base font-bold text-slate-800 group-hover:text-amber-600 transition-colors">
              ${trip.title}
            </h3>

            <p class="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
              <i data-lucide="navigation" class="w-3.5 h-3.5 text-amber-600 flex-shrink-0"></i>
              <span>Meeting: <strong>${trip.meetingPoint}</strong></span>
            </p>

            <p class="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
              ${trip.description}
            </p>

            <!-- Quota Progress Bar -->
            <div class="mt-4">
              <div class="flex justify-between text-xs text-slate-500 mb-1">
                <span>Partisipasi Buddy:</span>
                <span class="font-semibold text-slate-700">${trip.quotaJoined} / ${trip.quotaMax} Traveler</span>
              </div>
              <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full" style="width: ${percentFilled}%"></div>
              </div>
            </div>

            <!-- Avatar Stack -->
            <div class="mt-3 flex items-center justify-between pt-2">
              <div class="flex -space-x-2 overflow-hidden">
                ${(trip.joinedUsers || []).slice(0, 4).map(u => `
                  <img class="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover" src="${u.avatar}" alt="${u.name}" title="${u.name} (${u.city})">
                `).join('')}
                ${(trip.joinedUsers || []).length > 4 ? `
                  <span class="inline-flex items-center justify-center h-7 w-7 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 font-bold text-[10px]">
                    +${trip.joinedUsers.length - 4}
                  </span>
                ` : ''}
              </div>
              <div class="text-right">
                <span class="text-[11px] text-slate-400 block">Patungan / Orang</span>
                <span class="text-sm font-bold text-amber-700">${trip.costSplit}</span>
              </div>
            </div>

            <!-- Host info -->
            <div class="mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5">
              <img src="${trip.host.avatar}" alt="${trip.host.name}" class="w-9 h-9 rounded-full object-cover">
              <div class="min-w-0 flex-grow">
                <div class="flex items-center gap-1">
                  <span class="text-xs font-bold text-slate-800 truncate">${trip.host.name}</span>
                  <i data-lucide="badge-check" class="w-3.5 h-3.5 text-blue-500 flex-shrink-0" title="Host Terverifikasi"></i>
                </div>
                <p class="text-[10px] text-slate-500">${trip.host.badge} (${trip.host.tripsLed || 1} trip)</p>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <button data-trip-id="${trip.id}" class="btn-join-open-trip mt-5 w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isFull ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-98'}" ${isFull ? 'disabled' : ''}>
            <i data-lucide="users" class="w-4 h-4"></i>
            <span>${isFull ? 'Slot Penuh' : 'Gabung Grup Travel Buddy'}</span>
          </button>
        </div>
      `;
    }).join('');

    elements.openTripsGrid.querySelectorAll('.btn-join-open-trip').forEach(btn => {
      btn.addEventListener('click', () => {
        const tripId = btn.getAttribute('data-trip-id');
        openJoinTripModal(tripId);
      });
    });

    refreshIcons();
  }

  function openJoinTripModal(tripId) {
    const trip = state.openTrips.find(t => t.id === tripId);
    if (!trip || !elements.joinTripModal) return;

    const contentBox = document.getElementById('join-trip-modal-content');
    if (!contentBox) return;

    const defaultName = state.currentUser ? state.currentUser.name : '';
    const defaultPhone = state.currentUser ? state.currentUser.phone : '';
    const defaultCity = state.currentUser ? state.currentUser.city : '';

    contentBox.innerHTML = `
      <div class="p-6 space-y-4">
        <div>
          <span class="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            Konfirmasi Bergabung Solo-to-Social
          </span>
          <h3 class="text-lg font-bold text-slate-900 mt-2">${trip.title}</h3>
          <p class="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <i data-lucide="clock" class="w-3.5 h-3.5 text-amber-600"></i> ${trip.schedule}
          </p>
        </div>

        <div class="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-100 text-xs text-slate-700 space-y-1.5">
          <p><strong>Host:</strong> ${trip.host.name} (${trip.host.badge})</p>
          <p><strong>Titik Kumpul:</strong> ${trip.meetingPoint}</p>
          <p><strong>Estimasi Biaya Patungan:</strong> <span class="text-amber-800 font-bold">${trip.costSplit}</span></p>
          <p><strong>Termasuk:</strong> ${(trip.included || []).join(', ')}</p>
        </div>

        <!-- Form pendaftaran -->
        <form id="form-confirm-join" class="space-y-3 pt-2">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Nama Panggilan Kamu</label>
            <input type="text" id="join-name" required value="${defaultName}" placeholder="Contoh: Farhan / Nadia" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none">
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Aktif</label>
            <input type="tel" id="join-phone" required value="${defaultPhone}" placeholder="08xxxxxxxxxx" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none">
            <span class="text-[10px] text-slate-400 mt-0.5 block">Hanya digunakan oleh Host untuk mengundang ke WhatsApp Group koordinasi kumpul.</span>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">Asal Kota</label>
            <input type="text" id="join-city" value="${defaultCity}" placeholder="Contoh: Jakarta / Surabaya / Solo" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none">
          </div>

          <div class="pt-2">
            <button type="submit" class="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all">
              <i data-lucide="message-circle" class="w-4 h-4"></i>
              <span>Gabung Sekarang & Masuk WhatsApp Komunitas</span>
            </button>
          </div>
        </form>
      </div>
    `;

    refreshIcons();

    const form = document.getElementById('form-confirm-join');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const userName = document.getElementById('join-name').value.trim();
        const userCity = document.getElementById('join-city').value.trim() || 'Traveler';

        // Update state
        trip.quotaJoined = Math.min(trip.quotaMax, trip.quotaJoined + 1);
        trip.joinedUsers.push({
          name: userName,
          city: userCity,
          avatar: state.currentUser ? state.currentUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
        });
        localStorage.setItem('dolanesia_open_trips', JSON.stringify(state.openTrips));
        renderOpenTrips();
        renderAdminDashboard();

        // Show Success screen in modal with direct WhatsApp link
        contentBox.innerHTML = `
          <div class="p-8 text-center space-y-4">
            <div class="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto shadow-sm p-1.5 animate-bounce">
              <img src="assets/img/logo-icon.png" alt="Mascot Dola" class="w-full h-full object-contain">
            </div>
            <h3 class="text-xl font-bold text-slate-900 font-serif-jawa">Selamat Bergabung, ${userName}!</h3>
            <p class="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Kamu resmi terdaftar di <strong>${trip.title}</strong> bersama teman-teman solo traveler lainnya.
            </p>

            <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-left text-xs space-y-2">
              <p class="font-bold text-emerald-900 flex items-center gap-1.5">
                <i data-lucide="bell" class="w-4 h-4 text-emerald-600"></i> Panduan Langkah Selanjutnya:
              </p>
              <ul class="list-disc list-inside space-y-1 text-emerald-800">
                <li>Klik tombol hijau di bawah untuk terhubung langsung ke grup WhatsApp Travel Buddy Dolanesia.</li>
                <li>Host <strong>${trip.host.name}</strong> akan menyapa dan membagikan detail pin lokasi kumpul.</li>
                <li>Bawa kamera atau smartphone terbaikmu untuk mengabadikan momen seru!</li>
              </ul>
            </div>

            <div class="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a href="https://wa.me/?text=Halo%20Host%20Dolanesia!%20Saya%20${encodeURIComponent(userName)}%20sudah%20bergabung%20di%20open%20trip%20'${encodeURIComponent(trip.title)}'." target="_blank" rel="noopener noreferrer" class="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30">
                <i data-lucide="message-circle" class="w-4 h-4"></i>
                Buka WhatsApp & Sapa Host
              </a>
              <button id="btn-done-join" class="py-3 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors">
                Tutup
              </button>
            </div>
          </div>
        `;
        refreshIcons();
        document.getElementById('btn-done-join').addEventListener('click', () => {
          closeModal(elements.joinTripModal);
          showToast(`Selamat berlibur di Solo bersama teman baru! 🎉`);
          if (state.activePage === 'profil') renderProfileView();
        });
      });
    }

    openModal(elements.joinTripModal);
  }

  // Create Open Trip Modal Button & Form
  if (elements.btnCreateTrip) {
    elements.btnCreateTrip.addEventListener('click', () => {
      openModal(elements.createTripModal);
    });
  }

  const formCreateTrip = document.getElementById('form-create-new-trip');
  if (formCreateTrip) {
    formCreateTrip.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('new-trip-title').value.trim();
      const schedule = document.getElementById('new-trip-schedule').value.trim();
      const meeting = document.getElementById('new-trip-meeting').value.trim();
      const quota = parseInt(document.getElementById('new-trip-quota').value, 10) || 5;
      const cost = document.getElementById('new-trip-cost').value.trim() || 'Gratis / Patungan Makan';
      const hostName = document.getElementById('new-trip-host-name').value.trim() || (state.currentUser ? state.currentUser.name : 'Solo Traveler');
      const desc = document.getElementById('new-trip-desc').value.trim() || 'Mari jelajah Solo Raya santai bersama!';

      const newTrip = {
        id: 'trip-user-' + Date.now(),
        title,
        schedule,
        dateLabel: 'Trip Baru Dibuat',
        meetingPoint: meeting,
        quotaMax: quota,
        quotaJoined: 1,
        host: {
          name: hostName,
          avatar: state.currentUser ? state.currentUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
          badge: 'Traveler Community',
          tripsLed: 1,
          rating: 5.0
        },
        costSplit: cost,
        costNumeric: 0,
        included: ['Teman Ngobrol Seru', 'Foto Bareng', 'Jelajah Santai'],
        description: desc,
        joinedUsers: [
          { name: hostName, city: 'Solo Raya', avatar: state.currentUser ? state.currentUser.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' }
        ],
        waGroupLink: 'https://chat.whatsapp.com/sample'
      };

      state.openTrips.unshift(newTrip);
      localStorage.setItem('dolanesia_open_trips', JSON.stringify(state.openTrips));
      renderOpenTrips();
      renderAdminDashboard();
      closeModal(elements.createTripModal);
      formCreateTrip.reset();
      showToast('Trip ajakan berhasil dipublikasikan! Semoga lekas bertemu teman baru!');
    });
  }

  // =========================================================================
  // 12. AUTO-PLANNER EXECUTION & TIMELINE RENDERING
  // =========================================================================
  function handleGeneratePlan(e, customOptions = null) {
    if (e && e.preventDefault) e.preventDefault();

    const isFromCart = customOptions && customOptions.fromCart;
    const cartItems = isFromCart ? (customOptions.cartItems || state.customItinerary) : [];

    const duration = elements.durationSelect ? elements.durationSelect.value : '1';
    const interest = elements.interestSelect ? elements.interestSelect.value : 'all';
    const budgetTier = elements.budgetSelect ? elements.budgetSelect.value : 'standard';
    const transport = elements.transportSelect ? elements.transportSelect.value : 'motor';

    // Show simulated AI loading
    if (elements.plannerLoading) elements.plannerLoading.classList.remove('hidden');
    if (elements.plannerResults) elements.plannerResults.classList.add('hidden');

    const loadingPhrases = isFromCart ? [
      'Menghubungkan destinasi pilihan keranjang Anda...',
      'Mengecek urutan rute terdekat dan jam buka...',
      'Mengalkulasi efisiensi rute tanpa bolak-balik...',
      'Menyusun jadwal per jam sesuai pilihan Anda...'
    ] : [
      'Menghubungkan destinasi terbaik Solo Raya...',
      'Mengecek jadwal buka warung legendaris & istana keraton...',
      'Menyusun efisiensi rute perjalanan bebas macet...',
      'Mengalkulasi estimasi budget kuliner & tiket masuk...'
    ];
    let phraseIdx = 0;
    const loadingText = document.getElementById('planner-loading-text');

    const interval = setInterval(() => {
      phraseIdx = (phraseIdx + 1) % loadingPhrases.length;
      if (loadingText) loadingText.textContent = loadingPhrases[phraseIdx];
    }, 350);

    setTimeout(() => {
      clearInterval(interval);
      if (elements.plannerLoading) elements.plannerLoading.classList.add('hidden');
      if (elements.plannerResults) elements.plannerResults.classList.remove('hidden');

      state.isCartPlan = isFromCart;
      state.currentGeneratedPlan = planner.generateItinerary({
        duration,
        interest,
        budgetTier,
        transport,
        fromCart: isFromCart,
        cartItems
      });
      state.activeDayTab = 1;

      renderGeneratedPlanUI();
      showToast(isFromCart ? 'Itinerary khusus dari keranjang Anda berhasil dirancang!' : 'Itinerary Solo Raya Anda berhasil dirancang!');

      elements.plannerResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 900);
  }

  function renderGeneratedPlanUI() {
    if (!state.currentGeneratedPlan) return;
    const plan = state.currentGeneratedPlan;

    // Toggle Cart Plan Banner
    if (elements.cartPlanBanner) {
      if (state.isCartPlan) {
        elements.cartPlanBanner.classList.remove('hidden');
      } else {
        elements.cartPlanBanner.classList.add('hidden');
      }
    }

    // Render Day Tabs
    if (elements.dayTabsContainer) {
      elements.dayTabsContainer.innerHTML = plan.days.map(d => {
        const isActive = d.dayNumber === state.activeDayTab;
        return `
          <button data-day="${d.dayNumber}" class="btn-day-tab px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${isActive ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
            <span>Hari ke-${d.dayNumber}</span>
          </button>
        `;
      }).join('');

      elements.dayTabsContainer.querySelectorAll('.btn-day-tab').forEach(btn => {
        btn.addEventListener('click', () => {
          state.activeDayTab = parseInt(btn.getAttribute('data-day'), 10);
          renderGeneratedPlanUI();
        });
      });
    }

    // Render active day timeline
    const activeDay = plan.days.find(d => d.dayNumber === state.activeDayTab) || plan.days[0];
    if (elements.itineraryTimeline && activeDay) {
      elements.itineraryTimeline.innerHTML = `
        <div class="mb-4 p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-amber-200">Rute Hari ke-${activeDay.dayNumber}</span>
            <h3 class="text-base font-bold font-serif-jawa">${activeDay.themeTitle}</h3>
          </div>
          <div class="text-left sm:text-right">
            <span class="text-xs text-amber-200 block">Estimasi Biaya Hari Ini:</span>
            <span class="text-sm font-bold">Rp ${activeDay.dayTotalCost.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div class="space-y-4">
          ${activeDay.slots.map((slot, sIdx) => {
            const cat = slot.item.category;
            const iconName = cat === 'culinary' ? 'utensils' : (cat === 'nature' ? 'trees' : (cat === 'shopping' ? 'shopping-bag' : 'landmark'));
            return `
              <div class="timeline-stem flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-amber-200 transition-all shadow-sm group">
                <!-- Time & Icon Node -->
                <div class="flex flex-col items-center flex-shrink-0 z-10">
                  <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs shadow-inner">
                    <i data-lucide="${iconName}" class="w-4 h-4"></i>
                  </div>
                  <span class="text-[11px] font-bold text-amber-900 mt-1 whitespace-nowrap">${slot.time.split('-')[0].trim()}</span>
                </div>

                <!-- Slot Details -->
                <div class="flex-grow min-w-0">
                  <div class="flex flex-wrap items-center justify-between gap-1">
                    <span class="text-[11px] font-bold uppercase tracking-wider text-amber-600">${slot.title}</span>
                    <div class="flex items-center gap-1.5">
                      <span class="text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Est. Rp ${slot.estimatedCost.toLocaleString('id-ID')}
                      </span>
                      <button data-delete-slot-day="${activeDay.dayNumber}" data-delete-slot-idx="${sIdx}" class="btn-delete-slot text-slate-300 hover:text-red-500 p-1 rounded-lg transition-colors" title="Hapus spot ini dari rute">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                      </button>
                    </div>
                  </div>

                  <h4 class="text-sm md:text-base font-bold text-slate-900 mt-1">${slot.item.name}</h4>
                  <p class="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <i data-lucide="map-pin" class="w-3 h-3 text-amber-600 flex-shrink-0"></i> ${slot.item.region}
                  </p>

                  <!-- Curated Note -->
                  <div class="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 flex items-start gap-2">
                    <i data-lucide="lightbulb" class="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5"></i>
                    <span>${slot.note}</span>
                  </div>

                  <!-- Action links -->
                  <div class="mt-3 flex flex-wrap items-center gap-2">
                    <a href="${slot.item.locationUrl}" target="_blank" rel="noopener noreferrer" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
                      <i data-lucide="navigation-2" class="w-3 h-3 text-amber-600"></i> Rute Peta
                    </a>
                    <button data-detail-id="${slot.item.id}" class="btn-open-detail px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1">
                      <i data-lucide="info" class="w-3 h-3 text-slate-500"></i> Info Lengkap
                    </button>
                    <button data-swap-slot-day="${activeDay.dayNumber}" data-swap-slot-idx="${sIdx}" class="btn-swap-slot px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium transition-colors flex items-center gap-1">
                      <i data-lucide="refresh-cw" class="w-3 h-3"></i> Ganti Spot
                    </button>
                    <button data-add-cart-id="${slot.item.id}" class="btn-add-to-cart px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-medium transition-colors flex items-center gap-1 ml-auto">
                      <i data-lucide="bookmark" class="w-3 h-3"></i> Simpan
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Add Slot Button for Active Day -->
        <div class="pt-4">
          <button id="btn-open-quick-add-modal" type="button" class="w-full py-3 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-100/60 text-amber-800 font-bold text-xs flex items-center justify-center gap-2 transition-all">
            <i data-lucide="plus-circle" class="w-4 h-4 text-amber-600"></i>
            <span>+ Sisipkan Destinasi Lain ke Rute Hari ke-${activeDay.dayNumber}</span>
          </button>
        </div>
      `;

      // Bind slot actions
      elements.itineraryTimeline.querySelectorAll('.btn-open-detail').forEach(btn => {
        btn.addEventListener('click', () => openDestinationDetail(btn.getAttribute('data-detail-id')));
      });

      elements.itineraryTimeline.querySelectorAll('.btn-add-to-cart').forEach(btn => {
        btn.addEventListener('click', () => {
          const item = state.destinations.find(d => d.id === btn.getAttribute('data-add-cart-id'));
          if (item) addToCart(item);
        });
      });

      // Delete Slot
      elements.itineraryTimeline.querySelectorAll('.btn-delete-slot').forEach(btn => {
        btn.addEventListener('click', () => {
          const dayNum = parseInt(btn.getAttribute('data-delete-slot-day'), 10);
          const slotIdx = parseInt(btn.getAttribute('data-delete-slot-idx'), 10);
          const targetDay = plan.days.find(d => d.dayNumber === dayNum);
          if (targetDay && targetDay.slots[slotIdx]) {
            const removed = targetDay.slots.splice(slotIdx, 1)[0];
            targetDay.dayTotalCost -= removed.estimatedCost;
            plan.totalBudget -= removed.estimatedCost;
            renderGeneratedPlanUI();
            showToast(`"${removed.item.name}" dihapus dari rute.`, 'info');
          }
        });
      });

      // Swap Slot with an alternative
      elements.itineraryTimeline.querySelectorAll('.btn-swap-slot').forEach(btn => {
        btn.addEventListener('click', () => {
          const dayNum = parseInt(btn.getAttribute('data-swap-slot-day'), 10);
          const slotIdx = parseInt(btn.getAttribute('data-swap-slot-idx'), 10);
          const targetDay = plan.days.find(d => d.dayNumber === dayNum);
          if (targetDay && targetDay.slots[slotIdx]) {
            const currentSlot = targetDay.slots[slotIdx];
            const currentCat = currentSlot.item.category;
            // Find another destination in same category not yet in this day
            const existingIdsInDay = new Set(targetDay.slots.map(s => s.item.id));
            const candidate = state.destinations.find(d => d.category === currentCat && !existingIdsInDay.has(d.id)) ||
                              state.destinations.find(d => !existingIdsInDay.has(d.id));

            if (candidate) {
              const oldCost = currentSlot.estimatedCost;
              const multiplier = plan.budgetTier === 'budget' ? 0.8 : (plan.budgetTier === 'comfort' ? 1.4 : 1.0);
              const newCost = Math.round(((candidate.priceNumeric || 20000) * multiplier) / 5000) * 5000;
              currentSlot.item = candidate;
              currentSlot.estimatedCost = newCost;
              currentSlot.note = candidate.localTip || 'Rekomendasi alternatif yang menarik dikunjungi.';
              targetDay.dayTotalCost = targetDay.dayTotalCost - oldCost + newCost;
              plan.totalBudget = plan.days.reduce((s, d) => s + d.dayTotalCost, 0);
              renderGeneratedPlanUI();
              showToast(`Spot diganti menjadi "${candidate.name}"!`);
            } else {
              showToast('Tidak ada spot alternatif lain yang tersedia.', 'info');
            }
          }
        });
      });

      // Quick Add Slot Modal trigger
      const quickAddBtn = document.getElementById('btn-open-quick-add-modal');
      if (quickAddBtn) {
        quickAddBtn.addEventListener('click', () => {
          openQuickAddModal(activeDay.dayNumber);
        });
      }
    }

    // Render Stats & Summary
    if (elements.planSummaryStats) {
      elements.planSummaryStats.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
            <span class="text-xs text-slate-400 block">Total Estimasi Seluruh Trip:</span>
            <span class="text-xl font-bold text-amber-700">Rp ${plan.totalBudget.toLocaleString('id-ID')}</span>
            <span class="text-[11px] text-slate-500 block mt-1">(Termasuk tiket masuk & perkiraan kuliner)</span>
          </div>

          <div class="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
            <span class="text-xs text-slate-400 block">Rekomendasi Moda Transportasi:</span>
            <span class="text-sm font-bold text-slate-800">${plan.transportAdvice.mode}</span>
            <span class="text-[11px] text-emerald-600 font-medium block mt-1">${plan.transportAdvice.costNote}</span>
          </div>

          <div class="p-4 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-900 shadow-sm flex items-start gap-2.5">
            <i data-lucide="info" class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"></i>
            <div>
              <span class="font-bold block">Tips Mobilitas Wong Solo:</span>
              <p class="text-amber-800 mt-0.5 leading-relaxed">${plan.transportAdvice.tip}</p>
            </div>
          </div>
        </div>
      `;
    }

    // Prepare complete Printable Layout in background
    generatePrintableItinerary();

    refreshIcons();
  }

  // Quick Add Slot Modal Handler
  function openQuickAddModal(dayNumber) {
    if (!elements.addToDayModal || !elements.quickAddDestList) return;

    function renderList(query = '') {
      const q = query.toLowerCase();
      const filtered = state.destinations.filter(d => 
        !q || d.name.toLowerCase().includes(q) || d.region.toLowerCase().includes(q) || d.categoryName.toLowerCase().includes(q)
      );

      elements.quickAddDestList.innerHTML = filtered.map(dest => `
        <div class="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 transition-colors gap-3">
          <img src="${dest.image}" alt="${dest.name}" class="w-12 h-12 rounded-lg object-cover flex-shrink-0">
          <div class="min-w-0 flex-grow">
            <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">${dest.categoryName}</span>
            <h5 class="text-xs font-bold text-slate-800 truncate mt-0.5">${dest.name}</h5>
            <p class="text-[10px] text-slate-500 truncate">${dest.region} • ${dest.priceRange}</p>
          </div>
          <button data-pick-dest-id="${dest.id}" class="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex-shrink-0 transition-colors">
            + Sisipkan
          </button>
        </div>
      `).join('');

      elements.quickAddDestList.querySelectorAll('[data-pick-dest-id]').forEach(btn => {
        btn.addEventListener('click', () => {
          const destId = btn.getAttribute('data-pick-dest-id');
          const picked = state.destinations.find(d => d.id === destId);
          if (picked && state.currentGeneratedPlan) {
            const targetDay = state.currentGeneratedPlan.days.find(d => d.dayNumber === dayNumber);
            if (targetDay) {
              const multiplier = state.currentGeneratedPlan.budgetTier === 'budget' ? 0.8 : (state.currentGeneratedPlan.budgetTier === 'comfort' ? 1.4 : 1.0);
              const cost = Math.round(((picked.priceNumeric || 20000) * multiplier) / 5000) * 5000;
              targetDay.slots.push({
                time: 'Sore / Fleksibel',
                title: 'Destinasi Tambahan Pilihan Anda',
                item: picked,
                note: picked.localTip || 'Spot tambahan yang disisipkan ke jadwal hari ini.',
                estimatedCost: cost
              });
              targetDay.dayTotalCost += cost;
              state.currentGeneratedPlan.totalBudget += cost;
              renderGeneratedPlanUI();
              closeModal(elements.addToDayModal);
              showToast(`"${picked.name}" berhasil disisipkan ke Hari ke-${dayNumber}!`);
            }
          }
        });
      });
    }

    renderList('');
    if (elements.quickAddSearch) {
      elements.quickAddSearch.value = '';
      elements.quickAddSearch.oninput = (e) => renderList(e.target.value);
    }

    openModal(elements.addToDayModal);
  }

  // Generate complete Printable Layout (ALL days, formatted for print/PDF)
  function generatePrintableItinerary() {
    if (!elements.printableItinerary || !state.currentGeneratedPlan) return;
    const plan = state.currentGeneratedPlan;
    const user = state.currentUser;

    const dateStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    elements.printableItinerary.innerHTML = `
      <!-- Brand & Header -->
      <div class="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold font-serif-jawa tracking-tight text-slate-900">DOLANESIA • Rencana Liburan Solo Raya</h1>
          <p class="text-xs text-slate-600 mt-0.5">Platform Perencana Liburan Pintar • The Spirit of Java</p>
        </div>
        <div class="text-right text-xs">
          <p class="font-bold text-slate-800">Disusun untuk: ${user ? user.name : 'Solo Traveler'}</p>
          <p class="text-slate-500">Tanggal Cetak: ${dateStr}</p>
        </div>
      </div>

      <!-- Trip Meta Box -->
      <div class="grid grid-cols-4 gap-3 bg-slate-100 p-4 rounded-xl text-xs mb-6">
        <div>
          <span class="text-slate-500 block">Durasi Liburan:</span>
          <span class="font-bold text-slate-900 text-sm">${plan.days.length} Hari</span>
        </div>
        <div>
          <span class="text-slate-500 block">Total Estimasi Biaya:</span>
          <span class="font-bold text-amber-700 text-sm">Rp ${plan.totalBudget.toLocaleString('id-ID')}</span>
        </div>
        <div>
          <span class="text-slate-500 block">Budget Tier:</span>
          <span class="font-bold text-slate-900 capitalize">${plan.budgetTier}</span>
        </div>
        <div>
          <span class="text-slate-500 block">Moda Transportasi:</span>
          <span class="font-bold text-slate-900">${plan.transportAdvice.mode.split('(')[0]}</span>
        </div>
      </div>

      <!-- Days Timelines -->
      <div class="space-y-6">
        ${plan.days.map(day => `
          <div class="border border-slate-200 rounded-xl p-4 page-break-avoid">
            <div class="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
              <h3 class="font-bold text-sm text-slate-900">
                Hari ke-${day.dayNumber}: ${day.themeTitle}
              </h3>
              <span class="font-bold text-xs text-amber-700">
                Est. Hari: Rp ${day.dayTotalCost.toLocaleString('id-ID')}
              </span>
            </div>

            <table class="w-full text-left text-xs">
              <thead>
                <tr class="text-slate-400 uppercase text-[10px] border-b border-slate-100">
                  <th class="py-1.5 w-24">Waktu</th>
                  <th class="py-1.5 w-48">Destinasi / Spot</th>
                  <th class="py-1.5">Wilayah & Kategori</th>
                  <th class="py-1.5 w-24 text-right">Est. Biaya</th>
                  <th class="py-1.5 pl-4">Catatan & Tips Wong Solo</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${day.slots.map(slot => `
                  <tr>
                    <td class="py-2 font-bold text-slate-800 whitespace-nowrap">${slot.time}</td>
                    <td class="py-2 font-bold text-slate-900">${slot.item.name}</td>
                    <td class="py-2 text-slate-600">${slot.item.region.split('(')[0]} • ${slot.item.categoryName}</td>
                    <td class="py-2 text-right font-semibold text-amber-700 whitespace-nowrap">Rp ${slot.estimatedCost.toLocaleString('id-ID')}</td>
                    <td class="py-2 pl-4 text-slate-500 italic">${slot.note}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>

      <!-- Mobility Advice -->
      <div class="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 page-break-avoid">
        <h4 class="font-bold text-slate-800">Panduan Mobilitas Wong Solo:</h4>
        <p class="text-slate-600">${plan.transportAdvice.tip}</p>
      </div>

      <!-- Print Footer -->
      <div class="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
        © 2026 DOLANESIA - BizVibe Quintet. All Rights Reserved. • Rencana liburan disusun otomatis di DOLANESIA.
      </div>
    `;
  }

  function shareItineraryWhatsApp() {
    if (!state.currentGeneratedPlan) {
      showToast('Silakan buat itinerary terlebih dahulu!', 'info');
      return;
    }
    const plan = state.currentGeneratedPlan;
    let message = `*Rencana Liburan Solo Raya bersama DOLANESIA - Teman Jalan Pintar*\n`;
    message += `Total Estimasi Biaya: Rp ${plan.totalBudget.toLocaleString('id-ID')}\n`;
    message += `Transportasi: ${plan.transportAdvice.mode}\n\n`;

    plan.days.forEach(day => {
      message += `*=== HARI KE-${day.dayNumber}: ${day.themeTitle} ===*\n`;
      day.slots.forEach(slot => {
        message += `• [${slot.time}] ${slot.item.name} (Est. Rp ${slot.estimatedCost.toLocaleString('id-ID')})\n  _Tips:_ ${slot.note}\n`;
      });
      message += `\n`;
    });

    message += `Tips Mobilitas: ${plan.transportAdvice.tip}\n\n`;
    message += `Disusun otomatis dengan DOLANESIA - Teman Jalan Pintar. Yuk dolan bareng di Solo Raya!`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  }

  // =========================================================================
  // 13. GLOBAL EVENT LISTENERS BINDINGS
  // =========================================================================

  // Auto Planner Trigger
  if (elements.plannerForm) {
    elements.plannerForm.addEventListener('submit', (e) => handleGeneratePlan(e, { fromCart: false }));
  }
  if (elements.btnShareWA) {
    elements.btnShareWA.addEventListener('click', shareItineraryWhatsApp);
  }
  if (elements.btnPrintItinerary) {
    elements.btnPrintItinerary.addEventListener('click', () => {
      generatePrintableItinerary();
      window.print();
    });
  }

  // Cart to Itinerary Reset Button
  if (elements.btnResetToAutoPlan) {
    elements.btnResetToAutoPlan.addEventListener('click', () => {
      state.isCartPlan = false;
      handleGeneratePlan(null, { fromCart: false });
    });
  }

  // Directory Category Filters
  elements.categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-category');
      state.activeFilterCategory = category;

      elements.categoryFilters.forEach(b => {
        const isCurrent = b === btn;
        b.classList.toggle('bg-amber-600', isCurrent);
        b.classList.toggle('text-white', isCurrent);
        b.classList.toggle('bg-slate-100', !isCurrent);
        b.classList.toggle('text-slate-600', !isCurrent);
      });

      renderDirectory();
    });
  });

  // Directory Region Filter
  if (elements.regionFilter) {
    elements.regionFilter.addEventListener('change', (e) => {
      state.activeFilterRegion = e.target.value;
      renderDirectory();
    });
  }

  // Directory Sort Select
  if (elements.directorySortSelect) {
    elements.directorySortSelect.addEventListener('change', (e) => {
      state.activeSort = e.target.value;
      renderDirectory();
    });
  }

  // Directory Search Input
  if (elements.directorySearchInput) {
    elements.directorySearchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderDirectory();
    });
  }

  // Modal Close Triggers
  if (elements.closeDetailModalBtn) {
    elements.closeDetailModalBtn.addEventListener('click', () => closeModal(elements.detailModal));
  }
  if (elements.closeJoinTripModalBtn) {
    elements.closeJoinTripModalBtn.addEventListener('click', () => closeModal(elements.joinTripModal));
  }
  if (elements.closeCreateTripModalBtn) {
    elements.closeCreateTripModalBtn.addEventListener('click', () => closeModal(elements.createTripModal));
  }
  if (elements.btnCloseAddDayModal) {
    elements.btnCloseAddDayModal.addEventListener('click', () => closeModal(elements.addToDayModal));
  }

  // Close modals on background backdrop click
  [elements.loginModal, elements.detailModal, elements.joinTripModal, elements.createTripModal, elements.addToDayModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // Escape key closes modals and cart drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(elements.loginModal);
      closeModal(elements.detailModal);
      closeModal(elements.joinTripModal);
      closeModal(elements.createTripModal);
      closeModal(elements.addToDayModal);
      closeCartDrawer();
      if (elements.mobileMenuDrawer) elements.mobileMenuDrawer.classList.add('-translate-x-full');
    }
  });

  // Cart Drawer open & close
  if (elements.cartFloatingBtn) {
    elements.cartFloatingBtn.addEventListener('click', openCartDrawer);
  }
  if (elements.closeCartBtn) {
    elements.closeCartBtn.addEventListener('click', closeCartDrawer);
  }
  if (elements.cartDrawerBackdrop) {
    elements.cartDrawerBackdrop.addEventListener('click', closeCartDrawer);
  }
  if (elements.btnClearCart) {
    elements.btnClearCart.addEventListener('click', clearCart);
  }

  // Generate Itinerary from Cart items
  if (elements.btnGenerateFromCart) {
    elements.btnGenerateFromCart.addEventListener('click', () => {
      if (state.customItinerary.length === 0) {
        showToast('Keranjang Anda masih kosong. Simpan beberapa destinasi terlebih dahulu!', 'warning');
        return;
      }
      closeCartDrawer();
      showToast('Merancang rute otomatis khusus dari destinasi keranjang Anda...');
      switchPage('planner');
      handleGeneratePlan(null, { fromCart: true, cartItems: state.customItinerary });
    });
  }

  // Profile Saved Trips "+ Buat Rute Otomatis" button
  const btnProfileCreateRoute = document.querySelector('#tab-content-saved-trips [data-page-target="planner"]');
  if (btnProfileCreateRoute) {
    btnProfileCreateRoute.addEventListener('click', (e) => {
      if (state.customItinerary.length > 0) {
        e.preventDefault();
        switchPage('planner');
        handleGeneratePlan(null, { fromCart: true, cartItems: state.customItinerary });
      }
    });
  }

  // Mobile Menu Drawer
  if (elements.mobileMenuBtn && elements.mobileMenuDrawer) {
    elements.mobileMenuBtn.addEventListener('click', () => {
      elements.mobileMenuDrawer.classList.remove('-translate-x-full');
    });
  }
  if (elements.closeMobileMenuBtn && elements.mobileMenuDrawer) {
    elements.closeMobileMenuBtn.addEventListener('click', () => {
      elements.mobileMenuDrawer.classList.add('-translate-x-full');
    });
  }

  // Admin Shortcut Button in Admin View to add Open Trip
  const btnAdminAddTrip = document.getElementById('btn-admin-add-trip');
  if (btnAdminAddTrip) {
    btnAdminAddTrip.addEventListener('click', () => {
      openModal(elements.createTripModal);
    });
  }

  // =========================================================================
  // PWA INSTALLATION & MOBILE APP MODE CONTROLLER
  // =========================================================================
  let deferredInstallPrompt = null;

  function initPWAInstall() {
    const isApp = isStandaloneMode();

    if (isApp) {
      document.body.classList.add('is-standalone-app');
      if (elements.drawerInstallAppBanner) elements.drawerInstallAppBanner.classList.add('hidden');
    } else {
      document.body.classList.remove('is-standalone-app');
      if (elements.drawerInstallAppBanner) {
        elements.drawerInstallAppBanner.classList.remove('hidden');
      }
    }

    // Capture standard PWA install prompt event (Chrome / Edge / Android)
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      if (elements.pwaPromptContainer) {
        elements.pwaPromptContainer.classList.remove('hidden');
      }
    });

    // Handle App Installed Event
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      document.body.classList.add('is-standalone-app');
      if (elements.drawerInstallAppBanner) elements.drawerInstallAppBanner.classList.add('hidden');
      if (elements.pwaInstallModal) closeModal(elements.pwaInstallModal);
      showToast('Aplikasi DOLANESIA berhasil dipasang! Buka langsung dari layar utama HP Anda. 🎉', 'success');
      updateNavbarMode();
    });

    // Open Modal when clicking Download App
    const openInstallModal = () => {
      if (elements.pwaInstallModal) {
        if (deferredInstallPrompt && elements.pwaPromptContainer) {
          elements.pwaPromptContainer.classList.remove('hidden');
        }
        openModal(elements.pwaInstallModal);
      }
    };

    // Open PWA Modal triggers (Drawer, User Dropdown, Footer)
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-dropdown-pwa-modal') || e.target.closest('#btn-footer-download-app')) {
        e.preventDefault();
        const menuEl = document.getElementById('user-dropdown-menu');
        if (menuEl) menuEl.classList.add('hidden');
        openInstallModal();
      }
    });

    if (elements.btnInstallAppDrawer) {
      elements.btnInstallAppDrawer.addEventListener('click', () => {
        if (elements.mobileMenuDrawer) {
          elements.mobileMenuDrawer.classList.add('-translate-x-full');
        }
        openInstallModal();
      });
    }

    // Direct Browser Install Prompt Button inside modal
    if (elements.btnPwaDirectPrompt) {
      elements.btnPwaDirectPrompt.addEventListener('click', async () => {
        if (deferredInstallPrompt) {
          try {
            deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            if (choice && choice.outcome === 'accepted') {
              showToast('Memasang DOLANESIA ke layar utama...', 'success');
              if (elements.pwaInstallModal) closeModal(elements.pwaInstallModal);
            }
            deferredInstallPrompt = null;
          } catch (err) {
            console.log('Install prompt error:', err);
          }
        }
      });
    }

    // Interactive Preview Mode Toggle (Allows testing mobile app look with bottom-nav right now)
    if (elements.btnToggleAppPreview) {
      elements.btnToggleAppPreview.addEventListener('click', () => {
        isAppPreviewActive = !isAppPreviewActive;
        document.body.classList.toggle('preview-app-mode', isAppPreviewActive);
        document.body.classList.toggle('is-standalone-app', isAppPreviewActive);

        if (elements.btnToggleAppPreviewText) {
          elements.btnToggleAppPreviewText.textContent = isAppPreviewActive
            ? 'Kembalikan ke Tampilan Website Biasa'
            : 'Pratinjau Tampilan Setelah Download (Mobile App View)';
        }

        if (elements.pwaInstallModal) closeModal(elements.pwaInstallModal);

        if (isAppPreviewActive) {
          showToast('Mode Aplikasi Aktif! Di tampilan layar HP (lebar < 1024px), bilah navbar sekarang berada di BAGIAN BAWAH.', 'success', 5000);
        } else {
          showToast('Kembali ke Mode Website Biasa.', 'info');
        }
        updateNavbarMode();
      });
    }

    // Modal close buttons
    if (elements.btnClosePwaModal) {
      elements.btnClosePwaModal.addEventListener('click', () => {
        closeModal(elements.pwaInstallModal);
      });
    }
    if (elements.btnDonePwaModal) {
      elements.btnDonePwaModal.addEventListener('click', () => {
        closeModal(elements.pwaInstallModal);
      });
    }
  }

  // =========================================================================
  // 14. INITIAL APP BOOTSTRAP
  // =========================================================================
  initPWAInstall();
  renderAuthUI();
  updateCartUI();
  renderDirectory();
  renderOpenTrips();
  renderHomeSpotlight();

  // Pre-generate Day 1 plan for immediate interactive satisfaction
  state.currentGeneratedPlan = planner.generateItinerary({
    duration: 1,
    interest: 'all',
    budgetTier: 'standard',
    transport: 'motor'
  });
  renderGeneratedPlanUI();

  // Check URL Hash on initial launch to open requested page tab directly
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash && VALID_PAGES.includes(initialHash)) {
    switchPage(initialHash, false);
  } else {
    switchPage('beranda', false);
  }
});
