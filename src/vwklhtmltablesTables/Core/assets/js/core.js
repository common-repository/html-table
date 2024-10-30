(function (vendor, $, window) {

	var appName = 'Tables';

	if (!(appName in vendor)) {
		vendor[appName] = {};

		vendor[appName].getAppName = (function getAppName() {
			return appName;
		});

		vendor[appName].request = (function request(route, data) {
			if (!$.isPlainObject(route) || !('module' in route) || !('action' in route)) {
				throw new Error('Request route is not specified.');
			}

			if (!$.isPlainObject(data)) {
				data = {};
			}

			if ('action' in data) {
				throw new Error('Reserved field "action" used.');
			}

			data.action = 'vwklhtmltables-tables';

			var url = window.ajaxurl ? window.ajaxurl : ajax_obj.ajaxurl,
				request = $.post(url, $.extend({}, { route: route }, data)),
				deferred = $.Deferred();

			request.done(function (response, textStatus, jqXHR) {
				if (typeof response.success !== 'undefined' && response.success) {
					deferred.resolve(response, textStatus, jqXHR);
				} else {
					var message = 'There are errors during the request.';

					if (typeof response.message !== 'undefined') {
						message = response.message;
					}

					deferred.reject(message, textStatus, jqXHR);
				}
			}).fail(function (jqXHR, textStatus, errorThrown) {
				deferred.reject(errorThrown, textStatus, jqXHR);
			});

			return deferred.promise();
		});

		vendor[appName].getParameterByName = (function getParameterByName(name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");

			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
				results = regex.exec(location.search);

			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		});

		vendor[appName].replaceParameterByName = (function (url, paramName, paramValue) {
			var pattern = new RegExp('\\b('+paramName+'=).*?(&|$)');
			if (url.search(pattern) >= 0) {
				return url.replace(pattern,'$1' + paramValue + '$2');
			}
			return url + (url.indexOf('?')>0 ? '&' : '?') + paramName + '=' + paramValue;
		});

		vendor[appName].createSpinner = (function createSpinner () {
			return $('<i/>', { class: 'fa fa-fw fa-spin fa-circle-o-notch' });
		});

		// Callback for displaying table after initializing
		vendor[appName].showTable = (function showTable (table) {
			var $table = (table instanceof $ ? table : $(table)),
				$tableWrap = $table.closest('.vwklhtmltables-tables-wrap'),
				_ruleJS = new ruleJS($tableWrap.attr('id'));

			_ruleJS.init();
			$tableWrap.prev('.spinner').hide();
			$tableWrap.css('visibility', 'visible');
		});
		/**
		 * Integration with our PopUp plugin 
		 */
		function _checkOnClickPopups( $table ) {
			if(typeof(_ppsBindOnElementClickPopups) !== 'undefined' && $table && $table.size()) {
				var $bindedLinks = $table.find('[href*="#ppsShowPopUp_"].ppsClickBinded');
				if($bindedLinks && $bindedLinks.size()) {
					$bindedLinks.removeClass('ppsClickBinded').unbind('click');
				}
				_ppsBindOnElementClickPopups();
			}
		}
		vendor[appName].fixSortingForMultipleHeader = function (table) {
			if(table.data('head-rows-count') > 1 && table.data('sort-order')) {
				var thead = table.find('thead tr').get().reverse();

				// Fix of sorting for table with multiple header (when header has more than 1 row)
				if(table.data('head')) {
					$.each(table.find('thead tr:last-child th'), function (index, element) {
						var th = jQuery(element),
							nthChild = index + 1;

						if(!th.is(':visible')) {
							jQuery(thead).each(function() {
								var item = jQuery(this).find('th:nth-child(' + nthChild + ')');

								if(item.is(':visible')) {
									item.addClass('sorting');
									item.click(function() {
										th.trigger('click');
									});
									return false; // stop .each() function
								}
							});
						}
					});
				}
				// Fix of displaying the footer if table has multiple header
				if(table.data('foot')) {
					var newFooter = [];

					$.each(table.find('tfoot tr th'), function (index, element) {
						var nthChild = index + 1;

						jQuery(thead).each(function() {
							var item = jQuery(this).find('th:nth-child(' + nthChild + ')');

							if(item.is(':visible')) {
								newFooter.push(item.clone());
								return false; // stop .each() function
							}
						});

					});
					table.find('tfoot').html(newFooter);
				}
			}
		};

		vendor[appName].isNumber = function isNumber(value) {
			if (value) {
				if (value.toString().match(/^-{0,1}\d+\.{0,1}\d*$/)) {
					return true;
				}
			}

			return false;
		};

		vendor[appName].formatDataAtTable = function formatDataAtTable(table) {
			var numberFormat = table.data('number-format'),
				skipFirstCol = false;

			if(table.data('auto-index') != 'off') {
				skipFirstCol = true;
			}

			table.find('td').each(function(index, el) {
				var $this = $(this);

				if(skipFirstCol && $this.is(':first-child')) {
					// Break current .each ineration
					return;
				}

				var languageData = numeral.languageData(),
					format = $this.data('cell-format'),
					formatType = $this.data('cell-format-type'),
					preparedFormat,
					delimiters,
					value = $.trim($this.html()),
					noFormat = false;

				if(value && value.toString().match(/^-{0,1}\d+\.{0,1}\d*$/) && !isNaN(value)) {
					format = format ? format.toString() : '';
					numberFormat = numberFormat ? numberFormat.toString() : '';

					switch(formatType) {
						case 'percent':
							var clearFormat = format.indexOf('%') > -1 ? format.match(/\d.?\d*.?\d*/)[0] : format;

							value = value.indexOf('%') > -1 ? $this.data('original-value') : value;
							delimiters = (clearFormat.match(/[^\d]/g) || [',', '.']).reverse();
							languageData.delimiters = {
								decimal: delimiters[0], thousands: delimiters[1]
							};

							// We need to use dafault delimiters for format string
							preparedFormat = format.replace(clearFormat, clearFormat.replace(delimiters[0], '.').replace(delimiters[1], ','));
							break;
						case 'currency':
							var formatWithoutCurrency = format.match(/\d.?\d*.?\d*/)[0],
								currencySymbol = format.replace(formatWithoutCurrency, '') || '$';	// We need to set currency symbol in any case for normal work of numeraljs

							delimiters = (formatWithoutCurrency.match(/[^\d]/g) || [',', '.']).reverse();
							languageData.delimiters = {
								decimal: delimiters[0],
								thousands: delimiters[1]
							};
							languageData.currency.symbol = currencySymbol;

							// We need to use dafault delimiters for format string
							preparedFormat = format
								.replace(formatWithoutCurrency, formatWithoutCurrency
									.replace(delimiters[0], '.')
									.replace(delimiters[1], ','))
								.replace(currencySymbol, '$');
							break;
						case 'date':
							noFormat = true;
							break;
						default:
							if(numberFormat) {
								format = numberFormat;
								delimiters = (format.match(/[^\d]/g) || [',', '.']).reverse();
								languageData.delimiters = {
									decimal: delimiters[0]
								,	thousands: delimiters[1]
								};

								// We need to use dafault delimiters for format string
								preparedFormat = format.replace(format, format.replace(delimiters[0], '.').replace(delimiters[1], ','));
								break;
							} else {
								noFormat = true;
							}
							break;
					}

					if(noFormat) {
						noFormat = false;
					} else {
						numeral.language('en', languageData);
						value = numeral(value).format(preparedFormat);
					}
				}

				$this.html(value);
			});
		};

		vendor[appName].initializeTable = (function initializeTable(table, callback) {
			var defaultFeatures = {
				autoWidth:  false,
				info:       false,
				ordering:   false,
				paging:     false,
				responsive: true,
				searching:  false,
				stateSave:  false,
				initComplete: callback
			};
			
			var $table = (table instanceof $ ? table : $(table)),
				features = $table.data('features'),
				config = {},
				translation = {},
				language = $table.data('lang'),
				override = $table.data('override'),
				responsiveMode = $table.data('responsive-mode'),
				searchingSettings = $table.data('searching-settings');

			$.each(features, function () {
				var featureName = this.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
				config[featureName] = true;
				if (featureName == 'ordering') {
					config.columnDefs = [
						{ 'type': 'natural', targets: '_all' }
					];
					if (!$table.data('head')) {
						config.aoColumnDefs = [
							{ "bSortable": false, "aTargets": [ "_all" ] }
						];
					}
				}

				if (featureName == 'searching' && searchingSettings) {

					if (searchingSettings.minChars > 0 ||
						searchingSettings.resultOnly ||
						searchingSettings.strictMatching) {

						$.fn.dataTable.ext.search.push(function(settings, data) {

							var $searchInput = $(settings.nTableWrapper).find('.dataTables_filter input'),
								searchValue = $searchInput.val();


							if (searchingSettings.resultOnly && searchValue.length === 0) {
								if (searchingSettings.showTable) {
									return false;
								}
								return false;
							}

							if (searchingSettings.strictMatching) {
								searchValue = $.fn.dataTable.util.escapeRegex(searchValue);
								var regExp = new RegExp('^' + searchValue, 'i');

								for (var i = 0; i < data.length; i++) {
									var words = data[i].replace(/\s\s+/g, ' ').split(' ');

									for (var j = 0; j < words.length; j++) {
										if (words[j].match(regExp)) {
											return true;
										}
									}
								}

								return false;
							} else {
								return data.join(' ').toLowerCase().indexOf(searchValue.toLowerCase()) !== -1
							}
						});

						$table.on('init.dt', function (event, settings)  {

							if (!settings) {
								return;
							}

							var $tableWrapper = $(settings.nTableWrapper),
								$tableSearchInput = $tableWrapper.find('.dataTables_filter input'),
								$customInput = $tableSearchInput.clone();


							$tableSearchInput.replaceWith($customInput);

							$customInput.on('input change', function() {

								if (!searchingSettings.showTable) {
									if (searchingSettings.resultOnly && searchingSettings.minChars && (this.value.length < searchingSettings.minChars || !this.value.length)) {
										$table.hide();
										$table.parent().find('.dataTables_paginate').hide();
									} else {
										$table.show();
										$table.parent().find('.dataTables_paginate').show();
									}
								}


								if (searchingSettings.minChars && (this.value.length < searchingSettings.minChars && this.value.length !== 0)) {
									event.preventDefault();
									return false;
								}

								$table.api().draw();
							});

							if (searchingSettings.resultOnly && !searchingSettings.showTable) {
								$table.hide();
								$table.parent().find('.dataTables_paginate').hide();
							}

						});
					}

				}
			});

			if(responsiveMode === 2 || responsiveMode === 3) {
				if ($table.data('head') && $table.data('fixed-head')) {
					config.fixedHeader = {
						header: true
					};
				}
				if ($table.data('foot') && $table.data('fixed-foot')) {
					config.fixedHeader = config.fixedHeader || {};
					config.fixedHeader.footer = true;
				}
				if(typeof(config.fixedHeader) != 'undefined') {
					config.scrollY = $table.data('fixed-height');
					config.scrollCollapse = true;
				}
				if ($table.data('fixed-cols')) {
					config.fixedColumns = {
						leftColumns: $table.data('fixed-left') ? parseInt($table.data('fixed-left')) : 0,
						rightColumns: $table.data('fixed-right') ? parseInt($table.data('fixed-right')) : 0
					};
					config.scrollX = true;
				}
			}

			if(responsiveMode === 2 && typeof(config.fixedHeader) != 'undefined' && typeof(config.fixedColumns) == 'undefined') {
				config.fixedColumns = {
					leftColumns: 0,
					rightColumns: 0
				};
				config.scrollX = true;
			}

			if ($table.data('sort-order')) {
				config.order = [
					[$table.data('sort-column') - 1, $table.data('sort-order')]
				];
			}

			if ($table.data('pagination-length')) {
				aLengthMenu = [];
				paginationLength = String($table.data('pagination-length'));
				aLengthMenu.push(paginationLength.replace('All', -1).split(',').map(Number));
				aLengthMenu.push(paginationLength.split(','));
				config.aLengthMenu = aLengthMenu;
			}

			if ($table.data('auto-index') && $table.data('auto-index') !== 'off') {
				config.fnRowCallback = function(nRow, aData, iDisplayIndex) {
					$("td:first", nRow).html(iDisplayIndex +1);
					return nRow;
				};
			}

			config.responsive = {
				details: {
					renderer: function (api, rowIdx, columns) {
						var $table = $(api.table().node()),
							$data = $('<table/>');

						$.each(columns, function (i, col) {
							if (col.hidden) {
								var $cell = $(api.cell(col.rowIndex, col.columnIndex).node()),
									markup = '<tr data-dt-row="'+col.rowIndex+'" data-dt-column="'+col.columnIndex+'">';
								if ($table.data('head') == 'on') {
									var $headerContent = $(api.table().header()).find('th').eq(col.columnIndex).html();
									markup += '<td>';
									if ($headerContent) {
										markup += $headerContent;
									}
									markup += '</td>';
								}
								markup += '</tr>';
								$cell.after(
									$('<td>')
										.addClass('collapsed-cell-holder')
										.attr('data-cell-row', col.rowIndex)
										.attr('data-cell-column', col.columnIndex)
										.hide()
								);
								$data.append($(markup).append($cell.addClass('collapsed').show()));
							}
						});
						return $data.is(':empty') ? false : $data;
					}
				}
			};


			$table.on('responsive-resize.dt', function(event, api, columns) {
				if ($table.width() > $table.parent().width()) {
					api.responsive.recalc();
					return;
				}
				for (var i = 0, len = columns.length; i < len; i++) {
					if (columns[i]) {
						$table.find('tr > td.collapsed-cell-holder[data-cell-column="' + i + '"]').each(function(index, el) {
							var $this = $(this);
							var $cell = $(api.cell(
								$this.data('cell-row'),
								$this.data('cell-column')
							).node());

							if ($cell.hasClass('collapsed')) {
								$cell.removeClass('collapsed');
								$this.replaceWith($cell);
							}
						});
					}
				}
			});

			if (responsiveMode !== 1) {
				config.responsive = false;
			}

			$.fn.dataTableExt.oApi.fnFakeRowspan = function (oSettings) {

				function setCellAttributes(cellArray) {
					for (var i = 0; i < cellArray.length; i++) {

						if (cellArray[i].getAttribute('data-hide')) {
							cellArray[i].style.display = 'none';
						}

						if (colspan = cellArray[i].getAttribute('data-colspan')) {
							if (colspan > 1) {
								cellArray[i].setAttribute('colspan', colspan);
							}
						}

						if (rowspan = cellArray[i].getAttribute('data-rowspan')) {
							if (rowspan > 1) {
								cellArray[i].setAttribute('rowspan', rowspan);
							}
						}
					}
				}

				$.each(oSettings.aoData, function(index, rowData) {
					setCellAttributes(rowData.anCells);
				});

				if (oSettings.aoHeader.length) {
					cells = [];
					$.each(oSettings.aoHeader, function(index, rowData) {
						$.each(rowData, function(index, cellData) {
							cells.push(cellData.cell);
						});
					});
					setCellAttributes(cells);
				}

				if (oSettings.aoFooter.length) {
					cells = [];
					$.each(oSettings.aoFooter[0], function(index, cellData) {
						cells.push(cellData.cell);
					});
					setCellAttributes(cells);
				}

				return this;
			};

			if (language.length && language !== 'default') {
				$.get('//cdn.datatables.net/plug-ins/1.10.9/i18n/'+ language +'.json')
					.done(function (response) {
						translation = response;
					}).always(function () {
						$.each(override, function (key, value) {
							if (value.length) {
								translation[key] = value;
								// We need to support old DT format, cuz some languages use it
								translation['s' + key.charAt(0).toUpperCase() + key.substr(1)] = value;
							}
						});

						config.language = translation;
						_checkOnClickPopups();
						return $table.dataTable($.extend({}, defaultFeatures, config)).fnFakeRowspan();
					});
			} else {
				$.each(override, function (key, value) {
					if (value.length) {
						translation[key] = value;
						// We need to support old DT format, cuz some languages use it
						translation['s' + key.charAt(0).toUpperCase() + key.substr(1)] = value;
					}
				});

				config.language = translation;
				_checkOnClickPopups();
				return $table.dataTable($.extend({}, defaultFeatures, config)).fnFakeRowspan();
			}
		});
	}

	var reviewNoticeResponse = function() {
		$(document).one('click',
			'.vwklhtmltables-admin-notice a, .vwklhtmltables-admin-notice button',
			function(event) {

				var responseCode = $(this).data('response-code') || 'hide';

				$('.vwklhtmltables-admin-notice .notice-dismiss').trigger('click');

				window.vwklhtmltables.Tables.request({
					module: 'tables',
					action: 'reviewNoticeResponse',
				}, {
					responseCode: responseCode,
				});
			});
	};

	reviewNoticeResponse();

}(window.vwklhtmltables = window.vwklhtmltables || {}, window.jQuery, window));