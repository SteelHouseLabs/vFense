define(
    ['jquery', 'underscore', 'backbone'],
    function ($, _, Backbone) {
        "use strict";
        return {
            View: Backbone.View.extend({
                initialize: function () {},
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    this.$el.empty();

                    this.$el.html('Hello World');

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
    }
);
