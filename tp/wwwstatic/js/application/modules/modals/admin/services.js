define(
    ['jquery', 'underscore', 'backbone', 'app', 'modules/tabNavigation', 'modules/modals/admin/syslog', 'modules/modals/admin/vmware', 'modules/modals/admin/email', 'modules/modals/admin/relay', 'modules/modals/admin/remoteSettings', 'text!templates/modals/admin/services.html'],
    function ($, _, Backbone, app, tabNav, syslogView, virtualView, emailView, relayView, remoteView, myTemplate) {
        'use strict';
        var exports = {
            View: Backbone.View.extend({
                tagName: 'article',
                className: 'tabbable tabs-left',
                initialize: function () {
                    this.template = myTemplate;
                    this._currentTab = '#syslog';
                },
                events: {
                    'click li a': 'changeView'
                },
                beforeRender: $.noop,
                onRender: function () {
                    var $body = this.$el.find('.tab-content');

                    this.syslogView = new syslogView.View({
                        el: $body
                    });
                },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template);

                    this.$el.empty();

                    this.$el.html(template());

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
                    var $currentTab = $(event.currentTarget),
                        view = $currentTab.attr('href'),
                        $body = this.$el.find('.tab-content');
                    event.preventDefault();
                    if (this._currentTab !== view) {
                        this._currentTab = view;
                        this.showLoading('.tab-content');
                        if (view === '#syslog') {
                            if (this.syslogView) {
                                this.syslogView.render();
                            } else {
                                this.syslogView = new syslogView.View({
                                    el: $body
                                });
                                this.addSubViews(this.syslogView);
                            }
                        } else if (view === '#virtual') {
                            if (this.virtualView) {
                                this.virtualView.render();
                            } else {
                                this.virtualView = new virtualView.View({
                                    el: $body
                                });
                                this.addSubViews(this.virtualView);
                            }
                        } else if (view === '#email') {
                            if (this.emailView) {
                                this.emailView.render();
                            } else {
                                this.emailView = new emailView.View({
                                    el: $body
                                });
                                this.addSubViews(this.emailView);
                            }
                        } else if (view === '#remote') {
                            if (this.remoteView) {
                                this.remoteView.render();
                            } else {
                                this.remoteView = new remoteView.View({
                                    el: $body
                                });
                                this.addSubViews(this.remoteView);
                            }
                        } else if (view === '#relay') {
                            if (this.relayView) {
                                this.relayView.render();
                            } else {
                                this.relayView = new relayView.View({
                                    el: $body
                                });
                                this.addSubViews(this.relayView);
                            }
                        }
                    }
                }
            })
        };
        return exports;
    }
);
