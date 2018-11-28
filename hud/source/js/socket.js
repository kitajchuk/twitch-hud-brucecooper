import paramalama from "paramalama";
import labyrinth from "./lib/labyrinth";
import alert from "./lib/alert";
import leaderboards from "./lib/leaderboards";



const socket = {
    init ( app ) {
        this.app = app;
        this.websocket = new window.WebSocket( `ws://${window.location.host}`, "echo-protocol" );
        this.params = paramalama( window.location.search );
        this.bind();

        return this;
    },

    emit ( event, data ) {
        this.websocket.send(JSON.stringify({
            event,
            data
        }));
    },

    bind () {
        this.websocket.onmessage = ( message ) => {
            const response = JSON.parse( message.data );

            // HUD::events
            if ( response.event === "labyrinth-render" ) {
                labyrinth.render();

            } else if ( response.event === "labyrinth-command" ) {
                labyrinth.push( response.data );

            } else if ( response.event === "labyrinth-alert" ) {
                alert.push( response.data );

            } else if ( response.event === "labyrinth-leaderboards" ) {
                leaderboards.push( response.data );
            }
        };
        this.websocket.onopen = () => {
            if ( this.params.token && this.params.channel && this.params.theme ) {
                this.app.alert = alert.init();
                this.app.labyrinth = labyrinth.init();
                this.emit( "labyrinth-authorize", this.params );

            } else {
                this.app.leaderboards = leaderboards.init();
                this.emit( "labyrinth-leaderboards", {} );
            }
        };
        this.websocket.onclose = () => {};
    }
};



export default socket;
