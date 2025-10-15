# 🔐 Hướng dẫn Authentication (AJAX JSON, Google OAuth, Welcome Notice)

## 1) Tổng quan
- Chuẩn hóa API AJAX trả JSON cho: đăng nhập, đăng ký, quên mật khẩu.
- Tích hợp Google OAuth vào `/wp-login.php` (Overtrue/Socialite).
- Thông báo chào mừng trong Admin sau khi đăng nhập (SweetAlert2).

## 2) Cấu trúc & Vị trí code
- Handlers chính:
  - `theme/setup/users/auth.php` (AJAX login/register/reset, Google OAuth callback)
- Login page & assets:
  - `app/src/Settings/CustomLoginPage.php` (render nút Google, enqueue `custom-login.js/css`)
  - `resources/admin/js/login.js` (AJAX gọi Google OAuth URL)
- Admin Welcome Notice:
  - `app/src/Settings/AdminSettings.php` (hook `wp_login` set flag, `admin_footer` hiển thị Swal)
- JS Admin bundle:
  - `resources/scripts/admin/index.js` (import SweetAlert2 và gán `window.Swal`)

## 3) AJAX JSON API (Chi tiết)
1) Đăng nhập (Login)
- Mục đích: xác thực user, trả JSON gồm `redirect_to`, `user`.
- Cách hoạt động: nhận `user_login/password`, verify nonce, `wp_signon`, `wp_send_json_*`.
- Vị trí code: `theme/setup/users/auth.php` → hàm `mm_user_login()`
- Lưu ý:
  - Nonce: `check_ajax_referer('user_dang_nhap', '_token')`
  - Sanitize: `sanitize_user`, `sanitize_text_field`
  - Lỗi: trả status 401/400 hợp lý

2) Đăng ký (Register)
- Mục đích: tạo tài khoản mới, trả thông tin user.
- Cách hoạt động: validate họ/tên/email/pass, `wp_insert_user` và `wp_send_json_*`.
- Vị trí code: `theme/setup/users/auth.php` → `mm_user_register()`
- Lưu ý:
  - Kiểm tra email tồn tại, pass khớp, độ dài
  - Set role mặc định cho user mới (subscriber)

3) Quên mật khẩu (Reset)
- Mục đích: gửi email đặt lại mật khẩu.
- Cách hoạt động: `retrieve_password()` hoặc tự gửi, trả JSON thông báo.
- Vị trí code: `theme/setup/users/auth.php` → `mm_user_reset_password()`

4) JS phía client (Form handler)
- Vị trí gợi ý: `resources/scripts/theme/auth-handler.js`
- Mẫu gọi:
```js
jQuery.post(ajaxurl, { action: 'user_login', _token, user_login, user_password }, (res)=>{ /* ... */ });
```

## 4) Google OAuth (Chi tiết)
1) Cấu hình
- `wp-config.php`:
```php
define('GOOGLE_CLIENT_ID', 'xxx');
define('GOOGLE_CLIENT_SECRET', 'xxx');
define('GOOGLE_REDIRECT_URI', 'https://yourdomain.com/wp-login.php?action=google_callback');
```

2) Nút "Đăng nhập với Google"
- Vị trí code: `app/src/Settings/CustomLoginPage.php` → `addGoogleLoginButtonToForm()`
- Tài nguyên: `login_head` in CSS, enqueue `custom-login.js`
- JS gọi AJAX lấy URL:
  - `resources/admin/js/login.js`

3) Endpoint lấy URL Google
- Vị trí code: `theme/setup/users/auth.php` → `googleLogin()`
- Logic: tạo Socialite driver, gọi `redirect()` để lấy URL, trả JSON `{url}`

4) Callback xử lý
- Vị trí code: `theme/setup/users/auth.php` → `handleGoogleOAuthCallback()`
- Logic: lấy profile, tìm/tạo user (role subscriber), `wp_set_auth_cookie()`, redirect theo role.
- Tùy chỉnh:
  - Thay role mặc định khi tạo tài khoản mới
  - Điều chỉnh redirect (admin/home)

5) Troubleshooting
- `redirect_uri_mismatch`: đồng bộ URL ở Google Console và `GOOGLE_REDIRECT_URI` (phải có `action=google_callback`).
- Thiếu SweetAlert: đảm bảo `dist/admin.js` import `sweetalert2` và gán `window.Swal`.

## 5) Welcome Notice trong Admin (SweetAlert2)
- Mục đích: hiển thị "Xin chào {display_name}" sau khi đăng nhập.
- Cách hoạt động:
  1) Hook `wp_login` set `_show_admin_welcome=yes` cho user (vị trí: `AdminSettings.php`).
  2) `admin_footer` in script chờ `window.Swal` sẵn sàng, hiển thị alert, sau đó xoá meta.
- Tùy chỉnh thời gian/kiểu: sửa trong inline script của `admin_footer` hoặc dịch sang file JS riêng.

## 6) Kiểm thử
- `/wp-login.php`: thấy nút Google, test login thường và bằng Google.
- Sau đăng nhập: vào Admin phải thấy SweetAlert xuất hiện 1 lần.
- Kiểm tra `wp_usermeta` cho flag `_show_admin_welcome` đã bị xoá sau khi hiển thị.

## 7) Tóm tắt đường dẫn nhanh
- Login page: `/wp-login.php`
- AJAX URL: `admin_url('admin-ajax.php')`
- Callback OAuth: `/wp-login.php?action=google_callback`
- Files then chốt: `theme/setup/users/auth.php`, `CustomLoginPage.php`, `AdminSettings.php`
