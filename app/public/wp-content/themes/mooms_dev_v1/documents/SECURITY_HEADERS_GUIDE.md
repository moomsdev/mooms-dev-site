# 🛡️ Hướng dẫn cấu hình Security Headers & Resource Hints

## 📋 Tổng quan

Theme đã được tích hợp đầy đủ Security Headers và Resource Hints để tối ưu bảo mật và hiệu năng.

## 🔧 Cấu hình trong Admin

Truy cập: `/wp-admin/admin.php?page=mms-tools`

### **Tab "Security Headers"**

#### 1. **X-Frame-Options** ✅ Khuyến nghị BẬT
- **Mục đích:** Ngăn site bị nhúng vào iframe (chống clickjacking)
- **Cài đặt:** Chỉ cần tick checkbox "Bật X-Frame-Options"
- **Giá trị:** SAMEORIGIN (chỉ cho phép iframe từ cùng domain)

#### 2. **X-Content-Type-Options** ✅ Khuyến nghị BẬT
- **Mục đích:** Ngăn browser đoán sai MIME type
- **Cài đặt:** Tick checkbox "Bật X-Content-Type-Options"
- **Giá trị:** nosniff

#### 3. **Referrer-Policy** ✅ Khuyến nghị BẬT
- **Mục đích:** Kiểm soát thông tin referrer gửi đi
- **Cài đặt:** 
  - Tick checkbox "Bật Referrer-Policy"
  - Chọn giá trị: **strict-origin-when-cross-origin** (khuyến nghị)

#### 4. **HSTS (Strict-Transport-Security)** ⚠️ CHỈ BẬT KHI CÓ SSL
- **Mục đích:** Bắt buộc HTTPS, ngăn downgrade attack
- **Cài đặt:**
  ```
  ✅ Bật HSTS
  Max Age: 31536000 (1 năm)
  ✅ Include Subdomains (nếu tất cả subdomain đều có SSL)
  □ HSTS Preload (chỉ khi sẵn sàng đăng ký tại hstspreload.org)
  ```
- **⚠️ CẢNH BÁO:** 
  - Chỉ bật khi site ĐÃ CÓ SSL certificate
  - Một khi bật, KHÔNG THỂ tắt ngay (phải đợi max-age hết hạn)
  - Test kỹ trước khi bật Preload

#### 5. **CSP (Content-Security-Policy)** 🧪 TEST KỸ TRƯỚC KHI BẬT
- **Mục đích:** Ngăn XSS và injection attacks
- **Cài đặt bước 1 - TEST MODE:**
  ```
  ✅ Bật CSP
  CSP Mode: Report Only (không block, chỉ log)
  Allowed Domains:
    fonts.googleapis.com
    fonts.gstatic.com
    cdnjs.cloudflare.com
    [thêm domains bạn dùng, mỗi domain 1 dòng]
  
  ✅ Allow Inline Scripts (nếu theme dùng inline <script>)
  ✅ Allow Inline Styles (nếu theme dùng inline <style>)
  □ Allow Eval (KHÔNG khuyến nghị)
  ```

- **Cài đặt bước 2 - ENFORCE (sau khi test OK):**
  ```
  CSP Mode: Enforce (block vi phạm)
  ```

- **Report URI (Optional):**
  - Nhập URL endpoint nhận CSP violation reports
  - Ví dụ: `https://yoursite.com/csp-report`

#### 6. **Permissions-Policy**
- **Mục đích:** Tắt các API nhạy cảm không dùng
- **Cài đặt mặc định (khuyến nghị):**
  ```
  □ Cho phép Camera (tắt)
  □ Cho phép Microphone (tắt)
  □ Cho phép Geolocation (tắt)
  □ Cho phép Payment (tắt)
  □ Cho phép USB (tắt)
  □ Cho phép Autoplay (tắt)
  ```
- **Chỉ BẬT nếu:**
  - Camera/Microphone: Site có video call, WebRTC
  - Geolocation: Site cần vị trí user (map, store locator)
  - Payment: Site dùng Payment Request API
  - Autoplay: Cho phép video/audio tự động phát

---

### **Tab "Resource Hints"**

#### 1. **Preconnect Domains** (MAX 3)
- **Dùng cho:** 2-3 domains QUAN TRỌNG NHẤT
- **Ví dụ:**
  ```
  cdn.yoursite.com
  fonts.gstatic.com
  ```
