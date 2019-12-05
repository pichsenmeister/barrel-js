
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
        if (this.debug) console.debug('registering request event listener:', event)
        if (typeof event === 'string' && event.indexOf('$.') !== 0) event = `$..${event}`
        store.addEvent(event, callback, 'request')
    }

    onRes (event, callback) {
        if (this.debug) console.debug('registering response event listener:', event)
        if (typeof event === 'string' && event.indexOf('$.') !== 0) event = `$..${event}`
        store.addEvent(event, callback, 'response')
    }

    registerAll (services) {
        for (let serviceId in services) this.register(serviceId, services[serviceId])
    }

    register (serviceId, config) {
        if (this.debug) console.debug(`registering service ${serviceId}`, config)
        store.addService(serviceId, config)
    }

    call (serviceId, context, data) {
        let service = store.getService(serviceId)

        let config = service(context)
        console.log(config)

        let opt = {
            method: config.method || 'POST',
            uri: config.url,
            headers: config.headers || {}
        }

        if (!(config.hasOwnProperty('json') && config.json === false)) opt.json = true
        if (config.body) opt.body = config.body(context)

        request(opt, (error, response, body) => {
            // console.log(body)
            this.response(body, context, data)
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
        // let results = store.getListener(req.body)

        let result = store.getListener(req.body, 'request')

        if (result && result.event) {
            store.emit(result.event, {
                callback: result.callback,
                body: req.body,
                req: req,
                res: res,
                context: result.context,
                matches: result.matches

                // if (results && results.length) {
                //     results.forEach(result => {
                //         console.log(res)
                //         store.emit(result.event, {
                //             callback: result.callback,
                //             body: req.body,
                //             req: req,
                //             res: res,
                //             context: result
            })
            // })
        } else {
            return res.status(501).send({ error: 'no matching listener registered' })
        }
    }

    response (payload, context, data) {
        let result = store.getListener(payload, 'response')

        if (result && result.event) {
            store.emit(result.event, {
                callback: result.callback,
                body: payload,
                context: context,
                result: result.context,
                matches: result.matches,
                data: data
            })

        } else {
            return console.error({ error: 'no matching listener registered' })
        }
    }

}


module.exports = Barrel