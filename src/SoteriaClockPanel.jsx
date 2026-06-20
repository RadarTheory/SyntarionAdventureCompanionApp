import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';

// ─── CALENDAR CONSTANTS ───────────────────────────────────────────────────────

const PASSES = [
  { id: 1,  name: 'Ba\'el',          segment: 'day',   label: 'Dawn' },
  { id: 2,  name: 'Ilowake',         segment: 'day',   label: 'Morning' },
  { id: 3,  name: 'Greenmeet',       segment: 'day',   label: 'Late Morning' },
  { id: 4,  name: 'Highday',         segment: 'day',   label: 'Mid-Morning' },
  { id: 5,  name: 'Harthrise',       segment: 'day',   label: 'Afternoon' },
  { id: 6,  name: 'The Zenith Star', segment: 'day',   label: 'Mid-Afternoon' },
  { id: 7,  name: 'Gildenset',       segment: 'day',   label: 'Late Afternoon' },
  { id: 8,  name: 'Hul-Mora',        segment: 'day',   label: 'Evening' },
  { id: 9,  name: 'Varndurn',        segment: 'day',   label: 'Nightfall' },
  { id: 10, name: 'Nimfall',         segment: 'night', label: 'Deep Night' },
  { id: 11, name: 'Khoneu',          segment: 'night', label: 'Shadow Hour' },
  { id: 12, name: 'Cyanos',          segment: 'night', label: 'Cold Watch' },
  { id: 13, name: 'Lume',            segment: 'night', label: 'Ghost Light' },
];

const GREATER_CYCLES_EU = [
  'Aman','Balanor','Ylandrium','Renascendum','Espoir',
  'Lumiere','Concordia','Ilostea','Fi\'harium','Veriquel',
  'Solaris','Unifallum','Soronii',
];
const GREATER_CYCLES_ED = [
  'Maeleth','Urkzar','Firrethium','Drakonis','Malivos',
  'Skotos','Khoneum','Infernalis','Morbulus','Chaotica',
  'Tormentum','Nuctemoron','Soronii',
];

function getCycleName(era, idx) {
  const arr = era === 'EU' ? GREATER_CYCLES_EU : GREATER_CYCLES_ED;
  return arr[(idx - 1) % arr.length] || '?';
}

function getPassInfo(pass) {
  return PASSES.find(p => p.id === pass) || PASSES[0];
}

// Advance clock state by N fragments
function advanceFragments(clock, frags) {
  let { anui, greater_cycle, turn, pass, fragment } = clock;
  fragment += frags;
  while (fragment >= 120) { fragment -= 120; pass++; }
  while (pass > 13)        { pass -= 13;     turn++; }
  while (turn > 28)        { turn -= 28;     greater_cycle++; }
  while (greater_cycle > 13){ greater_cycle -= 13; anui++; }
  return { ...clock, anui, greater_cycle, turn, pass, fragment };
}

