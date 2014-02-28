define(
    function () {
        "use strict";
        return function (vent) {
            var that = this;
            that.vent = vent;
            that.start = function () {
                this.ws = new window.WebSocket("wss://" + window.location.host + "/ws");
                this.ws.onmessage = this.onMessage;
                this.ws.onopen = this.onOpen;
                this.ws.onclose = this.onClose;
                this.ws.onerror = this.onError;
            };
            that.onMessage = function (event) {
                window.console.log(['websocket', 'message', event]);
                var data = JSON.parse(event.data);
                that.vent.trigger('message', data);
            };
            that.onOpen = function (event) {
                window.console.log(['websocket', 'opened', event]);
            };
            that.onClose = function (event) {
                window.console.log(['websocket', 'closed', event]);
            };
            that.onError = function (event) {
                window.console.log(['websocket', 'error', event]);
            };
        };
    }
);
