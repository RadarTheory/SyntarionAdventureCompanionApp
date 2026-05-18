// ═══════════════════════════════════════════════════════════════════════════
//  NPCPanel.jsx — Syntarion | DM NPC Tracker
//  Renders inside DraggablePanel in DMView.jsx
//  Data source: src/data/npcs.js
//
//  CENSUS INTEGRATION:
//    Broadcasts full NPC snapshot on mount + on any change via:
//      window.dispatchEvent(new CustomEvent('census:npc_snapshot', { detail: { npcs } }))
//    Listens for Census condition updates via:
//      window.addEventListener('census:npc_conditions', ...)
//    Listens for Census snapshot requests via:
//      window.addEventListener('census:request_snapshot', ...)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { DEFAULT_CITIES, newNpcId, newCityId } from './data/npcs';
import supabase from './lib/supabase';

// ── Conditions ───────────────────────────────────────────────────────────────
const CONDITIONS = [
  'Alive', 'Dead', 'Dying', 'Unconscious', 'Asleep', 'Awake',
  'Injured', 'Wounded', 'Bleeding', 'Poisoned', 'Diseased', 'Cursed',
  'Blessed', 'Charmed', 'Frightened', 'Confused', 'Stunned', 'Paralyzed',
  'Restrained', 'Grappled', 'Prone', 'Hidden', 'Invisible', 'Disguised',
  'Blinded', 'Deafened', 'Muted', 'Exhausted', 'Hungry', 'Thirsty',
  'Drunk', 'Drugged', 'Possessed', 'Haunted', 'Enraged', 'Calm',
  'Hostile', 'Friendly', 'Neutral', 'Suspicious', 'Afraid', 'Loyal',
  'Betrayed', 'Wanted', 'Imprisoned', 'Captured', 'Missing', 'Traveling',
  'Guarding', 'Working', 'Resting', 'Fleeing', 'Hiding', 'Following',
  'Tracking', 'Hunted', 'Protected', 'Marked', 'Banished', 'Exiled',
  'Transformed', 'Polymorphed', 'Magically Bound', 'Oathbound',
  'Debt-Bound', 'Faction-Aligned', 'Faction-Enemy', 'Undercover', 'Unknown',
];

const CONDITION_COLORS = {
  Dead: '#e05a5a', Dying: '#e06060', Unconscious: '#c06060',
  Injured: '#e08a5a', Wounded: '#e07a5a', Bleeding: '#e05a5a',
  Poisoned: '#80c060', Diseased: '#a0b040', Exhausted: '#b09060',
  Hungry: '#c09050', Thirsty: '#c09050', Paralyzed: '#9080c0',
  Stunned: '#9080c0', Prone: '#808090', Restrained: '#9070a0',
  Grappled: '#9070a0', Cursed: '#c060c0', Blessed: '#e8c040',
  Charmed: '#e080c0', Possessed: '#a040e0', Haunted: '#8050c0',
  Transformed: '#60a0e0', Polymorphed: '#60a0e0',
  'Magically Bound': '#a060e0', Oathbound: '#c0a040',
  'Debt-Bound': '#c08040', Invisible: '#80b0c0',
  Blinded: '#808090', Deafened: '#808090', Muted: '#808090',
  Frightened: '#e08060', Confused: '#c0a060', Enraged: '#e04040',
  Calm: '#60c090', Drunk: '#e0c060', Drugged: '#a0c060',
  Hostile: '#e05050', Friendly: '#60e090', Neutral: '#909090',
  Suspicious: '#c0a040', Afraid: '#e09060', Loyal: '#60b0e0',
  Betrayed: '#e06060', Wanted: '#e08040', Imprisoned: '#c06060',
  Captured: '#c06060', Missing: '#e0b040', Traveling: '#60c0e0',
  Guarding: '#6090d0', Working: '#b0a060', Resting: '#70b090',
  Fleeing: '#e09050', Hiding: '#909070', Following: '#60b0c0',
  Tracking: '#70a060', Hunted: '#e06050', Protected: '#60d080',
  Marked: '#e0a040', Banished: '#a06080', Exiled: '#a06080',
  'Faction-Aligned': '#60a0e0', 'Faction-Enemy': '#e06060',
  Undercover: '#a0b060', Alive: '#60e060', Awake: '#90d0a0',
  Disguised: '#b0a070', Hidden: '#909070', Unknown: '#808090',
};
const condColor = c => CONDITION_COLORS[c] || '#909090';

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['Active', 'Deceased', 'Missing', 'Unknown', 'Imprisoned', 'Wanted'];

const CATEGORY_OPTIONS = [
  'Uncategorized', 'Merchants', 'Guards', 'Nobility', 'Clergy', 'Criminals',
  'Scholars', 'Adventurers', 'Military', 'Mystics', 'Laborers', 'Vagrants',
  'Nomadic', 'Working Class',
];

const STATUS_COLORS = {
  Active: '#60e060', Deceased: '#e06060', Missing: '#e0b040',
  Unknown: '#8090a0', Imprisoned: '#c060e0', Wanted: '#e08040',
};
const sc = s => STATUS_COLORS[s] || '#8090a0';

