import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import remarkGfm from 'remark-gfm';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, RACES, CLASSES, GODS, SPIRITS, UNAFFILIATED, PROGRESSION } from './constants';



const LIVE_DIRECTIVE_RE = /^\s*\[\[(syntarion|supabase):([a-z_-]+)\]\]\s*$/i;

function LiveMarkdown({ content, mdComponents, active, darkMode, isMobile, theme }) {
  const parts = String(content || '').split(/(\[\[(?:syntarion|supabase):[a-z_-]+\]\])/gi);
  const hasDirective = parts.some(part => LIVE_DIRECTIVE_RE.test(part));
  const isGlossary = /glossary/i.test(active?.slug || '') || /glossary/i.test(active?.title || '');

  if (isGlossary && !hasDirective) {
    return <LiveReferenceBlock source="syntarion" kind="glossary" darkMode={darkMode} isMobile={isMobile} theme={theme} />;
  }

  return parts.map((part, index) => {
    const match = part.match(LIVE_DIRECTIVE_RE);
    if (match) {
      return <LiveReferenceBlock key={index} source={match[1].toLowerCase()} kind={match[2].toLowerCase()} darkMode={darkMode} isMobile={isMobile} theme={theme} />;
    }
    if (!part.trim()) return null;
    return (
      <ReactMarkdown key={index} remarkPlugins={[remarkGfm]} components={mdComponents}>
        {part}
      </ReactMarkdown>
    );
  });
}

function LiveReferenceBlock({ source, kind, darkMode, isMobile, theme }) {
  if (source === 'supabase') return <SupabaseReference kind={kind} isMobile={isMobile} theme={theme} />;
  if (kind === 'races') return <RaceReference isMobile={isMobile} theme={theme} />;
  if (kind === 'classes') return <ClassReference isMobile={isMobile} theme={theme} />;
  if (kind === 'beliefs' || kind === 'elements') return <BeliefReference isMobile={isMobile} theme={theme} />;
  if (kind === 'glossary') {
    return (
      <div style={{ display: 'grid', gap: 18, margin: '18px 0 34px' }}>
        <LiveBlockHeader title="Live Glossary" subtitle="Generated from the same app data used by character creation and Supabase-backed catalogs." theme={theme} />
        <RaceReference isMobile={isMobile} theme={theme} compact />
        <ClassReference isMobile={isMobile} theme={theme} compact />
        <BeliefReference isMobile={isMobile} theme={theme} compact />
      </div>
    );
  }
  return <LiveBlockHeader title="Unknown Live Block" subtitle="Supported blocks: [[syntarion:glossary]], [[syntarion:races]], [[syntarion:classes]], [[syntarion:beliefs]], [[supabase:items]], [[supabase:beasts]], [[supabase:npcs]]." theme={theme} warn />;
}

function LiveBlockHeader({ title, subtitle, theme, warn = false }) {
  return (
    <div style={{ border: '1px solid ' + (warn ? COLORS.warn : theme.borderMid), borderRadius: 8, padding: '12px 14px', background: theme.surface, margin: '14px 0' }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: warn ? COLORS.warn : theme.sectionColor, fontWeight: 700 }}>{title}</div>
      {subtitle && <div style={{ marginTop: 5, fontSize: 12, color: theme.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.55 }}>{subtitle}</div>}
    </div>
  );
}

function ReferenceGrid({ children, isMobile }) {
  return <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 10 }}>{children}</div>;
}

