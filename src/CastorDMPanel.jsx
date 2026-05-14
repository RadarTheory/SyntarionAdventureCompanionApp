import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';

function label8() {
  return { fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif" };
}

const MAGIC_DISCIPLINES = [
  { axis: 'magic', label: 'DIVINE',  reagent: 'SANCTUS',   reagentLabel: 'Sanctus Orb',  statKey: 'soul',    color: '#c9b0ff', spells: [{ id: 'div_1', name: 'Veilseal',      desc: 'Banish an entity back to its origin plane.',        cost: 2 }, { id: 'div_2', name: 'Oathlight',     desc: 'Compel truth from a willing or weakened target.',   cost: 1 }, { id: 'div_3', name: 'Sacred Pyre',   desc: 'Consecrate ground, damaging unholy presences.',     cost: 2 }] },
  { axis: 'magic', label: 'SPIRIT',  reagent: 'SACRAL',    reagentLabel: 'Sacral Will',  statKey: 'spirit',  color: '#a8d8ea', spells: [{ id: 'spi_1', name: 'Spiritcall',    desc: 'Summon and briefly bind a nearby spirit.',          cost: 2 }, { id: 'spi_2', name: 'Soulread',      desc: 'Sense the emotional state and intent of a target.', cost: 1 }, { id: 'spi_3', name: 'Echo Veil',     desc: 'Replay a scene as a spectral echo.',                cost: 2 }] },
  { axis: 'magic', label: 'MAGIC',   reagent: 'MANA',      reagentLabel: 'Mana Wisp',    statKey: 'essence', color: '#79f5a7', spells: [{ id: 'mag_1', name: 'Arcane Bolt',   desc: 'Project a burst of raw arcane force.',              cost: 1 }, { id: 'mag_2', name: 'Nullfield',     desc: 'Suppress magic in a radius for one turn.',         cost: 2 }, { id: 'mag_3', name: 'Manaweave',     desc: 'Channel mana into an item or wound.',               cost: 1 }] },
  { axis: 'magic', label: 'NATURE',  reagent: 'ESSENCE',   reagentLabel: 'Essence Seed', statKey: 'body',    color: '#a8e6a3', spells: [{ id: 'nat_1', name: 'Thornwall',     desc: 'Raise a barrier of living bramble.',                cost: 2 }, { id: 'nat_2', name: 'Rootbind',      desc: 'Entangle a target in rapidly growing roots.',       cost: 1 }, { id: 'nat_3', name: 'Verdant Surge', desc: 'Accelerate natural growth or decay.',               cost: 1 }] },
  { axis: 'magic', label: 'GLYPH',   reagent: 'GNOSIS',    reagentLabel: 'Glyphstone',   statKey: 'essence', color: '#f0d080', spells: [{ id: 'gly_1', name: 'Sigil Lock',    desc: 'Inscribe a trap-glyph on a surface.',               cost: 2 }, { id: 'gly_2', name: 'Runekey',       desc: 'Inscribe or erase a runic lock.',                   cost: 1 }, { id: 'gly_3', name: 'Wardscript',    desc: 'Create a persistent warding glyph.',                cost: 2 }] },
  { axis: 'magic', label: 'LIGHT',   reagent: 'SHAEID',    reagentLabel: 'Shaeid Shard', statKey: 'soul',    color: '#ffe8a0', spells: [{ id: 'lig_1', name: 'Blindburst',    desc: 'Emit a flash of searing light.',                    cost: 1 }, { id: 'lig_2', name: 'Lucent Path',   desc: 'Illuminate hidden routes or passages.',             cost: 1 }, { id: 'lig_3', name: 'Solarward',     desc: 'Wrap an ally in deflecting light.',                 cost: 2 }] },
  { axis: 'magic', label: 'SHADOW',  reagent: 'WRAILL',    reagentLabel: 'Felldrop',     statKey: 'spirit',  color: '#9b7fbd', spells: [{ id: 'sha_1', name: 'Darkstep',      desc: 'Teleport through shadow to a nearby point.',        cost: 2 }, { id: 'sha_2', name: 'Voidcloak',     desc: 'Render a creature invisible in shadow.',            cost: 2 }, { id: 'sha_3', name: 'Shade Leash',   desc: "Bind a target's shadow, slowing them.",            cost: 1 }] },
];

const TECH_DISCIPLINES = [
  { axis: 'tech', label: 'ION',     reagent: 'GAIN',      reagentLabel: 'Ion Cap',       statKey: 'mind',  color: '#60c8f0', spells: [{ id: 'ion_1', name: 'Charge Pulse',  desc: 'Release a directed electromagnetic burst.',         cost: 1 }, { id: 'ion_2', name: 'Arc Tether',    desc: 'Link two points with a conductive arc.',            cost: 2 }, { id: 'ion_3', name: 'Static Shell',  desc: 'Wrap self in a charge-deflecting field.',           cost: 2 }] },
  { axis: 'tech', label: 'STEAM',   reagent: 'GRIT',      reagentLabel: 'Steam Core',    statKey: 'will',  color: '#d4a88a', spells: [{ id: 'ste_1', name: 'Pressurize',    desc: 'Vent a high-pressure blast from a mechanism.',      cost: 1 }, { id: 'ste_2', name: 'Overrive',      desc: 'Push a steam-powered device past safe limits.',     cost: 2 }, { id: 'ste_3', name: 'Boilerplate',   desc: 'Reinforce a structure with rapid steam-forging.',   cost: 2 }] },
  { axis: 'tech', label: 'ELEMENT', reagent: 'FOCUS',     reagentLabel: 'Element Charm', statKey: 'mind',  color: '#88d8b0', spells: [{ id: 'ele_1', name: 'Coldsnap',      desc: 'Flash-freeze a surface or small area.',             cost: 1 }, { id: 'ele_2', name: 'Flashfire',     desc: 'Ignite a targeted zone in rapid combustion.',       cost: 2 }, { id: 'ele_3', name: 'Conductor',     desc: 'Redirect elemental energy through a medium.',       cost: 1 }] },
  { axis: 'tech', label: 'ARC',     reagent: 'MATTER',    reagentLabel: 'Arc Spore',     statKey: 'whim',  color: '#f0a060', spells: [{ id: 'arc_1', name: 'Deconstruct',   desc: 'Atomize a small object or section of material.',    cost: 2 }, { id: 'arc_2', name: 'Lattice',       desc: 'Restructure matter into a temporary form.',         cost: 2 }, { id: 'arc_3', name: 'Spore Burst',   desc: 'Release reactive arc-spores on impact.',            cost: 1 }] },
  { axis: 'tech', label: 'CELL',    reagent: 'REASON',    reagentLabel: 'Rad Cell',      statKey: 'mind',  color: '#80e8c0', spells: [{ id: 'cel_1', name: 'Biostim',       desc: 'Accelerate cellular regeneration in a target.',     cost: 1 }, { id: 'cel_2', name: 'Pathogen',      desc: 'Introduce a synthetic compound into a system.',     cost: 2 }, { id: 'cel_3', name: 'Catalyze',      desc: 'Trigger a rapid chemical reaction in matter.',      cost: 1 }] },
  { axis: 'tech', label: 'LITHIUM', reagent: 'FORTITUDE', reagentLabel: 'Lithium Lens',  statKey: 'will',  color: '#b8d4f8', spells: [{ id: 'lit_1', name: 'Bastion',       desc: 'Erect a temporary energy barrier.',                 cost: 2 }, { id: 'lit_2', name: 'Endure',        desc: 'Suppress pain and damage effects for one turn.',    cost: 1 }, { id: 'lit_3', name: 'Anchor',        desc: 'Fix a target in place with magnetic force.',        cost: 2 }] },
  { axis: 'tech', label: 'NULL',    reagent: 'INGENUITY', reagentLabel: 'Nullid',        statKey: 'dream', color: '#c8b8e8', spells: [{ id: 'nul_1', name: 'Jammers',       desc: 'Disrupt all mechanical and arcane signals nearby.',  cost: 2 }, { id: 'nul_2', name: 'Phantom Build', desc: 'Assemble a temporary structure from null-matter.',  cost: 2 }, { id: 'nul_3', name: 'Void Tap',      desc: 'Draw energy from an adjacent null-field.',         cost: 1 }] },
];

const ALL_DISCIPLINES = [...MAGIC_DISCIPLINES, ...TECH_DISCIPLINES];

// ─── CAST FOR PLAYER MODAL ────────────────────────────────────────────────────
function CastForPlayerModal({ disc, spell, characters, onConfirm, onClose }) {
  const [selectedChar, setSelectedChar] = useState(null);
  const [casting, setCasting]           = useState(false);
  const [done, setDone]                 = useState(false);
  const [result, setResult]             = useState(null);

  const handleCast = async () => {
    if (!selectedChar || casting) return;
    setCasting(true);

    const statVal  = selectedChar?.stats?.[disc.statKey] ?? 8;
    const modifier = Math.floor((statVal - 8) / 2);
    const roll     = Math.floor(Math.random() * 20) + 1;
    const total    = roll + modifier;

    // Write a cast_request marked approved immediately
    const { error: reqErr } = await supabase.from('cast_requests').insert({
      campaign_id:      selectedChar.campaign || null,
      character_id:     String(selectedChar.id),
      character_name:   selectedChar.name || 'Player',
      ability_id:       spell.id,
      ability_name:     spell.name,
      discipline_label: disc.label,
      axis:             disc.axis,
      stat_key:         disc.statKey,
      modifier,
      cost:             spell.cost,
      currency_key:     disc.reagent,
      status:           'approved',
      roll,
      total,
      resolved_at:      new Date().toISOString(),
      dm_note:          'Cast by the Architect.',
    });

    // Log to Hercules
    const { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(selectedChar.campaign || '')).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();

    if (hsession?.id) {
      await supabase.from('hercules_events').insert({
        session_id:  hsession.id,
        type:        'cast_resolved',
        actor_name:  selectedChar.name || 'Player',
        actor_id:    String(selectedChar.id),
        description: `The Architect casts ${spell.name} [${disc.label}] for ${selectedChar.name}: d20 ${roll} ${modifier >= 0 ? '+' : ''}${modifier} = ${total}.`,
        dm_approved: true,
      });
    }

    // Notify player via message
    if (selectedChar.campaign) {
      await supabase.from('messages').insert({
        type:         'dm',
        is_dm:        true,
        sender_name:  'The Architect',
        character_id: String(selectedChar.id),
        campaign_id:  selectedChar.campaign,
        content:      `The Architect has cast **${spell.name}** [${disc.label}] on your behalf. Roll: d20 ${roll} ${modifier >= 0 ? '+' : ''}${modifier} = **${total}**.`,
        session_id:   null,
      });
    }

    setResult({ roll, modifier, total });
    setDone(true);
    setCasting(false);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 500000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#100d0a', border: `1px solid ${disc.color}44`, borderRadius: 14, width: '100%', maxWidth: 400, maxHeight: '85vh', overflowY: 'auto', padding: 24 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: disc.color, fontWeight: 700 }}>{spell.name}</div>
            <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', marginTop: 3 }}>{disc.label} · {disc.reagentLabel} · {spell.cost} cost</div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
        </div>

        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 20, lineHeight: 1.5 }}>{spell.desc}</div>

        {!done ? (
          <>
            <div style={{ ...label8(), marginBottom: 10 }}>Cast for which character?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 260, overflowY: 'auto', marginBottom: 16 }}>
              {characters.length === 0 && <div style={{ fontSize: 10, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No approved characters found.</div>}
              {characters.map(c => (
                <button key={c.id} onClick={() => setSelectedChar(c)}
                  style={{ background: selectedChar?.id === c.id ? `${disc.color}18` : COLORS.card, border: `1px solid ${selectedChar?.id === c.id ? disc.color + '55' : COLORS.border}`, borderRadius: 7, padding: '10px 12px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{c.name}</div>
                    <div style={{ fontSize: 8, color: COLORS.dim, marginTop: 2 }}>
                      Campaign {c.campaign || '—'} · {disc.statKey} {c.stats?.[disc.statKey] ?? 8}
                      {(() => { const v = c.stats?.[disc.statKey] ?? 8; const m = Math.floor((v - 8) / 2); return m !== 0 ? ` (mod ${m >= 0 ? '+' : ''}${m})` : ''; })()}
                    </div>
                  </div>
                  {selectedChar?.id === c.id && <div style={{ color: disc.color, fontSize: 14 }}>✓</div>}
                </button>
              ))}
            </div>

            <button onClick={handleCast} disabled={!selectedChar || casting}
              style={{ width: '100%', background: selectedChar ? `${disc.color}18` : 'transparent', border: `1px solid ${selectedChar ? disc.color + '66' : COLORS.border}`, borderRadius: 8, padding: '11px', cursor: selectedChar ? 'pointer' : 'default', fontFamily: "'Cinzel', serif", fontSize: 10, color: selectedChar ? disc.color : COLORS.dim, fontWeight: 700, letterSpacing: '0.12em' }}>
              {casting ? 'Casting…' : `⬡ Cast ${spell.name}`}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{result.total}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: disc.color, marginBottom: 6 }}>
              d20 {result.roll} {result.modifier >= 0 ? '+' : ''}{result.modifier} = {result.total}
            </div>
            <div style={{ fontSize: 10, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 16 }}>
              {spell.name} cast for {selectedChar?.name}. Player notified.
            </div>
            <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.dim }}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN DM PANEL ────────────────────────────────────────────────────────────
export default function CastorDMPanel({ onPendingChange, onClose }) {
  const [tab, setTab]                   = useState('catalog'); // 'catalog' | 'queue'
  const [axisFilter, setAxisFilter]     = useState('all');
  const [requests, setRequests]         = useState([]);
  const [characters, setCharacters]     = useState([]);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [resolving, setResolving]       = useState(null);
  const [dmNotes, setDmNotes]           = useState({});
  const [castModal, setCastModal]       = useState(null); // { disc, spell }
  const [expandedDisc, setExpandedDisc] = useState(null);

  useEffect(() => {
    loadRequests();
    loadCharacters();
    const sub = supabase.channel('castor-dm-queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cast_requests' }, loadRequests)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const loadRequests = async () => {
    const { data } = await supabase.from('cast_requests').select('*')
      .order('created_at', { ascending: false }).limit(100);
    if (data) {
      setRequests(data);
      onPendingChange?.(data.filter(r => r.status === 'pending').length);
    }
  };

  const loadCharacters = async () => {
    const { data } = await supabase.from('characters').select('id, data, status, campaign_id')
      .eq('status', 'approved');
    if (data) {
      setCharacters(data.map(row => {
        let d = {};
        try { d = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}); } catch (_) {}
        return { id: row.id, name: d.name || 'Unnamed', campaign: d.campaign || row.campaign_id || null, stats: d.stats || {} };
      }));
    }
  };

  const resolve = async (req, status) => {
    if (resolving) return;
    setResolving(req.id);
    const note = dmNotes[req.id]?.trim() || null;
    await supabase.from('cast_requests').update({ status, dm_note: note, resolved_at: new Date().toISOString() }).eq('id', req.id);
    const { data: hsession } = await supabase.from('hercules_sessions').select('id')
      .eq('campaign_id', String(req.campaign_id)).eq('status', 'active')
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (hsession?.id) {
      await supabase.from('hercules_events').insert({
        session_id: hsession.id, type: 'cast_resolved', actor_name: 'The Architect', actor_id: null,
        description: `${status === 'approved' ? 'APPROVED' : 'DENIED'}: ${req.character_name}'s request to cast ${req.ability_name} [${req.discipline_label}].${note ? ` Note: "${note}"` : ''}`,
        dm_approved: status === 'approved',
      });
    }
    setDmNotes(p => { const n = { ...p }; delete n[req.id]; return n; });
    setResolving(null);
    loadRequests();
  };

  const pending = requests.filter(r => r.status === 'pending');
  const visibleDiscs = ALL_DISCIPLINES.filter(d => axisFilter === 'all' || d.axis === axisFilter);
  const visibleRequests = requests.filter(r => {
    if (tab === 'queue' && r.status !== 'pending') return false;
    if (campaignFilter !== 'all' && r.campaign_id !== campaignFilter) return false;
    return true;
  });

  return (
    <>
      {castModal && (
        <CastForPlayerModal
          disc={castModal.disc}
          spell={castModal.spell}
          characters={characters}
          onConfirm={() => {}}
          onClose={() => { setCastModal(null); loadRequests(); }}
        />
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, alignItems: 'center' }}>
          {[['catalog', 'Catalog'], ['queue', `Queue${pending.length > 0 ? ` (${pending.length})` : ''}`]].map(([v, lbl]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ background: tab === v ? 'rgba(56,189,248,0.12)' : 'transparent', border: `1px solid ${tab === v ? 'rgba(56,189,248,0.4)' : COLORS.border}`, borderRadius: 5, padding: '4px 12px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', color: tab === v ? '#7dd3fc' : COLORS.dim }}>
              {lbl}
            </button>
          ))}
          {tab === 'catalog' && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[['all', 'All'], ['magic', 'Spells'], ['tech', 'Schematics']].map(([v, lbl]) => (
                <button key={v} onClick={() => setAxisFilter(v)}
                  style={{ background: axisFilter === v ? 'rgba(56,189,248,0.12)' : 'transparent', border: `1px solid ${axisFilter === v ? 'rgba(56,189,248,0.4)' : COLORS.border}`, borderRadius: 4, padding: '3px 7px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: axisFilter === v ? '#7dd3fc' : COLORS.dim }}>
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── CATALOG TAB ── */}
        {tab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {visibleDiscs.map(disc => {
              const isOpen = expandedDisc === disc.label;
              return (
                <div key={disc.label} style={{ border: `1px solid ${disc.color}22`, borderRadius: 8, overflow: 'hidden' }}>
                  {/* Discipline header */}
                  <button onClick={() => setExpandedDisc(isOpen ? null : disc.label)}
                    style={{ width: '100%', background: isOpen ? `${disc.color}10` : COLORS.card, border: 'none', padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: disc.color, flexShrink: 0 }} />
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: disc.color, letterSpacing: '0.16em', fontWeight: 700, flex: 1 }}>{disc.label}</div>
                    <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{disc.reagentLabel}</div>
                    <div style={{ color: disc.color, fontSize: 10, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</div>
                  </button>

                  {/* Spells */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${disc.color}22` }}>
                      {disc.spells.map((spell, i) => (
                        <div key={spell.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < disc.spells.length - 1 ? `1px solid ${COLORS.border}` : 'none', background: 'rgba(0,0,0,0.2)' }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text, marginBottom: 2 }}>{spell.name}</div>
                            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 3 }}>{spell.desc}</div>
                            <div style={{ fontSize: 7, color: disc.color, fontFamily: "'Cinzel', serif" }}>{spell.cost} {disc.reagentLabel}</div>
                          </div>
                          <button onClick={() => setCastModal({ disc, spell })}
                            style={{ background: `${disc.color}14`, border: `1px solid ${disc.color}55`, borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: disc.color, fontWeight: 700, letterSpacing: '0.1em', flexShrink: 0, whiteSpace: 'nowrap' }}>
                            ⬡ Cast / Craft
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── QUEUE TAB ── */}
        {tab === 'queue' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Campaign filter */}
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
              {[{ id: 'all', subtitle: 'All' }, ...CAMPAIGNS].map(c => (
                <button key={c.id} onClick={() => setCampaignFilter(c.id)}
                  style={{ background: campaignFilter === c.id ? COLORS.surface : 'transparent', border: `1px solid ${campaignFilter === c.id ? COLORS.borderMid : COLORS.border}`, borderRadius: 4, padding: '3px 8px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: campaignFilter === c.id ? COLORS.text : COLORS.dim }}>
                  {c.subtitle}
                </button>
              ))}
            </div>

            {visibleRequests.length === 0 && (
              <div style={{ background: COLORS.card, border: `1px dashed ${COLORS.border}`, borderRadius: 8, padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>No pending cast requests.</div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visibleRequests.map(req => {
                const axisCol   = req.axis === 'magic' ? COLORS.magic : COLORS.tech;
                const isPending = req.status === 'pending';
                return (
                  <div key={req.id} style={{ background: isPending ? 'rgba(56,189,248,0.04)' : COLORS.card, border: `1px solid ${isPending ? 'rgba(56,189,248,0.25)' : COLORS.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ padding: '12px 14px', borderBottom: isPending ? '1px solid rgba(56,189,248,0.12)' : `1px solid ${COLORS.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, color: COLORS.text, fontWeight: 700 }}>{req.ability_name}</div>
                          <div style={{ fontSize: 8, color: axisCol, fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', marginTop: 2 }}>{req.discipline_label} · {req.axis}</div>
                        </div>
                        <div style={{ fontSize: 7, color: isPending ? '#7dd3fc' : (req.status === 'approved' ? COLORS.magic : '#e05a5a'), background: isPending ? 'rgba(56,189,248,0.1)' : 'transparent', border: isPending ? '1px solid rgba(56,189,248,0.3)' : 'none', borderRadius: 3, padding: isPending ? '2px 6px' : 0, fontFamily: "'Cinzel', serif" }}>
                          {isPending ? 'AWAITING' : req.status === 'approved' ? '✓ APPROVED' : '✕ DENIED'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                        <div style={{ fontSize: 9, color: COLORS.text, fontFamily: 'Georgia, serif' }}>{req.character_name}</div>
                        <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>{req.cost} {req.currency_key}</div>
                        {req.modifier !== 0 && <div style={{ fontSize: 9, color: axisCol, fontFamily: "'Cinzel', serif" }}>mod {req.modifier >= 0 ? '+' : ''}{req.modifier}</div>}
                        <div style={{ fontSize: 8, color: COLORS.dim, marginLeft: 'auto' }}>{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                      {req.dm_note && !isPending && <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 6 }}>"{req.dm_note}"</div>}
                    </div>
                    {isPending && (
                      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <input value={dmNotes[req.id] || ''} onChange={e => setDmNotes(p => ({ ...p, [req.id]: e.target.value }))}
                          placeholder="DM note (optional)…"
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '6px 9px', fontFamily: 'Georgia, serif', fontSize: 10, color: COLORS.text, outline: 'none', boxSizing: 'border-box' }} />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => resolve(req, 'approved')} disabled={resolving === req.id}
                            style={{ flex: 1, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 6, padding: '8px', cursor: resolving === req.id ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: COLORS.magicText, fontWeight: 700 }}>
                            {resolving === req.id ? '…' : '✓ Approve'}
                          </button>
                          <button onClick={() => resolve(req, 'denied')} disabled={resolving === req.id}
                            style={{ flex: 1, background: 'rgba(224,90,90,0.1)', border: '1px solid rgba(224,90,90,0.35)', borderRadius: 6, padding: '8px', cursor: resolving === req.id ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: '#e05a5a', fontWeight: 700 }}>
                            {resolving === req.id ? '…' : '✕ Deny'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
