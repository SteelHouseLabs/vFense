define(
    ['jquery', 'underscore', 'backbone', 'modals/panel', 'modules/lists/list', 'crel', 'moment'],
    function ($, _, Backbone, Panel, List, crel, moment) {
        'use strict';
        var exports = {},
            helpers = {},
            fragments = {},
            templates = {};
        _.extend(templates, {
            'install_os_apps': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.targetAgents(model));
                fragment.appendChild(fragments.packages(model));

                return fragment;
            },
            'uninstall': function (model) {
                return templates.install(model);
            },
            'reboot': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.targetAgents(model));

                return fragment;
            },
            'default': function (model) {
                var fragment = document.createDocumentFragment();

                fragment.appendChild(fragments.targetAgents(model));
                //fragment.appendChild(fragments.serverResponse(model));

                return fragment;
            }
        });
        _.extend(fragments, {
            'title': function (model) {
                return crel('h3', {'class':'title'},
                    crel('strong', helpers.parseOperationName(model.get('operation')).toLocaleUpperCase(), ' BY ', model.get('created_by').toLocaleUpperCase()),
                    crel('small', {class: 'pull-right'}, moment(model.get('created_time') * 1000).format('L hh:mm:ss A'))
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
                        status = helpers.getAgentStatusLabel(agent);
                    items.appendChild(
                        crel('tr', {'class':className},
                            crel('td',
                                crel('div', {class: 'clearfix'},
                                    crel('span', {class: 'pull-left'},
                                        crel('a', {href: link},
                                            crel('strong', agent.computer_name)
                                        )
                                    ),
                                    crel('span', {class: 'pull-right ' + status.class},
                                        fragments.statusMessage(agent, status)
                                    )
                                ),
                                crel('div', {class: 'clearfix'},
                                    crel('div', {class: helpers.getAgentProgressClass(agent)},
                                        fragments.successProgressBar(agent),
                                        fragments.failedProgressBar(agent)
                                    )
                                )
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
            'packages': function (model) {
                var items = document.createDocumentFragment(),
                    packages = model.get('packages'),
                    results = model.get('results'),
                    count = packages.length;
                if (results && results.length) {
                    packages = helpers.mergeResults(packages, results[0].data);
                }
                _.each(packages, function (item, key) {
                    var status, label, link = '/#patches/' + (item.id ? item.id : (item.rv_id || item)),
                        className = key + 1 === count ? 'item last' : 'item',
                        resultsHeader = '', resultsContents = '';
                    if (results && results.length) {
                        if (item.success === 'true') {
                            status = fragments.completeLabel();
                        } else {
                            status = crel('a', {href: '#', class: 'fail', 'data-action': 'toggleAccordion'},
                                fragments.errorLabel(), ' ',
                                crel('i', {class: 'icon-caret-right'})
                            );
                            resultsContents = crel('div', {class: 'accordion-body span12 noMargin hide'},
                                crel('div', {class: 'accordion-inner'},item.error)
                            );
                        }
                        resultsHeader = crel('span', {class: 'span2 alignRight'}, status);
                    } else if (model.get('has_operation').length) {
                        resultsHeader = crel('span', {class: 'span2 alignRight'}, fragments.inProgressLabel());
                    } else {
                        resultsHeader = crel('span', {class: 'span2 alignRight'}, fragments.pendingLabel());
                    }
                    items.appendChild(
                        crel('div', {'class':['row-fluid', className].join(' ')},
                            crel('span', {class: 'span10'},
                                crel('a', {href: link, class:'block' },
                                    crel('strong', helpers.getPackageName(model, item))
                                )
                            ),
                            resultsHeader, resultsContents
                        )
                    );
                });
                return crel('section',
                    crel('h5', 'Selected Packages'),
                    crel('div', {class: 'well'},
                        crel('div', {'class':'list'},
                            crel('div', {'class':'items'}, items)
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
                    return crel('span', {
                        class: status.class
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
                    bar = crel('div', {class: 'bar bar-danger', title: agent.apps_failed_count.toString() + ' application(s) failed.', style: 'width: ' + width.toString() + '%;'});
                $(bar).tooltip({container: 'body'});
                return bar;
            }

        });
        _.extend(helpers, {
            getPackageName: function (model, patch) {
                if (patch.name) {
                    return patch.name;
                }
                var packages = model.get('packages'),
                    exists = _.findWhere(packages, {id: patch.rv_id});
                return exists.name || exists;
            },
            mergeResults: function (packages, results) {
                var merge = _.uniq(_.union(results, packages), function (item) {
                    return item.id || item.rv_id;
                });
                return merge;
            },
            getAgentStatusLabel: function (model, agent_id) {
                var results = model.get('results'),
                    has_ops = model.get('has_operation'),
                    agentMatcher = function(obj) { return obj.agent_id === agent_id;},
                    result = _.find(results, agentMatcher),
                    has_op = _.find(has_ops, agentMatcher),
                    errors,
                    status = {
                        class: '',
                        message: 'Waiting for Agent'
                    };
                if (!_.isUndefined(result)) {
                    status.class = 'succ';
                    status.message = 'Completed';
                    if (!_.isNull(result.error)) {
                        status.class = 'fail';
                        status.message = 'Error';
                        status.detail = result.error;
                    } else if (!_.isUndefined(result.data)) {
                        errors = _.filter(result.data, function (o) { return o.success === 'false'; });
                        if (_.isArray(errors) && errors.length > 0) {
                            status.class = 'fail';
                            status.message = ['Completed with', errors.length, errors.length !== 1 ? 'errors' : 'error'].join(' ').trim();
                            status.detail = _.pluck(errors, 'error').join(' ');
                        }
                    }
                } else if (!_.isUndefined(has_op)) {
                    status.message = 'Started ' + moment(has_op.pickup_time).format('L hh:mm:ss A');
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
        exports.name = 'moduleName';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    params: {
                        count: 5,
                        offset: 0
                    }
                }
            })
        };
        exports.views = {
            Main: List.View.extend({
                showHeader: false,
                showFooter: false,
                layoutLegend: function ($legend) {
                    $legend.append(
                        crel('span', {class: 'span3'}, 'Operation'),
                        crel('span', {class: 'span5'}, 'Created Time'),
                        crel('span', {class: 'span3'}, 'User'),
                        crel('span', {class: 'span1 alignRight'}, 'Status')
                    );
                    return this;
                },
                initialize: function () {
                    var params = this.model.get('params'),
                        agent = this.model.get('agentID'),
                        baseUrl = agent ? '/api/v1/agent/' + agent + '/operations': '/api/v1/operations';
                    this.collection = new (List.Collection.extend({
                        baseUrl: baseUrl,
                        _defaultParams: params
                    }))();
                    List.View.prototype.initialize.apply(this, arguments);
                    this.modal = new Panel.View({
                        toggleAccordion: function (event) {
                            event.preventDefault();
                            var $item = $(event.currentTarget).parent(),
                                $accordionBody = $item.siblings('.accordion-body');
                            $accordionBody.toggle();
                        }
                    });
                },
                events: function () {
                    return _.extend({}, _.result(List.View.prototype, 'events'), {
                        'click a[data-action=openPanel]' : 'openPanel'
                    });
                },
                openPanel: function (event) {
                    event.preventDefault();
                    var $target = $(event.currentTarget),
                        cid = $target.data().id,
                        model = this.collection.get(cid);
                    this.modal.setHeaderHTML(this.renderModalHeader(model));
                    this.modal.setContentHTML(this.renderModalLayout(model));
                    this.modal.open();
                    this.initModal();
                },
                initModal: function () {
                    var $accordion = this.modal.$('a[data-action=toggleAccordion]');
                    $accordion.on('click', this.modal.options.toggleAccordion);
                },
                renderModalHeader: function (model) {
                    return crel('h4', fragments.title(model));
                },
                renderModalLayout: function (model) {
                    var template = templates[model.get('operation')] || templates['default'];
                    return template(model);
                },
                renderModel: function (model) {
                    var time = moment(model.get('created_time') * 1000);
                    return crel('div', {class:'item row-fluid'},
                        crel('a', {href: '#operations/' + model.get('operation_id') + '/', 'data-id':model.cid},
                            crel('strong', {class: 'span3'}, helpers.parseOperationName(model.get('operation'))),
                            crel('span', {class:'span5 time'},
                                time.format('L hh:mm:ss A')
                            ),
                            crel('span', {class: 'span3'}, model.get('created_by')),
                            crel('span', {class: 'span1 alignRight'}, helpers.getOperationStatusLabels(model))
                        )
                    );
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {},
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    //
                }
            })
        };
        return exports;
    }
);
