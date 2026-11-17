import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useDevice } from './useDevice';
import {
  COLORS, RACES, PM_GROUPS, PM_ALL,
  NAMES, getNamePool, pick, RACE_VARIANT_DESCS,
  PAMORPH_LORE, getRacialTraits,
} from './constants';
import supabase from './lib/supabase';
import StepStage from './wizard/StepStage';
import { useImageFailed } from './wizard/useImageFailed';
import { versioned } from './wizard/assetVersion';
import { raceArtFor } from './wizard/raceArt';
import './wizard/race.css';
const PortraitUpload = lazy(() => import('./PortraitUpload'));

// ═════════════════════════════════════════════════════════════════════════════
// STEP RACE (user, 2026-11-17)
// On the wizard's full-page stage, like the Class step's constellation: the peoples of Soteria are two constellations
// (user, 2026-11-17). Humanoid, set from Magic (left) to Tech (right) by each race's lean; and Pa'morph, its sign at
// the centre with its five bloodline groups (Major, Minor, Sauric, Ferra, Astral) around it. Hovering one reads its lore a beat later, as the
// constellation does; choosing one dives in, where its variants circle it, its traits are read, and the character is
// named. The choices and what they set (race, rv, pmV, name, gender, age, portrait) are exactly as before.
// ═════════════════════════════════════════════════════════════════════════════

const raceIconSrc = (raceId) => raceId ? versioned(`/RaceIcons/${String(raceId).toLowerCase().replace(/[^a-z]/g, '')}.png`) : null;
const accentOf = (tag) => tag === 'magic' ? COLORS.magicText : tag === 'tech' ? COLORS.techText : '#c4b389';
const tagWord = (tag) => tag === 'magic' ? 'Magic' : tag === 'tech' ? 'Tech' : 'Any path';
const pmName = (id) => PM_ALL.find(b => b.id === id)?.name;
const groupOf = (pmV) => PM_GROUPS.find(g => g.list.some(b => b.id === pmV))?.id || PM_GROUPS[0].id;

// ─── RACE DISPLAY HELPER ──────────────────────────────────────────────────────
export function getRaceDisplay(race, rv, pmV) {
  if (!race) return '';
  if (race === 'pamorph') {
    const bloodline = PM_ALL.find(b => b.id === pmV);
    if (!bloodline) return "Pa'morph";
    return `Pa'morph · ${bloodline.name}`;
  }
  const raceData = RACES.find(r => r.id === race);
  if (!raceData) return race;
  if (rv) return `${raceData.name} · ${rv}`;
  return raceData.name;
}

// ─── DESCRIPTION RESOLVER ─────────────────────────────────────────────────────
function resolveDesc(r, rv, pmV) {
  if (r.isPamorph) {
    if (pmV && PAMORPH_LORE[pmV]) return PAMORPH_LORE[pmV].default;
    return PAMORPH_LORE.default;
  }
  const variantDescs = RACE_VARIANT_DESCS[r.id];
  if (!variantDescs) return r.desc;
  if (rv && variantDescs[rv]) return variantDescs[rv];
  return variantDescs.default || r.desc;
}