- **⚠️ LÁT CHÚ Ý:**
  - Chỉ nhập domain, KHÔNG có `https://` hay `//`
  - Tối đa 3 domains (nhiều hơn = chậm hơn)

#### 2. **DNS-Prefetch Domains**
- **Dùng cho:** Domains ít quan trọng hơn
- **Ví dụ:**
  ```
  www.google-analytics.com
  connect.facebook.net
  platform.twitter.com
  www.googletagmanager.com
  ```

#### 3. **Prefetch (Tự động)**
- Tự động prefetch:
  - Blog page (từ homepage)
  - Next/prev post (từ single post)

---

## 🧪 Testing & Validation

### **1. Test Security Headers**

**Sau khi cấu hình, test tại:**
- https://securityheaders.com (nhập domain của bạn)
- https://observatory.mozilla.org

**Mục tiêu:**
- Security Headers Score: **A+**
- Không có warning quan trọng

### **2. Test CSP**

**Bước 1: Bật Report-Only mode**
1. Bật CSP với mode "Report Only"
2. Browse toàn bộ site (tất cả pages)
3. Mở Console (F12) → Tab "Console"
4. Tìm CSP violation errors (màu đỏ)

**Bước 2: Fix violations**
- Nếu thấy error "refused to load script from X"
  → Thêm domain X vào "Allowed Domains"
- Nếu thấy "refused to execute inline script"
  → Tick "Allow Inline Scripts" (hoặc refactor ra file .js)

**Bước 3: Enforce**
- Sau khi không còn errors → Chuyển sang mode "Enforce"

### **3. Test Resource Hints**

**Bước 1: Kiểm tra Network**
1. Mở DevTools (F12) → Tab "Network"
2. Reload page (Ctrl+R)
3. Click vào 1 request
4. Tab "Timing" → Check:
   - DNS Lookup time (nên < 50ms với dns-prefetch)
   - Connection time (nên < 100ms với preconnect)

**Bước 2: Lighthouse Audit**
1. Mở DevTools → Tab "Lighthouse"
2. Chọn "Performance" + "Desktop"
3. Click "Analyze page load"
4. Kiểm tra:
   - ✅ "Preconnect to required origins" → Không xuất hiện
   - ✅ LCP cải thiện

---

## 📊 Expected Results

### **Security (sau khi bật headers)**
- 🛡️ Security Headers Score: **A+**
- 🔒 HSTS preload eligible
- 🚫 Clickjacking protected
- 🔐 XSS mitigated (với CSP)

### **Performance (sau khi config resource hints)**
- ⚡ DNS lookup: Giảm **50-100ms**
- 🚀 Connection time: Giảm **100-200ms**
- 📊 Lighthouse: "Preconnect" warning biến mất
- 🎯 TTI: Cải thiện **200-500ms**

---

## ⚠️ Troubleshooting

### **Vấn đề 1: Site không load sau khi bật CSP**
**Nguyên nhân:** CSP block resources cần thiết

**Giải pháp:**
1. Tạm tắt CSP hoặc chuyển về Report-Only
2. Check Console → tìm domains bị block
3. Thêm vào "Allowed Domains"
4. Test lại

### **Vấn đề 2: HSTS báo lỗi "net::ERR_SSL_PROTOCOL_ERROR"**
**Nguyên nhân:** HSTS đã bật nhưng SSL chưa cài hoặc bị lỗi

**Giải pháp:**
1. Fix SSL certificate
2. Chờ HSTS max-age expire (hoặc clear browser cache)
3. Test lại

### **Vấn đề 3: Preconnect không có tác dụng**
**Nguyên nhân:** 
- Quá nhiều preconnect (>3)
- Domain không đúng

**Giải pháp:**
1. Chỉ giữ lại 2-3 domains QUAN TRỌNG nhất
2. Verify domain đúng format (không có https://)
3. Check Network tab xem có preconnect request không

---

## 🔗 Resources

- [MDN: Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [MDN: HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [MDN: Resource Hints](https://developer.mozilla.org/en-US/docs/Web/Performance/dns-prefetch)
- [OWASP: Security Headers](https://owasp.org/www-project-secure-headers/)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [HSTS Preload](https://hstspreload.org/)

---

## 📝 Changelog

### v1.0 - Initial Release
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ HSTS với preload support
- ✅ Content-Security-Policy với report-only mode
- ✅ Permissions-Policy
- ✅ Resource Hints (preconnect, dns-prefetch, prefetch)
- ✅ Admin UI đầy đủ trong Tools > Security Headers & Resource Hints

