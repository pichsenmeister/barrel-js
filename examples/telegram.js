require('dotenv').config()

const Barrel = require('@barreljs/core')
const telegram = require('@barreljs/telegram')

const barrel = new Barrel()
barrel.registerAll(telegram.services)

barrel.on(telegram.patterns.message, async ({ values, done }) => {
    const message = values.first()
    await barrel.call('telegram.sendMessage', process.env.TOKEN, message.chat.id, message.text)
    done()
})

barrel.error((err) => {
    console.log(err)
})

barrel.start(async () => {
    const setup = await barrel.call('telegram.setup', process.env.TOKEN, process.env.WEBHOOK)
    console.log(setup)
    const me = await barrel.call('telegram.apiCall', 'getMe', process.env.TOKEN)
    console.log(me.result)
})