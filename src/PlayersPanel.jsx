import { useState, useEffect, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS, ALL_CLASSES, getRaceDisplay } from './constants';

function formatLastSeen(ts) {
  if (!ts) return 'Never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const statusColor = (s) => ({ approved: COLORS.magic, awaiting_adventure: COLORS.deity, rejected: COLORS.warn, draft: COLORS.dim }[s] || COLORS.dim);
const statusLabel = (s) => ({ approved: 'Approved', awaiting_adventure: 'Pending', rejected: 'Rejected', draft: 'Draft' }[s] || s || 'Unknown');

export default function PlayersPanel({ onOpenCharacter, onMessage, showVTT, onPlaceOnVTT, embedded = false }) {
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: userRows }, { data: charRows }] = await Promise.all([
      supabase.rpc('get_user_profiles'),
      supabase.from('characters').select('*'),
    ]);
    if (userRows) setUsers(userRows);
    if (charRows) {
      setCharacters(charRows.map(row => ({
        ...(row.data || {}),
        id: row.id,
        status: row.status,
        campaign_id: row.campaign_id,
        user_id: row.user_id,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void fetchAll(); });
    const channel = supabase.channel('players-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => fetchAll())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchAll]);

  useEffect(() => {
    if (!collapsed || embedded) queueMicrotask(() => { void fetchAll(); });
  }, [collapsed, embedded, fetchAll]);

  const userList = users.map(user => ({
    ...user,
    chars: characters.filter(char => char.user_id != null && String(char.user_id) === String(user.id)),
  }));
  const unclaimed = characters.filter(char => !char.user_id);
  const totalPlayers = users.length;
  const activePlayers = userList.filter(user => user.chars.some(char => char.status === 'approved')).length;

  const handleMessage = (user, char) => {
    if (!onMessage) return;
    const sessionId = `dm-direct-${user.id}-${Date.now()}`;
    onMessage({
      session_id: sessionId,
      character_id: char?.id || null,
      character_name: char?.name || user.email?.split('@')[0] || 'Player',
      player_username: user.email?.split('@')[0] || null,
      campaign_id: char?.campaign_id || null,
      player_id: user.id,
    });
  };

  const panelStyle = embedded
    ? { width: '100%', maxWidth: 1040, background: '#13100d', border: `1px solid ${COLORS.deity}33`, borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', overflow: 'hidden', fontFamily: 'Georgia, serif' }
    : { position: 'fixed', top: 80, right: 16, width: collapsed ? 44 : 280, zIndex: 190, background: '#13100d', border: `1px solid ${COLORS.deity}33`, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', transition: 'width 0.2s ease', fontFamily: 'Georgia, serif' };

  const bodyOpen = embedded || !collapsed;

  return (
    <div style={panelStyle}>
      <div
        onClick={() => !embedded && setCollapsed(current => !current)}
        style={{ padding: embedded ? '12px 14px' : '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: embedded ? 'default' : 'pointer', background: 'rgba(240,238,235,0.04)', borderBottom: bodyOpen ? '1px solid rgba(240,238,235,0.06)' : 'none', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <div style={{ fontSize: 14, flexShrink: 0 }}>x</div>
          {bodyOpen && (
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.deity }}>Players</div>
              <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>{activePlayers} active - {totalPlayers} registered</div>
            </div>
          )}
        </div>
        {bodyOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <button onClick={e => { e.stopPropagation(); void fetchAll(); }} title="Refresh players" style={{ background: 'transparent', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontSize: 10, color: loading ? COLORS.deity : COLORS.dim, lineHeight: 1 }}>
              {loading ? '...' : 'Refresh'}
            </button>
            {!embedded && <div style={{ fontSize: 10, color: COLORS.dim }}>{'>'}</div>}
          </div>
        )}
      </div>

      {bodyOpen && (
        <div style={{ maxHeight: embedded ? 'calc(100vh - 220px)' : 'calc(100vh - 160px)', overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '16px 12px', fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center' }}>Loading...</div>
          ) : (
            <>
              {userList.map(user => {
                const isExpanded = expanded === user.id;
                const email = user.email || '-';
                const username = email.split('@')[0];
                const hasApproved = user.chars.some(char => char.status === 'approved');
                const hasPending = user.chars.some(char => char.status === 'awaiting_adventure');

                return (
                  <div key={user.id} style={{ borderBottom: '1px solid rgba(240,238,235,0.04)' }}>
                    <div
                      onClick={() => setExpanded(isExpanded ? null : user.id)}
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,238,235,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: hasApproved ? COLORS.magic : hasPending ? COLORS.deity : COLORS.dim, boxShadow: hasApproved ? `0 0 6px ${COLORS.magic}88` : 'none' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, fontWeight: 700, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
                        <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>Last seen: {formatLastSeen(user.last_sign_in_at)}</div>
                      </div>
                      <div style={{ fontSize: 9, color: COLORS.dim, flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>{'>'}</div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0 12px 10px 27px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', marginBottom: 2 }}>{email}</div>
                        <div style={{ fontSize: 8, color: COLORS.dim }}>Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</div>

                        {user.chars.length === 0 ? (
                          <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic' }}>No characters yet.</div>
                        ) : user.chars.map(char => {
                          const cls = ALL_CLASSES?.find(c => c.id === char.cid);
                          const campaign = CAMPAIGNS.find(c => c.id === char.campaign_id);
                          return (
                            <div key={char.id} style={{ background: 'rgba(240,238,235,0.03)', border: '1px solid rgba(240,238,235,0.07)', borderRadius: 6, padding: '7px 8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3, gap: 8 }}>
                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, fontWeight: 700 }}>{char.name || 'Unnamed'}</div>
                                <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor(char.status), border: `1px solid ${statusColor(char.status)}`, borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>{statusLabel(char.status)}</div>
                              </div>
                              <div style={{ fontSize: 9, color: COLORS.muted, fontStyle: 'italic', marginBottom: 4 }}>{getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` - ${cls.name}` : ''}</div>
                              {campaign && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', marginBottom: 6 }}>{campaign.subtitle}</div>}

                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {onOpenCharacter && (
                                  <button onClick={() => onOpenCharacter(char)} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>Sheet</button>
                                )}
                                {onMessage && (
                                  <button onClick={() => handleMessage(user, char)} style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif" }}>Message</button>
                                )}
                                {showVTT && onPlaceOnVTT && (
                                  <button onClick={() => onPlaceOnVTT(char)} style={{ flex: 1, background: 'rgba(200,168,74,0.12)', border: '1px solid #c8a84a66', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e8c84a', fontFamily: "'Cinzel', serif" }} title="Place token on VTT map">VTT</button>
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {user.chars.length === 0 && onMessage && (
                          <button onClick={() => handleMessage(user, null)} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '5px 8px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif" }}>Send Message</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {unclaimed.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px 4px', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>Unclaimed</div>
                  {unclaimed.map(char => (
                    <div key={char.id} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: COLORS.dim }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name || 'Unnamed'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {onOpenCharacter && <button onClick={() => onOpenCharacter(char)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>Sheet</button>}
                        {showVTT && onPlaceOnVTT && <button onClick={() => onPlaceOnVTT(char)} style={{ background: 'rgba(200,168,74,0.12)', border: '1px solid #c8a84a66', borderRadius: 3, padding: '3px 6px', cursor: 'pointer', fontSize: 7, color: '#e8c84a', fontFamily: "'Cinzel', serif" }}>VTT</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {userList.length === 0 && unclaimed.length === 0 && (
                <div style={{ padding: '20px 12px', fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center' }}>No players registered.</div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
