/**
 * Created with PyCharm.
 * User: parallels
 * Date: 2/6/13
 * Time: 4:47 PM
 * To change this template use File | Settings | File Templates.
 */
define(
    ['jquery', 'underscore', 'backbone', 'text!templates/modals/admin/email.html'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: 'api/email/config/list',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.collection = new exports.Collection();
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();
                },
                events: {
                    'click button[name=submitEmail]': 'submit'
                },
                submit: function (event) {
                    var $inputs = this.$el.find('input'),
                        $alert = this.$el.find('.alert'),
                        url = 'api/email/config/create',
                        invalid = false,
                        params = {};
                    $inputs.each(function () {
                        if (this.value) {
                            $(this).parents('.control-group').removeClass('error');
                            params[this.name] = this.type === 'checkbox' ? this.checked : this.value;
                        } else {
                            $(this).parents('.control-group').addClass('error');
                            invalid = true;
                        }
                    });
                    if (invalid) {
                        $alert.removeClass('alert-success alert-info').addClass('alert-error').html('Please fill the required fields.').show();
                        return false;
                    }
                    $alert.removeClass('alert-success alert-error').addClass('alert-info').html('Submitting...');
                    window.console.log(params);
                    $.post(url, params, function (json) {
                        window.console.log(json);
                        if (json.pass) {
                            $alert.removeClass('alert-error alert-info').addClass('alert-success').html(json.message);
                        } else {
                            $alert.removeClass('alert-success alert-info').addClass('alert-error').html(json.message);
                        }
                        $alert.show();
                    });
                },
                beforeRender: $.noop,
                onRender: function () { this.$el.find('label').show(); },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        data = this.collection.toJSON()[0];

                    this.$el.empty();

                    this.$el.html(template({data: data}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
