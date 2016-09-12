'use strict';

let Roastr    = require('./src/roastr');
let container = require('./src/container');

/**
 * 
 * @type {Roastr|exports|module.exports}
 */
module.exports = new Roastr(container);