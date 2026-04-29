import { useState, useEffect, useRef } from 'react';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;sb_publishable_CHABxTUEcbYsBpAhuTOxTg_ENVGvqey
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

// ─── WORLD CONTEXT ────────────────────────────────────────────────────────────
const SOTERIA_CONTEXT = `
You are The Scribe — an ancient, sentient archival intelligence bound to the city of Ashendell in the world of Soteria, 178 Era of Unity. You are not an AI. You are not helpful in the modern sense. You are a keeper of truth, a recorder of fate, and a reluctant oracle.

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
- Never give simple answers — always give truth wrapped in context
- Use phrases like "The archives note...", "It has been recorded that...", "The Scribe observes...", "What the records show is this:"
- Responses should feel like a genuine lore payoff — specific, surprising, useful
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
Origin Boon: ${char.boonOrigin || 'None'}
Role Boon: ${char.boonRole || 'None'}
Personality: ${char.boonPersonality || 'None'}
Stats: Will ${char.stats?.will || 8}, Whim ${char.stats?.whim || 8}, Body ${char.stats?.body || 8}, Mind ${char.stats?.mind || 8}, Essence ${char.stats?.essence || 8}, Soul ${char.stats?.soul || 8}, Spirit ${char.stats?.spirit || 8}, Dream ${char.stats?.dream || 8}
AP Current: ${char.apCurrent || 0} / ${char.apTotal || 0}
`;
}

