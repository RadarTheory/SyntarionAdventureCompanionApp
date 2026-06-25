import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { LOCATIONS } from './MapPanel';

const BRUSH_SIZES = [20, 40, 70, 110];
const TOKEN_COLORS = ['#e85d4a', '#4a9edd', '#79f5a7', '#e8c84a', '#c084fc', '#fb923c'];
const MIN_SCALE = 0.3;
const MAX_SCALE = 10;

function uid() { return Math.random().toString(36).slice(2, 9); }

// ─── Race icon silhouette cache ────────────────────────────────────────────
// Loads each race icon once, strips its original colors, and forces it to a
// white silhouette (alpha preserved) so it reads against any token color.
const raceIconCache = {};

function getRaceIcon(race, onReady) {
  if (!race) return null;
  const key = race.toLowerCase().replace(/[^a-z]/g, '');
  if (raceIconCache[key] === undefined) {
    raceIconCache[key] = null; // mark as loading
    const img = new Image();
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = img.width; off.height = img.height;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0);
      const imgData = octx.getImageData(0, 0, off.width, off.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const luminance = (d[i] + d[i + 1] + d[i + 2]) / 3;
        d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
        d[i + 3] = 255 - luminance; // dark linework becomes opaque white, light background becomes transparent
      }
      octx.putImageData(imgData, 0, 0);
      raceIconCache[key] = off;
      onReady?.();
    };
    img.onerror = () => { raceIconCache[key] = false; }; // mark as failed
    img.src = `/RaceIcons/${key}.png`;
  }
  return raceIconCache[key] || null;
}

function getMapRect(canvas, mapImg) {
  const W = canvas.width;
  const H = canvas.height;

  const imgRatio = mapImg.width / mapImg.height;
  const canvasRatio = W / H;

  let drawW;
  let drawH;

  if (imgRatio > canvasRatio) {
    drawW = W;
    drawH = W / imgRatio;
  } else {
    drawH = H;
    drawW = H * imgRatio;
  }

  return {
    x: (W - drawW) / 2,
    y: (H - drawH) / 2,
    w: drawW,
    h: drawH,
  };
}
function isTokenFogged(tok, fogZones) {
  // A point is hidden if any 'hide' zone covers it, OR if 'reveal' zones exist
  // and none of them cover it (fog defaults to hidden until revealed).
  const hideZones = fogZones.filter(z => z.type === 'hide');
  const revealZones = fogZones.filter(z => z.type === 'reveal');

  const inZone = (zone) => {
    const dx = tok.x - zone.x;
    const dy = tok.y - zone.y;
    return Math.sqrt(dx * dx + dy * dy) <= zone.r;
  };

  if (hideZones.some(inZone)) return true;
  if (revealZones.length > 0 && !revealZones.some(inZone)) return true;
  return false;
}

