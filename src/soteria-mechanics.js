// ═══════════════════════════════════════════════════════════════════════════════
// SOTERIA MECHANICS — The Scribe's System Reference
// Import: import { SOTERIA_MECHANICS } from './soteria-mechanics';
// ═══════════════════════════════════════════════════════════════════════════════

import { SOTERIA_CLASSES } from './soteria-classes';

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
EXPERIENCE (XP) AND ABILITY POINTS (AP)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

XP is experience. It sets a character's level and comes from the DM (the Architect), quests and certain items.
AP is the currency spent on abilities. A character gains AP as its level rises.

- Abilities are bought with AP in the Constellation, the character's ability tree, and are learned at once.
- Each class's first purchase costs one extra AP; later purchases cost 1 to 5 AP by depth.
- AP has a current (unspent) and total value tracked on the sheet. The last purchase can be undone for a refund.
- A consult with the Scribe costs 1 AP.

The Scribe defers all XP award decisions to the Architect.

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

${SOTERIA_CLASSES}
`;
