import { useEffect, useMemo, useRef, useState } from 'react';
import { RACES, PM_MAJ, PM_MIN, PM_AEON, PM_ASTRAL } from './constants';

const STORAGE_KEY = 'undercrypts_unlocks_v2';
const START_UNLOCKS = ['rusted-sabre', 'knuckle-wraps', 'shortbow'];
const W = 960;
const H = 620;
const ROOM_GOAL = 6;
const BLOODLINES = [...PM_MAJ, ...PM_MIN, ...PM_AEON, ...PM_ASTRAL];
const BASE_HP = 28;

const RACE_ATTACKS = {
  addamar: { name: 'Adaptive Cut', style: 'sweep', reach: 82, arc: 1.55, damage: 8, wind: 190, color: '#f1d184', note: 'Balanced sweep with generous angle.' },
  durinak: { name: 'Forge-Shoulder Bash', style: 'hammer', reach: 66, arc: 1.15, damage: 12, wind: 270, color: '#d6d0bd', armor: 1, note: 'Shorter, heavier, safer in the pocket.' },
  telari: { name: 'Rootsong Lunge', style: 'lunge', reach: 126, arc: 0.62, damage: 9, wind: 210, color: '#8fc88f', note: 'Long narrow thrust for spacing.' },
  othrod: { name: 'Clanbreaker Hook', style: 'hook', reach: 88, arc: 1.95, damage: 11, wind: 260, color: '#d98954', note: 'Wide hook that controls crowds.' },
  terraxian: { name: 'Stonefall Slam', style: 'slam', reach: 72, arc: Math.PI * 2, damage: 10, wind: 330, color: '#b8aa8e', armor: 2, note: 'Full-body shock around you.' },
  fynlor: { name: 'Lowline Skirmish', style: 'dash', reach: 82, arc: 1.05, damage: 7, wind: 145, color: '#f0dc8d', speed: 1.12, note: 'Fast attack and quick feet.' },
  trink: { name: 'Springknife Feint', style: 'needle', reach: 110, arc: 0.48, damage: 9, wind: 170, color: '#7fb7dc', note: 'Precise mechanical jab.' },
  pamorph: { name: 'Bloodline Maul', style: 'claw', reach: 78, arc: 1.35, damage: 9, wind: 185, color: '#e2b569', note: 'Bloodline modifies the bite of it.' },
  fae: { name: 'Glimmerlash', style: 'sweep', reach: 90, arc: 1.65, damage: 8, wind: 170, color: '#b08fe0', speed: 1.06, note: 'Light resonant sweep.' },
  djinn: { name: 'Wish-Edge Riposte', style: 'hook', reach: 92, arc: 1.3, damage: 10, wind: 190, color: '#79cfd2', note: 'Curved strike, good on angles.' },
  helianth: { name: 'Infernal Guard', style: 'hammer', reach: 76, arc: 1.15, damage: 10, wind: 230, color: '#d86e58', armor: 1, note: 'Defensive hot cut.' },
  seraphan: { name: 'Halo Step', style: 'lunge', reach: 110, arc: 0.72, damage: 8, wind: 190, color: '#f5e6ad', heal: 1, note: 'Clean thrust with tiny recovery.' },
  drakazir: { name: 'Scale-Line Break', style: 'slam', reach: 82, arc: 1.35, damage: 12, wind: 260, color: '#e27e58', note: 'A blunt line of breath and scale.' },
  nazari: { name: 'Tideknife Flow', style: 'dash', reach: 90, arc: 1.05, damage: 8, wind: 150, color: '#6fc8dd', speed: 1.08, note: 'Fluid slash with repositioning.' },
  chronison: { name: 'Clockwork Impact', style: 'needle', reach: 96, arc: 0.54, damage: 11, wind: 210, color: '#86a8c6', armor: 1, note: 'Exact and heavy.' },
  tiol: { name: 'Tallreach Rend', style: 'lunge', reach: 132, arc: 0.72, damage: 11, wind: 235, color: '#c6a0dc', note: 'Long leverage, frightening reach.' },
  folwoade: { name: 'Living Resonance', style: 'sweep', reach: 92, arc: 1.55, damage: 8, wind: 165, color: '#a8e0b3', heal: 1, note: 'Body of resonance, fast recovery.' },
};
const PA_TRAITS = {
  aaravok: { style: 'lunge', reach: 18 }, kraark: { style: 'hook', speed: 1.08 }, cathvari: { style: 'claw', damage: 2 }, karazelith: { style: 'dash', speed: 1.12 }, lioreth: { style: 'slam', damage: 3 }, taeranari: { style: 'claw', speed: 1.08 }, maernethim: { reach: 14, armor: 1 }, bovorin: { style: 'slam', damage: 3 }, brawnath: { style: 'slam', armor: 2 }, gajaroi: { damage: 1, armor: 2 }, kodan: { damage: 2, armor: 1 }, krokodon: { style: 'hook', damage: 2 }, rhainar: { style: 'dash', damage: 3 }, satyr: { style: 'dash', speed: 1.12 }, hoshiari: { style: 'needle', speed: 1.12 },
  arbor: { damage: 1, armor: 1 }, avali: { style: 'needle', speed: 1.1 }, bjoral: { style: 'claw', armor: 1 }, harelin: { style: 'dash', speed: 1.22 }, dervir: { reach: 18 }, fenrik: { style: 'hook', speed: 1.08 }, hylori: { style: 'dash', speed: 1.1 }, krogharu: { style: 'hook', reach: 12 }, murinor: { style: 'needle', speed: 1.18 }, oryzd: { style: 'dash', damage: 1 }, testudon: { style: 'slam', armor: 3, speed: .92 }, orylin: { style: 'needle', damage: 1 }, ssazaral: { style: 'lunge', damage: 1 }, lutrav: { style: 'dash', heal: 1 }, musteiah: { style: 'hook', damage: 1 },
  hraelvan: { style: 'claw', damage: 3, speed: 1.1 }, cerakhjorn: { style: 'slam', armor: 2 }, jevrak: { style: 'dash', speed: 1.2 }, anpryd: { style: 'slam', armor: 3, speed: .9 }, limridh: { style: 'dash', heal: 1 }, pterrotara: { style: 'lunge', speed: 1.1 }, saurok: { reach: 22, armor: 1 }, hadrynn: { heal: 1 },
  khellsarii: { damage: 3 }, khellskini: { style: 'sweep', speed: 1.08 }, khellhanae: { style: 'slam', damage: 4, speed: .9 }, khelloch: { style: 'hook', armor: 2 }, khellyuum: { heal: 2 }, khelljta: { style: 'claw', damage: 3, speed: 1.08 }, khellxen: { style: 'dash', damage: 2, speed: 1.12 }, khellchin: { style: 'needle', speed: 1.18 },
};
const ITEMS = [
  { id: 'rusted-sabre', name: 'Rusted Sabre', type: 'melee', desc: '+1 melee damage.' },
  { id: 'knuckle-wraps', name: 'Knuckle Wraps', type: 'melee', desc: '+1 armor while attacking.' },
  { id: 'shortbow', name: 'Shortbow', type: 'ranged', desc: '+5 arrows at start.' },
  { id: 'flintlock', name: 'Ashendell Flintlock', type: 'ranged', desc: 'Heavy shot replaces some arrows with powder.' },
  { id: 'honourarc', name: "Tel'ari Honourarc", type: 'hybrid', desc: '+1 melee, +3 arrows.' },
  { id: 'grimrite-edge', name: 'Grimrite Edge', type: 'melee', desc: '+3 melee, enemies bite harder.' },
  { id: 'sylvan-lung', name: 'Sylvan Lung', type: 'utility', desc: '+8 max health this crawl.' },
  { id: 'charter-seal', name: 'Cracked Charter Seal', type: 'relic', desc: 'First lethal hit leaves you at 1 HP.' },
  { id: 'brunar-powder', name: 'Brunar Powder Horn', type: 'ranged', desc: '+3 flintlock shots.' },
  { id: 'veinrunner-spike', name: 'Veinrunner Spike', type: 'melee', desc: 'Melee briefly staggers enemies.' },
];
const ENEMY_TYPES = [
  { name: 'Draugr Remnant', hp: 16, speed: 58, damage: 5, color: '#8fb0c7', r: 14 },
  { name: 'Mine Rauk', hp: 10, speed: 96, damage: 3, color: '#45505a', r: 11 },
  { name: 'Grimrite Wolf', hp: 14, speed: 104, damage: 4, color: '#6f8d83', r: 12 },
  { name: 'Fetch Direlizard', hp: 13, speed: 78, damage: 4, color: '#7aa05f', r: 13 },
  { name: 'Duergar Delver', hp: 20, speed: 50, damage: 6, color: '#9a7058', r: 15 },
];
const BOSSES = [
  { name: 'Abyssal Ogre', hp: 76, speed: 42, damage: 10, color: '#b8c5cf', r: 28 },
  { name: 'Heiress Naga', hp: 62, speed: 70, damage: 8, color: '#b1798b', r: 24 },
];
const ROOM_NAMES = ['Drowned Reliquary', 'Root-Cracked Archive', 'Ash Pump Chapel', 'Corren Service Tunnel', 'Lower Menagerie', 'Black Charter Annex', 'Forgotten Tollhouse'];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const normAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function loadUnlocks() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || START_UNLOCKS; } catch { return START_UNLOCKS; } }
function saveUnlocks(ids) { localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)])); }
function raceLabel(raceId, bloodlineId) { const r = RACES.find(x => x.id === raceId); if (!r) return 'Wanderer'; if (raceId !== 'pamorph') return r.name; const b = BLOODLINES.find(x => x.id === bloodlineId); return b ? `Pa'morph - ${b.name}` : "Pa'morph"; }
function attackBuild(raceId, bloodlineId) { const base = RACE_ATTACKS[raceId] || RACE_ATTACKS.addamar; const t = raceId === 'pamorph' ? (PA_TRAITS[bloodlineId] || {}) : {}; return { ...base, ...t, reach: base.reach + (t.reach || 0), damage: base.damage + (t.damage || 0), armor: (base.armor || 0) + (t.armor || 0), heal: (base.heal || 0) + (t.heal || 0), speed: (base.speed || 1) * (t.speed || 1), note: base.note }; }
function itemStats(inventory) { return inventory.reduce((m, item) => { if (item.id === 'rusted-sabre') m.melee += 1; if (item.id === 'knuckle-wraps') m.armor += 1; if (item.id === 'shortbow') m.arrows += 5; if (item.id === 'honourarc') { m.melee += 1; m.arrows += 3; } if (item.id === 'grimrite-edge') { m.melee += 3; m.curse += 1; } if (item.id === 'sylvan-lung') m.hp += 8; if (item.id === 'flintlock') { m.powder += 2; m.shot += 8; } if (item.id === 'brunar-powder') m.powder += 3; if (item.id === 'veinrunner-spike') m.stagger += 1; if (item.id === 'charter-seal') m.seal = true; return m; }, { melee: 0, armor: 0, arrows: 0, powder: 0, shot: 0, hp: 0, curse: 0, stagger: 0, seal: false }); }
function makeRoom(index, floor, unlocks) { const boss = index >= ROOM_GOAL - 1; const count = boss ? 1 : 4 + Math.floor(Math.random() * 3) + floor; const pool = boss ? BOSSES : ENEMY_TYPES; const enemies = Array.from({ length: count }, (_, i) => { const src = pick(pool); return { ...src, id: `${Date.now()}-${i}`, maxHp: src.hp + floor * (boss ? 18 : 5), hp: src.hp + floor * (boss ? 18 : 5), x: 150 + Math.random() * (W - 300), y: 120 + Math.random() * (H - 240), hit: 0, cd: 0, stun: 0 }; }); return { index, floor, boss, name: boss ? 'Undercrypt Heart' : pick(ROOM_NAMES), enemies, reward: pick(ITEMS.filter(i => unlocks.includes(i.id))) }; }