// ─── THE FIELD'S LAYOUT ───────────────────────────────────────────────────────
// One column per lean (-2 … +2), each people spaced down its column, alternate ones nudged aside so the columns read
// as constellations rather than a table. Positions are percentages of the field.
function seeded(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const HUMANOID = RACES.filter(r => !r.isPamorph);
const PAMORPH = RACES.find(r => r.isPamorph);
// Each constellation's box, as percentages of the map (on phones the map is a tall column that scrolls).
const BOXES = {
  desktop: { human: { x: 2, y: 8, w: 61, h: 66 }, beast: { x: 66, y: 8, w: 32, h: 66 } },
  mobile:  { human: { x: 2, y: 4, w: 96, h: 58 }, beast: { x: 2, y: 68, w: 96, h: 30 } },
};
const inBox = (box, x, y) => ({ x: box.x + (x * box.w) / 100, y: box.y + (y * box.h) / 100 });
// Pa'morph's groups around its sign, clockwise from the top.
const GROUP_ANGLE = { major: -90, minor: -18, sauric: 54, ferra: 126, astral: 198 };

function layoutField(isMobile) {
  const boxes = isMobile ? BOXES.mobile : BOXES.desktop;
  // Humanoid: one column per lean (-2 … +2), each people spaced down its column, alternate ones nudged aside so the
  // columns read as constellations rather than a table.
  const cols = new Map();
  HUMANOID.forEach(r => { const lean = Math.max(-2, Math.min(2, Math.round(r.lean || 0))); if (!cols.has(lean)) cols.set(lean, []); cols.get(lean).push(r); });
  const at = {};
  for (const [lean, list] of cols) {
    list.forEach((r, i) => {
      const p = inBox(boxes.human, 9 + (lean + 2) * 20.5, 15 + (i + 0.5) * (82 / list.length));
      at[r.id] = { ...p, side: list.length > 3 ? (i % 2 ? 1 : -1) : 0 };
    });
  }
  // Pa'morph: its sign in the middle, the groups on a ring around it.
  const cy = isMobile ? 60 : 54;
  at[PAMORPH.id] = inBox(boxes.beast, 50, cy);
  for (const g of PM_GROUPS) {
    const a = ((GROUP_ANGLE[g.id] ?? 0) * Math.PI) / 180;
    at[`group:${g.id}`] = inBox(boxes.beast, 50 + Math.cos(a) * (isMobile ? 34 : 36), cy + Math.sin(a) * (isMobile ? 28 : 30));
  }
  return { at, cols, boxes };
}
const DUST = (() => { const rnd = seeded(1729); return Array.from({ length: 110 }, () => ({ x: rnd() * 100, y: rnd() * 100, r: rnd() < 0.9 ? 0.6 : 1.1, o: 0.12 + rnd() * 0.35 })); })();

function Sigil({ r }) {
  const src = raceIconSrc(r.id);
  const failed = useImageFailed(src);
  return (
    <span className="rf-ring">
      {src && !failed
        ? <span className="rf-glyph" style={{ '--glyph': `url("${src}")` }} />
        : <b>{r.name.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}</b>}
    </span>
  );
}

function Traits({ raceId, rv, pmV }) {
  const traits = getRacialTraits(raceId, rv, pmV);
  if (!traits) return null;
  const { passive, active } = traits;
  return (
    <div>
      {passive && (
        <div className="rd-trait">
          <small>PASSIVE</small><b>{passive.name}</b>
          <p>{passive.text}</p>
        </div>
      )}
      <div className="rd-trait">
        <small className="active">ACTIVE · ONCE PER REST</small>{active && <b>{active.name}</b>}
        {active
          ? <p>{active.text}</p>
          : <p className="wait">{(raceId === 'pamorph' ? pmV : rv) ? 'This one’s active trait has not been written yet.' : raceId === 'pamorph' ? 'Choose a bloodline to see your active trait.' : 'Choose a variant to see your active trait.'}</p>}
      </div>
    </div>
  );
}

/** Variants on a ring around the race's sign; the chosen one is joined to it by a thread. */
function Orbit({ r, rv, setRv }) {
  const box = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = box.current; if (!el) return undefined;
    const fit = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);
  const variants = r.variants?.length > 1 ? r.variants : [];
  const R = Math.max(120, Math.min(235, Math.min(size.w, size.h) / 2 - 56));
  // The centre sign keeps its proportion to the orbit, so a small orbit never crowds it (user, 2026-11-17).
  const core = Math.round(Math.max(92, Math.min(148, R * 0.62)));
  const cx = size.w / 2, cy = size.h / 2;
  const spots = variants.map((v, i) => {
    const a = -Math.PI / 2 + (i / variants.length) * Math.PI * 2;
    return { v, x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R * 0.86 };
  });
  const chosen = spots.find(s => s.v === rv);
  return (
    <div className="rd-orbit" ref={box}>
      {size.w > 0 && (
        <svg aria-hidden="true">
          <ellipse cx={cx} cy={cy} rx={R} ry={R * 0.86} fill="none" stroke="#c4c4a333" strokeWidth=".7" />
          <circle className="dotted" cx={cx} cy={cy} r={core / 2 + 16} />
          {chosen && <line x1={cx} y1={cy} x2={chosen.x} y2={chosen.y} />}
        </svg>
      )}
      <div className="rd-core" style={{ '--core': `${core}px` }}><Sigil r={r} /><strong>{r.name.toUpperCase()}</strong></div>
      {size.w > 0 && spots.map((s, i) => (
        <button key={s.v} type="button" className={`rd-variant${rv === s.v ? ' chosen' : ''}`}
          style={{ left: s.x, top: s.y, animationDelay: `${0.35 + i * 0.05}s` }}
          onClick={() => setRv(rv === s.v ? null : s.v)}>{s.v}</button>
      ))}
    </div>
  );
}

