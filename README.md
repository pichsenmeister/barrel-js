# json-template

A mininmal npm package to build semantic templates for JSON objects and strings.

## Install

`npm install json-template`

## Getting started

`json-template` templates look like regular JSON objects, with embedded template expressions.

```json
{
    "title": "Welcome",
    "body": "Hey {{first_name}}! Great to have you hear."
}
```

A template expression is wrapped into `{{` + key + `}}` braces.

You can compile this templates in JavaScript by using the `set` function, which takes two parameters
1. the JSON template
2. a context object containing key value pairs of template expressions and values

To receive the parsed template with its given context, execute the `set` function:

```javascript
const JsonTemplate = ('json-template');

let json = JsonTemplate.set(
    {
        "title": "Welcome",
        "body": "Hey {{first_name}}! Great to have you hear."
    },
    {
        "first_name": "David"
    }
);
```

This will result in following JSON object

```json
{
    "title": "Welcome",
    "body": "Hey David! Great to have you hear."
}
```

## License

MIT