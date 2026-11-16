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

import { useEffect, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { logHerculesEvent } from './lib/herculesLog';
import { DISCIPLINE_META, poolOf, loadConstellation, learnedEntries, awakenedStars } from './constellationAbilities';

// ─── LEARNED ABILITIES ────────────────────────────────────────────────────────
// The panel lists the abilities the character has bought in the Constellation (the Abilities tab), read from
// data.abilities, using the constellation's own data module (constellation/data.js, served from /constellation/; see
// constellationAbilities.js). Each ability draws on its line's row of the character sheet's Magic | Tech table
// (traitFor), so the pools are the sheet's 16 traits, keyed by trait name in char.disciplines.

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
  const pool    = poolOf(char, entry.currencyKey);
  const canAfford = pool >= entry.cost;
  const typeColor = TYPE_COLORS[entry.type] || COLORS.dim;
  const statVal = entry.statKey ? (char?.stats?.[entry.statKey] || 8) : 8;
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
        content: `[ABILITY REQUEST] ${char?.name || 'Player'} is requesting use of **${entry.name}** (${entry.disciplineLabel} - ${entry.axis === 'magic' ? 'Spell' : 'Schematic'}) against their current alignment. Reason: alignment gating. Please approve or deny.`,
        session_id: null,
      });
      await logHerculesEvent(campaignId, {
        type: 'ability_request',
        actor_name: char?.name || 'Player',
        actor_id: char?.id ? String(char.id) : null,
        description: `${char?.name || 'Player'} requests use of ${entry.name} [${entry.disciplineLabel} - ${entry.axis === 'magic' ? 'Spell' : 'Schematic'}] against alignment gating.`,
        scribe_suggestion: 'Suggested outcome: approve the ability, deny it, or write the altered cost/consequence before it enters the story.',
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
              {entry.cost} {entry.currencyLabel} per use (provisional) · Pool: {pool}
            </div>
            <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
              {entry.className} · level {entry.level} of {entry.levels}
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
              KEY STAT <span style={{ color: COLORS.muted, marginLeft: 4 }}>{entry.statKey ? entry.statKey.toUpperCase() : 'NONE YET'} {statVal} ({modifier >= 0 ? '+' : ''}{modifier})</span>
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
            const pool    = poolOf(char, disc);
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
  // null while the constellation's data loads; then one entry per learned ability.
  const [entries, setEntries] = useState(null);
  const [stars, setStars] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const learnedKey = JSON.stringify([char?.abilities || [], char?.cid || null]);
  useEffect(() => {
    let live = true;
    loadConstellation()
      .then(d => { if (live) { const [abilities, cid] = JSON.parse(learnedKey); setEntries(learnedEntries(d, abilities)); setStars(awakenedStars(d, { abilities, cid })); } })
      .catch(() => { if (live) setLoadError('The constellation could not be loaded.'); });
    return () => { live = false; };
  }, [learnedKey]);
  const spells = (entries || []).filter(e => e.axis === 'magic');
  const schematics = (entries || []).filter(e => e.axis === 'tech');

  // Alignment gating — uses char.alignment (-10 to +10)
  const alignVal = Number(char?.alignment ?? 0);
  const spellsDisabled     = alignVal >= 3;   // too far tech-side
  const schematicsDisabled = alignVal <= -3;  // too far magic-side


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

      {loadError && <div style={{ fontSize: 11, color: '#e05a5a', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>{loadError}</div>}
      {!loadError && entries === null && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>Reading your constellation…</div>}
      {stars.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...label8(), marginBottom: 6 }}>Your Stars</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {stars.map(st => (
              <div key={st.id} style={{ border: `1px solid ${(st.color || COLORS.muted)}55`, background: `${st.color || COLORS.muted}10`, borderRadius: 7, padding: '6px 10px' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: st.color || COLORS.text, letterSpacing: '0.05em' }}>{st.name}{st.isStart ? ' · declared class' : ''}</div>
                <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", marginTop: 2 }}>
                  {st.levelName ? `${st.levelName.toUpperCase()} · ` : ''}level {st.level} of {st.levels} · {st.abilities} abilit{st.abilities === 1 ? 'y' : 'ies'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {entries && !entries.length && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>{stars.length ? "Your star is open, but no abilities are awakened yet. Spend AP on them in the Constellation, on your sheet's Abilities tab." : "No abilities learned yet. Awaken them in the Constellation, on your sheet's Abilities tab."}</div>}

      {/* ── SPELLS ── */}
      <AbilitySection
        title="Spells"
        axis="magic"
        entries={spells}
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
        entries={schematics}
        char={char}
        campaignId={campaignId}
        onRoll={onRoll}
        disabled={schematicsDisabled}
        alignVal={alignVal}
      />

      {/* Footer note */}
      <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
        Alignment threshold ±3 · Use Request sends a message to the Architect · Pools are your sheet's traits
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
