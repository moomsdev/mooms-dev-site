# Tối ưu Admin Performance - Giảm 7.22s xuống < 3s

## 📊 HIỆN TRẠNG:

```
Load Time: 7.22s        🔴 QUÁ CHẬM
Requests:  153          🔴 QUÁ NHIỀU  
Size:      2.1MB → 8.1MB
Blocking:  4+ scripts @ 4s each
```

### Vấn đề chính:
1. **Render-blocking scripts:** 4+ scripts mỗi cái 4s (edit-post, editor, tinymce, core)
2. **Too many requests:** 153 requests (chuẩn < 50)
3. **No HTTP/2 push:** Scripts load tuần tự (waterfall)
4. **No defer/async:** Tất cả scripts đều blocking

---

## ✅ GIẢI PHÁP (Triển khai ngay)

### 1. ⚡ Defer Non-Critical Admin Scripts

**Thêm vào:** `app/helpers/optimize-admin.php`

```php
// 11. Defer WordPress admin scripts (giảm blocking)
add_filter('script_loader_tag', function ($tag, $handle) {
    // Scripts CẦN defer (không critical)
    $defer_handles = [
        // WordPress core
        'wp-embed',
        'wp-emoji-release',
        'underscore',
        'backbone',
        'wp-util',
        
        // Block Editor (non-critical)
        'wp-blocks',
        'wp-block-library',
        'wp-format-library',
        'wp-nux',
        'wp-plugins',
        'wp-edit-widgets',
        
        // Media
        'media-audiovideo',
        'media-editor',
        'image-edit',
        
        // Third-party
        'jquery-repeater',
    ];
    
    if (in_array($handle, $defer_handles)) {
        // Thêm defer attribute
        return str_replace(' src', ' defer src', $tag);
    }
    
    return $tag;
}, 10, 2);

// 12. Preload critical admin scripts
add_action('admin_head', function () {
    if (is_admin()) {
        ?>
        <!-- Preload critical scripts -->
        <link rel="preload" href="<?php echo includes_url('js/jquery/jquery.min.js'); ?>" as="script">
        <link rel="preload" href="<?php echo admin_url('admin-ajax.php'); ?>" as="fetch" crossorigin>
        
        <!-- DNS Prefetch cho CDN -->
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com">
        <?php
    }
}, 1);
```

---

### 2. 🗜️ Minify & Concatenate Scripts

**Bật script concatenation** (thêm vào `wp-config.php`):

```php
// Concatenate scripts/styles (giảm requests)
define('CONCATENATE_SCRIPTS', true);
define('COMPRESS_SCRIPTS', true);
define('COMPRESS_CSS', true);
define('ENFORCE_GZIP', true);
```

---

### 3. 🚀 Disable Unnecessary Admin Features

**Thêm vào:** `app/helpers/optimize-admin.php`

```php
// 13. Tắt features không cần thiết trong admin
add_action('admin_init', function () {
    // Tắt screen options (nếu không dùng)
    // add_filter('screen_options_show_screen', '__return_false');
    
    // Tắt help tabs
    add_filter('contextual_help', function ($old_help, $screen_id, $screen) {
        $screen->remove_help_tabs();
        return $old_help;
    }, 999, 3);
    
    // Giảm post revisions check interval
    remove_action('admin_init', 'wp_check_for_changed_dates');
    
    // Tắt comment status check (nếu tắt comments)
    if (get_option('_hide_comment_menu_default') === 'yes') {
        remove_action('admin_init', 'wp_check_for_changed_slugs');
    }
});

// 14. Lazy load admin scripts
add_action('admin_enqueue_scripts', function ($hook) {
    // CHỈ load scripts cần thiết cho từng page
    
    // Dashboard: không cần Block Editor
    if ($hook === 'index.php') {
        wp_dequeue_script('wp-edit-post');
        wp_dequeue_script('wp-blocks');
        wp_dequeue_script('wp-block-library');
        wp_dequeue_script('wp-format-library');
    }
    
    // User/Settings pages: không cần media scripts
    if (in_array($hook, ['users.php', 'options-general.php', 'profile.php'])) {
        wp_dequeue_script('media-upload');
        wp_dequeue_script('media-editor');
        wp_dequeue_script('image-edit');
    }
    
    // Non-post pages: không cần TinyMCE
    if (!in_array($hook, ['post.php', 'post-new.php'])) {
        wp_dequeue_script('editor');
        // wp_dequeue_script('quicktags'); // Keep for comment reply
    }
}, 999);
```

---

### 4. 📦 HTTP/2 Server Push (Local)

**Cập nhật:** `/conf/nginx/site.conf.hbs`

```nginx
server {
    listen 127.0.0.1:{{port}} http2;  # Thêm http2
    listen [::1]:{{port}} http2;       # Thêm http2
    
    # ... existing config ...
    
    # HTTP/2 Server Push cho admin
    location ~ ^/wp-admin/ {
        http2_push /wp-includes/js/jquery/jquery.min.js;
        http2_push /wp-admin/css/common.min.css;
        http2_push /wp-admin/js/common.min.js;
        # ... other rules ...
    }
}
```

**Restart Local:**
1. Stop site trong Local by Flywheel
2. Start lại

---

