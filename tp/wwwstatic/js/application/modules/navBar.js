define(
    ['jquery', 'underscore', 'backbone', 'app', './navButton'],
    function ($, _, Backbone, app, navButton) {
        "use strict";
        var exports = {
            Collection: Backbone.Collection.extend({
                model: navButton.Model
            }),
            View: Backbone.View.extend({
                tagName: 'ul',
                className: 'nav',
                initialize: function () {
                    this.collection =  new exports.Collection(app.locations);
                    this.vent = app.vent;
                    this.listenTo(this.vent, 'navigation:#dashboard-view', this.setActive);
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var that = this;
                    this.$el.empty();
                    _.each(this.collection.models, function (item) {
                        that.renderButton(item);
                    }, this);

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                renderButton: function (item) {
                    var buttonView = new navButton.View({
                        model: item
                    });
                    this.$el.append(buttonView.render().el);
                },
                setActive: function (hrefTarget) {
                    // Optimization needed. See tabNavigation.js
                    _.each(this.collection.models, function (model) {
                        model.set('active', model.get('href') === hrefTarget);
                    });
                }
            })
        };
        return exports;
    }
);
