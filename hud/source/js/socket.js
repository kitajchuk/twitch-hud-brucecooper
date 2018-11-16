// import $ from "properjs-hobo";
import maze from "./lib/maze";



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
            if ( response.event === "maze" ) {
                maze.render();

            } else if ( response.event === "mazerunner" ) {
                maze.push( response.data );
            }
        };
        this.websocket.onopen = () => {
            this.app.maze = maze.init();
        };
        this.websocket.onclose = () => {};
    }
};



export default socket;
