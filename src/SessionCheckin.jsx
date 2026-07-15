import { useState, useEffect, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

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

function isCheckinOpen(session) {
  if (!session) return false;
  if (session.status === 'lobby') return true;
  if (session.status !== 'scheduled') return false;
  const openAt = session.checkin_opens_at || session.scheduled_at;
  return openAt ? Date.now() >= new Date(openAt).getTime() : false;
}

export default function SessionCheckin({ char, user, campaignId: campaignIdProp }) {
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const campaignId = campaignIdProp || char?.campaign_id || char?.campaign;

  const checkSessionState = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('status', ['scheduled', 'lobby', 'active'])
      .order('created_at', { ascending: false })
      .limit(1);

    const session = sessions?.[0] || null;
    const nextUpcoming = session?.status === 'scheduled' || session?.status === 'lobby' ? session : null;
    const nextActive = session?.status === 'active' ? session : null;

    setUpcomingSession(nextUpcoming);
    setActiveSession(nextActive);

    if (session && user?.id) {
      const { data: existing } = await supabase
        .from('session_checkins')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .maybeSingle();
      setCheckedIn(!!existing);
    } else {
      setCheckedIn(false);
    }

    setLoading(false);
  }, [campaignId, user]);

  useEffect(() => {
    if (!campaignId) return undefined;

    queueMicrotask(() => { void checkSessionState(); });
    const timer = setInterval(checkSessionState, 60000);
    const channel = supabase.channel(`checkin-watch-${char?.id || campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, checkSessionState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_checkins' }, checkSessionState)
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, [campaignId, char?.id, checkSessionState]);

  const handleCheckIn = async () => {
    if (!upcomingSession || !user?.id || checking || !isCheckinOpen(upcomingSession)) return;
    setChecking(true);
    await supabase.from('session_checkins').upsert({
      session_id: upcomingSession.id,
      user_id: user.id,
      character_id: char.id,
      character_name: char.name || 'Unknown',
    }, { onConflict: 'session_id,user_id' });
    setCheckedIn(true);
    setChecking(false);
  };

  const handleCheckOut = async () => {
    if (!upcomingSession || !user?.id || checking) return;
    setChecking(true);
    await supabase.from('session_checkins')
      .delete()
      .eq('session_id', upcomingSession.id)
      .eq('user_id', user.id);
    setCheckedIn(false);
    setChecking(false);
  };

  if (loading || !campaignId) return null;
  if (!upcomingSession && !activeSession) return null;

  const containerStyle = {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    padding: '14px 16px',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  };

  if (activeSession) {
    return (
      <div style={{ ...containerStyle, border: `1px solid ${COLORS.magic}44`, background: 'rgba(121,245,167,0.04)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.magic, letterSpacing: '0.06em', marginBottom: 3 }}>
            Session Active
          </div>
          <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {checkedIn ? `${char.name} is present in this session.` : 'You are not checked in to this session.'}
          </div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.magic, boxShadow: `0 0 8px ${COLORS.magic}` }} />
      </div>
    );
  }

  const checkinOpen = isCheckinOpen(upcomingSession);
  const scheduled = upcomingSession.status === 'scheduled';
  const locked = scheduled && !checkinOpen;

  return (
    <div style={{ ...containerStyle, border: `1px solid ${COLORS.deity}44` }}>
      <div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.06em', marginBottom: 3 }}>
          {checkedIn ? 'Checked In' : locked ? 'Session Scheduled' : 'Session Check-In Open'}
        </div>
        <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5 }}>
          {checkedIn && `${char.name} is ready. Waiting for the Architect to begin.`}
          {!checkedIn && locked && `Begins ${displayDateTime(upcomingSession.scheduled_at)}. Check-in opens ${displayDateTime(upcomingSession.checkin_opens_at)}.`}
          {!checkedIn && !locked && 'Check in to let the Architect know you are ready.'}
          {upcomingSession.notes && <div style={{ marginTop: 4 }}>{upcomingSession.notes}</div>}
        </div>
      </div>
      {checkedIn ? (
        <button onClick={handleCheckOut} disabled={checking}
          style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 6, padding: '7px 14px', cursor: checking ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, opacity: checking ? 0.6 : 1, flexShrink: 0 }}>
          {checking ? '...' : 'Check Out'}
        </button>
      ) : (
        <button onClick={handleCheckIn} disabled={checking || locked}
          style={{ background: locked ? 'transparent' : COLORS.deityBg, border: `1px solid ${locked ? COLORS.border : COLORS.deity}`, borderRadius: 6, padding: '7px 14px', cursor: checking || locked ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: locked ? COLORS.dim : COLORS.deityText, fontWeight: 700, opacity: checking ? 0.6 : 1, flexShrink: 0 }}>
          {checking ? '...' : locked ? 'Pending' : 'Check In'}
        </button>
      )}
    </div>
  );
}


