(function ($, app, undefined) {

    $(document).ready(function () {
		var tableId = app.getParameterByName('id'),
			windowHeight = $(window).height(),
			ace = window.ace.edit("css-editor"),
			editor, toolbar, formula;

		// Make editors responsive for window height (810px is mobile responsive width)
		if($(window).width() > 810 && windowHeight > 650) {
			windowHeight = windowHeight - 350;
		}
		$('#tableEditor, #css-editor').css({
			'max-height': windowHeight,
			'min-height': windowHeight,
			'height': windowHeight
		});

		// Custom Hansontabe Renderers
		Handsontable.renderers.CustomHtmlRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			Handsontable.renderers.HtmlRenderer.call(this, instance, td, row, col, prop, value, cellProperties);
			if (td.innerHTML === 'null') {
				td.innerHTML = '';
			}
		};

		Handsontable.renderers.DefaultRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			var cellMeta = instance.getCellMeta(row,  row);

			if(app.Models.Tables.isFormula(value)) {
				Handsontable.TextCell.renderer.apply(this, arguments);
				value = app.Models.Tables.getFormulaResult(value, row, col);
			}

			if(instance.useNumberFormat && (app.Models.Tables.isNumber(value) || cellMeta.formatType == 'number')) {
				Handsontable.renderers.NumberRenderer.call(this, instance, td, row, col, prop, value, cellProperties);
			} else {
				Handsontable.renderers.CustomHtmlRenderer.call(this, instance, td, row, col, prop, value, cellProperties);
			}
		};

		Handsontable.renderers.NumberRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			value = app.Models.Tables.setCellFormat(value, 'number');

			Handsontable.renderers.CustomHtmlRenderer.call(this, instance, td, row, col, prop, value, cellProperties);
		};

		Handsontable.renderers.CurrencyRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			if(value) {
				if(app.Models.Tables.isFormula(value)) {
					Handsontable.TextCell.renderer.apply(this, arguments);
					value = app.Models.Tables.getFormulaResult(value, row, col);
				}

				value = app.Models.Tables.setCellFormat(value, 'currency');
			}

			Handsontable.renderers.CustomHtmlRenderer.call(this, instance, td, row, col, prop, value, cellProperties);
		};

		Handsontable.renderers.PercentRenderer = function (instance, td, row, col, prop, value, cellProperties) {
			if(value) {
				if(app.Models.Tables.isFormula(value)) {
					Handsontable.TextCell.renderer.apply(this, arguments);
					value = app.Models.Tables.getFormulaResult(value, row, col);
				}

				value = app.Models.Tables.setCellFormat(value, 'percent');
			}

			Handsontable.renderers.CustomHtmlRenderer.call(this, instance, td, row, col, prop, value, cellProperties);
		};

		Handsontable.editors.TextEditor.prototype.beginEditing = function () {
			// To show percents as is if it is pure number
			var formatType = this.cellProperties.formatType || '',
				value = this.originalValue;

			if(app.Models.Tables.isNumber(value) && !app.Models.Tables.isFormula(value)) {
				if(formatType == 'percent') {
					value = (value * 100).toString();
				}
			}

			this.originalValue = value;

            Handsontable.editors.BaseEditor.prototype.beginEditing.call(this);
		};

		Handsontable.editors.TextEditor.prototype.saveValue = function (val, ctrlDown) {
			// Correct save of percent values
			var formatType = this.cellProperties.formatType || '',
				value = val[0][0];

			if(app.Models.Tables.isNumber(value) && !app.Models.Tables.isFormula(value)) {
				if (formatType == 'percent') {
					value = (value / 100).toString();
				}
			}

			val[0][0] = value;

			Handsontable.editors.BaseEditor.prototype.saveValue.call(this, val, ctrlDown);
		};

		ace.setTheme("ace/theme/monokai");
		ace.getSession().setMode("ace/mode/css");

        initializeTabs() ;

		editor = initializeEditor();

		// Editor Hooks
        editor.addHook('beforeChange', function (changes, source) {
            $.each(changes, function (index, changeSet) {
                var row = changeSet[0],
                    col = changeSet[1],
                    value = changeSet[3],
                    cell = editor.getCellMeta(row, col);

                if (cell.type == 'date') {
                    var newDate = moment(value, cell.format);
                    if (newDate.isValid()) {
                        changeSet[3] = newDate.format(cell.format);
                    }
                }
            });

        });
        editor.addHook('afterChange', function (changes) {
            if (!$.isArray(changes) || !changes.length) {
                return;
            }

            $.each(changes, function (index, changeSet) {
                var row = changeSet[0],
                    col = changeSet[1],
                    value = changeSet[3];

				if (value.toString().match(/\\/)) {
					editor.setDataAtCell(row, col, value.replace(/\\/g, '&#92;'));
				}
            });

            editor.render();

        });
        editor.addHook('afterLoadData', function () {
			generateWidthData();
        });
		editor.addHook('afterCreateCol', function(insertColumnIndex) {
			insertColumnIndex = typeof(insertColumnIndex) != 'undefined' ? insertColumnIndex : 0;

			var selectedCell = editor.getSelected(),
				selectedColumnIndex = selectedCell[1] || 0;

			if (insertColumnIndex > selectedColumnIndex) {
				insertColumnIndex = insertColumnIndex -1 ;
			}

			generateWidthData();
			editor.allWidths.splice(selectedColumnIndex, 0, editor.allWidths[insertColumnIndex]);
			editor.updateSettings({ colWidths: editor.allWidths });
		});
		editor.addHook('afterRemoveCol', function(from, amount) {
			generateWidthData();
			editor.allWidths.splice(from, amount);

			var countCols = editor.countCols(),
				colWidth,
				allWidths = editor.allWidths,
				plugin = editor.getPlugin('ManualColumnResize');

			for (var i = 0; i < countCols; i++) {
				colWidth = editor.getColWidth(i);
				if (colWidth !== allWidths[i]) {
					plugin.setManualSize(i, allWidths[i]);
				}
			}
		});
		editor.addHook('afterColumnResize', function(column, width) {
			generateWidthData();
			editor.allWidths.splice(column, 1, width);
		});

        toolbar = new app.Editor.Toolbar('#tableToolbar', editor);
		formula = new app.Editor.Formula(editor);

		window.editor = editor;
		app.Editor.Hot = editor;
        app.Editor.Tb = toolbar;

        toolbar.subscribe();
        formula.subscribe();

        var loading = $.when(
            app.Models.Tables.getMeta(app.getParameterByName('id')),
            app.Models.Tables.getRows(tableId)
        );

        loading.done(function (metaResponse, rowsResponse) {
            var formSettings = $('form#settings'),
				rows = rowsResponse[0].rows,
                meta = metaResponse[0].meta,
                comments = [];

			// Set numbers
			formSettings.find('[name="numberFormat"]').on('change', function(event) {
				event.preventDefault();
				editor.render();
			});

			// Set currency
			formSettings.find('[name="currencyFormat"]').on('change', function(event) {
                event.preventDefault();
				$('.currency-format').attr('data-format', $.trim($(this).val()));
				editor.render();
            });

            // Set percent
			formSettings.find('[name="percentFormat"]').on('change', function(event) {
				event.preventDefault();
                $('.percent-format').attr('data-format', $.trim($(this).val()));
				editor.render();
            });

            // Set date
			formSettings.find('[name="dateFormat"]').on('change', function(event) {
				event.preventDefault();
                $('.date-format').attr('data-format', $.trim($(this).val()));
            });

			// Set merged cells
            if (typeof meta === 'object' && 'mergedCells' in meta && meta.mergedCells.length) {
                editor.updateSettings({
					mergeCells: meta.mergedCells
                });
            }

            if (rows.length > 0) {
                var data = [], cellMeta = [], heights = [], widths = [];

                // Colors
                var $style = $('#vwklhtmltables-tables-style');

                if (!$style.length) {
                    $style = $('<style/>', { id: 'vwklhtmltables-tables-style' });
                    $('head').append($style);
                }

                $.each(rows, function (x, row) {
                    var cells = [];

                    heights.push(row.height || undefined);

                    $.each(row.cells, function (y, cell) {
                        var metaData = {};

						cells.push(cell.data);

                        if ('meta' in cell && cell.meta !== undefined) {
                            var color = /color\-([0-9abcdef]{6})/.exec(cell.meta),
                                background = /bg\-([0-9abcdef]{6})/.exec(cell.meta);

                            if (null !== color) {
                                $style.html($style.html() + ' .'+color[0]+' {color:#'+color[1]+' !important}');
                            }

                            if (null !== background) {
                                $style.html($style.html() + ' .'+background[0]+' {background-color:#'+background[1]+' !important}');
                            }

                            metaData = $.extend(metaData, { row: x, col: y, className: cell.meta });
                        }

						if (cell.formatType) {
							metaData = $.extend(metaData, {
								type: cell.type == 'numeric' ? 'text' : cell.type, // To remove numeric renderer
								format: cell.type == 'numeric' ? '' : cell.format,
								formatType: cell.type == 'numeric' ? '' : cell.formatType
							});
						} else {
							if(app.Models.Tables.isNumber(cell.data)) {
								metaData = $.extend(metaData, {
									type: 'text',
									format: '',
									formatType: 'number'
								});
							}
						}

						switch(cell.formatType) {
							case 'currency':
								metaData.renderer = Handsontable.renderers.CurrencyRenderer;
								break;
							case 'percent':
								metaData.renderer = Handsontable.renderers.PercentRenderer;
								break;
							case 'date':
								metaData.type = 'date';
								metaData.dateFormat = cell.format;
								metaData.correctFormat =  true;
								break;
							default:
								metaData.renderer = Handsontable.renderers.DefaultRenderer;
								break;
						}

                        cellMeta.push(metaData);

                        if (x === 0 && meta.columnsWidth) {
                            widths.push(meta.columnsWidth[y] > 0 ? meta.columnsWidth[y] : 62);
                        } else if (x === 0 ) {
                            // Old
                             widths.push(cell.width === undefined ? 62 : cell.width);
                        }

                        if ('comment' in cell && cell.comment.length) {
                            comments.push({
                                col:     y,
                                row:     x,
                                comment: cell.comment
                            });
                        }

                    });

                    data.push(cells);
                });

                // Height & width
                editor.updateSettings({
                    rowHeights: heights,
                    colWidths: widths
                });

                // Load extracted data.
                editor.loadData(data);

                // Comments
                // Note: comments need to be loaded after editor.loadData() call.
                if (comments.length) {
                    editor.updateSettings({
                        cell: comments
                    });
                }

                // Load extracted metadata.
                $.each(cellMeta, function (i, meta) {
                    meta.className = meta.className.join(' ');
                    editor.setCellMetaObject(meta.row, meta.col, meta);
                });
            }

        }).fail(function (error) {
            alert('Failed to load table data: ' + error);
        }).always(function (response) {
            $('#loadingProgress').remove();
            editor.render();
        });

        $cloneDialog = $('#cloneDialog').dialog({
            autoOpen: false,
            width:    480,
            modal:    true,
            buttons:  {
                Close: function () {
                    $(this).dialog('close');
                },
                Clone: function (event) {
                    $dialog = $(this);

                    var $button = $(event.target).closest('button'),
                        defaultHtml = $button.html();
                    $button.html(app.createSpinner());
                    $button.attr('disabled', true);

                    app.Models.Tables.request('cloneTable', {
                        id: app.getParameterByName('id'),
                        title: $(this).find('input').val()
                    }).done(function(response) {
                        if (response.success) {
                            html = '<a href="' + app.replaceParameterByName(window.location.href, 'id', response.id) + '" class="ui-button" style="padding-top: 8px !important; padding-bottom: 8px !important; text-decoration: none !important;">Open cloned table</a><div style="float: right; margin-top: 5px;">Done!</div>';
							$button.hide();
							$dialog.find('.input-group').hide();
                            $dialog.find('.input-group').after($('<div>', {class: 'message', html: html}));
                        }
                        $button.html(defaultHtml);
                    });
                }
            }
        });
        $('#buttonClone').on('click', function () {
            $cloneDialog.dialog('open');
            $cloneDialog.find('.message').remove();
            $cloneDialog.find('.input-group').show();
            $cloneDialog.next().find('button:eq(1)').removeAttr('disabled');
            $cloneDialog.find('input').val($.trim($('.table-title').text()) + '_Clone');
        });
		$('#buttonSave').on('click', function () {
			saveTable.call(this).fail(function (error) {
				alert('Failed to save table data: ' + error);
			});
		});
        $('#buttonDelete').on('click', function () {
            var $button = $(this),
                html = $button.html();

            if (!confirm('Are you sure you want to delete the this table?')) {
                return;
            }

            // Do loading animation inside the button.
            $button.html(app.createSpinner());

            app.Models.Tables.remove(app.getParameterByName('id'))
                .done(function () {
                    window.location.href = $('#menuItem_tables').attr('href');
                })
                .fail(function (error) {
                    alert('Failed to delete table: ' + error);
                })
                .always(function () {
                    $button.html(html);
                });
        });
		$('#buttonClearData').on('click', function () {
			if (!confirm('Are you sure you want to clear all data in this table?')) {
				return;
			}
			editor.clear();
		});
        $('.table-title[contenteditable]').on('keydown', function (e) {
            if (!('keyCode' in e) || e.keyCode !== 13) {
                return;
            }

            var $heading = $(this),
                title = $heading.text();

            $heading.removeAttr('contenteditable')
                .html(app.createSpinner());

            app.Models.Tables.rename(app.getParameterByName('id'), title)
                .done(function () {
                    $heading.text(title);
                    $heading.attr('data-table-title', title);
                })
                .fail(function (error) {
                    $heading.text($heading.attr('data-table-title'));
                    alert('Failed to rename table: ' + error);
                });
        });
		$('#table-elements-head').on('change ifChanged', function() {
			var fixedHead = $('#features-fixed-header');

			if(!$(this).is(':checked') && fixedHead.is(':checked')) {
				fixedHead.iCheck('uncheck');
			}
		});
		$('#table-elements-foot').on('change ifChanged', function() {
			var fixedFooter = $('#features-fixed-footer');

			if(!$(this).is(':checked') && fixedFooter.is(':checked')) {
				fixedFooter.iCheck('uncheck');
			}
		});
		$('#features-fixed-header').on('change ifChanged', function() {
			var head = $('#table-elements-head');

			if($(this).is(':checked') && !head.is(':checked')) {
				head.iCheck('check');
			}
		});
		$('#features-fixed-footer').on('change ifChanged', function() {
			var foot = $('#table-elements-foot');

			if($(this).is(':checked') && !foot.is(':checked')) {
				foot.iCheck('check');
			}
		});
		$('.features-fixed-header-footer').on('change ifChanged', function() {
			if($('.features-fixed-header-footer').is(':checked')) {
				$('.features-fixed-height').fadeIn();
			} else {
				$('.features-fixed-height').fadeOut();
			}
		});
		$('#editor-use-number-format').on('change ifChanged', function() {
			if($(this).is(':checked')) {
				app.Editor.Hot.useNumberFormat = true;
				$('.use-number-format-options').show();
			} else {
				app.Editor.Hot.useNumberFormat = false;
				$('.use-number-format-options').hide();
			}
			editor.render();
		}).trigger('change');
		
        $('[data-toggle="tooltip"]').tooltip();

		jQuery('#stbCopyTextCodeExamples').change(function(){
			jQuery('.stbCopyTextCodeShowBlock').hide().filter('[data-for="'+ jQuery(this).val()+ '"]').show();
		}).trigger('change');

        // Pro notify
        var $notification = $('#proPopup').dialog({
            autoOpen: false,
            width:    480,
            modal:    true,
            buttons:  {
                Close: function () {
                    $(this).dialog('close');
                }
            }
        });
        $editableFieldProFeatureDialog = $('#editableFieldProFeatureDialog').dialog({
            autoOpen: false,
            width:    480,
            modal:    true,
            buttons:  {
                Close: function () {
                    $(this).dialog('close');
                }
            }
        });
		$addDiagramProFeatureDialog = $('#addDiagramProFeatureDialog').dialog({
			autoOpen: false,
			width:    913,
			height:   'auto',
			modal:    true,
			buttons:  {
				Close: function () {
					$(this).dialog('close');
				}
			}
		});
		$('.pro-notify').on('click', function () {
			$notification.dialog('open');
		});
		$('#editableFieldProFeature').on('click', function(event) {
			event.preventDefault();
			$editableFieldProFeatureDialog.dialog('open');
		});
		$('#addDiagramProFeature').on('click', function(event) {
			event.preventDefault();
			$addDiagramProFeatureDialog.dialog('open');
		});
		$('#previewDiagramProFeature [data-tabs] a').on('click', function(event) {
			event.preventDefault();

			var dialog = $('#previewDiagramProFeature');

			dialog.find('[data-tabs] a').removeClass('active');
			dialog.find('[data-tab]').removeClass('active');

			$(this).addClass('active');
			dialog.find('[data-tab="' + $(this).attr('href') + '"]').addClass('active');
		});

		// Functions
		function initializeEditor() {
			var container = document.getElementById('tableEditor');

			return new Handsontable(container, {
				colHeaders:            true,
				colWidths:             100,
				comments:              true,
				contextMenu:           true,
				formulas:              true,
				manualColumnResize:    true,
				manualRowResize:       true,
				mergeCells:            true,
				outsideClickDeselects: false,
				renderer:              Handsontable.renderers.DefaultRenderer,
				rowHeaders:            true,
				startCols:             app.getParameterByName('cols') || 5,
				startRows:             app.getParameterByName('rows') || 5
			});
		}

		function initializeTabs() {
			var $rows = $('.row-tab'),
				$buttons = $('.subsubsub.tabs-wrapper .button');

			var current = $buttons.filter('.current')
				.attr('href');

			$rows.filter(current)
				.addClass('active');

			$buttons.on('click', function (e) {
				e.preventDefault();

				var $button = $(this),
					current = $button.attr('href');

				$rows.removeClass('active');

				$buttons.filter('.current').removeClass('current');
				$button.addClass('current');

				$rows.filter(current).addClass('active');

				if (current === '#row-tab-editor') {
					editor.render();
				} else if (current === '#row-tab-preview') {
					var $container = $(current).find('#table-preview'),
						$_previewTable = null,
						$customCss = $('#table-custom-css');

					if (!$customCss.length) {
						$customCss = $('<style/>', { id: 'table-custom-css' });
						$('head').append($customCss);
					}

					saveTable.call($container)
						.done(function () {
							app.Models.Tables.render(app.getParameterByName('id'))
								.done(function (response) {
									var $preview = $(response.table),
										table;

									if ($_previewTable !== null) {
										$_previewTable.destroy();
									}

									$container.empty().append($preview);
									table = $container.find('table');

									$_previewTable = app.initializeTable(table, app.showTable(table));

									var ruleJS = window.ruleJS($container.find('table').attr('id'));

									table.on('draw.dt init.dt', function () {
										ruleJS.init();
									});

									var $formatCells = table.find('[data-cell-format-type]').on('change', function(event) {
										var $this = $(this),
											value = $.trim($this.text()),
											data = app.Models.Tables.setCellFormat(value, { formatType: $this.data('cell-format-type')}),
											newValue = data.value;

										$this.text(newValue);
									});

									table.trigger('init.dt');

									table.find('[data-cell-format-type]').each(function(index, el) {
										var $this = $(this),
											value = $.trim($this.text()),
											data = app.Models.Tables.setCellFormat(value, { formatType: $this.data('cell-format-type')}),
											newValue = data.value;

										$this.text(newValue);
									});

									table.find('td.editable').attr('contenteditable', true)
										.on('focus', function(event) {
											var $this = $(this),
												originalValue = $this.data('original-value'),
												formula = $this.data('formula');

											if(formula !== undefined) {
												$this.text('=' + formula);
											} else if(originalValue !== undefined) {
												$this.text(originalValue);
											}
										})
										.on('blur', function(event) {
											var $this = $(this),
												value = $.trim($this.text()),
												originalValue = $this.data('original-value'),
												formula = $this.data('formula');

											if(formula !== undefined) {
												value = value[0] == '=' ? value.replace('=','') : value;
												$this.data('formula', value);
												$this.attr('data-formula', value);
											} else if (originalValue !== undefined) {
												value = numeral().unformat(value);
												$this.data('original-value', value);
												$this.attr('data-original-value', value);
											}
											ruleJS.init();
											$formatCells.trigger('change');
										});

									app.fixSortingForMultipleHeader(table);
								});

							$customCss.text(ace.getValue());
						});
				}
			});
		}

		function saveTable() {
			var $loadable = $(this),
				defaultHtml = $loadable.html(),
				id = app.getParameterByName('id'),
				form = $('form#settings');

			$loadable.html(app.createSpinner());

			// We need to put table description into the hidden field before the saving of table settings
			$('form#settings input[name="elements[descriptionText]"]').val( $('form#settings #descriptionText').val() );

			// Request to save settings.
			var settings = app.Models.Tables.request('saveSettings', {
				id: id,
				settings: form.serialize()
			});

			// Request to save the table rows.
			var data = [];
			var columnsWidth = [];

			$.each(editor.getData(), function (x, rows) {
				var row = { cells: [] };

				$.each(rows, function (y, cell) {
					var meta = editor.getCellMeta(x, y),
						classes = [],
						data = {
							hidden: editor.mergeCells.mergedCellInfoCollection.getInfo(x, y) !== undefined,
							hiddenCell: meta.className && meta.className.match('hiddenCell') !== null
						};
					if (x == 0) {
						columnsWidth.push(editor.getColWidth(y));
					}

					if (meta.className !== undefined) {
						$.each(meta.className.split(' '), function (index, element) {
							if (element.length) {
								classes.push($.trim(element));
							}
						});
					}

					if ('comment' in meta && meta.comment.length) {
						data.comment = meta.comment;
					}

					data.data = cell;
					data.meta = classes;
					data.calculatedValue = null;
					data.type = meta.type ? meta.type : 'text';

					if (data.type == 'date') {
						var date = moment(data.data, data.format);

						if (date.isValid()) {
							data.dateOrder = date.format('x');
						}
					}

					data.formatType = meta.formatType ? meta.formatType : '';

					switch(data.formatType) {
						case 'currency':
							data.format = form.find('[name="currencyFormat"]').val();
							break;
						case 'percent':
							data.format = form.find('[name="percentFormat"]').val();
							break;
						case 'date':
							data.format = form.find('[name="dateFormat"]').val();
							break;
						default:
							data.format = meta.format;
							break;
					}

					if (app.Models.Tables.isFormula(cell)) {
						var item = editor.plugin.matrix.getItem(editor.plugin.utils.translateCellCoords({
							row: x,
							col: y
						}));

						if (item !== undefined) {
							var value = item.value;
							// round float
							if (!isNaN(value) && value !== '0' && value !== 0 && value % 1 !== 0) {
								var floatValue = parseFloat(value);
								if (floatValue.toString().indexOf('.') !== -1) {
									var afterPointSybolsLength = floatValue.toString().split('.')[1].length;
									if (afterPointSybolsLength > 4) {
										item.value = floatValue.toFixed(4);
									}
								}
							}
							data.calculatedValue = item.value;
						}
					}

					row.cells.push(data);
				});

				// Row height
				row.height = editor.getRowHeight(x);
				if (row.height === undefined || parseInt(row.height) < 10) {
					row.height = null;
				}

				data.push(row);
			});

			var deferred = $.when(
				app.Models.Tables.setRows(id, data),
				app.Models.Tables.setMeta(id, {
					mergedCells: editor.mergeCells.mergedCellInfoCollection,
					columnsWidth: columnsWidth,
					css: ace.getValue()
				}),
				settings
			);

			return deferred.always(function () {
				$loadable.html(defaultHtml);
			});
		}

		function generateWidthData() {
			if (! editor.allWidths) {
				if(typeof(editor.getSettings().colWidths) == 'object') {
					editor.allWidths = editor.getSettings().colWidths;
				} else {
					editor.allWidths = [];
				}
			}
		}
    });

}(window.jQuery, window.vwklhtmltables.Tables));