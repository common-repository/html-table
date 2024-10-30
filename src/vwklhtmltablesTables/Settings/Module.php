<?php


class vwklhtmltablesTables_Settings_Module extends vwklhtmltablesTables_Core_BaseModule
{
    /**
     * {@inheritdoc}
     */
    public function onInit()
    {
        parent::onInit();
        $this->registerMenu();
        add_action('admin_enqueue_scripts', array($this, 'registerAssets'));
    }

    public function registerAssets() {
        $modulePath = untrailingslashit(plugin_dir_url(__FILE__));

        wp_register_script(
            'vwklhtmltables-tables-settings-index-js', 
            $modulePath . '/assets/js/settings-index.js', 
            array('vwklhtmltables-settings-chosen'), 
            $this->config('plugin_version'), 
            true
        );

        wp_register_style(
            'vwklhtmltables-tables-settings-index-css', 
            $modulePath . '/assets/css/settings.css', 
            array(), 
            $this->config('plugin_version')
        );

        wp_register_script(
            'vwklhtmltables-settings-chosen', 
            '//oss.maxcdn.com/chosen/1.1.0/chosen.jquery.min.js', 
            array(), 
            $this->config('plugin_version'), 
            true
        );

    }

    public function getTemplatesAliases()
    {
        return array(
            'settings.index' => '@settings/index.twig'
        );
    }

    private function registerMenu()
    {
        $menu = $this->getMenu();
        $plugin_menu = $this->getConfig()->get('plugin_menu');
        $capability = $plugin_menu['capability'];

        $submenu = $menu->createSubmenuItem();

		// Avoid conflicts with old vendor version
		if(method_exists($submenu, 'setSortOrder')) {
			$submenu->setSortOrder(40);
		}

		// We do not register menu because we need to change its position later
        $menu->addSubmenuItem('settings', $submenu);
    }

}