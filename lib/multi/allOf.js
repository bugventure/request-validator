'use strict';

module.exports = function validateAllOf(schema, value, validate) {
    schema.allOf.forEach(function forEachSchema(childSchema) {
        validate(childSchema, value);
    });
};