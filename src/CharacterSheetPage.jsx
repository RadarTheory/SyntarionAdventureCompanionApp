// The campaign Sheet tab (user, 2026-11-16): one page for the character, styled after the Constellation.
// - Hero: portrait, name, lineage, renown titles, and the race and class symbols drawn the way the constellation draws them
//   (luminance-to-alpha silhouettes tinted to the practice colour, on a glowing star).
// - The character's own sky: every calling at its atlas position, the ones they have awakened lit with their symbol and threaded to The Self.
//   Orbiting stars are plain stars, one per level or ability bought (no ability art).
// - Moral compass: Good ↔ Evil against Magic ↔ Tech. Renown: the DM's score and the titles the character has earned.
// - The old Scales tab lives here too: attributes, vitals / stamina / resolve, the Will | Whim and Soul | Spirit gauges, trait pools.
import { useEffect, useMemo, useRef, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS, getRaceDisplay } from './constants';
import PortraitUpload from './PortraitUpload';
import { useConstellation, classLabel } from './useConstellation';
import { DISCIPLINE_META, poolMaxes, poolOf } from './constellationAbilities';

const SKY = '#0b0f0e';
const GOLD = '#c8a84a';
const MAGIC_STATS = [
  { key: 'spirit', label: 'Spirit', equiv: 'Charisma' }, { key: 'soul', label: 'Soul', equiv: 'Faith' },
  { key: 'body', label: 'Body', equiv: 'Constitution' }, { key: 'essence', label: 'Essence', equiv: 'Wisdom' },
];
const TECH_STATS = [
  { key: 'will', label: 'Will', equiv: 'Strength' }, { key: 'whim', label: 'Whim', equiv: 'Dexterity' },
  { key: 'mind', label: 'Mind', equiv: 'Intelligence' }, { key: 'dream', label: 'Dream', equiv: 'Intent' },
];
const clamp4 = v => Math.max(-4, Math.min(4, Number(v) || 0));
const fmt = v => (Math.round(v * 100) / 100).toString();

// ── Constellation modules (atlas positions and class symbols), loaded once from public/constellation ──
let atlasModules = null;
function loadAtlas() {
  atlasModules ??= Promise.all([
    import(/* @vite-ignore */ new URL('/constellation/atlas-layout.js', window.location.origin).href),
    import(/* @vite-ignore */ new URL('/constellation/class-icons.js', window.location.origin).href),
  ]).then(([atlas, icons]) => ({ sharedLayout: atlas.sharedLayout, classIconFor: icons.classIconFor }));
  return atlasModules;
}
function useAtlas() {
  const [mods, setMods] = useState(null);
  useEffect(() => { let live = true; loadAtlas().then(m => { if (live) setMods(m); }).catch(() => {}); return () => { live = false; }; }, []);
  return mods;
}

// The constellation's symbol rendering: black-on-white PNG → silhouette tinted 70% toward the colour.
const tintCache = new Map();
function tint(src, color) {
  const key = `${src}|${color}`;
  if (!tintCache.has(key)) {
    tintCache.set(key, new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        try {
          const ratio = Math.min(1, 256 / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.naturalWidth * ratio); canvas.height = Math.round(img.naturalHeight * ratio);
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const px = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const rgb = [1, 3, 5].map(i => Math.round(parseInt(color.slice(i, i + 2), 16) * 0.7 + 255 * 0.3));
          for (let i = 0; i < px.data.length; i += 4) {
            const luma = (px.data[i] + px.data[i + 1] + px.data[i + 2]) / 3;
            px.data[i + 3] = Math.round(px.data[i + 3] * (255 - luma) / 255);
            px.data[i] = rgb[0]; px.data[i + 1] = rgb[1]; px.data[i + 2] = rgb[2];
          }
          ctx.putImageData(px, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    }));
  }
  return tintCache.get(key);
}
function useTinted(src, color) {
  const key = src && color ? `${src}|${color}` : null;
  const [done, setDone] = useState({ key: null, url: null });
  useEffect(() => {
    if (!key) return undefined;
    let live = true;
    tint(src, color).then(url => { if (live) setDone({ key, url }); });
    return () => { live = false; };
  }, [key, src, color]);
  return done.key === key ? done.url : null;
}

