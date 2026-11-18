// Loads a map's ambience (map_ambience, keyed by the map's file name) and keeps it live: a light the DM places shows on
// every player's map at once. Also keeps the campaign's world clock, which drives day and night on the map.
// Until a map has been set up it uses the default scene, so every map is alive from the start.
import { useCallback, useEffect, useRef, useState } from 'react';
import supabase from './supabase';
import { DEFAULT_SCENE } from './ambience';

const blank = map => ({ map, scene: DEFAULT_SCENE, timeMode: 'clock', lights: [], grid: null, configured: false });
const fromRow = row => ({ map: row.map, scene: row.scene || DEFAULT_SCENE, timeMode: row.time_mode || 'clock', lights: Array.isArray(row.lights) ? row.lights : [], grid: row.grid || null, configured: true });

export function useMapAmbience(mapFilename) {
  const [ambience, setAmbience] = useState(() => blank(mapFilename));
  const [saveError, setSaveError] = useState('');
  const saveTimer = useRef(null);

  useEffect(() => {
    if (!mapFilename) return undefined;
    let live = true;
    supabase.from('map_ambience').select('*').eq('map', mapFilename).maybeSingle()
      .then(({ data }) => { if (live) setAmbience(data ? fromRow(data) : blank(mapFilename)); });
    const channel = supabase.channel(`ambience-${mapFilename}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'map_ambience', filter: `map=eq.${mapFilename}` },
        payload => { if (live && payload.new?.map) setAmbience(fromRow(payload.new)); })
      .subscribe();
    return () => { live = false; supabase.removeChannel(channel); };
  }, [mapFilename]);

  // The DM's changes show at once and are saved a moment later (several quick clicks make one write).
  const update = useCallback(change => {
    setAmbience(prev => {
      const next = { ...prev, ...(typeof change === 'function' ? change(prev) : change), map: mapFilename, configured: true };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const { error } = await supabase.from('map_ambience').upsert({
          map: mapFilename, scene: next.scene, time_mode: next.timeMode, lights: next.lights, grid: next.grid || null, updated_at: new Date().toISOString(),
        });
        setSaveError(error ? (/grid/.test(error.message) ? 'Run supabase/migrations/20261117_map_grid.sql to save the map grid.' : /map_ambience/.test(error.message) ? 'Run supabase/migrations/20261117_map_ambience.sql to save map ambience.' : error.message) : '');
      }, 400);
      return next;
    });
  }, [mapFilename]);

  return { ambience: mapFilename && ambience.map === mapFilename ? ambience : blank(mapFilename), update, saveError };
}

// The campaign's world clock, refreshed every minute and on any change (the map reads the live time each frame).
export function useWorldClock(campaignId) {
  const [clock, setClock] = useState(null);
  useEffect(() => {
    if (!campaignId) return undefined;
    let live = true;
    const load = () => supabase.from('world_clock').select('*').eq('campaign_id', String(campaignId)).maybeSingle()
      .then(({ data }) => { if (live) setClock(data || null); });
    load();
    const timer = setInterval(load, 60000);
    const channel = supabase.channel(`map-clock-${campaignId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'world_clock', filter: `campaign_id=eq.${campaignId}` }, load)
      .subscribe();
    return () => { live = false; clearInterval(timer); supabase.removeChannel(channel); };
  }, [campaignId]);
  return clock;
}
