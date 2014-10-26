/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('multi schema', function () {
    it('allOf', function () {
        var myValidator = function (schema, value) {
                var str = Object.prototype.toString.call(value);

                if (str !== '[object Number]') {
                    throw new Error();
                }
            },
            schema = {
                allOf: [
                    { type: 'number' },
                    { type: 'integer' },
                    { type: 'customNumber' }
                ]
            },
            validator2 = validator.create();

        validator2.use('customNumber', myValidator);

        assert.throws(function () {
            validator2(schema).validate(null);
        });

        assert.throws(function () {
            validator2(schema).validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator2(schema).validate(0);
            validator2(schema).validate(777);
            validator2(schema).validate(-9);
        });
    });

    it('anyOf', function () {
        var schema = {
            anyOf: [
                { type: 'string' },
                { type: 'number' }
            ]
        };

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.throws(function () {
            validator(schema).validate(true);
        });

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('abc');
            validator(schema).validate(123);
            validator(schema).validate('');
            validator(schema).validate(0);
        });
    });

    it('oneOf', function () {
        var schema = {
            oneOf: [
                { type: 'number', maximum: 5 },
                { type: 'number', minimum: 3 }
            ]
        };

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.throws(function () {
            validator(schema).validate(true);
        });

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.throws(function () {
            // matches both validators
            validator(schema).validate(3);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(0);
            validator(schema).validate(1);
            validator(schema).validate(2);
            validator(schema).validate(6);
            validator(schema).validate(17);
        });
    });

    it('not', function () {
        var schema = {
            not: {
                type: 'array'
            }
        };

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(0);
            validator(schema).validate(false);
            validator(schema).validate('abc');
            validator(schema).validate({});
            validator(schema).validate(null);
            validator(schema).validate();
        });
    });
});