// ─── DISPLAY (player-facing, also used inside DM panel) ──────────────────────
export function SoteriaClockDisplay({ clock, compact = false }) {
  if (!clock) return null;
  const passInfo = getPassInfo(clock.pass);
  const cycleName = getCycleName(clock.era, clock.greater_cycle);
  const isNight = passInfo.segment === 'night';
  const accent = isNight ? '#7aa8c4' : '#e6c96a';

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: "'Cinzel', serif", color: accent, fontSize: 11,
        padding: '4px 12px', background: 'rgba(8,6,4,0.7)',
        border: `1px solid ${accent}33`, borderRadius: 20,
        letterSpacing: '0.06em',
      }}>
        <span style={{ fontSize: 14 }}>{isNight ? '🌙' : '☀️'}</span>
        <span>{passInfo.name}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Turn {clock.turn}, {cycleName}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{clock.anui} {clock.era === 'EU' ? 'E.U.' : 'E.D.'}</span>
        {clock.travel_mode && (
          <span style={{ fontSize: 9, color: '#c9b991', background: 'rgba(201,185,145,0.12)', padding: '1px 6px', borderRadius: 8, border: '1px solid rgba(201,185,145,0.3)' }}>
            TRAVEL
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Cinzel', serif",
      background: 'rgba(8,6,4,0.85)',
      border: `1px solid ${accent}44`,
      borderRadius: 16, padding: '16px 20px',
      color: accent, textAlign: 'center',
      boxShadow: `0 0 32px ${accent}11`,
    }}>
      <div style={{ fontSize: 11, opacity: 0.6, letterSpacing: '0.15em', marginBottom: 4 }}>
        {clock.era === 'EU' ? 'ERA OF UNITY' : 'ERA OF DISCORDANCE'}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.08em' }}>
        {passInfo.name}
      </div>
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
        {passInfo.label}  ·  Fragment {clock.fragment}/119
      </div>
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        Turn {clock.turn} of {cycleName} (Cycle {clock.greater_cycle})
      </div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
        Anui {clock.anui} {clock.era === 'EU' ? 'E.U.' : 'E.D.'}
      </div>
      {clock.travel_mode && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#c9b991', background: 'rgba(201,185,145,0.1)', padding: '3px 10px', borderRadius: 10, border: '1px solid rgba(201,185,145,0.25)', display: 'inline-block' }}>
          ⟶ TRAVEL MODE ACTIVE
        </div>
      )}
    </div>
  );
}

