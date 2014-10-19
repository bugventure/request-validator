'use strict';

var type = require('./type.js');

function get(key, obj) {
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

function collect(schema, obj) {
    var props, key;

    if (!type.isDefined(obj)) {
        // cannot extract anything from null or undefined
        return;
    }

    if (type.isObject(schema)) {
        if (type.isString(schema.name) && schema.name &&
            type.isString(schema.source) && schema.source) {

            key = [schema.source, schema.name].join('.');
            return get(key, obj);
        }
        else if (type.isArray(schema.properties)) {
            props = schema.properties;
        }
        else {
            return;
        }
    }
    else if (type.isArray(schema)) {
        props = schema;
    }
    else {
        // if schema is not supported return undefined
        return;
    }

    props.filter(function filterProp(prop) {
        return type.isObject(prop) &&
            type.isString(prop.name) && prop.name &&
            type.isString(prop.source) && prop.source;
    });

    if (!props.length) {
        // we do not have any suitable properties to extractq
        return;
    }

    // gather and return properties in an object
    return props.reduce(function (ret, prop) {
        var key = [prop.source, prop.name].join('.');
        ret[prop.name] = get(key, obj);
        return ret;
    }, {});
}

module.exports = collect;