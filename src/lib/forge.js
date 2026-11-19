// The Map Forge (user, 2026-11-18): when the DM approves a move off the map, or onto an exit (door, stairs, passage),
// the party can go on. If that exit already leads somewhere, they follow it. If not, the Scribe drafts what lies beyond,
// the forge (supabase/functions/forge) paints two options, and the DM approves one. An approved map is canon: a named
// point of interest (POI) in Soteria, locked, and linked both ways to the exit it came through, for every campaign.
import supabase from './supabase';
import { uploadMap } from './maps';
import { ELEMENT_KINDS, isExitKind } from './ambience';
import { gridFor } from './grid';

// The forge paints 3:2 maps, 30 x 20 squares.
export const FORGE_SQUARES = [30, 20];
const FORGE_W = 1536, FORGE_H = 1024;
const SIDES = { n: 'north', e: 'east', s: 'south', w: 'west' };
const OPPOSITE = { n: 's', s: 'n', e: 'w', w: 'e' };
const ARRIVE_FOR = { stairsDown: 'stairsUp', stairsUp: 'stairsDown', door: 'door', passage: 'passage' };

// Which exit an approved move ended on: an exit pin within about one square, or the map's edge (within one square).
// dest: { x, y } 0-1. Returns null, or { kind, side?, pin?, link?, label }.
export function exitFor(ambience, dest, mapImg) {
  if (!dest) return null;
  const grid = gridFor(ambience?.grid, mapImg);
  const aspect = mapImg?.width && mapImg?.height ? mapImg.width / mapImg.height : 1.5;
  const cellX = grid.cell, cellY = grid.cell * aspect;
  const pins = (Array.isArray(ambience?.lights) ? ambience.lights : []).filter(l => isExitKind(l.kind) && l.kind !== 'edge');
  let best = null, bestD = Infinity;
  for (const p of pins) {
    const d = Math.hypot((p.x - dest.x) / cellX, (p.y - dest.y) / cellY);
    if (d <= 1.2 && d < bestD) { best = p; bestD = d; }
  }
  if (best) return { kind: best.kind, pin: best, link: best.link || null, label: ELEMENT_KINDS[best.kind].label.toLowerCase() };
  const near = { w: dest.x <= cellX, e: dest.x >= 1 - cellX, n: dest.y <= cellY, s: dest.y >= 1 - cellY };
  const side = Object.keys(near).filter(k => near[k]).sort((a, b) => edgeDistance(dest, a) - edgeDistance(dest, b))[0];
  if (!side) return null;
  const edgePin = (Array.isArray(ambience?.lights) ? ambience.lights : []).find(l => l.kind === 'edge' && l.side === side);
  return { kind: 'edge', side, pin: edgePin || null, link: edgePin?.link || null, label: `${SIDES[side]} edge` };
}
const edgeDistance = (p, side) => ({ w: p.x, e: 1 - p.x, n: p.y, s: 1 - p.y })[side];

const toBase64 = canvas => canvas.toDataURL('image/png').split(',')[1];

// For an edge: a forge canvas with the strip of the current map along the edge being left, placed on the opposite side,
// so the new map continues it across the seam. The rest is left dark for the forge to fill.
export function continuationCanvas(img, side) {
  const c = document.createElement('canvas'); c.width = FORGE_W; c.height = FORGE_H;
  const g = c.getContext('2d');
  g.fillStyle = '#1a1a1a'; g.fillRect(0, 0, FORGE_W, FORGE_H);
  const share = 0.22; // how much of the old map carries across
  if (side === 'e' || side === 'w') {
    const sw = img.width * share, dw = FORGE_W * share;
    const sx = side === 'e' ? img.width - sw : 0, dx = side === 'e' ? 0 : FORGE_W - dw;
    g.drawImage(img, sx, 0, sw, img.height, dx, 0, dw, FORGE_H);
  } else {
    const sh = img.height * share, dh = FORGE_H * share;
    const sy = side === 's' ? img.height - sh : 0, dy = side === 's' ? 0 : FORGE_H - dh;
    g.drawImage(img, 0, sy, img.width, sh, 0, dy, FORGE_W, dh);
  }
  return { data: toBase64(c), mimeType: 'image/png' };
}

