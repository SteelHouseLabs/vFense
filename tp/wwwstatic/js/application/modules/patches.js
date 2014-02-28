define(
    ['jquery', 'underscore', 'backbone', 'app', 'moment', 'modules/uploader', 'modules/lists/pageable', 'text!templates/patches.html', 'text!templates/appTemplate.html'],
    function ($, _, Backbone, app, moment, Uploader, Pager, myTemplate, AppTemplate) {
        'use strict';
        var exports = {
            Collection: Pager.Collection.extend({
                baseUrl: 'api/v1/apps/os'
            })
        };
        _.extend(exports, {
            Pager: Pager.View.extend({
                initialize: function (options) {
                    this.collection = new exports.Collection({
                        _defaultParams: {offset: 0, count: 20, status: 'available', severity: ''},
                        params: options.query
                    });
                    return Pager.View.prototype.initialize.call(this, options);
                },
                template: myTemplate,
                appTemplate: AppTemplate,
                causeNavigation: false,
                renderModel: function (model) {
                    var template = _.template(this.appTemplate),
                        payload = {
                        params: this.collection.params,
                        model: model,
                        type: this.tab,
                        viewHelpers: {
                            formatDate: function (date) {
                                return date ? moment(date * 1000).format('L') : 'N/A';
                            }
                        }
                    };
                    return template(payload);
                },
                layoutHeader: function ($left, $right) {
                    var headerTemplate = _.template(this.template);
                    $left.append(headerTemplate({header: true, legend: false, left: true}));
                    $right.append(headerTemplate({header: true, legend: false, left: false, query: this.collection.params}));
                    return this;
                },
                layoutLegend: function ($legend) {
                    var legendTemplate = _.template(this.template);
                    $legend.append(legendTemplate({header: false, legend: true, query: this.collection.params, tab: this.tab}));
                    return this;
                }
            }),
            View: Backbone.View.extend({
                initialize: function (options) {
                    this.template = myTemplate;
                    this.pager =  new exports.Pager(options);
                    this.addSubViews(this.pager);
                },
                events: {
                    'change select[name=sort]'      :   'sortBy',
                    'change select[name=order]'     :   'orderBy',
                    'change select[name=filter]'    :   'filterByStatus',
                    'change #severity'              :   'filterBySeverity',
                    'keyup input[name=search]'      :   'debouncedSearch',
                    'click #toggleSeverityFilter'   :   'toggleSeverityFilter',
                    'click li a'                    :   'changeTab',
                    'click #upload'                 :   'openUploader',
                    'click #hide'                   :   'hideApplications',
                    'click #showHidden'             :   'showHidden',
                    'click input[data-toggle=all]'  :   'selectAll',
                    'click button[data-toggle="remove"]': 'toggleRemove',
                    'click button[data-id="removeCustomApp"]': 'removeCustomApp'
                },
                removeCustomApp: function (event) {
                    event.preventDefault();
                    var $button = $(event.currentTarget),
                        id = $button.data('application'),
                        url = 'api/v1/apps/custom',
                        params = {
                            app_ids: [id]
                        },
                        that = this;
                    $.ajax({
                        url: url,
                        type: 'DELETE',
                        contentType: 'application/json',
                        data: JSON.stringify(params),
                        success: function (response) {
                            if (response.http_status === 200) {
                                app.notifyOSD.createNotification('', 'Operation Processed', 'Application has been deleted.');
                                that.pager.collection.fetch();
                            }
                        },
                        error: function (e) {
                            app.notifyOSD.createNotification('', 'Operation Failed', e.responseJSON ? e.responseJSON.message : e.statusText);
                        }
                    });
                },
                toggleRemove: function (event) {
                    event.preventDefault();
                    var $button = $(event.currentTarget),
                        $span = $button.siblings('span');
                    if ($span.length === 0) {
                        $span = $button.parent();
                        $button = $span.siblings('button');
                    }
                    $span.toggle();
                    $button.toggle();
                },
                hideApplications: function () {
                    var $checkboxes = this.$('input[name=hidden]:checked'),
                        applications = [],
                        that = this,
                        params = {
                            app_ids: applications,
                            hide: 'toggle'
                        };
                    $checkboxes.each(function () { applications.push(this.value); });
                    if (!applications.length) {
                        app.notifyOSD.createNotification('!', 'Error', 'You must select at least one application.');
                    } else {
                        $.ajax({
                            url: that.pager.collection.baseUrl,
                            type: 'PUT',
                            contentType: 'application/json',
                            data: JSON.stringify(params),
                            success: function (response) {
                                if (response.http_status === 200) {
                                    app.notifyOSD.createNotification('', 'Operation Processed', 'Application(s) hidden status has been changed.');
                                    that.pager.collection.fetch();
                                }
                            },
                            error: function (e) {
                                app.notifyOSD.createNotification('', 'Operation Failed', e.responseJSON ? e.responseJSON.message : e.statusText);
                            }
                        });
                    }
                    return this;
                },
                showHidden: function (event) {
                    if (event.target.checked) {
                        this.pager.collection.params.hidden = true;
                    } else {
                        delete this.pager.collection.params.hidden;
                    }
                    this.pager.collection.fetch();
                    return this;
                },
                selectAll: function (event) {
                    var checked = event.target.checked,
                        $checkboxes = this.$('input[name=hidden]:not(:disabled)');
                    $checkboxes.prop('checked', checked);
                },
                openUploader: function () {
                    if (this.modal) {
                        this.modal.close();
                        this.modal = undefined;
                    }
                    this.modal = new Uploader.View().init().open();
                },
                toggleSeverityFilter: function () {
                    this.$('#displaySeverity').toggle();
                    this.$('#controls').toggle();
                },
                debouncedSearch: _.debounce(function (event) {
                    var query = $(event.currentTarget).val().trim();
                    this.searchBy(query);
                }, 300),
                searchBy: function (query) {
                    this.pager.collection.params.query = query;
                    this.pager.collection.params.offset = 0;
                    this.pager.collection.fetch();
                },
                sortBy: function (event) {
                    this.pager.collection.params.sort_by = $(event.currentTarget).val();
                    this.pager.collection.params.offset = 0;
                    this.pager.collection.fetch();
                },
                orderBy: function (event) {
                    this.pager.collection.params.sort = $(event.currentTarget).val();
                    this.pager.collection.params.offset = 0;
                    this.pager.collection.fetch();
                },
                filterByStatus: function (event) {
                    this.pager.collection.params.status = $(event.currentTarget).val();
                    this.pager.collection.params.offset = 0;
                    this.pager.collection.fetch();
                },
                filterBySeverity: function (event) {
                    var severity = $(event.currentTarget).val();
                    if (severity !== 'none') {
                        this.pager.collection.params.severity = $(event.currentTarget).val();
                    } else {
                        delete this.pager.collection.params.severity;
                    }
                    this.pager.collection.params.offset = 0;
                    this.pager.collection.fetch();
                    this.toggleSeverityFilter();
                },
                changeTab: function (event) {
                    event.preventDefault();
                    var $href = $(event.currentTarget),
                        tab = $href.data('type');
                    delete this.pager.collection.params.query;
                    this.updateTabContent(tab);
                },
                updateTabContent: function (tab) {
                    var $tab = this.$el.find('a[data-type=' + tab + ']'),
                        url = $tab.attr('href');
                    $tab.parent().addClass('active').siblings().removeClass('active');
                    this.pager.tab = tab;
                    this.pager.collection.baseUrl = url;
                    this.pager.collection.params.offset = 0;
                    this.renderContent();
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template);
                    this.$el.empty().append(template({header: false, legend: false, tab: this.options.tab}));
                    this.updateTabContent(this.options.tab);

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                renderContent: function () {
                    this.pager.render();
                    this.$('.tab-content').empty().append(this.pager.delegateEvents().$el);
                    return this;
                }
            })
        });
        return exports;
    }
);
