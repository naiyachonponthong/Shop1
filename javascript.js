<script>
document.addEventListener('alpine:init', () => {
  Alpine.data('main', () => ({
    // ===== State =====
    currentPage: 'home',
    previousPage: null,
    storeConfig: {},
    products: [],
    cart: [],
    currentProduct: null,
    searchQuery: '',
    sortOption: 'price-asc',
    configData: {},
    couponDetailModalOpen: false,
currentCouponDetail: null,
    
    // Auth state
    currentUser: null,
    loginInfo: {
      email: '',
      password: ''
    },
    sessionId: null,
    profileOpen: false,
    
    // Mobile menu
    mobileMenuOpen: false,
    
    // Cart state
    cartOpen: false,
    
    // Checkout state
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      register: false, // เพิ่มสำหรับระบบสมัครสมาชิก
      password: '',    // เพิ่มสำหรับระบบสมัครสมาชิก
      confirmPassword: '' // เพิ่มสำหรับระบบสมัครสมาชิก
    },
    showPassword: false,      // เพิ่มสำหรับระบบสมัครสมาชิก
    showConfirmPassword: false, // เพิ่มสำหรับระบบสมัครสมาชิก
    orderCreated: false,
    currentOrderId: null,
    paymentMethod: 'qrcode', // เพิ่มตัวแปรนี้สำหรับเลือกวิธีการชำระเงิน
    slipImage: null,
    qrCodeGenerated: false,
    forgotPasswordModalOpen: false,
forgotPasswordEmail: '',
showLoginPassword: false,
    
    // Download state
    downloadToken: '',
    downloadInfo: null,
    
    // Dashboard state
    dashboardTab: 'overview',
    orders: [],
    payments: [],
    downloads: [],
    users: [],
    dashboardData: {
      totalOrders: 0,
      totalRevenue: 0,
      totalProducts: 0,
      totalDownloads: 0,
      recentOrders: [],
      recentPayments: []
    },
    
    // Customer Dashboard state - เพิ่มสำหรับแดชบอร์ดลูกค้า
    customerTab: 'overview',
    customerData: {
      totalOrders: 0,
      totalSpent: '0.00',
      activeDownloads: 0,
      recentOrders: [],
      recentDownloads: []
    },
    customerOrders: [],
    customerDownloads: [],
    searchOrderQuery: '',
    searchDownloadQuery: '',
    
    // ฟอร์มข้อมูลส่วนตัว
    profileForm: {
      name: '',
      email: '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    },
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmNewPassword: false,
    
    // Modal state
    productModalOpen: false,
    userModalOpen: false,
    orderDetailModalOpen: false,
    paymentDetailModalOpen: false,
    dashboardProductDetailModal: false,
    customerOrderDetailModalOpen: false,
    editingProduct: false,
    editingUser: false,
    currentOrderDetail: null,
    currentPaymentDetail: null,
    customerOrderDetail: null,
    paymentOrder: null,
    
    // Forms
    productForm: {
      product_id: '',
      name: '',
      price: 0,
      category: '',
      description: '',
      status: 'active',
      image: '',
      image_id: '',
      file_id: '',
      file_name: '',
      demo_link: '' // เพิ่มฟิลด์ใหม่สำหรับลิงก์ตัวอย่าง
    },
    userForm: {
      user_id: '',
      name: '',
      email: '',
      password: '',
      role: 'staff',
      status: 'active'
    },

    // เพิ่มใน Alpine.data('main') ส่วน State
currentPage: 'home',
previousPage: null,
storeConfig: {},
products: [],
cart: [],
currentProduct: null,
searchQuery: '',
sortOption: 'price-asc',
configData: {},

// เพิ่มตัวแปรสำหรับโค้ดส่วนลด
appliedCoupon: null,
couponCode: '',
discountAmount: 0,
coupons: [], // สำหรับแดชบอร์ด

// เพิ่มใน modal state
couponModalOpen: false,
editingCoupon: false,

// เพิ่ม form สำหรับโค้ดส่วนลด
couponForm: {
  coupon_id: '',
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: 0,
  max_discount: 0,
  minimum_amount: 0,
  usage_limit: 0,
  expiry_date: '',
  status: 'active'
},

// เพิ่มในส่วน methods
showCouponDetail(coupon) {
  this.currentCouponDetail = coupon;
  this.couponDetailModalOpen = true;
},

copyCouponCode(code) {
  if (code) {
    navigator.clipboard.writeText(code).then(() => {
      this.showAlert('success', 'คัดลอกแล้ว', `คัดลอกโค้ด "${code}" ไปยังคลิปบอร์ดแล้ว`);
    }).catch(err => {
      console.error('Error copying code:', err);
      this.showAlert('error', 'ข้อผิดพลาด', 'ไม่สามารถคัดลอกโค้ดได้');
    });
  }
},

// แก้ไข computed property
get finalTotal() {
  const subtotal = this.calculateTotal();
  const discount = parseFloat(this.discountAmount) || 0;
  const final = subtotal - discount;
  return Math.max(final, 0); // ป้องกันไม่ให้เป็นค่าลบ
},

applyCoupon() {
  if (!this.couponCode) {
    this.showAlert('warning', 'กรุณากรอกโค้ดส่วนลด');
    return;
  }
  
  // ตรวจสอบว่ามีอีเมลลูกค้าหรือไม่
  const customerEmail = this.customerInfo.email || (this.currentUser ? this.currentUser.email : '');
  
  if (!customerEmail) {
    this.showAlert('warning', 'กรุณากรอกอีเมลเพื่อใช้โค้ดส่วนลด');
    return;
  }
  
  const orderAmount = this.calculateTotal();
  
  this.showLoading('กำลังตรวจสอบโค้ดส่วนลด...');
  
  google.script.run
    .withSuccessHandler(result => {
      this.hideLoading();
      
      if (result.status === 'success') {
        this.appliedCoupon = result.coupon;
        // แปลงเป็นตัวเลขและตรวจสอบ
        this.discountAmount = parseFloat(result.discount_amount) || 0;
        
        this.showAlert('success', 'ใช้โค้ดส่วนลดสำเร็จ', 
          `ได้รับส่วนลด ฿${this.discountAmount.toFixed(2)}`);
      } else {
        this.showAlert('error', 'ข้อผิดพลาด', result.message);
        this.removeCoupon();
      }
    })
    .withFailureHandler(error => {
      this.hideLoading();
      console.error('Error applying coupon:', error);
      this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการตรวจสอบโค้ดส่วนลด');
      this.removeCoupon();
    })
    .validateCoupon(this.couponCode, orderAmount, customerEmail);
},

removeCoupon() {
  this.appliedCoupon = null;
  this.couponCode = '';
  this.discountAmount = 0; // ตั้งเป็นตัวเลข 0
},
    
    // ===== Computed =====
    get featuredProducts() {
      const activeProducts = this.products.filter(p => p.status === 'active');
      return activeProducts.slice(0, 4);
    },
    
    get filteredProducts() {
      let filtered = this.products.filter(p => p.status === 'active');
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(query) || 
          (p.description && p.description.toLowerCase().includes(query))
        );
      }
      
      // Sort products
      switch (this.sortOption) {
        case 'price-asc':
          filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
          break;
        case 'price-desc':
          filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
          break;
        case 'name-asc':
          filtered.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'name-desc':
          filtered.sort((a, b) => b.name.localeCompare(a.name));
          break;
      }
      
      return filtered;
    },

    // เพิ่มฟังก์ชันนี้ในส่วนของ methods
showUserModal(user = null) {
  this.editingUser = !!user;
  
  if (user) {
    this.userForm = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    };
  } else {
    this.userForm = {
      user_id: '',
      name: '',
      email: '',
      password: '',
      role: 'staff',
      status: 'active'
    };
  }
  
  this.userModalOpen = true;
},
    
    // Computed สำหรับระบบลูกค้า
    get filteredCustomerOrders() {
      if (!this.searchOrderQuery) return this.customerOrders;
      
      const query = this.searchOrderQuery.toLowerCase();
      return this.customerOrders.filter(order => 
        order.order_id.toLowerCase().includes(query) || 
        this.formatDate(order.order_date).toLowerCase().includes(query)
      );
    },
    
    get filteredCustomerDownloads() {
      if (!this.searchDownloadQuery) return this.customerDownloads;
      
      const query = this.searchDownloadQuery.toLowerCase();
      return this.customerDownloads.filter(download => 
        (download.product?.name && download.product.name.toLowerCase().includes(query)) || 
        download.token.toLowerCase().includes(query)
      );
    },
    
    // ===== Lifecycle =====
    init() {
      // Load data from localStorage
      this.loadFromLocalStorage();
      
      // Check session
      this.checkSession();
      
      // Load store config
      this.loadStoreConfig();
      
      // Load products
      this.loadProducts();
    },
    
    // ===== Methods =====
    
   // แก้ไขฟังก์ชัน showPage ที่มีอยู่แล้ว
showPage(page) {
  this.previousPage = this.currentPage;
  this.currentPage = page;
  window.scrollTo(0, 0);
  
  // Additional actions based on page
  if (page === 'checkout') {
    this.orderCreated = false;
    this.slipImage = null;
    this.currentOrderId = null;
    this.paymentMethod = 'qrcode'; 
    
    // ถ้ามีผู้ใช้ที่เข้าสู่ระบบอยู่แล้ว ให้ดึงข้อมูลมาใส่ในฟอร์ม
    if (this.currentUser) {
      this.customerInfo.name = this.currentUser.name;
      this.customerInfo.email = this.currentUser.email;
      this.customerInfo.phone = this.currentUser.phone;
      // ปิดการสมัครสมาชิกเพราะเป็นสมาชิกอยู่แล้ว
      this.customerInfo.register = false;
    }
  } else if (page === 'dashboard') {
    this.loadDashboardData();
    this.loadCoupons(); // เพิ่มบรรทัดนี้
  } else if (page === 'customerDashboard') {
    this.loadCustomerDashboardData();
    this.customerTab = 'overview';
  }
},
    
    goBack() {
      if (this.previousPage) {
        this.currentPage = this.previousPage;
        this.previousPage = null;
      } else {
        this.showPage('home');
      }
    },
    
    showProductDetail(product) {
      this.currentProduct = product;
      this.showPage('productDetail');
    },
    
    // Cart functions
    addToCart(product) {
      this.cart.push({
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1
      });
      
      this.saveCartToLocalStorage();
      this.showAlert('success', 'เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว');
    },
    
    removeFromCart(index) {
      this.cart.splice(index, 1);
      this.saveCartToLocalStorage();
    },
    
    calculateTotal() {
      return this.cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0);
    },
    
    saveCartToLocalStorage() {
      localStorage.setItem('digitalStoreCart', JSON.stringify(this.cart));
    },
    
    loadFromLocalStorage() {
      // Load cart
      const savedCart = localStorage.getItem('digitalStoreCart');
      if (savedCart) {
        this.cart = JSON.parse(savedCart);
      }
      
      // Load session
      this.sessionId = localStorage.getItem('digitalStoreSession');
    },
    
    // Authentication
    login() {
      this.showLoading('กำลังเข้าสู่ระบบ...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.currentUser = result.user;
            this.sessionId = result.session.id;
            localStorage.setItem('digitalStoreSession', result.session.id);
            
            this.showAlert('success', 'เข้าสู่ระบบสำเร็จ');
            
            // Clear form
            this.loginInfo = { email: '', password: '' };
            
            // ถ้าเป็น admin ให้ไปที่ dashboard, ถ้าเป็น customer ให้ไปที่ customerDashboard
            if (this.currentUser.role === 'admin') {
              this.showPage('dashboard');
            } else if (this.currentUser.role === 'customer') {
              this.showPage('customerDashboard');
            } else {
              this.showPage('home');
            }
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error logging in:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
        })
        .login(this.loginInfo.email, this.loginInfo.password);
    },
    
    logout() {
      this.showLoading('กำลังออกจากระบบ...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            localStorage.removeItem('digitalStoreSession');
            this.sessionId = null;
            this.currentUser = null;
            this.profileOpen = false;
            
            this.showAlert('success', 'ออกจากระบบสำเร็จ');
            this.showPage('home');
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error logging out:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการออกจากระบบ');
        })
        .logout(this.sessionId);
    },

    // เพิ่มฟังก์ชันนี้ใน javascript.js ในส่วนของ methods
