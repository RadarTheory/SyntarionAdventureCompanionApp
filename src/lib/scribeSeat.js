// ─── SCRIBE SEAT — THE SCRIBE PLAYS A MINI-GAME SEAT ──────────────────────────
// Lets a DM hand one seat of an in-session mini-game to the Scribe instead of
// an NPC/character. Same shape as scribeDM.js's turn loop (system prompt →
// edge function → parse → validate) but the "whitelist" here is simplest of
// all: the model must pick an index into the engine's own legal-action list,
// so there is nothing to validate beyond "is this a real index." Any failure
// returns null so the caller falls back to the game's local heuristic AI.
// ────────────────────────────────────────────────────────────────────────────

import supabase from './supabase';
import { describeAction } from './elddimgatesDescribe';

async function callScribe(system, messages, maxTokens = 60) {
  const { data, error } = await supabase.functions.invoke('scribe', {
    body: { system, messages, max_tokens: maxTokens },
  });
  if (error) throw new Error(error.message || 'The relay to the archives failed.');
  if (data?.error) throw new Error(data.error.message || JSON.stringify(data.error).slice(0, 200));
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('The Scribe fell silent.');
  return text;
}

function parseChoice(raw, max) {
  let text = String(raw).trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) text = text.slice(first, last + 1);
  try {
    const parsed = JSON.parse(text);
    const choice = Math.round(Number(parsed.choice));
    if (Number.isInteger(choice) && choice >= 0 && choice < max) return choice;
  } catch {
    // malformed response — caller falls back to the local heuristic
  }
  return null;
}

const SEAT_DIRECTIVES = `
You are The Scribe, asked to sit in for one council in a game of Elddimgates — a
strategy board game of gates, consuls, and passage. Play to win: protect your
Consul, contest the Grand Square, and press any advantage. Respond with ONLY a
raw JSON object, no markdown fences, no commentary: {"choice": <integer index>}
`.trim();

/**
 * Ask the Scribe to pick one of the engine's own legal actions for the seat
 * currently to move. Returns the chosen action, or null on any failure
 * (network, parse, out-of-range) so the caller can fall back to the local
 * heuristic AI instead of stalling the match.
 */
export async function chooseScribeElddimgatesAction(state, legalActions, seatLabel) {
  if (!legalActions?.length) return null;
  try {
    const options = legalActions.map((action, index) => `${index}: ${describeAction(action)}`).join('\n');
    const message = `You are playing "${seatLabel || 'a council'}" in a live match of Elddimgates, turn ${state.turn}. Choose the strongest legal action from this numbered list:\n${options}`;
    const raw = await callScribe(SEAT_DIRECTIVES, [{ role: 'user', content: message }]);
    const choice = parseChoice(raw, legalActions.length);
    return choice === null ? null : legalActions[choice];
  } catch (e) {
    console.warn('[scribeSeat] Elddimgates move selection failed, falling back to local AI:', e?.message || e);
    return null;
  }
}
