/**
 * Created with PyCharm.
 * User: parallels
 * Date: 1/4/13
 * Time: 12:03 PM
 * To change this template use File | Settings | File Templates.
 */
define(
    ['jquery', 'underscore', 'backbone', 'text!templates/modals/admin/vmware.html'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: '/api/vmware/config/list',
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
                    'submit form': 'submit'
                },
                submit: function (event) {
                    var $form = $(event.target),
                        that = this,
                        url = '/api/vmware/config/create',
                        $alert = this.$el.find('.alert'),
                        $hostInput = $form.find('input[name=vm_host]'),
                        $cycleInput = $form.find('select'),
                        $ssInput = $form.find('input[type=checkbox]'),
                        $userInput = $form.find('input[name=vm_user]'),
                        $passInput = $form.find('input[name=vm_password]');
                    if (!$hostInput.val() || !$userInput.val() || !$passInput.val()) {
                        if (!$hostInput.val()) { $hostInput.parents('.control-group').addClass('error'); } else { $hostInput.parents('.control-group').removeClass('error'); }
                        if (!$userInput.val()) { $userInput.parents('.control-group').addClass('error'); } else { $userInput.parents('.control-group').removeClass('error'); }
                        if (!$passInput.val()) { $passInput.parents('.control-group').addClass('error'); } else { $passInput.parents('.control-group').removeClass('error'); }
                        $alert.removeClass('alert-success').addClass('alert-error').html('Please fill the required fields.').show();
                        return false;
                    } else {
                        url += '?' + $hostInput.serialize() + '&' + $cycleInput.serialize();
                        url += '&' + $userInput.serialize() + '&' + $passInput.serialize();
                        url += '&' + $ssInput.attr('name') + '=' + $ssInput.prop('checked');
                        that.$el.find('.control-group').removeClass('error');
                    }
                    $alert.removeClass('alert-success alert-error').addClass('alert-info').html('Submitting...');
                    window.console.log(url);
                    $.post(url, function (json) {
                        window.console.log(json);
                        if (!json.pass) {
                            $alert.removeClass('alert-success alert-info').addClass('alert-error').html(json.message);
                        } else {
                            $alert.removeClass('alert-error alert-info').addClass('alert-success').html(json.message);
                        }
                        $alert.show();
                    });
                    return false;
                },
                beforeRender: $.noop,
                onRender: function () { this.$el.find('label').show(); },//$.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        data = this.collection.toJSON()[0];

                    this.$el.empty();

                    if (data) { this.$el.html(template({data: data})); }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
