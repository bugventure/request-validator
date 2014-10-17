'use strict';

var type = require('./type.js'),
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

function validateString(schema, value) {
    if (!type.isString(value)) {
        fail();
    }
}

validatorMap.string.push(validateString);

function validate(schema, value) {
    if (!schema) {
        return;
    }

    schema = type.isString(schema) ? { type: schema } : schema;

    var validators = validatorMap[schema.type] || validatorMap.any,
        i;

    try {
        validateRequired(schema, value);

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