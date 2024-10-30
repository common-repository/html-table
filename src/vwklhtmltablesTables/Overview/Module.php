<?php

/**
 * Class vwklhtmltablesTables_Overview_Module
 */
class vwklhtmltablesTables_Overview_Module extends vwklhtmltablesTables_Core_BaseModule
{
    public function onInit()
    {
        parent::onInit();

        $this->registerMenu();

        $config = $this->getEnvironment()->getConfig();
        $config->add('post_url', 'http://vwklhtmltables.com/news/main.html');
        $config->add('mail', 'support@vwklhtmltables.zendesk.com');
    }


    /**
     * {@inheritdoc}
     */
    public function afterUiLoaded(vwklhtmltablesTables_Ui_Module $ui)
    {
        parent::afterUiLoaded($ui);

        if (!$this->getEnvironment()->isModule('overview')) {
            return;
        }

        $hook = 'admin_enqueue_scripts';
        $ui->add(
            $ui->createStyle('vwklhtmltables-tables-overview-css')->setHookName(
                $hook
            )->setModuleSource($this, 'css/overview.css')
        );

        $ui->add(
            $ui->createScript('vwklhtmltables-tables-overview-js')->setHookName(
                $hook
            )->setModuleSource($this, 'js/overview.settings.js')
        );

        $ui->add(
            $ui->createScript('vwklhtmltables-tables-overview-scroll-js')->setHookName(
                $hook
            )->setModuleSource($this, 'js/jquery.slimscroll.js')
        );
    }

    private function registerMenu()
    {
        $environment = $this->getEnvironment();
        $menu = $environment->getMenu();
        $plugin_menu = $this->getConfig()->get('plugin_menu');
        $capability = $plugin_menu['capability'];

        $submenu = $menu->createSubmenuItem();
     		// Avoid conflicts with old vendor version
		if(method_exists($submenu, 'setSortOrder')) {
			$submenu->setSortOrder(10);
		}

        $menu->addSubmenuItem('overview', $submenu);
    }
}