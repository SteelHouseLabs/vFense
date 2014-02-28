define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'h5f', 'text!templates/modals/admin/users.html', 'select2'],
    function ($, _, Backbone, app, crel, h5f, myTemplate) {
        'use strict';
        var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: 'api/users',
                params: {},
                url: function () {
                    return this.baseUrl + '?' + $.param(this.params);
                }
            }),
            GroupCollection: Backbone.Collection.extend({
                baseUrl: 'api/groups',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.customerContext = app.user.toJSON().current_customer.name;
                    this.collection = new exports.Collection();
                    this.collection.params = {};
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();

                    this.groupCollection = new exports.GroupCollection();
                    this.listenTo(this.groupCollection, 'sync', this.render);
                    this.groupCollection.fetch();

                    $.ajaxSetup({traditional: true});
                },
                events: {
                    'click button[name=toggleAcl]':     'toggleAclAccordion',
                    'click button[name=toggleDelete]':  'confirmDelete',
                    'change input[name=groupSelect]':   'toggle',
                    'change input[name=customerSelect]':'toggle',
                    'click button[name=deleteUser]':    'deleteUser',
                    'click #cancelNewUser':             'displayAddUser',
                    'click #submitUser':                'verifyForm',
                    'click #addUser':                   'displayAddUser',
                    'change #customerContext':          'changeCustomerContext',
                    'submit form':                      'submit'
                },
                changeCustomerContext: function (event) {
                    this.collection.params.customer_context = this.customerContext = event.val;
                    this.collection.fetch();
                },
                toggleAclAccordion: function (event) {
                    var $href = $(event.currentTarget),
                        $icon = $href.find('i'),
                        $accordionParent = $href.parents('.accordion-group'),
                        $accordionBody = $accordionParent.find('.accordion-body').first();
                    $icon.toggleClass('icon-circle-arrow-down icon-circle-arrow-up');
                    $accordionBody.unbind().collapse('toggle');
                    $accordionBody.on('hidden', function (event) {
                        event.stopPropagation();
                    });
                },
                displayAddUser: function (event) {
                    event.preventDefault();
                    var $addUserDiv = this.$('#newUserDiv');
                    $addUserDiv.toggle();
                },
                confirmDelete: function (event) {
                    var $parentDiv = $(event.currentTarget).parent();
                    $parentDiv.children().toggle();
                },
                deleteUser: function (event) {
                    var $deleteButton = $(event.currentTarget),
                        $userRow = $deleteButton.parents('.item'),
                        $alert = this.$el.find('div.alert'),
                        user = $deleteButton.val(),
                        params = {
                            username: user
                        };
                    $.post('api/users/delete', params, function (json) {
                        if (json.pass) {
                            $userRow.remove();
                            $alert.removeClass('alert-error').addClass('alert-success').show().find('span').html(json.message);
                        } else {
                            $alert.removeClass('alert-success').addClass('alert-error').show().find('span').html(json.message);
                        }
                    });
                },
                verifyForm: function (event) {
                    var form = document.getElementById('newUserDiv');
                    if (form.checkValidity()) {
                        this.submitNewUser(event);
                    }
                },
                submitNewUser: function (event) {
                    event.preventDefault();
                    var fullName = this.$el.find('#fullname').val(),
                        email = this.$el.find('#email').val(),
                        username = this.$el.find('#username').val(),
                        password = this.$el.find('#password').val(),
                        group = this.$el.find('select[name=groups]').val(),
                        customers = this.$el.find('select[name=customers]').val(),
                        $alert = this.$('#newUserDiv').find('.help-online'),
                        params = {
                            fullname: fullName,
                            email: email,
                            username: username,
                            password: password
                        },
                        that = this;
                    if (group && group.length) {
                        params.group_id = group;
                    }
                    if (customers && customers.length) {
                        params.customer_id = customers;
                    }
                    $.post('/api/users/create', params, function (json) {
                        if (json.pass) {
                            that.collection.fetch();
                        } else {
                            $alert.removeClass('alert-success').addClass('alert-error').html(json.message).show();
                        }
                    }).error(function (e) { window.console.log(e.statusText); });
                },
                toggle: function (event) {
                    var $input = $(event.currentTarget),
                        user = $input.data('user'),
                        url = $input.data('url') + '/edit',
                        $alert = this.$el.find('div.alert'),
                        params = {
                            user: user,
                            name: event.added ? event.added.text : event.removed.text,
                            customer_context: this.customerContext
                        };
                    $.post(url, params, function (response) {
                        if (response.pass) {
                            $alert.hide();
                        } else {
                            $alert.removeClass('alert-success').addClass('alert-error').show().find('span').html(response.message);
                        }
                    }).error(function (e) { window.console.log(e.responseText); });
                },
                beforeRender: $.noop,
                onRender: function () {
                    var $groups = this.$('select[name="groups"]'),
                        $customers = this.$('select[name="customers"]'),
                        $select = this.$el.find('input[name=groupSelect], input[name=customerSelect]'),
                        that = this;
                    $groups.select2({width: '100%'});
                    $customers.select2({width: '100%'});
                    $select.select2({
                        width: '100%',
                        multiple: true,
                        initSelection: function (element, callback) {
                            var data = JSON.parse(element.val()),
                                results = [];
                            _.each(data, function (object) {
                                results.push({id: object.id || object.name, text: object.name});
                            });
                            callback(results);
                        },
                        ajax: {
                            url: function () {
                                return $(this).data('url');
                            },
                            data: function () {
                                return {
                                    customer_context: that.customerContext
                                };
                            },
                            results: function (data) {
                                var results = [];
                                if (data.pass) {
                                    _.each(data.data, function (object) {
                                        results.push({id: object.id || object.name, text: object.name});
                                    });
                                    return {results: results, more: false, context: results};
                                }
                            }
                        }
                    });
                },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        data = this.collection.toJSON()[0],
                        groups = this.groupCollection.toJSON()[0],
                        customers = app.user.toJSON(),
                        payload;
                    if (data && data.pass && groups && groups.pass) {
                        payload = {
                            data: data.data,
                            groups: groups.data,
                            customers: customers.customers,
                            currentCustomer: this.customerContext,
                            viewHelpers: {
                                getOptions: function (options, selected) {
                                    var select = crel('select'), attributes;
                                    selected = selected || false;
                                    if (options.length) {
                                        _.each(options, function (option) {
                                            if (_.isUndefined(option.admin) || option.admin) {
                                                attributes = {value: option.id || option.name};
                                                if (selected && option.name === selected) {attributes.selected = selected;}
                                                select.appendChild(crel('option', attributes, option.name));
                                            }
                                        });
                                    }
                                    return select.innerHTML;
                                },
                                renderDeleteButton: function (user) {
                                    var fragment;
                                    if (user.username !== 'admin') {
                                        fragment = crel('div');
                                        fragment.appendChild(
                                            crel('button', {class: 'btn btn-link noPadding', name: 'toggleDelete'},
                                                crel('i', {class: 'icon-remove', style: 'color: red'}))
                                        );
                                        return fragment.innerHTML;
                                    }
                                },
                                renderUserLink: function (user) {
                                    var fragment = crel('div');
                                    if (user.username !== 'admin') {
                                        fragment.appendChild(
                                            crel('button', {name: 'toggleAcl', class: 'btn btn-link noPadding'},
                                                crel('i', {class: 'icon-circle-arrow-down'}, ' '),
                                                crel('span', user.username)
                                            )
                                        );
                                    } else {
                                        fragment.appendChild(
                                            crel('strong', user.username)
                                        );
                                    }
                                    return fragment.innerHTML;
                                }
                            }
                        };
                        this.$el.empty();
                        this.$el.html(template(payload));

                        if (this.onRender !== $.noop) { this.onRender(); }
                    }
                    return this;
                }
            })
        };
        return exports;
    }
);
