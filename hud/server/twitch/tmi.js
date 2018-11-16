"use strict";



/**
 *
 *
 * tmi.js
 * https://docs.tmijs.org
 *
 *
 */

// Load registry
const tmi = require( "tmi.js" );



// This module
module.exports = {
    name: "twitch tmi",
    memo: {},
    init ( app ) {
        if ( !this.memo.client && !this.memo.bot ) {
            this.app = app;
            this.initMe();

            this.app.lager.server( `[${this.name}] utility initialized` );
        }
    },
    emitMe ( message ) {
        this.memo.client.say( `#${this.app.config.all.userName}`, message );
    },
    initMe () {
        this.memo.client = new tmi.client({
            options: {
                clientId: this.app.config.all.clientId
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: this.app.config.all.userName,
                password: this.app.config.all.userToken
            },
            channels: [this.app.config.all.userChannel]
        });

        this.memo.client.connect().then(( foo ) => {
            this.app.lager.server( `[${this.name}] ${this.memo.client.getUsername()} connected` );

            // Chat
            this.memo.client.on( "chat", ( channel, userstate, message, self ) => {
                console.log( userstate );
                this.app.commands.forEach(( command ) => {
                    command.exec(
                        this.memo.client,
                        this.memo.bot,
                        channel,
                        userstate,
                        message,
                        self,
                        tmi
                    );
                });
            });

        }).catch(( error ) => {
            this.app.lager.error( `[${this.name}] ${error}` );
        });
    }
};
