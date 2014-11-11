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
                assert.strictEqual(e.message, 'anonymous: required');
            }

            try {
                validator({
                    title: 'field1',
                    type: 'string'
                }).validate();

                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.message, 'field1: required');
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
                assert.strictEqual(e.message, 'anonymous: invalid');
            }

            try {
                validator({
                    title: 'field1',
                    type: 'string'
                }).validate(123);

                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.message, 'field1: invalid');
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
                assert.strictEqual(e.message, 'anonymous: custom message');
            }

            try {
                validator({
                    title: 'field1',
                    type: 'string',
                    message: 'custom message'
                }).validate(123);

                assert.fail();
            }
            catch (e) {
                assert.strictEqual(e.message, 'field1: custom message');
            }

            try {
                validator({
                    title: 'field1',
                    type: 'string',
                    message: 'custom message'
                }).validate();

                assert.fail();
            }
            catch (e) {
                // does not apply for required fields
                assert.strictEqual(e.message, 'field1: required');
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

            // try {
            //     validator(schema).validate([]);
            //     assert.fail();
            // }
            // catch (e) {
            //     assert.strictEqual(e.key, '');
            //     assert.strictEqual(e.missing, false);
            //     assert.strictEqual(e.required, true);

            //     assert(e.errors instanceof Array);
            //     assert.strictEqual(e.errors.length, 0);
            // }

            // try {
            //     validator(schema).validate([null]);
            //     assert.fail();
            // }
            // catch (e) {
            //     assert.strictEqual(e.key, '');
            //     assert.strictEqual(e.missing, false);
            //     assert.strictEqual(e.required, true);

            //     assert(e.errors instanceof Array);
            //     assert.strictEqual(e.errors.length, 1);

            //     assert.strictEqual(e.errors[0].key, '0');
            //     assert.strictEqual(e.errors[0].missing, false);
            //     assert.strictEqual(e.errors[0].required, false);
            // }

            schema.minLength = 2;
            schema.additionalItems = false;

            // try {
            //     validator(schema).validate([]);
            //     assert.fail();
            // }
            // catch (e) {
            //     assert.strictEqual(e.key, '');
            //     assert.strictEqual(e.missing, false);
            //     assert.strictEqual(e.required, true);

            //     assert(e.errors instanceof Array);
            //     assert.strictEqual(e.errors.length, 2);

            //     assert.strictEqual(e.errors[0].key, '0');
            //     assert.strictEqual(e.errors[0].missing, true);
            //     assert.strictEqual(e.errors[0].required, true);

            //     assert.strictEqual(e.errors[1].key, '1');
            //     assert.strictEqual(e.errors[1].missing, true);
            //     assert.strictEqual(e.errors[1].required, true);
            // }

            // try {
            //     validator(schema).validate([null]);
            //     assert.fail();
            // }
            // catch (e) {
            //     assert.strictEqual(e.key, '');
            //     assert.strictEqual(e.missing, false);
            //     assert.strictEqual(e.required, true);

            //     assert(e.errors instanceof Array);
            //     assert.strictEqual(e.errors.length, 2);

            //     assert.strictEqual(e.errors[0].key, '0');
            //     assert.strictEqual(e.errors[0].missing, false);
            //     assert.strictEqual(e.errors[0].required, true);

            //     assert.strictEqual(e.errors[1].key, '1');
            //     assert.strictEqual(e.errors[1].missing, true);
            //     assert.strictEqual(e.errors[1].required, true);
            // }

            // try {
            //     validator(schema).validate(['abc', 123, 'another value']);
            //     assert.fail();
            // }
            // catch (e) {
            //     assert.strictEqual(e.key, '');
            //     assert.strictEqual(e.missing, false);
            //     assert.strictEqual(e.required, true);

            //     assert(e.errors instanceof Array);
            //     assert.strictEqual(e.errors.length, 0);
            // }
        });
    });
});