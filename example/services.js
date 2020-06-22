module.exports = [
    {
        name: 'weather',
        requests: {
            search: (city) => ({
                method: 'GET',
                url: 'https://www.metaweather.com/api/location/search',
                params: {
                    query: city
                }
            }),
            get: (id) => ({
                method: 'GET',
                url: `https://www.metaweather.com/api/location/${id}`
            })
        }

    },
    {
        name: 'slack',
        requests: {
            post: (temperature) => ({
                method: 'POST',
                url: `https://hooks.slack.com/services/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`,
                data: {
                    text: `The temperature is currently ${temperature}°C.`
                }
            })
        }

    }
]