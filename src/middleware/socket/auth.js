'use strict';

module.exports = function(socket, event, data, next) {
    if (!socket.user) {
        return;
    }
    next();
};