  <script>
// customer-system.js
document.addEventListener('alpine:init', () => {
  Alpine.data('customerSystem', () => ({
    // ===== State =====
    customerInfo: {
      name: '',
      email: '',
      phone: '',
      register: false,
      password: '',
      confirmPassword: ''
    },
    showPassword: false,
    showConfirmPassword: false,
    
    // Customer Dashboard state
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
    
    // Profile form
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
    
    // ===== Computed =====
    get isPasswordValid() {
      return this.customerInfo.password.length >= 6;
    },
    
    get doPasswordsMatch() {
      return this.customerInfo.password === this.customerInfo.confirmPassword;
    },
    
    get canRegister() {
      if (!this.customerInfo.register) return true;
      return this.isPasswordValid && this.doPasswordsMatch;
    },
    
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
    
    // ===== Methods =====
    resetCustomerForm() {
      this.customerInfo = {
        name: '',
        email: '',
        phone: '',
        register: false,
        password: '',
        confirmPassword: ''
      };
      this.showPassword = false;
      this.showConfirmPassword = false;
    },
    
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
        if (!this.isPasswordValid) {
          this.showAlert('warning', 'รหัสผ่านไม่ถูกต้อง', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
          return false;
        }
        
        if (!this.doPasswordsMatch) {
          this.showAlert('warning', 'รหัสผ่านไม่ตรงกัน', 'กรุณายืนยันรหัสผ่านให้ตรงกัน');
          return false;
        }
      }
      
      return true;
    },
    
    createCustomer() {
      if (!this.validateCustomerInfo()) {
        return false;
      }
      
      // ถ้าเลือกสมัครสมาชิก
      if (this.customerInfo.register) {
        this.showLoading('กำลังสมัครสมาชิก...');
        
        // ลบข้อมูลที่ไม่จำเป็นต้องส่งไปยัง API
        const customerData = {
          name: this.customerInfo.name,
          email: this.customerInfo.email,
          phone: this.customerInfo.phone,
          password: this.customerInfo.password,
          role: 'customer', // กำหนดให้เป็นสมาชิกลูกค้า
          status: 'active'
        };
        
        // สร้างผู้ใช้ใหม่และล็อกอินอัตโนมัติ
        return google.script.run
          .withSuccessHandler(result => {
            this.hideLoading();
            
            if (result.status === 'success') {
              this.currentUser = result.user;
              this.sessionId = result.session?.id;
              
              if (this.sessionId) {
                localStorage.setItem('digitalStoreSession', this.sessionId);
              }
              
              this.showAlert('success', 'สมัครสมาชิกสำเร็จ', 'บัญชีของคุณถูกสร้างเรียบร้อยแล้ว');
              return true;
            } else {
              this.showAlert('error', 'ข้อผิดพลาด', result.message || 'ไม่สามารถสมัครสมาชิกได้');
              return false;
            }
          })
          .withFailureHandler(error => {
            this.hideLoading();
            console.error('Error creating customer:', error);
            this.showAlert('error', 'ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
            return false;
          })
          .createCustomer(customerData);
      }
      
      // ถ้าไม่เลือกสมัครสมาชิก
      return true;
    },
    
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
    
    // นำฟังก์ชันสำหรับแสดงการแจ้งเตือน
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
    
    getStatusText(status) {
      switch (status) {
        case 'active': return 'ใช้งาน';
        case 'inactive': return 'ปิดใช้งาน';
        case 'pending': return 'รอดำเนินการ';
        case 'processing': return 'กำลังดำเนินการ';
        case 'completed': return 'เสร็จสิ้น';
        case 'cancelled': return 'ยกเลิก';
        default: return status;
      }
    }
  }));
});
      </script>
