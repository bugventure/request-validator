/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: array', function () {
    it('required', function () {
        var schema = {
            type: 'array'
        };

        assert.throws(function () {
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
        });
    });

    it('nullable', function () {
        var schema = {
            type: ['array', 'null']
        };

        assert.throws(function () {
            validator(schema).validate(undefined);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(null);
            validator(schema).validate([]);
        });
    });

    it('type', function () {
        var schema = {
            type: 'array'
        };

        assert.throws(function () {
            validator(schema).validate('123');
        });

        assert.throws(function () {
            validator(schema).validate(false);
        });

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
        });
    });

    it('minItems', function () {
        var schema = {
            type: 'array',
            minItems: 3
        };

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.throws(function () {
            validator(schema).validate([1, 2]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([1, 2, 3]);
            validator(schema).validate([1, 2, 3, 4]);
        });
    });

    it('maxItems', function () {
        var schema = {
            type: 'array',
            maxItems: 3
        };

        assert.throws(function () {
            validator(schema).validate([1, 2, 3, 4]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate([1, 2, 3]);
        });
    });

    it('items: object', function () {
        var schema = {
            type: 'array',
            items: { type: 'string' }
        };

        assert.throws(function () {
            validator(schema).validate([null]);
        });

        assert.throws(function () {
            validator(schema).validate([1]);
        });

        assert.throws(function () {
            validator(schema).validate(['a', false, 'b']);
        });

        assert.throws(function () {
            validator(schema).validate(['a', 'b', 1]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate(['a']);
            validator(schema).validate(['a', 'b', 'c']);
        });

        schema = {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    strProp: { type: 'string' },
                    boolProp: { type: 'boolean' }
                },
                required: ['strProp']
            }
        };

        assert.throws(function () {
            validator(schema).validate([123]);
        });

        assert.throws(function () {
            validator(schema).validate([{}]);
        });

        assert.throws(function () {
            validator(schema).validate([{
                strProp: 'value',
                boolProp: 123
            }]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([{
                strProp: 'value',
                boolProp: false
            }]);
        });
    });

    it('items: array', function () {
        var schema = {
            type: 'array',
            items: [
                { type: 'string' },
                { type: 'number' }
            ]
        };

        assert.throws(function () {
            validator(schema).validate([1]);
        });

        assert.throws(function () {
            validator(schema).validate([1, 'a']);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate(['a']);
            validator(schema).validate(['a', 1]);
            validator(schema).validate(['a', 1, null, 'b', 2]);
        });
    });

    it('additionalItems: boolean', function () {
        var schema = {
            type: 'array',
            additionalItems: false
        };

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate([1]);
            validator(schema).validate([1, 'a', true]);
        });

        schema.items = { type: 'number' };

        assert.throws(function () {
            validator(schema).validate(['a']);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate([1]);
            validator(schema).validate([1, 2, 3]);
        });

        schema.items = [
            { type: 'string' },
            { type: 'number' }
        ];

        assert.throws(function () {
            validator(schema).validate(['a', 1, 2]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate(['a']);
            validator(schema).validate(['a', 1]);
        });
    });

    it('additionalItems: object', function () {
        // when `items` is an object schema, `additionalItems`
        // is ignored and must not validate against
        var schema = {
            type: 'array',
            items: {
                type: 'string'
            },
            additionalItems: {
                type: 'number'
            }
        };

        assert.throws(function () {
            validator(schema).validate(['abc', 'def', 123]);
        });

        assert.doesNotThrow(function () {
            // same as above description - only strings are valid
            validator(schema).validate(['abc', 'def']);
        });

        // when `items` is an array, any other positional
        // data item must validate against `additionalItems`
        schema.items = [
            { type: 'string' },
            { type: 'boolean' }
        ];

        assert.throws(function () {
            validator(schema).validate(['abc', false, 'def']);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(['abc', false]);
            validator(schema).validate(['abc', false, 123]);
            validator(schema).validate(['abc', false, 123, Math.PI]);
        });

        // when `additionalItems` is an empty object, anything is valid
        schema.additionalItems = {};

        assert.doesNotThrow(function () {
            validator(schema).validate(['abc', false, 'def', 123, {}, null]);
        });
    });

    it('uniqueItems', function () {
        var schema = {
            type: 'array',
            items: { type: 'number' },
            uniqueItems: false
        };

        assert.doesNotThrow(function () {
            validator(schema).validate([1, 2, 1]);
        });

        schema.uniqueItems = true;

        assert.throws(function () {
            validator(schema).validate([1, 2, 1]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([1, 2, 3]);
        });
    });
});