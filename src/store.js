const events = require('events')
const emitter = new events.EventEmitter()

const { filter } = require('./utils/filter')
const { match } = require('./utils/match')

class Store {

    constructor(config) {
        config = config || {}
        this.debug = config.debug || false
        this.events = []
        this.services = {}
    }

    addEvent (event, callback) {
        // check for existing event, we don't allow duplicate events
        let exists = this.events.some(listener => {
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

            emitter.addListener(event, this.eventListener)
        } else if (this.debug) console.debug('can\'t add event listener to store, event listener already exists')
    }

    addService (serviceId, config) {
        if (this.debug) console.debug(`registering service ${serviceId} in store:`, config)
        this.services[serviceId] = config
    }

    emit (event, context) {
        if (this.debug) {
            let debugEvent = typeof event === 'string' && event || JSON.stringify(event)
            console.debug(`emitting event ${debugEvent}:`, {
                body: context.body
            })
        }
        emitter.emit(event, context)
    }

    getListener (payload) {
        let tmpListener = {}
        let hasMatch = this.events.some(listener => {
            switch (typeof listener.event) {
                case 'string':
                    let filters = filter(payload, listener.event)
                    if (filters.length) {
                        listener.context = filters[0]
                        listener.matches = filters
                        tmpListener = listener
                        return true
                    }
                    return false
                default:
                    let matches = match(payload, listener.event)
                    if (matches.length) {
                        listener.context = matches[0]
                        listener.matches = matches
                        tmpListener = listener
                        return true
                    }
                    return false
            }
        })

        // if there are any results, there can only be one match
        if (hasMatch) {
            if (this.debug) console.debug('returning matching listener:', tmpListener)
            return tmpListener
        }
        if (this.debug) console.debug('no matching listeners found for:', payload)
        return false
    }

    getService (serviceId) {
        return this.services[serviceId] || false
    }

    eventListener (context) {
        let opt = {
            context: context.context,
            matches: context.matches,
            body: context.body,
        }
        if (context.req) {
            opt.req = context.req
        }
        if (context.res) {
            opt.res = context.res
            opt.ack = context.res.send.bind(context.res)
        }
        context.callback(opt)
    }

}

module.exports = Store