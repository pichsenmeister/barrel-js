const events = require('events')
const { JSONPath } = require('jsonpath-plus')
const JSONFilter = require('@barreljs/json-filter')
const cronParser = require('cron-parser')

class Store {

    constructor(config) {
        config = config || {}
        this.debug = config.debug || false
        this.events = []
        this.schedulers = []
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

    addScheduler (event, timer) {
        const exists = this.schedulers.some(scheduler => {
            if (typeof event !== typeof scheduler.event) return false
            switch (typeof event) {
                case 'string':
                    return scheduler.event.toLowerCase() === event.toLowerCase()
                default:
                    return JSON.stringify(scheduler.event).toLowerCase() === JSON.stringify(event).toLowerCase()
            }
        })
        if (!exists) {
            if (typeof timer === 'object') timer = this._parseTimerObject(timer)
            try {
                cronParser.parseExpression(timer)
                if (this.debug) console.debug('registering scheduler in store:', event)
                this.schedulers.push({
                    event,
                    timer
                })
            } catch (err) {
                console.error('Error: ' + err.message);
                return false
            }

        }
        else if (this.debug) {
            console.debug('can\'t add scheduler to store, scheduler already exists')
        }
    }

    emit (event, data) {
        if (this.debug) {
            let debugEvent = typeof event === 'string' && event || JSON.stringify(event)
            console.debug(`emitting event ${debugEvent}:`, {
                body: data.body
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
                        listener.data = {
                            values: [payload],
                            firstValue: payload,
                            lastValue: payload
                        }
                        return listener
                    }
                    // fix json-path listener format if necessary
                    if (event.indexOf('$.') !== 0) event = `$..${event}`
                    const strMatches = JSONPath({ path: event, json: payload })
                    if (strMatches.length) {
                        listener.data = {
                            values: strMatches,
                            firstValue: strMatches[0],
                            lastValue: strMatches[strMatches.length - 1]
                        }
                        return listener
                    }
                    return false
                default:
                    const objMatches = JSONFilter(payload, event)
                    if (objMatches.length) {
                        listener.data = {
                            values: objMatches.all(),
                            firstValue: objMatches.first(),
                            lastValue: objMatches.last()
                        }
                        return listener
                    }
                    return false
            }
        })

        if (listeners.length) {
            if (this.debug) console.debug('returning matching listener:', listeners.length)
            return listeners
        }
        if (this.debug) console.debug('no matching listeners found for:', payload)
        return false
    }

    getService (serviceId) {
        return this.services[serviceId] || false
    }

    getSchedulers () {
        return this.schedulers
    }

    async _eventListener (context) {
        let opt = {}
        if (context.body) {
            opt.body = context.body
        }
        for (const property in context.data) {
            opt[property] = context.data[property]
        }
        if (context.req) {
            opt.req = context.req
        }
        if (context.res) {
            opt.res = context.res
            opt.ack = context.res.send.bind(context.res)
        } else {
            opt.ack = () => { return true }
        }

        return context.callback(opt)
    }

    _parseTimerObject (timer) {
        return [
            timer.second || '*',
            timer.minute || '*',
            timer.hour || '*',
            timer.dayOfMonth || '*',
            timer.month || '*',
            timer.dayOfWeek || '*',
        ].join(' ')
    }

}

module.exports = Store