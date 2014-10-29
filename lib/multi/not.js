'use strict';

module.exports = function validateNot(schema, value, validator) {
    var childSchema = schema.not;

    try {
        validator(childSchema).validate(value);
    }
    catch (e) {
        return;
    }

    throw new Error();
};