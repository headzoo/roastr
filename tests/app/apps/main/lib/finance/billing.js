'use strict';

const Promise    = require('bluebird');
const container  = require('server/container');
const Invoice    = container.get('model.invoices');
const Operator   = container.get('model.operators');
const FundsError = require('./errors/funds');

class Billing {
    
    /**
     * 
     * @param inbox
     * @returns {bluebird|exports|module.exports}
     */
    chargeForText(inbox) {
        return new Promise(function(resolve, reject) {
            
            Promise.join(
                Operator.findByUserId(inbox.from_id),
                Operator.findByUserId(inbox.to_id),
                function(from_op, to_op) {
                    if ((from_op && to_op) || from_op || !to_op) {
                        return resolve(true);
                    }
                    
                    var invoice = new Invoice({
                        type        : 'text',
                        user_id     : inbox.from_id,
                        operator_id : inbox.to_id,
                        inbox_id    : inbox.id,
                        price       : to_op.get('text_price'),
                        price_total : to_op.get('text_price')
                    });
                    invoice.save().then(resolve).catch(reject);
                }
            );
        });
    }
}

module.exports = Billing;