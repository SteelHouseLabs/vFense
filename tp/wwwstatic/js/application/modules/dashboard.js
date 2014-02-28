define(
    ['jquery', 'underscore', 'backbone', 'app', 'reports/report'],
    function ($, _, Backbone, app, reports) {
        'use strict';
        var exports = {
                View: app.createChild(reports.View)
            },
            template = {
                rows: [
                    {
                        rowHeight: 1,
                        columns: [
                            {
                                moduleName: 'reports/modules/statBox/statBox',
                                moduleJSON: {
                                    'source': 'api/v1/dashboard/widgets/unique_count',
                                    'key': 'OS',
                                    'class': 'warning',
                                    'linkTo': '/#patches/os?status=available'
                                },
                                moduleSpan: 3
                            },
                            {
                                moduleName: 'reports/modules/statBox/statBox',
                                moduleJSON: {
                                    'source': 'api/v1/dashboard/widgets/unique_count',
                                    'key': 'Custom',
                                    'class': 'success',
                                    'linkTo': '/#patches/custom?status=available'
                                },
                                moduleSpan: 3
                            },
                            {
                                moduleName: 'reports/modules/statBox/statBox',
                                moduleJSON: {
                                    'source': 'api/v1/dashboard/widgets/unique_count',
                                    'key': 'Supported',
                                    'class': 'info',
                                    'linkTo': '/#patches/supported?status=available'
                                },
                                moduleSpan: 3
                            },
                            {
                                moduleName: 'reports/modules/statBox/statBox',
                                moduleJSON: {
                                    'source': 'api/v1/dashboard/widgets/unique_count',
                                    'key': 'Pending',
                                    'class': 'info',
                                    'linkTo': '/#patches/os?status=pending'
                                },
                                moduleSpan: 3
                            }
                        ]
                    },
                    {
                        rowHeight: 3,
                        columns: [
                            /*{
                                moduleName: 'chart',
                                moduleJSON: {
                                    type: 'pie',
                                    URL: 'api/networkData',
                                    selectedKeys: [{'name': 'optional_pending', 'type': 'number'}, {'name': 'available', 'type': 'number'}, , {'name': 'critical_installed', 'type': 'number'}, , {'name': 'critical_available', 'type': 'number'}, , {'name': 'recommended_installed', 'type': 'number'}, , {'name': 'optional_failed', 'type': 'number'}],
                                    APIName: 'Patches by OS',
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
                            },*/
                            {
                                moduleName: 'chart',
                                moduleJSON: {
                                    type: 'bar',
                                    URL: 'api/v1/dashboard/graphs/bar/stats_by_os',
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
                                moduleSpan: 6
                            },
                            {
                                moduleName: 'chart',
                                moduleJSON: {
                                    type: 'column',
                                    URL: 'api/v1/dashboard/graphs/bar/severity',
                                    selectedKeys: {'name':'severity','type':'number'} ,
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
                                            },
                                            series: {
                                                cursor: 'pointer',
                                                point: {
                                                    events: {
                                                        click: function() {
                                                            var name = this.series.name;
                                                            document.location.hash = '#patches/os?severity=' + name;
                                                        }
                                                    }
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
                                moduleName: 'list',
                                moduleJSON: {
                                    source: 'api/v1/dashboard/widgets/top_needed',
                                    keys: ['name', 'rv_severity', 'release_date', 'count'],
                                    columnTitles: ['Name', 'Severity', 'Release Date', 'Nodes'],
                                    className: ['span5', 'span2', 'span3', 'span2 alignRight'],
                                    showFooter: false,
                                    link: '#patches/os/',
                                    linkKey: 'app_id',
                                    title: 'Top 5 Patches Needed'
                                },
                                moduleSpan: 6
                            },
                            {
                                moduleName: 'list',
                                moduleJSON: {
                                    source: 'api/v1/dashboard/widgets/recently_released',
                                    keys: ['name', 'rv_severity', 'release_date', 'count'],
                                    columnTitles: ['Name', 'Severity', 'Release Date', 'Nodes'],
                                    className: ['span5', 'span2', 'span3', 'span2 alignRight'],
                                    showFooter: false,
                                    link: '#patches/os/',
                                    linkKey: 'app_id',
                                    title: 'Latest Patches Available'
                                },
                                moduleSpan: 6
                            }
                        ]
                    },
                    {
                        rowHeight: 0,
                        columns: [
                            /*{
                                moduleName: 'list',
                                moduleJSON: {
                                    source: 'api/v1/operations',
                                    keys: ['operation', 'created_by', 'customer_name', 'plugin', 'created_time'],
                                    columnTitles: ['Operation', 'User', 'Customer', 'Plugin', 'Time Created'],
                                    className: ['span2', 'span2', 'span2', 'span2', 'span4 alignRight'],
                                    showFooter: false,
                                    //link: '#logs/',
                                    //linkKey: 'id',
                                    title: 'Last 5 Operations',
                                    params: {
                                        count: 5,
                                        offset: 0
                                    }
                                },
                                moduleSpan: 12
                            }*/
                            {
                                moduleName: 'reports/modules/agentOperationStatus/agentOperationStatus',
                                moduleJSON: {
                                    params: {
                                        count: 5,
                                        offset: 0
                                    }
                                },
                                moduleSpan: 12
                            }
                        ]
                    },
                    {
                        rowHeight: 6,
                        columns: [
                            {
                                moduleName: 'stocks',
                                moduleJSON: {
                                    URL: 'api/v1/dashboard/graphs/column/range/apps/os',
                                    keys: ['Optional', 'Recommended','Critical']
                                },
                                moduleSpan: 12
                            }
                        ]
                    }
                ]
            };

        _.extend(exports.View.prototype, {
            model: reports.View.prototype.deserialize(template)
        });

        return exports;
    }
);