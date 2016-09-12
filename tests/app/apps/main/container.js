'use strict';

const roastr = require('../../../../index');
roastr.container.set('foo', 'bar');

module.exports = roastr.container;