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

// Build a non-AI DM record + per-character chronicles directly from events.
// checkins: [{ character_id, character_name }]
export function compileLocalSynopsis(events, checkins) {
  const meaningful = (events || []).filter(
    e => !['turn_advance'].includes(e.type)
  );

  const lines = meaningful.map(e => {
    const out = e.outcome && e.outcome !== 'Approved by DM.' ? ` — ${e.outcome}` : '';
    return `• ${e.actor_name}: ${e.description}${out}`;
  });

  const dmRecord =
    `SESSION EVENT LOG (compiled from combat record)\n\n` +
    `${lines.join('\n')}\n\n` +
    `${meaningful.length} events recorded.`;

  // Per-character: their own events + any event whose text names them.
  const chronicles = {};
  (checkins || []).forEach(c => {
    const name = c.character_name || '';
    const own = meaningful.filter(e => {
      const hay = `${e.actor_name} ${e.description} ${e.outcome || ''}`.toLowerCase();
      return (
        (e.actor_id && String(e.actor_id) === String(c.character_id)) ||
        (name && hay.includes(name.toLowerCase()))
      );
    });
    const body = own.length
      ? own.map(e => {
          const out = e.outcome && e.outcome !== 'Approved by DM.' ? ` — ${e.outcome}` : '';
          return `• ${e.description}${out}`;
        }).join('\n')
      : `${name} was present for the session.`;
    chronicles[c.character_id] = { name, text: body, publish: true };
  });

  return { dmRecord, chronicles };
}