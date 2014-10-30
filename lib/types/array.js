'use strict';

var type = require('../type.js'),
    unique = require('../unique.js');

function validateItemsFromObject(schema, value, validate) {
    value.forEach(function forEachItem(item) {
        // expect to throw
        validate(schema.items, item);
    });
}

function validateItemsFromArray(schema, value, validate) {
    if (value.length !== schema.items.length &&
        schema.additionalItems === false) {
        throw new Error();
    }

    schema.items.forEach(function forEachItemSchema(itemSchema, index) {
        // expect to throw
        validate(itemSchema, value[index]);
    });
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
        validateItemsFromObject(schema, value, this.validate.bind(this));
    }
    else if (type.isArray(schema.items)) {
        validateItemsFromArray(schema, value, this.validate.bind(this));
    }
};