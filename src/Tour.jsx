import { useEffect, useState, useCallback } from 'react';

// ═════════════════════════════════════════════════════════════════════════════
// TOUR — first-time "How to Play" walkthrough (extended edition)
//
// Player track is organized in three chapters:
//   THE WORLD           — Soteria, the planes, the two axes, the eight stats
//   FORGE AN ADVENTURER — every wizard step, the living sliders, submission
//   AT THE TABLE        — sheet, sessions, VTT, Grimoire, Larks, Bazaar, clock
//
// Usage:
//   import Tour, { hasSeenTour } from './Tour';
//   const [showTour, setShowTour] = useState(!hasSeenTour());
//   {showTour && <Tour isDM={isDM} onClose={() => setShowTour(false) } />}
//
// Re-launch anytime (e.g. a "How to Play" menu item): setShowTour(true).
// localStorage: syn_tour_seen = '1'  (follows syn_* convention)
//
// Icons: drop lowercase PNGs in src/assets/tour/ and reference by filename
// (no extension) via each step's `icon` field. A missing file falls back to
// the step's glyph — the build never breaks on absent art.
// ═════════════════════════════════════════════════════════════════════════════

const LS_KEY = 'syn_tour_seen';
export const hasSeenTour = () => {
  try { return localStorage.getItem(LS_KEY) === '1'; } catch { return false; }
};
const markSeen = () => {
  try { localStorage.setItem(LS_KEY, '1'); } catch { /* private mode */ }
};

// ─── Tour icon loader ─────────────────────────────────────────────────────────
const TOUR_ICONS = import.meta.glob('./assets/tour/*.png', { eager: true, import: 'default' });
const tourIcon = (name) => (name ? TOUR_ICONS[`./assets/tour/${name}.png`] : null);

// ─── Palette (mirrors app constants — swap for COLORS imports if preferred) ──
const C = {
  bg:        'rgba(10, 8, 5, 0.82)',
  card:      '#1a1510',
  cardEdge:  '#3a3226',
  parchment: '#f0eeeb',
  faded:     '#b8ae9d',
  magic:     '#4caf6e',   // green — Magic path
  tech:      '#4a90d9',   // blue — Tech path
  gods:      '#9b6dd6',   // purple — Deities
  spirits:   '#e08a3c',   // orange — Spirits
  gold:      '#d4a437',   // ⟦ LORE ⟧ gold
};

// Chapter accents (used for eyebrow + step dots)
const CHAPTERS = {
  world: { label: 'THE WORLD',           accent: C.gold  },
  forge: { label: 'FORGE AN ADVENTURER', accent: C.magic },
  table: { label: 'AT THE TABLE',        accent: C.tech  },
  dm:    { label: 'DM TOUR',             accent: C.gold  },
};

