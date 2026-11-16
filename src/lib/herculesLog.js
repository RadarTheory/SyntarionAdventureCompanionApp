import supabase from './supabase';

export function herculesScribeSuggestion(event = {}) {
  const total = Number(event.total ?? event.roll ?? 0);
  const actor = event.actor_name || 'The actor';
  const description = event.description || event.type || 'action';

  if (event.type === 'initiative') {
    return `${actor} enters the fray with initiative ${total}. Suggested outcome: place them in turn order and frame how they enter the scene.`;
  }

  if (event.type === 'move_request') {
    return `${actor} requests movement. Suggested outcome: approve the final position, deny it, or add a complication before the token moves.`;
  }

  if (event.type === 'ability' || event.type === 'spell' || event.type === 'cast_request') {
    return `${actor} invokes an ability. Suggested outcome: approve the effect, reshape it, apply cost or consequence, then narrate what the table sees.`;
  }

  if (event.type === 'intent') {
    return `${actor} declares intent. Suggested outcome: decide whether it happens freely, needs a roll, or changes the scene state.`;
  }

  if (total >= 20) return `${actor}'s ${description} is decisive. Suggested outcome: strong success, added effect, leverage, or momentum.`;
  if (total >= 15) return `${actor}'s ${description} appears successful. Suggested outcome: let it land unless opposed by strong defenses.`;
  if (total >= 10) return `${actor}'s ${description} is uncertain. Suggested outcome: partial success, reduced effect, or complication.`;
  if (total > 0) return `${actor}'s ${description} likely fails or creates an opening. Suggested outcome: miss, blocked attempt, consequence, or enemy advantage.`;

  return `${actor}'s ${description} needs an Architect ruling. Suggested outcome: approve, deny, or write the final story beat.`;
}

export async function getOrCreateHerculesSession(campaignId) {
  if (!campaignId) return { session: null, error: new Error('No campaign id supplied') };

  const cid = String(campaignId);
  const { data: existing, error: existingError } = await supabase
    .from('hercules_sessions')
    .select('*')
    .eq('campaign_id', cid)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingError) return { session: null, error: existingError };
  if (existing?.id) return { session: existing, error: null };

  const { data: created, error: createError } = await supabase
    .from('hercules_sessions')
    .insert({
      campaign_id: cid,
      status: 'active',
      current_turn: 0,
    })
    .select()
    .single();

  if (createError) return { session: null, error: createError };

  await supabase.from('hercules_events').insert({
    session_id: created.id,
    campaign_id: cid,
    type: 'continuity_start',
    actor_name: 'HERCULES',
    actor_id: null,
    description: 'HERCULES continuity is active outside combat. All rolls, spells, movement, and story actions require Architect approval.',
    dm_approved: true,
    outcome: 'HERCULES continuity session opened.',
  });

  return { session: created, error: null };
}

export async function logHerculesEvent(campaignId, event) {
  const { session, error } = await getOrCreateHerculesSession(campaignId);
  if (error || !session?.id) {
    console.error('[Hercules] Failed to prepare continuity session:', error);
    return { data: null, error };
  }

  const row = {
    session_id: session.id,
    campaign_id: String(campaignId),
    type: event.type || 'action',
    actor_name: event.actor_name || 'Unknown Actor',
    actor_id: event.actor_id ?? null,
    description: event.description || '',
    roll: event.roll ?? null,
    modifier: event.modifier ?? null,
    total: event.total ?? null,
    scribe_suggestion: event.scribe_suggestion || herculesScribeSuggestion(event),
    dm_approved: event.dm_approved ?? null,
    outcome: event.outcome ?? null,
  };

  const { data, error: insertError } = await supabase
    .from('hercules_events')
    .insert(row)
    .select()
    .single();

  if (insertError) console.error('[Hercules] Failed to log continuity event:', insertError);
  return { data, error: insertError, session };
}

export async function logAstragalRoll(campaignId, payload, { architect = false } = {}) {
  const name = architect ? 'The Architect' : payload.actorName;
  const natural = payload.crit === 'critical_success' ? ' · Nat 20' : payload.crit === 'critical_failure' ? ' · Nat 1' : '';
  const { error } = await logHerculesEvent(campaignId, {
    type: architect ? 'dm_roll' : 'roll',
    actor_name: name,
    actor_id: architect || !payload.actorId ? null : String(payload.actorId),
    modifier: payload.totalBonus,
    total: payload.total,
    description: `${name} · ${payload.actionName} · ${payload.notation} (${payload.diceResults.join(', ')}) → ${payload.total}${natural}`,
  });
  if (error) throw error;
}
