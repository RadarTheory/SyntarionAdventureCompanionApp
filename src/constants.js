// ═════════════════════════════════════════════════════════════════════════════
// SYNTARION CONSTANTS
// Single source of truth for all lore data.
// Import what you need in each step file.
// ═════════════════════════════════════════════════════════════════════════════

// ─── COLOR SYSTEM ─────────────────────────────────────────────────────────────
export const COLORS = {
  // App backgrounds
  landing:    '#f0eeeb',
  wizard:     '#1a1510',
  surface:    '#231d17',
  card:       '#2c2419',
  border:     'rgba(240,238,235,0.08)',
  borderMid:  'rgba(240,238,235,0.15)',

  // Paths
  magic:      '#22c55e',   // green
  magicDim:   '#16a34a',
  magicBg:    'rgba(34,197,94,0.10)',
  magicText:  '#86efac',

  tech:       '#3b82f6',   // blue
  techDim:    '#2563eb',
  techBg:     'rgba(59,130,246,0.10)',
  techText:   '#93c5fd',

  // Belief
  deity:      '#a855f7',   // purple
  deityDim:   '#7c3aed',
  deityBg:    'rgba(168,85,247,0.10)',
  deityText:  '#d8b4fe',

  spirit:     '#f97316',   // orange
  spiritDim:  '#ea580c',
  spiritBg:   'rgba(249,115,22,0.10)',
  spiritText: '#fdba74',

  unaffiliated:    '#6b7280',
  unaffiliatedBg:  'rgba(107,114,128,0.10)',
  unaffiliatedText:'#d1d5db',

  // Text
  text:       '#f0eeeb',
  textSub:    '#c4b09a',
  muted:      '#7a6a58',
  dim:        '#4a3d30',

  // Utility
  warn:       '#ef4444',
  warnBg:     'rgba(239,68,68,0.10)',
};

// ─── CAMPAIGNS ────────────────────────────────────────────────────────────────
export const CAMPAIGNS = [
  { id: 'I',   name: 'Campaign I',   subtitle: 'Veinrunner'           },
  { id: 'II',  name: 'Campaign II',  subtitle: 'The Keys of Aerithos' },
  { id: 'III', name: 'Campaign III', subtitle: 'Prints from Gamdon'   },
  { id: 'IV',  name: 'Campaign IV',  subtitle: 'Veyline'              },
];

