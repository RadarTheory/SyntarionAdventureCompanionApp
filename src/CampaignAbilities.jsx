import { useState } from 'react';
import AbilitiesPanel from './AbilitiesPanel';
import ConstellationTab from './ConstellationTab';
import { COLORS } from './constants';

// The campaign's Abilities tab opens on the Constellation, where abilities are learned (and where a character's declared
// class opens the first time it is shown); "Use" switches to the abilities already learned.
export default function CampaignAbilities({ char, campaignId, onRoll, onUpdateChar }) {
  const [view, setView] = useState('constellation');
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['constellation', 'Constellation'], ['use', 'Use']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)}
            style={{ background: view === id ? COLORS.card : 'transparent', border: `1px solid ${view === id ? COLORS.muted : COLORS.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: view === id ? COLORS.text : COLORS.dim }}>
            {label}
          </button>
        ))}
      </div>
      {view === 'use'
        ? <AbilitiesPanel char={char} campaignId={campaignId} onRoll={onRoll} />
        : (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 230px)', minHeight: 520 }}>
            <ConstellationTab char={char} onUpdateChar={onUpdateChar} />
          </div>
        )}
    </div>
  );
}
