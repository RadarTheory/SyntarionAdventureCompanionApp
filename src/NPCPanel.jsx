import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import supabase from './lib/supabase';
import { logSessionEvent, getCheckedInCharacterIds } from './lib/sessionEvents';
import { ALL_CLASSES } from './constants';
import PortraitUpload from './PortraitUpload';

const RACE_OPTIONS = {
  Addamar: ['Veridoran', 'Brunar', 'Matekwan'],
  "Dúrinak": ['Grimrock', 'Yewhammer', 'Graniteheart'],
  "Tel'ari": ["Wood Tel'ari", "Dark Tel'ari (Drow)", "Sea Tel'ari (Nereid)"],
  Othrod: ["Kul'kal Rakhar", 'Grothmogg', 'Telrok', 'Jotunnar'],
  Terraxian: [],
  Fynlor: [],
  Trink: [],
  "Pa'morph": ['Major', 'Minor', 'Aeon', 'Astral'],
  Fae: [],
  Djinn: ['Efreet (Fire)', 'Marid (Water)', 'Djinni (Air)', 'Dao (Earth)'],
  Helianth: [],
  Seraphan: [],
  Drakazir: ['Gold', 'Red', 'Blue', 'Green', 'Black', 'White'],
  Nazari: [],
};

const SOTERIA_NPC_CONTEXT = `You are The Scribe, an archival intelligence in Soteria (178 Era of Unity). Generate NPC details for a TTRPG. Be specific, in-world, and creative. Soteria has two axes: Magicka (soul/spirit/mind/body/will/whim/affect/dream) and Ingenium (tech/craft). Respond ONLY with valid JSON, no markdown, no explanation.`;

async function callGemini(system, messages, maxTokens = 512) {
  const { data, error } = await supabase.functions.invoke('scribe', { body: { system, messages, max_tokens: maxTokens } });
  if (error) throw new Error(error.message || 'Relay failed.');
  if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error).slice(0, 200));
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Gemini.');
  return text;
}

const CONDITIONS = ['Alive','Dead','Dying','Unconscious','Asleep','Awake','Injured','Wounded','Bleeding','Poisoned','Diseased','Cursed','Blessed','Charmed','Frightened','Confused','Stunned','Paralyzed','Restrained','Grappled','Prone','Hidden','Invisible','Disguised','Blinded','Deafened','Muted','Exhausted','Hungry','Thirsty','Drunk','Drugged','Possessed','Haunted','Enraged','Calm','Hostile','Friendly','Neutral','Suspicious','Afraid','Loyal','Betrayed','Wanted','Imprisoned','Captured','Missing','Traveling','Guarding','Working','Resting','Fleeing','Hiding','Following','Tracking','Hunted','Protected','Marked','Banished','Exiled','Transformed','Polymorphed','Magically Bound','Oathbound','Debt-Bound','Faction-Aligned','Faction-Enemy','Undercover','Unknown'];
const CONDITION_COLORS = {Dead:'#e05a5a',Dying:'#e06060',Unconscious:'#c06060',Injured:'#e08a5a',Wounded:'#e07a5a',Bleeding:'#e05a5a',Poisoned:'#80c060',Diseased:'#a0b040',Exhausted:'#b09060',Hungry:'#c09050',Thirsty:'#c09050',Paralyzed:'#9080c0',Stunned:'#9080c0',Prone:'#808090',Restrained:'#9070a0',Grappled:'#9070a0',Cursed:'#c060c0',Blessed:'#e8c040',Charmed:'#e080c0',Possessed:'#a040e0',Haunted:'#8050c0',Transformed:'#60a0e0',Polymorphed:'#60a0e0','Magically Bound':'#a060e0',Oathbound:'#c0a040','Debt-Bound':'#c08040',Invisible:'#80b0c0',Blinded:'#808090',Deafened:'#808090',Muted:'#808090',Frightened:'#e08060',Confused:'#c0a060',Enraged:'#e04040',Calm:'#60c090',Drunk:'#e0c060',Drugged:'#a0c060',Hostile:'#e05050',Friendly:'#60e090',Neutral:'#909090',Suspicious:'#c0a040',Afraid:'#e09060',Loyal:'#60b0e0',Betrayed:'#e06060',Wanted:'#e08040',Imprisoned:'#c06060',Captured:'#c06060',Missing:'#e0b040',Traveling:'#60c0e0',Guarding:'#6090d0',Working:'#b0a060',Resting:'#70b090',Fleeing:'#e09050',Hiding:'#909070',Following:'#60b0c0',Tracking:'#70a060',Hunted:'#e06050',Protected:'#60d080',Marked:'#e0a040',Banished:'#a06080',Exiled:'#a06080','Faction-Aligned':'#60a0e0','Faction-Enemy':'#e06060',Undercover:'#a0b060',Alive:'#60e060',Awake:'#90d0a0',Disguised:'#b0a070',Hidden:'#909070',Unknown:'#808090'};
const condColor = c => CONDITION_COLORS[c] || '#909090';

