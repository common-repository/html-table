var g_vwklhtmltablesTablesCellBgColorTimeoutSet = false
,	g_vwklhtmltablesTablesCellTxtColorTimeoutSet = false
,	g_vwklhtmltablesTablesCellBgColorLast = ''
,	g_vwklhtmltablesTablesCellTxtColorLast = '';

(function ($, app, undefined) {

    var classRegExp = /current|area|selected|formula|^\s+|\s+$/gi;

    var getValidRange = function (range) {
        if (range === undefined) {
            return undefined;
        }

        var startRow = range.from.row,
            endRow = range.to.row,
            startCol = range.from.col,
            endCol = range.to.col;

        if (startRow > endRow) {
            startRow = range.to.row;
            endRow = range.from.row;
        }

        if (startCol > endCol) {
            startCol = range.to.col;
            endCol = range.from.col;
        }

        return {
            from: {
                col: startCol,
                row: startRow
            },
            to: {
                col: endCol,
                row: endRow
            }
        }
    };

    var toggleClass = function (editor, className) {
        var range = getValidRange(editor.getSelectedRange());

        if (range === undefined) {
            return;
        }

        classNamePattern = new RegExp(className);

        for (var row = range.from.row; row <= range.to.row; row++) {
            for (var col = range.from.col; col <= range.to.col; col++) {
                var cell = editor.getCellMeta(row, col);

                cell.className = cell.className || '';
                
                if (cell.className.match(classNamePattern)) {
                    newClassName = cell.className.replace(className, '');
                } else {
                    newClassName =  cell.className + ' ' + className;
                }

                editor.setCellMeta(
                    row,
                    col,
                    'className',
                    newClassName
                );
            }
        }
    };

    var replaceClass = function (editor, className, replace) {
        var range = getValidRange(editor.getSelectedRange());
        if (range === undefined) {
            return;
        }

        if (replace instanceof RegExp) {
            replacementPattern = replace;
        } else if (replace instanceof Array) {
            replacementPattern = new RegExp(replace.join('|'));
        } else {
            replacementPattern = replace;
        }

        for (var row = range.from.row; row <= range.to.row; row++) {
            for (var col = range.from.col; col <= range.to.col; col++) {
                var cell = editor.getCellMeta(row, col);

                cell.className = cell.className || '';

                editor.setCellMeta(
                    row,
                    col,
                    'className',
                    cell.className.replace(replacementPattern, '') + ' ' + className
                );
            }
        }
    };

    var removeClass = function (editor, className) {
        var range = getValidRange(editor.getSelectedRange());

        if (range === undefined) {
            return;
        }

        for (var row = range.from.row; row <= range.to.row; row++) {
            for (var col = range.from.col; col <= range.to.col; col++) {
                var cell = editor.getCellMeta(row, col);

				if(typeof(cell.className) != 'undefined') {
					editor.setCellMeta(
						row,
						col,
						'className',
						cell.className.replace(className, '')
					);
				}
            }
        }
    };



    var methods = {
        bold: function () {
            toggleClass(this.getEditor(), 'bold');

            this.getEditor().render();
        },
        italic: function () {
            toggleClass(this.getEditor(), 'italic');

            this.getEditor().render();
        },
		underline: function () {
			toggleClass(this.getEditor(), 'underline');

			this.getEditor().render();
		},
        left: function () {
            replaceClass(this.getEditor(), 'htLeft', ['htRight', 'htCenter']);

            this.getEditor().render();
        },
        right: function () {
            replaceClass(this.getEditor(), 'htRight', ['htLeft', 'htCenter']);

            this.getEditor().render();
        },
        center: function () {
            replaceClass(this.getEditor(), 'htCenter', ['htLeft', 'htRight']);

            this.getEditor().render();
        },
        top: function () {
            replaceClass(this.getEditor(), 'htTop', ['htMiddle', 'htBottom']);

            this.getEditor().render();
        },
        middle: function () {
            replaceClass(this.getEditor(), 'htMiddle', ['htTop', 'htBottom']);

            this.getEditor().render();
        },
        bottom: function () {
            replaceClass(this.getEditor(), 'htBottom', ['htTop', 'htMiddle']);

            this.getEditor().render();
        },
        row: function () {
            var range = this.getEditor().getSelectedRange(),
                colIndex = 0;

            if (range) {
                colIndex = range.to.row + 1;
            }

            this.getEditor().alter('insert_row', colIndex);
        },
        column: function () {
            this.getEditor().alter('insert_col', $('#tableEditor td.current').index() || 0);
        },
        remove_row: function () {
            var selection = this.getEditor().getSelectedRange();

            if (selection === undefined) {
                return;
            }

            var amount = selection.to.row - selection.from.row + 1,
                selected = this.getEditor().getSelected(),
                entireColumnSelection = [0, selected[1], this.getEditor().countRows() - 1, selected[1]],
                columnSelected = entireColumnSelection.join(',') == selected.join(',');

            if (selected[0] < 0 || columnSelected) {
                return;
            }

            this.getEditor().alter('remove_row', selection.from.row, amount);
        },
        remove_col: function () {
            var selection = this.getEditor().getSelectedRange();

            if (selection === undefined) {
                return;
            }

            var amount = selection.to.col - selection.from.col + 1,
                selected = this.getEditor().getSelected(),
                entireRowSelection = [selected[0], 0, selected[0], this.getEditor().countCols() - 1],
                rowSelected = entireRowSelection.join(',') == selected.join(',');

            if (selected[1] < 0 || rowSelected) {
                return;
            }
            
            this.getEditor().alter("remove_col", selection.from.col, amount);
        },
        color: function (color) {
            var $style = $('#vwklhtmltables-tables-style');

            if (!$style.length) {
                $style = $('<style/>', { id: 'vwklhtmltables-tables-style' });

                $('head').append($style);
            }
            $style.html($style.html() + ' .color-'+color+' {color:#'+color+' !important;'+'}');

            replaceClass(this.getEditor(), 'color-' + color, /color\-([0-9a-f]{6})/);
			$('#textColor').css({borderBottomColor: '#' + color});
            this.getEditor().render();
        },
        background: function (color) {

            var $style = $('#vwklhtmltables-tables-style');

            if (!$style.length) {
                $style = $('<style/>', { id: 'vwklhtmltables-tables-style' });

                $('head').append($style);
            }
            $style.html($style.html() + ' .bg-'+color+' {background:#'+color+' !important;}');

            if (color === 'ffffff') {
                removeClass(this.getEditor(), new RegExp('bg\-([0-9abcdef]{6})'));
                return;
            }

            replaceClass(this.getEditor(), 'bg-' + color, /bg\-([0-9a-f]{6})/);
			$('#bgColor').css({borderBottomColor: '#' + color});
            this.getEditor().render();
        },
        link: function () {
            var editor = this.getEditor(),
                selection = editor.getSelectedRange(),
                highlighted = selection === undefined ? { col: 0, row: 0 } : selection.highlight,
                $urlDialog = $('#insertUrlDialog'),
                cellData;

                $urlDialog
                    .find('.link-text')
                    .val(editor.getDataAtCell(highlighted.row, highlighted.col));

                $urlDialog.dialog({
                    width: 400,
                    modal: true,
                    buttons: [
                        {
                            text: "Close",
                            click: function() {
                                $(this).dialog('close');
                            }
                        },
                        {
                            text: "Insert",
                            click: function() {
                                var target = $urlDialog.find('.link-target').is(':checked') ? '_blank' : '_self';
                                editor.setDataAtCell(
                                    highlighted.row,
                                    highlighted.col,
                                    '<a href="' +
                                    $urlDialog.find('.url').val() +
                                    '" target="' + target + '">' +
                                    $urlDialog.find('.link-text').val() + '</a>');
                                $(this).dialog('close');
                            }
                        }
                    ]
                });
        },
        picture: function (event) {
            
            var editor = this.getEditor(),
                selection = editor.getSelectedRange(),
                highlighted = selection === undefined ? { col: 0, row: 0 } : selection.highlight,
                url,
                media;

            if (event.ctrlKey) {
                url = prompt('Enter URL to the picture:', 'http://');
                if (null === url) { 
                    return;
                }
                this.getEditor().setDataAtCell(highlighted.row, highlighted.col, '<img src="' + url + '"/>');
                return;
            }

            if (typeof media === "undefined") {

                media = window.wp.media({
                    title:    'Choose images',
                    button:   {
                        text: 'Choose images'
                    },
                    multiple: false
                });

                media.on('select', function () {
                    attachment = media.state().get('selection').first().toJSON();
                    editor.setDataAtCell(highlighted.row, highlighted.col, '<img src="' + attachment.url + '"/>');
                });
            }

            media.open();
        },
        addEditComment: function () {
            var e = this.getEditor(),
                coords = e.getSelectedRange(),
                comments = e.getPlugin('comments');

            if (coords) {
                e.deselectCell();
                comments.contextMenuEvent = true;
                comments.setRange({ from: coords.from });
                comments.show();
                comments.editor.focus();
            }
        },
        removeComment: function () {
            var e = this.getEditor(),
                comments = e.getPlugin('comments'),
                selection = getValidRange(e.getSelectedRange());

            if (selection) {
                comments.contextMenuEvent = true;
                comments.removeCommentAtCell(selection.from.row, selection.from.col);
            }
        },
        'word-wrap-default': function() {
            replaceClass(this.getEditor(), '', ['ww-v', 'ww-h']);
            this.getEditor().render();
        },
        'word-wrap-visible': function() {
            replaceClass(this.getEditor(), 'ww-v', 'ww-h');
            this.getEditor().render();
        },
        'word-wrap-hidden': function() {
            replaceClass(this.getEditor(), 'ww-h', 'ww-v');
            this.getEditor().render();
        },
        setFormat: function(event) {
            var formatType = $(event.target).data('type'),
                format = $(event.target).attr('data-format');

            this.setFormat(formatType, format);
            this.getEditor().render();
        },
		addHiddenCell: function() {
			this.replaceClass('hiddenCell', ['hiddenCell']);
			this.getEditor().render();
		},
		removeHiddenCell: function() {
			this.removeClass('hiddenCell');
			this.getEditor().render();
		}
    };

    var Toolbar = (function () {
        
        function Toolbar(toolbarId, editor) {
            var $container = $(toolbarId);

            this.getContainer = function () {
                return $container;
            };

            this.getEditor = function () {
                return editor;
            };
        }

        Toolbar.prototype.getValidRange = function (range) {
            if (range === undefined) {
                return undefined;
            }

            var startRow = range.from.row,
                endRow = range.to.row,
                startCol = range.from.col,
                endCol = range.to.col;

            if (startRow > endRow) {
                startRow = range.to.row;
                endRow = range.from.row;
            }

            if (startCol > endCol) {
                startCol = range.to.col;
                endCol = range.from.col;
            }

            return {
                from: {
                    col: startCol,
                    row: startRow
                },
                to: {
                    col: endCol,
                    row: endRow
                }
            }
        };

        Toolbar.prototype.toggleClass = function (className) {
            var editor = this.getEditor(),
                range = getValidRange(editor.getSelectedRange());

            if (range === undefined) {
                return;
            }

            classNamePattern = new RegExp(className);

            for (var row = range.from.row; row <= range.to.row; row++) {
                for (var col = range.from.col; col <= range.to.col; col++) {
                    var cell = editor.getCellMeta(row, col);

                    cell.className = cell.className || '';
                    
                    if (cell.className.match(classNamePattern)) {
                        newClassName = cell.className.replace(className, '');
                    } else {
                        newClassName =  cell.className + ' ' + className;
                    }

                    editor.setCellMeta(
                        row,
                        col,
                        'className',
                        newClassName
                    );
                }
            }
        };

        Toolbar.prototype.replaceClass = function (className, replace) {
            var editor = this.getEditor(),
                range = getValidRange(editor.getSelectedRange());
            if (range === undefined) {
                return;
            }

            if (replace instanceof RegExp) {
                replacementPattern = replace;
            } else if (replace instanceof Array) {
                replacementPattern = new RegExp(replace.join('|'));
            } else {
                replacementPattern = replace;
            }

            for (var row = range.from.row; row <= range.to.row; row++) {
                for (var col = range.from.col; col <= range.to.col; col++) {
                    var cell = editor.getCellMeta(row, col);

                    cell.className = cell.className || '';

                    editor.setCellMeta(
                        row,
                        col,
                        'className',
                        cell.className.replace(replacementPattern, '') + ' ' + className
                    );
                }
            }
        };

        Toolbar.prototype.removeClass = function (className) {
            var editor = this.getEditor(),
                range = this.getValidRange(editor.getSelectedRange());

            if (range === undefined) {
                return;
            }

            for (var row = range.from.row; row <= range.to.row; row++) {
                for (var col = range.from.col; col <= range.to.col; col++) {
                    var cell = editor.getCellMeta(row, col);

                    editor.setCellMeta(
                        row,
                        col,
                        'className',
                        cell.className.replace(className, '')
                    );
                }
            }
        };

        Toolbar.prototype.setFormat = function (formatType, format) {
			var editor = this.getEditor(),
                range = this.getValidRange(editor.getSelectedRange());

            if (range === undefined) {
                return;
            }

            for (var row = range.from.row; row <= range.to.row; row++) {
                for (var col = range.from.col; col <= range.to.col; col++) {
                    var cell = editor.getCellMeta(row, col),
						data = editor.getDataAtCell(row, col) || '0',
						cellType = 'text',
						cellFormat = format;

					delete cell.renderer;
					delete cell.editor;
					delete cell.validator;

					// Fix cell value if we switch cell type from Percent to Another One
					if (formatType != 'percent' && cell.formatType == 'percent') {
						if (!app.Models.Tables.isFormula(data)) {
							data = data * 100;
						}
					}

					switch(formatType) {
						case 'currency':
							cellType = 'text';
							cell.renderer = Handsontable.renderers.CurrencyRenderer;
							cellFormat = format.replace(editor.currencySymbol, '$');
							break;
						case 'percent':
							cellType = 'text';
							cell.renderer = Handsontable.renderers.PercentRenderer;

							if (!app.Models.Tables.isFormula(data)) {
								data = String(data).replace(/[^\d.-]/g, '');

								// Fix cell value for Percent format
								if (cell.formatType !== 'percent') {
									data = data / 100;
								}
							}
							break;
						case 'date':
							cellType = 'date';
							cell.dateFormat = format;
							cell.correctFormat =  true;

							var newDate = moment(data, format);

							if (newDate.isValid()) {
								data = newDate.format(format);
							}
							break;
						default:
							cell.renderer = Handsontable.renderers.DefaultRenderer;
							break;
					}

					cell.type = cellType;
					cell.format = cellFormat;
					cell.formatType = formatType;

					editor.validateCell(data, cell, function() {}, 'validateCells');
					editor.setDataAtCell(row, col, data);
                }
            } 
        };

        Toolbar.prototype.subscribe = function () {
            var self = this;

            this.getContainer().find('button, .toolbar-content > a').each(function () {
                var $button = $(this);

                if ($button.data('method') !== undefined && methods[$button.data('method')] !== undefined) {
                    var method = $button.data('method');

                    $button.unbind('click');
                    $button.on('click', function (e) {
                        e.preventDefault();
                        $self = $(this);

                        if (/word-wrap-default|word-wrap-visible|word-wrap-hidden/.test(method)) {
                            $('#toolbar-word-wrapping i')
                            .removeClass('word-wrap-visible word-wrap-hidden')
                            .addClass(method);
                        }

                        if (method == 'setFormat') {
							$('.text-format, .currency-format, .percent-format, .date-format').removeClass('active');
							$('.' + $button.data('type') + '-format').addClass('active');
						}

                        methods[method].apply(self, [e]);
                        // Close toolbar
                        $('body').trigger('click');
                    });
                }

            });

            var $textColor = $('#textColor').ColorPicker({
                onChange: function (hsb, hex, rgb) {
					g_vwklhtmltablesTablesCellTxtColorLast = hex;

					if(!g_vwklhtmltablesTablesCellTxtColorTimeoutSet) {
						setTimeout(function(){
							g_vwklhtmltablesTablesCellTxtColorTimeoutSet = false;
							self.call('color', g_vwklhtmltablesTablesCellTxtColorLast);
						}, 500);
						g_vwklhtmltablesTablesCellTxtColorTimeoutSet = true;
					}
                }
            });

            var $bgColor = $('#bgColor').ColorPicker({
                onChange: function (hsb, hex, rgb) {
					g_vwklhtmltablesTablesCellBgColorLast = hex;

					if(!g_vwklhtmltablesTablesCellBgColorTimeoutSet) {
						setTimeout(function(){
							g_vwklhtmltablesTablesCellBgColorTimeoutSet = false;
							self.call('background', g_vwklhtmltablesTablesCellBgColorLast);
						}, 500);
						g_vwklhtmltablesTablesCellBgColorTimeoutSet = true;
					}
                }
            });

            self.getEditor().addHook('afterSelection', function (startRow, startCol, endRow, endCol) {
                if (startRow !== endRow || startCol !== endCol) {
                    return;
                }

                var cell = self.getEditor().getCell(startRow, startCol);

                    if (!cell) {
                        return;
                    }

                var cellMeta = self.getEditor().getCellMeta(startRow, startCol),
                    color = /color\-([0-9abcdef]{6})/.exec(cell.className),
                    background = /bg\-([0-9abcdef]{6})/.exec(cell.className);

                if (null !== color) {
                    $textColor.css({borderBottomColor: '#'+color[1]});
					$('#textColor').ColorPickerSetColor('#'+color[1]);
                } else {
                    $textColor.css({borderBottomColor: '#000000'});
					$('#textColor').ColorPickerSetColor('#000000');
                }

                if (null !== background && background[1] !== 'ffffff') {
                    $bgColor.css({borderBottomColor: '#'+background[1]});
					$('#bgColor').ColorPickerSetColor('#'+background[1]);
                } else {
                    $bgColor.css({borderBottomColor: '#ffffff'});
					$('#bgColor').ColorPickerSetColor('#ffffff');
                }

                $('#toolbar-word-wrapping i').removeClass('word-wrap-visible word-wrap-hidden');

                if (/ww-v|ww-h/.test(cell.className)) {
                    if (/ww-v/.test(cell.className)) {
                         $('#toolbar-word-wrapping i').addClass('word-wrap-visible');
                    }
                    else if (/ww-h/.test(cell.className)) {
                        $('#toolbar-word-wrapping i').addClass('word-wrap-hidden');
                    }
                }

                var format = cellMeta.formatType || 'text';
                $('.text-format, .currency-format, .percent-format, .date-format').removeClass('active');
                $('.' + format + '-format').addClass('active');
            });

            this.getContainer().find('button').each(function () {
                var $button = $(this);

                if ($button.data('toolbar') !== undefined) {
                    $button.toolbar({
                        content: $button.data('toolbar'),
                        position: 'bottom',
                        hideOnClick: true,
                        style: $button.data('style') || null
                    });
                }
            });
        };

        Toolbar.prototype.call = function (method) {
            if (methods[method] === undefined) {
                throw new Error('The method "' + method + '" is not exists.');
            }

            methods[method].apply(this, Array.prototype.slice.call(arguments, 1, arguments.length));
        };

        Toolbar.prototype.addMethod = function (name, fn) {
            methods[name] = fn;
        };

        Toolbar.prototype.getMethods = function () {
            return methods;
        };

        return Toolbar;
    })();

    app.Editor = app.Editor || {};
    app.Editor.Toolbar = Toolbar;

}(window.jQuery, window.vwklhtmltables.Tables || {}));