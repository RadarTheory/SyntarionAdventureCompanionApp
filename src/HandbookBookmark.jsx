import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import remarkGfm from 'remark-gfm';
import supabase from './lib/supabase';
import { useDevice } from './useDevice';
import { COLORS, RACES, CLASSES, GODS, SPIRITS, UNAFFILIATED, PROGRESSION } from './constants';



const LIVE_DIRECTIVE_RE = /^\s*\[\[(syntarion|supabase):([a-z_-]+)\]\]\s*$/i;
// Create this bucket in the Supabase dashboard (Storage -> New bucket ->
// "handbook_pdfs", Public bucket OFF) to get real access control on handbook
// PDFs. Until it exists, uploads fall back to the existing public buckets
// below (same as before), so nothing breaks in the meantime.
const HANDBOOK_PDF_BUCKET = 'handbook_pdfs';
const HANDBOOK_HTML_PREFIX = '<!-- syntarion:handbook-html -->';
const HANDBOOK_PDF_PREFIX = '<!-- syntarion:handbook-pdf -->';
const HANDBOOK_TRANSPARENT_IMAGES_FLAG = '<!-- syntarion:transparent-images -->';
const HANDBOOK_FULL_PDF_SLUG = '00-full-handbook-pdf';
const HANDBOOK_DEFAULT_PDF_PAGE_COUNT = 97;

function slugifyHandbookTitle(title) {
  return String(title || 'chapter')
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'chapter';
}

function normalizeHandbookLine(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function handbookTitleCase(value) {
  return String(value || '').toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
}

function looksLikeHandbookSubhead(line) {
  const text = String(line || '').trim();
  if (text.length < 4 || text.length > 90) return false;
  if (/^\d+$/.test(text)) return false;
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length < 3) return false;
  return text === text.toUpperCase();
}

function markdownFromHandbookLines(title, lines) {
  const body = lines
    .map(line => String(line || '').trim())
    .filter(line => line && !/^\d+$/.test(line))
    .filter((line, index) => index !== 0 || normalizeHandbookLine(line) !== normalizeHandbookLine(title))
    .map(line => looksLikeHandbookSubhead(line) ? '## ' + handbookTitleCase(line) : line);
  return ['# ' + title, ...body].join('\n\n').trim();
}

function cleanHandbookTitle(title) {
  return String(title || '')
    .replace(/^\d+\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitHandbookRawText(rawText) {
  const lines = String(rawText || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const tocStart = lines.findIndex(line => normalizeHandbookLine(line) === 'glossary');
  const tocEnd = lines.findIndex((line, index) => index > tocStart && /^Page numbers/i.test(line));
  if (tocStart < 0 || tocEnd < 0) throw new Error('Could not find the handbook table of contents.');

  const tocLines = lines.slice(tocStart + 1, tocEnd);
  const entries = [];
  for (let i = 0; i < tocLines.length; i++) {
    const combined = tocLines[i].match(/^(\d+)\s+(.+)$/);
    if (combined) {
      entries.push({ order: Number(combined[1]), title: cleanHandbookTitle(combined[2]) });
      continue;
    }
    const numberOnly = tocLines[i].match(/^(\d+)$/);
    if (numberOnly && tocLines[i + 1] && !/^\d+/.test(tocLines[i + 1])) {
      entries.push({ order: Number(numberOnly[1]), title: cleanHandbookTitle(tocLines[i + 1]) });
      i += 1;
    }
  }
  if (!entries.length) throw new Error('No numbered handbook chapters were found in the table of contents.');

  const contentLines = lines.slice(tocEnd + 1);
  let cursor = 0;
  const starts = entries.map(entry => {
    const wanted = normalizeHandbookLine(entry.title);
    let index = contentLines.findIndex((line, i) => i >= cursor && normalizeHandbookLine(line) === wanted);
    if (index < 0) index = contentLines.findIndex((line, i) => i >= cursor && normalizeHandbookLine(line).includes(wanted));
    if (index >= 0) cursor = index + 1;
    return { ...entry, index };
  }).filter(entry => entry.index >= 0);
  if (!starts.length) throw new Error('The TOC was found, but the document body could not be matched to chapters.');

  return starts.map((entry, i) => {
    const next = starts[i + 1]?.index ?? contentLines.length;
    const chapterLines = contentLines.slice(entry.index, next);
    return {
      slug: String(entry.order).padStart(2, '0') + '-' + slugifyHandbookTitle(entry.title),
      title: entry.title,
      subtitle: 'Soteria Player Handbook | Syntarion Edition',
      chapter_order: entry.order,
      content: markdownFromHandbookLines(entry.title, chapterLines),
      is_published: true,
    };
  });
}

function findHandbookChapter(parsed, active) {
  if (!active) return null;
  const activeSlug = slugifyHandbookTitle(active.slug || active.title);
  const activeTitle = normalizeHandbookLine(active.title);
  return parsed.find(chapter => chapter.slug === active.slug)
    || parsed.find(chapter => slugifyHandbookTitle(chapter.title) === activeSlug)
    || parsed.find(chapter => normalizeHandbookLine(chapter.title) === activeTitle)
    || parsed.find(chapter => normalizeHandbookLine(chapter.title).includes(activeTitle) || activeTitle.includes(normalizeHandbookLine(chapter.title)));
}

const MAMMOTH_HANDBOOK_OPTIONS = {
  styleMap: [
    "p[style-name='Title'] => h1:fresh",
    "p[style-name='Subtitle'] => h2:fresh",
    "p[style-name='Heading 1'] => h1:fresh",
    "p[style-name='Heading 2'] => h2:fresh",
    "p[style-name='Heading 3'] => h3:fresh",
    "b => strong",
    "i => em",
  ],
  convertImage: mammoth.images.imgElement(image =>
    image.read('base64').then(imageBuffer => ({
      src: 'data:' + image.contentType + ';base64,' + imageBuffer,
    }))
  ),
  includeDefaultStyleMap: true,
};

function splitHandbookHtmlByChapters(html, parsedChapters) {
  if (typeof document === 'undefined') return parsedChapters;
  const cleaned = normalizeImportedHtml(html);
  if (!cleaned) return parsedChapters;

  const doc = document.implementation.createHTMLDocument('');
  doc.body.innerHTML = cleaned;
  const children = Array.from(doc.body.children);
  if (!children.length) return parsedChapters;

  const tocEnd = children.findIndex(node => /page numbers/i.test(node.textContent || ''));
  let cursor = tocEnd >= 0 ? tocEnd + 1 : 0;
  const starts = parsedChapters.map(chapter => {
    const title = normalizeHandbookLine(chapter.title);
    const index = children.findIndex((node, i) => {
      if (i < cursor) return false;
      const text = normalizeHandbookLine(node.textContent);
      return text === title || text.startsWith(title + ' ') || text.includes(title);
    });
    if (index >= 0) cursor = index + 1;
    return { ...chapter, index };
  });

  if (starts.some(chapter => chapter.index < 0)) return parsedChapters;

  return starts.map((chapter, i) => {
    const next = starts[i + 1]?.index ?? children.length;
    const sectionHtml = children.slice(chapter.index, next).map(node => node.outerHTML).join('\n');
    const content = normalizeImportedHtml(sectionHtml);
    return {
      ...chapter,
      content: content ? HANDBOOK_HTML_PREFIX + '\n' + content : chapter.content,
    };
  });
}

async function parseHandbookDocx(arrayBuffer) {
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  const parsed = splitHandbookRawText(value);
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer }, MAMMOTH_HANDBOOK_OPTIONS);
    return splitHandbookHtmlByChapters(result.value, parsed);
  } catch (err) {
    console.warn('Rich handbook import failed; falling back to raw text import.', err);
    return parsed;
  }
}

