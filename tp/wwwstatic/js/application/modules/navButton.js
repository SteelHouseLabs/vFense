define(
    ['jquery', 'underscore', 'backbone', 'text!templates/navButton.html'],
    function ($, _, Backbone, buttonTemplate) {
        "use strict";
        return {
            Model: Backbone.Model.extend({
                defaults: {
                    active: false
                }
            }),
            View: Backbone.View.extend({
                tagName: "li",
                className: "",
                template: buttonTemplate,
                initialize: function () {
                    this.listenTo(this.model, 'change:active', this.setActive);
                },
                render: function () {
                    var tmpl = _.template(this.template);
                    $(this.el).html(tmpl(this.model.toJSON())).toggleClass('active', this.model.get('active'));
                    return this;
                },
                setActive: function () {
                    $(this.el).toggleClass('active', this.model.get('active'));
                }
            })
        };
    }
);