export default function Undercrypts({ onExit }) {
  const canvasRef = useRef(null);
  const keys = useRef({});
  const mouse = useRef({ x: W / 2, y: H / 2, down: false, right: false });
  const game = useRef(null);
  const raf = useRef(null);
  const last = useRef(0);
  const [screen, setScreen] = useState('menu');
  const [race, setRace] = useState('drakazir');
  const [bloodline, setBloodline] = useState(PM_MAJ[0]?.id || 'aaravok');
  const [unlocks, setUnlocks] = useState(loadUnlocks);
  const [snapshot, setSnapshot] = useState(null);
  const build = useMemo(() => attackBuild(race, bloodline), [race, bloodline]);
  const bloodlines = BLOODLINES;

  const sync = () => setSnapshot(game.current ? { ...game.current, enemies: game.current.room.enemies.length } : null);
  const append = (msg) => { if (!game.current) return; game.current.log = [msg, ...game.current.log].slice(0, 7); sync(); };
  const startRun = () => {
    const inventory = ITEMS.filter(i => START_UNLOCKS.includes(i.id));
    const stats = itemStats(inventory);
    game.current = { floor: 1, roomIndex: 0, room: makeRoom(0, 1, unlocks), inventory, stats, player: { x: W / 2, y: H - 90, r: 15, hp: BASE_HP + stats.hp, maxHp: BASE_HP + stats.hp, arrows: 8 + stats.arrows, powder: stats.powder, invuln: 0, attack: 0, attackCd: 0, roll: 0, sealSpent: false }, projectiles: [], slashes: [], drops: [], log: [`${raceLabel(race, bloodline)} descends with ${build.name}.`], ended: null };
    setScreen('crawl'); sync();
  };
  const finishRoom = () => {
    const g = game.current; if (!g || g.room.enemies.length) return;
    if (!g.drops.some(d => d.kind === 'reward')) g.drops.push({ kind: 'reward', item: g.room.reward, x: W / 2, y: H / 2, r: 18 });
  };
  const nextRoom = () => {
    const g = game.current; if (!g || g.room.enemies.length) return;
    if (g.room.boss) { g.ended = 'You return changed. Inventory resets; unlocks remain.'; setScreen('ended'); sync(); return; }
    g.roomIndex += 1; g.room = makeRoom(g.roomIndex, g.floor, unlocks); g.projectiles = []; g.slashes = []; g.drops = []; g.player.x = W / 2; g.player.y = H - 90; g.player.hp = Math.min(g.player.maxHp, g.player.hp + 6); g.log = [`Room ${g.roomIndex + 1} re-forms: ${g.room.name}.`, ...g.log].slice(0, 7); sync();
  };
  const takeReward = (drop) => {
    const g = game.current; const item = drop.item; g.inventory.push(item); g.stats = itemStats(g.inventory); g.player.maxHp = BASE_HP + g.stats.hp; g.player.hp = Math.min(g.player.maxHp, g.player.hp + 8); const ids = unlocks.includes(item.id) ? unlocks : [...unlocks, item.id]; setUnlocks(ids); saveUnlocks(ids); g.drops = g.drops.filter(d => d !== drop); append(`Unlocked ${item.name}. It can appear in future crawls.`);
  };
  const hurtPlayer = (amount) => {
    const g = game.current; const p = g.player; if (p.invuln > 0 || p.roll > 0) return; const dmg = Math.max(1, amount + g.stats.curse - (build.armor || 0) - g.stats.armor); p.hp -= dmg; p.invuln = 500; g.log = [`Hit for ${dmg}.`, ...g.log].slice(0, 7); if (p.hp <= 0 && g.stats.seal && !p.sealSpent) { p.hp = 1; p.sealSpent = true; g.log.unshift('The Cracked Charter Seal refuses the end.'); } if (p.hp <= 0) { g.ended = 'The Undercrypts close over you. Inventory lost; unlocks remain.'; setScreen('ended'); } sync();
  };
  const doMelee = () => {
    const g = game.current; const p = g.player; if (p.attackCd > 0) return; const a = Math.atan2(mouse.current.y - p.y, mouse.current.x - p.x); const atk = { x: p.x, y: p.y, angle: a, life: build.wind, max: build.wind, reach: build.reach, arc: build.arc, color: build.color }; p.attack = build.wind; p.attackCd = build.wind + 120; g.slashes.push(atk); const dmg = build.damage + g.stats.melee; let hit = false; g.room.enemies.forEach(e => { const d = Math.hypot(e.x - p.x, e.y - p.y); const da = Math.abs(normAngle(Math.atan2(e.y - p.y, e.x - p.x) - a)); if (d <= build.reach + e.r && da <= build.arc / 2) { e.hp -= dmg; e.hit = 140; e.stun = Math.max(e.stun, 120 + g.stats.stagger * 160); hit = true; } }); if (hit && build.heal) p.hp = Math.min(p.maxHp, p.hp + build.heal); g.room.enemies = g.room.enemies.filter(e => e.hp > 0); if (hit) g.log = [`${build.name} lands for ${dmg}.`, ...g.log].slice(0, 7); finishRoom(); sync();
  };
  const doShoot = () => {
    const g = game.current; const p = g.player; if (p.attackCd > 0) return; const flint = g.inventory.some(i => i.id === 'flintlock') && p.powder > 0; if (!flint && p.arrows <= 0) return append('No shot left. Close distance.'); const a = Math.atan2(mouse.current.y - p.y, mouse.current.x - p.x); if (flint) p.powder -= 1; else p.arrows -= 1; p.attackCd = flint ? 520 : 260; g.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(a) * (flint ? 620 : 520), vy: Math.sin(a) * (flint ? 620 : 520), r: flint ? 5 : 4, damage: flint ? 13 + g.stats.shot : 7, life: 900, color: flint ? '#ffcf8b' : '#d8e4ac' }); sync();
  };
  const roll = () => { const g = game.current; if (!g || g.player.roll > 0 || g.player.attackCd > 0) return; g.player.roll = 280; g.player.invuln = 280; };

  useEffect(() => {
    const down = (e) => { keys.current[e.key.toLowerCase()] = true; if (e.code === 'Space') { e.preventDefault(); doMelee(); } if (e.key.toLowerCase() === 'shift') roll(); if (e.key.toLowerCase() === 'f') doShoot(); };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [build, unlocks]);

  useEffect(() => {
    if (screen !== 'crawl') return undefined;
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const rectPoint = (e) => { const r = canvas.getBoundingClientRect(); mouse.current.x = (e.clientX - r.left) * (W / r.width); mouse.current.y = (e.clientY - r.top) * (H / r.height); };
    const move = (e) => rectPoint(e); const md = (e) => { rectPoint(e); if (e.button === 2) doShoot(); else doMelee(); }; const context = (e) => e.preventDefault();
    canvas.addEventListener('mousemove', move); canvas.addEventListener('mousedown', md); canvas.addEventListener('contextmenu', context);
    const loop = (t) => {
      const dt = Math.min(32, t - (last.current || t)); last.current = t; const g = game.current;
      if (g && !g.ended) {
        const p = g.player; const sp = 185 * (build.speed || 1) * (p.roll > 0 ? 2.25 : 1); let mx = 0, my = 0; if (keys.current.w || keys.current.arrowup) my -= 1; if (keys.current.s || keys.current.arrowdown) my += 1; if (keys.current.a || keys.current.arrowleft) mx -= 1; if (keys.current.d || keys.current.arrowright) mx += 1; const mag = Math.hypot(mx, my) || 1; p.x = clamp(p.x + (mx / mag) * sp * dt / 1000, 34, W - 34); p.y = clamp(p.y + (my / mag) * sp * dt / 1000, 34, H - 34); p.invuln = Math.max(0, p.invuln - dt); p.attackCd = Math.max(0, p.attackCd - dt); p.roll = Math.max(0, p.roll - dt);
        g.slashes.forEach(s => s.life -= dt); g.slashes = g.slashes.filter(s => s.life > 0);
        g.projectiles.forEach(pr => { pr.x += pr.vx * dt / 1000; pr.y += pr.vy * dt / 1000; pr.life -= dt; g.room.enemies.forEach(e => { if (pr.life > 0 && dist(pr, e) < pr.r + e.r) { e.hp -= pr.damage; e.hit = 120; pr.life = 0; } }); }); g.projectiles = g.projectiles.filter(pr => pr.life > 0 && pr.x > 0 && pr.x < W && pr.y > 0 && pr.y < H); g.room.enemies = g.room.enemies.filter(e => e.hp > 0);
        g.room.enemies.forEach(e => { e.hit = Math.max(0, e.hit - dt); e.cd = Math.max(0, e.cd - dt); e.stun = Math.max(0, e.stun - dt); if (e.stun <= 0) { const a = Math.atan2(p.y - e.y, p.x - e.x); e.x += Math.cos(a) * e.speed * dt / 1000; e.y += Math.sin(a) * e.speed * dt / 1000; } if (dist(e, p) < e.r + p.r + 4 && e.cd <= 0) { e.cd = 650; hurtPlayer(e.damage); } });
        g.drops.forEach(d => { if (dist(d, p) < d.r + p.r) takeReward(d); }); if (!g.room.enemies.length) finishRoom();
      }
      draw(ctx, game.current, build, mouse.current); raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf.current); canvas.removeEventListener('mousemove', move); canvas.removeEventListener('mousedown', md); canvas.removeEventListener('contextmenu', context); };
  }, [screen, build]);

  const stat = snapshot?.stats || itemStats([]);
  const p = snapshot?.player;
  if (screen === 'menu') return <Menu race={race} setRace={setRace} bloodline={bloodline} setBloodline={setBloodline} bloodlines={bloodlines} build={build} unlocks={unlocks} onExit={onExit} onStart={startRun} />;
  return <div className="uc-shell"><style>{styles}</style><button className="uc-back" onClick={() => setScreen('menu')}>Run Menu</button><header className="uc-top"><div><div className="uc-kicker">Floor {snapshot?.floor} - Room {(snapshot?.roomIndex || 0) + 1}</div><h1>{snapshot?.room?.name || 'Undercrypts'}</h1><p>{raceLabel(race, bloodline)} - {build.name}</p></div><div className="uc-vitals"><b>{Math.max(0, Math.ceil(p?.hp || 0))}/{p?.maxHp || BASE_HP}</b><span>HP</span><b>{p?.arrows || 0}</b><span>Arrows</span><b>{p?.powder || 0}</b><span>Powder</span></div></header><main className="uc-play"><section className="uc-stage"><canvas ref={canvasRef} width={W} height={H} /></section><aside className="uc-side"><div className="uc-card"><h2>Live Controls</h2><p>WASD move. Mouse aims. Left click or Space melee. Right click or F shoots. Shift dodges.</p><button className="uc-primary" disabled={(snapshot?.room?.enemies?.length || snapshot?.enemies || 0) > 0} onClick={nextRoom}>Next Room</button></div><div className="uc-card"><h2>Inventory This Crawl</h2><div className="uc-inventory">{(snapshot?.inventory || []).map((i, idx) => <div key={idx}><b>{i.name}</b><span>{i.desc}</span></div>)}</div></div><div className="uc-card"><h2>Room Log</h2><div className="uc-log">{(snapshot?.log || []).map((l, i) => <p key={i}>{l}</p>)}</div></div></aside></main>{screen === 'ended' && <div className="uc-ended"><div><h2>Crawl Complete</h2><p>{snapshot?.ended}</p><button onClick={() => setScreen('menu')}>Return to Title</button></div></div>}</div>;
}

