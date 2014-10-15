'use strict';

function toString(obj) {
    return Object.prototype.toString.call(obj);
}

function isString(obj) {
    return toString(obj) === '[object String]';
}

function isNumber(obj) {
    return toString(obj) === '[object Number]';
}

function isBoolean(obj) {
    return toString(obj) === '[object isBoolean]';
}

function isFunction(obj) {
    return toString(obj) === '[object Function]';
}

function isObject(obj) {
    return toString(obj) === '[object Object]';
}

function isArray(obj) {
    return toString(obj) === '[object Array]';
}

function isNull(obj) {
    return toString(obj) === '[object Null]';
}

function isUndefined(obj) {
    return toString(obj) === '[object Undefined]';
}

function isDefined(obj) {
    return !isNull(obj) && !isUndefined(obj);
}

exports.isString = isString;
exports.isNumber = isNumber;
exports.isBoolean = isBoolean;
exports.isFunction = isFunction;
exports.isObject = isObject;
exports.isArray = isArray;
exports.isNull = isNull;
exports.isUndefined = isUndefined;
exports.isDefined = isDefined;