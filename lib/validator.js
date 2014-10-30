'use strict';

var util = require('util'),
    type = require('./type.js'),
    equal = require('./equal.js'),
    strings = require('./strings.js'),
    chain = require('./chain.js'),
    clone = require('./clone.js'),
    chain = require('./chain.js'),
    collector = require('./collector.js'),
    refRegex = /^#?(\/?\w+)*$/,
    metaschema = require('./metaschema.json'),
    noop = function () { },
    types = {
        string: [require('./types/string.js')],
        number: [require('./types/number.js')],
        integer: [require('./types/integer.js')],
        boolean: [require('./types/boolean.js')],
        array: [require('./types/array.js')],
        object: [require('./types/object.js')],
        null: [require('./types/null.js')],
        any: [noop]
    },
    multi = {
        allOf: require('./multi/allOf.js'),
        anyOf: require('./multi/anyOf.js'),
        oneOf: require('./multi/oneOf.js'),
        not: require('./multi/not.js')
    };

function Validator(options) {
    this.rootSchema = options.schema;
    this.chain = chain.apply(null, options.handlers);
    this.types = options.types;
    this.strings = options.strings;
}

Validator.prototype.getValidators = function (schema) {
    var types = this.types,
        allowedTypes = type.isArray(schema.type) ? schema.type : [schema.type],
        validators = [];

    allowedTypes.forEach(function forEachType(type) {
        var typeValidators = types[type] || types.any;

        validators.push({
            type: type,
            funcs: typeValidators,
            errors: []
        });
    });

    return validators;
};

Validator.prototype.getMultiValidator = function (schema) {
    var keys = Object.keys(multi),
        key,
        i;

    for (i = 0; i < keys.length; i++) {
        key = keys[i];

        if (type.isArray(schema[key]) ||
            (key === 'not' && type.isObject(schema[key]))) {
            return multi[key];
        }
    }
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

Validator.prototype.validate = function (schema, value) {
    if (!schema) {
        return;
    }

    schema = this.resolve(schema);

    var inst = this,
        multiValidator = inst.getMultiValidator(schema),
        validators,
        failedValidators;

    if (multiValidator) {
        return multiValidator.call(inst, schema, value);
    }

    validators = inst.getValidators(schema);

    // if (!validators.length) {
    //     throw new Error(inst.strings.validatorNotFound);
    // }

    if (inst.notInEnum(schema, value)) {
        throw inst.formatError(value);
    }

    validators.forEach(function forEachValidatorGroup(item) {
        item.funcs.forEach(function forEachValidationFunc(func) {
            if (item.errors.length) {
                // do not call any more validators for this type
                // if an error is already thrown
                return;
            }

            try {
                func.call(inst, schema, value);
            }
            catch (e) {
                inst.formatError(schema, value, e);
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

Validator.prototype.middleware = function () {
    return function validatorMiddleware(req, res, next) {   // jshint ignore: line
        var params = collector(this.rootSchema, req),
            error = null;

        try {
            this.validate(this.rootSchema, params);
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

Validator.prototype.resolve = function (schema) {
    var root = this.rootSchema,
        ref = schema.$ref,
        err = new Error(util.format(strings.invalidReference, ref)),
        path,
        refSchema,
        valid;

    if (type.isUndefined(ref)) {
        return schema;
    }

    if (!type.isString(ref) || !ref || !refRegex.test(ref)) {
        throw err;
    }

    path = ref.split('#')[1];

    if (path) {
        path = path.split('/').join('.');

        if (path[0] === '.') {
            path = path.substr(1);
        }

        refSchema = collector.get(root, path);

        // For a resolved schema to be valid, it needs to be an object
        // and not contain another reference.
        valid = type.isObject(refSchema) && !type.isString(refSchema.$ref);

        if (!valid) {
            throw err;
        }

        return refSchema;
    }

    if (!type.isString(root.type)) {
        throw err;
    }

    return root;
};

Validator.prototype.validateReferences = function (schema) {
    var inst = this;
    if (type.isObject(schema)) {
        if (schema.hasOwnProperty('$ref')) {
            // expect to throw;
            inst.resolve(schema);
        }
        else if (schema.hasOwnProperty('properties')) {
            Object.keys(schema.properties).forEach(function forEachKey(key) {
                inst.validateReferences(schema[key]);
            });
        }
    }
    // else if (type.isArray(schema)) {
    //     inst.validateReferences(schema.items);
    // }
};

Validator.prototype.validateSchema = function () {
    if (!type.isDefined(this.rootSchema)) {
        return;
    }

    var schemaValidator = new Validator({
        schema: metaschema,
        types: types,
        strings: this.strings
    });

    schemaValidator.validate(metaschema, this.rootSchema);

    this.validateReferences(this.rootSchema);
};

function factory(context) {
    return function validator(schema) {
        var args = Array.prototype.slice.call(arguments),
            handlers,
            instance,
            middle;

        schema = type.isFunction(schema) ? null : schema;
        handlers = schema ? args.slice(1) : args;

        instance = new Validator({
            schema: schema,
            handlers: handlers,
            types: context.types,
            strings: context.strings
        });

        instance.validateSchema();

        // expose only the middleware function bound to the
        // validator instance and having a single validate method
        middle = instance.middleware();
        middle.validate = instance.validate.bind(instance, schema);

        return middle;
    }.bind(null);
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

    var instance = factory(context);

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