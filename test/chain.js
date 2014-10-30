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

    it('calls next with error if step function throws', function () {
        var err = new Error(),
            step1 = sinon.stub().throws(err),
            step2 = sinon.stub().callsArg(2),
            next = sinon.spy(),
            chain = validator.chain(step1, step2);

        chain(req, res, next);

        assert(step1.calledOnce);
        assert(!step2.called);
        assert(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0], err);
    });

    it('calls next with no error if step function is not a function', function () {
        var step1 = sinon.stub().callsArg(2),
            step2 = 'absolutely no function',
            next = sinon.spy(),
            chain = validator.chain(step1, step2);

        chain(req, res, next);

        assert(step1.calledOnce);
        assert(next.calledOnce);
        assert.strictEqual(next.firstCall.args[0], undefined);
    });

    it('calls steps multiple times', function () {
        var step1 = sinon.stub().callsArg(2),
            step2 = sinon.stub().callsArg(2),
            next = sinon.spy(),
            chain = validator(step1, step2),
            callCount = 2,
            i;

        for (i = 0; i < callCount; i++) {
            chain(req, res, next);

            assert.strictEqual(step1.callCount, i + 1);
            assert.strictEqual(step2.callCount, i + 1);
            assert.strictEqual(next.callCount, i + 1);
        }
    });
});