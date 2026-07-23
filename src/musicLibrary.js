export const R2_MUSIC_BASE_URL = 'https://pub-e285d3c995214371936d1f94dd10ed90.r2.dev';

const DEFAULT_ALBUM = 'Syntarion Soundtrack';
const DEFAULT_ARTIST = 'Syntarion Orchestra';
const DEFAULT_ARTWORK = '/music/syntarion-soundtrack-cover.png';
const MANIFEST_URLS = [
  '/music-manifest.json',
  R2_MUSIC_BASE_URL + '/music-manifest.json',
  R2_MUSIC_BASE_URL + '/tracks.json',
  R2_MUSIC_BASE_URL + '/manifest.json',
];

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map(tag => String(tag).toLowerCase());
  if (typeof tags === 'string') {
    return tags
      .replace(/[{}]/g, '')
      .split(',')
      .map(tag => tag.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function inferTitle(track) {
  if (track.title || track.name) return track.title || track.name;
  const filename = track.filename || track.path || track.file_path || '';
  return filename.replace(/\.(wav|mp3|ogg|flac|m4a)$/i, '') || 'Untitled Track';
}

function inferArtist(track) {
  if (track.artist) return track.artist;
  const filename = track.filename || track.path || track.file_path || '';
  const split = filename.split(' - ');
  return split.length > 1 ? split[0].trim() : DEFAULT_ARTIST;
}

function hasMenuMarker(track, tags = normalizeTags(track.tags)) {
  const text = [track.title, track.name, track.variant, track.filename, track.path, track.file_path]
    .filter(Boolean)
    .join(' ');
  return tags.includes('menu') || /\bmenu\b/i.test(text);
}

function cleanFamilyText(value) {
  return String(value || '')
    .replace(/\.(wav|mp3|ogg|flac|m4a)$/i, '')
    .replace(/^Syntarion Orchestra\s+-\s+/i, '')
    .replace(/\s+-\s+/g, ' ')
    .replace(/\((?:[^)]*\bmenu\b[^)]*|main theme|alternate theme|secondary theme|cinematic mix|orchestral mix|orchestra mix(?:e)? one|orchestra mix(?:e)? two|piano ballad(?: one| two)?|string mix(?: one| two)?|tribal mix|tribal alternate mix|violin mix|combat mix(?: one| two)?|victory theme|heroic mix two|arcane mix(?: one| two)?|nature theme(?: one| two| three| four)?|nursery ballad|shanty mix|desert mix|bagpipe mix(?: one| two)?|eryatav mix(?: one| two)?|zhallakan mix|jiro'ki mix|hoshiari mix|durinak mix(?: two)?|vald mix)\)/ig, '')
    .replace(/\b(?:menu|main|alternate|secondary|theme|mix|one|two|version|choir|ballad)\b/ig, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .trim()
    .toLowerCase();
}

export function normalizeTrack(track) {
  const tags = normalizeTags(track.tags);
  return {
    ...track,
    tags,
    title: inferTitle(track),
    artist: inferArtist(track),
    album: track.album || track.suite || DEFAULT_ALBUM,
    artwork: track.artwork || track.artwork_url || track.cover_url || track.album_art_url || DEFAULT_ARTWORK,
    menu: Boolean(track.menu) || hasMenuMarker(track, tags),
  };
}

export const MENU_MUSIC_TRACKS = [
  {
    filename: 'Syntarion Orchestra - Soteria Rises - Secondary Theme.wav',
    title: 'Soteria Rises - Secondary Theme',
    suite: 'Soteria Rises',
    tags: ['menu', 'proof'],
    energy: 3,
  },
].map(normalizeTrack);

export function getTrackKey(track) {
  return track?.id || track?.url || track?.audio_url || track?.public_url || track?.r2_path || track?.path || track?.filename || track?.file_path || track?.title || '';
}

export function getTrackUrl(track) {
  if (track.audio_url) return track.audio_url;
  if (track.public_url) return track.public_url;
  if (track.url) return track.url;
  const filePath = track.r2_path || track.storage_path || track.path || track.filename || track.file_path || '';
  return `${R2_MUSIC_BASE_URL}/${String(filePath).split('/').map(encodeURIComponent).join('/')}`;
}

export function getMenuMusicTracks() {
  return prioritizeTracks(MENU_MUSIC_TRACKS);
}

export function getTrackFamilyKey(track) {
  const suiteKey = cleanFamilyText(track?.suite || '');
  if (suiteKey) return suiteKey;
  const albumKey = cleanFamilyText(track?.album || '');
  if (albumKey && albumKey !== cleanFamilyText(DEFAULT_ALBUM)) return albumKey;
  return cleanFamilyText(track?.title || track?.name || track?.filename || getTrackKey(track)) || getTrackKey(track);
}

function shuffleTracks(rows) {
  const shuffled = [...rows];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function buildMenuMusicQueue(tracks, options = {}) {
  const playable = [...tracks].filter(Boolean);
  const groups = new Map();

  playable.forEach(track => {
    const familyKey = getTrackFamilyKey(track);
    if (!groups.has(familyKey)) groups.set(familyKey, []);
    groups.get(familyKey).push(track);
  });

  const families = Array.from(groups.entries()).map(([familyKey, familyTracks]) => ({
    familyKey,
    tracks: shuffleTracks(familyTracks),
    offset: Math.floor(Math.random() * Math.max(1, familyTracks.length)),
  }));

  const passes = Math.max(1, options.passes || Math.max(4, Math.ceil(playable.length / Math.max(1, families.length)) + 2));
  const queue = [];
  let previousFamily = options.avoidFirstFamily || '';

  for (let pass = 0; pass < passes; pass += 1) {
    const passFamilies = shuffleTracks(families).sort((a, b) => {
      if (a.familyKey === previousFamily) return 1;
      if (b.familyKey === previousFamily) return -1;
      return 0;
    });

    passFamilies.forEach(family => {
      const familyTracks = family.tracks;
      const selected = familyTracks[(family.offset + pass) % familyTracks.length];
      queue.push(selected);
      previousFamily = family.familyKey;
    });
  }

  return queue;
}

function extractTracks(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tracks)) return payload.tracks;
  if (Array.isArray(payload?.menu)) return payload.menu;
  if (Array.isArray(payload?.music)) return payload.music;
  return [];
}

function prioritizeTracks(tracks) {
  return [...tracks].sort((a, b) => {
    const aProof = /Soteria Rises - Secondary Theme/i.test(a.filename || a.title || '') ? 0 : 1;
    const bProof = /Soteria Rises - Secondary Theme/i.test(b.filename || b.title || '') ? 0 : 1;
    return aProof - bProof;
  });
}
export async function loadMusicTracks({ menuOnly = true } = {}) {
  for (const manifestUrl of MANIFEST_URLS) {
    try {
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) continue;
      const payload = await response.json();
      const allRows = extractTracks(payload).map(normalizeTrack);
      const rows = menuOnly ? allRows.filter(track => track.menu) : allRows;
      if (rows.length) return prioritizeTracks(rows);
    } catch (err) {
      console.warn(`Could not load music manifest ${manifestUrl}:`, err);
    }
  }

  return prioritizeTracks(MENU_MUSIC_TRACKS);
}

export function loadMenuMusicTracks() {
  return loadMusicTracks({ menuOnly: true });
}
