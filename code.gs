// ===== ค่าคงที่ของระบบ =====
var SPREADSHEET_ID = '1PR2kFLVf2a5nSOGBlOf4d0GI7YxlUok4QUfdKQTPt8U';
var DRIVE_FOLDER_ID = '1RPXxPzcAJBCE0TPl8fBUZtbCnCo6k5kr';
var SLIP_FOLDER_ID = '1safnKz1TLAJvYGqlMUn7G8t2M9yXnZL-'; // โฟลเดอร์สำหรับเก็บสลิป
var PRODUCT_IMAGE_FOLDER_ID = '1RPXxPzcAJBCE0TPl8fBUZtbCnCo6k5kr'; // โฟลเดอร์สำหรับเก็บรูปภาพสินค้า (จะถูกสร้างโดยอัตโนมัติหากยังไม่มี)
var PRODUCT_FILE_FOLDER_ID = '1RPXxPzcAJBCE0TPl8fBUZtbCnCo6k5kr'; // โฟลเดอร์สำหรับเก็บไฟล์สินค้า (จะถูกสร้างโดยอัตโนมัติหากยังไม่มี)
var ADMIN_EMAIL = 'naiyachonponthong@gmail.com';
var STORE_EMAIL = 'naiyachonponthong@gmail.com';

// ===== ฟังก์ชันหลักของระบบ =====

/**
 * ฟังก์ชันเริ่มต้นเมื่อเปิดเอกสาร Google Sheets
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('ร้านค้าดิจิทัล')
    .addItem('เปิดร้านค้า', 'openStore')
    .addItem('ตั้งค่าระบบ', 'setupSystem')
    .addToUi();
}

/**
 * ฟังก์ชันสำหรับเปิดหน้าร้านค้า
 */
function openStore() {
  var html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('ร้านค้าดิจิทัลออนไลน์')
    .setWidth(1200)
    .setHeight(800);
  
  SpreadsheetApp.getUi().showModalDialog(html, 'ร้านค้าดิจิทัลออนไลน์');
}

/**
 * ฟังก์ชันสำหรับรวมไฟล์ HTML, CSS, JavaScript เข้าด้วยกัน
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * ฟังก์ชันที่เรียกเมื่อเปิดเว็บแอป
 * รองรับการส่งพารามิเตอร์ token เพื่อดาวน์โหลดไฟล์โดยตรง
 */
function doGet(e) {
  // ตรวจสอบว่ามีการส่ง token มาหรือไม่
  if (e && e.parameter && e.parameter.token) {
    // ถ้ามี token ให้ลองดาวน์โหลดไฟล์
    var token = e.parameter.token;
    var result = downloadFile(token);
    
    // ดึงข้อมูล download เพื่อแสดงรายละเอียด
    var downloadInfo = null;
    var productName = "ไฟล์ดิจิทัล";
    
    try {
      var downloadsData = getDownloadsJSON();
      if (downloadsData.status === 'success') {
        var download = downloadsData.downloads.find(d => d.token === token);
        if (download) {
          downloadInfo = download;
          // ดึงชื่อสินค้า
          var productData = getProductJSON(download.product_id);
          if (productData.status === 'success') {
            productName = productData.product.name;
          }
        }
      }
    } catch (error) {
      console.error("Error getting download info:", error);
    }
    
    // ดึงการตั้งค่าร้านค้า
    var storeConfig = { store_name: "ร้านค้าดิจิทัล", store_logo: "" };
    try {
      var configData = getConfigJSON();
      if (configData.status === 'success') {
        storeConfig = configData.config;
      }
    } catch (error) {
      console.error("Error getting store config:", error);
    }
    
    if (result.status === 'success') {
      // สร้างหน้าดาวน์โหลดที่สวยงาม
      var html = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ดาวน์โหลดสินค้า - ${storeConfig.store_name}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            font-family: 'Sarabun', sans-serif;
            background-color: #f5f7fa;
          }
          .download-container {
            max-width: 600px;
            margin: 50px auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 30px;
          }
          .progress-container {
            margin: 20px 0;
            position: relative;
          }
          .progress-bar {
            height: 10px;
            background-color: #3b82f6;
            border-radius: 5px;
            width: 0%;
            transition: width 3s ease;
          }
          .info-box {
            background-color: #f0f7ff;
            border-left: 5px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
          }
        </style>
      </head>
      <body>
        <div class="download-container">
          <div class="header">
            <h1 class="text-2xl font-bold">ดาวน์โหลดสินค้า</h1>
            ${storeConfig.store_logo ? `<img src="${storeConfig.store_logo}" alt="${storeConfig.store_name}" class="h-10 mx-auto mt-3">` : ''}
          </div>
          
          <div class="content">
            <div class="text-center mb-5">
              <div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-blue-100 text-blue-600 mb-4">
                <i class="fas fa-download text-3xl"></i>
              </div>
              <h2 class="text-xl font-bold text-gray-800">${productName}</h2>
              <p class="text-sm text-gray-600">ไฟล์ของคุณกำลังเตรียมการดาวน์โหลด...</p>
            </div>
            
            <div class="progress-container">
              <div class="progress-bar" id="progressBar"></div>
            </div>
            
            <div class="info-box" id="downloadInfo">
              <p class="text-sm font-medium text-blue-800 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                ระบบกำลังเตรียมไฟล์ให้คุณ กรุณารอสักครู่...
              </p>
            </div>
            
            <div class="mt-6 text-center" id="redirectInfo" style="display: none;">
              <p class="text-sm text-gray-600 mb-2">หากไม่เริ่มดาวน์โหลดอัตโนมัติ</p>
              <a href="${result.url}" class="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-base font-medium transition-colors">
                <i class="fas fa-download mr-2"></i> คลิกที่นี่เพื่อดาวน์โหลด
              </a>
            </div>
          </div>
          
          <div class="text-center p-4 bg-gray-50 text-sm text-gray-500">
            &copy; ${new Date().getFullYear()} ${storeConfig.store_name} - ขอบคุณที่ใช้บริการ
          </div>
        </div>
        
        <script>
          // ทำการเติมแถบความคืบหน้า
          var progressBar = document.getElementById('progressBar');
          var infoBox = document.getElementById('downloadInfo');
          var redirectInfo = document.getElementById('redirectInfo');
          
          setTimeout(function() {
            progressBar.style.width = '50%';
          }, 300);
          
          setTimeout(function() {
            progressBar.style.width = '90%';
            infoBox.innerHTML = '<p class="text-sm font-medium text-blue-800 flex items-center"><i class="fas fa-check-circle mr-2"></i>ระบบได้เตรียมไฟล์เรียบร้อยแล้ว กำลังเริ่มดาวน์โหลด...</p>';
          }, 1500);
          
          setTimeout(function() {
            progressBar.style.width = '100%';
            redirectInfo.style.display = 'block';
            window.location.href = "${result.url}";
          }, 2500);
        </script>
      </body>
      </html>
      `;
      
      return HtmlService.createHtmlOutput(html);
    } else {
      // แสดงข้อความผิดพลาดแบบสวยงาม
      return HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ไม่สามารถดาวน์โหลดได้ - ${storeConfig.store_name}</title>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css">
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            font-family: 'Sarabun', sans-serif;
            background-color: #f5f7fa;
          }
          .error-container {
            max-width: 600px;
            margin: 50px auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background-color: #ef4444;
            color: white;
            padding: 20px;
            text-align: center;
          }
          .content {
            padding: 30px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="header">
            <h1 class="text-2xl font-bold">ไม่สามารถดาวน์โหลดได้</h1>
          </div>
          
          <div class="content">
            <div class="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-100 text-red-600 mb-4">
              <i class="fas fa-exclamation-triangle text-3xl"></i>
            </div>
            
            <h2 class="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p class="text-gray-600 mb-6">${result.message}</p>
            
            <div class="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-left mb-6">
              <p class="text-sm text-yellow-800">
                <strong>หมายเหตุ:</strong> สาเหตุอาจเกิดจาก
                <ul class="list-disc ml-5 mt-2">
  <li>รหัสดาวน์โหลดหมดอายุ</li>
  <li>ใช้ดาวน์โหลดครบจำนวนครั้งที่กำหนดแล้ว</li>
  <li>รหัสดาวน์โหลดไม่ถูกต้อง</li>
  <li>ไฟล์ถูกลบออกจากระบบแล้ว</li>
</ul>
              </p>
            </div>
            
            <a href="${webAppUrl}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-base font-medium transition-colors">
              <i class="fas fa-home mr-2"></i> กลับหน้าหลัก
            </a>
          </div>
          
          <div class="text-center p-4 bg-gray-50 text-sm text-gray-500">
            &copy; ${new Date().getFullYear()} ${storeConfig.store_name} - ขอบคุณที่ใช้บริการ
          </div>
        </div>
      </body>
      </html>
      `);
    }
  }
  
  // ถ้าไม่มี token ให้แสดงหน้าร้านค้าตามปกติ
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('ร้านค้าดิจิทัลออนไลน์')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * สร้างโฟลเดอร์สำหรับเก็บสลิป
 */
function setupSlipFolder() {
  try {
    // ตรวจสอบว่าโฟลเดอร์มีอยู่แล้วหรือไม่
    var folder;
    try {
      folder = DriveApp.getFolderById(SLIP_FOLDER_ID);
    } catch (e) {
      // ถ้าไม่มีโฟลเดอร์ ให้สร้างใหม่
      folder = DriveApp.createFolder('Digital Store Slips');
      SLIP_FOLDER_ID = folder.getId();
      
      // อัพเดทค่า SLIP_FOLDER_ID ในการตั้งค่า
      var configData = getConfigJSON();
      if (configData.status === 'success') {
        var config = configData.config;
        config.slip_folder_id = SLIP_FOLDER_ID;
        saveConfigJSON(config);
      }
    }
    return folder;
  } catch (error) {
    logError('setupSlipFolder', error);
    return null;
  }
}

/**
 * สร้างโฟลเดอร์สำหรับเก็บรูปภาพสินค้า
 */
function setupProductImageFolder() {
  try {
    // ตรวจสอบว่าโฟลเดอร์มีอยู่แล้วหรือไม่
    var folder;
    try {
      if (PRODUCT_IMAGE_FOLDER_ID) {
        folder = DriveApp.getFolderById(PRODUCT_IMAGE_FOLDER_ID);
      } else {
        throw new Error("ไม่พบ PRODUCT_IMAGE_FOLDER_ID");
      }
    } catch (e) {
      // ถ้าไม่มีโฟลเดอร์ ให้สร้างใหม่
      var parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      folder = parentFolder.createFolder('Product Images');
      PRODUCT_IMAGE_FOLDER_ID = folder.getId();
    }
    return folder;
  } catch (error) {
    logError('setupProductImageFolder', error);
    // ถ้ายังไม่มีโฟลเดอร์หลัก ให้สร้างใหม่
    var mainFolder = DriveApp.createFolder('DigitalStore');
    DRIVE_FOLDER_ID = mainFolder.getId();
    
    folder = mainFolder.createFolder('Product Images');
    PRODUCT_IMAGE_FOLDER_ID = folder.getId();
    
    return folder;
  }
}

