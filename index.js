'use strict';

const Roastr    = require('./src/roastr');
const container = require('./src/container');

/**
 * @type {Roastr|exports|module.exports}
 */
module.exports = new Roastr(container);