import { useEffect, useState } from 'react';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS } from './constants';
import LegalGate from './LegalGate';
import { getPWAInstallState, promptPWAInstall, subscribePWAInstall } from './pwaInstall';
import { getAudioSettings, saveAudioSettings, subscribeAudioSettings } from './audioSettings';
import musicEngine from './musicEngine';

export default function Settings({ user, darkMode, setDarkMode, onHome }) {
  const { isMobile } = useDevice();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || user?.user_metadata?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [legalTab, setLegalTab] = useState(null);
  const [installState, setInstallState] = useState(getPWAInstallState);
  const [showAppleInstall, setShowAppleInstall] = useState(false);
  const [installMessage, setInstallMessage] = useState('');
  const [supportCategory, setSupportCategory] = useState('bug');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [supportStatus, setSupportStatus] = useState('');
  const [audioSettings, setAudioSettings] = useState(getAudioSettings);

  const ink = darkMode ? COLORS.text : '#1b130a';
  const bg = darkMode ? COLORS.wizard : '#e8e1d5';
  const card = darkMode ? COLORS.card : '#fffaf1';
  const muted = darkMode ? COLORS.muted : '#655848';
  const border = darkMode ? COLORS.border : '#d0c0aa';
  const borderMid = darkMode ? COLORS.borderMid : '#9c835e';
  const fieldBg = darkMode ? COLORS.surface : '#f8f0e4';
  const actionBg = darkMode ? COLORS.surface : '#efe2cf';
  const sectionColor = darkMode ? COLORS.muted : '#7b5a24';
  const cardShadow = darkMode ? 'none' : '0 10px 24px rgba(52, 35, 18, 0.08)';

  useEffect(() => subscribePWAInstall(setInstallState), []);
  useEffect(() => subscribeAudioSettings(setAudioSettings), []);

  const updateAudioSettings = (patch) => {
    const next = saveAudioSettings({ ...audioSettings, ...patch });
    setAudioSettings(next);
    musicEngine.setVolume(next.musicVolume);
    musicEngine.setMuted(!next.musicEnabled);
  };

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

  const handleInstall = async () => {
    setInstallMessage('');
    if (installState.platform === 'apple' || !installState.canPrompt) {
      setShowAppleInstall(true);
      return;
    }

    const result = await promptPWAInstall();
    if (result?.outcome === 'accepted') setInstallMessage('Install started.');
    else if (result?.outcome === 'dismissed') setInstallMessage('Install dismissed. You can try again here later.');
    else setShowAppleInstall(true);
  };

  const handleSupportSubmit = async () => {
    const subject = supportSubject.trim();
    const message = supportMessage.trim();
    if (!subject || !message || supportSending) return;

    setSupportSending(true);
    setSupportStatus('');
    const { error } = await supabase.from('support_reports').insert({
      user_id: user?.id || null,
      user_email: user?.email || null,
      category: supportCategory,
      subject,
      message,
      page_path: typeof window !== 'undefined' ? window.location.pathname : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      app_context: {
        display_name: displayName || null,
        install_platform: installState.platform || null,
        installed: !!installState.isInstalled,
      },
    });

    setSupportSending(false);
    if (error) {
      setSupportStatus(`Could not send: ${error.message}`);
      return;
    }

    setSupportSubject('');
    setSupportMessage('');
    setSupportStatus('Report sent. Thank you.');
  };

  const sectionHead = (children) => (
    <div style={{
      fontFamily: "'Cinzel', serif",
      fontSize: 8,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color: sectionColor,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: `1px solid ${borderMid}`,
    }}>{children}</div>
  );

  const installDescription = installState.isInstalled
    ? 'Launch Syntarion from your home screen, dock, or app launcher.'
    : installState.platform === 'apple'
      ? 'Add Syntarion to your Home Screen from Safari or your iOS browser.'
      : installState.canPrompt
        ? 'Add Syntarion to this device for an app-like launch.'
        : 'Use your browser menu to install, or open the Apple guide below.';

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Georgia, serif', color: ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ padding: isMobile ? '20px 20px 0' : '28px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: sectionColor, padding: 0 }}>Back Home</button>
      </div>

      <div style={{ padding: isMobile ? '24px 20px 20px' : '32px 40px 24px', borderBottom: `1px solid ${border}` }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: sectionColor, marginBottom: 8 }}>
          Syntarion
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: ink, letterSpacing: '0.04em', lineHeight: 1.1 }}>
          SETTINGS
        </div>
      </div>

      <div style={{ padding: isMobile ? '24px 20px' : '32px 40px', maxWidth: 520 }}>
        <div style={{ marginBottom: 36 }}>
          {sectionHead('Display')}

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '16px 20px', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: ink, letterSpacing: '0.04em', marginBottom: 3 }}>
                  {darkMode ? 'Dark Mode' : 'Light Mode'}
                </div>
                <div style={{ fontSize: 11, color: muted, fontStyle: 'italic' }}>
                  {darkMode ? 'Currently using dark theme.' : 'Currently using light theme.'}
                </div>
              </div>

              <div
                onClick={() => setDarkMode(!darkMode)}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 13,
                  background: darkMode ? COLORS.magic : '#c9bca9',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background 0.25s ease',
                  flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 3,
                  left: darkMode ? 25 : 3,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'left 0.25s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
        <div style={{ marginBottom: 36 }}>
          {sectionHead('Audio')}

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '16px 20px', boxShadow: cardShadow }}>
            <div style={{ display: 'grid', gap: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: ink, letterSpacing: '0.04em', marginBottom: 3 }}>
                    Menu Music
                  </div>
                  <div style={{ fontSize: 11, color: muted, fontStyle: 'italic' }}>
                    Controls the main screen soundtrack and library player.
                  </div>
                </div>
                <button
                  onClick={() => updateAudioSettings({ musicEnabled: !audioSettings.musicEnabled })}
                  style={{
                    background: audioSettings.musicEnabled ? COLORS.magicBg : 'transparent',
                    border: `1px solid ${audioSettings.musicEnabled ? COLORS.magic : borderMid}`,
                    borderRadius: 6,
                    padding: '9px 14px',
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: audioSettings.musicEnabled ? COLORS.magicText : ink,
                    flexShrink: 0,
                  }}
                >
                  {audioSettings.musicEnabled ? 'On' : 'Off'}
                </button>
              </div>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, fontFamily: "'Cinzel', serif" }}>
                  Music Volume {Math.round(audioSettings.musicVolume * 100)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={audioSettings.musicVolume}
                  onChange={e => updateAudioSettings({ musicVolume: Number(e.target.value), musicEnabled: true })}
                  style={{ width: '100%' }}
                />
              </label>

              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 16, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: ink, letterSpacing: '0.04em', marginBottom: 3 }}>
                    Main Sounds
                  </div>
                  <div style={{ fontSize: 11, color: muted, fontStyle: 'italic' }}>
                    Shared volume for interface, combat, and game sound effects.
                  </div>
                </div>
                <button
                  onClick={() => updateAudioSettings({ soundsEnabled: !audioSettings.soundsEnabled })}
                  style={{
                    background: audioSettings.soundsEnabled ? COLORS.magicBg : 'transparent',
                    border: `1px solid ${audioSettings.soundsEnabled ? COLORS.magic : borderMid}`,
                    borderRadius: 6,
                    padding: '9px 14px',
                    cursor: 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: audioSettings.soundsEnabled ? COLORS.magicText : ink,
                    flexShrink: 0,
                  }}
                >
                  {audioSettings.soundsEnabled ? 'On' : 'Off'}
                </button>
              </div>
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, fontFamily: "'Cinzel', serif" }}>
                  Main Sounds Volume {Math.round(audioSettings.soundsVolume * 100)}
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={audioSettings.soundsVolume}
                  onChange={e => updateAudioSettings({ soundsVolume: Number(e.target.value), soundsEnabled: true })}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 36 }}>
          {sectionHead('Install')}

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '16px 20px', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row' }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: ink, letterSpacing: '0.04em', marginBottom: 3 }}>
                  {installState.isInstalled ? 'Syntarion Installed' : 'Install Syntarion'}
                </div>
                <div style={{ fontSize: 11, color: muted, fontStyle: 'italic', lineHeight: 1.45 }}>
                  {installDescription}
                </div>
                {installMessage && (
                  <div style={{ marginTop: 8, fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {installMessage}
                  </div>
                )}
              </div>

              <button
                onClick={handleInstall}
                disabled={installState.isInstalled}
                style={{
                  background: installState.isInstalled ? COLORS.magicBg : actionBg,
                  border: `1px solid ${installState.isInstalled ? COLORS.magic : borderMid}`,
                  borderRadius: 6,
                  padding: '10px 18px',
                  cursor: installState.isInstalled ? 'default' : 'pointer',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: installState.isInstalled ? COLORS.magicText : ink,
                  flexShrink: 0,
                }}
              >
                {installState.isInstalled ? 'Installed' : 'Install'}
              </button>
            </div>

            {showAppleInstall && !installState.isInstalled && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${border}`, paddingTop: 14 }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: sectionColor, marginBottom: 8 }}>
                  Apple Install Steps
                </div>
                <div style={{ display: 'grid', gap: 7, fontSize: 12, color: muted, lineHeight: 1.45 }}>
                  <div>1. Open Syntarion in Safari, Chrome, Edge, Firefox, or Orion on iPhone/iPad.</div>
                  <div>2. Tap the Share button.</div>
                  <div>3. Choose Add to Home Screen.</div>
                  <div>4. Tap Add.</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 36 }}>
          {sectionHead('Support')}

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '16px 20px', boxShadow: cardShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', marginBottom: 14 }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: ink, letterSpacing: '0.04em', marginBottom: 3 }}>
                  Report an Issue
                </div>
                <div style={{ fontSize: 11, color: muted, fontStyle: 'italic', lineHeight: 1.45 }}>
                  Send bugs, account issues, gameplay problems, or safety concerns to the admin queue.
                </div>
              </div>
              <a
                href="mailto:contact@theonhexmedia.com?subject=Syntarion%20Support"
                style={{
                  background: 'transparent',
                  border: `1px solid ${borderMid}`,
                  borderRadius: 6,
                  padding: '10px 14px',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: ink,
                  textDecoration: 'none',
                  flexShrink: 0,
                }}
              >
                Email Support
              </a>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <select
                value={supportCategory}
                onChange={e => setSupportCategory(e.target.value)}
                style={{ background: fieldBg, border: `1px solid ${border}`, borderRadius: 6, padding: '9px 12px', fontSize: 13, color: ink, fontFamily: 'Georgia, serif', outline: 'none' }}
              >
                <option value="bug">Bug or Glitch</option>
                <option value="account">Account</option>
                <option value="gameplay">Gameplay</option>
                <option value="safety">Safety or Conduct</option>
                <option value="billing">Billing or Access</option>
                <option value="other">Other</option>
              </select>
              <input
                value={supportSubject}
                onChange={e => setSupportSubject(e.target.value)}
                placeholder="Short summary"
                maxLength={120}
                style={{ background: fieldBg, border: `1px solid ${border}`, borderRadius: 6, padding: '9px 12px', fontSize: 13, color: ink, fontFamily: 'Georgia, serif', outline: 'none' }}
              />
              <textarea
                value={supportMessage}
                onChange={e => setSupportMessage(e.target.value)}
                placeholder="What happened? Include steps, character/campaign names, or screenshots you can describe."
                rows={5}
                style={{ background: fieldBg, border: `1px solid ${border}`, borderRadius: 6, padding: '9px 12px', fontSize: 13, color: ink, fontFamily: 'Georgia, serif', outline: 'none', resize: 'vertical', lineHeight: 1.45 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row' }}>
                <div style={{ fontSize: 10, color: muted, fontStyle: 'italic', lineHeight: 1.4 }}>
                  Reports may include your account email, page path, browser, and app context needed to investigate.
                </div>
                <button
                  onClick={handleSupportSubmit}
                  disabled={supportSending || !supportSubject.trim() || !supportMessage.trim()}
                  style={{
                    background: supportSubject.trim() && supportMessage.trim() ? COLORS.deityBg : 'transparent',
                    border: `1px solid ${supportSubject.trim() && supportMessage.trim() ? COLORS.deity : border}`,
                    borderRadius: 6,
                    padding: '10px 18px',
                    cursor: supportSending || !supportSubject.trim() || !supportMessage.trim() ? 'default' : 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 9,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: supportSubject.trim() && supportMessage.trim() ? COLORS.deityText : muted,
                    opacity: supportSending ? 0.6 : 1,
                    flexShrink: 0,
                  }}
                >
                  {supportSending ? 'Sending...' : 'Submit'}
                </button>
              </div>
              {supportStatus && (
                <div style={{ fontSize: 10, color: supportStatus.startsWith('Could not') ? COLORS.warn : COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {supportStatus}
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 36 }}>
          {sectionHead('Account')}

          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', boxShadow: cardShadow }}>
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
                    flex: 1,
                    background: fieldBg,
                    border: `1px solid ${border}`,
                    borderRadius: 6,
                    padding: '9px 12px',
                    fontSize: 13,
                    color: ink,
                    fontFamily: 'Georgia, serif',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={saving || saved}
                  style={{
                    background: saved ? COLORS.magicBg : actionBg,
                    border: `1px solid ${saved ? COLORS.magic : borderMid}`,
                    borderRadius: 6,
                    padding: '9px 16px',
                    cursor: saving ? 'default' : 'pointer',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 9,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: saved ? COLORS.magicText : ink,
                    opacity: saving ? 0.6 : 1,
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  {saved ? 'Saved' : saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                Email
              </div>
              <div style={{ fontSize: 13, color: ink, fontFamily: 'Georgia, serif' }}>
                {user?.email || '-'}
              </div>
            </div>

            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${border}` }}>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, fontFamily: "'Cinzel', serif", marginBottom: 6 }}>
                Signed in with
              </div>
              <div style={{ fontSize: 13, color: ink, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
                Google
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              <button
                onClick={handleSignOut}
                style={{
                  background: 'transparent',
                  border: `1px solid ${darkMode ? `${COLORS.warn}66` : '#d38d84'}`,
                  borderRadius: 6,
                  padding: '10px 20px',
                  cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                  fontSize: 9,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: darkMode ? COLORS.warn : '#9e2f28',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = COLORS.warnBg; e.currentTarget.style.borderColor = COLORS.warn; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = darkMode ? `${COLORS.warn}44` : '#d38d84'; }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 36 }}>
          {sectionHead('Legal')}
          <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', boxShadow: cardShadow }}>
            {[
              { id: 'tos', label: 'Terms of Service' },
              { id: 'eula', label: 'End User License Agreement' },
              { id: 'privacy', label: 'Privacy Policy' },
              { id: 'ai', label: 'AI Disclosure' },
              { id: 'credits', label: 'Credits' },
            ].map((doc, i, arr) => (
              <button
                key={doc.id}
                onClick={() => setLegalTab(doc.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: 'transparent',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: i < arr.length - 1 ? `1px solid ${border}` : 'none',
                  padding: '14px 20px',
                  textAlign: 'left',
                }}
              >
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: ink }}>{doc.label}</span>
                <span style={{ fontSize: 13, color: sectionColor }}>Open</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {legalTab && (
        <LegalGate readOnly initialTab={legalTab} onClose={() => setLegalTab(null)} />
      )}
    </div>
  );
}





