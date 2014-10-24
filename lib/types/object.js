'use strict';

var type = require('../type.js'),
    unique = require('../unique.js');

function validateRequiredProperties(schema, value) {
    var keys = Object.keys(value),
        missing;

    if (!type.isArray(schema.required)) {
        return;
    }

    missing = schema.required.filter(function forEachKey(key) {
        return keys.indexOf(key) < 0;
    });

    if (missing.length) {
        throw new Error();
    }
}

function validateProperties(schema, value, validate) {
    var props = schema.properties,
        propKeys,
        keys,
        errors = [];

    if (type.isObject(props)) {
        propKeys = Object.keys(props);

        if (!propKeys.length) {
            return;
        }

        keys = Object.keys(value);

        keys.forEach(function forEachPropertyKey(key) {
            try {
                if (propKeys.indexOf(key) > -1) {
                    validate(props[key], value[key]);
                }
            }
            catch (e) {
                errors.push(e);
            }
        });
    }

    if (errors.length) {
        throw errors;
    }
}

function validatePatternProperties(schema, value, validate) {
    var keys = Object.keys(value),
        patterns = type.isObject(schema.patternProperties) ?
            Object.keys(schema.patternProperties) :
            [],
        matches,
        errors = [];

    if (!patterns.length) {
        return;
    }

    patterns.forEach(function forEachPattern(pattern) {
        matches = keys.filter(function filterKey(key) {
            return new RegExp(pattern).test(key);
        });

        matches.forEach(function forEachMatchingKey(key) {
            try {
                var patternSchema = schema.patternProperties[pattern];
                validate(patternSchema, value[key]);
            }
            catch (e) {
                errors.push(e);
            }
        });
    });

    if (errors.length) {
        throw errors;
    }
}

function validateAdditionalProperties(schema, value) {
    if (!type.isBoolean(schema.additionalProperties) ||
        schema.additionalProperties) {

        return;
    }

    var keys = Object.keys(value),
        propKeys = type.isObject(schema.properties) ?
            Object.keys(schema.properties) :
            [],
        patternRegexes = type.isObject(schema.patternProperties) ?
            Object.keys(schema.patternProperties) :
            [],
        patternKeys = patternRegexes.reduce(function (arr, pattern) {
            var matches = keys.filter(function filterKey(key) {
                return new RegExp(pattern).test(key);
            });

            if (matches.length) {
                arr = arr.concat.apply(arr, matches);
            }

            return arr;
        }, []),
        allowedKeys = unique([].concat.apply(propKeys, patternKeys));

    if (keys.length !== allowedKeys.length) {
        throw new Error();
    }
}

module.exports = function validateObject(schema, value, validate) {
    if (!type.isObject(value)) {
        throw new Error();
    }

    if (type.isInteger(schema.maxProperties) &&
        Object.keys(value).length > schema.maxProperties) {

        throw new Error();
    }

    if (type.isInteger(schema.minProperties) &&
        Object.keys(value).length < schema.minProperties) {

        throw new Error();
    }

    validateRequiredProperties(schema, value);

    validateProperties(schema, value, validate);

    validatePatternProperties(schema, value, validate);

    validateAdditionalProperties(schema, value);
};