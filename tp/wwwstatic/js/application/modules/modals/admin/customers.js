define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modals/delete'],
    function ($, _, Backbone, app, crel, DeleteModal) {
        'use strict';var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: '/api/customers',
                url: function () {
                    return this.baseUrl;
                },
                parse: function (response) {
                    return response.pass ? response.data : [];
                }
            }),
            View: Backbone.View.extend({
                tagName: 'article',
                className: 'row-fluid',
                initialize: function () {
                    var that = this;
                    this.collection = new exports.Collection();
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();
                },
                events: {
                    'click button[data-id=toggleCustomer]'  : 'toggleCustomerDiv',
                    'click button[data-id=submitCustomer]'  : 'submitCustomer',
                    'click button[data-id=toggleDelete]'    : 'toggleDelete'
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html(this.layout());
                    }
                    this.renderHeader();
                    this.renderList();

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                layout: function () {
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(
                        crel('section', {class: 'list'},
                            crel('header', {class: 'row-fluid clearfix', id: 'header'}),
                            crel('header', {class: 'row-fluid clearfix hide', id: 'toggleDiv'}),
                            crel('div', {class: 'items'})
                        )
                    );
                    return fragment;
                },
                toggleCustomerDiv: function () {
                    var $toggleDiv = this.$('#toggleDiv');
                    $toggleDiv.toggle();
                },
                submitCustomer: function () {
                    var customer = this.$('#customerInput').val(),
                        url = '/api/customers/create',
                        that = this,
                        params = {
                            name: customer
                        };
                    console.log(params);
                    $.post(url, params, function (json) {
                        console.log(json);
                        if (json.pass) {
                            app.vent.trigger('customer:change', null);
                            that.collection.fetch();
                        } else {
                            app.notifyOSD.createNotification('!', 'Error', json.message);
                        }
                    });
                },
                toggleDelete: function (event) {
                    var that = this,
                        DeletePanel = DeleteModal.View.extend({
                            confirm: that.deleteCustomer
                        });
                    if (this.deleteModal) {
                        this.deleteModal.close();
                        this.deleteModal = undefined;
                    }
                    this.deleteModal = new DeletePanel({
                        name: $(event.currentTarget).data('customer_name'),
                        type: 'customer'
                    }).open();
                },
                deleteCustomer: function () {
                    var $button = this.$('button.btn-danger'),
                        customer = this.name,
                        url = '/api/customers/delete',
                        that = this,
                        params = {
                            name: customer
                        };
                    if (!$button.hasClass('disabled')) {
                        $.post(url, params, function (json) {
                            console.log(json);
                            if (json.pass) {
                                app.vent.trigger('customer:change', null);
                                that.collection.fetch();
                            } else {
                                app.notifyOSD.createNotification('!', 'Error', json.message);
                            }
                        });
                    }
                },
                renderHeader: function () {
                    var $header = this.$('#header'),
                        $toggleDiv = this.$('#toggleDiv');
                    $header.empty();
                    $toggleDiv.empty();
                    $header.append(
                        crel('span', {class: 'pull-right'},
                            crel('button', {class: 'btn btn-mini', 'data-id': 'toggleCustomer'},
                                crel('i', {class : 'icon-plus', style: 'color: green'}),
                                crel('strong', ' Create Customer')
                            )
                        )
                    );
                    $toggleDiv.append(
                        crel('span',
                            crel('input', {type: 'text', placeholder: 'New Customer', id: 'customerInput'})
                        ),
                        crel('span', {class: 'pull-right'},
                            crel('button', {class: 'btn btn-mini btn-danger', 'data-id': 'toggleCustomer'}, 'Cancel'),  ' ',
                            crel('button', {class: 'btn btn-mini btn-primary', 'data-id': 'submitCustomer'}, 'Submit')
                        )
                    );
                },
                renderList: function () {
                    var $list = this.$('.items'),
                        data = this.collection.toJSON();
                    $list.empty();
                    if (data.length) {
                        _.each(data, function (item) {
                            $list.append(
                                crel('div', {class: 'item row-fluid'}, item.name,
                                    crel('span', {class: 'pull-right'},
                                        crel('button', {class: 'btn btn-link noPadding', 'data-id': 'toggleDelete', 'data-customer_name': item.name},
                                            crel('i', {class: 'icon-remove', style: 'color: red'})
                                        ),
                                        crel('button', {class: 'btn btn-mini btn-danger hide', 'data-id': 'deleteCustomer'}, 'Delete'), ' ',
                                        crel('button', {class: 'btn btn-mini hide', 'data-id': 'toggleDelete'}, 'Cancel')
                                    )
                                )
                            );
                        });
                    } else {
                        $list.append(
                            crel('div', {class: 'item row-fluid'}, 'No Customers Available')
                        );
                    }
                }
            })
        };
        return exports;
    }
);
