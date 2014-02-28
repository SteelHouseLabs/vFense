define(
    ['jquery', 'underscore', 'backbone'],
    function ($, _, Backbone) {
        'use strict';
        var exports = {};

        exports.name = 'plainText';

        exports.models = {
            Main: Backbone.Model.extend({ defaults: { text: '' } })
        };

        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () { _.bindAll(this); },
                render: function () {
                    this.$el.text(this.model.get('text'));
                    return this;
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'textarea',
                className: [exports.name, 'settings'].join(' '), //TODO: width/height 100%, padding 0
                events: {
                    'keyup': 'updateModel',
                    'change' : 'updateModel'
                },
                initialize: function () { _.bindAll(this); },
                render: function () {
                    this.$el.val(this.model.get('text'));
                    return this;
                },
                updateModel: function () {
                    this.model.set('text', this.$el.val());
                    return this;
                }
            })
        };
        return exports;
    }
);