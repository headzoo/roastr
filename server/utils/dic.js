'use strict';

var _ = require('lodash');

class Container {
    
    /**
     * Constructor
     */
    constructor() {
        this.services  = {};
        this.instances = {};
    }
    
    /**
     * 
     * @param key
     * @param obj
     */
    service(key, obj) {
        this.services[key]  = true;
        this.instances[key] = obj;
    }
    
    /**
     * 
     * @param key
     * @param func
     */
    factory(key, func) {
        this.services[key] = {
            func: func
        };
    }
    
    /**
     * 
     * @param {Container} container
     * @returns {Container}
     */
    assign(container) {
        return _.assign(this, container);
    }
    
    /**
     * 
     * @param key
     * @returns {*}
     */
    get(key) {
        let service = this.services[key];
        if (service === undefined) {
            throw 'Invalid service "' + key + '".';
        }
        
        if (this.instances[key] === undefined) {
            if (service.func !== undefined) {
                this.instances[key] = service.func(this);
            }
        }
        
        return this.instances[key];
    }
}

module.exports = new Container();