"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var contains = function contains(payload, context) {
  if (_typeof(payload) === 'object') payload = JSON.stringify(payload);

  if (_typeof(context) === 'object') {
    context = JSON.stringify(context);
    context = context.trim().slice(1, -1);
  }

  return payload.indexOf(context) >= 0;
};

module.exports = {
  contains: contains
};