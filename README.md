# Barrel JS

Barrel JS is a minimal, event-driven framework for Node to build microservices and integrations.

## Install

### NPM

`npm install @barreljs/core`

### Yarn

`yarn add @barreljs/core`

## Getting started

```javascript
const Barrel = require('@barreljs/core')

const barrel = new Barrel()

barrel.start()
```

This will spin up a route on `<your-host>:3141/barrel` that accepts valid JSON `POST` requests. You can configure this by passing a [configuration object](#configuration) to the constructor.

To capture incoming requests, you can create listeners that filter the body and execute a given function.

```javascript
barrel.on({action: "name"}, async ({ values, ack }) => {
    console.log('values containing action property "name"', values)

    // sends an empty 200 response
    ack()
})

barrel.on({action: /^action-\w*$/}, async ({ values, ack }) => {
    console.log('values containing action property matching the given RegEx', values)

    // sends an empty 200 response
    ack()
})
```

Alternatively you can use any valid [JSONPath Plus](https://github.com/s3u/JSONPath) selector to filter incoming requests.

```javascript
barrel.on('$..city', async ({ values, ack }) => {
    console.log('values containing city property', values)

    // sends an empty 200 response
    ack()
})
```

## Services

Services can execute requests or actions. Each service requires a unique `name` property and either an `actions` or `requests` object.
Requests execute HTTP requests to other services. Actions are just normal funtions that will be executed.
Each service can contain `requests` and `actions`, but all properties within those two objects must be unique.

```javascript
const service = {
        name: 'weather',
        requests: {
            search: (city) => ({
                method: 'GET',
                url: 'https://www.metaweather.com/api/location/search',
                params: {
                    query: city
                }
            }),
            get: (id, city) => ({
                method: 'POST',
                url: `https://www.metaweather.com/api/location/${id}`,
                data: {
                    city: city
                }
            })
        },
        actions: {
            average: (temp1, temp2, temp3) => {
                return (temp1+temp2+temp3)/3;
            }
        }

    }
```

These services can be registered in a Barrel
```javascript
barrel.register(service)

// or if you have multiple services in an array
barrel.registerAll([service])
```

and executed using the service's name and action or request identifier
```javascript
const result = await barrel.call('weather.search', 'san francisco')

//or
const average = await barrel.call('weather.average', 67.11, 34.25, 88.91)
```


### Request

Requests are a function that return a valid request object. 

| Property | Type | Required | Description |
| ---- | ---- | ---- | ---- |
| `method` | String | Yes | Any valid HTTP method |
| `url` | String | Yes | A valid url |
| `params` | JSON | No | An object that is converted into URL parameter |
| `data` | JSON | No | An object that is converted into a JSON body |
| `urlencoded` | Boolean | No | Indicates that a request should be send as `application/x-www-form-urlencoded` instead of `application/json` if set to `true` |

### Action

Actions are simple functions wrapped in a service.

## Configuration

The constructor accepts a configuration object with following properties. These are the defaults:

```javascript
{
    method: 'POST', // any valid HTTP method
    port: 3141, // a valid port number
    route: '/barrel', // the route for incoming requests
    middlewares: [], // an array of middlewares to run for each incoming request
    bodyParser: bodyParser.json(), // body-parser
    debug: false, // true or false
}
```

## Methods

### `.start()`

Starts the barrel server.

### `.on(filter, callback)`

Creates a listener for incoming requests.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `filter` | JSON or String (JSON Path Plus expression) | The filter to match incoming JSON payloads |
| `callback` | Function | A function that is executed when an incoming requests matches the filter |

### `.error(callback)`

Custom error handler

| Property | Type |  Description |
| ---- | ---- | ---- |
| `callback` | Function | A function that is executed when an error occurs |

### `register(service)`

Registers a valid service object.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `service` | JS Object | A valid service object |

### `registerAll(services)`

Registers an array of services.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `services` | Array | An array of valid service objects |

### `call(action, ..args)`

Executes a request or action defined in a service object.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `action` | String | An action identifier for a service action or request, e.g. `weather.search` |
| `...args` | Arguments | Any number of arguments passed down to the action or request |

### `trigger(body, context)`

Triggers a matching listener manually.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `body` | String or JSON | Matching body that triggers a listener |
| `context` | JSON | An object that is passed down to the given listener as `context` |

## License

MIT. See [license](LICENSE).
