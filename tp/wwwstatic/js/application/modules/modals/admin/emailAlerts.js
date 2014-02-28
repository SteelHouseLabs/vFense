define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'select2','h5f', 'text!templates/emailAlertsMain.html', 'text!templates/emailAlerts.html', 'text!templates/emailAlertsRv.html', 'text!templates/emailAlertsMonitoring.html'],
    function ($, _, Backbone, app, crel, select2, h5f, mainTemplate, alertTemplate, rvAlertTemplate, monitoringAlertTemplate) {
        'use strict';
        var overriddenSync = function(method, model, options) {
            var type = exports.methodMap[method];

            // Default options, unless specified.
            _.defaults(options || (options = {}), {
                emulateHTTP: Backbone.emulateHTTP,
                emulateJSON: Backbone.emulateJSON
            });

            // Default JSON-request options.
            var params = {type: type, dataType: 'json'};
            // Ensure that we have a URL.
            if (!options.url) {
                params.url = _.result(model, 'url') || urlError();
            } else {
                params.url = options.url;
                delete options.url;
            }
            switch (method) {
            case 'read':
                params.url += '/list';
                break;
            case 'create':
                params.url += '/create';
                break;
            case 'update':
                params.url += '/modify';
                break;
            case 'delete':
                params.url += '/delete';
                break;
            }
            // Ensure that we have the appropriate request data.
            if (options.data === null && model && (method === 'create' || method === 'update' || method === 'patch')) {
                params.contentType = 'application/json';
                params.data = JSON.stringify(options.attrs || model.toJSON(options));
            }

            // For older servers, emulate JSON by encoding the request into an HTML-form.
            if (options.emulateJSON) {
                params.contentType = 'application/x-www-form-urlencoded';
                params.data = params.data ? {model: params.data} : {};
            }

            // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
            // And an `X-HTTP-Method-Override` header.
            if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
                params.type = 'POST';
                if (options.emulateJSON) {
                    params.data._method = type;
                }
                var beforeSend = options.beforeSend;
                options.beforeSend = function(xhr) {
                    xhr.setRequestHeader('X-HTTP-Method-Override', type);
                    if (beforeSend) {
                        return beforeSend.apply(this, arguments);
                    }
                };
            }

            // Don't process data on a non-GET request.
            if (params.type !== 'GET' && !options.emulateJSON) {
                params.processData = false;
            }

            // If we're sending a `PATCH` request, and we're in an old Internet Explorer
            // that still has ActiveX enabled by default, override jQuery to use that
            // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
            if (params.type === 'PATCH' && window.ActiveXObject &&
                !(window.external && window.external.msActiveXFilteringEnabled)) {
                params.xhr = function() {
                    return new ActiveXObject('Microsoft.XMLHTTP');
                };
            }

            // Make the request, allowing the user to override any Ajax options.
            var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
            model.trigger('request', model, xhr, options);
            return xhr;
        };
        var exports = {};
        exports.defaultOptions = {};
        exports.init = $.getJSON('/api/notifications/get_valid_fields', function (data) {
                exports.defaultOptions = data.data[0];
            });
        exports.Models = {
            Alert: Backbone.Model.extend({
                defaults: {
                    agents: [],
                    created_time: '',
                    customer_name: '',
                    group: null,
                    modified_time: '',
                    plugin_name: 'monitoring',
                    rule_description: '',
                    rule_name: '',
                    rv_operation_type: '',
                    rv_threshold: '',
                    tags: [],
                    user: '',
                    monitoring_threshold: '50',
                    monitoring_operation_type: 'filesystem',
                    file_system: ''
                },
                parse: function(response) {
                    if(response.data){
                        return response.data[0];
                    }
                    return response;
                },
                sync: function() {
                    return overriddenSync.apply(this, arguments);
                }
            })
        };
        exports.methodMap = {
            'create': 'POST',
            'update': 'POST',
            'delete': 'POST',
            'read':   'GET'
        };
        exports.Collections = {
            DefaultDataCollection: Backbone.Collection.extend({
                url:'/api/notifications/get_valid_fields',
                parse: function(response) {
                    return response.data;
                }
            }),
            AlertsCollection: Backbone.Collection.extend({
                model: exports.Models.Alert,
                url: '/api/notifications',
                parse: function(response) {
                    return response.data;
                },
                sync: function() {
                    return overriddenSync.apply(this, arguments);
                }
            })
        };
        exports.View = Backbone.View.extend({
            initialize: function () {
                //exports.init();
                this.collection = new exports.Collections.DefaultDataCollection();
                this.listenTo(this.collection, 'request', this.showLoading);
                this.listenTo(this.collection, 'sync', this.fetchSuccess);
                this.listenTo(this.collection, 'error', this.fetchError);
                this.listenTo(this.collection, 'add', this.addUpdateCollection);
                this.listenTo(this.collection, 'remove', this.removeUpdateCollection);
                return this;
            },
            showLoading: function () {
                //console.log("requesting default data");
                this.$el.html(crel('div', {'class': 'centerLine'}, 'Syncing Data...'));
                return this;
            },
            fetchSuccess: function (model, resp) {
                //console.log("syncing default data");
                this.$el.html(crel('div', {'class': 'centerLine'}, 'Loading Alerts...'));
                exports.defaultOptions = resp.data[0];
                this.renderMainView();
                return this;
            },
            fetchError: function () {
                this.$el.html(crel('div', {'class': 'centerLine'}, 'Error Fetching Data...'));
                return this;
            },
            render: function () {
                if(this.collection.url) {
                    this.collection.fetch();
                    return this;
                }
                this.fetchError() ;
                return this;
            },
            renderMainView: function () {
                if (_.isUndefined(this.mainView)) {
                    this.mainView = new exports.Views.Main({el: this.el});
                }
                this.mainView.collection.fetch();
                //this.listenTo(this.mainView,'appendMainView',this.appendMainView);
                return this;
            },
            beforeClose: function () {
                this.mainView.close();
            }
        });
        exports.Views = {
            Main:Backbone.View.extend({
                initialize: function () {
                    //exports.init();
                    this.template = mainTemplate;
                    this.collection = new exports.Collections.AlertsCollection();
                    this.listenTo(this.collection, 'request', this.showLoading);
                    this.listenTo(this.collection, 'sync', this.fetchSuccess);
                    this.listenTo(this.collection, 'error', this.fetchError);
                    this.listenTo(this.collection, 'add', this.addUpdateCollection);
                    this.listenTo(this.collection, 'remove', this.removeUpdateCollection);
                    return this;
                },
                showLoading: function () {
                    //console.log("requesting...");
                    //this.$el.html(crel('div', {'class': 'centerLine'}, 'Loading Alerts...'));
                    return this;
                },
                fetchSuccess: function (model,resp,options) {
                    if(typeof options.preventCollectionSync !== 'undefined' && options.preventCollectionSync) {
                        return this;
                    }
                    //console.log("syncing...");
                    this.$el.empty();
                    this.renderAlerts();
                    this.delegateEvents();
                    return this;
                },
                fetchError: function () {
                    this.$el.html(crel('div', {'class': 'centerLine'}, 'Error Fetching Data...'));
                    return this;
                },
                events: {
                    'click .addAlert': 'addAlertModel'
                },
                addUpdateCollection: function () {
                    //console.log("adding...");
                    return this;
                },
                removeUpdateCollection: function () {
                    //console.log("removing...");
                    return this;
                },
                addAlertModel: function () {
                    var defaultNamesCount = 0,
                        defaultName = 'New Alert',
                        alertName = 'New Alert',
                        alertModel = new exports.Models.Alert();
                    var dataCollection = this.collection.toJSON();
                    do {
                        if(defaultNamesCount !== 0 ){
                            alertName = defaultName + defaultNamesCount;
                        }
                        defaultNamesCount = parseInt(defaultNamesCount, 10) + 1;
                    } while (_.contains(_.pluck(dataCollection,'rule_name'), alertName));
                    alertModel.set('rule_name', alertName);
                    alertModel.set('rule_description', 'Alert On Plugin - ' + alertModel.get('plugin_name'));
                    this.collection.add(alertModel);
                    var alertView = new exports.Views.Alert({model: alertModel, alertsCollection: this.collection});
                    var newAlertView = alertView.render();
                    newAlertView.$el.find('.emailAlerts').toggleClass('alertsOpen').find('.controlsContainer').slideToggle(100);
                    this.$el.find('#emailAlerts').prepend(newAlertView.el);
                    this.listenTo(alertView, 'removeAlertModel', this.removeAlertModel);
                    return this;
                },
                removeAlertModel: function (model) {
                    if (!model.isNew()) {
                        var options = {
                            'url': this.collection.url,
                            'data': 'rule_uuid='+model.get('id')
                        };
                        model.destroy(options,{silent:true});
                        this.collection.remove(model);
                        return this;
                    }
                    this.collection.remove(model);
                    return this;
                },
                render: function () {
                    if (this.collection.url) {
                        this.collection.fetch();
                    } else {
                        this.$el.append(crel('div', {'class': 'centerLine'}, 'Nothing to load...'));
                    }
                    return this;
                },
                renderAlerts: function () {
                    var dataCollection = this.collection.models,
                        tmpl = _.template(this.template);
                    this.$el.empty();
                    this.$el.append(tmpl());
                    var that = this;
                    _.each(dataCollection, function (alertModel) {
                        //var alertModel = new exports.Models.Alert(alert);

                        var alertView = new exports.Views.Alert({model: alertModel, alertsCollection: that.collection});
                        that.$el.find('#emailAlerts').append(alertView.render().el);
                        that.listenTo(alertView, 'removeAlertModel', that.removeAlertModel);
                        //console.log(alertView.$('#' + alertView.cid + '-alert-form')[0]);
                        h5f.setup(alertView.$('#' + alertView.cid + '-alert-form')[0], {
                            validClass: 'valid',
                            invalidClass: 'invalid',
                            requiredClass: 'required',
                            placeholderClass: 'placeholder'
                        });
                    });

                    return this;
                }
            }),
            Alert: Backbone.View.extend({
                initialize: function () {
                    this.template = alertTemplate;
                    this.$el.attr('id', this.cid);
                    this.$el.attr('data-id', this.model.id);
                    this.pluginView = '';
                    this.listenTo(this.model,'request',this.showSyncing);
                    this.listenTo(this.model,'sync',this.syncModel);
                },
                className: 'alertOuterContainer',
                events: {
                    'change .pluginType': 'changePlugin',
                    'mouseover .alertsTitle': 'mouseOver',
                    'mouseout .alertsTitle': 'mouseOut',
                    'click .alertsTitle': 'editAlertToggle',
                    'click [data-action=removeAlert]': 'removeAlert',
                    'click [data-action=cancelChanges]': 'cancelChanges',
                    'click [data-action=saveChanges]': 'saveChanges',
                    'change .alertName': 'checkSameName',
                    'change .userGroup': 'toggleUserGroup'
                },
                showSyncing: function() {
                    this.$el.find('.emailAlerts [data-id=status]').html('Syncing...');
                },
                syncModel: function() {
                    //this.$el.find('.alerts .status').html('Syncing...');
                    //console.log('Syncing Model..')
                },
                mouseOver: function () {
                    this.$el.find('.icon-edit').removeClass('hide');
                },
                mouseOut: function () {
                    this.$el.find('.icon-edit').addClass('hide');
                },
                editAlertToggle: function () {
                    this.$el.find('.emailAlerts').toggleClass('alertsOpen').find('.controlsContainer').slideToggle(100);
                },
                removeAlert: function () {
                    this.trigger('removeAlertModel', this.model);
                    this.close();
                    return this;
                },
                beforeClose: function() {
                    this.pluginView.close();
                },
                cancelChanges: function () {
                    if (!this.$el.attr('data-id')) {
                        this.removeAlert();
                        return this;
                    }
                    this.revertChanges();
                    return this;
                },
                checkSameName: function () {
                    if(_.contains(_.pluck(this.options.alertsCollection.toJSON(), 'rule_name'),this.$el.find('.alertName').val()))
                    {
                        this.$el.find('.alertName')[0].setCustomValidity('This alert name already exists.');
                    } else {
                        this.$el.find('.alertName')[0].setCustomValidity('');
                    }
                    return this;
                },
                toggleUserGroup: function(event) {
                    var userGroupOption = $(event.currentTarget).val();
                    if(userGroupOption === 'user') {
                        this.$el.find('.user').removeAttr('disabled');
                        this.$el.find('.group').val('');
                        this.$el.find('.group').attr('disabled','disabled');
                    } else if (userGroupOption === 'group') {
                        this.$el.find('.group').removeAttr('disabled');
                        this.$el.find('.user').val('');
                        this.$el.find('.user').attr('disabled','disabled');
                    }

                },
                revertChanges: function () {
                    this.$el.find('.alertName').val(this.model.get('rule_name'));
                    this.$el.find('.alertDescription').val(this.model.get('rule_description'));
                    this.$el.find('.pluginName').val(this.model.get('plugin_name'));
                    this.$el.find('.customerName').val(this.model.get('customer_name'));
                    this.$el.find('.agents').val(_.pluck(this.model.get('agents'), 'id'));
                    this.$el.find('.tags').val(_.pluck(this.model.get('tags'), 'id'));
                    if(this.model.get('user')) {
                        this.$el.find('.user').val(this.model.get('user'));
                        this.$el.find('.userGroup').val('user');
                        this.$el.find('.user').removeAttr('disabled');
                        this.$el.find('.group').val('');
                        this.$el.find('.group').attr('disabled','disabled');

                    } else if (this.model.get('group')) {
                        this.$el.find('.group').val(this.model.get('group'));
                        this.$el.find('.userGroup').val('group');
                        this.$el.find('.group').removeAttr('disabled');
                        this.$el.find('.user').val('');
                        this.$el.find('.user').attr('disabled','disabled');

                    }

                    if (this.model.get('plugin_name') === 'rv') {
                        this.pluginView.close();
                        this.pluginView = new exports.Views.Rv({model: this.model.toJSON()});
                        this.$el.find('.alertsContainer').append(this.pluginView.render().el);
                        this.$el.find('.rvOperationType').val(this.model.get('rv_operation_type'));
                        this.$el.find('.rvOperationStatus').val(this.model.get('rv_threshold'));
                    } else if (this.model.get('plugin_name') === 'monitoring') {
                        this.pluginView.close();

                        this.pluginView = new exports.Views.Monitoring({model: this.model.toJSON()});
                        this.$el.find('.alertsContainer').append(this.pluginView.render().el);
                        this.$el.find('.monitoringThreshold').val(this.model.get('monitoring_threshold'));
                        this.$el.find('.monitoringOperationType').val(this.model.get('monitoring_operation_type'));
                        if (this.$el.find('.monitoringOperationType').val() === 'filesystem') {
                            this.$el.find('.fileSystem').val(this.model.get('file_systems'));
                            this.$el.find('.fileSystemContainer').removeClass('hide');
                        }
                    }
                    return this;
                },
                saveChanges: function () {


                    if(_.contains(_.pluck(_.map(this.options.alertsCollection.without(this.model),function (model) { return model.attributes; } ), 'rule_name'),this.$el.find('.alertName').val()))
                    {
                        this.$el.find('.alertName')[0].setCustomValidity('This alert name already exists.');
                    } else {
                        this.$el.find('.alertName')[0].setCustomValidity('');
                    }

                    if(!this.$('#'+this.cid+'-alert-form')[0].checkValidity()) {
                        //alert("false");
                        return this;
                    }

                    var agent_ids = this.$el.find('.agents').select2('val');
                    var tag_ids = this.$el.find('.tags').select2('val');
                    var data = 'plugin_name=' + this.$el.find('.pluginName').val() + '&';
                    data = data + 'rule_name=' + this.$el.find('.alertName').val() + '&';
                    data = data + 'rule_description=' + this.$el.find('.alertDescription').val() + '&';
                    data = data + 'customer_name=' + this.$el.find('.customerName').val() + '&';
                    data = data + 'alert_on_rv_operation_status=' + this.$el.find('.rvOperationStatus').val() + '&';
                    data = data + 'alert_on_rv_operation=' + this.$el.find('.rvOperationType').val() + '&';
                    data = data + 'monitoring_threshold=' + this.$el.find('.monitoringThreshold').val() + '&';
                    data = data + 'alert_on_monitoring_type=' + this.$el.find('.monitoringOperationType').val() + '&';
                    data = data + 'user=' + this.$el.find('.user').val() + '&';
                    data = data + 'group=' + this.$el.find('.group').val() + '&';
                    data = data + 'file_system=' + this.$el.find('.fileSystem').val() + '&';
                    _.each(agent_ids, function (agent_id) {
                        data = data + 'agent_ids=' + agent_id + '&';
                    });
                    _.each(tag_ids, function (tag_id) {
                        data = data + 'tag_ids=' + tag_id + '&';
                    });
                    data = data.substring(0, data.length - 1);
                    var url = '/api/notifications';
                    if(!this.model.isNew()) {
                        data = data + '&rule_id=' + this.model.get('id');
                    }

                    var modelAttributes = {
                            agents: agent_ids,
                            customer_name: this.$el.find('.customerName').val(),
                            group: this.$el.find('.group').val(),
                            plugin_name: this.$el.find('.pluginName').val(),
                            rule_description: this.$el.find('.alertDescription').val(),
                            rule_name: this.$el.find('.alertName').val(),
                            rv_operation_type: this.$el.find('.rvOperationType').val(),
                            rv_threshold: this.$el.find('.rvOperationStatus').val(),
                            tags: tag_ids,
                            user: this.$el.find('.user').val(),
                            monitoring_threshold: this.$el.find('.monitoringThreshold').val(),
                            monitoring_operation_type: this.$el.find('.monitoringOperationType').val(),
                            file_system: this.$el.find('.fileSystem').val()
                        };
                    this.model.set(modelAttributes);
                    var options = {
                        url: url,
                        data: data,
                        this: this,
                        preventCollectionSync : true,
                        success: function (model,response,options) {
                            var that = options.this,
                                data = response;
                            if (!that.$el.attr('data-id')) {
                                that.$el.attr('data-id', data.data[0].id);
                                that.model.set('id',data.data[0].id);
                                that.$el.find('.removeAlert').removeClass('hide');
                            }
                            that.$el.find('[data-id=name] strong').html(that.$el.find('.alertName').val());
                            that.$el.find('[data-id=description]').html(that.$el.find('.alertDescription').val());
                            that.$el.find('[data-id=status]').html('Saved');
                            that.$el.find('.emailAlerts').toggleClass('alertsOpen').find('.controlsContainer').slideToggle(100);
                            setTimeout(function(){
                                that.$el.find('[data-id=status]').empty();
                            },2000);
                        }
                    };

                    this.model.save(null,options);

                    return this;
                },
                changePlugin: function (event) {
                    var plugin_name = $(event.currentTarget).val(),
                        model = this.model.toJSON();
                    this.pluginView.close();
                    switch (plugin_name) {
                    case 'rv':
                        this.pluginView = new exports.Views.Rv({model: model});
                        break;
                    case 'monitoring':
                        this.pluginView = new exports.Views.Monitoring({model: model});
                        break;
                    }
                    this.$el.find('.alertsContainer').append(this.pluginView.render().el);
                    return this;
                },
                viewHelpers: {
                    getSelectOptions: function(options, selectkey,key,text) {
                        var select = crel('select');
                        if(options[selectkey].length) {
                            _.each(options[selectkey], function (option) {

                                select.appendChild(
                                    crel('option', {value: option[key] || option } , option[text] || option )
                                );
                            });
                        }
                        return select.innerHTML;
                    }
                },
                render: function () {
                    var plugin_name, tmpl = _.template(this.template),
                        model = this.model.toJSON();
                    this.$el.empty();
                    _.extend(exports.defaultOptions,this.viewHelpers);
                    this.$el.append(tmpl({model: model, defaultOptions: exports.defaultOptions,viewId: this.cid}));
                    this.$el.find('.pluginName').val(model.plugin_name);
                    this.$el.find('.customerName').val(model.customer_name);
                    this.$el.find('.agents').select2({
                        width:'copy'
                    });
                    this.$el.find('.tags').select2({
                        width:'copy'
                    });

                    this.$el.find('.agents').val(_.pluck(model.agents, 'id')).trigger('change');
                    this.$el.find('.tags').val(_.pluck(model.tags, 'id')).trigger('change');
                    if(model.user) {
                        this.$el.find('.user').val(model.user);
                        this.$el.find('.userGroup').val('user');
                        this.$el.find('.user').removeAttr('disabled');
                        this.$el.find('.group').val('');
                        this.$el.find('.group').attr('disabled','disabled');

                    } else if (model.group) {
                        this.$el.find('.group').val(model.group);
                        this.$el.find('.userGroup').val('group');
                        this.$el.find('.group').removeAttr('disabled');
                        this.$el.find('.user').val('');
                        this.$el.find('.user').attr('disabled','disabled');

                    }
                    this.$el.find('.user').val(model.user);
                    this.$el.find('.group').val(model.group);
                    plugin_name = model.plugin_name;
                    switch (plugin_name) {
                    case 'rv':
                        this.pluginView = new exports.Views.Rv({model: model});
                        break;
                    case 'monitoring':
                        this.pluginView = new exports.Views.Monitoring({model: model});
                        break;
                    }
                    this.$el.find('.alertsContainer').append(this.pluginView.render().el);
                    if(!this.$el.attr('data-id')) {
                        this.$el.find('.removeAlert').addClass('hide');
                    }


                    return this;
                }
            }),
            Rv: Backbone.View.extend({
                initialize: function () {
                    this.template = rvAlertTemplate;

                },
                render: function () {
                    var tmpl = _.template(this.template),
                        model = this.model;
                    this.$el.empty();
                    this.$el.append(tmpl({model: model, defaultOptions: exports.defaultOptions, viewId: this.cid}));
                    this.$el.find('.rvOperationType').val(model.rv_operation_type);
                    this.$el.find('.rvOperationStatus').val(model.rv_threshold);
                    return this;
                }
            }),
            Monitoring: Backbone.View.extend({
                initialize: function () {
                    this.template = monitoringAlertTemplate;
                },
                events: {
                    'change .monitoringOperationType': 'changeOperationType'
                },
                changeOperationType: function (event) {
                    if ($(event.currentTarget).val() === 'filesystem') {
                        this.$el.find('.fileSystemContainer').removeClass('hide');
                        return this;
                    }
                    this.$el.find('.fileSystemContainer').addClass('hide');
                    return this;
                },
                render: function () {
                    var tmpl = _.template(this.template),
                        model = this.model;
                    this.$el.empty();
                    this.$el.append(tmpl({model: model, defaultOptions: exports.defaultOptions, viewId: this.cid}));
                    if (model.monitoring_operation_type !== 'filesystem') {
                        this.$el.find('.fileSystemContainer').addClass('hide');
                    }
                    this.$el.find('.monitoringOperationType').val(model.monitoring_operation_type);
                    return this;
                }
            })
        };
        //exports.init();
        return exports;
    }
);