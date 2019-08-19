"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**  wrapper function for set
 *
 * this function is reserved for future high level parsing
 * which should be done prior to the recursive `set` function.
 * 
 */
var compile = function compile(payload, context) {
  // create a deep copy of the payload
  var copy = payload;
  if (typeof payload === 'string') copy = payload.repeat(1);else if (_typeof(payload) === 'object') copy = JSON.parse(JSON.stringify(payload));
  return set(copy, context);
};

var set = function set(payload, context) {
  if (_typeof(context) !== 'object' || Array.isArray(context)) throw new Error('context has to be a JSON object');

  switch (_typeof(payload)) {
    case 'object':
      if (Array.isArray(payload)) {
        return payload.map(function (item) {
          return set(item, context);
        });
      }

      var jsonKeys = Object.keys(payload);
      jsonKeys.forEach(function (key) {
        payload[key] = set(payload[key], context);
      });
      return payload;

    case 'string':
      return parseStr(payload, context);
  }

  return payload;
};

var parseStr = function parseStr(str, context) {
  var keys = Object.keys(context);
  keys.forEach(function (key) {
    var regex = new RegExp("\\${".concat(key, "}"), 'g');
    str = str.replace(regex, context[key]);
    var escape = new RegExp("\\\\\\${".concat(key, "\\\\}"), 'g');
    str = str.replace(escape, "${".concat(key, "}"));
  });
  return str;
};

module.exports = {
  compile: compile
};