// ─── DM CONTROL PANEL ────────────────────────────────────────────────────────
export default function SoteriaClockPanel({ campaignId }) {
  const [clock, setClock]     = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState({});
  const [saving, setSaving]   = useState(false);
  const tickRef = useRef(null);

  // Load or create clock for this campaign
  useEffect(() => {
    if (!campaignId) return;
    supabase
      .from('world_clock')
      .select('*')
      .eq('campaign_id', String(campaignId))
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setClock(data);
        } else {
          if (!campaignId) return;
          // Create default clock at 178 E.U., Aman, Turn 1, Ba'el
          supabase.from('world_clock').insert({
            campaign_id: String(campaignId),
            era: 'EU', anui: 178, greater_cycle: 1,
            turn: 1, pass: 1, fragment: 0,
            travel_mode: false, travel_rate: 6, paused: false,
          }).select().single().then(({ data: created }) => {
            if (created) setClock(created);
          });
        }
      });

    // Realtime subscription
    const channel = supabase
      .channel(`world_clock_${campaignId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'world_clock',
        filter: `campaign_id=eq.${campaignId}`,
      }, ({ new: updated }) => {
        if (updated) setClock(updated);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [campaignId]);

  // Auto-tick: 1 real minute = 2 fragments (1 real hour = 120 frags = 1 pass)
  // travel_mode: uses travel_rate passes per real minute instead
  useEffect(() => {
    if (!clock || clock.paused) { clearInterval(tickRef.current); return; }

    tickRef.current = setInterval(async () => {
      setClock(prev => {
        if (!prev || prev.paused) return prev;
       const fragsToAdd = prev.travel_mode ? prev.travel_rate : 1;
        const next = advanceFragments(prev, fragsToAdd);
        // Persist async
        supabase.from('world_clock')
          .update({ ...next, updated_at: new Date().toISOString() })
          .eq('id', next.id);
        return next;
      });
    }, 60_000); // every real minute

    return () => clearInterval(tickRef.current);
  }, [clock?.id, clock?.paused, clock?.travel_mode, clock?.travel_rate]);

  const save = async (patch) => {
    if (!clock) return;
    setSaving(true);
    const updated = { ...clock, ...patch, updated_at: new Date().toISOString() };
    await supabase.from('world_clock').update(updated).eq('id', clock.id);
    setClock(updated);
    setSaving(false);
  };

  const logClockEvent = async (message) => {
    if (!campaignId) return;
    await supabase.from('dm_memory').insert({
      campaign_id: String(campaignId),
      category: 'clock',
      content: `[CLOCK] ${message}`,
    });
  };

  const togglePause = () => {
    const next = !clock.paused;
    save({ paused: next });
    logClockEvent(next ? 'Time paused.' : 'Time resumed.');
  };

  const toggleTravel = () => {
    const next = !clock.travel_mode;
    save({ travel_mode: next });
    logClockEvent(next ? `Travel mode activated (${clock.travel_rate} passes/min).` : 'Travel mode deactivated.');
  };

  const longRest = () => {
    save(advanceFragments(clock, 13 * 120));
    logClockEvent('The party takes a long rest. One full turn passes.');
  };

  const shortRest = () => {
    save(advanceFragments(clock, 4 * 120));
    logClockEvent('The party takes a short rest. Four passes elapse.');
  };

  const openEdit = () => {
    setDraft({
      era: clock.era, anui: clock.anui,
      greater_cycle: clock.greater_cycle, turn: clock.turn,
      pass: clock.pass, fragment: clock.fragment,
      travel_rate: clock.travel_rate,
    });
    setEditing(true);
  };

  const applyEdit = () => {
    save({
      era: draft.era,
      anui: parseInt(draft.anui) || clock.anui,
      greater_cycle: Math.min(13, Math.max(1, parseInt(draft.greater_cycle) || 1)),
      turn: Math.min(28, Math.max(1, parseInt(draft.turn) || 1)),
      pass: Math.min(13, Math.max(1, parseInt(draft.pass) || 1)),
      fragment: Math.min(119, Math.max(0, parseInt(draft.fragment) || 0)),
      travel_rate: Math.max(1, parseInt(draft.travel_rate) || 6),
    });
    logClockEvent('The Architect manually set the world time.');
    setEditing(false);
  };

  if (!clock) return (
    <div style={{ color: 'rgba(201,185,145,0.4)', fontFamily: "'Cinzel', serif", fontSize: 12, padding: 16 }}>
      Loading world clock…
    </div>
  );

  const passInfo  = getPassInfo(clock.pass);
  const isNight   = passInfo.segment === 'night';
  const accent    = isNight ? '#7aa8c4' : '#e6c96a';

  const label = (txt) => (
    <div style={{ fontSize: 9, color: 'rgba(201,185,145,0.5)', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', marginBottom: 3 }}>
      {txt}
    </div>
  );

  const dmBtn = (txt, onClick, color = 'rgba(201,185,145,0.15)', active = false) => (
    <button onClick={onClick} style={{
      background: active ? 'rgba(201,185,145,0.25)' : color,
      border: `1px solid ${active ? 'rgba(201,185,145,0.6)' : 'rgba(201,185,145,0.2)'}`,
      color: active ? '#e6d2a0' : 'rgba(201,185,145,0.75)',
      fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.08em',
      padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
      transition: 'all 0.15s',
    }}>
      {txt}
    </button>
  );

  const numInput = (key, min, max) => (
    <input
      type="number" min={min} max={max}
      value={draft[key] ?? ''}
      onChange={e => setDraft(d => ({ ...d, [key]: e.target.value }))}
      style={{
        width: 54, background: 'rgba(14,10,7,0.8)',
        border: '1px solid rgba(201,185,145,0.25)', borderRadius: 6,
        color: '#e6d2a0', fontFamily: "'Cinzel', serif", fontSize: 11,
        padding: '4px 6px', textAlign: 'center',
      }}
    />
  );

  return (
    <div style={{
      background: 'rgba(8,6,4,0.92)',
      border: `1px solid ${accent}33`,
      borderRadius: 16, padding: 20,
      fontFamily: "'Cinzel', serif",
      minWidth: 280,
    }}>
      {/* Header */}
      <div style={{ fontSize: 10, color: 'rgba(201,185,145,0.5)', letterSpacing: '0.18em', marginBottom: 12 }}>
        SOTERIA · WORLD CLOCK
      </div>

      {/* Current time display */}
      <SoteriaClockDisplay clock={clock} />

      {/* DM Controls */}
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {dmBtn(clock.paused ? '▶ Resume' : '⏸ Pause', togglePause, 'rgba(201,185,145,0.1)', clock.paused)}
        {dmBtn(clock.travel_mode ? '⟶ Travel ON' : '⟶ Travel', toggleTravel, 'rgba(120,160,100,0.1)', clock.travel_mode)}
        {dmBtn('Short Rest (+4 passes)', shortRest)}
        {dmBtn('Long Rest (+1 turn)', longRest)}
        {dmBtn('✎ Set Time', openEdit)}
      </div>

      {/* Travel rate info */}
      {clock.travel_mode && (
        <div style={{ marginTop: 8, fontSize: 9, color: 'rgba(201,185,145,0.5)', letterSpacing: '0.08em' }}>
          Travel rate: {clock.travel_rate} passes/min (real) — edit to adjust
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
        }}>
          <div style={{
            background: 'rgba(14,10,7,0.97)', border: '1px solid rgba(201,185,145,0.3)',
            borderRadius: 16, padding: 28, minWidth: 300,
            fontFamily: "'Cinzel', serif",
          }}>
            <div style={{ fontSize: 13, color: '#e6d2a0', letterSpacing: '0.12em', marginBottom: 18 }}>
              SET WORLD TIME
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                {label('ERA')}
                <select value={draft.era} onChange={e => setDraft(d => ({ ...d, era: e.target.value }))}
                  style={{ background: 'rgba(14,10,7,0.8)', border: '1px solid rgba(201,185,145,0.25)', borderRadius: 6, color: '#e6d2a0', fontFamily: "'Cinzel', serif", fontSize: 11, padding: '4px 8px', width: '100%' }}>
                  <option value="EU">Era of Unity (E.U.)</option>
                  <option value="ED">Era of Discordance (E.D.)</option>
                </select>
              </div>
              <div>
                {label('ANUI (YEAR)')}
                {numInput('anui', 1, 9999)}
              </div>
              <div>
                {label('GREATER CYCLE (1–13)')}
                <select value={draft.greater_cycle} onChange={e => setDraft(d => ({ ...d, greater_cycle: parseInt(e.target.value) }))}
                  style={{ background: 'rgba(14,10,7,0.8)', border: '1px solid rgba(201,185,145,0.25)', borderRadius: 6, color: '#e6d2a0', fontFamily: "'Cinzel', serif", fontSize: 11, padding: '4px 8px', width: '100%' }}>
                  {(draft.era === 'EU' ? GREATER_CYCLES_EU : GREATER_CYCLES_ED).map((name, i) => (
                    <option key={i} value={i + 1}>{i + 1}. {name}</option>
                  ))}
                </select>
              </div>
              <div>
                {label('TURN (1–28)')}
                {numInput('turn', 1, 28)}
              </div>
              <div>
                {label('PASS (1–13)')}
                <select value={draft.pass} onChange={e => setDraft(d => ({ ...d, pass: parseInt(e.target.value) }))}
                  style={{ background: 'rgba(14,10,7,0.8)', border: '1px solid rgba(201,185,145,0.25)', borderRadius: 6, color: '#e6d2a0', fontFamily: "'Cinzel', serif", fontSize: 11, padding: '4px 8px', width: '100%' }}>
                  {PASSES.map(p => (
                    <option key={p.id} value={p.id}>{p.id}. {p.name} ({p.label})</option>
                  ))}
                </select>
              </div>
              <div>
                {label('FRAGMENT (0–119)')}
                {numInput('fragment', 0, 119)}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                {label('TRAVEL RATE (passes per real minute)')}
                {numInput('travel_rate', 1, 100)}
                <div style={{ fontSize: 8, color: 'rgba(201,185,145,0.4)', marginTop: 3 }}>
                  Default 6 ≈ 1 turn per ~2 real minutes
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
              {dmBtn('Cancel', () => setEditing(false))}
              {dmBtn(saving ? 'Saving…' : 'Apply', applyEdit, 'rgba(100,160,120,0.2)')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
