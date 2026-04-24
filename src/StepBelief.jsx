import { useState } from 'react';
import { useDevice } from './useDevice';
import { COLORS, GODS, SPIRITS, UNAFFILIATED } from './constants';

// ─── STYLE HELPERS ────────────────────────────────────────────────────────────
const sectionLabel = {
  fontSize: 8,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontFamily: "'Cinzel', serif",
  display: 'block',
  marginBottom: 10,
  marginTop: 20,
};

// ═════════════════════════════════════════════════════════════════════════════
// STEP BELIEF
// ═════════════════════════════════════════════════════════════════════════════
export default function StepBelief({
  beliefType, setBeliefType,
  beliefSub, setBeliefSub,
  deity, setDeity,
  spirit, setSpirit,
  goNext, goBack,
}) {
  const { isMobile, isDesktop } = useDevice();
  const [expandedItem, setExpandedItem] = useState(null);

  // ── Type selector ──
  const handleTypeSelect = (type) => {
    setBeliefType(type);
    setDeity(null);
    setSpirit(null);
    setBeliefSub(null);
    setExpandedItem(null);
  };

  // ── God selection ──
  const handleGodClick = (name) => {
    if (expandedItem === name) {
      // Already expanded — select it and collapse
      setDeity(name);
      setExpandedItem(null);
    } else {
      setExpandedItem(name);
    }
  };

  // ── Spirit selection ──
  const handleSpiritClick = (name) => {
    if (expandedItem === name) {
      setSpirit(name);
      setExpandedItem(null);
    } else {
      setExpandedItem(name);
    }
  };

  // ── Unaffiliated selection ──
  const handleUnaffiliatedClick = (id) => {
    setBeliefSub(id);
    setExpandedItem(null);
  };

  const cols = isDesktop ? 4 : 2;
  const canAdvance = beliefType !== null;

  // Current selection label
  const selectionLabel = () => {
    if (!beliefType) return null;
    if (beliefType === 'god') return deity ? `${deity}` : 'Choose a god below';
    if (beliefType === 'spirit') return spirit ? `${spirit}` : 'Choose a spirit below';
    if (beliefType === 'unaffiliated') return beliefSub
      ? UNAFFILIATED.find(u => u.id === beliefSub)?.label
      : 'Choose below';
    return null;
  };

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
      }}>Choose your Belief</div>
      <div style={{
        fontSize: 11,
        color: COLORS.muted,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        marginBottom: 20,
        lineHeight: 1.6,
      }}>
        A patron god, a spirit, or no affiliation. Tap any entry to read more before committing.
      </div>

      {/* ── Belief type selector ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8,
        marginBottom: 24,
      }}>
        {[
          { id: 'god',          label: 'Patron God',    sub: 'Sanctus',  color: COLORS.deity,       bg: COLORS.deityBg,       border: COLORS.deity       },
          { id: 'spirit',       label: 'Spirit',         sub: 'Sacral',   color: COLORS.spirit,      bg: COLORS.spiritBg,      border: COLORS.spirit      },
          { id: 'unaffiliated', label: 'Unaffiliated',   sub: '',         color: COLORS.unaffiliated, bg: COLORS.unaffiliatedBg, border: COLORS.unaffiliated },
        ].map(t => {
          const isActive = beliefType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => handleTypeSelect(t.id)}
              style={{
                background: isActive ? t.bg : 'transparent',
                border: `1.5px solid ${isActive ? t.border : COLORS.border}`,
                borderRadius: 8,
                padding: isMobile ? '12px 8px' : '14px 12px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: isMobile ? 11 : 13,
                fontWeight: 700,
                color: isActive ? t.color : COLORS.muted,
                letterSpacing: '0.06em',
                marginBottom: t.sub ? 4 : 0,
              }}>{t.label}</div>
              {t.sub && (
                <div style={{
                  fontSize: 9,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: isActive ? t.color : COLORS.dim,
                  opacity: 0.7,
                  fontFamily: "'Cinzel', serif",
                }}>{t.sub}</div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Selection display ── */}
      {selectionLabel() && (
        <div style={{
          marginBottom: 16,
          padding: '10px 14px',
          background: beliefType === 'god' ? COLORS.deityBg : beliefType === 'spirit' ? COLORS.spiritBg : COLORS.unaffiliatedBg,
          border: `1px solid ${beliefType === 'god' ? COLORS.deity : beliefType === 'spirit' ? COLORS.spirit : COLORS.unaffiliated}`,
          borderRadius: 8,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 12,
          color: beliefType === 'god' ? COLORS.deityText : beliefType === 'spirit' ? COLORS.spiritText : COLORS.unaffiliatedText,
        }}>
          {selectionLabel()}
        </div>
      )}

      {/* ── GODS ── */}
      {beliefType === 'god' && GODS.map(group => (
        <div key={group.label}>
          <span style={{ ...sectionLabel, color: COLORS.deityText }}>{group.label}</span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 8,
            marginBottom: 16,
            alignItems: 'stretch',
          }}>
            {group.list.map(g => {
              const isSelected = deity === g.name;
              const isExpanded = expandedItem === g.name;
              return (
                <div
                  key={g.name}
                  style={{ gridColumn: isExpanded ? '1 / -1' : 'auto' }}
                >
                  <div
                    onClick={() => handleGodClick(g.name)}
                    style={{
                      background: isSelected ? COLORS.deityBg : isExpanded ? 'rgba(168,85,247,0.06)' : COLORS.card,
                      border: `1.5px solid ${isSelected ? COLORS.deity : isExpanded ? COLORS.deityDim : COLORS.border}`,
                      borderRadius: 8,
                      padding: '11px 13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      height: '100%',
                    }}
                  >
                    {/* Card header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: 12,
                          fontWeight: 700,
                          color: isSelected ? COLORS.deityText : COLORS.text,
                          marginBottom: 3,
                          letterSpacing: '0.04em',
                        }}>{g.name}</div>
                        <div style={{
                          fontSize: 9,
                          color: COLORS.muted,
                          marginBottom: 4,
                        }}>{g.domain}</div>
                        <div style={{
                          fontSize: 8,
                          color: COLORS.dim,
                          fontStyle: 'italic',
                        }}>{g.affil}</div>
                      </div>
                      {isSelected && (
                        <span style={{
                          fontSize: 8,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: COLORS.deityText,
                          fontFamily: "'Cinzel', serif",
                          background: COLORS.deityBg,
                          border: `1px solid ${COLORS.deity}`,
                          borderRadius: 4,
                          padding: '2px 6px',
                          flexShrink: 0,
                          marginLeft: 6,
                        }}>Chosen</span>
                      )}
                    </div>

                    {/* Expanded description */}
                    {isExpanded && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <p style={{
                          fontSize: 12,
                          color: COLORS.textSub,
                          fontFamily: 'Georgia, serif',
                          fontStyle: 'italic',
                          lineHeight: 1.75,
                          margin: '0 0 12px',
                        }}>{g.desc}</p>
                        <button
                          onClick={() => { setDeity(g.name); setExpandedItem(null); }}
                          style={{
                            background: COLORS.deityBg,
                            border: `1px solid ${COLORS.deity}`,
                            borderRadius: 6,
                            padding: '8px 18px',
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: COLORS.deityText,
                          }}
                        >
                          Choose {g.name}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── SPIRITS ── */}
      {beliefType === 'spirit' && SPIRITS.map(group => (
        <div key={group.label}>
          <span style={{ ...sectionLabel, color: COLORS.spiritText }}>{group.label}</span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 8,
            marginBottom: 16,
            alignItems: 'stretch',
          }}>
            {group.list.map(s => {
              const isSelected = spirit === s.name;
              const isExpanded = expandedItem === s.name;
              return (
                <div
                  key={s.name}
                  style={{ gridColumn: isExpanded ? '1 / -1' : 'auto' }}
                >
                  <div
                    onClick={() => handleSpiritClick(s.name)}
                    style={{
                      background: isSelected ? COLORS.spiritBg : isExpanded ? 'rgba(249,115,22,0.06)' : COLORS.card,
                      border: `1.5px solid ${isSelected ? COLORS.spirit : isExpanded ? COLORS.spiritDim : COLORS.border}`,
                      borderRadius: 8,
                      padding: '11px 13px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      height: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: 12,
                          fontWeight: 700,
                          color: isSelected ? COLORS.spiritText : COLORS.text,
                          marginBottom: 3,
                          letterSpacing: '0.04em',
                        }}>{s.name}</div>
                        <div style={{
                          fontSize: 9,
                          color: COLORS.muted,
                          marginBottom: 4,
                        }}>{s.domain}</div>
                        <div style={{
                          fontSize: 8,
                          color: COLORS.dim,
                          fontStyle: 'italic',
                        }}>{s.affil}</div>
                      </div>
                      {isSelected && (
                        <span style={{
                          fontSize: 8,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: COLORS.spiritText,
                          fontFamily: "'Cinzel', serif",
                          background: COLORS.spiritBg,
                          border: `1px solid ${COLORS.spirit}`,
                          borderRadius: 4,
                          padding: '2px 6px',
                          flexShrink: 0,
                          marginLeft: 6,
                        }}>Chosen</span>
                      )}
                    </div>

                    {isExpanded && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: `1px solid ${COLORS.border}`,
                        }}
                      >
                        <p style={{
                          fontSize: 12,
                          color: COLORS.textSub,
                          fontFamily: 'Georgia, serif',
                          fontStyle: 'italic',
                          lineHeight: 1.75,
                          margin: '0 0 12px',
                        }}>{s.desc}</p>
                        <button
                          onClick={() => { setSpirit(s.name); setExpandedItem(null); }}
                          style={{
                            background: COLORS.spiritBg,
                            border: `1px solid ${COLORS.spirit}`,
                            borderRadius: 6,
                            padding: '8px 18px',
                            cursor: 'pointer',
                            fontFamily: "'Cinzel', serif",
                            fontSize: 10,
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: COLORS.spiritText,
                          }}
                        >
                          Choose {s.name}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── UNAFFILIATED ── */}
      {beliefType === 'unaffiliated' && (
        <div>
          <span style={{ ...sectionLabel, color: COLORS.unaffiliatedText }}>Choose your stance</span>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(4, cols * 2)}, 1fr)`,
            gap: 8,
            marginBottom: 16,
          }}>
            {UNAFFILIATED.map(u => {
              const isSelected = beliefSub === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => handleUnaffiliatedClick(u.id)}
                  style={{
                    background: isSelected ? COLORS.unaffiliatedBg : COLORS.card,
                    border: `1.5px solid ${isSelected ? COLORS.unaffiliated : COLORS.border}`,
                    borderRadius: 8,
                    padding: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    height: '100%',
                  }}
                >
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 12,
                    fontWeight: 700,
                    color: isSelected ? COLORS.unaffiliatedText : COLORS.text,
                    marginBottom: 6,
                    letterSpacing: '0.04em',
                  }}>{u.label}</div>
                  <div style={{
                    fontSize: 11,
                    color: COLORS.muted,
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                  }}>{u.desc}</div>
                  {isSelected && (
                    <div style={{
                      marginTop: 8,
                      fontSize: 8,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: COLORS.unaffiliatedText,
                      fontFamily: "'Cinzel', serif",
                    }}>Selected</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        marginTop: 8,
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
          ← Race
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
          Class →
        </button>
      </div>
    </div>
  );
}
