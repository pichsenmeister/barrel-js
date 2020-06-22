const Barrel = require('../src/app.js')
const services = require('./services')
const barrel = new Barrel({
    debug: false,
    method: 'get',
    scheduler: {
        mode: 'http'
    }
})

barrel.registerAll(services)

barrel.on('city', async ({ firstValue, ack }) => {
    console.log('on city is called', firstValue)
    const result = await barrel.call('weather.search', firstValue)

    barrel.trigger(result)
    ack()
})

barrel.on('[0].woeid', async ({ firstValue, ack, context }) => {
    console.log('on woeid is called', firstValue)
    const result = await barrel.call('weather.get', firstValue)

    barrel.trigger(result, context)
    ack()
})

barrel.on('consolidated_weather[0].the_temp', async ({ firstValue, ack, context }) => {
    await barrel.call('slack.post', firstValue)
    ack()
})


barrel.error((err) => {
    console.error(err)
})

barrel.start()