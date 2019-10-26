"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var express = require('express');

var bodyParser = require('body-parser');

var _require = require('./compile'),
    compile = _require.compile;

var _require2 = require('./contains'),
    contains = _require2.contains;

var _require3 = require('./filter'),
    filter = _require3.filter;

var _require4 = require('./match'),
    match = _require4.match;

var Barrel =
/*#__PURE__*/
function () {
  function Barrel(config) {
    _classCallCheck(this, Barrel);

    console.log('constructor called');
    config = config || {};
    this.port = config.port || 3141;
    this.route = config.route || '/barrel';
    this.method = config.method || 'POST';
    this.middleware = config.middleware || false;
    this.app = express();
    this.compile = compile;
    this.contains = contains;
    this.filter = filter;
    this.match = match;
  }

  _createClass(Barrel, [{
    key: "on",
    value: function on(event, callback) {
      store.addEvent(event, callback);
    }
  }, {
    key: "router",
    value: function router(req, res) {
      console.log(req.headers);
      console.log(req.body);
      var result = store.getListener(req.body);
      emit(result.event, {
        callback: result.callback,
        body: req.body,
        req: req,
        res: res,
        context: match(req.body, result.event)
      });
    }
  }, {
    key: "start",
    value: function start(callback) {
      var _this = this;

      console.log('start');

      var startListener = function startListener() {
        console.log("🛢️ Your barrel is running on port " + _this.port);
      };

      callback = callback || startListener; // add body parser middleware and barrel middleware

      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({
        extended: true
      }));
      if (this.middleware) app.use(this.middleware); // spin up route listener

      app[method.toLowerCase()](this.route, router);
      var expressListener = app.listen(this.port, callback);
      return expressListener;
    }
  }]);

  return Barrel;
}();

module.exports = Barrel;