const fs = require('fs');
const path = require('path');

// Mirrors generate-music-manifest.cjs's output shape, but walks the local
// sorted SFX folder tree (see Organize-SFX.ps1) instead of parsing a SQL seed.
const DEFAULT_SRC = 'C:\\Users\\Radar Theory\\Downloads\\SYNTARION\\Assets\\SoundLibrary\\SFX';
const srcRoot = process.argv[2] || DEFAULT_SRC;

const AUDIO_EXT_RE = /\.(mp3|wav|ogg|m4a|flac)$/i;

// Many filenames redundantly repeat their own category ("CombatSwordSlash" in
// Combat, "UIQuestAccept" in UI) which reads fine alone but is repetitive once
// you're already looking at that category's tab. Strip it before humanizing.
const PREFIX_STRIP_CANDIDATES = {
  UI: ['UI'],
  DMSoundboard: ['UIDMSoundBoard', 'UIDMBoard', 'DMSoundBoard', 'DMBoard', 'UI'],
  Combat: ['Combat'],
  Magic: ['Magic'],
  Environment: ['Environment'],
  Ambience: ['Ambience'],
  Steampunk: ['Steampunk'],
  Horror: ['Horror'],
};

function stripCategoryPrefix(base, category) {
  const candidates = (PREFIX_STRIP_CANDIDATES[category] || [category]).slice().sort((a, b) => b.length - a.length);
  for (const prefix of candidates) {
    if (base.length > prefix.length && base.toLowerCase().startsWith(prefix.toLowerCase())) {
      return base.slice(prefix.length);
    }
  }
  return base;
}

function humanize(base) {
  return base
    .replace(AUDIO_EXT_RE, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const categories = fs.readdirSync(srcRoot, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort();

const tracks = [];

for (const category of categories) {
  const categoryDir = path.join(srcRoot, category);
  const files = fs.readdirSync(categoryDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && AUDIO_EXT_RE.test(entry.name))
    .map(entry => entry.name)
    .sort();

  for (const filename of files) {
    const base = filename.replace(AUDIO_EXT_RE, '');
    const stripped = stripCategoryPrefix(base, category);
    const title = humanize(stripped) || humanize(base);
    tracks.push({
      key: `${slugify(category)}-${slugify(title)}`,
      title,
      category,
      filename,
      path: `SFX/${category}/${filename}`,
    });
  }
}

const manifest = {
  version: 1,
  source: 'R2 SFX bucket',
  generatedAt: new Date().toISOString(),
  tracks,
};

fs.writeFileSync('public/sfx-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote public/sfx-manifest.json with ${tracks.length} sounds across ${categories.length} categories.`);
