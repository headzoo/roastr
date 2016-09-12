'use strict';

var _            = require('lodash');
var EventEmitter = require('events');

const reserved = [
    'events',
    'service_keys',
    'services',
    'instances',
    'on',
    'set',
    'get',
    'factory',
    'keys',
    'assign'
];

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
     * @param [prop]
     * @returns {Container}
     */
    set(key, obj, prop) {
        if (reserved.indexOf(key) !== -1) {
            throw new Error('Container: Cannot use reserved key "' + key +'".');
        }
        
        this.service_keys.push(key);
        this.services[key]  = false;
        this.instances[key] = obj;
        if (prop) {
            Object.defineProperty(this, key, {
                get() {
                    return this.get(key);
                }
            });
        }
        
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
     * @param [prop]
     * @returns {Container}
     */
    factory(key, func, prop) {
        if (reserved.indexOf(key) !== -1) {
            throw new Error('Container: Cannot use reserved key "' + key +'".');
        }
        
        this.service_keys.push(key);
        this.services[key] = {
            func: func
        };
        if (prop) {
            Object.defineProperty(this, key, {
                get() {
                    return this.get(key);
                }
            });
        }
        
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