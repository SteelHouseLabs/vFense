/**
 * Created with PyCharm.
 * User: parallels
 * Date: 1/26/13
 * Time: 11:01 PM
 * To change this template use File | Settings | File Templates.
 */
define(
    ['jquery', 'underscore', 'backbone', 'text!templates/modals/admin/schedule.html', 'jquery.ui.datepicker', 'jquery.ui.slider'],
    function ($, _, Backbone, myTemplate) {
        "use strict";
        var exports = {
            Collection: Backbone.Collection.extend({
                baseUrl: '',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            NodeCollection: Backbone.Collection.extend({
                baseUrl: 'api/nodes.json',
                filter: '',
                url: function () {
                    return this.baseUrl + this.filter;
                }
            }),
            TagCollection: Backbone.Collection.extend({
                baseUrl: 'api/tagging/listByTag.json',
                url: function () {
                    return this.baseUrl;
                }
            }),
            View: Backbone.View.extend({
                initialize: function () {
                    this.template = myTemplate;
                    this.minutes = '0';
                    this.hours = '0';
                    //this.collection = new exports.Collection();
                    //this.listenTo(this.collection, 'sync', this.render);
                    //this.collection.fetch();

                    this.nodecollection = new exports.NodeCollection();
                    this.listenTo(this.nodecollection, 'sync', this.render);
                    this.nodecollection.fetch();

                    this.tagcollection = new exports.TagCollection();
                    this.listenTo(this.tagcollection, 'sync', this.render);
                    this.tagcollection.fetch();
                },
                events: {
                    'change select[name=operation]':    'hideSeverity',
                    'submit form':                      'submit'
                },
                hideSeverity: function (event) {
                    var option = $(event.currentTarget).val(),
                        $severity = this.$el.find('select[name=severity]').parents('.control-group');
                    if (option === 'reboot') {
                        $severity.hide();
                    } else {
                        $severity.show();
                    }
                },
                submit: function (event) {
                    var $form = $(event.target),
                        that = this,
                        url = 'api/scheduler/recurrent/add',
                        $alert = this.$el.find('.alert'),
                        $inputs = $form.find('input, select:not(:hidden)'),
                        invalid = false,
                        params = {
                            minutes: this.minutes,
                            hours: this.hours
                        };
                    $inputs.each(function () {
                        if (this.name !== 'start_date') {
                            if (this.value === '-1' || !this.value) {
                                $(this).parents('.control-group').addClass('error');
                                invalid = true;
                            } else {
                                $(this).parents('.control-group').removeClass('error');
                                if (this.value !== 'any') {
                                    params[this.name] = this.value;
                                }
                            }
                        }
                    });
                    window.console.log(params);
                    if (invalid) {
                        $alert.removeClass('alert-success alert-info').addClass('alert-error').html('Please fill the required fields.').show();
                        return false;
                    }
                    $alert.removeClass('alert-success alert-error').addClass('alert-info').html('Submitting...');
                    $.post(url, params, function (json) {
                        window.console.log(json);
                        if (!json.pass) {
                            $alert.removeClass('alert-success alert-info').addClass('alert-error').html(json.message);
                        } else {
                            $alert.removeClass('alert-error alert-info').addClass('alert-success').html(json.message);
                        }
                        $alert.show();
                    });
                    return false;
                },
                beforeRender: $.noop,
                onRender: function () {
                    var $el = this.$el,
                        that = this,
                        $slide = $el.find('#slider-range'),
                        $dateInput = $el.find('input[name=start_date]');
                    $el.find('label').show();
                    $slide.slider({
                        min: 0,
                        max: 1439,
                        slide: function (event, ui) {
                            var hours, minutes, startTime;
                            minutes = ui.value % 60;
                            that.minutes = minutes;
                            minutes = minutes < 10 ? '0' + minutes : minutes;
                            hours = Math.floor(ui.value / 60);
                            that.hours = hours;
                            hours = hours < 10 ? '0' + hours : hours;
                            startTime = hours > 12 ? String(hours - 12) : String(hours);
                            startTime = hours >= 12 ? startTime + ':' + minutes + ' PM' : startTime + ':' + minutes + ' AM';
                            $(event.target).siblings('label').html('Time: ' + startTime);
                        }
                    });
                    $dateInput.datepicker();
                },
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var template = _.template(this.template),
                        tags = this.tagcollection.toJSON(),
                        nodes = this.nodecollection.toJSON(),
                        data = {
                            tags: tags,
                            nodes: nodes[0]
                        };
                    this.$el.empty();

                    this.$el.html(template({data: data}));

                    if (this.onRender !== $.noop) { this.onRender(); }
                    return this;
                }
            })
        };
        return exports;
    }
);
