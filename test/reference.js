/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe('$ref', function () {
    it('throws if string is not in correct format', function () {
        assert.throws(function () {
            validator({ $ref: '' });
        });

        assert.throws(function () {
            validator({ $ref: '#double//slash' });
        });

        assert.throws(function () {
            validator({ $ref: '#ends/with/slash/' });
        });

        assert.throws(function () {
            // invalid reference, non-existent schema properties
            validator({ $ref: '#a/b/c' });
        });

        assert.doesNotThrow(function () {
            // schema resolves to itself
            validator({ $ref: '#' });
        });

        assert.doesNotThrow(function () {
            validator({
                a: {
                    b: {
                        c: {
                            type: 'any'
                        }
                    }
                },
                $ref: '#/a/b/c'
            });
        });

        assert.doesNotThrow(function () {
            validator({
                arr: [
                    { value: { type: 'string'} },
                    { value: { type: 'number'} },
                    { value: { type: 'boolean'} }
                ],
                type: 'object',
                properties: {
                    a: { $ref: '#arr/2/value' }
                }
            });
        });
    });
});