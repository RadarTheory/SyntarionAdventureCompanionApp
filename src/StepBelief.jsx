import { useState } from 'react';
import { useDevice } from './useDevice';
import { COLORS, GODS, SPIRITS, UNAFFILIATED } from './constants';
import StepStage from './wizard/StepStage';
import { versioned } from './wizard/assetVersion';
import './wizard/belief.css';

// ═════════════════════════════════════════════════════════════════════════════
// STEP BELIEF (user, 2026-11-17)
// On the wizard's full-page stage: every faith is a star. Sanctus, the gods, is a ring of the Soterian pantheon with
// the Primordials and Celestials inside it; Sacral, the spirits, is Soteria's four elementals as one diamond, with the
// unaffiliated stances beneath it. Only Soteria's spirits are offered at creation (user, 2026-11-17); the Simic and
// Lorük elementals stay in the data for later. Resting on a star reads it a beat later; choosing one settles it. What is saved is as
// before: beliefType ('god' | 'spirit' | 'unaffiliated') with deity, spirit or beliefSub.
// ═════════════════════════════════════════════════════════════════════════════

// Each god's own symbol (public/GodIcons, from the creator's Soterian God Symbols, user 2026-11-17). Gods without one
// yet stay plain stars.
const GOD_ICONS = new Set(['asherah', 'atu', 'elgar', 'rota', 'zathon', 'baelnim', 'baeshra', 'daretror', 'denka', 'draagora', 'duneyrr', 'fiharta', 'firreth', 'hreidmar', 'ilo', 'khoneus', 'lotjarr', 'maakurg', 'myr', 'ruehnar', 'shevar', 'syreth', 'thietmar', 'urul', 'ylandar']);
const godSlug = (name) => String(name).replace(/ł/g, 'l').normalize('NFD').toLowerCase().replace(/[^a-z]/g, '');
const godIcon = (name) => { const s = godSlug(name); return GOD_ICONS.has(s) ? versioned(`/GodIcons/${s}.png`) : null; };
// Each spirit's symbol (public/SpiritIcons, from the creator's Elemental Spirits symbols): named by the pair, e.g. inanhnbrek.
const SPIRIT_ICONS = new Set(['aehalussil', 'amalazayvull', 'birnirnal', 'dinrin', 'dioysisild', 'enkigourn', 'inanhnbrek', 'ixhade', 'lusunziakapa', 'reynuifu', 'sevaxparthen', 'vanglig']);
const spiritIcon = (name) => { const s = godSlug(name); return SPIRIT_ICONS.has(s) ? versioned(`/SpiritIcons/${s}.png`) : null; };
// Each unaffiliated stance's symbol (public/StanceIcons), named by its id.
const STANCE_ICONS = new Set(['atheistic', 'agnostic', 'nihilistic', 'none']);
const iconFor = (kind, item) => kind === 'god' ? godIcon(item.name)
  : kind === 'spirit' ? spiritIcon(item.name)
  : kind === 'unaffiliated' && STANCE_ICONS.has(item.id) ? versioned(`/StanceIcons/${item.id}.png`) : null;
// The spirits offered at creation: Soteria's own elementals.
const CREATION_SPIRITS = SPIRITS.filter(g => /^soteria/i.test(g.label));

const KINDS = {
  god:          { accent: COLORS.deityText,        title: 'SANCTUS',      sub: 'THE GODS' },
  spirit:       { accent: COLORS.spiritText,       title: 'SACRAL',       sub: 'THE SPIRITS' },
  unaffiliated: { accent: COLORS.unaffiliatedText, title: 'UNAFFILIATED', sub: 'NO ALLEGIANCE' },
};