// The current map, smaller, as a style reference (for doors, stairs and passages, where nothing carries across).
export function styleReference(img) {
  const scale = Math.min(1, 768 / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { data: c.toDataURL('image/jpeg', 0.85).split(',')[1], mimeType: 'image/jpeg' };
}

// What the Scribe knows of the moment: the map, its scene, the exit, who went, and the latest lore and session log.
async function sceneContext({ campaignId, mapName, scene, exit, travellers }) {
  const [{ data: lore }, { data: events }] = await Promise.all([
    supabase.from('dm_memory').select('content, created_at').eq('campaign_id', String(campaignId)).order('created_at', { ascending: false }).limit(8),
    supabase.from('session_events').select('event_type, payload, created_at').eq('campaign_id', String(campaignId)).order('created_at', { ascending: false }).limit(25),
  ]);
  const logLines = (events || []).map(e => e.payload?.description || e.payload?.content || e.event_type).filter(Boolean).slice(0, 15);
  return [
    `CURRENT MAP: ${mapName}`, `SCENE: ${scene}`,
    `THE PARTY IS LEAVING BY: ${exit.label}${exit.side ? ` (${SIDES[exit.side]})` : ''}`,
    `WHO: ${travellers.join(', ') || 'the party'}`,
    'RECENT LORE AND DM NOTES (newest first):', ...(lore || []).map(l => `- ${l.content}`),
    'RECENT SESSION LOG (newest first):', ...logLines.map(l => `- ${l}`),
  ].join('\n');
}

// The Scribe drafts the new place: its POI name, region and a short brief for the forge.
export async function draftBrief(ctx) {
  const context = await sceneContext(ctx);
  const system = 'You are the Scribe of Soteria, a fantasy world of steam, spirit and old powers. The party is leaving the current map. '
    + 'Describe the place they reach next so a map painter can draw it: a top-down battle map. Answer as JSON only: '
    + '{"poi":"a short evocative place name, prefixed with the parent location when it belongs to it (e.g. \\"Tarek\'Mor · Flooded Gallery\\")",'
    + '"region":"the Soteria region it lies in, if known","brief":"3-5 sentences: terrain, structures, light sources, hazards, where the party arrives and what draws the eye"}. '
    + 'Keep it consistent with the lore and log given. Stairs down lead to a lower level, stairs up to a higher one, a door to what lies behind it.';
  const { data, error } = await supabase.functions.invoke('scribe', { body: { system, messages: [{ role: 'user', content: context }], max_tokens: 600 } });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context?.json())?.error?.message || msg; } catch { /* keep the generic message */ }
    throw new Error(msg);
  }
  const text = data?.content?.[0]?.text || data?.text || data?.choices?.[0]?.message?.content || '';
  const m = text.match(/\{[\s\S]*\}/);
  try { return JSON.parse(m ? m[0] : text); } catch { return { poi: `${ctx.mapName} · Beyond`, region: '', brief: text.trim() }; }
}

// The forge request, following the map standard (docs/MAP-STANDARD.md).
export function forgePrompt({ brief, exit }) {
  const [w, h] = FORGE_SQUARES;
  const how = exit.kind === 'edge'
    ? `The image provided shows the edge of the existing map on the ${SIDES[OPPOSITE[exit.side]]} side; continue it seamlessly so roads, walls, tunnels, water and terrain carry straight across, then fill the rest of the map.`
    : `The image provided is the map the party is leaving; match its art style, palette, lighting and scale exactly. The party arrives by ${ELEMENT_KINDS[ARRIVE_FOR[exit.kind] || 'door'].label.toLowerCase()}.`;
  return [
    `Top-down fantasy battle map, ${w} x ${h} squares, straight overhead view, no perspective tilt.`,
    'One square is six feet: doorways one square wide, corridors one to two squares wide. No grid lines, no text, no labels, no UI.',
    'Painted light sources (lanterns, torches, braziers, crystals) as bright points in darker surroundings.',
    how,
    `The place: ${brief}`,
  ].join(' ');
}

