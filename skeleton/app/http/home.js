'use strict';

module.exports = function(express, container) {
    
    express.get('/', function (req, res) {
        res.render('home/index', {
            title: container.get('config').site.title
        });
    });
};