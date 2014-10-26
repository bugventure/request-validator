/* global describe, it */
'use strict';

var assert = require('assert'),
    collector = require('../lib/collector.js'),
    req = {
        body: {
            a: 123
        },
        query: {
            b: 'abc'
        },
        cookies: {
            c: true
        },
        headers: {
            d: 'some value'
        },
        some: {
            nested: {
                object: {
                    e: Math.PI
                }
            }
        },
        'another.funky': {
            place: {
                f: 17
            }
        },
        arr: [
            {
                g: 'first item value'
            },
            {
                h: 'second item value'
            }
        ]
    };

describe('collector', function () {
    it('collects from sources', function () {
        var data,
            schema = {
                type: 'object',
                properties: {
                    a: { source: 'body' },
                    b: { source: 'query' },
                    c: { source: 'cookies' },
                    d: { source: 'headers' },
                    e: { source: 'some.nested.object' },
                    f: { source: 'another.funky.place' },
                    g: { source: 'arr.0' },
                    h: { source: 'arr.1' },
                    x: { source: 'nonexistent.key' }
                }
            },
            expected = {
                a: req.body.a,
                b: req.query.b,
                c: req.cookies.c,
                d: req.headers.d,
                e: req.some.nested.object.e,
                f: req['another.funky'].place.f,
                g: req.arr[0].g,
                h: req.arr[1].h,
                x: undefined
            };

        data = collector(schema, req);

        assert.deepEqual(data, expected);
    });

    it('collects into multiple array items', function () {
        var schema = {
                type: 'array',
                items: [
                    {
                        type: 'string',
                        source: 'query.b'
                    },
                    {
                        type: 'number',
                        source: 'another.funky.place.f'
                    }
                ]
            },
            expectd = [
                req.query.b,
                req['another.funky'].place.f
            ],
            data = collector(schema, req);

        assert.deepEqual(data, expectd);
    });

    it('collects into a single array item', function () {
        var schema = {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        a: {
                            type: 'number',
                            source: 'body'
                        },
                        e: {
                            type: 'number',
                            source: 'some.nested.object'
                        }
                    }
                }
            },
            expected = [
                {
                    a: req.body.a,
                    e: req.some.nested.object.e
                }
            ],
            data = collector(schema, req);

        assert.deepEqual(data, expected);
    });

    it('returns empty object when no source specified', function () {
        var schema = { type: 'object' },
            data = collector(schema, req);

        assert.deepEqual(data, {});
    });

    it('returns empty array when no item source specified', function () {
        var schema = { type: 'array' },
            data = collector(schema, req);

        assert.deepEqual(data, []);
    });
});