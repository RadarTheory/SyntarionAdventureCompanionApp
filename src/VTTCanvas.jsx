import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import { LOCATIONS } from './MapPanel';

const BRUSH_SIZES = [20, 40, 70, 110];
const TOKEN_COLORS = ['#e85d4a', '#4a9edd', '#79f5a7', '#e8c84a', '#c084fc', '#fb923c'];
const MIN_SCALE = 0.3;
const MAX_SCALE = 10;

function uid() { return Math.random().toString(36).slice(2, 9); }

function drawCanvas({ canvas, mapImg, fogZones, tokens, brushPreview, tool, transform }) {
  if (!canvas || !mapImg) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // ── Transformed layer (map + fog + tokens) ──
  ctx.save();
  ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);

  // Map
  ctx.drawImage(mapImg, 0, 0, W, H);

  // Fog offscreen
  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = W;
  fogCanvas.height = H;
  const fogCtx = fogCanvas.getContext('2d');
  fogCtx.fillStyle = 'rgba(10,8,6,0.85)';
  fogCtx.fillRect(0, 0, W, H);
  fogCtx.globalCompositeOperation = 'destination-out';
  fogZones.forEach(zone => {
    if (zone.type === 'reveal') {
      const cx = zone.x * W;
      const cy = zone.y * H;
      const r = zone.r * W;
      const feather = zone.feather ?? 0;
      const innerR = r * (1 - feather);
      const grad = fogCtx.createRadialGradient(cx, cy, innerR, cx, cy, r);
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

  // Tokens
  tokens.forEach(tok => {
    const tx = tok.x * W;
    const ty = tok.y * H;
    const r = 14;
    ctx.save();
    if (tok.type === 'player') {
      ctx.beginPath();
      ctx.roundRect(tx - r, ty - r, r * 2, r * 2, 4);
    } else {
      ctx.beginPath();
      ctx.arc(tx, ty, r, 0, Math.PI * 2);
    }
    ctx.fillStyle = tok.color || '#4a9edd';
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

  ctx.restore(); // end transformed layer

  // ── Brush preview in screen space (not transformed) ──
  if (brushPreview) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(brushPreview.sx, brushPreview.sy, brushPreview.sr, 0, Math.PI * 2);
    ctx.strokeStyle = tool === 'fog-reveal' ? '#e8c84a88' : tool === 'fog-hide' ? '#4444ff88' : '#ffffff44';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.restore();
  }
}

export default function VTTCanvas({ campaignId, onRegisterPlaceToken }) {
  const canvasRef   = useRef(null);
  const mapImgRef   = useRef(null);
  const paintingRef = useRef(false);
  const panRef      = useRef({ active: false, lastX: 0, lastY: 0 });
  const transformRef = useRef({ scale: 1, x: 0, y: 0 });

  const [transform, setTransform]             = useState({ scale: 1, x: 0, y: 0 });
  const [vttSession, setVttSession]           = useState(null);
  const [fogZones, setFogZones]               = useState([]);
  const [tokens, setTokens]                   = useState([]);
  const [tool, setTool]                       = useState('fog-reveal');
  const [brushSize, setBrushSize]             = useState(1);
  const [brushPreview, setBrushPreview]       = useState(null);
  const [mapFilename, setMapFilename]         = useState(null);
  const [mapLoaded, setMapLoaded]             = useState(false);
  const [saving, setSaving]                   = useState(false);
  const [newTokenLabel, setNewTokenLabel]     = useState('');
  const [newTokenColor, setNewTokenColor]     = useState(TOKEN_COLORS[0]);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [showTokenForm, setShowTokenForm]     = useState(false);
  const [pendingClick, setPendingClick]       = useState(null);
  const [mapSearch, setMapSearch]             = useState('');
  const [showCommitPicker, setShowCommitPicker] = useState(false);
  const [feather, setFeather]                 = useState(0.3);

  // Keep transformRef in sync for use in non-reactive handlers
  useEffect(() => { transformRef.current = transform; }, [transform]);

  // ── Session load ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!campaignId) return;
    loadSession();
    const sub = supabase
      .channel(`vtt-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vtt_sessions', filter: `campaign_id=eq.${campaignId}` }, () => loadSession())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  // ── Register place-token callback ─────────────────────────────────────────
  useEffect(() => {
    if (!onRegisterPlaceToken) return;
    onRegisterPlaceToken((tokenData) => {
      setTokens(prev => {
        const filtered = prev.filter(t => t.characterId !== tokenData.characterId);
        return [...filtered, { id: uid(), type: 'player', label: tokenData.label, color: tokenData.color, characterId: tokenData.characterId, x: 0.5, y: 0.5 }];
      });
    });
  }, [onRegisterPlaceToken]);

  const loadSession = async () => {
    const { data } = await supabase.from('vtt_sessions').select('*').eq('campaign_id', campaignId).maybeSingle();
    if (data) {
      setVttSession(data); setFogZones(data.fog_zones || []); setTokens(data.tokens || []); setMapFilename(data.map_filename);
    } else {
      const { data: camp } = await supabase.from('campaigns').select('map_url').eq('id', campaignId).single();
      const filename = camp?.map_url || null;
      const { data: newSession } = await supabase.from('vtt_sessions').insert({ campaign_id: campaignId, map_filename: filename, fog_zones: [], tokens: [], pending_moves: [] }).select().single();
      if (newSession) { setVttSession(newSession); setMapFilename(filename); }
    }
  };

  const pickMap = async (filename) => {
    if (!vttSession) {
      const { data } = await supabase.from('vtt_sessions').upsert({ campaign_id: campaignId, map_filename: filename, fog_zones: [], tokens: [], pending_moves: [] }, { onConflict: 'campaign_id' }).select().single();
      if (data) setVttSession(data);
    } else {
      await supabase.from('vtt_sessions').update({ map_filename: filename }).eq('id', vttSession.id);
    }
    await supabase.from('campaigns').update({ map_url: filename }).eq('id', campaignId);
    setMapFilename(filename); setMapSearch(''); setTransform({ scale: 1, x: 0, y: 0 });
  };

  const save = async (targetCampaignId) => {
    setSaving(true);
    const { data: existing } = await supabase.from('vtt_sessions').select('id').eq('campaign_id', targetCampaignId).maybeSingle();
    if (existing) {
      await supabase.from('vtt_sessions').update({ fog_zones: fogZones, tokens, map_filename: mapFilename, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('vtt_sessions').insert({ campaign_id: targetCampaignId, map_filename: mapFilename, fog_zones: fogZones, tokens, pending_moves: [] });
    }
    await supabase.from('campaigns').update({ map_url: mapFilename }).eq('id', targetCampaignId);
    setSaving(false); setShowCommitPicker(false);
  };

  // ── Map image load ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapFilename) return;
    setMapLoaded(false);
    const img = new Image();
    img.onload = () => { mapImgRef.current = img; setMapLoaded(true); setTransform({ scale: 1, x: 0, y: 0 }); };
    img.src = `/Maps/${encodeURIComponent(mapFilename)}`;
  }, [mapFilename]);

  // ── Redraw ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapLoaded) return;
    drawCanvas({ canvas: canvasRef.current, mapImg: mapImgRef.current, fogZones, tokens, brushPreview, tool, transform });
  }, [fogZones, tokens, brushPreview, mapLoaded, tool, transform]);

  // ── Wheel zoom (non-passive, on canvas directly) ──────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !mapLoaded) return;
    const handler = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleRatio = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleRatio;
      const mouseY = (e.clientY - rect.top) * scaleRatio;
      const delta = e.deltaY < 0 ? 1.12 : 0.9;
      setTransform(prev => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * delta));
        return {
          scale: newScale,
          x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
          y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
        };
      });
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [mapLoaded]);

  // ── Coord helpers ─────────────────────────────────────────────────────────
  const screenToMap = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const scaleRatio = canvas.width / rect.width;
    const cx = (clientX - rect.left) * scaleRatio;
    const cy = (clientY - rect.top) * scaleRatio;
    return {
      x: (cx - t.x) / (t.scale * canvas.width),
      y: (cy - t.y) / (t.scale * canvas.height),
    };
  };

  const screenToCanvasPx = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;
    return { px: (clientX - rect.left) * scaleRatio, py: (clientY - rect.top) * scaleRatio };
  };

  const brushRadius = BRUSH_SIZES[brushSize];

  // ── Pointer handlers ──────────────────────────────────────────────────────
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    
    // Quick reset on Ctrl+Click
    if (e.ctrlKey) {
      setMapFilename(null);
      setMapLoaded(false);
      setFogZones([]);
      setTokens([]);
      return;
    }

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (tool === 'pan' || e.button === 1) {
      panRef.current = { active: true, lastX: clientX, lastY: clientY };
      return;
    }

    const pos = screenToMap(clientX, clientY);

    if (tool === 'fog-reveal' || tool === 'fog-hide') {
      paintingRef.current = true;
      const canvas = canvasRef.current;
      const t = transformRef.current;
      const r = brushRadius / (canvas.width * t.scale);
      const zone = { id: uid(), type: tool === 'fog-reveal' ? 'reveal' : 'hide', x: pos.x, y: pos.y, r, feather };
      setFogZones(prev => {
        const next = [...prev, zone];
        if (tool === 'fog-reveal') {
          // Remove hide zones whose center falls within this reveal brush
          return next.filter(z => {
            if (z.id === zone.id) return true;
            if (z.type !== 'hide') return true;
            const dx = (z.x - pos.x) * canvas.width;
            const dy = (z.y - pos.y) * canvas.height;
            return Math.sqrt(dx * dx + dy * dy) > (r + z.r) * canvas.width;
          });
        }
        return next;
      });
    }
    if (tool === 'token-enemy') { setPendingClick(pos); setShowTokenForm(true); }
    if (tool === 'erase-token') {
      const canvas = canvasRef.current;
      setTokens(prev => prev.filter(t => {
        const dx = (t.x - pos.x) * canvas.width;
        const dy = (t.y - pos.y) * canvas.height;
        return Math.sqrt(dx * dx + dy * dy) > 18;
      }));
    }
    if (tool === 'token-move') {
      const canvas = canvasRef.current;
      const t = transformRef.current;
      let closest = null; let closestDist = 30 / t.scale;
      tokens.forEach(tok => {
        const dx = (tok.x - pos.x) * canvas.width;
        const dy = (tok.y - pos.y) * canvas.height;
        if (Math.sqrt(dx * dx + dy * dy) < closestDist) { closest = tok.id; closestDist = Math.sqrt(dx * dx + dy * dy); }
      });
      setSelectedTokenId(closest);
    }
  }, [tool, brushRadius, feather, tokens]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Pan
    if (panRef.current.active) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleRatio = canvas.width / rect.width;
      const dx = (clientX - panRef.current.lastX) * scaleRatio;
      const dy = (clientY - panRef.current.lastY) * scaleRatio;
      panRef.current.lastX = clientX;
      panRef.current.lastY = clientY;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      return;
    }

    const pos = screenToMap(clientX, clientY);
    const { px, py } = screenToCanvasPx(clientX, clientY);
    const t = transformRef.current;
    setBrushPreview({ sx: px, sy: py, sr: brushRadius * t.scale });

    if (paintingRef.current && (tool === 'fog-reveal' || tool === 'fog-hide')) {
      const canvas = canvasRef.current;
      const zone = { id: uid(), type: tool === 'fog-reveal' ? 'reveal' : 'hide', x: pos.x, y: pos.y, r: brushRadius / (canvas.width * t.scale), feather };
      setFogZones(prev => [...prev, zone]);
    }
    if (tool === 'token-move' && selectedTokenId && (e.buttons === 1 || e.touches)) {
      setTokens(prev => prev.map(t => t.id === selectedTokenId ? { ...t, x: pos.x, y: pos.y } : t));
    }
  }, [tool, brushRadius, feather, selectedTokenId]);

  const handlePointerUp = useCallback(() => {
    paintingRef.current = false;
    panRef.current.active = false;
    setSelectedTokenId(null);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setBrushPreview(null);
    paintingRef.current = false;
    panRef.current.active = false;
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const addEnemyToken = () => {
    if (!pendingClick || !newTokenLabel.trim()) return;
    setTokens(prev => [...prev, { id: uid(), type: 'enemy', label: newTokenLabel.trim(), color: newTokenColor, x: pendingClick.x, y: pendingClick.y }]);
    setNewTokenLabel(''); setShowTokenForm(false); setPendingClick(null);
  };

  const clearFog = () => setFogZones([]);
  const revealAll = () => setFogZones([{ id: uid(), type: 'reveal', x: 0.5, y: 0.5, r: 1.5 }]);
  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  const syncMapFromCampaign = async () => {
    const { data } = await supabase.from('campaigns').select('map_url').eq('id', campaignId).single();
    if (data?.map_url) { await supabase.from('vtt_sessions').update({ map_filename: data.map_url }).eq('id', vttSession.id); setMapFilename(data.map_url); }
  };

  const label8 = { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
  const toolBtn = (id, lbl, active) => (
    <button key={id} onClick={() => setTool(id)} style={{ background: active ? 'rgba(200,168,74,0.15)' : COLORS.card, border: `1px solid ${active ? '#c8a84a' : COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? '#e8c84a' : COLORS.text, whiteSpace: 'nowrap' }}>{lbl}</button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── Toolbar ── */}
      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <div style={{ ...label8, marginRight: 4 }}>Tool</div>
        {toolBtn('fog-reveal', '☀ Reveal', tool === 'fog-reveal')}
        {toolBtn('fog-hide',   '◼ Hide',   tool === 'fog-hide')}
        {toolBtn('token-enemy','⚔ Enemy',  tool === 'token-enemy')}
        {toolBtn('token-move', '✥ Move',   tool === 'token-move')}
        {toolBtn('erase-token','✕ Erase',  tool === 'erase-token')}
        {toolBtn('pan',        '✋ Pan',    tool === 'pan')}
        <div style={{ width: 1, height: 20, background: COLORS.border, margin: '0 4px' }} />
        <div style={{ ...label8, marginRight: 4 }}>Brush</div>
        {BRUSH_SIZES.map((_, i) => (
          <button key={i} onClick={() => setBrushSize(i)} style={{ width: 24, height: 24, borderRadius: '50%', background: brushSize === i ? '#c8a84a' : COLORS.card, border: `1px solid ${brushSize === i ? '#e8c84a' : COLORS.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 6 + i * 4, height: 6 + i * 4, borderRadius: '50%', background: brushSize === i ? '#1a1714' : COLORS.muted }} />
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: COLORS.border, margin: '0 4px' }} />
        <div style={{ ...label8, marginRight: 4 }}>Feather</div>
        {[0, 0.3, 0.6, 1].map((f, i) => (
          <button key={f} onClick={() => setFeather(f)} style={{ background: feather === f ? 'rgba(200,168,74,0.15)' : COLORS.card, border: `1px solid ${feather === f ? '#c8a84a' : COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: feather === f ? '#e8c84a' : COLORS.text }}>
            {['None', 'Light', 'Med', 'Full'][i]}
          </button>
        ))}
        <div style={{ width: 1, height: 20, background: COLORS.border, margin: '0 4px' }} />
        <button onClick={revealAll} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>Reveal All</button>
        <button onClick={clearFog}  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>Reset Fog</button>
        <button onClick={resetView} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>⊡ Reset View</button>
        <button onClick={syncMapFromCampaign} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>↺ Sync Map</button>
        {mapFilename && <button onClick={() => { setMapFilename(null); setMapLoaded(false); setFogZones([]); setTokens([]); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>↩ Change Map</button>}
        {mapLoaded && <div style={{ ...label8, color: COLORS.dim }}>Zoom: {Math.round(transform.scale * 100)}%</div>}
        <button onClick={() => setShowCommitPicker(true)} disabled={saving || !mapFilename} style={{ marginLeft: 'auto', background: mapFilename ? 'rgba(200,168,74,0.15)' : 'transparent', border: `1px solid ${mapFilename ? '#c8a84a' : COLORS.border}`, borderRadius: 6, padding: '6px 16px', cursor: mapFilename ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: mapFilename ? '#e8c84a' : COLORS.dim, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : '✦ Commit'}
        </button>
      </div>

      {/* ── Canvas ── */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: '#0d0b09', cursor: tool === 'pan' ? 'grab' : tool === 'fog-reveal' || tool === 'fog-hide' ? 'crosshair' : tool === 'erase-token' ? 'not-allowed' : 'default' }}>
        {!mapFilename ? (
          <div style={{ padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.muted, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>Select a map to begin</div>
            <input value={mapSearch} onChange={e => setMapSearch(e.target.value)} placeholder="Search locations…" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
              {LOCATIONS.filter(l => l.name.toLowerCase().includes(mapSearch.toLowerCase())).map(loc => (
                <button key={loc.id} onClick={() => pickMap(loc.filename)} style={{ textAlign: 'left', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.06em', color: COLORS.text }}>{loc.name}</button>
              ))}
            </div>
          </div>
        ) : !mapLoaded ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: COLORS.dim, fontSize: 12 }}>Loading map…</div>
        ) : (
          <canvas
            ref={canvasRef}
            width={900}
            height={600}
            style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerLeave}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          />
        )}
      </div>

      {/* ── Token form ── */}
      {showTokenForm && (
        <div style={{ background: COLORS.surface, border: `1px solid #c8a84a44`, borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ ...label8, marginBottom: 10 }}>New Enemy Token</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input autoFocus value={newTokenLabel} onChange={e => setNewTokenLabel(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEnemyToken()} placeholder="Label (e.g. Orc, G1)…" maxLength={6} style={{ flex: 1, minWidth: 120, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }} />
            <div style={{ display: 'flex', gap: 4 }}>
              {TOKEN_COLORS.map(c => <div key={c} onClick={() => setNewTokenColor(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: `2px solid ${newTokenColor === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />)}
            </div>
            <button onClick={addEnemyToken} style={{ background: 'rgba(200,168,74,0.15)', border: `1px solid #c8a84a`, borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', color: '#e8c84a', fontWeight: 700 }}>Place</button>
            <button onClick={() => { setShowTokenForm(false); setPendingClick(null); }} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Token list ── */}
      {tokens.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ ...label8, marginBottom: 8 }}>Tokens on map — {tokens.length}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tokens.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.card, border: `1px solid ${t.type === 'player' ? '#4a9edd44' : COLORS.border}`, borderRadius: t.type === 'player' ? 4 : 6, padding: '5px 8px' }}>
                <div style={{ width: 10, height: 10, borderRadius: t.type === 'player' ? 2 : '50%', background: t.color, flexShrink: 0 }} />
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.text }}>{t.label}</div>
                <button onClick={() => setTokens(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Commit picker ── */}
      {showCommitPicker && (
        <div onClick={() => setShowCommitPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#13100d', border: '1px solid #c8a84a44', borderRadius: 12, padding: '24px 28px', minWidth: 300 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Commit to Campaign</div>
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>Choose which campaign this map and fog state applies to.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CAMPAIGNS.map(c => (
                <button key={c.id} onClick={() => save(c.id)} style={{ textAlign: 'left', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a84a88'; e.currentTarget.style.background = 'rgba(200,168,74,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = 'rgba(240,238,235,0.04)'; }}
                >
                  <div style={{ fontSize: 8, color: COLORS.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Cinzel', serif" }}>Campaign {c.id}</div>
                  {c.subtitle}
                </button>
              ))}
            </div>
            <button onClick={() => setShowCommitPicker(false)} style={{ marginTop: 14, width: '100%', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 0', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
