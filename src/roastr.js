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
        this.booted_tasks  = false;
        
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
        this._setupRoutes();
        this._setupSocket();
        this._setupTasks();
        
        process.on('SIGTERM', this.stop.bind(this));
        process.on('SIGINT',  this.stop.bind(this));
        
        this.booted = true;
        this.events.emit('booted', this);
        this.c.get('logger').debug('Application boot complete.');
        
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
        let tasks     = container.get('tasks');
        
        container.tagged('roastr.middleware', function(middleware) {
            express.use(middleware);
        });
        server.listen(config.express.port, function() {
            if (this.booted_socket) {
                socket.listen();
            }
            tasks.start();
            
            events.emit('listening', this);
            logger.info(
                'Application "%s" listening on port %d with pid %d',
                container.get('name'),
                config.express.port,
                process.pid
            );
        }.bind(this));
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
        
        let logger = this.c.get('logger');
        this.events.emit('stopping');
        if (this.booted_models) {
            this.c.get('models').close();
            logger.debug('Models closed.');
        }
        if (this.booted_socket) {
            this.c.get('socket').close();
            logger.debug('Sockets closed.');
        }
        if (this.booted_tasks) {
            this.c.get('tasks').stop();
            logger.debug('Tasks stopped.');
        }
        
        this.c.get('server').close();
        logger.debug('Server closed.');
        
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
        let count  = 0;
        
        dirs.forEach('_models', function(file) {
            require(file)(models, container);
            count++;
        }.bind(this));
        dirs.forEach('models', function(file) {
            require(file)(models, container);
            count++;
        });
        
        if (count !== 0) {
            this.booted_models = true;
            this.events.emit('booted.models', this);
            logger.debug('Models booted.');
        }
    }
    
    /**
     * @private
     */
    _setupRoutes() {
        let container = this.c;
        let express   = container.get('express');
        let logger    = container.get('logger');
        let dirs      = container.get('dirs');
        let count     = 0;
        let catchall  = null;
        
        dirs.forEach('routes', function(file) {
            if (path.basename(file) === 'catchall.js') {
                catchall = file;
                return;
            }
            require(file)(express, container);
            count++;
        });
        if (catchall) {
            require(catchall)(express, container);
            count++;
        }
        
        if (count !== 0) {
            this.events.emit('booted.routes', this);
            logger.debug('Routes booted.');
        }
    }
    
    /**
     * @private
     */
    _setupSocket() {
        let container = this.c;
        let socket    = container.get('socket');
        let logger    = container.get('logger');
        let dirs      = container.get('dirs');
        let count     = 0;
        
        socket.on('connection', function(socket) {
            dirs.forEach('socket', function(file) {
                require(file)(socket, container);
                count++;
            });
        });
        
        if (count !== 0) {
            this.booted_socket = true;
            this.events.emit('booted.socket', this);
            logger.debug('Socket handlers booted.');
        }
    }
    
    /**
     * @private
     */
    _setupTemplates() {
        let container = this.c;
        let logger    = container.get('logger');
        let nunjucks  = container.get('nunjucks');
        nunjucks.express(container.get('express'));
        container.tagged('template.global', function(value, key) {
            nunjucks.addGlobal(key, value);
        });
        
        this.events.emit('booted.templates', this);
        logger.debug('Templates booted.');
    }
    
    /**
     * @private
     */
    _setupTasks() {
        let tasks  = this.c.get('tasks');
        let dirs   = this.c.get('dirs');
        let logger = this.c.get('logger');
        
        dirs.forEach('tasks', function(file) {
            tasks.add(file);
        });
        
        this.booted_tasks = true;
        this.events.emit('booted.tasks', this);
        logger.debug('Tasks booted.');
    }
}

/**
 * 
 * @type {Roastr}
 */
module.exports = Roastr;