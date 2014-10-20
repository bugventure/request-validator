/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: string', function () {
    it('required', function () {
        var schema = {
            type: 'string',
            required: true
        };

        assert.throws(function () {
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('abc');
        });
    });

    it('type', function () {
        var schema = { type: 'string' };

        assert.throws(function () {
            validator(schema).validate(123);
        });

        assert.throws(function () {
            validator(schema).validate(true);
        });

        assert.throws(function () {
            validator(schema).validate(false);
        });

        assert.throws(function () {
            validator(schema).validate(0);
        });

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator('string').validate(123);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('abc');
            validator('string').validate('abc');
        });
    });

    it('empty', function () {
        var schema = {
            type: 'string',
            required: true
        };

        assert.throws(function () {
            validator(schema).validate('');
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('a');
        });

        schema.empty = true;

        assert.doesNotThrow(function () {
            validator(schema).validate('');
        });
    });

    it('enum', function () {
        var schema = {
            type: 'string',
            enum: ['a', 'b', 'c']
        };

        assert.throws(function () {
            validator(schema).validate('not in enum');
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('b');
        });
    });

    it('length', function () {
        var schema = {
            type: 'string',
            length: 4
        };

        assert.throws(function () {
            validator(schema).validate('not the correct length');
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('abcd');
        });
    });

    it('minLength', function () {
        var schema = {
            type: 'string',
            minLength: 10
        };

        assert.throws(function () {
            validator(schema).validate('too short');
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('just long enough');
        });
    });

    it('maxLength', function () {
        var schema = {
            type: 'string',
            maxLength: 12
        };

        assert.throws(function () {
            validator(schema).validate('this string is too long');
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('short enough');
        });
    });

    it('pattern', function () {
        var schema = {
            type: 'string',
            pattern: '\\d'
        };

        assert.throws(function () {
            validator(schema).validate('a');
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('1');
        });

        schema = {
            type: 'string',
            pattern: /\d/
        };

        assert.throws(function () {
            validator(schema).validate('a');
        });

        assert.doesNotThrow(function () {
            validator(schema).validate('1');
        });
    });
});