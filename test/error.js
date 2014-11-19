/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('error', function () {
    it('throws when invalid', function () {
        var schema = {
            type: 'string'
        };

        assert.throws(function () {
            validator(schema).validate(123);
        });
    });

    it('throws when child invalid', function () {
        var schema = {
            type: 'object',
            properties: {
                a: { type: 'string' }
            }
        };

        assert.throws(function () {
            validator(schema).validate({ a: 123 });
        });
    });

    it('does not throw when schema is valid', function () {
        assert.doesNotThrow(function () {
            validator({ type: 'string' });

            validator({ type: 'number' });

            validator({
                type: 'array',
                items: {
                    type: 'integer'
                }
            });

            validator({
                type: ['array', 'null'],
                items: {
                    type: 'string',
                    minLength: 2,
                    maxLength: 2
                }
            });

            validator({
                type: 'object',
                properties: {
                    a: {
                        type: 'string'
                    },
                    b: {
                        type:
                        'boolean'
                    }
                }
            });

            validator({ type: 'object', dependencies: { } });

            validator({
                type: 'object',
                dependencies: {
                    a: {}
                }
            });

            validator({
                type: 'object',
                dependencies: {
                    a: ['b']
                }
            });
        });
    });

    it('throws when schema is invalid', function () {
        assert.throws(function () {
            validator({ type: 'object', properties: ['string', 'number'] });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                properties: [{ type: 'string' }]
            });
        });

        assert.throws(function () {
            validator({
                type: 'array',
                items: true
            });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                properties: {
                    a: {
                        type: 'object',
                        properties: [{ type: 'string '}]
                    }
                }
            });
        });
    });

    it('throws when dependencies invalid', function () {
        assert.throws(function () {
            validator({
                type: 'object',
                dependencies: null
            });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                dependencies: []
            });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                dependencies: {
                    a: false
                }
            });
        });

        assert.throws(function () {
            validator({
                type: 'object',
                dependencies: {
                    a: []
                }
            });
        });
    });

    describe('messages', function () {
        it('required message', function () {
            try {
                validator({
                    type: 'string'
                }).validate();

                assert.fail();
            }
            catch (e) {
                assert(e.hasOwnProperty('message'));
                assert.strictEqual(e.message, 'required');
            }
        });

        it('invalid message', function () {
            try {
                validator({
                    type: 'string'
                }).validate(123);

                assert.fail();
            }
            catch (e) {
                assert(e.hasOwnProperty('message'));
                assert.strictEqual(e.message, 'invalid');
            }
        });

        it('custom invalid message', function () {
            try {
                validator({
                    type: 'string',
                    message: 'custom message'
                }).validate(123);

                assert.fail();
            }
            catch (e) {
                assert(e.hasOwnProperty('message'));
                assert.strictEqual(e.message, 'custom message');
            }

            try {
                validator({
                    type: 'string',
                    message: 'custom message'
                }).validate();

                assert.fail();
            }
            catch (e) {
                assert(e.hasOwnProperty('message'));
                // does not apply for required fields
                assert.strictEqual(e.message, 'required');
            }
        });

        it('custom required message', function () {
            try {
                validator({
                    type: 'string',
                    requiredMessage: 'custom message'
                }).validate();

                assert.fail();
            }
            catch (e) {
                assert(e.hasOwnProperty('message'));
                assert.strictEqual(e.message, 'custom message');
            }
        });

        it('messages in object graph', function () {
            var schema = {
                type: 'object',
                required: ['a'],
                properties: {
                    a: {
                        type: 'string',
                        requiredMessage: 'custom required message',
                        message: 'custom invalid message'
                    }
                }
            };

            try {
                validator(schema).validate({});
            }
            catch (e) {
                assert(e.hasOwnProperty('message'));
                assert.strictEqual(e.message, 'invalid');

                assert(e.errors[0].hasOwnProperty('message'));
                assert.strictEqual(e.errors[0].message, 'custom required message');
            }

            try {
                validator(schema).validate({ a: 123 });
            }
            catch (e) {
                assert(e.hasOwnProperty('message'));
                assert.strictEqual(e.message, 'invalid');

                assert(e.errors[0].hasOwnProperty('message'));
                assert.strictEqual(e.errors[0].message, 'custom invalid message');
            }
        });
    });

    describe('additional error properties', function () {
        it('value types', function () {
            try {
                validator({
                    type: 'string'
                }).validate(null);

                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.required, true);
                assert.strictEqual(e.missing, false);
            }
        });

        it('object', function () {
            var schema = {
                type: 'object',
                required: ['a', 'b'],
                properties: {
                    a: {
                        type: 'string'
                    },
                    b: {
                        type: 'number'
                    },
                    c: {
                        type: 'boolean'
                    }
                }
            };

            try {
                validator(schema).validate();
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, true);
                assert.strictEqual(e.required, true);
            }

            try {
                validator(schema).validate({});
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert(e.errors instanceof Array);
                assert.strictEqual(e.errors.length, 2);

                assert(e.errors[0] instanceof Error);
                assert.strictEqual(e.errors[0].key, 'a');
                assert.strictEqual(e.errors[0].missing, true);
                assert.strictEqual(e.errors[0].required, true);

                assert(e.errors[1] instanceof Error);
                assert.strictEqual(e.errors[1].key, 'b');
                assert.strictEqual(e.errors[1].missing, true);
                assert.strictEqual(e.errors[1].required, true);
            }

            // put these two constraints into the game for test coverage
            schema.patternProperties = {
                '^a': { type: 'string' }
            };

            schema.dependencies = {
                a: ['b']
            };

            try {
                validator(schema).validate({ a: undefined });
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert(e.errors instanceof Array);
                assert.strictEqual(e.errors.length, 2);

                assert(e.errors[0] instanceof Error);
                assert.strictEqual(e.errors[0].key, 'a');
                assert.strictEqual(e.errors[0].missing, true);
                assert.strictEqual(e.errors[0].required, true);

                assert(e.errors[1] instanceof Error);
                assert.strictEqual(e.errors[1].key, 'b');
                assert.strictEqual(e.errors[1].missing, true);
                assert.strictEqual(e.errors[1].required, true);
            }

            delete schema.patternProperties;
            delete schema.dependencies;

            try {
                validator(schema).validate({ a: 'abc', c: null });
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert(e.errors instanceof Array);
                assert.strictEqual(e.errors.length, 2);

                assert(e.errors[0] instanceof Error);
                assert.strictEqual(e.errors[0].key, 'b');
                assert.strictEqual(e.errors[0].missing, true);
                assert.strictEqual(e.errors[0].required, true);

                assert(e.errors[1] instanceof Error);
                assert.strictEqual(e.errors[1].key, 'c');
                assert.strictEqual(e.errors[1].missing, false);
                assert.strictEqual(e.errors[1].required, false);
            }
        });

        it('object graph', function () {
            var schema = {
                type: 'object',
                properties: {
                    a: {
                        type: 'string'
                    },
                    b: {
                        type: 'number'
                    },
                    c: {
                        type: 'boolean'
                    },
                    d: {
                        type: 'object',
                        properties: {
                            e: { type: 'integer' }
                        },
                        required: ['e']
                    }
                },
                required: ['a', 'b']
            };

            try {
                validator(schema).validate({
                    a: 'abc',
                    b: 123,
                    c: false,
                    d: { }
                });

                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert(e.errors instanceof Array);
                assert.strictEqual(e.errors.length, 1);

                assert(e.errors[0] instanceof Error);
                assert.strictEqual(e.errors[0].key, 'd');
                assert.strictEqual(e.errors[0].missing, false);
                assert.strictEqual(e.errors[0].required, false);

                assert(e.errors[0].errors instanceof Array);
                assert.strictEqual(e.errors[0].errors.length, 1);

                assert.strictEqual(e.errors[0].errors[0].key, 'e');
                assert.strictEqual(e.errors[0].errors[0].missing, true);
                assert.strictEqual(e.errors[0].errors[0].required, true);
            }
        });

        it('array with items: object', function () {
            var schema = {
                type: 'array',
                items: {
                    type: 'string'
                }
            };

            try {
                validator(schema).validate();
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, true);
                assert.strictEqual(e.required, true);
            }

            try {
                validator(schema).validate(null);
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);
            }

            try {
                validator(schema).validate([123]);
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert(e.errors instanceof Array);
                assert.strictEqual(e.errors.length, 1);
                assert.strictEqual(e.errors[0].key, '0');
                assert.strictEqual(e.errors[0].missing, false);
                assert.strictEqual(e.errors[0].required, false);
            }
        });

        it('array with items: schema', function () {
            var schema = {
                type: 'array',
                items: [
                    { type: 'string' },
                    { type: 'number' }
                ]
            };

            try {
                // no inner error when value is missing
                validator(schema).validate();
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, true);
                assert.strictEqual(e.required, true);

                assert.strictEqual(e.errors, undefined);
            }

            try {
                // no inner error when violating type
                validator(schema).validate(null);
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert.strictEqual(e.errors, undefined);
            }

            try {
                validator(schema).validate([null]);
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert(e.errors instanceof Array);
                assert.strictEqual(e.errors.length, 1);

                assert.strictEqual(e.errors[0].key, '0');
                assert.strictEqual(e.errors[0].missing, false);
                assert.strictEqual(e.errors[0].required, false);
            }

            schema.minItems = 2;
            schema.additionalItems = false;

            try {
                // no inner errors when viloating minItems only
                validator(schema).validate([]);
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert.strictEqual(e.errors, undefined);
            }

            try {
                // inner error when violating item schema and all
                // inner items are required
                validator(schema).validate([null, null]);
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert(e.errors instanceof Array);
                assert.strictEqual(e.errors.length, 2);

                assert.strictEqual(e.errors[0].key, '0');
                assert.strictEqual(e.errors[0].missing, false);
                assert.strictEqual(e.errors[0].required, true);

                assert.strictEqual(e.errors[1].key, '1');
                assert.strictEqual(e.errors[1].missing, false);
                assert.strictEqual(e.errors[1].required, true);
            }

            try {
                // no inner errors when violating additionalItems: false
                validator(schema).validate(['abc', 123, 'another value']);
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert.strictEqual(e.errors, undefined);
            }
        });

        it('with custom validator function', function () {
            var validator2 = validator.create(),
                myFunc = function (schema, value) { // jshint ignore: line
                    throw new Error();
                };

            validator2.use('string', myFunc);

            try {
                validator2({ type: 'string' }).validate('abc');
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, '');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, true);

                assert.strictEqual(e.errors, undefined);
            }
        });

        it('with custom validator function that sets propeties to error', function () {
            var validator2 = validator.create(),
                myFunc = function (schema, value) { // jshint ignore: line
                    var err = new Error('my custom message');
                    err.key = 'my custom key';
                    err.required = false;

                    throw err;
                };

            validator2.use('string', myFunc);

            try {
                validator2({ type: 'string' }).validate('abc');
                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.key, 'my custom key');
                assert.strictEqual(e.missing, false);
                assert.strictEqual(e.required, false);

                assert.strictEqual(e.errors, undefined);
            }
        });
    });
});