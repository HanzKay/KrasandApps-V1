import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

// Translations
const translations = {
  id: {
    // Common
    login: 'Masuk',
    logout: 'Keluar',
    register: 'Daftar',
    email: 'Email',
    password: 'Kata Sandi',
    name: 'Nama',
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    edit: 'Ubah',
    add: 'Tambah',
    search: 'Cari',
    loading: 'Memuat...',
    error: 'Kesalahan',
    success: 'Berhasil',
    confirm: 'Konfirmasi',
    back: 'Kembali',
    next: 'Lanjut',
    yes: 'Ya',
    no: 'Tidak',
    
    // Auth
    loginTitle: 'Masuk ke Akun',
    registerTitle: 'Buat Akun Baru',
    loginButton: 'Masuk',
    registerButton: 'Daftar',
    noAccount: 'Belum punya akun?',
    hasAccount: 'Sudah punya akun?',
    loginFailed: 'Login gagal',
    registerFailed: 'Pendaftaran gagal',
    invalidCredentials: 'Email atau kata sandi salah',
    
    // Customer App
    menu: 'Menu',
    cart: 'Keranjang',
    myOrders: 'Pesanan Saya',
    orderType: 'Tipe Pesanan',
    dineIn: 'Makan di Tempat',
    takeaway: 'Bawa Pulang',
    delivery: 'Antar',
    addToCart: 'Tambah',
    checkout: 'Checkout',
    placeOrder: 'Pesan Sekarang',
    orderPlaced: 'Pesanan Berhasil!',
    orderNumber: 'Nomor Pesanan',
    subtotal: 'Subtotal',
    discount: 'Diskon',
    total: 'Total',
    emptyCart: 'Keranjang kosong',
    continueShopping: 'Lanjut Belanja',
    scanQR: 'Scan QR Meja',
    tableNumber: 'Nomor Meja',
    customerName: 'Nama Pelanggan',
    notes: 'Catatan',
    categories: 'Kategori',
    all: 'Semua',
    beverages: 'Minuman',
    food: 'Makanan',
    unavailable: 'Tidak Tersedia',
    outOfStock: 'Stok Habis',
    
    // Orders
    orders: 'Pesanan',
    orderStatus: 'Status Pesanan',
    pending: 'Menunggu',
    preparing: 'Sedang Dibuat',
    ready: 'Siap',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    paid: 'Lunas',
    unpaid: 'Belum Bayar',
    paymentMethod: 'Metode Pembayaran',
    cash: 'Tunai',
    card: 'Kartu',
    ewallet: 'E-Wallet',
    processPayment: 'Proses Pembayaran',
    printReceipt: 'Cetak Struk',
    
    // Kitchen
    kitchenDashboard: 'Dapur',
    newOrders: 'Pesanan Baru',
    inProgress: 'Sedang Diproses',
    readyToServe: 'Siap Disajikan',
    startPreparing: 'Mulai Buat',
    markReady: 'Tandai Siap',
    markCompleted: 'Selesai',
    
    // POS
    posDashboard: 'Kasir',
    todaySales: 'Penjualan Hari Ini',
    totalOrders: 'Total Pesanan',
    pendingPayments: 'Menunggu Pembayaran',
    
    // Admin
    adminDashboard: 'Admin',
    users: 'Pengguna',
    products: 'Produk',
    settings: 'Pengaturan',
    statistics: 'Statistik',
    createUser: 'Buat Pengguna',
    userRole: 'Peran',
    admin: 'Admin',
    customer: 'Pelanggan',
    kitchen: 'Dapur',
    cashier: 'Kasir',
    waiter: 'Pelayan',
    storage: 'Gudang',
    loyaltyProgram: 'Program Loyalitas',
    membership: 'Keanggotaan',
    
    // CMS
    cmsDashboard: 'CMS',
    manageProducts: 'Kelola Produk',
    manageCategories: 'Kelola Kategori',
    productName: 'Nama Produk',
    price: 'Harga',
    description: 'Deskripsi',
    category: 'Kategori',
    available: 'Tersedia',
    featured: 'Unggulan',
    sortOrder: 'Urutan',
    active: 'Aktif',
    inactive: 'Nonaktif',
    currencySettings: 'Pengaturan Mata Uang',
    languageSettings: 'Pengaturan Bahasa',
    
    // Messages
    confirmDelete: 'Yakin ingin menghapus?',
    savedSuccessfully: 'Berhasil disimpan',
    deletedSuccessfully: 'Berhasil dihapus',
    errorOccurred: 'Terjadi kesalahan',
    noDataFound: 'Data tidak ditemukan',
    welcomeBack: 'Selamat datang kembali',
    
    // Membership
    memberDiscount: 'Diskon Member',
    youSave: 'Anda hemat',
    joinMembership: 'Gabung Member',
    memberBenefits: 'Keuntungan Member',
  },
  en: {
    // Common
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    yes: 'Yes',
    no: 'No',
    
    // Auth
    loginTitle: 'Login to Account',
    registerTitle: 'Create New Account',
    loginButton: 'Login',
    registerButton: 'Register',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    loginFailed: 'Login failed',
    registerFailed: 'Registration failed',
    invalidCredentials: 'Invalid email or password',
    
    // Customer App
    menu: 'Menu',
    cart: 'Cart',
    myOrders: 'My Orders',
    orderType: 'Order Type',
    dineIn: 'Dine In',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
    addToCart: 'Add',
    checkout: 'Checkout',
    placeOrder: 'Place Order',
    orderPlaced: 'Order Placed!',
    orderNumber: 'Order Number',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    emptyCart: 'Cart is empty',
    continueShopping: 'Continue Shopping',
    scanQR: 'Scan Table QR',
    tableNumber: 'Table Number',
    customerName: 'Customer Name',
    notes: 'Notes',
    categories: 'Categories',
    all: 'All',
    beverages: 'Beverages',
    food: 'Food',
    unavailable: 'Unavailable',
    outOfStock: 'Out of Stock',
    
    // Orders
    orders: 'Orders',
    orderStatus: 'Order Status',
    pending: 'Pending',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    cancelled: 'Cancelled',
    paid: 'Paid',
    unpaid: 'Unpaid',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    ewallet: 'E-Wallet',
    processPayment: 'Process Payment',
    printReceipt: 'Print Receipt',
    
    // Kitchen
    kitchenDashboard: 'Kitchen',
    newOrders: 'New Orders',
    inProgress: 'In Progress',
    readyToServe: 'Ready to Serve',
    startPreparing: 'Start Preparing',
    markReady: 'Mark Ready',
    markCompleted: 'Complete',
    
    // POS
    posDashboard: 'POS',
    todaySales: 'Today Sales',
    totalOrders: 'Total Orders',
    pendingPayments: 'Pending Payments',
    
    // Admin
    adminDashboard: 'Admin',
    users: 'Users',
    products: 'Products',
    settings: 'Settings',
    statistics: 'Statistics',
    createUser: 'Create User',
    userRole: 'Role',
    admin: 'Admin',
    customer: 'Customer',
    kitchen: 'Kitchen',
    cashier: 'Cashier',
    waiter: 'Waiter',
    storage: 'Storage',
    loyaltyProgram: 'Loyalty Program',
    membership: 'Membership',
    
    // CMS
    cmsDashboard: 'CMS',
    manageProducts: 'Manage Products',
    manageCategories: 'Manage Categories',
    productName: 'Product Name',
    price: 'Price',
    description: 'Description',
    category: 'Category',
    available: 'Available',
    featured: 'Featured',
    sortOrder: 'Sort Order',
    active: 'Active',
    inactive: 'Inactive',
    currencySettings: 'Currency Settings',
    languageSettings: 'Language Settings',
    
    // Messages
    confirmDelete: 'Are you sure you want to delete?',
    savedSuccessfully: 'Saved successfully',
    deletedSuccessfully: 'Deleted successfully',
    errorOccurred: 'An error occurred',
    noDataFound: 'No data found',
    welcomeBack: 'Welcome back',
    
    // Membership
    memberDiscount: 'Member Discount',
    youSave: 'You save',
    joinMembership: 'Join Membership',
    memberBenefits: 'Member Benefits',
  }
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Check localStorage, default to Indonesian
    const saved = localStorage.getItem('app_language');
    return saved || 'id';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isIndonesian: language === 'id',
    isEnglish: language === 'en',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
