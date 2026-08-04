import { useEffect, useMemo, useRef, useState } from 'react';
import { RACES, PM_MAJ, PM_MIN, PM_AEON, PM_ASTRAL, ALL_STATS, getRaceDisplay } from './constants';
import { useDevice } from './useDevice';
import { ComingSoonScreen } from './GameUI';
import { recordLotjarrsGameResult } from './gameStats';
import supabase from './lib/supabase';

const STORAGE_KEY = 'undercrypts_unlocks_v2';
const START_UNLOCKS = ['rusted-sabre', 'knuckle-wraps', 'shortbow'];
const W = 960;
const H = 620;
const ROOM_GOAL = 6;
const BLOODLINES = [...PM_MAJ, ...PM_MIN, ...PM_AEON, ...PM_ASTRAL];
const BASE_HP = 28;
const SURGE_THRESHOLD = 34;
const PLAYER_SHEET_COLS = 7;
const PLAYER_SHEET_ROWS = 3;
const PLAYER_SHEET_ROW = { down: 0, left: 1, up: 2 };
const APPEARANCES = [
  { id: 'etowan', name: 'Etowan', src: '/Sprites/etowan.png' },
  { id: 'sirkier', name: 'Sirkier', src: '/Sprites/sirkier.png' },
  { id: 'sirphlar', name: 'Sirphlar', src: '/Sprites/sirphlar.png' },
];
const PLAYER_SHEET_IMGS = Object.fromEntries(APPEARANCES.map(a => [a.id, Object.assign(new Image(), { src: a.src })]));

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
  { name: 'Mine Rat', hp: 10, speed: 96, damage: 3, color: '#45505a', r: 11 },
  { name: 'Grimrite Goblin', hp: 14, speed: 104, damage: 4, color: '#6f8d83', r: 12 },
  { name: 'Fetch Direlizard', hp: 13, speed: 78, damage: 4, color: '#7aa05f', r: 13 },
  { name: 'Duergar Delver', hp: 20, speed: 50, damage: 6, color: '#9a7058', r: 15 },
];
const BOSSES = [
  { name: 'Abyssal Ogre', hp: 76, speed: 42, damage: 10, color: '#b8c5cf', r: 28 },
  { name: 'Heiress Naga', hp: 62, speed: 70, damage: 8, color: '#b1798b', r: 24 },
];
const ROOM_NAMES = ['Drowned Reliquary', 'Root-Cracked Archive', 'Ash Pump Chapel', 'Corren Service Tunnel', 'Lower Menagerie', 'Black Charter Annex', 'Forgotten Tollhouse'];
const ORIGINS = [
  { id: 'crypt-survivor', name: 'Crypt Survivor', affinity: -10, kit: ['rusted-sabre', 'knuckle-wraps'], note: 'You know how stone rooms kill people.' },
  { id: 'failed-apprentice', name: 'Failed Apprentice', affinity: 24, kit: ['shortbow'], note: 'Small magicka pulses reveal hidden mechanisms.' },
  { id: 'guild-runner', name: 'Guild Runner', affinity: -22, kit: ['shortbow', 'brunar-powder'], note: 'Ingenium instincts, good feet, suspicious habits.' },
  { id: 'temple-ward', name: 'Temple Ward', affinity: 8, kit: ['charter-seal'], note: 'You carry a cracked legal blessing against death.' },
];
const TOWN_LOCATIONS = [
  { id: 'inn', name: 'The Low Lantern Inn', lead: 'Rest, rumors, and paid cowardice.', action: 'Rest', reply: 'The innkeeper marks your name on a slate. If you return, she says, the first drink is not free.', pct: [0.19, 0.22],
    interior: { theme: 'inn', w: 640, h: 420, hotspots: [
      { id: 'innkeeper', kind: 'npc', name: 'Sela, the Innkeeper', pct: [0.5, 0.32], line: 'The innkeeper marks your name on a slate. If you return, she says, the first drink is not free.' },
      { id: 'hearth', kind: 'action', name: 'Rest by the Hearth', pct: [0.18, 0.62], line: 'You take the corner seat nearest the fire. The ache in your shoulders forgets itself, for now.' },
      { id: 'slate', kind: 'flavor', name: 'The Slate', pct: [0.82, 0.28], line: 'Names, tallies, small debts. Yours is near the bottom, freshly scratched.' },
      { id: 'door', kind: 'exit', name: 'Door', pct: [0.5, 0.92] },
    ] } },
  { id: 'market', name: 'Blackstep Market', lead: 'Scrap charms, canal knives, and old civic keys.', action: 'Browse', reply: 'A trader shows you chalk, oil, and a lockpick bent into the shape of a prayer.', pct: [0.49, 0.16],
    interior: { theme: 'market', w: 640, h: 420, hotspots: [
      { id: 'trader', kind: 'npc', name: 'A Blackstep Trader', pct: [0.5, 0.3], line: 'A trader shows you chalk, oil, and a lockpick bent into the shape of a prayer.' },
      { id: 'scrapbin', kind: 'flavor', name: 'Scrap Bin', pct: [0.2, 0.65], line: "Canal knives, bent keys, a music box that only hums in one key." },
      { id: 'backstall', kind: 'flavor', name: 'Back Stall', pct: [0.8, 0.65], line: "A woman sells silence for a price you don't ask about." },
      { id: 'door', kind: 'exit', name: 'Door', pct: [0.5, 0.92] },
    ] } },
  { id: 'archive', name: 'Civic Reliquary', lead: 'Town records sit beside recovered crypt tablets.', action: 'Ask', reply: 'The reliquary notes a sealed municipal stair beneath the old charter house. Not a tomb. Worse: infrastructure.', pct: [0.81, 0.28],
    interior: { theme: 'archive', w: 640, h: 420, hotspots: [
      { id: 'clerk', kind: 'npc', name: 'Reliquary Clerk', pct: [0.5, 0.3], line: 'The reliquary notes a sealed municipal stair beneath the old charter house. Not a tomb. Worse: infrastructure.' },
      { id: 'shelf', kind: 'flavor', name: 'Records Shelf', pct: [0.22, 0.6], line: "Ashendell's ledgers, a century deep. Somewhere in here, the town forgot something on purpose." },
      { id: 'cabinet', kind: 'flavor', name: 'Locked Cabinet', pct: [0.78, 0.6], line: 'Sealed. The civic kind of sealed — the kind that outlasts kings.' },
      { id: 'door', kind: 'exit', name: 'Door', pct: [0.5, 0.92] },
    ] } },
  { id: 'engineer', name: 'Veinrunner Workshed', lead: 'Ingenium lamps flicker against old ward-glass.', action: 'Check gear', reply: 'The engineer taps your weapon and mutters that magic makes cowards of tolerances.', pct: [0.31, 0.78],
    interior: { theme: 'workshop', w: 640, h: 420, hotspots: [
      { id: 'engineer', kind: 'npc', name: 'The Engineer', pct: [0.5, 0.3], line: 'The engineer taps your weapon and mutters that magic makes cowards of tolerances.' },
      { id: 'workbench', kind: 'action', name: 'Calibrate Gear', pct: [0.25, 0.65], line: 'She adjusts something in your kit that hums instead of glows. Ingenium instinct, sharpened for the next descent.' },
      { id: 'partsbin', kind: 'flavor', name: 'Parts Bin', pct: [0.75, 0.65], line: "Springs, valves, a flintlock hammer that doesn't fit any flintlock anyone's seen." },
      { id: 'door', kind: 'exit', name: 'Door', pct: [0.5, 0.92] },
    ] } },
  { id: 'gate', name: 'The Undercrypt Gate', lead: 'A civic door descends under Ashendell, newly breathing cold air.', action: 'Descend', reply: 'The gate opens with a dry metallic cough. Your crawl begins below the lower town.', pct: [0.73, 0.8] },
];
const TOWN_W = 960;
const TOWN_H = 620;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const ang = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const normAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function uniqueItems(items) { return [...new Map(items.map(item => [item.id, item])).values()]; }
function loadUnlocks() { try { return [...new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || START_UNLOCKS)]; } catch { return START_UNLOCKS; } }
function saveUnlocks(ids) { localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)])); }
function raceLabel(raceId, bloodlineId) { const r = RACES.find(x => x.id === raceId); if (!r) return 'Wanderer'; if (raceId !== 'pamorph') return r.name; const b = BLOODLINES.find(x => x.id === bloodlineId); return b ? `Pa'morph - ${b.name}` : "Pa'morph"; }
function attackBuild(raceId, bloodlineId) { const base = RACE_ATTACKS[raceId] || RACE_ATTACKS.addamar; const t = raceId === 'pamorph' ? (PA_TRAITS[bloodlineId] || {}) : {}; return { ...base, ...t, reach: base.reach + (t.reach || 0), damage: base.damage + (t.damage || 0), armor: (base.armor || 0) + (t.armor || 0), heal: (base.heal || 0) + (t.heal || 0), speed: (base.speed || 1) * (t.speed || 1), note: base.note }; }
function affinityFor(raceId, originId) { const origin = ORIGINS.find(o => o.id === originId) || ORIGINS[0]; const raceBias = { trink: -20, chronison: -16, durinak: -10, djinn: 22, fae: 18, seraphan: 15, helianth: 10, telari: 8, pamorph: 0 }[raceId] || 0; return clamp(origin.affinity + raceBias, -50, 50); }
function affinityLabel(score) { if (score <= -25) return 'Ingenium-leaning'; if (score >= 25) return 'Magicka-leaning'; return 'Balanced aptitude'; }
function statAffinity(stats) { if (!stats) return null; const magic = (stats.spirit || 8) + (stats.soul || 8) + (stats.body || 8) + (stats.essence || 8); const tech = (stats.will || 8) + (stats.whim || 8) + (stats.mind || 8) + (stats.dream || 8); return clamp(Math.round((magic - tech) * 1.5), -50, 50); }
function itemStats(inventory) { return inventory.reduce((m, item) => { if (item.id === 'rusted-sabre') m.melee += 1; if (item.id === 'knuckle-wraps') m.armor += 1; if (item.id === 'shortbow') m.arrows += 5; if (item.id === 'honourarc') { m.melee += 1; m.arrows += 3; } if (item.id === 'grimrite-edge') { m.melee += 3; m.curse += 1; } if (item.id === 'sylvan-lung') m.hp += 8; if (item.id === 'flintlock') { m.powder += 2; m.shot += 8; } if (item.id === 'brunar-powder') m.powder += 3; if (item.id === 'veinrunner-spike') m.stagger += 1; if (item.id === 'charter-seal') m.seal = true; return m; }, { melee: 0, armor: 0, arrows: 0, powder: 0, shot: 0, hp: 0, curse: 0, stagger: 0, seal: false }); }
function makeRoom(index, floor, unlocks) { const boss = index >= ROOM_GOAL - 1; const count = boss ? 1 : 4 + Math.floor(Math.random() * 3) + floor; const pool = boss ? BOSSES : ENEMY_TYPES; const enemies = Array.from({ length: count }, (_, i) => { const src = pick(pool); return { ...src, id: `${Date.now()}-${i}`, maxHp: src.hp + floor * (boss ? 18 : 5), hp: src.hp + floor * (boss ? 18 : 5), x: 150 + Math.random() * (W - 300), y: 120 + Math.random() * (H - 240), hit: 0, cd: 0, stun: 0 }; }); return { index, floor, boss, name: boss ? 'Undercrypt Heart' : pick(ROOM_NAMES), enemies, reward: pick(ITEMS.filter(i => unlocks.includes(i.id))) }; }

