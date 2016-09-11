'use strict';

var container = require('../../container');

module.exports = function(err, req, res, next) {
    if (req.headers['content-type'] !== undefined && req.headers['content-type'].indexOf('application/json') === -1) {
        return next();
    }
    
    container.get('logger').info(err);
    res.status(500).json({
        success: false,
        error: 'System error.'
    });
};