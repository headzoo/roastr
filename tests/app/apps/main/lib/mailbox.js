'use strict';

const Promise    = require('bluebird');
const Billing    = require('./finance/billing');
const FundsError = require('./finance/errors/funds');
const container  = require('../container');

let logger = null;
let config = null;

class Mailbox {
    
    /**
     *
     * @param l
     */
    static setLogger(l) {
        logger = l;
    }
    
    /**
     * 
     * @param c
     */
    static setConfig(c) {
        config = c;
    }
    
    /**
     * 
     * @param username
     * @param socket
     * @param redis
     * @returns {Mailbox}
     */
    static factory(username, socket, redis) {
        return new Mailbox(username, socket, redis);
    }
    
    /**
     * Constructor
     */
    constructor(username, socket, redis) {
        this.username = username;
        this.socket   = socket;
        this.redis    = redis;
        this.sub      = redis.createClient();
        this.sub.on('message', this._onMessage.bind(this));
        this.sub.subscribe('mailbox/' + username);
    }
    
    /**
     * 
     */
    destroy() {
        this.sub.unsubscribe('mailbox/' + this.username);
        this.sub.quit();
        this.sub      = null;
        this.username = null;
    }
    
    /**
     *
     * @returns {bluebird|exports|module.exports}
     */
    sendInbox() {
        var self  = this;
        var Inbox = container.get('model.inboxes');
        
        return new Promise(function(resolve, reject) {
            var u_prom = Inbox.countByState(self.username, 'unread');
            var m_prom = Inbox.findByUsername(self.username);
            Promise.join(u_prom, m_prom, function(num_unread, conversations) {
                return self.emit('mailbox/inbox', {num_unread, conversations});
            })
            .then(resolve)
            .catch(reject);
        });
    }
    
    /**
     *
     * @param from_username
     * @returns {bluebird|exports|module.exports}
     */
    sendConversation(from_username) {
        var self = this;
        
        return container.get('model.inboxes').findConversation(this.username, from_username, 20)
            .then(function(rows) {
                rows.reverse();
                return self.emit('mailbox/inbox/conversation', {
                    from: from_username,
                    rows: rows
                });
            });
        /*
        var conversation = [
            {
                id: 1,
                sent_from: 'user',
                msg: 'Hey there! What\'s up?',
                created_at: '2016-08-24T18:33:38.000Z'
            },
            {
                id: 2,
                sent_from: 'operator',
                msg: 'Do you like this picture of me?',
                created_at: '2016-08-24T18:34:38.000Z',
                upload: {
                    description: '',
                    alt: 'Media Attachment',
                    created_at: 'Tue Aug 23 2016 17:15:00 GMT-0400 (EDT)',
                    updated_at: 'Tue Aug 23 2016 17:15:00 GMT-0400 (EDT)',
                    contents: [
                        {
                            "type": "image",
                            "thumb_mime": "image/jpg",
                            "media_mime": "image/jpg",
                            "thumb_filename": "goodie5.jpg",
                            "media_filename": "goodie5.jpg",
                            "thumb_size": "100x150",
                            "media_size": "1080x1080",
                            "host": {
                                "name": "images",
                                "proto": "http",
                                "domain": "dev.steamynights.com",
                                "path": "images"
                            }
                        }
                    ]
                }
            },
            {
                id: 3,
                sent_from: 'operator',
                msg: '',
                created_at: '2016-08-24T18:36:38.000Z',
                goodie: {
                    type: 'image',
                    title: 'Cosplay Gallery #1',
                    description: 'My favorite nude pictures!',
                    price: 599,
                    rating: 4,
                    media_count: 12,
                    call_minutes: 0,
                    text_count: 0,
                    upload: {
                        description: '',
                        alt: '',
                        created_at: 'Tue Aug 23 2016 17:15:00 GMT-0400 (EDT)',
                        updated_at: 'Tue Aug 23 2016 17:15:00 GMT-0400 (EDT)',
                        contents: [
                            {
                                "type": "image",
                                "thumb_mime": "image/jpg",
                                "media_mime": "image/jpg",
                                "thumb_filename": "goodie1.jpg",
                                "media_filename": "goodie1.jpg",
                                "thumb_size": "100x150",
                                "media_size": "1080x1080",
                                "host": {
                                    "name": "images",
                                    "proto": "http",
                                    "domain": "dev.steamynights.com",
                                    "path": "images"
                                }
                            }
                        ]
                    }
                }
            },
            {
                id: 4,
                sent_from: 'user',
                msg: 'Check out this bubble!',
                created_at: '2016-08-24T18:41:38.000Z'
            },
            {
                id: 5,
                sent_from: 'user',
                msg: 'It\'s pretty cool!',
                created_at: '2016-08-24T18:46:38.000Z'
            },
            {
                id: 6,
                sent_from: 'operator',
                msg: 'Yeah it\'s pure CSS & HTML',
                created_at: '2016-08-24T18:56:38.000Z'
            },
            {
                id: 7,
                sent_from: 'user',
                msg: 'This bubble can get pretty high too. It keeps growing, and growing, and growing.',
                created_at: '2016-08-24T19:03:38.000Z'
            },
            {
                id: 8,
                sent_from: 'operator',
                msg: 'This bubble can get pretty high too. It keeps growing, and growing, and growing.',
                created_at: '2016-08-24T19:08:38.000Z'
            },
            {
                id: 9,
                sent_from: 'operator',
                msg: 'So what are you up to?',
                created_at: '2016-08-24T19:24:38.000Z'
            },
            {
                id: 10,
                sent_from: 'user',
                msg: 'Not much',
                created_at: new Date()
            }
        ];
        */
    }
    
