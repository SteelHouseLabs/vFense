define(
    ['jquery', 'underscore', 'backbone', 'crel'],
    function ($, _, Backbone, crel) {
        'use strict';
        var exports = {};
        exports.name = 'definitionList';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    source: '',
                    keys: [],
                    titles: [],
                    params: [] //objects with key name and value
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'dl',
                className: [exports.name].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('definitionList view requires a definitionList model');
                    }
                    var model = this.model;
                    this.data = new (Backbone.Model.extend({
                        url: function () {
                            var params = model.get('params'),
                                source = model.get('source');
                            return source + '?' + $.param(params);
                        }
                    }))();
                    this.listenTo(this.data, 'sync', this.renderList);
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html('');
                    }
                    if (this.data.url) { this.data.fetch(); }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                getItems: function (data, key, fragment, title) {
                    var value, listTitle,
                        that = this;
                    if (typeof key === 'string') {
                        value = data[key];
                    } else if (_.isArray(key)) {
                        _.each(key, function (keypair, i) {
                            value = typeof keypair === 'object' ? data[keypair.name] : data[keypair];
                            listTitle = title[i] || null;
                            if (typeof listTitle === 'string') { fragment.appendChild(crel('dt', listTitle)); }
                            if (_.isArray(value)) {
                                if (_.isObject(listTitle)) { fragment.appendChild(crel('dt', listTitle.name)); }
                                _.each(value, function (name) {
                                    that.getItems(name, keypair.value, fragment, listTitle.value);
                                });
                            } else {
                                fragment.appendChild(crel('dd', value));
                            }
                        });
                        value = null;
                    } else {
                        value = data[key.name];
                    }
                    if (value) {
                        if (typeof value === 'string') {
                            fragment.appendChild(crel('dt', title));
                            fragment.appendChild(crel('dd', value));
                        } else if (_.isArray(value) && value.length) {
                            fragment.appendChild(crel('dt', title.name));
                            _.each(value, function (object) {
                                if (_.isArray(key.value)) {
                                    _.each(key.value, function (name, l) {
                                        fragment.appendChild(crel('dt', title.value[l]));
                                        fragment.appendChild(crel('dd', object[name]));
                                    });
                                } else {
                                    fragment.appendChild(crel('dt', title.value));
                                    fragment.appendChild(crel('dd', object[key.value]));
                                }
                            });
                        } else if (!_.isArray(value)) {
                            fragment.appendChild(crel('dt', title.name));
                            this.getItems(value, key.value, fragment, title.value);
                        }
                    }
                },
                renderList: function () {
                    if (!this.data.get('pass')) {
                        throw new Error('Could not fetch data from server');
                    }
                    var key, fragment = document.createDocumentFragment(),
                        keys = this.model.get('keys'),
                        titles = this.model.get('titles'),
                        data = this.data.get('data')[0],
                        $el = this.$el,
                        that = this;
                    _.each(titles, function (title, i) {
                        key = keys[i];
                        that.getItems(data, key, fragment, title);
                    });
                    $el.append(fragment);
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    this.template = myTemplate;
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
