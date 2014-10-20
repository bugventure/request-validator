'use strict';

var type = require('./type.js');

module.exports = function clone(obj) {
    if (type.isObject(obj)) {
        return Object.keys(obj).reduce(function (ret, key) {
            ret[key] = clone(obj[key]);
            return ret;
        }, {});
    }
    else if (type.isArray(obj)) {
        return obj.map(function forEachItem(item) {
            return clone(item);
        });
    }
    else if (type.isRegExp(obj)) {
        return new RegExp(obj);
    }

    return obj;
};