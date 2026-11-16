// The census's view of how one NPC feels about each character (NPCPanel.jsx): the tier, the number and every reason,
// with buttons to record what passes between them (data.regard[npcId] on the character). The DM sees all of this;
// players only ever see the tier word (CharacterSheetPage.jsx).
import { useEffect, useState } from 'react';
import supabase from './lib/supabase';
import { reactionOf, loadReputations } from './reactions';

const blob = d => (typeof d === 'string' ? JSON.parse(d || '{}') : (d || {}));

export default function NpcReactions({ npc, cityName, campaignId }) {
  const [chars, setChars] = useState(null);
  const [reputations, setReputations] = useState([]);
  const [open, setOpen] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    let q = supabase.from('characters').select('id, data, campaign_id, status');
    q = campaignId ? q.eq('campaign_id', String(campaignId)) : q.not('campaign_id', 'is', null);
    Promise.all([q, loadReputations()]).then(([{ data }, reps]) => {
      if (!live) return;
      setReputations(reps);
      setChars((data || []).filter(r => r.status !== 'rejected').map(r => ({ ...blob(r.data), id: r.id })).sort((x, y) => String(x.name).localeCompare(String(y.name))));
    });
    return () => { live = false; };
  }, [campaignId]);

  // What passes between them: read the character fresh and change only regard[npc], so the player's own edits are kept.
  const nudge = async (charId, delta) => {
    setError('');
    const { data: row, error: readError } = await supabase.from('characters').select('data').eq('id', charId).maybeSingle();
    if (readError || !row) { setError(readError?.message || 'Character not found.'); return; }
    const d = blob(row.data);
    const regard = { ...(d.regard || {}), [npc.id]: Math.max(-50, Math.min(50, (Number(d.regard?.[npc.id]) || 0) + delta)) };
    const { data: saved, error: saveError } = await supabase.from('characters').update({ data: { ...d, regard } }).eq('id', charId).select('id');
    if (saveError || !saved?.length) { setError(saveError?.message || 'A database policy blocked this update.'); return; }
    setChars(list => list.map(c => (c.id === charId ? { ...c, regard } : c)));
  };

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(184,137,42,0.85)', marginBottom: 6 }}>
        Reactions{campaignId ? '' : ' · all campaigns'}
      </div>
      {!chars ? <div style={{ fontSize: 10, color: '#7a6a55', fontStyle: 'italic' }}>Reading the room…</div>
        : !chars.length ? <div style={{ fontSize: 10, color: '#7a6a55', fontStyle: 'italic' }}>No characters to react to.</div>
        : chars.map(c => {
          const r = reactionOf(c, npc, { cityName, reputations });
          const isOpen = open === c.id;
          return (
            <div key={c.id} style={{ borderBottom: '1px solid rgba(184,137,42,0.12)', padding: '5px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => setOpen(isOpen ? null : c.id)} aria-expanded={isOpen} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: '#d8ccb8', fontFamily: 'Georgia, serif', fontSize: 11 }}>
                  {c.name || 'Unnamed'} <span style={{ color: r.tier.color, fontFamily: "'Cinzel', serif", fontSize: 10, marginLeft: 6 }}>{r.tier.word}</span>
                  <span style={{ color: '#7a6a55', fontSize: 9, marginLeft: 6 }}>{r.score}</span>
                </button>
                <button onClick={() => nudge(c.id, -5)} title="Something soured between them (−5)" aria-label={`Lower ${npc.name}'s regard for ${c.name}`} style={nudgeBtn}>−</button>
                <button onClick={() => nudge(c.id, 5)} title="Something warmed between them (+5)" aria-label={`Raise ${npc.name}'s regard for ${c.name}`} style={nudgeBtn}>+</button>
              </div>
              {isOpen && (
                <div style={{ margin: '4px 0 2px 8px', fontSize: 10, color: '#a89880', fontFamily: 'Georgia, serif', lineHeight: 1.6 }}>
                  <div>Starts at 50</div>
                  {r.parts.length ? r.parts.map(p => (
                    <div key={p.label}><span style={{ color: p.amount > 0 ? '#8fb89a' : '#d98a6a', display: 'inline-block', minWidth: 30 }}>{p.amount > 0 ? '+' : ''}{p.amount}</span>{p.label}</div>
                  )) : <div style={{ fontStyle: 'italic' }}>Nothing moves them either way.</div>}
                </div>
              )}
            </div>
          );
        })}
      {error && <div style={{ fontSize: 10, color: '#CD5C5C', marginTop: 4 }}>{error}</div>}
    </div>
  );
}

const nudgeBtn = { width: 22, height: 22, background: 'rgba(184,137,42,0.08)', border: '1px solid rgba(184,137,42,0.35)', borderRadius: 4, color: '#c8a84a', cursor: 'pointer', fontSize: 12, lineHeight: 1, padding: 0 };
