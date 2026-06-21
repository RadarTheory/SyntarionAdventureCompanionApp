import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import {
  PASSES, getCycleName, getPassInfo, advanceFragments, getLiveClock, getClockTime,
  TRAVEL_METHODS, FRAGMENTS_PER_TURN, GREATER_CYCLES_EU, GREATER_CYCLES_ED,
} from './lib/soteriaClock';

// ─── ORBITAL CELESTIAL DISPLAY ─────────────────────────────────────────────────
// The Major Sun sits fixed at center by day; orbiting bodies (Green/White Suns,
// or by night the Yellow/Blue Moons) actually circle around it via CSS animation,
// appearing/disappearing exactly as the Sovereign Calendar describes per pass.
export function CelestialOrbit({ clock, size = 36 }) {
  if (!clock) return null;
  const live = getLiveClock(clock);
  const passInfo = getPassInfo(live.pass);
  const bodies = passInfo.bodies || [];

  const centerBody = bodies.find(b => b.name === 'Major Sun');
  const orbiters = bodies.filter(b => b.name !== 'Major Sun');
  const center = size / 2;
  const dotSize = Math.max(5, Math.round(size * 0.2));
  const orbitRadius = size / 2 - dotSize;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <style>{`
        @keyframes orbitSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      {/* Central body */}
      {centerBody ? (
        <div style={{
          position: 'absolute', top: center, left: center,
          width: dotSize + 2, height: dotSize + 2, borderRadius: '50%',
          background: centerBody.color, boxShadow: `0 0 ${dotSize}px ${centerBody.color}`,
          transform: 'translate(-50%, -50%)',
        }} />
      ) : (
        <div style={{
          position: 'absolute', top: center, left: center,
          width: dotSize, height: dotSize, borderRadius: '50%',
          border: '1px solid rgba(120,120,140,0.4)',
          transform: 'translate(-50%, -50%)',
        }} />
      )}
      {/* Orbiting bodies — each on its own ring, own speed, own starting angle */}
      {orbiters.map((b, i) => (
        <div key={b.name} style={{
          position: 'absolute', top: center, left: center, width: 0, height: 0,
          animation: `orbitSpin ${5 + i * 2.5}s linear infinite`,
          animationDelay: `${-(i * 1.7)}s`,
        }}>
          <div style={{
            position: 'absolute', top: -dotSize / 2, left: orbitRadius - i * (dotSize * 1.2),
            width: dotSize, height: dotSize, borderRadius: '50%',
            background: b.color, boxShadow: `0 0 ${dotSize}px ${b.color}`,
          }} />
        </div>
      ))}
    </div>
  );
}
// A rounded track showing the 13 passes in order. The bodies actually visible at
// the current pass (per the Sovereign Calendar) render as small glowing dots that
// slide smoothly across as fragments tick by — Major/Green/White Suns by day,
// Yellow/Blue Moons by night.
export function SunMoonCycleBar({ clock, width = 280, showBodyLabels = true }) {
  if (!clock) return null;
  const live = getLiveClock(clock);
  const progress = ((live.pass - 1) + live.fragment / 120) / 13;
  const trackHeight = showBodyLabels ? 30 : 16;
  const passInfo = getPassInfo(live.pass);
  const bodies = passInfo.bodies || [];

  return (
    <div>
      <div style={{ position: 'relative', width, height: trackHeight }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: trackHeight / 2,
          background: 'linear-gradient(to right, #1a2a40 0%, #2a3a55 15%, #7aa8c4 30%, #e6c96a 45%, #f0d878 55%, #e6c96a 65%, #7aa8c4 80%, #2a3a55 92%, #1a2a40 100%)',
          opacity: 0.3,
        }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: trackHeight / 2, border: '1px solid rgba(201,185,145,0.3)' }} />
        {PASSES.map((p, i) => (
          <div key={p.id} style={{ position: 'absolute', left: `${(i / 13) * 100}%`, top: 4, bottom: 4, width: 1, background: 'rgba(255,255,255,0.15)' }} />
        ))}
        {/* Marker position on the track */}
        <div style={{
          position: 'absolute', top: '50%', left: `${progress * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: showBodyLabels ? 8 : 6, height: showBodyLabels ? 8 : 6, borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 0 6px rgba(255,255,255,0.7)',
          transition: 'left 4s linear',
        }} />
      </div>
      {/* The bodies actually in the sky right now */}
      {showBodyLabels && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, justifyContent: 'center', minHeight: 14 }}>
        {bodies.length === 0 ? (
          <span style={{ fontSize: 8, color: 'rgba(201,185,145,0.4)', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>NO BODIES IN THE SKY</span>
        ) : bodies.map(b => (
          <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
            <span style={{ fontSize: 8, color: 'rgba(201,185,145,0.6)', fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>{b.name}</span>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}

// ─── DISPLAY (player-facing, also used inside DM panel) ──────────────────────
export function SoteriaClockDisplay({ clock, compact = false }) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!clock?.session_anchor_at) return;
    const id = setInterval(() => forceTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, [clock?.session_anchor_at]);

  if (!clock) return null;
  const live = getLiveClock(clock);
  const passInfo = getPassInfo(live.pass);
  const cycleName = getCycleName(live.era, live.greater_cycle);
  const isNight = passInfo.segment === 'night';
  const accent = isNight ? '#7aa8c4' : '#e6c96a';

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        fontFamily: "'Cinzel', serif", color: accent, fontSize: 11,
        padding: '4px 14px 4px 8px', background: 'rgba(8,6,4,0.7)',
        border: `1px solid ${accent}33`, borderRadius: 20,
        letterSpacing: '0.06em',
      }}>
        <CelestialOrbit clock={clock} size={28} />
        <span>{passInfo.name}</span>
        <span style={{ fontFamily: 'monospace', opacity: 0.85 }}>{getClockTime(live.pass, live.fragment)}</span>
        <SunMoonCycleBar clock={clock} width={110} showBodyLabels={false} />
        <span style={{ opacity: 0.5 }}>·</span>
        <span>Turn {live.turn}, {cycleName}</span>
        <span style={{ opacity: 0.5 }}>·</span>
        <span>{live.anui} {live.era === 'EU' ? 'E.U.' : 'E.D.'}</span>
        {clock.session_anchor_at && (
          <span style={{ fontSize: 9, color: '#9fe0aa', background: 'rgba(121,245,167,0.1)', padding: '1px 6px', borderRadius: 8, border: '1px solid rgba(121,245,167,0.3)' }}>
            LIVE
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
        {live.era === 'EU' ? 'ERA OF UNITY' : 'ERA OF DISCORDANCE'}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.08em' }}>
        {passInfo.name} <span style={{ fontFamily: 'monospace', fontSize: 16, opacity: 0.8 }}>{getClockTime(live.pass, live.fragment)}</span>
      </div>
      <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
        {passInfo.label}  ·  Fragment {Math.floor(live.fragment)}/119
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
        <SunMoonCycleBar clock={clock} />
      </div>
      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
        Turn {live.turn} of {cycleName} (Cycle {live.greater_cycle}) — 26hr day
      </div>
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
        Anui {live.anui} {live.era === 'EU' ? 'E.U.' : 'E.D.'}
      </div>
      {clock.session_anchor_at && (
        <div style={{ marginTop: 8, fontSize: 10, color: '#9fe0aa', background: 'rgba(121,245,167,0.08)', padding: '3px 10px', borderRadius: 10, border: '1px solid rgba(121,245,167,0.25)', display: 'inline-block' }}>
          LIVE — advancing with the session
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
  const [showTravel, setShowTravel] = useState(false);
  const [travelMiles, setTravelMiles] = useState('');
  const [travelMethod, setTravelMethod] = useState(TRAVEL_METHODS[0].key);
  const [, forceTick] = useState(0);

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
          supabase.from('world_clock').insert({
            campaign_id: String(campaignId),
            era: 'EU', anui: 178, greater_cycle: 1,
            turn: 1, pass: 1, fragment: 0,
            paused: false, session_anchor_at: null,
          }).select().single().then(({ data: created }) => {
            if (created) setClock(created);
          });
        }
      });

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

  useEffect(() => {
    if (!campaignId || !clock) return;

    const checkSession = async () => {
      const { data: activeSession } = await supabase.from('sessions').select('id, started_at, created_at')
        .eq('campaign_id', String(campaignId)).eq('status', 'active')
        .order('created_at', { ascending: true }).limit(1).maybeSingle();

      if (activeSession && !clock.session_anchor_at) {
        const anchor = activeSession.started_at || activeSession.created_at || new Date().toISOString();
        const updated = { ...clock, session_anchor_at: anchor };
        await supabase.from('world_clock').update({ session_anchor_at: anchor }).eq('id', clock.id);
        setClock(updated);
        logClockEvent('A session begins. World time resumes flowing.');
      } else if (!activeSession && clock.session_anchor_at) {
        const live = getLiveClock(clock);
        const frozen = { ...live, session_anchor_at: null, updated_at: new Date().toISOString() };
        const { id, campaign_id, created_at, ...safeFrozen } = frozen;
        await supabase.from('world_clock').update(safeFrozen).eq('id', clock.id);
        setClock(frozen);
        logClockEvent('The session ends. World time holds still until the table returns.');
      }
    };

    checkSession();
    const sub = supabase.channel(`session-watch-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `campaign_id=eq.${campaignId}` }, checkSession)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId, clock?.id, clock?.session_anchor_at]);

  useEffect(() => {
    if (!clock?.session_anchor_at) return;
    const id = setInterval(() => forceTick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, [clock?.session_anchor_at]);

const save = async (patch) => {
    if (!clock) return;
    setSaving(true);
    const updated = { ...clock, ...patch, updated_at: new Date().toISOString() };
    const { id, campaign_id, created_at, ...safePayload } = updated;
    const { data, error } = await supabase
      .from('world_clock')
      .update(safePayload)
      .eq('id', clock.id)
      .select()
      .single();
    if (error) {
      console.error('[WorldClock] save failed:', error);
      setSaving(false);
      return;
    }
    setClock(data);
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

  // Pause always wins — available regardless of session state, never gated
  const togglePause = () => {
    const next = !clock.paused;
    save({ paused: next });
    logClockEvent(next ? 'Time paused.' : 'Time resumed.');
  };

  const longRest = () => {
    const base = getLiveClock(clock);
    save({ ...advanceFragments(base, FRAGMENTS_PER_TURN), session_anchor_at: clock.session_anchor_at ? new Date().toISOString() : null });
    logClockEvent('The party takes a long rest. One full Soterian day passes.');
  };

  const shortRest = () => {
    const base = getLiveClock(clock);
    save({ ...advanceFragments(base, 4 * 120), session_anchor_at: clock.session_anchor_at ? new Date().toISOString() : null });
    logClockEvent('The party takes a short rest. Four passes elapse.');
  };

  const logTravel = () => {
    const miles = parseFloat(travelMiles);
    if (!miles || miles <= 0) return;
    const method = TRAVEL_METHODS.find(m => m.key === travelMethod) || TRAVEL_METHODS[0];
    const frags = (miles / method.milesPerDay) * FRAGMENTS_PER_TURN;
    const base = getLiveClock(clock);
    save({ ...advanceFragments(base, frags), session_anchor_at: clock.session_anchor_at ? new Date().toISOString() : null });
    logClockEvent(`The party travels ${miles} miles by ${method.label.toLowerCase()}. Time advances accordingly.`);
    setTravelMiles('');
    setShowTravel(false);
  };

  const openEdit = () => {
    const live = getLiveClock(clock);
    setDraft({
      era: live.era, anui: live.anui,
      greater_cycle: live.greater_cycle, turn: live.turn,
      pass: live.pass, fragment: live.fragment,
    });
    setEditing(true);
  };

  const applyEdit = async () => {
    await save({
      era: draft.era,
      anui: parseInt(draft.anui) || clock.anui,
      greater_cycle: Math.min(13, Math.max(1, parseInt(draft.greater_cycle) || 1)),
      turn: Math.min(28, Math.max(1, parseInt(draft.turn) || 1)),
      pass: Math.min(13, Math.max(1, parseInt(draft.pass) || 1)),
      fragment: Math.min(119, Math.max(0, parseInt(draft.fragment) || 0)),
      session_anchor_at: clock.session_anchor_at ? new Date().toISOString() : null,
    });
    logClockEvent('The Architect manually set the world time.');
    setEditing(false);
  };

  if (!clock) return (
    <div style={{ color: 'rgba(201,185,145,0.4)', fontFamily: "'Cinzel', serif", fontSize: 12, padding: 16 }}>
      Loading world clock…
    </div>
  );

  const liveClock = getLiveClock(clock);
  const passInfo  = getPassInfo(liveClock.pass);
  const isNight   = passInfo.segment === 'night';
  const accent    = isNight ? '#7aa8c4' : '#e6c96a';

  const label = (txt) => (
    <div style={{ fontSize: 9, color: 'rgba(201,185,145,0.5)', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', marginBottom: 3 }}>
      {txt}
    </div>
  );

  const dmBtn = (txt, onClick, color = 'rgba(201,185,145,0.15)', active = false, disabled = false) => (
    <button onClick={onClick} disabled={disabled} style={{
      background: active ? 'rgba(201,185,145,0.25)' : color,
      border: `1px solid ${active ? 'rgba(201,185,145,0.6)' : 'rgba(201,185,145,0.2)'}`,
      color: active ? '#e6d2a0' : 'rgba(201,185,145,0.75)',
      fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.08em',
      padding: '5px 10px', borderRadius: 8, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.5 : 1,
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
      <div style={{ fontSize: 10, color: 'rgba(201,185,145,0.5)', letterSpacing: '0.18em', marginBottom: 12 }}>
        SOTERIA · WORLD CLOCK (26HR DAY)
      </div>

      <SoteriaClockDisplay clock={clock} />

      <div style={{ marginTop: 8, fontSize: 9, color: clock.session_anchor_at ? '#9fe0aa' : 'rgba(201,185,145,0.4)', letterSpacing: '0.08em' }}>
        {clock.session_anchor_at ? 'Advancing live with the active session.' : 'No active session — time is holding still.'}
      </div>

      {/* Pause is always available, regardless of session state */}
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {dmBtn(clock.paused ? 'Resume' : 'Pause', togglePause, 'rgba(201,185,145,0.1)', clock.paused)}
        {dmBtn('Log Travel', () => setShowTravel(true))}
        {dmBtn('Short Rest (+4 passes)', shortRest)}
        {dmBtn('Long Rest (+1 day)', longRest)}
        {dmBtn('Set Time', openEdit)}
      </div>

      {showTravel && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
        }}>
          <div style={{
            background: 'rgba(14,10,7,0.97)', border: '1px solid rgba(201,185,145,0.3)',
            borderRadius: 16, padding: 28, minWidth: 300,
            fontFamily: "'Cinzel', serif",
          }}>
            <div style={{ fontSize: 13, color: '#e6d2a0', letterSpacing: '0.12em', marginBottom: 14 }}>
              LOG TRAVEL
            </div>
            {label('METHOD')}
            <select value={travelMethod} onChange={e => setTravelMethod(e.target.value)}
              style={{ width: '100%', background: 'rgba(14,10,7,0.8)', border: '1px solid rgba(201,185,145,0.25)', borderRadius: 6, color: '#e6d2a0', fontFamily: "'Cinzel', serif", fontSize: 11, padding: '6px 8px', marginBottom: 12 }}>
              {TRAVEL_METHODS.map(m => (
                <option key={m.key} value={m.key}>{m.label} (~{m.milesPerDay} mi/day)</option>
              ))}
            </select>
            {label('DISTANCE TRAVELED (MILES)')}
            <input
              type="number" min={0} value={travelMiles}
              onChange={e => setTravelMiles(e.target.value)}
              placeholder="e.g. 200"
              style={{
                width: '100%', background: 'rgba(14,10,7,0.8)',
                border: '1px solid rgba(201,185,145,0.25)', borderRadius: 6,
                color: '#e6d2a0', fontFamily: "'Cinzel', serif", fontSize: 12,
                padding: '7px 10px', boxSizing: 'border-box', marginBottom: 6,
              }}
            />
            <div style={{ fontSize: 8, color: 'rgba(201,185,145,0.4)', marginBottom: 16 }}>
              {travelMiles && parseFloat(travelMiles) > 0 && (
                <>This advances about {(parseFloat(travelMiles) / (TRAVEL_METHODS.find(m => m.key === travelMethod)?.milesPerDay || 1)).toFixed(2)} Soterian days.</>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {dmBtn('Cancel', () => { setShowTravel(false); setTravelMiles(''); })}
              {dmBtn(saving ? 'Logging…' : 'Apply', logTravel, 'rgba(100,160,120,0.2)', false, !travelMiles || parseFloat(travelMiles) <= 0)}
            </div>
          </div>
        </div>
      )}

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
