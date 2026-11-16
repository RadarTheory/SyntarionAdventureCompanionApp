// Reactions (user, 2026-11-16, after Arcanum's reaction system): every NPC holds a reaction toward each character, 0–100.
// It starts at 50 (Indifferent) and moves with:
//   - Spirit: a commanding presence warms everyone.
//   - Race: kin favour kin; RACE_REGARD holds any further feelings one people has for another.
//   - Lean: Magic NPCs mistrust a Tech-leaning character and the other way round (NPC lean is npcs.alignment: magic | tech | neutral).
//   - Morality: good NPCs favour good characters and recoil from evil ones; evil NPCs the reverse (npcs.morality).
//   - Standing: the character's standing with the NPC's faction, city and region (data.standing, set by the DM).
//   - Reputations: what the character is known for (data.reputations), each shifting chosen groups up or down.
//   - Regard: what has passed between this NPC and this character (data.regard[npcId], set by the DM).
// Players see only the tier word; the DM sees the number and every reason (NPCPanel.jsx).
import supabase from './lib/supabase';

// ── Tiers ──
export const REACTION_TIERS = [
  { min: 90, word: 'Devoted', color: '#e8d9a7' },
  { min: 75, word: 'Warm', color: '#a8c5ae' },
  { min: 60, word: 'Cordial', color: '#8fb89a' },
  { min: 40, word: 'Indifferent', color: '#b3a89c' },
  { min: 25, word: 'Wary', color: '#d8b07a' },
  { min: 10, word: 'Cold', color: '#d98a6a' },
  { min: 0, word: 'Hostile', color: '#CD5C5C' },
];
export const tierOf = score => REACTION_TIERS.find(t => score >= t.min) || REACTION_TIERS.at(-1);

// ── Factions: one list, shared with the NPC census (NPCPanel.jsx) so an NPC's faction and a character's standing match ──
export const FACTIONS = ['The Gryndal','The Synod','The Kira Deu','The Yarositan Empire','Cult of Thorns','The Ebonshroud Hand','The Conclave of Mages','The Circle of Eight','The Orphaned','Banat Al-Layl','The Luminary','The Thieves Underground','Managerie Council','Brunar Separatists','Legion of Elddim','Sovereign Kingdom Directorate','The Orinscess Triage','Mörkhofn','La Marée d\'Or','Caelyn - Wardens of the Caelvern','Draeth - Harbingers of the Caelvern','Iridesce - Starstriders','Whyth - Bearers of the Whythryn Cogmail','Arcani - FaeKnights','Aerephet - Wraithborne Incubi','The Wayward','House Sillmeer','Council of Asherah','Ba_elnariani','Nyumbani','Hadarai','Iloists - Heartkeepers','The Devoted - Way of Devotion','Ylandari','Cult of Dra_agora','Dunerryian','Firretharh','Brogoshk','Sýrethens','The Gilded Syndicate','The Zor_gol','Khoneul Shadow Paragon','Xaloran Creed','Kildrak - Way of the Stone','Claven of Hreidmar','Fortune\'s Children','The Wheel of Mýr','The Auric Order','Týrethanists','Rifters - Worshippers of the Maelstrom','The Malochean','The Haruspex','The Yal Arcana','The Acends','Wardens','Desolaran','Nameahn Pluralists','Unmarked'];

