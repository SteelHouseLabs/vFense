define(
    ['jquery', 'underscore', 'backbone', './tabButton'],
    function ($, _, Backbone, button) {
        "use strict";
        var exports = {};

        exports.Collection = Backbone.Collection.extend({
            model: button.Model
        });

        exports.View = Backbone.View.extend({
            tagName: 'ul',
            className: 'nav nav-tabs',
            stacked: false,

            initialize: function (args) {
                _.extend(this, args);
                this.collection = new exports.Collection(this.tabs);
                this.$el.toggleClass('nav-stacked', this.stacked);
                this.lastTarget = '';
            },

            beforeRender: $.noop,
            onRender: $.noop,
            render: function () {
                if (this.beforeRender !== $.noop) { this.beforeRender(); }

                var $el = this.$el,
                    that = this;

                $el.empty();

                _.each(this.collection.models, function (model) {
                    that.renderTab(model);
                }, this);

                this.delegateEvents();

                if (this.onRender !== $.noop) { this.onRender(); }
                return this;
            },

            renderTab: function (model) {
                if (!(model.get('view') instanceof Backbone.View)) {
                    // Circular reference.
                    // Need to remove.
                    // Potential memory leak.
                    // See tabButton.js
                    model.set('view', new button.View({
                        model: model
                    }));
                }

                this.$el.append(model.get('view').render().el);

                return this;
            },

            setActive: function (hrefTarget) {
                if (this.lastTarget !== hrefTarget) {
                    this.lastTarget = hrefTarget;

                    var that = this,
                        affectIndex = _.difference(
                            _.reduce(this.collection.models, function (memo, val, key) {
                                if (val.get('active')) {
                                    memo.push(key);
                                }
                                if (val.get('href') === hrefTarget) {
                                    memo.push(key);
                                }
                                return memo;
                            }, []),
                            this.collection.models
                        );

                    _.each(affectIndex, function (key) {
                        var model = that.collection.models[key];
                        model.set('active', model.get('href') === hrefTarget);
                    });
                }
                return this;
            }
        });

        return exports;
    }
);
