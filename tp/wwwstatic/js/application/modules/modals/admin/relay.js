define(
    ['jquery', 'underscore', 'backbone', 'app', 'modules/lists/pageable', 'text!templates/modals/admin/relay.html', 'h5f', 'select2'],
    function ($, _, Backbone, app, Pager, myTemplate) {
        'use strict';
        var RelayServer, exports = {};
        RelayServer = Pager.View.extend({
            showHeader: true,
            showLegend: true,
            layoutHeader: function ($left, $right) {
                var template = _.template(this.template);
                $right.append(template({model: false, legend: false, header: true}));
                return this;
            },
            layoutLegend: function ($legend) {
                var template = _.template(this.template);
                $legend.html(template({model: false, legend: true, header: false}));
                return this;
            },
            renderModel: function (model) {
                var template = _.template(this.template);
                return template({model:model, legend: false, header: false});
            } ,
            initialize: function (options) {
                this.template = myTemplate;
                Pager.View.prototype.initialize.call(this, options);
            }
        });
        _.extend(exports, {
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.relay = {};
                    this.pager = new RelayServer({
                        collection: new (Pager.Collection.extend({
                            baseUrl: 'api/v1/relay'
                        }))()
                    });
                    this.listenTo(this.pager.collection, 'sync', this.renderList);
                    this.render();
                },
                events: {
                    'click button[data-action=toggleDelete]': 'toggleDelete',
                    'click button[data-action=delete]'      : 'deleteRelay',
                    'click button[data-action=modify]'      : 'showUpdateRelay',
                    'click #showCreateRelay'                : 'showCreateRelay',
                    'click #hideCreateRelay'                : 'renderList',
                    'submit form'                           : 'createRelay'
                },
                render: function () {
                    this.pager.render();
                },
                toggleDelete: function (event) {
                    var $button = $(event.currentTarget),
                        $span = $button.siblings('span');
                    if (!$span.length) {
                        $span = $button.parent();
                        $button = $span.siblings('button[data-action=toggleDelete]');
                    }
                    $span.toggle();
                    $button.toggle();
                },
                deleteRelay: function (event) {
                    var relayName = $(event.currentTarget).data('name'),
                        url = 'api/v1/relay/' + relayName,
                        that = this;
                    $.ajax({
                        url: url,
                        type: 'DELETE',
                        contentType: 'application/json',
                        success: function (response) {
                            if (response.http_status === 200) {
                                that.pager.render();
                            } else {
                                app.notifyOSD.createNotification('!', 'Error', response.message);
                            }
                        }
                    });
                },
                showUpdateRelay: function (event) {
                    this.relay = this.pager.collection.findWhere({relay_name: $(event.currentTarget).data('name')});
                    this.showCreateRelay();
                },
                showCreateRelay: function () {
                    var template = _.template(this.template),
                        options = {model: false, legend: false, header: false, relay: this.relay.toJSON ? this.relay.toJSON() : this.relay};
                    this.$el.html(template(options));
                    this.$('input[name="customers"]').select2({
                        width: '100%',
                        multiple: true,
                        placeholder: 'Select customers',
                        initSelection: function (element, callback) {
                            var customers = element.val().split(','),
                                results = [];
                            _.each(customers, function (customer) {
                                results.push({id: customer, text: customer});
                            });
                            callback(results);
                        },
                        ajax: {
                            url: '/api/customers',
                            data: function (input) {
                                return {query: input};
                            },
                            results: function (response) {
                                var results = [];
                                if (response.pass) {
                                    _.each(response.data, function (customer) {
                                        results.push({id: customer.name, text: customer.name});
                                    });
                                    return {results: results, more: false, context: results};
                                }
                            }
                        }
                    });
                    return this;
                },
                renderList: function (event) {
                    if (event.preventDefault) { event.preventDefault(); }
                    this.relay = {};
                    this.$el.html(this.pager.$el);
                    return this;
                },
                createRelay: function (event) {
                    var that = this,
                        $form = this.$('form'),
                        $customers = $form.find('input[name="customers"]'),
                        $name = $form.find('input[name="name"]'),
                        url = 'api/v1/relay',
                        type = 'POST',
                        params = {
                            name: $name.val(),
                            address: $form.find('input[name="address"]').val(),
                            customers: $customers.select2('val')
                        };
                    event.preventDefault();
                    if (params.customers.length) {
                        if ($name.is(':disabled')) {
                            url += '/' + params.name;
                            delete params.name;
                            type = 'PUT';
                        }
                        $customers.parents('.control-group').removeClass('error');
                        $.ajax({
                            url: url,
                            contentType: 'application/json',
                            type: type,
                            data: JSON.stringify(params),
                            success: function (response) {
                                if (response.http_status === 200) {
                                    that.pager.render();
                                    app.notifyOSD.createNotification('', 'Success', 'Relay Server Added');
                                } else {
                                    app.notifyOSD.createNotification('', 'Error', response.message);
                                }
                            },
                            error: function (response) {
                                app.notifyOSD.createNotification('', 'Error', response.responseText);
                            }
                        });
                    } else {
                        $customers.parents('.control-group').addClass('error');
                    }
                }
            })
        });
        return exports;
    }
);
