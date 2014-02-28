define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'text!templates/accountSettings.html', 'select2'],
    function ($, _, Backbone, app, crel, myTemplate) {
        "use strict";
        var exports = {
            View: Backbone.View.extend({
                initialize: function () {
                    this.listenTo(app.user, 'sync', this.render);
                    this.template = myTemplate;
                    return this;
                },
                events: {
                    'click button[data-id=options]': 'openOptions',
                    'submit form' :  'submit'
                },
                openOptions: function (event) {
                    event.preventDefault();
                    var $item = $(event.currentTarget).parents('.item'),
                        $content = $item.find('div[data-type=content], div[data-type=editor]');
                    $content.toggle();
                    return this;
                },
                submit: function (event) {
                    event.preventDefault();
                    var $form = $(event.currentTarget),
                        formId = $form.data('id'),
                        reset = $form.data('reset'),
                        $alert = $form.find('span[data-name=result]'),
                        $inputs = $form.find('[data-id=input]'),
                        url = 'api/users/edit',
                        params = {},
                        valid = true;
                    $inputs.each(function (index, input) {
                        var $control = $(this).parents('.control-group'),
                            $message = $control.find('span[data-name=message]');
                        if (input.value) {
                            params[input.name] = input.value;
                            $control.removeClass('error');
                            $message.html('');
                        } else {
                            $control.addClass('error');
                            $message.html(' Field can\'t be empty.');
                            valid = false;
                        }
                    });
                    if (formId === 'password') {
                        if (params['new_password'] !== params['confirmPassword']) {
                            valid = false;
                            $alert.removeClass('alert-info alert-success').addClass('alert-error').html(' Passwords don\'t match.');
                        }
                    }
                    if (valid) {
                        $alert.removeClass('alert-error alert-success').addClass('alert-info').html('Submitting...');
                        $.post(url, params, function (response) {
                            if (response.pass) {
                                if (reset) {
                                    app.user.fetch();
                                } else {
                                    $alert.removeClass('alert-error alert-info').addClass('alert-success').html(response.message);
                                    $form[0].reset();
                                }
                            } else {
                                $alert.removeClass('alert-info alert-success').addClass('alert-error').html(response.message);
                            }
                        });
                    }
                },
                capitaliseFirstLetter: function (string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                },
                render: function () {
                    var template = _.template(this.template),
                        user = app.user.toJSON(),
                        payload = {
                            user: user,
                            viewHelpers: {
                                displayBadges: function (permissions, badgeClass) {
                                    var div = crel('div');
                                    _.each(permissions, function (permission, i) {
                                        if (i % 6 === 0 && i !== 0) {
                                            div.appendChild(crel('br'));
                                        }
                                        div.appendChild(
                                            crel('span', {class: 'badge ' + badgeClass}, permission.name || permission)
                                        )
                                    });
                                    return div.innerHTML;
                                },
                                controlButtons: function (options) {
                                    var template = crel('div', crel('hr'));
                                    if (options && options.requirePass) {
                                        template.appendChild(
                                            crel('div', {class: 'control-group'},
                                                crel('label', {class: 'control-label'},
                                                    crel('strong', 'To save these settings, please enter your password. ')
                                                ),
                                                crel('div', {class: 'controls'},
                                                    crel('input', {type: 'password', name: 'password', 'data-id': 'input'}),
                                                    crel('span', {class: 'help-online', 'data-name': 'message'})
                                                )
                                            )
                                        )
                                    }
                                    $(template).append(
                                        crel('div', {class: 'control-group'},
                                            crel('div', {class: 'controls'},
                                                crel('button', {type: 'submit', class: 'btn btn-mini btn-primary'}, 'Save'), ' ',
                                                crel('button', {class: 'btn btn-mini btn-danger', 'data-id': 'options'}, 'Cancel'), ' ',
                                                crel('span', {class: 'alert', 'data-name': 'result'})
                                            )
                                        )
                                    );
                                    return template.innerHTML;
                                },
                                getOptions: function (options, selected) {
                                   var select = crel('select');
                                   if (options.length) {
                                       _.each(options, function (option) {
                                           var isSelected = option.name === selected ? true : false,
                                               properties = {value: option.name};
                                           if (isSelected) {
                                               properties.selected = 'selected';
                                           }
                                           select.appendChild(crel('option', properties, option.name));
                                       });
                                   }
                                   return select.innerHTML;
                                }
                            }
                        };
                    this.$el.empty().html(template(payload));
                    this.$el.find('select[name=default_customer_id]').select2({width: '100%'});

                    return this;
                }
            })
        };
        return exports;
    }
);
