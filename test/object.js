/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe.skip('type: object', function () {
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
            validator.validate([]);
        });

        assert.throws(function () {
            validator.validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator.validate({});
        });
    });
});