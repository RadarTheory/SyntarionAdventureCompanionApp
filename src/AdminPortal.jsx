import { useState, useEffect, useCallback } from 'react';
import supabase from './lib/supabase';
import CompendiumUpload from './CompendiumUpload';
import PlayersPanel from './PlayersPanel';
import HandbookBookmark from './HandbookBookmark';

const ADMIN_UUID = import.meta.env.VITE_DM_USER_ID || 'fd2b5a52-e179-4234-9265-9b5ab36d6ace';

const TABLES = [
  'campaigns', 'modules', 'characters', 'character_items', 'items',
  'trades', 'trade_items', 'npc_inventory',
  'lootboxes', 'lootbox_items', 'messages', 'sessions', 'session_checkins',
  'session_logs', 'vtt_sessions', 'hercules_sessions', 'hercules_events',
  'hercules_initiative', 'world_clock', 'npcs', 'beasts', 'grimoire_entries',
  'larks', 'dm_memory', 'support_reports', 'legal_acceptances', 'scribe_context',
];

const PAGE_SIZE = 50;
const STATUS_COLORS = {
  hercules: '#e8a84a',
  session_log: '#79f5a7',
  dm_memory: '#c084fc',
  session: '#7dd3fc',
};

const S = {
  input: { background: '#1a1714', border: '1px solid #3a352e', borderRadius: 6, padding: '8px 10px', color: '#f0eeeb', fontSize: 12, fontFamily: 'monospace', outline: 'none' },
  btn: { background: 'rgba(200,168,74,0.14)', border: '1px solid rgba(200,168,74,0.5)', borderRadius: 6, padding: '7px 14px', color: '#e8c84a', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' },
  btnDanger: { background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.4)', borderRadius: 6, padding: '7px 14px', color: '#ef4444', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' },
};

const cellText = (v) => {
  if (v === null || v === undefined) return '-';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

export default function AdminPortal() {
  const [session, setSession] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [authErr, setAuthErr] = useState('');

  const [table, setTable] = useState(TABLES[0]);
  const [customTable, setCustomTable] = useState('');
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [filterCol, setFilterCol] = useState('');
  const [filterVal, setFilterVal] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [editRow, setEditRow] = useState(null);
  const [editText, setEditText] = useState('');
  const [status, setStatus] = useState('');
  const [inserting, setInserting] = useState(false);
  const [cellEdit, setCellEdit] = useState(null);
  const [cellVal_, setCellVal] = useState('');
  const [view, setView] = useState('tables');
  const [handbookOpenSignal, setHandbookOpenSignal] = useState(0);
  const [tlCampaign, setTlCampaign] = useState('4');
  const [tlEvents, setTlEvents] = useState([]);
  const [tlClock, setTlClock] = useState(null);
  const [tlCampaigns, setTlCampaigns] = useState([]);

  const isAdmin = session?.user?.id === ADMIN_UUID;
  const activeTable = customTable.trim() || table;

  const resetTableView = useCallback(() => {
    setPage(0);
    setEditRow(null);
    setCellEdit(null);
    setStatusFilter(null);
  }, []);

  const loadTimeline = useCallback(async (cid) => {
    setStatus('Loading timeline...');
    const [camps, clock, hsessions, logs, lore, sess] = await Promise.all([
      supabase.from('campaigns').select('id, subtitle').order('id', { ascending: true }),
      supabase.from('world_clock').select('*').eq('campaign_id', cid).maybeSingle(),
      supabase.from('hercules_sessions').select('id').eq('campaign_id', cid),
      supabase.from('session_logs').select('id, title, entry, summary, created_at').eq('campaign_id', cid),
      supabase.from('dm_memory').select('id, content, category, created_at').eq('campaign_id', cid),
      supabase.from('sessions').select('id, status, created_at, started_at').eq('campaign_id', cid),
    ]);

    setTlCampaigns(camps.data || []);
    setTlClock(clock.data || null);

    const hsIds = (hsessions.data || []).map((h) => h.id);
    let hevents = [];
    if (hsIds.length) {
      const { data } = await supabase.from('hercules_events')
        .select('id, type, actor_name, description, created_at, session_id')
        .in('session_id', hsIds)
        .order('created_at', { ascending: false })
        .limit(500);
      hevents = data || [];
    }

    const merged = [
      ...hevents.map((e) => ({ ...e, _src: 'hercules', _label: `${e.type} / ${e.actor_name || '-'}`, _body: e.description })),
      ...(logs.data || []).map((e) => ({ ...e, _src: 'session_log', _label: e.title || 'Session Record', _body: e.entry || e.summary })),
      ...(lore.data || []).map((e) => ({ ...e, _src: 'dm_memory', _label: e.category || 'memory', _body: e.content })),
      ...(sess.data || []).map((e) => ({ ...e, _src: 'session', _label: `session ${e.status}`, _body: `Session ${e.id} - ${e.status}` })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setTlEvents(merged);
    setStatus('');
  }, []);

  const load = useCallback(async () => {
    setStatus('Loading...');
    let q = supabase
      .from(activeTable)
      .select('*', { count: 'exact' })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (filterCol.trim() && filterVal.trim()) q = q.ilike(filterCol.trim(), `%${filterVal.trim()}%`);
    if (statusFilter) q = q.eq('status', statusFilter);

    const { data, count, error } = await q;
    if (error) {
      setStatus(`Error: ${error.message}`);
      setRows([]);
      setTotal(0);
      return;
    }

    setRows(data || []);
    setTotal(count || 0);
    setStatus('');
  }, [activeTable, filterCol, filterVal, page, statusFilter]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session || null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAdmin && view === 'timeline') queueMicrotask(() => { void loadTimeline(tlCampaign); });
  }, [isAdmin, view, tlCampaign, loadTimeline]);

  useEffect(() => {
    if (isAdmin && view === 'tables') queueMicrotask(() => { void load(); });
  }, [isAdmin, view, load]);

  const login = async () => {
    setAuthErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setAuthErr(error.message);
  };

  const saveCell = async (row) => {
    const { col } = cellEdit;
    let val = cellVal_;
    if (val === '') val = null;
    else if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (!Number.isNaN(Number(val)) && val.trim() !== '' && typeof row[col] === 'number') val = Number(val);

    setCellEdit(null);
    setStatus('Saving...');
    const { error } = await supabase.from(activeTable).update({ [col]: val }).eq('id', row.id);
    setStatus(error ? `Error: ${error.message}` : 'Saved.');
    void load();
  };

  const openEdit = (row) => {
    setEditRow(row);
    setInserting(false);
    setEditText(JSON.stringify(row, null, 2));
  };

  const openInsert = () => {
    setEditRow({});
    setInserting(true);
    setEditText('{\n  \n}');
  };

  const saveEdit = async () => {
    let parsed;
    try {
      parsed = JSON.parse(editText);
    } catch (e) {
      setStatus(`Bad JSON: ${e.message}`);
      return;
    }

    setStatus('Saving...');
    if (inserting) {
      const { error } = await supabase.from(activeTable).insert(parsed);
      setStatus(error ? `Error: ${error.message}` : 'Inserted.');
    } else {
      const { id: _id, ...rest } = parsed;
      const { error } = await supabase.from(activeTable).update(rest).eq('id', editRow.id);
      setStatus(error ? `Error: ${error.message}` : 'Saved.');
    }
    setEditRow(null);
    void load();
  };

  const deleteRow = async () => {
    if (!window.confirm(`DELETE row ${editRow.id} from ${activeTable}? This is permanent.`)) return;
    const { error } = await supabase.from(activeTable).delete().eq('id', editRow.id);
    setStatus(error ? `Error: ${error.message}` : 'Deleted.');
    setEditRow(null);
    void load();
  };

  const chooseTable = (t) => {
    setTable(t);
    setCustomTable('');
    resetTableView();
  };

  const chooseCustomTable = (value) => {
    setCustomTable(value);
    resetTableView();
  };

  const toggleStatus = (value) => {
    setPage(0);
    setStatusFilter((current) => (current === value ? null : value));
  };

  if (!authChecked) return null;

  if (!session || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0806', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' }}>
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ color: '#e8c84a', fontSize: 14, letterSpacing: '0.2em', textAlign: 'center', marginBottom: 8 }}>THEONHEX ADMIN</div>
          {session && !isAdmin && (
            <div style={{ color: '#ef4444', fontSize: 11, textAlign: 'center' }}>
              This account is not authorized.
              <button onClick={() => supabase.auth.signOut()} style={{ ...S.btnDanger, display: 'block', margin: '10px auto 0' }}>Sign out</button>
            </div>
          )}
          {!session && (<>
            <input style={S.input} placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input style={S.input} type="password" placeholder="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && login()} />
            {authErr && <div style={{ color: '#ef4444', fontSize: 10 }}>{authErr}</div>}
            <button style={S.btn} onClick={login}>Enter</button>
          </>)}
        </div>
      </div>
    );
  }

  const statuses = [...new Set(rows.map((r) => r.status).filter(Boolean))];

  return (
    <>
      <HandbookBookmark user={session.user} darkMode allowEdit trigger="external" openSignal={handbookOpenSignal} />
      <button
        onClick={() => setHandbookOpenSignal((n) => n + 1)}
        title="Player Handbook"
        style={{
          position: 'fixed',
          right: 'calc(18px + env(safe-area-inset-right))',
          bottom: 'calc(18px + env(safe-area-inset-bottom))',
          zIndex: 900,
          background: '#2a2118',
          border: '1px solid rgba(200,168,74,0.55)',
          borderRadius: 8,
          padding: '12px 16px 9px',
          color: '#c9a961',
          cursor: 'pointer',
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          boxShadow: '0 10px 28px rgba(0,0,0,0.45)',
        }}
      >
        Handbook
      </button>
      <div style={{ minHeight: '100vh', background: '#0a0806', color: '#f0eeeb', fontFamily: 'monospace', display: 'flex' }}>
      <div style={{ width: 200, borderRight: '1px solid #2a251e', padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0, height: '100vh', overflowY: 'auto', position: 'sticky', top: 0 }}>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          {[[ 'tables', 'Tables' ], [ 'players', 'Players' ], [ 'timeline', 'Timeline' ], [ 'upload', 'Scribe' ]].map(([v, l]) => (
            <button key={v} onClick={() => setView(v)}
              style={{ flex: 1, background: view === v ? 'rgba(200,168,74,0.14)' : 'transparent', border: `1px solid ${view === v ? 'rgba(200,168,74,0.5)' : '#3a352e'}`, borderRadius: 5, padding: '5px 0', color: view === v ? '#e8c84a' : '#8a8378', fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}>{l}</button>
          ))}
        </div>
        <div style={{ color: '#e8c84a', fontSize: 11, letterSpacing: '0.15em', marginBottom: 8 }}>TABLES</div>
        {TABLES.map((t) => (
          <button key={t} onClick={() => chooseTable(t)}
            style={{ textAlign: 'left', background: activeTable === t ? 'rgba(200,168,74,0.12)' : 'transparent', border: 'none', color: activeTable === t ? '#e8c84a' : '#8a8378', fontSize: 11, padding: '4px 8px', cursor: 'pointer', fontFamily: 'monospace', borderRadius: 4 }}>{t}</button>
        ))}
        <input style={{ ...S.input, marginTop: 8, fontSize: 10 }} placeholder="other table..." value={customTable} onChange={(e) => chooseCustomTable(e.target.value)} />
        <button onClick={() => supabase.auth.signOut()} style={{ ...S.btnDanger, marginTop: 'auto', fontSize: 10 }}>Sign out</button>
      </div>

      <div style={{ flex: 1, padding: 16, minWidth: 0 }}>
        {view === 'upload' && <CompendiumUpload />}

        {view === 'players' && (
          <div>
            <div style={{ color: '#e8c84a', fontSize: 13, marginBottom: 14 }}>PLAYERS</div>
            <PlayersPanel embedded />
          </div>
        )}

        {view === 'timeline' && (
          <div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ color: '#e8c84a', fontSize: 13 }}>TIMELINE</div>
              <select value={tlCampaign} onChange={(e) => setTlCampaign(e.target.value)} style={{ ...S.input, fontSize: 11 }}>
                {tlCampaigns.map((c) => <option key={c.id} value={String(c.id)}>{c.subtitle} ({c.id})</option>)}
              </select>
              {tlClock && (
                <div style={{ fontSize: 10, color: '#8a8378', border: '1px solid #2a251e', borderRadius: 5, padding: '5px 10px' }}>
                  World Clock: {JSON.stringify(tlClock).slice(0, 160)}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#8a8378' }}>{tlEvents.length} events</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 900 }}>
              {tlEvents.map((e) => (
                <div key={`${e._src}-${e.id}`} style={{ display: 'flex', gap: 10, border: '1px solid #1e1a15', borderRadius: 5, padding: '6px 10px', fontSize: 10 }}>
                  <div style={{ color: '#4a453c', flexShrink: 0, width: 130 }}>{new Date(e.created_at).toLocaleString()}</div>
                  <div style={{ color: STATUS_COLORS[e._src], flexShrink: 0, width: 80 }}>{e._src}</div>
                  <div style={{ color: '#e8c84a', flexShrink: 0, width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e._label}</div>
                  <div style={{ color: '#c9c2b6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={e._body}>{e._body}</div>
                </div>
              ))}
              {tlEvents.length === 0 && <div style={{ color: '#4a453c', fontSize: 11, padding: '20px 0' }}>No events for this campaign.</div>}
            </div>
          </div>
        )}

        {view === 'tables' && (<>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <div style={{ color: '#e8c84a', fontSize: 13 }}>{activeTable}</div>
            <div style={{ color: '#8a8378', fontSize: 10 }}>{total} rows</div>
            <input style={{ ...S.input, width: 120 }} placeholder="column" value={filterCol} onChange={(e) => setFilterCol(e.target.value)} />
            <input style={{ ...S.input, width: 160 }} placeholder="contains..." value={filterVal} onChange={(e) => setFilterVal(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
            <button style={S.btn} onClick={() => { setPage(0); void load(); }}>Filter</button>
            <button style={S.btn} onClick={openInsert}>+ Insert</button>
            {statuses.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {statuses.map((s) => (
                  <button key={s} onClick={() => toggleStatus(s)}
                    style={{ ...S.btn, padding: '4px 10px', fontSize: 9,
                      background: statusFilter === s ? 'rgba(121,245,167,0.15)' : 'transparent',
                      borderColor: statusFilter === s ? 'rgba(121,245,167,0.5)' : '#3a352e',
                      color: statusFilter === s ? '#79f5a7' : '#8a8378' }}>{s}</button>
                ))}
                {statusFilter && <button onClick={() => { setPage(0); setStatusFilter(null); }} style={{ ...S.btn, padding: '4px 8px', fontSize: 9, color: '#ef4444', borderColor: 'rgba(224,90,90,0.4)' }}>x</button>}
              </div>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
              <button style={S.btn} disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>{'<'}</button>
              <span style={{ fontSize: 10, color: '#8a8378' }}>page {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
              <button style={S.btn} onClick={() => setPage((p) => p + 1)}>{'>'}</button>
            </div>
          </div>
          {status && <div style={{ fontSize: 10, color: '#e8a84a', marginBottom: 8 }}>{status}</div>}

          {rows.length > 0 && (() => {
            const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];
            return (
              <div style={{ overflowX: 'auto', border: '1px solid #2a251e', borderRadius: 6 }}>
                <table style={{ borderCollapse: 'collapse', fontSize: 10, width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '6px 8px', borderBottom: '1px solid #3a352e', color: '#e8c84a', textAlign: 'left', position: 'sticky', top: 0, background: '#12100c' }}>...</th>
                      {cols.map((c) => <th key={c} style={{ padding: '6px 8px', borderBottom: '1px solid #3a352e', color: '#e8c84a', textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0, background: '#12100c' }}>{c}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id ?? JSON.stringify(r)} style={{ borderBottom: '1px solid #1e1a15' }}>
                        <td style={{ padding: '4px 8px' }}>
                          <button onClick={() => openEdit(r)} title="Edit full row as JSON"
                            style={{ background: 'transparent', border: '1px solid #3a352e', borderRadius: 4, color: '#8a8378', fontSize: 9, cursor: 'pointer', padding: '2px 6px' }}>{'{}'}</button>
                        </td>
                        {cols.map((c) => {
                          const isCell = cellEdit && cellEdit.rowId === r.id && cellEdit.col === c;
                          const isObj = r[c] !== null && typeof r[c] === 'object';
                          return (
                            <td key={c}
                              onDoubleClick={() => { if (c === 'id' || isObj) return; setCellEdit({ rowId: r.id, col: c }); setCellVal(r[c] === null ? '' : String(r[c])); }}
                              style={{ padding: '4px 8px', color: r[c] === null ? '#4a453c' : '#c9c2b6', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: (c === 'id' || isObj) ? 'default' : 'cell' }}
                              title={isObj ? 'Edit via {} button (JSON)' : cellText(r[c])}>
                              {isCell ? (
                                <input autoFocus value={cellVal_} onChange={(e) => setCellVal(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveCell(r); if (e.key === 'Escape') setCellEdit(null); }}
                                  onBlur={() => setCellEdit(null)}
                                  style={{ ...S.input, padding: '2px 6px', fontSize: 10, width: '100%', boxSizing: 'border-box' }} />
                              ) : cellText(r[c])}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {editRow !== null && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
              <div style={{ background: '#12100c', border: '1px solid #3a352e', borderRadius: 10, padding: 20, width: '100%', maxWidth: 720, maxHeight: '85vh', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ color: '#e8c84a', fontSize: 12 }}>{inserting ? `INSERT into ${activeTable}` : `EDIT ${activeTable} / ${editRow.id}`}</div>
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} spellCheck={false}
                  style={{ ...S.input, flex: 1, minHeight: 340, resize: 'vertical', lineHeight: 1.5 }} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={S.btn} onClick={saveEdit}>{inserting ? 'Insert' : 'Save'}</button>
                  {!inserting && <button style={S.btnDanger} onClick={deleteRow}>Delete row</button>}
                  <button style={{ ...S.btn, background: 'transparent', color: '#8a8378', borderColor: '#3a352e' }} onClick={() => setEditRow(null)}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </>)}
      </div>
      </div>
    </>
  );
}
