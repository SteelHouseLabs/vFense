define(['jquery', 'underscore', 'backbone', 'reports/column'], function ($, _, Backbone, column) {
    'use strict';
    var myView = window.myView = new column.View({
            el: '#test',
            model: new column.Model({
                moduleName: 'plainText',
                moduleJSON: {text: 'test\nLine 2'}
            }),
            editable: true
        }),
        myView2 = new column.View({
            el: '#test2',
            model: new column.Model({}),
            editable: true
        });
    myView.loadModule().render();
    myView2.loadModule().render();

    module('Columns', {
        setup: function () {
            this.ear = _.extend({}, Backbone.Events);
            this.timeouts = {};
            this.expectEvent = function (speaker, event, timeout) {
                stop();
                if (_.isUndefined(timeout) || timeout <= 0) { timeout = 1000; }
                var id = _.uniqueId('event_'),
                    that = this;
                this.ear.listenTo(speaker, event, function () {
                    ok(true, event + ' event triggered');
                    clearTimeout(that.timeouts[id]);
                    start();
                });
                this.timeouts[id] = setTimeout(function () {
                    ok(false, event + ' event did not trigger');
                    start();
                }, timeout);
            };
        },
        teardown: function () {
            _.each(this.timeouts, function (timeout) { clearTimeout(timeout); });
            this.ear.stopListening();
            if (this.view) { this.view.close(); }
        }
    });

    test('Model Defaults', 4, function () {
        this.model = new column.Model();
        ok(true, 'init Default Model');
        strictEqual(this.model.get('moduleName'), 'plainText', 'Default model starts with moduleName = "plainText"');
        ok($.isPlainObject(this.model.get('moduleJSON')), 'Default model.moduleJSON is plain object');
        ok(_.isEmpty(this.model.get('moduleJSON')), 'Default model.moduleJSON is empty object');
    });

    test('Model.moduleName invalidation', 9, function () {
        var badValues = [null, undefined, [], {}, function () {}, 1, '', ' ', 'invalidModule'],
            that = this;

        _.each(badValues, function (value) {
            var model = new column.Model();
            that.expectEvent(model, 'invalid', 100);
            model.set({'moduleName': value}, {'validate': true});
        });
    });

    test('Model.moduleJSON invalidation', 7, function () {
        var badValues = [null, undefined, [], function () {}, 1, '', ' '],
            that = this;

        _.each(badValues, function (value) {
            var model = new column.Model();
            that.expectEvent(model, 'invalid', 100);
            model.set({'moduleJSON': value}, {'validate': true});
        });
    });

    test('View: changeModule to "invalidModule"', 1, function () {
        var that = this,
            moduleName = 'invalidModule',
            expectedEvents = ['invalid'];
        this.model = new column.Model();
        this.view = new column.View({
            model: this.model
        });
        _.each(expectedEvents, function (event){
            that.expectEvent(that.model, event);
        });
        this.view.changeModule(moduleName);
    });

    test('View: changeModule to "richText', 6, function () {
        var that = this,
            moduleName = 'richText',
            expectedEvents = ['moduleLoad', 'moduleLoaded', 'moduleLoad:' + moduleName, 'moduleLoaded:' + moduleName];
        this.model = new column.Model();
        this.view = new column.View({
            model: this.model
        });

        _.each(expectedEvents, function (event){
            that.expectEvent(that.view, event);
        });

        this.view.once('moduleLoaded', function () {
            var module = that.view.module || undefined;
            ok(!_.isUndefined(module), 'view.module is defined');
            ok(_.has(module, 'name') && module.name === moduleName, 'view.module.name exists and is correct');
        });

        // External Regression Testing
        this.view.once('moduleLoad:Error', function (e) {
            throw(e);
        });
        this.model.once('invalid', function () {
            ok(false, 'Model reports: ' + that.model.validationError.join(', '));
        });
        this.view.once('invalidModuleName', function () {
            ok(false, 'view reports "' + moduleName + '" is not valid. ' +
                'Either "' + moduleName + '" is wrong, or "reports/modules/list.json" is.');
        });

        that.view.changeModule(moduleName);
    });
});