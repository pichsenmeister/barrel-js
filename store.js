"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var events = require('events');

var emitter = new events.EventEmitter();

var _require = require('./filter'),
    filter = _require.filter;

var _require2 = require('./match'),
    match = _require2.match;

var store = [];

var addEvent = function addEvent(event, callback) {
  var exists = store.some(function (listener) {
    return listener.event.toLowerCase() === event.toLowerCase();
  });

  if (!exists) {
    store.push({
      event: event,
      callback: callback
    });
    emitter.addListener(event, eventListener);
  }
};

var emit = function emit(filter, context) {
  emitter.emit(filter, context);
};

var getListener = function getListener(event) {
  var results = undefined;

  switch (_typeof(event)) {
    case 'string':
      results = store.filter(function (listener) {
        var filter = filter(event, listener.filter);
        if (!filter.length) return false;
        return filter;
      });
      break;

    default:
      results = store.filter(function (listener) {
        var filter = match(event, listener.filter);
        return filter.length;
      });
      break;
  }

  if (results && results.length) return results[0];
  return results;
};

var eventListener = function eventListener(context) {
  context.callback({
    context: context.context,
    body: context.body,
    res: context.res,
    req: context.req
  });
};

module.exports = {
  addEvent: addEvent,
  emit: emit,
  getListener: getListener
};