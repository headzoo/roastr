'use strict';

var _ = require('lodash');

const CONFIG = {
    replace_import: '_import:'
};

class PreProcessor {
    
    /**
     * Constructor
     * 
     * @param {Object} [config]
     */
    constructor(config) {
        this.config       = _.merge({}, CONFIG, config);
        this.regex_import = new RegExp(/@import:/g);
    }
    
    /**
     * 
     * @param {string|Buffer} data
     * @returns {string|*}
     */
    process(data) {
        data = String(data);
        data = this._processImport(data);
        
        return data;
    }
    
    /**
     * 
     * @param {string} str
     * @returns {*}
     * @private
     */
    _processImport(str) {
        return str.replace(this.regex_import, this.config.replace_import);
    }
}

module.exports = PreProcessor;