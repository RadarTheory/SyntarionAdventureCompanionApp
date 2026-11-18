// Living maps (user, 2026-11-17): the VTT's maps are where players spend most of a session, so they breathe.
// Drawn on the same canvas as the map, between the map art and the fog of war, so nothing glows through unrevealed fog.
//   - Darkness that follows the campaign's world clock (Soteria's 13 passes) and the map's scene, with every light
//     cutting a warm hole through it.
//   - Lights the DM places (torch, candle, lantern, brazier, hearth, forge, window, arcane, crystal, moonpool), each
//     with its own flicker; fires throw rising embers; a light flares when the cursor rests on it.
//   - Scene atmosphere: drifting mist banks, dust, fireflies, falling leaves, rain and lightning, snow, sea glints,
//     arcane motes, light shafts. Particles part around the cursor.
//   - Tokens near a light stand in its glow.
//   - Fog of war is never still: smoke churns inside it (drawFogSmoke, after the fog is composited).
// Everything is a pure function of time, so there is no particle state to keep in step between DM and players.
// Coordinates: lights and tokens are 0-1 across the map image (like fog zones); drawing happens in logical canvas
// space (mapRect), under whatever pan/zoom transform the caller has set.

// ── Scenes ──
// dark: darkness at noon; night: extra darkness as the clock moves to night (0 = indoor scenes ignore the sky).
// tint: colour of the darkness. mist: banks drifting across. particles: ambient kinds and how many.
export const SCENES = {
  outdoor:  { label: 'Open sky',  dark: 0.02, night: 0.62, tint: [14, 18, 34],  mist: { color: [200, 205, 210], alpha: 0.05, count: 4, speed: 0.006 }, particles: { dust: 26, fireflies: 0 } },
  town:     { label: 'Town',      dark: 0.04, night: 0.58, tint: [18, 16, 30],  mist: { color: [190, 180, 170], alpha: 0.05, count: 4, speed: 0.005 }, particles: { dust: 30 } },
  interior: { label: 'Interior',  dark: 0.40, night: 0.16, tint: [22, 12, 6],   mist: { color: [170, 140, 110], alpha: 0.05, count: 3, speed: 0.003 }, particles: { dust: 44 } },
  tavern:   { label: 'Tavern',    dark: 0.46, night: 0.14, tint: [26, 13, 5],   mist: { color: [190, 150, 110], alpha: 0.07, count: 4, speed: 0.003 }, particles: { dust: 52 } },
  dungeon:  { label: 'Dungeon',   dark: 0.70, night: 0.08, tint: [6, 8, 14],    mist: { color: [120, 130, 140], alpha: 0.08, count: 5, speed: 0.004 }, particles: { dust: 30 } },
  cavern:   { label: 'Cavern',    dark: 0.70, night: 0.05, tint: [4, 8, 10],    mist: { color: [110, 140, 150], alpha: 0.09, count: 5, speed: 0.003 }, particles: { dust: 22, motes: 10 } },
  forest:   { label: 'Forest',    dark: 0.10, night: 0.62, tint: [6, 16, 12],   mist: { color: [170, 200, 170], alpha: 0.06, count: 4, speed: 0.004 }, particles: { leaves: 16, fireflies: 22, dust: 14 }, shafts: true },
  swamp:    { label: 'Swamp',     dark: 0.18, night: 0.58, tint: [8, 18, 10],   mist: { color: [150, 190, 140], alpha: 0.12, count: 6, speed: 0.003 }, particles: { fireflies: 30, dust: 12 } },
  coast:    { label: 'Coast',     dark: 0.03, night: 0.58, tint: [8, 16, 30],   mist: { color: [210, 225, 235], alpha: 0.08, count: 5, speed: 0.009 }, particles: { glints: 40, dust: 10 } },
  desert:   { label: 'Desert',    dark: 0.00, night: 0.55, tint: [24, 16, 26],  mist: { color: [235, 205, 160], alpha: 0.06, count: 4, speed: 0.012 }, particles: { sand: 60 } },
  snow:     { label: 'Snow',      dark: 0.04, night: 0.55, tint: [12, 18, 32],  mist: { color: [225, 235, 245], alpha: 0.08, count: 5, speed: 0.006 }, particles: { snow: 120 } },
  storm:    { label: 'Storm',     dark: 0.28, night: 0.48, tint: [10, 14, 24],  mist: { color: [150, 160, 175], alpha: 0.10, count: 6, speed: 0.014 }, particles: { rain: 170 }, lightning: true },
  arcane:   { label: 'Arcane',    dark: 0.42, night: 0.20, tint: [16, 8, 30],   mist: { color: [170, 140, 230], alpha: 0.08, count: 5, speed: 0.004 }, particles: { motes: 46, dust: 10 } },
  ruins:    { label: 'Ruins',     dark: 0.14, night: 0.56, tint: [14, 14, 22],  mist: { color: [180, 175, 165], alpha: 0.07, count: 5, speed: 0.005 }, particles: { dust: 36, leaves: 6 } },
};
export const DEFAULT_SCENE = 'outdoor';

