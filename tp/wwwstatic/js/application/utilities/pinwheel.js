define(
    ['jquery', 'underscore', 'backbone', 'crel'],
    function ($, _, Backbone, crel) {
        'use strict';
        return {
            View: Backbone.View.extend({
                className: 'pinwheel',
                initialize: function () { this.render(); },
                render: function () {
                    if (!this.$pinwheel) {
                        if (Modernizr.cssanimations) {
                            this.$pinwheel = crel('div', {class: 'pinwheel animated infinite linear spin'},
                                crel('div', {class: 'pinwheel animated infinite linear spin reverse doubleTime'},
                                    String.fromCharCode(160)
                                )
                            );
                        } else {
                            // Non-animated fallback
                            this.$pinwheel = 'Loading ...';
                        }
                    }
                    this.$el.html(this.$pinwheel);
                    return this;
                }
            })
        };
    }
);
