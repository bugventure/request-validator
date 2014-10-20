/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: boolean', function () {
    it('required', function () {
        var schema = {
            type: 'boolean',
            required: true
        };

        assert.throws(function () {
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(false);
            validator(schema).validate(true);
        });
    });

    it('type', function () {
        var schema = {
            type: 'boolean'
        };

        assert.throws(function () {
            validator(schema).validate('123');
        });

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate(Math.PI);
        });

        assert.throws(function () {
            validator('boolean').validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(true);
            validator(schema).validate(false);
            validator('boolean').validate(false);
        });
    });
});