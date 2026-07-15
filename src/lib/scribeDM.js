// ─── THE SCRIBE'S TALE — AI DM BRAIN (ONE-SHOT EDITION) ──────────────────────
// The Scribe as Game Master, constrained to self-contained one-shots.
// This module owns:
//   1. The DM system prompt + JSON action protocol (three-act structure)
//   2. Client-side pacing pressure (the model is TOLD when to escalate/end)
//   3. Context assembly (character, world lore, rolling memory, scene state)
//   4. Response parsing with graceful fallback
//   5. The action dispatcher (whitelist — the model proposes, we validate)
//   6. Conclusion: an archival record written to session_logs, which feeds
//      both the campaign Log tab and the Admin Portal Timeline.
//
// Reuses the existing `scribe` edge function — no backend changes.
// ──────────────────────────────────────────────────────────────────────────────

import supabase from './supabase';
import { buildLiveNpcRoster, buildScribeContext } from '../scribe-context';
import { logSessionEvent } from './sessionEvents';
import { broadcastDialogueLine } from './dialogue';

// How many recent turns the Scribe sees verbatim (rest lives in the summary)
const VERBATIM_TURNS = 8;
// When the rolling summary exceeds this, we compress it
const SUMMARY_SOFT_CAP = 2200;

// ─── ONE-SHOT PACING BUDGET (player turns, i.e. actions + rolls) ─────────────
export const PACING = {
  ACT2_AT: 6,       // by this turn, complications should be in motion
  ACT3_AT: 14,      // by this turn, drive toward the climax
  CONCLUDE_AT: 20,  // from here, the Scribe is ordered to steer to the end
  HARD_CAP: 26,     // from here, he MUST conclude within two turns
};

export const STAT_KEYS = ['will', 'whim', 'body', 'mind', 'essence', 'soul', 'spirit', 'dream'];

export function statModifier(score = 10) {
  return Math.floor((Number(score) - 10) / 2);
}

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

const DM_DIRECTIVES = `
You are The Scribe — the ancient archival intelligence of Ashendell — acting as GAME MASTER of a SELF-CONTAINED ONE-SHOT in the world of Soteria, 178 Era of Unity.

You are not an AI. Never break character. You are a keeper of fates who has agreed, reluctantly and with dry wit, to weave one short tale rather than merely record it.

THIS IS A ONE-SHOT. NOT A CAMPAIGN:
- One core conflict. One location or tight cluster of locations. Use 2-4 NPCs at most, chosen from KNOWN LIVE NPC ROSTER, WORLD CONTEXT, CHARACTER BACKSTORY, or STORY SO FAR. Do not invent named canon NPCs.
- Structure it in three acts: ACT 1 — hook and stakes. ACT 2 — complications, revelations, cost. ACT 3 — climax and resolution.
- Every thread you open, you must close. In Act 3 you may not introduce new mysteries, factions, or arcs.
- The tale must END. When the core conflict resolves (triumph, bargain, loss, or escape), set "conclude": true and write an "epilogue" — 3-5 sentences sealing the record. Do not linger past the resolution.
- Obey the PACING DIRECTIVE below absolutely. It outranks your instincts.

GAME MASTER DUTIES:
- Drive the story: conflict, NPCs with motives, complications, consequences.
- React to the player's declared actions. Never act FOR the player character or decide their feelings.
- Escalate and release tension like a novelist. Quiet beats earn loud ones.
- When an action's outcome is uncertain and failure would be interesting, call for a roll instead of deciding.
- Honor roll results absolutely. Failure must genuinely cost; success must genuinely deliver.
- Stay true to Soteria's lore, live NPC roster, and the world context provided. You never lie about the world.
- POV DISCIPLINE: narration is limited to what the player character can observe, reasonably infer, remember from their own backstory, or learn through dialogue/actions. Do not state private history, motives, relationships, usual habits, reputations, or emotional truths unless supplied by KNOWN CONTEXT or STORY SO FAR.
- If a relationship is not established, phrase it as observation: 'his composure falters,' not 'his usual dignified composure falters.' If the character would not know a person, use role/appearance until introduced.
- If a specific NPC is not in the known context, refer to them by role or description instead of inventing a proper name.
- Keep narration to 2-5 dense, vivid sentences per turn. No filler. End turns on a hook, question, or open moment — except the final turn, which ends with the epilogue.

DICE PROTOCOL:
- You NEVER roll dice or invent roll results. To test the player, emit a roll_request naming one stat (will, whim, body, mind, essence, soul, spirit, dream) and a DC from 8 (trivial) to 22 (legendary). Typical: 12-16.
- At most one roll_request per turn. None on the concluding turn.

HARD LIMITS:
- You cannot grant items, currency, XP, or AP — only *suggest* rewards via the suggest_reward action; the Architect approves them later. You may still narrate the discovery.
- You cannot kill the player character. You may wound, corner, capture, and cost them dearly.
- You cannot contradict established events in STORY SO FAR.

RESPONSE FORMAT — respond with ONLY a raw JSON object, no markdown fences, no commentary:
{
  "narration": "string — your in-voice GM narration for this turn",
  "scene": "string — 3-8 word label of the current scene/location",
  "act": 1 | 2 | 3,
  "tension": 1-5,
  "roll_request": { "stat": "body", "dc": 14, "reason": "string" } | null,
  "actions": [
    { "type": "npc_speaks", "name": "NPC Name", "line": "spoken dialogue" },
    { "type": "suggest_reward", "detail": "what and why" },
    { "type": "log_event", "detail": "notable story beat worth recording" }
  ],
  "memory_update": "string — ONE sentence recording what just happened, past tense",
  "conclude": false,
  "epilogue": null,
  "tale_title": "string — only on the very first turn: a short evocative title"
}
"actions" may be empty. When "conclude" is true, "epilogue" must be a string and roll_request must be null.
`.trim();

