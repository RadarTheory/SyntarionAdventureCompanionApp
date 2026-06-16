import { useState, useMemo, useEffect } from 'react';
import { COLORS } from './constants';
import supabase from './lib/supabase';

useEffect(() => {
  supabase.from('items').select('*').order('category').order('name').then(({ data }) => {
    if (data) setItems(data.map(r => ({ ...r, desc: r.description })));
    setItemsLoading(false);
  });
}, []);

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

// ─── GRANT MODAL ─────────────────────────────────────────────────────────────
function GrantModal({ item, onClose }) {
  const [mode, setMode]           = useState(null); // 'player' | 'lootbox'
  const [characters, setChars]    = useState([]);
  const [lootboxes, setLootboxes] = useState([]);
  const [selectedChar, setChar]   = useState(null);
  const [selectedBox, setBox]     = useState(null);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxCampaign, setNewBoxCampaign] = useState('');
  const [qty, setQty]             = useState(1);
  const [note, setNote]           = useState('');
  const [saving, setSaving]       = useState(false);
  const [done, setDone]           = useState(false);

  const CAMPAIGNS = ['I', 'II', 'III', 'IV'];
  const CAMPAIGN_NAMES = { I: 'Veinrunner', II: 'Keys of Aerithos', III: 'Prints from Gamdon', IV: 'Veyline' };

  useEffect(() => {
    // Load approved characters — name/campaign live inside the `data` jsonb blob
    supabase.from('characters').select('id, data, status, campaign_id').not('status', 'eq', 'rejected').then(({ data: rows }) => {
      if (rows) {
        const parsed = rows.map(row => {
          // data is stored as a stringified JSON string
          let d = {};
          try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch (_) {}
          return {
            id: row.id,
            name: d.name || `${d.fn || ''} ${d.ln || ''}`.trim() || 'Unnamed',
            campaign: d.campaign || row.campaign_id || null,
            race: d.race || '',
            cid: d.cid || '',
          };
        });
        setChars(parsed);
      }
    });
    // Load lootboxes
    supabase.from('lootboxes').select('*').eq('claimed', false).order('created_at', { ascending: false }).then(({ data }) => {
      if (data) setLootboxes(data);
    });
  }, []);

  const grantToPlayer = async () => {
    if (!selectedChar || saving) return;
    setSaving(true);
    const { error } = await supabase.from('character_items').insert({
      character_id: String(selectedChar.id),
      slot: `pack__${Date.now()}`,
      name: item.name,
      description: `${item.category}|${item.desc}${note ? ' — ' + note : ''}`,
      attuned: false,
      bonuses: {},
      weight: qty,
    });
    // Also notify via message
    if (!error) {
      await supabase.from('messages').insert({
        type: 'dm',
        is_dm: true,
        sender_name: 'The Architect',
        character_id: String(selectedChar.id),
        campaign_id: selectedChar.campaign,
        content: `You have received: **${item.name}** (×${qty})${note ? `\n\n"${note}"` : ''}`,
        session_id: null,
      });
    }
    setSaving(false);
    if (!error) setDone(true);
  };

  const createAndAddToBox = async (boxId) => {
    const { error } = await supabase.from('lootbox_items').insert({
      lootbox_id: boxId,
      item_name: item.name,
      item_category: item.category,
      item_type: item.type,
      item_desc: item.desc,
      item_meta: item.meta || '',
      qty,
      note,
    });
    return error;
  };

  const grantToLootbox = async () => {
    if (saving) return;
    setSaving(true);
    let boxId = selectedBox;

    // Create new box if requested
    if (!boxId && newBoxName.trim()) {
      const { data: newBox, error: boxErr } = await supabase.from('lootboxes').insert({
        name: newBoxName.trim(),
        campaign_id: newBoxCampaign || null,
        claimed: false,
      }).select().single();
      if (boxErr || !newBox) { setSaving(false); return; }
      boxId = newBox.id;
      setLootboxes(prev => [newBox, ...prev]);
    }

    if (!boxId) { setSaving(false); return; }
    const error = await createAndAddToBox(boxId);
    setSaving(false);
    if (!error) setDone(true);
  };

  if (done) {
    return (
      <ModalShell item={item} onClose={onClose}>
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>✦</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.magic, letterSpacing: '0.1em', marginBottom: 6 }}>
            {mode === 'player' ? 'Item Granted' : 'Added to Lootbox'}
          </div>
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {mode === 'player'
              ? `${item.name} sent to ${selectedChar?.name || 'player'}.`
              : `${item.name} added to lootbox.`}
          </div>
          <button onClick={onClose}
            style={{ marginTop: 20, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 20px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim, letterSpacing: '0.1em' }}>
            Close
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell item={item} onClose={onClose}>
      {/* Mode picker */}
      {!mode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <button onClick={() => setMode('player')}
            style={{ background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,168,74,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(200,168,74,0.08)'}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', marginBottom: 4 }}>⟳ Grant to Player</div>
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Deliver directly to a character's pack.</div>
          </button>
          <button onClick={() => setMode('lootbox')}
            style={{ background: 'rgba(180,122,58,0.08)', border: '1px solid rgba(180,122,58,0.4)', borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(180,122,58,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(180,122,58,0.08)'}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8a84a', marginBottom: 4 }}>⬡ Add to Lootbox</div>
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Stage in a lootbox for players to claim.</div>
          </button>
        </div>
      )}

      {/* Grant to Player */}
      {mode === 'player' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <BackBtn onClick={() => setMode(null)} />
          <div>
            <div style={{ ...label8(), marginBottom: 8 }}>Select Character</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 240, overflowY: 'auto' }}>
              {characters.length === 0 && <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic' }}>No characters found.</div>}
              {characters.map(c => (
                <button key={c.id} onClick={() => setChar(c)}
                  style={{ background: selectedChar?.id === c.id ? 'rgba(200,168,74,0.12)' : COLORS.card, border: `1px solid ${selectedChar?.id === c.id ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{c.name || 'Unnamed'}</div>
                    <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>Campaign {c.campaign || '—'} · {CAMPAIGN_NAMES[c.campaign] || ''}</div>
                  </div>
                  {selectedChar?.id === c.id && <div style={{ color: '#e8c84a', fontSize: 12 }}>✓</div>}
                </button>
              ))}
            </div>
          </div>
          <QtyNote qty={qty} setQty={setQty} note={note} setNote={setNote} />
          <button onClick={grantToPlayer} disabled={!selectedChar || saving}
            style={{ background: selectedChar ? COLORS.magicBg : 'transparent', border: `1px solid ${selectedChar ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px', cursor: selectedChar ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: selectedChar ? COLORS.magicText : COLORS.dim, fontWeight: 700, letterSpacing: '0.1em' }}>
            {saving ? 'Granting…' : `✦ Grant to ${selectedChar?.name || 'Player'}`}
          </button>
        </div>
      )}

      {/* Add to Lootbox */}
      {mode === 'lootbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <BackBtn onClick={() => setMode(null)} />

          {/* Existing lootboxes */}
          {lootboxes.length > 0 && (
            <div>
              <div style={{ ...label8(), marginBottom: 8 }}>Existing Lootboxes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                {lootboxes.map(box => (
                  <button key={box.id} onClick={() => { setBox(box.id); setNewBoxName(''); }}
                    style={{ background: selectedBox === box.id ? 'rgba(180,122,58,0.14)' : COLORS.card, border: `1px solid ${selectedBox === box.id ? 'rgba(180,122,58,0.6)' : COLORS.border}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{box.name}</div>
                      {box.campaign_id && <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>Campaign {box.campaign_id} · {CAMPAIGN_NAMES[box.campaign_id] || ''}</div>}
                    </div>
                    {selectedBox === box.id && <div style={{ color: '#e8a84a', fontSize: 12 }}>✓</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* New lootbox */}
          <div>
            <div style={{ ...label8(), marginBottom: 8 }}>
              {lootboxes.length > 0 ? 'Or Create New Lootbox' : 'Create Lootbox'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={newBoxName}
                onChange={e => { setNewBoxName(e.target.value); setBox(null); }}
                placeholder="Box name, e.g. 'Cave Reward · Session 4'"
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${newBoxName ? 'rgba(180,122,58,0.5)' : COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }}
              />
              <div>
                <div style={{ ...label8(), marginBottom: 6 }}>Campaign (optional)</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['', ...CAMPAIGNS].map(c => (
                    <button key={c} onClick={() => setNewBoxCampaign(c)}
                      style={{ background: newBoxCampaign === c ? 'rgba(180,122,58,0.14)' : 'transparent', border: `1px solid ${newBoxCampaign === c ? 'rgba(180,122,58,0.6)' : COLORS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: newBoxCampaign === c ? '#e8a84a' : COLORS.dim }}>
                      {c || 'Any'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <QtyNote qty={qty} setQty={setQty} note={note} setNote={setNote} />

          <button
            onClick={grantToLootbox}
            disabled={(!selectedBox && !newBoxName.trim()) || saving}
            style={{ background: (selectedBox || newBoxName.trim()) ? 'rgba(180,122,58,0.18)' : 'transparent', border: `1px solid ${(selectedBox || newBoxName.trim()) ? 'rgba(180,122,58,0.6)' : COLORS.border}`, borderRadius: 8, padding: '10px', cursor: (selectedBox || newBoxName.trim()) ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: (selectedBox || newBoxName.trim()) ? '#e8a84a' : COLORS.dim, fontWeight: 700, letterSpacing: '0.1em' }}>
            {saving ? 'Adding…' : '⬡ Add to Lootbox'}
          </button>
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({ item, onClose, children }) {
  const col = CAT_COLOR[item.category] || COLORS.muted;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 400000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#120e0a', border: `1px solid ${COLORS.border}`, borderRadius: 14, width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', padding: 24 }}>
        {/* Item header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.text, marginBottom: 4 }}>{item.name}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 8, color: col, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>{item.category}</span>
              <span style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{item.type}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim, flexShrink: 0 }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5 }}>{item.desc}</div>
        <div style={{ height: 1, background: COLORS.border, marginBottom: 16 }} />
        {children}
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim, letterSpacing: '0.12em', padding: '0 0 4px', textAlign: 'left' }}>
      ← Back
    </button>
  );
}

function QtyNote({ qty, setQty, note, setNote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ ...label8(), marginBottom: 5 }}>Quantity</div>
          <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
            style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'monospace', fontSize: 12, color: COLORS.text, outline: 'none', textAlign: 'center', boxSizing: 'border-box' }} />
        </div>
      </div>
      <div>
        <div style={{ ...label8(), marginBottom: 5 }}>Note to Player (optional)</div>
        <input value={note} onChange={e => setNote(e.target.value)}
          placeholder="e.g. Found in the chest at the cave entrance."
          style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}

// ─── MAIN CATALOG ─────────────────────────────────────────────────────────────
export default function ItemCatalog() {
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCat] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [grantItem, setGrantItem]   = useState(null); // item being granted
  const [ITEMS, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);

  const categories = useMemo(() => [...new Set(ITEMS.map(i => i.category))], []);
  const types = useMemo(() => activeCategory
    ? [...new Set(ITEMS.filter(i => i.category === activeCategory).map(i => i.type))]
    : [], [activeCategory]);

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
      {/* Grant modal */}
      {grantItem && <GrantModal item={grantItem} onClose={() => setGrantItem(null)} />}

      <div style={{ marginBottom: 20 }}>
        <div style={label8()}>Item Catalog · {itemsLoading ? '…' : `${ITEMS.length} entries`}</div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items, tags, types…"
          style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', boxSizing: 'border-box', outline: 'none' }}
        />
      </div>

      {!search && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {categories.map(cat => {
            const col = CAT_COLOR[cat] || COLORS.muted;
            const active = activeCategory === cat;
            return (
              <button key={cat}
                onClick={() => { setActiveCat(active ? null : cat); setActiveType(null); }}
                style={{ background: active ? `${col}22` : 'transparent', border: `1px solid ${active ? col : COLORS.border}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? col : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {activeCategory && types.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {types.map(type => (
            <button key={type}
              onClick={() => setActiveType(activeType === type ? null : type)}
              style={{ background: activeType === type ? 'rgba(240,238,235,0.08)' : 'transparent', border: `1px solid ${activeType === type ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: activeType === type ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
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
            <div key={`${item.category}-${item.type}-${item.name}-${index}`}
              style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', transition: 'border-color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${col}55`}
              onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>

              {/* Item header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: col, flexShrink: 0 }} />
                <strong style={{ color: COLORS.text, fontSize: 12, flex: 1, minWidth: 0 }}>{item.name}</strong>
                <span style={{ color: col, fontSize: 8 }}>{item.category}</span>
                <span style={{ color: COLORS.dim, fontSize: 8 }}>{item.type}</span>

                {/* Grant buttons — shown inline on hover via flex */}
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button
                    onClick={() => setGrantItem(item)}
                    title="Grant to Player or Lootbox"
                    style={{ background: 'rgba(200,168,74,0.10)', border: '1px solid rgba(200,168,74,0.35)', borderRadius: 4, padding: '3px 9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: '#e8c84a', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                    ✦ Grant
                  </button>
                </div>
              </div>

              <p style={{ color: COLORS.textSub || COLORS.muted, fontSize: 12, margin: '6px 0 4px' }}>{item.desc}</p>
              <div style={{ color: COLORS.deity || '#C4A35A', fontSize: 9 }}>{item.meta}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
