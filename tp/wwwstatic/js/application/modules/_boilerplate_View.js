define(
    ['jquery', 'underscore', 'backbone', 'text!templates/aTemplate.html' ],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        return {
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var tmpl = _.template(this.template),
                        that = this;

                    this.$el.empty();

                    this.$el.append(tmpl());

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
                /*
                    New code here
                 */
            })
        };
    }
);
