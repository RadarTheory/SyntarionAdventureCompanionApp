// ═══════════════════════════════════════════════════════════════════════════════
// SOTERIA MECHANICS — The Scribe's System Reference
// Import: import { SOTERIA_MECHANICS } from './soteria-mechanics';
// ═══════════════════════════════════════════════════════════════════════════════

export const SOTERIA_MECHANICS = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
THE EIGHT STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every character has eight core stats split across two axes.

MAGIC AXIS (spiritual, intuitive, innate):
- SPIRIT (Charisma) — presence, force of personality, divine projection, social dominance
- SOUL (Faith) — belief, endurance through suffering, spiritual resistance, resolve
- BODY (Constitution) — physical vitality, stamina, resistance to damage and disease
- ESSENCE (Wisdom) — attunement to the natural world, perception, intuition, survival read

TECH AXIS (learned, applied, mechanical):
- WILL (Strength) — raw physical power, striking force, carrying capacity, intimidation through force
- WHIM (Dexterity) — speed, precision, evasion, finesse, stealth, sleight of hand
- MIND (Intelligence) — knowledge, logic, analysis, planning, technical expertise
- DREAM (Intent) — purpose, clarity of aim, stealth of motive, long-range planning and will projection

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DERIVED STATS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VITALS — Health pool. Derived from Body + Will.
STAMINA — Endurance/action economy. Derived from Body + Whim.
RESOLVE — Mental fortitude, morale, resistance to despair. Derived from Soul + Dream.
MORALITY — Alignment expression and spiritual reputation. Tracked on character sheet.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALIGNMENT AXIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Alignment is a single sliding axis, not a grid.

MAGIC (-4) <————————— NEUTRAL (0) —————————> TECH (+4)

- MAGIC side: spiritual, instinctual, tradition-bound, belief-driven
- NEUTRAL: balanced, pragmatic, unaffiliated, adaptive
- TECH side: analytical, systematic, rationalist, innovation-driven

Alignment affects: discipline source access, NPC reactions, gear/faction restrictions,
spiritual resonance visibility to spirits and gods.

Secondary alignment axes:
- WILL <-> WHIM (physical expression: forceful vs. precise)
- SOUL <-> SPIRIT (spiritual expression: faith-bound vs. presence-driven)

