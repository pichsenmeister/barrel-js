const cronParser = require('cron-parser')

let _self;

class Scheduler {

    constructor(store, config) {
        this.config = config || {}
        this.config.scheduler = this.config.scheduler || {
            mode: 'system'
        }
        if (!store) throw 'Scheduler: missing store'
        this.store = store
        _self = this
    }

    start () {
        switch (this.config.scheduler.mode) {
            case 'system':
                setInterval(this.run, 1000)
                break
            case 'http':
                this.config.scheduler.app[this.config.scheduler.method](this.config.scheduler.route, this.run)
                console.log(`🛢️ Your scheduler is running on http://localhost:${this.config.scheduler.port}${this.config.scheduler.route}`)
        }
    }

    run (_req, res) {
        const schedulers = _self.store.getSchedulers()

        schedulers.forEach(scheduler => {
            const interval = cronParser.parseExpression(scheduler.timer)
            const now = Math.ceil(Date.now() / 1000)
            const time = interval.next().getTime()
            if (now === (time / 1000)) {
                _self._trigger(scheduler.event)
            }
        })

        if (_self.config.scheduler.mode === 'http') {
            return res.send({ run: Math.ceil((Date.now()) / 1000) })
        }
    }

    _trigger (event) {
        const listeners = this.store.getListener(event)
        if (!listeners.length) {
            if (this.config.debug) console.debug('no matching listener registered for scheduled trigger')
            return false
        }
        listeners.forEach(listener => {
            _self.store.emit(listener.event, {
                callback: listener.callback,
                data: listener.data
            })
        })
    }

}

module.exports = Scheduler