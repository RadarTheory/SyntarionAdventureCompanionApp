import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

const STATUS_COLOR = {
  pending:  { text: '#e8c84a', bg: 'rgba(200,168,74,0.12)',  border: 'rgba(200,168,74,0.4)'  },
  countered:{ text: '#7dd3fc', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.4)'  },
  approved: { text: '#79f5a7', bg: 'rgba(121,245,167,0.10)', border: 'rgba(121,245,167,0.4)' },
  declined: { text: '#e05a5a', bg: 'rgba(224,90,90,0.10)',   border: 'rgba(224,90,90,0.3)'   },
};

// ─── PLAYER BAZAAR PANEL ──────────────────────────────────────────────────────
export function BazaarPlayerPanel({ char, campaignId, embedded = false }) {
  const [view, setView]           = useState('trades');   // 'trades' | 'new'
  const [trades, setTrades]       = useState([]);
  const [lootboxes, setLootboxes] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState(null);
  const [toast, setToast]         = useState(null);

  // New trade form
  const [npcs, setNpcs]                     = useState([]);
  const [counterpartyType, setCPType]       = useState('npc');
  const [selectedNpc, setSelectedNpc]       = useState(null);
  const [offerItems, setOfferItems]         = useState([]);
  const [requestItems, setRequestItems]     = useState([{ name: '', desc: '', qty: 1 }]);
  const [offerNotes, setOfferNotes]         = useState('');
  const [packItems, setPackItems]           = useState([]);
  const [submitting, setSubmitting]         = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    if (!char?.id) return;
    loadAll();
    const sub = supabase.channel(`bazaar-player-${char.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootboxes' }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [char?.id, campaignId]);

  const loadAll = async () => {
    setLoading(true);
    const [tradesRes, lootRes, packRes, npcRes] = await Promise.all([
      supabase.from('trades').select('*, trade_items(*)').eq('initiator_character_id', String(char.id)).order('created_at', { ascending: false }),
      supabase.from('lootboxes').select('*, lootbox_items(*)').eq('claimed', false).or(`campaign_id.eq.${campaignId},campaign_id.is.null`),
      supabase.from('character_items').select('*').eq('character_id', String(char.id)),
      supabase.from('npcs').select('id, name, role, faction, tags').or('tags.cs.{trader},role.ilike.%trader%,role.ilike.%merchant%,role.ilike.%innkeep%,role.ilike.%vendor%'),
    ]);
    if (tradesRes.data) setTrades(tradesRes.data);
    if (npcRes.data) setNpcs(npcRes.data);
    if (packRes.data) {
      setPackItems(packRes.data.filter(r => r.slot?.startsWith('pack__')).map(r => ({
        id: r.id, name: r.name,
        category: r.description?.split('|')[0] || 'Misc',
        desc: r.description?.split('|')[1] || '',
        qty: Number(r.weight) || 1,
      })));
    }
    // Only show lootboxes where this character has pending items
    if (lootRes.data) {
      const mine = lootRes.data.filter(box =>
        box.lootbox_items?.some(i => i.claimed_by === String(char.id) || i.claim_status === 'approved')
        || box.reveal_mode !== 'multi'
      );
      setLootboxes(lootRes.data);
    }
    setLoading(false);
  };

  const toggleOfferItem = (packItem) => {
    setOfferItems(prev =>
      prev.find(i => i.id === packItem.id)
        ? prev.filter(i => i.id !== packItem.id)
        : [...prev, { ...packItem }]
    );
  };

  const submitTrade = async () => {
    if (!selectedNpc && counterpartyType === 'npc') return;
    if (offerItems.length === 0 && requestItems.every(r => !r.name.trim())) return;
    setSubmitting(true);

    const { data: trade, error } = await supabase.from('trades').insert({
      initiator_character_id: String(char.id),
      initiator_character_name: char.name,
      counterparty_type: counterpartyType,
      counterparty_npc_id: counterpartyType === 'npc' ? selectedNpc?.id : null,
      counterparty_npc_name: counterpartyType === 'npc' ? selectedNpc?.name : null,
      campaign_id: campaignId,
      status: 'pending',
      initiator_offer_notes: offerNotes,
    }).select().single();

    if (!error && trade) {
      const rows = [
        ...offerItems.map(i => ({ trade_id: trade.id, side: 'initiator', item_name: i.name, item_category: i.category, item_desc: i.desc, qty: i.qty, from_pack_id: i.id })),
        ...requestItems.filter(r => r.name.trim()).map(r => ({ trade_id: trade.id, side: 'counterparty', item_name: r.name.trim(), item_desc: r.desc, qty: r.qty })),
      ];
      if (rows.length) await supabase.from('trade_items').insert(rows);

      // Log to grimoire
      await supabase.from('grimoire_entries').insert({
        character_id: String(char.id),
        campaign_id: campaignId,
        type: 'event',
        title: `Trade Proposal — ${counterpartyType === 'npc' ? selectedNpc?.name : 'Player'}`,
        content: `Proposed a trade with ${counterpartyType === 'npc' ? selectedNpc?.name : 'another player'}. Offering: ${offerItems.map(i => i.name).join(', ') || 'nothing'}. Requesting: ${requestItems.filter(r => r.name).map(r => r.name).join(', ') || 'nothing'}. ${offerNotes ? `Notes: ${offerNotes}` : ''}`,
        is_dm: false,
      });

      showToast('Trade proposal sent to The Architect.');
      setView('trades');
      setOfferItems([]); setRequestItems([{ name: '', desc: '', qty: 1 }]); setOfferNotes(''); setSelectedNpc(null);
    }
    setSubmitting(false);
    loadAll();
  };

  const claimApprovedItem = async (box, item) => {
    await supabase.from('character_items').insert({
      character_id: String(char.id),
      slot: `pack__${Date.now()}`,
      name: item.item_name,
      description: `${item.item_category || 'Misc'}|${item.item_desc || ''}${item.note ? ' — ' + item.note : ''}`,
      attuned: false, bonuses: {}, weight: item.qty || 1,
    });
    await supabase.from('lootbox_items').update({ claim_status: 'claimed' }).eq('id', item.id);
    await supabase.from('grimoire_entries').insert({
      character_id: String(char.id),
      campaign_id: campaignId,
      type: 'event',
      title: `Received: ${item.item_name}`,
      content: `Claimed ${item.item_name} from ${box.name}.${item.item_desc ? ` ${item.item_desc}` : ''}`,
      is_dm: false,
    });
    showToast(`✦ ${item.item_name} added to pack.`);
    loadAll();
  };

  const containerStyle = embedded ? { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {};

  return (
    <div style={{ fontFamily: 'Georgia, serif', ...containerStyle }}>
      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 99999, background: '#1a1410', border: '1px solid rgba(200,168,74,0.6)', borderRadius: 10, padding: '12px 20px', fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexShrink: 0 }}>
        {[['trades', 'My Trades'], ['loot', `Loot (${lootboxes.length})`], ['new', '+ Propose Trade']].map(([v, lbl]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ background: view === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${view === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', color: view === v ? '#e8c84a' : COLORS.dim }}>
            {lbl}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>Loading…</div>}

        {/* ── MY TRADES ── */}
        {!loading && view === 'trades' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trades.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No trades yet. Propose one to begin.</div>}
            {trades.map(trade => {
              const sc = STATUS_COLOR[trade.status] || STATUS_COLOR.pending;
              const myItems = trade.trade_items?.filter(i => i.side === 'initiator') || [];
              const theirItems = trade.trade_items?.filter(i => i.side === 'counterparty') || [];
              const isOpen = expanded === trade.id;
              return (
                <div key={trade.id} style={{ border: `1px solid ${sc.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? null : trade.id)}
                    style={{ width: '100%', background: sc.bg, border: 'none', padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{trade.counterparty_npc_name || trade.counterparty_character_name || 'Unknown'}</div>
                      <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>{new Date(trade.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '2px 7px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{trade.status}</div>
                      <div style={{ color: COLORS.dim, fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: `1px solid ${sc.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ ...label8(), marginBottom: 6 }}>You offer</div>
                          {myItems.length === 0 ? <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic' }}>Nothing</div> :
                            myItems.map(i => <div key={i.id} style={{ fontSize: 10, color: COLORS.text, marginBottom: 3 }}>• {i.item_name}{i.qty > 1 ? ` ×${i.qty}` : ''}</div>)}
                        </div>
                        <div>
                          <div style={{ ...label8(), marginBottom: 6 }}>You request</div>
                          {theirItems.length === 0 ? <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic' }}>Nothing</div> :
                            theirItems.map(i => <div key={i.id} style={{ fontSize: 10, color: COLORS.text, marginBottom: 3 }}>• {i.item_name}{i.qty > 1 ? ` ×${i.qty}` : ''}</div>)}
                        </div>
                      </div>
                      {trade.initiator_offer_notes && <div style={{ fontSize: 10, color: COLORS.muted, fontStyle: 'italic', marginBottom: 8 }}>"{trade.initiator_offer_notes}"</div>}
                      {trade.dm_response_notes && (
                        <div style={{ background: 'rgba(200,168,74,0.06)', border: '1px solid rgba(200,168,74,0.25)', borderRadius: 6, padding: '8px 10px' }}>
                          <div style={{ ...label8(), marginBottom: 4, color: '#e8c84a' }}>Architect's Response</div>
                          <div style={{ fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{trade.dm_response_notes}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── LOOT ── */}
        {!loading && view === 'loot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lootboxes.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No loot waiting. The Architect will place rewards here.</div>}
            {lootboxes.map(box => {
              const myItems = box.lootbox_items?.filter(i => i.claimed_by === String(char.id) && i.claim_status === 'approved') || [];
              const isOpen = expanded === box.id;
              if (!box.revealed) return (
                <div key={box.id} style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '14px 16px', opacity: 0.6 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.dim }}>{box.name}</div>
                  <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>Sealed — awaiting The Architect.</div>
                </div>
              );
              return (
                <div key={box.id} style={{ background: COLORS.card, border: '1px solid rgba(180,122,58,0.5)', borderRadius: 10, overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? null : box.id)}
                    style={{ width: '100%', background: 'rgba(180,122,58,0.08)', border: 'none', padding: '12px 14px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8a84a' }}>{box.name}</div>
                    <div style={{ color: '#e8a84a', fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(180,122,58,0.2)' }}>
                      {myItems.length === 0 ? (
                        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No items assigned to you yet.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {myItems.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: COLORS.surface, borderRadius: 6, padding: '8px 10px', border: `1px solid ${COLORS.border}` }}>
                              <div>
                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{item.item_name}{item.qty > 1 ? ` ×${item.qty}` : ''}</div>
                                {item.item_desc && <div style={{ fontSize: 9, color: COLORS.dim, fontStyle: 'italic', marginTop: 2 }}>{item.item_desc}</div>}
                              </div>
                              {item.claim_status !== 'claimed' && (
                                <button onClick={() => claimApprovedItem(box, item)}
                                  style={{ background: 'rgba(121,245,167,0.12)', border: '1px solid rgba(121,245,167,0.4)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#79f5a7' }}>
                                  ✦ Claim
                                </button>
                              )}
                              {item.claim_status === 'claimed' && <div style={{ fontSize: 8, color: '#79f5a7', fontFamily: "'Cinzel', serif" }}>✓ In Pack</div>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── NEW TRADE ── */}
        {!loading && view === 'new' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ ...label8(), marginBottom: 8 }}>Trade With</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {[['npc', 'NPC / Merchant'], ['player', 'Another Player']].map(([v, lbl]) => (
                  <button key={v} onClick={() => setCPType(v)}
                    style={{ background: counterpartyType === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${counterpartyType === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: counterpartyType === v ? '#e8c84a' : COLORS.dim }}>
                    {lbl}
                  </button>
                ))}
              </div>
              {counterpartyType === 'npc' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                  {npcs.length === 0 && <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic' }}>No traders found in your region.</div>}
                  {npcs.map(npc => (
                    <button key={npc.id} onClick={() => setSelectedNpc(selectedNpc?.id === npc.id ? null : npc)}
                      style={{ background: selectedNpc?.id === npc.id ? 'rgba(200,168,74,0.10)' : COLORS.card, border: `1px solid ${selectedNpc?.id === npc.id ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 6, padding: '7px 10px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{npc.name}</div>
                        {npc.role && <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>{npc.role}</div>}
                      </div>
                      {selectedNpc?.id === npc.id && <div style={{ color: '#e8c84a', fontSize: 11 }}>✓</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div style={{ ...label8(), marginBottom: 8 }}>What You Offer (from Pack)</div>
              {packItems.length === 0 ? <div style={{ fontSize: 10, color: COLORS.dim, fontStyle: 'italic' }}>Pack is empty.</div> :
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 160, overflowY: 'auto' }}>
                  {packItems.map(item => {
                    const selected = offerItems.find(i => i.id === item.id);
                    return (
                      <button key={item.id} onClick={() => toggleOfferItem(item)}
                        style={{ background: selected ? 'rgba(200,168,74,0.10)' : COLORS.card, border: `1px solid ${selected ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 6, padding: '7px 10px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text }}>{item.name}</div>
                        {selected && <div style={{ color: '#e8c84a', fontSize: 11 }}>✓</div>}
                      </button>
                    );
                  })}
                </div>
              }
            </div>

            <div>
              <div style={{ ...label8(), marginBottom: 8 }}>What You Request</div>
              {requestItems.map((req, i) => (
                <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <input value={req.name} onChange={e => setRequestItems(prev => prev.map((r, j) => j === i ? { ...r, name: e.target.value } : r))}
                    placeholder="Item name…"
                    style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }} />
                  <input type="number" min={1} value={req.qty} onChange={e => setRequestItems(prev => prev.map((r, j) => j === i ? { ...r, qty: Number(e.target.value) } : r))}
                    style={{ width: 44, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 4px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
                  {requestItems.length > 1 && <button onClick={() => setRequestItems(prev => prev.filter((_, j) => j !== i))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#e05a5a', fontSize: 13 }}>×</button>}
                </div>
              ))}
              <button onClick={() => setRequestItems(prev => [...prev, { name: '', desc: '', qty: 1 }])}
                style={{ background: 'transparent', border: `1px dashed ${COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.dim, marginTop: 4 }}>
                + Add Item
              </button>
            </div>

            <div>
              <div style={{ ...label8(), marginBottom: 6 }}>Notes to The Architect (optional)</div>
              <textarea value={offerNotes} onChange={e => setOfferNotes(e.target.value)}
                rows={2} placeholder="Explain your proposal, roleplay context…"
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>

            <button onClick={submitTrade} disabled={submitting || (counterpartyType === 'npc' && !selectedNpc)}
              style={{ background: (!submitting && (counterpartyType !== 'npc' || selectedNpc)) ? COLORS.magicBg : 'transparent', border: `1px solid ${(!submitting && (counterpartyType !== 'npc' || selectedNpc)) ? COLORS.magic : COLORS.border}`, borderRadius: 8, padding: '11px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: (!submitting && (counterpartyType !== 'npc' || selectedNpc)) ? COLORS.magicText : COLORS.dim, fontWeight: 700, letterSpacing: '0.1em' }}>
              {submitting ? 'Submitting…' : '⟳ Submit Trade Proposal'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DM BAZAAR PANEL ──────────────────────────────────────────────────────────
export function BazaarDMPanel({ campaignId, onClose }) {
  const [view, setView]       = useState('trades');  // 'trades' | 'loot'
  const [trades, setTrades]   = useState([]);
  const [lootboxes, setLootboxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [responding, setResponding] = useState(null); // trade id
  const [responseNote, setResponseNote] = useState('');
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);

  // Loot divvy state
  const [divvyBox, setDivvyBox]       = useState(null);
  const [characters, setCharacters]   = useState([]);
  const [assignments, setAssignments] = useState({}); // { itemId: charId }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    loadAll();
    const sub = supabase.channel(`bazaar-dm-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trades' }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootboxes' }, loadAll)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  const loadAll = async () => {
    setLoading(true);
    const [tradesRes, lootRes, charRes] = await Promise.all([
      supabase.from('trades').select('*, trade_items(*)').order('created_at', { ascending: false }),
      supabase.from('lootboxes').select('*, lootbox_items(*)').eq('claimed', false).order('created_at', { ascending: false }),
      supabase.from('characters').select('id, data, campaign_id').not('status', 'eq', 'rejected'),
    ]);
    if (tradesRes.data) setTrades(tradesRes.data);
    if (lootRes.data) setLootboxes(lootRes.data);
    if (charRes.data) setCharacters(charRes.data.map(row => {
      let d = {};
      try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch (_) {}
      return { id: row.id, name: d.name || 'Unnamed', campaign: d.campaign || row.campaign_id };
    }));
    setLoading(false);
  };

  const respondToTrade = async (trade, status) => {
    setSaving(true);
    await supabase.from('trades').update({ status, dm_response_notes: responseNote, updated_at: new Date().toISOString() }).eq('id', trade.id);

    if (status === 'approved') {
      // Move offered items from initiator pack to counterparty, and vice versa (simplified: log to grimoire)
      const myItems = trade.trade_items?.filter(i => i.side === 'initiator') || [];
      const theirItems = trade.trade_items?.filter(i => i.side === 'counterparty') || [];

      // Remove offered items from initiator's pack
      for (const item of myItems) {
        if (item.from_pack_id) {
          await supabase.from('character_items').delete().eq('id', item.from_pack_id);
        }
      }
      // Add requested items to initiator's pack
      for (const item of theirItems) {
        await supabase.from('character_items').insert({
          character_id: trade.initiator_character_id,
          slot: `pack__${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
          name: item.item_name,
          description: `${item.item_category || 'Misc'}|${item.item_desc || ''}`,
          attuned: false, bonuses: {}, weight: item.qty || 1,
        });
      }
      // Grimoire log
      await supabase.from('grimoire_entries').insert({
        character_id: trade.initiator_character_id,
        campaign_id: campaignId,
        type: 'event',
        title: `Trade Approved — ${trade.counterparty_npc_name || 'Player'}`,
        content: `Your trade was approved by The Architect. You received: ${theirItems.map(i => i.item_name).join(', ') || 'nothing'}.${responseNote ? ` Architect's note: "${responseNote}"` : ''}`,
        is_dm: false,
        architect_note: responseNote || null,
      });
      // Message player
      await supabase.from('messages').insert({
        type: 'dm', is_dm: true, sender_name: 'The Architect',
        character_id: trade.initiator_character_id,
        campaign_id: campaignId,
        content: `Your trade proposal with ${trade.counterparty_npc_name || 'another player'} has been **approved**.${responseNote ? `\n\n"${responseNote}"` : ''}\n\nItems added to your pack.`,
        session_id: null,
      });
    } else if (status === 'declined' || status === 'countered') {
      await supabase.from('messages').insert({
        type: 'dm', is_dm: true, sender_name: 'The Architect',
        character_id: trade.initiator_character_id,
        campaign_id: campaignId,
        content: `Your trade proposal with ${trade.counterparty_npc_name || 'another player'} has been **${status}**.${responseNote ? `\n\n"${responseNote}"` : ''}`,
        session_id: null,
      });
    }

    setSaving(false);
    setResponding(null);
    setResponseNote('');
    showToast(`Trade ${status}.`);
    loadAll();
  };

  const assignAndReveal = async (box) => {
    setSaving(true);
    const items = box.lootbox_items || [];
    for (const item of items) {
      const charId = assignments[item.id];
      if (!charId) continue;
      await supabase.from('lootbox_items').update({
        claimed_by: String(charId),
        claim_status: 'approved',
      }).eq('id', item.id);
    }
    await supabase.from('lootboxes').update({ revealed: true }).eq('id', box.id);
    showToast('Loot assigned and revealed to players.');
    setDivvyBox(null);
    setAssignments({});
    loadAll();
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 500, maxHeight: '85vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>

      {toast && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 500000, background: '#1a1410', border: '1px solid rgba(200,168,74,0.6)', borderRadius: 10, padding: '12px 20px', fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      {/* Divvy modal */}
      {divvyBox && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', zIndex: 400000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#120e0a', border: `1px solid ${COLORS.border}`, borderRadius: 14, width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.text }}>DIVVY LOOT — {divvyBox.name}</div>
              <button onClick={() => { setDivvyBox(null); setAssignments({}); }} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
            </div>
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 14 }}>Assign each item to a character. Unassigned items won't be revealed.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(divvyBox.lootbox_items || []).map(item => (
                <div key={item.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, marginBottom: 6 }}>{item.item_name}{item.qty > 1 ? ` ×${item.qty}` : ''}</div>
                  {item.item_desc && <div style={{ fontSize: 9, color: COLORS.dim, fontStyle: 'italic', marginBottom: 8 }}>{item.item_desc}</div>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {characters.map(c => (
                      <button key={c.id} onClick={() => setAssignments(prev => ({ ...prev, [item.id]: prev[item.id] === c.id ? null : c.id }))}
                        style={{ background: assignments[item.id] === c.id ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${assignments[item.id] === c.id ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: assignments[item.id] === c.id ? '#e8c84a' : COLORS.dim }}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => assignAndReveal(divvyBox)} disabled={saving}
              style={{ width: '100%', marginTop: 16, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 8, padding: '10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.magicText, fontWeight: 700 }}>
              {saving ? 'Assigning…' : '✦ Assign & Reveal to Players'}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(200,168,74,0.15)', background: 'rgba(200,168,74,0.04)', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.16em', fontWeight: 700 }}>BAZAAR</div>
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Trade Oversight · Architect View</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[['trades', `Trades (${trades.filter(t => t.status === 'pending').length} pending)`], ['loot', `Loot (${lootboxes.length})`]].map(([v, lbl]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ background: view === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${view === v ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: view === v ? '#e8c84a' : COLORS.dim }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>Loading…</div>}

        {/* ── TRADES ── */}
        {!loading && view === 'trades' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trades.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No trade proposals yet.</div>}
            {trades.map(trade => {
              const sc = STATUS_COLOR[trade.status] || STATUS_COLOR.pending;
              const myItems = trade.trade_items?.filter(i => i.side === 'initiator') || [];
              const theirItems = trade.trade_items?.filter(i => i.side === 'counterparty') || [];
              const isOpen = expanded === trade.id;
              const isResponding = responding === trade.id;
              return (
                <div key={trade.id} style={{ border: `1px solid ${sc.border}`, borderRadius: 8, overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? null : trade.id)}
                    style={{ width: '100%', background: sc.bg, border: 'none', padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{trade.initiator_character_name} → {trade.counterparty_npc_name || trade.counterparty_character_name || 'Unknown'}</div>
                      <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>{new Date(trade.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '2px 7px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{trade.status}</div>
                      <div style={{ color: COLORS.dim, fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</div>
                    </div>
                  </button>
                  {isOpen && (
                    <div style={{ padding: '12px 14px', borderTop: `1px solid ${sc.border}` }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ ...label8(), marginBottom: 6 }}>Player offers</div>
                          {myItems.map(i => <div key={i.id} style={{ fontSize: 10, color: COLORS.text, marginBottom: 3 }}>• {i.item_name}{i.qty > 1 ? ` ×${i.qty}` : ''}</div>)}
                        </div>
                        <div>
                          <div style={{ ...label8(), marginBottom: 6 }}>Player requests</div>
                          {theirItems.map(i => <div key={i.id} style={{ fontSize: 10, color: COLORS.text, marginBottom: 3 }}>• {i.item_name}{i.qty > 1 ? ` ×${i.qty}` : ''}</div>)}
                        </div>
                      </div>
                      {trade.initiator_offer_notes && <div style={{ fontSize: 10, color: COLORS.muted, fontStyle: 'italic', marginBottom: 10 }}>"{trade.initiator_offer_notes}"</div>}

                      {trade.status === 'pending' && !isResponding && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setResponding(trade.id); }} style={{ flex: 1, background: 'rgba(200,168,74,0.12)', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 6, padding: '7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#e8c84a' }}>Respond</button>
                        </div>
                      )}

                      {isResponding && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <textarea value={responseNote} onChange={e => setResponseNote(e.target.value)}
                            rows={2} placeholder="Response note to player (optional)…"
                            style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => respondToTrade(trade, 'approved')} disabled={saving}
                              style={{ flex: 1, background: 'rgba(121,245,167,0.12)', border: '1px solid rgba(121,245,167,0.4)', borderRadius: 6, padding: '8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#79f5a7', fontWeight: 700 }}>
                              ✓ Approve
                            </button>
                            <button onClick={() => respondToTrade(trade, 'countered')} disabled={saving}
                              style={{ flex: 1, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.4)', borderRadius: 6, padding: '8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#7dd3fc' }}>
                              ↩ Counter
                            </button>
                            <button onClick={() => respondToTrade(trade, 'declined')} disabled={saving}
                              style={{ flex: 1, background: 'rgba(224,90,90,0.08)', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 6, padding: '8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#e05a5a' }}>
                              ✕ Decline
                            </button>
                          </div>
                          <button onClick={() => { setResponding(null); setResponseNote(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.dim }}>← Cancel</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── LOOT DIVVY ── */}
        {!loading && view === 'loot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lootboxes.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>No lootboxes.</div>}
            {lootboxes.map(box => (
              <div key={box.id} style={{ background: COLORS.card, border: '1px solid rgba(180,122,58,0.4)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8a84a' }}>{box.name}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <div style={{ fontSize: 7, color: box.revealed ? '#79f5a7' : COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>{box.revealed ? 'REVEALED' : 'SEALED'}</div>
                    <button onClick={() => { setDivvyBox(box); setAssignments({}); }}
                      style={{ background: 'rgba(200,168,74,0.12)', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: '#e8c84a' }}>
                      ⬡ Divvy
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 9, color: COLORS.dim }}>{(box.lootbox_items || []).length} item{(box.lootbox_items || []).length !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BazaarPlayerPanel;
