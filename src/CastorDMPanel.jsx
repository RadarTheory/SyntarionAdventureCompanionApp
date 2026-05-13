import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

const AXIS_COLOR = { magic: COLORS.magic, tech: COLORS.tech };

export default function CastorDMPanel({ onPendingChange, onClose }) {
  const [requests, setRequests]     = useState([]);
  const [filter, setFilter]         = useState('pending'); // 'pending' | 'all'
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [resolving, setResolving]   = useState(null);
  const [dmNotes, setDmNotes]       = useState({}); // { reqId: note }

  useEffect(() => {
    loadRequests();
    const sub = supabase.channel('castor-dm-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cast_requests' }, loadRequests)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const loadRequests = async () => {
    const { data } = await supabase.from('cast_requests').select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (data) {
      setRequests(data);
      onPendingChange?.(data.filter(r => r.status === 'pending').length);
    }
  };

  const resolve = async (req, status) => {
    if (resolving) return;
    setResolving(req.id);
    const note = dmNotes[req.id]?.trim() || null;

    await supabase.from('cast_requests').update({
      status,
      dm_note:      note,
      resolved_at:  new Date().toISOString(),
    }).eq('id', req.id);

    // Log result back to Hercules
    const { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(req.campaign_id)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (hsession?.id) {
      const verb = status === 'approved' ? 'APPROVED' : 'DENIED';
      await supabase.from('hercules_events').insert({
        session_id:  hsession.id,
        type:        'cast_resolved',
        actor_name:  'The Architect',
        actor_id:    null,
        description: `${verb}: ${req.character_name}'s request to cast ${req.ability_name} [${req.discipline_label}].${note ? ` Note: "${note}"` : ''}`,
        dm_approved: status === 'approved',
      });
    }

    setDmNotes(p => { const n = { ...p }; delete n[req.id]; return n; });
    setResolving(null);
    loadRequests();
  };

  const visible = requests.filter(r => {
    if (filter === 'pending' && r.status !== 'pending') return false;
    if (campaignFilter !== 'all' && r.campaign_id !== campaignFilter) return false;
    return true;
  });

  const pending = requests.filter(r => r.status === 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ ...label8() }}>
          Cast Requests {pending.length > 0 && <span style={{ color: COLORS.magic, marginLeft: 6 }}>({pending.length} pending)</span>}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {[['pending','Pending'],['all','All']].map(([v,lbl]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ background: filter===v ? 'rgba(56,189,248,0.12)' : 'transparent', border: `1px solid ${filter===v ? 'rgba(56,189,248,0.4)' : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: filter===v ? '#7dd3fc' : COLORS.dim }}>{lbl}</button>
          ))}
        </div>
      </div>
      {onClose && (
  <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
)}

      {/* Campaign filter */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 14 }}>
        {[{ id: 'all', subtitle: 'All' }, ...CAMPAIGNS].map(c => (
          <button key={c.id} onClick={() => setCampaignFilter(c.id)} style={{ background: campaignFilter===c.id ? COLORS.surface : 'transparent', border: `1px solid ${campaignFilter===c.id ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: campaignFilter===c.id ? COLORS.text : COLORS.dim }}>{c.subtitle}</button>
        ))}
      </div>

      {/* Request list */}
      {visible.length === 0 && (
        <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {filter === 'pending' ? 'No pending cast requests.' : 'No cast requests found.'}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {visible.map(req => {
          const axisCol = AXIS_COLOR[req.axis] || COLORS.muted;
          const isPending = req.status === 'pending';
          return (
            <div key={req.id} style={{ background: isPending ? 'rgba(56,189,248,0.04)' : COLORS.card, border: `1px solid ${isPending ? 'rgba(56,189,248,0.25)' : COLORS.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {/* Request header */}
              <div style={{ padding: '12px 14px', borderBottom: isPending ? '1px solid rgba(56,189,248,0.12)' : `1px solid ${COLORS.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.text, fontWeight: 700 }}>{req.ability_name}</div>
                    <div style={{ fontSize: 8, color: axisCol, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', marginTop: 2 }}>{req.discipline_label} · {req.axis}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isPending ? (
                      <div style={{ fontSize: 7, color: '#7dd3fc', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 3, padding: '2px 6px', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>AWAITING</div>
                    ) : (
                      <div style={{ fontSize: 7, color: req.status === 'approved' ? COLORS.magic : '#e05a5a', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>
                        {req.status === 'approved' ? '✓ APPROVED' : '✕ DENIED'}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                  <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: 'Georgia, serif' }}>
                    <span style={{ color: COLORS.text }}>{req.character_name}</span>
                  </div>
                  <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>
                    {req.cost} {req.currency_key}
                  </div>
                  {req.modifier !== 0 && (
                    <div style={{ fontSize: 9, color: axisCol, fontFamily: "'Cinzel', serif" }}>
                      mod {req.modifier >= 0 ? '+' : ''}{req.modifier}
                    </div>
                  )}
                  <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', marginLeft: 'auto' }}>
                    {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                {req.dm_note && !isPending && (
                  <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 6 }}>"{req.dm_note}"</div>
                )}
              </div>

              {/* DM action area — only for pending */}
              {isPending && (
                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    value={dmNotes[req.id] || ''}
                    onChange={e => setDmNotes(p => ({ ...p, [req.id]: e.target.value }))}
                    placeholder="DM note (optional, sent to player)…"
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '6px 9px', fontFamily: 'Georgia, serif', fontSize: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => resolve(req, 'approved')} disabled={resolving === req.id}
                      style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px', cursor: resolving === req.id ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.magicText, fontWeight: 700, letterSpacing: '0.1em' }}>
                      {resolving === req.id ? '…' : '✓ Approve'}
                    </button>
                    <button onClick={() => resolve(req, 'denied')} disabled={resolving === req.id}
                      style={{ flex: 1, background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.35)', borderRadius: 6, padding: '8px', cursor: resolving === req.id ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e05a5a', fontWeight: 700, letterSpacing: '0.1em' }}>
                      {resolving === req.id ? '…' : '✕ Deny'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
