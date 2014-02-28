define(
    ['jquery', 'underscore', 'backbone', 'crel'],
    function ($, _, Backbone, crel) {
        'use strict';
        var exports = {};
        exports.name = 'logInfo';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: ''
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('hardwareInfo view requires a hardwareInfo model');
                    }
                    var id = this.model.get('id'),
                        params = {
                            count: 5,
                            offset: 0,
                            id: id
                        };
                    this.data = new (Backbone.Model.extend({
                        url: 'api/transactions/getTransactions?' + $.param(params)
                    }))();
                    this.listenTo(this.data, 'change', this.renderInfo);
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html(this.layout());
                    }
                    if (this.data.url) { this.data.fetch(); }
                    return this;
                },
                layout: function () {
                    return '';
                },
                renderInfo: function (model) {
                    if (!model.get('pass')) {
                        throw new Error('API was not able to fetch data');
                    }
                    console.log(model.get('data'));
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    //this.template = myTemplate;
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
