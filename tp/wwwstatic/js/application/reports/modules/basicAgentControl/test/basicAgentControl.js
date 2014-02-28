define(
    ['jquery', 'underscore', 'reports/modules/basicAgentControl/basicAgentControl'],
    function ($, _, basicAgentControl) {
        'use strict';
        module('basicAgentControl', {
            setup: function () {
                this.model = basicAgentControl.models.Main;
                this.basicAgentControlView = basicAgentControl.views.Main;
            }
        });
        test('basicAgentControl model tests', 1, function () {
            var model = new this.model({id: 'c53b78fb-16ec-4553-a0ba-ee3aacca5d6e'});
            ok(model.get('id') === 'c53b78fb-16ec-4553-a0ba-ee3aacca5d6e', 'Model init with id c53b78fb-16ec-4553-a0ba-ee3aacca5d6e');
        });
        test('basicAgentControl view tests', 0, function () {
            var model = new this.model({id: '666ea7cf-63bd-4f69-ada3-470cf93a4dd1'}),
                basicAgentControlView = new this.basicAgentControlView({model: model});
            basicAgentControlView.render();
            $('#test').append(basicAgentControlView.$el);
            console.log(basicAgentControlView);
            console.log(basicAgentControlView.$el[0]);
        });
    }
);
