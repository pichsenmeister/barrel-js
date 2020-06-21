
const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios')

const Store = require('./store')
const Scheduler = require('./scheduler')
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

        const scheduler = config.scheduler || {}

        if (scheduler.mode === 'http') {
            scheduler.app = this.app
            scheduler.port = this.config.port
            scheduler.method = scheduler.method || this.config.method
            scheduler.route = scheduler.route || '/schedule'
        }
        this.scheduler = new Scheduler(this.store, {
            debug: this.config.debug,
            scheduler: scheduler
        })

        _self = this
    }

    on (event, callback) {
        if (this.debug) console.debug('registering request event listener:', event)
        this.store.addEvent(event, callback)
    }

    error (callback) {
        this.errorCallback = callback
    }

    trigger (body, context) {
        context = context || {}
        const listeners = _self.store.getListener(body)
        if (!listeners.length) {
            if (context.res) return context.res.status(404).send({ error: 'no matching listener registered' })
            return false
        }
        listeners.forEach(listener => {
            _self.store.emit(listener.event, {
                callback: listener.callback,
                data: listener.data,
                body: body,
                context: context,
            })
        })
    }

    schedule (event, timer) {
        this.store.addScheduler(event, timer)
    }

    registerAll (services) {
        services.forEach(service => this.register(service))
    }

    register (service) {
        this.store.addService(service)
    }

    async call (serviceAction, ...args) {
        const split = serviceAction.split('.')
        const serviceId = split[0]
        const service = this.store.getService(serviceId)
        const action = service.actions && service.actions[split[1]]
        const request = service.requests && service.requests[split[1]]

        try {
            if (action) return action(...args)

            const result = await axios(new Request(service, request, ...args))
            return result.data
        } catch (err) {
            if (this.errorCallback) {
                this.errorCallback(err.response || err)
            }
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
        this.app[this.config.method](this.config.route, this.router)

        const expressListener = this.app.listen(this.config.port, callback)
        // start scheduler
        this.scheduler.start()
        return expressListener
    }

    router (req, res) {
        const body = _self.config.method === 'get' ? req.query : req.body
        _self.trigger(body, { req, res })
    }

    getStore () {
        return this.store
    }

}


module.exports = Barrel