import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_STATS, ALL_CLASSES, ACTIONS, getRaceDisplay } from './constants';
import { LOCATIONS } from './MapPanel';
import VTTViewer from './VTTViewer';
import AstragalButton from './AstragalButton';
import Astragal from './Astragal';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
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
    <div style={{ display: 'inline-block', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", color: s.color, background: s.bg, border: `1px solid ${s.color}`, borderRadius: 4, padding: '2px 8px' }}>{s.label}</div>
  );
}

const FULL_TITLES = {
  'I':   'The Investigation of the Corren Mountain Mines',
  'II':  'The Search of Cielo Dorado',
  'III': 'An Offering to Aeirhyd',
  'IV':  'Frigid Dirge in Galekgarde',
};

// ─── SESSION TIMER HOOK ───────────────────────────────────────────────────────
function useSessionTimer(campaignId) {
  const [startedAt, setStartedAt] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!campaignId) return;
    const load = async () => {
      const { data } = await supabase.from('sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data?.started_at) setStartedAt(data.started_at);
      else if (data?.created_at) setStartedAt(data.created_at);
    };
    load();
    const sub = supabase.channel(`session-timer-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, load)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  useEffect(() => {
    if (!startedAt) return;
    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  if (!startedAt) return null;
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

// ─── HERCULES LITE (player-facing combat log) ─────────────────────────────────
function HerculesLite({ campaignId, char }) {
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [myRoll, setMyRoll] = useState('');
  const [rolling, setRolling] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!campaignId) return;
    loadSession();
    const sub = supabase.channel(`hercules-player-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_sessions' }, loadSession)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_events' }, () => session?.id && loadEvents(session.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hercules_initiative' }, () => session?.id && loadInitiative(session.id))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events]);

  const loadSession = async () => {
    const { data } = await supabase.from('hercules_sessions').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle();
    setSession(data || null);
    if (data?.id) { loadEvents(data.id); loadInitiative(data.id); }
    else { setEvents([]); setInitiative([]); setSubmitted(false); }
  };

  const loadEvents = async (sid) => {
    const { data } = await supabase.from('hercules_events').select('*').eq('session_id', sid).order('created_at', { ascending: true });
    if (data) setEvents(data);
  };

  const loadInitiative = async (sid) => {
    const { data } = await supabase.from('hercules_initiative').select('*').eq('session_id', sid).order('roll', { ascending: false });
    if (data) setInitiative(data);
  };

  const rollInitiative = async () => {
    if (!session?.id || rolling) return;
    setRolling(true);
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = 0;
    await supabase.from('hercules_initiative').insert({
      session_id: session.id,
      character_id: char?.id || null,
      character_name: char?.name || 'Player',
      roll,
      modifier,
      total: roll + modifier,
    });
    await supabase.from('hercules_events').insert({
      session_id: session.id,
      campaign_id: String(campaignId),
      type: 'initiative',
      actor_name: char?.name || 'Player',
      actor_id: char?.id || null,
      description: `${char?.name || 'Player'} rolled initiative.`,
      roll,
      total: roll + modifier,
    });
    setSubmitted(true);
    setRolling(false);
    await loadInitiative(session.id);
  };

  const alreadyRolled = submitted || initiative.some(r => r.character_id === char?.id);

  if (!session) {
    return (
      <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No active combat. The Architect will call for battle.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Initiative roll */}
      {!alreadyRolled ? (
        <div style={{ background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 10, padding: '16px 18px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.1em', marginBottom: 8 }}>⚔ COMBAT BEGINS</div>
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 14 }}>The Architect calls for initiative. Roll now.</div>
          <button onClick={rollInitiative} disabled={rolling} style={{ background: 'rgba(200,168,74,0.18)', border: '1px solid #c8a84a', borderRadius: 8, padding: '10px 28px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.12em', color: '#e8c84a', fontWeight: 700 }}>
            {rolling ? 'Rolling…' : '⚔ Roll Initiative (d20)'}
          </button>
        </div>
      ) : (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 11, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>
          ✓ Initiative submitted
        </div>
      )}

      {/* Turn order */}
      {initiative.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ ...label8(), marginBottom: 10 }}>Turn Order</div>
          {initiative.map((row, i) => (
            <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: row.character_id === char?.id ? 'rgba(200,168,74,0.1)' : 'transparent', borderRadius: 6, marginBottom: 4 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: row.character_id === char?.id ? '#e8c84a' : COLORS.text }}>{i + 1}. {row.character_name}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: '#e8c84a' }}>{row.total || row.roll}</div>
            </div>
          ))}
        </div>
      )}

      {/* Event log */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', maxHeight: 280, overflowY: 'auto' }}>
        <div style={{ ...label8(), marginBottom: 10 }}>Combat Log</div>
        {events.length === 0 ? (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Awaiting events…</div>
        ) : (
          [...events].reverse().map(ev => (
            <div key={ev.id} style={{ borderBottom: `1px solid ${COLORS.border}`, padding: '8px 0', marginBottom: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.muted, letterSpacing: '0.06em' }}>{ev.actor_name}</div>
                {ev.total != null && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a' }}>{ev.total}</div>}
              </div>
              <div style={{ fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>{ev.description}</div>
              {ev.outcome && <div style={{ fontSize: 10, color: ev.dm_approved ? COLORS.magic : COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{ev.outcome}</div>}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

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
  const [mapFilename, setMapFilename] = useState(null);
  const [dmOpen, setDmOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [selectedFilename, setSelectedFilename] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => { fetchMap(); }, [campaign.id]);
  const fetchMap = async () => {
    const { data } = await supabase.from('campaigns').select('map_url').eq('id', campaign.id).single();
    if (data?.map_url) setMapFilename(data.map_url);
  };
  const attemptUnlock = () => {
    if (password.trim() === DM_PASSWORD) { setUnlocked(true); setPwError(false); }
    else { setPwError(true); setTimeout(() => setPwError(false), 2000); }
  };
  const saveMap = async () => {
    if (!selectedFilename) return;
    setSaving(true);
    await supabase.from('campaigns').update({ map_url: selectedFilename }).eq('id', campaign.id);
    await supabase.from('vtt_sessions').upsert({ campaign_id: String(campaign.id), map_filename: selectedFilename }, { onConflict: 'campaign_id' });
    setMapFilename(selectedFilename); setSaving(false); setDmOpen(false); setUnlocked(false); setPassword(''); setSelectedFilename(''); setSearch('');
  };
  const filtered = LOCATIONS.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  const activeLocation = LOCATIONS.find(l => l.filename === mapFilename);

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Campaign Map</div>
      {mapFilename ? (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <img src={`/Maps/${encodeURIComponent(mapFilename)}`} alt="Campaign map" style={{ width: '100%', borderRadius: 8, border: `1px solid ${COLORS.border}`, display: 'block' }} />
          {activeLocation && (
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 14px 10px', background: 'linear-gradient(transparent, rgba(10,8,6,0.8))', borderRadius: '0 0 8px 8px', pointerEvents: 'none' }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: '#e8c84a', letterSpacing: '0.1em' }}>{activeLocation.name}</div>
            </div>
          )}
          <button onClick={() => setFullscreen(true)} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(10,8,6,0.7)', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>⛶ Expand</button>
        </div>
      ) : (
        <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '52px 20px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>🗺</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>No map set</div>
        </div>
      )}
      {fullscreen && mapFilename && (
        <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          {activeLocation && <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.12em', marginBottom: 16 }}>{activeLocation.name}</div>}
          <img src={`/Maps/${encodeURIComponent(mapFilename)}`} alt="map" style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', borderRadius: 8, objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <div style={{ marginTop: 14, fontSize: 9, color: 'rgba(240,238,235,0.3)', fontFamily: "'Cinzel', serif" }}>Click outside to close</div>
        </div>
      )}
      <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div onClick={() => { setDmOpen(o => !o); setUnlocked(false); setPassword(''); setPwError(false); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: COLORS.surface, cursor: 'pointer', userSelect: 'none' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.dim }}>⚙ DM — Set Map</div>
          <div style={{ fontSize: 10, color: COLORS.dim, transform: dmOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
        </div>
        {dmOpen && (
          <div style={{ padding: 14, background: COLORS.wizard, borderTop: `1px solid ${COLORS.border}` }}>
            {!unlocked ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && attemptUnlock()} placeholder="DM password…" style={{ flex: 1, background: COLORS.card, border: `1px solid ${pwError ? '#ef4444' : COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }} />
                <button onClick={attemptUnlock} style={{ background: COLORS.surface, border: `1px solid ${COLORS.borderMid}`, borderRadius: 6, padding: '8px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.text }}>Enter</button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 9, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>✓ Unlocked</div>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search locations…" style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                  {filtered.map(loc => (
                    <button key={loc.id} onClick={() => setSelectedFilename(loc.filename)} style={{ textAlign: 'left', background: loc.filename === selectedFilename ? 'rgba(200,168,74,0.12)' : COLORS.card, border: `1px solid ${loc.filename === selectedFilename ? '#c8a84a88' : COLORS.border}`, borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: loc.filename === selectedFilename ? '#e8c84a' : COLORS.text }}>{loc.name}</button>
                  ))}
                </div>
                <button onClick={saveMap} disabled={saving || !selectedFilename} style={{ width: '100%', background: selectedFilename ? 'rgba(200,168,74,0.15)' : 'transparent', border: `1px solid ${selectedFilename ? '#c8a84a' : COLORS.border}`, borderRadius: 6, padding: '10px 0', cursor: selectedFilename ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: selectedFilename ? '#e8c84a' : COLORS.dim, fontWeight: 700 }}>
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
                <div><div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: axisText(s.axis) }}>{s.label}</div><div style={{ fontSize: 8, color: COLORS.dim }}>{s.equiv}</div></div>
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

// ─── CAMPAIGN DASHBOARD ───────────────────────────────────────────────────────
const TABS = ['Map', 'Sheet', 'Actions', 'Roll', 'Combat', 'Log'];

function CampaignDashboard({ campaign, userChar, onBack, onAssign }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Map');
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const timer = useSessionTimer(campaign.id);

  const isAssigned = userChar?.campaign === String(campaign.id);
  const isApproved = userChar?.status === 'approved' && isAssigned;

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

  const renderTab = () => {
    switch (activeTab) {
      case 'Map': return <VTTViewer campaignId={String(campaign.id)} userChar={userChar} />;
      case 'Sheet': return userChar ? <CharacterSheetInline char={userChar} /> : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;
      case 'Actions': return userChar ? (
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
      ) : <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12 }}>No character loaded.</div>;

      case 'Roll': return (
        <div>
          <div style={{ ...label8(), marginBottom: 16 }}>Astragal — Fate Cast in Bone</div>
          <Astragal character={userChar} actionName="Astragal Roll" statKey="will" />
        </div>
      );

      case 'Combat': return (
        <div>
          <div style={{ ...label8(), marginBottom: 12 }}>HERCULES — Combat Tracker</div>
          <HerculesLite campaignId={String(campaign.id)} char={userChar} />
        </div>
      );

      case 'Log': return (
        <div>
          <div style={{ ...label8(), marginBottom: 12 }}>Session Log</div>
          <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No session logs yet. The Scribe will write here.</div>
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
          <div style={{ fontSize: 8, color: timer ? COLORS.magic : COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: timer ? 700 : 400 }}>
            {timer ? `⏱ ${timer}` : (FULL_TITLES[campaign.id] || campaign.name)}
          </div>
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
          {!isAssigned && userChar && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Assign your character to this campaign</div>
              <button onClick={handleAssign} disabled={assigning} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 18px', cursor: assigning ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700, opacity: assigning ? 0.6 : 1 }}>
                {assigning ? 'Joining…' : `✦ Join ${campaign.name}`}
              </button>
            </div>
          )}
          {renderTab()}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CampaignView({ userChar, onHome, onAssign }) {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  if (selectedCampaign) {
    return <CampaignDashboard campaign={selectedCampaign} userChar={userChar} onBack={() => setSelectedCampaign(null)} onAssign={onAssign} />;
  }
  return <CampaignList onSelect={setSelectedCampaign} userChar={userChar} onHome={onHome} />;
}
