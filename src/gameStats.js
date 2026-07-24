export const GAME_STATS_KEY = 'lotjarrs:game_stats:v1';

export const GAME_LABELS = {
  driftstone: 'Driftstone',
  fubin: 'Fubin',
  elddimgates: 'Elddimgates',
  undercrypts: 'Undercrypts',
  'ocp-nodewright': 'Nodewright',
};

const EMPTY_STATS = { entries: [], totals: {} };

function safeNow() {
  return new Date().toISOString();
}

function normalizeStats(raw) {
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STATS };
  return {
    entries: Array.isArray(raw.entries) ? raw.entries : [],
    totals: raw.totals && typeof raw.totals === 'object' ? raw.totals : {},
  };
}

export function loadGameStats() {
  if (typeof localStorage === 'undefined') return { ...EMPTY_STATS };
  try {
    return normalizeStats(JSON.parse(localStorage.getItem(GAME_STATS_KEY) || 'null'));
  } catch {
    return { ...EMPTY_STATS };
  }
}

export function saveGameStats(stats) {
  if (typeof localStorage === 'undefined') return stats;
  localStorage.setItem(GAME_STATS_KEY, JSON.stringify(normalizeStats(stats)));
  window.dispatchEvent(new CustomEvent('lotjarrs:game-stats-updated'));
  return stats;
}

export function recordLotjarrsGameResult(gameId, result = {}) {
  const stats = loadGameStats();
  const now = safeNow();
  const outcome = result.outcome || 'complete';
  const score = Number.isFinite(Number(result.score)) ? Number(result.score) : (outcome === 'win' || outcome === 'complete' ? 1 : 0);
  const entry = {
    id: `${now}-${gameId}-${Math.random().toString(36).slice(2, 8)}`,
    gameId,
    gameName: GAME_LABELS[gameId] || result.gameName || gameId,
    playerName: result.playerName || 'Player',
    outcome,
    score,
    scoreLabel: result.scoreLabel || (score ? `+${score}` : outcome),
    meta: result.meta || {},
    playedAt: now,
  };
  const previous = stats.totals[gameId] || {
    plays: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    completions: 0,
    score: 0,
    bestScore: null,
    lastPlayedAt: null,
  };
  const nextTotal = {
    ...previous,
    plays: previous.plays + 1,
    wins: previous.wins + (outcome === 'win' ? 1 : 0),
    losses: previous.losses + (outcome === 'loss' ? 1 : 0),
    draws: previous.draws + (outcome === 'draw' ? 1 : 0),
    completions: previous.completions + (outcome === 'complete' ? 1 : 0),
    score: previous.score + score,
    bestScore: previous.bestScore == null ? score : Math.max(previous.bestScore, score),
    lastPlayedAt: now,
  };
  const next = {
    entries: [entry, ...stats.entries].slice(0, 150),
    totals: { ...stats.totals, [gameId]: nextTotal },
  };
  return saveGameStats(next);
}

export function gameSummary(gameId, stats = loadGameStats()) {
  return stats.totals?.[gameId] || null;
}

export function getGameLeaderboard(stats = loadGameStats(), limit = 8) {
  return Object.entries(stats.totals || {})
    .map(([gameId, total]) => ({
      gameId,
      gameName: GAME_LABELS[gameId] || gameId,
      ...total,
    }))
    .sort((a, b) => (b.score - a.score) || String(b.lastPlayedAt || '').localeCompare(String(a.lastPlayedAt || '')))
    .slice(0, limit);
}
