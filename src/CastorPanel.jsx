// ─── CASTOR ───────────────────────────────────────────────────────────────────
// Spell-Casting & Schematics approval system — player side.
//
// INTEGRATION into CampaignView.jsx:
//
// 1. Import at top:
//    import CastorPanel from './CastorPanel';
//
// 2. Add state in CampaignDashboard:
//    const [showCastor, setShowCastor]       = useState(false);
//    const [castorHovered, setCastorHovered] = useState(false);
//    const [castorBadge, setCastorBadge]     = useState(0);
//
// 3. Add FloatButton (after the HERCULES FloatButton):
//    <FloatButton storageKey="playerCastorPos" defaultPos={{ x: 24, y: 360 }}
//      onClick={() => setShowCastor(o => !o)} title="CASTOR — Cast Request"
//      hovered={castorHovered} onHover={setCastorHovered}>
//      <img src="/castoricon.png" alt="CASTOR" draggable={false}
//        style={{ width: '100%', height: '100%', objectFit: 'cover',
//          filter: castorHovered
//            ? 'brightness(1.3) drop-shadow(0 0 10px rgba(56,189,248,0.7))'
//            : 'brightness(1.0) drop-shadow(0 0 6px rgba(56,189,248,0.3))',
//          pointerEvents: 'none' }} />
//      {castorBadge > 0 && (
//        <span style={{ position: 'absolute', top: 4, right: 4,
//          background: COLORS.magic, color: '#120e0a', borderRadius: '50%',
//          width: 16, height: 16, fontSize: 8, fontFamily: 'monospace',
//          fontWeight: 700, display: 'flex', alignItems: 'center',
//          justifyContent: 'center', lineHeight: 1 }}>
//          {castorBadge > 9 ? '9+' : castorBadge}
//        </span>
//      )}
//    </FloatButton>
//
// 4. Add panel (after HerculesLite panel):
//    {showCastor && (
//      <CastorPanel
//        char={userChar}
//        campaignId={String(campaign.id)}
//        onClose={() => setShowCastor(false)}
//        onBadgeChange={setCastorBadge}
//      />
//    )}
//
// 5. Update AbilitiesPanel cast button — pass onCastRequest prop and call it
//    instead of onRoll when submitting. See submitCastRequest() below for the
//    insert shape.
//
// 6. Push:
//    git add .; git commit -m "feat: CastorPanel — cast request system player side"; git push
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

function label8() {
  return {
    fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase',
    color: COLORS.muted, fontFamily: "'Cinzel', serif",
  };
}

const STATUS_META = {
  pending:  { label: 'Pending',  color: '#e8c84a',    bg: 'rgba(200,168,74,0.10)'  },
  approved: { label: 'Approved', color: COLORS.magic, bg: 'rgba(121,245,167,0.08)' },
  denied:   { label: 'Denied',   color: '#e05a5a',    bg: 'rgba(224,90,90,0.08)'   },
};

const AXIS_COLOR = {
  magic: COLORS.magic,
  tech:  COLORS.tech,
};

// ─── SUBMIT HELPER ────────────────────────────────────────────────────────────
// Call this from AbilitiesPanel instead of onRoll when CASTOR is active.
// entry: the ability catalog entry object
// modifier: computed stat modifier (statVal - 8)
// char: userChar
// campaignId: String(campaign.id)
export async function submitCastRequest(entry, modifier, char, campaignId) {
  const { data, error } = await supabase.from('cast_requests').insert({
    campaign_id:      campaignId,
    character_id:     String(char.id),
    character_name:   char.name || 'Player',
    ability_id:       entry.id,
    ability_name:     entry.name,
    discipline_label: entry.disciplineLabel,
    axis:             entry.axis ?? (entry.discipline in ['sanctus','sacral','mana','essence','gnosis','shaeid','wraill'] ? 'magic' : 'tech'),
    stat_key:         entry.statKey,
    modifier:         modifier,
    cost:             entry.cost,
    currency_key:     entry.currencyKey,
    status:           'pending',
  }).select().single();
  if (error) throw error;
  return data;
}

