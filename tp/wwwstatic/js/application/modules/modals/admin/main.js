define(
    ['jquery', 'underscore', 'backbone', 'app', 'modals/panel', 'modules/tabNavigation'],
    function ($, _, Backbone, app, panel, tabs) {
        'use strict';
        var exports = {},
            View = exports.View = app.createChild(panel.View);

        _.extend(View.prototype, {
            _lastURL: '',
            span: 'span10',
            navigation: new tabs.View({
                tabs: [
                    {text: 'Users', href: 'admin/users'},
                    {text: 'Groups', href: 'admin/groups'},
                    {text: 'Customers', href: 'admin/customers'},
                    //{text: '3rd Party Apps', href: 'admin/uploader'},
                    {text: 'Services', href: 'admin/services'},
                    {text: 'Notifications', href: 'admin/notifications'}
                    //{text: 'Email Alerts', href: 'admin/emailAlerts'}
                ]
            }),
            initialize: function () {
                View.__super__.initialize.apply(this, arguments);
                this.$el.find('.modal-header').addClass('tabs').html(this.navigation.render().el);
                this.navigation.setActive(app.router.getCurrentFragment());
                return this;
            },
            showLoading: function () {
                this._pinwheel = this._pinwheel || new app.pinwheel();
                if (!(this._contentView instanceof app.pinwheel)) {
                    this.setContentView(this._pinwheel);
                }
                return this;
            },
            open: function () {
                var that = this,
                    router = app.router,
                    last;

                // Save last fragment and go back to it on 'close'
                last = router.getLastFragment();
                if (last === '' || router.adminRoute(last)) {
                    this._lastURL = 'dashboard';
                } else {
                    this._lastURL = last;
                }

                this.showLoading();

                this.listenTo(router, 'route', function () {
                    if (router.adminRoute()) {
                        that.navigation.setActive(router.getCurrentFragment());
                        that.showLoading();
                    }
                });

                View.__super__.open.apply(this, arguments);
            },
            beforeClose: function () {
                View.__super__.beforeClose.apply(this, arguments);
                if (this._lastURL !== '') {
                    app.router.navigate(this._lastURL);
                } else {
                    app.router.navigate('dashboard', {trigger: true});
                }
            }
        });

        return exports;
    }
);
