import { useState } from 'react';
import { useDevice } from './useDevice';
import {
  COLORS, ALL_STATS, ALL_CLASSES, RACES, ACTIONS,
  APPAREL_SLOTS, WEAPON_SLOTS, ACCESSORY_SLOTS,
  getRaceDisplay,
} from './constants';
import { ScribeConsult, DMConsult } from './ScribeConsult';

const TABS = [
  { id: 'identity',   label: 'Identity'   },
  { id: 'background', label: 'Background' },
  { id: 'stats',      label: 'Stats'      },
  { id: 'actions',    label: 'Actions'    },
  { id: 'inventory',  label: 'Inventory'  },
  { id: 'consult',    label: 'Consult'    },
];

const axisColor = axis => axis === 'magic' ? COLORS.magic     : COLORS.tech;
const axisText  = axis => axis === 'magic' ? COLORS.magicText : COLORS.techText;

const magicStats = ALL_STATS.filter(s => s.axis === 'magic');
const techStats  = ALL_STATS.filter(s => s.axis === 'tech');

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

function SectionHead({ children }) {
  return <div style={{ ...label8(), marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${COLORS.border}` }}>{children}</div>;
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ ...label8(), marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
        {value || <span style={{ color: COLORS.dim, fontStyle: 'italic' }}>—</span>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    draft:              { label: 'Draft',             color: COLORS.dim,   bg: 'rgba(131,115,100,0.12)' },
    awaiting_adventure: { label: 'Awaiting Approval', color: COLORS.deity, bg: COLORS.deityBg           },
    approved:           { label: 'Approved',          color: COLORS.magic, bg: COLORS.magicBg           },
    rejected:           { label: 'Rejected',          color: COLORS.warn,  bg: COLORS.warnBg            },
  };
  const s = map[status] || map.draft;
  return (
    <div style={{ display: 'inline-block', fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: "'Cinzel', serif", color: s.color, background: s.bg, border: `1px solid ${s.color}`, borderRadius: 4, padding: '3px 10px' }}>
      {s.label}
    </div>
  );
}

function StatDisplay({ statDef, char }) {
  const { key, label, equiv, axis } = statDef;
  const base       = char.stats?.[key]       || 8;
  const item       = char.itemBonuses?.[key]  || 0;
  const condition  = char.conditions?.[key]   || 0;
  const occurrence = char.occurrences?.[key]  || 0;
  const total      = base + item + condition + occurrence;
  const col        = axisColor(axis);
  const pct        = Math.round(((total - 8) / 8) * 100);
  const hasBonus   = item !== 0 || condition !== 0 || occurrence !== 0;

  return (
    <div style={{ background: COLORS.card, border: `1.5px solid ${col}22`, borderRadius: 8, padding: '10px 12px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: axisText(axis), letterSpacing: '0.04em' }}>{label}</div>
          <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 1 }}>{equiv}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 22, fontWeight: 800, color: axisText(axis), lineHeight: 1 }}>{total}</div>
          {hasBonus && (
            <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>
              base {base}{item ? ` +${item}i` : ''}{condition ? ` ${condition > 0 ? '+' : ''}${condition}c` : ''}{occurrence ? ` ${occurrence > 0 ? '+' : ''}${occurrence}o` : ''}
            </div>
          )}
        </div>
      </div>
      <div style={{ height: 3, background: COLORS.dim, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.max(0, Math.min(100, pct))}%`, background: col, borderRadius: 2, transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}

function SliderDisplay({ label, value, leftLabel, rightLabel, col }) {
  const pct = ((value + 4) / 8) * 100;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ ...label8() }}>{label}</span>
        <span style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{leftLabel} ← → {rightLabel}</span>
      </div>
      <div style={{ height: 4, background: COLORS.dim, borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: value < 0 ? `${pct}%` : '50%', right: value > 0 ? `${100 - pct}%` : '50%', background: col, borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: COLORS.muted, opacity: 0.4 }} />
      </div>
    </div>
  );
}