downloadDirectly(token) {
  if (!token) {
    this.showAlert('warning', 'ไม่พบรหัสดาวน์โหลด', 'กรุณาลองใหม่อีกครั้ง');
    return;
  }
  
  this.showLoading('กำลังเตรียมไฟล์สำหรับดาวน์โหลด...');
  
  google.script.run
    .withSuccessHandler(result => {
      this.hideLoading();
      
      if (result.status === 'success') {
        // ใช้วิธีเปิดหน้าต่างใหม่เพื่อดาวน์โหลด
        window.open(result.url, '_blank');
        
        this.showAlert('success', 'เริ่มดาวน์โหลด', 'ระบบกำลังดาวน์โหลดไฟล์ของคุณ');
      } else {
        this.showAlert('error', 'ข้อผิดพลาด', result.message);
      }
    })
    .withFailureHandler(error => {
      this.hideLoading();
      console.error('Error downloading file:', error);
      this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
    })
    .downloadFile(token);
},
    
    checkSession() {
      if (!this.sessionId) return;
      
      google.script.run
        .withSuccessHandler(result => {
          if (result.status === 'success') {
            this.currentUser = result.user;
            
            // ถ้าหน้าปัจจุบันคือหน้า login แล้วมี session อยู่แล้ว ให้เปลี่ยนไปหน้า home
            if (this.currentPage === 'login') {
              this.showPage('home');
            }
          } else {
            localStorage.removeItem('digitalStoreSession');
            this.sessionId = null;
            this.currentUser = null;
          }
        })
        .withFailureHandler(error => {
          console.error('Error checking session:', error);
          localStorage.removeItem('digitalStoreSession');
          this.sessionId = null;
          this.currentUser = null;
        })
        .checkSession(this.sessionId);
    },
    
    // Data loading
    loadStoreConfig() {
      google.script.run
        .withSuccessHandler(result => {
          if (result.status === 'success') {
            this.storeConfig = result.config;
            this.configData = {...result.config};
          } else {
            console.error('Error loading store config:', result.message);
          }
        })
        .withFailureHandler(error => {
          console.error('Error loading store config:', error);
        })
        .getConfigJSON();
    },
    
    loadProducts() {
      google.script.run
        .withSuccessHandler(result => {
          if (result.status === 'success') {
            this.products = result.products;
          } else {
            console.error('Error loading products:', result.message);
          }
        })
        .withFailureHandler(error => {
          console.error('Error loading products:', error);
        })
        .getProductsJSON();
    },
    
    // ฟังก์ชันสำหรับตรวจสอบข้อมูลลูกค้า
    validateCustomerInfo() {
      // ตรวจสอบข้อมูลพื้นฐาน
      if (!this.customerInfo.name || !this.customerInfo.email || !this.customerInfo.phone) {
        this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อ อีเมล และเบอร์โทรศัพท์');
        return false;
      }
      
      // ตรวจสอบรูปแบบอีเมล
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.customerInfo.email)) {
        this.showAlert('warning', 'อีเมลไม่ถูกต้อง', 'กรุณาตรวจสอบรูปแบบอีเมล');
        return false;
      }
      
      // ถ้าเลือกสมัครสมาชิก ต้องตรวจสอบรหัสผ่าน
      if (this.customerInfo.register) {
        if (this.customerInfo.password.length < 6) {
          this.showAlert('warning', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
          return false;
        }
        
        if (this.customerInfo.password !== this.customerInfo.confirmPassword) {
          this.showAlert('warning', 'รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านให้ตรงกัน');
          return false;
        }
      }
      
      return true;
    },
    
    // ปรับฟังก์ชัน createOrder ให้รองรับการสมัครสมาชิก
    createOrder() {
  if (this.cart.length === 0) {
    this.showAlert('warning', 'ตะกร้าว่าง', 'กรุณาเพิ่มสินค้าลงตะกร้าก่อนชำระเงิน');
    return;
  }
  
  if (!this.validateCustomerInfo()) {
    return;
  }
  
  this.showLoading('กำลังดำเนินการ...');
  
  // ถ้าเลือกสมัครสมาชิกและยังไม่ได้เข้าสู่ระบบ
  if (this.customerInfo.register && !this.currentUser) {
    // สร้างข้อมูลสำหรับสมัครสมาชิก
    const customerData = {
      name: this.customerInfo.name,
      email: this.customerInfo.email,
      phone: this.customerInfo.phone,
      password: this.customerInfo.password,
      role: 'customer',
      status: 'active'
    };
    
    // เรียกใช้ API สร้างลูกค้าใหม่
    google.script.run
      .withSuccessHandler(result => {
        if (result.status === 'success') {
          // สมัครสมาชิกสำเร็จ ล็อกอินอัตโนมัติ
          this.currentUser = result.user;
          this.sessionId = result.session?.id;
          
          if (this.sessionId) {
            localStorage.setItem('digitalStoreSession', this.sessionId);
          }
          
          // ดำเนินการสร้างคำสั่งซื้อต่อไป
          this.processCreateOrder();
        } else {
          this.hideLoading();
          this.showAlert('error', 'ข้อผิดพลาด', result.message || 'ไม่สามารถสมัครสมาชิกได้');
        }
      })
      .withFailureHandler(error => {
        this.hideLoading();
        console.error('Error creating customer:', error);
        this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
      })
      .createCustomer(customerData);
  } else {
    // ไม่ได้สมัครสมาชิกหรือเป็นสมาชิกอยู่แล้ว ดำเนินการสร้างคำสั่งซื้อเลย
    this.processCreateOrder();
  }
},
    
 processCreateOrder() {
  const customerEmail = this.customerInfo.email || (this.currentUser ? this.currentUser.email : '');
  
  // ถ้ามีโค้ดส่วนลด ให้ใช้โค้ดจริง
  if (this.appliedCoupon) {
    this.showLoading('กำลังใช้โค้ดส่วนลดและสร้างคำสั่งซื้อ...');
    
    google.script.run
      .withSuccessHandler(result => {
        if (result.status === 'success') {
          // อัพเดทข้อมูลส่วนลด - แปลงเป็นตัวเลข
          this.discountAmount = parseFloat(result.discount_amount) || 0;
          
          // สร้างคำสั่งซื้อ
          const orderData = {
            customer: {
              name: this.customerInfo.name,
              email: customerEmail,
              phone: this.customerInfo.phone,
              user_id: this.currentUser?.user_id || null
            },
            items: this.cart.map(item => ({
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image
            })),
            subtotal: this.calculateTotal(),
            discount_amount: this.discountAmount,
            coupon_code: this.appliedCoupon?.code || null,
            coupon_id: this.appliedCoupon?.coupon_id || null,
            total_amount: this.finalTotal
          };
          
          // บันทึกคำสั่งซื้อ
          google.script.run
            .withSuccessHandler(orderResult => {
              this.hideLoading();
              
              if (orderResult.status === 'success') {
                this.currentOrderId = orderResult.order.order_id;
                this.orderCreated = true;
                this.paymentMethod = 'qrcode';
                
                this.showAlert('success', 'สร้างคำสั่งซื้อสำเร็จ', 'กรุณาชำระเงินและอัพโหลดสลิป');
              } else {
                this.showAlert('error', 'ข้อผิดพลาด', orderResult.message);
              }
            })
            .withFailureHandler(error => {
              this.hideLoading();
              console.error('Error creating order:', error);
              this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
            })
            .saveOrderJSON(orderData);
            
        } else {
          this.hideLoading();
          this.showAlert('error', 'ข้อผิดพลาด', result.message);
          this.removeCoupon();
        }
      })
      .withFailureHandler(error => {
        this.hideLoading();
        console.error('Error using coupon:', error);
        this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการใช้โค้ดส่วนลด');
      })
      .validateAndUseCoupon(this.appliedCoupon.code, this.calculateTotal(), customerEmail);
      
  } else {
    // ไม่มีโค้ดส่วนลด สร้างคำสั่งซื้อปกติ
    const orderData = {
      customer: {
        name: this.customerInfo.name,
        email: customerEmail,
        phone: this.customerInfo.phone,
        user_id: this.currentUser?.user_id || null
      },
      items: this.cart.map(item => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image
      })),
      subtotal: this.calculateTotal(),
      discount_amount: 0,
      coupon_code: null,
      coupon_id: null,
      total_amount: this.calculateTotal()
    };
    
    google.script.run
      .withSuccessHandler(result => {
        this.hideLoading();
        
        if (result.status === 'success') {
          this.currentOrderId = result.order.order_id;
          this.orderCreated = true;
          this.paymentMethod = 'qrcode';
          
          this.showAlert('success', 'สร้างคำสั่งซื้อสำเร็จ', 'กรุณาชำระเงินและอัพโหลดสลิป');
        } else {
          this.showAlert('error', 'ข้อผิดพลาด', result.message);
        }
      })
      .withFailureHandler(error => {
        this.hideLoading();
        console.error('Error creating order:', error);
        this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ');
      })
      .saveOrderJSON(orderData);
  }
},

