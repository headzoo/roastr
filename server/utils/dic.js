'use strict';

var _            = require('lodash');
var EventEmitter = require('events');

class Container {
    
    /**
     * Constructor
     */
    constructor() {
        this.events = new EventEmitter();
        this.service_keys = [];
        this.services     = {};
        this.instances    = {};
    }
    
    /**
     * 
     * @param event
     * @param callback
     * @returns {Container}
     */
    on(event, callback) {
        this.events.on(event, callback);
        return this;
    }
    
    /**
     * 
     * @param key
     * @param obj
     * @returns {Container}
     */
    set(key, obj) {
        this.service_keys.push(key);
        this.services[key]  = false;
        this.instances[key] = obj;
        
        return this;
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
                this.events.emit(key, this.instances[key]);
            }
        } else if (service === false) {
            this.services[key] = true;
            this.events.emit(key, this.instances[key]);
        }
        
        return this.instances[key];
    }
    
    /**
     * 
     * @param key
     * @param func
     * @returns {Container}
     */
    factory(key, func) {
        this.service_keys.push(key);
        this.services[key] = {
            func: func
        };
        
        return this;
    }
    
    /**
     * 
     * @param {string} [prefix]
     * @returns {Array}
     */
    keys(prefix) {
        if (!prefix) {
            return this.service_keys;
        }
        
        return this.service_keys.filter(function(key) {
            return key.indexOf(prefix) === 0;
        });
    }
    
    /**
     * Assigns the values of another container to this container
     * 
     * @param {Container} container
     * @returns {Container}
     */
    assign(container) {
        return _.assign(this, container);
    }
}

module.exports = new Container();