import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;

function drawViewer({ canvas, mapImg, fogZones, tokens, transform }) {
  if (!canvas || !mapImg) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
  ctx.drawImage(mapImg, 0, 0, W, H);

  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = W; fogCanvas.height = H;
  const fogCtx = fogCanvas.getContext('2d');
  fogCtx.fillStyle = 'rgba(10,8,6,0.85)';
  fogCtx.fillRect(0, 0, W, H);
  fogCtx.globalCompositeOperation = 'destination-out';
  fogZones.forEach(zone => {
    if (zone.type === 'reveal') {
      const cx = zone.x * W, cy = zone.y * H, r = zone.r * W;
      const feather = zone.feather ?? 0.3;
      const grad = fogCtx.createRadialGradient(cx, cy, r * (1 - feather), cx, cy, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      fogCtx.beginPath();
      fogCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fogCtx.fillStyle = grad;
      fogCtx.fill();
    }
  });
  fogCtx.globalCompositeOperation = 'source-over';
  fogCtx.fillStyle = 'rgba(10,8,6,0.85)';
  fogZones.forEach(zone => {
    if (zone.type === 'hide') {
      fogCtx.beginPath();
      fogCtx.arc(zone.x * W, zone.y * H, zone.r * W, 0, Math.PI * 2);
      fogCtx.fill();
    }
  });
  ctx.drawImage(fogCanvas, 0, 0);

  tokens.forEach(tok => {
    const tx = tok.x * W, ty = tok.y * H, r = 14;
    ctx.save();
    if (tok.type === 'player') { ctx.beginPath(); ctx.roundRect(tx - r, ty - r, r * 2, r * 2, 4); }
    else { ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); }
    ctx.fillStyle = tok.color || '#e85d4a';
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((tok.label || '?').slice(0, 3), tx, ty);
    ctx.restore();
  });

  ctx.restore();
}

export default function VTTViewer({ campaignId }) {
  const canvasRef = useRef(null);
  const mapImgRef = useRef(null);
  const panRef    = useRef({ panning: false, lastX: 0, lastY: 0 });
  const pinchRef  = useRef({ active: false, lastDist: 0 });

  const [transform, setTransform]     = useState({ scale: 1, x: 0, y: 0 });
  const [fogZones, setFogZones]       = useState([]);
  const [tokens, setTokens]           = useState([]);
  const [mapFilename, setMapFilename] = useState(null);
  const [mapLoaded, setMapLoaded]     = useState(false);
  const [fullscreen, setFullscreen]   = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    loadSession();
    const sub = supabase
      .channel(`vtt-viewer-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vtt_sessions', filter: `campaign_id=eq.${campaignId}` }, () => loadSession())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  const loadSession = async () => {
    const { data } = await supabase.from('vtt_sessions').select('*').eq('campaign_id', campaignId).maybeSingle();
    if (data) {
      setFogZones(data.fog_zones || []);
      setTokens(data.tokens || []);
      setMapFilename(data.map_filename);
      if (data.view_transform) setTransform(data.view_transform);
    }
  };

  useEffect(() => {
    if (!mapFilename) return;
    setMapLoaded(false);
    const img = new Image();
    img.onload = () => { mapImgRef.current = img; setMapLoaded(true); };
    img.src = `/Maps/${encodeURIComponent(mapFilename)}`;
  }, [mapFilename]);

  useEffect(() => {
    if (!mapLoaded) return;
    drawViewer({ canvas: canvasRef.current, mapImg: mapImgRef.current, fogZones, tokens, transform });
  }, [fogZones, tokens, mapLoaded, transform]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleRatio;
    const mouseY = (e.clientY - rect.top) * scaleRatio;
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setTransform(prev => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));
      return { scale: newScale, x: mouseX - (mouseX - prev.x) * (newScale / prev.scale), y: mouseY - (mouseY - prev.y) * (newScale / prev.scale) };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapLoaded) return;
    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [mapLoaded, handleWheel]);

  const handleMouseDown = useCallback((e) => {
    panRef.current = { panning: true, lastX: e.clientX, lastY: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!panRef.current.panning) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;
    const dx = (e.clientX - panRef.current.lastX) * scaleRatio;
    const dy = (e.clientY - panRef.current.lastY) * scaleRatio;
    panRef.current.lastX = e.clientX;
    panRef.current.lastY = e.clientY;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const handleMouseUp = useCallback(() => { panRef.current.panning = false; }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { active: true, lastDist: Math.sqrt(dx * dx + dy * dy) };
    } else {
      panRef.current = { panning: true, lastX: e.touches[0].clientX, lastY: e.touches[0].clientY };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchRef.current.active) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = dist / pinchRef.current.lastDist;
      pinchRef.current.lastDist = dist;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleRatio = canvas.width / rect.width;
      const midX = ((e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left) * scaleRatio;
      const midY = ((e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top) * scaleRatio;
      setTransform(prev => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));
        return { scale: newScale, x: midX - (midX - prev.x) * (newScale / prev.scale), y: midY - (midY - prev.y) * (newScale / prev.scale) };
      });
    } else if (panRef.current.panning) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleRatio = canvas.width / rect.width;
      const dx = (e.touches[0].clientX - panRef.current.lastX) * scaleRatio;
      const dy = (e.touches[0].clientY - panRef.current.lastY) * scaleRatio;
      panRef.current.lastX = e.touches[0].clientX;
      panRef.current.lastY = e.touches[0].clientY;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    pinchRef.current.active = false;
    panRef.current.panning = false;
  }, []);

  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  if (!mapFilename) {
    return (
      <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '52px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 28, marginBottom: 10, opacity: 0.4 }}>🗺</div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>No map set</div>
        <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 6 }}>The DM can add a map from DM Mode.</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>
          Live Map · {Math.round(transform.scale * 100)}% · Scroll/pinch to zoom · Drag to pan
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={resetView} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>⊡ Reset</button>
          <button onClick={() => setFullscreen(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>⛶ Expand</button>
        </div>
      </div>

      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: '#0d0b09', cursor: 'grab' }}>
        {!mapLoaded ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: COLORS.dim, fontSize: 12 }}>Loading map…</div>
        ) : (
          <canvas ref={canvasRef} width={900} height={600} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
        )}
      </div>

      {fullscreen && mapLoaded && (
        <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ fontSize: 8, color: 'rgba(240,238,235,0.4)', fontFamily: "'Cinzel', serif", marginBottom: 12, letterSpacing: '0.1em' }}>
            {Math.round(transform.scale * 100)}% · Scroll to zoom · Drag to pan
          </div>
          <canvas
            ref={node => { if (node) drawViewer({ canvas: node, mapImg: mapImgRef.current, fogZones, tokens, transform }); }}
            width={900} height={600}
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 80px)', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ marginTop: 12, fontSize: 9, color: 'rgba(240,238,235,0.3)', fontFamily: "'Cinzel', serif" }}>Click outside to close</div>
        </div>
      )}
    </div>
  );
}
