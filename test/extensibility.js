/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('extensibility', function () {
    it('can create multiple instances', function () {
        var validator2 = validator.create();

        assert(validator2 instanceof Function);
        assert.notStrictEqual(validator2, validator);
    });

    it('copy has all the extensions', function () {
        var validator2 = validator.create();

        assert.strictEqual(validator2.type, validator.type);
        assert.strictEqual(validator2.equal, validator.equal);
        assert.strictEqual(validator2.chain, validator.chain);
        assert.strictEqual(validator2.create, validator.create);
    });

    it('copy has copies of extensions with state', function () {
        var validator2 = validator.create();

        assert.strictEqual(JSON.stringify(validator2.strings), JSON.stringify(validator.strings));
        assert.notStrictEqual(validator2.strings, validator.strings);
    });
});