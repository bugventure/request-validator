/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js'),
    noop = function () { };

describe('validator', function () {
    it('creates validator instance with no arguments', function () {
        assert(validator().validate instanceof Function);
        assert.strictEqual(validator().validate.length, 1);
    });

    it('creates validator instance with one object argument', function () {
        assert(validator({ type: 'string' }).validate instanceof Function);
        assert.strictEqual(validator({ type: 'string' }).validate.length, 1);
    });

    it('creates middleware with one function argument', function () {
        assert(validator(noop).validate instanceof Function);
        assert.strictEqual(validator(noop).validate.length, 1);
    });

    it('craetes middleware with multiple function arguments', function () {
        assert(validator(noop, noop, noop).validate instanceof Function);
        assert.strictEqual(validator(noop, noop, noop).validate.length, 1);
    });

    it('creates middleware with one object and multiple function arguments', function () {
        assert(validator({ type: 'string' }, noop).validate instanceof Function);
        assert.strictEqual(validator({ type: 'string' }, noop).validate.length, 1);
    });
});