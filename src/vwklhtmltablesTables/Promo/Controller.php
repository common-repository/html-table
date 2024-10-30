<?php 
/**
* 
*/
class vwklhtmltablesTables_Promo_Controller extends vwklhtmltablesTables_Core_BaseController
{
    public function indexAction(Rsc_Http_Request $request)
    {
		$environment = $this->getEnvironment();

		if ($environment->isPluginPage() && !$environment->isModule('promo', 'welcome')) {
			return $this->redirect($this->generateUrl('promo', 'welcome'));
		}

		wp_enqueue_style(
			'vwklhtmltables-tables-step-tutorial',
			$environment->getConfig()->get('plugin_url') . '/app/assets/css/libraries/bootstrap/bootstrap.min.css'
		);

		update_option($environment->getConfig()->get('db_prefix') . 'welcome_page_was_showed', 1);

		return $this->response(
			'@promo/promo.twig',
			array(
				'plugin_name' => $this->getConfig()->get('plugin_title_name'),
				'plugin_version' => $this->getConfig()->get('plugin_version'),
				'start_url' => '?page=vwklhtmltables-tables&module=promo&action=showTutorial'
			)
		);
	}

    public function showTutorialAction()
    {
		update_user_meta(get_current_user_id(), 'vwklhtmltables-tables-tutorial_was_showed', 0);
        return $this->redirect($this->generateUrl('overview', 'index', array('vwklhtmltables_tutorial' => 'begin')));
    }
}
?>