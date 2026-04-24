import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import { useDevice } from './useDevice';
import medallion from './assets/medallion.png';

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── CHILD VIEW IMPORTS (uncomment as you build each one) ─────────────────────
// import Wizard from './Wizard';
// import CharacterSelect from './CharacterSelect';
// import CampaignView from './CampaignView';
// import Roster from './Roster';
// import DMView from './DMView';
// import Settings from './Settings';

// ═════════════════════════════════════════════════════════════════════════════
// SYNTARION LOGO
//
// Medallion: real PNG (transparent background), scales cleanly
// Wordmark + subtitle: clean HTML text beneath it
//
// IDs for animation later:
//   #syn-medallion   — the medallion image
//   #syn-wordmark    — SYNTARION text
//   #syn-rules       — the decorative lines flanking ADVENTURE COMPANION
//   #syn-subtitle    — ADVENTURE COMPANION text
//   #syn-era         — SOTERIA · 178 E.U.
// ═════════════════════════════════════════════════════════════════════════════
function SyntarionLogo({ size = 320, darkMode = false }) {
  const ink = darkMode ? '#f0eeeb' : '#1a1714';

  // Medallion image is square — size × size
  const medallionSize = size;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
      }}>

        {/* ── MEDALLION IMAGE ── */}
        <img
          id="syn-medallion"
          src={medallion}
          alt="Syntarion medallion"
          width={medallionSize}
          height={medallionSize}
          style={{
            display: 'block',
            // Invert for dark mode so the dark ink becomes light
            filter: darkMode ? 'invert(1)' : 'none',
          }}
        />

        {/* ── WORDMARK ── */}
        <div
          id="syn-wordmark"
          style={{
            fontFamily: "'Cinzel', 'Trajan Pro', serif",
            fontSize: size * 0.115,
            fontWeight: 700,
            letterSpacing: '0.22em',
            color: ink,
            marginTop: size * 0.04,
            lineHeight: 1,
          }}
        >
          SYNTARION
        </div>

        {/* ── ADVENTURE COMPANION + rules ── */}
        <div
          id="syn-subtitle"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: size * 0.04,
            marginTop: size * 0.04,
          }}
        >
          {/* Left rule */}
          <div id="syn-rules-left" style={{
            width: size * 0.12,
            height: '0.5px',
            background: ink,
            opacity: 0.3,
          }}/>

          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: size * 0.036,
            fontWeight: 400,
            letterSpacing: '0.32em',
            color: ink,
            opacity: 0.6,
            lineHeight: 1,
          }}>
            ADVENTURE COMPANION
          </div>

          {/* Right rule */}
          <div id="syn-rules-right" style={{
            width: size * 0.12,
            height: '0.5px',
            background: ink,
            opacity: 0.3,
          }}/>
        </div>

        {/* ── ERA ── */}
        <div
          id="syn-era"
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: size * 0.026,
            fontWeight: 400,
            letterSpacing: '0.28em',
            color: ink,
            opacity: 0.28,
            marginTop: size * 0.03,
            lineHeight: 1,
          }}
        >
          SOTERIA · 178 E.U.
        </div>

      </div>
    </>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// DM SIGIL MODAL
