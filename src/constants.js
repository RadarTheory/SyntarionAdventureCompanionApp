// ═════════════════════════════════════════════════════════════════════════════
// SYNTARION CONSTANTS
// Single source of truth for all lore data.
// Import what you need in each step file.
// ═════════════════════════════════════════════════════════════════════════════

// ─── COLOR SYSTEM ─────────────────────────────────────────────────────────────
export const COLORS = {
  landing:    '#f0eeeb',
  wizard:     '#14110c',
  surface:    '#231d17',
  card:       '#2c2419',
  border:     'rgba(240,238,235,0.08)',
  borderMid:  'rgba(240,238,235,0.15)',
  magic:      '#79f5a7',
  magicDim:   '#16a34a',
  magicBg:    'rgba(34,197,94,0.10)',
  magicText:  '#86efac',
  tech:       '#3b82f6',
  techDim:    '#2563eb',
  techBg:     'rgba(59,130,246,0.10)',
  techText:   '#93c5fd',
  deity:      '#a855f7',
  deityDim:   '#7c3aed',
  deityBg:    'rgba(168,85,247,0.10)',
  deityText:  '#d8b4fe',
  spirit:     '#f97316',
  spiritDim:  '#ea580c',
  spiritBg:   'rgba(249,115,22,0.10)',
  spiritText: '#fdba74',
  unaffiliated:     '#6b7280',
  unaffiliatedBg:   'rgba(107,114,128,0.10)',
  unaffiliatedText: '#d1d5db',
  text:       '#f0eeeb',
  textSub:    '#dfd2c4',
  muted:      '#b3a89c',
  dim:        '#837364',
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
export const RACES = [
  { id:'addamar',   name:'Addamar',    sub:'Human',      tag:'any',  lean:0,  sub2:'Veridoran · Brunar · Matekwan', variants:['Veridoran','Brunar','Matekwan','Vàld','Pontunean','Sunoàca',"Jiro'Ќi",'Varid','Tachechana','Eryatav','Rajava','Ahnkir'], ns:'addamar',   desc:"The most adaptable people in Soteria. Addamar societies span merchant cities, spirit-forests, and desert trade routes. Their strength is not in any one direction — it is in the refusal to be defined by one." },
  { id:'durinak',   name:'Durinak',    sub:'Dwarf',      tag:'tech', lean:2,  sub2:'Grimrock · Yewhammer · Graniteheart', variants:['Hill','Mountain'], ns:'durinak', desc:"Forged in deep halls and foundry-light. Their culture prizes endurance, craft, and consequence. The Veinrunner passes through their mountain territories — a relationship that is complicated and unresolved." },
  { id:'telari',    name:"Tel'ari",    sub:'Elf',        tag:'magic',lean:-2, sub2:'Wood · Dark · Eladrin', variants:['Wood','Dark','Eladrin'], ns:'telari', desc:"Ancient. Long-memoried. The Tel'ari carry their history in their bones and their songs in languages that predate the current era. Some have adapted to the age of steam; others have not forgiven it." },
  { id:'othrod',    name:'Othrod',     sub:'Orc',        tag:'any',  lean:1,  sub2:"Kul'kal · Grothmogg · Telrok · Jotunnar", variants:["Kul'kal Rakhar",'Grothmogg','Telrok','Jotunnar'], ns:'othrod', desc:"The Othrod clans have survived everything Soteria has thrown at them through force of will and refusal to yield. Several clans have integrated with the Veinrunner era. Several have not." },
  { id:'terraxian', name:'Terraxian',  sub:'Nephilim',   tag:'tech', lean:1,  sub2:'Large · Stone-skinned', variants:[], ns:'terraxian', desc:"Stone-skinned and mountain-born. Those who descend to the lowlands tend to arrive with either a purpose or a problem — sometimes just curiosity about smoke." },
  { id:'fynlor',    name:'Fynlor',     sub:'Halfling',   tag:'any',  lean:0,  sub2:'Lightfoot · Stout', variants:['Lightfoot','Stout'], ns:'fynlor', desc:"Small, quick, and socially gifted in ways that larger folk consistently underestimate. The Fynlor have a talent for arriving at the right moment and leaving before the wrong one." },
  { id:'trink',     name:'Trink',      sub:'Gnome',      tag:'tech', lean:2,  sub2:'Small · Arcane logic', variants:[], ns:'trink', desc:"Curious to a fault and mechanically gifted. The Trink built half the systems that run Ashendell's lower districts and have filed patents on the other half." },
  { id:'pamorph',   name:"Pa'morph",   sub:'Beast-folk', tag:'any',  lean:0,  sub2:'Choose bloodline below', variants:[], isPamorph:true, ns:'pamorph', desc:"Shape-touched and bloodline-defined, the Pa'morph exist across every corner of Soteria. Their culture varies as widely as their forms — from pack-law territories to city guilds to wilderness enclaves that appear on no official map." },
  { id:'fae',       name:'Fae',        sub:"Faerie",    tag:'magic',lean:-2, sub2:'Arcani potential · Soul-sight', variants:[], ns:'fae', desc:"Fae exist at the intersection of the material and the resonant. They perceive things that others cannot and are occasionally perceived by things that others cannot see." },
  { id:'djinn',     name:'Djinn',      sub:'Genie',      tag:'magic',lean:-1, sub2:'Efreet · Marid · Djinni · Dao', variants:['Efreet — Wish','Marid — Hex','Djinni — Heal','Dao — Luck'], ns:'djinn', desc:"Born of elemental convergence, the Djinn carry their element's nature in their blood." },
  { id:'helianth',  name:'Helianth',   sub:'Tiefling',   tag:'magic',lean:-1, sub2:'Infernal ancestry', variants:[], ns:'helianth', desc:"Infernal blood runs cool in the Helianth — not hot. They are not defined by their ancestry unless they choose to be, and most of them are tired of being defined by it." },
  { id:'seraphan',  name:'Seraphan',   sub:'Aasimar',    tag:'magic',lean:-1, sub2:'Celestial blood', variants:[], ns:'seraphan', desc:"Celestial-blooded and occasionally burdened by it. The Seraphan carry a presence that others read before the Seraphan has spoken." },
  { id:'drakazir',  name:'Drakazir',   sub:'Dragonborn', tag:'any',  lean:0,  sub2:'10 color lineages', variants:['Black','Blue','Brass','Bronze','Copper','Gold','Green','Red','Silver','White'], ns:'drakazir', desc:"Lineage-proud and breath-gifted. The ten lineages have different cultural relationships to the age of steam, but all of them remember when the world was hotter." },
  { id:'nazari',    name:'Nazari',     sub:'Sea-folk',   tag:'tech', lean:1,  sub2:'Aquatic · Superior darkvision', variants:[], ns:'nazari', desc:"Deep-water people who surface with purpose. Every Nazari on land is there by deliberate choice — the Sylvan Lung they invented to breathe surface air is proof of that." },
  { id:'chronison', name:'Chronison',  sub:'Construct',  tag:'tech', lean:2,  sub2:'Defensive · Corrupted/Rogue · Specialist', variants:['Defensive','Corrupted/Rogue','Specialist'], ns:'chronison', desc:"Built, not born. Sentience arrived uninvited in most cases, and has since made itself at home." },
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

// ═════════════════════════════════════════════════════════════════════════════
// NAME LIBRARIES
// Structure: NAMES[raceNs] = { m:[], f:[], s:[] }
// For races with sub-cultures: NAMES[raceNs][variant] = { m:[], f:[], s:[] }
// Chronison: first names are designations, last names are serial codes
// UNUSED pool: world names available to any race
// ═════════════════════════════════════════════════════════════════════════════

export const NAMES = {

  // ── UNUSED / WORLD NAMES — always available, any race ──
  unused: {
    m: ['Adren','Akira','Alaric','Alwyn','Amante','Amon','Apollyon','Archimago','Arendir','Arthus','Armie','Bedwyr','Belen','Berengar','Bink','Caspian','Cassor','Cecil','Cedric','Chukka','Clifton','Clint',"D'Artagnon",'Dante','Darius','Declan','Demaudre','Dennie','Denvik','Destin','Dovel','Dreihn','Drathan','Drispin','Drogon','Durok','Elloi','Enpap','Eridor','Ermanell','Etienne','Evander','Ezren','Francois','Galen','Garr','Gideon','Graham','Gulliver','Haleth','Hektus','Hensley','Herbert','Hodor','Horatio','Hyzer','Isaac','Isaiah','Jastor','Jax','Jethro','Jin','Joryn','Kadyn','Kaien','Kalrix','Kallinvar','Kraven','Kushim','Kycan','Laguin','Leofric','Lewin','Magnus','Marcus','Maximillion','Milo','Minos','Naram','Narmer','Percival','Piers','Quent','Ramin','Raphael','Rauren','Rebar','Ren','Rhaz','Riven','Roan','Roderick','Rokuhan','Roman','Rowan','Ruggiero','Sarek','Scororro','Sened','Silco','Sora','Soren','Stannis','Tambler','Tamsen','Tarkh','Tavian','Tobin','Tobias','Tyrus','Varis','Virgil','Warren','Wesley','Xander','Xerion','Zerin','Zetiro','Zorak'],
    f: ['Aderyn','Alcina','Ambar','Anat','Arielle','Arienwen','Ariya','Aru','Aryssa','Astrid','Astraea','Aveline','Baerwen',"Bel'an",'Betha','Beatrix','Calle','Carrie','Cassie','Celia','Ceryth','Chryste','Clarissa','Clorinda','Dali','Dinh','Duessa','Edda','Elspeth','Enheduanna','Ereshkigal','Ermina','Erysse','Eyni','Genevieve','Geshtinanna','Giselle','Gwynetta','Hettana','Huller','Ilyne','Inanna','Ione','Irilde','Ismira','Isolde','Ivania','Jasoni','Jinora','Kaia','Kathlie','Keziah','Kriemhild','Ladeigh','Lenora','Liona','Liza','Lonlon','Maevra','Maloa','Marianne','Maris','Maritza','Marn','Marvene','Maude','Meilin','Mehris','Mercy','Midra','Minden','Morghana','Nayra','Navirra','Nimh','Ninsun','Noor','Noreda','Olu','Poppy','Ramya','Rei','Rohanne','Rosamund','Sable','Sade','Saiva','Sidney','Siduri','Tansy','Twila','Tyrande','Una','Ventress','Venliya','Vexa','Watonia','Willow','Ysbel','Yseuit','Ysol','Zeren','Zora'],
    s: ['Adirondack','Arkenstone','Atrahus','Banesly','Baumgardner','Beorn','Boggs','Brighton','Bregho','Brodigan','Brummond','Buskyrre','Casavantes','Dinavar','Djawadi','Doune','Drevic','Droh','Dumuzi','Enkiidu','Fairbairn','Ferros','Frad','Freuhoff','Frye','Garrinsburg','Ghoff','Grimsby','Hayworth','Hidlebaugh','Hoxhaj','Hunley','Ilye','Kastral','Keftelle','Kingsford','Krenek','Laeryn','Lorithar','Luecke','Maccar','Matthers','Maudlow','McGinley','Melange','Molinar','Mournwren',"N'or",'Ninhursag','Norveir','Odiorne','Oliphant','Orroquille','owens','Payne','Pembroke','Pettibone','Pietzsch','Renwyne','Rhodes','Riggan','Schuyler','Shalmo','Sinn','Solis','Stiles','Stroehbel','Supoc','Teach','Terrellond-Ashe','Tiber','Tintagel','Toone','Underhill','Van Kirk','Von Braun','Weisinger','Willoughsby','Wintermire','Zapruder'],
  },

  // ── ADDAMAR ──
  addamar: {
    Veridoran: {
      m: ["Ader'ran",'Aethelstan','Alec','Alden','Alonso','Amar','Archibald','Aric','Armand','Arthur','Artalis','Aela','Barnaby','Baldimar','Benjamin','Braxton','Cohl','Corben','Corrvit','Craddick','Desmond','Destin','Delvin','Dorian','Draven','Dvorak','Edgar','Elias','Elinor','Ephraim','Eraeth','Enoch','Eirik','Ethan','Finnian','Frederick','Frietze','Gavaun','Gareth','Garret','Geoffrey','Gideon','Gregory','Greyhook','Hador','Harn','Henry','Herschel','Ilphrin','Jarek','Jedediah','Jermaine','Jenson','Jonas','Josiah','Jacien','Kael','Kaelen','Kadius','Kaldor','Kethan','Kendric',"Kel'el",'Korin','Kraka-Tur','Lorne','Lucian','Laslow','Marcus','Marius','Matthias','Micah','Mordecai','Nathaniel','Oliver','Orin','Percival','Praetor','Reynard','Raeken','Reginald','Roland','Ralf','Rhaul','Robineir','Rolf','Stetson','Samuel','Sable','Sebastian','Silas','Siler','Thain','Torunn','Thomas','Tarek','Trystan','Tavish','Tovias','Trahan','Thrain','Thrazgim','Vico','Varian','Vyron','William'],
      f: ['Ada','Adelaide','Aduceneaux','Aelia','Aerin','Alderfrey','Amelia','Anastasia','Arabella','Araminta','Ascencion','Astaria','Azalea','Beatrice','Brynja','Calpurnia','Caelyn','Cassa','Celandine','Celeste','Charity','Clarabelle','Clarissa','Clementine','Comfort','Constance','Cordelia','Cressida','Dahlia','Delphine','Druella','Edie','Elinor','Elizabeth','Eloise','Erisa','Esther','Euphemia','Evelyn','Evangeline','Felicity','Gwendolyn','Galatea','Genevieve','Gracelyn','Harriet','Hedden','Hannah','Jacque','Josephine','Kandis','Kathyrn','Keturah','Krische','Leona','Lilith','Lillian','Lirien','Lorelei','Lysandra','Marigold','Martha','Madeline','Marla','Marian','Mirabelle','Mila','Millicent','Miriam','Octavia','Olexa','Omi','Orcana','Penelope','Persephone','Phoebe','Priscilla','Rebecca','Remember','Rosalind','Rosie','Rowyn','Sarah',"S'ria",'Seraphina','Serraven','Shelly','Sophia','Suri','Susanna','Tabitha','Theodosia','Tierney','Ursoi','Unity','Verity','Victoria','Zeitz','Zipporah'],
      s: ['Allaunian','Abraham','Ainsley','Aldrick','Almsteadt','Anderton','Ashcroft','Baker','Ballow','Beaumont','Beckwith','Bentham','Black','Blackwood','Bridigem','Brown','Brunmar','Bythesea','Cambley','Cauldron','Calabra','Caladon','Clayden','Cole','Colewell','Corellan','Cross','Crossley','Darrow','Davenport','Deighton','Dirthrich','Donovan','Eichor','Elkhid','Emmins','Fairchild','Ferdinand','Fenton','Fernsby','Flint','Gale','Garynnon','Greneqys','Grey','Grimmitt','Hessler','Helming','Hofeldf','Honeysuckle','Hunt','Ikard','Jennings','Johnson','Kane','Kerwood','Kubicek','Lockwood','MacQuoid','Maeir','Mara','Merritt','Middleton','Morgan','Novak',"O'Malley",'Orensken','Otto','Parrish','Park','Parkhurst','Pearce','Pembroke','Quill','Rattzlaff','Rayne','Reynolds','Rexford','Rrostarr','Ramirez','Ratliff','Raza','Schroeder','Schunatz','Seaheart','Serrano','Sigler','Sinclair','Silar','Somerset','Sinvell','Stone','Stout','Tavera','Thorne','Thorndop','Thorsteinsson','Treyarc','Tugal','Turner','Vance','Vandeventer','Vandevere','Viola','Warnock','Warren','Wendle','Westcliffe','Westwick','Whitaker','Whitman','Whitmore','Whitewood','Wheer','Wilson','Winterbourne','Worthington','Wright','Yuniesky','Zandt'],
    },
    Brunar: {
      m: ['Ahmed','Amir','Aurelio','Bersaides','Brethorn',"Dar'Zamar",'Ebrejim','Emil','Emir','Enzalor','Faustino','Galdrin','Hassam','Kalimah','Khalif','Khaled','Kenyiro','Kyvorian','Luviano','Marzied','Messied','Ohtli','Othlor','Rashid','Salgado','Solaris','Taurino','Valkor','Valrik','Vardel','Virgilio','Yahir','Yasir','Yudelmus','Yuder','Zyrian'],
      f: ['Ajmalara','Aisha','Aixa','Aliyah','Amira','Aniaya','Arusena','Ashreya','Dalia','Emerejilda','Farida','Hana','Jaramilla','Kopka','Layla','Leila','Lillith','Lina','Malika','Medellina','Nadia','Naima','Noor','Noura','Ophelia','Orellana','Rahima','Roanna','Safiya','Sana','Samira','Salma','Sylphie','Yasmin','Yanira','Yenecei','Yescenia','Zainab','Zaria','Zehyr'],
      s: ['Aaberg','Abbas','Adnan',"Al-Farouk",'Al-Malik','Al-Masri',"Al-Rumara",'Al-Zyanya','Alzalde','Arnnun','bin Musimah','Cambri','Cuellar',"Darr'holm",'DeLa','Effigia','Elizonde','Fahy','Farid','Fatima','Galarza','Hafeez','Ignacia','Kaikratok',"Keth-Ver",'Khafaji','Lancaster','Malik','Monterosso','Orrelas','Palmillos','Qadir','Quintanilla','Rubicalva','Sepulveda','Tariq','Uvon\'n','Vittori','Zapata','Zuberi'],
    },
    Matekwan: {
      m: ['Adisa','Arlis','Ayo','Azizi','Beaux','Cassius','Chane','Chike','Dholakai','Domitilo','Edilmo','Eniabitobo','Gamba','Jelani','Jahaira','Keyon','Kazi','Kofi','Kwasi','Kuyinu','Ledeaux','Luka','Mbali','Mosi','Nia','Naftari','Jahairus','Olatunde','Omotayoi','Sirewal','Tariq','Valsin','Yoandry','Zuri'],
      f: ['Adanna','Amani','Amara','Amina','Anaya','Asha','Aya','Ayanna','Aziza','Baukje','Dearesai','Eshe','Fatima','Jamila','Jabari','Kadajia','Kaisa','Kamilah','Kannora','Lorihela','Lovetta','Malika','Nayeli','Nsabuyumua','Nia','Pereyra','Safiya','Samara','Sanaa','Shura','Simina','Stacia','Temitope','Zahara','Zola','Zuri'],
      s: ['Abeni','Abimbola','Adediji','Adenuga','Adia','Adebayo','Azibo','Chenier','Chukwu','Cuyag','Dlamini','Fasse','Iweala','Jaja','Jakande','Makyambe','Mukute','Moyo','Mwamba','Nkosi','Nepueux','Nnebe','Nnamani','Nevan','Ngubane','Obiatakai','Obiatakar','Okorie','Okoro','Olumide','Onyekachi','Parvenenini','Tendaji','Wava','Waziri','Zolidvar'],
    },
    Rajava: {
      m: ['Aadhya','Arjun','Balaram','Bhaskar','Daksha','Devendra','Ishaan','Jaiyan','Keshav','Kritan','Manish','Rajendra','Raghav','Rohit','Suryan','Varun','Vikram','Yudhishthir','Kundal','Naftari','Jahairus'],
      f: ['Aishwarya','Amara','Anjali','Devi','Indira','Kamini','Kavya','Lakshmi','Manjari','Meera','Padma','Priya','Rani','Rukmini','Shaila','Shanti','Sita','Vasanti','Vasudha'],
      s: ['Awasthi','Bhardwaj','Bhattacharya','Chakravarti','Chaturvedi','Devadhar','Jaiswal','Mehta','Patil','Purnan','Rajarshi','Rajput','Rajputra','Raghunath','Rathore','Sharan','Shankar','Suryavanshi','Vardhan','Yadav'],
    },
    default: {
      m: ["Ader'ran",'Amar','Arthur','Benjamin','Gareth','Henry','Lucian','Marcus','Oliver','Roland','Samuel','Thomas','William'],
      f: ['Ada','Amelia','Celeste','Cordelia','Elizabeth','Hannah','Josephine','Lillian','Penelope','Sarah','Seraphina','Victoria'],
      s: ['Blackwood','Cole','Donovan','Fairchild','Grey','Lockwood','Morgan','Novak','Stone','Turner','Warren','Wilson'],
    },
  },

  // ── TEL'ARI (Wood, Dark, Eladrin only — Sea and Half removed) ──
  telari: {
    Wood: {
      m: ['Adran','Aelar','Aramil','Arannis','Arcturus','Ardor','Axar','Aust','Balthorin','Beiro','Berrian','Bryn','Carric','Darok','Del','Elentarien','Elowen','Enialis','Erdan','Erevan','Etowan','Eryn','Faen','Galinndan','Hadarai','Heian','Himo','Immeral','Innil','Ivellios','Lael','Laucian','Maegon','Mella','Mindartis','Naeris','Nessaeriel','Orenthil','Othorian','Paelias','Peren','Phann','Quarion','Rael','Riardon','Rinn','Rolen','Sai','Soveliss','Syllin','Thamior','Tharivol','Theren','Vall','Varis'],
      f: ['Adrie','Alesia','Althaea','Amaraë','Anastrianna','Andraste','Antinua','Ara','Auriel','Bethrynna','Birel','Caladwen','Caelynn',"Cora'nine",'Drusilia','Elaeris','Elara','Elenwë','Enna','Felosial','Galara','Isilindë','Jelenneth','Karmella','Keyleth','Kolette','Lia','Leshanna','Lyraeth','Meriele','Mialee','Naivara','Quillathe','Sariel','Shanairra','Shava','Silaqui','Syla','Sylaria','Sylvarin','Terenia','Theirastra','Thia','Thistle','Thalina','Thalira',"Tyri'Fon",'Vadania','Valanthe','Xanaphia'],
      s: ['Adgrun',"Adrast'ari","Aerynth'ael",'Aerendyl','Amakiir',"Amalys'ael",'Amastacia',"Amadaris'sin","Astariel'wyn","Astrae'lir",'Calaelen',"Caelum'sin",'Daax',"Daenar'lyn","Daenylor'el",'Eboneir',"Evendir'sil",'Eryndor',"Fyrestar'ari",'Galanodel',"Galathrae'il",'Holimion',"Holiron'drae",'Ilphelkiir',"Illyrth'wyn","Illyrthorn'ael","Key'wyn","Key'drath",'Liadon',"Liadras'ael","Lunadras'ari","Lunaris'wyn",'Meliamne',"Melianth'lyn","Naïlo","Naeth'ari","Sol'valyn","Solarys'il","Sianndal'el","Siannodel",'Swyft',"Swyftraen'el",'Tathariel',"Tathrae'lyn",'Thalassar','Thalassion',"Thalorian'el","Thaldor'sin",'Valyndor',"Velyn'lyn",'Xiloscient',"Xyldoril'sin","Zephrael'wyn"],
    },
    Dark: {
      m: ['Draegon','Dravenar','Indiro',"Keth'thrak",'Lanthir','Lirieneth','Narridh','Sszin','Thulgarin','Tzorin','Vaelinar',"Vae'l",'Vorn','Vrondir','Xalanthirr','Xalzorin','Xyldar','Xyln','Xyron','Zanor','Ze\'ev','Zyl','Zyreth'],
      f: ["Ada'ia",'Drisella','Faeryl','Ilara','Ilvara','Lexity','Liriel','Llothra','Nethilrae','Nythania','Phaerl','Quenthel','Shindia','Sylveria','Thalra','Veldrin','Vega','Velora','Viconia','Xalithra','Xilritha','Zesstra'],
      s: ['Allyian','Arabis','Arnith','Auvrea',"Dirth Norre","Dwin'orle",'Eyther','Faerondaerl','Faelor',"Halten'ea",'Halthar',"Kre'ven",'Laldir','Vhylzor','Vylnaris','Xyndraeth','Xyndraeth','Xyrlorn','Xyrthilorn','Xyrthos','Xynthor','Ysayle','Ysthrom','Zythoril','Zyraxos'],
    },
    Eladrin: {
      m: ['Aerithor','Aelaril','Aelarion','Aelithar','Alathir',"Athen'e",'Auriel','Danius','Elenwe','Elarian','Elaris','Erevan','Everath','Lirion','Lyrael','Myrithas','Nalathor','Seladon','Solarae','Solastri','Sylvaris','Thalindor','Thandui'],
      f: ['Aerithor','Aelaril','Aelarion','Aelithar','Alathir',"Athen'e",'Auriel','Danius','Elenwe','Elarian','Elaris','Erevan','Everath','Lirion','Lyrael','Myrithas','Nalathor','Seladon','Solarae','Solastri','Sylvaris','Thalindor','Thanduil'],
      s: ['Aerisindor','Aerithal','Aelarian','Alathoril','Amarilith','Aradithil','Aurielwyn','Elenwyn','Elariath','Elarion','Elowenith','Elyssathil','Lirielor','Lyraethil','Lyrsael','Myrathoril','Nalathir','Rin','Selasael','Selendrith','Solanthir','Sylvaril','Thalarael','Thalassir','Thalindor','Thalindoril'],
    },
    default: {
      m: ['Adran','Aelar','Aramil','Erdan','Erevan','Galinndan','Hadarai','Immeral','Lael','Paelias','Quarion','Rael','Rolen','Thamior','Theren','Varis'],
      f: ['Adrie','Alesia','Caelynn','Drusilia','Felosial','Jelenneth','Keyleth','Lia','Meriele','Naivara','Sariel','Shava','Silaqui','Thia','Vadania','Valanthe'],
      s: ['Adgrun','Aerendyl','Amakiir','Calaelen','Daax','Eboneir','Eryndor','Galanodel','Holimion','Ilphelkiir','Liadon','Meliamne',"Naïlo","Sol'valyn",'Siannodel','Vaelithar'],
    },
  },

  // ── DURINAK ──
  durinak: {
    Hill: {
      m: ['Baldrik','Barmok','Boril','Brolgur','Dalothaeck','Dralgur','Durnak','Durnik','Durgin','Ermmiir','Gherhart','Grimgor','Grunor','Krag','Kragrim','Keely','Orion','Osreich','Pomares','Rôk','Rurik','Thalgar','Theggard','Thralin','Throkas','Throrstuhn'],
      f: ['Agatha','Berylla','Dagnara','Eira','Elurin','Fjola','Hanne','Hilda','Karnella','Kira','Leidy','Lixy','Lyra','Milda','Ragnhild','Thora','Valkyria','Ylsa'],
      s: ['Adgrun','Brawnanvil','Brumdur','Brumhand','Daergus','Doraruk','Durndelver','Forrelyth','Gaellaus','Grilddelve','Grim-Thorne','Grumdur','Grumbeard','Ironheir','Kauzlaric','Khazdur','Kibodeaux','Kocian','Pyne','Stogrum','Stormborn','Thardunen','Thrumdur','Thrumstone'],
    },
    Mountain: {
      m: ['Adrik','Alberich','Baern','Barendd','Bhaldor','Brolgur','Brottor','Bruenor','Daernur','Dain','Darrak','Delg','Dolgrim','Dorin','Drogan','Dulmir','Eberk','Einkil','Fargrim','Flint','Forbrit','Gardain',"Ghre'nar",'Gherhart','Gimdrus','Gorstag','Gorun','Gunnar','Haldor','Hjalmar','Loghaire','Magus','Morgran','Ori','Orsik','Oskar','Rangrim','Rigor','Rurik','Sigrid','Sigrun','Svein','Taklinn','Teleftais','Theodrin','Thelkom','Thoradin','Thorin','Tordek','Traubon','Ulfgar','Vidal','Veit','Vondal','Zendrix'],
      f: ['Amber','Artin','Astrid','Audhild','Bardryn','Brynhild','Chelcea','Diesa',"Dûra'O",'Dagnal','Duvranna','Eirlys','Elin','Eowyn','Eldeth','Falkrunn','Finellen','Freydis','Greta','Gudrun','Gunnloda','Gurdis','Helja','Hildegarde','Hildryn','Hilmara','Hlin','Ilde','Jorunn','Kathra','Kristryd','Liftrasa','Lyra','Mardred','Orsikka','Olinna','Riswynn','Ragnild','Runa','Sannl','Sigrid','Sigyn','Solveig','Thalar','Theldrin','Thokka','Thrala','Thyra','Torbera','Torgga','Ullina','Vistr'],
      s: ['Ambolthjerte','Balderk','Banmur','Bjergsten','Dankil','Dargarn','Drunmok','Drunmokor','Durmokh','Durmokhaz','Durmokor',"Dûrnak","Dûrnakor",'Elkhid','Forgewinter','Frostskæg','Galen','Gremram','Graniteheart','Gorunn','Grimrock','Grenram','Holderhek','Jernskjold','Kharnagrim','Kharnaz','Khargrim','Khazdak','Khazgim','Khazgrun','Klippehånd','Loderr','Lutgehr','Rohdir','Rumnaheim','Stalhammar','Strakeln','Sunburst',"Sølvåre",'Thokkarn','Thorunn',"Thrak'ar",'Thranzak','Thranzur','Thrazgim','Thrazgurg','Torunn','Tordensmed','Ungart','Urglukh','Urglukrim','Yewhammer'],
    },
    default: {
      m: ['Adrik','Baern','Bruenor','Dain','Dorin','Eberk','Einkil','Fargrim','Gardain','Gunnar','Haldor','Ori','Orsik','Oskar','Rurik','Thoradin','Thorin','Tordek','Ulfgar','Vondal','Zendrix'],
      f: ['Amber','Artin','Astrid','Audhild','Bardryn','Brynhild','Eirlys','Falkrunn','Greta','Gudrun','Kathra','Mardred','Ragnild','Runa','Sigyn','Solveig','Thyra','Torbera','Ullina','Vistr'],
      s: ['Ambolthjerte','Balderk','Dankil','Elkhid','Forgewinter','Graniteheart','Gorunn','Grimrock','Holderhek','Loderr','Rohdir','Rumnaheim','Stalhammar','Thokkarn','Thorunn','Ungart','Yewhammer'],
    },
  },

  // ── TRINK ──
  trink: {
    m: ['Baldrik','Barmok','Boril','Brolgur','Dalothaeck','Dralgur','Durnak','Durnik','Durgin','Ermmiir','Gherhart','Grimgor','Grunor','Krag','Kragrim','Keely','Orion','Osreich','Pomares','Rôk','Rurik','Thalgar','Theggard','Thralin','Throkas','Throrstuhn'],
    f: ['Bimpnottin','Bindi','Bonnie','Breena','Caramip','Carlin','Cymbal','Daisy','Dimple','Donella','Duvamil','Elva','Ella','Ellie','Ellyjobell','Ellywick','Fern','Flicker','Gilda','Glimmer','Greta','Hazel','Hattie','Ivy','Juniper','Kizzy','Kymmi','Loopmottin','Lorilla','Lulu','Lura','Lilli','Mabel','Mardnab','Nettle','Nissa','Nyx','Olive','Oda','Orla','Petal','Pixie','Quilla','Razzle','Roywyn','Shamil','Tana','Tilda','Vella','Violet','Waywocket','Willo','Xara','Yara','Zanna','Zinnia'],
    s: ['Aleslosh','Ashhearth','Badger','Beren','Binkbeetle','Bolderamo','Brandyapple','Bernfitlacks','Cogwhistle','Cloak','Coppercoil','Corth','Coppettle','Dazzleflint','Daergel','Doublelock','Filchbatter','Fnipper','Folkor','Gallow','Garrick','Gligint','Gleamgow','Ladlemeddle','Lyle','Merrygiggle','Murnig','Nackle','Ningel','Nim','Oneshoe','Perrin','Pock','Quickwhirl','Raulnor','Scheppen','Snickerg','Snugglepuff','Spainner','Sprioil','Stumbleduck','Tailblossom','Tinetop','Tirlillinand','Tinderdell','Tumop','Turen','Wellby','Whirligig','Winkletwist','Wrenwhist','Yauntyrr'],
  },

  // ── FYNLOR ──
  fynlor: {
    Lightfoot: {
      m: ['Alton','Ander','Anso','Bodo','Boffer','Brollo','Cade','Calico','Chumley','Coglin','Corrin','Digger','Eddin','Eldon','Elton','Errich','Fenton','Finnegan','Finnan','Freddy','Garret','Gethin','Hob','Keth','Lindal','Lyle','Merric','Milo','Osborn','Reed','Roscoe','Wellby','Xannek','Brynwick'],
      f: ['Andry','Bree','Bluebell','Callie','Constance','Cora','Cricket','Dandelion','Euphemia','Glymmer','Hailey','Jillian','Juno','Kithri','Lavinia','Lidda','Marlowe','Meadow','Merla','Nedda','Paela','Peony','Portia','Sandy','Selia','Seraphina','Shaena','Thistle','Tansy','Trym','Tuppence','Vani','Verna'],
      s: ['Adalgrim','Bagwell','Berrybush','Brambleburr','Bramblethorn','Brushgather','Dappleleaf','Glimmerglen','Goldleaf','Goodbarrel','Greenbottle','Hearthstone','High-hill','Hilltopple','Hladky','Honeypot','Leagallow','Merryhill','Mossfoot','Oakenshadow','Pebblebrook','Puddlejumper','Snugbottom','Springbrook','Springleaf','Sweetbriar','Tealeaf','Thorngage','Tosscobble','Tumbletop','Underbough','Whistlewind','Willosip'],
    },
    Stout: {
      m: ['Andry','Anso','Bodo','Boffer','Brollo','Cade','Caelum','Calico','Chumley','Coglin','Dandylen','Digger','Eddin','Eldon','Eldorin','Elton','Errich','Fenton','Finn','Fosco','Froland','Gethin','Groover','Hob','Horace','Ivo','Jago','Jasper','Jolly','Kip','Landon','Lark','Lem','Merrifoot','Mungo','Ned','Odo','Pip','Quinlan','Rolo','Tuck'],
      f: ['Alira','Bell','Beryl','Blossom','Celandine','Clem','Daisy','Daffney','Dottie','Elsie','Flossie','Gertie','Goldie','Hattie','Ivy','Juniper','Kitty','Lottie','Mabel','Maisie','Marigold','Millie','Naginata','Nellie','Pansy','Pearl','Penny','Petal','Primrose','Rosie','Sadie','Susie','Tansy','Tillie','Trudie','Twiggy','Violet','Winnie','Zinnia','Zola','Zuzu'],
      s: ['Applebottom','Barrelstout','Biscuitbarrel','Bramblebush','Buckleberry','Butterburr','Caskbreaker','Claypipe','Copperkettle','Crumbleleaf','Dewdrop','Dimplechin','Drowypot','Filfern','Finegaze','Froleap','Gillywick','Goldendroop','Goorberry','Grasshopp','Goodchild','Groaty','Hearthglen','Hingfarthen','Hollowhill','Jartall','Lightheart','Meadowbrook','Merryweather','Mugwort','Oakleaf','Puddlefoot','Quickstep','Rainshadow','Riverstone','Shadewalker','Shortbread','Silverwhittle','Skiprock','Snugglebuns','Sweetwater','Underhill','Willobran'],
    },
    default: {
      m: ['Alton','Ander','Anso','Bodo','Cade','Calico','Corrin','Digger','Eldon','Fenton','Garret','Hob','Lyle','Merric','Milo','Osborn','Reed','Roscoe','Wellby'],
      f: ['Andry','Bree','Callie','Cora','Dandelion','Euphemia','Hailey','Jillian','Kithri','Lavinia','Merla','Paela','Peony','Sandy','Thistle','Tansy','Vani'],
      s: ['Adalgrim','Bagwell','Berrybush','Goodbarrel','Greenbottle','Hearthstone','Honeypot','Mossfoot','Tealeaf','Thorngage','Tosscobble','Underhill'],
    },
  },

  // ── DJINN (Genasi Elementals — Xefren/Air, Terreque/Earth, Pyrros/Fire, Vattenar/Water) ──
  djinn: {
    m: ['Aerisya','Atticus','Caius','Cassian','Evander','Felix','Galeth','Hadrian','Leander','Lucian','Maximus','Octavian','Remus','Silas','Theron','Zep\'hir','Zeyrion','Aarav','Baelor','Blath','Bran','Caelum','Davor','Elric','Faolan','Frath','Geth','Idris','Jareth','Modar','Thar','Urth','Bor','Fodel','Glar','Grigor','Igan','Ivor','Kosef','Mival','Orel','P\'yre','Pavel','Sergor','Flacari','Bael','Eldar','Grom','Jor','Khar','Luth','Malcer','Naveen','Oren','Orion','Paxton','Quillon','Razi','Sirius','Stor','Taman','Yor'],
    f: ['Aveline','Camilla','Esme','Gaia','Imogen','Jessamine','Lavinia','Maia','Neryi','Niamha','Sylvara','Amafrey','Betha','Cefrey','Fiametta','Gwyneira','Jocast','Kethra','Olga','Rhiannon','Sariel','Silifrey','Ulyana','Vespera','Westra','Xanthe','Ysanne','Alethra','Amara','Calliope','Ereanah','Isolde','Karar','Natal','Olma','Pylanae','Tanh','Zotah','Amarilla','Belara','Calista','Damaris','Faela','Galadriel','Helora','Iliara','Jessara','Kalista','Lyrae','Mireille','Nerys','Ondine','Parisa','Quenya'],
    s: ['Evershale','Fyrskar','Glimmerkith','Helkarn','Illivren','Jarnvyr','Kyrthorn','Lyraven','Mystralys','Nethraze','Orinthorn','Pyrethorn','Quaethorn','Rivenvale','Sylvarren','Thrylorn','Umbrasky','Vyrshade','Bersk','Chernin','Helder','Hornraven','Lackman','Nyrath','Orsynn','Pyrath','Qyrrin','Ryssand','Sylvaris','Tyrran','Utharyn','Vyrmere','Windrivver','Wyrmsong','Xyrellis','Zyrris','Allaistarr','Dotsk','Drakul','Farsen','Helgrin','Kaldor','Kulenov','Marsk','Nemetsk','Netherkin','Shemov','Starag','Azheran','Belaskar','Blackthorn','Cyslyr','Drelmor','Elsynth','Fyrskal','Grymryn','Haelren','Ilyssar','Jyrsyth','Kalthorn','Lyrandel','Myrthas','Xyrrak','Ylthorne','Zyrskald'],
  },

  // ── TERRAXIAN (Goliath/Nephilim) ──
  terraxian: {
    m: ['Boranh','Brogar','Dorran','Durgan','Garmek','Grendar','Halvor','Hrothgar','Kaelen','Korath','Kronar','Kromek','Khuvek','Orin','Rhogar','Sigrun','Skorn','Strongjaw','Thalgar','Thoran','Thrain','Valkar','Vardon','Vargan','Varun'],
    f: ['Brun','Brynja','Draya','Druna','Elda','Fenra','Freyja','Galara','Garrun','Jordis','Kira','Korra','Marra','Mirka','Ragna','Serka','Skara','Thalara','Thalina','Thora','Thordis','Valka','Varka','Vendra','Vuma-Theaku'],
    s: ['Andersen','Bjornsson','Clausen','Eriksson','Gundersen','Haagensen','Hammersen','Holmgaard','Ingvarsen','Jansson','Jorgensen','Kristiansen','Larsen','Lauritsen','Mathiasen','Mikkelsen','Nielsen','Olesen','Pedersen','Ragnarsson','Skovgaard','Sorensen','Stormgaard','Thorsen','Vinterson'],
  },

  // ── OTHROD ──
  othrod: {
    m: ['Tirnark','Gulall',"Gruk'thak",'Brakthar','Brugor','Drakthul','Draka','Drakka','Drogar','Durok','Garr','Gorak','Gorgothin','Graknar','Grakar','Grimgor','Grishnak',"Gruk'thak",'Grunk','Grugok','Gulall',"Gul'dan",'Gromak','Grommash','Grommok','Hulgar','Korgar','Krugor','Lazgul','Morvus','Morgash','Murgoth','Roknar','Rognak','Rukar','Skarnak','Tarok','Thokk','Thoggar','Thorgar','Thrag','Throkk','Throknar','Tirnark','Tornog','Ulgoth','Umog','Uzgar','Vargash','Zargoth','Zmaragdis',"Zo'ggar",'Zogrim','Zog'],
    f: ['Azhara','Brunga','Draga','Draka','Dronka','Drogar','Durnasha','Durgana','Eira','Gaarna','Gorlakka','Gornak','Grukka','Grishna','Grimma','Grondra','Grulk','Grunk','Gulka','Gurne','Horka','Kargana','Krisha','Krazna','Lurtza','Morga','Mornash','Narzug','Ragnara','Rika','Rogga','Rulza','Shagra','Skara','Skarzog','Sylra','Tharzog','Thokara','Throkka','Tragna','Urga','Uzgara','Vorka','Vrazka','Vrakka','Vugra','Zagra','Zokara','Zurga'],
    s: ['Aakre',"Ba'elnohr",'Brogmar','Brogmok','Brognar','Bromnar','Broknar','Broktar','Bula','Burzog','Dragnar','Drakgash','Draknar','Dralmok','Drokthar','Fjordlord','Ghoran',"Gra'adok",'Gralmok','Graktar','Grobuk','Grukthar','Grungar','Grungash',"Gul'danhrock",'Hellhammer','Kragmar','Kragthar','Krangash','Krulgash','Krugnar','Omenarr','Thranduil','Throgar','Throgash','Throkmar','Thrugmar','Thrugmok','Thrugnar','Thraknar','Zalmok','Zargash','Zolgar','Zormok','Zurnak','Zarthak','Zalthar'],
  },

  // ── DRAKAZIR ──
  drakazir: {
    m: ['Arjhan','Balasar','Bharash','Callisto','Donaar','Ghesh','Heskan',"Kald'er",'Koragon','Kriv',"Lewwe'ghar",'Medrash','Mehen','Nadarr','Pandjed','Patrin','Renthok','Rhogar','Shamash','Shedinn','Sylaren','Tarhun','Torinn','Travok','Valdarin','Zarkan'],
    f: ['Akra','Biri','Daar','Drasithia','Farideh','Harann','Havilar','Jheri','Kava','Korinn','Kylraxis','Mishann','Nala','Perra','Pyraxia','Raiann','Sora','Sornala','Surina','Syraxis','Tharzali','Thava','Uadjit','Veshara','Xyrixa','Zythra'],
    s: ['Caragarson','Clethtinthiallor','Daardendrian','Delmirev','Drachedandion','Emerury','Ehput-Ki','Fenkenkabradon','Frale','Iforson','Irame','Kepeshkmolik','Kerrhylon','Kimbatuul','Linxakasendalor','Myastan','Nemmonis','Norixius','Ophinshtalajiir','Prexijandilin','Shestendeliath','Storrae','Thunerike','Turnuroth','Verthisathurgiesh','Yarjerit'],
  },

  // ── HELIANTH (Tiefling) ──
  helianth: {
    m: ['Corvus','Corvum','Aoth','Bareris','Ehput-Ki','Kethoth','Mumed','Ramas','So-Kehur','Thazar-De','Urhur','Borivik','Faurgar','Jandar','Kanithar','Madislak','Ralmevik','Shaumar','Vladislak','Diero','Marcon','Akmenos','Amnon','Barakas','Damakos','Ekemon','Iados','Kairon','Leucis','Melech','Mordai','Morthos','Pelaios','Skamos','Therai','Pieron','Rimardo','Romero','Umbro'],
    f: ['Arizima','Chathi','Nephis','Nulara','Murithi','Sefris','Thola','Umara','Zolis','Fyevarra','Hulmarra','Immith','Imzel','Navarra','Shevarra','Tammith','Yuldra','Balama','Dona','Faila','Jalana',"Damar'ra",'Luisa','Quara','Selise','VondaAkta','Anakis','Leucia','Bryseis','Criella','Damaia','Ea','Kallista','Lerissa','Makaria','Nemeia','Orianna','Phelaia','Rieta'],
    s: ['Corraer','Ankhalab','Anskuld','Fezim','Hahpet','Nathandem','Sepret','Uuthrakt','Chergoba','Dyernina','Iltazyara','Murnyethara','Stayanoga','Ulmokina','Agosto','Astorio','Calabra','Domine','Falone','Marivaldi','Pisacar','Aberwyn','Brynmor','Caerthyn','Derwynn','Eirwen','Fenwyll','Glynfyr','Hafryn','Islynd','Llyrien','Maelwys','Neirin','Owynal','Rhodwyn','Selwynn','Talfryn','Wynfael','Gwynfraught'],
  },

  // ── SERAPHAN ──
  seraphan: {
    m: ['Advachiel','Af','Ambriel','Ananiel','Apollyon','Armaros','Asbeel','Asmodel','Azazel','Azrael','Baraqiel','Barbiel','Barchiel','Bezaliel','Binah','Butator','Cambiel','Chazaqiel','Chesed','Chokhmah',"Da'at",'Dumah','Eistibus','Ein Sof','Gabriel','Gadreel','Gevurah','Hamaliel','Hanael','Hasmed','Hod','Israfel','Keter','Kokabiel','Kundaliel','Leliel','Malahidael','Malkuth','Matariel','Muriel','Netzah','Penemue','Phanuel','Rahab','Raphael','Raziel','Remiel','Remph','Sachiel','Samshiel','Samyaza','Sandalphon','Sariel','Sathariel','Sahaqiel','Shelegiel','Shateiel','Simikiel','Suchlaph','Suphlatus','Tamiel','Tifiret','Turiel','Uriel','Verchiel','Yesod','Zachriel','Zaqiel','Zuriel'],
    f: ['Rota','Pythia','Seraphina','Celestia','Lumira','Auriela','Elysia','Solara','Iriel','Vestal','Sancta','Divinara'],
    s: ['Altum','Celestine','Divinus','Gloriam','Luminal','Radiantis','Stellan','Vestal'],
  },

  // ── NAZARI ──
  nazari: {
    m: ['Nerio','Astralis','Delphinus','Flanrilyn','Naida','Vemres','Cilz\'is',"Zoro'ah",'Tavian','Ulric','Vash','Wren','Xander','Yorick','Zephyrus','Bodhi','Cyrus','Dante','Finnian','Hiro','Icarus','Jaxon','Kian','Nero','Phelan','Quinlan','Rylan','Soren','Tarquin','Ulysses','Mipha','Laruto','Mikau','Sidon','Ralis','Dento'],
    f: ["Tha'lara",'Adrasteia','Cerbera','Delphia','Eupraxia','Fiametta','Hecate','Kallisto','Morwyn','Nyx','Persephone','Quorra','Ravenna','Selene','Theia','Ulyssa','Vespera','Xanthe','Ysara','Bellatrix','Elysia','Fiorella','Giselle','Hestia','Inara','Jinx','Kismet','Mireille','Nefertari','Phaedra','Lulu','Ruto','Zora','Rutela','Gaddison','Tona'],
    s: ['Azurewave','Umuzath','Maridwyn','Nautilus','Oceiros','Nereide','Pelagion','Meridian','Delpharis','Sirena','Marisal','Abyssia','Neptunis','Amorath','Dahlogath','Volarian','Aquafyre','Undyrath','Leviathar','Marindros','Nauticael','Typharius','Oceanastra','Nereidium','Pelagoros','Thalassir','Meridys','Delpharion','Sirenara','Posiodous','Marintide','Trello','Ledo','Laflat','Ettu','Tottika'],
  },

  // ── FAE ──
  fae: {
    m: ['Armand','Étienne','Fabien','Henri','Jacques','Laurent','Mathieu','Pierre','René','Rémy','Thierry','Aelaril','Aelarion','Danius','Elenwe','Elarian','Erevan','Everath','Lirion','Lyrael','Myrithas','Nalathor','Seladon','Solarae','Sylvaris','Thalindor'],
    f: ['Adèle','Amélie','Camille','Céline','Dianthe','Élodie','Ilayda','Lucie','Margot','Mathilde','Wyhn','Aelindra','Aelithra','Auriel','Caelithra','Daelora','Elaria','Elindra','Faelith','Galindra','Harael','Ildra','Jaelith','Kaelira','Laerina','Maelindra','Naelithra','Orina','Paelina','Raelora','Saelithra','Taelindra','Turina','Vaelora','Zaelithra'],
    s: ['Brumes','Étoiles','Faucon','Féerie',"l'Aube",'Mystère','Rêves','Sortilège','Songes','Trésor','Ventes','Aerisindor','Aerithal','Aelarian','Alathoril','Aurielwyn','Elenwyn','Elariath','Elarion','Lirielor','Lyraethil','Nalathir','Rin','Selasael','Selendrith','Solanthir','Sylvaril','Thalarael','Thalassir','Thalindor'],
  },

  // ── PA'MORPH — per bloodline ──
  pamorph: {
    simian: {
      m: ["Harambe'ye",'Bemba','Tano','Jabari','Koba','Aldo','Kofi',"Malik'eir",'Nuru','Rafik','Tariku','Bantu','Bahati','Kamau','Tojo','Kwesi','Mbeki','Kato'],
      f: ['Neema',"Niarah'ell",'Mandisa','Safiya','Kikimba','Jajama','Rafara','Tumaki','Ayo','Xoliswa','Kosi','Nareema','Okoyamb','Kaziya','Nyota','Malaike','Kumba','Kesa'],
      s: ['Mbaku','Njobu',"M'Banga",'Nkosi','Ogun',"T'Chaka",'Zuri','Ramonda','Kasumba',"T'Challa",'Shuri','Nakia','Okoye','Aneka',"N'yami","N'Jobu","W'Kabi","M'Kathu"],
    },
    kraark: {
      m: ['Kraven','Jackdaw','Cawthorn','Aodhfionn',"Reva'lee",'Kiff','Killian','Murk','Kreech','Rook'],
      f: ['Lykia','Totori','Brenna','Ravena','Plume','Tawny','Naiad','Apsara','Kiku','Kotone','Asrai','Michiko','Miyu','Nami','Devika','Ishani','Malini'],
      s: ['Aleval','Sunwing',"Ra'kesh",'Krowe',"Sa'era",'Aryama','Chandradeva','Divyansh','Pate','Sharma','Gupta','Singh','Chatterjee','Mishra','Reddy','Khan','Desai'],
    },
    cathvari: {
      m: ['Ambrose','Aurelius','Nyx','Evander','Orion',"Dro'farahn",'Aurelius',"Ri'Jirr",'Alvasorr','Orlen',"Er'zin-Dar","Dro'Tasarr",'Alaric','Nipsey','Sinatra','Sonny'],
      f: ['Selene','Isadorella','Lysandiera','Adlara','Moja','Shade',"J'zara","Ri'saadra","Daro'rah","S'ashi","Ka'jira","Ma'jara","Nari'dra","Zha'zi","Sha'ri"],
      s: ['Dawr','Frostfur','Swyftpaw','Willow','Swistrik','Wielay','Hulgdirth',"Daro'jin","Ri'saadi","J'zirra","S'harra","Sha'adzi","Ka'jiri","Ma'jassa","S'karra","Zha'khar"],
    },
    maernethim: {
      m: ['Draxus','Venoxis','Sinawar','Sssthraak','Vrulsh','Hisskith','Zalthar','Kristk','Drathos','Kesskra','Ssylthar','Xarruk','Veskarn','Achuak','Aryte','Darastrix','Garurt','Kepesk','Kethend','Korth','Kosj','Kothar','Litrix','Mirik','Throden','Thurkear','Usk','Valignat','Vargach','Vutha','Vyth'],
      f: ['Zalara','Virella','Nyxstra','Brynhildr','Asha','Ssirra','Vesskra','Zhirna','Kresha','Narasha','Xalara','Viskara','Ssyla','Thryss','Zelith','Vyssira','Jhraxis','Lysstra','Kyreth','Sissara','Tzerys','Vrulsh','Zurnith','Vyth','Drake','Lyzzra','Zarrith','Krysska','Vythara'],
      s: ['Huitaca','Eda','Taruca','Ussun','Asiini','Sibanda','Vashitraloth','Sylvariskarth','Thalassaradon','Veridrianth','Pyrocladrek','Zathrakarr','Morzathral','Kryntessarin','Thalrukarr','Vorakazath','Zylthaross','Drakathron','Sylarithak','Krithassath','Vryndarak','Zyraxanoth','Thrixalmar','Varkalith','Sythrakal','Zarnakoth','Drithakarr','Thylorath','Vorskithar','Krymaloth','Tharokenth'],
    },
    orylin: {
      m: ['Yonari','Aelarion','Branthor','Caelith','Dathorim','Elarok','Faelir','Galorin','Harethor','Iorim','Jorandor','Kaelithor','Laeron','Maelgor','Naelrin','Orinthal','Paelion','Quareth','Raelor','Saelmir','Taelor','Uriel','Vaelorin','Waelith','Xaelrin','Yaelor','Zaelithor','Elithar','Torandir','Velanith','Zarethor'],
      f: ['Aphis','Aelindra','Brinael','Caelithra','Daelora','Elaria','Faelith','Galindra','Harael','Ildra','Jaelith','Kaelira','Laerina','Maelindra','Naelithra','Orina','Paelina','Raelora','Saelithra','Taelindra','Turina','Vaelora','Waelina','Xaelindra','Yaelora','Zaelithra','Elindra','Torinda','Velithra','Zinael'],
      s: ['Deecye','Aurelianus','Borgjin','Calidus','Domitiana','Fulgentius','Gloriosa','Honoria','Ignatia','Jovian','Lucida','Magnus','Nobilis','Octaviana','Praetoria','Quintilian','Regula','Sapiens','Titanius','Valeria','Venerabilis','Fortunata','Felicia','Peregrina','Maxima','Severina','Viridis','Bellator','Castoria','Marcellina','Claudian'],
    },
    aaravok: {
      m: ['Aegemon','Lykourgos','Hypatios','Thalassios','Xenokrates','Ariston','Yillaf','Gralierc','Erred','Phaedymarr','Rulerc','Rook','Akka','Victor','Thalas'],
      f: ["Me'latheia",'Kalia','Liera','Zara','Kalithar','Zephyros','Aerion','Korrith','Valara','Nythera','Paryss','Eldrith',"Skyd'a",'Jynara'],
      s: ['Aeir','Zirr',"Ra'k",'Dekkea','Rhirref','Ewing','Aethra','Aelaf','Valroth','Skyllon','Aerinth','Zephyrith','Galerra','Winorex','Aerinth'],
    },
    hoshiari: {
      m: ['Renato','Lolek','Seminole','Haruki','Aurum','Fib','Royaro','Kaiketsu','Renamon','Vuk','Bravor'],
      f: ['Kurama','Mimi','Pammee','Porrel','Nanao','Evita','Zorori','Morala','Parisa','Korravra'],
      s: ['D Change',"Těsnohlídek",'Dérhaget','Tresserre','Rompu','Acéré','Ardentbrin','Inclin','Aigu','Ligné'],
    },
    lioreth: {
      m: ['Kenzo','Kwame','Leonidas','Malik','Zain','Adanna','Kofi','Sekou','Kwasi',"Y'kote",'Theros',"Ba'Ruta",'Elennian','Kaldor','Amarok','Menelik'],
      f: ['Abena','Malaika','Amina','Nia','Isara','Zahara','Nala','Aurora','Leona','Asantewaa','Nzinga','Samori','Sundiata','Cetshwaya','Haile','Nandi'],
      s: ['Umbacca','Odion','Okoro','Doumbia','Azikiwe','Ogbonna','Obi','Jelani','Ebo','Adebayo','Kamara','Amara','Onyeka','Theros','Brokenmoor','Cindermane'],
    },
    harelin: {
      m: ['Varian','Arthas','Lothar','Uther','Turalyon','Bolvar','Khadgar','Danath','Tirion','Muradin','Rhonin','Medivh','Kael','Genn','Llane','Aiden','Daelin','Thoradin'],
      f: ['Alleria','Taria','Calia','Vereesa','Moira','Tiffin','Lorna','Aegwynn','Tamsin','Tessia','Aysa','Taria','Adariall','Dorna','Yrel'],
      s: ['Proudmoore','Menethil','Wrynn','Mograine','Thaurissan','Darvane','Mograine'],
    },
    bovorin: {
      m: ['Dorotok','Asefen','Laanter','Henedin','Oenken','Fenfen','Kindaran','Goerut','Manbaran','Gunrios'],
      f: ['Doralin','Asefira','Laanthra','Henedia','Oenkara','Fenfira','Kindara','Goerana','Manbara','Gunriya'],
      s: ['Orcroar','Azazelth','Belialun','Eblisur','Lilithius','Molochyr','Asmodekr','Mephistyn',"Be'ebon","Lulie'el",'Samaelar'],
    },
    satyr: {
      m: ['Arykis','Tolar',"Kiel've",'Bolderamo','Efamos','Thornhoof','Euphronios','Ogiq','Ramzal','Ashurim','Dagonis','Gaddur','Shamgar'],
      f: ['Moonaiya','Brynn','Whymsee','Asenath','Ishara','Atargatis','Lilitha',"Ishtarai",'Samirah','Elishara','Kalila','Tanitha'],
      s: ['Cabbell','Berggin','Gnomire','Keoghan','Fyrin','Duvican','Raithen','Maincher','Malgray','Boigan','Gaoth','Dornal','Conrick'],
    },
    brawnath: {
      m: ['Antoninus','Caecilius','Aikaterine','Aachard','Aiolos','Aristos','Herakles','Chryseis','Balric'],
      f: ['Demetr','Aemiliana','Hortensia','Dionys','Eurydice','Hella','Chryseia','Perseah','Zirathra'],
      s: ['Okeanos','Astraeus','Pelagos','Alkaios','Nereus','Erebos','Kallipolis','Olymp'],
    },
    rhainar: {
      m: ["Rhas'dar",'Attila','Bleda','Ruga','Mundzuk','Ellac','Dengizich','Uldin','Charator','Rua','Octar'],
      f: ['Aysha','Zuleika','Suren','Khatun','Alpika','Darya','Altantsetseg','Gulayim',"Gülşah",'Erdenetsetseg','Rhisira'],
      s: ['Targutai','Chingis','Batu','Temür','Ogedei','Kaidu','Subutai','Ordu','Orlok','Noyan','Urussaire'],
    },
    taeranari: {
      m: ['Tiber','Ulfgar','Fenrir','Skoll','Sif','Vidar','Haldor','Torvald','Roggulf'],
      f: ['Runa','Hati','Frieda','Rieka','Solveig','Eirlys','Lagertha','Nurdvild','Ygfalestris'],
      s: ['Shrouw','Bjornssen','Fenrirson','Hrothgarsson','Skollrsson','Runewulf','Ylvaström'],
    },
    testudon: {
      m: ["Kohr'hul",'Treshel','Olutt',"Vayhr'hul",'Qapott','Wod'],
      f: ['Tinle','Iartlatt','Tunqwy','Dura','Tuarot','Buozli'],
      s: ["Kai'on",'Ubi','Wod','Nuepyg','Wua','Linqo'],
    },
    ssazaral: {
      m: ['Eldric','Grimnir','Kaelthas','Lir\'ael',"Necht'an",'Sozsi','Vaelin','Wulfgar','Xiltotl','Zarssen'],
      f: ['Hihli','Kethra','Mosa','Seraffina','Seretha','Sessaria',"Sses'suth",'Ssike','Thessa','Vixra'],
      s: ['Hikra','Hyrainth','Krilot','Lomed','Sahahliel','Ssathash','Sserento','Ssithra','Verdant','Vesssark'],
    },
    default: {
      m: ['Kraven','Kenzo','Haruki','Aurum','Aegemon','Killian','Rook','Leonidas','Varian'],
      f: ['Neema','Abena','Malaika','Lykia','Selene','Alleria','Kurama'],
      s: ['Mbaku','Umbacca','Krowe','Proudmoore','Aleval','Ardentbrin','Deecye'],
    },
  },

  // ── CHRONISON — first=designation, last=serial code ──
  // Variants: Defensive, Corrupted/Rogue, Specialist
  // First names: any designation title (player can also type freely)
  // Last names: serial codes — locked to generate only
  chronison: {
    Defensive: {
      m: ['Guardinal','Bastion','Protector','Sentinel','Bulwark','Warden','Rampart','Aegis','Vanguard','Paragon','Stalwart','Ironhold','Fortress','Citadel','Palisade'],
      f: ['Guardinal','Bastion','Protector','Sentinel','Bulwark','Warden','Rampart','Aegis','Vanguard','Paragon','Stalwart','Ironhold','Fortress','Citadel','Palisade'],
      s: ['404-L','103-D','Sigma-21','Sigma-20','Protector-7','Bulwark-12','Warden-44','Rampart-03','Aegis-88','Vanguard-16','Bastion-91','Sentinel-05','Ironhold-77','Citadel-33','Palisade-02'],
    },
    'Corrupted/Rogue': {
      m: ['Revenant','Errant','Manifold','Obfuscator','Specter','Aberrant','Fractured','Deviant','Rogue','Schism','Glitch','Null','Phantom','Wraith','Corrupted'],
      f: ['Revenant','Errant','Manifold','Obfuscator','Specter','Aberrant','Fractured','Deviant','Rogue','Schism','Glitch','Null','Phantom','Wraith','Corrupted'],
      s: ['303-Z','Prime-7','Lambda-88','75-L','Omega-17','Theta-12','Sigma-18-C','457-A','Rogue-91','Null-00','Glitch-13','Fracture-44','Schism-07','Deviant-55','Specter-29'],
    },
    Specialist: {
      m: ['Chronoform','Medica','Catalyst','Analyst','Archivist','Codex','Lexicon','Cipher','Oracle','Calculus','Praxis','Logis','Synapse','Nexus','Axiom'],
      f: ['Chronoform','Medica','Catalyst','Analyst','Archivist','Codex','Lexicon','Cipher','Oracle','Calculus','Praxis','Logis','Synapse','Nexus','Axiom'],
      s: ['Lambda-76','Prime-12','Sigma-18','Theta-09','Codex-44','Lexicon-03','Cipher-77','Oracle-21','Calculus-55','Praxis-08','Logis-34','Synapse-19','Nexus-3','Axiom-61','Analyst-40'],
    },
    default: {
      m: ['Guardinal','Revenant','Chronoform','Bastion','Errant','Medica','Catalyst','Manifold','Sentinel','Aegis','Vanguard','Paragon','Specter','Cipher','Oracle','Nexus','Axiom','Codex','Warden','Null'],
      f: ['Guardinal','Revenant','Chronoform','Bastion','Errant','Medica','Catalyst','Manifold','Sentinel','Aegis','Vanguard','Paragon','Specter','Cipher','Oracle','Nexus','Axiom','Codex','Warden','Null'],
      s: ['404-L','303-Z','Lambda-76','103-D','Prime-7','Prime-12','Sigma-18','Lambda-88','75-L','Sigma-21','Omega-17','Theta-12','457-A','Nexus-3','Codex-44','Cipher-77','Oracle-21','Axiom-61','Warden-44','Null-00','Glitch-13','Aegis-88','Paragon-16','Specter-29','Bastion-91'],
    },
  },
};


// ─── NAME GENERATION ──────────────────────────────────────────────────────────
// Returns { m:[], f:[], s:[] } for a given race + variant + pamorph bloodline
// Also always includes a sample from the UNUSED world pool
export function getNamePool(raceId, variant, pmBloodline) {
  const unused = NAMES.unused;
  let pool = { m: [], f: [], s: [] };

  const race = RACES.find(r => r.id === raceId);
  if (!race) return { ...unused };

  const ns = race.ns;
  const raceNames = NAMES[ns];

  if (!raceNames) return { ...unused };

  // Pa'morph: look up by bloodline
  if (raceId === 'pamorph' && pmBloodline) {
    const bl = raceNames[pmBloodline] || raceNames.default;
    pool = bl ? { m: bl.m || [], f: bl.f || [], s: bl.s || [] } : pool;
  }
  // Races with sub-variants
  else if (variant && raceNames[variant]) {
    pool = { m: raceNames[variant].m || [], f: raceNames[variant].f || [], s: raceNames[variant].s || [] };
  }
  // Races with flat arrays (no sub-variants)
  else if (Array.isArray(raceNames.m)) {
    pool = { m: raceNames.m || [], f: raceNames.f || [], s: raceNames.s || [] };
  }
  // Fall back to default sub-pool
  else if (raceNames.default) {
    pool = { m: raceNames.default.m || [], f: raceNames.default.f || [], s: raceNames.default.s || [] };
  }

  // Merge in unused world names (interleaved)
  return {
    m: [...pool.m, ...unused.m],
    f: [...pool.f, ...unused.f],
    s: [...pool.s, ...unused.s],
  };
}

// ─── GODS ─────────────────────────────────────────────────────────────────────
export const GODS = [
  { label: 'Soterian', list: [
    { name:"Ba'elnim", domain:'Light & Wisdom',    affil:"Sovereign Kingdom / Ba'elnari",   desc:"God of light, wisdom, and divine truth. Those marked by Ba'elnim see through deception and carry an inner glow into the darkest places.", moralityNudge:2  },
    { name:"Fi'harta", domain:'Wisdom & Sight',    affil:"Elven / Quynthe'ra",              desc:"The elven goddess of wisdom and foresight. Fi'harta rewards careful thought and long memory.", moralityNudge:1 },
    { name:'Iło',      domain:'Nature & Growth',   affil:"Verdelie're / Sanctum Tree",      desc:"A god of living things and the Sanctum Tree. Those who serve Ilo walk in harmony with the natural cycle.", moralityNudge:1 },
    { name:'Ruehnar',  domain:'Love & Devotion',   affil:'Veridoran / Aldermore',           desc:"Goddess of love, devotion, and chosen bonds. Her faithful rarely walk alone for long.", moralityNudge:1 },
    { name:'Ylandar',  domain:'Truth & Justice',   affil:'Ylandarian Order',                desc:"God of truth, justice, and the law of consequence. Clerics of Ylandar cannot knowingly speak a lie.", moralityNudge:2 },
    { name:'Firreth',  domain:'Ambition & Fire',   affil:'Soterian — Evil',                 desc:"A god of cold ambition and consuming flame. Those who serve him rise fast, but burn others on the way up.", moralityNudge:-2 },
    { name:'Duneyrr',  domain:'Deception & Shadow',affil:'Soterian — Evil',                 desc:"The god of comfortable lies and careful shadows. His faithful are skilled architects of false faces.", moralityNudge:-2 },
    { name:'Khoneus',  domain:'Shadow & Secrets',  affil:'Soterian — Evil / Embrelyn',      desc:"God of secrets, shadow, and calculated darkness. His faithful include blood hunters and inquisitors of gray morality.", moralityNudge:-1 },
    { name:'Baeshra',  domain:'The Hunt & Nature', affil:"Soterian — Neutral / Pa'morph",   desc:"God of the hunt, the cycle of predator and prey, and natural law. He demands only that the hunt be honest.", moralityNudge:0 },
    { name:'Daretror', domain:'Chance & Balance',  affil:'Soterian — Neutral',              desc:"God of chance, balance, and the unpredictable turn. His shrines appear where luck changed.", moralityNudge:0 },
    { name:'Hreidmar', domain:'Stone & Patience',  affil:'Dwarven — Neutral',               desc:"A dwarven deity of stone, endurance, and deep patience. His faithful do not rush, and they remember everything.", moralityNudge:0 },
    { name:'Shevar',   domain:'Gold & Fortune',    affil:'Gnome / Trink / Auric Order',     desc:"The gnome god of gold, wealth, and fortune. He blesses those who are clever, not those who are simply lucky.", moralityNudge:0 },
  ]},
  { label: 'Primordials', list: [
    { name:'Elgar',  domain:'Free Will', affil:'Altum (Heaven)',   desc:"The High God of Free Will. His seal makes his faithful impossible to compel or dominate.", moralityNudge:2 },
    { name:'Zathon', domain:'Fate',      affil:'Stygia (Hell)',    desc:"The Abyssal God of Fate. Zathon does not create fate — he enforces it.", moralityNudge:-1 },
  ]},
  { label: 'Celestials', list: [
    { name:'Rota', domain:'The Cycle',    affil:'Celestial',               desc:"A celestial spirit of the great cosmic cycle — birth, death, and return. Her chosen tend to survive things they should not.", moralityNudge:1 },
    { name:'Atu',  domain:'Ancient Will', affil:'Testudon God / Celestial', desc:"The ancient god of the Testudon people. He is said to carry entire civilizations on his back.", moralityNudge:1 },
  ]},
];

// ─── SPIRITS ──────────────────────────────────────────────────────────────────
export const SPIRITS = [
  { label: 'Soteria elemental', list: [
    { name:'Ínanhn / Brek',   domain:'Fire — Passion, Destruction, Rebirth',             affil:'Soterian Elemental', desc:"Ínanhn is the consuming flame; Brek is the ash that follows. Together they govern fire in all its forms.", moralityNudge:0 },
    { name:'Enkì / Gourn',    domain:'Earth — Strength, Stability, Growth',               affil:'Soterian Elemental', desc:"Enkì is the deep bedrock; Gourn is the slow accumulation of soil above it. Together they govern earth.", moralityNudge:1 },
    { name:'Lusunzi / Akapa', domain:'Water — Healing, Fluidity, Adaptation',             affil:'Soterian Elemental', desc:"Lusunzi is the moving current; Akapa is the still pool that reflects. Together they govern water.", moralityNudge:1 },
    { name:'Aehalus / Sil',   domain:'Air — Freedom, Inspiration, Change',                affil:'Soterian Elemental', desc:"Aehalus is the open wind; Sil is the breath held just before the leap. Together they govern air.", moralityNudge:0 },
  ]},
  { label: 'Simic elemental', list: [
    { name:'Din / Rin',      domain:'Aether — Mystery, Connection, Eternity',             affil:'Simic Elemental',           desc:"Din is the resonant hum that underlies all things; Rin is the silence between, where meaning lives.", moralityNudge:0 },
    { name:'Reynu / Ifu',    domain:'Lunar Energy — Serenity, Reflection, Illumination',  affil:'Simic Elemental / The Line', desc:"Reynu is the cool light that falls on still water; Ifu is the shadow on the other side of it.", moralityNudge:1 },
    { name:'Sevax / Parthen',domain:'Solar Energy — Vitality, Warmth, Radiance',          affil:'Simic Elemental',           desc:"Sevax is the living warmth of the sun at its height; Parthen is the long light of the afternoon.", moralityNudge:1 },
    { name:'Ix / Hade',      domain:'Void — Emptiness, Nihilism',                         affil:'Simic Elemental',           desc:"Ix is the space where something was removed; Hade is the indifference that filled it.", moralityNudge:-2 },
  ]},
  { label: 'Lorük elemental', list: [
    { name:'Amala / Zayvull',domain:'Arc — Innovation, Energy, Magic',               affil:'Lorük Elemental', desc:"Amala is the spark of the new idea; Zayvull is the current that carries it into form.", moralityNudge:0 },
    { name:'Vang / Lig',     domain:'Gravity — Attraction, Balance, Force',          affil:'Lorük Elemental', desc:"Vang is the pull; Lig is the equilibrium that pull produces.", moralityNudge:0 },
    { name:'Dioys / Isild',  domain:'Stasis — Preservation, Constancy, Stillness',   affil:'Lorük Elemental', desc:"Dioys is the moment held; Isild is the structure that makes holding possible.", moralityNudge:1 },
    { name:'Birn / Irnal',   domain:'Strand — Connection, Fate, Destiny',            affil:'Lorük Elemental', desc:"Birn is the thread laid out ahead; Irnal is the thread behind, already woven.", moralityNudge:0 },
  ]},
];

// ─── UNAFFILIATED OPTIONS ─────────────────────────────────────────────────────
export const UNAFFILIATED = [
  { id:'atheistic', label:'Atheistic', desc:'Actively rejects the divine.',  moralityNudge:0  },
  { id:'agnostic',  label:'Agnostic',  desc:'Uncertain. Uncommitted.',        moralityNudge:0  },
  { id:'nihilism',  label:'Nihilism',  desc:'Nothing holds meaning.',         moralityNudge:-1 },
  { id:'none',      label:'None',      desc:'No designation.',                moralityNudge:0  },
];

// ─── CLASSES ──────────────────────────────────────────────────────────────────
export const CLASSES = {
  magic: [
    { id:'inquisitor', name:'Inquisitor', path:'Divine',    disc:'Sanctus',   t2:'Paladin / Cleric',       t3:'Iridesce / Augur',        stats:'Wis/Cha', magicTechNudge:-1 },
    { id:'zealot',     name:'Zealot',     path:'Spiritual', disc:'Sacral',    t2:'Shaman / Bokor',         t3:'Caelyn / Cursewright',    stats:'Wis/Con', magicTechNudge:-1, isSacral:true },
    { id:'weaver',     name:'Weaver',     path:'Magic',     disc:'Mana',      t2:'Bard / Castor',          t3:'Maiar / Magus',           stats:'Int/Cha', magicTechNudge:-2 },
    { id:'druid',      name:'Druid',      path:'Nature',    disc:'Essence',   t2:'Ovate / Wildheart',      t3:'Dryad / Primalist',       stats:'Wis/Dex', magicTechNudge:-1 },
    { id:'sage',       name:'Sage',       path:'Arcane',    disc:'Gnosis',    t2:'Codexer / Scribe',       t3:'Glyphsage / Runesiph',    stats:'Int',     magicTechNudge:-1 },
    { id:'mystic',     name:'Mystic',     path:'Mythic',    disc:'Shaeid',    t2:'Guardian',               t3:'Arcani',                  stats:'Wis/Cha', magicTechNudge:-2 },
    { id:'magister',   name:'Magister',   path:'Shadow',    disc:'Wraill',    t2:'Hemoclast / Harrow',     t3:'Necromancer / Darkweaver',stats:'Int/Cha', magicTechNudge:-2 },
  ],
  tech: [
    { id:'merchant',  name:'Merchant',  path:'Business',    disc:'Gain',      t2:'Emissary / Diplomat',    t3:'Tycoon / Negotiator',     stats:'Cha/Int', magicTechNudge:1  },
    { id:'fighter',   name:'Fighter',   path:'Martial',     disc:'Grit',      t2:'Barbarian / Swashbuckler',t3:'Knight / Marauder',      stats:'Str/Con', magicTechNudge:2  },
    { id:'vanguard',  name:'Vanguard',  path:'Anti-Magic',  disc:'Focus',     t2:'Sentinel / Null',        t3:'Whyth / Warden',          stats:'Con/Str', magicTechNudge:2  },
    { id:'alchemist', name:'Alchemist', path:'Alchemic',    disc:'Matter',    t2:'Mutagenist / Bombardier',t3:'Biomancer / Saboteur',    stats:'Int/Con', magicTechNudge:1  },
    { id:'scholar',   name:'Scholar',   path:'Academic',    disc:'Reason',    t2:'Tactician / Cartographer',t3:'Strategist / Archivist', stats:'Int/Wis', magicTechNudge:1  },
    { id:'rogue',     name:'Rogue',     path:'Covert',      disc:'Lithium',   t2:'Inspector / Ranger',     t3:'Detective / Strider',     stats:'Dex/Int', magicTechNudge:1  },
    { id:'artificer', name:'Artificer', path:'Engineering', disc:'Ingenuity', t2:'Gunslinger / Tinkerer',  t3:'Thaumaturge / Machinist', stats:'Int/Dex', magicTechNudge:2  },
  ],
};

export const ALL_CLASSES = [...CLASSES.magic, ...CLASSES.tech];

// ─── STATS ────────────────────────────────────────────────────────────────────
export const ALL_STATS = [
  { key:'spirit',  label:'Spirit',  equiv:'Charisma',     axis:'magic' },
  { key:'soul',    label:'Soul',    equiv:'Faith',        axis:'magic' },
  { key:'body',    label:'Body',    equiv:'Constitution', axis:'magic' },
  { key:'essence', label:'Essence', equiv:'Wisdom',       axis:'magic' },
  { key:'will',    label:'Will',    equiv:'Strength',     axis:'tech'  },
  { key:'whim',    label:'Whim',    equiv:'Dexterity',    axis:'tech'  },
  { key:'mind',    label:'Mind',    equiv:'Intelligence', axis:'tech'  },
  { key:'dream',   label:'Dream',   equiv:'Intent',       axis:'tech'  },
];

export const DEFAULT_STATS = {
  spirit:8, soul:8, body:8, essence:8,
  will:8,   whim:8, mind:8, dream:8,
};

// ─── BACKSTORY POOLS ──────────────────────────────────────────────────────────

export const BS_ORIGINS = {
  addamar: [
    "Born in the cobblestone sprawl of Ashendell, where the Veinrunner tracks split the city into those who prospered and those who were forgotten",
    "Raised in the desert trade routes of the Brunar, where every agreement was sealed in blood and hospitality",
    "A child of the Matekwan spirit-forests, where the ancestors speak through the rustling of the maize and the crack of river stone",

    "Born under the watch of a provincial banner in Veridora, raised to believe that law matters most when the world begins to come apart",
    "Raised in a river market where twelve dialects could be heard before midday and nobody asked too many questions if your coin was good",
    "Born to a family sworn to a minor house of Addamar, where duty was inherited before property ever was",
    "Raised near a Veinrunner depot, half in awe of the engines and half in fear of what they were replacing",
    "A child of a frontier garrison, taught early that civilization is less a gift than a wall that must be held",
    "Born in a quarter of old stone and rusting pipework, where the city kept expanding but never seemed to repair its own foundations",
    "Raised by itinerant record-keepers who traveled between settlements copying births, deaths, debts, and wars into ledgers no one else was meant to read",
    "Born in a hill settlement loyal to the Sovereign Kingdom, where prayer, census, and conscription all arrived with the same knock at the door",
    "Raised in a dock district on stories of distant islands, titan-backed cities, and sailors who claimed the sea had moods of its own",
    "A child of caravan law, learning the value of names, routes, and promises before ever learning who truly ruled the land",
    "Born in the shadow of old battlements left from an earlier age, where every family had its own version of why the walls still mattered",
    "Raised in a farming province where the soil had gone strange in places and elders blamed either progress or punishment depending on the day",
    "Born into a house of minor clerks and quartermasters, where knowing where things were mattered more than who owned them",
    "Raised around bridge tolls, forge smoke, and train schedules, with one foot in the old order and the other already claimed by industry",
    "Born in a weather-beaten village that survived by grit, barter, and never asking what rode past after dark",
    "Raised among courtly expectations they never quite fit, learning poise outwardly and skepticism inwardly",
    "A child of the road between nations, carrying Addamaran customs in one hand and other peoples’ habits in the other",
  ],

  durinak: [
    "Forged in the deep halls of Karak Byrn, where every dwarven child is given a hammer before they are given a name",
    "Raised behind the Bronze Doors of Tarek'Mor, where the Graniteheart Clan's silence is its own kind of law",

    "Born in a mountain hold where the stone itself was treated as witness, and every oath was spoken with that in mind",
    "Raised among the smith-clans who still keep the old measures of weight, heat, and worth without compromise",
    "A child of the lower foundries, where furnace-light was more familiar than daylight and craft was the nearest thing to scripture",
    "Born beneath a hall of ancestral reliefs, taught to read lineage in chisel marks before they could read ink",
    "Raised in a mining colony that measured prosperity in ore, scars, and how many returned from the lower cuts",
    "Born into a clan that still honors the old Shape-and-Stone philosophy, believing a life is judged by what it can bear and build",
    "Raised in a fortress-town that traded metalwork to surface peoples while trusting very few of them",
    "A child of the Grimrock tradition, where a collapse in the tunnels is remembered for generations and negligence is treated like betrayal",
    "Born in a record-hall where the names of oathbreakers were kept on colder shelves than the honored dead",
    "Raised among engineers who admired invention but distrusted anything that worked too well without a clear cause",
    "A child of quarry roads and lift-chains, hearing the music of hammer, pulley, and fault-line as the sounds of home",
    "Born to a clan whose best years were behind them, but who refused to carry themselves like the defeated",
    "Raised near disputed veins of Grimrite, where every strike of a pick carried both hope and political consequence",
    "A child of a hold that had lost kin to ancient wars and newer machines and had not fully forgiven either",
    "Raised under elders who believed the world above was moving too quickly and paying too little for it",
    "Born into a family of armorers whose work outlived kings, wars, and often the wearers themselves",
    "A child of vaulted archives and locked reliquaries, where the past was curated as carefully as the treasury",
    "Raised where the old anti-magic arguments of Stone and Shape were not theory, but inherited law",
  ],

  telari: [
    "Exiled from the hidden city of Quynthe'ra before the rite of adulthood, carrying only a sigil and a half-told reason",
    "Raised among the ancient trees of Elmoire, where Fae blood hums in the bark and time moves at its own pace",

    "Born in a grove where names were given only after a first dream of significance",
    "Raised in a Tel'ari enclave that still kept silence-days, when no metal was struck and no oath was spoken carelessly",
    "A child of moonlit terraces and root-bridges, taught that memory is a form of magic and forgetting a kind of death",
    "Born to a line of archivists who preserved song, lineage, and grievance with equal care",
    "Raised in the outskirts of Zephyrian influence, close enough to scholars to learn from them and close enough to spirits to doubt them",
    "A child of old Elven decline, inheriting elegance, suspicion, and the long aftertaste of civil fracture",
    "Born beneath canopies so old that some claimed they remembered the first councils of the elves",
    "Raised among those who saw humanity's quick rise as either tragedy, inevitability, or insult, depending on whom one asked",
    "A child of an enclave where illusion, etiquette, and political restraint were considered related disciplines",
    "Born to wardens of hidden paths, taught to navigate both forest roads and conversations with the same care",
    "Raised in a house that had one foot in Fae custom and another in mortal necessity, fully comfortable in neither",
    "A child of a fading sanctuary whose protectors had grown too few and too proud to admit it",
    "Raised among artists, seers, and duelists, where beauty and threat were rarely kept far apart",
    "Born under a sky watched for omens, with elders convinced they were part of a larger turning no one yet understood",
    "Raised on stories of the old councils, the old wounds, and the old mistake of believing old things could not fail",
    "A child of the Tel'ari borderlands, where diplomacy was practiced by those who had already hidden a blade",
    "Raised among scholars of resonance who believed emotion, memory, and magic had never truly been separable",
    "Born into a people who had already outlived one golden age and did not expect another to come cheaply",
  ],

  othrod: [
    "Cast out of Razor's Point after a duel that ended the wrong way — or maybe the right way, depending on who is telling it",
    "Raised in the marshes of Kul'Kal Rakhar, where the water is always rising",

    "Born in a war-camp where strength earned notice faster than kindness ever could",
    "Raised among clan rivalries so old that nobody remembered the first insult, only the obligation to answer it",
    "A child of the border badlands, where survival was practical and morality usually arrived late",
    "Born in an Othrod settlement that respected hunters, feared seers, and trusted almost nobody from outside the clan",
    "Raised near Harrow-practitioners who treated corrupted power like both inheritance and weapon",
    "A child of a razed village rebuilt from salvaged iron, scorched timber, and unhelpful silence",
    "Born under the authority of a war-matron whose laws were brutal, clear, and mostly effective",
    "Raised in country where the fog hid both spirits and raiders and often did not bother distinguishing between them",
    "A child of swamp roads, fungal fires, and old pacts nobody admitted were still in effect",
    "Raised among the Othrod who believed civilization had simply found cleaner words for conquest",
    "Born in a camp that followed the seasons, the herds, and the nearest source of trouble",
    "Raised close enough to the underpaths to hear stories of things below the roots and wish they were only stories",
    "A child of clan judgment, where dishonor was punishable but weakness was often fatal",
    "Born in a place where children learned weapon names before the names of distant kings",
    "Raised among survivors of a failed uprising, inheriting its bitterness without always inheriting its cause",
    "A child of old orc memory, where the world was not divided into good and evil so much as predator and prey",
    "Raised near lands touched by corruption, where even the strong learned to fear what lingered unseen",
    "Born under a sky that never seemed interested in mercy, and taught accordingly",
  ],

  pamorph: [
    "Born in the wild reaches of Therienstadt, where the pack law governs everything and mercy is negotiated, not assumed",
    "Raised by a pride in the shadow of the Great Oak Forest, close enough to the Veridoran border to know when the machines were getting louder",

    "Born to a hunting pack whose territory was marked by scent, memory, and old violence",
    "Raised among Pa'morph who balanced instinct and speech uneasily, never fully surrendering either",
    "A child of forest law, where trespass was not a legal concept but a personal one",
    "Born in a den-settlement hidden from surface maps, known only to traders who had proved useful enough to survive",
    "Raised in a pride that believed civilization made creatures weaker by teaching them to ignore their senses",
    "A child of the wild margins between kingdom and wilderness, where roads ended and negotiations began",
    "Born among beastfolk who treated ancestral spirits as kin and cities as a kind of managed sickness",
    "Raised near Veridora's old forests, where druids, hunters, and border guards all claimed to be defending balance",
    "A child of a pack fractured by migration, with half embracing trade and half refusing anything that smelled like domestication",
    "Raised where every meal had a history, every scar had a story, and every outsider had to earn the right to stay",
    "Born to a line of trackers whose names were invoked whenever something important went missing",
    "A child of root, rain, and blood-sense, taught to read wind shifts as carefully as another might read scripture",
    "Raised among those who believed the body carried truths the tongue could only ruin",
    "Born in a hidden grove where children were tested for nerve before they were trusted with secrets",
    "A child of old beast rites, where coming of age was marked by pursuit, endurance, and whether one came back changed",
    "Raised near places where corruption had touched the land, making the hunt feel wrong in ways words could not fix",
    "Born in a mixed settlement of major and minor Pa'morph lineages, learning very early that kinship and rivalry were close neighbors",
    "Raised among guardians of a sacred route no human cartographer had ever properly mapped",
    "A child of the deep wilds, carrying both the patience of a predator and the unease of something half tamed",
  ],

  default: [
    "A wanderer without a fixed homeland, carrying a name from one place and a face that belongs to another",
    "Raised on the margins of Soterian society, in the kind of city district that doesn't appear on official maps",
    "Found on the road by a traveling merchant at an age they no longer clearly remember, and raised between ledgers and trade stops",

    "Born during the Era of Unity, old enough to hear that the world was holding together and wise enough not to believe it",
    "Raised between shrine and workshop, taught two incompatible explanations for how power works and never fully choosing between them",
    "A child of transit and threshold, more familiar with stations, gates, and crossroads than any single hearth",
    "Born under strange omens no one could agree on, leaving family and priests equally dissatisfied with the explanations",
    "Raised among refugees, laborers, and drifters, where identities were practical and biographies stayed abbreviated",
    "A child of one of Soteria's quieter fractures, where some old harm had been done and everyone had learned to live around it",
    "Born where a road met a river and both brought trouble with them",
    "Raised in a place that had changed flags often enough for patriotism to feel like a wager",
    "A child of stories about gods that had gone quiet, kings that had not, and spirits that still listened when spoken to correctly",
    "Born to a parent who knew too much and another who refused to talk about it",
    "Raised in a settlement rebuilt after disaster, where hope looked a lot like stubbornness and nobody confused the two",
    "A child of mixed inheritance, carrying contradictory customs with enough confidence to make them seem deliberate",
    "Raised among relics of older ages, with the uneasy sense that history does not stay buried simply because it is inconvenient",
    "Born near a place everyone agreed not to go after dark, which naturally made it the first place they ever explored",
    "Raised by practical people in an impractical world, learning early how to survive before learning what was fair",
    "A child of Soteria's long argument between spirit and machine, belonging completely to neither side",
    "Born where the map became uncertain, which did more to shape them than any state ever did",
  ],
};

export const BS_ROLE = {
  magic: [
    "A traveler and keeper of resonant knowledge, moving between cities before the steam could drown out the signal",
    "A wandering practitioner of the old disciplines, carrying methods that predate the Veinrunner by three centuries",

    "A hedge-witch's assistant turned independent adept, trusted with remedies, wards, and the occasional dangerous secret",
    "A trained spellwright from a respectable institution who left before respectability could become obedience",
    "An itinerant seer whose visions are inconveniently specific and therefore often unwelcome",
    "A scholar of old Lorúk phenomena, studying dreams, memory, and unstable thresholds between worlds",
    "A ritualist who records spirit-names, sigils, and resonant sites before industry wipes the local memory clean",
    "A gifted but unlicensed caster, moving often enough to stay ahead of questions and guild enforcement",
    "A former temple functionary who learned that divine silence can be more politically useful than revelation",
    "A practitioner of inherited rites from Makeda Kwetu, versed in ancestors, bargains, and the etiquette of the unseen",
    "A battlefield thaumist once valued for utility and later distrusted for what they saw during the work",
    "A village ward-keeper who knows how to bless a threshold, calm a haunting, and bury a thing that should not return",
    "A dream-reader, hired in secret by nobles and criminals alike to interpret omens they are too proud to admit they fear",
    "A one-time apprentice to a renowned mage of Zephyria, carrying real technique and very incomplete explanations",
    "A resonance-diviner obsessed with the way emotion leaves a trace in objects, rooms, and wounds",
    "A shrine-bound adept who finally left home after realizing the spirits knew more than the clergy were admitting",
    "A Caelvern-curious mystic, drawn toward the disciplines of Veyline and soul-binding without yet fully belonging to them",
    "A scholar of forbidden marginalia, more interested in what was crossed out than in the official text",
    "A speaker with spirits who has learned the difference between being chosen and being used",
    "A discreet magical consultant for merchants, courtiers, and frightened families who want problems solved quietly",
  ],

  tech: [
    "A traveler and Cartographer, mapping routes the official surveys missed or chose to ignore",
    "An engineer who left a comfortable post for reasons they describe differently depending on who is asking",

    "A line-mechanic who kept Veinrunner systems alive in places the company had already written off",
    "A surveyor of ruined infrastructure, sent to judge whether old roads, liftworks, and stations could still be made useful",
    "A machinist from Elddim or its sphere of influence, trained where science and ambition tend to blur together",
    "A gunsmith's apprentice who learned precision, patience, and how quickly politics follows innovation",
    "A grim practicalist from an industrial quarter, more comfortable with schematics than speeches",
    "A freight clerk turned smuggler, who learned that controlling movement matters more than owning anything",
    "A clockwork specialist who can repair field devices with little more than wire, pressure, and stubbornness",
    "A prospector or mine-runner tied at one point to Grimrite operations and whatever happened beneath them",
    "A Nullite researcher or salvage-runner, familiar with unstable materials and the silence that follows their failure",
    "A locomotive hand from the Veinrunner age, used to soot, noise, tight schedules, and unreliable superiors",
    "A battlefield engineer tasked with making walls, bridges, and bodies hold together under impossible conditions",
    "An artificer-aligned designer who sees no contradiction in building beauty into dangerous machinery",
    "A city detective or records analyst trained to follow patterns, receipts, casing marks, and lies",
    "A demolitions-savvy miner who knows the sound a tunnel makes before it stops wanting to stay up",
    "A metalworker from a district where labor and invention are treated as forms of citizenship",
    "A precision craftsperson who trusts measurable force more than mystical explanation",
    "A practical inventor accused more than once of building something before asking whether it should exist",
    "A field technician who learned that every machine reflects the values of the people who commissioned it",
  ],

  any: [
    "A courier and sometime-mercenary, moving between factions without committing to any of them",
    "A trader of information more than goods, with contacts in places that don't show up on guild registries",

    "A village survivor who became useful by being hard to kill and harder to surprise",
    "A former soldier who still carries discipline like a habit but no longer carries loyalty the same way",
    "A smuggler of texts, relics, and other things the wrong people wanted catalogued",
    "A guide through contested roads, old ruins, and sacred places no sane map labels correctly",
    "A bodyguard with better judgment than most clients and less patience than they deserve",
    "An archivist of oral histories, collecting what kingdoms leave out and priests revise",
    "A monster-hunter by necessity rather than title, following trouble because it rarely stays put",
    "A fixer for remote settlements, called when a problem is too dangerous, too embarrassing, or too supernatural for normal channels",
    "A former initiate of some order, guild, temple, or court who left with a useful education and unresolved enemies",
    "A negotiator between peoples who distrust each other, which usually means being blamed by both",
    "A salvage-runner picking through battlefields, abandoned stations, and the leftovers of older ages",
    "A local champion who discovered that being competent is often enough to become responsible for everyone else",
    "A wanderer employed whenever a task requires nerve, plausible deniability, or both",
    "A relic-broker who can distinguish holy artifact, historical junk, and expensive curse most of the time",
    "A hunter of fugitives, debtors, deserters, or missing heirs depending on what the current contract calls them",
    "A translator of dead scripts, border dialects, and coded speech shared by people who expect pursuit",
    "A once-promising citizen of somewhere important who left before anyone could decide whether to honor or ruin them",
    "A witness to too many strange events to remain ordinary, but not enough to become comfortable with any of them",
  ],
};

export const BS_PERSONALITY = {
  magic: [
    { text: "Born with a resonant sensitivity — the Lines are louder to them than to most. They hear things before they arrive.", boon: "+1 Spirit", statKey: "spirit", amount: 1 },
    { text: "Carries an old oath that has never fully resolved. The weight of it is visible if you know what to look for.", boon: "+1 Soul", statKey: "soul", amount: 1 },

    { text: "Possesses an unusual stillness in sacred or haunted spaces, as though the unseen world recognizes them before others do.", boon: "+1 Soul", statKey: "soul", amount: 1 },
    { text: "Finds it difficult to ignore symbols, dreams, and patterns once noticed. This has made them insightful and restless in equal measure.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Treats memory as something almost physical, revisiting old words and impressions until they yield hidden structure.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Has the unsettling habit of speaking calmly in moments when others begin to panic, which people mistake for certainty.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Is hard to deceive with tone alone. They listen for what a room is doing, not just what a mouth is saying.", boon: "+1 Spirit", statKey: "spirit", amount: 1 },
    { text: "Moves through ritual with natural discipline, whether from faith, inheritance, or an instinct they cannot explain.", boon: "+1 Soul", statKey: "soul", amount: 1 },
    { text: "Has always been drawn toward thresholds — doors, crossroads, coastlines, dream states, the space just before an answer arrives.", boon: "+1 Spirit", statKey: "spirit", amount: 1 },
    { text: "Knows how to wait without becoming passive, a trait that makes them strangely formidable in spiritual matters.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Carries themselves with the caution of someone who learned early that power always wants a price, even when offered kindly.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Has an intuitive grasp of emotional current and social atmosphere, reading strain and reverence almost by instinct.", boon: "+1 Spirit", statKey: "spirit", amount: 1 },
    { text: "Was shaped by reverence, fear, or fascination toward the unseen, and now treats the supernatural with uncommon seriousness.", boon: "+1 Soul", statKey: "soul", amount: 1 },
    { text: "Thinks in correspondences — stars to fate, memory to matter, wound to lesson — and is often right often enough to be concerning.", boon: "+1 Mind", statKey: "mind", amount: 1 },
  ],

  tech: [
    { text: "Born with an engineering instinct that borders on compulsion. They fix things that aren't broken just to understand them.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Carries a reputation that arrived before them in every city. The source of it depends on who you ask.", boon: "+1 Will", statKey: "will", amount: 1 },

    { text: "Has a mind for systems and failure points, noticing stress, inefficiency, and bad design almost immediately.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Stays unnervingly practical under pressure, focusing on sequence, tools, and exits before emotion catches up.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Treats promises like contracts and contracts like mechanisms: both fail when assembled badly.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Endures discomfort with a laborer's stubbornness, the kind earned through noise, heat, soot, and long hours.", boon: "+1 Body", statKey: "body", amount: 1 },
    { text: "Keeps detailed mental ledgers of favors, risks, routes, and resource costs, whether or not they admit to doing so.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Distrusts spectacle and prefers results, which makes them reliable and occasionally difficult to impress.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Has quick, capable hands from years of craft, maintenance, loading, assembly, or field repair.", boon: "+1 Body", statKey: "body", amount: 1 },
    { text: "Feels most honest when working directly with material things: metal, pressure, measurements, tools, proof.", boon: "+1 Body", statKey: "body", amount: 1 },
    { text: "Carries the instincts of someone who has worked around dangerous machinery and learned respect without superstition.", boon: "+1 Body", statKey: "body", amount: 1 },
    { text: "Notices who benefits from a system faster than who claims credit for it.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Has learned to keep going through fatigue, bureaucracy, and poor conditions without becoming careless.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Has the steady confidence of someone who trusts calibration, preparation, and repeatable action more than luck.", boon: "+1 Will", statKey: "will", amount: 1 },
  ],

  any: [
    { text: "Born with an extreme personality — people tend to react more strongly toward them, for better or worse.", boon: "+1 Spirit", statKey: "spirit", amount: 1 },
    { text: "Has a habit of surviving situations that should have ended them. Whether this is luck or design is unclear.", boon: "+1 Body", statKey: "body", amount: 1 },

    { text: "Learns people quickly, whether through caution, instinct, or long practice with unreliable company.", boon: "+1 Spirit", statKey: "spirit", amount: 1 },
    { text: "Can absorb hardship without becoming soft or theatrical about it; they simply continue.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Has the kind of presence that makes others look to them when something goes wrong, whether they want that responsibility or not.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Carries old grief with discipline rather than display, which has made them steadier than most under strain.", boon: "+1 Soul", statKey: "soul", amount: 1 },
    { text: "Pays attention. In a world as unstable as Soteria, that has proven a greater gift than charm or status.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Is physically self-possessed in a way that suggests training, labor, or a life where weakness was expensive.", boon: "+1 Body", statKey: "body", amount: 1 },
    { text: "Keeps something of themselves withheld on first meeting. This has protected them more often than honesty would have.", boon: "+1 Soul", statKey: "soul", amount: 1 },
    { text: "Has a talent for deciding when to push, when to yield, and when to walk away before the room notices.", boon: "+1 Spirit", statKey: "spirit", amount: 1 },
    { text: "Finds purpose faster than comfort, which has made them effective and not always easy to live beside.", boon: "+1 Will", statKey: "will", amount: 1 },
    { text: "Was shaped by unstable places and therefore developed a deep respect for routine, preparation, and exits.", boon: "+1 Mind", statKey: "mind", amount: 1 },
    { text: "Does not break cleanly under pressure; they bend, adapt, and return with sharper edges.", boon: "+1 Body", statKey: "body", amount: 1 },
    { text: "Has an inconvenient conscience that activates precisely when compromise would be easiest.", boon: "+1 Soul", statKey: "soul", amount: 1 },
  ],
};

// Optional: regional complications / campaign hooks
export const BS_COMPLICATIONS = {
  addamar: [
    "A family debt, blood-price, or civic obligation still follows them across provincial lines",
    "Someone in Ashendell still remembers their face, and not fondly",
    "They left behind a title, inheritance, or court expectation they never fully resolved",
    "Their home district was changed by industrial expansion, and they know who profited",
    "A route, ledger, or sealed document once passed through their hands and is still being quietly sought",
    "They know a thing about a local official, guild, or noble house that was supposed to stay buried",
  ],
  durinak: [
    "Their clan expects repayment of an oath they never personally swore but still inherited",
    "A failed dig, collapsed chamber, or disputed claim still stains their family name",
    "They know the old argument of Shape and Stone too well to stay neutral around magic",
    "Someone believes they carry the key to an ancestral vault, forge secret, or clan record",
    "A crafted item tied to their lineage was lost, stolen, or sold to outsiders",
    "They left a hold during a time when departure looked dangerously similar to disloyalty",
  ],
  telari: [
    "Their exile was political, ritual, or personal, and the official reason is not the true one",
    "They know one of the hidden paths and were never meant to share it",
    "An elder, rival, or former companion still believes they owe a debt of honor",
    "They carry a sigil, phrase, or memory that matters far more than they yet understand",
    "They were warned once never to return to a certain grove, archive, or court and eventually will have to",
    "Something in the old elven fractures still recognizes their bloodline",
  ],
  othrod: [
    "An old duel, raid, or blood-feud remains unresolved and periodically resurfaces",
    "They were taught Harrow-adjacent truths they should not know and cannot fully forget",
    "Their clan assumes they abandoned them; outsiders assume they escaped them; both are incomplete",
    "They know a marsh route, underpath, or hidden encampment worth killing over",
    "Something from the corrupted lands marked them and has not entirely let go",
    "A war leader, shaman, or rival survivor still expects them to choose a side",
  ],
  pamorph: [
    "A pack, pride, or grove still considers them bound by older laws than the kingdoms recognize",
    "They crossed a territorial boundary once and triggered a consequence that has not finished unfolding",
    "They know the scent, sign, or trail-mark of something sacred and hunted",
    "Part of their people sees them as too civilized; another part sees them as not civilized enough",
    "A guardian beast, ancestor spirit, or old hunting oath still shadows their path",
    "They carry knowledge of a hidden den-road or forest pass outsiders would exploit immediately",
  ],
  default: [
    "They have used more than one name in more than one place and at least one of those names is still active somewhere",
    "A letter, relic, inheritance, or summons has already started pulling them toward trouble",
    "They once witnessed something political, supernatural, or criminal and survived by keeping quiet",
    "A place they thought they had left behind now has reason to come looking for them",
    "They have become tied to a larger conflict between spirit, machine, or sovereignty without asking to be",
    "Someone more powerful than them believes they are carrying information, blood, or potential they do not fully understand",
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
