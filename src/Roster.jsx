import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDevice } from './useDevice';
import { COLORS, CAMPAIGNS, ALL_CLASSES, getRaceDisplay } from './constants';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const FULL_TITLES = {
  'I':   'The Investigation of the Corren Mountain Mines',
  'II':  'The Keys of Aerithos',
  'III': 'The Trouble in Gamdon',
  'IV':  'Frozen Sick in Galekgarde',
};

function StatusBadge({ status }) {
  const map = {
    draft:              { label: 'Draft',             color: COLORS.dim,       bg: 'rgba(131,115,100,0.12)' },
    awaiting_adventure: { label: 'Awaiting Approval', color: COLORS.deity,     bg: COLORS.deityBg           },
    approved:           { label: 'Approved',          color: COLORS.magic,     bg: COLORS.magicBg           },
    rejected:           { label: 'Rejected',          color: COLORS.warn,      bg: COLORS.warnBg            },
  };
  const s = map[status] || map.draft;
  return (
    <div style={{
      display: 'inline-block', fontSize: 7, fontWeight: 700,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      fontFamily: "'Cinzel', serif", color: s.color,
      background: s.bg, border: `1px solid ${s.color}`,
      borderRadius: 4, padding: '2px 7px',
    }}>{s.label}</div>
  );
}

