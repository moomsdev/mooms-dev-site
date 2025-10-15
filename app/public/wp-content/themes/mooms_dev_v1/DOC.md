## Tổng quan

Tài liệu này mô tả chi tiết cấu trúc, chức năng, mức độ hoàn thiện, đề xuất tối ưu và đánh giá hiệu năng của theme `mooms_dev_v1`. Nội dung dựa trên việc rà soát mã nguồn thực tế trong thư mục theme hiện tại.

## 1) Cấu trúc thư mục và file hiện có

Dưới đây là sơ đồ các nhóm thư mục, tệp chính và vai trò tổng quát:

- `theme/`
  - `functions.php`: Điểm vào chính của theme, nơi khai báo hooks, load các phần `setup/*`, đăng ký assets, hỗ trợ theme.
  - `style.css`: Header meta của theme (tên, version, textdomain...).
  - `header.php`, `footer.php`, `index.php`, `single*.php`, `archive*.php`, `page.php`, `404.php`, `search.php`, `comments.php`, `sidebar.php`, `author.php`: Các template hiển thị frontend theo chuẩn WordPress.
  - `layouts/app.php`: Layout dựng khung trang, thường được include từ các template.
  - `loop_templates/*`: Các partial loop cho bài viết/post single, meta, comment item.
  - `template-parts/*`: Các mảnh template tái sử dụng (vd: `share_box.php`, `loop-post.php`, `breadcrumb.php`).
  - `page_templates/*`: Template trang tùy biến (vd: `template-contact.php`).
  - `setup/`
    - `assets.php`: Đăng ký/enqueue scripts, styles; điều kiện nạp theo trang.
    - `theme-support.php`: Khai báo hỗ trợ theme (thumbnails, menus, HTML5...).
    - `theme-options.php`: Khởi tạo/trình bày các tùy chọn theme (thường qua Carbon Fields).
    - `performance.php`: Thiết lập tối ưu hiệu năng (loại bỏ bloat, header, preload...).
    - `menus.php`, `sidebars.php`: Đăng ký menu và sidebar/widget areas.
    - `ajax.php`: Khai báo action AJAX chung ở theme.
    - `users/`
      - `auth.php`: Xử lý đăng nhập/đăng ký qua AJAX, login Google (Overtrue\Socialite), callback dành cho admin.
      - `user-meta.php`: Khai báo/điều khiển metadata của user.
    - `blocks/`
      - `service.php`: Định nghĩa block Carbon Fields "Block SERVICE" (chọn các post `service` để hiển thị danh sách dịch vụ).
      - `about.php`, `slider.php`, `blog.php`: Các block Carbon Fields khác.
    - `taxonomies/`
      - `blog_cat.php`, `blog_tags.php`: Khai báo taxonomy tùy biến cho blog.
    - `walkers/`
      - `MMS_Menu_Walker.php`: Custom walker cho menu.

- `app/`
  - `config.php`, `hooks.php`, `helpers.php`: Khởi tạo cấu hình, hook toàn cục, tiện ích.
  - `views.php`: Service provider/loader cho view (tùy cơ chế của theme).
  - `routes/`
    - `web.php`, `ajax.php`, `admin.php`: Khai báo route logic (theme áp dụng mô hình routing trên WP hooks).
  - `helpers/`
    - Các tiện ích: `functions.php`, `ajax.php`, `template_tags.php`, `content.php`, `title.php`, `shortcodes.php`, `woocommerce.php`, `login.php`, `admin.php`, `hooks.php`, `carbon_fields.php`, `shims.php`.
  - `src/`
    - `Abstracts/AbstractPostType.php`, `Abstracts/AbstractTaxonomy.php`: Lớp nền tảng để đăng ký Post Type/Taxonomy chuẩn hóa.
    - `PostTypes/`
      - `service.php`, `blog.php`: Đăng ký Custom Post Type tương ứng (dịch vụ, blog).
    - `Models/Post.php`: Lớp model thao tác dữ liệu bài viết.
    - `Databases/DB.php`: Lớp làm việc DB ở mức thấp (nếu có dùng ngoài WPDB).
    - `Routing/RouteConditionsServiceProvider.php`: Điều kiện điều hướng/route.
    - `View/ViewServiceProvider.php`: Liên quan render view, chia sẻ biến.
    - `Validators/Validator.php`: Bộ kiểm tra/validate dữ liệu.
    - `Settings/`
      - `AdminSettings.php`: Tùy biến khu vực admin, bảo trì, widgets, menu, upload, bảo mật cơ bản, tối ưu…
      - `ThemeSettings.php`, `Updater.php`, `FakerData.php`, `CustomLoginPage.php`, `AutoDownloadImage.php`: Mở rộng cài đặt theme, cập nhật, dữ liệu giả, trang login, tự động tải ảnh…
      - `MMSTools/Optimize.php`, `MMSTools/Security.php`, `MMSTools/OptimizeImages.php`: Bộ tối ưu (assets, headers, images…) và bảo mật nâng cao.
      - `RequirePlugins.php`: Tích hợp TGM Plugin Activation quản lý plugin bắt buộc/khuyến nghị.

