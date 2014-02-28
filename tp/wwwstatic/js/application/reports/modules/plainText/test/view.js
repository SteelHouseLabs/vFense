define(
    ['application/reports/modules/plainText/plainText'],
    function (simpleText) {
        'use strict';
        module('simpletext', {
            setup: function () {
                this.model = new simpleText.models.Main({
                    text: 'This is a test.'
                });
            }
        });
        test('Model init tests', 2, function () {
            var temp = new simpleText.models.Main({});
            equal(temp.get('text'), '', 'Default model is correct');
            equal(this.model.get('text'), 'This is a test.', 'Model init with text param is correct');
        });
        test('Main view tests', 1, function () {
            var view = new simpleText.views.Main({
                    model: this.model
                }),
                text = this.model.get('text'),
                $el = view.$el;
            view.render();
            equal($el.text(), text, 'Main view correctly rendered the model\'s text');
        });
        test('Settings view tests', 5, function () {
            var model = this.model,
                view = new simpleText.views.Settings({
                    model: model
                }),
                $el = view.$el;
            view.render();
            equal($el.val(), model.get('text'), 'Textarea correctly contains the model\'s text');

            $el.val('This is new text');
            ok(true, 'Change the text of the text area');
            equal($el.val(), 'This is new text', 'Text is correctly changed');

            $el.trigger('change');
            ok(true, 'Trigger change event');
            stop();
            setTimeout(function () {
                equal(model.get('text'), 'This is new text', 'Model correctly updated');
                start();
            }, 110);
        });

        var model = new simpleText.models.Main({}),
            view = new simpleText.views.Main({model: model}),
            settings = new simpleText.views.Settings({model: model});

        view.render().$el.appendTo('#mainView');
        settings.render().$el.appendTo('#settView');
    }
);
