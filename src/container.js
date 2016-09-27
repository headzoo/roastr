'use strict';

const _         = require('lodash');
const Container = require('roastr-container');
const path      = require('path');
const files     = require('./utils/files');

let container = new Container();

container.set('env', ['template.global'], process.env.NODE_ENV || 'development');

container.factory('config', ['template.global'], function() {
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

container.factory('express', function() {
    let express = require('express')();
    container.tagged('express.middleware', function(middleware) {
        express.use(middleware);
    });
    
    let config = container.get('config');
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
    let express = container.get('express');
    return require('http').Server(express);
});

container.factory('socket', function() {
    let Socket = require('./comm/socket');
    
    return new Socket(
        container.get('server'),
        container.get('config'),
        container.get('logger'),
        container.get('dirs')
    );
});

container.factory('tasks', function() {
    let Tasks  = require('./utils/tasks');
    let tasks  = new Tasks(container.get('logger'));
    let dirs   = container.get('dirs');
    let files  = container.get('config').tasks || [];
    
    files.forEach(function(file) {
        tasks.add(dirs.join('tasks', file));
    });
    
    return tasks;
});

container.factory('models', function() {
    let Models = require('./utils/models');
    
    return new Models(
        container,
        container.get('bookshelf')
    );
});

container.factory('nunjucks', function() {
    let nunjucks    = require('nunjucks');
    let Environment = require('./template/environment');
    
    let env = new Environment(
        new nunjucks.FileSystemLoader(container.get('dirs').get('views')),
        container.get('config.template')
    );
    env.express(container.get('express'));
    container.tagged('template.global', function(value, key) {
        env.addGlobal(key, value);
    });
    
    return env;
});

container.factory('dirs', function() {
    let Directories = require('./utils/dirs');
    
    return new Directories(
        container.get('root'),
        container.get('name')
    );
});

container.factory('logger', function() {
    let config  = container.get('config');
    let winston = require('winston');
    
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
    let JWT = require('./security/jwt');
    return new JWT(container.get('config'));
});

container.factory('knex', function() {
    let config = container.get('config');
    
    return require('knex')({
        client     : config.orm.client,
        connection : config.orm.connection
    });
});

container.factory('bookshelf', function() {
    let bookshelf = require('bookshelf')(container.get('knex'));
    container.tagged('bookshelf.plugin', function(plugin) {
        bookshelf.plugin(plugin);
    });
    
    return bookshelf;
});

container.factory('redis', function() {
    let redis    = require("redis");
    let config   = container.get('config');
    let bluebird = require('bluebird');
    
    bluebird.promisifyAll(redis.RedisClient.prototype);
    bluebird.promisifyAll(redis.Multi.prototype);
    
    let client = redis.createClient(config.redis.connection);
    client.createClient = function() {
        return redis.createClient(config.redis.connection);
    };
    client.config    = config.redis;
    client.databases = config.redis.databases;
    
    return client;
});

container.factory('passwords', function() {
    let Passwords = require('./crypt/passwords');
    return new Passwords(container.get('config'));
});

container.set('bookshelf.registry', ['bookshelf.plugin'], 'registry');

container.set('bookshelf.pagination', ['bookshelf.plugin'], 'pagination');

container.set('bookshelf.visibility', ['bookshelf.plugin'], 'visibility');

container.factory('express.session', ['express.middleware'], function() {
    let session    = require('express-session');
    let RedisStore = require('connect-redis')(session);
    let config     = container.get('config');
    
    let redis_config = _.merge(config.redis.connection, {
        db: config.redis.databases.sessions
    });
    let session_config = _.merge({}, config.session, {
        store: new RedisStore(redis_config),
        secret: config.security.secret
    });
    
    return session(session_config);
});

container.factory('express.body_parser', ['express.middleware'], function() {
    return require('body-parser').urlencoded({ extended: true })
});

container.set('express.body_parser_json', ['express.middleware'], require('body-parser').json());

container.factory('express.cookie_parser', ['express.middleware'], function() {
    let parser = require('cookie-parser');
    return parser(container.get('config').security.secret);
});

container.factory('express.logger', ['express.middleware'], function() {
    return require('express-winston').logger({
        winstonInstance: container.get('logger'),
        meta: container.get('config').log.meta
    });
});

container.set('http.auth', require('./middleware/http/auth'));

container.set('socket.auth', require('./middleware/socket/auth'));

container.set('roastr.error', ['roastr.middleware'], require('./middleware/http/error'));

module.exports = container;