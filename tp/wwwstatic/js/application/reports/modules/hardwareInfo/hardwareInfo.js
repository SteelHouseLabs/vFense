define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modals/panel', 'h5f'],
    function ($, _, Backbone, app, crel, Panel, h5f) {
        'use strict';
        var exports = {}, Modal;
        exports.name = 'hardwareInfo';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: '',
                    defaultTab: '#all'
                }
            })
        };
        Modal = Panel.View.extend({
            events: function () {
                return _.extend({}, _.result(Panel.View.prototype, 'events'), {
                    'submit form': 'submitTag'
                });
            },
            submitTag: function (event) {
                event.preventDefault();
                this.confirm();
            }
        });
        function pluckSum(obj, key) {
            return _.reduce(
                _.pluck(obj, key),
                function (sum, num) {
                    var add = $.isNumeric(num) ? +num : 0;
                    return sum + add;
                },
                0 // initial sum
            );
        }

        function pluckAverage(obj, key) {
            return obj.length > 0 ? pluckSum(obj, key) / obj.length : 0;
        }
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('hardwareInfo view requires a hardwareInfo model');
                    }
                    var id = this.model.get('id'),
                        that = this;
                    this.defaultTab = this.model.get('defaultTab');
                    this._currentTab = '';
                    this.data = new (Backbone.Model.extend({
                        baseUrl: '/api/v1/agent/',
                        url: function () {
                            return this.baseUrl + id;
                        }
                    }))();
                    this.modal = new Modal({
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
                        confirm: that.edit,
                        parentView: that
                    });
                    this.listenTo(this.data, 'sync', this.renderNavTabs);
                    this.listenTo(this.data, 'change', this.forcedRender);
                },
                events: {
                    'click li a[data-toggle=tab]'       : 'changeTab',
                    'click button[data-id=submitEdit]'  : 'edit',
                    'click button[data-id=closePopover]': 'closePopover',
                    'click button[data-id=editModal]'   : 'toggleModal'
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

                    return this;
                },
                layout: function () {
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(
                        crel('div', {class: 'tabbable tabs-left'},
                            crel('ul', {class: 'nav nav-tabs'}),
                            crel('div', {class: 'tab-content'})
                        )
                    );
                    return fragment;
                },
                renderNavTabs: function (model) {
                    if (model.get('http_status') !== 200) {
                        throw new Error('API was not able to fetch data');
                    }
                    var fragment = document.createDocumentFragment(),
                        keys = model.get('data').hardware,
                        $navBar = this.$el.find('.nav-tabs'),
                        tabs = _.keys(keys),
                        that = this;
                    tabs.unshift('all');
                    $navBar.empty();
                    _.each(tabs, function (tab) {
                        var active = ('#' + tab) === that.defaultTab ? 'active' : null,
                            title = that.getNavTitle(tab),
                            object = keys[tab];
                        if (_.isArray(object) || tab === 'all') {
                            fragment.appendChild(crel('li', {class: active}, crel('a', {href: '#' + tab, 'data-toggle': 'tab'}, title)));
                            if (active) {
                                that.renderTab('#' + tab);
                            }
                        }
                    });
                    $navBar.append(fragment);
                },
                getNavTitle: function (tab) {
                    var title;
                    if (tab === 'all') {
                        title = 'MAIN';
                    } else if (tab === 'nic') {
                        title = 'NET';
                    } else if (tab === 'cpu') {
                        title = 'CPU';
                    } else if (tab === 'display') {
                        title = 'GFX';
                    } else if (tab === 'storage') {
                        title = 'HDD';
                    } else {
                        title = tab;
                    }
                    return title;
                },
                changeTab: function (event) {
                    event.preventDefault();
                    var href = $(event.currentTarget).attr('href');
                    this.renderTab(href);
                },
                forcedRender: function () {
                    this.renderTab(this._currentTab, true);
                },
                renderTab: function (link, forced) {
                    var tab = typeof link === 'string' ? link : this._currentTab,
                        fragment = document.createDocumentFragment(),
                        data = this.data.get('data').hardware,
                        $tabContent = this.$el.find('.tab-content'),
                        objects = data[tab.replace('#', '')],
                        that = this,
                        refresh = forced || false;
                    if (link !== this._currentTab || refresh) {
                        $('a[href=' + this._currentTab + ']').parent().removeClass('active');
                        $('a[href=' + tab + ']').parent().addClass('active');
                        if (objects) {
                            if (objects.length) {
                                _.each(objects, function (object) {
                                    var keys = _.keys(object),
                                        list = crel('dl', {'class': 'inline'});
                                    _.each(keys, function (key) {
                                        $(list).append(crel('dt', that.getTitle(key) + ':'), crel('dd', object[key] || 'N/A'));
                                    });
                                    fragment.appendChild(list);
                                });
                            } else {
                                fragment.appendChild(crel('strong', 'No data available'));
                            }
                        } else {
                            fragment.appendChild(that.renderAllTab(this.data.get('data')));
                        }
                        $tabContent.empty();
                        $tabContent.append(fragment);
                        this._currentTab = tab;
                        if (this.onRender !== $.noop) { this.onRender(); }
                    }
                },
                renderAllTab: function (data) {
                    var fragment = document.createDocumentFragment(),
                        hardwareOverview, softwareOverview;
                    hardwareOverview = this.getHardwareOverview(data);
                    softwareOverview = this.getSoftwareOverview(data);
                    return fragment.appendChild(crel('dl',
                        crel('dt', 'Software Overview:'), crel('dd', softwareOverview),
                        crel('dt', 'Hardware Overview:'), crel('dd', hardwareOverview)
                    ));
                },
                getHardwareOverview: function (data) {
                    return crel('dl', {class: 'inline'},
                        crel('dt', 'Memory'),
                        crel('dd', Math.floor(data.hardware.memory / 1000) + ' MB'),
                        crel('dt', 'Number of Processors'),
                        crel('dd', data.hardware.cpu.length),
                        crel('dt', 'Total Number of Cores'),
                        crel('dd', pluckSum(data.hardware.cpu, 'cores')),
                        crel('dt', 'Processor Speed (Average)'),
                        crel('dd', pluckAverage(data.hardware.cpu, 'speed_mhz') + ' MHz')
                    );
                },
                getSoftwareOverview: function (data) {
                    var $agentStatus,
                        $dl = $(crel('dl', {class: 'inline'}));
                    $dl.append(
                        crel('dt', 'Computer Name'),
                        crel('dd', data.computer_name),
                        crel('dt', 'Display Name:'),
                        crel('dd', data.display_name ? data.display_name + ' ' : 'N/A ',
                            crel('button', {class: 'btn btn-link noPadding', 'data-id': 'editModal', 'data-argument': 'display_name', 'data-value': data.display_name || ''},
                                crel('i', {class: 'icon-pencil', style: 'color: #daa520', title: 'Edit Display Name', 'data-placement': 'left'}))),
                        crel('dt', 'Host Name:'),
                        crel('dd', data.host_name ? data.host_name + ' ' : 'N/A ',
                            crel('button', {class: 'btn btn-link noPadding', 'data-id': 'editModal', 'data-argument': 'hostname', 'data-value': data.host_name || ''},
                                crel('i', {class: 'icon-pencil', style: 'color: #daa520', title: 'Edit Host Name', 'data-placement': 'left'}))),
                        crel('dt', 'Production State:'),
                        crel('dd', data.production_level ? data.production_level + ' ' : 'N/A',
                            crel('button', {class: 'btn btn-link noPadding', 'data-id': 'editModal', 'data-argument': 'production_level', 'data-value': data.production_level || ''},
                                crel('i', {class: 'icon-pencil', style: 'color: #daa520', title: 'Edit Production Level'}))),
                        crel('dt', 'Machine Type:'),
                        crel('dd', data.machine_type || 'N/A'),
                        crel('dt', 'DNS Name'),
                        crel('dd', data.dns_name || 'N/A')
                    );
                    return $dl[0];
                },
                capitaliseFirstLetter: function (string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                },
                getTitle: function (key) {
                    var that = this,
                        title = key.split('_');
                    _.each(title, function (word, i) {
                        title[i] = that.capitaliseFirstLetter(word);
                    });
                    return title.join(' ');
                },
                toggleModal: function (event) {
                    event.preventDefault();
                    var $edit = $(event.currentTarget);
                    this.modal.setHeaderHTML(this.renderModalHeader($edit))
                        .setContentHTML(this.renderModalLayout($edit))
                        .open();
                    this.modal.$('input').focus();
                },
                renderModalHeader: function ($button) {
                    return crel('h4', 'Edit ' + this.capitaliseFirstLetter($button.data('argument')))
                },
                renderModalLayout: function ($button) {
                    return crel('form', {id: 'editForm', class: 'form-horizontal'},
                            crel('div', {class: 'control-group noMargin'},
                                crel('label', {class: 'control-label'}, this.capitaliseFirstLetter($button.data('argument')) + ':'),
                                crel('div', {class: 'controls'},
                                    crel('input', {type: 'text', 'required': 'required', 'data-url': $button.data('url'), 'data-argument': $button.data('argument'), value: $button.data('value')}), crel('br'),
                                    crel('div', {class: 'help-online', style: 'margin-top: 5px;', 'data-name': 'message'})
                                )
                            )
                    );
                },
                edit: function () {
                    var $input = this.$('input'),
                        $message = $input.siblings('.help-online'),
                        url = '/api/v1/agent/' + this.options.parentView.model.get('id'),
                        params = {},
                        that = this;
                    params[$input.data('argument')] = $input.val();
                    $message.removeClass('alert-error alert-success').addClass('alert-info').html('Submitting...');
                    if ($input.val()) {
                        $.ajax({
                            url: url,
                            type: 'PUT',
                            contentType: 'application/json',
                            data: JSON.stringify(params),
                            success: function (response) {
                                if (response.http_status === 200) {
                                    $message.removeClass('alert-info alert-success alert-error').addClass('alert-error').html('');
                                    that.cancel();
                                    that.options.parentView.data.fetch();
                                }
                            },
                            error: function (e) {
                                var error = JSON.parse(e.responseText);
                                $message.removeClass('alert-info alert-success').addClass('alert-error').html(error.message);
                            }
                        });
                    } else {
                        $message.removeClass('alert-info alert-success').addClass('alert-error').html('Field cannot be empty.');
                    }
                }
            }),
            Settings: Backbone.View.extend({
                tagName: 'div',
                className: [exports.name].join(' '),
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
