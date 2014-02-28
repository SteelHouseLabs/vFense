define(
    ['jquery', 'underscore', 'backbone', 'crel'],
    function ($, _, Backbone, crel) {
        'use strict';
        var exports = {};
        exports.name = 'statBox';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    'source': '',
                    'linkTo': '',
                    'linkKey': '',
                    'key': '',
                    'class': '',
                    'update': false
                }
            })
        };
        window.statBox = {};
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'dl',
                className: ['widget'].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('column view requires a column model');
                    }
                    this.$el.addClass(this.model.get('class'));
                    this.data = new (Backbone.Model.extend({
                        url: this.model.get('source')
                    }))();
                    this.listenTo(this.data, 'sync', this.updateValue);
                    return this;
                },
                render: function () {
                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html(this.layout());
                    }
                    if (this.data.url) { this.data.fetch(); }
                    return this;
                },
                layout: function () {
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(crel('dt', this.getTitle() || 'Empty'));
                    fragment.appendChild(crel('dd', '--'));
                    return fragment;
                },
                capitaliseFirstLetter: function (string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                },
                getTitle: function () {
                    var that = this,
                        title = this.model.toJSON().key.split('_');
                    _.each(title, function (word, i) {
                        title[i] = that.capitaliseFirstLetter(word);
                    });
                    return title.join(' ');
                },
                updateValue: function () {
                    var data = this.data.get('data'),
                        key = this.model.get('key'),
                        link = this.model.get('linkTo'),
                        $dd = this.$('dd'),
                        value = _.findWhere(data, {name: key});
                    if (_.isUndefined(value)) { value = 'Error'; }
                    $dd.empty();
                    if (link) {
                        $dd.append(crel('a', {href: link}, value.count));
                    } else {
                        $dd.text(value.count);
                    }
                    return this;
                }
            })
        };
        return exports;
    }
);
