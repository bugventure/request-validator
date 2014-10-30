'use strict';

module.exports = function validateNot(schema, value) {
    var childSchema = schema.not;

    try {
        this.validate(childSchema, value);
    }
    catch (e) {
        return;
    }

    throw new Error();
};