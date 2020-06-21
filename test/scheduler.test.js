const Store = require("../src/store")
const Scheduler = require("../src/scheduler")

test("it should throw an exception if no store is passed", () => {
    expect(() => {
        new Scheduler()
    }).toThrow('Scheduler: missing store')
})

test("it should run a scheduler", () => {
    const store = new Store()
    store.addScheduler('test', '* * * * * *')
    const scheduler = new Scheduler(store)
    scheduler._trigger = jest.fn()

    scheduler.run()

    expect(scheduler._trigger).toBeCalledTimes(1)
})