// ─── RACES ────────────────────────────────────────────────────────────────────
// lean: negative = magic, positive = tech, 0 = neutral
// Tel'ari variants: Wood, Dark, Eladrin ONLY (Sea and Half removed)
// Chronison variants: Defensive, Corrupted/Rogue, Specialist ONLY
export const RACES = [
  {
    id: 'addamar', name: 'Addamar', sub: 'Human', tag: 'any', lean: 0,
    sub2: 'Veridoran · Brunar · Matekwan',
    variants: ['Veridoran','Brunar','Matekwan','Vàld','Pontunean','Sunoàca',"Jiro'Ќi",'Varid','Tachechana','Eryatav','Rajava','Ahnkir'],
    ns: 'addamar',
    desc: "The most adaptable people in Soteria. Addamar societies span merchant cities, spirit-forests, and desert trade routes. Their strength is not in any one direction — it is in the refusal to be defined by one.",
  },
  {
    id: 'durinak', name: 'Durinak', sub: 'Dwarf', tag: 'tech', lean: 2,
    sub2: 'Grimrock · Yewhammer · Graniteheart',
    variants: ['Hill','Mountain','Crag'],
    ns: 'durinak',
    desc: "Forged in deep halls and foundry-light. Their culture prizes endurance, craft, and consequence. The Veinrunner passes through their mountain territories — a relationship that is complicated and unresolved.",
  },
  {
    id: 'telari', name: "Tel'ari", sub: 'Elf', tag: 'magic', lean: -2,
    sub2: 'Wood · Dark · Eladrin',
    variants: ['Wood','Dark','Eladrin'],
    ns: 'telari',
    desc: "Ancient. Long-memoried. The Tel'ari carry their history in their bones and their songs in languages that predate the current era. Some have adapted to the age of steam; others have not forgiven it.",
  },
  {
    id: 'othrod', name: 'Othrod', sub: 'Orc', tag: 'any', lean: 1,
    sub2: "Kul'kal · Grothmogg · Telrok · Jotunnar",
    variants: ["Kul'kal Rakhar",'Grothmogg','Telrok','Jotunnar'],
    ns: 'othrod',
    desc: "The Othrod clans have survived everything Soteria has thrown at them through force of will and refusal to yield. Several clans have integrated with the Veinrunner era. Several have not.",
  },
  {
    id: 'terraxian', name: 'Terraxian', sub: 'Nephilim', tag: 'tech', lean: 1,
    sub2: 'Large · Stone-skinned',
    variants: [],
    ns: 'goliath',
    desc: "Stone-skinned and mountain-born. Those who descend to the lowlands tend to arrive with either a purpose or a problem — sometimes just curiosity about smoke.",
  },
  {
    id: 'fynlor', name: 'Fynlor', sub: 'Halfling', tag: 'any', lean: 0,
    sub2: 'Lightfoot · Stout',
    variants: ['Lightfoot','Stout'],
    ns: 'fynlor',
    desc: "Small, quick, and socially gifted in ways that larger folk consistently underestimate. The Fynlor have a talent for arriving at the right moment and leaving before the wrong one.",
  },
  {
    id: 'trink', name: 'Trink', sub: 'Gnome', tag: 'tech', lean: 2,
    sub2: 'Small · Arcane logic',
    variants: [],
    ns: 'gnome',
    desc: "Curious to a fault and mechanically gifted. The Trink built half the systems that run Ashendell's lower districts and have filed patents on the other half.",
  },
  {
    id: 'pamorph', name: "Pa'morph", sub: 'Beast-folk', tag: 'any', lean: 0,
    sub2: 'Choose bloodline below',
    variants: [],
    isPamorph: true,
    ns: 'pamorph',
    desc: "Shape-touched and bloodline-defined, the Pa'morph exist across every corner of Soteria. Their culture varies as widely as their forms — from pack-law territories to city guilds to wilderness enclaves that appear on no official map.",
  },
  {
    id: 'fae', name: 'Fae', sub: "Lyri'al", tag: 'magic', lean: -2,
    sub2: 'Arcani potential · Soul-sight',
    variants: [],
    ns: 'fae',
    desc: "Fae exist at the intersection of the material and the resonant. They perceive things that others cannot and are occasionally perceived by things that others cannot see.",
  },
  {
    id: 'djinn', name: 'Djinn', sub: 'Genie', tag: 'magic', lean: -1,
    sub2: 'Efreet · Marid · Djinni · Dao',
    variants: ['Efreet — Wish','Marid — Hex','Djinni — Heal','Dao — Luck'],
    ns: 'genasi',
    desc: "Born of elemental convergence, the Djinn carry their element's nature in their blood. Each bloodline channels a different force: the Efreet bend reality through desire, the Marid wield affliction and spite, the Djinni restore and preserve, and the Dao tip the scales of fortune.",
  },
  {
    id: 'helianth', name: 'Helianth', sub: 'Tiefling', tag: 'magic', lean: -1,
    sub2: 'Infernal ancestry',
    variants: [],
    ns: 'tiefling',
    desc: "Infernal blood runs cool in the Helianth — not hot. They are not defined by their ancestry unless they choose to be, and most of them are tired of being defined by it.",
  },
  {
    id: 'seraphan', name: 'Seraphan', sub: 'Aasimar', tag: 'magic', lean: -1,
    sub2: 'Celestial blood',
    variants: [],
    ns: 'seraphan',
    desc: "Celestial-blooded and occasionally burdened by it. The Seraphan carry a presence that others read before the Seraphan has spoken.",
  },
  {
    id: 'drakazir', name: 'Drakazir', sub: 'Dragonborn', tag: 'any', lean: 0,
    sub2: '10 color lineages',
    variants: ['Black','Blue','Brass','Bronze','Copper','Gold','Green','Red','Silver','White'],
    ns: 'drakazir',
    desc: "Lineage-proud and breath-gifted. The ten lineages have different cultural relationships to the age of steam, but all of them remember when the world was hotter.",
  },
  {
    id: 'nazari', name: 'Nazari', sub: 'Sea-folk', tag: 'tech', lean: 1,
    sub2: 'Aquatic · Superior darkvision',
    variants: [],
    ns: 'nazari',
    desc: "Deep-water people who surface with purpose. Every Nazari on land is there by deliberate choice — the Sylvan Lung they invented to breathe surface air is proof of that.",
  },
  {
    id: 'chronison', name: 'Chronison', sub: 'Construct', tag: 'tech', lean: 2,
    sub2: 'Defensive · Corrupted/Rogue · Specialist',
    variants: ['Defensive','Corrupted/Rogue','Specialist'],
    ns: 'chronison',
    desc: "Built, not born. Sentience arrived uninvited in most cases, and has since made itself at home.",
  },
];

