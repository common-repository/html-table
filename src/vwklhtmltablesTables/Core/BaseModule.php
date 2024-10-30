<?php


abstract class vwklhtmltablesTables_Core_BaseModule extends Rsc_Mvc_Module
{
    /**
     * {@inheritdoc}
     */
    public function onInit()
    {
        parent::onInit();

        $dispathcer = $this->getEnvironment()->getDispatcher();
        $dispathcer->on('after_ui_loaded', array($this, 'afterUiLoaded'));
        $dispathcer->on('after_modules_loaded', array($this, 'afterModulesLoaded'));
        add_action('admin_enqueue_scripts', array($this, 'adminEnqueueScriptsAction'));
        
    }

    /**
     * Loads the scripts and styles for the current module.
     */
    public function afterUiLoaded(vwklhtmltablesTables_Ui_Module $ui)
    {
        return;
    }

    /**
     * Runs after the all plugin modules are loaded.
     */
    public function afterModulesLoaded()
    {
        return;
    }

    public function adminEnqueueScriptsAction() {
        $location = untrailingslashit(plugin_dir_url(__FILE__));
        wp_enqueue_style('vwklhtmltables-tables-base', $location . '/assets/css/base.css');
    }

    public function config($name = null) {
        if (!$name) {
            return $this->getConfig();
        }
        return $this->getConfig()->get($name);
    }
}