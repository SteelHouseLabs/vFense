define(
    ['jquery', 'underscore', 'backbone', 'modules/lists/pageable', 'text!templates/reports.html',
     'text!templates/osReport.html', 'text!templates/networkReport.html',
     'text!templates/memoryReport.html', 'text!templates/cpuReport.html',
	 'text!templates/hddReport.html', 'text!templates/hardwareReport.html'],
    function ($, _, Backbone, Pager, myTemplate, osReport, networkReport, memoryReport, cpuReport, hddReport, hardwareReport) {
        'use strict';
        var helpers = {
            getDriveSize: function (size) {
                var result = Math.floor(size / 1000000);
                if (result) {
                    return result + ' GB';
                } else {
                    return Math.floor(size / 1000) + ' MB';
                }
            }
        }, exports = {
            Collection: Pager.Collection.extend({
                baseUrl: 'api/v1/reports/',
                reportType: 'osdetails',
                url: function () {
                    var url = this.baseUrl + this.reportType,
                        query = this.query();
                    if (query !== '?') { url += query; }
                    return url;
                },
                parse: function (response) {
                    return Pager.Collection.prototype.parse.call(this, response);
                }
            }),
            Pager: Pager.View.extend({
                initialize: function (options) {
                    this.collection = new exports.Collection({
                        _defaultParams: {offset: 0, count: 20}
                    });
                    return Pager.View.prototype.initialize.call(this, options);
                },
                showLegend: false,
                showHeader: false,
                reportTemplates: {
                    'osdetails': osReport,
                    'networkdetails': networkReport,
                    'memorydetails': memoryReport,
                    'cpudetails': cpuReport,
                    'diskdetails': hddReport,
					'hardwaredetails': hardwareReport
                },
                updateList: function (collection) {
                    var $items = this.$('.items'),
                        template = _.template(this.reportTemplates[this.collection.reportType]);
                    $items.empty().append(template({models: this.collection.models, helpers: helpers}));
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.pager = new exports.Pager();
                },
                template: myTemplate,
                events: {
                    'click li a': 'switchTab'
                },
                render: function () {
                    var tmpl = _.template(this.template);
                    this.$el.empty().append(tmpl());
                    this.renderContent();
                    return this;
                },
                switchTab: function (event) {
                    event.preventDefault();
                    var $link = $(event.currentTarget),
                        $tab = $link.parent();
                    $tab.addClass('active').siblings().removeClass('active');
                    this.pager.collection.reportType = $link.attr('href');
                    this.pager.collection.fetch();
                },
                renderContent: function () {
                    this.pager.render();
                    this.$('.tab-content').empty().append(this.pager.delegateEvents().$el);
                    return this;
                }
            })
        };
        return exports;
    }
);
