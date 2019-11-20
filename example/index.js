const Barrel = require('../src/app.js')
const services = require('./services')
const barrel = new Barrel({
    debug: true
})

barrel.registerAll(services)
//barrel.register('weather', services.weather)

barrel.on('$.city[?(@name===\'london\')]', async ({ context, ack }) => {
    console.log('on test is called', context)
    ack()

    barrel.call('weather', {
        city: context
    })
})

barrel.on('$.main.temp', async ({ context }) => {
    console.log('on weather is called', context)
})

barrel.start()