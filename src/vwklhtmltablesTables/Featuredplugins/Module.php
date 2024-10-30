<?php


class vwklhtmltablesTables_Featuredplugins_Module extends vwklhtmltablesTables_Core_BaseModule
{

    /**
     * {@inheritdoc}
     */
    public function onInit()
    {
		parent::onInit();
        $this->registerMenu();
    }

    /**
     * Loads the assets required by the module
     */
    public function afterUiLoaded(vwklhtmltablesTables_Ui_Module $ui)
    {
		parent::afterUiLoaded($ui);
		
		if($this->getEnvironment()->isModule('featuredplugins')) {
			$hook = 'admin_enqueue_scripts';
			$ui->add(
				$ui->createStyle('vwklhtmltables-tables-bootstrap-simple-css')->setHookName(
					$hook
				)->setModuleSource($this, 'css/bootstrap-simple.css')
			);
			$ui->add(
				$ui->createStyle('vwklhtmltables-tables-featured-plugins-css')->setHookName(
					$hook
				)->setModuleSource($this, 'css/admin.featured-plugins.css')
			);
		}
    }

    public function registerMenu()
    {
        $menu = $this->getMenu();
        $plugin_menu = $this->getConfig()->get('plugin_menu');
        $capability = $plugin_menu['capability'];
        $submenu = $menu->createSubmenuItem();

		// Avoid conflicts with old vendor version
		if(method_exists($submenu, 'setSortOrder')) {
			$submenu->setSortOrder(99);
		}

        $menu->addSubmenuItem('featuredplugins', $submenu);
    }
} 