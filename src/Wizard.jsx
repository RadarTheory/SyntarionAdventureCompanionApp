import { useState, useCallback } from 'react';
import { useDevice } from './useDevice';
import {
  COLORS, RACES, ALL_CLASSES, DEFAULT_STATS,
  pick, BS_ORIGINS, BS_ROLE, BS_PERSONALITY,
  getRaceDisplay,
} from './constants';

// ─── STEP IMPORTS (uncomment as you build each one) ───────────────────────────
// import StepRace      from './StepRace';
// import StepBelief    from './StepBelief';
// import StepClass     from './StepClass';
// import StepStats     from './StepStats';
// import StepBackstory from './StepBackstory';
// import CharacterSheet from './CharacterSheet';

// ─── STEPS ────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 'race',      label: 'Race'      },
  { id: 'belief',    label: 'Belief'    },
  { id: 'class',     label: 'Class'     },
  { id: 'stats',     label: 'Stats'     },
  { id: 'backstory', label: 'Backstory' },
  { id: 'sheet',     label: 'Sheet'     },
];

// ─── SLIDER HELPERS ───────────────────────────────────────────────────────────
// Clamps a slider value between -4 and +4
const clamp = (v, min = -4, max = 4) => Math.max(min, Math.min(max, v));

// ═════════════════════════════════════════════════════════════════════════════
// LIVE SLIDER PANEL
// Read only for the player. Fixed — bottom on mobile, right panel on desktop.
//
// Sliders:
//   MORALITY     — -4 (dark) to +4 (light)
//   MAGIC | TECH — -4 (magic) to +4 (tech)
//   WILL | WHIM  — -4 (whim/dex) to +4 (will/str)
// ═════════════════════════════════════════════════════════════════════════════
function SliderPanel({ morality, magicTech, willWhim, isMobile }) {
  const sliders = [
    {
      id: 'morality',
      label: 'MORALITY',
      value: morality,
      leftLabel: 'Dark',
      rightLabel: 'Light',
      leftColor: COLORS.warn,
      rightColor: COLORS.magic,
      trackColor: (v) => v < 0 ? COLORS.warn : COLORS.magic,
    },
    {
      id: 'magictech',
      label: 'MAGIC  |  TECH',
      value: magicTech,
      leftLabel: 'Magic',
      rightLabel: 'Tech',
      leftColor: COLORS.magic,
      rightColor: COLORS.tech,
      trackColor: (v) => v < 0 ? COLORS.magic : COLORS.tech,
    },
    {
      id: 'willwhim',
      label: 'WILL  |  WHIM',
      value: willWhim,
      leftLabel: 'Whim',
      rightLabel: 'Will',
      leftColor: COLORS.spiritText,
      rightColor: COLORS.techText,
      trackColor: (v) => v < 0 ? COLORS.spiritText : COLORS.techText,
    },
  ];

  const panelStyle = isMobile ? {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    background: 'rgba(26,21,16,0.97)',
    borderTop: `1px solid ${COLORS.border}`,
    padding: '10px 20px 14px',
    display: 'flex', gap: 16,
    backdropFilter: 'blur(8px)',
    zIndex: 50,
  } : {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 200,
    background: 'rgba(26,21,16,0.97)',
    borderLeft: `1px solid ${COLORS.border}`,
    padding: '80px 20px 40px',
    display: 'flex', flexDirection: 'column', gap: 32,
    backdropFilter: 'blur(8px)',
    zIndex: 50,
  };

  return (
    <div style={panelStyle}>
      {sliders.map(s => (
        <SliderItem key={s.id} slider={s} isMobile={isMobile} />
      ))}
    </div>
  );
}

function SliderItem({ slider, isMobile }) {
  const { label, value, leftLabel, rightLabel, leftColor, rightColor, trackColor } = slider;
  // Convert -4..+4 to 0..100%
  const pct = ((value + 4) / 8) * 100;
  const col = trackColor(value);
  const cream = '#f0eeeb';

  if (isMobile) {
    return (
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 7, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: COLORS.muted, fontFamily: "'Cinzel', serif",
          marginBottom: 4, textAlign: 'center',
        }}>{label}</div>
        <div style={{
          height: 3, background: COLORS.dim, borderRadius: 2,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: value < 0 ? `${pct}%` : '50%',
            right: value > 0 ? `${100 - pct}%` : '50%',
            background: col, borderRadius: 2,
            transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
          }}/>
          <div style={{
            position: 'absolute', top: 0, bottom: 0,
            left: '50%', width: 1, background: COLORS.muted, opacity: 0.4,
          }}/>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
        color: COLORS.muted, fontFamily: "'Cinzel', serif", marginBottom: 8,
      }}>{label}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 8, color: cream, fontFamily: 'Georgia, serif', fontStyle: 'italic', opacity: 0.6 }}>{leftLabel}</span>
        <span style={{ fontSize: 8, color: cream, fontFamily: 'Georgia, serif', fontStyle: 'italic', opacity: 0.6 }}>{rightLabel}</span>
      </div>
      <div style={{
        height: 4, background: COLORS.dim, borderRadius: 2,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: value < 0 ? `${pct}%` : '50%',
          right: value > 0 ? `${100 - pct}%` : '50%',
          background: col, borderRadius: 2,
          transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)',
        }}/>
        <div style={{
          position: 'absolute', top: 0, bottom: 0,
          left: '50%', width: 1, background: COLORS.muted, opacity: 0.4,
        }}/>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LIVE BOON PANEL
