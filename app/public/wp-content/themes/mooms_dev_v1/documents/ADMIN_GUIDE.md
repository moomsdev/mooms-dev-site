# 🛠️ MMS Admin & Tools Guide

## 1) Tổng quan
Nhóm cài đặt trong khu vực quản trị giúp kiểm soát bảo mật, hiệu năng và bảo trì: Security Headers, Resource Hints và Database Cleanup.

## 2) Vị trí trong Admin
- MMS Admin (Carbon Fields) → Tabs: ADMIN, SMTP
- MMS Tools → Tabs: Optimization Image, Optimization, Security, Security Headers, Resource Hints
- Tools → DB Cleanup

## 3) Optimization Image (Chi tiết)
Các thiết lập ảnh được áp dụng khi upload ảnh mới. Một số tác vụ có thể cần plugin “Regenerate Thumbnails” để áp dụng cho ảnh cũ.

1) Bật nén ảnh (JPEG/PNG)
- Dùng để: giảm dung lượng ảnh, tăng tốc tải trang, tiết kiệm băng thông.
- Cách hoạt động: nén lossless/lossy tùy theo định dạng và mức chất lượng bạn chọn; ưu tiên giữ chất lượng nhìn ổn định cho người dùng.
- Tùy chọn liên quan:
  - Chất lượng JPEG (0–100): đề xuất 72–85 cho site nội dung, 85–92 cho ảnh sản phẩm cần chi tiết.
  - Chất lượng PNG (0–9 nếu có, hoặc chuyển sang WebP để tối ưu tốt hơn).
  - Loại bỏ metadata EXIF (giảm vài KB mỗi ảnh).
- Yêu cầu: PHP GD hoặc Imagick (Imagick cho chất lượng tốt, tốc độ ổn định hơn).

2) Bật chuyển đổi WebP
- Dùng để: tạo phiên bản WebP dung lượng thấp hơn JPEG/PNG, giúp tăng điểm hiệu năng.
- Hỗ trợ: tạo song song file `.webp` khi upload; template có thể ưu tiên hiển thị WebP nếu browser hỗ trợ.
- Lưu ý tương thích: Safari 14+, Chrome/Edge/Firefox đã hỗ trợ; với trình duyệt cũ sẽ fallback về JPEG/PNG.
- Khuyến nghị: vẫn giữ bản gốc JPEG/PNG để đảm bảo tương thích toàn diện.

3) Giữ file gốc sau khi chuyển đổi (Keep original)
- Bật để: luôn giữ lại file JPEG/PNG gốc bên cạnh WebP.
- Tác dụng: đảm bảo fallback khi trình duyệt không hỗ trợ WebP; an toàn cho tích hợp bên thứ 3 (CDN, plugins).
- Nhược điểm: tốn thêm dung lượng lưu trữ.

4) Giới hạn kích thước ảnh gốc (max_width / max_height)
- Dùng để: tự động resize ảnh gốc vượt quá ngưỡng (ví dụ 2560px) nhằm tránh ảnh quá lớn.
- Cách hoạt động: nếu ảnh > giới hạn, hệ thống sẽ scale down giữ nguyên tỉ lệ; không upscale ảnh nhỏ.
- Khuyến nghị: 1920–2560px cho ảnh hero; 1200–1600px cho nội dung bài viết.

5) Tỉ lệ tiết kiệm kỳ vọng (chỉ báo)
- Hiển thị ước lượng % dung lượng có thể tiết kiệm dựa vào thiết lập hiện tại (chỉ tham khảo, tùy từng ảnh).

6) Loại ảnh được xử lý
- JPEG/JPG, PNG (có thể GIF tĩnh), SVG không nén nhưng có thể sanitize (nếu bật hỗ trợ).
- WebP được tạo thêm khi tùy chọn chuyển đổi WebP bật.

7) Khi nào áp dụng?
- Tự động khi upload media mới qua Media Library/REST/API.
- Với ảnh cũ: dùng plugin “Regenerate Thumbnails” hoặc batch script để áp dụng lại theo thiết lập mới.

8) Tích hợp hiển thị ở front-end
- Sử dụng tag `<picture>` hoặc filter hình ảnh để ưu tiên file `.webp` nếu tồn tại, fallback sang JPEG/PNG.
- Ví dụ (ý tưởng): `<source type="image/webp" srcset="image.webp"> <img src="image.jpg" alt="...">`
- Có thể kết hợp lazyload (native hoặc thư viện) để giảm LCP.

9) Khuyến nghị cấu hình nhanh
- Bật nén JPEG ở mức 80–85; bật WebP; giữ file gốc; giới hạn chiều rộng 1920–2560px.
- Với site thương mại điện tử: cân nhắc 85–92 cho ảnh sản phẩm (giữ chi tiết), vẫn bật WebP.

10) Troubleshooting
- Ảnh không tạo WebP: kiểm tra extension GD/Imagick có hỗ trợ WebP; kiểm tra quyền ghi thư mục `uploads/`.
- Ảnh bị quá mờ: tăng chất lượng JPEG hoặc tắt nén quá mạnh; kiểm tra nén từng loại ảnh.
- Sai tỉ lệ sau resize: đảm bảo không bật crop cưỡng bức; nên dùng scale giữ tỉ lệ.

## 4) Security Headers
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

## 5) Resource Hints
- File: `theme/setup/assets.php`
- Cấu hình tại MMS Tools → Resource Hints
- Hỗ trợ:
  - Preconnect (tối đa 3 origin quan trọng)
  - DNS-Prefetch (các domain phụ)
  - Prefetch (blog page, next/prev post)

## 6) Database Cleanup
- File: `app/src/Settings/MMSTools/DatabaseCleaner.php`
- Menu: Tools → DB Cleanup (`/wp-admin/tools.php?page=mms-db-cleanup`)
- Chức năng:
  - Xoá revisions cũ (>30 ngày), auto-drafts (>7 ngày), trash (>30 ngày)
  - Xoá orphaned postmeta, orphaned term relationships
  - Xoá expired transients
  - `OPTIMIZE TABLE` các bảng chính
  - WP‑Cron chạy hàng tuần; có nút “Run Cleanup Now”
- Sau khi chạy hiển thị notice: tổng số bản ghi đã dọn và tối ưu

## 7) Khuyến nghị cấu hình nhanh
- Bật: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- HSTS: chỉ bật khi site đã dùng HTTPS ổn định
- CSP: chạy Report-Only trước khi Enforce
- Preconnect: chỉ 2–3 domain quan trọng (CDN, fonts)
- DB Cleanup: chạy manual sau khi import dữ liệu lớn

## 8) Sự cố thường gặp
- Bật CSP chặn script/style: thêm domain vào whitelist hoặc tạm để Report-Only
- Bật HSTS trên site chưa có SSL: có thể gây không truy cập được (chỉ bật khi chắc chắn)
- Preconnect quá nhiều: tốn chi phí kết nối, có thể làm chậm
