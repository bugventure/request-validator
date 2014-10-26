/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: object', function () {
    it('required', function () {
        var schema = {
            type: 'object'
        };

        assert.throws(function () {
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({});
        });
    });

    it('nullable', function () {
        var schema = {
            type: ['object', 'null']
        };

        assert.throws(function () {
            validator(schema).validate(undefined);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(null);
            validator(schema).validate({});
        });
    });

    it('type', function () {
        var schema = {
            type: 'object'
        };

        assert.throws(function () {
            validator(schema).validate('123');
        });

        assert.throws(function () {
            validator(schema).validate(false);
        });

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.throws(function () {
            validator(schema).validate(Math.PI);
        });

        assert.throws(function () {
            validator('object').validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({});
            validator('object').validate({});
            validator({ type: 'object', properties: {} }, {});
        });
    });

    it('maxProperties', function () {
        var schema = {
            type: 'object',
            maxProperties: 3
        };

        assert.throws(function () {
            validator(schema).validate({ a: 1, b: 2, c: 3, d: 4});
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({});
            validator(schema).validate({ a: 1 });
            validator(schema).validate({ a: 1, b: 2 });
            validator(schema).validate({ a: 1, b: 2, c: 3 });
        });
    });

    it('minProperties', function () {
        var schema = {
            type: 'object',
            minProperties: 2
        };

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate({ a: 1 });
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({ a: 1, b: 2 });
            validator(schema).validate({ a: 1, b: 2, c: 3 });
        });
    });

    it('required', function () {
        var schema = {
            type: 'object',
            properties: {
                a: { type: 'string' },
                b: { type: 'number' },
                c: { type: 'boolean'}
            },
            required: ['a', 'b']
        };

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate({ c: true });
        });

        assert.throws(function () {
            validator(schema).validate({ a: 'abc', c: true });
        });

        assert.throws(function () {
            validator(schema).validate({ b: 123, c: true });
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({ a: 'abc', b: 123 });
            validator(schema).validate({ a: 'abc', b: 123, c: true });
        });
    });

    it('additionalProperties', function () {
        var schema = {
            type: 'object',
            properties: {
                a: { type: 'string' },
                b: { type: 'number' }
            },
            additionalProperties: true
        };

        assert.doesNotThrow(function () {
            validator(schema).validate({ a: 'abc' });
            validator(schema).validate({ b: 123 });
            validator(schema).validate({ a: 'abc', b: 123 });
            validator(schema).validate({ a: 'abc', b: 123, c: true });
        });

        schema.additionalProperties = false;

        assert.throws(function () {
            validator(schema).validate({ c: true });
        });

        assert.throws(function () {
            validator(schema).validate({ a: 'abc', b: 123, c: true });
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({ a: 'abc', b: 123 });
            validator({ type: 'object', additionalProperties: false }).validate({});
        });
    });

    it('additionalProperties with patternProperties', function () {
        var schema = {
            type: 'object',
            properties: {
                a: { type: 'string' }
            },
            patternProperties: {
                '^b': { type: 'number' }
            },
            additionalProperties: true
        };

        assert.doesNotThrow(function () {
            validator(schema).validate({ a: 'abc' });
            validator(schema).validate({ b: 123 });
            validator(schema).validate({ a: 'abc', b: 123, bar: Math.E, baz: Math.PI });
            validator(schema).validate({ a: 'abc', baz: 123, c: true });
        });

        schema.additionalProperties = false;

        assert.throws(function () {
            validator(schema).validate({ c: true });
        });

        assert.throws(function () {
            validator(schema).validate({ a: 'abc', bar: 123, c: true });
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({ a: 'abc', baz: 123 });
            validator({ type: 'object', additionalProperties: false }).validate({});
        });
    });

    it('patternProperties', function () {
        var schema = {
            type: 'object',
            patternProperties: {
                '^a': { type: 'string' },
                '^b': { type: 'number' }
            }
        };

        assert.throws(function () {
            validator(schema).validate({ a: 123 });
        });

        assert.throws(function () {
            validator(schema).validate({ b: 'abc' });
        });

        assert.doesNotThrow(function () {
            validator(schema).validate({});
            validator(schema).validate({ a: 'abc' });
            validator(schema).validate({ b: 123 });
            validator(schema).validate({ a: 'abc', b: 123 });
        });
    });

    it('nested graph', function () {
        var schema = {
            type: ['object', null],
            properties: {
                a: { type: 'string' },
                b: { type: 'number' },
                c: {
                    type: 'array',
                    items: { type: 'boolean' }
                }
            },
            required: ['a']
        };

        assert.throws(function () {
            // allowing null does not mean undefined is allowed too
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate({
                a: 123
            });
        });

        assert.throws(function () {
            validator(schema).validate({
                a: 'abc',
                b: false
            });
        });

        assert.throws(function () {
            validator(schema).validate({
                a: 'abc',
                c: [null]
            });
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(null);

            validator(schema).validate({
                a: 'abc',
                b: 123.4,
                c: [true, false]
            });

            validator(schema).validate({
                a: 'abc',
                b: 0
            });

            validator(schema).validate({
                a: 'abc',
                c: [true, false]
            });

            validator(schema).validate({
                a: 'abc',
                c: []
            });
        });
    });
});

// TODO: dependencies for object (property and schema)
// TODO: Common keywords: allOf, anyOf, oneOf, not, definitions
// TODO: if definitions are implemented, they must be loaded when validating
// TODO: id definitions are implemented, add support for $ref