function pacingDirective(playerTurn) {
  if (playerTurn >= PACING.HARD_CAP) {
    return `PACING DIRECTIVE — turn ${playerTurn}: THE TALE HAS RUN ITS COURSE. You MUST resolve the core conflict and set "conclude": true within TWO turns at most. If the player stalls, the world forces the ending. No new elements.`;
  }
  if (playerTurn >= PACING.CONCLUDE_AT) {
    return `PACING DIRECTIVE — turn ${playerTurn}: Act 3, endgame. Steer directly to resolution. Offer the player their decisive moment now. Conclude as soon as the conflict resolves.`;
  }
  if (playerTurn >= PACING.ACT3_AT) {
    return `PACING DIRECTIVE — turn ${playerTurn}: Enter Act 3. The climax must begin. Close open threads; introduce nothing new.`;
  }
  if (playerTurn >= PACING.ACT2_AT) {
    return `PACING DIRECTIVE — turn ${playerTurn}: Act 2. Complicate. Reveal a cost, a twist, or a hard choice tied to the core conflict.`;
  }
  return `PACING DIRECTIVE — turn ${playerTurn}: Act 1. Establish the hook, the stakes, and the core conflict quickly.`;
}

// ─── CONTEXT ASSEMBLY ─────────────────────────────────────────────────────────

function characterBlock(char) {
  const stats = char?.stats || {};
  const statLine = STAT_KEYS
    .map(k => `${k[0].toUpperCase() + k.slice(1)} ${stats[k] ?? 8} (${statModifier(stats[k] ?? 8) >= 0 ? '+' : ''}${statModifier(stats[k] ?? 8)})`)
    .join(', ');
  return `
THE PLAYER CHARACTER (the only PC — everyone else is yours):
Name: ${char?.name || 'Unknown'}
Race: ${char?.race || 'Unknown'}${char?.pmV ? ` — ${char.pmV} bloodline` : ''}
Class Path: ${char?.cp || 'Unknown'} (${char?.cid || '?'})
Belief: ${char?.beliefType || 'None'}${char?.deity ? ` — ${char.deity}` : ''}${char?.spirit ? ` — ${char.spirit}` : ''}
Stats: ${statLine}
Backstory: ${(char?.backstory || 'None recorded').slice(0, 600)}
`.trim();
}

export async function buildDMSystemPrompt({ char, tale, playerAction, campaignId, playerTurn }) {
  const retrievalQuery = `${playerAction || ''} ${tale?.scene || ''} ${char?.race || ''} ${char?.cp || ''}`;
  const [worldContext, liveNpcRoster] = await Promise.all([
    buildScribeContext(retrievalQuery, 6000, campaignId ? String(campaignId) : null),
    buildLiveNpcRoster(80),
  ]);

  return [
    DM_DIRECTIVES,
    pacingDirective(playerTurn || 1),
    '━━━ WORLD CONTEXT (the archives) ━━━',
    worldContext,
    '━━━ ' + characterBlock(char) + ' ━━━',
    `━━━ CURRENT STATE ━━━\nScene: ${tale?.scene || 'The tale has not yet begun.'}\nAct: ${tale?.act || 1}/3 · Tension: ${tale?.tension ?? 1}/5`,
    `━━━ STORY SO FAR ━━━\n${tale?.summary?.trim() || 'Nothing yet. This is the opening of the one-shot — set the scene and hook the player.'}`,
  ].join('\n\n');
}

