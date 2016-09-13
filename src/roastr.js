'use strict';

const _            = require('lodash');
const fs           = require('fs');
const path         = require('path');
const files        = require('./utils/files');
const EventEmitter = require('events');

class Roastr {
    
    /**
     * Constructor
     * 
     * @param {Container} container
     */
    constructor(container) {
        this.c      = container;
        this.events = new EventEmitter();
        this.booted = false;
        this.booted_models = false;
        this.booted_socket = false;
        
        Object.defineProperty(this, 'container', {
            get() {
                return this.c;
            }
        });
    }
    
    /**
     * Boots the application
     * 
     * @param {string} app_name
     * @param {string} root_dir
     * @returns {Roastr}
     */
    boot(app_name, root_dir) {
        if (this.booted) {
            throw new Error('Roastr application is already booted.');
        }
        
        this.c.set('name', app_name);
        this.c.set('root', root_dir);
        let app_container_path = this.c.get('dirs').app + '/container.js';
        if (files.existsSync(app_container_path)) {
            require(app_container_path);
        }
        
        this._setupTemplates();
        this._setupModels();
        this._setupHTTPRoutes();
        this._setupSocketRoutes();
        
        process.on('SIGTERM', this.stop.bind(this));
        process.on('SIGINT',  this.stop.bind(this));
        
        this.booted = true;
        this.events.emit('booted', this);
        
        return this;
    }
    
    /**
     * Listen for HTTP and socket connections
     */
    listen() {
        if (!this.booted) {
            throw new Error('Roastr application has not been booted.');
        }
        
        let container = this.c;
        let events    = this.events;
        let config    = container.get('config');
        let logger    = container.get('logger');
        let express   = container.get('express');
        let server    = container.get('server');
        let socket    = container.get('socket');
        
        container.values('middleware.roastr.').forEach(function(middleware) {
            express.use(middleware);
        });
        server.listen(config.express.port, function() {
            socket.listen();
            
            events.emit('listening', this);
            logger.info(
                'Application "%s" listening on port %d with pid %d',
                container.get('name'),
                config.express.port,
                process.pid
            );
        });
    }
    
    /**
     * Stops the server
     * 
     * @param {*} err
     */
    stop(err) {
        if (err) {
            this.c.get('logger').error(err.message);
        }
        
        this.events.emit('stopping');
        if (this.booted_models) {
            this.c.get('models').close();
        }
        if (this.booted_socket) {
            this.c.get('socket').close();
        }
        this.c.get('server').close();
        process.exit(err ? 1 : 0);
    }
    
    /**
     * Registers an event listener
     * 
     * @param {string} event
     * @param {Function} callback
     * @returns {Roastr}
     */
    on(event, callback) {
        this.events.on(event, callback);
        return this;
    }
    
    /**
     * @private
     */
    _setupModels() {
        let container = this.c;
        let orm = container.get('config.orm');
        if (!orm) {
            return;
        }
        
        let models = container.get('models');
        let logger = container.get('logger');
        let dirs   = container.get('dirs');
        
        dirs.forEach('_models', function(file) {
            require(file)(models, container);
        }.bind(this));
        dirs.forEach('models', function(file) {
            require(file)(models, container);
        });
        
        this.booted_models = true;
    }
    
    /**
     * @private
     */
    _setupHTTPRoutes() {
        let container = this.c;
        let express   = container.get('express');
        let dirs      = container.get('dirs');
        let catchall  = null;
        
        dirs.forEach('http', function(file) {
            if (path.basename(file) === 'catchall.js') {
                catchall = file;
                return;
            }
            require(file)(express, container);
        });
        if (catchall) {
            require(catchall)(express, container);
        }
    }
    
    /**
     * @private
     */
    _setupSocketRoutes() {
        let container = this.c;
        let socket    = container.get('socket');
        let logger    = container.get('logger');
        let dirs      = container.get('dirs');
        
        socket.on('connection', function(socket) {
            dirs.forEach('socket', function(file) {
                require(file)(socket, container);
            });
        });
        
        this.booted_socket = true;
    }
    
    /**
     * @private
     */
    _setupTemplates() {
        let container = this.c;
        let nunjucks  = container.get('nunjucks');
        nunjucks.express(container.get('express'));
        
        container.keys('nunjucks.global.').forEach(function(key) {
            let param = key.replace(/^nunjucks\.global\./, '');
            nunjucks.addGlobal(param, container.get(key));
        });
    }
}

/**
 * 
 * @type {Roastr}
 */
module.exports = Roastr;