function hasTransparentImagesFlag(content) {
  return String(content || '').includes(HANDBOOK_TRANSPARENT_IMAGES_FLAG);
}

function setTransparentImagesFlag(content, enabled) {
  const withoutFlag = String(content || '').replace(HANDBOOK_TRANSPARENT_IMAGES_FLAG, '').trimStart();
  return enabled ? HANDBOOK_TRANSPARENT_IMAGES_FLAG + '\n' + withoutFlag : withoutFlag;
}

function makeHandbookPdfContent(meta) {
  return HANDBOOK_PDF_PREFIX + '\n' + JSON.stringify(meta);
}

function parseHandbookPdfContent(content) {
  const raw = String(content || '').trim();
  if (!raw.startsWith(HANDBOOK_PDF_PREFIX)) return null;
  try {
    return JSON.parse(raw.replace(HANDBOOK_PDF_PREFIX, '').trim());
  } catch {
    return null;
  }
}

function padHandbookPage(page) {
  return String(page).padStart(3, '0');
}

function handbookPageSlug(page) {
  return 'page-' + padHandbookPage(page);
}

function handbookPageTitle(page) {
  return 'Page ' + padHandbookPage(page);
}

function isFullHandbookPdfRow(row) {
  const meta = parseHandbookPdfContent(row?.content);
  return row?.slug === HANDBOOK_FULL_PDF_SLUG || meta?.type === 'book';
}

function isHandbookPageRow(row) {
  const meta = parseHandbookPdfContent(row?.content);
  return /^page-\d+$/i.test(row?.slug || '') || Number.isFinite(Number(meta?.page));
}

function pageNumberFromRow(row) {
  const meta = parseHandbookPdfContent(row?.content);
  const metaPage = Number(meta?.page);
  if (Number.isFinite(metaPage) && metaPage > 0) return metaPage;
  const slugPage = String(row?.slug || '').match(/^page-(\d+)$/i);
  return slugPage ? Number(slugPage[1]) : null;
}

function makePdfPageChapter(fullPdfRow, page, existingRow = null) {
  const fullMeta = parseHandbookPdfContent(fullPdfRow?.content) || {};
  const existingMeta = parseHandbookPdfContent(existingRow?.content) || {};
  const totalPages = Number(fullMeta.total_pages || existingMeta.total_pages) || HANDBOOK_DEFAULT_PDF_PAGE_COUNT;
  const content = existingRow?.content || makeHandbookPdfContent({
    ...fullMeta,
    type: 'book-page',
    page,
    total_pages: totalPages,
    source_chapter_id: fullPdfRow?.id || fullMeta.source_chapter_id || null,
    source_slug: fullPdfRow?.slug || fullMeta.source_slug || HANDBOOK_FULL_PDF_SLUG,
  });
  return {
    ...(existingRow || {}),
    slug: handbookPageSlug(page),
    title: existingRow?.title || handbookPageTitle(page),
    subtitle: existingRow?.subtitle || 'Soteria Player Handbook | PDF page ' + page + ' of ' + totalPages,
    chapter_order: Number(existingRow?.chapter_order) || page,
    content,
    is_published: existingRow?.is_published ?? fullPdfRow?.is_published ?? true,
    pdf_page: page,
    virtual_pdf_page: !existingRow?.id,
  };
}

