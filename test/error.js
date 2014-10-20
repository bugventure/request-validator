/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('error', function () {
    it('throws when invalid', function () {
        var schema = {
            type: 'string'
        };

        assert.throws(function () {
            validator(schema).validate(123);
        });
    });

    it('throws when child invalid', function () {
        var schema = {
            type: 'object',
            properties: [
                {
                    name: 'a',
                    type: 'string'
                }
            ]
        };

        assert.throws(function () {
            validator(schema).validate({ a: 123 });
        });
    });

    it('does not throw when schema is valid', function () {
        assert.doesNotThrow(function () {
            validator('string');
            validator({ type: 'number', required: true });
            validator({ type: 'array', items: 'integer' });
            validator({ type: 'array', items: { type: 'string', length: 2 } });
            validator({ type: 'object', required: true, properties: [{ name: 'a', type: 'string' }] });
        });
    });

    it('throws when schema is invalid', function () {
        assert.throws(function () {
            validator('nonExistingType');
        });

        assert.throws(function () {
            validator({ type: 'nonExistingType' });
        });

        assert.throws(function () {
            validator({ type: 'object', properties: ['string', 'number'] });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                properties: [{ type: 'string' }]
            });
        });

        assert.throws(function () {
            validator({
                type: 'array',
                items: []
            });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                properties: [
                    {
                        name: 'a',
                        type: 'object',
                        properties: [{ type: 'string' }]
                    }
                ]
            });
        });
    });

    it('required message', function () {
        try {
            validator({
                type: 'string',
                required: true
            }).validate();

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.message, 'anonymous: required');
        }

        try {
            validator({
                name: 'field1',
                type: 'string',
                required: true
            }).validate();

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.message, 'field1: required');
        }
    });

    it('invalid message', function () {
        try {
            validator({
                type: 'string'
            }).validate(123);

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.key, undefined);
            assert.strictEqual(e.message, 'anonymous: invalid');
        }

        try {
            validator({
                name: 'field1',
                type: 'string'
            }).validate(123);

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.key, 'field1');
            assert.strictEqual(e.message, 'field1: invalid');
        }
    });

    it('custom invalid message', function () {
        try {
            validator({
                type: 'string',
                required: true,
                message: 'custom message'
            }).validate(123);

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.key, undefined);
            assert.strictEqual(e.message, 'anonymous: custom message');
        }

        try {
            validator({
                name: 'field1',
                type: 'string',
                required: true,
                message: 'custom message'
            }).validate(123);

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.key, 'field1');
            assert.strictEqual(e.message, 'field1: custom message');
        }

        try {
            validator({
                name: 'field1',
                type: 'string',
                required: true,
                message: 'custom message'
            }).validate();

            assert.fail();
        }
        catch (e) {
            // does not apply for required fields
            assert.strictEqual(e.key, 'field1');
            assert.strictEqual(e.message, 'field1: required');
        }
    });

    it('nested messages', function () {
        try {
            validator({
                type: 'object',
                properties: [
                    {
                        name: 'a',
                        type: 'string'
                    },
                    {
                        name: 'b',
                        type: 'string'
                    }
                ]
            }).validate({ a: 1, b: 2 });

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.key, undefined);
            assert.strictEqual(e.message, 'anonymous: invalid');
            assert(e.errors instanceof Array);
            assert.strictEqual(e.errors.length, 2);

            assert(e.errors[0] instanceof Error);
            assert.strictEqual(e.errors[0].key, 'a');
            assert.strictEqual(e.errors[0].message, 'a: invalid');

            assert(e.errors[1] instanceof Error);
            assert.strictEqual(e.errors[1].key, 'b');
            assert.strictEqual(e.errors[1].message, 'b: invalid');
        }
    });
});