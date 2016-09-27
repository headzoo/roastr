'use strict';

const path = require('path');
const fs   = require('fs');

module.exports = function(err, req, res, next) {
    let container = require('../../container');
    container.get('logger').error(err);
    
    if (req.headers['content-type'] !== undefined && req.headers['content-type'].indexOf('application/json') !== -1) {
        return res.status(500).json({
            error: 'System Error'
        });
    }
    
    let stack;
    if (err.stack !== undefined) {
        stack = err.stack;
    } else {
        stack = (new Error()).stack;
    }
    
    let nunjucks = container.get('template');
    let template = '../../template/error.' + container.get('env') + '.html.tpl';
    fs.readFile(path.resolve(__dirname, template), function(e, data) {
        if (e) return next(e);
        let error_page = nunjucks.renderString(data.toString(), {
            error: err,
            stack: stack
        });
        res.status(500).send(error_page);
    });
};