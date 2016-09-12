'use strict';

var container = require('../src/container');
container.set('server', null);
container.set('express', null);
container.set('socket', null);

module.exports = container;