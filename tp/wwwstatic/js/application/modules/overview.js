define(
    ['jquery', 'underscore', 'backbone', 'app', './overviewDetail'],
    function ($, _, Backbone, app, Detail) {
        "use strict";
        var exports = {
            Collection: Backbone.Collection.extend({
                model: Detail.Model
                //url: 'test-ajax/overview.json'
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    var that = this;
                    this.collection =  new exports.Collection(
                        app.data.overviewData
                    );
                    that.render();
                },
                beforeRender: $.noop,
                onRender: function () {
                    var spanList = ['span12', 'span6', 'span4', 'span3', 'span2'];
                    this.$('dl').removeClass(spanList.join(' ')).addClass(spanList[this.collection.length - 1] || 'span2');
                },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var that = this;

                    this.$el.empty();
                    _.each(this.collection.models, function (item) {
                        that.renderDetail(item);
                    }, this);

                    // Demo Only Append
                    this.$el.append('<nav class="row-handle">&nbsp;</nav>');

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                renderDetail: function (item) {
                    var detail = new Detail.View({
                        model: item
                    });
                    this.$el.append(detail.render().el);
                }
            })
        };
        return exports;
    }
);
