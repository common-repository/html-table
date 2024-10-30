(function ($, app) {

    $(document).ready(function () {

        var $tables = $('#tables');

        $tables.DataTable({
            info: false,
            lengthChange: false,
            columnDefs: [
                { "orderable": false, "targets": [1, 2, 3, 4, 5] }
            ],
            fnInitComplete: function () {
                $('.paginate_button').removeClass('paginate_button').addClass('button button-small');
            }
        });

        $(document).on('click', '.delete-table', function (e) {
            e.preventDefault();

            if (!confirm('Are you sure?')) {
                return;
            }

            var $btn = $(this);
            $btn.find('i')
                .removeClass('fa-trash-o')
                .addClass('fa-spin fa-circle-o-notch');

            app.request({
                module: 'tables',
                action: 'remove'
            }, {
                id: parseInt($btn.parents('tr').data('table-id'))
            }).done(function () {
                $btn.parents('tr').fadeOut(function () {
                    $(this).remove();

                    if ($tables.find('tr').length < 4) {
                        $tables.find('tr.empty').fadeIn();
                    }
                });
            }).fail(function (error) {
                $btn.find('i')
                    .removeClass('fa-spin fa-circle-o-notch')
                    .addClass('fa-trash-o');

                alert(error);
            });

            return false;
        });

        $('.shortcode').on('click', function () { $(this).select() });

    });

}(window.jQuery, window.vwklhtmltables.Tables));