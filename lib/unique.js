'use strict';

module.exports = function unique(arr) {
    return arr.filter(function uniqueOnly(value, index, self) {
        return self.indexOf(value) === index;
    });
};