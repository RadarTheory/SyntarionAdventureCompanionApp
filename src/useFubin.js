// ═══════════════════════════════════════════════════════
//  useFubin.js  —  Supabase stubs for Fubin
//  DEV: Replace these with real Supabase calls.
//  All hooks follow the same shape so wiring is minimal.
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useCallback } from 'react';

// ── Auth ──────────────────────────────────────────────
// DEV: Replace with your real auth hook, e.g.:
//   import { useAuth } from '../hooks/useAuth'
//   const { user } = useAuth()
export function useCurrentUser() {
  // Stub returns a placeholder user shape
  return {
    uuid: 'local-user',
    username: 'You',
    character: null,
  };
}

// ── Stats ─────────────────────────────────────────────
// DEV: Replace with Supabase reads/writes to a `fubin_stats` table.
// Schema suggestion:
//   fubin_stats(id, user_uuid, wins_vs_ai, losses_vs_ai, wins_vs_human, losses_vs_human, updated_at)

const STATS_KEY = 'fubin_stats_local';

function loadLocalStats() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) || {
      wins_vs_ai: 0,
      losses_vs_ai: 0,
      wins_vs_human: 0,
      losses_vs_human: 0,
    };
  } catch {
    return { wins_vs_ai: 0, losses_vs_ai: 0, wins_vs_human: 0, losses_vs_human: 0 };
  }
}

export function useFubinStats(userUuid) {
  const [stats, setStats] = useState(loadLocalStats);
  const [loading, setLoading] = useState(false);

  // DEV: Replace this useEffect with a Supabase fetch:
  // useEffect(() => {
  //   if (!userUuid) return;
  //   setLoading(true);
  //   supabase.from('fubin_stats').select('*').eq('user_uuid', userUuid).single()
  //     .then(({ data }) => { if (data) setStats(data); setLoading(false); });
  // }, [userUuid]);

  const recordResult = useCallback(async ({ isAI, won }) => {
    setStats(prev => {
      const next = { ...prev };
      if (isAI) {
        if (won) next.wins_vs_ai++; else next.losses_vs_ai++;
      } else {
        if (won) next.wins_vs_human++; else next.losses_vs_human++;
      }
      // DEV: Replace localStorage write with:
      // supabase.from('fubin_stats').upsert({ user_uuid: userUuid, ...next })
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { stats, loading, recordResult };
}

// ── Leaderboard ───────────────────────────────────────
// DEV: Replace with:
// supabase.from('fubin_stats')
//   .select('user_uuid, username, wins_vs_ai, wins_vs_human')
//   .order('wins_vs_human', { ascending: false })
//   .limit(3)

const STUB_LEADERBOARD = [
  { rank: 1, username: 'Rune', wins: 24, losses: 8 },
  { rank: 2, username: 'Aurora', wins: 19, losses: 11 },
  { rank: 3, username: 'Nim', wins: 15, losses: 14 },
];

export function useFubinLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEV: Replace with real Supabase query above
    const timer = setTimeout(() => {
      setLeaderboard(STUB_LEADERBOARD);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  return { leaderboard, loading };
}

// ── Invite / Challenge ────────────────────────────────
// DEV: Replace with your app's real invite mechanism.
// Suggested Supabase table:
//   fubin_challenges(id, from_uuid, to_uuid, from_username, status, created_at)
// status: 'pending' | 'accepted' | 'declined'

export async function invitePlayerByUsername({ fromUuid, fromUsername, toUsername }) {
  // DEV: Replace with:
  // const { data: target } = await supabase.from('profiles').select('uuid').eq('username', toUsername).single();
  // if (!target) throw new Error('Player not found');
  // await supabase.from('fubin_challenges').insert({ from_uuid: fromUuid, to_uuid: target.uuid, from_username: fromUsername, status: 'pending' });

  console.log(`[Fubin Stub] Challenge sent from ${fromUsername} to ${toUsername}`);
  return { success: true, toUsername };
}

// DEV: Replace with a Supabase realtime subscription:
// supabase.channel('fubin-challenges')
//   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fubin_challenges',
//       filter: `to_uuid=eq.${userUuid}` }, payload => onChallenge(payload.new))
//   .subscribe();

export function useIncomingChallenge(userUuid, onChallenge) {
  useEffect(() => {
    // Stub: does nothing until Supabase is wired
    // DEV: Wire realtime subscription here
    return () => {};
  }, [userUuid, onChallenge]);
}

// ── Online Players ────────────────────────────────────
// DEV: Replace with presence channel or a query on profiles table filtered by last_seen
// Stub returns fake players for UI development
const STUB_PLAYERS = [
  { uuid: 'p1', username: 'Aurora', online: true },
  { uuid: 'p2', username: 'Nim', online: true },
  { uuid: 'p3', username: 'Sable', online: false },
  { uuid: 'p4', username: 'Rune', online: true },
  { uuid: 'p5', username: 'Zephyr', online: false },
];

export function useOnlinePlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DEV: Replace with Supabase presence or profiles query
    const timer = setTimeout(() => {
      setPlayers(STUB_PLAYERS);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  return { players, loading };
}