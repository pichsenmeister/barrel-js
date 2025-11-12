
const express = require('express')
const axios = require('axios')
const cron = require('node-cron')

const Store = require('./store')
const Request = require('./request')

class Barrel {

    constructor(config) {
        config = config || {}
        this.config = {
            port: config.port || 3141,
            route: config.route || '/barrel',
            method: (config.method || 'POST').toLowerCase(),
            middlewares: config.middlewares || [],
            bodyParser: config.bodyParser || express.json(),
            debug: config.debug || false
        }

        this.app = express()

        this.store = new Store({
            debug: this.config.debug,
            onError: (err, context) => this._error(err, context)
        })

        this.scheduledJobs = []

        // Bind the router context to ensure `this` is available in the express callback
        this._router = this._router.bind(this)
    }

    on (pattern, callback) {
        if (this.config.debug) console.debug('registering request event listener:', pattern)
        this.store.addEvent(pattern, callback)
    }

    error (callback) {
        this.errorCallback = callback
    }

    dispatch (msg, context) {
        try {
            context = context || {}
            const listeners = this.store.getListener(msg)
            if (!listeners.length) {
                if (context.res) return context.res.status(404).send({ error: 'no matching listener registered' })
                return false
            }
            listeners.forEach(listener => {
                this.store.emit(listener.event, {
                    callback: listener.callback,
                    values: listener.values,
                    message: msg,
                    context: context,
                })
            })
        } catch (err) {
            this._error(err, context)
        }
    }

    register (service) {
        this.store.addService(service)
    }

    registerAll (services) {
        services.forEach(service => this.register(service))
    }

    async act (serviceAction, payload) {
        try {
            const split = serviceAction.split('.')
            const serviceId = split[0]
            const service = this.store.getService(serviceId)
            const action = service.actions && service.actions[split[1]]
            if (action) return await action(payload)
            else if (this.config.debug) console.debug('No action registered for ', serviceAction)
        } catch (err) {
            this._error(err) // No HTTP context here, which is correct
        }
    }

    async call (serviceRequest, payload) {
        try {
            const split = serviceRequest.split('.')
            const serviceId = split[0]
            const service = this.store.getService(serviceId)
            const request = service.requests && service.requests[split[1]]
            if (request) {
                const result = await axios(new Request(service, request, payload))
                return result.data
            } else if (this.config.debug) console.debug('No request registered for ', serviceRequest)
        } catch (err) {
            this._error((err.response && err.response.data) || err) // No HTTP context here
        }
    }

    schedule (cronTime, task) {
        if (!cron.validate(cronTime)) {
            const err = new Error(`Invalid cron pattern: ${cronTime}`)
            this._error(err)
            return
        }

        if (this.config.debug) console.debug(`scheduling job with pattern ${cronTime}`)

        const job = cron.schedule(cronTime, async () => {
            if (this.config.debug) {
                console.debug(`Executing scheduled job for pattern: ${cronTime}`)
            }
            try {
                await task()
            } catch (err) {
                this._error(err)
            }
        })
        this.scheduledJobs.push(job)
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

        const originalClose = expressListener.close.bind(expressListener)
        expressListener.close = (cb) => {
            if (this.config.debug) console.debug('stopping all scheduled jobs')
            this.scheduledJobs.forEach(job => job.stop())
            originalClose(cb)
        }
        return expressListener;
    }

    getStore () {
        return this.store
    }

    _router (req, res) {
        const context = { execution: req, res }
        try {
            const msg = this._getMessage(req)
            this.dispatch(msg, context)
        } catch (err) {
            this._error(err, context)
        }
    }

    _error (err, context) {
        if (this.errorCallback) {
            this.errorCallback(err)
        }
        if (context && context.res && !context.res.headersSent) {
            return context.res.status(400).send({ error: 'An internal error occurred' })
        }
    }

    _getMessage (req) {
        switch (this.config.method) {
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