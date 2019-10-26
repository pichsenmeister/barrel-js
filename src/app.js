
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const { compile } = require('./utils/compile')
const { contains } = require('./utils/contains')
const { filter } = require('./utils/filter')
const { match } = require('./utils/match')
const Store = require('./store.js')
// store most be global to access in express route callback
let store

class Barrel {

    constructor(config) {
        config = config || {}
        this.port = config.port || 3141
        this.route = config.route || '/barrel'
        this.method = config.method || 'POST'
        this.middleware = config.middleware || false
        this.debug = config.debug || false
        this.bodyParser = config.bodyParser || 'all'

        this.app = express()
        this.compile = compile
        this.contains = contains
        this.filter = filter
        this.match = match

        store = new Store({
            debug: this.debug
        })
    }

    on (event, callback) {
        if (this.debug) console.debug('registering event listener:', event)
        store.addEvent(event, callback)
    }

    registerAll (services) {
        for (let serviceId in services) this.register(serviceId, services[serviceId])
    }

    register (serviceId, config) {
        if (this.debug) console.debug(`registering service ${serviceId}`, config)
        store.addService(serviceId, config)
    }

    call (serviceId, context) {
        let service = store.getService(serviceId)

        let config = service(context)
        console.log(config)

        let opt = {
            method: config.method || 'POST',
            uri: config.url,
            headers: config.headers || {}
        }

        if (!(config.hasOwnProperty('json') && config.json === false)) opt.json = true

        request(opt, (error, response, body) => {
            console.log(typeof body)
            console.log('getting result:', body)
            this.router({ body: body })
        })
    }

    start (callback) {
        callback = callback || (() => {
            console.log(`🛢️ Your barrel is running on http://localhost:${this.port}${this.route}`)
        })

        // add body parser middleware and barrel middleware
        if (this.bodyParser === 'json' || this.bodyParser === 'all') {
            if (this.debug) console.debug('using JSON body parser')
            this.app.use(bodyParser.json())
        }
        if (this.bodyParser === 'urlencoded' || this.bodyParser === 'all') {
            if (this.debug) console.debug('using urlencoded body parser')
            this.app.use(bodyParser.urlencoded({ extended: true }))
        }
        if (this.middleware) {
            if (this.debug) console.debug('registering middleware:', this.middleware)
            this.app.use(this.middleware)
        }
        // spin up route listener
        if (this.debug) console.debug(`spinning up ${this.method.toUpperCase()} route: ${this.route}`)
        this.app[this.method.toLowerCase()](this.route, this.router)
        const expressListener = this.app.listen(this.port, callback)
        return expressListener
    }

    router (req, res) {
        let result = store.getListener(req.body)

        if (result && result.event) {
            store.emit(result.event, {
                callback: result.callback,
                body: req.body,
                req: req,
                res: res,
                context: result
            })
        } else {
            return res.send({ error: 'no matching listener registered' }, 501)
        }
    }

}


module.exports = Barrel