const path = require( "path" );
const fs = require( "fs" );
const lager = require( "properjs-lager" );
const files = require( "../lib/files" );



class Leaderboards {
    constructor ( connection ) {
        this.connection = connection;
        this.directory = path.join( __dirname, `../../json` );

        this.init();
        this.process();
    }



    init () {
        this.connection.on( "message", ( message ) => {
            // { event, data }
            const utf8Data = JSON.parse( message.utf8Data );

            lager.data( utf8Data );
        });
    }



    process () {
        const leads = fs.readdirSync( this.directory );
        const runner = ( filename ) => {
            if ( /\.json$/.test( filename ) ) {
                const filepath = path.join( this.directory, filename );
                const filejson = files.read( filepath, true );

                this.broadcast( "labyrinth-leaderboards", {
                    leaders: filejson,
                    channel: filename.replace( /\.json$/, "" )
                });

                if ( leads.length ) {
                    runner( leads.shift() );
                }

            } else {
                if ( leads.length ) {
                    runner( leads.shift() );
                }
            }
        };

        runner( leads.shift() );
    }



    broadcast ( event, data ) {
        this.connection.send(JSON.stringify({
            event,
            data
        }));
    }
}



module.exports = Leaderboards;
