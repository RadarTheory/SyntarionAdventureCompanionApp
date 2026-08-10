import { useMemo, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS, ALL_CLASSES, getRaceDisplay } from './constants';

const TOKEN_SIZE = 512;

// ── Palette + color helpers ──────────────────────────────────────────────────
const clamp01 = (n) => Math.min(1, Math.max(0, n));

function hsl(h, s, l, a = 1) {
  const hue = ((h % 360) + 360) % 360;
  return `hsla(${Math.round(hue)}, ${Math.round(clamp01(s) * 100)}%, ${Math.round(clamp01(l) * 100)}%, ${a})`;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}

function hueDelta(a, b) {
  const d = Math.abs(((a - b) % 360 + 360) % 360);
  return d > 180 ? 360 - d : d;
}

function hueName(h) {
  const hue = ((h % 360) + 360) % 360;
  const table = [[16, 'Crimson'], [45, 'Ember'], [68, 'Amber'], [90, 'Golden'],
    [160, 'Verdant'], [200, 'Aether'], [250, 'Azure'], [292, 'Violet'], [335, 'Rose'], [361, 'Crimson']];
  for (const [max, name] of table) if (hue < max) return name;
  return 'Crimson';
}

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Read the portrait's prominent colors so tokens can be tinted from the photo.
// Returns { dominant, accents } in HSL, or null if the image can't be sampled.
function samplePalette(image) {
  const size = 44;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(image, 0, 0, size, size);
  let pixels;
  try { pixels = ctx.getImageData(0, 0, size, size).data; }
  catch { return null; } // cross-origin taint — fall back to archetype colors
  const buckets = new Map();
  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const [h, s, l] = rgbToHsl(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (l < 0.08 || l > 0.94) continue; // skip near-black / near-white
    const key = `${Math.round(h / 22)}-${Math.round(s * 4)}`;
    const bucket = buckets.get(key) || { h: 0, s: 0, l: 0, count: 0, w: 0 };
    const weight = 0.25 + s; // bias toward vivid colors
    bucket.h += h * weight; bucket.s += s; bucket.l += l; bucket.count++; bucket.w += weight;
    buckets.set(key, bucket);
  }
  const list = [...buckets.values()]
    .filter(b => b.count > 1)
    .map(b => ({ h: b.h / b.w, s: b.s / b.count, l: b.l / b.count, count: b.count }));
  if (!list.length) return null;
  const dominant = [...list].sort((a, b) => b.count - a.count)[0];
  const accents = [...list].sort((a, b) => (b.s * b.count) - (a.s * a.count));
  return { dominant, accents };
}

// Build three distinct frame styles for one batch. Derived from the portrait
// palette when available; each call re-shuffles + jitters the hues so pressing
// "Regenerate Batch" always yields fresh options.
function buildStyles(palette) {
  const suffixes = ['Standee', 'Sigil', 'Mark'];
  const jitter = Math.random() * 26 - 13;
  let hues;
  let baseL = 0.13;
  if (palette && palette.accents.length) {
    const primary = palette.accents[0];
    const secondary = palette.accents.find(c => hueDelta(c.h, primary.h) > 35) || primary;
    hues = [primary.h, primary.h + 180, secondary.h].map(h => h + jitter); // photo hue, its complement, a second accent
    baseL = clamp01(palette.dominant.l * 0.6 + 0.05);
  } else {
    const start = Math.random() * 360; // no portrait: still rotate hues each batch
    hues = [start, start + 42, start + 200];
  }
  const order = shuffled([0, 1, 2]);
  return order.map((hueIdx, i) => {
    const h = hues[hueIdx];
    return {
      id: `${suffixes[i]}-${Math.round(((h % 360) + 360) % 360)}-${Date.now()}-${i}`,
      name: `${hueName(h)} ${suffixes[i]}`,
      variant: i,
      accent: hsl(h, 0.6, 0.62),
      glow: hsl(h, 0.72, 0.55, 0.42),
      tint: hsl(h, 0.55, 0.6, 0.07),
      background: [hsl(h, 0.42, Math.max(0.05, baseL - 0.05)), hsl(h, 0.5, Math.min(0.3, baseL + 0.1))],
    };
  });
}

function fullName(char) {
  return char?.name || `${char?.fn || ''} ${char?.ln || ''}`.trim() || 'Adventurer';
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawDiamond(ctx, cx, cy, r, color, width = 4) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.restore();
}

