define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modules/lists/pageable', 'text!templates/modals/admin/notifications.html', 'select2'],
    function ($, _, Backbone, app, crel, Pager, myTemplate) {
        'use strict';
        var exports = {},
            Notifications;
        Notifications = Pager.View.extend({
            showHeader: false,
            showLegend: true,
            layoutLegend: function ($legend) {
                $legend.append(
                    crel('span', {class: 'span3'}, 'Rule Name'),
                    crel('span', {class: 'span2'}, 'Created By'),
                    crel('span', {class: 'span3'}, 'Notification Type'),
                    crel('span', {class: 'span2'}, 'Description'),
                    crel('span', {class: 'span2 alignRight'}, 'Options')
                );
                return this;
            },
            initialize: function (options) {
                this.template = myTemplate;
                Pager.View.prototype.initialize.call(this, options);
            },
            renderModel: function (model) {
                var template = _.template(this.template);
                return template({type: 'main', model: model});
            }
        });
        _.extend(exports, {
            View: Backbone.View.extend({
                tagName: 'article',
                className: 'tabbable tabs-left',
                initialize: function () {
                    this.template = myTemplate;
                    this._currentTab = '#main';
                    this.pager = new Notifications({
                        collection: new (Pager.Collection.extend({
                            baseUrl: 'api/v1/notifications'
                        }))()
                    });
                    this.notification = new (Backbone.Model.extend({
                        baseUrl: 'api/v1/notification/',
                        url: function () {
                            return this.baseUrl + this.id;
                        },
                        parse: function (response) { return response.data; }
                    }))();
                    this.listenTo(this.notification, 'sync', this.renderModel);
                    this.listenTo(this.pager.collection, 'sync', this.renderList);
                },
                events: {
                    'click [data-toggle=tab]': 'changeView',
                    'change input[type=radio]': 'toggleNotificationType',
                    'submit #saveNotification': 'saveNotification',
                    'click button[data-action=toggleDelete]': 'toggleDelete',
                    'click button[data-action=delete]': 'deleteNotification',
                    'click a[data-action=modify]': 'showModify'
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template);

                    this.$el.empty();

                    this.$el.html(template({type: 'layout'}));
                    this.renderView(this._currentTab);

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },
                showLoading: function (el) {
                    var $el = this.$el,
                        $div = $el.find(el);
                    this._pinwheel = new app.pinwheel();
                    $div.empty().append(this._pinwheel.el);
                },
                changeView: function (event) {
                    event.preventDefault();
                    var $tab = $(event.currentTarget);
                    this.renderView($tab.attr('href'));
                },
                renderView: function (view) {
                    var $content = this.$('.tab-content'),
                        template = _.template(this.template);
                    if (view === '#main') {
                        this.pager.render();
                    } else if (view === '#modify') {
                        this.notification.fetch();
                    } else {
                        $content.empty().html(template({type: view.replace('#', ''), data: {}}));
                        this.initializeInputs();
                    }
                    return this;
                },
                showModify: function (event) {
                    var notificationID = $(event.currentTarget).data('id');
                    this.notification.id = notificationID;
                    this.changeView(event);
                },
                renderModel: function (model) {
                    var $content = this.$('.tab-content'),
                        template = _.template(this.template),
                        payload = {
                            type: 'modify',
                            data: {
                                ruleName: model.get('rule_name'),
                                ruleDescription: model.get('rule_description'),
                                control: model.get('user') ? 'user' : 'group',
                                controlData: model.get('user') || model.get('group'),
                                operationType: model.get('notification_type'),
                                appThreshold: model.get('app_threshold'),
                                rebootThreshold: model.get('reboot_threshold'),
                                shutdownThreshold: model.get('shutdown_threshold')
                            }
                        };
                    console.log(payload.data);
                    $content.empty().html(template(payload));
                    this.initializeInputs();
                    return this;
                },
                renderList: function () {
                    var $content = this.$('.tab-content');
                    $content.empty().html(this.pager.$el);
                },
                initializeInputs: function () {
                    var $users = this.$('#users'),
                        $groups = this.$('#groups');
                    $users.select2({
                        ajax: {
                            url: 'api/users',
                            data: function (search) {
                                return {query: search};
                            },
                            results: function (data) {
                                var results = [];
                                if (data.pass) {
                                    _.each(data.data, function (object) {
                                        results.push({id: object.username, text: object.username});
                                    });
                                    return {results: results, more: false, context: results};
                                }
                            }
                        },
                        initSelection : function (element, callback) {
                            var data = {id: element.val(), text: element.val()};
                            callback(data);
                        }
                    });
                    $groups.select2({
                        ajax: {
                            url: 'api/groups',
                            data: function (search) {
                                return {query: search};
                            },
                            results: function (data) {
                                var results = [];
                                if (data.pass) {
                                    _.each(data.data, function (object) {
                                        results.push({id: object.id, text: object.name});
                                    });
                                    return {results: results, more: false, context: results};
                                }
                            }
                        },
                        initSelection : function (element, callback) {
                            var data = {id: element.val(), text: element.val()};
                            callback(data);
                        }
                    });
                },
                toggleDelete: function (event) {
                    var $button = $(event.currentTarget),
                        $span = $button.siblings('span');
                    if (!$span.length) {
                        $span = $button.parent();
                        $button = $span.siblings('button[data-action=toggleDelete]');
                    }
                    $span.toggle();
                    $button.toggle();
                },
                toggleNotificationType: function () {
                    var $user = this.$('#userDiv'),
                        $group = this.$('#groupDiv');
                    $user.toggle().find('input').select2('val', '');
                    $group.toggle().find('input').select2('val', '');
                    return this;
                },
                deleteNotification: function (event) {
                    var notificationID = $(event.currentTarget).data('id'),
                        url = 'api/v1/notification/' + notificationID,
                        that = this;
                    $.ajax({
                        url: url,
                        type: 'DELETE',
                        contentType: 'application/json',
                        success: function (response) {
                            if (response.http_status === 200) {
                                that.pager.render();
                            } else {
                                app.notifyOSD.createNotification('!', 'Error', response.message);
                            }
                        }
                    });
                },
                saveNotification: function (event) {
                    event.preventDefault();
                    var $form = $(event.currentTarget),
                        type = $form.data('type');
                    if (type === 'create') {
                        this.createNotification($form);
                    } else {
                        this.updateNotification($form);
                    }
                },
                updateNotification: function ($form) {
                    var $inputs = $form.find('[data-type=input]'),
                        username = $form.find('#users').val(),
                        groupname = $form.find('#groups').val(),
                        params = {plugin: 'rv'},
                        invalid = false,
                        that = this;
                    $inputs.each(function () {
                        if (this.value && this.value !== '-1') {
                            params[this.name] = this.value;
                            $(this).parents('.control-group').removeClass('error');
                        } else {
                            invalid = true;
                            $(this).parents('.control-group').addClass('error');
                        }
                    });
                    if (groupname || username) {
                        if (groupname) {
                            params.group = groupname;
                        } else {
                            params.user = username;
                        }
                        $form.find('#users').parents('.control-group').removeClass('error');
                        $form.find('#groups').parents('.control-group').removeClass('error');
                    } else {
                        invalid = true;
                        $form.find('#users').parents('.control-group').addClass('error');
                        $form.find('#groups').parents('.control-group').addClass('error');
                    }
                    if (!invalid) {
                        $.ajax({
                            url: 'api/v1/notification/' + that.notification.id,
                            contentType: 'application/json',
                            type: 'PUT',
                            data: JSON.stringify(params),
                            success: function (response) {
                                if (response.http_status === 200) {
                                    $form[0].reset();
                                    that.renderView('#main');
                                    app.notifyOSD.createNotification('', 'Success', 'Rule Updated');
                                } else {
                                    app.notifyOSD.createNotification('', 'Error', response.message);
                                }
                            }
                        });
                    }
                },
                createNotification: function ($form) {
                    var $inputs = $form.find('[data-type=input]'),
                        username = $form.find('#users').val(),
                        groupname = $form.find('#groups').val(),
                        params = {plugin: 'rv'},
                        invalid = false;
                    $inputs.each(function () {
                        if (this.value && this.value !== '-1') {
                            params[this.name] = this.value;
                            $(this).parents('.control-group').removeClass('error');
                        } else {
                            invalid = true;
                            $(this).parents('.control-group').addClass('error');
                        }
                    });
                    if (groupname || username) {
                        if (groupname) {
                            params.group = groupname;
                        } else {
                            params.user = username;
                        }
                        $form.find('#users').parents('.control-group').removeClass('error');
                        $form.find('#groups').parents('.control-group').removeClass('error');
                    } else {
                        invalid = true;
                        $form.find('#users').parents('.control-group').addClass('error');
                        $form.find('#groups').parents('.control-group').addClass('error');
                    }
                    if (!invalid) {
                        $.ajax({
                            url: 'api/v1/notifications',
                            contentType: 'application/json',
                            type: 'POST',
                            data: JSON.stringify(params),
                            success: function (response) {
                                if (response.http_status === 200) {
                                    $form[0].reset();
                                    app.notifyOSD.createNotification('', 'Success', 'Rule Created');
                                } else {
                                    app.notifyOSD.createNotification('', 'Error', response.message);
                                }
                            }
                        });
                    }
                }
            })
        });
        return exports;
    }
);
