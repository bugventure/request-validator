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
});