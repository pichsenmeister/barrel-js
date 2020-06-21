module.exports = [
    {
        name: 'weather',
        requests: {
            search: (city) => ({
                method: 'GET',
                url: 'https://www.metaweather.com/api/location/search',
                params: {
                    city: city
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
            post: (city, temperature) => ({
                method: 'POST',
                url: `https://hooks.slack.com/services/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`,
                data: {
                    text: `The weather in ${city} is currently ${temperature}°C.`
                }
            })
        }

    }
]