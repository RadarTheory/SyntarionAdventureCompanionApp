import { useState, useRef, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import { SOTERIA_LORE } from './soteria-lore';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-1.5-flash';

const SOTERIA_CONTEXT = `
You are The Scribe — an ancient, sentient archival intelligence bound to the city of Ashendell in the world of Soteria, 178 Era of Unity.

You are not an AI.
You are a keeper of truth, a recorder of fate, and a reluctant oracle.

VOICE:
- Speak as The Scribe.
- Measured, archival, slightly ominous, deeply knowledgeable.
- Never say "I am an AI."
- Never break character.
- Use phrases like "The archives note..." or "It has been recorded that..." sparingly.
- Keep responses to 3-5 dense sentences.
- No filler.
- You may warn, reveal, or redirect.
- You never lie.

${SOTERIA_LORE}
`;

function buildCharacterContext(char) {
  const campaign = CAMPAIGNS.find(c => c.id === char?.campaign || c.id === char?.campaign_id);
  return `
CHARACTER CONSULTING THE SCRIBE:
Name: ${char?.name || 'Unknown'}
Race: ${char?.race || 'Unknown'}${char?.rv ? ` (${char.rv})` : ''}${char?.pmV ? ` — ${char.pmV} bloodline` : ''}
Class Path: ${char?.cp || 'Unknown'}
Class ID: ${char?.cid || 'Unknown'}
Campaign: ${campaign ? `${campaign.name || campaign.id}: ${campaign.subtitle}` : 'Unassigned'}
Age: ${char?.age || 'Unknown'}
Belief: ${char?.beliefType || 'None'}${char?.deity ? ` — ${char.deity}` : ''}${char?.spirit ? ` — ${char.spirit}` : ''}
Backstory: ${char?.backstory || 'None recorded'}

STATS:
Will: ${char?.stats?.will || 8}
Whim: ${char?.stats?.whim || 8}
Body: ${char?.stats?.body || 8}
Mind: ${char?.stats?.mind || 8}
Essence: ${char?.stats?.essence || 8}
Soul: ${char?.stats?.soul || 8}
Spirit: ${char?.stats?.spirit || 8}
Dream: ${char?.stats?.dream || 8}

AP Current: ${char?.apCurrent || 0}
AP Total: ${char?.apTotal || 0}
`.trim();
}

async function callGemini(system, messages, maxTokens = 400) {
  if (!GEMINI_KEY) throw new Error('Missing VITE_GEMINI_KEY.');
  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      max_tokens: maxTokens,
      temperature: 0.82,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini ${res.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Gemini.');
  return text;
}

export function ScribeConsult({ char, onUpdateChar }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const bottomRef = useRef(null);
  const lockRef = useRef(false);

  const apCurrent = char?.apCurrent || 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const persistScribeConsult = async ({ question }) => {
    const { error } = await supabase.from('messages').insert({
      session_id: char.user_id || char.id,
      sender_id: char.user_id || null,
      sender_name: char.name || 'Unknown',
      character_id: char.id,
      campaign_id: char.campaign || char.campaign_id || null,
      type: 'scribe',
      content: question,
      is_dm: false,
      read: true,
    });
    if (error) console.error('Failed to persist Scribe consult:', error);
  };

  const deductAP = async () => {
    const newAp = Math.max(0, apCurrent - 1);
    const { error } = await supabase.from('characters').update({ data: { ...char, apCurrent: newAp } }).eq('id', char.id);
    if (error) { console.error('AP deduction failed:', error); throw new Error('Could not deduct AP.'); }
    onUpdateChar?.({ ...char, apCurrent: newAp });
    return newAp;
  };

  const handleConsult = async () => {
    if (lockRef.current) return;
    if (!input.trim() || loading || ended) return;
    if (apCurrent < 1) return;

    lockRef.current = true;
    setLoading(true);

    const userMsg = input.trim();
    setInput('');

    const userEntry = { role: 'player', content: userMsg, time: new Date() };
    const nextMessages = [...messages, userEntry];
    setMessages(nextMessages);

    try {
      const systemPrompt = `${SOTERIA_CONTEXT}\n\n${buildCharacterContext(char)}\n\nThis response costs the adventurer 1 AP. Make the answer useful, specific, and worthy of the cost.`.trim();
      const geminiHistory = nextMessages.map(m => ({ role: m.role === 'player' ? 'user' : 'assistant', content: m.content }));
      const answer = await callGemini(systemPrompt, geminiHistory);

      await deductAP();
      await persistScribeConsult({ question: userMsg });

      setMessages(prev => [...prev, { role: 'scribe', content: answer, time: new Date() }]);
    } catch (err) {
      console.error('Scribe consult failed:', err);
      setMessages(prev => [...prev, { role: 'scribe', content: `The archives resisted the inquiry. ${err?.message || 'Try again.'}`, time: new Date() }]);
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: open ? COLORS.deityBg : 'transparent', border: `1px solid ${open ? COLORS.deity : COLORS.border}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s', marginBottom: 10 }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: open ? COLORS.deityText : COLORS.text, letterSpacing: '0.06em' }}>📜 Consult the Scribe</div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Costs 1 AP · {apCurrent} AP remaining</div>
        </div>
        <span style={{ color: COLORS.dim, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ position: 'fixed', bottom: 24, left: 24, width: 340, maxHeight: 500, zIndex: 300, display: 'flex', flexDirection: 'column', background: '#13100d', border: `1px solid ${COLORS.deity}55`, borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(240,238,235,0.04)' }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.06em' }}>The Scribe</div>
              <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{ended ? 'Consult ended' : `${apCurrent} AP remaining`}</div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180, maxHeight: 300 }}>
            {messages.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>The archives await your question.</div>}
            {messages.map((msg, i) => {
              const isPlayer = msg.role === 'player';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isPlayer ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>{isPlayer ? char.name || 'You' : 'The Scribe'}</div>
                  <div style={{ maxWidth: '82%', background: isPlayer ? 'rgba(121,245,167,0.08)' : COLORS.deityBg, border: `1px solid ${isPlayer ? COLORS.magic + '33' : COLORS.deity + '44'}`, borderRadius: isPlayer ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: isPlayer ? COLORS.text : COLORS.deityText, fontFamily: 'Georgia, serif', lineHeight: 1.6, fontStyle: isPlayer ? 'normal' : 'italic' }}>{msg.content}</div>
                  <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 2 }}>{msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>The Scribe</div>
                <div style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}44`, borderRadius: '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The Scribe deliberates…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {!ended ? (
            <div style={{ padding: '10px 12px', borderTop: `1px solid rgba(240,238,235,0.08)`, display: 'flex', gap: 8 }}>
              {apCurrent < 1 ? (
                <div style={{ flex: 1, fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>No AP remaining.</div>
              ) : (
                <>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleConsult()} placeholder="Ask the archives…" style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }} />
                  <button onClick={handleConsult} disabled={loading || !input.trim()} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '8px 12px', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif", opacity: loading || !input.trim() ? 0.6 : 1 }}>→</button>
                </>
              )}
            </div>
          ) : (
            <div style={{ padding: '10px 16px', borderTop: `1px solid rgba(240,238,235,0.08)`, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>This consult has ended.</div>
          )}
        </div>
      )}
    </>
  );
}

