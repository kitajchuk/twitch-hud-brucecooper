twitch-labyrinth
================

> A theme based labyrinth navigated by your Twitch Chat!



## Setup for your Twitch channel

In order to use the Twitch Labyrinth with your channel you simply need to get a [tmi.js](https://docs.tmijs.org) Oauth token:

<a href="http://twitchapps.com/tmi/" target="_blank">Click here to get a token</a>

Once you have your Oauth token you can use the Labyrinth in an OBS browser source with the following URL format:

`http://labyrinth.kitajchuk.com?channel=yourchannel&token=youroauthtoken&theme=pokemon`

The available themes are `pokemon` and `zelda`. Your chat users will build up their individual Pokedex's as they complete labyrinth's on your stream. Yes, even Link has gotta catch em all in this whacky game!

The web app renders within a static 1920x1080 canvas so it is optimized for streaming.



## Commanding the labyrinth player

The Twitch Labyrinth parses simple directional commands from your chat. You can use `!left`, `!right`, `!up` and `!down` to move the player through the labyrinth. Each command will move the player one tile in the direction of the command. To move more than one tile at a time you can use a numerator with your direction in either of the following formats, and for any direction: `!left5` or `!left 5`.



## Global Leaderboards

The homepage for the Twitch Labyrinth shows a breakdown of players per channel. You can see the number of labyrinth's the player has completed along with the status of their Pokedex.

<a href="http://labyrinth.kitajchuk.com" target="_blank">http://labyrinth.kitajchuk.com</a>