- `resources/`
  - `scripts/`: Mã nguồn JS phần theme/admin/editor/login và các cấu hình build Webpack (`resources/build/*`).
  - `styles/`: CSS bổ sung (vd: `shared/introjs.css`).
  - `admin/lib/*`: Thư viện JS rời (smooth-scroll, lazysizes, instantpage).

- Gốc theme
  - `README.md`: Giới thiệu, mục tiêu hiệu năng, PWA, bảo mật, hướng dẫn.
  - `DOC.md`: Tài liệu kỹ thuật chi tiết (file đang đọc).
  - `activator_plugins/class-tgm-plugin-activation.php`: Thư viện TGM để yêu cầu cài plugin.

Lưu ý: README có nhắc tới `dist/` (CSS/JS đã build, critical.css, sw.js, offline.html), nhưng trong mã nguồn hiện tại chưa thấy thư mục `dist/`. Điều này ảnh hưởng các tính năng PWA/critical CSS nếu chưa được build và publish ra production.

## 2) Mô tả chi tiết các phần quan trọng và cách sử dụng

### 2.1. Xác thực người dùng và Google Login: `theme/setup/users/auth.php`

- Chức năng:
  - AJAX login: `mm_user_login` (hooks: `wp_ajax_nopriv_user_login`, `wp_ajax_user_login`).
    - Kiểm tra nonce `_token` với action `user_dang_nhap`.
    - Dùng `wp_signon` để đăng nhập, trả lỗi nếu sai.
    - Trả về `<script>` lưu `localStorage` và redirect theo `redirect_to` từ form.
  - AJAX register: `mm_user_register` (hooks: `wp_ajax_nopriv_user_register`, `wp_ajax_user_register`).
    - Kiểm tra nonce `_token` action `user_dang_ky_thanh_vien`.
    - Kiểm tra họ/tên/email/password và khớp lại mật khẩu.
    - Tạo user bằng `wp_insert_user`, cập nhật meta `_user_birthday`, `_user_gender`.
  - AJAX reset password: `mm_user_reset_password` (stub trả `wp_send_json_success(true)`).
  - Google Login (Overtrue\Socialite):
    - Hằng `SOCIAL_DRIVER['google']` đọc các option `google_client_id`, `google_client_secret`, `google_redirect_uri`.
    - `googleLogin()`: Redirect tới Google; hỗ trợ `redirect_to` truyền qua query.
    - `socialCallbackRedirectUrl()`: Sau khi login thành công trong popup, trả script gọi `opener.socialLoginReturn(...)` và đóng cửa sổ.
    - `googleAdminCallback()`: Cho phép chỉ admin (role `administrator`) đăng nhập vào `/wp-admin/` qua Google; kiểm tra email khớp user admin.

- Cách dùng:
  - Form login/register phải gửi AJAX kèm `_token` (`wp_create_nonce('user_dang_nhap')` hoặc `wp_create_nonce('user_dang_ky_thanh_vien')`).
  - Cấu hình Google OAuth: đặt các option `google_client_id`, `google_client_secret`, `google_redirect_uri` tương ứng (qua trang option của theme hoặc WP options).

