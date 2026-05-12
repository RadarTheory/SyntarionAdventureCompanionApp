import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import { SOTERIA_BESTIARY } from './soteria-bestiary';


function normalizeCampaigns() {
  if (Array.isArray(CAMPAIGNS)) return CAMPAIGNS;

  if (CAMPAIGNS && typeof CAMPAIGNS === 'object') {
    return Object.entries(CAMPAIGNS).map(([id, value]) => ({
      id,
      ...(typeof value === 'object' ? value : { name: String(value) }),
    }));
  }

  return [];
}

function getBestiaryText() {
  if (typeof SOTERIA_BESTIARY === 'string') return SOTERIA_BESTIARY;

  if (Array.isArray(SOTERIA_BESTIARY)) {
    return SOTERIA_BESTIARY.join('\n');
  }

  if (SOTERIA_BESTIARY && typeof SOTERIA_BESTIARY === 'object') {
    return Object.values(SOTERIA_BESTIARY)
      .map(value => {
        if (typeof value === 'string') return value;
        if (value?.name) return `CREATURE NAME: ${value.name}`;
        if (value?.creatureName) return `CREATURE NAME: ${value.creatureName}`;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
}

function parseCreatureNames() {
  const text = getBestiaryText();
  if (!text) return [];

  const names = new Set();

  // Format: "- CREATURE NAME — description" or "- CREATURE NAME — description"
  const bulletRegex = /^[-•]\s+([A-Z][A-Z\s'\/\(\)]+?)(?:\s+[—–-]{1,2}|\s*$)/gm;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    const name = match[1].trim().replace(/['"`,;]+$/g, '');
    if (name.length > 2 && name.length < 60 && !name.includes('  ')) {
      names.add(name);
    }
  }

  // Also catch "CREATURE NAME:" format if ever added
  const colonRegex = /CREATURE NAME:\s*([^\n\r]+)/gi;
  while ((match = colonRegex.exec(text)) !== null) {
    const name = match[1].trim().replace(/['"`,;]+$/g, '');
    if (name && !name.includes(':')) names.add(name);
  }

  return Array.from(names).sort().slice(0, 300);
}

function createScribeSuggestion(event) {
  const total = Number(event.total ?? event.roll ?? 0);
  const action = event.description || event.type || 'action';
  const actor = event.actor_name || 'The combatant';

  if (event.type === 'initiative') {
    return `${actor} enters the fray with initiative ${total}. Suggested outcome: place them in descending turn order and begin tracking their actions.`;
  }

  if (event.type === 'enemy_added') {
    return `${actor} has entered the fight. Suggested prompt: decide where it appears, whether it rolls initiative now, and what immediate threat it presents.`;
  }

  if (total >= 20) {
    return `${actor}'s ${action} is decisive. Suggested outcome: strong success, added damage, tactical advantage, or momentum.`;
  }

  if (total >= 15) {
    return `${actor}'s ${action} appears successful. Suggested outcome: the action lands as intended unless the target has strong defenses.`;
  }

  if (total >= 10) {
    return `${actor}'s ${action} is uncertain. Suggested outcome: partial success, reduced effect, or complication.`;
  }

  return `${actor}'s ${action} likely fails or creates an opening. Suggested outcome: miss, blocked attempt, enemy advantage, or consequence.`;
}

function HerculesLogoImage({ hovered = false, size = '72%' }) {
  return (
    <img
      src="/HerculesCombat.png"
      alt="HERCULES"
      draggable={false}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'block',
        filter: hovered
          ? 'brightness(1.18) drop-shadow(0 0 10px rgba(201,185,145,0.45))'
          : 'brightness(1) drop-shadow(0 0 8px rgba(200,168,74,0.25))',
        transition: 'all 0.18s ease',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  );
}

export default function HerculesCombat({ defaultCampaignId, darkMode = true }) {
  const campaignList = useMemo(normalizeCampaigns, []);
  const creatureNames = useMemo(parseCreatureNames, []);
  const firstCampaignId = campaignList?.[0]?.id || '';

  const savedPos = (() => {
    try {
      return JSON.parse(localStorage.getItem('herculesButtonPos'));
    } catch {
      return null;
    }
  })();

  const [buttonPos, setButtonPos] = useState(savedPos || { x: 24, y: 140 });
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(false);

  const dragOffset = useRef({ x: 0, y: 0 });
  const moved = useRef(false);

  const [campaignId, setCampaignId] = useState(defaultCampaignId || firstCampaignId);
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [creatureSearch, setCreatureSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const activeSessionId = session?.id;

  useEffect(() => {
    localStorage.setItem('herculesButtonPos', JSON.stringify(buttonPos));
  }, [buttonPos]);

  useEffect(() => {
    if (!campaignId && firstCampaignId) {
      setCampaignId(firstCampaignId);
    }
  }, [campaignId, firstCampaignId]);

  const loadEvents = useCallback(
    async sid => {
      const sessionId = sid || activeSessionId;
      if (!sessionId) return;

      const { data, error } = await supabase
        .from('hercules_events')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false });

      if (!error) setEvents(data || []);
    },
    [activeSessionId]
  );

  const loadInitiative = useCallback(
    async sid => {
      const sessionId = sid || activeSessionId;
      if (!sessionId) return;

      const { data, error } = await supabase
        .from('hercules_initiative')
        .select('*')
        .eq('session_id', sessionId)
        .order('total', { ascending: false });

      if (!error) {
        const sorted = (data || []).map((row, index) => ({
          ...row,
          turn_order: index + 1,
        }));

        setInitiative(sorted);
      }
    },
    [activeSessionId]
  );

  const loadSession = useCallback(async () => {
    if (!campaignId) return;

    const { data, error } = await supabase
      .from('hercules_sessions')
      .select('*')
      .eq('campaign_id', String(campaignId))
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      setSession(null);
      setEvents([]);
      setInitiative([]);
      return;
    }

    setSession(data || null);

    if (data?.id) {
      await loadEvents(data.id);
      await loadInitiative(data.id);
    } else {
      setEvents([]);
      setInitiative([]);
    }
  }, [campaignId, loadEvents, loadInitiative]);

  useEffect(() => {
    if (!campaignId) return;
    loadSession();
  }, [campaignId, loadSession]);

  useEffect(() => {
    if (!activeSessionId) return undefined;

    const channel = supabase
      .channel(`hercules-dm-${activeSessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hercules_events',
          filter: `session_id=eq.${activeSessionId}`,
        },
        () => loadEvents(activeSessionId)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hercules_initiative',
          filter: `session_id=eq.${activeSessionId}`,
        },
        () => loadInitiative(activeSessionId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeSessionId, loadEvents, loadInitiative]);

  const startCombat = async () => {
    if (!campaignId) return;

    setSaving(true);

    const { data, error } = await supabase
      .from('hercules_sessions')
      .insert({
        campaign_id: String(campaignId),
        status: 'active',
        current_turn: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setSession(data);

      await supabase.from('hercules_events').insert({
        session_id: data.id,
        campaign_id: String(campaignId),
        type: 'combat_start',
        actor_name: 'Dungeon Master',
        description: 'Combat has begun. Initiative requested from all players.',
        outcome: 'HERCULES combat session opened.',
        dm_approved: true,
      });

      await loadEvents(data.id);
      await loadInitiative(data.id);
    }

    setSaving(false);
  };

  const endCombat = async () => {
    if (!session?.id) return;

    setSaving(true);

    await supabase.from('hercules_events').insert({
      session_id: session.id,
      campaign_id: String(campaignId),
      type: 'combat_end',
      actor_name: 'Dungeon Master',
      description: 'Combat has ended.',
      outcome: 'HERCULES combat session closed.',
      dm_approved: true,
    });

    await supabase
      .from('hercules_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    setSession(null);
    setEvents([]);
    setInitiative([]);
    setSaving(false);
  };

  const addCreature = async creatureName => {
    if (!session?.id || !creatureName) return;

    await supabase.from('hercules_events').insert({
      session_id: session.id,
      campaign_id: String(campaignId),
      type: 'enemy_added',
      actor_name: creatureName,
      description: `${creatureName} added to combat.`,
      scribe_suggestion: `Scribe: ${creatureName} has entered the field. Suggested prompt: ask the DM where it appears, whether it is hostile, and whether it rolls initiative now.`,
      dm_approved: null,
    });

    await loadEvents(session.id);
  };

  const approveEvent = async event => {
    if (!event?.id) return;

    await supabase
      .from('hercules_events')
      .update({
        dm_approved: true,
        outcome: event.scribe_suggestion || event.outcome || 'Approved by DM.',
        dm_note: null,
      })
      .eq('id', event.id);

    await loadEvents();
  };

  const denyEvent = async event => {
    if (!event?.id) return;

    await supabase
      .from('hercules_events')
      .update({
        dm_approved: false,
        outcome: 'Denied by DM. No effect is applied.',
        dm_note: null,
      })
      .eq('id', event.id);

    await loadEvents();
  };

  const customOutcome = async (eventId, text) => {
    if (!eventId || !text?.trim()) return;

    await supabase
      .from('hercules_events')
      .update({
        dm_approved: true,
        outcome: text.trim(),
        dm_note: text.trim(),
      })
      .eq('id', eventId);

    await loadEvents();
  };

  const clamp = (x, y) => ({
    x: Math.max(8, Math.min(window.innerWidth - 90, x)),
    y: Math.max(8, Math.min(window.innerHeight - 90, y)),
  });

  const startDrag = event => {
    const point = event.touches ? event.touches[0] : event;

    dragOffset.current = {
      x: point.clientX - buttonPos.x,
      y: point.clientY - buttonPos.y,
    };

    moved.current = false;
    setIsDragging(true);
  };

  const onMove = useCallback(
    event => {
      if (!isDragging) return;

      const point = event.touches ? event.touches[0] : event;

      const next = clamp(
        point.clientX - dragOffset.current.x,
        point.clientY - dragOffset.current.y
      );

      moved.current = true;
      setButtonPos(next);
    },
    [isDragging]
  );

  const stopDrag = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', stopDrag);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [onMove, stopDrag]);

  const filteredCreatures = creatureNames.filter(name =>
    name.toLowerCase().includes(creatureSearch.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onClick={() => {
          if (!moved.current) setOpen(true);
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="HERCULES Combat Tracker"
        style={{
          position: 'fixed',
          left: buttonPos.x,
          top: buttonPos.y,
          width: 82,
          height: 82,
          borderRadius: '50%',
          border: hovered
            ? '1px solid rgba(230,210,160,0.92)'
            : '1px solid rgba(201,185,145,0.45)',
          background: hovered ? 'rgba(18,14,10,0.96)' : 'rgba(10,8,6,0.82)',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          overflow: 'hidden',
          transform: hovered ? 'translateY(-2px) scale(1.04)' : 'translateY(0px) scale(1)',
          boxShadow: hovered
            ? '0 0 24px rgba(201,185,145,0.35), 0 14px 42px rgba(0,0,0,0.75)'
            : '0 10px 28px rgba(0,0,0,0.55)',
          transition: isDragging ? 'none' : 'all 0.18s ease',
          backdropFilter: 'blur(8px)',
          touchAction: 'none',
        }}
      >
        <HerculesLogoImage hovered={hovered} darkMode={darkMode} />
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            right: 24,
            top: 76,
            width: 'min(1100px, calc(100vw - 48px))',
            height: 'min(760px, calc(100vh - 110px))',
            background: '#100d0a',
            border: '1px solid rgba(200,168,74,0.35)',
            borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
            zIndex: 100000,
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(200,168,74,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                border: '1px solid rgba(201,185,145,0.35)',
                background: 'rgba(10,8,6,0.82)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <HerculesLogoImage size="74%" />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: '#e8d9a7',
                  fontSize: 18,
                  letterSpacing: '0.16em',
                }}
              >
                HERCULES
              </div>
              <div style={{ color: COLORS.dim, fontSize: 11, fontFamily: 'Georgia, serif' }}>
                Combat tracker, initiative board, Scribe rulings, and fight event log.
              </div>
            </div>

            <select
              value={campaignId}
              onChange={event => setCampaignId(event.target.value)}
              style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`,
                color: COLORS.text,
                borderRadius: 6,
                padding: '8px 10px',
                fontFamily: 'Georgia, serif',
              }}
            >
              {campaignList.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.id} — {campaign.subtitle || campaign.name || 'Campaign'}
                </option>
              ))}
            </select>

            {!session ? (
              <button type="button" onClick={startCombat} disabled={saving || !campaignId} style={goldButton()}>
                Start Combat
              </button>
            ) : (
              <button type="button" onClick={endCombat} disabled={saving} style={redButton()}>
                End Combat
              </button>
            )}

            <button type="button" onClick={() => setOpen(false)} style={plainButton()}>
              Close
            </button>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '270px 1fr 320px',
              gap: 12,
              padding: 12,
              minHeight: 0,
            }}
          >
            <div style={panelStyle()}>
              <SectionTitle>Initiative</SectionTitle>

              {!session && <EmptyText>No active combat.</EmptyText>}

              {session && initiative.length === 0 && <EmptyText>Waiting for players to roll initiative.</EmptyText>}

              {initiative.map((row, index) => (
                <div key={row.id} style={initiativeRow(index === 0)}>
                  <div>
                    <div
                      style={{
                        color: COLORS.text,
                        fontFamily: "'Cinzel', serif",
                        fontSize: 11,
                      }}
                    >
                      {index + 1}. {row.character_name}
                    </div>
                    <div style={{ color: COLORS.dim, fontSize: 10 }}>
                      d20 {row.roll} + {row.modifier}
                    </div>
                  </div>

                  <div style={{ color: '#e8d9a7', fontSize: 18, fontFamily: 'Georgia, serif' }}>
                    {row.total}
                  </div>
                </div>
              ))}
            </div>

            <div style={panelStyle()}>
              <SectionTitle>Scribe Rulings</SectionTitle>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  overflowY: 'auto',
                  paddingRight: 4,
                }}
              >
                {events.length === 0 && <EmptyText>No fight events logged yet.</EmptyText>}

                {events.map(event => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onApprove={approveEvent}
                    onDeny={denyEvent}
                    onCustom={customOutcome}
                  />
                ))}
              </div>
            </div>

            <div style={panelStyle()}>
              <SectionTitle>Bestiary</SectionTitle>

              <input
                value={creatureSearch}
                onChange={event => setCreatureSearch(event.target.value)}
                placeholder="Search creatures..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  color: COLORS.text,
                  borderRadius: 6,
                  padding: '9px 10px',
                  marginBottom: 10,
                  fontFamily: 'Georgia, serif',
                }}
              />

              <div
                style={{
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                {filteredCreatures.length === 0 && <EmptyText>No structured creature names found.</EmptyText>}

                {filteredCreatures.map(name => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => addCreature(name)}
                    disabled={!session}
                    style={{
                      textAlign: 'left',
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 6,
                      color: COLORS.text,
                      padding: '8px 10px',
                      cursor: session ? 'pointer' : 'not-allowed',
                      fontFamily: "'Cinzel', serif",
                      fontSize: 10,
                      letterSpacing: '0.06em',
                    }}
                  >
                    + {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes herculesFade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0px); }
        }
      `}</style>
    </>
  );
}

function EventCard({ event, onApprove, onDeny, onCustom }) {
  const [custom, setCustom] = useState('');

  const pending = event.dm_approved === null || event.dm_approved === undefined;
  const suggestion = event.scribe_suggestion || createScribeSuggestion(event);

  return (
    <div
      style={{
        background: pending ? 'rgba(200,168,74,0.08)' : COLORS.card,
        border: `1px solid ${pending ? 'rgba(200,168,74,0.35)' : COLORS.border}`,
        borderRadius: 10,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              color: COLORS.text,
              fontSize: 11,
              letterSpacing: '0.08em',
            }}
          >
            {event.actor_name || 'Unknown Actor'}
          </div>

          <div style={{ color: COLORS.dim, fontSize: 10, marginTop: 2 }}>
            {event.type} {event.total ? `• total ${event.total}` : ''}
          </div>
        </div>

        {event.roll !== null && event.roll !== undefined && (
          <div style={{ color: '#e8d9a7', fontSize: 20, fontFamily: 'Georgia, serif' }}>
            {event.total || event.roll}
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 8,
          color: COLORS.text,
          fontSize: 12,
          fontFamily: 'Georgia, serif',
          lineHeight: 1.45,
        }}
      >
        {event.description}
      </div>

      <div
        style={{
          marginTop: 10,
          padding: 10,
          borderRadius: 8,
          background: 'rgba(0,0,0,0.22)',
          border: '1px solid rgba(200,168,74,0.18)',
          color: '#d8c9a0',
          fontSize: 12,
          fontFamily: 'Georgia, serif',
          lineHeight: 1.45,
        }}
      >
        <strong>Scribe:</strong> {suggestion}
      </div>

      {event.outcome && (
        <div
          style={{
            marginTop: 8,
            color: event.dm_approved ? '#9fe0aa' : '#e08b7d',
            fontSize: 12,
            fontFamily: 'Georgia, serif',
          }}
        >
          <strong>Outcome:</strong> {event.outcome}
        </div>
      )}

      {pending && (
        <div
          style={{
            marginTop: 10,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <button type="button" onClick={() => onApprove(event)} style={goldButton()}>
            Approve
          </button>

          <button type="button" onClick={() => onDeny(event)} style={redButton()}>
            Deny
          </button>

          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Write custom DM outcome..."
            style={{
              gridColumn: '1 / -1',
              background: COLORS.card,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.text,
              borderRadius: 6,
              padding: '8px 10px',
              fontFamily: 'Georgia, serif',
            }}
          />

          <button
            type="button"
            onClick={() => onCustom(event.id, custom)}
            style={{
              ...plainButton(),
              gridColumn: '1 / -1',
            }}
          >
            Commit Custom Outcome
          </button>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Cinzel', serif",
        color: '#e8d9a7',
        fontSize: 12,
        letterSpacing: '0.14em',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function EmptyText({ children }) {
  return (
    <div
      style={{
        color: COLORS.dim,
        fontSize: 12,
        fontFamily: 'Georgia, serif',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

function panelStyle() {
  return {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(200,168,74,0.18)',
    borderRadius: 12,
    padding: 12,
    minHeight: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  };
}

function initiativeRow(active) {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: active ? 'rgba(200,168,74,0.12)' : COLORS.card,
    border: `1px solid ${active ? 'rgba(200,168,74,0.35)' : COLORS.border}`,
    borderRadius: 8,
    padding: '9px 10px',
    marginBottom: 8,
  };
}

function goldButton() {
  return {
    background: 'rgba(200,168,74,0.16)',
    border: '1px solid rgba(200,168,74,0.55)',
    color: '#e8d9a7',
    borderRadius: 7,
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    letterSpacing: '0.08em',
  };
}

function redButton() {
  return {
    background: 'rgba(180,55,45,0.14)',
    border: '1px solid rgba(220,90,70,0.55)',
    color: '#e0a092',
    borderRadius: 7,
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    letterSpacing: '0.08em',
  };
}

function plainButton() {
  return {
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.dim,
    borderRadius: 7,
    padding: '8px 12px',
    cursor: 'pointer',
    fontFamily: "'Cinzel', serif",
    fontSize: 10,
    letterSpacing: '0.08em',
  };
}