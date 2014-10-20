'use strict';

var type = require('../type.js'),
    validateNumber = require('./number.js');

module.exports = function validateInteger(schema, value) {
    if (!type.isInteger(value)) {
        throw new Error();
    }

    validateNumber(schema, value);
};