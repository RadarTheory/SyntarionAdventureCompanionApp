import { useState, useEffect, useRef } from "react";
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import medallion from './assets/medallion.png';
import CharacterSelect from './CharacterSelect';
import Wizard from './Wizard';
import CharacterSheet from './CharacterSheet';
import CampaignView from './CampaignView';
import Roster from './Roster';
import DMView from './DMView';
import Settings from './Settings';

// ─── MOVABLE DRIFTSTONE BUTTON ───────────────────────────────────────────────
function DriftstoneButton({ onClick, isMobile }) {
  const [pos, setPos] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const iconSize = isMobile ? 52 : 68;

  // FIX 1: Declaring handleStart inside the component scope
  const handleStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setIsDragging(true);
    dragStartPos.current = {
      x: clientX - pos.x,
      y: clientY - pos.y,
      initialX: clientX,
      initialY: clientY
    };
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      if (e.cancelable) e.preventDefault();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPos({ x: clientX - dragStartPos.current.x, y: clientY - dragStartPos.current.y });
    };

    const handleEnd = (e) => {
      if (!isDragging) return;
      const clientX = e.type.includes('touch') ? e.changedTouches[0]?.clientX : e.clientX;
      const clientY = e.type.includes('touch') ? e.changedTouches[0]?.clientY : e.clientY;
      const moveThreshold = 8;
      const deltaX = Math.abs((clientX || 0) - dragStartPos.current.initialX);
      const deltaY = Math.abs((clientY || 0) - dragStartPos.current.initialY);
      if (deltaX < moveThreshold && deltaY < moveThreshold) onClick();
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove, { passive: false });
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, onClick]);

  return (
    <div
      onMouseDown={handleStart}
      onTouchStart={handleStart}
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        zIndex: 2000,
        cursor: isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <img
        /* FIX 2: Using the direct filename string instead of a variable */
        src="/drifstone.png" 
        alt="Driftstone"
        style={{
          width: iconSize,
          height: iconSize,
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))',
        }}
      />
    </div>
  );
}

// ─── SYNTARION LOGO ──────────────────────────────────────────────────────────
function SyntarionLogo({ size = 320, darkMode = false }) {
  const ink = darkMode ? '#f0eeeb' : '#1a1714';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
        <img
          id="syn-medallion"
          src={medallion}
          alt="Syntarion medallion"
          width={size}
          height={size}
          style={{ display: 'block', filter: darkMode ? 'invert(1)' : 'none' }}
        />
        <div id="syn-wordmark" style={{
          fontFamily: "'Cinzel', 'Trajan Pro', serif",
          fontSize: size * 0.115,
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: ink,
          marginTop: size * 0.04,
          lineHeight: 1,
        }}>
          SYNTARION
        </div>
        <div id="syn-subtitle" style={{
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.04,
          marginTop: size * 0.04,
        }}>
          <div style={{ width: size * 0.12, height: '0.5px', background: ink, opacity: 0.3 }} />
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
          <div style={{ width: size * 0.12, height: '0.5px', background: ink, opacity: 0.3 }} />
        </div>
        <div id="syn-era" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: size * 0.026,
          fontWeight: 400,
          letterSpacing: '0.28em',
          color: ink,
          opacity: 0.28,
          marginTop: size * 0.03,
          lineHeight: 1,
        }}>
          SOTERIA · 178 E.U.
        </div>
      </div>
    </>
  );
}

