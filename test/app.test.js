const Barrel = require("../src/app")
const bodyParser = require('body-parser')

test("it should use default config", () => {
    const barrel = new Barrel()

    expect(barrel.config.port).toBe(5000)
    expect(barrel.config.route).toBe('/barrel')
    expect(barrel.config.method).toBe('post')
    expect(barrel.config.middlewares.length).toBe(0)
    expect(barrel.config.logLevel).toBe('PROD')

    expect(barrel.config.bodyParser.toString()).toBe(bodyParser.json().toString())
})

test("it should apply given config", () => {
    const barrel = new Barrel({
        port: 3000,
        route: '/test',
        method: 'GET',
        logLevel: 'DEBUG',
        bodyParser: bodyParser.urlencoded({ extended: false })
    })

    expect(barrel.config.port).toBe(3000)
    expect(barrel.config.route).toBe('/test')
    expect(barrel.config.method).toBe('get')
    expect(barrel.config.middlewares.length).toBe(0)
    expect(barrel.config.logLevel).toBe('DEBUG')

    expect(barrel.config.bodyParser.toString()).toBe(bodyParser.urlencoded({ extended: false }).toString())
})

test("it should not trigger an event listener if there's none", () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    barrel.dispatch({ test: true })

    expect(callback).toBeCalledTimes(0)
})

test("it should trigger an event listener", () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    barrel.on('test', callback)

    barrel.dispatch({ test: true })

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

test("it should execute a service action", async () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    const mockService = {
        name: 'test',
        actions: {
            test: callback
        }
    }

    barrel.register(mockService)
    await barrel.act('test.test')

    expect(callback).toBeCalledTimes(1)
})

test("it should execute a service action with the right arguments", async () => {
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
    await barrel.act('test.test', 1, 2, callback)

    expect(callback).toBeCalledTimes(1)
})

test("it should add a plugin's function", async () => {
    const barrel = new Barrel()
    const callback = jest.fn()

    const mockPlugin = {
        name: 'plugin',
        functions: {
            test: callback
        }
    }

    barrel.plugin(mockPlugin)
    await barrel.test()

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





