// ═══════════════════════════════════════════════════════════════════════════
//  NPCPanel.jsx — Syntarion | DM NPC Tracker
//  Renders inside DraggablePanel in DMView.jsx
//  Data source: src/data/npcs.js
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useMemo, useRef, useEffect } from 'react';
import { DEFAULT_CITIES, newNpcId, newCityId } from './data/npcs';

// ── Status colours ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  'Active':     '#60e060',
  'Deceased':   '#e06060',
  'Missing':    '#e0b040',
  'Unknown':    '#8090a0',
  'Imprisoned': '#c060e0',
  'Wanted':     '#e08040',
};
const statusColor = (s) => STATUS_COLORS[s] || '#8090a0';

const STATUS_OPTIONS = ['Active', 'Deceased', 'Missing', 'Unknown', 'Imprisoned', 'Wanted'];

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100%',
    background: '#0e0c09', color: '#c8b890',
    fontFamily: "'Crimson Pro', 'Georgia', serif",
    fontSize: 13, overflow: 'hidden',
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
  addCityBtn: {
    background: 'rgba(184,137,42,0.15)', border: '1px solid rgba(184,137,42,0.3)',
    borderRadius: 3, color: '#e8c040', cursor: 'pointer',
    padding: '4px 8px', fontSize: 11, fontFamily: "'Cinzel', serif",
    letterSpacing: '0.1em', whiteSpace: 'nowrap',
  },
  scroll: {
    flex: 1, overflowY: 'auto', padding: '4px 0',
  },
  cityBlock: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  cityHeader: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 10px', cursor: 'pointer',
    background: 'rgba(184,137,42,0.06)',
    userSelect: 'none',
  },
  cityChevron: {
    fontSize: 10, color: 'rgba(184,137,42,0.5)', width: 12,
  },
  cityName: {
    fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.1em',
    color: '#e8c040', flex: 1,
  },
  cityRegion: {
    fontSize: 10, color: 'rgba(200,180,130,0.35)', fontStyle: 'italic',
  },
  cityCount: {
    fontSize: 10, color: 'rgba(184,137,42,0.5)',
  },
  npcList: {
    padding: '0 0 4px 0',
  },
  npcRow: {
    display: 'flex', alignItems: 'flex-start', gap: 6,
    padding: '5px 10px 5px 22px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    cursor: 'pointer', transition: 'background 0.1s',
  },
  npcDot: {
    width: 7, height: 7, borderRadius: '50%',
    flexShrink: 0, marginTop: 4,
  },
  npcMain: {
    flex: 1, minWidth: 0,
  },
  npcName: {
    fontWeight: 600, color: '#ddd0b0', fontSize: 13,
  },
  npcRole: {
    color: 'rgba(200,180,130,0.55)', fontSize: 11, fontStyle: 'italic',
  },
  npcFaction: {
    color: 'rgba(184,137,42,0.6)', fontSize: 10,
  },
  npcStatus: {
    fontSize: 10, fontFamily: "'Cinzel', serif",
    letterSpacing: '0.06em', flexShrink: 0,
  },
  quickAdd: {
    padding: '4px 10px 6px 22px',
    display: 'flex', gap: 4, alignItems: 'center',
  },
  quickInput: {
    flex: 1, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(184,137,42,0.2)',
    borderRadius: 3, color: '#c8b890', padding: '3px 6px',
    fontFamily: 'inherit', fontSize: 12, outline: 'none',
  },
  quickBtn: {
    background: 'rgba(184,137,42,0.18)', border: '1px solid rgba(184,137,42,0.3)',
    borderRadius: 3, color: '#e8c040', cursor: 'pointer',
    padding: '3px 7px', fontSize: 11,
  },
  // ── Detail drawer ──
  drawer: {
    borderTop: '1px solid rgba(184,137,42,0.2)',
    background: '#0a0805', padding: '10px 12px',
    flexShrink: 0, maxHeight: '45%', overflowY: 'auto',
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
  field: {
    marginBottom: 7,
  },
  label: {
    fontSize: 10, color: 'rgba(184,137,42,0.55)', letterSpacing: '0.1em',
    fontFamily: "'Cinzel', serif", textTransform: 'uppercase',
    display: 'block', marginBottom: 2,
  },
  fieldInput: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(184,137,42,0.2)',
    borderRadius: 3, color: '#c8b890', padding: '4px 7px',
    fontFamily: 'inherit', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  },
  fieldSelect: {
    width: '100%', background: '#0e0c09',
    border: '1px solid rgba(184,137,42,0.2)',
    borderRadius: 3, color: '#c8b890', padding: '4px 7px',
    fontFamily: 'inherit', fontSize: 12, outline: 'none',
    boxSizing: 'border-box',
  },
  fieldTextarea: {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(184,137,42,0.2)',
    borderRadius: 3, color: '#c8b890', padding: '4px 7px',
    fontFamily: 'inherit', fontSize: 12, outline: 'none',
    resize: 'vertical', minHeight: 60, boxSizing: 'border-box',
  },
  deleteBtn: {
    background: 'rgba(200,60,60,0.15)', border: '1px solid rgba(200,60,60,0.3)',
    borderRadius: 3, color: '#e06060', cursor: 'pointer',
    padding: '3px 8px', fontSize: 11, marginTop: 6,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
export default function NPCPanel() {
  const [cities, setCities]           = useState(() => JSON.parse(JSON.stringify(DEFAULT_CITIES)));
  const [collapsed, setCollapsed]     = useState({});      // { cityId: bool }
  const [search, setSearch]           = useState('');
  const [selected, setSelected]       = useState(null);    // { cityId, npcId }
  const [quickName, setQuickName]     = useState({});      // { cityId: string }
  const [addingCity, setAddingCity]   = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const newCityRef = useRef(null);

  useEffect(() => {
    if (addingCity && newCityRef.current) newCityRef.current.focus();
  }, [addingCity]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleCity = (id) =>
    setCollapsed(c => ({ ...c, [id]: !c[id] }));

  const updateNpc = (cityId, npcId, field, value) => {
    setCities(prev => prev.map(city => {
      if (city.id !== cityId) return city;
      return { ...city, npcs: city.npcs.map(n => n.id === npcId ? { ...n, [field]: value } : n) };
    }));
  };

  const deleteNpc = (cityId, npcId) => {
    setCities(prev => prev.map(city => {
      if (city.id !== cityId) return city;
      return { ...city, npcs: city.npcs.filter(n => n.id !== npcId) };
    }));
    setSelected(null);
  };

  const addNpc = (cityId) => {
    const name = (quickName[cityId] || '').trim();
    if (!name) return;
    const npc = { id: newNpcId(), name, role: '', status: 'Active', faction: '', notes: '' };
    setCities(prev => prev.map(city =>
      city.id === cityId ? { ...city, npcs: [...city.npcs, npc] } : city
    ));
    setQuickName(q => ({ ...q, [cityId]: '' }));
    setSelected({ cityId, npcId: npc.id });
    setCollapsed(c => ({ ...c, [cityId]: false }));
  };

  const addCity = () => {
    const name = newCityName.trim();
    if (!name) { setAddingCity(false); return; }
    const city = { id: newCityId(), name, region: '', npcs: [] };
    // Insert before Unassigned
    setCities(prev => {
      const idx = prev.findIndex(c => c.id === 'unassigned');
      const next = [...prev];
      next.splice(idx === -1 ? next.length : idx, 0, city);
      return next;
    });
    setNewCityName('');
    setAddingCity(false);
  };

  // ── Search filter ─────────────────────────────────────────────────────────
  const q = search.toLowerCase();
  const filtered = useMemo(() => {
    if (!q) return cities;
    return cities.map(city => ({
      ...city,
      npcs: city.npcs.filter(n =>
        n.name.toLowerCase().includes(q) ||
        (n.role  || '').toLowerCase().includes(q) ||
        (n.faction || '').toLowerCase().includes(q) ||
        (n.notes || '').toLowerCase().includes(q)
      ),
    })).filter(city => city.npcs.length > 0 || city.name.toLowerCase().includes(q));
  }, [cities, q]);

  // ── Selected NPC ──────────────────────────────────────────────────────────
  const selectedCity = selected ? cities.find(c => c.id === selected.cityId) : null;
  const selectedNpc  = selectedCity ? selectedCity.npcs.find(n => n.id === selected.npcId) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={S.root}>

      {/* ── Toolbar ── */}
      <div style={S.toolbar}>
        <input
          style={S.searchInput}
          placeholder="Search NPCs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {!addingCity ? (
          <button style={S.addCityBtn} onClick={() => setAddingCity(true)}>+ City</button>
        ) : (
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              ref={newCityRef}
              style={{ ...S.quickInput, width: 110 }}
              placeholder="City name…"
              value={newCityName}
              onChange={e => setNewCityName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addCity(); if (e.key === 'Escape') setAddingCity(false); }}
            />
            <button style={S.quickBtn} onClick={addCity}>✓</button>
            <button style={{ ...S.quickBtn, color: 'rgba(200,130,130,0.8)' }} onClick={() => setAddingCity(false)}>✕</button>
          </div>
        )}
      </div>

      {/* ── City / NPC list ── */}
      <div style={S.scroll}>
        {filtered.map(city => {
          const isCollapsed = collapsed[city.id];
          const isUnassigned = city.id === 'unassigned';
          return (
            <div key={city.id} style={S.cityBlock}>
              {/* City header */}
              <div style={S.cityHeader} onClick={() => toggleCity(city.id)}>
                <span style={S.cityChevron}>{isCollapsed ? '▶' : '▼'}</span>
                <span style={S.cityName}>{city.name}</span>
                {city.region && <span style={S.cityRegion}>{city.region}</span>}
                <span style={S.cityCount}>{city.npcs.length}</span>
              </div>

              {/* NPC rows */}
              {!isCollapsed && (
                <div style={S.npcList}>
                  {city.npcs.length === 0 && !isUnassigned && (
                    <div style={{ padding: '4px 22px', color: 'rgba(200,180,130,0.3)', fontSize: 11, fontStyle: 'italic' }}>
                      No NPCs yet
                    </div>
                  )}
                  {city.npcs.map(npc => {
                    const isActive = selected && selected.npcId === npc.id;
                    return (
                      <div
                        key={npc.id}
                        style={{
                          ...S.npcRow,
                          background: isActive ? 'rgba(184,137,42,0.1)' : undefined,
                        }}
                        onClick={() => setSelected(isActive ? null : { cityId: city.id, npcId: npc.id })}
                      >
                        <div style={{ ...S.npcDot, background: statusColor(npc.status) }} />
                        <div style={S.npcMain}>
                          <div style={S.npcName}>{npc.name}</div>
                          {npc.role    && <div style={S.npcRole}>{npc.role}</div>}
                          {npc.faction && <div style={S.npcFaction}>{npc.faction}</div>}
                        </div>
                        <div style={{ ...S.npcStatus, color: statusColor(npc.status) }}>
                          {npc.status}
                        </div>
                      </div>
                    );
                  })}

                  {/* Quick-add row */}
                  <div style={S.quickAdd}>
                    <input
                      style={S.quickInput}
                      placeholder="+ Add NPC…"
                      value={quickName[city.id] || ''}
                      onChange={e => setQuickName(q => ({ ...q, [city.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') addNpc(city.id); }}
                      onClick={e => e.stopPropagation()}
                    />
                    <button style={S.quickBtn} onClick={() => addNpc(city.id)}>+</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Detail drawer ── */}
      {selectedNpc && selectedCity && (
        <div style={S.drawer}>
          <div style={S.drawerTitle}>
            <span>{selectedNpc.name}</span>
            <button style={S.closeBtn} onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={S.field}>
            <label style={S.label}>Name</label>
            <input
              style={S.fieldInput}
              value={selectedNpc.name}
              onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'name', e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ ...S.field, flex: 2 }}>
              <label style={S.label}>Role / Title</label>
              <input
                style={S.fieldInput}
                value={selectedNpc.role || ''}
                onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'role', e.target.value)}
                placeholder="Role or title…"
              />
            </div>
            <div style={{ ...S.field, flex: 1 }}>
              <label style={S.label}>Status</label>
              <select
                style={S.fieldSelect}
                value={selectedNpc.status || 'Active'}
                onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'status', e.target.value)}
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s} style={{ background: '#0e0c09' }}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Faction</label>
            <input
              style={S.fieldInput}
              value={selectedNpc.faction || ''}
              onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'faction', e.target.value)}
              placeholder="Faction or affiliation…"
            />
          </div>

          <div style={S.field}>
            <label style={S.label}>Notes</label>
            <textarea
              style={S.fieldTextarea}
              value={selectedNpc.notes || ''}
              onChange={e => updateNpc(selectedCity.id, selectedNpc.id, 'notes', e.target.value)}
              placeholder="DM notes, relationships, plot hooks…"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            <div style={{ fontSize: 10, color: 'rgba(200,180,130,0.3)', fontStyle: 'italic' }}>
              {selectedCity.name}{selectedCity.region ? ` · ${selectedCity.region}` : ''}
            </div>
            <button
              style={S.deleteBtn}
              onClick={() => {
                if (window.confirm(`Delete ${selectedNpc.name}?`)) deleteNpc(selectedCity.id, selectedNpc.id);
              }}
            >
              Delete NPC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
