// src/data/items/schematicMaterials.js

export const SCHEMATIC_MATERIALS = [

// SCHEMATIC MATERIALS — Acid
{ category: 'Schematic Materials', type: 'Acid', name: 'Corrosive Acid', desc: 'A biting acid strong enough to etch metal, dissolve locks, and prepare dangerous weapon mixtures. Most guilds require it to be stored in marked glass.', tags: ['chemical','acid','crafting','hazard'], meta: 'effect: corrosion; weight: tiny' },
{ category: 'Schematic Materials', type: 'Acid', name: 'Carbolic Acid', desc: 'A sharp-smelling acid used by healers, cleaners, and chemists. It can sterilize tools, strip residue, or become the base for more dangerous solutions.', tags: ['chemical','acid','medicine','crafting'], meta: 'use: corrosive acid or cognitive tonic ingredient; vendor: herbal' },

// SCHEMATIC MATERIALS — Chemical
{ category: 'Schematic Materials', type: 'Chemical', name: 'Somnolence Reagent', desc: 'A measured sedative compound used to convert precision firearms into nonlethal capture weapons. Favored by wardens, monster-handlers, and battlefield surgeons who need a target breathing afterward.', tags: ['chemical','sedative','schematic','nonlethal'], meta: 'source: chemistry; use: tranquilizer firearm component; weight: light' },
{ category: 'Schematic Materials', type: 'Chemical', name: 'Beastmark Scent', desc: 'A musky attractant brewed from stabilizers and perfume oils. It can calm, lure, or distract animals depending on how carefully it is applied.', tags: ['chemical','beast','lure','survival'], meta: 'effect: animal reaction modifier; weight: tiny' },
{ category: 'Schematic Materials', type: 'Chemical', name: 'Bromide Salt', desc: 'A dull crystalline stabilizer used in sedatives, scent compounds, and mind-clouding mixtures. Harmless in small amounts, dangerous in practiced hands.', tags: ['chemical','stabilizer','sedative'], meta: 'use: anaesthetic and scent formulas; weight: tiny' },
{ category: 'Schematic Materials', type: 'Chemical', name: 'Electrolyte Solution', desc: 'A conductive liquid used to prepare charges, batteries, and small galvanic devices. Essential to electrical schematics and dangerous near open cuts.', tags: ['chemical','electric','schematic','conductive'], meta: 'use: charge ingredient; weight: light' },
{ category: 'Schematic Materials', type: 'Chemical', name: 'Hallucinite', desc: 'A mind-warping crystalline extract used in fear gas, confusion compounds, and certain sedative schematics. Even sealed vials seem to disturb candlelight.', tags: ['chemical','mind','fear','schematic'], meta: 'use: hallucination and anaesthetic formulas; weight: light' },
{ category: 'Schematic Materials', type: 'Chemical', name: 'Mental Inhibitor', desc: 'A hostile anti-caster compound designed to interrupt concentration and suppress invoked power. Illegal in most temple courts and prized by mage-hunters.', tags: ['chemical','anti-magic','control','schematic'], meta: 'effect: prevents or disrupts casting; weight: light' },
{ category: 'Schematic Materials', type: 'Chemical', name: 'Necromizer Compound', desc: 'A forbidden revivifying compound that agitates dead tissue through chemical force and electrical charge. Most civilized laboratories deny owning the formula.', tags: ['chemical','necromancy-adjacent','forbidden','schematic'], meta: 'effect: creates undead servant or corpse animation; weight: light' },
{ category: 'Schematic Materials', type: 'Chemical', name: 'Sulphur Pills', desc: 'Yellow medicinal tablets with a bitter mineral smell. They are sold as a remedy, but chemists often use them to intensify acids.', tags: ['chemical','medicine','acid ingredient'], meta: 'use: corrosive acid ingredient; vendor: general/herbal' },

// SCHEMATIC MATERIALS — Cleaner
{ category: 'Schematic Materials', type: 'Cleaner', name: 'Monroe Cleaner', desc: 'A cheap solvent sold for floors, brass, and laundry. In the wrong recipe it becomes part of a far more dangerous poison base.', tags: ['chemical','solvent','household','poison ingredient'], meta: 'use: strong poison ingredient; vendor: general' },

// SCHEMATIC MATERIALS — Ferment
{ category: 'Schematic Materials', type: 'Ferment', name: 'Brewers Yeast', desc: 'A common fermenting culture used by cooks, brewers, and field chemists. When mixed properly with wine or mash, it can produce crude fuel stock.', tags: ['ferment','fuel','crafting','food-adjacent'], meta: 'use: fuel ingredient; vendor: general/herbal' },

// SCHEMATIC MATERIALS — Salt
{ category: 'Schematic Materials', type: 'Salt', name: 'Potassium Chloride', desc: 'A pale mineral salt used in laboratory paralysis compounds and nerve-disrupting mixtures. Useful, quiet, and grimly efficient.', tags: ['chemical','salt','paralysis ingredient'], meta: 'use: paralyzer ingredient; vendor: inventor' },

// SCHEMATIC MATERIALS — Solvent
{ category: 'Schematic Materials', type: 'Solvent', name: 'Aqua Vitae', desc: 'A potent distilled spirit used in medicines, poisons, fortifiers, and experimental extracts. It is equal parts solvent, stimulant, and trouble.', tags: ['chemical','solvent','alcohol','crafting'], meta: 'use: poison/hallucinite/fortifier ingredient; vendor: general/herbal' },

];
