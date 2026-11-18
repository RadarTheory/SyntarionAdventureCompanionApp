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

// A soft grid around one token: squares within its move glow (brightest near), the rest of the grid fades out with
// distance, and the edge of its reach is traced. center is the token's position (0-1).
export function drawLocalGrid(ctx, { grid, mapRect, center, range = MOVE_SQUARES, time: t = 0, color = GOLD }) {
  const g = gridOf(grid, mapRect), c = toPx(mapRect, center), home = cellIndex(g, c.x, c.y);
  const reach = range + 3, pulse = 0.85 + 0.15 * Math.sin(t * 2.2);
  ctx.save();
  ctx.beginPath(); ctx.rect(mapRect.x, mapRect.y, mapRect.w, mapRect.h); ctx.clip();
  for (let dj = -reach; dj <= reach; dj++) for (let di = -reach; di <= reach; di++) {
    const steps = Math.max(Math.abs(di), Math.abs(dj));
    const x = g.ox + (home.i + di) * g.cell, y = g.oy + (home.j + dj) * g.cell;
    const fade = Math.max(0, 1 - Math.hypot(di, dj) / (reach + 0.5));
    if (fade <= 0) continue;
    if (steps <= range) {
      ctx.fillStyle = rgba(color, (0.05 + 0.11 * (1 - steps / (range + 1))) * pulse);
      ctx.fillRect(x + 1, y + 1, g.cell - 2, g.cell - 2);
    }
    ctx.strokeStyle = rgba(color, 0.32 * fade);
    ctx.lineWidth = 0.8;
    ctx.strokeRect(x + 0.5, y + 0.5, g.cell - 1, g.cell - 1);
  }
  // The edge of a turn's move.
  ctx.strokeStyle = rgba(color, 0.65 * pulse);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(g.ox + (home.i - range) * g.cell, g.oy + (home.j - range) * g.cell, (range * 2 + 1) * g.cell, (range * 2 + 1) * g.cell);
  ctx.setLineDash([]);
  ctx.restore();
}

// A ruler from one point to another: the line, the square it lands on, and the distance. Beyond a turn's move it turns red.
export function drawRuler(ctx, { grid, mapRect, from, to, range = MOVE_SQUARES, scale = 1 }) {
  const g = gridOf(grid, mapRect), a = toPx(mapRect, from), b = toPx(mapRect, to);
  const n = squaresBetween(grid, mapRect, from, to), far = n > range;
  const col = far ? [224, 104, 90] : [236, 214, 150];
  const end = cellIndex(g, b.x, b.y);
  ctx.save();
  ctx.fillStyle = rgba(col, 0.22);
  ctx.fillRect(g.ox + end.i * g.cell, g.oy + end.j * g.cell, g.cell, g.cell);
  ctx.strokeStyle = rgba(col, 0.9); ctx.lineWidth = 2 / scale; ctx.setLineDash([6 / scale, 5 / scale]);
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.setLineDash([]);
  const text = distanceLabel(n) + (far ? ' · beyond a turn' : '');
  ctx.font = `${12 / scale}px Cinzel, Georgia, serif`;
  const w = ctx.measureText(text).width + 14 / scale, h = 20 / scale;
  const lx = b.x + 14 / scale, ly = b.y - h - 6 / scale;
  ctx.fillStyle = 'rgba(12,10,8,0.88)'; ctx.strokeStyle = rgba(col, 0.7); ctx.lineWidth = 1 / scale;
  ctx.beginPath(); ctx.roundRect(lx, ly, w, h, 4 / scale); ctx.fill(); ctx.stroke();
  ctx.fillStyle = rgba(col, 1); ctx.textBaseline = 'middle';
  ctx.fillText(text, lx + 7 / scale, ly + h / 2);
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
