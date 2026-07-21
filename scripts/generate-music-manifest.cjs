const fs = require('fs');

const sql = fs.readFileSync('scripts/soundtrack_seed.sql', 'utf16le');
const rowRe = /\('((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*'((?:''|[^'])*)',\s*(null|'((?:''|[^'])*)'),\s*'\{([^}]*)\}',\s*(\d+)\)/g;
const unescapeSql = value => value == null ? null : value.replace(/''/g, "'");
const tracks = [];
const hasMenuMarker = (...parts) => /\bmenu\b/i.test(parts.filter(Boolean).join(' '));

function cleanDisplayText(value) {
  if (!value) return value;
  return value
    .replace(/\s{2,}/g, ' ')
    .replace('If Only Though (Arcane Mix Two', 'If Only Though (Arcane Mix Two)')
    .trim();
}

let match;
while ((match = rowRe.exec(sql))) {
  const filename = unescapeSql(match[1]);
  const title = cleanDisplayText(unescapeSql(match[2]));
  const suite = cleanDisplayText(unescapeSql(match[3]));
  const variant = match[4] === 'null' ? null : cleanDisplayText(unescapeSql(match[5]));
  const tags = match[6].split(',').map(tag => tag.trim()).filter(Boolean);
  const isProofTrack = filename === 'Syntarion Orchestra - Soteria Rises - Secondary Theme.wav';
  const hasMenuName = hasMenuMarker(filename, title, variant);
  const normalizedTags = (isProofTrack || hasMenuName) && !tags.includes('menu') ? [...tags, 'menu'] : tags;

  tracks.push({
    title,
    artist: 'Syntarion Orchestra',
    album: suite,
    suite,
    variant,
    filename,
    artwork: '/music/syntarion-soundtrack-cover.png',
    tags: normalizedTags,
    energy: Number(match[7]),
    menu: isProofTrack || hasMenuName || normalizedTags.includes('menu'),
  });
}

const manifest = {
  version: 1,
  source: 'R2 soundtrack bucket',
  generatedAt: new Date().toISOString(),
  tracks,
};

fs.writeFileSync('public/music-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote public/music-manifest.json with ${tracks.length} tracks (${tracks.filter(t => t.menu).length} menu tracks).`);
