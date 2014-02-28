define(
    ['jquery', 'underscore', 'backbone', 'app', 'text!templates/pageFooter.html'],
    function ($, _, Backbone, app, footerTemplate) {
        "use strict";
        var PageFooter = {};
        PageFooter.View = Backbone.View.extend({
            tagName: 'footer',
            id: 'pageFooter',
            template: footerTemplate,
            initialize: function () {
                this.model = app.user;
            },
            render: function () {
                var tmpl = _.template(this.template);
                this.$el.html(tmpl(this.model.toJSON()));
                return this;
            }
        });
        return PageFooter;
    }
);
