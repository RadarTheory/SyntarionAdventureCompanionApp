import supabase from '../lib/supabase';

// ─── BROADCAST — same 4-destination pipe LoreAnnouncePanel uses ──────────────
// Fires to: DM Memory · Player Grimoires (per participant) · Hercules Log (if combat active) · Player Inboxes
export async function broadcastDialogueLine({ campaignId, sessionId, participantIds, speakerName, content, isDM }) {
  // 1. DM Memory
  await supabase.from('dm_memory').insert({
    campaign_id: String(campaignId),
    category: 'dialogue',
    content: `[DIALOGUE] ${speakerName}: ${content}`,
  });

  // 2. Hercules combat log, only if combat is active
  const { data: hsession } = await supabase.from('hercules_sessions').select('id')
    .eq('campaign_id', String(campaignId)).eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (hsession?.id) {
    await supabase.from('hercules_events').insert({
      session_id: hsession.id,
      type: 'dialogue',
      actor_name: speakerName,
      actor_id: null,
      description: `${speakerName}: "${content}"`,
    });
  }

  // 3. Player inboxes (only when DM/entity speaks — player's own line doesn't need to message themself)
  if (isDM && participantIds?.length) {
    await Promise.all(participantIds.map(charId =>
      supabase.from('messages').insert({
        character_id: String(charId),
        campaign_id: String(campaignId),
        session_id: sessionId || null,
        type: 'dialogue',
        content,
        sender_name: speakerName,
        is_dm: true,
      })
    ));
  }
}

// ─── CONVERSATION MANAGEMENT ──────────────────────────────────────────────────
export async function getOrCreateConversation({ campaignId, entityType, entityId, entityName, participantIds = [] }) {
  const { data: existing } = await supabase.from('dialogue_conversations')
    .select('*')
    .eq('campaign_id', String(campaignId))
    .eq('entity_type', entityType)
    .eq('entity_id', String(entityId))
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1).maybeSingle();

  if (existing) {
    // Merge in any new participants
    const merged = Array.from(new Set([...(existing.participant_ids || []), ...participantIds]));
    if (merged.length !== (existing.participant_ids || []).length) {
      await supabase.from('dialogue_conversations').update({ participant_ids: merged }).eq('id', existing.id);
      return { ...existing, participant_ids: merged };
    }
    return existing;
  }

  const { data: created } = await supabase.from('dialogue_conversations').insert({
    campaign_id: String(campaignId),
    entity_type: entityType,
    entity_id: String(entityId),
    entity_name: entityName,
    participant_ids: participantIds,
    status: 'active',
  }).select().single();

  return created;
}

export async function endConversation(conversationId) {
  await supabase.from('dialogue_conversations').update({
    status: 'ended', ended_at: new Date().toISOString(),
  }).eq('id', conversationId);
}

// ─── POST A LINE ───────────────────────────────────────────────────────────────
export async function postDialogueLine({
  conversationId, campaignId, sessionId, speaker, playerId, playerName,
  content, trueIntent = null, flaggedForRoll = false, status = 'approved',
}) {
  const { data: entry } = await supabase.from('dialogue_entries').insert({
    conversation_id: conversationId,
    campaign_id: String(campaignId),
    speaker,
    player_id: playerId || null,
    player_name: playerName || null,
    content,
    true_intent: trueIntent,
    flagged_for_roll: flaggedForRoll,
    status,
  }).select().single();

  if (status === 'approved') {
    const { data: conv } = await supabase.from('dialogue_conversations').select('*').eq('id', conversationId).single();
    if (conv) {
      await broadcastDialogueLine({
        campaignId,
        sessionId,
        participantIds: conv.participant_ids || [],
        speakerName: speaker === 'entity' ? conv.entity_name : (playerName || 'Player'),
        content,
        isDM: speaker === 'entity',
      });
    }
  }

  return entry;
}

// ─── SAVE FULL CONVERSATION TO GRIMOIRE (full thread, not per-line) ───────────
export async function saveConversationToGrimoire({ conversation, entries, campaignId }) {
  if (!conversation || entries.length === 0) return { count: 0 };
  const transcript = entries
    .filter(e => e.status === 'approved')
    .map(e => `${e.speaker === 'entity' ? conversation.entity_name : (e.player_name || 'Player')}: ${e.content}`)
    .join('\n');

  const grimoireType = conversation.entity_type === 'beast' ? 'beast' : 'npc';
  const targets = conversation.participant_ids || [];
  if (!targets.length) return { count: 0 };

  await Promise.all(targets.map(charId =>
    supabase.from('grimoire_entries').insert({
      character_id: String(charId),
      campaign_id: String(campaignId),
      type: grimoireType,
      title: `Conversation with ${conversation.entity_name}`,
      body: transcript,
    })
  ));

  return { count: targets.length };
}