import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';

// ─── LEGAL VERSION ───────────────────────────────────────────────────────────
// Bump this string whenever TERMS_OF_SERVICE.md or EULA.md are materially
// updated. Every user will be re-prompted to accept on their next visit.
export const LEGAL_VERSION = '2026-07-06';

const DOCS = {
  tos:     { label: 'Terms of Service', path: `/legal/TERMS_OF_SERVICE.md?v=${LEGAL_VERSION}`, acceptance: true },
  eula:    { label: 'EULA',             path: `/legal/EULA.md?v=${LEGAL_VERSION}`,             acceptance: true },
  privacy: { label: 'Privacy Policy',   path: `/legal/PRIVACY_POLICY.md?v=${LEGAL_VERSION}`,   acceptance: false },
  ai:      { label: 'AI Disclosure',    path: `/legal/AI_DISCLOSURE.md?v=${LEGAL_VERSION}`,    acceptance: false },
  credits: { label: 'Credits',          path: `/legal/CREDITS.md?v=${LEGAL_VERSION}`,          acceptance: false },
};

// ─── MINIMAL MARKDOWN RENDER ─────────────────────────────────────────────────
function Inline({ text }) {
  const clean = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  return clean.split('**').map((part, i) =>
    i % 2
      ? <strong key={i}>{part}</strong>
      : part.split('*').map((seg, j) => (j % 2 ? <em key={`${i}-${j}`}>{seg}</em> : seg))
  );
}

function Markdown({ text }) {
  const ink = 'rgba(240,238,235,0.82)';
  const muted = 'rgba(240,238,235,0.45)';
  return text.split('\n').map((line, i) => {
    const t = line.trim();
    if (t === '---') return <hr key={i} style={{ border: 'none', borderTop: '1px solid rgba(240,238,235,0.1)', margin: '18px 0' }} />;
    if (t.startsWith('# ')) return <div key={i} style={{ fontFamily: "'Cinzel', serif", fontSize: 17, fontWeight: 700, letterSpacing: '0.06em', color: '#f0eeeb', margin: '6px 0 10px' }}><Inline text={t.slice(2)} /></div>;
    if (t.startsWith('## ')) return <div key={i} style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f0eeeb', margin: '20px 0 8px' }}><Inline text={t.slice(3)} /></div>;
    if (t.startsWith('> ')) return <div key={i} style={{ borderLeft: '2px solid rgba(240,238,235,0.2)', paddingLeft: 12, fontStyle: 'italic', fontSize: 12, color: muted, margin: '8px 0' }}><Inline text={t.slice(2)} /></div>;
    if (t.startsWith('- ')) return <div key={i} style={{ fontSize: 12, color: ink, lineHeight: 1.7, paddingLeft: 14 }}>• <Inline text={t.slice(2)} /></div>;
    if (t === '') return <div key={i} style={{ height: 6 }} />;
    return <div key={i} style={{ fontSize: 12, color: ink, lineHeight: 1.7 }}><Inline text={t} /></div>;
  });
}

