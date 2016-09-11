'use strict';

require('app-module-path').addPath(__dirname);
require('server/utils/shims');

/**
 * @param {string} name
 * @param {string} root
 * @returns {*}
 */
module.exports = function(name, root) {
    let path;
    if (name !== 'tests') {
        path = `${root}/apps/${name}/container`;
    } else {
        path = 'tests/_container';
    }
    
    let server_container = require('server/container');
    let app_container    = require(path);
    app_container.service('name', name);
    app_container.service('root', root);
    server_container.assign(app_container);
    
    return server_container.get('app');
};