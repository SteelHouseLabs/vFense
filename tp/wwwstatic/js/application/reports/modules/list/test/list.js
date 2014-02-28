define(
    ['jquery', 'underscore', 'reports/modules/list/list'],
    function ($, _, list) {
        'use strict';
        module('list', {
            setup: function () {
                this.model = list.models.Main;
                this.listview = list.views.Main;
            }
        });
        test('List Model tests', 2, function () {
            var model = new this.model(),
                model2 = new this.model({
                    source: 'api/nodes.json'
                });
            ok(_.isEmpty(model.get('source')), 'Default model initialized with empty source');
            ok(model2.get('source') === 'api/nodes.json', 'Model initialized with source "/api/nodes.json"');
        });
        test('List View tests', 2, function () {
            var model = new this.model({
                    source: 'api/nodes.json',
                    keys: ['computer_name', 'os_string', 'version'],
                    columnTitles: ['Name', 'Operating System', 'RV Version']
                }),
                listView = new this.listview({
                    model: model
                });
            listView.render();
            $('#test').css('width', '600px').append(listView.$el);
            ok(listView.model.get('keys').length === 3, 'Created list with 3 keys');
            ok(listView.model.get('columnTitles').length === 3, 'Created list with 3 column titles');
        });
    }
);