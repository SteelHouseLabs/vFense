define(
    ['jquery', 'underscore', 'backbone', 'crel', 'modals/panel', 'text!templates/schedule.html' ],
    function ($, _, Backbone, crel, Panel, myTemplate) {
        'use strict';
        var exports = {
            Model: Backbone.Model.extend({
                baseUrl: 'api/v1/schedule/',
                url: function () {
                    return this.baseUrl + this.id;
                },
                parse: function (response) {
                    return response.data;
                }
            }),
            View: Backbone.View.extend({
                initialize: function (options) {
                    this.id = options.id;
                    this.template = myTemplate;
                    this.model = new exports.Model({id: options.id});
                    this.panel = new Panel.View();
                    this.panel.setHeaderHTML(crel('h4', 'Applications to be installed'));
                    this.listenTo(this.model, 'sync', this.render);
                    this.addSubViews(this.panel);
                    this.model.fetch();
                },
                events: {
                    'click button[data-action=expand]': 'togglePanel'
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var tmpl = _.template(this.template),
                        model = this.model.toJSON(),
                        payload = {
                            model: model,
                            viewHelpers: {
                                parseOperationName: function (operation) {
                                    return operation.replace(/_/g, ' ');
                                },
                                capitaliseFirstLetter: function (string) {
                                    return string.charAt(0).toUpperCase() + string.slice(1);
                                },
                                renderItems: function (items, title, href) {
                                    if (items.length) {
                                        var fragment = crel('div'),
                                            list = crel('dl'), agent, appList;
                                        _.each(items, function (item) {
                                            agent = crel('dd', {style: 'width: 100%'}, crel('a', {href: href + '/' + (item.tag_id || item.agent_id)}, item.tag_name || item.computer_name));
                                            if (item.apps && item.apps.length) {
                                                $(agent).prepend(
                                                    crel('button', {class: 'btn btn-link noPadding', 'data-action': 'expand', 'data-id': item.agent_id},
                                                        crel('i', {class: 'icon-plus', style: 'color: green; vertical-align: text-top;'})
                                                    ), ' '
                                                );
                                            }
                                            list.appendChild(agent);
                                        });
                                        fragment.appendChild(
                                            crel('div', {class: 'well clearfix'},
                                                crel('dl',
                                                    crel('dt', title + ':'),
                                                    crel('dd', list)
                                                )
                                            )
                                        );
                                        return fragment.innerHTML;
                                    }
                                }
                            }
                        };
                    if (model.job_name) {
                        this.$el.empty().append(tmpl(payload));
                    }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                togglePanel: function (event) {
                    event.preventDefault();
                    var agent = $(event.currentTarget).data('id');
                    this.panel.setContentHTML(this.renderApplications(agent))
                        .open();
                },
                renderApplications: function (agentID) {
                    var agent = _.findWhere(this.model.get('agents'), {agent_id: agentID}),
                        fragment = crel('div', {class: 'list'}),
                        items = crel('div', {class: 'items row-fluid'});
                    _.each(agent.apps, function (app) {
                        $(items).append(crel('div', {class: 'item'},
                            crel('a', {href: '#patches/os/' + app.app_id},
                                crel('span', {class: 'span8'}, app.name),
                                crel('span', {class: 'span4 alignRight'}, app.rv_severity)
                            )
                        ));
                    });
                    fragment.appendChild(items);
                    return fragment;
                }
            })
        };
        return exports;
    }
);