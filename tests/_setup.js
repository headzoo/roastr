'use strict';

require('app-module-path').addPath(__dirname + '/../src');

const Roastr    = require('roastr');
const container = require('container');

/**
 * @type {Roastr|exports|module.exports}
 */
module.exports = new Roastr(container);