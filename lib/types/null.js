'use strict';

var type = require('../type.js');

module.exports = function validateNull(schema, value) {
    if (!type.isNull(value)) {
        throw new Error();
    }
};