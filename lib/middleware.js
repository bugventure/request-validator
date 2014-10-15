'use strict';

var type = require('./type.js'),
    chain = require('./chain.js'),
    strings = require('./strings.js'),
    commonHandlers = [];

function validatorMiddleware(schema, handler, req, res, next) { // jshint ignore: line
    var middlewareArgs = Array.apply(null, arguments).slice(2),
        handlerChain = commonHandlers.slice(0).concat(handler),
        chainExecutor = chain.apply(null, handlerChain);

    // TODO: implement actual validation and set req.validator

    chainExecutor.apply(null, middlewareArgs);
}

function create(schema, handler) {
    if (!type.isFunction(handler)) {
        throw new Error(strings.handlerRequired);
    }

    return validatorMiddleware.bind(null, schema, handler);
}

function use(handler) {
    if (!type.isFunction(handler)) {
        throw new Error(strings.handlerRequired);
    }

    commonHandlers.push(handler);
}

exports.create = create;
exports.use = use;