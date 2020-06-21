const Store = require("../src/store")

test("it should store events", () => {
    const store = new Store()

    store.addEvent('test', () => { })
    store.addEvent({ test: 'test' }, () => { })

    expect(store.events.length).toBe(2)
})

test("it should not store duplicate events", () => {
    const store = new Store()

    store.addEvent('test', () => { })
    store.addEvent('test', () => { })
    store.addEvent({ test: 'test' }, () => { })
    store.addEvent({ test: 'test' }, () => { })

    expect(store.events.length).toBe(2)
})

test("it should store cron string schedulers", () => {
    const store = new Store()

    store.addScheduler('test', '* * * * * *')
    store.addScheduler({ test: 'test' }, '* * * * * *')

    expect(store.getSchedulers().length).toBe(2)
})

test("it should store cron object schedulers", () => {
    const store = new Store()

    store.addScheduler('test', { second: 1 })
    store.addScheduler({ test: 'test' }, { month: 1 })

    expect(store.getSchedulers().length).toBe(2)
})

test("it should not store duplicate schedulers", () => {
    const store = new Store()

    store.addScheduler('test', '* * * * * *')
    store.addScheduler('test', '* * * * * *')
    store.addScheduler({ test: 'test' }, '* * * * * *')
    store.addScheduler({ test: 'test' }, '* * * * * *')

    expect(store.getSchedulers().length).toBe(2)
})

test("it should log an error for invalid schedulers", () => {
    const store = new Store()
    const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => { });

    store.addScheduler('test', 'not valid')

    expect(consoleSpy).toBeCalledTimes(1)
})

test("it should get the correct listener", () => {
    const store = new Store()

    store.addEvent('test', () => { })
    store.addEvent({ test: 'test' }, () => { })

    const listeners = store.getListener({ payload: { test: 'test' } })

    expect(listeners.length).toBe(2)
})

test("it should call callback fn on emit", () => {
    const store = new Store()
    const callback = jest.fn()

    store.addEvent('test', callback)
    const listeners = store.getListener({ payload: { test: 'test' } })

    expect(listeners.length).toBe(1)

    listeners.forEach(listener => {
        store.emit(listener.event, {
            callback: listener.callback,
            values: listener.values,
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

    expect(() => {
        store.addService({ name: 'test', requests: { test: {} }, actions: { test: {} } })
    }).toThrow('Store: conflicting keys in requests and actions for service test')
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