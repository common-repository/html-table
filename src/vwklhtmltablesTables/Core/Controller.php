<?php

class vwklhtmltablesTables_Core_Controller extends vwklhtmltablesTables_Core_BaseController
{
    public function rollbackAction(Rsc_Http_Request $request)
    {
        $config = $this->getEnvironment()->getConfig();
        $revision = (int)$request->query->get('revision');

        update_option($config->get('revision_key'), $revision);

        return $this->redirect($this->generateUrl('tables', 'index'));
    }
}
