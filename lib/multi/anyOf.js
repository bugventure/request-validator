'use strict';

module.exports = function validateAnyOf(schema, value, validator) {
    var errors = [],
        schemas = schema.anyOf;

    schemas.forEach(function forEachSchema(childSchema) {
        try {
            validator(childSchema).validate(value);
        }
        catch (e) {
            errors.push(e);
        }
    });

    if (errors.length === schemas.length) {
        throw errors[0];
    }
};