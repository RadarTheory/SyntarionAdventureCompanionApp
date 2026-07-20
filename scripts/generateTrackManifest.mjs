// Parses WAV filenames in the soundtrack folder into SQL inserts
// for soundtrack_tracks. Usage:
//   node scripts/generateTrackManifest.mjs > scripts/soundtrack_seed.sql
import { readdirSync } from 'fs';

const FOLDER = 'C:/Users/Radar Theory/Downloads/Soundtrack - Syntarion';

// keyword -> tags + energy
const TAG_RULES = [
  { match: /combat|action/i,            tags: ['combat'],   energy: 5 },
  { match: /battle|heroic|triumph|victory/i, tags: ['victory'], energy: 4 },
  { match: /menu/i,                     tags: ['menu'],     energy: 2 },
  { match: /ballad|piano|nursery/i,     tags: ['ballad'],   energy: 1 },
  { match: /tribal|desert|island|zhallakan/i, tags: ['world'], energy: 3 },
  { match: /tense|dark|shadow/i,        tags: ['tense'],    energy: 4 },
  { match: /orchestral|cinematic|string|violin|choire|choir/i, tags: ['orchestral'], energy: 3 },
  { match: /guitar|shanty|bagpipe|chime|nature/i, tags: ['folk'], energy: 2 },
];

const esc = (s) => s.replace(/'/g, "''");

const rows = readdirSync(FOLDER)
  .filter(f => f.toLowerCase().endsWith('.wav'))
  .map(f => {
    const base = f.replace(/\.wav$/i, '');
    // strip artist prefix, tolerate double spaces
    const noArtist = base.replace(/^Syntarion Orchestra\s*-\s*/i, '').trim();
    // variant = last parenthetical if present
    const parenMatch = noArtist.match(/\(([^)]*)\)\s*$/);
    const variant = parenMatch ? parenMatch[1].trim() : null;
    let suite = parenMatch
      ? noArtist.slice(0, parenMatch.index).trim()
      : noArtist;
    // handle "Suite - Theme" style (e.g. "Disc of Soteria - Theme")
    suite = suite.replace(/\s*-\s*(Main |Secondary )?Theme$/i, '').trim();
    const title = noArtist.replace(/\s{2,}/g, ' ');

    const text = `${suite} ${variant ?? ''}`;
    let tags = new Set();
    let energy = 3;
    for (const rule of TAG_RULES) {
      if (rule.match.test(text)) {
        rule.tags.forEach(t => tags.add(t));
        energy = rule.energy; // last match wins; hand-tune later
      }
    }
    if (tags.size === 0) tags.add('explore');

    const tagArr = `'{${[...tags].join(',')}}'`;
    return `('${esc(f)}', '${esc(title)}', '${esc(suite)}', ${variant ? `'${esc(variant)}'` : 'null'}, ${tagArr}, ${energy})`;
  });

console.log(
`insert into soundtrack_tracks (filename, title, suite, variant, tags, energy) values
${rows.join(',\n')}
on conflict (filename) do update set
  title = excluded.title, suite = excluded.suite,
  variant = excluded.variant, tags = excluded.tags;`
);