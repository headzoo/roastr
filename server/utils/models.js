'use strict';

class Models {
    
    /**
     * 
     * @param container
     * @param bookshelf
     */
    constructor(container, bookshelf) {
        this.container = container;
        this.bookshelf = bookshelf;
        this.models    = {};
    }
    
    /**
     * 
     */
    close() {
        this.bookshelf.knex.destroy();
    }
    
    /**
     * 
     * @param table_name
     * @param [opts]
     * @returns {*}
     */
    make(table_name, opts) {
        opts = opts || {};
        opts.tableName = table_name;
        
        var model = this.bookshelf.Model.extend(opts);
        model.create = function(values) {
            return new model(values);
        };
        
        this.models[table_name] = model;
        this.bookshelf.model(table_name, model);
        this.container.set('model.' + table_name, model);
        
        return model;
    }
    
    /**
     * 
     * @param table_name
     * @returns {*}
     */
    get(table_name) {
        if (this.models[table_name] === undefined) {
            throw new Error('Table "' + table_name + '" not found.');
        }
        return this.models[table_name];
    }
}

module.exports = Models;