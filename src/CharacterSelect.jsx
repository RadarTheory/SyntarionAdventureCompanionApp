import { useDevice } from './useDevice';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const CAMPAIGNS = [
  { id: 'I',   name: 'Campaign I',   subtitle: 'Veinrunner'          },
  { id: 'II',  name: 'Campaign II',  subtitle: 'The Keys of Aerithos' },
  { id: 'III', name: 'Campaign III', subtitle: 'Prints from Gamdon'   },
  { id: 'IV',  name: 'Campaign IV',  subtitle: 'Veyline'              },
];

// ═════════════════════════════════════════════════════════════════════════════
// CHARACTER SELECT
//
// Props:
//   savedChars  — array of character objects from Supabase
//   onSelect    — fn(char) called when player picks a character
//   onCreate    — fn() called when player wants to create a new character
//   onHome      — fn() back to Landing
// ═════════════════════════════════════════════════════════════════════════════
export default function CharacterSelect({ savedChars = [], onSelect, onCreate, onHome }) {
  const { isMobile } = useDevice();

  const ink = '#1a1714';
  const bg  = '#f0eeeb';

  const getCampaignLabel = (campId) => {
    const c = CAMPAIGNS.find(x => x.id === campId);
    return c ? `${c.name} · ${c.subtitle}` : null;
  };

  const hasChars = savedChars.length > 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, serif',
      position: 'relative',
    }}>

      {/* ── HEADER ── */}
      <div style={{
        padding: isMobile ? '20px 20px 0' : '28px 40px 0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button onClick={onHome} style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: "'Cinzel', serif",
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(26,23,20,0.35)',
          padding: '4px 0',
        }}>← Home</button>
      </div>

      {/* ── TITLE ── */}
      <div style={{
        padding: isMobile ? '32px 20px 24px' : '40px 40px 28px',
        borderBottom: '1px solid rgba(26,23,20,0.08)',
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(26,23,20,0.35)',
          marginBottom: 10,
        }}>
          {hasChars ? 'Your adventurers' : 'No adventurers found'}
        </div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: isMobile ? 22 : 28,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: ink,
          lineHeight: 1.1,
        }}>
          {hasChars ? 'ADVENTURER' : 'CREATE AN'}
          <br />
          {hasChars ? 'SELECT' : 'ADVENTURER'}
        </div>
      </div>

      {/* ── CHARACTER LIST ── */}
      <div style={{
        flex: 1,
        padding: isMobile ? '20px 20px' : '28px 40px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>

        {hasChars ? (
          <>
            {savedChars.map((char, i) => (
              <CharCard
                key={char.id || i}
                char={char}
                isMobile={isMobile}
                getCampaignLabel={getCampaignLabel}
                onSelect={onSelect}
              />
            ))}

            {/* Create new — secondary, at the bottom */}
            <div style={{ marginTop: 8 }}>
              <button onClick={onCreate} style={{
                width: '100%',
                background: 'transparent',
                border: '1px solid rgba(26,23,20,0.18)',
                borderRadius: 4,
                padding: isMobile ? '13px 20px' : '14px 24px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.18s ease',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,23,20,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ textAlign: 'left' }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    letterSpacing: '0.22em',
                    color: ink,
                    marginBottom: 2,
                  }}>CREATE AN ADVENTURER</div>
                  <div style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 10,
                    color: 'rgba(26,23,20,0.4)',
                  }}>Begin a new character</div>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(26,23,20,0.22)' }}>→</div>
              </button>
            </div>
          </>
        ) : (
          /* No characters — single prominent create button */
          <button onClick={onCreate} style={{
            width: '100%',
            background: '#2a2420',
            border: '1px solid #2a2420',
            borderRadius: 4,
            padding: isMobile ? '18px 20px' : '20px 24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(26,23,20,0.12)',
            transition: 'all 0.18s ease',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#1a1714'}
            onMouseLeave={e => e.currentTarget.style.background = '#2a2420'}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: isMobile ? 13 : 15,
                fontWeight: 700,
                letterSpacing: '0.22em',
                color: '#f0eeeb',
                marginBottom: 2,
              }}>CREATE AN ADVENTURER</div>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontSize: 10,
                color: 'rgba(240,238,235,0.45)',
              }}>Your journey in Soteria begins here</div>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(240,238,235,0.35)' }}>→</div>
          </button>
        )}
      </div>

      {/* Cinzel font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CHARACTER CARD
// ═════════════════════════════════════════════════════════════════════════════
function CharCard({ char, isMobile, getCampaignLabel, onSelect }) {
  const ink = '#1a1714';
  const campLabel = char.campaign ? getCampaignLabel(char.campaign) : null;

  // Build the meta line: Race · Class
  const raceLine = [char.race, char.cls || char.cid].filter(Boolean).join(' · ');

  return (
    <button
      onClick={() => onSelect(char)}
      style={{
        width: '100%',
        background: '#ffffff',
        border: '1px solid rgba(26,23,20,0.1)',
        borderRadius: 6,
        padding: isMobile ? '16px 18px' : '18px 22px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(26,23,20,0.06)',
        transition: 'all 0.18s ease',
        textAlign: 'left',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(26,23,20,0.10)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(26,23,20,0.06)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* NAME */}
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: isMobile ? 15 : 17,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: ink,
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {char.name || `${char.fn || ''} ${char.ln || ''}`.trim() || 'Unnamed'}
        </div>

        {/* RACE · CLASS */}
        {raceLine && (
          <div style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: isMobile ? 11 : 12,
            color: 'rgba(26,23,20,0.5)',
            marginBottom: campLabel ? 4 : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {raceLine}
          </div>
        )}

        {/* CAMPAIGN */}
        {campLabel && (
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(26,23,20,0.35)',
            marginTop: 2,
          }}>
            {campLabel}
          </div>
        )}

      </div>

      {/* ARROW */}
      <div style={{
        fontSize: 14,
        color: 'rgba(26,23,20,0.2)',
        marginLeft: 16,
        flexShrink: 0,
      }}>→</div>
    </button>
  );
}
