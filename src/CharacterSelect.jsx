import { useDevice } from './useDevice';

const CAMPAIGNS = [
  { id: 'I',   name: 'Campaign I',   subtitle: 'Veinrunner'          },
  { id: 'II',  name: 'Campaign II',  subtitle: 'The Keys of Aerithos' },
  { id: 'III', name: 'Campaign III', subtitle: 'Prints from Gamdon'   },
  { id: 'IV',  name: 'Campaign IV',  subtitle: 'Veyline'              },
];

function playTheme(darkMode) {
  return darkMode ? {
    bg: '#14110c',
    ink: '#f0eeeb',
    title: '#f7efe0',
    muted: 'rgba(240,238,235,0.66)',
    faint: 'rgba(240,238,235,0.44)',
    line: 'rgba(240,238,235,0.16)',
    card: '#1b1712',
    cardAlt: 'rgba(31,26,19,0.92)',
    cardBorder: 'rgba(200,168,74,0.25)',
    cardHover: 'rgba(200,168,74,0.08)',
    shadow: '0 8px 24px rgba(0,0,0,0.32)',
    shadowHover: '0 12px 32px rgba(0,0,0,0.42)',
    primaryBg: '#1f1a13',
    primaryHover: '#2d261c',
    primaryBorder: 'rgba(200,168,74,0.64)',
    primarySub: 'rgba(226,207,145,0.72)',
    arrow: 'rgba(226,207,145,0.74)',
  } : {
    bg: '#e4e0da',
    ink: '#171310',
    title: '#1a1714',
    muted: 'rgba(26,23,20,0.72)',
    faint: 'rgba(26,23,20,0.56)',
    line: 'rgba(26,23,20,0.18)',
    card: '#fbfaf7',
    cardAlt: '#f4f1eb',
    cardBorder: 'rgba(26,23,20,0.18)',
    cardHover: 'rgba(26,23,20,0.035)',
    shadow: '0 2px 10px rgba(26,23,20,0.05)',
    shadowHover: '0 8px 24px rgba(26,23,20,0.14)',
    primaryBg: '#1a1714',
    primaryHover: '#100d0b',
    primaryBorder: 'rgba(26,23,20,0.3)',
    primarySub: 'rgba(240,238,235,0.58)',
    arrow: 'rgba(26,23,20,0.52)',
  };
}

export default function CharacterSelect({ savedChars = [], onSelect, onCreate, onHome, onClaim, darkMode = false }) {
  const { isMobile } = useDevice();
  const theme = playTheme(darkMode);
  const hasChars = savedChars.length > 0;

  const getCampaignLabel = (campId) => {
    const c = CAMPAIGNS.find(x => x.id === campId);
    return c ? `${c.name} - ${c.subtitle}` : null;
  };

  const actionButton = (label, sub, onClick, primary = false) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        background: primary ? theme.primaryBg : 'transparent',
        border: `1px solid ${primary ? theme.primaryBorder : theme.cardBorder}`,
        borderRadius: 8,
        padding: primary ? (isMobile ? '16px 18px' : '18px 28px') : (isMobile ? '13px 16px' : '14px 24px'),
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.18s ease',
        textAlign: 'left',
        boxShadow: primary ? theme.shadow : 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = primary ? theme.primaryHover : theme.cardHover;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = primary ? theme.primaryBg : 'transparent';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: primary ? (isMobile ? 13 : 15) : (isMobile ? 11 : 12),
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: primary ? '#f0eeeb' : theme.title,
          marginBottom: 2,
        }}>{label}</div>
        <div style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 10,
          color: primary ? theme.primarySub : theme.faint,
        }}>{sub}</div>
      </div>
      <div style={{ fontSize: 14, color: primary ? theme.primarySub : theme.arrow, marginLeft: 16 }}>&rarr;</div>
    </button>
  );

  return (
    <div style={{
      minHeight: '100svh',
      background: theme.bg,
      color: theme.ink,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, serif',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      <div style={{
        padding: isMobile ? 'calc(16px + env(safe-area-inset-top)) 18px 0' : '28px 40px 0',
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
          color: theme.muted,
          padding: '4px 0',
        }}>&larr; Home</button>
      </div>

      <div style={{
        padding: isMobile ? '28px 18px 22px' : '40px 40px 28px',
        borderBottom: `1px solid ${theme.line}`,
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: theme.faint,
          marginBottom: 10,
        }}>
          {hasChars ? 'Your adventurers' : 'No adventurers found'}
        </div>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: isMobile ? 22 : 28,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: theme.title,
          lineHeight: 1.1,
        }}>
          {hasChars ? 'ADVENTURER' : 'CREATE AN'}
          <br />
          {hasChars ? 'SELECT' : 'ADVENTURER'}
        </div>
      </div>

      <div style={{
        flex: 1,
        padding: isMobile ? '18px 18px calc(104px + env(safe-area-inset-bottom))' : '28px 40px 112px',
        display: 'flex',
        flexDirection: 'column',
        gap: isMobile ? 9 : 12,
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
                theme={theme}
              />
            ))}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {actionButton('CLAIM AN ADVENTURER', 'Join an existing character in the world', onClaim || onCreate)}
              {actionButton('CREATE AN ADVENTURER', 'Begin a new character', onCreate)}
            </div>
          </>
        ) : (
          <>
            {actionButton('CREATE AN ADVENTURER', 'Your journey in Soteria begins here', onCreate, true)}
            {actionButton('CLAIM AN ADVENTURER', 'Join an existing character in the world', onClaim)}
          </>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

function CharCard({ char, isMobile, getCampaignLabel, onSelect, theme }) {
  const campId = char.campaign || char.campaign_id;
  const campLabel = campId ? getCampaignLabel(campId) : null;
  const raceLine = [char.race, char.cls || char.cid].filter(Boolean).join(' - ');

  return (
    <button
      onClick={() => onSelect(char)}
      disabled={char.status === 'rejected'}
      style={{
        width: '100%',
        background: theme.card,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 8,
        padding: isMobile ? '16px 16px' : '20px 28px',
        cursor: char.status === 'rejected' ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: theme.shadow,
        transition: 'all 0.18s ease',
        textAlign: 'left',
        opacity: char.status === 'rejected' ? 0.55 : 1,
      }}
      onMouseEnter={e => {
        if (char.status === 'rejected') return;
        e.currentTarget.style.boxShadow = theme.shadowHover;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = theme.shadow;
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: isMobile ? 16 : 19,
          fontWeight: 700,
          letterSpacing: '0.04em',
          color: theme.title,
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {char.name || `${char.fn || ''} ${char.ln || ''}`.trim() || 'Unnamed'}
        </div>

        {raceLine && (
          <div style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: isMobile ? 11 : 12,
            color: theme.muted,
            marginBottom: campLabel ? 4 : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {raceLine}
          </div>
        )}

        {campLabel && (
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: theme.faint,
            marginTop: 2,
          }}>
            {campLabel}
          </div>
        )}
      </div>

      <div style={{
        fontSize: 14,
        color: theme.arrow,
        marginLeft: 16,
        flexShrink: 0,
      }}>&rarr;</div>
    </button>
  );
}
