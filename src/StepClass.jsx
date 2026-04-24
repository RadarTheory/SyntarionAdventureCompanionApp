import { useState, useEffect } from 'react';
import { useDevice } from './useDevice';
import { COLORS, CLASSES } from './constants';

// ═════════════════════════════════════════════════════════════════════════════
// STEP CLASS
// ═════════════════════════════════════════════════════════════════════════════
export default function StepClass({
  cp, setCp, cid, setCid,
  generateBoons, race,
  goNext, goBack,
}) {
  const { isMobile, isDesktop } = useDevice();
  const [expandedClass, setExpandedClass] = useState(cid || null);

  const allMagic = CLASSES.magic;
  const allTech  = CLASSES.tech;

  // When class changes, regenerate boons with correct path
  useEffect(() => {
    if (cid && cp && race) generateBoons(race, cp, cid);
  }, [cid, cp]);

  const handleClassClick = (cls, path) => {
    if (expandedClass === cls.id) {
      // Already expanded — select it
      setCid(cls.id);
      setCp(path);
      setExpandedClass(null);
    } else {
      setExpandedClass(cls.id);
    }
  };

  const handleSelect = (cls, path, e) => {
    e.stopPropagation();
    setCid(cls.id);
    setCp(path);
    setExpandedClass(null);
  };

  const cols = isDesktop ? 4 : 2;
  const canAdvance = !!cid;

  const ClassCard = ({ cls, path }) => {
    const isSelected = cid === cls.id;
    const isExpanded = expandedClass === cls.id;

    const color  = path === 'magic' ? COLORS.magic  : COLORS.tech;
    const dimCol = path === 'magic' ? COLORS.magicDim : COLORS.techDim;
    const bg     = path === 'magic' ? COLORS.magicBg  : COLORS.techBg;
    const text   = path === 'magic' ? COLORS.magicText : COLORS.techText;

    return (
      <div style={{ gridColumn: isExpanded ? '1 / -1' : 'auto' }}>
        <div
          onClick={() => handleClassClick(cls, path)}
          style={{
            background: isSelected ? bg : isExpanded ? `${bg}55` : COLORS.card,
            border: `1.5px solid ${isSelected ? color : isExpanded ? dimCol : COLORS.border}`,
            borderRadius: 8,
            padding: '11px 13px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            height: '100%',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 12,
                fontWeight: 700,
                color: isSelected ? text : COLORS.text,
                marginBottom: 3,
                letterSpacing: '0.04em',
              }}>{cls.name}</div>

              <div style={{
                fontSize: 9,
                color: COLORS.muted,
                marginBottom: 4,
              }}>{cls.path}</div>

              {/* Discipline chip */}
              <span style={{
                display: 'inline-block',
                fontSize: 8,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 20,
                background: bg,
                color: text,
                border: `1px solid ${color}`,
                fontFamily: "'Cinzel', serif",
                marginBottom: 4,
              }}>{cls.disc}</span>

              <div style={{
                fontSize: 8,
                color: COLORS.dim,
                marginTop: 2,
              }}>
                {cls.stats}
              </div>
            </div>

            {isSelected && (
              <span style={{
                fontSize: 8,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: text,
                fontFamily: "'Cinzel', serif",
                background: bg,
                border: `1px solid ${color}`,
                borderRadius: 4,
                padding: '2px 6px',
                flexShrink: 0,
                marginLeft: 6,
              }}>Chosen</span>
            )}
          </div>

          {/* Expanded */}
          {isExpanded && (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              {/* Progression path */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}>
                {/* Base */}
                <span style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: 11,
                  fontWeight: 700,
                  color: text,
                  background: bg,
                  border: `1px solid ${color}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                }}>{cls.name}</span>

                <span style={{ color: COLORS.dim, fontSize: 10 }}>→</span>

                {/* T2 */}
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 11,
                  color: COLORS.textSub,
                  fontStyle: 'italic',
                }}>{cls.t2}</span>

                <span style={{ color: COLORS.dim, fontSize: 10 }}>→</span>

                {/* T3 */}
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 11,
                  color: COLORS.muted,
                  fontStyle: 'italic',
                }}>{cls.t3}</span>
              </div>

              {/* Stats */}
              <div style={{
                fontSize: 10,
                color: COLORS.muted,
                fontFamily: 'Georgia, serif',
                marginBottom: 14,
              }}>
                Primary stats: <span style={{ color: text, fontWeight: 700 }}>{cls.stats}</span>
              </div>

              {/* Meter impact note */}
              <div style={{
                fontSize: 10,
                color: path === 'magic' ? COLORS.magicText : COLORS.techText,
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                marginBottom: 14,
                padding: '6px 10px',
                background: bg,
                borderRadius: 6,
                border: `1px solid ${color}`,
              }}>
                {path === 'magic'
                  ? `Pulls the Magic | Tech meter toward Magic (${cls.magicTechNudge})`
                  : `Pulls the Magic | Tech meter toward Tech (+${cls.magicTechNudge})`
                }
              </div>

              <button
                onClick={e => handleSelect(cls, path, e)}
                style={{
                  background: bg,
                  border: `1px solid ${color}`,
                  borderRadius: 6,
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 10,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: text,
                  transition: 'all 0.12s',
                }}
              >
                Choose {cls.name}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>

      {/* Title */}
      <div style={{
        fontFamily: "'Cinzel', serif",
        fontSize: isMobile ? 18 : 22,
        fontWeight: 700,
        color: COLORS.text,
        letterSpacing: '0.06em',
        marginBottom: 4,
      }}>Choose your Class</div>
      <div style={{
        fontSize: 11,
        color: COLORS.muted,
        fontFamily: 'Georgia, serif',
        fontStyle: 'italic',
        marginBottom: 24,
        lineHeight: 1.6,
      }}>
        Tap a class to expand and see its progression path. Your choice shifts the Magic | Tech meter.
      </div>

      {/* Current selection */}
      {cid && (() => {
        const cls = [...allMagic, ...allTech].find(c => c.id === cid);
        const color = cp === 'magic' ? COLORS.magicText : COLORS.techText;
        const bg    = cp === 'magic' ? COLORS.magicBg   : COLORS.techBg;
        const border= cp === 'magic' ? COLORS.magic      : COLORS.tech;
        return (
          <div style={{
            marginBottom: 20,
            padding: '10px 14px',
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 8,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: 12,
            color,
          }}>
            {cls?.name} · {cls?.disc} · {cp === 'magic' ? 'Magic path' : 'Tech path'}
          </div>
        );
      })()}

      {/* Magic path */}
      <div style={{
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.magicText,
        fontFamily: "'Cinzel', serif",
        marginBottom: 10,
        display: 'block',
      }}>Magic path</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
        marginBottom: 24,
        alignItems: 'stretch',
      }}>
        {allMagic.map(cls => (
          <ClassCard key={cls.id} cls={cls} path="magic" />
        ))}
      </div>

      {/* Tech path */}
      <div style={{
        fontSize: 9,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: COLORS.techText,
        fontFamily: "'Cinzel', serif",
        marginBottom: 10,
        display: 'block',
      }}>Tech path</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 8,
        marginBottom: 24,
        alignItems: 'stretch',
      }}>
        {allTech.map(cls => (
          <ClassCard key={cls.id} cls={cls} path="tech" />
        ))}
      </div>

      {/* Navigation */}
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
          ← Belief
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
          Stats →
        </button>
      </div>
    </div>
  );
}
