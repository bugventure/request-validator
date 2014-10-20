'use strict';

var util = require('util'),
    type = require('./type.js'),
    equal = require('./equal.js'),
    strings = require('./strings.js'),
    chain = require('./chain.js'),
    clone = require('./clone.js'),
    chain = require('./chain.js'),
    collector = require('./collector.js'),
    noop = function () { },
    identityHandler = function (req, res, next) { next(); },
    typeValidators = {
        string: [require('./types/string.js')],
        number: [require('./types/number.js')],
        integer: [require('./types/integer.js')],
        boolean: [require('./types/boolean.js')],
        array: [require('./types/array.js')],
        object: [require('./types/object.js')],
        null: [require('./types/null.js')],
        any: [noop]
    };

function fail(schema, required, errors) {
    var msg = required ? strings.required : (schema.message || strings.invalid),
        key = schema.name || strings.anonymous,
        err = new Error(util.format(strings.format, key, msg));

    err.key = schema.name;

    if (errors) {
        err.errors = errors;
    }

    throw err;
}

function validateRequired(schema, value) {
    var nullAccepted = schema.type === 'null' && value === null,
        valueExists = nullAccepted || type.isDefined(value);

    if (schema.required && !valueExists) {
        fail(schema, true);
    }
}

function validateEnumeration(schema, value) {
    var arr = schema.enum,
        i;

    if (!type.isArray(arr)) {
        return;
    }

    for (i = 0; i < arr.length; i++) {
        if (equal(arr[i], value)) {
            return;
        }
    }

    fail(schema);
}

function validateSchema(schema, withName) {
    var err = new Error(strings.invalidSchema),
        invalidItems;

    // allow null schemas, but do not validate any data
    if (!type.isDefined(schema)) {
        return;
    }

    // validate string-formatted schema
    if (type.isString(schema)) {
        if (!typeValidators[schema]) {
            throw err;
        }

        return;
    }

    // validate object-formatted schema
    if (type.isObject(schema)) {
        if (!type.isString(schema.type)) {
            throw err;
        }

        // validate a name is provided if required
        if (withName && (!type.isString(schema.name) || !schema.name)) {
            throw err;
        }

        // validate the schema describes a supported type
        validateSchema(schema.type);

        if (schema.type === 'object' && type.isDefined(schema.properties)) {
            if (!type.isArray(schema.properties)) {
                throw err;
            }

            invalidItems = schema.properties.filter(function filterItems(item) {
                if (!type.isObject(item)) {
                    // do not allow other than objects here
                    return true;
                }

                try {
                    validateSchema(item, true);
                    return false;
                }
                catch (e) {
                    return true;
                }
            });

            if (invalidItems.length) {
                throw err;
            }
        }
        else if (schema.type === 'array' && type.isDefined(schema.items)) {
            if (!type.isString(schema.items) && !type.isObject(schema.items)) {
                throw err;
            }

            // validate array items as regular schema
            validateSchema(schema.items);
        }

        return;
    }

    // validate array-formatted schemas
    if (type.isArray(schema)) {
        invalidItems = schema.filter(function filterItems(item) {
            if (!type.isString(item) && !type.isObject(item)) {
                // do not allow items other than strings or objects
                return true;
            }

            try {
                // even if type is valid, further validate
                // child item as a separate schema
                validateSchema(item);
                return false;
            }
            catch (e) {
                return true;
            }
        });

        if (invalidItems.length) {
            throw err;
        }
    }

    throw err;
}

function validate(schema, value) {
    if (!schema) {
        return;
    }

    schema = type.isString(schema) ? { type: schema } : schema;

    var validators = typeValidators[schema.type] || typeValidators.any,
        i;

    validateRequired(schema, value);

    // at this point, having null or undefined is OK
    // because the required validation has passed
    if (!type.isDefined(value)) {
        return;
    }

    validateEnumeration(schema, value);

    try {
        for (i = 0; i < validators.length; i++) {
            validators[i](schema, value);
        }
    }
    catch (e) {
        fail(schema, false, e instanceof Array ? e : null);
    }
}

function middleware(schema, handlers, req, res, next) { // jshint ignore: line
    var middlewareArgs = Array.apply(null, arguments).slice(2),
        chainedHandlers = handlers.length ? handlers : [identityHandler],
        handlerChain = chain.apply(null, chainedHandlers),
        params = collector(schema, req),
        error = null;

    try {
        validator(schema).validate(params);
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

function validator() {  // jshint ignore: line
    var args = Array.apply(null, arguments),
        schema = type.isFunction(args[0]) ? null : args[0],
        handlers = schema ? args.slice(1) : args,
        middle;

    validateSchema(schema);

    handlers = handlers.filter(function filter(handler) {
        return type.isFunction(handler);
    });

    // allow the function to do dual-work both as a
    // procedural validator as well as a middleware factory
    middle = middleware.bind(null, schema, handlers);

    // create a copy of validate function with validator map and schema
    middle.validate = validate.bind(null, schema); // jshint ignore: line

    return middle;
}

function create() {
    var map = typeValidators,
        instance = validator.bind(map);

    instance.type = type;
    instance.equal = equal;
    instance.chain = chain;
    instance.clone = clone;
    instance.strings = JSON.parse(JSON.stringify(strings));
    instance.validateSchema = validateSchema.bind(map);
    instance.create = create;

    return instance;
}

module.exports = create();