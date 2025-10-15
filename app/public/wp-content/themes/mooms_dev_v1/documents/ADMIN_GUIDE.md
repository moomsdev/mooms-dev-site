# 🛠️ MMS Admin & Tools Guide

## 1) Tổng quan
Nhóm cài đặt trong khu vực quản trị giúp kiểm soát bảo mật, hiệu năng và bảo trì: Security Headers, Resource Hints và Database Cleanup.

## 2) Vị trí trong Admin
- MMS Admin (Carbon Fields) → Tabs: ADMIN, SMTP
- MMS Tools → Tabs: Optimization Image, Optimization, Security, Security Headers, Resource Hints
- Tools → DB Cleanup

## 3) Security Headers
- File: `app/src/Settings/MMSTools/SecurityHeaders.php`
- Bật/tắt qua MMS Tools → Security Headers
- Các header hỗ trợ:
  - X-Frame-Options (SAMEORIGIN)
  - X-Content-Type-Options (nosniff)
  - Referrer-Policy (mặc định strict-origin-when-cross-origin)
  - HSTS (yêu cầu HTTPS, có preload)
  - Content-Security-Policy (Report-Only / Enforce, allow inline theo tùy chọn)
  - Permissions-Policy (tắt camera/microphone/geolocation/...)
- Kiểm thử: securityheaders.com, Mozilla Observatory

## 4) Resource Hints
- File: `theme/setup/assets.php`
- Cấu hình tại MMS Tools → Resource Hints
- Hỗ trợ:
  - Preconnect (tối đa 3 origin quan trọng)
  - DNS-Prefetch (các domain phụ)
  - Prefetch (blog page, next/prev post)

## 5) Database Cleanup
- File: `app/src/Settings/MMSTools/DatabaseCleaner.php`
- Menu: Tools → DB Cleanup (`/wp-admin/tools.php?page=mms-db-cleanup`)
- Chức năng:
  - Xoá revisions cũ (>30 ngày), auto-drafts (>7 ngày), trash (>30 ngày)
  - Xoá orphaned postmeta, orphaned term relationships
  - Xoá expired transients
  - `OPTIMIZE TABLE` các bảng chính
  - WP‑Cron chạy hàng tuần; có nút “Run Cleanup Now”
- Sau khi chạy hiển thị notice: tổng số bản ghi đã dọn và tối ưu

## 6) Khuyến nghị cấu hình nhanh
- Bật: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- HSTS: chỉ bật khi site đã dùng HTTPS ổn định
- CSP: chạy Report-Only trước khi Enforce
- Preconnect: chỉ 2–3 domain quan trọng (CDN, fonts)
- DB Cleanup: chạy manual sau khi import dữ liệu lớn

## 7) Sự cố thường gặp
- Bật CSP chặn script/style: thêm domain vào whitelist hoặc tạm để Report-Only
- Bật HSTS trên site chưa có SSL: có thể gây không truy cập được (chỉ bật khi chắc chắn)
- Preconnect quá nhiều: tốn chi phí kết nối, có thể làm chậm
