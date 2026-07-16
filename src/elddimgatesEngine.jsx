// elddimgatesEngine.js
// Elddimgates — pure rules engine. No React, no Supabase, no DOM.
// Implements Official Rules v1. Serializable state for Supabase Realtime.
//
// COORDINATES
//   Squares: {f, r} with files a–g = f 0–6, ranks 1–7 = r 0–6.
//   Player 1 home rank r=0, target High Gate d7 = (3,6).
//   Player 2 home rank r=6, target High Gate d1 = (3,0).
//   Hinge intersections: {x, y}, x,y ∈ 1..6 — the point where squares
//   (x-1,y-1)(x,y-1)(x-1,y)(x,y) meet.
//   Gate orientation 'h': blocks edges between rank y-1 and y at files x-1 and x.
//   Gate orientation 'v': blocks edges between file x-1 and x at ranks y-1 and y.
//
// ENGINE RULINGS (documented; not in the rulebook's letter):
//   1. Diagonal corner squeeze: a diagonal step A→D is legal only if at least
//      one of the two orthogonal L-paths around the shared corner is fully
//      un-gated *for that mover* (occupancy of the corner squares is ignored;
//      only gates squeeze). Applies to every diagonal move and slide step.
//   2. Magister attack set includes squares reachable via its optional
//      Attunement Step (shift must target an empty square) — it can capture
//      there in one action, therefore it attacks there.
//   3. Charter timing: after Player 2's main action resolves (game not ended),
//      Player 2 may attach one gate action, ko-exempt, then the turn passes.
//   4. Repetition key includes gate set+orientations, piece set, side to move,
//      and Charter availability.

export const P1 = 1;
export const P2 = 2;
export const PIECES = ['consul', 'praetor', 'legionary', 'magister', 'artifex', 'envoy', 'warden'];
const HOME_ORDER_P1 = ['warden', 'magister', 'legionary', 'consul', 'praetor', 'artifex', 'envoy']; // a1..g1
const HOME_ORDER_P2 = ['envoy', 'artifex', 'praetor', 'consul', 'legionary', 'magister', 'warden']; // a7..g7
export const GRAND_SQUARE = { f: 3, r: 3 };
export const HIGH_GATE = { [P1]: { f: 3, r: 0 }, [P2]: { f: 3, r: 6 } }; // each player's OWN gate
const ORTH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const ALL8 = [...ORTH, ...DIAG];

const inBoard = (f, r) => f >= 0 && f < 7 && r >= 0 && r < 7;
const sq = (f, r) => f + ',' + r;
const other = (p) => (p === P1 ? P2 : P1);
export const targetSquare = (p) => HIGH_GATE[other(p)];

// ---------------------------------------------------------------- game setup

export function createGame(options = {}) {
  const pieces = {}; // key "f,r" -> {type, owner}
  HOME_ORDER_P1.forEach((t, f) => { pieces[sq(f, 0)] = { type: t, owner: P1 }; });
  HOME_ORDER_P2.forEach((t, f) => { pieces[sq(f, 6)] = { type: t, owner: P2 }; });
  const mkGates = (owner) => ([
    { id: `g${owner}a1`, owner, kind: 'arcane', placed: false, hinge: null, orientation: null },
    { id: `g${owner}a2`, owner, kind: 'arcane', placed: false, hinge: null, orientation: null },
    { id: `g${owner}m1`, owner, kind: 'mechanist', placed: false, hinge: null, orientation: null },
    { id: `g${owner}m2`, owner, kind: 'mechanist', placed: false, hinge: null, orientation: null },
  ]);
  const state = {
    pieces,
    gates: [...mkGates(P1), ...mkGates(P2)],
    toMove: P1,
    charterAvailable: true,          // Player 2's token
    turn: 1,
    deadCouncil: 0,                  // consecutive turns w/o capture or placement
    // gate-config snapshot at the start of each player's previous turn (ko)
    koSnapshots: { [P1]: null, [P2]: null },
    repetition: {},                  // positionKey -> count
    status: { phase: 'playing', winner: null, reason: null },
    modules: {
      civicGates: !!options.civicGates,
      procession: !!options.procession,
      canalLocks: options.canalLocks || null, // array of edge keys, or null
      deadCouncilLimit: options.deadCouncilLimit || 40,
    },
    log: [],
  };
  if (state.modules.civicGates) {
    state.gates.push({ id: 'g1c', owner: P1, kind: 'civic', placed: false, hinge: null, orientation: null });
    state.gates.push({ id: 'g2c', owner: P2, kind: 'civic', placed: false, hinge: null, orientation: null });
  }
  if (options.formations) applyFormations(state, options.formations); // {1:[...7 types a-file first from that player's left], 2:[...]}
  state.repetition[positionKey(state)] = 1;
  state.koSnapshots[P1] = gateConfigKey(state);
  state.koSnapshots[P2] = gateConfigKey(state);
  return state;
}

