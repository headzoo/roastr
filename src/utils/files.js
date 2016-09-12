'use strict';

const Promise = require('bluebird');
const fs      = require('fs');

/**
 * Returns a boolean indicating whether a file exists
 *
 * @param {string} filename
 * @returns {bluebird}
 */
function exists(filename) {
    return new Promise(function(resolve, reject) {
        fs.stat(filename, function(err) {
            if (err) {
                if (err.errno === -2) {
                    return resolve(false);
                }
                return reject(err);
            }
            resolve(true);
        });
    });
}

/**
 * Returns a boolean indicating whether a file exists
 *
 * @param {string} filename
 * @returns {boolean}
 */
function existsSync(filename) {
    let exists = true;
    try {
        fs.statSync(filename);
    }
    catch(err) {
        if (err.errno === -2) {
            exists = false;
        } else {
            throw err;
        }
    }
    
    return exists;
}

module.exports = {exists, existsSync};