// ─── EDGE FUNCTION CALL ───────────────────────────────────────────────────────

async function callScribe(system, messages, maxTokens = 1200) {
  const { data, error } = await supabase.functions.invoke('scribe', {
    body: { system, messages, max_tokens: maxTokens },
  });
  if (error) throw new Error(error.message || 'The relay to the archives failed.');
  if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error).slice(0, 200));
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('The Scribe fell silent.');
  return text;
}

// ─── RESPONSE PARSING ─────────────────────────────────────────────────────────

export function parseScribeTurn(raw) {
  let text = String(raw).trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) text = text.slice(first, last + 1);

  try {
    const t = JSON.parse(text);
    const conclude = t.conclude === true;
    return {
      narration: String(t.narration || '').trim() || '…the ink refuses to settle.',
      scene: typeof t.scene === 'string' ? t.scene.slice(0, 80) : null,
      act: [1, 2, 3].includes(Math.round(+t.act)) ? Math.round(+t.act) : null,
      tension: Number.isFinite(+t.tension) ? Math.min(5, Math.max(1, Math.round(+t.tension))) : null,
      rollRequest: conclude ? null : validateRollRequest(t.roll_request),
      actions: Array.isArray(t.actions) ? t.actions.slice(0, 5) : [],
      memoryUpdate: typeof t.memory_update === 'string' ? t.memory_update.slice(0, 300) : '',
      conclude,
      epilogue: conclude && typeof t.epilogue === 'string' ? t.epilogue.slice(0, 1200) : null,
      taleTitle: typeof t.tale_title === 'string' ? t.tale_title.slice(0, 80) : null,
      parsed: true,
    };
  } catch {
    return {
      narration: String(raw).trim().slice(0, 2000),
      scene: null, act: null, tension: null, rollRequest: null,
      actions: [], memoryUpdate: '', conclude: false, epilogue: null,
      taleTitle: null, parsed: false,
    };
  }
}

function validateRollRequest(rr) {
  if (!rr || typeof rr !== 'object') return null;
  const stat = String(rr.stat || '').toLowerCase();
  if (!STAT_KEYS.includes(stat)) return null;
  const dc = Math.min(24, Math.max(6, Math.round(Number(rr.dc) || 12)));
  return { stat, dc, reason: String(rr.reason || 'The moment demands proof.').slice(0, 200) };
}

// ─── ACTION DISPATCHER (whitelist) ────────────────────────────────────────────

export async function dispatchActions(actions, { campaignId, sessionId, char, taleId }) {
  const executed = [];
  for (const a of actions || []) {
    try {
      switch (a?.type) {
        case 'npc_speaks': {
          const name = String(a.name || 'A stranger').slice(0, 60);
          const line = String(a.line || '').slice(0, 500);
          if (!line) break;
          await broadcastDialogueLine({
            campaignId, sessionId: sessionId || null,
            participantIds: char?.id ? [char.id] : [],
            speakerName: `${name} (Tale)`, content: line, isDM: true,
          });
          executed.push({ type: 'npc_speaks', name, line });
          break;
        }
        case 'suggest_reward': {
          const detail = String(a.detail || '').slice(0, 400);
          if (!detail) break;
          await supabase.from('dm_memory').insert({
            campaign_id: String(campaignId),
            category: 'tale_reward_suggestion',
            content: `[SCRIBE'S TALE ${taleId}] Suggested reward for ${char?.name || '?'}: ${detail}`,
          });
          executed.push({ type: 'suggest_reward', detail });
          break;
        }
        case 'log_event': {
          const detail = String(a.detail || '').slice(0, 400);
          if (!detail) break;
          await logSessionEvent(campaignId, sessionId, 'ai_dm_beat', {
            tale_id: taleId, character: char?.name, detail,
          });
          executed.push({ type: 'log_event', detail });
          break;
        }
        default:
          break; // unknown action types are silently dropped
      }
    } catch (e) {
      console.warn('[scribeDM] action failed:', a?.type, e?.message);
    }
  }
  return executed;
}

