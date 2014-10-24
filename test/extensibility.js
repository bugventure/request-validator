/* global describe, it */
'use strict';

var assert = require('assert'),
    sinon = require('sinon'),
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

        assert.notStrictEqual(validator2.use, validator.use);
        assert(validator2.use instanceof Function);
    });

    describe('use', function () {
        it('can register additional type validators', function () {
            var myValidator = function (schema, value) {
                    if (value !== 'hard-coded predefined value') {
                        throw new Error();
                    }
                },
                schema = {
                    title: 'field1',
                    type: ['string', 'null'],
                    message: 'predefined message'
                },
                validator2 = validator.create();

            validator2.use('string', myValidator);

            assert.doesNotThrow(function () {
                validator2(schema).validate(null);
            });

            try {
                validator2(schema).validate('non-matching string');
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.message, 'field1: predefined message');
            }
        });

        it('can register multiple additional type validators', function () {
            var val1 = sinon.spy(),
                val2 = sinon.spy(),
                validator2 = validator.create();

            validator2.use('number', val1, 'this arg is skipped', val2);

            validator2({ type: 'number' }).validate(123);

            assert(val1.calledOnce);
            assert(val2.calledOnce);

            assert(val1.calledBefore(val2));
        });

        it('type validators on new instances do not affect the global instance', function () {
            var myValidator = function (schema, value) {
                    if (value !== 'hard-coded predefined value') {
                        throw new Error();
                    }
                },
                schema = {
                    title: 'field1',
                    type: 'string',
                    message: 'predefined message'
                },
                validator2 = validator.create();

            validator2.use('string', myValidator);

            assert.throws(function () {
                validator2(schema).validate('non-matching string');
            });

            assert.doesNotThrow(function () {
                validator(schema).validate('non-matching string');
            });
        });

        it('extended type validators apply recursively', function () {
            var myValidator = function (schema, value) {
                    if (value !== 'hard-coded predefined value') {
                        throw new Error();
                    }
                },
                schema = {
                    type: 'object',
                    properties: {
                        arr: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    field1: {
                                        type: 'string'
                                    }
                                }
                            }
                        }
                    }
                },
                validator2 = validator.create();

            validator2.use('string', myValidator);

            assert.throws(function () {
                validator2(schema).validate({
                    arr: [{
                        field1: 'non-matching string'
                    }]
                });
            });

            assert.doesNotThrow(function () {
                validator2(schema).validate({
                    arr: [{
                        field1: 'hard-coded predefined value'
                    }]
                });
            });
        });
    });
});