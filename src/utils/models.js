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
     * @param [opts]
     * @returns {*}
     */
    add(opts) {
        var model = this.bookshelf.Model.extend(opts);
        
        this.bookshelf.model(opts.tableName, model);
        this.models[opts.tableName] = model;
        Object.defineProperty(this, opts.tableName, {
            get() {
                return this.models[opts.tableName];
            }
        });
        
        return model;
    }
}

module.exports = Models;