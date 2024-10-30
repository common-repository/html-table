<?php


class vwklhtmltablesTables_Core_Module extends vwklhtmltablesTables_Core_BaseModule
{
    /**
     * @var vwklhtmltablesTables_Core_ModelsFactory
     */
    protected $modelsFactory;

	private $ajaxRoute;

    /**
     * {@inheritdoc}
     */
    public function onInit()
    {
        parent::onInit();

		$path = dirname(dirname(dirname(dirname(__FILE__))));
		$url = plugins_url(basename($path));
		$config = $this->getEnvironment()->getConfig();

		$config->add('plugin_url', $url);
		$config->add('plugin_path', $path);

        $this->registerAjaxRequestHandler();
        $this->registerTwigFunctions();
        $this->update();

        if ((function_exists('get_magic_quotes_gpc') && get_magic_quotes_gpc()) && $this->getEnvironment()->isPluginPage()) {
            add_action('admin_notices', array($this, 'noticeMagicQuotes'));
        }

        add_action('admin_menu', array($this, 'removeDefaultSubMenu'), 999);
    }

	public function enquieAjaxUrl() {
		wp_localize_script('tables-core', 'ajax_obj', array(
			'ajaxurl' => admin_url('admin-ajax.php' ),
		));
	}

    /**
     * {@inheritdoc}
     */
    public function afterUiLoaded(vwklhtmltablesTables_Ui_Module $ui)
    {
        parent::afterUiLoaded($ui);

        $environment = $this->getEnvironment();
        $cachingAllowed = $environment->isProd();
        $pluginVersion = $environment->getConfig()->get('plugin_version');
        $hookName = 'admin_enqueue_scripts';

        $jquery = $ui->createScript('jquery')
            ->setHookName($hookName);

        /* jQuery */
        $ui->add($jquery);

        $ui->add($ui->createScript('jquery-ui-dialog')->setHookName('admin_enqueue_scripts'));

        /* Core script with common functions in vwklhtmltables.Tables namespace */
        $ui->add(
            $ui->createScript('tables-core')
                ->setHookName(is_admin() ? $hookName : 'wp_enqueue_scripts')
                ->setModuleSource($this, 'js/core.js')
                ->addDependency($jquery)
                ->setCachingAllowed($cachingAllowed)
                ->setVersion($pluginVersion)
        );
		add_action('wp_enqueue_scripts', array($this, 'enquieAjaxUrl'), 999);
        $ui->add(
            $ui->createScript('tables-create-table')
                ->setHookName($hookName)
                ->setModuleSource($this, 'js/create-table.js')
                ->setDependencies(array('jquery', 'jquery-ui-dialog'))
                ->setCachingAllowed($cachingAllowed)
                ->setVersion($pluginVersion)
        );

        $ui->add(
            $ui->createStyle('tables-tooltipster')
                ->setHookName($hookName)
                ->setModuleSource($this, 'css/tooltipster.css')
                ->setCachingAllowed($cachingAllowed)
                ->setVersion($pluginVersion)
        );

        $ui->add(
            $ui->createScript('tables-tooltipster')
                ->setHookName($hookName)
                ->setModuleSource($this, 'js/jquery.tooltipster.min.js')
                ->addDependency($jquery)
                ->setCachingAllowed(true)
                ->setVersion($pluginVersion)
        );

        /* Bootstrap */
        $ui->add(
            $ui->createScript('tables-bootstrap')
                ->setHookName($hookName)
                ->setLocalSource('js/libraries/bootstrap/bootstrap.min.js')
                ->addDependency($jquery)
                ->setCachingAllowed(true)
                ->setVersion('3.3.1')
        );


        /* Chosen */
        $ui->add(
            $ui->createScript('tables-chosen')
                ->setHookName($hookName)
                ->setLocalSource('js/plugins/chosen.jquery.min.js')
                ->addDependency($jquery)
                ->setCachingAllowed(true)
                ->setVersion('1.4.2')
        );

        /* iCheck */
        $ui->add(
            $ui->createScript('tables-iCheck')
                ->setHookName($hookName)
                ->setLocalSource('js/plugins/icheck.min.js')
                ->addDependency($jquery)
                ->setCachingAllowed(true)
                ->setVersion('1.0.2')
        );

        /* Main UI script */
        $ui->add(
            $ui->createScript('tables-ui')
                ->setHookName($hookName)
                ->setLocalSource('js/vwklhtmltables.ui.js')
                ->addDependency($jquery)
                ->setCachingAllowed($cachingAllowed)
                ->setVersion($pluginVersion)
        );

        /* Main UI styles */
        $ui->add(
            $ui->createStyle('tables-ui-styles')
                ->setHookName($hookName)
                ->setLocalSource('css/vwklhtmltables-ui.css')
                ->setCachingAllowed($cachingAllowed)
                ->setVersion($pluginVersion)
        );

    }

    /**
     * Returns the models factory
     * @return vwklhtmltablesTables_Core_ModelsFactory
     */
    public function getModelsFactory()
    {
        if (!$this->modelsFactory) {
            $this->modelsFactory = new vwklhtmltablesTables_Core_ModelsFactory(
                $this->getEnvironment()
            );
        }

        return $this->modelsFactory;
    }

    public function removeDefaultSubMenu()
    {
        global $submenu;
        if (is_admin()) {
           // unset($submenu[$this->getEnvironment()->getMenu()->getMenuSlug()][0]);
        }
    }

	/**
	 * Parse the ajax requests.
	 * @return mixed
	 */
	public function parseAjaxRequest() {
		$request = $this->getRequest();
		$this->setAjaxRoute($request->post->get('route'));
	}

