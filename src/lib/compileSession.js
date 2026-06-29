import supabase from './supabase';

// Pull the combat events for a campaign's most recent Hercules session.
// Returns { events, hsessionId }.
export async function fetchHerculesEventsForCampaign(campaignId) {
  const { data: hsession } = await supabase
    .from('hercules_sessions')
    .select('id')
    .eq('campaign_id', String(campaignId))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!hsession?.id) return { events: [], hsessionId: null };

  const { data: events } = await supabase
    .from('hercules_events')
    .select('created_at, type, actor_name, actor_id, description, outcome')
    .eq('session_id', hsession.id)
    .order('created_at', { ascending: true });

  return { events: events || [], hsessionId: hsession.id };
}

// Flatten events into a plain-text transcript the Scribe can read.
export function eventsToTranscript(events) {
  if (!events || events.length === 0) return 'No combat events recorded.';
  return events
    .map(e => {
      const t = new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const out = e.outcome && e.outcome !== 'Approved by DM.' ? ` → ${e.outcome}` : '';
      return `${t}  [${e.type}] ${e.actor_name}: ${e.description}${out}`;
    })
    .join('\n');
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const NOISE_TYPES = new Set(['turn_advance', 'combat_start']);
const SYSTEM_ACTORS = new Set(['the architect', 'dungeon master', 'system']);

// Is the live outcome real prose the DM wrote, vs. a default stamp?
function hasNarrativeOutcome(e) {
  const o = (e.outcome || '').trim();
  if (!o) return false;
  if (o === 'Approved by DM.') return false;
  if (/^Denied:/i.test(o)) return false;
  return true;
}

// Strip dice math from a description so prose reads cleanly.
// "Declan Wellby used Range: d20 2 = 2." -> "Declan Wellby used Range"
function cleanDescription(desc) {
  if (!desc) return '';
  return desc
    .replace(/:\s*d20[^.]*\.?$/i, '')           // trailing "d20 X = Y"
    .replace(/\bd20\s*\d+\s*=\s*\d+\.?/gi, '')   // inline dice
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+\./g, '.')
    .trim();
}

// The best single sentence for a beat: prefer the DM's outcome prose,
// else a cleaned description.
function beatText(e) {
  if (hasNarrativeOutcome(e)) return e.outcome.trim();
  return cleanDescription(e.description) || e.description || '';
}

function timeLabel(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

// ─── main compiler ────────────────────────────────────────────────────────────

// Build a non-AI DM record + per-character chronicles directly from events.
// checkins: [{ character_id, character_name }]
export function compileLocalSynopsis(events, checkins) {
  const all = (events || []).filter(e => !NOISE_TYPES.has(e.type));

  if (all.length === 0) {
    const empty = {};
    (checkins || []).forEach(c => {
      empty[c.character_id] = { name: c.character_name || '', text: `${c.character_name || 'This character'} was present for the session.`, publish: true };
    });
    return { dmRecord: 'No combat or recorded events for this session.', chronicles: empty };
  }

  // Roster: combatant names actually seen in initiative/enemy_added events.
  const combatants = [];
  const seen = new Set();
  all.forEach(e => {
    const n = (e.actor_name || '').trim();
    if (!n || SYSTEM_ACTORS.has(n.toLowerCase())) return;
    if (seen.has(n.toLowerCase())) return;
    if (['initiative', 'enemy_added'].includes(e.type)) {
      seen.add(n.toLowerCase());
      combatants.push(n);
    }
  });

  const checkinNames = new Set((checkins || []).map(c => (c.character_name || '').toLowerCase()));
  const enemies = combatants.filter(n => !checkinNames.has(n.toLowerCase()));

  // Dramatic beats worth calling out.
  const deaths = all.filter(e => e.type === 'death').map(e => e.actor_name);
  const killingBlow = (() => {
    // last narrative outcome that mentions a death, or the event right before a death
    const deathIdx = all.findIndex(e => e.type === 'death');
    if (deathIdx > 0) {
      for (let i = deathIdx - 1; i >= 0; i--) {
        if (hasNarrativeOutcome(all[i])) return all[i];
      }
    }
    return null;
  })();

  const crits = all.filter(e => /\b20\s*=\s*22\b|\bDice:\s*20\b|d20\s*20\s*=/.test(e.description || ''));

  // ── DM RECORD ──────────────────────────────────────────────────────────────
  const dmLines = [];
  dmLines.push('SESSION DEBRIEF — compiled from the combat record.');
  dmLines.push('');

  if (combatants.length) {
    const pcs = combatants.filter(n => checkinNames.has(n.toLowerCase()));
    if (pcs.length) dmLines.push(`Party: ${pcs.join(', ')}.`);
    if (enemies.length) dmLines.push(`Adversaries: ${enemies.join(', ')}.`);
    dmLines.push('');
  }

  // Chronological beats — every action/roll/dialogue/death/dm_note in order,
  // led by the DM's own prose where it exists.
  dmLines.push('— Sequence of events —');
  all.forEach(e => {
    if (['initiative', 'enemy_added'].includes(e.type)) return; // rostered above
    const txt = beatText(e);
    if (!txt) return;
    const t = timeLabel(e.created_at);
    const who = SYSTEM_ACTORS.has((e.actor_name || '').toLowerCase()) ? '' : `${e.actor_name}: `;
    dmLines.push(`${t}  ${who}${txt}`);
  });

  if (deaths.length || killingBlow) {
    dmLines.push('');
    dmLines.push('— Outcome —');
    if (killingBlow) dmLines.push(killingBlow.outcome.trim());
    deaths.forEach(d => dmLines.push(`${d} fell.`));
  }

  if (crits.length) {
    dmLines.push('');
    dmLines.push(`Notable rolls: ${crits.length} critical-tier result${crits.length > 1 ? 's' : ''} during the fight.`);
  }

  const dmRecord = dmLines.join('\n');

  // ── PER-CHARACTER CHRONICLES ────────────────────────────────────────────────
  const chronicles = {};
  (checkins || []).forEach(c => {
    const name = (c.character_name || '').trim();
    const lc = name.toLowerCase();

    const own = all.filter(e => {
      if (['initiative', 'enemy_added', 'death'].includes(e.type)) return false;
      const byId = e.actor_id && String(e.actor_id) === String(c.character_id);
      const byActor = (e.actor_name || '').toLowerCase() === lc;
      const named = name && `${e.description || ''} ${e.outcome || ''}`.toLowerCase().includes(lc);
      return byId || byActor || named;
    });

    if (!own.length) {
      chronicles[c.character_id] = { name, text: `${name || 'This character'} stood among the company but left no mark on the record this session.`, publish: true };
      return;
    }

    // Prefer the DM's narrative outcomes; they're already prose.
    const beats = own.map(e => beatText(e)).filter(Boolean);

    // De-dup consecutive identical beats (dialogue often logs twice).
    const deduped = beats.filter((b, i) => i === 0 || b !== beats[i - 1]);

    const text = deduped.map(b => (/[.!?]$/.test(b) ? b : `${b}.`)).join(' ');
    chronicles[c.character_id] = { name, text, publish: true };
  });

  return { dmRecord, chronicles };
}