"use strict";



// Load registry
const path = require( "path" );
const lager = require( "properjs-lager" );
const files = require( "../files" );
const jsonFile = path.join( __dirname, "../../json/labyrinth.json" );



/**
 *
 *
 * Proxy chat to web UI
 * labyrinth-render
 * labyrinth-winner
 * labyrinth-move
 *
 *
 */
module.exports = {
    name: "labyrinth",
    regex: /^\!(left|right|up|down)$|^\!(left|right|up|down)\s(\d{1,})$/,
    memo: {
        moving: false,
        json: files.read( jsonFile, true )
    },

    init ( app ) {
        this.app = app;
        this.app.lager.template( `[${this.name}] command initialized` );
    },

    exec ( client, bot, channel, userstate, message, self, tmi ) {
        this.app.runCommand( this.name, message ).then(( response ) => {
            // lager.data( userstate );
            // lager.data( response );

            if ( !this.memo.moving ) {
                this.memo.moving = true;

                const direction = response.match[ 1 ] || response.match[ 2 ];
                const distance = response.match[ 3 ] ? Number( response.match[ 3 ] ) : 1;

                lager.data({
                    user: userstate.username,
                    direction,
                    distance,
                });

                this.app.broadcast( "labyrinth-command", {
                    userstate,
                    direction,
                    distance
                });

            } else {
                lager.data({
                    user: userstate.username,
                    message: "Waiting for current turn to end..."
                });
            }
        });
    },

    update ( data ) {
        // Enable new command to come in
        this.memo.moving = false;
    },

    winner ( data ) {
        const entry = this.memo.json.find(( entry ) => {
            return (entry.userstate.id === data.userstate.id);
        });

        // Push new entry
        if ( !entry ) {
            this.memo.json.push({
                userstate: data.userstate,
                labyrinths: 1
            });

            files.write( jsonFile, this.memo.json, false );

        // Update existing entry
        } else {
            const index = this.memo.json.indexOf( entry );

            entry.labyrinth++;

            this.memo.json[ index ] = entry;

            files.write( jsonFile, this.memo.json, false );
        }
    }
};