// ── Lights ──
// color: [r,g,b]; radius: share of the map's width at size 1; flicker: how much it wavers; speed: how fast;
// fire: throws embers. cool lights breathe slowly instead of flickering.
export const LIGHT_KINDS = {
  torch:    { label: 'Torch',    color: [255, 150, 60],  radius: 0.075, flicker: 0.26, speed: 1.0, fire: true },
  candle:   { label: 'Candle',   color: [255, 196, 110], radius: 0.040, flicker: 0.20, speed: 1.4, fire: false },
  lantern:  { label: 'Lantern',  color: [255, 186, 96],  radius: 0.070, flicker: 0.10, speed: 0.8, fire: false },
  brazier:  { label: 'Brazier',  color: [255, 120, 40],  radius: 0.110, flicker: 0.30, speed: 0.9, fire: true },
  hearth:   { label: 'Hearth',   color: [255, 132, 52],  radius: 0.140, flicker: 0.24, speed: 0.7, fire: true },
  forge:    { label: 'Forge',    color: [255, 96, 30],   radius: 0.120, flicker: 0.34, speed: 1.2, fire: true },
  window:   { label: 'Window',   color: [255, 226, 170], radius: 0.090, flicker: 0.04, speed: 0.2, fire: false, daylit: true },
  arcane:   { label: 'Arcane',   color: [170, 120, 255], radius: 0.090, flicker: 0.18, speed: 0.5, fire: false, motes: true },
  crystal:  { label: 'Crystal',  color: [110, 220, 230], radius: 0.080, flicker: 0.12, speed: 0.4, fire: false, motes: true },
  moonpool: { label: 'Moonpool', color: [150, 180, 255], radius: 0.120, flicker: 0.06, speed: 0.15, fire: false },
};

// ── Small deterministic helpers ──
const fract = v => v - Math.floor(v);
const hash = n => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
const idSeed = id => { let h = 7; for (const c of String(id || '')) h = (h * 31 + c.charCodeAt(0)) % 100003; return h; };

// A light's strength at time t: layered waves for fire, a slow breath for cool lights.
function flicker(kind, t, seed) {
  const k = LIGHT_KINDS[kind] || LIGHT_KINDS.torch;
  const s = k.speed, f = k.flicker;
  const wave = Math.sin(t * 7.3 * s + seed) * 0.5 + Math.sin(t * 13.1 * s + seed * 1.7) * 0.3 + Math.sin(t * 2.3 * s + seed * 0.3) * 0.6;
  const gust = Math.max(0, Math.sin(t * 0.9 * s + seed * 2.1)) ** 8; // the odd sputter
  return Math.max(0.35, 1 + (wave / 1.4) * f - gust * f * 0.9);
}

