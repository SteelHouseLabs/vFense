define(
    ['jquery', 'underscore', 'backbone', 'text!templates/overviewDetail.html'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        return {
            Model: Backbone.Model.extend({
                defaults: {
                    key: 'n/a',
                    data: '-'
                }
            }),
            View: Backbone.View.extend({
                tagName: 'dl',
                className: 'widget',
                template: myTemplate,
                events: {
                    'change': 'render'
                },
                initialize: function () {},
                render: function () {
                    var tmpl = _.template(this.template),
                        format = this.model.get('format');

                    this.$el
                        .html(tmpl(this.model.toJSON()));

                    if (_.isObject(format) && !_.isEmpty(format)) {
                        this.applyFormat();
                    }

                    return this;
                },
                applyFormat: function () {
                    var data = this.model.get('data'),
                        format = this.model.get('format')[0],
                        rule  = format.rule,
                        value = format.value,
                        style = format.style,
                        apply = false;

                    if (rule === 'e') {
                        if (data === value) {
                            apply = true;
                        }
                    } else if (rule === 'ne') {
                        if (data !== value) {
                            apply = true;
                        }
                    } else if (rule === 'gt') {
                        if (data > value) {
                            apply = true;
                        }
                    } else if (rule === 'lt') {
                        if (data < value) {
                            apply = true;
                        }
                    } else if (rule === 'gte') {
                        if (data >= value) {
                            apply = true;
                        }
                    } else if (rule === 'lte') {
                        if (data <= value) {
                            apply = true;
                        }
                    }

                    this.$el.toggleClass(style, apply);
                }
            })
        };
    }
);
