define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'reports/row', 'reports/column'],
    function ($, _, Backbone, app, crel, row, column) {
        'use strict';
        var defaultReport,
            deserialize,
            getModelFromObject,
            getCollectionFromArray,
            serialize,
            getObjectFromModel,
            getArrayFromCollection,
            exports = {
                View: app.createChild(Backbone.View)
            };

        defaultReport = {
            rows: [
                {
                    rowHeight: 3,
                    columnCount: 1,
                    columns: [
                        {
                            moduleName: 'plainText',
                            moduleJSON: {
                                text: 'This is an empty report.\n\nYou may have reached this page in error.'
                            },
                            moduleSpan: 12
                        }
                    ]
                }
            ]
        };

        deserialize = function (input, keyName) {
            if ($.isPlainObject(input)) { return getModelFromObject(input, keyName); }
            else if ($.isArray(input)) { return getCollectionFromArray(input, keyName); }
            else { return input; }
        };
        getModelFromObject = function (obj, keyName, deep) {
            var Construct = Backbone.Model,
                out;
            if (!_.isBoolean(deep)) { deep = true; }
            if (keyName === 'rows' && obj.rowHeight && obj.columns) {
                Construct = row.Model;
            } else if (keyName === 'columns' && obj.moduleName && obj.moduleJSON && obj.moduleSpan) {
                Construct = column.Model;
                deep = false;
            }
            if (deep) {
                out = new Construct();
                _.each(_.keys(obj), function (key) {
                    out.set(key, deserialize(obj[key], key));
                });
            } else {
                out = new Construct(obj);
            }
            return out;
        };
        getCollectionFromArray = function (arr, keyName) {
            var out = new Backbone.Collection();
            _.each(arr, function (elem) {
                out.push(deserialize(elem, keyName));
            });
            return out;
        };
        serialize = function (input) {
            if (input instanceof Backbone.Model) { return getObjectFromModel(input); }
            else if (input instanceof Backbone.Collection) { return getArrayFromCollection(input); }
            else { return input; }
        };
        getObjectFromModel = function (model) {
            var out = {};
            _.each(_.keys(model.attributes), function (key) {
                out[key] = serialize(model.attributes[key]);
            });
            return out;
        };
        getArrayFromCollection = function (elems) {
            var out = [];
            elems.each(function (elem) {
                out.push(serialize(elem));
            });
            return out;
        };

        _.extend(exports.View.prototype, {
            className: 'report',
            tagName: 'div',
            initialize: function () {
                this.subViews = [];
                if (_.isUndefined(this.model)) {
                    this.model = this.parseTemplate();
                }
                if (!_.isBoolean(this.options.editable)) {
                    this.options.editable = false;
                }
                return this;
            },
            parseTemplate: function () {
                var template = this.template || this.options.template || defaultReport,
                    params = this.templateParams || this.options.templateParams || undefined,
                    result = _.isFunction(template) ? template.call(this, params) : template;
                return deserialize(result);
            },
            render: function () {
                var rows = this.model.get('rows'),
                    $el = this.$el,
                    that = this;
                if ($el.children().length === 0) {
                    $el.html(this.layout(rows));
                    this.$('.row-fluid').each(function () {
                        var $this = $(this),
                            cid = $this.data('cid'),
                            row = rows.get(cid);
                        that.renderRow($this, row);
                    });
                }
                return this;
            },
            layout: function (rows) {
                var fragment,
                    that = this;
                fragment = document.createDocumentFragment();
                rows.each(function (model) {
                    fragment.appendChild(
                        that.layoutRow(model.cid)
                    );
                });
                return fragment;
            },
            layoutRow: function (cid) {
                return crel('div', {class: 'row-fluid', 'data-cid': cid}, 'Empty Row');
            },
            renderRow: function ($el, model) {
                var rowView = new row.View({
                    el: $el,
                    model: model,
                    editable: this.options.editable
                });
                this.addSubViews(rowView);
                return rowView.render();
            },
            deserialize: deserialize,
            serialize: function () {
                return serialize(this.model);
            }
        });
        return exports;
    }
);
