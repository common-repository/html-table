/*
 * Main UI file.
 *
 * Here we activate and configure all scripts or
 * jQuery plugins required for UI.
 *
 */
(function ($, window, vendor, undefined) {

    $(document).ready(function () {

        /* Bootstrap Tooltips */
        // $('body').tooltip({
        //     selector: '.vwklhtmltables-plugin [data-toggle="tooltip"]',
        //     container: 'body'
        // });

        $('[data-toggle="tooltip"]').tooltipster({
                contentAsHTML: true,
                interactive: true,
                position: 'top-left',
                updateAnimation: true,
                animation: 'swing',
                functionReady: function(origin) {
                    $('img').load(function(){ 
                        origin.tooltipster('reposition');
                    });
                }
            });

        $('[data-target-toggle]').on('click change ifChanged', function(event) {
            event.preventDefault();
            $target = $($(this).data('target-toggle'));
            $target.fadeToggle();
        });

        /* Minimum height for the container */
        var $autoHeight = $('.vwklhtmltables-item'),
            naviationHeight = $('.vwklhtmltables-navigation').outerHeight();

        $autoHeight.each(function () {
            $(this).css({ minHeight: naviationHeight });
        });

        $('input').iCheck({
            checkboxClass: 'icheckbox_minimal',
            radioClass:    'iradio_minimal'
        });
    });

}(jQuery, window, 'vwklhtmltables'));