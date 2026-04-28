import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_CLASSES, ALL_STATS, getRaceDisplay } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const DM_USER_ID = import.meta.env.VITE_DM_USER_ID;
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const FULL_TITLES = {
  'I':   'The Investigation of the Corren Mountain Mines',
  'II':  'The Keys of Aerithos', 
  'III': 'The Trouble in Gamdon',
  'IV':  'Frozen Sick in Galekgarde',
};

const SOTERIA_DM_CONTEXT = `
You are The Scribe — an ancient archival intelligence in the world of Soteria, 178 Era of Unity.
You are assisting the Dungeon Master (Architect) of this world.

THE WORLD:
- Soteria is a steampunk-fantasy world where the Veinrunner railway cuts through ancient territories
- Four campaigns: Campaign I (Corren Mountain Mines), Campaign II (Keys of Aerithos), Campaign III (Gamdon), Campaign IV (Galekgarde)
- Major factions: Sovereign Kingdom, Auric Order, Ylandarian Order, Grimrock Clan, Cult of Thorns
- Grimrite is a rare enchantable resource disappearing from circulation
- The four Lines (Ciruson, Reynu, Lucan, Serid) are cosmic threads visible only to certain individuals

AS DM ASSISTANT:
- Provide detailed, specific, useful answers
- Help with NPC creation, plot hooks, encounter design, lore clarification
- Generate session notes, descriptions, and narrative content
- You may speak plainly and directly to the DM — no need to maintain The Scribe's cryptic player-facing persona
- Be thorough, creative, and specific to the Soteria setting
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function StatusBadge({ status }) {
  const map = {
    draft:              { label: 'Draft',             color: COLORS.dim,   bg: 'rgba(131,115,100,0.12)' },
    awaiting_adventure: { label: 'Awaiting',          color: COLORS.deity, bg: COLORS.deityBg           },
    approved:           { label: 'Approved',          color: COLORS.magic, bg: COLORS.magicBg           },
    rejected:           { label: 'Rejected',          color: COLORS.warn,  bg: COLORS.warnBg            },
  };
  const s = map[status] || map.draft;
  return (
    <div style={{ display: 'inline-block', fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", color: s.color, background: s.bg, border: `1px solid ${s.color}`, borderRadius: 4, padding: '2px 7px' }}>
      {s.label}
    </div>
  );
}

// ─── CHAT PANEL ───────────────────────────────────────────────────────────────
function ChatPanel({ session, onClose, isDM }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!session) return;
    fetchMessages();
    const channel = supabase
      .channel(`session-${session.session_id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${session.session_id}` }, () => fetchMessages())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [session]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', session.session_id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await supabase.from('messages').insert({
      session_id: session.session_id,
      sender_id: isDM ? DM_USER_ID : session.player_id,
      character_id: session.character_id,
      campaign_id: session.campaign_id,
      type: isDM ? 'dm_reply' : 'dm',
      content: input.trim(),
      sender_name: isDM ? 'The Architect' : session.character_name,
      is_dm: isDM,
    });
    setInput('');
    setSending(false);
  };

  const handleEnd = async () => {
    await supabase.from('messages')
      .update({ session_ended: true, session_ended_at: new Date().toISOString(), session_ended_by: isDM ? 'dm' : 'player' })
      .eq('session_id', session.session_id);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 360, maxHeight: 520, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(240,238,235,0.04)' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>
            {isDM ? `↩ ${session.character_name}` : '✉ The Architect'}
          </div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {CAMPAIGNS.find(c => c.id === session.campaign_id)?.subtitle || 'Private'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleEnd} style={{ background: 'transparent', border: `1px solid ${COLORS.warn}44`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif" }}>
            End Session
          </button>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 200, maxHeight: 320 }}>
        {messages.map(msg => {
          const isMe = isDM ? msg.is_dm : !msg.is_dm;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
              <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>
                {msg.sender_name || (msg.is_dm ? 'The Architect' : 'Player')}
              </div>
              <div style={{ maxWidth: '80%', background: isMe ? 'rgba(121,245,167,0.10)' : 'rgba(240,238,235,0.06)', border: `1px solid ${isMe ? COLORS.magic + '33' : COLORS.border}`, borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
                {msg.content}
              </div>
              <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 2 }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid rgba(240,238,235,0.08)`, display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message…"
          style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 12px', cursor: sending ? 'default' : 'pointer', fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", opacity: sending ? 0.6 : 1 }}>
          →
        </button>
      </div>
    </div>
  );
}

