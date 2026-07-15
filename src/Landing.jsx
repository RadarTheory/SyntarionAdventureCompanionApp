import { useState, useEffect, useRef } from "react";
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import medallion from './assets/medallion.png';
import worldDiscBackground from './assets/tour/world-disc-ss.png';
import CharacterSelect from './CharacterSelect';
import Wizard from './Wizard';
import CharacterSheet from './CharacterSheet';
import CampaignView from './CampaignView';
import Roster from './Roster';
import DMView from './DMView';
import Settings from './Settings';
import LegalGate, { LEGAL_VERSION } from './LegalGate';
import Tour, { hasSeenTour } from './Tour';
import ScribeLite from './ScribeLite';

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
function SyntarionLogo({ size = 320, darkMode = false, useHeroVideo = false, isMobile = false }) {
  const ink = darkMode ? '#f0eeeb' : '#050403';
   const logoMediaSize = useHeroVideo ? size * (isMobile ? 2.18 : 2.32) : size;
  const heroMask = isMobile
    ? 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.34) 5%, rgba(0,0,0,0.9) 12%, #000 22%, #000 70%, rgba(0,0,0,0.72) 84%, transparent 100%)'
    : 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.34) 5%, rgba(0,0,0,0.9) 12%, #000 20%, #000 70%, rgba(0,0,0,0.72) 84%, transparent 100%)';
  const landingBg = '#f0eeeb';
  const [heroVideoSrc] = useState(() => '/landing-creatures.mp4?t=' + Date.now());
  const [videoReady, setVideoReady] = useState(useHeroVideo);

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
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-label="Syntarion creatures and characters"
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoReady(false)}
            style={{
        display: 'block',
              width: logoMediaSize,
              maxWidth: isMobile ? '108vw' : 'min(90vw, 790px)',
              height: 'auto',
              background: 'transparent',
              opacity: 1,
            WebkitMaskImage: heroMask,
              maskImage: heroMask,
              mixBlendMode: 'normal',
              filter: 'contrast(1.04)',
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
        {useHeroVideo && (
          <div
            aria-hidden="true"
            style={{
              width: isMobile ? 'calc(100vw - 36px)' : 'min(92vw, 860px)',
              height: 0,
              background: 'transparent',
              borderRadius: 999,
              margin: `${isMobile ? 0 : -2}px 0 ${size * 0.075}px`,
              boxShadow: 'none',
            }}
          />
        )}
        <div id="syn-wordmark" style={{
          fontFamily: "'Cinzel', 'Trajan Pro', serif",
          fontSize: size * 0.115,
          fontWeight: 700,
          letterSpacing: '0.22em',
          color: ink,
          marginTop: useHeroVideo ? 0 : size * 0.04,
          lineHeight: 1,
          textShadow: darkMode ? '0 2px 18px rgba(0,0,0,0.92), 0 0 30px rgba(200,168,74,0.12)' : '0 1px 0 rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.78)',
        }}>
          SYNTARION
        </div>
        <div id="syn-subtitle" style={{
          display: 'flex',
          alignItems: 'center',
          gap: size * 0.04,
          marginTop: size * 0.04,
        }}>
          <div style={{ width: size * 0.12, height: '0.5px', background: ink, opacity: 0.48 }} />
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
          <div style={{ width: size * 0.12, height: '0.5px', background: ink, opacity: 0.48 }} />
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

// ─── SUBMIT TO GREATER ARCHIVE MODAL ────────────────────────────────────────
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
      alert("✅ Module submitted to the Greater Archive!\nThank you for contributing to Soteria.");
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

// ─── DM SIGIL MODAL ──────────────────────────────────────────────────────────
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
          placeholder={mode === 'create' ? 'Set the sigil (min 6 chars)' : '···'}
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

// ─── MAIN LANDING COMPONENT ──────────────────────────────────────────────────
export default function Landing({ user, darkMode, setDarkMode, onOpenBag, onViewChange }) {
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
    onViewChange?.(appView !== 'home');
  }, [appView, onViewChange]);

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

  // ── Legal Gate ─────────────────────────────────────────────────────────────
  if (legalStatus === 'checking') return (
    <div style={{ minHeight: '100vh', background: darkMode ? '#14110c' : '#f0eeeb' }} />
  );
  if (legalStatus === 'needed') return (
    <LegalGate user={user} onAccept={() => setLegalStatus('accepted')} />
  );

  // ── Render Views ───────────────────────────────────────────────────────────
  if (appView === 'character-select') return (
    <>
      <CharacterSelect
        darkMode={darkMode}
        savedChars={savedChars}
        onSelect={(char) => { setSelectedChar(char); localStorage.setItem('syn_view', 'sheet'); localStorage.setItem('syn_char', JSON.stringify(char)); setAppView('sheet'); }}
        onCreate={() => setAppView('wizard')}
        onClaim={() => { localStorage.setItem('syn_view', 'roster'); setAppView('roster'); }}
        onHome={goHome}
      />
      <ScribeLite />
    </>
  );

  if (appView === 'roster') return <Roster darkMode={darkMode} user={user} userChar={selectedChar} onHome={() => { localStorage.setItem('syn_view', 'character-select'); setAppView('character-select'); }} />;
  if (appView === 'wizard') return (
    <>
      <Wizard darkMode={darkMode} onComplete={goHome} onHome={goHome} />
      <ScribeLite />
    </>
  );

  if (appView === 'campaigns') return (
    <CampaignView
      darkMode={darkMode}
      user={user}
      onOpenDM={handleDMSuccess}
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

  if (appView === 'dm') return <DMView darkMode={darkMode} onHome={goHome} module={dmModule} user={user} />;

  if (appView === 'sheet') return (
    <CharacterSheet
      darkMode={darkMode}
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
  const landingDarkMode = false;
  const ink = landingDarkMode ? '#f0eeeb' : '#1a1714';
  const mutedInk = landingDarkMode ? 'rgba(240,238,235,0.64)' : 'rgba(26,23,20,0.46)';
  const faintInk = landingDarkMode ? 'rgba(240,238,235,0.28)' : 'rgba(26,23,20,0.22)';
  const lineInk = landingDarkMode ? 'rgba(240,238,235,0.2)' : 'rgba(26,23,20,0.18)';
  const bg = landingDarkMode ? '#14110c' : '#dbdcdf';
  const pageVignette = landingDarkMode
    ? 'radial-gradient(ellipse at center, transparent 34%, rgba(0,0,0,0.38) 100%)'
    : 'radial-gradient(ellipse at center, transparent 40%, rgba(26,23,20,0.07) 100%)';

  const buttons = [
    {
      id: 'play',
      label: 'PLAY',
      primary: true,
      sub: loading
        ? 'Consulting the archives...'
        : savedChars.length > 0
          ? 'Choose your adventurer'
          : 'Create your first adventurer',
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
      justifyContent: 'flex-start',
      fontFamily: 'Georgia, serif',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-y',
      overscrollBehaviorY: 'auto',
      padding: isMobile ? 'calc(18px + env(safe-area-inset-top)) 18px calc(28px + env(safe-area-inset-bottom))' : '34px 24px 28px',
    }}>

      {/* World map atmosphere */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: `url(${worldDiscBackground})`,
          backgroundSize: isMobile ? 'auto 115%' : 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.14,
          filter: 'sepia(0.10) saturate(0.82) contrast(1.02) brightness(1.02)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Vignette */}
      <div style={{
        position: 'fixed', inset: 0,
        zIndex: 0,
        background: pageVignette,
        pointerEvents: 'none',
      }} />

      <button
        onClick={onOpenBag}
        style={{
          position: 'relative',
          zIndex: 1,
          background: landingDarkMode ? 'rgba(20,17,12,0.72)' : 'rgba(255,255,255,0.5)',
          border: `1px solid ${lineInk}`,
          borderRadius: 999,
          padding: '7px 14px',
          cursor: 'pointer',
          fontFamily: "'Cinzel', serif",
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: ink,
          boxShadow: landingDarkMode ? '0 8px 22px rgba(0,0,0,0.24)' : '0 4px 16px rgba(26,23,20,0.08)',
        }}
      >
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

      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: isMobile ? 420 : 1040,
        minHeight: isMobile ? 'auto' : 'calc(100svh - 146px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isMobile ? 'flex-start' : 'center',
        marginTop: isMobile ? 18 : 6,
      }}>
        <div style={{
          width: '100%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
          animationDelay: '0.1s',
        }}>
          <div aria-hidden="true" style={{
            position: 'absolute',
            left: isMobile ? -24 : -52,
            right: isMobile ? -24 : -52,
            top: isMobile ? 28 : 36,
            bottom: isMobile ? 54 : 48,
            background: landingDarkMode
              ? 'radial-gradient(ellipse at center, rgba(200,168,74,0.08) 0%, rgba(20,17,12,0.22) 42%, rgba(5,4,3,0.50) 82%, transparent 100%)'
              : 'radial-gradient(ellipse at center, rgba(255,255,255,0.54) 0%, rgba(219,220,223,0.26) 48%, transparent 82%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: isMobile ? 'min(100%, 390px)' : 900,
            minHeight: isMobile ? 430 : 570,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}>
            <div aria-hidden="true" style={{
              position: 'absolute',
              left: isMobile ? -8 : 8,
              right: isMobile ? -8 : 8,
              top: isMobile ? 48 : 56,
              bottom: isMobile ? 174 : 192,
              background: `
                linear-gradient(90deg, transparent 0%, rgba(240,239,236,0.14) 8%, rgba(240,239,236,0.46) 20%, rgba(240,239,236,0.58) 50%, rgba(240,239,236,0.46) 80%, rgba(240,239,236,0.14) 92%, transparent 100%),
                linear-gradient(to bottom, transparent 0%, rgba(238,238,237,0.20) 12%, rgba(242,241,238,0.50) 28%, rgba(242,241,238,0.44) 58%, rgba(235,236,236,0.18) 86%, transparent 100%)
              `,
              boxShadow: '0 14px 42px rgba(26,23,20,0.05)',
              pointerEvents: 'none',
            }} />
            <div aria-hidden="true" style={{
              position: 'absolute',
              left: isMobile ? 10 : 24,
              right: isMobile ? 10 : 24,
              top: isMobile ? 44 : 52,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(200,168,74,0.44), transparent)',
            }} />
            <div aria-hidden="true" style={{
              position: 'absolute',
              left: isMobile ? 10 : 24,
              right: isMobile ? 10 : 24,
              bottom: isMobile ? 96 : 116,
              height: 1,
              background: 'linear-gradient(90deg, transparent, rgba(200,168,74,0.30), transparent)',
            }} />
            <SyntarionLogo size={isMobile ? 204 : 318} darkMode={false} useHeroVideo isMobile={isMobile} />
          </div>

          <div style={{
            marginTop: isMobile ? -6 : -8,
            marginBottom: isMobile ? 22 : 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: ink,
            fontFamily: "'Cinzel', serif",
            fontSize: isMobile ? 9 : 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            opacity: 0.9,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'rgba(244,243,240,0.54)',
            textShadow: '0 1px 8px rgba(255,255,255,0.92)',
          }}>
            <span>Soteria</span>
            <span style={{ width: 4, height: 4, border: `1px solid ${lineInk}`, transform: 'rotate(45deg)' }} />
            <span>178 E.U.</span>
          </div>
        </div>

        <div style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          maxWidth: isMobile ? 360 : 680,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))',
          gap: isMobile ? 9 : 8,
          animation: 'fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) both',
          animationDelay: '0.45s',
        }}>
          {buttons.map(btn => {
            const isHovered = hoveredBtn === btn.id;
            const isPrimary = btn.primary;
            const bgColor = isPrimary
              ? (isHovered ? (landingDarkMode ? 'rgba(45,38,28,0.96)' : '#1a1714') : (landingDarkMode ? 'rgba(31,26,19,0.94)' : '#2a2420'))
              : (isHovered ? (landingDarkMode ? 'rgba(240,238,235,0.075)' : 'rgba(26,23,20,0.07)') : (landingDarkMode ? 'rgba(20,17,12,0.62)' : 'rgba(255,255,255,0.36)'));
            const borderColor = isPrimary
              ? (landingDarkMode ? 'rgba(200,168,74,0.72)' : '#2a2420')
              : (isHovered ? (landingDarkMode ? 'rgba(200,168,74,0.38)' : 'rgba(26,23,20,0.24)') : lineInk);
            const labelColor = isPrimary ? '#f0eeeb' : ink;
            const subColor = isPrimary ? (landingDarkMode ? 'rgba(226,207,145,0.72)' : 'rgba(240,238,235,0.5)') : mutedInk;

            return (
              <button
                key={btn.id}
                onClick={btn.onClick}
                onMouseEnter={() => setHoveredBtn(btn.id)}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: 3,
                  padding: isMobile ? '12px 18px' : '12px 14px',
                  minHeight: isMobile ? (isPrimary ? 62 : 54) : 70,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: isMobile ? 'row' : 'column',
                  alignItems: isMobile ? 'center' : 'flex-start',
                  justifyContent: isMobile ? 'space-between' : 'center',
                  gap: 6,
                  transition: 'all 0.18s ease',
                  boxShadow: isPrimary ? '0 10px 28px rgba(0,0,0,0.28)' : 'none',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                  width: '100%',
                }}
              >
                {isHovered && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(200,168,74,0.16), transparent 56%)', pointerEvents: 'none' }} />}
                <div style={{ textAlign: isMobile ? 'left' : 'center', width: '100%', position: 'relative', zIndex: 1 }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: isMobile ? 11 : 10,
                    fontWeight: 700,
                    letterSpacing: isMobile ? '0.20em' : '0.16em',
                    color: labelColor,
                    marginBottom: 3,
                    whiteSpace: 'nowrap',
                  }}>{btn.label}</div>
                  <div style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: isMobile ? 9 : 8,
                    color: subColor,
                    letterSpacing: '0.02em',
                    whiteSpace: isMobile ? 'normal' : 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {btn.id === 'play' && loading ? (
                       <div className="loader" style={{ width: 12, height: 12, display: 'inline-block', verticalAlign: 'middle' }}></div>
                    ) : btn.sub}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        marginTop: isMobile ? 22 : 22,
        maxWidth: isMobile ? 'min(100%, 360px)' : 780,
        textAlign: 'center',
        fontFamily: "'Cinzel', serif", fontSize: isMobile ? 8 : 9,
        fontWeight: 700,
        lineHeight: 1.55,
        letterSpacing: isMobile ? '0.13em' : '0.18em',
        color: 'rgba(5,4,3,0.62)',
        textTransform: 'uppercase',
        padding: isMobile ? '6px 10px' : '7px 16px',
        borderRadius: 999,
        background: 'rgba(244,243,240,0.48)',
        textShadow: '0 1px 8px rgba(255,255,255,0.9)',
        animation: 'fadeUp 1.2s cubic-bezier(0.16,1,0.3,1) both',
        animationDelay: '0.9s',
      }}>
        Developed by Adrian 'Radar Theory' Gilmore and Jacob 'Jake' Homer. &copy; 2026 TheonhexMedia &amp; Publishing. All rights reserved.
      </div>

      <ScribeLite />

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