const CATEGORY_COLORS = {
  Merchants: '#e8a040', Guards: '#6090d0', Nobility: '#c060c0',
  Clergy: '#e0e060', Criminals: '#e06060', Scholars: '#40c0c0',
  Adventurers: '#60e060', Military: '#8090a0', Mystics: '#a060e0',
  Laborers: '#c0a060', Vagrants: '#908070', Nomadic: '#70b090',
  'Working Class': '#b0a080', Uncategorized: '#504840',
};
const cc = c => CATEGORY_COLORS[c] || CATEGORY_COLORS.Uncategorized;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: '#0e0c09', color: '#c8b890',
    fontFamily: "'Crimson Pro', 'Georgia', serif",
    fontSize: 13, overflow: 'hidden', position: 'relative',
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 10px', borderBottom: '1px solid rgba(184,137,42,0.2)',
    flexShrink: 0,
  },
  searchInput: {
    flex: 1, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(184,137,42,0.25)',
    borderRadius: 3, color: '#c8b890', padding: '4px 8px',
    fontFamily: 'inherit', fontSize: 12, outline: 'none',
  },
  btnGold: {
    background: 'rgba(184,137,42,0.18)', border: '1px solid rgba(184,137,42,0.35)',
    borderRadius: 3, color: '#e8c040', cursor: 'pointer',
    padding: '5px 10px', fontSize: 11, fontFamily: "'Cinzel', serif",
    letterSpacing: '0.08em', whiteSpace: 'nowrap',
  },
  btnGrey: {
    background: 'rgba(100,100,90,0.15)', border: '1px solid rgba(150,140,120,0.25)',
    borderRadius: 3, color: 'rgba(200,190,160,0.6)', cursor: 'pointer',
    padding: '5px 10px', fontSize: 11, fontFamily: "'Cinzel', serif",
    letterSpacing: '0.06em', whiteSpace: 'nowrap',
  },
  quickInput: {
    flex: 1, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(184,137,42,0.18)',
    borderRadius: 3, color: '#c8b890', padding: '3px 6px',
    fontFamily: 'inherit', fontSize: 12, outline: 'none',
  },
  quickBtn: {
    background: 'rgba(184,137,42,0.18)', border: '1px solid rgba(184,137,42,0.3)',
    borderRadius: 3, color: '#e8c040', cursor: 'pointer',
    padding: '3px 7px', fontSize: 11,
  },
  scroll: { flex: 1, overflowY: 'auto', padding: '2px 0' },
  cityBlock: { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  cityHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 10px', cursor: 'pointer',
    background: 'rgba(184,137,42,0.07)', userSelect: 'none',
  },
  cityChevron: { fontSize: 9, color: 'rgba(184,137,42,0.5)', width: 10 },
  cityName: {
    fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.1em',
    color: '#e8c040', flex: 1,
  },
  cityRegion: { fontSize: 10, color: 'rgba(200,180,130,0.3)', fontStyle: 'italic' },
  cityCount: { fontSize: 10, color: 'rgba(184,137,42,0.45)' },
  catBlock: { borderTop: '1px solid rgba(255,255,255,0.03)' },
  catHeader: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 10px 4px 18px', cursor: 'pointer', userSelect: 'none',
  },
  catChevron: { fontSize: 8, width: 10, color: 'rgba(184,137,42,0.3)' },
  catPip: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  catName: {
    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em',
    textTransform: 'uppercase', flex: 1,
  },
  catCount: { fontSize: 9, color: 'rgba(184,137,42,0.4)' },
  groupBlock: { borderTop: '1px solid rgba(255,255,255,0.02)', marginLeft: 10 },
  groupHeader: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '3px 10px 3px 16px', cursor: 'pointer', userSelect: 'none',
    background: 'rgba(255,255,255,0.02)',
  },
  groupChevron: { fontSize: 7, width: 8, color: 'rgba(184,137,42,0.25)' },
  groupName: {
    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em',
    color: 'rgba(200,180,130,0.6)', flex: 1, fontStyle: 'italic',
  },
  groupCount: { fontSize: 9, color: 'rgba(184,137,42,0.3)' },
  npcRow: {
    display: 'flex', alignItems: 'flex-start', gap: 6,
    padding: '5px 10px 5px 28px',
    borderBottom: '1px solid rgba(255,255,255,0.02)', cursor: 'pointer',
  },
  npcRowIndented: {
    display: 'flex', alignItems: 'flex-start', gap: 6,
    padding: '4px 10px 4px 36px',
    borderBottom: '1px solid rgba(255,255,255,0.015)', cursor: 'pointer',
  },
  npcDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4 },
  npcMain: { flex: 1, minWidth: 0 },
  npcName: { fontWeight: 600, color: '#ddd0b0', fontSize: 13 },
  npcRole: { color: 'rgba(200,180,130,0.5)', fontSize: 11, fontStyle: 'italic' },
  npcFaction: { color: 'rgba(184,137,42,0.55)', fontSize: 10 },
  npcStatus: { fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em', flexShrink: 0 },
  drawer: {
    borderTop: '1px solid rgba(184,137,42,0.2)',
    background: '#0a0805', padding: '10px 12px',
    flexShrink: 0, maxHeight: '48%', overflowY: 'auto',
  },
  drawerTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c040',
    letterSpacing: '0.1em', marginBottom: 8,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  closeBtn: {
    background: 'none', border: 'none', color: 'rgba(200,180,130,0.4)',
    cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0,
  },
  field: { marginBottom: 7 },
  label: {
    fontSize: 10, color: 'rgba(184,137,42,0.55)', letterSpacing: '0.1em',
    fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
    display: 'block', marginBottom: 2,
  },
  fieldInput: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(184,137,42,0.2)',
    borderRadius: 3, color: '#c8b890', padding: '4px 7px',
    fontFamily: 'inherit', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  },
  fieldSelect: {
    width: '100%', background: '#0e0c09',
    border: '1px solid rgba(184,137,42,0.2)',
    borderRadius: 3, color: '#c8b890', padding: '4px 7px',
    fontFamily: 'inherit', fontSize: 12, outline: 'none', boxSizing: 'border-box',
  },
  fieldTextarea: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(184,137,42,0.2)',
    borderRadius: 3, color: '#c8b890', padding: '4px 7px',
    fontFamily: 'inherit', fontSize: 12, outline: 'none',
    resize: 'vertical', minHeight: 56, boxSizing: 'border-box',
  },
  deleteBtn: {
    background: 'rgba(200,60,60,0.15)', border: '1px solid rgba(200,60,60,0.3)',
    borderRadius: 3, color: '#e06060', cursor: 'pointer',
    padding: '3px 8px', fontSize: 11,
  },
  modal: {
    position: 'absolute', inset: 0, background: 'rgba(8,6,4,0.96)',
    display: 'flex', flexDirection: 'column', zIndex: 20,
    padding: '14px', overflowY: 'auto',
  },
  modalTitle: {
    fontFamily: "'Cinzel', serif", fontSize: 12, color: '#e8c040',
    letterSpacing: '0.12em', marginBottom: 10,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  modalBtnRow: { display: 'flex', gap: 8, marginTop: 8 },
  modalConfirm: {
    flex: 1, background: 'rgba(60,180,60,0.2)', border: '1px solid rgba(60,180,60,0.4)',
    borderRadius: 3, color: '#80e080', cursor: 'pointer',
    padding: '7px', fontSize: 12, fontFamily: "'Cinzel', serif",
  },
  modalCancel: {
    background: 'none', border: '1px solid rgba(200,130,130,0.3)',
    borderRadius: 3, color: 'rgba(200,130,130,0.7)', cursor: 'pointer',
    padding: '7px 12px', fontSize: 12,
  },
  suggestTray: {
    borderBottom: '1px solid rgba(184,137,42,0.2)',
    background: 'rgba(60,100,60,0.12)', padding: '6px 10px', flexShrink: 0,
  },
  suggestLabel: {
    fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.15em',
    color: 'rgba(96,200,96,0.7)', textTransform: 'uppercase', marginBottom: 5,
  },
  suggestCard: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(96,200,96,0.2)',
    borderRadius: 3, padding: '5px 8px', marginBottom: 4,
  },
  suggestInfo: { flex: 1, minWidth: 0 },
  suggestName: { color: '#c8e0c0', fontWeight: 600, fontSize: 13 },
  suggestMeta: { color: 'rgba(180,200,160,0.5)', fontSize: 11, fontStyle: 'italic' },
  suggestAccept: {
    background: 'rgba(60,180,60,0.2)', border: '1px solid rgba(60,180,60,0.4)',
    borderRadius: 3, color: '#80e080', cursor: 'pointer',
    padding: '3px 7px', fontSize: 11, whiteSpace: 'nowrap',
  },
  suggestDismiss: {
    background: 'none', border: 'none', color: 'rgba(200,130,130,0.5)',
    cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: '2px 4px',
  },
};

