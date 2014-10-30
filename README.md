request-validator
=================

[![Build][travis-img]][travis-url] [![Coverage][coveralls-img]][coveralls-url] [![Downloads][downloads-img]][npm-url]

[![NPM][npm-img]][npm-url]

Flexible, schema-based request paramater validator middleware for express and connect. Fully implements the core and validation specs of [JSON Schema draft 4](http://json-schema.org/documentation.html).

### Table of Contents

<!-- MarkdownTOC -->

- [Getting Started](#getting-started)
- [Express Middleware](#express-middleware)
    - [Parameter Source](#parameter-source)
- [JSON Schema](#json-schema)
- [Type Validation](#type-validation)
    - [`string`](#string)
    - [`number`](#number)
    - [`integer`](#integer)
    - [`boolean`](#boolean)
    - [`object`](#object)
    - [`array`](#array)
    - [`null`](#null)
    - [`any`](#any)
- [Multi Schema Validation & Negation](#multi-schema-validation--negation)
    - [`allOf`](#allof)
    - [`anyOf`](#anyof)
    - [`oneOf`](#oneof)
    - [`not`](#not)
- [Schema Reference Using `$ref`](#schema-reference-using-ref)
- [Extensibility](#extensibility)
- [Integration with Other Validators](#integration-with-other-validators)
- [Running Tests](#running-tests)
- [Issues](#issues)
- [Futures](#futures)
    - [Default Values (In The Works)](#default-values-in-the-works)
    - [Better Error Reporting (In The Works)](#better-error-reporting-in-the-works)
    - [In-Schema Validator Functions](#in-schema-validator-functions)
    - [Sanitizers](#sanitizers)
    - [Browser Support](#browser-support)
- [License](#license)

<!-- /MarkdownTOC -->

## Getting Started

```bash
$ npm install request-validator --save
```

```javascript
var validator = require('request-validator');

try {
    // expect to throw
    validator({ type: 'string' }).validate('some value');
}
catch (e) {
    console.log(e);
}
```

Validation works by passing a JSON schema to build a validator object and then calling its `validate` method with a value. Both the validator builder function and the resulting object's `validate` methods may throw.

The validator builder throws an error if the provided schema object does not conform to the JSON Schema draft 4 spec:

```javascript
try {
    // cannot use this string as a schema
    validator('not a valid schema');

    // object properties are not properly defined
    validator({ type: 'object', properties: ['string', 'number'] });
}
catch (e) {
    console.log(e);
}
```

## Express Middleware

The validator builder function is dual-purposed and can be used as an express middleware:

```javascript
var express = require('express'),
    validator = require('express-validator'),
    app = express.app(),
    schema = {
        type: 'object',
        properties: {
            author: {
                type: 'string',
                source: 'body'
            },
            commentText: {
                type: 'string',
                source: 'body'
            }
        }
    };

app.post('/comments', validator(schema, function (req, res, next) {
    // req.body.author and req.body.commentText are validated
}));
```

In this 'middleware mode', the validator will not throw an error and instead create a `req.validator` object containing the validation result.

```javascript
app.post('/comments', validator(schema, function (req, res, next) {
    if (!req.validator.valid) {
        next(req.validator.error);
        return;
    }

    var params = req.validator.params;
    console.log(params);    // { author: 'me', commentText: 'Hello!' }
}));
```

The `req.validator` object is actually a copy of the validator builder function and can be used to further validate data in the context of a request middleware:

```javascript
app.post('/comments', validator(schema, function (req, res, next) {
    try {
        req.validator({ type: 'boolean' }).validate(req.body.subscribe);
    }
    catch (e) {
        next(e);
    }
}));
```

You can chain multiple middleware functions into a single validator middleware:

```javascript
app.post('/comments', validator(schema, 
    function (req, res, next) { }, 
    function (req, res, next) { }));
```

These will be called successively just like normal express middleware.

### Parameter Source

When used as middleware, the validator gathers and validates request parameters based on the `source` property in the JSON schema.

```javascript
var schema = {
    type: 'object',
    properties: {
        author: {
            type: 'string',
            source: 'body'      // maps to `req.body.author`
        },
        token: {
            type: 'string',
            source: 'query'     // maps to `req.query.token`
        },
        sid: {
            type: 'string',
            source: 'cookies'   // maps to `req.cookies.sid`
        },
        createdAt: {
            type: 'string',
            source: 'params'    // maps to `req.params.createdAt`
        }
    }
}

app.post('/comments', validator(schema, function (req, res, next) {
    var params = req.validator.params;
    console.log(params);

    /*
    Request parameters gathered by the validator grouped in an object.

    {
        author: 'John Doe',
        token: '21ec20203aea4069a2dd08002b30309d',
        sid: '123e4567',
        createdAt: '2014-10-30T13:52:21.127Z'
    }
    */
}));
```

## JSON Schema

The validator fully implements draft 4 of the [JSON Schema specification](http://json-schema.org/documentation.html). Check out this [excellent guide to JSON Schema](http://spacetelescope.github.io/understanding-json-schema/UnderstandingJSONSchema.pdf) by Michael Droettboom, et al.

A schema is a JavaScript object that specifies the type and structure of another JavaScript object or value. Here are some valid schema objects:

Schema | Matches
------ | -------
`{}` | any value
`{ type: 'string' }` | a JavaScript string
`{ type: 'number' } ` | a JavaScript number
`{ type: ['string', 'null'] }` | either a string or `null`
`{ type: 'object' }` | a JavaScript object
`{ type: 'array', items: { type: 'string' } }` | an array containing strings

## Type Validation

### `string`

```javascript
{
    type: 'string',     // match a string
    minLength: 3,       // with minimum length 3 characters
    maxLength: 10,      // with maximum length 10 character
    pattern: '^\\w$'    // matching the regex /^\w$/
}
```


### `number`

```javascript
{
    type: 'number',         // match a number
    minimum: 0,             // with minimum value 0
    maximum: 10,            // with maximum value 10
    exclusiveMinimum: true, // exclude the min value (default: false)
    exclusiveMaximum: true, // exclude the max value (default: false)
    multipleOf: 2           // the number must be a multiple of 2
}
```

### `integer`

Same as `number`, but matches integers only.

```javascript
{
    type: 'integer',        // match an integer number
    minimum: 0,             // with minimum value 0
    maximum: 10,            // with maximum value 10
    exclusiveMinimum: true, // exclude the min value (default: false)
    exclusiveMaximum: true, // exclude the max value (default: false)
    multipleOf: 2           // the number must be a multiple of 2
}
```

### `boolean`

```javascript
{
    type: 'boolean'     // match a Boolean value
}
```

### `object`

```javascript
{
    type: 'object',                     // match a JavaScript object
    minProperties: 2,                   // having at least 2 properties
    maxProperties: 5,                   // and at most 5 properties
    required: ['id', 'name'],           // where `id` and `name` are required
    properties: {                       // and the properties are as follows
        id: { type: 'string' },
        name: { type: 'string' },
        price: { 
            type: 'number',
            mininum: 0
        },
        available: { type: 'boolean' }
    },
    patternProperties: {                // with additional properties, where
        '^unit-\w+$': {                 // the keys match the given regular
            type: 'number',             // expression and the values are
            minimum: 0                  // numbers with minimum value of 0
        }                               
    },
    additionalProperties: false         // do not allow any other properties
}                                       // (default: true)
```

Alternatively `additionalProperties` can be an object defining a schema, where each additional property must conform to the specified schema.

```javascript
{
    type: 'object',             // match a JavaScript object
    additionalProperties: {     // with all properties containing
        type: 'string'          // string values
    }
}
```

### `array`

```javascript
{
    type: 'array',          // match a JavaScript array
    minItems: 1,            // with minimum 1 item
    maxItems: 5,            // and maximum 5 items
    uniqueItems: true,      // where items are unique
    items: {                // and each item is a number
        type: 'number'
    }
}
```

Alternatively, you can specify multiple item schemas for positional matching.

```javascript
{
    type: 'array',              // match a JavaScript array
    items: [                    // containing exactly 3 items
        { type: 'string' },     // where first item is a string
        { type: 'number' },     // and second item is a number
        { type: 'boolean' }     // and third item is a Boolean value
    ]
}
```

### `null`

```javascript
{
    type: 'null'    // match a null value
}
```

### `any`

```javascript
{
    type: 'any'     // equivalent to `{}` (matches any value)
}
```

## Multi Schema Validation & Negation

### `allOf`

```javascript
{
    allOf: [                    // match a number conforming to both schemas,
        {                       // i.e. a numeric value between 3 and 5
            type: 'number',
            minimum: 0,
            maximum: 5
        },
        { 
            type: 'number',
            minimum: 3,
            maximum: 10
        }
    ]
}
```

### `anyOf`

```javascript
{
    anyOf: [                    // match either a string or a number
        { type: 'string' },
        { type: 'number' }
    ]
}
```

### `oneOf`

```javascript
{
    oneOf: [                    // match exacly one of those schemas,
        {                       // i.e. a number that is less than 3
            type: 'number',     // or greater than 5, 
            maximum: 52         // but not between 3 and 5
        },
        { 
            type: 'number', 
            minimum: 3 
        }
    ]
}
```

### `not`

```javascript
{
    not: {                  // match a value that is not a JavaScript object
        type: 'object'
    }
}
```

## Schema Reference Using `$ref`

You can refer to types defined in other parts of the schema using the `$ref` property. This approach is often combined with the `definitions` section in the schema that contains reusable schema definitions.

```javascript
{
    type: 'array',                              // match an array containing
    items: {                                    // items that are positive
        $ref: '#/definitions/positiveInteger'   // integers
    },
    definitions: {
        positiveInteger: {
            type: 'integer',
            minimum: 0,
            exclusiveMinimum: true
        }
    }
}
```

Using references, it becomes possible to validate complex object graphs using recursive schema definitions. For example, the validator itself validates the user schema against the [JSON meta-schema][metaschema].

## Extensibility

You can extend `request-validator` with custom validation functions that match a particular type. A custom validator function must throw an exception if validation fails. It accepts two parameters - the schema object and the value to validate.

```javascript
validator.use('type', function (schema, value) {
    // validate my string value and throw if it does not match schema
});
```

By default, custom validator functions are registered on the global validator object. If you want to group custom validators by context, you can create new validator instances using `validator.create()` and use those for validation.

```javascript
var customersValidator = validator.create(),
    productsValidator = validator.create();

customersValidator.use('string', function validateCompany(schema, value) { });

productsValidator.use('string', function validateCategory(schema, value) { });

// both validators have their own custom validation 
// functions that will not be mixed
```

**NOTE**: Custom validators are run for every value whose schema has a matching `type`. This means you have to be careful not to validate irrelevant values. Always use additional format properties in the schema to identify the custom validation rules you care about.

```javascript
validator.use('string', function myDateValidator(schema, value) { 
    // make sure we validate only strings that 
    // have the date format specified in the schema
    if (schema.format === 'date') {
        if (isNaN(new Date(value).getTime())) {
            throw new Error('Invalid date.');
        }
    }
});

var schema = {
    type: 'object',
    properties: {
        a: { type: 'string' },
        b: { 
            type: 'object',
            properties: {
                c: { 
                    type: 'string',
                    format: 'date'
                }
            }
        }
    }
};

var myObject = {
    a: 'abc',
    b: {
        c: '10/30/2014'
    }
};

validator(schema).validate(myObject);
// `myValidator` will be run both for `myObject.a` and `myObject.b.c`, but
// only the latter value will actually go through validation.
```

## Integration with Other Validators

Due to its extensibility, `request-validator` can easily be combined with other validation modules for robust data validation. Here is an example of extensive string validation using the excellent [`validator`][validator] module.

```javascript
var requestValidator = require('request-validator'),
    stringValidator = require('validator'),
    app = require('express')();

// register a custom string validator for format validation
requestValidator.use('string', function (schema, value) {
    var valid = false;    
    if (schema.type === 'string' && schema.format) {
        switch (schema.format) {
            case 'URL':
                valid = stringValidator.isURL(value);
                break;

            case 'FQDN':
                valid = stringValidator.isFQDN(value);
                break;

            case 'IP':
                valid = stringValidator.isIP(value);
                break;

            //... write add more format validators
        }

        if (!valid) {
            throw new Error('Format validation failed.');
        }
    }
});

// schema specifies properties with custom rules 
// that will trigger above format validator
var schema = {
    type: 'object',
    properties: {
        url: {
            type: 'string',
            source: 'body',
            format: 'URL'
        },
        domain: {
            type: 'string',
            source: 'body',
            format: 'FQDN'
        },
        ip: {
            type: 'string',
            source: 'body',
            format: 'IP'
        }
    }
};

app.post('/', requestValidator(schema, function (req, res, next) {
    var params = req.validator.params;
    // params is validated with the above custom format validator
}));
```

## Running Tests

To run [mocha][mocha] tests:

```bash
$ npm test
```

Source code coverage is provided by [istanbul][istanbul] and visible on [coveralls.io][coveralls-url].

## Issues

Please submit issues to the [request-validator issue tracker in GitHub](https://github.com/bugventure/request-validator/issues).

## Futures

### Default Values (In The Works)

Ability to set default values to the validated object when validating request parameters:

```javascript
var schema = {
    type: 'object',
    required: ['username', 'password'],
    properties: {
        username: { 
            type: 'string',
            source: 'body'
        },
        password: { 
            type: 'string',
            source: 'body'
        },
        rememberMe: { 
            type: 'boolean', 
            default: false,
            source: 'body'
        }
    }
}

app.post('/signin', validator(schema, function (req, res, next) {
    var params = req.validator.params;
    console.log(params);
    // params object contains `rememberMe` with 
    // default value of `false` even if omitted
}));
```

### Better Error Reporting (In The Works)

Ability to better understand where in the object graph did the validation fail.

### In-Schema Validator Functions

Ability to specify a custom validator function for particular objects directly in the shema:

```javascript
var schema = {
    type: 'string',
    // this will execute after successful default validation
    validator: function (value) {
        // validate basic SSN number
        if (!/^\d{3}-\d{2}-\d{4}$/.test(value)) {
            throw new Error();
        }
    }
}

validator(schema).validate('123-45-6789');
```

### Sanitizers

Extension points for input sanitization. Examples: converting from strings to numbers, trimming, whitelisting, etc.

```javascript
var schema = { 
    type: 'string',
    sanitizer: {
        // this will execute before validation
        before: function (value) {            
            if (typeof value === 'string') {
                value = value.trim();
            }

            return value;
        },
        // this will execute after succesful validation
        after: function (value) {
            return require('util').format('custom formatted: %s', value);
        }
    }
}
```

### Browser Support

Ability to use validator in the browser.

```html
<!DOCTYPE html>
<html>
<head>
    <title>Validator in the browser</title>    
</head>
<body>
    <script src="validator.js"></script>
    <script>
        validator({ type: 'string', required: true}).validate('abc');
    </script>
</body>
</html>
```

## License

The MIT License (MIT)

Copyright (c) 2014 Veli Pehlivanov

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

[travis-url]: https://travis-ci.org/bugventure/request-validator
[travis-img]: https://travis-ci.org/bugventure/request-validator.svg?branch=master
[npm-url]: https://www.npmjs.org/package/request-validator
[npm-img]: https://nodei.co/npm/request-validator.png?downloads=true
[downloads-img]: http://img.shields.io/npm/dm/request-validator.svg
[coveralls-img]: https://img.shields.io/coveralls/bugventure/request-validator.svg
[coveralls-url]: https://coveralls.io/r/bugventure/request-validator
[metaschema]: http://json-schema.org/schema
[validator]: https://www.npmjs.org/package/validator
[istanbul]: https://www.npmjs.org/package/istanbul
[mocha]: http://mochajs.org/