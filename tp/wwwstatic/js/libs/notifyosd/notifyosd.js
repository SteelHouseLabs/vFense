(function (definition) {
    'use strict';
    // Requires underscore and Backbone. Will get $ from Backbone.
    // if define.amd, load as AMD module. else append to window
    if (typeof define === 'function' && define.amd) {
        define(['underscore', 'backbone'], definition);
    } else {
        (function () {
            var previousNotifyOSD = window.NotifyOSD,
                NotifyOSD = definition(_, Backbone);

            NotifyOSD.noConflict = function () {
                if (window.NotifyOSD === NotifyOSD) {
                    window.NotifyOSD = previousNotifyOSD;
                }
                return NotifyOSD;
            };

            window.NotifyOSD = NotifyOSD;
        }());
    }
}(function (_, Backbone) {
    'use strict';
    var $ = Backbone.$,
        Timer,
        notification = {},
        notifications = {},
        defaultOptions,
        NotifyOSD;

    // Ender Morpheus.animate simple shim
    // Allows one to pass arguments in jQuery and Zepto style
    // Standard Morpheus.animate syntax should still work
    // .animate(Object properties, Number|String speed, String easing, Function callback)
    // .animate(Object properties, Object options)
    if (!_.isUndefined($.ender) && !_.isUndefined($.fn.animate)) {
        (function () {
            var _animate = $.fn.animate;
            $.fn.animate = function (prop, speed, easing, callback) {
                var opts;
                if (speed && typeof speed === 'object') {
                    opts = speed;
                } else {
                    opts = {
                        complete: callback || (!callback && easing) || (_.isFunction(speed) && speed),
                        duration: speed,
                        easing: (callback && easing) || (easing && !$.isFunction(easing) && easing)
                    };
                }
                return _animate.call(this, _.extend({}, prop, opts));
            };
        }());
    }

    // Timer
    // Inspired by the timer logic used in Ubuntu's NotifyOSD
    // --------------------------------------------------------------------------------
    Timer = function (scheduledDuration, maxDuration) {
        if (_.isUndefined(scheduledDuration) || !_.isNumber(scheduledDuration)) {
            throw new TypeError('Timer: Scheduled duration is required and must be a number');
        }
        if (_.isUndefined(maxDuration) || !_.isNumber(maxDuration)) {
            throw new TypeError('Timer: Max duration is required and must be a number');
        }
        if (scheduledDuration > maxDuration) {
            throw new Error('Scheduled duration should be less than the max duration.');
        }
        this._pausedDuration = 0;
        this._scheduledDuration = scheduledDuration;
        this._maxDuration = maxDuration;
        this._isStarted = false;
        this._isPaused = false;

        _.bindAll(this);

        return this;
    };

    _.extend(Timer, {
        getNow: Date.now || function () { return +(new Date()); }
    });

    _.extend(Timer.prototype, Backbone.Events, {
        start: function () {
            if (this._isStarted) { return false; }
            var that = this;
            this.scheduledTimer = this.setTimeout(function () {
                return that.emitCompleted();
            }, this._scheduledDuration);
            this.timedOutTimer = this.setTimeout(function () {
                that.stop();
                return that.emitTimeOut();
            }, this._maxDuration);
            this._isStarted = true;
            this._startTime = Timer.getNow();
            this._stopTime = undefined;
            return true;
        },
        stop: function () {
            if (!this._isStarted) { return false; }
            this.scheduledTimer.clear();
            this.timedOutTimer.clear();
            this._isStarted = false;
            this._isPaused = false;
            this._stopTime = Timer.getNow();
            return true;
        },
        pause: function () {
            if (!this._isStarted || this._isPaused) { return false; }
            this._isPaused = true;
            this.scheduledTimer.clear();
            this._pausedTime = Timer.getNow();
            return true;
        },
        resume: function () {
            if (!this._isStarted || !this._isPaused) { return false; }
            this._isPaused = false;
            this._pausedDuration += Timer.getNow() - this._pausedTime;
            this._pausedTime = undefined;
            var that = this,
                extension = this._scheduledDuration - this.scheduledTimer.elapsed();
            this.scheduledTimer = this.setTimeout(function () { return that.emitCompleted(); }, extension);

            return true;
        },
        extend: function (extension) {
            if (!this._isStarted) { return false; }
            if (this._isPaused) {
                if (this._scheduledDuration + extension > this._maxDuration) {
                    this._scheduledDuration = this._maxDuration;
                } else {
                    this._scheduledDuration += extension;
                }
                return true;
            }

            this.scheduledTimer.clear();

            var that = this,
                onScreenTime = this.scheduledTimer.elapsed();
            if (this._scheduledDuration + extension > this._maxDuration) {
                extension = this._maxDuration - onScreenTime;
                this._scheduledDuration = this._maxDuration;
            } else {
                this._scheduledDuration += extension;
                extension = this._scheduledDuration - onScreenTime;
            }

            this.scheduledTimer = this.setTimeout(function () { return that.emitCompleted(); }, extension);

            return true;
        },
        emitCompleted: function () {
            this.trigger('completed');
            return false;
        },
        emitTimeOut: function () {
            this.trigger('timedout');
            return false;
        },
        setTimeout: function (callback, milliseconds) {
            if (!_.isFunction(callback) || !_.isNumber(milliseconds)) {
                return undefined;
            }
            var exports = function () {},
                startTime = Timer.getNow(),
                stopTime,
                updateTimeout,
                updateFrequency = Math.min(Math.ceil(milliseconds / 10), 1000), // every x milliseconds
                cleared = false,
                timeout;
            updateTimeout = function () {
                if (!cleared) {
                    var nextInterval = Math.min(updateFrequency, milliseconds + startTime - Timer.getNow());
                    if (nextInterval <= 0) {
                        stopTime = Timer.getNow();
                        callback.call(this);
                    } else {
                        timeout = setTimeout(updateTimeout, nextInterval);
                    }
                }
            };
            updateTimeout();
            exports.elapsed = function () {
                return stopTime ? stopTime - startTime : -startTime + Timer.getNow();
            };
            exports.clear = function () {
                clearTimeout(timeout);
                stopTime = Timer.getNow();
                cleared = true;
                return true;
            };
            return exports;
        },
        elapsed: function () {
            return this.timedOutTimer.elapsed();
        }
    });

    // Notification Model
    // --------------------------------------------------------------------------------
    notification.Model = Backbone.Model.extend({
        defaults: {
            icon: '',
            title: '',
            body: '',
            action: [],
            urgency: 1,
            appName: 'default',
            replacesID: -1,
            visible: false,
            allowMerge: true
        },
        initialize: function () {
            this.timeCreated = _.isFunction(Date.now) ? Date.now() : new Date().getTime();
            this.set({}, {validate: true}); // Force validation
            this.visible = false;
            this.expired = false;
            _.bindAll(this);
            return this;
        },
        validate: function (attributes) {
            var error;
            if (attributes.icon === '' &&  attributes.title === '' && attributes.body === '') {
                error = 'icon, title and body are empty strings';
            }
            return error;
        }
    });

    // Collection of Notification Models
    // --------------------------------------------------------------------------------
    notifications.Collection = Backbone.Collection.extend({
        model: notification.Model,
        insertNotification: function (notificationObject) {
            var notification, mergeTarget;
            notification = this._prepareModel(notificationObject);
            if (notification.get('replacesID') !== -1) {
                this.replaceNotification(notification);
            } else if (this.isFlooded(notification)) {
                mergeTarget = _.find(this.models, function (model) {
                    return (
                        notification.get('appName') === model.get('appName') &&
                            notification.get('title') === model.get('title') &&
                            notification.get('action') === model.get('action') &&
                            notification.get('allowMerge') === true &&
                            model.get('allowMerge') === true
                    );
                });
                if (mergeTarget && !this.checkAlert() && !this.checkDuration()) {
                    this.get(mergeTarget).set({
                        icon: notification.get('icon'),
                        body: mergeTarget.get('body') !== '' ? mergeTarget.get('body') + '<br />' + notification.get('body') : notification.get('body')
                    });
                } else {
                    // Cannot merge at this time
                    this.add(notification);
                }
            }
            return this;
        },
        // checkAlert is checking the status of a notification.
        // The notification should indicate its status.
        // model.visible will be implemented soon.
        checkAlert: function () {
            return false;
        },
        // the first notification has not already been displayed as a bubble for so long
        // that merging the second into it would cause the newly-calculated duration to be
        // greater than the maximum duration
        checkDuration: function () {
            return false;
        },
        replaceNotification: function (notification) {
            // We only want to call the set method once
            this.at(notification.get('replacesID')).set(
                _.extend({}, notification.attributes, { replacesID: -1 })
            );
        },
        isFlooded: function (notification) {
            if (this.models.length >= 50) { return false; }
            return _.filter(this.models, function (model) {
                return model.get('appName') === notification.get('appName');
            }).length < 10;
        }
    });

    // Notification Model View
    // --------------------------------------------------------------------------------
    notification.View = Backbone.View.extend({
        tagName: 'div',
        className: 'bubble',
        events: {
            'mouseenter': 'pauseTimer',
            'mouseleave': 'resumeTimer'
        },
        initialize: function () {
            if (_.isUndefined(this.model) || !(this.model instanceof Backbone.Model)) {
                throw new TypeError('Notification view expects a model to be defined at notification.model. try "new Notification({model: yourModel});"');
            }

            this.id = this.className + '-' + this.cid;
            this.$el.attr('id', this.id);
            this.closed = false;
            this.listenTo(this.model, 'change:icon', this.updateIcon);
            this.listenTo(this.model, 'change:title', this.updateTitle);
            this.listenTo(this.model, 'change:body', this.updateBody);

            this.options = this.options.opts || {};

            if (this.options.useTimers) {
                this.setupTimer();
            }

            _.bindAll(this);

            return this;
        },
        render: function () {
            if (!this.rendered) {
                this.updateIcon();
                this.updateTitle();
                this.updateBody();
                if (this.model.get('body') === '' && this.model.get('title') !== '') {
                    this.centerTitle();
                }
                this.rendered = true;
                this.model.visible = true;
                this.model.expired = false;
            }

            return this;
        },
        renderField: function (field, html) {
            if (_.isUndefined(this['$' + field])) {
                this['$' + field] = $('<div>').addClass(field);
            }
            if (_.isUndefined(html) || !_.isBoolean(html)) {
                html = false;
            }
            return html ? this['$' + field].html(this.model.get(field)) : this['$' + field].text(this.model.get(field));
        },
        removeField: function (field) {
            if (!_.isUndefined(this['$' + field])) {
                this['$' + field].empty().remove();
            }
            return this;
        },
        updateIcon: function () {
            var field = 'icon',
                value = this.model.get(field);
            if (value !== '') {
                if (!this['$' + field] || this['$' + field][0].parentElement === null) {
                    this.renderField(field).prependTo(this.$el); // always prepend
                } else {
                    this.renderField(field);
                }
            } else {
                this.removeField(field);
            }
            return this;
        },
        updateTitle: function () {
            var field = 'title',
                value = this.model.get(field),
                $rendered;
            if (value !== '') {
                $rendered = this.renderField(field);
                if (this.model.get('icon') === '') {
                    $rendered.prependTo(this.$el);
                } else {
                    $rendered.insertAfter(this.$icon);
                }
            } else {
                this.removeField(field);
            }

            if (this.model.get('body') === '' && this.model.get('title') !== '') {
                this.centerTitle();
            }

            return this;
        },
        updateBody: function () {
            this.lineCountUpdated = false;

            var field = 'body',
                value = this.model.get(field),
                $rendered;
            if (value !== '') {
                $rendered = this.renderField(field, true);
                if (!this['$' + field] || this['$' + field][0].parentElement === null) {
                    $rendered.appendTo(this.$el); // always append
                }
            } else {
                this.removeField(field);
            }

            this.updateLineCount();
            if (this.currentLineCount !== this.lastLineCount) {
                if (this.options.useTimers && this.timer) {
                    this.extendTimerByLineCount();
                }

                if (this.currentLineCount > 10) {
                    $rendered.animate({scrollTop: $rendered[0].scrollHeight}, {duration: 250});
                }
            }

            this.centerTitle();

            return this;
        },
        centerTitle: function () {
            var $title = this.$el.find('.title'),
                lines = this.getLineCount($title),
                adjust = ((3 - lines) / 2) + 'em';
            if (this.model.get('body') === '') {
                if (lines > 0) {
                    if ($title.prop('style').paddingTop === '') {
                        $title.css('padding-top', adjust);
                    } else {
                        $title.animate({'padding-top': adjust}, {duration: 250});
                    }
                }
            } else {
                if ($title.css('padding-top')) {
                    $title.animate({'padding-top': ''}, {duration: 250});
                }
            }
            return this;
        },
        setupTimer: function () {
            if (this.timer instanceof Timer) { return this.timer; }
            var extension = 0;

            this.timer = new Timer(
                this.options.standardTime + extension,
                this.options.maxTime
            );

            return this.timer;
        },
        startTimer: function () { this.timer.start(); },
        stopTimer: function () { this.timer.stop(); },
        pauseTimer: function () { this.timer.pause(); },
        resumeTimer: function () { this.timer.resume(); },
        getTimer: function () {
            return this.timer;
        },
        extendTimerByLineCount: function () {
            if (this.model.get('body') === '') { return this; }
            var extension;
            this.updateLineCount();
            extension = (this.currentLineCount - this.lastLineCount) * this.options.perBodyLineTime;
            extension += this.options.mergeTime;
            this.timer.extend(extension);
            return this;
        },
        lineCountUpdated: false,
        lastLineCount: 0,
        currentLineCount: 0,
        getLineCount: function (element) {
            var $elem = element instanceof $.fn.constructor ? element : this.$el.find(element),
                elem = $elem[0],
                scrollHeight = elem ? elem.scrollHeight : 0,
                fontSize = +(/^\d+/).exec($elem.css('font-size')) || 1;
            return Math.floor(scrollHeight / fontSize);
        },
        updateLineCount: function () {
            if (!this.lineCountUpdated) {
                this.lineCountUpdated = true;
                this.lastLineCount = this.currentLineCount;
                this.currentLineCount = this.getLineCount('.body');
            }
            return this;
        },
        onClose: undefined,
        close: function () {
            this.remove();
            this.unbind();
            if (this.onClose && _.isFunction(this.onClose)) {
                this.onClose();
            }
            this.model.visible = false;
            this.model.expired = true;
            this.closed = true;
        }
    });

    // Notification Collection View
    // --------------------------------------------------------------------------------
    notifications.View = Backbone.View.extend({
        // essentially a controller that connects the collection and the notification view
        tagName: 'div',
        className: 'notifyOSD',
        events: {},
        initialize: function (options) {
            this.id = this.className + '-' + this.cid;
            this.options = options;
            this.$el
                .toggleClass('unitTest', this.options.unitTest)
                .attr('id', this.id);
            this.collection = new notifications.Collection();
            this.activeBubbles = [];
            this.closed = false;
            _.bindAll(this);
            this.render();
            if (this.options.autoStart) { this.start(); }
            return this;
        },
        render: function () {
            if (!this.appended) {
                this.$el.appendTo(this.options.target);
                this.appended = !_.isNull(this.el.parentElement);
            }
            return this;
        },
        running: false,
        start: function () {
            if (this.running) { return false; }
            var that = this;
            if (this.collection.length) {
                _.each(this.collection.models, function (notification) {
                    console.log(notification);
                    that.addNotification(notification);
                });
            }
            this.listenTo(this.collection, 'add', this.addNotification);
            this.running = true;
            return true;
        },
        stop: function () {
            if (!this.running) { return false; }
            this.stopListening(this.collection);
            this.running = false;
            return true;
        },
        addNotification: function (model) {
            if (_.isUndefined(model)) { return false; }
            if (this.activeBubbles.length >= 3) { return false; }
            var that = this,
                view = this.activeBubbles[this.activeBubbles.length] = new notification.View({
                    model: model,
                    opts: this.options
                });
            if (this.options.animate && _.isFunction(view.$el.animate)) {
                view.render().$el
                    .css({display: 'block', opacity: 0})
                    .appendTo(this.$el)
                    .animate({opacity: 1}, {
                        duration: this.activeBubbles.length === 1 ? this.options.firstFadeInTime : this.options.fadeInTime,
                        easing: 'linear',
                        complete: function () {
                            if (that.options.useTimers) { view.timer.start(); view.extendTimerByLineCount(); }
                        }
                    });
            } else {
                // animate is false. So, no fadeIn effect
                view.render().$el.appendTo(this.$el);
                if (this.options.useTimers) { view.timer.start(); view.extendTimerByLineCount(); }
            }

            if (model.get('body') === '' && model.get('title') !== '') {
                view.centerTitle();
            }

            if (this.options.useTimers) {
                // Need a better way to listen to the timer
                this.listenTo(view.timer, 'all', function () {
                    view.timer.stop();
                    view.expired = true;
                    that.removeNotification(view);
                });
            }

            return true;
        },
        removeNotification: function (view) {
            var that = this,
                removeView = function () {
                    if (that.options.useTimers) { view.getTimer().stop(); }
                    view.close();
                    that.activeBubbles.splice(_.indexOf(that.activeBubbles, view), 1);
                    that.collection.remove(view.model);
                    var nextModel = that.getNextNotification();
                    if (that.running && !_.isUndefined(nextModel)) {
                        that.addNotification(nextModel);
                    }
                };
            if (this.options.animate && _.isFunction(view.$el.animate)) {
                view.$el.animate(
                    {
                        opacity: 0,
                        'min-height': 0,
                        'height': 0,
                        'padding-top': 0,
                        'padding-bottom': 0
                    },
                    {
                        duration: this.options.fadeOutTime,
                        easing: 'linear',
                        complete: removeView
                    }
                );
            } else {
                removeView();
            }
        },
        getNextNotification: function () {
            return _.find(this.collection.models, function (model) {
                return !model.visible && !model.expired;
            });
        },
        remove: function () {
            this.$el.remove();
            this.appended = false;
            if (this.running) { this.stop(); }
            return this;
        },
        onClose: undefined,
        close: function (deep) {
            if (this.closed) { return false; }
            this.remove();
            this.unbind();
            if (deep) {
                // Close the active bubbles too, this removes
                // the relevant models from the collection too.
                _.each(this.activeBubbles, function (bubble) {
                    bubble.close();
                    this.collection.remove(bubble.model);
                });
            }
            if (this.onClose && _.isFunction(this.onClose)) {
                this.onClose();
            }
            this.appended = !_.isNull(this.el.parentElement);
            this.closed = true;
            return true;
        }
    });


    // NotifyOSD export preparation
    // --------------------------------------------------------------------------------

    // Option validation
    function validOptions(opts) {
        var valid = {};
        if (opts) {
            if (!_.isUndefined(opts.target)) {
                if (opts.target instanceof $.fn.constructor) {
                    valid.target = opts.target;
                } else if (_.isString(opts.target)) {
                    valid.target = $(opts.target);
                }
            }
            if (_.isBoolean(opts.unitTest)) {
                valid.unitTest = opts.unitTest;
            }
            if (_.isBoolean(opts.animate)) {
                valid.animate = opts.animate;
            }
            if (_.isBoolean(opts.useTimers)) {
                valid.useTimers = opts.useTimers;
            }
            if (_.isBoolean(opts.autoStart)) {
                valid.autoStart = opts.autoStart;
            }
        }
        return valid;
    }

    // Default Options
    defaultOptions = {
        target: 'body',
        animate: true,
        useTimers: true,
        autoStart: true,
        unitTest: false,
        fadeInTime: 300,
        fadeOutTime: 300,
        firstFadeInTime: 700,
        criticalFirstFadeInTime: 200,
        mergeTime: 500,
        mergeOverflowTime: 250,
        mergeExtensionTime: 500,
        perBodyLineTime: 250,
        standardTime: 5000,
        criticalTime: 10000,
        maxTime: 15000
    };

    // NotifyOSD Constructor
    NotifyOSD = function (opts) {
        var that = this;
        this.options = _.extend({}, defaultOptions, validOptions(opts));
        this.notifications = {};
        this.notifications.view = new notifications.View(this.options);
        this.notifications.collection = this.notifications.view.collection;

        if (this.options.unitTest) {
            this.notification = notification;
        }

        // aliases
        this.id = this.notifications.view.id;
        this.start = function () { return that.notifications.view.start(); };
        this.stop = function () { return that.notifications.view.stop(); };
        this.remove = function () { return that.notifications.view.remove(); };
        this.close = function (deep) { return that.notifications.view.close(deep); };
        return this;
    };

    // NotifyOSD Public members
    _.extend(NotifyOSD, {
        Timer: Timer
    });

    // NotifyOSD Public instance members
    _.extend(NotifyOSD.prototype, {
        getCapabilities: function () {
            return [
                'body',
                //'body-hyperlinks',
                //'body-markup',
                'icon-static'
                //'x-Backbone-NotifyOSD-font-icon'
            ];
        },
        createNotification: function (icon, title, body) {
            if (_.isUndefined(icon) || _.isUndefined(title) || _.isUndefined(body)) {
                throw new TypeError('Not enough arguments');
            }

            this.notifications.collection.insertNotification({
                icon: icon.toString().trim(),
                title: title.toString().trim(),
                body: body.toString().trim()
            });

            return this;
        }
    });

    return NotifyOSD;
}));
