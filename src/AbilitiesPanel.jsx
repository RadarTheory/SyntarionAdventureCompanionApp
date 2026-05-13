// ─── ABILITIES PANEL ──────────────────────────────────────────────────────────
// Drop this component into CampaignView.jsx and add 'Abilities' to the TABS array
// between 'Actions' and 'Inventory'.
//
// Usage in renderTab():
//   case 'Abilities':
//     return userChar
//       ? <AbilitiesPanel char={userChar} campaignId={String(campaign.id)} onRoll={rollAbility} />
//       : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;
//
// Also add rollAbility helper in CampaignDashboard (see bottom of this file).
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// ─── SEED DATA ────────────────────────────────────────────────────────────────
// Structured to be DB-replaceable. Each entry maps to one of the 7 magic or
// tech disciplines. `currencyKey` matches char.disciplines[key].
// `statKey` is the primary stat used for the roll modifier.

const SPELL_CATALOG = [
  // ── DIVINE / SANCTUS ──
  {
    id: 'sp_sanctus_1', discipline: 'sanctus', disciplineLabel: 'Divine',
    name: 'Sanctified Strike', type: 'Combat',
    cost: 1, currencyKey: 'sanctus', currencyLabel: 'Sanctus Orb',
    statKey: 'soul',
    effect: 'Imbue a weapon strike with divine force. On hit, target is pushed back one position.',
    range: 'Melee', duration: 'Instant',
  },
  {
    id: 'sp_sanctus_2', discipline: 'sanctus', disciplineLabel: 'Divine',
    name: 'Ward of Faith', type: 'Defense',
    cost: 2, currencyKey: 'sanctus', currencyLabel: 'Sanctus Orb',
    statKey: 'soul',
    effect: 'Manifest a divine barrier. Reduces next incoming damage by your Soul value.',
    range: 'Self', duration: '1 round',
  },
  {
    id: 'sp_sanctus_3', discipline: 'sanctus', disciplineLabel: 'Divine',
    name: 'Consecrate Ground', type: 'Utility',
    cost: 3, currencyKey: 'sanctus', currencyLabel: 'Sanctus Orb',
    statKey: 'soul',
    effect: 'Sanctify a 10ft area. Allies within restore 2 Vitals per turn. Hostile undead cannot enter.',
    range: '30ft', duration: '3 rounds',
  },
  // ── SPIRIT / SACRAL ──
  {
    id: 'sp_sacral_1', discipline: 'sacral', disciplineLabel: 'Spirit',
    name: 'Sacral Whisper', type: 'Utility',
    cost: 1, currencyKey: 'sacral', currencyLabel: 'Sacral Will',
    statKey: 'spirit',
    effect: 'Commune briefly with a nearby spirit or ancestor. Ask one yes/no question.',
    range: 'Self', duration: 'Instant',
  },
  {
    id: 'sp_sacral_2', discipline: 'sacral', disciplineLabel: 'Spirit',
    name: 'Spirit Surge', type: 'Combat',
    cost: 2, currencyKey: 'sacral', currencyLabel: 'Sacral Will',
    statKey: 'spirit',
    effect: 'Channel spirit energy through your body. Next action roll gains +Spirit modifier.',
    range: 'Self', duration: 'Instant',
  },
  {
    id: 'sp_sacral_3', discipline: 'sacral', disciplineLabel: 'Spirit',
    name: 'Bind Remnant', type: 'Control',
    cost: 3, currencyKey: 'sacral', currencyLabel: 'Sacral Will',
    statKey: 'spirit',
    effect: 'Tether a spirit or ghost in place. It cannot move or act for 2 rounds.',
    range: '20ft', duration: '2 rounds',
  },
  // ── MAGIC / MANA ──
  {
    id: 'sp_mana_1', discipline: 'mana', disciplineLabel: 'Magic',
    name: 'Mana Wisp', type: 'Utility',
    cost: 1, currencyKey: 'mana', currencyLabel: 'Mana Wisp',
    statKey: 'essence',
    effect: 'Conjure a floating light source that follows you. Reveals hidden glyphs.',
    range: 'Self', duration: '10 min',
  },
  {
    id: 'sp_mana_2', discipline: 'mana', disciplineLabel: 'Magic',
    name: 'Force Bolt', type: 'Combat',
    cost: 1, currencyKey: 'mana', currencyLabel: 'Mana Wisp',
    statKey: 'essence',
    effect: 'Fire a raw bolt of magical energy. Deals damage equal to your Essence modifier × 2.',
    range: '40ft', duration: 'Instant',
  },
  {
    id: 'sp_mana_3', discipline: 'mana', disciplineLabel: 'Magic',
    name: 'Arcane Unravel', type: 'Utility',
    cost: 2, currencyKey: 'mana', currencyLabel: 'Mana Wisp',
    statKey: 'essence',
    effect: 'Dispel one active magical effect on a target or object.',
    range: '30ft', duration: 'Instant',
  },
  // ── NATURE / ESSENCE ──
  {
    id: 'sp_essence_1', discipline: 'essence', disciplineLabel: 'Nature',
    name: 'Rootbind', type: 'Control',
    cost: 1, currencyKey: 'essence', currencyLabel: 'Essence Seed',
    statKey: 'body',
    effect: 'Sprout roots from the ground to restrain a target. Movement reduced to 0 for 1 round.',
    range: '25ft', duration: '1 round',
  },
  {
    id: 'sp_essence_2', discipline: 'essence', disciplineLabel: 'Nature',
    name: 'Living Mend', type: 'Healing',
    cost: 2, currencyKey: 'essence', currencyLabel: 'Essence Seed',
    statKey: 'body',
    effect: 'Accelerate natural healing. Target restores Vitals equal to your Body modifier.',
    range: 'Touch', duration: 'Instant',
  },
  {
    id: 'sp_essence_3', discipline: 'essence', disciplineLabel: 'Nature',
    name: 'Overgrowth', type: 'Utility',
    cost: 3, currencyKey: 'essence', currencyLabel: 'Essence Seed',
    statKey: 'body',
    effect: 'Rapidly grow dense vegetation in a 15ft area. Difficult terrain, partial concealment.',
    range: '40ft', duration: '5 rounds',
  },
  // ── GLYPH / GNOSIS ──
  {
    id: 'sp_gnosis_1', discipline: 'gnosis', disciplineLabel: 'Glyph',
    name: 'Glyphread', type: 'Utility',
    cost: 1, currencyKey: 'gnosis', currencyLabel: 'Glyphstone',
    statKey: 'essence',
    effect: 'Decipher any magical inscription or rune, even in unknown languages.',
    range: 'Touch', duration: 'Instant',
  },
  {
    id: 'sp_gnosis_2', discipline: 'gnosis', disciplineLabel: 'Glyph',
    name: 'Sigil Trap', type: 'Combat',
    cost: 2, currencyKey: 'gnosis', currencyLabel: 'Glyphstone',
    statKey: 'essence',
    effect: 'Inscribe a hidden glyph on a surface. Triggers on contact, dealing Essence modifier damage.',
    range: 'Touch', duration: 'Until triggered or 1 hour',
  },
  {
    id: 'sp_gnosis_3', discipline: 'gnosis', disciplineLabel: 'Glyph',
    name: 'Memory Seal', type: 'Utility',
    cost: 3, currencyKey: 'gnosis', currencyLabel: 'Glyphstone',
    statKey: 'essence',
    effect: 'Lock a memory, piece of knowledge, or message into a glyph. Another caster can unlock it.',
    range: 'Self', duration: 'Permanent until unsealed',
  },
  // ── LIGHT / SHAEID ──
  {
    id: 'sp_shaeid_1', discipline: 'shaeid', disciplineLabel: 'Light',
    name: 'Shaeid Flare', type: 'Combat',
    cost: 1, currencyKey: 'shaeid', currencyLabel: 'Shaeid Shard',
    statKey: 'spirit',
    effect: 'Blind a target with concentrated light for 1 round. Disadvantage on next roll.',
    range: '20ft', duration: '1 round',
  },
  {
    id: 'sp_shaeid_2', discipline: 'shaeid', disciplineLabel: 'Light',
    name: 'Illuminate Truth', type: 'Utility',
    cost: 2, currencyKey: 'shaeid', currencyLabel: 'Shaeid Shard',
    statKey: 'spirit',
    effect: 'Reveal hidden objects, invisible entities, and illusions in a 20ft radius for 2 rounds.',
    range: 'Self (20ft radius)', duration: '2 rounds',
  },
  {
    id: 'sp_shaeid_3', discipline: 'shaeid', disciplineLabel: 'Light',
    name: 'Lunar Bridge', type: 'Utility',
    cost: 3, currencyKey: 'shaeid', currencyLabel: 'Shaeid Shard',
    statKey: 'spirit',
    effect: 'Project a bridge of solidified light across a gap up to 30ft wide. Lasts 3 rounds.',
    range: '30ft', duration: '3 rounds',
  },
  // ── SHADOW / WRAILL ──
  {
    id: 'sp_wraill_1', discipline: 'wraill', disciplineLabel: 'Shadow',
    name: 'Felldrop', type: 'Combat',
    cost: 1, currencyKey: 'wraill', currencyLabel: 'Felldrop',
    statKey: 'soul',
    effect: 'Drip shadow-essence onto a target. They take damage over 2 rounds equal to your Soul modifier.',
    range: '30ft', duration: '2 rounds',
  },
  {
    id: 'sp_wraill_2', discipline: 'wraill', disciplineLabel: 'Shadow',
    name: 'Umbral Step', type: 'Utility',
    cost: 2, currencyKey: 'wraill', currencyLabel: 'Felldrop',
    statKey: 'soul',
    effect: 'Merge with your shadow briefly, teleporting up to 20ft to any darkened space.',
    range: '20ft', duration: 'Instant',
  },
  {
    id: 'sp_wraill_3', discipline: 'wraill', disciplineLabel: 'Shadow',
    name: 'Veil of Dread', type: 'Control',
    cost: 3, currencyKey: 'wraill', currencyLabel: 'Felldrop',
    statKey: 'soul',
    effect: 'Emanate an aura of shadow-terror. Enemies within 15ft must roll Will or be Shaken (−2 all rolls) for 2 rounds.',
    range: 'Self (15ft aura)', duration: '2 rounds',
  },
];

