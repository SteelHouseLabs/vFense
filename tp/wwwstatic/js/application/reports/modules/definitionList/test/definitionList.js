define(
    ['application/reports/modules/definitionList/definitionList'],
    function (definitionList) {
        'use strict';
        module('definitionList', {
            setup: function () {
                this.model = definitionList.models.Main;
                this.definitionListView = definitionList.views.Main;
            }
        });
        test('definitionList model tests', 8, function () {
            var model = new this.model(),
                model2 = new this.model({
                source: '/api/nodes.json',
                params: [{name: 'id', value: '514b43c3-8cc8-47a1-9a8c-255238cce888'}],
                keys: ['computer_name'],
                titles: ['Computer Name']
            });
            ok(_.isEmpty(model.get('source')), 'Default model source init to empty');
            ok(_.isEmpty(model.get('params')), 'Default model params init to empty');
            ok(_.isEmpty(model.get('keys')), 'Default model keys init to empty');
            ok(_.isEmpty(model.get('titles')), 'Default model titles init to empty');
            ok(model2.get('source') === '/api/nodes.json', 'Init model source to /api/nodes.json');
            ok(model2.get('params').length === 1, 'Init model params by passing 1 parameter');
            ok(model2.get('keys').length === 1 && model2.get('keys')[0] === 'computer_name', 'Init model keys to computer_name');
            ok(model2.get('titles').length === 1 && model2.get('titles')[0] === 'Computer Name', 'Init model titles to Computer Name');
        });
        test('definitionList view tests', 0, function () {
            var model = new this.model({
                    source: '/api/nodes.json',
                    params: [{name: 'id', value: '6b4405cc-0dbb-4e71-9715-94d8f32c6f57'}],
                    keys: ['computer_name', {name: 'hardware', value: [{name: 'nic', value: ['name', 'ip_address']}, {name: 'storage', value: ['name', 'file_system']}]}, {name: 'tags', value: ['tag_id', 'tag_name']}],
                    titles: ['Computer Name', {name: 'Hardware', value: [{name: 'Network Interfaces', value: ['Name', 'IP Address']}, {name: 'Storage', value: ['Name', 'File System']}]}, {name: 'Tags', value: ['ID', 'Name']}]
                }),
                definitionListView = new this.definitionListView({
                    model: model
                });
            definitionListView.render();
            console.log(definitionListView);
            //console.log(definitionListView.$el[0]);
            $('#test').append(definitionListView.$el);
        });
    }
);
