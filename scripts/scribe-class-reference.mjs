// Writes src/soteria-classes.js: the Scribe's class reference, built from the constellation's own data (constellation/data.js)
// so it always names the classes, lines, traits and abilities players actually see. soteria-mechanics.js includes it.
// vite.config.js runs this on every dev start, every build and every constellation change; the file is only rewritten when it changes.
// `npm run scribe:classes` runs it by hand.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'src', 'soteria-classes.js');
const RULE = '━'.repeat(55);
const header = title => `${RULE}\n${title}\n${RULE}`;

const ASPECT_STAT = { Soul: 'Soul', Spirit: 'Spirit', Mind: 'Mind', Body: 'Body', Will: 'Will', Whim: 'Whim', Dream: 'Dream', Affect: 'Essence', Hope: 'Dream' };
const TIER = { 1: 'calling', 2: 'subclass', 3: 'subclass', 4: 'master class' };
const clean = text => String(text || '').replace(/`/g, "'").replace(/\$\{/g, '$ {').replace(/\s+/g, ' ').trim();

export async function buildScribeClasses(constellationDir = join(root, 'constellation')) {
  const d = await import(pathToFileURL(join(constellationDir, 'data.js')).href);
  const practice = Object.fromEntries(d.disciplines.map(p => [p.id, p]));
  const out = [];

  out.push(header('THE CONSTELLATION — HOW CLASSES WORK'), '');
  out.push(
    'Classes are learned in the Constellation, the character sheet\'s Abilities tab. Every character starts at The Self and',
    'awakens callings (the 16 base classes) with AP. Multiclassing is allowed: any number of callings may be opened.',
    '',
    'TERMS: a calling is a base class; its subclasses branch from it; each line ends in one master class, which holds the',
    'line\'s item. Abilities are never called a "kit".',
    '',
    'PRACTICES (each has its own verb and five-step level ladder):',
    ...d.disciplines.map(p => `- ${p.name.toUpperCase()} (${p.subtitle}) — ${p.action}: ${p.levels.join(' → ')}`),
    '',
    'BUYING:',
    `- Each class climbs its practice's ladder in order, costing 1–5 AP by step. A class's first purchase costs ${d.FIRST_ABILITY_SURCHARGE} extra AP.`,
    '- Depth caps the ladder: a calling reaches the 2nd step, tier-2 subclasses the 3rd, tier-3 the 4th, master classes the 5th.',
    '- Each ability is bought once per ladder step its class holds, 1 AP each (Mote Condemnation, then Charm Condemnation...).',
    `- MASTERY: ${d.MASTERY} purchases in a class master it. Mastery reveals and opens the next classes on that line;`,
    '  a subclass becomes known when any parent is awakened and opens when any parent is mastered.',
    '- Purchases are instant; there is no Architect approval. The last purchase can be undone for a refund.',
    '- Every purchase moves the Magic | Tech slider 0.25: Magicka toward Magic, Ingenium toward Tech, Nihimence a half step',
    '  toward Tech, Null back toward Neutral.',
    '',
    'HIDDEN LINES:',
    '- PRAETHACY (Warden, Hope): revealed once a character holds 3 learned Magicka nodes and 3 across Ingenium and',
    '  Nihimence combined.',
    '- NULL (Nihimence, Hope): revealed once a character has mastered two different Nihimence classes.',
    '',
    'ASPECTS AND ROLLS: each line has an aspect, which sets the stat its abilities roll with: Soul, Spirit, Mind, Body,',
    'Will, Whim and Dream roll that stat; Affect rolls Essence; Hope rolls Dream.',
    '',
    'TRAIT POOLS: each class draws on one of the sheet\'s 16 traits (its row of the Magic | Tech table). A trait\'s pool holds',
    'one point per star (class level) awakened in classes drawing on it. Each use spends from the pool (1 for now); a denied',
    'cast gives it back, and a long rest refills every pool.',
    '',
    'THE 16 TRAITS (discipline → trait):',
  );
  const traits = new Map();
  for (const cls of d.classes) { const t = d.traitFor(cls); if (t) traits.set(t.trait, t); }
  for (const column of ['Magic', 'Tech']) {
    out.push(`- ${column.toUpperCase()}: ${[...traits.values()].filter(t => t.column === column).map(t => `${t.discipline} → ${t.trait.toUpperCase()}`).join(', ')}`);
  }
  out.push('');

  for (const line of d.roots) {
    const family = d.classes.filter(c => c.id === line.id || c.rootId === line.id).sort((a, b) => (a.tier || 1) - (b.tier || 1));
    const p = practice[line.discipline];
    const hidden = line.hidden ? ', hidden: revealed with Praethacy' : line.secret ? ', hidden: revealed by mastering two Nihimence classes' : '';
    out.push(header(`CLASS LINE — ${line.name.toUpperCase()} (${p?.name || line.discipline} · ${line.attribute}${hidden})`), '');
    const lore = d.CALLING_LORE?.[line.id] || line.summary;
    if (lore) out.push(clean(lore), '');
    out.push(`Aspect ${line.attribute}, rolls ${ASPECT_STAT[line.attribute] || 'none'}. Line: ${family.map(c => c.name).join(', ')}.`, '');
    for (const cls of family) {
      const t = d.traitFor(cls);
      const from = (cls.parentIds || []).map(id => d.classById(id)?.name).filter(Boolean);
      const bits = [TIER[cls.tier || 1] || `tier ${cls.tier}`];
      if (from.length) bits.push(`from ${from.join(' or ')}`);
      if (practice[cls.discipline] && cls.discipline !== line.discipline) bits.push(practice[cls.discipline].name);
      if (t) bits.push(`${t.discipline} / ${t.trait}`);
      bits.push(`levels ${d.ladderOf(cls).join(', ')}`);
      if ((cls.tier || 1) === 4 && cls.item) bits.push(`holds ${cls.item}`);
      out.push(`${cls.name.toUpperCase()} [${bits.join(' · ')}]`);
      for (const e of d.abilityEntries(cls, 'abilities')) out.push(`  ${e.name} — ${clean(e.description)}`);
      out.push('');
    }
  }

  const body = out.join('\n').trimEnd();
  const file = `// Generated by scripts/scribe-class-reference.mjs from constellation/data.js. Do not edit by hand: change the constellation\n// and this file is rebuilt on the next dev start or build (or run \`npm run scribe:classes\`).\nexport const SOTERIA_CLASSES = \`\n${body}\n\`;\n`;
  // Line endings are ignored, so a checkout that converted them to CRLF is not rewritten on every run.
  const changed = !existsSync(OUT) || readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') !== file;
  if (changed) writeFileSync(OUT, file);
  return { changed, classes: d.classes.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { changed, classes } = await buildScribeClasses();
  console.log(`Scribe class reference: ${classes} classes, ${changed ? 'written to' : 'unchanged in'} src/soteria-classes.js`);
}
