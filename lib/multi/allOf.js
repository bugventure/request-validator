'use strict';

module.exports = function validateAllOf(schema, value, validator) {
    schema.allOf.forEach(function forEachSchema(childSchema) {
        validator(childSchema).validate(value);
    });
};