// ─── CASTOR PANEL (player side) ───────────────────────────────────────────────
export default function CastorPanel({ char, campaignId, onClose, onBadgeChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const bottomRef               = useRef(null);

  useEffect(() => {
    if (!char?.id) return;
    loadRequests();
    const sub = supabase
      .channel(`castor-player-${char.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'cast_requests',
        filter: `character_id=eq.${char.id}`,
      }, loadRequests)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [char?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requests]);

  // Badge = number of resolved (approved/denied) since last open
  useEffect(() => {
    const unresolved = requests.filter(r => r.status === 'pending').length;
    onBadgeChange?.(unresolved);
  }, [requests]);

  const loadRequests = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('cast_requests')
      .select('*')
      .eq('character_id', String(char.id))
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setRequests(data);
    setLoading(false);
  };

  const cancelRequest = async (id) => {
    await supabase.from('cast_requests').delete().eq('id', id).eq('status', 'pending');
    loadRequests();
  };

  const pendingCount   = requests.filter(r => r.status === 'pending').length;
  const resolvedCount  = requests.filter(r => r.status !== 'pending').length;

  return (
    <div style={{
      position: 'fixed', bottom: 24, left: 108, width: 360, maxHeight: 580,
      zIndex: 200000, display: 'flex', flexDirection: 'column',
      background: '#0e0c1a',
      border: '1px solid rgba(56,189,248,0.35)',
      borderRadius: 14, boxShadow: '0 24px 80px rgba(0,0,0,0.75)', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid rgba(56,189,248,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(56,189,248,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/castoricon.png" alt="CASTOR"
            style={{ width: 28, height: 28, objectFit: 'contain',
              filter: 'brightness(1.1) drop-shadow(0 0 6px rgba(56,189,248,0.5))' }} />
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#7dd3fc', letterSpacing: '0.14em' }}>CASTOR</div>
            <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
              {pendingCount > 0 ? `${pendingCount} awaiting Architect` : 'Spell-Casting & Schematics'}
            </div>
          </div>
        </div>
        <button onClick={onClose} style={{
          background: 'transparent', border: `1px solid ${COLORS.border}`,
          borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 10, color: COLORS.dim,
        }}>✕</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
            Consulting the aether…
          </div>
        ) : requests.length === 0 ? (
          <div style={{ fontSize: 11, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center', marginTop: 24 }}>
            No cast requests yet. Submit one from the Abilities tab.
          </div>
        ) : (
          <>
            {/* Pending */}
            {pendingCount > 0 && (
              <div style={{ ...label8(), marginBottom: 4 }}>Awaiting Architect</div>
            )}
            {requests.filter(r => r.status === 'pending').map(req => (
              <CastRequestCard key={req.id} req={req} onCancel={cancelRequest} />
            ))}

            {/* Resolved */}
            {resolvedCount > 0 && (
              <>
                <div style={{ height: 1, background: COLORS.border, margin: '4px 0 8px' }} />
                <div style={{ ...label8(), marginBottom: 4 }}>Resolved</div>
              </>
            )}
            {requests.filter(r => r.status !== 'pending').map(req => (
              <CastRequestCard key={req.id} req={req} onCancel={null} />
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Footer hint */}
      <div style={{
        padding: '8px 14px', borderTop: `1px solid ${COLORS.border}`,
        fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic', textAlign: 'center',
      }}>
        Cast from Abilities tab · Architect approves and rolls
      </div>
    </div>
  );
}

// ─── CAST REQUEST CARD ────────────────────────────────────────────────────────
function CastRequestCard({ req, onCancel }) {
  const meta    = STATUS_META[req.status] || STATUS_META.pending;
  const axisCol = req.axis === 'magic' ? COLORS.magic : COLORS.tech;

  return (
    <div style={{
      background: meta.bg,
      border: `1px solid ${meta.color}44`,
      borderRadius: 10, padding: '10px 12px',
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, fontWeight: 700, color: axisCol, marginBottom: 2 }}>
            {req.ability_name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 7, color: axisCol + 'bb', fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>
              {req.discipline_label}
            </div>
            <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>
              {req.cost} {req.currency_key} · mod {req.modifier >= 0 ? `+${req.modifier}` : req.modifier}
            </div>
          </div>
        </div>
        <div style={{
          fontSize: 7, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em',
          color: meta.color, background: meta.color + '22',
          border: `1px solid ${meta.color}55`,
          borderRadius: 4, padding: '2px 7px', flexShrink: 0,
        }}>
          {meta.label}
        </div>
      </div>

      {/* Approved result */}
      {req.status === 'approved' && req.roll != null && (
        <div style={{
          background: 'rgba(121,245,167,0.06)', border: '1px solid rgba(121,245,167,0.2)',
          borderRadius: 6, padding: '8px 10px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ fontSize: 9, color: COLORS.magic, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>
            d20 {req.roll} {req.modifier >= 0 ? `+ ${req.modifier}` : `− ${Math.abs(req.modifier)}`}
          </div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 800, color: COLORS.magic }}>
            {req.total}
          </div>
        </div>
      )}

      {/* DM note */}
      {req.dm_note && (
        <div style={{ fontSize: 9, color: req.status === 'denied' ? '#e05a5a' : COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          "{req.dm_note}"
        </div>
      )}

      {/* Denied */}
      {req.status === 'denied' && !req.dm_note && (
        <div style={{ fontSize: 9, color: '#e05a5a', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          The Architect has denied this cast.
        </div>
      )}

      {/* Timestamp + cancel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
        <div style={{ fontSize: 7, color: COLORS.dim, fontFamily: 'Georgia, serif' }}>
          {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        {onCancel && req.status === 'pending' && (
          <button onClick={() => onCancel(req.id)} style={{
            background: 'transparent', border: `1px solid ${COLORS.border}`,
            borderRadius: 4, padding: '2px 8px', cursor: 'pointer',
            fontSize: 7, color: COLORS.dim, fontFamily: "'Cinzel', serif",
            letterSpacing: '0.08em',
          }}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
