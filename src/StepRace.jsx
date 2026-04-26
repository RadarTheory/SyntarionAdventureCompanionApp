import { useState, useEffect } from 'react';
import { useDevice } from './useDevice';
import {
  COLORS, RACES, PM_MAJ, PM_MIN,
  NAMES, getNamePool, pick, RACE_VARIANT_DESCS,
} from './constants';

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const label = {
  fontSize: 8,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: COLORS.muted,
  fontFamily: "'Cinzel', serif",
  display: 'block',
  marginBottom: 6,
};

const inp = (extra = {}) => ({
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 6,
  padding: '9px 12px',
  color: COLORS.text,
  fontSize: 13,
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Georgia, serif',
  inputMode: 'text',
  ...extra,
});

const tagColor = (tag) => {
  if (tag === 'magic') return { bg: COLORS.magicBg, color: COLORS.magicText, border: COLORS.magic };
  if (tag === 'tech')  return { bg: COLORS.techBg,  color: COLORS.techText,  border: COLORS.tech  };
  return { bg: 'rgba(160,160,160,0.12)', color: '#b0b0b0', border: 'rgba(160,160,160,0.3)' };
};

// ═════════════════════════════════════════════════════════════════════════════
// STEP RACE
// Props: all from Wizard stepProps
// ═════════════════════════════════════════════════════════════════════════════
export default function StepRace({
  race, setRace, rv, setRv, pmV, setPmV,
  fn, setFn, ln, setLn, age, setAge, gender, setGender,
  generateBoons, goNext, goBack,
}) {
  const { isMobile, isDesktop } = useDevice();
  const [expandedRace, setExpandedRace] = useState(race || null);

  // When race changes, generate boons reactively
  useEffect(() => {
    if (race) generateBoons(race, null, null);
  }, [race]);

  const selectedRaceData = RACES.find(r => r.id === race);

  // ── Name generation ──
  const namePool = race ? getNamePool(race, rv, pmV) : null;

  const genFirst = () => {
  if (!race) return;

  // Prefer the exact selected race/variant name pool first
  const preferredPool = getNamePool(race, rv, pmV);

  if (!preferredPool) return;

  let pool = [];

  if (gender === 'f') {
    pool = preferredPool.f || [];
  } else if (gender === 'm') {
    pool = preferredPool.m || [];
  } else {
    pool = [
      ...(preferredPool.m || []),
      ...(preferredPool.f || []),
    ];
  }

  // If the selected gender pool is empty, fall back to both race pools
  if (!pool.length) {
    pool = [
      ...(preferredPool.m || []),
      ...(preferredPool.f || []),
    ];
  }

  if (pool.length) setFn(pick(pool));
};
  const genLast = () => {
  if (!namePool) return;
  // Chronison last names are always serial designations
  if (race === 'chronison') {
    const pool = NAMES.chronison[rv] || NAMES.chronison.default;
    if (pool?.s?.length) setLn(pick(pool.s));
    return;
  }
  if (namePool.s?.length) setLn(pick(namePool.s));
};

  // ── Race card click ──
  const handleRaceClick = (r) => {
    if (expandedRace === r.id) {
      setExpandedRace(null);
      return;
    }
    setRace(r.id);
    setRv(null);
    setPmV(null);
    setExpandedRace(r.id);
  };

  const cols = isDesktop ? 4 : 2;
  const canAdvance = !!race && !!fn;

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>

      {/* ── Section title ── */}
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: isMobile ? 18 : 22,
        fontWeight: 700,
        color: COLORS.text,
        letterSpacing: '0.06em',
        marginBottom: 4,
      }}>Choose your Race</div>
      <div style={{
        fontSize: 11,
        color: COLORS.muted,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        marginBottom: 20,
        lineHeight: 1.6,
      }}>
        Tap a race to expand. Select a variant if applicable, then name your character.
      </div>

      {/* ── Race grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        justifyItems: 'stretch',
        gap: 8,
        marginBottom: 20,
        maxWidth: isDesktop ? 840 : '100%',
      }}>
        {RACES.map(r => {
          const isSelected = race === r.id;
          const isExpanded = expandedRace === r.id;
          const tc = tagColor(r.tag);

          return (
            <div
              key={r.id}
              style={{ gridColumn: isExpanded ? `1 / -1` : 'auto' }}
            >
              {/* Card */}
              <div
                onClick={() => handleRaceClick(r)} 
                style={{
                  background: isSelected ? 'rgba(240,238,235,0.06)' : COLORS.card,
                  border: `1.5px solid ${isSelected ? COLORS.borderMid : COLORS.border}`,
                  borderRadius: 8,
                  height: '100%',
                  padding: '11px 13px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? `0 0 0 1px ${COLORS.borderMid}` : 'none',
                }}
              >
                {/* Card header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: COLORS.text,
                      fontFamily: "'Cinzel', serif",
                      marginBottom: 2,
                      letterSpacing: '0.04em',
                    }}>{r.name}</div>
                    <div style={{
                      fontSize: 9,
                      color: COLORS.muted,
                      marginBottom: 4,
                    }}>{r.sub}</div>
                    <div style={{
                      fontSize: 8,
                      color: COLORS.dim,
                      lineHeight: 1.4,
                      marginBottom: 6,
                    }}>{r.sub2}</div>
                    {/* Tag chip */}
                    <span style={{
                      display: 'inline-block',
                      fontSize: 8,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: 20,
                      background: tc.bg,
                      color: tc.color,
                      border: `1px solid ${tc.border}`,
                      fontFamily: "'Cinzel', serif",
                    }}>
                      {r.tag === 'magic' ? 'Magic' : r.tag === 'tech' ? 'Tech' : 'Any'}
                    </span>
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 10, color: COLORS.muted, marginLeft: 6 }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  )}
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTop: `1px solid ${COLORS.border}`,
                    }}
                  >
                    {/* Description */}
                      <p style={{
                      fontSize: 12,
                      color: COLORS.textSub,
                      fontFamily: 'Georgia, serif',
                      fontStyle: 'italic',
                      lineHeight: 1.75,
                      margin: '0 0 14px',
}}>
  {(() => {
                      const variantDescs = RACE_VARIANT_DESCS[r.id];
                      if (!variantDescs) return r.desc;
                      const selectedVariant = r.isPamorph ? null : rv;
                      if (selectedVariant && variantDescs[selectedVariant]) return variantDescs[selectedVariant];
                      return variantDescs.default || r.desc;
  })()}
