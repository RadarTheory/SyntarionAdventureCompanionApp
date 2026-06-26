import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// ─── SOTERIA TRAVEL REFERENCE ─────────────────────────────────────────────────
// Lark flight speed: ~175 miles per turn (day) in good conditions
// Weather/season penalty: +20-50% in winter/storms
const LARK_SPEED_MILES_PER_TURN = 175;

// Rough distance table by destination keyword (miles from central Veridora/Ashendell)
const DISTANCE_TABLE = [
  { keywords: ['ashendell', 'veridora', 'local', 'city', 'town'], miles: 0,    label: 'local' },
  { keywords: ['gamdon', 'corren', 'mountain', 'mines'], miles: 200,           label: 'nearby' },
  { keywords: ['lumina', 'port', 'haldane', 'coastal'], miles: 400,            label: 'regional' },
  { keywords: ['caerlŷf', 'caerlyf', 'sylvan', 'grove', 'elmoire'], miles: 600, label: 'distant' },
  { keywords: ['beranthes', 'lighthouse', 'epham'], miles: 800,                label: 'far' },
  { keywords: ['makeda', 'kwetu', 'southern'], miles: 1200,                    label: 'very far' },
  { keywords: ['lutetia', 'zhallakan', 'island', 'novahr', 'northern'], miles: 1500, label: 'distant land' },
  { keywords: ['cielo', 'dorado', 'nariath', 'western'], miles: 2500,          label: 'cross-continent' },
  { keywords: ['corranh', 'eastern', 'far east'], miles: 5000,                 label: 'intercontinental' },
];

