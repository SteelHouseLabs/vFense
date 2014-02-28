require(
    ['jquery', 'app', 'crel'],
    function ($, app, crel) {
        'use strict';

        // Deferred object resolved after header and footer render.
        var deferredRender = new $.Deferred(),
            deferredRouter = new $.Deferred();

        app.user.on('sync', deferredRender.resolve).fetch();

        if (Modernizr.websockets) {
            app.webSocket.start();
            app.notifyOSD.start();
            app.vent.on('message', function (data) {
                app.notifyOSD.createNotification(data.icon, data.title, data.body);
            });
        } else {
            console.log('Websockets are not supported on this browser. Yet.');
        }

        // Listen for event to change the page title
        app.vent.on('domchange:title', function (title) {
            if (title && title.trim() !== '') {
                app.$doc.attr('title', app.title + ': ' + title);
            } else {
                app.$doc.attr('title', app.title);
            }
        });

        // When the deferredRender object is resolved, render the header and footer elements
        require(
            ['modules/pageHeader', 'modules/pageFooter', 'modules/navBar'],
            function (PageHeader, PageFooter, NavBar) {
                deferredRender.done(function () {
                    var pageHeader = new PageHeader.View(),
                        pageFooter = new PageFooter.View(),
                        navBar = new NavBar.View();

                    // Prepend header to body
                    // Append footer to body
                    $('body').prepend(pageHeader.render().$el)
                        .append(pageFooter.render().$el);

                    if(app.user.hasPermission("admin")) {
                        pageHeader.$('#userMenu')
                            .find('.divider')
                            .before(crel('li', crel('a', {'href': '#admin/users'}, 'Admin Settings')));
                    }

                    // Insert nav bar into header
                    pageHeader.$('#dashboardNav').append(navBar.render().$el);

                    // resolve the deferred object
                    deferredRouter.resolve();
                });
            }
        );

        // When the deferredRouter object is resolved, start the router
        require(['router'], function (Router) {
            deferredRouter.done(function () {
                Router.initialize();
            });
        });
    }
);