// ─── PA'MORPH BLOODLINES ──────────────────────────────────────────────────────
export const PM_MAJ = [
  { id:'aaravok',    name:'Aaravok',     sub:'Eagle'              },
  { id:'kraark',     name:"Kra'ark",     sub:'Crow'               },
  { id:'cathvari',   name:"Cath'vari",   sub:'Feline'             },
  { id:'karazelith', name:"Kara'zelith", sub:'Feline (Elseworld)' },
  { id:'lioreth',    name:'Lioreth',     sub:'Lion'               },
  { id:'taeranari',  name:"Taer'anari",  sub:'Canine'             },
  { id:'maernethim', name:'Maernethim',  sub:'Lizard'             },
  { id:'bovorin',    name:'Bovorin',     sub:'Minotaur'           },
  { id:'brawnath',   name:'Brawnath',    sub:'Hippo'              },
  { id:'gajaroi',    name:'Gajaroi',     sub:'Elephant'           },
  { id:'kodan',      name:'Ködan',       sub:'Bear'               },
  { id:'krokodon',   name:'Krokodon',    sub:'Crocodile'          },
  { id:'rhainar',    name:"Rhae'inar",   sub:'Rhino'              },
  { id:'satyr',      name:'Satyr',       sub:'Goat/Faun'          },
  { id:'hoshiari',   name:'Hoshiari',    sub:'Fox'                },
];

export const PM_MIN = [
  { id:'arbor',    name:'Arbor',     sub:'Boar'       },
  { id:'avali',    name:'Avali',     sub:'Songbird'   },
  { id:'bjoral',   name:'Bjoral',    sub:'Badger'     },
  { id:'harelin',  name:'Harelin',   sub:'Hare'       },
  { id:'dervir',   name:"Dervi'r",   sub:'Elk'        },
  { id:'fenrik',   name:'Fenrik',    sub:'Hyena'      },
  { id:'hylori',   name:'Hylori',    sub:'Frog/Gecko' },
  { id:'krogharu', name:'Kroghari',  sub:'Monkey'     },
  { id:'murinor',  name:'Murinor',   sub:'Mouse'      },
  { id:'oryzd',    name:'Oryzd',     sub:'Rat'        },
  { id:'testudon', name:'Testudon',  sub:'Tortoise'   },
  { id:'orylin',   name:'Orylin',    sub:'Owl'        },
  { id:'ssazaral', name:'Ssazaral',  sub:'Snake'      },
  { id:'lutrav',   name:"Lutra'v",   sub:'Otter'      },
  { id:'musteiah', name:'Musteiah',  sub:'Weasel'     },
];

