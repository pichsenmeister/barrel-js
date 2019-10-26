module.exports = {
    weather: context => ({
        method: 'GET',
        url: `https://samples.openweathermap.org/data/2.5/weather?q=${context.city},uk&appid=b6907d289e10d714a6e88b30761fae22`
    })
}