loadCoupons() {
  console.log('Loading coupons...'); // เพิ่มบรรทัดนี้
  
  google.script.run
    .withSuccessHandler(result => {
      console.log('Coupons loaded:', result); // เพิ่มบรรทัดนี้
      
      if (result.status === 'success') {
        this.coupons = result.coupons;
        console.log('Coupons array:', this.coupons); // เพิ่มบรรทัดนี้
      } else {
        console.error('Error loading coupons:', result.message);
      }
    })
    .withFailureHandler(error => {
      console.error('Error loading coupons:', error);
    })
    .getCouponsJSON();
},

showCouponModal(coupon = null) {
  this.editingCoupon = !!coupon;
  
  if (coupon) {
    this.couponForm = {
      coupon_id: coupon.coupon_id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount: coupon.max_discount || 0,
      minimum_amount: coupon.minimum_amount || 0,
      usage_limit: coupon.usage_limit || 0,
      expiry_date: coupon.expiry_date ? new Date(coupon.expiry_date).toISOString().split('T')[0] : '',
      status: coupon.status,
      one_per_email: coupon.one_per_email || false // เพิ่มบรรทัดนี้
    };
  } else {
    this.couponForm = {
      coupon_id: '',
      code: '',
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      max_discount: 0,
      minimum_amount: 0,
      usage_limit: 0,
      expiry_date: '',
      status: 'active',
      one_per_email: false // เพิ่มบรรทัดนี้
    };
  }
  
  this.couponModalOpen = true;
},

saveCoupon() {
  if (!this.couponForm.code || !this.couponForm.name) {
    this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกรหัสโค้ดและชื่อโค้ดส่วนลด');
    return;
  }
  
  if (this.couponForm.discount_value <= 0) {
    this.showAlert('warning', 'ข้อมูลไม่ถูกต้อง', 'กรุณากรอกมูลค่าส่วนลดที่ถูกต้อง');
    return;
  }
  
  this.showLoading('กำลังบันทึกโค้ดส่วนลด...');
  
  // แปลงวันที่ให้เป็น ISO format
  const formData = { ...this.couponForm };
  if (formData.expiry_date) {
    formData.expiry_date = new Date(formData.expiry_date + 'T23:59:59').toISOString();
  }
  formData.code = formData.code.toUpperCase();
  
  google.script.run
    .withSuccessHandler(result => {
      this.hideLoading();
      
      if (result.status === 'success') {
        this.couponModalOpen = false;
        this.loadCoupons();
        this.showAlert('success', 'บันทึกโค้ดส่วนลดสำเร็จ');
      } else {
        this.showAlert('error', 'ข้อผิดพลาด', result.message);
      }
    })
    .withFailureHandler(error => {
      this.hideLoading();
      console.error('Error saving coupon:', error);
      this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกโค้ดส่วนลด');
    })
    .saveCouponJSON(formData);
},

deleteCoupon(couponId) {
  Swal.fire({
    title: 'ยืนยันการลบ',
    text: 'คุณต้องการลบโค้ดส่วนลดนี้ใช่หรือไม่?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ลบ',
    cancelButtonText: 'ยกเลิก'
  }).then(result => {
    if (result.isConfirmed) {
      this.showLoading('กำลังลบโค้ดส่วนลด...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.loadCoupons();
            this.showAlert('success', 'ลบโค้ดส่วนลดสำเร็จ');
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error deleting coupon:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบโค้ดส่วนลด');
        })
        .deleteCouponJSON(couponId);
    }
  });
},

