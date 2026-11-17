import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { useDevice } from './useDevice';
import {
  COLORS, RACES, PM_MAJ, PM_MIN, PM_AEON, PM_ASTRAL,
  NAMES, getNamePool, pick, RACE_VARIANT_DESCS,
  PAMORPH_LORE, getRacialTraits,
} from './constants';
import supabase from './lib/supabase';
import StepStage from './wizard/StepStage';
import './wizard/race.css';
const PortraitUpload = lazy(() => import('./PortraitUpload'));

// ═════════════════════════════════════════════════════════════════════════════
// STEP RACE (user, 2026-11-17)
// On the wizard's full-page stage, like the Class step's constellation: the peoples of Soteria are signs on the sky,
// set from Magic (left) to Tech (right) by each race's lean. Hovering one reads its lore a beat later, as the
// constellation does; choosing one dives in, where its variants circle it, its traits are read, and the character is
// named. The choices and what they set (race, rv, pmV, name, gender, age, portrait) are exactly as before.
// ═════════════════════════════════════════════════════════════════════════════

const raceIconSrc = (raceId) => raceId ? `/RaceIcons/${String(raceId).toLowerCase().replace(/[^a-z]/g, '')}.png` : null;
const accentOf = (tag) => tag === 'magic' ? COLORS.magicText : tag === 'tech' ? COLORS.techText : '#c4b389';
const tagWord = (tag) => tag === 'magic' ? 'Magic' : tag === 'tech' ? 'Tech' : 'Any path';
const PM_GROUPS = [['Major bloodlines', PM_MAJ], ['Minor bloodlines', PM_MIN], ['Aeon bloodlines', PM_AEON], ['Astral bloodlines', PM_ASTRAL]];
const pmName = (id) => [...PM_MAJ, ...PM_MIN, ...PM_AEON, ...PM_ASTRAL].find(b => b.id === id)?.name;

// ─── RACE DISPLAY HELPER ──────────────────────────────────────────────────────
export function getRaceDisplay(race, rv, pmV) {
  if (!race) return '';
  if (race === 'pamorph') {
    const all = [...PM_MAJ, ...PM_MIN];
    const bloodline = all.find(b => b.id === pmV);
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
function layoutField(isMobile) {
  const cols = new Map();
  RACES.forEach(r => { const lean = Math.max(-2, Math.min(2, Math.round(r.lean || 0))); if (!cols.has(lean)) cols.set(lean, []); cols.get(lean).push(r); });
  const at = {};
  const x0 = isMobile ? 11 : 14, dx = isMobile ? 19.5 : 18;
  const top = isMobile ? 16 : 19, span = isMobile ? 64 : 54;
  for (const [lean, list] of cols) {
    list.forEach((r, i) => {
      const nudge = list.length > 3 ? (i % 2 ? 1 : -1) * (isMobile ? 2 : 3.2) : 0;
      at[r.id] = { x: x0 + (lean + 2) * dx + nudge, y: top + (i + 0.5) * (span / list.length) };
    });
  }
  return { at, cols };
}
const DUST = (() => { const rnd = seeded(1729); return Array.from({ length: 110 }, () => ({ x: rnd() * 100, y: rnd() * 100, r: rnd() < 0.9 ? 0.6 : 1.1, o: 0.12 + rnd() * 0.35 })); })();

function Sigil({ r }) {
  const [failed, setFailed] = useState(false);
  const src = raceIconSrc(r.id);
  return (
    <span className="rf-ring">
      {src && !failed
        ? <img src={src} alt="" onError={() => setFailed(true)} />
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
          : <p className="wait">{raceId === 'pamorph' ? 'Choose a bloodline to see your active trait.' : 'Choose a variant to see your active trait.'}</p>}
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
          <circle className="dotted" cx={cx} cy={cy} r={92} />
          {chosen && <line x1={cx} y1={cy} x2={chosen.x} y2={chosen.y} />}
        </svg>
      )}
      <div className="rd-core"><Sigil r={r} /><strong>{r.name.toUpperCase()}</strong></div>
      {size.w > 0 && spots.map((s, i) => (
        <button key={s.v} type="button" className={`rd-variant${rv === s.v ? ' chosen' : ''}`}
          style={{ left: s.x, top: s.y, animationDelay: `${0.35 + i * 0.05}s` }}
          onClick={() => setRv(rv === s.v ? null : s.v)}>{s.v}</button>
      ))}
    </div>
  );
}

