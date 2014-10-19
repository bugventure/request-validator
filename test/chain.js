/* global describe, it */
'use strict';

var assert = require('assert'),
    sinon = require('sinon'),
    validator = require('../index.js'),
    req = {},
    res = {},
    next = function () { };

describe('chain', function () {
    it('calls single function', function () {
        var spy = sinon.spy(),
            chain = validator.chain(spy);

        chain(req, res, next);

        assert(spy.calledOnce);
        assert.strictEqual(spy.firstCall.args[0], req);
        assert.strictEqual(spy.firstCall.args[1], res);
        assert.strictEqual(spy.firstCall.args[2], next);
    });

    it('calls two functions in series', function () {
        var stub = sinon.stub(),
            spy = sinon.spy(),
            chain = validator.chain(stub, spy);

        stub.callsArg(2);

        chain(req, res, next);

        assert(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], req);
        assert.strictEqual(stub.firstCall.args[1], res);
        assert.notStrictEqual(stub.firstCall.args[2], next);

        assert(stub.calledBefore(spy));

        assert(spy.calledOnce);
        assert.strictEqual(spy.firstCall.args[0], req);
        assert.strictEqual(spy.firstCall.args[1], res);
        assert.strictEqual(spy.firstCall.args[2], next);
    });

    it('skips successive functions on error', function () {
        var stub = sinon.stub(),
            spy = sinon.spy(),
            next = sinon.spy(),
            chain = validator.chain(stub, spy),
            err = new Error();

        stub.callsArgWith(2, err);

        chain(req, res, next);

        assert(stub.calledOnce);
        assert.strictEqual(stub.firstCall.args[0], req);
        assert.strictEqual(stub.firstCall.args[1], res);
        assert.notStrictEqual(stub.firstCall.args[2], next);

        assert(!spy.called);
        assert(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0], err);
    });
});