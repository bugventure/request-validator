'use strict';

var util = require('util'),
    type = require('./type.js'),
    equal = require('./equal.js'),
    strings = require('./strings.js'),
    chain = require('./chain.js'),
    clone = require('./clone.js'),
    middleware = require('./middleware'),
    noop = function () { },
    validatorMap = {
        string: [],
        number: [],
        integer: [],
        boolean: [],
        array: [],
        object: [],
        null: [],
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

function validateString(schema, value) {
    if (!type.isString(value)) {
        fail(schema);
    }

    if (schema.required && !schema.empty && value === '') {
        fail(schema);
    }

    if (type.isInteger(schema.length) && value.length !== schema.length) {
        fail(schema);
    }

    if (type.isInteger(schema.minLength) && value.length < schema.minLength) {
        fail(schema);
    }

    if (type.isInteger(schema.maxLength) && value.length > schema.maxLength) {
        fail(schema);
    }

    if (type.isString(schema.pattern) && !new RegExp(schema.pattern).test(value)) {
        fail(schema);
    }

    if (type.isRegExp(schema.pattern) && !schema.pattern.test(value)) {
        fail(schema);
    }
}

validatorMap.string.push(validateString);

function validateNumber(schema, value) {
    if (!type.isNumber(value)) {
        fail(schema);
    }

    if (type.isNumber(schema.min) && value < schema.min) {
        fail(schema);
    }

    if (type.isNumber(schema.max) && value > schema.max) {
        fail(schema);
    }

    if (type.isNumber(schema.divisibleBy) && (value % schema.divisibleBy) !== 0) {
        fail(schema);
    }
}

validatorMap.number.push(validateNumber);

function validateInteger(schema, value) {
    if (!type.isInteger(value)) {
        fail(schema);
    }

    validateNumber(schema, value);
}

validatorMap.integer.push(validateInteger);

function validateBoolean(schema, value) {
    if (!type.isBoolean(value)) {
        fail(schema);
    }
}

validatorMap.boolean.push(validateBoolean);

function validateNull(schema, value) {
    if (!type.isNull(value)) {
        fail(schema);
    }
}

validatorMap.null.push(validateNull);

function validateObject(schema, value) {
    var props = schema.properties,
        errors = [];

    if (!type.isObject(value)) {
        fail(schema);
    }

    if (type.isArray(props)) {
        props.forEach(function forEachProperty(prop) {
            if (!type.isString(prop.name)) {
                // cannot validate properties without a specified name
                return;
            }

            try {
                validator(prop).validate(value[prop.name]);
            }
            catch (e) {
                errors.push(e);
            }
        });
    }

    if (errors.length) {
        fail(schema, false, errors);
    }
}

validatorMap.object.push(validateObject);

function validateArray(schema, value) {
    var itemSchema,
        errors = [];

    if (!type.isArray(value)) {
        fail(schema);
    }

    if (type.isInteger(schema.length) && value.length !== schema.length) {
        fail(schema);
    }

    if (type.isInteger(schema.minLength) && value.length < schema.minLength) {
        fail(schema);
    }

    if (type.isInteger(schema.maxLength) && value.length > schema.maxLength) {
        fail(schema);
    }

    if (schema.items) {
        if (type.isString(schema.items)) {
            // schema: 'string'
            itemSchema = {
                type: schema.items,
                required: true
            };
        }
        else if (type.isObject(schema.items)) {
            // schema: 'object'
            itemSchema = schema.items;
        }
        else {
            // do not validate further if item
            // schema is unsupported
            return;
        }

        value.forEach(function forEachItem(item) {
            try {
                validator(itemSchema).validate(item);
            }
            catch (e) {
                errors.push(e);
            }
        });

        if (errors.length) {
            fail(schema, false, errors);
        }
    }
}

validatorMap.array.push(validateArray);

function validateSchema(schema, withName) {
    var map = this || validatorMap, // jshint ignore: line
        err = new Error(strings.invalidSchema),
        invalidItems;

    // allow null schemas, but do not validate any data
    if (!type.isDefined(schema)) {
        return;
    }

    // validate string-formatted schema
    if (type.isString(schema)) {
        if (!map[schema]) {
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

    var map = this || validatorMap, // jshint ignore: line
        validators = map[schema.type] || map.any,
        i;

    validateRequired(schema, value);

    // at this point, having null or undefined is OK
    // because the required validation has passed
    if (!type.isDefined(value)) {
        return;
    }

    validateEnumeration(schema, value);

    for (i = 0; i < validators.length; i++) {
        validators[i](schema, value);
    }
}

function validator(schema) {    // jshint ignore: line
    // allow the function to do dual-work both as a
    // procedural validator as well as a middleware factory
    var middle = middleware.apply(null, arguments);

    // create a copy of validate function with validator map and schema
    middle.validate = validate.bind(this, schema); // jshint ignore: line

    return middle;
}

function create() {
    var map = validatorMap,
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