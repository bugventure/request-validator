'use strict';

var type = require('../type.js');

module.exports = function validateNumber(schema, value) {
    if (!type.isNumber(value)) {
        throw new Error();
    }

    if (type.isNumber(schema.min) && value < schema.min) {
        throw new Error();
    }

    if (type.isNumber(schema.max) && value > schema.max) {
        throw new Error();
    }

    if (type.isNumber(schema.divisibleBy) && (value % schema.divisibleBy) !== 0) {
        throw new Error();
    }
};