'use strict';

var container = require('../server/container');
container.set('server', null);
container.set('express', null);
container.set('socket', null);

module.exports = container;