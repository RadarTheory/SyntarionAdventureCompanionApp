import { useState, useEffect } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const CAMPAIGNS = [
  { id:'I',   name:'Campaign I',   subtitle:'Veinrunner' },
  { id:'II',  name:'Campaign II',  subtitle:'The Keys of Aerithos' },
  { id:'III', name:'Campaign III', subtitle:'Prints from Gamdon' },
  { id:'IV',  name:'Campaign IV',  subtitle:'Veyline' },
];
const DEFAULT_CHARS = [
  { id:"dc_neryi",     name:'Neryi Eryindr',             race:"Half-Tel'ari",          cls:'Blood-Huntress',        deity:'Khoneus',  camp:'I'   },
  { id:"dc_klarrec",   name:'Klarrec Hylarakor',          race:"Half-Tel'ari",          cls:'Cleric',                deity:'Ylandar',  camp:'I'   },
  { id:"dc_kolette",   name:'Kolette "Mutt" Daax',        race:"Tel'ari / Durinak",     cls:'Druid',                 deity:"Fi'harta", camp:'I'   },
  { id:"dc_travok",    name:'Travok Iforson',              race:'Drakazir',              cls:'Fighter',               deity:"Ba'elnim", camp:'I'   },
  { id:"dc_astralis",  name:'Astralis Thalassir',          race:'Nazari',                cls:'Artificer',             deity:'None',     camp:'I'   },
  { id:"dc_sinawar",   name:'Sinawar Asiini',              race:"Pa'morph | Maernethim", cls:'Fighter',               deity:'Baeshra',  camp:'I'   },
  { id:"dc_kenzo",     name:'Kenzo Umbacca',               race:"Pa'morph | Lioreth",    cls:'Paladin',               deity:'Shevar',   camp:'II'  },
  { id:"dc_lexity",    name:'Lexity Eyther',               race:"Dark Tel'ari",          cls:'Rogue',                 deity:'None',     camp:'II'  },
  { id:"dc_othorian",  name:"Othorian Astrae'lir",         race:"Tel'ari",               cls:'Ranger / Cartographer', deity:'None',     camp:'II'  },
  { id:"dc_aurum",     name:'Aurum D. Change',             race:"Pa'morph | Hoshiari",   cls:'Mage',                  deity:'Shevar',   camp:'II'  },
  { id:"dc_aphis",     name:'Aphis Celine Deecye',         race:"Pa'morph | Orylin",     cls:'Artificer',             deity:'None',     camp:'II'  },
  { id:"dc_danius",    name:'Danius Rin',                  race:"Eladrin Tel'ari",       cls:'Fighter / Monk',        deity:'None',     camp:'II'  },
  { id:"dc_zendrix",   name:'Zendrix "Ironsong" Grenram',  race:'Durinak',               cls:'Fighter',               deity:'None',     camp:'III' },
  { id:"dc_gorgothon", name:'Gorgothon Grobuk',            race:'Othrod',                cls:'Barbarian',             deity:'None',     camp:'III' },
  { id:"dc_griz",      name:'Griz Lupin',                  race:'Testudon',              cls:'Sorcerer',              deity:'None',     camp:'III' },
  { id:"dc_umfahren",  name:'Umfahren Pachycetma',         race:"Pa'morph | Gajaroi",    cls:'Fighter',               deity:'None',     camp:'III' },
  { id:"dc_haruki",    name:'Haruki Ardentbrin',           race:"Pa'morph | Hoshiari",   cls:'Bard',                  deity:'Mýr',      camp:'III' },
  { id:"dc_killian",   name:'Killian Krowe',               race:"Pa'morph | Kra'ark",    cls:'Rogue / Inquisitor',    deity:'None',     camp:'IV'  },
  { id:"dc_eryn",      name:'Eryn Vaelithar',              race:"Tel'ari",               cls:'Rogue',                 deity:'None',     camp:'IV'  },
  { id:"dc_fib",       name:'Fib Tressere',                race:"Pa'morph | Hoshiari",   cls:'Rogue',                 deity:'None',     camp:'IV'  },
  { id:"dc_flacari",   name:'Flacari Allaistarr',          race:"Half-Tel'ari",          cls:'Bard',                  deity:'Lótjarr',  camp:'IV'  },
  { id:"dc_satyavrat", name:'Satyavrat Singh',             race:'Addamar',               cls:'Paladin',               deity:"Ba'elnim", camp:'IV'  },
  { id:"dc_emirian",   name:'Emirian Valendor',            race:"Tel'ari",               cls:'Artificer',             deity:'Ilo',      camp:'IV'  },
];
const RACES = [
  { id:'addamar',   name:'Addamar',   sub:'Human',      tag:'any',  lean:0,  sub2:'Veridoran · Brunar · Matekwan',           variants:['Veridoran','Brunar','Matekwan','Vàld','Pontunean','Sunoàca',"Jiro'Ќi",'Varid','Tachechana','Eryatav','Rajava','Ahnkir'], ns:'addamar',   desc:"The most adaptable people in Soteria. Addamar societies span merchant cities, spirit-forests, and desert trade routes. Their strength is not in any one direction — it is in the refusal to be defined by one." },
  { id:'durinak',   name:'Durinak',   sub:'Dwarf',      tag:'tech', lean:2,  sub2:'Grimrock · Yewhammer · Graniteheart',     variants:['Hill','Mountain','Crag'], ns:'durinak', desc:"Forged in deep halls and foundry-light. Their culture prizes endurance, craft, and consequence. The Veinrunner passes through their mountain territories — a relationship that is complicated and unresolved." },
  { id:'telari',    name:"Tel'ari",   sub:'Elf',        tag:'magic',lean:-2, sub2:'Wood · Dark · Sea · Eladrin · Half',      variants:['Wood','Dark','Sea','Eladrin','Half'], ns:'telari', desc:"Ancient. Long-memoried. The Tel'ari carry their history in their bones and their songs in languages that predate the current era. Some have adapted to the age of steam; others have not forgiven it." },
  { id:'othrod',    name:'Othrod',    sub:'Orc',        tag:'any',  lean:1,  sub2:"Kul'kal · Grothmogg · Telrok · Jotunnar", variants:["Kul'kal Rakhar",'Grothmogg','Telrok','Jotunnar'], ns:'othrod', desc:"The Othrod clans have survived everything Soteria has thrown at them through force of will and refusal to yield. Several clans have integrated with the Veinrunner era. Several have not." },
  { id:'terraxian', name:'Terraxian', sub:'Nephilim',   tag:'tech', lean:1,  sub2:'Large · Stone-skinned',                   variants:[], ns:'goliath', desc:"Stone-skinned and mountain-born. Those who descend to the lowlands tend to arrive with either a purpose or a problem — sometimes both." },
  { id:'fynlor',    name:'Fynlor',    sub:'Halfling',   tag:'any',  lean:0,  sub2:'Lightfoot · Stout',                       variants:['Lightfoot','Stout'], ns:'fynlor', desc:"Small, quick, and socially gifted in ways that larger folk consistently underestimate. The Fynlor have a talent for arriving at the right moment and leaving before the wrong one." },
  { id:'trink',     name:'Trink',     sub:'Gnome',      tag:'tech', lean:2,  sub2:'Small · Arcane logic',                    variants:[], ns:'gnome', desc:"Curious to a fault and mechanically gifted. The Trink built half the systems that run Ashendell's lower districts and have filed patents on the other half." },
  { id:'pamorph',   name:"Pa'morph",  sub:'Beast-folk', tag:'any',  lean:0,  sub2:'Choose bloodline below',                  variants:[], isPamorph:true, ns:'pamorph', desc:"Shape-touched and bloodline-defined, the Pa'morph exist across every corner of Soteria. Their culture varies as widely as their forms — from pack-law territories to city guilds to wilderness enclaves that appear on no official map." },
  { id:'fae',       name:'Fae',       sub:"Lyri'al",    tag:'magic',lean:-2, sub2:'Arcani potential · Soul-sight',           variants:[], ns:'fae', desc:"Fae exist at the intersection of the material and the resonant. They perceive things that others cannot and are occasionally perceived by things that others cannot see." },
  { id:'djinn',     name:'Djinn',     sub:'Genie',      tag:'magic',lean:-1, sub2:'Efreet · Marid · Djinni · Dao',           variants:['Efreet — Wish','Marid — Hex','Djinni — Heal','Dao — Luck'], ns:'genasi', desc:"Born of elemental convergence, the Djinn carry their element's nature in their blood. Each bloodline channels a different force: the Efreet bend reality through desire, the Marid wield affliction and spite, the Djinni restore and preserve, and the Dao tip the scales of fortune." },
  { id:'helianth',  name:'Helianth',  sub:'Tiefling',   tag:'magic',lean:-1, sub2:'Infernal ancestry',                       variants:[], ns:'tiefling', desc:"Infernal blood runs cool in the Helianth — not hot. They are not defined by their ancestry unless they choose to be, and most of them are tired of being defined by it." },
  { id:'seraphan',  name:'Seraphan',  sub:'Aasimar',    tag:'magic',lean:-1, sub2:'Celestial blood',                         variants:[], ns:'seraphan', desc:"Celestial-blooded and occasionally burdened by it. The Seraphan carry a presence that others read before the Seraphan has spoken." },
  { id:'drakazir',  name:'Drakazir',  sub:'Dragonborn', tag:'any',  lean:0,  sub2:'10 color lineages',                       variants:['Black','Blue','Brass','Bronze','Copper','Gold','Green','Red','Silver','White'], ns:'drakazir', desc:"Lineage-proud and breath-gifted. The ten lineages have different cultural relationships to the age of steam, but all of them remember when the world was hotter." },
  { id:'nazari',    name:'Nazari',    sub:'Sea-folk',   tag:'tech', lean:1,  sub2:'Aquatic · Superior darkvision',           variants:[], ns:'nazari', desc:"Deep-water people who surface with purpose. Every Nazari on land is there by deliberate choice — the Sylvan Lung they invented to breathe surface air is proof of that." },
  { id:'chronison', name:'Chronison', sub:'Construct',  tag:'tech', lean:2,  sub2:'Synthetic · Mechanical being',            variants:['Command/Prototype','Defensive','Combat Unit','Specialist','Unique/Sentient','Experimental','Utility','Corrupted/Rogue'], ns:'chronison', desc:"Built, not born. Sentience arrived uninvited in most cases, and has since made itself at home." },
];
const PM_MAJ=[{id:'aaravok',name:'Aaravok',sub:'Eagle'},{id:'kraark',name:"Kra'ark",sub:'Crow'},{id:'cathvari',name:"Cath'vari",sub:'Feline'},{id:'karazelith',name:"Kara'zelith",sub:'Feline (Elseworld)'},{id:'lioreth',name:'Lioreth',sub:'Lion'},{id:'taeranari',name:"Taer'anari",sub:'Canine'},{id:'maernethim',name:'Maernethim',sub:'Lizard'},{id:'bovorin',name:'Bovorin',sub:'Minotaur'},{id:'brawnath',name:'Brawnath',sub:'Hippo'},{id:'gajaroi',name:'Gajaroi',sub:'Elephant'},{id:'kodan',name:'Ködan',sub:'Bear'},{id:'krokodon',name:'Krokodon',sub:'Crocodile'},{id:'rhainar',name:"Rhae'inar",sub:'Rhino'},{id:'satyr',name:'Satyr',sub:'Goat/Faun'},{id:'hoshiari',name:'Hoshiari',sub:'Fox'}];
const PM_MIN=[{id:'arbor',name:'Arbor',sub:'Boar'},{id:'avali',name:'Avali',sub:'Songbird'},{id:'bjoral',name:'Bjoral',sub:'Badger'},{id:'harelin',name:'Harelin',sub:'Hare'},{id:'dervir',name:"Dervi'r",sub:'Elk'},{id:'fenrik',name:'Fenrik',sub:'Hyena'},{id:'hylori',name:'Hylori',sub:'Frog/Gecko'},{id:'krogharu',name:'Kroghari',sub:'Monkey'},{id:'murinor',name:'Murinor',sub:'Mouse'},{id:'oryzd',name:'Oryzd',sub:'Rat'},{id:'testudon',name:'Testudon',sub:'Tortoise'},{id:'orylin',name:'Orylin',sub:'Owl'},{id:'ssazaral',name:'Ssazaral',sub:'Snake'},{id:'lutrav',name:"Lutra'v",sub:'Otter'},{id:'musteiah',name:'Musteiah',sub:'Weasel'}];
const GODS=[{label:'Soterian',list:[{name:"Ba'elnim",domain:'Light & Wisdom',affil:"Sovereign Kingdom / Ba'elnari",desc:"God of light, wisdom, and divine truth. Those marked by Ba'elnim see through deception and carry an inner glow into the darkest places."},{name:"Fi'harta",domain:'Wisdom & Sight',affil:"Elven / Quynthe'ra",desc:"The elven goddess of wisdom and foresight. Fi'harta rewards careful thought and long memory, granting her chosen insight before a crisis arrives."},{name:'Iło',domain:'Nature & Growth',affil:"Verdelie're / Sanctum Tree",desc:"A god of living things and the Sanctum Tree, Ilo is the breath behind the forest. Those who serve Ilo walk in harmony with the natural cycle and can sense when that cycle is threatened."},{name:'Ruehnar',domain:'Love & Devotion',affil:'Veridoran / Aldermore',desc:"Goddess of love, devotion, and chosen bonds. Her blessing is less a gift of power than a shield: her faithful rarely walk alone for long."},{name:'Ylandar',domain:'Truth & Justice',affil:'Ylandarian Order',desc:"God of truth, justice, and the law of consequence. Clerics of Ylandar cannot knowingly speak a lie. His blessing is a burden as much as a gift."},{name:'Firreth',domain:'Ambition & Fire',affil:'Soterian — Evil',desc:"A god of cold ambition and consuming flame. Those who serve him rise fast, but burn others on the way up."},{name:'Duneyrr',domain:'Deception & Shadow',affil:'Soterian — Evil',desc:"The god of comfortable lies and careful shadows. His faithful are skilled architects of false faces."},{name:'Khoneus',domain:'Shadow & Secrets',affil:'Soterian — Evil / Embrelyn',desc:"God of secrets, shadow, and calculated darkness. His faithful include blood hunters and inquisitors of gray morality."},{name:'Baeshra',domain:'The Hunt & Nature',affil:"Soterian — Neutral / Pa'morph",desc:"God of the hunt, the cycle of predator and prey, and natural law. He demands only that the hunt be honest."},{name:'Daretror',domain:'Chance & Balance',affil:'Soterian — Neutral',desc:"God of chance, balance, and the unpredictable turn. His shrines appear where luck changed."},{name:'Hreidmar',domain:'Stone & Patience',affil:'Dwarven — Neutral',desc:"A dwarven deity of stone, endurance, and deep patience. His faithful do not rush, and they remember everything."},{name:'Shevar',domain:'Gold & Fortune',affil:'Gnome / Trink / Auric Order',desc:"The gnome god of gold, wealth, and fortune. He blesses those who are clever, not those who are simply lucky."}]},{label:'Primordials',list:[{name:'Elgar',domain:'Free Will',affil:'Altum (Heaven)',desc:"The High God of Free Will. His seal makes his faithful impossible to compel or dominate."},{name:'Zathon',domain:'Fate',affil:'Stygia (Hell)',desc:"The Abyssal God of Fate. Zathon does not create fate — he enforces it."}]},{label:'Celestials',list:[{name:'Rota',domain:'The Cycle',affil:'Celestial',desc:"A celestial spirit of the great cosmic cycle — birth, death, and return. Her chosen tend to survive things they should not."},{name:'Atu',domain:'Ancient Will',affil:'Testudon God / Celestial',desc:"The ancient god of the Testudon people. He is said to carry entire civilizations on his back."}]}];
const SPIRITS=[
  {label:'Soteria elemental',list:[
    {name:'Ínanhn / Brek',  domain:'Fire — Passion, Destruction, Rebirth',     affil:'Soterian Elemental', desc:"Ínanhn is the consuming flame; Brek is the ash that follows. Together they govern fire in all its forms — the passion that drives action, the destruction that clears the way, and the rebirth that comes after. Those who commune with them walk close to both ruin and renewal."},
    {name:'Enkì / Gourn',   domain:'Earth — Strength, Stability, Growth',       affil:'Soterian Elemental', desc:"Enkì is the deep bedrock; Gourn is the slow accumulation of soil above it. Together they govern earth — the strength that holds, the stability that endures, and the quiet growth that happens beneath the surface where no one is watching."},
    {name:'Lusunzi / Akapa',domain:'Water — Healing, Fluidity, Adaptation',     affil:'Soterian Elemental', desc:"Lusunzi is the moving current; Akapa is the still pool that reflects. Together they govern water — its healing properties, its refusal to hold one shape, and its capacity to find a way around any obstacle given enough time."},
    {name:'Aehalus / Sil',  domain:'Air — Freedom, Inspiration, Change',        affil:'Soterian Elemental', desc:"Aehalus is the open wind; Sil is the breath held just before the leap. Together they govern air — the freedom of movement, the inspiration that arrives without warning, and the change that comes when nothing is holding still."},
  ]},
  {label:'Simic elemental',list:[
    {name:'Din / Rin',      domain:'Aether — Mystery, Connection, Eternity',    affil:'Simic Elemental',           desc:"Din is the resonant hum that underlies all things; Rin is the silence between, where meaning lives. Together they govern aether — the invisible medium of mystery, the connections that cross distance, and the sense that some things predate and will outlast everything currently visible."},
    {name:'Reynu / Ifu',    domain:'Lunar Energy — Serenity, Reflection, Illumination', affil:'Simic Elemental / The Line', desc:"Reynu is the cool light that falls on still water; Ifu is the shadow on the other side of it. Together they govern lunar energy — the serenity of the long view, the reflection that reveals what daylight hides, and the illumination that does not blind but clarifies."},
    {name:'Sevax / Parthen',domain:'Solar Energy — Vitality, Warmth, Radiance', affil:'Simic Elemental',           desc:"Sevax is the living warmth of the sun at its height; Parthen is the long light of the afternoon, still warm but beginning to angle. Together they govern solar energy — vitality in full expression, warmth that sustains, and the radiance that makes everything visible."},
    {name:'Ix / Hade',      domain:'Void — Emptiness, Nihilism',                affil:'Simic Elemental',           desc:"Ix is the space where something was removed; Hade is the indifference that filled it. Together they govern the void — absolute emptiness and what it produces: not peace, but nihilism. Their communion is rare and the path back is not guaranteed."},
  ]},
  {label:'Lorük elemental',list:[
    {name:'Amala / Zayvull',domain:'Arc — Innovation, Energy, Magic',            affil:'Lorük Elemental', desc:"Amala is the spark of the new idea; Zayvull is the current that carries it into form. Together they govern arc — the innovation that breaks from precedent, the raw energy that powers transformation, and the magic that operates before the rules have been written for it."},
    {name:'Vang / Lig',     domain:'Gravity — Attraction, Balance, Force',       affil:'Lorük Elemental', desc:"Vang is the pull; Lig is the equilibrium that pull produces. Together they govern gravity — the attraction between things, the balance that emerges from competing forces, and the directed force that moves what would not otherwise move."},
    {name:'Dioys / Isild',  domain:'Stasis — Preservation, Constancy, Stillness',affil:'Lorük Elemental', desc:"Dioys is the moment held; Isild is the structure that makes holding possible. Together they govern stasis — preservation of what matters, constancy in the face of pressure to change, and the stillness that is not absence but intention."},
    {name:'Birn / Irnal',   domain:'Strand — Connection, Fate, Destiny',         affil:'Lorük Elemental', desc:"Birn is the thread laid out ahead; Irnal is the thread behind, already woven. Together they govern the strand — the connections between people and moments, the fate that emerges from those connections, and the destiny that is neither fixed nor accidental but earned."},
  ]},
];
const CLASSES={magic:[{id:'inquisitor',name:'Inquisitor',path:'Divine',disc:'Sanctus',t2:'Paladin / Cleric',t3:'Iridesce / Augur',stats:'Wis/Cha'},{id:'zealot',name:'Zealot',path:'Spiritual',disc:'Sacral',t2:'Shaman / Bokor',t3:'Caelyn / Cursewright',stats:'Wis/Con',isSacral:true},{id:'weaver',name:'Weaver',path:'Magic',disc:'Mana',t2:'Bard / Castor',t3:'Maiar / Magus',stats:'Int/Cha'},{id:'druid',name:'Druid',path:'Nature',disc:'Essence',t2:'Ovate / Wildheart',t3:'Dryad / Primalist',stats:'Wis/Dex'},{id:'sage',name:'Sage',path:'Arcane',disc:'Gnosis',t2:'Codexer / Scribe',t3:'Glyphsage / Runesiph',stats:'Int'},{id:'mystic',name:'Mystic',path:'Mythic',disc:'Shaeid',t2:'Guardian',t3:'Arcani',stats:'Wis/Cha'},{id:'magister',name:'Magister',path:'Shadow',disc:'Wraill',t2:'Hemoclast / Harrow',t3:'Necromancer / Darkweaver',stats:'Int/Cha'}],tech:[{id:'merchant',name:'Merchant',path:'Business',disc:'Gain',t2:'Emissary / Diplomat',t3:'Tycoon / Negotiator',stats:'Cha/Int'},{id:'fighter',name:'Fighter',path:'Martial',disc:'Grit',t2:'Barbarian / Swashbuckler',t3:'Knight / Marauder',stats:'Str/Con'},{id:'vanguard',name:'Vanguard',path:'Anti-Magic',disc:'Focus',t2:'Sentinel / Null',t3:'Whyth / Warden',stats:'Con/Str'},{id:'alchemist',name:'Alchemist',path:'Alchemic',disc:'Matter',t2:'Mutagenist / Bombardier',t3:'Biomancer / Saboteur',stats:'Int/Con'},{id:'scholar',name:'Scholar',path:'Academic',disc:'Reason',t2:'Tactician / Cartographer',t3:'Strategist / Archivist',stats:'Int/Wis'},{id:'rogue',name:'Rogue',path:'Covert',disc:'Lithium',t2:'Inspector / Ranger',t3:'Detective / Strider',stats:'Dex/Int'},{id:'artificer',name:'Artificer',path:'Engineering',disc:'Ingenuity',t2:'Gunslinger / Tinkerer',t3:'Thaumaturge / Machinist',stats:'Int/Dex'}]};
const allClasses=[...CLASSES.magic,...CLASSES.tech];
const ALL_STATS=[{key:'spirit',label:'Spirit',equiv:'Charisma',axis:'magic'},{key:'soul',label:'Soul',equiv:'Faith',axis:'magic'},{key:'body',label:'Body',equiv:'Constitution',axis:'magic'},{key:'essence',label:'Essence',equiv:'Wisdom',axis:'magic'},{key:'will',label:'Will',equiv:'Strength',axis:'tech'},{key:'whim',label:'Whim',equiv:'Dexterity',axis:'tech'},{key:'mind',label:'Mind',equiv:'Intelligence',axis:'tech'},{key:'dream',label:'Dream',equiv:'Intent',axis:'tech'}];
const MAGIC_DISCIPLINES=[{key:'divine',name:'Divine',disc:'Sanctus'},{key:'spirit',name:'Spirit',disc:'Sacral'},{key:'magic',name:'Magic',disc:'Mana'},{key:'nature',name:'Nature',disc:'Essence'},{key:'glyph',name:'Glyph',disc:'Gnosis'},{key:'light',name:'Light',disc:'Shaeid'},{key:'shadow',name:'Shadow',disc:'Wraill'}];
const TECH_DISCIPLINES=[{key:'gain',name:'Gain',disc:'Ion'},{key:'grit',name:'Grit',disc:'Steam'},{key:'focus',name:'Focus',disc:'Element'},{key:'matter',name:'Matter',disc:'Arc'},{key:'reason',name:'Reason',disc:'Cell'},{key:'fortitude',name:'Fortitude',disc:'Lithium'},{key:'ingenuity',name:'Ingenuity',disc:'Null'}];
const ACTIONS={universal:['Interact','Search','Analyze','Project','Survey'],combat:['Strike','Range','Parry','Defend','Use','Rest','Flee','Disrupt','Assist','Maneuver','Brace','Rebound'],social:['Negotiate','Intimidate','Insight','Deception','Persuade','Influence','Commands','Threaten','Bribe','Reason','Appeal','Taunt'],magic:['Invoke','Flow','Weave','Inscribe','Harrow','Call','Attune'],tech:['Broker','Exert','Nullify','Transmute','Tinker','Theorize','Engineer'],stealth:['Hide','Sneak','Veil','Tail','Sleight','Sabotage','Infiltrate','Assassinate','Disguise','Eavesdrop'],defense:['Brace','Endure','Counter'],alignment:['Heal','Harm','Kinetic']};
const APPAREL_SLOTS=['Head','Torso','Waist','Hands','Greaves','Boots'];
const WEAPON_SLOTS=['Main Hand','Off-Hand','Side Weapon','Heavy'];
const ACCESSORY_SLOTS=['Ring I','Ring II','Neck','Charm','Relic','Artifact'];
const NAMES={addamar:{m:["Ader'ran","Aethelstan","Alec","Alden","Amar","Arthur","Barnaby","Benjamin","Braxton","Cohl","Corben","Desmond","Dorian","Edgar","Elias","Finnian","Frederick","Gareth","Gideon","Henry","Josiah","Kael","Lucian","Marcus","Matthias","Nathan","Oliver","Reynard","Roland","Samuel","Sebastian","Thomas","Trystan","William","Adisa","Ahmed","Kofi","Jelani","Azizi","Tariq","Mosi","Kwasi"],f:["Ada","Adelaide","Amelia","Anastasia","Beatrice","Celeste","Clarissa","Clementine","Cordelia","Dahlia","Delphine","Elizabeth","Eloise","Esther","Evelyn","Felicity","Gwendolyn","Hannah","Josephine","Leona","Lillian","Lorelei","Madeline","Mirabelle","Octavia","Penelope","Phoebe","Rosalind","Sarah","Seraphina","Sophia","Tabitha","Victoria","Adanna","Amina","Ayanna","Fatima","Jamila","Malika","Nia","Samara","Zuri"],s:["Allaunian","Beaumont","Blackwood","Cole","Darrow","Davenport","Donovan","Fairchild","Fernsby","Flint","Grey","Hunt","Jennings","Kane","Lockwood","Morgan","Novak","Parrish","Reynolds","Schroeder","Sinclair","Somerset","Stone","Turner","Vance","Warren","Wilson","Wright","Azibo","Chukwu","Jakande","Nkosi","Okoro","Olumide","Waziri","Tendaji"]},durinak:{m:["Adrik","Alberich","Baern","Bhaldor","Brottor","Bruenor","Daernur","Dain","Darrak","Dorin","Drogan","Dulmir","Eberk","Einkil","Fargrim","Gardain","Gimdrus","Gorun","Gunnar","Haldor","Hjalmar","Loghaire","Ori","Orsik","Oskar","Rangrim","Rigor","Rurik","Svein","Taklinn","Theodrin","Thoradin","Thorin","Tordek","Ulfgar","Vondal","Zendrix"],f:["Amber","Artin","Astrid","Audhild","Bardryn","Brynhild","Chelcea","Diesa","Dagnal","Eowyn","Eirlys","Elin","Eldeth","Falkrunn","Finellen","Freydis","Greta","Gudrun","Gunnloda","Gurdis","Hildegarde","Hlin","Jorunn","Kathra","Kristryd","Lyra","Mardred","Ragnild","Runa","Sigyn","Solveig","Thyra","Torbera","Ullina","Vistr"],s:["Ambolthjerte","Balderk","Banmur","Bjergsten","Dankil","Elkhid","Forgewinter","Graniteheart","Gorunn","Grimrock","Holderhek","Jernskjold","Loderr","Rohdir","Rumnaheim","Stalhammar","Thokkarn","Thorunn","Ungart","Yewhammer"]},telari:{m:["Adran","Aelar","Aramil","Arannis","Ardor","Aust","Beiro","Berrian","Bryn","Carric","Erdan","Erevan","Galinndan","Hadarai","Heian","Immeral","Ivellios","Lael","Laucian","Maegon","Naeris","Orenthil","Paelias","Peren","Quarion","Rael","Riardon","Rinn","Rolen","Soveliss","Thamior","Tharivol","Theren","Vall","Varis"],f:["Adrie","Alesia","Althaea","Anastrianna","Andraste","Ara","Auriel","Bethrynna","Birel","Caladwen","Caelynn","Drusilia","Elaeris","Elara","Felosial","Galara","Jelenneth","Keyleth","Kolette","Lia","Leshanna","Lyraeth","Meriele","Mialee","Naivara","Sariel","Shava","Silaqui","Syla","Sylvarin","Thia","Vadania","Valanthe","Xanaphia"],s:["Adgrun","Aerendyl","Amakiir","Calaelen","Daax","Eboneir","Eryndor","Eyther","Galanodel","Holimion","Ilphelkiir","Liadon","Meliamne","Naïlo","Sol'valyn","Siannodel","Vaelithar"]},othrod:{m:["Tirnark","Gulall","Brakthar","Brugor","Drogar","Durok","Garr","Gorak","Graknar","Grimgor","Grishnak","Grunk","Gromak","Grommash","Hulgar","Korgar","Krugor","Lazgul","Morvus","Morgash","Murgoth","Roknar","Rognak","Rukar","Skarnak","Tarok","Thokk","Thorgar","Thrag","Ulgoth","Vargash","Zargoth","Zog"],f:["Azhara","Brunga","Draga","Draka","Dronka","Durnasha","Durgana","Eira","Gaarna","Gorlakka","Gornak","Grukka","Grondra","Gulka","Horka","Kargana","Krisha","Krazna","Lurtza","Morga","Ragnara","Rika","Shagra","Skara","Sylra","Thokara","Urga","Zagra","Zokara","Zurga"],s:["Ba'elnohr","Brogmar","Brognar","Dragnar","Drakgash","Draknar","Fjordlord","Ghoran","Gra'adok","Grobuk","Grukthar","Grungar","Kragmar","Kragthar","Zalmok","Zargash","Zolgar","Zurnak"]},fae:{m:["Armand","Étienne","Fabien","Henri","Jacques","Laurent","Mathieu","Pierre","René","Rémy","Aelaril","Aelarion","Danius","Elenwe","Elarian","Erevan","Everath","Lirion","Lyrael","Myrithas","Nalathor","Seladon","Solarae","Sylvaris","Thalindor"],f:["Adèle","Amélie","Camille","Céline","Dianthe","Élodie","Ilayda","Lucie","Margot","Mathilde","Wyhn","Aelindra","Aelithra","Auriel","Caelithra","Daelora","Elaria","Elindra","Faelith","Galindra","Harael","Ildra","Jaelith","Kaelira","Laerina","Maelindra","Naelithra","Orina","Paelina","Raelora","Saelithra","Taelindra","Turina","Vaelora","Zaelithra"],s:["Brumes","Étoiles","Faucon","Féerie","l'Aube","Mystère","Rêves","Songes","Aerisindor","Aerithal","Aelarian","Alathoril","Aurielwyn","Elenwyn","Elariath","Elarion","Lirielor","Lyraethil","Nalathir","Rin","Selasael","Selendrith","Solanthir","Sylvaril","Thalarael","Thalassir","Thalindor"]},gnome:{m:["Baldrik","Barmok","Boril","Durnak","Durnik","Ermmiir","Grimgor","Grunor","Krag","Kragrim","Orion","Osreich","Pomares","Rurik","Thalgar","Theggard","Thralin"],f:["Bimpnottin","Bindi","Bonnie","Breena","Caramip","Carlin","Cymbal","Daisy","Dimple","Donella","Duvamil","Elva","Ella","Ellywick","Fern","Flicker","Gilda","Glimmer","Greta","Hazel","Hattie","Ivy","Juniper","Kizzy","Kymmi","Lorilla","Lulu","Lilli","Mabel","Mardnab","Nettle","Nissa","Nyx","Olive","Petal","Pixie","Quilla","Razzle","Roywyn","Shamil","Tana","Tilda","Vella","Violet","Willo","Xara","Yara","Zanna","Zinnia"],s:["Aleslosh","Ashhearth","Badger","Binkbeetle","Bolderamo","Brandyapple","Cogwhistle","Coppercoil","Dazzleflint","Doublelock","Filchbatter","Fnipper","Folkor","Gallow","Gleamgow","Ladlemeddle","Lyle","Merrygiggle","Nackle","Ningel","Nim","Pock","Quickwhirl","Scheppen","Snickerg","Tinderdell","Tumop","Wellby","Whirligig","Winkletwist","Wrenwhist"]},fynlor:{m:["Alton","Ander","Anso","Bodo","Cade","Calico","Chumley","Corrin","Digger","Eddin","Eldon","Errich","Fenton","Finnegan","Finnan","Freddy","Garret","Gethin","Hob","Keth","Lindal","Lyle","Merric","Milo","Osborn","Reed","Roscoe","Wellby","Xannek","Brynwick"],f:["Andry","Bree","Bluebell","Callie","Constance","Cora","Cricket","Dandelion","Euphemia","Glymmer","Hailey","Jillian","Juno","Kithri","Lavinia","Lidda","Marlowe","Meadow","Merla","Nedda","Paela","Peony","Portia","Sandy","Selia","Shaena","Thistle","Tansy","Trym","Tuppence","Vani","Verna"],s:["Adalgrim","Bagwell","Berrybush","Brambleburr","Brushgather","Dappleleaf","Glimmerglen","Goldleaf","Goodbarrel","Greenbottle","Hearthstone","Hilltopple","Hladky","Honeypot","Leagallow","Merryhill","Mossfoot","Oakenshadow","Pebblebrook","Puddlejumper","Snugbottom","Springbrook","Sweetbriar","Tealeaf","Thorngage","Tosscobble","Tumbletop","Underbough","Whistlewind","Willosip"]},pamorph:{m:["Harambe'ye","Bemba","Tano","Jabari","Koba","Kofi","Nuru","Rafik","Tariku","Kraven","Jackdaw","Cawthorn","Aodhfionn","Killian","Kiff","Murk","Kreech","Rook","Aegemon","Lykourgos","Ariston","Ambrose","Aurelius","Evander","Orion","Dro'farahn","Kenzo","Kwame","Leonidas","Malik","Zain","Sekou","Kwasi","Renato","Haruki","Aurum","Varian","Arthas","Lothar","Fib"],f:["Neema","Niarah'ell","Mandisa","Safiya","Kikimba","Jajama","Rafara","Tumaki","Ayo","Xoliswa","Kosi","Nareema","Okoyamb","Kaziya","Malaike","Lykia","Totori","Tawny","Brenna","Plume","Ravena","Naiad","Apsara","Kiku","Kotone","Selene","Isadorella","Lysandiera","Adlara","Moja","Shade","J'zara","Abena","Malaika","Amina","Nia","Zahara","Aurora","Leona","Nala","Asantewaa","Nzinga","Aphis"],s:["Mbaku","Njobu","Nkosi","Ogun","Zuri","Ramonda","Kasumba","Shuri","Nakia","Okoye","Aneka","Aleval","Sunwing","Ra'kesh","Krowe","Sa'era","Aryama","Chandradeva","Divyansh","Umbacca","Odion","Okoro","Doumbia","Azikiwe","Ogbonna","Obi","Jelani","Ebo","Adebayo","Kamara","Amara","Onyeka","Ardentbrin","Tressere","Allaistarr","Pachycetma","Asiini","Deecye"]},genasi:{m:["Aerisya","Atticus","Caius","Cassian","Evander","Felix","Galeth","Hadrian","Leander","Lucian","Maximus","Octavian","Remus","Silas","Theron","Zep'hir","Zeyrion","Aarav","Baelor","Blath","Bran","Caelum","Davor","Elric","Faolan","Geth","Idris","Jareth","Modar","Thar","Urth","Bor","Fodel","Glar","Grigor","Igan","Ivor","Kosef","Mival","Orel","Pavel","Sergor"],f:["Aveline","Camilla","Esme","Gaia","Imogen","Jessamine","Lavinia","Maia","Neryi","Niamha","Sylvara","Amafrey","Betha","Cefrey","Fiametta","Gwyneira","Jocast","Kethra","Olga","Rhiannon","Sariel","Silifrey","Ulyana","Vespera","Westra","Xanthe","Ysanne","Alethra","Amara","Calliope","Ereanah","Isolde","Karar","Natal","Olma","Pylanae","Tanh","Zotah"],s:["Evershale","Fyrskar","Glimmerkith","Helkarn","Illivren","Jarnvyr","Kyrthorn","Lyraven","Mystralys","Nethraze","Orinthorn","Pyrethorn","Rivenvale","Sylvarren","Thrylorn","Umbrasky","Vyrshade","Bersk","Chernin","Helder","Hornraven","Lackman","Nyrath","Orsynn","Pyrath","Qyrrin","Ryssand","Sylvaris","Tyrran","Allaistarr","Eryindr"]},tiefling:{m:["Corvus","Aoth","Bareris","Kethoth","Ramas","Borivik","Faurgar","Jandar","Kanithar","Madislak","Ralmevik","Shaumar","Vladislak","Diero","Marcon","Akmenos","Amnon","Barakas","Damakos","Ekemon","Iados","Kairon","Leucis","Melech","Mordai","Morthos","Pelaios","Skamos","Therai","Pieron","Rimardo","Romero","Umbro"],f:["Arizima","Chathi","Nephis","Nulara","Murithi","Sefris","Thola","Umara","Zolis","Fyevarra","Hulmarra","Immith","Imzel","Navarra","Shevarra","Tammith","Yuldra","Balama","Dona","Faila","Jalana","Bryseis","Criella","Damaia","Ea","Kallista","Lerissa","Makaria","Nemeia","Orianna","Phelaia","Rieta"],s:["Corraer","Ankhalab","Anskuld","Fezim","Hahpet","Nathandem","Sepret","Uuthrakt","Chergoba","Dyernina","Iltazyara","Murnyethara","Stayanoga","Ulmokina","Agosto","Astorio","Calabra","Domine","Falone","Marivaldi","Pisacar","Aberwyn","Brynmor","Caerthyn","Derwynn","Eirwen","Fenwyll","Glynfyr","Hafryn","Islynd","Llyrien","Maelwys","Neirin","Owynal","Rhodwyn","Selwynn","Talfryn","Wynfael"]},seraphan:{m:["Advachiel","Ambriel","Ananiel","Apollyon","Armaros","Asbeel","Azazel","Azrael","Baraqiel","Barbiel","Barchiel","Bezaliel","Cambiel","Chazaqiel","Dumah","Eistibus","Gabriel","Gadreel","Hamaliel","Hanael","Hasmed","Kokabiel","Leliel","Malahidael","Muriel","Penemue","Phanuel","Rahab","Raphael","Raziel","Remiel","Sachiel","Samyaza","Sandalphon","Sariel","Simikiel","Tamiel","Turiel","Uriel","Verchiel","Zachriel","Zaqiel","Zuriel"],f:["Rota","Pythia","Seraphina","Celestia","Lumira","Auriela","Elysia","Solara","Iriel","Vestal","Sancta","Divinara"],s:["Altum","Celestine","Divinus","Gloriam","Luminal","Radiantis","Stellan","Vestal"]},drakazir:{m:["Arjhan","Balasar","Bharash","Callisto","Donaar","Ghesh","Heskan","Kald'er","Koragon","Kriv","Lewwe'ghar","Medrash","Mehen","Nadarr","Pandjed","Patrin","Renthok","Rhogar","Shamash","Shedinn","Sylaren","Tarhun","Torinn","Travok","Valdarin","Zarkan"],f:["Akra","Biri","Daar","Drasithia","Farideh","Harann","Havilar","Jheri","Kava","Korinn","Kylraxis","Mishann","Nala","Perra","Pyraxia","Raiann","Sora","Sornala","Surina","Syraxis","Tharzali","Thava","Uadjit","Veshara","Xyrixa","Zythra"],s:["Caragarson","Clethtinthiallor","Daardendrian","Delmirev","Drachedandion","Emerury","Fenkenkabradon","Frale","Iforson","Irame","Kepeshkmolik","Kerrhylon","Kimbatuul","Linxakasendalor","Myastan","Nemmonis","Norixius","Ophinshtalajiir","Prexijandilin","Shestendeliath","Storrae","Thunerike","Turnuroth","Verthisathurgiesh","Yarjerit"]},nazari:{m:["Nerio","Astralis","Delphinus","Flanrilyn","Naida","Vemres","Zoro'ah","Tavian","Ulric","Vash","Wren","Xander","Yorick","Zephyrus","Bodhi","Cyrus","Dante","Finnian","Hiro","Icarus","Jaxon","Kian","Nero","Phelan","Quinlan","Rylan","Soren","Tarquin","Ulysses","Mipha","Laruto","Mikau","Sidon","Ralis","Dento"],f:["Tha'lara","Adrasteia","Cerbera","Delphia","Eupraxia","Fiametta","Hecate","Kallisto","Morwyn","Nyx","Persephone","Quorra","Ravenna","Selene","Theia","Ulyssa","Vespera","Xanthe","Ysara","Bellatrix","Elysia","Fiorella","Giselle","Hestia","Inara","Jinx","Kismet","Mireille","Nefertari","Phaedra","Lulu","Ruto","Zora","Rutela","Gaddison","Tona"],s:["Azurewave","Umuzath","Maridwyn","Nautilus","Oceiros","Nereide","Pelagion","Meridian","Delpharis","Sirena","Marisal","Abyssia","Neptunis","Amorath","Dahlogath","Volarian","Aquafyre","Undyrath","Leviathar","Marindros","Nauticael","Typharius","Oceanastra","Nereidium","Pelagoros","Thalassir","Meridys","Delpharion","Sirenara","Posiodous","Trello"]},goliath:{m:["Boranh","Brogar","Dorran","Durgan","Garmek","Grendar","Halvor","Hrothgar","Kaelen","Korath","Kronar","Kromek","Khuvek","Orin","Rhogar","Sigrun","Skorn","Strongjaw","Thalgar","Thoran","Thrain","Valkar","Vardon","Vargan","Varun"],f:["Brun","Brynja","Draya","Druna","Elda","Fenra","Freyja","Galara","Garrun","Jordis","Kira","Korra","Marra","Mirka","Ragna","Serka","Skara","Thalara","Thalina","Thora","Thordis","Valka","Varka","Vendra"],s:["Andersen","Bjornsson","Clausen","Eriksson","Gundersen","Haagensen","Hammersen","Holmgaard","Ingvarsen","Jansson","Jorgensen","Kristiansen","Larsen","Lauritsen","Mathiasen","Mikkelsen","Nielsen","Olesen","Pedersen","Ragnarsson","Skovgaard","Sorensen","Stormgaard","Thorsen","Vinterson"]},chronison:{m:["Exemplar","Prime","Sentinel","Vanguard","Overseer","Archon","Apex","Paragon","Prototype","Sovereign","Guardinal","Bastion","Legionnaire","Medica","Catalyst","Anima","Soulforge","Aegis","Luminary","Nexus","Seraphim","Vindicator","Spectralis","Eidolon","Errant","Revenant"],f:["Anima","Luminary","Seraphim","Spectralis","Medica","Catalyst","Soulforge","Nexus","Aegis","Eidolon","Sentinel","Paragon"],s:["212-B","001-X","Alpha-43","78-K","Omega-17","3-E","504-T","96-Z","Theta-12","88-Q","Lambda-76","Lambda-88","75-L","450-X","Sigma-18","Sigma-20","Sigma-21","457-A","303-Z","Prime-7","Prime-12","42-R","78-L","92-VL","007-X","12-QT","40-Y"]}};
const BS_ORIGINS={addamar:["Born in the cobblestone sprawl of Ashendell, where the Veinrunner tracks split the city into those who prospered and those who were forgotten","Raised in the desert trade routes of the Brunar, where every agreement was sealed in blood and hospitality","A child of the Matekwan spirit-forests, where the ancestors speak through the rustling of the maize and the crack of river stone"],durinak:["Forged in the deep halls of Karak Byrn, where every dwarven child is given a hammer before they are given a name","Raised behind the Bronze Doors of Tarek'Mor, where the Graniteheart Clan's silence is its own kind of law"],telari:["Exiled from the hidden city of Quynthe'ra before the rite of adulthood, carrying only a sigil and a half-told reason","Raised among the ancient trees of Elmoire, where Fae blood hums in the bark and time moves at its own pace"],othrod:["Cast out of Razor's Point after a duel that ended the wrong way — or maybe the right way, depending on who is telling it","Raised in the marshes of Kul'Kal Rakhar, where the water is always rising"],pamorph:["Born in the wild reaches of Therienstadt, where the pack law governs everything and mercy is negotiated, not assumed","Raised by a pride in the shadow of the Great Oak Forest, close enough to the Veridoran border to know when the machines were getting louder"],default:["A wanderer without a fixed homeland, carrying a name from one place and a face that belongs to another","Raised on the margins of Soterian society, in the kind of city district that doesn't appear on official maps","Found on the road by a traveling merchant at an age they no longer clearly remember, and raised between ledgers and trade stops"]};
const BS_MOTIV={magic:["driven by a hunger to understand the resonant Line before the age of steam drowns it out entirely","seeking the truth behind the gods' silence — which arrived too suddenly and too completely to be simple abandonment"],tech:["building something that will outlast the age of steam and the people who profited from it","carrying tools that once belonged to someone they couldn't save, and have not yet decided what to do with that"],any:["caught between two worlds and genuinely at home in neither, which has become a kind of advantage","searching for someone who disappeared without a trace three years ago, which is long enough to know it wasn't an accident"]};
const BS_BOONS={magic:["grants the ability to sense resonant disturbances in the Line within 30 feet","allows once per long rest a re-read of a failed arcane check"],tech:["grants advantage on checks involving mechanical devices that are functioning in a way they were not designed for","allows the character to improvise a tool from available materials once per long rest"],any:["allows the character to always know which direction they entered a space from, regardless of disorientation or illusion","grants a once-per-day ability to reroll a social check after seeing the initial result"]};
const BS_BELIEF_LINES={"Ba'elnim":"Ba'elnim's light doesn't comfort — it clarifies, stripping away the comfortable versions of things until only the true shape remains","Fi'harta":"Fi'harta's wisdom comes not as answers but as the right questions arriving moments before they are needed","Iło":"Ilo's presence arrives as a breath before the stillness — a reminder that the living world is still speaking","Ruehnar":"Ruehnar's blessing is not warmth — it is the knowledge that some things are worth the cost of losing them","Ylandar":"Ylandar's truth cannot be softened, which is either his gift or the thing that makes his followers difficult at dinner","Khoneus":"Khoneus does not punish those who seek the dark — he asks only that they remember what they were before they found it","Baeshra":"Baeshra demands nothing from the hunt except honesty","Shevar":"Shevar's blessing is pragmatic — gold flows toward those who understand its real value, which is leverage"};
const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
const POINT_COST=v=>v<=8?0:v===9?1:v===10?2:v===11?3:v===12?4:v===13?5:v===14?7:9;
function roll4d6Drop1(){const r=[Math.ceil(Math.random()*6),Math.ceil(Math.random()*6),Math.ceil(Math.random()*6),Math.ceil(Math.random()*6)];return{total:r.reduce((a,b)=>a+b,0)-Math.min(...r)};};
function buildBackstory(race,cp,cid,fn,dc,deity,spirit){const cls=allClasses.find(c=>c.id===cid)||{};const origins=BS_ORIGINS[race]||BS_ORIGINS.default;const motivPool=cp==='magic'?BS_MOTIV.magic:cp==='tech'?BS_MOTIV.tech:BS_MOTIV.any;const boonPool=cp==='magic'?BS_BOONS.magic:cp==='tech'?BS_BOONS.tech:BS_BOONS.any;const origin=pick(origins);const motiv=pick(motivPool);const boon=pick(boonPool);const beliefName=dc==='god'?deity:dc==='spirit'?spirit:null;const beliefLine=beliefName&&BS_BELIEF_LINES[beliefName]?BS_BELIEF_LINES[beliefName]:'They answer to no god and expect nothing in return from the unseen powers — which, in Soteria, tends to mean those powers eventually come looking';const name=fn||'They';const clsName=cls.name?`${cls.name} of the ${cls.disc||cls.path} discipline`:'an unnamed path';return `${origin}, ${name} came to walk the way of a ${clsName} — ${motiv}.\n\n${beliefLine}.\n\n▸ Starting Boon: This character ${boon}.`;}
function getRaceDisplay(race,rv,pmV){const rd=RACES.find(r=>r.id===race);if(!rd)return '—';if(race==='pamorph'&&pmV){const pm=[...PM_MAJ,...PM_MIN].find(p=>p.id===pmV);return pm?`Pa'morph | ${pm.name}`:rd.name;}if(rv)return `${rd.name} · ${rv}`;return rd.name;}
function getNameData(race){const r=RACES.find(x=>x.id===race);return r?(NAMES[r.ns]||null):null;}
const STORAGE_KEY='syntarion_chars_v1';
function loadSaved(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}catch{return [];}}
function saveChar(char){try{const existing=loadSaved();const idx=existing.findIndex(c=>c.id===char.id);if(idx>=0)existing[idx]=char;else existing.push(char);localStorage.setItem(STORAGE_KEY,JSON.stringify(existing));}catch{}}

