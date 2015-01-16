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
                testGroups: require(fullpath)
            });
        }
    });
}
catch (e) {
    error = e;
}

// temporarily exclude remote ref tests
testCategories.splice(24, 1);

function addTestCase(schema, testCase) {
    it(testCase.description, function () {
        var validatorFunc = testCase.valid ?
            assert.doesNotThrow :
            assert.throws;

        validatorFunc(function () {
            validator(schema).validate(testCase.data);
        }, testCase.description);
    });
}

function addTestGroup(testGroup) {
    describe(testGroup.description, function () {
        testGroup.tests.forEach(addTestCase.bind(null, testGroup.schema));
    });
}

function addTestCategory(testCategory) {
    describe(testCategory.name, function () {
        testCategory.testGroups.forEach(addTestGroup);
    });
}

describe('JSON-schema test suite', function () {
    if (error) {
        it('error', function () {
            assert.fail(error.message);
        });
    }
    else {
        testCategories.forEach(addTestCategory);
    }
});