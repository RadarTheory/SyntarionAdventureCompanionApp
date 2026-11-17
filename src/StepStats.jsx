import { useState, useRef, useCallback, useEffect } from 'react';
import { useDevice } from './useDevice';
import { COLORS, ALL_STATS, DEFAULT_STATS } from './constants';
import StepStage from './wizard/StepStage';
import AstragalTray from './AstragalTray';
import { loadOfficialFinishes } from './lib/diceFinishBundle.js';
import './wizard/stats.css';

// ═════════════════════════════════════════════════════════════════════════════
// STEP STATS (user, 2026-11-17)
// On the wizard's full-page stage: the eight stats are stars around a chart, Magic's four on the left half and
// Tech's on the right, each sitting as far out as its value, so the shape they draw is the character. Rolling,
// saving up to three sets, choosing a value and giving it to a stat all work exactly as before; manual entry too.
// ═════════════════════════════════════════════════════════════════════════════

// ─── DICE ─────────────────────────────────────────────────────────────────────
// Stats are rolled on the Astragal tray, the app's own physical dice (user, 2026-11-17): sixteen d4s, cast as two
// handfuls of eight (the tray takes up to ten at once), read in order as one 2d4 per stat. Where the tray can't run
// (no WebGL), the same 2d4 are drawn without the animation.
const roll2d4 = () => Math.ceil(Math.random() * 4) + Math.ceil(Math.random() * 4);
const rollSet = () => Array.from({ length: 8 }, () => 8 + roll2d4());
const fromDice = (faces) => Array.from({ length: 8 }, (_, i) => 8 + faces[i * 2] + faces[i * 2 + 1]);

// ─── THE CHART ────────────────────────────────────────────────────────────────
// Degrees clockwise from the top: Tech down the right half, Magic down the left.
const ANGLE = { will: 22.5, whim: 67.5, mind: 112.5, dream: 157.5, essence: 202.5, body: 247.5, soul: 292.5, spirit: 337.5 };
const radius = (v) => Math.max(18, Math.min(205, 70 + ((Number(v) || 8) - 8) * 12.5));
const at = (deg, r) => { const a = (deg * Math.PI) / 180; return { x: r * Math.sin(a), y: -r * Math.cos(a) }; };
const accent = (axis) => axis === 'magic' ? COLORS.magicText : COLORS.techText;

// What each stat is, read when resting on its star.
const STAT_LORE = {
  spirit:  'Presence and pull. How a room turns toward you, how a promise lands, how far your voice carries when it matters.',
  soul:    'Faith given weight. The strength of what you hold sacred, and how much of the unseen will answer you.',
  body:    'What the flesh can carry. Endurance, recovery, and the stubborn refusal to fall when you should.',
  essence: 'Quiet knowing. Reading the world, the weather and the wounded; sensing what moves beneath the surface.',
  will:    'Force of arm and intent. Lifting, breaking, holding the line when everything pushes back.',
  whim:    'Speed of hand and foot. Balance, reflex, and the quick step no one sees coming.',
  mind:    'Reason and recall. Study, craft, and the patient taking-apart of a problem.',
  dream:   'Where you mean to go. Drive, focus, and the shape of the future you are building toward.',
};

