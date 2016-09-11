'use strict';

const _     = require('lodash');
const path  = require('path');
const fs    = require('fs');
const files = require('server/utils/files');

const lib_root    = path.join(__dirname, '../..');
const server_root = path.join(__dirname, 'server');
const dirs    = {
    'public' : 'public',
    views    : 'views',
    tasks    : 'tasks',
    models   : 'models',
    http     : 'http',
    socket   : 'socket'
};

class Directories {
    
    /**
     * Constructor
     * 
     * @param {string} root
     * @param {string} app_name
     */
    constructor(root, app_name) {
        this.app_root     = path.join(root, 'apps', app_name);
        this.paths        = _.mapValues(dirs, function(dir) {
            return path.join(this.app_root, dir)
        }.bind(this));
        this.paths.logs   = path.join(root, 'logs');
        this.paths.config = path.join(root, 'config');
        
        Object.defineProperty(this, 'app', {
            get() {
                return this.app_root;
            }
        });
        Object.defineProperty(this, 'root', {
            get() {
                return root;
            }
        });
    }
    
    /**
     *
     * @returns {*}
     */
    getAll() {
        return this.paths;
    }
    
    /**
     * 
     * @param root
     * @returns {*}
     */
    get(root) {
        if (this.paths[root] !== undefined) {
            return this.paths[root];
        } else if (this.paths[root] !== undefined) {
            return this.paths[root];
        } else {
            throw new Error('Directories: Invalid root directory "' + root + '".');
        }
    }
    
    /**
     * 
     * @param root
     * @param file
     */
    join(root, file) {
        try {
            return path.join(this.get(root), file);
        } catch (err) {
            throw new Error('Directories: Cannot join root "' + root + '" with file "' + file + '". ' + err);
        }
    }
    
    /**
     * @param {string}  root
     * @param {Function} callback
     */
    forEach(root, callback) {
        let dir = this.get(root);
        if (!files.existsSync(dir)) {
            return;
        }
        
        var dir_files = fs.readdirSync(dir);
        for(let i = 0; i < dir_files.length; i++) {
            if (dir_files[i][0] !== '.') {
                callback(this.join(root, dir_files[i]), i);
            }
        }
    }
}

module.exports = Directories;