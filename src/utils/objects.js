'use strict';

/**
 * 
 * @param {object} obj
 * @param {Function} callback
 * @param {Array} [props]
 * @returns {*}
 */
function walk(obj, callback, props) {
    if (typeof obj !== 'object') {
        return obj;
    }
    if (!Array.isArray(props)) {
        props = [];
    }
    
    for(let key in obj) {
        if (obj.hasOwnProperty(key)) {
            props.push(key);
            if (typeof obj[key] === 'object') {
                obj[key] = walk(obj[key], callback, props);
            } else {
                obj[key] = callback(key, obj[key], props);
            }
            props.pop();
        }
    }
    
    return obj;
}

module.exports = {walk};