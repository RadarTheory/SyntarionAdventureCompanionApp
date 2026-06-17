import { useState, useEffect, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS } from './constants';

// ─── EVENT TYPE CONFIG ────────────────────────────────────────────────────────

const EVENT_CONFIG = {
  combat_start:   { icon: '⚔', label: 'Combat Begins',    color: '#e85d4a', show: true  },
  combat_end:     { icon: '✦', label: 'Combat Ends',       color: COLORS.magic, show: true  },
  initiative:     { icon: '▶', label: 'Initiative',        color: '#e8c84a', show: true  },
  action:         { icon: '◈', label: 'Action',            color: COLORS.text, show: true  },
  ability:        { icon: '✦', label: 'Ability',           color: COLORS.deity, show: true  },
  cast_resolved:  { icon: '⬡', label: 'Spell Cast',        color: COLORS.magic, show: true  },
  roll:           { icon: '⬢', label: 'Roll',              color: '#e8c84a', show: true  },
  dm_roll:        { icon: '⬢', label: 'Architect Rolls',   color: '#e8c84a', show: true  },
  dm_note:        { icon: '◆', label: 'Architect Note',    color: COLORS.muted, show: true  },
  enemy_added:    { icon: '☽', label: 'Creature Enters',   color: '#e85d4a', show: true  },
  death:          { icon: '☠', label: 'Fallen',            color: '#e85d4a', show: true  },
  turn_advance:   { icon: '▶', label: 'Turn',              color: COLORS.dim,  show: true  },
  architect_edict:{ icon: '⚖', label: "Architect's Edict", color: '#e8c84a', show: true  },
  removed:        { icon: '✕', label: 'Removed',           color: COLORS.dim,  show: false },
  // Non-combat events
  session_start:  { icon: '★', label: 'Session Opens',     color: COLORS.magic, show: true  },
  session_note:   { icon: '◆', label: 'Session Note',      color: COLORS.muted, show: true  },
  loot_granted:   { icon: '⬡', label: 'Loot Granted',      color: '#e8c84a', show: true  },
  message:        { icon: '✉', label: 'Message',           color: COLORS.muted, show: true  },
  intent: { icon: '◎', label: 'Intent', color: '#a8c4e8', show: true },
};

function getEventConfig(type) {
  return EVENT_CONFIG[type] || { icon: '·', label: type, color: COLORS.dim, show: true };
}

// ─── SINGLE EVENT ROW ────────────────────────────────────────────────────────

function EventRow({ event, isNew }) {
  const cfg = getEventConfig(event.type);
  const time = new Date(event.created_at);
  const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const isCombat = ['combat_start', 'combat_end', 'death', 'enemy_added'].includes(event.type);
  const isRoll = ['roll', 'dm_roll', 'initiative'].includes(event.type);

  return (
    <div style={{
      display: 'flex',
      gap: 10,
      padding: '10px 0',
      borderBottom: `1px solid ${COLORS.border}`,
      animation: isNew ? 'chronicleSlide 0.3s ease' : 'none',
      opacity: 1,
    }}>
      {/* Icon column */}
      <div style={{
        width: 28,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 2,
      }}>
        <div style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: `${cfg.color}18`,
          border: `1px solid ${cfg.color}44`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          color: cfg.color,
        }}>{cfg.icon}</div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 3,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
            {event.actor_name && (
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 9,
                color: isCombat ? cfg.color : COLORS.muted,
                letterSpacing: '0.06em',
                flexShrink: 0,
              }}>{event.actor_name}</span>
            )}
            <span style={{
              fontSize: 7,
              color: COLORS.dim,
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}>{cfg.label}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            {isRoll && event.total != null && (
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#e8c84a',
              }}>{event.total}</div>
            )}
            <span style={{
              fontSize: 8,
              color: COLORS.dim,
              fontFamily: 'Georgia, serif',
            }}>{timeStr}</span>
          </div>
        </div>

        {event.description && (
          <div style={{
            fontSize: 11,
            color: isCombat ? COLORS.text : COLORS.textSub,
            fontFamily: 'Georgia, serif',
            lineHeight: 1.5,
            fontStyle: isCombat ? 'normal' : 'italic',
          }}>{event.description}</div>
        )}

        {event.outcome && (
          <div style={{
            fontSize: 10,
            color: event.dm_approved ? COLORS.magic : '#e05a5a',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            marginTop: 4,
          }}>↳ {event.outcome}</div>
        )}
      </div>
    </div>
  );
}

