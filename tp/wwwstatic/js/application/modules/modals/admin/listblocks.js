/**
 * Created with PyCharm.
 * User: parallels
 * Date: 11/13/12
 * Time: 5:56 PM
 * To change this template use File | Settings | File Templates.
 */
define(
    ['jquery', 'underscore', 'backbone', 'text!templates/modals/admin/listblocks.html'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: 'api/timeblocker/list.json/',
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
                    'click input[name=timeblock]': 'disableTb'
                },
                disableTb: function (event) {
                    var $checkbox = $(event.currentTarget), params;
                    window.console.log($checkbox.is(':checked'));
                    params = {
                        tbid: $checkbox.val(),
                        toggle: $checkbox.is(':checked')
                    };
                    $.post('/api/timeblocker/toggle', params, function (json) {
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
