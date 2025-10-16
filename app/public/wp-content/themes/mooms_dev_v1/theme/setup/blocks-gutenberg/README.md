# Gutenberg Blocks - Mooms Theme

> **Phương pháp:** Native JavaScript (ES5) với WordPress Block APIs  
> **KHÔNG sử dụng:** JSX, Build tools (@wordpress/scripts), React components trực tiếp

## Phân biệt các phương pháp tạo Gutenberg Blocks

### 1. **Native JavaScript (ES5) - Phương pháp hiện tại** ✅
```javascript
// Dùng wp.element.createElement() thay vì JSX
wp.element.createElement('div', {}, 'Hello World')
```
- ✅ Không cần build tools
- ✅ Tương thích mọi môi trường
- ✅ Code dễ debug
- ❌ Verbose hơn JSX
- ❌ Phải tự quản lý dependencies

### 2. **React/JSX với @wordpress/scripts**
```javascript
// Dùng JSX syntax (cần build)
<div>Hello World</div>
```
- ✅ Syntax ngắn gọn hơn
- ✅ Tooling mạnh mẽ
- ❌ Cần build process
- ❌ Phức tạp hơn
- ❌ Có thể conflict với theme framework (WPEmerge)

### 3. **Carbon Fields Blocks** (đang dùng cho các block cũ)
```php
// PHP-first approach
Block::make('Block Name')->set_render_callback(...)
```
- ✅ Đơn giản với PHP
- ✅ Không cần JavaScript
- ❌ Không có visual editing trong Gutenberg
- ❌ Ít flexible hơn

## So sánh Code giữa các phương pháp

### Native JavaScript (đang dùng):
```javascript
// Không cần build, chạy trực tiếp trong browser
wp.element.createElement('h2', { className: 'title' }, 'Hello')
```

### React/JSX (cần build):
```jsx
// Cần compile từ JSX → JavaScript
<h2 className="title">Hello</h2>
```

### Carbon Fields (PHP):
```php
// Không có visual editing, chỉ form fields
Field::make('text', 'title', 'Title')
```

## Tại sao chọn Native JavaScript?

1. **Tương thích:** Không conflict với WPEmerge framework của theme
2. **Đơn giản:** Không cần setup build process phức tạp (Webpack, Babel, etc.)
3. **Performance:** Code nhẹ, load nhanh, không có overhead của JSX compilation
4. **Maintainable:** Dễ maintain, không phụ thuộc nhiều dependencies
5. **Visual editing:** Có preview trực quan trong Gutenberg (khác Carbon Fields)
6. **Debugging:** Dễ debug vì code chạy trực tiếp, không qua transformation

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
 
---

## Ghi chú bổ sung (Tổng kết nhanh)

### Ưu điểm (Native JS với WordPress Block APIs)
- Dễ triển khai: không cần build (Webpack/Babel), chạy thẳng ES5.
- Tương thích cao: ít xung đột môi trường (WPEmerge, plugins).
- Nhẹ và nhanh: ít phụ thuộc, bundle nhỏ, dễ debug.
- Tận dụng được hệ sinh thái WordPress (`wp.blocks`, `wp.element`, `wp.blockEditor`, `wp.components`).

### Nhược điểm
- Cú pháp dài hơn JSX; UI phức tạp sẽ khó đọc/bảo trì.
- Thiếu tiện nghi của toolchain hiện đại (linting, HMR, TypeScript).
- Khó modular hóa nếu không tổ chức tốt.

### Khi nên dùng Native JS
- Muốn tối giản setup, ưu tiên ổn định/tương thích.
- UI block ở mức vừa–đơn giản (form nhỏ, danh sách, preview cơ bản).
- Môi trường có ràng buộc (shared hosting, không có build server).

### Khi cân nhắc React/JSX (@wordpress/scripts)
- UI phức tạp, nhiều component tương tác.
- Cần TypeScript, unit test, code-splitting, storybook.
- Team quen workflow React, muốn tái dùng thư viện React.

### Nguồn tài liệu học (chính thống, cập nhật)
- Block Editor Handbook: [developer.wordpress.org/block-editor](https://developer.wordpress.org/block-editor/)
- Packages/APIs:
  - `wp.blocks`: [Blocks API](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-blocks/)
  - `wp.element`: [Element (React layer)](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-element/)
  - `wp.blockEditor`: [Block Editor](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/)
  - `wp.components`: [Components](https://developer.wordpress.org/block-editor/reference-guides/components/)
  - `wp.apiFetch`: [apiFetch](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-api-fetch/)
- Hướng dẫn:
  - Getting started – Create a Block: [Create a Block](https://developer.wordpress.org/block-editor/getting-started/create-block/)
  - Block Metadata (`block.json`): [Block Metadata](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/)
- Tham khảo mã nguồn core blocks: [Gutenberg block-library](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library)

### Lộ trình học nhanh (gợi ý)
1. `registerBlockType`, `attributes`, `edit/save`, `InspectorControls`, `RichText`, `MediaUpload`.
2. `apiFetch` + REST routes (WP core + CPT).
3. Tổ chức ES5 theo IIFE mỗi block, kèm docs/comment tối thiểu.
4. Khi UI phức tạp: cân nhắc chuyển sang @wordpress/scripts + JSX.
