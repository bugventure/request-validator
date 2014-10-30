'use strict';

module.exports = function validateAnyOf(schema, value) {
    var that = this,
        errors = [],
        schemas = schema.anyOf,
        matchFound = false;

    schemas.forEach(function forEachSchema(childSchema) {
        if (matchFound) {
            // short-circuit any further validation
            // if there is a match already
            return;
        }

        try {
            that.validate(childSchema, value);
            matchFound = true;
        }
        catch (e) {
            errors.push(e);
        }
    });

    if (!matchFound) {
        throw errors[0];
    }
};