- Ghi chú kỹ thuật/đề xuất:
  - Trả về `<script>` trong AJAX là không chuẩn REST/AJAX; nên trả JSON, để JS phía client xử lý UI/redirect.
  - Cần sanitize/escape input kỹ hơn (đã có `sanitize_text_field` cho meta; nên thêm cho `user_login`, `email`).
  - `mm_user_reset_password` chưa triển khai thực sự.

### 2.2. Tùy chỉnh trang quản trị: `app/src/Settings/AdminSettings.php`

- Chức năng chính khi khởi tạo:
  - Phân quyền: Nếu user đăng nhập thuộc `SUPER_USER`, hiển thị trang `MMS Admin` (Carbon Fields). Nếu không, ẩn nhiều menu, chặn trang nhạy cảm, thiết lập trạng thái bảo trì, tắt update, v.v.
  - UI/UX admin: Thay đổi `login_headerurl`, tiêu đề, footer text; tùy biến Admin Bar, thêm widget "Giới thiệu" vào Dashboard.
  - Media/Upload: Đổi tên file upload (chuẩn hóa ký tự, thêm timestamp), cho phép mở rộng mime (`ac3`, `mpa`, `flv`, `svg`), AJAX lấy URL thumbnail, loại bỏ nhiều kích thước ảnh mặc định, resize ảnh gốc qua Intervention Image.
  - Bảo mật/khác: Tắt xác thực email đổi admin (option), ẩn checkbox dùng mật khẩu yếu (script xóa `.pw-weak`), ẩn Post/Comments menu mặc định, gỡ Widgets/Meta Box dashboard mặc định.
  - Tài nguyên Admin: enqueue `jquery.repeater`, `admin.js` tuỳ chỉnh.
  - Chế độ bảo trì: Nếu option `_is_maintenance` bật, `wp_die` kèm UI thông báo.

- Tabs cấu hình (Carbon Fields):
  - `ADMIN`: Bật bảo trì, tắt xác thực email admin, cấm dùng mật khẩu yếu, ẩn menu Bài viết/Bình luận.
  - `SMTP`: Cấu hình SMTP gửi mail (host/port/secure/username/password). Lưu ý không nên hardcode mật khẩu.
  - `Tools > Optimization Image`: Bật nén ảnh, chuyển WebP, giữ file gốc, chất lượng JPG/PNG/WebP, giới hạn kích thước, tỉ lệ tiết kiệm.
  - `Tools > Optimization`: Tắt jQuery Migrate/Gutenberg/Classic CSS/Emoji; Bật InstantPage/SmoothScroll; tối ưu ảnh, resource hints, lazyload, dọn HTML…; Service Worker cache.
  - `Tools > Security`: Tắt REST/XML-RPC/Embed/X-Pingback; loại bỏ bloat; tối ưu DB; log query chậm; tối ưu memory; headers cache; gzip; giám sát hiệu suất.

- Ghi chú kỹ thuật/đề xuất:
  - Nhiều hành vi thay đổi mạnh trang admin (ẩn menus, chặn trang, tắt update). Cần đảm bảo SUPER_USER được cấu hình đúng để tránh lock out quản trị.
  - `resizeOriginalImageAfterUpload`: hiện `->resize(null, null, ...)` không đặt giới hạn; cần ràng buộc theo `max_width/max_height` từ option.
  - Xử lý output HTML trong `wp_die` và footer nên i18n và tách view để bảo trì.

### 2.3. Plugin bắt buộc: `app/src/Settings/RequirePlugins.php`

- Sử dụng TGM Plugin Activation để yêu cầu plugin:
  - `wordfence` (bắt buộc, force activation/deactivation).
  - Có chỗ dành cho `WPS Hide Login` nhưng đang comment.
  - TGM config trỏ menu `themes.php` và capability `edit_theme_options`.

