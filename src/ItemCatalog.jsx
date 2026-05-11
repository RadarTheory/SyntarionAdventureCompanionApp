import { useState, useMemo } from 'react';
import { COLORS } from './constants';
import { ALL_ITEMS } from "./data/items/allitems";

const ITEMS = ALL_ITEMS;

const CAT_COLOR = {
  Currency: COLORS.tech || '#2D9E7A',
  Weapons: COLORS.warn || '#D4845A',
  Armor: COLORS.magic || '#7B68D8',
  Gear: COLORS.muted || '#8a7d6e',
  Packs: COLORS.deity || '#C4A35A',
  Mounts: '#7a9e7a',
  Familiars: '#9e7a9e',
  Vehicles: '#7a8b9e',
  'Trade Goods': '#9e8a7a',
  Trinkets: '#9e9e7a',
  Consumables: '#c47a7a',
  'Spellcasting Items': '#7a9e9e',
  'Schematic Materials': '#8a9e7a',
  Documents: '#9e8a9e',
  'Magic Items': COLORS.magic || '#7B68D8',
  Artifacts: '#b87a3a',
};

export default function ItemCatalog() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCat] = useState(null);
  const [activeType, setActiveType] = useState(null);

  const categories = useMemo(() => [...new Set(ITEMS.map(i => i.category))], []);
  const types = useMemo(() => activeCategory ? [...new Set(ITEMS.filter(i => i.category === activeCategory).map(i => i.type))] : [], [activeCategory]);

  const filtered = useMemo(() => ITEMS.filter(item => {
    if (activeCategory && item.category !== activeCategory) return false;
    if (activeType && item.type !== activeType) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return item.name.toLowerCase().includes(q)
      || item.desc.toLowerCase().includes(q)
      || item.type.toLowerCase().includes(q)
      || item.tags?.some(t => t.toLowerCase().includes(q));
  }), [search, activeCategory, activeType]);

  return (
    <div style={{ fontFamily: 'Georgia, serif' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={label8()}>Item Catalog · {ITEMS.length} entries</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items, tags, types…"
          style={{
            width: '100%',
            background: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: '9px 12px',
            color: COLORS.text,
            fontSize: 12,
            fontFamily: 'Georgia, serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {!search && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {categories.map(cat => {
            const col = CAT_COLOR[cat] || COLORS.muted;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCat(active ? null : cat);
                  setActiveType(null);
                }}
                style={{
                  background: active ? `${col}22` : 'transparent',
                  border: `1px solid ${active ? col : COLORS.border}`,
                  borderRadius: 4,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: 8,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: active ? col : COLORS.dim,
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {activeCategory && types.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {types.map(type => (
            <button
              key={type}
              onClick={() => setActiveType(activeType === type ? null : type)}
              style={{
                background: activeType === type ? 'rgba(240,238,235,0.08)' : 'transparent',
                border: `1px solid ${activeType === type ? COLORS.borderMid : COLORS.border}`,
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 7,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: activeType === type ? COLORS.text : COLORS.dim,
                fontFamily: "'Cinzel', serif",
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div style={{ fontSize: 9, color: COLORS.dim, marginBottom: 12 }}>
        {filtered.length} item{filtered.length !== 1 ? 's' : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.map((item, index) => {
          const col = CAT_COLOR[item.category] || COLORS.muted;
          return (
            <div
              key={`${item.category}-${item.type}-${item.name}-${index}`}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: '9px 12px',
              }}
            >
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: col }} />
                <strong style={{ color: COLORS.text, fontSize: 12 }}>{item.name}</strong>
                <span style={{ color: col, fontSize: 8 }}>{item.category}</span>
                <span style={{ color: COLORS.dim, fontSize: 8 }}>{item.type}</span>
              </div>
              <p style={{ color: COLORS.textSub || COLORS.muted, fontSize: 12 }}>{item.desc}</p>
              <div style={{ color: COLORS.deity || '#C4A35A', fontSize: 9 }}>{item.meta}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function label8() {
  return {
    fontSize: 8,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: COLORS.muted,
    fontFamily: "'Cinzel', serif",
    marginBottom: 8,
  };
}