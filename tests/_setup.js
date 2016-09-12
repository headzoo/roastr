'use strict';

require('app-module-path').addPath(__dirname + '/../src');

const roastr   = require('../index');
module.exports = roastr('tests', __dirname);