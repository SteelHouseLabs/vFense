define(['jquery', 'underscore', 'backbone', 'application/reports/modules/statBox/statBox'],
    function ($, _, Backbone, statBox) {
        'use strict';
        module('statBox', {
            setup: function () {
                this.statbox = statBox;
            }
        });
        test('statBox model tests', 1, function () {
            var model = new this.statbox.Model({
                    key: 'recommended_installed'
                });
            ok(model.get('key') === 'recommended_installed', 'Initialized model with key of "recommended_installed"');
        });
        test('statBox collection tests', 2, function () {
            //code for collection
            //pending api
            var model = new this.statbox.Model({
                    key: 'available'
                }),
                statBox = new this.statbox.View({
                    model: model
                });
            ok(statBox.collection instanceof Backbone.Collection, 'statBox collection should be a backbone collection');
            ok(statBox.collection.length === 1, 'statBox collection should always be of length 1');
        });
        test('statBox view tests', 8, function () {
            //code for view
            var model = new this.statbox.Model({
                    key: 'available'
                }),
                model2 = new this.statbox.Model({
                    key: 'critical_installed'
                }),
                statBox = new this.statbox.View({
                    model: model
                }),
                statBox2 = new this.statbox.View({
                    model: model2
                });
            ok(model.get('key') === 'available', 'Initialize first model with key available');
            ok(model2.get('key') === 'critical_installed', 'Initialize first model with key critical_available');
            ok(statBox.collection instanceof Backbone.Collection, 'statBox collection should be a backbone collection');
            ok(statBox2.collection instanceof Backbone.Collection, 'statBox2 collection should be a backbone collection');
            ok(statBox.collection.length === 1, 'statBox collection should always be of length 1');
            ok(statBox2.collection.length === 1, 'statBox2 collection should always be of length 1');
            ok(statBox.$el.hasClass('warning'), 'statBox initialized with class warning');
            ok(statBox2.$el.hasClass('success'), 'statBox2 initialized with class success');
            $('#test').append(statBox.$el);
            $('#test2').append(statBox2.$el);
        });
    }
);
