'use strict';

var util = require('util'),
    type = require('./type.js'),
    equal = require('./equal.js'),
    strings = require('./strings.js'),
    chain = require('./chain.js'),
    clone = require('./clone.js'),
    chain = require('./chain.js'),
    collector = require('./collector.js'),
    metaschema = require('./metaschema.json'),
    noop = function () { },
    schemaValidator,
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
    this.chain = chain.apply(null, options.handlers);
    this.types = options.types;
    this.strings = options.strings;
}

Validator.prototype.formatError = function (schema, value, error) {
    var strings = this.strings,
        key = schema.title || strings.anonymous,
        missing = type.isUndefined(value),
        msg = missing ? strings.required : (schema.message || strings.invalid),
        formatted = util.format(strings.format, key, msg);

    error = error || new Error(formatted);
    error.key = schema.title;

    if (!error.message) {
        error.message = formatted;
    }

    return error;
};

Validator.prototype.required = function (schema, value) {
    var valueType = schema.type,
        nullAccepted =
            (valueType === 'null' ||
                (type.isArray(valueType) &&
                valueType.indexOf('null') > -1)) &&
            value === null;

    return !nullAccepted && !type.isDefined(value);
};

Validator.prototype.notInEnum = function (schema, value) {
    var arr = schema.enum,
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

Validator.prototype.getValidators = function (schema) {
    var types = this.types,
        allowedTypes = type.isArray(schema.type) ? schema.type : [schema.type],
        validators = [];

    allowedTypes.forEach(function forEachType(type) {
        var typeValidators = types[type] || [];

        if (typeValidators.length) {
            validators.push({
                type: type,
                funcs: typeValidators,
                errors: []
            });
        }
    });

    return validators.length ? validators : [types.any];
};

Validator.prototype.validate = function (schema, value) {
    if (!schema) {
        return;
    }

    var instance = this,
        validators = this.getValidators(schema),
        failedValidators;

    if (this.notInEnum(schema, value)) {
        throw this.formatError(schema, value);
    }

    validators.forEach(function forEachValidatorGroup(item) {
        item.funcs.forEach(function forEachValidationFunc(func) {
            if (item.errors.length) {
                // do not call any more validators for this type
                // if an error is already thrown
                return;
            }

            try {
                func(schema, value, instance.validate.bind(instance));
            }
            catch (e) {
                instance.formatError(schema, value, e);
                item.errors.push(e);
            }
        });
    });

    // For validation to pass, we need to have at least one validator
    // group that does not have any errors.
    failedValidators = validators.filter(function filterValidatorGroup(item) {
        return item.errors.length > 0;
    });

    // if all validator groups failed, overall validation fails
    if (failedValidators.length === validators.length) {
        // throw the first registered error
        throw failedValidators[0].errors[0];
    }
};

Validator.prototype.middleware = function (schema) {
    return function validatorMiddleware(req, res, next) {   // jshint ignore: line
        var params = collector(schema, req),
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
    }.bind(this);
};

function validateSchema(schema) {
    if (!type.isDefined(schema)) {
        return;
    }

    if (!schemaValidator) {
        schemaValidator = new Validator({
            schema: metaschema,
            types: types,
            strings: strings
        });
    }

    schemaValidator.validate(schema);
}

function validator(context) {  // jshint ignore: line
    var args = Array.prototype.slice.call(arguments, 1),
        schema = type.isFunction(args[0]) ? null : args[0],
        handlers = schema ? args.slice(1) : args,
        instance,
        middle;

    if (type.isDefined(schema)) {
        if (type.isString(schema) && schema) {
            schema = { type: schema };
        }

        // validateSchema(schema);
    }

    instance = new Validator({
        handlers: handlers,
        types: context.types,
        strings: context.strings
    });

    // expose only the middleware function bound to the
    // validator instance and having a single validate method
    middle = instance.middleware(schema);
    middle.validate = instance.validate.bind(instance, schema);

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