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
const campaignLabel = (campaign, fallback) => campaign?.subtitle || campaign?.name || fallback || 'Untitled Campaign';

export default function PlayersPanel({ onOpenCharacter, onMessage, showVTT, onPlaceOnVTT, embedded = false, variant = 'admin', campaigns = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const [users, setUsers] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [openGroups, setOpenGroups] = useState({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: userRows }, { data: charRows }, moduleResult] = await Promise.all([
      supabase.rpc('get_user_profiles'),
      supabase.from('characters').select('*'),
      variant === 'dm' ? supabase.from('modules').select('id, name').order('created_at', { ascending: true }) : Promise.resolve({ data: [] }),
    ]);
    if (userRows) setUsers(userRows);
    if (moduleResult?.data) setModules(moduleResult.data);
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
  }, [variant]);

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

  const isDm = variant === 'dm';
  const userById = new Map(users.map(user => [String(user.id), user]));
  const moduleById = new Map(modules.map(mod => [String(mod.id), mod]));
  const liveCampaigns = campaigns.length > 0 ? campaigns : CAMPAIGNS.map(c => ({ ...c, module_name: 'Soteria' }));
  const campaignById = new Map();
  CAMPAIGNS.forEach(c => campaignById.set(String(c.id), { ...c, module_name: 'Soteria' }));
  liveCampaigns.forEach(c => campaignById.set(String(c.id), c));

  const userList = users.map(user => ({
    ...user,
    chars: characters.filter(char => char.user_id != null && String(char.user_id) === String(user.id)),
  }));
  const unclaimed = characters.filter(char => !char.user_id);
  const activeCharacters = characters
    .filter(char => char.status === 'approved')
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const totalPlayers = users.length;
  const activePlayers = userList.filter(user => user.chars.some(char => char.status === 'approved')).length;

  const moduleNameForCampaign = (campaign) => {
    if (!campaign) return 'Soteria';
    if (campaign.module_name) return campaign.module_name;
    if (campaign.module?.name) return campaign.module.name;
    if (campaign.module_id != null && moduleById.has(String(campaign.module_id))) return moduleById.get(String(campaign.module_id)).name;
    if (CAMPAIGNS.some(c => String(c.id) === String(campaign.id))) return 'Soteria';
    return 'Soteria';
  };

  const buildDmSections = () => {
    const moduleMap = new Map();
    const ensureModule = (name) => {
      const moduleName = name || 'Soteria';
      if (!moduleMap.has(moduleName)) moduleMap.set(moduleName, { name: moduleName, groups: [] });
      return moduleMap.get(moduleName);
    };
    const ensureGroup = (moduleName, key, title, order) => {
      const section = ensureModule(moduleName);
      let group = section.groups.find(g => g.key === key);
      if (!group) {
        group = { key, title, order, chars: [] };
        section.groups.push(group);
      }
      return group;
    };

    ensureGroup('Soteria', 'unassigned', 'Unassigned', -1);
    liveCampaigns.forEach((campaign, index) => {
      ensureGroup(moduleNameForCampaign(campaign), `campaign:${String(campaign.id)}`, campaignLabel(campaign, `Campaign ${index + 1}`), index);
    });

    activeCharacters.forEach(char => {
      const campaign = char.campaign_id != null ? campaignById.get(String(char.campaign_id)) : null;
      const group = campaign
        ? ensureGroup(moduleNameForCampaign(campaign), `campaign:${String(campaign.id)}`, campaignLabel(campaign, String(char.campaign_id)), liveCampaigns.findIndex(c => String(c.id) === String(campaign.id)))
        : ensureGroup('Soteria', 'unassigned', 'Unassigned', -1);
      group.chars.push(char);
    });

    return [...moduleMap.values()]
      .map(section => ({
        ...section,
        groups: section.groups
          .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
          .filter(group => group.chars.length > 0 || group.key !== 'unassigned'),
      }))
      .filter(section => section.groups.length > 0)
      .sort((a, b) => (a.name === 'Soteria' ? -1 : b.name === 'Soteria' ? 1 : a.name.localeCompare(b.name)));
  };

  const dmSections = isDm ? buildDmSections() : [];

  const handleMessage = (user, char) => {
    if (!onMessage) return;
    const sessionId = `dm-direct-${user.id}`;
    onMessage({
      session_id: sessionId,
      character_id: char?.id || null,
      character_name: char?.name || user.email?.split('@')[0] || 'Player',
      player_username: user.email?.split('@')[0] || null,
      campaign_id: char?.campaign_id || null,
      player_id: user.id,
    });
  };

  const toggleGroup = (key) => {
    setOpenGroups(current => ({ ...current, [key]: current[key] === false ? true : false }));
  };

  const isGroupOpen = (key) => openGroups[key] !== false;

  const renderDmCharacter = (char) => {
    const owner = char.user_id ? userById.get(String(char.user_id)) : null;
    const cls = ALL_CLASSES?.find(c => c.id === char.cid);
    const campaign = char.campaign_id != null ? campaignById.get(String(char.campaign_id)) : null;
    const portrait = char.sprite_url || char.token?.sprite_url || char.portrait_url || null;
    const isExpanded = expanded === char.id;
    return (
      <div key={char.id} style={{ borderTop: '1px solid rgba(240,238,235,0.04)' }}>
        <div
          onClick={() => setExpanded(isExpanded ? null : char.id)}
          style={{ padding: '9px 12px', display: 'flex', gap: 9, alignItems: 'center', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(240,238,235,0.04)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {portrait && <img src={portrait} alt="" style={{ width: 34, height: 34, borderRadius: 5, objectFit: 'cover', border: '1px solid ' + COLORS.border, flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{char.name || 'Unnamed'}</div>
            <div style={{ fontSize: 8, color: COLORS.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ' - ' + cls.name : ''}{campaign ? ' - ' + campaignLabel(campaign) : ''}
            </div>
          </div>
          <div style={{ fontSize: 9, color: COLORS.dim, flexShrink: 0, transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>{'>'}</div>
        </div>
        {isExpanded && (
          <div style={{ padding: '0 12px 10px 55px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div>
              <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Assigned Email</div>
              <div style={{ fontSize: 10, color: owner?.email ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: owner?.email ? 'normal' : 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {owner?.email || 'No player assigned'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {onOpenCharacter && <button onClick={(e) => { e.stopPropagation(); onOpenCharacter(char); }} style={{ flex: 1, background: 'transparent', border: '1px solid ' + COLORS.border, borderRadius: 4, padding: '5px 7px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>Sheet</button>}
              {showVTT && onPlaceOnVTT && <button onClick={(e) => { e.stopPropagation(); onPlaceOnVTT(char); }} style={{ flex: 1, background: 'rgba(200,168,74,0.12)', border: '1px solid #c8a84a66', borderRadius: 4, padding: '5px 7px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e8c84a', fontFamily: "'Cinzel', serif" }}>Add to VTT</button>}
            </div>
          </div>
        )}
      </div>
    );
  };

  const panelStyle = embedded
    ? { width: '100%', maxWidth: 1040, background: '#13100d', border: `1px solid ${COLORS.deity}33`, borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', overflow: 'hidden', fontFamily: 'Georgia, serif' }
    : { position: 'fixed', top: 80, right: 16, width: collapsed ? 44 : 300, zIndex: 190, background: '#13100d', border: `1px solid ${COLORS.deity}33`, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden', transition: 'width 0.2s ease', fontFamily: 'Georgia, serif' };

  const bodyOpen = embedded || !collapsed;
  const heading = isDm ? 'Active Characters' : 'Players';
  const subtitle = isDm ? `${activeCharacters.length} active` : `${activePlayers} active - ${totalPlayers} registered`;

  return (
    <div style={panelStyle}>
      <div
        onClick={() => !embedded && setCollapsed(current => !current)}
        style={{ padding: embedded ? '12px 14px' : '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: embedded ? 'default' : 'pointer', background: 'rgba(240,238,235,0.04)', borderBottom: bodyOpen ? '1px solid rgba(240,238,235,0.06)' : 'none', userSelect: 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
          <div style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${COLORS.deity}66`, flexShrink: 0 }} />
          {bodyOpen && (
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.deity }}>{heading}</div>
              <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>{subtitle}</div>
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
          ) : isDm ? (
            <>
              {dmSections.map(section => (
                <div key={section.name} style={{ padding: '4px 0 8px' }}>
                  <div style={{ padding: '8px 12px 5px', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.deity, fontFamily: "'Cinzel', serif", borderTop: '1px solid rgba(240,238,235,0.05)' }}>{section.name}</div>
                  {section.groups.map(group => {
                    const open = isGroupOpen(group.key);
                    return (
                      <div key={group.key} style={{ margin: '0 8px 6px', border: '1px solid rgba(240,238,235,0.07)', borderRadius: 7, overflow: 'hidden', background: 'rgba(240,238,235,0.025)' }}>
                        <div onClick={() => toggleGroup(group.key)} style={{ padding: '8px 9px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: open ? 'rgba(240,238,235,0.04)' : 'transparent' }}>
                          <div style={{ fontSize: 9, color: COLORS.dim, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>{'>'}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.text, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.title}</div>
                          </div>
                          <div style={{ fontSize: 8, color: COLORS.dim }}>{group.chars.length}</div>
                        </div>
                        {open && (
                          group.chars.length > 0
                            ? group.chars.map(renderDmCharacter)
                            : <div style={{ padding: '12px', fontSize: 10, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center' }}>No active characters.</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              {dmSections.length === 0 && <div style={{ padding: '20px 12px', fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center' }}>No active characters.</div>}
            </>
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
                          const campaign = campaignById.get(String(char.campaign_id));
                          return (
                            <div key={char.id} style={{ background: 'rgba(240,238,235,0.03)', border: '1px solid rgba(240,238,235,0.07)', borderRadius: 6, padding: '7px 8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3, gap: 8 }}>
                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, fontWeight: 700 }}>{char.name || 'Unnamed'}</div>
                                <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: statusColor(char.status), border: `1px solid ${statusColor(char.status)}`, borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>{statusLabel(char.status)}</div>
                              </div>
                              <div style={{ fontSize: 9, color: COLORS.muted, fontStyle: 'italic', marginBottom: 4 }}>{getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` - ${cls.name}` : ''}</div>
                              {campaign && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', marginBottom: 6 }}>{campaignLabel(campaign)}</div>}

                              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                {onOpenCharacter && <button onClick={() => onOpenCharacter(char)} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>Sheet</button>}
                                {onMessage && <button onClick={() => handleMessage(user, char)} style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif" }}>Message</button>}
                                {showVTT && onPlaceOnVTT && <button onClick={() => onPlaceOnVTT(char)} style={{ flex: 1, background: 'rgba(200,168,74,0.12)', border: '1px solid #c8a84a66', borderRadius: 4, padding: '4px 6px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e8c84a', fontFamily: "'Cinzel', serif" }} title="Place token on VTT map">VTT</button>}
                              </div>
                            </div>
                          );
                        })}

                        {user.chars.length === 0 && onMessage && <button onClick={() => handleMessage(user, null)} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '5px 8px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif" }}>Send Message</button>}
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

              {userList.length === 0 && unclaimed.length === 0 && <div style={{ padding: '20px 12px', fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center' }}>No players registered.</div>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