// ── Where each star sits, as percentages of its constellation's box ──
function godStars() {
  const byLabel = Object.fromEntries(GODS.map(g => [g.label, g.list]));
  const ring = byLabel.Soterian || GODS[0]?.list || [];
  const stars = ring.map((g, i) => {
    const a = -Math.PI / 2 + (i / ring.length) * Math.PI * 2;
    return { item: g, x: 50 + Math.cos(a) * 40, y: 54 + Math.sin(a) * 34 };
  });
  const pair = (list, y) => (list || []).slice(0, 2).map((g, i) => ({ item: g, x: i ? 61 : 39, y }));
  const prim = pair(byLabel.Primordials, 44), cel = pair(byLabel.Celestials, 64);
  return {
    stars: [...stars, ...prim, ...cel],
    lines: [prim, cel].filter(p => p.length === 2).map(([a, b]) => [a, b]),
    groups: [['PRIMORDIALS', 50, 37], ['CELESTIALS', 50, 73]],
    ring: { cx: 50, cy: 54, rx: 40, ry: 34 },
  };
}
function spiritStars(isMobile) {
  // One diamond: Soteria's four elementals around their name.
  const [cx, cy] = isMobile ? [50, 56] : [50, 58];
  const ox = isMobile ? 30 : 19, oy = isMobile ? 28 : 26;
  const offs = [[0, -oy], [ox, 0], [0, oy], [-ox, 0]];
  const stars = [], lines = [], groups = [];
  CREATION_SPIRITS.forEach(group => {
    const pts = group.list.slice(0, 4).map((sp, i) => ({ item: sp, x: cx + offs[i][0], y: cy + offs[i][1] }));
    stars.push(...pts);
    pts.forEach((p, i) => { if (pts.length > 1) lines.push([p, pts[(i + 1) % pts.length]]); });
    groups.push([group.label.replace(/ elemental$/i, '').toUpperCase(), cx, cy]);
  });
  return { stars, lines, groups };
}
function stanceStars() {
  return { stars: UNAFFILIATED.map((u, i) => ({ item: { ...u, name: u.label }, x: 14 + i * (72 / Math.max(1, UNAFFILIATED.length - 1)), y: 58 })), lines: [], groups: [] };
}

