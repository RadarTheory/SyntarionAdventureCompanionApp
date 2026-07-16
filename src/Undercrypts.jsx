import { useMemo, useState } from 'react';
import { RACES, PM_MAJ, PM_MIN, PM_AEON, PM_ASTRAL } from './constants';

const GRID = 9;
const START_UNLOCKS = ['rusted-sabre', 'knuckle-wraps', 'shortbow'];
const STORAGE_KEY = 'undercrypts_unlocks_v1';
const RACE_BLADES = {
  addamar: { name: 'Adaptive Cut', shape: 'arc', note: 'Balanced three-tile sweep.', power: 4 },
  durinak: { name: 'Forge-Shoulder Bash', shape: 'cleave', note: 'Heavy front cleave with guard.', power: 5, guard: 1 },
  telari: { name: 'Rootsong Lunge', shape: 'lunge', note: 'Long thrust through one lane.', power: 4 },
  othrod: { name: 'Clanbreaker Hook', shape: 'hook', note: 'Wide brutal hook around the flank.', power: 5 },
  terraxian: { name: 'Stonefall Slam', shape: 'slam', note: 'Adjacent shockwave.', power: 5, guard: 1 },
  fynlor: { name: 'Lowline Skirmish', shape: 'dash', note: 'Quick strike with an evasive step.', power: 3, dodge: 1 },
  trink: { name: 'Springknife Feint', shape: 'needle', note: 'Precise line strike.', power: 4 },
  pamorph: { name: 'Bloodline Maul', shape: 'claw', note: 'Instinctive close-range rake.', power: 4 },
  fae: { name: 'Glimmerlash', shape: 'arc', note: 'Faint resonant sweep.', power: 4, dodge: 1 },
  djinn: { name: 'Wish-Edge Riposte', shape: 'hook', note: 'Curved strike that likes risk.', power: 4 },
  helianth: { name: 'Infernal Guard', shape: 'cleave', note: 'Hot defensive cut.', power: 4, guard: 1 },
  seraphan: { name: 'Halo Step', shape: 'lunge', note: 'Clean radiant thrust.', power: 4, heal: 1 },
  drakazir: { name: 'Scale-Line Break', shape: 'slam', note: 'Body-weight strike with breath force.', power: 5 },
  nazari: { name: 'Tideknife Flow', shape: 'dash', note: 'Slip, cut, reposition.', power: 4, dodge: 1 },
  chronison: { name: 'Clockwork Impact', shape: 'needle', note: 'Exact mechanical blow.', power: 5 },
  tiol: { name: 'Tallreach Rend', shape: 'lunge', note: 'Long reach from impossible leverage.', power: 5 },
  folwoade: { name: 'Living Resonance', shape: 'arc', note: 'A spell-body sweep.', power: 4, heal: 1 },
};
const PA_TRAITS = {
  aaravok: { shape: 'lunge', power: 1, note: 'aerial reach' }, kraark: { shape: 'hook', dodge: 1, note: 'carrion feint' }, cathvari: { shape: 'claw', power: 1, note: 'predator rake' }, karazelith: { shape: 'dash', dodge: 1, note: 'elseworld sidestep' }, lioreth: { shape: 'slam', power: 2, note: 'lion pressure' }, taeranari: { shape: 'claw', dodge: 1, note: 'pack cut' }, maernethim: { shape: 'lunge', guard: 1, note: 'lizard spear-line' }, bovorin: { shape: 'slam', power: 2, note: 'minotaur drive' }, brawnath: { shape: 'slam', guard: 2, note: 'river bulk' }, gajaroi: { shape: 'cleave', guard: 2, note: 'memory-weighted blow' }, kodan: { shape: 'cleave', power: 1, guard: 1, note: 'bear hold' }, krokodon: { shape: 'hook', power: 1, note: 'patient snap' }, rhainar: { shape: 'slam', power: 2, note: 'rhino charge' }, satyr: { shape: 'dash', dodge: 1, note: 'revel step' }, hoshiari: { shape: 'needle', dodge: 1, note: 'fox timing' },
  arbor: { shape: 'cleave', power: 1, note: 'boar stubbornness' }, avali: { shape: 'needle', dodge: 1, note: 'songbird opening' }, bjoral: { shape: 'claw', guard: 1, note: 'badger grit' }, harelin: { shape: 'dash', dodge: 2, note: 'hare speed' }, dervir: { shape: 'lunge', guard: 1, note: 'elk reach' }, fenrik: { shape: 'hook', dodge: 1, note: 'hyena angle' }, hylori: { shape: 'dash', dodge: 1, note: 'amphibious slip' }, krogharu: { shape: 'hook', dodge: 1, note: 'canopy angle' }, murinor: { shape: 'needle', dodge: 2, note: 'small target' }, oryzd: { shape: 'dash', power: 1, note: 'wall-run jab' }, testudon: { shape: 'slam', guard: 2, note: 'shell brace' }, orylin: { shape: 'needle', power: 1, note: 'silent strike' }, ssazaral: { shape: 'lunge', power: 1, note: 'serpent line' }, lutrav: { shape: 'dash', dodge: 1, heal: 1, note: 'otter recovery' }, musteiah: { shape: 'hook', power: 1, note: 'weasel turn' },
  hraelvan: { shape: 'claw', power: 2, note: 'raptor sickle' }, cerakhjorn: { shape: 'slam', guard: 2, note: 'horn wall' }, jevrak: { shape: 'dash', dodge: 2, note: 'small herbivore burst' }, anpryd: { shape: 'slam', guard: 3, note: 'shieldback stand' }, limridh: { shape: 'dash', heal: 1, note: 'mudbank recovery' }, pterrotara: { shape: 'lunge', dodge: 1, note: 'crest glide' }, saurok: { shape: 'cleave', guard: 1, note: 'long-neck sweep' }, hadrynn: { shape: 'arc', heal: 1, note: 'chorus step' },
  khellsarii: { shape: 'cleave', power: 2, note: 'warrior caste' }, khellskini: { shape: 'arc', power: 1, dodge: 1, note: 'many-hand salvage' }, khellhanae: { shape: 'slam', power: 3, note: 'siege body' }, khelloch: { shape: 'hook', guard: 1, note: 'colony coil' }, khellyuum: { shape: 'needle', heal: 2, note: 'brood rite' }, khelljta: { shape: 'claw', power: 2, dodge: 1, note: 'apex hunter' }, khellxen: { shape: 'dash', power: 2, note: 'nightmare pounce' }, khellchin: { shape: 'needle', dodge: 2, note: 'mimic vanish' },
};
const ENEMIES = [
  { name: 'Draugr Remnant', hp: 7, atk: 2, icon: 'D', lore: 'old Addamar grave-cold' },
  { name: 'Mine Rauk', hp: 5, atk: 2, icon: 'R', lore: 'coal-black omen bird' },
  { name: 'Grimrite Wolf', hp: 8, atk: 3, icon: 'W', lore: 'crystal-boned pack hunter' },
  { name: 'Fetch Direlizard', hp: 6, atk: 2, icon: 'L', lore: 'stubborn spirit-lizard' },
  { name: 'Duergar Delver', hp: 9, atk: 3, icon: 'G', lore: 'deep-forge counterlineage' },
];
const BOSSES = [
  { name: 'Abyssal Ogre', hp: 22, atk: 5, icon: 'O', lore: 'a blind pale titan of the lower vaults' },
  { name: 'Heiress Naga', hp: 18, atk: 4, icon: 'N', lore: 'a regal constrictor-lure below old balconies' },
];
const ITEMS = [
  { id: 'rusted-sabre', name: 'Rusted Sabre', type: 'melee', desc: '+1 melee damage.' },
  { id: 'knuckle-wraps', name: 'Knuckle Wraps', type: 'melee', desc: '+1 guard after melee.' },
  { id: 'shortbow', name: 'Shortbow', type: 'ranged', desc: 'Reliable ranged shot. +2 ammo.' },
  { id: 'flintlock', name: 'Ashendell Flintlock', type: 'ranged', desc: 'Heavy ranged hit, scarce powder.' },
  { id: 'honourarc', name: "Tel'ari Honourarc", type: 'hybrid', desc: '+1 melee and +1 ammo.' },
  { id: 'grimrite-edge', name: 'Grimrite Edge', type: 'melee', desc: '+2 melee, but rooms hit harder.' },
  { id: 'sylvan-lung', name: 'Sylvan Lung', type: 'utility', desc: '+4 max health this crawl.' },
  { id: 'charter-seal', name: 'Cracked Charter Seal', type: 'relic', desc: 'First lethal hit each crawl leaves you at 1 HP.' },
  { id: 'brunar-powder', name: 'Brunar Powder Horn', type: 'ranged', desc: '+3 ammo and +1 flintlock damage.' },
  { id: 'veinrunner-spike', name: 'Veinrunner Spike', type: 'melee', desc: 'Melee hits also stagger enemy attacks.' },
];
const ROOM_NAMES = ['Forgotten Tollhouse', 'Drowned Reliquary', 'Corren Service Tunnel', 'Ash Vault', 'Root-Cracked Archive', 'Black Pump Chapel', 'Lower Menagerie', 'Silent Charter Annex'];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

