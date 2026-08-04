import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { buildLiveNpcRoster } from './scribe-context';
import { LOCATIONS } from './MapPanel';

const SpeechRecognitionImpl = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null;

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
  const [recentIntents, setRecentIntents] = useState([]);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [respondedIntentIds, setRespondedIntentIds] = useState(new Set());
  const [listening, setListening] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [interim, setInterim] = useState('');
  const [narratorMsg, setNarratorMsg] = useState(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  // Stop the mic if the panel unmounts mid-listen.
  useEffect(() => () => { try { recognitionRef.current?.stop(); } catch { /* already stopped */ } }, []);

  // Send the rough speech transcript to Gemini to clean it into a lore announcement.
  const polishTranscript = async (raw) => {
    const clean = (raw || '').replace(/\s+/g, ' ').trim();
    if (!clean) { setNarratorMsg('Nothing was heard — try again.'); return; }
    setPolishing(true);
    setNarratorMsg(null);
    const appendToText = (val) => setText(prev => prev.trim() ? `${prev.trim()}\n\n${val}` : val);
    try {
      // Pull the live NPC roster + current scene so the AI can suggest real,
      // location-appropriate NPCs when the GM refers to someone by role only.
      let npcBlock = '';
      try {
        const [roster, { data: camp }] = await Promise.all([
          buildLiveNpcRoster(80),
          supabase.from('campaigns').select('map_url').eq('id', String(campaignId)).maybeSingle(),
        ]);
        const loc = camp?.map_url ? LOCATIONS.find(l => l.filename === camp.map_url) : null;
        if (roster) {
          npcBlock = `\n\nKNOWN NPC ROSTER (real, canonical NPCs from the campaign's records):\n${roster}\n\nWhen the GM refers to an unnamed local by role only (e.g. "the bartender", "a guard", "the innkeeper", "some merchant", "a priest"), look through this roster and, if a fitting NPC exists${loc ? ` for the current scene — ${loc.name} — (judge by their role/faction/notes)` : ''}, weave that NPC's real name in naturally. Never invent NPCs who are not in the roster; if none fit, keep the generic description as spoken.`;
        }
      } catch { /* roster is optional — never block the announcement */ }
      const system = `You are the Narrator's scribe for a fantasy tabletop RPG set in the world of Soteria. The Game Master is speaking aloud and you receive a rough speech-to-text transcript. Rewrite it into a clean, vivid lore announcement addressed to the players, as it should appear in-world. Fix grammar, punctuation, and run-on sentences; remove filler words (um, uh, like, you know) and false starts. Preserve the GM's meaning, names, places, and intent — never invent new plot or facts. Keep the GM's voice; be concise and evocative. Return ONLY the polished announcement text — no preamble, no quotation marks, no notes.${npcBlock}`;
      const { data, error } = await supabase.functions.invoke('scribe', {
        body: { system, messages: [{ role: 'user', content: clean }], max_tokens: 800 },
      });
      if (error) throw new Error(error.message || 'relay failed');
      if (data?.error) throw new Error(data.error.message || 'relay error');
      const polished = data?.choices?.[0]?.message?.content?.trim();
      appendToText(polished || clean);
      setNarratorMsg(polished ? '✓ Narration cleaned & added' : 'Added transcript (no cleanup returned)');
    } catch (err) {
      // Never lose what was spoken — drop the raw transcript in if AI cleanup fails.
      appendToText(clean);
      setNarratorMsg(`Added raw transcript — AI cleanup unavailable (${err.message || 'error'})`);
    } finally {
      setPolishing(false);
      setInterim('');
      finalTranscriptRef.current = '';
    }
  };

  const startNarrator = () => {
    if (!SpeechRecognitionImpl) { setNarratorMsg('Speech recognition is not supported in this browser (use Chrome or Edge).'); return; }
    const rec = new SpeechRecognitionImpl();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    finalTranscriptRef.current = '';
    setInterim('');
    setNarratorMsg(null);
    rec.onresult = (e) => {
      let live = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTranscriptRef.current += chunk + ' ';
        else live += chunk;
      }
      setInterim(live);
    };
    rec.onerror = (e) => {
      setNarratorMsg(e.error === 'not-allowed' ? 'Microphone blocked — allow mic access and try again.' : `Mic error: ${e.error}`);
    };
    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
      polishTranscript(finalTranscriptRef.current);
    };
    recognitionRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { /* start after an abrupt stop */ }
  };

  const stopNarrator = () => {
    const rec = recognitionRef.current;
    if (rec) { try { rec.stop(); } catch { setListening(false); } }
    else setListening(false);
  };

  const toggleNarrator = () => { if (listening) stopNarrator(); else startNarrator(); };

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

  useEffect(() => {
    if (!campaignId) return;
    supabase.from('dm_memory').select('*')
      .eq('campaign_id', String(campaignId))
      .eq('category', 'intent')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setRecentIntents(data || []));

    supabase.from('dm_memory').select('content')
      .eq('campaign_id', String(campaignId))
      .eq('category', 'lore')
      .then(({ data }) => {
        const ids = new Set();
        (data || []).forEach(row => {
          const match = row.content?.match(/\[REPLY TO INTENT (\S+)\]/);
          if (match) ids.add(match[1]);
        });
        setRespondedIntentIds(ids);
      });
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
  .then(({ data }) => {
    if (data) {
      setActiveSession(data);
      // Load characters from the active session's campaign
      supabase.from('characters').select('*')
        .eq('campaign_id', String(data.campaign_id))
        .eq('status', 'approved')
        .then(({ data: chars }) => {
          if (chars) {
            const mapped = chars.map(row => ({
              id: row.id,
              name: row.data?.name || row.name || 'Unknown',
            }));
            setCharacters(mapped);
            setSelected(mapped.map(c => c.id));
          }
        });
    }
  });
}, [campaignId]);

  const handleAnnounce = async () => {
    if (!text.trim() || !activeSession) return;
    setSending(true);
    setError(null);

    const sessionDate = new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });
    const entryTitle = title.trim() || `Lore Event · ${sessionDate}`;

    const replyTag = selectedIntent ? `[REPLY TO INTENT ${selectedIntent.id}] ` : '';

    try {
      // 1. Save to DM Memory
      await supabase.from('dm_memory').insert({
        campaign_id: String(campaignId),
        category: 'lore',
        content: `${replyTag}[LORE ANNOUNCEMENT] ${entryTitle}: ${text.trim()}`,
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
      const { data: hSession } = await supabase.from('hercules_sessions')
        .select('id').eq('campaign_id', String(campaignId)).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (hSession?.id) {
        await supabase.from('hercules_events').insert({
          session_id: hSession.id,
          type: 'lore',
          actor_name: 'The Architect',
          actor_id: null,
          description: `⟦ LORE ⟧ ${entryTitle} — ${text.trim()}`,
          dm_approved: true,
        });
      }

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

      if (selectedIntent) {
        setRespondedIntentIds(prev => new Set(prev).add(String(selectedIntent.id)));
      }

      setDone(true);
      setTimeout(() => {
        setDone(false);
        setText('');
        setTitle('');
        setSelectedIntent(null);
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

      {/* Recent intents */}
      {recentIntents.length > 0 && (
        <div>
          <div style={{ ...label8(), marginBottom: 8 }}>Recent Declared Intent</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
            {recentIntents.map(m => {
              const isSelected = selectedIntent?.id === m.id;
              const isResponded = respondedIntentIds.has(String(m.id));
              return (
                <button key={m.id} type="button"
                  onClick={() => setSelectedIntent(isSelected ? null : m)}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    background: isSelected ? 'rgba(200,168,74,0.16)' : 'rgba(200,168,74,0.05)',
                    border: `1px solid ${isSelected ? 'rgba(200,168,74,0.6)' : 'rgba(200,168,74,0.2)'}`,
                    borderRadius: 6, padding: '7px 10px',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>{m.content.replace('[INTENT] ', '')}</div>
                    {isResponded && <div style={{ fontSize: 7, color: '#79f5a7', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>✓ Replied</div>}
                  </div>
                  <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif", marginTop: 3 }}>{new Date(m.created_at).toLocaleString()}</div>
                </button>
              );
            })}
          </div>
          {selectedIntent && (
            <div style={{ marginTop: 8, fontSize: 9, color: '#e8c84a', fontFamily: 'Georgia, serif', fontStyle: 'italic', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Replying to: {selectedIntent.content.replace('[INTENT] ', '').slice(0, 60)}{selectedIntent.content.length > 60 ? '…' : ''}</span>
              <button type="button" onClick={() => setSelectedIntent(null)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 11 }}>✕</button>
            </div>
          )}
        </div>
      )}

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
        <style>{`@keyframes narratorPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <div style={{ ...label8() }}>Lore Text</div>
          {SpeechRecognitionImpl && (
            <button
              type="button"
              onClick={toggleNarrator}
              disabled={polishing}
              title="Narrator — speak your lore aloud; AI transcribes and cleans it up"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: listening ? 'rgba(224,90,90,0.16)' : 'rgba(200,168,74,0.12)',
                border: `1px solid ${listening ? 'rgba(224,90,90,0.6)' : 'rgba(200,168,74,0.5)'}`,
                borderRadius: 6, padding: '5px 10px',
                cursor: polishing ? 'default' : 'pointer',
                fontFamily: "'Cinzel', serif", fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: listening ? '#e0776f' : '#e8c84a', opacity: polishing ? 0.6 : 1,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: listening ? '#e05a5a' : '#c8a84a', boxShadow: listening ? '0 0 8px rgba(224,90,90,0.9)' : 'none', animation: listening ? 'narratorPulse 1.1s ease-in-out infinite' : 'none' }} />
              {polishing ? 'Cleaning…' : listening ? 'Stop & Transcribe' : '🎙 Narrator'}
            </button>
          )}
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={5}
          placeholder="Write the lore event as it would appear to players…"
          style={{
            width: '100%', background: COLORS.card,
            border: `1px solid ${listening ? 'rgba(224,90,90,0.4)' : COLORS.border}`, borderRadius: 7,
            padding: '9px 12px', fontFamily: 'Georgia, serif',
            fontSize: 12, color: COLORS.text, outline: 'none',
            resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.7,
            transition: 'border-color 0.2s ease',
          }}
        />
        {(listening || interim || polishing || narratorMsg) && (
          <div style={{ marginTop: 6, fontSize: 10, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
            {listening && (
              <span style={{ color: '#e0776f', fontStyle: 'italic' }}>
                ● Listening… speak your lore, then press Stop.{interim ? ` “${interim}”` : ''}
              </span>
            )}
            {!listening && polishing && <span style={{ color: '#e8c84a', fontStyle: 'italic' }}>Cleaning up your narration…</span>}
            {!listening && !polishing && narratorMsg && <span style={{ color: narratorMsg.startsWith('✓') ? '#79f5a7' : COLORS.dim, fontStyle: 'italic' }}>{narratorMsg}</span>}
          </div>
        )}
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