function applyFormations(state, formations) {
  for (const p of [P1, P2]) {
    const arr = formations[p];
    if (!arr) continue;
    const rank = p === P1 ? 0 : 6;
    for (let f = 0; f < 7; f++) delete state.pieces[sq(f, rank)];
    // arrays are given from that player's own left
    arr.forEach((t, i) => {
      const f = p === P1 ? i : 6 - i;
      state.pieces[sq(f, rank)] = { type: t, owner: p };
    });
  }
}

// ---------------------------------------------------------------- gate model

// Edge keys: orthogonal edge between adjacent squares a,b (canonical order).
export function edgeKey(a, b) {
  const [s, t] = [a, b].sort((u, v) => (u.f - v.f) || (u.r - v.r));
  return `${s.f},${s.r}|${t.f},${t.r}`;
}

export function gateEdges(hinge, orientation) {
  const { x, y } = hinge;
  if (orientation === 'h') {
    return [
      edgeKey({ f: x - 1, r: y - 1 }, { f: x - 1, r: y }),
      edgeKey({ f: x, r: y - 1 }, { f: x, r: y }),
    ];
  }
  return [
    edgeKey({ f: x - 1, r: y - 1 }, { f: x, r: y - 1 }),
    edgeKey({ f: x - 1, r: y }, { f: x, r: y }),
  ];
}

// Numeric edge ids for the movement hot path:
//   horizontal-crossing edge between (f,r)-(f,r+1): id = r*7+f        (0..41)
//   vertical-crossing edge between (f,r)-(f+1,r):   id = 49 + r*7+f   (49..90)
function eid(a, b) {
  if (a.f === b.f) { const r = Math.min(a.r, b.r); return r * 7 + a.f; }
  const f = Math.min(a.f, b.f); return 49 + a.r * 7 + f;
}
function gateEdgeIds(hinge, orientation) {
  const { x, y } = hinge;
  if (orientation === 'h') return [(y - 1) * 7 + (x - 1), (y - 1) * 7 + x];
  return [49 + (y - 1) * 7 + (x - 1), 49 + y * 7 + (x - 1)];
}
function blockedEdges(gatesOrState) {
  const gates = gatesOrState.gates || gatesOrState;
  const map = new Array(98); // id -> gate
  for (const g of gates) {
    if (!g.placed) continue;
    for (const e of gateEdgeIds(g.hinge, g.orientation)) map[e] = g;
  }
  return map;
}

// May `mover` ({type,owner}) cross edge a-b?
function edgeOpenFor(edges, a, b, mover) {
  const g = edges[eid(a, b)];
  if (!g) return true;
  if (mover && mover.type === 'consul') {
    if (g.kind === 'civic') return true;              // both Consuls
    if (g.owner === mover.owner) return true;         // Right of Passage
  }
  return false;
}

// Diagonal corner squeeze (Engine Ruling 1)
function diagOpenFor(edges, a, d, mover) {
  const b = { f: d.f, r: a.r }; // horizontal-first corner
  const c = { f: a.f, r: d.r }; // vertical-first corner
  const viaB = edgeOpenFor(edges, a, b, mover) && edgeOpenFor(edges, b, d, mover);
  const viaC = edgeOpenFor(edges, a, c, mover) && edgeOpenFor(edges, c, d, mover);
  return viaB || viaC;
}