// ═════════════════════════════════════════════════════════════════════════════
function DMSigilModal({ onSuccess, onCancel }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (input.trim() === 'LUC4N') {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,8,6,0.72)',
      backdropFilter: 'blur(6px)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#13100d',
        border: `1px solid ${error ? '#7f1d1d' : 'rgba(240,238,235,0.12)'}`,
        borderRadius: 14,
        padding: '36px 40px',
        maxWidth: 360, width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        transform: shake ? 'translateX(-8px)' : 'none',
        transition: 'transform 0.08s, border-color 0.2s',
      }}>
        {/* Small medallion in modal */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <SyntarionLogo size={72} darkMode />
        </div>

        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 12,
          letterSpacing: '0.28em', color: 'rgba(240,238,235,0.4)',
          textTransform: 'uppercase', marginBottom: 8,
        }}>DM Mode</div>

        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700,
          color: '#f0eeeb', letterSpacing: '0.06em', marginBottom: 6,
        }}>Enter the Sigil</div>

        <div style={{
          fontSize: 12, color: 'rgba(240,238,235,0.32)', marginBottom: 24,
          lineHeight: 1.65, fontFamily: 'Georgia, serif', fontStyle: 'italic',
        }}>
          The archives are sealed.<br />Prove you hold the key.
        </div>

        <input
          autoFocus type="password" value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder="···"
          style={{
            width: '100%', background: 'rgba(240,238,235,0.06)',
            border: `1px solid ${error ? '#ef4444' : 'rgba(240,238,235,0.14)'}`,
            borderRadius: 8, padding: '11px 14px', fontSize: 16,
            letterSpacing: '0.3em', color: '#f0eeeb', textAlign: 'center',
            outline: 'none', boxSizing: 'border-box', marginBottom: 14,
            fontFamily: 'Georgia, serif', transition: 'border-color 0.2s',
          }}
        />

        {error && (
          <div style={{
            fontSize: 11, color: '#ef4444', letterSpacing: '0.12em',
            textTransform: 'uppercase', marginBottom: 12,
            fontFamily: "'Cinzel', serif",
          }}>The archives remain sealed.</div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent',
            border: '1px solid rgba(240,238,235,0.12)', borderRadius: 8,
            padding: '10px 0', color: 'rgba(240,238,235,0.32)', fontSize: 11,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'Cinzel', serif",
          }}>Retreat</button>
          <button onClick={attempt} style={{
            flex: 2, background: 'rgba(240,238,235,0.06)',
            border: '1px solid rgba(240,238,235,0.18)', borderRadius: 8,
            padding: '10px 0', color: '#f0eeeb', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'Cinzel', serif", fontWeight: 700,
          }}>Enter</button>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0);}
          20%{transform:translateX(-10px);}
          40%{transform:translateX(8px);}
          60%{transform:translateX(-6px);}
          80%{transform:translateX(4px);}
        }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LANDING — top-level component
