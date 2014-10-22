'use strict';

var type = require('../type.js');

module.exports = function validateNumber(schema, value) {
    if (!type.isNumber(value)) {
        throw new Error();
    }

    if (type.isNumber(schema.minimum)) {
        if (schema.exclusiveMinimum === true && value === schema.minimum) {
            throw new Error();
        }
        else if (value < schema.minimum) {
            throw new Error();
        }
    }

    if (type.isNumber(schema.maximum)) {
        if (schema.exclusiveMaximum === true && value === schema.maximum) {
            throw new Error();
        }
        else if (value > schema.maximum) {
            throw new Error();
        }
    }

    if (type.isNumber(schema.multipleOf) && (value % schema.multipleOf) !== 0) {
        throw new Error();
    }
};