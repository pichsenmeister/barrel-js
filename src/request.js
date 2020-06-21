const qs = require('qs');

class Request {

    constructor(service, request, ...args) {
        const opt = request(...args)

        if ((service.urlencoded || opt.urlencoded) && opt.data) opt.data = qs.stringify(opt.data)

        opt.headers = service.headers || {}
        if (service.bearer) {
            opt.headers['Authorization'] = `Bearer ${service.bearer}`
        }
        // request config overrides service config
        if (opt.bearer) {
            opt.headers['Authorization'] = `Bearer ${opt.bearer}`
        }

        if (service.basic) {
            opt.headers['Authorization'] = 'Basic ' + this._base64(`${service.basic.username}:${service.basic.password}`)
        }
        // request config overrides service config
        if (opt.basic) {
            opt.headers['Authorization'] = 'Basic ' + this._base64(`${opt.basic.username}:${opt.basic.password}`)
        }

        delete opt.bearer
        delete opt.basic
        delete opt.urlencoded

        return opt
    }

    _base64 (data) {
        return Buffer.from(data).toString('base64')
    }
}

module.exports = Request