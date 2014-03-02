define(
    ['jquery', 'underscore', 'backbone', 'crel', 'moment', 'modules/lists/pageable', 'modals/panel', 'app', 'text!templates/scheduleForm.html', 'jquery.ui.datepicker', 'jquery.ui.slider', 'jquery.ui.timepicker'],
    function ($, _, Backbone, crel, moment, Pager, Panel, app, scheduleForm) {
        'use strict';
        var exports = {},
            helpers = {};
        _.extend(helpers, {
            getPatchType: function (tab) {
                if (tab === '#softwareinventory' || tab === '#pending') {
                    tab = 'os';
                }
                return tab.replace('#', '');
            },
            rebootRequiredSign: function (page, required) {
                var reboot = '', color, title;
                if ((page === 'node' || page === 'tag') && required !== 'no') {
                    if (required === 'yes') {
                        color = 'color: orange;';
                        title = 'Reboot will be required.';
                    } else if (required === 'possible') {
                        color = 'color: #0088CC;';
                        title = 'Reboot may be required.';
                    }
                    reboot = crel('i', {class: 'icon-exclamation-sign', style: color, title: title});
                    $(reboot).tooltip({container: 'body'});
                }
                return reboot;
            },
            getDependencies: function (model) {
                var dependencies;
                if (model.get('dependencies') && model.get('dependencies').length) {
                    dependencies = crel('button', {class: 'btn btn-link noPadding', 'data-action': 'toggleDependenciesPanel', 'data-id': model.cid},
                        crel('i', {class: 'icon-code-fork'})
                    );
                } else {
                    dependencies = '';
                }
                return dependencies;
            },
            getType: function (operation) {
                var type;
                if (operation === 'install') {
                    type = 'PUT';
                } else if (operation === 'uninstall') {
                    type = 'DELETE';
                }
                return type;
            }
        });
        exports.name = 'patchManager';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: '',
                    causeNavigation: false,
                    defaultTab: '#os',
                    type: 'os',
                    tabStatus: 'available',
                    page: 'node'
                }
            })
        };
        exports.keys = {
            node: {
                url: '/api/v1/agent/',
                urlSuffix: '/apps/',
                titles: ['Name', 'Version', 'Severity', 'Info'],
                name: 'name',
                id: 'app_id',
                link: '/#patches/',
                operationKeys: {
                    mainID: 'agent_id',
                    secondaryID: 'app_ids'
                },
                stats: {url: '/api/v1/agent/', key: 'basic_rv_stats'},
                defaultTab: '#os'
            },
            patch: {
                url: '/api/v1/app/',
                urlSuffix: '/agents',
                titles: ['Name', '', '', 'Info'],
                name: 'computer_name',
                id: 'agent_id',
                link: '/#nodes/',
                operationKeys: {
                    mainID: 'rv_id',
                    secondaryID: 'agent_ids'
                },
                stats: {url: '/api/v1/app/', key: 'agent_stats'},
                defaultTab: '#available'
            },
            tag: {
                url: '/api/v1/tag/',
                urlSuffix: '/apps/',
                titles: ['Name', 'Version', 'Severity', 'Info'],
                name: 'name',
                id: 'app_id',
                link: '/#patches/',
                operationKeys: {
                    mainID: 'tag_id',
                    secondaryID: 'app_ids'
                },
                stats: {url: '/api/v1/tag/', key: 'basic_rv_stats'},
                defaultTab: '#os'
            }
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('patchManager view requires a patchManager model');
                    }
                    var id = this.model.get('id'),
                        that = this;
                    this.type = '';
                    this.params = {};
                    this.patchType = '';
                    this.page = this.model.get('page');
                    this.tabs = ['available', 'installed', 'pending', 'failed'];
                    this.defaultTab = exports.keys[this.page].defaultTab;
                    this.tabStatus = this.model.get('tabStatus');
                    this._currentTab = '';
                    this._selectedData = [];
                    this._schedule = {};
                    this._forcedRendering = false;
                    if (this.page === 'patch') {
                        this.type = this.model.get('type') + '/';
                    } else {
                        this.patchType = this.model.get('type');
                    }
                    this.data = new (Backbone.Model.extend({
                        baseUrl: exports.keys[that.page].url + that.type + id,
                        url: function () {
                                return this.baseUrl;
                            }
                    }))();
                    this.pager = new (Pager.View.extend({
                        collection: new (Pager.Collection.extend({
                            baseUrl: exports.keys[that.page].url,
                            url: function () {
                                this.params.status = that.tabStatus;
                                return this.baseUrl + id + exports.keys[that.page].urlSuffix + that.patchType + '?' + $.param(this.params);
                            }
                        }))(),
                        renderModel: this.renderModel,
                        layoutHeader: this.layoutHeader,
                        afterUpdateList: this.afterUpdateList,
                        getPatchStatus: this.getPatchStatus,
                        getStatusMessage: this.getStatusMessage,
                        tab: this.defaultTab,
                        page: this.page,
                        parentView: this,
                        causeNavigation: that.model.get('causeNavigation')
                    }))();
                    this.panel = Panel.View.extend({
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Edit',
                                action: 'confirm',
                                className: 'btn-primary',
                                position: 'right'
                            }
                        ],
                        confirm: that.addSchedule,
                        parentView: that
                    });
                    this.dependenciesPanel = new Panel.View();
                    this.dependenciesPanel.setHeaderHTML(crel('h4', 'Dependencies'));
                    this.addSubViews(this.pager);
                    this.addSubViews(this.dependenciesPanel);
                    this.addSubViews(this.panel);
                    this.listenTo(this.data, 'sync', this.renderTabs);
                    $.ajaxSetup({ traditional: true });
                },
                events: {
                    'click [data-action=toggleDependenciesPanel]': 'toggleDependenciesPanel',
                    'click button[data-submit=operation]'   : 'submitOperation',
                    'click li a[data-toggle=tab]'           : 'changeTab',
                    'click input[data-toggle=all]'          : 'selectAll',
                    'click input[data-update]'              : 'togglePatch',
                    'click input[data-id=schedule]'         : 'toggleSchedule',
                    'keyup input[data-id=search]'           : 'debouncedSearch',
                    'change select[data-id=filter]'         : 'filterBySeverity',
                    'click button[data-id=addSchedule]'     : 'addSchedule',
                    'click button[data-action=toggleOptions]': 'toggleOptions',
                    'click #showHidden'                     :   'showHidden'
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var $el = this.$el;
                    if ($el.children().length === 0) {
                        $el.html(this.layout());
                    }
                    if (this.data.url) { this.data.fetch(); }

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                layout: function () {
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(
                        crel('div', {class: 'tabbable'},
                            crel('ul', {class: 'nav nav-tabs'}),
                            crel('div', {class: 'tab-content'})
                        )
                    );
                    return fragment;
                },
                capitaliseFirstLetter: function (string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                },
                renderTabs: function (model) {
                    if (model.get('http_status') !== 200) {
                        throw new Error('patchManager cannot fetch from current API');
                    }
                    var fragment = document.createDocumentFragment(),
                        patchTypes = model.get('data')[exports.keys[this.page].stats.key],
                        $navBar = this.$el.find('.nav-tabs'),
                        that = this;
                    $navBar.empty();
                    if (patchTypes && patchTypes.length) {
                        _.each(patchTypes, function (status) {
                            var tab = status.name.toLowerCase().replace(' ', ''),
                                active = that._currentTab ? ('#' + tab) === that._currentTab ? 'active' : '' : ('#' + tab) === that.defaultTab ? 'active' : '',
                                badgeClass = active ? 'badge badge-info' : 'badge',
                                total = status.count;
                            fragment.appendChild(
                                crel('li', {class: active},
                                    crel('a', {href: '#' + tab, 'data-toggle': 'tab', 'data-status': status.status}, that.capitaliseFirstLetter(status.name) + ' ',
                                        crel('span', {class: badgeClass}, Math.floor(total)))
                                )
                            );
                            if (active) {
                                that.renderContent('#' + tab, status.status);
                            }
                        });
                        $navBar.append(fragment);
                    } else {
                        this.$el.append(crel('span', 'No data available.'));
                    }
                },
                changeTab: function (event) {
                    event.preventDefault();
                    var $link = $(event.currentTarget),
                        href = $link.attr('href'),
                        status = $link.data('status');
                    this.renderContent(href, status);
                },
                renderContent: function (tab, status) {
                    var forced = this._forcedRendering;
                    if (tab !== this._currentTab || forced) {
                        $('a[href=' + this._currentTab + ']').find('span').removeClass('badge-info').parents('li').removeClass('active');
                        $('a[href=' + tab + ']').find('span').addClass('badge-info').parents('li').addClass('active');
                        this.tabStatus = status;
                        if (this.page !== 'patch') {
                            this.patchType = helpers.getPatchType(tab);
                        }
                        this._currentTab = tab;
                        this._selectedData.length = 0;
                        this._schedule = {};
                        this._forcedRendering = false;
                        this.renderList();
                    }
                },
                renderList: function () {
                    var $tabContent = this.$el.find('.tab-content'),
                        listView = this.pager;
                    listView.tab = this._currentTab;
                    listView.collection.baseUrl = exports.keys[this.page].url + this.type;
                    listView.collection.params.offset = 0;
                    delete listView.collection.params.query;
                    delete listView.collection.params.severity;
                    listView.render();
                    $tabContent.append(listView.$el);
                },
                layoutHeader: function ($left, $right) {
                    var $select, $cpuThrottle = [], $netThrottle = [], $restart = [],
                        titles = exports.keys[this.page].titles,
                        spans = ['span7', 'span2', 'span2', 'span1 alignRight'],
                        $header = this.$el.find('header'),
                        legend = crel('div', {class: 'legend row-fluid'}),
                        options = {
                            '#os': [{text: 'Install', value: 'install'}],
                            '#custom': [{text: 'Install', value: 'install'}],
                            '#supported': [{text: 'Install', value: 'install'}],
                            '#softwareinventory': [{text: 'Uninstall', value: 'uninstall'}],
                            '#available': [{text: 'Install', value: 'install'}],
                            '#installed': [{text: 'Uninstall', value: 'uninstall'}],
                            '#remediationvault': [{text: 'Install', value: 'install'}]
                        };
                    if (this.tab !== '#pending') {
                        if (this.tab !== '#softwareinventory' && this.tab !== '#installed') {
                            $restart = $(crel('select', {'data-id': 'restart'},
                                crel('option', {value: 'none'}, 'No restart'),
                                crel('option', {value: 'needed'}, 'Only if needed'),
                                crel('option', {value: 'force'}, 'Forced')
                            ));
                            $cpuThrottle = $(crel('select', {'data-id': 'cpu_throttle'},
                                crel('option', {value: 'idle'}, 'Idle'),
                                crel('option', {value: 'below normal'}, 'Below Normal'),
                                crel('option', {value: 'normal', selected: 'selected'}, 'Normal'),
                                crel('option', {value: 'above normal'}, 'Above Normal'),
                                crel('option', {value: 'high'}, 'High')
                            ));
                            /*$netThrottle = $(crel('input',
                                {
                                    class: 'input-small',
                                    type: 'text',
                                    placeholder: 'net throttle-kb',
                                    'data-id': 'net_throttle'
                                }
                            ));*/
                        } else {
                            titles.splice(1, 0, 'Installed Date');
                            spans.splice(1, 0, 'span2');
                            spans[0] = 'span5';
                        }
                        $select = $(crel('select', {'data-id': 'operation'}));
                        _.each(options[this.tab], function (option) {
                            $select.append(crel('option', {value: option.value}, option.text));
                        });
                        $right.append(
                            crel('label', {class: 'checkbox inline'}, crel('small', 'Schedule')), ' ',
                            crel('input', {type: 'checkbox', 'data-id': 'schedule'}),
                            ' ', $restart, ' ', $netThrottle, ' ', $cpuThrottle, ' ', $select, ' ',
                            crel('button', {class: 'btn btn-mini btn-primary', 'data-submit': 'operation'}, 'Submit')
                        );
                    }
                    if (this.tab !== '#softwareinventory' && titles.indexOf('Installed Date') !== -1) {
                        titles.splice(titles.indexOf('Installed Date'), 1);
                        spans.splice(titles.indexOf('Installed Date'), 1);
                    }
                    _.each(titles, function (title, i) {
                        if (title !== 'Severity') {
                            if (title === 'Name') {
                                $(legend).append(crel('strong',{class: spans[i]}, crel('input', {type: 'checkbox', 'data-toggle': 'all'}), ' ' + title));
                            } else {
                                $(legend).append(crel('strong',{class: spans[i]}, title));
                            }
                        } else {
                            $(legend).append(
                                crel('span', {class: spans[i]},
                                    crel('select', {'data-id': 'filter'},
                                        crel('option', title),
                                        crel('option', 'Critical'),
                                        crel('option', 'Recommended'),
                                        crel('option', 'Optional')
                                    )
                                )
                            );
                        }
                    });
                    $header.after($(legend));
                    $left.append(
                        crel('div', {class: 'input-prepend'},
                            crel('span', {class: 'add-on'},
                                crel('i', {class: 'icon-search'})),
                            crel('input', {type: 'text', class: 'input-small', 'data-id': 'search'})
                        ), ' ',
                        crel('label', {style: 'display: inline'},
                            crel('input', {type: 'checkbox', id: 'showHidden'}), crel('small', 'Show Hidden'))
                    );
                    return this;
                },
                toggleOptions: function (event) {
                    event.preventDefault();
                    this.$('#installOptions').toggle();
                    return this;
                },
                renderModalHeader: function () {
                    return crel('h4', 'Schedule Operation');
                },
                showHidden: function (event) {
                    if (event.target.checked) {
                        this.pager.collection.params.hidden = true;
                    } else {
                        delete this.pager.collection.params.hidden;
                    }
                    this.pager.collection.fetch();
                },
                selectAll: function (event) {
                    var checked = event.target.checked,
                        $checkboxes = this.$el.find('input[data-update]:not(:disabled)'),
                        that = this;
                    $checkboxes.prop('checked', checked);
                    this._selectedData.length = 0;
                    if (checked) {
                        $checkboxes.each(function () {
                            that._selectedData.push(this.value);
                        });
                    }
                },
                togglePatch: function (event) {
                    var checked = event.target.checked,
                        id = event.target.value,
                        selectedPatches = this._selectedData;
                    if (checked) {
                        selectedPatches.push(id);
                    } else {
                        selectedPatches.splice(selectedPatches.indexOf(id), 1);
                    }
                },
                toggleSchedule: function (event) {
                    var template;
                    if (event.target.checked) {
                        if (this.modal) {
                            this.modal.close();
                            this.modal = undefined;
                        }
                        template = _.template(scheduleForm);
                        event.target.checked = false;
                        this.modal = new this.panel().open();
                        this.modal.setHeaderHTML(this.renderModalHeader());
                        this.modal.setContentHTML(template());
                        this.initModal();
                    } else {
                        this._schedule = {};
                    }
                },
                initModal: function () {
                    this.modal.$('input[name=time]').datetimepicker();
                },
                addSchedule: function () {
                    var $form = this.$('form'),
                        $inputs = $form.find('input, select'),
                        verified = true,
                        params = {};
                    $inputs.each(function () {
                        var value = $(this).val();
                        if (value && value !== 'none') {
                            params[this.name] = value;
                            $(this).parents('.control-group').removeClass('error');
                            $(this).siblings('span').removeClass('alert-error').html('');
                        } else if (!value) {
                            $(this).parents('.control-group').addClass('error');
                            $(this).siblings('span').addClass('alert-error').html('Field ' + this.name + ' cannot be empty.');
                            verified = false;
                        }
                    });
                    if (verified) {
                        this.parentView._schedule = params;
                        this.parentView.$('input[data-id=schedule]').prop('checked', true);
                        this.close();
                    }
                },
                submitOperation: function () {
                    var data = this._selectedData,
                        operation = this.$el.find('select[data-id=operation]').val(),
                        cpuThrottle = this.$el.find('select[data-id=cpu_throttle]').val(),
                        netThrottle = parseInt(this.$el.find('input[data-id=net_throttle]').val()),
                        restart = this.$el.find('select[data-id=restart]').val(),
                        $schedule = this.$el.find('input[data-id=schedule]'),
                        url = this.getUrl(),
                        ajaxType = helpers.getType(operation),
                        that = this,
                        params = {
                            restart: restart
                        };
                    params[exports.keys[this.page].operationKeys.secondaryID] = data;
                    if (data.length) {
                        if ($schedule.is(':checked')) {
                            if (!_.isEmpty(this._schedule)) {
                                params.time = new Date(this._schedule.time).getTime() / 1000;
                                params.label = this._schedule.label;
                                //params.offset = this._schedule.offset;
                            } else {
                                app.notifyOSD.createNotification('!', 'Error', 'Schedule fields are not ready');
                                return false;
                            }
                        }
                        if (cpuThrottle) { params.cpu_throttle = cpuThrottle; }
                        if (netThrottle) { params.net_throttle = netThrottle; }
                        $.ajax({
                            url: url,
                            type: ajaxType,
                            contentType: 'application/json',
                            data: JSON.stringify(params),
                            dataType: 'json',
                            success: function (response) {
                                if (response.http_status === 200) {
                                    app.notifyOSD.createNotification('!', 'Success', 'Operation Sent');
                                    that._forcedRendering = true;
                                    that.data.fetch();
                                } else {
                                    app.notifyOSD.createNotification('!', 'Error', response.message);
                                }
                            }
                        });
                    } else {
                        app.notifyOSD.createNotification('!', 'Error', 'You must select at least one patch.');
                    }
                },
                getUrl: function () {
                    return this.pager.collection.baseUrl + this.model.get('id') + exports.keys[this.page].urlSuffix + this.patchType;
                },
                afterUpdateList: function () {
                    var $span = this.parentView.$el.find('a[href=' + this.tab + '] span'),
                        selectedData = this.parentView._selectedData;
                    _.each(selectedData, function (checkbox) {
                        $('input[value=' + checkbox + ']').prop('checked', true);
                    });
                    $span.html(this.collection.recordCount);
                },
                debouncedSearch: _.debounce(function (event) {
                    var text = $(event.currentTarget).val();
                    this.searchPatches(text);
                }, 300),
                searchPatches: function (text) {
                    var listView = this.pager;
                    delete listView.collection.params.severity;
                    listView.collection.params.offset = 0;
                    listView.collection.params.query = text;
                    listView.collection.fetch();
                },
                filterBySeverity: function (event) {
                    var $link = $(event.currentTarget),
                        severity = $link.val(),
                        listView = this.pager;
                    event.preventDefault();
                    if (severity !== 'Severity') {
                        listView.collection.params.severity = severity;
                    } else {
                        delete listView.collection.params.severity;
                    }
                    delete listView.collection.params.query;
                    listView.collection.fetch();
                },
                renderModel: function (model) {
                    var fragment = document.createDocumentFragment(),
                        page = this.page,
                        patchType = this.parentView.patchType ? this.parentView.patchType + '/' : '',
                        patchNameSpan = 'span7',
                        link = exports.keys[page].link,
                        name = model.get(exports.keys[page].name),
                        id = model.get(exports.keys[page].id),
                        version = model.get('version'),
                        severity = model.get('rv_severity'),
                        dependencies = helpers.getDependencies(model),
                        downloadStatus,
                        input = '',
                        installedDateDiv = '', installedDate,
                        warning = '';
                    if (this.tab !== '#pending') {
                        input = crel('input', {type: 'checkbox', 'data-update': model.get('update') || false, value: id});
                    }
                    if (this.tab !== '#pending' && this.tab !== '#softwareinventory' && this.tab !== '#installed') {
                        downloadStatus = model.get('files_download_status') || this.parentView.data.get('data').files_download_status;
                        if (downloadStatus !== 5004 && downloadStatus !== 5016) {
                            $(input).attr('disabled', 'disabled');
                            warning = this.parentView.getFileStatusIcon(downloadStatus);
                            $(warning).tooltip({container: 'body'});
                        }
                    }
                    if (this.tab === '#softwareinventory') {
                        patchNameSpan = 'span5';
                        installedDate = model.get('install_date') ? moment(model.get('install_date') * 1000).format('L') : 'N/A';
                        installedDateDiv = crel('span', {class: 'span2'}, installedDate);
                    } else {
                        if (model.get('update') === 5014) {
                            name = '(update) ' + name;
                        }
                    }
                    fragment.appendChild(
                        crel('div', {class: 'item row-fluid'},
                            crel('span', {class: patchNameSpan, title: name},
                                crel('label', {class: 'checkbox inline'}, input,
                                    warning, ' ',
                                    helpers.rebootRequiredSign(page, model.get('reboot_required')), ' ',
                                    dependencies, ' ',
                                    name
                                )
                            ),
                            installedDateDiv,
                            crel('span', {class: 'span2'}, version || ' '),
                            crel('span', {class: 'span2'}, severity || ' '),
                            crel('span', {class: 'span1 alignRight'},
                                crel('a', {href: link + patchType + id},
                                    crel('i', {class: 'icon-info-sign', title: 'More Info'})
                                )
                            )
                        )
                    );
                    return fragment;
                },
                toggleDependenciesPanel: function (event) {
                    var cid = $(event.currentTarget).data('id');
                    this.dependenciesPanel.setContentHTML(this.renderDependencies(cid))
                        .open();
                },
                renderDependencies: function (cid) {
                    var fragment = crel('div', {class: 'list'}),
                        items = crel('div', {class: 'items row-fluid'}),
                        model = this.pager.collection.get(cid);
                    _.each(model.get('dependencies'), function (dependency) {
                        $(items).append(crel('div', {class: 'item'},
                            crel('a', {href: '#patches/os/' + dependency.app_id},
                                crel('span', {class: 'span8'}, dependency.name),
                                crel('span', {class: 'span4 alignRight'}, dependency.version)
                            )
                        ));
                    });
                    fragment.appendChild(items);
                    return fragment;
                },
                getPatchStatus: function (model) {
                    return model.get('files_download_status') || 'not required';
                },
                getFileStatusIcon: function (status) {
                    var icon = crel('i');
                    if (status === 5005) {
                        $(icon).addClass('icon-spinner icon-spin');
                    } else {
                        $(icon).addClass('icon-warning-sign').css('color', 'orange');
                    }
                    $(icon).attr('title', this.getStatusMessage(status));
                    return icon;
                },
                getStatusMessage: function (status) {
                    var message = '';
                    switch(status) {

                    case 5005:
                        message = 'File is downloading.';
                        break;
                    case 5006:
                        message = 'File not required.';
                        break;
                    case 5007:
                        message = 'File is pending download.';
                        break;
                    case 5008:
                        message = 'File failed to download.';
                        break;
                    case 5009:
                        message = 'File is missing uri.';
                        break;
                    case 5010:
                        message = 'File has an invalid uri.';
                        break;
                    case 5011:
                        message = 'Can\'t verify the file hash.';
                        break;
                    case 5012:
                        message = 'File has a size mismatch';
                        break;
                    default:
                        message = 'Cannot be installed at this moment';
                    }
                    return message;
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    //this.template = myTemplate;
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var tmpl = _.template(this.template),
                        model = this.model.toJSON();

                    this.$el.empty();

                    this.$el.append(tmpl({model: model}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
