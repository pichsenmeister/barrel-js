"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var filter = function filter(payload, key, index) {
  if (_typeof(payload) !== 'object') throw new Error('unsupported payload');
  if (typeof key !== 'string') throw new Error('parameters mismatch');
  if (typeof index !== 'undefined' && typeof index !== 'number') throw new Error('parameters mismatch');
  index = index || false;
  var results = [];

  switch (_typeof(payload)) {
    case 'object':
      results = parseFilter(payload, key, index, results);
      break;
  }

  if (index !== false && results.length - 1 > index) return results[index];
  if (index !== false) throw new Error('index out of range');
  return results;
};

var parseFilter = function parseFilter(payload, key, index, results) {
  switch (_typeof(payload)) {
    case 'object':
      if (Array.isArray(payload)) {
        payload.map(function (item) {
          return parseFilter(item, key, index, results);
        });
      } else {
        var jsonKeys = Object.keys(payload);
        jsonKeys.forEach(function (item) {
          if (item === key) results.push(payload[item]);
          if (_typeof(payload[item]) === 'object') parseFilter(payload[item], key, index, results);
        });
      }

      break;
  }

  return results;
};

module.exports = {
  filter: filter
};