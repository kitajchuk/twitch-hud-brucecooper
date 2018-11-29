const tmi = require( "tmi.js" );
const path = require( "path" );
const fs = require( "fs" );
const lager = require( "properjs-lager" );
const files = require( "../lib/files" );
const request = require( "request-promise" );
const config = require( "../../../config" );
const alerts = {
    render ( item ) {
        return `
            <h1 class="teal">Objective</h1>
            <p>The first player to reach the <span class="teal">${item}</span> wins!</p>
        `;
    },

    command ( userstate, direction, distance ) {
        return `
            <p><span class="teal">${userstate.username}</span> moves <span class="teal">${direction}</span> <span class="teal">${distance}</span>.</p>
        `;
    },

    winner ( userstate, item ) {
        return `
            <h1 class="teal">Excellent</h1>
            <p><span class="teal">${userstate.username}</span> got to the <span class="teal">${item}</span> first!</p>
        `;
    },

    pokedex ( userstate, pokemon ) {
        return `
            <h1 class="teal">Excellent</h1>
            <p><span class="teal">${userstate.username}</span>, a wild <span class="teal">${pokemon}</span> was added to your Pokedex!</p>
        `;
    },

    waiting () {
        return `<p>Waiting for players&hellip;</p>`;
    }
};
const items = {
    zelda: "Chest",
    pokemon: "Pokeball"
};



class Labyrinth {
    constructor ( data, connection ) {
        this.data = data;
        this.connection = connection;
        this.regex = /^\!(left|right|up|down)$|^\!(left|right|up|down)(\d{1,})$|^\!(left|right|up|down)\s(\d{1,})$/;
        this.moving = false;
        this.filepath = path.join( __dirname, `../../../json/${this.data.channel}.json` );

        if ( !fs.existsSync( this.filepath ) ) {
            this.json = [];
            files.write( this.filepath, this.json, false );

        } else {
            this.json = files.read( this.filepath, true );
        }

        this.init();
    }



    init () {
        this.tmi = new tmi.client({
            options: {
                clientId: config.clientId,
            },
            connection: {
                reconnect: true
            },
            identity: {
                username: this.data.channel,
                password: this.data.token
            },
            channels: [`#${this.data.channel}`]
        });

        this.tmi.connect().then(() => {
            lager.server( `[LabyrinthClient] ${this.tmi.getUsername()} connected` );

            this.broadcast( "labyrinth-render", {} );
            this.broadcast( "labyrinth-alert", {
                alertHtml: alerts.render( items[ this.data.theme ] )
            });

            this.tmi.on( "chat", ( channel, userstate, message, self ) => {
                this.exec(
                    channel,
                    userstate,
                    message,
                    self
                );
            });

        }).catch(( error ) => {
            lager.error( error );
        });

        this.connection.on( "message", ( message ) => {
            // { event, data }
            const utf8Data = JSON.parse( message.utf8Data );

            if ( utf8Data.event === "labyrinth-moved" ) {
                this.moving = false;

            } else if ( utf8Data.event === "labyrinth-winner" ) {
                this.winner( utf8Data.data ).then(( pokemon ) => {
                   this.broadcast( "labyrinth-alert", {
                       alertInfo: true,
                       alertHtml: alerts.waiting()
                   });

                   if ( !pokemon ) {
                       this.broadcast( "labyrinth-alert", {
                           alertHtml: alerts.winner( utf8Data.data.userstate, items[ this.data.theme ] )
                       });

                   } else {
                       // lager.data( pokemon );
                       this.broadcast( "labyrinth-alert", {
                           alertImg: pokemon.ThumbnailImage,
                           alertHtml: alerts.pokedex( utf8Data.data.userstate, pokemon.name )
                       });
                   }
                });
            }
        });
    }



    exec ( channel, userstate, message, self ) {
        const match = message.match( this.regex );

        // lager.data( userstate );
        lager.data( match );

        if ( match ) {
            if ( !this.moving ) {
                this.moving = true;

                const direction = match[ 1 ] || match[ 2 ] || match[ 4 ];
                const distance = (match[ 3 ] || match[ 5 ]) ? Number( (match[ 3 ] || match[ 5 ]) ) : 1;

                lager.data({
                    user: userstate.username,
                    direction,
                    distance,
                });

                this.broadcast( "labyrinth-command", {
                    userstate,
                    direction,
                    distance
                });

                this.broadcast( "labyrinth-alert", {
                    alertInfo: true,
                    alertHtml: alerts.command( userstate, direction, distance )
                });

            } else {
                lager.data({
                    user: userstate.username,
                    message: "Waiting for current turn to end..."
                });
            }
        }
    }



    winner ( data ) {
        return new Promise(( resolve, reject ) => {
            // Fresh read of JSON
            this.json = files.read( this.filepath, true );

            let entry = this.json.find(( entry ) => {
                return (entry.userstate.username === data.userstate.username);
            });
            let index = 0;
            let isPush = false;

            // Push new entry
            if ( !entry ) {
                isPush = true;
                entry = {
                    userstate: data.userstate,
                    labyrinths: 1,
                    pokedex: []
                };

            // Update existing entry
            } else {
                index = this.json.indexOf( entry );
                entry.labyrinths++;
            }

            // Add Pokemon?
            request({
                url: "https://www.pokemon.com/us/api/pokedex/kalos",
                json: true

            }).then(( json ) => {
                const pokemon = json[ Math.floor( Math.random() * json.length ) ];

                entry.pokedex.push( pokemon );

                if ( isPush ) {
                    this.json.push( entry );

                } else {
                    this.json[ index ] = entry;
                }

                files.write( this.filepath, this.json, false );
                this.moving = false;

                resolve( pokemon );
            });
        });
    }



    broadcast ( event, data ) {
        this.connection.send(JSON.stringify({
            event,
            data
        }));
    }



    emit ( message ) {
        this.tmi.say( `#${this.data.channel}`, message );
    }
}



module.exports = Labyrinth;