- Ghi chú kỹ thuật/đề xuất:
  - Force activation có thể gây khó khi debug/staging; cân nhắc chỉ khuyến nghị thay vì bắt buộc.
  - Thêm kiểm tra trạng thái plugin để tránh vòng lặp thông báo.

### 2.4. Block dịch vụ: `theme/setup/blocks/service.php`

- Định nghĩa block Carbon Fields "Block SERVICE" gồm: `service_title`, `service_desc`, `service_obj` (association tới post type `service`).
- Render: Xuất section `.block-service` hiển thị danh sách dịch vụ đã chọn: icon là ký tự đầu của tiêu đề, title, excerpt và link tới permalink.
- Cách dùng: Trong trình editor (Gutenberg + Carbon Fields), thêm block và chọn các dịch vụ tương ứng.

### 2.5. Post Types, Taxonomies, Helpers, Routes

- `app/src/PostTypes/{service,blog}.php`: Đăng ký CPT phục vụ block và trang `single-{post_type}.php`, `archive-{post_type}.php`.
- `theme/archive-*.php`, `theme/single-*.php`: Template hiển thị theo CPT.
- `theme/setup/taxonomies/*`: Tạo taxonomy chuyên mục và thẻ cho blog.
- `app/helpers/*`: Các hàm tiện ích frontend/backend, hooks, shortcode, WooCommerce, Carbon Fields bootstrap.
- `app/routes/*.php`: Điều hướng và AJAX centralize theo convention riêng của theme (dựa trên WP hooks).

## 3) Đánh giá mức độ hoạt động hiện tại

- Đã hoạt động/đã có code:
  - Hệ thống đăng nhập/đăng ký/Google login qua AJAX; đăng nhập admin qua Google (nếu email thuộc admin).
  - Tập tùy chỉnh admin rất đầy đủ (ẩn menu, widget, header/footer, admin bar, maintenance, upload, SMTP, tối ưu ảnh, bảo mật, tối ưu hiệu năng…).
  - Block `service` hiển thị dịch vụ từ CPT; hệ thống templates và CPT/taxonomies đầy đủ cho blog/service.

- Có thể chưa hoạt động đầy đủ hoặc phụ thuộc cấu hình:
  - PWA/Service Worker, Critical CSS, offline page: README có mô tả nhưng không thấy `dist/sw.js`, `dist/critical.css`, `offline.html` trong repo. Cần quy trình build để tạo ra.
  - Tối ưu ảnh gốc bằng Intervention Image phụ thuộc extension PHP (gd/imagick) và composer autoload. Cần đảm bảo vendor đã cài đặt.
  - Các option (Google OAuth, SMTP, toggles…) phải được set trong DB qua trang Carbon Fields.
  - `mm_user_reset_password` đang là stub, chưa xử lý thực tế.

- Phần dư thừa/không cần thiết (tiềm năng):
  - Trả về `<script>` trong AJAX login/register là pattern cũ; nên chuyển sang JSON API chuẩn.
  - Ẩn quá nhiều menu/trang admin có thể khiến người quản trị bình thường khó thao tác; cân nhắc bật theo môi trường hoặc role.
  - Hardcode mật khẩu SMTP mẫu trong field default là rủi ro (không nên push giá trị thật vào repo).

## 4) Đề xuất bổ sung và tối ưu mã nguồn

- Chuẩn hóa API AJAX:
  - Trả JSON `{ success, message, redirect }` và để JS frontend xử lý UI/redirect. Tránh echo `<script>` trong response.
  - Thêm `wp_send_json_error`/`wp_send_json_success` nhất quán, kèm HTTP status.

- Bảo mật:
  - Sanitize/validate toàn bộ input đăng ký/đăng nhập; dùng `sanitize_user`, `sanitize_email`, `is_email`.
  - Thêm rate-limit cho AJAX auth (transient theo IP/email) và generic error.
  - Kiểm tra CSRF nonce kỹ, dùng `check_ajax_referer` thay vì tự đọc `$_REQUEST`.
  - Không hardcode dữ liệu nhạy cảm (SMTP password) trong default; đọc từ ENV nếu có thể.

