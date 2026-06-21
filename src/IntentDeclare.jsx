import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { getOrCreateConversation, postDialogueLine } from './lib/dialogue';

function useDraggable(initial = { x: 24, y: 24 }) {
  const [pos, setPos] = useState(initial);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e) => {
    dragRef.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => { dragRef.current = false; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return { pos, onMouseDown };
}

export default function IntentDeclare({ campaignId, char, compact = false }) {
  const [mode, setMode] = useState('intent'); // 'intent' | 'speak'
  const [text, setText]       = useState('');
  const [trueIntent, setTrueIntent] = useState('');
  const [showDeception, setShowDeception] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [entities, setEntities] = useState([]);
  const [targetId, setTargetId] = useState('');

  const { pos, onMouseDown } = useDraggable({ x: 24, y: window.innerHeight - 140 });

  useEffect(() => {
    if (!campaignId) return;
    supabase.from('sessions')
      .select('id').eq('campaign_id', String(campaignId))
      .eq('status', 'active').order('created_at', { ascending: false })
      .limit(1).maybeSingle()
      .then(({ data }) => setSessionId(data?.id || null));
  }, [campaignId]);

  useEffect(() => {
    if (mode !== 'speak' || !campaignId) return;
    Promise.all([
      supabase.from('npcs').select('id, name').order('name'),
      supabase.from('beasts').select('id, name').or(`source.eq.global,campaign_id.eq.${campaignId}`).order('name'),
    ]).then(([{ data: npcData }, { data: beastData }]) => {
      const list = [
        ...(npcData || []).map(n => ({ id: n.id, name: n.name, type: 'npc' })),
        ...(beastData || []).map(b => ({ id: b.id, name: b.name, type: 'beast' })),
      ];
      setEntities(list);
    });
  }, [mode, campaignId]);

  const active = !!sessionId;
  const actorName = char?.name || 'Player';
  const actorId = char?.id ? String(char.id) : null;

  const submitIntent = async () => {
    if (!text.trim() || !sessionId || sending) return;
    setSending(true);
    const intentText = text.trim();

    await supabase.from('grimoire_entries').insert({
      character_id: actorId, campaign_id: String(campaignId),
      type: 'event', title: 'Intent Declared',
      body: `${actorName} declared intent: ${intentText}`,
    });
    await supabase.from('dm_memory').insert({
      campaign_id: String(campaignId), category: 'intent',
      content: `[INTENT] ${actorName}: ${intentText}`,
    });

    const { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(campaignId)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (hsession?.id) {
      await supabase.from('hercules_events').insert({
        session_id: hsession.id, type: 'intent',
        actor_name: actorName, actor_id: actorId,
        description: `[Intent] ${intentText}`,
      });
    }

    setText(''); setSending(false); setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const submitSpeak = async () => {
    if (!text.trim() || !targetId || sending) return;
    setSending(true);

    const target = entities.find(e => String(e.id) === String(targetId));
    if (!target) { setSending(false); return; }

    const conversation = await getOrCreateConversation({
      campaignId, entityType: target.type, entityId: target.id, entityName: target.name,
      participantIds: actorId ? [actorId] : [],
    });

    await postDialogueLine({
      conversationId: conversation.id, campaignId, sessionId,
      speaker: 'player', playerId: actorId, playerName: actorName,
      content: text.trim(),
      trueIntent: showDeception && trueIntent.trim() ? trueIntent.trim() : null,
      flaggedForRoll: showDeception && !!trueIntent.trim(),
    });

    setText(''); setTrueIntent(''); setShowDeception(false);
    setSending(false); setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const submit = () => mode === 'intent' ? submitIntent() : submitSpeak();

  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y, zIndex: 200002,
      width: compact ? 260 : 320,
      background: 'rgba(8,6,4,0.97)', border: `1px solid ${COLORS.border}`,
      borderRadius: 10, boxShadow: '0 16px 50px rgba(0,0,0,0.6)', overflow: 'hidden',
    }}>
      {/* Drag handle + mode toggle */}
      <div onMouseDown={onMouseDown} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
        background: 'rgba(255,255,255,0.03)', cursor: 'grab', borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <span style={{ color: COLORS.dim, fontSize: 10, marginRight: 2 }}>⠿</span>
        <button onClick={() => setMode('intent')}
          title="Declare Intent"
          style={{ background: mode === 'intent' ? 'rgba(200,168,74,0.18)' : 'transparent', border: `1px solid ${mode === 'intent' ? 'rgba(200,168,74,0.5)' : COLORS.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: mode === 'intent' ? '#e8c84a' : COLORS.dim }}>
          ◎ Intent
        </button>
        <button onClick={() => setMode('speak')}
          title="Speak"
          style={{ background: mode === 'speak' ? 'rgba(96,150,224,0.18)' : 'transparent', border: `1px solid ${mode === 'speak' ? 'rgba(96,150,224,0.5)' : COLORS.border}`, borderRadius: 5, padding: '3px 8px', cursor: 'pointer', fontSize: 11, color: mode === 'speak' ? '#80a0e0' : COLORS.dim }}>
          💬 Speak
        </button>
      </div>

      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mode === 'speak' && (
          <select value={targetId} onChange={e => setTargetId(e.target.value)}
            style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', color: COLORS.text, fontSize: 10, fontFamily: 'Georgia, serif', outline: 'none' }}>
            <option value="">Speak to…</option>
            {entities.map(e => <option key={`${e.type}-${e.id}`} value={e.id}>{e.name} ({e.type})</option>)}
          </select>
        )}

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            disabled={!active || sending || (mode === 'speak' && !targetId)}
            placeholder={mode === 'intent' ? (active ? 'Declare intent…' : 'No active session') : 'What do you say?'}
            style={{ flex: 1, background: active ? 'rgba(255,255,255,0.04)' : 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: compact ? '5px 8px' : '7px 10px', color: active ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', fontSize: compact ? 10 : 11, outline: 'none' }} />
          <button onClick={submit}
            disabled={!active || !text.trim() || sending || (mode === 'speak' && !targetId)}
            style={{ background: sent ? 'rgba(100,200,100,0.15)' : mode === 'intent' ? 'rgba(200,168,74,0.1)' : 'rgba(96,150,224,0.12)', border: `1px solid ${sent ? '#64c864' : mode === 'intent' ? '#c8a84a' : '#6090e0'}`, borderRadius: 6, padding: compact ? '5px 8px' : '7px 10px', cursor: 'pointer', color: sent ? '#64c864' : mode === 'intent' ? '#e8c84a' : '#80a0e0', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            {sent ? '✓ Sent' : mode === 'intent' ? '◎ Declare' : '💬 Send'}
          </button>
        </div>

        {mode === 'speak' && (
          <>
            <button onClick={() => setShowDeception(s => !s)}
              style={{ alignSelf: 'flex-start', background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 9, fontFamily: "'Cinzel', serif", letterSpacing: '0.06em', cursor: 'pointer', padding: 0 }}>
              {showDeception ? '▾' : '▸'} I'm trying to deceive them (DM only)
            </button>
            {showDeception && (
              <textarea value={trueIntent} onChange={e => setTrueIntent(e.target.value)}
                placeholder="What you're really trying to do — only the DM sees this."
                rows={2}
                style={{ background: 'rgba(224,90,90,0.05)', border: '1px solid rgba(224,90,90,0.25)', borderRadius: 6, padding: '6px 8px', color: '#e0a0a0', fontSize: 10, fontFamily: 'Georgia, serif', fontStyle: 'italic', outline: 'none', resize: 'vertical' }} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
