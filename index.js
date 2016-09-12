'use strict';

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
        path = './tests/_container';
    }
    
    let container = require('./server/container');
    container.set('name', name);
    container.set('root', root);
    container.assign(require(path));
    
    return container.get('app');
};