// ═════════════════════════════════════════════════════════════════════════════
// STEP STATS
// ═════════════════════════════════════════════════════════════════════════════
export default function StepStats({
  stats, setStats,
  statMode, setStatMode,
  goNext, goBack,
  magicTech = 0, willWhim = 0,
}) {
  const { isMobile } = useDevice();
  const [lit, setLit] = useState(null);
  // The wizard starts in 'buy', which has no panel of its own; it has always behaved as rolling, so show it as Roll.
  const mode = statMode === 'manual' ? 'manual' : 'roll';

  // ── Roll state ──
  const [savedSets, setSavedSets]     = useState([null, null, null]);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [activeSet, setActiveSet]     = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [assigned, setAssigned]       = useState({});
  const [committed, setCommitted]     = useState(false);

  // ── Manual state ──
  const [manualVals, setManualVals] = useState(
    Object.fromEntries(ALL_STATS.map(s => [s.key, String(stats[s.key])]))
  );

  // ── Roll ──
  const tray = useRef(null);
  const [trayReady, setTrayReady] = useState(false);
  const [casting, setCasting] = useState(false);
  const onTrayStatus = useCallback(({ ready }) => setTrayReady(!!ready), []);
  // The dice are the official Syntarion finish (user, 2026-11-17); the plain bone set only if it can't be loaded.
  const [skin, setSkin] = useState('bone');
  useEffect(() => {
    let live = true;
    loadOfficialFinishes()
      .then(finishes => { const own = Object.values(finishes || {}).find(f => f?.name === 'Syntarion'); if (live && own) setSkin(own); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  const doRoll = async () => {
    if (casting) return;
    setSelectedIdx(null);
    if (!trayReady || !tray.current) { setCurrentRoll(rollSet()); return; }
    setCasting(true);
    setCurrentRoll(null);
    try {
      const first = await tray.current.roll({ sides: 4, count: 8, skin });
      const second = await tray.current.roll({ sides: 4, count: 8, skin });
      const faces = [...(first?.values || []), ...(second?.values || [])].map(Number);
      setCurrentRoll(faces.length === 16 && faces.every(n => n >= 1 && n <= 4) ? fromDice(faces) : rollSet());
    } catch {
      setCurrentRoll(rollSet());
    } finally {
      setCasting(false);
    }
  };

  const saveRoll = () => {
    if (!currentRoll) return;
    const emptyIdx = savedSets.findIndex(s => s === null);
    if (emptyIdx === -1) return;
    setSavedSets(prev => {
      const next = [...prev];
      next[emptyIdx] = currentRoll;
      return next;
    });
    setCurrentRoll(null);
    setSelectedIdx(null);
  };

  const handleRollTap = (setIdx, rollIdx) => {
    if (activeSet !== null && activeSet !== setIdx) return;
    const alreadyAssigned = Object.values(assigned).includes(rollIdx);
    if (alreadyAssigned) return;
    setActiveSet(setIdx);
    setSelectedIdx(selectedIdx === rollIdx ? null : rollIdx);
  };

  const handleStatTap = (statKey) => {
    if (activeSet !== null && selectedIdx !== null) {
      const value = savedSets[activeSet][selectedIdx];
      setAssigned(prev => ({ ...prev, [statKey]: selectedIdx }));
      setStats(prev => ({ ...prev, [statKey]: value }));
      setSelectedIdx(null);
      return;
    }
    if (statKey in assigned) {
      const newAssigned = { ...assigned };
      delete newAssigned[statKey];
      setAssigned(newAssigned);
      setStats(prev => ({ ...prev, [statKey]: 8 }));
    }
  };

  const handleReset = () => {
    setSavedSets([null, null, null]);
    setCurrentRoll(null);
    setActiveSet(null);
    setSelectedIdx(null);
    setAssigned({});
    setStats({ ...DEFAULT_STATS });
    setCommitted(false);
    setManualVals(Object.fromEntries(ALL_STATS.map(s => [s.key, '8'])));
  };

  // ── Manual ──
  const handleManual = (key, val) => {
    setManualVals(prev => ({ ...prev, [key]: val }));
    const n = parseInt(val);
    if (!isNaN(n)) setStats(prev => ({ ...prev, [key]: Math.max(1, Math.min(20, n)) }));
  };

  const assignedCount = Object.keys(assigned).length;
  const allAssigned   = assignedCount === 8;
  const slotsUsed     = savedSets.filter(Boolean).length;
  const canRoll       = activeSet === null && slotsUsed < 3 && !casting;
  const canSave       = !!currentRoll && canRoll;
  const canAdvance    = mode === 'manual' || allAssigned;
  const statTotal     = ALL_STATS.reduce((sum, s) => sum + (stats[s.key] || 8), 0);
  const holding       = mode === 'roll' && activeSet !== null && selectedIdx !== null;

  // ── The chart ──
  const pts = ALL_STATS.map(s => ({ s, ...at(ANGLE[s.key] ?? 0, radius(stats[s.key])) }));
  const shape = [...pts].sort((a, b) => (ANGLE[a.s.key] ?? 0) - (ANGLE[b.s.key] ?? 0)).map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const litStat = ALL_STATS.find(s => s.key === lit);

  return (
    <StepStage
      back={{ label: 'Class', onClick: goBack }}
      next={{ label: 'Backstory', onClick: goNext, disabled: !canAdvance }}
      magicTech={magicTech} willWhim={willWhim}
    >
      <div className="sf">
        <div className="sf-chart">
          <div className="wz-caption"><small>THE SHAPE OF YOU</small><h2>Your stats</h2></div>
          <svg viewBox="-280 -262 560 524" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Stats chart">
            <defs>
              <linearGradient id="sf-fill" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor={COLORS.magic} stopOpacity=".28" />
                <stop offset="1" stopColor={COLORS.tech} stopOpacity=".28" />
              </linearGradient>
              <linearGradient id="sf-edge" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0" stopColor={COLORS.magicText} />
                <stop offset="1" stopColor={COLORS.techText} />
              </linearGradient>
            </defs>
            {[8, 12, 16].map(v => <circle key={v} className={`sf-ring${v === 12 ? ' mid' : ''}`} r={radius(v)} />)}
            {[8, 12, 16].map(v => <text key={v} className="sf-ringlabel" x={4} y={-radius(v) - 4}>{v}</text>)}
            {ALL_STATS.map(s => { const e = at(ANGLE[s.key], 205); return <line key={s.key} className="sf-spoke" x1={0} y1={0} x2={e.x} y2={e.y} />; })}
            <line x1={0} y1={-232} x2={0} y2={232} stroke="#ffffff14" strokeDasharray="2 6" />
            <text className="sf-half" x={-262} y={-238} fill={COLORS.magicText}>MAGIC</text>
            <text className="sf-half" x={262} y={-238} fill={COLORS.techText} textAnchor="end">TECH</text>
            <polygon className="sf-shape" points={shape} fill="url(#sf-fill)" stroke="url(#sf-edge)" />
            {pts.map(({ s, x, y }) => {
              const isAssigned = s.key in assigned;
              const can = mode === 'roll' && ((holding && !isAssigned) || isAssigned);
              const label = at(ANGLE[s.key], 232);
              const anchor = label.x < -6 ? 'end' : label.x > 6 ? 'start' : 'middle';
              return (
                <g
                  key={s.key}
                  className={`sf-node${holding && !isAssigned ? ' can' : ''}${can && isAssigned ? ' undo' : ''}${lit === s.key ? ' lit' : ''}${isAssigned || mode === 'manual' ? ' set' : ''}`}
                  style={{ '--accent': accent(s.axis) }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.label} ${stats[s.key] || 8}`}
                  onMouseEnter={() => setLit(s.key)}
                  onMouseLeave={() => setLit(null)}
                  onFocus={() => setLit(s.key)}
                  onBlur={() => setLit(null)}
                  onClick={() => can && handleStatTap(s.key)}
                  onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && can) { e.preventDefault(); handleStatTap(s.key); } }}
                >
                  <circle className="target" cx={x} cy={y} r={13} />
                  <circle className="dot" cx={x} cy={y} r={isAssigned ? 7 : 5.5} />
                  <circle cx={x} cy={y} r={22} fill="transparent" />
                  <text className="name" x={label.x} y={label.y} textAnchor={anchor} dominantBaseline="middle">
                    {s.label.toUpperCase()}<tspan className="val" dx={8}>{stats[s.key] || 8}</tspan>
                  </text>
                  <text className="equiv" x={label.x} y={label.y + 15} textAnchor={anchor} dominantBaseline="middle">{s.equiv}</text>
                </g>
              );
            })}
          </svg>
          {!isMobile && (
            <div className="wz-loreband">
              {litStat ? (
                <div className="wz-lore" key={litStat.key} style={{ '--accent': accent(litStat.axis) }}>
                  <span>{litStat.label.toUpperCase()} · {litStat.equiv.toUpperCase()} · {litStat.axis === 'magic' ? 'MAGIC' : 'TECH'}</span>
                  <p>{STAT_LORE[litStat.key]}</p>
                </div>
              ) : (
                <p className="wz-hint">{holding ? 'Choose a star on the chart to give it this value.' : 'Rest on a star to read what it measures.'}</p>
              )}
            </div>
          )}
        </div>

        <div className="sf-panel">
          {isMobile && (
            <div className="wz-loreband">
              {litStat
                ? <div className="wz-lore now" key={litStat.key} style={{ '--accent': accent(litStat.axis) }}><span>{litStat.label.toUpperCase()} · {litStat.equiv.toUpperCase()}</span><p>{STAT_LORE[litStat.key]}</p></div>
                : holding && <p className="wz-hint">Touch a star on the chart to give it this value.</p>}
            </div>
          )}
          {mode === 'roll' && <div hidden><AstragalTray ref={tray} onStatus={onTrayStatus} /></div>}
          <h3>Set your stats</h3>
          <p>Each stat starts at 8. Roll 2d4 per stat (adds 2–8). Save up to 3 sets and assign from the best one.</p>

          <div className="sf-seg" role="group" aria-label="How to set stats">
            {[['roll', 'Roll'], ['manual', 'Manual entry']].map(([id, lbl]) => (
              <button key={id} type="button" className={mode === id ? 'on' : ''} onClick={() => { setStatMode(id); handleReset(); }}>{lbl}</button>
            ))}
          </div>

          {mode === 'roll' && (
            <>
              <div className="sf-actions">
                <button type="button" className="sf-btn gold" onClick={doRoll} disabled={!canRoll}>{casting ? 'THE DICE ARE CAST…' : '✦ ROLL 8×(2D4)'}</button>
                {currentRoll && canSave && <button type="button" className="sf-btn" onClick={saveRoll}>SAVE THIS SET</button>}
                {(slotsUsed > 0 || assignedCount > 0) && <button type="button" className="sf-btn" onClick={handleReset}>RESET</button>}
              </div>

              {currentRoll && (
                <>
                  <span className="sf-label">CURRENT ROLL · SAVE TO KEEP</span>
                  <div className="sf-motes" key={currentRoll.join('-')}>
                    {currentRoll.map((val, i) => <button key={i} type="button" className="sf-mote" disabled style={{ animationDelay: `${i * 0.05}s` }}>+{val - 8}</button>)}
                  </div>
                </>
              )}

              {savedSets.map((set, setIdx) => {
                if (!set) return null;
                const isActive = activeSet === setIdx;
                const isLocked = activeSet !== null && activeSet !== setIdx;
                const setTotal = set.reduce((a, b) => a + b, 0);
                return (
                  <div key={setIdx} className={`sf-set${isActive ? ' active' : ''}${isLocked ? ' locked' : ''}`}>
                    <header>
                      <span>SET {setIdx + 1}{isActive ? ' · ACTIVE' : isLocked ? ' · LOCKED' : ''}</span>
                      <span>TOTAL <b>{setTotal}</b></span>
                    </header>
                    <div className="sf-motes">
                      {set.map((val, rollIdx) => {
                        const used = isActive && Object.values(assigned).includes(rollIdx);
                        const sel = isActive && selectedIdx === rollIdx;
                        return (
                          <button
                            key={rollIdx} type="button"
                            className={`sf-mote${sel ? ' sel' : ''}${used ? ' used' : ''}`}
                            disabled={isLocked || used}
                            onClick={() => handleRollTap(setIdx, rollIdx)}
                          >{val}</button>
                        );
                      })}
                    </div>
                    {isActive && selectedIdx !== null && <p className="sf-note">{savedSets[activeSet][selectedIdx]} chosen. Now touch a star on the chart to give it this value.</p>}
                    {isActive && <p className="sf-note">{assignedCount} / 8 assigned{assignedCount ? ' · touch an assigned star to take its value back' : ''}</p>}
                  </div>
                );
              })}

              {slotsUsed === 0 && !currentRoll && (
                <div className="sf-empty">Roll your stats. Save up to 3 sets, then assign from your favourite.</div>
              )}

              {allAssigned && !committed && <button type="button" className="sf-btn gold" onClick={() => setCommitted(true)}>✦ COMMIT STATS</button>}
              {committed && <p className="sf-committed">✓ STATS COMMITTED</p>}
            </>
          )}

          {mode === 'manual' && (
            <div className="sf-manual">
              {ALL_STATS.map(s => (
                <label key={s.key} style={{ '--accent': accent(s.axis) }} onMouseEnter={() => setLit(s.key)} onMouseLeave={() => setLit(null)}>
                  <span>{s.label.toUpperCase()}<small>{s.equiv}</small></span>
                  <input type="number" min="1" max="20" inputMode="numeric" value={manualVals[s.key]} onChange={e => handleManual(s.key, e.target.value)} />
                </label>
              ))}
            </div>
          )}

          <div className="sf-total">TOTAL<b>{statTotal}</b></div>
        </div>
      </div>
    </StepStage>
  );
}