export async function forgeImage({ prompt, images }) {
  const { data, error } = await supabase.functions.invoke('forge', { body: { prompt, images, aspectRatio: '3:2' } });
  if (error) {
    let msg = error.message;
    try { msg = (await error.context?.json())?.error?.message || msg; } catch { /* keep the generic message */ }
    throw new Error(/not found|404/i.test(msg) ? 'The forge is not deployed yet: run `npx supabase functions deploy forge`.' : msg);
  }
  if (data?.error) throw new Error(data.error.message);
  return data.image; // { data, mimeType }
}

// Where the party appears on the new map: just inside the edge opposite the one they left by, or at the matching exit.
export function arrivalPoint(exit) {
  if (exit.kind === 'edge') return { e: { x: 0.06, y: 0.5 }, w: { x: 0.94, y: 0.5 }, n: { x: 0.5, y: 0.92 }, s: { x: 0.5, y: 0.08 } }[exit.side];
  return { x: 0.5, y: 0.82 };
}

// Approve: save the image as a canon map, lock it to its POI, and link the exits both ways.
// Returns { key, arrival } for the VTT to move the party there.
export async function approveForged({ image, poi, region, brief, originKey, exit, originAmbience, saveOriginAmbience }) {
  const blob = await (await fetch(`data:${image.mimeType};base64,${image.data}`)).blob();
  const file = new File([blob], `${poi}.png`, { type: image.mimeType });
  const up = await uploadMap(file, poi);
  await supabase.from('vtt_maps').update({ poi, region: region || null, parent_key: originKey, via: exit.kind === 'edge' ? `edge:${exit.side}` : exit.kind, brief, generated: true, locked: true }).eq('key', up.key);

  const arrival = arrivalPoint(exit);
  const backId = `exit-${Math.random().toString(36).slice(2, 9)}`;
  const outId = exit.pin?.id || `exit-${Math.random().toString(36).slice(2, 9)}`;
  // The new map: the forge's 30 x 20 squares, the origin's scene, and an exit back.
  const back = exit.kind === 'edge'
    ? { id: backId, kind: 'edge', side: OPPOSITE[exit.side], x: arrival.x, y: arrival.y, link: { map: originKey, exit: outId } }
    : { id: backId, kind: ARRIVE_FOR[exit.kind] || 'door', x: arrival.x, y: arrival.y, size: 1, link: { map: originKey, exit: outId } };
  const { error } = await supabase.from('map_ambience').upsert({
    map: up.key, scene: originAmbience?.scene || 'outdoor', time_mode: originAmbience?.timeMode || 'clock',
    lights: [back], grid: { cell: 1 / FORGE_SQUARES[0], ox: 0, oy: 0 }, hidden_found: [], updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  // The origin: its exit now leads to the new map.
  saveOriginAmbience(prev => {
    const lights = Array.isArray(prev.lights) ? prev.lights : [];
    const link = { map: up.key, exit: backId };
    if (exit.pin) return { lights: lights.map(l => (l.id === exit.pin.id ? { ...l, link } : l)) };
    const edgeAt = { e: { x: 0.98, y: 0.5 }, w: { x: 0.02, y: 0.5 }, n: { x: 0.5, y: 0.02 }, s: { x: 0.5, y: 0.98 } }[exit.side];
    return { lights: [...lights, { id: outId, kind: 'edge', side: exit.side, ...edgeAt, link }] };
  });
  return { key: up.key, arrival, poi };
}

// Where a linked exit lands on the map it leads to.
export async function linkedArrival(link) {
  const { data } = await supabase.from('map_ambience').select('lights').eq('map', link.map).maybeSingle();
  const pin = (data?.lights || []).find(l => l.id === link.exit);
  if (!pin) return { x: 0.5, y: 0.5 };
  // Step just inside the map from an edge.
  if (pin.kind === 'edge') return { e: { x: 0.94, y: pin.y }, w: { x: 0.06, y: pin.y }, n: { x: pin.x, y: 0.08 }, s: { x: pin.x, y: 0.92 } }[pin.side] || { x: pin.x, y: pin.y };
  return { x: pin.x, y: Math.min(0.95, pin.y + 0.04) };
}
