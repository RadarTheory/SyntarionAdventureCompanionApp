import { useState, useMemo } from 'react';
import { COLORS } from './constants';
import { ALL_ITEMS } from "../data/items/allitems";

// ─── ITEM DATA ────────────────────────────────────────────────────────────────

const ITEMS = [
  // CURRENCY — Banking Instrument
  { category: 'Currency', type: 'Banking Instrument', name: 'Guild Credit Note', desc: 'A signed paper promising payment through a recognized guildhouse. Safer than coin but worthless if the issuing guild is disgraced.', tags: ['document','economy','faction'], meta: 'requirement: literacy or seal check' },
  { category: 'Currency', type: 'Banking Instrument', name: 'Temple Alms Token', desc: 'A sanctified charity token redeemable for food, healing, or shelter at participating shrines.', tags: ['divine','aid','token'], meta: 'restriction: shrine network' },
  { category: 'Currency', type: 'Banking Instrument', name: 'Mercenary Blood Bond', desc: 'A pay certificate issued to soldiers after dangerous service. Often bought at a discount by speculators.', tags: ['military','contract','risky'], meta: 'effect: delayed payment' },
  { category: 'Currency', type: 'Banking Instrument', name: 'Port Authority Tallystick', desc: 'A notched stick split between shipmaster and dock clerk. Matching halves prove cargo taxes were paid.', tags: ['legal','port','trade'], meta: 'requirement: matching half' },
  // CURRENCY — Counterfeit/Curiosity
  { category: 'Currency', type: 'Counterfeit/Curiosity', name: 'Washed Crown', desc: 'A real gold coin chemically stripped and restamped by a crooked mint. Hard to detect without acid or a scale.', tags: ['counterfeit','intrigue'], meta: 'check: appraisal' },
  // CURRENCY — Regional Currency
  { category: 'Currency', type: 'Regional Currency', name: 'Avali Azerheim Bead', desc: 'A carved songbird bead strung in counted cords. Recognized by Avali enclaves and caravan factors.', tags: ['race','barter','cultural'], meta: 'exchange: regional' },
  { category: 'Currency', type: 'Regional Currency', name: 'Taer-anari Bone Shilling', desc: 'A polished bone token etched with pack lineage. It carries social meaning as much as monetary value.', tags: ['race','token','oath'], meta: 'exchange: clan dependent' },
  { category: 'Currency', type: 'Regional Currency', name: 'Cath-Vari Djezet', desc: 'A slim crescent coin used in feline courts and spice markets. Its edge pattern helps detect forged pieces by touch.', tags: ['race','trade','tactile'], meta: 'exchange: regional' },
  { category: 'Currency', type: 'Regional Currency', name: 'Telari Elysian', desc: 'A luminous ceremonial coin used in temple offerings and high diplomacy. Some glow faintly under sacred flame.', tags: ['race','divine','prestige'], meta: 'exchange: temple favored' },
  { category: 'Currency', type: 'Regional Currency', name: 'Trinkling Gemfrag', desc: 'Tiny broken gem chips weighed in sealed vials. Popular among tinkers because value scales cleanly by mass.', tags: ['crafting','gem','divisible'], meta: 'exchange: weight based' },
  { category: 'Currency', type: 'Regional Currency', name: 'Hill Dwarf Gromril Ingot', desc: 'A thumb-sized ingot of stamped dwarf metal, accepted for bulk arms purchases and forge debts.', tags: ['dwarven','metal','trade'], meta: 'exchange: high trust' },
  { category: 'Currency', type: 'Regional Currency', name: 'Air Genasi Gust Rupee', desc: 'A light glassy coin suspended in a wire ring. It is valued in skyports and by weather-sail crews.', tags: ['elemental','air','travel'], meta: 'exchange: sky market' },
  { category: 'Currency', type: 'Regional Currency', name: "Pa'morph Harmony Credit", desc: 'A communal credit chit representing service owed within beast-folk settlements. Outsiders must earn trust before using it.', tags: ['social','credit','communal'], meta: 'exchange: reputation linked' },
  { category: 'Currency', type: 'Regional Currency', name: 'Kitsune Hihi-irokane Scale', desc: 'A red-gold scale token used in clever bargains, masked festivals, and illusionist guild payments.', tags: ['race','prestige','magic-adjacent'], meta: 'exchange: negotiated' },
  { category: 'Currency', type: 'Regional Currency', name: 'Aarakocra Horacalcum Ring', desc: 'A thin ring coin worn on cords or talons. Used for sky-route fees and messenger contracts.', tags: ['race','air','courier'], meta: 'exchange: regional' },
  // CURRENCY — Sovereign Coin
  { category: 'Currency', type: 'Sovereign Coin', name: 'Copper Mark', desc: 'The common street coin for bread, torch oil, tips, tolls, and cheap repairs. Often stamped by city mints and clipped by desperate hands.', tags: ['economy','common','trade'], meta: 'value: base minor coin' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Silver Writ', desc: 'A reliable middle coin accepted by soldiers, inns, ferrymen, and guild clerks. Useful for day wages and modest adventuring purchases.', tags: ['economy','standard'], meta: 'value: daily expense coin' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Electrum Span', desc: 'An older alloy coin used in border markets and noble ledgers. Some merchants discount it unless the mint mark is verified.', tags: ['economy','mixed','appraisal'], meta: 'value: variable exchange' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Gold Crown', desc: 'A high-trust coin used for arms, animals, bribes, and formal contracts. Counterfeiting one is usually a hanging crime.', tags: ['economy','high value'], meta: 'value: major coin' },
  { category: 'Currency', type: 'Sovereign Coin', name: 'Platinum Sovereign', desc: 'A heavy reserve coin used by banks, temples, war offices, and crown agents. Rarely used in open markets.', tags: ['economy','reserve','rare'], meta: 'value: large settlement' },

  // WEAPONS — Axe
  { category: 'Weapons', type: 'Axe', name: 'Hand Axe', desc: 'A compact chopping weapon that doubles as a camp tool. Easy to carry, throw, and replace.', tags: ['thrown','utility'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Axe', name: 'War Axe', desc: 'A soldier-grade axe with a reinforced bit and back spike. Built to split shields and helmets.', tags: ['martial','armor pressure'], meta: 'damage: slashing/piercing' },
  { category: 'Weapons', type: 'Axe', name: 'Bearded Axe', desc: 'A hooked lower blade used to pull shields, snag limbs, and control weapon arms.', tags: ['control','martial'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Axe', name: 'Greataxe', desc: 'A massive two-handed axe for shock troops and marauder boarders. It rewards strength and nerve.', tags: ['heavy','brutal'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Axe', name: 'Boarding Axe', desc: 'A short axe with a pick and rope notch. Favored by pirates for ship fights, doors, and rigging.', tags: ['pirate','utility','shipboard'], meta: 'damage: slashing/piercing' },
  // WEAPONS — Blade
  { category: 'Weapons', type: 'Blade', name: 'Arming Sword', desc: 'A balanced one-handed sword for soldiers, guards, and duelists. Reliable with shield work and close formation fighting.', tags: ['damage','martial','versatile'], meta: 'damage: slashing; hand: one' },
  { category: 'Weapons', type: 'Blade', name: 'Longsword', desc: 'A knightly blade with enough grip for one or two hands. Favored when reach, leverage, and tradition matter.', tags: ['damage','martial'], meta: 'damage: slashing; hand: one/two' },
  { category: 'Weapons', type: 'Blade', name: 'Backsword', desc: 'A single-edged sword with a sturdy spine. Built for hard parries, chopping cuts, and rough campaign use.', tags: ['damage','durable'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Blade', name: 'Estoc', desc: 'A narrow thrusting sword designed to punch through mail gaps and armor joints. Poor at cutting but precise.', tags: ['piercing','armor counter'], meta: 'damage: piercing' },
  { category: 'Weapons', type: 'Blade', name: 'Falchion', desc: 'A broad forward-weighted blade that bites through cloth, leather, and exposed limbs. Brutal in cramped melee.', tags: ['damage','cleaving'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Blade', name: 'Saber', desc: 'A curved cavalry blade made for draw-cuts from motion. Common among scouts, officers, and raiders.', tags: ['mounted','finesse'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Blade', name: 'Khopesh', desc: 'A hooked bronze-style blade useful for trapping shields and dragging enemies off balance.', tags: ['control','exotic'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Blade', name: 'Greatsword', desc: 'A two-handed sword requiring room and discipline. It threatens multiple foes with sweeping cuts.', tags: ['heavy','martial'], meta: 'damage: slashing; hand: two' },
  { category: 'Weapons', type: 'Blade', name: 'Executioner Cleaver', desc: 'A grim heavy blade adapted from headsman tools. Terrifying, slow, and devastating on a committed strike.', tags: ['heavy','intimidation'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Blade', name: 'River Knife', desc: 'A flat utility knife favored by boat crews; it cuts rope cleanly and fits in a boot.', tags: ['supplemental','utility'], meta: 'metadata: flexible' },
  // WEAPONS — Firearm
  { category: 'Weapons', type: 'Firearm', name: 'Matchlock Pistol', desc: 'An early hand cannon with smoke, flash, and temperamental ignition. Powerful when kept dry and ready.', tags: ['firearm','loud','reload'], meta: 'damage: ballistic' },
  { category: 'Weapons', type: 'Firearm', name: 'Wheel-Lock Carbine', desc: 'A compact firearm carried by scouts and officers. More reliable than matchlocks but expensive to maintain.', tags: ['firearm','mounted'], meta: 'reload: moderate' },
  { category: 'Weapons', type: 'Firearm', name: 'Blackpowder Musket', desc: 'A long firearm with strong opening force. Smoke reveals the shooter and rain can ruin the charge.', tags: ['firearm','loud'], meta: 'range: long' },
  { category: 'Weapons', type: 'Firearm', name: 'Duckfoot Pistol', desc: 'A multi-barreled pistol that sprays several shots in a fan. Terrible at precision, excellent in a boarding crush.', tags: ['firearm','pirate','cone'], meta: 'effect: spread shot' },
  { category: 'Weapons', type: 'Firearm', name: 'Rune-Iron Pepperbox', desc: 'A rotating multi-shot pistol whose cylinder must be carefully cleaned. A favorite among rich duelists.', tags: ['firearm','rare','reload'], meta: 'shots: multiple' },
  { category: 'Weapons', type: 'Firearm', name: 'Deck Sweeper', desc: 'A brutal short firearm used by marauders to clear rails and ladders.', tags: ['supplemental','pirate'], meta: 'metadata: flexible' },
  // WEAPONS — Mace/Hammer
  { category: 'Weapons', type: 'Mace/Hammer', name: 'Cudgel', desc: 'A cheap club used by mobs, watchmen, and travelers. It is humble, quiet, and effective against bone.', tags: ['simple','bludgeoning'], meta: 'damage: bludgeoning' },
  { category: 'Weapons', type: 'Mace/Hammer', name: 'Flanged Mace', desc: 'A metal mace whose flanges focus impact through armor. A classic answer to plate and mail.', tags: ['armor counter','martial'], meta: 'damage: bludgeoning' },
  { category: 'Weapons', type: 'Mace/Hammer', name: 'Morning Hammer', desc: 'A compact hammer with a crowned striking head. Useful for breaking locks, bones, and shield rims.', tags: ['utility','armor counter'], meta: 'damage: bludgeoning' },
  { category: 'Weapons', type: 'Mace/Hammer', name: 'Maul', desc: 'A two-handed crushing weapon requiring commitment. Excellent against barricades, undead, and armored foes.', tags: ['heavy','breaker'], meta: 'damage: bludgeoning' },
  { category: 'Weapons', type: 'Mace/Hammer', name: 'Chain Flail', desc: 'A handled chain weapon that wraps shields and punishes predictable guards. Dangerous to untrained users.', tags: ['control','risky'], meta: 'damage: bludgeoning' },
  // WEAPONS — Polearm
  { category: 'Weapons', type: 'Polearm', name: 'Spear', desc: 'The universal battlefield weapon. Cheap, flexible, and deadly when held in a disciplined line.', tags: ['reach','thrown'], meta: 'damage: piercing' },
  { category: 'Weapons', type: 'Polearm', name: 'Glaive', desc: 'A long cutting blade on a pole, ideal for keeping foes at distance and cutting from the second rank.', tags: ['reach','martial'], meta: 'damage: slashing' },
  { category: 'Weapons', type: 'Polearm', name: 'Halberd', desc: 'An axe, hook, and spear point combined for soldiers who expect cavalry, armor, and shield walls.', tags: ['reach','control'], meta: 'damage: slashing/piercing' },
  { category: 'Weapons', type: 'Polearm', name: 'Boar Spear', desc: 'A stout spear with cross lugs that stop a charging beast from running up the shaft.', tags: ['beast hunting','brace'], meta: 'damage: piercing' },
  { category: 'Weapons', type: 'Polearm', name: 'Pike', desc: 'An extremely long infantry spear. Nearly useless indoors, decisive against charges in open ground.', tags: ['reach','formation'], meta: 'damage: piercing' },
  { category: 'Weapons', type: 'Polearm', name: 'Gate Spear', desc: 'A short spear built for watch posts and narrow gates; its lugs stop shield rushes.', tags: ['supplemental','guard'], meta: 'metadata: flexible' },
  // WEAPONS — Ranged
  { category: 'Weapons', type: 'Ranged', name: 'Shortbow', desc: 'A compact bow for hunters, scouts, and mounted archers. Easy to carry through brush and ruins.', tags: ['ranged','ammunition'], meta: 'range: medium' },
  { category: 'Weapons', type: 'Ranged', name: 'Longbow', desc: 'A tall war bow requiring training and strength. It delivers deep shots at long distance.', tags: ['ranged','martial'], meta: 'range: long' },
  { category: 'Weapons', type: 'Ranged', name: 'Recurve Bow', desc: 'A powerful curved bow suitable for riders and skirmishers. Good performance in a shorter frame.', tags: ['ranged','mounted'], meta: 'range: medium-long' },
  { category: 'Weapons', type: 'Ranged', name: 'Light Crossbow', desc: 'A mechanical bow that is easy to aim and slow to reload. Favored by militias and caravan guards.', tags: ['ranged','reload'], meta: 'range: medium' },
  { category: 'Weapons', type: 'Ranged', name: 'Heavy Crossbow', desc: 'A heavy winched crossbow with armor-punching force. Slow, loud, and frighteningly direct.', tags: ['ranged','armor counter'], meta: 'range: long; reload: slow' },
  { category: 'Weapons', type: 'Ranged', name: 'Repeater Crossbow', desc: 'A levered crossbow that trades power for rapid follow-up shots. Excellent against swarms and ambushes.', tags: ['ranged','rapid'], meta: 'ammo: bolt magazine' },
  { category: 'Weapons', type: 'Ranged', name: 'Crescent Sling', desc: 'A reinforced sling that throws crescent lead shot around cover at short range.', tags: ['supplemental','ranged'], meta: 'metadata: flexible' },
  // WEAPONS — Special
  { category: 'Weapons', type: 'Special', name: 'Garrote Wire', desc: 'A silent strangling tool used by assassins and spies. Nearly useless in open fighting.', tags: ['stealth','restraint'], meta: 'requirement: surprise or grapple' },
  { category: 'Weapons', type: 'Special', name: 'Shield Hook', desc: 'A short hooked weapon designed to pull shields aside and open a target to allies.', tags: ['control','offhand'], meta: 'effect: guard disruption' },
  { category: 'Weapons', type: 'Special', name: 'Man-Catcher', desc: 'A pole weapon with a springing collar used to restrain dangerous prisoners, beasts, or spellcasters.', tags: ['control','capture'], meta: 'effect: restrain' },
  // WEAPONS — Thrown
  { category: 'Weapons', type: 'Thrown', name: 'Throwing Knife', desc: 'A balanced blade used for distractions, silent kills, and desperate close-range throws.', tags: ['thrown','concealable'], meta: 'damage: piercing' },
  { category: 'Weapons', type: 'Thrown', name: 'Javelin', desc: 'A light throwing spear used before closing into melee. Effective from ranks and horseback.', tags: ['thrown','piercing'], meta: 'range: medium' },
  { category: 'Weapons', type: 'Thrown', name: 'Weighted Net', desc: 'A rope net with lead or stone weights. It restrains targets without killing them.', tags: ['control','nonlethal'], meta: 'effect: restrain on hit' },

  // ARMOR — Heavy
  { category: 'Armor', type: 'Heavy', name: 'Splint Armor', desc: 'Vertical metal strips fixed to backing. Stiff, heavy, and affordable for serious infantry.', tags: ['defense','heavy'], meta: 'strength: required' },
  { category: 'Armor', type: 'Heavy', name: 'Banded Plate', desc: 'Heavy bands of metal over mail and padding. A campaign compromise between cost and protection.', tags: ['defense','heavy'], meta: 'stealth: penalty' },
  { category: 'Armor', type: 'Heavy', name: 'Full Plate Harness', desc: 'A fitted suit of articulated plates. Expensive, prestigious, and difficult to don without help.', tags: ['defense','elite'], meta: 'strength: required; cost: very high' },
  { category: 'Armor', type: 'Heavy', name: 'Siege Breaker Plate', desc: 'Reinforced plate with extra helm and shoulder protection. Built for doors, arrows, and falling stone.', tags: ['defense','heavy','siege'], meta: 'movement: reduced' },
  { category: 'Armor', type: 'Heavy', name: 'Abyssal Iron Harness', desc: 'Dark iron armor with heat-blackened plates. Intimidating, resilient, and culturally ominous.', tags: ['defense','rare'], meta: 'requirement: maintenance' },
  { category: 'Armor', type: 'Heavy', name: 'Gatewarden Plate', desc: 'Heavy town-watch plate built for holding doors and bridges rather than dueling.', tags: ['supplemental','defense'], meta: 'metadata: flexible' },
  // ARMOR — Light
  { category: 'Armor', type: 'Light', name: 'Quilted Gambeson', desc: 'Layered cloth armor that absorbs cuts and keeps metal from bruising the wearer. Cheap, hot, and practical.', tags: ['defense','light'], meta: 'AC: low; stealth: normal' },
  { category: 'Armor', type: 'Light', name: 'Boiled Leather Jack', desc: 'Hardened leather plates sewn to a flexible coat. Good for scouts who expect knives and teeth.', tags: ['defense','light'], meta: 'AC: low-mid' },
  { category: 'Armor', type: 'Light', name: 'Studded Brigandine Vest', desc: 'Small metal plates hidden under leather or cloth. Looks civilian until a blade strikes it.', tags: ['defense','concealed'], meta: 'AC: mid' },
  { category: 'Armor', type: 'Light', name: 'Reinforced Duelist Coat', desc: 'A tailored fighting coat with hidden ribs at the vitals. Built for agility and public respectability.', tags: ['defense','social'], meta: 'AC: mid' },
  { category: 'Armor', type: 'Light', name: 'Reedweave Vest', desc: 'A light vest woven from treated reeds; it floats briefly and resists swamp thorns.', tags: ['supplemental','light'], meta: 'metadata: flexible' },
  // ARMOR — Medium
  { category: 'Armor', type: 'Medium', name: 'Scale Shirt', desc: 'Overlapping metal scales sewn to backing. Noisy but dependable against slashes and arrows.', tags: ['defense','medium'], meta: 'stealth: penalty' },
  { category: 'Armor', type: 'Medium', name: 'Ring Mail Coat', desc: 'A heavy coat reinforced with metal rings. Easier to repair than chain, less complete in coverage.', tags: ['defense','repairable'], meta: 'AC: mid' },
  { category: 'Armor', type: 'Medium', name: 'Chain Hauberk', desc: 'Interlocked mail covering torso and thighs. Excellent against cuts, weaker against heavy impact.', tags: ['defense','medium'], meta: 'AC: mid-high' },
  { category: 'Armor', type: 'Medium', name: 'Lamellar Harness', desc: 'Small plates laced into rows. Popular with cavalry and eastern-style armies.', tags: ['defense','modular'], meta: 'repair: plate replacement' },
  { category: 'Armor', type: 'Medium', name: 'Breastplate and Buff Coat', desc: 'A metal breastplate worn over a thick coat. Favored by officers, musketeers, and duelists.', tags: ['defense','firearm era'], meta: 'AC: mid-high' },
  { category: 'Armor', type: 'Medium', name: 'Coin-Scale Harness', desc: 'Overlapping punched coins stitched as scales; protective and socially provocative.', tags: ['supplemental','medium'], meta: 'metadata: flexible' },
  // ARMOR — Protective Add-on
  { category: 'Armor', type: 'Protective Add-on', name: 'Coif', desc: 'A mail hood protecting neck and skull. Often worn beneath helmets or under travel cloaks.', tags: ['defense','head'], meta: 'slot: head' },
  { category: 'Armor', type: 'Protective Add-on', name: 'Great Helm', desc: 'A full war helm with narrow vision. Superb protection at the cost of awareness.', tags: ['defense','head'], meta: 'perception: penalty' },
  { category: 'Armor', type: 'Protective Add-on', name: 'Bracers of Steel', desc: 'Forearm guards that catch blades and protect wrists during climbing and shield work.', tags: ['defense','limb'], meta: 'slot: arms' },
  { category: 'Armor', type: 'Protective Add-on', name: 'Greaves', desc: 'Leg guards that prevent crippling cuts and bites. Useful against low creatures and battlefield debris.', tags: ['defense','limb'], meta: 'slot: legs' },
  { category: 'Armor', type: 'Protective Add-on', name: 'Alchemist Fireproof Apron', desc: 'A treated apron that reduces burns from sparks, acids, and workshop accidents.', tags: ['defense','crafting'], meta: 'resist: minor fire/acid' },
  // ARMOR — Shield
  { category: 'Armor', type: 'Shield', name: 'Buckler', desc: 'A small fist shield used by duelists. It protects the hand and creates openings without slowing movement.', tags: ['defense','offhand'], meta: 'bonus: small' },
  { category: 'Armor', type: 'Shield', name: 'Round Shield', desc: 'A broad wooden or metal-rimmed shield used by raiders and guards. Easy to carry and repair.', tags: ['defense','common'], meta: 'bonus: standard' },
  { category: 'Armor', type: 'Shield', name: 'Heater Shield', desc: 'A knightly shield with strong coverage against arrows and melee. Often painted with heraldry.', tags: ['defense','heraldic'], meta: 'bonus: standard' },
  { category: 'Armor', type: 'Shield', name: 'Tower Shield', desc: 'A tall shield that can shelter most of the body. Bulky, slow, and excellent in formations.', tags: ['defense','cover'], meta: 'movement: reduced' },
  { category: 'Armor', type: 'Shield', name: 'Gunshield', desc: 'A heavy shield with a firing rest or small port. Used by siege crews and paranoid inventors.', tags: ['defense','firearm','cover'], meta: 'requires: strength' },
  { category: 'Armor', type: 'Shield', name: 'Lantern Shield', desc: 'A shield fitted with a protected lamp, useful in mines and night patrols.', tags: ['supplemental','defense'], meta: 'metadata: flexible' },

  // GEAR — Camp
  { category: 'Gear', type: 'Camp', name: 'Bedroll', desc: 'A padded roll for sleep on cold ground. Prevents exhaustion better than bravado does.', tags: ['camping','rest'], meta: 'slot: pack' },
  { category: 'Gear', type: 'Camp', name: 'Waxed Tarp', desc: 'A waterproof sheet for shelter, cargo cover, rain catch, and emergency stretcher work.', tags: ['camping','weather'], meta: 'size: medium' },
  { category: 'Gear', type: 'Camp', name: 'Fire Kit', desc: 'Flint, steel, tinder, and charcoal cloth in a dry case. Essential when magic is unavailable.', tags: ['survival','fire'], meta: 'uses: many' },
  { category: 'Gear', type: 'Camp', name: 'Iron Cookpot', desc: 'A blackened pot for stew, dye, boiling water, and questionable field medicine.', tags: ['camping','cooking'], meta: 'weight: heavy' },
  { category: 'Gear', type: 'Camp', name: 'Travel Kettle', desc: 'A smaller pot with a locking lid. Good for tea, sterilizing needles, and melting snow.', tags: ['camping','cooking'], meta: 'weight: light' },
  { category: 'Gear', type: 'Camp', name: 'Folding Stool', desc: 'A light camp stool that keeps nobles, scribes, and wounded adventurers out of the mud.', tags: ['comfort','camp'], meta: 'bulk: low' },
  // GEAR — Containers
  { category: 'Gear', type: 'Containers', name: 'Oilskin Satchel', desc: 'A waterproof shoulder bag for documents, herbs, and powder. Floats briefly if sealed with air.', tags: ['container','waterproof'], meta: 'capacity: small' },
  { category: 'Gear', type: 'Containers', name: 'Bandolier', desc: 'A chest strap with loops for vials, cartridges, knives, or scroll tubes. Keeps items ready.', tags: ['inventory','quickdraw'], meta: 'slots: small items' },
  { category: 'Gear', type: 'Containers', name: 'Hidden Boot Sheath', desc: 'A concealed sheath for a knife, letter, lockpick, or narrow wand. Uncomfortable but useful.', tags: ['concealed','storage'], meta: 'capacity: tiny' },
  // GEAR — Exploration
  { category: 'Gear', type: 'Exploration', name: 'Silk Rope', desc: 'Strong light rope that packs small and resists rot. Expensive enough that thieves cut it when stealing from climbers.', tags: ['utility','climbing'], meta: 'length: 50 ft' },
  { category: 'Gear', type: 'Exploration', name: 'Hemp Rope', desc: 'Cheap reliable rope for hauling, binding, and camp work. Heavy when wet.', tags: ['utility','common'], meta: 'length: 50 ft' },
  { category: 'Gear', type: 'Exploration', name: 'Grappling Hook', desc: 'A hooked iron anchor for walls, branches, ship rails, and ruin ledges. Loud if thrown carelessly.', tags: ['climbing','tool'], meta: 'requires: rope' },
  { category: 'Gear', type: 'Exploration', name: 'Collapsible Pole', desc: 'A segmented pole for probing floors, vault ceilings, and suspicious pools. Also useful for tents.', tags: ['trap','exploration'], meta: 'reach: extended' },
  { category: 'Gear', type: 'Exploration', name: 'Chalk Line Reel', desc: 'A chalked cord for marking straight paths, measuring rooms, and revealing air currents.', tags: ['mapping','trap'], meta: 'uses: many' },
  { category: 'Gear', type: 'Exploration', name: 'Pitons and Hammer', desc: 'Iron spikes and a small hammer used to secure climbs or wedge doors. Slow but dependable.', tags: ['climbing','dungeon'], meta: 'noise: loud' },
  { category: 'Gear', type: 'Exploration', name: 'Surveyor Compass', desc: 'A directional compass with a sighting notch. Helps map wilderness routes and underground headings.', tags: ['navigation','mapping'], meta: 'requirement: magnetism stable' },
  { category: 'Gear', type: 'Exploration', name: 'Folding Shovel', desc: 'A compact entrenching tool for camp latrines, graves, firepits, and digging under walls.', tags: ['survival','tool'], meta: 'weight: moderate' },
  { category: 'Gear', type: 'Exploration', name: 'Cave Mirror', desc: 'A small polished steel mirror on a rod. Used to see around corners or signal in sunlight.', tags: ['scouting','stealth'], meta: 'fragile: low' },
  { category: 'Gear', type: 'Exploration', name: 'Depth Knotted Cord', desc: 'A measured cord with knots for wells, cliffs, and flooded chambers.', tags: ['supplemental','exploration'], meta: 'metadata: flexible' },
  // GEAR — Investigation
  { category: 'Gear', type: 'Investigation', name: 'Dusting Powder', desc: 'Fine powder that reveals fingerprints, seams, and recent handling.', tags: ['supplemental','investigation'], meta: 'metadata: flexible' },
  // GEAR — Lighting
  { category: 'Gear', type: 'Lighting', name: 'Hooded Lantern', desc: 'A lantern with a shutter to hide or reveal its beam. Standard dungeon equipment.', tags: ['light','exploration'], meta: 'fuel: oil' },
  { category: 'Gear', type: 'Lighting', name: 'Bullseye Lantern', desc: 'A focused lantern projecting light in a narrow path. Good for watches, mines, and signals.', tags: ['light','signal'], meta: 'fuel: oil' },
  { category: 'Gear', type: 'Lighting', name: 'Blueglass Lamp', desc: 'A filtered lamp that preserves night vision and reveals some inks. Dim but discreet.', tags: ['light','investigation'], meta: 'fuel: oil' },
  // GEAR — Survival
  { category: 'Gear', type: 'Survival', name: 'Water Purse', desc: 'A treated water bladder with a charcoal plug. Reduces bad taste and some illness risks.', tags: ['survival','water'], meta: 'capacity: daily' },
  { category: 'Gear', type: 'Survival', name: 'Snare Wire', desc: 'Thin wire for traps, repairs, alarms, and field improvisation. A favorite of patient hunters.', tags: ['survival','trap'], meta: 'uses: expendable' },
  { category: 'Gear', type: 'Survival', name: 'Rain Catch Funnel', desc: 'A folding funnel that feeds clean rain into skins or jars.', tags: ['supplemental','survival'], meta: 'metadata: flexible' },
  // GEAR — Tool
  { category: 'Gear', type: 'Tool', name: 'Wax Seal Kit', desc: 'A small kit for sealing letters, bottles, and evidence bags with marked wax.', tags: ['supplemental','tool'], meta: 'metadata: flexible' },
  { category: 'Gear', type: 'Tools', name: 'Thieves Picks', desc: 'Slim picks, tension bars, wedges, and wire probes for locks and fine mechanisms.', tags: ['tool','lock','rogue'], meta: 'requires: proficiency' },
  { category: 'Gear', type: 'Tools', name: 'Smiths Roll', desc: 'Tongs, small files, punch, rivets, and a field hammer for emergency metal repairs.', tags: ['tool','repair'], meta: 'requires: forge for major work' },
  { category: 'Gear', type: 'Tools', name: 'Healers Satchel', desc: 'Bandages, splints, needles, salves, and boiled thread. Stabilizes wounds without invoking miracles.', tags: ['tool','medicine'], meta: 'uses: restocked' },
  { category: 'Gear', type: 'Tools', name: 'Disguise Case', desc: 'Wigs, wax, pigments, false scars, and posture notes. The best disguise changes behavior too.', tags: ['social','stealth'], meta: 'requires: time' },
  { category: 'Gear', type: 'Tools', name: 'Cartographers Case', desc: 'Vellum sheets, charcoal, rulers, wax markers, and waterproof tubes for mapmaking.', tags: ['mapping','knowledge'], meta: 'output: maps' },
  { category: 'Gear', type: 'Tools', name: 'Engineers Rule', desc: 'A folding rule etched with angles and load marks. Useful for bridges, siegeworks, and invention frames.', tags: ['engineering','schematic'], meta: 'requirement: literacy' },
  { category: 'Gear', type: 'Tools', name: 'Glasscutters Wheel', desc: 'A hardened wheel used to score window glass or cut sample panes. Quiet only in skilled hands.', tags: ['infiltration','tool'], meta: 'check: dexterity' },

  // PACKS
  { category: 'Packs', type: 'Faction', name: 'Guild Factor Pack', desc: 'Ledger folio, sample weights, stamp pad, counterfeit needle, and contract ribbons.', tags: ['bundle','commerce'], meta: 'contents: trade tools' },
  { category: 'Packs', type: 'Faction', name: 'Temple Pilgrim Pack', desc: 'Travel shrine, alms bowl, prayer cord, oil flask, and route blessings written on cloth.', tags: ['bundle','faith'], meta: 'contents: pilgrimage tools' },
  { category: 'Packs', type: 'Regional', name: 'Desert Pack', desc: 'Sun veil, water purse, salt tablets, sand pegs, shade tarp, and glass goggles.', tags: ['bundle','desert'], meta: 'contents: heat survival' },
  { category: 'Packs', type: 'Regional', name: 'Arctic Pack', desc: 'Fur liner, snow goggles, crampons, seal-fat tin, firestarter case, and insulated bottle.', tags: ['bundle','cold'], meta: 'contents: frost survival' },
  { category: 'Packs', type: 'Regional', name: 'Swamp Pack', desc: 'Leech salt, mosquito veil, mud boards, rotproof rope, water filter, and fungus guide.', tags: ['bundle','swamp'], meta: 'contents: wetland survival' },
  { category: 'Packs', type: 'Regional', name: 'Skyport Pack', desc: 'Ring harness, wind goggles, tether hooks, signal scarf, and altitude salts.', tags: ['bundle','air travel'], meta: 'contents: aerial safety' },
  { category: 'Packs', type: 'Specialist', name: 'Alchemists Field Pack', desc: 'Vial rack, heat dish, corks, gloves, filters, and neutralizing sand. Designed to fail less violently.', tags: ['bundle','alchemy'], meta: 'contents: lab basics' },
  { category: 'Packs', type: 'Specialist', name: 'Gunsmiths Pack', desc: 'Cleaning rod, oil, powder measure, spare springs, flints, and patch cloth. Mandatory for serious firearms.', tags: ['bundle','firearm'], meta: 'contents: maintenance tools' },
  { category: 'Packs', type: 'Specialist', name: 'Cartographers Pack', desc: 'Compass, measuring cord, charcoal, waterproof map case, grid sheets, and colored pins.', tags: ['bundle','navigation'], meta: 'contents: mapmaking tools' },
  { category: 'Packs', type: 'Specialist', name: 'Diplomats Pack', desc: 'Fine paper, gift ribbons, seal blanks, etiquette cards, and a clean change of gloves.', tags: ['bundle','social'], meta: 'contents: negotiation tools' },
  { category: 'Packs', type: 'Specialist', name: 'Sailors Pack', desc: 'Tarred cord, marlinspike, waxed pouch, signal flags, fishhooks, and deck shoes.', tags: ['bundle','shipboard'], meta: 'contents: maritime tools' },
  { category: 'Packs', type: 'Specialist', name: 'Monster-Hunters Pack', desc: 'Silver filings, garlic cord, mirror, shackles, field stakes, bait cage, and specimen jars.', tags: ['bundle','hunting'], meta: 'contents: creature countermeasures' },
  { category: 'Packs', type: 'Starter', name: 'Dungeoneer Pack', desc: 'Rope, pitons, chalk, rations, lantern oil, and tools for cramped underground work.', tags: ['bundle','dungeon'], meta: 'contents: exploration basics' },
  { category: 'Packs', type: 'Starter', name: 'Explorer Pack', desc: 'Bedroll, tarp, fire kit, rations, compass, and water gear. Built for wilderness travel over comfort.', tags: ['bundle','wilderness'], meta: 'contents: travel basics' },
  { category: 'Packs', type: 'Starter', name: 'Scholars Pack', desc: 'Ink, quills, paper, sealing wax, reference tabs, and a small lamp. Made for people who survive by noticing details.', tags: ['bundle','knowledge'], meta: 'contents: writing tools' },
  { category: 'Packs', type: 'Starter', name: 'Priests Pack', desc: 'Alms tokens, incense, vestment cord, candles, holy text sheets, and a simple reliquary box.', tags: ['bundle','divine'], meta: 'contents: worship tools' },
  { category: 'Packs', type: 'Starter', name: 'Burglars Pack', desc: 'Dark cloth, glass wheel, wedges, mirror rod, soft shoes, and spare lockpicks. Suspicious by design.', tags: ['bundle','stealth'], meta: 'contents: infiltration tools' },
  { category: 'Packs', type: 'Starter', name: 'Soldiers Pack', desc: 'Repair kit, whetstone, mess tin, spare straps, signal whistle, and marching rations. Military plainness.', tags: ['bundle','martial'], meta: 'contents: campaign tools' },

  // MOUNTS
  { category: 'Mounts', type: 'Aquatic', name: 'River Hippocamp', desc: 'A horse-like aquatic mount used in river kingdoms and flooded ruins. Awkward on land.', tags: ['mount','aquatic'], meta: 'terrain: water' },
  { category: 'Mounts', type: 'Aquatic', name: 'Reef Strider', desc: 'A broad-finned riding beast for shallow seas and coral passages. Gentle unless injured.', tags: ['mount','aquatic'], meta: 'terrain: coast' },
  { category: 'Mounts', type: 'Exotic', name: 'Giant Lizard', desc: 'A wall-clinging reptile mount for caverns, ruins, and humid cliffs. Slow in cold weather.', tags: ['mount','climb'], meta: 'terrain: cave' },
  { category: 'Mounts', type: 'Exotic', name: 'Dire Goat', desc: 'A mountain mount that leaps ledges and headbutts threats. Surprisingly loyal if fed salt.', tags: ['mount','mountain'], meta: 'terrain: cliff' },
  { category: 'Mounts', type: 'Exotic', name: 'Shellback Tortoise', desc: 'A slow armored cargo beast used by caravans. It carries tents, barrels, and patient riders.', tags: ['mount','cargo'], meta: 'speed: slow; capacity: very high' },
  { category: 'Mounts', type: 'Flying', name: 'Giant Hawk', desc: 'A swift aerial mount for light riders and urgent messages. Requires careful bonding and open launch space.', tags: ['mount','flying'], meta: 'capacity: light' },
  { category: 'Mounts', type: 'Flying', name: 'Wyvern Tackling Drake', desc: 'A dangerous winged reptile trained for short flights and intimidation. Not suitable for polite towns.', tags: ['mount','flying','combat'], meta: 'risk: high' },
  { category: 'Mounts', type: 'Land', name: 'Riding Horse', desc: 'A trained travel horse with steady nerves and moderate speed. Best on roads and open country.', tags: ['mount','travel'], meta: 'speed: fast; terrain: road' },
  { category: 'Mounts', type: 'Land', name: 'Warhorse', desc: 'A disciplined battle horse trained to ignore blood, shouting, and armor noise. Expensive to feed and replace.', tags: ['mount','combat'], meta: 'morale: high' },
  { category: 'Mounts', type: 'Land', name: 'Pony', desc: 'A small hardy mount for narrow paths, mines, and small riders. Slower but stubbornly dependable.', tags: ['mount','small'], meta: 'terrain: rough' },
  { category: 'Mounts', type: 'Land', name: 'Mule', desc: 'A sure-footed pack animal that survives bad roads and worse owners. Excellent cargo value.', tags: ['mount','cargo'], meta: 'capacity: high' },
  { category: 'Mounts', type: 'Land', name: 'Camel', desc: 'A desert beast that conserves water and tolerates heat. Unfriendly to the uninitiated.', tags: ['mount','desert'], meta: 'terrain: sand' },
  { category: 'Mounts', type: 'Land', name: 'Elk Charger', desc: 'A tall forest mount used by northern scouts and noble hunters. Fast through woods, nervous in cities.', tags: ['mount','forest'], meta: 'terrain: woodland' },
  { category: 'Mounts', type: 'Land', name: 'Great Boar', desc: 'A tusked war mount with a low center of gravity. Difficult to control but devastating on a charge.', tags: ['mount','combat'], meta: 'trait: charge' },
  { category: 'Mounts', type: 'Land', name: 'Axebeak Runner', desc: 'A flightless bird mount with a snapping beak and rapid stride. Common among plains messengers.', tags: ['mount','fast'], meta: 'terrain: plains' },

  // FAMILIARS
  { category: 'Familiars', type: 'Beast', name: 'Black Cat Familiar', desc: 'A quiet companion suited to stealth, night watches, and suspicious alleys. It notices movement before people do.', tags: ['familiar','stealth'], meta: 'sense: night' },
  { category: 'Familiars', type: 'Beast', name: 'Raven Familiar', desc: 'A clever bird that mimics sounds, retrieves small objects, and watches from rooftops.', tags: ['familiar','scouting'], meta: 'flight: yes' },
  { category: 'Familiars', type: 'Beast', name: 'Barn Owl Familiar', desc: 'A silent flyer that excels at nocturnal scouting and listening from rafters.', tags: ['familiar','scouting'], meta: 'sense: hearing' },
  { category: 'Familiars', type: 'Beast', name: 'Silver Ferret Familiar', desc: 'A nimble thief of keys, rings, and unsecured snacks. Excellent in vents and sleeves.', tags: ['familiar','infiltration'], meta: 'size: tiny' },
  { category: 'Familiars', type: 'Beast', name: 'Glass-Eyed Toad', desc: 'A patient swamp familiar that detects insects, damp air, and certain poisons by taste.', tags: ['familiar','poison'], meta: 'terrain: swamp' },
  { category: 'Familiars', type: 'Beast', name: 'Clock Mouse', desc: 'A tiny trained mouse that runs routes, triggers small levers, and hides in machinery.', tags: ['familiar','mechanism'], meta: 'size: tiny' },
  { category: 'Familiars', type: 'Construct', name: 'Brass Scarab', desc: 'A wind-up beetle that maps floors by clicking its feet. Can carry a thread through narrow gaps.', tags: ['familiar','construct'], meta: 'power: wound spring' },
  { category: 'Familiars', type: 'Construct', name: 'Lens Spider', desc: 'A delicate mechanical spider with a glass eye for peeking under doors and through cracks.', tags: ['familiar','scouting'], meta: 'fragile: high' },
  { category: 'Familiars', type: 'Construct', name: 'Paper Crane Scout', desc: 'A folded paper construct that glides silently and returns with impressions pressed into its wings.', tags: ['familiar','message'], meta: 'duration: limited' },
  { category: 'Familiars', type: 'Magical', name: 'Moonlit Minnow', desc: 'A floating fish-like familiar that swims through air near water sources and glows in darkness.', tags: ['familiar','magic'], meta: 'light: soft' },
  { category: 'Familiars', type: 'Magical', name: 'Thorn Pup', desc: 'A tiny plant-hound that sniffs trails, roots in soil, and growls at axes.', tags: ['familiar','nature'], meta: 'terrain: woodland' },
  { category: 'Familiars', type: 'Spirit', name: 'Candle Imp', desc: 'A palm-sized spirit that tends flames, whispers rude advice, and hates rain.', tags: ['familiar','fire','spirit'], meta: 'light: minor' },
  { category: 'Familiars', type: 'Spirit', name: 'Ink Wisp', desc: 'A floating blot of animate ink that points toward writing, signatures, and spilled secrets.', tags: ['familiar','knowledge'], meta: 'detect: writing' },
  { category: 'Familiars', type: 'Spirit', name: 'Grave Moth', desc: 'A pale moth that gathers near burial sites and dying embers. Used by mourners and necromancers alike.', tags: ['familiar','death'], meta: 'sense: remains' },
  { category: 'Familiars', type: 'Spirit', name: 'Hearth Sprite', desc: 'A small domestic spirit that guards sleep, warms tea, and complains about poor manners.', tags: ['familiar','protection'], meta: 'domain: camp' },

  // VEHICLES
  { category: 'Vehicles', type: 'Air', name: 'Sky Skiff', desc: 'A small lift-rigged craft for short hops between towers, cliffs, and sky docks. Weather-sensitive.', tags: ['vehicle','air'], meta: 'crew: 1-3' },
  { category: 'Vehicles', type: 'Air', name: 'Balloon Barge', desc: 'A gasbag-supported cargo platform. Slow, visible, and useful where roads do not exist.', tags: ['vehicle','air','cargo'], meta: 'speed: slow' },
  { category: 'Vehicles', type: 'Air', name: 'Glider Frame', desc: 'A collapsible glider for descending from heights. It does not make cowards brave.', tags: ['vehicle','air'], meta: 'requirement: height' },
  { category: 'Vehicles', type: 'Land', name: 'Handcart', desc: 'A two-wheeled cart pulled by hand. Cheap, noisy, and perfect for loot until stairs appear.', tags: ['vehicle','cargo'], meta: 'crew: 1' },
  { category: 'Vehicles', type: 'Land', name: 'Mule Wagon', desc: 'A practical cargo wagon for roads and settlements. Breaks axles when driven like a war chariot.', tags: ['vehicle','cargo'], meta: 'crew: 1; pull: animal' },
  { category: 'Vehicles', type: 'Land', name: 'Covered Coach', desc: 'A passenger coach with weather cover and storage. A mobile stage for ambushes and intrigue.', tags: ['vehicle','travel'], meta: 'crew: driver' },
  { category: 'Vehicles', type: 'Land', name: 'War Chariot', desc: 'A fast fighting platform for open ground. Terrifying in formation, foolish in forests.', tags: ['vehicle','combat'], meta: 'terrain: open' },
  { category: 'Vehicles', type: 'Land', name: 'Siege Sled', desc: 'A reinforced sled dragged across mud, snow, or battlefield rubble with heavy tools aboard.', tags: ['vehicle','siege'], meta: 'speed: slow' },
  { category: 'Vehicles', type: 'Special', name: 'Clockwork Tram Cart', desc: 'A rail-bound cart powered by wound gears or fuel cells. Excellent in mines and academies.', tags: ['vehicle','tech'], meta: 'requires: track' },
  { category: 'Vehicles', type: 'Special', name: 'Submersible Bell', desc: 'A weighted diving bell for salvage and underwater entry. Claustrophobic but effective.', tags: ['vehicle','aquatic','tech'], meta: 'crew: small' },
  { category: 'Vehicles', type: 'Water', name: 'Rowboat', desc: 'A small boat for rivers, harbors, and quiet escapes. Carries little but draws almost no attention.', tags: ['vehicle','water'], meta: 'crew: 1-2' },
  { category: 'Vehicles', type: 'Water', name: 'Keelboat', desc: 'A sturdy river cargo craft with shallow draft. Good for trade routes and inland campaigns.', tags: ['vehicle','cargo','water'], meta: 'crew: small' },
  { category: 'Vehicles', type: 'Water', name: 'Fishing Smack', desc: 'A coastal sailboat that can pass as harmless while moving people or contraband.', tags: ['vehicle','water','cover'], meta: 'cargo: modest' },
  { category: 'Vehicles', type: 'Water', name: 'Longboat', desc: 'A fast oared vessel for raids, landings, and rough seas. Popular with marauder crews.', tags: ['vehicle','pirate','water'], meta: 'crew: many' },
  { category: 'Vehicles', type: 'Water', name: 'Cog Merchantman', desc: 'A broad cargo ship used for sea trade. Slow to turn, profitable to protect or plunder.', tags: ['vehicle','cargo','sea'], meta: 'crew: large' },
  { category: 'Vehicles', type: 'Water', name: 'Privateer Sloop', desc: 'A nimble armed ship suited to raiding, scouting, and blockade running.', tags: ['vehicle','pirate','combat'], meta: 'crew: medium' },

  // TRADE GOODS
  { category: 'Trade Goods', type: 'Craft', name: 'Glass Rods', desc: 'Colored rods used by lampworkers, alchemists, and lens makers. Fragile cargo with good margins.', tags: ['trade','craft'], meta: 'unit: crate' },
  { category: 'Trade Goods', type: 'Craft', name: 'Beeswax Slabs', desc: 'Wax for candles, seals, waterproofing, and delicate molds. Temples buy it constantly.', tags: ['trade','craft'], meta: 'unit: slab' },
  { category: 'Trade Goods', type: 'Craft', name: 'Leather Hides', desc: 'Cured hides for armor, saddles, boots, bellows, and bookbinding.', tags: ['trade','craft'], meta: 'unit: bundle' },
  { category: 'Trade Goods', type: 'Craft', name: 'Fine Parchment', desc: 'Prepared writing skin for contracts, grimoires, maps, and royal orders.', tags: ['trade','document'], meta: 'unit: sheet bundle' },
  { category: 'Trade Goods', type: 'Food', name: 'Salt Brick', desc: 'Compressed salt used for preserving meat, paying remote workers, and appeasing pack animals.', tags: ['trade','food'], meta: 'unit: brick' },
  { category: 'Trade Goods', type: 'Food', name: 'Honey Jar', desc: 'Sealed honey that keeps for years and sweetens medicine, rations, and bribes.', tags: ['trade','food'], meta: 'unit: jar' },
  { category: 'Trade Goods', type: 'Food', name: 'Coffee Sack', desc: 'Roasted beans from southern routes. Valuable to officers, scribes, and sleepless watch crews.', tags: ['trade','luxury'], meta: 'unit: sack' },
  { category: 'Trade Goods', type: 'Food', name: 'Spice Casket', desc: 'A small locked box of pepper, saffron, clove, or stranger powders. More valuable than its weight suggests.', tags: ['trade','luxury'], meta: 'unit: casket' },
  { category: 'Trade Goods', type: 'Livestock', name: 'Goat Pair', desc: 'Hardy animals providing milk, meat, and noise. Easy to transport, difficult to keep out of tents.', tags: ['trade','livestock'], meta: 'unit: pair' },
  { category: 'Trade Goods', type: 'Livestock', name: 'Chicken Crate', desc: 'A crate of laying hens or traveling dinners. Also serves as an early warning system.', tags: ['trade','livestock'], meta: 'unit: crate' },
  { category: 'Trade Goods', type: 'Livestock', name: 'Ox Team', desc: 'Heavy draft animals for plowing, hauling, and dragging stuck wagons. Slow but powerful.', tags: ['trade','livestock'], meta: 'unit: team' },
  { category: 'Trade Goods', type: 'Luxury', name: 'Pearl String', desc: 'Matched pearls traded by coastal houses and noble jewelers. Often hidden inside garment hems.', tags: ['trade','luxury'], meta: 'unit: string' },
  { category: 'Trade Goods', type: 'Luxury', name: 'Incense Chest', desc: 'Resins, woods, and herbs burned in temples, courts, and funerals. Smell can reveal origin.', tags: ['trade','luxury'], meta: 'unit: chest' },
  { category: 'Trade Goods', type: 'Luxury', name: 'Blue Salt Crystal', desc: 'A rare mineral used in noble kitchens and minor preservation rites. Glittering, brittle, expensive.', tags: ['trade','rare'], meta: 'unit: crystal' },
  { category: 'Trade Goods', type: 'Raw Material', name: 'Iron Pig', desc: 'A raw iron ingot ready for forging. Heavy, honest, and always useful.', tags: ['trade','metal'], meta: 'unit: ingot' },
  { category: 'Trade Goods', type: 'Raw Material', name: 'Copper Bar', desc: 'A soft metal bar used for wiring, coinage, kettles, and alchemical apparatus.', tags: ['trade','metal'], meta: 'unit: bar' },
  { category: 'Trade Goods', type: 'Raw Material', name: 'Tin Bundle', desc: 'Tin rods used in bronze, solder, and household goods. Worth more where mines are scarce.', tags: ['trade','metal'], meta: 'unit: bundle' },
  { category: 'Trade Goods', type: 'Raw Material', name: 'Charcoal Sack', desc: 'Clean-burning charcoal for forges, kitchens, and field laboratories.', tags: ['trade','fuel'], meta: 'unit: sack' },
  { category: 'Trade Goods', type: 'Raw Material', name: 'Lumber Stack', desc: 'Seasoned planks suitable for carts, doors, repairs, and siege frames.', tags: ['trade','wood'], meta: 'unit: stack' },
  { category: 'Trade Goods', type: 'Raw Material', name: 'Stone Block', desc: 'Cut stone used for fortifications, shrines, bridges, and stubborn monuments.', tags: ['trade','construction'], meta: 'unit: block' },
  { category: 'Trade Goods', type: 'Textile', name: 'Linen Bolt', desc: 'A roll of clean linen for clothing, bandages, sails, and temple wrappings.', tags: ['trade','textile'], meta: 'unit: bolt' },
  { category: 'Trade Goods', type: 'Textile', name: 'Dyed Silk Roll', desc: 'Fine silk dyed in costly colors. Desired by courts, temples, and smugglers.', tags: ['trade','luxury'], meta: 'unit: roll' },
  { category: 'Trade Goods', type: 'Textile', name: 'Wool Bale', desc: 'Bulk wool used for cloaks, uniforms, blankets, and winter trade.', tags: ['trade','textile'], meta: 'unit: bale' },
  { category: 'Trade Goods', type: 'Textile', name: 'Spider-Silk Thread', desc: 'Rare strong thread harvested from giant spiders or careful farms. Used in armor, sutures, and traps.', tags: ['trade','rare'], meta: 'unit: spool' },

  // TRINKETS
  { category: 'Trinkets', type: 'Cultural', name: 'Avali Song Knot', desc: 'A knotted cord encoding a short melody. Avali can hum the message by reading the knots.', tags: ['flavor','race'], meta: 'effect: message' },
  { category: 'Trinkets', type: 'Cultural', name: 'Dwarf Debt Nail', desc: 'A bent iron nail given when a debt is acknowledged but not yet paid. Serious dwarves keep them.', tags: ['flavor','dwarven'], meta: 'effect: social obligation' },
  { category: 'Trinkets', type: 'Cultural', name: "Pa'morph Friendship Tag", desc: 'A carved tag exchanged after shared labor. It opens doors in certain beast-folk communities.', tags: ['flavor','social'], meta: 'effect: minor reputation' },
  { category: 'Trinkets', type: 'Cultural', name: 'Kitsune Mask Chip', desc: 'A shard from a festival mask. It may indicate a prank, a warning, or a courtship.', tags: ['flavor','social'], meta: 'effect: clue' },
  { category: 'Trinkets', type: 'Curiosity', name: 'Map Corner', desc: 'A torn map corner showing a bridge, a skull mark, and no scale. The ink resists water.', tags: ['flavor','map'], meta: 'effect: adventure seed' },
  { category: 'Trinkets', type: 'Curiosity', name: 'Sealed Red Seed', desc: 'A seed sealed in red wax. It rattles like a pebble and smells faintly of smoke.', tags: ['flavor','nature'], meta: 'effect: unknown' },
  { category: 'Trinkets', type: 'Keepsake', name: 'Cracked Locket', desc: 'A locket with one portrait scraped away. It hums faintly near the sea, though no enchantment is obvious.', tags: ['flavor','mystery'], meta: 'effect: story hook' },
  { category: 'Trinkets', type: 'Keepsake', name: 'Childs Wooden Knight', desc: 'A chipped toy knight with a painted shield. Its owner wrote a name under the base.', tags: ['flavor','sentimental'], meta: 'effect: story hook' },
  { category: 'Trinkets', type: 'Keepsake', name: 'Ribbon of Last Victory', desc: 'A faded ribbon taken from a battlefield standard. Veterans recognize the colors.', tags: ['flavor','military'], meta: 'effect: social clue' },
  { category: 'Trinkets', type: 'Oddity', name: 'Bottle of Still Rain', desc: 'A sealed vial containing rain that never moves, even when shaken. Alchemists argue about it.', tags: ['flavor','strange'], meta: 'effect: minor curiosity' },
  { category: 'Trinkets', type: 'Oddity', name: 'Coin with Two Suns', desc: 'A foreign coin stamped with twin suns and no ruler. Warm after sunrise.', tags: ['flavor','mystery'], meta: 'effect: clue' },
  { category: 'Trinkets', type: 'Oddity', name: 'Left-Handed Compass', desc: "A compass whose needle points west instead of north. Useless unless you know why.", tags: ['flavor','navigation'], meta: 'effect: puzzle' },
  { category: 'Trinkets', type: 'Oddity', name: 'Feather of Iron', desc: 'A feather that rings like metal when dropped. Too light for any known alloy.', tags: ['flavor','rare'], meta: 'effect: crafting clue' },
  { category: 'Trinkets', type: 'Oddity', name: 'Laughing Tooth', desc: 'A humanoid tooth that clicks when someone lies badly nearby. Not reliable enough for court.', tags: ['flavor','eerie'], meta: 'effect: minor lie hint' },
  { category: 'Trinkets', type: 'Puzzle', name: 'Glass Key Without Teeth', desc: 'A transparent key blank that fits no visible lock. It refracts moonlight into a map-like line.', tags: ['flavor','puzzle'], meta: 'effect: moon clue' },
  { category: 'Trinkets', type: 'Puzzle', name: 'Seven-Holed Button', desc: 'A bone button with seven holes but only six threads. Tailors refuse to mend it.', tags: ['flavor','curse-adjacent'], meta: 'effect: omen' },
  { category: 'Trinkets', type: 'Puzzle', name: 'Tin Soldier Missing Head', desc: 'A tiny soldier whose head reappears in a different pocket each dawn.', tags: ['flavor','oddity'], meta: 'effect: nuisance' },
  { category: 'Trinkets', type: 'Relic', name: "Saint's Broken Bead", desc: 'A bead from a ruined prayer chain. Pilgrims may offer shelter to its bearer.', tags: ['flavor','divine'], meta: 'effect: social' },
  { category: 'Trinkets', type: 'Relic', name: 'Ashen War Medal', desc: 'A blackened medal from a disgraced regiment. Wearing it invites questions or duels.', tags: ['flavor','faction'], meta: 'effect: reputation' },
  { category: 'Trinkets', type: 'Relic', name: 'Miniature Funeral Mask', desc: 'A thumb-sized mask placed on infants in an old burial custom. Grave priests notice it.', tags: ['flavor','death'], meta: 'effect: lore' },

  // CONSUMABLES
  { category: 'Consumables', type: 'Ammunition', name: 'Broadhead Arrows', desc: 'Hunting arrows with wide cutting heads. Better against flesh than armor.', tags: ['ammo','hunting'], meta: 'damage: bleed-prone' },
  { category: 'Consumables', type: 'Ammunition', name: 'Bodkin Bolts', desc: 'Narrow armor-piercing bolts made for mail and gaps in plate.', tags: ['ammo','armor counter'], meta: 'damage: piercing' },
  { category: 'Consumables', type: 'Ammunition', name: 'Signal Flares', desc: 'Bright burning cartridges or arrows used to mark positions or call aid.', tags: ['ammo','signal'], meta: 'visibility: high' },
  { category: 'Consumables', type: 'Ammunition', name: 'Silvered Shot', desc: 'Silver-coated pellets or balls used against certain cursed creatures. Expensive and soft.', tags: ['ammo','silver'], meta: 'target: supernatural' },
  { category: 'Consumables', type: 'Bomb', name: 'Smoke Egg', desc: 'A clay egg packed with smoke compound. Breaks line of sight and makes breathing unpleasant.', tags: ['thrown','smoke'], meta: 'area: small' },
  { category: 'Consumables', type: 'Bomb', name: 'Flash Salt Packet', desc: 'A paper packet that bursts with a bright flash when sparked. Useful for escapes and ambushes.', tags: ['thrown','blind'], meta: 'trigger: flame/spark' },
  { category: 'Consumables', type: 'Bomb', name: 'Thunder Pot', desc: 'A sealed pot that cracks with a stunning bang. Not lethal, but deeply persuasive.', tags: ['thrown','sound'], meta: 'effect: stun/disrupt' },
  { category: 'Consumables', type: 'Bomb', name: 'Glue Flask', desc: 'A flask of fast-setting adhesive that gums boots, gears, wings, and door seams.', tags: ['control','thrown'], meta: 'effect: slow/stick' },
  { category: 'Consumables', type: 'Bomb', name: 'Alchemist Fire Flask', desc: 'A volatile burning liquid that clings to surfaces. Terrible near books, rigging, and friends.', tags: ['fire','thrown'], meta: 'effect: burning' },
  { category: 'Consumables', type: 'Bomb', name: 'Glass Thorn Grenade', desc: 'A fragile bomb scattering painful glass thorns across a small area.', tags: ['supplemental','thrown'], meta: 'metadata: flexible' },
  { category: 'Consumables', type: 'Elixir', name: 'Elixir of Ember Blood', desc: 'Warms the body against cold and lets breath steam like a forge. Too much causes fever.', tags: ['cold resistance'], meta: 'duration: hours' },
  { category: 'Consumables', type: 'Elixir', name: 'Elixir of Deep Sight', desc: 'Dilates the eyes for dim places. Bright light becomes painful.', tags: ['vision','drawback'], meta: 'duration: hours' },
  { category: 'Consumables', type: 'Elixir', name: 'Elixir of Borrowed Voice', desc: 'Lets the drinker imitate a voice they have studied. Emotion remains hard to fake.', tags: ['social','disguise'], meta: 'duration: short' },
  { category: 'Consumables', type: 'Elixir', name: 'Elixir of Calm Hands', desc: 'Steadies fine motor control for surgery, lockpicking, and delicate schematics.', tags: ['skill','focus'], meta: 'duration: scene' },
  { category: 'Consumables', type: 'Food', name: 'Hardtack Rations', desc: 'Dense biscuits that last forever and taste like punishment. Keeps travelers alive.', tags: ['food','travel'], meta: 'duration: meal' },
  { category: 'Consumables', type: 'Food', name: "Sailor's Lime Syrup", desc: 'Sour syrup preventing long-voyage sickness and masking bad water.', tags: ['food','medicine'], meta: 'uses: several' },
  { category: 'Consumables', type: 'Food', name: 'Iron March Biscuit', desc: 'A mineral-heavy ration that sustains long marches and causes fierce thirst.', tags: ['supplemental','food'], meta: 'metadata: flexible' },
  { category: 'Consumables', type: 'Medicine', name: 'Fever Bark Chew', desc: 'Bitter bark used to reduce fever and keep a patient conscious. Works slowly.', tags: ['medicine','survival'], meta: 'duration: hours' },
  { category: 'Consumables', type: 'Medicine', name: 'Clotting Sponge', desc: 'A compressed sponge that stops bleeding when pressed into a wound. Painful but effective.', tags: ['medicine','healing'], meta: 'effect: stabilize' },
  { category: 'Consumables', type: 'Medicine', name: 'Wake Salt', desc: 'Sharp-smelling salts that revive a fainted or stunned creature. Overuse causes nosebleeds.', tags: ['medicine','revive'], meta: 'uses: one' },
  { category: 'Consumables', type: 'Medicine', name: 'Bitter Sleep Tincture', desc: 'A measured sleep aid for pain, surgery, and deeply inconvenient captives.', tags: ['supplemental','medicine'], meta: 'metadata: flexible' },
  { category: 'Consumables', type: 'Poison', name: 'Widowleaf Resin', desc: 'A sticky blade poison causing weakness and sweating. Common among criminals because ingredients are mundane.', tags: ['poison','weapon'], meta: 'save: resist sickness' },
  { category: 'Consumables', type: 'Poison', name: 'Blue Adder Venom', desc: 'A fast venom that numbs limbs and slows reactions. Best delivered by needle or arrow.', tags: ['poison','paralysis'], meta: 'duration: short' },
  { category: 'Consumables', type: 'Poison', name: 'Gravetongue Powder', desc: 'A pale powder that makes speech slurred and confusing. Used for abductions more than murder.', tags: ['poison','social'], meta: 'effect: speech impairment' },
  { category: 'Consumables', type: 'Poison', name: 'Lantern Mold Spores', desc: 'Thrown spores that irritate eyes and reveal invisible moisture trails in the air. Dangerous indoors.', tags: ['poison','reveal'], meta: 'area: small cloud' },
  { category: 'Consumables', type: 'Potion', name: 'Potion of Mending Flesh', desc: 'A bitter red draught that closes cuts and restores fighting strength. Leaves a copper taste.', tags: ['healing','use_once'], meta: 'effect: restore vitality' },
  { category: 'Consumables', type: 'Potion', name: 'Potion of Clear Breath', desc: 'Clears smoke, choking spores, and foul air from the lungs for a short time.', tags: ['medicine','air'], meta: 'duration: short' },
  { category: 'Consumables', type: 'Potion', name: 'Potion of Fleet Step', desc: 'Lightens the drinkers stride, improving running, leaping, and retreating.', tags: ['mobility','use_once'], meta: 'duration: scene' },
  { category: 'Consumables', type: 'Potion', name: 'Potion of Iron Gut', desc: 'Protects against spoiled food, weak poison, and swamp water regret.', tags: ['resistance','poison'], meta: 'duration: hours' },
  { category: 'Consumables', type: 'Potion', name: 'Potion of Stone Nerves', desc: 'Dulls fear and panic while making subtle emotion harder to read.', tags: ['morale','social'], meta: 'duration: scene' },
  { category: 'Consumables', type: 'Potion', name: "Potion of Cat's Wakefulness", desc: 'Keeps the drinker alert through a watch but causes trembling hands afterward.', tags: ['rest','drawback'], meta: 'duration: watch' },
  { category: 'Consumables', type: 'Potion', name: 'Potion of Quiet Blood', desc: 'A dark draught that slows bleeding and heartbeat for a short while.', tags: ['supplemental','medicine'], meta: 'metadata: flexible' },
  { category: 'Consumables', type: 'Scroll', name: 'Scroll of Safe Passage', desc: 'A single-use legal writ or minor ward recognized by one faction, road, or gate.', tags: ['document','use_once'], meta: 'effect: bypass/social' },
  { category: 'Consumables', type: 'Scroll', name: 'Scroll of Emergency Map', desc: 'A prepared blank that reveals a rough sketch of the nearby room when activated.', tags: ['magic','mapping'], meta: 'effect: local map' },

  // SPELLCASTING ITEMS
  { category: 'Spellcasting Items', type: 'Book', name: 'Travel Grimoire', desc: 'A compact spellbook with waxed pages and coded margins. Built to survive rain and theft.', tags: ['magic','book'], meta: 'capacity: moderate' },
  { category: 'Spellcasting Items', type: 'Book', name: 'Iron-Clasp Codex', desc: 'A reinforced codex that resists fire, damp, and casual snooping. Heavy enough to bruise with.', tags: ['magic','book'], meta: 'durability: high' },
  { category: 'Spellcasting Items', type: 'Book', name: 'Mnemonic Knot Cord', desc: 'A cord tied with knots encoding spell forms. Useful for cultures that distrust written magic.', tags: ['magic','memory'], meta: 'requires: trained reading' },
  { category: 'Spellcasting Items', type: 'Component', name: 'Powdered Pearl', desc: 'A glittering ritual component used in wards, healing, binding, and restoration rites.', tags: ['component','costly'], meta: 'consumed: often' },
  { category: 'Spellcasting Items', type: 'Component', name: 'Grave Salt', desc: 'Salt gathered from burial stones and used in barriers against restless dead.', tags: ['component','death','ward'], meta: 'consumed: sometimes' },
  { category: 'Spellcasting Items', type: 'Component', name: 'Amber Lens', desc: 'A polished amber lens that focuses preserved sunlight into ritual circles.', tags: ['component','light'], meta: 'reusable: yes' },
  { category: 'Spellcasting Items', type: 'Component', name: 'Dragonbone Splinter', desc: 'A rare splinter used to strengthen breath, fear, or sovereignty magic. Dangerous to counterfeit.', tags: ['component','rare'], meta: 'cost: high' },
  { category: 'Spellcasting Items', type: 'Component', name: 'Moon Ink', desc: 'Silver-blue ink used for lunar contracts, dream maps, and hidden script.', tags: ['component','writing'], meta: 'visibility: moonlight' },
  { category: 'Spellcasting Items', type: 'Focus', name: 'Ashwood Wand', desc: 'A slim wand used for precise gestures and directed spellwork. It chars slightly after hard use.', tags: ['magic','focus'], meta: 'slot: hand' },
  { category: 'Spellcasting Items', type: 'Focus', name: 'Crystal Wand', desc: 'A faceted wand that clarifies light, illusion, and force effects. Cracks reveal overchanneling.', tags: ['magic','focus'], meta: 'attunement: optional' },
  { category: 'Spellcasting Items', type: 'Focus', name: 'Ironwood Staff', desc: 'A heavy staff that doubles as walking stick and spell anchor. Favored by traveling casters.', tags: ['magic','focus','weapon'], meta: 'hand: one/two' },
  { category: 'Spellcasting Items', type: 'Focus', name: 'Silver Bell Focus', desc: 'A hand bell whose tone marks the start or end of ritual phrases. Useful against spirits.', tags: ['magic','sound'], meta: 'component: audible' },
  { category: 'Spellcasting Items', type: 'Focus', name: 'Bone Rod', desc: 'A polished rod carved with ancestral marks. Common in death, memory, and oath rites.', tags: ['magic','focus'], meta: 'school: ancestral/death' },
  { category: 'Spellcasting Items', type: 'Holy Symbol', name: 'Sunburst Reliquary', desc: 'A small reliquary holding ash, bone, or cloth from a saint. Used to channel sanctified power.', tags: ['divine','focus'], meta: 'requirement: faith tradition' },
  { category: 'Spellcasting Items', type: 'Holy Symbol', name: "Pilgrim's Prayer Wheel", desc: 'A hand wheel inscribed with rotating prayers. Turning it counts as spoken devotion in hostile silence.', tags: ['divine','ritual'], meta: 'use: prayer' },
  { category: 'Spellcasting Items', type: 'Holy Symbol', name: 'Consecrated Chain', desc: 'A chain of blessed links worn at wrist or neck. Each link may mark an oath or penance.', tags: ['divine','ward'], meta: 'slot: worn' },
  { category: 'Spellcasting Items', type: 'Tool', name: 'Ritual Chalk Set', desc: 'Colored chalks blended with mineral dust for circles, wards, and measured diagrams.', tags: ['magic','ritual'], meta: 'uses: many' },
  { category: 'Spellcasting Items', type: 'Tool', name: 'Censer of Slow Smoke', desc: 'A swinging censer that releases smoke in controlled patterns for purification and summoning.', tags: ['magic','ritual'], meta: 'fuel: incense' },
  { category: 'Spellcasting Items', type: 'Tool', name: 'Casting Glove', desc: 'A glove marked with finger sigils that helps casters maintain forms while injured or mounted.', tags: ['magic','wearable'], meta: 'slot: hand' },
  { category: 'Spellcasting Items', type: 'Tool', name: 'Star Brass Astrolabe', desc: 'An intricate tool used to time celestial rites and locate sympathetic alignments.', tags: ['magic','astronomy'], meta: 'requires: knowledge' },

  // SCHEMATIC MATERIALS
  { category: 'Schematic Materials', type: 'Casing', name: 'Copper Casing', desc: 'Conductive casing for devices that move charge or heat. Dents easily but repairs cleanly.', tags: ['schematic','casing'], meta: 'material: copper' },
  { category: 'Schematic Materials', type: 'Casing', name: 'Iron Casing', desc: 'Plain rugged casing used for field devices, weapons, and exposed mechanisms.', tags: ['schematic','casing'], meta: 'durability: high' },
  { category: 'Schematic Materials', type: 'Casing', name: 'Ceramic Heat Sleeve', desc: 'A ceramic sleeve that protects hands and nearby parts from heat buildup.', tags: ['schematic','heat'], meta: 'resist: fire' },
  { category: 'Schematic Materials', type: 'Casing', name: 'Glass Observation Bulb', desc: 'A clear pressure bulb for seeing fluid levels, gas color, or reagent reactions.', tags: ['schematic','fragile'], meta: 'visibility: internal' },
  { category: 'Schematic Materials', type: 'Circuit', name: 'Silver Contact Wire', desc: 'Fine silver wire that conducts cleanly in sensitive devices. Soft and prone to theft.', tags: ['schematic','circuit'], meta: 'conductivity: high' },
  { category: 'Schematic Materials', type: 'Circuit', name: 'Rune-Etched Circuit Plate', desc: 'A plate engraved with repeatable control paths. It is technology with ritual-adjacent discipline.', tags: ['schematic','circuit'], meta: 'requires: etching' },
  { category: 'Schematic Materials', type: 'Circuit', name: 'Insulated Copper Coil', desc: 'A wound coil used in magnets, alarms, shock tools, and signal devices.', tags: ['schematic','circuit'], meta: 'effect: induction' },
  { category: 'Schematic Materials', type: 'Control', name: 'Brass Toggle Bank', desc: 'A row of toggles for controlling multiple device modes. Labels are strongly recommended.', tags: ['schematic','control'], meta: 'modes: multiple' },
  { category: 'Schematic Materials', type: 'Control', name: 'Deadman Grip', desc: 'A safety handle that stops the device when released. Invented after enough funerals.', tags: ['schematic','safety'], meta: 'trigger: held' },
  { category: 'Schematic Materials', type: 'Core', name: 'Spring-Tension Core', desc: 'A wound spring assembly that stores mechanical energy. Quiet until it fails spectacularly.', tags: ['schematic','power'], meta: 'charge: mechanical' },
  { category: 'Schematic Materials', type: 'Core', name: 'Coal Micro-Furnace', desc: 'A miniature furnace that powers pumps, pistons, and heat tools. Smoky and hot to carry.', tags: ['schematic','power','heat'], meta: 'fuel: coal' },
  { category: 'Schematic Materials', type: 'Core', name: 'Lightning Jar', desc: 'A glass cell storing captured electrical charge. Must be grounded before installation.', tags: ['schematic','power'], meta: 'risk: shock' },
  { category: 'Schematic Materials', type: 'Core', name: 'Aether Condenser', desc: 'A sealed condenser that stabilizes unusual energies for advanced inventions. Expensive and regulated.', tags: ['schematic','power','rare'], meta: 'requirement: license' },
  { category: 'Schematic Materials', type: 'Fastener', name: 'Self-Locking Rivets', desc: 'Rivets that bite inward when hammered, preventing field vibration from loosening them.', tags: ['schematic','fastener'], meta: 'durability: improved' },
  { category: 'Schematic Materials', type: 'Frame', name: 'Oak Device Frame', desc: 'A carved wooden frame for light tools, traps, and portable devices. Cheap and easy to repair.', tags: ['schematic','frame'], meta: 'durability: low-mid' },
  { category: 'Schematic Materials', type: 'Frame', name: 'Steel Skeleton Frame', desc: 'A riveted structural frame for durable inventions. Heavy but reliable under stress.', tags: ['schematic','frame'], meta: 'durability: high' },
  { category: 'Schematic Materials', type: 'Frame', name: 'Brass Precision Frame', desc: 'A fine frame for clocks, lenses, and delicate regulators. Demands careful alignment.', tags: ['schematic','frame'], meta: 'precision: high' },
  { category: 'Schematic Materials', type: 'Frame', name: 'Folded Mythril Frame', desc: 'A rare light frame for high-end devices where weight matters more than cost.', tags: ['schematic','rare'], meta: 'weight: low' },
  { category: 'Schematic Materials', type: 'Fuel', name: 'Refined Blackpowder', desc: 'Clean powder for firearms, charges, and signal devices. Keep dry and away from fools.', tags: ['schematic','fuel'], meta: 'risk: explosive' },
  { category: 'Schematic Materials', type: 'Fuel', name: 'Alchemical Battery Paste', desc: 'A corrosive paste used in low-grade batteries and shocking devices. Eats bad containers.', tags: ['schematic','fuel'], meta: 'risk: acid' },
  { category: 'Schematic Materials', type: 'Fuel', name: 'Lamp Oil Cartridge', desc: 'A sealed oil cartridge for lanterns, burners, and small engines. Safer than open flasks.', tags: ['schematic','fuel'], meta: 'uses: limited' },
  { category: 'Schematic Materials', type: 'Fuel', name: 'Blue Coal Pellet', desc: 'A hot-burning compressed coal pellet for compact furnaces. Leaves blue ash.', tags: ['schematic','fuel'], meta: 'heat: high' },
  { category: 'Schematic Materials', type: 'Lens', name: 'Ground Quartz Lens', desc: 'A clear lens for scopes, lamps, focus arrays, and detection instruments.', tags: ['schematic','optics'], meta: 'precision: medium' },
  { category: 'Schematic Materials', type: 'Mechanism', name: 'Clock Gear Set', desc: 'Matched gears for timers, automata, locks, and repeaters. Tooth damage ruins timing.', tags: ['schematic','mechanism'], meta: 'precision: medium' },
  { category: 'Schematic Materials', type: 'Mechanism', name: 'Ratchet Pawl Assembly', desc: 'A one-way mechanical lock that prevents backspin in winches and charged devices.', tags: ['schematic','safety'], meta: 'effect: holds tension' },
  { category: 'Schematic Materials', type: 'Mechanism', name: 'Gyro Stabilizer', desc: 'A spinning stabilizer that keeps weapons, scopes, or vehicles level under motion.', tags: ['schematic','control'], meta: 'power: rotational' },
  { category: 'Schematic Materials', type: 'Mechanism', name: 'Pressure Regulator', desc: 'A valve device that prevents tanks, furnaces, and launchers from bursting. Ignore at your peril.', tags: ['schematic','safety'], meta: 'effect: pressure control' },
  { category: 'Schematic Materials', type: 'Seal', name: 'Rubberized Gasket', desc: 'A flexible seal for pumps, masks, tanks, and underwater devices. Wears out over time.', tags: ['schematic','seal'], meta: 'maintenance: replace' },
  { category: 'Schematic Materials', type: 'Sensor', name: 'Tuning Fork Sensor', desc: 'A calibrated fork that vibrates near specific materials, spell residues, or machine frequencies.', tags: ['schematic','sensor'], meta: 'detect: chosen frequency' },
  { category: 'Schematic Materials', type: 'Sensor', name: 'Mercury Tilt Switch', desc: 'A sealed switch that activates when tilted. Useful for traps, alarms, and stabilizers.', tags: ['schematic','sensor'], meta: 'trigger: orientation' },

  // DOCUMENTS
  { category: 'Documents', type: 'Blueprint', name: 'Device Blueprint', desc: 'A measured drawing for a specific invention or mechanism. Requires materials and workshop access.', tags: ['document','schematic'], meta: 'effect: build unlock' },
  { category: 'Documents', type: 'Blueprint', name: 'Trap Diagram', desc: 'A diagram showing trigger, payload, reset method, and safe angles for a trap.', tags: ['document','trap'], meta: 'effect: build/disarm insight' },
  { category: 'Documents', type: 'Blueprint', name: 'Ship Rigging Plan', desc: 'A technical plan of mast, sail, and rope arrangements. Useful for sabotage or repair.', tags: ['document','vehicle'], meta: 'effect: maritime engineering' },
  { category: 'Documents', type: 'Knowledge', name: 'Bestiary Leaflet', desc: 'A cheap illustrated guide to one dangerous creature. Half useful fact, half tavern nonsense.', tags: ['document','lore'], meta: 'bonus: identify creature' },
  { category: 'Documents', type: 'Knowledge', name: "Herbalist's Folio", desc: 'Pressed leaves and notes for identifying useful plants. Mold ruins it quickly.', tags: ['document','medicine'], meta: 'bonus: forage' },
  { category: 'Documents', type: 'Knowledge', name: "Siege Engineer's Notes", desc: 'Calculations for walls, counterweights, trenches, and breach points. Valuable in wartime.', tags: ['document','engineering'], meta: 'bonus: siege planning' },
  { category: 'Documents', type: 'Knowledge', name: 'Spell Thesis Abstract', desc: 'A condensed magical argument that helps scholars recognize a spell tradition.', tags: ['document','magic'], meta: 'bonus: arcane research' },
  { category: 'Documents', type: 'Legal', name: 'Travel Writ', desc: 'A stamped document granting permission to cross roads, gates, or borders. Guards love paperwork.', tags: ['document','legal'], meta: 'effect: access' },
  { category: 'Documents', type: 'Legal', name: 'Letter of Marque', desc: 'A government license allowing private raiding against named enemies. Pirates call it respectability.', tags: ['document','pirate','legal'], meta: 'restriction: target list' },
  { category: 'Documents', type: 'Legal', name: 'Guild License', desc: 'Proof of lawful trade within a guild\'s protected market. Without it, fees become creative.', tags: ['document','commerce'], meta: 'effect: trade access' },
  { category: 'Documents', type: 'Legal', name: 'Property Deed', desc: 'A legal claim to land, house, mine, or ruin. Valuable even when the property is cursed.', tags: ['document','legal'], meta: 'effect: ownership' },
  { category: 'Documents', type: 'Legal', name: 'Debt Contract', desc: 'A binding record of money, favor, or goods owed. Useful leverage when authenticated.', tags: ['document','economy'], meta: 'effect: obligation' },
  { category: 'Documents', type: 'Map', name: 'Local Road Map', desc: 'A practical map of roads, ferries, inns, and toll posts. Often outdated at borders.', tags: ['document','navigation'], meta: 'accuracy: regional' },
  { category: 'Documents', type: 'Map', name: 'Dungeon Survey', desc: 'A room-by-room ruin sketch with hazards marked by a previous explorer. Trust cautiously.', tags: ['document','dungeon'], meta: 'accuracy: variable' },
  { category: 'Documents', type: 'Map', name: 'Star Chart', desc: 'A chart of seasonal stars for navigation and celestial rituals. Useless under heavy cloud.', tags: ['document','astronomy'], meta: 'requires: clear sky' },
  { category: 'Documents', type: 'Map', name: "Smuggler's Coastline", desc: 'A coded coastal map showing coves, reefs, and bribed watchtowers. Possession may be criminal.', tags: ['document','illegal'], meta: 'risk: legal' },
  { category: 'Documents', type: 'Secret', name: 'Cipher Wheel Key', desc: 'A rotating paper or brass key used to decode matching messages. Worthless without the cipher family.', tags: ['document','code'], meta: 'effect: decode' },
  { category: 'Documents', type: 'Secret', name: 'Hidden Route Ledger', desc: 'A list of safehouses, caches, bribes, and passwords. Every faction wants one.', tags: ['document','illegal'], meta: 'risk: severe' },
  { category: 'Documents', type: 'Social', name: 'Noble Invitation', desc: 'A formal invitation granting entry to a court, feast, or masked event. Also a target for theft.', tags: ['document','social'], meta: 'effect: access' },
  { category: 'Documents', type: 'Social', name: 'Letter of Introduction', desc: 'A letter vouching for the bearer to a specific person or faction. Its power depends on reputation.', tags: ['document','social'], meta: 'effect: audience' },
  { category: 'Documents', type: 'Social', name: 'Blackmail Dossier', desc: 'A packet of letters, receipts, and witness notes proving something ugly. Dangerous to carry.', tags: ['document','intrigue'], meta: 'risk: pursuit' },

  // MAGIC ITEMS
  { category: 'Magic Items', type: 'Amulet', name: 'Amulet of Last Light', desc: 'An amulet that glows when the wearer is near death, helping allies find them in darkness.', tags: ['magic','wearable'], meta: 'trigger: wounded' },
  { category: 'Magic Items', type: 'Amulet', name: 'Salt-Circle Pendant', desc: 'A pendant that strengthens simple wards against spirits when placed at a threshold.', tags: ['magic','ward'], meta: 'effect: threshold ward' },
  { category: 'Magic Items', type: 'Armor', name: 'Mirror-Mist Cloak', desc: 'A cloak that blurs the wearer\'s outline in fog, rain, or smoke. Useless in dry bright rooms.', tags: ['magic','wearable'], meta: 'condition: mist/smoke' },
  { category: 'Magic Items', type: 'Armor', name: 'Lionheart Breastplate', desc: 'A breastplate that steadies morale when the wearer stands between allies and danger.', tags: ['magic','armor'], meta: 'effect: courage aura' },
  { category: 'Magic Items', type: 'Armor', name: 'Ashen Ward Shield', desc: 'A shield that drinks sparks and cinders, then releases a brief smoky cover.', tags: ['magic','shield'], meta: 'charges: fire-triggered' },
  { category: 'Magic Items', type: 'Armor', name: 'Cloak of Arrow Memory', desc: 'A cloak that stiffens after the first arrow nearly hits the wearer.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },
  { category: 'Magic Items', type: 'Artifact', name: 'Crown Shard of the First Road', desc: 'A broken crown fragment that points toward ancient roads and imperial milestones. Factions dispute ownership.', tags: ['magic','artifact'], meta: 'effect: ancient navigation' },
  { category: 'Magic Items', type: 'Belt', name: 'Belt of the Mule', desc: 'A broad belt that improves carrying endurance and stubborn resistance to forced movement.', tags: ['magic','strength'], meta: 'effect: carry more' },
  { category: 'Magic Items', type: 'Boots', name: 'Boots of the Sure Ledge', desc: 'Boots that grip wet stone, roof tiles, and ship decks better than normal leather.', tags: ['magic','mobility'], meta: 'effect: balance' },
  { category: 'Magic Items', type: 'Charm', name: 'Charm of the Unbitten', desc: 'A little charm that discourages mundane insects and leeches. It does nothing to giant ones.', tags: ['magic','survival'], meta: 'effect: pest ward' },
  { category: 'Magic Items', type: 'Charm', name: 'Charm of Second Guessing', desc: 'A charm that chills when the bearer is about to sign a dangerously worded agreement.', tags: ['magic','social'], meta: 'effect: contract warning' },
  { category: 'Magic Items', type: 'Charm', name: 'Foxfire Bead', desc: 'A bead that stores a mote of pale light and releases it when crushed.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },
  { category: 'Magic Items', type: 'Gloves', name: 'Gloves of Gentle Theft', desc: 'Gloves that prevent fingerprints and reduce accidental noise while handling small objects.', tags: ['magic','stealth'], meta: 'effect: careful hands' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of the Patient Lock', desc: 'A ring that vibrates gently near deliberate mechanisms and hidden latches. It dislikes brute force.', tags: ['magic','ring','detection'], meta: 'effect: find mechanisms' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of Shared Breath', desc: 'Two matched rings allowing wearers to share air briefly while touching or bound by cord.', tags: ['magic','ring'], meta: 'effect: breath share' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of Quiet Footfalls', desc: 'A dark ring that softens steps on stone and wood. It cannot silence speech or stupidity.', tags: ['magic','stealth'], meta: 'effect: step silence' },
  { category: 'Magic Items', type: 'Ring', name: 'Ring of Dry Socks', desc: 'A humble ring that keeps footwear dry in ordinary rain and puddles.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },
  { category: 'Magic Items', type: 'Rod', name: 'Rod of Measured Silence', desc: 'A rod that suppresses a small area of needless noise, useful for courts, sickrooms, and ambushes.', tags: ['magic','rod','sound'], meta: 'duration: short' },
  { category: 'Magic Items', type: 'Staff', name: 'Staff of the Road Shrine', desc: 'A staff that marks campsites as temporarily safe and helps travelers find the nearest path.', tags: ['magic','staff','travel'], meta: 'effect: camp ward' },
  { category: 'Magic Items', type: 'Staff', name: 'Staff of Bitter Roots', desc: 'A living staff that can root into soil, drink poison, or lash with thorny growth.', tags: ['magic','staff','nature'], meta: 'condition: soil' },
  { category: 'Magic Items', type: 'Wand', name: 'Wand of Hearth Sparks', desc: 'A wand that lights fires, warms cups, and frightens small pests. Adventurers love it until rain starts.', tags: ['magic','wand','utility'], meta: 'charges: daily' },
  { category: 'Magic Items', type: 'Wand', name: 'Wand of Binding Thread', desc: 'Fires spectral threads that tie small objects, close sacks, or hinder a fleeing target.', tags: ['magic','wand','control'], meta: 'charges: limited' },
  { category: 'Magic Items', type: 'Weapon', name: 'Blade of Returning Dawn', desc: 'A sun-marked blade that sheds dim light and feels warm after courageous acts. It may strike harder against shadowed foes.', tags: ['magic','weapon','rare'], meta: 'attunement: maybe' },
  { category: 'Magic Items', type: 'Weapon', name: 'Oathkeeper Spear', desc: 'A spear that grows heavier in the hands of oathbreakers and steadier for sworn guardians.', tags: ['magic','weapon'], meta: 'effect: oath resonance' },
  { category: 'Magic Items', type: 'Weapon', name: 'Stormbite Axe', desc: 'An axe that crackles before rain and can discharge a thunderous cut when charged.', tags: ['magic','weapon','storm'], meta: 'charges: limited' },
  { category: 'Magic Items', type: 'Weapon', name: 'Grief-Tuned Dagger', desc: 'A dagger that vibrates near the person its bearer most resents.', tags: ['supplemental','magic'], meta: 'metadata: flexible' },

  // TECH INVENTIONS
  { category: 'Tech Inventions', type: 'Apparatus', name: 'Diving Helmet', desc: 'A riveted helmet connected to hose or air tank. Lets the wearer work underwater briefly.', tags: ['tech','aquatic'], meta: 'requires: air supply' },
  { category: 'Tech Inventions', type: 'Apparatus', name: 'Smoke Breather Mask', desc: 'A filter mask for smoke, dust, and weak fumes. Filters clog at the worst time.', tags: ['tech','survival'], meta: 'uses: filter' },
  { category: 'Tech Inventions', type: 'Apparatus', name: 'Climbing Claw Gauntlets', desc: 'Gauntlets with retractable claws for wood, ice, and soft stone. Poor manners indoors.', tags: ['tech','mobility'], meta: 'effect: climb assist' },
  { category: 'Tech Inventions', type: 'Apparatus', name: 'Exo-Lift Harness', desc: 'A powered harness that helps lift gates, stones, and fallen allies. Heavy when discharged.', tags: ['tech','strength'], meta: 'fuel: core charge' },
  { category: 'Tech Inventions', type: 'Apparatus', name: 'Foldout Breach Ladder', desc: 'A compact ladder that snaps open with a spring frame.', tags: ['supplemental','tech'], meta: 'metadata: flexible' },
  { category: 'Tech Inventions', type: 'Automaton', name: 'Brass Porter Beetle', desc: 'A dog-sized cargo automaton that follows a beacon disk. It stops at stairs and philosophical questions.', tags: ['tech','automaton'], meta: 'capacity: small' },
  { category: 'Tech Inventions', type: 'Automaton', name: 'Clockwork Sentry Head', desc: 'A rotating sensor head that rings when movement crosses its marked arc. Easy to fool with patience.', tags: ['tech','security'], meta: 'trigger: motion' },
  { category: 'Tech Inventions', type: 'Automaton', name: 'Paper-Feed Scribe', desc: 'A desk device that copies dictated words through stylus arms. Mishears accents terribly.', tags: ['tech','writing'], meta: 'requires: paper/ink' },
  { category: 'Tech Inventions', type: 'Automaton', name: 'Tin Courier Crab', desc: 'A small clockwork crab that carries a message capsule along floors and pipes.', tags: ['supplemental','tech'], meta: 'metadata: flexible' },
  { category: 'Tech Inventions', type: 'Communication', name: 'Wire-Tap Telegraph Box', desc: 'A short-range wired clicker for coded messages between rooms or trenches.', tags: ['tech','communication'], meta: 'requires: wire' },
  { category: 'Tech Inventions', type: 'Communication', name: 'Message Capsule Launcher', desc: 'A tube that fires sealed capsules across walls, ravines, or ship decks.', tags: ['tech','communication'], meta: 'ammo: capsules' },
  { category: 'Tech Inventions', type: 'Device', name: 'Pocket Spark Igniter', desc: 'A thumb device that throws a reliable spark for lamps, fuses, and campfires. Safer than open flint in wind.', tags: ['tech','utility'], meta: 'fuel: spring/flint' },
  { category: 'Tech Inventions', type: 'Device', name: 'Clockwork Lockpick', desc: 'A buzzing pick that tests simple lock pins rapidly. Loud, delicate, and illegal in many cities.', tags: ['tech','infiltration'], meta: 'charges: wound spring' },
  { category: 'Tech Inventions', type: 'Device', name: 'Signal Lens Beacon', desc: 'A collapsible lens and shutter rig for sending coded flashes over distance. Requires line of sight.', tags: ['tech','signal'], meta: 'range: visual' },
  { category: 'Tech Inventions', type: 'Device', name: 'Portable Air Pump', desc: 'A hand pump used for diving bells, inflatable bladders, and clearing fumes from small spaces.', tags: ['tech','survival'], meta: 'requires: labor' },
  { category: 'Tech Inventions', type: 'Device', name: 'Tripwire Alarm Tin', desc: 'A small tin bell and spring snapper attached to wire. Cheap perimeter security.', tags: ['tech','alarm'], meta: 'trigger: wire' },
  { category: 'Tech Inventions', type: 'Device', name: 'Gearclick Counter', desc: 'A palm counter that tracks steps, turns, shots, or lies depending on its setting.', tags: ['supplemental','tech'], meta: 'metadata: flexible' },
  { category: 'Tech Inventions', type: 'Firearm', name: 'Collapsible Volley Brace', desc: 'A folding rest that stabilizes firearms for accurate opening shots. Used by marksmen and guards.', tags: ['tech','firearm'], meta: 'effect: aim support' },
  { category: 'Tech Inventions', type: 'Firearm', name: 'Powder-Dry Cartridge Case', desc: 'A sealed case that protects powder and shot from rain during travel.', tags: ['tech','firearm'], meta: 'effect: weatherproof ammo' },
  { category: 'Tech Inventions', type: 'Firearm', name: 'Smoke-Cutting Sight', desc: 'A tinted sighting lens that helps shooters track targets through blackpowder haze.', tags: ['tech','firearm'], meta: 'effect: visibility' },
  { category: 'Tech Inventions', type: 'Machine', name: 'Hand-Crank Winch', desc: 'A portable winch for lifting gates, pulling wagons, or dragging monsters away from doors.', tags: ['tech','strength'], meta: 'requires: anchor' },
  { category: 'Tech Inventions', type: 'Machine', name: 'Field Printing Press', desc: 'A compact press for notices, forged leaflets, ration tickets, or revolutionary pamphlets.', tags: ['tech','document'], meta: 'requires: ink/type' },
  { category: 'Tech Inventions', type: 'Machine', name: 'Portable Drill Frame', desc: 'A geared drill clamped to stone or metal. Slow, loud, and good at making new options.', tags: ['tech','tool'], meta: 'fuel: crank' },
  { category: 'Tech Inventions', type: 'Machine', name: 'Steam Kettle Engine', desc: 'A small pressure engine that powers pumps or wheels. It hisses like an angry spirit.', tags: ['tech','power'], meta: 'fuel: heat/water' },
  { category: 'Tech Inventions', type: 'Machine', name: 'Auto-Hammer Rig', desc: 'A workshop hammer powered by crank, water, or engine. Speeds forging but maims the careless.', tags: ['tech','forge'], meta: 'requires: workshop' },
  { category: 'Tech Inventions', type: 'Medical', name: 'Bone-Setter Clamp', desc: 'A precise clamp for aligning broken limbs before binding. Hurts less than old methods, not by much.', tags: ['tech','medicine'], meta: 'effect: treatment' },
  { category: 'Tech Inventions', type: 'Medical', name: 'Sterilizing Heat Wand', desc: 'A heated rod for cleaning tools and cauterizing wounds. Effective and intimidating.', tags: ['tech','medicine'], meta: 'fuel: heat cell' },
  { category: 'Tech Inventions', type: 'Optics', name: 'Collapsible Spyglass', desc: 'A portable scope for scouting roads, walls, sails, and approaching consequences.', tags: ['tech','optics'], meta: 'range: sight' },
  { category: 'Tech Inventions', type: 'Optics', name: 'Microscope Tube', desc: 'A table device for examining fibers, spores, inks, and tiny metal filings.', tags: ['tech','investigation'], meta: 'requires: stable table' },
  { category: 'Tech Inventions', type: 'Sensor', name: 'Heat Needle Dial', desc: 'A dial that points toward nearby heat leaks, fires, or living bodies behind thin walls.', tags: ['supplemental','tech'], meta: 'metadata: flexible' },
  { category: 'Tech Inventions', type: 'Trap', name: 'Spring Net Launcher', desc: 'A portable launcher that throws a folded net over a target area. Popular with bounty crews.', tags: ['tech','control'], meta: 'effect: restrain' },
  { category: 'Tech Inventions', type: 'Trap', name: 'Pressure Plate Mine', desc: 'A mechanical pressure-triggered charge or alarm. Must be marked or remembered by allies.', tags: ['tech','trap'], meta: 'trigger: weight' },

  // WONDROUS ITEMS
  { category: 'Wondrous Items', type: 'Container', name: 'Bottomless Button Tin', desc: 'A small tin that always contains one more mismatched button. Tailors consider it a curse.', tags: ['wondrous','flavor'], meta: 'effect: buttons' },
  { category: 'Wondrous Items', type: 'Container', name: 'Hungry Coin Purse', desc: 'A purse that bites pickpockets and anyone who tries to count it without permission.', tags: ['wondrous','security'], meta: 'effect: bite alarm' },
  { category: 'Wondrous Items', type: 'Container', name: 'Freshness Jar', desc: 'A ceramic jar that keeps herbs, bread, or organs fresh longer than normal. Label carefully.', tags: ['wondrous','preservation'], meta: 'effect: slow spoilage' },
  { category: 'Wondrous Items', type: 'Container', name: 'Sack of Last Resort', desc: 'A sack that produces one mundane, low-value item the owner truly forgot to pack. Works rarely.', tags: ['wondrous','utility'], meta: 'charges: limited' },
  { category: 'Wondrous Items', type: 'Container', name: 'Pocket Pantry Box', desc: 'A lunchbox that keeps one modest meal pleasantly fresh.', tags: ['supplemental','wondrous'], meta: 'metadata: flexible' },
  { category: 'Wondrous Items', type: 'Held', name: 'Endless Chalk Stub', desc: 'A chalk stub that never quite runs out. Marks vanish after several days unless sealed.', tags: ['wondrous','utility'], meta: 'effect: marking' },
  { category: 'Wondrous Items', type: 'Held', name: 'Cup of Honest Water', desc: 'A cup that clouds when filled with common poison or foul water. It cannot name the threat.', tags: ['wondrous','survival'], meta: 'effect: detect contamination' },
  { category: 'Wondrous Items', type: 'Held', name: 'Keyring of Lost Doors', desc: 'A keyring that jingles near doors the bearer has passed before but forgotten.', tags: ['wondrous','navigation'], meta: 'effect: memory aid' },
  { category: 'Wondrous Items', type: 'Held', name: 'Lantern of Soft Ghosts', desc: 'A lantern that reveals harmless echoes of recent movement as dim afterimages.', tags: ['wondrous','investigation'], meta: 'effect: recent traces' },
  { category: 'Wondrous Items', type: 'Held', name: 'Spoon of Fair Portions', desc: 'A spoon that divides stew into equal servings, exposing greedy hosts.', tags: ['supplemental','wondrous'], meta: 'metadata: flexible' },
  { category: 'Wondrous Items', type: 'Relic', name: 'Doorstop of Holding Fast', desc: 'A wedge that can hold ordinary doors shut against surprising force. Fails against destroyed hinges.', tags: ['wondrous','defense'], meta: 'effect: secure door' },
  { category: 'Wondrous Items', type: 'Relic', name: 'Hourglass of Stolen Minutes', desc: 'An hourglass that tracks exactly ten quiet minutes. People nearby instinctively lower their voices.', tags: ['wondrous','time'], meta: 'duration: ten minutes' },
  { category: 'Wondrous Items', type: 'Relic', name: 'Mirror of the Better Angle', desc: 'A hand mirror that shows the viewer from the most flattering honest angle. Popular and dangerous.', tags: ['wondrous','social'], meta: 'effect: presentation' },
  { category: 'Wondrous Items', type: 'Relic', name: 'Compass of Unfinished Business', desc: "A compass that points toward the bearer's nearest unresolved promise. Annoyingly literal.", tags: ['wondrous','quest'], meta: 'effect: oath direction' },
  { category: 'Wondrous Items', type: 'Relic', name: 'Pebble of Returning Home', desc: 'A pebble that grows warmer when carried toward the place it was taken from.', tags: ['supplemental','wondrous'], meta: 'metadata: flexible' },
  { category: 'Wondrous Items', type: 'Tool', name: 'Broom of Quiet Corners', desc: 'A broom that sweeps dust into tidy piles and occasionally uncovers hidden floor seams.', tags: ['wondrous','domestic'], meta: 'effect: clean/search' },
  { category: 'Wondrous Items', type: 'Tool', name: 'Needle of Perfect Mending', desc: 'A needle that repairs cloth cleanly when given matching thread and patience. Cannot mend trust.', tags: ['wondrous','repair'], meta: 'effect: cloth repair' },
  { category: 'Wondrous Items', type: 'Tool', name: 'Pan of No Burning', desc: 'A cooking pan that refuses to burn food, though it cannot improve bad ingredients.', tags: ['wondrous','cooking'], meta: 'effect: safe cooking' },
  { category: 'Wondrous Items', type: 'Tool', name: 'Dice of Suspicious Fortune', desc: 'Dice that roll dramatically and occasionally warn of loaded games by turning cold.', tags: ['wondrous','gaming'], meta: 'effect: cheating hint' },
  { category: 'Wondrous Items', type: 'Tool', name: 'Quill of Neat Margins', desc: 'A quill that keeps straight margins and adds tiny correction marks.', tags: ['supplemental','wondrous'], meta: 'metadata: flexible' },
  { category: 'Wondrous Items', type: 'Utility', name: 'Rope of Polite Knots', desc: 'A rope that ties neat basic knots when asked plainly. It refuses cruel commands.', tags: ['wondrous','utility'], meta: 'effect: knotting' },
  { category: 'Wondrous Items', type: 'Utility', name: 'Blanket of Shared Shelter', desc: 'A blanket that stretches enough to cover one more person than expected. Warmth still must be shared.', tags: ['wondrous','camp'], meta: 'effect: shelter' },
  { category: 'Wondrous Items', type: 'Utility', name: 'Inkpot of Last Words', desc: 'An inkpot that does not spill and darkens when writing farewells, wills, or confessions.', tags: ['wondrous','writing'], meta: 'effect: solemn writing' },
  { category: 'Wondrous Items', type: 'Utility', name: 'Bell of Found Companions', desc: 'A little bell whose tone carries clearly to allies who know the sound, even through market noise.', tags: ['wondrous','signal'], meta: 'effect: ally signal' },
  { category: 'Wondrous Items', type: 'Wearable', name: 'Cloak of Many Pockets', desc: 'A cloak with more hidden pockets than sense. It organizes small items but grows lumpy when abused.', tags: ['wondrous','inventory'], meta: 'effect: storage' },
  { category: 'Wondrous Items', type: 'Wearable', name: 'Hat of Proper Introductions', desc: 'A hat that subtly adjusts to local formal style, reducing obvious outsider mistakes.', tags: ['wondrous','social'], meta: 'effect: etiquette aid' },
  { category: 'Wondrous Items', type: 'Wearable', name: 'Scarf of Remembered Warmth', desc: 'A scarf that recalls the warmth of the last hearth it hung beside. Comforting in cold travel.', tags: ['wondrous','survival'], meta: 'effect: warmth' },
  { category: 'Wondrous Items', type: 'Wearable', name: 'Mask of the Unremarked Face', desc: 'A plain mask that makes the wearer easier to forget in a crowd, not invisible.', tags: ['wondrous','stealth'], meta: 'effect: forgettable' },
];

// ─── CATEGORY COLOR MAP ───────────────────────────────────────────────────────
const CAT_COLOR = {
  'Currency':            COLORS.tech    || '#2D9E7A',
  'Weapons':             COLORS.warn    || '#D4845A',
  'Armor':               COLORS.magic   || '#7B68D8',
  'Gear':                COLORS.muted   || '#8a7d6e',
  'Packs':               COLORS.deity   || '#C4A35A',
  'Mounts':              '#7a9e7a',
  'Familiars':           '#9e7a9e',
  'Vehicles':            '#7a8b9e',
  'Trade Goods':         '#9e8a7a',
  'Trinkets':            '#9e9e7a',
  'Consumables':         '#c47a7a',
  'Spellcasting Items':  '#7a9e9e',
  'Schematic Materials': '#8a9e7a',
  'Documents':           '#9e8a9e',
  'Magic Items':         COLORS.magic   || '#7B68D8',
  'Tech Inventions':     COLORS.tech    || '#2D9E7A',
  'Wondrous Items':      COLORS.deity   || '#C4A35A',
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function ItemCatalog() {
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCat] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  const categories = useMemo(() => [...new Set(ITEMS.map(i => i.category))], []);

  const types = useMemo(() => {
    if (!activeCategory) return [];
    return [...new Set(ITEMS.filter(i => i.category === activeCategory).map(i => i.type))];
  }, [activeCategory]);

  const filtered = useMemo(() => {
    return ITEMS.filter(item => {
      if (activeCategory && item.category !== activeCategory) return false;
      if (activeType && item.type !== activeType) return false;
      if (search) {
        const q = search.toLowerCase();
        return item.name.toLowerCase().includes(q) ||
               item.desc.toLowerCase().includes(q) ||
               item.tags.some(t => t.toLowerCase().includes(q)) ||
               item.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeCategory, activeType, search]);

  const handleCatClick = (cat) => {
    if (activeCategory === cat) { setActiveCat(null); setActiveType(null); }
    else { setActiveCat(cat); setActiveType(null); }
    setExpandedItem(null);
  };

  const handleTypeClick = (type) => {
    setActiveType(activeType === type ? null : type);
    setExpandedItem(null);
  };

  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...label8(), marginBottom: 8 }}>Item Catalog · {ITEMS.length} entries</div>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setActiveCat(null); setActiveType(null); }}
          placeholder="Search items, tags, types…"
          style={{
            width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`,
            borderRadius: 6, padding: '9px 12px', color: COLORS.text, fontSize: 12,
            fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category pills */}
      {!search && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {categories.map(cat => {
            const col = CAT_COLOR[cat] || COLORS.muted;
            const active = activeCategory === cat;
            return (
              <button key={cat} onClick={() => handleCatClick(cat)} style={{
                background: active ? `${col}22` : 'transparent',
                border: `1px solid ${active ? col : COLORS.border}`,
                borderRadius: 4, padding: '4px 10px', cursor: 'pointer',
                fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: active ? col : COLORS.dim, fontFamily: "'Cinzel', serif",
                transition: 'all 0.12s',
              }}>{cat}</button>
            );
          })}
        </div>
      )}

      {/* Type sub-pills */}
      {activeCategory && types.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {types.map(type => {
            const active = activeType === type;
            return (
              <button key={type} onClick={() => handleTypeClick(type)} style={{
                background: active ? 'rgba(240,238,235,0.08)' : 'transparent',
                border: `1px solid ${active ? COLORS.borderMid : COLORS.border}`,
                borderRadius: 4, padding: '3px 8px', cursor: 'pointer',
                fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: active ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif",
                transition: 'all 0.12s',
              }}>{type}</button>
            );
          })}
        </div>
      )}

      {/* Count */}
      <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', marginBottom: 12 }}>
        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
        {activeCategory ? ` · ${activeCategory}` : ''}
        {activeType ? ` · ${activeType}` : ''}
      </div>

      {/* Item list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((item, idx) => {
          const col = CAT_COLOR[item.category] || COLORS.muted;
          const key = `${item.category}-${item.name}`;
          const isOpen = expandedItem === key;

          return (
            <div key={key} style={{
              background: isOpen ? 'rgba(240,238,235,0.04)' : 'transparent',
              border: `1px solid ${isOpen ? COLORS.borderMid : COLORS.border}`,
              borderRadius: 6, overflow: 'hidden', transition: 'all 0.12s',
            }}>
              <div
                onClick={() => setExpandedItem(isOpen ? null : key)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer' }}
              >
                {/* Category dot */}
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0 }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, letterSpacing: '0.04em' }}>
                      {item.name}
                    </span>
                    {!activeCategory && (
                      <span style={{ fontSize: 7, color: col, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase', background: `${col}18`, border: `1px solid ${col}44`, borderRadius: 3, padding: '1px 5px' }}>
                        {item.category}
                      </span>
                    )}
                    <span style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {item.type}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {item.tags.slice(0, 2).map(tag => (
                    <span key={tag} style={{ fontSize: 7, color: COLORS.dim, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '1px 5px', fontFamily: 'Georgia, serif' }}>
                      {tag}
                    </span>
                  ))}
                </div>

                <span style={{ fontSize: 9, color: COLORS.dim, flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
              </div>

              {isOpen && (
                <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '10px 12px 12px 28px' }}>
                  <p style={{ fontSize: 12, color: COLORS.textSub || COLORS.muted, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: '0 0 8px' }}>
                    {item.desc}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, color: COLORS.deity || '#C4A35A', fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>
                      {item.meta}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {item.tags.map(tag => (
                        <span key={tag} style={{ fontSize: 7, color: COLORS.dim, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '1px 5px', fontFamily: 'Georgia, serif' }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '32px 0' }}>
          No items match your search.
        </div>
      )}
    </div>
  );
}

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}