Tier 3 abilities push the Magic/Tech meter. Heavy investment in one macro-path at
levels 10-20 may trigger a DM-initiated buyback on opposing apex abilities.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABILITY POINTS (AP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AP is the primary advancement currency of Soteria.

- AP is granted exclusively by the DM (the Architect).
- Players spend AP on class abilities and heritage abilities.
- Tier 1 base class abilities are free.
- Tier 2 abilities cost 2 AP each.
- Tier 3 abilities cost 3 AP each.
- AP has a current (unspent) and total (lifetime) value tracked on the sheet.
- Players request abilities; DM approves or denies.
- DM can also grant abilities directly (DM Override) without AP cost.
- DM can initiate buyback, refunding AP and reversing the ability.

The Scribe defers all AP award decisions to the Architect.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCIPLINE SOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MAGIC DISCIPLINES:
- Divine → SANCTUS (Spirit/Charisma)
- Sacral → CHIASMA (Soul/Faith)
- Arcane → MANA (Body/Constitution)
- Wild → ESSENCE (Essence/Wisdom)
- Runic → GNOSIS (Will/Strength)
- Mythic → SHAEID (Whim/Dexterity)
- Shadow → WRAILL (Mind/Intelligence)

TECH DISCIPLINES:
- Commerce → GAIN (Ion)
- Martial → GRIT (Steam)
- Anti-Magic → FOCUS (Element)
- Alchemic → MATTER (Arc)
- Academic → INGENUITY (Cell)
- Covert → FORTITUDE (Lithium)
- Artifice → REASON (Null)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION ECONOMY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UNIVERSAL: Interact (Dex), Search (Dex), Analyze (Mind), Project (Spirit), Survey (Essence)
COMBAT: Strike (Will), Range (Whim), Parry (Mind), Defend (Body), Use (Mind), Rest (Soul),
        Flee (Whim), Disrupt (Focus), Assist (Spirit), Maneuver (Whim), Brace (Fortitude), Rebound (Soul)
DEFENSE: Brace (Fortitude), Endure (Body), Counter (Soul)
ALIGNMENT: Heal (Soul/Dream), Harm (Will/Chiasma), Kinetic (Whim/Body)
SOCIAL: Negotiate (Gain), Intimidate (Spirit), Insight (Essence), Deception (Spirit),
        Persuade (Spirit), Influence (Spirit), Commands (Spirit), Threaten (Grit),
        Bribe (Gain), Reason (Mind), Appeal (Spirit), Taunt (Spirit)
MAGIC: Invoke (Sanctus), Flow (Chiasma), Weave (Mana), Inscribe (Gnosis),
       Harrow (Wraill), Call (Shaeid), Attune (Essence)
TECH: Broker (Gain), Exert (Grit), Nullify (Focus), Transmute (Matter),
      Tinker (Ingenuity), Theorize (Reason), Engineer (Reason)
STEALTH: Hide (Dream), Sneak (Whim), Veil (Dream), Tail (Essence), Sleight (Whim),
         Sabotage (Ingenuity), Infiltrate (Whim), Assassinate (Will), Disguise (Spirit), Eavesdrop (Essence)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EQUIPMENT SLOTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPAREL: Head, Torso, Waist, Hands, Greaves, Boots
WEAPONS: Main Hand, Off-Hand, Side-Weapon, Heavy
ACCESSORIES: Ring I, Ring II, Neck, Charm, Relic, Artifact
ATTUNED items provide active bonuses. NON-ATTUNED items are carried but not spiritually linked.
Weight tracked across: Consumables, Inventory, Pack, Coin.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKGROUND & BELIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- BACKGROUND — history, origin, social context
- ALIGNMENT — position on the Magic/Tech axis
- BELIEF — patron god (Sanctus) or patron spirit (Sacral), or Unaffiliated
- MOTIVATION — personal driving force; affects social actions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL CLASS TREE — MAGIC TRACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AP COST: Tier 1 free | Tier 2 = 2pt per ability | Tier 3 = 3pt per ability
PROGRESSION: Base Class (Lvl 1-5) -> Tier 2 specialization (Lvl 5-10) -> Tier 3 apex (Lvl 10-20)

━━━ PATH: DIVINE (Sanctus / Spirit) ━━━

INQUISITOR [Tier 1, Lvl 1-5, Free]
  Soul Sense — Detects presence, alignment, or disturbance in nearby beings or divine objects.
  Resonant Touch — Can interrupt casting, expose illusions, or mark a target.
  Faith Enforcement — Imposes will of divine authority.
  Edict of Silence — Prevents casting, invocation, or certain actions temporarily.
  Final Adjudication — Effect scales based on target state (weakened, exposed, marked).

CLERIC [Tier 2, Lvl 5-10, 2pt each]
  Benediction — Restores vitality or stabilizes a target, preventing further degradation.
  Consecration — Sanctifies an area, strengthening allies and weakening hostile forces within it.
  Warding Light — Creates a protective barrier that absorbs or deflects incoming effects.
  Purify — Cleanses corruption, poison, or external influence from a target or zone.
  Communion — Channels sustained divine presence, amplifying allies and restoring over time.

PALADIN [Tier 2, Lvl 5-10, 2pt each]
  Oathbrand — Marks a target or self with a binding oath, enhancing damage or resistance based on adherence.
  Radiant Strike — Empowers weapon attacks with sanctified force, dealing additional radiant impact.
  Aegis March — Advances with a protective field, reducing incoming damage for self and nearby allies.
  Vow Unbroken — Temporarily prevents defeat, sustaining the Paladin through lethal thresholds.
  Judgment Arc — Releases stored conviction in a sweeping burst, striking multiple marked or nearby enemies.

AUGUR [Tier 3, Lvl 10-20, 3pt each, from Cleric]
  Omen Sight — Reveals immediate future outcomes or hidden intent in a target or area.
  Thread Reading — Identifies the most likely path of action or consequence in a situation.
  Forewarning — Grants allies brief precognitive reactions, improving evasion or defense.
  Fate Anchor — Stabilizes a chosen outcome, reducing variance or preventing disruption.
  Prophetic Collapse — Forces a predicted outcome onto a target, overriding their next action.

IRIDESCE [Tier 3, Lvl 10-20, 3pt each, from Paladin]
  Prismatic Veil — Surrounds the caster in shifting light, distorting perception and reducing incoming effects.
  Spectrum Lance — Projects a focused beam of refracted energy with variable effects based on alignment or state.
  Chromatic Divide — Splits an area into bands of influence, altering movement, damage, or perception across zones.
  Refraction Step — Moves through light, repositioning instantly between illuminated points.
  Rite of Iridesce — Unleashes a multi-spectrum burst that adapts its effect to each affected target.

━━━ PATH: SPIRITUAL (Sacral / Soul) ━━━

ZEALOT [Tier 1, Lvl 1-5, Free]
  Ignition — Enters a fervent state, increasing physical output and resistance at the cost of control.
  Rite of Fury — Empowers the next actions with overwhelming force, breaking through defenses or resistance.
  Vey Breach — Tears open the boundary briefly, allowing spirit energy to surge into the physical space.
  Possession — Invites a volatile spirit into the body, granting power with unpredictable side effects.
  Ascent — Enters a spiritual rage, surrendering restraint for overwhelming fervor, endurance, and force.

SHAMAN [Tier 2, Lvl 5-10, 2pt each]
  Totem — Anchors a spirit to a location, granting persistent environmental effects.
  Spirit Bargain — Negotiates with a local spirit for a temporary boon or service.
  Walk Between — Phases partially into Mhattha, the spiritual plane, to reposition or avoid harm.
  Host — Channels a specific spirit lineage, gaining defined traits and abilities.
  Primal Convergence — Calls multiple spirits into a controlled alignment for a large-scale effect.

BOKOR [Tier 2, Lvl 5-10, 2pt each]
  Hex Drawing — Applies a precise curse that alters a target's capabilities or outcomes.
  Vessel Link — Binds a target to an object or effigy, transferring effects between them.
  Grave Work — Manipulates remains or lingering essence to produce obedient constructs.
  Ritual Dominion — Establishes control over an area through layered cursework and bindings.
  Malison Sovereign — Unleashes a perfected curse that compounds and persists beyond normal limits.

CAELYN [Tier 3, Lvl 10-20, 3pt each, from Shaman]
  Thread Sight — Perceives underlying spiritual connections between entities.
  Weave Step — Moves along unseen connections, repositioning through linked points.
  Pattern Hold — Locks a state or condition in place, preventing change for a duration.
  Dual Balance — Redistributes effects between connected targets.
  Weave Collapse — Forces all active connections to resolve simultaneously.

DRAETH [Tier 3, Lvl 10-20, 3pt each, from Bokor]
  Etch Sigil — Inscribe a lasting curse onto a surface, object, or being.
  Spread Malison — Extends an existing curse to additional targets.
  Blood Terms — Strengthens a curse through sacrifice or cost.
  Bound Decay — Locks a target into a degrading state that cannot be easily removed.
  Terminal Script — Finalizes all active cursework into a single decisive outcome.

━━━ PATH: ARCANE (Mana / Body) ━━━

WEAVER [Tier 1, Lvl 1-5, Free]
  Arcane Sense — Detects magical presence, active spells, and arcane disturbances.
  Cantrip Mastery — Improves efficiency and potency of basic spells, allowing repeated low-cost casting.
  Spell Threading — Refines casting structure, reducing miscasts and stabilizing complex spells.
  Focus Channel — Increases precision and control, improving range, targeting, or duration.
  Spell Preparation — Prepares structured spells in advance for faster, more reliable casting.

WIZARD [Tier 2, Lvl 5-10, 2pt each]
  Grimoire Binding — Stores and organizes spells within a spellbook, expanding accessible repertoire.
  Ritual Casting — Performs extended casts that produce powerful, sustained, or large-scale effects.
  Counterspell — Interrupts or negates incoming magical effects.
  Spell Shaping — Alters the area, form, or behavior of spells during casting.
  Arcane Reserve — Maintains a pool of stored mana for rapid or repeated casting.

MAGUS [Tier 2, Lvl 5-10, 2pt each]
  Enchant Weapon — Infuses a weapon with arcane energy for enhanced strikes.
  Spellstrike — Delivers a spell through a physical attack.
  Arcane Deflection — Reduces or redirects incoming magical damage.
  Battle Casting — Allows casting without interrupting movement or combat flow.
  Mana Surge — Temporarily increases spell output at the cost of stability.

ARCHMAGE [Tier 3, Lvl 10-20, 3pt each, from Wizard]
  Spell Matrix — Maintains multiple prepared spells simultaneously for flexible casting.
  Arcane Mastery — Reduces cost and increases effectiveness across all spells.
  Sigil Dominion — Deploys layered runic effects that trigger under conditions.
  Reality Edit — Alters the outcome or properties of active spells.
  Archmagus Ascension — Temporarily removes normal casting limits, enabling peak arcane output.

SPELLBLADE [Tier 3, Lvl 10-20, 3pt each, from Magus]
  Arcane Edge — Sustains magical enhancement on all attacks.
  Phase Strike — Allows attacks to bypass armor or physical barriers.
  Spell Parry — Deflects incoming spells with weapon timing.
  Dual Weave — Combines simultaneous casting and melee execution.
  Overdrive — Unleashes combined arcane and physical force in a single decisive action.

━━━ PATH: WILD (Essence / Essence) ━━━

DRUID [Tier 1, Lvl 1-5, Free]
  Wildcall — Calls upon nearby natural forces, beasts, plants, or terrain to respond with minor aid.
  Essence Breath — Channels living essence through breath, restoring vitality or releasing natural force.
  Nature's Mark — Marks a creature, place, or object with natural significance, allowing tracking, bonding, or influence.
  Rootbind — Restrains a target through roots, vines, thorns, or terrain growth.
  Feral Attunement — Temporarily heightens senses, movement, and instinct through communion with wild essence.

OVATE [Tier 2, Lvl 5-10, 2pt each]
  Grove Rite — Establishes a sacred natural area that restores allies and weakens unnatural intrusion.
  Verdant Reading — Interprets signs in plants, weather, soil, and animal behavior.
  Life Sap — Draws vitality from the environment to heal, sustain, or empower.
  Bloomward — Creates a living barrier of bark, vine, moss, or flower that protects and regenerates.
  Green Communion — Communes deeply with a location's living memory, revealing what the land has witnessed.

WILD [Tier 2, Lvl 5-10, 2pt each]
  Beast Surge — Channels animal ferocity into speed, strength, or predatory instinct.
  Clawform — Partially reshapes the body with natural weapons or beast traits.
  Packcall — Summons or rallies nearby beasts to assist, distract, or attack.
  Hunting Trance — Locks onto prey, improving pursuit, perception, and striking force.
  Apex Roar — Unleashes primal dominance, frightening enemies and empowering allies.

DRYAD [Tier 3, Lvl 10-20, 3pt each, from Ovate]
  Living Bark — Transforms skin or body into living wood, gaining protection and regeneration.
  Thorncrown — Surrounds the caster with a blooming crown of thorns that wounds attackers and empowers nature spells.
  Root Sanctum — Creates a sanctuary bound to the land, healing allies and resisting corruption.
  Seed of Return — Plants a living essence-anchor that can restore or revive the caster under certain conditions.
  Verdant Avatar — Becomes an embodiment of the grove, commanding growth, healing, and terrain.

PRIMALIST [Tier 3, Lvl 10-20, 3pt each, from Wild]
  Predator Form — Assumes a powerful bestial state with enhanced movement, senses, and attacks.
  Blood Scent — Tracks wounded or marked enemies with supernatural precision.
  Savage Pounce — Closes distance violently and strikes with overwhelming momentum.
  Untamed Endurance — Resists pain, exhaustion, fear, and restraint through primal force.
  Alpha Ascendant — Embodies apex instinct, overpowering weaker foes and driving allies into coordinated ferocity.

━━━ PATH: RUNIC (Gnosis / Will) ━━━

SAGE [Tier 1, Lvl 1-5, Free]
  Runic Literacy — Reads, identifies, and safely interprets basic runes, glyphs, and written magical structures.
  Rune Attunement — Aligns with a rune's intent, allowing it to be activated, stabilized, or resisted.
  Codex Focus — Channels power through a written focus, improving precision and reducing casting strain.
  Glyph Marking — Places a simple glyph on a surface, object, or threshold to trigger a defined effect.
  Script Recall — Retrieves memorized runic forms quickly, allowing faster inscription or interpretation.

CODEXER [Tier 2, Lvl 5-10, 2pt each]
  Formula Script — Combines written symbols into structured effects with predictable outcomes.
  Lexicon Binding — Links a spell effect to a word, phrase, or written command.
  Annotated Casting — Modifies a spell through written notation, changing range, duration, or condition.
  Codex Interdict — Uses written authority to interrupt, restrict, or invalidate a magical effect.
  Living Codex — Maintains an active written record that updates as new symbols are encountered.

SCRIBE [Tier 2, Lvl 5-10, 2pt each]
  NOTE: The Scribe class is distinct from the AI assistant also called "The Scribe."
  Inscribe Ward — Writes a protective rune onto a surface, object, or creature.
  Sealing Script — Locks, suppresses, or contains a magical effect through formal inscription.
  Transfer Glyph — Moves a stored rune effect from one surface or object to another.
  Inkbound Reserve — Stores magical force in prepared ink, parchment, stone, or metal.
  Trigger Seal — Creates a delayed rune that activates when its condition is met.

GLYPHSAGE [Tier 3, Lvl 10-20, 3pt each, from Codexer]
  Glyph Theory — Understands advanced symbolic structures, improving all rune-based casting.
  Symbol Dominion — Rewrites active glyph behavior within range.
  Recursive Array — Creates linked glyphs that repeat or chain effects.
  Prime Inscription — Places a master glyph that governs lesser runes in an area.
  Archive Awakening — Animates a codex, tablet, or written archive into an active magical instrument.

RUNESIPH [Tier 3, Lvl 10-20, 3pt each, from Scribe]
  Siphon Mark — Places a rune that drains magical energy from a target or object.
  Break Script — Disrupts active runes, seals, wards, or inscriptions.
  Draining Array — Creates a field that absorbs power from spells cast within it.
  Null Ink — Inscribes a suppressive rune that weakens magical effects over time.
  Final Extraction — Consumes stored rune energy for a decisive burst, restoration, or shutdown.

━━━ PATH: MYTHIC (Shaeid / Whim) ━━━

MYSTIC [Tier 1, Lvl 1-5, Free]
  Light Sense — Perceives underlying currents of power, soul presence, and unseen disturbances.
  Trance — Enters a focused internal state, heightening awareness, resistance, and spiritual clarity.
  Mythic Echo — Draws on residual imprints of past events or beings to influence the present moment.
  Inner Conduit — Channels power through the self rather than an external source, stabilizing output.
  Echo Release — Unleashes stored mythic resonance in a controlled burst.

GUARDIAN [Tier 2, Lvl 5-10, 2pt each]
  Warden Bastion — Projects a protective aura that absorbs or redirects harm.
  Anchor — Prevents displacement, possession, or forced movement.
  Intercept — Redirects an incoming effect from an ally to self.
  Resolve Manifest — Converts willpower into temporary resilience or restoration.
  Last Vigil — Remains active after defeat for a short duration, continuing to defend.

FATEBINDER [Tier 2, Lvl 5-10, 2pt each]
  Spoken Want — Grants a minor boon to a target based on a stated desire; effect is literal and bound by intent.
  Binding Word — Locks a spoken agreement into place; both parties are compelled toward its terms.
  Glamour Veil — Overlays a target or area with fae illusion; perception shifts to match expectation.
  Tithe Mark — Extracts a small cost from a target in exchange for a granted effect; cost scales with desire.
  True Name Sense — Detects the hidden name or nature of a being, object, or place; fae entities are fully revealed.

ARCANI [Tier 3, Lvl 10-20, 3pt each, from Guardian]
  Ichor — Completes the soul-binding trial, awakening the Shaeid Light into its true mythic form.
  Heart-Fae Form — Channels emotion through the Shaeid Light, making its form reactive to courage, grief, love, or instinct.
  Mind-Fae Form — Channels memory, foresight, and intention through the Shaeid Light for precise, strategic transformation.
  Gatecut — Opens a temporary Faetway passage between attuned locations.
  Shaeid Arsenal — The weapon becomes an echo of the Arcani's myth, evolving into an eternal light-form bound to the wielder.

WISHWRIGHT [Tier 3, Lvl 10-20, 3pt each, from Fatebinder]
  Open Wish — Grants a stated desire with full literal interpretation; unintended consequences are not prevented.
  Wish Reversal — Unravels a previously granted wish or spoken boon, restoring prior state at cost.
  Verdeli're Accord — Establishes a binding contract with a fae entity or willing target under ancient terms.
  Glamour Sovereign — Reshapes perception of an entire area; what is seen, heard, and remembered can be altered.
  Price Extracted — Forces a target to pay a hidden cost for something they have already received or done.

━━━ PATH: SHADOW (Umbral / Mind) ━━━

MAGISTER [Tier 1, Lvl 1-5, Free]
  Echo Harvest — Draws residual essence from the recently fallen, storing it for later use.
  Grave Speech — Communicates with lingering remnants to extract fragments of memory or intent.
  Wraith Touch — Channels umbral energy through contact, weakening vitality or binding motion.
  Shade Veil — Shrouds the caster in dim distortion, reducing detection and incoming precision.
  Mortuary Keep — Stores harvested remnants from the dead for later use.

HEMOCLAST [Tier 2, Lvl 5-10, 2pt each]
  Blood Rend — Manipulates internal lifeforce to damage or destabilize a target.
  Sanguine Channel — Converts personal vitality into power, enhancing spell output.
  Vein Lock — Restricts movement or action by seizing internal flow.
  Crimson Reserve — Stores drawn lifeforce for later release or recovery.
  Exsanguinate — Drains a target rapidly, transferring strength to the caster.

HARROW [Tier 2, Lvl 5-10, 2pt each]
  Tether Shade — Binds a spirit remnant to a target, applying persistent pressure or influence.
  Gravebound — Anchors a target in place through lingering essence.
  Dirge Call — Summons minor wraiths to harass, obscure, or weaken enemies.
  Soul Fracture — Splits a target's stability, increasing vulnerability to further effects.
  Revenant Rite — Raises a temporary servant from remains or residual presence.

NECROMANCER [Tier 3, Lvl 10-20, 3pt each, from Hemoclast]
  Legion Awakening — Animates multiple constructs or remains under command.
  Death Command — Issues direct control orders to all summoned entities.
  Essence Reclamation — Reclaims energy from defeated units or targets.
  Grave Domain — Establishes an area where decay strengthens the caster.
  Sovereign of Bones — Becomes the focal authority over all deathbound forces nearby.

DARKWEAVER [Tier 3, Lvl 10-20, 3pt each, from Harrow]
  NOTE: Darkweaving is illegal under King Aric's Sovereign Kingdom. Possessing these abilities marks a character as a criminal.
  Umbral Thread — Links targets through shadow, sharing damage or effects.
  Night Shroud — Creates an area of heavy obscurity and distortion.
  Phantom Duplicity — Generates shifting false forms to confuse and misdirect.
  Void Pull — Draws enemies inward toward a collapsing shadow point.
  Darkweave — Combines all active shadow effects into a single overwhelming manifestation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL CLASS TREE — TECH TRACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━ PATH: COMMERCE (Gain / Ion) ━━━

MERCHANT [Tier 1, Lvl 1-5, Free]
  Point of Sale — Creates a ledgered exchange point that records purchases, transfers, debt, ownership, and agreed value.
  Ledger Seal — Tags items, currency, and contracts with a verifiable mark; illusions, forgeries, and conjured goods fail verification.
  Escrow Chest — Holds value in trust; actions that exceed collateral are throttled or halted until covered.
  Tariff Gate — Establishes a checkpoint; effects that cross the boundary incur a cost or lose potency.
  Provenance Tag — Assigns origin and ownership; stolen, duplicated, or fabricated assets are flagged and restricted.

EMISSARY [Tier 2, Lvl 5-10, 2pt each]
  Contract Press — A device that imprints binding terms onto documents or participants.
  Credit Ledger — A carried or installed account system that extends value and tracks debt.
  Safe Conduct Pass — A forged or issued token granting protected movement and limited immunity.
  Sanction Register — A maintained blacklist ledger that suppresses flagged entities or actions.
  Supply Array — A routed network of crates, routes, or depots that controls resource flow.

DIPLOMAT [Tier 2, Lvl 5-10, 2pt each]
  Mediation Table — A constructed table or chamber that enforces non-hostile resolution conditions.
  Protocol Charter — A written charter that dictates allowed conduct within its jurisdiction.
  Reputation Ledger — A tracked record system that influences outcomes based on standing.
  Concession Contract — A drafted agreement that forces trade-offs when invoked.
  Alliance Seal — A forged pact artifact linking parties under shared terms.

TYCOON [Tier 3, Lvl 10-20, 3pt each, from Emissary]
  Monopoly Registry — A central record system that grants exclusive control over resources or services.
  Capital Engine — A built mechanism that converts stored wealth into defense or mitigation.
  Market Halt Switch — A control device that freezes trade and exchange within its network.
  Price Floor Index — A pricing engine that enforces minimum cost thresholds.
  Trade Dominion Hub — A central node that governs regional exchange, taxation, and access.

NEGOTIATOR [Tier 3, Lvl 10-20, 3pt each, from Diplomat]
  Terms Charter — A document or device that defines allowed actions within its scope.
  Binding Contract — A sealed agreement that enforces compliance and punishes violation.
  Breach Trigger — A prepared clause or device that activates when conditions are broken.
  Settlement Engine — A system that converts conflict into enforceable outcomes.
  Grand Accord Archive — A master treaty construct that binds multiple factions under shared constraints.

━━━ PATH: MARTIAL (Grit / Steam) ━━━

FIGHTER [Tier 1, Lvl 1-5, Free]
  Grit Reservoir — A worn module that stores excess exertion and releases it to sustain the wearer during strain.
  Second Wind Kit — A compact recovery rig that restores vitality mid-combat.
  Anchor Harness — A strapped system that resists forced movement and stabilizes stance.
  Guard Plating — Segmented armor that converts heavy hits into reduced sustained damage.
  Weapon Balancer — A mechanical tuning system that improves strike consistency and control.

BARBARIAN [Tier 2, Lvl 5-10, 2pt each]
  Rage Conduit — A forged focus that converts damage taken into increased physical output.
  Blood Reserve — A storage system that delays or redistributes incoming damage over time.
  War Totem — A carried object that amplifies aggression and resilience under pressure.
  Impact Gauntlets — Heavy striking gear that breaks through armor and defensive constructs.
  Charge Harness — A reinforced rig that increases force during forward momentum.

SWASHBUCKLER [Tier 2, Lvl 5-10, 2pt each]
  Duelist Frame — A lightweight rig that enhances speed, precision, and recovery between actions.
  Riposte Mechanism — A reactive tool that converts successful defense into immediate counterattack.
  Mobility Boots — Engineered footwear that enables rapid repositioning and escape.
  Disarm Toolset — A weapon attachment system designed to strip or control enemy gear.
  Feint Device — A misdirection tool that disrupts targeting and timing.

MARAUDER [Tier 3, Lvl 10-20, 3pt each, from Barbarian]
  NOTE: Marauders are pirates in Soteria. This class is nautical, coastal, and pirate-coded.
  Boarding Harness — A combat rig built for climbing, swinging, bracing, and fighting across ships, docks, and unstable ground.
  Breaching Hooks — Heavy hooks and chained tools used to board vessels, tear barriers open, or drag enemies out of position.
  Cutlass Frame — A reinforced weapon assembly built for close-quarters slashing, parrying, and rapid follow-through.
  Plunder Rig — A carried system for securing stolen goods, disarming containers, and extracting valuables under pressure.
  Blackflag Cache — A hidden or portable store of weapons, smoke, powder, rope, and emergency supplies for raids or escapes.

KNIGHT [Tier 3, Lvl 10-20, 3pt each, from Swashbuckler]
  Fortress Core — A central armor system that massively increases durability and stability.
  War Banner — A plantable standard that reinforces allied endurance and resolve.
  Shield Wall Array — A deployable formation system that strengthens group defense.
  Guard Command Rig — A control harness that redirects damage away from allies.
  Last Stand Core — An emergency system that sustains operation past normal failure thresholds.

━━━ PATH: ANTI-MAGIC (Focus / Element) ━━━

VANGUARD [Tier 1, Lvl 1-5, Free]
  Null Shroud — A worn dampening mantle that weakens active magical detection and resonance targeting.
  Grounding Spike — A forged anchor driven into earth, stone, or metal to discharge hostile magical force.
  Resistance Plate — Armor plating that disperses arcane, divine, and spiritual impact across the body.
  Resonance Mirror — A polished counterplate that reflects a weakened portion of incoming magical force.
  Stonelock Brace — A bracing mechanism that prevents forced movement, levitation, possession, or displacement.

SENTINE [Tier 2, Lvl 5-10, 2pt each]
  Sentinal Bulwark — A reinforced armor scaffold that expands protection to nearby allies.
  Null Standard — A planted field banner that suppresses hostile spell strength within its radius.
  Grounding Grid — A deployed network of rods and wire that prevents teleportation, summoning, and spectral passage.
  Severance Clamp — A locking device that weakens an enemy's connection to an active spell, focus, or pact.
  Bulwark Relay — A linked armor node that redirects magical impact from allies into the Sentine's defenses.

NULL [Tier 2, Lvl 5-10, 2pt each]
  Ritecore Socket — A spinal interface housing that prepares the body for deeper severance and Whythryn integration.
  Silence Gauntlet — A heavy gauntlet that interrupts spellcasting, focus use, and touch-based magic.
  Null Brands — Forged body-marks or embedded plates that reduce attunement to magic, spirits, and divine influence.
  Counterweight Core — A dense internal stabilizer that resists transformation, charm, fear, and forced alteration.
  Cogmail Harness — A partial Whythryn armor rig that strengthens the body while suppressing magical dependency.

WARDEN [Tier 3, Lvl 10-20, 3pt each, from Sentine]
  Warden Plate — A full defensive armor system that protects the wearer and stabilizes allies against magical force.
  Spellbreak Pylon — A deployable tower that disrupts sustained spell effects within its field.
  Anchor Circle — A constructed perimeter that prevents magical entry, exit, summoning, and planar interference.
  Reflection Engine — A built counterforce mechanism that redirects a portion of incoming spell energy.
  Groundlaw Bastion — A fortified anti-magic installation that imposes material rules over a defended zone.

WHYTH [Tier 3, Lvl 10-20, 3pt each, from Null]
  NOTE: The Whyth ideology holds that material self-determination supersedes all magical authority. Whyth characters are deeply resistant to spiritual influence and may have philosophical conflicts with magic-aligned party members.
  Ritecore Plug — A permanent spinal implant created through the Rite of Binding, severing spiritual and magical connection.
  Whythryn Cogmail — A full armor system that makes the wearer highly resistant to magical, divine, and spiritual effects.
  Whythryn Cudgel — A transforming weapon built to break enchanted armor, spell barriers, and resonance-bound constructs.
  Stone and Shape Seal — A forged oath-plate that reinforces material self-determination and rejects outside influence.
  Grimroot Grounding — A final grounding apparatus that roots the Whyth fully in the material world, suppressing magic through presence.

━━━ PATH: ALCHEMIC (Matter / Arc) ━━━

ALCHEMIST [Tier 1, Lvl 1-5, Free]
  Volatile Brew — A prepared flask that releases unstable chemical force on impact or exposure.
  Catalyst Vial — A stored reagent that accelerates, strengthens, or alters another alchemical schematic.
  Toxin Canister — A sealed container that releases poison, gas, or irritant compounds into a controlled area.
  Reaction Clamp — A stabilizing tool that delays detonation, prevents contamination, or contains unstable matter.
  Infusion Ampoule — A breakable vessel that temporarily alters flesh, gear, or material behavior.

MUTAGENIST [Tier 2, Lvl 5-10, 2pt each]
  Mutagen Syringe — An injectable compound that alters strength, speed, or resilience temporarily.
  Flesh Graft Kit — A surgical toolset used to attach, reinforce, or modify living tissue.
  Adaptive Serum — A prepared dose that grants resistance to a chosen hazard or condition.
  Stabilization Harness — A support rig that prevents mutation collapse or bodily rejection.
  Regenesis Vat — A containment vessel that accelerates tissue repair and biological recovery.

BOMBARDIER [Tier 2, Lvl 5-10, 2pt each]
  Blast Charge — A prepared explosive designed to destroy barriers, armor, machinery, or clustered enemies.
  Acid Flask — A corrosive vessel that breaks down metal, stone, locks, armor, or organic matter.
  Smoke Canister — A deployable screen that blocks vision, scent, and targeting.
  Chain Reactor — A rigged compound that spreads detonation through nearby volatile materials.
  Pressure Mine — A planted device that triggers when stepped on, opened, moved, or disturbed.

BIOMANCER [Tier 3, Lvl 10-20, 3pt each, from Mutagenist]
  Gene Crucible — A laboratory vessel used to refine traits from harvested biological material.
  Chimera Graft — A permanent or semi-permanent biological modification that grants inherited traits.
  Organ Engine — A cultivated internal implant that improves endurance, healing, or resistance.
  Living Armature — A grown biological support structure that reinforces the body during mutation.
  Perfected Mutagen — A stabilized apex compound that allows controlled transformation without immediate bodily failure.

SABOTEUR [Tier 3, Lvl 10-20, 3pt each, from Bombardier]
  Cataclysm Bomb — A high-yield explosive device built for structural destruction and battlefield denial.
  Toxin Swarm — A cluster of dispersal pods that spreads poison, acid, smoke, or disease across an area.
  Deadman Trigger — A concealed trigger system that activates when the user falls, flees, or gives a signal.
  Sabotage Kit — A specialized toolkit for disabling engines, locks, weapons, armor, gates, and schematics.
  Collapse Array — A planted network of charges designed to bring down structures, tunnels, bridges, or fortified zones.

━━━ PATH: ACADEMIC (Ingenuity / Cell) ━━━

SCHOLAR [Tier 1, Lvl 1-5, Free]
  Recall Box — A prepared reference sheet or mnemonic overlay that restores forgotten details, names, routes, symbols, or tactical facts.
  Field Journal — A durable research book that records observations, weaknesses, terrain notes, and discovered patterns for later use.
  Survey Lens — A handheld optical tool that reveals distance, structure, tracks, hidden markings, and battlefield angles.
  Annotation Slate — A reusable writing board that marks targets, hazards, objectives, or routes for allies to follow.
  Relic Index — A cataloging system that identifies artifacts, mechanisms, inscriptions, and historical objects.

TACTICIAN [Tier 2, Lvl 5-10, 2pt each]
  Battle Map — A prepared tactical board that marks enemy movement, ally placement, cover, routes, and attack lanes.
  Foresight Maneuver — A written combat sequence that can be revealed later to alter positioning, timing, or defensive response.
  Signal Kit — Flags, whistles, mirrors, or hand signs used to coordinate allies across distance or noise.
  Formation Guide — A drilled instruction set that strengthens allies when they hold formation or follow assigned roles.
  Counterplan Dossier — A prepared file on enemy habits, weaknesses, routes, and likely tactics.

CARTOGRAPHER [Tier 2, Lvl 5-10, 2pt each]
  Wayfinder Map — A crafted map that improves navigation and reveals safe routes, hazards, and hidden passages.
  Terrain Plate — A portable relief model of nearby land, structures, or ruins used to plan movement and avoid traps.
  Survey Compass — A calibrated compass that locates landmarks, ruins, relic traces, mineral deposits, or route anomalies.
  Boundary Markers — Placed stakes, chalks, cords, or signs that define safe zones, paths, perimeters, or surveyed ground.
  Expedition Cache — A prepared supply store hidden or carried for later retrieval in the field.

STRATEGIST [Tier 3, Lvl 10-20, 3pt each, from Tactician]
  War Table — A command installation that coordinates allies, formations, routes, reserves, and battlefield priorities.
  Campaign Dossier — A master file that tracks roster resources and faction movements.
  Command Standard — A planted signal banner that organizes allied movement and prevents panic or disorder.
  Contingency Folio — A sealed set of prepared fallback plans that can be opened when a battle or mission turns.
  Grand Stratagem — A complete operational plan that changes the conditions of an encounter, siege, pursuit, or negotiation.

ARCHIVIST [Tier 3, Lvl 10-20, 3pt each, from Cartographer]
  Reliquary — A widened secured storage system for artifacts, rare texts, schematics, maps, and historical devices.
  Master Catalogue — A comprehensive index that cross-references relics, regions, factions, languages, and known threats.
  Translation Engine — A built decoding apparatus that converts lost scripts, symbolic systems, and ciphered records.
  History Cylinder — A preserved record device that stores testimony, images, maps, or reconstructed events.
  Archival Seal — A protective mark or casing that preserves fragile knowledge and prevents tampering, decay, or theft.

━━━ PATH: COVERT (Fortitude / Lithium) ━━━

ROGUE [Tier 1, Lvl 1-5, Free]
  Adept Lockpick Set — A portable tool set for opening locks, disabling catches, and bypassing simple mechanisms.
  Smoke Pellet — A thrown device that creates cover for escape, infiltration, or repositioning.
  Silent Sole — Modified footwear that reduces noise and improves stealth movement.
  Spring Blade — A concealed weapon mechanism built for sudden precision strikes.
  Climbing Line — A compact grapnel, cord, and hook system used to scale walls, cross gaps, or enter guarded spaces.

INSPECTOR [Tier 2, Lvl 5-10, 2pt each]
  Inspector's Scope — A crafted lens that reveals scratches, residues, hidden seams, forged marks, and tampered objects.
  Evidence Kit — A case of powders, vials, wax, thread, and tags used to preserve traces for later analysis.
  Falsehood Register — A written comparison file of statements, signatures, accounts, and contradictions.
  Scene Grid — A deployable cord-and-marker layout used to reconstruct movement, angle, timing, and position.
  Trace Evidence Canister — A sealed container for carrying hair, ash, blood, soil, fiber, residue, or other evidence without contamination.

RANGER [Tier 2, Lvl 5-10, 2pt each]
  Trail Markers — Subtle placed signs that guide allies, confuse pursuers, or mark danger.
  Camouflage Cloak — A crafted cloak adapted to terrain, light, foliage, dust, or stone.
  Snare Kit — A carried set of wire, stakes, hooks, and triggers for catching, slowing, or warning.
  Field Glass — A compact optical tool for scouting, rangefinding, and identifying threats at distance.
  Ranger's Cache — A hidden supply bundle prepared for later recovery in hostile or remote terrain.

DETECTIVE [Tier 3, Lvl 10-20, 3pt each, from Inspector]
  Caseboard — A portable or installed board that links suspects, motives, routes, objects, and contradictions.
  Autopsy Roll — A specialized tool wrap for examining wounds, cause of death, poison, disease, or unnatural damage.
  Interrogation Lamp — A focused lamp-and-seat apparatus used to pressure testimony and expose inconsistencies.
  Undercover Kit — A prepared disguise, credential, accent guide, and forged identity package.
  Chain of Evidence — A sealed documentation system that makes gathered proof difficult to dismiss, alter, or destroy.

STRIDER [Tier 3, Lvl 10-20, 3pt each, from Ranger]
  Phantom Cloak — A high-grade stealth cloak that breaks outline, muffles movement, and resists detection.
  Roofrunner Rig — A harness, hooks, reels, and grips system for rapid vertical movement.
  Shadow Cache — A hidden stash network placed across routes, safehouses, rooftops, or wilderness paths.
  Vanishing Dust — A prepared powder that obscures tracks, scent, fingerprints, and residue.
  Strider's Pathkit — A complete infiltration kit for bypassing walls, locks, patrols, terrain, and pursuit.

━━━ PATH: ARTIFICE (Reason / Null) ━━━

ARTIFICER [Tier 1, Lvl 1-5, Free]
  Grimrite Spark — A compact ignition core used to power small devices, trigger mechanisms, and improvised inventions.
  Field Repair Kit — A portable toolkit for restoring damaged weapons, armor, devices, vehicles, and schematics.
  Infusion Clamp — A mechanical brace that temporarily improves a weapon, tool, or piece of armor.
  Clockwork Key — A wound mechanism that activates simple machines, locks, timers, and stored devices.
  Utility Bracer — A wrist-mounted tool rig containing small blades, wire, lenses, picks, and deployable gadgets.

GUNSLINGER [Tier 2, Lvl 5-10, 2pt each]
  Firearm Grit — A reinforced firearm assembly built to endure repeated high-pressure shots.
  Trickshot Cylinder — A rotating chamber that stores specialized rounds for cover-breaking, disarming, pinning, or ricochet fire.
  Quickdraw Holster — A spring-loaded holster designed for rapid draw, reload, and weapon readiness.
  Powder Baffle — A barrel attachment that reduces recoil, flash, smoke, and misfire risk.
  Deadeye Scope — A precision sight that improves range, target reading, and weak-point accuracy.

TINKERER [Tier 2, Lvl 5-10, 2pt each]
  Clockwork Familiar — A small constructed assistant used for carrying, repairing, scouting, or manipulating simple objects.
  Gearwork Bench — A portable workbench that improves crafting, repair, assembly, and schematic modification.
  Springloaded Arm — A mounted tool-limb used for gripping, lifting, striking, or operating mechanisms at reach.
  Remote Relay — A signal device that allows simple constructs or machines to receive commands at distance.
  Automaton Core — A crafted control center used to animate, direct, or stabilize constructed machines.

THAUMATURGE [Tier 3, Lvl 10-20, 3pt each, from Gunslinger]
  Hybrid Forge — A built forge-unit that combines mechanism and controlled resonance to reproduce studied effects through devices.
  Resonance Battery — A charge cell that stores power for later release into firearms, tools, armor, or constructs.
  Spellcartridge Press — A loading press that creates specialized ammunition carrying contained arcane effects.
  Overcharge Coil — A wound power system that doubles a device's output while risking burnout.
  Thaumic Regulator — A stabilizing apparatus that prevents resonance devices from misfiring, overloading, or collapsing.

MACHINIST [Tier 3, Lvl 10-20, 3pt each, from Tinkerer]
  Exosuit Titan — A large mechanical suit that increases strength, protection, speed, and built-in weapon capacity.
  Veinrunner Command Node — A control interface for directing vehicles, engines, constructs, or industrial machines.
  Piston Armature — A powered limb-frame that enhances lifting, striking, bracing, and tool operation.
  Ironwork Drone — A durable construct assistant built for labor, defense, repair, and battlefield support.
  Masterwork Engine — A central power unit that sustains large machines, exosuits, workshops, or linked schematics.
`;
