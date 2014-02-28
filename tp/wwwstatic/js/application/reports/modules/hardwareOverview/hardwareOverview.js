define(
    ['jquery', 'underscore', 'backbone', 'crel'],
    function ($, _, Backbone, crel) {
        'use strict';
        var templates = {},
            exports = {};
        exports.name = 'hardwareOverview';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: ''
                }
            })
        };

        function pluckSum(obj, key) {
            return _.reduce(
                _.pluck(obj, key),
                function (sum, num) {
                    var add = $.isNumeric(num) ? +num : 0;
                    return sum + add;
                },
                0 // initial sum
            );
        }

        function pluckAverage(obj, key) {
            return obj.length > 0 ? pluckSum(obj, key) / obj.length : 0;
        }

        _.extend(templates, {
            overview: function (data) {
                var fragment = document.createDocumentFragment(),
                    content;
                content = crel('dl', {class: 'inline'},
                    crel('dt', 'Computer Name'),
                        crel('dd', data.computer_name),
                    crel('dt', 'DNS Name'),
                        crel('dd', data.dns_name),
                    crel('dt', 'Number of Processors'),
                        crel('dd', data.hardware.cpu.length),
                    crel('dt', 'Total Number of Cores'),
                        crel('dd', pluckSum(data.hardware.cpu, 'cores')),
                    crel('dt', 'Processor Speed (Average)'),
                        crel('dd', pluckAverage(data.hardware.cpu, 'speed_mhz') + ' Mhz')
                );
                return fragment.appendChild(crel('dl',
                    crel('dt', 'Hardware Overview:'), crel('dd', content)
                ));
            }
        });

        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('hardwareOverview view requires a model');
                    }
                    var nodeID = this.model.get('id');
                    this.data = new (Backbone.Model.extend({
                        baseUrl: '/api/nodes.json',
                        url: function () {
                            return this.baseUrl + '?id=' + nodeID;
                        }
                    }))();
                    this.listenTo(this.data, 'sync', this.renderOverview);
                    return this;
                },
                render: function () {
                    this.$el.html(crel('div', {'class': 'centerLine'}, 'Loading Hardware Overview'));
                    if (this.data.url) { this.data.fetch(); }
                    return this;
                },
                renderOverview: function () {
                    this.$el.html(templates.overview(this.data.get('data')[0]));
                    return this;
                }
            })
        };

        return exports;
    }
);