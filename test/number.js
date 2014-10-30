/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: number', function () {
    it('required', function () {
        var schema = {
            type: 'number'
        };

        assert.throws(function () {
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(Math.PI);
            validator(schema).validate(123);
        });
    });

    it('nullable', function () {
        var schema = {
            type: ['number', 'null']
        };

        assert.throws(function () {
            validator(schema).validate(undefined);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(null);
            validator(schema).validate(Math.PI);
        });
    });

    it('type', function () {
        var schema = {
            type: 'number'
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

        assert.doesNotThrow(function () {
            validator(schema).validate(13);
            validator(schema).validate(17.8);
            validator(schema).validate(Math.PI);
        });
    });

    it('enum', function () {
        var schema = {
            type: 'number',
            enum: [1, Math.E, 3, 5, 7]
        };

        assert.throws(function () {
            validator(schema).validate(4);
        });

        assert.throws(function () {
            validator(schema).validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(5);
            validator(schema).validate(Math.E);
        });
    });

    it('minimum', function () {
        var schema = {
            type: 'number',
            minimum: 7
        };

        assert.throws(function () {
            validator(schema).validate(6);
        });

        assert.throws(function () {
            validator(schema).validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(7);
            validator(schema).validate(999);
        });
    });

    it('exclusiveMinimum', function () {
        var schema = {
            type: 'number',
            minimum: 7,
            exclusiveMinimum: true
        };

        assert.throws(function () {
            validator(schema).validate(6);
        });

        assert.throws(function () {
            validator(schema).validate(7);
        });

        assert.throws(function () {
            validator(schema).validate(Math.PI);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(8);
            validator(schema).validate(999);
        });
    });

    it('maximum', function () {
        var schema = {
            type: 'number',
            maximum: 77
        };

        assert.throws(function () {
            validator(schema).validate(77.000001);
        });

        assert.throws(function () {
            validator(schema).validate(78);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(-12);
            validator(schema).validate(76);
            validator(schema).validate(77);
            validator(schema).validate(Math.PI);
        });
    });

    it('exclusiveMaximum', function () {
        var schema = {
            type: 'number',
            maximum: 77,
            exclusiveMaximum: true
        };

        assert.throws(function () {
            validator(schema).validate(77);
        });

        assert.throws(function () {
            validator(schema).validate(78);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(-12);
            validator(schema).validate(75);
            validator(schema).validate(76);
            validator(schema).validate(76.99999);
        });
    });

    it('multipleOf', function () {
        var schema = {
            type: 'number',
            multipleOf: 7
        };

        assert.throws(function () {
            validator(schema).validate(8);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(14);
            validator(schema).validate(-49);
            validator(schema).validate(77);
        });

        schema = {
            type: 'number',
            multipleOf: Math.PI
        };

        assert.throws(function () {
            validator(schema).validate(2.5);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate(3 * Math.PI);
        });
    });
});