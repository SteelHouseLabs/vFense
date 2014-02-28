define(['jquery', 'underscore', 'backbone', 'reports/report', 'reports/row'], function ($, _, Backbone, report, row) {
    'use strict';

    module('Rows', {
        setup: function () {
            var model;
            this.report = {};
            this.report.model = report.Model;
            this.report.row = row.Model;
            model = new this.report.model();
            this.report.collection = model.get('rows');
        }
    });
    test('Report Model Tests', 1, function () {
        var model = new this.report.model();
        ok(!model.get('rows').length, 'Default model contains 0 rows');
    });
    test('Report Collection tests', 6, function () {
        var row, row2, rows, rowCollection;
        row = new this.report.row();
        row2 = new this.report.row({
            rowHeight: 4
        });
        rowCollection = new this.report.collection();
        ok(rowCollection instanceof Backbone.Collection, 'Default row collection is a Backbone Collection');
        ok(_.isEmpty(rowCollection.toJSON()) && !rowCollection.length, 'Column row initialized as empty');

        rowCollection = new this.report.collection([row, row2]);
        ok(rowCollection instanceof Backbone.Collection, 'Initialized collection with column argument is a Backbone Collection');
        ok(!_.isEmpty(rowCollection.toJSON()) && rowCollection.length === 2, 'Initialized column collection with two columns');
        rows = rowCollection.toJSON();
        ok(rows[0].rowHeight === 3, 'report collection is loaded with first row set to default height');
        ok(rows[1].rowHeight === 4, 'report collection is loaded with second row set to 4 height');
    });
    test('Report View tests', 12, function () {
        var reportView, reportView2, row, row2, rowCollection;
        reportView = new report.View({
            model: new this.report.model()
        });
        $('#test').append(reportView.$el);
        ok(!reportView.editable, 'Default report initialized with editable false');
        ok(reportView.className === 'report', 'Default report initialized with class report');
        ok(reportView.tagName === 'div', 'Report element initialized as a div');
        ok(reportView.rows.length === 1, 'Default report initialized with one row');
        ok(reportView.$el.find('.row-fluid').length === 1, 'Default report contains one rendered row');

        row = new this.report.row();
        row2 = new this.report.row({
            rowHeight: 4
        });
        rowCollection = new this.report.collection([row, row2]);
        reportView2 = new report.View({
            model: new this.report.model(),
            rows: rowCollection,
            editable: true
        });
        $('#test2').append(reportView2.$el);
        ok(reportView2.editable, 'Report initialized with editable true');
        ok(reportView2.className === 'report', 'Report initialized with class report');
        ok(reportView2.tagName === 'div', 'Report element initialized as a div');
        ok(reportView2.rows.length === 2, 'Report initialized with two rows');
        ok(reportView2.$el.find('.row-fluid').length === 2, 'Report contains two rendered rows');
        ok(reportView2.$el.find('.rowheight3').length === 1, 'Report contains one row with height 3');
        ok(reportView2.$el.find('.rowheight4').length === 1, 'Report contains one row with height 4');
    });
});