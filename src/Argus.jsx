import { useState, useEffect, useMemo } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const APPAREL_SLOTS   = ['Head', 'Torso', 'Waist', 'Hands', 'Greaves', 'Boots'];
const WEAPON_SLOTS    = ['Main Hand', 'Off-Hand', 'Side-Weapon', 'Heavy'];
const ACCESSORY_SLOTS = ['Ring I', 'Ring II', 'Neck', 'Charm', 'Relic', 'Artifact'];
const ALL_SLOTS       = [...APPAREL_SLOTS, ...WEAPON_SLOTS, ...ACCESSORY_SLOTS];

const CAT_COLOR = {
  Currency: '#2D9E7A', Weapons: '#D4845A', Armor: '#7B68D8',
  Gear: '#8a7d6e', Packs: '#C4A35A', Mounts: '#7a9e7a',
  Familiars: '#9e7a9e', Vehicles: '#7a8b9e', 'Trade Goods': '#9e8a7a',
  Trinkets: '#9e9e7a', Consumables: '#c47a7a', 'Spellcasting Items': '#7a9e9e',
  'Schematic Materials': '#8a9e7a', Documents: '#9e8a9e',
  'Magic Items': '#7B68D8', Artifacts: '#b87a3a', Reagent: '#60c8f0',
};

const CAMPAIGNS = ['I', 'II', 'III', 'IV'];
const CAMPAIGN_NAMES = { I: 'Veinrunner', II: 'Keys of Aerifthos', III: 'Prints from Gamdon', IV: 'Veyline' };
const ALL_EIGHT_KEYS = ['spirit','soul','body','essence','will','whim','mind','dream'];
const ITEM_CATEGORIES = [
  'Weapons','Armor','Magic Items','Artifacts','Spellcasting Items',
  'Consumables','Gear','Packs','Currency','Trade Goods',
  'Collectables','Documents','Schematic Materials','Accessories','Reagent',
];
const RARITIES = ['Mundane','Common','Uncommon','Rare','Very Rare','Epic','Legendary','Artifact'];

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// ─── GRANT MODAL (DM only) ────────────────────────────────────────────────────

