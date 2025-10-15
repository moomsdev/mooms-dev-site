# ⚙️ Build Guide (dist/: Critical CSS, Service Worker, Manifest)

## 1) Mục tiêu
- Tạo `dist/` cho assets production: JS/CSS minified, hashed filenames
- Extract & inline Critical CSS
- Generate Service Worker (Workbox) và PWA manifest

## 2) Packages đề xuất
```json
{
  "devDependencies": {
    "critical": "^6.0.0",
    "workbox-webpack-plugin": "^7.0.0",
    "html-webpack-plugin": "^5.5.0",
    "copy-webpack-plugin": "^11.0.0"
  }
}
```

## 3) Quy trình build (chi tiết)
1) Webpack production
- Bật `contenthash` cho filename (cache-busting)
- Xuất `manifest.json` (mapping tên file)

2) Critical CSS
- Dùng `critical` CLI hoặc plugin webpack để tạo `dist/critical/home.css`, `dist/critical/single.css`...
- Vị trí chèn: `theme/header.php` → inline CSS theo điều kiện page type.

3) Service Worker (Workbox)
- Generate `dist/sw.js` với precache manifest + runtime caching (images, fonts, CSS/JS)
- Đăng ký SW: `theme/footer.php` (chỉ PRODUCTION)
```html
<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('/wp-content/themes/mooms_dev_v1/dist/sw.js');
  });
}
</script>
```

4) Manifest & Icons
- Tạo `dist/manifest.json` và icons 192/512.
- Chèn `<link rel="manifest" href="/wp-content/themes/mooms_dev_v1/dist/manifest.json">` trong `header.php`.

5) Enqueue assets từ manifest
- Vị trí: `app/src/Settings/AdminSettings.php` hoặc `theme/setup/assets.php` (theo chuẩn dự án)
- Đọc `manifest.json` để enqueue đúng path hashed.

## 4) Scripts NPM gợi ý
```json
{
  "scripts": {
    "build": "webpack --mode=production",
    "build:critical": "node scripts/build-critical.js",
    "build:sw": "node scripts/build-sw.js",
    "build:pwa": "node scripts/build-pwa.js",
    "build:prod": "npm run build && npm run build:critical && npm run build:sw && npm run build:pwa"
  }
}
```

## 5) Kiểm thử
- Lighthouse (Performance, Best Practices, SEO, PWA)
- Test offline (đóng mạng) → trang vẫn mở từ cache với SW
- Kiểm tra header Preload/Resource Hints không cảnh báo

## 6) Kỳ vọng sau build
- LCP/TBT/TTI cải thiện đáng kể
- PageSpeed đạt 90+ (desktop & mobile)
- Hỗ trợ offline cơ bản và A2HS (Add to Home Screen)
