import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import supabase from './lib/supabase';
import { COLORS, CAMPAIGNS } from './constants';
import * as BestiaryModule from './soteria-bestiary';

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
  const values = Object.values(BestiaryModule || {});
  return values.find(value => typeof value === 'string' && value.includes('CREATURE NAME:')) || '';
}

function parseCreatureNames() {
  const text = getBestiaryText();
  if (!text) return [];

  return text
    .split('CREATURE NAME:')
    .slice(1)
    .map(chunk => chunk.split('\n')[0]?.trim())
    .filter(Boolean)
    .slice(0, 300);
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

function SwordAxeLogo() {
  return (
    <svg viewBox="0 0 100 100" width="42" height="42" aria-hidden="true">
      <defs>
        <radialGradient id="hercGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5d47a" />
          <stop offset="100%" stopColor="#7b1f18" />
        </radialGradient>
      </defs>

      <circle cx="50" cy="50" r="43" fill="#15100c" stroke="#c8a84a" strokeWidth="4" />
      <path d="M27 72 L70 29" stroke="#e8d9a7" strokeWidth="8" strokeLinecap="round" />
      <path d="M32 25 L75 70" stroke="#b44738" strokeWidth="8" strokeLinecap="round" />
      <path
        d="M20 18 C34 12 46 17 48 29 C35 31 25 28 20 18Z"
        fill="url(#hercGlow)"
        stroke="#f0d28a"
        strokeWidth="2"
      />
      <path
        d="M77 20 C65 13 53 17 51 30 C64 32 73 29 77 20Z"
        fill="url(#hercGlow)"
        stroke="#f0d28a"
        strokeWidth="2"
      />
      <circle cx="50" cy="50" r="10" fill="#c8a84a" stroke="#fff0bd" strokeWidth="2" />
      <text x="50" y="87" textAnchor="middle" fontSize="10" fill="#e8d9a7" fontFamily="serif">
        H
      </text>
    </svg>
  );
}

export default function HerculesCombat({ defaultCampaignId }) {
  const campaignList = useMemo(normalizeCampaigns, []);
  const creatureNames = useMemo(parseCreatureNames, []);

  const firstCampaignId = campaignList?.[0]?.id || '';
  const [buttonPos, setButtonPos] = useState({ x: 28, y: 140 });
  const [isDragging, setIsDragging] = useState(false);
  const [didMove, setDidMove] = useState(false);
  const [open, setOpen] = useState(false);

  const [campaignId, setCampaignId] = useState(defaultCampaignId || firstCampaignId);
  const [session, setSession] = useState(null);
  const [events, setEvents] = useState([]);
  const [initiative, setInitiative] = useState([]);
  const [creatureSearch, setCreatureSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const activeSessionId = session?.id;

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

  const onPointerDown = event => {
    setIsDragging(true);
    setDidMove(false);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = event => {
    if (!isDragging) return;

    const movedEnough = Math.abs(event.movementX) > 1 || Math.abs(event.movementY) > 1;
    if (movedEnough) setDidMove(true);

    setButtonPos(pos => ({
      x: Math.max(8, pos.x + event.movementX),
      y: Math.max(8, pos.y + event.movementY),
    }));
  };

  const onPointerUp = () => {
    setIsDragging(false);
    setTimeout(() => setDidMove(false), 0);
  };

  const filteredCreatures = creatureNames.filter(name =>
    name.toLowerCase().includes(creatureSearch.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={() => {
          if (!didMove) setOpen(true);
        }}
        title="HERCULES Combat Tracker"
        style={{
          position: 'fixed',
          left: buttonPos.x,
          top: buttonPos.y,
          width: 74,
          height: 74,
          borderRadius: '50%',
          border: '1px solid rgba(232,200,116,0.8)',
          background: 'radial-gradient(circle, #26160f, #090706)',
          boxShadow: '0 0 28px rgba(200,168,74,0.25)',
          zIndex: 300,
          cursor: isDragging ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
        src="/HerculesCombat.png"
        alt="HERCULES"
        style={{
            width: 46,
            height: 46,
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 8px rgba(200,168,74,0.35))',
        }}
/>
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
            zIndex: 350,
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
            <SwordAxeLogo />

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