/** Phones, and Pa'morph's bloodlines (a tab for each group): the sign above, the choices in rows below it. */
function Chips({ r, rv, setRv, pmV, setPmV, pmGroup, setPmGroup }) {
  const group = r.isPamorph ? (PM_GROUPS.find(g => g.id === pmGroup) || PM_GROUPS[0]) : null;
  const list = r.isPamorph ? group.list : (r.variants?.length > 1 ? r.variants.map(v => ({ id: v, name: v })) : []);
  const isOn = (id) => r.isPamorph ? pmV === id : rv === id;
  const choose = (id) => r.isPamorph ? setPmV(pmV === id ? null : id) : setRv(rv === id ? null : id);
  return (
    <div className={`rd-orbit${r.isPamorph ? ' pm' : ''}`}>
      <div className="rd-core"><Sigil r={r} /><strong>{r.name.toUpperCase()}</strong></div>
      {(r.isPamorph || list.length > 0) && (
        <div className="rd-bloodlines">
          {r.isPamorph && (
            <div className="rd-tabs" role="tablist" aria-label="Bloodline groups">
              {PM_GROUPS.map(g => (
                <button key={g.id} type="button" role="tab" aria-selected={g.id === group.id}
                  className={g.id === group.id ? 'on' : ''} onClick={() => setPmGroup(g.id)}>
                  {g.label.toUpperCase()}<small>{g.list.length}</small>
                </button>
              ))}
            </div>
          )}
          <div className="rd-chips" key={group?.id || 'variants'}>
            {list.map((b, i) => (
              <button key={b.id} type="button" title={b.sub || undefined}
                className={`rd-variant${isOn(b.id) ? ' chosen' : ''}`}
                style={{ animationDelay: `${0.12 + i * 0.025}s` }}
                onClick={() => choose(b.id)}>{b.name}{r.isPamorph && <small className="rd-animal">{b.sub || '?'}</small>}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP RACE
// ═════════════════════════════════════════════════════════════════════════════
export default function StepRace({
  race, setRace, rv, setRv, pmV, setPmV,
  fn, setFn, ln, setLn, age, setAge, gender, setGender,
  portraitUrl, setPortraitUrl,
  generateBoons, goNext, goBack,
  magicTech = 0, willWhim = 0,
}) {
  const { isMobile } = useDevice();
  const { at, cols, boxes } = useMemo(() => layoutField(isMobile), [isMobile]);
  // 'field' → 'diving' → 'dive' → 'rising' → 'field'. Coming back to this step with a race chosen opens on it.
  const [phase, setPhase] = useState(race ? 'dive' : 'field');
  const [hover, setHover] = useState(null);
  const [pmGroup, setPmGroup] = useState(() => groupOf(pmV));
  // The signs are sized from the map (user, 2026-11-17): as large as 58px where there is room, down to 30px, so a
  // narrow window shrinks them instead of piling them on one another.
  const mapRef = useRef(null);
  const [mapSize, setMapSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = mapRef.current;
    if (!el) return undefined;
    const fit = () => setMapSize({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [phase]);
  const sign = mapSize.w ? Math.round(Math.max(30, Math.min(58, mapSize.w * (isMobile ? 0.11 : 0.048), mapSize.h * (isMobile ? 0.05 : 0.075)))) : 58;
  const roomy = mapSize.w >= 1150;
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (race) generateBoons(race, null, null);
  }, [race]);

  const r = RACES.find(x => x.id === race) || null;
  const lit = hover || (phase !== 'field' ? race : null);
  const origin = at[lit || race] || { x: 50, y: 50 };

  const choose = (x, groupId) => {
    if (x.id !== race) {
      setRace(x.id);
      setRv(x.variants?.[0] || null);
      setPmV(null);
    }
    if (x.isPamorph) setPmGroup(groupId || groupOf(pmV));
    setHover(groupId ? `group:${groupId}` : x.id);
    setPhase('diving');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPhase('dive'); setHover(null); }, 480);
  };
  const rise = () => {
    setPhase('rising');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase('field'), 330);
  };
  useEffect(() => {
    if (phase !== 'dive') return undefined;
    const onKey = (e) => { if (e.key === 'Escape' && !e.target.closest?.('input,textarea')) rise(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  // ── Names (unchanged generators) ──
  const namePool = race ? getNamePool(race, rv, pmV) : null;
  const genFirst = () => {
    if (!race) return;
    const preferredPool = getNamePool(race, rv, pmV);
    if (!preferredPool) return;
    let pool = [];
    if (gender === 'f') pool = preferredPool.f || [];
    else if (gender === 'm') pool = preferredPool.m || [];
    else pool = [...(preferredPool.m || []), ...(preferredPool.f || [])];
    if (!pool.length) pool = [...(preferredPool.m || []), ...(preferredPool.f || [])];
    if (pool.length) setFn(pick(pool));
  };
  const genLast = () => {
    if (!namePool) return;
    if (race === 'chronison') {
      const pool = NAMES.chronison[rv] || NAMES.chronison.default;
      if (pool?.s?.length) setLn(pick(pool.s));
      return;
    }
    if (namePool.s?.length) setLn(pick(namePool.s));
  };

  const canAdvance = !!race && !!fn;
  const showField = phase === 'field' || phase === 'diving' || phase === 'rising';
  const showDive = phase === 'dive' || phase === 'rising';
  const hovered = (() => {
    if (!hover) return null;
    if (hover.startsWith('group:')) {
      const g = PM_GROUPS.find(x => `group:${x.id}` === hover);
      if (!g) return null;
      return { key: hover, accent: accentOf(PAMORPH.tag), title: `PA'MORPH · ${g.label.toUpperCase()} BLOODLINES · ${g.list.length}`, text: g.list.map(b => b.sub ? `${b.name} (${b.sub})` : b.name).join(' · ') };
    }
    const x = RACES.find(y => y.id === hover);
    return x ? { key: x.id, accent: accentOf(x.tag), title: [x.name, x.sub, tagWord(x.tag)].filter(Boolean).join(' · ').toUpperCase(), text: x.desc } : null;
  })();
  const variantLabel = r?.isPamorph ? pmName(pmV) : (r?.variants?.length > 1 ? rv : null);

  return (
    <StepStage
      back={{ label: 'Back', onClick: goBack }}
      next={{ label: 'Belief', onClick: goNext, disabled: !canAdvance }}
      magicTech={magicTech} willWhim={willWhim}
    >
      <div className="rf" style={{ '--magic': COLORS.magicText, '--tech': COLORS.techText }}>
        {/* ── The field: two constellations, Humanoid and Pa'morph ── */}
        {showField && (
          <div className="rf-field">
            <div
              ref={mapRef}
              className={`rf-map${lit ? ' focusing' : ''}${phase === 'diving' ? ' away' : ''}${phase === 'rising' ? ' returning' : ''}${sign < 46 ? ' compact' : ''}`}
              style={{ transformOrigin: `${origin.x}% ${origin.y}%`, '--sign': `${sign}px` }}
            >
              <svg className="wz-dust" aria-hidden="true">
                {DUST.map((d, i) => <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.r} fill="#dfe3d2" opacity={d.o} />)}
              </svg>
              <svg className="rf-threads" aria-hidden="true">
                {[...cols.values()].flatMap(list => list.slice(1).map((x, i) => {
                  const a = at[list[i].id], b = at[x.id];
                  const on = lit === x.id || lit === list[i].id;
                  const px = (pt) => mapSize.w ? (pt.x / 100) * mapSize.w + (pt.side || 0) * sign * 0.62 : null;
                  return <line key={x.id} className={on ? 'lit' : ''} x1={px(a) ?? `${a.x}%`} y1={`${a.y}%`} x2={px(b) ?? `${b.x}%`} y2={`${b.y}%`} stroke={accentOf(x.tag)} />;
                }))}
                {PM_GROUPS.map(g => {
                  const a = at[PAMORPH.id], b = at[`group:${g.id}`];
                  const on = lit === PAMORPH.id || lit === `group:${g.id}`;
                  return <line key={g.id} className={on ? 'lit' : ''} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke={accentOf(PAMORPH.tag)} />;
                })}
                {!isMobile && <line className="rf-divide" x1="64.5%" y1="12%" x2="64.5%" y2="76%" />}
              </svg>
              {!isMobile && roomy && <div className="wz-caption"><small>THE PEOPLES OF SOTERIA</small><h2>Choose your race</h2></div>}
              {[['HUMANOID', 'THE PEOPLES', boxes.human], ["PA'MORPH", 'THE BEASTFOLK', boxes.beast]].map(([title, sub, box]) => (
                <div key={title} className="rf-boxtitle" style={{ left: `${box.x + box.w / 2}%`, top: `${box.y}%` }}><b>{title}</b><small>{sub}</small></div>
              ))}
              <div className="rf-axis" style={{ left: `${boxes.human.x + 3}%`, width: `${boxes.human.w - 6}%`, top: `${boxes.human.y + boxes.human.h + 2}%` }}><span>MAGIC</span><span>TECH</span></div>
              {RACES.map(x => (
                <button
                  key={x.id} type="button"
                  className={`rf-sign${lit === x.id ? ' lit' : ''}${race === x.id ? ' chosen' : ''}${x.isPamorph ? ' core' : ''}`}
                  style={{ left: `calc(${at[x.id].x}% + ${(at[x.id].side || 0) * sign * 0.62}px)`, top: `${at[x.id].y}%`, '--accent': accentOf(x.tag) }}
                  onMouseEnter={() => phase === 'field' && setHover(x.id)}
                  onMouseLeave={() => phase === 'field' && setHover(null)}
                  onFocus={() => phase === 'field' && setHover(x.id)}
                  onBlur={() => phase === 'field' && setHover(null)}
                  onClick={() => choose(x)}
                  aria-label={[x.name, x.sub].filter(Boolean).join(', ')}
                >
                  <Sigil r={x} />
                  <span className="rf-name">{x.name}{x.sub && <span className="rf-sub">{x.sub}</span>}</span>
                </button>
              ))}
              {PM_GROUPS.map(g => {
                const id = `group:${g.id}`;
                const on = race === PAMORPH.id && groupOf(pmV) === g.id && !!pmV;
                return (
                  <button
                    key={id} type="button"
                    className={`rf-sign group${lit === id ? ' lit' : ''}${on ? ' chosen' : ''}`}
                    style={{ left: `${at[id].x}%`, top: `${at[id].y}%`, '--accent': accentOf(PAMORPH.tag) }}
                    onMouseEnter={() => phase === 'field' && setHover(id)}
                    onMouseLeave={() => phase === 'field' && setHover(null)}
                    onFocus={() => phase === 'field' && setHover(id)}
                    onBlur={() => phase === 'field' && setHover(null)}
                    onClick={() => choose(PAMORPH, g.id)}
                    aria-label={`Pa'morph, ${g.label} bloodlines`}
                  >
                    <span className="rf-ring"><b>{g.list.length}</b></span>
                    <span className="rf-name">{g.label}<span className="rf-sub">bloodlines</span></span>
                  </button>
                );
              })}
            </div>
            {!isMobile && (
              <div className="wz-loreband">
                {hovered ? (
                  <div className="wz-lore" key={hovered.key} style={{ '--accent': hovered.accent }}>
                    <span>{hovered.title}</span>
                    <p>{hovered.text}</p>
                  </div>
                ) : (
                  <p className="wz-hint">Rest on a sign to read of its people. Choose one to go closer.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── The dive: one people, its variants, and the name ── */}
        {showDive && r && (
          <div className={`rd${phase === 'rising' ? ' leaving' : ''}`} style={{ '--accent': accentOf(r.tag) }}>
            {/* The people themselves, faint behind their sign: this variant (or bloodline) in the chosen gender (user, 2026-11-17). */}
            {(() => {
              const art = raceArtFor(r.id, r.isPamorph ? pmV : rv, gender);
              return art ? <div className="rd-art" key={art} style={{ backgroundImage: `url("${versioned(art)}")` }} aria-hidden="true" /> : null;
            })()}
            <button type="button" className="rd-back" onClick={rise}>← ALL PEOPLES</button>

            {isMobile || r.isPamorph || !(r.variants?.length > 1)
              ? <Chips r={r} rv={rv} setRv={setRv} pmV={pmV} setPmV={setPmV} pmGroup={pmGroup} setPmGroup={setPmGroup} />
              : <Orbit r={r} rv={rv} setRv={setRv} />}

            <div className="rd-card">
              <div className="rd-eyebrow">{[r.sub, r.isPamorph ? PM_ALL.find(b => b.id === pmV)?.sub : null, tagWord(r.tag)].filter(Boolean).join(' · ').toUpperCase()}</div>
              <h2>{r.name}{variantLabel ? <span style={{ color: 'var(--accent)', fontSize: '0.6em' }}> · {variantLabel}</span> : null}</h2>
              <p className="rd-tagline">{r.sub2}</p>
              <div className="wz-lore now" key={`${r.id}|${rv}|${pmV}`}><p>{resolveDesc(r, rv, pmV)}</p></div>
              <Traits raceId={r.id} rv={rv} pmV={pmV} />

              <div className="rd-form">
                <small>NAME YOUR CHARACTER</small>
                <div className="rd-seg" role="group" aria-label="Presented gender">
                  {[['m', 'Male'], ['f', 'Female'], ['n', 'Other']].map(([val, lbl]) => (
                    <button key={val} type="button" className={gender === val ? 'on' : ''} onClick={() => setGender(val)}>{lbl}</button>
                  ))}
                </div>
                <div className="rd-row">
                  <div className="rd-field">
                    <small>FIRST NAME *</small>
                    <div className="rd-input">
                      <input value={fn} onChange={e => setFn(e.target.value)} placeholder="First name…" autoComplete="off" inputMode="text" />
                      <button type="button" onClick={genFirst} title="Generate a first name">✦</button>
                    </div>
                  </div>
                  <div className="rd-field">
                    <small>{race === 'chronison' ? 'DESIGNATION' : 'LAST NAME / CLAN'}</small>
                    <div className="rd-input">
                      <input
                        value={ln}
                        onChange={e => race !== 'chronison' && setLn(e.target.value)}
                        readOnly={race === 'chronison'}
                        placeholder={race === 'chronison' ? 'Generate →' : 'Last name…'}
                        autoComplete="off" inputMode="text"
                      />
                      <button type="button" onClick={genLast} title="Generate a last name">✦</button>
                    </div>
                  </div>
                  <div className="rd-field">
                    <small>AGE</small>
                    <div className="rd-input">
                      <input value={age} onChange={e => setAge(e.target.value)} placeholder="Age" type="number" min="1" inputMode="numeric" autoComplete="off" />
                    </div>
                  </div>
                </div>
                <div className="rd-portrait">
                  <small style={{ display: 'block', fontFamily: 'Cinzel, Georgia, serif', fontSize: 9, letterSpacing: '1.6px', color: '#929b8d', marginBottom: 8 }}>PORTRAIT (OPTIONAL)</small>
                  <Suspense fallback={<div style={{ fontSize: 10, color: '#6f7f67' }}>Loading…</div>}>
                    <PortraitUpload
                      currentUrl={portraitUrl}
                      onUploaded={async (url) => {
                        setPortraitUrl(url);
                        await supabase.from('character_portraits').insert({ url, character_id: null });
                      }}
                      size={72}
                    />
                  </Suspense>
                </div>
                {!fn && <p className="rd-need">A first name is needed to go on to Belief.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </StepStage>
  );
}