// A symbol on a star, as the constellation shows a selected class: a diamond frame, a soft glow and the tinted symbol.
function Emblem({ src, color, title, size = 64 }) {
  const url = useTinted(src, color);
  return (
    <div title={title} className="cs-emblem" style={{ width: size, height: size, '--glow': color }}>
      <div className="cs-emblem-frame" style={{ borderColor: `${color}88` }} />
      {url ? <img src={url} alt={title} style={{ width: size * 0.56, height: size * 0.56, objectFit: 'contain', position: 'relative' }} />
        : <span style={{ color, fontSize: size * 0.3, position: 'relative' }}>✦</span>}
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div className="cs-section-title">
      <span>{children}</span>{right}
    </div>
  );
}

// ── The character's sky ──
const SELF = { x: 515, y: 835 };
function fourPoint(x, y, r, inner = 0.22) {
  let d = '';
  for (let i = 0; i < 8; i++) {
    const rr = i % 2 ? r * inner : r, a = (i * 45 - 90) * Math.PI / 180;
    d += `${i ? 'L' : 'M'}${(x + rr * Math.cos(a)).toFixed(2)} ${(y + rr * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
}
const dust = Array.from({ length: 70 }, (_, i) => {
  const a = Math.sin(i * 12.9898) * 43758.5453, b = Math.sin(i * 78.233) * 12543.1234;
  return { x: 60 + (a - Math.floor(a)) * 1020, y: 180 + (b - Math.floor(b)) * 700, r: i % 7 === 0 ? 1.6 : 0.9, o: 0.15 + ((a * 7) % 1 + 1) % 1 * 0.35 };
});

function SkyStar({ star, color, symbolSrc, lit, orbit }) {
  const url = useTinted(lit ? symbolSrc : null, color);
  const { x, y } = star;
  if (!lit) {
    return (
      <g opacity="0.55">
        <circle cx={x} cy={y} r="4" fill="none" stroke={color} strokeOpacity="0.45" strokeWidth="1.2" />
        <circle cx={x} cy={y} r="1.4" fill={color} fillOpacity="0.6" />
      </g>
    );
  }
  return (
    <g>
      <title>{star.cls.name}</title>
      <circle cx={x} cy={y} r="46" fill={`url(#glow-${color.slice(1)})`} />
      <circle cx={x} cy={y} r="27" fill={SKY} stroke={color} strokeWidth="1.6" />
      <circle cx={x} cy={y} r="31" fill="none" stroke={color} strokeOpacity="0.35" strokeWidth="1" />
      {url ? <image href={url} x={x - 17} y={y - 17} width="34" height="34" />
        : <path d={fourPoint(x, y, 10)} fill={color} />}
      {Array.from({ length: Math.min(orbit, 14) }, (_, k) => {
        const a = (-90 + k * 137.508) * Math.PI / 180, r = k % 2 ? 41 : 36;
        return <path key={k} d={fourPoint(x + r * Math.cos(a), y + r * Math.sin(a), 3.6, 0.3)} fill="#fff" fillOpacity="0.85" />;
      })}
      <text x={x} y={y + 58} textAnchor="middle" className="cs-sky-label" fill={color}>{star.cls.name.toUpperCase()}</text>
    </g>
  );
}

function CharacterSky({ char, onOpen }) {
  const d = useConstellation();
  const atlas = useAtlas();
  const abilities = char?.abilities;
  const held = useMemo(() => (Array.isArray(abilities) ? abilities : []).filter(id => typeof id === 'string' && !id.includes('|')), [abilities]);
  const sky = useMemo(() => {
    if (!d || !atlas) return null;
    const revealed = held.some(id => d.classById(id.split(':')[0])?.discipline === 'praethacy');
    const layout = atlas.sharedLayout(revealed, held, true);
    const rootOf = id => { const c = d.classById(id); return c ? (c.rootId || c.id) : null; };
    const perRoot = new Map();
    for (const id of held) { const r = rootOf(id.split(':')[0]); if (r) perRoot.set(r, (perRoot.get(r) || 0) + 1); }
    return { layout, perRoot };
  }, [d, atlas, held]);

  const awakened = sky ? [...sky.perRoot.keys()].map(id => d.classById(id)).filter(Boolean) : [];
  const furthest = useMemo(() => {
    if (!d) return [];
    const best = new Map();
    for (const id of held) {
      const cls = d.classById(id.split(':')[0]); if (!cls) continue;
      const root = cls.rootId || cls.id, cur = best.get(root);
      if (!cur || (cls.tier || 1) > (cur.tier || 1)) best.set(root, cls);
    }
    return [...best.values()];
  }, [d, held]);

  return (
    <div className="cs-panel cs-sky-panel">
      <SectionTitle right={onOpen && <button type="button" className="cs-link" onClick={onOpen}>Open constellation ↗</button>}>
        {char?.name ? `${char.name.split(' ')[0]}'s constellation` : 'Constellation'}
      </SectionTitle>
      <div className="cs-sky">
        {!sky ? <div className="cs-empty">Reading the stars…</div> : (
          <svg viewBox="40 95 1060 815" role="img" aria-label={`Constellation: ${awakened.map(c => c.name).join(', ') || 'no callings awakened yet'}`}>
            <defs>
              {sky.layout.map(({ discipline }) => (
                <radialGradient key={discipline.id} id={`glow-${discipline.color.slice(1)}`}>
                  <stop offset="0" stopColor={discipline.color} stopOpacity="0.38" />
                  <stop offset="1" stopColor={discipline.color} stopOpacity="0" />
                </radialGradient>
              ))}
              <radialGradient id="cs-self-glow"><stop offset="0" stopColor="#fff" stopOpacity="0.35" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
            </defs>
            {dust.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#cfe3dc" fillOpacity={p.o} />)}
            {sky.layout.map(({ discipline, edges, stars, origin }) => (
              <g key={discipline.id}>
                <text x={origin.x} y={origin.y + 6} textAnchor="middle" className="cs-sky-region" fill={discipline.color}>{discipline.name.toUpperCase()}</text>
                {edges.map(([a, b]) => stars[a] && stars[b] && (
                  <line key={`${a}-${b}`} x1={stars[a].x} y1={stars[a].y} x2={stars[b].x} y2={stars[b].y} stroke={discipline.color} strokeOpacity="0.16" strokeWidth="1.2" />
                ))}
                {stars.filter(s => sky.perRoot.has(s.cls.id)).map(s => {
                  const mx = (SELF.x + s.x) / 2 + (s.x < SELF.x ? -40 : 40), my = (SELF.y + s.y) / 2 + 30;
                  return <path key={`t-${s.cls.id}`} d={`M${SELF.x} ${SELF.y} Q${mx} ${my} ${s.x} ${s.y}`} fill="none" stroke={discipline.color} strokeOpacity="0.7" strokeWidth="1.6" className="cs-thread" />;
                })}
              </g>
            ))}
            {sky.layout.map(({ discipline, stars }) => stars.map(s => {
              const icon = atlas.classIconFor(s.cls);
              const color = d.setupForClass(s.cls).color || discipline.color;
              return <SkyStar key={s.cls.id} star={s} color={color} symbolSrc={icon ? `/constellation/${icon.src}` : null} lit={sky.perRoot.has(s.cls.id)} orbit={sky.perRoot.get(s.cls.id) || 0} />;
            }))}
            <circle cx={SELF.x} cy={SELF.y} r="40" fill="url(#cs-self-glow)" />
            <path d={fourPoint(SELF.x, SELF.y, 16, 0.24)} fill="#f5f1e8" />
            <text x={SELF.x} y={SELF.y + 40} textAnchor="middle" className="cs-sky-region" fill="#cfc6b6">THE SELF</text>
          </svg>
        )}
      </div>
      <div className="cs-sky-foot">
        {furthest.length ? furthest.map(c => {
          const color = d.setupForClass(c).color;
          return <span key={c.id} className="cs-chip" style={{ color, borderColor: `${color}55`, background: `${color}12` }}>{c.name}</span>;
        }) : <span className="cs-empty">No stars awakened yet{onOpen ? ' — open the constellation to begin.' : '.'}</span>}
        <span className="cs-sky-count">{held.length} {held.length === 1 ? 'star' : 'stars'} awakened</span>
      </div>
    </div>
  );
}

// ── Moral compass: north Good, south Evil, west Magic, east Tech ──
function MoralCompass({ moral, magicTech }) {
  const R = 78, cx = 110, cy = 110;
  const px = cx + (magicTech / 4) * R, py = cy - (moral / 4) * R;
  const moralWord = moral > 0.5 ? 'Good' : moral < -0.5 ? 'Evil' : 'Balanced';
  const leanWord = magicTech < -0.5 ? 'Magic' : magicTech > 0.5 ? 'Tech' : 'Neutral';
  return (
    <div className="cs-panel">
      <SectionTitle>Moral compass</SectionTitle>
      <div className="cs-compass">
        <svg viewBox="0 0 220 220" role="img" aria-label={`Moral compass: ${moralWord} ${fmt(moral)}, ${leanWord} ${fmt(magicTech)}`}>
          <defs>
            <radialGradient id="cs-compass-bg"><stop offset="0" stopColor="#1c1813" /><stop offset="1" stopColor={SKY} /></radialGradient>
            <linearGradient id="cs-compass-mt" x1="0" x2="1"><stop offset="0" stopColor={COLORS.magic} stopOpacity="0.22" /><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor={COLORS.tech} stopOpacity="0.22" /></linearGradient>
            <linearGradient id="cs-compass-ge" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e8d9a7" stopOpacity="0.18" /><stop offset="0.5" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor={COLORS.warn} stopOpacity="0.2" /></linearGradient>
          </defs>
          <circle cx={cx} cy={cy} r={R + 14} fill="url(#cs-compass-bg)" stroke={`${GOLD}55`} />
          <circle cx={cx} cy={cy} r={R} fill="url(#cs-compass-mt)" />
          <circle cx={cx} cy={cy} r={R} fill="url(#cs-compass-ge)" stroke={`${GOLD}33`} />
          {[1, 2, 3].map(k => <circle key={k} cx={cx} cy={cy} r={(R * k) / 4} fill="none" stroke="#fff" strokeOpacity="0.05" />)}
          {Array.from({ length: 32 }, (_, i) => {
            const a = (i * 360) / 32 * Math.PI / 180, long = i % 8 === 0, r0 = R + (long ? 4 : 8), r1 = R + 14;
            return <line key={i} x1={cx + r0 * Math.sin(a)} y1={cy - r0 * Math.cos(a)} x2={cx + r1 * Math.sin(a)} y2={cy - r1 * Math.cos(a)} stroke={GOLD} strokeOpacity={long ? 0.7 : 0.3} />;
          })}
          <line x1={cx - R} y1={cy} x2={cx + R} y2={cy} stroke="#fff" strokeOpacity="0.12" />
          <line x1={cx} y1={cy - R} x2={cx} y2={cy + R} stroke="#fff" strokeOpacity="0.12" />
          <path d={fourPoint(cx, cy, 30, 0.12)} fill={GOLD} fillOpacity="0.12" />
          <line x1={cx} y1={cy} x2={px} y2={py} stroke={GOLD} strokeWidth="1.6" />
          <circle cx={px} cy={py} r="11" fill={GOLD} fillOpacity="0.18" />
          <path d={fourPoint(px, py, 8, 0.3)} fill="#f5e7b8" />
          <circle cx={cx} cy={cy} r="2.5" fill={GOLD} />
          <text x={cx} y="12" textAnchor="middle" className="cs-compass-label" fill="#e8d9a7">GOOD</text>
          <text x={cx} y="216" textAnchor="middle" className="cs-compass-label" fill={COLORS.warn}>EVIL</text>
          <text x="6" y={cy + 3} textAnchor="start" className="cs-compass-label" fill={COLORS.magicText}>MAGIC</text>
          <text x="214" y={cy + 3} textAnchor="end" className="cs-compass-label" fill={COLORS.techText}>TECH</text>
        </svg>
        <div className="cs-compass-read">
          <div><b style={{ color: moral >= 0 ? '#e8d9a7' : COLORS.warn }}>{moralWord}</b><small>{moral > 0 ? '+' : ''}{fmt(moral)} of ±4</small></div>
          <div><b style={{ color: magicTech < 0 ? COLORS.magicText : magicTech > 0 ? COLORS.techText : COLORS.muted }}>{leanWord}</b><small>{magicTech > 0 ? '+' : ''}{fmt(magicTech)} of ±4</small></div>
        </div>
      </div>
    </div>
  );
}

function Renown({ char }) {
  const score = Number(char?.renown) || 0;
  const titles = (Array.isArray(char?.renownTitles) ? char.renownTitles : []).map(t => (typeof t === 'string' ? { name: t } : t)).filter(t => t?.name);
  return (
    <div className="cs-panel">
      <SectionTitle>Renown</SectionTitle>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <div className="cs-big" style={{ color: GOLD }}>{score}</div>
        <div className="cs-sub">awarded by the Architect</div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {titles.length ? titles.map((t, i) => (
          <span key={`${t.name}-${i}`} className="cs-chip cs-title" title={t.note || t.name}>✦ {t.name}</span>
        )) : <span className="cs-empty">No titles earned yet.</span>}
      </div>
    </div>
  );
}

function Attribute({ stat, axis, effectiveStats, char }) {
  const base = char.stats?.[stat.key] || 8;
  const item = effectiveStats._itemBonuses?.[stat.key] || 0;
  const cond = effectiveStats._conditionBonuses?.[stat.key] || 0;
  const total = base + item + cond;
  const color = axis === 'magic' ? COLORS.magic : COLORS.tech, text = axis === 'magic' ? COLORS.magicText : COLORS.techText;
  const pct = Math.max(0, Math.min(100, ((total - 8) / 12) * 100));
  return (
    <div className="cs-attr">
      <div>
        <div className="cs-attr-name" style={{ color: text }}>{stat.label}</div>
        <div className="cs-sub">{stat.equiv}{item || cond ? ` · ${base}${item ? ` +${item}` : ''}${cond ? ` ${cond > 0 ? '+' : ''}${cond}` : ''}` : ''}</div>
      </div>
      <div className="cs-attr-val" style={{ color: text }}>{total}</div>
      <div className="cs-attr-bar"><span style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}

function Gauge({ label, value, max, note, color }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="cs-gauge">
      <div className="cs-gauge-head"><span>{label}</span><b style={{ color }}>{value}</b></div>
      <div className="cs-attr-bar"><span style={{ width: `${pct}%`, background: color }} /></div>
      <div className="cs-sub">{note}</div>
    </div>
  );
}

function Balance({ left, right, a, b, colorA, colorB }) {
  const pct = a + b > 0 ? (a / (a + b)) * 100 : 50;
  return (
    <div className="cs-gauge">
      <div className="cs-gauge-head"><span style={{ color: colorA }}>{left} <b>{a}</b></span><span style={{ color: colorB }}><b>{b}</b> {right}</span></div>
      <div className="cs-balance"><span style={{ width: `${pct}%`, background: colorA }} /><span style={{ width: `${100 - pct}%`, background: colorB }} /></div>
    </div>
  );
}

export default function CharacterSheetPage({ char, effectiveStats, onUpdateChar, onOpenAbilities }) {
  const d = useConstellation();
  const label = classLabel(d, char);
  const callingId = label?.iconId;
  const calling = d && callingId ? d.classById(callingId) : null;
  const mainClass = d && label ? d.classes.find(c => c.name === label.name) || calling : null;
  const atlas = useAtlas();
  const classIcon = atlas && mainClass ? atlas.classIconFor(mainClass) : null;
  const classColor = d && mainClass ? d.setupForClass(mainClass).color : COLORS.magic;
  const raceKey = char.race ? char.race.toLowerCase().replace(/[^a-z]/g, '') : null;

  const sliders = char.sliders || {};
  const dmShift = typeof char.morality === 'number' ? char.morality : (/^-?\d+(\.\d+)?$/.test(String(char.morality ?? '').trim()) ? Number(char.morality) : 0);
  const moral = clamp4((Number(sliders.morality) || 0) + dmShift);
  const magicTech = clamp4(sliders.magicTech);

  const xp = char.apTotal ?? char.ap_total ?? 0;
  const apLeft = char.atCurrent ?? char.at_current ?? char.apCurrent ?? 0;
  const apTotal = char.atTotal ?? char.at_total ?? char.apTotal ?? 0;
  const level = char.charLevel ?? char.level ?? 1;
  const titles = (Array.isArray(char.renownTitles) ? char.renownTitles : []).map(t => (typeof t === 'string' ? t : t?.name)).filter(Boolean);

  const stat = k => effectiveStats[k] || 8;
  const maxes = d ? poolMaxes(d, char.abilities) : {};
  const pools = Object.entries(maxes).map(([key, max]) => ({ key, max, pool: poolOf(char, key, max), meta: DISCIPLINE_META[key] || {} }));

  const PACK_META_KEY = `syntarion_pack_meta_${char?.id}`;
  const coin = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(PACK_META_KEY) || '{}').coin ?? ''; } catch { return ''; }
  }, [PACK_META_KEY]);

  const [playerNotes, setPlayerNotes] = useState(char.playerNotes || '');
  const notesTimer = useRef(null);
  const handleNotesChange = val => {
    setPlayerNotes(val);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      // Merge into a fresh read so edits made elsewhere (purchases, the DM) are kept.
      const { data: row } = await supabase.from('characters').select('data').eq('id', char.id).maybeSingle();
      const current = (typeof row?.data === 'string' ? JSON.parse(row.data) : row?.data) || {};
      await supabase.from('characters').update({ data: { ...current, playerNotes: val } }).eq('id', char.id);
      onUpdateChar?.({ ...char, playerNotes: val });
    }, 600);
  };

  const uploadPortrait = async url => {
    const { data: row } = await supabase.from('characters').select('data').eq('id', char.id).maybeSingle();
    const current = (typeof row?.data === 'string' ? JSON.parse(row.data) : row?.data) || {};
    await supabase.from('characters').update({ data: { ...current, portrait_url: url } }).eq('id', char.id);
    onUpdateChar?.({ ...char, portrait_url: url });
  };

  return (
    <div className="cs-page">
      <style>{CSS}</style>

      {/* Hero */}
      <div className="cs-hero">
        <div className="cs-portrait"><PortraitUpload currentUrl={char.portrait_url} onUploaded={uploadPortrait} size={120} /></div>
        <div className="cs-hero-main">
          <div className="cs-eyebrow">{[`Level ${level}`, label?.title].filter(Boolean).join(' · ')}</div>
          <h1 className="cs-name">{char.name || 'Unnamed'}</h1>
          <div className="cs-lineage">
            {[getRaceDisplay(char.race, char.rv, char.pmV), label?.name, char.deity || char.spirit || null].filter(Boolean).join(' · ')}
          </div>
          {titles.length > 0 && <div className="cs-hero-titles">{titles.map((t, i) => <span key={`${t}-${i}`}>✦ {t}</span>)}</div>}
          <div className="cs-hero-stats">
            <div><b>{apLeft}</b><small>AP of {apTotal}</small></div>
            <div><b>{xp}</b><small>XP</small></div>
            <div><b style={{ color: GOLD }}>{Number(char.renown) || 0}</b><small>Renown</small></div>
            <div><b style={{ color: '#d6b85a' }}>{coin || '—'}</b><small>Coin</small></div>
          </div>
        </div>
        <div className="cs-emblems">
          {raceKey && <Emblem src={`/RaceIcons/${raceKey}.png`} color={GOLD} title={getRaceDisplay(char.race, char.rv, char.pmV)} />}
          {classIcon && <Emblem src={`/constellation/${classIcon.src}`} color={classColor} title={[label?.name, label?.trait].filter(Boolean).join(' · ')} />}
        </div>
      </div>

      <div className="cs-grid cs-grid-sky">
        <CharacterSky char={char} onOpen={onOpenAbilities} />
        <div className="cs-stack">
          <MoralCompass moral={moral} magicTech={magicTech} />
          <Renown char={char} />
        </div>
      </div>

      <div className="cs-grid cs-grid-attrs">
        <div className="cs-panel">
          <SectionTitle>Attributes</SectionTitle>
          <div className="cs-attr-cols">
            <div>
              <div className="cs-axis" style={{ color: COLORS.magicText }}>Magic axis</div>
              {MAGIC_STATS.map(s => <Attribute key={s.key} stat={s} axis="magic" effectiveStats={effectiveStats} char={char} />)}
            </div>
            <div>
              <div className="cs-axis" style={{ color: COLORS.techText }}>Tech axis</div>
              {TECH_STATS.map(s => <Attribute key={s.key} stat={s} axis="tech" effectiveStats={effectiveStats} char={char} />)}
            </div>
          </div>
        </div>
        <div className="cs-panel">
          <SectionTitle>Scales</SectionTitle>
          <Gauge label="Vitals" value={stat('body') + stat('will')} max={40} note="Body + Will" color="#e05a5a" />
          <Gauge label="Stamina" value={stat('body') + stat('whim')} max={40} note="Body + Whim" color="#e08a5a" />
          <Gauge label="Resolve" value={stat('soul') + stat('dream')} max={40} note="Soul + Dream" color={COLORS.magic} />
          <div style={{ height: 8 }} />
          <Balance left="Will" right="Whim" a={stat('will')} b={stat('whim')} colorA={COLORS.techText} colorB={COLORS.spiritText} />
          <Balance left="Soul" right="Spirit" a={stat('soul')} b={stat('spirit')} colorA={COLORS.magicText} colorB={COLORS.deityText} />
        </div>
      </div>

      {pools.length > 0 && (
        <div className="cs-panel">
          <SectionTitle right={<span className="cs-sub">refill on a long rest</span>}>Trait pools</SectionTitle>
          <div className="cs-pools">
            {pools.map(p => (
              <div key={p.key} className="cs-pool" style={{ borderColor: `${p.meta.color || GOLD}44` }}>
                <div className="cs-sub" style={{ textTransform: 'uppercase', letterSpacing: '0.12em' }}>{p.meta.label || p.key} · {p.meta.trait || p.key}</div>
                <div className="cs-pool-val" style={{ color: p.meta.color || GOLD }}>{p.pool}<small> / {p.max}</small></div>
                <div className="cs-pool-pips">{Array.from({ length: Math.min(p.max, 20) }, (_, i) => <i key={i} style={{ background: i < p.pool ? (p.meta.color || GOLD) : 'transparent', borderColor: p.meta.color || GOLD }} />)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="cs-panel">
        <SectionTitle>Notes</SectionTitle>
        <textarea className="cs-notes" value={playerNotes} onChange={e => handleNotesChange(e.target.value)} placeholder="Personal notes, reminders, goals…" rows={4} />
      </div>
    </div>
  );
}

const CSS = `
.cs-page{display:grid;gap:16px;color:${COLORS.text};font-family:Georgia,serif}
.cs-panel{position:relative;background:linear-gradient(180deg,rgba(18,22,20,.92),rgba(14,12,10,.92));border:1px solid rgba(200,168,74,.18);border-radius:10px;padding:16px 18px;box-shadow:inset 0 1px 0 rgba(255,255,255,.03),0 10px 30px rgba(0,0,0,.25);min-width:0}
.cs-section-title{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:${GOLD}}
.cs-section-title::before{content:'✦';margin-right:8px;opacity:.7}
.cs-section-title>span{flex:1}
.cs-link{background:none;border:1px solid rgba(200,168,74,.35);color:#e3cf8f;border-radius:999px;padding:5px 12px;font-family:'Cinzel',serif;font-size:9px;letter-spacing:.14em;text-transform:uppercase;cursor:pointer}
.cs-link:hover{background:rgba(200,168,74,.1)}
.cs-sub{font-size:10px;color:${COLORS.dim}}
.cs-empty{font-size:11px;color:${COLORS.dim};font-style:italic}
.cs-big{font-family:'Cinzel',serif;font-size:34px;font-weight:700;line-height:1}
.cs-chip{display:inline-flex;align-items:center;border:1px solid;border-radius:999px;padding:3px 10px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:.08em}
.cs-title{color:#ecd99a;border-color:rgba(200,168,74,.4);background:rgba(200,168,74,.08)}
.cs-hero{display:grid;grid-template-columns:auto 1fr auto;gap:22px;align-items:center;padding:22px 24px;border-radius:12px;border:1px solid rgba(200,168,74,.25);background:radial-gradient(ellipse at 80% 20%,rgba(111,158,120,.12),transparent 55%),radial-gradient(ellipse at 10% 100%,rgba(74,136,184,.10),transparent 50%),linear-gradient(180deg,#121614,#0d0b09);box-shadow:0 18px 40px rgba(0,0,0,.35)}
.cs-portrait{flex-shrink:0}
.cs-eyebrow{font-family:'Cinzel',serif;font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:${GOLD};margin-bottom:6px}
.cs-name{margin:0;font-family:'Cinzel',serif;font-size:30px;font-weight:700;letter-spacing:.04em;line-height:1.1;color:#f6f0e2;text-shadow:0 0 24px rgba(200,168,74,.15)}
.cs-lineage{margin-top:6px;font-style:italic;font-size:13px;color:${COLORS.muted}}
.cs-hero-titles{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:8px;font-family:'Cinzel',serif;font-size:10px;letter-spacing:.1em;color:#ecd99a}
.cs-hero-stats{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.cs-hero-stats>div{min-width:74px;padding:7px 12px;border:1px solid rgba(240,238,235,.08);border-radius:8px;background:rgba(0,0,0,.25)}
.cs-hero-stats b{display:block;font-family:'Cinzel',serif;font-size:18px;color:${COLORS.magicText}}
.cs-hero-stats small{font-size:9px;color:${COLORS.dim};letter-spacing:.08em;text-transform:uppercase}
.cs-emblems{display:flex;flex-direction:column;gap:14px}
.cs-emblem{position:relative;display:grid;place-items:center;filter:drop-shadow(0 0 14px color-mix(in srgb,var(--glow) 45%,transparent))}
.cs-emblem-frame{position:absolute;inset:12%;transform:rotate(45deg);border:1px solid;border-radius:6px;background:radial-gradient(circle,color-mix(in srgb,var(--glow) 22%,transparent),rgba(8,10,9,.9) 70%)}
.cs-grid{display:grid;gap:16px}
.cs-grid-sky{grid-template-columns:minmax(0,1.75fr) minmax(0,1fr)}
.cs-grid-attrs{grid-template-columns:minmax(0,1.5fr) minmax(0,1fr)}
.cs-stack{display:grid;gap:16px;align-content:start}
.cs-sky-panel{padding-bottom:12px}
.cs-sky{border-radius:8px;overflow:hidden;background:radial-gradient(ellipse at 50% 60%,#14201c 0%,${SKY} 70%);border:1px solid rgba(255,255,255,.05)}
.cs-sky svg{display:block;width:100%;height:auto}
.cs-sky .cs-empty{padding:60px;text-align:center}
.cs-sky-label{font-family:'Cinzel',serif;font-size:19px;letter-spacing:.12em}
.cs-sky-region{font-family:'Cinzel',serif;font-size:17px;letter-spacing:.3em;opacity:.55}
.cs-thread{stroke-dasharray:4 5;animation:cs-flow 6s linear infinite}
@keyframes cs-flow{to{stroke-dashoffset:-90}}
@media (prefers-reduced-motion:reduce){.cs-thread{animation:none}}
.cs-sky-foot{display:flex;flex-wrap:wrap;align-items:center;gap:6px;margin-top:10px}
.cs-sky-count{margin-left:auto;font-family:'Cinzel',serif;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:${COLORS.dim}}
.cs-compass{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center}
.cs-compass svg{width:100%;max-width:220px;height:auto;display:block;margin:0 auto}
.cs-compass-label{font-family:'Cinzel',serif;font-size:9px;letter-spacing:.2em}
.cs-compass-read{display:grid;gap:12px}
.cs-compass-read b{display:block;font-family:'Cinzel',serif;font-size:14px}
.cs-compass-read small{font-size:9px;color:${COLORS.dim}}
.cs-attr-cols{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.cs-axis{font-family:'Cinzel',serif;font-size:9px;letter-spacing:.2em;text-transform:uppercase;margin-bottom:6px}
.cs-attr{display:grid;grid-template-columns:1fr auto;gap:2px 10px;padding:8px 0;border-bottom:1px solid rgba(240,238,235,.06)}
.cs-attr-name{font-family:'Cinzel',serif;font-size:12px;font-weight:700;letter-spacing:.06em}
.cs-attr-val{font-family:'Cinzel',serif;font-size:22px;font-weight:700;align-self:center}
.cs-attr-bar{grid-column:1/-1;height:3px;border-radius:2px;background:rgba(255,255,255,.06);overflow:hidden}
.cs-attr-bar span{display:block;height:100%;border-radius:2px;transition:width .3s ease}
.cs-gauge{margin-bottom:12px}
.cs-gauge-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:.06em}
.cs-gauge-head b{font-size:15px}
.cs-gauge .cs-attr-bar{height:5px}
.cs-gauge .cs-sub{margin-top:3px}
.cs-balance{display:flex;height:5px;border-radius:3px;overflow:hidden;gap:2px}
.cs-balance span{display:block;height:100%;opacity:.8}
.cs-pools{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}
.cs-pool{border:1px solid;border-radius:8px;padding:10px 12px;background:rgba(0,0,0,.2)}
.cs-pool-val{font-family:'Cinzel',serif;font-size:20px;font-weight:700;margin-top:4px}
.cs-pool-val small{font-size:11px;color:${COLORS.dim};font-weight:400}
.cs-pool-pips{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px}
.cs-pool-pips i{width:7px;height:7px;border:1px solid;transform:rotate(45deg);border-radius:1px}
.cs-notes{width:100%;box-sizing:border-box;background:rgba(0,0,0,.25);border:1px solid rgba(240,238,235,.08);border-radius:8px;padding:10px 12px;color:${COLORS.text};font-size:12px;font-family:Georgia,serif;outline:none;resize:vertical}
.cs-notes:focus{border-color:rgba(200,168,74,.4)}
@media (max-width:860px){.cs-grid-sky,.cs-grid-attrs{grid-template-columns:1fr}}
@media (max-width:620px){
  .cs-hero{grid-template-columns:1fr;justify-items:center;text-align:center;padding:18px 16px}
  .cs-emblems{flex-direction:row;order:-1}
  .cs-hero-stats,.cs-hero-titles{justify-content:center}
  .cs-name{font-size:24px}
  .cs-attr-cols{grid-template-columns:1fr}
  .cs-compass{grid-template-columns:1fr}
  .cs-compass-read{grid-template-columns:1fr 1fr;text-align:center}
}
`;
