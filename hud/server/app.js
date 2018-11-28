const path = require( "path" );
const http = require( "http" );
const request = require( "request-promise" );
const express = require( "express" );
const config = require( "./config" );
const lager = require( "properjs-lager" );
const WebSocketServer = require( "websocket" ).server;
const WebSocketClient = require( "websocket" ).client;
const Labyrinth = require( "./client/Labyrinth" );
const Leaderboards = require( "./client/Leaderboards" );


// This {app}
const app = {};



// {app} Config
app.config = config;
app.connections = {};
app.init = () => {
    // Initialize server
    app.server.listen( config.hud.port );
};



// {app} Express app
app.express = express();
app.express.set( "views", path.join( __dirname, "../views" ) );
app.express.set( "view engine", "ejs" );
app.express.use( express.static( path.join( __dirname, "../public" ) ) );



// {app} Express routes
app.express.get( "/", ( req, res, next ) => {
    if ( req.query.channel && req.query.token && req.query.theme ) {
        next();

    } else {
        res.render( "index" );
    }

}, ( req, res ) => {
    res.render( "labyrinth", {
        theme: req.query.theme
    });
});



// {app} HTTP server
app.server = http.Server( app.express );



// {app} WebSocketServer
app.websocketserver = new WebSocketServer({
    httpServer: app.server,
    autoAcceptConnections: false
});
app.websocketserver.on( "request", ( request ) => {
    lager.cache( `[socketserver] Requested by ${request.origin}` );

    if ( request.origin === config.hud.local || request.origin === config.hud.live ) {
        request.accept( "echo-protocol", request.origin );

        lager.cache( `[socketserver] Accepted origin ${request.origin}` );
    }
});
app.websocketserver.on( "connect", ( connection ) => {
    lager.cache( `[socketserver] Connected` );

    connection.on( "message", ( message ) => {
        // { event, data }
        const utf8Data = JSON.parse( message.utf8Data );

        // Authorize a client connection
        if ( utf8Data.event === "labyrinth-authorize" ) {
            // Allow authorization for channel IF NOT EXISTS
            if ( !app.connections[ utf8Data.data.channel ] ) {
                connection._channel = utf8Data.data.channel;

                app.connections[ utf8Data.data.channel ] = {
                    clientId: utf8Data.data.clientId,
                    channel: utf8Data.data.channel,
                    token: utf8Data.data.token,
                    theme: utf8Data.data.theme,
                    labyrinth: new Labyrinth( utf8Data.data, connection ),
                    connection,
                };

            // Ignore ALREADY CONNECTED CHANNEL
            } else {
                lager.cache( `[socketserver] Ignoring already active channel #${utf8Data.data.channel}` );
            }

        } else if ( utf8Data.event === "labyrinth-leaderboards" ) {
            new Leaderboards( connection );
        }
    });
});
app.websocketserver.on( "close", ( connection ) => {
    lager.cache( `[socketserver] Closed, deleting connection for #${connection._channel}` );

    delete app.connections[ connection._channel ];
});



// {app} Export
module.exports = app;
