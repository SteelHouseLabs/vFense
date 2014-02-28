define(
    ['jquery', 'underscore', 'backbone', 'crel', 'modals/panel'],
    function ($, _, Backbone, crel, Panel) {
        'use strict';
        var viewOptions = ['id', 'url', 'name', 'type', 'redirect', 'data'], exports = {};
        _.extend(exports, {
            View: Panel.View.extend({
                id: '',
                type: '',
                data: {},
                initialize: function (options) {
                    if (_.isObject(options)) {
                        _.extend(this, _.pick(options, viewOptions));
                    }
                    Panel.View.prototype.initialize.call(this);
                    this.setHeaderHTML(this.renderDeleteHeader())
                        .setContentHTML(this.renderDeleteContent());
                },
                events: function () {
                    return _.extend({
                        'click .close': 'close',
                        'keyup input':  'toggleDeleteDisable'
                    }, _.result(Panel.View.prototype, 'events'));
                },
                renderDeleteHeader: function () {
                    return crel('div', {class: 'row-fluid'},
                        crel('h4', {class: 'pull-left'}, 'Are you ABSOLUTELY sure?'),
                        crel('button', {type: 'button', class: 'close pull-right noMargin', 'aria-hidden': 'true'},
                            crel('i', {class: 'icon-remove'})
                        )
                    );
                },
                renderDeleteContent: function () {
                    return crel('div',
                        crel('p', 'This action ',
                            crel('strong', 'CANNOT'),
                            ' be undone. This will remove the ' + this.type + ' "',
                            crel('strong', this.name),
                            '" from the RemediationVault server and all of the associated data with it, including system information, tags, and packages permanently.'
                        ),
                        crel('p', {class: 'noMargin'}, 'Please type in ',
                            crel('strong', 'DELETE'),
                            ' to proceed.',
                            crel('input', {type: 'text', class: 'noMargin', style: 'height: 30px; width: 100%; box-sizing: border-box;'})
                        ),
                        crel('div', {style: 'margin-top: 5px', class: 'help-online'})
                    );
                },
                confirm: function () {
                    var $button = this.$('button.btn-danger'),
                        $message = this.$('div.help-online'),
                        that = this;
                    if (!$button.hasClass('disabled')) {
                        $.ajax({
                            url: that.url + that.id,
                            data: JSON.stringify(that.data),
                            type: 'DELETE',
                            contentType: 'application/json',
                            success: function (response) {
                                if (response.http_status === 200) {
                                    that.cancel();
                                    if (that.redirect === document.location.hash) {
                                        document.location.reload();
                                    } else if (that.redirect) {
                                        document.location.hash = that.redirect;
                                    }
                                } else {
                                    $message.addClass('alert-error').html(response.message);
                                }
                            },
                            error: function (response) {
                                $message.addClass('alert-error').html(response.responseJSON.message);
                            }
                        });
                    }
                    return this;
                },
                toggleDeleteDisable: function (event) {
                    var $input = $(event.currentTarget),
                        $button = this.$('button.btn-danger'),
                        value = $input.val();
                    if (value === 'DELETE') {
                        $button.removeClass('disabled');
                    } else {
                        if (!$button.hasClass('disabled')) {
                            $button.addClass('disabled');
                        }
                    }
                },
                span: '6',
                buttons: [
                    {
                        text: 'I understand and would like to delete this agent',
                        action: 'confirm',
                        style: 'width: 100%',
                        className: 'btn-danger disabled'
                    }
                ]
            })
        });
        return exports;
    }
);