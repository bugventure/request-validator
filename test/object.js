/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: object', function () {
    it('required', function () {
        var schema = {
            type: 'object',
            required: true
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

        assert.doesNotThrow(function () {
            validator(schema).validate({});
        });
    });

    it('nested graph', function () {
        var schema = {
            type: 'object',
            properties: [
                {
                    name: 'a',
                    type: 'string',
                    required: true
                },
                {
                    name: 'b',
                    type: 'number'
                },
                {
                    name: 'c',
                    type: 'array',
                    items: {
                        type: 'boolean',
                        required: true
                    }
                }
            ]
        };

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
            validator(schema).validate();

            validator(schema).validate(null);

            validator(schema).validate({
                a: 'abc',
                b: 123.4,
                c: [true, false]
            });

            validator(schema).validate({
                a: 'abc',
                b: 0,
                c: null
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