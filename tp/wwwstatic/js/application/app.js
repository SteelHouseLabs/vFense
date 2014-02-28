define(
    [
        'jquery', 'underscore', 'backbone', 'notifyosd', 'utilities/vent', 'utilities/viewManager',
        'utilities/inheritance', 'utilities/pinwheel', 'utilities/webSocket'
    ],
    function ( $, _, Backbone, NotifyOSD, vent, ViewManager, inheritance, pinwheel, WebSocket ) {
        'use strict';
        var app = {}, User;
        _.extend(app, {
            root: '/',
            $doc: $(document),
            title: $(document).attr('title'),
            vent: vent,
            ViewManager: ViewManager,
            views: { modals: { admin: undefined } },
            parseQuery: function (query, coerce) {
                var params = {},
                    coerce_types = {'true': true, 'false': false, 'null': null},
                    decode = decodeURIComponent;

                _.each(query.split('&'), function (param) {
                    param = param.split('=');
                    var key = decode(param[0]),
                        val = decode(param[1]);
                    if (coerce || $.type(coerce) === "undefined") {
                        if ($.isNumeric(val)) {
                            val = +val;
                        } else if (val === "undefined") {
                            val = undefined;
                        } else if (coerce_types[val] !== undefined) {
                            val = coerce_types[val];
                        }
                    }
                    params[key] = val;
                });

                return params;
            },
            pinwheel: pinwheel.View,
            inherit: inheritance.inherit,
            createChild: inheritance.createChild,
            notifyOSD: new NotifyOSD(),
            webSocket: new WebSocket(app.vent),
            locations: [
                { name: 'Dashboard', href: '#dashboard' },
                { name: 'Agents', href: '#nodes' },
                { name: 'Applications', href: '#patches' },
                { name: 'Tags', href: '#tags' },
                { name: 'Schedules', href: '#schedules' },
                { name: 'Operations', href: '#operations'},
                { name: 'System Reports', href: '#reports'}
            ]
        });
        User = Backbone.Model.extend({
            defaults: {
                username: 'John Doe'
            },
            url: '/api/user',
            parse: function (response) {
                this.apiMessage = response.message;
                this.apiPass = response.pass;
                return response.data;
            },
            hasPermission: function (need) {
                return _.indexOf(this.get('permissions'), need) !== -1;
            }
        });
        _.extend(app, {
            user: new User()
        });
        return app;
    }
);
