import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_STATS, ALL_CLASSES, ACTIONS, getRaceDisplay } from './constants';
import { LOCATIONS } from './MapPanel';
import VTTViewer from './VTTViewer';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function label8() {
  return {
    fontSize: 8,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: COLORS.muted,
    fontFamily: "'Cinzel', serif",
  };
}

function StatusBadge({ status }) {
  const map = {
    draft:              { label: 'Draft',             color: COLORS.dim,   bg: 'rgba(131,115,100,0.12)' },
    awaiting_adventure: { label: 'Awaiting Approval', color: COLORS.deity, bg: COLORS.deityBg           },
    approved:           { label: 'Approved',          color: COLORS.magic, bg: COLORS.magicBg           },
    rejected:           { label: 'Rejected',          color: COLORS.warn,  bg: COLORS.warnBg            },
  };
  const s = map[status] || map.draft;
  return (
    <div style={{
      display: 'inline-block', fontSize: 8, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      fontFamily: "'Cinzel', serif", color: s.color,
      background: s.bg, border: `1px solid ${s.color}`,
      borderRadius: 4, padding: '2px 8px',
    }}>{s.label}</div>
  );
}

const FULL_TITLES = {
  'I':   'The Investigation of the Corren Mountain Mines',
  'II':  'The Search of Cielo Dorado',
  'III': 'An Offering to Aeirhyd',
  'IV':  'Frigid Dirge in Galekgarde',
};

