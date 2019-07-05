"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var set = function set(payload, options) {
  if (_typeof(options) !== 'object' || Array.isArray(options)) throw new Error('options has to be a JSON object');

  switch (_typeof(payload)) {
    case 'object':
      if (Array.isArray(payload)) {
        return payload.map(function (item) {
          return set(item, options);
        });
      }

      var jsonKeys = Object.keys(payload);
      jsonKeys.forEach(function (key) {
        payload[key] = set(payload[key], options);
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
    var regex = new RegExp("{{".concat(key, "}}"), 'g');
    str = str.replace(regex, options[key]);
  });
  return str;
};

module.exports = {
  set: set
};