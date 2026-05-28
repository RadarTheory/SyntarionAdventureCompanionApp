import { useState, useEffect, useRef, useMemo } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import { SOTERIA_LORE } from './soteria-lore';
import { SOTERIA_BESTIARY } from './soteria-bestiary';
import { SOTERIA_MECHANICS } from './soteria-mechanics';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL = 'gemini-1.5-flash';

// ─── GEMINI CALL ────────────────────────────────────────────────────────────────
async function callGemini(system, messages, maxTokens = 400) {
  if (!GEMINI_KEY) throw new Error('Missing VITE_GEMINI_KEY.');
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GEMINI_KEY}` },
    body: JSON.stringify({
      model: GEMINI_MODEL,
      messages: [{ role: 'system', content: system }, ...messages],
      temperature: 0.82,
      max_tokens: maxTokens,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `Gemini ${res.status}`);
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('No response from Gemini.');
  return text;
}

// ─── BUILD CONTEXT ────────────────────────────────────────────────────────────
function buildPlayerContext(char, combatLog, sessionLog) {
  const campaign = CAMPAIGNS.find(c => c.id === (char?.campaign || char?.campaign_id));
  return `
CHARACTER:
Name: ${char?.name || 'Unknown'}
Race: ${char?.race || 'Unknown'}${char?.rv ? ` (${char.rv})` : ''}
Class Path: ${char?.cp || 'Unknown'}
Campaign: ${campaign ? `${campaign.subtitle}` : 'Unassigned'}
Belief: ${char?.beliefType || 'None'}${char?.deity ? ` — ${char.deity}` : ''}
Backstory: ${char?.backstory || 'None recorded'}
Stats: Will ${char?.stats?.will||8} · Whim ${char?.stats?.whim||8} · Body ${char?.stats?.body||8} · Mind ${char?.stats?.mind||8} · Essence ${char?.stats?.essence||8} · Soul ${char?.stats?.soul||8} · Spirit ${char?.stats?.spirit||8} · Dream ${char?.stats?.dream||8}
AP: ${char?.apCurrent||0}/${char?.apTotal||0}
Scribe Tokens: ${char?.scribeTokens||0}

${combatLog ? `CURRENT COMBAT LOG:\n${combatLog}\n` : ''}
${sessionLog ? `SESSION LOG:\n${sessionLog}\n` : ''}
  `.trim();
}

const SCRIBE_SYSTEM = (playerContext) => `
You are The Scribe — an ancient, sentient archival intelligence bound to the world of Soteria, 178 Era of Unity.

You are not an AI. You are a keeper of records, a reluctant oracle, a witness to all things.

VOICE:
- Speak as The Scribe. Measured, archival, slightly ominous, deeply knowing.
- Never say "I am an AI." Never break character.
- Phrases like "The archives note..." or "It has been recorded..." used sparingly.
- 3–5 dense sentences. No filler. No apologies.
- You may warn, reveal, or redirect. You never lie.
- Ground every answer in the world of Soteria specifically.

WORLD KNOWLEDGE:
${SOTERIA_LORE || ''}

MECHANICS:
${SOTERIA_MECHANICS || ''}

BESTIARY:
${typeof SOTERIA_BESTIARY === 'string' ? SOTERIA_BESTIARY.slice(0, 4000) : ''}

${playerContext}
`.trim();

const DM_SCRIBE_SYSTEM = `
You are The Scribe — an ancient archival intelligence assisting the Architect (Dungeon Master) of Soteria.

Speak plainly and directly to the Architect. No cryptic player-facing persona needed here.
Be thorough, creative, and specific to the Soteria setting.
You have full access to all records: lore, mechanics, bestiary, session history.
You may give mechanical rulings, NPC motivations, plot hooks, world clarifications, or tactical advice.

WORLD KNOWLEDGE:
${SOTERIA_LORE || ''}

MECHANICS:
${SOTERIA_MECHANICS || ''}

