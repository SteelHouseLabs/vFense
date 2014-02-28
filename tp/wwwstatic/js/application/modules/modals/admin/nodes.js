define(
    ['jquery', 'underscore', 'backbone', 'text!templates/modals/admin/approveNodes.html'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var exports = {
            Collection : Backbone.Collection.extend({
                baseUrl: 'api/ssl/list.json/',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.collection = new exports.Collection();
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();
                },
                events: {
                    'click input:checkbox[name=csr]': 'toggleApprove'
                },
                toggleApprove: function (event) {
                    var $checkbox = $(event.currentTarget),
                        node_id = $checkbox.val(),
                        toggle = $checkbox.is(':checked');
                    $.post('api/ssl/nodeToggler', {nodeid: node_id, toggle: toggle}, function (json) {
                        window.console.log(json);
                    });
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        data = this.collection.toJSON();

                    this.$el.empty();

                    this.$el.html(template({data: data}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
