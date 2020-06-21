const Barrel = require('../src/app.js')
const services = require('./services')
const barrel = new Barrel({
    debug: true,
    method: 'get',
    scheduler: {
        mode: 'http'
    }
})

barrel.registerAll(services)
//barrel.register('weather.search', services.weather.search)
barrel.schedule('trigger:ping', '* * * * * *')

barrel.on('city', async ({ firstValue, ack }) => {
    console.log('on city is called', firstValue)
    const result = await barrel.call('weather.search', {
        city: firstValue
    })

    barrel.trigger(result)
    ack()
})

barrel.on('[0].woeid', async ({ firstValue, ack }) => {
    console.log('on woeid is called', firstValue)
    const result = await barrel.call('weather.get', {
        id: firstValue
    })

    barrel.trigger(result)
    ack()
})

barrel.on('consolidated_weather[0].the_temp', async ({ firstValue, ack }) => {
    console.log('on weather is called', firstValue)
    // const result = await barrel.call('slack.post', {
    //     city: firstValue
    // })

    // barrel.trigger(result)
    ack()
})

barrel.on('trigger:ping', async ({ values }) => {
    console.log(values)
})

barrel.error((err) => {
    console.error(err)
})

barrel.start()