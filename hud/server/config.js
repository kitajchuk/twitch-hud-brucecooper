"use strict";



// Use this URL to oauth yourself
// https://twitchapps.com/tmi/
module.exports = {
    auth: {
        userName: "",
        userChannel: "",
        userToken: "",
        theme: ""
    },
    hud: {
        port: 8000,
        local: "http://localhost:8000",
        live: "http://labyrinth.kitajchuk.com",
        secret: "listen"
    },
    items: {
        zelda: "Chest",
        pokemon: "Pokeball"
    }
};