// ── Places (from the user's Drive: UPDATED Official Reference / points of interest) ──
const REGIONS = [
  ['Sylvan Grove', ['Gamdon', 'Hauf', "Drak'ar", "Quynthe'ra", 'Rookvale', 'Maernethim Village']],
  ['The Moors', ['Elddim', 'Serenea', 'Falhzer', 'Giffton', 'Deadbrook', "Yüyak'e"]],
  ['The Lowlands', ["Razor's Point", 'Karak Byrn', 'Hadmont', 'Lowland Hearth', 'Ebba', 'The Veiled Knolls', 'Caerlŷf']],
  ['Corren Range', ['Lycharrow', 'Corren Mountain Mines', 'Aldermore', 'Ashendell']],
  ['Brivihan Plains', ['Wealdstone', 'Riyadh', 'Lumina', 'Embrelyn', 'New Harsten', 'Elmoire', 'Heidborough']],
  ['Chronolithe Wastes', ['Hlondeth']],
  ['Falorn Fjords', ['Frostpeak']],
  ['Valorhold', ['Valorhold']],
  ['Aerithos', ['The Great Foundry', 'Mistcliff', "Falchon's Ache", 'Araka', 'Zephyria', 'Coatl']],
  ["Verdelie're", ['Whimwood', 'Sanctum']],
  ['Red-Lock Bay', ['Jack Red-Lock Bay', 'Velhurr']],
  ['Zhallakan', ['Ormr', 'Dar al-Fakhama', "Kra'ark", 'Jumlat']],
  ['Dorhaven', ['Penthosanctum', 'Hulnom']],
  ['Paravel', ['Eneowa', 'Aranghthal', 'Sarazana']],
  ['Beranthes', ['Avalora']],
  ['Makeda Kwetu', ['Djekoto', 'Maravi', "Gly'wnfron", 'Caldor', 'Nnebe', 'Priokos']],
  ["Kul'kal Rakhar", ['Eymont', 'Paios']],
  ['Dunalach', ["Merchant's Inlet", 'Port Haldane', 'Stormwatch']],
  ["Lilith'iel", ['Phlegeth', "N'quythalas", 'Eldrathar', 'Eldorath', 'Valestone', 'Vlareth', 'Treahnoa', 'Revelry Hemlock']],
];
const CLANS = ['Grimrock Clan', 'Graniteheart Clan', 'YewHammer Clan', "Gul'danhrhock Clan", "Gra'adok Clan", 'Dragonmaw Clan', "Ra'Kesh Clan", 'Jötunbane Clan', 'Örlögsylfir Clan'];

export const slug = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const STANDING_KINDS = [
  { id: 'faction', label: 'Faction' }, { id: 'region', label: 'Region' }, { id: 'city', label: 'City' },
  { id: 'clan', label: 'Clan' }, { id: 'realm', label: 'Realm' },
];
export const STANDING_SOURCES = [
  { id: 'realm:soteria', kind: 'realm', name: 'Soteria at large' },
  ...FACTIONS.map(name => ({ id: `faction:${slug(name)}`, kind: 'faction', name })),
  ...REGIONS.map(([name]) => ({ id: `region:${slug(name)}`, kind: 'region', name })),
  ...REGIONS.flatMap(([region, cities]) => cities.map(name => ({ id: `city:${slug(name)}`, kind: 'city', name, region }))),
  ...CLANS.map(name => ({ id: `clan:${slug(name)}`, kind: 'clan', name })),
];
const SOURCE_BY_ID = new Map(STANDING_SOURCES.map(s => [s.id, s]));
export const standingSource = id => SOURCE_BY_ID.get(id) || { id, kind: 'realm', name: String(id || '').replace(/^\w+:/, '') || 'Unknown' };
export const regionOfCity = cityName => REGIONS.find(([, cities]) => cities.some(c => slug(c) === slug(cityName)))?.[0] || null;

// A character's standings, best first. A character from before standings reads data.renown as standing with Soteria at large.
export function standingsOf(char) {
  let list = Array.isArray(char?.standing) ? char.standing.filter(s => s?.id) : [];
  if (!list.length && Number(char?.renown)) list = [{ id: 'realm:soteria', score: Number(char.renown) }];
  return list.map(s => ({ id: s.id, score: Math.max(-100, Math.min(100, Math.round(Number(s.score) || 0))), source: standingSource(s.id) }))
    .sort((a, b) => b.score - a.score || a.source.name.localeCompare(b.source.name));
}
// Renown: how widely known the character is. Their best standing plus a quarter of their other positive standings.
export function renownOf(standings) {
  const scores = standings.map(s => s.score).filter(s => s > 0).sort((a, b) => b - a);
  return scores.length ? scores[0] + Math.floor(scores.slice(1).reduce((a, b) => a + b, 0) / 4) : 0;
}

