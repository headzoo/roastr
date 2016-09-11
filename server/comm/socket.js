'use strict';

var _            = require('lodash');
var EventEmitter = require('events');

class Socket {
    
    /**
     * Constructor
     *
     * @param server
     * @param config
     * @param logger
     * @param dirs
     */
    constructor(server, config, logger, dirs) {
        this.io        = null;
        this.events    = new EventEmitter();
        this.server    = server;
        this.config    = config;
        this.logger    = logger;
        this.dirs      = dirs;
    }
    
    /**
     * 
     * @param event
     * @param callback
     * @returns {*}
     */
    on(event, callback) {
        return this.events.on(event, callback);
    }
    
    /**
     * 
     */
    listen() {
        this.io = require('socket.io')(this.server);
        this.io.adapter(this._adapter());
        this.io.on('connection', function(socket) {
            this._setupSocket(socket);
            this.events.emit('connection', socket);
        }.bind(this));
        this.logger.info('Socket listening for connections.');
    }
    
    /**
     * 
     */
    close() {
        if (this.io) {
            this.logger.info('Socket connections closing...');
            _.forOwn(this.io.sockets.sockets, function(s) {
                s.disconnect(true);
            });
        }
    }
    
    /**
     * 
     * @returns {*}
     * @private
     */
    _adapter() {
        var adapter = require('socket.io-redis');
        return adapter(this.config.redis.connection);
    }
    
    /**
     * 
     * @param socket
     * @private
     */
    _setupSocket(socket) {
        socket.on('error', function(err) {
            this.logger.error(err);
            if (this.config.env == 'development') {
                throw err;
            }
        }.bind(this));
        
        socket.on('disconnect', function() {
            if (socket.mailbox) {
                socket.mailbox.destroy();
                delete socket.mailbox;
            }
        });
        
        socket.catch = function(err) {
            socket.emit('error', err);
        };
        
        socket.alert = function(type, message) {
            socket.emit('alert', {type, message});
        };
        
        // Adds middleware to the on method.
        var originalOn = socket.on;
        socket.on = function(event, mw, callback) {
            if (callback === undefined) {
                callback = mw;
                mw = null;
            }
            
            var data = null;
            if (mw) {
                var cb   = callback;
                var next = function(err) {
                    if (err) {
                        return socket.emit('error', err);
                    }
                    cb(data);
                };
            
                callback = function(d) {
                    data = d;
                    mw(socket, event, d, next);
                };
            }
        
            originalOn.call(socket, event, callback);
        };
    }
}

module.exports = Socket;