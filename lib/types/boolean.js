'use strict';

var type = require('../type.js');

module.exports = function validateBoolean(schema, value) {
    if (!type.isBoolean(value)) {
        throw new Error();
    }
};