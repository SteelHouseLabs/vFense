define(
    ['jquery', 'underscore', 'backbone', 'h5f', 'text!templates/modals/admin/remoteSettings.html'],
    function ($, _, Backbone, h5f, myTemplate) {
        'use strict';
        var exports = {
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.render();
                },
                events: {
                    'click #validateForm': 'validateForm'
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template);

                    this.$el.empty().html(template());

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                validateForm: function (event) {
                    var password = document.getElementById('password'),
                        cpassword = document.getElementById('cpassword'),
                        form = document.getElementById('passwordForm');
                    if (password.value !== cpassword.value) {
                        cpassword.setCustomValidity('Passwords don\'t match');
                    } else {
                        cpassword.setCustomValidity('');
                    }
                    if (form.checkValidity()) {
                        this.changePassword(event, password.value);
                    }
                    return this;
                },
                resetForm: function () {
                    var form = this.$('form')[0];
                    form.reset();
                },
                changePassword: function (event, password) {
                    event.preventDefault();
                    var url = 'api/ra/rd/password',
                        params = JSON.stringify({password: password}),
                        $message = this.$('span.help-online'),
                        that = this;
                    $message.addClass('alert-info').html('Submitting...');
                    $.post(url, params, function (response) {
                        if (response.pass) {
                            $message.removeClass('alert-info alert-error').addClass('alert-success').html('Password changed.').show();
                            that.resetForm();
                        } else {
                            $message.removeClass('alert-success alert-info').addClass('alert-error').html(response.message).show();
                        }
                    });
                    return this;
                }
            })
        };
        return exports;
    }
);
