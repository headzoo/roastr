'use strict';

var container = require('../server/container');
container.service('server', null);
container.service('express', null);
container.service('socket', null);

module.exports = container;