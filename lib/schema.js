'use strict';

var util = require('util.js'),
    type = require('./type.js'),
    unique = require('./unique.js'),
    keywordValidators = {};

function fail(msg, info) {
    throw new Error(info ? util.format('%s: %s', msg, info) : msg);
}

keywordValidators.type = function (value, types) {
    var allowedTypes = Object.keys(types),
        i;

    if (type.isArray(value)) {
        if (!value.length || unique(value).length !== value.length) {
            return false;
        }

        for (i = 0; i < value.length; i++) {
            if (allowedTypes.indexOf(value[i]) < 0) {
                return false;
            }
        }

        return true;
    }
    else if (type.isString(value)) {
        return allowedTypes.indexOf(value) > -1;
    }

    return false;
};

function validate(context, schema) {
    var types = context.types,
        abort = fail.bind(null, context.strings.invalidSchema),
        allowedTypes;

    if (type.isString(schema)) {
        schema = { type: schema };
    }

    if (!type.isObject(schema)) {
        abort();
    }

    if (type.isArray(schema.type)) {
        allowedTypes = schema.type;
    }
    else if (type.isString(schema.type)) {
        allowedTypes = [schema.type];
    }
    else {
        abort('type');
    }

    allowedTypes.forEach(function forEachType(type) {
        if (!types[type]) {
            abort('type');
        }
    });

    if (schema.enum) {
        if (type.isArray(schema.enum)) {
            if (!schema.enum.length) {
                abort('enum');
            }
        }
        else {
            abort('enum');
        }
    }
}

exports.validate = validate;