function stepOpen(edges, a, b, mover) {
  return (a.f === b.f || a.r === b.r)
    ? edgeOpenFor(edges, a, b, mover)
    : diagOpenFor(edges, a, b, mover);
}

// ---------------------------------------------------------------- move gen

// Returns array of {to:{f,r}, via?:{f,r}} destinations for the piece at `from`.
// Pseudo-legal: ignores self-check; respects gates, occupancy, capture rules.
function pieceDests(state, edges, from, piece) {
  const out = [];
  const occ = (f, r) => state.pieces[sq(f, r)] || null;
  const push = (to, via) => out.push(via ? { to, via } : { to });
  const canLand = (t) => { const o = occ(t.f, t.r); return !o || o.owner !== piece.owner; };

  const step1 = (dirs) => {
    for (const [df, dr] of dirs) {
      const t = { f: from.f + df, r: from.r + dr };
      if (!inBoard(t.f, t.r)) continue;
      if (!stepOpen(edges, from, t, piece)) continue;
      if (canLand(t)) push(t);
    }
  };

  switch (piece.type) {
    case 'consul':
    case 'warden':
    case 'envoy':
      step1(ALL8);
      break;

    case 'praetor': {
      for (const [df, dr] of ORTH) {                       // slide ≤3 orth
        let cur = from;
        for (let i = 0; i < 3; i++) {
          const t = { f: cur.f + df, r: cur.r + dr };
          if (!inBoard(t.f, t.r) || !stepOpen(edges, cur, t, piece)) break;
          const o = occ(t.f, t.r);
          if (o) { if (o.owner !== piece.owner) push(t); break; }
          push(t); cur = t;
        }
      }
      step1(DIAG);                                          // exactly 1 diag
      break;
    }

    case 'legionary': {                                     // 1 or 2 straight orth
      for (const [df, dr] of ORTH) {
        const t1 = { f: from.f + df, r: from.r + dr };
        if (!inBoard(t1.f, t1.r) || !stepOpen(edges, from, t1, piece)) continue;
        const o1 = occ(t1.f, t1.r);
        if (o1) { if (o1.owner !== piece.owner) push(t1); continue; }
        push(t1);
        const t2 = { f: t1.f + df, r: t1.r + dr };
        if (!inBoard(t2.f, t2.r) || !stepOpen(edges, t1, t2, piece)) continue;
        if (canLand(t2)) push(t2);
      }
      break;
    }

    case 'magister': {                                      // [shift] + diag slide
      const origins = [{ o: from, via: undefined }];
      for (const [df, dr] of ORTH) {                        // Attunement Step
        const s = { f: from.f + df, r: from.r + dr };
        if (!inBoard(s.f, s.r)) continue;
        if (occ(s.f, s.r)) continue;                        // non-capturing, empty only
        if (!stepOpen(edges, from, s, piece)) continue;
        origins.push({ o: s, via: s });
        push(s, s);                                         // shift alone (via===to)
      }
      for (const { o, via } of origins) {
        for (const [df, dr] of DIAG) {
          let cur = o;
          for (;;) {
            const t = { f: cur.f + df, r: cur.r + dr };
            if (!inBoard(t.f, t.r) || !stepOpen(edges, cur, t, piece)) break;
            if (t.f === from.f && t.r === from.r) break;    // may not slide back onto start
            const oc = occ(t.f, t.r);
            if (oc) { if (oc.owner !== piece.owner) push(t, via); break; }
            push(t, via); cur = t;
          }
        }
      }
      break;
    }

    case 'artifex': {                                       // 1 orth + optional 90° second
      for (const [df, dr] of ORTH) {
        const t1 = { f: from.f + df, r: from.r + dr };
        if (!inBoard(t1.f, t1.r) || !stepOpen(edges, from, t1, piece)) continue;
        const o1 = occ(t1.f, t1.r);
        if (o1) { if (o1.owner !== piece.owner) push(t1); continue; } // capture = final square
        push(t1);
        const perps = df === 0 ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
        for (const [pf, pr] of perps) {
          const t2 = { f: t1.f + pf, r: t1.r + pr };
          if (!inBoard(t2.f, t2.r) || !stepOpen(edges, t1, t2, piece)) continue;
          if (canLand(t2)) push(t2, t1);
        }
      }
      break;
    }
  }
  // de-duplicate destinations (magister via multiple origins etc.)
  const seen = {};
  return out.filter((m) => {
    const k = sq(m.to.f, m.to.r) + '|' + (m.via ? sq(m.via.f, m.via.r) : '');
    if (seen[k]) return false; seen[k] = 1; return true;
  });
}

