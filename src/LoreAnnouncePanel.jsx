import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

export default function LoreAnnouncePanel({ campaignId, embedded }) {
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [characters, setCharacters] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load approved characters for this campaign
    supabase.from('characters').select('*')
      .eq('campaign_id', String(campaignId))
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data) {
          const chars = data.map(row => ({
            id: row.id,
            name: row.data?.name || row.name || 'Unknown',
          }));
          setCharacters(chars);
          setSelected(chars.map(c => c.id));
        }
      });

      

    // Check for active session
    supabase.from('sessions').select('*')
  .eq('status', 'active')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle()
  .then(({ data }) => setActiveSession(data || null));
  }, [campaignId]);

  const toggleChar = (id) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
  if (campaignId) {
    supabase.from('characters').select('*')
      .eq('campaign_id', String(campaignId))
      .eq('status', 'approved')
      .then(({ data }) => {
        if (data) {
          const chars = data.map(row => ({
            id: row.id,
            name: row.data?.name || row.name || 'Unknown',
          }));
          setCharacters(chars);
          setSelected(chars.map(c => c.id));
        }
      });
  }

  // Always check for active session regardless of campaignId
  supabase.from('sessions').select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
    .then(({ data }) => setActiveSession(data || null));
}, [campaignId]);

  const handleAnnounce = async () => {
    if (!text.trim() || !activeSession) return;
    setSending(true);
    setError(null);

    const sessionDate = new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    const entryTitle = title.trim() || `Lore Event · ${sessionDate}`;

    try {
      // 1. Save to DM Memory
      await supabase.from('dm_memory').insert({
        campaign_id: String(campaignId),
        category: 'lore',
        content: `[LORE ANNOUNCEMENT] ${entryTitle}: ${text.trim()}`,
      });

      // 2. Push to each selected character's Grimoire
      await Promise.all(selected.map(charId =>
        supabase.from('grimoire_entries').insert({
          character_id: String(charId),
          campaign_id: String(campaignId),
          type: 'lore',
          title: entryTitle,
          body: text.trim(),
          dm_note: null,
        })
      ));

      // 3. Log to Hercules event log
      await supabase.from('hercules_events').insert({
        session_id: activeSession.id,
        type: 'lore',
        actor_name: 'The Architect',
        actor_id: null,
        description: `⟦ LORE ⟧ ${entryTitle} — ${text.trim()}`,
      });

      // 4. Send to player inboxes
      await Promise.all(selected.map(charId =>
        supabase.from('messages').insert({
          character_id: String(charId),
          campaign_id: String(campaignId),
          session_id: activeSession.id,
          type: 'lore_announcement',
          content: text.trim(),
          sender_name: 'The Architect',
          is_dm: true,
          lore_title: entryTitle,
        })
      ));

      setDone(true);
      setTimeout(() => {
        setDone(false);
        setText('');
        setTitle('');
      }, 3000);

    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Session status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: activeSession ? 'rgba(121,245,167,0.06)' : 'rgba(224,90,90,0.06)',
        border: `1px solid ${activeSession ? 'rgba(121,245,167,0.25)' : 'rgba(224,90,90,0.25)'}`,
        borderRadius: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: activeSession ? '#79f5a7' : '#e05a5a',
        }} />
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 9,
          color: activeSession ? '#79f5a7' : '#e05a5a',
          letterSpacing: '0.12em',
        }}>
          {activeSession ? 'Active Session — Ready to Announce' : 'No Active Session — Start a session to announce'}
        </div>
      </div>

      {/* Title */}
      <div>
        <div style={{ ...label8(), marginBottom: 6 }}>Event Title</div>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g. The Grave Bull Rises…"
          style={{
            width: '100%', background: COLORS.card,
            border: `1px solid ${COLORS.border}`, borderRadius: 7,
            padding: '9px 12px', fontFamily: 'Georgia, serif',
            fontSize: 12, color: COLORS.text, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Body */}
      <div>
        <div style={{ ...label8(), marginBottom: 6 }}>Lore Text</div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          placeholder="Write the lore event as it would appear to players…"
          style={{
            width: '100%', background: COLORS.card,
            border: `1px solid ${COLORS.border}`, borderRadius: 7,
            padding: '9px 12px', fontFamily: 'Georgia, serif',
            fontSize: 12, color: COLORS.text, outline: 'none',
            resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7,
          }}
        />
      </div>

      {/* Character selector */}
      {characters.length > 0 && (
        <div>
          <div style={{ ...label8(), marginBottom: 8 }}>Send to Characters</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {characters.map(c => {
              const on = selected.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleChar(c.id)} style={{
                  background: on ? 'rgba(200,168,74,0.14)' : 'transparent',
                  border: `1px solid ${on ? 'rgba(200,168,74,0.55)' : COLORS.border}`,
                  borderRadius: 6, padding: '5px 12px', cursor: 'pointer',
                  fontFamily: "'Cinzel', serif", fontSize: 9,
                  color: on ? '#e8c84a' : COLORS.dim,
                  letterSpacing: '0.08em', transition: 'all 0.15s',
                }}>
                  {on ? '✦ ' : ''}{c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div style={{
          padding: '8px 12px', background: COLORS.warnBg,
          border: `1px solid ${COLORS.warn}44`, borderRadius: 6,
          fontSize: 11, color: COLORS.warn, fontFamily: 'Georgia, serif',
        }}>{error}</div>
      )}

      <button
        onClick={handleAnnounce}
        disabled={!text.trim() || !activeSession || sending || done}
        style={{
          background: done ? 'rgba(121,245,167,0.12)'
            : (!text.trim() || !activeSession) ? 'transparent'
            : 'rgba(200,168,74,0.16)',
          border: `1px solid ${done ? 'rgba(121,245,167,0.4)'
            : (!text.trim() || !activeSession) ? COLORS.border
            : 'rgba(200,168,74,0.55)'}`,
          borderRadius: 8, padding: '11px',
          cursor: (!text.trim() || !activeSession || sending) ? 'default' : 'pointer',
          fontFamily: "'Cinzel', serif", fontSize: 10,
          color: done ? '#79f5a7'
            : (!text.trim() || !activeSession) ? COLORS.dim
            : '#e8c84a',
          fontWeight: 700, letterSpacing: '0.12em',
          transition: 'all 0.15s',
        }}
      >
        {done ? '✓ Announced to All' : sending ? 'Announcing…' : '⟦ LORE ⟧ Announce to World'}
      </button>

      <div style={{
        fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif',
        fontStyle: 'italic', lineHeight: 1.6,
      }}>
        Fires to: DM Memory · Player Grimoires · Hercules Log · Player Inboxes
      </div>
    </div>
  );
}