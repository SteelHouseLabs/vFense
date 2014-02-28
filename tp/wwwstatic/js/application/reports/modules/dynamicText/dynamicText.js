define(
    ['jquery', 'underscore', 'backbone', 'crel'],
    function ($, _, Backbone, crel) {
        'use strict';
        var exports = {};
        exports.name = 'dynamicText';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    url: '',
                    key: '',
                    name: '',
                    prefix: '',
                    suffix: '',
                    frequency: 0
                }
            })
        };
        function pluckSum(obj, key) {
            return _.reduce(
                _.pluck(obj, key),
                function (sum, num) {
                    var add = $.isNumeric(num) ? +num : 0;
                    return sum + add;
                },
                0 // initial sum
            );
        }

        function pluckAverage(obj, key) {
            return obj.length > 0 ? pluckSum(obj, key) / obj.length : 0;
        }

        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'span',
                className: [exports.name].join(' '),
                initialize: function () {
                    var that = this;
                    if (_.isUndefined(this.model)) {
                        throw new Error('hardwareInfo view requires a hardwareInfo model');
                    }
                    this.data = new (Backbone.Model.extend({
                        url: this.model.get('url')
                    }))();
                    this.listenTo(this.data, 'change', this.updateValue);
                    this.listenTo(this.data, 'sync', function () {
                        var frequency = that.model.get('frequency');
                        if (frequency > 0) {
                            that.refreshTimeout = setTimeout(function () { that.data.fetch(); }, frequency * 1000);
                        }
                    });
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
                updateValue: function () {
                    var value, key = this.model.get('key'),
                        title = this.model.get('name') || '',
                        suffix = this.model.get('suffix') || '',
                        prefix = this.model.get('prefix') || '',
                        data = _.isArray(this.data.get('data')) ? _.pluck(this.data.get('data'), key) : this.data.get('data');
                    if (data.length === 1) {
                        data = this.data.get('data')[0];
                        value = data[key];
                    } else if (data.length > 1) {
                        if ($.isNumeric(data[0])) {
                            value = Math.round(pluckAverage(this.data.get('data'), key) / 0.1) * 0.1;
                        } else {
                            value = data.join(' ');
                        }
                    } else {
                        value = data[key];
                    }
                    if (_.isUndefined(value)) { value = 'Error'; }
                    this.$el.text(title + prefix + value + suffix);
                    return this;
                },
                beforeClose: function () {
                    clearTimeout(this.refreshTimeout);
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

                    var tmpl = _.template(this.template),
                        model = this.model.toJSON();

                    this.$el.empty();

                    this.$el.append(tmpl({model: model}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