function drawCanvas({ canvas, mapImg, fogZones, tokens, brushPreview, tool, transform, isDM, hoveredTokenId, onIconReady }) {
  if (!canvas || !mapImg) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
  const mapRect = getMapRect(canvas, mapImg);
ctx.drawImage(mapImg, mapRect.x, mapRect.y, mapRect.w, mapRect.h);

  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = W; fogCanvas.height = H;
  const fogCtx = fogCanvas.getContext('2d');
  fogCtx.fillStyle = 'rgba(10,8,6,0.85)';
  fogCtx.fillRect(0, 0, W, H);
  fogCtx.globalCompositeOperation = 'destination-out';
  fogZones.forEach(zone => {
    if (zone.type === 'reveal') {
      const cx = mapRect.x + zone.x * mapRect.w;
const cy = mapRect.y + zone.y * mapRect.h;
const r = zone.r * mapRect.w;
      const feather = zone.feather ?? 0;
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
fogZones.forEach(zone => {
  if (zone.type === 'hide') {
    const cx = mapRect.x + zone.x * mapRect.w;
    const cy = mapRect.y + zone.y * mapRect.h;
    const r = zone.r * mapRect.w;
    const feather = zone.feather ?? 0;
    if (feather > 0) {
      const grad = fogCtx.createRadialGradient(cx, cy, r * (1 - feather), cx, cy, r);
      grad.addColorStop(0, 'rgba(10,8,6,0.85)');
      grad.addColorStop(1, 'rgba(10,8,6,0)');
      fogCtx.beginPath();
      fogCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fogCtx.fillStyle = grad;
      fogCtx.fill();
    } else {
      fogCtx.beginPath();
      fogCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fogCtx.fillStyle = 'rgba(10,8,6,0.85)';
      fogCtx.fill();
    }
  }
});
  ctx.drawImage(fogCanvas, 0, 0);

 tokens.forEach(tok => {
    const fogged = isTokenFogged(tok, fogZones);
    if (fogged && !isDM) return; // players never see fogged tokens at all

    const isHovered = hoveredTokenId && tok.id === hoveredTokenId;
    const tx = mapRect.x + tok.x * mapRect.w;
const ty = mapRect.y + tok.y * mapRect.h;
const r = isHovered ? 22 : 14;
    ctx.save();
    if (fogged) ctx.globalAlpha = 0.4; // DM sees fogged tokens dimmed, as a reminder

    if (tok.type === 'player') { ctx.beginPath(); ctx.roundRect(tx - r, ty - r, r * 2, r * 2, 4); }
    else { ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); }
    ctx.fillStyle = tok.color || '#4a9edd';
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#e8c84a' : (fogged ? '#e8c84a' : '#fff'); ctx.lineWidth = isHovered ? 3 : 2;
    if (fogged) ctx.setLineDash([3, 2]);
    ctx.stroke();
    ctx.setLineDash([]);

    const icon = tok.race ? getRaceIcon(tok.race, onIconReady) : null;
    if (icon) {
      const iconSize = r * 1.3;
      ctx.drawImage(icon, tx - iconSize / 2, ty - iconSize / 2, iconSize, iconSize);
    } else {
      ctx.fillStyle = '#fff'; ctx.font = `bold ${isHovered ? 12 : 9}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText((tok.label || '?').slice(0, 3), tx, ty);
    }
    ctx.restore();
  });

  ctx.restore();

  if (brushPreview) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(brushPreview.sx, brushPreview.sy, brushPreview.sr, 0, Math.PI * 2);
    ctx.strokeStyle = tool === 'fog-reveal' ? '#e8c84a88' : tool === 'fog-hide' ? '#4444ff88' : '#ffffff44';
    ctx.lineWidth = 1.5; ctx.setLineDash([4, 3]); ctx.stroke();
    ctx.restore();
  }
}

// ─── VTTCanvas ────────────────────────────────────────────────────────────────
// NEW PROPS:
//   onTokensChange(tokens)  — called whenever the token list changes so HERCULES
//                             can sync player tokens into the initiative board
//   onRegisterPlaceToken(fn) — registers a callback DMView calls to place tokens
//                              from HERCULES (enemies) or PlayersPanel (PCs)
export default function VTTCanvas({ campaignId, dbCampaigns = [], onRegisterPlaceToken, onTokensChange, checkedInPlayers, isDM = false }) {
  const canvasRef    = useRef(null);
  const mapImgRef    = useRef(null);
  const paintingRef  = useRef(false);
  const panRef       = useRef({ active: false, lastX: 0, lastY: 0 });
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
 const [hoveredToken, setHoveredToken] = useState(null); // { id, name, clientX, clientY }
  const [iconTick, setIconTick] = useState(0);
  const [showTokenForm, setShowTokenForm]     = useState(false);
  const [pendingClick, setPendingClick]       = useState(null);
  const [mapSearch, setMapSearch]             = useState('');
  const [pinnedCampaignId, setPinnedCampaignId] = useState(() => localStorage.getItem('vtt_pinned_campaign') || campaignId);
  const [showCampaignPicker, setShowCampaignPicker] = useState(false);
  const activeCampaignId = pinnedCampaignId || campaignId;
  const [showCommitPicker, setShowCommitPicker] = useState(false);
  const [feather, setFeather]                 = useState(0.3);


const [dbCampaigns, setDbCampaigns] = useState([]);
useEffect(() => {
  supabase.from('campaigns').select('*').order('created_at', { ascending: true })
    .then(({ data }) => { if (data) setDbCampaigns(data); });
}, []);

  const conjureTokenToMap = async token => {
  if (!token?.id && !token?.token_id && !token?.name && !token?.label) return;
  const sessionId = vttSession?.id;
  if (!sessionId) {
    console.error('No active VTT session to place token into');
    return;
  }

  const tokenKey = String(
    token.id ||
    token.token_id ||
    token.character_id ||
    token.name ||
    token.label
  );

  let found = false;
  const updatedTokens = tokens.map(t => {
    const currentKey = String(
      t.id ||
      t.token_id ||
      t.character_id ||
      t.name ||
      t.label
    );

    if (currentKey !== tokenKey) return t;
    found = true;

    return {
      ...t,
      id: t.id || tokenKey,
      token_id: t.token_id || tokenKey,
      x: 0.5,
      y: 0.5,
      visible: true,
      on_map: true,
    };
  });

  const finalTokens = found ? updatedTokens : [
    ...tokens,
    {
      id: tokenKey,
      token_id: tokenKey,
      type: token.type || 'enemy',
      label: token.label || token.name || 'Token',
      color: token.color || '#4a9edd',
      characterId: token.characterId || token.character_id || null,
      creatureName: token.creatureName || token.name || null,
      race: token.race || null,
      x: 0.5,
      y: 0.5,
      visible: true,
      on_map: true,
    },
  ];

  setTokens(finalTokens);

  const { error } = await supabase
    .from('vtt_sessions')
    .update({
      tokens: finalTokens,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to conjure token to map:', error);
  }
};

  const removeToken = (token) => {
    setTokens(prev => {
      const next = prev.filter(t => t.id !== token.id);
      if (vttSession?.id) {
        supabase.from('vtt_sessions')
          .update({ tokens: next, updated_at: new Date().toISOString() })
          .eq('id', vttSession.id)
          .then(({ error }) => { if (error) console.error('Failed to persist token removal:', error); });
      }
      return next;
    });
  };

  useEffect(() => { transformRef.current = transform; }, [transform]);

  // Notify HERCULES whenever tokens change
  useEffect(() => {
    onTokensChange?.(tokens);
  }, [tokens, onTokensChange]);

  useEffect(() => {
    if (!campaignId) return;
    loadSession();
    const sub = supabase
      .channel(`vtt-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vtt_sessions', filter: `campaign_id=eq.${campaignId}` }, () => loadSession())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  // Register the place-token callback — handles both player PCs and HERCULES enemies.
  // Enemies land at a slightly randomised position around center so stacking is avoided.
  useEffect(() => {
    if (!onRegisterPlaceToken) return;
    onRegisterPlaceToken((tokenData) => {
      setTokens(prev => {
        // Deduplicate by characterId for PCs, by creatureName for enemies
        const filtered = tokenData.characterId
          ? prev.filter(t => t.characterId !== tokenData.characterId)
          : prev; // enemies can have multiples

        // Scatter enemies around center so two of the same type don't overlap
        const scatter = () => 0.38 + Math.random() * 0.24; // 0.38–0.62
        const x = tokenData.type === 'player' ? 0.5 : scatter();
        const y = tokenData.type === 'player' ? 0.5 : scatter();

        const next = [...filtered, {
          id: uid(),
          type: tokenData.type || 'enemy',
          label: tokenData.label,
          color: tokenData.color,
          characterId: tokenData.characterId || null,
          creatureName: tokenData.creatureName || null,
          fullName: tokenData.fullName || tokenData.creatureName || tokenData.label || null,
          race: tokenData.race || null,
          portrait_url: tokenData.portrait_url || null,
          x,
          y,
        }];

        // Persist immediately — without this, any realtime vtt_sessions
        // change elsewhere overwrites this token with stale saved data.
        if (vttSession?.id) {
          supabase.from('vtt_sessions')
            .update({ tokens: next, updated_at: new Date().toISOString() })
            .eq('id', vttSession.id)
            .then(({ error }) => { if (error) console.error('Failed to persist placed token:', error); });
        }

        return next;
      });
    });
  }, [onRegisterPlaceToken, vttSession]);

  // Listen for NPCs pushed from the NPC Tracker — lands at map center, DM drags into place
  useEffect(() => {
    const handler = async (e) => {
      const npc = e.detail;
      if (!npc?.id) return;
      const tokenKey = `npc_${npc.id}`;

      setTokens(prev => {
        if (prev.some(t => t.id === tokenKey)) return prev; // already on map
        const next = [...prev, {
          id: tokenKey,
          type: 'npc',
          label: (npc.name || 'NPC').slice(0, 6),
          fullName: npc.name || null,
          color: '#c8a860',
          npc_id: npc.id,
          creatureName: npc.name,
          race: npc.race || null,
          x: 0.5,
          y: 0.5,
        }];

        // Persist immediately so it's visible without waiting for Commit
        if (vttSession?.id) {
          supabase.from('vtt_sessions')
            .update({ tokens: next, updated_at: new Date().toISOString() })
            .eq('id', vttSession.id)
            .then(({ error }) => { if (error) console.error('Failed to add NPC token:', error); });
        }

        return next;
      });
    };
    window.addEventListener('vtt:add_npc_token', handler);
    return () => window.removeEventListener('vtt:add_npc_token', handler);
  }, [vttSession]);

  const loadSession = async () => {
    const { data } = await supabase.from('vtt_sessions').select('*').eq('campaign_id', campaignId).maybeSingle();
    if (data) {
      setVttSession(data);
      setFogZones(data.fog_zones || []);
      setTokens(data.tokens || []);
      setMapFilename(data.map_filename);
      if (data.view_transform) setTransform(data.view_transform);
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
      await supabase.from('vtt_sessions').update({ fog_zones: fogZones, tokens, map_filename: mapFilename, view_transform: transform, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('vtt_sessions').insert({ campaign_id: targetCampaignId, map_filename: mapFilename, fog_zones: fogZones, tokens, pending_moves: [], view_transform: transform });
    }
    await supabase.from('campaigns').update({ map_url: mapFilename }).eq('id', targetCampaignId);
    setSaving(false); setShowCommitPicker(false);
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
    drawCanvas({ canvas: canvasRef.current, mapImg: mapImgRef.current, fogZones, tokens, brushPreview, tool, transform, isDM, hoveredTokenId: hoveredToken?.id || null, onIconReady: () => setIconTick(t => t + 1) });
  }, [fogZones, tokens, brushPreview, mapLoaded, tool, transform, isDM, hoveredToken, iconTick]);

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
        return { scale: newScale, x: mouseX - (mouseX - prev.x) * (newScale / prev.scale), y: mouseY - (mouseY - prev.y) * (newScale / prev.scale) };
      });
    };
    canvas.addEventListener('wheel', handler, { passive: false });
    return () => canvas.removeEventListener('wheel', handler);
  }, [mapLoaded]);

  const screenToMap = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const scaleRatio = canvas.width / rect.width;

    const canvasX = ((clientX - rect.left) * scaleRatio - t.x) / t.scale;
    const canvasY = ((clientY - rect.top) * scaleRatio - t.y) / t.scale;

    const mapRect = getMapRect(canvas, mapImgRef.current);

    return {
      x: (canvasX - mapRect.x) / mapRect.w,
      y: (canvasY - mapRect.y) / mapRect.h,
    };
  };

  const screenToCanvasPx = (clientX, clientY) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = canvas.width / rect.width;
    return { px: (clientX - rect.left) * scaleRatio, py: (clientY - rect.top) * scaleRatio };
  };

  const brushRadius = BRUSH_SIZES[brushSize];

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (e.ctrlKey && (e.button === 0 || e.buttons === 1)) {
      panRef.current = {
        active: true,
        lastX: clientX,
        lastY: clientY,
      };
      return;
    }

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
      setFogZones(prev => [...prev, zone]);
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
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < closestDist) { closest = tok.id; closestDist = d; }
      });
      setSelectedTokenId(closest);
    }
  }, [tool, brushRadius, feather, tokens]);

  const handlePointerMove = useCallback((e) => {
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

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

    if (!e.touches) {
      const canvas = canvasRef.current;
      let closest = null; let closestDist = 22 / t.scale;
      tokens.forEach(tok => {
        const dx = (tok.x - pos.x) * canvas.width;
        const dy = (tok.y - pos.y) * canvas.height;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < closestDist) { closest = tok; closestDist = d; }
      });
      setHoveredToken(closest ? { id: closest.id, name: closest.fullName || closest.creatureName || closest.label || '?', portrait_url: closest.portrait_url || null, race: closest.race || null, clientX, clientY } : null);
    }

    if (paintingRef.current && (tool === 'fog-reveal' || tool === 'fog-hide')) {
      const canvas = canvasRef.current;
      const r = brushRadius / (canvas.width * t.scale);
      const zone = { id: uid(), type: tool === 'fog-reveal' ? 'reveal' : 'hide', x: pos.x, y: pos.y, r, feather };
      setFogZones(prev => [...prev, zone]);
    }
    if (tool === 'token-move' && selectedTokenId && (e.buttons === 1 || e.touches)) {
      setTokens(prev => prev.map(t => t.id === selectedTokenId ? { ...t, x: pos.x, y: pos.y } : t));
    }
  }, [tool, brushRadius, feather, selectedTokenId, tokens]);

  const handlePointerUp = useCallback(() => {
    paintingRef.current = false;
    panRef.current.active = false;
    setSelectedTokenId(null);
  }, []);

  const handlePointerLeave = useCallback(() => {
    setBrushPreview(null);
    setHoveredToken(null);
  }, []);

  useEffect(() => {
    const handleWindowMove = (e) => {
      if (!panRef.current.active && !paintingRef.current) return;
      handlePointerMove(e);
    };
    const handleWindowUp = () => {
      handlePointerUp();
    };

    window.addEventListener('mousemove', handleWindowMove);
    window.addEventListener('mouseup', handleWindowUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const addEnemyToken = () => {
    if (!pendingClick || !newTokenLabel.trim()) return;
    setTokens(prev => [...prev, { id: uid(), type: 'enemy', label: newTokenLabel.trim(), color: newTokenColor, x: pendingClick.x, y: pendingClick.y }]);
    setNewTokenLabel(''); setShowTokenForm(false); setPendingClick(null);
  };

  const clearFog = () => setFogZones([]);
  const revealAll = () => setFogZones([{ id: uid(), type: 'reveal', x: 0.5, y: 0.5, r: 1.5 }]);
  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  const pinCampaign = (id) => {
    setPinnedCampaignId(id);
    localStorage.setItem('vtt_pinned_campaign', id);
    setShowCampaignPicker(false);
  };

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
        {isDM && (
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowCampaignPicker(p => !p)} style={{ background: 'rgba(200,168,74,0.08)', border: `1px solid rgba(200,168,74,0.3)`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8a84a' }}>
              ⚑ {dbCampaigns.find(c => String(c.id) === String(activeCampaignId))?.subtitle || 'Set Campaign'}
            </button>
            {showCampaignPicker && (
              <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#1a1714', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 8, padding: 8, zIndex: 200, minWidth: 180, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {dbCampaigns.map(c => (
                  <button key={c.id} onClick={() => pinCampaign(c.id)} style={{ background: String(c.id) === String(activeCampaignId) ? 'rgba(200,168,74,0.15)' : 'transparent', border: `1px solid ${String(c.id) === String(activeCampaignId) ? 'rgba(200,168,74,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: String(c.id) === String(activeCampaignId) ? '#e8c84a' : '#a09070', textAlign: 'left' }}>
                    {c.subtitle || c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <button onClick={syncMapFromCampaign}style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>↺ Sync Map</button>
        {mapFilename && <button onClick={() => { setMapFilename(null); setMapLoaded(false); setFogZones([]); setTokens([]); }} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.text }}>↩ Change Map</button>}
        {mapLoaded && <div style={{ ...label8, color: COLORS.dim }}>Ctrl+drag to pan · Zoom: {Math.round(transform.scale * 100)}%</div>}
        <button onClick={() => setShowCommitPicker(true)} disabled={saving || !mapFilename} style={{ marginLeft: 'auto', background: mapFilename ? 'rgba(200,168,74,0.15)' : 'transparent', border: `1px solid ${mapFilename ? '#c8a84a' : COLORS.border}`, borderRadius: 6, padding: '6px 16px', cursor: mapFilename ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: mapFilename ? '#e8c84a' : COLORS.dim, fontWeight: 700, opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Saving…' : '✦ Commit'}
        </button>
      </div>

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
          <canvas ref={canvasRef} width={900} height={600} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
            onMouseDown={handlePointerDown} onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onMouseLeave={handlePointerLeave}
            onTouchStart={handlePointerDown} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp} />
        )}
      </div>

      {hoveredToken && (
        <div style={{ position: 'fixed', left: hoveredToken.clientX, top: hoveredToken.clientY - 160, transform: 'translateX(-50%)', background: 'rgba(8,6,4,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 10, padding: 10, pointerEvents: 'none', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 110, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          {hoveredToken.portrait_url ? (
            <div style={{ width: 72, height: 96, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(200,168,74,0.4)', flexShrink: 0 }}>
              <img src={hoveredToken.portrait_url} alt={hoveredToken.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
          ) : (
            <div style={{ width: 72, height: 96, borderRadius: 6, background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'rgba(200,168,74,0.3)' }}>⚔</div>
          )}
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8d9a7', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.4 }}>{hoveredToken.name}</div>
        </div>
      )}

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

      {tokens.length > 0 && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px' }}>
          <div style={{ ...label8, marginBottom: 8 }}>Tokens on map — {tokens.length}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tokens.map(token => (
              <button
                key={token.id}
                type="button"
                onClick={() => conjureTokenToMap(token)}
                title="Conjure token to map"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: '5px 8px',
                  cursor: 'pointer',
                  color: COLORS.text,
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: token.color || '#e85d4a',
                    display: 'inline-block',
                  }}
                />

                {token.label || token.name || 'TOKEN'}

                <span
                  onClick={event => {
                    event.stopPropagation();
                    removeToken(token);
                  }}
                  title="Remove token"
                  style={{
                    color: COLORS.dim,
                    marginLeft: 4,
                    cursor: 'pointer',
                  }}
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {showCommitPicker && (
        <div onClick={() => setShowCommitPicker(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#13100d', border: '1px solid #c8a84a44', borderRadius: 12, padding: '24px 28px', minWidth: 300 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: '#e8c84a', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Commit to Campaign</div>
            <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>Choose which campaign this map and fog state applies to.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dbCampaigns.map(c => (
                <button key={c.id} onClick={() => save(c.id)} style={{ textAlign: 'left', background: 'rgba(240,238,235,0.04)', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c8a84a88'; e.currentTarget.style.background = 'rgba(200,168,74,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = 'rgba(240,238,235,0.04)'; }}
                >
                  <div style={{ fontSize: 8, color: COLORS.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, fontFamily: "'Cinzel', serif" }}>{c.type || 'Campaign'}</div>
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