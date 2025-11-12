#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const packageJson = require('../package.json'); // To get the version dynamically

const program = new Command();

program
  .name('barrel')
  .description('CLI to scaffold a new Barrel.js application')
  .version(packageJson.version);

program
  .command('init <projectName>')
  .description('Initialize a new Barrel.js project')
  .action((projectName) => {
    const projectPath = path.join(process.cwd(), projectName);

    console.log(`🛢️  Creating a new Barrel.js app in ${projectPath}`);

    // 1. Create project directory
    if (fs.existsSync(projectPath)) {
      console.error(`\nError: Directory '${projectName}' already exists.`);
      process.exit(1);
    }
    fs.mkdirSync(projectPath);

    // 2. Create services directory
    const servicesPath = path.join(projectPath, 'services');
    fs.mkdirSync(servicesPath);

    // 3. Create example service file (weather.js)
    const weatherServiceContent = `// This is an example service using the free api.weather.gov service.
// See https://www.weather.gov/documentation/services-web-api for more info.
const service = {
    name: 'weather',
    requests: {
        // Gets API endpoints for a given GPS coordinate
        points: ({ lat, lon }) => ({
            method: 'GET',
            url: \`https://api.weather.gov/points/\${lat},\${lon}\`,
            // This API requires a User-Agent header.
            headers: {
                'User-Agent': '(barreljs-example, https://github.com/pichsenmeister/barrel-js)'
            }
        }),
        // Gets the forecast from a specific forecast URL provided by the 'points' endpoint
        forecast: ({ url }) => ({
            method: 'GET',
            url: url,
            headers: {
                'User-Agent': '(barreljs-example, https://github.com/pichsenmeister/barrel-js)'
            }
        })
    },
    actions: {
        // Example action: calculate the average of three temperatures
        average: ({ temp1, temp2, temp3 }) => {
            return (temp1 + temp2 + temp3) / 3;
        }
    }
}

module.exports = service;
`;
    fs.writeFileSync(path.join(servicesPath, 'weather.js'), weatherServiceContent);

    // 4. Create a basic index.js file with service registration and scheduled function
    const indexJsContent = `const Barrel = require('@barreljs/core');
const weatherService = require('./services/weather'); // Require the new service

const barrel = new Barrel({ debug: true });

// Register the example weather service
barrel.register(weatherService);

// Listen for messages with a 'ping' property
barrel.on({ ping: 'p' }, (msg, context) => {
  console.log('Received a ping! Responding with pong.');
  context.res.send({ pong: msg.p });
});

// Example scheduled function: Run a sequence of service calls every minute
barrel.schedule('* * * * *', async () => {
  console.log('--- Running Scheduled Job ---');
  try {
    // 1. Call a request to get API endpoints for a specific location (Washington D.C.)
    console.log('1. Getting forecast grid for a location...');
    const pointData = await barrel.call('weather.points', { lat: '38.8894', lon: '-77.0352' });
    const forecastUrl = pointData.properties.forecast;
    console.log(\`   > Forecast URL found: \${forecastUrl}\`);

    // 2. Call another request using the URL from the previous step
    console.log('2. Fetching the actual forecast...');
    const forecastData = await barrel.call('weather.forecast', { url: forecastUrl });
    const firstPeriod = forecastData.properties.periods[0];
    console.log(\`   > Current forecast: \${firstPeriod.name} is \${firstPeriod.detailedForecast}\`);

    // 3. Call a local action to perform a calculation
    console.log('3. Calculating an average temperature...');
    const avgTemp = await barrel.act('weather.average', { temp1: 10, temp2: 12, temp3: 14 });
    console.log('   > Average temperature:', avgTemp);

  } catch (error) {
    console.error('Error during scheduled job:', error.response ? error.response.data : error.message);
  }
});

barrel.error((err) => {
  console.error('An error occurred:', err.message);
});

barrel.start();
`;
    fs.writeFileSync(path.join(projectPath, 'index.js'), indexJsContent);

    // 5. Create package.json
    const packageJsonContent = {
      name: projectName,
      version: '1.0.0',
      description: 'A new Barrel.js application',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
      },
      dependencies: {
        '@barreljs/core': packageJson.version, // Use the current version of your package
      },
    };
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJsonContent, null, 2)
    );

    // 6. Install dependencies
    console.log('\nInstalling dependencies...');
    execSync('npm install', { cwd: projectPath, stdio: 'inherit' });

    // 7. Final instructions
    console.log('\n✅ Success! Your new Barrel app is ready.');
    console.log('\nTo get started, run the following commands:');
    console.log(`  cd ${projectName}`);
    console.log('  npm start');
  });

program.parse(process.argv);
