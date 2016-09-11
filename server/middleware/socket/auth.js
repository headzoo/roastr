'use strict';

module.exports = function(socket, event, data, next) {
    if (!socket.user) {
        socket.emit('authentication/required');
        return;
    }
    next();
};