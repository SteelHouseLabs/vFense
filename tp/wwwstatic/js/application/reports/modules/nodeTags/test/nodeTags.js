define(
    ['jquery', 'underscore', 'reports/modules/nodeTags/nodeTags', 'reports/column'],
    function ($, _, nodeTags, column) {
        'use strict';
        module('nodeTags', {
            setup: function () {
                this.model = nodeTags.models.Main;
                this.nodeTagsView = nodeTags.views.Main;
            }
        });
        test('nodeTags model tests', 1, function () {
            var model = new this.model({
                    id: '514b43c3-8cc8-47a1-9a8c-255238cce888'
                });
            ok(model.get('id') === '514b43c3-8cc8-47a1-9a8c-255238cce888', 'nodeTags model init to 514b43c3-8cc8-47a1-9a8c-255238cce888');
        });
        test('nodeTags view tests', 0, function () {
            var model = new this.model({
                    id: '514b43c3-8cc8-47a1-9a8c-255238cce888'//'8461682b-8f3b-42ac-ae8f-7193aa5b0dd6'//
                }),
                nodeTagsView = new this.nodeTagsView({
                    model: model
                }),
                myView = new column.View({
                    el: '#test',
                    model: new column.Model({
                        moduleName: 'reports/modules/nodeTags/nodeTags',
                        moduleJSON: {id: '514b43c3-8cc8-47a1-9a8c-255238cce888'},
                        moduleSpan: 6
                    })
                });
            myView.loadModule().render();
            console.log(myView);
        });
    }
);
