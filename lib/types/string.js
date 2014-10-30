'use strict';

var type = require('../type.js');

module.exports = function validateString(schema, value) {
    if (type.isRegExp(value) && schema.format === 'regex') {
        // allow RegExp objects instead of strings here
        return;
    }

    if (!type.isString(value)) {
        throw new Error();
    }

    if (type.isInteger(schema.minLength) && value.length < schema.minLength) {
        throw new Error();
    }

    if (type.isInteger(schema.maxLength) && value.length > schema.maxLength) {
        throw new Error();
    }

    if (type.isString(schema.pattern) && !new RegExp(schema.pattern).test(value)) {
        throw new Error();
    }

    if (type.isRegExp(schema.pattern) && !schema.pattern.test(value)) {
        throw new Error();
    }
};