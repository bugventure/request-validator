'use strict';

var type = require('../type.js'),
    unique = require('../unique.js');

function ArrayValidator(schema, validator) {
    this.schema = schema;
    this.validator = validator;
}

ArrayValidator.prototype.validateItemsFromObject = function (value) {
    var min = this.schema.minItems || 0,
        i, item;

    for (i = 0; i < value.length; i++) {
        item = value[i];

        try {
            // expect to throw
            this.validator.validate(this.schema.items, item);
        }
        catch (e) {
            e.key = i + '';
            e.required = i < min;
            e.missing = type.isUndefined(item);

            this.errors[i] = e;
        }
    }
};

ArrayValidator.prototype.validateItemsFromArray = function (value) {
    var items = this.schema.items,
        additional = this.schema.additionalItems,
        min = this.schema.minItems || 0,
        i, dataItem;

    if (value.length !== items.length && additional === false) {
        throw new Error();
    }

    for (i = 0; i < items.length; i++) {
        dataItem = value[i];

        try {
            // expect to throw
            this.validator.validate(items[i], dataItem);
        }
        catch (e) {
            e.key = i + '';
            e.required = i < min;
            e.missing = type.isUndefined(dataItem);

            this.errors[i] = e;
        }
    }

    if (type.isObject(additional) && items.length < value.length) {
        for (i = items.length; i < value.length; i++) {
            dataItem = value[i];

            try {
                // expect to throw
                this.validator.validate(additional, dataItem);
            }
            catch (e) {
                e.key = i + '';
                e.required = false;
                e.missing = type.isUndefined(dataItem);

                this.errors[i] = e;
            }
        }
    }
};

ArrayValidator.prototype.validateItems = function (value) {
    var schema = this.schema;

    if (type.isObject(schema.items)) {
        this.validateItemsFromObject(value);
    }
    else if (type.isArray(schema.items)) {
        this.validateItemsFromArray(value);
    }
};

ArrayValidator.prototype.throwOnError = function () {
    var errors = this.errors,
        errorIndices = Object.keys(errors),
        err = new Error();

    if (!errorIndices.length) {
        return;
    }

    err.key = '';
    err.errors = errorIndices.map(function mapError(index) {
        return errors[index];
    });

    throw err;
};

ArrayValidator.prototype.validate = function (value) {
    var schema = this.schema,
        err = new Error();

    this.errors = {};

    if (!type.isArray(value)) {
        throw err;
    }

    if (type.isInteger(schema.minItems) && value.length < schema.minItems) {
        throw err;
    }

    if (type.isInteger(schema.maxItems) && value.length > schema.maxItems) {
        throw err;
    }

    if (schema.uniqueItems && unique(value).length !== value.length) {
        throw err;
    }

    this.validateItems(value);

    this.throwOnError();
};

module.exports = function validateArray(schema, value) {
    new ArrayValidator(schema, this).validate(value);
};