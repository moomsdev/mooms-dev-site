# 📦 Hướng dẫn sử dụng Caching & Query Optimization

## 📚 Mục lục

1. [Transient Caching](#1-transient-caching)
2. [Query Optimization](#2-query-optimization)
3. [Database Cleanup](#3-database-cleanup)
4. [Best Practices](#4-best-practices)
5. [Examples](#5-examples)

---

## 1. Transient Caching

### **CacheHelper Class**

Class này cung cấp các helper functions để cache data dễ dàng.

### **1.1. Cache WP_Query Results**

```php
use App\Settings\MMSTools\CacheHelper;

// Cache query results
$cache_key = 'recent_posts_homepage';
$args = [
    'post_type' => 'post',
    'posts_per_page' => 10,
    'orderby' => 'date'
];
$expiration = 3600; // 1 giờ

$results = CacheHelper::get_cached_query($cache_key, $args, $expiration);

// Sử dụng results
foreach ($results['posts'] as $post) {
    echo $post->post_title;
}
```

### **1.2. Cache Custom Data**

```php
// Cache API response
$weather = CacheHelper::get_cached_data('weather_api', function() {
    $response = wp_remote_get('https://api.weather.com/data');
    return json_decode(wp_remote_retrieve_body($response), true);
}, 1800); // 30 phút

// Cache complex calculations
$sales_report = CacheHelper::get_cached_data('monthly_sales', function() {
    global $wpdb;
    return $wpdb->get_results("SELECT ...");
}, 86400); // 1 ngày
```

### **1.3. Cache HTML Fragment**

```php
// Cache widget HTML
CacheHelper::cached_fragment('sidebar_popular_posts', function() {
    ?>
    <div class="popular-posts">
        <?php
        $posts = get_posts(['posts_per_page' => 5]);
        foreach ($posts as $post) {
            echo '<h3>' . $post->post_title . '</h3>';
        }
        ?>
    </div>
    <?php
}, 3600);
```

### **1.4. Clear Cache**

```php
// Clear single cache
CacheHelper::clear_cache('recent_posts_homepage');

// Clear by pattern
CacheHelper::clear_cache('posts_*'); // Clear tất cả cache bắt đầu bằng "posts_"

// Clear all transients
CacheHelper::clear_all_transients();

// Auto clear on save (đã tự động hook)
// Khi save post, cache liên quan tự động bị xóa
```

### **1.5. Helper Functions (Wrapper)**

```php
// Trong template files, dùng helper functions
$posts = get_cached_query('recent_posts', [
    'post_type' => 'post',
    'posts_per_page' => 10
], 3600);

$data = get_cached_data('api_key', function() {
    return expensive_operation();
}, 1800);

cached_fragment('widget_key', function() {
    // Render HTML
}, 3600);

clear_theme_cache('posts_*');
```

---

## 2. Query Optimization

### **QueryOptimizer Class**

Tối ưu WP_Query và tránh N+1 queries.

### **2.1. Optimize Query Args**

```php
use App\Settings\MMSTools\QueryOptimizer;

// Tự động optimize args
$args = [
    'post_type' => 'post',
    'posts_per_page' => 10
];

$optimized_args = QueryOptimizer::optimize_query_args($args, [
    'no_found_rows' => true,          // Bỏ COUNT query
    'update_post_meta_cache' => false, // Không cần meta
    'update_post_term_cache' => false, // Không cần terms
    'fields' => 'ids'                  // Chỉ lấy IDs
]);

$query = new WP_Query($optimized_args);
```

### **2.2. Get Optimized Posts**

```php
// Wrapper function với auto optimization
$posts = QueryOptimizer::get_posts_optimized([
    'post_type' => 'service',
    'posts_per_page' => 12
], true, true); // Prime meta + terms cache

// Hoặc dùng helper
$posts = get_optimized_posts([
    'post_type' => 'blog'
]);
```

### **2.3. Prime Cache (Tránh N+1 Queries)**

```php
// Prime term cache
$post_ids = [1, 2, 3, 4, 5];
QueryOptimizer::prime_term_cache($post_ids, ['category', 'post_tag']);

// Prime post meta cache
QueryOptimizer::prime_post_meta_cache($post_ids);

// Prime cả hai
$posts = get_posts(['posts_per_page' => 10]);
prime_posts_cache($posts);

// Loop sau đó không bị N+1 queries
foreach ($posts as $post) {
    $meta = get_post_meta($post->ID, 'custom_field', true); // Từ cache
    $terms = get_the_terms($post->ID, 'category'); // Từ cache
}
```

### **2.4. Batch Get Meta**

```php
// Thay vì loop get_post_meta (N queries)
$post_ids = [1, 2, 3, 4, 5];
$meta_values = QueryOptimizer::get_batch_post_meta($post_ids, 'price');

// $meta_values = [
//     1 => '100',
//     2 => '200',
//     3 => '150',
// ]

// Chỉ 1 query thay vì 5 queries
```

### **2.5. Get Related Posts**

```php
// Related posts với caching
$related = QueryOptimizer::get_related_posts($post_id, 5);

// Hoặc dùng helper
$related = get_related_posts(get_the_ID(), 5);
```

### **2.6. Monitor Query Performance**

```php
// Monitor và log slow queries
$posts = QueryOptimizer::monitor_query('homepage_posts', function() {
    return new WP_Query([
        'post_type' => 'post',
        'posts_per_page' => 20
    ]);
});

// Nếu query > 100ms, sẽ log vào error_log
// "Slow query detected: homepage_posts took 0.250 seconds"

// Get performance report
$stats = QueryOptimizer::get_performance_report();
// [
//     'total_queries' => 25,
//     'query_time' => '0.150',
//     'cache_stats' => [...]
// ]
```

---

## 3. Database Cleanup

### **DatabaseCleaner Class**

Auto cleanup database và admin UI.

### **3.1. Auto Cleanup**

- Chạy tự động hàng tuần qua WP-Cron
- Hook: `mms_database_cleanup`

**Cleanup tasks:**
1. Delete old revisions (> 30 days)
2. Delete auto-drafts (> 7 days)
3. Delete trashed posts (> 30 days)
4. Delete orphaned postmeta
5. Delete orphaned term relationships
6. Delete expired transients
7. Optimize tables

### **3.2. Manual Cleanup**

**Admin UI:**
1. Vào: `Tools → DB Cleanup`
2. Xem statistics:
   - Post Revisions: X
   - Auto Drafts: X
   - Trashed Posts: X
   - Orphaned Postmeta: X
   - Expired Transients: X
   - Database Size: X MB
3. Click "Run Cleanup Now"

### **3.3. Programmatic Cleanup**

```php
use App\Settings\MMSTools\DatabaseCleaner;

$cleaner = new DatabaseCleaner();

// Run cleanup
$result = $cleaner->run_cleanup();
// [
//     'revisions' => 150,
//     'auto_drafts' => 25,
//     'trash' => 10,
//     'orphaned_meta' => 50,
//     'orphaned_terms' => 8,
//     'expired_transients' => 100,
//     'total' => 343
// ]

// Get stats
$stats = $cleaner->get_cleanup_stats();
```

---

## 4. Best Practices

### **4.1. Query Optimization**

#### ❌ Bad (Slow)
```php
// N+1 queries
$posts = get_posts(['posts_per_page' => 10]);
foreach ($posts as $post) {
    $meta = get_post_meta($post->ID, 'price', true); // 10 queries
    $terms = get_the_terms($post->ID, 'category'); // 10 queries
}
// Total: 1 + 10 + 10 = 21 queries
```

#### ✅ Good (Fast)
```php
// Optimized
$posts = get_optimized_posts(['posts_per_page' => 10], true, true);
foreach ($posts as $post) {
    $meta = get_post_meta($post->ID, 'price', true); // From cache
    $terms = get_the_terms($post->ID, 'category'); // From cache
}
// Total: 1 query + 2 prime queries = 3 queries
```

### **4.2. Caching Strategy**

| Content Type | Cache Duration | Clear When |
|-------------|----------------|------------|
| Homepage posts | 1 hour | Save/delete post |
| Sidebar widgets | 6 hours | Save post |
| API responses | 30 mins | Manual |
| Product catalog | 12 hours | Save product |
| User dashboard | No cache | Always fresh |

### **4.3. Cache Keys Naming**

```php
// Good naming convention
'homepage_recent_posts'
'sidebar_popular_posts_5'
'category_12_posts_page_1'
'user_123_dashboard'
'api_weather_hanoi'

// Use dynamic keys
$cache_key = sprintf('category_%d_posts_page_%d', $cat_id, $paged);
```

### **4.4. WP_Query Flags**

```php
// Không cần pagination?
$args['no_found_rows'] = true; // Bỏ COUNT(*) query

// Không cần meta?
$args['update_post_meta_cache'] = false;

// Không cần terms?
$args['update_post_term_cache'] = false;

// Chỉ cần IDs?
$args['fields'] = 'ids'; // Hoặc 'id=>parent'

// Example:
$post_ids = get_posts([
    'post_type' => 'post',
    'posts_per_page' => 100,
    'fields' => 'ids',
    'no_found_rows' => true,
    'update_post_meta_cache' => false,
    'update_post_term_cache' => false
]);
// Rất nhanh, chỉ SELECT ID
```

---

## 5. Examples

### **Example 1: Homepage Posts với Cache**

```php
// functions.php hoặc template
function get_homepage_posts() {
    return get_cached_query('homepage_posts', [
        'post_type' => 'post',
        'posts_per_page' => 10,
        'orderby' => 'date'
    ], 3600); // Cache 1 giờ
}

// Template
$results = get_homepage_posts();
foreach ($results['posts'] as $post) {
    setup_postdata($post);
    the_title();
    the_excerpt();
}
wp_reset_postdata();

// Auto clear khi save post (đã hook sẵn)
```

### **Example 2: Related Posts Optimized**

```php
// single.php
$related = get_related_posts(get_the_ID(), 5);

if ($related) {
    echo '<h3>Bài viết liên quan</h3>';
    foreach ($related as $post) {
        setup_postdata($post);
        the_title();
    }
    wp_reset_postdata();
}
```

### **Example 3: Custom Loop với Prime Cache**

```php
$posts = get_posts([
    'post_type' => 'service',
    'posts_per_page' => 20
]);

// Prime cache trước khi loop
prime_posts_cache($posts);

foreach ($posts as $post) {
    $price = get_post_meta($post->ID, 'price', true); // From cache
    $category = get_the_terms($post->ID, 'service_cat'); // From cache
    
    echo $post->post_title . ' - ' . $price;
}
```

### **Example 4: Widget với Fragment Cache**

```php
// widget render
cached_fragment('popular_posts_widget', function() {
    $posts = get_posts([
        'posts_per_page' => 5,
        'orderby' => 'comment_count'
    ]);
    
    echo '<ul class="popular-posts">';
    foreach ($posts as $post) {
        echo '<li>' . $post->post_title . '</li>';
    }
    echo '</ul>';
}, 3600);
```

### **Example 5: Batch Operations**

```php
// Lấy giá cho nhiều products
$product_ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
$prices = QueryOptimizer::get_batch_post_meta($product_ids, 'price');

foreach ($product_ids as $id) {
    $price = $prices[$id] ?? '0';
    echo "Product {$id}: {$price}";
}
// Chỉ 1 query thay vì 10 queries
```

### **Example 6: Monitor Performance**

```php
// Wrap expensive operations
$heavy_query = QueryOptimizer::monitor_query('complex_report', function() {
    global $wpdb;
    return $wpdb->get_results("
        SELECT p.*, COUNT(c.comment_ID) as comment_count
        FROM {$wpdb->posts} p
        LEFT JOIN {$wpdb->comments} c ON c.comment_post_ID = p.ID
        GROUP BY p.ID
        ORDER BY comment_count DESC
        LIMIT 50
    ");
});

// Check error_log nếu query > 100ms
```

---

## 🎯 Testing & Monitoring

### **1. Install Query Monitor**
```bash
wp plugin install query-monitor --activate
```

### **2. Check Performance**
- Admin bar → Query Monitor
- Xem:
  - **Queries:** Tổng số queries
  - **Query Time:** Thời gian query
  - **Slow Queries:** Queries > 50ms
  - **Duplicate Queries:** Queries trùng lặp

### **3. Cache Stats**
```php
$stats = CacheHelper::get_cache_stats();
print_r($stats);
// [
//     'total' => 150,
//     'expired' => 20,
//     'active' => 130,
//     'size_bytes' => 524288,
//     'size_mb' => 0.5
// ]
```

### **4. Expected Results**
- ✅ Queries giảm: **30-50%**
- ✅ Query time giảm: **50-70%**
- ✅ TTFB giảm: **200-500ms** → **50-100ms**
- ✅ Database size giảm: **20-30%** (sau cleanup)

---

## 🚨 Notes

1. **Transient cache:**
   - Lưu trong `wp_options` table
   - Auto expire
   - Phù hợp cho: queries, API responses, calculations

2. **Object cache (Redis - Phase 2):**
   - Lưu trong RAM
   - Nhanh hơn transient
   - Cần Redis server

3. **Page cache (Phase 3):**
   - Cache toàn bộ HTML
   - Nhanh nhất
   - Chỉ cho logged-out users

4. **Clear cache khi:**
   - Save/delete post → Auto (đã hook)
   - Update theme/plugin → Manual
   - Change settings → Manual
   - Deploy production → Manual: `clear_theme_cache('*')`

---

**🎉 Happy Caching!**