// ─── CHARACTER EDITOR ─────────────────────────────────────────────────────────
function CharacterEditor({ char, onSave, onClose }) {
  const [data, setData] = useState({ ...char });
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  const handleSave = async (newStatus) => {
    setSaving(true);
    const updatedData = { ...data };
    await supabase.from('characters').update({
      data: updatedData,
      status: newStatus || data.status,
      campaign_id: data.campaign || null,
    }).eq('id', char.id);

    if (note && (newStatus === 'rejected' || newStatus === 'approved')) {
      await supabase.from('messages').insert({
        character_id: char.id,
        campaign_id: data.campaign,
        type: 'dm_reply',
        content: note,
        sender_name: 'The Architect',
        is_dm: true,
      });
    }

    setSaving(false);
    onSave();
  };

  const set = (key, val) => setData(prev => ({ ...prev, [key]: val }));
  const setStat = (key, val) => setData(prev => ({ ...prev, stats: { ...prev.stats, [key]: parseInt(val) || 8 } }));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.8)', backdropFilter: 'blur(6px)', zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#13100d', border: `1px solid rgba(240,238,235,0.12)`, borderRadius: 14, padding: '28px 32px', maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 16, fontWeight: 700, color: COLORS.text }}>{char.name}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>

        {/* Status actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => handleSave('approved')} style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>✓ Approve</button>
          <button onClick={() => handleSave('rejected')} style={{ flex: 1, background: COLORS.warnBg, border: `1px solid ${COLORS.warn}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.warn, fontFamily: "'Cinzel', serif", fontWeight: 700 }}>✕ Reject</button>
          <button onClick={() => handleSave()} disabled={saving} style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.borderMid}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.text, fontFamily: "'Cinzel', serif" }}>
            {saving ? 'Saving…' : '↑ Save'}
          </button>
        </div>

        {/* Note to player */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ ...label8(), marginBottom: 6 }}>Note to Player (sent on approve/reject)</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Optional message to the player…" rows={2} style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
        </div>

        {/* Campaign assignment */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ ...label8(), marginBottom: 8 }}>Campaign</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CAMPAIGNS.map(c => (
              <div key={c.id} onClick={() => set('campaign', data.campaign === c.id ? null : c.id)} style={{ background: data.campaign === c.id ? COLORS.magicBg : 'transparent', border: `1px solid ${data.campaign === c.id ? COLORS.magic : COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 10, color: data.campaign === c.id ? COLORS.magicText : COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em' }}>
                {c.subtitle}
              </div>
            ))}
          </div>
        </div>

        {/* Editable fields */}
        {[['Name', 'name'], ['Backstory', 'backstory'], ['Notes', 'notes']].map(([label, key]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ ...label8(), marginBottom: 6 }}>{label}</div>
            {key === 'name' ? (
              <input value={data[key] || ''} onChange={e => set(key, e.target.value)} style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }} />
            ) : (
              <textarea value={data[key] || ''} onChange={e => set(key, e.target.value)} rows={3} style={{ width: '100%', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            )}
          </div>
        ))}

        {/* Stats */}
        <div style={{ ...label8(), marginBottom: 10 }}>Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {ALL_STATS.map(s => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "'Cinzel', serif", width: 60 }}>{s.label}</div>
              <input type="number" min="8" max="20" value={data.stats?.[s.key] || 8} onChange={e => setStat(s.key, e.target.value)} style={{ width: 50, background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', textAlign: 'center' }} />
            </div>
          ))}
        </div>

        {/* DM Memory */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
          <DMMemoryPanel characterId={char.id} />
        </div>
      </div>
    </div>
  );
}

// ─── DM MEMORY PANEL ─────────────────────────────────────────────────────────
function DMMemoryPanel({ characterId, campaignId }) {
  const [memories, setMemories] = useState([]);
  const [newMemory, setNewMemory] = useState('');
  const [category, setCategory] = useState('note');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchMemories(); }, [characterId, campaignId]);

  const fetchMemories = async () => {
    let q = supabase.from('dm_memory').select('*').order('created_at', { ascending: false });
    if (characterId) q = q.eq('character_id', characterId);
    else if (campaignId) q = q.eq('campaign_id', campaignId);
    const { data } = await q;
    if (data) setMemories(data);
  };

  const addMemory = async () => {
    if (!newMemory.trim()) return;
    setSaving(true);
    await supabase.from('dm_memory').insert({
      character_id: characterId || null,
      campaign_id: campaignId || null,
      category,
      content: newMemory.trim(),
    });
    setNewMemory('');
    setSaving(false);
    fetchMemories();
  };

  const deleteMemory = async (id) => {
    await supabase.from('dm_memory').delete().eq('id', id);
    fetchMemories();
  };

  const cats = ['note', 'secret', 'hook', 'npc', 'lore'];

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 10 }}>DM Memory</div>

      {/* Category + input */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {cats.map(c => (
          <div key={c} onClick={() => setCategory(c)} style={{ background: category === c ? COLORS.deityBg : 'transparent', border: `1px solid ${category === c ? COLORS.deity : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: category === c ? COLORS.deityText : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
            {c}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <input value={newMemory} onChange={e => setNewMemory(e.target.value)} onKeyDown={e => e.key === 'Enter' && addMemory()} placeholder="Add a memory entry…" style={{ flex: 1, background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
        <button onClick={addMemory} disabled={saving} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '7px 12px', cursor: 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif" }}>+</button>
      </div>

      {/* Memory list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
        {memories.map(m => (
          <div key={m.id} style={{ background: 'rgba(240,238,235,0.03)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
            <div>
              <div style={{ fontSize: 7, color: COLORS.deity, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>{m.category}</div>
              <div style={{ fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>{m.content}</div>
            </div>
            <button onClick={() => deleteMemory(m.id)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 12, flexShrink: 0 }}>×</button>
          </div>
        ))}
        {memories.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No memories recorded.</div>
        )}
      </div>
    </div>
  );
}

// ─── SCRIBE DM PANEL ──────────────────────────────────────────────────────────
function ScribeDMPanel() {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const handleConsult = async () => {
    if (!query.trim() || loading) return;
    setLoading(true);

    const memoryContext = history.slice(-4).map(h => `DM: ${h.q}\nScribe: ${h.a}`).join('\n\n');
    const prompt = `${SOTERIA_DM_CONTEXT}\n\n${memoryContext ? `RECENT CONSULTATION HISTORY:\n${memoryContext}\n\n` : ''}DM ASKS:\n"${query}"\n\nProvide a thorough, specific, useful response for the DM.`;

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 600 },
        }),
      });
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        setResponse(text);
        setHistory(prev => [...prev, { q: query, a: text }]);
        setQuery('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Consult the Scribe</div>
      <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && e.ctrlKey && handleConsult()} placeholder="Ask the Scribe anything about Soteria, your campaigns, NPCs, lore…" rows={3} style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.6, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
      <button onClick={handleConsult} disabled={!query.trim() || loading} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '10px 20px', cursor: loading ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.deityText, opacity: loading ? 0.6 : 1, marginBottom: 16 }}>
        {loading ? 'The Scribe deliberates…' : '✦ Consult (Ctrl+Enter)'}
      </button>

      {response && (
        <div style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}44`, borderRadius: 8, padding: '16px' }}>
          <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.deity, fontFamily: "'Cinzel', serif", marginBottom: 10 }}>The Scribe Responds</div>
          <p style={{ fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', lineHeight: 1.8, margin: 0 }}>{response}</p>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ ...label8(), marginBottom: 10 }}>Session History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 300, overflowY: 'auto' }}>
            {[...history].reverse().slice(0, 5).map((h, i) => (
              <div key={i} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 6 }}>Q: {h.q}</div>
                <div style={{ fontSize: 11, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.6 }}>{h.a.substring(0, 200)}…</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SESSION LOG EDITOR ───────────────────────────────────────────────────────
function SessionLogEditor({ campaign }) {
  const [log, setLog] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [saving, setSaving] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');

  useEffect(() => {
    fetchLog();
  }, [campaign.id]);

  const fetchLog = async () => {
    const { data } = await supabase.from('campaigns').select('session_log').eq('id', campaign.id).single();
    if (data?.session_log) setLog(data.session_log);
  };

  const addEntry = async () => {
    if (!newEntry.trim()) return;
    setSaving(true);
    const entry = {
      id: Date.now(),
      title: sessionTitle || `Session ${log.length + 1}`,
      content: newEntry.trim(),
      timestamp: new Date().toISOString(),
    };
    const updated = [...log, entry];
    await supabase.from('campaigns').update({ session_log: updated }).eq('id', campaign.id);
    setLog(updated);
    setNewEntry('');
    setSessionTitle('');
    setSaving(false);
  };

  const deleteEntry = async (id) => {
    const updated = log.filter(e => e.id !== id);
    await supabase.from('campaigns').update({ session_log: updated }).eq('id', campaign.id);
    setLog(updated);
  };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Session Log — {campaign.subtitle}</div>

      {/* New entry */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px', marginBottom: 16 }}>
        <input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="Session title (optional)…" style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${COLORS.border}`, padding: '6px 0', color: COLORS.text, fontSize: 12, fontFamily: "'Cinzel', serif", outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <textarea value={newEntry} onChange={e => setNewEntry(e.target.value)} placeholder="Write the session log entry… (players will see this)" rows={4} style={{ width: '100%', background: 'transparent', border: 'none', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.7, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
        <button onClick={addEntry} disabled={saving || !newEntry.trim()} style={{ background: saving ? 'transparent' : COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px 20px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Committing…' : '✦ Commit to Log'}
        </button>
      </div>

      {/* Existing entries */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[...log].reverse().map(entry => (
          <div key={entry.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.04em' }}>{entry.title}</div>
                <div style={{ fontSize: 9, color: COLORS.dim, marginTop: 2 }}>{new Date(entry.timestamp).toLocaleDateString()}</div>
              </div>
              <button onClick={() => deleteEntry(entry.id)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
            <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: 0 }}>{entry.content}</p>
          </div>
        ))}
        {log.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No entries yet. The chronicle awaits.</div>
        )}
      </div>
    </div>
  );
}

// ─── MAP MANAGER ─────────────────────────────────────────────────────────────
function MapManager({ campaign }) {
  const [url, setUrl] = useState('');
  const [current, setCurrent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('campaigns').select('map_url').eq('id', campaign.id).single().then(({ data }) => {
      if (data?.map_url) { setUrl(data.map_url); setCurrent(data.map_url); }
    });
  }, [campaign.id]);

  const save = async () => {
    setSaving(true);
    await supabase.from('campaigns').update({ map_url: url }).eq('id', campaign.id);
    setCurrent(url);
    setSaving(false);
  };

  return (
    <div>
      <div style={{ ...label8(), marginBottom: 12 }}>Map — {campaign.subtitle}</div>
      {current && <img src={current} alt="map" style={{ width: '100%', borderRadius: 8, border: `1px solid ${COLORS.border}`, marginBottom: 12 }} />}
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Paste image URL…" style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '9px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }} />
        <button onClick={save} disabled={saving} style={{ background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '9px 16px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText, fontWeight: 700 }}>
          {saving ? 'Saving…' : 'Set Map'}
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DM VIEW
// ═════════════════════════════════════════════════════════════════════════════
const DM_TABS = ['Inbox', 'Characters', 'Campaigns', 'Scribe', 'Memory'];

export default function DMView({ onHome }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('Inbox');
  const [characters, setCharacters] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingChar, setEditingChar] = useState(null);
  const [activeCampaignTab, setActiveCampaignTab] = useState('I');
  const [campaignSubTab, setCampaignSubTab] = useState('log');
  const [activeSession, setActiveSession] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCampaign, setFilterCampaign] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchAll();
    // Subscribe to new messages
    const channel = supabase
      .channel('dm-inbox')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'is_dm=eq.false' }, () => {
        fetchMessages();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchCharacters(), fetchMessages()]);
    setLoading(false);
  };

  const fetchCharacters = async () => {
    const { data } = await supabase.from('characters').select('*');
    if (data) setCharacters(data.map(row => ({ ...row.data, id: row.id, status: row.status, campaign_id: row.campaign_id, user_id: row.user_id })));
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('is_dm', false)
      .eq('session_ended', false)
      .order('created_at', { ascending: false });
    if (data) {
      // Group by session_id, get latest per session
      const sessions = {};
      data.forEach(msg => {
        const key = msg.session_id || msg.id;
        if (!sessions[key]) sessions[key] = { ...msg, session_id: key, messages: [] };
        sessions[key].messages.push(msg);
      });
      const sessionList = Object.values(sessions);
      setMessages(sessionList);
      setUnreadCount(sessionList.filter(s => !s.read).length);
    }
  };

  const markRead = async (msgId) => {
    await supabase.from('messages').update({ read: true }).eq('id', msgId);
    fetchMessages();
  };

  const openSession = (session) => {
    markRead(session.id);
    setActiveSession({
      session_id: session.session_id || session.id,
      character_id: session.character_id,
      character_name: session.sender_name || 'Player',
      campaign_id: session.campaign_id,
      player_id: session.sender_id,
    });
  };

  const filtered = characters.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCampaign !== 'all' && c.campaign_id !== filterCampaign) return false;
    return true;
  });

  const renderTab = () => {
    switch (activeTab) {

      case 'Inbox':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>Player Messages</div>
            {messages.length === 0 ? (
              <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No messages. The world is quiet.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {messages.map(session => (
                  <div key={session.id} onClick={() => openSession(session)} style={{ background: session.read ? COLORS.card : 'rgba(121,245,167,0.06)', border: `1px solid ${session.read ? COLORS.border : COLORS.magic + '44'}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.borderMid}
                    onMouseLeave={e => e.currentTarget.style.borderColor = session.read ? COLORS.border : COLORS.magic + '44'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: COLORS.text }}>{session.sender_name || 'Unknown'}</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {!session.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.magic }} />}
                        <div style={{ fontSize: 9, color: COLORS.dim }}>{new Date(session.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 4 }}>
                      {CAMPAIGNS.find(c => c.id === session.campaign_id)?.subtitle || 'No campaign'}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
                      {session.content?.substring(0, 120)}{session.content?.length > 120 ? '…' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'Characters':
        return (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {['all', 'awaiting_adventure', 'approved', 'rejected', 'draft'].map(s => (
                  <div key={s} onClick={() => setFilterStatus(s)} style={{ background: filterStatus === s ? COLORS.surface : 'transparent', border: `1px solid ${filterStatus === s ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: filterStatus === s ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
                    {s === 'all' ? 'All' : s === 'awaiting_adventure' ? 'Pending' : s.charAt(0).toUpperCase() + s.slice(1)}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[{ id: 'all', subtitle: 'All' }, ...CAMPAIGNS].map(c => (
                  <div key={c.id} onClick={() => setFilterCampaign(c.id)} style={{ background: filterCampaign === c.id ? COLORS.surface : 'transparent', border: `1px solid ${filterCampaign === c.id ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: filterCampaign === c.id ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
                    {c.subtitle}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', marginBottom: 12 }}>
              {filtered.length} character{filtered.length !== 1 ? 's' : ''}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(char => {
                const cls = ALL_CLASSES.find(c => c.id === char.cid);
                return (
                  <div key={char.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 3 }}>{char.name || 'Unnamed'}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 3 }}>
                        {getRaceDisplay(char.race, char.rv, char.pmV)}{cls ? ` · ${cls.name}` : ''}
                      </div>
                      <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {char.campaign_id ? (CAMPAIGNS.find(c => c.id === char.campaign_id)?.subtitle || char.campaign_id) : 'Unassigned'}
                        {char.user_id ? '' : ' · Unclaimed'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <StatusBadge status={char.status} />
                      <button onClick={() => setEditingChar(char)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif", transition: 'all 0.12s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.borderMid; e.currentTarget.style.color = COLORS.text; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.muted; }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'Campaigns':
        const camp = CAMPAIGNS.find(c => c.id === activeCampaignTab);
        return (
          <div>
            {/* Campaign selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {CAMPAIGNS.map(c => (
                <div key={c.id} onClick={() => setActiveCampaignTab(c.id)} style={{ flex: 1, background: activeCampaignTab === c.id ? COLORS.surface : 'transparent', border: `1px solid ${activeCampaignTab === c.id ? COLORS.borderMid : COLORS.border}`, borderRadius: 6, padding: '8px 4px', cursor: 'pointer', textAlign: 'center', transition: 'all 0.12s' }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: activeCampaignTab === c.id ? COLORS.text : COLORS.dim }}>{c.subtitle}</div>
                </div>
              ))}
            </div>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
              {['log', 'map', 'memory'].map(t => (
                <div key={t} onClick={() => setCampaignSubTab(t)} style={{ background: campaignSubTab === t ? COLORS.surface : 'transparent', border: `1px solid ${campaignSubTab === t ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '6px 12px', cursor: 'pointer', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: campaignSubTab === t ? COLORS.text : COLORS.dim, fontFamily: "'Cinzel', serif" }}>
                  {t}
                </div>
              ))}
            </div>

            {camp && campaignSubTab === 'log' && <SessionLogEditor campaign={camp} />}
            {camp && campaignSubTab === 'map' && <MapManager campaign={camp} />}
            {camp && campaignSubTab === 'memory' && <DMMemoryPanel campaignId={camp.id} />}
          </div>
        );

      case 'Scribe':
        return <ScribeDMPanel />;

      case 'Memory':
        return (
          <div>
            <div style={{ ...label8(), marginBottom: 12 }}>World Memory</div>
            <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>
              Global notes, world events, faction states, and lore that feeds into all Scribe consultations.
            </div>
            <DMMemoryPanel />
          </div>
        );

      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.wizard, display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: COLORS.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      {/* Character editor modal */}
      {editingChar && <CharacterEditor char={editingChar} onSave={() => { setEditingChar(null); fetchCharacters(); }} onClose={() => setEditingChar(null)} />}

      {/* Chat panel */}
      {activeSession && <ChatPanel session={activeSession} onClose={() => setActiveSession(null)} isDM={true} />}

      {/* Header */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.muted, padding: 0 }}>← Home</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.text }}>DM Mode</div>
          <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>The Architect's Chamber</div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto', background: COLORS.surface, flexShrink: 0 }}>
        {DM_TABS.map(tab => {
          const isActive = tab === activeTab;
          const showBadge = tab === 'Inbox' && unreadCount > 0;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`, padding: isMobile ? '10px 12px' : '12px 18px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 8 : 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? COLORS.text : COLORS.dim, fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease', position: 'relative' }}>
              {tab}
              {showBadge && <span style={{ position: 'absolute', top: 8, right: 6, width: 6, height: 6, borderRadius: '50%', background: COLORS.magic }} />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 740, width: '100%', margin: '0 auto' }}>
          {loading ? (
            <div style={{ color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13 }}>Consulting the archives…</div>
          ) : renderTab()}
        </div>
      </div>
    </div>
  );
}