/**
 * สร้างโฟลเดอร์สำหรับเก็บไฟล์สินค้า
 */
function setupProductFileFolder() {
  try {
    // ตรวจสอบว่าโฟลเดอร์มีอยู่แล้วหรือไม่
    var folder;
    try {
      if (PRODUCT_FILE_FOLDER_ID) {
        folder = DriveApp.getFolderById(PRODUCT_FILE_FOLDER_ID);
      } else {
        throw new Error("ไม่พบ PRODUCT_FILE_FOLDER_ID");
      }
    } catch (e) {
      // ถ้าไม่มีโฟลเดอร์ ให้สร้างใหม่
      var parentFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      folder = parentFolder.createFolder('Product Files');
      PRODUCT_FILE_FOLDER_ID = folder.getId();
    }
    return folder;
  } catch (error) {
    logError('setupProductFileFolder', error);
    // ถ้ายังไม่มีโฟลเดอร์หลัก ให้สร้างใหม่
    var mainFolder = DriveApp.createFolder('DigitalStore');
    DRIVE_FOLDER_ID = mainFolder.getId();
    
    folder = mainFolder.createFolder('Product Files');
    PRODUCT_FILE_FOLDER_ID = folder.getId();
    
    return folder;
  }
}

/**
 * ฟังก์ชันสำหรับตั้งค่าระบบ
 */