function ReferenceCard({ title, meta, body, theme, children }) {
  return (
    <div style={{ border: '1px solid ' + theme.border, borderRadius: 8, padding: '12px 14px', background: theme.card }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: theme.ink }}>{title}</div>
      {meta && <div style={{ marginTop: 3, fontSize: 10, color: theme.sectionColor, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{meta}</div>}
      {body && <div style={{ marginTop: 8, fontSize: 12.5, lineHeight: 1.55, color: theme.muted }}>{body}</div>}
      {children}
    </div>
  );
}

function RaceReference({ isMobile, theme, compact = false }) {
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <LiveBlockHeader title="Races" subtitle="Live from src/constants.js, the same source used by character creation." theme={theme} />
      <ReferenceGrid isMobile={isMobile}>
        {RACES.map(race => (
          <ReferenceCard key={race.id} title={race.name} meta={[race.sub, race.tag, race.sub2].filter(Boolean).join(' | ')} body={compact ? null : race.desc} theme={theme}>
            {race.variants?.length > 0 && <div style={{ marginTop: 8, fontSize: 11, color: theme.muted }}>Variants: {race.variants.join(', ')}</div>}
          </ReferenceCard>
        ))}
      </ReferenceGrid>
    </section>
  );
}

function ClassReference({ isMobile, theme, compact = false }) {
  const classes = [...CLASSES.magic.map(c => ({ ...c, track: 'Magic' })), ...CLASSES.tech.map(c => ({ ...c, track: 'Tech' }))];
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <LiveBlockHeader title="Classes" subtitle="Live from the character class constants, including current progressions where present." theme={theme} />
      <ReferenceGrid isMobile={isMobile}>
        {classes.map(cls => {
          const prog = PROGRESSION[cls.name];
          return (
            <ReferenceCard key={cls.id} title={cls.name} meta={[cls.track, cls.path, cls.disc, cls.stats].filter(Boolean).join(' | ')} theme={theme}>
              <div style={{ marginTop: 8, fontSize: 12, color: theme.muted, lineHeight: 1.55 }}>
                Tier 2: {cls.t2 || 'Unlisted'}<br />Tier 3: {cls.t3 || 'Unlisted'}
                {!compact && prog && <><br />Capstone: {prog.capstone}</>}
              </div>
            </ReferenceCard>
          );
        })}
      </ReferenceGrid>
    </section>
  );
}

function BeliefReference({ isMobile, theme, compact = false }) {
  const groups = [
    ...GODS.map(group => ({ type: 'God', label: group.label, list: group.list })),
    ...SPIRITS.map(group => ({ type: 'Spirit', label: group.label, list: group.list })),
    { type: 'Unaffiliated', label: 'Unaffiliated', list: UNAFFILIATED.map(u => ({ name: u.label, domain: u.id, affil: 'No patron', desc: u.desc })) },
  ];
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <LiveBlockHeader title="Beliefs & Elements" subtitle="Live from the belief picker: gods, spirits, elemental pairs, and unaffiliated options." theme={theme} />
      {groups.map(group => (
        <div key={group.type + group.label} style={{ display: 'grid', gap: 8 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.sectionColor, marginTop: 6 }}>{group.type} | {group.label}</div>
          <ReferenceGrid isMobile={isMobile}>
            {group.list.map(entry => (
              <ReferenceCard key={entry.name} title={entry.name} meta={[entry.domain, entry.affil].filter(Boolean).join(' | ')} body={compact ? null : entry.desc} theme={theme} />
            ))}
          </ReferenceGrid>
        </div>
      ))}
    </section>
  );
}

