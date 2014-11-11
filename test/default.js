/* global describe, it */
'use strict';

var assert = require('assert'),
    sinon = require('sinon'),
    validator = require('../index.js');

describe('default', function () {
    it('method exists', function () {
        assert(validator({ type: 'string' }).default instanceof Function);
    });

    it('simple types', function () {
        var schemas = [
            {
                type: 'string',
                default: 'abc'
            },
            {
                type: 'number',
                default: Math.PI
            },
            {
                type: 'integer',
                default: 17
            },
            {
                type: 'boolean',
                default: true
            },
            {
                type: 'null',
                default: null
            }
        ];

        schemas.forEach(function forEachSchema(schema) {
            var nonDefault = {};

            // returns default value if undefined
            assert.strictEqual(validator(schema).default(), schema.default);

            // returns nonDefault
            assert.strictEqual(validator(schema).default(nonDefault), nonDefault);
        });
    });

    it('does not validate default value', function () {
        var schema = {
            type: 'string',
            default: 123
        };

        assert.doesNotThrow(function () {
            var defaultValue = validator(schema).default();
            assert.strictEqual(defaultValue, schema.default);
        });
    });

    it('object', function () {
        var schema = {
            type: 'object',
            default: {}
        };

        assert.notStrictEqual(validator(schema).default(), schema.default);
        assert.deepEqual(validator(schema).default(), schema.default);

        schema = {
            type: 'object',
            default: {},
            properties: {
                a: {
                    type: 'string',
                    default: 'abc'
                },
                b: {
                    type: 'array',
                    default: [],
                    items: [
                        {
                            type: 'number',
                            default: 17
                        }
                    ]
                },
                c: {
                    type: 'object',
                    default: {},
                    properties: {
                        d: {
                            type: 'boolean',
                            default: true
                        }
                    }
                }
            }
        };

        // nested defaults will be recursively added to parent's default object
        assert.deepEqual(validator(schema).default(), {
            a: 'abc',
            b: [17],
            c: {
                d: true
            }
        });
    });

    it('object graph', function () {
        var schema = {
                type: 'object',
                properties: {
                    a: {
                        type: 'string',
                        default: 'abc'
                    },
                    b: {
                        type: 'number'
                    },
                    obj: {
                        type: 'object',
                        properties: {
                            c: {
                                type: 'boolean',
                                default: true
                            }
                        }
                    }
                },
                required: ['a', 'b']
            };

        assert.deepEqual(validator(schema).default(), undefined);

        assert.deepEqual(validator(schema).default({}), { a: 'abc' });

        assert.deepEqual(validator(schema).default({ obj: {} }),
            { a: 'abc', obj: { c: true } }
        );
    });

    it('array', function () {
        var schema = {
            type: 'array',
            default: []
        };

        assert.notStrictEqual(validator(schema).default(), schema.default);
        assert.deepEqual(validator(schema).default(), schema.default);

        schema.items = [
            { type: 'string', default: 'abc' },
            {
                type: 'object',
                default: {},
                properties: {
                    a: {
                        type: 'number',
                        default: 17
                    }
                }
            }
        ];

        // nested defaults will be recursively added to parent's default object
        assert.deepEqual(validator(schema).default(), ['abc', { a: 17 }]);
    });

    it('array items: array', function () {
        var schema = {
            type: 'array',
            items: [
                {
                    type: 'string',
                    default: 'abc'
                },
                {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'number',
                            default: Math.PI
                        }
                    }
                }
            ]
        };

        assert.deepEqual(validator(schema).default(), undefined);

        assert.deepEqual(validator(schema).default([]), ['abc']);

        assert.deepEqual(validator(schema).default([undefined, {}]),
            ['abc', { a: Math.PI }]);
    });

    it('array items: object', function () {
        var schema = {
            type: 'array',
            items: {
                type: 'string',
                default: 'abc'
            }
        };

        assert.deepEqual(validator(schema).default(), undefined);

        assert.deepEqual(validator(schema).default([]), []);

        // existing positions are filled up with default values, if possible
        assert.deepEqual(validator(schema).default([undefined]), ['abc']);

        schema.items = {
            type: 'object',
            properties: {
                a: {
                    type: 'string',
                    default: 'abc'
                }
            }
        };

        // no complex types will be automatically created
        assert.deepEqual(validator(schema).default([]), []);

        assert.deepEqual(validator(schema).default([{}, {}]),
            [{ a: 'abc' }, { a: 'abc' }]);
    });

    it('middleware', function () {
        var schema = {
                type: 'object',
                properties: {
                    a: {
                        type: 'string',
                        source: 'body',
                        default: 'abc'
                    },
                    b: {
                        type: 'number',
                        source: 'params',
                        default: 17
                    }
                },
                required: ['a', 'b']
            },
            spy = sinon.spy(),
            middleware = validator(schema, spy),
            req =  { body: {}, params: {} },
            res = {},
            next = function () { };

        middleware(req, res, next);

        assert(spy.calledOnce);
        assert(!req.validator.valid);
        assert.deepEqual(req.validator.params, { a: 'abc', b: 17 });

        req.body.a = 'def';
        req.params.b = 0;

        middleware(req, res, next);

        assert(spy.calledTwice);
        assert(req.validator.valid);
    });
});