import { useRef, useState, useEffect, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

const FRAME_W = 300;
const FRAME_H = 400; // 3:4
const OUTPUT_W = 600;
const OUTPUT_H = 800;

function CropModal({ file, onCancel, onConfirm }) {
  const imgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, startOffset: { x: 0, y: 0 } });
  const [imgUrl, setImgUrl] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const baseScale = naturalSize.w > 0
    ? Math.max(FRAME_W / naturalSize.w, FRAME_H / naturalSize.h)
    : 1;
  const scale = baseScale * zoom;
  const dispW = naturalSize.w * scale;
  const dispH = naturalSize.h * scale;

  const clampOffset = useCallback((ox, oy, w, h) => {
    const maxX = Math.max(0, (w - FRAME_W) / 2);
    const maxY = Math.max(0, (h - FRAME_H) / 2);
    return { x: Math.min(maxX, Math.max(-maxX, ox)), y: Math.min(maxY, Math.max(-maxY, oy)) };
  }, []);

  useEffect(() => {
    setOffset(prev => clampOffset(prev.x, prev.y, dispW, dispH));
  }, [zoom, dispW, dispH, clampOffset]);

  const onImgLoad = (e) => {
    setNaturalSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
    setImgLoaded(true);
  };

  const startDrag = (clientX, clientY) => {
    dragRef.current = { dragging: true, startX: clientX, startY: clientY, startOffset: { ...offset } };
  };
  const moveDrag = (clientX, clientY) => {
    if (!dragRef.current.dragging) return;
    const dx = clientX - dragRef.current.startX;
    const dy = clientY - dragRef.current.startY;
    const next = clampOffset(dragRef.current.startOffset.x + dx, dragRef.current.startOffset.y + dy, dispW, dispH);
    setOffset(next);
  };
  const endDrag = () => { dragRef.current.dragging = false; };

  useEffect(() => {
    const onMove = (e) => { const p = e.touches ? e.touches[0] : e; moveDrag(p.clientX, p.clientY); };
    const onUp = () => endDrag();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dispW, dispH]);

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    const ctx = canvas.getContext('2d');
    const outScale = scale * (OUTPUT_W / FRAME_W);
    const drawW = naturalSize.w * outScale;
    const drawH = naturalSize.h * outScale;
    const drawX = OUTPUT_W / 2 - drawW / 2 + offset.x * (OUTPUT_W / FRAME_W);
    const drawY = OUTPUT_H / 2 - drawH / 2 + offset.y * (OUTPUT_H / FRAME_H);
    ctx.drawImage(imgRef.current, drawX, drawY, drawW, drawH);
    canvas.toBlob(blob => onConfirm(blob), 'image/jpeg', 0.9);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 400000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#120e0a', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, width: '100%', maxWidth: 380 }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: COLORS.text, letterSpacing: '0.1em', marginBottom: 14, textAlign: 'center' }}>POSITION PORTRAIT</div>

        <div
          style={{ position: 'relative', width: FRAME_W, height: FRAME_H, margin: '0 auto', overflow: 'hidden', borderRadius: 8, border: `1px solid ${COLORS.border}`, cursor: 'grab', background: '#000', touchAction: 'none' }}
          onMouseDown={e => startDrag(e.clientX, e.clientY)}
          onTouchStart={e => { const p = e.touches[0]; startDrag(p.clientX, p.clientY); }}
        >
          {imgUrl && (
            <img
              ref={imgRef}
              src={imgUrl}
              onLoad={onImgLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: '50%', top: '50%',
                width: dispW, height: dispH,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                userSelect: 'none', pointerEvents: 'none',
                opacity: imgLoaded ? 1 : 0,
              }}
            />
          )}

          {/* Rule-of-thirds + eye-level guide overlay */}
          <svg width={FRAME_W} height={FRAME_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <line x1={FRAME_W / 3} y1={0} x2={FRAME_W / 3} y2={FRAME_H} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            <line x1={(FRAME_W / 3) * 2} y1={0} x2={(FRAME_W / 3) * 2} y2={FRAME_H} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
            <line x1={0} y1={FRAME_H / 3} x2={FRAME_W} y2={FRAME_H / 3} stroke="rgba(200,168,74,0.7)" strokeWidth="1.5" strokeDasharray="5,3" />
            <line x1={0} y1={(FRAME_H / 3) * 2} x2={FRAME_W} y2={(FRAME_H / 3) * 2} stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
          </svg>
        </div>

        <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 8 }}>
          Align eyes with the gold line · drag to reposition
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16 }}>
          <span style={{ fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>ZOOM</span>
          <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={e => setZoom(Number(e.target.value))} style={{ flex: 1 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={onCancel} style={{ flex: 1, background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.dim }}>Cancel</button>
          <button onClick={handleConfirm} disabled={!imgLoaded} style={{ flex: 2, background: 'rgba(200,168,74,0.16)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 7, padding: '9px', cursor: imgLoaded ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: '#e8c84a', fontWeight: 700 }}>✓ Set Portrait</button>
        </div>
      </div>
    </div>
  );
}

export default function PortraitUpload({ currentUrl, onUploaded, size = 96 }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [fetchingCurrent, setFetchingCurrent] = useState(false);

  const handlePick = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    e.target.value = '';
  };

  const handleEditCurrent = async () => {
    if (!currentUrl || fetchingCurrent) return;
    setFetchingCurrent(true);
    try {
      const res = await fetch(currentUrl);
      const blob = await res.blob();
      const file = new File([blob], 'current-portrait.jpg', { type: blob.type || 'image/jpeg' });
      setPendingFile(file);
    } catch (err) {
      console.error('Failed to load current portrait for editing:', err);
    }
    setFetchingCurrent(false);
  };

  const handleCropConfirm = async (blob) => {
    setPendingFile(null);
    setUploading(true);
    const ext = pendingFile?.name?.split('.').pop() || 'jpg';
    const baseName = pendingFile?.name
      ? pendingFile.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_')
      : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const path = `${baseName}.${ext}`;
    const { error } = await supabase.storage.from('portraits').upload(path, blob, { upsert: true, contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}` });
    if (error) { console.error('Portrait upload failed:', error); setUploading(false); return; }
    const { data } = supabase.storage.from('portraits').getPublicUrl(path);
    onUploaded(data.publicUrl);
    setUploading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div onClick={() => fileRef.current?.click()} style={{
        width: size, height: size * (4 / 3), borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
        background: currentUrl ? `url(${currentUrl}) center/cover` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", textAlign: 'center', flexShrink: 0,
      }}>
        {!currentUrl && (uploading ? 'Uploading…' : '+ Portrait')}
      </div>
     <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.avif,image/*" onChange={handlePick} style={{ display: 'none' }} />
      {currentUrl && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>
            {uploading ? 'Uploading…' : 'Replace'}
          </button>
          <button onClick={handleEditCurrent} disabled={uploading || fetchingCurrent}
            style={{ background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontSize: 9, color: '#e8c84a', fontFamily: "'Cinzel', serif" }}>
            {fetchingCurrent ? 'Loading…' : '✎ Adjust'}
          </button>
        </div>
      )}

      {pendingFile && (
        <CropModal file={pendingFile} onCancel={() => setPendingFile(null)} onConfirm={handleCropConfirm} />
      )}
    </div>
  );
}