'use strict';

var _    = require('lodash');
var path = require('path');

var container = require('server/utils/dic');

container.service('env', process.env.NODE_ENV || 'development');

container.factory('app', function() {
    var Application = require('server/application');
    
    return new Application(
        container,
        container.get('name'),
        container.get('env'),
        container.get('express'),
        container.get('server'),
        container.get('socket'),
        container.get('tasks'),
        container.get('models'),
        container.get('nunjucks'),
        container.get('config'),
        container.get('logger'),
        container.get('dirs')
    );
});

container.factory('express', function() {
    var express = require('express')();
    express.use(container.get('middleware.http.body_parser'));
    express.use(container.get('middleware.http.body_parser_json'));
    express.use(container.get('middleware.http.cookie_parser'));
    express.use(container.get('middleware.http.session'));
    express.use(container.get('middleware.http.json_error'));
    express.use(container.get('middleware.http.logger'));
    
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
    var Socket = require('server/comm/socket');
    
    return new Socket(
        container.get('server'),
        container.get('config'),
        container.get('logger'),
        container.get('dirs')
    );
});

container.factory('tasks', function() {
    var Tasks  = require('server/utils/tasks');
    var tasks  = new Tasks(container.get('logger'));
    var dirs   = container.get('dirs');
    var files  = container.get('config').tasks || [];
    
    files.forEach(function(file) {
        tasks.add(dirs.join('tasks', file));
    });
    
    return tasks;
});

container.factory('models', function() {
    var Models = require('server/utils/models');
    
    return new Models(
        container,
        container.get('bookshelf')
    );
});

container.factory('nunjucks', function() {
    var nunjucks    = require('nunjucks');
    var Environment = require('server/template/environment');
    
    return new Environment(
        new nunjucks.FileSystemLoader(container.get('dirs').get('views')),
        container.get('config').template
    );
});

container.factory('config', function() {
    let Params = require('server/config/params');
    let params = new Params(_.merge({}, container.get('dirs').getAll(), {
        env: container.get('env')
    }));
    let Config = require('server/config/loader');
    let config = new Config(
        container.get('dirs'),
        container.get('env'),
        params
    );
    
    return config.load(container.get('name'));
});

container.factory('dirs', function() {
    var Directories = require('server/utils/dirs');
    
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
    var JWT = require('server/security/jwt');
    return new JWT(container.get('config'));
});

container.factory('mailbox', function() {
    var Mailbox = require('server/comm/mailbox');
    Mailbox.setLogger(container.get('logger'));
    Mailbox.setConfig(container.get('config'));
    
    return Mailbox;
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
    var Passwords = require('server/crypt/passwords');
    return new Passwords(container.get('config'));
});

container.factory('middleware.http.session', function() {
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

container.service('middleware.http.auth', require('server/middleware/http/auth'));

container.service('middleware.socket.auth', require('server/middleware/socket/auth'));

container.service('middleware.http.json_error', require('server/middleware/http/json_error'));

container.factory('middleware.http.body_parser', function() {
    return require('body-parser').urlencoded({ extended: true })
});

container.service('middleware.http.body_parser_json', require('body-parser').json());

container.factory('middleware.http.cookie_parser', function() {
    var parser = require('cookie-parser');
    return parser(container.get('config').security.secret);
});

container.factory('middleware.http.logger', function() {
    return require('express-winston').logger({
        winstonInstance: container.get('logger'),
        meta: container.get('config').log.meta
    });
});

module.exports = container;