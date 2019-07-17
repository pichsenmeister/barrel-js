# barrel-js

**barrel-js** provides a simple & mininmal npm package to build semantic templates for JSON objects and strings.

## Install

`npm install barrel-js`

## Getting started

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

### Example

To receive the parsed template with its given context, execute the `compile` function:

```javascript
const barrel = ('barrel-js');

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

### Escaping template expressions

Template expressions can be escaped by using `\\` in front of the expression and the closing `}` symbol. 
For example `"Hey \\${first_name\\}!"` will result in `"Hey ${first_name}!"`.

## License

MIT
