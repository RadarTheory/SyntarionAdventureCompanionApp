import { useState, useEffect } from 'react';
import supabase from './lib/supabase';

const ADMIN_UUID = 'fd2b5a52-e179-4234-9265-9b5ab36d6ace';

const TABLES = [
  'campaigns','modules','characters','character_items','items',
  'lootboxes','lootbox_items','messages','sessions','session_checkins',
  'session_logs','vtt_sessions','hercules_sessions','hercules_events',
  'hercules_initiative','world_clock','npcs','beasts','grimoire_entries',
  'larks','merchants','dm_memory','legal_acceptances',
];

const PAGE_SIZE = 50;

const S = {
  input: { background:'#1a1714', border:'1px solid #3a352e', borderRadius:6, padding:'8px 10px', color:'#f0eeeb', fontSize:12, fontFamily:'monospace', outline:'none' },
  btn: { background:'rgba(200,168,74,0.14)', border:'1px solid rgba(200,168,74,0.5)', borderRadius:6, padding:'7px 14px', color:'#e8c84a', fontSize:11, cursor:'pointer', fontFamily:'monospace' },
  btnDanger: { background:'rgba(224,90,90,0.1)', border:'1px solid rgba(224,90,90,0.4)', borderRadius:6, padding:'7px 14px', color:'#ef4444', fontSize:11, cursor:'pointer', fontFamily:'monospace' },
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
  const [editRow, setEditRow] = useState(null);   // row object being edited
  const [editText, setEditText] = useState('');
  const [status, setStatus] = useState('');
  const [inserting, setInserting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data?.session || null); setAuthChecked(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const isAdmin = session?.user?.id === ADMIN_UUID;
  const activeTable = customTable.trim() || table;

  const load = async () => {
    setStatus('Loading…');
    let q = supabase.from(activeTable).select('*', { count: 'exact' }).range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (filterCol.trim() && filterVal.trim()) q = q.ilike(filterCol.trim(), `%${filterVal.trim()}%`);
    const { data, count, error } = await q;
    if (error) { setStatus(`Error: ${error.message}`); setRows([]); return; }
    setRows(data || []); setTotal(count || 0); setStatus('');
  };

  useEffect(() => { if (isAdmin) { setPage(0); setEditRow(null); } }, [activeTable]);
  useEffect(() => { if (isAdmin) load(); }, [isAdmin, activeTable, page]);

  const login = async () => {
    setAuthErr('');
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    if (error) setAuthErr(error.message);
  };

  const openEdit = (row) => { setEditRow(row); setInserting(false); setEditText(JSON.stringify(row, null, 2)); };
  const openInsert = () => { setEditRow({}); setInserting(true); setEditText('{\n  \n}'); };

  const saveEdit = async () => {
    let parsed;
    try { parsed = JSON.parse(editText); } catch (e) { setStatus(`Bad JSON: ${e.message}`); return; }
    setStatus('Saving…');
    if (inserting) {
      const { error } = await supabase.from(activeTable).insert(parsed);
      setStatus(error ? `Error: ${error.message}` : 'Inserted.');
    } else {
      const { id, ...rest } = parsed;
      const { error } = await supabase.from(activeTable).update(rest).eq('id', editRow.id);
      setStatus(error ? `Error: ${error.message}` : 'Saved.');
    }
    setEditRow(null); load();
  };

  const deleteRow = async () => {
    if (!window.confirm(`DELETE row ${editRow.id} from ${activeTable}? This is permanent.`)) return;
    const { error } = await supabase.from(activeTable).delete().eq('id', editRow.id);
    setStatus(error ? `Error: ${error.message}` : 'Deleted.');
    setEditRow(null); load();
  };

  if (!authChecked) return null;

  // ── LOGIN GATE ──
  if (!session || !isAdmin) {
    return (
      <div style={{ minHeight:'100vh', background:'#0a0806', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace' }}>
        <div style={{ width:320, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ color:'#e8c84a', fontSize:14, letterSpacing:'0.2em', textAlign:'center', marginBottom:8 }}>THEONHEX ADMIN</div>
          {session && !isAdmin && (
            <div style={{ color:'#ef4444', fontSize:11, textAlign:'center' }}>
              This account is not authorized.
              <button onClick={() => supabase.auth.signOut()} style={{ ...S.btnDanger, display:'block', margin:'10px auto 0' }}>Sign out</button>
            </div>
          )}
          {!session && (<>
            <input style={S.input} placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input style={S.input} type="password" placeholder="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()} />
            {authErr && <div style={{ color:'#ef4444', fontSize:10 }}>{authErr}</div>}
            <button style={S.btn} onClick={login}>Enter</button>
          </>)}
        </div>
      </div>
    );
  }

  // ── PORTAL ──
  return (
    <div style={{ minHeight:'100vh', background:'#0a0806', color:'#f0eeeb', fontFamily:'monospace', display:'flex' }}>
      {/* Sidebar */}
      <div style={{ width:200, borderRight:'1px solid #2a251e', padding:12, display:'flex', flexDirection:'column', gap:4, flexShrink:0, height:'100vh', overflowY:'auto', position:'sticky', top:0 }}>
        <div style={{ color:'#e8c84a', fontSize:11, letterSpacing:'0.15em', marginBottom:8 }}>TABLES</div>
        {TABLES.map(t => (
          <button key={t} onClick={() => { setTable(t); setCustomTable(''); }}
            style={{ textAlign:'left', background: activeTable === t ? 'rgba(200,168,74,0.12)' : 'transparent', border:'none', color: activeTable === t ? '#e8c84a' : '#8a8378', fontSize:11, padding:'4px 8px', cursor:'pointer', fontFamily:'monospace', borderRadius:4 }}>{t}</button>
        ))}
        <input style={{ ...S.input, marginTop:8, fontSize:10 }} placeholder="other table…" value={customTable} onChange={e => setCustomTable(e.target.value)} />
        <button onClick={() => supabase.auth.signOut()} style={{ ...S.btnDanger, marginTop:'auto', fontSize:10 }}>Sign out</button>
      </div>

      {/* Main */}
      <div style={{ flex:1, padding:16, minWidth:0 }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap:'wrap' }}>
          <div style={{ color:'#e8c84a', fontSize:13 }}>{activeTable}</div>
          <div style={{ color:'#8a8378', fontSize:10 }}>{total} rows</div>
          <input style={{ ...S.input, width:120 }} placeholder="column" value={filterCol} onChange={e => setFilterCol(e.target.value)} />
          <input style={{ ...S.input, width:160 }} placeholder="contains…" value={filterVal} onChange={e => setFilterVal(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} />
          <button style={S.btn} onClick={() => { setPage(0); load(); }}>Filter</button>
          <button style={S.btn} onClick={openInsert}>+ Insert</button>
          <div style={{ marginLeft:'auto', display:'flex', gap:6, alignItems:'center' }}>
            <button style={S.btn} disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>‹</button>
            <span style={{ fontSize:10, color:'#8a8378' }}>page {page + 1} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span>
            <button style={S.btn} onClick={() => setPage(p => p + 1)}>›</button>
          </div>
        </div>
        {status && <div style={{ fontSize:10, color:'#e8a84a', marginBottom:8 }}>{status}</div>}

        {/* Row list */}
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {rows.map(r => (
            <button key={r.id ?? JSON.stringify(r)} onClick={() => openEdit(r)}
              style={{ textAlign:'left', background:'#12100c', border:'1px solid #2a251e', borderRadius:5, padding:'7px 10px', color:'#c9c2b6', fontSize:10, fontFamily:'monospace', cursor:'pointer', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
              {JSON.stringify(r)}
            </button>
          ))}
        </div>

        {/* Edit modal */}
        {editRow !== null && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
            <div style={{ background:'#12100c', border:'1px solid #3a352e', borderRadius:10, padding:20, width:'100%', maxWidth:720, maxHeight:'85vh', display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ color:'#e8c84a', fontSize:12 }}>{inserting ? `INSERT into ${activeTable}` : `EDIT ${activeTable} · ${editRow.id}`}</div>
              <textarea value={editText} onChange={e => setEditText(e.target.value)} spellCheck={false}
                style={{ ...S.input, flex:1, minHeight:340, resize:'vertical', lineHeight:1.5 }} />
              <div style={{ display:'flex', gap:8 }}>
                <button style={S.btn} onClick={saveEdit}>{inserting ? 'Insert' : 'Save'}</button>
                {!inserting && <button style={S.btnDanger} onClick={deleteRow}>Delete row</button>}
                <button style={{ ...S.btn, background:'transparent', color:'#8a8378', borderColor:'#3a352e' }} onClick={() => setEditRow(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}