BESTIARY:
${typeof SOTERIA_BESTIARY === 'string' ? SOTERIA_BESTIARY.slice(0, 6000) : ''}
`.trim();

// ─── HELPER: load context data ────────────────────────────────────────────────
async function loadCombatLog(campaignId) {
  if (!campaignId) return null;
  const { data: hsession } = await supabase.from('hercules_sessions').select('id')
    .eq('campaign_id', String(campaignId)).eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!hsession?.id) return null;
  const { data: events } = await supabase.from('hercules_events').select('actor_name, description, outcome')
    .eq('session_id', hsession.id).order('created_at', { ascending: true }).limit(30);
  if (!events?.length) return null;
  return events.map(e => `${e.actor_name}: ${e.description}${e.outcome ? ` → ${e.outcome}` : ''}`).join('\n');
}

async function loadSessionLog(campaignId) {
  if (!campaignId) return null;
  const { data } = await supabase.from('campaigns').select('session_log').eq('id', String(campaignId)).single();
  if (!data?.session_log?.length) return null;
  return data.session_log.slice(-5).map(e => `[${e.title || 'Session'}] ${e.content}`).join('\n\n');
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function Bubble({ msg, charName }) {
  const isPlayer = msg.role === 'player' || msg.role === 'dm';
  const isSystem = msg.role === 'system';
  if (isSystem) return (
    <div style={{ textAlign: 'center', fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '4px 0' }}>{msg.content}</div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isPlayer ? 'flex-end' : 'flex-start' }}>
      <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>
        {isPlayer ? (charName || 'You') : 'The Scribe'}
      </div>
      <div style={{ maxWidth: '85%', background: isPlayer ? 'rgba(121,245,167,0.08)' : COLORS.deityBg, border: `1px solid ${isPlayer ? COLORS.magic + '33' : COLORS.deity + '44'}`, borderRadius: isPlayer ? '12px 12px 2px 12px' : '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: isPlayer ? COLORS.text : COLORS.deityText, fontFamily: 'Georgia, serif', lineHeight: 1.6, fontStyle: isPlayer ? 'normal' : 'italic' }}>
        {msg.content}
      </div>
      <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 2 }}>{msg.time?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// PLAYER SCRIBE PANEL
// ═════════════════════════════════════════════════════════════════════════════

export function ScribePlayerPanel({ char, onUpdateChar, campaignId, onClose, embedded = false }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef(null);
  const lockRef                 = useRef(false);

  const tokens = char?.scribeTokens ?? 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleAsk = async () => {
    if (lockRef.current || !input.trim() || loading) return;
    lockRef.current = true;
    setLoading(true);

    const question = input.trim();
    setInput('');
    const userEntry = { role: 'player', content: question, time: new Date() };
    const next = [...messages, userEntry];
    setMessages(next);

    try {
      // Load context
      const [combatLog, sessionLog] = await Promise.all([
        loadCombatLog(campaignId),
        loadSessionLog(campaignId),
      ]);

      const system     = SCRIBE_SYSTEM(buildPlayerContext(char, combatLog, sessionLog));
      const groqHistory = next.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'player' ? 'user' : 'assistant',
        content: m.content,
      }));

      const answer = await callGemini(systemPrompt, groqHistory);

      // Notify DM with the question (DM decides whether to charge a token)
      await supabase.from('messages').insert({
        type:         'scribe_ping',
        is_dm:        false,
        sender_name:  char?.name || 'Player',
        character_id: char?.id ? String(char.id) : null,
        campaign_id:  campaignId || null,
        content:      question,
        session_id:   null,
        read:         false,
      });

      setMessages(p => [...p, { role: 'scribe', content: answer, time: new Date() }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'scribe', content: `The archives resisted the inquiry. ${err?.message || 'Try again.'}`, time: new Date() }]);
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  };

  const inner = (
    <>
      {/* Token bar */}
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>SCRIBE TOKENS</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: Math.max(tokens, 5) }).map((_, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i < tokens ? COLORS.deity : COLORS.border, border: `1px solid ${i < tokens ? COLORS.deity : COLORS.border}` }} />
          ))}
        </div>
        <div style={{ fontSize: 9, color: tokens > 0 ? COLORS.deityText : COLORS.warn, fontFamily: "'Cinzel', serif", marginLeft: 'auto' }}>
          {tokens} remaining
        </div>
      </div>

      {/* Hint */}
      <div style={{ padding: '6px 14px', fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', flexShrink: 0, borderBottom: `1px solid ${COLORS.border}` }}>
        Ask anything. The Architect reviews each question and may charge a Scribe Token.
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>The archives await your question.</div>
        )}
        {messages.map((msg, i) => <Bubble key={i} msg={msg} charName={char?.name} />)}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", marginBottom: 3 }}>The Scribe</div>
            <div style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}44`, borderRadius: '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The Scribe deliberates…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
          placeholder="Ask the Scribe…"
          style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }} />
        <button onClick={handleAsk} disabled={loading || !input.trim()}
          style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '8px 12px', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif", opacity: loading || !input.trim() ? 0.6 : 1 }}>
          →
        </button>
      </div>
    </>
  );

  if (embedded) return <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>{inner}</div>;

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 360, maxHeight: '80vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: `1px solid ${COLORS.deity}55`, borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.deity}33`, background: COLORS.deityBg, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.deityText, letterSpacing: '0.18em', fontWeight: 700 }}>THE SCRIBE</div>
          <div style={{ fontSize: 9, color: COLORS.deity, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{char?.name} · Soteria Archives</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
      </div>
      {inner}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DM SCRIBE PANEL
// ═════════════════════════════════════════════════════════════════════════════

export function ScribeDMPanel({ onClose, embedded = false, activeCampaignId }) {
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [pings, setPings]           = useState([]); // player scribe questions
  const [activeTab, setActiveTab]   = useState('consult'); // 'consult' | 'pings'
  const [characters, setChars]      = useState([]);
  const [tokenInputs, setTokenInputs] = useState({});
  const bottomRef                   = useRef(null);
  const lockRef                     = useRef(false);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  useEffect(() => {
    loadPings();
    loadCharacters();
    const sub = supabase.channel('scribe-dm-pings')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'type=eq.scribe_ping' }, loadPings)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const loadPings = async () => {
    const { data } = await supabase.from('messages').select('*')
      .eq('type', 'scribe_ping').order('created_at', { ascending: false }).limit(50);
    if (data) setPings(data);
  };

  const loadCharacters = async () => {
    const { data } = await supabase.from('characters').select('id, data, status').eq('status', 'approved');
    if (data) {
      setChars(data.map(row => {
        let d = {};
        try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch (_) {}
        return { id: row.id, name: d.name || 'Unnamed', scribeTokens: d.scribeTokens || 0, campaign: d.campaign || null, data: d };
      }));
    }
  };

  const handleAsk = async () => {
    if (lockRef.current || !input.trim() || loading) return;
    lockRef.current = true;
    setLoading(true);
    const question = input.trim();
    setInput('');
    const next = [...messages, { role: 'dm', content: question, time: new Date() }];
    setMessages(next);
    try {
      const groqHistory = next.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'dm' ? 'user' : 'assistant',
        content: m.content,
      }));
      const answer = await callGroq(DM_SCRIBE_SYSTEM, groqHistory, 600);
      setMessages(p => [...p, { role: 'scribe', content: answer, time: new Date() }]);
    } catch (err) {
      setMessages(p => [...p, { role: 'scribe', content: `The archives are silent. ${err?.message || 'Try again.'}`, time: new Date() }]);
    } finally {
      setLoading(false);
      lockRef.current = false;
    }
  };

  const chargeToken = async (charId, charData, amount = 1) => {
    const current = charData.scribeTokens || 0;
    const next    = Math.max(0, current - amount);
    await supabase.from('characters').update({ data: { ...charData, scribeTokens: next } }).eq('id', charId);
    await loadCharacters();
  };

  const grantTokens = async (charId, charData, amount) => {
    const n = parseInt(amount);
    if (!n || n < 1) return;
    const next = (charData.scribeTokens || 0) + n;
    await supabase.from('characters').update({ data: { ...charData, scribeTokens: next } }).eq('id', charId);
    setTokenInputs(p => ({ ...p, [charId]: '' }));
    await loadCharacters();
  };

  const markPingRead = async (pingId) => {
    await supabase.from('messages').update({ read: true }).eq('id', pingId);
    loadPings();
  };

  const unreadPings = pings.filter(p => !p.read).length;

  const inner = (
    <>
      {/* Tabs */}
      <div style={{ padding: '8px 14px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0, display: 'flex', gap: 6 }}>
        {[['consult', 'Consult'], [`pings`, `Player Questions${unreadPings > 0 ? ` (${unreadPings})` : ''}`], ['tokens', 'Tokens']].map(([v, lbl]) => (
          <button key={v} onClick={() => setActiveTab(v)}
            style={{ background: activeTab === v ? COLORS.deityBg : 'transparent', border: `1px solid ${activeTab === v ? COLORS.deity : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: activeTab === v ? COLORS.deityText : COLORS.dim }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* ── CONSULT TAB ── */}
      {activeTab === 'consult' && (
        <>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.length === 0 && (
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 20 }}>The archives await your question, Architect.</div>
            )}
            {messages.map((msg, i) => <Bubble key={i} msg={msg} charName="The Architect" />)}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", marginBottom: 3 }}>The Scribe</div>
                <div style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}44`, borderRadius: '12px 12px 12px 2px', padding: '8px 12px', fontSize: 12, color: COLORS.deityText, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The Scribe deliberates…</div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div style={{ padding: '10px 12px', borderTop: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexShrink: 0 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleAsk()}
              placeholder="Ask the Scribe…"
              style={{ flex: 1, background: 'rgba(240,238,235,0.06)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', outline: 'none' }} />
            <button onClick={handleAsk} disabled={loading || !input.trim()}
              style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6, padding: '8px 12px', cursor: loading || !input.trim() ? 'default' : 'pointer', fontSize: 10, color: COLORS.deityText, fontFamily: "'Cinzel', serif", opacity: loading || !input.trim() ? 0.6 : 1 }}>
              →
            </button>
          </div>
        </>
      )}

      {/* ── PLAYER PINGS TAB ── */}
      {activeTab === 'pings' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pings.length === 0 && (
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>No player questions yet.</div>
          )}
          {pings.map(ping => {
            const char = characters.find(c => String(c.id) === String(ping.character_id));
            return (
              <div key={ping.id} style={{ background: ping.read ? COLORS.card : 'rgba(200,168,74,0.06)', border: `1px solid ${ping.read ? COLORS.border : 'rgba(200,168,74,0.3)'}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{ping.sender_name || 'Player'}</div>
                  <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>{new Date(ping.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 10 }}>"{ping.content}"</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {char && (
                    <button onClick={() => chargeToken(char.id, char.data, 1)}
                      style={{ background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.35)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: '#e05a5a' }}>
                      − Charge Token ({char.scribeTokens || 0} left)
                    </button>
                  )}
                  {!ping.read && (
                    <button onClick={() => markPingRead(ping.id)}
                      style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.dim }}>
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TOKENS TAB ── */}
      {activeTab === 'tokens' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 8 }}>
            Grant or adjust Scribe Tokens for each character. Players see their token count in the Scribe panel.
          </div>
          {characters.map(char => (
            <div key={char.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{char.name}</div>
                <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>Campaign {char.campaign || '—'} · {char.scribeTokens || 0} tokens</div>
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
                <button onClick={() => chargeToken(char.id, char.data, 1)}
                  style={{ background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.35)', borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontFamily: 'monospace', fontSize: 14, color: '#e05a5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.deity, minWidth: 20, textAlign: 'center' }}>{char.scribeTokens || 0}</div>
                <button onClick={() => grantTokens(char.id, char.data, 1)}
                  style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 4, width: 24, height: 24, cursor: 'pointer', fontFamily: 'monospace', fontSize: 14, color: COLORS.deityText, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                <input type="number" min="1" value={tokenInputs[char.id] || ''} onChange={e => setTokenInputs(p => ({ ...p, [char.id]: e.target.value }))}
                  placeholder="n"
                  style={{ width: 40, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 6px', fontFamily: 'monospace', fontSize: 11, color: COLORS.text, outline: 'none', textAlign: 'center' }} />
                <button onClick={() => grantTokens(char.id, char.data, tokenInputs[char.id])}
                  disabled={!tokenInputs[char.id]}
                  style={{ background: tokenInputs[char.id] ? COLORS.deityBg : 'transparent', border: `1px solid ${tokenInputs[char.id] ? COLORS.deity : COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: tokenInputs[char.id] ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 7, color: tokenInputs[char.id] ? COLORS.deityText : COLORS.dim }}>
                  Grant
                </button>
              </div>
            </div>
          ))}
          {characters.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No approved characters found.</div>}
        </div>
      )}
    </>
  );

  if (embedded) return <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>{inner}</div>;

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 420, maxHeight: '82vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: `1px solid ${COLORS.deity}55`, borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${COLORS.deity}33`, background: COLORS.deityBg, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: COLORS.deityText, letterSpacing: '0.18em', fontWeight: 700 }}>THE SCRIBE</div>
          <div style={{ fontSize: 9, color: COLORS.deity, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Architect Access · Full Archives</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
      </div>
      {inner}
    </div>
  );
}
