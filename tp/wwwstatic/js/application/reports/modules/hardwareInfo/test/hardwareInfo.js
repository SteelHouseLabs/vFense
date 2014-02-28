define(
    ['jquery', 'underscore', 'application/reports/modules/hardwareInfo/hardwareInfo'],
    function ($, _, hardwareInfo) {
        'use strict';
        module('hardwareInfo', {
            setup: function () {
                this.model = hardwareInfo.models.Main;
                this.hardwareInfoView = hardwareInfo.views.Main;
            }
        });
        test('hardwareInfo model tests', 2, function () {
            var model = new this.model(),
                model2 = new this.model({
                    id: '13f8712a-2090-42ae-aefc-b72e8a7dd557'
                });
            ok(_.isEmpty(model.get('id')), 'Default model id init to empty');
            ok(model2.get('id') === '13f8712a-2090-42ae-aefc-b72e8a7dd557', 'Init model id to 13f8712a-2090-42ae-aefc-b72e8a7dd557');
        });
        test('hardwareInfo view tests', 2, function () {
            var model = new this.model({
                    id: '8461682b-8f3b-42ac-ae8f-7193aa5b0dd6',
                    defaultTab: '#nic'
                }),
                hardwareInfoView = new this.hardwareInfoView({
                    model: model
                });
            hardwareInfoView.render();
            ok(_.isEmpty(hardwareInfoView._currentTab), 'current tab set to empty');
            ok(hardwareInfoView.defaultTab === '#nic', 'Default tab set to #nic');
            $('#test').append(hardwareInfoView.$el);
            window.console.log(hardwareInfoView);
        });
    }
);