// ─── LEGAL GATE ──────────────────────────────────────────────────────────────
// Blocking mode:  <LegalGate user={user} onAccept={...} />
// Read-only mode: <LegalGate readOnly initialTab="tos" onClose={...} />
export default function LegalGate({ user, onAccept, readOnly = false, initialTab = 'tos', onClose }) {
  const [tab, setTab] = useState(initialTab);
  const [docs, setDocs] = useState({ tos: null, eula: null, privacy: null, ai: null, credits: null });
  const [agreed, setAgreed] = useState({ tos: false, eula: false });
 const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const scrollRef = useRef(null);
  const scrollPos = useRef({ tos: 0, eula: 0 });

  // restore this tab's saved scroll position when switching
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollPos.current[tab] || 0;
  }, [tab]);

  useEffect(() => {
    Promise.all(
      Object.entries(DOCS).map(([key, d]) =>
        fetch(d.path)
          .then(r => (r.ok ? r.text() : ''))
          .then(text => {
            const t = text.trimStart().toLowerCase();
            const isHtml = !text || t.startsWith('<!doctype') || t.startsWith('<html');
            return [key, isHtml ? 'Document unavailable. Contact contact@theonhexmedia.com.' : text];
          })
          .catch(() => [key, 'Document unavailable. Contact contact@theonhexmedia.com.'])
      )
    ).then(entries => setDocs(Object.fromEntries(entries)));
  }, []);

  const recordAcceptance = async () => {
    if (!user?.id || saving) return;
    setSaving(true);
    setFailed(false);
    const { error } = await supabase
      .from('legal_acceptances')
      .insert({ user_id: user.id, version: LEGAL_VERSION });
    setSaving(false);
    // 23505 = already accepted this version (duplicate) — treat as success
    if (!error || error.code === '23505') onAccept();
    else setFailed(true);
  };

  const agreeCurrent = () => {
    const next = { ...agreed, [tab]: true };
    setAgreed(next);
    if (next.tos && next.eula) {
      recordAcceptance();
    } else {
      // light up and jump to the document still awaiting agreement
      setTab(tab === 'tos' ? 'eula' : 'tos');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,8,6,0.82)',
      backdropFilter: 'blur(6px)',
      zIndex: 3000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Georgia, serif',
    }}>
      <div style={{
        background: '#13100d',
        border: '1px solid rgba(240,238,235,0.12)',
        borderRadius: 14,
        width: '100%', maxWidth: 640,
        maxHeight: '86vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '22px 28px 0', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.28em', color: 'rgba(240,238,235,0.4)', textTransform: 'uppercase', marginBottom: 6 }}>
            Theonhex Media & Publishing
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 19, fontWeight: 700, color: '#f0eeeb', letterSpacing: '0.06em' }}>
            {readOnly ? 'Legal Documents' : 'Before You Enter Soteria'}
          </div>
          {!readOnly && (
            <div style={{ fontSize: 11.5, color: 'rgba(240,238,235,0.4)', fontStyle: 'italic', marginTop: 6, lineHeight: 1.6 }}>
              Please review and accept the Terms of Service and End User<br />License Agreement.
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '16px 28px 0' }}>
          {Object.entries(DOCS).filter(([, d]) => readOnly || d.acceptance).map(([key, d]) => {
            const isAgreed = !readOnly && agreed[key];
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  flex: '1 1 30%',
                  background: isAgreed ? 'rgba(212,185,78,0.10)' : tab === key ? 'rgba(240,238,235,0.08)' : 'transparent',
                  border: `1px solid ${isAgreed ? 'rgba(212,185,78,0.55)' : tab === key ? 'rgba(240,238,235,0.25)' : 'rgba(240,238,235,0.1)'}`,
                  borderRadius: 8, padding: '9px 0',
                  color: isAgreed ? '#d4b94e' : tab === key ? '#f0eeeb' : 'rgba(240,238,235,0.4)',
                  fontFamily: "'Cinzel', serif", fontSize: 10,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  fontWeight: tab === key || isAgreed ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >{isAgreed ? '✓ ' : ''}{d.label}</button>
            );
          })}
        </div>

        {/* Document body */}
        <div
          ref={scrollRef}
          onScroll={e => { scrollPos.current[tab] = e.currentTarget.scrollTop; }}
          style={{
          flex: 1, overflowY: 'auto',
          margin: '14px 28px',
          padding: '16px 18px',
          background: 'rgba(240,238,235,0.03)',
          border: '1px solid rgba(240,238,235,0.08)',
          borderRadius: 10,
        }}>
          {docs[tab] === null
            ? <div style={{ fontSize: 12, color: 'rgba(240,238,235,0.35)', fontStyle: 'italic', textAlign: 'center', padding: 24 }}>Unsealing the archives…</div>
            : <Markdown text={docs[tab]} />}
        </div>

        {/* Footer */}
        <div style={{ padding: '0 28px 22px' }}>
          {failed && (
            <div style={{ fontSize: 11, color: '#ef4444', textAlign: 'center', marginBottom: 10, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Could not record acceptance. Check your connection and try again.
            </div>
          )}
          {readOnly ? (
            <button onClick={onClose} style={{
              width: '100%', background: 'rgba(240,238,235,0.06)',
              border: '1px solid rgba(240,238,235,0.18)', borderRadius: 8,
              padding: '12px 0', color: '#f0eeeb', fontSize: 11,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: "'Cinzel', serif", fontWeight: 700,
            }}>Close</button>
          ) : (
            <>
              <button onClick={agreeCurrent} disabled={saving || agreed[tab]} style={{
                width: '100%',
                background: agreed[tab] ? 'rgba(212,185,78,0.10)' : 'rgba(240,238,235,0.09)',
                border: `1px solid ${agreed[tab] ? 'rgba(212,185,78,0.55)' : 'rgba(240,238,235,0.25)'}`,
                borderRadius: 8,
                padding: '13px 0', color: agreed[tab] ? '#d4b94e' : '#f0eeeb', fontSize: 12,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                cursor: saving || agreed[tab] ? 'default' : 'pointer',
                opacity: saving ? 0.6 : 1,
                fontFamily: "'Cinzel', serif", fontWeight: 700,
              }}>
                {saving ? 'Sealing the pact…'
                  : agreed[tab] ? `✓ ${DOCS[tab].label} Accepted`
                  : `I Agree to the ${DOCS[tab].label}`}
              </button>
              <div style={{ fontSize: 10, color: 'rgba(240,238,235,0.28)', textAlign: 'center', marginTop: 10, fontStyle: 'italic' }}>
                Version {LEGAL_VERSION} · {(agreed.tos ? 1 : 0) + (agreed.eula ? 1 : 0)} of 2 accepted · Both documents must be accepted to enter.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}