'use strict';

var type = require('../type.js'),
    unique = require('../unique.js');

function ObjectValidator(schema, validator) {
    this.schema = schema;
    this.validator = validator;
}

ObjectValidator.prototype.validateRequired = function (value) {
    var schema = this.schema,
        errors = this.errors,
        validator = this.validator;

    if (!type.isArray(schema.required)) {
        return;
    }

    schema.required.forEach(function forEachKey(key) {
        var propValue = value[key];

        if (type.isUndefined(propValue)) {
            errors[key] = validator.formatError(schema.properties[key], propValue, key);
        }
    });
};

ObjectValidator.prototype.isRequired = function (key) {
    return type.isArray(this.schema.required) &&
        this.schema.required.indexOf(key) > -1;
};

ObjectValidator.prototype.validateProperties = function (value) {
    var that = this,
        props = that.schema.properties,
        errors = that.errors,
        validator = that.validator;

    if (!type.isObject(props)) {
        return;
    }

    Object.keys(props).forEach(function forEachPropertyKey(key) {
        if (errors[key]) {
            // do not validate same property multiple times
            return;
        }

        var nestedValue = value[key];

        if (type.isUndefined(nestedValue)) {
            // required validation has passed at this point
            // and we skip all values that are undefined
            return;
        }

        try {
            // expect to throw
            validator.validate(props[key], nestedValue);
        }
        catch (e) {
            validator.formatError(props[key], nestedValue, e, key);
            e.required = that.isRequired(key);

            errors[key] = e;
        }
    });
};

ObjectValidator.prototype.validatePatternProperties = function (value) {
    var that = this,
        schema = that.schema,
        errors = that.errors,
        validator = that.validator,
        keys = Object.keys(value),
        patterns = type.isObject(schema.patternProperties) ?
            Object.keys(schema.patternProperties) : [],
        matches;

    if (!patterns.length) {
        return;
    }

    patterns.forEach(function forEachPattern(pattern) {
        matches = keys.filter(function filterKey(key) {
            return new RegExp(pattern).test(key);
        });

        matches.forEach(function forEachMatchingKey(key) {
            if (errors[key]) {
                // do not validate same property multiple times
                return;
            }

            var patternSchema = schema.patternProperties[pattern],
                propValue = value[key];

            try {
                // expect to throw
                validator.validate(patternSchema, propValue);
            }
            catch (e) {
                validator.formatError(patternSchema, propValue, e, key);
                e.required = that.isRequired(key);

                errors[key] = e;
            }
        });
    });
};

ObjectValidator.prototype.validateDependencies = function (value) {
    var that = this,
        schema = that.schema,
        errors = that.errors,
        validator = that.validator;

    if (!type.isObject(schema.dependencies)) {
        return;
    }

    Object.keys(schema.dependencies).forEach(function forEachKey(key) {
        if (errors[key]) {
            return;
        }

        var dependency = schema.dependencies[key],
            propValue = value[key];

        if (type.isUndefined(propValue)) {
            // dependency property undefined
            return;
        }

        if (type.isObject(dependency)) {
            // schema dependency
            try {
                validator.validate(dependency, value);
            }
            catch (e) {
                // TODO: is this the right way to surface a reference
                // error that is the result of re-validating the parent
                // object instead of the child property?
                validator.formatError(dependency, value, e, key);
                e.required = that.isRequired(key);

                errors[key] = e;
            }
        }
        else {
            // property dependency
            dependency.forEach(function forEachProperty(prop) {
                propValue = value[prop];

                if (type.isUndefined(propValue)) {
                    errors[key] = validator.formatError(schema.properties[prop], propValue, prop);
                }
            });
        }
    });
};

ObjectValidator.prototype.validateAdditionalProperties = function (value) {
    if (type.isUndefined(this.schema.additionalProperties) ||
        this.schema.additionalProperties === true) {

        return;
    }

    var that = this,
        schema = that.schema,
        errors = that.errors,
        validator = that.validator,
        keys = Object.keys(value),
        propKeys = type.isObject(schema.properties) ?
            Object.keys(schema.properties) : [],
        patternRegexes = type.isObject(schema.patternProperties) ?
            Object.keys(schema.patternProperties) : [],
        patternKeys = patternRegexes.reduce(function reduceRegex(arr, pattern) {
            var matches = keys.filter(function filterKey(key) {
                return new RegExp(pattern).test(key);
            });

            if (matches.length) {
                arr = arr.concat.apply(arr, matches);
            }

            return arr;
        }, []),
        allowedKeys = unique([].concat.apply(propKeys, patternKeys));

    if (type.isObject(schema.additionalProperties)) {
        keys.forEach(function forEachKey(key) {
            if (allowedKeys.indexOf(key) < 0) {
                var nestedValue = value[key];

                // validate keys that do not belong to the set of
                // defined properties
                try {
                    validator.validate(schema.additionalProperties, nestedValue);
                }
                catch (e) {
                    validator.formatError(schema.additionalProperties, nestedValue, e, key);
                    e.required = that.isRequired(key);

                    errors[key] = e;
                }
            }
        });
    }
    else {
        keys.sort();
        allowedKeys.sort();

        // do not allow keys that are not present in the allowedKeys array
        keys.forEach(function forEachKey(key) {
            if (allowedKeys.indexOf(key) < 0) {
                throw new Error();
            }
        });
    }
};

ObjectValidator.prototype.throwOnError = function () {
    var errors = this.errors,
        errorKeys = Object.keys(errors),
        err = new Error();

    if (!errorKeys.length) {
        return;
    }

    err.key = '';
    err.errors = errorKeys.map(function mapKey(key) {
        return errors[key];
    });

    throw err;
};

ObjectValidator.prototype.validate = function (value) {
    var schema = this.schema,
        err = new Error(),
        keys;

    this.errors = {};

    if (!type.isObject(value)) {
        throw err;
    }

    keys = Object.keys(value);

    if (type.isInteger(schema.maxProperties) &&
        keys.length > schema.maxProperties) {

        throw err;
    }

    if (type.isInteger(schema.minProperties) &&
        keys.length < schema.minProperties) {

        throw err;
    }

    this.validateRequired(value);

    this.validateProperties(value);

    this.validatePatternProperties(value);

    this.validateDependencies(value);

    this.validateAdditionalProperties(value);

    this.throwOnError();
};

module.exports = function validateObject(schema, value) {
    new ObjectValidator(schema, this).validate(value);
};