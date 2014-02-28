define(
    ['jquery', 'underscore', 'backbone', 'highstocks','highcharts-more','crel'],
    function ($, _, Backbone, Highcharts, crel) {
        'use strict';
        var exports = {};
        exports.name = 'gauges';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults:{
                    URL:'',
                    key:'',
                    APIName:'',
                    updateTime:60000,
                    chartOptions:{}
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                defaultOptions: {
                    chart: {
                        type: 'gauge',
                        plotBackgroundColor: null,
                        style: {
                            width: '100%',
                            height: '100%'
                        },
                        margin: [0, 0, 0, 0],
                        spacingTop: 0,
                        spacingBottom: 0,
                        spacingLeft: 0,
                        spacingRight: 0
                    },
                    title: {
                        text: ''
                    },
                    credits: { enabled: false },
                    pane: [{
                        startAngle: -85,
                        endAngle: 85,
                        background: null,
                        center: ['50%','32%'],
                        size: '50%'
                    }],
                    yAxis: [{
                        min: 0,
                        max: 100,
                        minorTickPosition: 'outside',
                        tickPosition: 'outside',
                        labels: {
                            rotation: 'auto',
                            distance: 20
                        },
                        plotBands: [{
                            from: 70,
                            to: 90,
                            color: '#FFCC00',
                            innerRadius: '100%',
                            outerRadius: '110%'
                        }, {
                            from: 90,
                            to: 100,
                            color: '#F00',
                            innerRadius: '100%',
                            outerRadius: '120%'
                        }],
                        title: {
                            text: null
                        }
                    }],
                    plotOptions: {
                        gauge: {
                            dataLabels: {
                                enabled: false
                            },
                            dial: {
                                radius: '100%'
                            }
                        }
                    },
                    series: [{
                        data: [0],
                        yAxis: 0
                    }]
                },
                updater: function (chart, that) {
                    setInterval(function () {
                        that.collection.fetch();
                    }, that.model.get('updateTime'));
                },
                initialize: function () {
                    this.chartOptions = $.extend(true, {}, this.defaultOptions, this.model.get('chartOptions'));
                    this.$el.attr('id', this.cid);
                    this.chartOptions.chart.renderTo = this.cid;
                    this.collection = new Backbone.Collection();
                    this.collection.url = this.model.get('URL');
                    this.listenTo(this.collection, 'request', this.showLoading);
                    this.listenTo(this.collection, 'sync', this.fetchSuccess);
                    this.listenTo(this.collection, 'error', this.fetchError);
                    return this;
                },
                showLoading: function() {
                    if(!this.chart) {
                        this.$el.html('Loading Gauge...');
                    }
                    return this;
                },
                fetchSuccess: function() {
                    if(!this.chart) {
                        this.$el.empty();
                    }
                    this.renderChart();
                    return this;
                },
                fetchError: function() {
                    this.$el.html('Error Fetching Data...');
                    return this;
                },
                render: function () {
                    if (this.collection.url) {
                        this.collection.fetch();
                    } else {
                        this.$el.append(crel('div', {'class': 'centerLine'}, 'Nothing to load...'));
                    }
                    return this;
                },
                renderChart: function() {
                    var dataCollection, models, data;
                    if (this.collection && this.collection instanceof Backbone.Collection) {
                        dataCollection = this.collection.toJSON();
                        if (dataCollection[0].pass === true && (typeof dataCollection[0].data !== 'undefined')) {
                            models = dataCollection[0].data;
                            if(_.isArray(models)) {
                                data = this.averageArray(_.pluck(models,this.model.get('key')));
                            }
                            else {
                                data = Math.round( parseFloat(models[this.model.get('key')]) * 100) / 100;
                            }
                        } else {
                            data = 0;
                        }
                        if (isNaN(data)) {
                            data = 0;
                        }
                        if(this.chart){
                            var currentValue = this.chart.series[0].points[0];
                            currentValue.update(data, true);
                            this.chart.setTitle({text: this.model.get('APIName') + '( ' + data + '% )'});
                            return this;
                        }
                        this.chartOptions.series[0].data[0] = data;
                        this.chartOptions.title.text = this.model.get('APIName') + '( ' + data + '% )';
                        var that = this;
                        this.chart = new Highcharts.Chart(this.chartOptions, function () { that.updater(this, that); });
                        return this;
                    }
                    return this;

                },
                averageArray: function ( array ){
                    var sum = 0, i,avg;
                    for(i = 0; i < array.length; i = i + 1){
                        sum += parseFloat(array[i]);
                    }
                    avg = sum/array.length;
                    return Math.round(avg * 100) / 100;
                }
            })
        };
        return exports;
    }
);