function drawPortrait(ctx, image, tintCss) {
  const cx = TOKEN_SIZE / 2;
  const cy = TOKEN_SIZE / 2;
  const radius = TOKEN_SIZE * 0.34;
  const sourceRatio = image.width / image.height;
  let sx = 0;
  let sy = 0;
  let sw = image.width;
  let sh = image.height;
  if (sourceRatio > 1) {
    sw = image.height;
    sx = (image.width - sw) / 2;
  } else {
    sh = image.width;
    sy = Math.max(0, (image.height - sh) * 0.22);
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy - 10, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(image, sx, sy, sw, sh, cx - radius, cy - radius - 10, radius * 2, radius * 2);
  ctx.restore();

  // Subtle wash in the frame's accent hue so the portrait reads as part of the token.
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = tintCss;
  ctx.fillRect(0, 0, TOKEN_SIZE, TOKEN_SIZE);
  ctx.restore();
}

function drawCornerTicks(ctx, color) {
  const c = TOKEN_SIZE / 2;
  const r = TOKEN_SIZE * 0.4;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.85;
  for (const a of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
    const x = c + Math.cos(a) * r;
    const y = c - 10 + Math.sin(a) * r;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * 10, y - Math.sin(a) * 10);
    ctx.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawInitials(ctx, char, style) {
  const initials = fullName(char).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'S';
  ctx.save();
  ctx.beginPath();
  ctx.arc(TOKEN_SIZE / 2, TOKEN_SIZE / 2 - 10, TOKEN_SIZE * 0.32, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(240,238,235,0.08)';
  ctx.fill();
  ctx.strokeStyle = style.accent;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.font = '700 116px Cinzel, Georgia, serif';
  ctx.fillStyle = '#f5ead4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, TOKEN_SIZE / 2, TOKEN_SIZE / 2 - 10);
  ctx.restore();
}

function renderToken({ char, image, style }) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = TOKEN_SIZE;
    canvas.height = TOKEN_SIZE;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(TOKEN_SIZE / 2, TOKEN_SIZE / 2, 30, TOKEN_SIZE / 2, TOKEN_SIZE / 2, TOKEN_SIZE * 0.56);
    grad.addColorStop(0, style.background[1]);
    grad.addColorStop(1, style.background[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TOKEN_SIZE, TOKEN_SIZE);

    // Variant 1 (Sigil): diamond aura behind the portrait.
    if (style.variant === 1) {
      ctx.save();
      ctx.shadowColor = style.glow;
      ctx.shadowBlur = 34;
      drawDiamond(ctx, TOKEN_SIZE / 2, TOKEN_SIZE / 2 + 6, TOKEN_SIZE * 0.3, style.accent, 5);
      ctx.restore();
    }

    if (image) drawPortrait(ctx, image, style.tint);
    else drawInitials(ctx, char, style);

    // Outer double ring — thicker on the Standee variant.
    ctx.save();
    ctx.beginPath();
    ctx.arc(TOKEN_SIZE / 2, TOKEN_SIZE / 2 - 10, TOKEN_SIZE * 0.355, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(10,8,6,0.9)';
    ctx.lineWidth = style.variant === 0 ? 22 : 18;
    ctx.stroke();
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = style.variant === 0 ? 9 : 7;
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

    // Variant 2 (Mark): thin inner ring + corner ticks.
    if (style.variant === 2) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(TOKEN_SIZE / 2, TOKEN_SIZE / 2 - 10, TOKEN_SIZE * 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = style.accent;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      drawCornerTicks(ctx, style.accent);
    }

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(TOKEN_SIZE / 2, TOKEN_SIZE * 0.78, TOKEN_SIZE * 0.24, TOKEN_SIZE * 0.055, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = '700 22px Cinzel, Georgia, serif';
    ctx.fillStyle = '#f3ead8';
    ctx.textAlign = 'center';
    ctx.fillText(fullName(char).slice(0, 22).toUpperCase(), TOKEN_SIZE / 2, TOKEN_SIZE * 0.91);
    ctx.restore();

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      resolve({ id: style.id, styleId: style.id, styleName: style.name, url, blob });
    }, 'image/png');
  });
}

async function uploadToken(charId, draft) {
  const path = `sprites/${charId || crypto.randomUUID()}-${draft.styleId}-${Date.now()}.png`;
  const { error } = await supabase.storage.from('portraits').upload(path, draft.blob, { upsert: true, contentType: 'image/png' });
  if (error) throw error;
  const { data } = supabase.storage.from('portraits').getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export default function CharacterTokenForge({ char, portraitUrl, drafts, setDrafts, selectedUrl, setSelectedUrl, generationCount, setGenerationCount, onSelectedUrl }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const raceName = useMemo(() => getRaceDisplay(char?.race, char?.rv, char?.pmV) || 'adventurer', [char]);
  const className = useMemo(() => ALL_CLASSES.find(c => c.id === char?.cid)?.name || 'wanderer', [char]);

  const generate = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      // Load the portrait once, read its colors, then press three frames from them.
      let image = null;
      let palette = null;
      if (portraitUrl) {
        try {
          image = await loadImage(portraitUrl);
          palette = samplePalette(image);
        } catch {
          image = null;
        }
      }
      const styles = buildStyles(palette);
      const next = await Promise.all(styles.map(style => renderToken({ char, image, style })));
      setDrafts(next);
      setGenerationCount(generationCount + 1);
    } catch (err) {
      console.error('Token generation failed:', err);
      setError('The token press jammed. Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const approve = async (draft) => {
    if (savingId) return;
    setSavingId(draft.id);
    setError('');
    try {
      const url = await uploadToken(char?.id, draft);
      setSelectedUrl(url);
      await onSelectedUrl?.(url);
      setOpen(false);
    } catch (err) {
      console.error('Token upload failed:', err);
      setError('The token could not be sealed into the archive.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ background: 'rgba(17,13,10,0.72)', border: `1px solid ${selectedUrl ? 'rgba(87,170,102,0.5)' : COLORS.borderMid}`, borderRadius: 4, padding: 16, display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 58, height: 58, borderRadius: '50%', background: selectedUrl ? `url(${selectedUrl}) center/cover` : 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {!selectedUrl && <img src="/scribe/scribeicon.png" alt="The Scribe" style={{ width: '78%', height: '78%', objectFit: 'contain' }} />}
        </div>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.text, marginBottom: 5 }}>Character Token</div>
          <div style={{ fontSize: 11, lineHeight: 1.6, color: COLORS.textSub, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            {selectedUrl ? 'The Scribe has sealed this token for the VTT.' : `The Scribe can press ${fullName(char)} into a ${raceName} ${className} table token.`}
          </div>
          <div style={{ marginTop: 5, fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{generationCount > 0 ? `${generationCount} batch${generationCount === 1 ? '' : 'es'} pressed · regenerate anytime` : 'Frames are drawn from your portrait'}</div>
        </div>
        <button type="button" onClick={() => setOpen(true)} style={{ background: selectedUrl ? 'rgba(87,170,102,0.12)' : COLORS.deityBg, border: `1px solid ${selectedUrl ? 'rgba(87,170,102,0.5)' : COLORS.deity}`, borderRadius: 3, padding: '9px 14px', color: selectedUrl ? '#80d58f' : COLORS.deityText, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>{selectedUrl ? 'Review' : 'Ask Scribe'}</button>
      </div>

      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 390000, background: 'rgba(5,4,3,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
          <div style={{ width: 'min(720px, 100%)', maxHeight: '92vh', overflowY: 'auto', background: '#14100d', border: '1px solid rgba(200,168,74,0.45)', borderRadius: 10, boxShadow: '0 24px 80px rgba(0,0,0,0.55)', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <img src="/scribe/scribeicon.png" alt="The Scribe" style={{ width: 64, height: 64, objectFit: 'contain' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Cinzel', serif", color: COLORS.text, fontWeight: 700, fontSize: 14, letterSpacing: '0.12em', textTransform: 'uppercase' }}>The Scribe</div>
                <div style={{ color: COLORS.textSub, fontSize: 12, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6 }}>What should your character token look like? I can press a few table-ready drafts from your portrait, then you choose the one that follows you into the VTT.</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: COLORS.dim, fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>x</button>
            </div>

            <div style={{ padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 4, background: 'rgba(255,255,255,0.035)', color: COLORS.textSub, fontSize: 11, lineHeight: 1.6, fontFamily: 'Georgia, serif', marginBottom: 14 }}>Each frame is tinted from your portrait's own colors. Press <em>Regenerate Batch</em> as often as you like — every batch offers fresh options. Approving a token saves it with this submission.</div>
            {error && <div style={{ marginBottom: 12, color: COLORS.warn, fontSize: 11, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
              {drafts?.length ? drafts.map(draft => (
                <button key={draft.id} type="button" onClick={() => approve(draft)} disabled={!!savingId} style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 10, cursor: savingId ? 'default' : 'pointer', color: COLORS.text, textAlign: 'center' }}>
                  <img src={draft.url} alt={draft.styleName} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'contain', borderRadius: 5, background: '#080604', display: 'block', marginBottom: 8 }} />
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{savingId === draft.id ? 'Sealing...' : draft.styleName}</div>
                </button>
              )) : (
                <div style={{ gridColumn: '1 / -1', border: `1px dashed ${COLORS.border}`, borderRadius: 5, padding: 20, textAlign: 'center', color: COLORS.dim, fontSize: 11, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No drafts pressed yet.</div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={generate} disabled={busy} style={{ background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 3, padding: '10px 16px', color: COLORS.deityText, cursor: busy ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>{busy ? 'Pressing Tokens...' : drafts?.length ? 'Regenerate Batch' : 'Generate Drafts'}</button>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '10px 16px', color: COLORS.muted, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
