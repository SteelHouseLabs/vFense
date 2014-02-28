define(
    ['jquery', 'underscore', 'backbone', 'app', 'reports/report'],
    function ($, _, Backbone, app, reports) {
        'use strict';
        var exports = {
                View: app.createChild(reports.View)
            },
            template = function (tagID) {
                return {
                    rows: [
                        {
                            rowHeight: 0,
                            columns: [
                                {
                                    moduleName: 'reports/modules/nodeTags/nodeTags',
                                    moduleJSON: {
                                        id: tagID,
                                        page: 'tag'
                                    },
                                    moduleSpan: 12
                                }
                            ]
                        },
                        {
                            rowHeight: 3,
                            columns: [
                                {
                                    moduleName: 'reports/modules/tagInfo/tagInfo',
                                    moduleJSON: {
                                        id: tagID
                                    },
                                    moduleSpan: 6
                                },
                                {
                                    moduleName: 'chart',
                                    moduleJSON: {
                                        type: 'column',
                                        URL: 'api/v1/tag/' + tagID + '/graphs/bar/severity',
                                        selectedKeys: {'name':'severity','type':'number'},
                                        APIName: 'Available Applications by Severity',
                                        chartOptions: {
                                            colors: ['#918186', '#FA2A00', '#F9C65E'],
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
                            rowHeight: 3,
                            columns: [
                                {
                                    moduleName: 'chart',
                                    moduleJSON: {
                                        type: 'bar',
                                        URL: 'api/v1/tag/' + tagID + '/stats_by_os',
                                        selectedKeys: {'name': 'os', 'type': 'string'},
                                        APIName: 'Available Applications by OS',
                                        chartOptions: {
                                            xAxis: {
                                                title: {
                                                    text: null
                                                }
                                            },
                                            legend: {
                                                enabled: false
                                            }
                                        }
                                    },
                                    moduleSpan: 12
                                }
                                /*{
                                    moduleName: 'chart',
                                    moduleJSON: {
                                        type: 'pie',
                                        URL: 'api/networkData?tagid=' + tagID,
                                        selectedKeys: [{'name': 'critical_available', 'type': 'number'}, {'name': 'recommended_available', 'type': 'number'}, {'name': 'optional_available', 'type': 'number'}, {'name': 'installed', 'type': 'number'}, {'name': 'failed', 'type': 'number'}, {'name': 'pending', 'type': 'number'}],
                                        APIName: 'Patches by Status',
                                        chartOptions: {
                                            xAxis: {
                                                title: {
                                                    text: null
                                                }
                                            },
                                            legend: {
                                                enabled: false
                                            }
                                        }
                                    },
                                    moduleSpan: 6
                                }*/
                            ]
                        },
                        {
                            rowHeight: 6,
                            columns: [
                                {
                                    moduleName: 'stocks',
                                    moduleJSON: {
                                        URL: 'api/v1/tag/' + tagID + '/graphs/column/range/apps/os',
                                        keys: ['Optional', 'Recommended','Critical']
                                    },
                                    moduleSpan: 12
                                }
                            ]
                        },
                        {
                            rowHeight: 0,
                            columns: [
                                {
                                    moduleName: 'reports/modules/patchManager/patchManager',
                                    moduleJSON: {
                                        'id': tagID,
                                        'page': 'tag'
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