- Ảnh và Media:
  - `resizeOriginalImageAfterUpload`: đọc `max_width/max_height` từ option và áp dụng thực sự khi `width/height` vượt ngưỡng; cân nhắc không overwrite bản gốc.
  - Bật/gộp `srcset/sizes`, `decoding="async"`, `fetchpriority` theo ngữ cảnh LCP.

- Quản trị và trải nghiệm admin:
  - Gom logic ẩn menu/deny pages theo môi trường (dev/staging/prod) hoặc theo capability, giảm rủi ro lock out.
  - Tách HTML template trong `wp_die` và footer vào view để dễ bảo trì/i18n.

- Kiến trúc/build:
  - Hoàn thiện pipeline build tạo `dist/` (webpack + postcss): bundle, minify, split, tạo `critical.css`, `sw.js`, `manifest.json`, `offline.html`.
  - Kiểm soát versioning assets (cache-busting) và preload critical assets.

- Mã nguồn chung:
  - Thêm kiểu trả về rõ ràng, docblock PHPDoc cho public API/class (theo chuẩn của project), giữ code style hiện hành.
  - Giảm logic ẩn sâu trong closures kèm HTML; tách ra hàm nhỏ, testable.

## 5) Đánh giá hiệu năng và tối ưu thêm

- Hiện trạng tích cực:
  - Theme đã có cơ chế loại bỏ bloat (emoji, migrate, CSS không cần thiết), lazyload, resource hints, tối ưu ảnh, gzip (nếu bật), cache headers (nếu bật), hướng đến điểm PSI cao như README mô tả.

- Điểm nghẽn tiềm năng và việc cần làm:
  - Thiếu `dist/` sản phẩm build: không có `critical.css`, `sw.js` → ảnh hưởng LCP/TTI và PWA. Cần bổ sung build và deploy.
  - AJAX auth trả `<script>`: tăng payload, khó cache, khó theo dõi; chuyển sang JSON giúp nhẹ và an toàn hơn.
  - Ảnh gốc bị `save(..., 100)` có thể không giảm dung lượng; nên dùng chất lượng từ option và không ghi đè nếu không giảm đáng kể.
  - Resource hints: rà soát domain thực tế (CDN, font, API) để thêm `preconnect/dns-prefetch/preload` hợp lý, tránh lạm dụng.
  - Fonts: preload subset, dùng `font-display: swap`, tự host nếu dùng Google Fonts, thiết lập `as=font` + CORS.
  - JS: defer/async toàn bộ không-critical, split theo trang; loại bỏ thư viện thừa; cân nhắc native features thay cho polyfill nếu tỷ lệ trình duyệt mục tiêu cho phép.
  - Database: giới hạn revisions, tăng autosave interval, kiểm soát query chậm qua log; thêm indexes tùy tình huống nếu dùng query tùy biến.
  - Cache: kết hợp page cache (plugin/server), object cache (Redis/Memcached), và browser cache với `immutable` cho assets versioned.

- Checklist tối ưu nhanh:
  - Thiết lập pipeline build tạo `dist/` và tham chiếu assets versioned trong `functions.php`.
  - Bật các toggles phù hợp trong `Tools > Optimization` và `Tools > Security` (Carbon Fields) theo môi trường.
  - Rà soát ảnh hero/LCP: kích thước đúng, `fetchpriority="high"`, preload.
  - Đảm bảo `Intervention Image`/ext PHP hoạt động, tránh lỗi khi xử lý upload.
  - Đo Core Web Vitals thật (CrUX/field data) và theo dõi biến động sau mỗi thay đổi.

## 6) Cập nhật đã thực hiện

### 6.1. Chuẩn hóa API AJAX về JSON ✅

**Đã hoàn thành:**

