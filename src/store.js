const events = require('events')
const { JSONPath } = require('jsonpath-plus')
const JSONFilter = require('@barreljs/json-filter')

class Store {

    constructor(config) {
        config = config || {}
        this.debug = config.debug || false
        this.events = []
        this.services = {}
        this.emitter = new events.EventEmitter()
    }

    addService (service) {
        if (!service.name) throw 'Store: service name is required'
        if (!service.actions && !service.requests) throw 'Store: service actions or requests are required'
        if (service.actions && !Object.keys(service.actions).length) throw 'Store: service actions needs at least one action'
        if (service.requests && !Object.keys(service.requests).length) throw 'Store: service requests needs at least one request'

        if (service.actions && service.requests) {
            const actions = Object.keys(service.actions)
            Object.keys(service.requests).forEach(request => {
                if (actions.indexOf(request) >= 0) throw `Store: conflicting keys in requests and actions for service ${service.name}`
            })
        }

        if (this.debug) console.debug(`registering service ${service.name} in store`)
        this.services[service.name] = service
    }

    addEvent (event, callback) {
        // check for existing event, we don't allow duplicate events
        const exists = this.events.some(listener => {
            // if event listener don't have same types, it's definitely not a match
            if (typeof event !== typeof listener.event) return false
            switch (typeof event) {
                case 'string':
                    return listener.event.toLowerCase() === event.toLowerCase()
                default:
                    return JSON.stringify(listener.event).toLowerCase() === JSON.stringify(event).toLowerCase()
            }

        })
        if (!exists) {
            if (this.debug) console.debug('registering event listener in store:', event)
            this.events.push({
                event,
                callback
            })

            this.emitter.addListener(event, this._eventListener)
        } else if (this.debug) {
            console.debug('can\'t add event listener to store, event listener already exists')
        }
    }



    emit (event, data) {
        if (this.debug) {
            let debugEvent = typeof event === 'string' && event || JSON.stringify(event)
            console.debug(`emitting event ${debugEvent}:`, {
                message: data.message
            })
        }
        this.emitter.emit(event, data)
    }

    getListener (payload) {
        const listeners = this.events.filter(listener => {
            let event = listener.event
            switch (typeof event) {
                case 'string':
                    if (event === payload) {
                        listener.values = this._toValueObject([payload])
                        return listener
                    }
                    // fix json-path listener format if necessary
                    if (event.indexOf('$.') !== 0) event = `$..${event}`
                    const strMatches = JSONPath({ path: event, json: payload })
                    if (strMatches.length) {
                        listener.values = this._toValueObject(strMatches)
                        return listener
                    }
                    return false
                default:
                    const patternWithWildcards = this._processWildcards(event);
                    const objMatches = JSONFilter(payload, patternWithWildcards)
                    if (objMatches.length) {
                        listener.values = objMatches
                        return listener
                    }
                    return false
            }
        })


        if (this.debug) console.debug('returning matching listener:', listeners.length)
        return listeners
    }

    getService (serviceId) {
        return this.services[serviceId] || false
    }

    async _eventListener ({ callback, values, message, context }) {
        context = context || {}
        const res = context.execution && context.execution.res;

        const opt = {
            message: message || {},
            context: context,
            values: values,
            done: (res && res.send.bind(res)) || (() => {})
        }
        
        try {
            await callback(opt)
        } catch (err) {
            if (this.debug) console.log(err)
            // If an HTTP response object exists and we haven't already sent a response, send an error.
            if (res && !res.headersSent) {
                res.status(400).send()
            }
        }
    }

    _processWildcards(pattern) {
        if (pattern === null || typeof pattern !== 'object') {
            return pattern;
        }

        const newPattern = Array.isArray(pattern) ? [] : {};

        for (const key in pattern) {
            if (Object.prototype.hasOwnProperty.call(pattern, key)) {
                const value = pattern[key];
                if (value === '*') {
                    newPattern[key] = /.*/s; // Match any value, including newlines
                } else if (typeof value === 'object') {
                    newPattern[key] = this._processWildcards(value); // Recurse
                } else {
                    newPattern[key] = value;
                }
            }
        }
        return newPattern;
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