'use strict';

var type = require('../type.js');

module.exports = function validateNumber(schema, value) {
    if (!type.isNumber(value)) {
        throw new Error();
    }

    if (type.isNumber(schema.minimum) && value <= schema.minimum) {
        if (type.isBoolean(schema.exclusiveMinimum) &&
            schema.exclusiveMinimum &&
            value === schema.minimum) {

            throw new Error();
        }
    }

    if (type.isNumber(schema.maximum) && value >= schema.maximum) {
        if (type.isBoolean(schema.exclusiveMaximum) &&
            schema.exclusiveMaximum &&
            value === schema.maximum) {

            throw new Error();
        }
    }

    if (type.isNumber(schema.multipleOf) && (value % schema.multipleOf) !== 0) {
        throw new Error();
    }
};