// Squares attacked by `player` (full map — UI highlighting; not the hot path)
export function attackedSquares(state, player) {
  const edges = blockedEdges(state);
  const set = {};
  for (const key in state.pieces) {
    const p = state.pieces[key];
    if (p.owner !== player) continue;
    const [f, r] = key.split(',').map(Number);
    for (const m of pieceDests(state, edges, { f, r }, p)) {
      if (p.type === 'magister' && m.via && m.via.f === m.to.f && m.via.r === m.to.r) continue; // bare shift never captures
      set[sq(m.to.f, m.to.r)] = true;
    }
  }
  return set;
}

// Is `target` attacked by any piece of `player`? Early-exit, geometry-pruned.
function squareAttacked(pieces, edges, player, target) {
  const occ = (f, r) => pieces[sq(f, r)] || null;
  for (const key in pieces) {
    const p = pieces[key];
    if (p.owner !== player) continue;
    const ci = key.indexOf(',');
    const f = +key.slice(0, ci), r = +key.slice(ci + 1);
    const df = target.f - f, dr = target.r - r;
    const adf = Math.abs(df), adr = Math.abs(dr);
    const from = { f, r };
    switch (p.type) {
      case 'consul': case 'warden': case 'envoy':
        if (adf <= 1 && adr <= 1 && (adf || adr) && stepOpen(edges, from, target, p)) return true;
        break;
      case 'praetor':
        if (adf <= 1 && adr === adf && adf === 1 && stepOpen(edges, from, target, p)) return true;
        if ((df === 0 || dr === 0) && (adf + adr) >= 1 && (adf + adr) <= 3) {
          const sf = Math.sign(df), sr = Math.sign(dr);
          let cur = from, ok = true;
          for (let i = 1; i <= adf + adr; i++) {
            const nxt = { f: cur.f + sf, r: cur.r + sr };
            if (!stepOpen(edges, cur, nxt, p)) { ok = false; break; }
            if (i < adf + adr && occ(nxt.f, nxt.r)) { ok = false; break; }
            cur = nxt;
          }
          if (ok) return true;
        }
        break;
      case 'legionary':
        if ((df === 0 || dr === 0) && (adf + adr) >= 1 && (adf + adr) <= 2) {
          const sf = Math.sign(df), sr = Math.sign(dr);
          const mid = { f: f + sf, r: r + sr };
          if (adf + adr === 1) { if (stepOpen(edges, from, target, p)) return true; }
          else if (!occ(mid.f, mid.r) && stepOpen(edges, from, mid, p) && stepOpen(edges, mid, target, p)) return true;
        }
        break;
      case 'artifex': {
        if ((adf + adr === 1) && stepOpen(edges, from, target, p)) return true;
        if (adf === 1 && adr === 1) {
          for (const mid of [{ f: target.f, r }, { f, r: target.r }]) {
            if (occ(mid.f, mid.r)) continue;
            if (stepOpen(edges, from, mid, p) && stepOpen(edges, mid, target, p)) return true;
          }
        }
        break;
      }
      case 'magister': {
        const ray = (o) => {
          const rdf = target.f - o.f, rdr = target.r - o.r;
          if (Math.abs(rdf) !== Math.abs(rdr) || rdf === 0) return false;
          const sf = Math.sign(rdf), sr = Math.sign(rdr);
          let cur = o;
          for (let i = 0; i < Math.abs(rdf); i++) {
            const nxt = { f: cur.f + sf, r: cur.r + sr };
            if (nxt.f === f && nxt.r === r) return false;            // may not slide back onto start
            if (!stepOpen(edges, cur, nxt, p)) return false;
            if ((nxt.f !== target.f || nxt.r !== target.r) && occ(nxt.f, nxt.r)) return false;
            cur = nxt;
          }
          return true;
        };
        if (ray(from)) return true;
        for (const [odf, odr] of ORTH) {
          const s0 = { f: f + odf, r: r + odr };
          if (!inBoard(s0.f, s0.r) || occ(s0.f, s0.r)) continue;
          if (!stepOpen(edges, from, s0, p)) continue;
          if (ray(s0)) return true;
        }
        break;
      }
    }
  }
  return false;
}