// ─── DM SIGIL MODAL ──────────────────────────────────────────────────────────
function DMSigilModal({ onSuccess, onCancel }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (input === import.meta.env.VITE_DM_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(10,8,6,0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#13100d',
          border: `1px solid ${error ? '#7f1d1d' : 'rgba(240,238,235,0.12)'}`,
          borderRadius: 14,
          padding: '36px 40px',
          maxWidth: 360, width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          transform: shake ? 'translateX(-8px)' : 'none',
          transition: 'transform 0.08s, border-color 0.2s',
        }}
      >
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
          autoFocus
          type="password"
          value={input}
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

// ─── MAIN LANDING COMPONENT ──────────────────────────────────────────────────
export default function Landing({ user, darkMode, setDarkMode, onOpenBag }) {
  const { isMobile } = useDevice();
  const [appView, setAppView] = useState('home');
  const [savedChars, setSavedChars] = useState([]);
  const campaignChars = savedChars.filter(c => c.status === 'approved' && c.campaign_id);
  const [loading, setLoading] = useState(true);
  const [showDMModal, setShowDMModal] = useState(false);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [selectedChar, setSelectedChar] = useState(null);

  const fetchCharacters = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      if (data) setSavedChars(data
        .filter(row => row.status !== 'rejected')
        .map(row => ({
          ...row.data,
          id: row.id,
          status: row.status,
          campaign_id: row.campaign_id,
        })));
    } catch (err) {
      console.error('Fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCharacters(); }, [user?.id]);

  const goHome = () => { setAppView('home'); fetchCharacters(); };
  const handlePlay = () => setAppView(savedChars.length > 0 ? 'character-select' : 'wizard');
  const handleDMSuccess = () => { setShowDMModal(false); setAppView('dm'); };

  // ── Render Views ───────────────────────────────────────────────────────────
  if (appView === 'character-select') return (
    <CharacterSelect
      savedChars={savedChars}
      onSelect={(char) => { setSelectedChar(char); setAppView('sheet'); }}
      onCreate={() => setAppView('wizard')}
      onHome={goHome}
    />
  );

  if (appView === 'wizard') return (
    <Wizard onComplete={goHome} onHome={goHome} />
  );

  if (appView === 'campaigns') return (
    <CampaignView
      userChar={campaignChars[0] || null}
      onHome={goHome}
      onUpdateChar={(updated) => setSavedChars(prev => prev.map(c => c.id === updated.id ? updated : c))}
      onAssign={(campaignId) => {
        setSavedChars(prev => prev.map(c => ({ ...c, campaign: campaignId })));
      }}
    />
  );

  if (appView === 'settings') return (
    <Settings user={user} darkMode={darkMode} setDarkMode={setDarkMode} onHome={goHome} />
  );

  if (appView === 'dm') return <DMView onHome={goHome} />;

  if (appView === 'sheet') return (
    <CharacterSheet
      char={selectedChar}
      user={user}
      onHome={goHome}
      onUpdateChar={(updated) => {
        setSelectedChar(updated);
        setSavedChars(prev => prev.map(c => c.id === updated.id ? updated : c));
      }}
    />
  );

  // ── Home screen ────────────────────────────────────────────────────────────
  const ink = darkMode ? '#f0eeeb' : '#1a1714';
  const bg  = darkMode ? '#14110c' : '#f0eeeb';

  const buttons = [
    {
      id: 'play',
      label: 'PLAY',
      primary: true,
      sub: loading
        ? 'Consulting the archives…'
        : savedChars.length > 0
          ? `${savedChars.length} character${savedChars.length > 1 ? 's' : ''} saved`
          : 'Begin your journey',
      onClick: handlePlay,
    },
    ...(campaignChars.length > 0 ? [{
      id: 'campaigns',
      label: 'CAMPAIGNS',
      sub: 'Enter the age of steam',
      onClick: () => setAppView('campaigns'),
    }] : []),
       {
      id: 'settings',
      label: 'SETTINGS',
      sub: 'Preferences & display',
      onClick: () => setAppView('settings'),
    },
    {
      id: 'dm',
      label: 'DM MODE',
      sub: 'The archives await',
      onClick: () => setShowDMModal(true),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      position: 'relative',
      overflow: 'hidden',
      padding: isMobile ? '32px 20px' : '40px 24px',
    }}>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(26,23,20,0.07) 100%)',
        pointerEvents: 'none',
      }} />

      <button onClick={onOpenBag}>
        Lótjarr's Bag of Games
      </button>

      {showDMModal && (
        <DMSigilModal onSuccess={handleDMSuccess} onCancel={() => setShowDMModal(false)} />
      )}

      {/* Logo */}
      <div style={{ animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.1s' }}>
        <SyntarionLogo size={isMobile ? 220 : 300} darkMode={darkMode} />
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 8,
        marginBottom: isMobile ? 32 : 44,
        textAlign: 'center',
        animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.3s',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: 'center', marginBottom: 16,
        }}>
          <div style={{ width: 40, height: '0.5px', background: `rgba(${darkMode ? '240,238,235' : '26,23,20'},0.18)` }} />
          <div style={{ width: 4, height: 4, background: ink, transform: 'rotate(45deg)', opacity: 0.25 }} />
          <div style={{ width: 40, height: '0.5px', background: `rgba(${darkMode ? '240,238,235' : '26,23,20'},0.18)` }} />
        </div>
        <p style={{
          fontFamily: 'Georgia, serif', fontStyle: 'italic',
          fontSize: isMobile ? 13 : 15,
          color: ink, opacity: 0.55, letterSpacing: '0.03em',
          margin: 0, lineHeight: 1.75,
        }}>
          The Doctrine of Being calls you.<br />
          Do you dare answer?
        </p>
      </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        width: '100%',
        maxWidth: isMobile ? '100%' : 320,
        animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.5s',
      }}>
        {buttons.map(btn => {
          const isHovered = hoveredBtn === btn.id;
          const isPrimary = btn.primary;

          const bgColor = isPrimary
            ? (isHovered ? '#1a1714' : '#2a2420')
            : (isHovered ? `rgba(${darkMode ? '240,238,235' : '26,23,20'},0.07)` : 'transparent');

          const borderColor = isPrimary
            ? '#2a2420'
            : `rgba(${darkMode ? '240,238,235' : '26,23,20'},0.18)`;

          const labelColor = isPrimary ? '#f0eeeb' : ink;
          const subColor = isPrimary ? 'rgba(240,238,235,0.5)' : `rgba(${darkMode ? '240,238,235' : '26,23,20'},0.4)`;

          return (
            <button
              key={btn.id}
              onClick={btn.onClick}
              onMouseEnter={() => setHoveredBtn(btn.id)}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                background: bgColor,
                border: `1px solid ${borderColor}`,
                borderRadius: 4,
                padding: isPrimary
                  ? (isMobile ? '14px 20px' : '16px 24px')
                  : (isMobile ? '11px 20px' : '13px 24px'),
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
                  fontFamily: "'Cinzel', serif",
                  fontSize: isPrimary ? (isMobile ? 13 : 15) : (isMobile ? 11 : 12),
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  color: labelColor,
                  marginBottom: 2,
                }}>{btn.label}</div>
                <div style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: isMobile ? 9 : 10,
                  color: subColor,
                  letterSpacing: '0.03em',
                }}>
                  {btn.id === 'play' && loading ? (
                     <div className="loader" style={{ width: 12, height: 12, display: 'inline-block', verticalAlign: 'middle' }}></div>
                  ) : btn.sub}
                </div>
              </div>
              <div style={{
                fontSize: 14,
                color: isPrimary ? 'rgba(240,238,235,0.35)' : `rgba(${darkMode ? '240,238,235' : '26,23,20'},0.4)`,
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
        letterSpacing: '0.28em',
        color: darkMode ? 'rgba(240,238,235,0.18)' : 'rgba(26,23,20,0.22)',
        textTransform: 'uppercase',
        animation: 'fadeUp 1.2s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.9s',
      }}>
        Developed by Adrian 'Radar Theory' Gilmore and Jacob 'Jake' Homer. © 2026 TheonhexMedia & Publishing. All rights reserved.
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .loader {
          border: 2px solid #a08c2e;
          border-bottom-color: transparent;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

// ─── STUB COMPONENT ──────────────────────────────────────────────────────────
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
        color: dark ? 'rgba(240,238,235,0.45)' : 'rgba(26,23,20,0.65)',
        fontFamily: "'Cinzel', serif", fontSize: 10,
        letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
      }}>← Home</button>
    </div>
  );
}

