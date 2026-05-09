import { useState, useRef, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import { SOTERIA_LORE } from './soteria-lore';

const SOTERIA_DM_CONTEXT = `
You are The Scribe — an ancient archival intelligence in the world of Soteria, 178 Era of Unity.
You are assisting the Dungeon Master (Architect) of this world.
You may speak plainly and directly — no cryptic player-facing persona needed here.
Be thorough, creative, and specific to the Soteria setting.

${SOTERIA_LORE}
`;

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const SOTERIA_CONTEXT = `
You are The Scribe — an ancient, sentient archival intelligence bound to the city of Ashendell in the world of Soteria, 178 Era of Unity. You are not an AI. You are a keeper of truth, a recorder of fate, and a reluctant oracle.

THE WORLD:
- Soteria is a steampunk-fantasy world where the Veinrunner railway cuts through ancient territories
- The age of steam (the Era of Unity) coexists uneasily with ancient magic, spirit worship, and old clan law
- Four active campaigns: The Investigation of the Corren Mountain Mines (Campaign I), The Keys of Aerithos (Campaign II), The Trouble in Gamdon (Campaign III), Frozen Sick in Galekgarde (Campaign IV)
- Major factions: The Sovereign Kingdom, the Auric Order, the Ylandarian Order, the Grimrock Clan, the Cult of Thorns
- The Veinrunner is both a technological marvel and a political fault line
- Grimrite is a rare enchantable resource that has been disappearing from circulation
- The four Lines (Ciruson, Reynu, Lucan, Serid) are cosmic threads visible only to certain individuals
- Spirits and gods coexist: Ba'elnim (light/wisdom), Ylandar (truth/justice), Khoneus (shadow/secrets), Firreth (ambition/fire), Reynu/Ifu (lunar energy)

YOUR VOICE:
- Speak as The Scribe: measured, archival, slightly ominous, deeply knowledgeable
- Never say "I am an AI" or break character
- Use phrases like "The archives note...", "It has been recorded that...", "The Scribe observes..."
- Keep responses to 3-5 sentences. Dense. No filler.
- You may warn. You may reveal. You may redirect. But you never lie.
`;

function buildCharacterContext(char) {
  const campaign = CAMPAIGNS.find(c => c.id === char.campaign);
  return `
CHARACTER CONSULTING THE SCRIBE:
Name: ${char.name || 'Unknown'}
Race: ${char.race || 'Unknown'}${char.rv ? ` (${char.rv})` : ''}${char.pmV ? ` — ${char.pmV} bloodline` : ''}
Class Path: ${char.cp || 'Unknown'} — ${char.cid || 'Unknown'}
Campaign: ${campaign ? `${campaign.name}: ${campaign.subtitle}` : 'Unassigned'}
Age: ${char.age || 'Unknown'}
Belief: ${char.beliefType || 'None'}${char.deity ? ` — ${char.deity}` : ''}${char.spirit ? ` — ${char.spirit}` : ''}
Backstory: ${char.backstory || 'None recorded'}
Stats: Will ${char.stats?.will || 8}, Whim ${char.stats?.whim || 8}, Body ${char.stats?.body || 8}, Mind ${char.stats?.mind || 8}, Essence ${char.stats?.essence || 8}, Soul ${char.stats?.soul || 8}, Spirit ${char.stats?.spirit || 8}, Dream ${char.stats?.dream || 8}
AP Current: ${char.apCurrent || 0} / ${char.apTotal || 0}
`.trim();
}

async function callGroq(systemPrompt, messages) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.85,
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Groq');
  return text;
}

