# 🔐 Hướng dẫn Authentication (AJAX JSON, Google OAuth, Welcome Notice)

## 1) Tổng quan
- Chuẩn hóa API AJAX trả JSON cho: đăng nhập, đăng ký, quên mật khẩu.
- Tích hợp Google OAuth vào `/wp-login.php` (Overtrue/Socialite).
- Thông báo chào mừng trong Admin sau khi đăng nhập (SweetAlert2).

## 2) Cấu trúc & Files liên quan
- `theme/setup/users/auth.php`: Handlers AJAX + Google OAuth callback.
- `app/src/Settings/CustomLoginPage.php`: Thêm nút "Đăng nhập với Google" vào trang login và enqueue assets.
- `app/src/Settings/AdminSettings.php`: Gắn cờ hiển thị welcome notice sau đăng nhập và enqueue `dist/admin.js` (expose `window.Swal`).
- `resources/scripts/admin/login.js`: JS gọi AJAX lấy URL Google OAuth.

## 3) AJAX JSON API
- Endpoints:
  - `wp_ajax_nopriv_user_login`, `wp_ajax_user_login`
  - `wp_ajax_nopriv_user_register`, `wp_ajax_user_register`
  - `wp_ajax_nopriv_user_reset_password`, `wp_ajax_user_reset_password`
- Response mẫu:
```json
{ "success": true, "data": { "message": "OK", "redirect_to": "/", "user": {"id": 1} } }
```
- Lưu ý triển khai:
  - Verify nonce với `check_ajax_referer()` per action.
  - Sanitize input: `sanitize_user`, `sanitize_email`, `sanitize_text_field`.
  - Dùng `wp_send_json_success()`/`wp_send_json_error()` và set HTTP status hợp lý.

## 4) Google OAuth
- Thư viện: `overtrue/socialite` (Composer).
- Cấu hình đề xuất (wp-config.php):
```php
define('GOOGLE_CLIENT_ID', 'xxx');
define('GOOGLE_CLIENT_SECRET', 'xxx');
define('GOOGLE_REDIRECT_URI', 'https://yourdomain.com/wp-login.php?action=google_callback');
```
- Luồng hoạt động:
  1) JS gọi AJAX endpoint để lấy redirect URL Google.
  2) User xác thực tại Google.
  3) Callback xử lý: tìm/tạo user (role mặc định subscriber), `wp_set_auth_cookie()`, redirect theo role.
- Tùy chỉnh:
  - Đổi role mặc định khi đăng ký lần đầu.
  - Logic redirect theo role (admin → `/wp-admin/`, user → home hoặc dashboard).
- Troubleshooting thường gặp:
  - `redirect_uri_mismatch`: đồng bộ chính xác URI trong Google Console và `GOOGLE_REDIRECT_URI`.
  - Kiểm tra HTTPS, domain khớp, tham số `action=google_callback` đúng.

## 5) Welcome Notice (SweetAlert2)
- Sau khi đăng nhập (mọi cách), hook `wp_login` gắn cờ `_show_admin_welcome=yes` cho user.
- `admin_footer` in script đợi `window.Swal` rồi hiển thị: "Xin chào {display_name}" và xoá cờ.
- Yêu cầu: `dist/admin.js` cần `window.Swal = require('sweetalert2')`.

## 6) Hướng dẫn tích hợp Frontend
- Trang login: enqueue `custom-login.js` và localize `ajax_object.ajax_url`.
- JS mẫu mở Google OAuth:
```js
jQuery('#mm-login-google').on('click', function(e){
  e.preventDefault();
  jQuery.post(ajax_object.ajax_url, { action: 'google_login' }, function(res){
    if (res?.data?.url) window.location.href = res.data.url;
  });
});
```

## 7) Kiểm thử
- Truy cập `/wp-login.php` thấy nút Google.
- Đăng nhập thường và qua Google: đảm bảo redirect đúng, hiện thông báo chào mừng.
- Kiểm tra error_log nếu gặp lỗi OAuth.
