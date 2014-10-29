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
    this.schema = options.schema;
    this.chain = chain.apply(null, options.handlers);
    this.types = options.types;
    this.strings = options.strings;
    this.validator = options.validator;
}

Validator.prototype.getValidators = function () {
    var schema = this.schema,
        types = this.types,
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

    return validators;
};

Validator.prototype.getMultiValidator = function () {
    var schema = this.schema,
        keys = Object.keys(multi),
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

Validator.prototype.notInEnum = function (value) {
    var arr = this.schema.enum,
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

Validator.prototype.formatError = function (value, error) {
    var schema = this.schema,
        strings = this.strings,
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

Validator.prototype.validate = function (value) {
    if (!this.schema) {
        return;
    }

    var inst = this,
        schema = inst.schema,
        multiValidator = inst.getMultiValidator(schema),
        validators,
        failedValidators;

    if (multiValidator) {
        return multiValidator(schema, value, inst.validator);
    }

    validators = inst.getValidators();

    // if (!validators.length) {
    //     throw new Error(inst.strings.validatorNotFound);
    // }

    if (inst.notInEnum(value)) {
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
                func(schema, value, inst.validator);
            }
            catch (e) {
                inst.formatError(value, e);
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
    }.bind(this);
};

Validator.prototype.resolveReferences = function (schema) {
    var inst = this,
        root = inst.schema,
        ref,
        path,
        refSchema;

    if (!schema) {
        schema = clone(root);
    }

    if (!type.isObject(schema)) {
        return schema;
    }

    if (schema.hasOwnProperty('$ref')) {
        ref = schema.$ref;

        if (!type.isString(ref) || !ref || !refRegex.test(ref)) {
            throw new Error();
        }

        path = ref.split('#')[1];

        if (path) {
            path = path.split('/').join('.');

            if (path[0] === '.') {
                path = path.substr(1);
            }

            refSchema = collector.get(root, path);

            if (!type.isObject(refSchema) || !type.isString(refSchema.type)) {
                throw new Error();
            }

            return refSchema;
        }
        else {
            if (!type.isString(root.type)) {
                throw new Error();
            }

            return root;
        }
    }
    else {
        Object.keys(schema).forEach(function forEachKey(key) {
            schema[key] = inst.resolveReferences(schema[key]);
        });
    }

    return schema;
};

Validator.prototype.validateSchema = function () {
    var schema = this.resolveReferences();

    if (!type.isDefined(schema)) {
        return;
    }

    // temporarily replace schema with meta schema and validate the former
    this.schema = metaschema;
    this.validate(schema);

    return (this.schema = schema);
};

function factory(context) {
    return function validator(skipSchemaValidation, schema) {
        var args = Array.prototype.slice.call(arguments, 1),
            handlers,
            instance,
            middle;

        schema = type.isFunction(schema) ? null : schema;
        handlers = schema ? args.slice(1) : args;

        if (type.isDefined(schema)) {
            if (type.isString(schema) && schema) {
                schema = { type: schema };
            }
        }

        instance = new Validator({
            schema: schema,
            handlers: handlers,
            types: context.types,
            strings: context.strings,
            validator: validator.bind(null, true)
        });

        if (!skipSchemaValidation) {
            // instance.validateSchema();
        }

        // expose only the middleware function bound to the
        // validator instance and having a single validate method
        middle = instance.middleware();
        middle.validate = instance.validate.bind(instance);

        return middle;
    }.bind(null, context.skipSchemaValidation);
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
            strings: strings,
            skipSchemaValidation: false
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