import { useEffect, useState } from 'react';
import supabase from './supabase';

// ─── DM Audio Broadcast ─────────────────────────────────────────────────────
// Lets a remote player's browser mirror what the DM is currently playing
// (music/environment/ambience/SFX), close enough to "live" for background
// audio: one row per active session, DM writes patch it, players subscribe
// via the same postgres_changes pattern used everywhere else in this app
// (GameSessionOverlay.jsx, HerculesPlayer.jsx, lib/session.jsx) rather than
// introducing Supabase Broadcast/Presence channels for the first time here.
// `music_started_at` is what lets a joining/resuming client compute how far
// into the current track it should start, instead of always starting at 0.
// ─────────────────────────────────────────────────────────────────────────────

export async function upsertBroadcast(sessionId, campaignId, patch) {
  if (!sessionId) return null;
  const { data, error } = await supabase.from('dm_audio_broadcast')
    .upsert({
      session_id: String(sessionId),
      campaign_id: String(campaignId),
      updated_at: new Date().toISOString(),
      ...patch,
    }, { onConflict: 'session_id' })
    .select().single();
  if (error) console.warn('[audioBroadcast] Failed to upsert broadcast:', error.message);
  return data || null;
}

// Player-side: the DM's current soundboard state, live.
export function useAudioBroadcast(sessionId) {
  const [row, setRow] = useState(null);

  useEffect(() => {
    if (!sessionId) return undefined;
    let cancelled = false;
    supabase.from('dm_audio_broadcast').select('*').eq('session_id', String(sessionId)).maybeSingle()
      .then(({ data }) => { if (!cancelled) setRow(data || null); });

    const channel = supabase.channel('dm-audio-broadcast-' + sessionId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dm_audio_broadcast' }, (payload) => {
        const next = payload.new;
        if (!next || String(next.session_id) !== String(sessionId)) return;
        setRow(next);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [sessionId]);

  return row;
}

// Re-fetches the broadcast row fresh — used when a remote player resumes
// from a personal pause, so they catch back up to whatever is live now
// instead of continuing from wherever they paused (the "not like TiVo" fix).
export async function fetchBroadcastNow(sessionId) {
  if (!sessionId) return null;
  const { data } = await supabase.from('dm_audio_broadcast').select('*').eq('session_id', String(sessionId)).maybeSingle();
  return data || null;
}

// ─── Session Listening Mode ─────────────────────────────────────────────────
// Per-session designation: is this checked-in player physically at the table
// (hears the DM's real speakers, no local playback) or remote (needs the
// broadcast streamed to their own device)? Defaults to 'remote' — most play
// in this app happens online — until the DM explicitly marks someone 'table'.
// ─────────────────────────────────────────────────────────────────────────────

export async function setListeningMode(sessionId, characterId, mode) {
  if (!sessionId || !characterId) return;
  const { error } = await supabase.from('session_listening_mode')
    .upsert({
      session_id: String(sessionId),
      character_id: String(characterId),
      mode,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id,character_id' });
  if (error) console.warn('[audioBroadcast] Failed to set listening mode:', error.message);
}

// Player-side: just their own mode.
export function useListeningMode(sessionId, characterId) {
  const [mode, setMode] = useState('remote');

  useEffect(() => {
    if (!sessionId || !characterId) return undefined;
    let cancelled = false;
    supabase.from('session_listening_mode').select('mode')
      .eq('session_id', String(sessionId)).eq('character_id', String(characterId)).maybeSingle()
      .then(({ data }) => { if (!cancelled) setMode(data?.mode || 'remote'); });

    const channel = supabase.channel('listening-mode-' + sessionId + '-' + characterId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_listening_mode' }, (payload) => {
        const row = payload.new;
        if (!row || String(row.session_id) !== String(sessionId) || String(row.character_id) !== String(characterId)) return;
        setMode(row.mode || 'remote');
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [sessionId, characterId]);

  return mode;
}

// DM-side: every checked-in character's current mode, live, for the "Players
// at the Table" roster. Returns a Map keyed by character_id.
export function useListeningModes(sessionId) {
  const [modes, setModes] = useState(new Map());

  useEffect(() => {
    if (!sessionId) return undefined;
    let cancelled = false;
    const load = () => supabase.from('session_listening_mode').select('character_id, mode')
      .eq('session_id', String(sessionId))
      .then(({ data }) => { if (!cancelled) setModes(new Map((data || []).map(r => [String(r.character_id), r.mode]))); });
    load();

    const channel = supabase.channel('listening-modes-' + sessionId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'session_listening_mode' }, (payload) => {
        const row = payload.new || payload.old;
        if (!row || String(row.session_id) !== String(sessionId)) return;
        load();
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [sessionId]);

  return modes;
}
