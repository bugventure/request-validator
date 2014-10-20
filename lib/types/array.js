'use strict';

var type = require('../type.js'),
    validator;

module.exports = function validateArray(schema, value) {
    var itemSchema,
        errors = [];

    if (!type.isArray(value)) {
        throw new Error();
    }

    if (type.isInteger(schema.length) && value.length !== schema.length) {
        throw new Error();
    }

    if (type.isInteger(schema.minLength) && value.length < schema.minLength) {
        throw new Error();
    }

    if (type.isInteger(schema.maxLength) && value.length > schema.maxLength) {
        throw new Error();
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

        if (value.length) {
            // lazy-load validator to ensure it is fully created
            validator = require('../validator.js');
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
};