function SupabaseReference({ kind, isMobile, theme }) {
  const [state, setState] = useState({ loading: true, rows: [], error: '' });
  const allowed = {
    items: { table: 'items', select: 'id,name,category,description,rarity', order: 'name' },
    beasts: { table: 'beasts', select: 'id,name,category,description,threat_level,rarity', order: 'name' },
    npcs: { table: 'npcs', select: 'id,name,role,city,category,description', order: 'name' },
  };
  const config = allowed[kind];

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!config) { setState({ loading: false, rows: [], error: 'Unsupported Supabase handbook block.' }); return; }
      setState({ loading: true, rows: [], error: '' });
      const { data, error } = await supabase.from(config.table).select(config.select).order(config.order, { ascending: true }).limit(120);
      if (cancelled) return;
      if (error) setState({ loading: false, rows: [], error: error.message });
      else setState({ loading: false, rows: data || [], error: '' });
    }
    load();
    return () => { cancelled = true; };
  }, [kind]);

  if (!config) return <LiveBlockHeader title="Unknown Supabase Block" subtitle="Supported Supabase blocks: [[supabase:items]], [[supabase:beasts]], [[supabase:npcs]]." theme={theme} warn />;
  return (
    <section style={{ display: 'grid', gap: 10 }}>
      <LiveBlockHeader title={config.table} subtitle={'Live from Supabase table: ' + config.table} theme={theme} />
      {state.loading && <div style={{ color: theme.muted, fontStyle: 'italic', fontSize: 13 }}>Reading Supabase...</div>}
      {state.error && <div style={{ color: COLORS.warn, fontSize: 13 }}>Could not read {config.table}: {state.error}</div>}
      {!state.loading && !state.error && (
        <ReferenceGrid isMobile={isMobile}>
          {state.rows.map(row => (
            <ReferenceCard key={row.id || row.name} title={row.name || row.id || 'Unnamed'} meta={[row.category, row.rarity, row.threat_level, row.role, row.city].filter(Boolean).join(' | ')} body={row.description} theme={theme} />
          ))}
        </ReferenceGrid>
      )}
    </section>
  );
}