const SCHEMATIC_CATALOG = [
  // ── GAIN / ION ──
  {
    id: 'sc_ion_1', discipline: 'gain', disciplineLabel: 'Ion',
    name: 'Ion Pulse', type: 'Combat',
    cost: 1, currencyKey: 'gain', currencyLabel: 'Ion Cap',
    statKey: 'will',
    effect: 'Release a burst of ion energy. Disrupts one electrical or mechanical system within range.',
    range: '20ft', duration: 'Instant',
  },
  {
    id: 'sc_ion_2', discipline: 'gain', disciplineLabel: 'Ion',
    name: 'Static Field', type: 'Control',
    cost: 2, currencyKey: 'gain', currencyLabel: 'Ion Cap',
    statKey: 'will',
    effect: 'Generate a field of static discharge in a 10ft area. Targets moving through take Will modifier damage.',
    range: '30ft', duration: '3 rounds',
  },
  {
    id: 'sc_ion_3', discipline: 'gain', disciplineLabel: 'Ion',
    name: 'Charge Capacitor', type: 'Utility',
    cost: 3, currencyKey: 'gain', currencyLabel: 'Ion Cap',
    statKey: 'will',
    effect: 'Overcharge a device or weapon. Its next use deals double output or effect.',
    range: 'Touch', duration: 'Instant',
  },
  // ── GRIT / STEAM ──
  {
    id: 'sc_steam_1', discipline: 'grit', disciplineLabel: 'Steam',
    name: 'Pressurize', type: 'Combat',
    cost: 1, currencyKey: 'grit', currencyLabel: 'Steam Core',
    statKey: 'will',
    effect: 'Vent high-pressure steam in a 10ft cone. Targets must roll Body or be Pushed and Disoriented.',
    range: '10ft cone', duration: 'Instant',
  },
  {
    id: 'sc_steam_2', discipline: 'grit', disciplineLabel: 'Steam',
    name: 'Core Burn', type: 'Combat',
    cost: 2, currencyKey: 'grit', currencyLabel: 'Steam Core',
    statKey: 'will',
    effect: 'Overheat a steam core, creating an explosive burst. Deals damage equal to Grit pool × 2 in 15ft.',
    range: '15ft burst', duration: 'Instant',
  },
  {
    id: 'sc_steam_3', discipline: 'grit', disciplineLabel: 'Steam',
    name: 'Ironclad Shell', type: 'Defense',
    cost: 3, currencyKey: 'grit', currencyLabel: 'Steam Core',
    statKey: 'body',
    effect: 'Encase yourself in a pressurized steam shell. Reduce incoming damage by 4 for 2 rounds.',
    range: 'Self', duration: '2 rounds',
  },
  // ── FOCUS / ELEMENT ──
  {
    id: 'sc_element_1', discipline: 'focus', disciplineLabel: 'Element',
    name: 'Element Charm', type: 'Utility',
    cost: 1, currencyKey: 'focus', currencyLabel: 'Element Charm',
    statKey: 'mind',
    effect: 'Attune briefly to one element (fire, water, stone, wind). Gain resistance to that element for 2 rounds.',
    range: 'Self', duration: '2 rounds',
  },
  {
    id: 'sc_element_2', discipline: 'focus', disciplineLabel: 'Element',
    name: 'Elemental Strike', type: 'Combat',
    cost: 2, currencyKey: 'focus', currencyLabel: 'Element Charm',
    statKey: 'mind',
    effect: 'Channel a chosen element through a weapon or ranged attack. Deals Mind modifier as bonus elemental damage.',
    range: 'Weapon range', duration: 'Instant',
  },
  {
    id: 'sc_element_3', discipline: 'focus', disciplineLabel: 'Element',
    name: 'Convergence', type: 'Control',
    cost: 3, currencyKey: 'focus', currencyLabel: 'Element Charm',
    statKey: 'mind',
    effect: 'Draw opposing elements together, creating a destabilizing explosion in a 20ft area.',
    range: '40ft', duration: 'Instant',
  },
  // ── MATTER / ARC ──
  {
    id: 'sc_arc_1', discipline: 'matter', disciplineLabel: 'Arc',
    name: 'Arc Spore', type: 'Utility',
    cost: 1, currencyKey: 'matter', currencyLabel: 'Arc Spore',
    statKey: 'mind',
    effect: 'Release a spore that conducts arc energy. Tags a surface or target; next electrical discharge chains to it.',
    range: '20ft', duration: '5 rounds',
  },
  {
    id: 'sc_arc_2', discipline: 'matter', disciplineLabel: 'Arc',
    name: 'Matter Shift', type: 'Utility',
    cost: 2, currencyKey: 'matter', currencyLabel: 'Arc Spore',
    statKey: 'mind',
    effect: 'Alter the molecular density of a small object (≤ 5lbs). Make it temporarily weightless or rigid.',
    range: 'Touch', duration: '3 rounds',
  },
  {
    id: 'sc_arc_3', discipline: 'matter', disciplineLabel: 'Arc',
    name: 'Deconstruct', type: 'Combat',
    cost: 3, currencyKey: 'matter', currencyLabel: 'Arc Spore',
    statKey: 'mind',
    effect: 'Disassemble an unattended mechanical object or a section of barrier. Deals Mind × 3 to constructs.',
    range: '10ft', duration: 'Instant',
  },
  // ── REASON / CELL ──
  {
    id: 'sc_cell_1', discipline: 'reason', disciplineLabel: 'Cell',
    name: 'Rad Cell', type: 'Utility',
    cost: 1, currencyKey: 'reason', currencyLabel: 'Rad Cell',
    statKey: 'dream',
    effect: 'Activate a cell unit to power a device, lock, or engine for 10 minutes.',
    range: 'Touch', duration: '10 min',
  },
  {
    id: 'sc_cell_2', discipline: 'reason', disciplineLabel: 'Cell',
    name: 'Calculated Strike', type: 'Combat',
    cost: 2, currencyKey: 'reason', currencyLabel: 'Rad Cell',
    statKey: 'dream',
    effect: 'Analyze target weak points. Next attack automatically hits and uses Dream modifier as bonus damage.',
    range: 'Self', duration: 'Next action',
  },
  {
    id: 'sc_cell_3', discipline: 'reason', disciplineLabel: 'Cell',
    name: 'Cascade Protocol', type: 'Control',
    cost: 3, currencyKey: 'reason', currencyLabel: 'Rad Cell',
    statKey: 'dream',
    effect: 'Execute a chain of technical maneuvers. Take 2 additional actions this turn, each at −2.',
    range: 'Self', duration: 'This turn',
  },
  // ── FORTITUDE / LITHIUM ──
  {
    id: 'sc_lithium_1', discipline: 'fortitude', disciplineLabel: 'Lithium',
    name: 'Lithium Lens', type: 'Utility',
    cost: 1, currencyKey: 'fortitude', currencyLabel: 'Lithium Lens',
    statKey: 'body',
    effect: 'Focus lithium energy through a lens to cut through metal, stone, or dense material.',
    range: 'Touch', duration: 'Instant',
  },
  {
    id: 'sc_lithium_2', discipline: 'fortitude', disciplineLabel: 'Lithium',
    name: 'Stabilize', type: 'Defense',
    cost: 2, currencyKey: 'fortitude', currencyLabel: 'Lithium Lens',
    statKey: 'body',
    effect: 'Inject stabilizing compounds. Remove one debuff and regain Body modifier in Vitals.',
    range: 'Touch', duration: 'Instant',
  },
  {
    id: 'sc_lithium_3', discipline: 'fortitude', disciplineLabel: 'Lithium',
    name: 'Endurance Surge', type: 'Combat',
    cost: 3, currencyKey: 'fortitude', currencyLabel: 'Lithium Lens',
    statKey: 'body',
    effect: 'Push past physical limits. Ignore all wound penalties for 3 rounds.',
    range: 'Self', duration: '3 rounds',
  },
  // ── INGENUITY / NULL ──
  {
    id: 'sc_null_1', discipline: 'ingenuity', disciplineLabel: 'Null',
    name: 'Nullid', type: 'Utility',
    cost: 1, currencyKey: 'ingenuity', currencyLabel: 'Nullid',
    statKey: 'whim',
    effect: 'Deploy a null-field patch. Suppresses one active magical or tech effect in a 5ft area for 1 round.',
    range: '15ft', duration: '1 round',
  },
  {
    id: 'sc_null_2', discipline: 'ingenuity', disciplineLabel: 'Null',
    name: 'Adaptive Bypass', type: 'Utility',
    cost: 2, currencyKey: 'ingenuity', currencyLabel: 'Nullid',
    statKey: 'whim',
    effect: 'Rapidly reverse-engineer and bypass any security system, lock, or encrypted seal.',
    range: 'Touch', duration: 'Instant',
  },
  {
    id: 'sc_null_3', discipline: 'ingenuity', disciplineLabel: 'Null',
    name: 'Null Cascade', type: 'Combat',
    cost: 3, currencyKey: 'ingenuity', currencyLabel: 'Nullid',
    statKey: 'whim',
    effect: 'Detonate a null-field in a 20ft burst. Disables all active magical and tech effects in range for 2 rounds.',
    range: '20ft burst', duration: '2 rounds',
  },
];

