import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// Call this when player enters/stays on Loot tab to register presence
async function pingLootPresence(campaignId, char) {
  if (!campaignId || !char?.id) return;
  await supabase.from('loot_presence').upsert({
    campaign_id: String(campaignId),
    character_id: String(char.id),
    character_name: char.name || char.character_name || 'Player',
    last_seen: new Date().toISOString(),
  }, { onConflict: 'campaign_id,character_id' });
}

export default function LootboxPanel({ campaignId, userChar, onClaimed }) {
  const [boxes, setBoxes] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [boxItems, setBoxItems] = useState({});
  const [claiming, setClaiming] = useState(null);
  const [claimDone, setClaimDone] = useState([]);
  const [toast, setToast] = useState(null);
  const pingRef = useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 5000); };

  // Ping presence on mount and every 60s
  useEffect(() => {
    pingLootPresence(campaignId, userChar);
    pingRef.current = setInterval(() => pingLootPresence(campaignId, userChar), 60000);
    return () => {
      clearInterval(pingRef.current);
      // Remove presence on unmount
      if (campaignId && userChar?.id) {
        supabase.from('loot_presence')
          .delete()
          .eq('campaign_id', String(campaignId))
          .eq('character_id', String(userChar.id));
      }
    };
  }, [campaignId, userChar?.id]);

  const load = async () => {
    const { data } = await supabase
      .from('lootboxes')
      .select('*')
      .eq('claimed', false)
      .or(`campaign_id.eq.${campaignId},campaign_id.is.null`)
      .order('created_at', { ascending: false });
    if (data) setBoxes(data);
  };

  useEffect(() => {
    load();
    const sub = supabase.channel(`lootboxes-player-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootboxes' }, (payload) => {
        // Toast when a box gets revealed
        if (payload.new?.revealed && !payload.old?.revealed) {
          showToast(`⬡ The Architect has revealed: ${payload.new.name}`);
        }
        load();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lootbox_items' }, () => {
        // Reload items for expanded box
        if (expanded) {
          loadItems(expanded, true);
        }
      })
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId, expanded]);

  const loadItems = async (boxId, force = false) => {
    if (boxItems[boxId] && !force) return;
    const { data } = await supabase
      .from('lootbox_items')
      .select('*')
      .eq('lootbox_id', boxId)
      .order('created_at', { ascending: true });
    if (data) setBoxItems(prev => ({ ...prev, [boxId]: data }));
  };

  const toggleExpand = (box) => {
    if (expanded === box.id) { setExpanded(null); return; }
    if (!box.revealed) return; // can't expand unrevealed
    setExpanded(box.id);
    loadItems(box.id);
  };

  const claimItem = async (box, item) => {
    if (!userChar?.id || claiming) return;

    const isMulti = box.reveal_mode === 'multi';

    if (isMulti) {
      // Multi-player: submit pending claim, wait for DM approval
      setClaiming(item.id);
      await supabase.from('lootbox_items').update({
        claimed_by: String(userChar.id),
        claim_status: 'pending',
        claimed_at: new Date().toISOString(),
      }).eq('id', item.id);
      loadItems(box.id, true);
      setClaiming(null);
      showToast(`⏳ Claim requested for ${item.item_name} — awaiting Architect approval`);
    } else {
      // Single player: direct claim, no approval needed
      setClaiming(item.id);
      await supabase.from('character_items').insert({
        character_id: String(userChar.id),
        slot: `pack__${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: item.item_name,
        description: `${item.item_category || 'Misc'}|${item.item_desc || ''}${item.note ? ' — ' + item.note : ''}`,
        attuned: false,
        bonuses: {},
        weight: item.qty || 1,
      });

      await supabase.from('lootbox_items').update({
        claimed_by: String(userChar.id),
        claim_status: 'approved',
        claimed_at: new Date().toISOString(),
      }).eq('id', item.id);

      // Check if all items claimed
      const { data: remaining } = await supabase
        .from('lootbox_items')
        .select('id, claim_status')
        .eq('lootbox_id', box.id);

      const allDone = remaining?.every(r => r.claim_status === 'approved' || r.claim_status === 'denied');
      if (allDone) {
        await supabase.from('lootboxes').update({
          claimed: true,
          claimed_by: String(userChar.id),
          claimed_at: new Date().toISOString(),
        }).eq('id', box.id);
        setClaimDone(prev => [...prev, box.id]);
        setBoxes(prev => prev.filter(b => b.id !== box.id));
      }

      loadItems(box.id, true);
      setClaiming(null);
      showToast(`✓ ${item.item_name} added to your pack`);
      onClaimed?.();
    }
  };

  const unrevealed = boxes.filter(b => !b.revealed);
  const revealed = boxes.filter(b => b.revealed);

  if (boxes.length === 0 && claimDone.length === 0) {
    return (
      <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, marginBottom: 10 }}>⬡</div>
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          No lootboxes waiting. The Architect will place rewards here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
          zIndex: 99999, background: '#1a1410',
          border: '1px solid rgba(200,168,74,0.6)',
          borderRadius: 10, padding: '14px 20px',
          fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          whiteSpace: 'nowrap',
          animation: 'solomonFadeIn 0.3s ease',
        }}>
          {toast}
        </div>
      )}

      <style>{`
        @keyframes solomonFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {claimDone.length > 0 && (
          <div style={{ background: 'rgba(200,168,74,0.06)', border: '1px solid rgba(200,168,74,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 10, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            ✦ {claimDone.length} box{claimDone.length > 1 ? 'es' : ''} claimed this session.
          </div>
        )}

        {/* Unrevealed boxes — hidden contents */}
        {unrevealed.map(box => (
          <div key={box.id} style={{
            background: COLORS.card,
            border: '1px solid rgba(100,80,50,0.4)',
            borderRadius: 10, overflow: 'hidden',
            opacity: 0.7,
          }}>
            <div style={{
              padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 20, lineHeight: 1, filter: 'grayscale(1)' }}>⬡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.dim, letterSpacing: '0.08em' }}>
                  {box.name}
                </div>
                <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 3 }}>
                  Sealed — the Architect has not yet revealed the contents.
                </div>
              </div>
              <div style={{
                fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif",
                letterSpacing: '0.1em', textTransform: 'uppercase',
                border: `1px solid ${COLORS.border}`, borderRadius: 4,
                padding: '3px 7px',
              }}>
                SEALED
              </div>
            </div>
          </div>
        ))}

        {/* Revealed boxes — contents visible */}
        {revealed.map(box => {
          const isOpen = expanded === box.id;
          const items = boxItems[box.id] || [];
          const isMulti = box.reveal_mode === 'multi';

          return (
            <div key={box.id} style={{
              background: COLORS.card,
              border: '1px solid rgba(180,122,58,0.5)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              <button onClick={() => toggleExpand(box)} style={{
                width: '100%', background: 'rgba(180,122,58,0.08)',
                border: 'none', borderBottom: isOpen ? '1px solid rgba(180,122,58,0.2)' : 'none',
                padding: '14px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 18, lineHeight: 1 }}>⬡</div>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8a84a', letterSpacing: '0.08em' }}>
                      {box.name}
                    </div>
                    <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
                      {isMulti
                        ? 'Open to party — Architect approves each claim'
                        : 'Yours to claim — items go directly to pack'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 7, color: '#e8a84a', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', border: '1px solid rgba(200,168,74,0.4)', borderRadius: 4, padding: '2px 6px' }}>
                    REVEALED
                  </div>
                  <div style={{ color: '#e8a84a', fontSize: 10, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>▾</div>
                </div>
              </button>

              {isOpen && (
                <div style={{ padding: '14px 16px' }}>
                  {items.length === 0 ? (
                    <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '8px 0' }}>Loading contents…</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {items.map((item, i) => {
                        const isMine = item.claimed_by === String(userChar?.id);
                        const isPending = item.claim_status === 'pending';
                        const isApproved = item.claim_status === 'approved';
                        const isClaiming = claiming === item.id;
                        const canClaim = item.claim_status === 'unclaimed' && !isClaiming;

                        return (
                          <div key={item.id || i} style={{
                            display: 'flex', gap: 10, padding: '10px 12px',
                            background: isApproved ? 'rgba(121,245,167,0.05)' : isPending && isMine ? 'rgba(200,168,74,0.05)' : 'rgba(255,255,255,0.025)',
                            borderRadius: 6,
                            border: `1px solid ${
                              isApproved ? 'rgba(121,245,167,0.3)' :
                              isPending && isMine ? 'rgba(200,168,74,0.3)' :
                              COLORS.border
                            }`,
                          }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{item.item_name}</div>
                                {item.item_category && <div style={{ fontSize: 7, color: COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>{item.item_category}</div>}
                                {item.qty > 1 && <div style={{ fontSize: 8, color: '#e8c84a', fontFamily: "'Cinzel', serif" }}>×{item.qty}</div>}
                              </div>
                              {item.item_desc && <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 3 }}>{item.item_desc}</div>}
                              {item.note && <div style={{ fontSize: 9, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 3 }}>"{item.note}"</div>}
                            </div>

                            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                              {isApproved && (
                                <div style={{ fontSize: 8, color: '#79f5a7', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>✓ IN PACK</div>
                              )}
                              {isPending && isMine && (
                                <div style={{ fontSize: 8, color: '#e8a84a', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>⏳ PENDING</div>
                              )}
                              {isPending && !isMine && (
                                <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>Claimed by other</div>
                              )}
                              {canClaim && (
                                <button
                                  onClick={() => claimItem(box, item)}
                                  style={{
                                    background: 'rgba(180,122,58,0.18)',
                                    border: '1px solid rgba(180,122,58,0.6)',
                                    borderRadius: 5, padding: '5px 12px',
                                    cursor: 'pointer',
                                    fontFamily: "'Cinzel', serif", fontSize: 8,
                                    color: '#e8a84a', letterSpacing: '0.06em',
                                  }}
                                >
                                  {isMulti ? '⬡ Request' : '⬡ Claim'}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
