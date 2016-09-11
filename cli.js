'use strict';

const objects = require('./server/utils/objects');
const argv    = require('yargs').argv;
const cwd     = process.cwd();
const path    = require('path');
const fs      = require('fs-extra');

if (argv.build) {
    const app = 'apps/' + argv.build;
    let dirs = [
        'config',
        'logs',
        'public',
        'apps',
        app,
        app + '/http',
        app + '/socket',
        app + '/models',
        app + '/views',
        app + '/views/home',
        app + '/public',
        app + '/public/images',
        app + '/public/less',
        app + '/public/scripts'
    ];
    
    dirs.forEach(function(dir) {
        dir = path.resolve(cwd, dir);
        if (!fs.existsSync(dir)) {
            console.log('Creating directory ' + dir);
            fs.mkdirSync(dir);
        }
    });
    
    const app_dest = path.resolve(cwd, app);
    const skeleton = path.resolve(__dirname, 'skeleton');
    let files = [
        {src: skeleton + '/package.json',  dest: cwd + '/package.json'},
        {src: skeleton + '/roastr.config.js',  dest: cwd + '/roastr.config.js'},
        {src: skeleton + '/gulpfile.js',       dest: cwd + '/gulpfile.js'},
        {src: skeleton + '/webpack.config.js', dest: cwd + '/webpack.config.js'},
        {src: skeleton + '/config/default.yml', dest: cwd + '/config/default.yml'},
        {src: skeleton + '/config/development.yml', dest: cwd + '/config/' + argv.build + '.development.yml'},
        {src: skeleton + '/config/production.yml', dest: cwd + '/config/' + argv.build + '.production.yml'},
        {src: skeleton + '/app/container.js',  dest: app_dest + '/container.js'},
        {src: skeleton + '/app/http/home.js',  dest: app_dest + '/http/home.js'},
        {src: skeleton + '/app/socket/echo.js',  dest: app_dest + '/socket/echo.js'},
        {src: skeleton + '/app/http/home.js',  dest: app_dest + '/http/home.js'},
        {src: skeleton + '/app/models/users.js',  dest: app_dest + '/models/users.js'},
        {src: skeleton + '/app/http/home.js',  dest: app_dest + '/http/home.js'},
        {src: skeleton + '/app/views/layout.html.tpl',  dest: app_dest + '/views/layout.html.tpl'},
        {src: skeleton + '/app/views/home/index.html.tpl',  dest: app_dest + '/views/home/index.html.tpl'},
        {src: skeleton + '/app/public/images/rooster.jpg',  dest: app_dest + '/public/images/rooster.jpg'},
        {src: skeleton + '/app/public/less/app.less',  dest: app_dest + '/public/less/app.less'},
        {src: skeleton + '/app/public/scripts/app.js',  dest: app_dest + '/public/scripts/app.js'},
        {src: skeleton + '/app/public/favicon.ico',  dest: app_dest + '/public/favicon.ico'}
    ];
    
    files.forEach(function(file) {
        if (!fs.existsSync(file.dest)) {
            fs.copySync(file.src, file.dest);
        }
    });
    
    let index_dest = cwd + '/index.js';
    if (!fs.existsSync(index_dest)) {
        let source = fs.readFileSync(skeleton + '/index.js').toString();
        source = source.replace('{{app_name}}', argv.build);
        fs.writeFileSync(index_dest, source);
    }
}