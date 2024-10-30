<?php

/**
 * Class vwklhtmltablesTables
 */
class vwklhtmltablesTables
{
    private $environment;

    public function __construct()
    {
        if (!class_exists('Rsc_Autoloader', false)) {
            require dirname(dirname(__FILE__)) . '/vendor/Rsc/Autoloader.php';
            Rsc_Autoloader::register();
        }

        $pluginPath = dirname(dirname(__FILE__));
        $environment = new Rsc_Environment('st', '1.5.4', $pluginPath);

        /* Configure */
        $environment->configure(
            array(
                'optimizations'    => 1,
                'environment'      => $this->getPluginEnvironment(),
                'default_module'   => 'tables',
                'lang_domain'      => 'vwklhtmltables_tables',
                'lang_path'        => plugin_basename(
                        dirname(__FILE__)
                    ) . '/langs',
                'plugin_prefix'    => 'vwklhtmltablesTables',
                'plugin_source'    => $pluginPath . '/src',
				'plugin_title_name' => 'Data Tables',
                'plugin_menu'      => array(
                    'page_title' => __(
                        'Tables',
                        'vwklhtmltables-tables'
                    ),
                    'menu_title' => __(
                        'Tables',
                        'vwklhtmltables-tables'
                    ),
                    'capability' => 'manage_options',
                    'menu_slug'  => 'vwklhtmltables-tables',
                    'icon_url'   => '',
                    'position'   => '102.2',
                ),
                'shortcode_name'   => defined('vwklhtmltables_TABLES_SHORTCODE_NAME') ? vwklhtmltables_TABLES_SHORTCODE_NAME : 'vwklhtmltables-tables',
                'shortcode_cell_data_name'   => defined('vwklhtmltables_TABLES_CELL_DATA_SHORTCODE_NAME') ? vwklhtmltables_TABLES_CELL_DATA_SHORTCODE_NAME : 'vwklhtmltables-tables-cell',
                'db_prefix'        => 'vwklhtmltables_tbl_',
                'hooks_prefix'     => 'vwklhtmltables_tbl_',
                'ajax_url'         => admin_url('admin-ajax.php'),
                'admin_url'        => admin_url(),
                'plugin_db_update' => true,
                'revision_key'     => '_vwklhtmltables_tables_rev',
                'revision'         => 60,
				'welcome_page_was_showed' => get_option('vwklhtmltables_tbl_welcome_page_was_showed'),
				'promo_controller' => 'vwklhtmltablesTables_Promo_Controller'
            )
        );
        
        $this->environment = $environment;
        $this->initFilesystem();
    }

    public function run()
    {
        $this->environment->run();
    }

    public function activate($bootstrap)
    {
//        if (!get_option($this->environment->getPluginName().'_installed', 1)) {
//            register_activation_hook($bootstrap, array($this, 'createSchema'));
//        }
    }

    public function createSchema()
    {
        global $wpdb;

        if (is_file($schema = dirname(__FILE__) . '/configs/dbschema.sql')) {
            $prefix = $wpdb->prefix . $this->environment
                    ->getConfig()
                    ->get('db_prefix');

            $sql = str_replace('%prefix%', $prefix, file_get_contents($schema));

            if (!function_exists('dbDelta')) {
                require_once(ABSPATH.'wp-admin/includes/upgrade.php');
            }
            $wpdb->query('SET FOREIGN_KEY_CHECKS=0');
            dbDelta($sql);
            $wpdb->query('SET FOREIGN_KEY_CHECKS=1');
            update_option($this->environment->getPluginName().'_installed', 1);
        }
    }

    public function dropSchema()
    {
        global $wpdb;

        $prefix = $wpdb->prefix . $this->environment
                ->getConfig()
                ->get('db_prefix');

        $tables = $wpdb->get_results('SHOW TABLES LIKE \''.$prefix.'%\'', ARRAY_N);

        if (count($tables) < 1) {
            return;
        }

        $wpdb->query('SET FOREIGN_KEY_CHECKS=0');
        foreach ($tables as $inded => $table) {
            $wpdb->query('DROP TABLE IF EXISTS '.array_pop($table).' CASCADE;');
        }

        $wpdb->query('SET FOREIGN_KEY_CHECKS=1');
    }

    public function deactivate($bootstrap)
    {
//        register_deactivation_hook($bootstrap, array($this, 'dropSchema'));
    }

    protected function getPluginEnvironment()
    {
        $environment = Rsc_Environment::ENV_PRODUCTION;

        if ((defined('WP_DEBUG') && WP_DEBUG) || (defined(
                    'vwklhtmltables_SS_DEBUG'
                ) && vwklhtmltables_SS_DEBUG)
        ) {
            $environment = Rsc_Environment::ENV_DEVELOPMENT;
        }

        if ($_SERVER['SERVER_NAME'] === 'localhost' && $_SERVER['SERVER_PORT'] === '8001') {
            $environment = Rsc_Environment::ENV_DEVELOPMENT;
        }

        return $environment;
    }

    protected function initFilesystem()
    {
        $directories = array(
            'tmp' => '/vwklhtmltables-tables',
            'log' => '/vwklhtmltables-tables/log',
            'cache' => '/vwklhtmltables-tables/cache',
            'cache_tables' => '/vwklhtmltables-tables/cache/tables',
        );

        foreach ($directories as $key => $dir) {
            if (false !== $fullPath = $this->makeDirectory($dir)) {
                $this->environment->getConfig()->add('plugin_' . $key, $fullPath);
            }
        }
    }

    /**
     * Make directory in uploads directory.
     * @param string $directory Relative to the WP_UPLOADS dir
     * @return bool|string FALSE on failure, full path to the directory on success
     */
    protected function makeDirectory($directory)
    {
        $uploads = wp_upload_dir();

        $basedir = $uploads['basedir'];
        $dir = $basedir . $directory;
        if (!is_dir($dir)) {
            if (false === @mkdir($dir, 0775, true)) {
                return false;
            }
        } else {
            if (! is_writable($dir)) {
                return false;
            }
        }

        return $dir;
    }
}