### 5. 🎯 Browser Cache Headers

**Cập nhật:** `/conf/nginx/site.conf.hbs`

Thay:
```nginx
location ~* \.(?:css|js)$ {
    access_log        off;
    log_not_found     off;
    add_header        Cache-Control "no-cache, public, must-revalidate, proxy-revalidate";
}
```

Bằng:
```nginx
location ~* \.(?:css|js)$ {
    access_log        off;
    log_not_found     off;
    expires           1y;  # Cache 1 năm cho versioned files
    add_header        Cache-Control "public, immutable";
    
    # Nếu có query string (version) → cache lâu
    if ($args) {
        add_header    Cache-Control "public, max-age=31536000, immutable";
    }
}
```

---

### 6. ⚙️ PHP OPcache (Critical!)

**Kiểm tra:** `/conf/php-8.3.17/php.ini.hbs`

Thêm/sửa:
```ini
[opcache]
opcache.enable=1
opcache.memory_consumption=256        ; Tăng từ 128
opcache.interned_strings_buffer=16    ; Tăng từ 8
opcache.max_accelerated_files=20000   ; Tăng từ 10000
opcache.revalidate_freq=0             ; Dev: check mỗi request
opcache.validate_timestamps=1         ; Dev: bật
opcache.fast_shutdown=1
opcache.enable_cli=0

; Production (sau khi deploy):
; opcache.revalidate_freq=60
; opcache.validate_timestamps=0
```

**Restart Local** sau khi sửa

---

### 7. 🔧 MySQL Query Cache (nếu MySQL 5.7)

**File:** `/conf/mysql/my.cnf.hbs`

```ini
[mysqld]
query_cache_type = 1
query_cache_size = 64M
query_cache_limit = 2M
table_open_cache = 4096
table_definition_cache = 2048
```

**Nếu MySQL 8.0+:** Query cache đã bị remove → dùng Redis thay thế

---

## 🧪 TEST & VERIFY

### A. Kiểm tra HTTP/2:
```bash
curl -I --http2 https://mooms.dev 2>&1 | grep HTTP
# Expect: HTTP/2 200
```

### B. Kiểm tra OPcache:
```php
<?php
// Tạo file: phpinfo.php
phpinfo();
// Tìm "Zend OPcache" → phải có "enabled"
```

### C. Kiểm tra Gzip:
```bash
curl -H "Accept-Encoding: gzip" -I https://mooms.dev/wp-admin/admin.php 2>&1 | grep -i encoding
# Expect: Content-Encoding: gzip
```

### D. Test lại Network:
1. Hard refresh: `Cmd+Shift+R`
2. F12 → Network → Reload
3. Check:
   - Requests: < 100 (từ 153)
   - Load: < 3s (từ 7.22s)
   - Scripts có `defer` attribute

---

## 📊 KẾT QUẢ MONG ĐỢI

### Trước:
```
Load Time:    7.22s
Requests:     153
Blocking:     4+ scripts @ 4s
Transfer:     2.1 MB
```

### Sau (dự kiến):
```
Load Time:    2-3s      ⚡ -60%
Requests:     60-80     📉 -48%
Blocking:     1-2       ⚡ -75%
Transfer:     1.5 MB    📉 -30%
```

---

## 🚀 QUICK WIN (Làm ngay - 5 phút)

### 1. Thêm vào `wp-config.php`:
```php
define('CONCATENATE_SCRIPTS', true);
define('COMPRESS_SCRIPTS', true);
define('COMPRESS_CSS', true);
```

### 2. Bật OPcache:
```bash
# Trong Local → Site Settings → PHP → Advanced
# Hoặc edit /conf/php-8.3.17/php.ini.hbs
opcache.enable=1
```

### 3. Restart Local site

### 4. Hard refresh browser (Cmd+Shift+R)

**Kết quả ngay lập tức:** Load time giảm 30-40%

---

## 🔄 ROLLBACK (nếu lỗi)

### Nếu admin bị lỗi sau khi defer scripts:

**Tắt defer:** Comment đoạn code defer trong `optimize-admin.php`

```php
// add_filter('script_loader_tag', function ($tag, $handle) {
//     ...defer logic...
// }, 10, 2);
```

### Nếu OPcache gây lỗi:

```ini
opcache.enable=0  ; Tắt tạm
```

Restart Local

---

## 📝 CHECKLIST

- [ ] Bật CONCATENATE_SCRIPTS trong wp-config.php
- [ ] Bật OPcache trong php.ini
- [ ] Thêm defer cho non-critical scripts
- [ ] Preload critical resources
- [ ] Lazy load admin scripts per page
- [ ] Cập nhật cache headers (expires 1y)
- [ ] Enable HTTP/2 (nếu có SSL)
- [ ] Test lại Network waterfall
- [ ] Verify Load Time < 3s

---

## 🎯 KẾT LUẬN

**Root cause:** WordPress admin mặc định load 150+ scripts, tất cả đều blocking.

**Solution:** 
1. Defer 80% scripts (non-critical)
2. Concatenate scripts → giảm requests
3. OPcache → cache PHP bytecode
4. HTTP/2 → parallel loading

**Kết quả:** Load time giảm từ **7.22s → 2-3s** 🚀