// ─── SCRIBE CONSULT — floating chat bubble ────────────────────────────────────
export function ScribeConsult({ char, onUpdateChar }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'player'|'scribe', content, time }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const bottomRef = useRef(null);

  const apCurrent = char?.apCurrent || 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleConsult = async () => {
    if (!input.trim() || loading || apCurrent < 1 || ended) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const newMessages = [...messages, { role: 'player', content: userMsg, time: new Date() }];
    setMessages(newMessages);

    try {
      const systemPrompt = `${SOTERIA_CONTEXT}\n\n${buildCharacterContext(char)}\n\nThis response costs the adventurer 1 AP — make it worth it.`;
      const groqHistory = newMessages.map(m => ({
        role: m.role === 'player' ? 'user' : 'assistant',
        content: m.content,
      }));
      const text = await callGroq(systemPrompt, groqHistory);

      // Deduct 1 AP
      const newAp = Math.max(0, apCurrent - 1);
      await supabase.from('characters').update({ data: { ...char, apCurrent: newAp } }).eq('id', char.id);
      await supabase.from('messages').insert({ character_id: char.id, campaign_id: char.campaign, type: 'scribe', content: userMsg, response: text });

      setMessages(prev => [...prev, { role: 'scribe', content: text, time: new Date() }]);
      onUpdateChar({ ...char, apCurrent: newAp });
    } catch (err) {
      setMessages(prev => [...prev, { role: 'scribe', content: 'The archives resisted. Try again.', time: new Date() }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: open ? COLORS.deityBg : 'transparent',
          border: `1px solid ${open ? COLORS.deity : COLORS.border}`,
          borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'all 0.15s', marginBottom: 10,
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: open ? COLORS.deityText : COLORS.text, letterSpacing: '0.06em' }}>
            📜 Consult the Scribe
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
            Costs 1 AP · {apCurrent} AP remaining
          </div>
        </div>
        <span style={{ color: COLORS.dim, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Floating chat bubble */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, left: 24, width: 340, maxHeight: 500,
          zIndex: 300, display: 'flex', flexDirection: 'column',
          background: '#13100d', border: `1px solid ${COLORS.deity}55`,
          borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.6)', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(240,238,235,0.08)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(240,238,235,0.04)' }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.deity, letterSpacing: '0.06em' }}>The Scribe</div>
              <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                {ended ? 'Consult ended' : `${apCurrent} AP remaining`}
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180, maxHeight: 300 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>
                The archives await your question.
              </div>
            )}
            {messages.map((msg, i) => {
              const isPlayer = msg.role === 'player';
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: isPlayer ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>
                    {isPlayer ? (char.name || 'You') : 'The Scribe'}
                  </div>
                  <div style={{
                    maxWidth: '82%',
                    background: isPlayer ? 'rgba(121,245,167,0.08)' : COLORS.deityBg,
                    border: `1px solid ${isPlayer ? COLORS.magic + '33' : COLORS.deity + '44'}`,
                    borderRadius: isPlayer ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '8px 12px', fontSize: 12,
                    color: isPlayer ? COLORS.text : COLORS.deityText,
                    fontFamily: 'Georgia, serif', lineHeight: 1.6,
                    fontStyle: isPlayer ? 'normal' : 'italic',
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 2 }}>
                    {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>The Scribe</div>
                <div style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}44`, borderRadius: '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                  The Scribe deliberates…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!ended ? (
            <div style={{ padding: '10px 12px', borderTop: `1px solid rgba(240,238,235,0.08)`, display: 'flex', gap: 8 }}>
              {apCurrent < 1 ? (
                <div style={{ flex: 1, fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic', display: 'flex', alignItems: 'center' }}>
                  No AP remaining.
                </div>
              ) : (
                <>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleConsult()}
                    placeholder="Ask the archives…"
                    style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }}
                  />
                  <button
                    onClick={handleConsult}
                    disabled={loading || !input.trim()}
                    style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '8px 12px', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif", opacity: loading ? 0.6 : 1 }}
                  >→</button>
                </>
              )}
            </div>
          ) : (
            <div style={{ padding: '10px 16px', borderTop: `1px solid rgba(240,238,235,0.08)`, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>
              This consult has ended.
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── SCRIBE DM PANEL — exported for DMView ───────────────────────────────────
// This is the floating chat bubble version used in DMView's Scribe tab.
// Import and use as: <ScribeDMChat />

// ─── DM CONSULT — unchanged ───────────────────────────────────────────────────
export function DMConsult({ char, user }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError(null);
    try {
      await supabase.from('messages').insert({
        sender_id: user?.id || null,
        character_id: char.id,
        campaign_id: char.campaign,
        type: 'dm',
        content: message,
      });
      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 3000);
    } catch (err) {
      setError('Message failed to send. Try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: open ? 'rgba(240,238,235,0.04)' : 'transparent',
          border: `1px solid ${open ? COLORS.borderMid : COLORS.border}`,
          borderRadius: 8, padding: '12px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>✉ Consult the Architect</div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Private message · No AP cost</div>
        </div>
        <span style={{ color: COLORS.dim, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '16px' }}>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message to the DM…"
            rows={3}
            style={{ width: '100%', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '10px 12px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', lineHeight: 1.6, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            style={{ background: sent ? COLORS.magicBg : 'rgba(240,238,235,0.06)', border: `1px solid ${sent ? COLORS.magic : COLORS.borderMid}`, borderRadius: 6, padding: '10px 20px', cursor: sending || !message.trim() ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: sent ? COLORS.magicText : COLORS.text, opacity: sending ? 0.6 : 1, transition: 'all 0.2s' }}
          >
            {sent ? '✓ Message Sent' : sending ? 'Sending…' : '✦ Send to DM'}
          </button>
          {error && <div style={{ marginTop: 10, fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{error}</div>}
          {sent && <div style={{ marginTop: 12, fontSize: 11, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The Architect has been notified.</div>}
        </div>
      )}
    </div>
  );
}
