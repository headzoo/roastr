'use strict';

var container = require('../../container');

module.exports = function(req, res, next) {
    var token = req.headers['x-access-token'];
    if (!token) {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
    
    container.get('jwt').verify(token)
        .then(function(user) {
            req.decoded = user;
            next();
        }).catch(function(err) {
            container.get('logger').error(err);
            res.json({ success: false, message: 'Failed to authenticate token.'});
        });
};