// ─── COMBAT BANNER ───────────────────────────────────────────────────────────

function CombatBanner({ session, initiative }) {
  if (!session) return null;

  const currentRow = initiative?.[session.current_turn ?? 0];

  return (
    <div style={{
      background: 'rgba(232,93,74,0.08)',
      border: '1px solid rgba(232,93,74,0.3)',
      borderRadius: 8,
      padding: '10px 14px',
      marginBottom: 14,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#e85d4a',
          boxShadow: '0 0 6px #e85d4a88',
          animation: 'combatPulse 1.5s ease infinite',
        }} />
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          color: '#e85d4a',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>Combat Active</div>
      </div>
      {currentRow && (
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontSize: 9,
          color: '#e8c84a',
          letterSpacing: '0.06em',
        }}>▶ {currentRow.character_name}</div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ChroniclePanel({ campaignId, userChar }) {
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [newEventIds, setNewEventIds] = useState(new Set());
  const [filter, setFilter] = useState('all'); // 'all' | 'combat' | 'rolls' | 'notes'
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const prevEventCount = useRef(0);

  useEffect(() => {
    if (!campaignId) return;
    loadSession();

    const channel = supabase.channel(`chronicle-${campaignId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'hercules_sessions',
        filter: `campaign_id=eq.${campaignId}`,
      }, loadSession)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'hercules_events',
      }, (payload) => {
        if (payload.new) {
          setEvents(prev => {
            const updated = [...prev, payload.new];
            setNewEventIds(ids => new Set([...ids, payload.new.id]));
            setTimeout(() => {
              setNewEventIds(ids => {
                const next = new Set(ids);
                next.delete(payload.new.id);
                return next;
              });
            }, 2000);
            return updated;
          });
        }
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'hercules_initiative',
      }, () => {
        if (session?.id) loadInitiative(session.id);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [campaignId]);

  useEffect(() => {
    if (session?.id) {
      loadInitiative(session.id);
    }
  }, [session?.id]);

  useEffect(() => {
    if (autoScroll && events.length > prevEventCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevEventCount.current = events.length;
  }, [events.length, autoScroll]);

  const loadSession = async () => {
    const { data } = await supabase
      .from('hercules_sessions')
      .select('*')
      .eq('campaign_id', String(campaignId))
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setSession(data || null);
    if (data?.id) {
      await loadEvents(data.id);
      await loadInitiative(data.id);
    } else {
      // Load most recent ended session for history
      const { data: recent } = await supabase
        .from('hercules_sessions')
        .select('*')
        .eq('campaign_id', String(campaignId))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (recent?.id) await loadEvents(recent.id);
    }
  };

  const loadEvents = async (sid) => {
    const { data } = await supabase
      .from('hercules_events')
      .select('*')
      .eq('session_id', sid)
      .order('created_at', { ascending: true });
    if (data) setEvents(data);
  };

  const loadInitiative = async (sid) => {
    const { data } = await supabase
      .from('hercules_initiative')
      .select('*')
      .eq('session_id', sid)
      .order('turn_order', { ascending: false });
    if (data) setInitiative(data);
  };

  // Filter events
  const filteredEvents = events.filter(ev => {
    const cfg = getEventConfig(ev.type);
    if (!cfg.show) return false;
    if (filter === 'combat') return ['combat_start', 'combat_end', 'initiative', 'action', 'ability', 'enemy_added', 'death', 'turn_advance', 'architect_edict'].includes(ev.type);
    if (filter === 'rolls') return ['roll', 'dm_roll', 'initiative', 'action'].includes(ev.type);
    if (filter === 'notes') return ['dm_note', 'session_note', 'loot_granted', 'cast_resolved'].includes(ev.type);
    return true;
  });

  const isCombatActive = session?.status === 'active';

  // Handle scroll to detect manual scroll up
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 50;
    setAutoScroll(isAtBottom);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <style>{`
        @keyframes chronicleSlide {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes combatPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}>
          <div>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.text,
              letterSpacing: '0.08em',
              marginBottom: 2,
            }}>Session Chronicle</div>
            <div style={{
              fontSize: 9,
              color: COLORS.dim,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
            }}>
              {isCombatActive ? 'Combat is active' : 'Live session feed'}
              {events.length > 0 ? ` · ${events.length} events` : ''}
            </div>
          </div>

          {!autoScroll && (
            <button
              onClick={() => {
                setAutoScroll(true);
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                background: COLORS.magicBg,
                border: `1px solid ${COLORS.magic}`,
                borderRadius: 5,
                padding: '5px 10px',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: 8,
                color: COLORS.magicText,
                letterSpacing: '0.1em',
              }}
            >↓ Latest</button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 5 }}>
          {[['all', 'All'], ['combat', 'Combat'], ['rolls', 'Rolls'], ['notes', 'Notes']].map(([val, lbl]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              style={{
                background: filter === val ? 'rgba(240,238,235,0.08)' : 'transparent',
                border: `1px solid ${filter === val ? COLORS.borderMid : COLORS.border}`,
                borderRadius: 4,
                padding: '4px 10px',
                cursor: 'pointer',
                fontFamily: "'Cinzel', serif",
                fontSize: 7,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: filter === val ? COLORS.text : COLORS.dim,
              }}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* Combat banner */}
      <CombatBanner session={isCombatActive ? session : null} initiative={initiative} />

      {/* Initiative strip (combat only) */}
      {isCombatActive && initiative.length > 0 && (
        <div style={{
          marginBottom: 14,
          background: COLORS.card,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: '10px 12px',
        }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 8,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.dim,
            marginBottom: 8,
          }}>Turn Order</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {initiative.map((row, i) => {
              const isActive = i === (session?.current_turn ?? 0) && row.status !== 'dead';
              const isDead = row.status === 'dead';
              const isMe = userChar && String(row.character_id) === String(userChar.id);
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '5px 8px',
                    background: isActive ? 'rgba(232,200,74,0.1)' : isMe ? 'rgba(121,245,167,0.06)' : 'transparent',
                    borderRadius: 5,
                    opacity: isDead ? 0.4 : 1,
                    textDecoration: isDead ? 'line-through' : 'none',
                    border: isActive ? '1px solid rgba(232,200,74,0.3)' : '1px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isActive && <span style={{ color: '#e8c84a', fontSize: 8 }}>▶</span>}
                    <span style={{
                      fontFamily: "'Cinzel', serif",
                      fontSize: 9,
                      color: isActive ? '#e8c84a' : isMe ? COLORS.magic : COLORS.muted,
                    }}>{i + 1}. {row.character_name}</span>
                    {isMe && !isActive && (
                      <span style={{
                        fontSize: 7,
                        color: COLORS.magic,
                        fontFamily: "'Cinzel', serif",
                        background: COLORS.magicBg,
                        border: `1px solid ${COLORS.magic}`,
                        borderRadius: 3,
                        padding: '1px 4px',
                      }}>You</span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: 12,
                    color: isActive ? '#e8c84a' : COLORS.dim,
                  }}>{row.turn_order || row.roll}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Events feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 200,
        }}
      >
        {filteredEvents.length === 0 ? (
          <div style={{
            padding: '40px 0',
            textAlign: 'center',
            fontSize: 11,
            color: COLORS.dim,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
          }}>
            {events.length === 0
              ? 'The chronicle awaits. The Architect will write here.'
              : 'No events match the current filter.'}
          </div>
        ) : (
          filteredEvents.map(ev => (
            <EventRow
              key={ev.id}
              event={ev}
              isNew={newEventIds.has(ev.id)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
