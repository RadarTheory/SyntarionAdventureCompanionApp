import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDevice } from './useDevice';
import { COLORS } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function Settings({ user, darkMode, setDarkMode, onHome }) {
  const { isMobile } = useDevice();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const ink   = darkMode ? COLORS.text    : '#1a1714';
  const bg    = darkMode ? COLORS.wizard  : '#f0eeeb';
  const card  = darkMode ? COLORS.card    : '#ffffff';
  const muted = darkMode ? COLORS.muted   : 'rgba(26,23,20,0.45)';
  const border = darkMode ? COLORS.border : 'rgba(26,23,20,0.1)';
  const borderMid = darkMode ? COLORS.borderMid : 'rgba(26,23,20,0.25)';

  const handleSaveName = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { display_name: displayName } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const SectionHead = ({ children }) => (
    <div style={{
      fontFamily: "'Cinzel', serif", fontSize: 8,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: muted, marginBottom: 12, paddingBottom: 8,
      borderBottom: `1px solid ${border}`,
    }}>{children}</div>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Georgia, serif', color: ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      {/* Header */}
      <div style={{ padding: isMobile ? '20px 20px 0' : '28px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: muted, padding: 0 }}>← Home</button>
      </div>

      {/* Title */}
      <div style={{ padding: isMobile ? '24px 20px 20px' : '32px 40px 24px', borderBottom: `1px solid ${border}` }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: muted, marginBottom: 8 }}>
          Syntarion
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: ink, letterSpacing: '0.04em', lineHeight: 1.1 }}>
          SETTINGS
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '24px 20px' : '32px 40px', maxWidth: 520 }}>

        {/* ── DISPLAY ── */}
        <div style={{ marginBottom: 36 }}>
          <SectionHead>Display</SectionHead>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: ink, letterSpacing: '0.04em', marginBottom: 3 }}>
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </div>
                <div style={{ fontSize: 11, color: muted, fontStyle: 'italic' }}>
                  {darkMode ? 'Currently using dark theme.' : 'Currently using light theme.'}
                </div>
              </div>

              {/* Toggle */}
              <div
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  width: 48, height: 26, borderRadius: 13,
                  background: darkMode ? COLORS.magic : 'rgba(26,23,20,0.15)',
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 0.25s ease', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: darkMode ? 25 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.25s ease',
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── ACCOUNT ── */}
        <div style={{ marginBottom: 36 }}>
          <SectionHead>Account</SectionHead>

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden' }}>

            {/* Display name */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}` }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, fontFamily: "'Cinzel', serif", marginBottom: 8 }}>
                Display Name
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={displayName}
                  onChange={e => { setDisplayName(e.target.value); setSaved(false); }}
                  placeholder="Your name in Soteria"
                  style={{
                    flex: 1, background: darkMode ? COLORS.surface : 'rgba(26,23,20,0.04)',
                    border: `1px solid ${border}`, borderRadius: 6,
                    padding: '9px 12px', fontSize: 13,
                    color: ink, fontFamily: 'Georgia, serif',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || saved}
                  style={{
                    background: saved ? COLORS.magicBg : darkMode ? COLORS.surface : 'rgba(26,23,20,0.06)',
                    border: `1px solid ${saved ? COLORS.magic : borderMid}`,
                    borderRadius: 6, padding: '9px 16px',
                    cursor: saving ? 'default' : 'pointer',
                    fontFamily: "'Cinzel', serif", fontSize: 9,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: saved ? COLORS.magicText : ink,
                    opacity: saving ? 0.6 : 1,
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                >
                  {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>

            {/* Email */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                Email
              </div>
              <div style={{ fontSize: 13, color: muted, fontFamily: 'Georgia, serif' }}>
                {user?.email || '—'}
              </div>
            </div>

            {/* Signed in with */}
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                Signed in with
              </div>
              <div style={{ fontSize: 13, color: muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Google
              </div>
            </div>

            {/* Sign out */}
            <div style={{ padding: '16px 20px' }}>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: `1px solid ${COLORS.warn}44`,
                  borderRadius: 6, padding: '10px 20px',
                  cursor: 'pointer', fontFamily: "'Cinzel', serif",
                  fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: COLORS.warn, transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = COLORS.warnBg; e.currentTarget.style.borderColor = COLORS.warn; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = `${COLORS.warn}44`; }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
