import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { COLORS, CAMPAIGNS } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
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

      // Deduct 1 AP
      const newAp = Math.max(0, apCurrent - 1);
      await supabase
        .from('characters')
        .update({ data: { ...char, apCurrent: newAp } })
        .eq('id', char.id);

      // Save to messages table
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

// ─── DM CONSULT ───────────────────────────────────────────────────────────────
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
          borderRadius: 8, padding: '12px 16px',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', transition: 'all 0.15s',
        }}
      >
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: COLORS.text, letterSpacing: '0.06em' }}>
            ✉ Consult the DM
          </div>
          <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
            Send a private message · No AP cost
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
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Write your message to the DM…"
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
            onClick={handleSend}
            disabled={sending || !message.trim()}
            style={{
              background: sent ? COLORS.magicBg : 'rgba(240,238,235,0.06)',
              border: `1px solid ${sent ? COLORS.magic : COLORS.borderMid}`,
              borderRadius: 6, padding: '10px 20px',
              cursor: sending || !message.trim() ? 'default' : 'pointer',
              fontFamily: "'Cinzel', serif", fontSize: 9,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: sent ? COLORS.magicText : COLORS.text,
              opacity: sending ? 0.6 : 1, transition: 'all 0.2s',
            }}
          >
            {sent ? '✓ Message Sent' : sending ? 'Sending…' : '✦ Send to DM'}
          </button>

          {error && (
            <div style={{ marginTop: 10, fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {error}
            </div>
          )}

          {sent && (
            <div style={{ marginTop: 12, fontSize: 11, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              The DM has been notified. They will respond in due time.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
