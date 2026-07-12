import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import supabase from './lib/supabase';

// Reuses AdminPortal's visual language (monospace, amber-on-black)
const S = {
  input: { background: '#1a1714', border: '1px solid #3a352e', borderRadius: 6, padding: '8px 10px', color: '#f0eeeb', fontSize: 12, fontFamily: 'monospace', outline: 'none' },
  btn: { background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '7px 14px', color: '#e8c84a', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' },
  btnDanger: { background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.4)', borderRadius: 6, padding: '7px 14px', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' },
};

const BATCH = 400;

// ── PARSER 1: column-as-category (Compendium) ──────────────────────────────
// Each sheet's columns become a section: "SheetName — ColumnHeader",
// body = the column's non-empty cells, one per line.
function parseCompendium(wb, sourceLabel) {
  const sections = [];
  for (const name of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false, defval: null });
    if (!grid.length) continue;
    const header = grid[0];
    for (let ci = 0; ci < header.length; ci++) {
      const title = header[ci];
      if (title == null || !String(title).trim()) continue;
      const entries = [];
      for (let ri = 1; ri < grid.length; ri++) {
        const cell = grid[ri]?.[ci];
        if (cell != null && String(cell).trim()) entries.push(String(cell).trim());
      }
      if (entries.length) {
        sections.push({ source: sourceLabel, title: `${name} — ${String(title).trim()}`, body: entries.join('\n') });
      }
    }
  }
  return sections;
}

// ── PARSER 2: dictionary (Sotrehn) ─────────────────────────────────────────
// Walks each sheet for English|Sotrehn|Pronunciation triplets. Reliable bodies;
// title is per-sheet (sub-header detection across irregular blocks isn't trustworthy).
function parseDictionary(wb, sourceLabel) {
  const sections = [];
  for (const name of wb.SheetNames) {
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, blankrows: false, defval: null });
    if (!grid.length) continue;
    const header = (grid[0] || []).map(c => (c == null ? '' : String(c).trim().toLowerCase()));
    // find triplet block starts: english/negative/number/possessive followed by a "sotrehn" col
    const blocks = [];
    for (let i = 0; i < header.length - 1; i++) {
      const h = header[i];
      const starter = ['english', 'negative', 'number', 'posessive', 'possessive'].includes(h);
      if (starter && header[i + 1].includes('sotrehn')) { blocks.push(i); i += 2; }
    }
    const lines = [];
    for (const b of blocks) {
      for (let ri = 1; ri < grid.length; ri++) {
        const eng = grid[ri]?.[b], sot = grid[ri]?.[b + 1], pro = grid[ri]?.[b + 2];
        const e = eng == null ? '' : String(eng).trim();
        const s = sot == null ? '' : String(sot).trim();
        const p = pro == null ? '' : String(pro).trim();
        if (e && s) lines.push(`${e} → ${s}${p ? ` ${p}` : ''}`);
      }
    }
    if (lines.length) {
      sections.push({ source: sourceLabel, title: `Sotrehn — ${name}`, body: lines.join('\n') });
    }
  }
  return sections;
}

// ── PARSER 3: POI reference (Word doc) ─────────────────────────────────────
// Two-level: <h1> = region, each <table> = one POI (cell 1 = description with
// name, cell 2 = NPC roster). Section title = "Region — POI", body = prose + NPCs.
function htmlToText(s) {
  s = s.replace(/<\/p>/g, '\n').replace(/<[^>]+>/g, '');
  s = s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  return s.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ').trim();
}
async function parseDocxPOI(file, sourceLabel) {
  const buf = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf });
  const parts = html.split(/(<h1>.*?<\/h1>|<table>.*?<\/table>)/s);
  let region = 'Soteria';
  const sections = [];
  for (const p of parts) {
    if (p.startsWith('<h1>')) {
      region = htmlToText(p).replace(/:/g, '').trim() || region;
    } else if (p.startsWith('<table>')) {
      const cells = [...p.matchAll(/<th[^>]*>(.*?)<\/th>/gs)].map(m => m[1]);
      if (!cells.length) continue;
      const desc = cells[0];
      const npcs = cells[1] || '';
      const strongMatch = desc.match(/<strong>(.*?)<\/strong>/s);
      let name = strongMatch ? htmlToText(strongMatch[1]).trim() : '';
      if (!name || name.length > 60) {
        const firstLine = htmlToText(desc).split('\n')[0] || '';
        name = firstLine.includes(':') ? firstLine.split(':')[0].trim() : firstLine.slice(0, 40).trim();
      }
      name = name.replace(/^[:\s]+|[:\s]+$/g, '').trim() || 'Unnamed';
      let body = htmlToText(desc);
      if (npcs.trim()) body += '\n\nNPCS & PLAYERS:\n' + htmlToText(npcs);
      if (body.trim()) sections.push({ source: sourceLabel, title: `${region} — ${name}`, body });
    }
  }
  return sections;
}

