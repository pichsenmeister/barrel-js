'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.set = function (payload, options) {
    if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) !== 'object' || Array.isArray(options)) throw new Error('options has to be a JSON object');

    switch (typeof payload === 'undefined' ? 'undefined' : _typeof(payload)) {
        case 'object':
            if (Array.isArray(payload)) {
                return payload.map(function (item) {
                    return undefined.set(item, options);
                });
            }
            var jsonKeys = Object.keys(payload);
            jsonKeys.forEach(function (key) {
                payload[key] = undefined.set(payload[key], options);
            });
            return payload;
        case 'string':
            return parseStr(payload, options);
    }
    return payload;
};

var parseStr = function parseStr(str, options) {
    var keys = Object.keys(options);
    keys.forEach(function (key) {
        var regex = new RegExp('{{' + key + '}}', 'g');
        str = str.replace(regex, options[key]);
    });
    return str;
};