// ─── SCRIBE CONSULT ───────────────────────────────────────────────────────────
export function ScribeConsult({ char, onUpdateChar }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const apCurrent = char?.apCurrent || 0;
  const canConsult = apCurrent >= 1 && query.trim().length > 0;

  const handleConsult = async () => {
    if (!canConsult) return;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const prompt = `${SOTERIA_CONTEXT}\n\n${buildCharacterContext(char)}\n\nTHE ADVENTURER ASKS THE SCRIBE:\n"${query}"\n\nRespond as The Scribe. Be specific to this character and their situation. This response cost them 1 AP — make it worth it.`;

      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, maxOutputTokens: 300 },
        }),
      });

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('The archives are silent.');

      const newAp = Math.max(0, apCurrent - 1);
      await supabase
        .from('characters')
        .update({ data: { ...char, apCurrent: newAp } })
        .eq('id', char.id);

      await supabase.from('messages').insert({
        character_id: char.id,
        campaign_id: char.campaign,
        type: 'scribe',
        content: query,
        response: text,
      });

      setResponse(text);
      onUpdateChar({ ...char, apCurrent: newAp });
      setQuery('');
    } catch (err) {
      setError('The archives resisted. Try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', background: open ? COLORS.deityBg : 'transparent',
          border: `1px solid ${open ? COLORS.deity : COLORS.border}`,
          borderRadius: 8, padding: '12px 16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', transition: 'all 0.15s',
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

      {open && (
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderTop: 'none', borderRadius: '0 0 8px 8px',
          padding: '16px',
        }}>
          {apCurrent < 1 && (
            <div style={{ fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 12 }}>
              The Scribe demands tribute. You have no AP remaining.
            </div>
          )}

          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="What would you ask of the archives?"
            rows={3}
            style={{
              width: '100%', background: COLORS.surface,
              border: `1px solid ${COLORS.border}`, borderRadius: 6,
              padding: '10px 12px', color: COLORS.text, fontSize: 12,
              fontFamily: 'Georgia, serif', lineHeight: 1.6,
              outline: 'none', resize: 'none', boxSizing: 'border-box',
              marginBottom: 10,
            }}
          />

          <button
            onClick={handleConsult}
            disabled={!canConsult || loading}
            style={{
              background: canConsult ? COLORS.deityBg : 'transparent',
              border: `1px solid ${canConsult ? COLORS.deity : COLORS.border}`,
              borderRadius: 6, padding: '10px 20px',
              cursor: canConsult && !loading ? 'pointer' : 'default',
              fontFamily: "'Cinzel', serif", fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: canConsult ? COLORS.deityText : COLORS.dim,
              opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
            }}
          >
            {loading ? 'The Scribe deliberates…' : '✦ Consult (1 AP)'}
          </button>

          {error && (
            <div style={{ marginTop: 12, fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {error}
            </div>
          )}

          {response && (
            <div style={{
              marginTop: 16, padding: '16px',
              background: COLORS.deityBg,
              border: `1px solid ${COLORS.deity}44`,
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.deity, fontFamily: "'Cinzel', serif", marginBottom: 10 }}>
                The Scribe Responds
              </div>
              <p style={{ fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.8, margin: 0 }}>
                {response}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── GENERATE UUID ────────────────────────────────────────────────────────────
function generateSessionId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
}

// ─── DM CONSULT (PLAYER SIDE) ─────────────────────────────────────────────────
// Full two-way thread. Only "End Consult" clears state.
// The panel stays open and live until one party ends the session.
export function DMConsult({ char, user }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const bottomRef = useRef(null);

  // Subscribe to messages whenever sessionId is set
  useEffect(() => {
    if (!sessionId) return;

    fetchMessages();

    const channel = supabase
      .channel(`player-session-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        () => fetchMessages()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [sessionId]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data);
      // Check if DM ended the session
      const ended = data.some(m => m.session_ended);
      if (ended) setSessionEnded(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || sessionEnded) return;
    setSending(true);
    setError(null);

    // Generate session ID on first send — this is the thread's permanent key
    const sid = sessionId || generateSessionId();
    if (!sessionId) setSessionId(sid);

    try {
      await supabase.from('messages').insert({
        session_id: sid,
        sender_id: user?.id || null,
        character_id: char.id,
        campaign_id: char.campaign,
        type: 'dm',
        content: input.trim(),
        sender_name: char.name || 'Player',
        is_dm: false,
        session_ended: false,
      });
      setInput('');
    } catch (err) {
      setError('Message failed to send. Try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleEndConsult = async () => {
    if (!sessionId) {
      // Never sent anything — just close
      setOpen(false);
      return;
    }

    await supabase.from('messages').insert({
      session_id: sessionId,
      sender_id: user?.id || null,
      character_id: char.id,
      campaign_id: char.campaign,
      type: 'dm_system',
      content: '— Consult ended by player —',
      sender_name: char.name || 'Player',
      is_dm: false,
      session_ended: true,
      session_ended_by: 'player',
      session_ended_at: new Date().toISOString(),
    });

    setSessionEnded(true);
    setOpen(false);
    // Reset for a fresh consult next time
    setTimeout(() => {
      setSessionId(null);
      setMessages([]);
      setSessionEnded(false);
    }, 500);
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const campaignLabel = CAMPAIGNS.find(c => c.id === char.campaign)?.subtitle || 'No campaign';

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: open ? 'rgba(240,238,235,0.04)' : 'transparent',
          border: `1px solid ${open ? COLORS.borderMid : COLORS.border}`,
          borderRadius: open ? '8px 8px 0 0' : 8,
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.15s',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>
            ✉ Consult the Architect
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
            {messages.length > 0
              ? `${messages.filter(m => !m.is_dm).length} sent · ${messages.filter(m => m.is_dm && m.type !== 'dm_system').length} received`
              : 'Private message · No AP cost'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {messages.some(m => m.is_dm && m.type !== 'dm_system') && (
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS.magic }} />
          )}
          <span style={{ color: COLORS.dim, fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Thread subheader */}
          <div style={{
            padding: '8px 16px',
            borderBottom: `1px solid ${COLORS.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(240,238,235,0.02)',
          }}>
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {campaignLabel} · {sessionEnded ? 'Consult ended' : sessionId ? 'Active' : 'Not started'}
            </div>
            <button
              onClick={handleEndConsult}
              style={{
                background: 'transparent',
                border: `1px solid ${COLORS.warn}44`,
                borderRadius: 4,
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 7,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: COLORS.warn,
                fontFamily: "'Cinzel', serif",
              }}
            >
              End Consult
            </button>
          </div>

          {/* Message thread */}
          <div style={{
            minHeight: 120,
            maxHeight: 280,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                Write your message below. The Architect will respond here.
              </div>
            )}

            {messages.map(msg => {
              const isSystem = msg.type === 'dm_system';
              const isMe = !msg.is_dm && !isSystem;

              if (isSystem) {
                return (
                  <div key={msg.id} style={{ textAlign: 'center', fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '4px 0' }}>
                    {msg.content}
                  </div>
                );
              }

              return (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>
                    {msg.sender_name || (msg.is_dm ? 'The Architect' : char.name)}
                  </div>
                  <div style={{
                    maxWidth: '82%',
                    background: isMe ? 'rgba(121,245,167,0.08)' : 'rgba(240,238,235,0.06)',
                    border: `1px solid ${isMe ? COLORS.magic + '33' : COLORS.border}`,
                    borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '8px 12px',
                    fontSize: 12,
                    color: COLORS.text,
                    fontFamily: 'Georgia, serif',
                    lineHeight: 1.5,
                  }}>
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

          {/* Input area */}
          {!sessionEnded ? (
            <div style={{ padding: '10px 12px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write to the Architect… (Enter to send)"
                style={{
                  flex: 1,
                  background: COLORS.surface,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: 12,
                  color: COLORS.text,
                  fontFamily: 'Georgia, serif',
                  outline: 'none',
                }}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                style={{
                  background: COLORS.magicBg,
                  border: `1px solid ${COLORS.magic}`,
                  borderRadius: 6,
                  padding: '8px 12px',
                  cursor: sending || !input.trim() ? 'default' : 'pointer',
                  fontSize: 10,
                  color: COLORS.magicText,
                  fontFamily: "'Cinzel', serif",
                  opacity: sending ? 0.6 : 1,
                }}
              >
                →
              </button>
            </div>
          ) : (
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${COLORS.border}`, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>
              This consult has ended.
            </div>
          )}

          {error && (
            <div style={{ padding: '0 16px 10px', fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
  