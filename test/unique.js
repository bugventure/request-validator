/* global describe, it */
'use strict';

var assert = require('assert'),
    unique = require('../lib/unique.js');

describe('unique', function () {
    it('filters unique values', function () {
        var inputs = [
                [1, 'a', 3, false, null, undefined],
                ['abc', 123, true, 123, false, Math.PI, 'abc', true, null, null]
            ],
            expected = [
                [1, 'a', 3, false, null, undefined],
                ['abc', 123, true, false, Math.PI, null]
            ],
            i;

        for (i = 0; i < inputs.length; i++) {
            assert.deepEqual(unique(inputs[i]), expected[i]);
        }
    });
});