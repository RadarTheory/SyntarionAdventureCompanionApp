import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

export default function IntentDeclare({ campaignId, char, compact = false }) {
  const [text, setText]       = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

 useEffect(() => {
    if (!campaignId) return;
    supabase.from('sessions')
      .select('id').eq('campaign_id', String(campaignId))
      .eq('status', 'active').order('created_at', { ascending: false })
      .limit(1).maybeSingle()
      .then(({ data }) => setSessionId(data?.id || null));
  }, [campaignId]);

  const submit = async () => {
    if (!text.trim() || !sessionId || sending) return;
    setSending(true);

    const intentText = text.trim();
    const actorName = char?.name || 'Player';
    const actorId = char?.id ? String(char.id) : null;

    // 1. Grimoire — personal journal entry
    await supabase.from('grimoire_entries').insert({
      character_id: actorId,
      campaign_id: String(campaignId),
      type: 'event',
      title: `Intent Declared`,
      content: `${actorName} declared intent: ${intentText}`,
      is_dm: false,
    });

    // 2. DM Memory — so it surfaces in the Log tab for the table
    await supabase.from('dm_memory').insert({
      campaign_id: String(campaignId),
      category: 'intent',
      content: `[INTENT] ${actorName}: ${intentText}`,
    });

    // 3. Hercules combat log — only if a HERCULES encounter is currently active
    const { data: hsession } = await supabase
      .from('hercules_sessions').select('id')
      .eq('campaign_id', String(campaignId)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (hsession?.id) {
      await supabase.from('hercules_events').insert({
        session_id: hsession.id,
        type: 'intent',
        actor_name: actorName,
        actor_id: actorId,
        description: `[Intent] ${intentText}`,
      });
    }

    setText('');
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const active = !!sessionId;

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', width: '100%' }}>
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
        disabled={!active || sending}
        placeholder={active ? 'Declare intent…' : 'No active session'}
        style={{
          flex: 1,
          background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: `1px solid ${active ? 'rgba(200,168,74,0.3)' : COLORS.border}`,
          borderRadius: 6,
          padding: compact ? '5px 8px' : '7px 10px',
          color: active ? COLORS.text : COLORS.dim,
          fontFamily: 'Georgia, serif',
          fontStyle: active ? 'normal' : 'italic',
          fontSize: compact ? 10 : 11,
          outline: 'none',
        }}
      />
      <button
        onClick={submit}
        disabled={!active || !text.trim() || sending}
        style={{
          background: sent ? 'rgba(100,200,100,0.15)' : 'rgba(200,168,74,0.1)',
          border: `1px solid ${sent ? '#64c864' : active && text.trim() ? '#c8a84a' : COLORS.border}`,
          borderRadius: 6,
          padding: compact ? '5px 8px' : '7px 10px',
          cursor: active && text.trim() ? 'pointer' : 'not-allowed',
          color: sent ? '#64c864' : active && text.trim() ? '#e8c84a' : COLORS.dim,
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
          opacity: (!active || sending) ? 0.5 : 1,
        }}
      >
        {sent ? '✓ Sent' : '◎ Declare'}
      </button>
    </div>
  );
}