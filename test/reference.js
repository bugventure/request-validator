/* global describe, it */
'use strict';

var assert = require('assert'),
    validator = require('../index.js');

describe.skip('$ref', function () {
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
            // invalid reference
            validator({ $ref: '#a/b/c' });
        });

        assert.throws(function () {
            // resolved schema does not have a type
            validator({ $ref: '#' });
        });

        assert.doesNotThrow(function () {
            // TODO: PROBLEM: recursive validation of metaschema
            // where the object or array validator needs to expand
            // references, but doesn't have access to the root schema.
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