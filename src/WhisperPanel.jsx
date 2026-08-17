import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// Player → DM direct line.
//
// The receiving half already existed: DMView's inbox groups `messages` by
// session_id, counts unread on `!read && !is_dm`, and toasts on any non-DM
// insert — its handler even names the sender "A player". Nothing ever wrote
// those rows, though. Every insert into `messages` across the app was
// is_dm: true, so players could only ever be written to. This is the missing
// sending half, shaped to match what the DM inbox already reads.

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

export default function WhisperPanel({ char, campaignId, sessionId = null, embedded = false }) {
  const [thread, setThread] = useState([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const endRef = useRef(null);

  const charId = char?.id ? String(char.id) : null;

  const loadThread = useCallback(async () => {
    if (!charId) { setLoading(false); return; }
    const { data, error: readErr } = await supabase
      .from('messages')
      .select('*')
      .eq('character_id', charId)
      .order('created_at', { ascending: true })
      .limit(200);
    if (readErr) setError(`Could not read your messages: ${readErr.message}`);
    setThread(data || []);
    setLoading(false);
  }, [charId]);

  useEffect(() => {
    loadThread();
    if (!charId) return;
    // The DM's replies land in the same table, so one subscription covers both
    // directions of the conversation.
    const channel = supabase.channel(`whisper-${charId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `character_id=eq.${charId}` }, loadThread)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [charId, loadThread]);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [thread.length]);

  const send = async () => {
    const text = body.trim();
    if (!text || sending) return;
    if (!charId) { setError('No character selected.'); return; }
    setSending(true);
    setError('');

    const name = char?.name || `${char?.fn || ''} ${char?.ln || ''}`.trim() || 'Player';
    // is_dm: false is what puts this in the DM's inbox and raises their toast.
    const { data, error: sendErr } = await supabase.from('messages').insert({
      session_id: sessionId || null,
      character_id: charId,
      campaign_id: campaignId ? String(campaignId) : null,
      type: 'player_whisper',
      content: text,
      sender_name: name,
      character_name: name,
      is_dm: false,
      read: false,
    }).select('id');

    setSending(false);
    if (sendErr) { setError(`Could not send: ${sendErr.message}`); return; }
    if (!data?.length) { setError('Nothing was written — a database policy blocked this message.'); return; }
    setBody('');
    loadThread();
  };

  return (
    <div style={{ padding: embedded ? 14 : 0, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ ...label8(), marginBottom: 4 }}>Whisper to the Architect</div>
      <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
        A private line to your DM. Only they can read this.
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>Opening the line…</div>}
        {!loading && thread.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
            Nothing said yet.
          </div>
        )}
        {thread.map(m => {
          const mine = !m.is_dm;
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%', background: mine ? 'rgba(200,168,74,0.10)' : 'rgba(240,238,235,0.04)', border: `1px solid ${mine ? 'rgba(200,168,74,0.35)' : COLORS.border}`, borderRadius: 8, padding: '8px 11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 3 }}>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: mine ? '#e8c84a' : COLORS.muted }}>
                  {mine ? 'You' : (m.sender_name || 'The Architect')}
                </span>
                <span style={{ fontSize: 7, color: COLORS.dim, fontFamily: 'Georgia, serif', flexShrink: 0 }}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {error && <div style={{ marginBottom: 8, padding: '7px 10px', background: COLORS.warnBg, border: `1px solid ${COLORS.warn}`, borderRadius: 5, color: COLORS.warn, fontSize: 10, fontStyle: 'italic' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          rows={2}
          placeholder="Say something only the Architect will see… (Enter to send, Shift+Enter for a new line)"
          style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 11.5, fontFamily: 'Georgia, serif', lineHeight: 1.5, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
        />
        <button onClick={send} disabled={sending || !body.trim()}
          style={{ background: body.trim() ? 'rgba(200,168,74,0.16)' : 'transparent', border: `1px solid ${body.trim() ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 6, padding: '0 14px', cursor: body.trim() ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', color: body.trim() ? '#e8c84a' : COLORS.dim, flexShrink: 0 }}>
          {sending ? '…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
