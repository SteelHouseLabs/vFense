define(
    ['jquery', 'underscore', 'backbone', 'app', 'text!templates/widget.html' ],
    function ($, _, Backbone, app, myTemplate) {
        "use strict";
        var currentSpan = 0;
        return {
            Model: Backbone.Model.extend({
                defaults: {
                    span: 6,
                    showMenu: false,
                    menuItems: [
                        { name: 'Properties', href: '#properties'},
                        'divider',
                        { name: 'Close Widget', href: '#close'}
                    ],
                    content: {
                        header: 'Header',
                        body: 'Content',
                        footer: 'Footer'
                    }
                },
                validate: function (attrs) {
                    var out;

                    if (attrs.span < 1 || attrs.span > 12) {
                        out = "Unexpected span size. Expected: 1 <= span <=  12.";
                    }

                    return out;
                }
            }),
            View: Backbone.View.extend({
                tagName: 'article',
                className: 'widget',
                initialize: function () {
                    this.template = myTemplate;
                    this.listenTo(this.model, 'change:span', this.renderSpan);
                    this.listenTo(this.model, 'change:showMenu', this.render);

                    // Listen for app wide events
                    this.vent = app.vent;

                    this.listenTo(this.vent, 'edit:widgets', this.setEditable);
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var tmpl = _.template(this.template);

                    this.$el.empty();

                    this.$el.append(tmpl(this.model.toJSON()));

                    this.renderSpan();

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                renderSpan: function () {
                    var newSpan = this.model.get('span');
                    this.$el.toggleClass(
                        // Remove old span class
                        'span' + currentSpan,
                        false
                    ).toggleClass(
                        // Add new span class
                        'span' + this.model.get('span'),
                        true
                    );
                    currentSpan = newSpan;
                },
                setEditable: function (bool) {
                    if (_.isBoolean(bool)) {
                        this.model.set('showMenu', bool);
                        this.$el.toggleClass('editable', bool);
                    }
                }
            })
        };
    }
);
