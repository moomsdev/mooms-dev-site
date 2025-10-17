<?php
/**
 * App Layout: layouts/app.php
 *
 * This is the template that is used for displaying all pages by default.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 * @package WPEmergeTheme
 */
?>
<?php
	
?>
<main id="main">
    <?php 
    if (!is_front_page() && is_page()): 
		theBreadcrumb();
	endif;
    ?>
    <div class="page-body">
        <div class="container">
            <h1 class="page-title"><?php the_title();?></h1>
            <div class="page-content">
                <?php the_content(); ?>
            </div>
        </div>
    </div>
</main>
