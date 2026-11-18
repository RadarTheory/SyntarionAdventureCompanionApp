// How far a character sees, for auto-revealing fog when the DM approves a move (VTTCanvas.jsx, approveMoves).
// Radii are shares of the map's width, the same units as fog zones.
//   - Base: about a room around them, by their own dim light.
//   - In light: standing in a light's reach (the map's painted lights or the DM's) widens sight to that light's reach.
//   - Daylight on an open scene: much wider, scaled by how bright the sky is.
//   - Darkvision: the peoples listed below keep a wider radius even with no light.
// The map doesn't know its walls, so sight reaches through them; the DM's Undo and Hide brush correct that.
import { SCENES, DEFAULT_SCENE, LIGHT_KINDS, daylightOf, findMapLights } from './ambience';

export const BASE_SIGHT = 0.06;

// Peoples who see in the dark, as race ids (and optional variants). Edit freely: this is a starting set for the DM to
// correct to Soteria's lore. A variant list limits it to those variants, e.g. only the Dark Tel'ari.
export const DARKVISION = [
  { race: 'durinak' },
  { race: 'othrod' },
  { race: 'goblin' },
  { race: 'telari', variants: ['Dark', 'Morvyn'] },
];
const DARKVISION_SIGHT = BASE_SIGHT * 1.8;

const key = s => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
export function hasDarkvision(token) {
  const race = key(token?.race), variant = key(token?.rv || token?.raceVariant || token?.race_variant);
  return DARKVISION.some(d => key(d.race) === race && (!d.variants || d.variants.some(v => key(v) === variant)));
}

// The sight radius for a token standing at pos ({ x, y } from 0 to 1).
export function sightAt(token, pos, { ambience, mapImg, clock } = {}) {
  let r = hasDarkvision(token) ? DARKVISION_SIGHT : BASE_SIGHT;

  // Daylight under an open sky.
  const scene = SCENES[ambience?.scene] || SCENES[DEFAULT_SCENE];
  const day = daylightOf(clock, ambience?.timeMode || 'clock').level;
  if (scene.night > 0.2) r = Math.max(r, BASE_SIGHT * (1 + 2 * day));

  // Light they stand in.
  const lights = [...(ambience?.foundLights === false ? [] : findMapLights(mapImg)), ...(Array.isArray(ambience?.lights) ? ambience.lights : [])];
  for (const l of lights) {
    const k = LIGHT_KINDS[l.kind] || LIGHT_KINDS.torch;
    const reach = k.radius * (Number(l.size) || 1);
    if (Math.hypot(l.x - pos.x, l.y - pos.y) < reach * 1.2) r = Math.max(r, reach * 1.7);
  }
  return Math.min(0.3, r);
}

// Reveal zones along a path (the token's start, then each waypoint), spaced so the trail has no gaps.
export function revealAlong(token, path, opts) {
  const zones = [];
  const add = (x, y) => zones.push({ id: Math.random().toString(36).slice(2, 9), type: 'reveal', x, y, r: sightAt(token, { x, y }, opts), feather: 0.45, auto: true });
  if (!path.length) return zones;
  add(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y), step = BASE_SIGHT * 0.6;
    const n = Math.max(1, Math.ceil(len / step));
    for (let s = 1; s <= n; s++) add(a.x + ((b.x - a.x) * s) / n, a.y + ((b.y - a.y) * s) / n);
  }
  return zones;
}
