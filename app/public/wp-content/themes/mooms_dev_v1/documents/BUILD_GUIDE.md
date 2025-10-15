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

## 3) Quy trình build
1) Split cấu hình dev/prod trong Webpack
2) Bật contenthash cho filename
3) Dùng Workbox để precache và runtime cache
4) Dùng Critical hoặc Critters để inline above-the-fold CSS
5) Generate `manifest.json` và copy icons

## 4) Tác vụ NPM gợi ý
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

## 5) Tích hợp WordPress
- Enqueue assets đọc từ `manifest.json`
- Inline critical CSS trong `header.php`
- Đăng ký service worker trong `footer.php` (chỉ production)

## 6) Kiểm thử
- Lighthouse (Performance, PWA)
- Kiểm tra offline mode
- Check preload/preconnect warnings

## 7) Kỳ vọng sau build
- LCP/TBT/TTI cải thiện đáng kể
- PageSpeed đạt 90+ (desktop & mobile)
- Hỗ trợ offline cơ bản và A2HS (Add to Home Screen)
