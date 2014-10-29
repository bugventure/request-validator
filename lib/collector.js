'use strict';

var type = require('./type.js');

function get(obj, key) {
    var parts = key.split('.'),
        subobj,
        remaining;

    if (parts.length === 1) {
        // simple key
        return obj[key];
    }

    // compound and nested properties
    // e.g. key('nested.key', { nested: { key: 123 } }) === 123
    // e.g. key('compount.key', { 'compound.key': 456 }) === 456
    while (parts.length && type.isDefined(obj)) {
        // take a part from the front
        remaining = parts.slice(0);
        subobj = undefined;

        // try to match larger compound keys containing dots
        while (remaining.length && type.isUndefined(subobj)) {
            subobj = obj[remaining.join('.')];

            if (type.isUndefined(subobj)) {
                remaining.pop();
            }
        }

        // if there is a matching larger compount key, use that
        if (!type.isUndefined(subobj)) {
            obj = subobj;

            // remove keys from the parts, respectively
            while (remaining.length) {
                remaining.shift();
                parts.shift();
            }
        }
        else {
            // treat like normal simple keys
            obj = obj[parts.shift()];
        }
    }

    return obj;
}

function collect(schema, from, propertyKey) {
    var value;

    if (!type.isObject(schema) || !type.isDefined(from)) {
        // cannot extract anything if no schema
        // cannot extract anything from null or undefined
        return;
    }

    // if the schema has a source, collect the value directly
    if (type.isString(schema.source) && schema.source) {
        if (propertyKey) {
            return get(from, [schema.source, propertyKey].join('.'));
        }

        return get(from, schema.source);
    }

    if (schema.type === 'object') {
        value = {};

        // collect object properties
        if (type.isObject(schema.properties)) {
            Object.keys(schema.properties).forEach(function forEachKey(key) {
                value[key] = collect(schema.properties[key], from, key);
            });
        }
    }
    else if (schema.type === 'array') {
        value = [];

        if (type.isObject(schema.items)) {
            // collect a single array item
            value.push(collect(schema.items, from));
        }
        else if (type.isArray(schema.items)) {
            // collect all the array items
            value = schema.items.map(function mapItems(item) {
                return collect(item, from);
            });
        }
    }

    return value;
}

collect.get = get;

module.exports = collect;