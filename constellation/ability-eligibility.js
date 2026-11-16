// Who may perform each ability type, transcribed verbatim from the user's eligibility table (October 29).
// "crafts" are the constructive and neutral ability types; "banes" are the harmful, corruptive or adversarial types.
// data.js resolves these names to classes and keeps only classes of the type's own discipline (user rule);
// entries that do not name a class ("Inquisitor-aligned practitioners", items, other disciplines) are reported, never guessed.
export const ELIGIBILITY={
magicka:{
crafts:{Cantrip:['Wizard','Castor','Magus','Witch','Scribe','Minstrel'],Wish:['Wishwright','Fatebinder','Arcani'],Ward:['Cleric','Paladin','Wizard','Runesiph','Glyphsage','Dryte'],Mark:['Runesiph','Glyphsage','Makemark','Scribe','Witch'],Fetch:['Witch','Harrow','Necromancer','Wild'],Bind:['Warlock','Witch','Necromancer','Glyphsage','Mystagogue'],Shout:['Shaman','Loaite','Rhapsodist','Cantor'],Vow:['Paladin','Cleric','Monk','Devout','Loaite'],Dream:['Ovate','Fatebinder','Harrow','Mystagogue'],Grace:['Cleric','Paladin','Devout','Iridesce','Caelyn'],Miracle:['Cleric','Devout','Iridesce','Caelyn'],Wonder:['Sorcerer','Evoke','Primalist','Dryad','Arcani'],Archona:['Archon','exceptionally advanced Weaver practitioners']},
banes:{Hex:['Witch','Bokor','Warlock','Fatebinder'],Curse:['Witch','Bokor','Warlock','Necromancer'],Bane:['Witch','Bokor','Paladin','Inquisitor-aligned practitioners'],Plague:['Bokor','Necromancer','Hemoclast'],Jinx:['Witch','Fatebinder','Rhapsodist'],Harm:['Warlock','Hemoclast','Harrow','Bokor'],Scry:['Augur','Witch','Ovate','Fatebinder','Harrow'],Tangle:['Druid','Dryte','Wild','Witch'],Blight:['Bokor','Hemoclast','Necromancer','corrupted Dryte']}},
ingenium:{
crafts:{Maton:['Tinkerer','Machinist','Artificer','Coglock specialists'],Core:['Machinist','Tinkerer','Biomancer','Alchemist'],Bastion:['Sentinel','Stalwart','Vanguard','Machinist'],Engram:['Archivist','Cipherhedron','Strategist','Biomancer'],Gadget:['Tinkerer','Gunsmith','Inspector','Sleuth'],Snare:['Strider','Ranger','Inspector','Saboteur'],Proto:['Tinkerer','Gunsmith','Machinist','Alchemist'],Widget:['Tinkerer','Gunsmith','Inspector'],Gizmo:['Gunsmith','Gunslinger','Tinkerer','Saboteur'],Beacon:['Ranger','Sentinel','Strategist','Cartographer'],Fluke:['Alchemist','Mutagenist','Tinkerer','Gunslinger'],Marvel:['Machinist','Biomancer','Alchemist','Gunsmith'],Mech:['Machinist','Artificer','Vanguard','Sentinel']},
banes:{Hack:['Sleuth','Inspector','Archivist','Saboteur'],Crack:['Saboteur','Sleuth','Inspector','Gunsmith'],Siphon:['Saboteur','Biomancer','Mutagenist','Alchemist'],Virus:['Saboteur','Biomancer','Mutagenist'],Jam:['Saboteur','Gunslinger','Sentinel','Gunsmith'],Blast:['Bombardier','Gunslinger','Gunsmith','Saboteur'],Oneircron:['Alchemist','Biomancer','Mutagenist','Archivist'],Scramble:['Saboteur','Sleuth','Strategist','Archivist'],Rig:['Saboteur','Tinkerer','Bombardier','Gunsmith']}},
praethacy:{
crafts:{Pulse:['Psion','Cognizant','Syzygic'],Phase:['Zeit','Syzygic'],Bulwark:['Zeit','Praetor'],Seal:['Zeit','Cognizant','Praetor'],Relic:['Zeit','Praetor'],Tether:['Psion','Syzygic'],Strand:['Syzygic','Cognizant'],Synapse:['Psion','Cognizant'],Crypted:['Zeit','Cognizant'],Syscrum:['Zeit','Syzygic'],Fate:['Cognizant','Syzygic','Praetor'],Phenom:['Psion','Syzygic','Praetor'],Psynthwave:['Psion','Syzygic','Praetor']},
banes:{Breach:['Zeit','Cognizant'],Overclock:['Psion','Syzygic'],Plasm:['Psion','Zeit'],Corruption:['Zeit','Cognizant'],Shunt:['Psion','Syzygic'],Spike:['Psion','Cognizant'],Glitch:['Zeit','Syzygic'],Rupture:['Zeit','Psion','Praetor'],Miasm:['Cognizant','Syzygic']}},
nihimence:{
crafts:{Force:['Barbarian','Knight','Gallant','Stalwart'],Gimmick:['Sleuth','Provocateur','Tycoon','Negotiator'],Shield:['Knight','Stalwart','Sentinel','Gallant'],Speech:['Emissary','Negotiator','Vizier','Herald','Tribune'],Rage:['Barbarian','Marauder','Provocateur'],Latch:['Sleuth','Strider','Ranger','Saboteur'],Feint:['Ranger','Strider','Knight','Provocateur'],Ginch:['Sleuth','Tycoon','Negotiator','Provocateur'],Gauge:['Strategist','Tactician','Detective','Ranger'],Finesse:['Gunslinger','Strider','Gallant','Sleuth'],Luck:['Rogue','Sleuth','Merchant','Alchemist'],Masterstroke:['Strategist','Tactician','Knight','Baron'],Null:['Dedicated Null practitioners']},
banes:{Cripple:['Barbarian','Marauder','Ranger','Gunslinger'],Winnow:['Strategist','Tactician','Baron','Vizier'],Draw:['Provocateur','Knight','Gallant','Gunslinger'],Infection:['Mutagenist','Biomancer','Saboteur','mundane poison specialists'],Stun:['Fighter','Gunslinger','Ranger','Stalwart'],Jolt:['Gunslinger','Saboteur','Barbarian'],Fable:['Herald','Provocateur','Negotiator','Vizier'],Cull:['Ranger','Marauder','Barbarian','Strategist'],Sunder:['Barbarian','Knight','Marauder','Gallant']}}
};
// The table spells one class name differently from the Class Ability Tree chart.
// User decisions (October 29) for entries that are not plain class names: items go to the endpoint holding them;
// qualified groups resolve to their named class; null means intentionally no extra class.
export const NAME_FIXES={Sentinel:'Sentine','Coglock specialists':'Axion',Cipherhedron:'Laureate','Inquisitor-aligned practitioners':'Inquisitor','corrupted Dryte':'Dryte','exceptionally advanced Weaver practitioners':null,'Dedicated Null practitioners':'Null','mundane poison specialists':null,
// The user's chart of 2026-11-15 retired the old Psynth subclasses; their type entries are kept but go unassigned.
Zeit:null,Cognizant:null,Psion:null,Syzygic:null,Praetor:null};
// User-approved additions (October 29): classes that otherwise had nothing to master, Psynth's own types, and Infection's owners.
// Null is not added here: the hidden Null star (data.js) is its dedicated practitioner.
export const ADDITIONS={
magicka:{Shout:['Bard'],Dream:['Oneir','Eldritch'],Plague:['Eldritch'],Wish:['Eikon'],Wonder:['Eikon']},
ingenium:{Marvel:['Dyreon']},
nihimence:{Speech:['Poet'],Fable:['Poet'],Infection:['Ranger','Marauder']},
praethacy:{Pulse:['Psynth'],Rupture:['Psynth']}
};