export default function Undercrypts({ onExit, userId }) {
  const { isMobile } = useDevice();
  const canvasRef = useRef(null);
  const keys = useRef({});
  const mouse = useRef({ x: W / 2, y: H / 2, down: false, right: false });
  const game = useRef(null);
  const raf = useRef(null);
  const last = useRef(0);
  const [screen, setScreen] = useState('menu');
  const [race, setRace] = useState('drakazir');
  const [bloodline, setBloodline] = useState(PM_MAJ[0]?.id || 'aaravok');
  const [origin, setOrigin] = useState('crypt-survivor');
  const [appearance, setAppearance] = useState(APPEARANCES[0].id);
  const [townLog, setTownLog] = useState(['Ashendell is awake. The Undercrypt Gate has begun breathing again.']);
  const [unlocks, setUnlocks] = useState(loadUnlocks);
  const [snapshot, setSnapshot] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [interiorLoc, setInteriorLoc] = useState(null);
  const [rested, setRested] = useState(false);
  const [calibration, setCalibration] = useState(null);
  const bloodlines = BLOODLINES;

  useEffect(() => {
    if (!userId) return;
    supabase.from('characters').select('id, name, data, status').eq('user_id', userId).not('status', 'eq', 'rejected').then(({ data }) => {
      const rows = data || []; setCharacters(rows);
      if (rows.length) setSelectedCharId(prev => prev || rows[0].id);
    });
  }, [userId]);

  const activeChar = useMemo(() => characters.find(c => c.id === selectedCharId) || null, [characters, selectedCharId]);
  const charData = activeChar?.data || null;
  const activeRace = charData?.race || race;
  const activeBloodline = charData?.pmV || bloodline;
  const wandererName = activeChar ? (activeChar.name || 'Unnamed') : raceLabel(activeRace, activeBloodline);
  const build = useMemo(() => attackBuild(activeRace, activeBloodline), [activeRace, activeBloodline]);
  const affinity = useMemo(() => statAffinity(charData?.stats) ?? affinityFor(activeRace, origin), [charData, activeRace, origin]);

  const sync = () => setSnapshot(game.current ? { ...game.current, enemies: game.current.room.enemies.length } : null);
  const append = (msg) => { if (!game.current) return; game.current.log = [msg, ...game.current.log].slice(0, 7); sync(); };
  const startRun = () => {
    const originKit = ORIGINS.find(o => o.id === origin)?.kit || [];
    const inventory = uniqueItems(ITEMS.filter(i => [...START_UNLOCKS, ...originKit].includes(i.id)));
    const stats = itemStats(inventory);
    const restBonus = rested ? 4 : 0; const runAffinity = clamp(affinity + (calibration || 0), -50, 50);
    game.current = { floor: 1, roomIndex: 0, room: makeRoom(0, 1, unlocks), inventory, stats, sheet: PLAYER_SHEET_IMGS[appearance] || PLAYER_SHEET_IMGS[APPEARANCES[0].id], player: { x: W / 2, y: H - 90, r: 15, hp: BASE_HP + stats.hp + restBonus, maxHp: BASE_HP + stats.hp + restBonus, arrows: 8 + stats.arrows, powder: stats.powder, invuln: 0, attack: 0, attackCd: 0, roll: 0, sealSpent: false, affinity: runAffinity, frame: 0, frameTimer: 0 }, projectiles: [], slashes: [], drops: [], log: [`${wandererName} descends with ${build.name}.`], ended: null };
    setScreen('crawl'); sync(); setRested(false); setCalibration(null);
  };
  const finishRoom = () => {
    const g = game.current; if (!g || g.room.enemies.length) return;
    if (!g.drops.some(d => d.kind === 'reward')) g.drops.push({ kind: 'reward', item: g.room.reward, x: W / 2, y: H / 2, r: 18 });
  };
  const nextRoom = () => {
    const g = game.current; if (!g || g.room.enemies.length) return;
    if (g.room.boss) { recordLotjarrsGameResult('undercrypts', { playerName: wandererName, outcome: 'complete', score: g.floor, scoreLabel: `Floor ${g.floor}`, meta: { origin } }); g.ended = 'You return changed. Inventory resets; unlocks remain.'; setScreen('ended'); sync(); return; }
    g.roomIndex += 1; g.room = makeRoom(g.roomIndex, g.floor, unlocks); g.projectiles = []; g.slashes = []; g.drops = []; g.player.x = W / 2; g.player.y = H - 90; g.player.hp = Math.min(g.player.maxHp, g.player.hp + 6); g.log = [`Room ${g.roomIndex + 1} re-forms: ${g.room.name}.`, ...g.log].slice(0, 7); sync();
  };
  const takeReward = (drop) => {
    const g = game.current; const item = drop.item; const alreadyHeld = g.inventory.some(i => i.id === item.id); const alreadyUnlocked = unlocks.includes(item.id); if (!alreadyHeld) g.inventory.push(item); g.inventory = uniqueItems(g.inventory); g.stats = itemStats(g.inventory); g.player.maxHp = BASE_HP + g.stats.hp; g.player.hp = Math.min(g.player.maxHp, g.player.hp + (alreadyHeld ? 12 : 8)); const ids = alreadyUnlocked ? unlocks : [...unlocks, item.id]; setUnlocks([...new Set(ids)]); saveUnlocks(ids); g.drops = g.drops.filter(d => d !== drop); append(alreadyHeld ? `${item.name} is already in your kit. You salvage it for breath and binding.` : alreadyUnlocked ? `Recovered ${item.name}. It joins this crawl's kit.` : `Unlocked ${item.name}. It can appear in future crawls.`);
  };
  const applyDeath = () => {
    const g = game.current; recordLotjarrsGameResult('undercrypts', { playerName: wandererName, outcome: 'loss', score: Math.max(0, g.floor - 1), scoreLabel: `Floor ${g.floor}`, meta: { origin } }); g.ended = 'The Undercrypts close over you. Inventory lost; unlocks remain.'; setScreen('ended');
  };
  const shiftAffinity = (delta) => {
    const g = game.current; if (!g || !delta) return; const p = g.player; const before = p.affinity; p.affinity = clamp(before + delta, -50, 50);
    const wasSurge = Math.abs(before) >= SURGE_THRESHOLD; const nowSurge = Math.abs(p.affinity) >= SURGE_THRESHOLD;
    if (!wasSurge && nowSurge) g.log = [p.affinity > 0 ? 'Grimrite resonance floods your limbs. Ingenium gear grows unreliable.' : 'Ingenium instinct hardens your nerve. Grimrite gear grows unstable.', ...g.log].slice(0, 7);
  };
  const hurtPlayer = (amount) => {
    const g = game.current; const p = g.player; if (p.invuln > 0 || p.roll > 0) return; const dmg = Math.max(1, amount + g.stats.curse - (build.armor || 0) - g.stats.armor); p.hp -= dmg; p.invuln = 500; g.log = [`Hit for ${dmg}.`, ...g.log].slice(0, 7); if (p.hp <= 0 && g.stats.seal && !p.sealSpent) { p.hp = 1; p.sealSpent = true; g.log.unshift('The Cracked Charter Seal refuses the end.'); } if (p.hp <= 0) applyDeath(); sync();
  };
  const selfBackfire = (amount, msg) => {
    const g = game.current; const p = g.player; p.hp -= amount; g.log = [msg, ...g.log].slice(0, 7); if (p.hp <= 0 && g.stats.seal && !p.sealSpent) { p.hp = 1; p.sealSpent = true; g.log.unshift('The Cracked Charter Seal refuses the end.'); } if (p.hp <= 0) applyDeath();
  };
  const doMelee = () => {
    const g = game.current; if (!g) return; const p = g.player; if (p.attackCd > 0) return; const a = Math.atan2(mouse.current.y - p.y, mouse.current.x - p.x); const atk = { x: p.x, y: p.y, angle: a, life: build.wind, max: build.wind, reach: build.reach, arc: build.arc, color: build.color }; p.attack = build.wind; p.attackCd = build.wind + 120; g.slashes.push(atk);
    const hasGrimrite = g.inventory.some(i => i.id === 'grimrite-edge'); const hasSpike = g.inventory.some(i => i.id === 'veinrunner-spike'); const hasHonourarc = g.inventory.some(i => i.id === 'honourarc');
    const backfire = hasGrimrite && p.affinity <= -SURGE_THRESHOLD && Math.random() < 0.4;
    const dmg = build.damage + g.stats.melee - (backfire ? 3 : 0); let hit = false;
    g.room.enemies.forEach(e => { const d = Math.hypot(e.x - p.x, e.y - p.y); const da = Math.abs(normAngle(Math.atan2(e.y - p.y, e.x - p.x) - a)); if (d <= build.reach + e.r && da <= build.arc / 2) { e.hp -= dmg; e.hit = 140; e.stun = Math.max(e.stun, 120 + g.stats.stagger * 160); hit = true; } });
    if (hit && build.heal) p.hp = Math.min(p.maxHp, p.hp + build.heal); g.room.enemies = g.room.enemies.filter(e => e.hp > 0); if (hit) g.log = [`${build.name} lands for ${dmg}.`, ...g.log].slice(0, 7);
    if (hit) { let push = 0; if (hasGrimrite) push += 2.2; if (hasHonourarc) push += 1; if (hasSpike) push -= 2; if (push) shiftAffinity(push); }
    if (backfire && hit) selfBackfire(2, 'The Grimrite Edge bites back against your Ingenium-tuned hands.');
    finishRoom(); sync();
  };
  const doShoot = () => {
    const g = game.current; if (!g) return; const p = g.player; if (p.attackCd > 0) return; const flint = g.inventory.some(i => i.id === 'flintlock') && p.powder > 0; if (!flint && p.arrows <= 0) return append('No shot left. Close distance.');
    if (flint) p.powder -= 1; else p.arrows -= 1; p.attackCd = flint ? 520 : 260;
    const jam = flint && p.affinity >= SURGE_THRESHOLD && Math.random() < 0.4;
    if (jam) { g.log = ["The flintlock's mechanism seizes — grimrite resonance fouls the powder.", ...g.log].slice(0, 7); return sync(); }
    const a = Math.atan2(mouse.current.y - p.y, mouse.current.x - p.x); g.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(a) * (flint ? 620 : 520), vy: Math.sin(a) * (flint ? 620 : 520), r: flint ? 5 : 4, damage: flint ? 13 + g.stats.shot : 7, life: 900, color: flint ? '#ffcf8b' : '#d8e4ac' });
    if (flint) shiftAffinity(-2.4); sync();
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
        p.frameTimer = (p.frameTimer || 0) + dt; if (mx || my) { if (p.frameTimer > 90) { p.frameTimer = 0; p.frame = ((p.frame || 0) + 1) % PLAYER_SHEET_COLS; } } else { p.frame = 0; p.frameTimer = 0; }
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

  if (isMobile) return <ComingSoonScreen onExit={onExit} name="The Undercrypts" />;

  const stat = snapshot?.stats || itemStats([]);
  const p = snapshot?.player;
  const appearanceSrc = (APPEARANCES.find(a => a.id === appearance) || APPEARANCES[0]).src;
  const appendTownLog = (text) => setTownLog(log => [text, ...log].slice(0, 5));
  const visitLocation = (loc) => { appendTownLog(loc.reply); if (loc.id === 'gate') { startRun(); return; } setInteriorLoc(loc); setScreen('interior'); };
  const handleInteriorAction = (id) => { if (id === 'hearth') setRested(true); if (id === 'workbench') setCalibration(-8); };
  const exitInterior = () => { setScreen('town'); setInteriorLoc(null); };
  if (screen === 'menu') return <Menu characters={characters} selectedCharId={selectedCharId} setSelectedCharId={setSelectedCharId} activeChar={activeChar} race={race} setRace={setRace} bloodline={bloodline} setBloodline={setBloodline} bloodlines={bloodlines} appearance={appearance} setAppearance={setAppearance} origin={origin} setOrigin={setOrigin} build={build} unlocks={unlocks} affinity={affinity} onExit={onExit} onStart={() => setScreen('town')} />;
  if (screen === 'town') return <TownHub wandererName={wandererName} activeChar={activeChar} appearanceSrc={appearanceSrc} origin={origin} build={build} unlocks={unlocks} affinity={affinity} townLog={townLog} onExit={onExit} onEdit={() => setScreen('menu')} onVisit={visitLocation} />;
  if (screen === 'interior' && interiorLoc) return <BuildingInterior location={interiorLoc} wandererName={wandererName} appearanceSrc={appearanceSrc} townLog={townLog} onLine={appendTownLog} onAction={handleInteriorAction} onExit={exitInterior} onBackToBag={onExit} />;
  return <div className="uc-shell"><style>{styles}</style><button className="uc-back" onClick={() => { game.current = null; setSnapshot(null); setScreen('town'); setTownLog(log => ['You return to Ashendell. Crawl inventory is surrendered; unlocks remain.', ...log].slice(0, 5)); }}>Return to Town</button><header className="uc-top"><div><div className="uc-kicker">Floor {snapshot?.floor} - Room {(snapshot?.roomIndex || 0) + 1}</div><h1>{snapshot?.room?.name || 'Undercrypts'}</h1><p>{wandererName} - {build.name}</p></div><div className="uc-vitals"><div className="uc-vital"><b>{Math.max(0, Math.ceil(p?.hp || 0))}/{p?.maxHp || BASE_HP}</b><span>HP</span></div><div className="uc-vital"><b>{p?.arrows || 0}</b><span>Arrows</span></div><div className="uc-vital"><b>{p?.powder || 0}</b><span>Powder</span></div><div className="uc-vital"><b className={Math.abs(p?.affinity ?? affinity) >= SURGE_THRESHOLD ? 'uc-surge' : ''}>{Math.round(p?.affinity ?? affinity)}</b><span>{affinityLabel(p?.affinity ?? affinity)}</span></div></div></header><main className="uc-play"><section className="uc-stage"><canvas ref={canvasRef} width={W} height={H} /></section><aside className="uc-side"><div className="uc-card"><h2>Live Controls</h2><p>WASD move. Mouse aims. Left click or Space melee. Right click or F shoots. Shift dodges.</p><button className="uc-primary" disabled={(snapshot?.room?.enemies?.length || snapshot?.enemies || 0) > 0} onClick={nextRoom}>Next Room</button></div><div className="uc-card"><h2>Inventory This Crawl</h2><div className="uc-inventory">{(snapshot?.inventory || []).map((i, idx) => <div key={idx}><b>{i.name}</b><span>{i.desc}</span></div>)}</div></div><div className="uc-card"><h2>Room Log</h2><div className="uc-log">{(snapshot?.log || []).map((l, i) => <p key={i}>{l}</p>)}</div></div></aside></main>{screen === 'ended' && <div className="uc-ended"><div><h2>Crawl Complete</h2><p>{snapshot?.ended}</p><button onClick={() => setScreen('menu')}>Return to Title</button></div></div>}</div>;
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
  const dxA = Math.cos(aim), dyA = Math.sin(aim); const flip = Math.abs(dxA) >= Math.abs(dyA) ? dxA > 0 : false; const row = Math.abs(dyA) > Math.abs(dxA) ? (dyA < 0 ? PLAYER_SHEET_ROW.up : PLAYER_SHEET_ROW.down) : PLAYER_SHEET_ROW.left;
  const sheet = g.sheet;
  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const fw = sheet.naturalWidth / PLAYER_SHEET_COLS, fh = sheet.naturalHeight / PLAYER_SHEET_ROWS, size = p.r * 3.2;
    ctx.save(); ctx.translate(p.x, p.y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(sheet, (p.frame || 0) * fw, row * fh, fw, fh, -size / 2, -size / 2 - 4, size, size);
    ctx.restore();
    if (p.invuln > 0) { ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#fff2bd'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 6, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  } else {
    ctx.fillStyle = p.invuln > 0 ? '#fff2bd' : '#f0d992'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = build.color; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = '#0b0704'; ctx.font = 'bold 16px Georgia'; ctx.fillText('@', p.x, p.y + 5);
  }
}

