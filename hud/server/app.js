// Load system
const path = require( "path" );
const http = require( "http" );

// Load registry
const lager = require( "properjs-lager" );
const request = require( "request-promise" );
const express = require( "express" );
const WebSocketServer = require( "websocket" ).server;
const WebSocketClient = require( "websocket" ).client;
const crypto = require( "crypto" );

// Load lib
const twitch = require( "./twitch/index" );
const alerts = require( "./alerts" );
const config = require( "./config" );

// This {app}
const app = {};



// {app} Config
app.commands = require( "./commands/index" );
app.twitch = twitch;
app.lager = lager;
app.config = config;
app.alerts = alerts;
app.connections = [];
app.init = () => {
    // Initialize commands
    app.commands.forEach(( command ) => {
        command.init( app );
    });

    // Initialize alerts
    alerts.init( app );

    // Initialize server
    app.server.listen( config.hud.port );
};
app.getCommand = ( comm ) => {
    return app.commands.find(( command ) => {
        return (command.name === comm);
    });
};
app.runCommand = ( comm, message ) => {
    return new Promise(( resolve, reject ) => {
        app.commands.forEach(( command ) => {
            const match = message.match( command.regex );

            if ( match && command.name === comm ) {
                resolve({
                    match
                });
            }
        });
    });
};
app.broadcast = ( event, data ) => {
    if ( app.connections.length ) {
        app.connections.forEach(( connection ) => {
            connection.send(JSON.stringify({
                event,
                data
            }));
        });
    }
};



// {app} Express app
app.express = express();
app.express.set( "views", path.join( __dirname, "../views" ) );
app.express.set( "view engine", "ejs" );
app.express.use( express.static( path.join( __dirname, "../public" ) ) );



// {app} Express routes
app.express.get( "/", ( req, res, next ) => {
    if ( req.query.channel && req.query.token && req.query.theme ) {
        app.config.auth.userName = req.query.channel;
        app.config.auth.userChannel = `#${req.query.channel}`;
        app.config.auth.userToken = req.query.token;
        app.config.auth.theme = req.query.theme;
        next();

    } else {
        res.render( "index" );
    }

}, ( req, res ) => {
    res.render( "labyrinth", {
        theme: app.config.auth.theme
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
    lager.cache( `[socketserver] requested ${request.origin}` );

    if ( request.origin === config.hud.local || request.origin === config.hud.live ) {
        request.accept( "echo-protocol", request.origin );

        twitch.tmi.init( app );
    }
});
app.websocketserver.on( "connect", ( connection ) => {
    lager.cache( `[socketserver] connected` );

    app.connections.push( connection );

    app.broadcast( "labyrinth-render", {} );
    app.broadcast( "labyrinth-alert", {
        alertHtml: alerts.labyrinthRender( config.items[ app.config.auth.theme ] )
    });

    connection.on( "message", ( message ) => {
        // { event, data }
        const utf8Data = JSON.parse( message.utf8Data );

        if ( utf8Data.event === "labyrinth-moved" ) {
            app.getCommand( "labyrinth" ).update( utf8Data.data );

        } if ( utf8Data.event === "labyrinth-winner" ) {
            app.getCommand( "labyrinth" ).winner( utf8Data.data );
            app.broadcast( "labyrinth-alert", {
                alertHtml: alerts.labyrinthWinner( utf8Data.data.userstate, config.items[ app.config.auth.theme ] )
            });
        }
    });
});
app.websocketserver.on( "close", ( connection ) => {
    lager.cache( `[socketserver] closed` );

    app.connections.splice( app.connections.indexOf( connection ), 1 );

    lager.info( `app.connections.length: ${app.connections.length}` );
});



// {app} Export
module.exports = app;
