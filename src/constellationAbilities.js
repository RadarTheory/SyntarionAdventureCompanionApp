// Shared by the Abilities panel and Castor: reads what a character has learned in the Constellation (data.abilities)
// through the constellation's own data module, and maps each ability to its sheet trait pool.
import { COLORS } from './constants';
import supabase from './lib/supabase';

// Sheet rows: trait key → discipline label, trait label and colour. Rows that existed before keep their colour.
export const DISCIPLINE_META = {
  sanctus: { label: 'Divine',      trait: 'Sanctus', color: '#e8d9a7',    axis: 'magic' },
  sacral:  { label: 'Spirit',      trait: 'Sacral',  color: COLORS.magic, axis: 'magic' },
  mana:    { label: 'Magic',       trait: 'Mana',    color: '#a78bfa',    axis: 'magic' },
  chi:     { label: 'Nature',      trait: 'Chi',     color: '#86efac',    axis: 'magic' },
  gnosis:  { label: 'Glyph',       trait: 'Gnosis',  color: '#fbbf24',    axis: 'magic' },
  shaeid:  { label: 'Light',       trait: 'Shaeid',  color: '#fef9c3',    axis: 'magic' },
  wraill:  { label: 'Shadow',      trait: 'Wraill',  color: '#a8a29e',    axis: 'magic' },
  phorym:  { label: 'Imagination', trait: 'Phorym',  color: '#f0abfc',    axis: 'magic' },
  lithium: { label: 'Fortitude',   trait: 'Lithium', color: '#94a3b8',    axis: 'tech'  },
  steam:   { label: 'Grit',        trait: 'Steam',   color: '#fb923c',    axis: 'tech'  },
  crhon:   { label: 'Volition',    trait: 'Crhon',   color: '#fda4af',    axis: 'tech'  },
  cell:    { label: 'Reason',      trait: 'Cell',    color: '#c084fc',    axis: 'tech'  },
  zinc:    { label: 'Focus',       trait: 'Zinc',    color: '#38bdf8',    axis: 'tech'  },
  null:    { label: 'Ingenuity',   trait: 'Null',    color: '#e2e8f0',    axis: 'tech'  },
  volt:    { label: 'Matter',      trait: 'Volt',    color: '#4ade80',    axis: 'tech'  },
  ion:     { label: 'Gain',        trait: 'Ion',     color: COLORS.tech,  axis: 'tech'  },
};

// Trait pools (user, 2026-11-16). A trait's pool holds one point for every star (class level) the character has awakened in
// classes that draw on that trait, so it grows as they buy. Uses spend from it, and a long rest refills every pool.
// Only what has been spent is stored, in data.traitSpent ({ trait key: points spent }); the pool is its size minus that.
export function poolMaxes(d, learned) {
  const held = new Set((Array.isArray(learned) ? learned : []).filter(id => typeof id === 'string' && !id.includes('|')));
  const maxes = {};
  if (!held.size) return maxes;
  for (const cls of d.classes) {
    const t = d.traitFor(cls);
    if (!t) continue;
    const stars = d.classLevelNodes(cls).filter(n => held.has(n.id)).length;
    if (stars) { const key = t.trait.toLowerCase(); maxes[key] = (maxes[key] || 0) + stars; }
  }
  return maxes;
}
export const spentOf = (char, key) => Math.max(0, Number(char?.traitSpent?.[key]) || 0);
export const poolOf = (char, key, max) => Math.max(0, (Number(max) || 0) - spentOf(char, key));

const blobOf = data => (typeof data === 'string' ? JSON.parse(data || '{}') : (data || {}));

// Spends `amount` from a trait pool (a negative amount gives it back). Reads the row fresh so other edits are kept.
// Returns the character's new data blob.
export async function spendTrait(charId, key, amount) {
  const { data: row, error } = await supabase.from('characters').select('data').eq('id', charId).maybeSingle();
  if (error) throw error;
  if (!row) throw new Error('Character not found.');
  const data = blobOf(row.data);
  const spent = Math.max(0, (Number(data.traitSpent?.[key]) || 0) + amount);
  const next = { ...data, traitSpent: { ...(data.traitSpent || {}), [key]: spent } };
  const { error: saveError } = await supabase.from('characters').update({ data: next }).eq('id', charId);
  if (saveError) throw saveError;
  return next;
}

// A long rest refills every trait pool of every character in the campaign. Returns how many characters were refilled.
export async function refillTraitPools(campaignId) {
  const { data: rows, error } = await supabase.from('characters').select('id, data').eq('campaign_id', String(campaignId));
  if (error) throw error;
  let refilled = 0;
  for (const row of rows || []) {
    const data = blobOf(row.data);
    if (!Object.values(data.traitSpent || {}).some(v => Number(v) > 0)) continue;
    const { error: saveError } = await supabase.from('characters').update({ data: { ...data, traitSpent: {} } }).eq('id', row.id);
    if (!saveError) refilled++;
  }
  return refilled;
}

