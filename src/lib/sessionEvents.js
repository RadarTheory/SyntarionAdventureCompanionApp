import supabase from './supabase';

/**
 * Write a session event to the session_events table.
 * Any system can call this to feed the Scribe log.
 *
 * @param {string} campaignId
 * @param {string|null} sessionId  - active session UUID if known
 * @param {string} eventType       - 'npc_met' | 'combat_kill' | 'loot_claimed' | 'lark_sent' | 'player_checkin'
 * @param {object} payload         - freeform jsonb, varies by event type
 */
export async function logSessionEvent(campaignId, sessionId, eventType, payload = {}) {
  if (!campaignId) return;
  const { error } = await supabase.from('session_events').insert({
    campaign_id: String(campaignId),
    session_id: sessionId ? String(sessionId) : null,
    event_type: eventType,
    payload,
  });
  if (error) console.warn('[sessionEvents] Failed to log event:', error.message);
}

/**
 * Fetch all events for a given session, ordered chronologically.
 */
export async function getSessionEvents(sessionId) {
  if (!sessionId) return [];
  const { data, error } = await supabase
    .from('session_events')
    .select('*')
    .eq('session_id', String(sessionId))
    .order('created_at', { ascending: true });
  if (error) { console.warn('[sessionEvents] Fetch error:', error.message); return []; }
  return data || [];
}

/**
 * Get character_ids checked into an active session.
 */
export async function getCheckedInCharacterIds(sessionId) {
  if (!sessionId) return [];
  const { data } = await supabase
    .from('session_checkins')
    .select('character_id, character_name')
    .eq('session_id', String(sessionId));
  return data || [];
}