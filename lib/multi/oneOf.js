'use strict';

module.exports = function validateOneOf(schema, value, validator) {
    var errors = [],
        schemas = schema.oneOf;

    schemas.forEach(function forEachSchema(childSchema) {
        try {
            validator(childSchema).validate(value);
        }
        catch (e) {
            errors.push(e);
        }
    });

    // exactly one validator must match
    if (errors.length === schemas.length ||
        errors.length < schemas.length - 1) {

        throw new Error();
    }
};