<?php
/**
 * Initialize all Gutenberg blocks in theme/setup/blocks-gutenberg
 * Theo cách của timeline-block plugin: register_block_type() với handles
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Register About Me Block
 */
function mms_register_about_me_block() {
    $dir = get_template_directory() . '/setup/blocks-gutenberg/about-me';
    $uri = get_template_directory_uri() . '/setup/blocks-gutenberg/about-me';

    // Register editor script (NOT in footer for editor context)
    wp_register_script(
        'mms-about-me-editor-script',
        $uri . '/build/index.js',
        array('wp-blocks', 'wp-i18n', 'wp-element', 'wp-components', 'wp-editor', 'wp-block-editor'),
        file_exists($dir . '/build/index.js') ? filemtime($dir . '/build/index.js') : '1.0'
    );

    // Register block type
    if (function_exists('register_block_type')) {
        register_block_type('mms/about-me', array(
            'api_version'   => 2,
            'editor_script' => 'mms-about-me-editor-script',
        ));
    }
}
add_action('init', 'mms_register_about_me_block');

/**
 * Register Service Block
 */
function mms_register_service_block() {
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
            'api_version'   => 2,
            'editor_script' => 'mms-service-editor-script',
            'render_callback' => 'mms_render_service_block',
            'attributes' => array(
                'title' => array(
                    'type' => 'string',
                    'default' => 'Our Services'
                ),
                'desc' => array(
                    'type' => 'string',
                    'default' => ''
                ),
                'selectedServices' => array(
                    'type' => 'array',
                    'default' => array()
                )
            )
        ));
    }
}
add_action('init', 'mms_register_service_block');

/**
 * Render callback for Service Block
 * Tương tự như Carbon Fields render callback trong service.php
 */
function mms_render_service_block($attributes) {
    $title = isset($attributes['title']) ? esc_html($attributes['title']) : '';
    $desc = isset($attributes['desc']) ? $attributes['desc'] : '';
    $selected_services = isset($attributes['selectedServices']) ? $attributes['selectedServices'] : array();

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
                <?php
                foreach ($selected_services as $service_id) :
                    $permalink = get_the_permalink($service_id);
                    $service_title = get_the_title($service_id);
                    $service_desc = get_the_excerpt($service_id);
                    $firstLetter = substr($service_title, 0, 1);
                ?>
                    <div class="block-service__item">
                        <a href="<?php echo esc_url($permalink); ?>" class="item__link">
                            <span class="item__icon"><?php echo esc_html($firstLetter); ?></span>
                            <h3 class="item__title"><?php echo esc_html($service_title); ?></h3>
                            <div class="item__desc"><?php echo wp_kses_post($service_desc); ?></div>
                        </a>
                    </div>
                <?php
                endforeach;
                ?>
            </div>
        </div>
    </section>
    <?php
    return ob_get_clean();
}

/**
 * Explicitly enqueue block assets in editor context
 * Timeline-block registers scripts but WordPress needs explicit enqueue for editor
 */
function mms_blocks_enqueue_editor_assets() {
    // Enqueue common editor CSS
    wp_enqueue_style(
        'mms-blocks-common-editor',
        get_template_directory_uri() . '/setup/blocks-gutenberg/common-editor.css',
        array('wp-edit-blocks'),
        file_exists(get_template_directory() . '/setup/blocks-gutenberg/common-editor.css') 
            ? filemtime(get_template_directory() . '/setup/blocks-gutenberg/common-editor.css')
            : '1.0'
    );
    
    $theme_dir = dirname(get_template_directory());
    $theme_css = $theme_dir . '/dist/styles/theme.css';
    if (file_exists($theme_css)) {
        wp_enqueue_style(
            'mms-blocks-theme-styles',
            dirname(get_template_directory_uri()) . '/dist/styles/theme.css',
            array('wp-edit-blocks'),
            filemtime($theme_css)
        );
    }
    

    // Enqueue all block scripts
    wp_enqueue_script('mms-about-me-editor-script');
    wp_enqueue_script('mms-service-editor-script');
    
    wp_add_inline_script('mms-about-me-editor-script', '
        console.log("[MMS Blocks] Scripts loaded and enqueued");
        console.log("[MMS Blocks] Theme CSS loaded for editor");
        
        if (window.wp && window.wp.data) {
            wp.data.subscribe(function() {
                var blocks = wp.data.select("core/blocks").getBlockTypes();
                var mmsBlocks = blocks.filter(function(b) { return b.name.indexOf("mms/") === 0; });
                if (mmsBlocks.length > 0) {
                    console.log("[MMS Blocks] ✓ Found " + mmsBlocks.length + " MMS blocks:", mmsBlocks.map(function(b) { return b.name; }));
                }
            });
        }
    ', 'after');
}
add_action('enqueue_block_editor_assets', 'mms_blocks_enqueue_editor_assets');
