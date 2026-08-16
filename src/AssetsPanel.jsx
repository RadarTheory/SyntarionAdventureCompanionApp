import { useState, useEffect, useCallback, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';
import { prepareImageForUpload } from './lib/imageResize';

// Each table already carries its own image column, and the rest of the app reads
// that column — the Bestiary shows beasts.portrait_url, NPCPanel shows
// npcs.portrait_url. This panel reads and writes the same columns rather than a
// private convention, so art uploaded here shows up everywhere else and art
// uploaded there shows up here.
//
// Only tables that actually exist belong here. The original panel also listed
// maps/races/classes, but there are no such tables — maps are files under
// public/Maps, and races/classes are constants in code — so those tabs could only
// ever error.
const TAB_CONFIG = {
  items:  { urlColumn: 'image_url' },
  npcs:   { urlColumn: 'portrait_url' },
  beasts: { urlColumn: 'portrait_url' },
  // Characters keep everything inside the `data` jsonb rather than in columns,
  // so they need their own loader. Read-only here on purpose: writing art back
  // would mean rewriting the whole character blob, which is exactly how a
  // player's open sheet can silently revert a DM change. Portraits stay owned
  // by the character sheet; this tab only casts them.
  characters: { jsonb: true, readOnly: true },
};
const TABLE_TABS = Object.keys(TAB_CONFIG);
// `moments` is the odd one out: free-form images with no row behind them, which
// is what the DM reaches for mid-session ("here's the sword"). Those live in the
// bucket alone, keyed by filename.
const TABS = [...TABLE_TABS, 'moments'];
const BUCKET = 'dm_assets';
const DM_ROLES = ['admin', 'architect', 'creator'];
const ROW_LIMIT = 200;

const label8 = () => ({ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" });

const publicUrl = (path) => supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
const bust = (url) => (url ? `${url}?v=${Date.now()}` : url);
const baseName = (filename) => filename.replace(/\.[^.]+$/, '');
const normalize = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export default function AssetsPanel({ campaignId = null, embedded = false }) {
  // The VTT has its own campaign pin, set from the map toolbar, and it can differ
  // from the DM's active tab. The map, Mapcast, Bestiary and Solomon all resolve
  // through it — casting to the tab's campaign instead wrote to a vtt_sessions
  // row nobody was watching. Read on every render so re-pinning is picked up.
  const vttCampaignId = localStorage.getItem('vtt_pinned_campaign') || campaignId;
  const [isDM, setIsDM]         = useState(false);
  const [roleChecked, setRoleChecked] = useState(false);
  const [activeTab, setActiveTab] = useState('items');
  const [assets, setAssets]     = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(false);
  const [busy, setBusy]         = useState('');
  const [error, setError]       = useState('');
  const [castNow, setCastNow]   = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  // Ids whose image URL is set but won't load — a dead storage path, a file
  // removed behind the row, a bad host. Tracked separately from "no art" because
  // they look identical on screen and only one of them is a problem to fix.
  const [brokenIds, setBrokenIds] = useState(() => new Set());
  const momentInputRef = useRef(null);
  // Every load claims a ticket; only the newest one is allowed to write state,
  // so switching tabs mid-request can't paint the previous tab's assets.
  const loadTicketRef = useRef(0);

  // One query per keystroke against a table this size is wasteful, and the
  // responses can land out of order.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Role, not a hardcoded email — otherwise no co-DM can ever manage assets.
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setRoleChecked(true); return; }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
      setIsDM(DM_ROLES.includes(profile?.role));
      setRoleChecked(true);
    });
  }, []);

  // What the table is looking at right now, so the panel can show it and clear it.
  const loadCast = useCallback(async () => {
    if (!vttCampaignId) return;
    const { data } = await supabase.from('vtt_sessions').select('cast_overlay').eq('campaign_id', vttCampaignId).maybeSingle();
    setCastNow(data?.cast_overlay || null);
  }, [vttCampaignId]);

  useEffect(() => { loadCast(); }, [loadCast]);

  // One storage listing per folder rather than a guessed `${id}.jpg` per tile —
  // that guess 404s for every row without art, and breaks on any other extension.
  const loadAssets = useCallback(async () => {
    if (!isDM) return;
    const ticket = ++loadTicketRef.current;
    const stale = () => ticket !== loadTicketRef.current;
    // Drop the previous tab's tiles up front. Leaving them meant an error on the
    // new tab showed the old tab's assets underneath the error — items listed
    // under MAPS, each with a live Cast button pointing at the wrong thing.
    setAssets([]);
    setBrokenIds(new Set());
    setLoading(true);
    setError('');

    const { data: files, error: listErr } = await supabase.storage.from(BUCKET).list(activeTab, { limit: 1000 });
    if (stale()) return;
    if (listErr) { setError(`Could not read the ${activeTab} folder: ${listErr.message}`); setLoading(false); return; }
    const art = new Map((files || []).map(f => [baseName(f.name), publicUrl(`${activeTab}/${f.name}`)]));

    if (activeTab === 'moments') {
      setAssets([...art.entries()].map(([id, url]) => ({ id, name: id.replace(/[-_]+/g, ' '), url })));
      setLoading(false);
      return;
    }

    const { urlColumn, jsonb } = TAB_CONFIG[activeTab];

    if (jsonb) {
      const { data: rows, error: charErr } = await supabase
        .from('characters').select('id, data, status').not('status', 'eq', 'rejected');
      if (stale()) return;
      if (charErr) { setError(`Could not read characters: ${charErr.message}`); setLoading(false); return; }
      const needle = debouncedSearch.trim().toLowerCase();
      setAssets((rows || [])
        .map(row => {
          let d = {};
          try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch { /* unreadable blob */ }
          return {
            id: row.id,
            name: d.name || `${d.fn || ''} ${d.ln || ''}`.trim() || 'Unnamed',
            // Full portrait first — introducing someone wants the art, not the
            // 512px map token.
            url: d.portrait_url || d.sprite_url || d.token?.sprite_url || null,
          };
        })
        .filter(c => !needle || c.name.toLowerCase().includes(needle))
        .sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
      return;
    }

    let query = supabase.from(activeTab).select(`id, name, ${urlColumn}`).order('name').limit(ROW_LIMIT);
    if (debouncedSearch.trim()) query = query.ilike('name', `%${debouncedSearch.trim()}%`);
    const { data: rows, error: rowErr } = await query;
    if (stale()) return;
    if (rowErr) { setError(`Could not read ${activeTab}: ${rowErr.message}`); setLoading(false); return; }

    // The row's own column wins; the bucket folder is a fallback for anything
    // dropped straight into storage.
    setAssets((rows || []).map(row => ({ ...row, url: row[urlColumn] || art.get(String(row.id)) || null })));
    setLoading(false);
  }, [isDM, activeTab, debouncedSearch]);

  useEffect(() => { loadAssets(); }, [loadAssets]);

  const uploadFor = async (id, file) => {
    const { blob, ext, contentType } = await prepareImageForUpload(file);
    const path = `${activeTab}/${id}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType });
    if (upErr) throw new Error(`Upload refused: ${upErr.message}`);
    const url = publicUrl(path);

    // Write the row's own image column too, so the Bestiary, NPC panel and item
    // catalog all pick this up — they read the column, not the bucket.
    const { urlColumn } = TAB_CONFIG[activeTab];
    const { data: linked, error: colErr } = await supabase
      .from(activeTab).update({ [urlColumn]: url }).eq('id', id).select('id');
    if (colErr) throw new Error(`Saved the image but could not link it: ${colErr.message}`);
    if (!linked?.length) throw new Error('Saved the image but a database policy blocked linking it to the row.');
    return url;
  };

  const onFileSelected = async (e, id) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(String(id));
    setError('');
    try {
      const url = await uploadFor(id, file);
      setAssets(prev => prev.map(a => (a.id === id ? { ...a, url: bust(url) } : a)));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  // Moments have no row to hang off, so the filename becomes the id.
  const addMoments = async (files) => {
    setBusy('moments');
    setError('');
    try {
      for (const file of files) {
        const slug = `${normalize(baseName(file.name)).replace(/\s+/g, '-') || 'moment'}-${Date.now()}`;
        const { blob, ext, contentType } = await prepareImageForUpload(file);
        const { error: upErr } = await supabase.storage.from(BUCKET).upload(`moments/${slug}.${ext}`, blob, { upsert: true, contentType });
        if (upErr) throw new Error(`Upload refused: ${upErr.message}`);
      }
      await loadAssets();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  // Bulk seeding: match dropped filenames against row names so the DM never has
  // to look up a single id. This is the one thing the Supabase dashboard is good
  // at, recovered without its UUID problem.
  const bulkMatch = async (files) => {
    setBusy('bulk');
    setError('');
    try {
      const { data: rows, error: rowErr } = await supabase.from(activeTab).select('id, name');
      if (rowErr) throw new Error(`Could not read ${activeTab}: ${rowErr.message}`);
      const byName = new Map((rows || []).map(r => [normalize(r.name), r.id]));

      const matched = [];
      const missed = [];
      for (const file of files) {
        const id = byName.get(normalize(baseName(file.name)));
        if (id) matched.push([id, file]); else missed.push(file.name);
      }

      for (const [id, file] of matched) await uploadFor(id, file);
      await loadAssets();
      if (missed.length) {
        setError(`Matched ${matched.length}. No ${activeTab.slice(0, -1)} named: ${missed.slice(0, 6).join(', ')}${missed.length > 6 ? ` (+${missed.length - 6} more)` : ''}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const readOnlyTab = !!TAB_CONFIG[activeTab]?.readOnly;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (readOnlyTab) return; // nothing here accepts uploads
    const files = [...(e.dataTransfer?.files || [])].filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    if (activeTab === 'moments') addMoments(files); else bulkMatch(files);
  };

  const castAsset = async (asset) => {
    if (!vttCampaignId) { setError('Open a campaign before casting.'); return; }
    if (!asset.url) { setError('That tile has no image yet.'); return; }
    setBusy(`cast-${asset.id}`);
    setError('');
    try {
      const { data: session } = await supabase.from('vtt_sessions').select('id').eq('campaign_id', vttCampaignId).maybeSingle();
      if (!session?.id) throw new Error('No live map for this campaign yet — open the VTT first.');
      const overlay = { url: asset.url.split('?')[0], title: asset.name || '', caption: '', mode: 'card', cast_at: new Date().toISOString() };
      // Row-count check: a policy-blocked update returns success with zero rows.
      const { data: updated, error: castErr } = await supabase
        .from('vtt_sessions').update({ cast_overlay: overlay }).eq('id', session.id).select('id');
      if (castErr) throw new Error(`Cast failed: ${castErr.message}`);
      if (!updated?.length) throw new Error('Nothing was written — a database policy blocked the cast.');
      setCastNow(overlay);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const clearCast = async () => {
    if (!vttCampaignId) return;
    setBusy('clear');
    try {
      const { data: session } = await supabase.from('vtt_sessions').select('id').eq('campaign_id', vttCampaignId).maybeSingle();
      if (session?.id) await supabase.from('vtt_sessions').update({ cast_overlay: null }).eq('id', session.id);
      setCastNow(null);
    } finally {
      setBusy('');
    }
  };

  if (!roleChecked) return null;
  if (!isDM) return null;

  return (
    <div style={{ fontFamily: 'Georgia, serif', color: COLORS.text, padding: embedded ? 14 : 0, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* What the table is seeing right now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 12, borderRadius: 6, border: `1px solid ${castNow ? 'rgba(200,168,74,0.45)' : COLORS.border}`, background: castNow ? 'rgba(200,168,74,0.08)' : 'transparent' }}>
        {castNow?.url && <img src={castNow.url} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, border: `1px solid ${COLORS.border}`, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...label8(), color: castNow ? '#e8c84a' : COLORS.dim }}>{castNow ? 'On the table' : 'Nothing cast'}</div>
          <div style={{ fontSize: 11, color: COLORS.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {castNow?.title || <span style={{ color: COLORS.dim, fontStyle: 'italic' }}>Players see only the map</span>}
          </div>
        </div>
        {castNow && (
          <button onClick={clearCast} disabled={busy === 'clear'}
            style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim, letterSpacing: '0.1em', flexShrink: 0 }}>
            {busy === 'clear' ? '…' : '✕ Clear'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 12, paddingBottom: 8 }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab); setSearch(''); setError(''); }}
            style={{ padding: '5px 10px', background: tab === activeTab ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${tab === activeTab ? 'rgba(200,168,74,0.5)' : 'transparent'}`, borderRadius: 5, cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: tab === activeTab ? '#e8c84a' : COLORS.dim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab !== 'moments' && (
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${activeTab}…`}
          style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
      )}

      {/* The file input is a SIBLING of the drop zone, not a child. Nested, the
          programmatic .click() bubbled back up to the drop zone's own onClick,
          which re-entered the handler and left the picker never opening. */}
      <input ref={momentInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => { const files = [...(e.target.files || [])]; e.target.value = ''; if (files.length) addMoments(files); }} />

      {/* Drop zone: bulk name-matching on table tabs, free-form on moments */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => { if (activeTab === 'moments') momentInputRef.current?.click(); }}
        style={{ border: `1px dashed ${dragOver ? 'rgba(200,168,74,0.7)' : COLORS.border}`, background: dragOver ? 'rgba(200,168,74,0.07)' : 'transparent', borderRadius: 6, padding: '10px 12px', marginBottom: 12, textAlign: 'center', fontSize: 10, color: COLORS.dim, fontStyle: 'italic', cursor: activeTab === 'moments' ? 'pointer' : 'default' }}>
        {busy === 'bulk' || busy === 'moments'
          ? 'Uploading…'
          : readOnlyTab
            ? 'Portraits are set on the character sheet — cast them from here'
            : activeTab === 'moments'
              ? 'Drop images here, or click to browse — anything you want to show the table'
              : `Drop images named after ${activeTab} to match them in bulk`}
      </div>

      {error && <div style={{ marginBottom: 10, padding: '7px 10px', background: COLORS.warnBg, border: `1px solid ${COLORS.warn}`, borderRadius: 5, color: COLORS.warn, fontSize: 10, fontStyle: 'italic' }}>{error}</div>}

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {loading && <div style={{ fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Reading the archive…</div>}
        {!loading && !assets.length && <div style={{ fontSize: 11, color: COLORS.dim, fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>Nothing here yet.</div>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 10 }}>
          {assets.map(asset => {
            const broken = brokenIds.has(asset.id);
            const castable = !!asset.url && !broken;
            const isOnTable = !!asset.url && castNow?.url === asset.url.split('?')[0];
            return (
            <div key={asset.id} style={{ position: 'relative' }}>
              {/* A real <img> rather than a CSS background, so a URL that fails to
                  load is detectable — otherwise "no art" and "art is broken" render
                  identically and the broken one still offers a Cast button. */}
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: COLORS.card, border: `1px solid ${isOnTable ? 'rgba(200,168,74,0.6)' : COLORS.border}`, borderRadius: 6, marginBottom: 5, overflow: 'hidden' }}>
                {castable && (
                  <img src={asset.url} alt="" loading="lazy"
                    onError={() => setBrokenIds(prev => new Set(prev).add(asset.id))}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                )}
                {!castable && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 6, fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: broken ? COLORS.warn : `${COLORS.dim}99` }}>
                    {broken ? 'Image failed' : 'No art yet'}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 10, color: COLORS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.name || asset.id}</div>

              <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <button onClick={() => castAsset(asset)} disabled={!castable || busy === `cast-${asset.id}`}
                  style={{ flex: 1, background: castable ? 'rgba(200,168,74,0.12)' : 'transparent', border: `1px solid ${castable ? 'rgba(200,168,74,0.4)' : COLORS.border}`, borderRadius: 4, padding: '3px 0', cursor: castable ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.08em', color: castable ? '#e8c84a' : COLORS.dim }}>
                  {busy === `cast-${asset.id}` ? '…' : '◈ Cast'}
                </button>
                {activeTab !== 'moments' && !readOnlyTab && (
                  <label style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, lineHeight: 1.4 }}>
                    {busy === String(asset.id) ? '…' : '✎'}
                    <input type="file" accept="image/*" onChange={e => onFileSelected(e, asset.id)} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
