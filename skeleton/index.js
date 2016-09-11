'use strict';

const argv   = require('yargs').argv;
const roastr = require('roastr');
const app    = roastr(argv.app || '{{app_name}}', __dirname);

app.listen();