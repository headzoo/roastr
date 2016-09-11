'use strict';

module.exports = function(socket, container) {
    console.log('here');
    socket.on('echo', function(data) {
        socket.emit(data);
    });
};