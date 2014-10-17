'use strict';

var type = require('./type.js'),
    equal = require('./equal.js'),
    strings = require('./strings.js'),
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

function fail(msg) {
    throw new Error(msg || strings.invalid);
}

function validateRequired(schema, value) {
    var nullAccepted = schema.type === 'null' && value === null,
        valueExists = nullAccepted || type.isDefined(value);

    if (schema.required && !valueExists) {
        fail(strings.required);
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

    fail();
}

function validateString(schema, value) {
    if (!type.isString(value)) {
        fail();
    }

    if (schema.required && !schema.empty && value === '') {
        fail();
    }

    if (type.isInteger(schema.length) && value.length !== schema.length) {
        fail();
    }

    if (type.isInteger(schema.minLength) && value.length < schema.minLength) {
        fail();
    }

    if (type.isInteger(schema.maxLength) && value.length > schema.maxLength) {
        fail();
    }

    if (type.isString(schema.pattern) && !new RegExp(schema.pattern).test(value)) {
        fail();
    }

    if (type.isRegExp(schema.pattern) && !schema.pattern.test(value)) {
        fail();
    }
}

validatorMap.string.push(validateString);

function validateNumber(schema, value) {
    if (!type.isNumber(value)) {
        fail();
    }

    if (type.isNumber(schema.min) && value < schema.min) {
        fail();
    }

    if (type.isNumber(schema.max) && value > schema.max) {
        fail();
    }

    if (type.isNumber(schema.divisibleBy) && (value % schema.divisibleBy) !== 0) {
        fail();
    }
}

validatorMap.number.push(validateNumber);

function validateInteger(schema, value) {
    if (!type.isInteger(value)) {
        fail();
    }

    validateNumber(schema, value);
}

validatorMap.integer.push(validateInteger);

function validateBoolean(schema, value) {
    if (!type.isBoolean(value)) {
        fail();
    }
}

validatorMap.boolean.push(validateBoolean);

function validateNull(schema, value) {
    if (!type.isNull(value)) {
        fail();
    }
}

validatorMap.null.push(validateNull);

function validateObject(schema, value) {

}

validatorMap.object.push(validateObject);

function validateArray(schema, value) {

}

validatorMap.array.push(validateArray);

function validate(schema, value) {
    if (!schema) {
        return;
    }

    schema = type.isString(schema) ? { type: schema } : schema;

    var validators = validatorMap[schema.type] || validatorMap.any,
        i;

    try {
        validateRequired(schema, value);
        validateEnumeration(schema, value);

        for (i = 0; i < validators.length; i++) {
            validators[i](schema, value);
        }
    }
    catch (e) {
        throw e;
    }

    // TODO: implement actual validation
}

function validator(schema) {
    // allow the function to do dual-work both as a
    // procedural validator as well as a middleware factory
    var middle = middleware.apply(null, arguments);

    middle.validate = validate.bind(null, schema);

    return middle;
}

module.exports = validator;