// The class's aspect sets the roll stat. Affect rolls Essence (the sheet's earlier rule); Hope rolls Dream (user, 2026-11-16).
const ASPECT_STAT = { Soul: 'soul', Spirit: 'spirit', Mind: 'mind', Body: 'body', Will: 'will', Whim: 'whim', Dream: 'dream', Affect: 'essence', Hope: 'dream' };

// Placeholder: what one use costs from the trait's pool is not decided yet, so every use costs 1.
export const USE_COST = 1;

let constellationData = null;
export function loadConstellation() {
  constellationData ??= import(/* @vite-ignore */ new URL('/constellation/data.js', window.location.origin).href);
  return constellationData;
}

// One entry per learned ability, at the highest level the character holds.
export function learnedEntries(d, learned) {
  const maxes = poolMaxes(d, learned);
  const held = new Set((Array.isArray(learned) ? learned : []).filter(id => typeof id === 'string' && !id.includes('|')));
  const out = [];
  for (const cls of d.classes) {
    if (![...held].some(id => id.startsWith(`${cls.id}:`))) continue;
    const t = d.traitFor(cls);
    if (!t) continue;
    const key = t.trait.toLowerCase(), meta = DISCIPLINE_META[key];
    for (const e of d.abilityEntries(cls, 'abilities')) {
      const owned = e.nodes.filter(n => held.has(n.id));
      if (!owned.length) continue;
      const top = owned.at(-1);
      out.push({
        id: e.key, name: e.name, className: cls.name,
        type: top.levelName, level: owned.length, levels: e.nodes.length,
        discipline: key, disciplineLabel: meta?.label || t.discipline,
        cost: USE_COST, currencyKey: key, currencyLabel: t.trait, poolMax: maxes[key] || 0,
        statKey: ASPECT_STAT[cls.attribute] || null,
        effect: top.description || e.description || '',
        axis: t.column === 'Magic' ? 'magic' : 'tech',
      });
    }
  }
  return out;
}

// One line per learned ability, for prompts (Scribe). Empty string when nothing is learned or the data can't load.
export async function learnedAbilitiesText(char) {
  try {
    const entries = learnedEntries(await loadConstellation(), char?.abilities);
    return entries
      .map(e => `- ${e.name} (${e.className}, level ${e.level} of ${e.levels}, ${e.type} · ${e.disciplineLabel}): ${e.effect}`)
      .join('\n');
  } catch {
    return '';
  }
}

// The class chosen at creation (char.cid) is the build's first star. Creation ids that differ from their calling's id:
const CALLING_OF_CLASS = { magister: 'oneir' };
export const startingCallingOf = char => (char?.cid ? (CALLING_OF_CLASS[char.cid] || char.cid) : null);

// That calling's first level, or null when the class is not one of the open callings.
export function startingNodeId(d, char) {
  const cls = d.classById(startingCallingOf(char));
  return cls && !cls.rootId && !cls.secret && !cls.hidden ? d.levelId(cls.id, 0) : null;
}

// What opening that star costs on a fresh build: its first level plus the first-purchase point.
export const startingCost = (d, nodeId) => d.nodeCost(d.classLevelNodes(d.classById(nodeId.split(':')[0]))[0], []);

// Every class the character has awakened (any level bought), with the highest level held and whether it is their declared class.
// A star can be open with no abilities bought yet, so this is what shows a character's stars before learnedEntries has any.
export function awakenedStars(d, char) {
  const held = new Set((Array.isArray(char?.abilities) ? char.abilities : []).filter(id => typeof id === 'string' && !id.includes('|')));
  const start = startingNodeId(d, char);
  const stars = [];
  for (const cls of d.classes) {
    const levels = d.classLevelNodes(cls);
    const owned = levels.filter(n => held.has(n.id));
    const owns = owned.length || [...held].some(id => id.startsWith(`${cls.id}:`));
    if (!owns) continue;
    const t = d.traitFor(cls);
    const meta = t && DISCIPLINE_META[t.trait.toLowerCase()];
    const top = owned.at(-1);
    stars.push({
      id: cls.id, name: cls.name, isStart: !!start && start.startsWith(`${cls.id}:`),
      levelName: top?.levelName || '', level: owned.length, levels: levels.length,
      abilities: d.abilityEntries(cls, 'abilities').filter(e => e.nodes.some(n => held.has(n.id))).length,
      color: meta?.color || null,
    });
  }
  return stars;
}
