const Barrel = require("../src/app")
const express = require('express')
const cron = require('node-cron')

// We mock the node-cron library to control its behavior in our tests
jest.mock('node-cron')

describe('Barrel Configuration', () => {
    test("it should use default config", () => {
        const barrel = new Barrel()
        expect(barrel.config.port).toBe(3141)
        expect(barrel.config.route).toBe('/barrel')
        expect(barrel.config.method).toBe('post')
        expect(barrel.config.middlewares.length).toBe(0)
        expect(barrel.config.debug).toBe(false)

        expect(barrel.config.bodyParser.toString()).toBe(express.json().toString())
    })

    test("it should apply given config", () => {
        const barrel = new Barrel({
            port: 1772,
            route: '/test',
            method: 'GET',
            debug: true,
            bodyParser: express.urlencoded({ extended: false })
        })

        expect(barrel.config.port).toBe(1772)
        expect(barrel.config.route).toBe('/test')
        expect(barrel.config.method).toBe('get')
        expect(barrel.config.middlewares.length).toBe(0)
        expect(barrel.config.debug).toBe(true)

        expect(barrel.config.bodyParser.toString()).toBe(express.urlencoded({ extended: false }).toString())
    })
})

describe('Barrel Event System', () => {
    // This global error handler will catch any unexpected errors from listeners
    // and fail the test, making debugging much easier.
    let barrel;
    beforeEach(() => {
        barrel = new Barrel();
        barrel.error(err => { throw err; });
    });

    test("it should not trigger an event listener if there's none", () => {
        const barrel = new Barrel()
        const callback = jest.fn()

        barrel.dispatch({ test: true })

        expect(callback).toHaveBeenCalledTimes(0)
    })

    test("it should trigger an event listener", () => {
        const callback = jest.fn()

        barrel.on('test', callback)

        barrel.dispatch({ test: true })

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should listen to an event on an incoming request", () => {
        const callback = jest.fn()

        barrel.on('test', callback)

        barrel._router({
            body: { test: true }
        })

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should trigger a listener with a matching JSON object pattern", () => {
        const callback = jest.fn()

        barrel.on({ user: { role: 'admin' } }, callback)
        barrel.dispatch({ user: { name: 'David', role: 'admin' }, timestamp: 12345 })

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should trigger a listener with a JSON object pattern using regex", () => {
        const callback = jest.fn()

        // Match any message containing 'error' case-insensitively
        barrel.on({ status: /error/i }, callback)
        barrel.dispatch({ status: 'FATAL_ERROR', code: 500 })

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should trigger a listener with a JSONPath string pattern", () => {
        const callback = jest.fn()

        // Match any message with a 'books' array containing an item with a price less than 10
        barrel.on('$.books[?(@.price < 10)]', callback)
        barrel.dispatch({
            store: 'Main St',
            books: [
                { title: 'Book A', price: 12.99 },
                { title: 'Book B', price: 9.99 }
            ]
        })
        expect(callback).toHaveBeenCalledTimes(1)
    })

     test("it should trigger a listener using a wildcard", () => {
        const callback = jest.fn()

        // Match any message
        barrel.on('*', callback)
        barrel.dispatch({ user: { name: 'David', role: 'admin' } })

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should trigger a listener with a JSON object pattern using a wildcard for an object", () => {
        const callback = jest.fn()

        // Match any message with a user object
        barrel.on({ user: '*' }, callback)
        barrel.dispatch({ user: { name: 'David', role: 'admin' } })

        expect(callback).toHaveBeenCalledTimes(1)
    })

     test("it should trigger a listener with a JSON object pattern using a wildcard for a value", () => {
        const callback = jest.fn()

        // Match any message with a user object that has any role
        barrel.on({ user: { role: '*' } }, callback)
        barrel.dispatch({ user: { name: 'David', role: 'admin' } })

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should call the global error handler when a listener throws an error", () => {
        const errorCallback = jest.fn()
        const failingCallback = jest.fn().mockImplementation(() => {
            throw new Error('Listener failed!');
        })

        barrel.error(errorCallback)
        barrel.on({ fail: true }, failingCallback)
        barrel.dispatch({ fail: true })

        expect(failingCallback).toHaveBeenCalledTimes(1)
        expect(errorCallback).toHaveBeenCalledTimes(1)
        expect(errorCallback).toHaveBeenCalledWith(new Error('Listener failed!'))
    })

    test("it should provide the matched value for JSON object patterns", () => {
        const payload = { user: { role: 'admin', name: 'David' } };
        const callback = jest.fn(({ values }) => {
            expect(values.first().role).toBe('admin');
            expect(values.first().name).toBe('David');
        });

        barrel.on({ role: '*' }, callback);
        barrel.dispatch(payload);

        expect(callback).toHaveBeenCalledTimes(1);
    });

    test("it should provide an the matched value for JSONPath patterns", () => {
        const payload = { books: [{ title: 'A', price: 20 }, { title: 'B', price: 5 }] };
        const callback = jest.fn(({ values }) => {
            expect(values.first()).toEqual(payload.books[1]);
        });

        barrel.on('$.books[?(@.price < 10)]', callback);
        barrel.dispatch(payload);

        expect(callback).toHaveBeenCalledTimes(1);
    });
})

