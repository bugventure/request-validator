request-validator
=================

[![Build][travis-img]][travis-url] [![Coverage][coveralls-img]][coveralls-url] [![Downloads][downloads-img]][npm-url]

[![NPM][npm-img]][npm-url]

Flexible, schema-based request paramater validator middleware for express and connect. Fully implements the core and validation specs of [JSON Schema draft 4](http://json-schema.org/documentation.html).

<!-- MarkdownTOC -->

- [Getting Started](#getting-started)
- [Express Middleware](#express-middleware)
- [JSON Schema](#json-schema)
- [Type Validation](#type-validation)
    - [string](#string)
    - [number](#number)
    - [integer](#integer)
    - [boolean](#boolean)
    - [object](#object)
    - [array](#array)
    - [null](#null)
    - [any](#any)
- [External Schema Reference](#external-schema-reference)
- [Extensibility](#extensibility)
- [Running Tests](#running-tests)
- [Issues](#issues)
- [Futures](#futures)
    - [In-Schema Validator Functions](#in-schema-validator-functions)
    - [Sanitizers](#sanitizers)
    - [Browser Support](#browser-support)
- [License](#license)

<!-- /MarkdownTOC -->

### Getting Started

```bash
$ npm install request-validator --save
```

```javascript
var validator = require('request-validator');

try {
    validator({ type: 'string' }).validate('some value');
}
catch (e) {
    console.log(e);
}
```



### Express Middleware

### JSON Schema

The validator module fully implements draft 4 of the [JSON Schema specification](http://json-schema.org/documentation.html). Check out this [excellent guide to JSON Schema](http://spacetelescope.github.io/understanding-json-schema/UnderstandingJSONSchema.pdf) by Michael Droettboom, et al.

### Type Validation

#### string
#### number
#### integer
#### boolean
#### object
#### array
#### null
#### any

### External Schema Reference

### Extensibility

### Running Tests

### Issues

Please submit issues to the [request-validator issue tracker in GitHub](https://github.com/bugventure/request-validator/issues).

### Futures

#### In-Schema Validator Functions

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

#### Sanitizers

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

#### Browser Support

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

### License

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