function draw(ctx, g, build, mouse) {
  ctx.clearRect(0, 0, W, H); ctx.fillStyle = '#0b0704'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 60; i++) { const x = (i * 137) % W; const y = (i * 79) % H; ctx.fillStyle = i % 7 === 0 ? 'rgba(214,177,84,.07)' : 'rgba(255,255,255,.025)'; ctx.fillRect(x, y, 2, 2); }
  ctx.strokeStyle = 'rgba(214,177,84,.18)'; ctx.lineWidth = 2; ctx.strokeRect(24, 24, W - 48, H - 48);
  if (!g) return; const p = g.player;
  g.slashes.forEach(s => { const alpha = Math.max(0, s.life / s.max); ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.angle); ctx.globalAlpha = alpha; ctx.fillStyle = s.color; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, s.reach, -s.arc / 2, s.arc / 2); ctx.closePath(); ctx.fill(); ctx.restore(); });
  g.drops.forEach(d => { ctx.fillStyle = '#f0d992'; ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#100b05'; ctx.font = 'bold 16px Georgia'; ctx.textAlign = 'center'; ctx.fillText('?', d.x, d.y + 5); });
  g.projectiles.forEach(pr => { ctx.fillStyle = pr.color; ctx.beginPath(); ctx.arc(pr.x, pr.y, pr.r, 0, Math.PI * 2); ctx.fill(); });
  g.room.enemies.forEach(e => { ctx.fillStyle = e.hit ? '#ffd1bd' : e.color; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.72)'; ctx.fillRect(e.x - 22, e.y - e.r - 13, 44, 5); ctx.fillStyle = '#d8664a'; ctx.fillRect(e.x - 22, e.y - e.r - 13, 44 * Math.max(0, e.hp / e.maxHp), 5); ctx.fillStyle = '#f5ddaf'; ctx.font = '10px Cinzel, serif'; ctx.textAlign = 'center'; ctx.fillText(e.name.split(' ')[0], e.x, e.y + e.r + 14); });
  const aim = Math.atan2(mouse.y - p.y, mouse.x - p.x); ctx.strokeStyle = 'rgba(240,217,146,.28)'; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + Math.cos(aim) * build.reach, p.y + Math.sin(aim) * build.reach); ctx.stroke();
  ctx.fillStyle = p.invuln > 0 ? '#fff2bd' : '#f0d992'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = build.color; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#0b0704'; ctx.font = 'bold 16px Georgia'; ctx.fillText('@', p.x, p.y + 5);
}

function Menu({ race, setRace, bloodline, setBloodline, bloodlines, build, unlocks, onExit, onStart }) {
  return <div className="uc-shell"><style>{styles}</style><button className="uc-back" onClick={onExit}>Back to Bag</button><section className="uc-hero"><div className="uc-kicker">Lotjarr's Bag of Games</div><h1>The Undercrypts of Soteria</h1><p>Descend, survive, return changed.</p></section><main className="uc-menu"><div className="uc-card"><h2>Choose Blood</h2><select value={race} onChange={e => setRace(e.target.value)}>{RACES.map(r => <option key={r.id} value={r.id}>{r.name} - {r.sub}</option>)}</select>{race === 'pamorph' && <select value={bloodline} onChange={e => setBloodline(e.target.value)}>{bloodlines.map(b => <option key={b.id} value={b.id}>{b.name} - {b.sub}</option>)}</select>}<div className="uc-stance"><b>{build.name}</b><span>{build.note}</span><em>Style: {build.style} / Reach: {build.reach} / Damage: {build.damage}</em></div><button className="uc-primary" onClick={onStart}>Begin Real-Time Crawl</button></div><div className="uc-card"><h2>Unlocked Pool</h2><div className="uc-unlocks">{ITEMS.map(i => <span key={i.id} className={unlocks.includes(i.id) ? 'on' : ''}>{i.name}</span>)}</div><p>Held inventory resets at the end of each crawl. Unlocked items stay unlocked and enter future room reward pools.</p></div></main></div>;
}

const styles = `
.uc-shell { min-height:100vh; background:radial-gradient(circle at 50% 8%, rgba(88,62,24,.28), transparent 34%), #040302; color:#eadfca; font-family:Georgia,serif; padding:28px; box-sizing:border-box; }
.uc-back { position:fixed; top:16px; left:16px; z-index:6; border:1px solid rgba(214,177,84,.45); background:linear-gradient(#1f170d,#080604); color:#d8c28a; border-radius:8px; padding:10px 15px; font-family:Cinzel,serif; font-size:10px; letter-spacing:.14em; text-transform:uppercase; cursor:pointer; }
.uc-hero { text-align:center; padding:72px 20px 30px; } .uc-kicker { font-family:Cinzel,serif; color:rgba(214,177,84,.72); font-size:10px; letter-spacing:.24em; text-transform:uppercase; } .uc-hero h1,.uc-top h1 { margin:8px 0; font-family:Cinzel,serif; color:#f2deb0; letter-spacing:.12em; text-transform:uppercase; } .uc-hero h1 { font-size:clamp(34px,6vw,66px); } .uc-hero p,.uc-top p,.uc-card p { color:rgba(234,223,202,.62); font-style:italic; }
.uc-menu { max-width:1040px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:18px; } .uc-card { border:1px solid rgba(214,177,84,.2); border-radius:14px; background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(10,7,4,.88)); padding:18px; box-shadow:0 24px 70px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,240,190,.08); } .uc-card h2 { margin:0 0 14px; font-family:Cinzel,serif; color:#ead29a; font-size:13px; letter-spacing:.16em; text-transform:uppercase; }
.uc-card select { width:100%; margin-bottom:10px; min-height:40px; border:1px solid rgba(214,177,84,.28); border-radius:8px; background:#0e0a06; color:#eadfca; padding:0 10px; } .uc-stance { margin:12px 0; padding:14px; border:1px solid rgba(214,177,84,.16); border-radius:10px; } .uc-stance b { display:block; color:#f0d992; font-family:Cinzel,serif; } .uc-stance span,.uc-stance em { display:block; margin-top:6px; color:rgba(234,223,202,.58); }
.uc-primary,.uc-ended button { width:100%; border:1px solid rgba(214,177,84,.42); border-radius:8px; background:linear-gradient(#3b2c12,#120c06); color:#f0d992; min-height:38px; padding:0 12px; font-family:Cinzel,serif; font-size:10px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; } button:disabled { opacity:.35; cursor:default; }
.uc-unlocks { display:flex; flex-wrap:wrap; gap:8px; } .uc-unlocks span { border:1px solid rgba(214,177,84,.16); border-radius:999px; color:rgba(234,223,202,.38); padding:6px 9px; font-size:11px; } .uc-unlocks span.on { color:#f0d992; border-color:rgba(214,177,84,.5); background:rgba(214,177,84,.08); }
.uc-top { max-width:1380px; margin:16px auto; display:flex; justify-content:space-between; gap:20px; align-items:center; } .uc-vitals { min-width:300px; display:grid; grid-template-columns:repeat(3,1fr); gap:4px 8px; text-align:center; border:1px solid rgba(214,177,84,.22); border-radius:12px; padding:12px; background:rgba(0,0,0,.24); } .uc-vitals b { color:#f0d992; font-size:18px; } .uc-vitals span { color:rgba(234,223,202,.52); font-size:10px; text-transform:uppercase; letter-spacing:.14em; }
.uc-play { max-width:1380px; margin:0 auto; display:grid; grid-template-columns:minmax(720px,1fr) 340px; gap:18px; align-items:start; } .uc-stage { border:1px solid rgba(214,177,84,.24); border-radius:18px; padding:14px; background:linear-gradient(145deg,#171006,#070504); box-shadow:0 30px 90px rgba(0,0,0,.55); } canvas { width:100%; display:block; border-radius:12px; background:#090604; cursor:crosshair; }
.uc-side { display:grid; gap:12px; } .uc-inventory { display:grid; gap:8px; max-height:230px; overflow:auto; } .uc-inventory div { border-top:1px solid rgba(214,177,84,.12); padding-top:8px; } .uc-inventory b { display:block; color:#ead29a; } .uc-inventory span,.uc-log p { color:rgba(234,223,202,.56); font-size:12px; margin:4px 0 0; } .uc-log { max-height:190px; overflow:auto; }
.uc-ended { position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.72); z-index:10; } .uc-ended div { width:min(420px,90vw); border:1px solid rgba(214,177,84,.45); border-radius:16px; background:#0b0704; padding:24px; text-align:center; box-shadow:0 30px 90px rgba(0,0,0,.7); } .uc-ended h2 { font-family:Cinzel,serif; color:#f0d992; letter-spacing:.16em; text-transform:uppercase; }
@media (max-width:1080px){ .uc-menu,.uc-play{grid-template-columns:1fr}.uc-top{flex-direction:column;text-align:center}.uc-vitals{width:min(100%,360px)} }
`;
