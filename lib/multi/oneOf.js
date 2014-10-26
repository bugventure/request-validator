'use strict';

module.exports = function validateOneOf(schema, value, validate) {
    var errors = [],
        schemas = schema.oneOf;

    schemas.forEach(function forEachSchema(childSchema) {
        try {
            validate(childSchema, value);
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