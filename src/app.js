
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

const Logger = require('./logger')
const Store = require('./store')
const Request = require('./request')

let _self;

class Barrel {

    constructor(config) {
        config = config || {}
        const logLevel = (config.logLevel || 'PROD')

        this.config = {
            port: config.port || 5000,
            route: config.route || '/barrel',
            method: (config.method || 'POST').toLowerCase(),
            middlewares: config.middlewares || [],
            bodyParser: config.bodyParser || bodyParser.json(),
            logLevel: logLevel,
            logger: (new Logger({ logLevel })),
        }

        this.logger = this.config.logger
        this.app = express()
        this.router = express.Router()
        this.app.use('/', this.router)

        this.store = new Store({
            logger: this.logger
        })

        _self = this
    }

    on (pattern, callback, trim) {
        this.logger.debug('registering request event listener:', pattern)
        this.store.addEvent({ pattern, trim }, callback)
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
                _self.store.emit(listener.pattern, {
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

    plugin (plugin) {
        this.store.addPlugin(plugin)
        Object.entries(plugin.functions).map(([key, value]) => {
            this[key] = value
        })
    }

    register (service) {
        this.store.addService(service)
    }

    registerAll (services) {
        services.forEach(service => this.register(service))
    }

    async act (serviceAction, ...args) {
        try {
            const split = serviceAction.split('.')
            const serviceId = split[0]
            const service = this.store.getService(serviceId)
            const action = service.actions && service.actions[split[1]]
            if (action) {
                return await action(...args)
            } else {
                this.logger.debug('No action registered for ', serviceAction)
            }
        } catch (err) {
            _self._error(err)
        }
    }

    async call (serviceRequest, ...args) {
        try {
            const split = serviceRequest.split('.')
            const serviceId = split[0]
            const service = this.store.getService(serviceId)
            const request = service.requests && service.requests[split[1]]
            if (request) {
                const result = await axios(new Request(service, request, ...args))
                return result.data
            } else {
                _self.logger.debug('No request registered for ', serviceRequest)
            }
        } catch (err) {
            _self._error(err.response && err.response.data || err)
        }
    }

    start (callback) {
        callback = callback || (() => {
            this.logger.info(`🛢️ Your barrel is running on ${this.config.method.toUpperCase()} <host>:${this.config.port}${this.config.route}`)
        })

        this.app.use(this.config.bodyParser)

        if (this.config.middlewares.length) {
            this.logger.debug('registering middlewares:', this.config.middlewares.length)
            this.config.middlewares.forEach(middleware => this.app.use(middleware))
        }
        // spin up route listener
        this.logger.debug(`spinning up ${this.config.method.toUpperCase()} route: ${this.config.route} `)
        this.router[this.config.method](this.config.route, this._router)

        this.app.listen(this.config.port, callback)
        return this.app
    }

    getStore () {
        return this.store
    }

    getRouter () {
        return this.router
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