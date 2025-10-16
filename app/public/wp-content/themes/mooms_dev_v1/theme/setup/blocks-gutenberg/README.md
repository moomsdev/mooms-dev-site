# Gutenberg Blocks - Mooms Theme

## Cấu trúc thư mục

```
blocks-gutenberg/
├── init.php              # File khởi tạo và đăng ký tất cả blocks
├── common-editor.css     # CSS chung cho editor
├── README.md             # Hướng dẫn này
├── about-me/             # Block "About Me"
│   ├── block.json        # Metadata của block
│   └── build/
│       └── index.js      # JavaScript của block (ES5 format)
└── service/              # Block "Service"
    ├── block.json        # Metadata của block
    └── build/
        └── index.js      # JavaScript của block (ES5 format)
```

**Lưu ý:** Không cần tạo `editor.css` và `style.css` trong mỗi block vì:
- Styles được load từ `dist/styles/theme.css` (compiled từ `resources/styles/theme/layout/_blocks.scss`)
- Theme đã tự động enqueue CSS vào editor qua `init.php`

## Cách tạo block mới

### 1. Tạo thư mục block

```bash
mkdir -p theme/setup/blocks-gutenberg/ten-block/build
```

### 2. Tạo file `block.json`

```json
{
  "$schema": "https://schemas.wp.org/trunk/block.json",
  "apiVersion": 2,
  "name": "mms/ten-block",
  "title": "Tên Block",
  "category": "mms-blocks",
  "icon": "admin-users",
  "description": "Mô tả block",
  "attributes": {
    "attr1": { "type": "string", "default": "" }
  }
}
```

### 3. Tạo file `build/index.js`

```javascript
(function(wp){
  const { registerBlockType } = wp.blocks;
  
  function register(){
    console.log('[MMS Block] Registering: ten-block');
    registerBlockType('mms/ten-block', {
      title: 'Tên Block',
      icon: 'admin-users',
      category: 'mms-blocks',
      attributes: {
        attr1: { type: 'string', default: '' }
      },
      edit: function(props){
        return wp.element.createElement('div', {}, 'Editor view');
      },
      save: function(props){
        return wp.element.createElement('div', {}, 'Frontend view');
      }
    });
  }

  if (wp && wp.domReady) {
    wp.domReady(register);
  } else {
    register();
  }
})(window.wp);
```

### 4. Thêm registration vào `init.php`

```php
/**
 * Register Ten Block
 */
function mms_register_ten_block() {
    $dir = get_template_directory() . '/setup/blocks-gutenberg/ten-block';
    $uri = get_template_directory_uri() . '/setup/blocks-gutenberg/ten-block';

    wp_register_script(
        'mms-ten-block-editor-script',
        $uri . '/build/index.js',
        array('wp-blocks', 'wp-i18n', 'wp-element', 'wp-components', 'wp-editor', 'wp-block-editor'),
        file_exists($dir . '/build/index.js') ? filemtime($dir . '/build/index.js') : '1.0'
    );

    if (function_exists('register_block_type')) {
        register_block_type('mms/ten-block', array(
            'api_version'   => 2,
            'editor_script' => 'mms-ten-block-editor-script',
        ));
    }
}
add_action('init', 'mms_register_ten_block');

/**
 * QUAN TRỌNG: Thêm script vào enqueue function
 */
// Trong function mms_blocks_enqueue_editor_assets(), thêm dòng:
wp_enqueue_script('mms-ten-block-editor-script');
```

### 5. Thêm styles vào `resources/styles/theme/layout/_blocks.scss`

```scss
// Block Ten Block
.block-ten-block {
    // Your styles here
    padding: 2rem;
    
    &__header {
        font-size: 2rem;
    }
    
    &__body {
        margin-top: 1rem;
    }
}
```

### 6. Compile CSS

```bash
# Chạy trong terminal
yarn dev    # cho development
yarn build  # cho production
```

## Lưu ý quan trọng

1. **Styles được load từ theme bundle (`dist/styles/theme.css`)**
   - KHÔNG cần tạo file `editor.css` hoặc `style.css` riêng
   - Tất cả styles viết trong `resources/styles/theme/layout/_blocks.scss`
   - WordPress sẽ tự động compile và enqueue qua theme

2. **JavaScript phải là ES5 format**
   - KHÔNG dùng `import/export`
   - Dùng `wp.element.createElement()` thay vì JSX
   - Wrap trong `(function(wp){ ... })(window.wp)`

3. **Block category là `mms-blocks`**
   - Đã được đăng ký trong `app/hooks.php`
   - Tất cả blocks mới nên dùng category này

4. **Dependencies WordPress cần thiết:**
   - `wp-blocks` - Core blocks API
   - `wp-element` - React-like createElement
   - `wp-components` - UI components
   - `wp-editor` - Editor utilities (deprecated, dùng cho backward compatibility)
   - `wp-block-editor` - Block editor components

## Ví dụ Blocks

### Block "About Me" (`about-me/`)
Xem thư mục `about-me/` để tham khảo cách implement một block hoàn chỉnh với:
- Media upload (chọn ảnh)
- Rich text editing (tiêu đề, mô tả)
- SVG rendering (circular text)
- Attributes management
- Frontend rendering từ JavaScript (static content)

### Block "Service" (`service/`)
Xem thư mục `service/` để tham khảo cách implement block động với:
- Query posts từ REST API (`wp.apiFetch`)
- Checkbox selection (chọn nhiều services)
- `render_callback` PHP để render HTML động
- `save: function() { return null; }` - render từ PHP thay vì JavaScript
- Inspector Controls với danh sách checkboxes
- Dependencies: thêm `wp-api-fetch` để fetch data
- `useState` và `useEffect` hooks để quản lý state

**Khi nào dùng `render_callback`?**
- Block cần query dữ liệu động (posts, custom post types)
- Nội dung thay đổi theo thời gian
- Cần logic PHP phức tạp để render

**Khi nào dùng `save()` function?**
- Block có nội dung tĩnh (text, images)
- Không cần query database
- Nội dung không thay đổi sau khi save