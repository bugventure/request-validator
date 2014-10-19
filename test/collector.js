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
                properties: [
                    {
                        name: 'a',
                        source: 'body'
                    },
                    {
                        name: 'b',
                        source: 'query'
                    },
                    {
                        name: 'c',
                        source: 'cookies'
                    },
                    {
                        name: 'd',
                        source: 'headers'
                    },
                    {
                        name: 'e',
                        source: 'some.nested.object'
                    },
                    {
                        name: 'f',
                        source: 'another.funky.place'
                    },
                    {
                        name: 'g',
                        source: 'arr.0'
                    },
                    {
                        name: 'h',
                        source: 'arr.1'
                    },
                    {
                        name: 'x',
                        source: 'nonexistent.key'
                    }
                ]
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
});