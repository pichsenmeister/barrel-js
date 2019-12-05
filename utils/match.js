"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var utils = require('./utils');

var match = function match(payload, obj, index) {
  if (_typeof(payload) !== 'object') throw new Error('unsupported payload');
  if (_typeof(obj) !== 'object') throw new Error('parameters mismatch');
  if (typeof index !== 'undefined' && typeof index !== 'number') throw new Error('parameters mismatch');
  index = index || false;
  var results = [];

  switch (_typeof(payload)) {
    case 'object':
      results = parseMatch(payload, obj, index, results);
      break;
  }

  if (index !== false && results.length - 1 > index) return results[index];
  if (index !== false) throw new Error('index out of range');
  return results;
};

var parseMatch = function parseMatch(payload, obj, index, results) {
  var objKeys = Object.keys(obj);

  switch (_typeof(payload)) {
    case 'object':
      if (Array.isArray(payload)) {
        payload.map(function (item) {
          return parseMatch(item, obj, index, results);
        });
      } else {
        var jsonKeys = Object.keys(payload);
        var isSubset = objKeys.filter(function (val) {
          return jsonKeys.indexOf(val) >= 0;
        }).length === objKeys.length; // check length if all objKeys are part of this structure and their values are equal

        if (isSubset) {
          var length = objKeys.filter(function (item) {
            if (_typeof(obj[item]) !== 'object') {
              return payload[item] === obj[item];
            }

            return utils.compareObj(payload[item], obj[item]);
          }).length;

          if (isSubset && length === objKeys.length) {
            results.push(payload);
          }
        } // check sub structure as well


        jsonKeys.forEach(function (item) {
          if (_typeof(payload[item]) === 'object') parseMatch(payload[item], obj, index, results);
        });
      }

      break;
  }

  return results;
};

module.exports = {
  match: match
};