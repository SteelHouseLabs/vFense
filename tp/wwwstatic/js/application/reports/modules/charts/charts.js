define(
    ['jquery', 'underscore', 'backbone', 'highstocks', 'crel'/*, 'text!./templates/chartSettings.html'*/],
    function ($, _, Backbone, Highcharts, crel/*, myTemplate*/) {
        'use strict';
        var exports = {};
        exports.name = 'charts';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    type: 'line',
                    URL: '',
                    selectedKeys: [],
                    availableKeys: [],
                    APIName: '',
                    chartOptions: {}
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                defaultOptions: {
                    chart: {
                        style: {
                            width: '100%',
                            height: '100%'
                        }
                    },
                    title: {
                        text: ''
                    },
                    credits: {
                        enabled: false
                    },
                    xAxis: {
                        title: {},
                        showLastLabel: true
                    },
                    yAxis: {
                        title: {
                            text: ''
                        }
                    }
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
                    this.listenTo(this.model, 'change:URL', this.updateCollection);
                    this.listenTo(this.model, 'change', this.renderChartWrapper);
                    return this;
                },
                showLoading: function () {
                    this.$el.html(crel('div', {'class': 'centerLine'}, 'Loading chart...'));
                    return this;
                },
                fetchSuccess: function () {
                    this.$el.empty();
                    this.renderChart();
                    return this;
                },
                fetchError: function () {
                    this.$el.html(crel('div', {'class': 'centerLine'}, 'Error Fetching Data...'));
                    return this;
                },
                updateCollection: function (model, value) {
                    this.collection.url = value;
                    this.collection.fetch();
                    return this;
                },
                renderChartWrapper: function (model) {
                    if (model.hasChanged('URL')) {
                        return this;
                    }
                    this.renderChart();
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
                renderChart: function () {
                    var dataCollection, models, that, categories, series, length, i, centerFactor, keys, data = [], parse;
                    if (this.chart) {
                        this.chart.destroy();
                    }
                    if (this.collection) {
                        dataCollection = this.collection.toJSON();
                        models = dataCollection[0].data;
                        keys = this.model.get('selectedKeys');
                        parse = this.model.get('parse') || null;
                        that = this;
                        if (_.isFunction(parse)) {
                            models = parse(models);
                        }
                        if (this.collection instanceof Backbone.Collection) {
                            if (keys.type === 'string') {
                                that.chartOptions.xAxis.categories = _.pluck(models, keys.name);
                                if (!_.isNull(that.chartOptions.xAxis.title.text)) {
                                    that.chartOptions.xAxis.title.text = keys.name;
                                }
                                _.map(models, function (item) {
                                    data.push(item.count);
                                });
                                that.chartOptions.series = [{data: data, name: 'available'}];
                            } else {
                                this.chartOptions.series = _.compact(_.map(models, function (item) {
                                    return {
                                        data: [item.count],
                                        name: item[keys.name]
                                    };
                                }));
                            }
                        }
                    }
                    this.chartOptions.chart.type = this.model.get('type');
                    if (this.chartOptions.chart.type === 'pie') {
                        var that = this;
                        var categories = this.chartOptions.xAxis.categories;
                        var series = this.chartOptions.series;
                        var length = series.length;
                        this.chartOptions.series = [{
                            data:[],
                            dataLabels: {
                                enabled: true,
                                formatter: function () {
                                    return '<b>' + this.point.name + '</b>: '+ this.percentage.toFixed(2) + ' %';
                                }
                            }
                        }];
                        var that = this;
                        _.each(this.model.get('selectedKeys'), function (item) {

                            var centerX = centerFactor + i * (100 / length) + '%', centerY = '50%';
                            i = i + 1;
                            /*if (categories.length) {
                             return {
                             dataLabels: {
                             enabled: true,
                             formatter: function () {
                             return '<b>' + this.point.name + '</b>: <br>' + item.name + ' ' + this.percentage.toFixed(2) + ' %';
                             }
                             },
                             center: [centerX, centerY],
                             data: _.zip(categories, item.data),
                             name: item.name
                             };
                             }*/
                            //console.log(models[0][item.name]);
                            //console.log(_.pluck(models, item.name));
                            var dataArray = [];
                            dataArray.push(item.name,models[item.name]);
                            that.chartOptions.series[0].data.push(dataArray);
                        });
                    }
                    this.chartOptions.title.text = this.model.get('APIName');
                    this.chart = new Highcharts.Chart(this.chartOptions);
                    return this;
                }
            })/*,
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name, 'settings'].join(' '),
                initialize: function () {
                    this.template = myTemplate;
                    this.chartableAPIList = new Backbone.Collection();
                    this.chartableAPIList.url = 'http://127.0.0.1:8000/chartableAPIList.json';
                    this.listenTo(this.chartableAPIList, 'request', this.showLoading);
                    this.listenTo(this.chartableAPIList, 'sync', this.fetchSuccess);
                },
                events: {
                    'change select': 'updateModel',
                    'change #chartableAPIList': 'updateKeys'
                },
                showLoading: function () {
                    this.$el.find('#chartableAPIList').html('<option>Loading...</option>');
                    return this;
                },
                fetchSuccess: function (collection) {
                    var that;
                    this.chartableAPIListJSON = collection.toJSON();
                    this.$el.find('#chartableAPIList').empty();
                    that = this;
                    $('<option/>', {
                        value: '',
                        text: 'Select a Chartable API'
                    }).appendTo(that.$el.find('#chartableAPIList'));
                    _.each(this.chartableAPIListJSON, function (item) {
                        $('<option/>', {
                            value: item.url,
                            text: item.name
                        }).appendTo(that.$el.find('#chartableAPIList'));
                    });
                    return this;
                },
                updateModel: function () {
                    var modelKeys = this.model.get('availableKeys'), keys = [], that = this;
                    if (that.$el.find('#xKey').val()) {
                        keys.push(_.find(modelKeys, function (item) {
                            return item.name === that.$el.find('#xKey').val();
                        }));
                    }
                    this.$el.find('.dynamicSeries').each(function () {
                        var that = this;
                        if ($(that).val()) {
                            keys.push(_.find(modelKeys, function (item) {
                                return item.name === $(that).val();
                            }));
                        }
                    });
                    this.model.set({
                        type: this.$el.find('#chartType').val(),
                        selectedKeys: keys,
                        URL: this.$el.find('#chartableAPIList').val()
                    });
                    return this;
                },
                updateKeys: function (e) {
                    var limit, i, select, selectLabel,
                        selectedAPIURL = e.currentTarget.value,
                        selectedAPIModel = _.findWhere(this.chartableAPIListJSON, {
                            url: selectedAPIURL
                        }),
                        keys = selectedAPIModel.keys,
                        xKeys = _.pluck(keys, 'name'),
                        that = this,
                        $series1 = this.$el.find('#xKey');
                    this.initializeModel(e.currentTarget.value);
                    $series1.empty();
                    $('<option/>', {
                        value: '',
                        text: 'Select a Series Key'
                    }).appendTo($series1);
                    _.each(xKeys, function (item) {
                        $('<option/>', {
                            value: item,
                            text: item
                        }).appendTo($series1);
                    });
                    $series1.val(xKeys[0]);
                    this.$el.find('#dynamicSeries').empty();
                    limit = keys.length - 1 > 4 ? 4 : keys.length - 1;
                    for (i = 0; i < limit; i = i + 1) {
                        select = $('<select/>', {
                            html: '',
                            'class': 'dynamicSeries'
                        });
                        selectLabel = $('<label/>', {
                            html: 'Series' + (i + 2),
                            'class': 'dynamicSeriesLabel'
                        });
                        $('<option/>', {
                            value: '',
                            text: 'Select a Series Key'
                        }).appendTo(select);
                        this.updateKeysSelect(keys, select);
                        select.val(xKeys[i + 1]);
                        that.$el.find('#dynamicSeries').append(selectLabel);
                        that.$el.find('#dynamicSeries').append(select);
                    }
                },
                updateKeysSelect: function (keys, select) {
                    _.each(keys, function (item) {
                        if (item.type !== 'string') {
                            $('<option/>', {
                                value: item.name,
                                text: item.name
                            }).appendTo(select);
                        }
                    });
                },
                initializeModel: function (value) {
                    var selectedAPIModel = _.findWhere(this.chartableAPIListJSON, {
                        url: value
                    }), keys = selectedAPIModel.keys;
                    this.model.set({
                        selectedKeys: keys,
                        availableKeys: keys,
                        APIName: selectedAPIModel.name
                    }, {
                        silent: true
                    });
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) {
                        this.beforeRender();
                    }
                    if (this.$el.children().length === 0) {
                        this.layout();
                    }
                    if (this.onRender !== $.noop) {
                        this.onRender();
                    }
                    return this;
                },
                layout: function () {
                    var tmpl = _.template(this.template);
                    this.$el.empty();
                    this.$el.append(tmpl());
                    this.chartableAPIList.fetch();
                }
            })
            */
        };
        return exports;
    }
);
