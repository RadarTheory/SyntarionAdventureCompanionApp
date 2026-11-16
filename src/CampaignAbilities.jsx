import { useState } from 'react';
import AbilitiesPanel from './AbilitiesPanel';
import ConstellationTab from './ConstellationTab';
import { COLORS } from './constants';

// The campaign's Abilities tab fills the page (CampaignView gives it the same full-bleed layout as the Map). It opens on the
// Constellation, where abilities are learned (and where a character's declared class opens the first time it is shown);
// "Use" switches to the abilities already learned.
export default function CampaignAbilities({ char, campaignId, onRoll, onUpdateChar }) {
  const [view, setView] = useState('constellation');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', gap: 6, padding: '10px 16px', flexShrink: 0, borderBottom: `1px solid ${COLORS.border}` }}>
        {[['constellation', 'Constellation'], ['use', 'Use']].map(([id, label]) => (
          <button key={id} onClick={() => setView(id)}
            style={{ background: view === id ? COLORS.card : 'transparent', border: `1px solid ${view === id ? COLORS.muted : COLORS.border}`, borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: view === id ? COLORS.text : COLORS.dim }}>
            {label}
          </button>
        ))}
      </div>
      {view === 'constellation'
        ? (
          // The page's root only has a min-height, so percentage heights below it collapse the iframe to its 150px default;
          // filling an absolutely positioned box does not depend on them.
          <div style={{ position: 'relative', flex: '1 1 0', minHeight: 360 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
              <ConstellationTab char={char} onUpdateChar={onUpdateChar} />
            </div>
          </div>
        )
        : (
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 24px 40px' }}>
              <AbilitiesPanel char={char} campaignId={campaignId} onRoll={onRoll} />
            </div>
          </div>
        )}
    </div>
  );
}