// ─── COLORS ───────────────────────────────────────────────────────────────────
const C={
  bg:'#f0f2f5',surface:'#ffffff',card:'#ffffff',subPanel:'#f4f6f9',
  border:'rgba(0,0,0,0.09)',borderFocus:'rgba(37,99,235,0.5)',
  blue:'#2563EB',blueDim:'#3B82F6',blueLight:'#EFF6FF',blueText:'#1D4ED8',blueChip:'#DBEAFE',
  text:'#111827',textSub:'#374151',muted:'#6B7280',dim:'#9CA3AF',
  magic:'#7C3AED',magicLight:'#5B21B6',magicText:'#5B21B6',magicBg:'#EDE9FE',magicChip:'#DDD6FE',
  tech:'#059669',techLight:'#065F46',techText:'#065F46',techBg:'#D1FAE5',techChip:'#A7F3D0',
  warn:'#DC2626',warnBg:'#FEF2F2',warnBorder:'#FECACA',
  shadow:'0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.04)',
  shadowMd:'0 4px 6px rgba(0,0,0,0.07),0 2px 4px rgba(0,0,0,0.05)',
  shadowLg:'0 10px 24px rgba(0,0,0,0.10),0 4px 8px rgba(0,0,0,0.06)',
};

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const inp={background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:'8px 11px',color:C.text,fontSize:13,width:'100%',outline:'none',boxSizing:'border-box'};
const ta={...inp,resize:'vertical',lineHeight:1.6,minHeight:80,fontSize:12};
const sl={fontSize:10,letterSpacing:'0.10em',textTransform:'uppercase',color:C.muted,fontWeight:600,marginBottom:10,display:'block'};
const noteStyle={fontSize:11,color:C.textSub,padding:'10px 13px',background:C.blueLight,borderRadius:8,borderLeft:`3px solid ${C.blueDim}`,marginBottom:14,lineHeight:1.55};
const warnNote={...noteStyle,color:C.warn,background:C.warnBg,borderLeftColor:C.warnBorder};
const nav={display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:22,paddingTop:16,borderTop:`1px solid ${C.border}`};
const grid=(min=132)=>({display:'grid',gridTemplateColumns:`repeat(auto-fill,minmax(${min}px,1fr))`,gap:8,marginBottom:16});
const btnPrimary=(dis)=>({background:dis?C.subPanel:C.blue,border:`1px solid ${dis?C.border:C.blue}`,borderRadius:8,padding:'9px 20px',fontSize:11,letterSpacing:'0.04em',fontWeight:700,cursor:dis?'default':'pointer',color:dis?C.dim:'#fff',boxShadow:dis?'none':'0 1px 3px rgba(37,99,235,0.28)',transition:'all 0.12s'});
const btnGhost={background:'transparent',border:`1px solid ${C.border}`,borderRadius:8,padding:'9px 17px',fontSize:11,letterSpacing:'0.04em',fontWeight:500,cursor:'pointer',color:C.muted};
const btnSmall=(active,col)=>({background:active?(col||C.blueLight):'transparent',border:`1px solid ${active?(col||C.blueDim):C.border}`,borderRadius:6,padding:'5px 12px',fontSize:10,fontWeight:active?700:400,cursor:'pointer',color:active?(col?'#fff':C.blueText):C.muted,letterSpacing:'0.04em'});
const tagChip=(t)=>({display:'inline-block',marginTop:6,fontSize:9,letterSpacing:'0.06em',textTransform:'uppercase',padding:'2px 7px',borderRadius:20,fontWeight:700,background:t==='magic'?C.magicChip:t==='tech'?C.techChip:C.blueChip,color:t==='magic'?C.magicLight:t==='tech'?C.techLight:C.blueText});
const cardSel=(sel,theme)=>{const sc=theme==='tech'?C.tech:C.blue;const sb=theme==='tech'?C.techBg:C.blueLight;return{background:sel?sb:C.card,border:`1.5px solid ${sel?sc:C.border}`,borderRadius:10,padding:12,cursor:'pointer',boxShadow:sel?`0 0 0 3px ${theme==='tech'?'rgba(5,150,105,0.1)':'rgba(59,130,246,0.1)'},${C.shadow}`:C.shadow,transition:'all 0.12s'};};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Syntarion() {
  const STEPS=['Adventurers','Race & Name','Belief','Class','Stats','Backstory','Sheet'];

  // app-level view: 'landing' | 'wizard' | 'campaign'
  const [appView,setAppView]=useState('landing');
  const [campaignView,setCampaignView]=useState(null); // campaign id when in campaign mode

  // wizard state
  const [step,setStep]=useState(0);
  const [showChars,setShowChars]=useState(false);
  const [dcSel,setDcSel]=useState(null);
  const [taken,setTaken]=useState(new Set());
  const [savedChars,setSavedChars]=useState(()=>loadSaved());

  // character state
  const [charId,setCharId]=useState(()=>Date.now().toString());
  const [race,setRace]=useState(null);
  const [expandedRace,setExpandedRace]=useState(null);
  const [rv,setRv]=useState(null);
  const [pmV,setPmV]=useState(null);
  const [fn,setFn]=useState('');
  const [ln,setLn]=useState('');
  const [age,setAge]=useState('');
  const [gender,setGender]=useState('m');
  const [dc,setDc]=useState('none');
  const [deity,setDeity]=useState(null);
  const [spirit,setSpirit]=useState(null);
  const [cp,setCp]=useState('');
  const [cid,setCid]=useState(null);
  const [alignSlider,setAlignSlider]=useState(0); // -4 magic to +4 tech
  const [statMode,setStatMode]=useState('buy');
  const [rollResults,setRollResults]=useState(null);
  const [rollAssign,setRollAssign]=useState({});
  const [selectedRoll,setSelectedRoll]=useState(null);
  const [stats,setStats]=useState({spirit:8,soul:8,body:8,essence:8,will:8,whim:8,mind:8,dream:8});
  const [manualStats,setManualStats]=useState({spirit:'',soul:'',body:'',essence:'',will:'',whim:'',mind:'',dream:''});
  const [backstory,setBackstory]=useState('');
  const [sheetTab,setSheetTab]=useState('identity');
  const [inventory,setInventory]=useState({consumables:'',pack:'',coin:'',weight:'',misc:''});
  const [apparel,setApparel]=useState({Head:'',Torso:'',Waist:'',Hands:'',Greaves:'',Boots:''});
  const [weapons,setWeapons]=useState({'Main Hand':'','Off-Hand':'','Side Weapon':'','Heavy':''});
  const [accessories,setAccessories]=useState({'Ring I':'','Ring II':'','Neck':'','Charm':'','Relic':'','Artifact':''});
  const [actionBonuses,setActionBonuses]=useState({});
  const [notes,setNotes]=useState('');
  const [morality,setMorality]=useState('');
  const [background,setBackground]=useState('');
  const [motivation,setMotivation]=useState('');
  const [classBonus,setClassBonus]=useState('');
  const [racialFeatures,setRacialFeatures]=useState('');
  // ── DM-granted progression fields ──
  const [charLevel,setCharLevel]=useState(1);
  const [apCurrent,setApCurrent]=useState(0);   // AP spent / allocated
  const [apTotal,setApTotal]=useState(0);         // AP pool granted by DM
  const [classAbilities,setClassAbilities]=useState([
    {id:'ca1',name:'',points:0},{id:'ca2',name:'',points:0},{id:'ca3',name:'',points:0},
    {id:'ca4',name:'',points:0},{id:'ca5',name:'',points:0},
  ]);
  const [heritageAbilities,setHeritageAbilities]=useState([
    {id:'ha1',name:'',points:0},{id:'ha2',name:'',points:0},{id:'ha3',name:'',points:0},
    {id:'ha4',name:'',points:0},
  ]);
  // discipline points: keyed by discipline key e.g. 'divine', 'grit' etc.
  const [disciplinePoints,setDisciplinePoints]=useState({});
  const [showSaveModal,setShowSaveModal]=useState(false);
  const [saveCampaign,setSaveCampaign]=useState('');
  const [saveConfirm,setSaveConfirm]=useState(false);
  const [activeTab,setActiveTab]=useState('new');
  const [beliefPopup,setBeliefPopup]=useState(null);

  // derived
  const cls=allClasses.find(c=>c.id===cid)||{};
  const raceDisplay=()=>getRaceDisplay(race,rv,pmV);
  const totalSpent=()=>ALL_STATS.reduce((a,{key})=>a+POINT_COST(stats[key]),0);
  const remaining=()=>27-totalSpent(); // under standard point-buy for all 8 stats, budget scales: we use 54 for all 8

  // When race changes, initialize alignSlider from race lean
  useEffect(()=>{
    if(race){const rd=RACES.find(r=>r.id===race);if(rd)setAlignSlider(rd.lean||0);}
  },[race]);

  // When class chosen, nudge cp
  useEffect(()=>{
    if(cid){const c=allClasses.find(x=>x.id===cid);if(c){setCp(CLASSES.magic.some(m=>m.id===cid)?'magic':'tech');}}
  },[cid]);

  const adjStat=(k,d)=>{
    const v=stats[k],nv=v+d;
    if(nv<1||nv>20)return;
    setStats(s=>({...s,[k]:nv}));
  };
  const setStat=(k,val)=>{
    const n=parseInt(val);
    if(!isNaN(n)&&n>=1&&n<=20)setStats(s=>({...s,[k]:n}));
  };
  const doGenFn=()=>{const nd=getNameData(race);if(!nd)return;const pool=gender==='m'?nd.m:gender==='f'?nd.f:[...nd.m,...nd.f];setFn(pick(pool));};
  const doGenLn=()=>{const nd=getNameData(race);if(!nd||!nd.s)return;setLn(pick(nd.s));};
  const doGenBackstory=()=>setBackstory(buildBackstory(race,cp,cid,fn,dc,deity,spirit));
  const selDeity=(name)=>{setDeity(name);setDc('god');};
  const selSpirit=(name)=>{setSpirit(name);setDc('spirit');};
  const changeDc=(v)=>{setDc(v);if(v!=='god')setDeity(null);if(v!=='spirit')setSpirit(null);};
  const doRolls=()=>{setRollResults(Array.from({length:8},()=>roll4d6Drop1()));setRollAssign({});setSelectedRoll(null);};
  const assignRoll=(statKey)=>{
    if(selectedRoll===null)return;
    setRollAssign(a=>({...a,[statKey]:selectedRoll}));
    const val=rollResults[selectedRoll].total;
    setStats(s=>({...s,[statKey]:Math.min(20,Math.max(1,val))}));
    setSelectedRoll(null);
  };
  const setActionBonus=(key,val)=>setActionBonuses(a=>({...a,[key]:val}));

  const buildCharObj=()=>({
    id:charId,name:`${fn} ${ln}`.trim()||'Unnamed',fn,ln,age,gender,race,rv,pmV,
    dc,deity,spirit,cp,cid,alignSlider,stats,backstory,notes,morality,
    background,motivation,classBonus,racialFeatures,inventory,apparel,weapons,accessories,actionBonuses,
    charLevel,apCurrent,apTotal,classAbilities,heritageAbilities,disciplinePoints,
    campaign:saveCampaign,savedAt:Date.now(),
  });

  const doSave=()=>{
    const char=buildCharObj();
    saveChar(char);
    setSavedChars(loadSaved());
    setSaveConfirm(true);
    setTimeout(()=>setSaveConfirm(false),3500);
    setShowSaveModal(false);
  };

  const goToCampaign=(campId,char)=>{
    if(char)loadChar(char);
    setCampaignView(campId);
    setAppView('campaign');
  };

  const loadChar=(char,goToSheet=true)=>{
    setCharId(char.id);setFn(char.fn||'');setLn(char.ln||'');setAge(char.age||'');setGender(char.gender||'m');
    setRace(char.race||null);setRv(char.rv||null);setPmV(char.pmV||null);
    setDc(char.dc||'none');setDeity(char.deity||null);setSpirit(char.spirit||null);
    setCp(char.cp||'');setCid(char.cid||null);setAlignSlider(char.alignSlider||0);
    setStats(char.stats||{spirit:8,soul:8,body:8,essence:8,will:8,whim:8,mind:8,dream:8});
    setBackstory(char.backstory||'');setNotes(char.notes||'');setMorality(char.morality||'');
    setBackground(char.background||'');setMotivation(char.motivation||'');
    setClassBonus(char.classBonus||'');setRacialFeatures(char.racialFeatures||'');
    setInventory(char.inventory||{consumables:'',pack:'',coin:'',weight:'',misc:''});
    setApparel(char.apparel||{Head:'',Torso:'',Waist:'',Hands:'',Greaves:'',Boots:''});
    setWeapons(char.weapons||{'Main Hand':'','Off-Hand':'','Side Weapon':'','Heavy':''});
    setAccessories(char.accessories||{'Ring I':'','Ring II':'','Neck':'','Charm':'','Relic':'','Artifact':''});
    setActionBonuses(char.actionBonuses||{});
    setCharLevel(char.charLevel||1);
    setApCurrent(char.apCurrent||0);
    setApTotal(char.apTotal||0);
    setClassAbilities(char.classAbilities||[{id:'ca1',name:'',points:0},{id:'ca2',name:'',points:0},{id:'ca3',name:'',points:0},{id:'ca4',name:'',points:0},{id:'ca5',name:'',points:0}]);
    setHeritageAbilities(char.heritageAbilities||[{id:'ha1',name:'',points:0},{id:'ha2',name:'',points:0},{id:'ha3',name:'',points:0},{id:'ha4',name:'',points:0}]);
    setDisciplinePoints(char.disciplinePoints||{});
    if(goToSheet)setStep(6);
  };

  const loadDC=()=>{
    const d=DEFAULT_CHARS.find(x=>x.id===dcSel);if(!d)return;
    setTaken(t=>new Set([...t,d.id]));
    const parts=d.name.split(' ');setFn(parts[0]);setLn(parts.slice(1).join(' '));
    setRace(null);setCid(null);setCp('');setDeity(null);setSpirit(null);setDc('none');
    setStep(6);
  };

  const resetAll=()=>{
    setCharId(Date.now().toString());setStep(0);setRace(null);setExpandedRace(null);setRv(null);setPmV(null);
    setFn('');setLn('');setAge('');setGender('m');setDc('none');setDeity(null);setSpirit(null);
    setCp('');setCid(null);setAlignSlider(0);
    setStats({spirit:8,soul:8,body:8,essence:8,will:8,whim:8,mind:8,dream:8});
    setManualStats({spirit:'',soul:'',body:'',essence:'',will:'',whim:'',mind:'',dream:''});
    setBackstory('');setNotes('');setMorality('');setBackground('');setMotivation('');
    setClassBonus('');setRacialFeatures('');
    setInventory({consumables:'',pack:'',coin:'',weight:'',misc:''});
    setApparel({Head:'',Torso:'',Waist:'',Hands:'',Greaves:'',Boots:''});
    setWeapons({'Main Hand':'','Off-Hand':'','Side Weapon':'','Heavy':''});
    setAccessories({'Ring I':'','Ring II':'','Neck':'','Charm':'','Relic':'','Artifact':''});
    setActionBonuses({});setRollResults(null);setRollAssign({});
    setCharLevel(1);setApCurrent(0);setApTotal(0);
    setClassAbilities([{id:'ca1',name:'',points:0},{id:'ca2',name:'',points:0},{id:'ca3',name:'',points:0},{id:'ca4',name:'',points:0},{id:'ca5',name:'',points:0}]);
    setHeritageAbilities([{id:'ha1',name:'',points:0},{id:'ha2',name:'',points:0},{id:'ha3',name:'',points:0},{id:'ha4',name:'',points:0}]);
    setDisciplinePoints({});
  };

  // ── SAVE MODAL ──
  const SaveModal=()=>(
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.45)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(4px)'}} onClick={()=>setShowSaveModal(false)}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:24,maxWidth:400,width:'100%',boxShadow:C.shadowLg}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:6}}>Save Character</div>
        <div style={{fontSize:12,color:C.muted,marginBottom:18}}>{fn||'Unnamed'} {ln||''} · {cls.name||'No class'}</div>
        <label style={{...sl,marginBottom:6}}>Assign to campaign (optional)</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:20}}>
          {[{id:'',name:'No campaign',subtitle:'Unassigned'},...CAMPAIGNS].map(c=>(
            <div key={c.id} onClick={()=>setSaveCampaign(c.id)} style={{...cardSel(saveCampaign===c.id),padding:'10px 12px'}}>
              <div style={{fontSize:12,fontWeight:600,color:C.text}}>{c.name}</div>
              {c.subtitle&&<div style={{fontSize:10,color:C.muted,marginTop:2}}>{c.subtitle}</div>}
            </div>
          ))}
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={{...btnPrimary(false),flex:1}} onClick={doSave}>Save character</button>
          <button style={btnGhost} onClick={()=>setShowSaveModal(false)}>Cancel</button>
        </div>
      </div>
    </div>
  );

  // ── STEP 0 — Adventurers ──────────────────────────────────────────────────
  const S0=()=>{
    return (
      <div>
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {[['new','New Character'],['existing','Roster'],['saved','Saved']].map(([id,lbl])=>(
            <button key={id} style={{...btnSmall(activeTab===id),padding:'8px 16px',fontSize:11}} onClick={()=>setActiveTab(id)}>{lbl}</button>
          ))}
        </div>

        {activeTab==='new'&&(
          <div>
            <div style={{background:C.subPanel,borderRadius:12,padding:24,marginBottom:20,border:`1px solid ${C.border}`,boxShadow:C.shadow}}>
              <div style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:6,fontFamily:'Georgia,serif',letterSpacing:'0.02em'}}>Syntarion</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:16,lineHeight:1.6}}>Adventure Companion for the Soteria TTRPG system · Era 178 of the Era of Unity.</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,fontSize:12,color:C.textSub,marginBottom:20}}>
                {[['15 Playable races','with bloodlines & lore'],['14 Classes','magic & tech paths'],['Full stat system','all 8 attributes'],['Save & campaign','assign to sessions']].map(([a,b])=>(
                  <div key={a} style={{background:C.card,borderRadius:8,padding:'10px 12px',border:`1px solid ${C.border}`,boxShadow:C.shadow}}>
                    <div style={{fontWeight:700,color:C.text,marginBottom:2}}>{a}</div>
                    <div style={{fontSize:10,color:C.muted}}>{b}</div>
                  </div>
                ))}
              </div>
              <button style={{...btnPrimary(false),fontSize:12,padding:'11px 24px'}} onClick={()=>setStep(1)}>Begin character creation →</button>
            </div>
          </div>
        )}

        {activeTab==='existing'&&(
          <div>
            {CAMPAIGNS.map(camp=>(
              <div key={camp.id} style={{marginBottom:18}}>
                <div style={{fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:C.blue,marginBottom:8,display:'block',fontWeight:700}}>{camp.name}: {camp.subtitle}</div>
                <div style={{display:'grid',gap:6}}>
                  {DEFAULT_CHARS.filter(d=>d.camp===camp.id).map(d=>{
                    const isTaken=taken.has(d.id),isSel=dcSel===d.id;
                    return(
                      <div key={d.id} onClick={()=>!isTaken&&setDcSel(d.id)} style={{background:isSel?C.blueLight:C.card,border:`1.5px solid ${isSel?C.blueDim:C.border}`,borderRadius:10,padding:'10px 14px',cursor:isTaken?'default':'pointer',opacity:isTaken?0.4:1,display:'flex',alignItems:'center',gap:12,boxShadow:isSel?`0 0 0 3px rgba(59,130,246,0.12)`:C.shadow}}>
                        <div style={{width:36,height:36,borderRadius:9,background:isSel?C.blueDim:C.subPanel,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:isSel?'#fff':C.blue,flexShrink:0}}>{d.name.split(' ').map(w=>w[0]).slice(0,2).join('')}</div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:13,fontWeight:700,color:C.text}}>{d.name}</div>
                          <div style={{fontSize:10,color:C.muted,marginTop:2}}>{d.race} · {d.cls}{d.deity&&d.deity!=='None'?' · '+d.deity:''}</div>
                        </div>
                        {isTaken&&<span style={{fontSize:9,color:C.dim,letterSpacing:'0.06em',textTransform:'uppercase'}}>In play</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {dcSel&&<div style={{marginTop:12}}><button style={btnPrimary(false)} onClick={loadDC}>Load "{DEFAULT_CHARS.find(x=>x.id===dcSel)?.name}" →</button></div>}
          </div>
        )}

        {activeTab==='saved'&&(
          <div>
            {savedChars.length===0?(
              <div style={{...noteStyle,textAlign:'center',padding:24}}>No saved characters yet. Complete character creation and save to see them here.</div>
            ):(
              savedChars.map(char=>(
                <div key={char.id} onClick={()=>loadChar(char)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 16px',marginBottom:8,cursor:'pointer',display:'flex',alignItems:'center',gap:12,boxShadow:C.shadow}}>
                  <div style={{width:36,height:36,borderRadius:9,background:char.cp==='magic'?C.magicBg:C.techBg,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:char.cp==='magic'?C.magicLight:C.techLight,flexShrink:0}}>{(char.fn||'?')[0]}{(char.ln||'?')[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:C.text}}>{char.name}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>
                      {char.race?getRaceDisplay(char.race,char.rv,char.pmV):'No race'}
                      {char.cid?' · '+(allClasses.find(c=>c.id===char.cid)?.name||''):''}
                      {char.campaign?' · '+(CAMPAIGNS.find(c=>c.id===char.campaign)?.name||''):''}
                    </div>
                  </div>
                  <span style={{fontSize:10,color:C.blue,fontWeight:600}}>Load →</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  // ── STEP 1 — Race & Name ──────────────────────────────────────────────────
  const S1=()=>{
    const srd=RACES.find(r=>r.id===race);
    return (
      <div>
        <span style={sl}>Choose your race</span>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(128px,1fr))',gap:8,marginBottom:16}}>
          {RACES.map(r=>{
            const isSelected=race===r.id;
            const isExpanded=expandedRace===r.id;
            return (
              <div key={r.id} style={{gridColumn:isExpanded?'1 / -1':'auto'}}>
                <div
                  style={{background:isSelected?C.blueLight:C.card,border:`1.5px solid ${isSelected?C.blueDim:C.border}`,borderRadius:10,padding:12,cursor:'pointer',boxShadow:isSelected?`0 0 0 3px rgba(59,130,246,0.1),${C.shadow}`:C.shadow,transition:'all 0.15s'}}
                  onClick={()=>{
                    if(isExpanded){setExpandedRace(null);}
                    else{setRace(r.id);setRv(null);setPmV(null);setExpandedRace(r.id);}
                  }}
                >
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:6}}>
                    <div>
                      <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2}}>{r.name}</div>
                      <div style={{fontSize:10,color:C.textSub}}>{r.sub}</div>
                      <div style={{fontSize:9,color:C.muted,marginTop:3,lineHeight:1.45}}>{r.sub2}</div>
                      <span style={tagChip(r.tag)}>{r.tag==='magic'?'Magic':r.tag==='tech'?'Tech':'Any'}</span>
                    </div>
                    {isSelected&&<span style={{fontSize:12,color:C.blue,flexShrink:0}}>{isExpanded?'▲':'▼'}</span>}
                  </div>
                  {isExpanded&&(
                    <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
                      <p style={{fontSize:12,color:C.textSub,lineHeight:1.7,margin:0,marginBottom:r.variants?.length>0||r.isPamorph?14:0}}>{r.desc}</p>
                      {r.variants&&r.variants.length>0&&!r.isPamorph&&(
                        <>
                          <span style={{...sl,marginBottom:8}}>Variant</span>
                          <div style={grid(96)}>
                            {r.variants.map(v=>(
                              <div key={v} style={{background:rv===v?C.blueLight:C.subPanel,border:`1.5px solid ${rv===v?C.blueDim:C.border}`,borderRadius:7,padding:'7px 10px',cursor:'pointer'}} onClick={()=>setRv(rv===v?null:v)}>
                                <div style={{fontSize:11,color:C.text,fontWeight:600}}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {r.isPamorph&&(
                        <>
                          <span style={{...sl,marginBottom:8}}>Major bloodlines</span>
                          <div style={grid(100)}>
                            {PM_MAJ.map(p=>(
                              <div key={p.id} style={{background:pmV===p.id?C.blueLight:C.subPanel,border:`1.5px solid ${pmV===p.id?C.blueDim:C.border}`,borderRadius:7,padding:'7px 10px',cursor:'pointer'}} onClick={()=>setPmV(pmV===p.id?null:p.id)}>
                                <div style={{fontSize:11,color:C.text,fontWeight:600}}>{p.name}</div>
                                <div style={{fontSize:9,color:C.muted,marginTop:1}}>{p.sub}</div>
                              </div>
                            ))}
                          </div>
                          <span style={{...sl,marginTop:10,marginBottom:8}}>Minor bloodlines</span>
                          <div style={grid(100)}>
                            {PM_MIN.map(p=>(
                              <div key={p.id} style={{background:pmV===p.id?C.blueLight:C.subPanel,border:`1.5px solid ${pmV===p.id?C.blueDim:C.border}`,borderRadius:7,padding:'7px 10px',cursor:'pointer'}} onClick={()=>setPmV(pmV===p.id?null:p.id)}>
                                <div style={{fontSize:11,color:C.text,fontWeight:600}}>{p.name}</div>
                                <div style={{fontSize:9,color:C.muted,marginTop:1}}>{p.sub}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {race&&(
          <div style={{background:C.subPanel,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:16,boxShadow:C.shadow}}>
            <span style={sl}>Name your character</span>
            <div style={{display:'flex',gap:6,marginBottom:12}}>
              {['m','f','n'].map(g=><button key={g} style={btnSmall(gender===g)} onClick={()=>setGender(g)}>{g==='m'?'Male':g==='f'?'Female':'Other'}</button>)}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
              <div>
                <label style={{...sl,marginBottom:5}}>First name</label>
                <button style={{...btnSmall(false),width:'100%',textAlign:'center',marginBottom:5,display:'block'}} onClick={doGenFn}>✦ Generate</button>
                <input style={inp} value={fn} onChange={e=>setFn(e.target.value)} placeholder="Enter…"/>
              </div>
              <div>
                <label style={{...sl,marginBottom:5}}>Last name / Clan</label>
                <button style={{...btnSmall(false),width:'100%',textAlign:'center',marginBottom:5,display:'block'}} onClick={doGenLn}>✦ Generate</button>
                <input style={inp} value={ln} onChange={e=>setLn(e.target.value)} placeholder="Enter…"/>
              </div>
              <div>
                <label style={{...sl,marginBottom:5}}>Age</label>
                <div style={{height:31,marginBottom:5}}/>
                <input style={inp} value={age} onChange={e=>setAge(e.target.value)} placeholder="Optional"/>
              </div>
            </div>
          </div>
        )}
        <div style={nav}>
          <button style={btnGhost} onClick={()=>setStep(0)}>← Back</button>
          <button style={btnPrimary(!race||!fn)} disabled={!race||!fn} onClick={()=>setStep(2)}>Belief →</button>
        </div>
      </div>
    );
  };

  // ── STEP 2 — Belief ───────────────────────────────────────────────────────
  const S2=()=>{
    return (
      <div>
        {beliefPopup&&(
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:20,backdropFilter:'blur(4px)'}} onClick={()=>setBeliefPopup(null)}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:24,maxWidth:440,width:'100%',boxShadow:C.shadowLg}} onClick={e=>e.stopPropagation()}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div>
                  <div style={{fontSize:17,fontWeight:800,color:C.text}}>{beliefPopup.name}</div>
                  <div style={{fontSize:11,color:C.blue,marginTop:3,letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:600}}>{beliefPopup.domain}</div>
                </div>
                <button style={{background:C.subPanel,border:`1px solid ${C.border}`,borderRadius:6,color:C.muted,fontSize:14,cursor:'pointer',padding:'2px 8px'}} onClick={()=>setBeliefPopup(null)}>✕</button>
              </div>
              <div style={{fontSize:10,color:C.dim,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600,marginBottom:10}}>{beliefPopup.affil}</div>
              <p style={{fontSize:13,color:C.textSub,lineHeight:1.7,margin:0}}>{beliefPopup.desc}</p>
              <div style={{marginTop:18,display:'flex',gap:8}}>
                <button style={{...btnPrimary(false),flex:1}} onClick={()=>{dc==='spirit'?selSpirit(beliefPopup.name):selDeity(beliefPopup.name);setBeliefPopup(null);}}>Choose {beliefPopup.name}</button>
                <button style={btnGhost} onClick={()=>setBeliefPopup(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        <div style={noteStyle}>Choose a patron god <strong style={{color:C.blueText}}>(Sanctus)</strong> or a spirit <strong style={{color:C.techLight}}>(Sacral)</strong>. Tap any name to learn more before choosing.</div>
        <div style={{display:'flex',gap:8,marginBottom:18}}>
          {[['god','Patron God','Sanctus'],['spirit','Spirit','Sacral'],['none','Unaffiliated','']].map(([v,lbl,sub])=>(
            <button key={v} style={{flex:1,padding:'10px 8px',borderRadius:9,fontSize:11,cursor:'pointer',border:`1.5px solid ${dc===v?(v==='spirit'?C.tech:C.blue):C.border}`,background:dc===v?(v==='spirit'?C.techBg:C.blueLight):C.card,color:dc===v?(v==='spirit'?C.techLight:C.blueText):C.muted,fontWeight:dc===v?700:400,boxShadow:C.shadow,textAlign:'center',letterSpacing:'0.03em'}} onClick={()=>changeDc(v)}>
              <div>{lbl}</div>
              {sub&&<div style={{fontSize:9,opacity:0.7,marginTop:2,letterSpacing:'0.08em',textTransform:'uppercase'}}>{sub}</div>}
            </button>
          ))}
        </div>
        {dc==='god'&&GODS.map(g=>(
          <div key={g.label} style={{marginBottom:16}}>
            <span style={sl}>{g.label}</span>
            <div style={grid(110)}>
              {g.list.map(d=>(
                <div key={d.name} style={{background:deity===d.name?C.blueLight:C.card,border:`1.5px solid ${deity===d.name?C.blueDim:C.border}`,borderRadius:9,padding:'10px 12px',cursor:'pointer',boxShadow:C.shadow}} onClick={()=>setBeliefPopup(d)}>
                  <div style={{fontSize:12,color:C.text,fontWeight:700}}>{d.name}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:3}}>{d.domain}</div>
                  <div style={{fontSize:9,color:C.blue,marginTop:4,fontStyle:'italic'}}>tap to learn more</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {dc==='spirit'&&SPIRITS.map(g=>(
          <div key={g.label} style={{marginBottom:16}}>
            <span style={sl}>{g.label}</span>
            <div style={grid(110)}>
              {g.list.map(d=>(
                <div key={d.name} style={{background:spirit===d.name?C.techBg:C.card,border:`1.5px solid ${spirit===d.name?C.tech:C.border}`,borderRadius:9,padding:'10px 12px',cursor:'pointer',boxShadow:C.shadow}} onClick={()=>setBeliefPopup(d)}>
                  <div style={{fontSize:12,color:C.text,fontWeight:700}}>{d.name}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:3}}>{d.domain}</div>
                  <div style={{fontSize:9,color:C.tech,marginTop:4,fontStyle:'italic'}}>tap to learn more</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {(deity||spirit)&&<div style={{...noteStyle,marginTop:8}}>Selected: <strong>{deity||spirit}</strong></div>}
        <div style={nav}>
          <button style={btnGhost} onClick={()=>setStep(1)}>← Back</button>
          <button style={btnPrimary(false)} onClick={()=>setStep(3)}>Class →</button>
        </div>
      </div>
    );
  };

  // ── STEP 3 — Class ────────────────────────────────────────────────────────
  const S3=()=>{
    // Only show a gentle note when spirit is selected but class is non-Sacral — not an error
    const sacralNote=dc==='spirit'&&cid&&!CLASSES.magic.find(c=>c.id===cid&&c.isSacral);
    // No zealot warning — all class/belief combos are valid
    const ClassCard=({c,path})=>(
      <div style={{background:cid===c.id?(path==='magic'?C.magicBg:C.techBg):C.card,border:`1.5px solid ${cid===c.id?(path==='magic'?C.magic:C.tech):C.border}`,borderRadius:10,padding:12,cursor:'pointer',boxShadow:cid===c.id?`0 0 0 3px ${path==='magic'?'rgba(124,58,237,0.1)':'rgba(5,150,105,0.1)'},${C.shadow}`:C.shadow,transition:'all 0.12s'}} onClick={()=>{setCp(path);setCid(c.id);}}>
        <div style={{fontSize:12,fontWeight:700,color:C.text,marginBottom:2}}>{c.name}</div>
        <div style={{fontSize:10,color:C.muted}}>{c.path}</div>
        <div style={{fontSize:9,color:C.dim,marginTop:2}}>{c.stats}</div>
        <div style={{marginTop:6,display:'flex',gap:4,flexWrap:'wrap'}}>
          <span style={{...tagChip(path),marginTop:0}}>{path==='magic'?'Magic':'Tech'} · {c.disc}</span>
        </div>
        <div style={{fontSize:9,color:C.dim,marginTop:6}}>T2: {c.t2}</div>
        <div style={{fontSize:9,color:C.dim,marginTop:2}}>T3: {c.t3}</div>
      </div>
    );
    const infoNote={fontSize:11,color:C.muted,padding:'9px 13px',background:C.subPanel,borderRadius:8,borderLeft:`3px solid ${C.dim}`,marginBottom:14,lineHeight:1.55};
    return (
      <div>
        {sacralNote&&<div style={infoNote}>Spirit-bonded characters have a natural affinity with the Zealot (Sacral) class, but any class pairing is valid.</div>}
        <span style={sl}>Magic path</span>
        <div style={grid()}>{CLASSES.magic.map(c=><ClassCard key={c.id} c={c} path="magic"/>)}</div>
        <span style={sl}>Tech path</span>
        <div style={grid()}>{CLASSES.tech.map(c=><ClassCard key={c.id} c={c} path="tech"/>)}</div>
        <div style={nav}>
          <button style={btnGhost} onClick={()=>setStep(2)}>← Back</button>
          <button style={btnPrimary(!cid)} disabled={!cid} onClick={()=>setStep(4)}>Stats →</button>
        </div>
      </div>
    );
  };

  // ── STEP 4 — Stats (ALL 8, Point Buy / Roll / Manual) ────────────────────
  const S4=()=>{
    const totalPts=ALL_STATS.reduce((a,{key})=>a+POINT_COST(stats[key]),0);
    const budget=54; // 27 × 2 for all 8 stats
    const rem=budget-totalPts;
    const magicStats=ALL_STATS.filter(s=>s.axis==='magic');
    const techStats=ALL_STATS.filter(s=>s.axis==='tech');
    const assignedRolls=new Set(Object.values(rollAssign));
    const allAssigned=rollResults&&Object.keys(rollAssign).length>=8;

    const StatRow=({statDef})=>{
      const {key,label,equiv}=statDef;
      const v=stats[key];
      const pct=Math.round((v-1)/19*100);
      const assignedIdx=Object.entries(rollAssign).find(([sk])=>sk===key)?.[1];
      return (
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'10px 13px',boxShadow:C.shadow,marginBottom:6}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:110,flexShrink:0}}>
              <div style={{fontSize:11,fontWeight:700,color:C.text}}>{label}</div>
              <div style={{fontSize:9,color:C.dim}}>{equiv}</div>
            </div>
            {statMode==='buy'&&(
              <>
                <div style={{flex:1,height:4,background:C.subPanel,borderRadius:2,overflow:'hidden'}}>
                  <div style={{height:'100%',borderRadius:2,width:`${Math.round((v-8)/6*100)}%`,background:statDef.axis==='magic'?C.magic:C.tech,transition:'width 0.15s'}}/>
                </div>
                <button style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.subPanel,color:v<=1?C.dim:C.blue,fontSize:15,cursor:v<=1?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}} onClick={()=>adjStat(key,-1)}>−</button>
                <span style={{fontSize:14,fontWeight:800,color:C.text,minWidth:22,textAlign:'center'}}>{v}</span>
                <button style={{width:26,height:26,borderRadius:6,border:`1px solid ${C.border}`,background:C.subPanel,color:(rem<=0&&v<20)?C.dim:C.blue,fontSize:15,cursor:(rem<=0&&v<20)?'default':'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}} onClick={()=>adjStat(key,1)}>+</button>
              </>
            )}
            {statMode==='roll'&&rollResults&&(
              <>
                <div style={{flex:1}}/>
                <div style={{background:assignedIdx!==undefined?C.blueLight:C.subPanel,border:`1.5px solid ${assignedIdx!==undefined?C.blueDim:C.border}`,borderRadius:7,padding:'4px 10px',cursor:selectedRoll!==null?'pointer':'default',minWidth:44,textAlign:'center',fontWeight:700,fontSize:14,color:assignedIdx!==undefined?C.blueText:C.dim}} onClick={()=>assignRoll(key)}>
                  {v}
                </div>
              </>
            )}
            {statMode==='manual'&&(
              <>
                <div style={{flex:1}}/>
                <input
                  style={{...inp,width:64,textAlign:'center',fontSize:14,fontWeight:700,padding:'5px 8px'}}
                  type="number" min="1" max="20"
                  value={manualStats[key]||v}
                  onChange={e=>{
                    setManualStats(m=>({...m,[key]:e.target.value}));
                    setStat(key,e.target.value);
                  }}
                />
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div>
        <div style={{display:'flex',gap:8,marginBottom:16}}>
          {[['buy','Point Buy'],['roll','Roll Stats'],['manual','Manual Entry']].map(([id,lbl])=>(
            <button key={id} style={btnSmall(statMode===id)} onClick={()=>setStatMode(id)}>{lbl}</button>
          ))}
        </div>

        {statMode==='buy'&&(
          <div style={{fontSize:11,color:C.muted,textAlign:'right',marginBottom:14}}>
            Points remaining: <strong style={{color:rem<0?C.warn:C.blue}}>{rem}</strong> / {budget}
          </div>
        )}
        {statMode==='roll'&&!rollResults&&(
          <div style={noteStyle}>Roll 4d6 and drop the lowest for all 8 stats. Select a roll result, then click a stat to assign it.</div>
        )}
        {statMode==='roll'&&(
          <button style={{...btnPrimary(false),marginBottom:14}} onClick={doRolls}>✦ Roll 4d6 Drop Lowest (8 dice)</button>
        )}
        {statMode==='manual'&&<div style={noteStyle}>Enter any values between 1–20. DM discretion applies.</div>}

        {statMode==='roll'&&rollResults&&(
          <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:16}}>
            {rollResults.map((r,i)=>{
              const isAssigned=assignedRolls.has(i);
              const isSel=selectedRoll===i;
              return (
                <div key={i} onClick={()=>!isAssigned&&setSelectedRoll(isSel?null:i)} style={{background:isSel?C.blueLight:isAssigned?C.subPanel:C.card,border:`1.5px solid ${isSel?C.blueDim:isAssigned?C.dim:C.border}`,borderRadius:9,padding:'10px 14px',cursor:isAssigned?'default':'pointer',opacity:isAssigned?0.45:1,minWidth:52,textAlign:'center',boxShadow:C.shadow}}>
                  <div style={{fontSize:20,fontWeight:800,color:C.text}}>{r.total}</div>
                  {isAssigned&&<div style={{fontSize:9,color:C.dim,marginTop:2}}>used</div>}
                </div>
              );
            })}
          </div>
        )}
        {statMode==='roll'&&selectedRoll!==null&&rollResults&&(
          <div style={{...noteStyle,marginBottom:12}}>Roll selected: <strong>{rollResults[selectedRoll].total}</strong> — click a stat below to assign</div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
          <div>
            <span style={{...sl,color:C.magicLight}}>Magic / Spiritual axis</span>
            {magicStats.map(s=><StatRow key={s.key} statDef={s}/>)}
          </div>
          <div>
            <span style={{...sl,color:C.techLight}}>Tech / Mortal axis</span>
            {techStats.map(s=><StatRow key={s.key} statDef={s}/>)}
          </div>
        </div>

        <div style={{marginTop:16,padding:12,background:C.subPanel,borderRadius:10,border:`1px solid ${C.border}`}}>
          <div style={{fontSize:10,color:C.muted,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:8}}>Stat equivalents</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'2px 16px'}}>
            {ALL_STATS.map(({key,label,equiv})=>(
              <div key={key} style={{display:'flex',justifyContent:'space-between',fontSize:10,padding:'2px 0',borderBottom:`1px solid ${C.border}`}}>
                <span style={{color:C.textSub,fontWeight:600}}>{label}</span>
                <span style={{color:C.muted}}>{equiv}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={nav}>
          <button style={btnGhost} onClick={()=>setStep(3)}>← Back</button>
          <button style={btnPrimary(false)} onClick={()=>setStep(5)}>Backstory →</button>
        </div>
      </div>
    );
  };

  // ── STEP 5 — Backstory ────────────────────────────────────────────────────
  const S5=()=>(
    <div>
      <span style={sl}>Character backstory</span>
      <div style={noteStyle}>Write your own or generate one from your choices. Generated backstories include a starting boon.</div>
      {race&&cid
        ?<button style={{...btnPrimary(false),marginBottom:14,display:'inline-block'}} onClick={doGenBackstory}>✦ Generate backstory & boon</button>
        :<div style={warnNote}>Complete race and class selection first to use the generator.</div>
      }
      {backstory&&(
        <div style={{background:C.subPanel,border:`1px solid ${C.border}`,borderRadius:10,padding:16,marginBottom:14,boxShadow:C.shadow}}>
          {backstory.split('\n\n').map((para,i)=>(
            <p key={i} style={{fontSize:12,color:para.startsWith('▸')?C.techLight:C.textSub,lineHeight:1.8,margin:0,marginBottom:i<backstory.split('\n\n').length-1?12:0,fontStyle:para.startsWith('▸')?'normal':'italic',fontWeight:para.startsWith('▸')?700:400}}>{para}</p>
          ))}
        </div>
      )}
      <label style={{...sl,marginBottom:6}}>Edit backstory</label>
      <textarea style={{...ta,minHeight:120}} value={backstory} onChange={e=>setBackstory(e.target.value)} placeholder="Enter or refine your character's backstory…"/>
      <div style={nav}>
        <button style={btnGhost} onClick={()=>setStep(4)}>← Back</button>
        <button style={btnPrimary(false)} onClick={()=>setStep(6)}>Character sheet →</button>
      </div>
    </div>
  );

  // ── STEP 6 — Sheet ────────────────────────────────────────────────────────
  const S6=()=>{
    const vitals=stats['body'];
    const stamina=stats['whim'];
    const resolve=stats['soul'];

    const TabBtn=({id,label})=>(
      <button style={{padding:'9px 14px',fontSize:11,letterSpacing:'0.04em',fontWeight:id===sheetTab?700:500,cursor:'pointer',border:'none',borderBottom:`2px solid ${sheetTab===id?C.blue:'transparent'}`,background:'transparent',color:sheetTab===id?C.blue:C.muted,transition:'color 0.1s'}} onClick={()=>setSheetTab(id)}>{label}</button>
    );
    const StatBlock=({label,value,sub})=>(
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'10px 12px',boxShadow:C.shadow}}>
        <div style={{fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',color:C.dim,fontWeight:600,marginBottom:3}}>{label}</div>
        <div style={{fontSize:20,fontWeight:800,color:C.text}}>{value}</div>
        {sub&&<div style={{fontSize:9,color:C.muted,marginTop:2}}>{sub}</div>}
      </div>
    );
    const ActionRow=({label})=>(
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'5px 0',borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:10,color:C.textSub,flex:1}}>{label}</span>
        <input style={{...inp,width:44,padding:'3px 7px',fontSize:10,textAlign:'center'}} value={actionBonuses[label]||''} onChange={e=>setActionBonus(label,e.target.value)} placeholder="+0"/>
      </div>
    );
    const SlotRow=({label,value,onChange})=>(
      <div style={{display:'flex',alignItems:'center',gap:10,padding:'5px 0',borderBottom:`1px solid ${C.border}`}}>
        <span style={{fontSize:10,color:C.muted,width:78,flexShrink:0,fontWeight:500}}>{label}</span>
        <input style={{...inp,padding:'4px 8px',fontSize:10}} value={value} onChange={e=>onChange(e.target.value)} placeholder="—"/>
      </div>
    );

    // alignment slider: -4 = full magic, +4 = full tech, 0 = neutral
    const sliderPct=((alignSlider+4)/8)*100;
    const sliderColor=alignSlider<0?C.magic:alignSlider>0?C.tech:C.blue;

    return (
      <div>
        <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,marginBottom:18,gap:2}}>
          <TabBtn id="identity" label="Identity"/>
          <TabBtn id="background" label="Background"/>
          <TabBtn id="actions" label="Actions"/>
          <TabBtn id="inventory" label="Inventory"/>
        </div>

        {sheetTab==='identity'&&(
          <div>

            {/* ── TOP ROW: Character identity + Level + AP ── */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:'16px 18px',marginBottom:14,boxShadow:C.shadow}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr auto auto',gap:14,alignItems:'start'}}>
                <div>
                  <label style={{...sl,marginBottom:4}}>Name</label>
                  <div style={{fontSize:17,fontWeight:800,color:C.text,lineHeight:1.2}}>{fn||'—'} {ln||''}</div>
                </div>
                <div>
                  <label style={{...sl,marginBottom:4}}>Race</label>
                  <div style={{fontSize:13,color:C.textSub,fontWeight:500}}>{raceDisplay()}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>{age?`Age ${age}`:''}</div>
                </div>
                <div>
                  <label style={{...sl,marginBottom:4}}>Class · Discipline</label>
                  <div style={{fontSize:13,color:C.textSub,fontWeight:600}}>{cls.name||'—'} · {cls.disc||'—'}</div>
                  <div style={{fontSize:10,color:C.muted,marginTop:2}}>T2: {cls.t2||'—'}</div>
                </div>

                {/* LEVEL — prominent, DM-editable */}
                <div style={{textAlign:'center',minWidth:72}}>
                  <label style={{...sl,marginBottom:6,textAlign:'center',display:'block'}}>Level</label>
                  <div style={{position:'relative',display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                    <div style={{width:58,height:58,borderRadius:12,background:C.blueLight,border:`2px solid ${C.blueDim}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 0 3px rgba(59,130,246,0.1)`}}>
                      <input
                        type="number" min={1} max={20} value={charLevel}
                        onChange={e=>{const n=parseInt(e.target.value);if(n>=1&&n<=20)setCharLevel(n);}}
                        style={{width:46,textAlign:'center',fontSize:22,fontWeight:800,color:C.blueText,background:'transparent',border:'none',outline:'none',padding:0}}
                      />
                    </div>
                    <div style={{fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',color:C.blue,fontWeight:700,marginTop:4}}>of 20</div>
                  </div>
                </div>

                {/* AP — current / total, both DM-editable */}
                <div style={{textAlign:'center',minWidth:100}}>
                  <label style={{...sl,marginBottom:6,textAlign:'center',display:'block'}}>AP</label>
                  <div style={{background:C.subPanel,border:`1.5px solid ${C.border}`,borderRadius:12,padding:'8px 12px',boxShadow:C.shadow}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4}}>
                      <input
                        type="number" min={0} max={999} value={apCurrent}
                        onChange={e=>{const n=parseInt(e.target.value)||0;setApCurrent(Math.max(0,n));}}
                        style={{width:36,textAlign:'center',fontSize:18,fontWeight:800,color:C.text,background:'transparent',border:'none',outline:'none',padding:0}}
                      />
                      <span style={{fontSize:14,color:C.dim,fontWeight:400}}>/</span>
                      <input
                        type="number" min={0} max={999} value={apTotal}
                        onChange={e=>{const n=parseInt(e.target.value)||0;setApTotal(Math.max(0,n));}}
                        style={{width:36,textAlign:'center',fontSize:18,fontWeight:800,color:C.muted,background:'transparent',border:'none',outline:'none',padding:0}}
                      />
                    </div>
                    <div style={{fontSize:8,letterSpacing:'0.09em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginTop:3,textAlign:'center'}}>Spent / Pool</div>
                  </div>
                </div>
              </div>

              {/* Belief strip */}
              <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${C.border}`,display:'flex',gap:10,alignItems:'center'}}>
                <span style={{...sl,marginBottom:0,marginRight:4}}>Belief</span>
                <span style={{fontSize:12,color:C.textSub,fontWeight:500}}>{dc==='god'?`God: ${deity||'—'}`:dc==='spirit'?`Spirit: ${spirit||'—'}`:'Unaffiliated'}</span>
                <span style={{fontSize:10,color:C.muted}}>·</span>
                <span style={{fontSize:11,color:alignSlider<0?C.magicLight:alignSlider>0?C.techLight:C.muted,fontWeight:600}}>{alignSlider===0?'Neutral':alignSlider<0?`Magic ${Math.abs(alignSlider)}`:`Tech ${alignSlider}`}</span>
              </div>
            </div>

            {/* ── VITALITY POOLS ── */}
            <span style={sl}>Vitality pools</span>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:8,marginBottom:14}}>
              <StatBlock label="Vitals" value={vitals} sub="Body / Will"/>
              <StatBlock label="Stamina" value={stamina} sub="Whim / Dex"/>
              <StatBlock label="Resolve" value={resolve} sub="Soul / Faith"/>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'10px 12px',boxShadow:C.shadow}}>
                <div style={{fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',color:C.dim,fontWeight:600,marginBottom:4}}>Morality</div>
                <input style={{...inp,fontSize:11,padding:'4px 7px'}} value={morality} onChange={e=>setMorality(e.target.value)} placeholder="—"/>
              </div>
            </div>

            {/* ── ABILITY SCORES + CLASS/HERITAGE ABILITIES side by side ── */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>

              {/* Left: all 8 stats */}
              <div>
                <span style={sl}>Ability scores</span>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',boxShadow:C.shadow}}>
                  {ALL_STATS.map(({key,label,equiv,axis},idx)=>{
                    const val=stats[key];
                    const pct=Math.round((val-1)/19*100);
                    const col=axis==='magic'?C.magic:C.tech;
                    return(
                      <div key={key} style={{display:'grid',gridTemplateColumns:'90px 1fr 28px',alignItems:'center',gap:8,padding:'5px 0',borderBottom:idx<7?`1px solid ${C.border}`:'none'}}>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:C.text}}>{label}</div>
                          <div style={{fontSize:8,color:C.muted}}>{equiv}</div>
                        </div>
                        <div style={{height:4,background:C.subPanel,borderRadius:2,overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:2}}/>
                        </div>
                        <div style={{fontSize:15,fontWeight:800,color:C.text,textAlign:'right'}}>{val}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: Class abilities + Heritage abilities */}
              <div style={{display:'flex',flexDirection:'column',gap:10}}>

                {/* Class Abilities */}
                <div>
                  <span style={sl}>Class abilities</span>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',boxShadow:C.shadow}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:6,alignItems:'center',marginBottom:6}}>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:600}}>Ability</div>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:600,textAlign:'center',width:44}}>Pts</div>
                    </div>
                    {classAbilities.map((ab,i)=>(
                      <div key={ab.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:6,alignItems:'center',marginBottom:i<classAbilities.length-1?5:0}}>
                        <input
                          style={{...inp,padding:'5px 8px',fontSize:11}}
                          value={ab.name}
                          onChange={e=>setClassAbilities(prev=>prev.map((x,j)=>j===i?{...x,name:e.target.value}:x))}
                          placeholder={`Class ability ${i+1}…`}
                        />
                        <input
                          type="number" min={0} max={99}
                          value={ab.points}
                          onChange={e=>setClassAbilities(prev=>prev.map((x,j)=>j===i?{...x,points:parseInt(e.target.value)||0}:x))}
                          style={{width:44,textAlign:'center',fontSize:13,fontWeight:700,color:C.blue,background:C.blueLight,border:`1.5px solid ${C.blueDim}`,borderRadius:7,padding:'5px 4px',outline:'none'}}
                        />
                      </div>
                    ))}
                    <button
                      style={{...btnGhost,marginTop:8,width:'100%',textAlign:'center',fontSize:10,padding:'5px 0'}}
                      onClick={()=>setClassAbilities(prev=>[...prev,{id:`ca${Date.now()}`,name:'',points:0}])}
                    >+ Add ability</button>
                  </div>
                </div>

                {/* Heritage (Race) Abilities */}
                <div>
                  <span style={sl}>Heritage abilities</span>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 12px',boxShadow:C.shadow}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:6,alignItems:'center',marginBottom:6}}>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:600}}>Ability</div>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:'0.06em',textTransform:'uppercase',fontWeight:600,textAlign:'center',width:44}}>Pts</div>
                    </div>
                    {heritageAbilities.map((ab,i)=>(
                      <div key={ab.id} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:6,alignItems:'center',marginBottom:i<heritageAbilities.length-1?5:0}}>
                        <input
                          style={{...inp,padding:'5px 8px',fontSize:11}}
                          value={ab.name}
                          onChange={e=>setHeritageAbilities(prev=>prev.map((x,j)=>j===i?{...x,name:e.target.value}:x))}
                          placeholder={`Heritage ability ${i+1}…`}
                        />
                        <input
                          type="number" min={0} max={99}
                          value={ab.points}
                          onChange={e=>setHeritageAbilities(prev=>prev.map((x,j)=>j===i?{...x,points:parseInt(e.target.value)||0}:x))}
                          style={{width:44,textAlign:'center',fontSize:13,fontWeight:700,color:C.tech,background:C.techBg,border:`1.5px solid ${C.tech}`,borderRadius:7,padding:'5px 4px',outline:'none'}}
                        />
                      </div>
                    ))}
                    <button
                      style={{...btnGhost,marginTop:8,width:'100%',textAlign:'center',fontSize:10,padding:'5px 0'}}
                      onClick={()=>setHeritageAbilities(prev=>[...prev,{id:`ha${Date.now()}`,name:'',points:0}])}
                    >+ Add ability</button>
                  </div>
                </div>

              </div>
            </div>

            {/* ── DISCIPLINES with point boxes ── */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              {[
                ['Magic disciplines', MAGIC_DISCIPLINES, C.magicChip, C.magicLight, C.magicBg, C.magic],
                ['Tech disciplines',  TECH_DISCIPLINES,  C.techChip,  C.techLight,  C.techBg,  C.tech],
              ].map(([title,list,chipBg,chipColor,ptBg,ptBorder])=>(
                <div key={title}>
                  <span style={sl}>{title}</span>
                  <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,boxShadow:C.shadow,overflow:'hidden'}}>
                    {/* column headers */}
                    <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,alignItems:'center',padding:'6px 12px',background:C.subPanel,borderBottom:`1px solid ${C.border}`}}>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600}}>Discipline</div>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600,width:52,textAlign:'center'}}>Disc.</div>
                      <div style={{fontSize:9,color:C.dim,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:600,width:44,textAlign:'center'}}>Pts</div>
                    </div>
                    {list.map((d,i)=>(
                      <div key={d.key} style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:8,alignItems:'center',padding:'7px 12px',borderBottom:i<list.length-1?`1px solid ${C.border}`:'none'}}>
                        <span style={{fontSize:11,color:C.textSub,fontWeight:500}}>{d.name}</span>
                        <span style={{background:chipBg,color:chipColor,padding:'2px 8px',borderRadius:10,fontSize:9,fontWeight:700,width:52,textAlign:'center',display:'block'}}>{d.disc}</span>
                        <input
                          type="number" min={0} max={999}
                          value={disciplinePoints[d.key]||0}
                          onChange={e=>setDisciplinePoints(prev=>({...prev,[d.key]:parseInt(e.target.value)||0}))}
                          style={{width:44,textAlign:'center',fontSize:13,fontWeight:700,color:ptBorder,background:ptBg,border:`1.5px solid ${ptBorder}`,borderRadius:7,padding:'4px 4px',outline:'none',opacity:0.85}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* ── ALIGNMENT SLIDER ── */}
            <span style={sl}>Magic ↔ Tech alignment</span>
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:'14px 16px',marginBottom:14,boxShadow:C.shadow}}>
              <div style={{position:'relative',marginBottom:10}}>
                <div style={{height:8,borderRadius:4,background:`linear-gradient(to right, ${C.magic}, #a78bfa, ${C.blue}, #34d399, ${C.tech})`,opacity:0.3,position:'absolute',top:0,left:0,right:0}}/>
                <div style={{height:8,borderRadius:4,background:C.subPanel}}/>
                <div style={{position:'absolute',top:-3,left:`calc(${sliderPct}% - 8px)`,width:14,height:14,borderRadius:'50%',background:sliderColor,border:'2px solid #fff',boxShadow:C.shadowMd,cursor:'pointer'}}/>
                <input type="range" min={-4} max={4} step={1} value={alignSlider} onChange={e=>setAlignSlider(parseInt(e.target.value))} style={{position:'absolute',top:0,left:0,width:'100%',height:8,opacity:0,cursor:'pointer',margin:0,padding:0}}/>
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:700,marginTop:6}}>
                <span style={{color:C.magicLight}}>◀ Magic</span>
                <span style={{color:sliderColor,fontWeight:800,fontSize:10}}>{alignSlider===0?'Neutral':alignSlider<0?`Magic ${Math.abs(alignSlider)}`:`Tech ${alignSlider}`}</span>
                <span style={{color:C.techLight}}>Tech ▶</span>
              </div>
            </div>

            {backstory&&(
              <>
                <span style={sl}>Backstory</span>
                <div style={{background:C.subPanel,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 14px',marginBottom:14,boxShadow:C.shadow}}>
                  {backstory.split('\n\n').map((para,i)=>(
                    <p key={i} style={{fontSize:11,color:para.startsWith('▸')?C.techLight:C.textSub,lineHeight:1.7,margin:0,marginBottom:i<backstory.split('\n\n').length-1?10:0,fontStyle:para.startsWith('▸')?'normal':'italic',fontWeight:para.startsWith('▸')?700:400}}>{para}</p>
                  ))}
                </div>
              </>
            )}
            <span style={sl}>Session notes</span>
            <textarea style={{...ta,minHeight:70}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Session notes, conditions, special traits…"/>
          </div>
        )}

        {sheetTab==='background'&&(
          <div>
            <span style={sl}>Background</span>
            <textarea style={{...ta,minHeight:80,marginBottom:14}} value={background} onChange={e=>setBackground(e.target.value)} placeholder="Character background and origin…"/>
            <span style={sl}>Motivation</span>
            <textarea style={{...ta,minHeight:60,marginBottom:14}} value={motivation} onChange={e=>setMotivation(e.target.value)} placeholder="What drives this character forward?"/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <span style={sl}>Class bonus features</span>
                <textarea style={{...ta,minHeight:80}} value={classBonus} onChange={e=>setClassBonus(e.target.value)} placeholder="Class bonus features granted by your DM or path…"/>
              </div>
              <div>
                <span style={sl}>Racial features</span>
                <textarea style={{...ta,minHeight:80}} value={racialFeatures} onChange={e=>setRacialFeatures(e.target.value)} placeholder="Racial traits and abilities…"/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <div>
                <span style={sl}>Alignment</span>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'10px 12px',boxShadow:C.shadow,fontSize:11,color:C.textSub}}>
                  <div style={{marginBottom:4,display:'flex',justifyContent:'space-between'}}><span style={{color:C.muted}}>Path</span><span style={{fontWeight:700,color:cp===('magic')?C.magicLight:cp==='tech'?C.techLight:C.muted}}>{cp?cp.charAt(0).toUpperCase()+cp.slice(1):'—'}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.muted}}>Alignment score</span><span style={{fontWeight:700,color:sliderColor}}>{alignSlider===0?'Neutral':alignSlider<0?`Magic ${Math.abs(alignSlider)}`:`Tech ${alignSlider}`}</span></div>
                </div>
              </div>
              <div>
                <span style={sl}>Belief</span>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'10px 12px',boxShadow:C.shadow,fontSize:11,color:C.textSub}}>
                  <div style={{marginBottom:4,display:'flex',justifyContent:'space-between'}}><span style={{color:C.muted}}>Type</span><span style={{fontWeight:700}}>{dc==='none'?'Unaffiliated':dc==='god'?'God (Sanctus)':'Spirit (Sacral)'}</span></div>
                  <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:C.muted}}>Name</span><span style={{fontWeight:700,color:C.blue}}>{deity||spirit||'—'}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {sheetTab==='actions'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              <div>
                {[['Universal',ACTIONS.universal],['Magic actions',ACTIONS.magic],['Defense',ACTIONS.defense],['Alignment',ACTIONS.alignment]].map(([title,list])=>(
                  <div key={title} style={{marginBottom:14}}>
                    <span style={sl}>{title}</span>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'8px 12px',boxShadow:C.shadow}}>
                      {list.map(a=><ActionRow key={a} label={a}/>)}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                {[['Combat',ACTIONS.combat],['Social',ACTIONS.social],['Tech actions',ACTIONS.tech],['Stealth',ACTIONS.stealth]].map(([title,list])=>(
                  <div key={title} style={{marginBottom:14}}>
                    <span style={sl}>{title}</span>
                    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'8px 12px',boxShadow:C.shadow}}>
                      {list.map(a=><ActionRow key={a} label={a}/>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {sheetTab==='inventory'&&(
          <div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:14}}>
              <div>
                <span style={sl}>Apparel</span>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'8px 12px',boxShadow:C.shadow}}>
                  {APPAREL_SLOTS.map(slot=><SlotRow key={slot} label={slot} value={apparel[slot]} onChange={v=>setApparel(a=>({...a,[slot]:v}))}/>)}
                </div>
              </div>
              <div>
                <span style={sl}>Weapon slots</span>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'8px 12px',marginBottom:10,boxShadow:C.shadow}}>
                  {WEAPON_SLOTS.map(slot=><SlotRow key={slot} label={slot} value={weapons[slot]} onChange={v=>setWeapons(a=>({...a,[slot]:v}))}/>)}
                </div>
                <span style={sl}>Accessories</span>
                <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:9,padding:'8px 12px',boxShadow:C.shadow}}>
                  {ACCESSORY_SLOTS.map(slot=><SlotRow key={slot} label={slot} value={accessories[slot]} onChange={v=>setAccessories(a=>({...a,[slot]:v}))}/>)}
                </div>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div>
                <span style={sl}>Consumables</span>
                <textarea style={{...ta,minHeight:70}} value={inventory.consumables} onChange={e=>setInventory(i=>({...i,consumables:e.target.value}))} placeholder="Potions, food, etc…"/>
              </div>
              <div>
                <span style={sl}>Pack / Backpack</span>
                <textarea style={{...ta,minHeight:70}} value={inventory.pack} onChange={e=>setInventory(i=>({...i,pack:e.target.value}))} placeholder="Carried items…"/>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12,marginBottom:12}}>
              {[['Coin','coin','GP, SP, CP…'],['Weight (lbs)','weight','Total carried…'],['Misc','misc','Other items…']].map(([label,key,ph])=>(
                <div key={key}>
                  <span style={sl}>{label}</span>
                  <input style={inp} value={inventory[key]||''} onChange={e=>setInventory(i=>({...i,[key]:e.target.value}))} placeholder={ph}/>
                </div>
              ))}
            </div>
            <div>
              <span style={sl}>Attuned items</span>
              <textarea style={{...ta,minHeight:50}} placeholder="Magically attuned items…"/>
            </div>
          </div>
        )}

        <div style={{...nav,marginTop:24}}>
          <div style={{display:'flex',gap:8}}>
            <button style={btnGhost} onClick={()=>setStep(5)}>← Edit backstory</button>
            <button style={{...btnGhost,color:C.warn,borderColor:C.warnBorder}} onClick={resetAll}>Start over</button>
          </div>
          <button style={btnPrimary(false)} onClick={()=>setShowSaveModal(true)}>💾 Save character</button>
        </div>
      </div>
    );
  };

  const steps=[S0,S1,S2,S3,S4,S5,S6];

  // ── SVG SIGILS for races and classes ─────────────────────────────────────
  const RaceSigil=({raceId,size=36,color='#111827'})=>{
    const s=size,h=s/2,q=s/4,t=s/3;
    const sigils={
      addamar:<><circle cx={h} cy={h} r={h*0.65} fill="none" stroke={color} strokeWidth="1.2"/><line x1={h} y1={q*0.6} x2={h} y2={s-q*0.6} stroke={color} strokeWidth="1"/><line x1={q*0.6} y1={h} x2={s-q*0.6} y2={h} stroke={color} strokeWidth="1"/></>,
      durinak:<><polygon points={`${h},${q*0.6} ${s-q*0.6},${s-q*0.6} ${q*0.6},${s-q*0.6}`} fill="none" stroke={color} strokeWidth="1.2"/><line x1={h} y1={q} x2={h} y2={s-q} stroke={color} strokeWidth="0.8"/></>,
      telari:<><ellipse cx={h} cy={h} rx={h*0.7} ry={h*0.9} fill="none" stroke={color} strokeWidth="1.1"/><line x1={h} y1={2} x2={h} y2={s-2} stroke={color} strokeWidth="0.8"/><circle cx={h} cy={h} r={2.5} fill={color}/></>,
      othrod:<><rect x={q*0.8} y={q*0.8} width={h*1.4} height={h*1.4} fill="none" stroke={color} strokeWidth="1.2" transform={`rotate(45 ${h} ${h})`}/></>,
      terraxian:<><polygon points={`${h},${2} ${s-2},${h} ${h},${s-2} ${2},${h}`} fill="none" stroke={color} strokeWidth="1.2"/><circle cx={h} cy={h} r={4} fill={color}/></>,
      fynlor:<><circle cx={h} cy={h} r={h*0.65} fill="none" stroke={color} strokeWidth="1.2"/><circle cx={h} cy={h} r={h*0.3} fill="none" stroke={color} strokeWidth="0.8"/></>,
      trink:<><polygon points={`${h},${2} ${s-2},${s*0.75} ${2},${s*0.75}`} fill="none" stroke={color} strokeWidth="1.1"/><polygon points={`${h},${s-2} ${s-2},${s*0.25} ${2},${s*0.25}`} fill="none" stroke={color} strokeWidth="1.1"/></>,
      pamorph:<><path d={`M${h},${3} Q${s-3},${h} ${h},${s-3} Q${3},${h} ${h},${3}`} fill="none" stroke={color} strokeWidth="1.1"/><path d={`M${3},${h} Q${h},${3} ${s-3},${h} Q${h},${s-3} ${3},${h}`} fill="none" stroke={color} strokeWidth="0.8"/></>,
      fae:<><polygon points={`${h},${2} ${h+8},${h-4} ${s-4},${h-2} ${h+5},${h+7} ${h+3},${s-3} ${h},${h+9} ${h-3},${s-3} ${h-5},${h+7} ${4},${h-2} ${h-8},${h-4}`} fill="none" stroke={color} strokeWidth="1.1"/></>,
      djinn:<><polygon points={`${h},${2} ${s-5},${s*0.4} ${s-2},${h+8} ${h+6},${s-2} ${h-6},${s-2} ${2},${h+8} ${5},${s*0.4}`} fill="none" stroke={color} strokeWidth="1.1"/></>,
      helianth:<><path d={`M${h} ${3} L${s-3} ${s-3} L${3} ${s-3} Z`} fill="none" stroke={color} strokeWidth="1.1"/><path d={`M${h} ${s*0.3} L${s*0.7} ${s-5} L${s*0.3} ${s-5} Z`} fill="none" stroke={color} strokeWidth="0.7"/></>,
      seraphan:<><circle cx={h} cy={h} r={h*0.7} fill="none" stroke={color} strokeWidth="1.1"/><line x1={h} y1={1} x2={h} y2={s-1} stroke={color} strokeWidth="0.8"/><line x1={1} y1={h} x2={s-1} y2={h} stroke={color} strokeWidth="0.8"/><line x1={4} y1={4} x2={s-4} y2={s-4} stroke={color} strokeWidth="0.6"/><line x1={s-4} y1={4} x2={4} y2={s-4} stroke={color} strokeWidth="0.6"/></>,
      drakazir:<><path d={`M${h} ${2} L${s-4} ${s*0.35} L${s-6} ${s-4} L${h} ${s*0.7} L${6} ${s-4} L${4} ${s*0.35} Z`} fill="none" stroke={color} strokeWidth="1.1"/></>,
      nazari:<><ellipse cx={h} cy={h} rx={h*0.75} ry={h*0.55} fill="none" stroke={color} strokeWidth="1.1"/><path d={`M${4},${h} Q${h},${3} ${s-4},${h}`} fill="none" stroke={color} strokeWidth="0.8"/></>,
      chronison:<><rect x={5} y={5} width={s-10} height={s-10} fill="none" stroke={color} strokeWidth="1.1" rx="2"/><rect x={10} y={10} width={s-20} height={s-20} fill="none" stroke={color} strokeWidth="0.7" rx="1"/><circle cx={h} cy={h} r={3} fill={color}/></>,
    };
    return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{sigils[raceId]||sigils.addamar}</svg>);
  };

  const ClassSigil=({classId,size=36,color='#111827'})=>{
    const s=size,h=s/2;
    const sigils={
      inquisitor:<><circle cx={h} cy={h} r={h*0.65} fill="none" stroke={color} strokeWidth="1.1"/><line x1={h} y1={3} x2={h} y2={s-3} stroke={color} strokeWidth="1.3"/><line x1={h-7} y1={h-3} x2={h+7} y2={h-3} stroke={color} strokeWidth="1.3"/></>,
      zealot:<><polygon points={`${h},${3} ${s-3},${h+8} ${s*0.7},${s-3} ${s*0.3},${s-3} ${3},${h+8}`} fill="none" stroke={color} strokeWidth="1.1"/><circle cx={h} cy={h-2} r={4} fill="none" stroke={color} strokeWidth="0.9"/></>,
      weaver:<><path d={`M${4},${4} Q${h},${s-4} ${s-4},${4}`} fill="none" stroke={color} strokeWidth="1.1"/><path d={`M${4},${s-4} Q${h},${4} ${s-4},${s-4}`} fill="none" stroke={color} strokeWidth="1.1"/><circle cx={h} cy={h} r={3} fill={color}/></>,
      druid:<><circle cx={h} cy={h} r={h*0.65} fill="none" stroke={color} strokeWidth="1.1"/><path d={`M${h},${5} Q${s-5},${h} ${h},${s-5} Q${5},${h} ${h},${5}`} fill="none" stroke={color} strokeWidth="0.8"/></>,
      sage:<><rect x={6} y={4} width={s-12} height={s-8} fill="none" stroke={color} strokeWidth="1.1" rx="2"/><line x1={10} y1={h-4} x2={s-10} y2={h-4} stroke={color} strokeWidth="0.8"/><line x1={10} y1={h+1} x2={s-10} y2={h+1} stroke={color} strokeWidth="0.8"/><line x1={10} y1={h+6} x2={s-16} y2={h+6} stroke={color} strokeWidth="0.8"/></>,
      mystic:<><polygon points={`${h},${3} ${h+9},${h-2} ${h+6},${h+8} ${h-6},${h+8} ${h-9},${h-2}`} fill="none" stroke={color} strokeWidth="1.1"/><circle cx={h} cy={h+2} r={3.5} fill={color}/></>,
      magister:<><polygon points={`${h},${3} ${s-3},${s-3} ${3},${s-3}`} fill="none" stroke={color} strokeWidth="1.1"/><line x1={h} y1={10} x2={h} y2={s-7} stroke={color} strokeWidth="1.2"/><line x1={h-5} y1={h+2} x2={h+5} y2={h+2} stroke={color} strokeWidth="1"/></>,
      merchant:<><circle cx={h} cy={h} r={h*0.65} fill="none" stroke={color} strokeWidth="1.1"/><line x1={h-8} y1={h} x2={h+8} y2={h} stroke={color} strokeWidth="1"/><line x1={h} y1={h-4} x2={h} y2={h+4} stroke={color} strokeWidth="1"/></>,
      fighter:<><polygon points={`${h},${3} ${s-3},${h} ${s-6},${s-3} ${6},${s-3} ${3},${h}`} fill="none" stroke={color} strokeWidth="1.1"/><line x1={h} y1={8} x2={h} y2={s-8} stroke={color} strokeWidth="1.2"/></>,
      vanguard:<><rect x={5} y={4} width={s-10} height={s-8} fill="none" stroke={color} strokeWidth="1.1" rx="3"/><line x1={5} y1={h} x2={s-5} y2={h} stroke={color} strokeWidth="0.8"/></>,
      alchemist:<><circle cx={h} cy={h*0.8} r={h*0.45} fill="none" stroke={color} strokeWidth="1.1"/><path d={`M${h-8},${h+4} L${4},${s-4} L${s-4},${s-4} L${h+8},${h+4}`} fill="none" stroke={color} strokeWidth="1.1"/></>,
      scholar:<><polygon points={`${h},${3} ${s-4},${s-4} ${4},${s-4}`} fill="none" stroke={color} strokeWidth="1.1"/><line x1={h-6} y1={h+4} x2={h+6} y2={h+4} stroke={color} strokeWidth="0.9"/></>,
      rogue:<><path d={`M${4},${h} L${h},${3} L${s-4},${h} L${h},${s-3} Z`} fill="none" stroke={color} strokeWidth="1.1"/><circle cx={h} cy={h} r={3} fill={color}/></>,
      artificer:<><circle cx={h} cy={h} r={h*0.5} fill="none" stroke={color} strokeWidth="1.1"/><circle cx={h} cy={h} r={h*0.2} fill={color}/><line x1={h} y1={2} x2={h} y2={7} stroke={color} strokeWidth="1.2"/><line x1={h} y1={s-7} x2={h} y2={s-2} stroke={color} strokeWidth="1.2"/><line x1={2} y1={h} x2={7} y2={h} stroke={color} strokeWidth="1.2"/><line x1={s-7} y1={h} x2={s-2} y2={h} stroke={color} strokeWidth="1.2"/></>,
    };
    return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>{sigils[classId]||<circle cx={h} cy={h} r={h*0.6} fill="none" stroke={color} strokeWidth="1.1"/>}</svg>);
  };

  // ── LANDING SCREEN ────────────────────────────────────────────────────────
  const Landing=()=>{
    const hasSaved=savedChars.length>0;
    const mostRecentChar=hasSaved?savedChars.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0))[0]:null;
    const charCampaign=mostRecentChar?.campaign?CAMPAIGNS.find(c=>c.id===mostRecentChar.campaign):null;
    return (
      <div style={{background:C.bg,minHeight:'100vh',display:'flex',flexDirection:'column',fontFamily:'system-ui,-apple-system,sans-serif'}}>
        {/* Header */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'16px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:14}}>
            <svg viewBox="0 0 38 38" width="38" height="38">
              <ellipse cx="19" cy="19" rx="14" ry="17" fill="none" stroke="#111827" strokeWidth="0.9"/>
              <line x1="19" y1="2" x2="19" y2="0.5" stroke="#111827" strokeWidth="1.5"/>
              <line x1="19" y1="37.5" x2="19" y2="36" stroke="#111827" strokeWidth="1.5"/>
              <circle cx="5" cy="19" r="1.2" fill="#111827"/>
              <circle cx="33" cy="19" r="1.2" fill="#111827"/>
              <text x="19" y="26" textAnchor="middle" style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,fill:'#111827'}}>S</text>
            </svg>
            <div>
              <p style={{fontSize:15,fontWeight:800,color:C.text,letterSpacing:'0.16em',textTransform:'uppercase',margin:0,fontFamily:"Georgia,'Times New Roman',serif"}}>Syntarion</p>
              <p style={{fontSize:10,color:C.muted,letterSpacing:'0.06em',marginTop:2}}>Adventure Companion · Soteria TTRPG · 178 E.U.</p>
            </div>
          </div>
        </div>

        <div style={{flex:1,display:'grid',gridTemplateColumns:'1.3fr 0.9fr',maxHeight:'calc(100vh - 70px)',overflow:'hidden'}}>
          {/* Left — Hero */}
          <div style={{padding:'52px 52px 40px',background:'linear-gradient(145deg,#ffffff 0%,#f8fbff 50%,#eef4ff 100%)',overflowY:'auto',display:'flex',flexDirection:'column',gap:0}}>
            <div style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:16}}>Soteria · 178 Era of Unity</div>
            <h1 style={{fontSize:'clamp(44px,6vw,80px)',lineHeight:0.92,letterSpacing:'-0.04em',margin:0,fontWeight:800,color:C.text,fontFamily:"Georgia,serif"}}>Adventure<br/>Companion</h1>
            <p style={{marginTop:14,fontSize:14,letterSpacing:'0.14em',textTransform:'uppercase',color:C.blueText,fontWeight:700}}>Universal tabletop orchestration engine</p>
            <p style={{marginTop:20,maxWidth:560,fontSize:15,lineHeight:1.75,color:C.textSub}}>
              Build a character, choose a campaign, and play. Syntarion tracks your stats, inventory, actions, and backstory — then holds them until the next session.
            </p>

            {/* Primary CTA */}
            <div style={{marginTop:30,display:'flex',flexWrap:'wrap',gap:12}}>
              <button style={{background:C.blue,color:'#fff',border:`1px solid ${C.blue}`,borderRadius:12,padding:'14px 28px',fontSize:13,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:800,cursor:'pointer',boxShadow:'0 8px 20px rgba(37,99,235,0.22)'}} onClick={()=>setAppView('wizard')}>
                Play Now
              </button>
              {hasSaved&&charCampaign&&(
                <button style={{background:C.surface,color:C.blueText,border:`1px solid ${C.blueDim}`,borderRadius:12,padding:'14px 24px',fontSize:13,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:700,cursor:'pointer',boxShadow:C.shadow}} onClick={()=>goToCampaign(charCampaign.id,mostRecentChar)}>
                  Enter {charCampaign.name} →
                </button>
              )}
              {hasSaved&&!charCampaign&&(
                <button style={{background:C.surface,color:C.textSub,border:`1px solid ${C.border}`,borderRadius:12,padding:'14px 24px',fontSize:13,letterSpacing:'0.08em',textTransform:'uppercase',fontWeight:700,cursor:'pointer',boxShadow:C.shadow}} onClick={()=>{loadChar(mostRecentChar);setAppView('wizard');}}>
                  Continue {mostRecentChar.name||'Character'} →
                </button>
              )}
            </div>

            {/* Chips */}
            <div style={{marginTop:28,display:'flex',flexWrap:'wrap',gap:10}}>
              {[['Magic & Spirit',C.magicBg,C.magicText],['Tech & Industry',C.techBg,C.techText],['15 Races',C.blueLight,C.blueText],['14 Classes',C.blueLight,C.blueText]].map(([label,bg,fg])=>(
                <span key={label} style={{display:'inline-flex',alignItems:'center',padding:'7px 13px',borderRadius:999,background:bg,color:fg,fontSize:11,letterSpacing:'0.07em',textTransform:'uppercase',fontWeight:700}}>{label}</span>
              ))}
            </div>
          </div>

          {/* Right — Panels */}
          <div style={{padding:'28px 24px',background:'linear-gradient(180deg,#f9fbff 0%,#eef4ff 100%)',borderLeft:`1px solid ${C.border}`,overflowY:'auto',display:'flex',flexDirection:'column',gap:16}}>
            {/* Recent character */}
            {mostRecentChar&&(
              <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:'18px 18px 16px',boxShadow:C.shadow}}>
                <div style={{fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:12}}>Last character</div>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{position:'relative',width:48,height:48,flexShrink:0}}>
                    <div style={{width:48,height:48,borderRadius:12,background:mostRecentChar.cp==='magic'?C.magicBg:C.techBg,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <RaceSigil raceId={mostRecentChar.race} size={28} color={mostRecentChar.cp==='magic'?C.magicText:C.techText}/>
                    </div>
                    <div style={{position:'absolute',bottom:-4,right:-4,width:22,height:22,borderRadius:6,background:C.surface,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <ClassSigil classId={mostRecentChar.cid} size={14} color={C.text}/>
                    </div>
                  </div>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:C.text}}>{mostRecentChar.name||'Unnamed'}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{mostRecentChar.race?getRaceDisplay(mostRecentChar.race,mostRecentChar.rv,mostRecentChar.pmV):'No race'}{mostRecentChar.cid?' · '+(allClasses.find(c=>c.id===mostRecentChar.cid)?.name||''):''}</div>
                  </div>
                </div>
                {charCampaign&&(
                  <button style={{...btnPrimary(false),width:'100%',marginTop:14,textAlign:'center',display:'block'}} onClick={()=>goToCampaign(charCampaign.id,mostRecentChar)}>
                    Enter {charCampaign.name} →
                  </button>
                )}
              </div>
            )}

            {/* Campaigns */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:'18px',boxShadow:C.shadow}}>
              <div style={{fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:12}}>Campaigns</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {CAMPAIGNS.map(camp=>{
                  const campChars=savedChars.filter(c=>c.campaign===camp.id);
                  return(
                    <button key={camp.id} onClick={()=>{if(campChars.length>0)goToCampaign(camp.id,campChars[0]);else{setSaveCampaign(camp.id);setAppView('wizard');}}} style={{textAlign:'left',background:C.subPanel,border:`1px solid ${C.border}`,borderRadius:10,padding:'12px 12px',cursor:'pointer',boxShadow:C.shadow}}>
                      <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,fontWeight:700}}>{camp.name}</div>
                      <div style={{fontSize:14,fontWeight:700,color:C.text,marginTop:4,letterSpacing:'-0.01em'}}>{camp.subtitle}</div>
                      <div style={{fontSize:10,color:campChars.length>0?C.blue:C.dim,marginTop:6,fontWeight:600}}>{campChars.length>0?`${campChars.length} character${campChars.length>1?'s':''}`:'No characters yet'}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:'18px',boxShadow:C.shadow}}>
              <div style={{fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:12}}>Quick actions</div>
              {[
                ['New character','Begin character creation →',()=>{resetAll();setAppView('wizard');}],
                hasSaved?['Load saved','View all saved characters →',()=>{resetAll();setStep(0);setAppView('wizard');}]:null,
              ].filter(Boolean).map(([title,sub,fn])=>(
                <button key={title} onClick={fn} style={{width:'100%',textAlign:'left',background:C.subPanel,border:`1px solid ${C.border}`,borderRadius:9,padding:'11px 13px',marginBottom:8,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:C.text}}>{title}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{sub}</div>
                  </div>
                  <span style={{color:C.blue,fontSize:14}}>→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── CAMPAIGN VIEW ─────────────────────────────────────────────────────────
  const CampaignView=()=>{
    const camp=CAMPAIGNS.find(c=>c.id===campaignView);
    const campChars=savedChars.filter(c=>c.campaign===campaignView);
    const [activeCharId,setActiveCharId]=useState(campChars[0]?.id||null);
    const activeChar=campChars.find(c=>c.id===activeCharId)||campChars[0]||null;
    const charCls=activeChar?allClasses.find(c=>c.id===activeChar.cid):null;
    const allStats_=ALL_STATS;
    if(!camp)return null;
    const pathColor=activeChar?.cp==='magic'?C.magic:C.tech;
    const pathBg=activeChar?.cp==='magic'?C.magicBg:C.techBg;
    return (
      <div style={{background:C.bg,minHeight:'100vh',fontFamily:'system-ui,-apple-system,sans-serif'}}>
        {/* Campaign header */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <button onClick={()=>setAppView('landing')} style={{...btnGhost,padding:'6px 12px',fontSize:10}}>← Home</button>
            <div>
              <div style={{fontSize:10,letterSpacing:'0.12em',textTransform:'uppercase',color:C.muted,fontWeight:700}}>{camp.name}</div>
              <div style={{fontSize:17,fontWeight:800,color:C.text,letterSpacing:'-0.01em',fontFamily:"Georgia,serif"}}>{camp.subtitle}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={{...btnGhost,fontSize:10}} onClick={()=>{setAppView('wizard');setStep(6);}}>Edit sheet</button>
            <button style={btnPrimary(false)} onClick={()=>{resetAll();setSaveCampaign(campaignView);setAppView('wizard');}}>+ New character</button>
          </div>
        </div>

        <div style={{padding:'24px 28px',maxWidth:1100,margin:'0 auto'}}>
          {campChars.length===0?(
            <div style={{textAlign:'center',padding:'60px 20px'}}>
              <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8}}>No characters in {camp.name}</div>
              <div style={{fontSize:13,color:C.muted,marginBottom:24}}>Create a character and assign it to this campaign.</div>
              <button style={btnPrimary(false)} onClick={()=>{resetAll();setSaveCampaign(campaignView);setAppView('wizard');}}>Begin character creation →</button>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:`${campChars.length>1?'220px ':''} 1fr`,gap:20}}>
              {/* Character selector (only if multiple) */}
              {campChars.length>1&&(
                <div>
                  <div style={{fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:10}}>Characters</div>
                  {campChars.map(ch=>(
                    <div key={ch.id} onClick={()=>setActiveCharId(ch.id)} style={{background:activeCharId===ch.id?C.blueLight:C.card,border:`1.5px solid ${activeCharId===ch.id?C.blueDim:C.border}`,borderRadius:10,padding:'10px 12px',marginBottom:7,cursor:'pointer',display:'flex',alignItems:'center',gap:10,boxShadow:C.shadow}}>
                      <div style={{width:34,height:34,borderRadius:9,background:ch.cp==='magic'?C.magicBg:C.techBg,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <RaceSigil raceId={ch.race} size={20} color={ch.cp==='magic'?C.magicText:C.techText}/>
                      </div>
                      <div>
                        <div style={{fontSize:12,fontWeight:700,color:C.text}}>{ch.name}</div>
                        <div style={{fontSize:9,color:C.muted,marginTop:1}}>{allClasses.find(c=>c.id===ch.cid)?.name||'—'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Character sheet */}
              {activeChar&&(
                <div>
                  {/* Identity header with sigils */}
                  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:'24px 24px 20px',marginBottom:16,boxShadow:C.shadow}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:18}}>
                      {/* Sigil display */}
                      <div style={{position:'relative',flexShrink:0}}>
                        <div style={{width:72,height:72,borderRadius:16,background:pathBg,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:C.shadow}}>
                          <RaceSigil raceId={activeChar.race} size={42} color={pathColor}/>
                        </div>
                        <div style={{position:'absolute',bottom:-6,right:-6,width:30,height:30,borderRadius:8,background:C.surface,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:C.shadow}}>
                          <ClassSigil classId={activeChar.cid} size={18} color={C.text}/>
                        </div>
                      </div>
                      {/* Name block */}
                      <div style={{flex:1}}>
                        <div style={{fontSize:24,fontWeight:800,color:C.text,letterSpacing:'-0.02em',fontFamily:"Georgia,serif"}}>{activeChar.name||'Unnamed'}</div>
                        <div style={{fontSize:13,color:C.textSub,marginTop:4,fontWeight:500}}>{activeChar.race?getRaceDisplay(activeChar.race,activeChar.rv,activeChar.pmV):'No race'}{activeChar.age?` · Age ${activeChar.age}`:''}</div>
                        <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap'}}>
                          {charCls&&<span style={{...tagChip(activeChar.cp),fontSize:10}}>{charCls.name} · {charCls.disc}</span>}
                          {activeChar.dc==='god'&&activeChar.deity&&<span style={{display:'inline-block',background:C.blueLight,color:C.blueText,padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700}}>God: {activeChar.deity}</span>}
                          {activeChar.dc==='spirit'&&activeChar.spirit&&<span style={{display:'inline-block',background:C.techBg,color:C.techText,padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:700}}>Spirit: {activeChar.spirit}</span>}
                        </div>
                      </div>
                      {/* Morality / alignment + Level + AP */}
                      <div style={{textAlign:'right',flexShrink:0,display:'flex',flexDirection:'column',gap:8,alignItems:'flex-end'}}>
                        {/* Level badge */}
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:3}}>Level</div>
                            <div style={{width:44,height:44,borderRadius:10,background:C.blueLight,border:`2px solid ${C.blueDim}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,fontWeight:800,color:C.blueText}}>{activeChar.charLevel||1}</div>
                          </div>
                          {/* AP */}
                          <div style={{textAlign:'center'}}>
                            <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:3}}>AP</div>
                            <div style={{background:C.subPanel,border:`1.5px solid ${C.border}`,borderRadius:10,padding:'6px 10px',minWidth:64}}>
                              <div style={{fontSize:14,fontWeight:800,color:C.text,textAlign:'center'}}>{activeChar.apCurrent||0}<span style={{color:C.dim,fontWeight:400,fontSize:11}}> / {activeChar.apTotal||0}</span></div>
                              <div style={{fontSize:8,color:C.muted,textAlign:'center',letterSpacing:'0.06em',textTransform:'uppercase'}}>Spent / Pool</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:3,textAlign:'right'}}>Alignment</div>
                          <div style={{fontSize:12,fontWeight:700,color:pathColor,textAlign:'right'}}>{activeChar.alignSlider===0?'Neutral':activeChar.alignSlider<0?`Magic ${Math.abs(activeChar.alignSlider)}`:`Tech ${activeChar.alignSlider}`}</div>
                          {activeChar.morality&&<div style={{fontSize:11,color:C.muted,marginTop:1,textAlign:'right'}}>{activeChar.morality}</div>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
                    {[['Magic / Spiritual',allStats_.filter(s=>s.axis==='magic'),C.magic,C.magicBg],['Tech / Mortal',allStats_.filter(s=>s.axis==='tech'),C.tech,C.techBg]].map(([label,statList,col,bg])=>(
                      <div key={label} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:'16px',boxShadow:C.shadow}}>
                        <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:col,fontWeight:700,marginBottom:12}}>{label}</div>
                        {statList.map(({key,label:slabel,equiv})=>{
                          const val=activeChar.stats?.[key]||8;
                          const pct=Math.round((val-1)/19*100);
                          return(
                            <div key={key} style={{marginBottom:8}}>
                              <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:3}}>
                                <span style={{fontSize:11,fontWeight:700,color:C.text}}>{slabel}</span>
                                <span style={{fontSize:11,color:C.muted}}>{equiv}</span>
                                <span style={{fontSize:16,fontWeight:800,color:C.text,minWidth:28,textAlign:'right'}}>{val}</span>
                              </div>
                              <div style={{height:3,background:C.subPanel,borderRadius:2,overflow:'hidden'}}>
                                <div style={{height:'100%',width:`${pct}%`,background:col,borderRadius:2}}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Backstory */}
                  {activeChar.backstory&&(
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:'16px',marginBottom:16,boxShadow:C.shadow}}>
                      <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:10}}>Backstory</div>
                      {activeChar.backstory.split('\n\n').map((para,i)=>(
                        <p key={i} style={{fontSize:12,color:para.startsWith('▸')?C.techText:C.textSub,lineHeight:1.75,margin:0,marginBottom:i<activeChar.backstory.split('\n\n').length-1?10:0,fontStyle:para.startsWith('▸')?'normal':'italic',fontWeight:para.startsWith('▸')?700:400}}>{para}</p>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {activeChar.notes&&(
                    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:'14px 16px',boxShadow:C.shadow}}>
                      <div style={{fontSize:9,letterSpacing:'0.1em',textTransform:'uppercase',color:C.muted,fontWeight:700,marginBottom:8}}>Session notes</div>
                      <div style={{fontSize:12,color:C.textSub,lineHeight:1.65,whiteSpace:'pre-wrap'}}>{activeChar.notes}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── SAVE CONFIRMATION TOAST: show "Enter Campaign" button if assigned ──────
  const SaveToast=()=>{
    const lastSaved=savedChars.sort((a,b)=>(b.savedAt||0)-(a.savedAt||0))[0];
    const camp=lastSaved?.campaign?CAMPAIGNS.find(c=>c.id===lastSaved.campaign):null;
    return(
      <div style={{position:'fixed',bottom:24,right:24,background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:'14px 18px',boxShadow:C.shadowLg,zIndex:300,display:'flex',alignItems:'center',gap:12,minWidth:260}}>
        <div style={{width:10,height:10,borderRadius:'50%',background:C.tech,flexShrink:0}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text}}>Character saved</div>
          {camp&&<div style={{fontSize:10,color:C.muted,marginTop:1}}>Assigned to {camp.name}</div>}
        </div>
        {camp&&(
          <button style={{...btnPrimary(false),padding:'7px 13px',fontSize:10,whiteSpace:'nowrap'}} onClick={()=>goToCampaign(camp.id,lastSaved)}>
            Enter →
          </button>
        )}
      </div>
    );
  };

  // ── ROUTE ─────────────────────────────────────────────────────────────────
  if(appView==='landing')return <Landing/>;
  if(appView==='campaign')return <CampaignView/>;

  return (
    <div style={{background:C.bg,minHeight:'100vh',fontFamily:'system-ui,-apple-system,sans-serif',color:C.text}}>
      {showSaveModal&&<SaveModal/>}
      {saveConfirm&&<SaveToast/>}

      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:'14px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',gap:14}}>
          <button onClick={()=>setAppView('landing')} style={{background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:10,padding:0}}>
            <svg viewBox="0 0 38 38" width="38" height="38">
              <ellipse cx="19" cy="19" rx="14" ry="17" fill="none" stroke="#111827" strokeWidth="0.9"/>
              <line x1="19" y1="2" x2="19" y2="0.5" stroke="#111827" strokeWidth="1.5"/>
              <line x1="19" y1="37.5" x2="19" y2="36" stroke="#111827" strokeWidth="1.5"/>
              <circle cx="5" cy="19" r="1.2" fill="#111827"/>
              <circle cx="33" cy="19" r="1.2" fill="#111827"/>
              <text x="19" y="26" textAnchor="middle" style={{fontFamily:"Georgia,serif",fontSize:22,fontWeight:700,fill:'#111827'}}>S</text>
            </svg>
            <div style={{textAlign:'left'}}>
              <p style={{fontSize:14,fontWeight:800,color:C.text,letterSpacing:'0.16em',textTransform:'uppercase',margin:0,fontFamily:"Georgia,'Times New Roman',serif"}}>Syntarion</p>
              <p style={{fontSize:10,color:C.muted,letterSpacing:'0.06em',marginTop:2}}>Adventure Companion · Soteria TTRPG · 178 E.U.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Step bar */}
      <div style={{display:'flex',background:C.surface,borderBottom:`1px solid ${C.border}`,overflowX:'auto',boxShadow:'0 1px 2px rgba(0,0,0,0.04)'}}>
        {STEPS.map((lbl,i)=>(
          <div key={i} style={{padding:'10px 13px',fontSize:9,letterSpacing:'0.10em',textTransform:'uppercase',fontWeight:i===step?700:500,color:i===step?C.blue:i<step?C.textSub:C.dim,borderBottom:`2px solid ${i===step?C.blue:'transparent'}`,cursor:'default',whiteSpace:'nowrap',flexShrink:0,transition:'color 0.1s'}}>
            {i+1}. {lbl}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{padding:'22px 24px',maxWidth:920,margin:'0 auto'}}>
        {(steps[step]||steps[0])()}
      </div>
    </div>
  );
}