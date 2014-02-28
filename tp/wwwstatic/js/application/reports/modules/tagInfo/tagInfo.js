define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modals/panel'],
    function ($, _, Backbone, app, crel, Panel) {
        'use strict';
        var exports = {},
            tabNames = {
                '#main': {
                    name: 'MAIN',
                    keys: [
                        {name: 'tag_name', title: 'Tag Name:'},
                        {name: 'customer_name', title: 'Customer:'},
                        {name: 'production_level', title: 'Production State:'}
                    ]
                },
                '#agents': {
                    name: 'AGENTS',
                    keys: [{name: 'agents'}]
                }
            };
        exports.name = 'tagInfo';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: '',
                    defaultTab: '#main'
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: ['hardwareInfo'].join(' '),
                initialize: function () {
                    var that = this;
                    if (_.isUndefined(this.model)) {
                        throw new Error('hardwareInfo view requires a hardwareInfo model');
                    }
                    var id = this.model.get('id');
                    this._currentTab = this.model.get('defaultTab');
                    this.data = new (Backbone.Model.extend({
                        baseUrl: '/api/v1/tag/',
                        url: function () {
                            return this.baseUrl + id;
                        }
                    }))();
                    this.restartModal = new Panel.View({
                        confirm: that.restartAgents,
                        parentView: that,
                        span: '6',
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Reboot',
                                action: 'confirm',
                                className: 'btn-primary',
                                position: 'right'
                            }
                        ]
                    });
                    this.restartModal.setHeaderHTML(crel('h4', 'Warning'));
                    this.listenTo(this.data, 'sync', this.renderTabs);
                },
                events: {
                    'click li a[data-toggle=tab]'   : 'changeTab',
                    'click button[data-id=restartAgent]' : 'toggleRestartConfirmation'
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
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(
                        crel('div', {class: 'tabbable tabs-left'},
                            crel('ul', {class: 'nav nav-tabs'}),
                            crel('div', {class: 'tab-content'})
                        )
                    );
                    return fragment;
                },
                renderTabs: function (model) {
                    if (model.get('http_status') !== 200) {
                        throw new Error('API was not able to fetch data');
                    }
                    var selected, $navTabs = this.$el.find('.nav-tabs'),
                        fragment = document.createDocumentFragment(),
                        that = this;
                    $navTabs.empty();
                    _.each(_.keys(tabNames), function (tabName) {
                        selected = (tabName === that._currentTab) ? 'active'  : '';
                        fragment.appendChild(
                            crel('li', {class: selected},
                                crel('a', {href: tabName, 'data-toggle': 'tab'}, tabNames[tabName].name))
                        );
                        if (selected) {
                            that.renderTab(tabName);
                        }
                    });
                    $navTabs.append(fragment);
                },
                changeTab: function (event) {
                    event.preventDefault();
                    var href = $(event.currentTarget).attr('href');
                    this._currentTab = href;
                    this.renderTab(href);
                },
                renderTab: function (tab) {
                    var $content = this.$el.find('.tab-content'),
                        $dl = $(crel('dl', {class: 'inline'})),
                        data = this.data.get('data'),
                        keys = tabNames[tab].keys;
                    $content.empty();
                    if (keys.length) {
                        _.each(keys, function (object) {
                            var content = data[object.name];
                            if (typeof content === 'string') {
                                $dl.append(
                                    crel('dt', object.title),
                                    crel('dd', data[object.name] || 'N/A')
                                );
                            } else if (_.isArray(content) && content.length) {
                                $content.append(
                                    crel('strong', 'Restart all: '),
                                    crel('button', {class: 'btn btn-link noPadding', 'data-id': 'restartAgent', 'data-value': 'all', 'data-name': 'every agent'},
                                        crel('i', {class: 'icon-refresh', style: 'color: blue'}))
                                );
                                _.each(content, function (agent) {
                                    $dl.append(
                                        crel('dt', 'Computer Name:'),
                                        crel('dd', (agent.computer_name || 'N/A') + ' ',
                                            crel('button', {class: 'btn btn-link noPadding', 'data-id': 'restartAgent', 'data-value': agent.agent_id, 'data-name': agent.computer_name},
                                                crel('i', {class: 'icon-refresh', style: 'color: blue'})))
                                    );
                                });
                            } else {
                                $content.append(crel('strong', 'No data available'));
                            }
                        });
                    }
                    $content.append($dl);
                },
                toggleRestartConfirmation: function (event) {
                    event.preventDefault();
                    this.restartModal.agentValues = $(event.currentTarget).data();
                    this.restartModal
                        .setContentHTML(this.restartConfirmationLayout(this.restartModal.agentValues.name))
                        .open();
                },
                restartConfirmationLayout: function (agent) {
                    return crel('strong', 'Are you sure you want to restart ' + agent + '?');
                },
                restartAgents: function (event) {
                    var value = this.agentValues.value,
                        url = '/api/v1/agent/',
                        that = this,
                        params = {};
                    if (value === 'all') {
                        params.tag_id = this.options.parentView.model.get('id');
                    } else {
                        url += value;
                        params.reboot = true;
                    }
                    $.ajax({
                        url: url,
                        type: 'POST',
                        data: JSON.stringify(params),
                        contentType: 'application/json',
                        success: function (response) {
                            if (response.http_status === 200) {
                                app.notifyOSD.createNotification('!', 'Server acknowledged', 'Computer will be rebooted');
                            } else {
                                app.notifyOSD.createNotification('!', 'Error', response.message);
                            }
                        }
                    });
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    //this.template = myTemplate;
                },
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
