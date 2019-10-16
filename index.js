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

var contains = function contains(payload, context) {
  if (_typeof(payload) === 'object') payload = JSON.stringify(payload);

  if (_typeof(context) === 'object') {
    context = JSON.stringify(context);
    context = context.trim().slice(1, -1);
  }

  return payload.indexOf(context) >= 0;
};

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

            return Object.compare(payload[item], obj[item]);
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

Object.compare = function (obj1, obj2) {
  //Loop through properties in object 1
  for (var p in obj1) {
    //Check property exists on both objects
    if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;

    switch (_typeof(obj1[p])) {
      case 'object':
        if (!Object.compare(obj1[p], obj2[p])) return false;
        break;

      default:
        return obj1[p] === obj2[p];
    }
  } //Check object 2 for any extra properties


  for (var _p in obj2) {
    if (typeof obj1[_p] === 'undefined') return false;
  }

  return true;
};

module.exports = {
  compile: compile,
  contains: contains,
  filter: filter,
  match: match
};