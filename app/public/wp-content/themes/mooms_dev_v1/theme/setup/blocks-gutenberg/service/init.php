<?php
/**
 * Service Gutenberg Block - Registration and Render Callback
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register Service Block (script + block type)
 */
function mms_register_service_block()
{
    $dir = get_template_directory() . '/setup/blocks-gutenberg/service';
    $uri = get_template_directory_uri() . '/setup/blocks-gutenberg/service';

    // Register editor script
    wp_register_script(
        'mms-service-editor-script',
        $uri . '/build/index.js',
        array('wp-blocks', 'wp-i18n', 'wp-element', 'wp-components', 'wp-editor', 'wp-block-editor', 'wp-api-fetch'),
        file_exists($dir . '/build/index.js') ? filemtime($dir . '/build/index.js') : '1.0'
    );

    // Register block type with render callback
    if (function_exists('register_block_type')) {
        register_block_type('mms/service', array(
            'api_version'    => 2,
            'editor_script'  => 'mms-service-editor-script',
            'render_callback'=> 'mms_render_service_block',
            'attributes'     => array(
                'title' => array(
                    'type'    => 'string',
                    'default' => 'Our Services'
                ),
                'desc' => array(
                    'type'    => 'string',
                    'default' => ''
                ),
                'selectedServices' => array(
                    'type'    => 'array',
                    'default' => array()
                )
            )
        ));
    }
}
add_action('init', 'mms_register_service_block');

/**
 * Render callback for Service Block
 * Mirrors the Carbon Fields block output structure
 */
function mms_render_service_block($attributes)
{
    $title              = isset($attributes['title']) ? esc_html($attributes['title']) : '';
    $desc               = isset($attributes['desc']) ? $attributes['desc'] : '';
    $selected_services  = isset($attributes['selectedServices']) ? (array) $attributes['selectedServices'] : array();

    if (empty($selected_services)) {
        return '<p style="text-align:center;padding:40px;background:#f0f0f0;">Chọn dịch vụ để hiển thị</p>';
    }

    ob_start();
    ?>
    <section class="block-service">
        <div class="container">
            <h2 class="block-title block-title-scroll"><?php echo $title; ?></h2>
            <div class="block-desc"><?php echo wp_kses_post($desc); ?></div>

            <div class="block-service__list">
                <?php foreach ($selected_services as $service_id) :
                    $permalink     = get_the_permalink($service_id);
                    $service_title = get_the_title($service_id);
                    $service_desc  = get_the_excerpt($service_id);
                    $firstLetter   = substr($service_title, 0, 1);
                ?>
                    <div class="block-service__item">
                        <a href="<?php echo esc_url($permalink); ?>" class="item__link">
                            <span class="item__icon"><?php echo esc_html($firstLetter); ?></span>
                            <h3 class="item__title"><?php echo esc_html($service_title); ?></h3>
                            <div class="item__desc"><?php echo wp_kses_post($service_desc); ?></div>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php
    return ob_get_clean();
}



