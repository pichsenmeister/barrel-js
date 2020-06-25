
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

const Store = require('./store')
const Request = require('./request')

let _self;

class Barrel {

    constructor(config) {
        config = config || {}
        this.config = {
            port: config.port || 3141,
            route: config.route || '/barrel',
            method: (config.method || 'POST').toLowerCase(),
            middlewares: config.middlewares || [],
            bodyParser: config.bodyParser || bodyParser.json(),
            debug: config.debug || false
        }

        this.app = express()

        this.store = new Store({
            debug: this.config.debug
        })

        _self = this
    }

    on (pattern, callback) {
        if (this.debug) console.debug('registering request event listener:', pattern)
        this.store.addEvent(pattern, callback)
    }

    error (callback) {
        this.errorCallback = callback
    }

    dispatch (msg, context) {
        try {
            context = context || {}
            const listeners = _self.store.getListener(msg)
            if (!listeners.length) {
                if (context.res) return context.res.status(404).send({ error: 'no matching listener registered' })
                return false
            }
            listeners.forEach(listener => {
                _self.store.emit(listener.event, {
                    callback: listener.callback,
                    values: listener.values,
                    message: msg,
                    context: context,
                })
            })
        } catch (err) {
            _self._error(err)
        }
    }

    register (service) {
        this.store.addService(service)
    }

    registerAll (services) {
        services.forEach(service => this.register(service))
    }

    async execute (serviceAction, ...args) {
        try {
            const split = serviceAction.split('.')
            const serviceId = split[0]
            const service = this.store.getService(serviceId)
            const action = service.actions && service.actions[split[1]]
            if (action) return await action(...args)

            const request = service.requests && service.requests[split[1]]
            const result = await axios(new Request(service, request, ...args))
            return result.data
        } catch (err) {
            _self._error(err.response && err.response.data || err)
        }

    }

    start (callback) {
        callback = callback || (() => {
            console.log(`🛢️ Your barrel is running on http://localhost:${this.config.port}${this.config.route}`)
        })

        this.app.use(this.config.bodyParser)

        if (this.config.middlewares.length) {
            if (this.config.debug) console.debug('registering middlewares:', this.config.middlewares.length)
            this.config.middlewares.forEach(middleware => this.app.use(middleware))
        }
        // spin up route listener
        if (this.config.debug) console.debug(`spinning up ${this.config.method.toUpperCase()} route: ${this.config.route} `)
        this.app[this.config.method](this.config.route, this._router)

        const expressListener = this.app.listen(this.config.port, callback)
        return expressListener
    }

    getStore () {
        return this.store
    }

    _router (req, res) {
        _self._executionContext = {
            req: req,
            res: res
        }
        try {
            const msg = _self._getMessage(req)
            _self.dispatch(msg, { execution: req, res })
        } catch (err) {
            _self._error(err)
        }
    }

    _error (err) {
        if (_self.errorCallback) {
            _self.errorCallback(err)
        }
        if (_self._executionContext && _self._executionContext.res) {
            return _self._executionContext.res.status(400).send()
        }
    }

    _getMessage (req) {
        switch (_self.config.method) {
            case 'GET':
            case 'DELETE':
            case 'TRACE':
            case 'OPTIONS':
            case 'HEAD':
                return req.query || {}
            default:
                return req.body || {}
        }
    }

}


module.exports = Barrel