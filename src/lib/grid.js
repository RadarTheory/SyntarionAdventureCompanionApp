// The map grid (user, 2026-11-17): one square is one fathom, 6 feet. Each map's grid is fitted to its art by the DM
// (Set grid: drag a box over one square's worth of the map) and saved with the map's ambience (map_ambience.grid).
// grid = { cell: square size as a share of the map's width, ox, oy: offset of the grid's origin, as shares of the map's
// width and height }. A map the DM has not fitted follows the Syntarion map standard (docs/MAP-STANDARD.md): one square
// is 100 pixels of the map image, starting at its top-left corner, so maps made to the standard need no setup.
// Shown only when it matters: a soft local grid fades in around the token being moved or inspected, its movement range
// glowing square by square, and a ruler reads the distance in fathoms and feet. The DM's Grid button shows it all.

export const SQUARE = { name: 'fathom', plural: 'fathoms', feet: 6 };
// Squares a character moves in a turn. A starting value for the table to settle.
export const MOVE_SQUARES = 5;
export const DEFAULT_CELL = 1 / 40;
// The Syntarion map standard: 100 pixels of map art per square (one fathom), grid starting at the image's top-left.
export const STANDARD_PX = 100;
// How big one square should look when a map opens at square scale: this many units of the map canvas (900 across).
export const SQUARE_ON_SCREEN = 42;

// The grid a map uses: the DM's fitted grid, or the standard read from the image's own width.
export function gridFor(saved, img) {
  if (saved?.cell) return saved;
  return img?.width ? { cell: STANDARD_PX / img.width, ox: 0, oy: 0, standard: true } : { cell: DEFAULT_CELL, ox: 0, oy: 0 };
}

// The zoom at which one square is SQUARE_ON_SCREEN across, centred on a point (0-1 of the map), for a canvas W x H.
export function squareScaleView(grid, mapRect, W, H, center = { x: 0.5, y: 0.5 }, limits = [0.3, 10]) {
  const cellPx = (Number(grid?.cell) || DEFAULT_CELL) * mapRect.w;
  const scale = Math.min(limits[1], Math.max(limits[0], SQUARE_ON_SCREEN / cellPx));
  const px = mapRect.x + center.x * mapRect.w, py = mapRect.y + center.y * mapRect.h;
  return { scale, x: W / 2 - px * scale, y: H / 2 - py * scale };
}

const GOLD = [200, 168, 74];
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

// The grid in canvas space for a map drawn at mapRect.
export function gridOf(grid, mapRect) {
  const cell = Math.max(4, (Number(grid?.cell) || DEFAULT_CELL) * mapRect.w);
  return { cell, ox: mapRect.x + (Number(grid?.ox) || 0) * mapRect.w, oy: mapRect.y + (Number(grid?.oy) || 0) * mapRect.h };
}
const cellIndex = (g, px, py) => ({ i: Math.floor((px - g.ox) / g.cell), j: Math.floor((py - g.oy) / g.cell) });
const toPx = (mapRect, p) => ({ x: mapRect.x + p.x * mapRect.w, y: mapRect.y + p.y * mapRect.h });

// Distance between two map points (0-1), in squares. A diagonal step counts as one square.
export function squaresBetween(grid, mapRect, a, b) {
  const g = gridOf(grid, mapRect), pa = toPx(mapRect, a), pb = toPx(mapRect, b);
  const ca = cellIndex(g, pa.x, pa.y), cb = cellIndex(g, pb.x, pb.y);
  return Math.max(Math.abs(ca.i - cb.i), Math.abs(ca.j - cb.j));
}
export const distanceLabel = n => `${n} ${n === 1 ? SQUARE.name : SQUARE.plural} · ${n * SQUARE.feet} ft`;

