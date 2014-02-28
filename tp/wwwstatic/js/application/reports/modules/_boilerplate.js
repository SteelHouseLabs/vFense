define(
    ['jquery', 'underscore', 'backbone', 'text!../templates/aTemplate.html'],
    function ($, _, Backbone, myTemplate) {
        'use strict';
        var exports = {};
        exports.name = 'moduleName';
        exports.models = {
            Main: Backbone.Model.extend({
                //model code
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    this.template = myTemplate;
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
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    this.template = myTemplate;
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
