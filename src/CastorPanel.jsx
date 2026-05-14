import { useState, useEffect } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

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

const STATUS_STYLE = {
  pending:  { color: COLORS.deity, bg: COLORS.deityBg,        label: 'Pending'  },
  approved: { color: COLORS.magic, bg: COLORS.magicBg,        label: 'Approved' },
  denied:   { color: '#e05a5a',    bg: 'rgba(224,90,90,0.1)', label: 'Denied'   },
};

function CastorInner({ char, campaignId, onClose, onBadgeChange }) {
  const [requests, setRequests]           = useState([]);
  const [submitting, setSubmitting]       = useState(null);
  const [submitted, setSubmitted]         = useState({});
  const [axisFilter, setAxisFilter]       = useState('all');
  const [tab, setTab]                     = useState('catalog');
  const [note, setNote]                   = useState('');
  const [selectedSpell, setSelectedSpell] = useState(null);

  const alignVal     = Number(char?.alignment ?? 0);
  const isTechGated  = alignVal <= -3;
  const isMagicGated = alignVal >= 3;

  useEffect(() => {
    if (!char?.id) return;
    loadRequests();
    const sub = supabase.channel(`castor-player-${char.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cast_requests',
        filter: `character_id=eq.${char.id}` }, loadRequests)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [char?.id]);

  const loadRequests = async () => {
    const { data } = await supabase.from('cast_requests').select('*')
      .eq('character_id', String(char.id))
      .order('created_at', { ascending: false }).limit(30);
    if (data) {
      setRequests(data);
      onBadgeChange?.(data.filter(r => r.status === 'pending').length);
    }
  };

  const submitCast = async (disc, spell) => {
    if (!char?.id || submitting) return;
    setSubmitting(spell.id);
    const statVal  = char?.stats?.[disc.statKey] ?? 8;
    const modifier = Math.floor((statVal - 8) / 2);
    const { data: req, error } = await supabase.from('cast_requests').insert({
      campaign_id:      String(campaignId),
      character_id:     String(char.id),
      character_name:   char.name || 'Unknown',
      ability_id:       spell.id,
      ability_name:     spell.name,
      discipline_label: disc.label,
      axis:             disc.axis,
      stat_key:         disc.statKey,
      modifier,
      cost:             spell.cost,
      currency_key:     disc.reagent,
      status:           'pending',
      dm_note:          note.trim() || null,
    }).select().single();
    if (!error && req) {
      const { data: hsession } = await supabase.from('hercules_sessions').select('id')
        .eq('campaign_id', String(campaignId)).eq('status', 'active')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (hsession?.id) {
        await supabase.from('hercules_events').insert({
          session_id:  hsession.id, type: 'cast_request',
          actor_name:  char.name || 'Player', actor_id: String(char.id),
          description: `${char.name || 'Player'} requests to cast ${spell.name} [${disc.label}] — awaiting Architect approval.${note.trim() ? ` Note: "${note.trim()}"` : ''}`,
          dm_approved: false,
        });
      }
      setSubmitted(p => ({ ...p, [spell.id]: true }));
      setNote(''); setSelectedSpell(null);
      loadRequests();
    }
    setSubmitting(null);
  };

  const visible = ALL_DISCIPLINES.filter(d => axisFilter === 'all' || d.axis === axisFilter);

  return (
    <>
      {/* Tab bar + filter */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid rgba(56,189,248,0.1)`, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {[['catalog', 'Spells & Schematics'], ['history', 'History']].map(([v, lbl]) => (
            <button key={v} onClick={() => setTab(v)}
              style={{ background: tab === v ? 'rgba(56,189,248,0.12)' : 'transparent', border: `1px solid ${tab === v ? 'rgba(56,189,248,0.4)' : COLORS.border}`, borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, letterSpacing: '0.12em', color: tab === v ? '#7dd3fc' : COLORS.dim }}>
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
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {tab === 'catalog' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visible.map(disc => {
              const gated = disc.axis === 'tech' ? isTechGated : isMagicGated;
              return (
                <div key={disc.label} style={{ opacity: gated ? 0.38 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, paddingBottom: 5, borderBottom: `1px solid ${disc.color}22` }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: disc.color, flexShrink: 0 }} />
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, color: disc.color, letterSpacing: '0.16em', fontWeight: 700 }}>{disc.label}</div>
                    <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginLeft: 'auto' }}>{disc.reagentLabel}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {disc.spells.map(spell => {
                      const pending  = requests.some(r => r.ability_id === spell.id && r.status === 'pending');
                      const done     = submitted[spell.id];
                      const selected = selectedSpell?.id === spell.id;
                      const busy     = submitting === spell.id;
                      return (
                        <div key={spell.id}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: selected ? `${disc.color}11` : COLORS.card, border: `1px solid ${selected ? disc.color + '44' : COLORS.border}`, borderRadius: selected ? '7px 7px 0 0' : 7, padding: '8px 10px', transition: 'all 0.15s' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{spell.name}</div>
                              <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{spell.desc}</div>
                              <div style={{ fontSize: 7, color: disc.color, fontFamily: "'Cinzel', serif", marginTop: 3 }}>{spell.cost} {disc.reagentLabel}</div>
                            </div>
                            {gated ? (
                              <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif" }}>GATED</div>
                            ) : (pending || done) ? (
                              <div style={{ fontSize: 7, color: COLORS.magic, fontFamily: "'Cinzel', serif" }}>PENDING</div>
                            ) : (
                              <button onClick={() => setSelectedSpell(selected ? null : { ...spell, disc })}
                                style={{ background: selected ? `${disc.color}22` : 'transparent', border: `1px solid ${disc.color}55`, borderRadius: 5, padding: '4px 9px', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 7, color: disc.color, flexShrink: 0 }}>
                                {selected ? 'Cancel' : 'Submit'}
                              </button>
                            )}
                          </div>
                          {selected && !gated && (
                            <div style={{ background: `${disc.color}08`, border: `1px solid ${disc.color}22`, borderTop: 'none', borderRadius: '0 0 7px 7px', padding: '10px 12px' }}>
                              <textarea value={note} onChange={e => setNote(e.target.value)}
                                placeholder="Optional note to the Architect…" rows={2}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: `1px solid ${COLORS.border}`, borderRadius: 5, padding: '6px 8px', fontFamily: 'Georgia, serif', fontSize: 10, color: COLORS.text, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                              <button onClick={() => submitCast(disc, spell)} disabled={busy}
                                style={{ width: '100%', background: busy ? 'transparent' : `${disc.color}18`, border: `1px solid ${disc.color}66`, borderRadius: 6, padding: '8px', cursor: busy ? 'default' : 'pointer', fontFamily: "'Cinzel', serif", fontSize: 9, color: disc.color, fontWeight: 700, letterSpacing: '0.12em' }}>
                                {busy ? 'Submitting…' : `⬡ Submit ${spell.name} to Architect`}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'history' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.length === 0 && (
              <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', padding: '30px 0' }}>No cast requests yet.</div>
            )}
            {requests.map(req => {
              const s = STATUS_STYLE[req.status] || STATUS_STYLE.pending;
              return (
                <div key={req.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: COLORS.text }}>{req.ability_name}</div>
                    <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", color: s.color, background: s.bg, border: `1px solid ${s.color}`, borderRadius: 3, padding: '2px 6px' }}>{s.label}</div>
                  </div>
                  <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', marginBottom: req.dm_note ? 4 : 0 }}>{req.discipline_label} · {req.axis}</div>
                  {req.dm_note && <div style={{ fontSize: 9, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>"{req.dm_note}"</div>}
                  {req.status === 'approved' && <div style={{ fontSize: 9, color: COLORS.magic, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>✦ Approved — cast it.</div>}
                  {req.status === 'denied'   && <div style={{ fontSize: 9, color: '#e05a5a', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 4 }}>✕ Denied by the Architect.</div>}
                  <div style={{ fontSize: 7, color: COLORS.dim, marginTop: 6 }}>{new Date(req.created_at).toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function CastorPanel({ char, campaignId, onClose, onBadgeChange, embedded = false }) {
  if (embedded) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#0e0c1a' }}>
        <CastorInner char={char} campaignId={campaignId} onClose={onClose} onBadgeChange={onBadgeChange} />
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 108, width: 380, maxHeight: '80vh', zIndex: 200000, display: 'flex', flexDirection: 'column', background: '#0e0c1a', border: '1px solid rgba(56,189,248,0.3)', borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.7)', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(56,189,248,0.14)', background: 'rgba(56,189,248,0.04)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#7dd3fc', letterSpacing: '0.18em', fontWeight: 700 }}>CASTOR</div>
          <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginTop: 2 }}>{char?.name} · Submit to Architect</div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim }}>✕</button>
      </div>
      <CastorInner char={char} campaignId={campaignId} onClose={onClose} onBadgeChange={onBadgeChange} />
    </div>
  );
}
