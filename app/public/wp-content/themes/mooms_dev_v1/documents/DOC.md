# 📘 Tài liệu tổng hợp theme mooms_dev_v1

Tài liệu này tóm tắt nhóm chức năng chính của theme và liên kết tới hướng dẫn chi tiết. Dành cho quản trị viên và lập trình viên cần overview nhanh.

## 1) Nhóm chức năng

### 1.1. Authentication & Login
- AJAX JSON cho đăng nhập/đăng ký/đặt lại mật khẩu
- Google OAuth trên `/wp-login.php`
- SweetAlert2 welcome sau đăng nhập ở Admin
- Hướng dẫn chi tiết: `documents/AUTH_GUIDE.md`

### 1.2. MMS Admin & Tools
- Security Headers (X-Frame-Options, CSP, HSTS, v.v.)
- Resource Hints (Preconnect, DNS-Prefetch, Prefetch)
- Database Cleanup (Tools → DB Cleanup)
- Hướng dẫn chi tiết: `documents/ADMIN_GUIDE.md`

### 1.3. Build & Hiệu năng
- Pipeline tạo `dist/` (critical CSS, service worker, manifest)
- Hash filename, preload tài nguyên, code splitting
- Hướng dẫn chi tiết: `documents/BUILD_GUIDE.md`

### 1.4. Database & Caching
- Transient caching utilities (`CacheHelper`)
- Query optimization utilities (`QueryOptimizer`)
- Database cleanup theo lịch (`DatabaseCleaner`)
- Hướng dẫn chi tiết: `documents/CACHING_GUIDE.md`

## 2) Vị trí menu & đường dẫn nhanh
- MMS Admin: `/wp-admin/admin.php?page=mms-admin`
- MMS Tools: `/wp-admin/admin.php?page=mms-tools`
- DB Cleanup: `/wp-admin/tools.php?page=mms-db-cleanup`

## 3) Tệp/lớp quan trọng
- `app/src/Settings/AdminSettings.php`: Tuỳ chỉnh admin, assets, hooks hỗ trợ welcome notice
- `app/src/Settings/CustomLoginPage.php`: Nút Google trên trang login
- `theme/setup/users/auth.php`: AJAX auth handlers + Google OAuth callback
- `app/src/Settings/MMSTools/SecurityHeaders.php`: Gửi security headers theo option
- `theme/setup/assets.php`: Resource Hints
- `app/src/Settings/MMSTools/{CacheHelper,QueryOptimizer,DatabaseCleaner}.php`: Caching/DB optimization
- `app/helpers/cache.php`: Helper wrappers

## 4) Hướng dẫn nhanh theo vai trò
- Quản trị viên:
  - Bảo mật: Vào MMS Tools → Security Headers, bật các header cơ bản
  - Tối ưu kết nối: MMS Tools → Resource Hints (chỉ nhập domain, không https://)
  - Dọn DB: Tools → DB Cleanup → Run Cleanup Now
- Lập trình viên:
  - Dùng helper `get_cached_query`, `get_optimized_posts`, `prime_posts_cache`
  - Theo dõi query chậm: error_log từ `QueryOptimizer::monitor_query`
  - Cấu hình Google OAuth bằng constants trong `wp-config.php`

## 5) Ghi chú & khuyến nghị
- CSP: chạy Report‑Only trước khi Enforce, theo dõi console errors
- HSTS: chỉ bật khi đã có HTTPS ổn định
- Preconnect: tối đa 2–3 origin quan trọng
- Duy trì cache key đặt tên nhất quán để dễ clear/invalidate

---

Tài liệu chi tiết nằm trong thư mục `documents/`:
- `AUTH_GUIDE.md`
- `ADMIN_GUIDE.md`
- `CACHING_GUIDE.md`
- `BUILD_GUIDE.md`

