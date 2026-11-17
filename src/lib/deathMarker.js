// The death skull both maps draw over a dead enemy token (VTTCanvas for the
// DM, VTTViewer for players), kept in one place so the two cannot drift.
//
// The skull art is solid black, which vanishes on dark portraits, so it is
// drawn over a pale halo cut to its own outline. The haloed version is built
// once at full resolution and then only scaled. Crowded tokens collapse to
// small pins; those get the same skull at pin size, so a dead enemy still
// reads as dead without hovering it.

const SKULL_SRC = '/death-skull.png';
const HALO = 'rgba(242,230,200,0.95)'; // the parchment tone the map's labels use

let skullImg = null;     // HTMLImageElement once loaded
let haloSkull = null;    // canvas: skull over its halo
let failed = false;
let loading = false;
const waiting = new Set();

function buildHalo(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const pad = Math.round(Math.max(w, h) * 0.075);

  // The skull's silhouette in the halo colour.
  const sil = document.createElement('canvas');
  sil.width = w; sil.height = h;
  const s = sil.getContext('2d');
  s.drawImage(img, 0, 0);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = HALO;
  s.fillRect(0, 0, w, h);

  const out = document.createElement('canvas');
  out.width = w + pad * 2; out.height = h + pad * 2;
  const o = out.getContext('2d');
  // Stamp the silhouette in a ring to thicken it into an outline, with a soft
  // dark shadow outside it so the halo itself holds up on pale ground too.
  o.save();
  o.shadowColor = 'rgba(0,0,0,0.65)';
  o.shadowBlur = pad * 0.9;
  const steps = 24;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    o.drawImage(sil, pad + Math.cos(a) * pad * 0.8, pad + Math.sin(a) * pad * 0.8);
  }
  o.restore();
  o.drawImage(img, pad, pad);
  return out;
}

function load(onReady) {
  if (onReady) waiting.add(onReady);
  if (loading || skullImg || failed) return;
  loading = true;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    skullImg = img;
    try { haloSkull = buildHalo(img); } catch { haloSkull = null; }
    loading = false;
    waiting.forEach(fn => fn());
    waiting.clear();
  };
  img.onerror = () => { failed = true; loading = false; waiting.clear(); };
  img.src = SKULL_SRC;
}

function drawFallbackGlyph(ctx, x, y, size) {
  ctx.save();
  ctx.font = `bold ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.5, size * 0.16);
  ctx.strokeStyle = 'rgba(8,6,4,0.9)';
  ctx.strokeText('☠', x, y);
  ctx.fillStyle = '#e05a5a';
  ctx.fillText('☠', x, y);
  ctx.restore();
}

// Full-size token: the skull covers most of the portrait.
export function drawDeathMarker(ctx, x, y, r, onReady) {
  load(onReady);
  const art = haloSkull || skullImg;
  if (!art) { drawFallbackGlyph(ctx, x, y, r); return; }
  ctx.save();
  ctx.globalAlpha = 0.95;
  const size = r * 1.9;
  ctx.drawImage(art, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}

// Crowded pin: the same skull sized to sit over the small pin.
export function drawDeathPin(ctx, x, y, pr, onReady) {
  load(onReady);
  const art = haloSkull || skullImg;
  if (!art) { drawFallbackGlyph(ctx, x, y, pr * 2.2); return; }
  ctx.save();
  ctx.globalAlpha = 1;
  const size = pr * 3;
  ctx.drawImage(art, x - size / 2, y - size / 2, size, size);
  ctx.restore();
}
