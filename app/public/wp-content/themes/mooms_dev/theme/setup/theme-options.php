<?php
/**
 * Theme Options.
 *
 * Here, you can register Theme Options using the Carbon Fields library.
 *
 * @link    https://carbonfields.net/docs/containers-theme-options/
 *
 * @package WPEmergeCli
 */

use Carbon_Fields\Container\Container;
use Carbon_Fields\Field\Field;

$optionsPage = Container::make('theme_options', __('MMS Theme', 'mms'))
	->set_page_file('app-theme-options.php')
	->set_page_menu_position(3)
	->add_tab(__('Branding | Thương hiệu', 'mms'), [
		Field::make('image', 'logo', __('Logo', 'mms'))
			->set_width(33.33),
		Field::make('image', 'logo_dark', __('Logo Dark', 'mms'))
			->set_width(33.33),
		Field::make('image', 'default_image', __('Default image | Hình ảnh mặc định', 'mms'))
			->set_width(33.33),
		Field::make('textarea', 'slogan' . currentLanguage(), __('', 'mms'))
			->set_attribute('placeholder', 'mooms.dev slogan'),
	])

	->add_tab(__('Contact | Liên hệ', 'mms'), [
		Field::make('html', 'info', __('', 'mms'))
			->set_html('----<i> Information | Thông tin </i>----'),
		Field::make('text', 'address' . currentLanguage(), __('', 'mms'))
			->set_attribute('placeholder', 'Address | Địa chỉ'),
		Field::make('text', 'email', __('', 'mms'))
			->set_width(33.33)
			->set_attribute('placeholder', 'Email'),
		Field::make('text', 'phone_number', __('', 'mms'))
			->set_width(33.33)
			->set_attribute('placeholder', 'Phone number | Số điện thoại'),
		Field::make('html', 'socials', __('', 'mms'))
			->set_html('----<i> Socials | Mạng xã hội </i>----'),
		Field::make('text', 'facebook', __('', 'mms'))->set_width(50)
			->set_attribute('placeholder', 'facebook'),
		Field::make('text', 'instagram', __('', 'mms'))->set_width(50)
			->set_attribute('placeholder', 'instagram'),
		Field::make('text', 'tiktok', __('', 'mms'))->set_width(50)
			->set_attribute('placeholder', 'tiktok'),
		Field::make('text', 'youtube', __('', 'mms'))->set_width(50)
			->set_attribute('placeholder', 'youtube'),
	])

	->add_tab(__('Scripts', 'mms'), [
		Field::make('header_scripts', 'crb_header_script', __('Header Script', 'app')),
		Field::make('footer_scripts', 'crb_footer_script', __('Footer Script', 'app')),
	]);