// แก้ไขฟังก์ชัน loadDashboardData ที่มีอยู่แล้ว
loadDashboardData() {
  this.loadDashboardOrders();
  this.loadDashboardPayments();
  this.loadDashboardDownloads();
  this.loadDashboardUsers();
  this.loadCoupons(); // เพิ่มบรรทัดนี้
  this.updateDashboardStats();
},
    
    handleSlipUpload(event) {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = e => {
        this.slipImage = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    
    removeSlip() {
      this.slipImage = null;
      document.getElementById('slipFile').value = '';
    },
    
    confirmPayment() {
      if (!this.slipImage) {
        this.showAlert('warning', 'ไม่พบสลิป', 'กรุณาอัพโหลดสลิปการโอนเงิน');
        return;
      }
      
      if (!this.currentOrderId) {
        this.showAlert('warning', 'ไม่พบคำสั่งซื้อ', 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        return;
      }
      
      this.showLoading('กำลังส่งข้อมูลการชำระเงิน...');
      
      // Store the total before clearing the cart
      const totalAmount = this.calculateTotal().toFixed(2);
      
      const paymentData = {
        order_id: this.currentOrderId,
        amount: totalAmount,
        slip_image: this.slipImage,
        payment_method: this.paymentMethod
      };
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            // Clear cart
            this.cart = [];
            this.saveCartToLocalStorage();
            
            Swal.fire({
              icon: 'success',
              title: 'ชำระเงินสำเร็จ',
              html: `
                <p>ขอบคุณสำหรับการสั่งซื้อ</p>
                <p>รหัสคำสั่งซื้อ: <strong>${this.currentOrderId}</strong></p>
                <p>จำนวนเงิน: <strong>฿${totalAmount}</strong></p>
                <p>กรุณารอการตรวจสอบการชำระเงิน หลังจากตรวจสอบแล้ว เราจะส่งรหัสดาวน์โหลดไปยังอีเมลของคุณ</p>
              `,
              confirmButtonText: 'ตกลง'
            }).then(() => {
              // ถ้าเป็นสมาชิก ให้ไปที่หน้าแดชบอร์ดลูกค้า ถ้าไม่ใช่ไปหน้าหลัก
              if (this.currentUser && this.currentUser.role === 'customer') {
                this.showPage('customerDashboard');
              } else {
                this.showPage('home');
              }
            });
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error confirming payment:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการส่งข้อมูลการชำระเงิน');
        })
        .savePaymentJSON(paymentData);
    },
    
    // Download
    downloadProduct() {
      if (!this.downloadToken) {
        this.showAlert('warning', 'กรุณากรอกรหัสดาวน์โหลด', 'กรุณากรอกรหัสดาวน์โหลดที่ได้รับทางอีเมล');
        return;
      }
      
      this.showLoading('กำลังตรวจสอบรหัสดาวน์โหลด...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            // Get download info
           google.script.run
             .withSuccessHandler(downloadResult => {
               if (downloadResult.status === 'success') {
                 const download = downloadResult.download;
                 
                 // Get product info
                 google.script.run
                   .withSuccessHandler(productResult => {
                     if (productResult.status === 'success') {
                       const product = productResult.product;
                       
                       this.downloadInfo = {
                         url: result.url,
                         productTitle: product.name,
                         description: product.description || 'ไม่มีคำอธิบายเพิ่มเติม',
                         download: download
                       };
                       
                       this.showAlert('success', 'ดาวน์โหลดพร้อมแล้ว', 'คุณสามารถดาวน์โหลดไฟล์ได้ทันที');
                     } else {
                       this.showAlert('error', 'ข้อผิดพลาด', productResult.message);
                     }
                   })
                   .withFailureHandler(error => {
                     console.error('Error getting product info:', error);
                     this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า');
                   })
                   .getProductJSON(download.product_id);
               } else {
                 this.showAlert('error', 'ข้อผิดพลาด', downloadResult.message);
               }
             })
             .withFailureHandler(error => {
               console.error('Error getting download info:', error);
               this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดึงข้อมูลการดาวน์โหลด');
             })
             .getDownloadInfo(result.download_id);
         } else {
           this.showAlert('error', 'ข้อผิดพลาด', result.message);
         }
       })
       .withFailureHandler(error => {
         this.hideLoading();
         console.error('Error downloading file:', error);
         this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์');
       })
       .downloadFile(this.downloadToken);
   },
   
   // Dashboard functions
   loadDashboardData() {
     this.loadDashboardOrders();
     this.loadDashboardPayments();
     this.loadDashboardDownloads();
     this.loadDashboardUsers();
     this.updateDashboardStats();
   },
   
   loadDashboardOrders() {
     google.script.run
       .withSuccessHandler(result => {
         if (result.status === 'success') {
           this.orders = result.orders;
           this.updateDashboardStats();
         } else {
           console.error('Error loading orders:', result.message);
         }
       })
       .withFailureHandler(error => {
         console.error('Error loading orders:', error);
       })
       .getOrdersJSON();
   },
   
   loadDashboardPayments() {
     google.script.run
       .withSuccessHandler(result => {
         if (result.status === 'success') {
           this.payments = result.payments;
           this.updateDashboardStats();
         } else {
           console.error('Error loading payments:', result.message);
         }
       })
       .withFailureHandler(error => {
         console.error('Error loading payments:', error);
       })
       .getPaymentsJSON();
   },
   
   loadDashboardDownloads() {
  google.script.run
    .withSuccessHandler(result => {
      if (result.status === 'success') {
        this.downloads = result.downloads;
        this.updateDashboardStats();
      } else {
        console.error('Error loading downloads:', result.message);
      }
    })
    .withFailureHandler(error => {
      console.error('Error loading downloads:', error);
    })
    .getDownloadsWithProductJSON();
},
   
   loadDashboardUsers() {
     google.script.run
       .withSuccessHandler(result => {
         if (result.status === 'success') {
           this.users = result.users;
         } else {
           console.error('Error loading users:', result.message);
         }
       })
       .withFailureHandler(error => {
         console.error('Error loading users:', error);
       })
       .getUsersJSON();
   },
   
   updateDashboardStats() {
     // Calculate stats
     const totalOrders = this.orders.length;
     
     let totalRevenue = 0;
     for (const payment of this.payments) {
       if (payment.status === 'completed') {
         totalRevenue += parseFloat(payment.amount);
       }
     }
     
     const totalProducts = this.products.length;
     const totalDownloads = this.downloads.length;
     
     // Get recent orders (sort by date)
     const recentOrders = [...this.orders]
       .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
       .slice(0, 5);
     
     // Get recent payments (sort by date)
     const recentPayments = [...this.payments]
       .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
       .slice(0, 5);
     
     // Update dashboard data
     this.dashboardData = {
       totalOrders,
       totalRevenue: totalRevenue.toFixed(2),
       totalProducts,
       totalDownloads,
       recentOrders,
       recentPayments
     };
   },
   
   // ฟังก์ชันสำหรับหน้าแดชบอร์ดลูกค้า
   loadCustomerDashboardData() {
     if (!this.currentUser || this.currentUser.role !== 'customer') {
       this.showPage('home');
       return;
     }
     
     this.showLoading('กำลังโหลดข้อมูล...');
     
     // โหลดข้อมูลคำสั่งซื้อของลูกค้า
     google.script.run
       .withSuccessHandler(result => {
         if (result.status === 'success') {
           this.customerOrders = result.orders;
           
           // คำนวณสถิติ
           const totalOrders = this.customerOrders.length;
           
           let totalSpent = 0;
           for (const order of this.customerOrders) {
             if (order.status === 'completed') {
               totalSpent += parseFloat(order.total_amount);
             }
           }
           
           // คำสั่งซื้อล่าสุด
           const recentOrders = [...this.customerOrders]
             .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
             .slice(0, 3);
           
           // โหลดข้อมูลการดาวน์โหลดของลูกค้า
           google.script.run
             .withSuccessHandler(downloadResult => {
               this.hideLoading();
               
               if (downloadResult.status === 'success') {
                 this.customerDownloads = downloadResult.downloads;
                 
                 // กรองเฉพาะดาวน์โหลดที่ใช้งานได้
                 const activeDownloads = this.customerDownloads.filter(d => d.status === 'active').length;
                 
                 // ดาวน์โหลดล่าสุด
                 const recentDownloads = [...this.customerDownloads]
                   .filter(d => d.status === 'active')
                   .slice(0, 3);
                 
                 // อัพเดทข้อมูลสำหรับแสดงในแดชบอร์ด
                 this.customerData = {
                   totalOrders,
                   totalSpent: totalSpent.toFixed(2),
                   activeDownloads,
                   recentOrders,
                   recentDownloads
                 };
                 
                 // โหลดข้อมูลส่วนตัวของลูกค้า
                 this.profileForm = {
                   name: this.currentUser.name || '',
                   email: this.currentUser.email || '',
                   phone: this.currentUser.phone || '',
                   currentPassword: '',
                   newPassword: '',
                   confirmNewPassword: ''
                 };
               } else {
                 console.error('Error loading customer downloads:', downloadResult.message);
                 this.showAlert('error', 'ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลการดาวน์โหลดได้');
               }
             })
             .withFailureHandler(error => {
               this.hideLoading();
               console.error('Error loading customer downloads:', error);
               this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการโหลดข้อมูลการดาวน์โหลด');
             })
             .getCustomerDownloads(this.currentUser.user_id);
         } else {
           this.hideLoading();
           console.error('Error loading customer orders:', result.message);
           this.showAlert('error', 'ข้อผิดพลาด', 'ไม่สามารถโหลดข้อมูลคำสั่งซื้อได้');
         }
       })
       .withFailureHandler(error => {
         this.hideLoading();
         console.error('Error loading customer orders:', error);
         this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการโหลดข้อมูลคำสั่งซื้อ');
       })
       .getCustomerOrders(this.currentUser.user_id);
   },
   
   showCustomerOrderDetail(orderId) {
     this.showLoading('กำลังโหลดข้อมูลคำสั่งซื้อ...');
     
     google.script.run
       .withSuccessHandler(result => {
         this.hideLoading();
         
         if (result.status === 'success') {
           this.customerOrderDetail = result.order;
           this.customerOrderDetailModalOpen = true;
         } else {
           this.showAlert('error', 'ข้อผิดพลาด', result.message);
         }
       })
       .withFailureHandler(error => {
         this.hideLoading();
         console.error('Error getting order details:', error);
         this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
       })
       .getOrderJSON(orderId);
   },
   
   updateCustomerProfile() {
     // ตรวจสอบข้อมูลพื้นฐาน
     if (!this.profileForm.name || !this.profileForm.email) {
       this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อและอีเมล');
       return;
     }
     
     // ตรวจสอบรหัสผ่านถ้ามีการเปลี่ยนแปลง
     if (this.profileForm.newPassword) {
       if (!this.profileForm.currentPassword) {
         this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกรหัสผ่านปัจจุบัน');
         return;
       }
       
       if (this.profileForm.newPassword.length < 6) {
         this.showAlert('warning', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
         return;
       }
       
       if (this.profileForm.newPassword !== this.profileForm.confirmNewPassword) {
         this.showAlert('warning', 'รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านใหม่ให้ตรงกัน');
         return;
       }
     }
     
     this.showLoading('กำลังอัพเดทข้อมูลส่วนตัว...');
     
     const userData = {
       user_id: this.currentUser.user_id,
       name: this.profileForm.name,
       email: this.profileForm.email,
       phone: this.profileForm.phone,
       currentPassword: this.profileForm.currentPassword,
       newPassword: this.profileForm.newPassword
     };
     
     google.script.run
       .withSuccessHandler(result => {
         this.hideLoading();
         
         if (result.status === 'success') {
           // อัพเดทข้อมูลผู้ใช้ปัจจุบัน
           this.currentUser = result.user;
           
           // รีเซ็ตฟอร์มรหัสผ่าน
           this.profileForm.currentPassword = '';
           this.profileForm.newPassword = '';
           this.profileForm.confirmNewPassword = '';
           
           this.showAlert('success', 'อัพเดทข้อมูลสำเร็จ', 'ข้อมูลส่วนตัวของคุณถูกอัพเดทเรียบร้อยแล้ว');
         } else {
           this.showAlert('error', 'ข้อผิดพลาด', result.message);
         }
       })
       .withFailureHandler(error => {
         this.hideLoading();
         console.error('Error updating profile:', error);
         this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลส่วนตัว');
       })
       .updateCustomerProfile(userData);
   },
   
   copyToClipboard(text) {
     navigator.clipboard.writeText(text).then(() => {
       this.showAlert('success', 'คัดลอกแล้ว', 'คัดลอกรหัสดาวน์โหลดไปยังคลิปบอร์ดแล้ว');
     }).catch(err => {
       console.error('Error copying to clipboard:', err);
       this.showAlert('error', 'ข้อผิดพลาด', 'ไม่สามารถคัดลอกข้อความได้');
     });
   },
   
   // Product management
   showProductModal(product = null) {
     this.editingProduct = !!product;
     
     if (product) {
       this.productForm = {
         product_id: product.product_id,
         name: product.name,
         price: product.price,
         category: product.category || '',
         description: product.description || '',
         status: product.status,
         image: product.image || '',
         image_id: product.image_id || '',
         file_id: product.file_id || '',
         file_name: product.file_name || '',
         demo_link: product.demo_link || '' // เพิ่มฟิลด์ใหม่
       };
     } else {
       this.productForm = {
         product_id: '',
         name: '',
         price: 0,
         category: '',
         description: '',
         status: 'active',
         image: '',
         image_id: '',
         file_id: '',
         file_name: '',
         demo_link: '' // เพิ่มฟิลด์ใหม่
       };
     }
     
     this.productModalOpen = true;
   },
   
   // ฟังก์ชันสำหรับอัพโหลดรูปภาพสินค้า
   handleProductImageUpload(event) {
     const file = event.target.files[0];
     if (!file) return;
     
     this.showLoading('กำลังอัพโหลดรูปภาพสินค้า...');
     
     const reader = new FileReader();
     const self = this; // เก็บ context ของ this เพื่อใช้ใน callback
     
     reader.onload = function(e) {
       const base64Data = e.target.result;
       
       google.script.run
         .withSuccessHandler(function(result) {
           self.hideLoading();
           
           if (result.status === 'success') {
             self.productForm.image = result.url;
             self.productForm.image_id = result.file_id;
             self.showAlert('success', 'อัพโหลดรูปภาพสำเร็จ');
           } else {
             document.getElementById('productImageInput').value = '';
             self.showAlert('error', 'ข้อผิดพลาด', result.message);
           }
         })
         .withFailureHandler(function(error) {
           self.hideLoading();
           document.getElementById('productImageInput').value = '';
           console.error('Error uploading image:', error);
           self.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
         })
         .saveBase64AsFile(base64Data, file.name, 'product_image');
     };
     
     reader.readAsDataURL(file);
   },
   
   // ฟังก์ชันสำหรับลบรูปภาพสินค้า
   removeProductImage() {
     this.productForm.image = '';
     this.productForm.image_id = '';
     document.getElementById('productImageInput').value = '';
   },
   
   // ฟังก์ชันสำหรับอัพโหลดไฟล์สินค้า
   handleProductFileUpload(event) {
     const file = event.target.files[0];
     if (!file) return;
     
     this.showLoading('กำลังอัพโหลดไฟล์สินค้า...');
     
     const reader = new FileReader();
     const self = this; // เก็บ context ของ this เพื่อใช้ใน callback
     
     reader.onload = function(e) {
       const base64Data = e.target.result;
       
       google.script.run
         .withSuccessHandler(function(result) {
           self.hideLoading();
           
           if (result.status === 'success') {
             self.productForm.file_id = result.file_id;
             self.productForm.file_name = result.file_name;
             self.showAlert('success', 'อัพโหลดไฟล์สินค้าสำเร็จ');
           } else {
             document.getElementById('productFileInput').value = '';
             self.showAlert('error', 'ข้อผิดพลาด', result.message);
           }
         })
         .withFailureHandler(function(error) {
           self.hideLoading();
           document.getElementById('productFileInput').value = '';
           console.error('Error uploading file:', error);
           self.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์');
         })
         .saveBase64AsFile(base64Data, file.name, 'product_file');
     };
     
     reader.readAsDataURL(file);
   },
   
   // ฟังก์ชันสำหรับลบไฟล์สินค้า
   removeProductFile() {
     this.productForm.file_id = '';
     this.productForm.file_name = '';
     document.getElementById('productFileInput').value = '';
   },
   
   saveProduct() {
     if (!this.productForm.name || !this.productForm.price) {
       this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อและราคาสินค้า');
       return;
     }
     
     if (!this.productForm.file_id) {
       this.showAlert('warning', 'ไม่พบไฟล์สินค้า', 'กรุณาอัพโหลดไฟล์สินค้าที่ต้องการขาย');
       return;
     }
     
     this.showLoading('กำลังบันทึกสินค้า...');
     
     google.script.run
       .withSuccessHandler(result => {
         this.hideLoading();
         
         if (result.status === 'success') {
           this.productModalOpen = false;
           this.loadProducts();
           this.showAlert('success', 'บันทึกสินค้าสำเร็จ');
         } else {
           this.showAlert('error', 'ข้อผิดพลาด', result.message);
         }
       })
       .withFailureHandler(error => {
         this.hideLoading();
         console.error('Error saving product:', error);
         this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกสินค้า');
       })
       .saveProductJSON(this.productForm);
   },
   
   deleteProduct(productId) {
     Swal.fire({
       title: 'ยืนยันการลบ',
       text: 'คุณต้องการลบสินค้านี้ใช่หรือไม่?',
       icon: 'warning',
       showCancelButton: true,
       confirmButtonText: 'ลบ',
       cancelButtonText: 'ยกเลิก'
     }).then(result => {
       if (result.isConfirmed) {
         this.showLoading('กำลังลบสินค้า...');
         
         google.script.run
           .withSuccessHandler(result => {
             this.hideLoading();
             
             if (result.status === 'success') {
               this.loadProducts();
               this.showAlert('success', 'ลบสินค้าสำเร็จ');
             } else {
               this.showAlert('error', 'ข้อผิดพลาด', result.message);
             }
           })
           .withFailureHandler(error => {
              this.hideLoading();
              console.error('Error deleting product:', error);
              this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบสินค้า');
            })
            .deleteProductJSON(productId);
        }
      });
    },
    
    // Order management
    showOrderDetail(orderId) {
      this.showLoading('กำลังโหลดข้อมูลคำสั่งซื้อ...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.currentOrderDetail = result.order;
            this.orderDetailModalOpen = true;
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error getting order details:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ');
        })
        .getOrderJSON(orderId);
    },
    
    // ฟังก์ชันสำหรับแสดงหน้าต่างอัพเดทสถานะคำสั่งซื้อ
