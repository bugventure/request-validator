'use strict';

var util = require('util'),
    type = require('./type.js'),
    equal = require('./equal.js'),
    strings = require('./strings.js'),
    chain = require('./chain.js'),
    clone = require('./clone.js'),
    chain = require('./chain.js'),
    collector = require('./collector.js'),
    refRegex = /#?(\/?\w+)*$/,
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

function refToPath(ref) {
    var path = ref.split('#')[1];

    if (path) {
        path = path.split('/').join('.');

        if (path[0] === '.') {
            path = path.substr(1);
        }
    }

    return path;
}

function SchemaResolver(rootSchema) {
    this.rootSchema = rootSchema;
    this.cache = {};
    this.resolved = null;
}

SchemaResolver.prototype.resolveRef = function (ref) {
    var err = new Error(util.format(strings.invalidReference, ref)),
        root = this.rootSchema,
        path,
        dest;

    if (!type.isString(ref) || !ref || !refRegex.test(ref)) {
        throw err;
    }

    if (ref === metaschema.id) {
        dest = metaschema;
    }
    else {
        path = refToPath(ref);

        dest = path ? collector.get(root, path) : root;
    }

    if (!type.isObject(dest)) {
        throw err;
    }

    if (this.cache[ref] === dest) {
        return dest;
    }

    this.cache[ref] = dest;

    if (dest.$ref !== undefined) {
        dest = this.cache[ref] = this.resolveRef(dest.$ref);
    }

    return dest;
};

SchemaResolver.prototype.resolve = function (schema) {
    if (!type.isObject(schema)) {
        return schema;
    }

    var ref = schema.$ref,
        resolved = this.cache[ref];

    if (type.isUndefined(ref)) {
        return schema;
    }

    if (resolved) {
        return resolved;
    }

    resolved = this.resolveRef(ref);

    if (schema === this.rootSchema && schema !== resolved) {
        // substitute the resolved root schema
        this.rootSchema = resolved;
    }

    return resolved;
};

function Validator(options) {
    // this.rootSchema = new SchemaResolver(options.schema).resolve(options.schema);
    this.rootSchema = options.schema;
    this.resolver = new SchemaResolver(this.rootSchema);

    this.chain = chain.apply(null, options.handlers);
    this.types = options.types;
    this.strings = options.strings;
}

Validator.prototype.getValidators = function (schema, value) {
    var types = this.types,
        specifiedTypes = type.isArray(schema.type) ? schema.type : [schema.type],
        validators = [];

    specifiedTypes.forEach(function forEachType(specifiedType) {
        var typeValidators = types[specifiedType];

        if (!typeValidators) {
            specifiedType = type(value);
            typeValidators = types[specifiedType] || types.any;
        }

        validators.push({
            type: specifiedType,
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

Validator.prototype.formatError = function (schema, value, error, key) {
    error = error || new Error();

    // support for 3 parameters, where 3rd is key
    if (type.isString(error)) {
        key = error;
        error = new Error();
    }

    var strings = this.strings,
        missing = type.isUndefined(value),
        message = missing ?
            (schema.requiredMessage || strings.required) :
            (schema.message || strings.invalid);

    if (!error.key) {
        error.key = type.isDefined(key) ? key : '';
    }

    if (!error.message) {
        error.message = message;
    }

    error.missing = missing;

    if (!type.isBoolean(error.required)) {
        // any type is required, unless we have a pre-existing
        // error object that has its `required` key already set
        error.required = true;
    }

    return error;
};

Validator.prototype.validate = function (schema, value) {
    if (!schema) {
        return;
    }

    schema = this.resolve(schema);

    var inst = this,
        validators,
        failedValidators,
        multiValidator;

    validators = inst.getValidators(schema, value);

    if (inst.notInEnum(schema, value)) {
        throw inst.formatError(schema, value);
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

    multiValidator = inst.getMultiValidator(schema);

    if (multiValidator) {
        multiValidator.call(inst, schema, value);
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

        if (params && type.isObject(this.rootSchema)) {
            // set default values
            params = this.default(this.rootSchema, params);
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
    return this.resolver.resolve(schema);
};

Validator.prototype.validateSchema = function () {
    if (!type.isDefined(this.rootSchema)) {
        return;
    }

    // do not attempt at validating the metaschema
    if (this.resolve(this.rootSchema) === metaschema) {
        return;
    }

    var schemaValidator = new Validator({
        schema: metaschema,
        types: types,
        strings: this.strings
    });

    schemaValidator.validate(metaschema, this.rootSchema);
};

Validator.prototype.default = function (schema, value) {
    var that = this;

    if (type.isUndefined(value) && !type.isUndefined(schema.default)) {
        value = clone(schema.default);
    }

    if (type.isObject(value) && type.isObject(schema.properties)) {
        Object.keys(schema.properties).forEach(function forEachKey(key) {
            var nestedValue = that.default(schema.properties[key], value[key]);

            if (nestedValue !== value[key]) {
                // reassign nested value if different after defaulting
                value[key] = nestedValue;
            }
        });
    }
    else if (type.isArray(value)) {
        if (type.isArray(schema.items)) {
            schema.items.forEach(function forEachItem(item, index) {
                var itemValue = that.default(item, value[index]);

                if (itemValue !== value[index]) {
                    // reassign nested item if different after defaulting
                    value[index] = itemValue;
                }
            });
        }
        else if (type.isObject(schema.items) && value.length) {
            value.forEach(function forEachItem(item, index) {
                var defaulted = that.default(schema.items, item);

                if (defaulted !== item) {
                    // reassign nested item if different after defaulting
                    value[index] = defaulted;
                }
            });
        }
    }

    return value;
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
        middle.default = instance.default.bind(instance, schema);

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