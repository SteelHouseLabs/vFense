define(
    ['jquery', 'underscore', 'backbone', 'crel'],
    function ($, _, Backbone, crel) {
        'use strict';
        return {
            View: Backbone.View.extend({
                className: 'modal',
                _opened: false,

                // Variables that affect bootstrap-modal functionality
                animate: false,
                keyboard: true,
                backdrop: true,

                // Variables that affect the modal itself
                span: '', // Leave blank for default bootstrap width
                buttons: [
                    {
                        text: 'Done',
                        action: 'close',
                        className: 'btn-primary span2',
                        position: 'right'
                    }
                ],

                // White list of variables and function that are allowed to be set during init
                _allowed: ['animate', 'keyboard', 'backdrop', 'span', 'buttons', 'confirm', 'cancel'],

                events: {
                    'click [data-action=confirm]': function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.confirm();
                    },
                    'click [data-action=cancel]': function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.cancel();
                    },
                    'click [data-action=close]': function (event) {
                        event.preventDefault();
                        event.stopPropagation();
                        this.hide();
                    },
                    'hidden': function () {
                        this._opened = false;
                        this.close();
                    }
                },

                initialize: function (options) {
                    var $el = this.$el;

                    if (options) {
                        _.extend(this, _.pick(options, this._allowed));
                    }

                    this.render().setSpan();

                    if (this.animate) {
                        $el.addClass('fade');
                    }

                    return this;
                },

                beforeRender: $.noop,
                onRender: $.noop,

                // Set up the modal DOM, but do not show it in browser
                render: function () {
                    if (this.beforeRender !== $.noop) { this.beforeRender(); }

                    var $el = this.$el,
                        $body = $el.find('.modal-body');

                    if ($body.length === 0) {
                        this.layout().renderButtons();
                    }

                    if (this.onRender !== $.noop) { this.onRender(); }

                    return this;
                },

                layout: function () {
                    var baseTemplate = document.createDocumentFragment();
                    baseTemplate.appendChild(crel('header', {'class': 'modal-header'}));
                    baseTemplate.appendChild(crel('section', {'class': 'modal-body'}));
                    baseTemplate.appendChild(crel('footer', {'class': 'modal-footer'}));
                    this.$el.html(baseTemplate);

                    return this;
                },

                renderButtons: function () {
                    if (_.isArray(this.buttons) && this.buttons.length > 0) {
                        var buttons = {
                                left: [],
                                right: []
                            },
                            footer = this.$('.modal-footer');
                        _.each(this.buttons, function (button) {
                            var attributes = { 'class': 'btn' },
                                text = _.isUndefined(button.text) ? 'undefined' : button.text;
                            if (_.isString(button.className)) {
                                attributes['class'] = [attributes['class'], button.className].join(' ');
                            }
                            if (_.isString(button.action)) {
                                attributes['data-action'] = button.action;
                            }
                            if (_.isString(button.style)) {
                                attributes.style = button.style;
                            }
                            buttons[button.position || 'left'].push(crel('button', attributes, text));
                        });

                        if (buttons.left.length > 0) {
                            var options = {};
                            if (buttons.right.length > 0) {
                                options.class = 'pull-left';
                            }
                            footer.append(crel.apply(this, _.flatten(['div', options, buttons.left], true)));
                        }

                        if (buttons.right.length > 0) {
                            footer.append(crel.apply(this, _.flatten(['div', {'class': 'pull-right'}, buttons.right], true)));
                        }
                    }

                    return this;
                },

                // --------------------------------------------------------------------------------
                // Methods for HTML content
                // --------------------------------------------------------------------------------
                openWithHTML: function () {
                    this.setContentHTML(arguments);
                    if (!this.isOpen()) {
                        this.open();
                    }
                    return this;
                },

                setContentHTML: function (content) {
                    this.closeContentView();
                    this.$('> .modal-body').empty().html(content);
                    return this;
                },

                setHeaderHTML: function (content) {
                    this.$('> .modal-header').empty().html(content);
                    return this;
                },

                // --------------------------------------------------------------------------------
                // Methods for Backbone.View content
                // --------------------------------------------------------------------------------
                openWithView: function (view) {
                    this.setContentView(view);
                    if (!this.isOpen()) {
                        this.open();
                    }
                    return this;
                },

                setContentView: function (view) {
                    var that = this,
                        modalBody = this.$('> .modal-body');
                    this.closeContentView();

                    if (view instanceof Backbone.View) {
                        this._contentView = view;
                        this._contentView
                            .render()
                            .delegateEvents();
                        modalBody.empty().html(this._contentView.el);
                    } else if ($.type(view) === 'string') {
                        require([view], function (loaded) {
                            that._contentView = new loaded.View();
                            that._contentView
                                .render()
                                .delegateEvents();
                            modalBody.empty().html(that._contentView.el);
                        });
                    }

                    return this;
                },

                closeContentView: function () {
                    if (!_.isUndefined(this._contentView)) {
                        this._contentView.close();
                        this._contentView = undefined;
                    }
                    return this;
                },

                // --------------------------------------------------------------------------------
                // Modal utility methods
                // --------------------------------------------------------------------------------
                isOpen: function () {
                    return this._opened;
                },

                // Show the modal in browser
                open: function () {
                    var $el = this.$el;
                    if (!this.isOpen()) {
                        this.delegateEvents();

                        if (!_.isUndefined(this._contentView)) {
                            this._contentView.delegateEvents();
                        }

                        // Set bootstrap modal options
                        $el.modal({
                            keyboard: this.keyboard,
                            backdrop: this.backdrop
                        });

                        this._opened = true;
                    }

                    return this;
                },

                hide: function () {
                    this.$el.modal('hide');
                    return this;
                },
                cancel: function () {
                    return this.hide();
                },
                confirm: function () {
                    return this.hide();
                },

                // optional: span
                // Not fully tested for every case
                setSpan: function (span) {
                    var $el = this.$el,
                        spanNum = /^span[1-9][0-2]{0,1}$/,
                        numeric = /^[1-9][0-2]{0,1}$/;

                    span = (span || this.span).trim();

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

                beforeClose: function () {
                    if (this.isOpen()) {
                        this.hide();
                    }
                    this.closeContentView();
                }
            })
        };
    }
);
