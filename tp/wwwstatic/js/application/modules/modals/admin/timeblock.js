define(
    ['jquery', 'underscore', 'backbone', 'text!templates/modals/admin/timeblock.html', 'jquery.ui.datepicker', 'jquery.ui.slider'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: 'api/timeblocker/list.json/',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.collection = new exports.Collection();
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();
                    this.start = '8:00 AM';
                    this.end = '5:00 PM';
                    this.days = '0000000';
                },
                events: {
                    'click #dow' : 'highlight',
                    'click input[name=timeblock]': 'disableTb',
                    'click #add' :   'add'
                },
                disableTb: function (event) {
                    var $checkbox = $(event.currentTarget), params;
                    window.console.log($checkbox.is(':checked'));
                    params = {
                        tbid: $checkbox.val(),
                        toggle: $checkbox.is(':checked')
                    };
                    $.post('/api/timeblocker/toggle', params, function (json) {
                        window.console.log(json);
                    });
                },
                add: function (evt) {
                    var start_time, end_time, start_date, end_date, params, label, days, offset,
                        values = $("#dow").data('popover').options.content.val() || false,
                        that = this;
                    this.highlight(evt);
                    start_time = this.start;
                    end_time = this.end;
                    start_date = $('input[name=startdate]').val();
                    end_date = $('input[name=enddate]').val() || '';
                    label = $('input[name=label]').val();
                    days = this.days;
                    offset = $('#offset').val();

                    params = {
                        label: label,
                        enabled: true,
                        start_date: start_date,
                        end_date: end_date,
                        start_time: start_time,
                        end_time: end_time,
                        days: days,
                        offset: offset
                    };
                    if (values) {
                        window.console.log(params);
                        $.post("/api/timeblocker/add", { operation: JSON.stringify(params) },
                            function (result) {
                                window.console.log(result);
                                if (result.pass) {
                                    if ($('#dow').data('popover')) { $('#dow').popover('hide'); }
                                    that.$el.find('.alert').html(result.message).removeClass('alert-error').addClass('alert-success').show();
                                } else {
                                    that.$el.find('.alert').html(result.message).removeClass('alert-success').addClass('alert-error').show();
                                }
                            });
                    } else {
                        that.$el.find('.alert').html('You must select at least one day of the week.').removeClass('alert-success').addClass('alert-error').show();
                    }
                },
                highlight: function (evt) {
                    if ($(evt.target).data('popover')) {
                        $(evt.target).data('popover').tip().css('z-index', 3000);
                    }
                    var values = $("#dowselect").val(), string = '', days = '', i;
                    $('#dowselect').unbind().on('change', this.changeselect);
                    if (values) {
                        for (i = 0; i < values.length; i += 1) {
                            if (values[i] === 'Su') {
                                string += '<strong>Su</strong> ';
                                days += '1';
                                i += 1;
                            } else {
                                string += 'Su ';
                                days += '0';
                            }
                            if (values[i] === 'M') {
                                string += '<strong>M</strong> ';
                                days += '1';
                                i += 1;
                            } else {
                                string += 'M ';
                                days += '0';
                            }
                            if (values[i] === 'Tu') {
                                string += '<strong>Tu</strong> ';
                                days += '1';
                                i += 1;
                            } else {
                                string += 'Tu ';
                                days += '0';
                            }
                            if (values[i] === 'W') {
                                string += '<strong>W</strong> ';
                                days += '1';
                                i += 1;
                            } else {
                                string += 'W ';
                                days += '0';
                            }
                            if (values[i] === 'Th') {
                                string += '<strong>Th</strong> ';
                                days += '1';
                                i += 1;
                            } else {
                                string += 'Th ';
                                days += '0';
                            }
                            if (values[i] === 'F') {
                                string += '<strong>F</strong> ';
                                days += '1';
                                i += 1;
                            } else {
                                string += 'F ';
                                days += '0';
                            }
                            if (values[i] === 'Sa') {
                                string += '<strong>Sa</strong>';
                                days += '1';
                                i += 1;
                            } else {
                                string += 'Sa ';
                                days += '0';
                            }
                        }
                        this.days = days;
                        $("#dow").html(string);
                    }
                },
                beforeRender: $.noop,
                onRender: function () {
                    var that = this,
                        $el = this.$el,

                        // jquery element cache
                        $pop = $el.find('#dow'),
                        $popper = $el.find('#dowselect'),
                        $slide = $el.find("#slider-range"),
                        $startDate = $el.find('input[name="startdate"]'),
                        $endDate = $el.find('input[name="enddate"]');

                    $pop.popover({
                        placement: 'right',
                        title: 'Days of Week',
                        html: true,
                        content: $popper,
                        trigger: 'click'
                    });

                    $slide.slider({
                        range: true,
                        min: 0,
                        max: 1439,
                        values: [ 480, 1020 ],
                        slide: function (event, ui) {
                            var startHours, endHours, startMinutes, endMinutes, startTime, endTime;
                            startMinutes = ui.values[0] % 60;
                            startMinutes = startMinutes < 10 ? '0' + startMinutes : startMinutes;
                            endMinutes = ui.values[1] % 60;
                            endMinutes = endMinutes < 10 ? '0' + endMinutes : endMinutes;
                            startHours = Math.floor(ui.values[0] / 60);
                            endHours = Math.floor(ui.values[1] / 60);
                            startTime = startHours > 12 ? String(startHours - 12) : String(startHours);
                            startTime = startHours >= 12 ? startTime + ':' + startMinutes + ' PM' : startTime + ':' + startMinutes + ' AM';
                            endTime = endHours > 12 ? String(endHours - 12) : String(endHours);
                            endTime = endHours >= 12 ? endTime + ':' + endMinutes + ' PM' : endTime + ':' + endMinutes + ' AM';
                            $(event.target).siblings('label').html('Time Range: ' + startTime + ' to ' + endTime);
                            that.start = startTime;
                            that.end = endTime;
                        }
                    });

                    $startDate.datepicker({
                        onSelect: this.selectMultiple,
                        option: { view: this }
                    });
                    $endDate.datepicker();
                },
                selectMultiple: function (dateText, object) {
                    //window.console.log(object); //object
                    //window.console.log(this);  //html input
                    var date = new Date(dateText),
                        day = date.getDay();
                    $("#dowselect option").each(function (i, option) {
                        option.selected = false;
                        if (i === day) {
                            option.selected = true;
                        }
                    });
                    object.target = this;
                    object.settings.option.view.highlight(object);
                },
                changeselect: function (event) {
                    var $select = $(event.currentTarget),
                        date = new Date($('input[name="startdate"]').val()),
                        day = date.getDay();
                    $select.find('option').each(function (i, option) {
                        if (i === day) {
                            option.selected = true;
                        }
                    });
                },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        data = this.collection.toJSON();

                    this.$el.empty();

                    this.$el.html(template({data: data}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                },

                beforeClose: function () {
                    var $popover = this.$el.find('#dow');
                    if ($popover.data('popover')) {
                        $popover.popover('destroy');
                    }
                }
            })
        };
        return exports;
    }
);
