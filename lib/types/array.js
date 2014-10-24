'use strict';

var type = require('../type.js'),
    unique = require('../unique.js');

function validateItemsFromObject(schema, value, validate) {
    var errors = [],
        itemSchema = type.isString(schema.items) ?
            { type: schema.items } :
            schema.items;

    value.forEach(function forEachItem(item) {
        try {
            validate(itemSchema, item);
        }
        catch (e) {
            errors.push(e);
        }
    });

    if (errors.length) {
        throw errors;
    }
}

function validateItemsFromArray(schema, value, validate) {
    var errors = [];

    if (value.length !== schema.items.length &&
        schema.additionalItems === false) {
        throw new Error();
    }

    schema.items.forEach(function forEachItemSchema(itemSchema, index) {
        try {
            validate(itemSchema, value[index]);
        }
        catch (e) {
            errors.push(e);
        }
    });

    if (errors.length) {
        throw errors;
    }
}

module.exports = function validateArray(schema, value, validate) {
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
        validateItemsFromObject(schema, value, validate);
    }
    else if (type.isArray(schema.items)) {
        validateItemsFromArray(schema, value, validate);
    }
};