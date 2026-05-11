import { useState } from 'react';
import { COLORS } from './constants';

// ─── LOCATION REGISTRY ────────────────────────────────────────────────────────
export const LOCATIONS = [
  { id: 'albion',              name: 'Albion',                            filename: 'Albion.png' },
  { id: 'aridara',             name: 'Aridara',                           filename: 'Aridara.png' },
  { id: 'ashendell',           name: 'Ashendell',                         filename: 'Ashendell.png' },
  { id: 'avalora',             name: 'Avalora',                           filename: 'Avalora.png' },
  { id: 'avalora-col-1',       name: 'Avalora Coliseum I',                filename: 'AvaloraColliseum1.png' },
  { id: 'avalora-col-2',       name: 'Avalora Coliseum II',               filename: 'AvaloraColliseum2.png' },
  { id: 'avalora-col-3',       name: 'Avalora Coliseum III',              filename: 'AvaloraColliseum3.png' },
  { id: 'brivihan',            name: 'Brivihan Plains',                   filename: 'Brivihan Plains.png' },
  { id: 'broken-cathedral',    name: 'Broken Cathedral',                  filename: 'BrokenCathedral.png' },
  { id: 'chronolithe',         name: 'Chronolithe Wastes',                filename: 'Chronolithe Wastes.png' },
  { id: 'chronolithe-2',       name: 'Chronolithe Wastes II',             filename: 'ChronolitheWastes2.png' },
  { id: 'cielo-dorado',        name: 'Cielo Dorado',                      filename: 'CieloDorado.png' },
  { id: 'dorhaven',            name: 'Dorhaven — Penthosanctum',          filename: 'Dorhaven-Penthosanctum.png' },
  { id: 'dungeon-cathedral',   name: 'Dungeon — Cathedral Sword',         filename: 'DungeonCathedralSword.png' },
  { id: 'dungeon-chronolithe', name: 'Dungeon — Chronolithe Wastes',      filename: 'DungeonChronolitheWastes.png' },
  { id: 'dungeon-maze',        name: 'Dungeon — Maze',                    filename: 'DungeonMaze.png' },
  { id: 'dungeon-puzzle-1',    name: 'Dungeon — Puzzle I',                filename: 'DungeonPuzzle.png' },
  { id: 'dungeon-puzzle-2',    name: 'Dungeon — Puzzle II',               filename: 'DungeonPuzzle2.png' },
  { id: 'ebba',                name: 'Ebba',                              filename: 'Ebba.png' },
  { id: 'elddim',              name: "Eldd'im",                           filename: 'elddim.png' },
  { id: 'elmoire',             name: 'Elmoire',                           filename: 'Elmoire 2.png' },
  { id: 'epham',               name: 'Epham',                             filename: 'Epham.png' },
  { id: 'galekgarde',          name: 'Galekgarde',                        filename: 'galekgarde.png' },
  { id: 'gamdon',              name: 'Gamdon',                            filename: 'gamdon.png' },
  { id: 'gamdon-portal',       name: 'Gamdon — Beyond the Portal',        filename: 'Gamdonbeyondportal.png' },
  { id: 'golgotha',            name: 'Golgotha Pass',                     filename: 'golgothapass.png' },
  { id: 'hadmont',             name: 'Hadmont',                           filename: 'Hadmont.png' },
  { id: 'karak-byrn',          name: 'Karak Byrn',                        filename: 'Karak Byrn.png' },
  { id: 'lilithiel-south',     name: "Lilith'iel South",                  filename: "Lilith'iel South.png" },
  { id: 'lilithiel-ciruson',   name: "Lilith'iel — Ciruson's Resting",    filename: "Lilith'ielCirusonsRestingPlace.png" },
  { id: 'lutetia',             name: 'Lutetia — Testudon Pirate Cove',   filename: 'Lutetia-TestudonPirateCove.png' },
  { id: 'maakurg-1',           name: "Maakurg's Altar I",                 filename: "Maakurg'sAltar1.png" },
  { id: 'maakurg-2',           name: "Maakurg's Altar II",                filename: "Maakurg'sAltar2.png" },
  { id: 'maakurg-3',           name: "Maakurg's Altar III",               filename: "Maakurg'sAltar3.png" },
  { id: 'maakurg-4',           name: "Maakurg's Altar IV",                filename: "Maakurg'sAltar4.png" },
  { id: 'makeda-kwetu',        name: 'Makeda Kwetu',                      filename: 'MakedaKwetu.png' },
  { id: 'marigizhar',          name: "Marigizh'ar",                       filename: "Marigizh'ar.png" },
  { id: 'mouth-wastes-1',      name: 'Mouth of the Wastes',               filename: 'MouthoftheWastes.png' },
  { id: 'mouth-wastes-2',      name: 'Mouth of the Wastes II',            filename: 'MouthoftheWastes2.png' },
  { id: 'murinor',             name: 'Murinor Burrowhold',                filename: 'Murinorburrowhold.png' },
  { id: 'nquythalas',          name: "N'quythalas",                       filename: "N'quythalas.png" },
  { id: 'nquythalas-2',        name: "N'quythalas II",                    filename: "N'quythalas 2.png" },
  { id: 'ormr',                name: 'Ormr',                              filename: 'Ormr.png' },
  { id: 'quynthera',           name: "Quynthe'ra",                        filename: "quynthe'ra.png" },
  { id: 'rakesh',              name: "Ra'Kesh",                           filename: "Ra'Kesh.png" },
  { id: 'razors-point',        name: "Razor's Point",                     filename: "Razor'sPoint.png" },
  { id: 'rimehollow',          name: 'Rimehollow — Knoll Camp',           filename: 'Rimehollow-KnollCamp.png' },
  { id: 'rookvale',            name: "Rookvale — Warman's Lake",          filename: "Rookvale,Warman'sLake.png" },
  { id: 'soteria-world',       name: 'Soteria — World Map',               filename: 'SoteriaWorldMap.jpg' },
  { id: 'sovereign-gale',      name: 'Sovereign Gale',                    filename: 'Sovereign Gale.png' },
  { id: 'tarek-mor',           name: "Tarek'Mor",                         filename: "Tarek'Mor.png" },
  { id: 'thereienstadt',       name: 'Thereienstadt',                     filename: 'Thereienstadt.png' },
  { id: 'veiled-knolls',       name: 'The Veiled Knolls',                 filename: 'theVeiledKnolls.png' },
  { id: 'trystique',           name: 'Trystique',                         filename: 'Trystique.png' },
  { id: 'valorhold',           name: 'Valorhold',                         filename: 'Valorhold.png' },
  { id: 'verdeliere',          name: "Verdeli'ere",                       filename: "Verdeli'ere.png" },
  { id: 'village',             name: 'Village',                           filename: 'Village.png' },
  { id: 'vlareth',             name: 'Vlareth',                           filename: 'Vlareth.png' },
  { id: 'vonyal',              name: 'Vonyal',                            filename: 'Vonyal.png' },
  { id: 'vonyal-entrance',     name: 'Vonyal — Entrance',                 filename: 'VonyalEntrance.png' },
  { id: 'woodpath',            name: 'Woodpath',                          filename: 'woodpath.png' },
  { id: 'zephyria',            name: 'Zephyria',                          filename: 'Zephyria.png' },
  { id: 'zephyria-college',    name: 'Zephyria — College Behind the Veil',filename: 'ZephyriaCollegebehindtheveil.png' },
  { id: 'zeppelin',            name: 'Zeppelin',                          filename: 'Zeppelin.png' },
];

