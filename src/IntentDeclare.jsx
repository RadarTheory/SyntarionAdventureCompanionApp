import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { getOrCreateConversation, postDialogueLine } from './lib/dialogue';

function useDraggable(initial = { x: 24, y: 24 }) {
  const [pos, setPos] = useState(initial);
  const dragRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  const beginDrag = (clientX, clientY) => {
    dragRef.current = true;
    offset.current = { x: clientX - pos.x, y: clientY - pos.y };
    document.body.style.userSelect = 'none';
  };

  const onMouseDown = (e) => beginDrag(e.clientX, e.clientY);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    if (t) beginDrag(t.clientX, t.clientY);
  };

  useEffect(() => {
    const clampPos = (x, y) => {
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      return { x: Math.min(Math.max(x, 0), maxX), y: Math.min(Math.max(y, 0), maxY) };
    };

    const onMove = (e) => {
      if (!dragRef.current) return;
      setPos(clampPos(e.clientX - offset.current.x, e.clientY - offset.current.y));
    };
    const onTouchMove = (e) => {
      if (!dragRef.current) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      setPos(clampPos(t.clientX - offset.current.x, t.clientY - offset.current.y));
    };
    const onUp = () => { dragRef.current = false; document.body.style.userSelect = ''; };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return { pos, onMouseDown, onTouchStart };
}

function useDictation(onResult) {
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [micError, setMicError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

  const pickMimeType = () => {
    const candidates = ['audio/mp4', 'audio/webm', 'audio/aac', 'audio/ogg'];
    return candidates.find(t => MediaRecorder.isTypeSupported?.(t)) || '';
  };

  const stop = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
  };

  const start = async () => {
    if (!supported || listening) return;
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickMimeType();
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

      rec.onstop = async () => {
        stream.getTracks().forEach(t => t.stop()); // release mic immediately
        setListening(false);
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || 'audio/webm' });
        chunksRef.current = [];
        if (blob.size === 0) return;

        setTranscribing(true);
        try {
          const audioBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(String(reader.result).split(',')[1] || '');
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });

          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Transcription timed out')), 15000));
          const { data, error } = await Promise.race([
            supabase.functions.invoke('transcribe', { body: { audioBase64, mimeType: blob.type } }),
            timeout,
          ]);

          if (error) {
            console.error('Transcribe error:', error);
            setMicError(error.message || 'Transcription failed.');
          } else if (data?.text) {
            onResult(data.text.trim());
          } else {
            setMicError('No speech detected.');
          }
        } catch (err) {
          console.error('Transcription failed:', err);
          setMicError(err?.message || 'Transcription failed.');
        }
        setTranscribing(false);
      };

      mediaRecorderRef.current = rec;
      rec.start();
      setListening(true);
    } catch (err) {
      setListening(false);
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setMicError('Microphone access is blocked. Check your browser/site settings.');
      } else if (err?.name === 'NotFoundError') {
        setMicError('No microphone found.');
      } else {
        setMicError('Could not access the microphone.');
      }
    }
  };

  const toggle = () => { if (listening) stop(); else start(); };

  return { listening, transcribing, toggle, supported, micError };
}

