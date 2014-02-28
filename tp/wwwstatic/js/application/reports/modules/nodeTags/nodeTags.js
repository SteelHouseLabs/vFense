define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'select2'],
    function ($, _, Backbone, app, crel) {
        'use strict';
        var exports = {},
            pageKeys = {
                agent: {
                    url: '/api/v1/agent/',
                    name: 'tags',
                    primaryKey: 'tag_id',
                    text: 'tag_name',
                    searchURL: '/api/v1/tags',
                    placeholder: 'Select or create a tag',
                    createTag: function (term, data) {
                        if ($(data).filter(function () {
                            return this.text.localeCompare(term) === 0;
                        }).length === 0) {
                            return {id:term, text:term};
                        }
                    }
                },
                tag: {
                    url: '/api/v1/tag/',
                    name: 'agents',
                    primaryKey: 'agent_id',
                    text: 'computer_name',
                    searchURL: '/api/v1/agents',
                    placeholder: 'Select an agent',
                    createTag: false
                }
            };
        exports.name = 'nodeTags';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: '',
                    page: 'agent'
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
                    this.page = this.model.get('page');
                    this.data = new (Backbone.Model.extend({
                        baseUrl: pageKeys[this.page].url,
                        url: function () {
                            return this.baseUrl + id;
                        }
                    }))();
                    this.listenTo(this.data, 'sync', this.renderTags);
                },
                events: {
                    'change input': 'toggleTag'
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
                    fragment.appendChild(crel('input', {type: 'hidden'}));
                    return fragment;
                },
                capitaliseFirstLetter: function (string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                },
                processTag: function (url, method, params) {
                    var name = pageKeys[this.page].name,
                        message = this.capitaliseFirstLetter(name.substring(0, name.length - 1));
                    $.ajax({
                        url: url,
                        type: method,
                        data: params,
                        contentType: 'application/json',
                        dataType: 'json',
                        success: function (response) {
                            if (response.http_status === 200) {
                                if (method === 'DELETE') {
                                    message += ' was removed.';
                                } else {
                                    message += ' was added.';
                                }
                                app.notifyOSD.createNotification('', 'Success', message);
                            } else {
                                app.notifyOSD.createNotification('!', 'Error', response.message || '');
                            }
                        }
                    }).error(function (e) { window.console.log(e.responseText); });
                },
                toggleTag: function (event) {
                    if (_.has(event, 'added') || _.has(event, 'removed')) {
                        var method = event.added ? 'PUT' : 'DELETE',
                            url = this.data.get('uri'),
                            data = this.data.get('data'),
                            params = {};
                        if (this.page === 'agent') {
                            url += '/tag';
                        }
                        params[pageKeys[this.page].primaryKey] = event.added ? event.added.id : event.removed.id;
                        if (data.tags && event.added) {
                            if (event.added.id === event.added.text) {
                                params.tag_name = event.added.text;
                                delete params.tag_id;
                            }
                        }
                        this.processTag(url, method, JSON.stringify(params));
                    }
                },
                renderTags: function (model) {
                    if (model.get('http_status') !== 200) {
                        throw new Error('API was not able to fetch data');
                    }
                    var $select = this.$('input'),
                        data = model.get('data')[pageKeys[this.page].name],
                        placeholder = pageKeys[this.page].placeholder,
                        that = this;
                    $select.select2({
                        initSelection: function (element, callback) {
                            var tags = JSON.parse(element.val()),
                                results = [];
                            _.each(tags, function (tag) {
                                results.push({id: tag[pageKeys[that.page].primaryKey] || tag.id, text: tag[pageKeys[that.page].text] || tag.text});
                            });
                            callback(results);
                        },
                        tokenSeparators: [','],
                        ajax: {
                            url: pageKeys[that.page].searchURL,
                            data: function (term) {
                                var params = {
                                    query: term
                                };
                                return term ? params : '';
                            },
                            results: function (data) {
                                var results = [];
                                if (data.http_status === 200) {
                                    _.each(data.data, function (object) {
                                        results.push({id: object.agent_id || object.tag_id, text: object.tag_name || object.computer_name});
                                    });
                                    return {results: results, more: false, context: results};
                                } else {
                                    app.notifyOSD.createNotification('!', 'Error', data.message);
                                }
                            }
                        },
                        formatResult: that.formatTag,
                        formatSelection: that.formatTag,
                        tags: true,
                        createSearchChoice: pageKeys[this.page].createTag,
                        multiple: true,
                        placeholder: placeholder,
                        width: '100%'
                    });
                    $select.select2('val', [JSON.stringify(data)]);
                },
                formatTag: function (tag) {
                    return tag.text;
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
