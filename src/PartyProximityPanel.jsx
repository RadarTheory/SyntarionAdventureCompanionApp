import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { useActiveGameSession, useProximity } from './lib/session';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

export default function PartyProximityPanel({ campaignId, isDM = false, char = null }) {
  const sessionId = useActiveGameSession(campaignId);
  const { rows, zones } = useProximity(sessionId);
  const [checkedIn, setCheckedIn] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [beasts, setBeasts] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    supabase.from('session_checkins').select('*')
      .eq('session_id', sessionId)
      .then(async ({ data }) => {
        if (!data) return;
        const deduped = Array.from(
          new Map(data.map(p => [p.character_id, p])).values()
        );
        setCheckedIn(deduped);

        // Auto-assign checked-in players to Session zone if not already assigned
        const { data: existing } = await supabase.from('session_proximity')
          .select('entity_id')
          .eq('session_id', sessionId)
          .eq('entity_type', 'player');
        const assignedIds = new Set((existing || []).map(r => String(r.entity_id)));

        const unassigned = deduped.filter(c => !assignedIds.has(String(c.character_id)));
        if (unassigned.length > 0) {
          await supabase.from('session_proximity').insert(
            unassigned.map(c => ({
              session_id: sessionId,
              campaign_id: String(campaignId),
              zone_name: 'Session',
              entity_type: 'player',
              entity_id: String(c.character_id),
              entity_name: c.character_name || 'Player',
            }))
          );
        }
      });
  }, [sessionId]);

  useEffect(() => {
    if (!isDM || !campaignId) return;
    supabase.from('npcs').select('id, name').then(({ data }) => setNpcs(data || []));
    supabase.from('beasts').select('id, name').or(`source.eq.global,campaign_id.eq.${campaignId}`)
      .then(({ data }) => setBeasts(data || []));
  }, [isDM, campaignId]);

  const [extraZones, setExtraZones] = useState([]);
  const zoneNames = [...new Set(['Session', ...(Object.keys(zones).length > 0 ? Object.keys(zones) : []), ...extraZones])];

  const assign = async (zoneName, entityType, entityId, entityName) => {
    if (!sessionId) return;
    // remove from any other zone first (an entity is only in one zone at a time)
    await supabase.from('session_proximity').delete()
      .eq('session_id', sessionId).eq('entity_type', entityType).eq('entity_id', String(entityId));
    await supabase.from('session_proximity').insert({
      session_id: sessionId, campaign_id: String(campaignId), zone_name: zoneName,
      entity_type: entityType, entity_id: String(entityId), entity_name: entityName,
    });
  };

  const remove = async (row) => {
    await supabase.from('session_proximity').delete().eq('id', row.id);
  };

  const addZone = () => {
    if (!newZoneName.trim()) return;
    setExtraZones(prev => [...prev, newZoneName.trim()]);
    setNewZoneName('');
  };

  if (!sessionId) {
    return <div style={{ padding: 16, fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No active session.</div>;
  }

  // PLAYER VIEW — just show who/what is near them
  if (!isDM) {
    const myZoneNames = rows.filter(r => r.entity_type === 'player' && String(r.entity_id) === String(char?.id)).map(r => r.zone_name);
    const nearbyPlayers = rows.filter(r => myZoneNames.includes(r.zone_name) && r.entity_type === 'player' && String(r.entity_id) !== String(char?.id));
    const nearbyNpcs = rows.filter(r => myZoneNames.includes(r.zone_name) && (r.entity_type === 'npc' || r.entity_type === 'beast'));
    return (
      <div style={{ padding: 16 }}>
        <div style={{ ...label8(), marginBottom: 10 }}>In Your Area</div>
        {nearbyPlayers.length === 0 && nearbyNpcs.length === 0 ? (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No one nearby yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nearbyPlayers.map(r => (
              <div key={r.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text }}>{r.entity_name}</div>
                <div style={{ fontSize: 8, color: 'rgba(96,150,224,0.7)', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>Player</div>
              </div>
            ))}
            {nearbyNpcs.length > 0 && (
              <>
                <div style={{ ...label8(), marginTop: 6 }}>Also Nearby</div>
                {nearbyNpcs.map(r => (
                  <div key={r.id} style={{ background: 'rgba(200,168,74,0.05)', border: `1px solid rgba(200,168,74,0.2)`, borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.dim }}>{r.entity_name}</div>
                    <div style={{ fontSize: 8, color: 'rgba(200,168,74,0.5)', fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>{r.entity_type}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  // DM VIEW — assign checked-in players and NPCs/beasts to zones
  const unassignedPlayers = checkedIn.filter(c => !rows.some(r => r.entity_type === 'player' && String(r.entity_id) === String(c.character_id)));

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ ...label8(), marginBottom: 8 }}>Checked-In Party ({checkedIn.length})</div>
        {checkedIn.length === 0 && <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No players checked in.</div>}
      </div>

      {zoneNames.map(zoneName => (
        <div key={zoneName} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a', letterSpacing: '0.1em', marginBottom: 8 }}>{zoneName}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {(zones[zoneName] || []).map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: r.entity_type === 'player' ? 'rgba(96,150,224,0.12)' : 'rgba(200,168,74,0.12)', border: `1px solid ${r.entity_type === 'player' ? 'rgba(96,150,224,0.4)' : 'rgba(200,168,74,0.4)'}`, borderRadius: 12, padding: '3px 8px' }}>
                <span style={{ fontSize: 10, fontFamily: 'Georgia, serif', color: COLORS.text }}>{r.entity_name}</span>
                <button onClick={e => { e.stopPropagation(); remove(r); }} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 10, padding: '0 2px' }}>✕</button>
              </div>
            ))}
          </div>

          {/* Add players to this zone */}
          {unassignedPlayers.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              {unassignedPlayers.map(c => (
                <button key={c.character_id} onClick={() => assign(zoneName, 'player', c.character_id, c.character_name || 'Player')}
                  style={{ background: 'transparent', border: '1px dashed rgba(96,150,224,0.4)', borderRadius: 12, padding: '3px 8px', cursor: 'pointer', fontSize: 9, color: '#7da8e0', fontFamily: "'Cinzel', serif" }}>
                  + {c.character_name || 'Player'}
                </button>
              ))}
            </div>
          )}

          {/* Add NPC/beast to this zone */}
          <select onChange={e => {
            if (!e.target.value) return;
            const [type, id] = e.target.value.split('|');
            const list = type === 'npc' ? npcs : beasts;
            const ent = list.find(x => String(x.id) === id);
            if (ent) assign(zoneName, type, ent.id, ent.name);
            e.target.value = '';
          }} style={{ background: '#100d0a', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '4px 8px', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
            <option value="">+ Add NPC or Beast…</option>
            {npcs.map(n => <option key={`npc-${n.id}`} value={`npc|${n.id}`}>{n.name} (NPC)</option>)}
            {beasts.map(b => <option key={`beast-${b.id}`} value={`beast|${b.id}`}>{b.name} (Beast)</option>)}
          </select>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 6 }}>
        <input value={newZoneName} onChange={e => setNewZoneName(e.target.value)} placeholder="New zone name…"
          style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', fontFamily: 'Georgia, serif', fontSize: 11, color: COLORS.text, outline: 'none' }} />
        <button onClick={addZone} style={{ background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8c84a' }}>+ Zone</button>
      </div>
    </div>
  );
}