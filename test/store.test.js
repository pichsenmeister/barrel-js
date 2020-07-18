const Store = require("../src/store")

test("it should store events", () => {
    const store = new Store()

    store.addEvent({ pattern: 'test' }, () => { })
    store.addEvent({ pattern: { test: 'test' } }, () => { })

    expect(store.events.length).toBe(2)
})

test("it should not store duplicate events", () => {
    const store = new Store()

    store.addEvent({ pattern: 'test' }, () => { })
    store.addEvent({ pattern: 'test' }, () => { })
    store.addEvent({ pattern: { test: 'test' } }, () => { })
    store.addEvent({ pattern: { test: 'test' } }, () => { })

    expect(store.events.length).toBe(2)
})

test("it should set trim to true for events by default", () => {
    const store = new Store()

    store.addEvent({ pattern: 'test' }, () => { })

    expect(store.events.length).toBe(1)
    expect(store.events[0].trim).toBe(true)
})

test("it should set trim to false if set for events", () => {
    const store = new Store()

    store.addEvent({ pattern: 'test', trim: false }, () => { })

    expect(store.events.length).toBe(1)
    expect(store.events[0].trim).toBe(false)
})

test("it should get the correct listener", () => {
    const store = new Store()

    store.addEvent({ pattern: 'test' }, () => { })
    store.addEvent({ pattern: { test: 'test' } }, () => { })

    const listeners = store.getListener({ payload: { test: 'test' } })

    expect(listeners.length).toBe(2)
})

test("it should call callback fn on emit", () => {
    const store = new Store()
    const callback = jest.fn()

    store.addEvent({ pattern: 'test' }, callback)
    const listeners = store.getListener({ payload: { test: 'test' } })

    expect(listeners.length).toBe(1)

    listeners.forEach(event => {
        store.emit(event.pattern, {
            callback: event.callback,
            values: event.values,
        })
    })

    expect(callback).toBeCalledTimes(1)
})

test("it should throw an error if a service is malformed", () => {
    const store = new Store()

    expect(() => {
        store.addService({})
    }).toThrow('Store: service name is required')

    expect(() => {
        store.addService({ name: 'test' })
    }).toThrow('Store: service actions or requests are required')

    expect(() => {
        store.addService({ name: 'test', actions: {} })
    }).toThrow('Store: service actions needs at least one action')

    expect(() => {
        store.addService({ name: 'test', requests: {} })
    }).toThrow('Store: service requests needs at least one request')
})

test("it should register a service", () => {
    const store = new Store()
    const mockService = {
        name: 'test',
        actions: {
            test: () => { },
        }
    }

    store.addService(mockService)

    expect(Object.keys(store.services).length).toBe(1)
})

test("it should get a registered service", () => {
    const store = new Store()
    const mockService = {
        name: 'test',
        actions: {
            test: () => { },
        }
    }

    store.addService(mockService)
    const service = store.getService('test')

    expect(service.name).toBe('test')
})

test("it should throw an error if a plugin is malformed", () => {
    const store = new Store()

    expect(() => {
        store.addPlugin({})
    }).toThrow('Plugin: plugin name is required')

    expect(() => {
        store.addPlugin({ name: 'test' })
    }).toThrow('Plugin: plugin functions needs at least one function')

    expect(() => {
        store.addPlugin({ name: 'test', functions: {} })
    }).toThrow('Plugin: plugin functions needs at least one function')
})

test("it should register a plugin", () => {
    const store = new Store()
    const mockPlugin = {
        name: 'plugin',
        functions: {
            test: () => { },
        }
    }

    store.addPlugin(mockPlugin)

    expect(Object.keys(store.plugins).length).toBe(1)
})

test("it should get a registered plugin", () => {
    const store = new Store()
    const mockPlugin = {
        name: 'plugin',
        functions: {
            test: () => { },
        }
    }

    store.addPlugin(mockPlugin)
    const plugin = store.getPlugin('plugin')

    expect(plugin.name).toBe('plugin')
})