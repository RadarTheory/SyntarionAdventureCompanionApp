import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS, ALL_CLASSES, getRaceDisplay } from './constants';

// ─── PLAYERS PANEL ────────────────────────────────────────────────────────────
// Floating, collapsible panel showing all registered users + their characters.
// Props:
//   onOpenCharacter(char)  — opens CharacterEditor for that char
//   onMessage(session)     — opens ChatPanel for that player
// ─────────────────────────────────────────────────────────────────────────────
export default function PlayersPanel({ onOpenCharacter, onMessage }) {
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState([]);       // from get_user_profiles()
  const [characters, setCharacters] = useState([]); // from characters table
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // user id currently expanded

  useEffect(() => {
    fetchAll();
    // Refresh when characters change
    const channel = supabase.channel('players-panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: userRows }, { data: charRows }] = await Promise.all([
      supabase.rpc('get_user_profiles'),
      supabase.from('characters').select('*'),
    ]);
    if (userRows) setUsers(userRows);
    if (charRows) setCharacters(charRows.map(r => ({ ...r.data, id: r.id, status: r.status, campaign_id: r.campaign_id, user_id: r.user_id })));
    setLoading(false);
  };

  // Map each user to their characters
  const userList = users.map(u => ({
    ...u,
    chars: characters.filter(c => c.user_id === u.id),
  }));

  // Also collect unclaimed characters (no user_id)
  const unclaimed = characters.filter(c => !c.user_id);

  const statusColor = (status) => {
    const map = { approved: COLORS.magic, awaiting_adventure: COLORS.deity, rejected: COLORS.warn, draft: COLORS.dim };
    return map[status] || COLORS.dim;
  };

  const statusLabel = (status) => {
    const map = { approved: 'Approved', awaiting_adventure: 'Pending', rejected: 'Rejected', draft: 'Draft' };
    return map[status] || status;
  };

  const formatLastSeen = (ts) => {
    if (!ts) return 'Never';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 2) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const handleMessage = (user, char) => {
    // Open a new chat session with this player
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

  const totalPlayers = users.length;
  const activePlayers = userList.filter(u => u.chars.some(c => c.status === 'approved')).length;

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      right: 16,
      width: collapsed ? 44 : 280,
      zIndex: 190,
      background: '#13100d',
      border: `1px solid ${COLORS.deity}33`,
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      transition: 'width 0.2s ease',
      fontFamily: 'Georgia, serif',
    }}>
      {/* ── Header ── */}
      <div
        onClick={() => setCollapsed(c => !c)}
        style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: 'rgba(240,238,235,0.04)', borderBottom: collapsed ? 'none' : `1px solid rgba(240,238,235,0.06)`, userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <div style={{ fontSize: 14, flexShrink: 0 }}>⚔</div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.deity }}>Players</div>
              <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>{activePlayers} active · {totalPlayers} registered</div>
            </div>
          )}
        </div>
        {!collapsed && <div style={{ fontSize: 10, color: COLORS.dim, flexShrink: 0 }}>›</div>}
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div style={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '16px 12px', fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center' }}>Loading…</div>
          ) : (
            <>
              {/* ── Registered users ── */}
              {userList.map(user => {
                const isExpanded = expanded === user.id;
                const email = user.email || '—';
                const username = email.split('@')[0];
                const hasApproved = user.chars.some(c => c.status === 'approved');
                const hasPending = user.chars.some(c => c.status === 'awaiting_adventure');

                return (
                  <div key={user.id} style={{ borderBottom: `1px solid rgba(240,238,235,0.04)` }}>
                    {/* User row */}
                    <div
                      onClick={() => setExpanded(isExpanded ? null : user.id)}
                      style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(240,238,235,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* Status dot */}
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: hasApproved ? COLORS.magic : hasPending ? COLORS.deity : COLORS.dim, boxShadow: hasApproved ? `0 0 6px ${COLORS.magic}88` : 'none' }} />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, fontWeight: 700, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
                        <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>
                          Last seen: {formatLastSeen(user.last_sign_in_at)}
                        </div>
                      </div>

                      <div style={{ fontSize: 9, color: COLORS.dim, flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</div>
                    </div>

                    {/* Expanded: characters + actions */}
                    {isExpanded && (
                      <div style={{ padding: '0 12px 10px 27px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Email */}
                        <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', marginBottom: 2 }}>{email}</div>

                        {/* Joined date */}
                        <div style={{ fontSize: 8, color: COLORS.dim }}>
                          Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                        </div>

                        {/* Characters */}
                        {user.chars.length === 0 ? (
                          <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic' }}>No characters yet.</div>
                        ) : (
                          user.chars.map(char => {
                            const cls = ALL_CLASSES?.find(c => c.id === char.cid);
                            const campaign = CAMPAIGNS.find(c => c.id === char.campaign_id);
                            return (
                              <div key={char.id} style={{ background: 'rgba(240,238,235,0.03)', border: `1px solid rgba(240,238,235,0.07)`, borderRadius: 6, padding: '7px 8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, fontWeight: 700 }}>{char.name || 'Unnamed'}</div>
                                  <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor(char.status), border: `1px solid ${statusColor(char.status)}`, borderRadius: 3, padding: '1px 5px' }}>
                                    {statusLabel(char.status)}
                                  </div>
                                </div>
                                <div style={{ fontSize: 9, color: COLORS.muted, fontStyle: 'italic', marginBottom: 4 }}>
                                  {getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}
                                </div>
                                {campaign && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', marginBottom: 6 }}>{campaign.subtitle}</div>}

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 5 }}>
                                  <button
                                    onClick={() => onOpenCharacter(char)}
                                    style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderMid; e.currentTarget.style.color = COLORS.text; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}
                                  >
                                    Sheet
                                  </button>
                                  <button
                                    onClick={() => handleMessage(user, char)}
                                    style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif" }}
                                  >
                                    Message
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}

                        {/* Message without character */}
                        {user.chars.length === 0 && (
                          <button
                            onClick={() => handleMessage(user, null)}
                            style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '5px 8px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif" }}
                          >
                            Send Message
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Unclaimed characters ── */}
              {unclaimed.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px 4px', fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>Unclaimed</div>
                  {unclaimed.map(char => (
                    <div key={char.id} style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: COLORS.dim }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name || 'Unnamed'}</div>
                      </div>
                      <button
                        onClick={() => onOpenCharacter(char)}
                        style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '3px 6px', cursor: 'pointer', fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}
                      >
                        Sheet
                      </button>
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
