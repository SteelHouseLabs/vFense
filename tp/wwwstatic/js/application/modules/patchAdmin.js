define(
    ['jquery', 'underscore', 'backbone', 'app', 'text!templates/patchAdmin.html'],
    function ($, _, Backbone, app, myTemplate) {
        "use strict";
        var exports = {};
        exports.Collection = Backbone.Collection.extend({
            model: Backbone.Model.extend({}),
            initialize: function () {
                this.show = 'api/nodes.json';
                this.filter = '';
                this.url = function () {
                    return this.show + this.filter;
                };
                this.comparator = function (model) {};
            }
        });
        exports.View = Backbone.View.extend({
            initialize: function () {
                var that = this;
                this.template = myTemplate;
                this.collection = new exports.Collection();

                this.listenTo(this.collection, 'all', function (e) { console.log(e); });

                this.collection.fetch({
                    success: function () { that.render(); }
                });
            },
            events: {
                'click a[data-show]': 'setOrder'
            },
            beforeRender: $.noop,
            onRender: $.noop,
            render: function () {
                if (this.beforeRender !== $.noop) { this.beforeRender(); }

                var tmpl = _.template(this.template),
                    that = this;

                this.$el.empty();
                this.$el.append(tmpl({
                    show: this.collection.show,
                    filter: this.collection.filter,
                    length: this.collection.length,
                    models: this.collection.models
                }));

                if (this.onRender !== $.noop) { this.onRender(); }
                return this;
            },
            renderModel: function (item) {},
            setOrder: function (e) {
                var that = this;
                e.stopImmediatePropagation();
                this.collection.show = e.target.getAttribute('data-show');
                this.collection.fetch({
                    success: function () { that.render(); }
                });
            },
            setFilter: function (e) {

            },
            clearFilter: function () {
                this.collection.filter = '';
            }
        });
        return exports;
    }
);