// ─── GODS ─────────────────────────────────────────────────────────────────────
export const GODS = [
  { label: 'Soterian', list: [
    { name:"Ba'elnim", domain:'Light & Wisdom',    affil:"Sovereign Kingdom / Ba'elnari",   desc:"God of light, wisdom, and divine truth. Those marked by Ba'elnim see through deception and carry an inner glow into the darkest places.", moralityNudge: 2  },
    { name:"Fi'harta", domain:'Wisdom & Sight',    affil:"Elven / Quynthe'ra",              desc:"The elven goddess of wisdom and foresight. Fi'harta rewards careful thought and long memory, granting her chosen insight before a crisis arrives.", moralityNudge: 1 },
    { name:'Iło',      domain:'Nature & Growth',   affil:"Verdelie're / Sanctum Tree",      desc:"A god of living things and the Sanctum Tree, Ilo is the breath behind the forest. Those who serve Ilo walk in harmony with the natural cycle.", moralityNudge: 1 },
    { name:'Ruehnar',  domain:'Love & Devotion',   affil:'Veridoran / Aldermore',           desc:"Goddess of love, devotion, and chosen bonds. Her blessing is less a gift of power than a shield: her faithful rarely walk alone for long.", moralityNudge: 1 },
    { name:'Ylandar',  domain:'Truth & Justice',   affil:'Ylandarian Order',                desc:"God of truth, justice, and the law of consequence. Clerics of Ylandar cannot knowingly speak a lie. His blessing is a burden as much as a gift.", moralityNudge: 2 },
    { name:'Firreth',  domain:'Ambition & Fire',   affil:'Soterian — Evil',                 desc:"A god of cold ambition and consuming flame. Those who serve him rise fast, but burn others on the way up.", moralityNudge: -2 },
    { name:'Duneyrr',  domain:'Deception & Shadow',affil:'Soterian — Evil',                 desc:"The god of comfortable lies and careful shadows. His faithful are skilled architects of false faces.", moralityNudge: -2 },
    { name:'Khoneus',  domain:'Shadow & Secrets',  affil:'Soterian — Evil / Embrelyn',      desc:"God of secrets, shadow, and calculated darkness. His faithful include blood hunters and inquisitors of gray morality.", moralityNudge: -1 },
    { name:'Baeshra',  domain:'The Hunt & Nature', affil:"Soterian — Neutral / Pa'morph",   desc:"God of the hunt, the cycle of predator and prey, and natural law. He demands only that the hunt be honest.", moralityNudge: 0 },
    { name:'Daretror', domain:'Chance & Balance',  affil:'Soterian — Neutral',              desc:"God of chance, balance, and the unpredictable turn. His shrines appear where luck changed.", moralityNudge: 0 },
    { name:'Hreidmar', domain:'Stone & Patience',  affil:'Dwarven — Neutral',               desc:"A dwarven deity of stone, endurance, and deep patience. His faithful do not rush, and they remember everything.", moralityNudge: 0 },
    { name:'Shevar',   domain:'Gold & Fortune',    affil:'Gnome / Trink / Auric Order',     desc:"The gnome god of gold, wealth, and fortune. He blesses those who are clever, not those who are simply lucky.", moralityNudge: 0 },
  ]},
  { label: 'Primordials', list: [
    { name:'Elgar',  domain:'Free Will', affil:'Altum (Heaven)',  desc:"The High God of Free Will. His seal makes his faithful impossible to compel or dominate.", moralityNudge: 2 },
    { name:'Zathon', domain:'Fate',      affil:'Stygia (Hell)',   desc:"The Abyssal God of Fate. Zathon does not create fate — he enforces it.", moralityNudge: -1 },
  ]},
  { label: 'Celestials', list: [
    { name:'Rota', domain:'The Cycle',    affil:'Celestial',              desc:"A celestial spirit of the great cosmic cycle — birth, death, and return. Her chosen tend to survive things they should not.", moralityNudge: 1 },
    { name:'Atu',  domain:'Ancient Will', affil:'Testudon God / Celestial',desc:"The ancient god of the Testudon people. He is said to carry entire civilizations on his back.", moralityNudge: 1 },
  ]},
];

