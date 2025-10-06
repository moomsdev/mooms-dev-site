<?php

namespace App\Settings\MMSTools;

class OptimizeImages
{
    protected $currentUser;

	protected $superUsers = SUPER_USER;

	protected $errorMessage = '';

    public function __construct()
    {
        $this->currentUser = wp_get_current_user();

        // Khởi tạo các cài đặt mặc định
        $this->initializeSettings();

        // Hook vào quá trình upload
        add_filter('wp_handle_upload_prefilter', [self::class, 'compress_image_on_upload']);
        add_filter('wp_handle_upload', [self::class, 'compress_and_convert_to_webp']);
    }

    /**
     * Khởi tạo các cài đặt mặc định
     */
    private function initializeSettings()
    {
        // Các cài đặt sẽ được lưu vào database khi cần thiết
        if (!get_option('_jpg_quality')) {
            update_option('_jpg_quality', 85);
        }
        if (!get_option('_png_compression')) {
            update_option('_png_compression', 6);
        }
        if (!get_option('_webp_quality')) {
            update_option('_webp_quality', 85);
        }
        if (!get_option('_min_size_saving')) {
            update_option('_min_size_saving', 10);
        }
        if (!get_option('_max_width')) {
            update_option('_max_width', 2048);
        }
        if (!get_option('_max_height')) {
            update_option('_max_height', 2048);
        }
    }

    /**
     * Lấy cấu hình nén hình ảnh
     */
    public static function get_compression_settings()
    {
        $enable_compression_image = get_option('_enable_compression_image') === 'yes';
        $enable_webp_conversion = get_option('_enable_webp_conversion') === 'yes';
        $jpg_quality = get_option('_jpg_quality', 85);
        $png_compression = get_option('_png_compression', 6);
        $webp_quality = get_option('_webp_quality', 85);
        $min_size_saving = get_option('_min_size_saving', 10);
        $max_width = get_option('_max_width', 2048);
        $max_height = get_option('_max_height', 2048);
        $preserve_original = get_option('_preserve_original') === 'yes';

        return [
            'jpg_quality' => intval($jpg_quality),        // Chất lượng JPG (0-100)
            'png_compression' => intval($png_compression),     // Mức nén PNG (0-9)
            'webp_quality' => intval($webp_quality),       // Chất lượng WebP (0-100)
            'min_size_saving' => intval($min_size_saving),    // Tỷ lệ tiết kiệm tối thiểu để chuyển WebP (%)
            'max_width' => intval($max_width),        // Chiều rộng tối đa (px)
            'max_height' => intval($max_height),       // Chiều cao tối đa (px)
            'enable_webp_conversion' => $enable_webp_conversion,
            'enable_compression_image' => $enable_compression_image,
            'preserve_original' => $preserve_original, // Có giữ file gốc không
        ];
    }

    /**
     * Lấy cấu hình từ theme options hoặc sử dụng mặc định
     */
    public static function get_settings()
    {
        $default_settings = self::get_compression_settings();
        
        // Có thể lấy từ theme options nếu có
        $theme_settings = get_option('moomsdev_image_optimization', []);
        
        return wp_parse_args($theme_settings, $default_settings);
    }

    /**
     * Kiểm tra xem có nên bật tối ưu hóa không
     */
    public static function should_optimize()
    {
        $settings = self::get_settings();
        return $settings['enable_compression_image'] || $settings['enable_webp_conversion'];
    }

    /**
     * Kiểm tra hỗ trợ WebP
     */
    public static function supports_webp()
    {
        return function_exists('imagewebp') && function_exists('imagecreatefromwebp');
    }

    /**
     * Kiểm tra hỗ trợ GD
     */
    public static function supports_gd()
    {
        return extension_loaded('gd') && function_exists('gd_info');
    }

    /**
     * Lấy thông tin hỗ trợ
     */
    public static function get_support_info()
    {
        return [
            'gd' => self::supports_gd(),
            'webp' => self::supports_webp(),
            'jpeg' => function_exists('imagecreatefromjpeg'),
            'png' => function_exists('imagecreatefrompng'),
        ];
    }

    /**
     * Nén và chuyển đổi hình ảnh sang WebP khi upload
     * 
     * @param array $upload Thông tin upload từ WordPress
     * @return array Thông tin upload đã được xử lý
     */
    public static function compress_and_convert_to_webp($upload)
    {
        // Kiểm tra cấu hình
        if (!self::should_optimize()) {
            return $upload;
        }

        $settings = self::get_settings();
        
        // Chỉ xử lý hình ảnh
        if (!isset($upload['type']) || strpos($upload['type'], 'image/') !== 0) {
            return $upload;
        }

        $image_path = $upload['file'];
        $image_info = getimagesize($image_path);
        
        if ($image_info === false) {
            return $upload;
        }

        // Chỉ xử lý JPG và PNG
        $supported_mime_types = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
        ];

        if (!array_key_exists($image_info['mime'], $supported_mime_types)) {
            return $upload;
        }