function loadUnlocks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || START_UNLOCKS; } catch (_) { return START_UNLOCKS; }
}
function saveUnlocks(ids) { localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)])); }
function rand(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }
function pick(list, seed) { return list[Math.floor(rand(seed) * list.length) % list.length]; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function same(a, b) { return a.x === b.x && a.y === b.y; }
function raceLabel(raceId, bloodlineId) {
  const r = RACES.find(x => x.id === raceId);
  if (!r) return 'Wanderer';
  if (raceId !== 'pamorph') return r.name;
  const b = [...PM_MAJ, ...PM_MIN, ...PM_AEON, ...PM_ASTRAL].find(x => x.id === bloodlineId);
  return b ? `Pa'morph - ${b.name}` : "Pa'morph";
}
function raceBuild(raceId, bloodlineId) {
  const base = RACE_BLADES[raceId] || RACE_BLADES.addamar;
  const pa = raceId === 'pamorph' ? (PA_TRAITS[bloodlineId] || {}) : {};
  return { ...base, ...pa, power: (base.power || 4) + (pa.power || 0), guard: (base.guard || 0) + (pa.guard || 0), dodge: (base.dodge || 0) + (pa.dodge || 0), heal: (base.heal || 0) + (pa.heal || 0), note: pa.note ? `${base.note} Bloodline: ${pa.note}.` : base.note };
}
function makeRoom(index, floor, unlocked) {
  const seed = Date.now() % 9999 + index * 73 + floor * 911;
  const boss = index === 5;
  const enemyCount = boss ? 1 : 2 + Math.floor(rand(seed) * 3);
  const enemies = Array.from({ length: enemyCount }, (_, i) => {
    const src = boss ? pick(BOSSES, seed + i) : pick(ENEMIES, seed + i * 19);
    return { ...src, id: `${index}-${i}`, hp: src.hp + floor * (boss ? 5 : 2), maxHp: src.hp + floor * (boss ? 5 : 2), pos: { x: 2 + Math.floor(rand(seed + i * 7) * 5), y: 2 + Math.floor(rand(seed + i * 11) * 5) } };
  });
  return { index, floor, name: boss ? 'Undercrypt Heart' : pick(ROOM_NAMES, seed + 99), boss, enemies, reward: pick(ITEMS.filter(i => unlocked.includes(i.id)), seed + 42) };
}
function attackTiles(pos, facing, shape) {
  const [dx, dy] = DIRS[facing] || DIRS.right;
  const left = { x: -dy, y: dx };
  const front = { x: pos.x + dx, y: pos.y + dy };
  if (shape === 'lunge') return [front, { x: pos.x + dx * 2, y: pos.y + dy * 2 }];
  if (shape === 'cleave') return [front, { x: front.x + left.x, y: front.y + left.y }, { x: front.x - left.x, y: front.y - left.y }];
  if (shape === 'hook') return [{ x: pos.x + left.x, y: pos.y + left.y }, front, { x: pos.x - left.x, y: pos.y - left.y }];
  if (shape === 'slam') return Object.values(DIRS).map(([x, y]) => ({ x: pos.x + x, y: pos.y + y }));
  if (shape === 'dash') return [front, { x: front.x + dx, y: front.y + dy }, { x: pos.x - dx, y: pos.y - dy }];
  if (shape === 'needle') return [{ x: pos.x + dx * 2, y: pos.y + dy * 2 }];
  return [front, { x: front.x + left.x, y: front.y + left.y }, { x: front.x - left.x, y: front.y - left.y }];
}
function itemStats(inventory) {
  return inventory.reduce((m, item) => {
    if (item.id === 'rusted-sabre') m.melee += 1;
    if (item.id === 'knuckle-wraps') m.guard += 1;
    if (item.id === 'shortbow') m.ammo += 2;
    if (item.id === 'honourarc') { m.melee += 1; m.ammo += 1; }
    if (item.id === 'grimrite-edge') { m.melee += 2; m.curse += 1; }
    if (item.id === 'sylvan-lung') m.maxHp += 4;
    if (item.id === 'brunar-powder') { m.ammo += 3; m.shot += 1; }
    if (item.id === 'flintlock') m.shot += 3;
    if (item.id === 'veinrunner-spike') m.stagger += 1;
    if (item.id === 'charter-seal') m.seal = true;
    return m;
  }, { melee: 0, guard: 0, ammo: 0, maxHp: 0, shot: 0, curse: 0, stagger: 0, seal: false });
}

export default function Undercrypts({ onExit }) {
  const [screen, setScreen] = useState('menu');
  const [race, setRace] = useState('addamar');
  const [bloodline, setBloodline] = useState(PM_MAJ[0]?.id || 'aaravok');
  const [unlocks, setUnlocks] = useState(loadUnlocks);
  const [floor, setFloor] = useState(1);
  const [roomIndex, setRoomIndex] = useState(0);
  const [room, setRoom] = useState(() => makeRoom(0, 1, loadUnlocks()));
  const [player, setPlayer] = useState({ hp: 22, maxHp: 22, pos: { x: 4, y: 7 }, facing: 'up', guard: 0, ammo: 4, sealSpent: false });
  const [inventory, setInventory] = useState([]);
  const [log, setLog] = useState(['The first stair exhales old air.']);
  const build = useMemo(() => raceBuild(race, bloodline), [race, bloodline]);
  const stats = useMemo(() => itemStats(inventory), [inventory]);
  const maxHp = player.maxHp + stats.maxHp;
  const meleeTiles = attackTiles(player.pos, player.facing, build.shape).filter(t => t.x >= 0 && t.x < GRID && t.y >= 0 && t.y < GRID);
  const bloodlines = [...PM_MAJ, ...PM_MIN, ...PM_AEON, ...PM_ASTRAL];

  const append = (entry) => setLog(prev => [entry, ...prev].slice(0, 8));
  const startRun = () => {
    const startInv = ITEMS.filter(i => START_UNLOCKS.includes(i.id));
    const st = itemStats(startInv);
    setFloor(1); setRoomIndex(0); setInventory(startInv); setRoom(makeRoom(0, 1, unlocks));
    setPlayer({ hp: 22 + st.maxHp, maxHp: 22, pos: { x: 4, y: 7 }, facing: 'up', guard: 0, ammo: 4 + st.ammo, sealSpent: false });
    setLog([`${raceLabel(race, bloodline)} enters with ${build.name}.`]); setScreen('crawl');
  };
  const endRun = (message) => { append(message); setScreen('ended'); };
  const enemyTurn = (nextEnemies, nextPlayer = player) => {
    let p = { ...nextPlayer, guard: Math.max(0, nextPlayer.guard - 1) };
    const moved = nextEnemies.map(e => {
      const dist = Math.abs(e.pos.x - p.pos.x) + Math.abs(e.pos.y - p.pos.y);
      if (dist <= 1) {
        const raw = e.atk + stats.curse;
        const dmg = Math.max(0, raw - p.guard - build.dodge);
        if (dmg > 0) append(`${e.name} hits for ${dmg}.`);
        p.hp -= dmg;
        return e;
      }
      const dx = Math.sign(p.pos.x - e.pos.x); const dy = Math.sign(p.pos.y - e.pos.y);
      const step = Math.abs(p.pos.x - e.pos.x) > Math.abs(p.pos.y - e.pos.y) ? { x: e.pos.x + dx, y: e.pos.y } : { x: e.pos.x, y: e.pos.y + dy };
      const blocked = nextEnemies.some(o => o.id !== e.id && same(o.pos, step)) || same(p.pos, step);
      return blocked ? e : { ...e, pos: { x: clamp(step.x, 0, GRID - 1), y: clamp(step.y, 0, GRID - 1) } };
    });
    if (p.hp <= 0 && stats.seal && !p.sealSpent) { p.hp = 1; p.sealSpent = true; append('The Cracked Charter Seal refuses the end.'); }
    if (p.hp <= 0) endRun('The Undercrypts close over you. Inventory lost; unlocks remain.');
    setPlayer(p); setRoom(r => ({ ...r, enemies: moved }));
  };
  const finishRoom = (clearedRoom) => {
    const reward = clearedRoom.reward;
    const newUnlocks = unlocks.includes(reward.id) ? unlocks : [...unlocks, reward.id];
    setUnlocks(newUnlocks); saveUnlocks(newUnlocks);
    setInventory(prev => [...prev, reward]);
    append(`Unlocked ${reward.name}. It joins future crawl pools.`);
  };
  const afterAction = (enemies) => {
    if (!enemies.length) { finishRoom(room); return; }
    enemyTurn(enemies, player);
  };
  const move = (dir) => {
    const [dx, dy] = DIRS[dir];
    const np = { x: clamp(player.pos.x + dx, 0, GRID - 1), y: clamp(player.pos.y + dy, 0, GRID - 1) };
    if (room.enemies.some(e => same(e.pos, np))) return append('An enemy blocks the way. Strike or reposition.');
    setPlayer(p => ({ ...p, pos: np, facing: dir }));
    enemyTurn(room.enemies, { ...player, pos: np, facing: dir });
  };
  const melee = () => {
    const dmg = build.power + stats.melee;
    let hit = false;
    const enemies = room.enemies.map(e => meleeTiles.some(t => same(t, e.pos)) ? (hit = true, { ...e, hp: e.hp - dmg }) : e).filter(e => e.hp > 0);
    if (!hit) append(`${build.name} cuts empty air.`); else append(`${build.name} lands for ${dmg}.`);
    const guard = build.guard + stats.guard + (hit ? 1 : 0);
    setPlayer(p => ({ ...p, guard }));
    if (!enemies.length) finishRoom(room); else enemyTurn(enemies, { ...player, guard });
  };
  const shoot = () => {
    if (player.ammo <= 0) return append('No shot left. Close distance.');
    const line = Array.from({ length: GRID }, (_, i) => ({ x: player.pos.x + (DIRS[player.facing][0] * (i + 1)), y: player.pos.y + (DIRS[player.facing][1] * (i + 1)) })).filter(t => t.x >= 0 && t.x < GRID && t.y >= 0 && t.y < GRID);
    const target = room.enemies.find(e => line.some(t => same(t, e.pos)));
    setPlayer(p => ({ ...p, ammo: p.ammo - 1 }));
    if (!target) return enemyTurn(room.enemies, { ...player, ammo: player.ammo - 1 });
    const dmg = 5 + stats.shot;
    append(`Ranged shot hits ${target.name} for ${dmg}.`);
    const enemies = room.enemies.map(e => e.id === target.id ? { ...e, hp: e.hp - dmg } : e).filter(e => e.hp > 0);
    if (!enemies.length) finishRoom(room); else enemyTurn(enemies, { ...player, ammo: player.ammo - 1 });
  };
  const nextRoom = () => {
    if (room.enemies.length) return append('The room is not clear.');
    if (room.boss) return endRun('You return changed. The crawl resets; the unlocks remain.');
    const next = roomIndex + 1;
    setRoomIndex(next); setRoom(makeRoom(next, floor, unlocks)); setPlayer(p => ({ ...p, pos: { x: 4, y: 7 }, hp: Math.min(maxHp, p.hp + 3), guard: 0 })); append('A new room re-forms beyond the gate.');
  };
  const descend = () => { setFloor(f => f + 1); setRoomIndex(0); setRoom(makeRoom(0, floor + 1, unlocks)); append('The stair rearranges itself beneath you.'); };

  if (screen === 'menu') return (
    <div className="uc-shell"><style>{styles}</style><button className="uc-back" onClick={onExit}>Back to Bag</button><section className="uc-hero"><div className="uc-kicker">Lotjarr's Bag of Games</div><h1>The Undercrypts of Soteria</h1><p>Descend, survive, return changed.</p></section><main className="uc-menu"><div className="uc-card"><h2>Choose Blood</h2><select value={race} onChange={e => setRace(e.target.value)}>{RACES.map(r => <option key={r.id} value={r.id}>{r.name} - {r.sub}</option>)}</select>{race === 'pamorph' && <select value={bloodline} onChange={e => setBloodline(e.target.value)}>{bloodlines.map(b => <option key={b.id} value={b.id}>{b.name} - {b.sub}</option>)}</select>}<div className="uc-stance"><b>{build.name}</b><span>{build.note}</span></div><button className="uc-primary" onClick={startRun}>Begin Crawl</button></div><div className="uc-card"><h2>Unlocked Pool</h2><div className="uc-unlocks">{ITEMS.map(i => <span key={i.id} className={unlocks.includes(i.id) ? 'on' : ''}>{i.name}</span>)}</div><p>Held inventory resets at the end of each crawl. Unlocked items stay unlocked and can appear in future rooms.</p></div></main></div>
  );

  return (
    <div className="uc-shell"><style>{styles}</style><button className="uc-back" onClick={() => setScreen('menu')}>Run Menu</button><header className="uc-top"><div><div className="uc-kicker">Floor {floor} - Room {roomIndex + 1}</div><h1>{room.name}</h1><p>{raceLabel(race, bloodline)} - {build.name}</p></div><div className="uc-vitals"><b>{player.hp}/{maxHp}</b><span>HP</span><b>{player.ammo}</b><span>Shots</span><b>{player.guard}</b><span>Guard</span></div></header><main className="uc-layout"><section className="uc-board">{Array.from({ length: GRID * GRID }, (_, i) => { const x = i % GRID, y = Math.floor(i / GRID); const enemy = room.enemies.find(e => e.pos.x === x && e.pos.y === y); const inArc = meleeTiles.some(t => t.x === x && t.y === y); const here = player.pos.x === x && player.pos.y === y; return <div key={i} className={'uc-cell ' + (inArc ? 'arc ' : '') + (here ? 'hero ' : '') + (enemy ? 'enemy ' : '')}>{here ? '@' : enemy ? enemy.icon : ''}{enemy && <small>{enemy.hp}</small>}</div>; })}</section><aside className="uc-side"><div className="uc-card"><h2>Actions</h2><div className="uc-controls"><button onClick={() => move('up')}>Up</button><button onClick={() => move('left')}>Left</button><button onClick={melee}>Melee</button><button onClick={() => move('right')}>Right</button><button onClick={() => move('down')}>Down</button><button onClick={shoot}>Shoot</button></div><button className="uc-primary" onClick={nextRoom} disabled={room.enemies.length > 0}>Next Room</button><button className="uc-secondary" onClick={descend} disabled={!room.boss || room.enemies.length > 0}>Descend</button></div><div className="uc-card"><h2>Inventory This Crawl</h2><div className="uc-inventory">{inventory.map((i, idx) => <div key={idx}><b>{i.name}</b><span>{i.desc}</span></div>)}</div></div><div className="uc-card"><h2>Room Log</h2><div className="uc-log">{log.map((l, i) => <p key={i}>{l}</p>)}</div></div></aside></main>{screen === 'ended' && <div className="uc-ended"><div><h2>Crawl Complete</h2><p>{log[0]}</p><button onClick={() => setScreen('menu')}>Return to Title</button></div></div>}</div>
  );
}

const styles = `
.uc-shell { min-height: 100vh; background: radial-gradient(circle at 50% 10%, rgba(87,64,28,.28), transparent 34%), #050403; color:#eadfca; font-family: Georgia, serif; padding: 28px; box-sizing:border-box; }
.uc-back { position: fixed; top: 16px; left: 16px; z-index: 5; border:1px solid rgba(214,177,84,.45); background:linear-gradient(#1f170d,#080604); color:#d8c28a; border-radius:8px; padding:10px 15px; font-family:Cinzel,serif; font-size:10px; letter-spacing:.14em; text-transform:uppercase; cursor:pointer; }
.uc-hero { text-align:center; padding: 72px 20px 30px; } .uc-kicker { font-family:Cinzel,serif; color:rgba(214,177,84,.72); font-size:10px; letter-spacing:.24em; text-transform:uppercase; } .uc-hero h1,.uc-top h1 { margin:8px 0; font-family:Cinzel,serif; color:#f2deb0; letter-spacing:.12em; text-transform:uppercase; } .uc-hero h1 { font-size: clamp(34px,6vw,66px); } .uc-hero p,.uc-top p,.uc-card p { color:rgba(234,223,202,.62); font-style:italic; }
.uc-menu { max-width:1040px; margin:0 auto; display:grid; grid-template-columns: 1fr 1fr; gap:18px; } .uc-card { border:1px solid rgba(214,177,84,.2); border-radius:14px; background:linear-gradient(145deg,rgba(255,255,255,.045),rgba(10,7,4,.88)); padding:18px; box-shadow:0 24px 70px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,240,190,.08); } .uc-card h2 { margin:0 0 14px; font-family:Cinzel,serif; color:#ead29a; font-size:13px; letter-spacing:.16em; text-transform:uppercase; }
.uc-card select { width:100%; margin-bottom:10px; min-height:40px; border:1px solid rgba(214,177,84,.28); border-radius:8px; background:#0e0a06; color:#eadfca; padding:0 10px; } .uc-stance { margin:12px 0; padding:14px; border:1px solid rgba(214,177,84,.16); border-radius:10px; } .uc-stance b { display:block; color:#f0d992; font-family:Cinzel,serif; } .uc-stance span { display:block; margin-top:6px; color:rgba(234,223,202,.58); }
.uc-primary,.uc-secondary,.uc-controls button,.uc-ended button { border:1px solid rgba(214,177,84,.42); border-radius:8px; background:linear-gradient(#3b2c12,#120c06); color:#f0d992; min-height:38px; padding:0 12px; font-family:Cinzel,serif; font-size:10px; letter-spacing:.12em; text-transform:uppercase; cursor:pointer; } .uc-primary { width:100%; } .uc-secondary { width:100%; margin-top:8px; opacity:.85; } button:disabled { opacity:.35; cursor:default; }
.uc-unlocks { display:flex; flex-wrap:wrap; gap:8px; } .uc-unlocks span { border:1px solid rgba(214,177,84,.16); border-radius:999px; color:rgba(234,223,202,.38); padding:6px 9px; font-size:11px; } .uc-unlocks span.on { color:#f0d992; border-color:rgba(214,177,84,.5); background:rgba(214,177,84,.08); }
.uc-top { max-width:1180px; margin:18px auto; display:flex; justify-content:space-between; gap:20px; align-items:center; } .uc-vitals { min-width:280px; display:grid; grid-template-columns:repeat(3,1fr); gap:4px 8px; text-align:center; border:1px solid rgba(214,177,84,.22); border-radius:12px; padding:12px; background:rgba(0,0,0,.24); } .uc-vitals b { color:#f0d992; font-size:18px; } .uc-vitals span { color:rgba(234,223,202,.52); font-size:10px; text-transform:uppercase; letter-spacing:.14em; }
.uc-layout { max-width:1180px; margin:0 auto; display:grid; grid-template-columns: minmax(560px,1fr) 340px; gap:18px; align-items:start; } .uc-board { display:grid; grid-template-columns:repeat(9,1fr); gap:6px; padding:18px; border:1px solid rgba(214,177,84,.22); border-radius:18px; background:linear-gradient(145deg,#171006,#070504); } .uc-cell { aspect-ratio:1; border:1px solid rgba(214,177,84,.12); border-radius:8px; background:#130d07; display:grid; place-items:center; position:relative; font-family:Cinzel,serif; color:rgba(234,223,202,.36); } .uc-cell.arc { background:radial-gradient(circle,rgba(214,177,84,.24),#130d07 70%); } .uc-cell.hero { color:#f5e7bd; border-color:#f0d992; box-shadow:0 0 22px rgba(214,177,84,.24); } .uc-cell.enemy { color:#ffb3a2; border-color:rgba(210,88,58,.55); } .uc-cell small { position:absolute; right:5px; bottom:4px; font-size:9px; color:rgba(255,210,190,.72); }
.uc-side { display:grid; gap:12px; } .uc-controls { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:10px; } .uc-inventory { display:grid; gap:8px; max-height:220px; overflow:auto; } .uc-inventory div { border-top:1px solid rgba(214,177,84,.12); padding-top:8px; } .uc-inventory b { display:block; color:#ead29a; } .uc-inventory span,.uc-log p { color:rgba(234,223,202,.56); font-size:12px; margin:4px 0 0; } .uc-log { max-height:180px; overflow:auto; }
.uc-ended { position:fixed; inset:0; display:grid; place-items:center; background:rgba(0,0,0,.72); z-index:10; } .uc-ended div { width:min(420px,90vw); border:1px solid rgba(214,177,84,.45); border-radius:16px; background:#0b0704; padding:24px; text-align:center; box-shadow:0 30px 90px rgba(0,0,0,.7); } .uc-ended h2 { font-family:Cinzel,serif; color:#f0d992; letter-spacing:.16em; text-transform:uppercase; }
@media (max-width: 980px) { .uc-menu,.uc-layout { grid-template-columns:1fr; } .uc-top { flex-direction:column; text-align:center; } .uc-board { min-width:0; } }
`;
