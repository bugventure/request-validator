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

    it.skip('throws if no type validator is found', function () {
        var schema = { type: 'unknown type' };

        assert.throws(function () {
            validator(schema);
        });
    });

    it('throws when child invalid', function () {
        var schema = {
            type: 'object',
            properties: {
                a: { type: 'string' }
            }
        };

        assert.throws(function () {
            validator(schema).validate({ a: 123 });
        });
    });

    it('does not throw when schema is valid', function () {
        assert.doesNotThrow(function () {
            validator('string');
            validator({ type: 'number' });
            validator({ type: 'array', items: 'integer' });
            validator({ type: ['array', 'null'], items: { type: 'string', minLength: 2, maxLength: 2 } });
            validator({ type: 'object', properties: { a: { type: 'string' }, b: 'boolean' } });
        });
    });

    it.skip('throws when schema is invalid', function () {
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
                items: true
            });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                properties: {
                    a: {
                        type: 'object',
                        properties: [{ type: 'string '}]
                    }
                }
            });
        });
    });

    it('required message', function () {
        try {
            validator({
                type: 'string'
            }).validate();

            assert.fail();
        }
        catch (e) {
            assert.strictEqual(e.message, 'anonymous: required');
        }

        try {
            validator({
                title: 'field1',
                type: 'string'
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
                title: 'field1',
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
                title: 'field1',
                type: 'string',
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
                title: 'field1',
                type: 'string',
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
});