export function findConsul(state, player) {
  for (const key in state.pieces) {
    const p = state.pieces[key];
    if (p.owner === player && p.type === 'consul') {
      const [f, r] = key.split(',').map(Number);
      return { f, r };
    }
  }
  return null;
}

export function isCheck(state, player) {
  const c = findConsul(state, player);
  if (!c) return false;
  return squareAttacked(state.pieces, blockedEdges(state), other(player), c);
}

// ---------------------------------------------------------------- gate legality

function occupiedEdgeSet(state, exceptGateId) {
  const s = {};
  for (const g of state.gates) {
    if (!g.placed || g.id === exceptGateId) continue;
    for (const e of gateEdges(g.hinge, g.orientation)) s[e] = true;
  }
  return s;
}

function wardViolated(state, hinge, byOwner) {
  // hinge (x,y) touches squares (x-1,y-1)(x,y-1)(x-1,y)(x,y)
  const cells = [
    { f: hinge.x - 1, r: hinge.y - 1 }, { f: hinge.x, r: hinge.y - 1 },
    { f: hinge.x - 1, r: hinge.y }, { f: hinge.x, r: hinge.y },
  ];
  for (const c of cells) {
    const p = state.pieces[sq(c.f, c.r)];
    if (p && p.type === 'warden' && p.owner !== byOwner) return true;
  }
  return false;
}

// Sealing Rule: after hypothetical gate layout, each Consul must reach its target.
function sealed(state, hypotheticalGates) {
  const edges = new Array(98);
  for (const g of hypotheticalGates) {
    if (!g.placed) continue;
    for (const e of gateEdgeIds(g.hinge, g.orientation)) edges[e] = g;
  }
  for (const player of [P1, P2]) {
    const start = findConsul(state, player);
    if (!start) continue;
    const goal = targetSquare(player);
    const mover = { type: 'consul', owner: player };
    const seen = { [sq(start.f, start.r)]: true };
    const q = [start];
    let ok = false;
    while (q.length) {
      const cur = q.shift();
      if (cur.f === goal.f && cur.r === goal.r) { ok = true; break; }
      for (const [df, dr] of ORTH) {
        const n = { f: cur.f + df, r: cur.r + dr };
        if (!inBoard(n.f, n.r) || seen[sq(n.f, n.r)]) continue;
        if (!edgeOpenFor(edges, cur, n, mover)) continue;
        seen[sq(n.f, n.r)] = true;
        q.push(n);
      }
    }
    if (!ok) return true;
  }
  return false;
}

function canalViolated(state, hinge, orientation) {
  const canals = state.modules.canalLocks;
  if (!canals) return false;
  const es = gateEdges(hinge, orientation);
  return es.some((e) => canals.includes(e));
}

export function gateConfigKey(state) {
  return state.gates
    .filter((g) => g.placed)
    .map((g) => `${g.id}@${g.hinge.x},${g.hinge.y}${g.orientation}`)
    .sort()
    .join(';');
}

