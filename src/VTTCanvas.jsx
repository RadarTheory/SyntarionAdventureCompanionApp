import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { LOCATIONS } from './MapPanel';

const TOOLS = ['fog-reveal', 'fog-hide', 'token-enemy', 'token-move', 'erase-token'];
const BRUSH_SIZES = [20, 40, 70, 110];
const TOKEN_COLORS = ['#e85d4a', '#4a9edd', '#79f5a7', '#e8c84a', '#c084fc', '#fb923c'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9); }

function drawCanvas({ canvas, mapImg, fogZones, tokens, brushPreview, tool }) {
  if (!canvas || !mapImg) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Map image
  ctx.drawImage(mapImg, 0, 0, W, H);

  // Fog overlay — dark mask with revealed holes
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,6,0.82)';
  ctx.fillRect(0, 0, W, H);

  // Cut reveal zones
  ctx.globalCompositeOperation = 'destination-out';
  fogZones.forEach(zone => {
    if (zone.type === 'reveal') {
      ctx.beginPath();
      ctx.arc(zone.x * W, zone.y * H, zone.r * W, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Re-hide zones painted on top
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

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const label = (tok.label || '?').slice(0, 3);
    ctx.fillText(label, tx, ty);
    ctx.restore();

    // Pending move indicator
    if (tok.pendingX !== undefined) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = '#e8c84a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tok.pendingX * W, tok.pendingY * H);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(tok.pendingX * W, tok.pendingY * H, r, 0, Math.PI * 2);
      ctx.strokeStyle = '#e8c84a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  });

  // Brush preview
  if (brushPreview) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(brushPreview.x, brushPreview.y, brushPreview.r, 0, Math.PI * 2);
    ctx.strokeStyle = tool === 'fog-reveal' ? '#e8c84a88' : tool === 'fog-hide' ? '#4444ff88' : '#ffffff44';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.restore();
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function VTTCanvas({ campaignId }) {
  const canvasRef    = useRef(null);
  const mapImgRef    = useRef(null);
  const paintingRef  = useRef(false);

  const [vttSession, setVttSession]     = useState(null);
  const [fogZones, setFogZones]         = useState([]);
  const [tokens, setTokens]             = useState([]);
  const [tool, setTool]                 = useState('fog-reveal');
  const [brushSize, setBrushSize]       = useState(1);
  const [brushPreview, setBrushPreview] = useState(null);
  const [mapFilename, setMapFilename]   = useState(null);
  const [mapLoaded, setMapLoaded]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [newTokenLabel, setNewTokenLabel] = useState('');
  const [newTokenColor, setNewTokenColor] = useState(TOKEN_COLORS[0]);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [pendingClick, setPendingClick] = useState(null);

  // Load or create vtt_session
  useEffect(() => {
    if (!campaignId) return;
    loadSession();

    const sub = supabase
      .channel(`vtt-${campaignId}`)
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
    } else {
      // Create session — pull map from campaigns table
      const { data: camp } = await supabase.from('campaigns').select('map_url').eq('id', campaignId).single();
      const filename = camp?.map_url || null;
      const { data: newSession } = await supabase
        .from('vtt_sessions')
        .insert({ campaign_id: campaignId, map_filename: filename, fog_zones: [], tokens: [], pending_moves: [] })
        .select()
        .single();
      if (newSession) {
        setVttSession(newSession);
        setMapFilename(filename);
      }
    }
  };

  // Load map image when filename changes
  useEffect(() => {
    if (!mapFilename) return;
    setMapLoaded(false);
    const img = new Image();
    img.onload = () => { mapImgRef.current = img; setMapLoaded(true); };
    img.src = `/Maps/${encodeURIComponent(mapFilename)}`;
  }, [mapFilename]);

  // Redraw canvas whenever state changes
  useEffect(() => {
    if (!mapLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCanvas({ canvas, mapImg: mapImgRef.current, fogZones, tokens, brushPreview, tool });
  }, [fogZones, tokens, brushPreview, mapLoaded, tool]);

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
      px: clientX - rect.left,
      py: clientY - rect.top,
    };
  };

  const brushRadius = BRUSH_SIZES[brushSize];

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);

    if (tool === 'fog-reveal' || tool === 'fog-hide') {
      paintingRef.current = true;
      const canvas = canvasRef.current;
      const zone = { id: uid(), type: tool === 'fog-reveal' ? 'reveal' : 'hide', x: pos.x, y: pos.y, r: brushRadius / canvas.width };
      setFogZones(prev => [...prev, zone]);
    }

    if (tool === 'token-enemy') {
      setPendingClick({ x: pos.x, y: pos.y });
      setShowTokenForm(true);
    }

    if (tool === 'erase-token') {
      const canvas = canvasRef.current;
      const W = canvas.width;
      const H = canvas.height;
      setTokens(prev => prev.filter(t => {
        const dx = (t.x - pos.x) * W;
        const dy = (t.y - pos.y) * H;
        return Math.sqrt(dx * dx + dy * dy) > 18;
      }));
    }

    if (tool === 'token-move') {
      // Select token closest to click
      const canvas = canvasRef.current;
      const W = canvas.width;
      const H = canvas.height;
      let closest = null;
      let closestDist = 30;
      tokens.forEach(t => {
        const dx = (t.x - pos.x) * W;
        const dy = (t.y - pos.y) * H;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < closestDist) { closest = t.id; closestDist = d; }
      });
      setSelectedTokenId(closest);
    }
  }, [tool, brushRadius, tokens]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);
    const canvas = canvasRef.current;
    setBrushPreview({ x: pos.px, y: pos.py, r: brushRadius });

    if (paintingRef.current && (tool === 'fog-reveal' || tool === 'fog-hide')) {
      const zone = { id: uid(), type: tool === 'fog-reveal' ? 'reveal' : 'hide', x: pos.x, y: pos.y, r: brushRadius / canvas.width };
      setFogZones(prev => [...prev, zone]);
    }

    if (tool === 'token-move' && selectedTokenId && e.buttons === 1) {
      setTokens(prev => prev.map(t => t.id === selectedTokenId ? { ...t, x: pos.x, y: pos.y } : t));
    }
  }, [tool, brushRadius, selectedTokenId]);

  const handlePointerUp = useCallback(() => {
    paintingRef.current = false;
    setSelectedTokenId(null);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setBrushPreview(null);
    paintingRef.current = false;
  }, []);

  const addEnemyToken = () => {
    if (!pendingClick || !newTokenLabel.trim()) return;
    const token = { id: uid(), type: 'enemy', label: newTokenLabel.trim(), color: newTokenColor, x: pendingClick.x, y: pendingClick.y };
    setTokens(prev => [...prev, token]);
    setNewTokenLabel('');
    setShowTokenForm(false);
    setPendingClick(null);
  };

  const save = async () => {
    if (!vttSession) return;
    setSaving(true);
    await supabase.from('vtt_sessions').update({ fog_zones: fogZones, tokens, updated_at: new Date().toISOString() }).eq('id', vttSession.id);
    setSaving(false);
  };

  const clearFog = () => setFogZones([]);
  const revealAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // One big circle covering the whole map
    setFogZones([{ id: uid(), type: 'reveal', x: 0.5, y: 0.5, r: 1.5 }]);
  };

  const syncMapFromCampaign = async () => {
    const { data } = await supabase.from('campaigns').select('map_url').eq('id', campaignId).single();
    if (data?.map_url) {
      await supabase.from('vtt_sessions').update({ map_filename: data.map_url }).eq('id', vttSession.id);
      setMapFilename(data.map_url);
    }
  };

  const label8 = { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };

  const toolBtn = (id, label, active) => (
    <button
      key={id}
      onClick={() => setTool(id)}
      style={{ background: active ? 'rgba(200,168,74,0.15)' : COLORS.card, border: `1px solid ${active ? '#c8a84a' : COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? '#e8c84a' : COLORS.text, whiteSpace: 'nowrap' }}
    >{label}</button>
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

        <div style={{ width: 1, height: 20, background: COLORS.border, margin: '0 4px' }} />

        <div style={{ ...label8, marginRight: 4 }}>Brush</div>
        {BRUSH_SIZES.map((_, i) => (
          <button key={i} onClick={() => setBrushSize(i)} style={{ width: 24, height: 24, borderRadius: '50%', background: brushSize === i ? '#c8a84a' : COLORS.card, border: `1px solid ${brushSize === i ? '#e8c84a' : COLORS.border}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 6 + i * 4, height: 6 + i * 4, borderRadius: '50%', background: brushSize === i ? '#1a1714' : COLORS.muted }} />
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: COLORS.border, margin: '0 4px' }} />

        <button onClick={revealAll} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>Reveal All</button>
        <button onClick={clearFog}  style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>Reset Fog</button>
        <button onClick={syncMapFromCampaign} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>↺ Sync Map</button>

        <button onClick={save} disabled={saving} style={{ marginLeft: 'auto', background: 'rgba(200,168,74,0.15)', border: `1px solid #c8a84a`, borderRadius: 6, padding: '6px 16px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e8c84a', fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : '✦ Commit'}
        </button>
      </div>

      {/* ── Canvas ── */}
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: '#0d0b09', cursor: tool === 'fog-reveal' || tool === 'fog-hide' ? 'crosshair' : tool === 'erase-token' ? 'not-allowed' : 'default' }}>
        {!mapFilename ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>No map loaded</div>
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>Set a map in the Campaign Map tab first, then click Sync Map.</div>
            <button onClick={syncMapFromCampaign} style={{ background: 'rgba(200,168,74,0.15)', border: `1px solid #c8a84a`, borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e8c84a' }}>↺ Sync Map from Campaign</button>
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

      {/* ── Token form (appears when placing enemy) ── */}
      {showTokenForm && (
        <div style={{ background: COLORS.surface, border: `1px solid #c8a84a44`, borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ ...label8, marginBottom: 10 }}>New Enemy Token</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              autoFocus
              value={newTokenLabel}
              onChange={e => setNewTokenLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addEnemyToken()}
              placeholder="Label (e.g. Orc, G1)…"
              maxLength={6}
              style={{ flex: 1, minWidth: 120, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 12, fontFamily: 'Georgia, serif', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {TOKEN_COLORS.map(c => (
                <div key={c} onClick={() => setNewTokenColor(c)} style={{ width: 20, height: 20, borderRadius: '50%', background: c, border: `2px solid ${newTokenColor === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />
              ))}
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
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 8px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.text }}>{t.label}</div>
                <button onClick={() => setTokens(prev => prev.filter(x => x.id !== t.id))} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}>×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
