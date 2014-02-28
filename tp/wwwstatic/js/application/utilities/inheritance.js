define([], function () {
    'use strict';
    // Based on Coffeescript's class extension methods
    var exports = {};
    exports.inherit = function (child, parent) {
        var key;
        function Temp() {}
        Temp.constructor = child;
        for (key in parent) {
            if (parent.hasOwnProperty(key)) {
                (child[key] = parent[key]);
            }
        }
        Temp.prototype = parent.prototype;
        child.prototype = new Temp();
        child.__super__ = parent.prototype;
        return child;
    };
    exports.createChild = function (parent, func) {
        func = func || function () {
            func.__super__.constructor.apply(this, arguments);
        };
        exports.inherit(func, parent);
        return func;
    };
    return exports;
});
