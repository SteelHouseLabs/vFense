define(
    ['jquery', 'underscore', 'backbone', 'hallo'],
    function ($, _, Backbone) {
        'use strict';
        var exports = {};

        exports.name = 'richText';

        exports.models = {
            Main: Backbone.Model.extend({ defaults: { text: '<h3>Example Title</h3><div>Example Text</div>' } })
        };

        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () { _.bindAll(this); },
                render: function () {
                    this.$el.html(this.model.get('text'));
                    return this;
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                events: {},
                initialize: function () {
                    _.bindAll(this);
                    this.$el.on('hallomodified', this.updateModel);
                },
                render: function () {
                    var $el = this.$el,
                        options = {
                            plugins: {
                                'halloformat': {
                                    'formattings': {
                                        'bold': true,
                                        'italic': true,
                                        'strikeThrough': true,
                                        'underline': true
                                    }
                                },
                                'halloheadings': {},
                                'hallolists': {}
                            },
                            editable: true,
                            'blacklist': {tags: ['script']},
                            toolbar: 'halloToolbarFixed'
                        };
                    $el.html(this.model.get('text')).hallo(options);
                    return this;
                },
                updateModel: function () {
                    this.model.set('text', this.$el.html());
                    return this;
                }
            })
        };

        return exports;
    }
);
