define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modals/panel', 'modals/delete'],
    function ($, _, Backbone, app, crel, Panel, DeletePanel) {
        'use strict';
        var exports = {},
            helpers = {};
        _.extend(helpers, {
            getAgentName: function (model) {
                return model.get('display_name') ||
                    model.get('host_name') ||
                    model.get('computer_name');
            },
            getAgentStatus: function (model) {
                var agentStatus = model.get('agent_status'),
                    needsReboot = model.get('needs_reboot'),
                    status = crel('span');
                if (needsReboot === 'yes') {
                    $(status).append(crel('i', {class: 'icon-warning-sign', style: 'color: orange'}), ' Needs Reboot');
                } else if (agentStatus === 'down') {
                    $(status).append(crel('i', {class: 'icon-warning-sign', style: 'color: red'}), ' Agent Down');
                } else {
                    $(status).append(crel('i', {class: 'icon-ok', style: 'color: green'}), ' Agent Running');
                }
                return status;
            },
            getIconOS: function (osname) {
                var osClass = '';
                if (osname.indexOf('CentOS') !== -1 || osname.indexOf('centos') !== -1) {
                    osClass = 'icon-lin-centos';
                } else if (osname.indexOf('Ubuntu') !== -1 || osname.indexOf('ubuntu') !== -1) {
                    osClass = 'icon-lin-ubuntu';
                } else if (osname.indexOf('Fedora') !== -1 || osname.indexOf('fedora') !== -1) {
                    osClass = 'icon-lin-fedora';
                } else if (osname.indexOf('Debian') !== -1 || osname.indexOf('debian') !== -1) {
                    osClass = 'icon-lin-debian';
                } else if (osname.indexOf('Red Hat') !== -1 || osname.indexOf('red hat') !== -1) {
                    osClass = 'icon-lin-redhat';
                } else if (osname.indexOf('OS X') !== -1 || osname.indexOf('os x') !== -1) {
                    osClass = 'icon-os-apple';
                } else if (osname.indexOf('Linux') !== -1 || osname.indexOf('linux') !== -1) {
                    osClass = 'icon-os-linux_1_';
                } else if (osname.indexOf('Windows') !== -1 || osname.indexOf('windows') !== -1) {
                    osClass = 'icon-os-win-03';
                } else {
                    osClass = 'icon-laptop';
                }
                return osClass;
            },
            agentCall: function (url, params, action, panel) {
                $.ajax({
                    url: url,
                    type: 'POST',
                    data: JSON.stringify(params),
                    contentType: 'application/json',
                    success: function (response) {
                        if (response.http_status !== 200) {
                            app.notifyOSD.createNotification('!', 'Error', response.message);
                        } else {
                            app.notifyOSD.createNotification('', 'Server acknowledged', 'Computer will ' + action + '.');
                        }
                        panel.cancel();
                    }
                });
            },
            getSelectedCustomer: function (customer, current) {
                var selected = {};
                if (customer === current) {
                    selected.selected = 'selected';
                }
                return selected;
            }
        });
        exports.name = 'agentBanner';
        exports.models = {
            Main: Backbone.Model.extend({
                //model code
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    var that = this;
                    this.agent = this.model.get('id');
                    this.data = new (Backbone.Model.extend({
                        baseUrl: '/api/v1/agent/',
                        url: function () {
                            return this.baseUrl + that.agent;
                        },
                        parse: function (response) {
                            if (response.http_status !== 200) {
                                throw new Error('patchManager cannot fetch from current API');
                            }
                            return response.data;
                        }
                    }))();
                    this.confirmModal = new Panel.View({
                        confirm: that.confirmAction,
                        parentView: that,
                        span: '6',
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Continue',
                                action: 'confirm',
                                className: 'btn-primary',
                                position: 'right'
                            }
                        ]
                    });
                    this.customerModal = new Panel.View({
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Update',
                                action: 'confirm',
                                className: 'btn-primary',
                                position: 'right'
                            }
                        ],
                        confirm: that.editCustomer,
                        parentView: that
                    });
                    this.confirmModal.setHeaderHTML(this.renderHeader());
                    this.customerModal.setHeaderHTML(crel('h4', 'Change Agent\'s Customer'));
                    this.listenTo(this.data, 'sync', this.renderBanner);
                },
                events: {
                    'click .disabled': 'stopEvent',
                    'click a[data-id=restart]': 'toggleConfirmPanel',
                    'click a[data-id=shutdown]': 'toggleConfirmPanel',
                    'click a[data-id=delete]': 'toggleDeletePanel',
                    'click a[data-id=refresh]': 'getAppUpdates',
                    'click a[data-id=change]': 'toggleCustomerPanel'
                },
                stopEvent: function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html(this.layout());
                    }
                    if (this.data.url) { this.data.fetch(); }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                layout: function () {
                    return crel('div', {class: 'row-fluid'},
                        crel('div', {'data-id': 'os-icon', class: 'span1'}),
                        crel('div', {'data-id': 'system-info', class: 'span5 alignLeft'}),
                        crel('div', {class: 'span5 noOverflow'}),
                        crel('div', {'data-id': 'control-buttons', class: 'span1 alignRight'})
                    );
                },
                renderBanner: function (model) {
                    var $icon = this.$('div[data-id=os-icon]'),
                        $info = this.$('div[data-id=system-info]'),
                        $buttons = this.$('div[data-id=control-buttons]'),
                        $column = this.$el.parents('.column'),
                        $row = this.$el.parents('.rowheight1');
                    $column.css('overflow', 'visible');
                    $row.css('z-index', '6');
                    $icon.append(this.renderIcon(model));
                    $info.append(this.renderSystemInfo(model));
                    $buttons.append(this.renderControlButtons());
                    this.customerModal.setContentHTML(this.customerPanelLayout(app.user.toJSON()['customers'], model.get('customer_name')));
                },
                renderIcon: function (model) {
                    var operatingSystem = model.get('os_string');
                    return crel('i', {class: helpers.getIconOS(operatingSystem) + ' icon-4x'});
                },
                renderSystemInfo: function (model) {
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(crel('strong', {class: 'noOverflow'}, helpers.getAgentName(model)));
                    fragment.appendChild(crel('div', {class: 'noOverflow'}, model.get('os_string')));
                    fragment.appendChild(crel('span', {class: 'noOverflow'}, helpers.getAgentStatus(model)));
                    return fragment;
                },
                renderControlButtons: function () {
                    var buttons = crel('div', {class: 'btn-group btn-group-vertical'}),
                        id = this.model.get('id');
                    $(buttons).append(
                        crel('a', {class: 'btn btn-mini', 'href': '#remote/' + id, target: '_blank', title: 'Start Remote Assistance'},
                            crel('i', {class: 'icon-desktop icon-large'})
                        ),
                        crel('button', {class: 'btn btn-mini dropdown-toggle', 'data-toggle': 'dropdown', style: 'width: 40px'},
                            crel('i', {class: 'caret'})
                        ),
                        crel('ul', {class: 'dropdown-menu pull-right', role: 'menu', style: 'text-align: start'},
                            crel('li',
                                crel('a', {href: '#', 'data-id': 'restart'},
                                    crel('i', {class: 'icon-play-circle icon-flip-horizontal'}, ' Restart...')
                                )
                            ),
                            crel('li',
                                crel('a', {href: '#', 'data-id': 'shutdown'},
                                    crel('i', {class: 'icon-power-off'}, ' Shutdown...')
                                )
                            ),
                            crel('li',
                                crel('a', {href: '#', 'data-id': 'refresh'},
                                    crel('i', {class: 'icon-refresh'}, ' Refresh Apps...')
                                )
                            ),
                            crel('li',
                                crel('a', {href: '#', 'data-id': 'change'},
                                    crel('i', {class: 'icon-exchange'}, ' Change Customer...')
                                )
                            ),
                            crel('li', {class: 'divider'}),
                            crel('li',
                                crel('a', {href: '#', 'data-id': 'delete'},
                                    crel('i', {class: 'icon-trash'}, ' Delete...')
                                )
                            )
                        )
                    );
                    return buttons;
                },
                renderHeader: function () {
                    return crel('h4', 'Warning');
                },
                renderContent: function (type) {
                    return crel('strong', 'Are you sure you want to ' + type + ' the computer?');
                },
                toggleConfirmPanel: function (event) {
                    event.preventDefault();
                    var type = $(event.currentTarget).data().id;
                    this.confirmModal.action = type;
                    this.confirmModal.setContentHTML(this.renderContent(type));
                    this.confirmModal.open();
                },
                toggleDeletePanel: function (event) {
                    event.preventDefault();
                    var that = this;
                    if (!this.deleteModal) {
                        this.deleteModal = new DeletePanel.View({
                            url: 'api/v1/agent/',
                            id: that.agent,
                            name: helpers.getAgentName(that.data),
                            type: 'agent',
                            redirect: '#nodes'
                        });
                    }
                    this.deleteModal.open();
                },
                toggleCustomerPanel: function (event) {
                    event.preventDefault();
                    this.customerModal.open();
                },
                confirmAction: function () {
                    if (this.action === 'restart') {
                        this.options.parentView.restartAgent();
                    } else if (this.action === 'shutdown') {
                        this.options.parentView.shutdownAgent();
                    }
                    return this;
                },
                shutdownAgent: function () {
                    var agent = this.agent,
                        url = '/api/v1/agent/' + agent,
                        params = {shutdown: true};
                    helpers.agentCall(url, params, 'turn off', this.confirmModal);
                    return this;
                },
                restartAgent: function () {
                    var agent = this.agent,
                        url = '/api/v1/agent/' + agent,
                        params = {reboot: true};
                    helpers.agentCall(url, params, 'restart', this.confirmModal);
                    return this;
                },
                getAppUpdates: function (event) {
                    event.preventDefault();
                    var agent = this.agent,
                        url = 'api/v1/agent/' + agent,
                        params = {apps_refresh: true};
                    helpers.agentCall(url, params, 'get the latest application updates. This process may take several minutes');
                    return this;
                },
                customerPanelLayout: function (customers, current) {
                    var select =  crel('select', {'required': 'required'});
                    _.each(customers, function (customer) {
                        select.appendChild(crel('option', helpers.getSelectedCustomer(customer.name, current), customer.name));
                    });
                    return crel('form', {id: 'changeCustomer', class: 'form-horizontal'},
                            crel('div', {class: 'control-group noMargin'},
                                crel('label', {class: 'control-label'}, 'Customer:'),
                                crel('div', {class: 'controls'},
                                    select, crel('br'),
                                    crel('div', {class: 'help-online', style: 'margin-top: 5px;', 'data-name': 'message'})
                                )
                            )
                    );
                },
                editCustomer: function () {
                    var $select = this.$('select'),
                        $message = $select.siblings('.help-online'),
                        url = '/api/v1/agent/' + this.options.parentView.model.get('id'),
                        params = {customer_name: $select.val()},
                        that = this;
                    $message.removeClass('alert-error alert-success').addClass('alert-info').html('Submitting...');
                    if (params.customer_name) {
                        $.ajax({
                            url: url,
                            type: 'PUT',
                            contentType: 'application/json',
                            data: JSON.stringify(params),
                            success: function (response) {
                                if (response.http_status === 200) {
                                    $message.removeClass('alert-info alert-success alert-error').addClass('alert-error').html('');
                                    that.cancel();
                                }
                            },
                            error: function (e) {
                                var error = JSON.parse(e.responseText);
                                $message.removeClass('alert-info alert-success').addClass('alert-error').html(error.message);
                            }
                        });
                    } else {
                        $message.removeClass('alert-info alert-success').addClass('alert-error').html('Field cannot be empty.');
                    }
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {},
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var tmpl = _.template(this.template),
                        model = this.model.toJSON();

                    this.$el.empty();

                    this.$el.append(tmpl({model: model}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
