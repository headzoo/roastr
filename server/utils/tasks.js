'use strict';

const _             = require('lodash');
const child_process = require('child_process');
const Promise       = require('bluebird');
const waitUntil     = require('wait-until');
const path          = require('path');

const DEFAULT_TASK_OPTIONS = {
    silent: true
};

/**
 * 
 */
class Tasks {
    
    /**
     * Constructor
     * 
     * @param logger
     */
    constructor(logger) {
        this.logger  = logger;
        this.files   = [];
        this.tasks   = {};
        this.running = 0;
    }
    
    /**
     * 
     * @param file
     * @returns {Tasks}
     */
    add(file) {
        this.files.push(file);
        return this;
    }
    
    /**
     *
     */
    start() {
        this.files.forEach(function(file) {
            let id = path.basename(file, '.js');
            
            this.tasks[id] = new Task(id, file, this.logger);
            this.tasks[id].run();
            this.tasks[id].on('exit', function() {
                delete this.tasks[id];
                this.running--;
            }.bind(this));
            this.running++;
        }.bind(this));
    }
    
    /**
     *
     * @returns {bluebird|exports|module.exports}
     */
    stop() {
        return new Promise(function(resolve) {
            _.forOwn(this.tasks, function(task) {
                task.stop();
            });
            waitUntil(100, 10, function condition() {
                return this.running == 0;
            }.bind(this), resolve);
        }.bind(this));
    }
    
    /**
     * 
     * @param id
     * @returns {*}
     */
    task(id) {
        return this.tasks[id];
    }
}

/**
 * 
 */
class Task {
    
    /**
     * Constructor
     * 
     * @param {string} id        Task identifier
     * @param {string} filename  Task file
     * @param {*} logger         The logger
     * @param {Array} [args]     Args passed to fork()
     * @param {*} [options]      Options passed to fork()
     */
    constructor(id, filename, logger, args, options) {
        this.id       = id;
        this.filename = filename;
        this.logger   = logger;
        this.options  = options || DEFAULT_TASK_OPTIONS;
        this.args     = args || [];
        this.events   = [];
        this.child    = null;
    }
    
    /**
     *
     * @returns {*|Number}
     */
    get pid() {
        return this.child.pid;
    }
    
    /**
     * 
     * @param event
     * @param callback
     * @returns {Task}
     */
    on(event, callback) {
        if (this.child === null) {
            this.events.push({event, callback});
        } else {
            this.child.on(event, callback);
        }
        
        return this;
    }
    
    /**
     * 
     * @param message
     */
    send(message) {
        if (this.child === null) {
            throw new Error('Task is not running.');
        }
        this.child.send(message);
    }
    
    /**
     *
     */
    run() {
        var self = this;
        if (self.child !== null) {
            throw new Error('Task already running.');
        }
        
        self.child = child_process.fork(
            self.filename,
            self.args,
            self.options
        );
        self.child.stderr.on('data', function(data) {
            self.logger.error(data.toString());
        });
        self.child.on('error', function(err) {
            self.logger.error(err);
        });
        self.child.on('message', function(data) {
            self.logger.info(data);
        });
        self.child.on('exit', function() {
            self.child = null;
            self.logger.info('Task "%s" stopped.', self.id);
        });
        self.events.forEach(function(obj) {
            self.child.on(obj.event, obj.callback);
        });
        
        self.logger.info('Task "%s" running with pid %d.', self.id, self.child.pid);
    }
    
    /**
     *
     */
    stop() {
        if (this.child !== null) {
            this.child.kill();
        }
    }
}

module.exports = Tasks;