	public function setAjaxRoute($route) {
		$this->ajaxRoute = $route;
	}

	public function getAjaxRoute() {
		return $this->ajaxRoute;
	}

    /**
     * Handles the ajax requests and returns the response.
     * @return mixed
     */
    public function handleAjaxRequest()
    {
		$environment = $this->getEnvironment();
		$request = $this->getRequest();
		$route = $this->getAjaxRoute();

        if (!array_key_exists('module', $route)) {
            wp_send_json_error(
                array(
                    'message' => $environment->translate(
                        'Invalid route specified: missing "module" key.'
                    )
                )
            );
        }

        $moduleName = $route['module'];
        $actionName = 'indexAction';

        if (array_key_exists('action', $route)) {
            $actionName = $route['action'] . 'Action';
        }

        $module = $environment->getModule($moduleName);
        if (!$module) {
            wp_send_json_error(
                array(
                    'message' => sprintf(
                        $environment->translate(
                            'You are requested to the non-existing module "%s".'
                        ),
                        $moduleName
                    )
                )
            );
        }

        if (!method_exists($module->getController(), $actionName)) {
            wp_send_json_error(
                array(
                    'message' => sprintf(
                        $environment->translate(
                            'You are requested to the non-existing route: %s::%s'
                        ),
                        $moduleName,
                        $actionName
                    )
                )
            );
        }

        $request->headers->add('X_REQUESTED_WITH', 'XMLHttpRequest');

        return call_user_func_array(
            array($module->getController(), $actionName),
            array($request)
        );
    }

    public function buildProUrl(array $parameters = array())
    {
        $config = $this->getEnvironment()->getConfig();
        $homepage = $config->get('plugin_homepage');
        $campaign = $config->get('campaign');

        if (!array_key_exists('utm_source', $parameters)) {
            $parameters['utm_source'] = 'plugin';
        }

        if (!array_key_exists('utm_campaign', $parameters)) {
            $parameters['utm_campaign'] = $campaign;
        }

        return $homepage . '?' . http_build_query($parameters);
    }

    public function noticeMagicQuotes()
    {
        $message = sprintf(
            $this->getEnvironment()->translate(
                'Your PHP configuration has enabled "%s" directive. ' .
                'This is deprecated directive and we are can not guarantee ' .
                'that the plugin will work properly. To turn off this directive check the %s tutorial %s.'
            ),
            '<strong>magic_quotes_gpc</strong>',
            '<a href="http://php.net/manual/en/security.magicquotes.disabling.php" target="_blank">',
            '<sup><i class="fa fa-fw fa-external-link"></i></sup></a>'
        );

        echo '<div class="error"><p>' . $message . '</p></div>';
    }

    /**
     * Registers the ajax request handler
     */
    private function registerAjaxRequestHandler()
    {
		$this->parseAjaxRequest();
		$route = $this->getAjaxRoute();
		$action_name = 'wp_ajax_vwklhtmltables-tables';
		$is_frontend = false;

		$frontendModulesAndMethods = array(
			'tables' => array('saveEditableField')
		);

		if(!empty($route)) {
			foreach($frontendModulesAndMethods as $module => $actions) {
				if(isset($route['module']) && $module == $route['module']) {
					if(isset($route['action']) && in_array($route['action'], $actions)) {
						$is_frontend = true;
					}
				}
			}
		}

		if($is_frontend && !is_user_logged_in()) {
			$action_name = 'wp_ajax_nopriv_vwklhtmltables-tables';
		}
		add_action($action_name, array($this, 'handleAjaxRequest'));
    }

    /**
     * Updates the plugin database if it is needed.
     */
    private function update()
    {
        $environment = $this->getEnvironment();
        $config = $environment->getConfig();

        $optionName = $config->get('hooks_prefix') . 'plugin_version';
        $currentVersion = $config->get('plugin_version');
        $oldVersion = get_option($optionName);

        if (version_compare($oldVersion, $currentVersion) === -1) {
            $this->cleanTablesCache();
            update_option($optionName, $currentVersion);
        }

        $revision = array(
            'current' => (int)$config->get('revision'),
            'installed' => (int)get_option($config->get('revision_key'), -1)
        );

        if ($revision['current'] <= $revision['installed']) {
            return;
        }

        /** @var vwklhtmltablesTables_Core_Model_Core $core */
        $core = $this->getModelsFactory()->get('core');
        $updatesPath = $this->getLocation() . '/updates';

        for ($i = $revision['installed']; $i <= $revision['current']; $i++) {
            $file = $updatesPath . '/rev-'.$i.'.sql';

            if (!file_exists($file)) {
                continue;
            }

            try {
                $core->updateFromFile($file);
            } catch (Exception $e) {
                if (!$environment->isPluginPage()) {
                    return;
                }

                wp_die(
                    sprintf(
                        'Failed to update plugin database. Reason: %s',
                        $e->getMessage()
                    )
                );
            }
        }

        update_option($config->get('revision_key'), $revision['current']);
    }

    private function registerTwigFunctions()
    {

        $twig = $this->getEnvironment()->getTwig();
        $twig->addFunction(
            new Twig_SimpleFunction(
                'build_pro_url', array($this, 'buildProUrl')
            )
        );

        $twig->addFunction(
            new Twig_SimpleFunction(
                'translate', array($this, 'translate')
            )
        );

        if (function_exists('dump') && $this->getEnvironment()->isDev()) {
            $twig->addFunction(new Twig_SimpleFunction('dump', 'dump'));
        }
    }

    private function cleanTablesCache() {
        $cachePath = $this->getConfig()->get('plugin_cache_tables');
        if ($cachePath) {
            array_map('unlink', glob("$cachePath/*"));
        }
    }
}
