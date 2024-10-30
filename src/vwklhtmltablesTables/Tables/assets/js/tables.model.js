(function ($, app) {

    var TablesModel = (function () {
        function TablesModel() {}

        /**
         * Sends the request to the Tables module.
         * @param {string} action
         * @param {object} data
         * @returns {jQuery.Deferred.promise}
         */
        TablesModel.prototype.request = function (action, data) {
            return app.request({
                module: 'tables',
                action: action
            }, data);
        };

        /**
         * Removes table by id.
         * @param {int} id
         * @returns {jQuery.Deferred.promise}
         */
        TablesModel.prototype.remove = function (id) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('remove', { id: id });
        };

        /**
         * Renames table.
         * @param {int} id
         * @param {string} title
         * @returns {jQuery.Deferred.promise}
         */
        TablesModel.prototype.rename = function (id, title) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('rename', { id: id, title: title });
        };

        TablesModel.prototype.getColumns = function (id) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('getColumns', { id: id });
        };

        TablesModel.prototype.setColumns = function (id, columns) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('updateColumns', { id: id, columns: columns })
        };

        TablesModel.prototype.getRows = function (id) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('getRows', { id: id });
        };

        TablesModel.prototype.setRows = function (id, rows) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('updateRows', { id: id, rows: JSON.stringify(rows) });
        };

        TablesModel.prototype.setMeta = function (id, meta) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('updateMeta', { id: id, meta: JSON.stringify(meta) });
        };

        TablesModel.prototype.getMeta = function (id) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('getMeta', { id: id });
        };

        TablesModel.prototype.render = function (id) {
            if (isNaN(id = parseInt(id))) {
                throw new Error('Invalid table id.');
            }

            return this.request('render', { id: id });
        };
		TablesModel.prototype.isNumber = function (value) {
			if (value) {
				if (value.toString().match(/^-{0,1}\d+\.{0,1}\d*$/)) {
					return true;
				}
			}

			return false;
		};
		TablesModel.prototype.isFormula = function (value) {
			if (value) {
				if (value[0] === '=') {
					return true;
				}
			}
			return false;
		};
		TablesModel.prototype.getFormulaResult = function (value, row, col) {
			var cellId = app.Editor.Hot.plugin.utils.translateCellCoords({row: row, col: col}),
				formula = value.substr(1).toUpperCase(),
				newValue = app.Editor.Hot.plugin.parse(formula, {row: row, col: col, id: cellId}),
				result = false;

			if(!newValue.error) {
				result = newValue.result;
			} else {
				result = newValue.error;
			}
			return result;
		};
		TablesModel.prototype.setCellFormat = function(value, formatType) {
			if(value && this.isNumber(value) && !isNaN(value)) {
				var languageData = numeral.languageData(),
					format = jQuery('input[name="' + formatType + 'Format"]').val(),
					delimiters,
					preparedFormat;

				switch(formatType) {
					case 'number':
						delimiters = (format.match(/[^\d]/g) || [',', '.']).reverse();
						languageData.delimiters = {
							decimal: delimiters[0],
							thousands: delimiters[1]
						};

						// We need to use dafault delimiters for format string
						preparedFormat = format
							.replace(format, format
								.replace(delimiters[0], '.')
								.replace(delimiters[1], ',')
						);
						break;
					case 'percent':
						var clearFormat = format.indexOf('%') > -1 ? format.match(/\d.?\d*.?\d*/)[0] : format;

						delimiters = (clearFormat.match(/[^\d]/g) || [',', '.']).reverse();
						languageData.delimiters = {
							decimal: delimiters[0],
							thousands: delimiters[1]
						};

						// We need to use dafault delimiters for format string
						preparedFormat = format.replace(
							clearFormat, clearFormat
								.replace(delimiters[0], '.')
								.replace(delimiters[1], ',')
						);
						break;
					case 'currency':
						var formatWithoutCurrency = format.match(/\d.?\d*.?\d*/)[0],
							currencySymbol = format.replace(formatWithoutCurrency, '') || '$';

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

						app.Editor.Hot.currencySymbol = currencySymbol;
						app.Editor.Hot.currencyFormat = preparedFormat;
						break;
					default:
						break;
				}

				numeral.language('en', languageData);
				value = numeral(value).format(preparedFormat);
			}

			return value;
		};

        return TablesModel;
    })();

    app.Models = app.Models || {};
    app.Models.Tables = new TablesModel();

}(window.jQuery, window.vwklhtmltables.Tables));