// ── Daylight from the world clock ──
// Returns { level: 0 (deep night) to 1 (full day), tint: [r,g,b] for the sky's colour at that hour, moon }.
// Passes 1-9 are day (1 Dawn ... 9 Nightfall); 10-13 night (11 Yellow Moon, 12 Blue Moon, 13 Ghost Light).
export function daylightOf(clock, mode = 'clock') {
  if (mode === 'day') return { level: 1, tint: null };
  if (mode === 'dusk') return { level: 0.45, tint: [60, 26, 40] };
  if (mode === 'night') return { level: 0.08, tint: [10, 18, 40], moon: [150, 175, 230] };
  if (!clock?.pass) return { level: 1, tint: null };
  const p = clock.pass + (Number(clock.fragment) || 0) / 120; // 1.0 .. 13.99
  const ramp = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a)));
  if (p < 2) return { level: 0.25 + 0.75 * ramp(1, 2, p), tint: [70, 34, 40] };                 // Dawn: rose gold
  if (p < 8) return { level: 1, tint: null };
  if (p < 9) return { level: 1 - 0.35 * ramp(8, 9, p), tint: [80, 40, 20] };                    // Evening: amber
  if (p < 10) return { level: 0.65 - 0.5 * ramp(9, 10, p), tint: [40, 20, 46] };               // Nightfall
  if (p < 11) return { level: 0.06, tint: [6, 10, 26] };                                       // Deep Night
  if (p < 12) return { level: 0.12, tint: [26, 22, 14], moon: [230, 205, 130] };               // Yellow Moon
  if (p < 13) return { level: 0.16, tint: [10, 20, 40], moon: [150, 180, 235] };               // both moons
  return { level: 0.14 + 0.12 * ramp(13, 14, p), tint: [18, 24, 44], moon: [180, 200, 240] };  // Ghost Light
}

// ── Offscreen canvases, reused frame to frame ──
const pool = new Map();
function scratch(name, w, h) {
  let c = pool.get(name);
  if (!c) { c = document.createElement('canvas'); pool.set(name, c); }
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
}

// Light state for one frame (shared by darkness, glow, embers and token warmth).
function frameLights(ambience, mapRect, t, pointer, daylight) {
  const lights = Array.isArray(ambience?.lights) ? ambience.lights : [];
  return lights.map(l => {
    const k = LIGHT_KINDS[l.kind] || LIGHT_KINDS.torch;
    const seed = idSeed(l.id);
    const x = mapRect.x + l.x * mapRect.w, y = mapRect.y + l.y * mapRect.h;
    const r = k.radius * (Number(l.size) || 1) * mapRect.w;
    let power = flicker(l.kind, t, seed);
    if (k.daylit) power *= 0.5 + (daylight.level || 0) * 0.7; // windows glow brightest by day
    if (pointer) {
      const px = mapRect.x + pointer.x * mapRect.w, py = mapRect.y + pointer.y * mapRect.h;
      if (Math.hypot(px - x, py - y) < r * 0.45) power *= 1.35; // the light leans toward a resting cursor
    }
    return { ...l, k, seed, x, y, r, power };
  });
}