// ─── DISCIPLINE GROUPING ───────────────────────────────────────────────────────
const MAGIC_DISCIPLINES = ['sanctus', 'sacral', 'mana', 'essence', 'gnosis', 'shaeid', 'wraill'];
const TECH_DISCIPLINES  = ['gain', 'grit', 'focus', 'matter', 'reason', 'fortitude', 'ingenuity'];

const DISCIPLINE_META = {
  sanctus:   { label: 'Divine',     color: '#e8d9a7', axis: 'magic' },
  sacral:    { label: 'Spirit',     color: COLORS.magic,  axis: 'magic' },
  mana:      { label: 'Magic',      color: '#a78bfa', axis: 'magic' },
  essence:   { label: 'Nature',     color: '#86efac', axis: 'magic' },
  gnosis:    { label: 'Glyph',      color: '#fbbf24', axis: 'magic' },
  shaeid:    { label: 'Light',      color: '#fef9c3', axis: 'magic' },
  wraill:    { label: 'Shadow',     color: '#a8a29e', axis: 'magic' },
  gain:      { label: 'Ion',        color: COLORS.tech,   axis: 'tech'  },
  grit:      { label: 'Steam',      color: '#fb923c', axis: 'tech'  },
  focus:     { label: 'Element',    color: '#38bdf8', axis: 'tech'  },
  matter:    { label: 'Arc',        color: '#4ade80', axis: 'tech'  },
  reason:    { label: 'Cell',       color: '#c084fc', axis: 'tech'  },
  fortitude: { label: 'Lithium',    color: '#94a3b8', axis: 'tech'  },
  ingenuity: { label: 'Null',       color: '#e2e8f0', axis: 'tech'  },
};

