'use strict';

var jsonwebtoken = require('jsonwebtoken');
var bcrypt       = require('bcrypt');
var Promise      = require('bluebird');
var fs           = require('fs');

class JWT {
    
    /**
     * 
     * @param config
     */
    constructor(config) {
        this.config = config;
    }
    
    /**
     * 
     * @param user
     * @returns {bluebird|exports|module.exports}
     */
    sign(user) {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            var encoded = JWT._encodeUser(user);
            var cert = fs.readFileSync(self.config.security.keys.private);
            
            return jsonwebtoken.sign(encoded, cert, self.config.security.jwt, function(err, token) {
                if (err) return reject(err);
                resolve({
                    token: token,
                    user: encoded
                });
            });
        });
    }
    
    /**
     * 
     * @param token
     * @returns {bluebird|exports|module.exports}
     */
    verify(token) {
        var self = this;
    
        return new Promise(function(resolve, reject) {
            var cert = fs.readFileSync(self.config.security.keys.public);
            jsonwebtoken.verify(token, cert, self.config.security.jwt, function(err, decoded) {
                if (err) return reject(err);
                resolve(JWT._decodeUser(decoded));
            });
        });
    }
    
    /**
     * 
     * @param user
     * @returns {{id: *, username: *, email: *}}
     * @private
     */
    static _encodeUser(user) {
        return {
            id:       user.get('id'),
            username: user.get('username'),
            email:    user.get('email')
        }
    }
    
    /**
     * 
     * @param decoded
     * @returns {{id: *, username: *, email: (*|email|boolean|string|string)}}
     * @private
     */
    static _decodeUser(decoded) {
        return {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email
        }
    }
}

module.exports = JWT;