// ─── SPIRITS ──────────────────────────────────────────────────────────────────
export const SPIRITS = [
  { label: 'Soteria elemental', list: [
    { name:'Ínanhn / Brek',   domain:'Fire — Passion, Destruction, Rebirth',      affil:'Soterian Elemental', desc:"Ínanhn is the consuming flame; Brek is the ash that follows. Together they govern fire in all its forms.", moralityNudge: 0 },
    { name:'Enkì / Gourn',    domain:'Earth — Strength, Stability, Growth',        affil:'Soterian Elemental', desc:"Enkì is the deep bedrock; Gourn is the slow accumulation of soil above it. Together they govern earth.", moralityNudge: 1 },
    { name:'Lusunzi / Akapa', domain:'Water — Healing, Fluidity, Adaptation',      affil:'Soterian Elemental', desc:"Lusunzi is the moving current; Akapa is the still pool that reflects. Together they govern water.", moralityNudge: 1 },
    { name:'Aehalus / Sil',   domain:'Air — Freedom, Inspiration, Change',         affil:'Soterian Elemental', desc:"Aehalus is the open wind; Sil is the breath held just before the leap. Together they govern air.", moralityNudge: 0 },
  ]},
  { label: 'Simic elemental', list: [
    { name:'Din / Rin',      domain:'Aether — Mystery, Connection, Eternity',              affil:'Simic Elemental',           desc:"Din is the resonant hum that underlies all things; Rin is the silence between, where meaning lives.", moralityNudge: 0 },
    { name:'Reynu / Ifu',    domain:'Lunar Energy — Serenity, Reflection, Illumination',   affil:'Simic Elemental / The Line', desc:"Reynu is the cool light that falls on still water; Ifu is the shadow on the other side of it.", moralityNudge: 1 },
    { name:'Sevax / Parthen',domain:'Solar Energy — Vitality, Warmth, Radiance',           affil:'Simic Elemental',           desc:"Sevax is the living warmth of the sun at its height; Parthen is the long light of the afternoon.", moralityNudge: 1 },
    { name:'Ix / Hade',      domain:'Void — Emptiness, Nihilism',                          affil:'Simic Elemental',           desc:"Ix is the space where something was removed; Hade is the indifference that filled it.", moralityNudge: -2 },
  ]},
  { label: 'Lorük elemental', list: [
    { name:'Amala / Zayvull',domain:'Arc — Innovation, Energy, Magic',              affil:'Lorük Elemental', desc:"Amala is the spark of the new idea; Zayvull is the current that carries it into form.", moralityNudge: 0 },
    { name:'Vang / Lig',     domain:'Gravity — Attraction, Balance, Force',         affil:'Lorük Elemental', desc:"Vang is the pull; Lig is the equilibrium that pull produces.", moralityNudge: 0 },
    { name:'Dioys / Isild',  domain:'Stasis — Preservation, Constancy, Stillness',  affil:'Lorük Elemental', desc:"Dioys is the moment held; Isild is the structure that makes holding possible.", moralityNudge: 1 },
    { name:'Birn / Irnal',   domain:'Strand — Connection, Fate, Destiny',           affil:'Lorük Elemental', desc:"Birn is the thread laid out ahead; Irnal is the thread behind, already woven.", moralityNudge: 0 },
  ]},
];

// ─── UNAFFILIATED OPTIONS ─────────────────────────────────────────────────────
export const UNAFFILIATED = [
  { id: 'atheistic', label: 'Atheistic', desc: 'Actively rejects the divine.',        moralityNudge: 0  },
  { id: 'agnostic',  label: 'Agnostic',  desc: 'Uncertain. Uncommitted.',              moralityNudge: 0  },
  { id: 'nihilism',  label: 'Nihilism',  desc: 'Nothing holds meaning.',               moralityNudge: -1 },
  { id: 'none',      label: 'None',      desc: 'No designation.',                      moralityNudge: 0  },
];

// ─── CLASSES ──────────────────────────────────────────────────────────────────
export const CLASSES = {
  magic: [
    { id:'inquisitor', name:'Inquisitor', path:'Divine',   disc:'Sanctus', t2:'Paladin / Cleric',    t3:'Iridesce / Augur',       stats:'Wis/Cha', magicTechNudge: -1 },
    { id:'zealot',     name:'Zealot',     path:'Spiritual',disc:'Sacral',  t2:'Shaman / Bokor',      t3:'Caelyn / Cursewright',   stats:'Wis/Con', magicTechNudge: -1, isSacral: true },
    { id:'weaver',     name:'Weaver',     path:'Magic',    disc:'Mana',    t2:'Bard / Castor',       t3:'Maiar / Magus',          stats:'Int/Cha', magicTechNudge: -2 },
    { id:'druid',      name:'Druid',      path:'Nature',   disc:'Essence', t2:'Ovate / Wildheart',   t3:'Dryad / Primalist',      stats:'Wis/Dex', magicTechNudge: -1 },
    { id:'sage',       name:'Sage',       path:'Arcane',   disc:'Gnosis',  t2:'Codexer / Scribe',    t3:'Glyphsage / Runesiph',   stats:'Int',     magicTechNudge: -1 },
    { id:'mystic',     name:'Mystic',     path:'Mythic',   disc:'Shaeid',  t2:'Guardian',            t3:'Arcani',                 stats:'Wis/Cha', magicTechNudge: -2 },
    { id:'magister',   name:'Magister',   path:'Shadow',   disc:'Wraill',  t2:'Hemoclast / Harrow',  t3:'Necromancer / Darkweaver',stats:'Int/Cha', magicTechNudge: -2 },
  ],
  tech: [
    { id:'merchant',   name:'Merchant',   path:'Business', disc:'Gain',      t2:'Emissary / Diplomat', t3:'Tycoon / Negotiator',  stats:'Cha/Int', magicTechNudge: 1  },
    { id:'fighter',    name:'Fighter',    path:'Martial',  disc:'Grit',      t2:'Barbarian / Swashbuckler',t3:'Knight / Marauder', stats:'Str/Con', magicTechNudge: 2  },
    { id:'vanguard',   name:'Vanguard',   path:'Anti-Magic',disc:'Focus',    t2:'Sentinel / Null',     t3:'Whyth / Warden',       stats:'Con/Str', magicTechNudge: 2  },
    { id:'alchemist',  name:'Alchemist',  path:'Alchemic', disc:'Matter',    t2:'Mutagenist / Bombardier',t3:'Biomancer / Saboteur',stats:'Int/Con', magicTechNudge: 1 },
    { id:'scholar',    name:'Scholar',    path:'Academic', disc:'Reason',    t2:'Tactician / Cartographer',t3:'Strategist / Archivist',stats:'Int/Wis',magicTechNudge:1},
    { id:'rogue',      name:'Rogue',      path:'Covert',   disc:'Lithium',   t2:'Inspector / Ranger',  t3:'Detective / Strider',  stats:'Dex/Int', magicTechNudge: 1  },
    { id:'artificer',  name:'Artificer',  path:'Engineering',disc:'Ingenuity',t2:'Gunslinger / Tinkerer',t3:'Thaumaturge / Machinist',stats:'Int/Dex',magicTechNudge:2},
  ],
};