function Constellation({ kind, layout, box, lit, chosen, onLit, onChoose, interactive }) {
  const k = KINDS[kind];
  return (
    <div className="bf-box" style={{ ...box, '--accent': k.accent }}>
      <svg aria-hidden="true">
        {layout.ring && <ellipse cx={`${layout.ring.cx}%`} cy={`${layout.ring.cy}%`} rx={`${layout.ring.rx}%`} ry={`${layout.ring.ry}%`} />}
        {layout.lines.map(([a, b], i) => <line key={i} x1={`${a.x}%`} y1={`${a.y}%`} x2={`${b.x}%`} y2={`${b.y}%`} />)}
      </svg>
      <div className="bf-title"><b>{k.title}</b><small>{k.sub}</small></div>
      {layout.groups.map(([label, x, y]) => <div key={label} className="bf-group" style={{ left: `${x}%`, top: `${y}%` }}>{label}</div>)}
      {layout.stars.map(({ item, x, y }) => {
        const id = `${kind}:${item.id || item.name}`;
        const icon = iconFor(kind, item);
        return (
          <button
            key={id} type="button"
            className={`bf-star${icon ? ' sym' : ''}${lit === id ? ' lit' : ''}${chosen === id ? ' chosen' : ''}`}
            style={{ left: `${x}%`, top: `${y}%` }}
            onMouseEnter={() => interactive && onLit(id)}
            onMouseLeave={() => interactive && onLit(null)}
            onFocus={() => interactive && onLit(id)}
            onBlur={() => interactive && onLit(null)}
            onClick={() => onChoose(kind, item)}
            aria-label={`${item.name}${item.domain ? `, ${item.domain}` : ''}`}
            aria-pressed={chosen === id}
          >
            <i style={icon ? { '--glyph': `url("${icon}")` } : undefined} /><span>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP BELIEF
// ═════════════════════════════════════════════════════════════════════════════
export default function StepBelief({
  beliefType, setBeliefType,
  beliefSub, setBeliefSub,
  deity, setDeity,
  spirit, setSpirit,
  goNext, goBack,
  magicTech = 0, willWhim = 0,
}) {
  const { isMobile } = useDevice();
  const [lit, setLit] = useState(null);

  const choose = (kind, item) => {
    setBeliefType(kind);
    setDeity(kind === 'god' ? item.name : null);
    setSpirit(kind === 'spirit' ? item.name : null);
    setBeliefSub(kind === 'unaffiliated' ? item.id : null);
  };

  const chosen = beliefType === 'god' && deity ? `god:${deity}`
    : beliefType === 'spirit' && spirit ? `spirit:${spirit}`
    : beliefType === 'unaffiliated' && beliefSub ? `unaffiliated:${beliefSub}` : null;

  const find = (id) => {
    if (!id) return null;
    const [kind, key] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
    const item = kind === 'god' ? GODS.flatMap(g => g.list).find(g => g.name === key)
      : kind === 'spirit' ? SPIRITS.flatMap(g => g.list).find(s => s.name === key)
      : UNAFFILIATED.find(u => u.id === key);
    return item ? { kind, item } : null;
  };
  const shown = find(lit) || find(chosen);
  const showingChosen = !lit || lit === chosen;
  const canAdvance = !!chosen;

  const boxes = isMobile
    ? { god: { height: 430 }, spirit: { height: 320 }, unaffiliated: { height: 110 } }
    : {
      god: { left: '3%', top: '9%', width: '45%', height: '60%' },
      spirit: { left: '52%', top: '9%', width: '45%', height: '42%' },
      unaffiliated: { left: '52%', top: '55%', width: '45%', height: '15%' },
    };
  const common = { lit, chosen, onLit: setLit, onChoose: choose, interactive: !isMobile };

  const lore = (
    <div className="wz-loreband">
      {shown ? (
        <div className={`wz-lore${showingChosen ? ' now' : ''}`} key={`${lit || chosen}`} style={{ '--accent': KINDS[shown.kind].accent }}>
          <span>
            {(shown.item.name || shown.item.label).toUpperCase()}{shown.item.domain ? ` · ${shown.item.domain.toUpperCase()}` : ''}
            {showingChosen && chosen && <em className="wz-chosen-mark" style={{ fontStyle: 'normal' }}>· CHOSEN</em>}
          </span>
          <p>{shown.item.desc}</p>
          {shown.item.affil && <small className="bf-lore-domain">{shown.item.affil}</small>}
        </div>
      ) : (
        <p className="wz-hint">{isMobile ? 'Touch a star to take it as your faith.' : 'Rest on a star to read it. Choose one to take it as your faith.'}</p>
      )}
    </div>
  );

  return (
    <StepStage
      back={{ label: 'Race', onClick: goBack }}
      next={{ label: 'Class', onClick: goNext, disabled: !canAdvance }}
      magicTech={magicTech} willWhim={willWhim}
    >
      <svg className="wz-dust" aria-hidden="true">
        {Array.from({ length: 90 }, (_, i) => {
          const x = (i * 37.3) % 100, y = (i * 61.7 + (i % 7) * 13) % 100;
          return <circle key={i} cx={`${x}%`} cy={`${y}%`} r={i % 9 ? 0.6 : 1.1} fill="#dfe3d2" opacity={0.1 + ((i * 13) % 30) / 100} />;
        })}
      </svg>
      <div className={`bf${lit ? ' focusing' : ''}`}>
        <div className="wz-caption"><small>THE FAITHS OF SOTERIA</small><h2>Choose your belief</h2></div>
        {isMobile && lore}
        <Constellation kind="god" layout={godStars()} box={boxes.god} {...common} />
        <Constellation kind="spirit" layout={spiritStars(isMobile)} box={boxes.spirit} {...common} />
        <Constellation kind="unaffiliated" layout={stanceStars()} box={boxes.unaffiliated} {...common} />
        {!isMobile && lore}
      </div>
    </StepStage>
  );
}