export default function IntentDeclare({ campaignId, char, compact = false, embedded = false }) {
  const [speechText, setSpeechText] = useState('');
  const [intentText, setIntentText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [entities, setEntities] = useState([]);
  const [targetId, setTargetId] = useState('');

  const { pos, onMouseDown, onTouchStart } = useDraggable({ x: 24, y: window.innerHeight - 150 });

  useEffect(() => {
    if (!campaignId) return;
    supabase.from('sessions')
      .select('id').eq('campaign_id', String(campaignId))
      .eq('status', 'active').order('created_at', { ascending: false })
      .limit(1).maybeSingle()
      .then(({ data }) => setSessionId(data?.id || null));
  }, [campaignId]);

  // Who this character can speak to: met (via Grimoire), DM-invited (active conversation), or nearby on the VTT map
  useEffect(() => {
    const actorIdForLookup = char?.id ? String(char.id) : null;
    if (!campaignId || !actorIdForLookup) return;

    (async () => {
      const { data: grimoireRows } = await supabase.from('grimoire_entries')
        .select('title, type')
        .eq('character_id', actorIdForLookup)
        .in('type', ['npc', 'beast']);
      const metNames = new Set((grimoireRows || []).map(r => (r.title || '').replace(/^Conversation with /, '').trim().toLowerCase()));

      const { data: activeConvos } = await supabase.from('dialogue_conversations')
        .select('entity_type, entity_id, entity_name, participant_ids')
        .eq('campaign_id', String(campaignId))
        .eq('status', 'active');
      const inSceneEntities = (activeConvos || [])
        .filter(c => (c.participant_ids || []).map(String).includes(actorIdForLookup))
        .map(c => ({ id: c.entity_id, name: c.entity_name, type: c.entity_type }));

      const [{ data: npcData }, { data: beastData }, { data: vttSession }] = await Promise.all([
        supabase.from('npcs').select('id, name'),
        supabase.from('beasts').select('id, name').or(`source.eq.global,campaign_id.eq.${campaignId}`),
        supabase.from('vtt_sessions').select('tokens').eq('campaign_id', String(campaignId)).maybeSingle(),
      ]);
      const metEntities = [
        ...(npcData || []).filter(n => metNames.has((n.name || '').toLowerCase())).map(n => ({ id: n.id, name: n.name, type: 'npc' })),
        ...(beastData || []).filter(b => metNames.has((b.name || '').toLowerCase())).map(b => ({ id: b.id, name: b.name, type: 'beast' })),
      ];

      // VTT proximity — coordinates are 0-100 percentage of map dimensions
      const PROXIMITY_THRESHOLD = 15;
      const tokens = Array.isArray(vttSession?.tokens) ? vttSession.tokens : [];
      const myToken = tokens.find(t => String(t.characterId) === actorIdForLookup);
      let nearbyEntities = [];
      if (myToken && typeof myToken.x === 'number' && typeof myToken.y === 'number') {
        const others = tokens.filter(t => String(t.characterId) !== actorIdForLookup && typeof t.x === 'number' && typeof t.y === 'number');
        nearbyEntities = others
          .filter(t => Math.hypot(t.x - myToken.x, t.y - myToken.y) <= PROXIMITY_THRESHOLD)
          .map(t => {
            const tokenName = t.name || t.creatureName || t.label || 'Unknown';
            if (t.beast_id) return { id: t.beast_id, name: tokenName, type: 'beast' };
            const npcMatch = (npcData || []).find(n => (n.name || '').toLowerCase() === tokenName.toLowerCase());
            if (npcMatch) return { id: npcMatch.id, name: npcMatch.name, type: 'npc' };
            const beastMatch = (beastData || []).find(b => (b.name || '').toLowerCase() === tokenName.toLowerCase());
            if (beastMatch) return { id: beastMatch.id, name: beastMatch.name, type: 'beast' };
            // No matching database row — fall back to the token itself (e.g. manually-added combatant)
            return { id: t.id || t.token_id, name: tokenName, type: 'beast' };
          });
      }

      const merged = [...inSceneEntities, ...metEntities, ...nearbyEntities];
      const seen = new Set();
      const deduped = merged.filter(e => {
        const key = `${e.type}-${e.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setEntities(deduped);
    })();
  }, [campaignId, char?.id]);

  const active = !!sessionId;
  const actorName = char?.name || 'Player';
  const actorId = char?.id ? String(char.id) : null;

  const hasSpeech = !!speechText.trim();
  const hasIntent = !!intentText.trim();
  const hasTarget = !!targetId;
  const canSend = active && !sending && (hasSpeech || (hasIntent && !hasSpeech));

  // Plain intent only — no speech involved (same as the original Declare Intent flow)
  const logPlainIntent = async (fromSpeech = false) => {
    const text = fromSpeech ? speechText.trim() : intentText.trim();
    await supabase.from('grimoire_entries').insert({
      character_id: actorId, campaign_id: String(campaignId),
      type: 'event', title: 'Intent Declared',
      body: `${actorName} declared intent: ${text}`,
    });
    await supabase.from('dm_memory').insert({
      campaign_id: String(campaignId), category: 'intent',
      content: `[INTENT] ${actorName}: ${text}`,
    });

    const { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(campaignId)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (hsession?.id) {
      await supabase.from('hercules_events').insert({
        session_id: hsession.id, type: 'intent',
        actor_name: actorName, actor_id: actorId,
        description: `[Intent] ${text}`,
      });
    }
  };

  // Speech, optionally carrying an intent (e.g. deception) the DM alone can see
 const logSpeech = async () => {
    const target = entities.find(e => String(e.id) === String(targetId));
    if (!target) return;

    const conversation = await getOrCreateConversation({
      campaignId, entityType: target.type, entityId: target.id, entityName: target.name,
      participantIds: actorId ? [actorId] : [],
    });

    await postDialogueLine({
      conversationId: conversation.id, campaignId, sessionId,
      speaker: 'player', playerId: actorId, playerName: actorName,
      content: speechText.trim(),
      trueIntent: hasIntent ? intentText.trim() : null,
      flaggedForRoll: hasIntent,
    });

    const text = speechText.trim();
    await supabase.from('grimoire_entries').insert({
      character_id: actorId, campaign_id: String(campaignId),
      type: 'event', title: 'Spoke to ' + target.name,
      body: `${actorName} said to ${target.name}: "${text}"`,
    });
    await supabase.from('dm_memory').insert({
      campaign_id: String(campaignId), category: 'speech',
      content: `[SPEECH→${target.name}] ${actorName}: "${text}"`,
    });

    const { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(campaignId)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (hsession?.id) {
      await supabase.from('hercules_events').insert({
        session_id: hsession.id, type: 'speech',
        actor_name: actorName, actor_id: actorId,
        description: `${actorName} says to ${target.name}: "${text}"`,
      });
    }
  };

  // Spoken aloud — no specific target, just said into the scene
  const logAloud = async () => {
    const text = speechText.trim();
    await supabase.from('grimoire_entries').insert({
      character_id: actorId, campaign_id: String(campaignId),
      type: 'event', title: 'Said Aloud',
      body: `${actorName} said: "${text}"`,
    });
    await supabase.from('dm_memory').insert({
      campaign_id: String(campaignId), category: 'speech',
      content: `[SPEECH] ${actorName}: "${text}"`,
    });

    const { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(campaignId)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (hsession?.id) {
      await supabase.from('hercules_events').insert({
        session_id: hsession.id, type: 'speech',
        actor_name: actorName, actor_id: actorId,
        description: `${actorName} says: "${text}"`,
      });
    }
  };

  const submit = async () => {
    if (!canSend) return;
    setSending(true);

    if (hasSpeech && hasTarget) {
      await logSpeech();
    } else if (hasSpeech) {
      await logAloud();
    }

    // Every action carries an intent into the log — explicit if typed,
    // otherwise the speech itself stands as the declared intent.
    if (hasIntent) {
      await logPlainIntent();
    } else if (hasSpeech) {
      await logPlainIntent(true);
    }

    setSpeechText('');
    setIntentText('');
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  const dictation = useDictation(transcript => setSpeechText(prev => (prev ? prev + ' ' : '') + transcript));

  const [targetOpen, setTargetOpen] = useState(false);
  const targetRef = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (targetRef.current && !targetRef.current.contains(e.target)) setTargetOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);
  const selectedEntity = entities.find(e => String(e.id) === String(targetId));

  const content = (
    <div style={{ padding: embedded ? 0 : 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entities.length === 0 ? (
        <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '2px 2px 0' }}>
          No one nearby to address directly yet — you can still speak aloud below.
        </div>
      ) : (
        <div ref={targetRef} style={{ position: 'relative' }}>
          <button type="button" onClick={() => setTargetOpen(o => !o)}
            style={{ width: '100%', textAlign: 'left', background: '#100d0a', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px', color: selectedEntity ? COLORS.text : COLORS.dim, fontSize: 10, fontFamily: 'Georgia, serif', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{selectedEntity ? `${selectedEntity.name} (${selectedEntity.type})` : 'Speak to…'}</span>
            <span style={{ color: COLORS.dim, fontSize: 9 }}>{targetOpen ? '▴' : '▾'}</span>
          </button>
          {targetOpen && (
            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 2, background: '#100d0a', border: `1px solid ${COLORS.border}`, borderRadius: 6, maxHeight: 180, overflowY: 'auto', zIndex: 200010, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
              <button type="button" onClick={() => { setTargetId(''); setTargetOpen(false); }}
                style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '6px 8px', color: COLORS.dim, fontSize: 10, fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                — none —
              </button>
              {entities.map(e => (
                <button key={`${e.type}-${e.id}`} type="button" onClick={() => { setTargetId(e.id); setTargetOpen(false); }}
                  style={{ width: '100%', textAlign: 'left', background: String(e.id) === String(targetId) ? 'rgba(200,168,74,0.12)' : 'transparent', border: 'none', padding: '6px 8px', color: COLORS.text, fontSize: 10, fontFamily: 'Georgia, serif', cursor: 'pointer' }}>
                  {e.name} <span style={{ color: COLORS.dim }}>({e.type})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={speechText}
          onChange={e => setSpeechText(e.target.value)}
          disabled={!active || sending}
          placeholder="What do you say aloud?"
          style={{ flex: 1, background: 'rgba(96,150,224,0.05)', border: '1px solid rgba(96,150,224,0.25)', borderRadius: 6, padding: compact ? '5px 8px' : '7px 10px', color: active ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', fontSize: compact ? 10 : 11, outline: 'none' }} />
        {dictation.supported && (
          <button type="button" onClick={dictation.toggle} disabled={!active || sending || dictation.transcribing}
            title="Tap to talk"
            style={{ background: dictation.listening ? 'rgba(224,90,90,0.15)' : dictation.transcribing ? 'rgba(200,168,74,0.12)' : 'transparent', border: `1px solid ${dictation.listening ? 'rgba(224,90,90,0.4)' : dictation.transcribing ? 'rgba(200,168,74,0.4)' : COLORS.border}`, borderRadius: 6, padding: '0 10px', cursor: dictation.transcribing ? 'default' : 'pointer', fontSize: 13, color: dictation.listening ? '#e05a5a' : dictation.transcribing ? '#e8c84a' : COLORS.dim }}>
            {dictation.listening ? '●' : dictation.transcribing ? '…' : '🎙'}
          </button>
        )}
      </div>
      {dictation.micError && (
        <div style={{ fontSize: 9, color: '#e05a5a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{dictation.micError}</div>
      )}
      {hasSpeech && !hasTarget && entities.length > 0 && (
        <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Said aloud to the room. Pick a target above to speak directly to someone.</div>
      )}

      <input
        value={intentText}
        onChange={e => setIntentText(e.target.value)}
        disabled={!active || sending}
        placeholder={active ? 'Declare your intent… (optional)' : 'No active session'}
        style={{ background: 'rgba(200,168,74,0.05)', border: '1px solid rgba(200,168,74,0.25)', borderRadius: 6, padding: compact ? '5px 8px' : '7px 10px', color: active ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: active ? 'normal' : 'italic', fontSize: compact ? 10 : 11, outline: 'none' }}
        onKeyDown={e => e.key === 'Enter' && submit()} />

      {hasSpeech && !hasTarget && (
        <div style={{ fontSize: 9, color: '#e0a040', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Choose who you're speaking to.</div>
      )}
      {hasSpeech && hasIntent && (
        <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>The DM alone will see your true intent behind these words.</div>
      )}

      <button onClick={submit} disabled={!canSend}
        style={{ background: sent ? 'rgba(100,200,100,0.15)' : !canSend ? 'transparent' : 'rgba(200,168,74,0.12)', border: `1px solid ${sent ? '#64c864' : !canSend ? COLORS.border : '#c8a84a'}`, borderRadius: 6, padding: compact ? '6px 8px' : '8px 10px', cursor: canSend ? 'pointer' : 'default', color: sent ? '#64c864' : !canSend ? COLORS.dim : '#e8c84a', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em' }}>
        {sent ? '✓ Sent' : sending ? 'Sending…' : '◎ Declare'}
      </button>
    </div>
  );

  if (embedded) return content;

  return (
    <div style={{
      position: 'fixed', left: pos.x, top: pos.y, zIndex: 200002,
      width: compact ? 280 : 340,
      background: 'rgba(8,6,4,0.97)', border: `1px solid ${COLORS.border}`,
      borderRadius: 10, boxShadow: '0 16px 50px rgba(0,0,0,0.6)', overflow: 'hidden',
    }}>
      {/* Drag handle */}
      <div onMouseDown={onMouseDown} onTouchStart={onTouchStart} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        background: 'rgba(255,255,255,0.03)', cursor: 'grab', borderBottom: `1px solid ${COLORS.border}`,
        touchAction: 'none',
      }}>
        <span style={{ color: COLORS.dim, fontSize: 10 }}>⠿</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim, letterSpacing: '0.1em' }}>INTENT &amp; SPEECH</span>
      </div>

      {content}
    </div>
  );
}
