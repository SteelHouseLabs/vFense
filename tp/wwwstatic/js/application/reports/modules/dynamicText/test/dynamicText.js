define(
    ['jquery', 'underscore', 'application/reports/modules/dynamicText/dynamicText'],
    function ($, _, dynamicText) {
        'use strict';
        module('hardwareInfo', {
            setup: function () {
                this.model = dynamicText.models.Main;
                this.dynamicText = dynamicText.views.Main;
            }
        });
        test('hardwareInfo model tests', 0, function () {
            //
        });
        test('hardwareInfo view tests', 0, function () {
            var model = new this.model({
                    url: '/api/networkData',
                    key: 'installed',
                    name: 'Installed:',
                    prefix: '',
                    suffix: ' Patches',
                    frequency: 5
                }),
                dynamicText = new this.dynamicText({
                    model: model
                });
            dynamicText.render();
            $('#test').append(dynamicText.$el);
            window.console.log(dynamicText);
            window.console.log(dynamicText.$el[0]);
        });
    }
);
