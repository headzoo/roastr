'use strict';

class InsufficientFundsError {
    
    /**
     * Constructor
     * 
     * @param message
     */
    constructor(message) {
        this.message = message;
    }
}

module.exports = InsufficientFundsError;