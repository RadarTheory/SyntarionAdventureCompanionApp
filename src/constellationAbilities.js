// Shared by the Abilities panel and Castor: reads what a character has learned in the Constellation (data.abilities)
// through the constellation's own data module, and maps each ability to its sheet trait pool.
import { COLORS } from './constants';

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

// Pools saved under the panel's earlier keys are still read, so nothing a character held is lost.
const LEGACY_POOL = { chi: 'essence', ion: 'gain', steam: 'grit', zinc: 'focus', volt: 'matter', cell: 'reason', lithium: 'fortitude', null: 'ingenuity' };
export const poolOf = (char, key) => Number(char?.disciplines?.[key] ?? char?.disciplines?.[LEGACY_POOL[key]] ?? 0) || 0;

// The class's aspect sets the roll stat. Affect rolls Essence (the sheet's earlier rule); Hope has no stat yet.
const ASPECT_STAT = { Soul: 'soul', Spirit: 'spirit', Mind: 'mind', Body: 'body', Will: 'will', Whim: 'whim', Dream: 'dream', Affect: 'essence' };

// Placeholder: what one use costs from the trait's pool is not decided yet, so every use costs 1.
export const USE_COST = 1;

let constellationData = null;
export function loadConstellation() {
  constellationData ??= import(/* @vite-ignore */ new URL('/constellation/data.js', window.location.origin).href);
  return constellationData;
}

// One entry per learned ability, at the highest level the character holds.
export function learnedEntries(d, learned) {
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
        cost: USE_COST, currencyKey: key, currencyLabel: t.trait,
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
