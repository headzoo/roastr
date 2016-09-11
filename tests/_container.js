'use strict';

var container = require('server/utils/dic');
container.service('server', null);
container.service('express', null);
container.service('socket', null);

module.exports = container;