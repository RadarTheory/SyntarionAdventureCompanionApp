import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// ─── ENTRY TYPE CONFIG ────────────────────────────────────────────────────────
const ENTRY_TYPES = {
  beast:  { label: 'Beast',   icon: '⬡', color: '#e08a5a', bg: 'rgba(224,138,90,0.10)'  },
  npc:    { label: 'Person',  icon: '◈', color: '#79b4f5', bg: 'rgba(121,180,245,0.10)' },
  note:   { label: 'Note',    icon: '✦', color: '#79f5a7', bg: 'rgba(121,245,167,0.10)' },
  event:  { label: 'Event',   icon: '◉', color: '#c084fc', bg: 'rgba(192,132,252,0.10)' },
};

const TYPE_ORDER = ['beast', 'npc', 'event', 'note'];

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function TypeBadge({ type }) {
  const t = ENTRY_TYPES[type] || ENTRY_TYPES.note;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: t.bg, border: `1px solid ${t.color}44`, borderRadius: 20, padding: '2px 8px', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', color: t.color }}>
      {t.icon} {t.label}
    </div>
  );
}

// ─── ENTRY CARD ───────────────────────────────────────────────────────────────
function EntryCard({ entry, isOwn, onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const t = ENTRY_TYPES[entry.type] || ENTRY_TYPES.note;

  return (
    <div style={{ background: COLORS.card, border: `1px solid ${open ? t.color + '44' : COLORS.border}`, borderRadius: 8, marginBottom: 6, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: t.bg, border: `1px solid ${t.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: t.color, flexShrink: 0 }}>
          {t.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, letterSpacing: '0.04em', marginBottom: 2 }}>{entry.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TypeBadge type={entry.type} />
            <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>
              {new Date(entry.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: COLORS.dim, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</div>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${COLORS.border}` }}>
          {entry.body && (
            <p style={{ fontSize: 11, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: '10px 0 0', whiteSpace: 'pre-wrap' }}>{entry.body}</p>
          )}
          {entry.dm_note && (
            <div style={{ marginTop: 10, padding: '8px 10px', background: 'rgba(200,168,74,0.07)', border: '1px solid rgba(200,168,74,0.25)', borderRadius: 6 }}>
              <div style={{ ...label8(), color: '#e8c84a', marginBottom: 4 }}>Architect's Note</div>
              <p style={{ fontSize: 11, color: '#e8d9a7', fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>{entry.dm_note}</p>
            </div>
          )}
          {isOwn && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => onEdit(entry)} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.dim, letterSpacing: '0.1em' }}>Edit Note</button>
              <button onClick={() => onDelete(entry.id)} style={{ background: 'transparent', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#e05a5a', letterSpacing: '0.1em' }}>Delete</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ADD / EDIT FORM ──────────────────────────────────────────────────────────
function EntryForm({ initial, onSave, onCancel, isDM, characters }) {
  const [type, setType]     = useState(initial?.type || 'note');
  const [title, setTitle]   = useState(initial?.title || '');
  const [body, setBody]     = useState(initial?.body || '');
  const [dmNote, setDmNote] = useState(initial?.dm_note || '');
  const [charId, setCharId] = useState(initial?.character_id || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onSave({ type, title: title.trim(), body: body.trim(), dm_note: dmNote.trim(), character_id: charId || null });
    setSaving(false);
  };

  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '16px' }}>
      <div style={{ ...label8(), marginBottom: 12 }}>{initial ? 'Edit Entry' : 'New Entry'}</div>

      {isDM && characters?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ ...label8(), marginBottom: 5 }}>Add to Character's Grimoire</div>
          <select value={charId} onChange={e => setCharId(e.target.value)}
            style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 11, outline: 'none' }}>
            <option value="">— Select character —</option>
            {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {TYPE_ORDER.map(t => {
          const cfg = ENTRY_TYPES[t];
          return (
            <button key={t} onClick={() => setType(t)} style={{ flex: 1, background: type === t ? cfg.bg : 'transparent', border: `1px solid ${type === t ? cfg.color + '66' : COLORS.border}`, borderRadius: 6, padding: '6px 4px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: type === t ? cfg.color : COLORS.dim, letterSpacing: '0.08em', textAlign: 'center' }}>
              {cfg.icon} {cfg.label}
            </button>
          );
        })}
      </div>

      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title…"
        style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />

      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your entry…" rows={4}
        style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8, lineHeight: 1.6 }} />

      {isDM && (
        <textarea value={dmNote} onChange={e => setDmNote(e.target.value)} placeholder="Architect's note (optional, shown to player in gold)…" rows={2}
          style={{ width: '100%', background: 'rgba(200,168,74,0.06)', border: '1px solid rgba(200,168,74,0.2)', borderRadius: 6, padding: '8px 10px', color: '#e8d9a7', fontFamily: 'Georgia, serif', fontSize: 11, fontStyle: 'italic', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save} disabled={saving || !title.trim()}
          style={{ flex: 1, background: 'rgba(121,245,167,0.12)', border: '1px solid rgba(121,245,167,0.4)', borderRadius: 7, padding: '9px', cursor: saving || !title.trim() ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#79f5a7', fontWeight: 700, letterSpacing: '0.1em' }}>
          {saving ? 'Saving…' : '✦ Save Entry'}
        </button>
        <button onClick={onCancel} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '9px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Cancel</button>
      </div>
    </div>
  );
}

// ─── GRIMOIRE PANEL ───────────────────────────────────────────────────────────
export default function GrimoirePanel({ char, campaignId, isDM = false, embedded = false }) {
  const [entries, setEntries]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editEntry, setEditEntry]   = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch]         = useState('');
  const [characters, setCharacters] = useState([]); // DM only
  const [viewCharId, setViewCharId] = useState(char?.id ? String(char.id) : '');

  const charId = isDM ? viewCharId : (char?.id ? String(char.id) : null);

  useEffect(() => {
    if (isDM) {
      supabase.from('characters').select('id, name').eq('campaign_id', String(campaignId)).then(({ data }) => {
        if (data) setCharacters(data);
        if (data?.length > 0 && !viewCharId) setViewCharId(String(data[0].id));
      });
    }
  }, [isDM, campaignId]);

  useEffect(() => {
    if (!charId && !isDM) return;
    loadEntries();
    const sub = supabase.channel(`grimoire-${charId || campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'grimoire_entries' }, loadEntries)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [charId, campaignId]);

  const loadEntries = async () => {
    setLoading(true);
    let q = supabase.from('grimoire_entries').select('*').order('created_at', { ascending: false });
    if (charId) q = q.eq('character_id', charId);
    else if (campaignId) q = q.eq('campaign_id', String(campaignId));
    const { data } = await q;
    if (data) setEntries(data);
    setLoading(false);
  };

  const saveEntry = async (fields) => {
    const targetCharId = isDM ? (fields.character_id || viewCharId) : charId;
    if (!targetCharId) return;

    if (editEntry) {
      await supabase.from('grimoire_entries').update({
        type: fields.type,
        title: fields.title,
        body: fields.body,
        dm_note: fields.dm_note || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editEntry.id);
    } else {
      await supabase.from('grimoire_entries').insert({
        character_id: targetCharId,
        campaign_id: String(campaignId),
        type: fields.type,
        title: fields.title,
        body: fields.body || null,
        dm_note: fields.dm_note || null,
      });
    }
    setShowForm(false);
    setEditEntry(null);
    loadEntries();
  };

  const deleteEntry = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await supabase.from('grimoire_entries').delete().eq('id', id);
    loadEntries();
  };

  const filtered = entries.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !(e.body || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = TYPE_ORDER.reduce((acc, t) => {
    const items = filtered.filter(e => e.type === t);
    if (items.length > 0) acc[t] = items;
    return acc;
  }, {});

  const inner = (
    <>
      {/* Header controls */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        {isDM && characters.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...label8(), marginBottom: 5 }}>Viewing Grimoire of</div>
            <select value={viewCharId} onChange={e => setViewCharId(e.target.value)}
              style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontFamily: "'Cinzel', serif", fontSize: 10, outline: 'none' }}>
              {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…"
            style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', color: COLORS.text, fontFamily: 'Georgia, serif', fontSize: 11, outline: 'none' }} />
          <button onClick={() => { setShowForm(true); setEditEntry(null); }}
            style={{ background: 'rgba(121,245,167,0.1)', border: '1px solid rgba(121,245,167,0.35)', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: '#79f5a7', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>
            + Entry
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all', 'All'], ...TYPE_ORDER.map(t => [t, ENTRY_TYPES[t].label])].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilterType(val)}
              style={{ background: filterType === val ? 'rgba(240,238,235,0.08)' : 'transparent', border: `1px solid ${filterType === val ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.1em', color: filterType === val ? COLORS.text : COLORS.dim }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {showForm && (
          <div style={{ marginBottom: 14 }}>
            <EntryForm
              initial={editEntry}
              onSave={saveEntry}
              onCancel={() => { setShowForm(false); setEditEntry(null); }}
              isDM={isDM}
              characters={isDM ? characters : null}
            />
          </div>
        )}

        {loading && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>Loading grimoire…</div>
        )}

        {!loading && filtered.length === 0 && !showForm && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.3 }}>📖</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.dim, letterSpacing: '0.1em' }}>
              {entries.length === 0 ? 'The grimoire is empty.' : 'No entries match.'}
            </div>
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 6 }}>
              {entries.length === 0 ? 'Beasts slain, people met, and events witnessed will appear here.' : ''}
            </div>
          </div>
        )}

        {!loading && Object.entries(grouped).map(([type, items]) => {
          const cfg = ENTRY_TYPES[type];
          return (
            <div key={type} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${cfg.color}22` }}>
                <span style={{ color: cfg.color, fontSize: 12 }}>{cfg.icon}</span>
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: 8, color: cfg.color, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{cfg.label}s</span>
                <span style={{ fontSize: 8, color: COLORS.dim, marginLeft: 'auto' }}>{items.length}</span>
              </div>
              {items.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isOwn={true}
                  onEdit={e => { setEditEntry(e); setShowForm(true); }}
                  onDelete={deleteEntry}
                />
              ))}
            </div>
          );
        })}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: COLORS.wizard }}>
        {inner}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 400, maxHeight: '82vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: COLORS.wizard, border: `1px solid rgba(121,245,167,0.3)`, borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: `1px solid rgba(121,245,167,0.14)`, background: 'rgba(121,245,167,0.04)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#79f5a7', letterSpacing: '0.18em', fontWeight: 700 }}>GRIMOIRE</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{char?.name} · Adventure Journal</div>
        </div>
      </div>
      {inner}
    </div>
  );
}