function normalizeHandbookChapters(rows, canEdit) {
  const visibleRows = canEdit
    ? rows
    : rows.filter(c => c.is_published && String(c.content || '').trim());
  const fullPdfRow = visibleRows.find(isFullHandbookPdfRow);
  if (!fullPdfRow) return visibleRows;

  const fullMeta = parseHandbookPdfContent(fullPdfRow.content) || {};
  const totalPages = Number(fullMeta.total_pages) || HANDBOOK_DEFAULT_PDF_PAGE_COUNT;
  const pageRows = new Map(
    visibleRows
      .filter(row => !isFullHandbookPdfRow(row) && isHandbookPageRow(row))
      .map(row => [pageNumberFromRow(row), row])
      .filter(([page]) => Number.isFinite(page) && page > 0)
  );
  const pages = Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    return makePdfPageChapter(fullPdfRow, page, pageRows.get(page));
  });
  return pages.sort((a, b) => Number(a.chapter_order || 0) - Number(b.chapter_order || 0));
}
function safePdfFileName(name) {
  return String(name || 'handbook.pdf')
    .replace(/\.pdf$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'handbook';
}

function normalizeImportedHtml(html) {
  const raw = String(html || '').trim();
  if (!raw) return '';
  if (typeof document === 'undefined') {
    return raw
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/<p><br\s*\/?><\/p>/gi, '')
      .trim();
  }

  const doc = document.implementation.createHTMLDocument('');
  doc.body.innerHTML = raw;
  doc.querySelectorAll('script, style, meta, link, o\\:p').forEach(node => node.remove());

  const allowedTags = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'I', 'IMG', 'LI', 'OL', 'P', 'SPAN', 'STRONG', 'TABLE', 'TBODY', 'TD', 'TH', 'THEAD', 'TR', 'U', 'UL']);
  const allowedAttrs = new Set(['href', 'src', 'alt', 'colspan', 'rowspan']);
  doc.body.querySelectorAll('*').forEach(node => {
    if (!allowedTags.has(node.tagName)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }
    Array.from(node.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      if (!allowedAttrs.has(name)) node.removeAttribute(attr.name);
    });
    if (node.tagName === 'A' && node.getAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noreferrer');
    }
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (!src || (!/^data:image\//i.test(src) && !/^https?:\/\//i.test(src))) node.remove();
    }
  });

  doc.body.querySelectorAll('p, div, span, li, td, th').forEach(node => {
    if (!node.textContent.trim() && !node.querySelector('img, table')) node.remove();
  });

  return doc.body.innerHTML
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<p><br\s*\/?><\/p>/gi, '')
    .trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToHtmlParagraphs(value) {
  return String(value || '')
    .split(/\n{2,}/)
    .map(block => '<p>' + escapeHtml(block).replace(/\n/g, '<br>') + '</p>')
    .join('\n');
}
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('Could not read pasted image.'));
    reader.readAsDataURL(file);
  });
}

async function clipboardImageItemsToHtml(items) {
  const images = [];
  for (const item of Array.from(items || [])) {
    if (item.kind === 'file' && /^image\//i.test(item.type || '')) {
      const file = item.getAsFile();
      if (file) images.push('<p><img src="' + await fileToDataUrl(file) + '" alt="" /></p>');
    }
  }
  return images.join('\n');
}
async function parseClipboardHtml(event) {
  const clipboard = event.clipboardData;
  const html = clipboard?.getData('text/html') || '';
  const plain = clipboard?.getData('text/plain') || '';
  const imageHtml = await clipboardImageItemsToHtml(clipboard?.items);
  const body = normalizeImportedHtml(html || textToHtmlParagraphs(plain));
  const combined = normalizeImportedHtml([body, imageHtml].filter(Boolean).join('\n'));
  if (!combined) throw new Error('The clipboard did not contain readable Word/Docs content.');
  return HANDBOOK_HTML_PREFIX + '\n' + combined;
}
async function parseSingleChapterDocx(arrayBuffer) {
  const result = await mammoth.convertToHtml({ arrayBuffer }, MAMMOTH_HANDBOOK_OPTIONS);
  const html = normalizeImportedHtml(result.value);
  if (!html) throw new Error('That Word document did not contain readable handbook content.');
  return HANDBOOK_HTML_PREFIX + '\n' + html;
}

// Signed URLs expire (here: 30 minutes) so a leaked/bookmarked link stops
// working shortly after, unlike the permanent public URLs this used to store.
const HANDBOOK_PDF_SIGNED_URL_TTL = 60 * 30;
const HANDBOOK_PDFJS_VERSION = '3.11.174';

function loadHandbookPdfJs() {
  if (typeof window === 'undefined') return Promise.reject(new Error('PDF rendering is only available in the browser.'));
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (window.__syntarionPdfJsPromise) return window.__syntarionPdfJsPromise;
  window.__syntarionPdfJsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('syntarion-pdfjs');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.pdfjsLib), { once: true });
      existing.addEventListener('error', () => reject(new Error('Could not load the secure handbook viewer.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.id = 'syntarion-pdfjs';
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + HANDBOOK_PDFJS_VERSION + '/pdf.min.js';
    script.async = true;
    script.onload = () => {
      if (!window.pdfjsLib) { reject(new Error('The secure handbook viewer did not initialize.')); return; }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + HANDBOOK_PDFJS_VERSION + '/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Could not load the secure handbook viewer.'));
    document.head.appendChild(script);
  });
  return window.__syntarionPdfJsPromise;
}

