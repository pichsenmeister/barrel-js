const Barrel = require("../src/app")
const bodyParser = require('body-parser')

test("it should use default config", () => {
    const barrel = new Barrel()

    expect(barrel.config.port).toBe(3141)
    expect(barrel.config.route).toBe('/barrel')
    expect(barrel.config.method).toBe('post')
    expect(barrel.config.middlewares.length).toBe(0)
    expect(barrel.config.debug).toBe(false)

    expect(barrel.config.bodyParser.toString()).toBe(bodyParser.json().toString())
})

test("it should apply given config", () => {
    const barrel = new Barrel({
        port: 1772,
        route: '/test',
        method: 'GET',
        debug: true,
        bodyParser: bodyParser.urlencoded({ extended: false })
    })

    expect(barrel.config.port).toBe(1772)
    expect(barrel.config.route).toBe('/test')
    expect(barrel.config.method).toBe('get')
    expect(barrel.config.middlewares.length).toBe(0)
    expect(barrel.config.debug).toBe(true)

    expect(barrel.config.bodyParser.toString()).toBe(bodyParser.urlencoded({ extended: false }).toString())
})

test("it should not trigger an event listener if there's none", () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    barrel.trigger({ test: true })

    expect(callback).toBeCalledTimes(0)
})

test("it should trigger an event listener", () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    barrel.on('test', callback)

    barrel.trigger({ test: true })

    expect(callback).toBeCalledTimes(1)
})

test("it should listen to an event on an incoming request", () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    barrel.on('test', callback)

    barrel._router({
        body: { test: true }
    })

    expect(callback).toBeCalledTimes(1)
})

test("it should call a service", async () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    const mockService = {
        name: 'test',
        actions: {
            test: callback
        }
    }

    barrel.register(mockService)
    await barrel.call('test.test')

    expect(callback).toBeCalledTimes(1)
})

test("it should call a service with the right arguments", async () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    const mockService = {
        name: 'test',
        actions: {
            test: (arg1, arg2, callback) => {
                expect(arg1).toBe(1)
                expect(arg2).toBe(2)
                callback()
            }
        }
    }

    barrel.register(mockService)
    await barrel.call('test.test', 1, 2, callback)

    expect(callback).toBeCalledTimes(1)
})

test("it should trigger error callback on error", async () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    const mockService = {
        name: 'test',
        requests: {
            test: () => {
                throw 'exception'
            }
        }
    }

    barrel.register(mockService)
    barrel.error(callback)

    await barrel.call('test.test')

    expect(callback).toBeCalledTimes(1)
})





