define(
    ['jquery', 'underscore', 'backbone'],
    function ($, _, Backbone) {
        'use strict';

        _.extend(Backbone.View.prototype, {
            addSubViews: function () {
                if (!_.isArray(this.subViews)) {
                    this.subViews = [];
                }
                Array.prototype.push.apply(this.subViews, arguments);
                return this;
            },
            // Zombie Prevention Part 1
            // Add close function to Backbone.View to prevent "Zombies"
            // Inspired by: Derick Bailey
            // See: http://bit.ly/odAfKo
            close: function () {
                if (this.__closing) { return this; }
                this.__closing = true;
                if (this.beforeClose && _.isFunction(this.beforeClose)) {
                    this.beforeClose();
                }
                if (_.isArray(this.subViews)) {
                    _.each(this.subViews, function (subView) {
                        if (_.isFunction(subView.close)) {
                            subView.close();
                        }
                    });
                }
                this.remove();
                this.unbind();
                this.__closing = false;
                return this;
            }
        });

        // Zombie Prevention Part 2
        // Object to manage transitions between views
        // Inspired by: Derick Bailey
        // See: http://bit.ly/odAfKo
        return function (options) {
            var that = this,
                allowed = ['selector'],
                extender,
                finish,
                lastSelect;
            that.selector = 'body';
            that.$selector = undefined;
            that.set = function (opts) { extender(opts); finish(); };
            that.get = function (name) { return that[name]; };
            that.showView = function (view) {
                if (this.currentView) {
                    this.currentView.close();
                }
                that.$selector.html(view.render().el);
                this.currentView = view;
                return view;
            };

            // Self invoking function that extends this object
            // with options passed to the constructor
            extender = (function (opts) {
                _.extend(that, _.pick(opts, allowed));
            }(options));

            // Self invoking function for final set up
            // - Set '$selector' based on 'selector'
            finish = (function () {
                if ($.type(that.selector) === 'string' && that.selector !== lastSelect) {
                    that.$selector = $(that.selector);
                    lastSelect = that.selector;
                }
            }());
        };
    }
);
