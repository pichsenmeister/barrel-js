const events = require('events')
const { JSONPath } = require('jsonpath-plus')
const JSONFilter = require('@barreljs/json-filter')

class Store {

    constructor(config) {
        config = config || {}
        this.debug = config.debug || false
        this.events = []
        this.services = {}
        this.plugins = {}
        this.emitter = new events.EventEmitter()
    }

    addEvent (event, callback) {
        // check for existing event, we don't allow duplicate events
        const exists = this.events.some(listener => {
            // if event listener don't have same types, it's definitely not a match
            if (typeof event.pattern !== typeof listener.pattern) return false
            switch (typeof event.pattern) {
                case 'string':
                    return listener.pattern.toLowerCase() === event.pattern.toLowerCase()
                default:
                    return JSON.stringify(listener.pattern).toLowerCase() === JSON.stringify(event.pattern).toLowerCase()
            }

        })
        if (!exists) {
            const trim = (event.trim === false) ? false : true
            if (this.debug) console.debug('registering event listener in store:', event)
            this.events.push({
                pattern: event.pattern,
                callback,
                trim
            })

            this.emitter.addListener(event.pattern, this._eventListener)
        } else if (this.debug) {
            console.debug('can\'t add event listener to store, event listener already exists')
        }
    }

    addPlugin (plugin) {
        if (!plugin.name) throw 'Plugin: plugin name is required'
        if (!plugin.functions || !Object.keys(plugin.functions).length) throw 'Plugin: plugin functions needs at least one function'
        this.plugins[plugin.name] = plugin
    }

    addService (service) {
        if (!service.name) throw 'Store: service name is required'
        if (!service.actions && !service.requests) throw 'Store: service actions or requests are required'
        if (service.actions && !Object.keys(service.actions).length) throw 'Store: service actions needs at least one action'
        if (service.requests && !Object.keys(service.requests).length) throw 'Store: service requests needs at least one request'

        if (this.debug) console.debug(`registering service ${service.name} in store`)
        this.services[service.name] = service
    }

    emit (pattern, data) {
        if (this.debug) {
            let debugEvent = typeof pattern === 'string' && pattern || JSON.stringify(pattern)
            console.debug(`emitting event ${debugEvent}:`, {
                message: data.message
            })
        }
        this.emitter.emit(pattern, data)
    }

    getListener (payload) {
        const listeners = this.events.filter(event => {
            let pattern = event.pattern
            switch (typeof pattern) {
                case 'string':
                    if (pattern === payload) {
                        event.values = this._toValueObject([payload])
                        return event
                    }
                    // fix json-path listener format if necessary
                    if (pattern.indexOf('$.') !== 0) pattern = `$..${pattern}`
                    const strMatches = JSONPath({ path: pattern, json: payload })
                    if (strMatches.length) {
                        event.values = this._toValueObject(strMatches)
                        return event
                    }
                    return false
                default:
                    const objMatches = JSONFilter(payload, pattern, event.trim)
                    if (objMatches.length) {
                        event.values = objMatches
                        return event
                    }
                    return false
            }
        })


        if (this.debug) console.debug('returning matching listener:', listeners.length)
        return listeners
    }

    getPlugin (pluginId) {
        return this.plugins[pluginId] || false
    }

    getService (serviceId) {
        return this.services[serviceId] || false
    }

    async _eventListener ({ callback, values, message, context }) {
        const opt = {
            message: message || {},
            context: context || {},
            values: values
        }

        if (opt.context.execution && opt.context.execution.res) {
            const res = opt.context.execution.res
            opt.done = res.send.bind(res)
        } else {
            opt.done = () => { }
        }

        try {
            await callback(opt)
        } catch (err) {
            if (this.debug) console.error(err)
            if (context.execution.res) context.execution.res.status(400).send()

        }
    }

    _toValueObject (values) {
        return {
            all: () => {
                return values
            },
            first: () => {
                return values.length ? values[0] : false
            },
            last: () => {
                return values.length ? values[values.length - 1] : false
            },
            get: (index) => {
                return index >= values.length ? false : values[index]
            },
            length: values.length
        }
    }


}

module.exports = Store