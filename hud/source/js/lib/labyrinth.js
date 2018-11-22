import $ from "properjs-hobo";
import Controller from "properjs-controller";
import socket from "../socket";



const labyrinth = {
    init () {
        this.hud = $( ".js-hud" );
        this.data = this.hud.data();
        this.canvas = this.hud.find( ".js-hud-labyrinth" );
        this.context = this.canvas[ 0 ].getContext( "2d" );
        this.cellauto = window.CellAuto;
        this.controller = new Controller();
        this.hero = {
            x: 0,
            y: 0,
            value: 1,
            spawn: false,
            sprite: this.hud.find( ".js-hud-hero" )
        };
        this.chest = {
            x: 0,
            y: 0,
            value: 1,
            spawn: false,
            sprite: this.hud.find( ".js-hud-chest" )
        };
        this.isMoving = false;
        this.tiles = new Image();
        this.tiles.src = `/themes/${this.data.theme}/tiles.png`;

        return this;
    },

    push ( data ) {
        if ( !this.isMoving ) {
            this.isMoving = true;
            this.move( data );
        }
    },

    move ( data ) {
        const increment = (data.direction === "left" || data.direction === "up" ? -1 : 1);
        const points = [];
        let i = 0;

        while ( i < data.distance ) {
            i++;

            const x = (data.direction === "left" || data.direction === "right" ? (this.hero.x + (increment * i)) : this.hero.x);
            const y = (data.direction === "up" || data.direction === "down" ? (this.hero.y + (increment * i)) : this.hero.y);
            const cell = this.world.grid[ y ][ x ];

            // Point is in bounds and not alive
            if ( cell && !cell.alive ) {
                points.push({
                    x,
                    y,
                    chest: (x === this.chest.x && y === this.chest.y)
                });

            // Break the loop at first instance of collision
            } else {
                break;
            }
        }

        if ( points.length ) {
            this.tick( data, points );

        } else {
            this.isMoving = false;
        }
    },

    tick ( data, points ) {
        const _walk = ( point ) => {
            const newCell = this.world.grid[ point.y ][ point.x ];
            const oldCell = this.world.grid[ this.hero.y ][ this.hero.x ];

            // redraw old block
            this.drawTile( this.hero.x, this.hero.y, oldCell.getValue() );
            // redraw new block
            this.drawTile( point.x, point.y, newCell.getValue() );
            // update hero
            this.hero.x = point.x;
            this.hero.y = point.y;
            this.hero.sprite[ 0 ].style.webkitTransform = `translate3d( ${this.world.cellSize * this.hero.x}px, ${this.world.cellSize * this.hero.y}px, 0 )`;

            setTimeout(() => {
                // chest collision
                if ( point.chest ) {
                    this.hud.addClass( "dim" );
                    this.hero.sprite.removeClass( "walk left right up down" ).addClass( "down" );
                    this.render();
                    socket.emit( "labyrinth-winner", data );

                // no more points
                } else if ( !points.length ) {
                    this.hero.sprite.removeClass( "walk" );
                    this.isMoving = false;
                    socket.emit( "labyrinth-moved", data );

                // walk it out
                } else {
                    _walk( points.shift() );
                }

            }, 240 );
        };

        this.hero.sprite.removeClass( "left right up down" ).addClass( `walk ${data.direction}` );

        _walk( points.shift() );
    },

    spawn ( thing ) {
        while ( !this[ thing ].spawn ) {
            const x = Math.floor( Math.random() * (this.world.width - 1) );
            const y = Math.floor( Math.random() * (this.world.height - 1) );
            const cell = this.world.grid[ y ][ x ];

            if ( !cell.alive && !this[ thing ].spawn ) {
                this[ thing ].spawn = true;
                this[ thing ].x = x;
                this[ thing ].y = y;

                this.drawTile( this[ thing ].x, this[ thing ].y, this[ thing ].value );
                this[ thing ].sprite[ 0 ].style.webkitTransform = `translate3d( ${this.world.cellSize * this[ thing ].x}px, ${this.world.cellSize * this[ thing ].y}px, 0 )`;
            }
        }
    },

    /*
    this.context.drawImage(
        img/cvs,
        mask-x,
        mask-y,
        mask-width,
        mask-height,
        x-position,
        y-position,
        width,
        height
    )
    */
    drawTile ( x, y, value ) {
        this.context.clearRect(
            x * this.world.cellSize,
            y * this.world.cellSize,
            this.world.cellSize,
            this.world.cellSize
        );
        this.context.drawImage(
            this.tiles,
            this.world.cellSize * value,
            0,
            this.world.cellSize,
            this.world.cellSize,
            (x * this.world.cellSize),
            (y * this.world.cellSize),
            this.world.cellSize,
            this.world.cellSize
        );
    },

    registerCellType ( type, value ) {
        this.world.registerCellType( type, {
            getValue: function () {
                return this.alive ? 0 : value;
            },
            process: function ( neighbors ) {
                const surrounding = this.countSurroundingCellsWithValue( neighbors, "wasAlive" );

                if ( this.simulated < 20 ) {
                    this.alive = surrounding === 1 || surrounding === 2 && this.alive;
                }

                if ( this.simulated > 20 && surrounding === 2 ) {
                    this.alive = true;
                }

                this.simulated += 1;
            },
            reset: function () {
                this.wasAlive = this.alive;
            }

        }, function () {
            this.alive = Math.random() > 0.5;
            this.simulated = 0;
        });
    },

    render () {
        this.hero.spawn = false;
        this.chest.spawn = false;
        this.isMoving = false;
        this.world = new this.cellauto.World({
            width: 60,
            height: 32,
            cellSize: 32
        });

        this.registerCellType( "ground", 1 );
        this.registerCellType( "flower", 2 );
        this.registerCellType( "bush", 3 );

        this.world.initialize([
            {
                name: "ground",
                distribution: 96
            },
            {
                name: "flower",
                distribution: 2
            },
            {
                name: "bush",
                distribution: 2
            }
        ]);

        this.bytes = null;
        this.controller.go(() => {
            const bytes = [];

            this.world.step();

            for ( let y = 0; y < this.world.height; y++ ) {
                for ( let x = 0; x < this.world.width; x++ ) {
                    const cell = this.world.grid[ y ][ x ];
                    const value = cell.getValue();

                    this.drawTile( x, y, value );

                    bytes.push( value );
                }
            }

            if ( this.bytes ) {
                // When the old bytes matches the new bytes the labyrinth is done
                if ( this.bytes.join( "" ) === bytes.join( "" ) ) {
                    this.bytes = null;
                    this.controller.stop();
                    this.spawn( "chest" );
                    this.spawn( "hero" );
                    this.hud.removeClass( "dim" );
                }
            }

            this.bytes = bytes;
        });
    }
};



export default labyrinth;
