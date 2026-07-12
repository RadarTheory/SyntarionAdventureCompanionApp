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
import LegalGate, { LEGAL_VERSION } from './LegalGate';
import Tour, { hasSeenTour } from './Tour';

// â”€â”€â”€ MOVABLE DRIFTSTONE BUTTON â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ SYNTARION LOGO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SyntarionLogo({ size = 320, darkMode = false, useHeroVideo = false }) {
  const ink = darkMode ? '#f0eeeb' : '#1a1714';
  const logoMediaSize = useHeroVideo ? size * 1.28 : size;
  const landingBg = '#f0eeeb';
  const [heroVideoSrc] = useState(() => '/landing-creatures.mp4?t=' + Date.now());
  const [videoReady, setVideoReady] = useState(useHeroVideo);
  const [loopBlink, setLoopBlink] = useState(false);

  const handleHeroVideoTime = (event) => {
    const video = event.currentTarget;
    if (!video.duration || Number.isNaN(video.duration)) return;
    setLoopBlink(video.duration - video.currentTime < 0.28);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
      `}</style>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
        {useHeroVideo && videoReady ? (
          <video
            id="syn-hero-reel"
            src={heroVideoSrc}
            width={logoMediaSize}
            height={logoMediaSize}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Syntarion creatures and characters"
            onCanPlay={() => setVideoReady(true)}
            onTimeUpdate={handleHeroVideoTime}
            onEnded={() => setLoopBlink(false)}
            onError={() => setVideoReady(false)}
            style={{
              display: 'block',
              width: logoMediaSize,
              height: logoMediaSize,
              background: landingBg,
              objectFit: 'cover',
              opacity: loopBlink ? 0.78 : 1,
              transition: 'opacity 180ms ease',
              WebkitMaskImage: 'radial-gradient(ellipse at center, #000 56%, rgba(0,0,0,0.82) 70%, transparent 100%)',
              maskImage: 'radial-gradient(ellipse at center, #000 56%, rgba(0,0,0,0.82) 70%, transparent 100%)',
              mixBlendMode: 'normal',
              filter: darkMode ? 'brightness(1.05)' : 'contrast(1.04)',
              pointerEvents: 'none',
            }}
          />
        ) : (
          <img
            id="syn-medallion"
            src={medallion}
            alt="Syntarion medallion"
            width={logoMediaSize}
            height={logoMediaSize}
            style={{ display: 'block', width: logoMediaSize, height: logoMediaSize, filter: darkMode ? 'invert(1)' : 'none' }}
          />
        )}
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
            ADVENTURE MODULE COMPANION
          </div>
          <div style={{ width: size * 0.12, height: '0.5px', background: ink, opacity: 0.3 }} />
        </div>
        <div id="syn-era" style={{
          fontFamily: "'Cinzel', serif",
          fontSize: size * 0.038,
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: ink,
          opacity: 0.65,
          marginTop: size * 0.04,
          lineHeight: 1,
        }}>
          ARE YOU READY?
        </div>
      </div>
    </>
  );
}

// â”€â”€â”€ SUBMIT TO GREATER ARCHIVE MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SubmitToArchiveModal({ module, onClose, onSuccess }) {
  const [name, setName] = useState(module?.name || '');
  const [description, setDescription] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!consent || !name.trim()) {
      setError("Please provide a name and confirm consent.");
      return;
    }

    setBusy(true);
    const { error: err } = await supabase
      .from('modules')
      .update({
        name: name.trim(),
        description: description.trim() || null,
        submitted_to_archive: true,
        archive_submitted_at: new Date().toISOString(),
      })
      .eq('id', module.id);

    setBusy(false);

    if (err) {
      setError("Failed to submit. Please try again.");
      console.error(err);
    } else {
      alert("âœ… Module submitted to the Greater Archive!\nThank you for contributing to Soteria.");
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,6,0.9)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#13100d', border: '1px solid #c8a84a44', borderRadius: 12, maxWidth: 440, width: '100%', padding: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 19, marginBottom: 8 }}>Submit to the Greater Archive</div>
        <div style={{ fontSize: 13, color: '#a09070', lineHeight: 1.5, marginBottom: 20 }}>
          This will allow Theonhex Media to potentially use your module in official Soteria lore or publications.
        </div>

        <input value={name} onChange={e => setName(e.target.value)} placeholder="Module Name" style={{ width: '100%', marginBottom: 12, padding: 12, background: '#1c1815', border: '1px solid #c8a84a33', borderRadius: 6, color: '#f0eeeb' }} />

        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description (optional)" rows={4} style={{ width: '100%', marginBottom: 16, padding: 12, background: '#1c1815', border: '1px solid #c8a84a33', borderRadius: 6, color: '#f0eeeb', resize: 'vertical' }} />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, marginBottom: 20, cursor: 'pointer' }}>
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
          <span>I consent to this module potentially becoming part of the official Soteria world.</span>
        </label>

        {error && <div style={{ color: '#ef4444', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid #555', borderRadius: 6 }}>Cancel</button>
          <button onClick={submit} disabled={busy || !consent || !name.trim()} style={{ flex: 1, padding: 12, background: consent && name.trim() ? '#c8a84a' : '#333', color: '#111', fontWeight: 700, borderRadius: 6 }}>
            {busy ? 'Submitting...' : 'Submit to Archive'}
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ DM SIGIL MODAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DMSigilModal({ onSuccess, onCancel }) {
  const [modules, setModules] = useState([]);
  const [moduleId, setModuleId] = useState(null);
  const [mode, setMode] = useState('unlock'); // 'unlock' | 'create'
  const [newName, setNewName] = useState('');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    supabase.from('modules').select('id, name').order('created_at', { ascending: true })
      .then(({ data }) => {
        setModules(data || []);
        if (data?.length) setModuleId(data[0].id);
      });
  }, []);

  const fail = (msg) => {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setTimeout(() => setError(''), 2500);
  };

  const attempt = async () => {
    if (busy) return;
    setBusy(true);
    if (mode === 'create') {
      const { data, error: err } = await supabase.rpc('create_module', {
        p_name: newName, p_description: null, p_password: input,
      });
      setBusy(false);
      if (err) return fail(err.message);
      onSuccess({ id: data, name: newName.trim() });
    } else {
      if (!moduleId) { setBusy(false); return fail('No module selected.'); }
      const { data, error: err } = await supabase.rpc('verify_module_dm', {
        p_module_id: moduleId, p_password: input,
      });
      setBusy(false);
      if (err) return fail(err.message);
      if (data === true) onSuccess(modules.find(m => m.id === moduleId));
      else fail('The archives remain sealed.');
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
          fontSize: 12, color: 'rgba(240,238,235,0.32)', marginBottom: 18,
          lineHeight: 1.65, fontFamily: 'Georgia, serif', fontStyle: 'italic',
        }}>
          {mode === 'create'
            ? <>Forge a new module.<br />Name it, and set its sigil.</>
            : <>The archives are sealed.<br />Prove you hold the key.</>}
        </div>
        {mode === 'unlock' ? (
          <select
            value={moduleId ?? ''}
            onChange={e => setModuleId(Number(e.target.value))}
            style={{
              width: '100%', background: '#1c1815',
              border: '1px solid rgba(240,238,235,0.14)', borderRadius: 8,
              padding: '10px 12px', fontSize: 13, color: '#f0eeeb',
              outline: 'none', marginBottom: 12, fontFamily: 'Georgia, serif',
            }}
          >
            {modules.length === 0 && <option value="">No modules yet</option>}
            {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        ) : (
          <input
            value={newName}
            onChange={e => { setNewName(e.target.value); setError(''); }}
            placeholder="Module name"
            style={{
              width: '100%', background: 'rgba(240,238,235,0.06)',
              border: '1px solid rgba(240,238,235,0.14)', borderRadius: 8,
              padding: '11px 14px', fontSize: 13, color: '#f0eeeb',
              outline: 'none', boxSizing: 'border-box', marginBottom: 12,
              fontFamily: 'Georgia, serif',
            }}
          />
        )}
        <input
          autoFocus
          type="password"
          value={input}
          onChange={e => { setInput(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          placeholder={mode === 'create' ? 'Set the sigil (min 6 chars)' : 'Â·Â·Â·'}
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
          }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent',
            border: '1px solid rgba(240,238,235,0.12)', borderRadius: 8,
            padding: '10px 0', color: 'rgba(240,238,235,0.32)', fontSize: 11,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'Cinzel', serif",
          }}>Retreat</button>
          <button onClick={attempt} disabled={busy} style={{
            flex: 2, background: 'rgba(240,238,235,0.06)',
            border: '1px solid rgba(240,238,235,0.18)', borderRadius: 8,
            padding: '10px 0', color: '#f0eeeb', fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1,
            fontFamily: "'Cinzel', serif", fontWeight: 700,
          }}>{busy ? '...' : mode === 'create' ? 'Forge' : 'Enter'}</button>
        </div>
        <button
          onClick={() => { setMode(mode === 'create' ? 'unlock' : 'create'); setError(''); setInput(''); }}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            marginTop: 14, color: 'rgba(240,238,235,0.35)', fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            fontFamily: "'Cinzel', serif", textDecoration: 'underline',
          }}
        >{mode === 'create' ? 'Unlock an existing module' : 'Forge a new module'}</button>
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

// â”€â”€â”€ MAIN LANDING COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function Landing({ user, darkMode, setDarkMode, onOpenBag }) {
  const { isMobile } = useDevice();
  const [appView, setAppView] = useState(() => localStorage.getItem('syn_view') || 'home');
  const [savedChars, setSavedChars] = useState([]);
  const campaignChars = savedChars.filter(c => c.status === 'approved' && c.campaign_id);
  const [loading, setLoading] = useState(true);
  const [showDMModal, setShowDMModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [dmModule, setDmModule] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(null);
  const [selectedChar, setSelectedChar] = useState(() => { try { const c = localStorage.getItem('syn_char'); return c ? JSON.parse(c) : null; } catch { return null; } });
  const [legalStatus, setLegalStatus] = useState('checking'); // 'checking' | 'needed' | 'accepted'
  const [showTour, setShowTour] = useState(() => !hasSeenTour());

  useEffect(() => {
    if (!user?.id) { setLegalStatus('needed'); return; }
    supabase
      .from('legal_acceptances')
      .select('id')
      .eq('user_id', user.id)
      .eq('version', LEGAL_VERSION)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Legal check failed:', error.message);
        setLegalStatus(data ? 'accepted' : 'needed');
      })
      .catch(err => {
        console.error('Legal check error:', err);
        setLegalStatus('needed');
      });
  }, [user?.id]);

  const fetchCharacters = async () => {
    if (!user?.id) { setLoading(false); return; }
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

  const goHome = () => { localStorage.setItem('syn_view', 'home'); setAppView('home'); fetchCharacters(); };
  const handlePlay = () => { localStorage.setItem('syn_view', 'character-select'); setAppView('character-select'); };
  const handleDMSuccess = (module) => { setDmModule(module || null); setShowDMModal(false); localStorage.setItem('syn_view', 'dm'); setAppView('dm'); };

  // â”€â”€ Legal Gate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (legalStatus === 'checking') return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#14110c' : '#f0eeeb' }} />
  );
  if (legalStatus === 'needed') return (
    <LegalGate user={user} onAccept={() => setLegalStatus('accepted')} />
  );

  // â”€â”€ Render Views â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (appView === 'character-select') return (
    <CharacterSelect
      savedChars={savedChars}
      onSelect={(char) => { setSelectedChar(char); localStorage.setItem('syn_view', 'sheet'); localStorage.setItem('syn_char', JSON.stringify(char)); setAppView('sheet'); }}
      onCreate={() => setAppView('wizard')}
      onClaim={() => { localStorage.setItem('syn_view', 'roster'); setAppView('roster'); }}
      onHome={goHome}
    />
  );

  if (appView === 'roster') return <Roster user={user} userChar={selectedChar} onHome={() => { localStorage.setItem('syn_view', 'character-select'); setAppView('character-select'); }} />;
  if (appView === 'wizard') return (
    <Wizard onComplete={goHome} onHome={goHome} />
  );

    if (appView === 'campaigns') return (
    <CampaignView
      campaignChars={campaignChars}
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

  if (appView === 'dm') return <DMView onHome={goHome} module={dmModule} />;

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

  // â”€â”€ Home screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const landingDarkMode = false;
  const ink = '#1a1714';
  const bg = '#f0eeeb';

  const buttons = [
    {
      id: 'play',
      label: 'PLAY',
      primary: true,
      sub: loading
        ? 'Consulting the archives...'
        : savedChars.length > 0
          ? `${savedChars.length} character${savedChars.length > 1 ? 's' : ''} saved`
          : 'Begin your journey',
      onClick: handlePlay,
    },
    ...(campaignChars.length > 0 ? [{
      id: 'campaigns',
      label: 'CAMPAIGNS',
      sub: 'Enter the age of steam',
      onClick: () => { localStorage.setItem('syn_view', 'campaigns'); setAppView('campaigns'); },
    }] : []),
       {
      id: 'howtoplay',
      label: 'HOW TO PLAY',
      sub: 'Adventure Helper',
      onClick: () => setShowTour(true),
    },
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
      minHeight: '100svh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: isMobile ? 'flex-start' : 'center',
      fontFamily: 'Georgia, serif',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      padding: isMobile ? 'calc(18px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom))' : '40px 24px',
    }}>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(26,23,20,0.07) 100%)',
        pointerEvents: 'none',
      }} />

      <button onClick={onOpenBag}>
        L&oacute;tjarr's Bag of Games
      </button>

     {showDMModal && (
        <DMSigilModal onSuccess={handleDMSuccess} onCancel={() => setShowDMModal(false)} />
      )}

      {showTour && (
        <Tour onClose={() => setShowTour(false)} />
      )}

      {showArchiveModal && dmModule && (
      <SubmitToArchiveModal
        module={dmModule}
        onClose={() => setShowArchiveModal(false)}
        onSuccess={() => console.log("Module archived successfully")}
      />
    )}

      {/* Logo */}
      <div style={{ animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both', animationDelay: '0.1s' }}>
        <SyntarionLogo size={isMobile ? 238 : 360} darkMode={landingDarkMode} useHeroVideo />
      </div>

      {/* Tagline */}
      <div style={{
        marginTop: 8,
        marginBottom: isMobile ? 24 : 44,
        textAlign: 'center',
        animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.3s',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          justifyContent: isMobile ? 'flex-start' : 'center', marginBottom: 16,
        }}>
          <div style={{ width: 40, height: '0.5px', background: 'rgba(26,23,20,0.18)' }} />
          <div style={{ width: 4, height: 4, background: ink, transform: 'rotate(45deg)', opacity: 0.25 }} />
          <div style={{ width: 40, height: '0.5px', background: 'rgba(26,23,20,0.18)' }} />
        </div>
        </div>

      {/* Buttons */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        width: '100%',
        maxWidth: isMobile ? 360 : 320,
        animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.5s',
      }}>
        {buttons.map(btn => {
          const isHovered = hoveredBtn === btn.id;
          const isPrimary = btn.primary;

          const bgColor = isPrimary
            ? (isHovered ? '#1a1714' : '#2a2420')
            : (isHovered ? 'rgba(26,23,20,0.07)' : 'transparent');

          const borderColor = isPrimary
            ? '#2a2420'
            : 'rgba(26,23,20,0.18)';

          const labelColor = isPrimary ? '#f0eeeb' : ink;
          const subColor = isPrimary ? 'rgba(240,238,235,0.5)' : 'rgba(26,23,20,0.4)';

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
                color: isPrimary ? 'rgba(240,238,235,0.35)' : 'rgba(26,23,20,0.4)',
                transform: isHovered ? 'translateX(3px)' : 'none',
                transition: 'transform 0.18s ease',
              }}>&rarr;</div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        position: isMobile ? 'static' : 'absolute', bottom: 24,
        marginTop: isMobile ? 26 : 0,
        maxWidth: isMobile ? 'min(100%, 360px)' : 'none',
        textAlign: 'center',
        fontFamily: "'Cinzel', serif", fontSize: 9,
        letterSpacing: '0.28em',
        color: 'rgba(26,23,20,0.22)',
        textTransform: 'uppercase',
        animation: 'fadeUp 1.2s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.9s',
      }}>
        Developed by Adrian 'Radar Theory' Gilmore and Jacob 'Jake' Homer. &copy; 2026 TheonhexMedia &amp; Publishing. All rights reserved.
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

// â”€â”€â”€ STUB COMPONENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Stub({ label, onHome, dark }) {
  return (
    <div style={{
      minHeight: '100svh', background: dark ? '#0d0d1a' : '#f0eeeb',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Georgia, serif', gap: 20,
    }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 13,
        letterSpacing: '0.2em',
        color: dark ? 'rgba(240,238,235,0.35)' : 'rgba(26,23,20,0.35)',
        textTransform: 'uppercase',
      }}>{label}.jsx - coming soon</div>
      <button onClick={onHome} style={{
        background: 'transparent',
        border: `1px solid ${dark ? 'rgba(240,238,235,0.18)' : 'rgba(26,23,20,0.18)'}`,
        borderRadius: 4, padding: '10px 24px',
        color: dark ? 'rgba(240,238,235,0.45)' : 'rgba(26,23,20,0.65)',
        fontFamily: "'Cinzel', serif", fontSize: 10,
        letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer',
      }}>&larr; Home</button>
    </div>
  );
}



