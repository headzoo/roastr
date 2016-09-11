'use strict';

var bcrypt  = require('bcrypt');
var Promise = require('bluebird');

class Passwords {
    
    /**
     * 
     * @param config
     */
    constructor(config) {
        this.config = config;
    }
    
    /**
     * 
     * @param plain_text
     * @param hash
     * @returns {bluebird|exports|module.exports}
     */
    compare(plain_text, hash) {
        return new Promise(function(resolve, reject) {
            bcrypt.compare(plain_text, hash, function(err, matches) {
                if (err) return reject(err);
                resolve(matches);
            });
        });
    }
    
    /**
     * 
     * @param plain_text
     * @returns {bluebird|exports|module.exports}
     */
    hash(plain_text) {
        var self = this;
        return new Promise(function(resolve, reject) {
            bcrypt.hash(plain_text, self.config.security.saltLength, function(err, hash) {
                if (err) return reject(err);
                resolve(hash);
            });
        });
    }
}

module.exports = Passwords;