import { useState, useEffect } from 'react';
import supabase from './supabase';

// Single source of truth for "what is the active game session for this campaign."
// Any panel needing check-in/proximity state should use this instead of re-deriving it.
export function useActiveGameSession(campaignId) {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    if (!campaignId) { setSessionId(null); return; }
    const cid = String(campaignId);
    supabase.from('sessions').select('id')
      .eq('campaign_id', cid).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => setSessionId(data?.id || null));

    const ch = supabase.channel(`active_game_session_${cid}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `campaign_id=eq.${cid}` },
        ({ new: row }) => { if (row?.status === 'active') setSessionId(row.id); })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [campaignId]);

  return sessionId;
}

// Live proximity zones for a session: { zoneName: [{ entity_type, entity_id, entity_name }] }
export function useProximity(sessionId) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!sessionId) { setRows([]); return; }
    supabase.from('session_proximity').select('*').eq('session_id', sessionId)
      .then(({ data }) => setRows(data || []));

    const ch = supabase.channel(`proximity_${sessionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_proximity', filter: `session_id=eq.${sessionId}` },
        () => {
          supabase.from('session_proximity').select('*').eq('session_id', sessionId)
            .then(({ data }) => setRows(data || []));
        })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [sessionId]);

  const zones = {};
  rows.forEach(r => {
    if (!zones[r.zone_name]) zones[r.zone_name] = [];
    zones[r.zone_name].push(r);
  });
  return { rows, zones };
}

// Entities (NPCs/beasts) in proximity to a given character, derived from shared zones
export function entitiesNearCharacter(rows, characterId) {
  if (!characterId) return [];
  const myZones = rows.filter(r => r.entity_type === 'player' && String(r.entity_id) === String(characterId)).map(r => r.zone_name);
  return rows.filter(r => myZones.includes(r.zone_name) && r.entity_type !== 'player')
    .map(r => ({ id: r.entity_id, name: r.entity_name, type: r.entity_type }));
}