describe('Barrel Service Layer', () => {
    let barrel;
    beforeEach(() => {
        barrel = new Barrel();
        barrel.error(err => { throw err; });
    });

    test("it should execute a service action", async () => {
        const callback = jest.fn()

        const mockService = {
            name: 'test',
            actions: {
                test: callback
            }
        }

        barrel.register(mockService)
        await barrel.act('test.test')

        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should execute a service action with the right arguments", async () => {
        const callback = jest.fn()

        const mockService = {
            name: 'test',
            actions: {
                test: ({ arg1, arg2, callback }) => {
                    expect(arg1).toBe(1)
                    expect(arg2).toBe(2)
                    callback()
                }
            }
        }

        barrel.register(mockService)
        await barrel.act('test.test', { arg1: 1, arg2: 2, callback: callback })
        expect(callback).toHaveBeenCalledTimes(1)
    })

    test("it should trigger error callback on error", async () => {
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

        expect(callback).toHaveBeenCalledTimes(1)
    })
})

describe('Barrel Scheduler', () => {
    let barrel
    let errorCallback

    beforeEach(() => {
        // Reset mocks and create a new Barrel instance before each test
        jest.clearAllMocks()
        barrel = new Barrel({ debug: false })
        errorCallback = jest.fn()
        barrel.error(errorCallback)
    })

    it('should schedule a task with a valid cron pattern', () => {
        const task = jest.fn()
        const cronTime = '* * * * *'

        // Mock cron.validate to return true for this test
        cron.validate.mockReturnValue(true)

        barrel.schedule(cronTime, task)

        expect(cron.validate).toHaveBeenCalledWith(cronTime)
        expect(cron.schedule).toHaveBeenCalledTimes(1)
        expect(cron.schedule).toHaveBeenCalledWith(cronTime, expect.any(Function))
    })

    it('should not schedule a task with an invalid cron pattern and should call the error handler', () => {
        const task = jest.fn()
        const invalidCronTime = 'invalid-pattern'

        // Mock cron.validate to return false
        cron.validate.mockReturnValue(false)

        barrel.schedule(invalidCronTime, task)

        expect(cron.validate).toHaveBeenCalledWith(invalidCronTime)
        expect(cron.schedule).not.toHaveBeenCalled()
        expect(errorCallback).toHaveBeenCalledTimes(1)
        expect(errorCallback).toHaveBeenCalledWith(new Error(`Invalid cron pattern: ${invalidCronTime}`))
    })

    it('should execute the scheduled task when the cron job runs', async () => {
        const task = jest.fn()
        const cronTime = '* * * * *'
        cron.validate.mockReturnValue(true)

        barrel.schedule(cronTime, task)

        // cron.schedule is called with a function. We retrieve that function to test it.
        const scheduledFunction = cron.schedule.mock.calls[0][1]
        await scheduledFunction()

        expect(task).toHaveBeenCalledTimes(1)
    })

    it('should catch errors from the executed task and call the error handler', async () => {
        const error = new Error('Task failed!')
        const failingTask = jest.fn().mockRejectedValue(error)
        const cronTime = '* * * * *'
        cron.validate.mockReturnValue(true)

        barrel.schedule(cronTime, failingTask)

        const scheduledFunction = cron.schedule.mock.calls[0][1]
        await scheduledFunction()

        expect(failingTask).toHaveBeenCalledTimes(1)
        expect(errorCallback).toHaveBeenCalledTimes(1)
        expect(errorCallback).toHaveBeenCalledWith(error)
    })

    it('should stop all scheduled jobs on server close', () => {
        const stopJobMock = jest.fn()
        cron.validate.mockReturnValue(true)
        cron.schedule.mockReturnValue({ stop: stopJobMock })
        barrel.schedule('* * * * *', () => { })
        const server = barrel.start(() => { })
        server.close()
        expect(stopJobMock).toHaveBeenCalledTimes(1)
    })
})
