/* global describe, it */
'use strict';

var fs = require('fs'),
    path = require('path'),
    assert = require('assert'),
    validator = require('../index.js'),
    dir = 'JSON-Schema-Test-Suite/tests/draft4',
    files,
    testCategories = [],
    error;

try {
    dir = path.resolve(__dirname, dir);
    files = fs.readdirSync(dir);

    files.forEach(function (filename) {
        var fullpath = path.resolve(dir, filename),
            stat = fs.statSync(fullpath);

        if (stat.isFile() && path.extname(filename) === '.json') {
            testCategories.push({
                name: path.basename(filename, '.json'),
                tests: require(fullpath)
            });
        }
    });
}
catch (e) {
    error = e;
}

function addTestCase(testCase) {
    it(testCase.description, function () {
        testCase.tests.forEach(function (test) {
            var validatorFunc = test.valid ?
                assert.doesNotThrow :
                assert.throws;

            validatorFunc(function () {
                validator(testCase.schema).validate(test.data);
            }, test.description);
        });
    });
}

function addTestCategory(testCategory) {
    describe(testCategory.name, function () {
        testCategory.tests.forEach(addTestCase);
    });
}

describe('JSON-schema test suite', function () {
    if (error) {
        it('error', function () {
            assert.fail(error.message);
        });
    }
    else {
        // testCategories.forEach(addTestCategory);
        [].forEach(addTestCategory);
    }
});