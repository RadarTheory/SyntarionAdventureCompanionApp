import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;

const raceIconCache = {};
function getRaceIcon(race, onReady) {
  if (!race) return null;
  const key = race.toLowerCase().replace(/[^a-z]/g, '');
  if (raceIconCache[key] === undefined) {
    raceIconCache[key] = null;
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
        d[i + 3] = 255 - luminance;
      }
      octx.putImageData(imgData, 0, 0);
      raceIconCache[key] = off;
      onReady?.();
    };
    img.onerror = () => { raceIconCache[key] = false; };
    img.src = `/RaceIcons/${key}.png`;
  }
  return raceIconCache[key] || null;
}

function getMapRect(canvas, mapImg) {
  const W = canvas.width, H = canvas.height;
  const imgRatio = mapImg.width / mapImg.height;
  const canvasRatio = W / H;
  let drawW, drawH;
  if (imgRatio > canvasRatio) { drawW = W; drawH = W / imgRatio; }
  else { drawH = H; drawW = H * imgRatio; }
  return { x: (W - drawW) / 2, y: (H - drawH) / 2, w: drawW, h: drawH };
}

function isTokenFogged(tok, fogZones) {
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

function drawViewer({ canvas, mapImg, fogZones, tokens, transform, pendingMoves, draggingToken, dragPos, userCharId, hoveredTokenId }) {
  if (!canvas || !mapImg) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const mapRect = getMapRect(canvas, mapImg);

  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
  ctx.drawImage(mapImg, mapRect.x, mapRect.y, mapRect.w, mapRect.h);

  // Fog
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

  // Pending move waypoint lines for own character
  const myMoves = (pendingMoves || []).filter(m => String(m.characterId) === String(userCharId));
  if (myMoves.length > 0) {
    const myToken = tokens.find(t => String(t.characterId) === String(userCharId));
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = 'rgba(121,245,167,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (myToken) { ctx.moveTo(mapRect.x + myToken.x * mapRect.w, mapRect.y + myToken.y * mapRect.h); }
    myMoves.forEach(m => ctx.lineTo(mapRect.x + m.x * mapRect.w, mapRect.y + m.y * mapRect.h));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

 // Tokens
  tokens.forEach(tok => {
    const isOwn = String(tok.characterId) === String(userCharId);
    // Players never see fogged tokens — except their own, which they can always see.
    if (!isOwn && isTokenFogged(tok, fogZones)) return;

    const hasPending = isOwn && myMoves.length > 0;
    const isDragging = draggingToken && tok.id === draggingToken.id;
    if (isDragging) return;

    const isHovered = hoveredTokenId && tok.id === hoveredTokenId;
    const tx = mapRect.x + tok.x * mapRect.w;
    const ty = mapRect.y + tok.y * mapRect.h;
    const r = isHovered ? 22 : 14;
    ctx.save();
    ctx.globalAlpha = hasPending ? 0.4 : 1;
    if (tok.type === 'player') { ctx.beginPath(); ctx.roundRect(tx - r, ty - r, r * 2, r * 2, 4); }
    else { ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); }
    ctx.fillStyle = tok.color || '#e85d4a';
    ctx.fill();
    ctx.strokeStyle = isHovered ? '#e8c84a' : (isOwn ? '#79f5a7' : '#fff');
    ctx.lineWidth = isHovered ? 3 : (isOwn ? 2.5 : 2);
    ctx.stroke();
    ctx.globalAlpha = hasPending ? 0.5 : 1;
    const icon = tok.race ? getRaceIcon(tok.race, () => setIconTick(t => t + 1)) : null;
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

  // Dragging ghost token
  if (draggingToken && dragPos) {
    const tx = mapRect.x + dragPos.x * mapRect.w;
    const ty = mapRect.y + dragPos.y * mapRect.h;
    const r = 14;
    ctx.save();
    ctx.globalAlpha = 0.75;
    if (draggingToken.type === 'player') { ctx.beginPath(); ctx.roundRect(tx - r, ty - r, r * 2, r * 2, 4); }
    else { ctx.beginPath(); ctx.arc(tx, ty, r, 0, Math.PI * 2); }
    ctx.fillStyle = draggingToken.color || '#e85d4a';
    ctx.fill();
    ctx.strokeStyle = '#79f5a7'; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((draggingToken.label || '?').slice(0, 3), tx, ty);
    ctx.restore();
  }

  // Pending X markers
  (pendingMoves || []).forEach(move => {
    const tx = mapRect.x + move.x * mapRect.w;
    const ty = mapRect.y + move.y * mapRect.h;
    const isOwn = String(move.characterId) === String(userCharId);
    const color = isOwn ? '#79f5a7' : '#e8c84a';
    const waypointNum = isOwn ? myMoves.findIndex(m => m.id === move.id) + 1 : null;

    ctx.save();
    ctx.beginPath();
    ctx.arc(tx, ty, 12, 0, Math.PI * 2);
    ctx.fillStyle = isOwn ? 'rgba(121,245,167,0.15)' : 'rgba(200,168,74,0.15)';
    ctx.fill();
    ctx.setLineDash([4, 3]);
    ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tx - 5, ty - 5); ctx.lineTo(tx + 5, ty + 5);
    ctx.moveTo(tx + 5, ty - 5); ctx.lineTo(tx - 5, ty + 5);
    ctx.stroke();
    if (waypointNum) {
      ctx.fillStyle = color; ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(waypointNum), tx + 10, ty - 10);
    }
    ctx.restore();
  });

  ctx.restore();
}

export default function VTTViewer({ campaignId, userChar }) {
  const canvasRef   = useRef(null);
  const mapImgRef   = useRef(null);
  const panRef      = useRef({ panning: false, lastX: 0, lastY: 0 });
  const pinchRef    = useRef({ active: false, lastDist: 0 });
  const dragRef     = useRef({ dragging: false, token: null, startX: 0, startY: 0, moved: false });

  const [transform, setTransform]         = useState({ scale: 1, x: 0, y: 0 });
  const [fogZones, setFogZones]           = useState([]);
  const [tokens, setTokens]               = useState([]);
  const [pendingMoves, setPendingMoves]   = useState([]);
  const [mapFilename, setMapFilename]     = useState(null);
  const [mapLoaded, setMapLoaded]         = useState(false);
  const [fullscreen, setFullscreen]       = useState(false);
  const [draggingToken, setDraggingToken] = useState(null);
  const [dragPos, setDragPos]             = useState(null);
  const [vttSession, setVttSession]       = useState(null);
 const [hoveredToken, setHoveredToken]   = useState(null); // { id, name, clientX, clientY }
  const [iconTick, setIconTick] = useState(0);

  const transformRef    = useRef(transform);
  const tokensRef       = useRef(tokens);
  const pendingMovesRef = useRef(pendingMoves);
  const vttSessionRef   = useRef(vttSession);

  useEffect(() => { transformRef.current = transform; }, [transform]);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);
  useEffect(() => { pendingMovesRef.current = pendingMoves; }, [pendingMoves]);
  useEffect(() => { vttSessionRef.current = vttSession; }, [vttSession]);

  const userCharId = userChar?.id ? String(userChar.id) : null;

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
      setVttSession(data);
      setFogZones(data.fog_zones || []);
      setTokens(data.tokens || []);
      setPendingMoves(data.pending_moves || []);
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
    drawViewer({ canvas: canvasRef.current, mapImg: mapImgRef.current, fogZones, tokens, transform, pendingMoves, draggingToken, dragPos, userCharId, hoveredTokenId: hoveredToken?.id || null });
  }, [fogZones, tokens, mapLoaded, transform, pendingMoves, draggingToken, dragPos, userCharId, hoveredToken, iconTick]);

  // Wheel zoom
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

  // Convert client coords → normalized map coords (matching VTTCanvas system)
  const clientToMapCoords = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const mapImg = mapImgRef.current;
    if (!canvas || !mapImg) return { x: 0.5, y: 0.5 };
    const rect = canvas.getBoundingClientRect();
    const t = transformRef.current;
    const scaleRatio = canvas.width / rect.width;
    const canvasX = ((clientX - rect.left) * scaleRatio - t.x) / t.scale;
    const canvasY = ((clientY - rect.top) * scaleRatio - t.y) / t.scale;
    const mapRect = getMapRect(canvas, mapImg);
    return {
      x: (canvasX - mapRect.x) / mapRect.w,
      y: (canvasY - mapRect.y) / mapRect.h,
    };
  }, []);

  const hitTestToken = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const mapImg = mapImgRef.current;
    if (!canvas || !mapImg) return null;
    const pos = clientToMapCoords(clientX, clientY);
    const t = transformRef.current;
    const mapRect = getMapRect(canvas, mapImg);
    const HIT_R = 18 / (mapRect.w * t.scale);
    return tokensRef.current.find(tok => {
      const dx = tok.x - pos.x, dy = tok.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < HIT_R;
    }) || null;
  }, [clientToMapCoords]);

  const hitTestPendingX = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const mapImg = mapImgRef.current;
    if (!canvas || !mapImg || !userCharId) return null;
    const pos = clientToMapCoords(clientX, clientY);
    const t = transformRef.current;
    const mapRect = getMapRect(canvas, mapImg);
    const HIT_R = 16 / (mapRect.w * t.scale);
    return pendingMovesRef.current.find(m => {
      if (String(m.characterId) !== userCharId) return false;
      const dx = m.x - pos.x, dy = m.y - pos.y;
      return Math.sqrt(dx * dx + dy * dy) < HIT_R;
    }) || null;
  }, [clientToMapCoords, userCharId]);

  const persistPendingMoves = async (moves) => {
    const session = vttSessionRef.current;
    if (!session?.id) return;
    await supabase.from('vtt_sessions').update({ pending_moves: moves }).eq('id', session.id);
  };

  const addWaypoint = async (x, y) => {
    if (!userCharId) return;
    const newMove = {
      id: Math.random().toString(36).slice(2, 9),
      characterId: userCharId,
      characterName: userChar?.name || 'Player',
      x, y,
      createdAt: new Date().toISOString(),
    };
    const next = [...pendingMovesRef.current, newMove];
    setPendingMoves(next);
    pendingMovesRef.current = next;

    const { data: hsession } = await supabase
      .from('hercules_sessions').select('id')
      .eq('campaign_id', campaignId).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (hsession?.id) {
      const myMoves = next.filter(m => m.characterId === userCharId);
      await supabase.from('hercules_events').insert({
        session_id: hsession.id,
        type: 'move_request',
        actor_name: userChar?.name || 'Player',
        actor_id: userCharId,
        description: `${userChar?.name || 'Player'} requests move — waypoint ${myMoves.length}.`,
      });
    }
    await persistPendingMoves(next);
  };

  const removeWaypoint = async (moveId) => {
    const next = pendingMovesRef.current.filter(m => m.id !== moveId);
    setPendingMoves(next);
    pendingMovesRef.current = next;
    await persistPendingMoves(next);
  };

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    const { clientX, clientY } = e;

    const hitX = hitTestPendingX(clientX, clientY);
    if (hitX) { removeWaypoint(hitX.id); return; }

    const hitTok = hitTestToken(clientX, clientY);
    if (hitTok && userCharId && String(hitTok.characterId) === userCharId) {
      dragRef.current = { dragging: true, token: hitTok, startX: clientX, startY: clientY, moved: false };
      setDraggingToken(hitTok);
      setDragPos({ x: hitTok.x, y: hitTok.y });
      return;
    }
    panRef.current = { panning: true, lastX: clientX, lastY: clientY };
  }, [hitTestPendingX, hitTestToken, userCharId]);

  const handleMouseMove = useCallback((e) => {
    const { clientX, clientY } = e;
    if (dragRef.current.dragging) {
      const dx = clientX - dragRef.current.startX;
      const dy = clientY - dragRef.current.startY;
      if (Math.sqrt(dx * dx + dy * dy) > 4) dragRef.current.moved = true;
      const pos = clientToMapCoords(clientX, clientY);
      dragRef.current._lastDragPos = pos;
      setDragPos(pos);
      return;
    }
    if (panRef.current.panning) {
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
    const hit = hitTestToken(clientX, clientY);
    setHoveredToken(hit ? { id: hit.id, name: hit.fullName || hit.creatureName || hit.label || '?', portrait_url: hit.portrait_url || null, clientX, clientY } : null);
  }, [clientToMapCoords, hitTestToken]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.dragging && dragRef.current.moved && dragRef.current._lastDragPos) {
      const dp = dragRef.current._lastDragPos;
      addWaypoint(dp.x, dp.y);
    }
    dragRef.current = { dragging: false, token: null, startX: 0, startY: 0, moved: false, _lastDragPos: null };
    setDraggingToken(null);
    setDragPos(null);
    setHoveredToken(null);
    panRef.current.panning = false;
  }, [clientToMapCoords]);

  // Track dragPos in ref so mouseUp can read it
  useEffect(() => {
    if (dragRef.current.dragging && dragPos) {
      dragRef.current._lastDragPos = dragPos;
    }
  }, [dragPos]);

  // Touch handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = { active: true, lastDist: Math.sqrt(dx * dx + dy * dy) };
      return;
    }
    const { clientX, clientY } = e.touches[0];
    const hitX = hitTestPendingX(clientX, clientY);
    if (hitX) { removeWaypoint(hitX.id); return; }
    const hitTok = hitTestToken(clientX, clientY);
    if (hitTok && userCharId && String(hitTok.characterId) === userCharId) {
      dragRef.current = { dragging: true, token: hitTok, startX: clientX, startY: clientY, moved: false, _lastDragPos: null };
      setDraggingToken(hitTok);
      setDragPos({ x: hitTok.x, y: hitTok.y });
      return;
    }
    panRef.current = { panning: true, lastX: clientX, lastY: clientY, startX: clientX, startY: clientY, tapped: false };
  }, [hitTestPendingX, hitTestToken, userCharId]);

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
      return;
    }
    if (dragRef.current.dragging) {
      const { clientX, clientY } = e.touches[0];
      const ddx = clientX - dragRef.current.startX;
      const ddy = clientY - dragRef.current.startY;
      if (Math.sqrt(ddx * ddx + ddy * ddy) > 4) dragRef.current.moved = true;
      const pos = clientToMapCoords(clientX, clientY);
      dragRef.current._lastDragPos = pos;
      setDragPos(pos);
      return;
    }
    if (panRef.current.panning) {
      const { clientX, clientY } = e.touches[0];
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleRatio = canvas.width / rect.width;
      const dx = (clientX - panRef.current.lastX) * scaleRatio;
      const dy = (clientY - panRef.current.lastY) * scaleRatio;
      panRef.current.lastX = clientX;
      panRef.current.lastY = clientY;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }
  }, [clientToMapCoords]);

  const handleTouchEnd = useCallback((e) => {
    if (dragRef.current.dragging && dragRef.current.moved && dragRef.current._lastDragPos) {
      addWaypoint(dragRef.current._lastDragPos.x, dragRef.current._lastDragPos.y);
    }
    // Tap detection — show portrait card on token tap
    if (panRef.current.panning && !dragRef.current.dragging) {
      const touch = e?.changedTouches?.[0];
      if (touch) {
        const dx = touch.clientX - panRef.current.startX;
        const dy = touch.clientY - panRef.current.startY;
        if (Math.sqrt(dx * dx + dy * dy) < 8) {
          // It was a tap, not a pan
          const hitTok = hitTestToken(touch.clientX, touch.clientY);
          if (hitTok) {
            setHoveredToken(prev => prev?.id === hitTok.id ? null : { id: hitTok.id, name: hitTok.fullName || hitTok.creatureName || hitTok.label || '?', portrait_url: hitTok.portrait_url || null, clientX: touch.clientX, clientY: touch.clientY });
          } else {
            setHoveredToken(null);
          }
        }
      }
    }
    dragRef.current = { dragging: false, token: null, startX: 0, startY: 0, moved: false, _lastDragPos: null };
    setDraggingToken(null);
    setDragPos(null);
    pinchRef.current.active = false;
    panRef.current.panning = false;
  }, []);

  const resetView = () => setTransform({ scale: 1, x: 0, y: 0 });

  const myPendingMoves = pendingMoves.filter(m => String(m.characterId) === userCharId);

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

      {myPendingMoves.length > 0 && (
        <div style={{ background: 'rgba(121,245,167,0.07)', border: '1px solid rgba(121,245,167,0.3)', borderRadius: 6, padding: '7px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#79f5a7', letterSpacing: '0.08em' }}>
            ✥ {myPendingMoves.length} move request{myPendingMoves.length > 1 ? 's' : ''} pending — awaiting Architect approval
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {myPendingMoves.map((m, i) => (
              <button key={m.id} onClick={() => removeWaypoint(m.id)}
                style={{ background: 'rgba(121,245,167,0.1)', border: '1px solid rgba(121,245,167,0.35)', borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#79f5a7' }}>
                ✕ {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {userCharId && myPendingMoves.length === 0 && (
        <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          Drag your token to request a move · Tap an ✕ on the map or the buttons above to remove a waypoint
        </div>
      )}

      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: '#0d0b09', cursor: draggingToken ? 'grabbing' : 'grab' }}>
        {!mapLoaded ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: COLORS.dim, fontSize: 12 }}>Loading map…</div>
        ) : (
          <canvas ref={canvasRef} width={900} height={600} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none' }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={(e) => handleTouchEnd(e)} />
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

      {fullscreen && mapLoaded && (
        <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <canvas
            ref={node => { if (node) drawViewer({ canvas: node, mapImg: mapImgRef.current, fogZones, tokens, transform, pendingMoves, draggingToken: null, dragPos: null, userCharId }); }}
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
