define(
    ['jquery', 'underscore', 'reports/modules/patchManager/patchManager'],
    function ($, _, patchManager) {
        'use strict';
        module('nodeTags', {
            setup: function () {
                this.model = patchManager.models.Main;
                this.patchManagerView = patchManager.views.Main;
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
                patchManagerView = new this.patchManagerView({
                    model: model
                });
            patchManagerView.render();
            $('#test').append(patchManagerView.$el);
            console.log(patchManagerView);
            console.log(patchManagerView.$el[0]);
        });
    }
);
