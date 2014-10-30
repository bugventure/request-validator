'use strict';

module.exports = function validateAnyOf(schema, value) {
    var that = this,
        errors = [],
        schemas = schema.anyOf;

    schemas.forEach(function forEachSchema(childSchema) {
        try {
            that.validate(childSchema, value);
        }
        catch (e) {
            errors.push(e);
        }
    });

    if (errors.length === schemas.length) {
        throw errors[0];
    }
};