showUpdateOrderStatus(orderId) {
  Swal.fire({
    title: 'อัพเดทสถานะคำสั่งซื้อ',
    input: 'select',
    inputOptions: {
      pending: 'รอดำเนินการ',
      processing: 'กำลังดำเนินการ',
      completed: 'เสร็จสิ้น',
      cancelled: 'ยกเลิก'
    },
    inputPlaceholder: 'เลือกสถานะ',
    showCancelButton: true,
    confirmButtonText: 'อัพเดท',
    cancelButtonText: 'ยกเลิก',
    inputValidator: (value) => {
      if (!value) {
        return 'กรุณาเลือกสถานะ';
      }
    },
    footer: '<small class="text-left text-gray-500">หมายเหตุ: การเปลี่ยนสถานะเป็น "เสร็จสิ้น" หรือ "ยกเลิก" จะเปลี่ยนสถานะการชำระเงินด้วย</small>'
  }).then(result => {
    if (result.isConfirmed) {
      // ถ้าสถานะเป็น 'completed' หรือ 'cancelled' ให้แสดงการยืนยันเพิ่มเติม
      if (result.value === 'completed' || result.value === 'cancelled') {
        let warningMessage = '';
        if (result.value === 'completed') {
          warningMessage = 'สถานะการชำระเงินจะถูกเปลี่ยนเป็น "เสร็จสิ้น" และระบบจะสร้างรหัสดาวน์โหลดให้ลูกค้าโดยอัตโนมัติ';
        } else if (result.value === 'cancelled') {
          warningMessage = 'สถานะการชำระเงินจะถูกเปลี่ยนเป็น "ยกเลิก" ด้วย';
        }
        
        Swal.fire({
          title: 'ยืนยันการอัพเดทสถานะ',
          text: warningMessage,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'ยืนยัน',
          cancelButtonText: 'ยกเลิก'
        }).then(confirmResult => {
          if (confirmResult.isConfirmed) {
            this.updateOrderStatus(orderId, result.value);
          }
        });
      } else {
        // สำหรับสถานะอื่นๆ ให้อัพเดทเลย
        this.updateOrderStatus(orderId, result.value);
      }
    }
  });
},

    // Add these methods to the Alpine.js component