// Validate a gate placement/rotation for `player`. Returns null (ok) or reason string.
// Rotation may also be given a target orientation only (90° flip about same hinge).
function gateActionError(state, player, action, { koExempt = false } = {}) {
  const gate = state.gates.find((g) => g.id === action.gateId);
  if (!gate) return 'no such gate';

  if (action.type === 'place') {
    if (gate.placed) return 'gate already placed';
    if (gate.owner !== player) return 'not your gate';
    const { hinge, orientation } = action;
    if (!hinge || hinge.x < 1 || hinge.x > 6 || hinge.y < 1 || hinge.y > 6) return 'hinge off board';
    if (orientation !== 'h' && orientation !== 'v') return 'bad orientation';
    if (canalViolated(state, hinge, orientation)) return 'canal lock';
    const occ = occupiedEdgeSet(state, null);
    if (gateEdges(hinge, orientation).some((e) => occ[e])) return 'channel occupied';
    if (wardViolated(state, hinge, player)) return 'gate ward';
    const hypo = state.gates.map((g) => g.id === gate.id ? { ...g, placed: true, hinge, orientation } : g);
    if (sealed(state, hypo)) return 'sealing rule';
    return null;
  }

  if (action.type === 'rotate') {
    if (!gate.placed) return 'gate not on board';
    if (gate.owner !== player) {
      // enemy gate: requires Grand Square authority
      const gs = state.pieces[sq(GRAND_SQUARE.f, GRAND_SQUARE.r)];
      if (!gs || gs.owner !== player) return 'need grand square';
    }
    const orientation = gate.orientation === 'h' ? 'v' : 'h';
    if (canalViolated(state, gate.hinge, orientation)) return 'canal lock';
    const occ = occupiedEdgeSet(state, gate.id);
    if (gateEdges(gate.hinge, orientation).some((e) => occ[e])) return 'channel occupied';
    if (wardViolated(state, gate.hinge, player)) return 'gate ward';
    const hypo = state.gates.map((g) => g.id === gate.id ? { ...g, orientation } : g);
    if (sealed(state, hypo)) return 'sealing rule';
    if (!koExempt) {
      const key = state.gates
        .filter((g) => g.placed)
        .map((g) => `${g.id}@${g.hinge.x},${g.hinge.y}${g.id === gate.id ? orientation : g.orientation}`)
        .sort().join(';');
      if (key === state.koSnapshots[player]) return 'counter-rotation';
    }
    return null;
  }
  return 'bad gate action';
}

// ---------------------------------------------------------------- actions

function clone(state) { return JSON.parse(JSON.stringify(state)); }

// Lightweight hypothetical for legality checks: only pieces + gates matter to
// isCheck / pieceDests / attackedSquares. Never mutates the source.
function hypoApply(state, action) {
  const pieces = { ...state.pieces };
  let gates = state.gates;
  if (action.type === 'move') {
    const fromK = sq(action.from.f, action.from.r);
    const toK = sq(action.to.f, action.to.r);
    const piece = pieces[fromK];
    delete pieces[fromK];
    pieces[toK] = piece;
  } else if (action.type === 'exchange') {
    const aK = sq(action.from.f, action.from.r);
    const bK = sq(action.to.f, action.to.r);
    const t = pieces[aK]; pieces[aK] = pieces[bK]; pieces[bK] = t;
  } else if (action.type === 'place') {
    gates = state.gates.map((g) => g.id === action.gateId
      ? { ...g, placed: true, hinge: action.hinge, orientation: action.orientation } : g);
  } else if (action.type === 'rotate') {
    gates = state.gates.map((g) => g.id === action.gateId
      ? { ...g, orientation: g.orientation === 'h' ? 'v' : 'h' } : g);
  }
  return { pieces, gates };
}

function positionKey(state) {
  const ps = Object.keys(state.pieces).sort()
    .map((k) => `${k}:${state.pieces[k].owner}${state.pieces[k].type[0]}${state.pieces[k].type[1]}`).join(',');
  return `${ps}#${gateConfigKey(state)}#${state.toMove}#${state.charterAvailable ? 'C' : 'c'}`;
}