// Re-fetches characters on every mount. Owns all routing.
// ═════════════════════════════════════════════════════════════════════════════
export default function Landing() {
  const { isMobile } = useDevice();
  const [appView, setAppView]                 = useState('home');
  const [savedChars, setSavedChars]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [showDMModal, setShowDMModal]         = useState(false);
  const [dmAuthenticated, setDmAuthenticated] = useState(false);
  const [hoveredBtn, setHoveredBtn]           = useState(null);

  useEffect(() => { fetchCharacters(); }, []);

  const fetchCharacters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('characters').select('*');
      if (error) throw error;
      if (data) setSavedChars(data.map(row => ({ ...row.data, id: row.id })));
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const goHome = () => { setAppView('home'); fetchCharacters(); };
  const handlePlay = () => setAppView(savedChars.length > 0 ? 'character-select' : 'wizard');
  const handleDMSuccess = () => { setDmAuthenticated(true); setShowDMModal(false); setAppView('dm'); };

  // ── Route stubs — swap for real component as you build each one ──
  if (appView === 'character-select') return <Stub label="CharacterSelect" onHome={goHome} />;
  if (appView === 'wizard')           return <Stub label="Wizard"           onHome={goHome} />;
  if (appView === 'campaigns')        return <Stub label="CampaignView"     onHome={goHome} />;
  if (appView === 'roster')           return <Stub label="Roster"           onHome={goHome} />;
  if (appView === 'settings')         return <Stub label="Settings"         onHome={goHome} />;
  if (appView === 'dm')               return <Stub label="DMView"           onHome={goHome} dark />;

  const buttons = [
    {
      id: 'play', label: 'PLAY', primary: true,
      sub: loading ? 'Consulting the archives…'
        : savedChars.length > 0
          ? `${savedChars.length} character${savedChars.length > 1 ? 's' : ''} saved`
          : 'Begin your journey',
      onClick: handlePlay,
    },
    { id: 'campaigns', label: 'CAMPAIGNS', sub: 'Enter the age of steam',  onClick: () => setAppView('campaigns') },
    { id: 'roster',    label: 'ROSTER',    sub: 'View all adventurers',     onClick: () => setAppView('roster')    },
    { id: 'settings',  label: 'SETTINGS',  sub: 'Preferences & display',    onClick: () => setAppView('settings')  },
    { id: 'dm',        label: 'DM MODE',   sub: 'The archives await',       onClick: () => setShowDMModal(true)    },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#f0eeeb',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', position: 'relative',
      overflow: 'hidden', padding: isMobile ? '32px 20px' : '40px 24px',
    }}>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(26,23,20,0.07) 100%)',
        pointerEvents: 'none',
      }}/>

      {showDMModal && (
        <DMSigilModal onSuccess={handleDMSuccess} onCancel={() => setShowDMModal(false)} />
      )}

      {/* Logo */}
      <div style={{
        animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.1s',
      }}>
        <SyntarionLogo size={isMobile ? 220 : 300} />
      </div>

      {/* Subtitle */}
      <div style={{
        marginTop: 8, marginBottom: isMobile ? 32 : 44,
        textAlign: 'center',
        animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.3s',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: 'center', marginBottom: 16,
        }}>
          <div style={{ width: 40, height: '0.5px', background: 'rgba(26,23,20,0.18)' }}/>
          <div style={{ width: 4, height: 4, background: '#1a1714', transform: 'rotate(45deg)', opacity: 0.25 }}/>
          <div style={{ width: 40, height: '0.5px', background: 'rgba(26,23,20,0.18)' }}/>
        </div>
        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: isMobile ? 13 : 15, color: '#1a1714',
          opacity: 0.55, letterSpacing: '0.03em',
          margin: 0, lineHeight: 1.75,
        }}>
          The Doctrine of Being calls you.<br />
          Do you dare answer?
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 9,
        width: '100%', maxWidth: isMobile ? '100%' : 320,
        animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.5s',
      }}>
        {buttons.map(btn => {
          const isHovered = hoveredBtn === btn.id;
          const isPrimary = btn.primary;
          return (
            <button key={btn.id} onClick={btn.onClick}
              onMouseEnter={() => setHoveredBtn(btn.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                background: isPrimary
                  ? (isHovered ? '#1a1714' : '#2a2420')
                  : (isHovered ? 'rgba(26,23,20,0.07)' : 'transparent'),
                border: `1px solid ${isPrimary ? '#2a2420' : 'rgba(26,23,20,0.18)'}`,
                borderRadius: 4,
                padding: isPrimary
                  ? (isMobile ? '14px 20px' : '16px 24px')
                  : (isMobile ? '11px 20px' : '13px 24px'),
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                transition: 'all 0.18s ease',
                boxShadow: isPrimary
                  ? (isHovered ? '0 8px 24px rgba(26,23,20,0.18)' : '0 4px 12px rgba(26,23,20,0.10)')
                  : 'none',
                transform: isHovered ? 'translateY(-1px)' : 'none',
                width: '100%',
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontFamily: "'Cinzel', 'Trajan Pro', serif",
                  fontSize: isPrimary ? (isMobile ? 13 : 15) : (isMobile ? 11 : 12),
                  fontWeight: 700, letterSpacing: '0.22em',
                  color: isPrimary ? '#f0eeeb' : '#1a1714',
                  marginBottom: 2,
                }}>{btn.label}</div>
                <div style={{
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: isMobile ? 9 : 10,
                  color: isPrimary ? 'rgba(240,238,235,0.5)' : 'rgba(26,23,20,0.4)',
                  letterSpacing: '0.03em',
                }}>{btn.sub}</div>
              </div>
              <div style={{
                fontSize: 14,
                color: isPrimary ? 'rgba(240,238,235,0.35)' : 'rgba(26,23,20,0.22)',
                transform: isHovered ? 'translateX(3px)' : 'none',
                transition: 'transform 0.18s ease',
              }}>→</div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 24,
        fontFamily: "'Cinzel', serif", fontSize: 9,
        letterSpacing: '0.28em', color: 'rgba(26,23,20,0.22)',
        textTransform: 'uppercase',
        animation: 'fadeUp 1.2s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.9s',
      }}>
        Soteria · 178 Era of Unity
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STUB — placeholder while a view isn't built yet
// ═════════════════════════════════════════════════════════════════════════════
function Stub({ label, onHome, dark }) {
  return (
    <div style={{
      minHeight: '100vh', background: dark ? '#0d0d1a' : '#f0eeeb',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', gap: 20,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 13,
        letterSpacing: '0.2em',
        color: dark ? 'rgba(240,238,235,0.35)' : 'rgba(26,23,20,0.35)',
        textTransform: 'uppercase',
      }}>{label}.jsx — coming soon</div>
      <button onClick={onHome} style={{
        background: 'transparent',
        border: `1px solid ${dark ? 'rgba(240,238,235,0.18)' : 'rgba(26,23,20,0.18)'}`,
        borderRadius: 4, padding: '10px 24px',
        color: dark ? 'rgba(240,238,235,0.45)' : 'rgba(26,23,20,0.45)',
        fontFamily: "'Cinzel', serif", fontSize: 10,
        letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
      }}>← Home</button>
    </div>
  );
}
