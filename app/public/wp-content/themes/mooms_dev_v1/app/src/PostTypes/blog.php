<?php

namespace App\PostTypes;

use Carbon_Fields\Container\Container;
use Carbon_Fields\Field;
use mms\Abstracts\AbstractPostType;

class blog extends \App\Abstracts\AbstractPostType
{

    public function __construct() {
        $this->showThumbnailOnList = true;
        $this->supports            = [
            'title',
            'editor',
            'thumbnail',
            'page-attributes',
        ];

        $this->menuIcon         = 'dashicons-admin-post'; //https://developer.wordpress.org/resource/dashicons/
        // $this->menuIcon = get_template_directory_uri() . '/images/custom-icon.png';
        $this->post_type        = 'blog';
        $this->singularName     = $this->pluralName = 'Blog'; 
        $this->titlePlaceHolder = 'Post';
        $this->slug             = 'blogs';
        add_action( 'carbon_fields_register_fields', [ $this, 'metaFields' ] );
        parent::__construct();
    }

    /**
     * Document: https://docs.carbonfields.net/#/containers/post-meta
     */
    public function metaFields()
    {
        Container::make('post_meta', __('Description | Mô tả', 'mms'))
            ->set_context('normal') // Sử dụng context 'normal' để hiển thị trong Gutenberg
            ->set_priority('default')
            ->where('post_type', 'IN', [$this->post_type])
            ->add_fields([
                Field::make('complex', 'blog_extra', __('', 'mms'))
                    ->set_layout('tabbed-horizontal')
                    ->set_width(70)
                    ->add_fields([
                        Field::make('text', 'content', __('Content | Nội dung', 'mms')),
                    ])->set_header_template('<% if (content) { %><%- content %><% } %>'),
            ]);
    }
}