export const ALL_CLASSES = [...CLASSES.magic, ...CLASSES.tech];

// ─── STATS ────────────────────────────────────────────────────────────────────
export const ALL_STATS = [
  { key:'spirit',  label:'Spirit',  equiv:'Charisma',    axis:'magic' },
  { key:'soul',    label:'Soul',    equiv:'Faith',       axis:'magic' },
  { key:'body',    label:'Body',    equiv:'Constitution',axis:'magic' },
  { key:'essence', label:'Essence', equiv:'Wisdom',      axis:'magic' },
  { key:'will',    label:'Will',    equiv:'Strength',    axis:'tech'  },
  { key:'whim',    label:'Whim',    equiv:'Dexterity',   axis:'tech'  },
  { key:'mind',    label:'Mind',    equiv:'Intelligence',axis:'tech'  },
  { key:'dream',   label:'Dream',   equiv:'Intent',      axis:'tech'  },
];

export const DEFAULT_STATS = {
  spirit:8, soul:8, body:8, essence:8,
  will:8,   whim:8, mind:8, dream:8,
};

// ─── BACKSTORY POOLS ──────────────────────────────────────────────────────────
export const BS_ORIGINS = {
  addamar:  [
    "Born in the cobblestone sprawl of Ashendell, where the Veinrunner tracks split the city into those who prospered and those who were forgotten",
    "Raised in the desert trade routes of the Brunar, where every agreement was sealed in blood and hospitality",
    "A child of the Matekwan spirit-forests, where the ancestors speak through the rustling of the maize and the crack of river stone",
  ],
  durinak:  [
    "Forged in the deep halls of Karak Byrn, where every dwarven child is given a hammer before they are given a name",
    "Raised behind the Bronze Doors of Tarek'Mor, where the Graniteheart Clan's silence is its own kind of law",
  ],
  telari:   [
    "Exiled from the hidden city of Quynthe'ra before the rite of adulthood, carrying only a sigil and a half-told reason",
    "Raised among the ancient trees of Elmoire, where Fae blood hums in the bark and time moves at its own pace",
  ],
  othrod:   [
    "Cast out of Razor's Point after a duel that ended the wrong way — or maybe the right way, depending on who is telling it",
    "Raised in the marshes of Kul'Kal Rakhar, where the water is always rising",
  ],
  pamorph:  [
    "Born in the wild reaches of Therienstadt, where the pack law governs everything and mercy is negotiated, not assumed",
    "Raised by a pride in the shadow of the Great Oak Forest, close enough to the Veridoran border to know when the machines were getting louder",
  ],
  default:  [
    "A wanderer without a fixed homeland, carrying a name from one place and a face that belongs to another",
    "Raised on the margins of Soterian society, in the kind of city district that doesn't appear on official maps",
    "Found on the road by a traveling merchant at an age they no longer clearly remember, and raised between ledgers and trade stops",
  ],
};