// Apply without legality checks other than structural; returns {state, captured, placedGate}
function rawApply(state, player, action) {
  const s = clone(state);
  let captured = false, placedGate = false;
  if (action.type === 'move') {
    const fromK = sq(action.from.f, action.from.r);
    const toK = sq(action.to.f, action.to.r);
    const piece = s.pieces[fromK];
    if (s.pieces[toK]) captured = true;
    delete s.pieces[fromK];
    s.pieces[toK] = piece;
  } else if (action.type === 'exchange') {
    const aK = sq(action.from.f, action.from.r);
    const bK = sq(action.to.f, action.to.r);
    const t = s.pieces[aK]; s.pieces[aK] = s.pieces[bK]; s.pieces[bK] = t;
  } else if (action.type === 'place') {
    const g = s.gates.find((x) => x.id === action.gateId);
    g.placed = true; g.hinge = action.hinge; g.orientation = action.orientation;
    placedGate = true;
  } else if (action.type === 'rotate') {
    const g = s.gates.find((x) => x.id === action.gateId);
    g.orientation = g.orientation === 'h' ? 'v' : 'h';
  }
  return { s, captured, placedGate };
}

// Structural + rules legality for a single action by `player` (no turn bookkeeping).
export function actionError(state, player, action, opts = {}) {
  if (state.status.phase !== 'playing') return 'game over';
  if (action.type === 'move') {
    const piece = state.pieces[sq(action.from.f, action.from.r)];
    if (!piece || piece.owner !== player) return 'no piece';
    const edges = blockedEdges(state);
    const dests = pieceDests(state, edges, action.from, piece);
    const hit = dests.find((m) => m.to.f === action.to.f && m.to.r === action.to.r &&
      ((m.via ? sq(m.via.f, m.via.r) : '') === (action.via ? sq(action.via.f, action.via.r) : '') ||
        dests.filter(d => d.to.f === m.to.f && d.to.r === m.to.r).length > 0 && !action.via));
    if (!hit) return 'illegal move';
  } else if (action.type === 'exchange') {
    const a = state.pieces[sq(action.from.f, action.from.r)];
    const b = state.pieces[sq(action.to.f, action.to.r)];
    if (!a || a.type !== 'envoy' || a.owner !== player) return 'not your envoy';
    if (!b || b.owner !== player) return 'not a friendly piece';
    const df = Math.abs(action.from.f - action.to.f), dr = Math.abs(action.from.r - action.to.r);
    if (df > 1 || dr > 1 || (df === 0 && dr === 0)) return 'not adjacent';
    const edges = blockedEdges(state);
    // Exchange may not cross a gated edge — checked for BOTH pieces' passage-less crossing.
    if (!stepOpen(edges, action.from, action.to, null)) return 'gated';
  } else if (action.type === 'place' || action.type === 'rotate') {
    const err = gateActionError(state, player, action, opts);
    if (err) return err;
  } else return 'unknown action';

  // never end in self-check (lightweight hypothetical — no full clone)
  if (isCheck(hypoApply(state, action), player)) return 'self check';

  // Consul may not enter an attacked square is subsumed by self-check.
  return null;
}

export function getLegalActions(state) {
  const player = state.toMove;
  const out = [];
  if (state.status.phase !== 'playing') return out;
  const edges = blockedEdges(state);
  for (const key in state.pieces) {
    const p = state.pieces[key];
    if (p.owner !== player) continue;
    const [f, r] = key.split(',').map(Number);
    const from = { f, r };
    for (const m of pieceDests(state, edges, from, p)) {
      const a = { type: 'move', from, to: m.to, ...(m.via ? { via: m.via } : {}) };
      if (!actionError(state, player, a)) out.push(a);
    }
    if (p.type === 'envoy') {
      for (const [df, dr] of ALL8) {
        const t = { f: f + df, r: r + dr };
        if (!inBoard(t.f, t.r)) continue;
        const a = { type: 'exchange', from, to: t };
        if (!actionError(state, player, a)) out.push(a);
      }
    }
  }
  for (const g of state.gates) {
    if (!g.placed && g.owner === player) {
      for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) for (const o of ['h', 'v']) {
        const a = { type: 'place', gateId: g.id, hinge: { x, y }, orientation: o };
        if (!actionError(state, player, a)) out.push(a);
      }
    }
    if (g.placed) {
      const a = { type: 'rotate', gateId: g.id };
      if (!actionError(state, player, a)) out.push(a);
    }
  }
  return out;
}

