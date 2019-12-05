const Barrel = require('../src/app.js')
const services = require('./services')
const barrel = new Barrel({
    debug: false
})

barrel.registerAll(services)
//barrel.register('weather', services.weather)

barrel.on('city', async ({ context, ack }) => {
    console.log('on city is called', context)
    ack()

    barrel.call('weatherSearch', {
        city: context
    })
})

barrel.onRes('[0].woeid', async ({ result, context }) => {
    console.log('on woeid is called', context)

    barrel.call('weather', {
        id: result
    }, context)
})

barrel.onRes('consolidated_weather[0].the_temp', async ({ result, data }) => {
    console.log('on weather is called', result)

    barrel.call('slack', {
        city: data.city,
        temperature: result
    })
})

barrel.start()