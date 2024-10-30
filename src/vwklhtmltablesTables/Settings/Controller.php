<?php


class vwklhtmltablesTables_Settings_Controller extends vwklhtmltablesTables_Core_BaseController
{
    /**
     * @return Rsc_Http_Response
     */
    public function indexAction()
    {

        wp_enqueue_style('vwklhtmltables-tables-settings-index-css');
        wp_enqueue_script('vwklhtmltables-tables-settings-index-js');

        $templates = $this->getModule('settings')->getTemplatesAliases();
        $settings = get_option($this->getConfig()->get('db_prefix') . 'settings');

        try {
            return $this->response(
                $templates['settings.index'],
                array('settings' => $settings)
            );
        } catch (Exception $e) {
            return $this->response('error.twig', array('exception' => $e));
        }
    }
}
