import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// ─── TIMER HOOK ───────────────────────────────────────────────────────────────
function useSessionTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── END SESSION MODAL ────────────────────────────────────────────────────────
function EndSessionModal({ session, checkins, onConfirm, onCancel }) {
  const [logText, setLogText] = useState('');
  const [saving, setSaving] = useState(false);
  const campaign = CAMPAIGNS.find(c => c.id === session.campaign_id);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(logText.trim());
    setSaving(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.85)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, padding: '28px 32px', maxWidth: 520, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 6, letterSpacing: '0.06em' }}>End Session</div>
        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 20 }}>
          {campaign?.subtitle || session.campaign_id} · {checkins.length} player{checkins.length !== 1 ? 's' : ''} present
        </div>

        <div style={{ ...label8(), marginBottom: 8 }}>Session Log Entry</div>
        <textarea
          value={logText}
          onChange={e => setLogText(e.target.value)}
          placeholder="Summarize what happened this session… (optional)"
          rows={5}
          style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 20 }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 0', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.dim }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={saving} style={{ flex: 2, background: COLORS.warnBg, border: `1px solid ${COLORS.warn}`, borderRadius: 8, padding: '10px 0', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.warn, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Closing…' : '✕ End Session & Commit Log'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PLAY MODAL (Lobby) ──────────────────────────────────────────────────────
function PlayModal({ onClose, onSessionStarted, existingSession }) {
  const [step, setStep] = useState(existingSession ? 'lobby' : 'select');
  const [selectedCampaign, setSelectedCampaign] = useState(existingSession?.campaign_id || null);
  const [session, setSession] = useState(existingSession || null);
  const [checkins, setCheckins] = useState([]);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetchCheckins();
    const channel = supabase.channel(`lobby-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_checkins', filter: `session_id=eq.${session.id}` }, fetchCheckins)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  const fetchCheckins = async () => {
    if (!session) return;
    const { data } = await supabase.from('session_checkins').select('*').eq('session_id', session.id).order('checked_in_at', { ascending: true });
    if (data) setCheckins(data);
  };

  const handleCreateLobby = async () => {
    if (!selectedCampaign) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase.from('sessions').insert({
      campaign_id: selectedCampaign,
      status: 'lobby',
      created_by: user?.id,
    }).select().single();
    if (!error && data) {
      setSession(data);
      setStep('lobby');
    }
  };

  const handleStart = async () => {
    if (!session) return;
    setStarting(true);
    const { data, error } = await supabase.from('sessions').update({
      status: 'active',
      started_at: new Date().toISOString(),
    }).eq('id', session.id).select().single();
    if (!error && data) {
      onSessionStarted(data, checkins);
      onClose();
    }
    setStarting(false);
  };

  const handleCancel = async () => {
    if (session) {
      await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    }
    onClose();
  };

  const campaign = CAMPAIGNS.find(c => c.id === selectedCampaign);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.85)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, padding: '28px 32px', maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        {step === 'select' && (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 6, letterSpacing: '0.06em' }}>Start a Session</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 24 }}>Select a campaign to open the lobby.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {CAMPAIGNS.map(c => (
                <div key={c.id} onClick={() => setSelectedCampaign(c.id)}
                  style={{ background: selectedCampaign === c.id ? COLORS.magicBg : COLORS.card, border: `1px solid ${selectedCampaign === c.id ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: selectedCampaign === c.id ? COLORS.magicText : COLORS.text }}>{c.subtitle}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 0', cursor: 'pointer', color: COLORS.dim }}>Cancel</button>
              <button onClick={handleCreateLobby} disabled={!selectedCampaign} style={{ flex: 2, background: selectedCampaign ? COLORS.magicBg : 'transparent', border: `1px solid ${selectedCampaign ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px 0', color: selectedCampaign ? COLORS.magicText : COLORS.dim }}>Open Lobby →</button>
            </div>
          </>
        )}
        {step === 'lobby' && (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Lobby Open</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginBottom: 20 }}>{campaign?.subtitle} · Waiting for players...</div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 20, minHeight: 80 }}>
              {checkins.length === 0 ? <div style={{ fontSize: 11, color: COLORS.dim }}>No players yet.</div> : 
                checkins.map(c => <div key={c.id} style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, padding: '4px 0' }}>✦ {c.character_name}</div>)
              }
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCancel} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 8, padding: '10px 0', color: COLORS.warn }}>Cancel Lobby</button>
              <button onClick={handleStart} disabled={checkins.length === 0} style={{ flex: 2, background: checkins.length > 0 ? COLORS.magicBg : 'transparent', border: `1px solid ${checkins.length > 0 ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px 0', color: checkins.length > 0 ? COLORS.magicText : COLORS.dim }}>Start Campaign</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function SessionManager({ onTimerLabel }) {
  const [showPlay, setShowPlay] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);

  const timer = useSessionTimer(activeSession?.started_at);

  useEffect(() => {
    onTimerLabel(activeSession?.status === 'active' ? timer : null);
  }, [timer, activeSession]);

  useEffect(() => {
    checkForActiveSession();
  }, []);

  const checkForActiveSession = async () => {
    const { data } = await supabase.from('sessions').select('*').in('status', ['active', 'lobby']).order('created_at', { ascending: false }).limit(1);
    if (data && data.length > 0) {
      setActiveSession(data[0]);
      fetchCheckins(data[0].id);
    }
  };

  const fetchCheckins = async (sessionId) => {
    const { data } = await supabase.from('session_checkins').select('*').eq('session_id', sessionId);
    if (data) setCheckins(data);
  };

  const handleSessionStarted = (session, initialCheckins) => {
    setActiveSession(session);
    setCheckins(initialCheckins);
  };

  const handleEndSession = async (logText) => {
    if (!activeSession) return;
    if (logText) {
      const { data: camp } = await supabase.from('campaigns').select('session_log').eq('id', activeSession.campaign_id).single();
      const existing = camp?.session_log || [];
      const entry = { id: Date.now(), title: `Session ${existing.length + 1}`, content: logText, timestamp: new Date().toISOString(), players: checkins.map(c => c.character_name) };
      await supabase.from('campaigns').update({ session_log: [...existing, entry] }).eq('id', activeSession.campaign_id);
    }
    await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', activeSession.id);
    setActiveSession(null);
    setCheckins([]);
    setShowEndModal(false);
  };

  const isLobby = activeSession?.status === 'lobby';
  const isActive = activeSession?.status === 'active';

  return (
    <>
      {showPlay && (
        <PlayModal
          existingSession={isLobby ? activeSession : null}
          onClose={() => setShowPlay(false)}
          onSessionStarted={handleSessionStarted}
        />
      )}
      {showEndModal && activeSession && (
        <EndSessionModal
          session={activeSession}
          checkins={checkins}
          onConfirm={handleEndSession}
          onCancel={() => setShowEndModal(false)}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!activeSession && (
          <button onClick={() => setShowPlay(true)} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.magicText }}>▶ Play</button>
        )}
        {isLobby && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 8, color: COLORS.deity, fontFamily: "'Cinzel', serif" }}>Lobby · {checkins.length} In</div>
            <button onClick={() => setShowPlay(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '5px 10px', fontSize: 7, color: COLORS.deity }}>View Lobby</button>
            <button onClick={() => setShowEndModal(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 6, padding: '5px 10px', fontSize: 7, color: COLORS.warn }}>Cancel</button>
          </div>
        )}
        {isActive && (
          <button onClick={() => setShowEndModal(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 6, padding: '6px 14px', fontSize: 8, color: COLORS.warn }}>■ End Session</button>
        )}
      </div>
    </>
  );
}