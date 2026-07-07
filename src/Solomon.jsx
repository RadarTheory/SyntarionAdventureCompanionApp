import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function goldBtn(extra = {}) {
  return {
    background: 'rgba(200,168,74,0.16)',
    border: '1px solid rgba(200,168,74,0.55)',
    color: '#e8d9a7',
    borderRadius: 7,
    padding: '7px 12px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 9,
    letterSpacing: '0.08em',
    ...extra,
  };
}

function redBtn(extra = {}) {
  return {
    background: 'rgba(180,55,45,0.14)',
    border: '1px solid rgba(220,90,70,0.55)',
    color: '#e0a092',
    borderRadius: 7,
    padding: '7px 12px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 9,
    letterSpacing: '0.08em',
    ...extra,
  };
}

export default function Solomon({ campaignId, onClose }) {
  const [boxes, setBoxes] = useState([]);
  const [boxItems, setBoxItems] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [presence, setPresence] = useState([]);
  const [pendingClaims, setPendingClaims] = useState([]);
  const [saving, setSaving] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('lootboxes')
      .select('*')
      .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
      .order('created_at', { ascending: false });
    if (data) setBoxes(data);
  }, [campaignId]);

  const loadPresence = useCallback(async () => {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('loot_presence')
      .select('*')
      .eq('campaign_id', String(campaignId))
      .gte('last_seen', cutoff);
    if (data) setPresence(data);
  }, [campaignId]);

  const loadPendingClaims = useCallback(async () => {
    const { data } = await supabase
      .from('lootbox_items')
      .select('*, lootboxes(name, campaign_id)')
      .eq('claim_status', 'pending');
    if (data) setPendingClaims(data);
  }, []);

  useEffect(() => {
    load();
    loadPresence();
    loadPendingClaims();

    const presenceInterval = setInterval(loadPresence, 30000);

    const sub = supabase.channel(`solomon-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootboxes' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootbox_items' }, () => {
        setBoxItems({});
        loadPendingClaims();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loot_presence' }, loadPresence)
      .subscribe();

    return () => {
      clearInterval(presenceInterval);
      supabase.removeChannel(sub);
    };
  }, [campaignId, load, loadPresence, loadPendingClaims]);

  const loadItems = async (boxId) => {
    if (boxItems[boxId] && boxItems[boxId].length > 0) return;
    const { data } = await supabase
      .from('lootbox_items')
      .select('*')
      .eq('lootbox_id', boxId)
      .order('created_at', { ascending: true });
    if (data) setBoxItems(prev => ({ ...prev, [boxId]: data }));
  };

  const toggleExpand = (boxId) => {
    if (expanded === boxId) { setExpanded(null); return; }
    setExpanded(boxId);
    loadItems(boxId);
  };

  useEffect(() => {
    if (expanded && !boxItems[expanded]) {
      loadItems(expanded);
    }
  }, [boxItems, expanded]);

  const revealBox = async (box) => {
    setSaving(box.id);
    const multiPlayer = presence.length > 1;
    const revealMode = multiPlayer ? 'multi' : 'single';

    await supabase.from('lootboxes').update({
      revealed: true,
      revealed_at: new Date().toISOString(),
      reveal_mode: revealMode,
    }).eq('id', box.id);

    // Broadcast toast to players on Loot tab via lootboxes realtime
    showToast(`⬡ "${box.name}" revealed to players (${revealMode} mode)`);
    setSaving(null);
    load();
  };

  const hideBox = async (box) => {
    setSaving(box.id);
    await supabase.from('lootboxes').update({
      revealed: false,
      revealed_at: null,
    }).eq('id', box.id);
    setSaving(null);
    load();
  };

  const placeOnMap = async (box) => {
    setSaving(box.id);
    const tokenKey = `loot_${box.id}`;
    const { data: sess } = await supabase.from('vtt_sessions').select('id, tokens').eq('campaign_id', String(campaignId)).maybeSingle();
    if (!sess?.id) {
      showToast('No VTT session for this campaign yet — open the VTT tab once first.');
      setSaving(null);
      return;
    }
    const existing = sess.tokens || [];
    if (existing.some(t => t.id === tokenKey)) {
      showToast(`⬡ "${box.name}" is already on the map`);
      setSaving(null);
      return;
    }
    const next = [...existing, {
      id: tokenKey, type: 'loot', label: '⬡',
      fullName: box.name || 'Lootbox', creatureName: box.name || 'Lootbox',
      color: '#e8c84a', lootbox_id: box.id, x: 0.5, y: 0.5,
    }];
    const { error } = await supabase.from('vtt_sessions').update({ tokens: next, updated_at: new Date().toISOString() }).eq('id', sess.id);
    showToast(error ? '✕ Failed to place on map' : `⌖ "${box.name}" placed on the map`);
    setSaving(null);
  };

  const approveClaim = async (item) => {
    setSaving(item.id);

    // Scribe Tokens are currency — increment on the character, don't add to pack
    const isScribeToken = item.item_name?.toLowerCase().includes('scribe token');
    if (isScribeToken) {
      const { data: charRow } = await supabase.from('characters').select('data').eq('id', item.claimed_by).maybeSingle();
      const d = typeof charRow?.data === 'string' ? JSON.parse(charRow.data) : (charRow?.data || {});
      const newCount = (d.scribeTokens || 0) + (item.qty || 1);
      await supabase.from('characters').update({ data: { ...d, scribeTokens: newCount } }).eq('id', item.claimed_by);
    } else {
      // Write to character's pack
      await supabase.from('character_items').insert({
        character_id: item.claimed_by,
        slot: `pack__${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: item.item_name,
        description: `${item.item_category || 'Misc'}|${item.item_desc || ''}${item.note ? ' — ' + item.note : ''}`,
        attuned: false,
        bonuses: {},
        weight: item.qty || 1,
      });
    }

    // Mark item approved
    await supabase.from('lootbox_items').update({
      claim_status: 'approved',
      claimed_at: new Date().toISOString(),
    }).eq('id', item.id);

    // Check if all items in box are claimed — if so mark box claimed
    const { data: remaining } = await supabase
      .from('lootbox_items')
      .select('id, claim_status')
      .eq('lootbox_id', item.lootbox_id);

    const allDone = remaining?.every(r => r.claim_status === 'approved' || r.claim_status === 'denied');
    if (allDone) {
      await supabase.from('lootboxes').update({
        claimed: true,
        claimed_at: new Date().toISOString(),
      }).eq('id', item.lootbox_id);
      // Sweep the lootbox token off the map, if it was placed
      const { data: sess } = await supabase.from('vtt_sessions').select('id, tokens').eq('campaign_id', String(campaignId)).maybeSingle();
      const tokenKey = `loot_${item.lootbox_id}`;
      if (sess?.id && (sess.tokens || []).some(t => t.id === tokenKey)) {
        await supabase.from('vtt_sessions').update({ tokens: sess.tokens.filter(t => t.id !== tokenKey), updated_at: new Date().toISOString() }).eq('id', sess.id);
      }
    }

    showToast(`✓ Approved: ${item.item_name}`);
    setSaving(null);
    loadPendingClaims();
    load();
  };

  const denyClaim = async (item) => {
    setSaving(item.id);
    await supabase.from('lootbox_items').update({
      claim_status: 'unclaimed',
      claimed_by: null,
      claimed_at: null,
    }).eq('id', item.id);
    showToast(`✕ Denied: ${item.item_name}`);
    setSaving(null);
    loadPendingClaims();
  };

  const unrevealed = boxes.filter(b => !b.revealed && !b.claimed);
  const revealed = boxes.filter(b => b.revealed && !b.claimed);
  const claimed = boxes.filter(b => b.claimed);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1410', border: '1px solid rgba(200,168,74,0.5)',
          borderRadius: 8, padding: '10px 18px', zIndex: 10,
          fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a',
          whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          {toast}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 16px 0', flexShrink: 0 }}>
        <button onClick={() => { setBoxItems({}); load(); loadPendingClaims(); }} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim, letterSpacing: '0.1em' }}>↺ Refresh</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Presence */}
        <div>
          <div style={{ ...label8(), marginBottom: 8 }}>On Loot Tab Now</div>
          {presence.length === 0 ? (
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No players on Loot tab.</div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {presence.map(p => (
                <div key={p.id} style={{
                  background: 'rgba(121,245,167,0.08)', border: '1px solid rgba(121,245,167,0.3)',
                  borderRadius: 20, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#79f5a7' }} />
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: '#9fe0aa', letterSpacing: '0.06em' }}>
                    {p.character_name || 'Player'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending claims */}
        {pendingClaims.length > 0 && (
          <div>
            <div style={{ ...label8(), marginBottom: 8, color: '#e8a84a' }}>
              Pending Claims ({pendingClaims.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {pendingClaims.map(item => (
                <div key={item.id} style={{
                  background: 'rgba(200,168,74,0.06)', border: '1px solid rgba(200,168,74,0.3)',
                  borderRadius: 8, padding: '10px 12px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{item.item_name}</div>
                      <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>
                        from <span style={{ color: '#e8a84a' }}>{item.lootboxes?.name || 'Unknown box'}</span>
                        {item.item_category && ` · ${item.item_category}`}
                        {item.qty > 1 && ` · ×${item.qty}`}
                      </div>
                      <div style={{ fontSize: 8, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
                        Claimed by: {item.claimed_by}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => approveClaim(item)}
                      disabled={saving === item.id}
                      style={goldBtn({ opacity: saving === item.id ? 0.5 : 1 })}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => denyClaim(item)}
                      disabled={saving === item.id}
                      style={redBtn({ opacity: saving === item.id ? 0.5 : 1 })}
                    >
                      ✕ Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Staged boxes */}
        <div>
          <div style={{ ...label8(), marginBottom: 8 }}>Staged — Not Yet Revealed ({unrevealed.length})</div>
          {unrevealed.length === 0 ? (
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No boxes staged.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {unrevealed.map(box => (
                <BoxRow
                  key={box.id}
                  box={box}
                  items={boxItems[box.id]}
                  expanded={expanded === box.id}
                  onToggle={() => toggleExpand(box.id)}
                  presence={presence}
                  onPlaceOnMap={() => placeOnMap(box)}
                  onDeleteItem={async (itemId) => {
                    await supabase.from('lootbox_items').delete().eq('id', itemId);
                    setBoxItems(prev => ({ ...prev, [box.id]: prev[box.id].filter(i => i.id !== itemId) }));
                  }}
                  onAddScribeToken={async () => {
                    await supabase.from('lootbox_items').insert({
                      lootbox_id: box.id,
                      item_name: 'Scribe Token',
                      item_category: 'Currency',
                      item_desc: 'Grants one consultation with The Scribe.',
                      qty: 1,
                      claim_status: 'unclaimed',
                    });
                    setBoxItems(prev => ({ ...prev, [box.id]: undefined }));
                    loadItems(box.id);
                  }}
                  action={
                    <button
                      onClick={() => revealBox(box)}
                      disabled={saving === box.id}
                      style={goldBtn({ opacity: saving === box.id ? 0.5 : 1 })}
                    >
                      {saving === box.id ? 'Revealing…' : `⬡ Reveal to ${presence.length > 1 ? `${presence.length} Players` : 'Player'}`}
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Revealed boxes */}
        {revealed.length > 0 && (
          <div>
            <div style={{ ...label8(), marginBottom: 8, color: '#e8a84a' }}>Revealed — Awaiting Claims ({revealed.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {revealed.map(box => (
                <BoxRow
                  key={box.id}
                  box={box}
                  items={boxItems[box.id]}
                  expanded={expanded === box.id}
                  onToggle={() => toggleExpand(box.id)}
                  presence={presence}
                  revealMode={box.reveal_mode}
                  onPlaceOnMap={() => placeOnMap(box)}
                  action={
                    <button
                      onClick={() => hideBox(box)}
                      disabled={saving === box.id}
                      style={redBtn({ fontSize: 8 })}
                    >
                      Hide
                    </button>
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Claimed boxes */}
        {claimed.length > 0 && (
          <div>
            <div style={{ ...label8(), marginBottom: 8, color: COLORS.dim }}>Claimed ({claimed.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {claimed.map(box => (
                <div key={box.id} style={{
                  padding: '8px 12px', background: 'transparent',
                  border: `1px solid ${COLORS.border}`, borderRadius: 6,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  opacity: 0.5,
                }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>
                    ⬡ {box.name}
                  </div>
                  <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>
                    {box.claimed_at ? new Date(box.claimed_at).toLocaleDateString() : 'Claimed'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BoxRow({ box, items, expanded, onToggle, presence, revealMode, action, onDeleteItem, onAddScribeToken, onPlaceOnMap }) {
  const modeLabel = revealMode === 'multi'
    ? `Multi-player · ${presence.length} present`
    : revealMode === 'single'
      ? 'Single-player · private'
      : null;

  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${box.revealed ? 'rgba(200,168,74,0.4)' : COLORS.border}`,
      borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', gap: 10,
      }}>
        <button onClick={onToggle} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, flex: 1, textAlign: 'left', padding: 0,
        }}>
          <div style={{ fontSize: 14, lineHeight: 1 }}>⬡</div>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: box.revealed ? '#e8a84a' : COLORS.text, letterSpacing: '0.06em' }}>
              {box.name}
            </div>
            {modeLabel && (
              <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 1 }}>
                {modeLabel}
              </div>
            )}
          </div>
          <div style={{ fontSize: 9, color: COLORS.dim, marginLeft: 'auto', paddingRight: 8 }}>
            {expanded ? '▲' : '▾'}
          </div>
        </button>
        {onPlaceOnMap && (
          <button onClick={onPlaceOnMap} title="Place this lootbox on the VTT map"
            style={{ background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 7, padding: '7px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#c8a84a', letterSpacing: '0.06em', flexShrink: 0 }}>
            ⌖ Map
          </button>
        )}
        {action}
      </div>

      {expanded && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: '10px 12px' }}>
          {onAddScribeToken && (
            <div style={{ marginBottom: 10 }}>
              <button onClick={onAddScribeToken} style={{ background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 5, padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#c8a84a', letterSpacing: '0.08em', display: 'block' }}>
                ✦ Add Scribe Token
              </button>
            </div>
          )}
          {!items ? (
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No items in this box.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {items.map((item, i) => (
                <div key={item.id || i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 8px', background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${
                    item.claim_status === 'approved' ? 'rgba(121,245,167,0.3)' :
                    item.claim_status === 'pending' ? 'rgba(200,168,74,0.3)' :
                    COLORS.border
                  }`,
                  borderRadius: 5,
                }}>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.text }}>{item.item_name}</div>
                    {item.item_desc && (
                      <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 1 }}>{item.item_desc}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    {item.qty > 1 && <div style={{ fontSize: 8, color: '#e8c84a', fontFamily: "'Cinzel', serif" }}>×{item.qty}</div>}
                    {item.claim_status === 'approved' && <div style={{ fontSize: 7, color: '#79f5a7', fontFamily: "'Cinzel', serif" }}>CLAIMED</div>}
                    {item.claim_status === 'pending' && <div style={{ fontSize: 7, color: '#e8a84a', fontFamily: "'Cinzel', serif" }}>PENDING</div>}
                    {onDeleteItem && !box.revealed && !box.claimed && (
                      <button onClick={() => onDeleteItem(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e05a5a', fontSize: 11, padding: '0 4px' }}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