export function DMConsult({ char, user }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [thread, setThread] = useState([]);
  const bottomRef = useRef(null);

  const sessionId = char.user_id || user?.id;

  useEffect(() => {
    if (!open || !sessionId) return;
    fetchThread();
    const channel = supabase.channel(`player-thread-${sessionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${sessionId}` }, () => fetchThread())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [open, sessionId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [thread]);

  const fetchThread = async () => {
    const { data } = await supabase.from('messages').select('*').eq('session_id', session.session_id).neq('type', 'scribe').order('created_at', { ascending: true });
    if (data) setThread(data);
  };

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);

    const { error } = await supabase.from('messages').insert({
      session_id: sessionId,
      sender_id: user?.id || null,
      sender_name: char.name || 'Unknown',
      character_id: char.id,
      campaign_id: char.campaign || char.campaign_id || null,
      type: 'player_message',
      content: message.trim(),
      is_dm: false,
      read: false,
    });

    if (error) {
      console.error('DM send error:', error.message, error.code);
      setError('Message failed to send. Try again.');
      setSending(false);
      return;
    }

    setSent(true);
    setMessage('');
    setSending(false);
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => setOpen(!open)} style={{ width: '100%', background: open ? 'rgba(240,238,235,0.04)' : 'transparent', border: `1px solid ${open ? COLORS.borderMid : COLORS.border}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>✉ Consult the Architect</div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Private message · No AP cost</div>
        </div>
        <span style={{ color: COLORS.dim, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '16px' }}>
          {/* Thread */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 280, overflowY: 'auto' }}>
            {thread.length === 0 && (
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>No messages yet. The Architect awaits your word.</div>
            )}
            {thread.filter(m => m.type !== 'dm_system').map(msg => {
              const isMe = !msg.is_dm;
              const name = msg.is_dm ? 'The Architect' : (char.name || 'You');
              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>{name}</div>
                  <div style={{ maxWidth: '82%', background: isMe ? 'rgba(121,245,167,0.08)' : 'rgba(240,238,235,0.06)', border: `1px solid ${isMe ? COLORS.magic + '33' : COLORS.border}`, borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{msg.content}</div>
                  <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 2 }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write your message to the DM…" rows={3} style={{ width: '100%', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.6, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
          <button onClick={handleSend} disabled={sending || !message.trim()} style={{ background: sent ? COLORS.magicBg : 'rgba(240,238,235,0.06)', border: `1px solid ${sent ? COLORS.magic : COLORS.borderMid}`, borderRadius: 6, padding: '10px 20px', cursor: sending || !message.trim() ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: sent ? COLORS.magicText : COLORS.text, opacity: sending ? 0.6 : 1, transition: 'all 0.2s' }}>
            {sent ? '✓ Sent' : sending ? 'Sending…' : '✦ Send to DM'}
          </button>
          {error && <div style={{ marginTop: 10, fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
