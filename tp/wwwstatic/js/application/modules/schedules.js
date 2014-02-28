define(
    ['jquery', 'underscore', 'backbone', 'app', 'text!templates/schedules.html', 'text!templates/createSchedule.html', 'modals/panel', 'crel', 'jquery.ui.datepicker', 'jquery.ui.slider', 'jquery.ui.timepicker', 'select2'],
    function ($, _, Backbone, app, myTemplate, createSchedule, Panel, crel) {
        'use strict';
        var helpers = {},
            exports = {};
        _.extend(helpers, {
            getNextScheduledValue: function (range, value) {
                var array = _.filter(range, function (day) { return day > value; });
                if (array.length) {
                    return array[0];
                } else {
                    return range[0];
                }
            },
            nextWeekDay: function (weekday, date) {
                var now = new Date(date);
                now.setDate(now.getDate() + (weekday + (7 - now.getDay())) % 7);
                return now;
            },
            nextMonthDay: function (monthday, date) {
                var now = new Date(date);
                if (monthday > now.getDate()) {
                    now.setDate(monthday);
                } else {
                    now.setMonth(now.getMonth() + 1, monthday);
                }
                return now;
            },
            nextMonth: function (month, date) {
                var now = new Date(date);
                if (month > now.getMonth()) {
                    now.setMonth(month);
                } else {
                    now.setFullYear(now.getFullYear() + 1, month);
                }
                return now;
            },
            getScheduleUrl: function (type, custom) {
                var url = 'api/v1/schedules/recurrent/';
                if (type === 'custom') {
                    url += custom;
                } else {
                    url += type;
                }
                return url;
            }
        });
        _.extend(exports, {
            Collection: Backbone.Collection.extend({
                baseUrl: 'api/v1/schedules',
                url: function () {
                    return this.baseUrl;
                },
                parse: function (response) {
                    return response.data;
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    var that = this;
                    $.ajaxSetup({ traditional: true });
                    this.template = myTemplate;
                    this.createScheduleTemplate = createSchedule;
                    this.minutes = '0';
                    this.hours = '0';
                    this.collection =  new exports.Collection();
                    this.listenTo(this.collection, 'sync', this.render);
                    this.collection.fetch();

                    this.panel = Panel.View.extend({
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Save',
                                action: 'confirm',
                                className: 'btn-primary',
                                position: 'right'
                            }
                        ],
                        span: '10',
                        confirm: that.addSchedule,
                        parentView: that,
                        updateCalendar: function () {
                            var $calendar = this.$('div[name=start_date_div]'),
                                repeat = this.$('#repeat').val(),
                                frequency = this.$('#frequency').val(),
                                date = $calendar.datepicker('getDate'),
                                newDate = date, range = [];
                            if (repeat === 'custom' && frequency !== 'daily') {
                                switch (frequency) {
                                case 'weekly':
                                    $('#weekDays .active').each(function () {
                                        range.push(parseInt(this.value, 10));
                                    });
                                    if (range.length && _.indexOf(range, date.getDay()) === -1) {
                                        range = helpers.getNextScheduledValue(range, date.getDay());
                                        newDate = helpers.nextWeekDay(range, date);
                                    } else {
                                        newDate = date;
                                    }
                                    break;
                                case 'monthly':
                                    $('#monthDays .active').each(function () {
                                        range.push(parseInt(this.innerHTML, 10));
                                    });
                                    if (range.length && _.indexOf(range, date.getDate()) === -1) {
                                        range = helpers.getNextScheduledValue(range, date.getDay());
                                        newDate = helpers.nextMonthDay(range, date);
                                    } else {
                                        newDate = date;
                                    }
                                    break;
                                case 'yearly':
                                    $('#yearMonths .active').each(function () {
                                        range.push(parseInt(this.value, 10));
                                    });
                                    if (range.length && _.indexOf(range, date.getMonth()) === -1) {
                                        range = helpers.getNextScheduledValue(range, date.getMonth());
                                        newDate = helpers.nextMonth(range, date);
                                    } else {
                                        newDate = date;
                                    }
                                    break;
                                }
                                $calendar.datepicker('setDate', new Date(newDate));
                            }
                            return newDate.getTime() / 1000;
                        },
                        changeScheduleTarget: function (event) {
                            var $modal = event.data,
                                $agentSelect = $modal.$('input[name=nodes]'),
                                $tagSelect = $modal.$('input[name=tags]');
                            $agentSelect.toggleClass('disabled').parent().toggle();
                            $tagSelect.toggleClass('disabled').parent().toggle();
                        },
                        hideSeverity: function (event) {
                            var option = $(event.currentTarget).val(),
                                $select = $(this).parents('table').find('select[name=severity], select[name=pkg_type]');
                            if (option === 'reboot' || option === 'false') {
                                $select.attr('disabled', true).addClass('disabled');
                            } else {
                                $select.attr('disabled', false).removeClass('disabled');
                            }
                        },
                        showCustom: function (event) {
                            var $modal = event.data;
                            if (this.value === 'custom') {
                                $modal.$('#customSchedule').show();
                            } else {
                                $modal.$('#customSchedule').hide();
                            }
                        },
                        changeFrequency: function (event) {
                            var $modal = event.data,
                                option = this.value;
                            $modal.$('tr[data-id=' + option+ ']').show().siblings(':not(tr[data-id=frequencyRow], tr[data-id=' + option + '])').hide();
                        }
                    });
                },
                events: {
                    'click button[name=remove]': 'removeSchedule',
                    'click button[name=toggleAddSchedule]': 'openPanel',
                    'click button[name=toggleDelete]':  'confirmDelete'
                },
                initModal: function () {
                    var $modal = this.modal,
                        $tagSelect = $modal.$('input[name=tags]'),
                        $nodeSelect = $modal.$('input[name=nodes]'),
                        $dateDiv = $modal.$('div[name=start_date_div]'),
                        $scheduleRadio = $modal.$('input[name=schedule_on]'),
                        $operationSelect = $modal.$('select[name=operation]'),
                        $repeatSelect = $modal.$('#repeat'),
                        $frequencySelect = $modal.$('#frequency'),
                        $btnGroup = $modal.$('.btn-group .btn'),
                        date = new Date();
                    date.setHours(0);
                    date.setMinutes(0);
                    $scheduleRadio.unbind().on('change', $modal, $modal.changeScheduleTarget);
                    $operationSelect.unbind().on('change', $modal.hideSeverity);
                    $repeatSelect.unbind().on('change', $modal, $modal.showCustom);
                    $frequencySelect.unbind().on('change', $modal, $modal.changeFrequency);
                    $btnGroup.unbind().on('click', function (event) { event.preventDefault(); });
                    $dateDiv.datetimepicker({
                        showButtonPanel: false,
                        minDate: date
                    }).datepicker('setDate', new Date());
                    $tagSelect.select2({
                        ajax: {
                            url: 'api/v1/tags',
                            data: function (text) {
                                return {query: text};
                            },
                            results: function (data) {
                                var results = [{id: 'all', text: 'All'}];
                                if (data.http_status === 200) {
                                    _.each(data.data, function (object) {
                                        results.push({id: object.tag_id, text: object.tag_name});
                                    });
                                    return {results: results, more: false, context: results};
                                }
                            }
                        },
                        multiple: true,
                        width: '100%'
                    });
                    $tagSelect.on('select2-selecting', this.modal.$('.help-online'), this.preventWrongChoice);
                    $nodeSelect.select2({
                        ajax: {
                            url: 'api/v1/agents',
                            data: function (text) {
                                return {query: text};
                            },
                            results: function (data) {
                                var results = [{id: 'all', text: 'All'}];
                                if (data.http_status === 200) {
                                    _.each(data.data, function (object) {
                                        results.push({id: object.agent_id, text: object.display_name || object.computer_name});
                                    });
                                    return {results: results, more: false, context: results};
                                }
                            }
                        },
                        multiple: true,
                        width: '100%'
                    });
                    $nodeSelect.on('select2-selecting', this.modal.$('.help-online'), this.preventWrongChoice);
                },
                openPanel: function () {
                    if (this.modal) {
                        this.modal.close();
                        this.modal = undefined;
                    }
                    this.modal = new this.panel().open();
                    this.modal.setHeaderHTML(this.addScheduleHeaderLayout());
                    this.modal.setContentHTML(_.template(this.createScheduleTemplate)());
                    this.initModal();
                },
                addScheduleHeaderLayout: function () {
                    return crel('h4', 'Create New Schedule');
                },
                addScheduleLayout: function () {
                    var daySelect, weekSelect, index, form, tagSelect, nodeSelect,
                        tags = this.tagcollection.toJSON()[0],
                        nodes = this.nodecollection.toJSON()[0];
                    daySelect = crel('select', {name: 'day', 'data-type': 'select', style: 'width: 100%'},
                        crel('option', {value: 'false'},'Select one'),
                        crel('option', {value: 'any'}, 'Any'));
                    weekSelect = crel('select', {name: 'week', 'data-type': 'select', style: 'width: 100%'},
                        crel('option', {value: 'false'},'Select one'),
                        crel('option', {value: 'any'}, 'Any'));
                    tagSelect = crel('select', {name: 'tags', multiple: 'multiple', 'data-type': 'multiple', style: 'width:50%; max-width:50%;'},
                        crel('option', {value: 'any'}, 'None'),
                        crel('option', {value: 'all'}, 'All'));
                    nodeSelect = crel('select', {name: 'nodes', multiple: 'multiple', 'data-type': 'multiple'},
                        crel('option', {value: 'any'}, 'None'),
                        crel('option', {value: 'all'}, 'All'));
                    if (tags && nodes && tags.data && nodes.data) {
                        _.each(tags.data, function (tag) {
                            $(tagSelect).append(crel('option', {value: tag.id}, tag.name));
                        });
                        _.each(nodes.data, function (node) {
                            $(nodeSelect).append(crel('option', {value: node.id}, node.display_name || node.computer_name || node.host_name || node.ip));
                        });
                    }
                    for (index = 1; index <= 31; index += 1) {
                        $(daySelect).append(crel('option', {value: index}, index));
                    }
                    for (index = 1; index <= 53; index += 1) {
                        $(weekSelect).append(crel('option', {value: index}, index));
                    }
                    form = crel('form', {class: 'row-fluid'},
                        crel('div', {class: 'span4'},
                            crel('div', {name: 'start_date_div'})
                        ),
                        crel('div', {class: 'span8'},
                            crel('table', {'style':'width:100%;'},
                                crel('tr',
                                    crel('td', {class: 'control-group', colspan: '2'},
                                        crel('input', {'type': 'text', 'name': 'jobname', 'placeholder': 'Schedule Name', 'data-type': 'input', 'class': 'border-box', 'style': 'width:100%;height:30px;'})
                                    )
                                ),
                                crel('tr',
                                    crel('td', {class: 'control-group'},
                                        crel('select', {name: 'operation', 'data-type': 'select', 'style': 'width:100%;'},
                                            crel('option', {value: 'false'}, 'Operation Type'),
                                            crel('option', {value: 'install'}, 'Install'),
                                            crel('option', {value: 'reboot'}, 'Reboot')
                                        )
                                    ),
                                    crel('td', {class: 'control-group'},
                                        crel('select', {name: 'severity', class: 'disabled', disabled: 'disabled', 'data-type': 'select', 'style': 'width:100%;'},
                                            crel('option', {value: 'false'}, 'Severity'),
                                            crel('option', {value: 'any'}, 'Any'),
                                            crel('option', {value: 'optional'}, 'Optional'),
                                            crel('option', {value: 'recommended'}, 'Recommended'),
                                            crel('option', {value: 'critical'}, 'Critical')
                                        )
                                    )
                                ),
                                crel('tr',
                                    crel('td', {class: 'control-group'},
                                        crel('label', {class: 'control-label'}, 'Day of Week:'),
                                        crel('select', {name: 'day_of_week', 'data-type': 'select', 'style': 'width:100%;'},
                                            crel('option', {value: 'false'}, 'Select one'),
                                            crel('option', {value: 'any'}, 'Any'),
                                            crel('option', {value: '0'}, 'Monday'),
                                            crel('option', {value: '1'}, 'Tuesday'),
                                            crel('option', {value: '2'}, 'Wednesday'),
                                            crel('option', {value: '3'}, 'Thursday'),
                                            crel('option', {value: '4'}, 'Friday'),
                                            crel('option', {value: '5'}, 'Saturday'),
                                            crel('option', {value: '6'}, 'Sunday')
                                        )
                                    ),
                                    crel('td', {class: 'control-group'},
                                        crel('label', {class: 'control-label'}, 'Month:'),
                                        crel('select', {name: 'month', 'data-type': 'select', 'style': 'width:100%;'},
                                            crel('option', {value: 'false'}, 'Select one'),
                                            crel('option', {value: 'any'}, 'Any'),
                                            crel('option', {value: '1'}, 'January'),
                                            crel('option', {value: '2'}, 'February'),
                                            crel('option', {value: '3'}, 'March'),
                                            crel('option', {value: '4'}, 'April'),
                                            crel('option', {value: '5'}, 'May'),
                                            crel('option', {value: '6'}, 'June'),
                                            crel('option', {value: '7'}, 'July'),
                                            crel('option', {value: '8'}, 'August'),
                                            crel('option', {value: '9'}, 'September'),
                                            crel('option', {value: '10'}, 'October'),
                                            crel('option', {value: '11'}, 'November'),
                                            crel('option', {value: '12'}, 'December')
                                        )
                                    )
                                ),
                                crel('tr',
                                    crel('td', {class: 'control-group'}, crel('label', {class: 'control-label'}, 'Day:'), daySelect),
                                    crel('td', {class: 'control-group'}, crel('label', {class: 'control-label'}, 'Week:'), weekSelect)
                                ),
                                crel('tr',
                                    crel('td', {class: 'control-group', style: 'width:50%; max-width:50%;'}, crel('label', {class: 'control-label'}, 'Tags:'), tagSelect),
                                    crel('td', {class: 'control-group', style: 'width:50%; max-width:50%;'}, crel('label', {class: 'control-label'}, 'Nodes:'), nodeSelect)
                                ),
                                crel('tr',
                                    crel('td', {colspan: '2'},
                                        crel('span', {class: 'help-online'})
                                    )
                                )
                            )
                        )
                    );
                    return form;
                },
                preventWrongChoice: function (event) {
                    var $select = $(this),
                        data = $select.select2('data'),
                        $message = event.data;
                    if (data.length) {
                        if (event.val === 'all') {
                            app.notifyOSD.createNotification('!', 'Invalid', 'Unable to select current choice');
                            $message.removeClass('alert-success alert-info').addClass('alert-error').html('Can\'t select this option.').show();
                            event.preventDefault();
                        } else if (!_.isUndefined(_.findWhere(data, {id: 'all'}))) {
                            app.notifyOSD.createNotification('!', 'Invalid', 'Unable to select current choice');
                            $message.removeClass('alert-success alert-info').addClass('alert-error').html('Can\'t select this option.').show();
                            event.preventDefault();
                        }
                    }
                    $message.removeClass('alert-success alert-info alert-error').html('').hide();
                },
                addSchedule: function () {
                    var $form = this.$('form'),
                        that = this,
                        scheduleType = this.$('#repeat').val(),
                        custom = this.$('#frequency').val(),
                        url = helpers.getScheduleUrl(scheduleType, custom),
                        $message = this.$el.find('.help-online'),
                        $inputs = $form.find('[data-type=input], :not(:disabled)[data-type=select]'),
                        $multiple = $form.find(':not(.disabled)[data-type=multiple]'),
                        startDate =  this.updateCalendar(),
                        invalid = false,
                        params = {
                            epoch_time: startDate
                        };
                    if (scheduleType === 'custom') {
                        params.every = $('[data-id=' + custom + ']').find('[data-id=every]').val();
                        if (custom !== 'daily') {
                            params.custom = [];
                            $('[data-id=' + custom + ']').find('.active').each(function () {
                                params.custom.push(this.value || this.innerText);
                            });
                        }
                    }
                    $inputs.each(function () {
                        if (this.value === 'false' || !this.value) {
                            $(this).parents('.control-group').addClass('error');
                            invalid = true;
                        } else {
                            $(this).parents('.control-group').removeClass('error');
                            params[this.name] = this.value;
                        }
                    });
                    $multiple.each(function () {
                        var options = $(this).select2('data');
                        if (options && options.length) {
                            $(this).parents('.control-group').removeClass('error');
                            if (options[0].id === 'all') {
                                params[$(this).data('key')] = true;
                            } else {
                                params[this.name] = _.pluck(options, 'id');
                            }
                        } else {
                            $(this).parents('.control-group').addClass('error');
                            invalid = true;
                        }
                    });
                    if (invalid) {
                        $message.removeClass('alert-success alert-info').addClass('alert-error').html('Please fill the required fields.').show();
                        return false;
                    }
                    $message.removeClass('alert-success alert-error').addClass('alert-info').html('Submitting...');
                    $.ajax({
                        url: url,
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify(params),
                        success: function (response) {
                            if (response.http_status === 200) {
                                $message.removeClass('alert-error alert-info').addClass('alert-success').html(response.message);
                                that.cancel();
                                that.parentView.collection.fetch();
                                $message.show();
                            }
                        },
                        error: function (response) {
                            $message.removeClass('alert-success alert-info').addClass('alert-error').html(response.responseJSON.message);
                            $message.show();
                        }
                    });
                    return false;
                },
                confirmDelete: function (event) {
                    var $cell = $(event.currentTarget).parent(),
                        group = $cell.data('group'),
                        $header = this.$('TH[data-group='+ group +']');
                    $cell.toggleClass('confirm').children().toggle();
                    if (this.$('TD.confirm[data-group='+ group +']').length > 0) {
                        $header.width($header.data('confirm-width'));
                    } else {
                        $header.css('width', '');
                    }
                },
                removeSchedule: function (event) {
                    var that = this,
                        $removeButton = $(event.currentTarget),
                        jobname = $removeButton.val(),
                        $alert = this.$el.find('.alert').first();
                    $.ajax({
                        url: 'api/v1/schedule/' + jobname,
                        type: 'DELETE',
                        contentType: 'application/json',
                        success: function (response) {
                            if (response.http_status === 200) {
                                that.collection.fetch();
                            } else {
                                $alert.removeClass('alert-success').addClass('alert-error').html(response.message).show();
                            }
                        }
                    });
                },
                beforeRender: $.noop,
                onRender: $.noop,
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        schedules = this.collection.toJSON(),
                        data;
                    data = {
                        schedules: schedules,
                        viewHelpers: {
                            renderItems: function (items) {
                                var body = crel('tbody');
                                if (items.length) {
                                    _.each(items, function (item) {
                                        body.appendChild(
                                            crel('tr',
                                                crel('td',
                                                    crel('a', {href: '#schedules/' + item.job_name}, item.job_name)
                                                ),
                                                crel('td', {class: 'alignCenter'}, item.operation || 'N/A'),
                                                crel('td', {class: 'alignCenter'}, item.schedule_type || 'N/A'),
                                                crel('td', {class: 'alignCenter'}, item.runs || 'N/A'),
                                                crel('td', {class: 'alignRight'}, item.next_run_time || 'N/A'),
                                                crel('td', {class: 'alignRight', 'data-group':'delete'},
                                                    crel('button', {class: 'btn btn-link noPadding', name: 'toggleDelete'},
                                                        crel('i', {class: 'icon-remove', style: 'color: red'})
                                                    ),
                                                    crel('button', {class: 'btn btn-mini btn-danger hide', name: 'remove', value: item.job_name}, 'Delete'), ' ',
                                                    crel('button', {class: 'btn btn-mini hide', name: 'toggleDelete'}, 'Cancel')
                                                )
                                            )
                                        );
                                    });
                                } else {
                                    body.appendChild(
                                        crel('tr', {class: 'item'}, crel('td', {colspan: '6'}, crel('em', 'No scheduled patches.')))
                                    );
                                }
                                return body.innerHTML;
                            }
                        }
                    };
                    this.$el.empty();
                    this.$el.append(template({data: data}));
                    if (this.onRender !== $.noop) { this.onRender(); }

                    return this;
                }
            })
        });
        return exports;
    }
);