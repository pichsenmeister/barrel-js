# Barrel JS

_Note: This is an alpha preview_

Barrel JS is a minimal, event-driven framework for Node to build microservices and integrations.

The goal of the project is to provide a simple way to build integrations with external API services, enabled by an event driven architecture.

These are the principles:
* **Messages**: Messages are JSON objects. They can have any internal structure you like. Messages can be received via HTTP/S or through internal dispatchers. You just listen and act on messages you care about.
* **Pattern matching**: Instead of parsing each message or request, you just define which parts of a message you care about.
* **Service oriented**: You can send messages through services, separating your business logic from message parsing.
* **Extensibility**: Functionality is expressed as a set of plugins which can be composed together as microservices. (TBD)

## Content

- [Install](#install)
- [Getting started](#getting-started)
- [Services](#services)
- [Example](#example)
- [Configuration](#configuration)
- [Methods](#methods)
- [License](#license)


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

This will spin up a route on `<your-host>:5000/barrel` that accepts valid JSON `POST` requests. You can configure this by passing a [configuration object](#configuration) to the constructor.

To capture incoming requests, you can create listeners that filter the body based on the listener's pattern and execute a given function.

```javascript
barrel.on({action: "name"}, async ({ values, done }) => {
    console.log('values containing action property "name"', values.all())

    // sends an empty 200 response
    done()
})

barrel.on({action: /^action-\w*$/}, async ({ values, done }) => {
    console.log('values containing action property matching the given RegEx', values.all())

    // sends an empty 200 response
    done()
})
```

Alternatively you can use any valid [JSONPath Plus](https://github.com/s3u/JSONPath) selector as a pattern.

```javascript
barrel.on('$..city', async ({ values, done }) => {
    console.log('values containing city property', values.all())

    // sends an empty 200 response
    done()
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
const average = await barrel.act('weather.average', 67.11, 34.25, 88.91)
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


## Example

You can find an example using the Telegram Bot API [here](examples/telegram.js).

```
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
```

## Configuration

The constructor accepts a configuration object with following properties. These are the defaults:

```javascript
{
    method: 'POST', // any valid HTTP method
    port: 5000, // a valid port number
    route: '/barrel', // the route for incoming requests
    middlewares: [], // an array of middlewares to run for each incoming request
    bodyParser: bodyParser.json(), // body-parser
    debug: false, // true or false
}
```

## Methods

### `.start()`

Starts the barrel server.

### `.on(pattern, callback)`

Creates a listener for incoming requests.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `pattern` | JSON or String (JSON Path Plus expression) | The pattern to match incoming JSON payloads or dispatchers |
| `callback` | Function | A function that is executed when an incoming requests matches the pattern |

#### callback

The callback function receives an object with following properties:

| Property | Type |  Description |
| ---- | ---- | ---- |
| `values` | Object | A `values` object including the values matching the pattern |
| `context` | Object | A context object that was passed down from a dispatcher |
| `message` | Object | The original message |
| `done` | Function | A function that returns a 200 HTTP response in case that listener was executed in the context of an HTTP request |

#### `values` object

The values object has following properties:

| Property | Type |  Description |
| ---- | ---- | ---- |
| `all()` | Array | Returns an array of all values |
| `first()` | Object | Returns the first value |
| `last()` | Object | Returns the last value |
| `get(index)` | Function | Returns the entry at given index or `false` |
| `length` | Int | Number of matching values |


#### Example
```javascript
barrel.on({id: '$any'}, ({values, context, done}) => {
    console.log(values.all())
    console.log(context)
    done()
})
```

### `.error(callback)`

Custom error handler

| Property | Type |  Description |
| ---- | ---- | ---- |
| `callback` | Function | A function that is executed when an error occurs |

#### Example
```javascript
barrel.error((error) => {
    console.error(error)
})
```

### `register(service)`

Registers a valid service object.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `service` | Object | A valid service object |

#### Example
```javascript
barrel.register({... a valid service object ...})
```

### `registerAll(services)`

Registers an array of services.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `services` | Array | An array of valid service objects |

#### Example
```javascript
barrel.registerAll([{... a valid service object ...}])
```

### `act(action, ..args)`

Executes an action defined in a service object.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `action` | String | An action identifier for a service action, e.g. `weather.average` |
| `...args` | Arguments | Any number of arguments passed down to the action or request |

#### Example
```javascript
barrel.act('weather.average', 67.11, 34.25, 88.91)
```

### `call(request, ..args)`

Executes a request defined in a service object.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `request` | String | A request identifier for a service request, e.g. `weather.search` |
| `...args` | Arguments | Any number of arguments passed down to the action or request |

#### Example
```javascript
barrel.call('weather.search', 'san francisco')
```

### `dispatch(msg, context)`

Dispatches a message object that matches a pattern of a listener.

| Property | Type |  Description |
| ---- | ---- | ---- |
| `msg` | String or JSON | A message object that triggers a listener of a matching pattern |
| `context` | JSON | An object that is passed down to the given listener as `context` |

#### Example
```javascript
barrel.dispatch({action: "name"}, {dispatcher: true})
```

## License

MIT. See [license](LICENSE).
