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

Validator.prototype.fail = function (schema, required, errors) {
    var strings = this.strings,
        msg = required ? strings.required : (schema.message || strings.invalid),
        key = schema.title || strings.anonymous,
        err = new Error(util.format(strings.format, key, msg));

    err.key = schema.title;

    if (errors) {
        err.errors = errors;
    }

    throw err;
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
        allValid,
        i;

    // if (this.required(value)) {
    //     this.fail(schema, true);
    // }

    // // at this point, having null or undefined is OK
    // // because the required validation has passed
    // if (!type.isDefined(value)) {
    //     return;
    // }

    if (this.notInEnum(schema, value)) {
        this.fail(schema);
    }

    validators.forEach(function forEachValidatorGroup(item) {
        item.funcs.forEach(function forEachValidationFunc(func) {
            try {
                func(schema, value, instance.validate.bind(instance));
            }
            catch (e) {
                item.errors.push(e);
            }
        });
    });

    // For validation to pass, we need to have at least one validation
    // group that does not have any errors for a single type.
    allValid = validators.filter(function filterValidatorGroup(item) {
        return !item.errors.length;
    }).length > 0;

    if (!allValid) {
        this.fail(schema);
    }

    // for (i = 0; i < validators.length; i++) {
    //     try {
    //         validators[i](schema, value);
    //     }
    //     catch (e) {
    //         failedType = typeValidators[]
    //         typeErrors.push(e);
    //     }
    // }

    // if (typeErrors.length === valueTypes.length) {
    //     console.log(typeErrors);
    //     // some type validation failed
    //     this.fail(schema);
    // }

    // try {
    //     for (i = 0; i < validators.length; i++) {
    //         validators[i](schema, value);
    //     }
    // }
    // catch (e) {
    //     this.fail(schema, false, type.isArray(e) ? e : null);
    // }
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