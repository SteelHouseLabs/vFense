define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'json!./modules/list.json', 'select2'],
    function ($, _, Backbone, app, crel, moduleList) {
        'use strict';
        var exports = {
            View: app.createChild(Backbone.View),
            Model: app.createChild(Backbone.Model)
        };

        _.extend(exports.Model.prototype, {
            defaults: {
                moduleName: 'plainText',
                moduleJSON: {},
                moduleSpan: 6,
                class: ''
            },
            validate: function (attrs) {
                var name = attrs.moduleName,
                    json = attrs.moduleJSON,
                    span = attrs.moduleSpan,
                    errors = [];
                if (typeof name !== 'string') {
                    errors.push('moduleName must be a string');
                } else if (name.trim() === '') {
                    errors.push('moduleName cannot be an empty string');
                }
                if (!$.isPlainObject(json) && !(json instanceof Backbone.Model)) {
                    errors.push('moduleJSON must be a well formed JSON Object; a plain object');
                }
                if (!$.isNumeric(span)) {
                    errors.push('moduleSpan must be a number, or a string that can be parsed into a number');
                }
                return errors.length !== 0 ? errors : false;
            }
        });

        _.extend(exports.View.prototype, {
            className: 'column',
            module: null,
            editable: false,
            showSettings: false,
            events: {
                'click button[data-id="edit"]': 'toggleMode',
                'click button[data-id="save"]': 'saveChanges',
                'change select.selector': function (e) { this.changeModule(e.target.value); },
                'click .module': function () { this.toggleControls(false); },
                'click .activate': 'toggleControls'
            },
            initialize: function () {
                if (_.isUndefined(this.model)) {
                    throw new Error('column view requires a model');
                }
                this.setEventListeners();
                if (!(this.model instanceof exports.Model)) {
                    this.model = new exports.Model(this.model instanceof Backbone.Model ? this.model.toJSON() : this.model);
                }
                this.model.set({}, {validate: true});
                if (_.has(this.options, 'editable')) { this.editable = this.options.editable; }
                this.span = this.model.get('moduleSpan');
                this.$el.addClass(this.model.get('class'));
                return this.setSpan().render().showLoading();
            },
            setEventListeners: function () {
                this.listenTo(this.model, 'invalid', this.showInvalidModelError);
                this.listenTo(this.model, 'change:moduleName', this.loadModule);
                this.listenTo(this.model, 'change:moduleSpan', this.setSpan);
                this.on('moduleLoad', this.showLoading);
                this.on('moduleLoad:Error', this.showLoadError);
                this.on('moduleLoaded', this.renderModule);
                return this;
            },
            render: function (force) {
                var $el = this.$el;
                if ($el.children().length === 0 || force) {
                    $el.html(this.layout());
                    this.$('.controls').find('.content').hide();
                }
                if ($.isPlainObject(this.module)) {
                    this.renderModule();
                }
                return this;
            },
            layout: function () {
                var controlElements, fragment;
                controlElements = {
                    selector: this.createSelector(),
                    save: crel('button', {class: 'btn btn-primary hide', 'data-id': 'save'},
                        crel('i', {class: 'icon-ok'}, ' Save')
                    ),
                    toggle: crel('button', {class: 'btn', 'data-id': 'edit'},
                        crel('i', {class: 'icon-pencil'}, ' Edit')
                    )
                };
                fragment = document.createDocumentFragment();
                fragment.appendChild(
                    crel('div', {class: 'module'}, 'Loading...')
                );
                if (this.editable) {
                    fragment.appendChild(
                        crel('div', {class: 'controls'},
                            crel('div', {class: 'content'},
                                controlElements.selector,
                                crel('div', {class: 'pull-right'},
                                    controlElements.save,
                                    ' ',
                                    controlElements.toggle
                                )
                            ),
                            crel('div', {class: 'activate'}, crel('i', {class: 'icon-cog'}))
                        )
                    );
                }
                return fragment;
            },
            setSpan: function (span) {
                if (span instanceof exports.Model) {
                    span = span.get('moduleSpan');
                }
                span = (span || this.span).toString().trim();
                var $el = this.$el,
                    spanNum = /^span[1-9][0-2]{0,1}$/,
                    numeric = /^[1-9][0-2]{0,1}$/;
                if (spanNum.test(span)) {
                    $el.removeClass(this.span)
                        .addClass(this.span = span);
                } else if (numeric.test(span)) {
                    $el.removeClass(this.span)
                        .addClass(this.span = 'span' + span);
                } else {
                    $el.removeClass(this.span);
                    this.span = '';
                }
                return this;
            },
            toggleControls: function (show) {
                if (this.editable) {
                    var $content = this.$('.controls').toggleClass('active', show).find('.content'),
                        duration = 250;
                    if(_.isBoolean(show)) {
                        if (show) {
                            $content.fadeIn(duration);
                        } else {
                            $content.fadeOut(duration);
                        }
                    } else {
                        $content.fadeToggle(duration);
                    }
                }
            },
            createSelector: function () {
                var fragment = document.createDocumentFragment();
                _.each(moduleList, function (module, key) {
                    var element = crel('option', {'value': key}, module.name);
                    fragment.appendChild(element);
                });
                return crel('select', {class: 'selector'}, fragment);
            },
            changeModule: function (name) {
                this.model.set(
                    {'moduleName': name },
                    {'validate': true}
                );
            },
            loadModule: function () {
                var moduleName = this.model.get('moduleName'),
                    location = moduleList[moduleName] ? moduleList[moduleName].loc : moduleName,
                    that = this;
                that.trigger('moduleLoad:' + moduleName, this);
                that.trigger('moduleLoad', this);
                require([location], function (module) {
                    if (that.module) {
                        if (module.conversion && module.conversion[that.module.name]) {
                            that.model.set({
                                moduleJSON: module.conversion[that.module.name](that.model.moduleJSON)
                            });
                        } else {
                            that.model.set({
                                moduleJSON: {}
                            });
                        }
                    }
                    that.module = module;
                    that.trigger('moduleLoaded:' + moduleName, this);
                    that.trigger('moduleLoaded', this);
                }, function (error) {
                    that.trigger('moduleLoad:Error', error);
                });
                return this;
            },
            renderModule: function () {
                var subView = 'Main';
                if (this.showSettings) {
                    //this._moduleBackup = this.module.model.toJSON();
                    subView = 'Settings';
                }
                this.closeCurrent();
                this._currentView = new this.module.views[subView]({
                    model: new this.module.models.Main(this.model.get('moduleJSON'))
                });
                if (_.isEmpty(this.model.get('moduleJSON'))) {
                    this.model.set('moduleJSON', this._currentView.model.toJSON());
                }
                this.hideLoading();
                this.$('.module').html(this._currentView.render().$el);
                return this;
            },
            toggleMode: function (bool) {
                if(_.isBoolean(bool) && bool !== this.showSettings) {
                    this.showSettings = bool;
                } else {
                    this.showSettings = !this.showSettings;
                }
                this.$el.toggleClass('editing', this.showSettings);
                this.$('button[data-id=edit]').html(this.showSettings ?
                    crel('i', {class: 'icon-remove'}, ' Cancel') :
                    crel('i', {class: 'icon-pencil'}, ' Edit')
                );
                this.$('button[data-id=save]').toggleClass('hide', !this.showSettings);
                this.$('select.selector').toggleClass('hide', this.showSettings);
                return this.renderModule();
            },
            saveChanges: function () {
                if(this._currentView && this._currentView.model) {
                    // Overwrite, no questions asked
                    this.model.set('moduleJSON', this._currentView.model.toJSON());
                }
                return this.toggleMode(false);
            },
            showLoading: function () {
                this._pinwheel = this._pinwheel || new app.pinwheel();
                this.closeCurrent();
                this.$('.module').html(
                    this._pinwheel.$el
                );
                return this;
            },
            hideLoading: function () {
                if (this._pinwheel) { this._pinwheel.remove(); }
                return this;
            },
            showInvalidModelError: function (model, error) {
                var reason = JSON.stringify({
                    id: model.cid,
                    model: model.attributes,
                    error: error
                }, null, 2);
                this.hideLoading();
                this.$el.html(crel('div', {class: 'centerLine'}, 'Invalid Model: ' + model.cid + '.'));
                //TODO: BAD CONSOLE.LOG QQ
                window.console.log(reason);
                return this;
            },
            showLoadError: function () {
                this.hideLoading();
                this.$el.html(crel('div', {'class': 'centerLine'}, 'Failed to load module. ' + this.cid));
                //TODO: BAD CONSOLE.LOG QQ
                window.console.log(arguments);
                return this;
            },
            toggleEditable: function (bool) {
                if(_.isBoolean(bool) && bool !== this.showSettings) {
                    this.options.editable = bool;
                } else {
                    this.options.editable = !this.options.editable;
                }
                this.$el.render(true);
            },
            closeCurrent: function () {
                if (this._currentView) {
                    this._currentView.close();
                }
                return this;
            },
            beforeClose: function () {
                this.hideLoading().closeCurrent();
            }
        });
        return exports;
    }
);
