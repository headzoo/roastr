'use strict';

const nunjucks = require('nunjucks');
const path     = require('path');

let Environment = nunjucks.Environment;
Environment.prototype.express = function(app) {
    var env = this;
    
    function NunjucksView(name) {
        if (path.extname(name) !== '.tpl') {
            name += '.html.tpl';
        }
        this.name = name;
        this.path = name;
    }
    
    NunjucksView.prototype.render = function(opts, cb) {
        env.render(this.name, opts, cb);
    };
    
    app.set('view', NunjucksView);
    app.set('nunjucksEnv', this);
    
    return this;
};

module.exports = Environment;