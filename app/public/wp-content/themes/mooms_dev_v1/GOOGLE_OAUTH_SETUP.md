# 🔐 Hướng dẫn cấu hình Google OAuth Login

## 📋 Tổng quan

Theme đã được tích hợp Google OAuth login cho trang `/wp-login.php`. Người dùng có thể đăng nhập/đăng ký bằng tài khoản Google.

## 🛠️ Cấu hình Google OAuth

### Bước 1: Tạo Google OAuth App

1. **Truy cập Google Cloud Console**
   - Đi đến: https://console.cloud.google.com/
   - Đăng nhập bằng tài khoản Google

2. **Tạo Project mới**
   - Click "Select a project" → "New Project"
   - Đặt tên project (ví dụ: "WordPress OAuth")
   - Click "Create"

3. **Bật Google+ API**
   - Vào "APIs & Services" → "Library"
   - Tìm "Google+ API" và click "Enable"

4. **Tạo OAuth 2.0 Credentials**
   - Vào "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Chọn "Web application"
   - Đặt tên (ví dụ: "WordPress Login")

5. **Cấu hình Authorized redirect URIs**
   ```
   https://yourdomain.com/wp-admin/admin-ajax.php?action=google_login
   https://yourdomain.com/wp-login.php
   ```
   - Thay `yourdomain.com` bằng domain thực tế của bạn

6. **Lấy thông tin**
   - Copy "Client ID" và "Client Secret"
   - Lưu lại để cấu hình trong WordPress

### Bước 2: Cấu hình trong WordPress

#### Cách 1: Qua WordPress Options (Khuyến nghị)

Thêm vào file `wp-config.php`:
```php
// Google OAuth Configuration
define('GOOGLE_CLIENT_ID', 'your_client_id_here');
define('GOOGLE_CLIENT_SECRET', 'your_client_secret_here');
define('GOOGLE_REDIRECT_URI', 'https://yourdomain.com/wp-admin/admin-ajax.php?action=google_login');
```

#### Cách 2: Qua Database Options

Thêm vào functions.php hoặc plugin:
```php
// Cấu hình Google OAuth
update_option('google_client_id', 'your_client_id_here');
update_option('google_client_secret', 'your_client_secret_here');
update_option('google_redirect_uri', 'https://yourdomain.com/wp-admin/admin-ajax.php?action=google_login');
```

#### Cách 3: Qua Admin Panel (Nếu có)

Nếu theme có trang cấu hình, thêm các field:
- Google Client ID
- Google Client Secret  
- Google Redirect URI

### Bước 3: Cài đặt Composer Dependencies

Đảm bảo đã cài đặt `overtrue/socialite`:

```bash
composer require overtrue/socialite
```

Hoặc thêm vào `composer.json`:
```json
{
    "require": {
        "overtrue/socialite": "^3.0"
    }
}
```

## 🎯 Cách hoạt động

### 1. **User click "Đăng nhập với Google"**
- JavaScript gọi AJAX endpoint `google_login`
- Server trả về Google OAuth URL
- Browser redirect đến Google

### 2. **User xác thực trên Google**
- Google hiển thị trang xác thực
- User đăng nhập và cấp quyền
- Google redirect về callback URL

### 3. **Xử lý callback**
- Server nhận code từ Google
- Lấy thông tin user từ Google API
- Tạo hoặc tìm user trong WordPress
- Đăng nhập user và redirect

## 🔧 Tùy chỉnh

### Thay đổi role mặc định cho user mới

Trong file `theme/setup/users/auth.php`, tìm dòng:
```php
'role' => 'subscriber'
```

Thay đổi thành role mong muốn:
```php
'role' => 'customer'  // Cho WooCommerce
'role' => 'editor'    // Cho editor
```

### Thêm thông tin user từ Google

Trong hàm `handleGoogleOAuthCallback()`, có thể thêm:
```php
// Lưu thêm thông tin
update_user_meta($user->ID, '_google_name', $googleUser->getName());
update_user_meta($user->ID, '_google_avatar', $googleUser->getAvatar());
update_user_meta($user->ID, '_google_locale', $googleUser->getLocale());
```

### Tùy chỉnh redirect sau đăng nhập

Thay đổi logic redirect:
```php
// Redirect theo role
if (in_array('administrator', $user->roles)) {
    $redirect_to = admin_url();
} else {
    $redirect_to = home_url('/dashboard/');
}
```

## 🐛 Troubleshooting

### Lỗi "Invalid redirect URI"
- Kiểm tra redirect URI trong Google Console
- Đảm bảo domain chính xác (không có www hoặc có www)
- Kiểm tra HTTPS/HTTP

### Lỗi "Client ID not found"
- Kiểm tra `google_client_id` option
- Đảm bảo đã cấu hình đúng trong wp-config.php

### Lỗi "SocialiteManager not found"
- Cài đặt composer dependencies
- Kiểm tra autoload trong composer.json

### Nút Google không hiển thị
- Kiểm tra `google_client_id` option có giá trị
- Kiểm tra class `CustomLoginPage` đã được load
- Kiểm tra CSS/JS đã được enqueue

## 📱 Testing

### Test trên localhost
1. Sử dụng ngrok để tạo public URL
2. Cấu hình redirect URI với ngrok URL
3. Test đăng nhập Google

### Test trên staging
1. Cấu hình Google OAuth với staging domain
2. Test đầy đủ flow đăng nhập
3. Kiểm tra user được tạo đúng

## 🔒 Bảo mật

### Best Practices
- Không commit Client Secret vào git
- Sử dụng environment variables
- Giới hạn redirect URIs
- Kiểm tra state parameter
- Log các lỗi OAuth

### Environment Variables
```php
// wp-config.php
define('GOOGLE_CLIENT_ID', $_ENV['GOOGLE_CLIENT_ID']);
define('GOOGLE_CLIENT_SECRET', $_ENV['GOOGLE_CLIENT_SECRET']);
```

## 📊 Monitoring

### Log OAuth Events
```php
// Thêm vào handleGoogleOAuthCallback()
error_log('Google OAuth Success: ' . $email);
error_log('Google OAuth Error: ' . $e->getMessage());
```

### Track User Registration
```php
// Thêm vào sau wp_insert_user()
do_action('google_user_registered', $user_id, $googleUser);
```

## 🎉 Kết luận

Sau khi cấu hình xong:
1. Truy cập `/wp-login.php`
2. Sẽ thấy nút "Đăng nhập với Google"
3. Click và test flow đăng nhập
4. User mới sẽ được tạo tự động
5. User cũ sẽ được đăng nhập trực tiếp

Nếu gặp vấn đề, kiểm tra error logs và đảm bảo tất cả dependencies đã được cài đặt đúng.
