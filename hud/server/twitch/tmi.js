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
        if ( !this.memo.client ) {
            this.app = app;

            this.initMe();

            this.app.lager.server( `[${this.name}] utility initialized` );
        }
    },

    emitMe ( message ) {
        this.memo.client.say( `#${this.app.config.auth.userName}`, message );
    },

    initMe () {
        this.memo.client = new tmi.client({
            options: {
                clientId: this.app.config.auth.clientId
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: this.app.config.auth.userName,
                password: this.app.config.auth.userToken
            },
            channels: [this.app.config.auth.userChannel]
        });

        this.memo.client.connect().then(( foo ) => {
            this.app.lager.server( `[${this.name}] ${this.memo.client.getUsername()} connected` );

            // Chat
            this.memo.client.on( "chat", ( channel, userstate, message, self ) => {
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
