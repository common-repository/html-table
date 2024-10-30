<?php

/**
 * Plugin Name: Responsive Tables
 * Plugin URI: 
 * Description: Create minimalistic responsive tables and display them easily on your website with shortcodes.
 * Version: 1.0
 * Author: vkjeerlauritz
 * Author URI: 
 */

include dirname(__FILE__) . '/app/vwklhtmltablesTables.php';

if (!defined('vwklhtmltables_TABLES_SHORTCODE_NAME')) {
    define('vwklhtmltables_TABLES_SHORTCODE_NAME', 'vwklhtmltables-tables');
}
if (!defined('vwklhtmltables_TABLES_CELL_DATA_SHORTCODE_NAME')) {
	define('vwklhtmltables_TABLES_CELL_DATA_SHORTCODE_NAME', 'vwklhtmltables-tables-cell');
}

$vwklhtmltablesTables = new vwklhtmltablesTables();
$vwklhtmltablesTables->activate(__FILE__);
$vwklhtmltablesTables->run();

if (!function_exists('vwklhtmltables_tables_get')) {
    function vwklhtmltables_tables_get($id)
    {
        return do_shortcode(sprintf('[%s id="%d"]', vwklhtmltables_TABLES_SHORTCODE_NAME, (int)$id));
    }
}

if (!function_exists('vwklhtmltables_tables_display')) {
    function vwklhtmltables_tables_display($id)
    {
        echo vwklhtmltables_tables_get($id);
    }
}
