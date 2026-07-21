export const R2_MUSIC_BASE_URL = 'https://pub-e285d3c995214371936d1f94dd10ed90.r2.dev';

const DEFAULT_ALBUM = 'Syntarion Soundtrack';
const DEFAULT_ARTIST = 'Syntarion Orchestra';
const DEFAULT_ARTWORK = '/music/syntarion-soundtrack-cover.png';
const MANIFEST_CANDIDATES = ['music-manifest.json', 'tracks.json', 'manifest.json'];

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

export function normalizeTrack(track) {
  const tags = normalizeTags(track.tags);
  return {
    ...track,
    tags,
    title: inferTitle(track),
    artist: inferArtist(track),
    album: track.album || track.suite || DEFAULT_ALBUM,
    artwork: track.artwork || track.artwork_url || track.cover_url || track.album_art_url || DEFAULT_ARTWORK,
    menu: track.menu ?? (tags.includes('menu') || tags.length === 0),
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
  return MENU_MUSIC_TRACKS;
}

function extractTracks(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.tracks)) return payload.tracks;
  if (Array.isArray(payload?.menu)) return payload.menu;
  if (Array.isArray(payload?.music)) return payload.music;
  return [];
}

export async function loadMenuMusicTracks() {
  for (const manifestName of MANIFEST_CANDIDATES) {
    try {
      const response = await fetch(`${R2_MUSIC_BASE_URL}/${manifestName}`, { cache: 'no-store' });
      if (!response.ok) continue;
      const payload = await response.json();
      const rows = extractTracks(payload).map(normalizeTrack).filter(track => track.menu);
      if (rows.length) return rows;
    } catch (err) {
      console.warn(`Could not load R2 music manifest ${manifestName}:`, err);
    }
  }

  return MENU_MUSIC_TRACKS;
}
