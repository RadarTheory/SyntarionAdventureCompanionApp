// parse-bestiary.mjs
// One-time migration script. Run from project root:
//   node parse-bestiary.mjs
// Outputs bestiary-parsed.json (review this) and bestiary-insert.sql (run in Supabase SQL editor).

import { SOTERIA_BESTIARY } from './soteria-bestiary.js';
import fs from 'fs';

const DIVIDER = /^━+$/;
const DISPOSITION = /^(DOCILE\s*\/\s*FRIENDLY|AGGRESSIVE\s*\/\s*PREDATORY|SMALLER\s*\/\s*GAME|HAUNTED UNDEAD)\s*:?$/i;
// Matches "- NAME — desc" or "- NAME - desc" or "- NAME: desc"
const BULLET = /^-\s+([A-ZÐÖ][A-Z0-9ÐÖ'’\/\.\(\)\s\-]{1,70}?)\s*(?:[—–]|:)\s*(.*)$/;
// Matches a biome/section header line that follows a divider, e.g. "1. WOODLAND" or "TROLLS"
const SECTION_HEADER = /^(\d+\.\s*)?[A-Z][A-Z0-9 \/&'’\-]{2,60}$/;

function inferCategory(name, desc) {
  const c = (name + ' ' + desc).toLowerCase();
  if (/undead|wraith|lich|skeleton|ghost|revenant|risen|draugr|hollow\b/.test(c)) return 'Undead';
  if (/golem/.test(c)) return 'Construct';
  if (/dragon|wyrm|drake|wyvern/.test(c)) return 'Dragon';
  if (/troll/.test(c)) return 'Troll';
  if (/titan/.test(c)) return 'Titan';
  if (/demon|fiend|devil|infernal|dybuk|void/.test(c)) return 'Fiend';
  if (/elemental|fire|water|earth|air|storm/.test(c)) return 'Elemental';
  if (/fey|pixie|sprite|nymph/.test(c)) return 'Fey';
  if (/goblin|orc|ogre|troll|humanoid|khell|duergar/.test(c)) return 'Humanoid';
  if (/aberration|tentacle|void/.test(c)) return 'Aberration';
  return 'Beast';
}

function parse(raw) {
  const lines = raw.split('\n').map(l => l.trim());
  const creatures = [];
  let currentBiome = null;
  let currentDisposition = null;
  let pendingDivider = false;
  let current = null; // { name, desc, biome, disposition }

  const flush = () => {
    if (current && current.name) {
      creatures.push({
        name: current.name.trim(),
        description: current.descLines.join(' ').replace(/\s+/g, ' ').trim(),
        biome: current.biome,
        disposition: current.disposition,
        category: inferCategory(current.name, current.descLines.join(' ')),
      });
    }
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) continue;

    if (DIVIDER.test(line)) { pendingDivider = true; continue; }

    // Stop entirely once we hit reference-only tail sections (no creatures past this point)
    if (/^(ENCOUNTER CALIBRATION|PREDATOR CASCADE EVENTS|ENCOUNTER TEXTURE)$/i.test(line)) {
      flush();
      break;
    }

    // Section header: a divider-bounded line, all-caps-ish, not a bullet
    if (pendingDivider) {
      // peek: if next non-empty line is also a divider, this is a header block
      if (SECTION_HEADER.test(line) && !line.startsWith('-')) {
        currentBiome = line.replace(/^\d+\.\s*/, '').trim();
        currentDisposition = null; // reset — don't let a stale disposition leak into the new section
        pendingDivider = false;
        continue;
      }
      pendingDivider = false;
    }

    if (DISPOSITION.test(line)) {
      currentDisposition = line.replace(/:$/, '').trim();
      continue;
    }

    if (line.startsWith('NOTE:')) continue; // skip section notes, not creatures
    if (/^Threat Level:|^Resonance:|^Combat behavior:|^Weaknesses:|^Strengths:|^Nature:|^Feeding:|^Conditions/.test(line)) {
      // Continuation detail for a "FULL ENTRY" style block — append to current desc
      if (current) current.descLines.push(line);
      continue;
    }

    const bulletMatch = line.match(BULLET);
    if (bulletMatch) {
      flush();
      current = {
        name: bulletMatch[1].trim(),
        descLines: bulletMatch[2] ? [bulletMatch[2]] : [],
        biome: currentBiome,
        disposition: currentDisposition,
      };
      continue;
    }

    // "NAME — FULL ENTRY:" style header (e.g. "DYBUK — FULL ENTRY:")
    const fullEntryMatch = line.match(/^([A-Z][A-Z\s'’]{1,40})\s*[—–]\s*FULL ENTRY:?$/);
    if (fullEntryMatch) {
      if (current && current.name.toUpperCase() === fullEntryMatch[1].trim()) {
        continue; // expanded detail for the creature we already started — keep appending to it
      }
      // Different name: this is a new creature's expanded writeup. Start fresh,
      // but if a bullet for this name already exists earlier, merge into it instead of duplicating.
      flush();
      current = {
        name: fullEntryMatch[1].trim(),
        descLines: [],
        biome: currentBiome,
        disposition: currentDisposition,
      };
      continue;
    }

    // Otherwise, treat as continuation of current creature's description
    if (current) {
      current.descLines.push(line);
    }
  }
  flush();

  // Dedup by name, keep richest description
  const byName = new Map();
  for (const c of creatures) {
    if (!c.name || c.name.length < 2) continue;
    const existing = byName.get(c.name);
    if (!existing || c.description.length > existing.description.length) {
      byName.set(c.name, c);
    }
  }
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

const parsed = parse(SOTERIA_BESTIARY);
fs.writeFileSync('bestiary-parsed.json', JSON.stringify(parsed, null, 2));
console.log(`Parsed ${parsed.length} creatures.`);
console.log('Review bestiary-parsed.json before generating SQL.');

// Generate SQL insert (run only after reviewing the JSON)
const esc = (s) => (s || '').replace(/'/g, "''");
const sql = [
  `-- Run this AFTER reviewing bestiary-parsed.json`,
  `-- Requires a "beasts" table — see schema in chat`,
  `insert into beasts (name, description, biome, disposition, category, source) values`,
  parsed.map(c =>
    `('${esc(c.name)}', '${esc(c.description)}', ${c.biome ? `'${esc(c.biome)}'` : 'null'}, ${c.disposition ? `'${esc(c.disposition)}'` : 'null'}, '${esc(c.category)}', 'global')`
  ).join(',\n') + ';',
].join('\n');

fs.writeFileSync('bestiary-insert.sql', sql);
console.log('Wrote bestiary-insert.sql');
