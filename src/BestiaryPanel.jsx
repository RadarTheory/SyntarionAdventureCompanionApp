import { useState, useEffect, useMemo } from 'react';
import { COLORS } from './constants';
import supabase from './lib/supabase';

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
  Titan:       '#ff8fa3',
  Troll:       '#b08968',
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
  const shortDesc = creature.description
    ? creature.description.split(/[.!?]/)[0].trim() + '.'
    : '';
  const displayDesc = isDM ? creature.description : shortDesc;

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

    // Add to VTT — beast_id links the token back to its bestiary row (for Dialogue, etc.)
    const { data: vttSession } = await supabase.from('vtt_sessions').select('*')
      .eq('campaign_id', String(campaignId)).maybeSingle();
    const existingTokens = Array.isArray(vttSession?.tokens) ? vttSession.tokens : [];
    const newToken = { id: tokenId, token_id: tokenId, name: creature.name, label: creature.name.slice(0, 4).toUpperCase(), creatureName: creature.name, beast_id: creature.id, type: 'enemy', color, x: 50, y: 50 };
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
    <div style={{ border: `1px solid ${expanded ? col + '44' : COLORS.border}`, borderRadius: 8, overflow: 'hidden', transition: 'border-color 0.15s', flexShrink: 0 }}>
      {/* Header row */}
      <button onClick={() => setExpanded(o => !o)}
        style={{ width: '100%', background: expanded ? `${col}0d` : COLORS.card, border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: col, flexShrink: 0 }} />
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, flex: 1, overflow: 'hidden' }}>{creature.name}</div>
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

const EMPTY_FORM = { name: '', description: '', biome: '', disposition: '', category: 'Beast', voice_profile: '' };

const CATEGORY_OPTIONS = ['Beast', 'Undead', 'Fiend', 'Dragon', 'Construct', 'Elemental', 'Fey', 'Humanoid', 'Plant', 'Aberration', 'Titan', 'Troll', 'Creature'];
const DISPOSITION_OPTIONS = ['', 'DOCILE / FRIENDLY', 'AGGRESSIVE / PREDATORY', 'SMALLER / GAME', 'HAUNTED UNDEAD'];

export default function BestiaryPanel({ isDM = false, campaignId, onClose, embedded = false }) {
  const [search, setSearch]         = useState('');
  const [activeCategory, setActiveCat] = useState('all');
  const [creatures, setCreatures]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const fetchBeasts = async () => {
    setLoading(true);
    setError(null);

    // Global bestiary entries (source = 'global') plus any campaign-specific beasts
    let query = supabase.from('beasts').select('*').order('name', { ascending: true });
    if (campaignId) {
      query = query.or(`source.eq.global,campaign_id.eq.${campaignId}`);
    } else {
      query = query.eq('source', 'global');
    }

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setCreatures([]);
    } else {
      setCreatures(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await fetchBeasts();
      if (cancelled) return;
    })();
    return () => { cancelled = true; };
  }, [campaignId]);

  const submitNewBeast = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const { error: insertError } = await supabase.from('beasts').insert({
      name: form.name.trim().toUpperCase(),
      description: form.description.trim() || null,
      biome: form.biome.trim() || null,
      disposition: form.disposition || null,
      category: form.category,
      voice_profile: form.voice_profile.trim() || null,
      campaign_id: campaignId ? String(campaignId) : null,
      source: 'campaign',
    });

    if (insertError) {
      setSubmitError(insertError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setForm(EMPTY_FORM);
    setShowForm(false);
    await fetchBeasts();
  };

  const categories = useMemo(() => ['all', ...Array.from(new Set(creatures.map(c => c.category).filter(Boolean))).sort()], [creatures]);

  const filtered = useMemo(() => creatures.filter(c => {
    if (activeCategory !== 'all' && c.category !== activeCategory) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || c.description?.toLowerCase().includes(s);
  }), [creatures, activeCategory, search]);

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Search + filter */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search creatures…"
            style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 10px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', boxSizing: 'border-box' }} />
          {isDM && (
            <button onClick={() => { setShowForm(s => !s); setSubmitError(null); }}
              style={{ background: showForm ? `${COLORS.muted}22` : 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '0 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.text, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {showForm ? '✕ Cancel' : '+ New Beast'}
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={submitNewBeast} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10, padding: 10, border: `1px solid ${COLORS.border}`, borderRadius: 8, background: 'rgba(0,0,0,0.18)' }}>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Name *"
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 9px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              rows={3}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 9px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={form.biome} onChange={e => setForm(f => ({ ...f, biome: e.target.value }))}
                placeholder="Biome (e.g. WOODLAND)"
                style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 9px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }} />
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 9px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }}>
                {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <select value={form.disposition} onChange={e => setForm(f => ({ ...f, disposition: e.target.value }))}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 9px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none' }}>
              <option value="">No disposition</option>
              {DISPOSITION_OPTIONS.filter(Boolean).map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <textarea value={form.voice_profile} onChange={e => setForm(f => ({ ...f, voice_profile: e.target.value }))}
              placeholder="Voice profile (tone, vocabulary, verbal tics — used by Scribe for dialogue)"
              rows={2}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 9px', color: COLORS.text, fontSize: 11, fontFamily: 'Georgia, serif', outline: 'none', resize: 'vertical' }} />
            {submitError && <div style={{ fontSize: 10, color: COLORS.magic || '#e05a5a', fontFamily: 'Georgia, serif' }}>{submitError}</div>}
            <button type="submit" disabled={submitting || !form.name.trim()}
              style={{ background: `${COLORS.muted}22`, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '7px 12px', cursor: submitting ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, color: COLORS.text, letterSpacing: '0.1em' }}>
              {submitting ? 'Saving…' : 'Save Beast'}
            </button>
          </form>
        )}

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
        {loading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'creature' : 'creatures'}`}
        {error && ` — error: ${error}`}
        {!loading && !error && creatures.length === 0 && ' — bestiary table is empty'}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {!loading && creatures.length === 0 && !error && (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>
            No creatures found in the beasts table. Run the migration to populate it.
          </div>
        )}
        {filtered.map(creature => (
          <CreatureCard key={creature.id} creature={creature} isDM={isDM} campaignId={campaignId} />
        ))}
        {!loading && filtered.length === 0 && creatures.length > 0 && (
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