// ─── Player steps ─────────────────────────────────────────────────────────────
const PLAYER_STEPS = [
  // ── THE WORLD ──────────────────────────────────────────────────────────────
  {
    ch: 'world', glyph: '✦', icon: 'world-disc',
    title: 'Welcome to Soteria',
    body: 'Soteria is a disc-world in the Era of Unity — an age of uneasy peace where old powers and new inventions share the same streets. This app is your seat at the table: your character, your map, your grimoire, and your letters, all living and all yours.',
    accent: C.gold,
  },
  {
    ch: 'world', glyph: '❖', icon: 'planes',
    title: 'The Planes',
    body: 'Soteria is the material plane — but it is not alone. Simic, the plane of magic, and Lorúk, the plane of technology, press against it from either side, with Altum above, Stygia below, and the Void beyond all of them. The Bridge of Sylph binds the planes together, and everything that crosses it leaves a mark on the world.',
    accent: C.gold,
  },
  {
    ch: 'world', glyph: '⚖', icon: 'magic-tech',
    title: 'Magic & Tech',
    body: 'Every soul in Soteria is pulled between two great forces. Magic flows from Simic; Tech radiates from Lorúk. Races lean one way by blood, classes lean by craft, and your choices lean by heart. The app tracks that pull constantly — you will see it move as you play.',
    accent: C.magic,
  },
  {
    ch: 'world', glyph: '✸', icon: 'stats',
    title: 'The Eight Stats',
    body: 'Four stats belong to the Magic axis: Spirit, Soul, Body, and Essence. Four belong to the Tech axis: Will, Whim, Mind, and Dream. Together they describe everything your adventurer can attempt — and where their nature truly lies.',
    accent: C.tech,
  },

  // ── FORGE AN ADVENTURER ────────────────────────────────────────────────────
  {
    ch: 'forge', glyph: 'Ⅰ', icon: 'race',
    title: 'Step One — Race',
    body: 'Choose from fifteen races, each with its own variants, cultures, and naming traditions — from Pa\u2019morph bloodlines to Chronison serial codes. Your race is your first lean on the Magic|Tech scale, so choose the blood before the craft.',
    accent: C.magic,
  },
  {
    ch: 'forge', glyph: 'Ⅱ', icon: 'belief',
    title: 'Step Two — Belief',
    body: 'Pledge to a God, follow a Spirit, or walk unaffiliated — Atheistic, Agnostic, Nihilist, or simply None. Belief is not decoration: what you hold sacred (or refuse to) nudges your Morality before you have taken a single step in the world.',
    accent: C.gods,
  },
  {
    ch: 'forge', glyph: 'Ⅲ', icon: 'class',
    title: 'Step Three — Path & Class',
    body: 'Commit to the Magic path or the Tech path, then choose one of fourteen classes within it. This is the craft that defines how you act on the world — spell, machine, blade, or something between.',
    accent: C.tech,
  },
  {
    ch: 'forge', glyph: 'Ⅳ', icon: 'stats',
    title: 'Step Four — Stats',
    body: 'Each stat rolls 8 + 2d4 — a steady hand of fate, no wild extremes. You get three save slots for your rolls, and assignments are tap-to-place: move numbers between stats as often as you like until you commit. Prefer control? Manual entry is capped 8 to 16.',
    accent: C.parchment,
  },
  {
    ch: 'forge', glyph: 'Ⅴ', icon: 'backstory',
    title: 'Step Five — Backstory',
    body: 'Generate a seed from Soteria\u2019s origin and role pools, or write your own from a blank page. Add an optional campaign hook — a thread for the Dungeon Master to pull. Your boons are already sealed by the choices you made before this page.',
    accent: C.gold,
  },
  {
    ch: 'forge', glyph: '↔', icon: 'sliders',
    title: 'The Living Sliders',
    body: 'Watch the edge of the wizard as you build: Morality, Magic|Tech, and Will|Whim shift in real time with every choice. Nothing is hidden and nothing is arbitrary — who your adventurer is emerges from what you actually chose.',
    accent: C.magic,
  },
  {
    ch: 'forge', glyph: '✉', icon: 'scribe-submit',
    title: 'Submit to the Scribe',
    body: 'When your story is written, submit. Your adventurer travels to the Dungeon Master marked awaiting adventure. The moment the DM claims them into a campaign, the world opens.',
    accent: C.gold,
  },

  // ── AT THE TABLE ───────────────────────────────────────────────────────────
  {
    ch: 'table', glyph: '📜', icon: 'sheet',
    title: 'Know Your Sheet',
    body: 'Identity, Background, Stats, Actions, Inventory — everything about your adventurer lives in one place and updates as you play. Your stats are layered: base, roll, level, items, conditions, and occurrences all stack into what you see.',
    accent: C.parchment,
  },
  {
    ch: 'table', glyph: '⚔', icon: 'session',
    title: 'Sessions & Intent',
    body: 'Join the session lobby when your DM opens the table. Talk in party chat, and when the moment demands action, declare your intent from the Actions tab — the DM sees it the instant you commit.',
    accent: C.tech,
  },
  {
    ch: 'table', glyph: '🗺', icon: 'map',
    title: 'The Living Map',
    body: 'Your token moves through fog that lifts only where the Dungeon Master reveals it. Hover any token for a portrait. Want to move? Send a request — the DM approves or denies it right on the canvas.',
    accent: C.tech,
  },
  {
    ch: 'table', glyph: '📖', icon: 'grimoire',
    title: 'Your Grimoire',
    body: 'The Grimoire is your adventurer\u2019s memory. Every notable person and beast you cross paths with is recorded automatically — no note-taking required. When lore is announced under the gold \u27E6 LORE \u27E7 banner, it lands here too.',
    accent: C.magic,
  },
  {
    ch: 'table', glyph: '🕊', icon: 'lark',
    title: 'Send a Lark',
    body: 'Larks are letters. Send one to another player — or to an NPC, and they will actually write back. Court an ally, press an informant, or keep a correspondence going between sessions. The world answers.',
    accent: C.gold,
  },
  {
    ch: 'table', glyph: '⚖', icon: 'bazaar',
    title: 'The Bazaar & the Scribe',
    body: 'Merchants only trade when you are truly near them — no shopping from across the map. And when you need answers, consult the Scribe, Soteria\u2019s lorekeeper, who responds while your tokens last.',
    accent: C.parchment,
  },
  {
    ch: 'table', glyph: '☉', icon: 'world-clock',
    title: 'The World Keeps Time',
    body: 'Soteria runs on its own 13-cycle calendar, and the World Clock keeps it faithfully. Between scenes, try a round of Driftstone or Fubin. Now — the table is set.',
    accent: C.gold,
  },
];

