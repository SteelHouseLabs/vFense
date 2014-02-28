define(
    ['jquery', 'underscore', 'backbone', 'crel', 'app', 'bootstrap-popover'],
    function ($, _, Backbone, crel, app) {
        'use strict';
        var exports = {};
        exports.name = 'basicAgentControl';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: ''
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('nodeTags view requires a nodeTags model');
                    }
                    var id = this.model.get('id');
                    this.data = new (Backbone.Model.extend({
                        baseUrl: '/api/nodes.json',
                        url: function () {
                            return this.baseUrl + '?id=' + id;
                        }
                    }))();
                    this.listenTo(this.data, 'sync', this.renderControls);
                },
                events: {
                    'click button[data-id=submitEdit]': 'edit',
                    'click i.icon-remove'             : 'closePopover'
                },
                beforeRender: $.noop,
                onRender: function () {
                    var $edit = this.$el.find('button[rel=edit]');
                    $edit.popover({
                        placement: 'right',
                        //title: '&nbsp;<button type="button" class="btn btn-link noPadding pull-right"><i class="icon-remove"></i></button>',
                        html: true,
                        trigger: 'click',
                        content: function () {
                            var fragment = document.createDocumentFragment();
                            fragment.appendChild(
                                crel('div', {class: 'row-fluid'},
                                    crel('span', {class: 'span8'},
                                        crel('input', {type: 'text', class: 'span12', placeholder: $(this).data('argument')})
                                    ),
                                    crel('span', {class: 'span2'},
                                        crel('button', {class: 'btn btn-link'},
                                            crel('i', {class: 'icon-remove', style: 'color: red'})
                                        )
                                    ),
                                    crel('span', {class: 'span2'},
                                        crel('button', {class: 'btn btn-link', 'data-id': 'submitEdit', 'data-url': $(this).data('url'), 'data-argument': $(this).data('argument')},
                                            crel('i', {class: 'icon-ok', style: 'color: green'})
                                        )
                                    )
                                )
                            );
                            return fragment;
                        }
                    });
                    return this;
                },
                closePopover: function (event) {
                    var $popover = $(event.currentTarget).parents('.popover').siblings('[rel=edit]');
                    $popover.popover('hide');
                },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html(this.layout());
                    }
                    if (this.data.url) { this.data.fetch(); }

                    return this;
                },
                layout: function () {
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(
                        crel('dl')
                    );
                    return fragment;
                },
                renderControls: function (model) {
                    if (!model.get('pass')) {
                        throw new Error('API was not able to fetch data');
                    }
                    var $agentStatus, $hostStatus,
                        $dl = this.$('dl'),
                        agent = model.get('data')[0],
                        $ok = $(crel('dd', 'Running ',
                            crel('i', {class: 'icon-ok', style: 'color: green'}))
                        ),
                        $warning = $(crel('dd', 'Stopped ',
                            crel('i', {class: 'icon-warning-sign', style: 'color: red'}))
                        );
                    $dl.empty();
                    $agentStatus = agent.agent_status ? $ok.clone() : $warning.clone();
                    $hostStatus = agent.host_status ? $ok.clone() : $warning.clone();
                    $dl.append(
                        crel('dt', 'Display Name:'),
                            crel('dd', agent.display_name ? agent.display_name + ' ' : 'N/A ',
                                crel('button', {class: 'btn btn-link noPadding', rel: 'edit', 'data-url': 'modifyDisplayName', 'data-argument': 'displayname'},
                                    crel('i', {class: 'icon-pencil', style: 'color: #daa520'}))),
                        crel('dt', 'Host Name:'),
                            crel('dd', agent.host_name ? agent.host_name + ' ' : 'N/A ',
                                crel('button', {class: 'btn btn-link noPadding', rel: 'edit', 'data-url': 'modifyHostName', 'data-argument': 'hostname'},
                                    crel('i', {class: 'icon-pencil', style: 'color: #daa520'}))),
                        crel('dt', 'Operating System:'),
                            crel('dd', agent.os_string || 'N/A'),
                        crel('dt', 'Production State:'),
                            crel('dd', agent.production_level || 'N/A'),
                        crel('dt', 'Agent Status:'),
                        $agentStatus,
                        crel('dt', 'Host Status:'),
                        $hostStatus
                    );
                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                edit: function (event) {
                    var $button = $(event.currentTarget),
                        url = '/api/node/' + $button.data('url'),
                        name = $button.parents('.row-fluid').find('input').val(),
                        params = {
                            nodeid: this.model.get('id')
                        },
                        that = this;
                    params[$button.data('argument')] = name;
                    $.post(url, params, function (json) {
                        if (json.pass) {
                            that.data.fetch();
                        } else {
                            app.notifyOSD.createNotification('!', 'Error', json.message);
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
