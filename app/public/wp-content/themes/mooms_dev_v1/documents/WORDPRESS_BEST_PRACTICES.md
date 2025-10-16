# WordPress Best Practices - Tránh lỗi phổ biến

## 🚫 NGUYÊN TẮC QUAN TRỌNG

### 1. **KHÔNG BAO GIỜ OUTPUT TRỰC TIẾP trong Class/Function**

#### ❌ SAI (gây lỗi JSON response):
```php
class MyClass {
    public function __construct() {
        // ❌ Output trực tiếp trong constructor
        echo '<script>console.log("hello");</script>';
        
        // ❌ Output trực tiếp trong method
        if (!is_admin()) {
            ?><div>Content</div><?php
        }
    }
}
```

#### ✅ ĐÚNG (dùng WordPress hooks):
```php
class MyClass {
    public function __construct() {
        // ✅ Dùng hook để output
        add_action('wp_footer', [$this, 'addScript'], 999);
        add_action('wp_head', [$this, 'addHeadContent']);
    }
    
    public function addScript() {
        ?>
        <script>console.log("hello");</script>
        <?php
    }
    
    public function addHeadContent() {
        echo '<meta name="custom" content="value">';
    }
}
```

---

## 🔴 LỖI PHỔ BIẾN: "The response is not a valid JSON response"

### Nguyên nhân:
- Output (echo, print, HTML) được gửi TRƯỚC khi REST API response
- WordPress REST API cần **pure JSON**, mọi output khác sẽ làm hỏng JSON

### Các trường hợp gây lỗi:

#### 1. Output trong Constructor
```php
❌ class Security {
    public function __construct() {
        ?><script>...</script><?php  // Lỗi!
    }
}
```

#### 2. Output trong Method được gọi sớm
```php
❌ public function addPerformanceMonitoring() {
    if (!is_admin()) {
        echo '<script>...</script>';  // Lỗi nếu gọi trong init
    }
}
```

#### 3. Whitespace/BOM ở đầu file
```php
❌ [space][space]<?php  // Có space trước <?php
❌ [BOM]<?php          // Có BOM (Byte Order Mark)
```

#### 4. Newline/Space sau closing tag
```php
❌ ?>[newline]  // Có newline sau ?>
❌ ?>[space]    // Có space sau ?>
```

---

## ✅ GIẢI PHÁP ĐÚNG

### 1. Luôn dùng WordPress Hooks cho Output

```php
class MyPlugin {
    public function __construct() {
        // Frontend
        add_action('wp_head', [$this, 'addHeadContent']);
        add_action('wp_footer', [$this, 'addFooterScript'], 999);
        
        // Admin
        add_action('admin_head', [$this, 'addAdminStyles']);
        add_action('admin_footer', [$this, 'addAdminScript']);
        
        // Login page
        add_action('login_head', [$this, 'addLoginStyles']);
        add_action('login_footer', [$this, 'addLoginScript']);
    }
}
```

### 2. Không dùng PHP Closing Tag `?>`

```php
✅ <?php
// Code here
// Kết thúc file KHÔNG CẦN ?>
```

**Lý do:** Tránh vô tình thêm whitespace/newline sau `?>`

### 3. Kiểm tra BOM trong file

```bash
# Tìm file có BOM
find . -name "*.php" -exec sh -c 'head -c 3 "$1" | od -An -tx1 | grep -q "ef bb bf" && echo "BOM: $1"' _ {} \;

# Xóa BOM
sed -i '1s/^\xEF\xBB\xBF//' file.php
```

### 4. Kiểm tra headers đã gửi chưa

```php
// Debug: Kiểm tra headers
$file = $line = null;
if (headers_sent($file, $line)) {
    error_log("Headers sent from: $file at line $line");
}
```

---

## 📋 CHECKLIST TRƯỚC KHI COMMIT CODE

### File PHP:
- [ ] Không có output trực tiếp ngoài hooks
- [ ] Không có `?>` ở cuối file
- [ ] Không có whitespace/BOM ở đầu file
- [ ] Không có `echo`/`print`/`var_dump` trong constructor
- [ ] Tất cả output đều qua hooks (`wp_head`, `wp_footer`, etc.)

