define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'text!templates/modals/admin/groups.html'],
    function ($, _, Backbone, app, crel, myTemplate) {
        'use strict';
        var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: 'api/groups',
                params: {},
                url: function () {
                    return this.baseUrl + '?' + $.param(this.params);
                }
            }),
            PermissionCollection: Backbone.Collection.extend({
                url: 'api/permissions'
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.customerContext = app.user.toJSON().current_customer.name;
                    this.collection = new exports.Collection();
                    this.collection.params = {};
                    this.permissions = new exports.PermissionCollection();
                    this.listenTo(this.permissions, 'sync', this.render);
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();
                    this.permissions.fetch();
                },
                events: {
                    'click button[name=addGroup]':          'toggleAddGroup',
                    'click button[name=cancelNewGroup]':    'toggleAddGroup',
                    'click button[name=submitGroup]':       'submitGroup',
                    'click a.accordion-toggle':             'toggleAccordion',
                    'click button[name=toggleDelete]':      'toggleDelete',
                    'click button[name=deleteGroup]':       'deleteGroup',
                    'change input[name=userSelect]':        'toggleUser',
                    'click input[data-id=toggle]':          'togglePermission',
                    'change #customerContext':              'changeCustomerContext'
                },
                changeCustomerContext: function (event) {
                    this.collection.params.customer_context = this.customerContext = event.val;
                    this.collection.fetch();
                },
                toggleDelete: function (event) {
                    var $button = $(event.currentTarget),
                        $span = $button.siblings('span');
                    if ($span.length === 0) {
                        $span = $button.parent();
                        $button = $span.siblings('button');
                    }
                    $span.toggle();
                    $button.toggle();
                },
                deleteGroup: function (event) {
                    var $button = $(event.currentTarget),
                        groupId = $button.attr('value'),
                        url = 'api/groups/delete',
                        params = {
                            id: groupId,
                            customer_context: this.customerContext
                        },
                        that = this;
                    $.post(url, params, function (json) {
                        if (json.pass) {
                            that.collection.fetch();
                        }
                    });
                },
                toggleAddGroup: function () {
                    var $newGroupDiv = this.$el.find('#newGroupDiv');
                    $newGroupDiv.toggle();
                },
                submitGroup: function (event) {
                    var params, that = this,
                        $submitButton = $(event.currentTarget),
                        $alert = $submitButton.siblings('.alert'),
                        groupName = $submitButton.siblings('input').val(),
                        url = 'api/groups/create';
                    params = {
                        name: groupName,
                        customer_context: this.customerContext
                    };
                    $.post(url, params, function (json) {
                        if (json.pass) {
                            $alert.hide();
                            that.collection.fetch();
                        } else {
                            $alert.removeClass('alert-success').addClass('alert-error').show().html(json.message);
                        }
                    });
                },
                toggleAccordion: function (event) {
                    var $href = $(event.currentTarget),
                        $icon = $href.find('i'),
                        $parent = $href.parents('.accordion-group'),
                        $body = $parent.find('.accordion-body').first();
                    event.preventDefault();
                    $icon.toggleClass('icon-circle-arrow-down icon-circle-arrow-up');
                    $body.unbind().collapse('toggle');
                    $body.on('hidden', function (event) {
                        event.stopPropagation();
                    });
                },
                toggleUser: function (event) {
                    var url = 'api/groups/edit',
                        $input = $(event.currentTarget),
                        group = $input.data('group'),
                        $alert = this.$el.find('div.alert'),
                        params = {
                            id: group,
                            user: event.added ? event.added.id : event.removed.id
                        };
                    $.post(url, params, function (response) {
                        if (response.pass) {
                            $alert.hide();
                        } else {
                            $alert.removeClass('alert-success').addClass('alert-error').show().find('span').html(response.message);
                        }
                    }).error(function (e) { window.console.log(e.responseText); });
                },
                togglePermission: function (event) {
                    var $input = $(event.currentTarget),
                        $item = $input.parents('.accordion-group'),
                        $alert = this.$el.find('div.alert'),
                        url = 'api/groups/edit',
                        group = $item.data('id'),
                        params = {
                            id: group,
                            permission: $input.val(),
                            customer_context: this.customerContext
                        };
                    $.post(url, params, function (response) {
                        if (response.pass) {
                            $alert.hide();
                        } else {
                            $alert.removeClass('alert-success').addClass('alert-error').show().find('span').html(response.message);
                        }
                    });
                },
                beforeRender: $.noop,
                onRender: $.noop,
                initSelect: function () {
                    this.$el.find('label').show();
                    var $customers = this.$('select[name="customers"]');
                    $customers.select2({width: '100%'});
                },
                renderPermissions: function () {
                    var permissions = this.permissions.toJSON()[0],
                        $items = this.$el.find('.accordion-group');
                    if (permissions) {
                        $items.each(function (i, item) {
                            var $inner = $(item).find('.accordion-inner'),
                                groupName = $(item).data('name'),
                                $div = $(crel('div', {class: 'span12'}));
                            if (groupName !== 'Administrator') {
                                _.each(permissions.data, function (permission) {
                                    $div.append(
                                        crel('div', {class: 'span3 noMargin'},
                                            crel('label', {class: 'checkbox'},
                                                crel('small', permission),
                                                crel('input', {type: 'checkbox', value: permission, 'data-id': 'toggle'})
                                            )
                                        )
                                    );
                                });
                                $inner.prepend($div);
                            }
                        });
                        this.checkPermissions();
                    }
                },
                checkPermissions: function () {
                    var groups = this.collection.toJSON()[0],
                        that = this;
                    if (groups) {
                        _.each(groups.data, function (group) {
                            if (group.name !== 'Administrator') {
                                var permissions = group.permissions,
                                    $groupDiv = that.$el.find('div[data-id=' + group.id + ']');
                                _.each(permissions, function (permission) {
                                    var $input = $groupDiv.find('input[value=' + permission + ']');
                                    $input.prop('checked', true);
                                });
                            }
                        });
                    }
                },
                renderItems: function () {
                    var $items = this.$el.find('.items'),
                        fragment = document.createDocumentFragment(),
                        data = this.collection.toJSON()[0],
                        deleteButton;
                    if (data && data.pass) {
                        _.each(data.data, function (group) {
                            if (group.name === 'Administrator') {
                                deleteButton = '';
                            } else {
                                deleteButton = crel('button', {class: 'btn btn-link noMargin', name: 'toggleDelete'},
                                    crel('i', {class: 'icon-remove', style: 'color: red'})
                                );
                            }
                            fragment.appendChild(
                                crel('div', {class: 'accordion-group item clearfix', 'data-id': group.id, 'data-name': group.name},
                                    crel('div', {class: 'accordion-heading row-fluid'},
                                        crel('span', {class: 'span4'},
                                            crel('a', {class: 'accordion-toggle'},
                                                crel('i', {class: 'icon-circle-arrow-down'}), ' ' + group.name
                                            )
                                        ),
                                        crel('span', {class: 'pull-right'},
                                            deleteButton,
                                            crel('span', {class: 'hide'},
                                                crel('button', {class: 'btn btn-mini btn-danger', name: 'deleteGroup', value: group.id, 'data-groupname': group.name}, 'Delete'),
                                                crel('button', {class: 'btn btn-mini', name: 'toggleDelete'}, 'Cancel')
                                            )
                                        )
                                    ),
                                    crel('div', {class: 'accordion-body collapse'},
                                        crel('div', {class: 'accordion-inner'})
                                    )
                                )
                            );
                        });
                        $items.append(fragment);
                        this.initSelect();
                    }
                },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        data = this.collection.toJSON()[0],
                        customers = app.user.toJSON().customers, payload;

                    if (data && data.pass) {
                        payload = {
                            data: data.data,
                            customers: customers,
                            currentCustomer: this.customerContext,
                            viewHelpers: {
                                getOptions: function (options, selected) {
                                    var select = crel('select'), attributes;
                                    selected = selected || false;
                                    if (options.length) {
                                        _.each(options, function (option) {
                                            if (option.admin) {
                                                attributes = {value: option.id || option.name};
                                                if (selected && option.name === selected) {attributes.selected = selected;}
                                                select.appendChild(crel('option', attributes, option.name));
                                            }
                                        });
                                    }
                                    return select.innerHTML;
                                }
                            }
                        };
                        this.$el.empty();
                        this.$el.html(template(payload));
                        this.renderItems();
                        this.renderPermissions();
                    }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
