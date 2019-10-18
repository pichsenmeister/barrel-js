# barrel-js

**barrel-js** is a simple & minimal npm package to build semantic templates for JSON objects and strings.

## Install

### NPM

`npm install barrel-js`

### Yarn

`yarn add barrel-js`

## Getting started

### `compile()`
#### JSON templates

`barrel-js` templates look like regular JSON objects, with embedded template expressions.

```json
{
    "title": "Welcome",
    "body": "Hey ${first_name}! Great to have you here."
}
```

A template expression is wrapped into `${` + key + `}` symbols.

You can compile this templates in JavaScript by using the `compile` function, which takes two parameters
1. the JSON or String template
2. a context object of template keys and their corresponding values

#### Example

To receive the parsed template with its given context, execute the `compile` function:

```javascript
const barrel = require('barrel-js');

let template = {
    "title": "Welcome",
    "body": "Hey ${first_name}! Great to have you here."
};

let context = {
    "first_name": "David"
};

let payload = barrel.compile(template, context);
```

This will result in following JSON object

```json
{
    "title": "Welcome",
    "body": "Hey David! Great to have you here."
}
```

#### Escaping template expressions

Template expressions can be escaped by using `\\` in front of the expression and the closing `}` symbol. 
For example `"Hey \\${first_name\\}!"` will result in `"Hey ${first_name}!"`.

### `filter()`
#### Filtering JSON properties

To filter a json payload for specific properties use the `filter` function.

```javascript
const barrel = require('barrel-js');

let template = {
    "type": "section",
    "text": {
        "type": "plain_text",
        "text": "This is a section block."
    },
    "accessory": {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": "Button",
            "emoji": true
        },
        "value": "click_me_123"
    }
};

let result = barrel.filter(payload.get_object, "text")
```

This will result in following JSON object

```json
[ 
   { 
      "type":"mrkdwn",
      "text":"This is a section block."
   },
   "This is a section block.",
   { 
      "type":"plain_text",
      "text":"This is a section block."
   },
   "This is a section block."
]
```

Use an optional maximum property to reduce the number of returned items. 

```javascript
barrel.filter(payload.get_array, "text", 1);
```

This will throw an `index out of range` error if the number of found items is lower than the provided max items property.

### `contains()`
#### checking for JSON sub-structures

To check if a specific json structure exists in this payload use the `contains` function.

```javascript
const barrel = require('barrel-js');

let template = {
    "type": "section",
    "text": {
        "type": "plain_text",
        "text": "This is a section block."
    },
    "accessory": {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": "Button",
            "emoji": true
        },
        "value": "click_me_123"
    }
};

let result = barrel.contains(template, { "type": "section" });
```

This will return either `true` or `false`.

### `match()`
#### filtering for JSON sub-structures

To filter a JSON object or array for a specific json sub-structure use the `match` function.

```javascript
const barrel = require('barrel-js');

let template = {
    "type": "section",
    "text": {
        "type": "plain_text",
        "text": "This is a section block."
    },
    "accessory": {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": "Button",
            "emoji": true
        },
        "value": true
    }
};

let result = barrel.match(template, { "type": "section", "value": true });
```

This will result in following JSON object

```json
[ 
   {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": "Button",
            "emoji": true
        },
        "value": true
    }
]
```

## License

MIT
