define(
    ['jquery', 'underscore', 'backbone', 'modules/lists/list', 'modules/lists/pageable', 'modals/panel', 'crel', 'moment', 'livestamp'],
    function ($, _, Backbone, list, pageable, Panel, crel, moment) {
        'use strict';
        var exports = {},
            templates = {},
            fragments = {},
            helpers = {},
            eventManager = _.extend({}, Backbone.Events);

        exports.Collection = pageable.Collection.extend({
            url: 'api/v1/operations',
            fetch: function (options) {
                if(_.isUndefined(options)) { options = {}; }
                if(_.isUndefined(options.data)) {options.data = {}; }
                options.data = _.extend({}, this.params, options.data);
                pageable.Collection.prototype.fetch.call(this, options);
            }
        });

        // ----------------------------------------------------------------------------------------
        // Views
        // ----------------------------------------------------------------------------------------
        exports.View = Backbone.View.extend({
            initialize: function (options) {
                this.master = new exports.Master(options);
                this.detail = new exports.Detail();
                this.addSubViews(this.master, this.detail);
                return this;
            },
            render: function () {
                this.$el.html(this.layout());
                this.master.setElement(this.$('.master')).render();
                this.detail.setElement(this.$('.detail')).render();
                return this;
            },
            layout: function () {
                return crel('div', {class: 'multiList row-fluid clearfix'},
                    crel('div', {class: 'span4 master'}),
                    crel('div', {class: 'span8 detail'})
                );
            }
        });

        exports.Master = pageable.View.extend({
            showHeader: false,
            showLegend: false,
            showingString: 'Operations',
            recordString: '',
            events: function () {
                return _.extend({
                    'click .item': 'changeItem',
                    'click [data-action*=list-page]': function () {
                        eventManager.trigger('changePage');
                    }
                }, _.result(pageable.View.prototype, 'events'));
            },
            initialize: function (options) {
                this.collection = new exports.Collection({
                    _defaultParams: {offset: 0, count: 10},
                    params: options.query
                });
                pageable.View.prototype.initialize.call(this, options);
                this.listenTo(this.collection, 'sync', this.showOperation);
            },
            showOperation: function () {
                var model;
                if (this.options.id) {
                    model = this.collection.findWhere({operation_id: this.options.id});
                    if (!_.isUndefined(model)) {
                        $('[data-id=' + model.cid + ']').click();
                    } else {
                        eventManager.trigger('switch', this.options.id);
                    }
                }
            },
            layoutFooter: function (left, right) {
                return pageable.View.prototype.layoutFooter.call(this, left, right);
            },
            renderModel: function (model) {
                var time = moment(model.get('created_time') * 1000);
                return crel('div', {class:'item', 'data-id':model.cid},
                    crel('div', {class:'clearfix'},
                        crel('strong', {class:'pull-left'}, model.get('created_by')),
                        crel('span', {class:'pull-right time'},
                            time.format('L hh:mm:ss A')
                        )
                    ),
                    crel('div', {class:'clearfix'},
                        crel('span', {class:'pull-left'}, helpers.parseOperationName(model.get('operation'))),
                        crel('span', {class:'pull-right'}, helpers.getOperationStatusLabels(model))
                    )
                );
            },
            changeItem: function (event) {
                var $target = $(event.currentTarget),
                    cid = $target.data().id;
                if (!$target.hasClass('selected')) {
                    $target.addClass('selected')
                        .siblings()
                        .removeClass('selected');
                    eventManager.trigger('switch', this.collection.get(cid));
                }
                return this;
            }
        });
        exports.Detail = Backbone.View.extend({
            initialize: function () {
                this.modal = new Panel.View({
                    span: '10'
                });
                this.model = new (Backbone.Model.extend({
                    baseUrl: 'api/v1/operation/',
                    url: function () {
                        return this.baseUrl + this.id;
                    },
                    parse: function (response) {
                        return response.data;
                    }
                }))();
                this.addSubViews(this.modal);
                this.listenTo(eventManager, 'switch', this.getModel);
                this.listenTo(this.model, 'sync', this.renderModel);
                this.listenTo(eventManager, 'changePage', this.clearArea);
                return this.render();
            },
            events: {
                'click [data-action="toggleModal"]' : 'toggleModal',
                'click [data-action="expand"]'      : 'expand',
                'click.clipBoardText'      : 'copyToClipBoard'
            },
            render: function () {
                return this.clearArea();
            },
            getModel: function (model) {
                if (model instanceof Backbone.Model) {
                    this.model.id = model.get('operation_id');
                } else {
                    this.model.id = model;
                }
                this.model.fetch();
                return this;
            },
            renderModel: function (model) {
                var template = templates[model.get('operation')] || templates['default'];
                this.$el.empty().append(template(model));
                return this;
            },
            clearArea: function () {
                this.$el.html(
                    crel('pre', {'class': 'defaultMessage'},
                        crel('i', {'class':'icon-folder-close-alt ', 'style':'font-size:128px;'}), crel('br'),
                        crel('strong','No Message Selected')
                    )
                );
                return this;
            },
            toggleModal: function (event) {
                event.preventDefault();
                var $row = $(event.currentTarget),
                    data = $row.data(),
                    agent = _.findWhere(this.model.get('agents'), {agent_id: data.id}),
                    errors = _.where(agent.applications, {results: 6003});
                this.modal.setHeaderHTML(this.renderModalHeader(agent.computer_name));
                this.modal.setContentHTML(this.renderModalContent(errors, this.model.get('operation')));
                this.modal.open();
            },
            expand: function (event) {
                event.preventDefault();
                var $button = $(event.currentTarget),
                    $icon = $button.children(),
                    $parent = $button.parents('tr'),
                    $packagesContainer = $parent.find('div[data-id="packagesContainer"]');
                $icon.toggleClass('icon-collapse icon-collapse-top');
                $packagesContainer.toggle();
            },
            renderModalHeader: function (agent) {
                return crel('h4', agent + ' - Errors');
            },
            renderModalContent: function (apps, operation) {
                var fragment = crel('div', {class: 'list'}),
                    items = crel('div', {class: 'items row-fluid'});
                _.each(apps, function (app) {
                    $(items).append(crel('div', {class: 'item'},
                        crel('a', {href: helpers.getPatchLink(app.app_id, operation)},
                            crel('span', {class: 'span4', title: app.app_name}, app.app_name)
                        ),
                        crel('button', {class: 'span1 btn btn-link noPadding fail clipBoardText'}, crel('i', {class: 'icon-copy'})),
                        crel('span', {class: 'span7 alignRight fail', title: app.errors}, app.errors)
                    ));
                });
                fragment.appendChild(items);
                return fragment;
            },
            copyToClipBoard: function () {
                $('button.clipBoardText').click(function() {
                    var clipText = $(this).siblings().eq(-1).text();
                    window.prompt('Copy to clipboard: Ctrl+C, Enter', clipText);
                });
            }
        });

        // ----------------------------------------------------------------------------------------
        // Templates
        // ----------------------------------------------------------------------------------------
        _.extend(templates, {
            'install_os_apps': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));
                //fragment.appendChild(fragments.packages(model));

                return fragment;
            },
            'install_custom_apps': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));
                //fragment.appendChild(fragments.packages(model));

                return fragment;
            },
            'install_supported_apps': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));
                //fragment.appendChild(fragments.packages(model));

                return fragment;
            },
            'install_agent_update': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));
                //fragment.appendChild(fragments.packages(model));

                return fragment;
            },
            'uninstall': function (model) {
                return templates.install_os_apps(model);
            },
            'reboot': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));

                return fragment;
            },
            'updatesapplications': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));

                return fragment;
            },
            'shutdown': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));

                return fragment;
            },
            'default': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.title(model));
                fragment.appendChild(fragments.targetAgents(model));
                fragment.appendChild(fragments.serverResponse(model));

                return fragment;
            }
        });

        // ----------------------------------------------------------------------------------------
        // Fragments
        // ----------------------------------------------------------------------------------------
        _.extend(fragments, {
            'title': function (model) {
                return crel('h3', {'class':'title'},
                    crel('strong', helpers.parseOperationName(model.get('operation')).toLocaleUpperCase(), ' BY ', model.get('created_by').toLocaleUpperCase()),
                    crel('small', moment(model.get('created_time') * 1000).format('L hh:mm:ss A')),
                    crel('hr')
                );
            },
            'targetAgents': function (model) {
                var items = document.createDocumentFragment(),
                    agent_ids = model.get('agents'),
                    count = agent_ids.length;
                _.each(agent_ids, function (agent, key) {
                    var agent_id = agent.agent_id,
                        link = '/#nodes/' + agent_id,
                        className = key + 1 === count ? 'item last' : 'item',
                        status = helpers.getAgentStatusLabel(agent),
                        progressBar = '', expand = '', packages = '';
                    if (agent.apps_total_count) {
                        progressBar = crel('div', {class: 'clearfix'},
                            crel('div', {class: helpers.getAgentProgressClass(agent)},
                                fragments.successProgressBar(agent),
                                fragments.failedProgressBar(agent)
                            )
                        );
                        expand =  crel('button', {class: 'btn btn-link noPadding', 'data-action': 'expand', style: 'vertical-align: baseline;'}, ' ',
                            crel('i', {class: 'icon-collapse'})
                        );
                        packages = crel('div', {class: 'hide', 'data-id': 'packagesContainer'},
                            fragments.packages(agent.applications, model.get('operation'))
                        );
                    }
                    items.appendChild(
                        crel('tr', {'class':className},
                            crel('td',
                                progressBar,
                                crel('div', {class: 'clearfix'},
                                    crel('span', {class: 'pull-left'},
                                        crel('a', {href: link},
                                            crel('strong', agent.computer_name)
                                        ), ' — ',
                                        expand
                                    ),
                                    crel('span', {class: 'pull-right ' + status.class},
                                        fragments.statusMessage(agent, status)
                                    )
                                ),
                                packages
                            )
                        )
                    );
                });
                return crel('section',
                    crel('h5', 'Target Agents'),
                    crel('div', {class: 'well'},
                        crel('table', {'class':'list'},
                            crel('tbody', {'class':'items'}, items)
                        )
                    )
                );
            },
            'packages': function (apps, operation) {
                var items = document.createDocumentFragment(),
                    count = apps.length;
                _.each(apps, function (item, key) {
                    var link = helpers.getPatchLink((item.app_id ? item.app_id : item), operation),
                        className = key + 1 === count ? 'item last' : 'item',
                        packageStatus = helpers.getPackageStatus(item);
                    items.appendChild(
                        crel('tr', {'class':className},
                            crel('td',
                                crel('a', {href: link, class:'block' },
                                    packageStatus, ' ',
                                    crel('strong',{title: item.app_name || item}, item.app_name ? item.app_name : item)
                                )
                            ),
                            crel('td', {class: 'icon alignRight'},
                                crel('a', {href: link, class:'block'},
                                    crel('i', {'class': 'icon-caret-right'})
                                )
                            )
                        )
                    );
                });
                return crel('section',
                    crel('h5', 'Selected Packages'),
                    crel('div', {class: 'well'},
                        crel('table', {'class':'list'},
                            crel('tbody', {'class':'items'}, items)
                        )
                    )
                );
            },
            'serverResponse': function (model) {
                return crel('section',
                    crel('h5', 'Server Response'),
                    crel('pre', JSON.stringify(model, null, 2))
                );
            },
            // Labels -----------------------------------------------------------------------------
            'statusLabel': function (title, value, icon, optionalClass) {
                if (value === 0) { return ''; }
                var spanAttributes = {};
                spanAttributes['class'] = ['label', optionalClass].join(' ');
                spanAttributes.title = title;
                return crel('span', spanAttributes,
                    _.isString(icon) ? crel('i', {'class': icon}) : '',
                    _.isString(icon) ? ' ' : '',
                    value
                );
            },
            statusMessage: function (agent, status) {
                if (status.class === 'fail') {
                    return crel('a', {
                        class: status.class,
                        href: '#',
                        'data-action': 'toggleModal',
                        'data-agent': agent.computer_name,
                        'data-message': helpers.getErrorMessage(status)
                    }, status.message);
                } else {
                    return status.message;
                }
            },
            pendingLabel: function (value) {
                return this.statusLabel('Pending Agent Pickup', value, 'icon-desktop');
            },
            inProgressLabel: function (value) {
                return this.statusLabel('In Progress...', value, 'icon-spinner', 'label-info');
            },
            completeLabel: function (value) {
                return this.statusLabel('Complete', value, 'icon-ok', 'label-success');
            },
            completeWithErrorLabel: function (value) {
                return this.statusLabel('Completed with errors', value, 'icon-warning-sign', 'label-warning');
            },
            rebootLabel: function (value) {
                return this.statusLabel('Pending Reboot', value, 'icon-repeat', 'label-warning');
            },
            errorLabel: function (value) {
                return this.statusLabel('Errors', value, 'icon-warning-sign', 'label-important');
            },
            successProgressBar: function (agent) {
                var width = (agent.apps_completed_count / agent.apps_total_count) * 100,
                    bar = crel('div', {class: 'bar bar-success', title: agent.apps_completed_count.toString() + ' application(s) completed.', style: 'width: ' + width.toString() + '%;'});
                $(bar).tooltip({container: 'body'});
                return bar;
            },
            failedProgressBar: function (agent) {
                var width = (agent.apps_failed_count / agent.apps_total_count) * 100,
                    bar = crel('div', {
                        class: 'bar bar-danger',
                        title: agent.apps_failed_count.toString() + ' application(s) failed.',
                        style: 'width: ' + width.toString() + '%;',
                        'data-action': 'toggleModal',
                        'data-id': agent.agent_id
                    });
                $(bar).tooltip({container: 'body'});
                return bar;
            }

        });

        // ----------------------------------------------------------------------------------------
        // Helpers
        // ----------------------------------------------------------------------------------------
        _.extend(helpers, {
            getAgentStatusLabel: function (agent) {
                var completed = agent.completed_time * 1000,
                    picked_up = agent.picked_up_time * 1000,
                    pending_apps = agent.apps_pending_count,
                    status = {
                        class: '',
                        message: 'Waiting for Agent'
                    }, errors;
                if (completed) {
                    status.class = 'succ';
                    status.message = 'Completed';
                    if (agent.apps_failed_count === 1) {
                        status.class = 'fail';
                        status.message = 'Error';
                        status.detail = [_.findWhere(agent.applications, {results: 6003})];
                    } else if (agent.apps_failed_count > 1) {
                        errors = _.where(agent.applications, {results: 6003});
                        if (_.isArray(errors) && errors.length > 0) {
                            status.class = 'fail';
                            status.message = ['Completed with', errors.length, errors.length !== 1 ? 'errors' : 'error'].join(' ').trim();
                            status.detail = errors;
                        }
                    }
                } else if (picked_up) {
                    status.message = 'Started ' + moment(picked_up).format('L hh:mm:ss A') + '. ';
                    if (agent.apps_total_count) {
                        status.message += pending_apps + ' application(s) pending.';
                    }
                }
                return status;
            },
            getOperationStatusLabels: function (model) {
                return crel('span',
                    fragments.pendingLabel(model.get('agents_pending_pickup_count')), ' ',
                    fragments.inProgressLabel(model.get('agents_pending_results_count')), ' ',
                    fragments.completeWithErrorLabel(model.get('agents_completed_with_errors_count')), ' ',
                    fragments.completeLabel(model.get('agents_completed_count')), ' ',
                    fragments.errorLabel(model.get('agents_failed_count'))
                );
            },
            getAgentStatus: function (model, agent_id) {
                var packages = model.get('packages'),
                    agentMatcher = function(obj) { return obj.agent_id === agent_id;},
                    has_op = _.find(model.get('has_operation'), agentMatcher),
                    result = _.find(model.get('results'), agentMatcher),
                    resultData = _.result(result, 'data');
                return {
                    'awaitingPickup': _.isUndefined(has_op),
                    'inProgress': !_.isUndefined(has_op) && _.isUndefined(result),
                    'complete': !_.isUndefined(has_op) && !_.isUndefined(result),
                    'operationError': _.result(result, 'error'),
                    'expectedResults': _.isArray(packages) ? packages.length : 1,
                    'completeSubOps': _.isArray(resultData) ? _.where(resultData, {'success': 'true'}) : [],
                    'failedSubOps': _.isArray(resultData) ? _.where(resultData, {'success': 'false'}) : []
                };
            },
            getPackageStatus: function (application) {
                var iconClass;
                if (!application.results_received_time) {
                    iconClass = 'icon-spinner icon-spin';
                } else if (application.results === 6003) {
                    iconClass = 'icon-warning-sign fail';
                } else {
                    iconClass = 'icon-ok succ';
                }
                return crel('i', {class: iconClass});
            },
            getPatchLink: function (id, operation) {
                var url = '/#patches/';
                if (operation.indexOf('os') !== -1) {
                    url += 'os/';
                } else if (operation.indexOf('custom') !== -1) {
                    url += 'custom/';
                } else if (operation.indexOf('supported') !== -1) {
                    url += 'supported/';
                } else if (operation.indexOf('agent') !== -1) {
                    url += 'remediationvault/';
                }
                url += id;
                return url;
            },
            getErrorMessage: function (status) {
                if (status.class === 'fail') {
                    return JSON.stringify(status);
                } else {
                    return '';
                }
            },
            getResultsErrorCount: function (results) {
                var errors = _.filter(_.pluck(results, 'error'), function (error) {
                        return !_.isNull(error);
                    }),
                    data = _.filter(_.flatten(_.pluck(results, 'data')), function (datum) {
                        return !_.isNull(datum) && !_.isUndefined(datum.error);
                    });
                return errors.length + data.length;
            },
            getAgentProgressClass: function (agent) {
                var className = 'progress noMargin';
                if (!agent.completed_time) {
                    className += ' progress-striped active';
                }
                return className;
            },
            parseOperationName: function (operation) {
                return operation.replace(/_/g, ' ');
            }
        });

        return exports;
    }
);