// ── Reputations: what a character is known for. Each effect shifts one group's reaction. ──
// Effect targets: { type: 'all' } · { type: 'faction'|'region'|'city'|'race', value: name } · { type: 'lean', value: 'magic'|'tech' }
// · { type: 'morality', value: 'good'|'evil'|'neutral' }.
export const EFFECT_TYPES = [
  { id: 'all', label: 'Everyone' }, { id: 'faction', label: 'Faction' }, { id: 'region', label: 'Region' }, { id: 'city', label: 'City' },
  { id: 'race', label: 'Race' }, { id: 'lean', label: 'Magic | Tech NPCs' }, { id: 'morality', label: 'Good | Evil NPCs' },
];
// A starting set, in Syntarion's terms; the DM writes more in the character editor (they are kept in the reputations table).
export const STARTER_REPUTATIONS = [
  { id: 'starter:errant-of-the-crown', name: 'Errant of the Crown', description: 'Rides in the Sovereign Kingdom\'s name, as its errant knights do.',
    effects: [{ type: 'faction', value: 'Sovereign Kingdom Directorate', amount: 15 }, { type: 'faction', value: 'Legion of Elddim', amount: 10 }, { type: 'faction', value: 'Brunar Separatists', amount: -15 }, { type: 'faction', value: 'The Thieves Underground', amount: -5 }] },
  { id: 'starter:synod-sanctioned', name: 'Synod-Sanctioned', description: 'Their Magicka carries the Synod\'s seal; the law trusts it, the separatists do not.',
    effects: [{ type: 'faction', value: 'The Synod', amount: 15 }, { type: 'faction', value: 'The Gryndal', amount: -20 }, { type: 'faction', value: 'The Conclave of Mages', amount: 5 }] },
  { id: 'starter:unsanctioned-weave', name: 'Unsanctioned Weave', description: 'Known to work Magicka outside the Synod\'s law.',
    effects: [{ type: 'faction', value: 'The Synod', amount: -25 }, { type: 'faction', value: 'The Gryndal', amount: 15 }, { type: 'lean', value: 'tech', amount: -5 }] },
  { id: 'starter:cogsworn', name: 'Cogsworn', description: 'A champion of Ingenium; the workshops speak well of them.',
    effects: [{ type: 'lean', value: 'tech', amount: 10 }, { type: 'lean', value: 'magic', amount: -5 }, { type: 'faction', value: 'Whyth - Bearers of the Whythryn Cogmail', amount: 10 }] },
  { id: 'starter:veilwalker', name: 'Veilwalker', description: 'Touched by what lies beyond the known; Magicka and Ingenium both look twice.',
    effects: [{ type: 'lean', value: 'magic', amount: 5 }, { type: 'lean', value: 'tech', amount: 5 }, { type: 'morality', value: 'good', amount: -5 }] },
  { id: 'starter:thornbound', name: 'Thornbound', description: 'Marked by the Cult of Thorns, by choice or by brand.',
    effects: [{ type: 'faction', value: 'Cult of Thorns', amount: 20 }, { type: 'morality', value: 'good', amount: -15 }, { type: 'all', amount: -5 }] },
  { id: 'starter:oathbreaker', name: 'Oathbreaker', description: 'Gave their word and broke it, and the story travelled.',
    effects: [{ type: 'all', amount: -10 }, { type: 'morality', value: 'good', amount: -10 }, { type: 'faction', value: 'The Thieves Underground', amount: 5 }] },
  { id: 'starter:wardens-friend', name: 'Friend of the Wardens', description: 'Stood with the Wardens of the Caelvern.',
    effects: [{ type: 'faction', value: 'Caelyn - Wardens of the Caelvern', amount: 15 }, { type: 'faction', value: 'Wardens', amount: 10 }, { type: 'faction', value: 'Draeth - Harbingers of the Caelvern', amount: -10 }] },
  { id: 'starter:gilded-hand', name: 'Gilded Hand', description: 'Their coin opens doors; the Syndicate keeps a ledger in their name.',
    effects: [{ type: 'faction', value: 'The Gilded Syndicate', amount: 15 }, { type: 'faction', value: 'The Auric Order', amount: 10 }, { type: 'morality', value: 'good', amount: -5 }] },
  { id: 'starter:hero-of-the-common', name: 'Hero of the Common Folk', description: 'Remembered in taverns for a kindness done without reward.',
    effects: [{ type: 'all', amount: 8 }, { type: 'morality', value: 'good', amount: 7 }, { type: 'morality', value: 'evil', amount: -5 }] },
];

let reputationCache = null;
// Every reputation: the starter set plus the DM's (reputations table). Falls back to the starter set if the table is missing.
export async function loadReputations(force = false) {
  if (reputationCache && !force) return reputationCache;
  let rows = [];
  try {
    const { data, error } = await supabase.from('reputations').select('id,name,description,effects').order('name');
    if (!error && Array.isArray(data)) rows = data.map(r => ({ ...r, effects: Array.isArray(r.effects) ? r.effects : [] }));
  } catch { /* table not created yet */ }
  reputationCache = [...STARTER_REPUTATIONS, ...rows];
  return reputationCache;
}
export async function saveReputation(rep) {
  const row = { id: rep.id || `rep_${crypto.randomUUID()}`, name: rep.name.trim(), description: rep.description || '', effects: rep.effects || [] };
  const { error } = await supabase.from('reputations').upsert(row);
  if (error) throw error;
  await loadReputations(true);
  return row;
}

