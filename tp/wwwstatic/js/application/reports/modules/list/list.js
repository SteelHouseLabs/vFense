define(
    ['jquery', 'underscore', 'backbone', 'crel', 'moment', 'modules/lists/pageable'],
    function ($, _, Backbone, crel, moment, Pager) {
        'use strict';
        var exports = {};
        exports.name = 'list';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    source: '',
                    keys: [],
                    columnTitles: [],
                    className: [],
                    showFooter: true,
                    link: false,
                    linkKey: '',
                    title: false,
                    itemKeys: [
                        {key:'', name: '', className: ''}
                    ]
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('list view requires a list model');
                    }
                    var url = this.model.get('source'),
                        params = this.model.get('params'),
                        keys = this.model.get('keys'),
                        columnTitles = this.model.get('columnTitles'),
                        classes = this.model.get('className'),
                        itemKeys = [];
                    _.each(keys, function (key, i) {
                        itemKeys.push({key: key, name: columnTitles[i], className: classes[i]});
                    });
                    this.collection = new (Pager.Collection.extend({
                        url: function () {
                            return (_.isEmpty(params)) ? '/' + url : '/' + url + '?' + $.param(params);
                        }
                    }))();
                    this.pager = Pager.View.extend({
                        model: this.model,
                        collection: this.collection,
                        itemKeys: itemKeys,
                        renderModel: this.renderModel,
                        layoutHeader: this.layoutHeader,
                        getSpan: this.getSpan,
                        showFooter: this.model.get('showFooter')
                    });
                    this.renderList();
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html(this.layout());
                    }
                    if (this.collection.url) { this.collection.fetch(); }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                layout: function () {
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(crel('div'));
                    return fragment;
                },
                layoutHeader: function ($left, $right) {
                    var title = this.model.get('title');
                    if (title) {
                        $right.removeClass('pull-right').append(crel('strong', title));
                    }
                },
                getSpan: function (index) {
                    return this.model.get('className')[index];
                },
                renderModel: function (model) {
                    var fragment = document.createDocumentFragment(),
                        keys = this.model.get('keys'),
                        item = $(crel('div', {class: 'item row-fluid'})),
                        link = false,
                        that = this;
                    if (this.model.get('link')) {
                        link = item;
                        item = $(crel('a', {href: this.model.get('link') + model.get(this.model.get('linkKey'))}));
                        link.append(item);
                    }
                    _.each(keys, function (key, i) {
                        var data = model.get(key);
                        if (key.indexOf('date') !== -1) {
                            item.append(crel('span', {class: that.getSpan(i)}, data ? moment(data * 1000).format('L') : 'N/A'));
                        } else {
                            item.append(crel('span', {class: that.getSpan(i)}, data));
                        }
                    });
                    if (link) {
                        fragment.appendChild(link[0]);
                    } else {
                        fragment.appendChild(item[0]);
                    }
                    return fragment;
                },
                layoutLegend: function () {
                    var titles = this.model.get('columnTitles'),
                        $header = this.$el.find('header'),
                        that = this, legend;
                    legend = crel('div', {class: 'legend row-fluid'});
                    _.each(titles, function (title) {
                        $(legend).append(crel('strong',{class: that.getSpan()}, title));
                    });
                    $header.after($(legend));
                    return this;
                },
                renderList: function () {
                    var $el = this.$el,
                        pageView = new this.pager();
                    pageView.render();
                    $el.append(pageView.$el);
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

                    this.$el.empty();

                    //this.$el.append(tmpl({model: model}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
