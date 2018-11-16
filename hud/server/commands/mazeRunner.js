"use strict";



/**
 *
 *
 * Proxy chat to web UI
 *
 *
 */
module.exports = {
    name: "mazeRunner",
    regex: /^\!(left|right|up|down)$/,
    memo: {},
    init ( app ) {
        this.app = app;

        this.app.lager.template( `[${this.name}] command initialized` );
    },
    exec ( client, bot, channel, userstate, message, self, tmi ) {
        this.app.runCommand( this.name, message ).then(( response ) => {
            this.app.broadcast( "mazerunner", {
                username: userstate.username,
                direction: response.match[ 1 ],
                distance: 1
            });
        });
    },
    update ( data ) {}
};
