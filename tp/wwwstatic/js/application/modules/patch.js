define(
    ['jquery', 'underscore', 'backbone', 'app', 'reports/report'],
    function ($, _, Backbone, app, reports) {
        'use strict';
        var exports = {
                View: app.createChild(reports.View)
            },
            template = function (params) {
                return {
                    rows: [
                        {
                            rowHeight: 3,
                            columns: [
                                {
                                    moduleName: 'reports/modules/patchInfo/patchInfo',
                                    moduleJSON: {
                                        id: params.id,
                                        type: params.type
                                    },
                                    moduleSpan: 6
                                },
                                {
                                    moduleName: 'chart',
                                    moduleJSON: {
                                        type: 'column',
                                        URL: 'api/v1/app/' + params.type + '/' + params.id,
                                        selectedKeys: {'name':'name','type':'number'},
                                        parse: function (model) {
                                            return model.agent_stats;
                                        },
                                        APIName: 'Agents by Status',
                                        chartOptions: {
                                            colors: ['#F9C65E', 'green', '#3A87AD', '#FA2A00'],
                                            xAxis: {
                                                title: {
                                                    text: null
                                                },
                                                labels: {
                                                    enabled: false
                                                }
                                            },
                                            yAxis: { labels: { enabled: false }},
                                            plotOptions: {
                                                column: {
                                                    dataLabels: {
                                                        enabled: true
                                                    }
                                                }
                                            },
                                            tooltip: {
                                                formatter: function() {
                                                    return '<b>'+ this.series.name + ':</b> '+ this.y;
                                                }
                                            }
                                        }
                                    },
                                    moduleSpan: 6
                                }
                            ]
                        },
                        {
                            rowHeight: 0,
                            columns: [
                                {
                                    moduleName: 'reports/modules/patchManager/patchManager',
                                    moduleJSON: {
                                        'id': params.id,
                                        'type': params.type,
                                        'page': 'patch'
                                    },
                                    moduleSpan: 12,
                                    class: 'noShadow'
                                }
                            ]
                        }
                    ]
                };
            };

        _.extend(exports.View.prototype, {
            template: template
        });

        return exports;
    }
);