export function getLegalCharterActions(state) {
  // call on the state AFTER P2's main action, BEFORE endTurn bookkeeping:
  // engine exposes charter via applyAction({..., charter}) instead; helper for UI:
  if (!state.charterAvailable) return [];
  const out = [];
  for (const g of state.gates) {
    if (!g.placed && g.owner === P2) {
      for (let x = 1; x <= 6; x++) for (let y = 1; y <= 6; y++) for (const o of ['h', 'v']) {
        const a = { type: 'place', gateId: g.id, hinge: { x, y }, orientation: o };
        if (!actionError(state, P2, a, { koExempt: true })) out.push(a);
      }
    }
    if (g.placed) {
      const a = { type: 'rotate', gateId: g.id };
      if (!actionError(state, P2, a, { koExempt: true })) out.push(a);
    }
  }
  return out;
}

// ------------------------------------------------------------- apply + turn

export function applyAction(state, action) {
  const player = state.toMove;
  const err = actionError(state, player, action);
  if (err) throw new Error(`illegal action: ${err}`);

  // ko snapshot: gate config at the START of this player's turn
  const startConfig = gateConfigKey(state);

  let { s, captured, placedGate } = rawApply(state, player, action);
  s.log.push({ turn: state.turn, player, action });

  // Passage Victory — instant
  if (action.type === 'move') {
    const piece = s.pieces[sq(action.to.f, action.to.r)];
    const goal = targetSquare(player);
    if (piece.type === 'consul' && action.to.f === goal.f && action.to.r === goal.r) {
      s.status = { phase: 'ended', winner: player, reason: 'passage' };
      return s;
    }
  }

  // Charter attachment (Player 2 only, once)
  if (player === P2 && action.charter && s.charterAvailable && s.status.phase === 'playing') {
    const cErr = actionError(s, P2, action.charter, { koExempt: true });
    if (cErr) throw new Error(`illegal charter action: ${cErr}`);
    const r2 = rawApply(s, P2, action.charter);
    s = r2.s;
    if (r2.placedGate) placedGate = true;
    s.charterAvailable = false;
    s.log.push({ turn: state.turn, player, action: action.charter, charter: true });
  }

  // bookkeeping
  s.koSnapshots[player] = startConfig;
  s.deadCouncil = (captured || placedGate) ? 0 : s.deadCouncil + 1;
  s.toMove = other(player);
  s.turn += 1;

  // draws & mate detection
  const key = positionKey(s);
  s.repetition[key] = (s.repetition[key] || 0) + 1;
  if (s.repetition[key] >= 3) {
    s.status = { phase: 'ended', winner: null, reason: 'repetition' };
    return s;
  }
  if (s.deadCouncil >= s.modules.deadCouncilLimit) {
    s.status = { phase: 'ended', winner: null, reason: 'dead council' };
    return s;
  }
  const replies = getLegalActions(s);
  if (replies.length === 0) {
    if (isCheck(s, s.toMove)) s.status = { phase: 'ended', winner: player, reason: 'political' };
    else s.status = { phase: 'ended', winner: null, reason: 'deadlock' };
  }
  return s;
}

// ------------------------------------------------------------- serialization

export function serialize(state) { return JSON.stringify(state); }
export function deserialize(str) { return JSON.parse(str); }

export default {
  createGame, getLegalActions, getLegalCharterActions, applyAction, actionError,
  isCheck, attackedSquares, findConsul, targetSquare,
  gateEdges, gateConfigKey, edgeKey,
  serialize, deserialize,
  P1, P2, GRAND_SQUARE, HIGH_GATE, PIECES,
};