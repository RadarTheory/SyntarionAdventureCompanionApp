import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// ─── SESSION CHECK-IN ─────────────────────────────────────────────────────────
// Drop this into the CharacterSheet consult tab or identity tab.
// Props:
//   char   — the character object (needs char.id, char.name, char.campaign_id or char.campaign)
//   user   — the authenticated user object (needs user.id)
// ─────────────────────────────────────────────────────────────────────────────
export default function SessionCheckin({ char, user, campaignId: campaignIdProp }) {
  const [lobbySession, setLobbySession] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  

  const campaignId = campaignIdProp || char?.campaign_id || char?.campaign;

  useEffect(() => {
    if (!campaignId) { setLoading(false); return; }
    checkSessionState();

    // Realtime: watch for session status changes
    const channel = supabase.channel(`checkin-watch-${char.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, checkSessionState)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_checkins' }, checkSessionState)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [campaignId, char?.id]);

  const checkSessionState = async () => {
    setLoading(true);
    // Find open session for this campaign
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .in('status', ['lobby', 'active'])
      .order('created_at', { ascending: false })
      .limit(1);

    const session = sessions?.[0] || null;

    if (session?.status === 'lobby') {
      setLobbySession(session);
      setActiveSession(null);
    } else if (session?.status === 'active') {
      setActiveSession(session);
      setLobbySession(null);
    } else {
      setLobbySession(null);
      setActiveSession(null);
    }

    // Check if this user is already checked in
    if (session && user?.id) {
      const { data: existing } = await supabase
        .from('session_checkins')
        .select('id')
        .eq('session_id', session.id)
        .eq('user_id', user.id)
        .single();
      setCheckedIn(!!existing);
    } else {
      setCheckedIn(false);
    }

    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!lobbySession || !user?.id || checking) return;
    setChecking(true);
    await supabase.from('session_checkins').upsert({
      session_id: lobbySession.id,
      user_id: user.id,
      character_id: char.id,
      character_name: char.name || 'Unknown',
    }, { onConflict: 'session_id,user_id' });
    setCheckedIn(true);
    setChecking(false);
  };

  const handleCheckOut = async () => {
    if (!lobbySession || !user?.id || checking) return;
    setChecking(true);
    await supabase.from('session_checkins')
      .delete()
      .eq('session_id', lobbySession.id)
      .eq('user_id', user.id);
    setCheckedIn(false);
    setChecking(false);
  };

  if (loading || !campaignId) return null;

  // No open session
  if (!lobbySession && !activeSession) return null;

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

  // Session is active — show status indicator
  if (activeSession) {
    return (
      <div style={{ ...containerStyle, border: `1px solid ${COLORS.magic}44`, background: 'rgba(121,245,167,0.04)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.magic, letterSpacing: '0.06em', marginBottom: 3 }}>
            ● Session Active
          </div>
          <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {checkedIn ? `${char.name} is present in this session.` : 'You are not checked in to this session.'}
          </div>
        </div>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.magic, boxShadow: `0 0 8px ${COLORS.magic}` }} />
      </div>
    );
  }

  // Lobby is open — show check-in button
  return (
    <div style={{ ...containerStyle, border: `1px solid ${COLORS.deity}44` }}>
      <div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.06em', marginBottom: 3 }}>
          {checkedIn ? '✓ Checked In' : 'Session Lobby Open'}
        </div>
        <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {checkedIn
            ? `${char.name} is ready. Waiting for the Architect to begin.`
            : 'The Architect has opened a lobby. Check in to join.'}
        </div>
      </div>
      {checkedIn ? (
        <button onClick={handleCheckOut} disabled={checking}
          style={{ background: 'transparent', border: `1px solid ${COLORS.warn}55`, borderRadius: 6, padding: '7px 14px', cursor: checking ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, opacity: checking ? 0.6 : 1, flexShrink: 0 }}>
          {checking ? '…' : 'Check Out'}
        </button>
      ) : (
        <button onClick={handleCheckIn} disabled={checking}
          style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '7px 14px', cursor: checking ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.deityText, fontWeight: 700, opacity: checking ? 0.6 : 1, flexShrink: 0 }}>
          {checking ? '…' : '✦ Check In'}
        </button>
      )}
    </div>
  );
}
