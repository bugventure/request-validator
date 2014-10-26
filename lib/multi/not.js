'use strict';

module.exports = function validateNot(schema, value, validate) {
    var childSchema = schema.not;

    try {
        validate(childSchema, value);
    }
    catch (e) {
        return;
    }

    throw new Error();
};