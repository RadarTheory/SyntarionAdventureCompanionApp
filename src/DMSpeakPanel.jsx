import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { getOrCreateConversation, endConversation, postDialogueLine, saveConversationToGrimoire } from './lib/dialogue';

export default function DMSpeakPanel({ campaignId, sessionId, embedded }) {
  const [entities, setEntities] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [entityType, setEntityType] = useState('npc');
  const [entityId, setEntityId] = useState('');
  const [participantIds, setParticipantIds] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [activeConversations, setActiveConversations] = useState([]);
  const [entries, setEntries] = useState([]);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [saveMsg, setSaveMsg] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!campaignId) return;
    Promise.all([
      supabase.from('npcs').select('id, name, role, notes, faction').order('name'),
      supabase.from('beasts').select('id, name, voice_profile, description').or(`source.eq.global,campaign_id.eq.${campaignId}`).order('name'),
      supabase.from('characters').select('id, name').eq('campaign_id', String(campaignId)).eq('status', 'approved'),
      supabase.from('dialogue_conversations').select('*').eq('campaign_id', String(campaignId)).eq('status', 'active'),
    ]).then(([npcRes, beastRes, charRes, convRes]) => {
      setEntities([
        ...(npcRes.data || []).map(n => ({ ...n, type: 'npc' })),
        ...(beastRes.data || []).map(b => ({ ...b, type: 'beast' })),
      ]);
      setCharacters(charRes.data || []);
      setActiveConversations(convRes.data || []);
    });
  }, [campaignId]);

  const loadEntries = async (convId) => {
    const { data } = await supabase.from('dialogue_entries').select('*').eq('conversation_id', convId).order('created_at', { ascending: true });
    setEntries(data || []);
  };

  useEffect(() => {
    if (!conversation) return;
    loadEntries(conversation.id);
    const sub = supabase.channel(`dialogue-${conversation.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dialogue_entries', filter: `conversation_id=eq.${conversation.id}` }, () => loadEntries(conversation.id))
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [conversation?.id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }); }, [entries]);

  const toggleParticipant = (id) => setParticipantIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const openConversation = async () => {
    const entity = entities.find(e => e.type === entityType && String(e.id) === String(entityId));
    if (!entity) return;
    const conv = await getOrCreateConversation({
      campaignId, entityType, entityId: entity.id, entityName: entity.name, participantIds,
    });
    setConversation({ ...conv, _entity: entity });
  };

  const resumeConversation = (conv) => {
    const entity = entities.find(e => e.type === conv.entity_type && String(e.id) === String(conv.entity_id));
    setConversation({ ...conv, _entity: entity });
  };

  const buildSystemPrompt = () => {
    const entity = conversation._entity || {};
    const voice = entity.voice_profile
      || [entity.role, entity.notes, entity.faction].filter(Boolean).join('. ')
      || entity.description
      || 'Speak in character, true to a fantasy TTRPG NPC with no further detail provided.';
    return `You are roleplaying as ${conversation.entity_name} in the world of Soteria (178 Era of Unity), a TTRPG setting. Voice/personality: ${voice}\n\nStay fully in character. Respond only with what ${conversation.entity_name} says — no narration, no stage directions, no surrounding quotation marks. Keep it to 1-4 sentences unless the moment calls for more.`;
  };

  const generateReply = async () => {
    setGenerating(true);
    setGenError(null);
    try {
      const recent = entries.slice(-8).map(e => ({
        role: e.speaker === 'entity' ? 'assistant' : 'user',
        content: e.speaker === 'entity' ? e.content : `${e.player_name || 'Player'}: ${e.content}`,
      }));
      const { data, error } = await supabase.functions.invoke('scribe', {
        body: { system: buildSystemPrompt(), messages: recent, max_tokens: 300 },
      });
      if (error) throw new Error(error.message || 'Relay failed.');
      if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error).slice(0, 200));
      const text = data?.choices?.[0]?.message?.content;
      if (!text) throw new Error('No response from Scribe.');
      setDraft(text.trim());
    } catch (err) {
      setGenError(err.message);
    }
    setGenerating(false);
  };

  const approveDraft = async () => {
    const content = draft.trim();
    if (!content || !conversation) return;
    await postDialogueLine({ conversationId: conversation.id, campaignId, sessionId, speaker: 'entity', content });
    setDraft('');
  };

  const resolveFlag = async (entryId) => {
    await supabase.from('dialogue_entries').update({ flagged_for_roll: false }).eq('id', entryId);
  };

  const handleSaveGrimoire = async () => {
    const { count } = await saveConversationToGrimoire({ conversation, entries, campaignId });
    setSaveMsg(count ? `Saved to ${count} grimoire${count !== 1 ? 's' : ''}.` : 'No participants to save to.');
    setTimeout(() => setSaveMsg(null), 3000);
  };

  const handleEndConversation = async () => {
    await endConversation(conversation.id);
    setActiveConversations(prev => prev.filter(c => c.id !== conversation.id));
    setConversation(null);
  };

  const filteredEntities = entities.filter(e => e.type === entityType);

  // ── Conversation picker / opener view ──
  if (!conversation) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {activeConversations.length > 0 && (
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.14em', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 6 }}>Active Conversations</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {activeConversations.map(c => (
                <button key={c.id} onClick={() => resumeConversation(c)}
                  style={{ textAlign: 'left', background: 'rgba(96,150,224,0.06)', border: '1px solid rgba(96,150,224,0.25)', borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text }}>
                  💬 {c.entity_name} <span style={{ color: COLORS.dim, fontSize: 9 }}>({(c.participant_ids || []).length} participants)</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.14em', color: COLORS.muted, textTransform: 'uppercase', marginBottom: 6 }}>New Conversation</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {['npc', 'beast'].map(t => (
              <button key={t} onClick={() => { setEntityType(t); setEntityId(''); }}
                style={{ flex: 1, background: entityType === t ? 'rgba(96,150,224,0.15)' : 'transparent', border: `1px solid ${entityType === t ? 'rgba(96,150,224,0.5)' : COLORS.border}`, borderRadius: 6, padding: '6px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: entityType === t ? '#80a0e0' : COLORS.dim, textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
          <select value={entityId} onChange={e => setEntityId(e.target.value)}
            style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', marginBottom: 10 }}>
            <option value="">Select {entityType}…</option>
            {filteredEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>

          {characters.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', color: COLORS.muted, marginBottom: 6 }}>Participants</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {characters.map(c => {
                  const on = participantIds.includes(String(c.id));
                  return (
                    <button key={c.id} onClick={() => toggleParticipant(String(c.id))}
                      style={{ background: on ? 'rgba(96,150,224,0.15)' : 'transparent', border: `1px solid ${on ? 'rgba(96,150,224,0.5)' : COLORS.border}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: on ? '#80a0e0' : COLORS.dim }}>
                      {on ? '✦ ' : ''}{c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button onClick={openConversation} disabled={!entityId}
            style={{ width: '100%', background: entityId ? 'rgba(96,150,224,0.14)' : 'transparent', border: `1px solid ${entityId ? 'rgba(96,150,224,0.5)' : COLORS.border}`, borderRadius: 8, padding: '10px', cursor: entityId ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: entityId ? '#80a0e0' : COLORS.dim, fontWeight: 700, letterSpacing: '0.1em' }}>
            💬 Open Conversation
          </button>
        </div>
      </div>
    );
  }

  // ── Active conversation view ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => setConversation(null)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text }}>{conversation.entity_name}</div>
          <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{(conversation.participant_ids || []).length} participants</div>
        </div>
        <button onClick={handleSaveGrimoire} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: COLORS.dim }}>📖 Save</button>
        <button onClick={handleEndConversation} style={{ background: 'transparent', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: '#e05a5a' }}>End</button>
      </div>

      {saveMsg && <div style={{ padding: '6px 14px', fontSize: 9, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{saveMsg}</div>}

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {entries.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center' }}>No lines yet.</div>}
        {entries.map(e => (
          <div key={e.id} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>{e.speaker === 'entity' ? conversation.entity_name : (e.player_name || 'Player')}</div>
              {e.flagged_for_roll && <span style={{ fontSize: 8, color: '#e0a040', fontFamily: "'Cinzel', serif" }}>⚑ needs roll</span>}
            </div>
            <div style={{ fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{e.content}</div>
            {e.true_intent && (
              <div style={{ marginTop: 3, padding: '5px 8px', background: 'rgba(224,90,90,0.06)', border: '1px solid rgba(224,90,90,0.2)', borderRadius: 5, fontSize: 10, color: '#e0a0a0', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                True intent: {e.true_intent}
                {e.flagged_for_roll && (
                  <button onClick={() => resolveFlag(e.id)} style={{ marginLeft: 8, background: 'transparent', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontSize: 8, color: '#e05a5a' }}>Resolve</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ padding: '8px 14px', borderTop: `1px solid ${COLORS.border}` }}>
        <button onClick={generateReply} disabled={generating}
          style={{ width: '100%', background: 'rgba(168,230,163,0.08)', border: '1px solid rgba(168,230,163,0.3)', borderRadius: 6, padding: '7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#a8e6a3', letterSpacing: '0.08em', marginBottom: draft ? 6 : 0 }}>
          {generating ? 'Generating…' : `✦ Generate ${conversation.entity_name}'s Reply`}
        </button>
        {genError && <div style={{ fontSize: 9, color: '#e05a5a', marginBottom: 6 }}>{genError}</div>}
        {draft && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={3}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 9px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={approveDraft} style={{ flex: 1, background: 'rgba(168,230,163,0.12)', border: '1px solid rgba(168,230,163,0.4)', borderRadius: 6, padding: '6px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#a8e6a3' }}>✓ Approve & Post</button>
              <button onClick={() => setDraft('')} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim }}>Discard</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
