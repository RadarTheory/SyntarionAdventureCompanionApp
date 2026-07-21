import { useEffect, useState } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import LegalGate from './LegalGate';
import { getPWAInstallState, promptPWAInstall, subscribePWAInstall } from './pwaInstall';
import { getAudioSettings, saveAudioSettings, subscribeAudioSettings } from './audioSettings';
import musicEngine from './musicEngine';

export default function Settings({ user, darkMode, setDarkMode, onHome }) {
  const [displayName, setDisplayName] = useState(user?.user_metadata?.nickname || user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '');
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
  const [supportFiles, setSupportFiles] = useState([]);
  const [supportFileError, setSupportFileError] = useState('');
  const [audioSettings, setAudioSettings] = useState(getAudioSettings);

  const ink = darkMode ? '#f4f0e8' : '#16110b';
  const bg = darkMode ? '#0f0d09' : '#eef0ee';
  const muted = darkMode ? 'rgba(244,240,232,0.66)' : 'rgba(38,31,22,0.62)';
  const border = darkMode ? 'rgba(223,206,169,0.16)' : 'rgba(73,62,48,0.14)';
  const borderMid = darkMode ? 'rgba(223,206,169,0.28)' : 'rgba(112,91,60,0.25)';
  const sectionColor = darkMode ? '#d7bd78' : '#8b6a2b';
  const pageVars = {
    '--settings-bg': bg,
    '--settings-ink': ink,
    '--settings-muted': muted,
    '--settings-card': darkMode ? 'rgba(29,24,18,0.76)' : 'rgba(255,255,255,0.64)',
    '--settings-card-strong': darkMode ? 'rgba(39,32,24,0.9)' : 'rgba(255,255,255,0.82)',
    '--settings-field': darkMode ? 'rgba(10,8,6,0.46)' : 'rgba(255,255,255,0.62)',
    '--settings-line': border,
    '--settings-line-strong': borderMid,
    '--settings-gold': sectionColor,
    '--settings-gold-soft': darkMode ? 'rgba(200,168,74,0.13)' : 'rgba(200,168,74,0.16)',
    '--settings-shadow': darkMode ? '0 24px 70px rgba(0,0,0,0.34)' : '0 24px 70px rgba(55,45,32,0.14)',
    '--settings-pill': darkMode ? 'rgba(244,240,232,0.08)' : 'rgba(255,255,255,0.72)',
  };
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
    await supabase.auth.updateUser({ data: { nickname: displayName, display_name: displayName } });
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

  const handleSupportFiles = (event) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const oversized = imageFiles.find(file => file.size > 6 * 1024 * 1024);

    if (oversized) {
      setSupportFileError('Screenshots must be under 6 MB each.');
      event.target.value = '';
      return;
    }

    setSupportFileError(files.length !== imageFiles.length ? 'Only image files were added.' : '');
    setSupportFiles(prev => [...prev, ...imageFiles].slice(0, 4));
    event.target.value = '';
  };

  const removeSupportFile = (index) => {
    setSupportFiles(prev => prev.filter((_, i) => i !== index));
    setSupportFileError('');
  };

  const uploadSupportScreenshots = async () => {
    const uploaded = [];
    const failed = [];
    const owner = user?.id || 'anonymous';
    const stamp = Date.now();

    for (const [index, file] of supportFiles.entries()) {
      const safeName = file.name.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || `screenshot-${index + 1}.png`;
      const storagePath = `support/${owner}/${stamp}-${index + 1}-${safeName}`;
      const { error } = await supabase.storage.from('dm_assets').upload(storagePath, file, {
        upsert: true,
        contentType: file.type || 'image/png',
      });

      if (error) {
        failed.push({ name: file.name, size: file.size, error: error.message });
        continue;
      }

      const { data } = supabase.storage.from('dm_assets').getPublicUrl(storagePath);
      uploaded.push({ name: file.name, size: file.size, type: file.type, path: storagePath, url: data?.publicUrl || null });
    }

    return { uploaded, failed };
  };

  const handleSupportSubmit = async () => {
    const subject = supportSubject.trim();
    const message = supportMessage.trim();
    if (!subject || !message || supportSending) return;

    setSupportSending(true);
    setSupportStatus('');
    const screenshotResult = supportFiles.length ? await uploadSupportScreenshots() : { uploaded: [], failed: [] };
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
        screenshots: screenshotResult.uploaded,
        screenshot_upload_failures: screenshotResult.failed,
      },
    });

    setSupportSending(false);
    if (error) {
      setSupportStatus(`Could not send: ${error.message}`);
      return;
    }

    setSupportSubject('');
    setSupportMessage('');
    setSupportFiles([]);
    setSupportFileError('');
    setSupportStatus(screenshotResult.failed.length ? 'Report sent. Some screenshots could not upload.' : 'Report sent. Thank you.');
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
    <div className={`settings-page ${darkMode ? 'settings-dark' : 'settings-light'}`} style={pageVars}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .settings-page {
          min-height: 100vh;
          color: var(--settings-ink);
          font-family: Georgia, serif;
          background:
            radial-gradient(circle at 50% 8%, rgba(255,255,255,0.55), transparent 34%),
            linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0)),
            var(--settings-bg);
          position: relative;
          overflow-x: hidden;
        }
        .settings-dark {
          background:
            radial-gradient(circle at 50% 0%, rgba(200,168,74,0.08), transparent 36%),
            radial-gradient(circle at 88% 18%, rgba(255,255,255,0.06), transparent 30%),
            var(--settings-bg);
        }
        .settings-page::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: url('/Maps/Avalora.png');
          background-position: center top;
          background-size: cover;
          opacity: 0.12;
          filter: saturate(0.75);
          mix-blend-mode: multiply;
        }
        .settings-dark::before { opacity: 0.07; mix-blend-mode: screen; }
        .settings-shell {
          position: relative;
          z-index: 1;
          width: min(1160px, calc(100vw - 36px));
          margin: 0 auto;
          padding: 14px 0 42px;
        }
        .settings-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-bottom: 10px;
        }
        .settings-back, .settings-chip, .settings-button, .settings-link, .settings-legal-link, .settings-submit {
          font-family: 'Cinzel', serif;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .settings-back {
          border: 1px solid transparent;
          background: transparent;
          color: var(--settings-gold);
          font-size: 10px;
          padding: 10px 0;
          cursor: pointer;
        }
        .settings-chip {
          border: 1px solid var(--settings-line);
          background: var(--settings-pill);
          color: var(--settings-muted);
          border-radius: 999px;
          padding: 6px 11px;
          font-size: 8px;
          box-shadow: 0 10px 28px rgba(0,0,0,0.08);
          backdrop-filter: blur(16px);
        }
        .settings-hero {
          border: 1px solid var(--settings-line);
          background: linear-gradient(135deg, var(--settings-card-strong), var(--settings-card));
          box-shadow: 0 16px 44px rgba(0,0,0,0.18);
          backdrop-filter: blur(22px);
          padding: clamp(14px, 2.4vw, 22px);
          margin-bottom: 12px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: center;
        }
        .settings-kicker, .settings-section-kicker, .settings-field-label, .settings-state {
          font-family: 'Cinzel', serif;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }
        .settings-kicker { color: var(--settings-gold); font-size: 9px; margin-bottom: 10px; }
        .settings-title {
          font-family: 'Cinzel', serif;
          font-size: clamp(28px, 3.8vw, 44px);
          line-height: 0.92;
          letter-spacing: 0.12em;
          margin: 0;
          text-shadow: 0 1px 0 rgba(255,255,255,0.38);
        }
        .settings-subtitle { margin: 8px 0 0; color: var(--settings-muted); font-size: 12px; line-height: 1.55; max-width: 610px; font-style: italic; }
        .settings-status-card {
          min-width: 190px;
          border: 1px solid var(--settings-line);
          background: var(--settings-pill);
          padding: 12px;
          backdrop-filter: blur(18px);
        }
        .settings-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
          gap: 14px;
          align-items: start;
        }
        .settings-stack { display: grid; gap: 14px; }
        .settings-card {
          border: 1px solid var(--settings-line);
          background: linear-gradient(180deg, var(--settings-card-strong), var(--settings-card));
          box-shadow: 0 16px 44px rgba(0,0,0,0.18);
          backdrop-filter: blur(20px);
          padding: 16px 18px;
        }
        .settings-card, .settings-hero, .settings-status-card { border-radius: 8px; }
        .settings-section-kicker {
          color: var(--settings-gold);
          font-size: 8px;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .settings-section-kicker::after { content: ''; height: 1px; flex: 1; background: var(--settings-line); }
        .settings-row { display: flex; justify-content: space-between; gap: 18px; align-items: center; }
        .settings-row + .settings-row, .settings-control + .settings-control { border-top: 1px solid var(--settings-line); padding-top: 12px; margin-top: 12px; }
        .settings-name { font-family: 'Cinzel', serif; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 4px; }
        .settings-copy { color: var(--settings-muted); font-size: 11px; font-style: italic; line-height: 1.45; }
        .settings-state { color: var(--settings-muted); font-size: 8px; }
        .settings-toggle {
          width: 50px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid var(--settings-line-strong);
          background: rgba(126,115,98,0.22);
          padding: 3px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .settings-toggle[data-on='true'] { background: rgba(126,170,132,0.72); border-color: rgba(220,246,223,0.44); }
        .settings-toggle-knob { width: 20px; height: 20px; border-radius: 999px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.22); transform: translateX(0); transition: transform 0.2s ease; }
        .settings-toggle[data-on='true'] .settings-toggle-knob { transform: translateX(21px); }
        .settings-button, .settings-link, .settings-submit {
          border: 1px solid var(--settings-line-strong);
          background: var(--settings-pill);
          color: var(--settings-ink);
          border-radius: 7px;
          padding: 10px 16px;
          font-size: 9px;
          cursor: pointer;
          text-decoration: none;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
          white-space: nowrap;
        }
        .settings-button:hover, .settings-link:hover, .settings-submit:hover, .settings-legal-link:hover { border-color: var(--settings-gold); background: var(--settings-gold-soft); }
        .settings-button:active, .settings-submit:active { transform: translateY(1px); }
        .settings-button[data-active='true'], .settings-submit[data-ready='true'] { color: var(--settings-gold); border-color: rgba(200,168,74,0.55); background: var(--settings-gold-soft); }
        .settings-button:disabled, .settings-submit:disabled { cursor: default; opacity: 0.55; }
        .settings-field-label { color: var(--settings-muted); font-size: 8px; margin-bottom: 8px; display: block; }
        .settings-input, .settings-select, .settings-textarea {
          width: 100%;
          border: 1px solid var(--settings-line);
          background: var(--settings-field);
          color: var(--settings-ink);
          border-radius: 7px;
          padding: 11px 12px;
          font: 13px Georgia, serif;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .settings-input:focus, .settings-select:focus, .settings-textarea:focus { border-color: rgba(200,168,74,0.62); box-shadow: 0 0 0 3px rgba(200,168,74,0.12); }
        .settings-textarea { resize: vertical; min-height: 92px; line-height: 1.5; }
        .settings-input-row { display: flex; gap: 10px; align-items: center; }
        .settings-range { width: 100%; accent-color: #c8a84a; }
        .settings-range::-webkit-slider-runnable-track { height: 5px; border-radius: 999px; background: rgba(200,168,74,0.28); }
        .settings-range::-webkit-slider-thumb { margin-top: -6px; }
        .settings-muted-note { color: var(--settings-muted); font-size: 10px; font-style: italic; line-height: 1.45; }
        .settings-status { color: var(--settings-gold); font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; margin-top: 9px; }
        .settings-status[data-error='true'] { color: ${COLORS.warn}; }
        .settings-legal-links {
          margin-top: 12px;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px 14px;
          color: var(--settings-muted);
          font-size: 10px;
          font-style: italic;
        }
        .settings-legal-link {
          border: 0;
          background: transparent;
          color: var(--settings-muted);
          padding: 0;
          font-size: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .settings-legal-link:hover { color: var(--settings-gold); background: transparent; }
        .settings-danger { border-color: rgba(190,84,72,0.42); color: ${darkMode ? COLORS.warn : '#96352d'}; }
        .settings-danger:hover { background: rgba(190,84,72,0.11); border-color: rgba(190,84,72,0.72); }
        .settings-card:hover, .settings-status-card:hover {
          transform: translateY(-1px);
          border-color: var(--settings-line-strong);
          background: linear-gradient(180deg, var(--settings-card-strong), rgba(200,168,74,0.055));
        }
        .settings-card {
          position: relative;
          overflow: hidden;
          transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
        }
        .settings-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 14px;
          bottom: 14px;
          width: 2px;
          background: linear-gradient(180deg, transparent, rgba(200,168,74,0.62), transparent);
          opacity: 0;
          transition: opacity 0.16s ease;
        }
        .settings-card:hover::before { opacity: 1; }
        .settings-audio-card { padding-bottom: 16px; }
        .settings-audio-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .settings-audio-tile {
          border: 1px solid var(--settings-line);
          background: var(--settings-field);
          border-radius: 7px;
          padding: 12px;
          cursor: pointer;
          min-height: 106px;
          transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
        }
        .settings-audio-tile:hover, .settings-audio-tile:focus-visible {
          border-color: rgba(200,168,74,0.5);
          background: var(--settings-gold-soft);
          outline: none;
        }
        .settings-audio-tile[data-active='true'] { border-color: rgba(200,168,74,0.52); }
        .settings-audio-topline { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
        .settings-mini-toggle {
          border: 1px solid rgba(200,168,74,0.42);
          border-radius: 999px;
          color: var(--settings-gold);
          font: 700 8px 'Cinzel', serif;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 5px 8px;
          flex: 0 0 auto;
        }
        .settings-audio-slider { display: block; margin-top: 14px; }
        .settings-file-drop {
          border: 1px dashed var(--settings-line-strong);
          background: var(--settings-field);
          border-radius: 7px;
          padding: 10px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .settings-file-drop:hover { border-color: rgba(200,168,74,0.58); background: var(--settings-gold-soft); }
        .settings-file-list { display: flex; flex-wrap: wrap; gap: 7px; }
        .settings-file-pill {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid var(--settings-line);
          border-radius: 999px;
          background: var(--settings-pill);
          color: var(--settings-muted);
          padding: 6px 8px 6px 10px;
          max-width: 100%;
          font-size: 10px;
        }
        .settings-file-pill button {
          border: 0;
          background: transparent;
          color: var(--settings-gold);
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0 2px;
        }
        @media (max-width: 860px) {
          .settings-shell { width: min(100vw - 28px, 620px); padding-top: 18px; }
          .settings-topbar { margin-bottom: 18px; }
          .settings-hero { grid-template-columns: 1fr; padding: 16px; }
          .settings-status-card { min-width: 0; }
          .settings-grid { grid-template-columns: 1fr; }
          .settings-row, .settings-input-row { align-items: stretch; flex-direction: column; }
          .settings-audio-grid { grid-template-columns: 1fr; }
          .settings-button, .settings-link, .settings-submit { width: 100%; text-align: center; }
        }
      `}</style>

      <main className="settings-shell">
        <div className="settings-topbar">
          <button onClick={onHome} className="settings-back">Back Home</button>
          <div className="settings-chip">Syntarion Preferences</div>
        </div>

        <section className="settings-hero">
          <div>
            <div className="settings-kicker">Syntarion</div>
            <h1 className="settings-title">Settings</h1>
            <p className="settings-subtitle">
              Tune the companion app without leaving the quiet, polished feel of the main menu.
            </p>
          </div>
          <div className="settings-status-card">
            <div className="settings-section-kicker">Profile</div>
            <div className="settings-name">{displayName || 'Soteria Traveler'}</div>
            <div className="settings-copy">{user?.email || 'Signed in account'}</div>
          </div>
        </section>

        <div className="settings-grid">
          <div className="settings-stack">
            <section className="settings-card">
              <div className="settings-section-kicker">Profile</div>
              <div className="settings-control">
                <label className="settings-field-label">Nickname</label>
                <div className="settings-input-row">
                  <input className="settings-input" value={displayName} onChange={e => { setDisplayName(e.target.value); setSaved(false); }} placeholder="Your name in Soteria" />
                  <button type="button" className="settings-button" data-active={saved} onClick={handleSaveName} disabled={saving || saved}>
                    {saved ? 'Saved' : saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-section-kicker">Display</div>
              <div className="settings-row">
                <div>
                  <div className="settings-name">{darkMode ? 'Dark Mode' : 'Light Mode'}</div>
                  <div className="settings-copy">{darkMode ? 'Currently using the darker interface.' : 'Currently using the lighter interface.'}</div>
                </div>
                <button type="button" className="settings-toggle" data-on={darkMode} onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
                  <span className="settings-toggle-knob" />
                </button>
              </div>
            </section>

            <section className="settings-card settings-audio-card">
              <div className="settings-section-kicker">Audio</div>
              <div className="settings-audio-grid">
                <div className="settings-audio-tile" data-active={audioSettings.musicEnabled} onClick={() => updateAudioSettings({ musicEnabled: !audioSettings.musicEnabled })} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') updateAudioSettings({ musicEnabled: !audioSettings.musicEnabled }); }}>
                  <div className="settings-audio-topline">
                    <div>
                      <div className="settings-name">Menu Music</div>
                      <div className="settings-copy">Soundtrack player</div>
                    </div>
                    <span className="settings-mini-toggle">{audioSettings.musicEnabled ? 'On' : 'Off'}</span>
                  </div>
                  <label className="settings-audio-slider" onClick={e => e.stopPropagation()}>
                    <span className="settings-field-label">Volume {Math.round(audioSettings.musicVolume * 100)}</span>
                    <input className="settings-range" type="range" min="0" max="1" step="0.01" value={audioSettings.musicVolume} onChange={e => updateAudioSettings({ musicVolume: Number(e.target.value), musicEnabled: true })} />
                  </label>
                </div>

                <div className="settings-audio-tile" data-active={audioSettings.soundsEnabled} onClick={() => updateAudioSettings({ soundsEnabled: !audioSettings.soundsEnabled })} role="button" tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') updateAudioSettings({ soundsEnabled: !audioSettings.soundsEnabled }); }}>
                  <div className="settings-audio-topline">
                    <div>
                      <div className="settings-name">Main Sounds</div>
                      <div className="settings-copy">Interface and combat</div>
                    </div>
                    <span className="settings-mini-toggle">{audioSettings.soundsEnabled ? 'On' : 'Off'}</span>
                  </div>
                  <label className="settings-audio-slider" onClick={e => e.stopPropagation()}>
                    <span className="settings-field-label">Volume {Math.round(audioSettings.soundsVolume * 100)}</span>
                    <input className="settings-range" type="range" min="0" max="1" step="0.01" value={audioSettings.soundsVolume} onChange={e => updateAudioSettings({ soundsVolume: Number(e.target.value), soundsEnabled: true })} />
                  </label>
                </div>
              </div>
            </section>
            <section className="settings-card">
              <div className="settings-section-kicker">Install</div>
              <div className="settings-row">
                <div>
                  <div className="settings-name">{installState.isInstalled ? 'Syntarion Installed' : 'Install Syntarion'}</div>
                  <div className="settings-copy">{installDescription}</div>
                  {installMessage && <div className="settings-status">{installMessage}</div>}
                </div>
                <button type="button" className="settings-button" data-active={installState.isInstalled} onClick={handleInstall} disabled={installState.isInstalled}>
                  {installState.isInstalled ? 'Installed' : 'Install'}
                </button>
              </div>
              {showAppleInstall && !installState.isInstalled && (
                <div className="settings-control">
                  <div className="settings-name">Apple Install Steps</div>
                  <div className="settings-copy" style={{ display: 'grid', gap: 6, marginTop: 8 }}>
                    <span>1. Open Syntarion in Safari, Chrome, Edge, Firefox, or Orion on iPhone/iPad.</span>
                    <span>2. Tap the Share button.</span>
                    <span>3. Choose Add to Home Screen.</span>
                    <span>4. Tap Add.</span>
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="settings-stack">
            <section className="settings-card">
              <div className="settings-section-kicker">Support</div>
              <div className="settings-row" style={{ marginBottom: 18 }}>
                <div>
                  <div className="settings-name">Report an Issue</div>
                  <div className="settings-copy">Send bugs, account issues, gameplay problems, or safety concerns to the admin queue.</div>
                </div>
                <a className="settings-link" href="mailto:contact@theonhexmedia.com?subject=Syntarion%20Support">Email Support</a>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <select className="settings-select" value={supportCategory} onChange={e => setSupportCategory(e.target.value)}>
                  <option value="bug">Bug or Glitch</option>
                  <option value="account">Account</option>
                  <option value="gameplay">Gameplay</option>
                  <option value="safety">Safety or Conduct</option>
                  <option value="billing">Billing or Access</option>
                  <option value="other">Other</option>
                </select>
                <input className="settings-input" value={supportSubject} onChange={e => setSupportSubject(e.target.value)} placeholder="Short summary" maxLength={120} />
                <textarea className="settings-textarea" value={supportMessage} onChange={e => setSupportMessage(e.target.value)} placeholder="What happened? Include steps, character/campaign names, or screenshots you can describe." rows={5} />
                <label className="settings-file-drop">
                  <span>
                    <span className="settings-field-label" style={{ marginBottom: 2 }}>Screenshots</span>
                    <span className="settings-muted-note">Attach up to 4 images, 6 MB each.</span>
                  </span>
                  <span className="settings-button" style={{ padding: '8px 10px' }}>Add Images</span>
                  <input type="file" accept="image/*" multiple onChange={handleSupportFiles} style={{ display: 'none' }} />
                </label>
                {(supportFiles.length > 0 || supportFileError) && (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {supportFileError && <div className="settings-status" data-error="true">{supportFileError}</div>}
                    {supportFiles.length > 0 && (
                      <div className="settings-file-list">
                        {supportFiles.map((file, index) => (
                          <span className="settings-file-pill" key={`${file.name}-${file.lastModified}-${index}`}>
                            {file.name}
                            <button type="button" onClick={() => removeSupportFile(index)} aria-label={`Remove ${file.name}`}>x</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="settings-row">
                  <div className="settings-muted-note">Reports may include your account email, page path, browser, and app context needed to investigate.</div>
                  <button type="button" className="settings-submit" data-ready={!!(supportSubject.trim() && supportMessage.trim())} onClick={handleSupportSubmit} disabled={supportSending || !supportSubject.trim() || !supportMessage.trim()}>
                    {supportSending ? 'Sending...' : 'Submit'}
                  </button>
                </div>
                {supportStatus && <div className="settings-status" data-error={supportStatus.startsWith('Could not')}>{supportStatus}</div>}
              </div>
            </section>

            <section className="settings-card">
              <div className="settings-section-kicker">Account</div>
              <div className="settings-control">
                <div className="settings-field-label">Email</div>
                <div className="settings-copy" style={{ fontStyle: 'normal', color: 'var(--settings-ink)' }}>{user?.email || '-'}</div>
              </div>
              <div className="settings-control">
                <div className="settings-field-label">Signed In With</div>
                <div className="settings-copy">Google</div>
              </div>
              <div className="settings-control">
                <button type="button" className="settings-button settings-danger" onClick={handleSignOut}>Sign Out</button>
              </div>
            </section>

          </div>
        </div>
        <div className="settings-legal-links" aria-label="Legal documents">
          <span>Legal</span>
          {[
            { id: 'tos', label: 'Terms' },
            { id: 'eula', label: 'EULA' },
            { id: 'privacy', label: 'Privacy' },
            { id: 'ai', label: 'AI Disclosure' },
            { id: 'credits', label: 'Credits' },
          ].map(doc => (
            <button key={doc.id} type="button" className="settings-legal-link" onClick={() => setLegalTab(doc.id)}>{doc.label}</button>
          ))}
        </div>
      </main>

      {legalTab && (
        <LegalGate readOnly initialTab={legalTab} onClose={() => setLegalTab(null)} />
      )}
    </div>
  );
}





