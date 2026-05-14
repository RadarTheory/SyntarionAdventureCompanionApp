import { useState, useMemo } from 'react';
import { COLORS } from './constants';
import { SOTERIA_BESTIARY } from './soteria-bestiary';
import supabase from './lib/supabase';

// ─── PARSE RAW BESTIARY TEXT ──────────────────────────────────────────────────
// Handles common formats in raw lore text:
//   • CREATURE NAME — description...
//   • CREATURE NAME: description...
//   CREATURE NAME\ndescription...
//   **CREATURE NAME** description...

function parseBestiary() {
  const raw = typeof SOTERIA_BESTIARY === 'string'
    ? SOTERIA_BESTIARY
    : Array.isArray(SOTERIA_BESTIARY)
      ? SOTERIA_BESTIARY.join('\n')
      : Object.values(SOTERIA_BESTIARY || {}).join('\n');

  if (!raw) return [];

  const entries = [];
  const lines = raw.split('\n');
  let current = null;
  let descLines = [];

  const flush = () => {
    if (current) {
      const fullDesc = descLines.join(' ').replace(/\s+/g, ' ').trim();
      entries.push({ ...current, desc: fullDesc });
    }
    current = null;
    descLines = [];
  };

  // Patterns that signal a new creature entry
  const bulletPattern  = /^[-•●*]\s+([A-Z][A-Z0-9\s'\-\/\(\)]+?)(?:\s*[—–:]\s*(.*))?$/;
  const headerPattern  = /^\*\*([A-Z][A-Z0-9\s'\-\/\(\)]+?)\*\*\s*[—–:]?\s*(.*)?$/;
  const allCapsPattern = /^([A-Z][A-Z\s'\-\/\(\),]{3,50}?)(?:\s*[—–:]\s*(.*))?$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    let matched = false;

    // Try bullet pattern
    const bulletMatch = line.match(bulletPattern);
    if (bulletMatch) {
      flush();
      const name = bulletMatch[1].trim().replace(/['"`,;]+$/g, '');
      const rest = bulletMatch[2]?.trim() || '';
      if (name.length > 1 && name.length < 80) {
        current = { name, category: inferCategory(name, rest) };
        if (rest) descLines.push(rest);
        matched = true;
      }
    }

    // Try **bold** pattern
    if (!matched) {
      const headerMatch = line.match(headerPattern);
      if (headerMatch) {
        flush();
        const name = headerMatch[1].trim();
        const rest = headerMatch[2]?.trim() || '';
        if (name.length > 1 && name.length < 80) {
          current = { name, category: inferCategory(name, rest) };
          if (rest) descLines.push(rest);
          matched = true;
        }
      }
    }

    // Try ALL CAPS line (only if short enough to be a name, not a section header)
    if (!matched && /^[A-Z\s'\-\/\(\),]{4,60}$/.test(line) && line.split(' ').length <= 8) {
      const allCapsMatch = line.match(allCapsPattern);
      if (allCapsMatch && current?.name !== allCapsMatch[1].trim()) {
        flush();
        const name = allCapsMatch[1].trim().replace(/['"`,;]+$/g, '');
        const rest = allCapsMatch[2]?.trim() || '';
        current = { name, category: inferCategory(name, rest) };
        if (rest) descLines.push(rest);
        matched = true;
      }
    }

    // Otherwise it's description text for the current entry
    if (!matched && current) {
      descLines.push(line);
    }
  }

  flush();

  // Deduplicate by name
  const seen = new Set();
  return entries.filter(e => {
    if (!e.name || e.name.length < 2 || seen.has(e.name)) return false;
    seen.add(e.name);
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function inferCategory(name, desc) {
  const combined = (name + ' ' + desc).toLowerCase();
  if (/undead|wraith|lich|skeleton|ghost|revenant|shade|specter/.test(combined)) return 'Undead';
  if (/beast|wolf|bear|cat|boar|hawk|serpent|viper|rat|spider|bat/.test(combined)) return 'Beast';
  if (/demon|fiend|devil|infernal|hellborn/.test(combined)) return 'Fiend';
  if (/dragon|wyrm|drake|wyvern/.test(combined)) return 'Dragon';
  if (/construct|golem|automaton|machine|clockwork/.test(combined)) return 'Construct';
  if (/elemental|fire|water|earth|air|storm/.test(combined)) return 'Elemental';
  if (/fey|fairy|sprite|pixie|nymph/.test(combined)) return 'Fey';
  if (/humanoid|human|elf|dwarf|orc|goblin|gnome|halfling|troll|ogre|giant/.test(combined)) return 'Humanoid';
  if (/plant|fungus|myconid|treant|vine/.test(combined)) return 'Plant';
  if (/aberration|mindflayer|beholder|aboleth|tentacle/.test(combined)) return 'Aberration';
  return 'Creature';
}

const CATEGORY_COLORS = {
  Undead:      '#9b7fbd',
  Beast:       '#a8e6a3',
  Fiend:       '#e05a5a',
  Dragon:      '#f0a060',
  Construct:   '#60c8f0',
  Elemental:   '#ffe8a0',
  Fey:         '#f472b6',
  Humanoid:    '#e8d9a7',
  Plant:       '#88d8b0',
  Aberration:  '#c084fc',
  Creature:    '#8a7d6e',
};

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

// ─── CREATURE CARD ────────────────────────────────────────────────────────────
function CreatureCard({ creature, isDM, campaignId, onAddedToCombat }) {
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding]     = useState(false);
  const [added, setAdded]       = useState(false);

  const col      = CATEGORY_COLORS[creature.category] || COLORS.muted;
  const shortDesc = creature.desc
    ? creature.desc.split(/[.!?]/)[0].trim() + '.'
    : '';
  const displayDesc = isDM ? creature.desc : shortDesc;

  const addToCombat = async (e) => {
    e.stopPropagation();
    if (!campaignId || adding) return;
    setAdding(true);

    // Find or create active Hercules session
    let { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(campaignId)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (!hsession?.id) {
      const { data: newSession } = await supabase.from('hercules_sessions')
        .insert({ campaign_id: String(campaignId), status: 'active', current_turn: 0 })
        .select().single();
      hsession = newSession;
    }

    if (!hsession?.id) { setAdding(false); return; }

    const tokenId  = crypto.randomUUID();
    const roll     = Math.floor(Math.random() * 20) + 1;
    const color    = col;

    // Add to VTT
    const { data: vttSession } = await supabase.from('vtt_sessions').select('*')
      .eq('campaign_id', String(campaignId)).maybeSingle();
    const existingTokens = Array.isArray(vttSession?.tokens) ? vttSession.tokens : [];
    const newToken = { id: tokenId, token_id: tokenId, name: creature.name, label: creature.name.slice(0, 4).toUpperCase(), creatureName: creature.name, type: 'enemy', color, x: 50, y: 50 };
    if (vttSession?.id) {
      await supabase.from('vtt_sessions').update({ tokens: [...existingTokens, newToken], updated_at: new Date().toISOString() }).eq('id', vttSession.id);
    } else {
      await supabase.from('vtt_sessions').insert({ campaign_id: String(campaignId), tokens: [newToken], fog_zones: [], pending_moves: [] });
    }

    // Add to initiative
    await supabase.from('hercules_initiative').insert({ session_id: hsession.id, character_id: tokenId, character_name: creature.name, roll, modifier: 0, turn_order: roll });

    // Log event
    await supabase.from('hercules_events').insert({ session_id: hsession.id, type: 'enemy_added', actor_name: creature.name, actor_id: tokenId, description: `${creature.name} enters the scene from the Bestiary. Initiative: d20 ${roll} = ${roll}.` });

    setAdded(true);
    setAdding(false);
    onAddedToCombat?.();
    setTimeout(() => setAdded(false), 3000);
  };

  return (
    <div style={{ border: `1px solid ${expanded ? col + '44' : COLORS.border}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s' }}>
      {/* Header row */}
      <button onClick={() => setExpanded(o => !o)}
        style={{ width: '100%', background: expanded ? `${col}0d` : COLORS.card, border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0 }} />
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{creature.name}</div>
        <div style={{ fontSize: 7, color: col, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', flexShrink: 0 }}>{creature.category}</div>
        <div style={{ color: COLORS.dim, fontSize: 9, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>▾</div>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '10px 12px', borderTop: `1px solid ${col}22`, background: 'rgba(0,0,0,0.18)' }}>
          {displayDesc ? (
            <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.6, marginBottom: isDM ? 12 : 0 }}>{displayDesc}</div>
          ) : (
            <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No description available.</div>
          )}

          {isDM && (
            <button onClick={addToCombat} disabled={adding}
              style={{ background: added ? COLORS.magicBg : `${col}14`, border: `1px solid ${added ? COLORS.magic : col + '55'}`, borderRadius: 6, padding: '6px 12px', cursor: adding ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: added ? COLORS.magicText : col, fontWeight: 700, letterSpacing: '0.1em', transition: 'all 0.15s' }}>
              {adding ? 'Adding…' : added ? '✓ Added to Combat' : '⚔ Add to Combat'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — isDM controls what's visible and whether Add to Combat shows
// ═════════════════════════════════════════════════════════════════════════════

export default function BestiaryPanel({ isDM = false, campaignId, onClose, embedded = false }) {
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCat] = useState('all');

  const creatures  = useMemo(() => parseBestiary(), []);
  const categories = useMemo(() => ['all', ...Array.from(new Set(creatures.map(c => c.category))).sort()], [creatures]);

  const filtered = useMemo(() => creatures.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false;
    if (!search) return true;
    return c.name.toLowerCase().includes(search.toLowerCase()) || c.desc?.toLowerCase().includes(search.toLowerCase());
  }), [creatures, activeCategory, search]);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Search + filter */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search creatures…"
          style={{ width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const col = cat === 'all' ? COLORS.muted : (CATEGORY_COLORS[cat] || COLORS.muted);
            const active = activeCategory === cat;
            return (
              <button key={cat} onClick={() => setActiveCat(cat)}
                style={{ background: active ? `${col}22` : 'transparent', border: `1px solid ${active ? col : COLORS.border}`, borderRadius: 4, padding: '2px 7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: active ? col : COLORS.dim, letterSpacing: '0.08em' }}>
                {cat === 'all' ? 'All' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count */}
      <div style={{ padding: '6px 14px 0', fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', flexShrink: 0 }}>
        {filtered.length} {filtered.length === 1 ? 'creature' : 'creatures'}
        {creatures.length === 0 && ' — bestiary data not found'}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {creatures.length === 0 && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
            No creatures found in soteria-bestiary.js. The file may use an unrecognised format.
          </div>
        )}
        {filtered.map(creature => (
          <CreatureCard key={creature.name} creature={creature} isDM={isDM} campaignId={campaignId} />
        ))}
        {filtered.length === 0 && creatures.length > 0 && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No creatures match.</div>
        )}
      </div>
    </div>
  );

  // Embedded mode — DraggablePanel provides the shell
  if (embedded) return content;

  // Standalone fixed panel
  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 400, maxHeight: '82vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#100d0a', border: '1px solid rgba(168,230,163,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(168,230,163,0.15)', background: 'rgba(168,230,163,0.04)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#a8e6a3', letterSpacing: '0.18em', fontWeight: 700 }}>BESTIARY</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>Creatures of Soteria</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
      </div>
      {content}
    </div>
  );
}
