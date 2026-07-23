import { R2_MUSIC_BASE_URL } from './musicLibrary';
import { environmentEngine, ambienceEngine } from './audioEngines';
import sfxEngine from './sfxEngine';
import supabase from './lib/supabase';

const MANIFEST_URLS = [
  '/sfx-manifest.json',
  R2_MUSIC_BASE_URL + '/sfx-manifest.json',
];

// Environment and Ambience get their own looping bed engine; everything else
// (Combat, Magic, Steampunk, Horror, UI, DMSoundboard, Creatures, Misc) is a
// one-shot that punches over every other bus.
export const BUS_FOR_CATEGORY = {
  Environment: environmentEngine,
  Ambience: ambienceEngine,
};

const BUS_KEY_FOR_CATEGORY = {
  Environment: 'environment',
  Ambience: 'ambience',
};

export function getBusForCategory(category) {
  return BUS_FOR_CATEGORY[category] || sfxEngine;
}

// String key version of the same mapping, for UI state (a bed bus has one
// "currently playing" track; an SFX one-shot doesn't).
export function getBusKey(category) {
  return BUS_KEY_FOR_CATEGORY[category] || 'sfx';
}

export function getTrackUrl(track) {
  if (track.url) return track.url;
  const filePath = track.path || track.filename || '';
  return `${R2_MUSIC_BASE_URL}/${String(filePath).split('/').map(encodeURIComponent).join('/')}`;
}

export function getTrackKey(track) {
  return track?.key || track?.path || track?.filename || track?.title || '';
}

function extractTracks(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tracks)) return payload.tracks;
  return [];
}

let cachedLibrary = null;

async function loadFromTable() {
  const { data, error } = await supabase
    .from('sfx_library')
    .select('key, title, category, filename, path');

  if (error) {
    console.warn('Could not load sfx_library table (falling back to static manifest):', error.message);
    return [];
  }
  return data || [];
}

async function loadFromManifest() {
  for (const manifestUrl of MANIFEST_URLS) {
    try {
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) continue;
      const payload = await response.json();
      const rows = extractTracks(payload);
      if (rows.length) return rows;
    } catch (err) {
      console.warn(`Could not load sound library manifest ${manifestUrl}:`, err);
    }
  }
  return [];
}

// The Supabase table is the live source of truth (new rows show up with no
// redeploy); the generated JSON manifest is only a fallback if the table is
// empty, unreachable, or hasn't been created yet.
export async function loadSoundLibrary() {
  if (cachedLibrary) return cachedLibrary;

  const tableRows = await loadFromTable();
  if (tableRows.length) {
    cachedLibrary = tableRows;
    return tableRows;
  }

  const manifestRows = await loadFromManifest();
  cachedLibrary = manifestRows;
  return manifestRows;
}

export function getCategories(tracks) {
  return [...new Set(tracks.map(track => track.category).filter(Boolean))];
}

export function getTracksByCategory(tracks, category) {
  return tracks.filter(track => track.category === category);
}

// Single entry point for the soundboard: resolves the URL and routes to the
// correct bus based on category, so callers never need to know the mapping.
export function playTrack(track) {
  const url = getTrackUrl(track);
  const bus = getBusForCategory(track.category);
  return bus.play(url);
}

// Gold isn't a real numeric field anywhere in this app — by convention a
// currency grant is a character_items row with description "Currency|..."
// and the amount stashed in `weight`. Not schema-enforced, so this is a
// heuristic (also matches on the item name containing "gold" as a fallback,
// since some grant paths don't set the Currency| prefix).
const BIG_PAYOUT_THRESHOLD = 500;

// Returns true if it detected currency and played a coin sound, false
// otherwise — so callers can fall back to a generic reveal sound for
// non-currency loot: `if (!playCoinSfx(item)) playSfxByKey('ui-reveal');`
export function playCoinSfx({ name, description, weight } = {}) {
  const isCurrency = (description || '').startsWith('Currency|') || /gold/i.test(name || '');
  if (!isCurrency) return false;
  const amount = Number(weight) || 0;
  playSfxByKey(amount > BIG_PAYOUT_THRESHOLD ? 'ui-coin-payout-big' : 'ui-coin-drop');
  return true;
}

// One-liner for triggering a named catalog sound from anywhere in the app,
// e.g. playSfxByKey('ui-quest-accept'). Safe to fire-and-forget (not awaited).
export async function playSfxByKey(key) {
  const library = await loadSoundLibrary();
  const track = library.find(row => row.key === key);
  if (!track) {
    console.warn(`No SFX found for key "${key}"`);
    return { ok: false };
  }
  return playTrack(track);
}