const EMPTY_FORM = {
  name: '', role: '', status: 'Active',
  category: 'Uncategorized', group: '', faction: '', notes: '',
  cityId: 'unassigned',
};

// ── Helper: flatten all NPCs for Census broadcast ─────────────────────────────
function flattenNpcs(cities) {
  const result = [];
  cities.forEach(city => {
    (city.npcs || []).forEach(npc => {
      result.push({
        id: npc.id,
        name: npc.name,
        meta: [npc.role, city.name].filter(Boolean).join(' · '),
        conditions: npc.conditions || [],
      });
    });
  });
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
export default function NPCPanel() {
  const [cities, setCities]             = useState(() => JSON.parse(JSON.stringify(DEFAULT_CITIES)));
  const [collapsed, setCollapsed]       = useState({});
  const [catCollapsed, setCatCollapsed] = useState({});
  const [grpCollapsed, setGrpCollapsed] = useState({});
  const [search, setSearch]             = useState('');
  const [selected, setSelected]         = useState(null);
  const [showModal, setShowModal]       = useState(false);
  const [modalMode, setModalMode]       = useState('npc');
  const [modalForm, setModalForm]       = useState(EMPTY_FORM);
  const [newGroupForm, setNewGroupForm] = useState({ cityId: '', category: 'Uncategorized', name: '' });
  const [suggestions, setSuggestions]   = useState([]);
  const [activeTab, setActiveTab]       = useState('npcs'); // 'npcs' | 'census'
  const [players, setPlayers]           = useState([]);
  const [condPicker, setCondPicker]     = useState(null);
  const [condSearch, setCondSearch]     = useState('');

  const modalNameRef = useRef(null);
  useEffect(() => { if (showModal && modalNameRef.current) modalNameRef.current.focus(); }, [showModal]);

  // ── Broadcast snapshot to Census whenever cities change ──────────────────
  const broadcast = useCallback((updatedCities) => {
    window.dispatchEvent(new CustomEvent('census:npc_snapshot', {
      detail: { npcs: flattenNpcs(updatedCities) },
    }));
  }, []);

  useEffect(() => { broadcast(cities); }, [cities, broadcast]);

  // ── Listen for Census snapshot request ───────────────────────────────────
  useEffect(() => {
    const h = () => broadcast(cities);
    window.addEventListener('census:request_snapshot', h);
    return () => window.removeEventListener('census:request_snapshot', h);
  }, [cities, broadcast]);

  // ── Listen for Census condition updates ──────────────────────────────────
  useEffect(() => {
    const h = e => {
      const { id, conditions } = e.detail || {};
      if (!id) return;
      setCities(prev => prev.map(city => ({
        ...city,
        npcs: city.npcs.map(n => n.id === id ? { ...n, conditions } : n),
      })));
    };
    window.addEventListener('census:npc_conditions', h);
    return () => window.removeEventListener('census:npc_conditions', h);
  }, []);

  // ── Scribe listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const h = e => {
      const s = e.detail;
      if (!s?.name) return;
      setSuggestions(p => [...p, { ...s, _id: `${Date.now()}_${Math.random()}` }]);
    };
    window.addEventListener('npc:suggest', h);
    return () => window.removeEventListener('npc:suggest', h);
  }, []);

  // ── Load players from Supabase (for Census tab) ──────────────────────────
  useEffect(() => {
    if (activeTab !== 'census') return;
    supabase.from('characters').select('id, name, race, data, campaign_id').order('name')
      .then(({ data }) => {
        if (!data) return;
        setPlayers(data.map(c => {
          const d = typeof c.data === 'string' ? JSON.parse(c.data || '{}') : (c.data || {});
          return { id: String(c.id), name: c.name || 'Unnamed', race: c.race || '', campaign: c.campaign_id || '', conditions: Array.isArray(d.conditions) ? d.conditions : [] };
        }));
      });
  }, [activeTab]);

  const savePlayerConditions = async (playerId, newConds) => {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, conditions: newConds } : p));
    const { data: row } = await supabase.from('characters').select('data').eq('id', playerId).maybeSingle();
    const existing = typeof row?.data === 'string' ? JSON.parse(row.data || '{}') : (row?.data || {});
    await supabase.from('characters').update({ data: { ...existing, conditions: newConds } }).eq('id', playerId);
  };

  const toggleNpcCondition = (cityId, npcId, cond) => {
    setCities(prev => prev.map(city =>
      city.id !== cityId ? city : {
        ...city,
        npcs: city.npcs.map(n => {
          if (n.id !== npcId) return n;
          const cur = n.conditions || [];
          return { ...n, conditions: cur.includes(cond) ? cur.filter(c => c !== cond) : [...cur, cond] };
        }),
      }
    ));
  };

  const togglePlayerCondition = (playerId, cond) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    const cur = player.conditions || [];
    savePlayerConditions(playerId, cur.includes(cond) ? cur.filter(c => c !== cond) : [...cur, cond]);
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  const toggleCity = id  => setCollapsed(c => ({ ...c, [id]: !c[id] }));
  const toggleCat  = key => setCatCollapsed(c => ({ ...c, [key]: !c[key] }));
  const toggleGrp  = key => setGrpCollapsed(c => ({ ...c, [key]: !c[key] }));

  const addCity = name => {
    if (!name.trim()) return;
    const city = { id: newCityId(), name: name.trim(), region: '', npcs: [], groups: [] };
    setCities(prev => {
      const idx = prev.findIndex(c => c.id === 'unassigned');
      const next = [...prev];
      next.splice(idx === -1 ? next.length : idx, 0, city);
      return next;
    });
  };

  const addGroup = () => {
    const { cityId, category, name } = newGroupForm;
    if (!name.trim()) return;
    setCities(prev => prev.map(c => {
      if (c.id !== cityId) return c;
      return { ...c, groups: [...(c.groups || []), { id: newNpcId(), name: name.trim(), category }] };
    }));
    setNewGroupForm(f => ({ ...f, name: '' }));
    setShowModal(false);
  };

  const updateNpc = (cityId, npcId, field, value) =>
    setCities(prev => prev.map(city =>
      city.id !== cityId ? city : {
        ...city,
        npcs: city.npcs.map(n => n.id !== npcId ? n : { ...n, [field]: value }),
      }
    ));

  const deleteNpc = (cityId, npcId) => {
    setCities(prev => prev.map(city =>
      city.id !== cityId ? city : { ...city, npcs: city.npcs.filter(n => n.id !== npcId) }
    ));
    setSelected(null);
  };

  const addNpcFromModal = () => {
    const { name, role, status, category, group, faction, notes, cityId } = modalForm;
    if (!name.trim()) return;
    const npc = {
      id: newNpcId(), name: name.trim(), role, status,
      category: category || 'Uncategorized',
      group: group || '', faction, notes,
      conditions: [],
    };
    setCities(prev => prev.map(c => c.id === cityId ? { ...c, npcs: [...c.npcs, npc] } : c));
    setCollapsed(c => ({ ...c, [cityId]: false }));
    setSelected({ cityId, npcId: npc.id });
    setShowModal(false);
    setModalForm(EMPTY_FORM);
  };

  const openNpcModal  = (prefill = {}) => { setModalForm({ ...EMPTY_FORM, ...prefill }); setModalMode('npc');   setShowModal(true); };
  const openGroupModal = (cityId, category = 'Uncategorized') => { setNewGroupForm({ cityId, category, name: '' }); setModalMode('group'); setShowModal(true); };
  const openCityModal  = () => { setModalForm({ ...EMPTY_FORM, _cityName: '' }); setModalMode('city');  setShowModal(true); };

  const acceptSuggestion = s => {
    const matchCity = cities.find(c => s.city && c.name.toLowerCase().includes((s.city || '').toLowerCase()));
    openNpcModal({ name: s.name || '', role: s.role || '', category: s.category || 'Uncategorized', faction: s.faction || '', notes: s.notes || '', cityId: matchCity ? matchCity.id : 'unassigned' });
    setSuggestions(p => p.filter(x => x._id !== s._id));
  };

  const groupsForCityCat = (city, cat) => (city.groups || []).filter(g => g.category === cat);

  const q = search.toLowerCase().trim();
  const filtered = useMemo(() => {
    if (!q) return cities;
    return cities
      .map(city => {
        const cityMatch = city.name.toLowerCase().includes(q) || (city.region || '').toLowerCase().includes(q);
        const matchedNpcs = cityMatch ? city.npcs : city.npcs.filter(n =>
          n.name.toLowerCase().includes(q) || (n.role || '').toLowerCase().includes(q) ||
          (n.faction || '').toLowerCase().includes(q) || (n.category || '').toLowerCase().includes(q) ||
          (n.group || '').toLowerCase().includes(q) || (n.notes || '').toLowerCase().includes(q)
        );
        return { ...city, npcs: matchedNpcs };
      })
      .filter(city => city.npcs.length > 0);
  }, [cities, q]);

  const groupByCategory = npcs => {
    const groups = {};
    npcs.forEach(npc => { const cat = npc.category || 'Uncategorized'; if (!groups[cat]) groups[cat] = []; groups[cat].push(npc); });
    return Object.entries(groups).sort(([a], [b]) => {
      const ai = CATEGORY_OPTIONS.indexOf(a), bi = CATEGORY_OPTIONS.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1; if (bi === -1) return -1;
      return ai - bi;
    });
  };

  const groupNpcsByGroup = npcs => {
    const g = {};
    npcs.forEach(n => { const grp = n.group || ''; if (!g[grp]) g[grp] = []; g[grp].push(n); });
    return g;
  };

  const selectedCity = selected ? cities.find(c => c.id === selected.cityId) : null;
  const selectedNpc  = selectedCity ? selectedCity.npcs.find(n => n.id === selected.npcId) : null;
  const modalCity    = cities.find(c => c.id === modalForm.cityId);
  const modalGroups  = modalCity ? (modalCity.groups || []).filter(g => g.category === modalForm.category) : [];

  return (
    <div style={S.root}>

      {/* ══ Modal ══ */}
      {showModal && (
        <div style={S.modal}>
          {modalMode === 'npc' && (
            <>
              <div style={S.modalTitle}>
                <span>ADD NPC</span>
                <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div style={S.field}>
                <label style={S.label}>Name</label>
                <input ref={modalNameRef} style={S.fieldInput} value={modalForm.name}
                  onChange={e => setModalForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="NPC name…" onKeyDown={e => e.key === 'Enter' && addNpcFromModal()} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ ...S.field, flex: 2 }}>
                  <label style={S.label}>Role / Title</label>
                  <input style={S.fieldInput} value={modalForm.role}
                    onChange={e => setModalForm(f => ({ ...f, role: e.target.value }))} placeholder="Role or title…" />
                </div>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>Status</label>
                  <select style={S.fieldSelect} value={modalForm.status}
                    onChange={e => setModalForm(f => ({ ...f, status: e.target.value }))}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: '#0e0c09' }}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>City</label>
                  <select style={S.fieldSelect} value={modalForm.cityId}
                    onChange={e => setModalForm(f => ({ ...f, cityId: e.target.value, group: '' }))}>
                    {cities.map(c => <option key={c.id} value={c.id} style={{ background: '#0e0c09' }}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>Category</label>
                  <select style={S.fieldSelect} value={modalForm.category}
                    onChange={e => setModalForm(f => ({ ...f, category: e.target.value, group: '' }))}>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c} style={{ background: '#0e0c09' }}>{c}</option>)}
                  </select>
                </div>
              </div>
              {modalGroups.length > 0 && (
                <div style={S.field}>
                  <label style={S.label}>Group (optional)</label>
                  <select style={S.fieldSelect} value={modalForm.group}
                    onChange={e => setModalForm(f => ({ ...f, group: e.target.value }))}>
                    <option value="" style={{ background: '#0e0c09' }}>— No group —</option>
                    {modalGroups.map(g => <option key={g.id} value={g.name} style={{ background: '#0e0c09' }}>{g.name}</option>)}
                  </select>
                </div>
              )}
              <div style={S.field}>
                <label style={S.label}>Faction</label>
                <input style={S.fieldInput} value={modalForm.faction}
                  onChange={e => setModalForm(f => ({ ...f, faction: e.target.value }))} placeholder="Faction or affiliation…" />
              </div>
              <div style={S.field}>
                <label style={S.label}>Notes</label>
                <textarea style={{ ...S.fieldTextarea, minHeight: 56 }} value={modalForm.notes}
                  onChange={e => setModalForm(f => ({ ...f, notes: e.target.value }))} placeholder="DM notes…" />
              </div>
              <div style={S.modalBtnRow}>
                <button style={S.modalConfirm} onClick={addNpcFromModal}>✓ Add NPC</button>
                <button style={S.modalCancel} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </>
          )}

          {modalMode === 'city' && (
            <>
              <div style={S.modalTitle}>
                <span>ADD CITY</span>
                <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div style={S.field}>
                <label style={S.label}>City Name</label>
                <input ref={modalNameRef} style={S.fieldInput} value={modalForm._cityName || ''}
                  onChange={e => setModalForm(f => ({ ...f, _cityName: e.target.value }))}
                  placeholder="City name…"
                  onKeyDown={e => { if (e.key === 'Enter') { addCity(modalForm._cityName || ''); setShowModal(false); } }} />
              </div>
              <div style={S.modalBtnRow}>
                <button style={S.modalConfirm} onClick={() => { addCity(modalForm._cityName || ''); setShowModal(false); }}>✓ Add City</button>
                <button style={S.modalCancel} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </>
          )}

          {modalMode === 'group' && (
            <>
              <div style={S.modalTitle}>
                <span>ADD GROUP / FACTION</span>
                <button style={S.closeBtn} onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(200,180,130,0.45)', fontStyle: 'italic', marginBottom: 10 }}>
                Groups appear as sub-folders inside a category.
              </div>
              <div style={S.field}>
                <label style={S.label}>Group Name</label>
                <input ref={modalNameRef} style={S.fieldInput} value={newGroupForm.name}
                  onChange={e => setNewGroupForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. The Orphaned, Auric Order, City Watch…"
                  onKeyDown={e => e.key === 'Enter' && addGroup()} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>City</label>
                  <select style={S.fieldSelect} value={newGroupForm.cityId}
                    onChange={e => setNewGroupForm(f => ({ ...f, cityId: e.target.value }))}>
                    {cities.map(c => <option key={c.id} value={c.id} style={{ background: '#0e0c09' }}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ ...S.field, flex: 1 }}>
                  <label style={S.label}>Category</label>
                  <select style={S.fieldSelect} value={newGroupForm.category}
                    onChange={e => setNewGroupForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c} style={{ background: '#0e0c09' }}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div style={S.modalBtnRow}>
                <button style={S.modalConfirm} onClick={addGroup}>✓ Add Group</button>
                <button style={S.modalCancel} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ Toolbar ══ */}
      <div style={S.toolbar}>
        <input style={S.searchInput} placeholder="Search NPCs or cities…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <button style={S.btnGold} onClick={() => openNpcModal()}>+ NPC</button>
        <button style={S.btnGrey} onClick={() => openGroupModal('unassigned')}>+ Group</button>
        <button style={S.btnGrey} onClick={openCityModal}>+ City</button>
      </div>


      {/* ══ Tab Bar ══ */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(184,137,42,0.15)', flexShrink: 0 }}>
        {[['npcs', 'NPCs'], ['census', 'Census']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{
            flex: 1, padding: '7px 0', cursor: 'pointer',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em',
            textTransform: 'uppercase', border: 'none',
            borderBottom: activeTab === id ? '2px solid #e8c040' : '2px solid transparent',
            background: 'transparent',
            color: activeTab === id ? '#e8c040' : 'rgba(200,180,130,0.4)',
          }}>{label}</button>
        ))}
      </div>

      {activeTab === 'npcs' && (
        <>
      {/* ══ Scribe Suggestions ══ */}
      {suggestions.length > 0 && (
        <div style={S.suggestTray}>
          <div style={S.suggestLabel}>⚑ Scribe Suggestions</div>
          {suggestions.map(s => (
            <div key={s._id} style={S.suggestCard}>
              <div style={S.suggestInfo}>
                <div style={S.suggestName}>{s.name}</div>
                <div style={S.suggestMeta}>{[s.role, s.city].filter(Boolean).join(' · ')}</div>
              </div>
              <button style={S.suggestAccept} onClick={() => acceptSuggestion(s)}>+ Add</button>
              <button style={S.suggestDismiss} onClick={() => setSuggestions(p => p.filter(x => x._id !== s._id))}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ══ City / Category / Group / NPC list ══ */}
      <div style={S.scroll}>
        {filtered.map(city => {
          const isCollapsed = collapsed[city.id];
          const catGroups   = groupByCategory(city.npcs);
          return (
            <div key={city.id} style={S.cityBlock}>
              <div style={S.cityHeader} onClick={() => toggleCity(city.id)}>
                <span style={S.cityChevron}>{isCollapsed ? '▶' : '▼'}</span>
                <span style={S.cityName}>{city.name}</span>
                {city.region && <span style={S.cityRegion}>{city.region}</span>}
                <span style={S.cityCount}>{city.npcs.length}</span>
              </div>

              {!isCollapsed && (
                <>
                  {catGroups.length === 0 && (
                    <div style={{ padding: '5px 28px', color: 'rgba(200,180,130,0.2)', fontSize: 11, fontStyle: 'italic' }}>No NPCs yet</div>
                  )}
                  {catGroups.map(([cat, npcs]) => {
                    const catKey    = `${city.id}__${cat}`;
                    const isCatColl = catCollapsed[catKey];
                    const color     = cc(cat);
                    const byGroup   = groupNpcsByGroup(npcs);
                    const cityGroups = groupsForCityCat(city, cat);
                    const allGroupNames = [...new Set([...cityGroups.map(g => g.name), ...Object.keys(byGroup).filter(k => k !== '')])];
                    const ungrouped = byGroup[''] || [];

                    return (
                      <div key={cat} style={S.catBlock}>
                        <div style={S.catHeader} onClick={() => toggleCat(catKey)}>
                          <span style={S.catChevron}>{isCatColl ? '▶' : '▼'}</span>
                          <div style={{ ...S.catPip, background: color }} />
                          <span style={{ ...S.catName, color }}>{cat}</span>
                          <span style={S.catCount}>{npcs.length}</span>
                        </div>

                        {!isCatColl && (
                          <>
                            {allGroupNames.map(grpName => {
                              const grpKey    = `${catKey}__${grpName}`;
                              const isGrpColl = grpCollapsed[grpKey];
                              const grpNpcs   = byGroup[grpName] || [];
                              return (
                                <div key={grpName} style={S.groupBlock}>
                                  <div style={S.groupHeader} onClick={() => toggleGrp(grpKey)}>
                                    <span style={S.groupChevron}>{isGrpColl ? '▶' : '▼'}</span>
                                    <span style={S.groupName}>📁 {grpName}</span>
                                    <span style={S.groupCount}>{grpNpcs.length}</span>
                                    <button style={{ ...S.quickBtn, fontSize: 9, padding: '1px 5px', marginLeft: 4 }}
                                      onClick={e => { e.stopPropagation(); openNpcModal({ cityId: city.id, category: cat, group: grpName }); }}>+</button>
                                  </div>
                                  {!isGrpColl && grpNpcs.map(npc => {
                                    const isActive = selected?.npcId === npc.id;
                                    return (
                                      <div key={npc.id}
                                        style={{ ...S.npcRowIndented, background: isActive ? 'rgba(184,137,42,0.09)' : undefined }}
                                        onClick={() => setSelected(isActive ? null : { cityId: city.id, npcId: npc.id })}>
                                        <div style={{ ...S.npcDot, background: sc(npc.status) }} />
                                        <div style={S.npcMain}>
                                          <div style={S.npcName}>{npc.name}</div>
                                          {npc.role    && <div style={S.npcRole}>{npc.role}</div>}
                                          {npc.faction && <div style={S.npcFaction}>{npc.faction}</div>}
                                        </div>
                                        <div style={{ ...S.npcStatus, color: sc(npc.status) }}>{npc.status}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}

                            {ungrouped.map(npc => {
                              const isActive = selected?.npcId === npc.id;
                              return (
                                <div key={npc.id}
                                  style={{ ...S.npcRow, background: isActive ? 'rgba(184,137,42,0.09)' : undefined }}
                                  onClick={() => setSelected(isActive ? null : { cityId: city.id, npcId: npc.id })}>
                                  <div style={{ ...S.npcDot, background: sc(npc.status) }} />
                                  <div style={S.npcMain}>
                                    <div style={S.npcName}>{npc.name}</div>
                                    {npc.role    && <div style={S.npcRole}>{npc.role}</div>}
                                    {npc.faction && <div style={S.npcFaction}>{npc.faction}</div>}
                                  </div>
                                  <div style={{ ...S.npcStatus, color: sc(npc.status) }}>{npc.status}</div>
                                </div>
                              );
                            })}

                            <div style={{ padding: '3px 18px 4px' }}>
                              <button style={{ ...S.btnGrey, fontSize: 9, padding: '2px 7px' }}
                                onClick={() => openGroupModal(city.id, cat)}>
                                + Add Group
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}
      </div>

        </>
      )}

      {/* ══ Census Tab ══ */}
      {activeTab === 'census' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Players */}
          <div style={{ padding: '6px 10px 3px', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(184,137,42,0.45)', textTransform: 'uppercase', borderBottom: '1px solid rgba(184,137,42,0.1)' }}>
            Players ({players.length})
          </div>
          {players.map(p => {
            const conds = p.conditions || [];
            return (
              <div key={p.id} style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#60e060', flexShrink: 0 }} />
                  <div style={{ fontWeight: 600, color: '#ddd0b0', fontSize: 13, flex: 1 }}>{p.name}</div>
                  {p.race && <div style={{ fontSize: 10, color: 'rgba(200,180,130,0.4)', fontStyle: 'italic' }}>{p.race}</div>}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5, marginLeft: 13 }}>
                  {conds.map(c => (
                    <div key={c} onClick={() => togglePlayerCondition(p.id, c)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: `${condColor(c)}18`, border: `1px solid ${condColor(c)}55`, borderRadius: 20, padding: '2px 7px', fontFamily: "'Cinzel', serif", fontSize: 9, color: condColor(c), cursor: 'pointer', letterSpacing: '0.04em' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: condColor(c) }} />
                      {c} <span style={{ opacity: 0.6, marginLeft: 2 }}>✕</span>
                    </div>
                  ))}
                  <button onClick={e => setCondPicker({ entityId: p.id, entityType: 'player', anchorRect: e.currentTarget.getBoundingClientRect() })}
                    style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(184,137,42,0.08)', border: '1px solid rgba(184,137,42,0.25)', borderRadius: 20, padding: '2px 7px', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c040', cursor: 'pointer', letterSpacing: '0.04em' }}>
                    + Add
                  </button>
                </div>
              </div>
            );
          })}
          {players.length === 0 && (
            <div style={{ padding: '16px', fontSize: 11, color: 'rgba(200,180,130,0.3)', fontStyle: 'italic', textAlign: 'center' }}>No characters found.</div>
          )}

          {/* NPCs */}
          <div style={{ padding: '6px 10px 3px', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', color: 'rgba(184,137,42,0.45)', textTransform: 'uppercase', borderBottom: '1px solid rgba(184,137,42,0.1)', borderTop: '1px solid rgba(184,137,42,0.1)', marginTop: 4 }}>
            NPCs
          </div>
          {cities.flatMap(city => city.npcs.map(npc => ({ ...npc, cityId: city.id, cityName: city.name }))).map(npc => {
            const conds = npc.conditions || [];
            return (
              <div key={npc.id} style={{ padding: '7px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#c8a860', flexShrink: 0 }} />
                  <div style={{ fontWeight: 600, color: '#ddd0b0', fontSize: 13, flex: 1 }}>{npc.name}</div>
                  <div style={{ fontSize: 9, fontFamily: "'Cinzel', serif", color: 'rgba(184,137,42,0.4)', letterSpacing: '0.06em' }}>{npc.cityName}</div>
                </div>
                {npc.role && <div style={{ fontSize: 11, color: 'rgba(200,180,130,0.4)', fontStyle: 'italic', marginLeft: 13 }}>{npc.role}</div>}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 5, marginLeft: 13 }}>
                  {conds.map(c => (
                    <div key={c} onClick={() => toggleNpcCondition(npc.cityId, npc.id, c)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: `${condColor(c)}18`, border: `1px solid ${condColor(c)}55`, borderRadius: 20, padding: '2px 7px', fontFamily: "'Cinzel', serif", fontSize: 9, color: condColor(c), cursor: 'pointer', letterSpacing: '0.04em' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: condColor(c) }} />
                      {c} <span style={{ opacity: 0.6, marginLeft: 2 }}>✕</span>
                    </div>
                  ))}
                  <button onClick={e => setCondPicker({ entityId: npc.id, entityType: 'npc', entityCityId: npc.cityId, anchorRect: e.currentTarget.getBoundingClientRect() })}
                    style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(184,137,42,0.08)', border: '1px solid rgba(184,137,42,0.25)', borderRadius: 20, padding: '2px 7px', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c040', cursor: 'pointer', letterSpacing: '0.04em' }}>
                    + Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ Condition Picker Popup ══ */}
      {condPicker && (
        <div style={{ position: 'fixed', zIndex: 999999, width: 210, background: '#0a0805', border: '1px solid rgba(184,137,42,0.3)', borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.8)', overflow: 'hidden', top: Math.min((condPicker.anchorRect?.bottom || 200) + 4, window.innerHeight - 280), left: Math.min((condPicker.anchorRect?.left || 100), window.innerWidth - 220) }}
          onMouseDown={e => e.stopPropagation()}>
          <input autoFocus value={condSearch} onChange={e => setCondSearch(e.target.value)}
            placeholder="Search conditions…"
            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: 'none', borderBottom: '1px solid rgba(184,137,42,0.15)', color: '#c8b890', padding: '7px 10px', fontFamily: 'inherit', fontSize: 11, outline: 'none' }} />
          <div style={{ maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
            {CONDITIONS.filter(c => !condSearch || c.toLowerCase().includes(condSearch.toLowerCase())).map(cond => {
              const currentConds = condPicker.entityType === 'player'
                ? (players.find(p => p.id === condPicker.entityId)?.conditions || [])
                : (cities.flatMap(city => city.npcs).find(n => n.id === condPicker.entityId)?.conditions || []);
              const active = currentConds.includes(cond);
              const color = condColor(cond);
              return (
                <button key={cond} onClick={() => {
                  if (condPicker.entityType === 'player') togglePlayerCondition(condPicker.entityId, cond);
                  else toggleNpcCondition(condPicker.entityCityId, condPicker.entityId, cond);
                }} style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', textAlign: 'left', border: 'none', background: active ? 'rgba(184,137,42,0.1)' : 'transparent', padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: active ? '#e8c040' : 'rgba(200,180,130,0.6)', letterSpacing: '0.04em' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: active ? color : 'rgba(184,137,42,0.2)', border: `1px solid ${color}55`, flexShrink: 0 }} />
                  {cond}
                  {active && <span style={{ marginLeft: 'auto', fontSize: 9, color, opacity: 0.7 }}>✓</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => { setCondPicker(null); setCondSearch(''); }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: 'none', borderTop: '1px solid rgba(184,137,42,0.1)', color: 'rgba(200,180,130,0.4)', padding: '5px', cursor: 'pointer', fontSize: 10 }}>
            Close
          </button>
        </div>
      )}
      {condPicker && <div style={{ position: 'fixed', inset: 0, zIndex: 999998 }} onClick={() => { setCondPicker(null); setCondSearch(''); }} />}

      {/* ══ Detail Drawer ══ */}
      {selectedNpc && selectedCity && (
        <div style={S.drawer}>
          <div style={S.drawerTitle}>
            <span>{selectedNpc.name}</span>
            <button style={S.closeBtn} onClick={() => setSelected(null)}>✕</button>
          </div>
          <div style={S.field}>
            <label style={S.label}>Name</label>
            <input style={S.fieldInput} value={selectedNpc.name}
              onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'name', e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ ...S.field, flex: 2 }}>
              <label style={S.label}>Role / Title</label>
              <input style={S.fieldInput} value={selectedNpc.role || ''}
                onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'role', e.target.value)} placeholder="Role or title…" />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <label style={S.label}>Status</label>
              <select style={S.fieldSelect} value={selectedNpc.status || 'Active'}
                onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'status', e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: '#0e0c09' }}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ ...S.field, flex: 1 }}>
              <label style={S.label}>Category</label>
              <select style={S.fieldSelect} value={selectedNpc.category || 'Uncategorized'}
                onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'category', e.target.value)}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c} style={{ background: '#0e0c09' }}>{c}</option>)}
              </select>
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <label style={S.label}>Group</label>
              <input style={S.fieldInput} value={selectedNpc.group || ''}
                onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'group', e.target.value)} placeholder="Group name or leave blank" />
            </div>
          </div>
          <div style={S.field}>
            <label style={S.label}>Faction</label>
            <input style={S.fieldInput} value={selectedNpc.faction || ''}
              onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'faction', e.target.value)} placeholder="Faction or affiliation…" />
          </div>
          <div style={S.field}>
            <label style={S.label}>Notes</label>
            <textarea style={S.fieldTextarea} value={selectedNpc.notes || ''}
              onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'notes', e.target.value)} placeholder="DM notes, relationships, plot hooks…" />
          </div>
          {/* Conditions */}
          <div style={S.field}>
            <label style={S.label}>Conditions</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              {(selectedNpc.conditions || []).map(c => (
                <div key={c} onClick={() => toggleNpcCondition(selectedCity.id, selectedNpc.id, c)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: `${condColor(c)}18`, border: `1px solid ${condColor(c)}55`, borderRadius: 20, padding: '2px 7px', fontFamily: "'Cinzel', serif", fontSize: 9, color: condColor(c), cursor: 'pointer', letterSpacing: '0.04em' }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: condColor(c) }} />
                  {c} <span style={{ opacity: 0.6, marginLeft: 2 }}>✕</span>
                </div>
              ))}
              <button onClick={e => setCondPicker({ entityId: selectedNpc.id, entityType: 'npc', entityCityId: selectedCity.id, anchorRect: e.currentTarget.getBoundingClientRect() })}
                style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(184,137,42,0.08)', border: '1px solid rgba(184,137,42,0.25)', borderRadius: 20, padding: '2px 7px', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c040', cursor: 'pointer', letterSpacing: '0.04em' }}>
                + Add
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ fontSize: 10, color: 'rgba(200,180,130,0.25)', fontStyle: 'italic' }}>
                {selectedCity.name}{selectedCity.region ? ` · ${selectedCity.region}` : ''}
              </div>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('hercules:add_npc', { detail: { id: selectedNpc.id, name: selectedNpc.name, role: selectedNpc.role || '', conditions: selectedNpc.conditions || [], cityName: selectedCity.name } }))}
                style={{ background: 'rgba(60,120,200,0.15)', border: '1px solid rgba(60,120,200,0.35)', borderRadius: 3, color: '#80a0e0', cursor: 'pointer', padding: '3px 8px', fontSize: 10, fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
                ⚔ Add to Combat
              </button>
            </div>
            <button style={S.deleteBtn}
              onClick={() => { if (window.confirm(`Delete ${selectedNpc.name}?`)) deleteNpc(selectedCity.id, selectedNpc.id); }}>
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
