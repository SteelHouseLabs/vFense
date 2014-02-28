define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'text!templates/customerDropdown.html'],
    function ($, _, Backbone, app, crel, myTemplate) {
        'use strict';
        var exports = {
            View: Backbone.View.extend({
                className: 'dropdown',
                tagName: 'li',
                initialize: function () {
                    this.template = myTemplate;
                    this.current = {
                        id: '',
                        name: ''
                    };
                    this.listenTo(app.vent, 'customer:change', this.refreshCustomers);
                    this.listenTo(app.user, 'sync', this.render);
                },
                refreshCustomers: function (activeCustomer) {
                    var currentCustomer = activeCustomer || null,
                        $customer = this.$el.find('#activeCustomer');
                    if (currentCustomer) {
                        $customer.html(activeCustomer);
                        this.current.name = activeCustomer;
                    }
                    app.user.fetch();
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        data = app.user.toJSON();
                    _.extend(data, {
                        viewHelpers: {
                            renderCustomers: function (customers, currentCustomer) {
                                var fragment = crel('div');
                                _.each(customers, function (customer) {
                                    if (customer.name !== currentCustomer) {
                                        fragment.appendChild(
                                            crel('li',
                                                crel('a', {href: '#customer/' + customer.name}, customer.name)
                                            )
                                        );
                                    }
                                });
                                return fragment.innerHTML;
                            }
                        }
                    });

                    if (app.user.apiPass) {
                        this.$el.empty();
                        this.$el.html(template(data));
                    }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
