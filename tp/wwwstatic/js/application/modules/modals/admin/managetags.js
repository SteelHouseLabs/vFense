define(
    ['jquery', 'underscore', 'backbone', 'app', 'text!templates/modals/admin/managetags.html', 'select2'],
    function ($, _, Backbone, app, myTemplate) {
        'use strict';
        var exports = {
            Collection : Backbone.Collection.extend({
                baseUrl: 'api/tagging/listByTag.json',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            NodeCollection: Backbone.Collection.extend({
                baseUrl: 'api/nodes.json',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    window.currentView = this;
                    $.ajaxSetup({ traditional: true });

                    this.collection = new exports.Collection();
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();

                    this.nodecollection = new exports.NodeCollection();
                    this.listenTo(this.nodecollection, 'sync', this.render);
                    this.nodecollection.fetch();
                },
                events: {
                    'click a.accordion-toggle': 'stoplink',
                    'click button[name=remove]': 'deleteTag',
                    'click #createTag': 'showCreateTag',
                    'click #cancelNewTag': 'showCreateTag',
                    'click #submitTag': 'submitTag',
                    'click button[name=confirmDelete]': 'confirmDelete',
                    'click button[name=cancelDelete]': 'confirmDelete',
                    'change input[name=agentSelect]': 'toggleNode'
                },
                stoplink: function (event) {
                    event.preventDefault();
                    var $href = $(event.target),
                        $icon = $href.find('i'),
                        parent = $href.parents('.accordion-group'),
                        body = parent.find('.accordion-body');
                    body.unbind();
                    if ($icon.hasClass('icon-circle-arrow-down')) {
                        $icon.attr('class', 'icon-circle-arrow-up');
                        body.collapse('show');
                    } else {
                        body.collapse('hide');
                        $icon.attr('class', 'icon-circle-arrow-down');
                    }
                    body.on('hidden', function (event) {
                        event.stopPropagation();
                    });
                },
                toggleNode: function (event) {
                    var url = event.added ? '/api/agent/add/tag' : '/api/agents/remove/tag',
                        $input = $(event.currentTarget),
                        $item = $input.parents('.item'),
                        $badge = $item.find('.badge'),
                        counter = event.added ? parseInt($badge.html()) + 1 : parseInt($badge.html()) - 1,
                        params = {
                            tag_id: $input.data('tagid'),
                            agent_id: event.added ? event.added.id : event.removed.id
                        };
                    $.post(url, params, function (data) {
                        if (data.pass) {
                            $badge.html(counter);
                        } else {
                            app.notifyOSD.createNotification('!', 'Error', data.message || '');
                        }
                    }).error(function (e) { window.console.log(e.responseText); });
                },
                confirmDelete: function (event) {
                    var $deleteButton, $divConfirm;
                    if ($(event.currentTarget).attr('name') === 'confirmDelete') {
                        $deleteButton = $(event.currentTarget);
                        $divConfirm = $deleteButton.siblings('div');
                    } else {
                        $divConfirm = $(event.currentTarget).parent();
                        $deleteButton = $divConfirm.siblings('button');
                    }
                    $deleteButton.toggle();
                    $divConfirm.toggle();
                },
                deleteTag: function (event) {
                    event.preventDefault();
                    var params,
                        $button = $(event.target),
                        $item = $button.parents('.accordion-group'),
                        tag = $button.val(),
                        popover = $item.find('a[name=popover]');
                    if (popover.data('popover')) { popover.popover('destroy'); }
                    params = {
                        tag_id: tag
                    };
                    window.console.log(params);
                    $.post('/api/tags/remove', params,
                        function (json) {
                            window.console.log(json);
                            if (json.pass) {
                                $item.remove();
                            }
                        });
                },
                showCreateTag: function () {
                    var $newTagDiv = this.$el.find('#newTag');
                    $newTagDiv.toggle().find('input').val('');
                },
                submitTag: function () {
                    var params = {}, that = this,
                        tagname = this.$el.find('#tagName').val();
                    params = {
                        name: tagname
                    };
                    window.console.log(params);
                    if (tagname) {
                        $.post('/api/tags/create', params, function (json) {
                            window.console.log(json);
                            if (json.pass) {
                                that.collection.fetch();
                            }
                        });
                    }
                },
                beforeRender: $.noop,
                onRender: $.noop,
                select2Setup: function () {
                    var $select = this.$el.find('input[name=agentSelect]');
                    $select.select2({
                        width: '100%',
                        multiple: true,
                        initSelection: function (element, callback) {
                            var agents = JSON.parse(element.val()),
                                results = [];
                            _.each(agents, function (agent) {
                                results.push({id: agent.agent_id, text: agent.computer_name});
                            });
                            callback(results);
                        },
                        ajax: {
                            url: '/api/nodes.json',
                            data: function () {
                                return {};
                            },
                            results: function (data) {
                                var results = [];
                                if (data.pass) {
                                    _.each(data.data, function (object) {
                                        results.push({id: object.id, text: object.computer_name});
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
                        nodelist = this.nodecollection.toJSON()[0];

                    this.$el.empty();

                    if (data && data.pass && nodelist) {
                        this.$el.html(template({data: data.data, nodelist: nodelist.data}));
                        this.select2Setup();
                    }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                beforeClose: function () {
                    var popover = this.$el.find('button[name=popover]');
                    popover.each(function (i, pop) {
                        if ($(pop).data('popover')) {
                            $(pop).popover('destroy');
                        }
                    });
                }
            })
        };
        return exports;
    }
);
