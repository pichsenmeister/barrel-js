const Barrel = require('../src/app.js')
const services = require('./services')
const barrel = new Barrel({
    debug: true
})

barrel.registerAll(services)
//barrel.register('weather', services.weather)

barrel.on({ ok: true }, async ({ context, ack }) => {
    console.log('on test is called', context)
    ack()

    barrel.call('weather', {
        city: 'london'
    })
})

barrel.on('main', async ({ context }) => {
    console.log('on weather is called', context)
})

barrel.start()