<?php

/**
 * Theme header partial.
 *
 * @link    https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package WPEmergeTheme
 */
?>
<!DOCTYPE html>
<html <?php language_attributes(); ?> data-theme="light">

<head>
	<meta http-equiv="Content-Type" content="<?php bloginfo('html_type'); ?>; charset=<?php bloginfo('charset'); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="profile" href="http://gmpg.org/xfn/11" />
	<link rel="pingback" href="<?php bloginfo('pingback_url'); ?>" />
	<?php wp_head(); ?>

	<link rel="apple-touch-icon" sizes="57x57" href="<?php theAsset('favicon/apple-icon-57x57.png'); ?>">
	<link rel="apple-touch-icon" sizes="60x60" href="<?php theAsset('favicon/apple-icon-60x60.png'); ?>">
	<link rel="apple-touch-icon" sizes="72x72" href="<?php theAsset('favicon/apple-icon-72x72.png'); ?>">
	<link rel="apple-touch-icon" sizes="76x76" href="<?php theAsset('favicon/apple-icon-76x76.png'); ?>">
	<link rel="apple-touch-icon" sizes="114x114" href="<?php theAsset('favicon/apple-icon-114x114.png'); ?>">
	<link rel="apple-touch-icon" sizes="120x120" href="<?php theAsset('favicon/apple-icon-120x120.png'); ?>">
	<link rel="apple-touch-icon" sizes="144x144" href="<?php theAsset('favicon/apple-icon-144x144.png'); ?>">
	<link rel="apple-touch-icon" sizes="152x152" href="<?php theAsset('favicon/apple-icon-152x152.png'); ?>">
	<link rel="apple-touch-icon" sizes="180x180" href="<?php theAsset('favicon/apple-icon-180x180.png'); ?>">
	<link rel="icon" type="image/png" sizes="192x192" href="<?php theAsset('favicon/android-icon-192x192.png'); ?>">
	<link rel="icon" type="image/png" sizes="32x32" href="<?php theAsset('favicon/favicon-32x32.png'); ?>">
	<link rel="icon" type="image/png" sizes="96x96" href="<?php theAsset('favicon/favicon-96x96.png'); ?>">
	<link rel="icon" type="image/png" sizes="16x16" href="<?php theAsset('favicon/favicon-16x16.png'); ?>">
	<link rel="manifest" href="<?php theAsset('favicon/manifest.json'); ?>">
	<meta name="msapplication-TileColor" content="#ffffff">
	<meta name="msapplication-TileImage" content="<?php theAsset('favicon/ms-icon-144x144.png'); ?>">
	<meta name="theme-color" content="#ffffff">
	<script src="https://code.iconify.design/3/3.0.0/iconify.min.js"></script>
</head>

<body <?php body_class(); ?>>
	<?php
	app_shim_wp_body_open();

	if (is_home() || is_front_page()) :
		echo '<h1 class="site-name d-none">' . get_bloginfo('name') . '</h1>';
	endif;
	?>

	<!-- dark mode -->
	<div id="darkmode" class="btn">
		<div class="btn-outline btn-outline-1"></div>
		<div class="btn-outline btn-outline-2"></div>
		<label class="darkmode-icon">
			<input type="checkbox" />
			<div></div>
		</label>
	</div>

	<div class="wrapper_mms" id="swup">
		<header id="header">
			<div class="container">
                <div class="header-inner">
                    <!-- slogan -->
                    <div class="slogan">
                        <?php
                        $slogan = getOption('slogan');
                        echo apply_filters('the_content', $slogan);
                        ?>
                    </div>

                    <div class="head-menu d-flex align-items-center justify-content-between">
                        <!-- logo -->
                        <div class="logo-menu d-flex align-items-center">
                            <span class="circle"></span>
                            <?php
                            echo '<nav class="nav-menu">	<button id="btn-hamburger">
                                    <div class="line-1"></div>
                                    <div class="line-2"></div>
                                    <div class="line-3"></div>
                                </button></button>';
                            
                                wp_nav_menu([
                                    'theme_location' => 'main-menu',
                                    'menu_class'     => 'main-menu',
                                    'container'      => false,
                                    'walker'         => new MMS_Menu_Walker(),
                                ]);
                            echo '</nav>';
                            ?>
                        </div>

                        <div class="language-search d-flex align-items-center gap-4">
                            <!-- search -->
                            <div class="search-icon">
                                <button class="search-icon__btn">
                                    <span class="iconify" data-icon="lucide:search-code"></span>
                                </button>
                            </div>
                            <!-- multi language -->
                            <?php theLanguageSwitcher(); ?>
                        </div>
                    </div>
                    <!-- end head-menu -->
                </div>
			</div>
		</header>
