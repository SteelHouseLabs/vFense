define(
    ['jquery', 'underscore', 'backbone', 'highstocks'],
    function ($, _, Backbone, Highcharts) {
        'use strict';
        var exports = {};
        exports.name = 'highStock';
        exports.models = {
            Main: Backbone.Model.extend({
                //model code
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    this.$el.attr('id', this.cid);
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    var chartOptions,chart;
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }
                    this.$el.empty();
                    chartOptions = _.clone(this.model.attributes);
                    chartOptions.chart.renderTo = this.cid;
                    chart = new Highcharts.StockChart(chartOptions);
                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