const STATUS_OPTIONS = ['Active','Deceased','Missing','Unknown','Imprisoned','Wanted'];
const CATEGORY_OPTIONS = ['Uncategorized','Merchant','Guard','Nobility','Clergy','Criminal','Scholar','Adventurer','Military','Laborer','Vagrant','Nomadic','Working Class','Healer','Performer','Diplomat','Paladin','Augur','Monk','Shaman','Cursewright','Bokor','Inquisitor','Iridesce','Caelyn','Archon','Castor','Magus','Warlock','Wizard','Evoker','Sorcerer','Zealot','Devout','Cleric','Dyreon','Weaver','Druid','Makemark','Wild','Ovate','Fetch','Primalist','Arcani','Runesiph','Scribe','Glyphsage','Codexer','Sage','Cantor','Dryad','Guardian','Wishwright','Fatebinder','Mystic','Rhapsodist','Minstrel','Maleficar','Haruspex','Bard','Eldritch','Hemoclast','Harrow','Darkweaver','Necromancer','Magister','Rogue','Inspector','Detective','Sleuth','Strider','Ranger','Emissary','Negotiator','Tycoon','Baron','Viceroy','Strategist','Cartographer','Scientist','Archivist','Inventor','Tactician','Laureate','Fighter','Barbarian','Swashbuckler','Knight','Marauder','Gallant','Vanguard','Sentine','Null','Stalwart','Warden','Whyth','Artificer','Gunsmith','Gunslinger','Tinkerer','Machinist','Engineer','Poet','Herald','Provocateur','Tribune','Savant','Schematurge','Alchemist','Mutagenist','Bombardier','Biomancer','Saboteur','Philosopher'];
const STATUS_COLORS = {Active:'#60e060',Deceased:'#e06060',Missing:'#e0b040',Unknown:'#8090a0',Imprisoned:'#c060e0',Wanted:'#e08040'};
const sc = s => STATUS_COLORS[s] || '#8090a0';
const CATEGORY_COLORS = {Merchants:'#e8a040',Guards:'#6090d0',Nobility:'#c060c0',Clergy:'#e0e060',Criminals:'#e06060',Scholars:'#40c0c0',Adventurers:'#60e060',Military:'#8090a0',Mystics:'#a060e0',Laborers:'#c0a060',Vagrants:'#908070',Nomadic:'#70b090','Working Class':'#b0a080',Uncategorized:'#504840',Paladins:'#e8c040',Augurs:'#c0a0e0',Monks:'#60c0b0',Shamans:'#70b060',Warlocks:'#9040c0',Wizards:'#6080e0',Evokers:'#e06080',Sorcerers:'#e04060',Druids:'#60b040',Rangers:'#70a060',Rogues:'#a08060',Inquisitors:'#c07040',Bards:'#e0a060',Alchemists:'#80c060',Gunslingers:'#a0a0a0',Artificers:'#80b0c0',Necromancers:'#8040a0',Vanguard:'#6090b0',Diplomats:'#c0c060',Inventors:'#60c0c0',Poets:'#e080a0',Archivists:'#a0c0a0'};
const cc = c => CATEGORY_COLORS[c] || CATEGORY_COLORS.Uncategorized;
function newId() { return `${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }

const LOOT_WEIGHTS = {soul:'Weapons,Accessories,Magic Items',spirit:'Magic Items,Spellcasting Items,Accessories',mind:'Documents,Schematic Materials,Magic Items',body:'Armor,Gear,Consumables',will:'Weapons,Armor,Gear',whim:'Accessories,Consumables,Gear',affect:'Consumables,Magic Items,Accessories',dream:'Artifacts,Reagents,Magic Items',rogue_tree:'Gear,Accessories,Weapons',merchant_tree:'Trade Goods,Currency,Consumables',scholar_tree:'Documents,Schematic Materials,Gear',fighter_tree:'Weapons,Armor,Gear',vanguard_tree:'Armor,Weapons,Gear',artificer_tree:'Schematic Materials,Gear,Weapons',poet_tree:'Accessories,Consumables,Documents',alchemist_tree:'Reagents,Consumables,Artifacts'};

// ── ABILITY NODES — defined first so generate functions can reference it ───────
const ABILITY_NODES = {
  soul:{label:'Soul',axis:'magic',nodes:{iridesce:{label:'Iridesce',abilities:['Oathglow','Soulbrand','Lightward','Haloseal','Divinecast']},caelyn:{label:'Caelyn',abilities:['Spiritweave','Echobind','Soulthread','Veilsense','Wraithlink']},paladin:{label:'Paladin',abilities:['Oathbrand','Sacredstrike','Holyward','Divinemantle','Consecrate']},augur:{label:'Augur',abilities:['Foresight','Omenread','Veilpiercer','Fatemark','Prophecyseal']},monk:{label:'Monk',abilities:['Stillstrike','Voidpalm','Innerflux','Breathform','Soulpulse']},shaman:{label:'Shaman',abilities:['Spiritcall','Ancestorbind','Totemward','Stormspeak','Soulfire']},cursewright:{label:'Cursewright',abilities:['Hexweave','Cursebrand','Blightmark','Hexward','Soulrot']},bokor:{label:'Bokor',abilities:['Hexstitch','Souljar','Zombify','Blightcall','Ritualward']},inquisitor:{label:'Inquisitor',abilities:['Truthbrand','Soulprobe','Confessor','Bindingword','Judgemantle']}}},
  spirit:{label:'Spirit',axis:'magic',nodes:{archon:{label:'Archon',abilities:['Commandwave','Spiritshout','Dominate','Willbreak','Mindmantle']},castor:{label:'Castor',abilities:['Spellweave','Arcanebind','Runecast','Manaveil','Spellshield']},magus:{label:'Magus',abilities:['Arcaneblast','Spellsurge','Runicstrike','Magicwall','Spellsteal']},warlock:{label:'Warlock',abilities:['Darkpact','Soulchain','Voidbolt','Infernalbrand','Cursecall']},wizard:{label:'Wizard',abilities:['Fireball','Frostbolt','Arcanemissile','Shieldwall','Timewarp']},evoker:{label:'Evoker',abilities:['Prismaburst','Fireweave','Frostwave','Lightningchain','Evokeshield']},sorcerer:{label:'Sorcerer',abilities:['Wildcast','Chaossurge','Spellblood','Arcaneform','Ruinblast']},zealot:{label:'Zealot',abilities:['Faithstrike','Holywrath','Burningword','Devotionflare','Sacredfire']}}},
  mind:{label:'Mind',axis:'magic',nodes:{dyreon:{label:'Dyreon',abilities:['Mindspike','Thoughtweave','Psyblast','Memoryburn','Mindlock']},weaver:{label:'Weaver',abilities:['Thoughtthread','Mindweave','Psybind','Neuralveil','Dreamlink']},druid:{label:'Druid',abilities:['Naturecall','Rootbind','Thornwall','Wildgrowth','Earthpulse']},evoker2:{label:'Evoker',abilities:['Arcanestitch','Runethread','Spellknot','Manahook','Glyphbind']},sorcerer2:{label:'Sorcerer',abilities:['Mindblast','Psyshield','Willstrike','Mentalbrand','Soulread']}}},
  body:{label:'Body',axis:'magic',nodes:{makemark:{label:'Makemark',abilities:['Ironflesh','Stonehide','Fortify','Bodyward','Endure']},wild:{label:'Wild',abilities:['Wildstrike','Beastform','Feralcharge','Primalroar','Naturebond']},ovate:{label:'Ovate',abilities:['Natureveil','Wildgrace','Earthbond','Primalsense','Beastspeak']},fetch:{label:'Fetch',abilities:['Spiritfetch','Soulpull','Echostep','Veilwalk','Fetchform']},primalist:{label:'Primalist',abilities:['Primalstrike','Beastbond','Wildrage','Naturecall','Rawpower']}}},
  will:{label:'Will',axis:'magic',nodes:{arcani:{label:'Arcani',abilities:['Willstrike','Mindwall','Soulforce','Willweave','Psychbrand']},runesiph:{label:'Runesiph',abilities:['Runestrike','Glyphbolt','Runewall','Glyphward','Runeseal']},scribe:{label:'Scribe',abilities:['Wordcast','Spellscript','Runemark','Glyphwrite','Inscribe']},glyphsage:{label:'Glyphsage',abilities:['Glyphburst','Runewave','Sigildraw','Inscribeward','Markbrand']},codexer:{label:'Codexer',abilities:['Codeweave','Scriptbind','Lettercast','Wordwall','Glyphseal']},sage:{label:'Sage',abilities:['Wisdomcast','Sageseal','Loreweave','Ancientword','Knowledgebind']}}},
  whim:{label:'Whim',axis:'magic',nodes:{cantor:{label:'Cantor',abilities:['Songweave','Chantbind','Harmonycast','Resonance','Melodystrike']},dryad:{label:'Dryad',abilities:['Naturecharm','Rootdance','Petalveil','Bloomward','Wildgrace']},guardian:{label:'Guardian',abilities:['Guardianstrike','Wardmantle','Shieldwall','Protectbond','Stalwartcast']},wishwright:{label:'Wishwright',abilities:['Wishbind','Luckweave','Fortunecast','Destinymark','Fatethread']},fatebinder:{label:'Fatebinder',abilities:['Fatebind','Destinylock','Threadpull','Wyrdcast','Lucksteal']},mystic:{label:'Mystic',abilities:['Mysticstrike','Veilcast','Spiritpulse','Auraweave','Mysticward']}}},
  affect:{label:'Affect',axis:'magic',nodes:{elderlute:{label:'Elderlute',abilities:['Lute of Sorrow','Lute of Joy','Lute of Battle','Lute of Sleep','Lute of Madness']},rhapsodist:{label:'Rhapsodist',abilities:['Rhapsodywave','Songshatter','Echocast','Harmonystrike','Melodybind']},minstrel:{label:'Minstrel',abilities:['Inspirecast','Battlesong','Lullabyweave','Mockery','Counterchant']},maleficar:{label:'Maleficar',abilities:['Hexsong','Cursechant','Wailcast','Griefweave','Doomchant']},haruspex:{label:'Haruspex',abilities:['Entrailread','Bloodomen','Gorecast','Sacrificeward','Vitalsteal']},bard:{label:'Bard',abilities:['Inspirewave','Battlechant','Mockingstrike','Countermelody','Heroicsong']}}},
  dream:{label:'Dream',axis:'magic',nodes:{eldritch:{label:'Eldritch',abilities:['Voidcast','Darkweave','Eldritch Blast','Horrorform','Tentaclepull']},hemoclast:{label:'Hemoclast',abilities:['Bloodcast','Veinburst','Hemorrhage','Bloodwall','Clotbind']},harrow:{label:'Harrow',abilities:['Harrowcast','Dreadweave','Terrorstrike','Fearmark','Doomwall']},darkweaver:{label:'Darkweaver',abilities:['Darkthread','Shadowweave','Voidstitch','Nightbind','Gloomcast']},necromancer:{label:'Necromancer',abilities:['Raisedead','Bonebolt','Soulharvest','Undeadwall','Lifedrink']},magister:{label:'Magister',abilities:['Magisterstrike','Powerseal','Dominateward','Rulebind','Commandform']}}},
  rogue_tree:{label:'Soul (Tech)',axis:'tech',nodes:{rogue:{label:'Rogue',abilities:['Backstab','Shadowstep','Poisonblade','Smokebomb','Vanish']},inspector:{label:'Inspector',abilities:['Caseread','Clueweave','Suspectmark','Evidencebind','Interrogate']},detective:{label:'Detective',abilities:['Deducecast','Trailmark','Alibibreak','Cluebind','Solveweave']},sleuth:{label:'Sleuth',abilities:['Shadowfollow','Tapecast','Disguiseform','Informantbind','Trackmark']},strider:{label:'Strider',abilities:['Swiftstep','Dashform','Windstride','Leapcast','Fleetfoot']},ranger:{label:'Ranger',abilities:['Arrowcast','Trackmark','Beasttame','Trapset','Wildshot']}}},
  merchant_tree:{label:'Spirit (Tech)',axis:'tech',nodes:{merchant:{label:'Merchant',abilities:['Barter','Appraise','Networkcast','Priceread','Dealweave']},emissary:{label:'Emissary',abilities:['Diplomacast','Treatyweave','Alliancebind','Charmword','Peaceform']},negotiator:{label:'Negotiator',abilities:['Dealstrike','Compromisecast','Leverageweave','Haggleform','Contractbind']},tycoon:{label:'Tycoon',abilities:['Wealthform','Investcast','Monopolyweave','Assetbind','Profitmark']},baron:{label:'Baron',abilities:['Lordform','Commandcast','Territoryweave','Vassalbind','Domainmark']},viceroy:{label:'Viceroy',abilities:['Rulecast','Edictstrike','Governweave','Appointbind','Decreemark']}}},
  scholar_tree:{label:'Mind (Tech)',axis:'tech',nodes:{scholar:{label:'Scholar',abilities:['Studycast','Researchweave','Theorybind','Knowledgestrike','Academmark']},strategist:{label:'Strategist',abilities:['Plancast','Tacticsweave','Deployform','Maneuverbind','Stratmark']},cartographer:{label:'Cartographer',abilities:['Mapcast','Routeweave','Surveyform','Landmarkbind','Chartmark']},scientist:{label:'Scientist',abilities:['Formulacast','Experimentweave','Hypothesisbind','Testform','Theormark']},archivist:{label:'Archivist',abilities:['Recordcast','Catalogweave','Preservebind','Indexform','Archivemark']},inventor:{label:'Inventor',abilities:['Devicecast','Gadgetweave','Machinebind','Constructform','Inventmark']},tactician:{label:'Tactician',abilities:['Ordercast','Flankcall','Pinceweave','Overrunbind','Commandmark']},laureate:{label:'Laureate',abilities:['Orationcast','Inspireweave','Virtuebind','Honorform','Renownmark']}}},
  fighter_tree:{label:'Body (Tech)',axis:'tech',nodes:{fighter:{label:'Fighter',abilities:['Powerstrike','Shieldwall','Battlestance','Heavyblow','Warform']},barbarian:{label:'Barbarian',abilities:['Rage','Frenzystrike','Primalroar','Wildcharge','Savageform']},swashbuckler:{label:'Swashbuckler',abilities:['Recklessstrike','Parrycast','Bladedance','Duelweave','Swiftblade']},knight:{label:'Knight',abilities:['Honorblade','Shieldcharge','Mountedstrike','Chivalryform','Guardcast']},marauder:{label:'Marauder',abilities:['Pillagestrike','Raidform','Loottake','Reavecast','Pillageweave']},gallant:{label:'Gallant',abilities:['Heroicstrike','Dawncast','Nobleshield','Valorform','Bravebind']}}},
  vanguard_tree:{label:'Will (Tech)',axis:'tech',nodes:{vanguard:{label:'Vanguard',abilities:['Frontlinecast','Advanceform','Pushweave','Breakbind','Chargestrike']},sentine:{label:'Sentine',abilities:['Watchcast','Alertform','Guardweave','Vigilbind','Wardstrike']},null:{label:'Null',abilities:['Voidform','Nullcast','Cancelweave','Negate','Dispelbind']},stalwart:{label:'Stalwart',abilities:['Holdform','Steadycast','Unmovweave','Rootbind','Fortifystrike']},warden:{label:'Warden',abilities:['Prisoncast','Containform','Lockweave','Cageform','Detainbind']},whyth:{label:'Whyth',abilities:['Voidcast','Whythform','Nullweave','Blankbind','Emptystrike']},whythryn:{label:'Whythryn',abilities:['Absoluteform','Finalcast','Endweave','Terminbind','Voidstrike']}}},
  artificer_tree:{label:'Whim (Tech)',axis:'tech',nodes:{artificer:{label:'Artificer',abilities:['Constructcast','Deviceform','Gadgetweave','Machinebind','Tinkermark']},gunsmith:{label:'Gunsmith',abilities:['Riflecast','Gunweave','Bulletbind','Shootform','Aimmark']},tinkerer:{label:'Tinkerer',abilities:['Tinkercast','Repairweave','Gearform','Fixbind','Adjustmark']},gunslinger:{label:'Gunslinger',abilities:['Quickdraw','Dualshot','Fanshooting','Bulletstorm','Deadshot']},machinist:{label:'Machinist',abilities:['Enginecast','Gearweave','Steamform','Pistonbind','Mechanmark']},engineer:{label:'Engineer',abilities:['Blueprintcast','Buildweave','Structform','Constructbind','Designmark']}}},
  poet_tree:{label:'Affect (Tech)',axis:'tech',nodes:{poet:{label:'Poet',abilities:['Versestrike','Rhymecast','Odeweave','Prosebind','Wordform']},herald:{label:'Herald',abilities:['Proclaimcast','Announceform','Crierweave','Newsmark','Messagebind']},provocateur:{label:'Provocateur',abilities:['Tauntcast','Instigate','Rileform','Agitweave','Provocbind']},tribune:{label:'Tribune',abilities:['Speechcast','Gatherform','Rallyweave','Crowdbind','Oratemark']},savant:{label:'Savant',abilities:['Brillcast','Geniusform','Insightweave','Masterbind','Sagemark']},schematurge:{label:'Schematurge',abilities:['Schemecast','Plotweave','Conspirebind','Planform','Intriguemark']}}},
  alchemist_tree:{label:'Dream (Tech)',axis:'tech',nodes:{alchemist:{label:'Alchemist',abilities:['Brewcast','Potionweave','Elixirbind','Mixform','Transmutemark']},mutagenist:{label:'Mutagenist',abilities:['Mutatecast','Transformweave','Genebind','Fluxform','Mutmark']},bombardier:{label:'Bombardier',abilities:['Bombcast','Blastweave','Grenadeform','Explosivebind','Boommark']},biomancer:{label:'Biomancer',abilities:['Bioshiftcast','Cellweave','Tissueform','Growthbind','Lifemark']},saboteur:{label:'Saboteur',abilities:['Sabcast','Trapweave','Demolform','Undermineweave','Breakmark']},philosopher:{label:'Philosopher',abilities:['Wisdomcast','Truthweave','Reasonform','Logicbind','Sagesmark']}}}
};

// ── Stat weights ───────────────────────────────────────────────────────────────
const ROLE_STAT_WEIGHTS = {
  magic:   {soul:14,spirit:13,mind:12,body:9, will:10,whim:11,affect:10,dream:11},
  tech:    {soul:9, spirit:10,mind:13,body:12,will:14,whim:13,affect:9, dream:10},
  warrior: {soul:10,spirit:9, mind:9, body:15,will:14,whim:12,affect:9, dream:10},
  rogue:   {soul:10,spirit:11,mind:12,body:11,will:11,whim:15,affect:10,dream:10},
  healer:  {soul:15,spirit:13,mind:11,body:10,will:10,whim:10,affect:12,dream:11},
  bard:    {soul:12,spirit:13,mind:10,body:10,will:10,whim:12,affect:15,dream:10},
  scholar: {soul:10,spirit:11,mind:16,body:8, will:11,whim:10,affect:9, dream:13},
  alchemist:{soul:9,spirit:10,mind:14,body:11,will:10,whim:12,affect:9, dream:13},
  default: {soul:11,spirit:11,mind:11,body:11,will:11,whim:11,affect:10,dream:10},
};

function getRoleWeights(role, alignment) {
  const r = (role||'').toLowerCase();
  const a = (alignment||'neutral').toLowerCase();
  let base;
  if      (r.match(/mage|wizard|warlock|sorcerer|witch|arcanist|spellcaster|evoker|magus/)) base = {...ROLE_STAT_WEIGHTS.magic};
  else if (r.match(/guard|soldier|knight|warrior|fighter|mercenary|barbarian|gallant|marauder/)) base = {...ROLE_STAT_WEIGHTS.warrior};
  else if (r.match(/rogue|thief|assassin|scout|ranger|spy|sleuth|strider|detective/)) base = {...ROLE_STAT_WEIGHTS.rogue};
  else if (r.match(/healer|cleric|priest|shaman|druid|paladin|augur/)) base = {...ROLE_STAT_WEIGHTS.healer};
  else if (r.match(/bard|minstrel|performer|entertainer|cantor|rhapsodist/)) base = {...ROLE_STAT_WEIGHTS.bard};
  else if (r.match(/scholar|scribe|sage|archivist|inventor|engineer|cartographer|tactician/)) base = {...ROLE_STAT_WEIGHTS.scholar};
  else if (r.match(/alchemist|mutagenist|bombardier|biomancer|philosopher/)) base = {...ROLE_STAT_WEIGHTS.alchemist};
  else if (r.match(/merchant|trader|innkeep|vendor|tycoon|baron|viceroy|negotiator|emissary/)) base = {...ROLE_STAT_WEIGHTS.tech};
  else if (r.match(/gunsmith|gunslinger|machinist|engineer|artificer|tinkerer/)) base = {...ROLE_STAT_WEIGHTS.tech};
  else if (r.match(/necromancer|hemoclast|darkweaver|eldritch|harrow|magister/)) base = {...ROLE_STAT_WEIGHTS.magic, dream:15, soul:12};
  else if (r.match(/null|warden|vanguard|stalwart|sentine/)) base = {...ROLE_STAT_WEIGHTS.warrior, will:15};
  else base = {...ROLE_STAT_WEIGHTS.default};
  if (a === 'magic') { base.soul+=1; base.spirit+=1; base.will-=1; }
  if (a === 'tech')  { base.will+=1; base.mind+=1;  base.soul-=1; }
  Object.keys(base).forEach(k => { base[k] = Math.max(8, Math.min(18, base[k] + Math.floor(Math.random()*5)-2)); });
  return base;
}

// ── Node affinity ──────────────────────────────────────────────────────────────
const ROLE_NODE_AFFINITY = {
  paladin:     ['soul|paladin','soul|augur'],
  augur:       ['soul|augur','soul|iridesce'],
  monk:        ['soul|monk','body|makemark'],
  shaman:      ['soul|shaman','body|ovate'],
  cleric:      ['soul|paladin','whim|guardian'],
  inquisitor:  ['soul|inquisitor','will|arcani'],
  cursewright: ['soul|cursewright','dream|harrow'],
  bokor:       ['soul|bokor','dream|necromancer'],
  guard:       ['soul|inquisitor','body|makemark'],
  archon:      ['spirit|archon','will|arcani'],
  castor:      ['spirit|castor','will|runesiph'],
  magus:       ['spirit|magus','spirit|castor'],
  mage:        ['spirit|magus','spirit|wizard'],
  wizard:      ['spirit|wizard','mind|weaver'],
  warlock:     ['spirit|warlock','dream|eldritch'],
  evoker:      ['spirit|evoker','mind|evoker2'],
  sorcerer:    ['spirit|sorcerer','mind|sorcerer2'],
  zealot:      ['spirit|zealot','soul|paladin'],
  druid:       ['mind|druid','body|ovate'],
  weaver:      ['mind|weaver','will|codexer'],
  dyreon:      ['mind|dyreon','will|arcani'],
  wild:        ['body|wild','body|primalist'],
  fetch:       ['body|fetch','soul|caelyn'],
  primalist:   ['body|primalist','body|wild'],
  makemark:    ['body|makemark','fighter_tree|fighter'],
  arcani:      ['will|arcani','will|sage'],
  sage:        ['will|sage','scholar_tree|scholar'],
  scribe:      ['will|scribe','will|codexer'],
  runesiph:    ['will|runesiph','will|glyphsage'],
  cantor:      ['whim|cantor','affect|bard'],
  mystic:      ['whim|mystic','soul|caelyn'],
  wishwright:  ['whim|wishwright','whim|fatebinder'],
  fatebinder:  ['whim|fatebinder','whim|wishwright'],
  guardian:    ['whim|guardian','fighter_tree|knight'],
  bard:        ['affect|bard','affect|minstrel'],
  minstrel:    ['affect|minstrel','affect|rhapsodist'],
  rhapsodist:  ['affect|rhapsodist','affect|bard'],
  haruspex:    ['affect|haruspex','dream|hemoclast'],
  maleficar:   ['affect|maleficar','soul|cursewright'],
  eldritch:    ['dream|eldritch','spirit|warlock'],
  necromancer: ['dream|necromancer','soul|bokor'],
  hemoclast:   ['dream|hemoclast','affect|haruspex'],
  darkweaver:  ['dream|darkweaver','dream|eldritch'],
  harrow:      ['dream|harrow','soul|cursewright'],
  magister:    ['dream|magister','spirit|archon'],
  rogue:       ['rogue_tree|rogue','rogue_tree|sleuth'],
  assassin:    ['rogue_tree|rogue','dream|harrow'],
  scout:       ['rogue_tree|strider','rogue_tree|ranger'],
  ranger:      ['rogue_tree|ranger','body|fetch'],
  detective:   ['rogue_tree|detective','rogue_tree|inspector'],
  sleuth:      ['rogue_tree|sleuth','rogue_tree|detective'],
  strider:     ['rogue_tree|strider','rogue_tree|ranger'],
  merchant:    ['merchant_tree|merchant','merchant_tree|negotiator'],
  trader:      ['merchant_tree|merchant','merchant_tree|tycoon'],
  negotiator:  ['merchant_tree|negotiator','merchant_tree|emissary'],
  emissary:    ['merchant_tree|emissary','merchant_tree|viceroy'],
  tycoon:      ['merchant_tree|tycoon','merchant_tree|baron'],
  baron:       ['merchant_tree|baron','merchant_tree|viceroy'],
  scholar:     ['scholar_tree|scholar','scholar_tree|archivist'],
  archivist:   ['scholar_tree|archivist','will|sage'],
  inventor:    ['scholar_tree|inventor','artificer_tree|engineer'],
  cartographer:['scholar_tree|cartographer','scholar_tree|strategist'],
  tactician:   ['scholar_tree|tactician','vanguard_tree|strategist'],
  scientist:   ['scholar_tree|scientist','scholar_tree|inventor'],
  laureate:    ['scholar_tree|laureate','poet_tree|tribune'],
  fighter:     ['fighter_tree|fighter','fighter_tree|barbarian'],
  warrior:     ['fighter_tree|fighter','fighter_tree|barbarian'],
  knight:      ['fighter_tree|knight','fighter_tree|gallant'],
  barbarian:   ['fighter_tree|barbarian','fighter_tree|marauder'],
  swashbuckler:['fighter_tree|swashbuckler','rogue_tree|rogue'],
  marauder:    ['fighter_tree|marauder','fighter_tree|barbarian'],
  gallant:     ['fighter_tree|gallant','fighter_tree|knight'],
  vanguard:    ['vanguard_tree|vanguard','vanguard_tree|stalwart'],
  stalwart:    ['vanguard_tree|stalwart','vanguard_tree|warden'],
  sentine:     ['vanguard_tree|sentine','vanguard_tree|stalwart'],
  null:        ['vanguard_tree|null','vanguard_tree|warden'],
  warden:      ['vanguard_tree|warden','vanguard_tree|stalwart'],
  gunsmith:    ['artificer_tree|gunsmith','artificer_tree|gunslinger'],
  gunslinger:  ['artificer_tree|gunslinger','artificer_tree|gunsmith'],
  tinkerer:    ['artificer_tree|tinkerer','artificer_tree|engineer'],
  machinist:   ['artificer_tree|machinist','artificer_tree|tinkerer'],
  engineer:    ['artificer_tree|engineer','scholar_tree|inventor'],
  artificer:   ['artificer_tree|artificer','artificer_tree|tinkerer'],
  poet:        ['poet_tree|poet','poet_tree|herald'],
  herald:      ['poet_tree|herald','poet_tree|tribune'],
  tribune:     ['poet_tree|tribune','poet_tree|provocateur'],
  provocateur: ['poet_tree|provocateur','poet_tree|schematurge'],
  savant:      ['poet_tree|savant','scholar_tree|scholar'],
  schematurge: ['poet_tree|schematurge','poet_tree|provocateur'],
  alchemist:   ['alchemist_tree|alchemist','alchemist_tree|mutagenist'],
  mutagenist:  ['alchemist_tree|mutagenist','alchemist_tree|biomancer'],
  bombardier:  ['alchemist_tree|bombardier','alchemist_tree|saboteur'],
  biomancer:   ['alchemist_tree|biomancer','alchemist_tree|mutagenist'],
  saboteur:    ['alchemist_tree|saboteur','rogue_tree|rogue'],
  philosopher: ['alchemist_tree|philosopher','will|sage'],
  healer:      ['soul|paladin','soul|shaman'],
  spy:         ['rogue_tree|sleuth','rogue_tree|rogue'],
  innkeep:     ['merchant_tree|merchant','affect|bard'],
  vendor:      ['merchant_tree|merchant','merchant_tree|negotiator'],
};

function getNodeAffinities(role, alignment) {
  const r = (role||'').toLowerCase();
  for (const [key, nodes] of Object.entries(ROLE_NODE_AFFINITY)) {
    if (r.includes(key)) {
      const shuffled = [...nodes].sort(() => Math.random()-0.5);
      return shuffled.slice(0, Math.random()>0.3 ? 2 : 1);
    }
  }
  const magicRows = ['soul','spirit','mind','body','will','whim','affect','dream'];
  const techRows  = ['rogue_tree','merchant_tree','scholar_tree','fighter_tree','vanguard_tree','artificer_tree','poet_tree','alchemist_tree'];
  const pool = alignment==='tech' ? techRows : alignment==='magic' ? magicRows : [...magicRows,...techRows];
  return pool.sort(()=>Math.random()-0.5).slice(0,2).map(rowKey => {
    const row = ABILITY_NODES[rowKey]; if (!row) return null;
    const nodeKeys = Object.keys(row.nodes);
    return `${rowKey}|${nodeKeys[Math.floor(Math.random()*nodeKeys.length)]}`;
  }).filter(Boolean);
}

const FACTIONS = ['The Gryndal','The Synod','The Kira Deu','The Yarositan Empire','Cult of Thorns','The Ebonshroud Hand','The Conclave of Mages','The Circle of Eight','The Orphaned','Banat Al-Layl','The Luminary','The Thieves Underground','Managerie Council','Brunar Separatists','Legion of Elddim','Sovereign Kingdom Directorate','The Orinscess Triage','Mörkhofn','La Marée d\'Or','Caelyn - Wardens of the Caelvern','Draeth - Harbingers of the Caelvern','Iridesce - Starstriders','Whyth - Bearers of the Whythryn Cogmail','Arcani - FaeKnights','Aerephet - Wraithborne Incubi','The Wayward','House Sillmeer','Council of Asherah','Ba_elnariani','Nyumbani','Hadarai','Iloists - Heartkeepers','The Devoted - Way of Devotion','Ylandari','Cult of Dra_agora','Dunerryian','Firretharh','Brogoshk','Sýrethens','The Gilded Syndicate','The Zor_gol','Khoneul Shadow Paragon','Xaloran Creed','Kildrak - Way of the Stone','Claven of Hreidmar','Fortune\'s Children','The Wheel of Mýr','The Auric Order','Týrethanists','Rifters - Worshippers of the Maelstrom','The Malochean','The Haruspex','The Yal Arcana','The Acends','Wardens','Desolaran','Nameahn Pluralists','Unmarked'];
const S = {
  root:{display:'flex',flexDirection:'column',height:'100%',background:'#0e0c09',color:'#c8b890',fontFamily:"'Crimson Pro','Georgia',serif",fontSize:13,overflow:'hidden',position:'relative'},
  toolbar:{display:'flex',alignItems:'center',gap:6,padding:'8px 10px',borderBottom:'1px solid rgba(184,137,42,0.2)',flexShrink:0},
  searchInput:{flex:1,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(184,137,42,0.25)',borderRadius:3,color:'#c8b890',padding:'4px 8px',fontFamily:'inherit',fontSize:12,outline:'none'},
  btnGold:{background:'rgba(184,137,42,0.18)',border:'1px solid rgba(184,137,42,0.35)',borderRadius:3,color:'#e8c040',cursor:'pointer',padding:'5px 10px',fontSize:11,fontFamily:"'Cinzel',serif",letterSpacing:'0.08em',whiteSpace:'nowrap'},
  btnGrey:{background:'rgba(100,100,90,0.15)',border:'1px solid rgba(150,140,120,0.25)',borderRadius:3,color:'rgba(200,190,160,0.6)',cursor:'pointer',padding:'5px 10px',fontSize:11,fontFamily:"'Cinzel',serif",letterSpacing:'0.06em',whiteSpace:'nowrap'},
  quickBtn:{background:'rgba(184,137,42,0.18)',border:'1px solid rgba(184,137,42,0.3)',borderRadius:3,color:'#e8c040',cursor:'pointer',padding:'3px 7px',fontSize:11},
  scroll:{flex:1,overflowY:'auto',padding:'2px 0'},
  cityBlock:{borderBottom:'1px solid rgba(255,255,255,0.04)'},
  cityHeader:{display:'flex',alignItems:'center',gap:6,padding:'7px 10px',cursor:'pointer',background:'rgba(184,137,42,0.07)',userSelect:'none'},
  cityChevron:{fontSize:9,color:'rgba(184,137,42,0.5)',width:10},
  cityName:{fontFamily:"'Cinzel',serif",fontSize:11,letterSpacing:'0.1em',color:'#e8c040',flex:1},
  cityRegion:{fontSize:10,color:'rgba(200,180,130,0.3)',fontStyle:'italic'},
  cityCount:{fontSize:10,color:'rgba(184,137,42,0.45)'},
  catBlock:{borderTop:'1px solid rgba(255,255,255,0.03)'},
  catHeader:{display:'flex',alignItems:'center',gap:5,padding:'4px 10px 4px 18px',cursor:'pointer',userSelect:'none'},
  catChevron:{fontSize:8,width:10,color:'rgba(184,137,42,0.3)'},
  catPip:{width:6,height:6,borderRadius:'50%',flexShrink:0},
  catName:{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',flex:1},
  catCount:{fontSize:9,color:'rgba(184,137,42,0.4)'},
  groupBlock:{borderTop:'1px solid rgba(255,255,255,0.02)',marginLeft:10},
  groupHeader:{display:'flex',alignItems:'center',gap:5,padding:'3px 10px 3px 16px',cursor:'pointer',userSelect:'none',background:'rgba(255,255,255,0.02)'},
  groupChevron:{fontSize:7,width:8,color:'rgba(184,137,42,0.25)'},
  groupName:{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:'0.1em',color:'rgba(200,180,130,0.6)',flex:1,fontStyle:'italic'},
  groupCount:{fontSize:9,color:'rgba(184,137,42,0.3)'},
  npcRow:{display:'flex',alignItems:'center',gap:6,padding:'5px 10px 5px 28px',borderBottom:'1px solid rgba(255,255,255,0.02)',cursor:'pointer'},
  npcRowIndented:{display:'flex',alignItems:'center',gap:6,padding:'4px 10px 4px 36px',borderBottom:'1px solid rgba(255,255,255,0.015)',cursor:'pointer'},
  npcDot:{width:7,height:7,borderRadius:'50%',flexShrink:0,marginTop:4},
  npcMain:{flex:1,minWidth:0},
  npcName:{fontWeight:600,color:'#ddd0b0',fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  npcRole:{color:'rgba(200,180,130,0.5)',fontSize:11,fontStyle:'italic'},
  npcStatus:{fontSize:10,fontFamily:"'Cinzel',serif",letterSpacing:'0.05em',flexShrink:0},
  drawer:{position:'relative',width:'100%',border:'1px solid rgba(184,137,42,0.35)',borderRadius:8,background:'rgba(8,6,4,0.98)',padding:'10px 12px',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.8)'},
  drawerTitle:{fontFamily:"'Cinzel',serif",fontSize:13,color:'#e8c040',letterSpacing:'0.1em',marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'},
  closeBtn:{background:'none',border:'none',color:'rgba(200,180,130,0.4)',cursor:'pointer',fontSize:14,lineHeight:1,padding:0},
  field:{marginBottom:7},
  label:{fontSize:10,color:'rgba(184,137,42,0.55)',letterSpacing:'0.1em',fontFamily:"'Cinzel',serif",textTransform:'uppercase',display:'block',marginBottom:2},
  fieldInput:{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(184,137,42,0.2)',borderRadius:3,color:'#c8b890',padding:'4px 7px',fontFamily:'inherit',fontSize:13,outline:'none',boxSizing:'border-box'},
  fieldSelect:{width:'100%',background:'#0e0c09',border:'1px solid rgba(184,137,42,0.2)',borderRadius:3,color:'#c8b890',padding:'4px 7px',fontFamily:'inherit',fontSize:12,outline:'none',boxSizing:'border-box'},
  fieldTextarea:{width:'100%',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(184,137,42,0.2)',borderRadius:3,color:'#c8b890',padding:'4px 7px',fontFamily:'inherit',fontSize:12,outline:'none',resize:'vertical',minHeight:56,boxSizing:'border-box'},
  modal:{position:'absolute',inset:0,background:'rgba(8,6,4,0.97)',display:'flex',flexDirection:'column',zIndex:20,overflow:'hidden'},
  modalBtnRow:{display:'flex',gap:8,marginTop:8},
  modalConfirm:{flex:1,background:'rgba(60,180,60,0.2)',border:'1px solid rgba(60,180,60,0.4)',borderRadius:3,color:'#80e080',cursor:'pointer',padding:'7px',fontSize:12,fontFamily:"'Cinzel',serif"},
  modalCancel:{background:'none',border:'1px solid rgba(200,130,130,0.3)',borderRadius:3,color:'rgba(200,130,130,0.7)',cursor:'pointer',padding:'7px 12px',fontSize:12},
  genBtn:{width:'100%',background:'rgba(184,137,42,0.12)',border:'1px solid rgba(184,137,42,0.35)',borderRadius:4,padding:'7px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:9,color:'#e8c040',letterSpacing:'0.08em',marginBottom:10},
  suggestTray:{borderBottom:'1px solid rgba(184,137,42,0.2)',background:'rgba(60,100,60,0.12)',padding:'6px 10px',flexShrink:0},
  suggestLabel:{fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:'0.15em',color:'rgba(96,200,96,0.7)',textTransform:'uppercase',marginBottom:5},
  suggestCard:{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(96,200,96,0.2)',borderRadius:3,padding:'5px 8px',marginBottom:4},
  suggestInfo:{flex:1,minWidth:0},
  suggestName:{color:'#c8e0c0',fontWeight:600,fontSize:13},
  suggestMeta:{color:'rgba(180,200,160,0.5)',fontSize:11,fontStyle:'italic'},
  suggestAccept:{background:'rgba(60,180,60,0.2)',border:'1px solid rgba(60,180,60,0.4)',borderRadius:3,color:'#80e080',cursor:'pointer',padding:'3px 7px',fontSize:11,whiteSpace:'nowrap'},
  suggestDismiss:{background:'none',border:'none',color:'rgba(200,130,130,0.5)',cursor:'pointer',fontSize:13,lineHeight:1,padding:'2px 4px'},
};

const EMPTY_FORM = {name:'',role:'',race:'',race_variant:'',cid:'',status:'Active',category:'Uncategorized',group_name:'',faction:'',notes:'',city_id:'unassigned',alignment:'neutral',vitals_max:16,vitals_current:16,stamina_max:16,stamina_current:16,resolve_max:16,resolve_current:16,stats:{soul:8,spirit:8,mind:8,body:8,will:8,whim:8,affect:8,dream:8},conditions:[],tags:[],selected_nodes:[],selected_abilities:{},loot_items:[]};

function NPCModal({ cities, groups, onSave, onClose }) {
  const [tab, setTab] = useState('identity');
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [abilityTab, setAbilityTab] = useState('magic');
  const [generatingLoot, setGeneratingLoot] = useState(false);
  const nameRef = useRef(null);
  useEffect(() => { nameRef.current?.focus(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setStat = (k, v) => setForm(f => ({ ...f, stats: { ...f.stats, [k]: Number(v)||8 } }));

  const generateIdentity = () => {
    const r = (form.role||'').toLowerCase();
    const ALIGNMENTS = ['neutral','magic','tech','neutral','neutral','magic','tech','chaos','order','shadow','light'];
    const PERSONALITIES = [
      'Speaks in measured tones, never more than necessary. Harbors a debt that shapes every decision.',
      'Openly warm, privately calculating. Knows more about the party than they let on.',
      'Carries a grievance from a past alliance gone wrong. Loyalty must be earned twice.',
      'Curious to a fault — asks too many questions but always for a reason.',
      'Haunted by something they witnessed on the road. Flinches at the wrong sounds.',
      'Excessively formal, as if performing for an audience that isn\u2019t there.',
      'Generous with strangers, cold to those who know them well.',
      'Marks every deal in writing. Has a ledger they guard like a second soul.',
      'Seems cheerful until you catch them staring into nothing between sentences.',
      'Claims no faction, but their hands tell a different story.',
      'Once held a position of power. Lost it. Still acts like they have it.',
      'Profoundly superstitious — observes small rituals before speaking to anyone new.',
    ];
    const TAG_MAP = {
      merchant:['merchant','trader'],trader:['trader','merchant'],innkeep:['innkeep','vendor'],
      vendor:['vendor','trader'],guard:['neutral'],soldier:['neutral'],
      quest:['questgiver'],contact:['questgiver','ally'],enemy:['enemy'],
      assassin:['enemy'],criminal:['enemy'],spy:['enemy','neutral'],
      ally:['ally'],healer:['ally','questgiver'],cleric:['ally'],
      default:['neutral'],
    };
    const pick = arr => arr[Math.floor(Math.random()*arr.length)];
    const faction = pick(FACTIONS);
    const alignment = pick(ALIGNMENTS);
    const notes = pick(PERSONALITIES);
    let tags = TAG_MAP.default;
    for (const [key,val] of Object.entries(TAG_MAP)) { if (r.includes(key)) { tags=val; break; } }
    const startConds = Math.random()>0.6 ? [pick(['Working','Traveling','Guarding','Resting'])] : [];
    setForm(f => ({...f, faction, alignment, tags, conditions:startConds, notes}));
  };

  const generateVitals = () => {
    const stats = getRoleWeights(form.role, form.alignment);
    const vitals_max = Math.max(10, stats.body + stats.will);
    const stamina_max = Math.max(10, stats.body + stats.whim);
    const resolve_max = Math.max(10, stats.soul + stats.dream);
    setForm(f => ({...f, stats, vitals_max, vitals_current:vitals_max, stamina_max, stamina_current:stamina_max, resolve_max, resolve_current:resolve_max}));
  };

  const generateAbilities = () => {
    const nodeKeys = getNodeAffinities(form.role, form.alignment);
    const newNodes = []; const newAbilities = {};
    for (const key of nodeKeys) {
      const [rowKey, nodeKey] = key.split('|');
      const node = ABILITY_NODES[rowKey]?.nodes?.[nodeKey];
      if (!node) continue;
      newNodes.push(key);
      const count = Math.random() > 0.5 ? 3 : 2;
      newAbilities[key] = [...node.abilities].sort(()=>Math.random()-0.5).slice(0, count);
    }
    setForm(f => ({...f, selected_nodes:newNodes, selected_abilities:newAbilities}));
    if (newNodes.length > 0) {
      const row = ABILITY_NODES[newNodes[0].split('|')[0]];
      if (row) setAbilityTab(row.axis);
    }
  };

  const toggleNode = (rowKey, nodeKey) => {
    const key = `${rowKey}|${nodeKey}`;
    setForm(f => {
      const cur = f.selected_nodes;
      if (cur.includes(key)) { const abs={...f.selected_abilities}; delete abs[key]; return {...f,selected_nodes:cur.filter(k=>k!==key),selected_abilities:abs}; }
      if (cur.length>=2) return f;
      return {...f,selected_nodes:[...cur,key]};
    });
  };

  const toggleAbility = (nodeKey, ability) => {
    setForm(f => { const cur=f.selected_abilities[nodeKey]||[]; const next=cur.includes(ability)?cur.filter(a=>a!==ability):[...cur,ability]; return {...f,selected_abilities:{...f.selected_abilities,[nodeKey]:next}}; });
  };

  const generateLoot = async () => {
    setGeneratingLoot(true);
    const nodeRows = form.selected_nodes.map(k=>k.split('|')[0]);
    const cats = [...new Set(nodeRows.flatMap(r=>(LOOT_WEIGHTS[r]||'Gear').split(',')))];
    const items = [];
    for (const cat of cats.slice(0,3)) {
      const {data} = await supabase.from('items').select('id,name,category,description,rarity').eq('category',cat.trim()).limit(100);
      if (data?.length) items.push(...data.sort(()=>Math.random()-0.5).slice(0,Math.floor(Math.random()*2)+1));
    }
    const {data:bonus} = await supabase.from('items').select('id,name,category,description,rarity').limit(500);
    if (bonus) items.push(...bonus.sort(()=>Math.random()-0.5).slice(0,2));
    setForm(f=>({...f,loot_items:items.map(i=>({...i,_keep:true}))}));
    setGeneratingLoot(false); setTab('loot');
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const abilities = Object.entries(form.selected_abilities).flatMap(([nodeKey,abs])=>abs.map(a=>({node:nodeKey,ability:a})));
    const keptLoot = form.loot_items.filter(i=>i._keep);
    const {data,error} = await supabase.from('npcs').insert({
      id:`npc_${newId()}`,city_id:form.city_id,name:form.name.trim(),role:form.role,
      race:form.race||null,race_variant:form.race_variant||null,cid:form.cid||null,status:form.status,
      category:form.category||'Uncategorized',group_name:form.group_name||'',faction:form.faction,notes:form.notes,
      conditions:form.conditions,tags:form.tags,alignment:form.alignment,
      vitals_max:form.vitals_max,vitals_current:form.vitals_current,
      stamina_max:form.stamina_max,stamina_current:form.stamina_current,
      resolve_max:form.resolve_max,resolve_current:form.resolve_current,
      stats:form.stats,abilities,
      inventory:keptLoot.map(i=>({item_id:i.id,name:i.name,category:i.category,desc:i.description,rarity:i.rarity})),
      loot_generated:keptLoot.length>0,
    }).select().single();
    if (error) { console.error('NPC save error:',error); setSaving(false); return; }
    if (data && keptLoot.length>0) {
      const {data:box} = await supabase.from('lootboxes').insert({name:`${form.name}'s Loot`,campaign_id:null,revealed:false,claimed:false}).select().single();
      if (box) await supabase.from('lootbox_items').insert(keptLoot.map(i=>({lootbox_id:box.id,item_name:i.name,item_category:i.category,item_desc:i.description||'',qty:1})));
    }
    setSaving(false); onSave(data);
  };

  const modalCity = cities.find(c=>c.id===form.city_id);
  const modalGroups = modalCity ? groups.filter(g=>g.city_id===modalCity.id&&g.category===form.category) : [];
  const [condSearch, setCondSearch] = useState('');

  return (
    <div style={S.modal}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 14px',borderBottom:'1px solid rgba(184,137,42,0.2)',flexShrink:0}}>
        <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:'#e8c040',letterSpacing:'0.12em'}}>ADD NPC</div>
        <button onClick={onClose} style={S.closeBtn}>✕</button>
      </div>
      <div style={{display:'flex',borderBottom:'1px solid rgba(184,137,42,0.15)',flexShrink:0}}>
        {['identity','vitals','abilities','loot'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'7px 0',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',border:'none',borderBottom:tab===t?'2px solid #e8c040':'2px solid transparent',background:'transparent',color:tab===t?'#e8c040':'rgba(200,180,130,0.4)'}}>{t}</button>
        ))}
      </div>

      <div style={{flex:1,overflowY:'auto',padding:'12px 14px'}}>

        {tab==='identity' && (
          <div style={{display:'flex',flexDirection:'column',gap:9}}>
            <div style={{display:'flex',gap:8,alignItems:'flex-end'}}>
              <div style={{flex:1}}><label style={S.label}>Name *</label><input ref={nameRef} style={S.fieldInput} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="NPC name…"/></div>
              <button onClick={generateIdentity} disabled={!form.name.trim()} style={{...S.genBtn,width:'auto',padding:'5px 10px',marginBottom:0,opacity:form.name.trim()?1:0.4,cursor:form.name.trim()?'pointer':'not-allowed'}}>'⚙ Generate'</button>
            </div>
            <div style={{display:'flex',gap:8}}>
              <div style={{...S.field,flex:2}}><label style={S.label}>Role / Title</label><input style={S.fieldInput} value={form.role} onChange={e=>set('role',e.target.value)} placeholder="Role or title…"/></div>
              <div style={{...S.field,flex:1}}><label style={S.label}>Status</label><select style={S.fieldSelect} value={form.status} onChange={e=>set('status',e.target.value)}>{STATUS_OPTIONS.map(s=><option key={s} value={s} style={{background:'#0e0c09'}}>{s}</option>)}</select></div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <div style={{...S.field,flex:1}}><label style={S.label}>Race</label><select style={S.fieldSelect} value={form.race} onChange={e=>set('race',e.target.value)||set('race_variant','')}><option value="" style={{background:'#0e0c09'}}>— Select race —</option>{Object.keys(RACE_OPTIONS).map(r=><option key={r} value={r} style={{background:'#0e0c09'}}>{r}</option>)}</select></div>
              {RACE_OPTIONS[form.race]?.length > 0 && (
                <div style={{...S.field,flex:1}}><label style={S.label}>Variant</label><select style={S.fieldSelect} value={form.race_variant} onChange={e=>set('race_variant',e.target.value)}><option value="" style={{background:'#0e0c09'}}>— None —</option>{RACE_OPTIONS[form.race].map(v=><option key={v} value={v} style={{background:'#0e0c09'}}>{v}</option>)}</select></div>
              )}
              <div style={{...S.field,flex:1}}><label style={S.label}>Class</label><select style={S.fieldSelect} value={form.cid} onChange={e=>set('cid',e.target.value)}><option value="" style={{background:'#0e0c09'}}>— Select class —</option>{ALL_CLASSES?.map(c=><option key={c.id} value={c.id} style={{background:'#0e0c09'}}>{c.name}</option>)}</select></div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <div style={{...S.field,flex:1}}><label style={S.label}>City</label><select style={S.fieldSelect} value={form.city_id} onChange={e=>set('city_id',e.target.value)}><option value="unassigned" style={{background:'#0e0c09'}}>Unassigned</option>{cities.map(c=><option key={c.id} value={c.id} style={{background:'#0e0c09'}}>{c.name}{c.region?` — ${c.region}`:''}</option>)}</select></div>
              <div style={{...S.field,flex:1}}><label style={S.label}>Category</label><select style={S.fieldSelect} value={form.category} onChange={e=>set('category',e.target.value)}>{CATEGORY_OPTIONS.map(c=><option key={c} value={c} style={{background:'#0e0c09'}}>{c}</option>)}</select></div>
            </div>
            {modalGroups.length>0 && <div style={S.field}><label style={S.label}>Group</label><select style={S.fieldSelect} value={form.group_name} onChange={e=>set('group_name',e.target.value)}><option value="" style={{background:'#0e0c09'}}>— No group —</option>{modalGroups.map(g=><option key={g.id} value={g.name} style={{background:'#0e0c09'}}>{g.name}</option>)}</select></div>}
            <div style={S.field}><label style={S.label}>Alignment</label><select style={S.fieldSelect} value={form.alignment} onChange={e=>set('alignment',e.target.value)}>{['neutral','magic','tech','chaos','order','shadow','light'].map(a=><option key={a} value={a} style={{background:'#0e0c09'}}>{a}</option>)}</select></div>
            <div style={S.field}><label style={S.label}>Faction</label><select style={S.fieldSelect} value={form.faction} onChange={e=>set('faction',e.target.value)}><option value="" style={{background:'#0e0c09'}}>— Select faction —</option>{FACTIONS.map(f=><option key={f} value={f} style={{background:'#0e0c09'}}>{f}</option>)}</select></div>            <div style={S.field}><label style={S.label}>Tags</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                {['trader','merchant','innkeep','vendor','questgiver','enemy','ally','neutral'].map(tag=>(
                  <button key={tag} onClick={()=>set('tags',form.tags.includes(tag)?form.tags.filter(t=>t!==tag):[...form.tags,tag])} style={{background:form.tags.includes(tag)?'rgba(184,137,42,0.25)':'rgba(255,255,255,0.04)',border:`1px solid ${form.tags.includes(tag)?'rgba(184,137,42,0.6)':'rgba(184,137,42,0.2)'}`,borderRadius:12,padding:'3px 9px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:9,color:form.tags.includes(tag)?'#e8c040':'rgba(200,180,130,0.4)'}}>{tag}</button>
                ))}
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Conditions</label>
              <input value={condSearch} onChange={e=>setCondSearch(e.target.value)} placeholder="Search conditions…" style={{...S.fieldInput,marginBottom:6,fontSize:11}}/>
              <div style={{display:'flex',flexWrap:'wrap',gap:4,maxHeight:90,overflowY:'auto'}}>
                {CONDITIONS.filter(c=>!condSearch||c.toLowerCase().includes(condSearch.toLowerCase())).map(cond=>{
                  const active=form.conditions.includes(cond);
                  return <button key={cond} onClick={()=>set('conditions',active?form.conditions.filter(c=>c!==cond):[...form.conditions,cond])} style={{background:active?`${condColor(cond)}22`:'rgba(255,255,255,0.03)',border:`1px solid ${active?condColor(cond)+'66':'rgba(184,137,42,0.15)'}`,borderRadius:12,padding:'2px 7px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:9,color:active?condColor(cond):'rgba(200,180,130,0.4)'}}>{cond}{active?' ✓':''}</button>;
                })}
              </div>
            </div>
            <div style={S.field}><label style={S.label}>Notes</label><textarea style={S.fieldTextarea} value={form.notes} onChange={e=>set('notes',e.target.value)} placeholder="DM notes, plot hooks, relationships…"/></div>
          </div>
        )}

        {tab==='vitals' && (
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <button onClick={generateVitals} style={S.genBtn}>⚙ Generate Stats from Role</button>
            {[['vitals','Vitals','#e05a5a'],['stamina','Stamina','#e08a5a'],['resolve','Resolve','#79f5a7']].map(([key,label,color])=>(
              <div key={key}>
                <label style={{...S.label,color}}>{label}</label>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <span style={{fontSize:10,color:'rgba(200,180,130,0.4)',width:50}}>Current</span>
                  <input type="number" value={form[`${key}_current`]} onChange={e=>set(`${key}_current`,Number(e.target.value))} style={{width:60,background:'rgba(255,255,255,0.05)',border:`1px solid ${color}44`,borderRadius:4,color,fontFamily:"'Cinzel',serif",fontSize:14,fontWeight:700,outline:'none',padding:'4px 6px',textAlign:'center'}}/>
                  <span style={{color:'rgba(200,180,130,0.3)'}}>/ </span>
                  <input type="number" value={form[`${key}_max`]} onChange={e=>set(`${key}_max`,Number(e.target.value))} style={{width:60,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(184,137,42,0.2)',borderRadius:4,color:'rgba(200,180,130,0.6)',fontSize:12,outline:'none',padding:'4px 6px',textAlign:'center'}}/>
                  <span style={{fontSize:10,color:'rgba(200,180,130,0.4)'}}>max</span>
                </div>
                <div style={{height:4,background:`${color}22`,borderRadius:3,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.max(0,Math.min(100,(form[`${key}_current`]/Math.max(1,form[`${key}_max`]))*100))}%`,background:color,borderRadius:3}}/></div>
              </div>
            ))}
            <div style={{borderTop:'1px solid rgba(184,137,42,0.15)',paddingTop:12}}>
              <label style={S.label}>Stats</label>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:6}}>
                {['soul','spirit','mind','body','will','whim','affect','dream'].map(k=>(
                  <div key={k} style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'rgba(184,137,42,0.55)',width:50,textTransform:'capitalize'}}>{k}</span>
                    <input type="number" min={1} max={20} value={form.stats[k]||8} onChange={e=>setStat(k,e.target.value)} style={{width:48,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(184,137,42,0.2)',borderRadius:4,color:'#c8b890',fontSize:12,outline:'none',padding:'4px 6px',textAlign:'center'}}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab==='abilities' && (
          <div>
            <button onClick={generateAbilities} style={S.genBtn}>⚙ Auto-Select Nodes from Role</button>
            <div style={{fontSize:10,color:'rgba(200,180,130,0.4)',fontFamily:"'Cinzel',serif",marginBottom:10}}>Select up to 2 nodes · {form.selected_nodes.length}/2 chosen</div>
            <div style={{display:'flex',gap:5,marginBottom:12}}>
              {['magic','tech'].map(a=>(
                <button key={a} onClick={()=>setAbilityTab(a)} style={{background:abilityTab===a?'rgba(184,137,42,0.2)':'transparent',border:`1px solid ${abilityTab===a?'rgba(184,137,42,0.5)':'rgba(184,137,42,0.2)'}`,borderRadius:4,padding:'4px 12px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:9,color:abilityTab===a?'#e8c040':'rgba(200,180,130,0.4)',letterSpacing:'0.1em',textTransform:'uppercase'}}>{a==='magic'?'Magicka':'Ingenium'}</button>
              ))}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              {Object.entries(ABILITY_NODES).filter(([,row])=>row.axis===abilityTab).map(([rowKey,row])=>(
                <div key={rowKey}>
                  <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'rgba(184,137,42,0.5)',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:6}}>{row.label}</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {Object.entries(row.nodes).map(([nodeKey,node])=>{
                      const key=`${rowKey}|${nodeKey}`; const selected=form.selected_nodes.includes(key); const disabled=!selected&&form.selected_nodes.length>=2;
                      return (
                        <div key={nodeKey}>
                          <button onClick={()=>!disabled&&toggleNode(rowKey,nodeKey)} style={{background:selected?'rgba(184,137,42,0.2)':'rgba(255,255,255,0.04)',border:`1px solid ${selected?'rgba(184,137,42,0.6)':'rgba(184,137,42,0.15)'}`,borderRadius:5,padding:'4px 10px',cursor:disabled?'not-allowed':'pointer',fontFamily:"'Cinzel',serif",fontSize:9,color:selected?'#e8c040':disabled?'rgba(200,180,130,0.2)':'rgba(200,180,130,0.55)',opacity:disabled?0.4:1}}>{node.label}</button>
                          {selected && (
                            <div style={{marginTop:5,marginLeft:4,display:'flex',flexDirection:'column',gap:3,marginBottom:5}}>
                              {node.abilities.map(ability=>{
                                const abActive=(form.selected_abilities[key]||[]).includes(ability);
                                return <button key={ability} onClick={()=>toggleAbility(key,ability)} style={{background:abActive?'rgba(121,245,167,0.1)':'transparent',border:`1px solid ${abActive?'rgba(121,245,167,0.4)':'rgba(184,137,42,0.1)'}`,borderRadius:4,padding:'3px 8px',cursor:'pointer',fontFamily:'Georgia,serif',fontSize:10,color:abActive?'#79f5a7':'rgba(200,180,130,0.5)',textAlign:'left'}}>{abActive?'✓ ':'◦ '}{ability}</button>;
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab==='loot' && (
          <div>
            <div style={{fontSize:10,color:'rgba(200,180,130,0.4)',fontFamily:"'Cinzel',serif",marginBottom:12,fontStyle:'italic'}}>Generate loot based on node selections. Remove items before sending to Bazaar.</div>
            <button onClick={generateLoot} disabled={generatingLoot} style={{...S.genBtn,fontWeight:700,fontSize:10}}>{generatingLoot?'Generating…':'⚄ Generate Loot'}</button>
            {form.loot_items.length>0 && (
              <>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:9,color:'rgba(184,137,42,0.5)',marginBottom:8}}>{form.loot_items.filter(i=>i._keep).length} items · DM review before reveal</div>
                {form.loot_items.map((item,i)=>(
                  <div key={item.id||i} style={{display:'flex',alignItems:'center',gap:8,background:item._keep?'rgba(255,255,255,0.04)':'rgba(224,90,90,0.05)',border:`1px solid ${item._keep?'rgba(184,137,42,0.2)':'rgba(224,90,90,0.2)'}`,borderRadius:5,padding:'7px 10px',marginBottom:5,opacity:item._keep?1:0.5}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:item._keep?'#ddd0b0':'#888',textDecoration:item._keep?'none':'line-through'}}>{item.name}</div>
                      <div style={{fontSize:9,color:'rgba(200,180,130,0.4)',fontStyle:'italic'}}>{item.category}{item.rarity?` · ${item.rarity}`:''}</div>
                    </div>
                    <button onClick={()=>setForm(f=>({...f,loot_items:f.loot_items.map((li,j)=>j===i?{...li,_keep:!li._keep}:li)}))} style={{background:item._keep?'rgba(224,90,90,0.15)':'rgba(121,245,167,0.12)',border:`1px solid ${item._keep?'rgba(224,90,90,0.4)':'rgba(121,245,167,0.4)'}`,borderRadius:4,padding:'2px 8px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:9,color:item._keep?'#e05a5a':'#79f5a7'}}>{item._keep?'✕ Remove':'+ Restore'}</button>
                  </div>
                ))}
                {form.loot_items.some(i=>i._keep) && <div style={{marginTop:10,padding:'8px 10px',background:'rgba(184,137,42,0.06)',border:'1px solid rgba(184,137,42,0.2)',borderRadius:6,fontSize:10,color:'rgba(200,180,130,0.5)',fontFamily:"'Cinzel',serif",fontStyle:'italic'}}>✦ Kept items will be sent to Bazaar as "{form.name||'NPC'}'s Loot" on save.</div>}
              </>
            )}
          </div>
        )}
      </div>

      <div style={{display:'flex',gap:8,padding:'10px 14px',borderTop:'1px solid rgba(184,137,42,0.2)',flexShrink:0}}>
        <button onClick={handleSave} disabled={saving||!form.name.trim()} style={S.modalConfirm}>{saving?'Adding…':'✓ Add NPC'}</button>
        <button onClick={onClose} style={S.modalCancel}>Cancel</button>
      </div>
    </div>
  );
}

export default function NPCPanel({ campaignId, sessionId }) {
  const [cities,setCities]=useState([]);
  const [groups,setGroups]=useState([]);
  const [npcs,setNpcs]=useState([]);
  const [loading,setLoading]=useState(true);
  const [collapsed,setCollapsed]=useState({});
  const [catCollapsed,setCatCollapsed]=useState({});
  const [grpCollapsed,setGrpCollapsed]=useState({});
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [showCityModal,setShowCityModal]=useState(false);
  const [showGroupModal,setShowGroupModal]=useState(false);
  const [newCityName,setNewCityName]=useState('');
  const [newGroupForm,setNewGroupForm]=useState({city_id:'unassigned',category:'Uncategorized',name:''});
  const [suggestions,setSuggestions]=useState([]);
  const [activeTab,setActiveTab]=useState('npcs');
  const [players,setPlayers]=useState([]);
  const [condPicker,setCondPicker]=useState(null);
  const [condSearch,setCondSearch]=useState('');
  const [metToast,setMetToast]=useState(null);
  const [editingName,setEditingName]=useState(false);
  const [nameDraft,setNameDraft]=useState('');
  const [confirmingName,setConfirmingName]=useState(false);

  const loadAll=useCallback(async()=>{
    setLoading(true);
    const [{data:cityData},{data:npcData},{data:groupData}]=await Promise.all([supabase.from('npc_cities').select('*').order('name'),supabase.from('npcs').select('*').order('name'),supabase.from('npc_groups').select('*').order('name')]);
    if(cityData)setCities(cityData); if(npcData)setNpcs(npcData); if(groupData)setGroups(groupData);
    setLoading(false);
  },[]);
  useEffect(()=>{loadAll();},[loadAll]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent('census:npc_snapshot',{detail:{npcs:npcs.map(n=>({id:n.id,name:n.name,meta:[n.role,cities.find(c=>c.id===n.city_id)?.name].filter(Boolean).join(' · '),conditions:n.conditions||[]}))}}));},[npcs,cities]);
  useEffect(()=>{const h=()=>window.dispatchEvent(new CustomEvent('census:npc_snapshot',{detail:{npcs:npcs.map(n=>({id:n.id,name:n.name,conditions:n.conditions||[]}))}}));window.addEventListener('census:request_snapshot',h);return()=>window.removeEventListener('census:request_snapshot',h);},[npcs]);
  useEffect(()=>{const h=e=>{const{id,conditions}=e.detail||{};if(!id)return;setNpcs(prev=>prev.map(n=>n.id===id?{...n,conditions}:n));supabase.from('npcs').update({conditions}).eq('id',id);};window.addEventListener('census:npc_conditions',h);return()=>window.removeEventListener('census:npc_conditions',h);},[]);
  useEffect(()=>{const h=e=>{const s=e.detail;if(!s?.name)return;setSuggestions(p=>[...p,{...s,_id:`${Date.now()}_${Math.random()}`}]);};window.addEventListener('npc:suggest',h);return()=>window.removeEventListener('npc:suggest',h);},[]);
  useEffect(()=>{if(activeTab!=='census')return;supabase.from('characters').select('id,name,race,data,campaign_id').order('name').then(({data})=>{if(!data)return;setPlayers(data.map(c=>{const d=typeof c.data==='string'?JSON.parse(c.data||'{}'):(c.data||{});return{id:String(c.id),name:c.name||'Unnamed',race:c.race||'',conditions:Array.isArray(d.conditions)?d.conditions:[]}}));});},[activeTab]);

  const updateNpcField=async(npcId,field,value)=>{setNpcs(prev=>prev.map(n=>n.id===npcId?{...n,[field]:value}:n));await supabase.from('npcs').update({[field]:value}).eq('id',npcId);};
  const toggleNpcCondition=async(npcId,cond)=>{const npc=npcs.find(n=>n.id===npcId);if(!npc)return;const cur=npc.conditions||[];const next=cur.includes(cond)?cur.filter(c=>c!==cond):[...cur,cond];setNpcs(prev=>prev.map(n=>n.id===npcId?{...n,conditions:next}:n));await supabase.from('npcs').update({conditions:next}).eq('id',npcId);};
  const addCity=async()=>{if(!newCityName.trim())return;const{data}=await supabase.from('npc_cities').insert({id:`city_${newId()}`,name:newCityName.trim(),region:''}).select().single();if(data)setCities(prev=>[...prev,data]);setNewCityName('');setShowCityModal(false);};
  const addGroup=async()=>{const{city_id,category,name}=newGroupForm;if(!name.trim())return;const{data}=await supabase.from('npc_groups').insert({id:`grp_${newId()}`,city_id,name:name.trim(),category}).select().single();if(data)setGroups(prev=>[...prev,data]);setNewGroupForm(f=>({...f,name:''}));setShowGroupModal(false);};
  const togglePlayerCondition=async(playerId,cond)=>{const player=players.find(p=>p.id===playerId);if(!player)return;const cur=player.conditions||[];const next=cur.includes(cond)?cur.filter(c=>c!==cond):[...cur,cond];setPlayers(prev=>prev.map(p=>p.id===playerId?{...p,conditions:next}:p));const{data:row}=await supabase.from('characters').select('data').eq('id',playerId).maybeSingle();const existing=typeof row?.data==='string'?JSON.parse(row.data||'{}'):(row?.data||{});await supabase.from('characters').update({data:{...existing,conditions:next}}).eq('id',playerId);};
  const markMet=async(npc,cityName)=>{const checkins=await getCheckedInCharacterIds(sessionId);if(!checkins.length){setMetToast('No players checked in');setTimeout(()=>setMetToast(null),3000);return;}await Promise.all(checkins.map(({character_id})=>supabase.from('grimoire_entries').insert({character_id:String(character_id),campaign_id:String(campaignId),type:'npc',title:npc.name,body:[npc.role,npc.faction,cityName].filter(Boolean).join(' · ')||null,dm_note:npc.notes||null})));await logSessionEvent(campaignId,sessionId,'npc_met',{npc_name:npc.name,npc_role:npc.role||'',city:cityName,character_ids:checkins.map(c=>c.character_id)});setMetToast(`${npc.name} added to ${checkins.length} grimoire${checkins.length!==1?'s':''}`);setTimeout(()=>setMetToast(null),3000);};

  const q=search.toLowerCase().trim();
  const citiesWithNpcs=useMemo(()=>cities.map(city=>{let cityNpcs=npcs.filter(n=>n.city_id===city.id);if(q){const cm=city.name.toLowerCase().includes(q)||(city.region||'').toLowerCase().includes(q);if(!cm)cityNpcs=cityNpcs.filter(n=>n.name.toLowerCase().includes(q)||(n.role||'').toLowerCase().includes(q)||(n.faction||'').toLowerCase().includes(q)||(n.category||'').toLowerCase().includes(q)||(n.group_name||'').toLowerCase().includes(q)||(n.notes||'').toLowerCase().includes(q));}return{...city,npcs:cityNpcs,groups:groups.filter(g=>g.city_id===city.id)};}).filter(city=>!q||city.npcs.length>0),[cities,npcs,groups,q]);
  const groupByCategory=npcList=>{const map={};npcList.forEach(n=>{const cat=n.category||'Uncategorized';if(!map[cat])map[cat]=[];map[cat].push(n);});return Object.entries(map).sort(([a],[b])=>{const ai=CATEGORY_OPTIONS.indexOf(a),bi=CATEGORY_OPTIONS.indexOf(b);if(ai===-1&&bi===-1)return a.localeCompare(b);if(ai===-1)return 1;if(bi===-1)return -1;return ai-bi;});};
  const groupNpcsByGroup=npcList=>{const g={};npcList.forEach(n=>{const grp=n.group_name||'';if(!g[grp])g[grp]=[];g[grp].push(n);});return g;};
  const selectedNpc=selected?npcs.find(n=>n.id===selected):null;
  const selectedCity=selectedNpc?cities.find(c=>c.id===selectedNpc.city_id):null;

  const NpcButtons=({npc,cityName})=>(
    <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
      <button onClick={e=>{e.stopPropagation();markMet(npc,cityName);}} style={{background:'rgba(184,137,42,0.12)',border:'1px solid rgba(184,137,42,0.3)',borderRadius:3,color:'#e8c040',cursor:'pointer',padding:'2px 6px',fontSize:9}}>⬡</button>
      <button onClick={e=>{e.stopPropagation();window.dispatchEvent(new CustomEvent('hercules:add_npc',{detail:{id:npc.id,name:npc.name,role:npc.role||'',conditions:npc.conditions||[],cityName}}));}} style={{background:'rgba(60,120,200,0.12)',border:'1px solid rgba(60,120,200,0.3)',borderRadius:3,color:'#80a0e0',cursor:'pointer',padding:'2px 6px',fontSize:9}}>⚔</button>
      <button onClick={e=>{e.stopPropagation();window.dispatchEvent(new CustomEvent('vtt:add_npc_token',{detail:{id:npc.id,name:npc.name,race:npc.race||null}}));}} title="Add to map" style={{background:'rgba(96,200,150,0.12)',border:'1px solid rgba(96,200,150,0.3)',borderRadius:3,color:'#60c896',cursor:'pointer',padding:'2px 6px',fontSize:9}}>⛶</button>
      <div style={{...S.npcStatus,color:sc(npc.status)}}>{npc.status}</div>
    </div>
  );

  if(loading)return(<div style={{...S.root,alignItems:'center',justifyContent:'center'}}><div style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'rgba(184,137,42,0.5)',letterSpacing:'0.14em'}}>Consulting the archives…</div></div>);

  return (
    <div style={S.root}>
      {metToast&&<div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',zIndex:99999,background:'rgba(10,8,5,0.95)',border:'1px solid rgba(184,137,42,0.5)',borderRadius:6,padding:'5px 12px',fontFamily:"'Cinzel',serif",fontSize:9,color:'#e8c040',whiteSpace:'nowrap',pointerEvents:'none'}}>⬡ {metToast}</div>}

      {showModal&&<NPCModal cities={cities} groups={groups} onSave={()=>{loadAll();setShowModal(false);}} onClose={()=>setShowModal(false)}/>}

      {showCityModal&&(<div style={S.modal}><div style={{padding:16,display:'flex',flexDirection:'column',gap:10}}><div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:'#e8c040'}}>ADD CITY</div><label style={S.label}>City Name</label><input style={S.fieldInput} value={newCityName} onChange={e=>setNewCityName(e.target.value)} placeholder="City name…" onKeyDown={e=>e.key==='Enter'&&addCity()} autoFocus/><div style={S.modalBtnRow}><button style={S.modalConfirm} onClick={addCity}>✓ Add City</button><button style={S.modalCancel} onClick={()=>setShowCityModal(false)}>Cancel</button></div></div></div>)}

      {showGroupModal&&(<div style={S.modal}><div style={{padding:16,display:'flex',flexDirection:'column',gap:10}}><div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:'#e8c040'}}>ADD GROUP</div><div style={S.field}><label style={S.label}>Group Name</label><input style={S.fieldInput} value={newGroupForm.name} onChange={e=>setNewGroupForm(f=>({...f,name:e.target.value}))} placeholder="e.g. City Watch…" autoFocus onKeyDown={e=>e.key==='Enter'&&addGroup()}/></div><div style={{display:'flex',gap:8}}><div style={{...S.field,flex:1}}><label style={S.label}>City</label><select style={S.fieldSelect} value={newGroupForm.city_id} onChange={e=>setNewGroupForm(f=>({...f,city_id:e.target.value}))}>{cities.map(c=><option key={c.id} value={c.id} style={{background:'#0e0c09'}}>{c.name}</option>)}</select></div><div style={{...S.field,flex:1}}><label style={S.label}>Category</label><select style={S.fieldSelect} value={newGroupForm.category} onChange={e=>setNewGroupForm(f=>({...f,category:e.target.value}))}>{CATEGORY_OPTIONS.map(c=><option key={c} value={c} style={{background:'#0e0c09'}}>{c}</option>)}</select></div></div><div style={S.modalBtnRow}><button style={S.modalConfirm} onClick={addGroup}>✓ Add Group</button><button style={S.modalCancel} onClick={()=>setShowGroupModal(false)}>Cancel</button></div></div></div>)}

      <div style={S.toolbar}>
        <input style={S.searchInput} placeholder="Search NPCs or cities…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <button style={S.btnGold} onClick={()=>setShowModal(true)}>+ NPC</button>
        <button style={S.btnGrey} onClick={()=>setShowGroupModal(true)}>+ Group</button>
        <button style={S.btnGrey} onClick={()=>setShowCityModal(true)}>+ City</button>
      </div>

      <div style={{display:'flex',borderBottom:'1px solid rgba(184,137,42,0.15)',flexShrink:0}}>
        {[['npcs','NPCs'],['census','Census']].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{flex:1,padding:'7px 0',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',border:'none',borderBottom:activeTab===id?'2px solid #e8c040':'2px solid transparent',background:'transparent',color:activeTab===id?'#e8c040':'rgba(200,180,130,0.4)'}}>{label}</button>
        ))}
      </div>

      {activeTab==='npcs'&&(
        <>
          {suggestions.length>0&&(<div style={S.suggestTray}><div style={S.suggestLabel}>⚑ Scribe Suggestions</div>{suggestions.map(s=>(<div key={s._id} style={S.suggestCard}><div style={S.suggestInfo}><div style={S.suggestName}>{s.name}</div><div style={S.suggestMeta}>{[s.role,s.city].filter(Boolean).join(' · ')}</div></div><button style={S.suggestAccept} onClick={()=>{setShowModal(true);setSuggestions(p=>p.filter(x=>x._id!==s._id));}}>+ Add</button><button style={S.suggestDismiss} onClick={()=>setSuggestions(p=>p.filter(x=>x._id!==s._id))}>✕</button></div>))}</div>)}
          <div style={S.scroll}>
            {citiesWithNpcs.map(city=>{
              const isCollapsed=collapsed[city.id];
              const catGroups=groupByCategory(city.npcs);
              return(
                <div key={city.id} style={S.cityBlock}>
                  <div style={S.cityHeader} onClick={()=>setCollapsed(c=>({...c,[city.id]:!c[city.id]}))}>
                    <span style={S.cityChevron}>{isCollapsed?'▶':'▼'}</span>
                    <span style={S.cityName}>{city.name}</span>
                    {city.region&&<span style={S.cityRegion}>{city.region}</span>}
                    <span style={S.cityCount}>{city.npcs.length}</span>
                  </div>
                  {!isCollapsed&&(
                    <>
                      {catGroups.length===0&&<div style={{padding:'5px 28px',color:'rgba(200,180,130,0.2)',fontSize:11,fontStyle:'italic'}}>No NPCs yet</div>}
                      {catGroups.map(([cat,catNpcs])=>{
                        const catKey=`${city.id}__${cat}`;const isCatColl=catCollapsed[catKey];const color=cc(cat);
                        const byGroup=groupNpcsByGroup(catNpcs);
                        const allGroupNames=[...new Set([...city.groups.filter(g=>g.category===cat).map(g=>g.name),...Object.keys(byGroup).filter(k=>k!=='')])];
                        const ungrouped=byGroup['']||[];
                        return(
                          <div key={cat} style={S.catBlock}>
                            <div style={S.catHeader} onClick={()=>setCatCollapsed(c=>({...c,[catKey]:!c[catKey]}))}>
                              <span style={S.catChevron}>{isCatColl?'▶':'▼'}</span>
                              <div style={{...S.catPip,background:color}}/><span style={{...S.catName,color}}>{cat}</span><span style={S.catCount}>{catNpcs.length}</span>
                            </div>
                            {!isCatColl&&(
                              <>
                                {allGroupNames.map(grpName=>{
                                  const grpKey=`${catKey}__${grpName}`;const isGrpColl=grpCollapsed[grpKey];const grpNpcs=byGroup[grpName]||[];
                                  return(<div key={grpName} style={S.groupBlock}><div style={S.groupHeader} onClick={()=>setGrpCollapsed(c=>({...c,[grpKey]:!c[grpKey]}))}>
                                    <span style={S.groupChevron}>{isGrpColl?'▶':'▼'}</span><span style={S.groupName}>📁 {grpName}</span><span style={S.groupCount}>{grpNpcs.length}</span>
                                    <button style={{...S.quickBtn,fontSize:9,padding:'1px 5px',marginLeft:4}} onClick={e=>{e.stopPropagation();setShowModal(true);}}>+</button>
                                  </div>
                                  {!isGrpColl&&grpNpcs.map(npc=>{const isActive=selected===npc.id;const npcCls=ALL_CLASSES?.find(c=>c.id===npc.cid);const raceLine=[npc.race?[npc.race,npc.race_variant].filter(Boolean).join(' · '):null,npcCls?.name].filter(Boolean).join(' · ');return(<div key={npc.id} style={{...S.npcRowIndented,background:isActive?'rgba(184,137,42,0.09)':undefined}} onClick={()=>setSelected(isActive?null:npc.id)}><div style={{...S.npcDot,background:sc(npc.status)}}/><div style={S.npcMain}><div style={S.npcName}>{npc.name}</div>{raceLine&&<div style={{color:'rgba(180,160,110,0.55)',fontSize:10,fontStyle:'italic'}}>{raceLine}</div>}{npc.role&&<div style={S.npcRole}>{npc.role}</div>}{npc.faction&&<div style={{color:'rgba(184,137,42,0.55)',fontSize:10}}>{npc.faction}</div>}</div><NpcButtons npc={npc} cityName={city.name}/></div>);})}
                                  </div>);
                                })}
                                {ungrouped.map(npc=>{const isActive=selected===npc.id;const npcCls=ALL_CLASSES?.find(c=>c.id===npc.cid);const raceLine=[npc.race?[npc.race,npc.race_variant].filter(Boolean).join(' · '):null,npcCls?.name].filter(Boolean).join(' · ');return(<div key={npc.id} style={{...S.npcRow,background:isActive?'rgba(184,137,42,0.09)':undefined}} onClick={()=>setSelected(isActive?null:npc.id)}><div style={{...S.npcDot,background:sc(npc.status)}}/><div style={S.npcMain}><div style={S.npcName}>{npc.name}</div>{raceLine&&<div style={{color:'rgba(180,160,110,0.55)',fontSize:10,fontStyle:'italic'}}>{raceLine}</div>}{npc.role&&<div style={S.npcRole}>{npc.role}</div>}{npc.faction&&<div style={{color:'rgba(184,137,42,0.55)',fontSize:10}}>{npc.faction}</div>}</div><NpcButtons npc={npc} cityName={city.name}/></div>);})}
                                <div style={{padding:'3px 18px 4px'}}><button style={{...S.btnGrey,fontSize:9,padding:'2px 7px'}} onClick={()=>setShowGroupModal(true)}>+ Add Group</button></div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab==='census'&&(
        <div style={{flex:1,overflowY:'auto'}}>
          <div style={{padding:'6px 10px 3px',fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:'0.14em',color:'rgba(184,137,42,0.45)',textTransform:'uppercase',borderBottom:'1px solid rgba(184,137,42,0.1)'}}>Players ({players.length})</div>
          {players.map(p=>(<div key={p.id} style={{padding:'7px 10px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:7,height:7,borderRadius:'50%',background:'#60e060',flexShrink:0}}/><div style={{fontWeight:600,color:'#ddd0b0',fontSize:13,flex:1}}>{p.name}</div>{p.race&&<div style={{fontSize:10,color:'rgba(200,180,130,0.4)',fontStyle:'italic'}}>{p.race}</div>}</div><div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:5,marginLeft:13}}>{(p.conditions||[]).map(c=>(<div key={c} onClick={()=>togglePlayerCondition(p.id,c)} style={{display:'inline-flex',alignItems:'center',gap:3,background:`${condColor(c)}18`,border:`1px solid ${condColor(c)}55`,borderRadius:20,padding:'2px 7px',fontFamily:"'Cinzel',serif",fontSize:9,color:condColor(c),cursor:'pointer'}}><div style={{width:5,height:5,borderRadius:'50%',background:condColor(c)}}/>{c} <span style={{opacity:0.6,marginLeft:2}}>✕</span></div>))}<button onClick={e=>setCondPicker({entityId:p.id,entityType:'player',anchorRect:e.currentTarget.getBoundingClientRect()})} style={{display:'inline-flex',alignItems:'center',background:'rgba(184,137,42,0.08)',border:'1px solid rgba(184,137,42,0.25)',borderRadius:20,padding:'2px 7px',fontFamily:"'Cinzel',serif",fontSize:9,color:'#e8c040',cursor:'pointer'}}>+ Add</button></div></div>))}
          {players.length===0&&<div style={{padding:'16px',fontSize:11,color:'rgba(200,180,130,0.3)',fontStyle:'italic',textAlign:'center'}}>No characters found.</div>}
          <div style={{padding:'6px 10px 3px',fontFamily:"'Cinzel',serif",fontSize:9,letterSpacing:'0.14em',color:'rgba(184,137,42,0.45)',textTransform:'uppercase',borderBottom:'1px solid rgba(184,137,42,0.1)',borderTop:'1px solid rgba(184,137,42,0.1)',marginTop:4}}>NPCs</div>
          {npcs.map(npc=>(<div key={npc.id} style={{padding:'7px 10px',borderBottom:'1px solid rgba(255,255,255,0.04)'}}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:7,height:7,borderRadius:'50%',background:'#c8a860',flexShrink:0}}/><div style={{fontWeight:600,color:'#ddd0b0',fontSize:13,flex:1}}>{npc.name}</div><div style={{fontSize:9,fontFamily:"'Cinzel',serif",color:'rgba(184,137,42,0.4)'}}>{cities.find(c=>c.id===npc.city_id)?.name}</div></div>{npc.role&&<div style={{fontSize:11,color:'rgba(200,180,130,0.4)',fontStyle:'italic',marginLeft:13}}>{npc.role}</div>}<div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:5,marginLeft:13}}>{(npc.conditions||[]).map(c=>(<div key={c} onClick={()=>toggleNpcCondition(npc.id,c)} style={{display:'inline-flex',alignItems:'center',gap:3,background:`${condColor(c)}18`,border:`1px solid ${condColor(c)}55`,borderRadius:20,padding:'2px 7px',fontFamily:"'Cinzel',serif",fontSize:9,color:condColor(c),cursor:'pointer'}}><div style={{width:5,height:5,borderRadius:'50%',background:condColor(c)}}/>{c} <span style={{opacity:0.6,marginLeft:2}}>✕</span></div>))}<button onClick={e=>setCondPicker({entityId:npc.id,entityType:'npc',anchorRect:e.currentTarget.getBoundingClientRect()})} style={{display:'inline-flex',alignItems:'center',background:'rgba(184,137,42,0.08)',border:'1px solid rgba(184,137,42,0.25)',borderRadius:20,padding:'2px 7px',fontFamily:"'Cinzel',serif",fontSize:9,color:'#e8c040',cursor:'pointer'}}>+ Add</button></div></div>))}
        </div>
      )}

      {condPicker&&(<div style={{position:'fixed',zIndex:999999,width:210,background:'#0a0805',border:'1px solid rgba(184,137,42,0.3)',borderRadius:8,boxShadow:'0 16px 48px rgba(0,0,0,0.8)',overflow:'hidden',top:Math.min((condPicker.anchorRect?.bottom||200)+4,window.innerHeight-280),left:Math.min((condPicker.anchorRect?.left||100),window.innerWidth-220)}} onMouseDown={e=>e.stopPropagation()}><input autoFocus value={condSearch} onChange={e=>setCondSearch(e.target.value)} placeholder="Search conditions…" style={{width:'100%',boxSizing:'border-box',background:'rgba(255,255,255,0.06)',border:'none',borderBottom:'1px solid rgba(184,137,42,0.15)',color:'#c8b890',padding:'7px 10px',fontFamily:'inherit',fontSize:11,outline:'none'}}/><div style={{maxHeight:220,overflowY:'auto',padding:'4px 0'}}>{CONDITIONS.filter(c=>!condSearch||c.toLowerCase().includes(condSearch.toLowerCase())).map(cond=>{const cur=condPicker.entityType==='player'?(players.find(p=>p.id===condPicker.entityId)?.conditions||[]):(npcs.find(n=>n.id===condPicker.entityId)?.conditions||[]);const active=cur.includes(cond);const color=condColor(cond);return(<button key={cond} onClick={()=>{if(condPicker.entityType==='player')togglePlayerCondition(condPicker.entityId,cond);else toggleNpcCondition(condPicker.entityId,cond);}} style={{display:'flex',alignItems:'center',gap:7,width:'100%',textAlign:'left',border:'none',background:active?'rgba(184,137,42,0.1)':'transparent',padding:'5px 10px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:10,color:active?'#e8c040':'rgba(200,180,130,0.6)'}}><div style={{width:7,height:7,borderRadius:'50%',background:active?color:'rgba(184,137,42,0.2)',border:`1px solid ${color}55`,flexShrink:0}}/>{cond}{active&&<span style={{marginLeft:'auto',fontSize:9,color,opacity:0.7}}>✓</span>}</button>);})}</div><button onClick={()=>{setCondPicker(null);setCondSearch('');}} style={{width:'100%',background:'rgba(255,255,255,0.04)',border:'none',borderTop:'1px solid rgba(184,137,42,0.1)',color:'rgba(200,180,130,0.4)',padding:'5px',cursor:'pointer',fontSize:10}}>Close</button></div>)}
      {condPicker&&<div style={{position:'fixed',inset:0,zIndex:999998}} onClick={()=>{setCondPicker(null);setCondSearch('');}}/>}

     {selectedNpc&&selectedCity&&(
        <div style={S.drawer}>
          <div style={S.drawerTitle}>
            {editingName ? (
              <div style={{display:'flex',alignItems:'center',gap:6,flex:1}}>
                <input autoFocus value={nameDraft} onChange={e=>setNameDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')setConfirmingName(true);if(e.key==='Escape'){setEditingName(false);}}}
                  style={{flex:1,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(184,137,42,0.4)',borderRadius:4,color:'#e8d0a0',padding:'4px 8px',fontFamily:"'Cinzel',serif",fontSize:13,outline:'none'}}/>
                <button onClick={()=>setConfirmingName(true)} disabled={!nameDraft.trim()} style={{background:'rgba(96,200,150,0.15)',border:'1px solid rgba(96,200,150,0.4)',borderRadius:4,padding:'4px 8px',cursor:nameDraft.trim()?'pointer':'default',color:'#60c896',fontSize:10}}>✓</button>
                <button onClick={()=>setEditingName(false)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.15)',borderRadius:4,padding:'4px 8px',cursor:'pointer',color:'rgba(200,180,130,0.5)',fontSize:10}}>✕</button>
              </div>
            ) : (
              <span style={{display:'flex',alignItems:'center',gap:8}}>
                {selectedNpc.name}
                <button onClick={()=>{setNameDraft(selectedNpc.name);setEditingName(true);}} title="Edit name" style={{background:'transparent',border:'none',cursor:'pointer',color:'rgba(184,137,42,0.6)',fontSize:11,padding:0}}>✎</button>
              </span>
            )}
            <button style={S.closeBtn} onClick={()=>{setSelected(null);setEditingName(false);}}>✕</button>
          </div>

          <div style={{ marginBottom: 12 }}>
            <PortraitUpload
              currentUrl={selectedNpc.portrait_url}
              onUploaded={(url) => updateNpcField(selectedNpc.id, 'portrait_url', url)}
            />
          </div>

          {confirmingName && (
            <div onClick={()=>setConfirmingName(false)} style={{position:'fixed',inset:0,zIndex:999999,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div onClick={e=>e.stopPropagation()} style={{background:'#0e0c09',border:'1px solid rgba(184,137,42,0.4)',borderRadius:10,padding:'22px 26px',maxWidth:340,boxShadow:'0 20px 60px rgba(0,0,0,0.7)'}}>
                <div style={{fontFamily:"'Cinzel',serif",fontSize:12,color:'#e8c040',marginBottom:8}}>Confirm Name Change</div>
                <div style={{fontSize:11,color:'rgba(200,180,130,0.6)',fontFamily:'Georgia,serif',fontStyle:'italic',marginBottom:18,lineHeight:1.5}}>
                  Rename "{selectedNpc.name}" to "{nameDraft.trim()}"? This updates the permanent record in archives — the offical census and source of truth for who exists in this world.
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={async()=>{await updateNpcField(selectedNpc.id,'name',nameDraft.trim());setEditingName(false);setConfirmingName(false);}}
                    style={{flex:1,background:'rgba(96,200,150,0.15)',border:'1px solid rgba(96,200,150,0.45)',borderRadius:6,padding:'9px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:10,color:'#60c896',fontWeight:700}}>✓ Confirm</button>
                  <button onClick={()=>setConfirmingName(false)} style={{background:'transparent',border:'1px solid rgba(255,255,255,0.15)',borderRadius:6,padding:'9px 14px',cursor:'pointer',fontFamily:"'Cinzel',serif",fontSize:10,color:'rgba(200,180,130,0.5)'}}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          {[['vitals','Vitals','#e05a5a'],['stamina','Stamina','#e08a5a'],['resolve','Resolve','#79f5a7']].map(([key,label,color])=>{
            const cur=selectedNpc[`${key}_current`]??16;const max=selectedNpc[`${key}_max`]??16;
            return(<div key={key} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}><div style={{fontFamily:"'Cinzel',serif",fontSize:9,color,letterSpacing:'0.1em'}}>{label}</div><div style={{display:'flex',alignItems:'center',gap:4}}><button onClick={()=>updateNpcField(selectedNpc.id,`${key}_current`,Math.max(0,cur-1))} style={{width:18,height:18,borderRadius:3,background:'rgba(224,90,90,0.15)',border:'1px solid rgba(224,90,90,0.4)',color:'#e05a5a',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>−</button><span style={{fontFamily:"'Cinzel',serif",fontSize:12,color,fontWeight:700,minWidth:24,textAlign:'center'}}>{cur}</span><span style={{color:'rgba(200,180,130,0.3)',fontSize:10}}>/</span><span style={{fontFamily:"'Cinzel',serif",fontSize:10,color:'rgba(200,180,130,0.5)'}}>{max}</span><button onClick={()=>updateNpcField(selectedNpc.id,`${key}_current`,Math.min(max,cur+1))} style={{width:18,height:18,borderRadius:3,background:'rgba(121,245,167,0.1)',border:'1px solid rgba(121,245,167,0.35)',color:'#79f5a7',cursor:'pointer',fontSize:12,display:'flex',alignItems:'center',justifyContent:'center'}}>+</button></div></div><div style={{height:3,background:`${color}22`,borderRadius:2,overflow:'hidden'}}><div style={{height:'100%',width:`${Math.max(0,Math.min(100,(cur/Math.max(1,max))*100))}%`,background:color,borderRadius:2,transition:'width 0.2s'}}/></div></div>);
          })}
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <div style={{...S.field,flex:2}}><label style={S.label}>Role / Title</label><input style={S.fieldInput} value={selectedNpc.role||''} onChange={e=>updateNpcField(selectedNpc.id,'role',e.target.value)}/></div>
           <div style={{...S.field,flex:1}}><label style={S.label}>Status</label><select style={S.fieldSelect} value={selectedNpc.status||'Active'} onChange={async e=>{
              const newStatus = e.target.value;
              await updateNpcField(selectedNpc.id,'status',newStatus);
              if (newStatus === 'Deceased') {
                const { data: invItems } = await supabase.from('npc_inventory').select('*').eq('npc_id', selectedNpc.id);
                if (invItems?.length > 0) {
                  const { data: box } = await supabase.from('lootboxes').insert({
                    name: `${selectedNpc.name}'s Remains`,
                    campaign_id: campaignId || null,
                    revealed: false, claimed: false,
                  }).select().single();
                  if (box) {
                    await supabase.from('lootbox_items').insert(invItems.map(i => ({
                      lootbox_id: box.id,
                      item_name: i.item_name,
                      item_category: i.item_category || 'Misc',
                      item_desc: '',
                      qty: 1,
                    })));
                    await supabase.from('dm_memory').insert({
                      campaign_id: String(campaignId), category: 'lore',
                      content: `[DEATH LOOT] ${selectedNpc.name} has fallen. Their belongings (${invItems.length} item${invItems.length !== 1 ? 's' : ''}) are staged in Solomon as "${selectedNpc.name}'s Remains". Do not stack with existing active lootboxes.`,
                    });
                  }
                }
              }
            }}>{STATUS_OPTIONS.map(s=><option key={s} value={s} style={{background:'#0e0c09'}}>{s}</option>)}</select></div>
          </div>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <div style={{...S.field,flex:1}}><label style={S.label}>Race</label><select style={S.fieldSelect} value={selectedNpc.race||''} onChange={e=>{updateNpcField(selectedNpc.id,'race',e.target.value);updateNpcField(selectedNpc.id,'race_variant','');}}><option value="" style={{background:'#0e0c09'}}>—</option>{Object.keys(RACE_OPTIONS).map(r=><option key={r} value={r} style={{background:'#0e0c09'}}>{r}</option>)}</select></div>
            {RACE_OPTIONS[selectedNpc.race]?.length > 0 && (
              <div style={{...S.field,flex:1}}><label style={S.label}>Variant</label><select style={S.fieldSelect} value={selectedNpc.race_variant||''} onChange={e=>updateNpcField(selectedNpc.id,'race_variant',e.target.value)}><option value="" style={{background:'#0e0c09'}}>—</option>{RACE_OPTIONS[selectedNpc.race].map(v=><option key={v} value={v} style={{background:'#0e0c09'}}>{v}</option>)}</select></div>
            )}
            <div style={{...S.field,flex:1}}><label style={S.label}>Class</label><select style={S.fieldSelect} value={selectedNpc.cid||''} onChange={e=>updateNpcField(selectedNpc.id,'cid',e.target.value)}><option value="" style={{background:'#0e0c09'}}>—</option>{ALL_CLASSES?.map(c=><option key={c.id} value={c.id} style={{background:'#0e0c09'}}>{c.name}</option>)}</select></div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <div style={{...S.field,flex:1}}><label style={S.label}>Category</label><select style={S.fieldSelect} value={selectedNpc.category||'Uncategorized'} onChange={e=>updateNpcField(selectedNpc.id,'category',e.target.value)}>{CATEGORY_OPTIONS.map(c=><option key={c} value={c} style={{background:'#0e0c09'}}>{c}</option>)}</select></div>
            <div style={{...S.field,flex:1}}><label style={S.label}>Group</label><input style={S.fieldInput} value={selectedNpc.group_name||''} onChange={e=>updateNpcField(selectedNpc.id,'group_name',e.target.value)} placeholder="Group name…"/></div>
          </div>
          <div style={S.field}><label style={S.label}>Faction</label><select style={S.fieldSelect} value={selectedNpc.faction||''} onChange={e=>updateNpcField(selectedNpc.id,'faction',e.target.value)}><option value="" style={{background:'#0e0c09'}}>— Select faction —</option>{FACTIONS.map(f=><option key={f} value={f} style={{background:'#0e0c09'}}>{f}</option>)}</select></div>
          <div style={S.field}><label style={S.label}>Notes</label><textarea style={S.fieldTextarea} value={selectedNpc.notes||''} onChange={e=>updateNpcField(selectedNpc.id,'notes',e.target.value)} placeholder="DM notes, relationships, plot hooks…"/></div>
          {selectedNpc.abilities?.length>0&&(<div style={S.field}><label style={S.label}>Abilities</label><div style={{display:'flex',flexWrap:'wrap',gap:4}}>{selectedNpc.abilities.map((ab,i)=><div key={i} style={{background:'rgba(184,137,42,0.1)',border:'1px solid rgba(184,137,42,0.3)',borderRadius:4,padding:'2px 8px',fontFamily:'Georgia,serif',fontSize:10,color:'#c8b890'}}>{ab.ability}</div>)}</div></div>)}
          <div style={S.field}><label style={S.label}>Conditions</label><div style={{display:'flex',flexWrap:'wrap',gap:3}}>{(selectedNpc.conditions||[]).map(c=>(<div key={c} onClick={()=>toggleNpcCondition(selectedNpc.id,c)} style={{display:'inline-flex',alignItems:'center',gap:3,background:`${condColor(c)}18`,border:`1px solid ${condColor(c)}55`,borderRadius:20,padding:'2px 7px',fontFamily:"'Cinzel',serif",fontSize:9,color:condColor(c),cursor:'pointer'}}><div style={{width:5,height:5,borderRadius:'50%',background:condColor(c)}}/>{c} <span style={{opacity:0.6,marginLeft:2}}>✕</span></div>))}<button onClick={e=>setCondPicker({entityId:selectedNpc.id,entityType:'npc',anchorRect:e.currentTarget.getBoundingClientRect()})} style={{display:'inline-flex',alignItems:'center',background:'rgba(184,137,42,0.08)',border:'1px solid rgba(184,137,42,0.25)',borderRadius:20,padding:'2px 7px',fontFamily:"'Cinzel',serif",fontSize:9,color:'#e8c040',cursor:'pointer'}}>+ Add</button></div></div>
          <div style={{marginTop:8}}>
            <button onClick={async () => {
              const nodeRows = (selectedNpc.abilities||[]).map(a => a.node?.split('|')[0]).filter(Boolean);
              const cats = [...new Set(nodeRows.flatMap(r => (LOOT_WEIGHTS[r]||'').split(',')).filter(Boolean))];
              if (!cats.length) {
                const role = (selectedNpc.role||'').toLowerCase();
                if (role.match(/fisher|farmer|laborer|peasant|servant|innkeep|tavern/)) cats.push('Consumables','Gear');
                else if (role.match(/guard|soldier|militia|knight|warrior/)) cats.push('Weapons','Armor');
                else if (role.match(/merchant|trader|vendor/)) cats.push('Consumables','Accessories','Gear');
                else if (role.match(/mage|wizard|scholar|scribe/)) cats.push('Magic Items','Spellcasting Items');
                else if (role.match(/thief|rogue|assassin/)) cats.push('Weapons','Accessories');
                else cats.push('Consumables','Gear');
              }
              const rarityFilter = nodeRows.length === 0 ? ['Common','Uncommon'] : ['Common','Uncommon','Rare'];
              const items = [];
              for (const cat of cats.slice(0,3)) {
                const {data} = await supabase.from('items').select('id,name,category,description,rarity').eq('category',cat.trim()).in('rarity', rarityFilter).limit(100);
                if (data?.length) items.push(...data.sort(()=>Math.random()-0.5).slice(0,Math.floor(Math.random()*2)+1));
              }
              const {data:bonus} = await supabase.from('items').select('id,name,category,description,rarity').in('rarity',['Common']).limit(200);
              if (bonus) items.push(...bonus.sort(()=>Math.random()-0.5).slice(0,1));
              if (!items.length) return;
              await supabase.from('npc_inventory').delete().eq('npc_id', selectedNpc.id);
              await supabase.from('npc_inventory').insert(items.map(i => ({
                npc_id: String(selectedNpc.id),
                item_name: i.name,
                item_category: i.category,
              })));
              await updateNpcField(selectedNpc.id,'loot_generated',true);
            }} style={{...S.genBtn,marginBottom:4}}>⚄ {selectedNpc.loot_generated ? 'Regenerate Loot' : 'Generate Loot'}</button>
          </div>
         {selectedNpc.loot_generated&&<div style={{marginTop:2,padding:'6px 10px',background:'rgba(184,137,42,0.06)',border:'1px solid rgba(184,137,42,0.2)',borderRadius:5,fontSize:10,color:'rgba(200,180,130,0.5)',fontFamily:"'Cinzel',serif"}}>⬡ Inventory generated — passes to Solomon on death</div>}
          <div style={{display:'flex',gap:6,alignItems:'center',marginTop:8}}>
            <div style={{fontSize:10,color:'rgba(200,180,130,0.25)',fontStyle:'italic',flex:1}}>{selectedCity.name}{selectedCity.region?` · ${selectedCity.region}`:''}</div>
            <button onClick={()=>markMet(selectedNpc,selectedCity.name)} style={{background:'rgba(184,137,42,0.15)',border:'1px solid rgba(184,137,42,0.35)',borderRadius:3,color:'#e8c040',cursor:'pointer',padding:'3px 8px',fontSize:10,fontFamily:"'Cinzel',serif"}}>⬡ Met</button>
            <button onClick={()=>window.dispatchEvent(new CustomEvent('hercules:add_npc',{detail:{id:selectedNpc.id,name:selectedNpc.name,role:selectedNpc.role||'',conditions:selectedNpc.conditions||[],cityName:selectedCity.name}}))} style={{background:'rgba(60,120,200,0.15)',border:'1px solid rgba(60,120,200,0.35)',borderRadius:3,color:'#80a0e0',cursor:'pointer',padding:'3px 8px',fontSize:10,fontFamily:"'Cinzel',serif"}}>⚔ Combat</button>
            <button onClick={()=>window.dispatchEvent(new CustomEvent('vtt:add_npc_token',{detail:{id:selectedNpc.id,name:selectedNpc.name}}))} style={{background:'rgba(96,200,150,0.15)',border:'1px solid rgba(96,200,150,0.35)',borderRadius:3,color:'#60c896',cursor:'pointer',padding:'3px 8px',fontSize:10,fontFamily:"'Cinzel',serif"}}>⛶ Map</button>
          </div>
        </div>
      )}
    </div>
  );
}
