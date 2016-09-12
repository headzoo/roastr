'use strict';

const _     = require('lodash');
const fs    = require('fs');
const path  = require('path');
const files = require('./utils/files');

class Application {
    
    /**
     * Constructor
     * 
     * @param container
     * @param name
     * @param env
     * @param express
     * @param server
     * @param socket
     * @param tasks
     * @param models
     * @param nunjucks
     * @param config
     * @param logger
     * @param dirs
     */
    constructor(container, name, env, express, server, socket, tasks, models, nunjucks, config, logger, dirs) {
        this.express   = express;
        this.server    = server;
        this.socket    = socket;
        this.tasks     = tasks;
        this.models    = models;
        this.nunjucks  = nunjucks;
        this.config    = config;
        this.logger    = logger;
        this.dirs      = dirs;
        this.booted    = false;
        
        Object.defineProperty(this, 'name', {
            get() {
                return name;
            }
        });
        Object.defineProperty(this, 'env', {
            get() {
                return env;
            }
        });
        Object.defineProperty(this, 'container', {
            get() {
                return container;
            }
        });
    }
    
    /**
     * 
     * @returns {Application}
     */
    boot() {
        if (this.booted) {
            throw new Error('Application has already booted.');
        }
        
        this._setupTemplates();
        this._setupModels();
        this._setupRoutes();
        this.socket.on('connection', this._setupSocketRoutes.bind(this));
        this.container.keys('middleware.booted.').forEach(function(key) {
            this.express.use(this.container.get(key));
        }.bind(this));
        this.booted = true;
        
        return this;
    }
    
    /**
     *
     */
    listen() {
        if (!this.booted) {
            this.boot();
        }
        
        this.express.use(this._expressErrors.bind(this));
        process.on('SIGTERM',   this.stop.bind(this));
        process.on('SIGINT',    this.stop.bind(this));
        this.server.on('error', this.stop.bind(this));
        this.server.listen(this.config.express.port, function() {
            this.tasks.start();
            this.socket.listen();
            this.logger.info(
                'Application "%s" listening on port %d with pid %d',
                this.name,
                this.config.express.port,
                process.pid
            );
        }.bind(this));
    }
    
    /**
     * 
     * @param err
     */
    stop(err) {
        if (err) {
            this.logger.error(err.message);
        }
        
        this.models.close();
        this.tasks.stop().then(function() {
            this.socket.close();
            this.server.close();
            this.logger.info('Waiting for connections to close...');
            setTimeout(function() {
                this.logger.info('Goodbye!');
                process.exit(err ? 1 : 0);
            }.bind(this), 500);
        }.bind(this));
    }
    
    /**
     * @private
     */
    _setupModels() {
        this.dirs.forEach('_models', function(file) {
            require(file)(this.models, this.container);
            this.logger.debug('Model added: ' + file);
        }.bind(this));
        
        this.dirs.forEach('models', function(file) {
            require(file)(this.models, this.container);
            this.logger.debug('Model added: ' + file);
        }.bind(this));
    }
    
    /**
     * @private
     */
    _setupRoutes() {
        this.dirs.forEach('http', function(file) {
            require(file)(this.express, this.container);
            this.logger.debug('Route added: ' + file);
        }.bind(this));
    }
    
    /**
     * @param {*} socket
     * @private
     */
    _setupSocketRoutes(socket) {
        this.dirs.forEach('socket', function(file) {
            require(file)(socket, this.container);
            this.logger.debug('Socket route added: ' + file);
        }.bind(this));
    }
    
    /**
     * @private
     */
    _setupTemplates() {
        this.nunjucks.express(this.express);
        this.nunjucks.addGlobal('env', this.env);
        this.nunjucks.addGlobal('config', this.config);
    }
    
    /**
     * 
     * @param err
     * @param req
     * @param res
     * @param next
     * @private
     */
    _expressErrors(err, req, res, next) {
        let stack;
        if (err.stack !== undefined) {
            stack = err.stack;
        } else {
            stack = (new Error()).stack;
        }
        
        this.logger.error(err);
        var template = 'template/error.' + this.env + '.html.tpl';
        fs.readFile(path.resolve(__dirname, template), function(e, data) {
            if (e) return next(e);
            let str = this.nunjucks.renderString(data.toString(), {
                error: err,
                stack: stack
            });
            res.status(500).send(str);
        }.bind(this));
    }
}

module.exports = Application;