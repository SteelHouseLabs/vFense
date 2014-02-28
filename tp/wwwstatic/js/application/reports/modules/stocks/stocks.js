define(
    ['jquery', 'underscore', 'backbone', 'crel', 'app', 'highstocks','modals/panel', 'jquery.ui.datepicker'],
    function ($, _, Backbone, crel, app, Highcharts, Panel) {
        'use strict';
        var exports = {}, Modal, panel;
        Modal = Panel.View.extend({
            span: '6',
            renderPanelContent: function (apps) {
                var fragment = crel('div', {class: 'list'}),
                    items = crel('div', {class: 'items row-fluid'});
                _.each(apps, function (app) {
                    $(items).append(crel('div', {class: 'item'},
                        crel('a', {href: '#patches/os/' + app.app_id},
                            crel('span', {class: 'span8'}, app.name),
                            crel('span', {class: 'span4 alignRight'}, app.version)
                        )
                    ));
                });
                fragment.appendChild(items);
                return fragment;
            }
        });
        panel = new Modal();
        exports.name = 'stocks';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults:{
                    URL: '',
                    keys: []
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                keys: [],
                data: [],
                tagName: 'div',
                className: [exports.name].join(' '),
                defaultOptions: {},
                initialize: function () {
                    this.$el.attr('id', this.cid);
                    this.chartOptions = {};

                    this.collection = new Backbone.Collection();
                    this.collection.url = this.model.get('URL');
                    this.keys = this.model.get('keys');
                    this.listenTo(this.collection, 'request', this.showLoading);
                    this.listenTo(this.collection, 'sync', this.fetchSuccess);
                    this.listenTo(this.collection, 'error', this.fetchError);
                    this.listenTo(this.model, 'change:URL', this.updateCollection);
                    this.listenTo(this.model, 'change', this.renderChartWrapper);
                    this.addSubViews(panel);
                    return this;
                },
                events: {
                    'change input.highcharts-range-selector'    : 'dateChange'
                },
                dateChange : function () {
                    var minDate, maxDate;
                    minDate = new Date(this.$('input[name=min]').val()).getTime() /1000;
                    maxDate = new Date(this.$('input[name=max]').val()).getTime() /1000;
                    if(minDate < maxDate) {
                        this.$el.empty();
                        this.collection.url = this.model.get('URL')+'?start_date='+minDate+'&end_date='+maxDate;
                        this.collection.fetch();
                    }
                    return this;
                },
                showLoading: function () {
                    var $el = this.$el;
                    this._pinwheel = this._pinwheel || new app.pinwheel();
                    $el.empty().append(this._pinwheel.el);
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
                    var jsonDataCollection = this.collection.toJSON();
                    this.data = jsonDataCollection[0].data;

                    var keyIndex, dataIndex, seriesOptions = [];

                    for(keyIndex = 0; keyIndex <  this.keys.length; keyIndex = keyIndex + 1)
                    {
                        var currentKey = this.keys[keyIndex];
                        var currentKeyValues = [];

                        for (dataIndex = 0; dataIndex < this.data.length; dataIndex = dataIndex + 1) {
                            var currentDetail;
                            currentKeyValues[dataIndex] = { };
                            currentKeyValues[dataIndex].x = this.data[dataIndex].timestamp * 1000;
                            currentDetail = _.find(this.data[dataIndex].details, function(detail) {
                                    return(detail.group === currentKey);
                                });
                            if(currentDetail) {
                                currentKeyValues[dataIndex].y = currentDetail.reduction.count;
                                currentKeyValues[dataIndex].details = currentDetail.reduction.apps;
                            } else {
                                currentKeyValues[dataIndex].y = 0;
                                currentKeyValues[dataIndex].details = [];
                            }
                        }
                        seriesOptions.push({
                            name:currentKey,
                            data:currentKeyValues
                        });

                    }

                    this.chartOptions = {
                        chart: {
                            type: 'column',
                            renderTo:this.cid
                        },
                        credits: {
                            enabled: false
                        },
                        series: seriesOptions,
                        colors: ['#918186', '#F9C65E', '#FA2A00'],


                        yAxis: {
                            title: {
                                text:'No Of Applications'
                            },
                            plotLines: [{
                                value: 0,
                                width: 2,
                                color: 'silver'
                            }]
                        },
                        plotOptions: {
                            column: {
                                stacking: 'normal',
                                cursor: 'pointer',
                                point: {
                                    events: {
                                        click: function() {
                                            panel.setHeaderHTML(this.series.name);
                                            panel.setContentHTML(panel.renderPanelContent(this.details));
                                            panel.open();
                                        }
                                    }
                                },
                                dataGrouping: {
                                    enabled: false
                                }
                            }
                        },

                        tooltip: {
                            pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
                            yDecimals: 2
                        }

                    };
                    this.chart = new Highcharts.StockChart(this.chartOptions, function(chart){

                        // apply the date pickers
                        setTimeout(function () {
                            $('input.highcharts-range-selector', $(chart.container).parent())
                                .datepicker();
                        }, 0);

                    });

                    return this;
                }
            })
        };
        return exports;
    }
);