function setupSystem() {
  try {
    // ตั้งค่า sheets
    setupSheets();
    
    // ตั้งค่าโฟลเดอร์ใน Drive
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    if (!folder) {
      folder = DriveApp.createFolder('DigitalStore');
      DRIVE_FOLDER_ID = folder.getId();
    }
    
    // ตั้งค่าโฟลเดอร์สำหรับเก็บสลิป
    setupSlipFolder();
    
    // ตั้งค่าโฟลเดอร์สำหรับเก็บรูปภาพสินค้า
    setupProductImageFolder();
    
    // ตั้งค่าโฟลเดอร์สำหรับเก็บไฟล์สินค้า
    setupProductFileFolder();
    
    return {
      status: 'success',
      message: 'ตั้งค่าระบบเรียบร้อยแล้ว'
    };
  } catch (error) {
    logError('setupSystem', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการตั้งค่าระบบ: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับการตั้งค่า sheets ใหม่ในระบบ
 */
function setupSheets() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheets = ss.getSheets();
  var sheetNames = sheets.map(function(sheet) {
    return sheet.getName();
  });

  // สร้าง sheet Config ถ้ายังไม่มี
if (sheetNames.indexOf('Config') === -1) {
  var configSheet = ss.insertSheet('Config');
  configSheet.appendRow(['config_json']);
  configSheet.appendRow([JSON.stringify({
    store_name: 'ร้านค้าดิจิทัลออนไลน์',
    store_logo: '',
    store_description: 'ร้านค้าดิจิทัลออนไลน์ครบวงจร',
    prompt_pay_id: '',
    payment_qrcode: '',
    bank_account_info: '',
    welcome_message: 'ยินดีต้อนรับสู่ร้านค้าดิจิทัลออนไลน์',
    announcement: '',
    banner_image: '',
    telegram_bot_token: '',
    telegram_chat_id: '',
    slip_folder_id: SLIP_FOLDER_ID || '',
    product_image_folder_id: PRODUCT_IMAGE_FOLDER_ID || '',
    product_file_folder_id: PRODUCT_FILE_FOLDER_ID || '',
    download_expire_days: 7,
    max_downloads: 3
  })]);
}

  // สร้าง sheet Users ถ้ายังไม่มี
  if (sheetNames.indexOf('Users') === -1) {
    var usersSheet = ss.insertSheet('Users');
    usersSheet.appendRow(['user_json']);
    
    // สร้างผู้ใช้ admin คนแรก
    var adminUser = {
      user_id: Utilities.getUuid(),
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: hashPassword('admin123'),
      role: 'admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };
    
    usersSheet.appendRow([JSON.stringify(adminUser)]);
  }

  // สร้าง sheet Products ถ้ายังไม่มี
  if (sheetNames.indexOf('Products') === -1) {
    var productsSheet = ss.insertSheet('Products');
    productsSheet.appendRow(['product_json']);
  }

  // สร้าง sheet Orders ถ้ายังไม่มี
  if (sheetNames.indexOf('Orders') === -1) {
    var ordersSheet = ss.insertSheet('Orders');
    ordersSheet.appendRow(['order_json']);
  }

  // สร้าง sheet Payments ถ้ายังไม่มี
  if (sheetNames.indexOf('Payments') === -1) {
    var paymentsSheet = ss.insertSheet('Payments');
    paymentsSheet.appendRow(['payment_json']);
  }

  // สร้าง sheet Downloads ถ้ายังไม่มี
  if (sheetNames.indexOf('Downloads') === -1) {
    var downloadsSheet = ss.insertSheet('Downloads');
    downloadsSheet.appendRow(['download_json']);
  }

  // สร้าง sheet Errors ถ้ายังไม่มี
  if (sheetNames.indexOf('Errors') === -1) {
    var errorsSheet = ss.insertSheet('Errors');
    errorsSheet.appendRow(['error_json']);
  }
  
  return {
    status: 'success',
    message: 'สร้าง sheets ทั้งหมดเรียบร้อยแล้ว'
  };
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อผิดพลาด
 */
function logError(functionName, error) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Errors');
    
    var errorObj = {
      timestamp: new Date().toISOString(),
      function: functionName,
      message: error.message,
      stack: error.stack,
      additional_info: {}
    };
    
    sheet.appendRow([JSON.stringify(errorObj)]);
  } catch (e) {
    console.error('ไม่สามารถบันทึกข้อผิดพลาดได้: ' + e.message);
  }
}

// ===== ฟังก์ชันการจัดการผู้ใช้ =====

/**
 * ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่
 */
function createUser(userData) {
  try {
    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    var existingUser = getUserByEmail(userData.email);
    if (existingUser) {
      return {
        status: 'error',
        message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
      };
    }
    
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    
    var newUser = {
      user_id: Utilities.getUuid(),
      name: userData.name,
      email: userData.email,
      password: hashPassword(userData.password),
      role: userData.role || 'user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };
    
    sheet.appendRow([JSON.stringify(newUser)]);
    
    // ไม่ส่งรหัสผ่านกลับไป
    delete newUser.password;
    
    return {
      status: 'success',
      message: 'สร้างผู้ใช้เรียบร้อยแล้ว',
      user: newUser
    };
  } catch (error) {
    logError('createUser', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการสร้างผู้ใช้: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับค้นหาผู้ใช้ด้วยอีเมล
 */
function getUserByEmail(email) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var user = JSON.parse(data[i][0]);
      
      if (user.email === email) {
        return user;
      }
    }
    
    return null;
  } catch (error) {
    logError('getUserByEmail', error);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับเข้ารหัสรหัสผ่าน
 */
function hashPassword(password) {
  var salt = 'digitalstore2025';
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password);
  return Utilities.base64Encode(digest);
}

/**
 * ฟังก์ชันสำหรับตรวจสอบรหัสผ่าน
 */
function validatePassword(password, hashedPassword) {
  var inputHash = hashPassword(password);
  return inputHash === hashedPassword;
}

/**
 * ฟังก์ชันสำหรับการล็อกอิน
 */
function login(email, password) {
  try {
    var user = getUserByEmail(email);
    
    if (!user) {
      return {
        status: 'error',
        message: 'ไม่พบผู้ใช้นี้ในระบบ'
      };
    }
    
    if (user.status !== 'active') {
      return {
        status: 'error',
        message: 'บัญชีผู้ใช้นี้ถูกระงับการใช้งาน'
      };
    }
    
    if (validatePassword(password, user.password)) {
      // สร้าง session ใหม่
      var session = createSession(user);
      
      // ไม่ส่งรหัสผ่านกลับไป
      delete user.password;
      
      // แจ้งเตือนผ่าน Telegram ถ้าเป็น admin
      if (user.role === 'admin') {
        notifyAdminLogin(user);
      }
      
      return {
        status: 'success',
        message: 'ล็อกอินสำเร็จ',
        user: user,
        session: session
      };
    } else {
      return {
        status: 'error',
        message: 'รหัสผ่านไม่ถูกต้อง'
      };
    }
  } catch (error) {
    logError('login', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการล็อกอิน: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับสร้าง session ใหม่
 */
function createSession(user) {
  try {
    var userProperties = PropertiesService.getUserProperties();
    var sessions = JSON.parse(userProperties.getProperty('sessions') || '{}');
    
    // ลบรหัสผ่านออกจากข้อมูลผู้ใช้
    var sessionUser = JSON.parse(JSON.stringify(user));
    delete sessionUser.password;
    
    // สร้าง session ใหม่
    var sessionId = Utilities.getUuid();
    var session = {
      id: sessionId,
      user: sessionUser,
      created: new Date().toISOString(),
      expires: new Date(new Date().getTime() + 3600000).toISOString() // 1 ชั่วโมง
    };
    
    sessions[sessionId] = session;
    userProperties.setProperty('sessions', JSON.stringify(sessions));
    
    return session;
  } catch (error) {
    logError('createSession', error);
    throw error;
  }
}

/**
 * ฟังก์ชันสำหรับตรวจสอบ session
 */
function checkSession(sessionId) {
  try {
    var userProperties = PropertiesService.getUserProperties();
    var sessions = JSON.parse(userProperties.getProperty('sessions') || '{}');
    
    // ตรวจสอบว่ามี session นี้หรือไม่
    if (sessions[sessionId]) {
      var session = sessions[sessionId];
      
      // ตรวจสอบว่า session หมดอายุหรือไม่
      if (new Date(session.expires) > new Date()) {
        // ต่ออายุ session
        session.expires = new Date(new Date().getTime() + 3600000).toISOString(); // 1 ชั่วโมง
        sessions[sessionId] = session;
        userProperties.setProperty('sessions', JSON.stringify(sessions));
        
        return {
          status: 'success',
          message: 'session ยังใช้งานได้',
          user: session.user
        };
      } else {
        // ลบ session ที่หมดอายุ
        delete sessions[sessionId];
        userProperties.setProperty('sessions', JSON.stringify(sessions));
        
        return {
          status: 'error',
          message: 'session หมดอายุ'
        };
      }
    } else {
      return {
        status: 'error',
        message: 'ไม่พบ session นี้'
      };
    }
  } catch (error) {
    logError('checkSession', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการตรวจสอบ session: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับออกจากระบบ
 */
function logout(sessionId) {
  try {
    var userProperties = PropertiesService.getUserProperties();
    var sessions = JSON.parse(userProperties.getProperty('sessions') || '{}');
    
    // ลบ session
    if (sessions[sessionId]) {
      delete sessions[sessionId];
      userProperties.setProperty('sessions', JSON.stringify(sessions));
    }
    
    return {
      status: 'success',
      message: 'ออกจากระบบเรียบร้อยแล้ว'
    };
  } catch (error) {
    logError('logout', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ: ' + error.message
    };
  }
}

// ===== ฟังก์ชันการจัดการสินค้า =====

/**
 * ฟังก์ชันสำหรับดึงข้อมูลสินค้าในรูปแบบ JSON
 */
function getProductsJSON() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Products');
    var data = sheet.getDataRange().getValues();
    
    var products = [];
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var product = JSON.parse(data[i][0]);
      products.push(product);
    }
    
    return {
      status: 'success',
      products: products
    };
  } catch (error) {
    logError('getProductsJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อมูลสินค้า
 */
function saveProductJSON(productData) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Products');
    var data = sheet.getDataRange().getValues();
    
    // ถ้าเป็นการสร้างสินค้าใหม่
    if (!productData.product_id) {
      productData.product_id = Utilities.getUuid();
      productData.created_at = new Date().toISOString();
      productData.updated_at = new Date().toISOString();
      
      sheet.appendRow([JSON.stringify(productData)]);
      
      return {
        status: 'success',
        message: 'สร้างสินค้าใหม่เรียบร้อยแล้ว',
        product: productData
      };
    } else {
      // ถ้าเป็นการอัพเดทสินค้า
      // ข้ามแถวแรกที่เป็นหัวตาราง
      for (var i = 1; i < data.length; i++) {
        var product = JSON.parse(data[i][0]);
        
        if (product.product_id === productData.product_id) {
          productData.updated_at = new Date().toISOString();
          
          // บันทึกข้อมูลกลับลงใน sheet
          sheet.getRange(i + 1, 1).setValue(JSON.stringify(productData));
          
          return {
            status: 'success',
            message: 'อัพเดทสินค้าเรียบร้อยแล้ว',
            product: productData
          };
        }
      }
      
      return {
        status: 'error',
        message: 'ไม่พบสินค้านี้ในระบบ'
      };
    }
  } catch (error) {
    logError('saveProductJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลสินค้า: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับลบสินค้า
 */
function deleteProductJSON(productId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Products');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var product = JSON.parse(data[i][0]);
      
      if (product.product_id === productId) {
        // ลบข้อมูลออกจาก sheet
        sheet.deleteRow(i + 1);
        
        return {
          status: 'success',
          message: 'ลบสินค้าเรียบร้อยแล้ว'
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบสินค้านี้ในระบบ'
    };
  } catch (error) {
    logError('deleteProductJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการลบสินค้า: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับอัพโหลดไฟล์
 */
function uploadFile(fileBlob, fileType) {
  try {
    // ตรวจสอบประเภทไฟล์
    var folder;
    if (fileType === 'product_image') {
      folder = setupProductImageFolder();
    } else if (fileType === 'product_file') {
      folder = setupProductFileFolder();
    } else {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    }
    
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    var timestamp = new Date().getTime();
    var fileName = timestamp + '_' + fileBlob.getName();
    
    // อัพโหลดไฟล์
    var file = folder.createFile(fileBlob);
    file.setName(fileName);
    
    // ถ้าเป็นรูปภาพ ให้สร้าง URL แบบ direct ด้วย
    var fileUrl = '';
    if (fileType === 'product_image') {
      fileUrl = 'https://drive.google.com/uc?export=view&id=' + file.getId();
    }
    
    return {
      status: 'success',
      message: 'อัพโหลดไฟล์สำเร็จ',
      file_id: file.getId(),
      url: fileUrl,
      file_name: fileBlob.getName()
    };
  } catch (error) {
    logError('uploadFile', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์: ' + error.message
    };
  }
}

// ===== ฟังก์ชันการจัดการคำสั่งซื้อ =====

/**
 * ฟังก์ชันสำหรับดึงข้อมูลคำสั่งซื้อในรูปแบบ JSON
 */
function getOrdersJSON() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Orders');
    var data = sheet.getDataRange().getValues();
    
    var orders = [];
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var order = JSON.parse(data[i][0]);
      orders.push(order);
    }
    
    return {
      status: 'success',
      orders: orders
    };
  } catch (error) {
    logError('getOrdersJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อมูลคำสั่งซื้อ
 * แก้ไขให้เมื่อสร้างคำสั่งซื้อใหม่ มีการสร้าง QR Code และแสดงหน้าชำระเงิน
 */
function saveOrderJSON(orderData) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Orders');
    var data = sheet.getDataRange().getValues();
    
    // ถ้าเป็นการสร้างคำสั่งซื้อใหม่
    if (!orderData.order_id) {
      orderData.order_id = Utilities.getUuid();
      orderData.order_date = new Date().toISOString();
      orderData.status = 'pending';
      
      sheet.appendRow([JSON.stringify(orderData)]);
      
      // แจ้งเตือนเมื่อมีคำสั่งซื้อใหม่
      notifyNewOrder(orderData);
      
      // สร้าง QR Code PromptPay (ระบบเดิมทำที่ client-side แต่เราจะทำงานเตรียมข้อมูลที่ server-side ด้วย)
      var configResult = getConfigJSON();
      var promptPayId = '';
      
      if (configResult.status === 'success') {
        promptPayId = configResult.config.prompt_pay_id || '';
      }
      
      return {
        status: 'success',
        message: 'สร้างคำสั่งซื้อใหม่เรียบร้อยแล้ว',
        order: orderData,
        prompt_pay_id: promptPayId
      };
    } else {
      // ถ้าเป็นการอัพเดทคำสั่งซื้อ
      // ข้ามแถวแรกที่เป็นหัวตาราง
      for (var i = 1; i < data.length; i++) {
        var order = JSON.parse(data[i][0]);
        
        if (order.order_id === orderData.order_id) {
          // บันทึกข้อมูลกลับลงใน sheet
          sheet.getRange(i + 1, 1).setValue(JSON.stringify(orderData));
          
          return {
            status: 'success',
            message: 'อัพเดทคำสั่งซื้อเรียบร้อยแล้ว',
            order: orderData
          };
        }
      }
      
      return {
        status: 'error',
        message: 'ไม่พบคำสั่งซื้อนี้ในระบบ'
      };
    }
  } catch (error) {
    logError('saveOrderJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลคำสั่งซื้อ: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับอัพเดทสถานะคำสั่งซื้อ
 */
function updateOrderStatusJSON(orderId, status) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Orders');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var order = JSON.parse(data[i][0]);
      
      if (order.order_id === orderId) {
        order.status = status;
        
        // บันทึกข้อมูลกลับลงใน sheet
        sheet.getRange(i + 1, 1).setValue(JSON.stringify(order));
        
        // อัพเดทสถานะการชำระเงินที่เกี่ยวข้อง
        updateRelatedPaymentStatus(orderId, status);
        
        return {
          status: 'success',
          message: 'อัพเดทสถานะคำสั่งซื้อเรียบร้อยแล้ว',
          order: order
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบคำสั่งซื้อนี้ในระบบ'
    };
  } catch (error) {
    logError('updateOrderStatusJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะคำสั่งซื้อ: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับอัพเดทสถานะการชำระเงินที่เกี่ยวข้องกับคำสั่งซื้อ
 */
function updateRelatedPaymentStatus(orderId, orderStatus) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Payments');
    var data = sheet.getDataRange().getValues();
    
    var paymentUpdated = false;
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var payment = JSON.parse(data[i][0]);
      
      if (payment.order_id === orderId) {
        var newPaymentStatus = '';
        
        // กำหนดสถานะการชำระเงินตามสถานะคำสั่งซื้อ
        switch (orderStatus) {
          case 'completed':
            newPaymentStatus = 'completed';
            break;
          case 'cancelled':
            newPaymentStatus = 'cancelled';
            break;
          case 'pending':
            // ถ้าคำสั่งซื้อเป็น pending และการชำระเงินเป็น completed ก็ไม่ต้องเปลี่ยน
            if (payment.status !== 'completed') {
              newPaymentStatus = 'pending';
            } else {
              continue; // ข้ามไปรายการถัดไป
            }
            break;
          default:
            continue; // ข้ามไปรายการถัดไป ถ้าสถานะไม่ตรงกับเงื่อนไขใดๆ
        }
        
        // ถ้ามีการกำหนดสถานะใหม่และไม่เหมือนกับสถานะเดิม
        if (newPaymentStatus && payment.status !== newPaymentStatus) {
          payment.status = newPaymentStatus;
          
          // บันทึกข้อมูลกลับลงใน sheet
          sheet.getRange(i + 1, 1).setValue(JSON.stringify(payment));
          paymentUpdated = true;
          
          // แจ้งเตือนผ่าน Telegram ถ้ามีการตั้งค่า
          notifyPaymentStatusChanged(payment, newPaymentStatus);
        }
      }
    }
    
    return paymentUpdated;
  } catch (error) {
    logError('updateRelatedPaymentStatus', error);
    return false;
  }
}

// ===== ฟังก์ชันการจัดการการชำระเงิน =====

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการชำระเงินในรูปแบบ JSON
 */
function getPaymentsJSON() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Payments');
    var data = sheet.getDataRange().getValues();
    
    var payments = [];
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var payment = JSON.parse(data[i][0]);
      payments.push(payment);
    }
    
    return {
      status: 'success',
      payments: payments
    };
  } catch (error) {
    logError('getPaymentsJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการชำระเงิน: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อมูลการชำระเงินในรูปแบบ JSON
 * แก้ไขให้รองรับการอัพโหลดสลิปไปยังโฟลเดอร์ที่กำหนด
 */
function savePaymentJSON(paymentData) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Payments');
    var data = sheet.getDataRange().getValues();
    
    // ถ้าเป็นการสร้างการชำระเงินใหม่
    if (!paymentData.payment_id) {
      paymentData.payment_id = Utilities.getUuid();
      paymentData.payment_date = new Date().toISOString();
      paymentData.status = 'pending';
      
      // อัพโหลดสลิป (ถ้ามี)
      if (paymentData.slip_image && paymentData.slip_image.startsWith('data:')) {
        var slipUrl = saveSlipImage(paymentData.slip_image, paymentData.payment_id);
        paymentData.slip_url = slipUrl;
        delete paymentData.slip_image; // ลบข้อมูลรูปภาพดิบออกเพราะมีขนาดใหญ่
      }
      
      sheet.appendRow([JSON.stringify(paymentData)]);
      
      // แจ้งเตือนเมื่อมีการชำระเงินใหม่
      notifyNewPayment(paymentData);
      
      return {
        status: 'success',
        message: 'บันทึกการชำระเงินเรียบร้อยแล้ว',
        payment: paymentData
      };
    } else {
      // ถ้าเป็นการอัพเดทการชำระเงิน
      // ข้ามแถวแรกที่เป็นหัวตาราง
      for (var i = 1; i < data.length; i++) {
        var payment = JSON.parse(data[i][0]);
        
        if (payment.payment_id === paymentData.payment_id) {
          // อัพโหลดสลิปใหม่ (ถ้ามี)
          if (paymentData.slip_image && paymentData.slip_image.startsWith('data:')) {
            var slipUrl = saveSlipImage(paymentData.slip_image, paymentData.payment_id);
            paymentData.slip_url = slipUrl;
            delete paymentData.slip_image; // ลบข้อมูลรูปภาพดิบออก
          }
          
          // บันทึกข้อมูลกลับลงใน sheet
          sheet.getRange(i + 1, 1).setValue(JSON.stringify(paymentData));
          
          return {
            status: 'success',
            message: 'อัพเดทการชำระเงินเรียบร้อยแล้ว',
            payment: paymentData
          };
        }
      }
      
      return {
        status: 'error',
        message: 'ไม่พบการชำระเงินนี้ในระบบ'
      };
    }
  } catch (error) {
    logError('savePaymentJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการชำระเงิน: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับบันทึกรูปภาพสลิปลงใน Drive
 */
function saveSlipImage(imageData, paymentId) {
  try {
    // ดึงโฟลเดอร์สลิป
    var slipFolder;
    try {
      slipFolder = DriveApp.getFolderById(SLIP_FOLDER_ID);
    } catch (e) {
      // ถ้าไม่มีโฟลเดอร์ ให้สร้างใหม่
      slipFolder = setupSlipFolder();
    }
    
    // แปลงข้อมูล base64 เป็นไฟล์
    var matches = imageData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var contentType = matches[1];
    var base64Data = matches[2];
    var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, 'payment_slip_' + paymentId + '.jpg');
    
    // บันทึกไฟล์ลงในโฟลเดอร์
    var file = slipFolder.createFile(blob);
    
    // ส่ง URL ของรูปภาพกลับไป แบบ direct link
    // เปลี่ยนจาก return file.getUrl() เป็น
    return 'https://lh5.googleusercontent.com/d/' + file.getId();
  } catch (error) {
    logError('saveSlipImage', error);
    return null;
  }
}

/**
 * ฟังก์ชันสำหรับอัพเดทสถานะการชำระเงิน
 */
function updatePaymentStatusJSON(paymentId, status) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Payments');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var payment = JSON.parse(data[i][0]);
      
      if (payment.payment_id === paymentId) {
        payment.status = status;
        
        // บันทึกข้อมูลกลับลงใน sheet
        sheet.getRange(i + 1, 1).setValue(JSON.stringify(payment));
        
        // อัพเดทสถานะคำสั่งซื้อตามสถานะการชำระเงิน
        if (status === 'completed') {
          // ถ้าสถานะเป็น completed ให้สร้าง Download ด้วย
          createDownload(payment.order_id);
          
          // อัพเดทสถานะคำสั่งซื้อเป็น completed
          updateOrderStatusJSON(payment.order_id, 'completed');
        } else if (status === 'rejected') {
          // ถ้าสถานะเป็น rejected ให้อัพเดทสถานะคำสั่งซื้อเป็น pending
          updateOrderStatusJSON(payment.order_id, 'pending');
        } else if (status === 'cancelled') {
          // ถ้าสถานะเป็น cancelled ให้อัพเดทสถานะคำสั่งซื้อเป็น cancelled ด้วย
          updateOrderStatusJSON(payment.order_id, 'cancelled');
        }
        
        return {
          status: 'success',
          message: 'อัพเดทสถานะการชำระเงินเรียบร้อยแล้ว',
          payment: payment
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบการชำระเงินนี้ในระบบ'
    };
  } catch (error) {
    logError('updatePaymentStatusJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการอัพเดทสถานะการชำระเงิน: ' + error.message
    };
  }
}

// ===== ฟังก์ชันการจัดการการดาวน์โหลด =====

/**
 * ฟังก์ชันสำหรับส่งอีเมลแจ้งรหัสดาวน์โหลด โดยรวมสินค้าจากคำสั่งซื้อเดียวกัน
 */
function sendDownloadEmail(email, token, productName, expireDays, maxDownloads, isUnlimitedExpiry, isUnlimitedDownloads) {
  try {
    var configResult = getConfigJSON();
    var storeName = 'ร้านค้าดิจิทัลออนไลน์';
    var storeLogo = '';
    var orderId = '';
    var groupedDownloads = [];
    var webAppUrl = ScriptApp.getService().getUrl();

    if (configResult.status === 'success') {
      storeName = configResult.config.store_name || storeName;
      storeLogo = configResult.config.store_logo || '';
      
      // ดึงข้อมูลการดาวน์โหลดทั้งหมด เพื่อหาอันที่อยู่ในคำสั่งซื้อเดียวกัน
      var downloadsResult = getDownloadsJSON();
      if (downloadsResult.status === 'success') {
        // หา order_id ของรหัสดาวน์โหลดปัจจุบัน
        var currentDownload = downloadsResult.downloads.find(d => d.token === token);
        if (currentDownload) {
          orderId = currentDownload.order_id;
          
          // ค้นหารายการดาวน์โหลดทั้งหมดในคำสั่งซื้อเดียวกัน
          groupedDownloads = downloadsResult.downloads.filter(d => d.order_id === orderId);
          
          // ดึงข้อมูลสินค้าสำหรับแต่ละรายการดาวน์โหลด
          for (var i = 0; i < groupedDownloads.length; i++) {
            var productResult = getProductJSON(groupedDownloads[i].product_id);
            if (productResult.status === 'success') {
              groupedDownloads[i].productName = productResult.product.name;
              groupedDownloads[i].productDescription = productResult.product.description || '';
            }
          }
        }
      }
    }
    
    var subject = '🎉 รหัสดาวน์โหลดสินค้าจาก ' + storeName;
    
    // ฟังก์ชันสำหรับสร้างข้อความแสดงอายุและจำนวนครั้ง
    function getExpiryText(download) {
      var expiryText = download.unlimited_expiry ? 
        "รหัสดาวน์โหลดนี้ไม่มีวันหมดอายุ" : 
        `รหัสดาวน์โหลดนี้จะหมดอายุในอีก ${expireDays} วัน`;
      
      var downloadsText = download.unlimited_downloads ? 
        "สามารถใช้ดาวน์โหลดได้ไม่จำกัดจำนวนครั้ง" : 
        `สามารถใช้ดาวน์โหลดได้สูงสุด ${download.max_downloads} ครั้ง`;
      
      return { expiryText, downloadsText };
    }
    
    // สร้างรายการสินค้าที่สามารถดาวน์โหลดได้
    var downloadItemsHtml = '';
    
    if (groupedDownloads.length > 0) {
      // มีรายการสินค้าหลายรายการในคำสั่งซื้อเดียวกัน
      for (var i = 0; i < groupedDownloads.length; i++) {
        var download = groupedDownloads[i];
        var downloadInfo = getExpiryText(download);
        
        downloadItemsHtml += `
        <div class="download-item">
          <div class="download-code-container">
            <h3 class="product-name">${download.productName || 'สินค้าดิจิทัล'}</h3>
            <div class="download-code">
              <div class="code-text">${download.token}</div>
            </div>
            <div class="direct-download">
              <a href="${webAppUrl}?token=${download.token}" target="_blank" class="download-btn">
                <i class="fas fa-download"></i> ดาวน์โหลดโดยตรง
              </a>
            </div>
            <div class="download-info">
              <p><i class="fas fa-clock"></i> ${downloadInfo.expiryText} 
                ${download.unlimited_expiry ? '<span class="unlimited-badge">ไม่จำกัด</span>' : ''}</p>
              <p><i class="fas fa-redo"></i> ${downloadInfo.downloadsText} 
                ${download.unlimited_downloads ? '<span class="unlimited-badge">ไม่จำกัด</span>' : ''}</p>
            </div>
          </div>
        </div>
        `;
      }
    } else {
      // กรณีมีแค่สินค้าเดียว (ใช้ข้อมูลที่ส่งมา)
      var downloadInfo = { 
        expiryText: isUnlimitedExpiry ? "รหัสดาวน์โหลดนี้ไม่มีวันหมดอายุ" : `รหัสดาวน์โหลดนี้จะหมดอายุในอีก ${expireDays} วัน`,
        downloadsText: isUnlimitedDownloads ? "สามารถใช้ดาวน์โหลดได้ไม่จำกัดจำนวนครั้ง" : `สามารถใช้ดาวน์โหลดได้สูงสุด ${maxDownloads} ครั้ง`
      };
      
      downloadItemsHtml = `
      <div class="download-item">
        <div class="download-code-container">
          <h3 class="product-name">${productName}</h3>
          <div class="download-code">
            <div class="code-text">${token}</div>
          </div>
          <div class="direct-download">
            <a href="${webAppUrl}?token=${token}" target="_blank" class="download-btn">
              <i class="fas fa-download"></i> ดาวน์โหลดโดยตรง
            </a>
          </div>
          <div class="download-info">
            <p><i class="fas fa-clock"></i> ${downloadInfo.expiryText} 
              ${isUnlimitedExpiry ? '<span class="unlimited-badge">ไม่จำกัด</span>' : ''}</p>
            <p><i class="fas fa-redo"></i> ${downloadInfo.downloadsText} 
              ${isUnlimitedDownloads ? '<span class="unlimited-badge">ไม่จำกัด</span>' : ''}</p>
          </div>
        </div>
      </div>
      `;
    }
    
    // สร้าง HTML email ด้วยการออกแบบที่สวยงาม
    var htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รหัสดาวน์โหลดสินค้า</title>
      <style>
        body {
          font-family: 'Sarabun', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f7fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 15px;
        }
        .content {
          padding: 30px 20px;
        }
        .download-item {
          background-color: #f0f7ff;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .product-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #2563eb;
        }
        .download-code-container {
          margin-bottom: 15px;
        }
        .download-code {
          display: flex;
          align-items: center;
          background-color: #ffffff;
          border: 1px dashed #3b82f6;
          border-radius: 4px;
          margin: 10px 0;
          padding: 15px;
          text-align: center;
        }
        .code-text {
          width: 100%;
          font-size: 20px;
          font-weight: bold;
          color: #3b82f6;
          letter-spacing: 1px;
          word-break: break-all;
        }
        .download-btn {
          display: block;
          background-color: #10b981;
          color: white;
          text-decoration: none;
          text-align: center;
          padding: 12px 15px;
          border-radius: 4px;
          font-weight: 600;
          margin: 15px 0;
        }
        .download-info {
          background-color: #f9fafb;
          padding: 10px 15px;
          border-radius: 4px;
          margin-top: 10px;
          font-size: 14px;
        }
        .download-info p {
          margin: 5px 0;
        }
        .instructions {
          padding: 15px 0;
          border-top: 1px solid #eaeaea;
          border-bottom: 1px solid #eaeaea;
          margin: 20px 0;
        }
        .unlimited-badge {
          display: inline-block;
          background-color: #10b981;
          color: white;
          font-size: 12px;
          font-weight: bold;
          padding: 3px 8px;
          border-radius: 12px;
          margin-left: 5px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          font-size: 14px;
          color: #666;
        }
        .direct-download {
          margin: 15px 0;
        }
        .note {
          background-color: #FFECB3;
          border-left: 4px solid #FFC107;
          padding: 12px 15px;
          margin: 15px 0;
          border-radius: 4px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="logo">` : ''}
          <h1>${storeName}</h1>
        </div>
        
        <div class="content">
          <p>เรียนลูกค้าที่เคารพ,</p>
          
          <p>ขอบคุณสำหรับการสั่งซื้อสินค้าจาก ${storeName} นี่คือรหัสดาวน์โหลดสำหรับสินค้าที่คุณสั่งซื้อ</p>
          
          ${downloadItemsHtml}
          
          <div class="note">
            <strong>หมายเหตุ:</strong> กรุณาคัดลอกรหัสดาวน์โหลดด้านบนไปใช้ในเว็บไซต์ของเรา หรือใช้ปุ่ม "ดาวน์โหลดโดยตรง" เพื่อดาวน์โหลดสินค้าได้ทันที
          </div>
          
          <div class="instructions">
            <h3>📋 วิธีการดาวน์โหลดสินค้า</h3>
            <ol>
              <li>คลิกปุ่ม "ดาวน์โหลดโดยตรง" เพื่อดาวน์โหลดไฟล์ทันที</li>
              <li>หรือเข้าสู่เว็บไซต์ของเรา</li>
              <li>ไปที่เมนู "ดาวน์โหลด"</li>
              <li>กรอกรหัสดาวน์โหลดตามที่ระบุด้านบน</li>
              <li>คลิกปุ่ม "ดาวน์โหลด" เพื่อรับไฟล์สินค้า</li>
            </ol>
          </div>
          
          <a href="${webAppUrl}" class="download-btn">
            🚀 ไปที่หน้าดาวน์โหลด
          </a>
          
        </div>
        
        <div class="footer">
          <p>ขอบคุณที่ใช้บริการกับเรา</p>
          <p>&copy; ${new Date().getFullYear()} ${storeName} - สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // สร้าง plain text version สำหรับ email client ที่ไม่รองรับ HTML
    var plainBody = 'เรียนลูกค้า,\n\n';
    plainBody += 'ขอบคุณสำหรับการสั่งซื้อสินค้าจาก ' + storeName + '\n\n';
    
    if (groupedDownloads.length > 0) {
      plainBody += 'รหัสดาวน์โหลดของคุณ:\n\n';
      for (var i = 0; i < groupedDownloads.length; i++) {
        var download = groupedDownloads[i];
        var downloadInfo = getExpiryText(download);
        
        plainBody += '-----------------------------------\n';
        plainBody += 'สินค้า: ' + (download.productName || 'สินค้าดิจิทัล') + '\n';
        plainBody += 'รหัสดาวน์โหลด: ' + download.token + '\n';
        plainBody += downloadInfo.expiryText + (download.unlimited_expiry ? ' (ไม่จำกัด)' : '') + '\n';
        plainBody += downloadInfo.downloadsText + (download.unlimited_downloads ? ' (ไม่จำกัด)' : '') + '\n';
        plainBody += 'ลิงก์ดาวน์โหลดโดยตรง: ' + webAppUrl + '?token=' + download.token + '\n';
        plainBody += '-----------------------------------\n\n';
      }
    } else {
      plainBody += 'สินค้า: ' + productName + '\n';
      plainBody += 'รหัสดาวน์โหลดของคุณคือ: ' + token + '\n\n';
      plainBody += 'ลิงก์ดาวน์โหลดโดยตรง: ' + webAppUrl + '?token=' + token + '\n\n';
      plainBody += isUnlimitedExpiry ? 'รหัสดาวน์โหลดนี้ไม่มีวันหมดอายุ' : 'รหัสดาวน์โหลดนี้จะหมดอายุในอีก ' + expireDays + ' วัน\n';
      plainBody += isUnlimitedDownloads ? 'สามารถใช้ดาวน์โหลดได้ไม่จำกัดจำนวนครั้ง' : 'สามารถใช้ดาวน์โหลดได้สูงสุด ' + maxDownloads + ' ครั้ง\n\n';
    }
    
    plainBody += 'วิธีการดาวน์โหลด:\n';
    plainBody += '1. คุณสามารถใช้ลิงก์ดาวน์โหลดโดยตรงที่ให้ไว้ด้านบน\n';
    plainBody += '2. หรือเข้าสู่เว็บไซต์ของเรา\n';
    plainBody += '3. ไปที่เมนู "ดาวน์โหลด"\n';
    plainBody += '4. กรอกรหัสดาวน์โหลดตามที่ระบุด้านบน\n';
    plainBody += '5. คลิกปุ่ม "ดาวน์โหลด" เพื่อรับไฟล์สินค้า\n\n';
    plainBody += 'ขอบคุณที่ใช้บริการ,\n' + storeName;
    
    // ส่งอีเมลทั้งแบบ HTML และ plain text
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody
    });
    
    return {
      status: 'success',
      message: 'ส่งอีเมลแจ้งรหัสดาวน์โหลดเรียบร้อยแล้ว'
    };
  } catch (error) {
    logError('sendDownloadEmail', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการส่งอีเมลแจ้งรหัสดาวน์โหลด: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลคำสั่งซื้อเดี่ยว
 */
function getOrderJSON(orderId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Orders');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var order = JSON.parse(data[i][0]);
      
      if (order.order_id === orderId) {
        return {
          status: 'success',
          order: order
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบคำสั่งซื้อนี้'
    };
  } catch (error) {
    logError('getOrderJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลสินค้าเดี่ยว
 */
function getProductJSON(productId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Products');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var product = JSON.parse(data[i][0]);
      
      if (product.product_id === productId) {
        return {
          status: 'success',
          product: product
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบสินค้านี้'
    };
  } catch (error) {
    logError('getProductJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการดาวน์โหลดในรูปแบบ JSON
 */
function getDownloadsJSON() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Downloads');
    var data = sheet.getDataRange().getValues();
    
    var downloads = [];
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var download = JSON.parse(data[i][0]);
      downloads.push(download);
    }
    
    return {
      status: 'success',
      downloads: downloads
    };
  } catch (error) {
    logError('getDownloadsJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการดาวน์โหลด: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับดาวน์โหลดไฟล์
 */
function downloadFile(token) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Downloads');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var download = JSON.parse(data[i][0]);
      
      if (download.token === token) {
        // ตรวจสอบแค่สถานะการดาวน์โหลด
        if (download.status !== 'active') {
          return {
            status: 'error',
            message: 'การดาวน์โหลดนี้ไม่สามารถใช้งานได้'
          };
        }
        
        // ถึงแม้จะยังคงนับจำนวนครั้งแต่จะไม่มีการตรวจสอบว่าเกินหรือไม่
        download.current_downloads++;
        sheet.getRange(i + 1, 1).setValue(JSON.stringify(download));
        
        // สร้าง URL สำหรับดาวน์โหลดไฟล์
        var file = DriveApp.getFileById(download.file_id);
        var url = file.getDownloadUrl();
        
        return {
          status: 'success',
          message: 'ดาวน์โหลดไฟล์เรียบร้อยแล้ว',
          url: url,
          download_id: download.download_id
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบการดาวน์โหลดนี้'
    };
  } catch (error) {
    logError('downloadFile', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับแสดงข้อมูลในหน้าดาวน์โหลด
 */
function getDownloadInfo(downloadId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Downloads');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var download = JSON.parse(data[i][0]);
      
      if (download.download_id === downloadId) {
        // เพิ่มข้อมูลสถานะการจำกัด - ตั้งค่าเป็นไม่จำกัดเสมอ
        download.remaining_text = "ไม่จำกัดจำนวนครั้ง";
        download.expire_text = "ไม่มีวันหมดอายุ";
        
        return {
          status: 'success',
          download: download
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบข้อมูลการดาวน์โหลด'
    };
  } catch (error) {
    logError('getDownloadInfo', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการดาวน์โหลด: ' + error.message
    };
  }
}

// ===== ฟังก์ชันการจัดการการตั้งค่า =====

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการตั้งค่าในรูปแบบ JSON
 */
function getConfigJSON() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Config');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    if (data.length > 1) {
      var config = JSON.parse(data[1][0]);
      
      return {
        status: 'success',
        config: config
      };
    } else {
      return {
        status: 'error',
        message: 'ไม่พบข้อมูลการตั้งค่า'
      };
    }
  } catch (error) {
    logError('getConfigJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการตั้งค่า: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับบันทึกข้อมูลการตั้งค่าในรูปแบบ JSON
 */
function saveConfigJSON(configData) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Config');
    var data = sheet.getDataRange().getValues();
    
    // ถ้ามีข้อมูลการตั้งค่าอยู่แล้ว
    if (data.length > 1) {
      // อัพเดทข้อมูลการตั้งค่า
      sheet.getRange(2, 1).setValue(JSON.stringify(configData));
    } else {
      // สร้างข้อมูลการตั้งค่าใหม่
      sheet.appendRow([JSON.stringify(configData)]);
    }
    
    return {
      status: 'success',
      message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว',
      config: configData
    };
  } catch (error) {
    logError('saveConfigJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูลการตั้งค่า: ' + error.message
    };
  }
}

// ===== ฟังก์ชันการแจ้งเตือน Telegram =====

/**
 * ฟังก์ชันสำหรับส่งการแจ้งเตือนผ่าน Telegram
 */
function sendTelegramNotification(message) {
  try {
    var configResult = getConfigJSON();
    
    if (configResult.status === 'error') {
      return configResult;
    }
    
    var config = configResult.config;
    
    // ตรวจสอบว่ามีการตั้งค่า Telegram Bot หรือไม่
    if (!config.telegram_bot_token || !config.telegram_chat_id) {
      return {
        status: 'error',
        message: 'ยังไม่ได้ตั้งค่า Telegram Bot'
      };
    }
    
    // ส่งข้อความผ่าน Telegram Bot API
    var url = 'https://api.telegram.org/bot' + config.telegram_bot_token + '/sendMessage';
    var data = {
      'chat_id': config.telegram_chat_id,
      'text': message,
      'parse_mode': 'HTML'
    };
    
    var options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(data),
      'muteHttpExceptions': true
    };
    
    var response = UrlFetchApp.fetch(url, options);
    var json = JSON.parse(response.getContentText());
    
    if (json.ok) {
      return {
        status: 'success',
        message: 'ส่งการแจ้งเตือนเรียบร้อยแล้ว'
      };
    } else {
      return {
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน: ' + json.description
      };
    }
  } catch (error) {
    logError('sendTelegramNotification', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการส่งการแจ้งเตือน: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่
 */
function notifyNewOrder(order) {
  try {
    var configResult = getConfigJSON();
    
    if (configResult.status === 'error') {
      return configResult;
    }
    
    var config = configResult.config;
    var storeName = config.store_name || 'ร้านค้าดิจิทัลออนไลน์';
    
    var message = '<b>📦 มีคำสั่งซื้อใหม่!</b>\n\n';
    message += '<b>ร้าน:</b> ' + storeName + '\n';
    message += '<b>รหัสคำสั่งซื้อ:</b> ' + order.order_id + '\n';
    message += '<b>วันที่สั่ง:</b> ' + new Date(order.order_date).toLocaleString('th-TH') + '\n';
    message += '<b>ลูกค้า:</b> ' + order.customer.name + '\n';
    message += '<b>อีเมล:</b> ' + order.customer.email + '\n';
    message += '<b>จำนวนเงิน:</b> ' + order.total_amount + ' บาท\n\n';
    
    // แสดงรายการสินค้า
    message += '<b>รายการสินค้า:</b>\n';
    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];
      message += (i + 1) + '. ' + item.name + ' (' + item.quantity + ' x ' + item.price + ' บาท)\n';
    }
    
    return sendTelegramNotification(message);
  } catch (error) {
    logError('notifyNewOrder', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการแจ้งเตือนคำสั่งซื้อใหม่: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับแจ้งเตือนเมื่อมีการชำระเงินใหม่
 */
function notifyNewPayment(payment) {
  try {
    var configResult = getConfigJSON();
    
    if (configResult.status === 'error') {
      return configResult;
    }
    
    var config = configResult.config;
    var storeName = config.store_name || 'ร้านค้าดิจิทัลออนไลน์';
    
    // ดึงข้อมูลคำสั่งซื้อ
    var orderResult = getOrderJSON(payment.order_id);
    var orderInfo = '';
    
    if (orderResult.status === 'success') {
      var order = orderResult.order;
      orderInfo = 'คำสั่งซื้อ: ' + order.customer.name + ' (' + order.total_amount + ' บาท)';
    }
    
    var message = '<b>💵 มีการชำระเงินใหม่!</b>\n\n';
    message += '<b>ร้าน:</b> ' + storeName + '\n';
    message += '<b>รหัสการชำระเงิน:</b> ' + payment.payment_id + '\n';
    message += '<b>รหัสคำสั่งซื้อ:</b> ' + payment.order_id + '\n';
    message += '<b>' + orderInfo + '</b>\n';
    message += '<b>วันที่ชำระ:</b> ' + new Date(payment.payment_date).toLocaleString('th-TH') + '\n';
    message += '<b>จำนวนเงิน:</b> ' + payment.amount + ' บาท\n';
    message += '<b>สถานะ:</b> รอการตรวจสอบ\n\n';
    message += 'โปรดตรวจสอบและยืนยันการชำระเงินในระบบหลังบ้าน';
    
    return sendTelegramNotification(message);
  } catch (error) {
    logError('notifyNewPayment', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการแจ้งเตือนการชำระเงินใหม่: ' + error.message
    };
  }
}

/**
* ฟังก์ชันสำหรับแจ้งเตือนเมื่อมีการล็อกอินเข้าระบบผู้ดูแล
*/
function notifyAdminLogin(user) {
 try {
   var configResult = getConfigJSON();
   
   if (configResult.status === 'error') {
     return configResult;
   }
   
   var config = configResult.config;
   var storeName = config.store_name || 'ร้านค้าดิจิทัลออนไลน์';
   
   var message = '<b>🔐 มีการล็อกอินเข้าระบบผู้ดูแล!</b>\n\n';
   message += '<b>ร้าน:</b> ' + storeName + '\n';
   message += '<b>ผู้ใช้:</b> ' + user.name + '\n';
   message += '<b>อีเมล:</b> ' + user.email + '\n';
   message += '<b>วันเวลา:</b> ' + new Date().toLocaleString('th-TH') + '\n';
   
   return sendTelegramNotification(message);
 } catch (error) {
   logError('notifyAdminLogin', error);
   return {
     status: 'error',
     message: 'เกิดข้อผิดพลาดในการแจ้งเตือนการล็อกอินเข้าระบบผู้ดูแล: ' + error.message
   };
 }
}

/**
* ฟังก์ชันสำหรับทดสอบการแจ้งเตือน Telegram
*/
function setupTelegramBot(token, chatId) {
 try {
   // อัพเดทการตั้งค่า
   var configData = {
     telegram_bot_token: token,
     telegram_chat_id: chatId
   };
   
   var result = updateConfigJSON(configData);
   
   // ทดสอบส่งข้อความ
   if (result.status === 'success') {
     var testMessage = "🧪 ทดสอบการแจ้งเตือนผ่าน Telegram Bot\n\n";
     testMessage += "การตั้งค่าเรียบร้อยแล้ว คุณจะได้รับการแจ้งเตือนเมื่อมีคำสั่งซื้อใหม่";
     
     var testResult = sendTelegramNotification(testMessage);
     return testResult;
   } else {
     return result;
   }
 } catch (error) {
   logError('setupTelegramBot', error);
   return {
     status: 'error',
     message: 'เกิดข้อผิดพลาดในการตั้งค่า: ' + error.message
   };
 }
}

/**
* ฟังก์ชันสำหรับอัพเดทข้อมูลการตั้งค่าบางส่วน
*/
function updateConfigJSON(configData) {
 try {
   var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
   var sheet = ss.getSheetByName('Config');
   var data = sheet.getDataRange().getValues();
   
   // ถ้ามีข้อมูลการตั้งค่าอยู่แล้ว
   if (data.length > 1) {
     var currentConfig = JSON.parse(data[1][0]);
     
     // อัพเดทเฉพาะข้อมูลที่ส่งมา
     for (var key in configData) {
       currentConfig[key] = configData[key];
     }
     
     // บันทึกข้อมูลกลับลงใน sheet
     sheet.getRange(2, 1).setValue(JSON.stringify(currentConfig));
     
     return {
       status: 'success',
       message: 'อัพเดทการตั้งค่าเรียบร้อยแล้ว',
       config: currentConfig
     };
   } else {
     return {
       status: 'error',
       message: 'ไม่พบข้อมูลการตั้งค่า'
     };
   }
 } catch (error) {
   logError('updateConfigJSON', error);
   return {
     status: 'error',
     message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูลการตั้งค่า: ' + error.message
   };
 }
}

/**
* ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ในรูปแบบ JSON
*/
function getUsersJSON() {
 try {
   var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
   var sheet = ss.getSheetByName('Users');
   var data = sheet.getDataRange().getValues();
   
   var users = [];
   
   // ข้ามแถวแรกที่เป็นหัวตาราง
   for (var i = 1; i < data.length; i++) {
     var user = JSON.parse(data[i][0]);
     // ไม่ส่งรหัสผ่านกลับไป
     delete user.password;
     users.push(user);
   }
   
   return {
     status: 'success',
     users: users
   };
 } catch (error) {
   logError('getUsersJSON', error);
   return {
     status: 'error',
     message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้: ' + error.message
   };
 }
}

/**
 * ฟังก์ชันสำหรับอัพโหลดรูปภาพหรือไฟล์สินค้า
 */
function processFile(formData) {
  try {
    var file = formData.file;
    var fileType = formData.type || 'other';
    
    if (!file) {
      return {
        status: 'error',
        message: 'ไม่พบไฟล์'
      };
    }
    
    var folder;
    if (fileType === 'product_image') {
      folder = setupProductImageFolder();
    } else if (fileType === 'product_file') {
      folder = setupProductFileFolder();
    } else {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    }
    
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    var timestamp = new Date().getTime();
    var fileName = timestamp + '_' + file.getName();
    
    // อัพโหลดไฟล์
    var uploadedFile = folder.createFile(file);
    uploadedFile.setName(fileName);
    
    // ถ้าเป็นรูปภาพ สร้าง URL สำหรับเข้าถึงโดยตรง
    var fileUrl = '';
    if (fileType === 'product_image') {
      fileUrl = 'https://lh5.googleusercontent.com/d/' + uploadedFile.getId();
    }
    
    return {
      status: 'success',
      message: 'อัพโหลดไฟล์สำเร็จ',
      file_id: uploadedFile.getId(),
      file_name: file.getName(),
      url: fileUrl
    };
  } catch (error) {
    logError('processFile', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับลบผู้ใช้
 */
function deleteUser(userId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var user = JSON.parse(data[i][0]);
      
      if (user.user_id === userId) {
        // ตรวจสอบว่าเป็น admin คนเดียวหรือไม่
        if (user.role === 'admin') {
          var adminCount = 0;
          for (var j = 1; j < data.length; j++) {
            var checkUser = JSON.parse(data[j][0]);
            if (checkUser.role === 'admin' && checkUser.status === 'active') {
              adminCount++;
            }
          }
          
          if (adminCount <= 1) {
            return {
              status: 'error',
              message: 'ไม่สามารถลบผู้ดูแลระบบคนเดียวได้'
            };
          }
        }
        
        // ลบข้อมูลออกจาก sheet
        sheet.deleteRow(i + 1);
        
        return {
          status: 'success',
          message: 'ลบผู้ใช้เรียบร้อยแล้ว'
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบผู้ใช้นี้ในระบบ'
    };
  } catch (error) {
    logError('deleteUser', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับอัพเดทข้อมูลผู้ใช้
 */
function updateUser(userId, userData) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var user = JSON.parse(data[i][0]);
      
      if (user.user_id === userId) {
        // อัพเดทข้อมูลผู้ใช้
        user.name = userData.name || user.name;
        user.email = userData.email || user.email;
        user.role = userData.role || user.role;
        user.status = userData.status || user.status;
        user.updated_at = new Date().toISOString();
        
        // ถ้ามีการเปลี่ยนรหัสผ่าน
        if (userData.password) {
          user.password = hashPassword(userData.password);
        }
        
        // บันทึกข้อมูลกลับลงใน sheet
        sheet.getRange(i + 1, 1).setValue(JSON.stringify(user));
        
        // ไม่ส่งรหัสผ่านกลับไป
        delete user.password;
        
        return {
          status: 'success',
          message: 'อัพเดทผู้ใช้เรียบร้อยแล้ว',
          user: user
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบผู้ใช้นี้ในระบบ'
    };
  } catch (error) {
    logError('updateUser', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการอัพเดทผู้ใช้: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับบันทึกไฟล์จาก Base64
 */
function saveBase64AsFile(base64Data, fileName, fileType) {
  try {
    // แยกข้อมูล Base64 จากส่วนหัว
    var matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var contentType = matches[1];
    var base64 = matches[2];
    
    // สร้าง Blob จากข้อมูล Base64
    var blob = Utilities.newBlob(Utilities.base64Decode(base64), contentType, fileName);
    
    var folder;
    if (fileType === 'product_image') {
      folder = setupProductImageFolder();
    } else if (fileType === 'product_file') {
      folder = setupProductFileFolder();
    } else if (fileType === 'store_logo') {
      // ใช้โฟลเดอร์หลักสำหรับโลโก้ร้านค้า
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } else if (fileType === 'payment_qrcode') {
      // ใช้โฟลเดอร์หลักสำหรับ QR Code การชำระเงิน
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    } else {
      folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    }
    
    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    var timestamp = new Date().getTime();
    var newFileName = timestamp + '_' + fileName;
    
    // อัพโหลดไฟล์
    var file = folder.createFile(blob);
    file.setName(newFileName);
    
    // สร้าง URL สำหรับเข้าถึงรูปภาพโดยตรง
    var fileUrl = '';
    if (fileType === 'product_image' || fileType === 'store_logo' || fileType === 'payment_qrcode') {
      fileUrl = 'https://lh5.googleusercontent.com/d/' + file.getId();
    }
    
    return {
      status: 'success',
      message: 'อัพโหลดไฟล์สำเร็จ',
      file_id: file.getId(),
      file_name: fileName,
      url: fileUrl
    };
  } catch (error) {
    logError('saveBase64AsFile', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการอัพโหลดไฟล์: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับสร้างการดาวน์โหลด
 */
function createDownload(orderId) {
  try {
    // ดึงข้อมูลคำสั่งซื้อ
    var orderResult = getOrderJSON(orderId);
    
    if (orderResult.status === 'error') {
      return orderResult;
    }
    
    var order = orderResult.order;
    
    // อัพเดทสถานะคำสั่งซื้อเป็น completed
    updateOrderStatusJSON(orderId, 'completed');
    
    // ไม่ต้องดึงการตั้งค่า ให้ใช้ค่าไม่จำกัดเลย
    var downloadExpireDays = 36500; // ประมาณ 100 ปี (ถือว่าไม่มีวันหมดอายุ)
    var maxDownloads = 999999; // ค่าสูงมาก (ถือว่าไม่จำกัดครั้ง)
    
    // สร้างการดาวน์โหลดสำหรับแต่ละสินค้าในคำสั่งซื้อ
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Downloads');
    
    for (var i = 0; i < order.items.length; i++) {
      var item = order.items[i];
      
      // ดึงข้อมูลสินค้า
      var productResult = getProductJSON(item.product_id);
      
      if (productResult.status === 'success') {
        var product = productResult.product;
        
        // คำนวณวันหมดอายุ (ตั้งเป็นวันที่ไกลมากๆ)
        var expireDate = new Date();
        expireDate.setFullYear(expireDate.getFullYear() + 100); // เพิ่ม 100 ปี
        
        // สร้างการดาวน์โหลด
        var download = {
          download_id: Utilities.getUuid(),
          order_id: orderId,
          product_id: item.product_id,
          file_id: product.file_id,
          expire_date: expireDate.toISOString(),
          max_downloads: maxDownloads,
          current_downloads: 0,
          token: Utilities.getUuid(),
          status: 'active',
          unlimited_expiry: true,
          unlimited_downloads: true
        };
        
        sheet.appendRow([JSON.stringify(download)]);
        
        // ส่งอีเมลแจ้งรหัสดาวน์โหลด พร้อมสถานะไม่จำกัด
        sendDownloadEmail(
          order.customer.email, 
          download.token, 
          product.name, 
          0, // ไม่จำกัดวัน 
          0, // ไม่จำกัดครั้ง
          true, // ไม่จำกัดอายุ
          true  // ไม่จำกัดจำนวนครั้ง
        );
      }
    }
    
    return {
      status: 'success',
      message: 'สร้างการดาวน์โหลดเรียบร้อยแล้ว'
    };
  } catch (error) {
    logError('createDownload', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการสร้างการดาวน์โหลด: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการดาวน์โหลดในรูปแบบ JSON พร้อมข้อมูลสินค้า
 */
function getDownloadsWithProductJSON() {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Downloads');
    var data = sheet.getDataRange().getValues();
    
    var downloads = [];
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var download = JSON.parse(data[i][0]);
      
      // ดึงข้อมูลสินค้า
      var productResult = getProductJSON(download.product_id);
      if (productResult.status === 'success') {
        download.product = {
          name: productResult.product.name,
          image: productResult.product.image,
          category: productResult.product.category
        };
      } else {
        download.product = {
          name: 'ไม่พบข้อมูลสินค้า',
          image: '',
          category: ''
        };
      }
      
      downloads.push(download);
    }
    
    return {
      status: 'success',
      downloads: downloads
    };
  } catch (error) {
    logError('getDownloadsWithProductJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการดาวน์โหลด: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับสร้างลูกค้า/สมาชิกใหม่
 */
function createCustomer(customerData) {
  try {
    // ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือไม่
    var existingUser = getUserByEmail(customerData.email);
    if (existingUser) {
      return {
        status: 'error',
        message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
      };
    }
    
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    
    var newUser = {
      user_id: Utilities.getUuid(),
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone,
      password: hashPassword(customerData.password),
      role: 'customer', // กำหนดให้เป็น customer เสมอเพื่อความปลอดภัย
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active'
    };
    
    sheet.appendRow([JSON.stringify(newUser)]);
    
    // สร้าง session สำหรับล็อกอินอัตโนมัติ
    var sessionInfo = createSession(newUser);
    
    // ไม่ส่งรหัสผ่านกลับไป
    delete newUser.password;
    
    return {
      status: 'success',
      message: 'สร้างบัญชีผู้ใช้เรียบร้อยแล้ว',
      user: newUser,
      session: sessionInfo
    };
  } catch (error) {
    logError('createCustomer', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลคำสั่งซื้อของลูกค้า
 */
function getCustomerOrders(userId) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Orders');
    var data = sheet.getDataRange().getValues();
    
    var orders = [];
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var order = JSON.parse(data[i][0]);
      
      // กรองเฉพาะคำสั่งซื้อของลูกค้าที่ระบุ
      if (order.customer && order.customer.user_id === userId) {
        orders.push(order);
      }
    }
    
    return {
      status: 'success',
      orders: orders
    };
  } catch (error) {
    logError('getCustomerOrders', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับดึงข้อมูลการดาวน์โหลดของลูกค้า
 */
function getCustomerDownloads(userId) {
  try {
    // ดึงคำสั่งซื้อของลูกค้า
    var ordersResult = getCustomerOrders(userId);
    if (ordersResult.status !== 'success') {
      return ordersResult;
    }
    
    // รายการ order_id ของลูกค้า
    var orderIds = ordersResult.orders.map(order => order.order_id);
    
    // ดึงข้อมูลการดาวน์โหลดทั้งหมด
    var downloadsResult = getDownloadsJSON();
    if (downloadsResult.status !== 'success') {
      return downloadsResult;
    }
    
    // กรองเฉพาะดาวน์โหลดที่เกี่ยวข้องกับลูกค้า
    var customerDownloads = downloadsResult.downloads.filter(download => 
      orderIds.includes(download.order_id)
    );
    
    // ดึงข้อมูลสินค้าสำหรับแต่ละดาวน์โหลด
    for (var i = 0; i < customerDownloads.length; i++) {
      var download = customerDownloads[i];
      var productResult = getProductJSON(download.product_id);
      
      if (productResult.status === 'success') {
        download.product = {
          name: productResult.product.name,
          description: productResult.product.description,
          image: productResult.product.image
        };
      }
    }
    
    return {
      status: 'success',
      downloads: customerDownloads
    };
  } catch (error) {
    logError('getCustomerDownloads', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการดาวน์โหลด: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับรีเซ็ตรหัสผ่าน
 */
function resetPassword(email) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Users');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var user = JSON.parse(data[i][0]);
      
      if (user.email === email) {
        // สร้างรหัสผ่านใหม่แบบสุ่ม
        var newPassword = generateRandomPassword(8);
        
        // อัพเดทรหัสผ่านของผู้ใช้
        user.password = hashPassword(newPassword);
        user.updated_at = new Date().toISOString();
        
        // บันทึกข้อมูลกลับลงใน sheet
        sheet.getRange(i + 1, 1).setValue(JSON.stringify(user));
        
        // ส่งอีเมลแจ้งรหัสผ่านใหม่
        sendPasswordResetEmail(user.email, newPassword, user.name);
        
        return {
          status: 'success',
          message: 'รหัสผ่านใหม่ได้ถูกส่งไปยังอีเมลของคุณแล้ว'
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบอีเมลนี้ในระบบ'
    };
  } catch (error) {
    logError('resetPassword', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับสร้างรหัสผ่านแบบสุ่ม
 */
function generateRandomPassword(length) {
  var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  var password = "";
  
  for (var i = 0; i < length; i++) {
    var randomIndex = Math.floor(Math.random() * charset.length);
    password += charset.charAt(randomIndex);
  }
  
  return password;
}

/**
 * ฟังก์ชันสำหรับส่งอีเมลแจ้งรหัสผ่านใหม่
 */
function sendPasswordResetEmail(email, newPassword, userName) {
  try {
    var configResult = getConfigJSON();
    var storeName = 'ร้านค้าดิจิทัลออนไลน์';
    var storeLogo = '';
    
    if (configResult.status === 'success') {
      storeName = configResult.config.store_name || storeName;
      storeLogo = configResult.config.store_logo || '';
    }
    
    var subject = 'รหัสผ่านใหม่จาก ' + storeName;
    
    // สร้าง HTML email ด้วยการออกแบบที่สวยงาม
    var htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>รหัสผ่านใหม่</title>
      <style>
        body {
          font-family: 'Sarabun', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f7fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 15px;
        }
        .content {
          padding: 30px 20px;
        }
        .password-container {
          background-color: #f0f7ff;
          border-left: 4px solid #3b82f6;
          padding: 15px 20px;
          margin: 20px 0;
          border-radius: 4px;
          font-family: monospace;
          font-size: 18px;
          text-align: center;
          font-weight: bold;
          letter-spacing: 1px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #eaeaea;
          font-size: 14px;
          color: #666;
        }
        .warning {
          color: #e11d48;
          font-size: 14px;
          margin-top: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="logo">` : ''}
          <h1>${storeName}</h1>
        </div>
        
        <div class="content">
          <p>เรียน ${userName || 'ลูกค้า'},</p>
          
          <p>คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ นี่คือรหัสผ่านใหม่ของคุณ:</p>
          
          <div class="password-container">
            ${newPassword}
          </div>
          
          <p>กรุณาเปลี่ยนรหัสผ่านใหม่ทันทีหลังจากเข้าสู่ระบบ</p>
          
          <p class="warning">
            <strong>คำเตือน:</strong> หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบโดยทันที
          </p>
        </div>
        
        <div class="footer">
          <p>ขอบคุณที่ใช้บริการกับเรา</p>
          <p>&copy; ${new Date().getFullYear()} ${storeName} - สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // สร้าง plain text version สำหรับ email client ที่ไม่รองรับ HTML
    var plainBody = 'เรียน ' + (userName || 'ลูกค้า') + ',\n\n';
    plainBody += 'คุณได้ขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ นี่คือรหัสผ่านใหม่ของคุณ:\n\n';
    plainBody += newPassword + '\n\n';
    plainBody += 'กรุณาเปลี่ยนรหัสผ่านใหม่ทันทีหลังจากเข้าสู่ระบบ\n\n';
    plainBody += 'คำเตือน: หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบโดยทันที\n\n';
    plainBody += 'ขอบคุณที่ใช้บริการ,\n' + storeName;
    
    // ส่งอีเมลทั้งแบบ HTML และ plain text
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody
    });
    
    return {
      status: 'success',
      message: 'ส่งอีเมลรหัสผ่านใหม่เรียบร้อยแล้ว'
    };
  } catch (error) {
    logError('sendPasswordResetEmail', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการส่งอีเมลรหัสผ่านใหม่: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับปฏิเสธการชำระเงิน
 */
function rejectPaymentJSON(paymentId, reason) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName('Payments');
    var data = sheet.getDataRange().getValues();
    
    // ข้ามแถวแรกที่เป็นหัวตาราง
    for (var i = 1; i < data.length; i++) {
      var payment = JSON.parse(data[i][0]);
      
      if (payment.payment_id === paymentId) {
        payment.status = 'rejected';
        payment.reject_reason = reason;
        payment.reject_date = new Date().toISOString();
        
        // บันทึกข้อมูลกลับลงใน sheet
        sheet.getRange(i + 1, 1).setValue(JSON.stringify(payment));
        
        // อัพเดทสถานะคำสั่งซื้อเป็น pending
        updateOrderStatusJSON(payment.order_id, 'pending');
        
        // แจ้งเตือนลูกค้าผ่านอีเมล
        notifyRejectedPayment(payment);
        
        // แจ้งเตือนผ่าน Telegram
        notifyPaymentStatusChanged(payment, 'rejected');
        
        return {
          status: 'success',
          message: 'ปฏิเสธการชำระเงินเรียบร้อยแล้ว',
          payment: payment
        };
      }
    }
    
    return {
      status: 'error',
      message: 'ไม่พบการชำระเงินนี้ในระบบ'
    };
  } catch (error) {
    logError('rejectPaymentJSON', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการปฏิเสธการชำระเงิน: ' + error.message
    };
  }
}

/**
 * ฟังก์ชันสำหรับส่งอีเมลแจ้งการปฏิเสธการชำระเงิน
 */
function notifyRejectedPayment(payment) {
  try {
    // ดึงข้อมูลคำสั่งซื้อ
    var orderResult = getOrderJSON(payment.order_id);
    if (orderResult.status !== 'success') {
      return { status: 'error', message: 'ไม่พบข้อมูลคำสั่งซื้อ' };
    }
    
    var order = orderResult.order;
    var email = order.customer.email;
    
    // ดึงข้อมูลร้านค้า
    var configResult = getConfigJSON();
    var storeName = 'ร้านค้าดิจิทัลออนไลน์';
    var storeLogo = '';
    
    if (configResult.status === 'success') {
      storeName = configResult.config.store_name || storeName;
      storeLogo = configResult.config.store_logo || '';
    }
    
    var subject = '❌ การชำระเงินถูกปฏิเสธ - ' + storeName;
    
    // สร้าง HTML email
    var htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>การชำระเงินถูกปฏิเสธ</title>
      <style>
        body {
          font-family: 'Sarabun', 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f7fa;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        .logo {
          max-height: 60px;
          margin-bottom: 15px;
        }
        .content {
          padding: 30px 20px;
        }
        .order-info {
          background-color: #f9fafb;
          border-radius: 5px;
          padding: 15px;
          margin-bottom: 20px;
        }
        .alert {
          background-color: #FEE2E2;
          border-left: 4px solid #EF4444;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
        }
        .button {
          display: inline-block;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 5px;
          font-weight: 600;
          margin-top: 15px;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          font-size: 14px;
          color: #666;
          border-top: 1px solid #eaeaea;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="logo">` : ''}
          <h1>${storeName}</h1>
        </div>
        
        <div class="content">
          <div class="alert">
            <h2 style="margin-top: 0;">การชำระเงินถูกปฏิเสธ</h2>
            <p>การชำระเงินของคุณสำหรับคำสั่งซื้อนี้ถูกปฏิเสธ เนื่องจาก: <strong>${payment.reject_reason}</strong></p>
          </div>
          
          <div class="order-info">
            <h3 style="margin-top: 0;">ข้อมูลคำสั่งซื้อ</h3>
            <p><strong>รหัสคำสั่งซื้อ:</strong> ${order.order_id}</p>
            <p><strong>วันที่สั่งซื้อ:</strong> ${new Date(order.order_date).toLocaleString('th-TH')}</p>
            <p><strong>จำนวนเงินที่ต้องชำระ:</strong> ฿${parseFloat(order.total_amount).toFixed(2)}</p>
          </div>
          
          <p>กรุณาทำการชำระเงินใหม่อีกครั้งด้วยยอดเงินที่ถูกต้อง โดยคลิกที่ปุ่มด้านล่าง:</p>
          
          <div style="text-align: center;">
            <a href="${ScriptApp.getService().getUrl()}" class="button">ไปที่หน้าชำระเงิน</a>
          </div>
          
          <p style="margin-top: 20px;">หากคุณมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อเราที่อีเมล ${STORE_EMAIL}</p>
        </div>
        
        <div class="footer">
          <p>ขอบคุณที่ใช้บริการกับเรา</p>
          <p>&copy; ${new Date().getFullYear()} ${storeName} - สงวนลิขสิทธิ์</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // สร้าง plain text version
    var plainBody = `การชำระเงินถูกปฏิเสธ\n\n`;
    plainBody += `เรียนลูกค้า\n\n`;
    plainBody += `การชำระเงินของคุณสำหรับคำสั่งซื้อนี้ถูกปฏิเสธ เนื่องจาก: ${payment.reject_reason}\n\n`;
    plainBody += `ข้อมูลคำสั่งซื้อ:\n`;
    plainBody += `รหัสคำสั่งซื้อ: ${order.order_id}\n`;
    plainBody += `วันที่สั่งซื้อ: ${new Date(order.order_date).toLocaleString('th-TH')}\n`;
    plainBody += `จำนวนเงินที่ต้องชำระ: ฿${parseFloat(order.total_amount).toFixed(2)}\n\n`;
    plainBody += `กรุณาทำการชำระเงินใหม่อีกครั้งด้วยยอดเงินที่ถูกต้อง โดยไปที่เว็บไซต์ของเรา\n\n`;
    plainBody += `หากคุณมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อเราที่อีเมล ${STORE_EMAIL}\n\n`;
    plainBody += `ขอบคุณที่ใช้บริการ,\n${storeName}`;
    
    // ส่งอีเมล
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      body: plainBody
    });
    
    return {
      status: 'success',
      message: 'ส่งอีเมลแจ้งการปฏิเสธการชำระเงินเรียบร้อยแล้ว'
    };
  } catch (error) {
    logError('notifyRejectedPayment', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการส่งอีเมลแจ้งการปฏิเสธการชำระเงิน: ' + error.message
    };
  }
}

// แก้ไขฟังก์ชันแจ้งเตือน Telegram ให้รองรับกรณีปฏิเสธการชำระเงิน
function notifyPaymentStatusChanged(payment, status) {
  try {
    var configResult = getConfigJSON();
    
    if (configResult.status === 'error') {
      return configResult;
    }
    
    var config = configResult.config;
    var storeName = config.store_name || 'ร้านค้าดิจิทัลออนไลน์';
    
    // ดึงข้อมูลคำสั่งซื้อ
    var orderResult = getOrderJSON(payment.order_id);
    var orderInfo = '';
    
    if (orderResult.status === 'success') {
      var order = orderResult.order;
      orderInfo = 'คำสั่งซื้อ: ' + order.customer.name + ' (' + order.total_amount + ' บาท)';
    }
    
    var icon = (status === 'completed') ? '✅' : (status === 'rejected') ? '❌' : '🔄';
    var statusText = (status === 'completed') ? 'ยืนยันแล้ว' : (status === 'rejected') ? 'ถูกปฏิเสธ' : 'อัพเดทสถานะเป็น ' + status;
    
    var message = `<b>${icon} การชำระเงิน${statusText}!</b>\n\n`;
    message += `<b>ร้าน:</b> ${storeName}\n`;
    message += `<b>รหัสการชำระเงิน:</b> ${payment.payment_id}\n`;
    message += `<b>รหัสคำสั่งซื้อ:</b> ${payment.order_id}\n`;
    message += `<b>${orderInfo}</b>\n`;
    message += `<b>วันที่ชำระ:</b> ${new Date(payment.payment_date).toLocaleString('th-TH')}\n`;
    message += `<b>จำนวนเงิน:</b> ${payment.amount} บาท\n`;
    
    if (status === 'rejected' && payment.reject_reason) {
      message += `<b>เหตุผลที่ปฏิเสธ:</b> ${payment.reject_reason}\n`;
    }
    
    return sendTelegramNotification(message);
  } catch (error) {
    logError('notifyPaymentStatusChanged', error);
    return {
      status: 'error',
      message: 'เกิดข้อผิดพลาดในการแจ้งเตือนการเปลี่ยนสถานะการชำระเงิน: ' + error.message
    };
  }
}