        // Kiểm tra hỗ trợ WebP
        if (!self::supports_webp()) {
            error_log('WebP conversion not supported on this server');
            return $upload;
        }

        try {
            // Đọc hình ảnh
            $image_data = file_get_contents($image_path);
            if (!$image_data) {
                return $upload;
            }

            $image = imagecreatefromstring($image_data);
            if (!$image) {
                return $upload;
            }

            // Kiểm tra ảnh truecolor (32-bit)
            if (!imageistruecolor($image)) {
                imagedestroy($image);
                return $upload;
            }

            // Resize nếu cần
            $width = imagesx($image);
            $height = imagesy($image);
            
            if ($width > $settings['max_width'] || $height > $settings['max_height']) {
                $ratio = min($settings['max_width'] / $width, $settings['max_height'] / $height);
                $new_width = intval($width * $ratio);
                $new_height = intval($height * $ratio);
                
                $resized_image = imagecreatetruecolor($new_width, $new_height);
                imagecopyresampled($resized_image, $image, 0, 0, 0, 0, $new_width, $new_height, $width, $height);
                imagedestroy($image);
                $image = $resized_image;
            }
            
            // Tạo tên file WebP
            $webp_path = preg_replace('/\.(jpg|jpeg|png)$/i', '.webp', $image_path);
            
            // Đảm bảo tên file duy nhất
            $upload_dir = wp_upload_dir();
            $file_dir = dirname($webp_path);
            $file_name = basename($webp_path);
            $unique_file_name = wp_unique_filename($upload_dir['path'], $file_name);
            $unique_webp_path = $file_dir . '/' . $unique_file_name;

            // Chuyển đổi sang WebP
            $webp_success = imagewebp($image, $unique_webp_path, $settings['webp_quality']);
            
            if ($webp_success) {
                // Kiểm tra kích thước file WebP
                $original_size = filesize($image_path);
                $webp_size = filesize($unique_webp_path);
                
                // Chỉ sử dụng WebP nếu kích thước nhỏ hơn theo cấu hình
                $min_saving = (100 - $settings['min_size_saving']) / 100;
                if ($webp_size < ($original_size * $min_saving)) {
                    // Xóa file gốc nếu không giữ
                    if (!$settings['preserve_original']) {
                        unlink($image_path);
                    }
                    
                    // Cập nhật thông tin upload
                    $upload['file'] = $unique_webp_path;
                    $upload['type'] = 'image/webp';
                    $upload['url'] = str_replace($upload_dir['basedir'], $upload_dir['baseurl'], $unique_webp_path);
                    
                    error_log("Successfully converted image to WebP: {$image_path} -> {$unique_webp_path} (Saved: " . round((($original_size - $webp_size) / $original_size) * 100, 2) . "%)");
                } else {
                    // Xóa file WebP vì không hiệu quả
                    unlink($unique_webp_path);
                    error_log("WebP conversion not beneficial for: {$image_path} (Original: {$original_size}, WebP: {$webp_size})");
                }
            } else {
                error_log("Failed to convert image to WebP: {$image_path}");
            }

            imagedestroy($image);
            
        } catch (Exception $e) {
            error_log("Error in WebP conversion: " . $e->getMessage());
        }

        return $upload;
    }

    /**
     * Nén hình ảnh JPG/PNG khi upload
     * 
     * @param array $file Thông tin file upload
     * @return array Thông tin file đã được nén
     */
    public static function compress_image_on_upload($file)
    {
        // Kiểm tra cấu hình
        if (!self::should_optimize()) {
            return $file;
        }

        $settings = self::get_settings();
        
        // Chỉ xử lý hình ảnh
        if (!isset($file['type']) || strpos($file['type'], 'image/') !== 0) {
            return $file;
        }

        $image_type = exif_imagetype($file['tmp_name']);
        
        // Chỉ xử lý JPG và PNG
        if ($image_type !== IMAGETYPE_JPEG && $image_type !== IMAGETYPE_PNG) {
            return $file;
        }

        try {
            $image = null;
            
            if ($image_type === IMAGETYPE_JPEG) {
                $image = imagecreatefromjpeg($file['tmp_name']);
                if ($image) {
                    // Nén JPG với chất lượng từ cấu hình
                    imagejpeg($image, $file['tmp_name'], $settings['jpg_quality']);
                }
            } elseif ($image_type === IMAGETYPE_PNG) {
                $image = imagecreatefrompng($file['tmp_name']);
                if ($image) {
                    // Kiểm tra ảnh truecolor
                    if (imageistruecolor($image)) {
                        // Nén PNG với mức nén từ cấu hình
                        imagepng($image, $file['tmp_name'], $settings['png_compression']);
                    }
                }
            }

            if ($image) {
                imagedestroy($image);
            }
            
        } catch (Exception $e) {
            error_log("Error in image compression: " . $e->getMessage());
        }

        return $file;
    }
}

