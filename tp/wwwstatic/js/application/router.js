// Filename: router.js
define(
    ['jquery', 'underscore', 'backbone', 'app' ],
    function ($, _, Backbone, app) {
        'use strict';
        var AppRouter = Backbone.Router.extend({
            routes: {
                // Dashboard
                ''              : 'toDashboard',
                'dashboard'     : 'showDashboard',

                //logout
                'logout' : 'logout',

                // Nodes
                'nodes'         : 'showNodes',
                'nodes?:query'  : 'showNodes',
                'nodes/:id'     : 'showNode',

                // Patches
                'patches'               : 'showPatches',
                'patches/:type/'         : 'showPatches',
                'patches/:type?:query'  : 'showPatches',
                'patches/:type/:id'     : 'showPatch',

                'tags'          : 'showTags',
                'tags?:query'   : 'showTags',
                'tags/:id'      : 'showTag',

                // MultiPatch Interface
                'multi'         : 'showMulti',

                // Schedule Interface
                'schedules'      : 'showSchedules',
                'schedules/:id'  : 'showSchedule',

                // Log Interface
                'operations'            : 'showOperations',
                'operations/:id/'        : 'showOperations',
                'operations/:id?:query' : 'showOperations',

                // Account panel
                'account'       : 'showAccount',
                'customer/:id'  : 'verifyCustomer',


                'remote/:id'    : 'showRemote',
                'reports'       : 'showReports',

                // Administration Panels
                // Notice, update modals/admin/main.js if adding new admin/route
                // Warning, update modals/panel.js open method if changing 'admin'
                // Warning, update route method if changing 'admin'
                'admin/notifications': 'modal/admin/notifications',
                'admin/managetags'  : 'modal/admin/managetags',
                'admin/nodes'       : 'modal/admin/nodes',
                'admin/timeblock'   : 'modal/admin/timeblock',
                'admin/listblocks'  : 'modal/admin/listblocks',
                'admin/groups'      : 'modal/admin/groups',
                'admin/users'       : 'modal/admin/users',
                'admin/customers'   : 'modal/admin/customers',
                'admin/schedule'    : 'modal/admin/schedule',
                'admin/services'    : 'modal/admin/services',
                'admin/uploader'    : 'modal/admin/uploader'
                //'admin/emailAlerts' : 'modal/admin/emailAlerts'

                // Default
                // '*other'        : 'defaultAction'
            },
            navigate: function (fragment, options) {
                // Override
                // Call updateFragments after navigate
                Backbone.Router.prototype.navigate.call(this, fragment, options);
                return this.updateFragments();
            },
            route: function (route, name, callback) {
                // Override
                // Wrap callback so that we always updateFragments
                // before running the original callback
                if (!callback) { callback = this[name]; }
                var that = this,
                    newCallback = function () {
                        that.updateFragments();
                        if (callback) { callback.apply(that, arguments); }
                    };
                return Backbone.Router.prototype.route.call(this, route, name, newCallback);
            },
            initialize: function () {
                var that = this,
                    modals = app.views.modals,
                    hash;

                this.hashPattern = /^[\w\d_\-\+%]+[\?\/]{0}/;

                // Create a new ViewManager with #dashboard-view as its target element
                // All views sent to the ViewManager will render in the target element
                this.viewTarget = '#dashboard-view';
                this.viewManager = new app.ViewManager({'selector': this.viewTarget});
                this.currentFragment = '';
                this.lastFragment = '';

                this.on('route', function () {
                    // Track current and previous routes
                    if (that.adminRoute()) {
                        if (that.lastFragment === '') {
                            app.vent.trigger('navigation:' + that.viewTarget, '#' + 'dashboard');
                            that.showLoading().showDashboard();
                        }
                    } else {
                        // close any open admin modals
                        if (modals.admin instanceof Backbone.View && modals.admin.isOpen()) {
                            modals.admin.hide();
                        }
                        hash = that.hashPattern.exec(that.currentFragment) || 'dashboard';
                        app.vent.trigger('navigation:' + that.viewTarget, '#' + hash);
                        that.showLoading();
                    }
                });
            },
            toDashboard: function () {
                this.navigate('dashboard', {trigger:true, replace: true});
            },
            showDashboard: function () {
                this.show({hash: '#dashboard', title: 'Dashboard', view: 'modules/dashboard'});
            },
            logout: function () {
                $.ajax({
                    url: '/logout',
                    type: 'get'
                })
                .done(
                    function () {
                        window.document.location.assign('/login');
                    }
                )
                .fail(
                    function (response, status) {
                        app.notifyOSD.createNotification('!', 'Error', status);
                    }
                );
            },
            showNodes: function (query) {
                var that = this,
                    params = {},
                    collection,
                    view;

                if ($.type(query) === 'string' && query.length > 0) {
                    params = app.parseQuery(query);
                }
                require(['modules/nodes'], function (myView) {
                    collection = new myView.Collection({
                        params: params
                    });
                    view = new myView.View({collection: collection});
                    that.show({hash: '#nodes', title: 'Nodes', view: view});
                });
            },
            showNode: function (id) {
                this.show({hash: '#nodes', title: 'Node', view: 'modules/node', viewOptions: {templateParams: id}});
            },
            showPatches: function (type, query) {
                var tab = _.isUndefined(type) ? 'os' : type;
                this.show({
                    hash: '#patches',
                    title: 'Patches',
                    view: 'modules/patches',
                    viewOptions: {
                        query: $.type(query) === 'string' && query.length > 0 ? app.parseQuery(query) : {},
                        tab: tab
                    }
                });
            },
            showPatch: function (type, id) {
                this.show({hash: '#patches', title: 'Patch', view: 'modules/patch', viewOptions: {templateParams: {id: id, type: type}}});
            },
            showTags: function (query) {
                var that = this,
                    params = '',
                    collection,
                    view;

                require(['modules/tags'], function (myView) {
                    if ($.type(query) === 'string') {
                        params = app.parseQuery(query);
                    }

                    collection = new myView.Collection({
                        params: params
                    });

                    view = new myView.View({collection: collection});

                    that.show({hash: '#tags', title: 'Tags', view: view});
                });
            },
            showTag: function (id) {
                this.show({hash: '#tags', title: 'Tag', view: 'modules/tag', viewOptions: {templateParams: id}});
            },
            showMulti: function () {
                this.show({hash: '#multi', title: 'Patch Operations', view: 'modules/multi'});
            },
            showSchedules: function () {
                this.show({hash: '#schedules', title: 'Schedule Manager', view: 'modules/schedules'});
            },
            showSchedule: function (id) {
                this.show({hash: '#schedules', title: 'Schedule Info', view: 'modules/schedule', viewOptions: {id: id}});
            },
            showOperations: function (id, query) {
                this.show({
                    hash: '#operations',
                    title: 'Transaction Log',
                    view: 'modules/operations',
                    viewOptions: {
                        id: id,
                        query: $.type(query) === 'string' && query.length > 0 ? app.parseQuery(query) : {}
                    }
                });
            },
            showAccount: function () {
                this.show({hash: '#admin', title: 'Admin Settings', view: 'modules/accountSettings'});
            },
            verifyCustomer: function (id) {
                var url = 'api/users/edit',
                    that = this,
                    params = {
                        current_customer_id: id
                    };
                $.post(url, params, function (json) {
                    if (json.pass) {
                        app.notifyOSD.createNotification('!', 'Customer Changed', 'Access to customer granted');
                        app.vent.trigger('customer:change', id);
                        that.toDashboard();
                    } else {
                        app.notifyOSD.createNotification('', 'Insufficient Permissions', 'Access to customer is not allowed');
                        that.navigate(that.getLastFragment(), {trigger: true});
                    }
                });
            },
            showRemote: function (id) {
                this.show({hash: '#remote', title: 'Remote Desktop', view: 'modules/remote', viewOptions: {id: id}});
            },
            showReports: function () {
                this.show({hash: '#reports', title: 'Reports', view: 'modules/reports'});
            },
            'modal/admin/managetags': function () {
                this.openAdminModalWithView('modals/admin/managetags');
            },
            'modal/admin/nodes': function () {
                this.openAdminModalWithView('modals/admin/nodes');
            },
            'modal/admin/timeblock': function () {
                this.openAdminModalWithView('modals/admin/timeblock');
            },
            'modal/admin/listblocks': function () {
                this.openAdminModalWithView('modals/admin/listblocks');
            },
            'modal/admin/groups': function () {
                this.openAdminModalWithView('modals/admin/groups');
            },
            'modal/admin/users': function () {
                this.openAdminModalWithView('modals/admin/users');
            },
            'modal/admin/customers': function () {
                this.openAdminModalWithView('modals/admin/customers');
            },
            'modal/admin/schedule': function () {
                this.openAdminModalWithView('modals/admin/schedule');
            },
            'modal/admin/services': function () {
                this.openAdminModalWithView('modals/admin/services');
            },
            'modal/admin/notifications': function () {
                this.openAdminModalWithView('modals/admin/notifications');
            },
            'modal/admin/uploader': function () {
                this.openAdminModalWithView('modals/admin/uploader');
            },
            'modal/admin/emailAlerts': function () {
                this.openAdminModalWithView('modals/admin/emailAlerts');
            },
            /*
            defaultAction: function () {
                this.show(
                    {
                        hash: '#404',
                        title: 'Page Not Found',
                        view: new (Backbone.View.extend({
                            render: function () {
                                this.$el.html('<h1>404: <small>Not Found</small></h1>');
                                return this;
                            }
                        }))()
                    }
                );
            },
            */

            // Helper functions
            show: function (options) {
                var that = this,
                    settings = $.extend({
                        hash: undefined,
                        title: '',
                        view: undefined,
                        viewOptions: {}
                    }, options);

                app.vent.trigger('domchange:title', settings.title);

                if ($.type(settings.view) === 'string') {
                    require([settings.view], function (myView) {
                        var view = new myView.View(settings.viewOptions);
                        that.viewManager.showView(view);
                    });
                } else if (settings.view instanceof Backbone.View) {
                    that.viewManager.showView(settings.view);
                }

                return this;
            },

            showLoading: function () {
                this._pinwheel = this._pinwheel || new app.pinwheel();
                this.viewManager.showView(this._pinwheel);
                return this;
            },

            openAdminModalWithView: function (view) {
                var modal;

                // Check for proper admin permissions
                if (app.user.hasPermission('admin')) {
                    modal = app.views.modals.admin;

                    if (modal) {
                        if (modal.isOpen()) {
                            modal.setContentView(view);
                        } else {
                            modal.openWithView(view);
                        }
                    } else {
                        require(
                            ['modals/admin/main'],
                            function (admin) {
                                app.views.modals.admin = modal = new admin.View();
                                modal.openWithView(view);
                            }
                        );
                    }
                } else {
                    // ToDo: Consider addition of access denied page?
                    this.toDashboard();
                }
            },

            adminRoute: function (route) {
                var adminPattern = /^admin($|[\/\?])/;
                route = route || this.currentFragment;
                return adminPattern.test(route);
            },

            // Getters/Setters
            updateFragments: function () {
                var newFragment = Backbone.history.getFragment();
                if (this.currentFragment !== newFragment) {
                    this.lastFragment = this.currentFragment;
                    this.currentFragment = newFragment;
                }
                return this;
            },
            getCurrentFragment: function () { return this.currentFragment; },
            getLastFragment: function () { return this.lastFragment; }
        });
        return {
            initialize: function () {
                app.router = new AppRouter();
                Backbone.history.start();
            }
        };
    }
);
