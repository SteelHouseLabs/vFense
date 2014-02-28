define(
    ['jquery', 'underscore', 'backbone', 'app', 'text!templates/patchOverview.html' ],
    function ($, _, Backbone, app, myTemplate) {
        "use strict";
        var exports = {};
        exports.Collection = Backbone.Collection.extend({
            model: Backbone.Model.extend({}),

            initialize: function () {
                this.show = 'api/patchData';
                this.filter = '?type=' + this.type;
                this.url = function () {
                    return this.show + this.filter;
                };
            }
        });
        exports.View = Backbone.View.extend({
            initialize: function () {
                var that = this;
                this.template = myTemplate;
                this.collection = new exports.Collection();

                this.collection.fetch({
                    success: function () { that.render(); }
                });
            },
            events: {

            },
            beforeRender: $.noop,
            onRender: $.noop,
            render: function () {
                if (this.beforeRender !== $.noop) { this.beforeRender(); }

                var tmpl = _.template(this.template);

                this.$el.empty();
                this.$el.append(tmpl({
                    models: this.collection.models,
                    type: this.collection.type
                }));
                if (this.onRender !== $.noop) { this.onRender(); }
                return this;
            },
            clearFilter: function () {
                this.collection.filter = '';
            }
        });
        return exports;
    }
);
