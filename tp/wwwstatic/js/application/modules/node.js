define(
    ['jquery', 'underscore', 'backbone', 'app', 'reports/report'],
    function ($, _, Backbone, app, reports) {
        'use strict';
        var exports = {
                View: app.createChild(reports.View)
            },
            template = function (nodeID) {
                return {
                    rows: [
                        {
                            rowHeight: 1,
                            columns: [
                                {
                                    moduleName: 'reports/modules/agentBanner/agentBanner',
                                    moduleJSON: {
                                        id: nodeID
                                    },
                                    moduleSpan: 12,
                                    class: 'noShadow'
                                }
                            ]
                        },
                        {
                            rowHeight: 2,
                            columns: [
                                /*{
                                    moduleName: 'reports/modules/dynamicText/dynamicText',
                                    moduleJSON: {
                                        'url': '/api/nodes.json?id=' + nodeID,
                                        'key': 'computer_name',
                                        'name': 'Name: ',
                                        'suffix': '',
                                        'prefix': '',
                                        'frequency': 0
                                    },
                                    moduleSpan: 3,
                                    class: 'noShadow'
                                },*/
                                {
                                    moduleName: 'reports/modules/gauges/gauges',
                                    moduleJSON: {
                                        'URL':'/api/monitor/cpu?agent_id=' + nodeID,
                                        'key':'used',
                                        APIName:'CPU Usage',
                                        updateTime: 30000
                                    },
                                    moduleSpan: 4,
                                    class: 'noShadow'
                                },
                                {
                                    moduleName: 'reports/modules/gauges/gauges',
                                    moduleJSON: {
                                        'URL': '/api/monitor/memory?agent_id=' + nodeID,
                                        'key': 'used_percent',
                                        APIName:'Memory Usage',
                                        updateTime: 30000
                                    },
                                    moduleSpan: 4,
                                    class: 'noShadow'
                                },
                                {
                                    moduleName: 'reports/modules/gauges/gauges',
                                    moduleJSON: {
                                        'URL': '/api/monitor/filesystem?agent_id=' + nodeID,
                                        'key': 'used_percent',
                                        APIName:'HDD Usage',
                                        updateTime: 30000
                                    },
                                    moduleSpan: 4,
                                    class: 'noShadow'
                                }
                            ]
                        },
                        {
                            rowHeight: 0,
                            columns: [
                                {
                                    moduleName: 'reports/modules/nodeTags/nodeTags',
                                    moduleJSON: {
                                        'id': nodeID
                                    },
                                    moduleSpan: 12
                                }
                            ]
                        },
                        {
                            rowHeight: 3,
                            columns: [
                                {
                                    moduleName: 'reports/modules/hardwareInfo/hardwareInfo',
                                    moduleJSON: {
                                        'id': nodeID
                                    },
                                    moduleSpan: 6
                                },
                                {
                                    moduleName: 'chart',
                                    moduleJSON: {
                                        type: 'column',
                                        URL: 'api/v1/agent/' + nodeID + '/graphs/bar/severity',
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
                            rowHeight: 6,
                            columns: [
                                {
                                    moduleName: 'stocks',
                                    moduleJSON: {
                                        URL: 'api/v1/agent/' + nodeID + '/graphs/column/range/apps/os',
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
                                    moduleName: 'reports/modules/agentOperationStatus/agentOperationStatus',
                                    moduleJSON: {
                                        agentID: nodeID,
                                        params: {
                                            count: 5,
                                            offset: 0,
                                            agentid: nodeID
                                        }
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
                                        'id': nodeID,
                                        page: 'node'
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