/** Phones, and Pa'morph's many bloodlines: the sign above, the choices in rows below it. */
function Chips({ r, rv, setRv, pmV, setPmV }) {
  const groups = r.isPamorph
    ? PM_GROUPS.filter(([, list]) => list.length)
    : (r.variants?.length > 1 ? [[null, r.variants.map(v => ({ id: v, name: v }))]] : []);
  const isOn = (id) => r.isPamorph ? pmV === id : rv === id;
  const choose = (id) => r.isPamorph ? setPmV(pmV === id ? null : id) : setRv(rv === id ? null : id);
  return (
    <div className={`rd-orbit${r.isPamorph ? ' pm' : ''}`}>
      <div className="rd-core"><Sigil r={r} /><strong>{r.name.toUpperCase()}</strong></div>
      {groups.length > 0 && (
        <div className="rd-bloodlines">
          {groups.map(([title, list]) => (
            <div className="rd-group" key={title || 'variants'}>
              {title && <small>{title.toUpperCase()}</small>}
              <div className="rd-chips">
                {list.map((b, i) => (
                  <button key={b.id} type="button" title={b.sub || undefined}
                    className={`rd-variant${isOn(b.id) ? ' chosen' : ''}`}
                    style={{ animationDelay: `${0.3 + i * 0.025}s` }}
                    onClick={() => choose(b.id)}>{b.name}</button>
                ))}
              </div>
            </div>
          ))}
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
  const { at, cols } = useMemo(() => layoutField(isMobile), [isMobile]);
  // 'field' → 'diving' → 'dive' → 'rising' → 'field'. Coming back to this step with a race chosen opens on it.
  const [phase, setPhase] = useState(race ? 'dive' : 'field');
  const [hover, setHover] = useState(null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (race) generateBoons(race, null, null);
  }, [race]);

  const r = RACES.find(x => x.id === race) || null;
  const lit = hover || (phase !== 'field' ? race : null);
  const origin = at[lit || race] || { x: 50, y: 50 };

  const choose = (x) => {
    if (x.id !== race) {
      setRace(x.id);
      setRv(x.variants?.[0] || null);
      setPmV(null);
    }
    setHover(x.id);
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
  const hovered = RACES.find(x => x.id === hover);
  const variantLabel = r?.isPamorph ? pmName(pmV) : (r?.variants?.length > 1 ? rv : null);

  return (
    <StepStage
      back={{ label: 'Back', onClick: goBack }}
      next={{ label: 'Belief', onClick: goNext, disabled: !canAdvance }}
      magicTech={magicTech} willWhim={willWhim}
    >
      <div className="rf" style={{ '--magic': COLORS.magicText, '--tech': COLORS.techText }}>
        {/* ── The field of peoples ── */}
        {showField && (
          <div
            className={`rf-field${lit ? ' focusing' : ''}${phase === 'diving' ? ' away' : ''}${phase === 'rising' ? ' returning' : ''}`}
            style={{ transformOrigin: `${origin.x}% ${origin.y}%` }}
          >
            <svg className="wz-dust" aria-hidden="true">
              {DUST.map((d, i) => <circle key={i} cx={`${d.x}%`} cy={`${d.y}%`} r={d.r} fill="#dfe3d2" opacity={d.o} />)}
            </svg>
            <svg className="rf-threads" aria-hidden="true">
              {[...cols.values()].flatMap(list => list.slice(1).map((x, i) => {
                const a = at[list[i].id], b = at[x.id];
                const on = lit === x.id || lit === list[i].id;
                return <line key={x.id} className={on ? 'lit' : ''} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} stroke={accentOf(x.tag)} />;
              }))}
            </svg>
            <div className="wz-caption"><small>THE PEOPLES OF SOTERIA</small><h2>Choose your race</h2></div>
            <div className="rf-axis"><span>MAGIC</span><span>TECH</span></div>
            {RACES.map(x => (
              <button
                key={x.id} type="button"
                className={`rf-sign${lit === x.id ? ' lit' : ''}${race === x.id ? ' chosen' : ''}`}
                style={{ left: `${at[x.id].x}%`, top: `${at[x.id].y}%`, '--accent': accentOf(x.tag) }}
                onMouseEnter={() => phase === 'field' && setHover(x.id)}
                onMouseLeave={() => phase === 'field' && setHover(null)}
                onFocus={() => phase === 'field' && setHover(x.id)}
                onBlur={() => phase === 'field' && setHover(null)}
                onClick={() => choose(x)}
                aria-label={`${x.name}, ${x.sub}`}
              >
                <Sigil r={x} />
                <span className="rf-name">{x.name}<span className="rf-sub">{x.sub}</span></span>
              </button>
            ))}
            <div className="wz-loreband">
              {hovered && !isMobile ? (
                <div className="wz-lore" key={hovered.id} style={{ '--accent': accentOf(hovered.tag) }}>
                  <span>{hovered.name.toUpperCase()} · {hovered.sub.toUpperCase()} · {tagWord(hovered.tag).toUpperCase()}</span>
                  <p>{hovered.desc}</p>
                </div>
              ) : (
                <p className="wz-hint">{isMobile ? 'Touch a sign to go closer.' : 'Rest on a sign to read of its people. Choose one to go closer.'}</p>
              )}
            </div>
          </div>
        )}

        {/* ── The dive: one people, its variants, and the name ── */}
        {showDive && r && (
          <div className={`rd${phase === 'rising' ? ' leaving' : ''}`} style={{ '--accent': accentOf(r.tag) }}>
            <button type="button" className="rd-back" onClick={rise}>← ALL PEOPLES</button>

            {isMobile || r.isPamorph || !(r.variants?.length > 1)
              ? <Chips r={r} rv={rv} setRv={setRv} pmV={pmV} setPmV={setPmV} />
              : <Orbit r={r} rv={rv} setRv={setRv} />}

            <div className="rd-card">
              <div className="rd-eyebrow">{r.sub.toUpperCase()} · {tagWord(r.tag).toUpperCase()}</div>
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