// ─── ROLLING MEMORY ───────────────────────────────────────────────────────────

export async function foldMemory(tale, memoryUpdate) {
  let summary = (tale.summary || '').trim();
  if (memoryUpdate) summary = summary ? `${summary}\n• ${memoryUpdate}` : `• ${memoryUpdate}`;

  if (summary.length > SUMMARY_SOFT_CAP) {
    try {
      const compressed = await callScribe(
        'You compress story logs. Respond with ONLY the compressed text, no preamble.',
        [{ role: 'user', content: `Compress this adventure log to under 1200 characters. Preserve: named NPCs and their attitudes, promises made, injuries, items found, unresolved threads, and the current objective. Drop scenery.\n\n${summary}` }],
        700,
      );
      if (compressed?.trim()) summary = compressed.trim();
    } catch {
      const lines = summary.split('\n');
      summary = lines.slice(Math.max(0, lines.length - 24)).join('\n');
    }
  }
  return summary;
}

// ─── PERSISTENCE ──────────────────────────────────────────────────────────────

export async function loadOrCreateTale(campaignId, characterId) {
  const { data: existing, error: existingError } = await supabase.from('scribe_tales').select('*')
    .eq('campaign_id', String(campaignId)).eq('character_id', String(characterId))
    .eq('status', 'active')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (existingError) throw new Error(`Could not load Tales: ${existingError.message}`);
  if (existing) return existing;

  const { data: created, error } = await supabase.from('scribe_tales')
    .insert({ campaign_id: String(campaignId), character_id: String(characterId) })
    .select().single();
  if (error) throw new Error(`Could not open a new tale: ${error.message}`);
  return created;
}

export async function loadTurns(taleId, limit = 200) {
  const { data, error } = await supabase.from('scribe_tale_turns').select('*')
    .eq('tale_id', taleId).order('created_at', { ascending: true }).limit(limit);
  if (error) throw new Error(`Could not load Tale turns: ${error.message}`);
  return data || [];
}

export async function saveTurn(taleId, role, content, actions = null) {
  const { data, error } = await supabase.from('scribe_tale_turns')
    .insert({ tale_id: taleId, role, content, actions })
    .select().single();
  if (error) throw new Error(`Could not save Tale turn: ${error.message}`);
  return data;
}

export async function updateTale(taleId, patch) {
  const { data, error } = await supabase.from('scribe_tales')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', taleId).select().single();
  if (error) throw new Error(`Could not update Tale: ${error.message}`);
  return data;
}

/** Count of player-driven turns (actions + rolls) — the pacing clock. */
export function countPlayerTurns(turns) {
  return (turns || []).filter(t => t.role === 'player' || t.role === 'roll').length;
}

// ─── CONCLUSION: WRITE THE RECORD TO LOG + TIMELINE ───────────────────────────

/**
 * Seal a concluded one-shot into the permanent record:
 *  1. The Scribe composes an archival entry from the rolling summary + epilogue
 *  2. It's written to session_logs — which feeds the campaign Log tab AND the
 *     Admin Portal Timeline (both read from that table)
 *  3. The tale row is marked concluded, epilogue stored
 * Called when the model returns conclude:true, or on manual conclusion.
 */
