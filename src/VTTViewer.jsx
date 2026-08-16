import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from './lib/supabase';
import { COLORS, ALL_CLASSES } from './constants';
import { computeCrowdedKeys, tokenLayoutKey } from './lib/tokenLayout';
import { logSessionEvent } from './lib/sessionEvents';
import { useActiveGameSession } from './lib/session';

const MIN_SCALE = 0.5;
const MAX_SCALE = 8;
const MOVE_INTENTS = ['Move', 'Sneak', 'Scout', 'Approach', 'Retreat', 'Follow', 'Guard', 'Search', 'Interact'];

function moveIntentText(intent) {
  return intent || 'Move';
}

function coordText(pos) {
  return `${Math.round(Number(pos?.x || 0) * 100)},${Math.round(Number(pos?.y || 0) * 100)}`;
}

const raceIconCache = {};
const classIconCache = {};

function normalizeIconKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z]/g, '');
}

function tokenClassId(token) {
  const raw = token?.cid || token?.classId || token?.class_id || token?.className || token?.class || token?.cp;
  if (!raw) return null;
  const direct = String(raw);
  const matched = ALL_CLASSES?.find(cls => String(cls.id) === direct || normalizeIconKey(cls.name) === normalizeIconKey(direct));
  return matched?.id || normalizeIconKey(direct);
}

function makeSilhouetteCanvas(img) {
  const off = document.createElement('canvas');
  off.width = img.width; off.height = img.height;
  const octx = off.getContext('2d');
  octx.drawImage(img, 0, 0);
  const imgData = octx.getImageData(0, 0, off.width, off.height);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const sourceAlpha = d[i + 3];
    const luminance = (d[i] + d[i + 1] + d[i + 2]) / 3;
    d[i] = 255; d[i + 1] = 255; d[i + 2] = 255;
    d[i + 3] = Math.round(sourceAlpha * ((255 - luminance) / 255));
  }
  octx.putImageData(imgData, 0, 0);
  return off;
}

function getRaceIcon(race, onReady) {
  if (!race) return null;
  const key = normalizeIconKey(race);
  if (raceIconCache[key] === undefined) {
    raceIconCache[key] = null;
    const img = new Image();
    img.onload = () => {
      raceIconCache[key] = makeSilhouetteCanvas(img);
      onReady?.();
    };
    img.onerror = () => { raceIconCache[key] = false; };
    img.src = `/RaceIcons/${key}.png`;
  }
  return raceIconCache[key] || null;
}

function getClassIcon(classId, onReady) {
  if (!classId) return null;
  const key = tokenClassId({ cid: classId });
  if (!key) return null;
  if (classIconCache[key] === undefined) {
    classIconCache[key] = null;
    const img = new Image();
    img.onload = () => {
      classIconCache[key] = makeSilhouetteCanvas(img);
      onReady?.();
    };
    img.onerror = () => { classIconCache[key] = false; };
    img.src = `/ClassIcons/${key}.png`;
  }
  return classIconCache[key] || null;
}

function tokenSymbolIcon(token, onReady) {
  return getClassIcon(tokenClassId(token), onReady) || (token?.race ? getRaceIcon(token.race, onReady) : null);
}

const rawIconCache = {};
function getRawIcon(src, onReady) {
  if (rawIconCache[src] === undefined) {
    rawIconCache[src] = null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { rawIconCache[src] = img; onReady?.(); };
    img.onerror = () => { rawIconCache[src] = false; };
    img.src = src;
  }
  return rawIconCache[src] || null;
}

function drawImageCover(ctx, img, x, y, w, h, alignY = 0.18) {
  if (!img?.width || !img?.height || !w || !h) return;
  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;
  if (imgRatio > boxRatio) {
    sw = img.height * boxRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / boxRatio;
    sy = Math.max(0, Math.min(img.height - sh, (img.height - sh) * alignY));
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function tokenName(token) {
  return token?.fullName || token?.name || token?.creatureName || token?.character_name || token?.label || 'Token';
}

function drawBeastGlyph(ctx, token, x, y, size, color = '#fff1c6') {
  const s = size;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.2, s * 0.12);

  ctx.beginPath();
  ctx.moveTo(x - 0.36 * s, y - 0.2 * s);
  ctx.lineTo(x - 0.1 * s, y - 0.08 * s);
  ctx.moveTo(x + 0.36 * s, y - 0.2 * s);
  ctx.lineTo(x + 0.1 * s, y - 0.08 * s);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 0.42 * s, y + 0.06 * s);
  ctx.quadraticCurveTo(x, y + 0.34 * s, x + 0.42 * s, y + 0.06 * s);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 0.22 * s, y + 0.11 * s);
  ctx.lineTo(x - 0.1 * s, y + 0.38 * s);
  ctx.lineTo(x + 0.02 * s, y + 0.1 * s);
  ctx.moveTo(x + 0.22 * s, y + 0.11 * s);
  ctx.lineTo(x + 0.1 * s, y + 0.38 * s);
  ctx.lineTo(x - 0.02 * s, y + 0.1 * s);
  ctx.fill();
  ctx.restore();
}

