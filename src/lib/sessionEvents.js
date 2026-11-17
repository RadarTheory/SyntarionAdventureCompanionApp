import supabase from './supabase';

// ── Write buffer (user, 2026-11-17) ──────────────────────────────────────────
// Every system logs through logSessionEvent, so events are batched here instead of one insert each: they queue, then
// go to Supabase together 1.5s after the first one (or at once when 20 are waiting). Each event keeps the moment it
// happened (created_at is stamped when logged, not when sent), and each caller's promise still resolves when its
// event is actually written, exactly as before. The queue is mirrored to localStorage and flushed when the tab is
// hidden or closed, so a reload replays anything unsent. If a batch is rejected the rows are retried one by one, so a
// single bad row cannot hold the rest back; failures are only warned about, as they always were.
const QUEUE_KEY = 'syntarion_session_event_queue';
const FLUSH_MS = 1500;
const BATCH_MAX = 20;
let queue = [];            // [{ row, resolve }]
let timer = null;
let flushing = null;       // promise of the flush in progress

function persist() {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.map(q => q.row))); } catch { /* storage may be unavailable */ }
}

async function writeRows(rows) {
  const { error } = await supabase.from('session_events').insert(rows);
  if (!error) return;
  // One bad row should not sink the batch: fall back to writing them singly.
  for (const row of rows) {
    const { error: one } = await supabase.from('session_events').insert(row);
    if (one) console.warn('[sessionEvents] Failed to log event:', one.message);
  }
}

/** Send everything queued now. Readers call this first so they always see what was just logged. */
export async function flushSessionEvents() {
  if (flushing) await flushing;
  clearTimeout(timer); timer = null;
  if (!queue.length) return;
  const batch = queue.splice(0, queue.length);
  persist();
  flushing = (async () => {
    for (let i = 0; i < batch.length; i += BATCH_MAX) {
      await writeRows(batch.slice(i, i + BATCH_MAX).map(q => q.row));
    }
    batch.forEach(q => q.resolve?.());
  })();
  try { await flushing; } finally { flushing = null; }
}

function schedule() {
  if (queue.length >= BATCH_MAX) { flushSessionEvents(); return; }
  if (!timer) timer = setTimeout(() => { timer = null; flushSessionEvents(); }, FLUSH_MS);
}

if (typeof window !== 'undefined') {
  // Replay anything a previous visit queued but never sent.
  try {
    const left = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    if (Array.isArray(left) && left.length) { queue = left.map(row => ({ row })); schedule(); }
  } catch { /* ignore a damaged queue */ }
  const leave = () => { if (queue.length) flushSessionEvents(); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') leave(); });
  window.addEventListener('pagehide', leave);
}

/**
 * Write a session event to the session_events table.
 * Any system can call this to feed the Scribe log. Buffered: see above.
 *
 * @param {string} campaignId
 * @param {string|null} sessionId  - active session UUID if known
 * @param {string} eventType       - 'npc_met' | 'combat_kill' | 'loot_claimed' | 'lark_sent' | 'player_checkin'
 * @param {object} payload         - freeform jsonb, varies by event type
 */
export function logSessionEvent(campaignId, sessionId, eventType, payload = {}) {
  if (!campaignId) return Promise.resolve();
  const row = {
    campaign_id: String(campaignId),
    session_id: sessionId ? String(sessionId) : null,
    event_type: eventType,
    payload,
    created_at: new Date().toISOString(),
  };
  return new Promise(resolve => {
    queue.push({ row, resolve });
    persist();
    schedule();
  });
}

/**
 * Fetch all events for a given session, ordered chronologically.
 */
export async function getSessionEvents(sessionId) {
  if (!sessionId) return [];
  await flushSessionEvents();
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