define(
    ['jquery', 'underscore', 'backbone', 'app', 'crel', 'modals/panel', 'text!templates/remote.html'],
    function ($, _, Backbone, app, crel, Panel, remoteTemplate) {
        'use strict';
        var helpers = {},
            exports;
        _.extend(helpers, {
            getAgentName: function (model) {
                return model.get('display_name') ||
                    model.get('host_name') ||
                    model.get('computer_name');
            }
        });
        exports = {
            View: Backbone.View.extend({
                initialize: function () {
                    var that = this;
                    this.template = remoteTemplate;
                    this.pinwheel = new app.pinwheel();
                    this.agent = new (Backbone.Model.extend({
                        baseUrl: 'api/v1/agent/',
                        url: function () {
                            return this.baseUrl + that.id;
                        },
                        parse: function (response) {
                            return response.data;
                        }
                    }))();
                    this.modal = new Panel.View({
                        confirm: that.closeConnection,
                        parentView: that,
                        span: '6',
                        buttons: [
                            {
                                text: 'Cancel',
                                action: 'close',
                                position: 'right'
                            },
                            {
                                text: 'Close',
                                action: 'confirm',
                                className: 'btn-danger',
                                position: 'right'
                            }
                        ]
                    });
                    this.remote = new exports.remoteView();
                    this.addSubViews(this.remote);
                    this.modal.setHeaderHTML(this.headerLayout());
                    this.modal.setContentHTML(this.contentLayout());
                    this.webSocket = new window.WebSocket('wss://' + window.location.host + '/ws/ra/status?agent_id=' + this.id);
                    this.webSocket.onmessage = this.onMessage;
                    this.webSocket.onopen = this.onOpen;
                    this.webSocket.onclose = this.onClose;
                    this.webSocket.onerror = this.onError;
                    this.webSocket.view = this;
                    this.webSocket.id = this.id;
                    this.isFullScreen = false;
                    this.agent.fetch();
                    this.listenTo(this.agent, 'sync', this.renderInfo);
                },
                beforeRender: $.noop,
                onRender: $.noop,
                events: {
                    'click button[data-id=startAgentRa]':       'restartRemoteAssistance',
                    'click button[data-id=closeConnection]':    'toggleModal',
                    'mouseover #remoteHeader':                  'toggleRemoteHeader',
                    'mouseout #remoteHeader':                   'toggleRemoteHeader',
                    'click #toggleFullscreen':                  'toggleFullscreen'
                },
                render: function () {
                    var template = _.template(this.template);

                    this.$el.empty().html(template());

                    this.hideChrome()
                        .showLoading()
                        .startAgentRa();

                    return this;
                },
                renderInfo: function (model) {
                    var $agent = this.$('#agentName'),
                        agentName = helpers.getAgentName(model);
                    document.title = agentName;
                    $agent.empty().html(agentName);
                    return this;
                },
                renderRestartRemoteButton: function () {
                    var $message = this.$('span[data-id=loadMessage]');
                    $message.append(
                        crel('br'),
                        crel('br'),
                        crel('button', {class: 'btn', 'data-id': 'startAgentRa'}, 'Restart Remote Desktop ',
                            crel('i', {class: 'icon-desktop icon-large'})
                        )
                    );
                    return this;
                },
                hideChrome: function () {
                    $('#userMenu').hide();
                    $('#dashboardNav').hide();
                    $('#dashboard-view').css({'padding': '0'});
                    $('body').css('overflow', 'hidden');
                    $(window).click(this.remote.focusIframe);
                    return this;
                },
                enterFullscreen: function (container) {
                    var $icon = this.$('#toggleFullscreen > i'),
                        $remoteHeader = this.$('#remoteHeader'),
                        $handleBar = this.$('#headerHandleBar');
                    this.isFullScreen = true;
                    $('#pageHeader').hide();
                    $('#pageFooter').hide();
                    $handleBar.show();
                    container.css({position: 'absolute', top: '10px', left: 0, right: 0, height: 'auto', 'width': 'auto', 'margin-left': '0', 'margin-right': '0'});
                    $remoteHeader.css({position: 'absolute', top: 0, left: 0, right: 0});
                    $icon.toggleClass('icon-resize-full', false).toggleClass('icon-resize-small', true);
                    return this;
                },
                exitFullscreen: function (container) {
                    var $icon = this.$('#toggleFullscreen > i'),
                        $remoteHeader = this.$('#remoteHeader'),
                        $handleBar = this.$('#headerHandleBar');
                    $('#pageHeader').show();
                    $('#pageFooter').show();
                    $handleBar.hide();
                    this.isFullScreen = false;
                    container.css({position: 'static', top: 'auto', left: 'auto', right: 'auto', height: '705px', width: '940px', 'margin-left': '250px', 'margin-right': '250px'});
                    $remoteHeader.css({position: 'static', top: 'auto', left: 'auto'});
                    $icon.toggleClass('icon-resize-full', true).toggleClass('icon-resize-small', false);
                    return this;
                },
                toggleFullscreen: function (stateValue) {
                    var $remoteContainer = $('#remoteContainer');
                    if (_.isBoolean(stateValue)) {
                        return stateValue ? this.enterFullscreen($remoteContainer) : this.exitFullscreen($remoteContainer);
                    }
                    if (!this.isFullScreen) {
                        this.enterFullscreen($remoteContainer);
                    } else {
                        this.exitFullscreen($remoteContainer);
                    }
                    this.remote.focusIframe();
                    return this;
                },
                toggleRemoteHeader: function (event) {
                    event.preventDefault();
                    var type = event.type,
                        $remoteControls = this.$('#remoteControls');
                    if (this.isFullScreen) {
                        if (type === 'mouseover') {
                            $remoteControls.show();
                        } else {
                            $remoteControls.hide();
                        }
                    }
                    return this;
                },
                toggleModal: function () {
                    this.modal.open();
                },
                headerLayout: function () {
                    return crel('h4', 'Warning');
                },
                contentLayout: function () {
                    return crel('strong', 'Are you sure you want to close the connection?');
                },
                closeConnection: function () {
                    var url = '/api/ra/rd/' + this.options.parentView.id,
                        that = this.options.parentView,
                        modal = this;
                    $.ajax({
                        url: url,
                        type: 'DELETE',
                        success: function (response) {
                            if (response.pass) {
                                modal.cancel();
                                that.changeMessage('Remote Desktop Connection is being closed. You may wait or close the window.', true)
                                    .toggleFullscreen(false)
                                    .toggleFrames();
                            }
                        }
                    });
                },
                showLoading: function () {
                    var $indicator = this.$el.find('span[data-id=loadIndicator]');
                    $indicator.html(this.pinwheel.$el);
                    return this;
                },
                clearLoading: function () {
                    var $indicator = this.$('span[data-id=loadIndicator]');
                    $indicator.empty();
                    return this;
                },
                restartRemoteAssistance: function () {
                    this.changeMessage('Restarting remote connection...', true).startAgentRa();
                    return this;
                },
                startAgentRa: function () {
                    var agent = this.id,
                        that = this,
                        url = 'api/ra/rd/' + agent,
                        params = {};
                    $.post(url, function (response) {
                        if (!response.pass) {
                            that.changeMessage(response.message, false);
                            if (response.status === 'ready' || response.status === 'timeout') {
                                _.extend(params, {
                                    hostname: response.hostname,
                                    port: response.web_port
                                });
                                that.toggleFullscreen()
                                    .loadFrameContent(document.location.origin + '/' + response.uri + '?' + $.param(params))
                                    .toggleFrames();
                            } else {
                                that.showLoading();
                            }
                        }
                    });
                    return this;
                },
                changeMessage: function (message, showIndicator) {
                    var $message = this.$('span[data-id=loadMessage]');
                    if (showIndicator) { this.showLoading(); }
                    else { this.clearLoading(); }
                    $message.empty().html(message);
                    return this;
                },
                toggleFrames: function () {
                    var $loadContainer = this.$('div[data-id=loadContainer]'),
                        $remoteHeader = this.$('#remoteHeader');
                    $loadContainer.toggle();
                    $remoteHeader.toggle();
                    this.remote.toggle();
                    return this;
                },
                loadFrameContent: function (url) {
                    this.remote.loadFrameContent(url);
                    return this;
                },
                onMessage: function (event) {
                    window.console.log(['websocket', 'message', event]);
                    var data = JSON.parse(event.data),
                        params = {};
                    if (data.status === 'ready') {
                        _.extend(params, {
                            hostname: data.hostname,
                            port: data.web_port
                        });
                        this.view.toggleFullscreen()
                            .loadFrameContent(document.location.origin + '/' + data.uri + '?' + $.param(params))
                            .toggleFrames();
                    } else if (data.status === 'closed') {
                        this.view.changeMessage('Remote Desktop connection has been closed.', false)
                            .renderRestartRemoteButton();
                    }
                },
                onOpen: function (event) {
                    window.console.log(['websocket', 'opened', event]);
                },
                onClose: function (event) {
                    window.console.log(['websocket', 'closed', event]);
                },
                onError: function (event) {
                    window.console.log(['websocket', 'error', event]);
                }
            }),
            remoteView: Backbone.View.extend({
                initialize: function () {
                    this.render();
                },
                render: function () {
                    $('body').append(this.layout());
                },
                layout: function () {
                    return crel('div', {class: 'hide', id: 'remoteContainer', style: 'position: absolute; left: 0; right: 0; bottom: 0; top: 10px; overflow: hidden;'},
                        crel('iframe', {id: 'remoteFrame', style: 'height: 100%; width: 100%; overflow: scroll; box-sizing: border-box; border: none;'})
                    );
                },
                toggle: function () {
                    var $container = $('#remoteContainer');
                    $container.toggle();
                },
                focusIframe: function () {
                    var $frame = $('#remoteFrame');
                    $frame.blur().focus();
                    return this;
                },
                resizeFrame: function () {
                    var $frame = $('#remoteFrame');
                    $frame.height($frame.contents().find('body').height());
                    //$frame.width($frame.contents().find('#noVNC_canvas').width());
                    return this;
                },
                loadFrameContent: function (url) {
                    var $frame = $('#remoteFrame');
                    $frame.attr('src', url);
                    return this;
                }
            })
        };
        return exports;
    }
);