function estimateDelivery(recipientName) {
  if (!recipientName) return null;
  const lower = recipientName.toLowerCase();
  let matched = DISTANCE_TABLE[1]; // default nearby

  for (const entry of DISTANCE_TABLE) {
    if (entry.keywords.some(k => lower.includes(k))) {
      matched = entry;
      break;
    }
  }

  if (matched.miles === 0) return 'Same city — delivered within the same turn.';

  const baseTurns = Math.ceil(matched.miles / LARK_SPEED_MILES_PER_TURN);
  const minTurns = Math.max(1, baseTurns - 1);
  const maxTurns = baseTurns + 1;

  return `A Lark bound for ${matched.label} destinations would arrive in approximately ${minTurns}–${maxTurns} turns${baseTurns > 5 ? ', weather permitting' : ''}.`;
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  in_flight: { label: 'In Flight',  color: '#e8c84a', bg: 'rgba(232,200,74,0.10)'  },
  delivered: { label: 'Delivered',  color: '#79f5a7', bg: 'rgba(121,245,167,0.10)' },
  replied:   { label: 'Replied',    color: '#79b4f5', bg: 'rgba(121,180,245,0.10)' },
};

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.in_flight;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: s.bg, border: `1px solid ${s.color}44`, borderRadius: 20, padding: '2px 8px', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', color: s.color }}>
      {s.label}
    </div>
  );
}

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// ─── COMPOSE FORM ─────────────────────────────────────────────────────────────
function ComposeForm({ char, campaignId, npcs, players, onSent, onCancel, isDM }) {
  const [recipientType, setRecipientType] = useState('npc');
  const [recipientName, setRecipientName] = useState('');
  const [recipientId, setRecipientId]     = useState('');
  const [subject, setSubject]             = useState('');
  const [body, setBody]                   = useState('');
  const [sending, setSending]             = useState(false);
  const [estimate, setEstimate]           = useState(null);
  const [warned, setWarned]               = useState(false);

  useEffect(() => {
    if (recipientName) setEstimate(estimateDelivery(recipientName));
    else setEstimate(null);
  }, [recipientName]);

  const send = async () => {
    if (!body.trim() || !recipientName.trim()) return;
    if (recipientType === 'player' && !warned) { setWarned(true); return; }
    setSending(true);
    await supabase.from('larks').insert({
      campaign_id:    String(campaignId),
      sender_id:      char?.id ? String(char.id) : null,
      sender_name:    char?.name || 'Unknown',
      recipient_type: recipientType,
      recipient_name: recipientName.trim(),
      recipient_id:   recipientId || null,
      subject:        subject.trim() || null,
      body:           body.trim(),
      delivery_estimate: estimate,
      status:         'in_flight',
    });
    setSending(false);
    onSent();
  };

  const npcList = npcs || [];
  const playerList = players || [];

  return (
    <div style={{ background: COLORS.surface, border: `1px solid rgba(200,168,74,0.3)`, borderRadius: 10, padding: '16px' }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a', letterSpacing: '0.12em', marginBottom: 14 }}>✉ Compose a Lark</div>

      {/* Recipient type */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[['npc', '◈ To NPC'], ['player', '⬡ To Player']].map(([val, lbl]) => (
          <button key={val} onClick={() => { setRecipientType(val); setRecipientName(''); setRecipientId(''); setWarned(false); }}
            style={{ flex: 1, background: recipientType === val ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${recipientType === val ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 6, padding: '7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: recipientType === val ? '#e8c84a' : COLORS.dim, letterSpacing: '0.08em' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Player-to-player warning */}
      {recipientType === 'player' && warned && (
        <div style={{ background: 'rgba(232,200,74,0.08)', border: '1px solid rgba(232,200,74,0.3)', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c84a', marginBottom: 4 }}>⚠ The Architect can read all Larks</div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5 }}>All letters sent through the Lark system are visible to the DM as part of the world's story record. Send anyway?</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={send} style={{ flex: 1, background: 'rgba(200,168,74,0.18)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c84a' }}>Send Anyway</button>
            <button onClick={() => setWarned(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Cancel</button>
          </div>
        </div>
      )}

      {!warned && (
        <>
          {/* Recipient */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...label8(), marginBottom: 5 }}>
              {recipientType === 'npc' ? 'NPC Name / Location' : 'Player Character'}
            </div>
            {recipientType === 'npc' ? (
              <>
                <input value={recipientName} onChange={e => setRecipientName(e.target.value)}
                  placeholder="e.g. Haruki Ardentbrin in Gamdon, or any NPC name…"
                  style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 11, outline: 'none', boxSizing: 'border-box' }} />
                {npcList.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                    {npcList.slice(0, 12).map(n => (
                      <button key={n.id || n.name} onClick={() => setRecipientName(n.name)}
                        style={{ background: recipientName === n.name ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${recipientName === n.name ? 'rgba(200,168,74,0.4)' : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 10, color: recipientName === n.name ? '#e8c84a' : COLORS.muted }}>
                        {n.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <select value={recipientId} onChange={e => { const p = playerList.find(p => String(p.id) === e.target.value); setRecipientId(e.target.value); setRecipientName(p?.name || ''); }}
                style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 11, outline: 'none' }}>
                <option value="">— Select player —</option>
                {playerList.filter(p => String(p.id) !== String(char?.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Delivery estimate */}
          {estimate && (
            <div style={{ background: 'rgba(200,168,74,0.06)', border: '1px solid rgba(200,168,74,0.18)', borderRadius: 6, padding: '7px 10px', marginBottom: 10 }}>
              <div style={{ fontSize: 9, color: '#e8c84a', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5 }}>
                🪶 {estimate}
              </div>
            </div>
          )}

          {/* Subject */}
          <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)…"
            style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 11, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />

          {/* Body */}
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your letter…" rows={5}
            style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7, marginBottom: 10 }} />

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={send} disabled={sending || !body.trim() || !recipientName.trim()}
              style={{ flex: 1, background: 'rgba(200,168,74,0.16)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 7, padding: '9px', cursor: sending || !body.trim() || !recipientName.trim() ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c84a', fontWeight: 700, letterSpacing: '0.1em', opacity: sending || !body.trim() || !recipientName.trim() ? 0.5 : 1 }}>
              {sending ? 'Sending…' : '🪶 Send Lark'}
            </button>
            <button onClick={onCancel} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Cancel</button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── LARK CARD ────────────────────────────────────────────────────────────────
function LarkCard({ lark, isDM, onReply, onDeliver }) {
  const [open, setOpen]   = useState(false);
  const [reply, setReply] = useState('');
  const [saving, setSaving] = useState(false);

  const submitReply = async () => {
    if (!reply.trim()) return;
    setSaving(true);
    await supabase.from('larks').update({
      reply: reply.trim(),
      status: 'replied',
      replied_at: new Date().toISOString(),
    }).eq('id', lark.id);
    setSaving(false);
    onReply?.();
  };

  const deliver = async () => {
    await supabase.from('larks').update({ status: 'delivered' }).eq('id', lark.id);
    onDeliver?.();
  };

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${open ? 'rgba(200,168,74,0.35)' : COLORS.border}`, borderRadius: 8, marginBottom: 6, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
        <div style={{ fontSize: 16, flexShrink: 0 }}>🪶</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.muted, letterSpacing: '0.08em' }}>
              {lark.sender_name} → {lark.recipient_name}
            </div>
            <StatusBadge status={lark.status} />
          </div>
          {lark.subject && (
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{lark.subject}"</div>
          )}
          <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>
            {new Date(lark.created_at).toLocaleDateString()}
            {lark.recipient_type === 'player' && <span style={{ color: '#e8c84a', marginLeft: 6 }}>· Player-to-Player</span>}
          </div>
        </div>
        <div style={{ fontSize: 10, color: COLORS.dim, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</div>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${COLORS.border}` }}>
          {lark.delivery_estimate && (
            <div style={{ margin: '10px 0 8px', padding: '6px 10px', background: 'rgba(200,168,74,0.06)', border: '1px solid rgba(200,168,74,0.15)', borderRadius: 6, fontSize: 9, color: '#e8c84a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              🪶 {lark.delivery_estimate}
            </div>
          )}
          <p style={{ fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.75, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{lark.body}</p>

          {lark.reply && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(121,180,245,0.07)', border: '1px solid rgba(121,180,245,0.25)', borderRadius: 6 }}>
              <div style={{ ...label8(), color: '#79b4f5', marginBottom: 6 }}>Reply from {lark.recipient_name}</div>
              <p style={{ fontSize: 11, color: '#b8d4f5', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{lark.reply}</p>
              {lark.replied_at && <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 6 }}>{new Date(lark.replied_at).toLocaleDateString()}</div>}
            </div>
          )}

          {isDM && lark.status === 'in_flight' && (
            <button onClick={deliver} style={{ marginTop: 10, background: 'rgba(121,245,167,0.1)', border: '1px solid rgba(121,245,167,0.3)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#79f5a7', letterSpacing: '0.1em' }}>
              ✓ Mark Delivered
            </button>
          )}

          {isDM && lark.recipient_type === 'npc' && lark.status !== 'replied' && (
            <div style={{ marginTop: 12 }}>
              <div style={{ ...label8(), marginBottom: 6 }}>Reply as {lark.recipient_name}</div>
              <textarea value={reply} onChange={e => setReply(e.target.value)} placeholder={`Write ${lark.recipient_name}'s reply…`} rows={3}
                style={{ width: '100%', background: COLORS.surface, border: '1px solid rgba(121,180,245,0.25)', borderRadius: 6, padding: '8px 10px', color: '#b8d4f5', fontFamily: 'Georgia, serif', fontSize: 11, fontStyle: 'italic', outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.6, marginBottom: 8 }} />
              <button onClick={submitReply} disabled={saving || !reply.trim()}
                style={{ width: '100%', background: 'rgba(121,180,245,0.12)', border: '1px solid rgba(121,180,245,0.4)', borderRadius: 7, padding: '8px', cursor: saving || !reply.trim() ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#79b4f5', opacity: saving || !reply.trim() ? 0.5 : 1 }}>
                {saving ? 'Sending…' : `✉ Send Reply as ${lark.recipient_name}`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── LARK PANEL ───────────────────────────────────────────────────────────────
export default function LarkPanel({ char, campaignId, isDM = false, embedded = false }) {
  const [larks, setLarks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [composing, setComposing] = useState(false);
  const [tab, setTab]             = useState('inbox'); // 'inbox' | 'sent' | (isDM) 'all'
  const [npcs, setNpcs]           = useState([]);
  const [players, setPlayers]     = useState([]);

  useEffect(() => {
    loadLarks();
    // Load NPCs from window event system
    window.dispatchEvent(new CustomEvent('census:request_snapshot'));
    const h = e => setNpcs(e.detail?.npcs || []);
    window.addEventListener('census:npc_snapshot', h);

    // Load players
    supabase.from('characters').select('id, name').eq('campaign_id', String(campaignId)).then(({ data }) => {
      if (data) setPlayers(data);
    });

    const sub = supabase.channel(`larks-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'larks', filter: `campaign_id=eq.${campaignId}` }, loadLarks)
      .subscribe();
    return () => { supabase.removeChannel(sub); window.removeEventListener('census:npc_snapshot', h); };
  }, [campaignId]);

 const loadLarks = async () => {
  setLoading(true);
  let q = supabase.from('larks').select('*')
    .eq('campaign_id', String(campaignId))
    .order('created_at', { ascending: false });
  if (!isDM) {
    const cid = char?.id ? String(char.id) : null;
    if (!cid) { setLarks([]); setLoading(false); return; }
    // Players only see larks they sent OR larks explicitly addressed to them by ID
    // NPC larks addressed by name are only visible to the sender
    q = q.or(`sender_id.eq.${cid},and(recipient_id.eq.${cid},recipient_type.eq.player)`);
  }
  const { data } = await q;
  if (data) setLarks(data);
  setLoading(false);
};

  const charIdStr = char?.id ? String(char.id) : null;

  const inboxLarks = larks.filter(l =>
    l.recipient_id === charIdStr ||
    (l.recipient_type === 'player' && l.recipient_name === char?.name && l.recipient_id === charIdStr)
  );
  const sentLarks = larks.filter(l => l.sender_id === charIdStr);

  const tabs = isDM
    ? [['all', 'All Larks'], ['npc', 'NPC Replies Needed']]
    : [['inbox', `Inbox (${inboxLarks.length})`], ['sent', 'Sent']];

  const displayLarks = isDM
    ? (tab === 'npc' ? larks.filter(l => l.recipient_type === 'npc' && l.status !== 'replied') : larks)
    : (tab === 'inbox' ? inboxLarks : sentLarks);

  const inner = (
    <>
      {/* Tabs + compose */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          {tabs.map(([val, lbl]) => (
            <button key={val} onClick={() => setTab(val)}
              style={{ background: tab === val ? 'rgba(200,168,74,0.12)' : 'transparent', border: `1px solid ${tab === val ? 'rgba(200,168,74,0.4)' : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: tab === val ? '#e8c84a' : COLORS.dim }}>
              {lbl}
            </button>
          ))}
          {!isDM && (
            <button onClick={() => setComposing(o => !o)}
              style={{ marginLeft: 'auto', background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.45)', borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: '#e8c84a' }}>
              🪶 Write
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {composing && !isDM && (
          <div style={{ marginBottom: 14 }}>
            <ComposeForm
              char={char}
              campaignId={campaignId}
              npcs={npcs}
              players={players}
              onSent={() => { setComposing(false); loadLarks(); setTab('sent'); }}
              onCancel={() => setComposing(false)}
              isDM={isDM}
            />
          </div>
        )}

        {loading && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>Loading larks…</div>
        )}

        {!loading && displayLarks.length === 0 && !composing && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.3 }}>🪶</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.dim, letterSpacing: '0.1em' }}>
              {tab === 'inbox' ? 'No letters received.' : tab === 'sent' ? 'No letters sent.' : 'No larks yet.'}
            </div>
            {tab === 'inbox' && (
              <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 6 }}>Attach a letter to a Lark and send it into the world.</div>
            )}
          </div>
        )}

        {!loading && displayLarks.map(lark => (
          <LarkCard key={lark.id} lark={lark} isDM={isDM} onReply={loadLarks} onDeliver={loadLarks} />
        ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: COLORS.wizard }}>
        {inner}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 400, maxHeight: '82vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: COLORS.wizard, border: `1px solid rgba(200,168,74,0.3)`, borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(200,168,74,0.14)`, background: 'rgba(200,168,74,0.04)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.18em', fontWeight: 700 }}>LARK</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{char?.name} · Letters & Correspondence</div>
        </div>
      </div>
      {inner}
    </div>
  );
}