// ─── CAMPAIGN LIST ────────────────────────────────────────────────────────────
function CampaignList({ onSelect, userChar, onHome }) {
  const { isMobile } = useDevice();

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeeb', fontFamily: 'Georgia, serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ padding: isMobile ? '20px 20px 0' : '28px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.4)', padding: 0 }}>← Home</button>
      </div>

      <div style={{ padding: isMobile ? '28px 20px 20px' : '36px 40px 24px', borderBottom: '1px solid rgba(26,23,20,0.08)' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)', marginBottom: 8 }}>Soteria · 178 E.U.</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1a1714', letterSpacing: '0.04em', lineHeight: 1.1 }}>CAMPAIGNS</div>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,23,20,0.45)', marginTop: 8 }}>Select a campaign to enter the world.</div>
      </div>

      <div style={{ padding: isMobile ? '20px' : '28px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CAMPAIGNS.map((c, i) => {
          const isAssigned = userChar?.campaign === String(c.id);
          return (
            <button key={c.id} onClick={() => onSelect(c)} style={{ background: isAssigned ? 'rgba(26,23,20,0.04)' : '#fff', border: `1px solid ${isAssigned ? 'rgba(26,23,20,0.25)' : 'rgba(26,23,20,0.1)'}`, borderRadius: 8, padding: isMobile ? '18px 20px' : '20px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', boxShadow: '0 1px 4px rgba(26,23,20,0.06)', transition: 'all 0.18s ease', width: '100%' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,23,20,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(26,23,20,0.06)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)' }}>Campaign {['I','II','III','IV'][i]}</div>
                  {isAssigned && <div style={{ fontSize: 8, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.magic, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '1px 6px' }}>✓ Your Campaign</div>}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 16 : 19, fontWeight: 700, color: '#1a1714', letterSpacing: '0.04em', marginBottom: 4 }}>{c.subtitle}</div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,23,20,0.4)' }}>{FULL_TITLES[c.id] || c.name}</div>
              </div>
              <div style={{ fontSize: 16, color: 'rgba(26,23,20,0.2)', marginLeft: 16, flexShrink: 0 }}>→</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CAMPAIGN MAP TAB ─────────────────────────────────────────────────────────
const DM_PASSWORD = 'LUC4N';

function CampaignMapTab({ campaign }) {
  const [mapFilename, setMapFilename]           = useState(null);
  const [dmOpen, setDmOpen]                     = useState(false);
  const [password, setPassword]                 = useState('');
  const [pwError, setPwError]                   = useState(false);
  const [unlocked, setUnlocked]                 = useState(false);
  const [selectedFilename, setSelectedFilename] = useState('');
  const [search, setSearch]                     = useState('');
  const [saving, setSaving]                     = useState(false);
  const [fullscreen, setFullscreen]             = useState(false);

  useEffect(() => { fetchMap(); }, [campaign.id]);

  const fetchMap = async () => {
    const { data } = await supabase.from('campaigns').select('map_url').eq('id', campaign.id).single();
    if (data?.map_url) setMapFilename(data.map_url);
  };

  const attemptUnlock = () => {
    if (password.trim() === DM_PASSWORD) {
      setUnlocked(true);
      setPwError(false);
    } else {
      setPwError(true);
      setTimeout(() => setPwError(false), 2000);
    }
  };

  const saveMap = async () => {
  if (!selectedFilename) return;
  setSaving(true);
  await supabase.from('campaigns').update({ map_url: selectedFilename }).eq('id', campaign.id);
  // ADD THIS:
  await supabase.from('vtt_sessions').upsert({ campaign_id: String(campaign.id), map_filename: selectedFilename }, { onConflict: 'campaign_id' });
  setMapFilename(selectedFilename);
  setSaving(false);
  setDmOpen(false);
  setUnlocked(false);
  setPassword('');
  setSelectedFilename('');
  setSearch('');
};

  const filtered = LOCATIONS.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  const activeLocation = LOCATIONS.find(l => l.filename === mapFilename);

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Campaign Map</div>

      {mapFilename ? (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <img
            src={`/Maps/${encodeURIComponent(mapFilename)}`}
            alt="Campaign map"
            style={{ width: '100%', borderRadius: 8, border: `1px solid ${COLORS.border}`, display: 'block' }}
          />
          {activeLocation && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 14px 10px', background: 'linear-gradient(transparent, rgba(10,8,6,0.8))', borderRadius: '0 0 8px 8px', pointerEvents: 'none' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: '#e8c84a', letterSpacing: '0.1em' }}>{activeLocation.name}</div>
            </div>
          )}
          <button
            onClick={() => setFullscreen(true)}
            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(10,8,6,0.7)', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}
          >⛶ Expand</button>
        </div>
      ) : (
        <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '52px 20px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>🗺</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>No map set</div>
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 6 }}>The DM can set a map below.</div>
        </div>
      )}

      {fullscreen && mapFilename && (
        <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {activeLocation && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.12em', marginBottom: 16 }}>{activeLocation.name}</div>}
          <img src={`/Maps/${encodeURIComponent(mapFilename)}`} alt="map" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', borderRadius: 8, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <div style={{ marginTop: 14, fontSize: 9, color: 'rgba(240,238,235,0.3)', fontFamily: "'Cinzel', serif" }}>Click outside to close</div>
        </div>
      )}

      {/* DM setter */}
      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div
          onClick={() => { setDmOpen(o => !o); setUnlocked(false); setPassword(''); setPwError(false); }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: COLORS.surface, cursor: 'pointer', userSelect: 'none' }}
        >
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.dim }}>⚙ DM — Set Map</div>
          <div style={{ fontSize: 10, color: COLORS.dim, transform: dmOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
        </div>

        {dmOpen && (
          <div style={{ padding: 14, background: COLORS.wizard, borderTop: `1px solid ${COLORS.border}` }}>
            {!unlocked ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && attemptUnlock()}
                  placeholder="DM password…"
                  style={{ flex: 1, background: COLORS.card, border: `1px solid ${pwError ? '#ef4444' : COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none', transition: 'border-color 0.2s' }}
                />
                <button onClick={attemptUnlock} style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderMid}`, borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', color: COLORS.text }}>Enter</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 9, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>✓ Unlocked — Select a location</div>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search locations…"
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                  {filtered.map(loc => {
                    const isSelected = loc.filename === selectedFilename;
                    return (
                      <button key={loc.id} onClick={() => setSelectedFilename(loc.filename)} style={{ textAlign: 'left', background: isSelected ? 'rgba(200,168,74,0.12)' : COLORS.card, border: `1px solid ${isSelected ? '#c8a84a88' : COLORS.border}`, borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.06em', color: isSelected ? '#e8c84a' : COLORS.text }}>
                        {isSelected && <span style={{ marginRight: 6, opacity: 0.7 }}>✦</span>}
                        {loc.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={saveMap}
                  disabled={saving || !selectedFilename}
                  style={{ width: '100%', background: selectedFilename ? 'rgba(200,168,74,0.15)' : 'transparent', border: `1px solid ${selectedFilename ? '#c8a84a' : COLORS.border}`, borderRadius: 6, padding: '10px 0', cursor: selectedFilename ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: selectedFilename ? '#e8c84a' : COLORS.dim, fontWeight: 700, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Setting map…' : '✦ Set as Campaign Map'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CAMPAIGN DASHBOARD ───────────────────────────────────────────────────────
const TABS = ['Map', 'Sheet', 'Actions', 'Log', 'Combat'];

function CampaignDashboard({ campaign, userChar, onBack, onAssign }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Map');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => { fetchRoster(); }, [campaign.id]);

  const fetchRoster = async () => {
    const { data } = await supabase.from('characters').select('*').eq('campaign_id', String(campaign.id));
    if (data) setRoster(data.map(row => ({ ...row.data, id: row.id, status: row.status })));
    setLoading(false);
  };

  const handleAssign = async () => {
    if (!userChar?.id) return;
    setAssigning(true);
    await supabase.from('characters').update({ campaign_id: String(campaign.id) }).eq('id', userChar.id);
    setAssigning(false);
    onAssign(String(campaign.id));
    fetchRoster();
  };

  const isAssigned = userChar?.campaign === String(campaign.id);

  const renderTab = () => {
    switch (activeTab) {

      case 'Map':
  return <VTTViewer campaignId={String(campaign.id)} userChar={userChar} />;

      case 'Roster':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Party Members</div>
            {loading ? (
              <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>Loading roster…</div>
            ) : roster.length === 0 ? (
              <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No adventurers assigned yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {roster.map(char => {
                  const cls = ALL_CLASSES.find(c => c.id === char.cid);
                  return (
                    <div key={char.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>{char.name || 'Unnamed'}</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}</div>
                      </div>
                      <StatusBadge status={char.status || 'draft'} />
                    </div>
                  );
                })}
              </div>
            )}
            {userChar && !isAssigned && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 10 }}>Assign your character to this campaign:</div>
                <button onClick={handleAssign} disabled={assigning} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '10px 24px', cursor: assigning ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700, opacity: assigning ? 0.6 : 1 }}>
                  {assigning ? 'Assigning…' : `✦ Join ${campaign.name}`}
                </button>
              </div>
            )}
            {isAssigned && <div style={{ marginTop: 16, fontSize: 11, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>✓ Your character is in this campaign</div>}
          </div>
        );

      case 'Sheet':
        return userChar ? (
          <div>
            <div style={{ ...label8(), marginBottom: 16 }}>Your Character</div>
            <CharacterSheetInline char={userChar} />
          </div>
        ) : (
          <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>
        );

      case 'Actions':
        return userChar ? (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Your Actions</div>
            {Object.entries(ACTIONS).map(([category, actions]) => {
              if (category === 'magic' && userChar.cp !== 'magic') return null;
              if (category === 'tech' && userChar.cp !== 'tech') return null;
              return (
                <div key={category} style={{ marginBottom: 16 }}>
                  <div style={{ ...label8(), marginBottom: 8, color: COLORS.dim }}>{category}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {actions.map(action => (
                      <div key={action} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, letterSpacing: '0.06em' }}>{action}</div>
                        <div style={{ fontSize: 10, color: userChar.actionBonuses?.[action] ? COLORS.magicText : COLORS.dim, fontFamily: 'Georgia, serif' }}>{userChar.actionBonuses?.[action] ? `+${userChar.actionBonuses[action]}` : '—'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>
        );

      case 'Log':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Session Log</div>
            <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No session logs yet. The Scribe will write here.</div>
            </div>
          </div>
        );

      case 'Combat':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Combat Tracker</div>
            <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Combat tracker coming soon.</div>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.wizard, display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: COLORS.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.muted, padding: 0 }}>← Campaigns</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.text }}>{campaign.subtitle}</div>
          <div style={{ fontSize: 8, color: COLORS.dim, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Cinzel', serif" }}>{FULL_TITLES[campaign.id] || campaign.name}</div>
        </div>
        <div style={{ width: 60 }} />
      </div>
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto', background: COLORS.surface, flexShrink: 0 }}>
        {TABS.map(tab => {
          const isActive = tab === activeTab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`, padding: isMobile ? '10px 12px' : '12px 18px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 8 : 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? COLORS.text : COLORS.dim, fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}>{tab}</button>
          );
        })}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

// ─── INLINE CHARACTER SHEET ───────────────────────────────────────────────────
function CharacterSheetInline({ char }) {
  const magicStats = ALL_STATS.filter(s => s.axis === 'magic');
  const techStats  = ALL_STATS.filter(s => s.axis === 'tech');
  const cls = ALL_CLASSES.find(c => c.id === char.cid);
  const axisColor = axis => axis === 'magic' ? COLORS.magic : COLORS.tech;
  const axisText  = axis => axis === 'magic' ? COLORS.magicText : COLORS.techText;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>{char.name || 'Unnamed'}</div>
        <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[...magicStats, ...techStats].map(s => {
          const val = char.stats?.[s.key] || 8;
          const pct = Math.round(((val - 8) / 8) * 100);
          return (
            <div key={s.key} style={{ background: COLORS.card, border: `1px solid ${axisColor(s.axis)}22`, borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: axisText(s.axis) }}>{s.label}</div>
                  <div style={{ fontSize: 8, color: COLORS.dim }}>{s.equiv}</div>
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 800, color: axisText(s.axis) }}>{val}</div>
              </div>
              <div style={{ height: 3, background: COLORS.dim, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: axisColor(s.axis), borderRadius: 2 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export default function CampaignView({ userChar, onHome, onAssign }) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  if (selectedCampaign) {
    return (
      <CampaignDashboard
        campaign={selectedCampaign}
        userChar={userChar}
        onBack={() => setSelectedCampaign(null)}
        onAssign={onAssign}
      />
    );
  }

  return (
    <CampaignList
      onSelect={setSelectedCampaign}
      userChar={userChar}
      onHome={onHome}
    />
  );
}
