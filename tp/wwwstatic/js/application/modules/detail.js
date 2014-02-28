define(
    ['jquery', 'underscore', 'backbone', 'text!templates/detail.html'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var Detail = { };
        Detail.Collection = Backbone.Collection.extend({
            baseUrl: 'api/nodes.json/',
            filter: '',
            id: 1,
            inputArray: [],
            url: function () {
                if (this.id) {
                    this.filter = '?id=' + this.id;
                }
                return this.baseUrl + this.filter;
            },
            initialize: function () {
                if (this.checked) {
                    this.inputArray = this.checked;
                }
            }
        });
        Detail.View = Backbone.View.extend({
            initialize: function () {
                this.template = myTemplate;
                this.collection = new Detail.Collection();
                this.listenTo(this.collection, 'sync', this.render);
                this.collection.fetch();
            },
            beforeRender: $.noop,
            onRender: $.noop,
            render: function () {
                if (this.beforeRender !== $.noop) { this.beforeRender(); }

                var tmpl = _.template(this.template),
                    data = this.collection.toJSON()[0];

                this.$el.empty();
                this.$el.html(tmpl({data: data, checked: this.collection.inputArray}));

                if (this.onRender !== $.noop) { this.onRender(); }
                return this;
            }
        });

        return Detail;
    }
);