showForgotPasswordModal() {
  this.forgotPasswordModalOpen = true;
  this.forgotPasswordEmail = '';
},

resetPassword() {
  if (!this.forgotPasswordEmail) {
    this.showAlert('warning', 'กรุณากรอกอีเมล', 'กรุณากรอกอีเมลที่ใช้ลงทะเบียน');
    return;
  }
  
  // ตรวจสอบรูปแบบอีเมล
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.forgotPasswordEmail)) {
    this.showAlert('warning', 'อีเมลไม่ถูกต้อง', 'กรุณาตรวจสอบรูปแบบอีเมล');
    return;
  }
  
  this.showLoading('กำลังดำเนินการรีเซ็ตรหัสผ่าน...');
  
  google.script.run
    .withSuccessHandler(result => {
      this.hideLoading();
      
      if (result.status === 'success') {
        this.forgotPasswordModalOpen = false;
        Swal.fire({
          icon: 'success',
          title: 'สำเร็จ!',
          text: 'รหัสผ่านใหม่ได้ถูกส่งไปยังอีเมลของคุณแล้ว กรุณาตรวจสอบกล่องข้อความในอีเมลของคุณ',
          confirmButtonText: 'ตกลง'
        });
      } else {
        this.showAlert('error', 'ข้อผิดพลาด', result.message);
      }
    })
    .withFailureHandler(error => {
      this.hideLoading();
      console.error('Error resetting password:', error);
      this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน');
    })
    .resetPassword(this.forgotPasswordEmail);
},
    
   // ฟังก์ชันสำหรับอัพเดทสถานะคำสั่งซื้อ
updateOrderStatus(orderId, status) {
  this.showLoading('กำลังอัพเดทสถานะคำสั่งซื้อ...');
  
  google.script.run
    .withSuccessHandler(result => {
      this.hideLoading();
      
      if (result.status === 'success') {
        this.loadDashboardOrders();
        this.loadDashboardPayments(); // เพิ่มบรรทัดนี้เพื่อโหลดข้อมูลการชำระเงินใหม่ด้วย
        
        let successMessage = 'อัพเดทสถานะคำสั่งซื้อสำเร็จ';
        if (status === 'completed' || status === 'cancelled') {
          successMessage += ' และอัพเดทสถานะการชำระเงินเรียบร้อยแล้ว';
        }
        
        this.showAlert('success', 'อัพเดทสำเร็จ', successMessage);
        
        // ปิด modal ถ้าเปิดอยู่
        if (this.orderDetailModalOpen) {
          this.orderDetailModalOpen = false;
        }
      } else {
        this.showAlert('error', 'ข้อผิดพลาด', result.message);
      }
    })
    .withFailureHandler(error => {
      this.hideLoading();
      console.error('Error updating order status:', error);
      this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพเดทสถานะคำสั่งซื้อ');
    })
    .updateOrderStatusJSON(orderId, status);
},
    
    // Payment management
    showPaymentDetail(paymentId) {
      this.showLoading('กำลังโหลดข้อมูลการชำระเงิน...');
      
      // Find payment
      const payment = this.payments.find(p => p.payment_id === paymentId);
      if (!payment) {
        this.hideLoading();
        this.showAlert('error', 'ข้อผิดพลาด', 'ไม่พบข้อมูลการชำระเงิน');
        return;
      }
      
      this.currentPaymentDetail = payment;
      
      // Get order details
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.paymentOrder = result.order;
            this.paymentDetailModalOpen = true;
          } else {
            this.paymentOrder = null;
            this.paymentDetailModalOpen = true;
            console.error('Error getting order details:', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          this.paymentOrder = null;
          this.paymentDetailModalOpen = true;
          console.error('Error getting order details:', error);
        })
        .getOrderJSON(payment.order_id);
    },

    // เพิ่มฟังก์ชันสำหรับปฏิเสธการชำระเงิน
rejectPayment(paymentId) {
  // เปิด modal ให้กรอกเหตุผล
  Swal.fire({
    title: 'ปฏิเสธการชำระเงิน',
    text: 'กรุณาระบุเหตุผลในการปฏิเสธการชำระเงินนี้',
    input: 'textarea',
    inputPlaceholder: 'เช่น ยอดเงินไม่ถูกต้อง, ชำระเงินไม่ครบ, ไม่พบข้อมูลการโอนเงิน',
    inputAttributes: {
      'aria-label': 'เหตุผลในการปฏิเสธการชำระเงิน'
    },
    showCancelButton: true,
    confirmButtonText: 'ปฏิเสธการชำระเงิน',
    cancelButtonText: 'ยกเลิก',
    confirmButtonColor: '#ef4444',
    inputValidator: (value) => {
      if (!value) {
        return 'กรุณาระบุเหตุผลในการปฏิเสธการชำระเงิน';
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      this.showLoading('กำลังปฏิเสธการชำระเงิน...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.paymentDetailModalOpen = false;
            this.loadDashboardPayments();
            this.loadDashboardOrders();
            this.showAlert('success', 'ปฏิเสธการชำระเงินสำเร็จ', 'ระบบได้ส่งอีเมลแจ้งลูกค้าแล้ว');
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error rejecting payment:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการปฏิเสธการชำระเงิน');
        })
        .rejectPaymentJSON(paymentId, result.value);
    }
  });
},
    
  // ปรับปรุงฟังก์ชัน approvePayment
