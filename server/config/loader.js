'use strict';

var _            = require('lodash');
var yaml         = require('js-yaml');
var fs           = require('fs');
var PreProcessor = require('server/config/preprocessor');

class Config {
    
    /**
     * Constructor
     * 
     * @param {Directories}  dirs
     * @param {string}       env
     * @param {Params}       params
     */
    constructor(dirs, env, params)
    {
        this.dirs         = dirs;
        this.env          = env;
        this.params       = params;
        this.preprocessor = new PreProcessor();
    }
    
    /**
     * 
     * @param {string} app_name
     * @returns {Object}
     */
    load(app_name) {
        var file;
        if (app_name === 'tests') {
            file = this.dirs.root + '/_config.yml';
        } else {
            file = this.dirs.join('config', app_name + '.' + this.env + '.yml');
        }
        var config = this._read(file);
        
        return this.params.walk(config);
    }
    
    /**
     * 
     * @param {string} file
     * @returns {Object}
     * @private
     */
    _read(file) {
        var config = fs.readFileSync(file);
        config     = this.preprocessor.process(config);
        config     = yaml.load(config);
        config     = this._mergeImports(config);
        
        return config;
    }
    
    /**
     * 
     * @param {Object} config
     * @returns {Object}
     * @private
     */
    _mergeImports(config) {
        if (config._import === undefined) {
            return config;
        }
        
        var _import = config._import;
        if (!Array.isArray(_import)) {
            _import = [_import];
        }
        
        for(var i = 0; i < _import.length; i++) {
            var file  = this.dirs.join('config', _import[i]);
            var child = this._read(file);
            config    = _.assign({}, child, config);
        }
        
        delete config._import;
        return config;
    }
}

module.exports = Config;