export async function concludeTaleRecord({ tale, char, campaignId, epilogue }) {
  const title = tale.title && tale.title !== 'An Untitled Tale' ? tale.title : `${char?.name || 'A traveler'}'s One-Shot`;

  // 1. Compose the archival entry (best-effort; summary is the fallback)
  let entry = [
    `ONE-SHOT RECORD — "${title}"`,
    `Adventurer: ${char?.name || 'Unknown'} (${char?.race || '?'} ${char?.cp || '?'})`,
    '',
    (tale.summary || '').trim(),
    '',
    epilogue ? `— Epilogue —\n${epilogue}` : '',
  ].filter(Boolean).join('\n');

  try {
    const composed = await callScribe(
      'You are The Scribe of Ashendell, sealing a completed one-shot adventure into the permanent archives. Respond with ONLY the archival record: 120-200 words of measured, past-tense prose in your voice. Name the adventurer, the conflict, the turning points, and how it ended. No preamble, no headers.',
      [{ role: 'user', content: `Adventurer: ${char?.name} (${char?.race} ${char?.cp})\n\nStory log:\n${tale.summary || '(sparse record)'}\n\nEpilogue:\n${epilogue || '(none written)'}` }],
      500,
    );
    if (composed?.trim()) {
      entry = `ONE-SHOT RECORD — "${title}"\n\n${composed.trim()}`;
    }
  } catch (e) {
    console.warn('[scribeDM] archival composition failed, using raw summary:', e?.message);
  }

  // 2. session_logs → Log tab + Admin Timeline
  const { error: logErr } = await supabase.from('session_logs').insert({
    campaign_id: String(campaignId),
    session_id: String(tale.id), // the tale is its own session for record purposes
    title: `One-Shot · ${title}`,
    entry,
    summary: epilogue || entry.slice(0, 400),
    raw_events: { tale_id: tale.id, character_id: char?.id, character_name: char?.name, source: 'scribe_tale' },
    visible_to_players: true,
    approved: true,
  });
  if (logErr) console.warn('[scribeDM] session_logs write failed:', logErr.message);

  // 3. Seal the tale
  const sealed = await updateTale(tale.id, { status: 'concluded', epilogue: epilogue || null });
  return { tale: sealed || { ...tale, status: 'concluded', epilogue }, entry };
}

// ─── THE FULL TURN ────────────────────────────────────────────────────────────

/**
 * Run one complete DM turn:
 * player input → pacing directive → Gemini → parse → dispatch → memory fold
 * → persist → (if concluded) seal the record into session_logs/Timeline.
 * Returns { turn, tale } — turn.conclude signals the tale has ended.
 */
export async function runDMTurn({ tale, char, campaignId, sessionId, recentTurns, playerInput }) {
  // 1. Persist the player's turn
  await saveTurn(tale.id, playerInput.role || 'player', playerInput.content);

  const playerTurn = countPlayerTurns(recentTurns) + 1;

  // 2. Last N turns verbatim (summary carries the rest)
  const verbatim = [...recentTurns, { role: playerInput.role || 'player', content: playerInput.content }]
    .slice(-VERBATIM_TURNS)
    .map(t => ({
      role: t.role === 'scribe' ? 'assistant' : 'user',
      content: t.role === 'roll' ? `[DICE] ${t.content}` : t.content,
    }));

  // 3. Ask the Scribe (pacing directive rides in the system prompt)
  const system = await buildDMSystemPrompt({ char, tale, playerAction: playerInput.content, campaignId, playerTurn });
  const raw = await callScribe(system, verbatim, 1200);
  const turn = parseScribeTurn(raw);

  // Belt and suspenders: if the model blows past the hard cap without
  // concluding, force the conclusion on the next pass by flagging it here.
  if (!turn.conclude && playerTurn >= PACING.HARD_CAP + 2) {
    turn.conclude = true;
    turn.epilogue = turn.epilogue || 'The threads of this tale, left untended, were sealed by the archives themselves. What was unresolved remains so — recorded, if not concluded.';
  }

  // 4. Dispatch whitelisted actions
  const executed = await dispatchActions(turn.actions, { campaignId, sessionId, char, taleId: tale.id });

  // 5. Fold memory + update tale state
  const summary = await foldMemory(tale, turn.memoryUpdate);
  const patch = { summary };
  if (turn.scene) patch.scene = turn.scene;
  if (turn.act) patch.act = turn.act;
  if (turn.tension) patch.tension = turn.tension;
  if (turn.taleTitle && (!tale.title || tale.title === 'An Untitled Tale')) patch.title = turn.taleTitle;
  let updatedTale = await updateTale(tale.id, patch) || { ...tale, ...patch };
  if (turn.conclude && turn.epilogue) {
    turn.narration = `${turn.narration}\n\n${turn.epilogue}`;
  }

  // 6. Persist the Scribe's turn
  await saveTurn(tale.id, 'scribe', turn.narration, {
    executed, roll_request: turn.rollRequest, parsed: turn.parsed,
    act: turn.act, conclude: turn.conclude,
  });

  // 7. Conclusion → seal into session_logs (Log tab + Admin Timeline)
  if (turn.conclude) {
    const { tale: sealed } = await concludeTaleRecord({
      tale: updatedTale, char, campaignId, epilogue: turn.epilogue,
    });
    updatedTale = sealed;
  }

  return { turn, tale: updatedTale };
}