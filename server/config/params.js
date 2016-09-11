'use strict';

var _       = require('lodash');
var objects = require('../utils/objects');

class Params {
    
    /**
     * Constructor
     * 
     * @param {Object} params
     */
    constructor(params) {
        this.params = params;
    }
    
    /**
     * 
     * @param {string} str
     * @returns {string}
     */
    parse(str) {
        let matches = str.match(/\$\{(.*?)\}/);
        if (matches) {
            let param_key   = matches[1];
            let param_value = _.get(this.params, param_key);
            if (param_value === undefined) {
                throw 'Param "${' + param_key + '}" found with no value.';
            }
            str = str.replace(matches[0], param_value);
        }
        
        return str;
    }
    
    /**
     * 
     * @param {Object} obj
     * @returns {Object}
     */
    walk(obj) {
        return objects.walk(obj, function(key, value, props) {
            if (typeof value === 'string') {
                try {
                    value = this.parse(value);
                } catch (err) {
                    throw err + ' At "' + props.join('.') + '".';
                }
            }
            
            return value;
        }.bind(this));
    }
}

module.exports = Params;