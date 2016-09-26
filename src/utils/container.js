'use strict';

var _            = require('lodash');
var EventEmitter = require('events');

class Container {
    
    /**
     * Constructor
     */
    constructor() {
        this.events = new EventEmitter();
        this.services     = {};
        this.instances = {};
        this.tags         = {};
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
     * @returns {*}
     */
    get(key) {
        let service = this.services[key];
        if (service === undefined) {
            if (key.indexOf('.') !== -1) {
                try {
                    let parts = key.split('.');
                    let key_p = parts.shift();
                    return _.get(this.get(key_p), parts.join('.'));
                } catch (e) {
                    throw new Error('Container: Service "' + key + '" not found.');
                }
            }
            
            throw new Error('Container: Service "' + key + '" not found.');
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
     * @param {string} key
     * @param {Array|*} tags
     * @param {*} [obj]
     * @returns {Container}
     */
    set(key, tags, obj) {
        if (arguments.length == 2) {
            obj  = tags;
            tags = null;
        }
        
        this.services[key]  = false;
        this.instances[key] = obj;
        if (tags) {
            this.tagService(key, tags);
        }
        
        return this;
    }
    
    /**
     * 
     * @param {string} key
     * @param {Array|string|Function} tags
     * @param {Function} [func]
     * @returns {Container}
     */
    factory(key, tags, func) {
        if (arguments.length == 2) {
            func = tags;
            tags = null;
        }
        
        this.services[key] = {
            func: func
        };
        if (tags) {
            this.tagService(key, tags);
        }
        
        return this;
    }
    
    /**
     * 
     * @param {string} tag
     * @param {Function} [callback]
     * @returns {Object}
     */
    tagged(tag, callback) {
        if (callback) {
            this.keysByTag(tag).forEach(function(key) {
                callback(this.get(key), key);
            }.bind(this));
            return this;
        }
        
        let values = {};
        this.keysByTag(tag).forEach(function(key) {
            values[key] = this.get(key);
        }.bind(this));
        
        return values;
    }
    
    /**
     *
     * @returns {Array}
     */
    keys() {
        return Object.keys(this.services);
    }
    
    /**
     *
     * @param {string} tag
     * @returns {*}
     */
    keysByTag(tag) {
        if (this.tags[tag] === undefined) {
            return [];
        }
        
        return this.tags[tag];
    }
    
    /**
     * 
     * @param {string} key
     * @param {Array|string} tags
     * @returns {Container}
     */
    tagService(key, tags) {
        if (!Array.isArray(tags)) {
            tags = [tags];
        }
        tags.forEach(function(tag) {
            if (this.tags[tag] === undefined) {
                this.tags[tag] = [];
            }
            this.tags[tag].push(key);
        }.bind(this));
        
        return this;
    }
}

/**
 * 
 * @type {Container}
 */
module.exports = new Container();