export const BS_ROLE = {
  magic: [
    "A traveler and keeper of resonant knowledge, moving between cities before the steam could drown out the signal",
    "A wandering practitioner of the old disciplines, carrying methods that predate the Veinrunner by three centuries",
  ],
  tech: [
    "A traveler and Cartographer, mapping routes the official surveys missed or chose to ignore",
    "An engineer who left a comfortable post for reasons they describe differently depending on who is asking",
  ],
  any: [
    "A courier and sometime-mercenary, moving between factions without committing to any of them",
    "A trader of information more than goods, with contacts in places that don't show up on guild registries",
  ],
};

export const BS_PERSONALITY = {
  magic: [
    { text: "Born with a resonant sensitivity — the Lines are louder to them than to most. They hear things before they arrive.", boon: "+1 Spirit", statKey: 'spirit', amount: 1 },
    { text: "Carries an old oath that has never fully resolved. The weight of it is visible if you know what to look for.", boon: "+1 Soul", statKey: 'soul', amount: 1 },
  ],
  tech: [
    { text: "Born with an engineering instinct that borders on compulsion. They fix things that aren't broken just to understand them.", boon: "+1 Mind", statKey: 'mind', amount: 1 },
    { text: "Carries a reputation that arrived before them in every city. The source of it depends on who you ask.", boon: "+1 Will", statKey: 'will', amount: 1 },
  ],
  any: [
    { text: "Born with an extreme personality — people tend to react more strongly toward them, for better or worse.", boon: "+1 Spirit", statKey: 'spirit', amount: 1 },
    { text: "Has a habit of surviving situations that should have ended them. Whether this is luck or design is unclear.", boon: "+1 Body", statKey: 'body', amount: 1 },
  ],
};

// ─── ACTIONS ──────────────────────────────────────────────────────────────────
export const ACTIONS = {
  universal: ['Interact','Search','Analyze','Project','Survey'],
  combat:    ['Strike','Range','Parry','Defend','Use','Rest','Flee','Disrupt','Assist','Maneuver','Brace','Rebound'],
  social:    ['Negotiate','Intimidate','Insight','Deception','Persuade','Influence','Commands','Threaten','Bribe','Reason','Appeal','Taunt'],
  magic:     ['Invoke','Flow','Weave','Inscribe','Harrow','Call','Attune'],
  tech:      ['Broker','Exert','Nullify','Transmute','Tinker','Theorize','Engineer'],
  stealth:   ['Hide','Sneak','Veil','Tail','Sleight','Sabotage','Infiltrate','Assassinate','Disguise','Eavesdrop'],
  defense:   ['Brace','Endure','Counter'],
  alignment: ['Heal','Harm','Kinetic'],
};

// ─── EQUIPMENT SLOTS ──────────────────────────────────────────────────────────
export const APPAREL_SLOTS   = ['Head','Torso','Waist','Hands','Greaves','Boots'];
export const WEAPON_SLOTS    = ['Main Hand','Off-Hand','Side Weapon','Heavy'];
export const ACCESSORY_SLOTS = ['Ring I','Ring II','Neck','Charm','Relic','Artifact'];

// ─── UTILITY ──────────────────────────────────────────────────────────────────
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];

export const POINT_COST = v =>
  v <= 8 ? 0 : v === 9 ? 1 : v === 10 ? 2 : v === 11 ? 3 :
  v === 12 ? 4 : v === 13 ? 5 : v === 14 ? 7 : 9;

export function roll4d6Drop1() {
  const r = [1,2,3,4].map(() => Math.ceil(Math.random() * 6));
  return r.reduce((a, b) => a + b, 0) - Math.min(...r);
}

export function getRaceDisplay(raceId, rv, pmV) {
  const rd = RACES.find(r => r.id === raceId);
  if (!rd) return '—';
  if (raceId === 'pamorph' && pmV) {
    const pm = [...PM_MAJ, ...PM_MIN].find(p => p.id === pmV);
    return pm ? `Pa'morph | ${pm.name}` : rd.name;
  }
  if (rv) return `${rd.name} · ${rv}`;
  return rd.name;
}
