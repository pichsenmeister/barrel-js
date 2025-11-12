# 🛢️ barrel-js

[![npm version](https://badge.fury.io/js/%40barreljs%2Fcore.svg)](https://badge.fury.io/js/%40barreljs%2Fcore)

Barrel JS is a minimal, event-driven framework for Node.js to build microservices and integrations. The goal of the project is to provide a simple way to build integrations with external API services, enabled by an event-driven architecture.

## Principles

-   **Messages**: Messages are JSON objects. They can have any internal structure you like. Messages can be received via HTTP/S or through internal dispatchers. You just listen and act on messages you care about.
-   **Pattern matching**: Instead of parsing each message or request, you just define which parts of a message you care about.
-   **Service oriented**: You can send messages through services, separating your business logic from message parsing.
-   **Extensibility**: Functionality is expressed as a set of plugins which can be composed together as microservices.

## Quick Start with the CLI

The fastest way to get started is by using the `barrel` CLI.

1.  **Install the CLI globally:**

    ```bash
    npm install -g @barreljs/core
    ```

2.  **Create a new application:**

    ```bash
    barrel init my-weather-app
    ```

3.  **Run the app:**
    ```bash
    cd my-weather-app
    npm start
    ```

This will create a new directory called `my-weather-app`, install the dependencies, and start a server. The scaffolded project includes a `services/weather.js` file and a scheduled job that fetches a live weather forecast every minute, demonstrating key features out of the box.

## Core Concepts

### Messages and Listeners

Barrel is built around messages. You can listen for specific messages using `barrel.on()` with a pattern-matching object.

```javascript
const Barrel = require('@barreljs/core');
const barrel = new Barrel();

// Listen for any message that has a 'ping' property
barrel.on({ ping: 'p' }, (msg, context) => {
	// msg.p contains the value of the 'ping' property
	console.log(`Received a ping with value: ${msg.p}`);

	// If the message came from an HTTP request, you can respond
	if (context.res) {
		context.res.send({ pong: msg.p });
	}
});

barrel.start();
```

### Services

Services are the building blocks of your application. They encapsulate related logic and can contain `actions` (local functions) and `requests` (for calling external APIs).

Here is the example `weather.js` service created by the CLI:

```javascript
// services/weather.js
const service = {
	name: 'weather',
	requests: {
		// Gets API endpoints for a given GPS coordinate
		points: ({ lat, lon }) => ({
			method: 'GET',
			url: `https://api.weather.gov/points/${lat},${lon}`,
			headers: {
				'User-Agent':
					'(barreljs-example, https://github.com/pichsenmeister/barrel-js)',
			},
		}),
		// Gets the forecast from a specific forecast URL
		forecast: ({ url }) => ({
			method: 'GET',
			url: url,
			headers: {
				'User-Agent':
					'(barreljs-example, https://github.com/pichsenmeister/barrel-js)',
			},
		}),
	},
	actions: {
		// Example local action
		average: ({ temp1, temp2, temp3 }) => {
			return (temp1 + temp2 + temp3) / 3;
		},
	},
};

module.exports = service;
```

You register a service with `barrel.register()`:

```javascript
const weatherService = require('./services/weather');
barrel.register(weatherService);
```

### Calling Services

Once a service is registered, you can use `barrel.act()` to run a local action and `barrel.call()` to make an external request. Both methods use a single JSON object for the payload.

```javascript
// Call a local action
const avg = await barrel.act('weather.average', {
	temp1: 10,
	temp2: 12,
	temp3: 14,
});

// Call an external API request
const pointData = await barrel.call('weather.points', {
	lat: '38.8894',
	lon: '-77.0352',
});
```

### Scheduler

You can execute functions on a recurring schedule, similar to cron jobs, using `barrel.schedule()`.

```javascript
// Run a task every minute
barrel.schedule('* * * * *', async () => {
	console.log('Fetching weather...');
	try {
		const pointData = await barrel.call('weather.points', {
			lat: '38.8894',
			lon: '-77.0352',
		});
		const forecastUrl = pointData.properties.forecast;
		const forecastData = await barrel.call('weather.forecast', {
			url: forecastUrl,
		});
		console.log(forecastData.properties.periods[0].detailedForecast);
	} catch (error) {
		console.error('Failed to fetch weather:', error.message);
	}
});
```

## API Reference

#### `new Barrel(config)`

Creates a new Barrel instance.

-   `config.port`: The port to listen on (default: `3141`).
-   `config.route`: The HTTP route to listen to (default: `/barrel`).
-   `config.method`: The HTTP method to listen for (default: `post`).
-   `config.debug`: Enable debug logging (default: `false`).

#### `barrel.on(pattern, callback)`

Registers a listener that executes the `callback` when an incoming message matches the `pattern`.

#### `barrel.register(service)`

Registers a service object.

#### `barrel.act(serviceAction, payload)`

Executes a local action from a registered service (e.g., `'serviceName.actionName'`).

#### `barrel.call(serviceRequest, payload)`

Executes an external request from a registered service (e.g., `'serviceName.requestName'`).

#### `barrel.schedule(cronTime, task)`

Schedules a `task` function to run based on a cron pattern (e.g., `'* * * * *'` for every minute).

#### `barrel.start(callback)`

Starts the HTTP server.

#### `barrel.error(callback)`

Registers a global error handler. The `callback` will be called with any error that occurs within the framework.
