define(
    ['jquery', 'underscore', 'backbone', 'crel', 'modals/panel', 'h5f'],
    function ($, _, Backbone, crel, Panel, h5f) {
        'use strict';
        var exports = {}, Modal,
            tabNames = {
                '#main': {
                    name: 'MAIN',
                    keys: [
                        {name: 'name', title: 'Name:'},
                        {name: 'version', title: 'Version:'},
                        {name: 'rv_severity', title: 'Severity', edit: true},
                        {name: 'cli_options', title: 'Silent Install Options', edit: true},
                        {name: 'release_date', title: 'Release Date'},
                        {name: 'kb', title: 'KB:'},
                        {name: 'description', title: 'Description:'}
                    ]
                },
                '#vendor': {
                    name: 'VENDOR',
                    keys: [
                        {name: 'vendor_name', title: 'Vendor Name:'},
                        {name: 'vendor_severity', title: 'Vendor Severity:'},
                        {name: 'support_url', title: 'Support URL:'}
                    ]
                },
                '#url': {
                    name: 'URLS',
                    keys: [{name: 'file_data'}]
                }
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
        exports.name = 'patchInfo';
        exports.models = {
            Main: Backbone.Model.extend({
                defaults: {
                    id: '',
                    defaultTab: '#main'
                }
            })
        };
        exports.views = {
            Main: Backbone.View.extend({
                tagName: 'div',
                className: ['hardwareInfo'].join(' '),
                initialize: function () {
                    if (_.isUndefined(this.model)) {
                        throw new Error('hardwareInfo view requires a hardwareInfo model');
                    }
                    var id = this.model.get('id'),
                        type = this.model.get('type'),
                        that = this;
                    this._currentTab = this.model.get('defaultTab');
                    this.data = new (Backbone.Model.extend({
                        baseUrl: '/api/v1/app/' + type + '/',
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
                    this.listenTo(this.data, 'sync', this.renderTabs);
                },
                events: {
                    'click li a[data-toggle=tab]'   : 'changeTab',
                    'click button[data-action=edit]': 'toggleModal'
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
                        crel('div', {class: 'tabbable tabs-left'},
                            crel('ul', {class: 'nav nav-tabs'}),
                            crel('div', {class: 'tab-content'})
                        )
                    );
                    return fragment;
                },
                renderTabs: function (model) {
                    if (model.get('http_status') !== 200) {
                        throw new Error('API was not able to fetch data');
                    }
                    var selected, $navTabs = this.$el.find('.nav-tabs'),
                        fragment = document.createDocumentFragment(),
                        that = this;
                    _.each(_.keys(tabNames), function (tabName) {
                        selected = (tabName === that._currentTab) ? 'active'  : '';
                        fragment.appendChild(
                            crel('li', {class: selected},
                                crel('a', {href: tabName, 'data-toggle': 'tab'}, tabNames[tabName].name))
                        );
                        if (selected) {
                            that.renderTab(tabName);
                        }
                    });
                    $navTabs.empty().append(fragment);
                },
                changeTab: function (event) {
                    event.preventDefault();
                    var href = $(event.currentTarget).attr('href');
                    this.renderTab(href);
                },
                renderTab: function (tab) {
                    var $content = this.$el.find('.tab-content'),
                        $dl = $(crel('dl', {class: 'inline'})),
                        data = this.data.get('data'),
                        keys = tabNames[tab].keys;
                    $content.empty();
                    if (keys.length) {
                        _.each(keys, function (object) {
                            var content = data[object.name];
                            if (_.isUndefined(content)) {
                                return;
                            } else if (typeof content === 'string') {
                                if (object.edit) {
                                    $dl.append(
                                        crel('dt', object.title),
                                        crel('dd', data[object.name], ' ',
                                            crel('button', {class: 'btn btn-link noPadding', 'data-action': 'edit', style: 'vertical-align: baseline;', 'data-name': object.name},
                                                crel('i', {class: 'icon-pencil', style: 'color: #daa520', title: 'Edit'}))
                                        )
                                    );
                                } else {
                                    $dl.append(
                                        crel('dt', object.title),
                                        crel('dd', data[object.name] || 'N/A')
                                    );
                                }
                            } else if (content.length) {
                                _.each(content, function (file) {
                                    $dl.append(
                                        crel('dt', 'Name:'),
                                        crel('dd', file.file_name || 'N/A'),
                                        crel('dt', 'URI:'),
                                        crel('dd',
                                            crel('a', {href: file.file_uri || 'javascript:;'}, file.file_uri || 'N/A')
                                        ),
                                        crel('dt', 'Hash:'),
                                        crel('dd', file.file_hash || 'N/A'),
                                        crel('dt', 'Size:'),
                                        crel('dd', file.file_size || 'N/A')
                                    );
                                });
                            } else {
                                $dl.append(
                                    crel('dt', object.title),
                                    crel('dd', 'No data to display')
                                );
                            }
                        });
                    }
                    $content.append($dl);
                },
                toggleModal: function (event) {
                    event.preventDefault();
                    this.modal.setHeaderHTML(this.renderModalHeader())
                        .setContentHTML(this.renderModalLayout(this.data.get('data'), $(event.currentTarget).data('name')))
                        .open();
                    this.modal.$('input').focus();
                },
                renderModalHeader: function () {
                    return crel('h4', 'Edit Severity');
                },
                renderModalLayout: function (data, type) {
                    var input;
                    if (type === 'rv_severity') {
                        input = crel('select', {'required': 'required', 'data-argument': 'severity'},
                            crel('option', this.printAttributes('Optional', data.rv_severity), 'Optional'),
                            crel('option', this.printAttributes('Recommended', data.rv_severity), 'Recommended'),
                            crel('option', this.printAttributes('Critical', data.rv_severity), 'Critical')
                        );
                    } else if (type === 'cli_options') {
                        input = crel('input', {required: 'required', type: 'text', value: data.cli_options, 'data-argument': 'install_options'});
                    }
                    return crel('form', {id: 'editForm', class: 'form-horizontal'},
                            crel('div', {class: 'control-group noMargin'},
                                crel('label', {class: 'control-label'}, 'Severity:'),
                                crel('div', {class: 'controls'},
                                    input, crel('br'),
                                    crel('div', {class: 'help-online', style: 'margin-top: 5px;', 'data-name': 'message'})
                                )
                            )
                    );
                },
                printAttributes: function (option, severity) {
                    var attributes = {};
                    attributes.value = option;
                    if (attributes.value === severity) {
                        attributes.selected = 'selected';
                    }
                    return attributes;
                },
                edit: function () {
                    var $input = this.$('select, input'),
                        $message = $input.siblings('.help-online'),
                        url = this.options.parentView.data.url(),
                        params = {},
                        that = this;
                    params[$input.data('argument')] = $input.val();
                    $message.removeClass('alert-error alert-success').addClass('alert-info').html('Submitting...');
                    if ($input.val()) {
                        $.ajax({
                            url: url,
                            type: 'POST',
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
                initialize: function () {
                    //this.template = myTemplate;
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    this.$el.empty();

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
