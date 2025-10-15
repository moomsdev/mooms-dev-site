# 📦 Hướng dẫn sử dụng Caching & Query Optimization

## 0) Vị trí code chính
- `app/src/Settings/MMSTools/CacheHelper.php`: Transient caching helpers
- `app/src/Settings/MMSTools/QueryOptimizer.php`: Tối ưu WP_Query, prime cache, batch meta
- `app/src/Settings/MMSTools/DatabaseCleaner.php`: Lịch dọn DB + trang Tools → DB Cleanup
- `app/helpers/cache.php`: Helper wrappers dùng trong templates

## 1) Transient Caching

### 1.1. Cache WP_Query Results (vị trí: CacheHelper::get_cached_query)
- Dùng để: cache kết quả truy vấn danh sách bài viết, giảm tải DB.
- Hoạt động: kiểm tra transient theo key; nếu miss → chạy `WP_Query`, lưu kết quả, trả về.
- Ví dụ:
```php
$results = CacheHelper::get_cached_query('recent_posts_homepage', [
  'post_type' => 'post', 'posts_per_page' => 10
], 3600);
```

### 1.2. Cache Custom Data (vị trí: CacheHelper::get_cached_data)
- Dùng để: cache API responses, tính toán nặng.
- Ví dụ:
```php
$weather = CacheHelper::get_cached_data('weather_api', function(){
  return wp_remote_retrieve_body(wp_remote_get('https://api.weather.com/data'));
}, 1800);
```

### 1.3. Cache HTML Fragment (vị trí: CacheHelper::cached_fragment)
- Dùng để: cache HTML của widget/section lặp lại.
- Ví dụ:
```php
CacheHelper::cached_fragment('sidebar_popular_posts', function(){ /* echo HTML */ }, 3600);
```

### 1.4. Xoá cache theo key/pattern (vị trí: CacheHelper::clear_cache)
```php
clear_theme_cache('posts_*');
```

## 2) Query Optimization

### 2.1. Tối ưu tham số WP_Query (vị trí: QueryOptimizer::optimize_query_args)
- Mẹo cờ nhanh:
  - `no_found_rows => true`: không cần pagination → bỏ COUNT(*)
  - `update_post_meta_cache => false`: không dùng meta → bỏ prefetch
  - `update_post_term_cache => false`: không dùng terms → bỏ prefetch
  - `fields => 'ids'`: chỉ cần ID → nhẹ nhất

### 2.2. Lấy bài viết đã tối ưu (vị trí: QueryOptimizer::get_posts_optimized)
```php
$posts = get_optimized_posts(['post_type' => 'post', 'posts_per_page' => 10], true, true);
```

### 2.3. Prime Cache chống N+1 (vị trí: prime_post_meta_cache, prime_term_cache)
```php
$posts = get_posts(['posts_per_page' => 10]);
prime_posts_cache($posts);
```

### 2.4. Batch get meta (vị trí: QueryOptimizer::get_batch_post_meta)
```php
$prices = QueryOptimizer::get_batch_post_meta([1,2,3], 'price');
```

### 2.5. Related posts có cache (vị trí: QueryOptimizer::get_related_posts)
```php
$related = get_related_posts(get_the_ID(), 5);
```

### 2.6. Theo dõi query chậm (vị trí: QueryOptimizer::monitor_query)
- Tự log vào `error_log` nếu > 100ms.

## 3) Database Cleanup (Tools → DB Cleanup)
- Vị trí code: `DatabaseCleaner.php`
- Chức năng:
  - Xoá old revisions (>30d), auto-drafts (>7d), trash (>30d)
  - Xoá orphaned postmeta, orphaned term relationships
  - Xoá expired transients; tối ưu bảng
- Lịch: WP‑Cron hàng tuần; có nút “Run Cleanup Now”.
- URL: `/wp-admin/tools.php?page=mms-db-cleanup`

## 4) Best Practices & Notes
- Đặt tên cache key có ngữ nghĩa, bao gồm tham số động (ví dụ: `category_12_page_1`).
- Invalidate cache khi dữ liệu thay đổi: đã hook `save_post`/`delete_post` tự động xóa theo pattern.
- Kết hợp Page Cache/Object Cache (Redis) ở môi trường production để tối ưu hơn (Phase 2, 3).

## 5) Ví dụ tổng hợp trong template
```php
$results = get_cached_query('homepage_posts', [ 'post_type' => 'post', 'posts_per_page' => 10 ], 3600);
$posts = $results['posts'] ?? [];
prime_posts_cache($posts);
foreach ($posts as $post) { /* render */ }
```