// ─── DM steps ─────────────────────────────────────────────────────────────────
const DM_STEPS = [
  {
    ch: 'dm', glyph: '✦', icon: 'dm-seat',
    title: 'Welcome, Dungeon Master',
    body: 'Soteria is yours to run. Modules hold your campaigns, and each module is sealed behind its own sigil — only you can open it.',
    accent: C.gold,
  },
  {
    ch: 'dm', glyph: '✉', icon: 'inbox',
    title: 'The Inbox',
    body: 'Players submit finished characters to you here. Claim a character into a campaign and their adventure begins.',
    accent: C.parchment,
  },
  {
    ch: 'dm', glyph: '⚔', icon: 'hercules',
    title: 'Hercules',
    body: 'Your combat tracker — initiative order, bestiary search, and a running event log that feeds the session record.',
    accent: C.tech,
  },
  {
    ch: 'dm', glyph: '🗺', icon: 'vtt',
    title: 'The VTT',
    body: 'Load maps, paint fog with reveal and hide brushes, place tokens, and approve or deny player move requests directly on the canvas.',
    accent: C.tech,
  },
  {
    ch: 'dm', glyph: '⚖', icon: 'solomon',
    title: 'Solomon',
    body: 'Loot governance. Approve rewards and place lootboxes straight onto the map for the party to find.',
    accent: C.gold,
  },
  {
    ch: 'dm', glyph: '📯', icon: 'lore',
    title: 'Announce Lore',
    body: 'One announcement fires everywhere at once — DM Memory, player Grimoires, the Hercules log, and every inbox — under the gold \u27E6 LORE \u27E7 banner.',
    accent: C.gold,
  },
  {
    ch: 'dm', glyph: '🕊', icon: 'lark',
    title: 'Answer the Larks',
    body: 'When players write to your NPCs, the letters land with you. Reply in character and the world writes back — correspondence is a campaign tool.',
    accent: C.magic,
  },
  {
    ch: 'dm', glyph: '📜', icon: 'session-log',
    title: 'The Session Log',
    body: 'When the night ends, draft a synopsis compiled from the real Hercules event stream. The Scribe remembers so you don\u2019t have to.',
    accent: C.magic,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Tour({ isDM = false, onClose }) {
  const steps = isDM ? DM_STEPS : PLAYER_STEPS;
  const [i, setI] = useState(0);
   const [mobile, setMobile] = useState(
    typeof window !== 'undefined' && window.innerWidth < 640
  );
  const [iconHover, setIconHover] = useState(false);

  const last = i === steps.length - 1;
  const step = steps[i];
  const chapter = CHAPTERS[step.ch];
  const art = tourIcon(step.icon);

  const finish = useCallback(() => {
    markSeen();
    onClose?.();
  }, [onClose]);

  const next = useCallback(
    () => (last ? finish() : setI(v => Math.min(v + 1, steps.length - 1))),
    [last, finish, steps.length]
  );
  const back = useCallback(() => setI(v => Math.max(v - 1, 0)), []);

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 640);
    const onKey = (e) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, [next, back, finish]);

  const progress = ((i + 1) / steps.length) * 100;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="How to play"
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: C.bg, backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: mobile ? 16 : 32,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) finish(); }}
    >
      <div
        style={{
          width: '100%', maxWidth: 580,
          maxHeight: '90vh', overflowY: 'auto',
          isolation: 'isolate',
          background: C.card,
          border: `1px solid ${C.cardEdge}`,
          borderRadius: 12,
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          padding: mobile ? '24px 20px 20px' : '32px 36px 24px',
          color: C.parchment,
          fontFamily: 'inherit',
        }}
      >
        {/* Chapter eyebrow + counter */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div style={{
            fontSize: 12, letterSpacing: '0.18em',
            color: chapter.accent, fontWeight: 600,
          }}>
            <span aria-hidden="true" style={{
              display: 'inline-block', width: 5, height: 5,
              background: chapter.accent, transform: 'rotate(45deg)',
              marginRight: 10, verticalAlign: 'middle', opacity: 0.7,
            }} />
            {chapter.label}
          </div>
          <div style={{ fontSize: 12, color: C.faded, letterSpacing: '0.08em' }}>
            {i + 1} / {steps.length}
          </div>
        </div>

        {/* Icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
          <div
            onPointerEnter={(e) => { if (e.pointerType === 'mouse') setIconHover(true); }}
            onPointerLeave={(e) => { if (e.pointerType === 'mouse') setIconHover(false); }}
            onPointerUp={(e) => { if (e.pointerType !== 'mouse') setIconHover(v => !v); }}
            style={{
              width: mobile ? 92 : 128, height: mobile ? 92 : 128,
              background: C.card,
              borderRadius: art ? 0 : '50%',
              border: art ? 'none' : `1.5px solid ${step.accent}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: mobile ? 40 : 56, color: step.accent, flexShrink: 0,
              transform: iconHover ? 'scale(1.18)' : 'scale(1)',
              transformOrigin: 'center',
              transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'pointer',
            }}
          >              {art
              ? <img src={art} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', mixBlendMode: 'lighten' }} />
              : step.glyph}
          </div>
          <h2 style={{
            margin: 0, fontSize: mobile ? 20 : 24, fontWeight: 700,
            color: C.parchment, lineHeight: 1.2,
          }}>
            {step.title}
          </h2>
        </div>

        {/* Body */}
        <p style={{
          margin: '0 0 22px', fontSize: mobile ? 14.5 : 16,
          lineHeight: 1.65, color: C.faded, minHeight: mobile ? 120 : 100,
        }}>
          {step.body}
        </p>

        {/* Progress rail — styled like the alignment sliders */}
        <div style={{
          height: 4, borderRadius: 2, background: C.cardEdge,
          overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${C.magic}, ${C.tech})`,
            transition: 'width 240ms ease',
          }} />
        </div>

        {/* Step dots — colored by chapter */}
        <div style={{
          display: 'flex', gap: mobile ? 5 : 7,
          justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20,
        }}>
          {steps.map((s, idx) => (
            <button
              key={s.title}
              onClick={() => setI(idx)}
              aria-label={`Step ${idx + 1}: ${s.title}`}
              title={s.title}
              style={{
                width: mobile ? 6 : 8, height: mobile ? 6 : 8,
                borderRadius: '50%', padding: 0,
                border: 'none', cursor: 'pointer',
                background: idx === i
                  ? CHAPTERS[s.ch].accent
                  : idx < i ? `${CHAPTERS[s.ch].accent}66` : C.cardEdge,
                transform: idx === i ? 'rotate(45deg) scale(1.25)' : 'none',
                transition: 'all 160ms ease',
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={finish}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: C.faded, fontSize: 13, padding: '10px 6px',
            }}
          >
            Skip
          </button>
          <div style={{ flex: 1 }} />
          {i > 0 && (
            <button
              onClick={back}
              style={{
                background: 'none',
                border: `1px solid ${C.cardEdge}`,
                borderRadius: 8, cursor: 'pointer',
                color: C.parchment, fontSize: 14,
                padding: '10px 18px',
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={next}
            autoFocus
            style={{
              background: last ? C.gold : C.magic,
              border: 'none', borderRadius: 8, cursor: 'pointer',
              color: '#141009', fontWeight: 700, fontSize: 14,
              padding: '10px 22px',
            }}
          >
            {last ? (isDM ? 'Take the Seat' : 'Begin Your Journey') : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}