### REST API/AJAX:
- [ ] Dùng `wp_send_json_success()` và `wp_send_json_error()`
- [ ] Verify nonce trước khi xử lý
- [ ] Sanitize input, escape output
- [ ] Không có output nào trước `wp_send_json*()`

### Security:
- [ ] REST API cho phép logged-in users
- [ ] AJAX handlers có kiểm tra capabilities
- [ ] Nonce được verify đúng cách
- [ ] Input được sanitize/validate

---

## 🛠️ TOOLS DEBUG

### 1. Tìm output trực tiếp trong PHP
```bash
# Tìm echo/print ngoài hooks
grep -rn "^\s*echo\|^\s*print\|^\s*?>" app/src/

# Tìm closing tag
grep -rn "?>" app/src/ | grep -v "//"
```

### 2. Test REST API
```javascript
// Browser console
fetch('/wp-json/wp/v2/types/page', {credentials: 'include'})
  .then(r => r.text())
  .then(text => {
    console.log('Raw:', text);
    console.log('JSON:', JSON.parse(text));
  });
```

### 3. Check headers
```php
// Thêm vào wp-config.php để debug
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// Trong code
add_action('init', function() {
    if (headers_sent($file, $line)) {
        error_log("Headers from $file:$line");
    }
});
```

---

## 📚 TÀI LIỆU THAM KHẢO

### WordPress Hooks quan trọng:

**Frontend:**
- `wp_head` - Output trong `<head>`
- `wp_footer` - Output trước `</body>`
- `wp_body_open` - Ngay sau `<body>`

**Admin:**
- `admin_head` - Admin `<head>`
- `admin_footer` - Admin footer
- `admin_notices` - Hiển thị thông báo admin

**Login:**
- `login_head` - Login page `<head>`
- `login_footer` - Login page footer
- `login_form` - Trong form login

**AJAX:**
- `wp_ajax_{action}` - AJAX cho logged-in users
- `wp_ajax_nopriv_{action}` - AJAX cho guests

### REST API:
```php
// Custom endpoint
add_action('rest_api_init', function() {
    register_rest_route('my-plugin/v1', '/data', [
        'methods' => 'GET',
        'callback' => 'my_callback',
        'permission_callback' => function() {
            return current_user_can('edit_posts');
        }
    ]);
});

function my_callback($request) {
    // KHÔNG echo gì cả, chỉ return
    return new WP_REST_Response([
        'success' => true,
        'data' => 'Hello'
    ], 200);
}
```

---

## 🎯 TÓM TẮT

### QUY TẮC VÀNG:
1. **KHÔNG output trực tiếp** - luôn dùng hooks
2. **KHÔNG dùng `?>`** ở cuối file PHP
3. **KHÔNG echo** trong constructor/init methods
4. **LUÔN dùng** `wp_send_json*()` cho AJAX
5. **LUÔN kiểm tra** nonce và capabilities

### KHI LỖI JSON:
1. Tìm file có output trước REST API
2. Kiểm tra `headers_sent()` để tìm nguồn
3. Check PHP error log
4. Tắt từng class/plugin để isolate
5. Dùng browser Network tab để xem raw response

---

## 💡 LƯU Ý

### Performance Monitoring Script:
```php
// ✅ ĐÚNG - Dùng wp_footer
public function addPerformanceMonitoring() {
    add_action('wp_footer', function() {
        if (!is_admin()) {
            ?>
            <script>
                // Performance monitoring code
            </script>
            <?php
        }
    }, 999);
}
```

### Inline Styles/Scripts:
```php
// ✅ ĐÚNG - Dùng wp_head/wp_footer
add_action('wp_head', function() {
    ?>
    <style>
        .custom { color: red; }
    </style>
    <?php
});
```

### Admin Scripts:
```php
// ✅ ĐÚNG - Enqueue hoặc inline qua hook
add_action('admin_footer', function() {
    ?>
    <script>
        jQuery(document).ready(function($) {
            // Code
        });
    </script>
    <?php
});
```

