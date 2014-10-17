'use strict';

var type = require('./type.js'),
    chain = require('./chain.js');

function identityHandler(req, res, next) {
    next();
}

function model(schema, req) {
    // TODO: collect model data from request based on schema
    return {

    };
}

function validatorMiddleware(schema, handlers, req, res, next) { // jshint ignore: line
    // because of cross-require, we need to require the validator here
    var validator = require('./validator.js'),
        middlewareArgs = Array.apply(null, arguments).slice(2),
        chainedHandlers = handlers.length ? handlers : [identityHandler],
        handlerChain = chain.apply(null, chainedHandlers),
        data = model(schema, req),
        error = null;

    try {
        validator(schema).validate(data);
    }
    catch (e) {
        error = e;
    }

    // create a copy of the validator entry function
    req.validator = validator.bind(null);
    req.validator.valid = error === null;
    req.validator.error = error;

    handlerChain.apply(null, middlewareArgs);
}

function middlewareFactory() {    // jshint ignore: line
    var args = Array.apply(null, arguments),
        schema = type.isObject(args[0]) ? args[0] : null,
        handlers = schema ? args.slice(1) : args;

    handlers = handlers.filter(function filter(handler) {
        return type.isFunction(handler);
    });

    return validatorMiddleware.bind(null, schema, handlers);
}

module.exports = middlewareFactory;