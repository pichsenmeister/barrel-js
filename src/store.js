const events = require('events')
const { JSONPath } = require('jsonpath-plus')
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

    addEvent (event, callback, type) {
        // check for existing event, we don't allow duplicate events
        let exists = this.events.some(listener => {
            // if event listener don't have same types, it's definitely not a match
            if (typeof event !== typeof listener.event) return false
            switch (typeof event) {
                case 'string':
                    return listener.type === type && listener.event.toLowerCase() === event.toLowerCase()
                default:
                    return listener.type === type && JSON.stringify(listener.event).toLowerCase() === JSON.stringify(event).toLowerCase()
            }

        })
        if (!exists) {
            if (this.debug) console.debug('registering event listener in store:', event)
            this.events.push({
                event,
                callback,
                type
            })

            console.log(this.events)

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

    getListener (payload, type) {
        // let matches = this.events.filter(listener => {
        //     switch (typeof listener.event) {
        //         case 'string':
        //             let context = JSONPath({ path: listener.event, json: payload })
        //             if (context.length) {
        //                 listener.context = context[0]
        //                 listener.matches = context
        //             }
        //             break
        //         case 'object':
        //             let objMatches = match(payload, listener.event)
        //             if (objMatches.length) {
        //                 listener.context = objMatches[0]
        //                 listener.matches = objMatches
        //                 return true
        //             }
        //             break
        //     }

        //     if (listener.context) {
        //         return listener
        //     }
        //     return false
        // })

        let tmpListener = {}
        let hasMatch = this.events.some(listener => {
            console.log(listener.type)
            console.log(type)
            if (listener.type !== type) return false
            switch (typeof listener.event) {
                case 'string':
                    let strMatches = JSONPath({ path: listener.event, json: payload })
                    if (strMatches.length) {
                        listener.context = strMatches[0]
                        listener.matches = strMatches
                        tmpListener = listener
                        return true
                    }
                    return false
                default:
                    let objMatches = match(payload, listener.event)
                    if (objMatches.length) {
                        listener.context = objMatches[0]
                        listener.matches = objMatches
                        tmpListener = listener
                        return true
                    }
                    return false
            }
        })

        // if there are any results, there can only be one match
        // if (matches.length) {
        //     if (this.debug) console.debug('returning matching listener:', matches)
        //     return matches
        // }
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
        if (context.result) {
            opt.result = context.result
        }
        if (context.data) {
            opt.data = context.data
        }

        context.callback(opt)
    }

}

module.exports = Store