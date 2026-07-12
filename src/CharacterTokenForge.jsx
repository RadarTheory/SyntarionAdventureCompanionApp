import { useMemo, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS, ALL_CLASSES, RACES, getRaceDisplay } from './constants';

const TOKEN_SIZE = 512;
const MAX_BATCHES = 2;

const TOKEN_STYLES = [
  { id: 'gilded', name: 'Gilded Standee', accent: '#d8bc5f', glow: 'rgba(216,188,95,0.42)', background: ['#1a130c', '#3b2d16'] },
  { id: 'aether', name: 'Aether Sigil', accent: '#72c6d9', glow: 'rgba(114,198,217,0.38)', background: ['#07151a', '#163441'] },
  { id: 'ember', name: 'Ember Mark', accent: '#d7734b', glow: 'rgba(215,115,75,0.36)', background: ['#1a0d0a', '#3d1812'] },
];

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

function drawPortrait(ctx, image, style, seed) {
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

  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = seed % 2 ? 'rgba(255,241,205,0.08)' : 'rgba(120,210,255,0.08)';
  ctx.fillRect(0, 0, TOKEN_SIZE, TOKEN_SIZE);
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

function renderToken({ char, portraitUrl, style, index }) {
  return new Promise(async (resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = TOKEN_SIZE;
    canvas.height = TOKEN_SIZE;
    const ctx = canvas.getContext('2d');
    const seed = (char?.id || char?.name || '').split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) + index;

    const grad = ctx.createRadialGradient(TOKEN_SIZE / 2, TOKEN_SIZE / 2, 30, TOKEN_SIZE / 2, TOKEN_SIZE / 2, TOKEN_SIZE * 0.56);
    grad.addColorStop(0, style.background[1]);
    grad.addColorStop(1, style.background[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, TOKEN_SIZE, TOKEN_SIZE);

    ctx.save();
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 34;
    drawDiamond(ctx, TOKEN_SIZE / 2, TOKEN_SIZE / 2 + 6, TOKEN_SIZE * 0.3, style.accent, 5);
    ctx.restore();

    try {
      if (!portraitUrl) throw new Error('No portrait');
      const image = await loadImage(portraitUrl);
      drawPortrait(ctx, image, style, seed);
    } catch {
      drawInitials(ctx, char, style);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(TOKEN_SIZE / 2, TOKEN_SIZE / 2 - 10, TOKEN_SIZE * 0.355, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(10,8,6,0.9)';
    ctx.lineWidth = 18;
    ctx.stroke();
    ctx.strokeStyle = style.accent;
    ctx.lineWidth = 7;
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = 16;
    ctx.stroke();
    ctx.restore();

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
      resolve({ id: `${Date.now()}-${style.id}`, styleId: style.id, styleName: style.name, url, blob });
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
  const remaining = Math.max(0, MAX_BATCHES - generationCount);
  const raceName = useMemo(() => getRaceDisplay(char?.race, char?.rv, char?.pmV) || 'adventurer', [char]);
  const className = useMemo(() => ALL_CLASSES.find(c => c.id === char?.cid)?.name || 'wanderer', [char]);
  const raceLean = useMemo(() => RACES.find(r => r.id === char?.race)?.lean || 0, [char]);

  const generate = async () => {
    if (busy || remaining <= 0) return;
    setBusy(true);
    setError('');
    try {
      const orderedStyles = raceLean > 1
        ? [TOKEN_STYLES[1], TOKEN_STYLES[0], TOKEN_STYLES[2]]
        : raceLean < -1
          ? [TOKEN_STYLES[0], TOKEN_STYLES[2], TOKEN_STYLES[1]]
          : TOKEN_STYLES;
      const next = await Promise.all(orderedStyles.map((style, i) => renderToken({ char, portraitUrl, style, index: i })));
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
          <div style={{ marginTop: 5, fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{remaining} generation batch{remaining === 1 ? '' : 'es'} remaining</div>
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

            <div style={{ padding: '10px 12px', border: `1px solid ${COLORS.border}`, borderRadius: 4, background: 'rgba(255,255,255,0.035)', color: COLORS.textSub, fontSize: 11, lineHeight: 1.6, fontFamily: 'Georgia, serif', marginBottom: 14 }}>Current guardrail: {MAX_BATCHES} total batches per character draft. Once you approve a token, it is saved with this submission.</div>
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
              <button type="button" onClick={generate} disabled={busy || remaining <= 0} style={{ background: remaining <= 0 ? 'rgba(255,255,255,0.04)' : COLORS.deityBg, border: `1px solid ${remaining <= 0 ? COLORS.border : COLORS.deity}`, borderRadius: 3, padding: '10px 16px', color: remaining <= 0 ? COLORS.dim : COLORS.deityText, cursor: busy || remaining <= 0 ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, opacity: busy ? 0.7 : 1 }}>{busy ? 'Pressing Tokens...' : drafts?.length ? 'Regenerate Batch' : 'Generate Drafts'}</button>
              <button type="button" onClick={() => setOpen(false)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 3, padding: '10px 16px', color: COLORS.muted, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
