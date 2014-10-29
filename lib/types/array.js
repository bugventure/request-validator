'use strict';

var type = require('../type.js'),
    unique = require('../unique.js');

function validateItemsFromObject(schema, value, validator) {
    value.forEach(function forEachItem(item) {
        // expect to throw
        validator(schema.items).validate(item);
    });
}

function validateItemsFromArray(schema, value, validator) {
    if (value.length !== schema.items.length &&
        schema.additionalItems === false) {
        throw new Error();
    }

    schema.items.forEach(function forEachItemSchema(itemSchema, index) {
        // expect to throw
        validator(itemSchema).validate(value[index]);
    });
}

module.exports = function validateArray(schema, value, validator) {
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
        validateItemsFromObject(schema, value, validator);
    }
    else if (type.isArray(schema.items)) {
        validateItemsFromArray(schema, value, validator);
    }
};