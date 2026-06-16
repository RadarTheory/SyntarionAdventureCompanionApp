import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import { getSessionEvents } from './lib/sessionEvents';

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

// ─── SCRIBE DRAFT MODAL ───────────────────────────────────────────────────────
function ScribeDraftModal({ session, checkins, onClose }) {
  const [phase, setPhase] = useState('drafting'); // 'drafting' | 'review'
  const [dmRecord, setDmRecord] = useState('');
  const [chronicles, setChronicles] = useState({}); // { char_id: { name, text, publish } }
  const [activeTab, setActiveTab] = useState('dm');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const campaign = CAMPAIGNS.find(c => c.id === session.campaign_id);

  useEffect(() => { draft(); }, []);

  const draft = async () => {
    try {
      const events = await getSessionEvents(session.id);
      const characterList = checkins.map(c => `${c.character_name} (id: ${c.character_id})`).join(', ');
      const eventSummary = events.length > 0
        ? events.map(e => `[${e.event_type}] ${JSON.stringify(e.payload)}`).join('\n')
        : 'No recorded events. Session may have been freeform roleplay.';

      const prompt = `You are The Scribe, chronicler of the world of Soteria.

A session has just ended for campaign: ${campaign?.subtitle || session.campaign_id}
Duration: from ${session.started_at ? new Date(session.started_at).toLocaleString() : 'unknown'} to now.
Players present: ${characterList || 'Unknown'}

Session events log:
${eventSummary}

Produce a JSON object with exactly this structure (no markdown, no backticks, raw JSON only):
{
  "dm_record": "A thorough structured debrief for the DM. Include: NPCs encountered, combat outcomes, loot distributed, decisions made, plot threads opened or closed, any notable player choices. Use mechanical language freely. Be specific and detailed.",
  "player_chronicles": {
    ${checkins.map(c => `"${c.character_id}": "A 2-4 paragraph narrative chronicle written in third person for ${c.character_name} specifically. Write only what ${c.character_name} could have witnessed or experienced. Use vivid in-world prose. No mechanical language. No dice rolls mentioned. Refer to the character by name throughout."`).join(',\n    ')}
  }
}`;

      const { data, error: fnError } = await supabase.functions.invoke('scribe', {
        body: {
          system: 'You are The Scribe, an ancient archival intelligence. You respond only with raw valid JSON. No markdown. No backticks. No preamble.',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2000,
        },
      });

      if (fnError) throw new Error(fnError.message);
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response from Scribe.');

      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      setDmRecord(parsed.dm_record || '');
      const built = {};
      checkins.forEach(c => {
        built[c.character_id] = {
          name: c.character_name,
          text: parsed.player_chronicles?.[c.character_id] || `${c.character_name} was present for the session.`,
          publish: true,
        };
      });
      setChronicles(built);
      setPhase('review');
    } catch (err) {
      setError(err.message);
      setPhase('review');
    }
  };

  const handleApprove = async () => {
    setSaving(true);
    const sessionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Write DM record to dm_memory
    await supabase.from('dm_memory').insert({
      campaign_id: session.campaign_id,
      category: 'session',
      content: dmRecord,
    });

    // Write player chronicles to grimoire_entries
    await Promise.all(
      Object.entries(chronicles).map(([charId, { text, publish }]) =>
        supabase.from('grimoire_entries').insert({
          character_id: String(charId),
          campaign_id: String(session.campaign_id),
          type: 'event',
          title: `Session · ${sessionDate}`,
          body: text,
          dm_note: publish ? null : '(Not yet published to player)',
        })
      )
    );

    // Write to session_logs for archive
    await supabase.from('session_logs').insert({
      campaign_id: String(session.campaign_id),
      session_id: String(session.id),
      title: `Session · ${sessionDate}`,
      summary: dmRecord,
      raw_events: Object.fromEntries(
        Object.entries(chronicles).map(([id, c]) => [id, c.text])
      ),
      visible_to_players: Object.values(chronicles).some(c => c.publish),
      approved: true,
    });

    // Close the session
    await supabase.from('sessions').update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    }).eq('id', session.id);

    setSaving(false);
    onClose();
  };

  const handleSkip = async () => {
    await supabase.from('sessions').update({
      status: 'ended',
      ended_at: new Date().toISOString(),
    }).eq('id', session.id);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.92)', backdropFilter: 'blur(8px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#13100d', border: `1px solid ${COLORS.deity}44`, borderRadius: 14, padding: '28px 32px', maxWidth: 600, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>

        {/* Header */}
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.08em', marginBottom: 4 }}>The Scribe</div>
          <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {campaign?.subtitle} · {checkins.length} player{checkins.length !== 1 ? 's' : ''} · End of Session
          </div>
        </div>

        {/* Drafting phase */}
        {phase === 'drafting' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 0' }}>
            <div style={{ fontSize: 28, opacity: 0.4 }}>✦</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.deity, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              The Scribe deliberates…
            </div>
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', maxWidth: 320 }}>
              Consulting the session records and composing chronicles for each adventurer.
            </div>
          </div>
        )}

        {/* Review phase */}
        {phase === 'review' && (
          <>
            {error && (
              <div style={{ background: COLORS.warnBg, border: `1px solid ${COLORS.warn}44`, borderRadius: 6, padding: '8px 12px', fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', marginBottom: 16, flexShrink: 0 }}>
                Scribe encountered an error: {error}. You can still edit and approve manually.
              </div>
            )}

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab('dm')} style={{ background: activeTab === 'dm' ? COLORS.deityBg : 'transparent', border: `1px solid ${activeTab === 'dm' ? COLORS.deity : COLORS.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', color: activeTab === 'dm' ? COLORS.deityText : COLORS.dim }}>
                DM Record
              </button>
              {Object.entries(chronicles).map(([charId, { name }]) => (
                <button key={charId} onClick={() => setActiveTab(charId)} style={{ background: activeTab === charId ? 'rgba(121,245,167,0.1)' : 'transparent', border: `1px solid ${activeTab === charId ? COLORS.magic : COLORS.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', color: activeTab === charId ? COLORS.magic : COLORS.dim }}>
                  {name}
                </button>
              ))}
            </div>

            {/* DM Record tab */}
            {activeTab === 'dm' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ ...label8(), marginBottom: 8 }}>DM Record — Full Session Debrief</div>
                <textarea
                  value={dmRecord}
                  onChange={e => setDmRecord(e.target.value)}
                  style={{ flex: 1, width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', minHeight: 260 }}
                />
              </div>
            )}

            {/* Character chronicle tabs */}
            {Object.entries(chronicles).map(([charId, { name, text, publish }]) =>
              activeTab === charId ? (
                <div key={charId} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexShrink: 0 }}>
                    <div style={{ ...label8() }}>{name} · Player Chronicle</div>
                    <button
                      onClick={() => setChronicles(prev => ({ ...prev, [charId]: { ...prev[charId], publish: !prev[charId].publish } }))}
                      style={{ background: publish ? 'rgba(121,245,167,0.1)' : 'rgba(240,238,235,0.04)', border: `1px solid ${publish ? COLORS.magic : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: publish ? COLORS.magic : COLORS.dim, letterSpacing: '0.08em' }}>
                      {publish ? '✦ Publish' : '○ Hold'}
                    </button>
                  </div>
                  <textarea
                    value={text}
                    onChange={e => setChronicles(prev => ({ ...prev, [charId]: { ...prev[charId], text: e.target.value } }))}
                    style={{ flex: 1, width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', minHeight: 260 }}
                  />
                </div>
              ) : null
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexShrink: 0 }}>
              <button onClick={handleSkip} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim, letterSpacing: '0.1em' }}>
                Skip & End
              </button>
              <button onClick={handleApprove} disabled={saving} style={{ flex: 1, background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 8, padding: '10px 0', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.deityText, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Committing to the Archives…' : '✦ Approve & End Session'}
              </button>
            </div>
          </>
        )}
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
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'session_checkins' },
      () => fetchCheckins()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  const fetchCheckins = async () => {
    if (!session) return;
    const { data, error } = await supabase.from('session_checkins').select('*').eq('session_id', session.id);
    console.log('checkins fetch:', data, error);
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
    if (!error && data) { setSession(data); setStep('lobby'); }
  };

  const handleStart = async () => {
    if (!session) return;
    setStarting(true);
    const { data, error } = await supabase.from('sessions').update({
      status: 'active',
      started_at: new Date().toISOString(),
    }).eq('id', session.id).select().single();
    if (!error && data) { onSessionStarted(data, checkins); onClose(); }
    setStarting(false);
  };

  const handleCancel = async () => {
    if (session) await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
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
              <button onClick={handleCreateLobby} disabled={!selectedCampaign} style={{ flex: 2, background: selectedCampaign ? COLORS.magicBg : 'transparent', border: `1px solid ${selectedCampaign ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px 0', color: selectedCampaign ? COLORS.magicText : COLORS.dim, cursor: selectedCampaign ? 'pointer' : 'default' }}>Open Lobby →</button>
            </div>
          </>
        )}
        {step === 'lobby' && (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>Lobby Open</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginBottom: 20 }}>{campaign?.subtitle} · Waiting for players...</div>
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 20, minHeight: 80 }}>
              {checkins.length === 0
                ? <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div style={{ fontSize: 11, color: COLORS.dim }}>No players yet.</div>
    <button onClick={fetchCheckins} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', fontSize: 8, color: COLORS.dim, cursor: 'pointer', fontFamily: "'Cinzel', serif" }}>↻ Refresh</button>
  </div>
                : checkins.map(c => <div key={c.id} style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, padding: '4px 0' }}>✦ {c.character_name}</div>)
              }
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCancel} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 8, padding: '10px 0', cursor: 'pointer', color: COLORS.warn }}>Cancel Lobby</button>
              <button onClick={handleStart} disabled={checkins.length === 0 || starting} style={{ flex: 2, background: checkins.length > 0 ? COLORS.magicBg : 'transparent', border: `1px solid ${checkins.length > 0 ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px 0', cursor: checkins.length > 0 ? 'pointer' : 'default', color: checkins.length > 0 ? COLORS.magicText : COLORS.dim }}>
                {starting ? 'Starting…' : 'Start Campaign'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function SessionManager({ onTimerLabel, checkedInPlayers }) {
  const [showPlay, setShowPlay] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);

  const timer = useSessionTimer(activeSession?.started_at);

  useEffect(() => {
    onTimerLabel(activeSession?.status === 'active' ? timer : null);
  }, [timer, activeSession]);

  useEffect(() => { checkForActiveSession(); }, []);

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

  const handleEndClose = () => {
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
        <ScribeDraftModal
          session={activeSession}
          checkins={checkins}
          onClose={handleEndClose}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!activeSession && (
          <button onClick={() => setShowPlay(true)} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.magicText }}>▶ Play</button>
        )}
        {isLobby && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 8, color: COLORS.deity, fontFamily: "'Cinzel', serif" }}>Lobby · {checkins.length} In</div>
            <button onClick={() => setShowPlay(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '5px 10px', fontSize: 7, color: COLORS.deity, cursor: 'pointer' }}>View Lobby</button>
            <button onClick={() => setShowEndModal(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 6, padding: '5px 10px', fontSize: 7, color: COLORS.warn, cursor: 'pointer' }}>Cancel</button>
          </div>
        )}
        {isActive && (
          <button onClick={() => setShowEndModal(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 6, padding: '6px 14px', fontSize: 8, color: COLORS.warn, cursor: 'pointer' }}>■ End Session</button>
        )}
      </div>
    </>
  );
}