export const effectLabel = e => {
  const who = e.type === 'all' ? 'everyone' : e.type === 'lean' ? `${e.value === 'magic' ? 'Magic' : 'Tech'} NPCs` : e.type === 'morality' ? `${e.value} NPCs` : String(e.value || '');
  return `${e.amount > 0 ? '+' : ''}${e.amount} ${who}`;
};

// ── The reaction ──
// Further feelings one people has for another, e.g. { durinak: { telari: -5 } }. Kin always count +5.
export const RACE_REGARD = {};
const raceKey = r => slug(r).replace(/-/g, '');
const clamp4 = v => Math.max(-4, Math.min(4, Number(v) || 0));
export function characterMorality(char) {
  const shift = typeof char?.morality === 'number' ? char.morality : (/^-?\d+(\.\d+)?$/.test(String(char?.morality ?? '').trim()) ? Number(char.morality) : 0);
  return clamp4((Number(char?.sliders?.morality) || 0) + shift);
}

// char: the character (data blob merged with id). npc: an npcs row. cityName: the NPC's city name. reputations: loadReputations().
export function reactionOf(char, npc, { cityName = null, reputations = STARTER_REPUTATIONS } = {}) {
  const parts = [];
  const add = (label, amount) => { const a = Math.round(amount); if (a) parts.push({ label, amount: a }); };

  add('Spirit', ((Number(char?.stats?.spirit) || 8) - 8) * 2);

  const cr = raceKey(char?.race), nr = raceKey(npc?.race);
  if (cr && nr) {
    if (cr === nr) add('Kin', 5);
    const feeling = RACE_REGARD[nr]?.[cr];
    if (feeling) add(`${npc.race} toward ${char.race}`, feeling);
  }

  const lean = String(npc?.alignment || 'neutral').toLowerCase(), mt = clamp4(char?.sliders?.magicTech);
  if (lean === 'magic' && mt) add(mt < 0 ? 'Shares their Magic' : 'Mistrusts their Tech', mt < 0 ? -mt * 2 : -mt * 4);
  if (lean === 'tech' && mt) add(mt > 0 ? 'Shares their Tech' : 'Mistrusts their Magic', mt > 0 ? mt * 2 : mt * 4);

  const npcMoral = String(npc?.morality || 'neutral').toLowerCase(), moral = characterMorality(char);
  if (npcMoral === 'good' && moral) add(moral > 0 ? 'Admires their goodness' : 'Recoils from their cruelty', moral * 3);
  if (npcMoral === 'evil' && moral) add(moral < 0 ? 'Kindred darkness' : 'Scorns their virtue', -moral * 3);

  const standings = standingsOf(char), standing = id => standings.find(s => s.id === id)?.score || 0;
  const region = cityName ? regionOfCity(cityName) : null;
  if (npc?.faction) add(`Standing with ${npc.faction}`, Math.max(-25, Math.min(25, standing(`faction:${slug(npc.faction)}`) / 2)));
  if (cityName) add(`Standing in ${cityName}`, standing(`city:${slug(cityName)}`) / 4);
  if (region) add(`Standing in ${region}`, standing(`region:${slug(region)}`) / 4);
  add('Renown in Soteria', standing('realm:soteria') / 10);

  const held = new Set(Array.isArray(char?.reputations) ? char.reputations : []);
  for (const rep of reputations.filter(r => held.has(r.id))) {
    let total = 0;
    for (const e of rep.effects || []) {
      const v = slug(e.value);
      const hits = e.type === 'all'
        || (e.type === 'faction' && v && v === slug(npc?.faction))
        || (e.type === 'city' && v && v === slug(cityName))
        || (e.type === 'region' && v && v === slug(region))
        || (e.type === 'race' && v && raceKey(e.value) === nr)
        || (e.type === 'lean' && v === lean)
        || (e.type === 'morality' && v === npcMoral);
      if (hits) total += Number(e.amount) || 0;
    }
    add(rep.name, total);
  }

  add('What has passed between them', Number(char?.regard?.[npc?.id]) || 0);

  const score = Math.max(0, Math.min(100, 50 + parts.reduce((a, p) => a + p.amount, 0)));
  return { score, tier: tierOf(score), parts };
}
