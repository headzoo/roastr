'use strict';

module.exports = function(socket, container) {
    
    socket.on('echo', function(data) {
        socket.emit(data);
    });
};