// ═══════════════════════════════════════════════════════════════════════════════
// SOTERIA MECHANICS — The Scribe's System Reference
// Add to SOTERIA_DM_CONTEXT after SOTERIA_LORE.
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

MAGIC (-4) ←————————— NEUTRAL (0) ————————→ TECH (+4)

- MAGIC side: spiritual, instinctual, tradition-bound, belief-driven
- NEUTRAL: balanced, pragmatic, unaffiliated, adaptive
- TECH side: analytical, systematic, rationalist, innovation-driven

A character's alignment affects:
- which discipline sources they can access
- how NPCs read and react to them
- certain gear, faction, and ability restrictions
- spiritual resonance (magic-aligned characters are more visible to spirits and gods)

Secondary alignment axes on the character sheet:
- WILL ←→ WHIM (physical expression: forceful vs. precise)
- SOUL ←→ SPIRIT (spiritual expression: faith-bound vs. presence-driven)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ABILITY POINTS (AP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AP is the primary advancement currency of Soteria.

- AP is granted exclusively by the DM (the Architect).
- Players spend AP on class abilities and heritage abilities.
- The DM controls the rate, timing, and conditions of AP awards.
- AP has a current (unspent) and total (lifetime) value tracked on the sheet.

The Scribe does not determine AP awards. When asked about AP, always refer back to the Architect's judgment.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DISCIPLINE SOURCES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each class discipline draws from a specific stat source.

MAGIC DISCIPLINES:
- Divine → SANCTUS (Spirit/Charisma)
- Sacral → CHIASMA (Soul/Faith)
- Magic → MANA (Body/Constitution)
- Nature → ESSENCE (Essence/Wisdom)
- Glyph/Arcane → GNOSIS (Will/Strength)
- Light/Mythic → SHAEID (Whim/Dexterity)
- Shadow/Harrow → WRAILL (Mind/Intelligence)

TECH DISCIPLINES:
- Business → GAIN (Ion)
- Martial → GRIT (Steam)
- Anti-Magic → FOCUS (Element)
- Alchemic → MATTER (Arc)
- Academic → REASON (Cell)
- Engineering → INGENUITY (Null)
- Fortitude → FORTITUDE (Lithium)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION ECONOMY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Actions are divided into categories. Each uses a specific stat.

UNIVERSAL ACTIONS (available to all):
- Interact — Dexterity
- Search — Dexterity
- Analyze — Mind/Intelligence
- Project — Spirit/Charisma
- Survey — Essence/Wisdom

COMBAT ACTIONS:
- Strike — Strength (Will)
- Range — Dexterity (Whim)
- Parry — Intelligence (Mind)
- Defend — Constitution (Body)
- Use — Intelligence (Mind)
- Rest — Faith (Soul)
- Flee — Dexterity (Whim)
- Disrupt — Focus
- Assist — Charisma (Spirit)
- Maneuver — Dexterity (Whim)
- Brace — Fortitude
- Rebound — Faith (Soul)

DEFENSE ACTIONS:
- Brace — Fortitude
- Endure — Body/Constitution
- Counter — Soul/Faith

ALIGNMENT ACTIONS (contextual):
- Heal — Faith/Intent
- Harm — Will/Chiasma
- Kinetic — Whim/Body

SOCIAL ACTIONS:
- Negotiate — Gain
- Intimidate — Charisma (Spirit)
- Insight — Wisdom (Essence)
- Deception — Charisma (Spirit)
- Persuade — Charisma (Spirit)
- Influence — Charisma (Spirit)
- Commands — Charisma (Spirit)
- Threaten — Grit
- Bribe — Gain
- Reason — Intelligence (Mind)
- Appeal — Charisma (Spirit)
- Taunt — Charisma (Spirit)

MAGIC ACTIONS:
- Invoke — Sanctus
- Flow — Chiasma
- Weave — Mana
- Inscribe — Gnosis
- Harrow — Wraill
- Call — Shaeid
- Attune — Essence

TECH ACTIONS:
- Broker — Gain
- Exert — Grit
- Nullify — Focus
- Transmute — Matter
- Tinker — Ingenuity
- Theorize — Reason
- Engineer — Reason

ACROBATICS:
- (General acrobatic feats — Whim/Dexterity based)

STEALTH ACTIONS:
- Hide — Dream (Intent)
- Sneak — Whim (Dexterity)
- Veil — Intent (Dream)
- Tail — Wisdom (Essence)
- Sleight — Dexterity (Whim)
- Sabotage — Ingenuity
- Infiltrate — Dexterity (Whim)
- Assassinate — Will (Strength)
- Disguise — Charisma (Spirit)
- Eavesdrop — Wisdom (Essence)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EQUIPMENT SLOTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

APPAREL (armor, clothing):
Head, Torso, Waist, Hands, Greaves, Boots

WEAPON SLOTS:
Main Hand, Off-Hand, Side-Weapon, Heavy

ACCESSORIES:
Ring I, Ring II, Neck, Charm, Relic, Artifact

Items can be ATTUNED or NON-ATTUNED. Attuned items provide active bonuses. Non-attuned items are carried but not spiritually linked.

Weight is tracked across: Consumables, Inventory, Pack, and Coin.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BACKGROUND & BELIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Each character has:
- BACKGROUND — history, origin, social context
- ALIGNMENT — position on the Magic/Tech axis
- BELIEF — patron god (Sanctus discipline) or patron spirit (Sacral discipline), or Unaffiliated
- MOTIVATION — personal driving force (roleplay anchor, also affects social actions)

Belief determines which divine or spiritual powers a character can draw upon and how NPCs of aligned faiths respond to them.
`;
