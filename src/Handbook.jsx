import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS } from './constants';

const DM_USER_ID = import.meta.env.VITE_DM_USER_ID;

export default function Handbook({ user, darkMode, onHome }) {
  const { isMobile } = useDevice();
  const [chapters, setChapters] = useState([]);
  const [activeSlug, setActiveSlug] = useState(() => localStorage.getItem('syntarion_handbook_chapter') || null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const isDM = user?.id === DM_USER_ID;

  const ink = darkMode ? COLORS.text : '#1b130a';
  const bg = darkMode ? COLORS.wizard : '#e8e1d5';
  const card = darkMode ? COLORS.card : '#fffaf1';
  const muted = darkMode ? COLORS.muted : '#655848';
  const border = darkMode ? COLORS.border : '#d0c0aa';
  const borderMid = darkMode ? COLORS.borderMid : '#9c835e';
  const sectionColor = darkMode ? COLORS.muted : '#7b5a24';
  const cardShadow = darkMode ? 'none' : '0 10px 24px rgba(52, 35, 18, 0.08)';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      const { data, error } = await supabase
        .from('handbook_chapters')
        .select('id, slug, title, subtitle, chapter_order, content, is_published')
        .order('chapter_order', { ascending: true });
      if (cancelled) return;
      if (error) {
        setLoadError(error.message);
        setLoading(false);
        return;
      }
      const list = data || [];
      setChapters(list);
      setActiveSlug(prev => (prev && list.some(c => c.slug === prev) ? prev : list[0]?.slug || null));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeSlug) localStorage.setItem('syntarion_handbook_chapter', activeSlug);
  }, [activeSlug]);

  const active = chapters.find(c => c.slug === activeSlug) || null;

  const sections = useMemo(() => {
    if (!active?.content) return [];
    return active.content
      .split('\n')
      .filter(l => /^# \S/.test(l))
      .map(l => l.replace(/^# /, '').replace(/\*/g, '').trim());
  }, [active]);

  const headingId = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const jumpTo = (text) => {
    const el = document.getElementById(headingId(text));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const mdComponents = {
    h1: ({ children }) => {
      const text = Array.isArray(children) ? children.map(c => (typeof c === 'string' ? c : c?.props?.children || '')).join('') : String(children || '');
      return (
        <h1 id={headingId(text)} style={{
          fontFamily: "'Cinzel', serif", fontSize: isMobile ? 20 : 26, fontWeight: 700,
          color: ink, letterSpacing: '0.05em', margin: '44px 0 4px',
          paddingBottom: 10, borderBottom: `1px solid ${borderMid}`, scrollMarginTop: 20,
        }}>{children}</h1>
      );
    },
    h2: ({ children }) => (
      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 16 : 19, fontWeight: 700, color: ink, letterSpacing: '0.05em', margin: '32px 0 8px' }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 style={{
        fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: sectionColor, margin: '28px 0 10px',
      }}>{children}</h3>
    ),
    p: ({ children }) => (
      <p style={{ fontSize: 14, lineHeight: 1.7, color: ink, margin: '10px 0' }}>{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote style={{
        margin: '14px 0', padding: '4px 18px', borderLeft: `2px solid ${borderMid}`,
        fontStyle: 'italic', color: muted, fontSize: 14,
      }}>{children}</blockquote>
    ),
    ul: ({ children }) => <ul style={{ paddingLeft: 22, margin: '10px 0', display: 'grid', gap: 5 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ paddingLeft: 22, margin: '10px 0', display: 'grid', gap: 5 }}>{children}</ol>,
    li: ({ children }) => <li style={{ fontSize: 13.5, lineHeight: 1.6, color: ink }}>{children}</li>,
    img: ({ src, alt }) => (
      <img src={src} alt={alt || ''} loading="lazy" style={{
        maxWidth: isMobile ? 150 : 210, height: 'auto', borderRadius: 8,
        border: `1px solid ${border}`, margin: '10px 12px 10px 0',
        display: 'inline-block', verticalAlign: 'top', boxShadow: cardShadow,
      }} />
    ),
    table: ({ children }) => (
      <div style={{ overflowX: 'auto', margin: '16px 0', border: `1px solid ${border}`, borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12.5 }}>{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th style={{
        textAlign: 'left', padding: '9px 12px', background: darkMode ? COLORS.surface : '#efe2cf',
        fontFamily: "'Cinzel', serif", fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: sectionColor, borderBottom: `1px solid ${borderMid}`, verticalAlign: 'top',
      }}>{children}</th>
    ),
    td: ({ children }) => (
      <td style={{ padding: '9px 12px', borderBottom: `1px solid ${border}`, color: ink, lineHeight: 1.55, verticalAlign: 'top' }}>{children}</td>
    ),
    hr: () => <div style={{ borderBottom: `1px solid ${border}`, margin: '24px 0' }} />,
    a: ({ href, children }) => <a href={href} style={{ color: sectionColor }}>{children}</a>,
  };

  const chapterButton = (c) => (
    <button
      key={c.slug}
      onClick={() => { setActiveSlug(c.slug); window.scrollTo({ top: 0 }); }}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
        width: '100%', textAlign: 'left', background: c.slug === activeSlug ? (darkMode ? COLORS.surface : '#efe2cf') : 'transparent',
        border: 'none', borderLeft: `2px solid ${c.slug === activeSlug ? borderMid : 'transparent'}`,
        padding: '11px 14px', cursor: 'pointer',
      }}
    >
      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: c.slug === activeSlug ? ink : muted }}>
        {c.title}
        {!c.is_published && (
          <span style={{ marginLeft: 8, fontSize: 8, letterSpacing: '0.12em', color: COLORS.warn, textTransform: 'uppercase' }}>Draft</span>
        )}
      </span>
      {c.subtitle && <span style={{ fontSize: 10, color: muted, fontStyle: 'italic' }}>{c.subtitle}</span>}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, fontFamily: 'Georgia, serif', color: ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ padding: isMobile ? '20px 20px 0' : '28px 40px 0' }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: sectionColor, padding: 0 }}>Back Home</button>
      </div>

      <div style={{ padding: isMobile ? '24px 20px 20px' : '32px 40px 24px', borderBottom: `1px solid ${border}` }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: sectionColor, marginBottom: 8 }}>
          Soteria
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 22 : 32, fontWeight: 700, color: ink, letterSpacing: '0.04em', lineHeight: 1.1 }}>
          PLAYER HANDBOOK
        </div>
      </div>

      {loading && (
        <div style={{ padding: 40, fontStyle: 'italic', color: muted }}>Opening the handbook...</div>
      )}
      {loadError && (
        <div style={{ padding: 40, color: COLORS.warn, fontSize: 13 }}>Could not load the handbook: {loadError}</div>
      )}

      {!loading && !loadError && (
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: 'flex-start' }}>
          {isMobile ? (
            <div style={{ width: '100%', padding: '16px 20px 0' }}>
              <select
                value={activeSlug || ''}
                onChange={e => { setActiveSlug(e.target.value); window.scrollTo({ top: 0 }); }}
                style={{ width: '100%', background: card, border: `1px solid ${border}`, borderRadius: 6, padding: '10px 12px', fontSize: 13, color: ink, fontFamily: 'Georgia, serif', outline: 'none' }}
              >
                {chapters.map(c => (
                  <option key={c.slug} value={c.slug}>{c.title}{!c.is_published ? ' (Draft)' : ''}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{
              width: 260, flexShrink: 0, position: 'sticky', top: 0, maxHeight: '100vh', overflowY: 'auto',
              padding: '24px 0 24px 24px',
            }}>
              <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden', boxShadow: cardShadow }}>
                {chapters.map(chapterButton)}
              </div>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0, padding: isMobile ? '20px 20px 60px' : '24px 40px 80px', maxWidth: 860 }}>
            {active && (
              <>
                {sections.length > 1 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {sections.map(s => (
                      <button
                        key={s}
                        onClick={() => jumpTo(s)}
                        style={{
                          background: 'transparent', border: `1px solid ${border}`, borderRadius: 20,
                          padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                          fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: sectionColor,
                        }}
                      >{s.split('|')[0].trim()}</button>
                    ))}
                  </div>
                )}
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                  {active.content}
                </ReactMarkdown>
                {isDM && !active.is_published && (
                  <div style={{ marginTop: 40, padding: '12px 16px', border: `1px dashed ${COLORS.warn}`, borderRadius: 8, fontSize: 11, color: muted, fontStyle: 'italic' }}>
                    Draft chapter — visible only to the Architect. Publish via the handbook_chapters table (is_published).
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}