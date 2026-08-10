import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { useActiveGameSession, useProximity } from './lib/session';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// Normalize a raw VTT token into a simple {key, name, type} shape. Tokens come
// from a few different code paths (Bestiary, HerculesCombat, VTTCanvas) so the
// display name can live under any of several keys.
function tokenView(t, i) {
  return {
    key: String(t.id || t.token_id || t.characterId || t.character_id || `${t.label || 'tok'}-${i}`),
    name: t.name || t.fullName || t.creatureName || t.label || 'Unknown',
    type: t.type || 'enemy',
    color: t.color,
    portrait: t.portrait_url || t.sprite_url || null,
  };
}

// Live VTT map roster for a campaign. One vtt_sessions row per campaign holds a
// `tokens` array; this keeps it in sync so the party panel reflects the map even
// when no formal game session has been started.
function useVttRoster(campaignId) {
  const [tokens, setTokens] = useState([]);
  useEffect(() => {
    if (!campaignId) { setTokens([]); return; }
    const cid = String(campaignId);
    let cancelled = false;
    const load = () => supabase.from('vtt_sessions').select('tokens').eq('campaign_id', cid).maybeSingle()
      .then(({ data }) => { if (!cancelled) setTokens(Array.isArray(data?.tokens) ? data.tokens : []); });
    load();
    const ch = supabase.channel(`party_vtt_${cid}_${Math.random().toString(36).slice(2, 7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vtt_sessions', filter: `campaign_id=eq.${cid}` }, () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [campaignId]);
  return tokens;
}

// Small reusable pill for one entity in a roster list.
function EntityRow({ name, type, portrait, color }) {
  const isPlayer = type === 'player';
  const accent = isPlayer ? 'rgba(96,150,224' : 'rgba(200,168,74';
  return (
    <div style={{ background: `${accent},0.06)`, border: `1px solid ${accent},0.28)`, borderRadius: 6, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
      {portrait
        ? <img src={portrait} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        : <div style={{ width: 22, height: 22, borderRadius: '50%', background: color || `${accent},0.4)`, flexShrink: 0 }} />}
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: isPlayer ? COLORS.text : COLORS.dim, flex: 1 }}>{name}</div>
      <div style={{ fontSize: 8, color: `${accent},0.7)`, fontFamily: "'Cinzel', serif", textTransform: 'uppercase' }}>{isPlayer ? 'Player' : type}</div>
    </div>
  );
}

export default function PartyProximityPanel({ campaignId, isDM = false, char = null }) {
  const sessionId = useActiveGameSession(campaignId);
  const { rows, zones } = useProximity(sessionId);
  // The map/Mapcast render whichever campaign the DM has pinned; read the roster
  // from that same session so "On the Map" matches what's actually on screen.
  const vttCampaignId = (isDM && localStorage.getItem('vtt_pinned_campaign')) || campaignId;
  const vttTokens = useVttRoster(vttCampaignId);
  const [checkedIn, setCheckedIn] = useState([]);

  const mapPlayers = vttTokens.map(tokenView).filter(t => t.type === 'player');
  const mapOthers  = vttTokens.map(tokenView).filter(t => t.type !== 'player');

  // Auto-add nearby players to Grimoire every 60 seconds
  useEffect(() => {
    if (!char?.id || !campaignId || !sessionId) return;
    const run = async () => {
      const myZoneNames = rows.filter(r => r.entity_type === 'player' && String(r.entity_id) === String(char.id)).map(r => r.zone_name);
      const nearbyNpcs = rows.filter(r => myZoneNames.includes(r.zone_name) && (r.entity_type === 'npc' || r.entity_type === 'beast'));
      for (const n of nearbyNpcs) {
        const { data: existing } = await supabase.from('grimoire_entries')
          .select('id').eq('character_id', String(char.id))
          .eq('campaign_id', String(campaignId))
          .eq('type', n.entity_type).eq('title', n.entity_name).maybeSingle();
        if (!existing) {
          await supabase.from('grimoire_entries').insert({
            character_id: String(char.id),
            campaign_id: String(campaignId),
            type: n.entity_type,
            title: n.entity_name,
            body: `Encountered in ${n.zone_name}.`,
          });
        }
      }
    };
    run();
    const interval = setInterval(run, 60000);
    return () => clearInterval(interval);
  }, [rows, char?.id, campaignId, sessionId]);
  const [npcs, setNpcs] = useState([]);
  const [beasts, setBeasts] = useState([]);
  const [newZoneName, setNewZoneName] = useState('');

  useEffect(() => {
    if (!sessionId) { setCheckedIn([]); return; }
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
    await supabase.from('session_proximity').delete()
      .eq('session_id', sessionId).eq('entity_type', entityType).eq('entity_id', String(entityId));
    await supabase.from('session_proximity').insert({
      session_id: sessionId, campaign_id: String(campaignId), zone_name: zoneName,
      entity_type: entityType, entity_id: String(entityId), entity_name: entityName,
    });

    // If adding an NPC/beast to a zone, write them to every player in that zone's Grimoire
    if (entityType === 'npc' || entityType === 'beast') {
      const playersInZone = rows.filter(r => r.zone_name === zoneName && r.entity_type === 'player');
      await Promise.all(playersInZone.map(async p => {
        const { data: existing } = await supabase.from('grimoire_entries')
          .select('id').eq('character_id', String(p.entity_id))
          .eq('campaign_id', String(campaignId))
          .eq('type', entityType).eq('title', entityName).maybeSingle();
        if (!existing) {
          await supabase.from('grimoire_entries').insert({
            character_id: String(p.entity_id),
            campaign_id: String(campaignId),
            type: entityType,
            title: entityName,
            body: `Encountered in ${zoneName}.`,
          });
        }
      }));
    }
  };

  const remove = async (row) => {
    await supabase.from('session_proximity').delete().eq('id', row.id);
  };

  const addZone = () => {
    if (!newZoneName.trim()) return;
    setExtraZones(prev => [...prev, newZoneName.trim()]);
    setNewZoneName('');
  };

  // ─── ON THE MAP ─────────────────────────────────────────────────────────────
  // Always-visible roster of everyone currently on the VTT map. Works with or
  // without a formal game session, so the panel is never blank when tokens exist.
  const mapRoster = (mapPlayers.length + mapOthers.length) > 0 && (
    <div>
      <div style={{ ...label8(), marginBottom: 10 }}>On the Map ({mapPlayers.length + mapOthers.length})</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {mapPlayers.map(t => <EntityRow key={t.key} {...t} />)}
        {mapOthers.map(t => <EntityRow key={t.key} {...t} />)}
      </div>
    </div>
  );

  // PLAYER VIEW — show who/what is near them, plus the map roster as a fallback
  if (!isDM) {
    const myZoneNames = rows.filter(r => r.entity_type === 'player' && String(r.entity_id) === String(char?.id)).map(r => r.zone_name);
    const nearbyPlayers = rows.filter(r => myZoneNames.includes(r.zone_name) && r.entity_type === 'player' && String(r.entity_id) !== String(char?.id));
    const nearbyNpcs = rows.filter(r => myZoneNames.includes(r.zone_name) && (r.entity_type === 'npc' || r.entity_type === 'beast'));
    const hasProximity = nearbyPlayers.length > 0 || nearbyNpcs.length > 0;
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <div style={{ ...label8(), marginBottom: 10 }}>In Your Area</div>
          {!hasProximity ? (
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No one nearby yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {nearbyPlayers.map(r => <EntityRow key={r.id} name={r.entity_name} type="player" />)}
              {nearbyNpcs.length > 0 && (
                <>
                  <div style={{ ...label8(), marginTop: 6 }}>Also Nearby</div>
                  {nearbyNpcs.map(r => <EntityRow key={r.id} name={r.entity_name} type={r.entity_type} />)}
                </>
              )}
            </div>
          )}
        </div>
        {mapRoster}
      </div>
    );
  }

  // DM VIEW — map roster on top, then check-in / zone tools when a session is live
  const unassignedPlayers = checkedIn.filter(c => !rows.some(r => r.entity_type === 'player' && String(r.entity_id) === String(c.character_id)));

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {mapRoster}

      {!mapRoster && !sessionId && (
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Nobody on the map and no active session. Add characters to the VTT or start a session to populate the party.
        </div>
      )}

      {sessionId && (
        <>
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
        </>
      )}
    </div>
  );
}
