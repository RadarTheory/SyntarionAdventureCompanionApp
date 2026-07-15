import { useCallback, useEffect, useMemo, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { fetchHerculesEventsForCampaign, eventsToTranscript, compileLocalSynopsis } from './lib/compileSession';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function useSessionTimer(startedAt) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return undefined;
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

function toLocalInputValue(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function defaultScheduledAt() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(19, 0, 0, 0);
  return toLocalInputValue(date);
}

function displayDateTime(value) {
  if (!value) return 'Unscheduled';
  return new Date(value).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getCheckinOpenAt(scheduledAt, minutesBefore) {
  if (!scheduledAt) return null;
  const date = new Date(scheduledAt);
  date.setMinutes(date.getMinutes() - Number(minutesBefore || 0));
  return date.toISOString();
}

function sessionTitle(session) {
  if (!session) return 'No Session';
  if (session.status === 'scheduled') return 'Session Scheduled';
  if (session.status === 'lobby') return 'Check-In Open';
  if (session.status === 'active') return 'Session Active';
  return 'Session';
}

function ScribeDraftModal({ session, checkins, onClose }) {
  const [phase, setPhase] = useState('drafting');
  const [dmRecord, setDmRecord] = useState('');
  const [chronicles, setChronicles] = useState({});
  const [activeTab, setActiveTab] = useState('dm');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const draft = async () => {
      const { data: campaignRow } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', session.campaign_id)
        .maybeSingle();
      if (!cancelled && campaignRow) setCampaign(campaignRow);

      const { events } = await fetchHerculesEventsForCampaign(session.campaign_id);
      const local = compileLocalSynopsis(events, checkins);

      try {
        const transcript = eventsToTranscript(events);
        const characterList = checkins.map(c => `${c.character_name} (id: ${c.character_id})`).join(', ');
        const chronicleShape = checkins
          .map(c => `"${c.character_id}": "A 2-4 paragraph narrative chronicle in third person for ${c.character_name}, using only what ${c.character_name} witnessed."`)
          .join(',\n    ');

        const prompt = `You are The Scribe, chronicler of the world of Soteria.

A session has just ended for campaign: ${campaignRow?.subtitle || session.campaign_id}
Players present: ${characterList || 'Unknown'}

Combat and event transcript, chronological:
${transcript}

Produce raw JSON only:
{
  "dm_record": "A thorough structured debrief for the DM.",
  "player_chronicles": {
    ${chronicleShape}
  }
}`;

        const { data, error: fnError } = await supabase.functions.invoke('scribe', {
          body: {
            system: 'You are The Scribe. Respond only with raw valid JSON. No markdown.',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 2000,
          },
        });

        if (fnError) throw new Error(fnError.message);
        const text = data?.choices?.[0]?.message?.content;
        if (!text) throw new Error('No response from Scribe.');
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

        if (cancelled) return;
        setDmRecord(parsed.dm_record || local.dmRecord);
        const built = {};
        checkins.forEach(c => {
          built[c.character_id] = {
            name: c.character_name,
            text: parsed.player_chronicles?.[c.character_id] || local.chronicles[c.character_id]?.text || `${c.character_name} was present for the session.`,
            publish: true,
          };
        });
        setChronicles(built);
        setPhase('review');
      } catch (err) {
        if (cancelled) return;
        setError(`Scribe unavailable (${err.message}). Showing the compiled event log instead.`);
        setDmRecord(local.dmRecord);
        setChronicles(local.chronicles);
        setPhase('review');
      }
    };

    draft();
    return () => { cancelled = true; };
  }, [session.campaign_id, checkins]);

  const handleApprove = async () => {
    setSaving(true);
    const sessionDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    await supabase.from('dm_memory').insert({
      campaign_id: session.campaign_id,
      category: 'session',
      content: dmRecord,
    });

    await Promise.all(
      Object.entries(chronicles).map(([charId, { text, publish }]) =>
        supabase.from('grimoire_entries').insert({
          character_id: String(charId),
          campaign_id: String(session.campaign_id),
          type: 'event',
          title: `Session - ${sessionDate}`,
          body: text,
          dm_note: publish ? null : '(Not yet published to player)',
        })
      )
    );

    await supabase.from('session_logs').insert({
      campaign_id: String(session.campaign_id),
      session_id: String(session.id),
      entry: dmRecord,
      title: `Session - ${sessionDate}`,
      summary: dmRecord,
      raw_events: Object.fromEntries(Object.entries(chronicles).map(([id, c]) => [id, c.text])),
      visible_to_players: Object.values(chronicles).some(c => c.publish),
      approved: true,
    });

    await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    setSaving(false);
    onClose();
  };

  const handleSkip = async () => {
    await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.92)', backdropFilter: 'blur(8px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#13100d', border: `1px solid ${COLORS.deity}44`, borderRadius: 14, padding: '28px 32px', maxWidth: 600, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}>
        <div style={{ marginBottom: 20, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.08em', marginBottom: 4 }}>The Scribe</div>
          <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {campaign?.subtitle || session.campaign_id} - {checkins.length} player{checkins.length !== 1 ? 's' : ''} - End of Session
          </div>
        </div>

        {phase === 'drafting' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '40px 0' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.deity, letterSpacing: '0.14em', textTransform: 'uppercase' }}>The Scribe deliberates...</div>
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', maxWidth: 320 }}>
              Consulting the session records and composing chronicles.
            </div>
          </div>
        )}

        {phase === 'review' && (
          <>
            {error && <div style={{ background: COLORS.warnBg, border: `1px solid ${COLORS.warn}44`, borderRadius: 6, padding: '8px 12px', fontSize: 11, color: COLORS.warn, marginBottom: 16 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexShrink: 0, flexWrap: 'wrap' }}>
              <button onClick={() => setActiveTab('dm')} style={{ background: activeTab === 'dm' ? COLORS.deityBg : 'transparent', border: `1px solid ${activeTab === 'dm' ? COLORS.deity : COLORS.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: activeTab === 'dm' ? COLORS.deityText : COLORS.dim }}>DM Record</button>
              {Object.entries(chronicles).map(([charId, { name }]) => (
                <button key={charId} onClick={() => setActiveTab(charId)} style={{ background: activeTab === charId ? 'rgba(121,245,167,0.1)' : 'transparent', border: `1px solid ${activeTab === charId ? COLORS.magic : COLORS.border}`, borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: activeTab === charId ? COLORS.magic : COLORS.dim }}>{name}</button>
              ))}
            </div>

            {activeTab === 'dm' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ ...label8(), marginBottom: 8 }}>DM Record</div>
                <textarea value={dmRecord} onChange={e => setDmRecord(e.target.value)} style={{ flex: 1, width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', minHeight: 260 }} />
              </div>
            )}

            {Object.entries(chronicles).map(([charId, { name, text, publish }]) => activeTab === charId ? (
              <div key={charId} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ ...label8() }}>{name} - Player Chronicle</div>
                  <button onClick={() => setChronicles(prev => ({ ...prev, [charId]: { ...prev[charId], publish: !prev[charId].publish } }))} style={{ background: publish ? 'rgba(121,245,167,0.1)' : 'rgba(240,238,235,0.04)', border: `1px solid ${publish ? COLORS.magic : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: publish ? COLORS.magic : COLORS.dim }}>{publish ? 'Publish' : 'Hold'}</button>
                </div>
                <textarea value={text} onChange={e => setChronicles(prev => ({ ...prev, [charId]: { ...prev[charId], text: e.target.value } }))} style={{ flex: 1, width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', minHeight: 260 }} />
              </div>
            ) : null)}

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexShrink: 0 }}>
              <button onClick={handleSkip} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 16px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Skip & End</button>
              <button onClick={handleApprove} disabled={saving} style={{ flex: 1, background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 8, padding: '10px 0', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, textTransform: 'uppercase', color: COLORS.deityText, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>{saving ? 'Committing...' : 'Approve & End Session'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PlayModal({ onClose, onSessionStarted, existingSession }) {
  const [step, setStep] = useState(existingSession ? 'lobby' : 'select');
  const [selectedCampaign, setSelectedCampaign] = useState(existingSession?.campaign_id || null);
  const [session, setSession] = useState(existingSession || null);
  const [checkins, setCheckins] = useState([]);
  const [starting, setStarting] = useState(false);
  const [dbCampaigns, setDbCampaigns] = useState([]);
  const [mode, setMode] = useState('now');
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt);
  const [checkinMinutes, setCheckinMinutes] = useState(30);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    supabase.from('campaigns').select('*').order('created_at', { ascending: true }).then(({ data }) => { if (data) setDbCampaigns(data); });
  }, []);

  const fetchCheckins = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase.from('session_checkins').select('*').eq('session_id', session.id);
    if (data) setCheckins(data);
  }, [session]);

  useEffect(() => {
    if (!session) return undefined;
    queueMicrotask(() => { void fetchCheckins(); });
    const channel = supabase.channel(`lobby-${session.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_checkins' }, () => fetchCheckins())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchCheckins, session]);

  const createSession = async (status) => {
    if (!selectedCampaign) return null;
    const { data: { user } } = await supabase.auth.getUser();
    const scheduledIso = mode === 'schedule' ? new Date(scheduledAt).toISOString() : null;
    const { data, error } = await supabase.from('sessions').insert({
      campaign_id: selectedCampaign,
      status,
      created_by: user?.id,
      scheduled_at: scheduledIso,
      checkin_opens_at: scheduledIso ? getCheckinOpenAt(scheduledIso, checkinMinutes) : null,
      checkin_minutes_before: scheduledIso ? Number(checkinMinutes) : null,
      notes: notes.trim() || null,
    }).select().single();
    if (error) return null;
    setSession(data);
    setStep('lobby');
    return data;
  };

  const handleCreateLobby = async () => { await createSession('lobby'); };
  const handleSchedule = async () => { await createSession('scheduled'); };

  const handleOpenCheckIn = async () => {
    if (!session) return;
    const { data, error } = await supabase.from('sessions').update({ status: 'lobby', checkin_opened_at: new Date().toISOString() }).eq('id', session.id).select().single();
    if (!error && data) setSession(data);
  };

  const handleStart = async () => {
    if (!session) return;
    setStarting(true);
    const { data, error } = await supabase.from('sessions').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', session.id).select().single();
    if (!error && data) { onSessionStarted(data, checkins); onClose(); }
    setStarting(false);
  };

  const handleCancel = async () => {
    if (session) await supabase.from('sessions').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', session.id);
    onClose();
  };

  const campaign = dbCampaigns.find(c => String(c.id) === String(selectedCampaign));
  const isScheduled = session?.status === 'scheduled';
  const isLobby = session?.status === 'lobby';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.85)', backdropFilter: 'blur(6px)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#13100d', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 14, padding: '28px 32px', maxWidth: 520, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        {step === 'select' && (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 6, letterSpacing: '0.06em' }}>Session Control</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 18 }}>Open a lobby now, or schedule a session with early check-in.</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
              {['now', 'schedule'].map(value => (
                <button key={value} onClick={() => setMode(value)} style={{ background: mode === value ? COLORS.magicBg : 'transparent', border: `1px solid ${mode === value ? COLORS.magic : COLORS.border}`, borderRadius: 7, padding: '9px 10px', color: mode === value ? COLORS.magicText : COLORS.dim, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{value === 'now' ? 'Open Now' : 'Schedule'}</button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18, maxHeight: 170, overflowY: 'auto' }}>
              {dbCampaigns.map(c => (
                <div key={c.id} onClick={() => setSelectedCampaign(c.id)} style={{ background: selectedCampaign === c.id ? COLORS.magicBg : COLORS.card, border: `1px solid ${selectedCampaign === c.id ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: selectedCampaign === c.id ? COLORS.magicText : COLORS.text }}>{c.subtitle}</div>
                </div>
              ))}
            </div>

            {mode === 'schedule' && (
              <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
                <label style={{ display: 'grid', gap: 5 }}>
                  <span style={label8()}>Session Time</span>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 10px', color: COLORS.text, fontFamily: 'Georgia, serif' }} />
                </label>
                <label style={{ display: 'grid', gap: 5 }}>
                  <span style={label8()}>Early Check-In</span>
                  <select value={checkinMinutes} onChange={e => setCheckinMinutes(Number(e.target.value))} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 10px', color: COLORS.text, fontFamily: 'Georgia, serif' }}>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                  </select>
                </label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional note for players" rows={3} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', resize: 'vertical' }} />
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 0', cursor: 'pointer', color: COLORS.dim }}>Cancel</button>
              <button onClick={mode === 'schedule' ? handleSchedule : handleCreateLobby} disabled={!selectedCampaign} style={{ flex: 2, background: selectedCampaign ? COLORS.magicBg : 'transparent', border: `1px solid ${selectedCampaign ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px 0', color: selectedCampaign ? COLORS.magicText : COLORS.dim, cursor: selectedCampaign ? 'pointer' : 'default' }}>{mode === 'schedule' ? 'Schedule Session' : 'Open Lobby'}</button>
            </div>
          </>
        )}

        {step === 'lobby' && (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{sessionTitle(session)}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontStyle: 'italic', marginBottom: 14 }}>{campaign?.subtitle || session?.campaign_id}</div>
            {session?.scheduled_at && (
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', marginBottom: 14, fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>
                <div><strong style={{ color: COLORS.text }}>Start:</strong> {displayDateTime(session.scheduled_at)}</div>
                <div><strong style={{ color: COLORS.text }}>Check-in:</strong> {displayDateTime(session.checkin_opens_at)}</div>
                {session.notes && <div style={{ marginTop: 5, fontStyle: 'italic' }}>{session.notes}</div>}
              </div>
            )}
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', marginBottom: 20, minHeight: 80 }}>
              {checkins.length === 0 ? <div style={{ fontSize: 11, color: COLORS.dim }}>No players checked in yet.</div> : checkins.map(c => <div key={c.id} style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, padding: '4px 0' }}>{c.character_name}</div>)}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCancel} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 8, padding: '10px 0', cursor: 'pointer', color: COLORS.warn }}>{isScheduled ? 'Cancel' : 'Close'}</button>
              {isScheduled && <button onClick={handleOpenCheckIn} style={{ flex: 2, background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 8, padding: '10px 0', cursor: 'pointer', color: COLORS.deityText }}>Open Check-In</button>}
              {isLobby && <button onClick={handleStart} disabled={checkins.length === 0 || starting} style={{ flex: 2, background: checkins.length > 0 ? COLORS.magicBg : 'transparent', border: `1px solid ${checkins.length > 0 ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px 0', cursor: checkins.length > 0 ? 'pointer' : 'default', color: checkins.length > 0 ? COLORS.magicText : COLORS.dim }}>{starting ? 'Starting...' : 'Start Session'}</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SessionManager({ onTimerLabel }) {
  const [showPlay, setShowPlay] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [checkins, setCheckins] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const timer = useSessionTimer(activeSession?.started_at);

  useEffect(() => {
    onTimerLabel(activeSession?.status === 'active' ? timer : null);
  }, [timer, activeSession?.status, onTimerLabel]);

  const fetchCheckins = useCallback(async (sessionId) => {
    const { data } = await supabase.from('session_checkins').select('*').eq('session_id', sessionId);
    if (data) setCheckins(data);
  }, []);

  const checkForSession = useCallback(async () => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .in('status', ['active', 'lobby', 'scheduled'])
      .order('created_at', { ascending: false })
      .limit(1);
    const next = data?.[0] || null;
    setActiveSession(next);
    if (next) fetchCheckins(next.id);
    else setCheckins([]);
  }, [fetchCheckins]);

  useEffect(() => {
    queueMicrotask(() => { void checkForSession(); });
    const channel = supabase.channel('session-manager-watch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, () => checkForSession())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_checkins' }, () => activeSession?.id && fetchCheckins(activeSession.id))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [activeSession?.id, checkForSession, fetchCheckins]);

  const handleSessionStarted = (session, initialCheckins) => {
    setActiveSession(session);
    setCheckins(initialCheckins);
  };

  const handleEndClose = () => {
    setActiveSession(null);
    setCheckins([]);
    setShowEndModal(false);
    queueMicrotask(() => { void checkForSession(); });
  };

  const isScheduled = activeSession?.status === 'scheduled';
  const isLobby = activeSession?.status === 'lobby';
  const isActive = activeSession?.status === 'active';
  const pillText = useMemo(() => {
    if (isScheduled) return `Scheduled - ${displayDateTime(activeSession.scheduled_at)}`;
    if (isLobby) return `Check-In - ${checkins.length} In`;
    if (isActive) return `Live - ${timer}`;
    return null;
  }, [activeSession, checkins.length, isActive, isLobby, isScheduled, timer]);

  return (
    <>
      {showPlay && (
        <PlayModal
          existingSession={isScheduled || isLobby ? activeSession : null}
          onClose={() => setShowPlay(false)}
          onSessionStarted={handleSessionStarted}
        />
      )}
      {showEndModal && activeSession && <ScribeDraftModal session={activeSession} checkins={checkins} onClose={handleEndClose} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {!activeSession && <button onClick={() => setShowPlay(true)} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.magicText }}>Session</button>}
        {activeSession && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 8, color: isActive ? COLORS.magic : COLORS.deity, fontFamily: "'Cinzel', serif", maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pillText}</div>
            {(isScheduled || isLobby) && <button onClick={() => setShowPlay(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '5px 10px', fontSize: 7, color: COLORS.deity, cursor: 'pointer' }}>Manage</button>}
            {isActive && <button onClick={() => setShowEndModal(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 6, padding: '6px 14px', fontSize: 8, color: COLORS.warn, cursor: 'pointer' }}>End Session</button>}
          </div>
        )}
      </div>
    </>
  );
}


