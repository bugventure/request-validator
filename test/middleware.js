/* global describe, it */
'use strict';

var assert = require('assert'),
    sinon = require('sinon'),
    validator = require('../index.js'),
    noop = function () { };

describe('middleware', function () {
    it('creates middleware with no arguments', function () {
        assert(validator() instanceof Function);
        assert.strictEqual(validator().length, 3);
    });

    it('craetes middleware with one object argument', function () {
        assert(validator({ type: 'string' }) instanceof Function);
        assert.strictEqual(validator({ type: 'string' }).length, 3);
    });

    it('creates middleware with one function argument', function () {
        assert(validator(noop) instanceof Function);
        assert.strictEqual(validator(noop).length, 3);
    });

    it('craetes middleware with multiple function arguments', function () {
        assert(validator(noop, noop, noop) instanceof Function);
        assert.strictEqual(validator(noop, noop, noop).length, 3);
    });

    it('creates middleware with one object and multiple function arguments', function () {
        assert(validator({ type: 'string' }, noop) instanceof Function);
        assert.strictEqual(validator({ type: 'string' }, noop).length, 3);
    });

    it('calls next without a handler', function () {
        var next = sinon.spy(),
            middleware = validator();

        middleware({}, {}, next);

        assert(next.calledOnce);
        assert.strictEqual(next.firstCall.args.length, 0);
    });

    it('calls handler as a callback', function () {
        var spy = sinon.spy(),
            middleware = validator(spy),
            req = {},
            res = {},
            next = noop;

        middleware(req, res, next);

        assert(spy.calledOnce);
        assert.strictEqual(spy.firstCall.args[0], req);
        assert.strictEqual(spy.firstCall.args[1], res);
        assert.strictEqual(spy.firstCall.args[2], next);
    });

    it('calls chained handlers', function () {
        var stub1 = sinon.stub(),
            stub2 = sinon.stub(),
            spy = sinon.spy(),
            middleware = validator(stub1, stub2, spy),
            req = {},
            res = {},
            next = noop;

        //make stubs call their next parameters
        stub1.callsArg(2);
        stub2.callsArg(2);

        middleware(req, res, next);

        assert(stub1.calledOnce);
        assert.strictEqual(stub1.firstCall.args[0], req);
        assert.strictEqual(stub1.firstCall.args[1], res);

        assert(stub1.calledBefore(stub2));

        assert(stub2.calledOnce);
        assert.strictEqual(stub2.firstCall.args[0], req);
        assert.strictEqual(stub2.firstCall.args[1], res);

        assert(stub2.calledBefore(spy));

        assert(spy.calledOnce);
        assert.strictEqual(spy.firstCall.args[0], req);
        assert.strictEqual(spy.firstCall.args[1], res);
        assert.strictEqual(spy.firstCall.args[2], next);
    });

    it('does not call sucessive chained handlers on error', function () {
        var stub1 = sinon.stub(),
            stub2 = sinon.stub(),
            spy = sinon.spy(),
            err = new Error(),
            middleware = validator(stub1, stub2, spy),
            req = {},
            res = {},
            next = sinon.spy();

        // simulate error in first middleware in chain
        stub1.callsArgWith(2, err);

        // simulate hypothetic forwarded next call
        stub2.callsArg(2);

        middleware(req, res, next);

        assert(stub1.calledOnce);
        assert(!stub2.called);
        assert(!spy.called);

        assert(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0], err);

        assert(stub1.calledBefore(next));
    });

    it('validates according to schema', function () {
        var schema = {
                type: 'object',
                properties: {
                    a: {
                        type: 'string',
                        source: 'body'
                    }
                },
                required: ['a']
            },
            spy = sinon.spy(),
            middleware = validator(schema, spy),
            req = { body: { a: 123 }},
            res = {},
            next = noop;

        middleware(req, res, next);

        assert(spy.calledOnce);
        assert.strictEqual(req.validator.valid, false);
        assert.deepEqual(req.validator.params, req.body);

        req.body.a = 'abc';

        middleware(req, res, next);

        assert(spy.calledTwice);
        assert.strictEqual(req.validator.valid, true);
        assert.deepEqual(req.validator.params, req.body);
    });
});

describe('req.validator', function () {
    it('req.validator is a function', function () {
        var spy = sinon.spy(),
            middleware = validator(spy),
            req = {},
            res = {},
            next = noop;

        middleware(req, res, next);

        assert(spy.calledOnce);
        assert.strictEqual(spy.firstCall.args[0], req);
        assert(req.validator instanceof Function);
    });

    it('req.validator(schema).validate is a function', function () {
        var middleware = validator(),
            req = {},
            res = {},
            next = noop;

        middleware(req, res, next);

        assert(req.validator().validate instanceof Function);
    });

    it('req.validator is a working validator copy', function () {
        var middleware = validator(),
            req = {};

        middleware(req, {}, noop);

        assert.notStrictEqual(req.validator, validator);

        assert.throws(function () {
            req.validator('string').validate(123);
        });
    });

    it('req.validator.valid', function () {
        var middleware = validator(),
            req = {};

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.valid, true);

        middleware = validator({
            title: 'prop1',
            type: 'string',
            source: 'body'
        });

        req = {
            body: {
                prop1: 123
            }
        };

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.valid, false);
    });

    it('req.validator.error', function () {
        var middleware = validator(),
            req = {
                body: {
                    prop1: 123
                }
            };

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.error, null);

        middleware = validator({
            title: 'prop1',
            type: 'string',
            source: 'body'
        });

        middleware(req, {}, noop);

        assert(req.validator.error instanceof Error);
    });

    it('req.validator.params', function () {
        var req = {
                body: {
                    prop1: 123,
                    prop2: 'abc'
                }
            },
            middleware = validator({
                type: 'number',
                source: 'body.prop1'
            });

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.params, req.body.prop1);

        middleware = validator({
            type: 'string',
            source: 'body.prop3'
        });

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.params, undefined);

        middleware = validator({
            type: 'object',
            properties: {
                prop1: {
                    type: 'number',
                    source: 'body'
                },
                prop2: {
                    type: 'string'
                }
            }
        });

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.params.prop1, req.body.prop1);
        assert.strictEqual(req.validator.params.prop2, undefined);

        middleware = validator({
            type: 'object',
            source: 'body'
        });

        middleware(req, {}, noop);

        assert.deepEqual(req.validator.params, req.body);

        middleware = validator({
            type: 'array',
            items: {
                type: 'string',
                source: 'body.prop2'
            }
        });

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.params[0], req.body.prop2);

        middleware = validator({
            type: 'array',
            items: [
                {
                    type: 'number',
                    source: 'body.prop1'
                },
                {
                    type: 'string',
                    source: 'body.prop2'
                },
                {
                    type: 'boolean',
                    source: 'body.prop3'
                }
            ]
        });

        middleware(req, {}, noop);

        assert.strictEqual(req.validator.params.length, 3);
        assert.strictEqual(req.validator.params[0], req.body.prop1);
        assert.strictEqual(req.validator.params[1], req.body.prop2);
        assert.strictEqual(req.validator.params[2], undefined);
    });
});