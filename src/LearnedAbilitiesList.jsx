import { useEffect, useState } from 'react';
import { COLORS } from './constants';
import { DISCIPLINE_META, loadConstellation, learnedEntries } from './constellationAbilities';

// Read-only: what a character has learned in the Constellation (data.abilities), grouped by class.
export default function LearnedAbilitiesList({ abilities }) {
  const [entries, setEntries] = useState(null);
  const key = JSON.stringify(abilities || []);
  useEffect(() => {
    let live = true;
    loadConstellation()
      .then(d => { if (live) setEntries(learnedEntries(d, JSON.parse(key))); })
      .catch(() => { if (live) setEntries([]); });
    return () => { live = false; };
  }, [key]);

  const byClass = {};
  for (const e of entries || []) (byClass[e.className] ||= []).push(e);

  return (
    <div>
      <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif", marginBottom: 10 }}>
        Constellation Abilities{entries ? ` · ${entries.length}` : ''}
      </div>
      {entries === null && <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>Reading the constellation…</div>}
      {entries && !entries.length && <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>None learned yet.</div>}
      {Object.entries(byClass).map(([className, list]) => (
        <div key={className} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', marginBottom: 3 }}>{className}</div>
          {list.map(e => (
            <div key={e.id} style={{ fontSize: 10, color: COLORS.text, fontFamily: 'Georgia, serif', padding: '1px 0 1px 10px' }}>
              {e.name}
              <span style={{ color: DISCIPLINE_META[e.discipline]?.color || COLORS.dim, marginLeft: 8, fontSize: 8, fontFamily: "'Cinzel', serif" }}>
                {e.type} · {e.level}/{e.levels} · {e.disciplineLabel}
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