// ─── COMPASS LOGO SVG ─────────────────────────────────────────────────────────
function CompassLogo({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="112" height="112" rx="6" stroke="#c8a84a" strokeWidth="1.5" opacity="0.9"/>
      <rect x="7" y="7" width="106" height="106" rx="4" stroke="#c8a84a" strokeWidth="0.5" opacity="0.5"/>
      <g stroke="#c8a84a" strokeWidth="1" opacity="0.8" fill="none">
        <path d="M4 18 L4 4 L18 4"/><path d="M102 4 L116 4 L116 18"/>
        <path d="M4 102 L4 116 L18 116"/><path d="M116 102 L116 116 L102 116"/>
      </g>
      <rect x="8" y="8" width="104" height="104" rx="3" fill="#1a3d55" opacity="0.85"/>
      <g stroke="#3a7090" strokeWidth="0.4" opacity="0.35">
        <path d="M8 30 Q30 27 50 30 Q70 33 90 30 Q112 27 116 30" fill="none"/>
        <path d="M8 50 Q35 47 55 50 Q75 53 95 50 Q112 47 116 50" fill="none"/>
        <path d="M8 70 Q28 67 48 70 Q68 73 88 70 Q112 67 116 70" fill="none"/>
        <path d="M8 90 Q30 87 50 90 Q70 93 90 90 Q112 87 116 90" fill="none"/>
      </g>
      <path d="M28 35 Q32 22 44 20 Q56 18 62 24 Q72 20 80 26 Q90 24 94 34 Q98 44 92 54 Q96 62 90 70 Q86 80 76 84 Q68 92 56 90 Q44 94 36 84 Q26 78 24 66 Q18 54 24 44 Z" fill="#6b7a3e" opacity="0.7"/>
      <g fill="#4a4a3a" opacity="0.6">
        <polygon points="58,34 63,44 53,44"/>
        <polygon points="68,30 72,38 64,38"/>
      </g>
      <g transform="translate(60,60)">
        <circle cx="0" cy="0" r="46" fill="none" stroke="#c8a84a" strokeWidth="0.6" opacity="0.35"/>
        <circle cx="0" cy="0" r="28" fill="none" stroke="#c8a84a" strokeWidth="0.5" opacity="0.25"/>
        <g stroke="#c8a84a" strokeWidth="0.4" opacity="0.2">
          <line x1="0" y1="-46" x2="0" y2="46"/>
          <line x1="-46" y1="0" x2="46" y2="0"/>
          <line x1="-33" y1="-33" x2="33" y2="33"/>
          <line x1="33" y1="-33" x2="-33" y2="33"/>
        </g>
        <g fill="#c8a84a" opacity="0.55">
          <polygon points="0,-38 3,-28 0,-32 -3,-28" transform="rotate(45)"/>
          <polygon points="0,-38 3,-28 0,-32 -3,-28" transform="rotate(135)"/>
          <polygon points="0,-38 3,-28 0,-32 -3,-28" transform="rotate(225)"/>
          <polygon points="0,-38 3,-28 0,-32 -3,-28" transform="rotate(315)"/>
        </g>
        <polygon points="0,-46 5,-30 0,-36 -5,-30" fill="#e8c84a" opacity="0.95"/>
        <polygon points="0,46 5,30 0,36 -5,30" fill="#c8a84a" opacity="0.7"/>
        <polygon points="46,0 30,5 36,0 30,-5" fill="#c8a84a" opacity="0.7"/>
        <polygon points="-46,0 -30,5 -36,0 -30,-5" fill="#c8a84a" opacity="0.7"/>
        <text x="0" y="-50" textAnchor="middle" fontSize="7" fontFamily="Georgia, serif" fill="#e8c84a" opacity="0.9" fontWeight="bold">N</text>
        <circle cx="0" cy="0" r="5" fill="#1a3d55" stroke="#c8a84a" strokeWidth="0.8" opacity="0.9"/>
        <circle cx="0" cy="0" r="2.5" fill="#e8c84a" opacity="0.95"/>
        <circle cx="0" cy="0" r="1" fill="#fff" opacity="0.7"/>
      </g>
    </svg>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function MapPanel() {
  const [open, setOpen]             = useState(true);
  const [activeId, setActiveId]     = useState(null);
  const [search, setSearch]         = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  const active   = LOCATIONS.find(l => l.id === activeId);
  const filtered = LOCATIONS.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));

  const label8 = { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };

  return (
    <div style={{ border: `1px solid ${activeId ? '#c8a84a44' : COLORS.border}`, borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.3s' }}>

      {/* ── Header / toggle ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: COLORS.surface, cursor: 'pointer', userSelect: 'none', borderBottom: open ? `1px solid ${COLORS.border}` : 'none' }}
      >
        <CompassLogo size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: COLORS.text }}>
            Active Map
          </div>
          <div style={{ fontSize: 9, color: active ? '#c8a84a' : COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>
            {active ? active.name : 'No location set'}
          </div>
        </div>
        <div style={{ fontSize: 10, color: COLORS.dim, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</div>
      </div>

      {/* ── Body ── */}
      {open && (
        <div style={{ background: COLORS.wizard }}>

          {/* Map display */}
          {active && (
            <div style={{ position: 'relative' }}>
              <img
                src={`/Maps/${encodeURIComponent(active.filename)}`}
                alt={active.name}
                style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'contain', background: '#0d0b09' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 16px 12px', background: 'linear-gradient(transparent, rgba(10,8,6,0.85))', pointerEvents: 'none' }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: '#e8c84a', letterSpacing: '0.12em' }}>{active.name}</div>
              </div>
              <button
                onClick={() => setFullscreen(true)}
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(10,8,6,0.7)', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 9, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}
              >
                ⛶ Expand
              </button>
            </div>
          )}

          {/* Location list */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{ ...label8, marginBottom: 8 }}>Locations — {LOCATIONS.length} maps</div>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search locations…"
              style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box', marginBottom: 10 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 260, overflowY: 'auto' }}>
              {filtered.map(loc => {
                const isActive = loc.id === activeId;
                return (
                  <button
                    key={loc.id}
                    onClick={() => setActiveId(isActive ? null : loc.id)}
                    style={{
                      textAlign: 'left',
                      background: isActive ? 'rgba(200,168,74,0.12)' : COLORS.card,
                      border: `1px solid ${isActive ? '#c8a84a88' : COLORS.border}`,
                      borderRadius: 6, padding: '8px 12px', cursor: 'pointer',
                      fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.06em',
                      color: isActive ? '#e8c84a' : COLORS.text, transition: 'all 0.12s',
                    }}
                  >
                    {isActive && <span style={{ marginRight: 6, opacity: 0.7 }}>✦</span>}
                    {loc.name}
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', padding: '8px 0' }}>No locations match.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen overlay ── */}
      {fullscreen && active && (
        <div
          onClick={() => setFullscreen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 500, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.12em', marginBottom: 16 }}>{active.name}</div>
          <img
            src={`/Maps/${encodeURIComponent(active.filename)}`}
            alt={active.name}
            style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 120px)', borderRadius: 8, objectFit: 'contain' }}
            onClick={e => e.stopPropagation()}
          />
          <div style={{ marginTop: 14, fontSize: 9, color: 'rgba(240,238,235,0.3)', fontFamily: "'Cinzel', serif", letterSpacing: '0.1em' }}>Click outside to close</div>
        </div>
      )}
    </div>
  );
}