approvePayment(paymentId) {
  // เช็คว่าจำนวนเงินที่ชำระถูกต้องหรือไม่
  const payment = this.payments.find(p => p.payment_id === paymentId);
  const order = this.paymentOrder;
  
  if (payment && order) {
    const paymentAmount = parseFloat(payment.amount);
    const orderAmount = parseFloat(order.total_amount);
    
    // ถ้ายอดเงินไม่ตรงกัน (ให้โอเวอร์เพย์ได้แต่ไม่ให้จ่ายน้อยกว่า)
    if (paymentAmount < orderAmount) {
      // แสดงแจ้งเตือนและให้เลือกว่าจะดำเนินการต่อหรือไม่
      Swal.fire({
        title: 'ยอดเงินไม่ตรงกัน',
        html: `<div class="text-left">
          <p>ยอดคำสั่งซื้อ: <span class="font-bold text-green-600">฿${orderAmount.toFixed(2)}</span></p>
          <p>ยอดที่ชำระ: <span class="font-bold text-red-600">฿${paymentAmount.toFixed(2)}</span></p>
          <p>ชำระขาด: <span class="font-bold text-red-600">฿${(orderAmount - paymentAmount).toFixed(2)}</span></p>
          <hr class="my-2">
          <p class="font-medium">คุณต้องการดำเนินการอย่างไร?</p>
        </div>`,
        icon: 'warning',
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: 'ปฏิเสธการชำระเงิน',
        denyButtonText: 'ยืนยันการชำระเงิน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444',
        denyButtonColor: '#3b82f6'
      }).then((result) => {
        if (result.isConfirmed) {
          // ปฏิเสธการชำระเงิน
          this.rejectPayment(paymentId);
        } else if (result.isDenied) {
          // ยืนยันการชำระเงินถึงแม้ว่าจำนวนเงินจะไม่ตรงกัน
          this.confirmApprovePayment(paymentId);
        }
      });
    } else if (paymentAmount > orderAmount) {
      // กรณีชำระเกิน
      Swal.fire({
        title: 'ยอดเงินไม่ตรงกัน',
        html: `<div class="text-left">
          <p>ยอดคำสั่งซื้อ: <span class="font-bold text-green-600">฿${orderAmount.toFixed(2)}</span></p>
          <p>ยอดที่ชำระ: <span class="font-bold text-blue-600">฿${paymentAmount.toFixed(2)}</span></p>
          <p>ชำระเกิน: <span class="font-bold text-blue-600">฿${(paymentAmount - orderAmount).toFixed(2)}</span></p>
          <hr class="my-2">
          <p class="font-medium">ลูกค้าชำระเงินเกินจำนวน แต่สามารถดำเนินการต่อได้</p>
        </div>`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'ยืนยันการชำระเงิน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#3b82f6'
      }).then((result) => {
        if (result.isConfirmed) {
          this.confirmApprovePayment(paymentId);
        }
      });
    } else {
      // ยอดตรงกัน
      this.confirmApprovePayment(paymentId);
    }
  } else {
    // ถ้าไม่พบข้อมูลคำสั่งซื้อหรือการชำระเงิน
    this.confirmApprovePayment(paymentId);
  }
},

