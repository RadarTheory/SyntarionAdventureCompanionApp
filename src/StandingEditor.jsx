// The DM's editor for what a character is known for (DMView.jsx's character editor): standings with factions, places and
// clans, and the reputations they hold. A new reputation can be written here; it is saved to the reputations table at once.
// Standings and held reputations are part of the character and are saved with the editor's Save.
import { useEffect, useMemo, useState } from 'react';
import { COLORS } from './constants';
import Picker from './Picker';
import { STANDING_SOURCES, STANDING_KINDS, EFFECT_TYPES, FACTIONS, standingsOf, renownOf, loadReputations, saveReputation, effectLabel } from './reactions';

const box = { marginBottom: 16, padding: '10px 12px', background: 'rgba(200,168,74,0.05)', border: '1px solid rgba(200,168,74,0.22)', borderRadius: 8 };
const label = { fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c8a84a' };
const input = { background: 'rgba(240,238,235,0.04)', border: '1px solid rgba(240,238,235,0.12)', borderRadius: 5, padding: '5px 8px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' };
const btn = { background: 'rgba(200,168,74,0.12)', border: '1px solid rgba(200,168,74,0.45)', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e3cf8f', fontFamily: "'Cinzel', serif" };
const small = { fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' };

const EMPTY_REP = { name: '', description: '', effects: [{ type: 'faction', value: FACTIONS[0], amount: 10 }] };

export default function StandingEditor({ data, set }) {
  const [reputations, setReputations] = useState([]);
  const [adding, setAdding] = useState('');
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { loadReputations().then(setReputations); }, []);

  const standings = useMemo(() => standingsOf(data), [data]);
  const held = new Set(Array.isArray(data.reputations) ? data.reputations : []);
  const writeStandings = list => set('standing', list.map(s => ({ id: s.id, score: s.score })));
  const setScore = (id, score) => writeStandings(standings.map(s => (s.id === id ? { ...s, score: Math.max(-100, Math.min(100, parseInt(score, 10) || 0)) } : s)));
  const addStanding = () => { if (!adding || standings.some(s => s.id === adding)) return; writeStandings([...standings, { id: adding, score: 10 }]); setAdding(''); };
  const removeStanding = id => writeStandings(standings.filter(s => s.id !== id));
  const toggleRep = id => set('reputations', held.has(id) ? [...held].filter(x => x !== id) : [...held, id]);

  const saveDraft = async () => {
    if (!draft?.name.trim()) return;
    setSaving(true); setError('');
    try {
      const row = await saveReputation({ ...draft, effects: draft.effects.filter(e => Number(e.amount)).map(e => ({ type: e.type, ...(e.type === 'all' ? {} : { value: e.value }), amount: Number(e.amount) })) });
      setReputations(await loadReputations());
      set('reputations', [...held, row.id]);
      setDraft(null);
    } catch (e) {
      setError(e.message?.includes('reputations') ? 'The reputations table is not set up yet: run supabase/migrations/20261116_reactions.sql.' : (e.message || 'Could not save the reputation.'));
    }
    setSaving(false);
  };
  const setEffect = (i, patch) => setDraft(d => ({ ...d, effects: d.effects.map((e, k) => (k === i ? { ...e, ...patch } : e)) }));
  const valueChoices = type => type === 'faction' ? FACTIONS : type === 'lean' ? ['magic', 'tech'] : type === 'morality' ? ['good', 'neutral', 'evil']
    : type === 'region' ? STANDING_SOURCES.filter(s => s.kind === 'region').map(s => s.name) : type === 'city' ? STANDING_SOURCES.filter(s => s.kind === 'city').map(s => s.name) : null;

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <div style={{ ...label, flex: 1 }}>Standing &amp; reputations</div>
        <span style={small}>Renown</span>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: 14, color: '#e3cf8f' }}>{renownOf(standings)}</span>
      </div>

      {/* Standings */}
      <div style={{ display: 'grid', gap: 4, marginBottom: 8 }}>
        {standings.length ? standings.map(s => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, fontSize: 11, color: COLORS.textSub, fontFamily: 'Georgia, serif' }}>{s.source.name} <span style={{ color: COLORS.dim, fontSize: 9 }}>· {STANDING_KINDS.find(k => k.id === s.source.kind)?.label}</span></span>
            <input type="number" min={-100} max={100} value={s.score} onChange={e => setScore(s.id, e.target.value)} aria-label={`Standing with ${s.source.name}`}
              style={{ ...input, width: 60, textAlign: 'center', fontFamily: "'Cinzel', serif", color: s.score < 0 ? COLORS.warn : '#e3cf8f' }} />
            <button onClick={() => removeStanding(s.id)} aria-label={`Remove standing with ${s.source.name}`} style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer' }}>×</button>
          </div>
        )) : <span style={small}>No standing anywhere yet.</span>}
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex' }}>
          <Picker label="Add standing with" placeholder="Add standing with…" searchable width={260} value={adding} onChange={setAdding}
            options={STANDING_KINDS.flatMap(k => STANDING_SOURCES.filter(src => src.kind === k.id && !standings.some(x => x.id === src.id)).map(src => ({ value: src.id, label: src.name, hint: src.region || undefined, group: k.label })))} />
        </div>
        <button onClick={addStanding} disabled={!adding} style={btn}>Add</button>
      </div>

      {/* Reputations */}
      <div style={{ ...label, marginBottom: 6 }}>Reputations</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
        {reputations.map(r => {
          const on = held.has(r.id);
          return (
            <button key={r.id} onClick={() => toggleRep(r.id)} aria-pressed={on} title={`${r.description}\n${(r.effects || []).map(effectLabel).join(' · ')}`}
              style={{ border: `1px solid ${on ? 'rgba(200,168,74,0.6)' : COLORS.border}`, background: on ? 'rgba(200,168,74,0.14)' : 'transparent', color: on ? '#ecd99a' : COLORS.muted, borderRadius: 999, padding: '3px 10px', cursor: 'pointer', fontSize: 10, fontFamily: "'Cinzel', serif" }}>
              {on ? '✦ ' : ''}{r.name}
            </button>
          );
        })}
      </div>
      <div style={small}>Hover a reputation to see what it moves. Press Save to keep standings and reputations.</div>

      {!draft ? (
        <button onClick={() => setDraft(EMPTY_REP)} style={{ ...btn, marginTop: 8 }}>Write a new reputation</button>
      ) : (
        <div style={{ marginTop: 10, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 6, display: 'grid', gap: 6 }}>
          <input value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Name, e.g. Ashborn of Hadmont" style={input} />
          <input value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} placeholder="What the character is known for" style={input} />
          {draft.effects.map((e, i) => {
            const choices = valueChoices(e.type);
            return (
              <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <Picker label="Who it moves" compact value={e.type} onChange={type => setEffect(i, { type, value: (valueChoices(type) || [''])[0] })} options={EFFECT_TYPES.map(t => ({ value: t.id, label: t.label }))} />
                {e.type !== 'all' && (choices
                  ? <div style={{ flex: 1, minWidth: 0, display: 'flex' }}><Picker label="Which" compact width={200} value={e.value} onChange={value => setEffect(i, { value })} options={choices.map(c => ({ value: c, label: c }))} /></div>
                  : <input value={e.value || ''} onChange={ev => setEffect(i, { value: ev.target.value })} placeholder="Race, e.g. Durinak" style={{ ...input, flex: 1, minWidth: 0 }} />)}
                {e.type === 'all' && <span style={{ flex: 1 }} />}
                <input type="number" value={e.amount} onChange={ev => setEffect(i, { amount: parseInt(ev.target.value, 10) || 0 })} style={{ ...input, width: 54, textAlign: 'center' }} aria-label="Shift" />
                <button onClick={() => setDraft(d => ({ ...d, effects: d.effects.filter((_, k) => k !== i) }))} aria-label="Remove effect" style={{ background: 'transparent', border: 'none', color: COLORS.dim, cursor: 'pointer' }}>×</button>
              </div>
            );
          })}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setDraft(d => ({ ...d, effects: [...d.effects, { type: 'all', amount: 5 }] }))} style={btn}>+ Effect</button>
            <span style={{ flex: 1 }} />
            <button onClick={() => setDraft(null)} style={{ ...btn, color: COLORS.dim, borderColor: COLORS.border, background: 'transparent' }}>Cancel</button>
            <button onClick={saveDraft} disabled={saving || !draft.name.trim()} style={btn}>{saving ? 'Saving…' : 'Save & grant'}</button>
          </div>
          {error && <div style={{ ...small, color: COLORS.warn, fontStyle: 'normal' }}>{error}</div>}
        </div>
      )}
    </div>
  );
}
