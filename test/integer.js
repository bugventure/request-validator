/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: integer', function () {
    it('required', function () {
        var schema = {
            type: 'integer',
            required: true
        };

        assert.throws(function () {
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(123);
        });
    });

    it('type', function () {
        var schema = {
            type: 'integer'
        };

        assert.throws(function () {
            validator(schema).validate('123');
        });

        assert.throws(function () {
            validator(schema).validate(true);
        });

        assert.throws(function () {
            validator(schema).validate(false);
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
            validator(schema).validate(13);
        });
    });

    it('enum', function () {
        var schema = {
            type: 'integer',
            enum: [1, 3, 5, 7]
        };

        assert.throws(function () {
            validator(schema).validate(4);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(5);
        });
    });

    it('min', function () {
        var schema = {
            type: 'integer',
            min: 7
        };

        assert.throws(function () {
            validator(schema).validate(6);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(7);
            validator(schema).validate(999);
        });
    });

    it('max', function () {
        var schema = {
            type: 'integer',
            max: 77
        };

        assert.throws(function () {
            validator(schema).validate(78);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(-12);
            validator(schema).validate(76);
            validator(schema).validate(77);
        });
    });

    it('divisibleBy', function () {
        var schema = {
            type: 'integer',
            divisibleBy: 7
        };

        assert.throws(function () {
            validator(schema).validate(8);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(14);
            validator(schema).validate(-49);
            validator(schema).validate(77);
        });
    });
});