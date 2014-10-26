'use strict';

module.exports = function validateAnyOf(schema, value, validate) {
    var errors = [],
        schemas = schema.anyOf;

    schemas.forEach(function forEachSchema(childSchema) {
        try {
            validate(childSchema, value);
        }
        catch (e) {
            errors.push(e);
        }
    });

    if (errors.length === schemas.length) {
        throw errors[0];
    }
};