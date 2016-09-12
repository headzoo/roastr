'use strict';

$.getScript('/socket.io/socket.io.js')
    .done(function() {
        let socket = io();
        console.log('Roastr!');
    });
    
