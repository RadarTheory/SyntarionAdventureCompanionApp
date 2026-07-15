import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS } from './constants';

const DM_USER_ID = import.meta.env.VITE_DM_USER_ID;

export default function HandbookBookmark({ user, darkMode }) {
  const { isMobile } = useDevice();
  const [open, setOpen] = useState(false);
  const [chapters, setChapters] = useState(null); // null = not fetched yet
  const [activeSlug, setActiveSlug] = useState(() => localStorage.getItem('syntarion_handbook_chapter') || null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null); // { title, subtitle, chapter_order, content, is_published }
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const contentRef = useRef(null);

  const isDM = user?.id === DM_USER_ID;

  const ink = darkMode ? COLORS.text : '#1b130a';
  const card = darkMode ? COLORS.card : '#fffaf1';
  const surface = darkMode ? COLORS.surface : '#f8f0e4';
  const muted = darkMode ? COLORS.muted : '#655848';
  const border = darkMode ? COLORS.border : '#d0c0aa';
  const borderMid = darkMode ? COLORS.borderMid : '#9c835e';
  const sectionColor = darkMode ? COLORS.muted : '#7b5a24';
  const drawerBg = darkMode ? COLORS.wizard : '#ede5d7';

  const fetchChapters = async () => {
    setLoadError('');
    const { data, error } = await supabase
      .from('handbook_chapters')
      .select('id, slug, title, subtitle, chapter_order, content, is_published')
      .order('chapter_order', { ascending: true });
    if (error) { setLoadError(error.message); return; }
    const list = data || [];
    setChapters(list);
    setActiveSlug(prev => (prev && list.some(c => c.slug === prev) ? prev : list[0]?.slug || null));
  };

  const handleOpen = () => {
    setOpen(true);
    if (chapters === null) fetchChapters();
  };

  useEffect(() => {
    if (activeSlug) localStorage.setItem('syntarion_handbook_chapter', activeSlug);
  }, [activeSlug]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const active = (chapters || []).find(c => c.slug === activeSlug) || null;

  const sections = useMemo(() => {
    if (!active?.content || editing) return [];
    return active.content
      .split('\n')
      .filter(l => /^# \S/.test(l))
      .map(l => l.replace(/^# /, '').replace(/\*/g, '').trim());
  }, [active, editing]);

  const headingId = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const jumpTo = (text) => {
    const root = contentRef.current;
    const el = root?.querySelector(`#hb-${headingId(text)}`);
    if (el && root) root.scrollTo({ top: el.offsetTop - root.offsetTop - 8, behavior: 'smooth' });
  };

  const startEdit = () => {
    if (!active) return;
    setDraft({
      title: active.title,
      subtitle: active.subtitle || '',
      chapter_order: active.chapter_order,
      content: active.content,
      is_published: active.is_published,
    });
    setSaveStatus('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setDraft(null); setSaveStatus(''); };

  const saveEdit = async () => {
    if (!active || !draft || saving) return;
    setSaving(true);
    setSaveStatus('');
    const payload = {
      title: draft.title.trim() || active.title,
      subtitle: draft.subtitle.trim() || null,
      chapter_order: Number(draft.chapter_order) || active.chapter_order,
      content: draft.content,
      is_published: draft.is_published,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('handbook_chapters')
      .update(payload)
      .eq('id', active.id);
    setSaving(false);
    if (error) { setSaveStatus(`Could not save: ${error.message}`); return; }
    setChapters(prev => prev
      .map(c => (c.id === active.id ? { ...c, ...payload } : c))
      .sort((a, b) => a.chapter_order - b.chapter_order));
    setSaveStatus('Saved.');
    setEditing(false);
    setDraft(null);
  };

  const mdComponents = {
    h1: ({ children }) => {
      const text = Array.isArray(children) ? children.map(c => (typeof c === 'string' ? c : c?.props?.children || '')).join('') : String(children || '');
      return (
        <h1 id={`hb-${headingId(text)}`} style={{
          fontFamily: "'Cinzel', serif", fontSize: isMobile ? 19 : 24, fontWeight: 700,
          color: ink, letterSpacing: '0.05em', margin: '38px 0 4px',
          paddingBottom: 10, borderBottom: `1px solid ${borderMid}`,
        }}>{children}</h1>
      );
    },
    h2: ({ children }) => (
      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 15 : 18, fontWeight: 700, color: ink, letterSpacing: '0.05em', margin: '28px 0 8px' }}>{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: sectionColor, margin: '24px 0 10px' }}>{children}</h3>
    ),
    p: ({ children }) => <p style={{ fontSize: 14, lineHeight: 1.7, color: ink, margin: '10px 0' }}>{children}</p>,
    blockquote: ({ children }) => (
      <blockquote style={{ margin: '14px 0', padding: '4px 18px', borderLeft: `2px solid ${borderMid}`, fontStyle: 'italic', color: muted, fontSize: 14 }}>{children}</blockquote>
    ),
    ul: ({ children }) => <ul style={{ paddingLeft: 22, margin: '10px 0', display: 'grid', gap: 5 }}>{children}</ul>,
    ol: ({ children }) => <ol style={{ paddingLeft: 22, margin: '10px 0', display: 'grid', gap: 5 }}>{children}</ol>,
    li: ({ children }) => <li style={{ fontSize: 13.5, lineHeight: 1.6, color: ink }}>{children}</li>,
    img: ({ src, alt }) => (
      <img src={src} alt={alt || ''} loading="lazy" style={{
        maxWidth: isMobile ? 140 : 200, height: 'auto', borderRadius: 8,
        border: `1px solid ${border}`, margin: '10px 12px 10px 0',
        display: 'inline-block', verticalAlign: 'top',
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

  const editField = (label, node) => (
    <div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted, marginBottom: 5 }}>{label}</div>
      {node}
    </div>
  );

  const inputStyle = {
    width: '100%', background: surface, border: `1px solid ${border}`, borderRadius: 6,
    padding: '8px 11px', fontSize: 13, color: ink, fontFamily: 'Georgia, serif', outline: 'none',
  };

  return (
    <>
      {/* ===== BOOKMARK RIBBON ===== */}
      {!open && (
        <button
          onClick={handleOpen}
          title="Player Handbook"
          style={{
            position: 'fixed', bottom: 0, right: isMobile ? 18 : 42, zIndex: 900,
            background: darkMode ? '#2a2118' : '#7b5a24',
            border: `1px solid ${borderMid}`, borderBottom: 'none',
            borderRadius: '8px 8px 0 0',
            padding: '9px 16px 13px',
            cursor: 'pointer',
            fontFamily: "'Cinzel', serif", fontSize: 9, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: darkMode ? '#c9a961' : '#f3e7cf',
            boxShadow: '0 -3px 14px rgba(0,0,0,0.35)',
            transform: 'translateY(4px)', transition: 'transform 0.18s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(4px)'; }}
        >
          ❧ Handbook
        </button>
      )}

      {/* ===== DRAWER ===== */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 950, background: 'rgba(10, 7, 4, 0.55)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: isMobile ? '92dvh' : '86vh',
              background: drawerBg,
              borderTop: `1px solid ${borderMid}`,
              borderRadius: '14px 14px 0 0',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column',
              fontFamily: 'Georgia, serif',
              animation: 'hbSlideUp 0.22s ease',
            }}
          >
            <style>{`@keyframes hbSlideUp { from { transform: translateY(40px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }`}</style>

            {/* Header */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: isMobile ? '14px 18px' : '16px 28px', borderBottom: `1px solid ${border}`, flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: sectionColor, marginBottom: 3 }}>Soteria</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 15 : 18, fontWeight: 700, color: ink, letterSpacing: '0.05em' }}>PLAYER HANDBOOK</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {isDM && active && !editing && (
                  <button onClick={startEdit} style={{
                    background: 'transparent', border: `1px solid ${borderMid}`, borderRadius: 6,
                    padding: '7px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                    fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: ink,
                  }}>Edit</button>
                )}
                <button onClick={() => setOpen(false)} style={{
                  background: 'transparent', border: `1px solid ${border}`, borderRadius: 6,
                  padding: '7px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                  fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: muted,
                }}>Close</button>
              </div>
            </div>

            {/* Chapter nav */}
            <div style={{ padding: isMobile ? '12px 18px 0' : '14px 28px 0', flexShrink: 0 }}>
              <select
                value={activeSlug || ''}
                onChange={e => {
                  if (editing) return;
                  setActiveSlug(e.target.value);
                  contentRef.current?.scrollTo({ top: 0 });
                }}
                disabled={editing}
                style={{
                  width: isMobile ? '100%' : 380, background: card, border: `1px solid ${border}`,
                  borderRadius: 6, padding: '9px 12px', fontSize: 13, color: ink,
                  fontFamily: 'Georgia, serif', outline: 'none', opacity: editing ? 0.55 : 1,
                }}
              >
                {(chapters || []).map(c => (
                  <option key={c.slug} value={c.slug}>{c.title}{!c.is_published ? ' (Draft)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Content */}
            <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '10px 18px 40px' : '12px 28px 60px' }}>
              {loadError && <div style={{ padding: '20px 0', color: COLORS.warn, fontSize: 13 }}>Could not load the handbook: {loadError}</div>}
              {!loadError && chapters === null && <div style={{ padding: '20px 0', fontStyle: 'italic', color: muted }}>Opening the handbook...</div>}

              {!editing && active && (
                <div style={{ maxWidth: 820 }}>
                  {sections.length > 1 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '6px 0 2px' }}>
                      {sections.map(s => (
                        <button key={s} onClick={() => jumpTo(s)} style={{
                          background: 'transparent', border: `1px solid ${border}`, borderRadius: 20,
                          padding: '5px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                          fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: sectionColor,
                        }}>{s.split('|')[0].trim()}</button>
                      ))}
                    </div>
                  )}
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                    {active.content}
                  </ReactMarkdown>
                  {saveStatus === 'Saved.' && (
                    <div style={{ marginTop: 16, fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>Saved.</div>
                  )}
                </div>
              )}

              {editing && draft && (
                <div style={{ maxWidth: 820, display: 'grid', gap: 14, paddingTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 2fr 90px', gap: 12 }}>
                    {editField('Title', (
                      <input value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} style={inputStyle} />
                    ))}
                    {editField('Subtitle', (
                      <input value={draft.subtitle} onChange={e => setDraft(d => ({ ...d, subtitle: e.target.value }))} style={inputStyle} />
                    ))}
                    {editField('Order', (
                      <input type="number" value={draft.chapter_order} onChange={e => setDraft(d => ({ ...d, chapter_order: e.target.value }))} style={inputStyle} />
                    ))}
                  </div>
                  {editField('Content (Markdown)', (
                    <textarea
                      value={draft.content}
                      onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
                      rows={22}
                      spellCheck={false}
                      style={{ ...inputStyle, fontFamily: 'Consolas, monospace', fontSize: 12, lineHeight: 1.55, resize: 'vertical' }}
                    />
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: draft.is_published ? COLORS.magicText : muted }}>
                      <input
                        type="checkbox"
                        checked={draft.is_published}
                        onChange={e => setDraft(d => ({ ...d, is_published: e.target.checked }))}
                        style={{ accentColor: COLORS.magic }}
                      />
                      {draft.is_published ? 'Published' : 'Draft (Architect only)'}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={cancelEdit} style={{
                        background: 'transparent', border: `1px solid ${border}`, borderRadius: 6,
                        padding: '9px 16px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                        fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted,
                      }}>Cancel</button>
                      <button onClick={saveEdit} disabled={saving} style={{
                        background: COLORS.deityBg, border: `1px solid ${COLORS.deity}`, borderRadius: 6,
                        padding: '9px 18px', cursor: saving ? 'default' : 'pointer', fontFamily: "'Cinzel', serif",
                        fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.deityText,
                        opacity: saving ? 0.6 : 1,
                      }}>{saving ? 'Saving...' : 'Save Chapter'}</button>
                    </div>
                  </div>
                  {saveStatus.startsWith('Could not') && (
                    <div style={{ fontSize: 10, color: COLORS.warn, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{saveStatus}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}