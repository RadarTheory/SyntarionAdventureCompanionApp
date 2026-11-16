import {TREE} from './legacy-tree.js';
import {STARTING_POINTS,setStartingPoints} from './config.js';
import {ELIGIBILITY,NAME_FIXES,ADDITIONS} from './ability-eligibility.js';
export {STARTING_POINTS,setStartingPoints};
export const disciplines=[
{id:'magicka',name:'Magicka',color:'#94c493',symbol:'✧',subtitle:'The art of the unseen',practitioner:'Magus',title:'Weaver',action:'Cast',form:'Grimoire',written:'Scroll',principle:'Mana',master:'Archon',levels:['Mote','Charm','Spell','Glamour','Weave'],crafts:['Cantrip','Wish','Ward','Mark','Fetch','Bind','Shout','Vow','Dream','Grace','Miracle','Wonder','Archona'],types:['Hex','Curse','Bane','Plague','Jinx','Harm','Scry','Tangle','Blight']},
{id:'ingenium',name:'Ingenium',color:'#80b8d8',symbol:'⌘',subtitle:'The ingenuity of creation',practitioner:'Axion',title:'Artificer',action:'Deploy',form:'Drive',written:'Code',principle:'Lithium',master:'Omnifex',levels:['Tinkertrick','Diagram','Mod','Glimmer','Schematic'],crafts:['Maton','Core','Bastion','Engram','Gadget','Snare','Proto','Widget','Gizmo','Beacon','Fluke','Marvel','Mech'],types:['Hack','Crack','Siphon','Virus','Jam','Blast','Oneircron','Scramble','Rig']},
{id:'nihimence',name:'Nihimence',color:'#e2ac6b',symbol:'⟐',subtitle:'The mastery within',practitioner:'Ghrimm',title:'Adept',action:'Enact',form:'Tome',written:'Dossier',principle:'Prowess',master:'Prefect',levels:['Grit','Gambit','Tactic','Feat','Talent'],crafts:['Force','Gimmick','Shield','Speech','Rage','Latch','Feint','Ginch','Gauge','Finesse','Luck','Masterstroke','Null'],types:['Cripple','Winnow','Draw','Infection','Stun','Jolt','Fable','Cull','Sunder']},
{id:'praethacy',name:'Praethacy',color:'#b39add',symbol:'◈',subtitle:'Beyond the known',practitioner:'Psynth',title:'Praetor',action:'Engage',form:'Cloud',written:'Protocol',principle:'Psyncrite',master:'Primynth',levels:['Psync','Arc','Flux','Gleam','Kinetic'],crafts:['Pulse','Phase','Bulwark','Seal','Relic','Tether','Strand','Synapse','Crypted','Syscrum','Fate','Phenom','Psynthwave'],types:['Breach','Overclock','Plasm','Corruption','Shunt','Spike','Glitch','Rupture','Miasm']}
];
// The user's descriptions of each calling (revised 2026-11-04), shown beside the corner Awaken button before a calling is awakened.
export const CALLING_LORE={"inquisitor": "Inquisitors channel Magicka through their connection to one of Soteria’s pantheons. Often serving as paladins, clergy, or divine emissaries, their abilities reflect the nature and influence of the deities they follow.", "zealot": "Zealots cultivate Magicka through spiritual discipline and devotion. Monks, shamans, and other spiritual practitioners draw upon inner harmony, ancestral traditions, and communion with unseen forces.", "weaver": "Weavers shape Magicka through knowledge, concentration, and practiced technique. From scholarly wizards to instinctive sorcerers, they manipulate mana to produce an extraordinary range of magical effects.", "druid": "Druids harness Magicka through their connection to nature and living things. Their practices encompass natural transformation, primal forces, and the preservation or manipulation of organic life.", "sage": "Sages exercise Magicka through deliberate intent and disciplined willpower. Their mastery emphasizes control, precision, and the ability to impose carefully constructed magical effects upon the world.", "mystic": "Mystics practice Magicka through intuition, esoteric traditions, and unconventional methods. Their workings often involve witchcraft, divination, and the mysterious influences that defy conventional understanding.", "bard": "Bards wield Magicka through expression, performance, and emotion. Through music, language, and storytelling, they inspire, influence, and manipulate the feelings and perceptions of others.", "oneir": "Oneirs explore Magicka through dreams, consciousness, and the boundaries of mortality. Their practices encompass dreamwalking, necromancy, blood rites, and other mysteries of existence.", "scholar": "Scholars pursue understanding through research, observation, and reason. Scientists, historians, and inventors apply accumulated knowledge to solve problems and advance Soterian civilization.", "vanguard": "Vanguards combine discipline, tactical preparation, and specialized equipment to withstand formidable opposition. Their expertise emphasizes defense, resilience, and the effective application of Ingenium.", "artificer": "Artificers transform ingenuity into invention. Through engineering, craftsmanship, and experimentation, they develop firearms, machinery, automatons, and technological innovations.", "alchemist": "Alchemists explore the transformative possibilities of matter through chemistry and experimentation. Their creations range from restorative compounds to volatile substances and extraordinary biological alterations.", "rogue": "Rogues master stealth, investigation, and subterfuge through experience and practiced skill. From detectives to infiltrators, they uncover secrets and navigate dangers through observation, discretion, and cunning.", "merchant": "Merchants cultivate influence through commerce, negotiation, and enterprise. Their expertise encompasses trade, diplomacy, resource management, and the relationships that shape economies and societies.", "fighter": "Fighters achieve martial excellence through physical conditioning, combat training, and experience. From barbarians to knights, their capabilities reflect the disciplined development of mortal prowess.", "poet": "Poets influence others through rhetoric, expression, and the written or spoken word. Heralds, provocateurs, and orators shape beliefs, inspire action, and preserve ideas without reliance upon Magicka.", "null": "Nulls develop the extraordinary ability to suppress Magicka and disrupt Ingenium. Through abjuration and abnegation, they resist external powers and cultivate mastery over their nullifying influence.", "psynth": "Psynths unite Magicka and Ingenium through the rare practice of Praethacy. By synthesizing arcane and technological principles through Grimrite, they unlock capabilities beyond either discipline independently."};
export const attributes=['Soul','Spirit','Mind','Body','Will','Whim','Affect','Dream'];
// "Discipline" and "Primary principle" are distinct rows in the supplied table.
const practiceFields={magicka:'Mana',ingenium:'Tech',praethacy:'Synthesis',nihimence:'Mundane mastery'};
for(const discipline of disciplines)discipline.discipline=practiceFields[discipline.id];
// Null's line burns a deeper amber-red than the rest of Nihimence (user: Null on 2026-11-13, its whole line on 2026-11-15); a tinted class gets its own copy of its practice.
// Keys are class ids; a key that is a line's root tints every class on that line.
// Ghrimm leans Ingenium and Wreicht leans Magicka, so they wear those practices' colours while staying Praethacy; Psynth and Warden stay purple (user, 2026-11-15).
const practiceColor=id=>disciplines.find(d=>d.id===id).color;
// What a line's abilities consume: one row of the character sheet's Magic | Tech table (user, 2026-11-15), as [column, discipline, trait].
// Each line header already named its row except Druid (Essence), Bard (Vox), Alchemist and Artificer, which were chosen to fit.
// Every class on a line consumes the line's trait, so Caelyn and Dyreon consume Magic rows and Eikon a Tech row.
// Null consumes Ingenuity's trait, Null (user, 2026-11-15), sharing Vanguard's row. Warden's line follows Psynth's header (Volition),
// except Wreicht, which leans Magicka and consumes Magic/Mana instead (user, 2026-11-15). A class entry overrides its line's.
// This replaces the aspect-stat rule of 2026-11-04.
export const SHEET_TRAITS={inquisitor:['Magic','Divine','Sanctus'],zealot:['Magic','Spirit','Sacral'],weaver:['Magic','Magic','Mana'],druid:['Magic','Nature','Chi'],sage:['Magic','Glyph','Gnosis'],mystic:['Magic','Light','Shaeid'],oneir:['Magic','Shadow','Wraill'],bard:['Magic','Imagination','Phorym'],
rogue:['Tech','Fortitude','Lithium'],fighter:['Tech','Grit','Steam'],poet:['Tech','Volition','Crhon'],merchant:['Tech','Reason','Cell'],scholar:['Tech','Focus','Zinc'],vanguard:['Tech','Ingenuity','Null'],alchemist:['Tech','Matter','Volt'],artificer:['Tech','Gain','Ion'],
null:['Tech','Ingenuity','Null'],warden:['Tech','Volition','Crhon'],wreicht:['Magic','Magic','Mana']};
export const traitFor=cls=>{const t=SHEET_TRAITS[cls.id]||SHEET_TRAITS[cls.rootId];return t?{column:t[0],discipline:t[1],trait:t[2]}:null;};
export const CLASS_COLORS={null:'#d8602f',ghrimm:practiceColor('ingenium'),wreicht:practiceColor('magicka')};
const tinted=new Map();
export function setupForClass(cls){const setup=disciplines.find(d=>d.id===cls.discipline);if(!setup)throw new Error(`Unknown discipline for ${cls.name}`);const color=CLASS_COLORS[cls.id]||CLASS_COLORS[cls.rootId];if(!color)return setup;if(!tinted.has(cls.id))tinted.set(cls.id,{...setup,color});return tinted.get(cls.id);}
// Lineages follow the user's Class Ability Tree chart (October 28): each calling splits into parallel
// two-step branches that converge on one endpoint class, followed by its associated item (never a class).
const lineages=[
['Inquisitor',[['Cleric','Paladin'],['Devout','Augur']],'Iridesce','Ecliphane'],
['Zealot',[['Shaman','Monk'],['Bokor','Loaite']],'Caelyn','Caelvern'],
['Weaver',[['Warlock','Castor'],['Wizard','Magus'],['Sorcerer','Evoke']],'Archon','Archonwand'],
['Druid',[['Ovate','Wild'],['Primalist','Dryte']],'Dyreon','Fetchglove'],
['Sage',[['Scribe','Runesiph'],['Codexer','Glyphsage']],'Makemark','Markawl'],
['Mystic',[['Witch','Dryad'],['Fatebinder','Wishwright']],'Arcani','Shaeidblade'],
['Bard',[['Minstrel','Rhapsodist']],'Cantor','Elderlute'],
['Oneir',[['Harrow','Hemoclast'],['Necromancer','Mystagogue']],'Eldritch','Felrod'],
['Rogue',[['Inspector','Detective'],['Strider','Ranger']],'Sleuth','Slevetto'],
['Merchant',[['Emissary','Tycoon'],['Negotiator','Vizier']],'Baron','Warlatch'],
['Scholar',[['Strategist','Tactician'],['Cartographer','Archivist'],['Scientist','Inventor']],'Laureate','Cypherhedron'],
['Fighter',[['Swashbuckler','Marauder'],['Barbarian','Knight']],'Gallant','Sovereign Sword'],
['Vanguard',[['Sentine','Stalwart']],'Whyth','Whythryn'],
['Artificer',[['Gunsmith','Gunslinger'],['Tinkerer','Machinist']],'Axion','Coglock Pistol'],
['Poet',[['Herald','Provocateur']],'Tribune','Cryerquill'],
['Alchemist',[['Mutagenist','Biomancer'],['Bombardier','Saboteur']],'Eikon','Philosophial']
];
// Explicitly colored class endpoints in the reference override their root's color.
// Purple terminal entries in that chart are ITEMS, not Praethacy classes.
const classDisciplines={Caelyn:'ingenium',Dyreon:'ingenium',Iridesce:'magicka',Archon:'magicka',Makemark:'magicka',Arcani:'magicka',Cantor:'magicka',Eldritch:'magicka',Sleuth:'nihimence',Baron:'nihimence',Laureate:'ingenium',Gallant:'nihimence',Whyth:'ingenium',Axion:'ingenium',Tribune:'nihimence',Eikon:'magicka'};
const slug=name=>name.toLowerCase().replaceAll(' ','-');
const lineageOf=([,branches,endpoint,item])=>({branches,endpoint,item,progression:[...branches.flat(),endpoint]});
export const roots=[...lineages.map((l,i)=>({id:slug(l[0]),name:l[0],attribute:attributes[i%8],discipline:i<8?'magicka':(['Rogue','Merchant','Fighter','Poet'].includes(l[0])?'nihimence':'ingenium'),...lineageOf(l)})),
// Lines that do not follow the two-step branch shape list their classes as [name, tier, parent names, item?].
// Praethacy's line (user's chart, 2026-11-15): Warden, the hidden Hope class, branches straight into three master classes, each with its own Praethic weapon.
{id:'warden',name:'Warden',attribute:'Hope',discipline:'praethacy',hidden:true,members:[['Psynth',4,['Warden'],'Praethic Brand'],['Ghrimm',4,['Warden'],'Praethic Maul'],['Wreicht',4,['Warden'],'Praethic Spindle']]},
// Null is Nihimence's hidden star, revealed once two Nihimence classes are mastered (like Praethacy, but it appears on its own).
// Its line (user's chart, 2026-11-15): Nil, Naught and Nix branch from Null and meet at Sentinaut, its master class, which holds the item Noxinix (user). Every class on it stays hidden with Null.
{id:'null',name:'Null',attribute:'Hope',discipline:'nihimence',secret:true,summary:'Revealed to those who open the paths of two Nihimence classes. Null draws on the Voidpoint: an inner stillness that unmakes magic and tech alike.',members:[['Nil',2,['Null']],['Naught',2,['Null']],['Nix',2,['Null']],['Sentinaut',4,['Nil','Naught','Nix'],'Noxinix']]}].map(r=>r.members?{branches:[],endpoint:null,item:null,progression:r.members.map(([name])=>name),...r}:r);
function family(root){const make=(name,tier,parentIds)=>({id:slug(name),name,tier,parentIds,attribute:root.attribute,discipline:root.hidden?root.discipline:classDisciplines[name]||root.discipline,rootId:root.id,hidden:root.hidden,secret:root.secret,progression:root.progression.filter(n=>n!==name),item:root.item});
if(root.members)return [{...root,tier:1},...root.members.map(([name,tier,parents,item])=>({...make(name,tier,parents.map(slug)),item:item||null}))];
const branchClasses=root.branches.flatMap(([second,third])=>[make(second,2,[root.id]),make(third,3,[slug(second)])]);
return [{...root,tier:root.tier||1},...branchClasses,...(root.endpoint?[make(root.endpoint,4,root.branches.map(([,third])=>slug(third)))]:[])];}
export const classes=roots.flatMap(family);
const byId=new Map(classes.map(c=>[c.id,c]));
export const classById=id=>byId.get(id);
// `nullOpen` is the player's choice to open Null's seal; the gate (nullRevealed) must also hold.
export function visibleClasses(revealed,baseOnly=false,learned=[],nullOpen=true){const nullShown=nullOpen&&nullRevealed(learned);return (baseOnly?roots:classes).filter(c=>(revealed||!c.hidden)&&(nullShown||!c.secret));}
// Null's seal can be opened once two different Nihimence callings (Rogue, Merchant, Fighter, Poet) are mastered; a calling's own subclasses do not count.
export function nullRevealed(learned){return masteredClasses(learned).filter(c=>c.discipline==='nihimence'&&!c.secret&&!c.parentIds).length>=2;}
export function restoreSelection(saved,learned=saved.learned||[]){const revealed=saved.revealed===true&&praethacyEligibility(learned).eligible;const selectedClass=visibleClasses(revealed,false,learned,saved.nullOpen===true).find(c=>c.id===saved.classId)||classes.find(c=>c.id==='weaver');return {revealed,selectedClass,disciplineId:selectedClass.discipline};}
// Class abilities written with the user for this explorer (October 29). They replace any legacy Syntarion abilities for that class:
// Null's old Vanguard-era abilities (cog and Whythryn tech) was removed; Null draws on the Voidpoint instead, nulling magic and tech through inner stillness.
// `levels` renames a level's purchase (Null's Blackout became the Unmaking at Talent; no current ability uses it).
const OWN_ABILITIES={
// The user's final abilities, entered one group at a time (2026-11-04). All of a calling's line consumes its stat.
// Weaver's line (Mana, Mind):
weaver:[
{n:'Arcasense',d:'Perceive magical energies, sources, and active workings.'},
{n:'Incend',d:'Generate, direct, and eventually sustain magical fire.'},
{n:'Blast',d:'Project concentrated magical energy toward a target.'},
{n:'Aegis',d:'Conjure a protective barrier of raw Magicka.'},
{n:'Heal',d:'Offer vitality to yourself or another.'},
],
warlock:[
{n:'Grasp',d:'Conjure a spectral grip that seizes, restrains, or torments a target.'},
{n:'Pact',d:'Forge a magical bond between yourself and another being, allowing power or afflictions to pass through it.'},
{n:'Siphon',d:'Pull Magicka or vitality from yourself or another being to empower a spell beyond its ordinary limits.'},
],
castor:[
{n:'Rend',d:'Tear through physical or magical defenses using concentrated arcane force.'},
{n:'Cloak',d:'Mask the visible or detectable signs of a spell, concealing its source, nature, or manifestation from observers.'},
{n:'Disguise',d:'Alter your visible appearance, clothing, voice, or apparent identity.'},
],
sorcerer:[
{n:'Blink',d:'Instantly transport yourself a short distance through space.'},
{n:'Bend',d:'Alter the trajectory, shape, or behavior of a spell already in motion.'},
{n:'Echo',d:'Reproduce the effect of a spell cast within the last turn, creating a second Magicka manifestation.'},
],
evoke:[
{n:'Rift',d:'Open a temporary tear in space through which magical effects or physical objects may pass.'},
{n:'Impel',d:'Apply overwhelming directional force to an object or creature, sending it through the air.'},
{n:'Nova',d:'Cause a concentrated eruption of Magicka at a seen location.'},
],
wizard:[
{n:'Quell',d:'Interrupt or unravel a spell as it is being cast, preventing its manifestation, potentially turning it against the caster.'},
{n:'Wraith',d:'Conjure a temporary magical duplicate of yourself that can perform simple actions and, at higher levels, cast spells.'},
{n:'Bank',d:'Suspend a spell in magical stasis, releasing it instantly at a chosen moment.'},
],
magus:[
{n:'Thread',d:'Channel a spell through a weapon or physical strike, releasing its effect upon impact.'},
{n:'Flash',d:'Propel yourself rapidly into or out of striking distance.'},
{n:'Refract',d:'Catch or redirect an incoming spell.'},
],
// Sage's line (Gnosis, Will):
sage:[
{n:'Etch',d:'Place a rune on an object or surface, granting it a temporary magical effect.'},
{n:'Glean',d:'Reveal the function, intent, and magical properties of an inscription.'},
{n:'Efface',d:'Disable or weaken a magical inscription by disrupting its structure.'},
{n:'Calque',d:'Reproduce a magical inscription onto another compatible surface.'},
{n:'Emend',d:'Modify a rune\'s existing instructions without destroying or replacing it.'},
],
scribe:[
{n:'Script',d:'Inscribe a learned Magicka working onto parchment for later casting, including by another eligible practitioner.'},
{n:'Missiv',d:'Send written messages between magically linked rifts.'},
{n:'Edict',d:'Place a magical instruction upon an object that executes a simple predetermined action.'},
],
runesiph:[
{n:'Draw',d:'Extract Magicka from an inscription, weakening or extinguishing its effect and temporarily reducing the stat cost of your next Gnosis working.'},
{n:'Route',d:'Redirect an activated inscription\'s effect toward another eligible target.'},
{n:'Flood',d:'Force additional Magicka into an inscription until it releases an unstable burst.'},
],
codexer:[
{n:'Crux',d:'Arrange several inscriptions to activate in a predetermined order.'},
{n:'Fork',d:'Give one inscription alternative outcomes determined by different conditions.'},
{n:'Gloss',d:'Add magical annotations that reveal hidden information or provide guidance when their conditions are met.'},
],
glyphsage:[
{n:'Lumsigil',d:'Manifest a magical glyph upon an otherwise empty point in space, allowing an inscription to function without a physical surface.'},
{n:'Occlusion',d:'Conceal a glyph\'s presence until its activation conditions are fulfilled.'},
{n:'Gyre',d:'Set a glyph in motion around a designated creature or object, carrying its magical effect with it.'},
],
makemark:[
{n:'Affix',d:'Inscribe a magical mark that persists without expiration.'},
{n:'Scrawl',d:'Inscribe a magical mark directly upon a creature, object, or surface, binding its effect to the marked subject.'},
{n:'Claim',d:'Establish a magical claim over a marked subject or inscription, allowing its location to be discerned and, with sufficient mastery, its magical workings to be brought under your authority.'},
],
// Druid's line (Essence, Body):
druid:[
{n:'Call',d:'Communicate with animals and influence their behavior through Essence.'},
{n:'Mend',d:'Restore damaged living tissue by accelerating natural healing.'},
{n:'Symb',d:'Establish a magical relationship with another organism, allowing the exchange of vitality or physical sensations.'},
{n:'Fallow',d:'Suppress biological growth and activity within a designated area.'},
{n:'Sprout',d:'Awaken dormant seeds and spores, stimulating the emergence of new life.'},
],
ovate:[
{n:'Remanence',d:'Recover impressions of past events preserved within landscapes.'},
{n:'Bramble',d:'Cause nearby vegetation to produce and direct thorns against a target.'},
{n:'Husk',d:'Reinforce the body with protective organic tissue that absorbs physical damage.'},
],
wild:[
{n:'Maul',d:'Temporarily manifest natural weapons such as claws or fangs to attack a creature for extra melee damage.'},
{n:'Adapt',d:'Alter the body\'s natural tolerances to withstand hostile environmental conditions.'},
{n:'Prowl',d:'Traverse natural terrain while concealing signs of your passage, extending this concealment to other members of your party as your mastery increases.'},
],
primalist:[
{n:'Thrum',d:'Channel Essence through the ground to generate a violent disturbance that damages nearby creatures.'},
{n:'Shift',d:'Transform into the physical form of an animal while retaining personal consciousness.'},
{n:'Alpha',d:'Assert an instinctive authority that influences the behavior of nearby wild creatures.'},
],
dryte:[
{n:'Wrought',d:'Command nearby creatures to attack targets.'},
{n:'Haven',d:'Shape nearby landscape into a protective shelter.'},
{n:'Sylv',d:'Perceive disturbances and activity through a connected forest\'s living root systems.'},
],
dyreon:[
{n:'Fetch',d:'Draw a bonded Dyrefetch from its Fetchwell through the Fetchglove, commanding it to engage a target.'},
{n:'Press',d:'Channel offensive capability through the Fetchglove, or command the fetched beast to execute that attack.'},
{n:'Shuffle',d:'Change the active Dyredeck card on a Fetchglove, applying a boon to the Dyrefetch or recalling it.'},
],
// Zealot's line (Sacral, Spirit):
zealot:[
{n:'Vehem',d:'Direct Sacral force through an attack, allowing intent to raise its effectiveness and potential damage.'},
{n:'Center',d:'Stabilize your spirit against hostile influence, fear, or disruption.'},
{n:'Vigil',d:'Perceive nearby disturbances in intent or perceive malevolence.'},
{n:'Imprint',d:'Focus your intent upon a chosen action, strengthening its spiritual expression.'},
{n:'Solace',d:'Restore a wounded creature\'s vitality, relieving pain and accelerating recovery through Sacral.'},
],
shaman:[
{n:'Evince',d:'Manifest an unseen force that strikes a target with an offensive effect.'},
{n:'Turn',d:'Redirect an incoming attack away from yourself or another creature through focused intent.'},
{n:'Entreat',d:'Establish communication with, or receive a vision of, a spirit, allowing negotiation and exchange of knowledge.'},
],
monk:[
{n:'Palm',d:'Deliver a concentrated blow that channels Sacral through physical contact.'},
{n:'Stance',d:'Adopt a disciplined fighting form that changes how you move, defend, and attack.'},
{n:'Chi',d:'Recognize an opponent\'s impending movement and respond before the action is completed.'},
],
bokor:[
{n:'Effigy',d:'Establish a connection between an object and a creature, allowing actions performed upon the object to affect its counterpart.'},
{n:'Vex',d:'Direct misfortune toward a creature, disrupting its actions or causing harmful consequences.'},
{n:'Jinx',d:'Transfer an existing affliction from one creature or object to another.'},
],
loaite:[
{n:'Wane',d:'Affliction that progressively deteriorates a target\'s physical capabilities.'},
{n:'Hemm',d:'Confine an affliction to its current host, preventing its spread or transfer.'},
{n:'Blight',d:'Place Magicka upon yourself or another that punishes anyone who inflicts harm upon its bearer.'},
],
caelyn:[
{n:'Veystrike',d:'Channel the elemental power of your pact through the Caelvern, delivering an attack shaped by your Caeth Line.'},
{n:'Lance',d:'Extend the Caelvern\'s manifested element beyond its physical reach to strike a target.'},
{n:'Sheath',d:'Shape your Caelvern\'s elemental force into an active defense against incoming threats.'},
],
// Inquisitor's line (Divine):
inquisitor:[
{n:'Condemnation',d:'Invoke divine authority to inflict harm upon a chosen target.'},
{n:'Bless',d:'Bestow vitality upon a creature.'},
{n:'Grace',d:'Bestow divine protection upon yourself or a creature, reducing harm endured.'},
{n:'Exhort',d:'Strengthen a creature\'s resolve through an invocation.'},
{n:'Exalt',d:'Elevate divine favor, which could influence outcomes of subsequent workings.'},
],
cleric:[
{n:'Chasten',d:'Deliver a concentrated surge of divine power against a creature, with its manifestation determined by the deity invoked.'},
{n:'Damn',d:'Impair a target\'s ability to act against you in the specific domain of your deity.'},
{n:'Shrive',d:'Remove a harmful condition or supernatural affliction from a creature.'},
],
paladin:[
{n:'Smite',d:'Channel divine power through a weapon, adding an effect determined by the invoked deity.'},
{n:'Avenge',d:'Voluntarily endure harm or expend your vitality to preserve another creature. This will deliver a retaliatory strike against the creature that has harmed you or an ally.'},
{n:'Conviction',d:'Intercept an attack intended for you or another creature, bearing or diminishing its consequences.'},
],
devout:[
{n:'Implore',d:'Invoke your deity\'s authority to manifest an offensive effect associated with their domain.'},
{n:'Sanctuary',d:'Establish a consecrated area that protects creatures within it from hostile influences.'},
{n:'Tithe',d:'Surrender a portion of your own vitality to give another creature temporary invulnerability.'},
],
augur:[
{n:'Doom',d:'Place an omen upon a creature that manifests a harmful consequence when it performs a foretold action.'},
{n:'Prescience',d:'Receive advance warning of an imminent threat, allowing yourself or another creature to react before it occurs.'},
{n:'Auspice',d:'Interpret signs to uncover information about a person, place, or possible future event pertaining to your deity\'s domain.'},
],
iridesce:[
{n:'Rive',d:'Separate portions of the Ecliphane\'s luminous blade and direct them toward a target before restoring its form.'},
{n:'Emanate',d:'Release divine force through the Ecliphane, producing an attack or barrier influenced by the invoked deity.'},
{n:'Starstride',d:'Traverse space through divine intervention, moving beyond ordinary physical limitations.'},
],
// Mystic's line (Shaeid, Whim):
mystic:[
{n:'Glint',d:'Manifest a concentrated burst of Shaeid light that strikes a creature.'},
{n:'Beset',d:'Stir a creature\'s emotions, disrupting its concentration or actions.'},
{n:'Espy',d:'Perceive nearby influences, hidden enchantments, or disturbances with Shaeid energy.'},
{n:'Figment',d:'Give temporary visible form to an imagined object or phenomenon.'},
{n:'Truename',d:'Lay hold of a creature\'s true name, weakening its ability to hide, deceive, or resist Magicka.'},
],
witch:[
{n:'Bewitch',d:'Enchant a creature so that attempting to harm another triggers a supernatural consequence.'},
{n:'Poppet',d:'Establish a sympathetic connection to an object, allowing it to hear what you say to it in its mind.'},
{n:'Wile',d:'Alter how a creature perceives you, concealing your identity or disguising your actions.'},
],
dryad:[
{n:'Briar',d:'Constrict a creature with living vines, tightening as it struggles.'},
{n:'Wrack',d:'Cause vegetation to wrench apart an object or structure.'},
{n:'Brume',d:'Manifest a luminous Fae mist that conceals creatures and distorts the perception of those within it.'},
],
fatebinder:[
{n:'Woe',d:'Place a Shaeid working upon a creature that causes an attempted action to produce an unfavorable consequence.'},
{n:'Filch',d:'Steal favorable chance from a creature and temporarily claim it for yourself.'},
{n:'Hitch',d:'Unravel an ongoing fate-binding effect before its consequence manifests.'},
],
wishwright:[
{n:'Weal',d:'Bestow a desired benefit that changes an immediate circumstance.'},
{n:'Reft',d:'Seize something personally significant from a creature, stunning or weakening it through the loss.'},
{n:'Geas',d:'Upon a creature\'s agreement and the use of its true name, bind it to a supernatural contract, invoking a consequence if its terms are violated.'},
],
arcani:[
{n:'Fulgur',d:'Discharge concentrated Shaeid Light from your weapon, striking a target beyond its physical reach.'},
{n:'Ichor',d:'Channel your Fae Core\'s resonance into a temporary manifestation of essence that fights alongside you.'},
{n:'Gatecut',d:'Open a temporary passage through the Faetway between attuned locations.'},
],
// Oneir's line (Wraill, Dream):
oneir:[
{n:'Mare',d:'Force a creature to experience a fragment of its fears, disrupting its actions or causing it to injure itself.'},
{n:'Harm',d:'Instantly pull vitality from a target.'},
{n:'Pall',d:'Induce a dreamlike paralysis that interferes with a creature\'s movement and through mastery, surrenders their will.'},
{n:'Rouse',d:'Abruptly interrupt an enchantment affecting consciousness, returning the creature to waking awareness.'},
{n:'Somn',d:'Enter a sleeping creature\'s dream to observe, communicate, or interact with its subconscious.'},
],
harrow:[
{n:'Ravage',d:'Inflict a destructive illusion that progressively deteriorates a creature\'s physical and mental condition.'},
{n:'Suspire',d:'Suspend a creature\'s consciousness between waking and unconsciousness, shielding it from further mental intrusion, but paralyzing them.'},
{n:'Thrall',d:'Manipulate a sleeping creature into believing an implanted command originated from its own thoughts.'},
],
hemoclast:[
{n:'Sangri',d:'Manipulate exposed blood into a weapon that strikes its original host or another creature.'},
{n:'Cruor',d:'Manifest spilled blood into a hardened barrier that intercepts incoming attacks, sometimes leaving behind a valuable stone prized on the black market.'},
{n:'Bluntbleed',d:'Draw blood from a creature without opening a wound, forging it into an arrow projectile.'},
],
necromancer:[
{n:'Mori',d:'Inflict necromantic corruption that progressively destroys living tissue.'},
{n:'Sere',d:'Temporarily render living tissue insensible to pain and injury, delaying the consequences for a period.'},
{n:'Requiem',d:'Release a bound soul from its remains or sever a necromantic connection sustaining an undead creature.'},
],
mystagogue:[
{n:'Mirage',d:'Manifest a dreamlike duplicate that can misdirect an enemy\'s attack before dissipating.'},
{n:'Shroud',d:'Conceal your presence by preventing nearby creatures from consciously registering you.'},
{n:'Eidolon',d:'Manifest an autonomous representation of an imagined creature that can interact with the waking world.'},
],
eldritch:[
{n:'Calam',d:'Unleash destructive Magicka that causes living tissue and physical matter to deteriorate.'},
{n:'Anath',d:'Steal the Magicka stores from another weaver.'},
{n:'Theos',d:'Temporarily surrender your ordinary physical form to become a manifestation of destructive nightmare Magicka.'},
],
// Bard's line (Vox, Affect, which consumes Essence):
bard:[
{n:'Serenade',d:'Imbue a solo performance with Magicka to influence the emotions and disposition of those who hear it.'},
{n:'Flyte',d:'Weaponize spoken verse and verbal insults to inflict magical harm upon a creature.'},
{n:'Hush',d:'Suppress or dispel sound within a designated area.'},
{n:'Cacophony',d:'Generate discordant magical frequencies that damage and disorient affected creatures.'},
{n:'Refrain',d:'Conjure and sustain a protective ward through a recurring musical phrase.'},
],
minstrel:[
{n:'Ballad',d:'Recount an event through song, revealing details or impressions preserved in the memories of listeners.'},
{n:'Lilt',d:'Alter a creature\'s movement through an irresistible musical rhythm.'},
{n:'Bravur',d:'Concentrate Vox into a virtuosic instrumental attack.'},
],
rhapsodist:[
{n:'Ostinato',d:'Compel a target to repeat a particular movement or action.'},
{n:'Arpeggio',d:'Deliver successive magical strikes through a sequence of musical notes.'},
{n:'Syncopate',d:'Interrupt a creature\'s rhythm by disrupting its harmony.'},
],
cantor:[
{n:'Hymnum',d:'Channel a prolonged vocal performance into an increasingly powerful manifestation.'},
{n:'Chorus',d:'Combine multiple phantom performers\' voices into a single amplified working.'},
{n:'Voxcant',d:'Unleash a concentrated burst of Vox through a forceful cry, producing a shockwave that strikes and repels creatures in its path.'},
],
// Rogue's line (Fortitude, Soul):
rogue:[
{n:'Pick',d:'Bypass locks and mechanical restraints through practiced manipulation.'},
{n:'Blend',d:'Move discreetly through an environment while avoiding detection.'},
{n:'Houdi',d:'Escape physical restraints, grapples, or confined spaces through controlled movement.'},
{n:'Swipe',d:'Secretly remove an object from another creature\'s possession.'},
{n:'Waylay',d:'Exploit concealment to deliver an attack before the target can react.'},
],
strider:[
{n:'Sureshot',d:'Deliver a precisely aimed ranged attack against a vulnerable point.'},
{n:'Brave',d:'Resist the physical consequences of exposure and harsh environments.'},
{n:'Dog',d:'Attack a fleeing target without slowing pursuit.'},
],
ranger:[
{n:'Volley',d:'Deliver multiple ranged attacks in quick succession.'},
{n:'Hunker',d:'Exploit surrounding terrain to reduce incoming harm.'},
{n:'Track',d:'Follow creatures using footprints, disturbances, and physical evidence.'},
],
inspector:[
{n:'Nab',d:'Seize and physically restrain a resisting creature.'},
{n:'Clobber',d:'Deliver a forceful series of strikes that inflict physical damage.'},
{n:'Scrutinize',d:'Discover concealed physical evidence and inconsistencies at a scene.'},
],
detective:[
{n:'Capitalize',d:'Identify a vulnerable point in an opponent\'s defense and attack it.'},
{n:'Telegraph',d:'Turn an opponent\'s committed movement against them to counter an attack.'},
{n:'Cross',d:'Identify contradictions and concealed information during questioning.'},
],
sleuth:[
{n:'Sting',d:'Deceive an opponent into exposing themselves to a damaging attack.'},
{n:'Shake',d:'Break an enemy\'s pursuit through calculated evasive movement.'},
{n:'Profile',d:'Identify a subject\'s habits and predict their likely decisions.'},
],
// Fighter's line (Grit, Body):
fighter:[
{n:'Cleave',d:'Deliver a powerful physical blow that inflicts substantial damage.'},
{n:'Brace',d:'Prepare your body to withstand the impact of an incoming attack.'},
{n:'Rally',d:'Recover from physical exhaustion and continue fighting effectively.'},
{n:'Feint',d:'Mislead an opponent through a false attack, creating an opening.'},
{n:'Frenzy',d:'Deliver successive close-combat strikes against an opponent.'},
],
barbarian:[
{n:'Barge',d:'Rush into an enemy, delivering a damaging impact that forces them backward.'},
{n:'Rampage',d:'Heighten your rage, dealing additional damage with each attack.'},
{n:'Sunder',d:'Strike equipment or armor to damage it and compromise its protection.'},
],
knight:[
{n:'Pierce',d:'Deliver a focused weapon attack against a target\'s defenses.'},
{n:'Wall',d:'Defend a retreating ally against advancing enemies.'},
{n:'Errantry',d:'Maintain determined progress toward an assigned objective despite obstacles and interference.'},
],
swashbuckler:[
{n:'Cutback',d:'Deliver a damaging cut while moving past an opponent.'},
{n:'Sea Legs',d:'Maintain movement and combat effectiveness across unstable or shifting surfaces.'},
{n:'Sendoff',d:'Use leverage to throw an adversary from an elevated or confined position.'},
],
marauder:[
{n:'Storm',d:'Smash through a defended entrance or chokepoint, damaging those holding the position.'},
{n:'Maroon',d:'Separate an opponent from companions or escape routes by manipulating the surrounding terrain.'},
{n:'Cutthroat',d:'Exploit the chaos of a larger engagement to eliminate an isolated adversary with a ruthless attack.'},
],
gallant:[
{n:'Coup de Main',d:'A swift assault against an objective considered secure. Unlike Storm, its effectiveness comes from timing and surprise rather than brute-force entry.'},
{n:'Rampart',d:'Coordinate available allies and obstacles into an improvised defensive position against an advancing force.'},
{n:'Undaunted',d:'Maintain physical coordination and judgment under exhaustion, pain, and overwhelming pressure.'},
],
// Poet's line (Volition, Affect, which consumes Essence):
poet:[
{n:'Vitriol',d:'Deliver a devastating verbal assault that inflicts direct psychological damage, undermining a target\'s composure.'},
{n:'Barb',d:'Deliver a concise verbal criticism that exposes a contradiction or weakens someone\'s credibility.'},
{n:'Impersonate',d:'Reproduce another person\'s voice to deceive listeners or issue misleading commands.'},
{n:'Goad',d:'Provoke an opponent into acting rashly, creating a tactical opening.'},
{n:'Recite',d:'Hold an audience\'s attention through a commanding delivery, creating opportunities for companions.'},
],
herald:[
{n:'Cue',d:'Deliver a damaging weapon strike while signaling a companion to exploit the attack, giving them an attack regardless of initiative position.'},
{n:'Alarum',d:'Issue an immediate warning that allows companions to react to an approaching threat or attempted ambush.'},
{n:'Parley',d:'Establish a formal opportunity to negotiate with an adversary during an active confrontation.'},
],
provocateur:[
{n:'Cheap Shot',d:'Deliver a damaging physical attack while an opponent is distracted by an argument or confrontation.'},
{n:'Implicate',d:'Redirect an opponent\'s suspicion or hostility toward another plausible culprit.'},
{n:'Discord',d:'Introduce credible misinformation or exploit existing mistrust to weaken an opposing group\'s cohesion.'},
],
tribune:[
{n:'Quash',d:'Deliver a damaging physical attack against an opponent. If they are attempting to issue orders, signals, or reinforcements, you disrupt their command.'},
{n:'Veto',d:'Challenge an order or decision issued by an authority you have standing to oppose, potentially preventing its execution.'},
{n:'Mandate',d:'Turn willing individuals into an organized force capable of changing an encounter through coordinated action, without mind control or magical influence.'},
],
// Merchant's line (Reason, Spirit):
merchant:[
{n:'Wrest',d:'Deliver a damaging strike while attempting to disarm an opponent and take possession of their equipment.'},
{n:'Exchange',d:'Exchange a carried item with a willing ally during an encounter without requiring the usual handoff procedure.'},
{n:'Valuate',d:'Examine an item to identify its practical value, condition, authenticity, and detectable defects.'},
{n:'Bribe',d:'Offer material compensation to persuade a creature to provide information, cooperation, or access.'},
{n:'Bargain',d:'Negotiate more favorable terms in a transaction by exploiting knowledge of an item\'s value, market conditions, or the other party\'s needs.'},
],
emissary:[
{n:'Breakthrough',d:'Deliver a damaging physical strike against an opponent obstructing your movement, creating an opening to advance.'},
{n:'Escort',d:'Protect a designated companion against attempts to intercept or separate them.'},
{n:'Credential',d:'Present recognized authority to gain access or passage through restricted locations.'},
],
tycoon:[
{n:'Bounty',d:'Place a monetary reward on an adversary, encouraging willing combatants to pursue and attack that target.'},
{n:'Entrench',d:'Direct available personnel and materials to establish a defensive position that provides physical protection.'},
{n:'Acquire',d:'Obtain equipment or supplies through an established commercial network that would otherwise be difficult to access.'},
],
negotiator:[
{n:'Shakedown',d:'Inflict physical damage while applying pressure to a restrained opponent, forcing them to choose between continued resistance and surrendering a demand.'},
{n:'Tradebond',d:'Commit a valuable asset as security for a temporary agreement, giving the opposing party a material reason to honor it.'},
{n:'Broker',d:'Identify mutually acceptable concessions between opposing parties to establish an agreement that neither could secure alone.'},
],
vizier:[
{n:'Unseat',d:'Deliver a damaging physical attack that forces an opponent from a strategically advantageous position.'},
{n:'Preempt',d:'Identify an impending enemy maneuver and prepare a defensive response that reduces its effectiveness.'},
{n:'Proscribe',d:'Use commercial or political influence to restrict an opposing faction\'s access to goods, services, or institutional support.'},
],
baron:[
{n:'Exact',d:'Deliver a damaging retaliatory strike against an opponent who has harmed you, an ally, or someone under your protection.'},
{n:'Demesne',d:'Establish and administer a controlled holding that provides access to its available resources, personnel, and facilities.'},
{n:'Enfeoff',d:'Grant an eligible individual a recognized office or responsibility, delegating defined authority and obligations.'},
],
// Scholar's line (Focus, Mind):
scholar:[
{n:'Inquire',d:'Obtain specialized knowledge through structured questioning, comparison of accounts, and investigation of available evidence.'},
{n:'Leverage',d:'Deliver a damaging physical strike that exploits weakness to increase its impact.'},
{n:'Calculate',d:'Determine the probable trajectory, timing, or outcome of a physical action using measurement and mathematical reasoning.'},
{n:'Hypothesize',d:'Form a testable explanation for an unfamiliar phenomenon, identifying a practical method of verifying its cause.'},
{n:'Improvise',d:'Alter the use of an existing tool or technique to overcome circumstances for which it was not originally intended.'},
],
strategist:[
{n:'Decoy',d:'Use a deliberate diversion to draw an opponent\'s attention away from an incoming damaging attack.'},
{n:'Counterplan',d:'Identify an enemy\'s apparent strategy and prepare an opposing maneuver designed to undermine its execution.'},
{n:'Siege',d:'Coordinate sustained pressure against a fortified position, progressively compromising its defenses.'},
],
tactician:[
{n:'Push',d:'Deliver a damaging attack that forces an opponent to surrender ground or risk a subsequent strike.'},
{n:'Pivot',d:'Immediately change your approach when an anticipated action fails, repositioning yourself to exploit an alternative opening.'},
{n:'Screen',d:'Interpose yourself or available cover between an ally and an approaching threat, reducing the effectiveness of the attack.'},
],
cartographer:[
{n:'Chart',d:'Record an explored region\'s terrain, landmarks, and routes, revealing connections between previously surveyed locations.'},
{n:'Bankshot',d:'Deliver a damaging ranged attack by calculating a projectile\'s deflection against a nearby surface to reach a target.'},
{n:'Escape Route',d:'Identify a viable path out of a threatened location, allowing nearby allies to withdraw without becoming trapped.'},
],
archivist:[
{n:'Exegesis',d:'Interpret an ancient or ambiguous record to reveal a concealed instruction, location, or function that can be acted upon.'},
{n:'Precedent',d:'Recognize an opponent\'s fighting technique from documented examples and deliver a damaging counterattack against a known vulnerability.'},
{n:'Traceback',d:'Identify the original configuration of a modified mechanism using available records, revealing how to restore or disable its function.'},
],
scientist:[
{n:'Discharge',d:'Deliver a damaging electrical attack through an available conductive medium, potentially disrupting magical constructs sustained by electrical or physical mechanisms.'},
{n:'Ground',d:'Channel an incoming electrical or energy-based manifestation into a suitable conductive path, reducing the damage sustained.'},
{n:'Isolate',d:'Separate an observable physical factor from a magical phenomenon to identify a condition necessary for its manifestation.'},
],
inventor:[
{n:'Pulse',d:'Release a concentrated electrical discharge from a constructed apparatus, damaging a target and interfering with vulnerable equipment.'},
{n:'Maton',d:'Deploy a small automaton that follows commands to attack enemies, defend allies, or perform simple mechanical tasks.'},
{n:'Retrofit',d:'Modify an existing device to perform a function outside its original design.'},
],
// Warden's line (Praethacy, Hope; user, 2026-11-15). Warden lays the Praethic foundation of combat and protection.
// Ghrimm leans Ingenium (engineered control); Wreicht leans Magicka (direct magical expression through Praethic principles).
warden:[
{n:'Strikefield',d:'Release a concentrated Praethic discharge that damages a target within reach of your active field.'},
{n:'Barrier',d:'Establish a protective Praethic field around yourself or another creature, reducing incoming damage.'},
{n:'Groundlink',d:'Connect yourself to a compatible physical or energetic anchor, resisting forced displacement and disruptive effects.'},
{n:'Polarize',d:'Alter the alignment of an active Praethic field to attract or repel compatible objects and energetic manifestations.'},
{n:'Contain',d:'Enclose an unstable magical or technological working within a temporary Praethic boundary, preventing its effects from spreading.'},
],
ghrimm:[
{n:'Gridlock',d:'Establish an interconnected Praethic field that damages opponents attempting to move through its active boundaries.'},
{n:'Reintegrate',d:'Reconnect damaged components of a compatible mechanical or Praethic construct, restoring its operation.'},
{n:'Ironveil',d:'Reinforce a defensive Praethic field through a connected technological apparatus, reducing damage sustained by creatures within it.'},
],
wreicht:[
{n:'Spellreave',d:'Deliver a damaging Praethic attack that draws upon an active magical working, weakening its manifestation.'},
{n:'Wardweave',d:'Extend an active magical defense through Praethic force, allowing it to protect additional nearby creatures.'},
{n:'Transposition',d:'Exchange the positions of two compatible magical manifestations through an established Praethic connection.'},
],
// Null's line (Nihimence, Hope; user, 2026-11-15). Proposed specialisations: Nil reduces and resists, Naught suppresses,
// Nix rejects and interrupts, Sentinaut masters all three. None of them erases all Magicka and Ingenium outright.
nil:[
{n:'Diminish',d:'Deliver a damaging physical strike that temporarily reduces the effectiveness of an active magical or technological enhancement on the target.'},
{n:'Withstand',d:'Maintain physical control against an incoming supernatural or technological force, reducing its ability to displace you.'},
{n:'Depletion',d:'Increase the energy expenditure required to sustain a targeted active working, hastening its exhaustion.'},
],
naught:[
{n:'Hollow',d:'Strike an opponent while weakening the active energy sustaining one of its magical or technological protections.'},
{n:'Deadzone',d:'Establish a limited area where active magical and technological workings become less effective.'},
{n:'Blank',d:'Conceal your presence from detection systems that rely upon active magical or technological signatures.'},
],
nix:[
{n:'Rebuke',d:'Deliver a damaging counterstrike against an opponent attempting to impose a magical or technological effect upon you.'},
{n:'Abjure',d:'Reject an active supernatural or technological influence affecting yourself, weakening or ending its continued effect.'},
{n:'Deny',d:'Interrupt an opponent\'s attempt to establish a new magical or technological working within your effective reach.'},
],
sentinaut:[
{n:'Nullstrike',d:'Deliver a concentrated damaging attack that temporarily suppresses a target\'s active magical or technological enhancements.'},
{n:'Aegisnull',d:'Establish a protective field around nearby allies that diminishes incoming magical and technologically generated damage.'},
{n:'Severlink',d:'Interrupt the connection between a creature and a remotely sustained magical or technological working, preventing its continued operation.'},
],
// Laureate (Scholar's master class, Focus, Mind): unifies research, strategy and science; the Cypherhedron supports it without being required.
laureate:[
{n:'Synthesis',d:'Combine observations from separate disciplines to identify a concealed vulnerability in a creature, mechanism, or working, allowing a damaging attack to exploit it.'},
{n:'Axiom',d:'Establish a verified principle governing a target\'s behavior, improving your ability to anticipate and defend against its next action.'},
{n:'Proof',d:'Apply gathered evidence to expose an illusion, deception, or concealed mechanism, revealing its underlying operation.'},
],
// Eikon (Alchemist's master class, Magicka).
eikon:[
{n:'Manifest',d:'Project your Affinity onto a target or environment, producing an effect consistent with its nature.'},
{n:'Amplify',d:'Intensify an existing expression of your Affinity, increasing its effectiveness.'},
{n:'Pervade',d:'Extend your Affinity throughout a connected area in a defensive position, lessening damage.'},
],
// The rest of Artificer's line (Ingenium, Whim). Axion masters the engineered systems themselves; Whyth is the equipped elite combatant.
gunsmith:[
{n:'Rifle',d:'Modify a firearm\'s barrel or firing assembly to deliver a more accurate and damaging projectile.'},
{n:'Chamber',d:'Prepare specialized ammunition that delivers an additional physical or mechanical effect upon impact.'},
{n:'Recoil',d:'Activate a compensating mechanism that reduces the impact of an incoming attack while maintaining control of an equipped firearm.'},
],
tinkerer:[
{n:'Windup',d:'Deploy a spring-driven device that performs a repeated physical action until its stored energy is exhausted.'},
{n:'Snarework',d:'Construct a compact mechanical restraint that captures or restricts a creature when triggered.'},
{n:'Autoguard',d:'Deploy a small mechanical apparatus that intercepts an incoming physical attack against a nearby creature.'},
],
machinist:[
{n:'Pneumatic',d:'Deliver a damaging strike through compressed mechanical pressure, forcing an opponent backward.'},
{n:'Exoframe',d:'Activate a wearable mechanical framework that reinforces the body and reduces incoming physical damage.'},
{n:'Automate',d:'Configure a compatible mechanism to execute a predetermined sequence of physical operations without continuous supervision.'},
],
axion:[
{n:'Armament',d:'Integrate compatible constructed weapons into a coordinated attack system, delivering simultaneous strikes against a designated target.'},
{n:'Aegiswork',d:'Deploy an interconnected mechanical defense that intercepts incoming attacks against yourself or nearby allies.'},
{n:'Reconfigure',d:'Alter the operating arrangement of compatible equipped mechanisms during combat, changing their functional capabilities without dismantling them.'},
],
// Psynth (Volition, Hope), a master class on Warden's Praethacy line:
psynth:[
{n:'Impulse',d:'Deliver a damaging pulse of Praethic force that drives an opponent backward.'},
{n:'Splinter',d:'Project a Praethic strike that separates into multiple damaging fragments upon impact.'},
{n:'Phase',d:'Shift the energetic state of a targeted working, allowing an attack to bypass a physical or magical defense.'},
{n:'Bridge',d:'Create a temporary interface through which a magical working can operate a compatible technological mechanism, or vice versa.'},
{n:'Splice',d:'Connect two otherwise separate energetic pathways, allowing their effects to operate through a shared channel.'},
],
// Alchemist's line (Ingenium, Dream):
alchemist:[
{n:'Corrode',d:'Apply a reactive agent that damages a target and deteriorates exposed materials.'},
{n:'Sedate',d:'Apply a prepared agent that impairs a creature\'s alertness and slows its physical reactions.'},
{n:'Assay',d:'Analyze an unfamiliar substance to identify its reactive properties, toxicity, and potential applications.'},
{n:'Quench',d:'Apply an alchemical preparation that rapidly absorbs heat, extinguishing a localized fire or reducing thermal damage.'},
{n:'Volatilize',d:'Convert a prepared substance into a rapidly dispersing vapor that affects creatures within its area.'},
],
mutagenist:[
{n:'Atrophy',d:'Introduce a compound that temporarily deteriorates a target\'s muscular strength, reducing the force of its physical attacks.'},
{n:'Vigor',d:'Stimulate a creature\'s physiological functions to temporarily increase endurance and resistance to fatigue.'},
{n:'Dissept',d:'Accelerate the shedding of affected surface tissues, removing an externally applied harmful substance or biological contaminant.'},
],
biomancer:[
{n:'Graft',d:'Integrate compatible biological tissue into a living organism, restoring or modifying an existing anatomical structure.'},
{n:'Rejuvenate',d:'Restore deteriorated biological tissue to a healthier functional condition, reversing accumulated physiological damage.'},
{n:'Calcify',d:'Accelerate abnormal mineral deposition within a creature\'s tissues, inflicting damage and restricting movement.'},
],
bombardier:[
{n:'Grenade',d:'Trigger a prepared explosive compound, inflicting damage upon creatures and objects within its blast radius.'},
{n:'Thermite',d:'Deploy an incendiary compound that produces intense localized heat, damaging equipment and exposed structures.'},
{n:'Flashbang',d:'Detonate a charge that emits a sudden flash and concussive report, temporarily impairing nearby creatures\' senses.'},
],
saboteur:[
{n:'Jam',d:'Introduce a foreign substance or mechanical obstruction that prevents a targeted mechanism or weave from operating correctly.'},
{n:'Deadbolt',d:'Mechanically secure an accessible door, hatch, or moving assembly, preventing its normal operation.'},
{n:'Tripwire',d:'Install a concealed trigger that activates a prepared hazard when disturbed by a passing creature.'},
],
// Artificer's line (Whim; the user's header gives no resource word yet):
artificer:[
{n:'Rivet',d:'Launch a reinforced metal fastener from an apparatus, inflicting piercing damage upon a target.'},
{n:'Bracework',d:'Deploy a mechanical support that reduces the force of an incoming impact.'},
{n:'Rig',d:'Assemble a temporary mechanical apparatus that performs a single physical task when activated, deteriorating once it completes or stalls.'},
{n:'Repair',d:'Restore a damaged device or a heavily technological creature.'},
{n:'Override',d:'Bypass an accessible mechanism\'s ordinary controls to activate or disable its function.'},
],
gunslinger:[
{n:'Deadeye',d:'Deliver a precisely aimed firearm attack that exploits an exposed vulnerability to inflict increased damage.'},
{n:'Gunguard',d:'Position an equipped firearm to deflect an incoming melee strike, reducing damage while maintaining control of the weapon.'},
{n:'Quickdraw',d:'Draw and discharge an equipped firearm before an approaching opponent completes its attack.'},
],
// Vanguard's line (Ingenuity, Will):
vanguard:[
{n:'Salvo',d:'Deliver successive ranged attacks against multiple enemies within your weapon\'s effective area.'},
{n:'Bracelock',d:'Engage a mechanical support within your equipment to withstand a powerful impact without losing your position.'},
{n:'Ping',d:'Emit a technological detection pulse that reveals nearby movement or physical obstructions.'},
{n:'Reload',d:'Rapidly replenish an equipped weapon\'s ammunition or operational supply, reducing the interruption to your attacks.'},
{n:'Grapple',d:'Deploy a mechanical tether to pull yourself toward an anchored surface or reposition an unsecured object.'},
],
sentine:[
{n:'Reflex',d:'Activate an assisted-response mechanism that improves your ability to evade an incoming attack.'},
{n:'Burstfire',d:'Deliver a rapid succession of damaging ranged attacks against a single designated target.'},
{n:'Thruster',d:'Activate a directional propulsion system to perform a rapid evasive movement.'},
],
stalwart:[
{n:'Hammerfall',d:'Deliver a devastating downward strike using amplified strength, damaging a target and destabilizing nearby opponents.'},
{n:'Harden',d:'Activate reinforced protective plating that reduces the damage sustained from incoming attacks.'},
{n:'Gravlock',d:'Anchor yourself through equipped stabilizers, preventing external forces from moving you against your will.'},
],
whyth:[
{n:'Overkill',d:'Direct multiple equipped offensive systems against a single target, delivering a concentrated assault.'},
{n:'Phalanx',d:'Extend an equipped defensive apparatus to provide temporary protection to nearby allies while maintaining your own combat readiness.'},
{n:'Skyfall',d:'Descend from an elevated position using controlled propulsion, delivering a damaging impact against a designated target.'},
],
archon:[
{n:'Exile',d:'Trap a creature in an arcane prison that physically prevents escape.'},
{n:'Legion',d:'Create temporary copies of a physical object that can be used or interacted with.'},
{n:'Wake',d:'Give movement and temporary obedience to otherwise inanimate objects.'},
],
// Null's abilities (Reason, Hope), replacing Stillpoint, Hollow Breath, Severing Palm, Unwoven Sight and Blackout (user, 2026-11-12):
null:[
{n:'Sense',d:'Detect the presence of active Magicka or Ingenium through disturbances in their operation.'},
{n:'Short',d:'Cause a targeted magical or technological surge to discharge its active energy against its wielder.'},
{n:'Refuse',d:'Reject an externally imposed magical or technical compulsion, preventing it from damaging you.'},
]};
export function classAbilities(name){const own=OWN_ABILITIES[name.toLowerCase()];if(own)return own;for(const paths of Object.values(TREE)){for(const p of paths){for(const c of [p.base,...p.t2,...p.t3])if(c.name.toLowerCase()===name.toLowerCase())return c.abilities;}}return [];}
// Three independent dimensions (the user's model): a discipline level says how advanced a working is,
// an ability says what it is, and eligibility says who may perform it.
// Every class climbs its own discipline ladder (user decision, October 29): a level-one Scholar and a level-one Artificer each buy Tinkertrick.
// The deepest class awakened in its line caps its ladder: a calling alone reaches the second level, tier 2 the third, tier 3 the fourth, and the endpoint the fifth (Weave, Schematic…). See levelReach.
export const LEVEL_DEPTH=[1,1,2,3,4];
export const levelId=(classId,index)=>{const cls=classById(classId);return `${cls.id}:${cls.discipline}:levels:${index}`;};
// Caelyn and Dyreon cross practices, so they climb in words of their own (user's terms) rather than their practice's ladder.
const CLASS_LADDERS={caelyn:['Dormant','Awakened','Ascendant','Transcendent','Resonant'],dyreon:['Initiate','Bonded','Adept','Synchronized','Sovereign']};
export const ladderOf=cls=>CLASS_LADDERS[cls.id]||setupForClass(cls).levels;
// Caelyn's stages include Dormant and Awakened, so "Awaken Awakened" would not read; it attains instead (user decision).
export const buyVerb=cls=>cls.id==='caelyn'?'Attain':'Awaken';
export function classLevelNodes(cls){const d=setupForClass(cls);return ladderOf(cls).map((name,i)=>({id:levelId(cls.id,i),kind:'level',discipline:d.id,name,levelName:name,level:i+1,cost:i+1,minTier:LEVEL_DEPTH[i],description:`${name.toUpperCase()} is ${cls.name}'s level ${i+1} in ${d.name}. Holding it lets ${cls.name} ${buyVerb(cls).toLowerCase()} its abilities at ${name.toUpperCase()}.`}));}
const ancestorsOf=cls=>{const seen=new Map(),queue=[...(cls.parentIds||[])];while(queue.length){const id=queue.shift();if(seen.has(id))continue;const parent=classById(id);seen.set(id,parent);queue.push(...(parent.parentIds||[]));}return [...seen.values()];};
const descendantsOf=cls=>classes.filter(c=>ancestorsOf(c).some(a=>a.id===cls.id));
// Eligibility from ability-eligibility.js, kept to each type's own discipline. Anything that does not resolve to such a class is reported.
const eligible=new Map(),unresolved=[];
for(const d of disciplines)for(const group of ['crafts','banes']){const vocabulary=group==='crafts'?d.crafts:d.types;
for(const [type,names] of Object.entries(ELIGIBILITY[d.id]?.[group]||{})){const index=vocabulary.indexOf(type);if(index<0){unresolved.push({discipline:d.id,type,name:'(type not in the discipline table)'});continue;}
for(const raw of names){if(NAME_FIXES[raw]===null)continue;const cls=classes.find(c=>c.name===(NAME_FIXES[raw]||raw));if(!cls||cls.discipline!==d.id){unresolved.push({discipline:d.id,type,name:raw,reason:cls?`${cls.name} is ${cls.discipline}`:'not a class'});continue;}
if(!eligible.has(cls.id))eligible.set(cls.id,{crafts:[],banes:[]});eligible.get(cls.id)[group].push(index);}}}
// User-approved additions on top of the table.
for(const d of disciplines)for(const [type,names] of Object.entries(ADDITIONS[d.id]||{})){const group=d.crafts.includes(type)?'crafts':'banes',index=(group==='crafts'?d.crafts:d.types).indexOf(type);if(index<0)throw new Error(`Unknown ${d.name} type ${type}`);
for(const name of names){const cls=classes.find(c=>c.name===name);if(!cls||cls.discipline!==d.id)throw new Error(`${name} cannot take ${d.name} ${type}`);if(!eligible.has(cls.id))eligible.set(cls.id,{crafts:[],banes:[]});const list=eligible.get(cls.id)[group];if(!list.includes(index))list.push(index);}}
for(const lists of eligible.values())for(const list of Object.values(lists))list.sort((a,b)=>a-b);
export const eligibilityUnresolved=unresolved;
// One entry per ability a class may learn; each entry has one node per discipline level (Mote Vehem, Charm Vehem…).
export function abilityEntries(cls,category){const d=setupForClass(cls);if(category==='levels')return [];
const own=eligible.get(cls.id)||{crafts:[],banes:[]};
const entries=category==='abilities'?classAbilities(cls.name).map((a,i)=>({group:'abilities',index:i,name:a.n,description:a.d,canonical:true,archive:!OWN_ABILITIES[cls.name.toLowerCase()],levelNames:a.levels||{}})):[...own.crafts.map(i=>({group:'crafts',index:i,name:d.crafts[i]})),...own.banes.map(i=>({group:'banes',index:i,name:d.types[i],bane:true}))];
return entries.map(e=>{const key=`${cls.id}:${d.id}:${e.group}:${e.index}`,description=e.description||`${e.name} is ${e.bane?'a bane type':'an ability type'} in ${d.name}. Its effects are not yet defined.`;
return {...e,key,description,nodes:ladderOf(cls).map((levelName,l)=>({id:`${key}:${l}`,kind:'ability',key,discipline:d.id,abilityName:e.name,levelName,name:e.levelNames?.[l]||`${levelName} ${e.name}`,level:l+1,cost:1,description,canonical:!!e.canonical,archive:!!e.archive,bane:!!e.bane}))};});}
export function abilityNodes(cls,d,category){if(cls.discipline!==d.id)return [];if(category==='levels')return classLevelNodes(cls);return abilityEntries(cls,category).flatMap(e=>e.nodes);}
// Everything a player awakened higher up this class's path stays theirs, grouped by the class it was learned in.
export function retainedNodes(cls,learned){const above=new Map(ancestorsOf(cls).map(a=>[a.id,a])),nodes=allNodes(),groups=new Map();for(const id of learned){const owner=above.get(classOfNode(id));if(!owner)continue;if(!groups.has(owner.id))groups.set(owner.id,{cls:owner,nodes:[]});groups.get(owner.id).nodes.push(nodes.get(id));}return [...groups.values()];}
// Players start with STARTING_POINTS (config.js); any further grants come from Syntarion, the master app, never from this explorer.
// The first ability awakened in any class costs one extra point. Three awakened nodes open the class's next stars (MASTERY, isMastered);
// the class is only Mastered, in the player's terms, once everything it can reach is learned (isComplete).
export const MASTERY=3,FIRST_ABILITY_SURCHARGE=1;
// Ability types are out of play (user decision, 2026-11-05): nothing buys them or counts them. Their tables stay in ability-eligibility.js.
const PLAYABLE=['levels','abilities'];
const classOfNode=id=>id.split(':')[0];
// Counts every purchase per class, its own discipline levels included.
function awakenedCounts(learned){const counts=new Map();for(const id of learned)counts.set(classOfNode(id),(counts.get(classOfNode(id))||0)+1);return counts;}
export function awakenedCount(cls,learned){return awakenedCounts(learned).get(cls.id)||0;}
// A class opens its paths at three purchases, or at everything it has if that is fewer (a class whose abilities are not entered yet may have only its two levels).
const needCache=new Map();
const pathsNeed=cls=>{if(!needCache.has(cls.id))needCache.set(cls.id,Math.min(MASTERY,reachableNodes(cls).length));return needCache.get(cls.id);};
export function isMastered(cls,learned){return awakenedCount(cls,learned)>=pathsNeed(cls);}
// What Mastery asks of a class: its levels and abilities up to the level its own tier allows. Climbing past that is extra.
export function reachableNodes(cls){return PLAYABLE.flatMap(category=>abilityNodes(cls,setupForClass(cls),category)).filter(n=>LEVEL_DEPTH[n.level-1]<=(cls.tier||1));}
export function isComplete(cls,learned){const nodes=reachableNodes(cls);return nodes.length>0&&nodes.every(n=>learned.includes(n.id));}
// A class's ladder climbs with the player (user decision): awakening a class further down its own line raises its cap to that class's tier,
// so Weaver reaches Weave once Archon is awakened. Mastery is still judged at the class's own tier, so going deeper never takes a title away.
export function levelReach(cls,learned){const counts=awakenedCounts(learned);return Math.max(cls.tier||1,...descendantsOf(cls).filter(c=>counts.has(c.id)).map(c=>c.tier||1));}
// A thread between classes lights only if the player walked it: the parent had opened its paths before the child's first purchase.
// Awakening another parent later leaves that thread dark. `learned` keeps purchase order.
export function threadWalked(fromId,toId,learned){const first=learned.findIndex(id=>classOfNode(id)===toId);if(first<0)return false;let seen=0;for(let i=0;i<first;i++)if(classOfNode(learned[i])===fromId&&++seen>=pathsNeed(classById(fromId)))return true;return false;}
export function masteredClasses(learned){const counts=awakenedCounts(learned);return classes.filter(c=>(counts.get(c.id)||0)>=pathsNeed(c));}
export function costOf(id){const parts=id.split(':');return parts[2]==='levels'?Number(parts[3])+1:1;}
export function spentPoints(learned){return learned.reduce((sum,id)=>sum+costOf(id),0)+FIRST_ABILITY_SURCHARGE*awakenedCounts(learned).size;}
// The one-time extra point lands on a class's first purchase, normally its first level: the price of opening another class.
export function nodeCost(node,learned){return node.cost+(awakenedCounts(learned).has(classOfNode(node.id))?0:FIRST_ABILITY_SURCHARGE);}
// A subclass opens once any parent is mastered; you become aware of it once any parent is awakened.
export function classUnlocked(cls,learned){const counts=awakenedCounts(learned);return !cls.parentIds||cls.parentIds.some(id=>(counts.get(id)||0)>=pathsNeed(classById(id)));}
export function classKnown(cls,learned){const counts=awakenedCounts(learned);return !cls.parentIds||counts.has(cls.id)||cls.parentIds.some(id=>counts.has(id));}
export function unlockRequirement(cls,learned){if(classUnlocked(cls,learned))return null;return `Awaken ${pathsNeed(classById(cls.parentIds[0]))} stars in ${cls.parentIds.map(id=>classById(id).name).join(' or ')} first`;}
function prerequisitesMet(id,learned){const [owner,,group,index,level]=id.split(':'),cls=classById(owner);if(group!=='levels'&&group!=='abilities')return false;if(!cls||!classUnlocked(cls,learned)||(cls.secret&&!nullRevealed(learned)))return false;
if(group==='levels'){const i=Number(index);return LEVEL_DEPTH[i]<=levelReach(cls,learned)&&(i===0||learned.includes(levelId(owner,i-1)));}
const l=Number(level);return learned.includes(levelId(owner,l))&&(l===0||learned.includes(id.replace(/:\d+$/,`:${l-1}`)));}
export function canLearn(node,learned,points=STARTING_POINTS){return !learned.includes(node.id)&&(node.discipline!=='praethacy'||praethacyEligibility(learned).eligible)&&prerequisitesMet(node.id,learned)&&spentPoints(learned)+nodeCost(node,learned)<=points;}
// Why a node cannot be awakened right now, in the order a player should fix it; null when it can be.
export function blockReason(node,learned,points=STARTING_POINTS){if(learned.includes(node.id)||canLearn(node,learned,points))return null;const d=disciplines.find(x=>x.id===node.discipline),i=node.level-1;
if(node.discipline==='praethacy'&&!praethacyEligibility(learned).eligible)return {kind:'veiled',message:'Praethacy is still veiled'};
const cls=classById(classOfNode(node.id));if(cls.secret&&!nullRevealed(learned))return {kind:'veiled',message:'Null has not revealed itself'};if(!classUnlocked(cls,learned))return {kind:'sealed',message:`Sealed · ${unlockRequirement(cls,learned)}`};
if(node.kind==='level'){if(LEVEL_DEPTH[i]>levelReach(cls,learned)){const deeper=descendantsOf(cls).filter(c=>c.tier===LEVEL_DEPTH[i]).map(c=>c.name);return {kind:'depth',message:`${ladderOf(cls)[i].toUpperCase()} opens deeper in this constellation${deeper.length?` (${deeper.join(', ')})`:''}`};}
if(i>0&&!learned.includes(levelId(cls.id,i-1)))return {kind:'requires',message:`Requires ${cls.name}'s ${ladderOf(cls)[i-1].toUpperCase()} first`};}
else{if(!learned.includes(levelId(cls.id,i)))return {kind:'level',message:`Requires ${cls.name}'s ${ladderOf(cls)[i].toUpperCase()} level first`};
if(i>0&&!learned.includes(node.id.replace(/:\d+$/,`:${i-1}`)))return {kind:'requires',message:`Requires ${ladderOf(cls)[i-1].toUpperCase()} ${node.abilityName.toUpperCase()} first`};}
return {kind:'points',message:`Needs ${nodeCost(node,learned)} AP · ${Math.max(0,points-spentPoints(learned))} left`};}
// The parent that would open a sealed class soonest: the one closest to mastery.
export function nextParent(cls,learned){if(!cls.parentIds||classUnlocked(cls,learned))return null;return cls.parentIds.map(id=>classById(id)).sort((a,b)=>awakenedCount(b,learned)-awakenedCount(a,learned))[0];}
// The next level this class can work toward, or null once its ladder is complete.
export function nextLevel(cls,learned){return classLevelNodes(cls).find(n=>!learned.includes(n.id))||null;}
function canAdvance(cls,learned,points){return PLAYABLE.some(category=>abilityNodes(cls,setupForClass(cls),category).some(n=>canLearn(n,learned,points)));}
export function classState(cls,learned,points=STARTING_POINTS){if(!classKnown(cls,learned))return 'unknown';const count=awakenedCount(cls,learned);if(isComplete(cls,learned))return 'mastered';if(count)return 'awakened';if(!classUnlocked(cls,learned))return 'sealed';return canAdvance(cls,learned,points)?'available':'unexplored';}
// Saved builds are re-checked: unknown nodes and nodes whose prerequisites are gone are dropped, and a build that overspends the starting points resets.
export function repairLearned(saved,points=STARTING_POINTS){const all=allUnlocks();let kept=[...new Set((Array.isArray(saved)?saved:[]).filter(id=>all.has(id)))];
for(let changed=true;changed;){const next=kept.filter(id=>prerequisitesMet(id,kept));changed=next.length!==kept.length;kept=next;}
return spentPoints(kept)>points?[]:kept;}
let knownUnlocks;
let nodeIndex;
const allNodes=()=>nodeIndex??=new Map(classes.flatMap(c=>PLAYABLE.flatMap(category=>abilityNodes(c,setupForClass(c),category))).map(n=>[n.id,n]));
const allUnlocks=()=>knownUnlocks??=new Set(allNodes().keys());
export function praethacyEligibility(learned){
allUnlocks();
const counts={magicka:0,ingenium:0,nihimence:0};
// Investment counts by the practice of the line a class belongs to, not the class's own colour (user, 2026-11-15):
// Caelyn and Dyreon are Ingenium but sit on Magicka lines, so they count as Magicka; Eikon counts as Ingenium.
// Otherwise a Magicka-only build could open the Veil through its own cross-practice master class.
for(const id of new Set(Array.isArray(learned)?learned:[])){if(!knownUnlocks.has(id))continue;const cls=classById(id.split(':')[0]),line=cls&&classById(cls.rootId||cls.id),discipline=line?line.discipline:id.split(':')[1];if(discipline in counts)counts[discipline]++;}
const combined=counts.ingenium+counts.nihimence;
// User rule (2026-11-03): three Magicka unlocks and three Ingenium/Nihimence unlocks combined.
return {...counts,combined,requiredCombined:3,requiredMagicka:3,eligible:combined>=3&&counts.magicka>=3};
}
// The magic–tech axis, matching Syntarion's Magic | Tech slider (−4 Magic … +4 Tech, 0.25 per purchase).
// Magicka purchases pull toward Magic, Ingenium toward Tech. Nihimence is not tech, but it leans the needle Tech-ward at half an Ingenium step (user, October 29).
// Null purchases pull the needle back toward Neutral by a full step each, never past it: the Voidpoint cancels both sides, and the meter shows what remains.
// Color: green or blue while one side is pure, shading toward purple as Magicka and Ingenium mix (Praethacy itself counts as mixing); amber when only Nihimence is held.
// The label never names Praethacy, which stays secret until revealed: it follows the needle (Magic favoured, Tech favoured, or Neutral when centered).
export const AXIS_STEP=0.25,AXIS_LIMIT=4;
const mixHex=(a,b,t)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
export function magicTechAxis(learned){const counts={magicka:0,ingenium:0,nihimence:0,praethacy:0},all=allUnlocks();let voided=0;for(const id of new Set(learned))if(all.has(id)){counts[id.split(':')[1]]++;if(classById(id.split(':')[0])?.secret)voided++;}
const color=id=>disciplines.find(d=>d.id===id).color,{magicka:m,ingenium:i,nihimence:n,praethacy:p}=counts;
const lean=AXIS_STEP*(i-m)+AXIS_STEP/2*(n-voided),settled=Math.sign(lean)*Math.max(0,Math.abs(lean)-AXIS_STEP*voided),value=Math.max(-AXIS_LIMIT,Math.min(AXIS_LIMIT,settled))+0;
if(!m&&!i&&!p)return {...counts,value,blend:0,mode:n?'nihimence':'unaligned',label:value<0?'Magic favoured':value>0?'Tech favoured':'Neutral',color:n?color('nihimence'):'#8d978a'};
const blend=Math.min(1,(Math.min(m,i)+p)/Math.max(m,i,p));const base=m>i?color('magicka'):i>m?color('ingenium'):color('praethacy');
const mode=blend>=0.5?'mixed':m>i?'magic':i>m?'tech':'mixed';
return {...counts,value,blend,mode,label:value<0?'Magic favoured':value>0?'Tech favoured':'Neutral',color:mixHex(base,color('praethacy'),blend)};}
// A map star stands for its calling's whole family: awakened once any family ability is learned, available while the family can advance, otherwise unexplored.
export function starState(rootId,learned,points=STARTING_POINTS){const family=classes.filter(c=>(c.rootId||c.id)===rootId);
if(learned.some(id=>family.some(c=>id.startsWith(`${c.id}:`))))return 'awakened';
return family.some(c=>classUnlocked(c,learned)&&canAdvance(c,learned,points))?'available':'unexplored';}
