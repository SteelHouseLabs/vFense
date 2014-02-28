define(['jquery', 'underscore', 'backbone', 'reports/row', 'reports/column'], function ($, _, Backbone, row, column) {
    'use strict';

    module('Rows', {
        setup: function () {
            var model;
            this.row = {};
            this.row.model = row.Model;
            this.row.column = column.Model;
            model = new this.row.model();
            this.row.collection = model.get('columns');
        }
    });

    test('Row Model tests', 3, function () {
        var model = new this.row.model();
        ok(model.get('rowHeight') === 3, 'Default row model rowHeight is set to rowheight3');
        ok(model.get('columnCount') === 1, 'Default row model columnCount is set to 1');

        model = new this.row.model({rowHeight: 4});
        ok(model.get('rowHeight') === 4, 'Initialize new row model with rowHeight set to rowheight4');
    });
    test('Row Collection tests', 6, function () {
        var column, column2, columns, columnsCollection;
        column = new this.row.column(),
        column2 = new this.row.column({
            moduleName: 'richText'
        });

        columnsCollection = new this.row.collection();
        ok(columnsCollection instanceof Backbone.Collection, 'Default column collection is a Backbone Collection');
        ok(_.isEmpty(columnsCollection.toJSON()) && !columnsCollection.length, 'Column collection initialized as empty');

        columnsCollection = new this.row.collection([column, column2]);
        ok(columnsCollection instanceof Backbone.Collection, 'Initialized collection with column argument is a Backbone Collection');
        ok(!_.isEmpty(columnsCollection.toJSON()) && columnsCollection.length === 2, 'Initialized column collection with two columns');
        columns = columnsCollection.toJSON();
        ok(columns[0].moduleName === 'plainText', 'plainText module is loaded inside the first column');
        ok(columns[1].moduleName === 'richText', 'richText module is loaded inside the second column');
    });
    test('Row View tests', 11, function () {
        var rowView, rowView2, columnsCollection, column, column2;
        rowView = new row.View({
            model: new this.row.model()
        });
        $('#test').append(rowView.$el);
        ok(rowView.columns.length === 1, 'Default row view initialized with 1 column.');
        ok(rowView.rowHeight === 'rowheight3' && rowView.$el.hasClass('rowheight3'), 'Default View initialized with default height using class rowheight3');
        ok(rowView.tagName === 'div', 'Row element initialized as a div');
        ok(rowView.$el.find('.span6').length === 1, 'Default View creates one container for the column');

        column = new this.row.column();
        column2 = new this.row.column({
            moduleName: 'richText'
        });
        columnsCollection = new this.row.collection([column, column2]);
        rowView2 = new row.View({
            model: new this.row.model({
                rowHeight: 4
            }),
            columns: columnsCollection
        });
        $('#test2').append(rowView2.$el);
        ok(rowView2.columns.length === 2, 'Row View initialized with 2 columns');
        ok(rowView2.columns.models[0].get('moduleName') === 'plainText', 'First column init to plainText');
        ok(rowView2.columns.models[1].get('moduleName') === 'richText', 'Second column init to richText');
        ok(rowView2.rowHeight === 'rowheight4' && rowView2.$el.hasClass('rowheight4'), 'Row View initialized with class rowheight4');
        ok(rowView2.tagName === 'div', 'Row element initialized as a div');
        ok(rowView2.$el.hasClass('row-fluid'), 'Row element contains row-fluid class');
        ok(rowView2.$el.find('.span6').length === 2, 'Created row contains two containers for both columns');
    });
});