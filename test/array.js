/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('type: array', function () {
    it('required', function () {
        var schema = {
            type: 'array',
            required: true
        };

        assert.throws(function () {
            validator(schema).validate();
        });

        assert.throws(function () {
            validator(schema).validate(null);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
        });
    });

    it('type', function () {
        var schema = {
            type: 'array'
        };

        assert.throws(function () {
            validator(schema).validate('123');
        });

        assert.throws(function () {
            validator(schema).validate(false);
        });

        assert.throws(function () {
            validator(schema).validate({});
        });

        assert.throws(function () {
            validator(schema).validate(Math.PI);
        });

        assert.throws(function () {
            validator('array').validate(123);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator('array').validate([]);
        });
    });

    it('length', function () {
        var schema = {
            type: 'array',
            length: 3
        };

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.throws(function () {
            validator(schema).validate([1, 2]);
        });

        assert.throws(function () {
            validator(schema).validate([1, 2, 3, 4]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([1, 2, 3]);
        });
    });

    it('minLength', function () {
        var schema = {
            type: 'array',
            minLength: 3
        };

        assert.throws(function () {
            validator(schema).validate([]);
        });

        assert.throws(function () {
            validator(schema).validate([1, 2]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([1, 2, 3]);
            validator(schema).validate([1, 2, 3, 4]);
        });
    });

    it('maxLength', function () {
        var schema = {
            type: 'array',
            maxLength: 3
        };

        assert.throws(function () {
            validator(schema).validate([1, 2, 3, 4]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate([1, 2, 3]);
        });
    });

    it('items', function () {
        var schema = {
            type: 'array',
            items: 'string'
        };

        assert.throws(function () {
            validator(schema).validate([null]);
        });

        assert.throws(function () {
            validator(schema).validate([1]);
        });

        assert.throws(function () {
            validator(schema).validate(['a', false, 'b']);
        });

        assert.throws(function () {
            validator(schema).validate(['a', 'b', 1]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([]);
            validator(schema).validate(['a']);
            validator(schema).validate(['a', 'b', 'c']);
        });

        schema = {
            type: 'array',
            items: {
                type: 'object',
                properties: [{
                    name: 'strProp',
                    type: 'string',
                    required: true
                }, {
                    name: 'boolProp',
                    type: 'boolean'
                }]
            }
        };

        assert.throws(function () {
            validator(schema).validate([123]);
        });

        assert.throws(function () {
            validator(schema).validate([{}]);
        });

        assert.throws(function () {
            validator(schema).validate([{
                strProp: 'value',
                boolProp: 123
            }]);
        });

        assert.doesNotThrow(function () {
            validator(schema).validate([{
                strProp: 'value',
                boolProp: false
            }]);
        });
    });
});