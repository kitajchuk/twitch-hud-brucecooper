// import $ from "properjs-hobo";
import labyrinth from "./lib/labyrinth";



const socket = {
    init ( app ) {
        this.app = app;
        this.websocket = new window.WebSocket( `ws://${window.location.host}`, "echo-protocol" );
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
            }
        };
        this.websocket.onopen = () => {
            this.app.labyrinth = labyrinth.init();
        };
        this.websocket.onclose = () => {};
    }
};



export default socket;
