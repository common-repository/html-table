<?php

/**
 * Class SocialSharing_Promo_Module
 *
 * Promo module.
 */
class vwklhtmltablesTables_Promo_Module extends vwklhtmltablesTables_Core_BaseModule
{
	/**
	 * Module initialization.
	 */
	public function onInit()
	{
		parent::onInit();

		add_action('admin_init', array($this, 'loadAdminPromoAssets'));
		add_action('wp_ajax_vwklhtmltables-tables-tutorial-close', array($this, 'endTutorial'));
	}

	public function loadAdminPromoAssets() {
		$modulePath = untrailingslashit(plugin_dir_url(__FILE__));

		if (!get_user_meta(get_current_user_id(), 'vwklhtmltables-tables-tutorial_was_showed', true)) {
			wp_enqueue_script(
				'vwklhtmltables-tables-step-tutorial',
				$modulePath . '/assets/js/tutorial.js',
				array('wp-pointer')
			);

			add_action('admin_enqueue_scripts', array($this, 'enqueueTutorialAssets'));
		}
	}

	public function enqueueTutorialAssets()
	{
		wp_enqueue_style('wp-pointer');

		$data = array(
			'next'  => $this->translate('Next'),
			'close' => $this->translate('Close Tutorial'),
			'pointersData'	=> $this->pointers(),
		);

		wp_localize_script('vwklhtmltables-tables-step-tutorial', 'DataTablesPromoPointers', $data);
	}

	public function pointers()
	{
		return array(

		);
	}

	public function endTutorial() {
		update_user_meta(get_current_user_id(), 'vwklhtmltables-tables-tutorial_was_showed', 1);
	}
}