function useWalkableScene({ width, height, hotspots, radius = 70, onInteract }) {
  const tokenRef = useRef(null);
  const keys = useRef({});
  const raf = useRef(null);
  const last = useRef(0);
  const player = useRef({ x: width / 2, y: height - 70, facing: 'down', frame: 0, frameTimer: 0 });
  const nearRef = useRef(null);
  const onInteractRef = useRef(onInteract);
  useEffect(() => { onInteractRef.current = onInteract; });
  const [near, setNear] = useState(null);

  useEffect(() => {
    const down = (e) => { keys.current[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === 'e' && nearRef.current) onInteractRef.current?.(nearRef.current); };
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  useEffect(() => {
    const loop = (t) => {
      const dt = Math.min(32, t - (last.current || t)); last.current = t; const p = player.current; const sp = 220;
      let mx = 0, my = 0; if (keys.current.w || keys.current.arrowup) my -= 1; if (keys.current.s || keys.current.arrowdown) my += 1; if (keys.current.a || keys.current.arrowleft) mx -= 1; if (keys.current.d || keys.current.arrowright) mx += 1;
      const mag = Math.hypot(mx, my) || 1;
      p.x = clamp(p.x + (mx / mag) * sp * dt / 1000, 24, width - 24); p.y = clamp(p.y + (my / mag) * sp * dt / 1000, 24, height - 24);
      if (mx < 0) p.facing = 'left'; else if (mx > 0) p.facing = 'right'; else if (my < 0) p.facing = 'up'; else if (my > 0) p.facing = 'down';
      p.frameTimer += dt; if (mx || my) { if (p.frameTimer > 90) { p.frameTimer = 0; p.frame = (p.frame + 1) % PLAYER_SHEET_COLS; } } else { p.frame = 0; p.frameTimer = 0; }
      let closest = null; let closestD = radius;
      hotspots.forEach(loc => { const lx = loc.pct[0] * width, ly = loc.pct[1] * height; const d = Math.hypot(p.x - lx, p.y - ly); if (d < closestD) { closest = loc; closestD = d; } });
      if ((closest?.id || null) !== (nearRef.current?.id || null)) { nearRef.current = closest; setNear(closest); }
      if (tokenRef.current) {
        tokenRef.current.style.left = `${(p.x / width) * 100}%`; tokenRef.current.style.top = `${(p.y / height) * 100}%`;
        const row = p.facing === 'right' ? PLAYER_SHEET_ROW.left : PLAYER_SHEET_ROW[p.facing];
        tokenRef.current.style.backgroundPosition = `${(p.frame / (PLAYER_SHEET_COLS - 1)) * 100}% ${(row / (PLAYER_SHEET_ROWS - 1)) * 100}%`;
        tokenRef.current.style.transform = `translate(-50%,-50%) scaleX(${p.facing === 'right' ? -1 : 1})`;
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [hotspots, width, height, radius]);

  return { tokenRef, near };
}

function TownHub({ wandererName, activeChar, appearanceSrc, origin, build, unlocks, affinity, townLog, onExit, onEdit, onVisit }) {
  const selectedOrigin = ORIGINS.find(o => o.id === origin) || ORIGINS[0];
  const enter = (loc) => { if (loc) onVisit(loc); };
  const { tokenRef, near } = useWalkableScene({ width: TOWN_W, height: TOWN_H, hotspots: TOWN_LOCATIONS, onInteract: enter });

  return <div className="uc-shell uc-town"><style>{styles}</style><button className="uc-back" onClick={onExit}>Back to Bag</button><header className="uc-town-head"><div><div className="uc-kicker">Ashendell single-town prototype</div><h1>Ashendell Undercrypt</h1><p>Walk the square. Step up to a door and press E — or click it — to go in.</p></div><button onClick={onEdit}>Edit Wanderer</button></header><main className="uc-town-grid"><section className="uc-map-card"><div className="uc-town-map"><img src="/Maps/Ashendell.png" alt="Ashendell map" />{TOWN_LOCATIONS.map(loc => <div key={loc.id} className={`uc-pin${near?.id === loc.id ? ' near' : ''}`} style={{ left: `${loc.pct[0] * 100}%`, top: `${loc.pct[1] * 100}%` }} onClick={() => enter(loc)}><span className="uc-pin-dot" /><b>{loc.name}</b></div>)}<div className="uc-player-token" ref={tokenRef} style={{ backgroundImage: `url('${appearanceSrc}')` }} />{near && <div className="uc-prompt">Press E — {near.action} at {near.name}</div>}</div></section><aside className="uc-side"><div className="uc-card"><h2>Wanderer</h2><p>{wandererName}</p>{activeChar && <p>{getRaceDisplay(activeChar.data?.race, activeChar.data?.rv, activeChar.data?.pmV)}</p>}<p>{selectedOrigin.name}</p><p>Starting affinity: {affinityLabel(affinity)} ({affinity})</p><p>{build.name}</p><WandererStats stats={activeChar?.data?.stats} /></div><div className="uc-card"><h2>Town Record</h2><div className="uc-log">{townLog.map((l, i) => <p key={i}>{l}</p>)}</div></div><div className="uc-card"><h2>Unlocked Town Pool</h2><div className="uc-unlocks small">{ITEMS.filter(i => unlocks.includes(i.id)).map(i => <span key={i.id} className="on">{i.name}</span>)}</div></div></aside></main></div>;
}

function BuildingInterior({ location, wandererName, appearanceSrc, townLog, onLine, onAction, onExit, onBackToBag }) {
  const interior = location.interior;
  const interact = (spot) => { if (spot.kind === 'exit') { onExit(); return; } onLine(spot.line); if (spot.kind === 'action') onAction(spot.id); };
  const { tokenRef, near } = useWalkableScene({ width: interior.w, height: interior.h, hotspots: interior.hotspots, onInteract: interact });

  return <div className="uc-shell uc-town"><style>{styles}</style><button className="uc-back" onClick={onBackToBag}>Back to Bag</button><header className="uc-town-head"><div><div className="uc-kicker">Ashendell — Interior</div><h1>{location.name}</h1><p>{location.lead}</p></div><button onClick={onExit}>Leave</button></header><main className="uc-town-grid"><section className="uc-map-card"><div className={`uc-interior-scene theme-${interior.theme}`} style={{ aspectRatio: `${interior.w} / ${interior.h}` }}>{interior.hotspots.map(spot => <div key={spot.id} className={`uc-pin${near?.id === spot.id ? ' near' : ''}${spot.kind === 'exit' ? ' uc-pin-exit' : ''}`} style={{ left: `${spot.pct[0] * 100}%`, top: `${spot.pct[1] * 100}%` }} onClick={() => interact(spot)}><span className="uc-pin-dot" /><b>{spot.name}</b></div>)}<div className="uc-player-token" ref={tokenRef} style={{ backgroundImage: `url('${appearanceSrc}')` }} />{near && <div className="uc-prompt">Press E — {near.name}</div>}</div></section><aside className="uc-side"><div className="uc-card"><h2>Wanderer</h2><p>{wandererName}</p></div><div className="uc-card"><h2>Town Record</h2><div className="uc-log">{townLog.slice(0, 6).map((l, i) => <p key={i}>{l}</p>)}</div></div></aside></main></div>;
}

function WandererStats({ stats }) {
  if (!stats) return null;
  return <div className="uc-statgrid">{ALL_STATS.map(s => <div key={s.key} className={`uc-stat uc-stat-${s.axis}`}><span>{s.label}</span><b>{stats[s.key] ?? 8}</b></div>)}</div>;
}

function Menu({ characters, selectedCharId, setSelectedCharId, activeChar, race, setRace, bloodline, setBloodline, bloodlines, appearance, setAppearance, origin, setOrigin, build, unlocks, affinity, onExit, onStart }) {
  return <div className="uc-shell"><style>{styles}</style><button className="uc-back" onClick={onExit}>Back to Bag</button><section className="uc-hero"><div className="uc-kicker">Lotjarr's Bag of Games</div><h1>The Undercrypts of Soteria</h1><p>Descend, survive, return changed — and mind which half of you the depths sharpen.</p></section><main className="uc-menu"><div className="uc-card"><h2>Create Wanderer</h2>{characters.length > 0 && <select value={selectedCharId || ''} onChange={e => setSelectedCharId(e.target.value || null)}><option value="">— Custom Wanderer —</option>{characters.map(c => <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>)}</select>}{activeChar ? <><p className="uc-char-note">Descending as your Syntarion character. Race, class investment, and the 8-stat sheet come from your actual character; the affinity gauge below is read straight off it.</p><WandererStats stats={activeChar.data?.stats} /></> : <><div className="uc-appearance-row">{APPEARANCES.map(a => <button type="button" key={a.id} className={`uc-appearance-tile${appearance === a.id ? ' on' : ''}`} onClick={() => setAppearance(a.id)} style={{ backgroundImage: `url('${a.src}')` }}><span>{a.name}</span></button>)}</div><select value={race} onChange={e => setRace(e.target.value)}>{RACES.map(r => <option key={r.id} value={r.id}>{r.name} - {r.sub}</option>)}</select>{race === 'pamorph' && <select value={bloodline} onChange={e => setBloodline(e.target.value)}>{bloodlines.map(b => <option key={b.id} value={b.id}>{b.name} - {b.sub}</option>)}</select>}</>}<select value={origin} onChange={e => setOrigin(e.target.value)}>{ORIGINS.map(o => <option key={o.id} value={o.id}>{o.name} - {o.note}</option>)}</select><div className="uc-stance"><b>{build.name}</b><span>{build.note}</span><em>Style: {build.style} / Reach: {build.reach} / Damage: {build.damage}</em><em>Starting affinity — {affinityLabel(affinity)}: {affinity}</em><em>Affinity drifts as you fight: the Grimrite Edge and Tel'ari Honourarc pull toward Magicka, the flintlock and Veinrunner Spike pull toward Ingenium. Cross {SURGE_THRESHOLD} either way and the wrong-aligned gear turns on you.</em></div><button className="uc-primary" onClick={onStart}>Enter Ashendell</button></div><div className="uc-card"><h2>Unlocked Pool</h2><div className="uc-unlocks">{ITEMS.map(i => <span key={i.id} className={unlocks.includes(i.id) ? 'on' : ''}>{i.name}</span>)}</div><p>Held inventory resets at the end of each crawl. Unlocked items stay unlocked and enter future room reward pools.</p></div></main></div>;
}

const styles = `
@keyframes uc-scene-in { from { opacity:0; transform:scale(1.06); } to { opacity:1; transform:scale(1); } }
.uc-shell { position:relative; min-height:100vh; background:radial-gradient(circle at 15% 88%, rgba(120,80,30,.12), transparent 42%), radial-gradient(circle at 88% 20%, rgba(90,60,20,.1), transparent 44%), radial-gradient(circle at 50% 0%, rgba(88,62,24,.3), transparent 38%), radial-gradient(circle at 50% 100%, rgba(40,28,10,.2), transparent 55%), #050301; color:#eadfca; font-family:Georgia,serif; padding:28px; box-sizing:border-box; animation:uc-scene-in .26s ease-out both; }
.uc-shell::before, .uc-shell::after { content:''; position:fixed; top:0; bottom:0; width:130px; background:radial-gradient(circle at 50% 110px, rgba(214,177,84,.32), transparent 68%), linear-gradient(rgba(214,177,84,.2), rgba(214,177,84,.03) 55%, transparent); pointer-events:none; z-index:0; opacity:.55; }
.uc-shell::before { left:0; } .uc-shell::after { right:0; }
@media (max-width:1680px) { .uc-shell::before, .uc-shell::after { display:none; } }
.uc-hero { position:relative; text-align:center; padding:72px 20px 30px; }
.uc-hero::before { content:''; position:absolute; left:50%; top:14px; width:320px; height:320px; transform:translateX(-50%); background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,3 93,26 93,74 50,97 7,74 7,26' fill='none' stroke='%23d6b154' stroke-width='0.6' opacity='0.45'/%3E%3Cpolygon points='50,18 80,34 80,66 50,82 20,66 20,34' fill='none' stroke='%23d6b154' stroke-width='0.4' opacity='0.3'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:center; background-size:contain; pointer-events:none; z-index:0; }
.uc-hero > * { position:relative; z-index:1; }
.uc-hero .uc-kicker::before, .uc-town-head .uc-kicker::before { content:'✦'; display:block; margin-bottom:6px; color:rgba(214,177,84,.5); font-size:12px; }
.uc-hero p::after { content:''; display:block; width:110px; height:1px; margin:18px auto 0; background:linear-gradient(90deg,transparent,rgba(214,177,84,.55),transparent); }
.uc-card, .uc-ended div { position:relative; }
.uc-card::before, .uc-card::after, .uc-ended div::before, .uc-ended div::after { content:''; position:absolute; width:14px; height:14px; border:1px solid rgba(214,177,84,.4); pointer-events:none; }
.uc-card::before, .uc-ended div::before { top:8px; left:8px; border-right:none; border-bottom:none; }
.uc-card::after, .uc-ended div::after { bottom:8px; right:8px; border-left:none; border-top:none; }
.uc-card h2, .uc-ended h2 { text-align:center; }
.uc-card h2::before, .uc-card h2::after, .uc-ended h2::before, .uc-ended h2::after { color:rgba(214,177,84,.5); }
.uc-card h2::before, .uc-ended h2::before { content:'→ '; }
.uc-card h2::after, .uc-ended h2::after { content:' →'; }
.uc-back { position:fixed; top:16px; left:16px; z-index:6; border:1px solid rgba(214,177,84,.45); background:linear-gradient(#1f170d,#080604); color:#d8c28a; border-radius:8px; padding:10px 15px; font-family:Cinzel,serif; font-size:10px; letter-spacing:.14em; text-transform:uppercase; cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,240,190,.1); }
.uc-hero { text-align:center; padding:72px 20px 30px; } .uc-kicker { font-family:Cinzel,serif; color:rgba(214,177,84,.72); font-size:10px; letter-spacing:.24em; text-transform:uppercase; } .uc-hero h1,.uc-top h1,.uc-town-head h1 { margin:8px 0; font-family:Cinzel,serif; color:#f2deb0; letter-spacing:.12em; text-transform:uppercase; text-shadow:0 2px 4px rgba(0,0,0,.8), 0 0 26px rgba(214,177,84,.25); } .uc-hero h1 { font-size:clamp(34px,6vw,66px); } .uc-hero p,.uc-top p,.uc-card p { color:rgba(234,223,202,.62); font-style:italic; }
.uc-menu { max-width:1040px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:18px; } .uc-card { border:1px solid rgba(214,177,84,.24); border-radius:14px; background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(10,7,4,.94)); padding:18px; box-shadow:0 26px 60px rgba(0,0,0,.7), 0 0 46px rgba(214,177,84,.05), inset 0 1px 0 rgba(255,240,190,.14), inset 0 -22px 34px rgba(0,0,0,.4); } .uc-card h2 { margin:0 0 14px; font-family:Cinzel,serif; color:#ead29a; font-size:13px; letter-spacing:.16em; text-transform:uppercase; text-shadow:0 0 14px rgba(214,177,84,.2); }
.uc-card select { width:100%; margin-bottom:10px; min-height:40px; border:1px solid rgba(214,177,84,.28); border-radius:8px; background:#0e0a06; color:#eadfca; padding:0 10px; } .uc-stance { margin:12px 0; padding:14px; border:1px solid rgba(214,177,84,.16); border-radius:10px; } .uc-stance b { display:block; color:#f0d992; font-family:Cinzel,serif; } .uc-stance span,.uc-stance em { display:block; margin-top:6px; color:rgba(234,223,202,.58); }
.uc-char-note { font-size:11px; margin:0 0 10px; }
.uc-appearance-row { display:flex; gap:8px; margin-bottom:10px; }
.uc-appearance-tile { flex:1; height:64px; border:1px solid rgba(214,177,84,.25); border-radius:8px; background-color:#0e0a06; background-repeat:no-repeat; background-size:700% 300%; background-position:0% 0%; image-rendering:pixelated; cursor:pointer; position:relative; padding:0; }
.uc-appearance-tile span { position:absolute; left:0; right:0; bottom:0; font-family:Cinzel,serif; font-size:8px; letter-spacing:.08em; text-transform:uppercase; color:#eadfca; background:rgba(6,4,2,.75); padding:2px 0; text-align:center; }
.uc-appearance-tile.on { border-color:#84d5cc; box-shadow:0 0 12px rgba(132,213,204,.4); } .uc-statgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; margin:0 0 10px; } .uc-stat { display:flex; flex-direction:column; align-items:center; gap:2px; padding:6px 4px; border:1px solid rgba(214,177,84,.18); border-radius:8px; background:rgba(0,0,0,.28); box-shadow:inset 0 2px 6px rgba(0,0,0,.55); } .uc-stat span { font-family:Cinzel,serif; font-size:8px; letter-spacing:.1em; text-transform:uppercase; color:rgba(234,223,202,.5); } .uc-stat b { font-size:16px; color:#f0d992; } .uc-stat-magic b { color:#b08fe0; } .uc-stat-tech b { color:#7fb7dc; }
.uc-primary,.uc-ended button { width:100%; border:1px solid rgba(214,177,84,.42); border-radius:8px; background:linear-gradient(#3b2c12,#120c06); color:#f0d992; min-height:38px; padding:0 12px; font-family:Cinzel,serif; font-size:10px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; box-shadow:0 10px 24px rgba(0,0,0,.55), 0 0 18px rgba(214,177,84,.1), inset 0 1px 0 rgba(255,240,190,.12); } button:disabled { opacity:.35; cursor:default; box-shadow:none; }
.uc-unlocks { display:flex; flex-wrap:wrap; gap:8px; } .uc-unlocks span { border:1px solid rgba(214,177,84,.16); border-radius:999px; color:rgba(234,223,202,.38); padding:6px 9px; font-size:11px; } .uc-unlocks span.on { color:#f0d992; border-color:rgba(214,177,84,.5); background:rgba(214,177,84,.08); }
.uc-top { max-width:1380px; margin:16px auto; display:flex; justify-content:space-between; gap:20px; align-items:center; } .uc-vitals { min-width:380px; display:grid; grid-template-columns:repeat(4,1fr); gap:4px 8px; text-align:center; border:1px solid rgba(214,177,84,.22); border-radius:12px; padding:12px; background:rgba(0,0,0,.3); box-shadow:inset 0 3px 10px rgba(0,0,0,.6), inset 0 0 20px rgba(0,0,0,.4), 0 1px 0 rgba(255,240,190,.06); } .uc-vital { display:flex; flex-direction:column; align-items:center; justify-content:flex-start; gap:4px; min-width:0; } .uc-vitals b { color:#f0d992; font-size:18px; text-shadow:0 0 10px rgba(240,217,146,.3); } .uc-vitals b.uc-surge { color:#84d5cc; text-shadow:0 0 8px rgba(132,213,204,.6); } .uc-vitals span { color:rgba(234,223,202,.52); font-size:10px; text-transform:uppercase; letter-spacing:.14em; }
.uc-play { max-width:1380px; margin:0 auto; display:grid; grid-template-columns:minmax(720px,1fr) 340px; gap:18px; align-items:start; } .uc-stage { border:1px solid rgba(214,177,84,.24); border-radius:18px; padding:14px; background:linear-gradient(145deg,#171006,#070504); box-shadow:0 30px 80px rgba(0,0,0,.7), 0 0 60px rgba(214,177,84,.06), inset 0 1px 0 rgba(255,240,190,.08); } canvas { width:100%; display:block; border-radius:12px; background:#090604; cursor:crosshair; }
.uc-side { display:grid; gap:12px; } .uc-inventory { display:grid; gap:8px; max-height:230px; overflow:auto; } .uc-inventory div { border-top:1px solid rgba(214,177,84,.12); padding-top:8px; } .uc-inventory b { display:block; color:#ead29a; } .uc-inventory span,.uc-log p { color:rgba(234,223,202,.56); font-size:12px; margin:4px 0 0; } .uc-log { max-height:190px; overflow:auto; }
.uc-ended { position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.72); z-index:10; } .uc-ended div { width:min(420px,90vw); border:1px solid rgba(214,177,84,.45); border-radius:16px; background:linear-gradient(160deg,#15100a,#0b0704); padding:24px; text-align:center; box-shadow:0 30px 90px rgba(0,0,0,.7), 0 0 60px rgba(214,177,84,.08), inset 0 1px 0 rgba(255,240,190,.1); } .uc-ended h2 { font-family:Cinzel,serif; color:#f0d992; letter-spacing:.16em; text-transform:uppercase; text-shadow:0 0 16px rgba(214,177,84,.25); }
.uc-town-head { max-width:1380px; margin:20px auto 16px; display:flex; justify-content:space-between; gap:18px; align-items:end; } .uc-town-head button { width:auto; min-width:150px; border:1px solid rgba(214,177,84,.42); border-radius:8px; background:linear-gradient(#3b2c12,#120c06); color:#f0d992; min-height:38px; padding:0 12px; font-family:Cinzel,serif; font-size:10px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; box-shadow:0 10px 24px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,240,190,.12); } .uc-town-grid { max-width:1380px; margin:0 auto; display:grid; grid-template-columns:minmax(720px,1fr) 330px; gap:18px; } .uc-map-card { border:1px solid rgba(214,177,84,.24); border-radius:18px; padding:14px; background:linear-gradient(145deg,#171006,#070504); box-shadow:0 30px 80px rgba(0,0,0,.7), 0 0 60px rgba(214,177,84,.06), inset 0 1px 0 rgba(255,240,190,.08); } .uc-town-map { position:relative; min-height:620px; overflow:hidden; border-radius:12px; background:#080503; isolation:isolate; } .uc-town-map::after { content:""; position:absolute; inset:0; z-index:1; background:radial-gradient(circle at 50% 46%, rgba(3,2,1,.04), rgba(3,2,1,.55) 70%, rgba(3,2,1,.86)), linear-gradient(rgba(5,3,2,.1),rgba(5,3,2,.28)); box-shadow:inset 0 0 90px rgba(0,0,0,.6); pointer-events:none; } .uc-town-map img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:center; opacity:.82; filter:saturate(.92) contrast(1.05) brightness(.86); }
.uc-pin { position:absolute; z-index:3; transform:translate(-50%,-50%); display:flex; flex-direction:column; align-items:center; gap:4px; cursor:pointer; }
.uc-pin-dot { width:10px; height:10px; border-radius:50%; background:rgba(214,177,84,.65); border:1px solid rgba(214,177,84,.85); box-shadow:0 0 8px rgba(214,177,84,.6), 0 0 26px rgba(214,177,84,.25); }
.uc-pin b { font-family:Cinzel,serif; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:rgba(234,223,202,.7); background:rgba(6,4,2,.65); padding:2px 6px; border-radius:6px; white-space:nowrap; }
.uc-pin.near .uc-pin-dot { background:#84d5cc; border-color:#84d5cc; box-shadow:0 0 16px rgba(132,213,204,.7); } .uc-pin.near b { color:#84d5cc; }
.uc-pin-exit .uc-pin-dot { background:rgba(234,223,202,.4); border-color:rgba(234,223,202,.6); }
.uc-interior-scene { position:relative; overflow:hidden; border-radius:12px; width:100%; box-shadow:inset 0 0 70px rgba(0,0,0,.65), inset 0 0 20px rgba(0,0,0,.4); }
.uc-interior-scene.theme-inn { background:radial-gradient(circle at 18% 62%, rgba(255,140,60,.28), transparent 45%), linear-gradient(160deg,#2a1608,#160b04 70%); }
.uc-interior-scene.theme-inn::before { content:''; position:absolute; left:18%; top:62%; width:70px; height:70px; transform:translate(-50%,-50%); border-radius:50%; background:radial-gradient(circle, rgba(255,150,60,.55), transparent 70%); filter:blur(2px); }
.uc-interior-scene.theme-market { background:radial-gradient(circle at 50% 20%, rgba(214,177,84,.16), transparent 55%), linear-gradient(160deg,#1c1a10,#0c0a06 70%); }
.uc-interior-scene.theme-market::before, .uc-interior-scene.theme-market::after { content:''; position:absolute; width:90px; height:34px; border:1px solid rgba(214,177,84,.35); border-radius:4px; background:rgba(214,177,84,.06); }
.uc-interior-scene.theme-market::before { left:20%; top:65%; transform:translate(-50%,-50%); }
.uc-interior-scene.theme-market::after { left:80%; top:65%; transform:translate(-50%,-50%); }
.uc-interior-scene.theme-archive { background:radial-gradient(circle at 50% 15%, rgba(132,180,213,.14), transparent 55%), linear-gradient(160deg,#161c22,#0a0d10 70%); }
.uc-interior-scene.theme-archive::before, .uc-interior-scene.theme-archive::after { content:''; position:absolute; top:8%; bottom:8%; width:10%; background:repeating-linear-gradient(0deg, rgba(132,180,213,.16) 0 6px, transparent 6px 14px); border-left:1px solid rgba(132,180,213,.3); border-right:1px solid rgba(132,180,213,.3); }
.uc-interior-scene.theme-archive::before { left:8%; }
.uc-interior-scene.theme-archive::after { right:8%; }
.uc-interior-scene.theme-workshop { background:radial-gradient(circle at 25% 65%, rgba(132,213,204,.16), transparent 50%), linear-gradient(160deg,#181a1c,#0a0b0c 70%); }
.uc-interior-scene.theme-workshop::before { content:''; position:absolute; left:25%; top:65%; width:110px; height:44px; transform:translate(-50%,-50%); border:1px solid rgba(132,213,204,.4); background:rgba(132,213,204,.06); border-radius:4px; }
.uc-interior-scene.theme-workshop::after { content:''; position:absolute; left:75%; top:65%; width:60px; height:60px; transform:translate(-50%,-50%); border-radius:50%; border:1px dashed rgba(132,213,204,.3); }
.uc-player-token { position:absolute; z-index:4; transform:translate(-50%,-50%); width:56px; height:56px; background-color:rgba(240,217,146,.12); background-repeat:no-repeat; background-size:700% 300%; image-rendering:pixelated; filter:drop-shadow(0 6px 8px rgba(0,0,0,.6)) drop-shadow(0 0 14px rgba(240,217,146,.4)); pointer-events:none; }
.uc-prompt { position:absolute; z-index:5; left:50%; bottom:16px; transform:translateX(-50%); background:rgba(8,6,4,.86); border:1px solid rgba(132,213,204,.6); color:#84d5cc; padding:8px 16px; border-radius:999px; font-family:Cinzel,serif; font-size:11px; letter-spacing:.1em; text-transform:uppercase; pointer-events:none; }
@media (max-width:1080px){ .uc-menu,.uc-play,.uc-town-grid{grid-template-columns:1fr}.uc-top,.uc-town-head{flex-direction:column;text-align:center;align-items:center}.uc-vitals{width:min(100%,360px);grid-template-columns:repeat(2,1fr)}.uc-town-map{min-height:760px} }
`;
