'use strict';

var type = require('../type.js'),
    unique = require('../unique.js'),
    validator;

function validateItemsFromObject(schema, value) {
    var errors = [],
        itemSchema = type.isString(schema.items) ?
            { type: schema.items } :
            schema.items;

    if (value.length) {
        validator = validator || (validator = require('../validator.js'));
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
        throw errors;
    }
}

function validateItemsFromArray(schema, value) {
    var errors = [];

    if (value.length !== schema.items.length &&
        schema.additionalItems === false) {
        throw new Error();
    }

    validator = validator || (validator = require('../validator.js'));

    schema.items.forEach(function forEachItemSchema(itemSchema, index) {
        try {
            validator(itemSchema).validate(value[index]);
        }
        catch (e) {
            errors.push(e);
        }
    });

    if (errors.length) {
        throw errors;
    }
}

module.exports = function validateArray(schema, value) {
    if (!type.isArray(value)) {
        throw new Error();
    }

    if (type.isInteger(schema.minItems) && value.length < schema.minItems) {
        throw new Error();
    }

    if (type.isInteger(schema.maxItems) && value.length > schema.maxItems) {
        throw new Error();
    }

    if (schema.uniqueItems && unique(value).length !== value.length) {
        throw new Error();
    }

    if (type.isString(schema.items) || type.isObject(schema.items)) {
        validateItemsFromObject(schema, value);
    }
    else if (type.isArray(schema.items)) {
        validateItemsFromArray(schema, value);
    }
};