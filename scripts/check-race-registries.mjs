// Checks that every race in RACES is wired into every registry that keys off race id.
//
// Race data lives in five places that nothing else forces to agree:
//   constants.js   RACES · RACIAL_TRAITS · NAMES
//   CastorPanel    RACE_ABILITIES
//   Undercrypts    RACE_ATTACKS
//   public/RaceIcons/<id>.png
//
// Run: node scripts/check-race-registries.mjs
// Exits 1 if any race is missing from any registry, so it can gate a commit or CI.

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');

const { RACES, RACIAL_TRAITS, NAMES } = await import(
  pathToFileURL(path.join(root, 'src/constants.js')).href
);

// RACE_ATTACKS is the first object literal in Undercrypts, ending where PA_TRAITS begins.
const undercrypts = read('src/Undercrypts.jsx');
const attacks = new Set(
  [...undercrypts
    .slice(undercrypts.indexOf('const RACE_ATTACKS'), undercrypts.indexOf('const PA_TRAITS'))
    .matchAll(/^ {2}([a-z0-9_]+):/gm)].map(m => m[1])
);

// Pa'morph is split into pamorph_major / pamorph_minor in Castor, so map it back.
const castor = read('src/CastorPanel.jsx');
const abilities = new Set(
  [...castor.matchAll(/^ {2}([a-z0-9_]+): \[/gm)].map(m => m[1])
);
const hasAbilities = id => {
  const keys = id === 'pamorph' ? ['pamorph_major', 'pamorph_minor'] : [id];
  // Present but empty counts as a gap — an empty array renders no abilities at all.
  return keys.some(k => abilities.has(k) && !new RegExp(`^ {2}${k}: \\[\\s*\\],`, 'm').test(castor));
};

const icons = new Set(
  fs.readdirSync(path.join(root, 'public/RaceIcons')).map(f => f.replace(/\.png$/, ''))
);

const CHECKS = [
  ['TRAITS', r => Boolean(RACIAL_TRAITS[r.id])],
  ['NAMES',  r => Boolean(NAMES[r.ns || r.id])],
  ['ATTACK', r => attacks.has(r.id)],
  ['CASTOR', r => hasAbilities(r.id)],
  ['ICON',   r => icons.has(r.id)],
];

const pad = (s, n) => String(s).padEnd(n);
const gaps = {};

console.log(pad('RACE', 12) + CHECKS.map(([name]) => pad(name, 8)).join(''));
console.log('-'.repeat(12 + CHECKS.length * 8));

for (const race of RACES) {
  const results = CHECKS.map(([name, test]) => {
    const ok = test(race);
    if (!ok) (gaps[name] ??= []).push(race.id);
    return ok;
  });
  console.log(pad(race.id, 12) + results.map(ok => pad(ok ? 'ok' : 'MISS', 8)).join(''));
}

const orphans = [...icons].filter(i => !RACES.some(r => r.id === i));
if (orphans.length) console.log(`\nIcons with no RACES entry (NPC-only?): ${orphans.join(', ')}`);

const found = Object.entries(gaps);
if (!found.length) {
  console.log(`\nAll ${RACES.length} races wired into all ${CHECKS.length} registries.`);
  process.exit(0);
}

console.log('\nGAPS:');
for (const [name, ids] of found) console.log(`  ${name}: ${ids.join(', ')}`);
process.exit(1);
