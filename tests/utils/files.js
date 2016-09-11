'use strict';

require('../_setup');
const files = require('utils/files');

exports.testExists = function(test) {
    files.exists(__dirname + '/files.js')
        .then(function(exists) {
            test.ok(exists);
            return files.exists('no_exists');
        })
        .then(function(exists) {
            test.ok(!exists);
        })
        .catch(test.doesNotThrow)
        .finally(test.done);
};

exports.testExistsSync = function(test) {
    test.ok(files.existsSync(__dirname + '/files.js'));
    test.ok(!files.existsSync('no_exists'));
    test.done();
};