function GrantModal({ item, onClose }) {
  const [mode, setMode]             = useState(null);
  const [characters, setChars]      = useState([]);
  const [lootboxes, setLootboxes]   = useState([]);
  const [selectedChar, setChar]     = useState(null);
  const [selectedBox, setBox]       = useState(null);
  const [newBoxName, setNewBoxName] = useState('');
  const [newBoxCampaign, setNewBoxCampaign] = useState('');
  const [qty, setQty]               = useState(1);
  const [note, setNote]             = useState('');
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  useEffect(() => {
    supabase.from('characters').select('id, data, status, campaign_id').not('status', 'eq', 'rejected').then(({ data: rows }) => {
      if (rows) setChars(rows.map(row => {
        let d = {};
        try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch (_) {}
        return { id: row.id, name: d.name || `${d.fn || ''} ${d.ln || ''}`.trim() || 'Unnamed', campaign: d.campaign || row.campaign_id || null };
      }));
    });
    supabase.from('lootboxes').select('*').eq('claimed', false).order('created_at', { ascending: false }).then(({ data }) => { if (data) setLootboxes(data); });
  }, []);

  const grantToPlayer = async () => {
    if (!selectedChar || saving) return;
    setSaving(true);
    const { error } = await supabase.from('character_items').insert({
      character_id: String(selectedChar.id), slot: `pack__${Date.now()}`,
      name: item.name, description: `${item.category}|${item.desc}${note ? ' — ' + note : ''}`,
      attuned: false, bonuses: {}, weight: qty,
    });
    if (!error) {
      await supabase.from('messages').insert({
        type: 'dm', is_dm: true, sender_name: 'The Architect',
        character_id: String(selectedChar.id), campaign_id: selectedChar.campaign,
        content: `You have received: **${item.name}** (×${qty})${note ? `\n\n"${note}"` : ''}`, session_id: null,
      });
      setDone(true);
    }
    setSaving(false);
  };

  const grantToLootbox = async () => {
    if (saving) return;
    setSaving(true);
    let boxId = selectedBox;
    if (!boxId && newBoxName.trim()) {
      const { data: newBox } = await supabase.from('lootboxes').insert({ name: newBoxName.trim(), campaign_id: newBoxCampaign || null, claimed: false }).select().single();
      if (newBox) { boxId = newBox.id; setLootboxes(p => [newBox, ...p]); }
    }
    if (boxId) {
      await supabase.from('lootbox_items').insert({ lootbox_id: boxId, item_name: item.name, item_category: item.category, item_type: item.type, item_desc: item.desc, item_meta: item.meta || '', qty, note });
      setDone(true);
    }
    setSaving(false);
  };

  const col = CAT_COLOR[item.category] || COLORS.muted;

  if (done) return (
    <ModalShell item={item} col={col} onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>✦</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.magic, letterSpacing: '0.1em', marginBottom: 6 }}>
          {mode === 'player' ? 'Item Granted' : 'Added to Lootbox'}
        </div>
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          {mode === 'player' ? `${item.name} sent to ${selectedChar?.name}.` : `${item.name} added to lootbox.`}
        </div>
        <button onClick={onClose} style={{ marginTop: 16, ...smallBtn() }}>Close</button>
      </div>
    </ModalShell>
  );

  return (
    <ModalShell item={item} col={col} onClose={onClose}>
      {!mode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
          <ModeBtn color="rgba(200,168,74,0.4)" bg="rgba(200,168,74,0.08)" hoverBg="rgba(200,168,74,0.14)"
            title="⟳ Grant to Player" desc="Deliver directly to a character's pack." onClick={() => setMode('player')} />
          <ModeBtn color="rgba(180,122,58,0.4)" bg="rgba(180,122,58,0.08)" hoverBg="rgba(180,122,58,0.14)"
            title="⬡ Add to Lootbox" desc="Stage in a lootbox for players to claim." onClick={() => setMode('lootbox')} titleColor="#e8a84a" />
        </div>
      )}

      {mode === 'player' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <BackBtn onClick={() => setMode(null)} />
          <div style={{ ...label8(), marginBottom: 4 }}>Select Character</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
            {characters.map(c => (
              <button key={c.id} onClick={() => setChar(c)}
                style={{ background: selectedChar?.id === c.id ? 'rgba(200,168,74,0.12)' : COLORS.card, border: `1px solid ${selectedChar?.id === c.id ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{c.name}</div>
                  <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>Campaign {c.campaign || '—'} · {CAMPAIGN_NAMES[c.campaign] || ''}</div>
                </div>
                {selectedChar?.id === c.id && <div style={{ color: '#e8c84a' }}>✓</div>}
              </button>
            ))}
          </div>
          <QtyNote qty={qty} setQty={setQty} note={note} setNote={setNote} />
          <button onClick={grantToPlayer} disabled={!selectedChar || saving}
            style={{ background: selectedChar ? COLORS.magicBg : 'transparent', border: `1px solid ${selectedChar ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '10px', cursor: selectedChar ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: selectedChar ? COLORS.magicText : COLORS.dim, fontWeight: 700 }}>
            {saving ? 'Granting…' : `✦ Grant to ${selectedChar?.name || 'Player'}`}
          </button>
        </div>
      )}

      {mode === 'lootbox' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
          <BackBtn onClick={() => setMode(null)} />
          {lootboxes.length > 0 && (
            <>
              <div style={{ ...label8() }}>Existing Lootboxes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 140, overflowY: 'auto' }}>
                {lootboxes.map(box => (
                  <button key={box.id} onClick={() => { setBox(box.id); setNewBoxName(''); }}
                    style={{ background: selectedBox === box.id ? 'rgba(180,122,58,0.14)' : COLORS.card, border: `1px solid ${selectedBox === box.id ? 'rgba(180,122,58,0.6)' : COLORS.border}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{box.name}</div>
                      {box.campaign_id && <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>Campaign {box.campaign_id}</div>}
                    </div>
                    {selectedBox === box.id && <div style={{ color: '#e8a84a' }}>✓</div>}
                  </button>
                ))}
              </div>
            </>
          )}
          <div style={{ ...label8() }}>{lootboxes.length > 0 ? 'Or Create New' : 'Create Lootbox'}</div>
          <input value={newBoxName} onChange={e => { setNewBoxName(e.target.value); setBox(null); }}
            placeholder="Box name…" style={{ width: '100%', background: COLORS.card, border: `1px solid ${newBoxName ? 'rgba(180,122,58,0.5)' : COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {['', ...CAMPAIGNS].map(c => (
              <button key={c} onClick={() => setNewBoxCampaign(c)}
                style={{ background: newBoxCampaign === c ? 'rgba(180,122,58,0.14)' : 'transparent', border: `1px solid ${newBoxCampaign === c ? 'rgba(180,122,58,0.6)' : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: newBoxCampaign === c ? '#e8a84a' : COLORS.dim }}>
                {c || 'Any'}
              </button>
            ))}
          </div>
          <QtyNote qty={qty} setQty={setQty} note={note} setNote={setNote} />
          <button onClick={grantToLootbox} disabled={(!selectedBox && !newBoxName.trim()) || saving}
            style={{ background: (selectedBox || newBoxName.trim()) ? 'rgba(180,122,58,0.18)' : 'transparent', border: `1px solid ${(selectedBox || newBoxName.trim()) ? 'rgba(180,122,58,0.6)' : COLORS.border}`, borderRadius: 8, padding: '10px', cursor: (selectedBox || newBoxName.trim()) ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: (selectedBox || newBoxName.trim()) ? '#e8a84a' : COLORS.dim, fontWeight: 700 }}>
            {saving ? 'Adding…' : '⬡ Add to Lootbox'}
          </button>
        </div>
      )}
    </ModalShell>
  );
}

function ModalShell({ item, col, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 400000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#120e0a', border: `1px solid ${COLORS.border}`, borderRadius: 14, width: '100%', maxWidth: 420, maxHeight: '88vh', overflowY: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ flex: 1, paddingRight: 12 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.text, marginBottom: 4 }}>{item.name}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 8, color: col, fontFamily: "'Cinzel', serif" }}>{item.category}</span>
              <span style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{item.type}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
        </div>
        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16, lineHeight: 1.5 }}>{item.desc}</div>
        <div style={{ height: 1, background: COLORS.border, marginBottom: 16 }} />
        {children}
      </div>
    </div>
  );
}

function ModeBtn({ color, bg, hoverBg, title, desc, onClick, titleColor }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? hoverBg : bg, border: `1px solid ${color}`, borderRadius: 8, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: titleColor || '#e8c84a', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{desc}</div>
    </button>
  );
}

function BackBtn({ onClick }) {
  return <button onClick={onClick} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim, letterSpacing: '0.12em', padding: '0 0 4px', textAlign: 'left' }}>← Back</button>;
}

function QtyNote({ qty, setQty, note, setNote }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div style={{ ...label8(), marginBottom: 5 }}>Quantity</div>
        <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))}
          style={{ width: 80, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'monospace', fontSize: 12, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
      </div>
      <div>
        <div style={{ ...label8(), marginBottom: 5 }}>Note to Player (optional)</div>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Found in the cave chest."
          style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
      </div>
    </div>
  );
}

function smallBtn() {
  return { background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 20px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim, letterSpacing: '0.1em' };
}

// ─── EQUIPPED SLOT DISPLAY ────────────────────────────────────────────────────

function SlotRow({ slot, item }) {
  const hasItem  = item && item.name;
  const isAttuned = hasItem && item.attuned;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: hasItem ? (isAttuned ? 'rgba(200,168,74,0.08)' : COLORS.card) : 'transparent', border: `1px solid ${hasItem ? (isAttuned ? 'rgba(200,168,74,0.35)' : COLORS.border) : COLORS.border + '55'}`, borderRadius: 6, marginBottom: 4 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.dim, minWidth: 72, letterSpacing: '0.1em' }}>{slot}</div>
      {hasItem ? (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
            {isAttuned && <div style={{ fontSize: 7, color: '#e8c84a', fontFamily: "'Cinzel', serif", background: 'rgba(200,168,74,0.12)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>ATTUNED</div>}
          </div>
          {item.bonuses && Object.entries(item.bonuses).some(([,v]) => v !== 0) && (
            <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
              {Object.entries(item.bonuses).filter(([,v]) => v !== 0).map(([k,v]) => (
                <div key={k} style={{ fontSize: 7, color: v > 0 ? COLORS.magic : '#e05a5a', fontFamily: "'Cinzel', serif" }}>{v > 0 ? '+' : ''}{v} {k}</div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 10, color: `${COLORS.dim}55`, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Empty</div>
      )}
    </div>
  );
}

// ─── PACK ITEM ROW ────────────────────────────────────────────────────────────

function PackRow({ item }) {
  const col = CAT_COLOR[item.category] || COLORS.dim;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', marginBottom: 4 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
          <div style={{ fontSize: 7, color: col, fontFamily: "'Cinzel', serif", flexShrink: 0 }}>{item.category}</div>
          {item.qty > 1 && <div style={{ fontSize: 8, color: '#e8c84a', fontFamily: "'Cinzel', serif", flexShrink: 0 }}>×{item.qty}</div>}
        </div>
        {item.desc && <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{item.desc}</div>}
      </div>
    </div>
  );
}

// ─── LOAD CHARACTER INVENTORY ─────────────────────────────────────────────────

async function loadCharInventory(charId) {
  const { data } = await supabase.from('character_items').select('*').eq('character_id', String(charId));
  if (!data) return { equipped: {}, pack: [] };
  const equipped = {};
  const pack = [];
  data.forEach(row => {
    if (row.slot?.startsWith('pack__')) {
      pack.push({
        id: row.id,
        name: row.name,
        category: row.description?.split('|')[0] || 'Misc',
        desc: row.description?.split('|')[1] || '',
        qty: Number(row.weight) || 1,
      });
    } else {
      equipped[row.slot] = { name: row.name, description: row.description || '', attuned: !!row.attuned, bonuses: row.bonuses || {} };
    }
  });
  return { equipped, pack };
}

// ═════════════════════════════════════════════════════════════════════════════
// PLAYER ARGUS PANEL
// Shows own equipped + pack. Read-only.
// ═════════════════════════════════════════════════════════════════════════════

export function ArgusPlayerPanel({ char, onClose }) {
  const [equipped, setEquipped] = useState({});
  const [pack, setPack]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [section, setSection]   = useState('equipped'); // 'equipped' | 'pack'

  useEffect(() => {
    if (!char?.id) { setLoading(false); return; }
    loadCharInventory(char.id).then(({ equipped, pack }) => {
      setEquipped(equipped); setPack(pack); setLoading(false);
    });
    // Realtime
    const sub = supabase.channel(`argus-player-${char.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'character_items', filter: `character_id=eq.${char.id}` }, () => {
        loadCharInventory(char.id).then(({ equipped, pack }) => { setEquipped(equipped); setPack(pack); });
      }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [char?.id]);

  const equippedCount = Object.values(equipped).filter(i => i?.name).length;

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 360, maxHeight: '80vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(200,168,74,0.15)', background: 'rgba(200,168,74,0.04)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.16em', fontWeight: 700 }}>{char?.name || 'Unknown'}</div>
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>ARGUS · Pack & Equipment</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
          {[['equipped', `Equipped (${equippedCount})`], ['pack', `Pack (${pack.length})`]].map(([v, lbl]) => (
            <button key={v} onClick={() => setSection(v)}
              style={{ background: section === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${section === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: section === v ? '#e8c84a' : COLORS.dim }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Loading…</div>}

        {!loading && section === 'equipped' && (
          <div>
            {[['Apparel', APPAREL_SLOTS], ['Weapons', WEAPON_SLOTS], ['Accessories', ACCESSORY_SLOTS]].map(([group, slots]) => (
              <div key={group} style={{ marginBottom: 16 }}>
                <div style={{ ...label8(), marginBottom: 8 }}>{group}</div>
                {slots.map(slot => <SlotRow key={slot} slot={slot} item={equipped[slot]} />)}
              </div>
            ))}
            {equippedCount === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Nothing equipped.</div>}
          </div>
        )}

        {!loading && section === 'pack' && (
          <div>
            {pack.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Pack is empty.</div>}
            {pack.map((item, i) => <PackRow key={item.id || i} item={item} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DM ARGUS PANEL
// Three sections: full catalog, all characters' equipped, all characters' packs
// ═════════════════════════════════════════════════════════════════════════════

export function ArgusDMPanel({ onClose }) {
  const [section, setSection]     = useState('catalog'); // 'catalog' | 'equipped' | 'packs'
  const [search, setSearch]       = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [grantItem, setGrantItem] = useState(null);
  const [characters, setChars]    = useState([]);
  const [charInvs, setCharInvs]   = useState({}); // { charId: { equipped, pack } }
  const [loading, setLoading]     = useState(false);
  const [expandedChar, setExpandedChar] = useState(null);


  
  // Catalog filtering
  const filtered = useMemo(() => allItems.filter(item => {
  if (activeCat && item.category !== activeCat) return false;
  if (!search) return true;
  const s = search.toLowerCase();
  return item.name.toLowerCase().includes(s) || item.desc?.toLowerCase().includes(s);
}), [search, activeCat, allItems]);

  // Load characters
  useEffect(() => {
    if (section !== 'equipped' && section !== 'packs') return;
    setLoading(true);
    supabase.from('characters').select('id, data, status, campaign_id').not('status', 'eq', 'rejected').then(async ({ data: rows }) => {
      if (!rows) { setLoading(false); return; }
      const parsed = rows.map(row => {
        let d = {};
        try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch (_) {}
        return { id: row.id, name: d.name || 'Unnamed', campaign: d.campaign || row.campaign_id || null, status: row.status };
      }).filter(c => c.status !== 'rejected');
      setChars(parsed);

      // Load all inventories in parallel
      const results = await Promise.all(parsed.map(c => loadCharInventory(c.id).then(inv => [c.id, inv])));
      setCharInvs(Object.fromEntries(results));
      setLoading(false);
    });
  }, [section]);

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 480, maxHeight: '85vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

      {grantItem && <GrantModal item={grantItem} onClose={() => setGrantItem(null)} />}

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(200,168,74,0.15)', background: 'rgba(200,168,74,0.04)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.16em', fontWeight: 700 }}>ARGUS</div>
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Inventory Oversight · Architect View</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 5 }}>
          {[['catalog', 'Catalog'], ['equipped', 'Equipped'], ['packs', 'Packs']].map(([v, lbl]) => (
            <button key={v} onClick={() => setSection(v)}
              style={{ background: section === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${section === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: section === v ? '#e8c84a' : COLORS.dim }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* ── CATALOG ── */}
        {section === 'catalog' && (
          <div>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items…"
              style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />

            {!search && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                {categories.map(cat => {
                  const col = CAT_COLOR[cat] || COLORS.muted;
                  const active = activeCat === cat;
                  return (
                    <button key={cat} onClick={() => setActiveCat(active ? null : cat)}
                      style={{ background: active ? `${col}22` : 'transparent', border: `1px solid ${active ? col : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? col : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ fontSize: 8, color: COLORS.dim, marginBottom: 10 }}>{filtered.length} items</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filtered.map((item, i) => {
                const col = CAT_COLOR[item.category] || COLORS.muted;
                return (
                  <div key={`${item.name}-${i}`} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, flexShrink: 0 }} />
                      <strong style={{ color: COLORS.text, fontSize: 11, flex: 1, minWidth: 0 }}>{item.name}</strong>
                      <span style={{ color: col, fontSize: 7 }}>{item.category}</span>
                      <span style={{ color: COLORS.dim, fontSize: 7 }}>{item.type}</span>
                      <button onClick={() => setGrantItem(item)}
                        style={{ background: 'rgba(200,168,74,0.10)', border: '1px solid rgba(200,168,74,0.35)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: '#e8c84a', flexShrink: 0 }}>
                        ✦ Grant
                      </button>
                    </div>
                    {item.desc && <div style={{ color: COLORS.muted, fontSize: 10, marginTop: 4, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{item.desc}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── EQUIPPED (all characters) ── */}
        {section === 'equipped' && (
          <div>
            {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Loading inventories…</div>}
            {!loading && characters.map(char => {
              const inv = charInvs[char.id] || { equipped: {}, pack: [] };
              const equippedCount = Object.values(inv.equipped).filter(i => i?.name).length;
              const isExpanded = expandedChar === char.id;
              return (
                <div key={char.id} style={{ marginBottom: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setExpandedChar(isExpanded ? null : char.id)}
                    style={{ width: '100%', background: COLORS.card, border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text }}>{char.name}</div>
                      <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>Campaign {char.campaign || '—'} · {equippedCount} items equipped</div>
                    </div>
                    <div style={{ color: COLORS.dim, fontSize: 10, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '10px 12px', borderTop: `1px solid ${COLORS.border}` }}>
                      {ALL_SLOTS.map(slot => <SlotRow key={slot} slot={slot} item={inv.equipped[slot]} />)}
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && characters.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No characters found.</div>}
          </div>
        )}

        {/* ── PACKS (all characters) ── */}
        {section === 'packs' && (
          <div>
            {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Loading packs…</div>}
            {!loading && characters.map(char => {
              const inv = charInvs[char.id] || { equipped: {}, pack: [] };
              const isExpanded = expandedChar === char.id;
              return (
                <div key={char.id} style={{ marginBottom: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setExpandedChar(isExpanded ? null : char.id)}
                    style={{ width: '100%', background: COLORS.card, border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text }}>{char.name}</div>
                      <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>Campaign {char.campaign || '—'} · {inv.pack.length} pack item{inv.pack.length !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ color: COLORS.dim, fontSize: 10, transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                  </button>
                  {isExpanded && (
                    <div style={{ padding: '10px 12px', borderTop: `1px solid ${COLORS.border}` }}>
                      {inv.pack.length === 0
                        ? <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Pack is empty.</div>
                        : inv.pack.map((item, i) => <PackRow key={item.id || i} item={item} />)
                      }
                    </div>
                  )}
                </div>
              );
            })}
            {!loading && characters.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No characters found.</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// Default export = player panel (for CampaignView)
export default ArgusPlayerPanel;