</p>

                    {/* Variants (non-Pa'morph) */}
                    {r.variants?.length > 0 && !r.isPamorph && (
                      <div style={{ marginBottom: 14 }}>
                        <span style={label}>Variant</span>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${Math.min(r.variants.length, isMobile ? 2 : 4)}, 1fr)`,
                          gap: 6,
                        }}>
                          {r.variants.map(v => (
                            <div
                              key={v}
                              onClick={() => setRv(rv === v ? null : v)}
                              style={{
                                background: rv === v ? 'rgba(240,238,235,0.08)' : 'transparent',
                                border: `1px solid ${rv === v ? COLORS.borderMid : COLORS.border}`,
                                borderRadius: 6,
                                padding: '7px 10px',
                                cursor: 'pointer',
                                fontSize: 11,
                                color: rv === v ? COLORS.text : COLORS.muted,
                                fontFamily: 'Georgia, serif',
                                textAlign: 'center',
                                transition: 'all 0.12s',
                              }}
                            >
                              {v}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pa'morph bloodlines */}
                    {r.isPamorph && (
                      <div style={{ marginBottom: 14 }}>
                        <span style={label}>Major bloodlines</span>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
                          gap: 6,
                          marginBottom: 10,
                        }}>
                          {PM_MAJ.map(p => (
                            <div
                              key={p.id}
                              onClick={() => setPmV(pmV === p.id ? null : p.id)}
                              style={{
                                background: pmV === p.id ? 'rgba(240,238,235,0.08)' : 'transparent',
                                border: `1px solid ${pmV === p.id ? COLORS.borderMid : COLORS.border}`,
                                borderRadius: 6,
                                padding: '7px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.12s',
                              }}
                            >
                              <div style={{ fontSize: 11, color: pmV === p.id ? COLORS.text : COLORS.muted, fontFamily: 'Georgia, serif' }}>{p.name}</div>
                              <div style={{ fontSize: 9, color: COLORS.dim, marginTop: 2 }}>{p.sub}</div>
                            </div>
                          ))}
                        </div>

                        <span style={label}>Minor bloodlines</span>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`,
                          gap: 6,
                        }}>
                          {PM_MIN.map(p => (
                            <div
                              key={p.id}
                              onClick={() => setPmV(pmV === p.id ? null : p.id)}
                              style={{
                                background: pmV === p.id ? 'rgba(240,238,235,0.08)' : 'transparent',
                                border: `1px solid ${pmV === p.id ? COLORS.borderMid : COLORS.border}`,
                                borderRadius: 6,
                                padding: '7px 10px',
                                cursor: 'pointer',
                                transition: 'all 0.12s',
                              }}
                            >
                              <div style={{ fontSize: 11, color: pmV === p.id ? COLORS.text : COLORS.muted, fontFamily: 'Georgia, serif' }}>{p.name}</div>
                              <div style={{ fontSize: 9, color: COLORS.dim, marginTop: 2 }}>{p.sub}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Name & Identity (only shows after race selected) ── */}
      {race && (
        <div style={{
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: isMobile ? '16px' : '20px 24px',
          marginBottom: 24,
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.muted,
            marginBottom: 16,
          }}>
            Name your character
          </div>

          {/* Gender */}
          <div style={{ marginBottom: 16 }}>
            <span style={label}>Presented gender</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['m','Male'],['f','Female'],['n','Other']].map(([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => setGender(val)}
                  style={{
                    background: gender === val ? 'rgba(240,238,235,0.08)' : 'transparent',
                    border: `1px solid ${gender === val ? COLORS.borderMid : COLORS.border}`,
                    borderRadius: 6,
                    padding: '7px 16px',
                    cursor: 'pointer',
                    fontSize: 11,
                    color: gender === val ? COLORS.text : COLORS.muted,
                    fontFamily: 'Georgia, serif',
                    transition: 'all 0.12s',
                  }}
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Name fields */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
            gap: 14,
          }}>
            {/* First name */}
            <div>
              <span style={label}>First name *</span>
              <button
                onClick={genFirst}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'transparent',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLORS.muted,
                  fontFamily: "'Cinzel', serif",
                  marginBottom: 6,
                  textAlign: 'center',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.borderMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                ✦ Generate
              </button>
              <input
                style={inp()}
                value={fn}
                onChange={e => setFn(e.target.value)}
                placeholder="Enter first name…"
                inputMode="text"
                autoComplete="off"
              />
            </div>

            {/* Last name */}
            <div>
              <span style={label}>Last name / Clan</span>
              <button
                onClick={genLast}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'transparent',
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: '6px 10px',
                  cursor: 'pointer',
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLORS.muted,
                  fontFamily: "'Cinzel', serif",
                  marginBottom: 6,
                  textAlign: 'center',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.borderMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                ✦ Generate
              </button>
              <input
                style={inp({
                  opacity: race === 'chronison' ? 0.7 : 1,
                  cursor: race === 'chronison' ? 'default' : 'text',
                })}
                value={ln}
                onChange={e => race !== 'chronison' && setLn(e.target.value)}
                placeholder={race === 'chronison' ? 'Generate a designation →' : 'Enter last name…'}
                inputMode="text"
                autoComplete="off"
                readOnly={race === 'chronison'}
/>
            </div>

            {/* Age */}
            <div>
              <span style={label}>Age</span>
              {/* Spacer to align with generate buttons */}
              <div style={{ height: 33, marginBottom: 6 }} />
              <input
                style={inp()}
                value={age}
                onChange={e => setAge(e.target.value)}
                placeholder="Enter Age…"
                type="number"
                min="1"
                inputMode="numeric"
                autoComplete="off"
              />
            </div>
          </div>

          {/* Required field note */}
          {!fn && (
            <div style={{
              marginTop: 12,
              fontSize: 10,
              color: COLORS.muted,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}>
              * First name is required to continue.
            </div>
          )}
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTop: `1px solid ${COLORS.border}`,
      }}>
        <button
          onClick={goBack}
          style={{
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
          }}
        >
          ← Back
        </button>

        <button
          onClick={goNext}
          disabled={!canAdvance}
          style={{
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
          }}
        >
          Belief →
        </button>
      </div>
    </div>
  );
}