export default function CompendiumUpload() {
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState('compendium'); // compendium | dictionary | skip
  const [sourceLabel, setSourceLabel] = useState('COMPENDIUM');
  const [preview, setPreview] = useState(null);    // { sections, entryCount }
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const onPick = (e) => {
    const f = e.target.files?.[0];
    setPreview(null);
    setStatus('');
    setFile(f || null);
  };

  const doParse = async () => {
    if (!file) return;
    if (kind === 'skip') { setStatus('Type is "skip" — nothing will be parsed or committed.'); setPreview(null); return; }
    setBusy(true);
    setStatus('Parsing…');
    try {
      let sections;
      if (kind === 'poi') {
        sections = await parseDocxPOI(file, sourceLabel.trim() || 'POI');
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array' });
        sections = kind === 'dictionary'
          ? parseDictionary(wb, sourceLabel.trim() || 'DICTIONARY')
          : parseCompendium(wb, sourceLabel.trim() || 'COMPENDIUM');
      }
      const entryCount = sections.reduce((n, s) => n + s.body.split('\n').length, 0);
      setPreview({ sections, entryCount });
      setStatus(`Parsed: ${wb.SheetNames.length} sheets → ${sections.length} sections → ${entryCount} entries. Review below, then Commit.`);
    } catch (err) {
      setStatus(`Parse error: ${err.message}`);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  };

  const doCommit = async () => {
    if (!preview?.sections?.length || !file) return;
    setBusy(true);
    const originFile = file.name;
    setStatus(`Replacing existing rows for "${originFile}"…`);
    // Replace-on-reupload: clear prior rows from this file
    const del = await supabase.from('scribe_context').delete().eq('origin_file', originFile);
    if (del.error) { setStatus(`Delete failed: ${del.error.message}`); setBusy(false); return; }

    const rows = preview.sections.map(s => ({
      source: s.source, title: s.title, body: s.body,
      campaign_id: null, origin_file: originFile,
    }));

    for (let i = 0; i < rows.length; i += BATCH) {
      const chunk = rows.slice(i, i + BATCH);
      setStatus(`Inserting ${i + 1}–${Math.min(i + BATCH, rows.length)} of ${rows.length}…`);
      const { error } = await supabase.from('scribe_context').insert(chunk);
      if (error) { setStatus(`Insert failed at row ${i}: ${error.message}`); setBusy(false); return; }
    }
    setStatus(`✓ Committed ${rows.length} sections from "${originFile}" to scribe_context.`);
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: 820 }}>
      <div style={{ color: '#e8c84a', fontSize: 13, marginBottom: 12 }}>SCRIBE CONTEXT — COMPENDIUM UPLOAD</div>
      <div style={{ fontSize: 10, color: '#8a8378', marginBottom: 16, lineHeight: 1.6 }}>
        Upload an .xlsx and choose how to read it. Compendium = each column is a category.
        Dictionary = English/Sotrehn/Pronunciation word pairs. Skip = ignore (use for form templates
        like the blank character sheet). Data is global (all campaigns) and is what players spend a Scribe Token to query.
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.docx" onChange={onPick} style={{ display: 'none' }} />
        <button style={S.btn} onClick={() => fileRef.current?.click()}>Choose file</button>
        <div style={{ fontSize: 11, color: '#c9c2b6' }}>{file ? file.name : 'no file selected'}</div>

        <select value={kind} onChange={e => setKind(e.target.value)} style={{ ...S.input, fontSize: 11 }}>
          <option value="compendium">Compendium (column = category)</option>
          <option value="dictionary">Dictionary (word / translation)</option>
          <option value="poi">POI Reference (Word doc — region/place/NPCs)</option>
          <option value="skip">Skip (ignore this file)</option>
        </select>

        <input style={{ ...S.input, width: 150 }} placeholder="source label"
          value={sourceLabel} onChange={e => setSourceLabel(e.target.value)} />

        <button style={S.btn} disabled={!file || busy} onClick={doParse}>Parse & Preview</button>
        <button style={S.btn} disabled={!preview?.sections?.length || busy}
          onClick={doCommit}>Commit to scribe_context</button>
      </div>

      {status && <div style={{ fontSize: 10, color: '#e8a84a', marginBottom: 12 }}>{status}</div>}

      {preview?.sections?.length > 0 && (
        <div style={{ border: '1px solid #2a251e', borderRadius: 6, maxHeight: '55vh', overflowY: 'auto' }}>
          {preview.sections.map((s, i) => (
            <div key={i} style={{ borderBottom: '1px solid #1e1a15', padding: '8px 12px' }}>
              <div style={{ color: '#e8c84a', fontSize: 11 }}>{s.title}
                <span style={{ color: '#4a453c', marginLeft: 8 }}>[{s.source}] · {s.body.split('\n').length} entries</span>
              </div>
              <div style={{ color: '#8a8378', fontSize: 10, marginTop: 3, whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden' }}>
                {s.body.split('\n').slice(0, 4).join('\n')}{s.body.split('\n').length > 4 ? '\n…' : ''}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}