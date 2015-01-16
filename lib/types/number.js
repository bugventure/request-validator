'use strict';

var type = require('../type.js');

function multipleOfFloat(val, mul) {
    // Bring to the power of the multiplier's decimal digits before integer division.
    // NOTE: We need to stringify and parse the result of the multiplication, or
    // the JS engine may give floating-point errors when the result is an integer.
    var decimals = mul.toString().length - mul.toFixed(0).length - 1,
        pow = Math.pow(10, decimals),
        mVal = parseFloat((val * pow).toString()),
        mMul = parseFloat((mul * pow).toString());

    return (mVal % mMul) === 0;
}

function multipleOf(val, mul) {
    // To negate multiplication errors with floating-point numbers, try
    // to make an integer division first and return true if it gives 0.
    // If there's a remainder in the integer division, try the version
    // with floating-point arithmetics.
    return (val % mul) === 0 || multipleOfFloat(val, mul);
}

module.exports = function validateNumber(schema, value) {
    if (!type.isNumber(value)) {
        throw new Error();
    }

    if (type.isNumber(schema.minimum)) {
        if (schema.exclusiveMinimum === true && value === schema.minimum) {
            throw new Error();
        }
        else if (value < schema.minimum) {
            throw new Error();
        }
    }

    if (type.isNumber(schema.maximum)) {
        if (schema.exclusiveMaximum === true && value === schema.maximum) {
            throw new Error();
        }
        else if (value > schema.maximum) {
            throw new Error();
        }
    }

    if (type.isNumber(schema.multipleOf) && !multipleOf(value, schema.multipleOf)) {
        throw new Error();
    }
};