const TYPE_COLORS = {
  Combat:  '#e05a5a',
  Defense: COLORS.tech,
  Utility: COLORS.magic,
  Control: '#fbbf24',
  Healing: '#86efac',
};

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// ─── ABILITY CARD ─────────────────────────────────────────────────────────────
function AbilityCard({ entry, char, campaignId, onRoll, disabled, onRequestUse }) {
  const [expanded, setExpanded] = useState(false);
  const [rolling, setRolling]   = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested]   = useState(false);

  const meta    = DISCIPLINE_META[entry.discipline] || {};
  const pool    = char?.disciplines?.[entry.currencyKey] ?? 0;
  const canAfford = pool >= entry.cost;
  const typeColor = TYPE_COLORS[entry.type] || COLORS.dim;
  const statVal = char?.stats?.[entry.statKey] || 8;
  const modifier = statVal - 8; // modifier relative to baseline 8

  const handleRoll = async () => {
    if (rolling || disabled || !canAfford) return;
    setRolling(true);
    await onRoll(entry, modifier);
    setRolling(false);
  };

  const handleRequest = async () => {
    if (requesting || requested) return;
    setRequesting(true);
    try {
      await supabase.from('messages').insert({
        type: 'dm',
        is_dm: false,
        sender_name: char?.name || 'Player',
        character_id: char?.id ? String(char.id) : null,
        campaign_id: campaignId,
        content: `[ABILITY REQUEST] ${char?.name || 'Player'} is requesting use of **${entry.name}** (${entry.disciplineLabel} — ${entry.axis === 'magic' ? 'Spell' : 'Schematic'}) against their current alignment. Reason: alignment gating. Please approve or deny.`,
        session_id: null,
      });
      setRequested(true);
    } catch (e) {
      console.error('Failed to send ability request:', e);
    }
    setRequesting(false);
  };

  return (
    <div style={{
      background: disabled ? 'rgba(20,16,12,0.4)' : COLORS.card,
      border: `1px solid ${disabled ? `${COLORS.border}55` : meta.color + '33'}`,
      borderRadius: 10,
      overflow: 'hidden',
      opacity: disabled ? 0.55 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* Card header — always visible */}
      <button
        onClick={() => setExpanded(o => !o)}
        style={{
          width: '100%', background: 'transparent', border: 'none',
          padding: '11px 14px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700,
              color: disabled ? COLORS.dim : meta.color,
              letterSpacing: '0.04em',
            }}>
              {entry.name}
            </div>
            <div style={{
              fontSize: 7, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em',
              color: typeColor,
              background: typeColor + '18',
              border: `1px solid ${typeColor}44`,
              borderRadius: 3, padding: '1px 5px', flexShrink: 0,
            }}>
              {entry.type}
            </div>
            <div style={{
              fontSize: 7, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em',
              color: disabled ? COLORS.dim : meta.color + 'cc',
              flexShrink: 0,
            }}>
              {entry.disciplineLabel}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 8, color: canAfford && !disabled ? meta.color : '#e05a5a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {entry.cost} {entry.currencyLabel} · Pool: {pool}
            </div>
            <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
              {entry.range}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: COLORS.dim, marginLeft: 8, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>▾</div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}>
            {entry.effect}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
              DURATION <span style={{ color: COLORS.muted, marginLeft: 4 }}>{entry.duration}</span>
            </div>
            <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
              KEY STAT <span style={{ color: COLORS.muted, marginLeft: 4 }}>{entry.statKey.toUpperCase()} {statVal} ({modifier >= 0 ? '+' : ''}{modifier})</span>
            </div>
          </div>

          {/* Action row */}
          {disabled ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', flex: 1 }}>
                Alignment too far — requires Architect approval.
              </div>
              {requested ? (
                <div style={{ fontSize: 8, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>
                  ✓ Request sent
                </div>
              ) : (
                <button
                  onClick={handleRequest}
                  disabled={requesting}
                  style={{
                    background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.35)',
                    borderRadius: 6, padding: '6px 12px', cursor: requesting ? 'default' : 'pointer',
                    fontFamily: "'Cinzel', serif", fontSize: 8, color: '#e8c84a',
                    letterSpacing: '0.08em', flexShrink: 0,
                  }}
                >
                  {requesting ? 'Sending…' : 'Request Use'}
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleRoll}
                disabled={rolling || !canAfford}
                style={{
                  flex: 1,
                  background: canAfford ? `${meta.color}18` : 'transparent',
                  border: `1px solid ${canAfford ? meta.color + '55' : COLORS.border}`,
                  borderRadius: 7, padding: '8px 12px',
                  cursor: (rolling || !canAfford) ? 'default' : 'pointer',
                  fontFamily: "'Cinzel', serif", fontSize: 9,
                  color: canAfford ? meta.color : COLORS.dim,
                  fontWeight: 700, letterSpacing: '0.1em',
                  opacity: canAfford ? 1 : 0.5,
                }}
              >
                {rolling ? 'Rolling…' : !canAfford ? `Not enough ${entry.currencyLabel}` : `Roll d20 ${modifier >= 0 ? `+${modifier}` : modifier}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── SECTION BLOCK ────────────────────────────────────────────────────────────
function AbilitySection({ title, axis, entries, char, campaignId, onRoll, disabled, alignVal }) {
  const [collapsed, setCollapsed] = useState(false);
  const axisColor = axis === 'magic' ? COLORS.magic : COLORS.tech;

  // Group by discipline
  const byDiscipline = {};
  entries.forEach(e => {
    if (!byDiscipline[e.discipline]) byDiscipline[e.discipline] = [];
    byDiscipline[e.discipline].push(e);
  });

  // Only show disciplines the character has any pool in, OR show all as seed
  const disciplines = Object.keys(byDiscipline);

  return (
    <div style={{
      background: disabled ? 'rgba(10,8,6,0.3)' : COLORS.surface,
      border: `1px solid ${disabled ? `${COLORS.border}44` : axisColor + '2a'}`,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 20,
    }}>
      {/* Section header */}
      <button
        onClick={() => setCollapsed(o => !o)}
        style={{
          width: '100%', background: disabled ? 'rgba(10,8,6,0.4)' : `${axisColor}0d`,
          border: 'none', borderBottom: `1px solid ${disabled ? COLORS.border + '44' : axisColor + '22'}`,
          padding: '14px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700,
            color: disabled ? COLORS.dim : axisColor,
            letterSpacing: '0.12em',
          }}>
            {title}
          </div>
          {disabled && (
            <div style={{
              fontSize: 7, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em',
              color: COLORS.dim, background: COLORS.card,
              border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '2px 6px',
            }}>
              ALIGNMENT LOCKED
            </div>
          )}
          {!disabled && (
            <div style={{ fontSize: 8, color: axisColor + 'aa', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {axis === 'magic'
                ? `alignVal ${alignVal} — magic favoured`
                : `alignVal ${alignVal} — tech favoured`}
            </div>
          )}
        </div>
        <div style={{ color: COLORS.dim, fontSize: 10, transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'none' }}>▾</div>
      </button>

      {!collapsed && (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {disciplines.map(disc => {
            const meta    = DISCIPLINE_META[disc] || {};
            const pool    = char?.disciplines?.[disc] ?? 0;
            const entries = byDiscipline[disc];
            return (
              <div key={disc}>
                {/* Discipline sub-header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${disabled ? COLORS.border + '44' : meta.color + '22'}` }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: disabled ? COLORS.dim : meta.color, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {meta.label}
                  </div>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: 8,
                    color: pool > 0 && !disabled ? meta.color : COLORS.dim,
                    background: pool > 0 && !disabled ? meta.color + '18' : COLORS.card,
                    border: `1px solid ${pool > 0 && !disabled ? meta.color + '44' : COLORS.border}`,
                    borderRadius: 4, padding: '1px 7px',
                  }}>
                    {pool} {entries[0]?.currencyLabel}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {entries.map(entry => (
                    <AbilityCard
                      key={entry.id}
                      entry={entry}
                      char={char}
                      campaignId={campaignId}
                      onRoll={onRoll}
                      disabled={disabled}
                      onRequestUse={() => {}}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ABILITIES PANEL (exported) ───────────────────────────────────────────────
export default function AbilitiesPanel({ char, campaignId, onRoll }) {
  const [filter, setFilter] = useState('All'); // 'All' | 'Combat' | 'Defense' | 'Utility' | 'Control' | 'Healing'

  // Alignment gating — uses char.alignment (-10 to +10)
  const alignVal = Number(char?.alignment ?? 0);
  const spellsDisabled     = alignVal >= 3;   // too far tech-side
  const schematicsDisabled = alignVal <= -3;  // too far magic-side

  const filterTypes = ['All', 'Combat', 'Defense', 'Utility', 'Control', 'Healing'];

  const applyFilter = entries =>
    filter === 'All' ? entries : entries.filter(e => e.type === filter);

  return (
    <div>
      {/* Header + axis status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ ...label8() }}>Spells & Schematics</div>
        <div style={{
          fontSize: 8, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em',
          color: alignVal < -3 ? COLORS.magic : alignVal > 3 ? COLORS.tech : COLORS.muted,
        }}>
          Axis {alignVal > 0 ? `+${alignVal}` : alignVal}
        </div>
      </div>

      {/* Alignment indicator bar */}
      <div style={{ position: 'relative', height: 4, background: `linear-gradient(to right, ${COLORS.magic}55, ${COLORS.border}, ${COLORS.tech}55)`, borderRadius: 2, marginBottom: 16 }}>
        {/* Threshold markers */}
        {[-3, 3].map(v => (
          <div key={v} style={{
            position: 'absolute',
            left: `${((v + 10) / 20) * 100}%`,
            top: -2, width: 1, height: 8,
            background: COLORS.muted + '88',
          }} />
        ))}
        {/* Current position */}
        <div style={{
          position: 'absolute',
          left: `${((alignVal + 10) / 20) * 100}%`,
          top: '50%', transform: 'translate(-50%, -50%)',
          width: 10, height: 10, borderRadius: '50%',
          background: alignVal < -3 ? COLORS.magic : alignVal > 3 ? COLORS.tech : COLORS.muted,
          border: `2px solid ${COLORS.surface}`,
          boxShadow: `0 0 6px ${alignVal < -3 ? COLORS.magic : alignVal > 3 ? COLORS.tech : COLORS.muted}88`,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'absolute', top: 7, left: 0, right: 0 }}>
          <div style={{ fontSize: 6, color: COLORS.magic, fontFamily: "'Cinzel', serif" }}>Magic −10</div>
          <div style={{ fontSize: 6, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>Neutral</div>
          <div style={{ fontSize: 6, color: COLORS.tech, fontFamily: "'Cinzel', serif" }}>Tech +10</div>
        </div>
      </div>
      <div style={{ height: 18 }} />

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 20 }}>
        {filterTypes.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            style={{
              background: filter === t ? 'rgba(200,168,74,0.14)' : 'transparent',
              border: `1px solid ${filter === t ? 'rgba(200,168,74,0.5)' : COLORS.border}`,
              borderRadius: 4, padding: '3px 9px', cursor: 'pointer',
              fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em',
              color: filter === t ? '#e8c84a' : COLORS.dim,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── SPELLS ── */}
      <AbilitySection
        title="Spells"
        axis="magic"
        entries={applyFilter(SPELL_CATALOG)}
        char={char}
        campaignId={campaignId}
        onRoll={onRoll}
        disabled={spellsDisabled}
        alignVal={alignVal}
      />

      {/* ── SCHEMATICS ── */}
      <AbilitySection
        title="Schematics"
        axis="tech"
        entries={applyFilter(SCHEMATIC_CATALOG)}
        char={char}
        campaignId={campaignId}
        onRoll={onRoll}
        disabled={schematicsDisabled}
        alignVal={alignVal}
      />

      {/* Footer note */}
      <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
        Alignment threshold ±3 · Use Request sends a message to the Architect
      </div>
    </div>
  );
}

// ─── INTEGRATION INSTRUCTIONS ─────────────────────────────────────────────────
//
// 1. COPY AbilitiesPanel.jsx to src/components/AbilitiesPanel.jsx
//
// 2. In CampaignView.jsx, add the import at the top:
//    import AbilitiesPanel from './AbilitiesPanel';
//
// 3. Update TABS constant (around line "const TABS = [...]"):
//    const TABS = ['Map', 'Sheet', 'Scales', 'Actions', 'Abilities', 'Inventory', 'Loot', 'Log'];
//
// 4. Add rollAbility helper inside CampaignDashboard (alongside rollAction):
//
//    const rollAbility = async (entry, modifier) => {
//      const roll = Math.floor(Math.random() * 20) + 1;
//      const total = roll + modifier;
//      const { data: hsession } = await supabase
//        .from('hercules_sessions').select('id')
//        .eq('campaign_id', String(campaign.id)).eq('status', 'active')
//        .order('created_at', { ascending: false }).limit(1).maybeSingle();
//      if (!hsession?.id) return;
//      await supabase.from('hercules_events').insert({
//        session_id: hsession.id,
//        type: 'ability',
//        actor_name: userChar?.name || 'Player',
//        actor_id: userChar?.id ? String(userChar.id) : null,
//        description: `${userChar?.name || 'Player'} used ${entry.name} [${entry.disciplineLabel}]: d20 ${roll} ${modifier >= 0 ? '+' : ''}${modifier} = ${total}.`,
//      });
//    };
//
// 5. Add case in renderTab() switch:
//
//    case 'Abilities':
//      return userChar
//        ? <AbilitiesPanel char={userChar} campaignId={String(campaign.id)} onRoll={rollAbility} />
//        : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;
//
// 6. Push:
//    git add .; git commit -m "feat: AbilitiesPanel — spells and schematics with alignment gating"; git push
