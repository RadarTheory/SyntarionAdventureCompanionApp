import { useState } from 'react';
import { TABLE_GROUPS } from './adminTables';
import './adminSidebar.css';

const TOP_TABS = [
  ['dashboard', 'Dashboard'],
  ['tables', 'Tables'],
  ['players', 'Players'],
  ['timeline', 'Timeline'],
  ['upload', 'Scribe'],
  ['gate', 'Gate'],
];

const inputStyle = { background: '#1a1714', border: '1px solid #3a352e', borderRadius: 6, padding: '7px 9px', color: '#f0eeeb', fontSize: 10, fontFamily: 'monospace', outline: 'none' };

function buildDefaultCollapsed(activeTable) {
  const initial = {};
  TABLE_GROUPS.forEach((group) => {
    group.categories.forEach((cat) => {
      initial[`${group.id}:${cat.label}`] = !cat.tables.includes(activeTable);
    });
  });
  return initial;
}

export default function AdminSidebar({ view, onSetView, activeTable, onChooseTable, customTable, onCustomTable, onSignOut }) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState(() => buildDefaultCollapsed(activeTable));

  const query = search.trim().toLowerCase();
  const toggleCat = (key) => setCollapsed((c) => ({ ...c, [key]: !c[key] }));

  return (
    <div style={{ width: 236, borderRight: '1px solid #2a251e', padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, height: '100vh', overflowY: 'auto', position: 'sticky', top: 0 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 10, flexWrap: 'wrap' }}>
        {TOP_TABS.map(([v, l]) => (
          <button
            key={v}
            onClick={() => onSetView(v)}
            style={{
              flex: '1 0 30%',
              background: view === v ? 'rgba(200,168,74,0.14)' : 'transparent',
              border: `1px solid ${view === v ? 'rgba(200,168,74,0.5)' : '#3a352e'}`,
              borderRadius: 5,
              padding: '5px 0',
              color: view === v ? '#e8c84a' : '#8a8378',
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {l}
          </button>
        ))}
      </div>

      <input
        style={{ ...inputStyle, marginBottom: 6 }}
        placeholder="filter tables..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {TABLE_GROUPS.map((group) => {
        const cats = group.categories
          .map((cat) => ({ ...cat, tables: query ? cat.tables.filter((t) => t.includes(query)) : cat.tables }))
          .filter((cat) => cat.tables.length > 0);
        if (query && cats.length === 0) return null;

        return (
          <div key={group.id} style={{ marginBottom: 10 }}>
            <div style={{ color: '#e8c84a', fontSize: 11, letterSpacing: '0.15em', marginBottom: 4, opacity: 0.85 }}>{group.label.toUpperCase()}</div>
            {cats.map((cat) => {
              const key = `${group.id}:${cat.label}`;
              const isCollapsed = !query && collapsed[key];
              return (
                <div key={key} style={{ marginBottom: 2 }}>
                  <button
                    onClick={() => toggleCat(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      color: '#5c564c',
                      fontSize: 9,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                    }}
                  >
                    <span style={{ display: 'inline-block', transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 150ms', fontSize: 8 }}>▾</span>
                    {cat.label}
                    <span style={{ marginLeft: 'auto', color: '#3a352e' }}>{cat.tables.length}</span>
                  </button>
                  {!isCollapsed && (
                    <div className="admin-nav-group">
                      {cat.tables.map((t) => (
                        <button
                          key={t}
                          title={t}
                          onClick={() => onChooseTable(t)}
                          className={`admin-nav-item${activeTable === t ? ' active' : ''}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      <input
        style={{ ...inputStyle, marginTop: 8 }}
        placeholder="other table..."
        value={customTable}
        onChange={(e) => onCustomTable(e.target.value)}
      />
      <button
        onClick={onSignOut}
        style={{ background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.4)', borderRadius: 6, padding: '7px 14px', color: '#ef4444', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace', marginTop: 'auto' }}
      >
        Sign out
      </button>
    </div>
  );
}
