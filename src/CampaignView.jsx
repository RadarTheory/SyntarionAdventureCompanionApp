import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_STATS, ALL_CLASSES, ACTIONS, getRaceDisplay } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
  'II':  'The Keys of Aerithos',
  'III': 'Prints in Gamdon',
  'IV':  'Frigid Ill in Galekgarde',
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
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)', marginBottom: 8 }}>
          Soteria · 178 E.U.
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1a1714', letterSpacing: '0.04em', lineHeight: 1.1 }}>
          CAMPAIGNS
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,23,20,0.45)', marginTop: 8 }}>
          Select a campaign to enter the world.
        </div>
      </div>

      <div style={{ padding: isMobile ? '20px' : '28px 40px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {CAMPAIGNS.map((c, i) => {
          const isAssigned = userChar?.campaign === String(c.id);
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              style={{
                background: isAssigned ? 'rgba(26,23,20,0.04)' : '#fff',
                border: `1px solid ${isAssigned ? 'rgba(26,23,20,0.25)' : 'rgba(26,23,20,0.1)'}`,
                borderRadius: 8, padding: isMobile ? '18px 20px' : '20px 28px',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', textAlign: 'left',
                boxShadow: '0 1px 4px rgba(26,23,20,0.06)',
                transition: 'all 0.18s ease', width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,23,20,0.10)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(26,23,20,0.06)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)' }}>
                    Campaign {['I','II','III','IV'][i]}
                  </div>
                  {isAssigned && (
                    <div style={{ fontSize: 8, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.magic, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '1px 6px' }}>
                      ✓ Your Campaign
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 16 : 19, fontWeight: 700, color: '#1a1714', letterSpacing: '0.04em', marginBottom: 4 }}>
                  {c.subtitle}
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,23,20,0.4)' }}>
                  {FULL_TITLES[c.id] || c.name}
                </div>
              </div>
              <div style={{ fontSize: 16, color: 'rgba(26,23,20,0.2)', marginLeft: 16, flexShrink: 0 }}>→</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CAMPAIGN DASHBOARD ───────────────────────────────────────────────────────
const TABS = ['Map', 'Roster', 'Sheet', 'Actions', 'Log', 'Combat'];

function CampaignDashboard({ campaign, userChar, onBack, onAssign }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Map');
  const [roster, setRoster] = useState([]);
  const [mapUrl, setMapUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchRoster();
    fetchCampaign();
  }, [campaign.id]);

  const fetchRoster = async () => {
    const { data } = await supabase
      .from('characters')
      .select('*')
      .eq('campaign_id', String(campaign.id));
    if (data) setRoster(data.map(row => ({ ...row.data, id: row.id, status: row.status })));
    setLoading(false);
  };

  const fetchCampaign = async () => {
    const { data } = await supabase
      .from('campaigns')
      .select('map_url')
      .eq('id', campaign.id)
      .single();
    if (data?.map_url) setMapUrl(data.map_url);
  };

  const handleAssign = async () => {
    if (!userChar?.id) return;
    setAssigning(true);
    await supabase
      .from('characters')
      .update({ campaign_id: String(campaign.id) })
      .eq('id', userChar.id);
    setAssigning(false);
    onAssign(String(campaign.id));
    fetchRoster();
  };

  const isAssigned = userChar?.campaign === String(campaign.id);

  const renderTab = () => {
    switch (activeTab) {

      case 'Map':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Campaign Map</div>
            {mapUrl ? (
              <img src={mapUrl} alt="Campaign map" style={{ width: '100%', borderRadius: 8, border: `1px solid ${COLORS.border}` }} />
            ) : (
              <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🗺</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>No map set</div>
                <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 6 }}>The DM can add a map from DM Mode.</div>
              </div>
            )}
          </div>
        );

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
                        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                          {getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={char.status || 'draft'} />
                    </div>
                  );
                })}
              </div>
            )}
            {userChar && !isAssigned && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 10 }}>
                  Assign your character to this campaign:
                </div>
                <button onClick={handleAssign} disabled={assigning} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '10px 24px', cursor: assigning ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700, opacity: assigning ? 0.6 : 1 }}>
                  {assigning ? 'Assigning…' : `✦ Join ${campaign.name}`}
                </button>
              </div>
            )}
            {isAssigned && (
              <div style={{ marginTop: 16, fontSize: 11, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                ✓ Your character is in this campaign
              </div>
            )}
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
                        <div style={{ fontSize: 10, color: userChar.actionBonuses?.[action] ? COLORS.magicText : COLORS.dim, fontFamily: 'Georgia, serif' }}>
                          {userChar.actionBonuses?.[action] ? `+${userChar.actionBonuses[action]}` : '—'}
                        </div>
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
        <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}
        </div>
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
