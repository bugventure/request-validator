/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: null', function () {
    it('required', function () {
        var schema = {
            type: 'null'
        };

        assert.throws(function () {
            validator(schema).validate(undefined);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(null);
        });
    });

    it('type', function () {
        var schema = {
            type: 'null'
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

        assert.doesNotThrow(function () {
            validator(schema).validate(null);
        });
    });
});