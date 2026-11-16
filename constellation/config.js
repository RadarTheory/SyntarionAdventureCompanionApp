// Every player starts with 5 ability points; further grants come from Syntarion, the master app.
// DEV_MODE raises the starting pool so deeper paths can be tested. Set it to false for players.
// Inside Syntarion (host mode, host.js) the pool is the character's own AP and replaces both.
export const DEV_MODE=true;
export const PLAYER_STARTING_POINTS=5,DEV_STARTING_POINTS=200;
export let STARTING_POINTS=DEV_MODE?DEV_STARTING_POINTS:PLAYER_STARTING_POINTS;
export function setStartingPoints(points){STARTING_POINTS=Math.max(0,Math.floor(Number(points)||0));}
