// AbilityTree.jsx
// Drop-in tab for CharacterSheet.jsx
// Requires: char.abilities (string[]), char.abilityPending (string[]),
//           char.abilityOverrides (string[]), char.apCurrent, char.apTotal
// New Supabase columns needed: abilities text[], ability_pending text[], ability_overrides text[]
//
// Key format: "pathId|tier|className|abilityName"
// e.g.        "divine|t2|Cleric|Benediction"
//
// Integration steps:
//   1. Add this file to your project
//   2. In CharacterSheet.jsx add to TABS: { id: 'abilities', label: 'Abilities' }
//   3. In renderTab() case 'abilities': return <AbilityTree char={char} onUpdateChar={onUpdateChar} user={user} isDM={isDM} />
//   4. Pass isDM prop from your auth context (true if user has DM role)
//   5. In Supabase: ALTER TABLE characters ADD COLUMN abilities text[] DEFAULT '{}',
//                                          ADD COLUMN ability_pending text[] DEFAULT '{}',
//                                          ADD COLUMN ability_overrides text[] DEFAULT '{}';

import { useState, useMemo } from 'react';
import { COLORS } from './constants';
import { supabase } from './supabaseClient';

// ─── Ability tree data ────────────────────────────────────────────────────────

const TREE = {
  magic: [
    {
      id: 'divine', label: 'Divine', sublabel: 'Sanctus',
      base: { name: 'Inquisitor', lvl: '1–5', abilities: [
        { n: 'Soul Sense',        d: 'Detects presence, alignment, or disturbance in nearby beings or divine objects.' },
        { n: 'Resonant Touch',    d: 'Can interrupt casting, expose illusions, or mark a target.' },
        { n: 'Faith Enforcement', d: 'Imposes will of divine authority.' },
        { n: 'Edict of Silence',  d: 'Prevents casting, invocation, or certain actions temporarily.' },
        { n: 'Final Adjudication',d: 'Effect scales based on target state (weakened, exposed, marked).' },
      ]},
      t2: [
        { name: 'Cleric',  lvl: '5–10', abilities: [
          { n: 'Benediction',   d: 'Restores vitality or stabilizes a target, preventing further degradation.' },
          { n: 'Consecration',  d: 'Sanctifies an area, strengthening allies and weakening hostile forces within it.' },
          { n: 'Warding Light', d: 'Creates a protective barrier that absorbs or deflects incoming effects.' },
          { n: 'Purify',        d: 'Cleanses corruption, poison, or external influence from a target or zone.' },
          { n: 'Communion',     d: 'Channels sustained divine presence, amplifying allies and restoring over time.' },
        ]},
        { name: 'Paladin', lvl: '5–10', abilities: [
          { n: 'Oathbrand',      d: 'Marks a target or self with a binding oath, enhancing damage or resistance based on adherence.' },
          { n: 'Radiant Strike', d: 'Empowers weapon attacks with sanctified force, dealing additional radiant impact.' },
          { n: 'Aegis March',    d: 'Advances with a protective field, reducing incoming damage for self and nearby allies.' },
          { n: 'Vow Unbroken',   d: 'Temporarily prevents defeat, sustaining the Paladin through lethal thresholds.' },
          { n: 'Judgment Arc',   d: 'Releases stored conviction in a sweeping burst, striking multiple marked or nearby enemies.' },
        ]},
      ],
      t3: [
        { name: 'Augur',    lvl: '10–20', from: 'Cleric',  abilities: [
          { n: 'Omen Sight',         d: 'Reveals immediate future outcomes or hidden intent in a target or area.' },
          { n: 'Thread Reading',     d: 'Identifies the most likely path of action or consequence in a situation.' },
          { n: 'Forewarning',        d: 'Grants allies brief precognitive reactions, improving evasion or defense.' },
          { n: 'Fate Anchor',        d: 'Stabilizes a chosen outcome, reducing variance or preventing disruption.' },
          { n: 'Prophetic Collapse', d: 'Forces a predicted outcome onto a target, overriding their next action.' },
        ]},
        { name: 'Iridesce', lvl: '10–20', from: 'Paladin', abilities: [
          { n: 'Prismatic Veil',   d: 'Surrounds the caster in shifting light, distorting perception and reducing incoming effects.' },
          { n: 'Spectrum Lance',   d: 'Projects a focused beam of refracted energy with variable effects based on alignment or state.' },
          { n: 'Chromatic Divide', d: 'Splits an area into bands of influence, altering movement, damage, or perception across zones.' },
          { n: 'Refraction Step',  d: 'Moves through light, repositioning instantly between illuminated points.' },
          { n: 'Rite of Iridesce', d: 'Unleashes a multi-spectrum burst that adapts its effect to each affected target.' },
        ]},
      ],
    },
    {
      id: 'spiritual', label: 'Spiritual', sublabel: 'Sacral',
      base: { name: 'Zealot', lvl: '1–5', abilities: [
        { n: 'Ignition',     d: 'Enters a fervent state, increasing physical output and resistance at the cost of control.' },
        { n: 'Rite of Fury', d: 'Empowers the next actions with overwhelming force, breaking through defenses or resistance.' },
        { n: 'Vey Breach',   d: 'Tears open the boundary briefly, allowing spirit energy to surge into the physical space.' },
        { n: 'Possession',   d: 'Invites a volatile spirit into the body, granting power with unpredictable side effects.' },
        { n: 'Ascent',       d: 'Enters a spiritual rage, surrendering restraint for overwhelming fervor, endurance, and force.' },
      ]},
      t2: [
        { name: 'Shaman', lvl: '5–10', abilities: [
          { n: 'Totem',              d: 'Anchors a spirit to a location, granting persistent environmental effects.' },
          { n: 'Spirit Bargain',     d: 'Negotiates with a local spirit for a temporary boon or service.' },
          { n: 'Walk Between',       d: 'Phases partially into Mhattha, the spiritual plane, to reposition or avoid harm.' },
          { n: 'Host',               d: 'Channels a specific spirit lineage, gaining defined traits and abilities.' },
          { n: 'Primal Convergence', d: 'Calls multiple spirits into a controlled alignment for a large-scale effect.' },
        ]},
        { name: 'Bokor', lvl: '5–10', abilities: [
          { n: 'Hex Drawing',      d: "Applies a precise curse that alters a target's capabilities or outcomes." },
          { n: 'Vessel Link',      d: 'Binds a target to an object or effigy, transferring effects between them.' },
          { n: 'Grave Work',       d: 'Manipulates remains or lingering essence to produce obedient constructs.' },
          { n: 'Ritual Dominion',  d: 'Establishes control over an area through layered cursework and bindings.' },
          { n: 'Malison Sovereign',d: 'Unleashes a perfected curse that compounds and persists beyond normal limits.' },
        ]},
      ],
      t3: [
        { name: 'Caelyn',     lvl: '10–20', from: 'Shaman', abilities: [
          { n: 'Thread Sight',   d: 'Perceives underlying spiritual connections between entities.' },
          { n: 'Weave Step',     d: 'Moves along unseen connections, repositioning through linked points.' },
          { n: 'Pattern Hold',   d: 'Locks a state or condition in place, preventing change for a duration.' },
          { n: 'Dual Balance',   d: 'Redistributes effects between connected targets.' },
          { n: 'Weave Collapse', d: 'Forces all active connections to resolve simultaneously.' },
        ]},
        { name: 'Cursewright', lvl: '10–20', from: 'Bokor', abilities: [
          { n: 'Etch Sigil',      d: 'Inscribe a lasting curse onto a surface, object, or being.' },
          { n: 'Spread Malison',  d: 'Extends an existing curse to additional targets.' },
          { n: 'Blood Terms',     d: 'Strengthens a curse through sacrifice or cost.' },
          { n: 'Bound Decay',     d: 'Locks a target into a degrading state that cannot be easily removed.' },
          { n: 'Terminal Script', d: 'Finalizes all active cursework into a single decisive outcome.' },
        ]},
      ],
    },
    {
      id: 'arcane', label: 'Arcane', sublabel: 'Mana',
      base: { name: 'Weaver', lvl: '1–5', abilities: [
        { n: 'Arcane Sense',    d: 'Detects magical presence, active spells, and arcane disturbances.' },
        { n: 'Cantrip Mastery', d: 'Improves efficiency and potency of basic spells, allowing repeated low-cost casting.' },
        { n: 'Spell Threading', d: 'Refines casting structure, reducing miscasts and stabilizing complex spells.' },
        { n: 'Focus Channel',   d: 'Increases precision and control, improving range, targeting, or duration.' },
        { n: 'Spell Preparation',d:'Prepares structured spells in advance for faster, more reliable casting.' },
      ]},
      t2: [
        { name: 'Wizard', lvl: '5–10', abilities: [
          { n: 'Grimoire Binding', d: 'Stores and organizes spells within a spellbook, expanding accessible repertoire.' },
          { n: 'Ritual Casting',   d: 'Performs extended casts that produce powerful, sustained, or large-scale effects.' },
          { n: 'Counterspell',     d: 'Interrupts or negates incoming magical effects.' },
          { n: 'Spell Shaping',    d: 'Alters the area, form, or behavior of spells during casting.' },
          { n: 'Arcane Reserve',   d: 'Maintains a pool of stored mana for rapid or repeated casting.' },
        ]},
        { name: 'Magus', lvl: '5–10', abilities: [
          { n: 'Enchant Weapon',   d: 'Infuses a weapon with arcane energy for enhanced strikes.' },
          { n: 'Spellstrike',      d: 'Delivers a spell through a physical attack.' },
          { n: 'Arcane Deflection',d: 'Reduces or redirects incoming magical damage.' },
          { n: 'Battle Casting',   d: 'Allows casting without interrupting movement or combat flow.' },
          { n: 'Mana Surge',       d: 'Temporarily increases spell output at the cost of stability.' },
        ]},
      ],
      t3: [
        { name: 'Archmage',  lvl: '10–20', from: 'Wizard', abilities: [
          { n: 'Spell Matrix',        d: 'Maintains multiple prepared spells simultaneously for flexible casting.' },
          { n: 'Arcane Mastery',      d: 'Reduces cost and increases effectiveness across all spells.' },
          { n: 'Sigil Dominion',      d: 'Deploys layered runic effects that trigger under conditions.' },
          { n: 'Reality Edit',        d: 'Alters the outcome or properties of active spells.' },
          { n: 'Archmagus Ascension', d: 'Temporarily removes normal casting limits, enabling peak arcane output.' },
        ]},
        { name: 'Spellblade', lvl: '10–20', from: 'Magus', abilities: [
          { n: 'Arcane Edge',  d: 'Sustains magical enhancement on all attacks.' },
          { n: 'Phase Strike', d: 'Allows attacks to bypass armor or physical barriers.' },
          { n: 'Spell Parry',  d: 'Deflects incoming spells with weapon timing.' },
          { n: 'Dual Weave',   d: 'Combines simultaneous casting and melee execution.' },
          { n: 'Overdrive',    d: 'Unleashes combined arcane and physical force in a single decisive action.' },
        ]},
      ],
    },
    {
      id: 'wild', label: 'Wild', sublabel: 'Essence',
      base: { name: 'Druid', lvl: '1–5', abilities: [
        { n: 'Wildcall',        d: 'Calls upon nearby natural forces, beasts, plants, or terrain to respond with minor aid.' },
        { n: 'Essence Breath',  d: 'Channels living essence through breath, restoring vitality or releasing natural force.' },
        { n: "Nature's Mark",   d: 'Marks a creature, place, or object with natural significance, allowing tracking, bonding, or influence.' },
        { n: 'Rootbind',        d: 'Restrains a target through roots, vines, thorns, or terrain growth.' },
        { n: 'Feral Attunement',d: 'Temporarily heightens senses, movement, and instinct through communion with wild essence.' },
      ]},
      t2: [
        { name: 'Ovate', lvl: '5–10', abilities: [
          { n: 'Grove Rite',      d: 'Establishes a sacred natural area that restores allies and weakens unnatural intrusion.' },
          { n: 'Verdant Reading', d: 'Interprets signs in plants, weather, soil, and animal behavior.' },
          { n: 'Life Sap',        d: 'Draws vitality from the environment to heal, sustain, or empower.' },
          { n: 'Bloomward',       d: 'Creates a living barrier of bark, vine, moss, or flower that protects and regenerates.' },
          { n: 'Green Communion', d: "Communes deeply with a location's living memory, revealing what the land has witnessed." },
        ]},
        { name: 'Wild', lvl: '5–10', abilities: [
          { n: 'Beast Surge',    d: 'Channels animal ferocity into speed, strength, or predatory instinct.' },
          { n: 'Clawform',       d: 'Partially reshapes the body with natural weapons or beast traits.' },
          { n: 'Packcall',       d: 'Summons or rallies nearby beasts to assist, distract, or attack.' },
          { n: 'Hunting Trance', d: 'Locks onto prey, improving pursuit, perception, and striking force.' },
          { n: 'Apex Roar',      d: 'Unleashes primal dominance, frightening enemies and empowering allies.' },
        ]},
      ],
      t3: [
        { name: 'Dryad',    lvl: '10–20', from: 'Ovate', abilities: [
          { n: 'Living Bark',    d: 'Transforms skin or body into living wood, gaining protection and regeneration.' },
          { n: 'Thorncrown',     d: 'Surrounds the caster with a blooming crown of thorns that wounds attackers and empowers nature spells.' },
          { n: 'Root Sanctum',   d: 'Creates a sanctuary bound to the land, healing allies and resisting corruption.' },
          { n: 'Seed of Return', d: 'Plants a living essence-anchor that can restore or revive the caster under certain conditions.' },
          { n: 'Verdant Avatar', d: 'Becomes an embodiment of the grove, commanding growth, healing, and terrain.' },
        ]},
        { name: 'Primalist', lvl: '10–20', from: 'Wild', abilities: [
          { n: 'Predator Form',     d: 'Assumes a powerful bestial state with enhanced movement, senses, and attacks.' },
          { n: 'Blood Scent',       d: 'Tracks wounded or marked enemies with supernatural precision.' },
          { n: 'Savage Pounce',     d: 'Closes distance violently and strikes with overwhelming momentum.' },
          { n: 'Untamed Endurance', d: 'Resists pain, exhaustion, fear, and restraint through primal force.' },
          { n: 'Alpha Ascendant',   d: 'Embodies apex instinct, overpowering weaker foes and driving allies into coordinated ferocity.' },
        ]},
      ],
    },
    {
      id: 'runic', label: 'Runic', sublabel: 'Gnosis',
      base: { name: 'Sage', lvl: '1–5', abilities: [
        { n: 'Runic Literacy', d: 'Reads, identifies, and safely interprets basic runes, glyphs, and written magical structures.' },
        { n: 'Rune Attunement', d: "Aligns with a rune's intent, allowing it to be activated, stabilized, or resisted." },
        { n: 'Codex Focus',    d: 'Channels power through a written focus, improving precision and reducing casting strain.' },
        { n: 'Glyph Marking',  d: 'Places a simple glyph on a surface, object, or threshold to trigger a defined effect.' },
        { n: 'Script Recall',  d: 'Retrieves memorized runic forms quickly, allowing faster inscription or interpretation.' },
      ]},
      t2: [
        { name: 'Codexer', lvl: '5–10', abilities: [
          { n: 'Formula Script',   d: 'Combines written symbols into structured effects with predictable outcomes.' },
          { n: 'Lexicon Binding',  d: 'Links a spell effect to a word, phrase, or written command.' },
          { n: 'Annotated Casting',d: 'Modifies a spell through written notation, changing range, duration, or condition.' },
          { n: 'Codex Interdict',  d: 'Uses written authority to interrupt, restrict, or invalidate a magical effect.' },
          { n: 'Living Codex',     d: 'Maintains an active written record that updates as new symbols are encountered.' },
        ]},
        { name: 'Scribe', lvl: '5–10', abilities: [
          { n: 'Inscribe Ward',    d: 'Writes a protective rune onto a surface, object, or creature.' },
          { n: 'Sealing Script',   d: 'Locks, suppresses, or contains a magical effect through formal inscription.' },
          { n: 'Transfer Glyph',   d: 'Moves a stored rune effect from one surface or object to another.' },
          { n: 'Inkbound Reserve', d: 'Stores magical force in prepared ink, parchment, stone, or metal.' },
          { n: 'Trigger Seal',     d: 'Creates a delayed rune that activates when its condition is met.' },
        ]},
      ],
      t3: [
        { name: 'Glyphsage', lvl: '10–20', from: 'Codexer', abilities: [
          { n: 'Glyph Theory',     d: 'Understands advanced symbolic structures, improving all rune-based casting.' },
          { n: 'Symbol Dominion',  d: 'Rewrites active glyph behavior within range.' },
          { n: 'Recursive Array',  d: 'Creates linked glyphs that repeat or chain effects.' },
          { n: 'Prime Inscription',d: 'Places a master glyph that governs lesser runes in an area.' },
          { n: 'Archive Awakening',d: 'Animates a codex, tablet, or written archive into an active magical instrument.' },
        ]},
        { name: 'Runesiph', lvl: '10–20', from: 'Scribe', abilities: [
          { n: 'Siphon Mark',     d: 'Places a rune that drains magical energy from a target or object.' },
          { n: 'Break Script',    d: 'Disrupts active runes, seals, wards, or inscriptions.' },
          { n: 'Draining Array',  d: 'Creates a field that absorbs power from spells cast within it.' },
          { n: 'Null Ink',        d: 'Inscribes a suppressive rune that weakens magical effects over time.' },
          { n: 'Final Extraction',d: 'Consumes stored rune energy for a decisive burst, restoration, or shutdown.' },
        ]},
      ],
    },
    {
      id: 'mythic', label: 'Mythic', sublabel: 'Shaeid',
      base: { name: 'Mystic', lvl: '1–5', abilities: [
        { n: 'Light Sense',   d: 'Perceives underlying currents of power, soul presence, and unseen disturbances.' },
        { n: 'Trance',        d: 'Enters a focused internal state, heightening awareness, resistance, and spiritual clarity.' },
        { n: 'Mythic Echo',   d: 'Draws on residual imprints of past events or beings to influence the present moment.' },
        { n: 'Inner Conduit', d: 'Channels power through the self rather than an external source, stabilizing output.' },
        { n: 'Echo Release',  d: 'Unleashes stored mythic resonance in a controlled burst.' },
      ]},
      t2: [
        { name: 'Guardian',   lvl: '5–10', abilities: [
          { n: 'Warden Bastion',  d: 'Projects a protective aura that absorbs or redirects harm.' },
          { n: 'Anchor',          d: 'Prevents displacement, possession, or forced movement.' },
          { n: 'Intercept',       d: 'Redirects an incoming effect from an ally to self.' },
          { n: 'Resolve Manifest',d: 'Converts willpower into temporary resilience or restoration.' },
          { n: 'Last Vigil',      d: 'Remains active after defeat for a short duration, continuing to defend.' },
        ]},
        { name: 'Fatebinder', lvl: '5–10', abilities: [
          { n: 'Spoken Want',    d: 'Grants a minor boon to a target based on a stated desire; effect is literal and bound by intent.' },
          { n: 'Binding Word',   d: 'Locks a spoken agreement into place; both parties are compelled toward its terms.' },
          { n: 'Glamour Veil',   d: 'Overlays a target or area with fae illusion; perception of it shifts to match expectation.' },
          { n: 'Tithe Mark',     d: 'Extracts a small cost from a target in exchange for a granted effect; cost scales with desire.' },
          { n: 'True Name Sense',d: 'Detects the hidden name or nature of a being, object, or place; fae entities are fully revealed.' },
        ]},
      ],
      t3: [
        { name: 'Arcani',    lvl: '10–20', from: 'Guardian', abilities: [
          { n: 'Ichor',          d: 'Completes the soul-binding trial, awakening the Shaeid Light into its true mythic form.' },
          { n: 'Heart-Fae Form', d: 'Channels emotion through the Shaeid Light, making its form reactive to courage, grief, love, or instinct.' },
          { n: 'Mind-Fae Form',  d: 'Channels memory, foresight, and intention through the Shaeid Light for precise, strategic transformation.' },
          { n: 'Gatecut',        d: 'Opens a temporary Faetway passage between attuned locations.' },
          { n: 'Shaeid Arsenal', d: "The weapon becomes an echo of the Arcani's myth, evolving into an eternal light-form bound to the wielder." },
        ]},
        { name: 'Wishwright', lvl: '10–20', from: 'Fatebinder', abilities: [
          { n: 'Open Wish',         d: 'Grants a stated desire with full literal interpretation; unintended consequences are not prevented.' },
          { n: 'Wish Reversal',     d: 'Unravels a previously granted wish or spoken boon, restoring prior state at cost.' },
          { n: "Verdeli'ere Accord",d: 'Establishes a binding contract with a fae entity or willing target under ancient terms.' },
          { n: 'Glamour Sovereign', d: 'Reshapes perception of an entire area; what is seen, heard, and remembered can be altered.' },
          { n: 'Price Extracted',   d: 'Forces a target to pay a hidden cost for something they have already received or done.' },
        ]},
      ],
    },
    {
      id: 'shadow', label: 'Shadow', sublabel: 'Umbral',
      base: { name: 'Magister', lvl: '1–5', abilities: [
        { n: 'Echo Harvest',  d: 'Draws residual essence from the recently fallen, storing it for later use.' },
        { n: 'Grave Speech',  d: 'Communicates with lingering remnants to extract fragments of memory or intent.' },
        { n: 'Wraith Touch',  d: 'Channels umbral energy through contact, weakening vitality or binding motion.' },
        { n: 'Shade Veil',    d: 'Shrouds the caster in dim distortion, reducing detection and incoming precision.' },
        { n: 'Mortuary Keep', d: 'Stores harvested remnants from the dead for later use.' },
      ]},
      t2: [
        { name: 'Hemoclast', lvl: '5–10', abilities: [
          { n: 'Blood Rend',       d: 'Manipulates internal lifeforce to damage or destabilize a target.' },
          { n: 'Sanguine Channel', d: 'Converts personal vitality into power, enhancing spell output.' },
          { n: 'Vein Lock',        d: 'Restricts movement or action by seizing internal flow.' },
          { n: 'Crimson Reserve',  d: 'Stores drawn lifeforce for later release or recovery.' },
          { n: 'Exsanguinate',     d: 'Drains a target rapidly, transferring strength to the caster.' },
        ]},
        { name: 'Harrow', lvl: '5–10', abilities: [
          { n: 'Tether Shade',  d: 'Binds a spirit remnant to a target, applying persistent pressure or influence.' },
          { n: 'Gravebound',    d: 'Anchors a target in place through lingering essence.' },
          { n: 'Dirge Call',    d: 'Summons minor wraiths to harass, obscure, or weaken enemies.' },
          { n: 'Soul Fracture', d: "Splits a target's stability, increasing vulnerability to further effects." },
          { n: 'Revenant Rite', d: 'Raises a temporary servant from remains or residual presence.' },
        ]},
      ],
      t3: [
        { name: 'Necromancer', lvl: '10–20', from: 'Hemoclast', abilities: [
          { n: 'Legion Awakening',  d: 'Animates multiple constructs or remains under command.' },
          { n: 'Death Command',     d: 'Issues direct control orders to all summoned entities.' },
          { n: 'Essence Reclamation',d:'Reclaims energy from defeated units or targets.' },
          { n: 'Grave Domain',      d: 'Establishes an area where decay strengthens the caster.' },
          { n: 'Sovereign of Bones',d: 'Becomes the focal authority over all deathbound forces nearby.' },
        ]},
        { name: 'Darkweaver', lvl: '10–20', from: 'Harrow', abilities: [
          { n: 'Umbral Thread',    d: 'Links targets through shadow, sharing damage or effects.' },
          { n: 'Night Shroud',     d: 'Creates an area of heavy obscurity and distortion.' },
          { n: 'Phantom Duplicity',d: 'Generates shifting false forms to confuse and misdirect.' },
          { n: 'Void Pull',        d: 'Draws enemies inward toward a collapsing shadow point.' },
          { n: 'Darkweave',        d: 'Combines all active shadow effects into a single overwhelming manifestation.' },
        ]},
      ],
    },
  ],
  tech: [
    {
      id: 'commerce', label: 'Commerce', sublabel: 'Gain',
      base: { name: 'Merchant', lvl: '1–5', abilities: [
        { n: 'Point of Sale',  d: 'Creates a ledgered exchange point that records purchases, transfers, debt, ownership, and agreed value.' },
        { n: 'Ledger Seal',    d: 'Tags items, currency, and contracts with a verifiable mark; illusions, forgeries, and conjured goods fail verification.' },
        { n: 'Escrow Chest',   d: 'Holds value in trust; actions that exceed collateral are throttled or halted until covered.' },
        { n: 'Tariff Gate',    d: 'Establishes a checkpoint; effects that cross the boundary incur a cost or lose potency.' },
        { n: 'Provenance Tag', d: 'Assigns origin and ownership; stolen, duplicated, or fabricated assets are flagged and restricted.' },
      ]},
      t2: [
        { name: 'Emissary', lvl: '5–10', abilities: [
          { n: 'Contract Press',   d: 'A device that imprints binding terms onto documents or participants.' },
          { n: 'Credit Ledger',    d: 'A carried or installed account system that extends value and tracks debt.' },
          { n: 'Safe Conduct Pass',d: 'A forged or issued token granting protected movement and limited immunity.' },
          { n: 'Sanction Register',d: 'A maintained blacklist ledger that suppresses flagged entities or actions.' },
          { n: 'Supply Array',     d: 'A routed network of crates, routes, or depots that controls resource flow.' },
        ]},
        { name: 'Diplomat', lvl: '5–10', abilities: [
          { n: 'Mediation Table',   d: 'A constructed table or chamber that enforces non-hostile resolution conditions.' },
          { n: 'Protocol Charter',  d: 'A written charter that dictates allowed conduct within its jurisdiction.' },
          { n: 'Reputation Ledger', d: 'A tracked record system that influences outcomes based on standing.' },
          { n: 'Concession Contract',d:'A drafted agreement that forces trade-offs when invoked.' },
          { n: 'Alliance Seal',     d: 'A forged pact artifact linking parties under shared terms.' },
        ]},
      ],
      t3: [
        { name: 'Tycoon',     lvl: '10–20', from: 'Emissary', abilities: [
          { n: 'Monopoly Registry', d: 'A central record system that grants exclusive control over resources or services.' },
          { n: 'Capital Engine',    d: 'A built mechanism that converts stored wealth into defense or mitigation.' },
          { n: 'Market Halt Switch',d: 'A control device that freezes trade and exchange within its network.' },
          { n: 'Price Floor Index', d: 'A pricing engine that enforces minimum cost thresholds.' },
          { n: 'Trade Dominion Hub',d: 'A central node that governs regional exchange, taxation, and access.' },
        ]},
        { name: 'Negotiator', lvl: '10–20', from: 'Diplomat', abilities: [
          { n: 'Terms Charter',      d: 'A document or device that defines allowed actions within its scope.' },
          { n: 'Binding Contract',   d: 'A sealed agreement that enforces compliance and punishes violation.' },
          { n: 'Breach Trigger',     d: 'A prepared clause or device that activates when conditions are broken.' },
          { n: 'Settlement Engine',  d: 'A system that converts conflict into enforceable outcomes.' },
          { n: 'Grand Accord Archive',d:'A master treaty construct that binds multiple factions under shared constraints.' },
        ]},
      ],
    },
    {
      id: 'martial', label: 'Martial', sublabel: 'Grit',
      base: { name: 'Fighter', lvl: '1–5', abilities: [
        { n: 'Grit Reservoir', d: 'A worn module that stores excess exertion and releases it to sustain the wearer during strain.' },
        { n: 'Second Wind Kit',d: 'A compact recovery rig that restores vitality mid-combat.' },
        { n: 'Anchor Harness', d: 'A strapped system that resists forced movement and stabilizes stance.' },
        { n: 'Guard Plating',  d: 'Segmented armor that converts heavy hits into reduced sustained damage.' },
        { n: 'Weapon Balancer',d: 'A mechanical tuning system that improves strike consistency and control.' },
      ]},
      t2: [
        { name: 'Barbarian',   lvl: '5–10', abilities: [
          { n: 'Rage Conduit',  d: 'A forged focus that converts damage taken into increased physical output.' },
          { n: 'Blood Reserve', d: 'A storage system that delays or redistributes incoming damage over time.' },
          { n: 'War Totem',     d: 'A carried object that amplifies aggression and resilience under pressure.' },
          { n: 'Impact Gauntlets',d:'Heavy striking gear that breaks through armor and defensive constructs.' },
          { n: 'Charge Harness',d: 'A reinforced rig that increases force during forward momentum.' },
        ]},
        { name: 'Swashbuckler', lvl: '5–10', abilities: [
          { n: 'Duelist Frame',    d: 'A lightweight rig that enhances speed, precision, and recovery between actions.' },
          { n: 'Riposte Mechanism',d: 'A reactive tool that converts successful defense into immediate counterattack.' },
          { n: 'Mobility Boots',   d: 'Engineered footwear that enables rapid repositioning and escape.' },
          { n: 'Disarm Toolset',   d: 'A weapon attachment system designed to strip or control enemy gear.' },
          { n: 'Feint Device',     d: 'A misdirection tool that disrupts targeting and timing.' },
        ]},
      ],
      t3: [
        { name: 'Marauder', lvl: '10–20', from: 'Barbarian', abilities: [
          { n: 'Boarding Harness',d: 'A combat rig built for climbing, swinging, bracing, and fighting across ships, docks, and unstable ground.' },
          { n: 'Breaching Hooks', d: 'Heavy hooks and chained tools used to board vessels, tear barriers open, or drag enemies out of position.' },
          { n: 'Cutlass Frame',   d: 'A reinforced weapon assembly built for close-quarters slashing, parrying, and rapid follow-through.' },
          { n: 'Plunder Rig',     d: 'A carried system for securing stolen goods, disarming containers, and extracting valuables under pressure.' },
          { n: 'Blackflag Cache', d: 'A hidden or portable store of weapons, smoke, powder, rope, and emergency supplies for raids or escapes.' },
        ]},
        { name: 'Knight',   lvl: '10–20', from: 'Swashbuckler', abilities: [
          { n: 'Fortress Core',    d: 'A central armor system that massively increases durability and stability.' },
          { n: 'War Banner',       d: 'A plantable standard that reinforces allied endurance and resolve.' },
          { n: 'Shield Wall Array',d: 'A deployable formation system that strengthens group defense.' },
          { n: 'Guard Command Rig',d: 'A control harness that redirects damage away from allies.' },
          { n: 'Last Stand Core',  d: 'An emergency system that sustains operation past normal failure thresholds.' },
        ]},
      ],
    },
    {
      id: 'antimagic', label: 'Anti-Magic', sublabel: 'Focus',
      base: { name: 'Vanguard', lvl: '1–5', abilities: [
        { n: 'Null Shroud',      d: 'A worn dampening mantle that weakens active magical detection and resonance targeting.' },
        { n: 'Grounding Spike',  d: 'A forged anchor driven into earth, stone, or metal to discharge hostile magical force.' },
        { n: 'Resistance Plate', d: 'Armor plating that disperses arcane, divine, and spiritual impact across the body.' },
        { n: 'Resonance Mirror', d: 'A polished counterplate that reflects a weakened portion of incoming magical force.' },
        { n: 'Stonelock Brace',  d: 'A bracing mechanism that prevents forced movement, levitation, possession, or displacement.' },
      ]},
      t2: [
        { name: 'Sentine', lvl: '5–10', abilities: [
          { n: 'Sentinal Bulwark',d: 'A reinforced armor scaffold that expands protection to nearby allies.' },
          { n: 'Null Standard',   d: 'A planted field banner that suppresses hostile spell strength within its radius.' },
          { n: 'Grounding Grid',  d: 'A deployed network of rods and wire that prevents teleportation, summoning, and spectral passage.' },
          { n: 'Severance Clamp', d: "A locking device that weakens an enemy's connection to an active spell, focus, or pact." },
          { n: 'Bulwark Relay',   d: "A linked armor node that redirects magical impact from allies into the Sentine's defenses." },
        ]},
        { name: 'Null', lvl: '5–10', abilities: [
          { n: 'Ritecore Socket', d: 'A spinal interface housing that prepares the body for deeper severance and Whythryn integration.' },
          { n: 'Silence Gauntlet',d: 'A heavy gauntlet that interrupts spellcasting, focus use, and touch-based magic.' },
          { n: 'Null Brands',     d: 'Forged body-marks or embedded plates that reduce attunement to magic, spirits, and divine influence.' },
          { n: 'Counterweight Core',d:'A dense internal stabilizer that resists transformation, charm, fear, and forced alteration.' },
          { n: 'Cogmail Harness', d: 'A partial Whythryn armor rig that strengthens the body while suppressing magical dependency.' },
        ]},
      ],
      t3: [
        { name: 'Warden', lvl: '10–20', from: 'Sentine', abilities: [
          { n: 'Warden Plate',      d: 'A full defensive armor system that protects the wearer and stabilizes allies against magical force.' },
          { n: 'Spellbreak Pylon',  d: 'A deployable tower that disrupts sustained spell effects within its field.' },
          { n: 'Anchor Circle',     d: 'A constructed perimeter that prevents magical entry, exit, summoning, and planar interference.' },
          { n: 'Reflection Engine', d: 'A built counterforce mechanism that redirects a portion of incoming spell energy.' },
          { n: 'Groundlaw Bastion', d: 'A fortified anti-magic installation that imposes material rules over a defended zone.' },
        ]},
        { name: 'Whyth', lvl: '10–20', from: 'Null', abilities: [
          { n: 'Ritecore Plug',      d: 'A permanent spinal implant created through the Rite of Binding, severing spiritual and magical connection.' },
          { n: 'Whythryn Cogmail',  d: 'A full armor system that makes the wearer highly resistant to magical, divine, and spiritual effects.' },
          { n: 'Whythryn Cudgel',   d: 'A transforming weapon built to break enchanted armor, spell barriers, and resonance-bound constructs.' },
          { n: 'Stone and Shape Seal',d:'A forged oath-plate that reinforces material self-determination and rejects outside influence.' },
          { n: 'Grimroot Grounding', d: 'A final grounding apparatus that roots the Whyth fully in the material world, suppressing magic through presence.' },
        ]},
      ],
    },
    {
      id: 'alchemic', label: 'Alchemic', sublabel: 'Matter',
      base: { name: 'Alchemist', lvl: '1–5', abilities: [
        { n: 'Volatile Brew',   d: 'A prepared flask that releases unstable chemical force on impact or exposure.' },
        { n: 'Catalyst Vial',   d: 'A stored reagent that accelerates, strengthens, or alters another alchemical schematic.' },
        { n: 'Toxin Canister',  d: 'A sealed container that releases poison, gas, or irritant compounds into a controlled area.' },
        { n: 'Reaction Clamp',  d: 'A stabilizing tool that delays detonation, prevents contamination, or contains unstable matter.' },
        { n: 'Infusion Ampoule',d: 'A breakable vessel that temporarily alters flesh, gear, or material behavior.' },
      ]},
      t2: [
        { name: 'Mutagenist', lvl: '5–10', abilities: [
          { n: 'Mutagen Syringe',     d: 'An injectable compound that alters strength, speed, or resilience temporarily.' },
          { n: 'Flesh Graft Kit',     d: 'A surgical toolset used to attach, reinforce, or modify living tissue.' },
          { n: 'Adaptive Serum',      d: 'A prepared dose that grants resistance to a chosen hazard or condition.' },
          { n: 'Stabilization Harness',d:'A support rig that prevents mutation collapse or bodily rejection.' },
          { n: 'Regenesis Vat',       d: 'A containment vessel that accelerates tissue repair and biological recovery.' },
        ]},
        { name: 'Bombardier', lvl: '5–10', abilities: [
          { n: 'Blast Charge',  d: 'A prepared explosive designed to destroy barriers, armor, machinery, or clustered enemies.' },
          { n: 'Acid Flask',    d: 'A corrosive vessel that breaks down metal, stone, locks, armor, or organic matter.' },
          { n: 'Smoke Canister',d: 'A deployable screen that blocks vision, scent, and targeting.' },
          { n: 'Chain Reactor', d: 'A rigged compound that spreads detonation through nearby volatile materials.' },
          { n: 'Pressure Mine', d: 'A planted device that triggers when stepped on, opened, moved, or disturbed.' },
        ]},
      ],
      t3: [
        { name: 'Biomancer', lvl: '10–20', from: 'Mutagenist', abilities: [
          { n: 'Gene Crucible',    d: 'A laboratory vessel used to refine traits from harvested biological material.' },
          { n: 'Chimera Graft',    d: 'A permanent or semi-permanent biological modification that grants inherited traits.' },
          { n: 'Organ Engine',     d: 'A cultivated internal implant that improves endurance, healing, or resistance.' },
          { n: 'Living Armature',  d: 'A grown biological support structure that reinforces the body during mutation.' },
          { n: 'Perfected Mutagen',d: 'A stabilized apex compound that allows controlled transformation without immediate bodily failure.' },
        ]},
        { name: 'Saboteur', lvl: '10–20', from: 'Bombardier', abilities: [
          { n: 'Cataclysm Bomb', d: 'A high-yield explosive device built for structural destruction and battlefield denial.' },
          { n: 'Toxin Swarm',    d: 'A cluster of dispersal pods that spreads poison, acid, smoke, or disease across an area.' },
          { n: 'Deadman Trigger',d: 'A concealed trigger system that activates when the user falls, flees, or gives a signal.' },
          { n: 'Sabotage Kit',   d: 'A specialized toolkit for disabling engines, locks, weapons, armor, gates, and schematics.' },
          { n: 'Collapse Array', d: 'A planted network of charges designed to bring down structures, tunnels, bridges, or fortified zones.' },
        ]},
      ],
    },
    {
      id: 'academic', label: 'Academic', sublabel: 'Ingenuity',
      base: { name: 'Scholar', lvl: '1–5', abilities: [
        { n: 'Recall Box',     d: 'A prepared reference sheet or mnemonic overlay that restores forgotten details, names, routes, symbols, or tactical facts.' },
        { n: 'Field Journal',  d: 'A durable research book that records observations, weaknesses, terrain notes, and discovered patterns for later use.' },
        { n: 'Survey Lens',    d: 'A handheld optical tool that reveals distance, structure, tracks, hidden markings, and battlefield angles.' },
        { n: 'Annotation Slate',d:'A reusable writing board that marks targets, hazards, objectives, or routes for allies to follow.' },
        { n: 'Relic Index',    d: 'A cataloging system that identifies artifacts, mechanisms, inscriptions, and historical objects.' },
      ]},
      t2: [
        { name: 'Tactician',   lvl: '5–10', abilities: [
          { n: 'Battle Map',         d: 'A prepared tactical board that marks enemy movement, ally placement, cover, routes, and attack lanes.' },
          { n: 'Foresight Maneuver', d: 'A written combat sequence that can be revealed later to alter positioning, timing, or defensive response.' },
          { n: 'Signal Kit',         d: 'Flags, whistles, mirrors, or hand signs used to coordinate allies across distance or noise.' },
          { n: 'Formation Guide',    d: 'A drilled instruction set that strengthens allies when they hold formation or follow assigned roles.' },
          { n: 'Counterplan Dossier',d: 'A prepared file on enemy habits, weaknesses, routes, and likely tactics.' },
        ]},
        { name: 'Cartographer', lvl: '5–10', abilities: [
          { n: 'Wayfinder Map',   d: 'A crafted map that improves navigation and reveals safe routes, hazards, and hidden passages.' },
          { n: 'Terrain Plate',   d: 'A portable relief model of nearby land, structures, or ruins used to plan movement and avoid traps.' },
          { n: 'Survey Compass',  d: 'A calibrated compass that locates landmarks, ruins, relic traces, mineral deposits, or route anomalies.' },
          { n: 'Boundary Markers',d: 'Placed stakes, chalks, cords, or signs that define safe zones, paths, perimeters, or surveyed ground.' },
          { n: 'Expedition Cache',d: 'A prepared supply store hidden or carried for later retrieval in the field.' },
        ]},
      ],
      t3: [
        { name: 'Strategist', lvl: '10–20', from: 'Tactician', abilities: [
          { n: 'War Table',         d: 'A command installation that coordinates allies, formations, routes, reserves, and battlefield priorities.' },
          { n: 'Campaign Dossier',  d: 'A master file that tracks roster resources and faction movements.' },
          { n: 'Command Standard',  d: 'A planted signal banner that organizes allied movement and prevents panic or disorder.' },
          { n: 'Contingency Folio', d: 'A sealed set of prepared fallback plans that can be opened when a battle or mission turns.' },
          { n: 'Grand Stratagem',   d: 'A complete operational plan that changes the conditions of an encounter, siege, pursuit, or negotiation.' },
        ]},
        { name: 'Archivist', lvl: '10–20', from: 'Cartographer', abilities: [
          { n: 'Reliquary',       d: 'A widened secured storage system for artifacts, rare texts, schematics, maps, and historical devices.' },
          { n: 'Master Catalogue',d: 'A comprehensive index that cross-references relics, regions, factions, languages, and known threats.' },
          { n: 'Translation Engine',d:'A built decoding apparatus that converts lost scripts, symbolic systems, and ciphered records.' },
          { n: 'History Cylinder',d: 'A preserved record device that stores testimony, images, maps, or reconstructed events.' },
          { n: 'Archival Seal',   d: 'A protective mark or casing that preserves fragile knowledge and prevents tampering, decay, or theft.' },
        ]},
      ],
    },
    {
      id: 'covert', label: 'Covert', sublabel: 'Fortitude',
      base: { name: 'Rogue', lvl: '1–5', abilities: [
        { n: 'Adept Lockpick Set',d: 'A portable tool set for opening locks, disabling catches, and bypassing simple mechanisms.' },
        { n: 'Smoke Pellet',      d: 'A thrown device that creates cover for escape, infiltration, or repositioning.' },
        { n: 'Silent Sole',       d: 'Modified footwear that reduces noise and improves stealth movement.' },
        { n: 'Spring Blade',      d: 'A concealed weapon mechanism built for sudden precision strikes.' },
        { n: 'Climbing Line',     d: 'A compact grapnel, cord, and hook system used to scale walls, cross gaps, or enter guarded spaces.' },
      ]},
      t2: [
        { name: 'Inspector', lvl: '5–10', abilities: [
          { n: "Inspector's Scope",   d: 'A crafted lens that reveals scratches, residues, hidden seams, forged marks, and tampered objects.' },
          { n: 'Evidence Kit',        d: 'A case of powders, vials, wax, thread, and tags used to preserve traces for later analysis.' },
          { n: 'Falsehood Register',  d: 'A written comparison file of statements, signatures, accounts, and contradictions.' },
          { n: 'Scene Grid',          d: 'A deployable cord-and-marker layout used to reconstruct movement, angle, timing, and position.' },
          { n: 'Trace Evidence Canister',d:'A sealed container for carrying hair, ash, blood, soil, fiber, residue, or other evidence without contamination.' },
        ]},
        { name: 'Ranger', lvl: '5–10', abilities: [
          { n: 'Trail Markers',    d: 'Subtle placed signs that guide allies, confuse pursuers, or mark danger.' },
          { n: 'Camouflage Cloak',d: 'A crafted cloak adapted to terrain, light, foliage, dust, or stone.' },
          { n: 'Snare Kit',        d: 'A carried set of wire, stakes, hooks, and triggers for catching, slowing, or warning.' },
          { n: 'Field Glass',      d: 'A compact optical tool for scouting, rangefinding, and identifying threats at distance.' },
          { n: "Ranger's Cache",   d: 'A hidden supply bundle prepared for later recovery in hostile or remote terrain.' },
        ]},
      ],
      t3: [
        { name: 'Detective', lvl: '10–20', from: 'Inspector', abilities: [
          { n: 'Caseboard',         d: 'A portable or installed board that links suspects, motives, routes, objects, and contradictions.' },
          { n: 'Autopsy Roll',      d: 'A specialized tool wrap for examining wounds, cause of death, poison, disease, or unnatural damage.' },
          { n: 'Interrogation Lamp',d: 'A focused lamp-and-seat apparatus used to pressure testimony and expose inconsistencies.' },
          { n: 'Undercover Kit',    d: 'A prepared disguise, credential, accent guide, and forged identity package.' },
          { n: 'Chain of Evidence', d: 'A sealed documentation system that makes gathered proof difficult to dismiss, alter, or destroy.' },
        ]},
        { name: 'Strider', lvl: '10–20', from: 'Ranger', abilities: [
          { n: 'Phantom Cloak',    d: 'A high-grade stealth cloak that breaks outline, muffles movement, and resists detection.' },
          { n: 'Roofrunner Rig',   d: 'A harness, hooks, reels, and grips system for rapid vertical movement.' },
          { n: 'Shadow Cache',     d: 'A hidden stash network placed across routes, safehouses, rooftops, or wilderness paths.' },
          { n: 'Vanishing Dust',   d: 'A prepared powder that obscures tracks, scent, fingerprints, and residue.' },
          { n: "Strider's Pathkit",d: 'A complete infiltration kit for bypassing walls, locks, patrols, terrain, and pursuit.' },
        ]},
      ],
    },
    {
      id: 'artifice', label: 'Artifice', sublabel: 'Reason',
      base: { name: 'Artificer', lvl: '1–5', abilities: [
        { n: 'Grimrite Spark', d: 'A compact ignition core used to power small devices, trigger mechanisms, and improvised inventions.' },
        { n: 'Field Repair Kit',d: 'A portable toolkit for restoring damaged weapons, armor, devices, vehicles, and schematics.' },
        { n: 'Infusion Clamp', d: 'A mechanical brace that temporarily improves a weapon, tool, or piece of armor.' },
        { n: 'Clockwork Key',  d: 'A wound mechanism that activates simple machines, locks, timers, and stored devices.' },
        { n: 'Utility Bracer', d: 'A wrist-mounted tool rig containing small blades, wire, lenses, picks, and deployable gadgets.' },
      ]},
      t2: [
        { name: 'Gunslinger', lvl: '5–10', abilities: [
          { n: 'Firearm Grit',      d: 'A reinforced firearm assembly built to endure repeated high-pressure shots.' },
          { n: 'Trickshot Cylinder',d: 'A rotating chamber that stores specialized rounds for cover-breaking, disarming, pinning, or ricochet fire.' },
          { n: 'Quickdraw Holster', d: 'A spring-loaded holster designed for rapid draw, reload, and weapon readiness.' },
          { n: 'Powder Baffle',     d: 'A barrel attachment that reduces recoil, flash, smoke, and misfire risk.' },
          { n: 'Deadeye Scope',     d: 'A precision sight that improves range, target reading, and weak-point accuracy.' },
        ]},
        { name: 'Tinkerer', lvl: '5–10', abilities: [
          { n: 'Clockwork Familiar',d: 'A small constructed assistant used for carrying, repairing, scouting, or manipulating simple objects.' },
          { n: 'Gearwork Bench',    d: 'A portable workbench that improves crafting, repair, assembly, and schematic modification.' },
          { n: 'Springloaded Arm',  d: 'A mounted tool-limb used for gripping, lifting, striking, or operating mechanisms at reach.' },
          { n: 'Remote Relay',      d: 'A signal device that allows simple constructs or machines to receive commands at distance.' },
          { n: 'Automaton Core',    d: 'A crafted control center used to animate, direct, or stabilize constructed machines.' },
        ]},
      ],
      t3: [
        { name: 'Thaumaturge', lvl: '10–20', from: 'Gunslinger', abilities: [
          { n: 'Hybrid Forge',        d: 'A built forge-unit that combines mechanism and controlled resonance to reproduce studied effects through devices.' },
          { n: 'Resonance Battery',   d: 'A charge cell that stores power for later release into firearms, tools, armor, or constructs.' },
          { n: 'Spellcartridge Press',d: 'A loading press that creates specialized ammunition carrying contained arcane effects.' },
          { n: 'Overcharge Coil',     d: "A wound power system that doubles a device's output while risking burnout." },
          { n: 'Thaumic Regulator',   d: 'A stabilizing apparatus that prevents resonance devices from misfiring, overloading, or collapsing.' },
        ]},
        { name: 'Machinist', lvl: '10–20', from: 'Tinkerer', abilities: [
          { n: 'Exosuit Titan',          d: 'A large mechanical suit that increases strength, protection, speed, and built-in weapon capacity.' },
          { n: 'Veinrunner Command Node',d: 'A control interface for directing vehicles, engines, constructs, or industrial machines.' },
          { n: 'Piston Armature',        d: 'A powered limb-frame that enhances lifting, striking, bracing, and tool operation.' },
          { n: 'Ironwork Drone',         d: 'A durable construct assistant built for labor, defense, repair, and battlefield support.' },
          { n: 'Masterwork Engine',      d: 'A central power unit that sustains large machines, exosuits, workshops, or linked schematics.' },
        ]},
      ],
    },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeKey(pathId, tier, className, abilityName) {
  return `${pathId}|${tier}|${className}|${abilityName}`;
}

function tierCost(tier) {
  if (tier === 'base') return 0;
  if (tier === 't2')   return 2;
  return 3;
}

// Magic path ids pull slider toward magic (-), tech toward tech (+)
const MAGIC_PATH_IDS = new Set(TREE.magic.map(p => p.id));

function sliderNudge(pathId) {
  return MAGIC_PATH_IDS.has(pathId) ? -0.25 : 0.25;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const MC = COLORS.magic   || '#7B68D8';
const TC = COLORS.tech    || '#2D9E7A';
const MTX = COLORS.magicText || '#9B8FE8';
const TTX = COLORS.techText  || '#3DBF93';
const WARN = COLORS.warn  || '#D4845A';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function AbilityRow({ abilityKey, name, desc, status, cost, canSpend, isDM, onSpend, onApprove, onBuyback }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = status === 'unlocked' ? TC
    : status === 'pending'  ? COLORS.deity || '#C4A35A'
    : status === 'override' ? WARN
    : COLORS.dim;

  const statusLabel = status === 'unlocked' ? 'Unlocked'
    : status === 'pending'  ? 'Pending'
    : status === 'override' ? 'DM Override'
    : null;

  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '0' }}>
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0', cursor: 'pointer' }}
      >
        {/* Status dot */}
        <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: statusColor, opacity: status ? 1 : 0.25, border: status ? 'none' : `1px solid ${COLORS.dim}` }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: status ? COLORS.text : COLORS.dim, letterSpacing: '0.04em' }}>{name}</span>
            {statusLabel && (
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: statusColor, fontFamily: "'Cinzel', serif", background: `${statusColor}18`, border: `1px solid ${statusColor}44`, borderRadius: 3, padding: '1px 5px' }}>
                {statusLabel}
              </span>
            )}
          </div>
        </div>

        {/* Cost badge for locked abilities */}
        {!status && cost > 0 && (
          <span style={{ fontSize: 9, color: COLORS.muted, fontFamily: 'Georgia, serif', flexShrink: 0 }}>{cost}pt</span>
        )}
        <span style={{ fontSize: 9, color: COLORS.dim, flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ paddingBottom: 10, paddingLeft: 15 }}>
          <p style={{ fontSize: 12, color: COLORS.textSub || COLORS.muted, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: '0 0 10px' }}>{desc}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Player: spend to unlock */}
            {!status && canSpend && cost > 0 && (
              <button onClick={(e) => { e.stopPropagation(); onSpend(abilityKey, cost); }}
                style={{ fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: MTX, background: `${MC}18`, border: `1px solid ${MC}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                Spend {cost}pt → Request
              </button>
            )}
            {/* DM: approve pending */}
            {isDM && status === 'pending' && (
              <button onClick={(e) => { e.stopPropagation(); onApprove(abilityKey); }}
                style={{ fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: TTX, background: `${TC}18`, border: `1px solid ${TC}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                ✓ Approve
              </button>
            )}
            {/* DM: buyback (remove unlocked) */}
            {isDM && (status === 'unlocked' || status === 'override') && (
              <button onClick={(e) => { e.stopPropagation(); onBuyback(abilityKey, cost); }}
                style={{ fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: WARN, background: `${WARN}18`, border: `1px solid ${WARN}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                ✕ Buyback
              </button>
            )}
            {/* DM: force unlock */}
            {isDM && !status && (
              <button onClick={(e) => { e.stopPropagation(); onApprove(abilityKey, true); }}
                style={{ fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: WARN, background: `${WARN}18`, border: `1px solid ${WARN}55`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
                DM Grant
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ClassBlock({ path, tier, cls, fromLabel, axisColor, axisText, statusOf, canSpend, isDM, onSpend, onApprove, onBuyback }) {
  const [open, setOpen] = useState(false);
  const cost = tierCost(tier);

  const anyUnlocked = cls.abilities.some(a => {
    const s = statusOf(makeKey(path.id, tier, cls.name, a.n));
    return s === 'unlocked' || s === 'pending' || s === 'override';
  });

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${axisColor}22`, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: axisText, letterSpacing: '0.05em' }}>{cls.name}</span>
            <span style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Lvl {cls.lvl}</span>
            {fromLabel && <span style={{ fontSize: 8, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>← {fromLabel}</span>}
          </div>
          {tier !== 'base' && (
            <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>{cost}pt per ability</div>
          )}
        </div>
        {anyUnlocked && <div style={{ width: 6, height: 6, borderRadius: '50%', background: axisColor, flexShrink: 0 }} />}
        <span style={{ fontSize: 9, color: COLORS.dim }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '4px 12px 4px' }}>
          {cls.abilities.map(a => {
            const key = makeKey(path.id, tier, cls.name, a.n);
            const status = statusOf(key);
            return (
              <AbilityRow
                key={key}
                abilityKey={key}
                name={a.n}
                desc={a.d}
                status={status}
                cost={cost}
                canSpend={canSpend}
                isDM={isDM}
                onSpend={onSpend}
                onApprove={onApprove}
                onBuyback={onBuyback}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function PathSection({ path, axis, statusOf, canSpend, isDM, onSpend, onApprove, onBuyback }) {
  const [open, setOpen] = useState(false);
  const col  = axis === 'magic' ? MC : TC;
  const txt  = axis === 'magic' ? MTX : TTX;

  const totalUnlocked = [
    ...path.t2.flatMap(c => c.abilities),
    ...path.t3.flatMap(c => c.abilities),
  ].filter(a => {
    const parent = axis === 'magic'
      ? [...path.t2, ...path.t3].find(c => c.abilities.includes(a))
      : [...path.t2, ...path.t3].find(c => c.abilities.includes(a));
    return parent && (statusOf(makeKey(path.id, parent === path.t2.find(c=>c.abilities.includes(a)) ? 't2' : 't3', parent?.name, a.n)) === 'unlocked');
  }).length;

  return (
    <div style={{ marginBottom: 12 }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', cursor: 'pointer', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ width: 3, height: 24, borderRadius: 2, background: col, flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: txt, letterSpacing: '0.06em' }}>{path.label}</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{path.sublabel}</div>
        </div>
        <span style={{ fontSize: 9, color: COLORS.dim }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ paddingTop: 10 }}>
          {/* Base tier label */}
          <div style={{ ...label8(), marginBottom: 6 }}>Tier 1 — Base Class · Free</div>
          <ClassBlock path={path} tier="base" cls={path.base} axisColor={col} axisText={txt} statusOf={statusOf} canSpend={false} isDM={isDM} onSpend={onSpend} onApprove={onApprove} onBuyback={onBuyback} />

          <div style={{ ...label8(), marginBottom: 6, marginTop: 12 }}>Tier 2 · 2pt per ability</div>
          {path.t2.map(cls => (
            <ClassBlock key={cls.name} path={path} tier="t2" cls={cls} axisColor={col} axisText={txt} statusOf={statusOf} canSpend={canSpend} isDM={isDM} onSpend={onSpend} onApprove={onApprove} onBuyback={onBuyback} />
          ))}

          <div style={{ ...label8(), marginBottom: 6, marginTop: 12 }}>Tier 3 · 3pt per ability</div>
          {path.t3.map(cls => (
            <ClassBlock key={cls.name} path={path} tier="t3" cls={cls} fromLabel={cls.from} axisColor={col} axisText={txt} statusOf={statusOf} canSpend={canSpend} isDM={isDM} onSpend={onSpend} onApprove={onApprove} onBuyback={onBuyback} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AbilityTree({ char, onUpdateChar, user, isDM = false }) {
  const [saving, setSaving] = useState(false);
  const [notice, setNotice]  = useState(null);
  const [macroTab, setMacroTab] = useState('magic');

  // Normalise arrays from char (Supabase may return null)
  const abilities       = useMemo(() => char.abilities        || [], [char.abilities]);
  const abilityPending  = useMemo(() => char.abilityPending   || [], [char.abilityPending]);
  const abilityOverrides= useMemo(() => char.abilityOverrides || [], [char.abilityOverrides]);

  const apCurrent = char.apCurrent || 0;
  const apTotal   = char.apTotal   || 0;

  // Points spent on pending (already deducted from apCurrent on spend)
  const pendingCost = useMemo(() => {
    return abilityPending.reduce((sum, key) => {
      const tier = key.split('|')[1];
      return sum + tierCost(tier);
    }, 0);
  }, [abilityPending]);

  function statusOf(key) {
    if (abilityOverrides.includes(key))  return 'override';
    if (abilities.includes(key))         return 'unlocked';
    if (abilityPending.includes(key))    return 'pending';
    return null;
  }

  function canSpend() {
    return apCurrent > 0;
  }

  async function persist(patch) {
    setSaving(true);
    try {
      const merged = { ...char, ...patch };
      const { error } = await supabase
        .from('characters')
        .update(patch)
        .eq('id', char.id);
      if (error) throw error;
      onUpdateChar(merged);
    } catch (e) {
      setNotice({ type: 'error', msg: e.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  }

  function flash(msg, type = 'ok') {
    setNotice({ type, msg });
    setTimeout(() => setNotice(null), 3200);
  }

  // Player requests an ability
  async function handleSpend(key, cost) {
    if (apCurrent < cost) { flash(`Not enough AP. Need ${cost}, have ${apCurrent}.`, 'error'); return; }
    if (statusOf(key)) { flash('Already unlocked or pending.', 'error'); return; }

    const pathId = key.split('|')[0];
    const nudge  = sliderNudge(pathId);
    const newSliders = {
      ...(char.sliders || {}),
      magicTech: Math.max(-4, Math.min(4, (char.sliders?.magicTech || 0) + nudge)),
    };

    await persist({
      abilityPending: [...abilityPending, key],
      apCurrent: apCurrent - cost,
      sliders: newSliders,
    });
    flash('Ability requested — awaiting DM approval.');
  }

  // DM approves pending, or force-grants
  async function handleApprove(key, dmGrant = false) {
    if (dmGrant) {
      const pathId = key.split('|')[0];
      const nudge  = sliderNudge(pathId);
      const newSliders = {
        ...(char.sliders || {}),
        magicTech: Math.max(-4, Math.min(4, (char.sliders?.magicTech || 0) + nudge)),
      };
      await persist({
        abilityOverrides: [...abilityOverrides, key],
        sliders: newSliders,
      });
      flash(`DM granted: ${key.split('|')[3]}`);
    } else {
      // Move from pending → unlocked
      await persist({
        abilities: [...abilities, key],
        abilityPending: abilityPending.filter(k => k !== key),
      });
      flash(`Approved: ${key.split('|')[3]}`);
    }
  }

  // DM buyback: remove ability, refund cost, nudge slider back
  async function handleBuyback(key, cost) {
    const pathId = key.split('|')[0];
    const nudge  = -sliderNudge(pathId); // reverse the nudge
    const newSliders = {
      ...(char.sliders || {}),
      magicTech: Math.max(-4, Math.min(4, (char.sliders?.magicTech || 0) + nudge)),
    };
    await persist({
      abilities:        abilities.filter(k => k !== key),
      abilityOverrides: abilityOverrides.filter(k => k !== key),
      abilityPending:   abilityPending.filter(k => k !== key),
      apCurrent:        apCurrent + cost,
      sliders:          newSliders,
    });
    flash(`Buyback complete. ${cost}pt refunded.`);
  }

  const paths = macroTab === 'magic' ? TREE.magic : TREE.tech;

  return (
    <div>
      {/* AP + slider summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'AP Available', value: apCurrent },
          { label: 'AP Total',     value: apTotal   },
          { label: 'Pending Cost', value: pendingCost, dim: true },
        ].map(({ label, value, dim }) => (
          <div key={label} style={{ flex: 1, minWidth: 80, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '9px 12px', textAlign: 'center' }}>
            <div style={{ ...label8(), marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, fontWeight: 800, color: dim ? COLORS.dim : COLORS.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Magic/Tech conflict note for Tier 3 */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 20, fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', lineHeight: 1.65 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: COLORS.text, fontSize: 11 }}>Path conflict. </span>
        Tier 3 abilities push the Magic | Tech meter. Heavy investment in one macro-path at levels 10–20 may trigger a DM-initiated point buyback on opposing apex abilities.
      </div>

      {/* Notice */}
      {notice && (
        <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'Georgia, serif', background: notice.type === 'error' ? `${WARN}18` : `${TC}18`, color: notice.type === 'error' ? WARN : TTX, border: `1px solid ${notice.type === 'error' ? WARN : TC}44` }}>
          {notice.msg}
        </div>
      )}

      {/* Macro tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 16 }}>
        {[{ id: 'magic', label: 'Magic Path', col: MC, txt: MTX }, { id: 'tech', label: 'Tech Path', col: TC, txt: TTX }].map(t => {
          const active = macroTab === t.id;
          return (
            <button key={t.id} onClick={() => setMacroTab(t.id)}
              style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? t.col : 'transparent'}`, padding: '8px 16px', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: active ? t.txt : COLORS.dim, fontWeight: active ? 700 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Path list */}
      {paths.map(path => (
        <PathSection
          key={path.id}
          path={path}
          axis={macroTab}
          statusOf={statusOf}
          canSpend={canSpend()}
          isDM={isDM}
          onSpend={handleSpend}
          onApprove={handleApprove}
          onBuyback={handleBuyback}
        />
      ))}

      {saving && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, fontSize: 10, fontFamily: "'Cinzel', serif", color: COLORS.muted, background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 12px' }}>
          Saving…
        </div>
      )}
    </div>
  );
}
