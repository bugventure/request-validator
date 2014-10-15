/* global describe, it */
'use strict';

var assert = require('assert'),
    sinon = require('sinon'),
    validator = require('../index.js'),
    noop = function () { };

describe('middleware', function () {
    it('throws on create if second arg is not a function', function () {
        assert.throws(function () {
            validator();
        });
    });

    it('does not throw on create if furst arg is null', function () {
        assert.doesNotThrow(function () {
            validator(null, noop);
        });
    });

    it('returns a function on create', function () {
        assert(validator(null, noop) instanceof Function);
    });

    it('middleware function has arity 3', function () {
        var middleware = validator(null, noop);
        assert.strictEqual(middleware.length, 3);

        middleware();
    });

    it('calls handler as a callback', function () {
        var spy = sinon.spy(),
            middleware = validator(null, spy),
            req = {},
            res = {},
            next = noop;

        middleware(req, res, next);

        assert(spy.calledOnce);
        assert.strictEqual(spy.firstCall.args[0], req);
        assert.strictEqual(spy.firstCall.args[1], res);
        assert.strictEqual(spy.firstCall.args[2], next);
    });

    it('calls common handler', function () {
        var stub1 = sinon.stub(),
            stub2 = sinon.stub(),
            spy = sinon.spy(),
            middleware = validator(null, spy),
            req = {},
            res = {},
            next = noop;

        //make stubs call their next parameters
        stub1.callsArg(2);
        stub2.callsArg(2);

        validator.use(stub1);
        validator.use(stub2);

        middleware(req, res, next);

        assert(stub1.calledOnce);
        assert.strictEqual(stub1.firstCall.args[0], req);
        assert.strictEqual(stub1.firstCall.args[1], res);

        assert(stub2.calledOnce);
        assert.strictEqual(stub2.firstCall.args[0], req);
        assert.strictEqual(stub2.firstCall.args[1], res);

        assert(spy.calledOnce);
        assert.strictEqual(spy.firstCall.args[0], req);
        assert.strictEqual(spy.firstCall.args[1], res);
        assert.strictEqual(spy.firstCall.args[2], next);
    });

    it('does not call sucessive chained common handlers on error', function () {
        var stub1 = sinon.stub(),
            stub2 = sinon.stub(),
            spy = sinon.spy(),
            err = new Error(),
            middleware = validator(null, spy),
            req = {},
            res = {},
            next = sinon.spy();

        // simulate error in first middleware in chain
        stub1.callsArgWith(2, err);

        // simulate hypothetic forwarded next call
        stub2.callsArg(2);

        validator.use(stub1);
        validator.use(stub2);

        middleware(req, res, next);

        assert(stub1.calledOnce);
        assert(!stub2.called);
        assert(!spy.called);

        assert(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0], err);
    });
});