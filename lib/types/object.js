'use strict';

var type = require('../type.js'),
    validator;

module.exports = function validateObject(schema, value) {
    var props = schema.properties,
        errors = [];

    if (!type.isObject(value)) {
        throw new Error();
    }

    if (type.isArray(props)) {
        if (props.length) {
            // lazy-load validator to ensure it is fully created
            validator = require('../validator.js');
        }

        props.forEach(function forEachProperty(prop) {
            try {
                validator(prop).validate(value[prop.name]);
            }
            catch (e) {
                errors.push(e);
            }
        });
    }

    if (errors.length) {
        throw errors;
    }
};