const TOKEN_STYLE = {
  enemyFill: '#9f3f3f',
  enemyRim: '#4b1918',
  playerFallback: '#4f86ad',
  playerRim: '#172536',
  hover: '#d7b95f',
  own: '#79d69a',
  iconLight: 'rgba(255,246,214,0.88)',
  iconDark: 'rgba(20,11,9,0.72)',
};

// The Scribe's forge composes a 512px token: portrait ring centred at (256,246)
// with radius 174, a drop-shadow ellipse below it, and the character's name across
// the bottom. On the map we want the ring alone — the name is drawn on canvas
// instead, where it stays sharp at any zoom rather than being a 22px baked bitmap.
// half=195 is the window between the ring's outer edge (192.8 from centre, its
// thickest Standee variant) and the top of the name band (198 from centre): the
// full ring survives, no name pixels do.
const FORGE_TOKEN = { size: 512, cx: 256, cy: 246, half: 195 };

function tokenFill(tok, isEnemyTok) {
  return isEnemyTok ? TOKEN_STYLE.enemyFill : (tok.color || TOKEN_STYLE.playerFallback);
}

function tokenRim(tok, isEnemyTok, isOwn = false) {
  if (isOwn) return '#1e4b35';
  return isEnemyTok ? TOKEN_STYLE.enemyRim : TOKEN_STYLE.playerRim;
}