// Shows the three generated background lines as they build up.
// Displayed inside the main content area, above the step nav.
// ═════════════════════════════════════════════════════════════════════════════
function BoonPanel({ origin, role, personality }) {
  if (!origin && !role && !personality) return null;
  return (
    <div style={{
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 16,
    }}>
      <div style={{
        fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase',
        color: COLORS.muted, fontFamily: "'Cinzel', serif", marginBottom: 10,
      }}>Character forming</div>
      {origin && (
        <p style={{
          fontSize: 11, color: COLORS.textSub, fontFamily: 'Georgia, serif',
          fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 6px',
        }}>{origin}.</p>
      )}
      {role && (
        <p style={{
          fontSize: 11, color: COLORS.textSub, fontFamily: 'Georgia, serif',
          fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 6px',
        }}>{role}.</p>
      )}
      {personality && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
          <p style={{
            fontSize: 11, color: COLORS.text, fontFamily: 'Georgia, serif',
            lineHeight: 1.7, margin: '0 0 4px',
          }}>{personality.text}</p>
          <div style={{
            display: 'inline-block',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            color: COLORS.magicText, fontFamily: "'Cinzel', serif",
            background: COLORS.magicBg,
            border: `1px solid ${COLORS.magic}`,
            borderRadius: 4, padding: '2px 8px',
          }}>▸ {personality.boon}</div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP PROGRESS BAR
// ═════════════════════════════════════════════════════════════════════════════
function StepBar({ currentStep, isMobile }) {
  return (
    <div style={{
      display: 'flex',
      borderBottom: `1px solid ${COLORS.border}`,
      overflowX: 'auto',
      background: COLORS.surface,
    }}>
      {STEPS.map((s, i) => {
        const isActive = s.id === currentStep;
        const isDone = STEPS.findIndex(x => x.id === currentStep) > i;
        return (
          <div key={s.id} style={{
            padding: isMobile ? '10px 12px' : '12px 18px',
            fontFamily: "'Cinzel', serif",
            fontSize: isMobile ? 8 : 9,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isActive ? COLORS.text : isDone ? COLORS.muted : COLORS.dim,
            fontWeight: isActive ? 700 : 400,
            borderBottom: `2px solid ${isActive ? COLORS.text : 'transparent'}`,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease',
            position: 'relative',
          }}>
            {isDone && (
              <span style={{ marginRight: 4, color: COLORS.magic, fontSize: 7 }}>✓</span>
            )}
            {s.label}
          </div>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// WIZARD — owns all character state
// Props:
//   onComplete  — fn(charData) called when character is saved
//   onHome      — fn() back to Landing
// ═════════════════════════════════════════════════════════════════════════════
export default function Wizard({ onComplete, onHome }) {
  const { isMobile, isDesktop } = useDevice();
  const [currentStep, setCurrentStep] = useState('race');

  // ── CHARACTER STATE ──
  const [charId]    = useState(() => Date.now().toString());
  const [fn, setFn] = useState('');
  const [ln, setLn] = useState('');
  const [age, setAge]       = useState('');
  const [gender, setGender] = useState('m');

  // Race
  const [race, setRace]   = useState(null);
  const [rv, setRv]       = useState(null);   // race variant
  const [pmV, setPmV]     = useState(null);   // pa'morph variant

  // Belief
  const [beliefType, setBeliefType]     = useState(null); // 'god'|'spirit'|'unaffiliated'
  const [beliefSub, setBeliefSub]       = useState(null); // unaffiliated sub-type
  const [deity, setDeity]               = useState(null);
  const [spirit, setSpirit]             = useState(null);

  // Class
  const [cp, setCp]   = useState(null);   // 'magic'|'tech'
  const [cid, setCid] = useState(null);   // class id

  // Stats
  const [stats, setStats]       = useState({ ...DEFAULT_STATS });
  const [statMode, setStatMode] = useState('buy'); // 'buy'|'roll'|'manual'

  // Backstory
  const [backstory, setBackstory]   = useState('');
  const [boonOrigin, setBoonOrigin] = useState('');
  const [boonRole, setBoonRole]     = useState('');
  const [boonPersonality, setBoonPersonality] = useState(null);

  // Sheet extras
  const [notes, setNotes]         = useState('');
  const [morality_text, setMoralityText] = useState('');
  const [inventory, setInventory] = useState({ consumables:'', pack:'', coin:'', weight:'', misc:'' });
  const [apparel, setApparel]     = useState({ Head:'', Torso:'', Waist:'', Hands:'', Greaves:'', Boots:'' });
  const [weapons, setWeapons]     = useState({ 'Main Hand':'','Off-Hand':'','Side Weapon':'','Heavy':'' });
  const [accessories, setAccessories] = useState({ 'Ring I':'','Ring II':'','Neck':'','Charm':'','Relic':'','Artifact':'' });
  const [actionBonuses, setActionBonuses] = useState({});
  const [charLevel, setCharLevel] = useState(1);
  const [apCurrent, setApCurrent] = useState(0);
  const [apTotal, setApTotal]     = useState(0);
  const [classAbilities, setClassAbilities]     = useState([]);
  const [heritageAbilities, setHeritageAbilities] = useState([]);
  const [disciplinePoints, setDisciplinePoints] = useState({});
  const [campaign, setCampaign]   = useState('');

  // ── LIVE SLIDERS (read only for player) ──
  // Computed from choices, not manually set by player

  const computeMagicTech = () => {
    let v = 0;
    if (race) {
      const rd = RACES.find(r => r.id === race);
      if (rd) v += rd.lean;
    }
    if (cid) {
      const cls = ALL_CLASSES.find(c => c.id === cid);
      if (cls) v += cls.magicTechNudge;
    }
    return clamp(v);
  };

  const computeMorality = () => {
    let v = 0;
    // Belief nudge
    if (beliefType === 'god' && deity) {
      const allGods = [
        { name:"Ba'elnim", moralityNudge:2 }, { name:"Fi'harta", moralityNudge:1 },
        { name:'Iło', moralityNudge:1 },      { name:'Ruehnar', moralityNudge:1 },
        { name:'Ylandar', moralityNudge:2 },   { name:'Firreth', moralityNudge:-2 },
        { name:'Duneyrr', moralityNudge:-2 },  { name:'Khoneus', moralityNudge:-1 },
        { name:'Baeshra', moralityNudge:0 },   { name:'Daretror', moralityNudge:0 },
        { name:'Hreidmar', moralityNudge:0 },  { name:'Shevar', moralityNudge:0 },
        { name:'Elgar', moralityNudge:2 },     { name:'Zathon', moralityNudge:-1 },
        { name:'Rota', moralityNudge:1 },      { name:'Atu', moralityNudge:1 },
      ];
      const g = allGods.find(x => x.name === deity);
      if (g) v += g.moralityNudge;
    }
    if (beliefType === 'spirit' && spirit) {
      const spiritNudges = {
        'Ix / Hade': -2, 'Reynu / Ifu': 1, 'Sevax / Parthen': 1,
        'Enkì / Gourn': 1, 'Lusunzi / Akapa': 1, 'Dioys / Isild': 1,
      };
      v += spiritNudges[spirit] || 0;
    }
    if (beliefType === 'unaffiliated' && beliefSub === 'nihilism') v -= 1;
    // Personality boon nudge
    if (boonPersonality?.moralityNudge) v += boonPersonality.moralityNudge;
    return clamp(v);
  };

  const computeWillWhim = () => {
    const willVal = stats.will || 8;
    const whimVal = stats.whim || 8;
    // Positive = Will dominant, Negative = Whim dominant
    const diff = willVal - whimVal;
    return clamp(Math.round(diff / 2));
  };

  const morality  = computeMorality();
  const magicTech = computeMagicTech();
  const willWhim  = computeWillWhim();

  // ── BOON GENERATION ──
  // Called reactively when race/class/belief chosen
  const generateBoons = useCallback((raceId, classPath, classId) => {
    const origins = BS_ORIGINS[raceId] || BS_ORIGINS.default;
    setBoonOrigin(pick(origins));

    const rolePath = classPath || 'any';
    const roles = BS_ROLE[rolePath] || BS_ROLE.any;
    setBoonRole(pick(roles));

    const persPath = classPath || 'any';
    const personalities = BS_PERSONALITY[persPath] || BS_PERSONALITY.any;
    setBoonPersonality(pick(personalities));
  }, []);

  // ── NAVIGATION ──
  const stepIndex = STEPS.findIndex(s => s.id === currentStep);
  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setCurrentStep(STEPS[stepIndex + 1].id);
  };
  const goBack = () => {
    if (stepIndex > 0) setCurrentStep(STEPS[stepIndex - 1].id);
    else onHome();
  };

  // ── BUILD CHARACTER OBJECT ──
  const buildChar = () => ({
    id: charId,
    name: `${fn} ${ln}`.trim() || 'Unnamed',
    fn, ln, age, gender,
    race, rv, pmV,
    beliefType, beliefSub, deity, spirit,
    cp, cid,
    stats,
    backstory,
    boonOrigin, boonRole,
    boonPersonality: boonPersonality?.text || '',
    boonGrant: boonPersonality?.boon || '',
    morality: morality_text,
    notes,
    inventory, apparel, weapons, accessories,
    actionBonuses,
    charLevel, apCurrent, apTotal,
    classAbilities, heritageAbilities, disciplinePoints,
    campaign,
    savedAt: Date.now(),
    // Computed slider snapshots at save time
    sliders: { morality, magicTech, willWhim },
  });

  // ── SHARED STEP PROPS ──
  const stepProps = {
    // Character state
    fn, setFn, ln, setLn, age, setAge, gender, setGender,
    race, setRace, rv, setRv, pmV, setPmV,
    beliefType, setBeliefType, beliefSub, setBeliefSub,
    deity, setDeity, spirit, setSpirit,
    cp, setCp, cid, setCid,
    stats, setStats, statMode, setStatMode,
    backstory, setBackstory,
    notes, setNotes,
    campaign, setCampaign,
    // Boon state
    boonOrigin, boonRole, boonPersonality,
    generateBoons,
    // Navigation
    goNext, goBack,
    // Sliders (read only, passed for display reference if needed)
    morality, magicTech, willWhim,
    // Build char (for sheet step)
    buildChar,
    onComplete,
  };

  // ── RENDER STEP ──
  const renderStep = () => {
    switch (currentStep) {
      case 'race':      return <StepStub label="Race & Name"  {...stepProps} />;
      case 'belief':    return <StepStub label="Belief"       {...stepProps} />;
      case 'class':     return <StepStub label="Class"        {...stepProps} />;
      case 'stats':     return <StepStub label="Stats"        {...stepProps} />;
      case 'backstory': return <StepStub label="Backstory"    {...stepProps} />;
      case 'sheet':     return <StepStub label="Sheet"        {...stepProps} />;
      default:          return null;
    }
  };

  const mainPadding = isDesktop ? '0 220px 0 0' : isMobile ? '0 0 80px 0' : '0';

  return (
    <div style={{
      minHeight: '100vh',
      background: COLORS.wizard,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Georgia, serif',
      color: COLORS.text,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.dim}; border-radius: 2px; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: isMobile ? '12px 16px' : '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <button onClick={goBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          fontFamily: "'Cinzel', serif", fontSize: 9,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: COLORS.muted, padding: 0,
        }}>← Back</button>

        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: isMobile ? 11 : 13,
          fontWeight: 700, letterSpacing: '0.16em',
          textTransform: 'uppercase', color: COLORS.text,
        }}>Character Creation</div>

        {/* Spacer */}
        <div style={{ width: 40 }}/>
      </div>

      {/* ── STEP BAR ── */}
      <div style={{ padding: mainPadding, flexShrink: 0 }}>
        <StepBar currentStep={currentStep} isMobile={isMobile} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{
        flex: 1,
        padding: mainPadding,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          padding: isMobile ? '20px 16px' : '28px 32px',
          maxWidth: 680,
          width: '100%',
          margin: '0 auto',
          flex: 1,
        }}>
          {/* Live boon panel — shows after race is picked */}
          <BoonPanel
            origin={boonOrigin}
            role={boonRole}
            personality={boonPersonality}
          />

          {/* Active step */}
          {renderStep()}
        </div>
      </div>

      {/* ── SLIDER PANEL (fixed, read only) ── */}
      <SliderPanel
        morality={morality}
        magicTech={magicTech}
        willWhim={willWhim}
        isMobile={isMobile}
      />
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP STUB — placeholder until each step file is built
// ═════════════════════════════════════════════════════════════════════════════
function StepStub({ label, goNext, goBack }) {
  return (
    <div style={{ textAlign: 'center', paddingTop: 40 }}>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: 11,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: COLORS.muted, marginBottom: 32,
      }}>
        {label} — coming soon
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button onClick={goBack} style={{
          background: 'transparent',
          border: `1px solid ${COLORS.border}`,
          borderRadius: 4, padding: '10px 20px',
          color: COLORS.muted, cursor: 'pointer',
          fontFamily: "'Cinzel', serif", fontSize: 9,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>← Back</button>
        <button onClick={goNext} style={{
          background: COLORS.surface,
          border: `1px solid ${COLORS.borderMid}`,
          borderRadius: 4, padding: '10px 20px',
          color: COLORS.text, cursor: 'pointer',
          fontFamily: "'Cinzel', serif", fontSize: 9,
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>Next →</button>
      </div>
    </div>
  );
}