// Every square, faintly (the DM's Grid button, and while fitting the grid).
export function drawFullGrid(ctx, { grid, mapRect, strong = false }) {
  const g = gridOf(grid, mapRect);
  ctx.save();
  ctx.beginPath(); ctx.rect(mapRect.x, mapRect.y, mapRect.w, mapRect.h); ctx.clip();
  ctx.strokeStyle = rgba(GOLD, strong ? 0.5 : 0.18);
  ctx.lineWidth = strong ? 1 : 0.6;
  ctx.beginPath();
  const startX = g.ox - Math.ceil((g.ox - mapRect.x) / g.cell) * g.cell, startY = g.oy - Math.ceil((g.oy - mapRect.y) / g.cell) * g.cell;
  for (let x = startX; x <= mapRect.x + mapRect.w; x += g.cell) { ctx.moveTo(x, mapRect.y); ctx.lineTo(x, mapRect.y + mapRect.h); }
  for (let y = startY; y <= mapRect.y + mapRect.h; y += g.cell) { ctx.moveTo(mapRect.x, y); ctx.lineTo(mapRect.x + mapRect.w, y); }
  ctx.stroke();
  ctx.restore();
}

// A token's reach: the squares it can move to this turn, lit like a pool of light that ripples outward from it, square by
// square. A glowing runed border marks the limit; nothing is drawn beyond it, so the rest of the map stays clean.
export function drawLocalGrid(ctx, { grid, mapRect, center, range = MOVE_SQUARES, time: t = 0, color = GOLD }) {
  const g = gridOf(grid, mapRect), c = toPx(mapRect, center), home = cellIndex(g, c.x, c.y);
  const inset = Math.max(1, g.cell * 0.06), round = Math.min(6, g.cell * 0.18);
  ctx.save();
  ctx.beginPath(); ctx.rect(mapRect.x, mapRect.y, mapRect.w, mapRect.h); ctx.clip();

  // The pool: each square glows by how near it is, and a ripple travels outward from the token.
  ctx.globalCompositeOperation = 'lighter';
  for (let dj = -range; dj <= range; dj++) for (let di = -range; di <= range; di++) {
    const steps = Math.max(Math.abs(di), Math.abs(dj));
    const near = 1 - steps / (range + 1);
    const ripple = 0.5 + 0.5 * Math.sin(t * 2.4 - steps * 1.1);
    const a = 0.02 + 0.16 * near ** 1.6 + 0.08 * ripple * (0.3 + 0.7 * near);
    const x = g.ox + (home.i + di) * g.cell, y = g.oy + (home.j + dj) * g.cell;
    ctx.fillStyle = rgba(color, a);
    ctx.beginPath(); ctx.roundRect(x + inset, y + inset, g.cell - inset * 2, g.cell - inset * 2, round); ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  // Faint seams between the lit squares, so each one reads as a step.
  ctx.strokeStyle = rgba(color, 0.16);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  for (let k = -range; k <= range + 1; k++) {
    const x = g.ox + (home.i + k) * g.cell, y = g.oy + (home.j + k) * g.cell;
    ctx.moveTo(x, g.oy + (home.j - range) * g.cell); ctx.lineTo(x, g.oy + (home.j + range + 1) * g.cell);
    ctx.moveTo(g.ox + (home.i - range) * g.cell, y); ctx.lineTo(g.ox + (home.i + range + 1) * g.cell, y);
  }
  ctx.stroke();

  // The limit: a glowing double border with light running along it, and a rune at each corner and side.
  const L = g.ox + (home.i - range) * g.cell, T = g.oy + (home.j - range) * g.cell, S = (range * 2 + 1) * g.cell;
  ctx.shadowColor = rgba(color, 0.8); ctx.shadowBlur = 10;
  ctx.strokeStyle = rgba(color, 0.75); ctx.lineWidth = 1.4;
  ctx.strokeRect(L, T, S, S);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = rgba([255, 236, 180], 0.9); ctx.lineWidth = 1.6;
  ctx.setLineDash([g.cell * 0.5, g.cell * 1.5]); ctx.lineDashOffset = -t * g.cell * 1.2;
  ctx.strokeRect(L, T, S, S);
  ctx.setLineDash([]);
  ctx.strokeStyle = rgba(color, 0.3); ctx.lineWidth = 0.8;
  ctx.strokeRect(L + 3, T + 3, S - 6, S - 6);
  const rune = (x, y, r) => {
    ctx.fillStyle = 'rgba(14,11,8,0.9)'; ctx.strokeStyle = rgba([255, 236, 180], 0.95); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = rgba([255, 236, 180], 0.95); ctx.beginPath(); ctx.arc(x, y, r * 0.28, 0, Math.PI * 2); ctx.fill();
  };
  const rr = Math.max(3.5, Math.min(7, g.cell * 0.22));
  for (const [x, y] of [[L, T], [L + S, T], [L, T + S], [L + S, T + S], [L + S / 2, T], [L + S / 2, T + S], [L, T + S / 2], [L + S, T + S / 2]]) rune(x, y, rr);
  ctx.restore();
}

// The path of a move: a footstep for every square crossed, a marked landing square, and the distance. Nothing is shown
// until the token has actually moved. Beyond a turn's reach it turns red.
export function drawRuler(ctx, { grid, mapRect, from, to, range = MOVE_SQUARES, scale = 1 }) {
  const g = gridOf(grid, mapRect), a = toPx(mapRect, from), b = toPx(mapRect, to);
  const n = squaresBetween(grid, mapRect, from, to);
  if (n === 0) return;
  const far = n > range, col = far ? [224, 104, 90] : [255, 230, 165];
  const start = cellIndex(g, a.x, a.y), end = cellIndex(g, b.x, b.y);
  const centre = (i, j) => ({ x: g.ox + (i + 0.5) * g.cell, y: g.oy + (j + 0.5) * g.cell });
  ctx.save();

  // Footsteps: one glowing mark in each square along the way.
  for (let k = 1; k < n; k++) {
    const i = Math.round(start.i + ((end.i - start.i) * k) / n), j = Math.round(start.j + ((end.j - start.j) * k) / n);
    const p = centre(i, j), r = Math.max(2, g.cell * 0.09);
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
    glow.addColorStop(0, rgba(col, 0.55)); glow.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(col, 0.95); ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
  }

  // The landing square: lit, with corner brackets.
  const ex = g.ox + end.i * g.cell, ey = g.oy + end.j * g.cell, c = g.cell, k = c * 0.28;
  ctx.fillStyle = rgba(col, 0.2); ctx.fillRect(ex, ey, c, c);
  ctx.strokeStyle = rgba(col, 1); ctx.lineWidth = 2 / scale; ctx.shadowColor = rgba(col, 0.9); ctx.shadowBlur = 8;
  ctx.beginPath();
  for (const [x, y, dx, dy] of [[ex, ey, 1, 1], [ex + c, ey, -1, 1], [ex, ey + c, 1, -1], [ex + c, ey + c, -1, -1]]) {
    ctx.moveTo(x + dx * k, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * k);
  }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // The distance.
  const text = distanceLabel(n) + (far ? ' · beyond a turn' : '');
  ctx.font = `${12 / scale}px Cinzel, Georgia, serif`;
  const w = ctx.measureText(text).width + 16 / scale, h = 21 / scale;
  const lx = ex + c + 8 / scale, ly = ey - h / 2 + c / 2;
  ctx.fillStyle = 'rgba(12,10,8,0.9)'; ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 1 / scale;
  ctx.beginPath(); ctx.roundRect(lx, ly, w, h, h / 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rgba(col, 1); ctx.textBaseline = 'middle';
  ctx.fillText(text, lx + 8 / scale, ly + h / 2);
  ctx.restore();
}

// Fitting the grid: the box the DM dragged over one square becomes the map's square size and origin.
export function gridFromBox(a, b, mapRect) {
  const w = Math.abs(b.x - a.x), h = Math.abs(b.y - a.y) * (mapRect.h / mapRect.w);
  const cell = Math.max(0.004, (w + h) / 2);
  const left = Math.min(a.x, b.x), top = Math.min(a.y, b.y), cellH = cell * (mapRect.w / mapRect.h);
  const mod = (v, m) => ((v % m) + m) % m;
  return { cell, ox: mod(left, cell), oy: mod(top, cellH) };
}

// The centre of the square a point (0-1) falls in, as a point (0-1): where a moved token settles.
export function snapToSquare(grid, mapRect, p) {
  if (!p || !mapRect?.w) return p;
  const g = gridOf(grid, mapRect), px = toPx(mapRect, p), c = cellIndex(g, px.x, px.y);
  const cx = g.ox + (c.i + 0.5) * g.cell, cy = g.oy + (c.j + 0.5) * g.cell;
  return { x: Math.min(1, Math.max(0, (cx - mapRect.x) / mapRect.w)), y: Math.min(1, Math.max(0, (cy - mapRect.y) / mapRect.h)) };
}
