module.exports = {
    weather: {
        search: context => ({
            method: 'GET',
            url: `https://www.metaweather.com/api/location/search/?query=${context.city}`
        }),
        get: context => ({
            method: 'GET',
            url: `https://www.metaweather.com/api/location/${context.id}`
        }),
    },
    slack: {
        post: context => ({
            method: 'POST',
            url: `https://hooks.slack.com/services/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`,
            body: context => {
                return {
                    text: `The weather in ${context.city} is currently ${context.temperature}°C.`
                }
            }
        })
    }
}