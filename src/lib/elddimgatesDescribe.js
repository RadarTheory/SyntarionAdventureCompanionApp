// Shared with src/Elddimgates.jsx (human-readable action labels) and
// src/lib/scribeSeat.js (numbered move list shown to the Scribe). Lives
// outside Elddimgates.jsx because that file's fast-refresh export must stay
// component-only.
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const coord = (p) => FILES[p.f] + (p.r + 1);
const cap = (value) => String(value || '').replace(/^./, c => c.toUpperCase());

export function describeAction(action) {
  if (!action) return 'Ready.';
  if (action.type === 'move') return `Move ${coord(action.from)} to ${coord(action.to)}`;
  if (action.type === 'exchange') return `Envoy exchange ${coord(action.from)} and ${coord(action.to)}`;
  if (action.type === 'place') return `Place ${cap(action.gateId?.includes('a') ? 'arcane' : action.gateId?.includes('m') ? 'mechanist' : 'civic')} gate`;
  if (action.type === 'rotate') return `Rotate gate ${action.gateId}`;
  return cap(action.type);
}
