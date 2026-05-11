import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

function drawViewer({ canvas, mapImg, fogZones, tokens }) {
  if (!canvas || !mapImg) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(mapImg, 0, 0, W, H);

  // Fog
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,6,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'destination-out';
  fogZones.forEach(zone => {
    if (zone.type === 'reveal') {
      ctx.beginPath();
      ctx.arc(zone.x * W, zone.y * H, zone.r * W, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(10,8,6,0.82)';
  fogZones.forEach(zone => {
    if (zone.type === 'hide') {
      ctx.beginPath();
      ctx.arc(zone.x * W, zone.y * H, zone.r * W, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();

  // Tokens
  tokens.forEach(tok => {
    const tx = tok.x * W;
    const ty = tok.y * H;
    const r = 14;
    ctx.save();
    ctx.beginPath();
    ctx.arc(tx, ty, r, 0, Math.PI * 2);
    ctx.fillStyle = tok.color || '#e85d4a';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText((tok.label || '?').slice(0, 3), tx, ty);
    ctx.restore();
  });
}

export default function VTTViewer({ campaignId, userChar }) {
  const canvasRef  = useRef(null);
  const mapImgRef  = useRef(null);

  const [fogZones, setFogZones]     = useState([]);
  const [tokens, setTokens]         = useState([]);
  const [mapFilename, setMapFilename] = useState(null);
  const [mapLoaded, setMapLoaded]   = useState(false);
  const [vttSession, setVttSession] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

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
    const { data } = await supabase
      .from('vtt_sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .maybeSingle();
    if (data) {
      setVttSession(data);
      setFogZones(data.fog_zones || []);
      setTokens(data.tokens || []);
      setMapFilename(data.map_filename);
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
    drawViewer({ canvas: canvasRef.current, mapImg: mapImgRef.current, fogZones, tokens });
  }, [fogZones, tokens, mapLoaded]);

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
          Live Map
        </div>
        <button
          onClick={() => setFullscreen(true)}
          style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}
        >⛶ Expand</button>
      </div>

      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: '#0d0b09' }}>
        {!mapLoaded ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: COLORS.dim, fontSize: 12 }}>Loading map…</div>
        ) : (
          <canvas
            ref={canvasRef}
            width={900}
            height={600}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        )}
      </div>

      {fullscreen && mapLoaded && (
        <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <canvas
            ref={node => {
              if (node) drawViewer({ canvas: node, mapImg: mapImgRef.current, fogZones, tokens });
            }}
            width={900}
            height={600}
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 60px)', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ marginTop: 12, fontSize: 9, color: 'rgba(240,238,235,0.3)', fontFamily: "'Cinzel', serif" }}>Click outside to close</div>
        </div>
      )}
    </div>
  );
}