export default function HandbookBookmark({ user, darkMode, trigger = 'bookmark', openSignal = 0, allowEdit = false }) {
  const { isMobile } = useDevice();
  const [open, setOpen] = useState(false);
  const [chapters, setChapters] = useState(null); // null = not fetched yet
  const [activeSlug, setActiveSlug] = useState(() => localStorage.getItem('syntarion_handbook_chapter') || null);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null); // { title, subtitle, chapter_order, content, is_published }
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const contentRef = useRef(null);
  const fileRef = useRef(null);

  const canEdit = allowEdit === true;

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
    const rows = data || [];
    const list = canEdit
      ? rows
      : rows.filter(c => c.is_published && String(c.content || '').trim());
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
    if (!canEdit || !active) return;
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

  const cancelEdit = () => { setEditing(false); setDraft(null); setSaveStatus(''); setImportPreview(null); setImportStatus(''); };

  const parseHandbookFile = async (file) => {
    const name = file.name || 'handbook-update';
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const { value } = await mammoth.convertToMarkdown({ arrayBuffer });
      return value.trim();
    }
    if (ext === 'md' || ext === 'markdown' || ext === 'txt') return (await file.text()).trim();
    if (ext === 'xlsx' || ext === 'xls') {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      return workbook.SheetNames.map(sheetName => {
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' })
          .filter(row => row.some(cell => String(cell || '').trim()));
        if (!rows.length) return '';
        const header = rows[0].map(cell => String(cell || '').trim() || 'Column');
        const divider = header.map(() => '---');
        const bodyRows = rows.slice(1).map(row => header.map((_, i) => String(row[i] || '').replace(/\n/g, '<br>').trim()));
        const table = [header, divider, ...bodyRows].map(row => '| ' + row.join(' | ') + ' |').join('\n');
        return '# ' + sheetName + '\n\n' + table;
      }).filter(Boolean).join('\n\n');
    }
    throw new Error('Use a .docx, .md, .txt, .xlsx, or .xls file.');
  };

  const handleImportPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !draft) return;
    setImportStatus('Reading file...');
    setImportPreview(null);
    try {
      const content = await parseHandbookFile(file);
      if (!content.trim()) { setImportStatus('That document did not contain readable text.'); return; }
      setImportPreview({ name: file.name, content });
      setImportStatus('Preview ready. Review, then apply it to this chapter.');
    } catch (err) {
      setImportStatus('Import failed: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  const applyImportToDraft = () => {
    if (!importPreview) return;
    setDraft(d => ({ ...d, content: importPreview.content }));
    setImportStatus('Imported into the chapter body. Save when ready.');
  };
  const saveEdit = async () => {
    if (!canEdit || !active || !draft || saving) return;
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
      <span style={{
        display: 'block', width: 'fit-content', maxWidth: '100%',
        margin: '18px 0 20px', padding: isMobile ? 10 : 14,
        borderRadius: 10, border: `1px solid ${border}`,
        background: darkMode
          ? 'linear-gradient(145deg, rgba(240,238,235,0.09), rgba(20,17,12,0.74))'
          : 'linear-gradient(145deg, #fffaf1, #e7dccb)',
        boxShadow: darkMode ? '0 12px 28px rgba(0,0,0,0.32)' : '0 8px 20px rgba(26,23,20,0.10)',
      }}>
        <img src={src} alt={alt || ''} loading="lazy" style={{
          display: 'block', maxWidth: isMobile ? 150 : 220, width: '100%', height: 'auto',
          borderRadius: 6, objectFit: 'contain',
          background: darkMode ? '#f0eeeb' : '#fffaf1',
          filter: darkMode ? 'contrast(1.15) saturate(0.92)' : 'contrast(1.08) saturate(0.96)',
          mixBlendMode: 'normal',
        }} />
      </span>
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
      {trigger !== 'none' && !open && (
        <button
          onClick={handleOpen}
          title="Player Handbook"
          style={{
            position: 'fixed', top: 'calc(0px + env(safe-area-inset-top))', right: isMobile ? 14 : 34, zIndex: 900,
            background: darkMode ? '#2a2118' : '#7b5a24',
            border: `1px solid ${borderMid}`, borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            padding: '12px 16px 9px',
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
          Handbook
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
              position: 'absolute', top: 0, left: 0, right: 0,
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
            <style>{`@keyframes hbSlideUp { from { transform: translateY(-34px); opacity: 0.6; } to { transform: translateY(0); opacity: 1; } }`}</style>

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
                {canEdit && active && !editing && (
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
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
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
                  <LiveMarkdown
                    content={active.content}
                    mdComponents={mdComponents}
                    active={active}
                    darkMode={darkMode}
                    isMobile={isMobile}
                    theme={{ ink, card, surface, muted, border, borderMid, sectionColor }}
                  />
                  {saveStatus === 'Saved.' && (
                    <div style={{ marginTop: 16, fontSize: 10, color: COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>Saved.</div>
                  )}
                </div>
              )}

              {editing && draft && (
                <div style={{ maxWidth: 860, margin: '0 auto', display: 'grid', gap: 14, paddingTop: 8 }}>
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
                  {editField('Chapter Body', (
                    <>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                        <input ref={fileRef} type="file" accept=".docx,.md,.markdown,.txt,.xlsx,.xls" onChange={handleImportPick} style={{ display: 'none' }} />
                        <button type="button" onClick={() => fileRef.current?.click()} style={{
                          background: COLORS.magicBg, border: '1px solid ' + COLORS.magic, borderRadius: 6,
                          padding: '7px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                          fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText,
                        }}>Import Update</button>
                        <div style={{ fontSize: 10, color: muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Use files downloaded from Drive: .docx, .md, .txt, .xlsx, or .xls.</div>
                      </div>
                      {importStatus && <div style={{ fontSize: 10, color: importStatus.startsWith('Import failed') ? COLORS.warn : COLORS.archText, marginBottom: 8 }}>{importStatus}</div>}
                      {importPreview && (
                        <div style={{ border: '1px solid ' + border, borderRadius: 8, padding: 10, marginBottom: 10, background: darkMode ? 'rgba(240,238,235,0.035)' : '#f8f0e4' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', color: sectionColor, textTransform: 'uppercase' }}>{importPreview.name}</div>
                            <button type="button" onClick={applyImportToDraft} style={{ background: COLORS.deityBg, border: '1px solid ' + COLORS.deity, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.deityText }}>Apply</button>
                          </div>
                          <div style={{ maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.5, color: muted }}>{importPreview.content.slice(0, 2600)}</div>
                        </div>
                      )}
                      <textarea
                        value={draft.content}
                        onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
                        rows={22}
                        spellCheck={true}
                        placeholder="Write or import the chapter text here. Markdown headings and tables are supported."
                        style={{ ...inputStyle, fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.65, resize: 'vertical', background: darkMode ? '#1b1712' : '#fffaf1' }}
                      />
                    </>
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