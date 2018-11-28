import $ from "properjs-hobo";



const leaderboards = {
    init () {
        this.element = $( ".js-leaderboards" );
        this.leaders = this.element.find( ".js-leaderboards-tables" );

        return this;
    },

    push ( data ) {
        if ( data.leaders.length ) {
            this.leaders.append( this.render( data ) );
        }
    },

    render ( data ) {
        return `
            <div class="leaderboards__tables__board">
                <div class="leaderboards__tables__row">
                    <a href="https://twitch.tv/${data.channel}" target="_blank"><h1>Labyrinth leaders for <span class="teal">${data.channel}</span> channel.</h1></a>
                </div>
                <div class="leaderboards__tables__row">
                    <div class="leaderboards__tables__cel">
                        <p>Username</p>
                    </div>
                    <div class="leaderboards__tables__cel">
                        <p>Labyrinths</p>
                    </div>
                    <div class="leaderboards__tables__cel">
                        <p>Pokedex</p>
                    </div>
                </div>
                ${data.leaders.map(( leader ) => {
                    return `
                        <div class="leaderboards__tables__row">
                            <div class="leaderboards__tables__cel">
                                <a href="https://twitch.tv/${leader.userstate.username}" class="teal" target="_blank"><p>${leader.userstate.username}</p></a>
                            </div>
                            <div class="leaderboards__tables__cel">
                                <p>${leader.labyrinths}</p>
                            </div>
                            <div class="leaderboards__tables__cel">
                                ${leader.pokedex.map(( pokemon ) => {
                                    return `
                                        <a href="https://www.pokemon.com${pokemon.detailPageURL}" target="_blank" title="${pokemon.name}">
                                            <img src="${pokemon.ThumbnailImage}" width="48" />
                                        </a>
                                    `;

                                }).join( "" )}
                            </div>
                        </div>
                    `;

                }).join( "" )}
            </div>
        `;
    }
};



export default leaderboards;