function EquipRow({ slot, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${COLORS.border}` }}>
      <div style={{ ...label8(), minWidth: 90 }}>{slot}</div>
      <div style={{ fontSize: 12, color: value ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: value ? 'normal' : 'italic', flex: 1, textAlign: 'right' }}>
        {value || 'Empty'}
      </div>
    </div>
  );
}

function ActionRow({ action, bonus }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6 }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, letterSpacing: '0.06em' }}>{action}</div>
      <div style={{ fontSize: 10, color: bonus ? COLORS.magicText : COLORS.dim, fontFamily: 'Georgia, serif' }}>{bonus ? `+${bonus}` : '—'}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function CharacterSheet({ char, onUpdateChar, user, onHome }) {
  const { isMobile } = useDevice();
  const [activeTab, setActiveTab] = useState('identity');

  if (!char) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.wizard, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
        No character loaded.
      </div>
    );
  }

  const raceDisplay = getRaceDisplay(char.race, char.rv, char.pmV);
  const cls         = ALL_CLASSES.find(c => c.id === char.cid);
  const sliders     = char.sliders || { morality: 0, magicTech: 0, willWhim: 0 };

  const renderTab = () => {
    switch (activeTab) {

      case 'identity': return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: COLORS.text, letterSpacing: '0.04em', lineHeight: 1.1 }}>{char.name || 'Unnamed'}</div>
              <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>{raceDisplay}{cls ? ` · ${cls.name}` : ''}</div>
            </div>
            <StatusBadge status={char.status || 'draft'} />
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {[{ label: 'Level', value: char.charLevel || 1 }, { label: 'AP Current', value: char.apCurrent || 0 }, { label: 'AP Total', value: char.apTotal || 0 }].map(({ label, value }) => (
              <div key={label} style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ ...label8(), marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 800, color: COLORS.text }}>{value}</div>
              </div>
            ))}
          </div>

          <SectionHead>Personal</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Field label="First Name" value={char.fn} />
            <Field label="Last Name" value={char.ln} />
            <Field label="Age" value={char.age} />
            <Field label="Gender" value={char.gender === 'm' ? 'Male' : char.gender === 'f' ? 'Female' : char.gender} />
          </div>

          <SectionHead>Heritage</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Field label="Race" value={raceDisplay} />
            <Field label="Campaign" value={char.campaign} />
          </div>

          <SectionHead>Belief</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Field label="Affiliation" value={char.beliefType ? char.beliefType.charAt(0).toUpperCase() + char.beliefType.slice(1) : null} />
            <Field label="Deity / Spirit" value={char.deity || char.spirit || char.beliefSub} />
          </div>

          <SectionHead>Class</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
            <Field label="Path" value={char.cp ? char.cp.charAt(0).toUpperCase() + char.cp.slice(1) : null} />
            <Field label="Class" value={cls?.name} />
            <Field label="Discipline" value={cls?.disc} />
            <Field label="Primary Stats" value={cls?.stats} />
          </div>

          <SectionHead>Alignment Snapshot</SectionHead>
          <SliderDisplay label="Morality" value={sliders.morality} leftLabel="Dark" rightLabel="Light" col={sliders.morality >= 0 ? COLORS.magic : COLORS.warn} />
          <SliderDisplay label="Magic | Tech" value={sliders.magicTech} leftLabel="Magic" rightLabel="Tech" col={sliders.magicTech >= 0 ? COLORS.tech : COLORS.magic} />
          <SliderDisplay label="Will | Whim" value={sliders.willWhim} leftLabel="Whim" rightLabel="Will" col={sliders.willWhim >= 0 ? COLORS.techText : COLORS.spiritText} />
        </div>
      );

      case 'background': return (
        <div>
          <SectionHead>Character Boon</SectionHead>
          {char.boonOrigin && <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75, marginBottom: 8 }}>{char.boonOrigin}.</p>}
          {char.boonRole && <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.75, marginBottom: 12 }}>{char.boonRole}.</p>}
          {char.boonPersonality && (
            <div style={{ paddingTop: 12, borderTop: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: COLORS.text, fontFamily: 'Georgia, serif', lineHeight: 1.75, marginBottom: 8 }}>{char.boonPersonality}</p>
              {char.boonGrant && (
                <div style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: COLORS.magicText, fontFamily: "'Cinzel', serif", background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '3px 10px' }}>▸ {char.boonGrant}</div>
              )}
            </div>
          )}
          <SectionHead>Backstory</SectionHead>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ fontSize: 13, color: char.backstory ? COLORS.text : COLORS.dim, fontFamily: 'Georgia, serif', lineHeight: 1.8, margin: 0, fontStyle: char.backstory ? 'normal' : 'italic' }}>
              {char.backstory || 'No backstory written.'}
            </p>
          </div>
          {char.notes && (
            <>
              <SectionHead>Notes</SectionHead>
              <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '14px 16px' }}>
                <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.75, margin: 0 }}>{char.notes}</p>
              </div>
            </>
          )}
        </div>
      );

      case 'stats': return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <SectionHead>Base Stats</SectionHead>
            <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif' }}>
              Total: <span style={{ color: COLORS.text, fontWeight: 700, fontFamily: "'Cinzel', serif" }}>
                {ALL_STATS.reduce((sum, s) => sum + (char.stats?.[s.key] || 8) + (char.itemBonuses?.[s.key] || 0) + (char.conditions?.[s.key] || 0) + (char.occurrences?.[s.key] || 0), 0)}
              </span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.magicText, fontFamily: "'Cinzel', serif", marginBottom: 8 }}>Magic / Spiritual</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{magicStats.map(s => <StatDisplay key={s.key} statDef={s} char={char} />)}</div>
            </div>
            <div>
              <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.techText, fontFamily: "'Cinzel', serif", marginBottom: 8 }}>Tech / Mortal</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{techStats.map(s => <StatDisplay key={s.key} statDef={s} char={char} />)}</div>
            </div>
          </div>
          <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ ...label8(), marginBottom: 8 }}>Modifier Key</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[['i', 'Item bonus'], ['c', 'Condition modifier'], ['o', 'Occurrence (permanent)']].map(([k, v]) => (
                <div key={k} style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'Georgia, serif' }}><span style={{ color: COLORS.text, fontWeight: 700 }}>{k}</span> — {v}</div>
              ))}
            </div>
          </div>
        </div>
      );

      case 'actions': return (
        <div>
          {Object.entries(ACTIONS).map(([category, actions]) => {
            if (category === 'magic' && char.cp !== 'magic') return null;
            if (category === 'tech'  && char.cp !== 'tech')  return null;
            return (
              <div key={category} style={{ marginBottom: 20 }}>
                <SectionHead>{category.charAt(0).toUpperCase() + category.slice(1)}</SectionHead>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {actions.map(action => <ActionRow key={action} action={action} bonus={char.actionBonuses?.[action]} />)}
                </div>
              </div>
            );
          })}
        </div>
      );

      case 'inventory': return (
        <div>
          <SectionHead>Apparel</SectionHead>
          <div style={{ marginBottom: 20 }}>{APPAREL_SLOTS.map(slot => <EquipRow key={slot} slot={slot} value={char.apparel?.[slot]} />)}</div>
          <SectionHead>Weapons</SectionHead>
          <div style={{ marginBottom: 20 }}>{WEAPON_SLOTS.map(slot => <EquipRow key={slot} slot={slot} value={char.weapons?.[slot]} />)}</div>
          <SectionHead>Accessories</SectionHead>
          <div style={{ marginBottom: 20 }}>{ACCESSORY_SLOTS.map(slot => <EquipRow key={slot} slot={slot} value={char.accessories?.[slot]} />)}</div>
          <SectionHead>Pack</SectionHead>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: 20 }}>
            <Field label="Consumables" value={char.inventory?.consumables} />
            <Field label="Coin" value={char.inventory?.coin} />
            <Field label="Weight" value={char.inventory?.weight} />
            <Field label="Misc" value={char.inventory?.misc} />
          </div>
          {char.inventory?.pack && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ ...label8(), marginBottom: 6 }}>Pack Contents</div>
              <p style={{ fontSize: 12, color: COLORS.textSub, fontFamily: 'Georgia, serif', lineHeight: 1.7, margin: 0 }}>{char.inventory.pack}</p>
            </div>
          )}
        </div>
      );

      case 'consult': return (
        <div>
          <ScribeConsult char={char} onUpdateChar={onUpdateChar} />
          <DMConsult char={char} user={user} />
        </div>
      );

      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.wizard, display: 'flex', flexDirection: 'column', fontFamily: 'Georgia, serif', color: COLORS.text }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: isMobile ? '12px 16px' : '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.muted, padding: 0 }}>← Home</button>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: COLORS.text }}>Adventurer Sheet</div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, overflowX: 'auto', background: COLORS.surface, flexShrink: 0 }}>
        {TABS.map(tab => {
          const isActive = tab.id === activeTab;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: 'transparent', border: 'none', borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`, padding: isMobile ? '10px 12px' : '12px 18px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 8 : 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: isActive ? COLORS.text : COLORS.dim, fontWeight: isActive ? 700 : 400, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s ease' }}>
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: isMobile ? '20px 16px' : '28px 32px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