function drawTokenShape(ctx, tok, x, y, r, fill, rim, { hovered = false } = {}) {
  const isPlayer = tok.type === 'player';
  const inset = Math.max(2, r * 0.16);

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = hovered ? 9 : 5;
  ctx.shadowOffsetY = hovered ? 3 : 2;

  if (isPlayer) { ctx.beginPath(); ctx.roundRect(x - r, y - r, r * 2, r * 2, 5); }
  else { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  ctx.fillStyle = fill;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.lineWidth = hovered ? 2.4 : 1.8;
  ctx.strokeStyle = rim;
  ctx.stroke();

  if (isPlayer) { ctx.beginPath(); ctx.roundRect(x - r + inset, y - r + inset, (r - inset) * 2, (r - inset) * 2, 4); }
  else { ctx.beginPath(); ctx.arc(x, y, r - inset, 0, Math.PI * 2); }
  ctx.lineWidth = 1;
  ctx.strokeStyle = hovered ? 'rgba(255,239,166,0.75)' : 'rgba(255,244,214,0.28)';
  ctx.stroke();
  ctx.restore();
}

// Tokens carrying art are always circular, whatever their type. The forge press
// produces a round ringed portrait, so clipping it to the player rounded-square
// left dead corners and framed a circle inside a square. Faction is carried by
// the ring colour instead; the rounded square survives only in the no-art
// fallback below, where shape is the only thing distinguishing a plain token.
function clipTokenCircle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

// The canvas is authored in a fixed 900x600 coordinate space and then stretched
// by CSS to whatever the window is. On a Mapcast window at ~1900px that was a
// better-than-2x upscale of every pixel, which is what made tokens and their name
// labels look soft. Keep the logical space — every draw call below depends on it —
// and raise only the backing store to real device pixels.
const LOGICAL_W = 900;
const LOGICAL_H = 600;
// 4x logical is already 3600px wide; beyond that the memory cost outruns any
// visible gain, and some mobile GPUs refuse the allocation outright.
const MAX_RENDER_SCALE = 4;

function fitCanvasToDisplay(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const displayed = rect.width || LOGICAL_W;
  const scale = Math.min(MAX_RENDER_SCALE, Math.max(1, (displayed / LOGICAL_W) * dpr));
  const w = Math.round(LOGICAL_W * scale);
  const h = Math.round(LOGICAL_H * scale);
  // Assigning width/height wipes the context state, so only touch it on a change.
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return scale;
}

function getMapRect(canvas, mapImg) {
  const W = LOGICAL_W, H = LOGICAL_H;
  const imgRatio = mapImg.width / mapImg.height;
  const canvasRatio = W / H;
  let drawW, drawH;
  if (imgRatio > canvasRatio) { drawW = W; drawH = W / imgRatio; }
  else { drawH = H; drawW = H * imgRatio; }
  return { x: (W - drawW) / 2, y: (H - drawH) / 2, w: drawW, h: drawH };
}

function isTokenFogged(tok, fogZones) {
  const inZone = (zone) => {
    const dx = tok.x - zone.x;
    const dy = tok.y - zone.y;
    return Math.sqrt(dx * dx + dy * dy) <= zone.r;
  };
  const revealZones = fogZones.filter(z => z.type === 'reveal');
  let fogged = revealZones.length > 0;
  if (revealZones.length > 0 && revealZones.some(inZone)) fogged = false;
  for (const zone of fogZones) {
    if (!inZone(zone)) continue;
    if (zone.type === 'hide') fogged = true;
    if (zone.type === 'reveal') fogged = false;
  }
  return fogged;
}
function drawViewer({ canvas, mapImg, fogZones, tokens, transform, pendingMoves, draggingToken, dragPos, userCharId, hoveredTokenId, onIconReady }) {
  if (!canvas || !mapImg) return;
  const ctx = canvas.getContext('2d');
  // renderScale maps the logical 900x600 space onto the real backing store.
  const renderScale = fitCanvasToDisplay(canvas);
  const W = LOGICAL_W, H = LOGICAL_H;
  const mapRect = getMapRect(canvas, mapImg);

  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  // Compose the pan/zoom on top of renderScale — a bare setTransform here would
  // discard it and put us back at 900x600.
  ctx.setTransform(
    renderScale * transform.scale, 0,
    0, renderScale * transform.scale,
    renderScale * transform.x, renderScale * transform.y,
  );
  ctx.drawImage(mapImg, mapRect.x, mapRect.y, mapRect.w, mapRect.h);

  // Fog
  const fogCanvas = document.createElement('canvas');
  fogCanvas.width = W; fogCanvas.height = H;
  const fogCtx = fogCanvas.getContext('2d');
  fogCtx.fillStyle = 'rgba(10,8,6,1)';
  fogCtx.fillRect(0, 0, W, H);
  fogZones.forEach(zone => {
    const cx = mapRect.x + zone.x * mapRect.w;
    const cy = mapRect.y + zone.y * mapRect.h;
    const r = zone.r * mapRect.w;
    const feather = zone.feather ?? 0.35;
    const inner = Math.max(0, r * (1 - feather));
    if (zone.type === 'reveal') {
      fogCtx.globalCompositeOperation = 'destination-out';
      fogCtx.beginPath();
      fogCtx.arc(cx, cy, inner, 0, Math.PI * 2);
      fogCtx.fillStyle = 'rgba(0,0,0,1)';
      fogCtx.fill();
      const grad = fogCtx.createRadialGradient(cx, cy, inner, cx, cy, r);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      fogCtx.beginPath();
      fogCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fogCtx.fillStyle = grad;
      fogCtx.fill();
    } else if (zone.type === 'hide') {
      fogCtx.globalCompositeOperation = 'source-over';
      const grad = fogCtx.createRadialGradient(cx, cy, inner, cx, cy, r);
      grad.addColorStop(0, 'rgba(10,8,6,1)');
      grad.addColorStop(1, 'rgba(10,8,6,0)');
      fogCtx.beginPath();
      fogCtx.arc(cx, cy, r, 0, Math.PI * 2);
      fogCtx.fillStyle = grad;
      fogCtx.fill();
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
  // Tokens never move; where full portraits would collide we draw compact pins.
  const crowdedKeys = computeCrowdedKeys(tokens, mapRect);
  tokens.forEach((tok, tokIndex) => {
    const isOwn = String(tok.characterId) === String(userCharId);
    // Players never see fogged tokens — except their own, which they can always see.
    if (!isOwn && isTokenFogged(tok, fogZones)) return;

    const hasPending = isOwn && myMoves.length > 0;
    const isDragging = draggingToken && tok.id === draggingToken.id;
    if (isDragging) return;

    const isHovered = hoveredTokenId && tok.id === hoveredTokenId;
    // Enemies/creatures always read as red on the map; players keep their color.
    // Mirrors VTTCanvas (the DM map) so both views agree on friend vs foe.
    const isEnemyTok = tok.type !== 'player';
    const tx = mapRect.x + tok.x * mapRect.w;
    const ty = mapRect.y + tok.y * mapRect.h;
    const r = isHovered ? 19 : 13;
    ctx.save();
    ctx.globalAlpha = hasPending ? 0.4 : 1;

    // Crowded tokens collapse to a small pin on their exact spot (hover shows the card).
    if (crowdedKeys.has(tokenLayoutKey(tok, tokIndex)) && !isHovered) {
      const pr = 5;
      drawTokenShape(ctx, tok, tx, ty, pr, tokenFill(tok, isEnemyTok), tokenRim(tok, isEnemyTok, isOwn));
      const pinIcon = tokenSymbolIcon(tok, onIconReady);
      if (pinIcon) {
        ctx.globalAlpha *= 0.78;
        const iconSize = pr * 1.35;
        ctx.drawImage(pinIcon, tx - iconSize / 2, ty - iconSize / 2, iconSize, iconSize);
      } else if (isEnemyTok) {
        drawBeastGlyph(ctx, tok, tx, ty, pr * 1.1, TOKEN_STYLE.iconDark);
      }
      ctx.restore();
      return;
    }

    const rim = isHovered ? TOKEN_STYLE.hover : tokenRim(tok, isEnemyTok, isOwn);
    ctx.globalAlpha = hasPending ? 0.5 : 1;
    const tokenArt = tok.sprite_url || tok.portrait_url || null;
    const tokenImg = tokenArt ? getRawIcon(tokenArt, onIconReady) : null;
    if (tokenImg) {
      // Confirmed art already carries its own frame, so the map contributes a
      // single state ring rather than a filled shape plus two strokes plus an
      // inset clip. The portrait gets the area that chrome used to occupy, and
      // the ring still encodes enemy / player / yours / hovered.
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = isHovered ? 9 : 5;
      ctx.shadowOffsetY = isHovered ? 3 : 2;
      clipTokenCircle(ctx, tx, ty, r);
      ctx.fillStyle = 'rgba(12,9,7,0.92)'; // backing so the shadow has something to cast from
      ctx.fill();
      ctx.restore();

      ctx.save();
      clipTokenCircle(ctx, tx, ty, r);
      ctx.clip();
      if (tok.sprite_url && tokenImg.width === FORGE_TOKEN.size) {
        // Forge sprite: crop to the ring, dropping the baked name and shadow band.
        const { cx, cy, half } = FORGE_TOKEN;
        ctx.drawImage(tokenImg, cx - half, cy - half, half * 2, half * 2, tx - r, ty - r, r * 2, r * 2);
      } else {
        // A raw portrait rather than a forged token — no baked furniture to trim.
        drawImageCover(ctx, tokenImg, tx - r, ty - r, r * 2, r * 2);
      }
      ctx.restore();

      ctx.save();
      clipTokenCircle(ctx, tx, ty, r);
      ctx.lineWidth = Math.max(1.5, r * (isHovered ? 0.13 : 0.1));
      ctx.strokeStyle = isOwn ? TOKEN_STYLE.own : (isHovered ? TOKEN_STYLE.hover : tokenFill(tok, isEnemyTok));
      ctx.stroke();
      ctx.restore();
    } else {
      drawTokenShape(ctx, tok, tx, ty, r, tokenFill(tok, isEnemyTok), rim, { hovered: isHovered });
      const icon = tokenSymbolIcon(tok, onIconReady);
      if (icon) {
        ctx.globalAlpha *= 0.82;
        const iconSize = r * 1.12;
        ctx.drawImage(icon, tx - iconSize / 2, ty - iconSize / 2, iconSize, iconSize);
      } else {
        if (isEnemyTok) {
          drawBeastGlyph(ctx, tok, tx, ty, r * 0.92, TOKEN_STYLE.iconDark);
        } else {
          ctx.fillStyle = TOKEN_STYLE.iconLight; ctx.font = `bold ${isHovered ? 12 : 9}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText((tok.label || '?').slice(0, 3), tx, ty);
        }
      }
    }
    if (tok.status === 'dead' && tok.type !== 'player') {
      const deathIcon = getRawIcon('/death.png', onIconReady);
      if (deathIcon) {
        ctx.globalAlpha = 0.85;
        ctx.drawImage(deathIcon, tx - r, ty - r, r * 2, r * 2);
      } else {
        ctx.fillStyle = 'rgba(224,90,90,0.9)';
        ctx.font = `bold ${r}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('☠', tx, ty);
      }
    }

    // Floating name, drawn on the map rather than baked into the sprite so it
    // stays sharp at any zoom. Player tokens only — an enemy's real name is the
    // DM's to reveal, and these labels are visible to the whole table.
    if (tok.type === 'player') {
      const label = tokenName(tok);
      if (label) {
        const fs = Math.max(5, r * 0.4);
        ctx.save();
        ctx.font = `700 ${fs}px 'Cinzel', Georgia, serif`;
        ctx.textAlign = 'center';
        // Hover grows both the token and its label, so a name below it lands on
        // whatever token sits underneath. Flip above while hovered.
        ctx.textBaseline = isHovered ? 'bottom' : 'top';
        // Outline instead of a plate: legible over dark stone or bright sand
        // without boxing in the token.
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.lineWidth = Math.max(1.5, fs * 0.36);
        ctx.strokeStyle = 'rgba(8,6,4,0.9)';
        const nameGap = Math.max(2, r * 0.18);
        const ly = isHovered ? ty - r - nameGap : ty + r + nameGap;
        ctx.strokeText(label, tx, ly);
        ctx.fillStyle = isOwn ? TOKEN_STYLE.own : (isHovered ? TOKEN_STYLE.hover : '#f2e6c8');
        ctx.fillText(label, tx, ly);
        ctx.restore();
      }
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

export default function VTTViewer({ campaignId, userChar, castMode = false }) {
  const canvasRef   = useRef(null);
  const mapImgRef   = useRef(null);
  const castShellRef = useRef(null);
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
 const [hoveredToken, setHoveredToken]   = useState(null);
  const [iconTick, setIconTick] = useState(0);
  const [portraitFullscreen, setPortraitFullscreen] = useState(null);
  const [moveIntent, setMoveIntent] = useState('Move');
  const [moveNote, setMoveNote] = useState('');
  const [castRotation, setCastRotation] = useState(0);

  const transformRef    = useRef(transform);
  const tokensRef       = useRef(tokens);
  const pendingMovesRef = useRef(pendingMoves);
  const vttSessionRef   = useRef(vttSession);
  const activeGameSessionId = useActiveGameSession(campaignId);
  // Saved zoom/pan applies only on the first load — never on realtime refreshes
  // (commits, moves) — so a pan/zoom set on this window stays put.
  const hasLoadedTransformRef = useRef(false);

  useEffect(() => { transformRef.current = transform; }, [transform]);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);
  useEffect(() => { pendingMovesRef.current = pendingMoves; }, [pendingMoves]);
  useEffect(() => { vttSessionRef.current = vttSession; }, [vttSession]);

  const userCharId = userChar?.id ? String(userChar.id) : null;
  const normalizedCastRotation = ((castRotation % 360) + 360) % 360;
  const castTurnedSideways = normalizedCastRotation === 90 || normalizedCastRotation === 270;
  const castCanvasScale = castTurnedSideways ? 0.66 : 1;

  const handleCastKeyDown = useCallback((e) => {
    if (!castMode) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'ArrowLeft') setCastRotation(prev => prev - 90);
    if (e.key === 'ArrowRight') setCastRotation(prev => prev + 90);
    if (e.key === 'ArrowUp') setCastRotation(0);
    if (e.key === 'ArrowDown') setCastRotation(180);
  }, [castMode]);

  useEffect(() => {
    if (!campaignId) return;
    hasLoadedTransformRef.current = false; // apply the saved view once for this campaign
    loadSession();
    const sub = supabase
      .channel(`vtt-viewer-${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vtt_sessions', filter: `campaign_id=eq.${campaignId}` }, () => loadSession())
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [campaignId]);

  const hydratePortraits = async (toks) => {
    const charIds = [...new Set((toks || []).filter(t => t.characterId).map(t => String(t.characterId)))];
    if (charIds.length === 0) return toks || [];
    const { data: chars } = await supabase.from('characters').select('id, data').in('id', charIds);
    if (!chars) return toks;
    const map = Object.fromEntries(chars.map(c => {
      const data = typeof c.data === 'string' ? JSON.parse(c.data) : c.data || {};
      return [String(c.id), { sprite_url: data.sprite_url || data.token?.sprite_url || null, portrait_url: data.portrait_url || null, race: data.race || null, cid: data.cid || null }];
    }));
    return toks.map(t => {
      if (!t.characterId || !map[String(t.characterId)]) return t;
      const art = map[String(t.characterId)];
      return { ...t, sprite_url: art.sprite_url || t.sprite_url || null, portrait_url: art.portrait_url || t.portrait_url || null, race: t.race || art.race || null, cid: t.cid || art.cid || null };
    });
  };

  const loadSession = async () => {
    const { data } = await supabase.from('vtt_sessions').select('*').eq('campaign_id', campaignId).maybeSingle();
    if (data) {
      setVttSession(data);
      setFogZones(data.fog_zones || []);
      setTokens(await hydratePortraits(data.tokens || []));
      setPendingMoves(data.pending_moves || []);
      setMapFilename(data.map_filename);
      if (!hasLoadedTransformRef.current) {
        if (data.view_transform) setTransform(data.view_transform);
        hasLoadedTransformRef.current = true;
      }
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
    drawViewer({ canvas: canvasRef.current, mapImg: mapImgRef.current, fogZones, tokens, transform, pendingMoves, draggingToken, dragPos, userCharId, hoveredTokenId: hoveredToken?.id || null, onIconReady: () => setIconTick(t => t + 1) });
  }, [fogZones, tokens, mapLoaded, transform, pendingMoves, draggingToken, dragPos, userCharId, hoveredToken, iconTick]);

  // Wheel zoom
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleRatio = LOGICAL_W / rect.width; // logical space, not the backing store
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
    const scaleRatio = LOGICAL_W / rect.width; // logical space, not the backing store
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
    const intent = moveIntentText(moveIntent);
    const note = moveNote.trim();
    const newMove = {
      id: Math.random().toString(36).slice(2, 9),
      characterId: userCharId,
      characterName: userChar?.name || 'Player',
      intent,
      note,
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
    const myMoves = next.filter(m => m.characterId === userCharId);
    await logSessionEvent(campaignId, activeGameSessionId, 'vtt_token_move_requested', {
      actor_id: userCharId,
      actor_name: userChar?.name || 'Player',
      character_id: userCharId,
      character_name: userChar?.name || 'Player',
      intent,
      note: note || null,
      to: { x, y },
      waypoint_count: myMoves.length,
      description: `${userChar?.name || 'Player'} requested to ${intent.toLowerCase()} to waypoint ${myMoves.length} at ${coordText({ x, y })}${note ? `: ${note}` : ''}.`,
      source: 'vtt',
    });
    await persistPendingMoves(next);
  };

  const removeWaypoint = async (moveId) => {
    const removed = pendingMovesRef.current.find(m => m.id === moveId);
    const next = pendingMovesRef.current.filter(m => m.id !== moveId);
    setPendingMoves(next);
    pendingMovesRef.current = next;
    if (removed) {
      await logSessionEvent(campaignId, activeGameSessionId, 'vtt_token_move_cancelled', {
        actor_id: userCharId,
        actor_name: userChar?.name || 'Player',
        character_id: userCharId,
        character_name: userChar?.name || 'Player',
        intent: removed.intent || null,
        note: removed.note || null,
        to: { x: removed.x, y: removed.y },
        description: `${userChar?.name || 'Player'} cancelled a ${moveIntentText(removed.intent).toLowerCase()} waypoint at ${coordText(removed)}${removed.note ? `: ${removed.note}` : ''}.`,
        source: 'vtt',
      });
    }
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
    panRef.current = { panning: true, lastX: clientX, lastY: clientY, startX: clientX, startY: clientY, tapped: false };
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
      const scaleRatio = LOGICAL_W / rect.width; // logical space, not the backing store
      const dx = (clientX - panRef.current.lastX) * scaleRatio;
      const dy = (clientY - panRef.current.lastY) * scaleRatio;
      panRef.current.lastX = clientX;
      panRef.current.lastY = clientY;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      return;
    }
    const hit = hitTestToken(clientX, clientY);
    if (hit && !isTokenFogged(hit, fogZones)) {
      setHoveredToken({ id: hit.id, name: hit.fullName || hit.creatureName || hit.label || '?', portrait_url: hit.portrait_url || null, sprite_url: hit.sprite_url || null, clientX, clientY });
    } else if (!hit) {
      setHoveredToken(null);
    }
    // Don't clear hoveredToken on mousemove — let the hover card stay so user can click the portrait
  }, [clientToMapCoords, hitTestToken]);

  const enlargeToken = (tok) => {
    if (!tok || (!tok.sprite_url && !tok.portrait_url)) return;
    setPortraitFullscreen({ name: tok.fullName || tok.creatureName || tok.label || '?', sprite_url: tok.sprite_url || null, portrait_url: tok.portrait_url || null });
  };

  const handleMouseUp = useCallback((e) => {
    const clientX = e?.clientX;
    const clientY = e?.clientY;
    if (dragRef.current.dragging) {
      if (dragRef.current.moved && dragRef.current._lastDragPos) {
        addWaypoint(dragRef.current._lastDragPos.x, dragRef.current._lastDragPos.y);
      } else {
        // A click (no drag) on your own token → enlarge its portrait
        enlargeToken(dragRef.current.token);
      }
      dragRef.current = { dragging: false, token: null, startX: 0, startY: 0, moved: false, _lastDragPos: null };
      setDraggingToken(null);
      setDragPos(null);
      panRef.current.panning = false;
      return;
    }
    // A click (no pan) on any visible token → enlarge its portrait
    if (panRef.current.panning && clientX != null) {
      const dx = clientX - (panRef.current.startX ?? clientX);
      const dy = clientY - (panRef.current.startY ?? clientY);
      if (Math.sqrt(dx * dx + dy * dy) < 5) {
        const hit = hitTestToken(clientX, clientY);
        if (hit && !isTokenFogged(hit, fogZones)) enlargeToken(hit);
      }
    }
    dragRef.current = { dragging: false, token: null, startX: 0, startY: 0, moved: false, _lastDragPos: null };
    setDraggingToken(null);
    setDragPos(null);
    panRef.current.panning = false;
  }, [clientToMapCoords, hitTestToken, fogZones]);

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
      panRef.current = { panning: true, lastX: clientX, lastY: clientY, startX: clientX, startY: clientY, tapped: false };
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
      const scaleRatio = LOGICAL_W / rect.width; // logical space, not the backing store
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
      const scaleRatio = LOGICAL_W / rect.width; // logical space, not the backing store
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
    const touch = e?.changedTouches?.[0];
    if (touch) {
      const dx = touch.clientX - panRef.current.startX;
      const dy = touch.clientY - panRef.current.startY;
      if (Math.sqrt(dx * dx + dy * dy) < 8 && !dragRef.current.moved) {
        const hitTok = hitTestToken(touch.clientX, touch.clientY);
        if (hitTok && !isTokenFogged(hitTok, fogZones)) {
          setHoveredToken(prev => {
            if (prev?.id === hitTok.id && hitTok.portrait_url) {
              setPortraitFullscreen({ name: hitTok.fullName || hitTok.creatureName || hitTok.label || '?', portrait_url: hitTok.portrait_url });
              return prev;
            }
            if (prev?.id === hitTok.id) return null;
            return { id: hitTok.id, name: hitTok.fullName || hitTok.creatureName || hitTok.label || '?', portrait_url: hitTok.portrait_url || null, sprite_url: hitTok.sprite_url || null, clientX: touch.clientX, clientY: touch.clientY };
          });
        } else {
          setHoveredToken(null);
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
    <div
      ref={castShellRef}
      tabIndex={castMode ? 0 : undefined}
      onKeyDown={handleCastKeyDown}
      onMouseDownCapture={() => { if (castMode) castShellRef.current?.focus(); }}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%', outline: 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>
          Live Map · {Math.round(transform.scale * 100)}% · Scroll/pinch to zoom · Drag to pan
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={resetView} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>⊡ Reset</button>
          {!castMode && <button onClick={() => setFullscreen(true)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>⛶ Expand</button>}
        </div>
      </div>

      {userCharId && (
        <div style={{ background: 'rgba(240,238,235,0.035)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" }}>Intent</div>
          <select
            value={moveIntent}
            onChange={e => setMoveIntent(e.target.value)}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '5px 8px', color: COLORS.text, fontFamily: "'Cinzel', serif", fontSize: 9, outline: 'none' }}
          >
            {MOVE_INTENTS.map(intent => <option key={intent} value={intent}>{intent}</option>)}
          </select>
          <input
            value={moveNote}
            onChange={e => setMoveNote(e.target.value)}
            maxLength={140}
            placeholder="Optional intent note"
            style={{ flex: '1 1 180px', minWidth: 0, background: 'rgba(10,8,6,0.75)', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '6px 8px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 10, outline: 'none' }}
          />
        </div>
      )}

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

      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: '#0d0b09', cursor: draggingToken ? 'grabbing' : 'grab', flex: 1, minHeight: window.innerWidth <= 640 ? Math.round(window.innerHeight * 0.6) : 300 }}>
        {!mapLoaded ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', color: COLORS.dim, fontSize: 12 }}>Loading map…</div>
        ) : (
          <canvas ref={canvasRef} width={900} height={600} style={{ width: '100%', height: 'auto', maxHeight: window.innerWidth <= 640 ? '60vh' : 'none', display: 'block', touchAction: 'none', transform: castMode ? `rotate(${normalizedCastRotation}deg) scale(${castCanvasScale})` : 'none', transformOrigin: 'center center', transition: castMode ? 'transform 160ms ease' : 'none' }}
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={(e) => handleTouchEnd(e)} />
        )}

        {/* Cast overlay — whatever the DM is showing the table. Arrives on the
            existing vtt_sessions subscription, so it appears here and on the
            Mapcast window at the same time. pointerEvents stays off so a player
            can still work the map underneath while something is being shown. */}
        {vttSession?.cast_overlay?.url && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3% 4%', background: 'radial-gradient(ellipse at center, rgba(6,4,3,0.55) 0%, rgba(6,4,3,0.82) 100%)', pointerEvents: 'none' }}>
            {/* Definite height on the figure plus minHeight:0 on the image is what
                lets the image shrink to fit. Without both, a flex item refuses to
                go below its intrinsic size and a tall asset runs off the bottom.
                No explicit width/height on the img, so small art is never upscaled. */}
            <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%', height: '100%', minHeight: 0 }}>
              <img
                src={vttSession.cast_overlay.url}
                alt={vttSession.cast_overlay.title || 'Cast asset'}
                style={{ flex: '0 1 auto', minHeight: 0, maxWidth: '100%', objectFit: 'contain', borderRadius: 8, border: '1px solid rgba(200,168,74,0.45)', boxShadow: '0 24px 80px rgba(0,0,0,0.8)', background: 'rgba(10,8,6,0.35)' }}
              />
              {(vttSession.cast_overlay.title || vttSession.cast_overlay.caption) && (
                <figcaption style={{ textAlign: 'center', maxWidth: '100%', flexShrink: 0 }}>
                  {vttSession.cast_overlay.title && (
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: castMode ? 20 : 13, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8d9a7' }}>
                      {vttSession.cast_overlay.title}
                    </div>
                  )}
                  {vttSession.cast_overlay.caption && (
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: castMode ? 14 : 11, color: 'rgba(232,217,167,0.7)', marginTop: 4 }}>
                      {vttSession.cast_overlay.caption}
                    </div>
                  )}
                </figcaption>
              )}
            </figure>
          </div>
        )}
      </div>

      {false && hoveredToken && (
        <div style={{ position: 'fixed', left: hoveredToken.clientX, top: hoveredToken.clientY - 160, transform: 'translateX(-50%)', background: 'rgba(8,6,4,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,168,74,0.3)', borderRadius: 10, padding: 10, pointerEvents: 'auto', zIndex: 200005, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 110, boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
          {(hoveredToken.sprite_url || hoveredToken.portrait_url) ? (
            <div onClick={() => setPortraitFullscreen(hoveredToken)} style={{ width: 72, height: 96, borderRadius: 6, overflow: 'hidden', border: '1px solid rgba(200,168,74,0.4)', flexShrink: 0, cursor: 'pointer' }}>
              <img src={hoveredToken.sprite_url || hoveredToken.portrait_url} alt={hoveredToken.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
            </div>
          ) : (
            <div style={{ width: 72, height: 96, borderRadius: 6, background: 'rgba(200,168,74,0.08)', border: '1px solid rgba(200,168,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: 'rgba(200,168,74,0.3)' }}>⚔</div>
          )}
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e8d9a7', letterSpacing: '0.08em', textAlign: 'center', lineHeight: 1.4 }}>{hoveredToken.name}</div>
        </div>
      )}

      {portraitFullscreen && (
        <div onClick={() => setPortraitFullscreen(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => setPortraitFullscreen(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16, fontFamily: "'Cinzel', serif" }}>✕</button>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <img src={portraitFullscreen.sprite_url || portraitFullscreen.portrait_url} alt={portraitFullscreen.name} style={{ maxHeight: '80vh', maxWidth: '80vw', borderRadius: 10, border: '1px solid rgba(200,168,74,0.3)', boxShadow: '0 24px 80px rgba(0,0,0,0.8)', objectFit: 'contain' }} />
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8d9a7', letterSpacing: '0.12em' }}>{portraitFullscreen.name}</div>
          </div>
        </div>
      )}

      {fullscreen && mapLoaded && (
        <div onClick={() => setFullscreen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <canvas
            ref={node => { if (node) drawViewer({ canvas: node, mapImg: mapImgRef.current, fogZones, tokens, transform, pendingMoves, draggingToken: null, dragPos: null, userCharId, onIconReady: () => setIconTick(t => t + 1) }); }}
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
