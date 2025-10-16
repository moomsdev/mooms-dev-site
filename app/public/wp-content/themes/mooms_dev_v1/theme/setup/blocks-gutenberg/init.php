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

// Load Service block registration & render from its own folder (for maintainability)
$service_init = get_template_directory() . '/setup/blocks-gutenberg/service/init.php';
if (file_exists($service_init)) {
    require_once $service_init;
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
