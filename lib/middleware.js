'use strict';

var type = require('./type.js'),
    chain = require('./chain.js'),
    validate = require('./validate.js');

function identityHandler(req, res, next) {
    next();
}

function model(schema, req) {
    // TODO: collect model data from request based on schema
    return {

    };
}

function validatorMiddleware(schema, handlers, req, res, next) { // jshint ignore: line
    var middlewareArgs = Array.apply(null, arguments).slice(2),
        chainedHandlers = handlers.length ? handlers : [identityHandler],
        handlerChain = chain.apply(null, chainedHandlers),
        data = model(schema, req),
        valid = true,
        error = null;

    try {
        validate(schema, data);
    }
    catch (e) {
        valid = false;
        error = e;
    }

    // create a copy of the validator factory
    req.validator = middlewareFactory.bind(null);
    req.validator.valid = valid;
    req.validator.error = error;

    handlerChain.apply(null, middlewareArgs);
}

function middlewareFactory() {    // jshint ignore: line
    var args = Array.apply(null, arguments),
        schema = type.isObject(args[0]) ? args[0] : null,
        handlers = schema ? args.slice(1) : args,
        middleware;

    handlers = handlers.filter(function filter(handler) {
        return type.isFunction(handler);
    });

    middleware = validatorMiddleware.bind(null, schema, handlers);

    middleware.validate = validate.bind(null, schema);

    return middleware;
}

module.exports = middlewareFactory;