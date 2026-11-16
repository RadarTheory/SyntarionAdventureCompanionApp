import { useState } from 'react';
import AbilitiesPanel from './AbilitiesPanel';
import ConstellationTab from './ConstellationTab';
import { COLORS } from './constants';

// The campaign's Abilities tab: use what you have learned, or open the Constellation to learn more (it also opens a
// character's declared class the first time it is shown).
export default function CampaignAbilities({ char, campaignId, onRoll, onUpdateChar }) {
  const [view, setView] = useState('use');
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['use', 'Use'], ['constellation', 'Constellation']].map(([id, label]) => (
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