    /**
     *
     * @param to_username
     * @param message
     * @returns {bluebird|exports|module.exports}
     */
    send(to_username, message) {
        var self = this;
        
        return new Promise(function (resolve, reject) {
            message = message.trim();
            if (message.length < config.mailbox.message_min_len) {
                throw 'Mailbox message failed validation message_min_len.';
            } else if (message.length > config.mailbox.message_max_len) {
                throw 'Mailbox message failed validation message_max_len.';
            }
            
            var Inbox = container.get('model.inboxes');
            var User  = container.get('model.users');
            Promise.join(
                User.findByUsername(self.username),
                User.findByUsername(to_username),
                function(from_user, to_user) {
                    if (!from_user || !to_user) {
                        return reject('Unknown user(s).');
                    }
                    
                    var inbox = {
                        from_id    : from_user.get('id'),
                        to_id      : to_user.get('id'),
                        message    : message,
                        state      : 'unread',
                        created_at : new Date()
                    };
                    
                    var billing = new Billing();
                    billing.chargeForText(inbox)
                        .then(function() {
                            inbox = new Inbox(inbox);
                            return inbox.save();
                        })
                        .then(function(i) {
                            inbox = i.serialize();
                            inbox.from_username = self.username;
                            inbox.to_username   = to_username;
                            return self.emit('mailbox/send', inbox);
                        })
                        .then(function() {
                            return self.redis.publishAsync('mailbox/' + to_username, JSON.stringify(inbox));
                        })
                        .catch(function(err) {
                            if (err instanceof FundsError) {
                                return self.emit('billing/funds', err);
                            }
                            reject(err);
                        });
                }
            );
        });
    }
    
    /**
     * 
     * @param state
     * @param message_ids
     */
    updateState(state, message_ids) {
        var self = this;
        
        return new Promise(function(resolve, reject) {
            container.get('model.inboxes').updateState(self.username, state, message_ids)
                .then(function() {
                    return self.sendInbox();
                })
                .then(resolve)
                .catch(reject);
        });
    }
    
    /**
     *
     * @param event
     * @param data
     * @private
     */
    emit(event, data) {
        var self = this;
        
        return new Promise(function(resolve) {
            logger.debug("Mailbox emit '%s' to %s.", event, self.username);
            self.socket.emit(event, data);
            resolve();
        });
    }
    
    /**
     * 
     * @param channel
     * @param data
     * @private
     */
    _onMessage(channel, data) {
        if (channel !== 'mailbox/' + this.username) {
            return;
        }
        
        this.sendInbox();
        this.emit('mailbox/incoming', JSON.parse(data));
    }
}

module.exports = Mailbox;