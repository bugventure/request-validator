'use strict';

var type = require('../type.js'),
    unique = require('../unique.js'),
    equal = require('../equal.js');

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
    var props = schema.properties;

    if (type.isObject(props)) {
        Object.keys(props).forEach(function forEachPropertyKey(key) {
            var nestedValue = value[key];

            // required validation has passed at this point
            // and we skip all values that are undefined
            if (!type.isUndefined(nestedValue)) {
                // expect to throw
                validate(props[key], nestedValue);
            }
        });
    }
}

function validatePatternProperties(schema, value, validate) {
    var keys = Object.keys(value),
        patterns = type.isObject(schema.patternProperties) ?
            Object.keys(schema.patternProperties) :
            [],
        matches;

    if (!patterns.length) {
        return;
    }

    patterns.forEach(function forEachPattern(pattern) {
        matches = keys.filter(function filterKey(key) {
            return new RegExp(pattern).test(key);
        });

        matches.forEach(function forEachMatchingKey(key) {
            var patternSchema = schema.patternProperties[pattern];

            // expect to throw
            validate(patternSchema, value[key]);
        });
    });
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

    keys.sort();
    allowedKeys.sort();

    if (!equal(keys, allowedKeys)) {
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