confirmApprovePayment(paymentId) {
  Swal.fire({
    title: 'ยืนยันการชำระเงิน',
    text: 'คุณต้องการยืนยันการชำระเงินนี้หรือไม่? ระบบจะสร้างรหัสดาวน์โหลดให้กับลูกค้าโดยอัตโนมัติ',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'ยืนยัน',
    cancelButtonText: 'ยกเลิก'
  }).then(result => {
    if (result.isConfirmed) {
      this.showLoading('กำลังยืนยันการชำระเงิน...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.paymentDetailModalOpen = false;
            this.loadDashboardPayments();
            this.loadDashboardOrders();
            this.showAlert('success', 'ยืนยันการชำระเงินสำเร็จ', 'ระบบได้สร้างรหัสดาวน์โหลดและส่งอีเมลแจ้งลูกค้าแล้ว');
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error approving payment:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการยืนยันการชำระเงิน');
        })
        .updatePaymentStatusJSON(paymentId, 'completed');
    }
  });
},
    
    saveUser() {
      if (!this.userForm.name || !this.userForm.email) {
        this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกชื่อและอีเมล');
        return;
      }
      
      if (!this.editingUser && !this.userForm.password) {
        this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอกรหัสผ่าน');
        return;
      }
      
      this.showLoading('กำลังบันทึกผู้ใช้...');
      
      if (this.editingUser) {
        google.script.run
          .withSuccessHandler(result => {
            this.hideLoading();
            
            if (result.status === 'success') {
              this.userModalOpen = false;
              this.loadDashboardUsers();
              this.showAlert('success', 'บันทึกผู้ใช้สำเร็จ');
            } else {
              this.showAlert('error', 'ข้อผิดพลาด', result.message);
            }
          })
          .withFailureHandler(error => {
            this.hideLoading();
            console.error('Error updating user:', error);
            this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพเดทผู้ใช้');
          })
          .updateUser(this.userForm.user_id, this.userForm);
      } else {
        google.script.run
          .withSuccessHandler(result => {
            this.hideLoading();
            
            if (result.status === 'success') {
              this.userModalOpen = false;
              this.loadDashboardUsers();
              this.showAlert('success', 'สร้างผู้ใช้สำเร็จ');
            } else {
              this.showAlert('error', 'ข้อผิดพลาด', result.message);
            }
          })
          .withFailureHandler(error => {
            this.hideLoading();
            console.error('Error creating user:', error);
            this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสร้างผู้ใช้');
          })
          .createUser(this.userForm);
      }
    },
    
    deleteUser(userId) {
      Swal.fire({
        title: 'ยืนยันการลบ',
        text: 'คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
      }).then(result => {
        if (result.isConfirmed) {
          this.showLoading('กำลังลบผู้ใช้...');
          
          google.script.run
            .withSuccessHandler(result => {
              this.hideLoading();
              
              if (result.status === 'success') {
                this.loadDashboardUsers();
                this.showAlert('success', 'ลบผู้ใช้สำเร็จ');
              } else {
                this.showAlert('error', 'ข้อผิดพลาด', result.message);
              }
            })
            .withFailureHandler(error => {
              this.hideLoading();
              console.error('Error deleting user:', error);
              this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการลบผู้ใช้');
            })
            .deleteUser(userId);
        }
      });
    },
    
    // Settings
    saveSettings() {
      this.showLoading('กำลังบันทึกการตั้งค่า...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.storeConfig = result.config;
            this.showAlert('success', 'บันทึกการตั้งค่าสำเร็จ');
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error saving settings:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการบันทึกการตั้งค่า');
        })
        .saveConfigJSON(this.configData);
    },
    
    uploadStoreLogo() {
      // เปิด file input dialog
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        this.showLoading('กำลังอัพโหลดโลโก้...');
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target.result;
          
         // ส่งไฟล์ไปยังเซิร์ฟเวอร์
          google.script.run
            .withSuccessHandler(result => {
              this.hideLoading();
              
              if (result.status === 'success') {
                this.configData.store_logo = result.url;
                this.showAlert('success', 'อัพโหลดโลโก้สำเร็จ');
              } else {
                this.configData.store_logo = '';
                this.showAlert('error', 'ข้อผิดพลาด', result.message);
              }
            })
            .withFailureHandler(error => {
              this.hideLoading();
              console.error('Error uploading logo:', error);
              this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพโหลดโลโก้');
            })
            .saveBase64AsFile(base64Data, file.name, 'store_logo');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
    
    // เพิ่มฟังก์ชันสำหรับอัพโหลด QR Code การชำระเงิน
    uploadPaymentQRCode() {
      // เปิด file input dialog
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        this.showLoading('กำลังอัพโหลด QR Code...');
        
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Data = event.target.result;
          
          // ส่งไฟล์ไปยังเซิร์ฟเวอร์
          google.script.run
            .withSuccessHandler(result => {
              this.hideLoading();
              
              if (result.status === 'success') {
                this.configData.payment_qrcode = result.url;
                this.showAlert('success', 'อัพโหลด QR Code สำเร็จ');
              } else {
                this.configData.payment_qrcode = '';
                this.showAlert('error', 'ข้อผิดพลาด', result.message);
              }
            })
            .withFailureHandler(error => {
              this.hideLoading();
              console.error('Error uploading QR Code:', error);
              this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการอัพโหลด QR Code');
            })
            .saveBase64AsFile(base64Data, file.name, 'payment_qrcode');
        };
        reader.readAsDataURL(file);
      };
      input.click();
    },
    
    // เพิ่มฟังก์ชันแสดง QR Code ขนาดใหญ่
    showLargeQRCode() {
      if (!this.storeConfig.payment_qrcode) return;
      
      Swal.fire({
        imageUrl: this.storeConfig.payment_qrcode,
        imageAlt: 'QR Code ชำระเงิน',
        imageWidth: 'auto',
        imageHeight: 'auto',
        title: 'QR Code สำหรับชำระเงิน',
        html: `<p class="text-center text-gray-600 mt-2">จำนวนเงิน: ฿${this.calculateTotal().toFixed(2)}</p>
               <p class="text-center text-gray-600">รหัสคำสั่งซื้อ: ${this.currentOrderId}</p>`,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          image: 'max-w-full max-h-[70vh]'
        }
      });
    },
    
    // เพิ่มฟังก์ชันสำหรับแสดงตัวอย่าง QR Code ในหน้าตั้งค่า
    previewQRCode(imageUrl) {
      if (!imageUrl) return;
      
      Swal.fire({
        imageUrl: imageUrl,
        imageAlt: 'ตัวอย่าง QR Code',
        imageWidth: 'auto',
        imageHeight: 'auto',
        title: 'ตัวอย่าง QR Code สำหรับชำระเงิน',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          image: 'max-w-full max-h-[70vh]'
        }
      });
    },
    
    // เพิ่มฟังก์ชันสำหรับแสดงรูปสลิปการโอนเงินแบบเต็มจอ
    previewSlipImage(imageUrl) {
      if (!imageUrl) return;
      
      Swal.fire({
        imageUrl: imageUrl,
        imageAlt: 'สลิปการโอนเงิน',
        imageWidth: 'auto',
        imageHeight: 'auto',
        title: 'หลักฐานการชำระเงิน',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          image: 'max-w-full max-h-[70vh]'
        }
      });
    },
    
    // เพิ่มฟังก์ชันสำหรับแสดงรูปสินค้าแบบเต็มจอ 
    previewProductImage(imageUrl) {
      if (!imageUrl) return;
      
      Swal.fire({
        imageUrl: imageUrl,
        imageAlt: 'รูปภาพสินค้า',
        imageWidth: 'auto',
        imageHeight: 'auto',
        title: this.currentProduct?.name || 'รูปภาพสินค้า',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          image: 'max-w-full max-h-[80vh]'
        }
      });
    },
    
    // เพิ่มฟังก์ชันสำหรับจัดการรายละเอียดสินค้า
    formatDescription(description) {
      if (!description) return '';
      
      // แปลง URLs เป็น links ที่คลิกได้
      description = description.replace(
        /(https?:\/\/[^\s]+)/g, 
        '<a href="$1" target="_blank" class="text-primary-600 hover:underline">$1</a>'
      );
      
      // แปลงหัวข้อใน format ต่างๆ
      description = description.replace(
        /^(#{1,3})\s+(.+)$/gm,
        (match, hashes, text) => {
          const size = hashes.length === 1 ? 'text-xl font-bold' : 
                     hashes.length === 2 ? 'text-lg font-bold' : 
                     'text-base font-semibold';
          return `<div class="${size} text-gray-800 my-2">${text}</div>`;
        }
      );
      
      // แปลงรายการแบบ bullet
      description = description.replace(
        /^\*\s+(.+)$/gm,
        '<li class="ml-4">• $1</li>'
      );
      
      // รวม bullet points เป็น lists
      description = description.replace(
        /(<li class="ml-4">.*<\/li>\n?)+/g,
        '<ul class="my-2">$&</ul>'
      );
      
      // เพิ่ม highlight สำหรับข้อความสำคัญใน ** **
      description = description.replace(
        /\*\*(.*?)\*\*/g,
        '<span class="font-bold text-primary-700">$1</span>'
      );
      
      return description;
    },
    
    testTelegramNotification() {
      if (!this.configData.telegram_bot_token || !this.configData.telegram_chat_id) {
        this.showAlert('warning', 'ข้อมูลไม่ครบถ้วน', 'กรุณากรอก Telegram Bot Token และ Chat ID');
        return;
      }
      
      this.showLoading('กำลังทดสอบการแจ้งเตือน...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.showAlert('success', 'ทดสอบสำเร็จ', 'การแจ้งเตือนผ่าน Telegram ทำงานได้ปกติ');
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error testing Telegram notification:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการทดสอบการแจ้งเตือน');
        })
        .setupTelegramBot(this.configData.telegram_bot_token, this.configData.telegram_chat_id);
    },
    
    // Utility functions
    showAlert(icon, title, text) {
      Swal.fire({
        icon,
        title,
        text,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    },
    
    showLoading(text) {
      Swal.fire({
        title: text,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
    },
    
    hideLoading() {
      Swal.close();
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // เพิ่มฟังก์ชันนี้ใน javascript.js
testSetupSystem() {
  this.showLoading('กำลังตั้งค่าระบบ...');
  
  google.script.run
    .withSuccessHandler(result => {
      this.hideLoading();
      console.log('Setup result:', result);
      this.showAlert('success', 'ตั้งค่าระบบสำเร็จ', result.message || 'ระบบพร้อมใช้งาน');
      // โหลดข้อมูลใหม่หลังจากตั้งค่า
      this.loadCoupons();
    })
    .withFailureHandler(error => {
      this.hideLoading();
      console.error('Setup error:', error);
      this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการตั้งค่าระบบ');
    })
    .setupSystem();
},

   // ฟังก์ชันสำหรับยกเลิกการชำระเงิน
cancelPayment(paymentId) {
  Swal.fire({
    title: 'ยกเลิกการชำระเงิน',
    text: 'คุณต้องการยกเลิกการชำระเงินนี้หรือไม่? สถานะคำสั่งซื้อจะถูกเปลี่ยนเป็น "ยกเลิก" ด้วย',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'ยกเลิกการชำระเงิน',
    cancelButtonText: 'ไม่ใช่',
    confirmButtonColor: '#ef4444'
  }).then(result => {
    if (result.isConfirmed) {
      this.showLoading('กำลังยกเลิกการชำระเงิน...');
      
      google.script.run
        .withSuccessHandler(result => {
          this.hideLoading();
          
          if (result.status === 'success') {
            this.paymentDetailModalOpen = false;
            this.loadDashboardPayments();
            this.loadDashboardOrders();
            this.showAlert('success', 'ยกเลิกการชำระเงินสำเร็จ', 'สถานะคำสั่งซื้อถูกเปลี่ยนเป็นยกเลิกแล้ว');
          } else {
            this.showAlert('error', 'ข้อผิดพลาด', result.message);
          }
        })
        .withFailureHandler(error => {
          this.hideLoading();
          console.error('Error canceling payment:', error);
          this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการยกเลิกการชำระเงิน');
        })
        .updatePaymentStatusJSON(paymentId, 'cancelled');
    }
  });
},
    
   getStatusText(status) {
  switch (status) {
    case 'active': return 'ใช้งาน';
    case 'inactive': return 'ปิดใช้งาน';
    case 'pending': return 'รอดำเนินการ';
    case 'processing': return 'กำลังดำเนินการ';
    case 'completed': return 'เสร็จสิ้น';
    case 'cancelled': return 'ยกเลิก';
    case 'rejected': return 'ปฏิเสธ';
    default: return status;
  }
},
    
    getRoleText(role) {
      switch (role) {
        case 'admin': return 'ผู้ดูแลระบบ';
        case 'staff': return 'เจ้าหน้าที่';
        case 'user': return 'ผู้ใช้ทั่วไป';
        case 'customer': return 'ลูกค้า';
        default: return role;
      }
    },
    
    getDownloadStatus(download) {
      if (download.status !== 'active') {
        return 'ปิดใช้งาน';
      } else {
        return 'ใช้งานได้ (ไม่จำกัด)';
      }
    }
  }));
});
</script>
