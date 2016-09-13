'use strict';

const _     = require('lodash');
const path  = require('path');
const files = require('./utils/files');

const container = require('./utils/container');

container.set('env', process.env.NODE_ENV || 'development');

container.factory('express', function() {
    var express = require('express')();
    container.values('middleware.express.').forEach(function(middleware) {
        express.use(middleware);
    });
    
    var config = container.get('config');
    if (config.express.disablePoweredBy) {
        express.disable('x-powered-by');
    }
    if (config.express.serverStatic) {
        express.use(
            require('express').static('public/' + container.get('name'))
        );
    }
    
    return express;
});

container.factory('server', function() {
    var express = container.get('express');
    return require('http').Server(express);
});

container.factory('socket', function() {
    var Socket = require('./comm/socket');
    
    return new Socket(
        container.get('server'),
        container.get('config'),
        container.get('logger'),
        container.get('dirs')
    );
});

container.factory('tasks', function() {
    var Tasks  = require('./utils/tasks');
    var tasks  = new Tasks(container.get('logger'));
    var dirs   = container.get('dirs');
    var files  = container.get('config').tasks || [];
    
    files.forEach(function(file) {
        tasks.add(dirs.join('tasks', file));
    });
    
    return tasks;
});

container.factory('models', function() {
    var Models = require('./utils/models');
    
    return new Models(
        container,
        container.get('bookshelf')
    );
});

container.factory('nunjucks', function() {
    var nunjucks    = require('nunjucks');
    var Environment = require('./template/environment');
    
    return new Environment(
        new nunjucks.FileSystemLoader(container.get('dirs').get('views')),
        container.get('config').template
    );
});

container.factory('config', function() {
    let Params = require('./config/params');
    let params = new Params(_.merge({}, container.get('dirs').getAll(), {
        env: container.get('env')
    }));
    let Config = require('./config/loader');
    let config = new Config(
        container.get('dirs'),
        container.get('env'),
        params
    );
    
    return config.load(container.get('name'));
});

container.factory('dirs', function() {
    var Directories = require('./utils/dirs');
    
    return new Directories(
        container.get('root'),
        container.get('name')
    );
});

container.factory('logger', function() {
    var config  = container.get('config');
    var winston = require('winston');
    
    winston.level = config.log.level;
    winston.remove(winston.transports.Console);
    winston.add(winston.transports.Console, {
        colorize: true,
        json: false
    });
    winston.add(winston.transports.File, {
        filename: container.get('dirs').join('logs', config.log.file),
        json: false
    });
    
    return winston;
});

container.factory('jwt', function() {
    var JWT = require('./security/jwt');
    return new JWT(container.get('config'));
});

container.factory('knex', function() {
    var config = container.get('config');
    
    return require('knex')({
        client     : config.orm.client,
        connection : config.orm.connection
    });
});

container.factory('bookshelf', function() {
    var bookshelf = require('bookshelf')(container.get('knex'));
    bookshelf.plugin('registry');
    bookshelf.plugin('visibility');
    
    return bookshelf;
});

container.factory('redis', function() {
    var redis    = require("redis");
    var config   = container.get('config');
    var bluebird = require('bluebird');
    
    bluebird.promisifyAll(redis.RedisClient.prototype);
    bluebird.promisifyAll(redis.Multi.prototype);
    
    var client = redis.createClient(config.redis.connection);
    client.createClient = function() {
        return redis.createClient(config.redis.connection);
    };
    client.config    = config.redis;
    client.databases = config.redis.databases;
    
    return client;
});

container.factory('passwords', function() {
    var Passwords = require('./crypt/passwords');
    return new Passwords(container.get('config'));
});

/**
 * Middleware
 */
container.factory('middleware.express.session', function() {
    var session    = require('express-session');
    var RedisStore = require('connect-redis')(session);
    var config     = container.get('config');
    
    var redis_config = _.merge(config.redis.connection, {
        db: config.redis.databases.sessions
    });
    var session_config = _.merge({}, config.session, {
        store: new RedisStore(redis_config),
        secret: config.security.secret
    });
    
    return session(session_config);
});

container.factory('middleware.express.body_parser', function() {
    return require('body-parser').urlencoded({ extended: true })
});

container.set('middleware.express.body_parser_json', require('body-parser').json());

container.factory('middleware.express.cookie_parser', function() {
    var parser = require('cookie-parser');
    return parser(container.get('config').security.secret);
});

container.factory('middleware.express.logger', function() {
    return require('express-winston').logger({
        winstonInstance: container.get('logger'),
        meta: container.get('config').log.meta
    });
});

container.set('middleware.http.auth', require('./middleware/http/auth'));

container.set('middleware.socket.auth', require('./middleware/socket/auth'));

container.set('middleware.roastr.error', require('./middleware/http/error'));

/**
 * Nunjucks globals and extensions
 */
container.factory('nunjucks.global.env', function() {
    return container.get('env');
});

container.factory('nunjucks.global.config', function() {
    return container.get('config');
});

module.exports = container;