- **File đã sửa:** `theme/setup/users/auth.php`
- **Các hàm đã chuẩn hóa:**
  - `mm_user_login()`: Trả JSON thay vì HTML script
  - `mm_user_register()`: Trả JSON với validation đầy đủ
  - `mm_user_reset_password()`: Triển khai đầy đủ chức năng reset password
  - `googleLogin()`: Trả JSON cho Google OAuth
  - `socialCallbackRedirectUrl()`: Trả JSON cho popup callback
  - `googleAdminCallback()`: Trả JSON cho admin login

**Cải tiến bảo mật:**
- Sử dụng `sanitize_user()`, `sanitize_email()`, `is_email()` để validate input
- HTTP status codes chuẩn (400, 401, 403, 404, 500)
- Nonce verification với action riêng biệt cho từng chức năng
- Escape output với `esc_url()`, `esc_html()`

**Files mới tạo:**
- `resources/scripts/theme/auth-handler.js`: JavaScript class xử lý API JSON
- `resources/styles/auth-notifications.css`: CSS cho thông báo
- `auth-demo.html`: Demo HTML với form mẫu

**Cấu trúc JSON Response:**

```json
// Success
{
  "success": true,
  "data": {
    "message": "Đăng nhập thành công",
    "user": {
      "id": 123,
      "email": "user@example.com", 
      "display_name": "John Doe"
    },
    "redirect_to": "/",
    "notification": {
      "title": "Xin chào, user@example.com",
      "message": "Chúc mừng bạn đã đăng nhập thành công"
    }
  }
}

// Error
{
  "success": false,
  "data": {
    "message": "Tài khoản hoặc mật khẩu không đúng"
  }
}
```

**Lợi ích:**
- API chuẩn REST, dễ tích hợp với frontend framework
- Giảm payload, tăng tốc độ xử lý
- Dễ debug và monitor
- Tương thích với caching và CDN
- Hỗ trợ error handling tốt hơn

---

### 6.2. Tích hợp Google OAuth Login vào trang wp-login.php ✅

**Đã hoàn thành:**

- **File đã sửa:** `app/src/Settings/CustomLoginPage.php`
- **Files mới tạo:**
  - `resources/admin/js/login.js`: JavaScript xử lý Google login
  - `resources/admin/css/login.css`: CSS cho nút Google login
  - `GOOGLE_OAUTH_SETUP.md`: Hướng dẫn cấu hình chi tiết

**Tính năng đã thêm:**
- Nút "Đăng nhập với Google" xuất hiện trên `/wp-login.php`
- Tự động tạo user mới nếu chưa tồn tại
- Lưu Google ID và avatar vào user meta
- Xử lý callback OAuth hoàn chỉnh
- Hiển thị thông báo lỗi/thành công
- Responsive design cho mobile

**Cách hoạt động:**
1. User click "Đăng nhập với Google" trên `/wp-login.php`
2. JavaScript gọi AJAX endpoint `google_login`
3. Server trả về Google OAuth URL
4. Browser redirect đến Google xác thực
5. Google redirect về callback với code
6. Server xử lý callback, tạo/tìm user, đăng nhập
7. Redirect về trang đích

**Cấu hình cần thiết:**
```php
// wp-config.php
define('GOOGLE_CLIENT_ID', 'your_client_id');
define('GOOGLE_CLIENT_SECRET', 'your_client_secret');
define('GOOGLE_REDIRECT_URI', 'https://yourdomain.com/wp-admin/admin-ajax.php?action=google_login');
```

**Lợi ích:**
- User experience tốt hơn với 1-click login
- Giảm friction trong quá trình đăng ký/đăng nhập
- Tự động sync thông tin từ Google
- Bảo mật cao với OAuth 2.0
- Tương thích với WordPress login flow

---

**Các mục tiếp theo có thể thực hiện:**
- (2) Thiết lập quy trình build để tạo `dist/` (critical CSS, service worker)
- (3) Ràng buộc resize ảnh theo option `max_width/max_height`
- (4) Tinh chỉnh security headers/resource hints theo hạ tầng thực tế
- (5) Tối ưu database queries và caching
- (6) Implement rate limiting cho API auth
- (7) Thêm social login khác (Facebook, GitHub, etc.)

Hãy xác nhận mục nào bạn muốn thực hiện tiếp theo.

