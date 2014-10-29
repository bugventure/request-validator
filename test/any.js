/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('any', function () {
    it('passes validation on any type', function () {
        var schema = { type: 'any' };

        assert.doesNotThrow(function () {
            validator(schema).validate(null);
            validator(schema).validate(undefined);
            validator(schema).validate(0);
            validator(schema).validate('');
            validator(schema).validate(Math.PI);
            validator(schema).validate('abc');
            validator(schema).validate(77);
            validator(schema).validate(false);
            validator(schema).validate(true);
            validator(schema).validate({});
            validator(schema).validate([]);
        });
    });
});