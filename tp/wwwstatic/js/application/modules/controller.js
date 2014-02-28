define(
    ['jquery', 'underscore', 'backbone', 'text!templates/controller.html'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var Controller = {};
        Controller.Collection = Backbone.Collection.extend({
            baseUrl: 'api/nodes.json/',
            filter: '',
            url: function () {
                return this.baseUrl + this.filter;
            }
        });
        Controller.View = Backbone.View.extend({
            initialize: function () {
                this.template = myTemplate;
                this.collection = new Controller.Collection();
                this.listenTo(this.collection, 'sync', this.render);
                this.collection.fetch();
            },
            events: {

            },
            beforeRender: $.noop,
            onRender: $.noop,
            render: function () {
                if (this.beforeRender !== $.noop) { this.beforeRender(); }

                var tmpl = _.template(this.template),
                    data = this.collection.toJSON()[0];

                this.$el.empty();
                this.$el.html(tmpl({ data: data}));

                if (this.onRender !== $.noop) { this.onRender(); }
                return this;
            }
        });
        return Controller;
    }
);
