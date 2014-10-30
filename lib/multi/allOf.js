'use strict';

module.exports = function validateAllOf(schema, value) {
    var that = this;

    schema.allOf.forEach(function forEachSchema(childSchema) {
        that.validate(childSchema, value);
    });
};