// ── The atmosphere under the fog: darkness, lights, mist, particles, token glow ──
// ctx: the map canvas with the map's pan/zoom transform already applied. W, H: the logical canvas size.
export function drawAmbience(ctx, { W, H, mapRect, time: t, ambience, clock, tokens = [], pointer = null }) {
  const scene = SCENES[ambience?.scene] || SCENES[DEFAULT_SCENE];
  const daylight = daylightOf(clock, ambience?.timeMode || 'clock');
  const lights = frameLights(ambience, mapRect, t, pointer, daylight);
  const { x: mx, y: my, w: mw, h: mh } = mapRect;

  ctx.save();
  ctx.beginPath(); ctx.rect(mx, my, mw, mh); ctx.clip();

  // Light shafts through the canopy or high windows, by day.
  if (scene.shafts && daylight.level > 0.35) {
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 4; i++) {
      const sway = Math.sin(t * 0.18 + i * 1.9) * 0.03;
      const cx = mx + mw * (0.18 + i * 0.22 + sway), w = mw * (0.05 + hash(i) * 0.05);
      const g = ctx.createLinearGradient(cx, my, cx + mw * 0.12, my + mh);
      const a = (0.10 + 0.06 * Math.sin(t * 0.4 + i)) * daylight.level;
      g.addColorStop(0, rgba([255, 240, 190], a)); g.addColorStop(1, rgba([255, 240, 190], 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(cx, my); ctx.lineTo(cx + w, my); ctx.lineTo(cx + w + mw * 0.16, my + mh); ctx.lineTo(cx + mw * 0.16, my + mh); ctx.closePath(); ctx.fill();
    }
  }

  // Mist banks drifting across.
  ctx.globalCompositeOperation = 'source-over';
  const mist = scene.mist;
  for (let i = 0; i < mist.count; i++) {
    const r = mw * (0.22 + hash(i + 3) * 0.22);
    const x = mx + fract(hash(i) + t * mist.speed * (0.6 + hash(i + 9) * 0.8)) * (mw + r * 2) - r;
    const y = my + mh * (0.1 + hash(i + 5) * 0.8) + Math.sin(t * 0.07 + i * 2) * mh * 0.03;
    const a = mist.alpha * (0.7 + 0.3 * Math.sin(t * 0.21 + i * 1.3));
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(mist.color, a)); g.addColorStop(1, rgba(mist.color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Darkness, with every light cutting through it.
  const darkness = Math.min(0.9, scene.dark + scene.night * (1 - daylight.level));
  const dark = scratch('dark', W, H), d = dark.getContext('2d');
  d.globalCompositeOperation = 'source-over';
  d.clearRect(0, 0, W, H);
  if (darkness > 0.01) {
    const tint = daylight.tint && scene.night > 0.2 ? daylight.tint.map((c, i) => Math.round((c + scene.tint[i]) / 2)) : scene.tint;
    d.fillStyle = rgba(tint, darkness);
    d.fillRect(mx, my, mw, mh);
    d.globalCompositeOperation = 'destination-out';
    for (const l of lights) {
      const r = l.r * (0.85 + 0.15 * l.power);
      const g = d.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      g.addColorStop(0, `rgba(0,0,0,${Math.min(1, 0.95 * l.power).toFixed(3)})`);
      g.addColorStop(0.55, `rgba(0,0,0,${Math.min(1, 0.55 * l.power).toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      d.fillStyle = g; d.fillRect(l.x - r, l.y - r, r * 2, r * 2);
    }
    ctx.drawImage(dark, 0, 0);
  }

  // Moonlight: a faint cool wash at night.
  if (daylight.moon && scene.night > 0.2) {
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = rgba(daylight.moon, 0.05 + 0.02 * Math.sin(t * 0.3));
    ctx.fillRect(mx, my, mw, mh);
  }

  // The lights' own glow: a hot core and a soft halo, added on top.
  ctx.globalCompositeOperation = 'lighter';
  const glowScale = 0.75 + 0.55 * (1 - daylight.level * (scene.night > 0.2 ? 0.7 : 0.2));
  for (const l of lights) {
    const r = l.r * (0.9 + 0.1 * l.power);
    const g = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    g.addColorStop(0, rgba(l.k.color, 0.62 * l.power * glowScale));
    g.addColorStop(0.2, rgba(l.k.color, 0.30 * l.power * glowScale));
    g.addColorStop(0.6, rgba(l.k.color, 0.08 * l.power * glowScale));
    g.addColorStop(1, rgba(l.k.color, 0));
    ctx.fillStyle = g; ctx.fillRect(l.x - r, l.y - r, r * 2, r * 2);
    const c = r * 0.16;
    const core = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, c);
    core.addColorStop(0, rgba([255, 248, 228], 0.8 * l.power)); core.addColorStop(1, rgba(l.k.color, 0));
    ctx.fillStyle = core; ctx.fillRect(l.x - c, l.y - c, c * 2, c * 2);
  }

  // Tokens standing in a light's reach are warmed by it.
  for (const tok of tokens) {
    if (tok?.x == null || tok?.y == null) continue;
    const tx = mx + tok.x * mw, ty = my + tok.y * mh;
    let best = null, warmth = 0;
    for (const l of lights) {
      const f = Math.max(0, 1 - Math.hypot(tx - l.x, ty - l.y) / l.r) * l.power;
      if (f > warmth) { warmth = f; best = l; }
    }
    if (!best || warmth < 0.05) continue;
    const r = mw * 0.045;
    const g = ctx.createRadialGradient(tx, ty, r * 0.3, tx, ty, r);
    g.addColorStop(0, rgba(best.k.color, 0.30 * warmth)); g.addColorStop(1, rgba(best.k.color, 0));
    ctx.fillStyle = g; ctx.fillRect(tx - r, ty - r, r * 2, r * 2);
  }

  // Particles. Each is a pure function of time; the cursor parts them.
  const ppx = pointer ? mx + pointer.x * mw : null, ppy = pointer ? my + pointer.y * mh : null;
  const part = (x, y) => {
    if (ppx == null) return [x, y];
    const dx = x - ppx, dy = y - ppy, dist = Math.hypot(dx, dy), R = mw * 0.07;
    if (dist >= R || dist < 0.001) return [x, y];
    const push = ((R - dist) / R) ** 2 * R * 0.6;
    return [x + (dx / dist) * push, y + (dy / dist) * push];
  };
  const P = scene.particles || {};
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < (P.dust || 0); i++) {
    const s = i * 1.37;
    let x = mx + fract(hash(s) + t * 0.004 * (hash(s + 1) - 0.5)) * mw + Math.sin(t * 0.3 + s) * 6;
    let y = my + fract(hash(s + 2) - t * 0.003 * (0.4 + hash(s + 3))) * mh;
    [x, y] = part(x, y);
    const a = 0.10 + 0.18 * (0.5 + 0.5 * Math.sin(t * (0.6 + hash(s + 4)) + s));
    ctx.fillStyle = rgba([255, 236, 200], a * (0.45 + 0.55 * (1 - daylight.level * 0.5)));
    ctx.beginPath(); ctx.arc(x, y, 0.7 + hash(s + 5) * 0.9, 0, Math.PI * 2); ctx.fill();
  }

  const night = 1 - daylight.level;
  for (let i = 0; i < (P.fireflies || 0) && night > 0.3; i++) {
    const s = 50 + i * 2.11;
    let x = mx + (hash(s) + 0.08 * Math.sin(t * (0.21 + hash(s + 1) * 0.2) + s)) * mw;
    let y = my + (hash(s + 2) + 0.06 * Math.cos(t * (0.17 + hash(s + 3) * 0.2) + s)) * mh;
    [x, y] = part(x, y);
    const blink = Math.max(0, Math.sin(t * (0.9 + hash(s + 4)) + s * 3)) ** 3;
    const a = blink * night;
    if (a < 0.02) continue;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
    g.addColorStop(0, rgba([210, 255, 140], 0.85 * a)); g.addColorStop(1, rgba([210, 255, 140], 0));
    ctx.fillStyle = g; ctx.fillRect(x - 7, y - 7, 14, 14);
  }

  for (let i = 0; i < (P.motes || 0); i++) {
    const s = 90 + i * 1.73, orbit = 0.02 + hash(s) * 0.05;
    let x = mx + (hash(s + 1) + orbit * Math.cos(t * 0.25 + s)) * mw;
    let y = my + (hash(s + 2) + orbit * Math.sin(t * 0.25 + s) - fract(t * 0.01 + hash(s + 3)) * 0.08) * mh;
    [x, y] = part(x, y);
    const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(t * 1.3 + s));
    const col = i % 3 === 0 ? [120, 230, 240] : [190, 150, 255];
    const g = ctx.createRadialGradient(x, y, 0, x, y, 5);
    g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - 5, y - 5, 10, 10);
  }

  for (let i = 0; i < (P.glints || 0); i++) {
    const s = 140 + i * 1.91;
    const a = Math.max(0, Math.sin(t * (1.1 + hash(s) * 1.4) + s * 5)) ** 12;
    if (a < 0.03) continue;
    const x = mx + hash(s + 1) * mw, y = my + hash(s + 2) * mh;
    ctx.strokeStyle = rgba([235, 245, 255], 0.8 * a); ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y); ctx.moveTo(x, y - 3); ctx.lineTo(x, y + 3); ctx.stroke();
  }

  // Embers rising from every fire.
  for (const l of lights) {
    if (!l.k.fire) continue;
    const n = Math.round(6 + 6 * (Number(l.size) || 1));
    for (let i = 0; i < n; i++) {
      const s = l.seed + i * 3.7, life = fract(t * (0.35 + hash(s) * 0.35) + hash(s + 1));
      let x = l.x + (hash(s + 2) - 0.5) * l.r * 0.25 + Math.sin(t * 2 + s) * l.r * 0.06 * life;
      let y = l.y - life * l.r * (0.6 + hash(s + 3) * 0.6);
      [x, y] = part(x, y);
      const a = (1 - life) * 0.9 * Math.min(1, life * 6);
      ctx.fillStyle = rgba(i % 4 === 0 ? [255, 220, 140] : l.k.color, a);
      ctx.beginPath(); ctx.arc(x, y, 0.6 + (1 - life) * 1.1, 0, Math.PI * 2); ctx.fill();
    }
  }
  // Arcane and crystal lights shed slow motes.
  for (const l of lights) {
    if (!l.k.motes) continue;
    for (let i = 0; i < 8; i++) {
      const s = l.seed + i * 5.3, life = fract(t * 0.12 + hash(s));
      const ang = hash(s + 1) * Math.PI * 2 + t * 0.4;
      let x = l.x + Math.cos(ang) * l.r * 0.5 * life, y = l.y + Math.sin(ang) * l.r * 0.5 * life - life * l.r * 0.2;
      [x, y] = part(x, y);
      ctx.fillStyle = rgba(l.k.color, (1 - life) * 0.8);
      ctx.beginPath(); ctx.arc(x, y, 1.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < (P.leaves || 0); i++) {
    const s = 200 + i * 2.33, life = fract(t * (0.025 + hash(s) * 0.02) + hash(s + 1));
    let x = mx + (hash(s + 2) + life * 0.25 + Math.sin(t * 0.8 + s) * 0.02) * mw % mw;
    let y = my + life * mh;
    [x, y] = part(x, y);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * (0.8 + hash(s + 3)) + s);
    ctx.fillStyle = rgba(i % 3 ? [150, 120, 50] : [110, 140, 60], 0.55 * Math.min(1, (1 - life) * 4));
    ctx.beginPath(); ctx.ellipse(0, 0, 2.6, 1.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  for (let i = 0; i < (P.snow || 0); i++) {
    const s = 300 + i * 1.57, life = fract(t * (0.03 + hash(s) * 0.03) + hash(s + 1));
    let x = mx + fract(hash(s + 2) + Math.sin(t * 0.5 + s) * 0.01 + life * 0.05) * mw;
    let y = my + life * mh;
    [x, y] = part(x, y);
    ctx.fillStyle = rgba([245, 250, 255], 0.75);
    ctx.beginPath(); ctx.arc(x, y, 0.6 + hash(s + 3) * 1.4, 0, Math.PI * 2); ctx.fill();
  }

  for (let i = 0; i < (P.sand || 0); i++) {
    const s = 400 + i * 1.29, life = fract(t * (0.08 + hash(s) * 0.06) + hash(s + 1));
    let x = mx + life * mw, y = my + fract(hash(s + 2) + Math.sin(t * 0.7 + s) * 0.01) * mh;
    [x, y] = part(x, y);
    ctx.fillStyle = rgba([230, 200, 150], 0.35);
    ctx.fillRect(x, y, 1.6, 0.8);
  }

  if (P.rain) {
    ctx.strokeStyle = rgba([180, 200, 225], 0.22); ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (let i = 0; i < P.rain; i++) {
      const s = 500 + i * 1.11, life = fract(t * (0.9 + hash(s) * 0.5) + hash(s + 1));
      const x = mx + fract(hash(s + 2) + life * 0.06) * mw, y = my + life * mh;
      ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 11);
    }
    ctx.stroke();
  }

  // Lightning: a double flash every so often.
  if (scene.lightning) {
    const cycle = Math.floor(t / 7.3), local = t - cycle * 7.3;
    if (hash(cycle) > 0.45 && local < 0.45) {
      const a = local < 0.08 ? 0.32 : local > 0.16 && local < 0.24 ? 0.22 : 0;
      if (a) { ctx.fillStyle = rgba([220, 230, 255], a); ctx.fillRect(mx, my, mw, mh); }
    }
  }

  ctx.restore();
}

// ── Smoke churning inside the fog of war ──
// Called right after the fog is composited, with the same transform; fogCanvas is the fog mask (W x H).
let smokeTile = null;
function getSmokeTile() {
  if (smokeTile) return smokeTile;
  const size = 256, c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  for (let i = 0; i < 140; i++) {
    const x = hash(i * 3.1) * size, y = hash(i * 7.7) * size, r = 10 + hash(i * 1.9) * 42, a = 0.05 + hash(i * 5.3) * 0.13;
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) { // wrap so the tile repeats seamlessly
      const grad = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grad.addColorStop(0, `rgba(96,102,116,${a})`); grad.addColorStop(1, 'rgba(96,102,116,0)');
      g.fillStyle = grad; g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  smokeTile = c;
  return c;
}
export function drawFogSmoke(ctx, { W, H, fogCanvas, time: t, strength = 0.55 }) {
  if (!fogCanvas) return;
  const smoke = scratch('smoke', W, H), s = smoke.getContext('2d');
  s.globalCompositeOperation = 'source-over';
  s.clearRect(0, 0, W, H);
  const tile = getSmokeTile();
  const pattern = s.createPattern(tile, 'repeat');
  for (const [vx, vy, scale, alpha] of [[9, 3, 1.6, 0.9], [-6, 4, 2.4, 0.7]]) {
    s.save();
    s.globalAlpha = alpha;
    s.translate((t * vx) % (256 * scale), (t * vy) % (256 * scale));
    s.scale(scale, scale);
    s.fillStyle = pattern;
    s.fillRect(-256, -256, W / scale + 512, H / scale + 512);
    s.restore();
  }
  s.globalAlpha = 1;
  s.globalCompositeOperation = 'destination-in';
  s.drawImage(fogCanvas, 0, 0);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.drawImage(smoke, 0, 0);
  ctx.restore();
}

// The light under a point (0-1 map coordinates), for the DM's light tool.
export function lightAt(ambience, pos, mapRect) {
  const lights = Array.isArray(ambience?.lights) ? ambience.lights : [];
  let best = null, bestD = Infinity;
  for (const l of lights) {
    const k = LIGHT_KINDS[l.kind] || LIGHT_KINDS.torch;
    const dx = (l.x - pos.x) * mapRect.w, dy = (l.y - pos.y) * mapRect.h, dist = Math.hypot(dx, dy);
    if (dist < Math.max(10, k.radius * (Number(l.size) || 1) * mapRect.w * 0.3) && dist < bestD) { best = l; bestD = dist; }
  }
  return best;
}

// The DM's pins for placed lights (drawn only on the DM's map while the light tool is active).
export function drawLightPins(ctx, { ambience, mapRect }) {
  const lights = Array.isArray(ambience?.lights) ? ambience.lights : [];
  ctx.save();
  for (const l of lights) {
    const k = LIGHT_KINDS[l.kind] || LIGHT_KINDS.torch;
    const x = mapRect.x + l.x * mapRect.w, y = mapRect.y + l.y * mapRect.h, r = k.radius * (Number(l.size) || 1) * mapRect.w;
    ctx.strokeStyle = rgba(k.color, 0.5); ctx.setLineDash([3, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = rgba(k.color, 0.95); ctx.strokeStyle = 'rgba(10,8,6,0.9)';
    ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 5, y); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// ── Fog of war ──
// The mask: where fog lies (alpha 1) and where the DM has revealed (alpha 0), from the zones both map views share.
// Cached per zone list, size and map placement, since it only changes when the DM paints.
let maskCache = { key: null, zones: null, canvas: null, band: null, body: null };
export function buildFogMask(fogZones, mapRect, W, H) {
  const key = `${W}x${H}|${mapRect.x.toFixed(1)},${mapRect.y.toFixed(1)},${mapRect.w.toFixed(1)}`;
  if (maskCache.zones === fogZones && maskCache.key === key) return maskCache;
  const mask = document.createElement('canvas');
  mask.width = W; mask.height = H;
  const m = mask.getContext('2d');
  m.fillStyle = '#000'; m.fillRect(0, 0, W, H);
  for (const zone of fogZones || []) {
    const cx = mapRect.x + zone.x * mapRect.w, cy = mapRect.y + zone.y * mapRect.h, r = zone.r * mapRect.w;
    const feather = zone.feather ?? 0.35, inner = Math.max(0, r * (1 - feather));
    const g = m.createRadialGradient(cx, cy, inner, cx, cy, r);
    if (zone.type === 'reveal') {
      m.globalCompositeOperation = 'destination-out';
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    } else {
      m.globalCompositeOperation = 'source-over';
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    }
    m.fillStyle = g; m.beginPath(); m.arc(cx, cy, r, 0, Math.PI * 2); m.fill();
  }
  m.globalCompositeOperation = 'source-over';

  // Softened copy (the fog's own shape), and the band along its edge where tendrils and the rim live.
  const soft = document.createElement('canvas');
  soft.width = W; soft.height = H;
  const s = soft.getContext('2d');
  // Blur with a margin of solid fog around the canvas, so the fog stays solid at the edges instead of thinning there.
  const pad = 48, padded = document.createElement('canvas');
  padded.width = W + pad * 2; padded.height = H + pad * 2;
  const pc = padded.getContext('2d');
  pc.fillStyle = '#000'; pc.fillRect(0, 0, padded.width, padded.height);
  pc.clearRect(pad, pad, W, H); pc.drawImage(mask, pad, pad);
  s.filter = 'blur(12px)'; s.drawImage(padded, -pad, -pad); s.filter = 'none';
  s.globalCompositeOperation = 'source-over';
  const band = document.createElement('canvas');
  band.width = W; band.height = H;
  try {
    const img = s.getImageData(0, 0, W, H), px = img.data;
    const out = band.getContext('2d').createImageData(W, H), o = out.data;
    for (let i = 3; i < px.length; i += 4) {
      const a = px[i] / 255;
      o[i] = Math.round(255 * Math.min(1, Math.sqrt(4 * a * (1 - a)) * 1.25));
    }
    band.getContext('2d').putImageData(out, 0, 0);
  } catch { /* the band stays empty; the fog still draws */ }

  // The fog's body: deep night-blue with a darker heart, cut to the fog's shape.
  const body = document.createElement('canvas');
  body.width = W; body.height = H;
  const b = body.getContext('2d');
  const grad = b.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.1, W / 2, H / 2, Math.max(W, H) * 0.7);
  grad.addColorStop(0, '#08090d'); grad.addColorStop(1, '#030305');
  b.fillStyle = grad; b.fillRect(0, 0, W, H);
  b.globalCompositeOperation = 'destination-in';
  b.drawImage(soft, 0, 0);

  maskCache = { key, zones: fogZones, canvas: soft, band, body };
  return maskCache;
}

// Draws the fog for one frame: its body, tendrils curling at the edge, smoke churning inside, and a faint gold rim
// along the edge of the known. Away from the edge it stays fully opaque, so nothing leaks through to players.
// opacity: the DM's own fog dimmer (players always see 1).
export function drawFog(ctx, { W, H, fog, time: t, opacity = 1 }) {
  if (!fog?.body || opacity <= 0) return;
  const frame = scratch('fogframe', W, H), f = frame.getContext('2d');
  f.globalCompositeOperation = 'source-over';
  f.clearRect(0, 0, W, H);
  f.drawImage(fog.body, 0, 0);

  // Tendrils: a drifting smoke texture, kept to the edge band, eats into the fog's edge and lets it curl.
  const tile = getSmokeTile();
  const wisp = scratch('fogwisp', W, H), w = wisp.getContext('2d');
  w.globalCompositeOperation = 'source-over';
  w.clearRect(0, 0, W, H);
  const pattern = w.createPattern(tile, 'repeat');
  w.save(); w.translate((t * 11) % 384, (t * -5) % 384); w.scale(1.5, 1.5); w.fillStyle = pattern; w.fillRect(-256, -256, W + 512, H + 512); w.restore();
  w.save(); w.translate((t * -7) % 512, (t * 6) % 512); w.scale(2, 2); w.globalAlpha = 0.8; w.fillStyle = pattern; w.fillRect(-256, -256, W + 512, H + 512); w.restore();
  w.globalAlpha = 1;
  w.globalCompositeOperation = 'destination-in';
  w.drawImage(fog.band, 0, 0);
  f.globalCompositeOperation = 'destination-out';
  for (let k = 0; k < 4; k++) f.drawImage(wisp, 0, 0);

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(frame, 0, 0);
  ctx.restore();

  // Smoke churning inside the fog itself.
  drawFogSmoke(ctx, { W, H, fogCanvas: frame, time: t, strength: 0.6 * opacity });

  // The edge of the known: a faint gold rim that breathes.
  const rim = scratch('fogrim', W, H), r = rim.getContext('2d');
  r.globalCompositeOperation = 'source-over';
  r.clearRect(0, 0, W, H);
  r.fillStyle = 'rgb(214,176,98)'; r.fillRect(0, 0, W, H);
  r.globalCompositeOperation = 'destination-in';
  r.drawImage(fog.band, 0, 0);
  r.globalCompositeOperation = 'destination-out';
  r.drawImage(frame, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = (0.16 + 0.06 * Math.sin(t * 0.8)) * opacity;
  ctx.drawImage(rim, 0, 0);
  ctx.restore();
}
