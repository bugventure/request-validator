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
- [Default Values](#default-values)
- [Extensibility](#extensibility)
- [Integration with Other Validators](#integration-with-other-validators)
- [Error Reporting](#error-reporting)
- [Custom Error Messages](#custom-error-messages)
- [Running Tests](#running-tests)
- [Issues](#issues)
- [Changelog](#changelog)
    - [v0.3.2](#v032)
    - [v0.3.1](#v031)
    - [v0.3.0](#v030)
    - [v0.2.1](#v021)
- [Futures](#futures)
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
    validator = require('request-validator'),
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

You can additionally specify `dependencies` in an object schema. There are two types of dependencies:

1. property dependency

    ```javascript
    {
        type: 'object',             // if `price` is defined, then
        dependencies: {             // these two must also be defined
            price: ['unitsInStock', 'quantityPerUnit']
        }
    }
    ```

2. schema dependency
    
    ``` javascript
    {
        type: 'object',
        dependencies: {                     // if `price` is defined,
            price: {                        // then the object must also
                type: 'object',             // match the specified schema
                properties: {
                    unitsInStock: {
                        type: 'integer',
                        minimum: 0
                    }
                }
            }
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

## Default Values

In addition to validating objects, `request-validator` supports default values in the JSON schema. You can use `validator(schema).default()` to retrieve default values when the actual value is not defined.

```javascript
var schema = {
    type: 'string',
    default: 'this is a default string'
}

var myString = validator(schema).default();
console.log(myString);  // 'this is a default string'
```

In object graphs and arrays, default values are filled in their respective places when there are missing keys and the JSON schema specifies a default value for these keys.

```javascript
var schema = {
    type: 'object',
    default: {},
    properties: {
        foo: {
            type: 'string',
            default: 'bar'
        }
    }
}

var myObject = validator(schema).default();
console.log(myObject);  // '{ "foo": "bar" }'
```

This approach helps build complete object graphs even when only some of the values are provided.

```javascript
var schema = {
    type: 'object',
    properties: {
        username: { type: 'string' },
        password: { type: 'string' },
        rememberMe: { type: 'boolean', default: true }
    }
}

var myLoginInfo = { username: 'johndoe', password: 'P@ssw0rd' };
console.log(validator(schema).default(myLoginInfo));

// third property `rememberMe` defaults to `true`
// { username: 'johndoe', password: 'P@ssw0rd', rememberMe: true }
```

**NOTE**: `validator(schema).default()` does not trigger validation and will not throw validation errors. The validator will try to resolve the default values based on the current state of the object graph, where possible. 

When using `request-validator` as express middleware, default values are automatically collected from the request object. This helps build a data model with robust input validation and default values.

```javascript
var schema = {
    type: 'object',
    required: ['username', 'password'], // `rememberMe` is not required
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
            default: true,              // if omitted, defaults to `true`
            source: 'body'
        }
    }
}

app.post('/signin', validator(schema, function (req, res, next) {
    var params = req.validator.params;
    console.log(params);
    // params object contains `rememberMe` with 
    // default value of `true` even if omitted
}));
```

**NOTE**: Default values do not go through the validation pipeline. The process of collecting default values is kept completely separate from the actual validation, so that only user-provided data is validated.

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

## Error Reporting

The validator throws regular error objects when validation fails. These error objects are decorated with additional properties to help identify the exact place in the object graph, where validation failed. This is especially useful when validating large objects with many properties or a deep object graph.

```javascript
var schema = {
    type: 'object',
    properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        address: {
            type: 'object',
            properties: {
                city: { type: 'string' },
                postal: { type: 'integer' },
                state: { type: 'string' },
                country: { type: 'string' }
            }
        }
    }
};

try {
    validator(schema).validate({
        firstName: 'John',
        lastName: 'Doe',
        address: {
            city: 'Boston',
            postal: '02115',    // postal code is invalid, must be an integer
            state: 'MA',
            country: 'USA'
        }
    });
}
catch (e) {
    console.log(JSON.stringify(e, null, '  '));
}

/*
Output:
{
  "key": "",
  "errors": [
    {
      "key": "address",
      "errors": [
        {
          "key": "postal",
          "message": "invalid",
          "missing": false,
          "required": false
        }
      ],
      "message": "invalid",
      "missing": false,
      "required": false
    }
  ],
  "message": "invalid",
  "missing": false,
  "required": true
}
*/
```

## Custom Error Messages

When dealing with validation errors, it is often required to customize the error messages when validation fails. For example, validator middleware used for sanitizing input to REST endpoints may want to return validation errors in a JSON response with HTTP status code 400. `request-validator` allows for fully customizable error messages.

The simplest way to customize the error messages is to specify them directly in the schema:

```javascript
var schema = {
    type: 'object',
    required: ['name', 'age'],
    message: 'Invalid profile data.',
    properties: {
        name: {
            type: 'string',
            requiredMessage: 'Please specify your name.',
            message: 'Invalid name of registrant.'
        },
        age: {
            type: 'integer',
            requiredMessage: 'Please specify your age',
            message: 'Invalid age.'
        }
    }
};

try {
    validator(schema).validate({ age: '' });
}
catch (e) {
    console.log(JSON.stringify(e, null, '  '));
}

/*
Output:
{
  "key": "",
  "errors": [
    {
      "key": "name",
      "message": "Please specify your name.",
      "missing": true,
      "required": true
    },
    {
      "key": "age",
      "message": "Invalid age.",
      "missing": false,
      "required": true
    }
  ],
  "message": "Invalid profile data.",
  "missing": false,
  "required": true
}
*/
```

Alternatively, you can also modify the default string values directly.

```javascript
validator.strings.required = 'This is a modified required message.';
validator.strings.invalid = 'This is a modified invalid message.';

var validator2 = validator.create();
validator2.strings.required = 'This required message is for validator2 only.'
validator2.strings.invalid = 'This invalid message is for validator2 only.'
```

**NOTE**: When new validator instances are created using `validator.create()`, the new validator instance receives a copy of the strings object from its parent, along with any user customizations.

## Running Tests

To run [mocha][mocha] tests:

```bash
$ npm test
```

Source code coverage is provided by [istanbul][istanbul] and visible on [coveralls.io][coveralls-url].

## Issues

Please submit issues to the [request-validator issue tracker in GitHub](https://github.com/bugventure/request-validator/issues).

## Changelog

### v0.3.2

* Fix Object.prototype is modified (#10)

### v0.3.1

* Fix type-specific keywords require a type definition in the schema (#8)
* Fix failure to conform to the JSON-Schema-Test-Suite (#9)

### v0.3.0

* Add support for default values (#2)
* Add detailed error reporting (#3)
* Fix array validation does not comply with JSON Schema spec when items schema is specified (#7)

### v0.2.1
* Add dependency support for object validation (#1)
* Fix required property validation accepts `undefined` values (#5)
* Fix array items are not validated against `additionalItems` (#6)

## Futures

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