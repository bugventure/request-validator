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
    types = {
        string: [require('./types/string.js')],
        number: [require('./types/number.js')],
        integer: [require('./types/integer.js')],
        boolean: [require('./types/boolean.js')],
        array: [require('./types/array.js')],
        object: [require('./types/object.js')],
        null: [require('./types/null.js')],
        any: [noop]
    };

function Validator(options) {
    this.schema = options.schema;
    this.chain = chain.apply(null, options.handlers);
    this.types = options.types;
    this.strings = options.strings;

    this.validateSchema(this.schema);
}

Validator.prototype.validateSchema = function (schema, withName) {
    var validator = this,
        strings = validator.strings,
        types = validator.types,
        err = new Error(strings.invalidSchema),
        invalidItems;

    // allow null schemas, but do not validate any data
    if (!type.isDefined(schema)) {
        return;
    }

    // validate string-formatted schema
    if (type.isString(schema)) {
        if (!types[schema]) {
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
        validator.validateSchema(schema.type);

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
                    validator.validateSchema(item, true);
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
            validator.validateSchema(schema.items);
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
                validator.validateSchema(item);
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
};

Validator.prototype.fail = function (required, errors) {
    var schema = this.schema,
        strings = this.strings,
        msg = required ? strings.required : (schema.message || strings.invalid),
        key = schema.name || strings.anonymous,
        err = new Error(util.format(strings.format, key, msg));

    err.key = schema.name;

    if (errors) {
        err.errors = errors;
    }

    throw err;
};

Validator.prototype.required = function (value) {
    var schema = this.schema,
        nullAccepted = schema.type === 'null' && value === null,
        valueExists = nullAccepted || type.isDefined(value);

    return schema.required && !valueExists;
};

Validator.prototype.enumerated = function (value) {
    var schema = this.schema,
        arr = schema.enum,
        i;

    if (!type.isArray(arr)) {
        return false;
    }

    for (i = 0; i < arr.length; i++) {
        if (equal(arr[i], value)) {
            return false;
        }
    }

    return true;
};

Validator.prototype.validate = function (value) {
    var schema = this.schema,
        types = this.types,
        validators,
        i;

    if (!schema) {
        return;
    }

    if (type.isString(schema)) {
        schema = { type: schema };
    }

    validators = types[schema.type] || types.any;

    if (this.required(value)) {
        this.fail(true);
    }

    // at this point, having null or undefined is OK
    // because the required validation has passed
    if (!type.isDefined(value)) {
        return;
    }

    if (this.enumerated(value)) {
        this.fail();
    }

    try {
        for (i = 0; i < validators.length; i++) {
            validators[i](schema, value);
        }
    }
    catch (e) {
        this.fail(false, type.isArray(e) ? e : null);
    }
};

Validator.prototype.middleware = function (req, res, next) { // jshint ignore: line
    var params = collector(this.schema, req),
        error = null;

    try {
        this.validate(params);
    }
    catch (e) {
        error = e;
    }

    // create a copy of the validator entry function
    req.validator = create({
        types: this.types,
        strings: this.strings
    });

    req.validator.valid = error === null;
    req.validator.error = error;
    req.validator.params = params;

    this.chain.apply(null, arguments);
};

function validator(context) {  // jshint ignore: line
    var args = Array.prototype.slice.call(arguments, 1),
        schema = type.isFunction(args[0]) ? null : args[0],
        handlers = schema ? args.slice(1) : args,
        inst = new Validator({
            schema: schema,
            handlers: handlers.length ? handlers : [identityHandler],
            types: context.types,
            strings: context.strings
        }),
        middle = inst.middleware.bind(inst);

    // expose only the middleware function bound to the
    // validator instance and having a single validate method
    middle.validate = inst.validate.bind(inst);

    return middle;
}

function use(context, validatedType, validatorFunc) { // jshint ignore: line
    var types = context.types,
        funcs = Array.prototype.slice.call(arguments, 2),
        arr = types[validatedType];

    funcs = funcs.filter(function filterArgs(arg) {
        return type.isFunction(arg);
    });

    if (!type.isString(validatedType)) {
        throw new Error(context.strings.invalidType);
    }

    if (!funcs.length) {
        throw new Error(context.strings.invalidFunction);
    }

    if (!arr) {
        types[validatedType] = funcs;
    }
    else {
        types[validatedType] = arr.concat.apply(arr, funcs);
    }
}

function create(context) {  // jshint ignore: line
    if (!context) {
        context = clone({
            types: types,
            strings: strings
        });
    }

    var instance = validator.bind(null, context);

    instance.use = use.bind(null, context);

    instance.strings = context.strings;

    instance.type = type;
    instance.equal = equal;
    instance.chain = chain;
    instance.clone = clone;
    instance.create = create;

    return instance;
}

module.exports = create();