function HandbookPdfContent({ content, darkMode, isMobile, theme }) {
  const meta = parseHandbookPdfContent(content);
  const [signedUrl, setSignedUrl] = useState(null);
  const [urlError, setUrlError] = useState('');
  const [renderState, setRenderState] = useState({ loading: false, error: '' });
  const canvasRef = useRef(null);
  const canvasShellRef = useRef(null);

  useEffect(() => {
    setSignedUrl(null);
    setUrlError('');
    if (!meta?.bucket || !meta?.path) return;
    let cancelled = false;
    supabase.storage.from(meta.bucket).createSignedUrl(meta.path, HANDBOOK_PDF_SIGNED_URL_TTL).then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data?.signedUrl) { setUrlError(error?.message || 'Could not create a secure link for this PDF.'); return; }
      setSignedUrl(data.signedUrl);
    });
    return () => { cancelled = true; };
  }, [meta?.bucket, meta?.path]);

  const hasStoragePath = !!(meta?.bucket && meta?.path);
  const resolvedUrl = hasStoragePath ? signedUrl : meta?.url;
  const renderPage = Math.max(1, Number(meta?.page) || 1);

  useEffect(() => {
    if (!resolvedUrl) return;
    let cancelled = false;
    let pdfTask = null;
    async function renderPdfPage() {
      setRenderState({ loading: true, error: '' });
      try {
        const pdfjsLib = await loadHandbookPdfJs();
        pdfTask = pdfjsLib.getDocument({
          url: String(resolvedUrl).split('#')[0],
          disableAutoFetch: true,
          disableStream: true,
        });
        const pdf = await pdfTask.promise;
        if (cancelled) return;
        const page = await pdf.getPage(Math.min(renderPage, pdf.numPages));
        if (cancelled) return;
        const shellWidth = canvasShellRef.current?.clientWidth || (isMobile ? window.innerWidth - 36 : 860);
        const viewport = page.getViewport({ scale: 1 });
        const scale = Math.max(0.5, Math.min(2.2, (shellWidth - 2) / viewport.width));
        const scaledViewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d', { alpha: false });
        if (!canvas || !context) throw new Error('Could not prepare the handbook page canvas.');
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(scaledViewport.width * dpr);
        canvas.height = Math.floor(scaledViewport.height * dpr);
        canvas.style.width = Math.floor(scaledViewport.width) + 'px';
        canvas.style.height = Math.floor(scaledViewport.height) + 'px';
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.fillStyle = '#f5efe4';
        context.fillRect(0, 0, scaledViewport.width, scaledViewport.height);
        await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
        if (!cancelled) setRenderState({ loading: false, error: '' });
      } catch (err) {
        if (!cancelled) setRenderState({ loading: false, error: err?.message || 'Could not render this handbook page.' });
      }
    }
    renderPdfPage();
    return () => {
      cancelled = true;
      try { pdfTask?.destroy?.(); } catch {}
    };
  }, [resolvedUrl, renderPage, isMobile]);

  if (!hasStoragePath && !meta?.url) {
    return <LiveBlockHeader title="PDF unavailable" subtitle="This handbook entry points to a PDF, but the file reference could not be read." theme={theme} warn />;
  }
  if (urlError) {
    return <LiveBlockHeader title="PDF unavailable" subtitle={urlError} theme={theme} warn />;
  }
  if (!resolvedUrl) {
    return <LiveBlockHeader title="Loading PDF..." subtitle="Requesting a secure link for this page." theme={theme} />;
  }

  const pageLabel = meta.page
    ? 'Page ' + meta.page + (meta.total_pages ? ' of ' + meta.total_pages : '')
    : 'Full PDF';
  return (
    <section
      onContextMenu={e => e.preventDefault()}
      onDragStart={e => e.preventDefault()}
      style={{
        userSelect: 'none', WebkitUserSelect: 'none',
        border: '1px solid ' + theme.borderMid, borderRadius: 12, overflow: 'hidden',
        background: darkMode ? '#0c0906' : '#efe7d8',
        boxShadow: darkMode ? '0 18px 42px rgba(0,0,0,0.45)' : '0 12px 28px rgba(26,23,20,0.12)',
      }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center',
        padding: '10px 14px', borderBottom: '1px solid ' + theme.border,
        background: darkMode ? 'rgba(240,238,235,0.035)' : '#f8f0e4',
      }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: theme.sectionColor }}>Protected PDF View</div>
          <div style={{ marginTop: 3, fontSize: 11, color: theme.muted, fontStyle: 'italic' }}>{pageLabel} | {meta.name || 'Player Handbook PDF'}</div>
        </div>
        <div style={{ fontSize: 10, color: theme.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'right' }}>Rendered in-app without browser save controls.</div>
      </div>
      <div
        ref={canvasShellRef}
        style={{
          minHeight: isMobile ? '58dvh' : '66dvh',
          maxHeight: isMobile ? '62dvh' : '70dvh',
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          alignItems: renderState.loading || renderState.error ? 'center' : 'flex-start',
          padding: isMobile ? 0 : 10,
          background: '#f5efe4',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {renderState.loading && <div style={{ padding: 18, color: '#655848', fontStyle: 'italic', fontSize: 13 }}>Rendering handbook page...</div>}
        {renderState.error && <div style={{ padding: 18, color: COLORS.warn, fontSize: 13, textAlign: 'center' }}>{renderState.error}</div>}
        <canvas
          ref={canvasRef}
          aria-label={meta.name || 'Player Handbook PDF'}
          style={{
            display: renderState.error ? 'none' : 'block',
            maxWidth: '100%',
            height: 'auto',
            pointerEvents: 'none',
            background: '#f5efe4',
          }}
        />
      </div>
    </section>
  );
}
function HandbookHtmlContent({ content, darkMode, isMobile, theme }) {
  const transparentImages = hasTransparentImagesFlag(content);
  const html = String(content || '').replace(HANDBOOK_TRANSPARENT_IMAGES_FLAG, '').replace(HANDBOOK_HTML_PREFIX, '').trim();
  const scope = 'hb-word-content';
  const css = [
    '.' + scope + ' { color: ' + theme.ink + '; font-family: Georgia, serif; font-size: 14px; line-height: 1.62; }',
    '.' + scope + ' h1, .' + scope + ' h2, .' + scope + ' h3 { font-family: Cinzel, serif; color: ' + theme.ink + '; letter-spacing: 0.04em; }',
    '.' + scope + ' h1 { font-size: ' + (isMobile ? 18 : 22) + 'px; text-align: center; margin: 24px 0 18px; }',
    '.' + scope + ' h2 { font-size: ' + (isMobile ? 15 : 18) + 'px; margin: 24px 0 12px; }',
    '.' + scope + ' h3 { font-size: 12px; text-transform: uppercase; color: ' + theme.sectionColor + '; margin: 20px 0 10px; }',
    '.' + scope + ' p { margin: 8px 0; }',
    '.' + scope + ' strong { font-weight: 700; }',
    '.' + scope + ' em { font-style: italic; }',
    '.' + scope + ' img { display: block; max-width: min(100%, 220px); height: auto; margin: 10px auto 14px; object-fit: contain; background: transparent; ' + (transparentImages ? 'mix-blend-mode: multiply; filter: contrast(1.18);' : '') + ' }',
    '.' + scope + ' table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 18px 0; background: ' + (darkMode ? 'rgba(240,238,235,0.025)' : 'rgba(255,250,241,0.65)') + '; }',
    '.' + scope + ' td, .' + scope + ' th { border: 1px solid ' + theme.borderMid + '; padding: ' + (isMobile ? 7 : 9) + 'px; vertical-align: top; color: ' + theme.ink + '; font-size: ' + (isMobile ? 11 : 12) + 'px; line-height: 1.35; }',
    '.' + scope + ' th { background: ' + (darkMode ? 'rgba(240,238,235,0.05)' : '#efe2cf') + '; font-family: Cinzel, serif; font-size: 10px; }',
    '.' + scope + ' td p, .' + scope + ' th p { margin: 0 0 6px; }',
    '.' + scope + ' td img, .' + scope + ' th img { max-width: 150px; margin: 8px auto; }',
    '.' + scope + ' ul, .' + scope + ' ol { padding-left: 22px; }',
  ].join('\n');
  return (
    <div className={scope}>
      <style>{css}</style>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
function LiveMarkdown({ content, mdComponents, active, darkMode, isMobile, theme }) {
  const rawContent = String(content || '').trim();
  if (rawContent.startsWith(HANDBOOK_PDF_PREFIX)) {
    return <HandbookPdfContent content={rawContent} darkMode={darkMode} isMobile={isMobile} theme={theme} />;
  }
  if (rawContent.startsWith(HANDBOOK_HTML_PREFIX)) {
    return <HandbookHtmlContent content={rawContent} darkMode={darkMode} isMobile={isMobile} theme={theme} />;
  }
  const parts = rawContent.split(/(\[\[(?:syntarion|supabase):[a-z_-]+\]\])/gi);
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
  const [bulkImportStatus, setBulkImportStatus] = useState('');
  const [bulkImporting, setBulkImporting] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const [richPasteOpen, setRichPasteOpen] = useState(false);
  const contentRef = useRef(null);
  const fileRef = useRef(null);
  const pasteRef = useRef(null);
  const bulkFileRef = useRef(null);
  const pageFileRef = useRef(null);

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
    const list = normalizeHandbookChapters(rows, canEdit);
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
    if (openSignal) handleOpen();
  }, [openSignal]);

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

  const uploadHandbookPdf = async (file, scope = 'chapter', metaOverrides = {}) => {
    if (!file) throw new Error('Choose a PDF file.');
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && file.type !== 'application/pdf') throw new Error('Use a .pdf file.');
    const base = safePdfFileName(file.name);
    const chapterSlug = slugifyHandbookTitle(active?.slug || active?.title || scope);
    const storagePath = 'handbook/' + scope + '/' + chapterSlug + '-' + Date.now() + '-' + base + '.pdf';
    const buckets = [HANDBOOK_PDF_BUCKET, 'dm_assets', 'portraits'];
    let uploadedBucket = '';
    let uploadError = null;
    for (const bucket of buckets) {
      const { error } = await supabase.storage.from(bucket).upload(storagePath, file, { upsert: true, contentType: 'application/pdf' });
      if (!error) { uploadedBucket = bucket; break; }
      uploadError = error;
      if (!/bucket not found/i.test(error.message || '')) break;
    }
    if (!uploadedBucket) throw uploadError || new Error('Could not upload PDF.');
    const { data } = supabase.storage.from(uploadedBucket).getPublicUrl(storagePath);
    if (!data?.publicUrl) throw new Error('PDF uploaded, but no public URL was returned.');
    return makeHandbookPdfContent({ type: scope, name: file.name, bucket: uploadedBucket, path: storagePath, url: data.publicUrl, uploaded_at: new Date().toISOString(), ...metaOverrides });
  };

  const parseHandbookFile = async (file) => {
    const name = file.name || 'handbook-update';
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') {
      const page = active?.pdf_page || pageNumberFromRow(active);
      return uploadHandbookPdf(file, page ? 'page' : 'chapter', page ? { page: 1, replaces_handbook_page: page, total_pages: 1 } : {});
    }
    if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      try {
        const parsed = await parseHandbookDocx(arrayBuffer);
        const matched = findHandbookChapter(parsed, active);
        if (!matched) {
          const available = parsed.slice(0, 12).map(chapter => chapter.title).join(', ');
          throw new Error('This full handbook did not contain a section matching "' + (active?.title || 'this chapter') + '". Found: ' + available + (parsed.length > 12 ? ', ...' : ''));
        }
        return matched.content.trim();
      } catch (err) {
        if (!/table of contents|numbered handbook chapters|document body/i.test(err?.message || '')) throw err;
        return parseSingleChapterDocx(arrayBuffer);
      }
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
    throw new Error('Use a .pdf, .docx, .md, .txt, .xlsx, or .xls file.');
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

  const handleRichPaste = async (event) => {
    event.preventDefault();
    setImportStatus('Reading rich clipboard...');
    try {
      const content = await parseClipboardHtml(event);
      setImportPreview({ name: 'Pasted Word / Docs content', content });
      setImportStatus('Rich paste ready. Review, then apply it to this chapter.');
      if (pasteRef.current) pasteRef.current.innerHTML = '';
    } catch (err) {
      setImportStatus('Paste failed: ' + (err?.message || err));
    }
  };

  const handleBulkImportPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit || bulkImporting) return;
    setBulkImporting(true);
    setBulkImportStatus('Reading handbook...');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'pdf') {
        setBulkImportStatus('Uploading PDF handbook...');
        const content = await uploadHandbookPdf(file, 'book', { total_pages: HANDBOOK_DEFAULT_PDF_PAGE_COUNT });
        const slug = HANDBOOK_FULL_PDF_SLUG;
        const payload = {
          slug,
          title: 'Full Handbook PDF',
          subtitle: 'Soteria Player Handbook | PDF Edition',
          chapter_order: 0,
          content,
          is_published: true,
          updated_at: new Date().toISOString(),
        };
        const { data: existing, error: findError } = await supabase
          .from('handbook_chapters')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();
        if (findError) throw findError;
        const result = existing?.id
          ? await supabase.from('handbook_chapters').update(payload).eq('id', existing.id)
          : await supabase.from('handbook_chapters').insert(payload);
        if (result.error) throw result.error;
        const fullMeta = parseHandbookPdfContent(content) || {};
        setBulkImportStatus('Saving ' + HANDBOOK_DEFAULT_PDF_PAGE_COUNT + ' PDF page references...');
        for (let page = 1; page <= HANDBOOK_DEFAULT_PDF_PAGE_COUNT; page += 1) {
          const pageSlug = handbookPageSlug(page);
          const pagePayload = {
            slug: pageSlug,
            title: handbookPageTitle(page),
            subtitle: 'Soteria Player Handbook | PDF page ' + page + ' of ' + HANDBOOK_DEFAULT_PDF_PAGE_COUNT,
            chapter_order: page,
            content: makeHandbookPdfContent({ ...fullMeta, type: 'book-page', page, total_pages: HANDBOOK_DEFAULT_PDF_PAGE_COUNT, source_slug: slug, source_chapter_id: existing?.id || null }),
            is_published: true,
            updated_at: new Date().toISOString(),
          };
          const { data: existingPage, error: findPageError } = await supabase
            .from('handbook_chapters')
            .select('id')
            .eq('slug', pageSlug)
            .maybeSingle();
          if (findPageError) throw findPageError;
          const pageResult = existingPage?.id
            ? await supabase.from('handbook_chapters').update(pagePayload).eq('id', existingPage.id)
            : await supabase.from('handbook_chapters').insert(pagePayload);
          if (pageResult.error) throw pageResult.error;
        }
        setBulkImportStatus('Updated handbook PDF: ' + HANDBOOK_DEFAULT_PDF_PAGE_COUNT + ' clickable page references.');
        await fetchChapters();
        setActiveSlug(handbookPageSlug(1));
        return;
      }      if (ext !== 'docx') throw new Error('Use a .pdf or .docx file for handbook replacement or chapter updates.');
      const arrayBuffer = await file.arrayBuffer();
      let parsed = null;
      try {
        parsed = await parseHandbookDocx(arrayBuffer);
      } catch (err) {
        if (!/table of contents|numbered handbook chapters|document body/i.test(err?.message || '')) throw err;
      }

      if (parsed?.length) {
        setBulkImportStatus('Saving ' + parsed.length + ' chapters...');
        for (const chapter of parsed) {
          const { data: existing, error: findError } = await supabase
            .from('handbook_chapters')
            .select('id')
            .eq('slug', chapter.slug)
            .maybeSingle();
          if (findError) throw findError;
          const payload = { ...chapter, updated_at: new Date().toISOString() };
          const result = existing?.id
            ? await supabase.from('handbook_chapters').update(payload).eq('id', existing.id)
            : await supabase.from('handbook_chapters').insert(payload);
          if (result.error) throw result.error;
        }
        setBulkImportStatus('Updated handbook: ' + parsed.length + ' published chapters.');
        await fetchChapters();
        setActiveSlug(parsed[0]?.slug || null);
      } else {
        if (!active?.slug) throw new Error('Select a handbook page before importing a single-page Word document.');
        setBulkImportStatus('Saving this Word page to ' + active.title + '...');
        const content = await parseSingleChapterDocx(arrayBuffer);
        const payload = {
          slug: active.slug,
          title: active.title,
          subtitle: active.subtitle || null,
          chapter_order: Number(active.chapter_order) || pageNumberFromRow(active) || 1,
          content,
          is_published: active.is_published ?? true,
          updated_at: new Date().toISOString(),
        };
        const result = active.id
          ? await supabase.from('handbook_chapters').update(payload).eq('id', active.id).select('id, slug, title, subtitle, chapter_order, content, is_published').single()
          : await supabase.from('handbook_chapters').insert(payload).select('id, slug, title, subtitle, chapter_order, content, is_published').single();
        if (result.error) throw result.error;
        const saved = result.data || { ...active, ...payload };
        setChapters(prev => (prev || []).map(chapter => chapter.slug === active.slug ? { ...chapter, ...saved } : chapter));
        setBulkImportStatus('Updated chapter: ' + active.title + '.');      }
    } catch (err) {
      setBulkImportStatus('Handbook import failed: ' + (err?.message || err));
    } finally {
      setBulkImporting(false);
      e.target.value = '';
    }
  };

  // Updates only the currently-selected page/chapter row — unlike
  // handleBulkImportPick's PDF path, this never touches the other 96 pages.
  const saveActivePageContent = async (content) => {
    const payload = {
      title: active.title,
      subtitle: active.subtitle || null,
      chapter_order: active.chapter_order,
      content,
      is_published: active.is_published ?? true,
      updated_at: new Date().toISOString(),
    };
    const result = active.id
      ? await supabase.from('handbook_chapters').update(payload).eq('id', active.id).select('id, slug, title, subtitle, chapter_order, content, is_published').single()
      : await supabase.from('handbook_chapters').insert({ ...payload, slug: active.slug }).select('id, slug, title, subtitle, chapter_order, content, is_published').single();
    if (result.error) throw result.error;
    const saved = result.data || { ...active, ...payload };
    setChapters(prev => (prev || []).map(chapter => chapter.slug === active.slug ? { ...chapter, ...saved } : chapter));
  };

  const handleSinglePageReplace = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit || bulkImporting || !active) return;
    setBulkImporting(true);
    setBulkImportStatus('Replacing this page: ' + active.title + '...');
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      let content;
      if (ext === 'pdf') {
        const page = pageNumberFromRow(active) || Number(active.chapter_order) || null;
        content = await uploadHandbookPdf(file, 'page', page ? { page, replaces_handbook_page: page, total_pages: 1 } : {});
      } else if (ext === 'docx') {
        content = await parseSingleChapterDocx(await file.arrayBuffer());
      } else {
        throw new Error('Use a .pdf or .docx file to replace this page.');
      }
      await saveActivePageContent(content);
      setBulkImportStatus('Replaced this page: ' + active.title + '.');
    } catch (err) {
      setBulkImportStatus('Page replace failed: ' + (err?.message || err));
    } finally {
      setBulkImporting(false);
      e.target.value = '';
    }
  };

  const startRename = () => {
    if (!active) return;
    setRenameDraft(active.title);
    setRenaming(true);
  };

  const cancelRename = () => { setRenaming(false); setRenameDraft(''); };

  // Renames only the title — chapter_order and slug are untouched, so the
  // page number can never shift as a side effect of a rename.
  const saveRename = async () => {
    const title = renameDraft.trim();
    if (!active || !title || title === active.title) { cancelRename(); return; }
    const payload = { title, updated_at: new Date().toISOString() };
    if (active.id) {
      const result = await supabase.from('handbook_chapters').update(payload).eq('id', active.id)
        .select('id, slug, title, subtitle, chapter_order, content, is_published').single();
      if (result.error) { setBulkImportStatus('Rename failed: ' + result.error.message); return; }
      const saved = result.data || { ...active, ...payload };
      setChapters(prev => (prev || []).map(chapter => chapter.slug === active.slug ? { ...chapter, ...saved } : chapter));
    }
    setRenaming(false);
    setRenameDraft('');
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
    const savePayload = active.id ? payload : { ...payload, slug: active.slug };
    const result = active.id
      ? await supabase
        .from('handbook_chapters')
        .update(savePayload)
        .eq('id', active.id)
        .select('id, slug, title, subtitle, chapter_order, content, is_published')
        .single()
      : await supabase
        .from('handbook_chapters')
        .insert(savePayload)
        .select('id, slug, title, subtitle, chapter_order, content, is_published')
        .single();
    setSaving(false);
    if (result.error) { setSaveStatus(`Could not save: ${result.error.message}`); return; }
    const saved = result.data || { ...active, ...savePayload };
    setChapters(prev => (prev || [])
      .map(c => (c.slug === active.slug ? { ...c, ...saved } : c))
      .sort((a, b) => a.chapter_order - b.chapter_order));    setSaveStatus('Saved.');
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
      {trigger === 'bookmark' && !isMobile && !open && (
        <button
          onClick={handleOpen}
          title="Player Handbook"
          style={{
            position: 'fixed', top: 'calc(0px + env(safe-area-inset-top))', left: isMobile ? 'auto' : 96, right: isMobile ? 12 : 'auto', zIndex: 900,
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
          style={{ position: 'fixed', inset: 0, zIndex: 300000, background: 'rgba(10, 7, 4, 0.55)', backdropFilter: 'blur(2px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', top: isMobile ? 'calc(8px + env(safe-area-inset-top))' : 0, left: 0, right: 0,
              height: isMobile ? 'calc(92dvh - env(safe-area-inset-top))' : '86vh',
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
              display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap',
              padding: isMobile ? '14px 18px' : '16px 28px', borderBottom: `1px solid ${border}`, flexShrink: 0,
            }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: sectionColor, marginBottom: 3 }}>Soteria</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 15 : 18, fontWeight: 700, color: ink, letterSpacing: '0.05em' }}>PLAYER HANDBOOK</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {canEdit && !editing && (
                  <>
                    {active && (
                      <>
                        <input ref={pageFileRef} type="file" onChange={handleSinglePageReplace} style={{ display: 'none' }} />
                        <button onClick={() => pageFileRef.current?.click()} disabled={bulkImporting} title={'Replace only this page: ' + active.title} style={{
                          background: 'transparent', border: '1px solid ' + COLORS.magic, borderRadius: 6,
                          padding: '7px 14px', cursor: bulkImporting ? 'default' : 'pointer', fontFamily: "'Cinzel', serif",
                          fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.magicText,
                          opacity: bulkImporting ? 0.58 : 1,
                        }}>{bulkImporting ? 'Working...' : 'Replace This Page'}</button>
                      </>
                    )}
                    <input ref={bulkFileRef} type="file" onChange={handleBulkImportPick} style={{ display: 'none' }} />
                    <button onClick={() => bulkFileRef.current?.click()} disabled={bulkImporting} title="Replace the entire handbook PDF/Word document (regenerates every page reference)" style={{
                      background: COLORS.magicBg, border: '1px solid ' + COLORS.magic, borderRadius: 6,
                      padding: '7px 14px', cursor: bulkImporting ? 'default' : 'pointer', fontFamily: "'Cinzel', serif",
                      fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.magicText,
                      opacity: bulkImporting ? 0.58 : 1,
                    }}>{bulkImporting ? 'Importing...' : 'Replace Whole Book'}</button>
                  </>
                )}
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
            <div style={{ padding: isMobile ? '12px 18px 0' : '14px 28px 0', flexShrink: 0, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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

              {canEdit && active && !editing && (
                renaming ? (
                  <>
                    <input
                      value={renameDraft}
                      onChange={e => setRenameDraft(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') cancelRename(); }}
                      autoFocus
                      style={{
                        background: card, border: `1px solid ${COLORS.magic}`, borderRadius: 6,
                        padding: '8px 10px', fontSize: 12, color: ink, fontFamily: 'Georgia, serif',
                        outline: 'none', width: isMobile ? 160 : 220,
                      }}
                    />
                    <button onClick={saveRename} title="Save name" style={{
                      background: COLORS.magicBg, border: '1px solid ' + COLORS.magic, borderRadius: 6,
                      padding: '8px 11px', cursor: 'pointer', color: COLORS.magicText, fontSize: 12,
                    }}>✓</button>
                    <button onClick={cancelRename} title="Cancel" style={{
                      background: 'transparent', border: `1px solid ${borderMid}`, borderRadius: 6,
                      padding: '8px 11px', cursor: 'pointer', color: muted, fontSize: 12,
                    }}>✕</button>
                  </>
                ) : (
                  <button onClick={startRename} title="Rename this page (the page number stays the same)" style={{
                    background: 'transparent', border: `1px solid ${borderMid}`, borderRadius: 6,
                    padding: '9px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                    fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: ink,
                  }}>Rename</button>
                )
              )}
            </div>

            {/* Content */}
            <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '10px 18px 40px' : '12px 28px 60px' }}>
              {loadError && <div style={{ padding: '20px 0', color: COLORS.warn, fontSize: 13 }}>Could not load the handbook: {loadError}</div>}
              {bulkImportStatus && (
                <div style={{ maxWidth: 860, margin: '0 auto 10px', fontSize: 11, color: bulkImportStatus.includes('failed') ? COLORS.warn : COLORS.magicText, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', textTransform: 'uppercase' }}>{bulkImportStatus}</div>
              )}
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
                        <input ref={fileRef} type="file" onChange={handleImportPick} style={{ display: 'none' }} />
                        <button type="button" onClick={() => fileRef.current?.click()} style={{
                          background: COLORS.magicBg, border: '1px solid ' + COLORS.magic, borderRadius: 6,
                          padding: '7px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                          fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.magicText,
                        }}>Import PDF / File</button>
                        <button type="button" onClick={() => { setRichPasteOpen(v => !v); setTimeout(() => pasteRef.current?.focus(), 0); }} style={{
                          background: 'transparent', border: '1px solid ' + borderMid, borderRadius: 6,
                          padding: '7px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif",
                          fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: sectionColor,
                        }}>Paste From Word</button>
                        <div style={{ fontSize: 10, color: muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Upload a PDF for this entry, import a file, or paste a copied Word/Google Docs section with images.</div>
                      </div>
                      {importStatus && <div style={{ fontSize: 10, color: importStatus.startsWith('Import failed') || importStatus.startsWith('Paste failed') ? COLORS.warn : COLORS.archText, marginBottom: 8 }}>{importStatus}</div>}
                      {richPasteOpen && (
                        <div style={{ border: '1px dashed ' + borderMid, borderRadius: 8, padding: 10, marginBottom: 10, background: darkMode ? 'rgba(240,238,235,0.035)' : '#fffaf1' }}>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: sectionColor, marginBottom: 6 }}>Paste Word / Google Docs Content Here</div>
                          <div style={{ fontSize: 10, color: muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 8 }}>Copy the section, including images, then click this box and paste. A preview will appear below.</div>
                          <div
                            ref={pasteRef}
                            contentEditable
                            suppressContentEditableWarning
                            onPaste={handleRichPaste}
                            style={{ minHeight: 92, outline: 'none', border: '1px solid ' + border, borderRadius: 6, padding: 10, background: darkMode ? '#1b1712' : '#f8f0e4', color: muted, fontSize: 12, lineHeight: 1.5 }}
                          />
                        </div>
                      )}
                      {draft.content?.includes(HANDBOOK_HTML_PREFIX) && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: hasTransparentImagesFlag(draft.content) ? COLORS.magicText : muted }}>
                          <input
                            type="checkbox"
                            checked={hasTransparentImagesFlag(draft.content)}
                            onChange={e => setDraft(d => ({ ...d, content: setTransparentImagesFlag(d.content, e.target.checked) }))}
                            style={{ accentColor: COLORS.magic }}
                          />
                          Remove white image backgrounds
                        </label>
                      )}
                      {importPreview && (
                        <div style={{ border: '1px solid ' + border, borderRadius: 8, padding: 10, marginBottom: 10, background: darkMode ? 'rgba(240,238,235,0.035)' : '#f8f0e4' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', color: sectionColor, textTransform: 'uppercase' }}>{importPreview.name}</div>
                            <button type="button" onClick={applyImportToDraft} style={{ background: COLORS.deityBg, border: '1px solid ' + COLORS.deity, borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.deityText }}>Apply</button>
                          </div>
                          {importPreview.content.startsWith(HANDBOOK_PDF_PREFIX) ? (
                            <div style={{ maxHeight: 300, overflow: 'hidden', borderRadius: 6 }}>
                              <HandbookPdfContent content={importPreview.content} darkMode={darkMode} isMobile={isMobile} theme={{ ink, card, surface, muted, border, borderMid, sectionColor }} />
                            </div>
                          ) : importPreview.content.startsWith(HANDBOOK_HTML_PREFIX) ? (
                            <div style={{ maxHeight: 220, overflow: 'auto', padding: 8, background: darkMode ? 'rgba(0,0,0,0.16)' : '#fffaf1', borderRadius: 6 }}>
                              <HandbookHtmlContent content={importPreview.content} darkMode={darkMode} isMobile={isMobile} theme={{ ink, card, surface, muted, border, borderMid, sectionColor }} />
                            </div>
                          ) : (
                            <div style={{ maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.5, color: muted }}>{importPreview.content.slice(0, 2600)}</div>
                          )}
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




