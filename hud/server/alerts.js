"use strict";



module.exports = {
    name: "alerts",

    init ( app ) {
        this.app = app;
        app.lager.server( `[${this.name}] utility initialized` );
    },

    labyrinthRender ( item ) {
        return `
            <h1 class="teal">Objective</h1>
            <p>The first player to reach the <span class="teal">${item}</span> wins!</p>
        `;
    },

    labyrinthCommand ( userstate, direction, distance ) {
        return `
            <p><span class="teal">${userstate.username}</span> moves <span class="teal">${direction}</span> <span class="teal">${distance}</span>.</p>
        `;
    },

    labyrinthWinner ( userstate, item ) {
        return `
            <h1 class="teal">Excellent</h1>
            <p><span class="teal">${userstate.username}</span> got to the <span class="teal">${item}</span> first!</p>
        `;
    },

    labyrinthPokedex ( userstate, pokemon ) {
        return `
            <h1 class="teal">Excellent</h1>
            <p><span class="teal">${userstate.username}</span>, a wild <span class="teal">${pokemon}</span> was added to your Pokedex!</p>
        `;
    }
};
