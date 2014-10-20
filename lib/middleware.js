'use strict';

var type = require('./type.js'),
    chain = require('./chain.js'),
    collector = require('./collector.js'),
    validator;

function ensureValidator() {
    // because of cross-require, we need to require the validator
    // when it will actually be used and not before that
    return (validator = validator || require('./validator.js'));
}

function identityHandler(req, res, next) {
    next();
}

function validatorMiddleware(schema, handlers, req, res, next) { // jshint ignore: line
    var middlewareArgs = Array.apply(null, arguments).slice(2),
        chainedHandlers = handlers.length ? handlers : [identityHandler],
        handlerChain = chain.apply(null, chainedHandlers),
        params = collector(schema, req),
        error = null;

    try {
        ensureValidator()(schema).validate(params);
    }
    catch (e) {
        error = e;
    }

    // create a copy of the validator entry function
    req.validator = validator.bind(null);
    req.validator.valid = error === null;
    req.validator.error = error;
    req.validator.params = params;

    handlerChain.apply(null, middlewareArgs);
}

function middlewareFactory() {    // jshint ignore: line
    var args = Array.apply(null, arguments),
        schema = type.isFunction(args[0]) ? null : args[0],
        handlers = schema ? args.slice(1) : args;

    ensureValidator().validateSchema(schema);

    handlers = handlers.filter(function filter(handler) {
        return type.isFunction(handler);
    });

    return validatorMiddleware.bind(null, schema, handlers);
}

module.exports = middlewareFactory;