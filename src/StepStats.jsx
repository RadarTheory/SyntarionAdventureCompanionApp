import { useState } from 'react';
import { useDevice } from './useDevice';
import { COLORS, ALL_STATS, DEFAULT_STATS } from './constants';

// ─── DICE ─────────────────────────────────────────────────────────────────────
const roll2d4 = () => Math.ceil(Math.random() * 4) + Math.ceil(Math.random() * 4);
const rollSet = () => Array.from({ length: 8 }, () => 8 + roll2d4());

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const magicStats = ALL_STATS.filter(s => s.axis === 'magic');
const techStats  = ALL_STATS.filter(s => s.axis === 'tech');
const axisColor  = (axis) => axis === 'magic' ? COLORS.magic     : COLORS.tech;
const axisText   = (axis) => axis === 'magic' ? COLORS.magicText : COLORS.techText;
const axisBg     = (axis) => axis === 'magic' ? COLORS.magicBg   : COLORS.techBg;

// ═════════════════════════════════════════════════════════════════════════════
// STEP STATS
// ═════════════════════════════════════════════════════════════════════════════
export default function StepStats({
  stats, setStats,
  statMode, setStatMode,
  goNext, goBack,
}) {
  const { isMobile } = useDevice();

  // ── Roll state ──
  const [savedSets, setSavedSets]     = useState([null, null, null]);
  const [currentRoll, setCurrentRoll] = useState(null);
  const [activeSet, setActiveSet]     = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [assigned, setAssigned]       = useState({});
  const [committed, setCommitted] = useState(false);

  // ── Manual state ──
  const [manualVals, setManualVals] = useState(
    Object.fromEntries(ALL_STATS.map(s => [s.key, String(stats[s.key])]))
  );

  // ── Roll ──
  const doRoll = () => {
    setCurrentRoll(rollSet());
    setSelectedIdx(null);
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
    const alreadyAssigned = activeSet === setIdx && Object.values(assigned).includes(rollIdx);
    if (alreadyAssigned) return;
    setActiveSet(setIdx);
    setSelectedIdx(selectedIdx === rollIdx ? null : rollIdx);
  };

  const handleStatTap = (statKey) => {
  // If already assigned, unassign it
  if (statKey in assigned && selectedIdx === null) {
    const newAssigned = { ...assigned };
    delete newAssigned[statKey];
    setAssigned(newAssigned);
    setStats(prev => ({ ...prev, [statKey]: 8 }));
    return;
  }
  if (activeSet === null || selectedIdx === null) return;
  const value = savedSets[activeSet][selectedIdx];
  const [committed, setCommitted] = useState(false);
  setAssigned(prev => ({ ...prev, [statKey]: selectedIdx }));
  setStats(prev => ({ ...prev, [statKey]: value }));
  setSelectedIdx(null);
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
  const canRoll       = activeSet === null && slotsUsed < 3;
  const canSave       = !!currentRoll && canRoll;
  const canAdvance    = statMode === 'manual' || allAssigned;
  const statTotal     = ALL_STATS.reduce((sum, s) => sum + (stats[s.key] || 8), 0);

  // ── Stat block ──
  const StatBlock = ({ statDef }) => {
    const { key, label, equiv, axis } = statDef;
    const val        = stats[key] || 8;
    const isAssigned = key in assigned;
    const isTarget   = statMode === 'roll' && activeSet !== null && selectedIdx !== null && !isAssigned;
    const col        = axisColor(axis);
    const pct        = Math.round(((val - 8) / 8) * 100);

    return (
      <div
        onClick={() => statMode === 'roll' && isTarget && handleStatTap(key)}
        style={{
          background: isAssigned ? axisBg(axis) : isTarget ? 'rgba(240,238,235,0.04)' : COLORS.card,
          border: `1.5px solid ${isAssigned ? col : isTarget ? COLORS.borderMid : COLORS.border}`,
          borderRadius: 8,
          padding: '10px 12px',
          cursor: statMode === 'roll' && isTarget ? 'pointer' : 'default',
          transition: 'all 0.15s ease',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 11,
              fontWeight: 700,
              color: isAssigned ? axisText(axis) : COLORS.text,
              letterSpacing: '0.04em',
            }}>{label}</div>
            <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>{equiv}</div>
          </div>

          {statMode === 'roll' ? (
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 20,
              fontWeight: 800,
              color: isAssigned ? axisText(axis) : COLORS.muted,
              minWidth: 28,
              textAlign: 'right',
            }}>{val}</div>
          ) : (
            <input
              type="number"
              min="1"
              max="20"
              value={manualVals[key]}
              onChange={e => handleManual(key, e.target.value)}
              inputMode="numeric"
              style={{
                width: 52,
                textAlign: 'center',
                fontSize: 16,
                fontWeight: 800,
                color: axisText(axis),
                background: axisBg(axis),
                border: `1.5px solid ${col}`,
                borderRadius: 6,
                padding: '4px 6px',
                outline: 'none',
                fontFamily: "'Cinzel', serif",
              }}
            />
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: COLORS.dim, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: col,
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}/>
        </div>

        {statMode === 'roll' && isTarget && (
          <div style={{
            marginTop: 5,
            fontSize: 8,
            color: COLORS.borderMid,
            fontFamily: "'Cinzel', serif",
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>Tap to assign</div>
        )}
      </div>
    );
  };

  return (
    <div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');`}</style>

      {/* Title */}
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: isMobile ? 18 : 22,
        fontWeight: 700,
        color: COLORS.text,
        letterSpacing: '0.06em',
        marginBottom: 4,
      }}>Set your Stats</div>
      <div style={{
        fontSize: 11,
        color: COLORS.muted,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        marginBottom: 20,
        lineHeight: 1.6,
      }}>
        Each stat starts at 8. Roll 2d4 per stat (adds 2–8). Save up to 3 sets and assign from the best one.
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[['roll','Roll Stats'],['manual','Manual Entry']].map(([id, lbl]) => (
          <button key={id} onClick={() => { setStatMode(id); handleReset(); }} style={{
            background: statMode === id ? 'rgba(240,238,235,0.08)' : 'transparent',
            border: `1px solid ${statMode === id ? COLORS.borderMid : COLORS.border}`,
            borderRadius: 6,
            padding: '8px 18px',
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif",
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: statMode === id ? COLORS.text : COLORS.muted,
            transition: 'all 0.12s',
          }}>{lbl}</button>
        ))}
      </div>

      {/* ── ROLL MODE ── */}
      {statMode === 'roll' && (
        <div>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <button onClick={doRoll} disabled={!canRoll} style={{
              background: canRoll ? COLORS.surface : 'transparent',
              border: `1px solid ${canRoll ? COLORS.borderMid : COLORS.border}`,
              borderRadius: 6,
              padding: '10px 20px',
              cursor: canRoll ? 'pointer' : 'default',
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: canRoll ? COLORS.text : COLORS.dim,
            }}>✦ Roll 8×(2d4)</button>

            {currentRoll && canSave && (
              <button onClick={saveRoll} style={{
                background: COLORS.magicBg,
                border: `1px solid ${COLORS.magic}`,
                borderRadius: 6,
                padding: '10px 20px',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: 10,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.magicText,
              }}>Save this set</button>
            )}

            {(slotsUsed > 0 || assignedCount > 0) && (
              <button onClick={handleReset} style={{
                background: 'transparent',
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: '10px 16px',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: COLORS.muted,
              }}>Reset</button>
            )}
          </div>

          {/* Current unsaved roll preview */}
          {currentRoll && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 8,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: COLORS.muted,
                fontFamily: "'Cinzel', serif",
                marginBottom: 8,
              }}>Current roll — save to keep</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {currentRoll.map((val, i) => (
                  <div key={i} style={{
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: '8px 12px',
                    minWidth: 42,
                    textAlign: 'center',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 16,
                    fontWeight: 800,
                    color: COLORS.muted,
                  }}>+{val - 8}</div>
                ))}
              </div>
            </div>
          )}

          {/* Saved sets */}
          {savedSets.map((set, setIdx) => {
            if (!set) return null;
            const isActive = activeSet === setIdx;
            const isLocked = activeSet !== null && activeSet !== setIdx;
            const setTotal = set.reduce((a, b) => a + b, 0);

            return (
              <div key={setIdx} style={{
                marginBottom: 14,
                padding: '14px 16px',
                background: isActive ? 'rgba(240,238,235,0.04)' : 'transparent',
                border: `1px solid ${isActive ? COLORS.borderMid : COLORS.border}`,
                borderRadius: 10,
                opacity: isLocked ? 0.35 : 1,
                transition: 'all 0.2s ease',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: isActive ? COLORS.text : COLORS.muted,
                  }}>
                    Set {setIdx + 1}
                    {isActive && <span style={{ color: COLORS.magic, marginLeft: 8 }}>● Active</span>}
                    {isLocked && <span style={{ color: COLORS.dim, marginLeft: 8 }}>Locked</span>}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif' }}>
                    Total: <span style={{ color: COLORS.text, fontWeight: 700 }}>{setTotal}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {set.map((val, rollIdx) => {
                    const isAssignedRoll = isActive && Object.values(assigned).includes(rollIdx);
                    const isSelected     = isActive && selectedIdx === rollIdx;
                    return (
                      <div
                        key={rollIdx}
                        onClick={() => !isLocked && handleRollTap(setIdx, rollIdx)}
                        style={{
                          background: isAssignedRoll ? COLORS.dim : isSelected ? COLORS.surface : COLORS.card,
                          border: `1.5px solid ${isSelected ? COLORS.borderMid : COLORS.border}`,
                          borderRadius: 6,
                          padding: '8px 12px',
                          minWidth: 42,
                          textAlign: 'center',
                          cursor: isLocked || isAssignedRoll ? 'default' : 'pointer',
                          opacity: isAssignedRoll ? 0.4 : 1,
                          transition: 'all 0.12s ease',
                          fontFamily: "'Cinzel', serif",
                          fontSize: 16,
                          fontWeight: 800,
                          color: isSelected ? COLORS.text : COLORS.textSub,
                        }}
                      >{val}</div>
                    );
                  })}
                </div>

                {isActive && selectedIdx !== null && (
                  <div style={{ marginTop: 10, fontSize: 10, color: COLORS.borderMid, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                    Value <strong>{savedSets[activeSet][selectedIdx]}</strong> selected — tap a stat to assign it.
                  </div>
                )}

                {isActive && (
                  <div style={{ marginTop: 8, fontSize: 9, color: COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {assignedCount} / 8 assigned
                  </div>
                )}
              </div>
            );
          })}

          {/* Empty state */}
          {slotsUsed === 0 && !currentRoll && (
            <div style={{
              padding: 20,
              textAlign: 'center',
              color: COLORS.dim,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 12,
              border: `1px dashed ${COLORS.border}`,
              borderRadius: 8,
              marginBottom: 20,
            }}>
              Roll your stats above. Save up to 3 sets, then assign from your favourite.
            </div>
          )}
        </div>
      )}

      {/* ── STAT GRID (both modes) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 14,
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
            Magic / Spiritual
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {magicStats.map(s => <StatBlock key={s.key} statDef={s} />)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.techText, fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
            Tech / Mortal
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {techStats.map(s => <StatBlock key={s.key} statDef={s} />)}
          </div>
        </div>
      </div>

      {/* Total */}
      {statMode === 'roll' && allAssigned && !committed && (
  <div style={{
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 20,
  }}>
    <button
      onClick={() => setCommitted(true)}
      style={{
        background: COLORS.magicBg,
        border: `1px solid ${COLORS.magic}`,
        borderRadius: 6,
        padding: '10px 24px',
        cursor: 'pointer',
        fontFamily: "'Cinzel', serif",
        fontSize: 10,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: COLORS.magicText,
        fontWeight: 700,
      }}
    >✦ Commit Stats</button>
  </div>
)}

{committed && (
  <div style={{
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 20,
    fontSize: 10,
    color: COLORS.magicText,
    fontFamily: "'Cinzel', serif",
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  }}>✓ Stats Committed</div>
)}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        <button onClick={goBack} style={{
          background: 'transparent',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 4,
          padding: '10px 20px',
          color: COLORS.muted,
          cursor: 'pointer',
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>← Class</button>

        <button onClick={goNext} disabled={!canAdvance} style={{
          background: canAdvance ? COLORS.surface : 'transparent',
          border: `1px solid ${canAdvance ? COLORS.borderMid : COLORS.border}`,
          borderRadius: 4,
          padding: '10px 24px',
          color: canAdvance ? COLORS.text : COLORS.dim,
          cursor: canAdvance ? 'pointer' : 'default',
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          transition: 'all 0.15s',
        }}>Backstory →</button>
      </div>
    </div>
  );
}