// ─── CLAIM MODAL ──────────────────────────────────────────────────────────────
function ClaimModal({ char, userId, onClaim, onCancel }) {
  const [selectedCampaign, setSelectedCampaign] = useState(char.campaign_id || '');
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async () => {
    setClaiming(true);
    await supabase
      .from('characters')
      .update({
        user_id: userId,
        campaign_id: selectedCampaign || null,
        status: 'approved',
      })
      .eq('id', char.id);
    onClaim(char.id, selectedCampaign);
  };

  const cls = ALL_CLASSES.find(c => c.id === char.data?.cid);

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,8,6,0.72)',
      backdropFilter: 'blur(6px)',
      zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#13100d',
        border: `1px solid rgba(240,238,235,0.12)`,
        borderRadius: 14,
        padding: '32px 36px',
        maxWidth: 400, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: COLORS.dim, marginBottom: 12 }}>
          Claim Adventurer
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: COLORS.text, marginBottom: 4 }}>
          {char.name}
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: 24 }}>
          {getRaceDisplay(char.data?.race, char.data?.rv, char.data?.pmV)}{cls ? ` · ${cls.name}` : ''}
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.muted, fontFamily: "'Cinzel', serif", marginBottom: 10 }}>
            Assign to Campaign
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CAMPAIGNS.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCampaign(selectedCampaign === c.id ? '' : c.id)}
                style={{
                  background: selectedCampaign === c.id ? 'rgba(240,238,235,0.06)' : 'transparent',
                  border: `1px solid ${selectedCampaign === c.id ? COLORS.borderMid : COLORS.border}`,
                  borderRadius: 6, padding: '8px 12px',
                  cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.12s',
                }}
              >
                <div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, color: selectedCampaign === c.id ? COLORS.text : COLORS.muted, letterSpacing: '0.06em' }}>{c.subtitle}</div>
                  <div style={{ fontSize: 9, color: COLORS.dim, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>{FULL_TITLES[c.id]}</div>
                </div>
                {selectedCampaign === c.id && <span style={{ color: COLORS.magic, fontSize: 10 }}>✓</span>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{
            flex: 1, background: 'transparent',
            border: `1px solid ${COLORS.border}`, borderRadius: 8,
            padding: '10px 0', color: COLORS.muted, fontSize: 10,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: 'pointer', fontFamily: "'Cinzel', serif",
          }}>Cancel</button>
          <button onClick={handleClaim} disabled={claiming} style={{
            flex: 2, background: 'rgba(240,238,235,0.06)',
            border: `1px solid ${COLORS.borderMid}`, borderRadius: 8,
            padding: '10px 0', color: COLORS.text, fontSize: 10,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: claiming ? 'default' : 'pointer',
            fontFamily: "'Cinzel', serif", fontWeight: 700,
            opacity: claiming ? 0.6 : 1,
          }}>{claiming ? 'Claiming…' : 'Claim Adventurer'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── CHARACTER CARD ───────────────────────────────────────────────────────────
function CharCard({ char, isMobile, isOwned, isClaimed, onClaim }) {
  const cls = ALL_CLASSES.find(c => c.id === char.data?.cid);
  const campaignLabel = char.campaign_id ? `${CAMPAIGNS.find(c => c.id === char.campaign_id)?.subtitle || char.campaign_id}` : null;

  return (
    <div style={{
      background: isOwned ? 'rgba(121,245,167,0.04)' : '#fff',
      border: `1px solid ${isOwned ? COLORS.magic + '44' : 'rgba(26,23,20,0.1)'}`,
      borderRadius: 8,
      padding: isMobile ? '14px 16px' : '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12,
      boxShadow: '0 1px 4px rgba(26,23,20,0.05)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 13 : 15, fontWeight: 700, color: '#1a1714', letterSpacing: '0.03em' }}>
            {char.name}
          </div>
          {isOwned && (
            <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.magic, background: COLORS.magicBg, border: `1px solid ${COLORS.magic}`, borderRadius: 4, padding: '1px 6px' }}>
              Your Character
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(26,23,20,0.5)', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: campaignLabel ? 4 : 0 }}>
          {getRaceDisplay(char.data?.race, char.data?.rv, char.data?.pmV)}{cls ? ` · ${cls.name}` : ''}
        </div>
        {campaignLabel && (
          <div style={{ fontSize: 8, color: 'rgba(26,23,20,0.35)', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {campaignLabel}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <StatusBadge status={char.status} />
        {!isClaimed && !isOwned && (
          <button
            onClick={() => onClaim(char)}
            style={{
              background: 'transparent',
              border: `1px solid rgba(26,23,20,0.2)`,
              borderRadius: 4, padding: '4px 10px',
              cursor: 'pointer', fontSize: 8,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(26,23,20,0.5)', fontFamily: "'Cinzel', serif",
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(26,23,20,0.4)'; e.currentTarget.style.color = '#1a1714'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(26,23,20,0.2)'; e.currentTarget.style.color = 'rgba(26,23,20,0.5)'; }}
          >
            ✦ Claim
          </button>
        )}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═════════════════════════════════════════════════════════════════════════════
export default function Roster({ user, userChar, onHome }) {
  const { isMobile } = useDevice();
  const [allChars, setAllChars]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [claimTarget, setClaimTarget] = useState(null);
  const [filter, setFilter]           = useState('all'); // 'all' | campaign id

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase.from('characters').select('*');
    if (data) setAllChars(data);
    setLoading(false);
  };

  const handleClaim = async (charId, campaignId) => {
    setAllChars(prev => prev.map(c =>
      c.id === charId ? { ...c, user_id: user?.id, campaign_id: campaignId, status: 'approved' } : c
    ));
    setClaimTarget(null);
  };

  const hasOwnChar = !!userChar;
  const ownCharId  = userChar?.id;

  // Filter
  const filtered = filter === 'all'
    ? allChars
    : allChars.filter(c => c.campaign_id === filter);

  // Group by campaign
  const grouped = {};
  filtered.forEach(c => {
    const key = c.campaign_id || 'unassigned';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  const campaignOrder = ['I', 'II', 'III', 'IV', 'unassigned'];

  return (
    <div style={{ minHeight: '100vh', background: '#f0eeeb', fontFamily: 'Georgia, serif' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap'); * { box-sizing: border-box; } body { margin: 0; }`}</style>

      {claimTarget && (
        <ClaimModal
          char={claimTarget}
          userId={user?.id}
          onClaim={handleClaim}
          onCancel={() => setClaimTarget(null)}
        />
      )}

      {/* Header */}
      <div style={{ padding: isMobile ? '20px 20px 0' : '28px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={onHome} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.4)', padding: 0 }}>← Home</button>
      </div>

      {/* Title */}
      <div style={{ padding: isMobile ? '24px 20px 16px' : '32px 40px 20px', borderBottom: '1px solid rgba(26,23,20,0.08)' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)', marginBottom: 8 }}>
          Soteria · 178 E.U.
        </div>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 24 : 32, fontWeight: 700, color: '#1a1714', letterSpacing: '0.04em', lineHeight: 1.1 }}>
          ROSTER
        </div>
        <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 12, color: 'rgba(26,23,20,0.45)', marginTop: 6 }}>
          {hasOwnChar ? 'Your character and campaign roster.' : 'Claim your adventurer and join the world.'}
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ padding: isMobile ? '12px 20px' : '14px 40px', borderBottom: '1px solid rgba(26,23,20,0.06)', display: 'flex', gap: 8, overflowX: 'auto' }}>
        {[{ id: 'all', label: 'All' }, ...CAMPAIGNS].map(c => {
          const isActive = filter === c.id;
          return (
            <button key={c.id} onClick={() => setFilter(c.id)} style={{
              background: isActive ? '#1a1714' : 'transparent',
              border: `1px solid ${isActive ? '#1a1714' : 'rgba(26,23,20,0.18)'}`,
              borderRadius: 20, padding: '5px 14px',
              cursor: 'pointer', fontFamily: "'Cinzel', serif",
              fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: isActive ? '#f0eeeb' : 'rgba(26,23,20,0.5)',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
            }}>{c.label || c.subtitle}</button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '20px' : '28px 40px' }}>
        {loading ? (
          <div style={{ color: 'rgba(26,23,20,0.4)', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13 }}>Consulting the archives…</div>
        ) : (
          campaignOrder.map(campId => {
            const chars = grouped[campId];
            if (!chars || chars.length === 0) return null;
            const camp = CAMPAIGNS.find(c => c.id === campId);
            return (
              <div key={campId} style={{ marginBottom: 32 }}>
                {/* Campaign header */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(26,23,20,0.35)', marginBottom: 4 }}>
                    {camp ? `Campaign ${campId}` : 'Unassigned'}
                  </div>
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: isMobile ? 15 : 18, fontWeight: 700, color: '#1a1714', letterSpacing: '0.04em' }}>
                    {camp ? camp.subtitle : 'No Campaign'}
                  </div>
                  {camp && (
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 11, color: 'rgba(26,23,20,0.4)', marginTop: 2 }}>
                      {FULL_TITLES[campId]}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {chars.map(char => {
                    const isOwned   = char.id === ownCharId || char.user_id === user?.id;
                    const isClaimed = !!char.user_id;
                    return (
                      <CharCard
                        key={char.id}
                        char={char}
                        isMobile={isMobile}
                        isOwned={isOwned}
                        isClaimed={isClaimed}
                        onClaim={setClaimTarget}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
