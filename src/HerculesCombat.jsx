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

  const bulletRegex = /^[-•]\s+([A-Z][A-Z\s'\/\(\)]+?)(?:\s+[—–-]{1,2}|\s*$)/gm;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    const name = match[1].trim().replace(/['"`,;]+$/g, '');
    if (name.length > 2 && name.length < 60 && !name.includes('  ')) {
      names.add(name);
    }
  }

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

  if (event.type === 'action') {
    return `${actor} attempts an action. Suggested outcome: review the roll in the description and apply success, failure, partial success, or a complication.`;
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

function HerculesLogoImage({ size = 56 }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#1a1410', border: '1px solid rgba(232,217,167,0.3)' }} />
    );
  }

  return (
    <img
      src="/HerculesCombat.png"
      alt="HERCULES"
      draggable={false}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
    />
  );
}

// Stable enemy token colors cycled by creature name hash
const ENEMY_COLORS = ['#e85d4a', '#fb923c', '#c084fc', '#f472b6', '#f87171', '#fbbf24'];
function creatureColor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return ENEMY_COLORS[h % ENEMY_COLORS.length];
}

function VitalsPanel({ row, onClose, campaignId }) {
  const isCreature = !row.character_id || row.character_id === row.character_name;
  const VITALS_KEY = `syntarion_vitals_${row.character_id}`;
  const load = (k, def) => { try { return JSON.parse(localStorage.getItem(VITALS_KEY) || '{}')[k] ?? def; } catch { return def; } };
  const [vitals, setVitals] = useState({ current: load('vitals', null), max: load('vitalsMax', null) });
  const [stamina, setStamina] = useState({ current: load('stamina', null), max: load('staminaMax', null) });
  const [resolve, setResolve] = useState({ current: load('resolve', null), max: load('resolveMax', null) });

  useEffect(() => {
    if (!isCreature) {
      supabase.from('characters').select('data').eq('id', String(row.character_id)).maybeSingle().then(({ data }) => {
        if (!data?.data) return;
        const d = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
        const s = d.stats || {};
        const v = (s.body || 8) + (s.will || 8), st = (s.body || 8) + (s.whim || 8), r = (s.soul || 8) + (s.dream || 8);
        setVitals(p => ({ current: p.current ?? v, max: p.max ?? v }));
        setStamina(p => ({ current: p.current ?? st, max: p.max ?? st }));
        setResolve(p => ({ current: p.current ?? r, max: p.max ?? r }));
      });
    }
  }, [row.character_id]);

  const save = (v, s, r) => localStorage.setItem(VITALS_KEY, JSON.stringify({
    vitals: v.current, vitalsMax: v.max, stamina: s.current, staminaMax: s.max, resolve: r.current, resolveMax: r.max
  }));

  const Tracker = ({ label, color, state, setState, others }) => {
    const cur = state.current ?? 0, max = state.max ?? 0;
    const pct = max > 0 ? Math.max(0, Math.min(100, (cur / max) * 100)) : 0;
    const upd = (next) => { setState(next); save(label === 'Vitals' ? next : vitals, label === 'Stamina' ? next : stamina, label === 'Resolve' ? next : resolve); };
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 9, color, letterSpacing: '0.1em' }}>{label}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button onClick={() => upd({ ...state, current: Math.max(0, (state.current ?? 0) - 1) })} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(224,90,90,0.15)', border: '1px solid rgba(224,90,90,0.4)', color: '#e05a5a', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <input type="number" value={state.current ?? ''} onChange={e => upd({ ...state, current: parseInt(e.target.value) || 0 })} style={{ width: 36, textAlign: 'center', background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}44`, borderRadius: 4, color, fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, outline: 'none', padding: '2px 0' }} />
            <span style={{ color: '#555', fontSize: 10 }}>/</span>
            <input type="number" value={state.max ?? ''} onChange={e => upd({ ...state, max: parseInt(e.target.value) || 0 })} style={{ width: 36, textAlign: 'center', background: 'rgba(0,0,0,0.2)', border: `1px solid ${COLORS.border}`, borderRadius: 4, color: COLORS.dim, fontFamily: "'Cinzel',serif", fontSize: 11, outline: 'none', padding: '2px 0' }} />
            <button onClick={() => upd({ ...state, current: Math.min(state.max ?? 999, (state.current ?? 0) + 1) })} style={{ width: 20, height: 20, borderRadius: 4, background: 'rgba(121,245,167,0.1)', border: '1px solid rgba(121,245,167,0.35)', color: '#79f5a7', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>
        <div style={{ height: 4, background: `${color}22`, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.2s ease' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ background: 'rgba(20,14,10,0.95)', border: '1px solid rgba(224,90,90,0.3)', borderRadius: 10, padding: '12px 14px', marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, color: COLORS.text }}>{row.character_name} — Health</div>
        <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: '2px 6px', cursor: 'pointer', fontSize: 9, color: COLORS.dim }}>✕</button>
      </div>
      {isCreature && <div style={{ fontSize: 8, color: COLORS.dim, fontFamily: 'Georgia,serif', fontStyle: 'italic', marginBottom: 8 }}>Set max manually for this enemy.</div>}
      <Tracker label="Vitals" color="#e05a5a" state={vitals} setState={setVitals} />
      <Tracker label="Stamina" color="#e08a5a" state={stamina} setState={setStamina} />
      <Tracker label="Resolve" color="#79f5a7" state={resolve} setState={setResolve} />
    </div>
  );
}

export default function HerculesCombat({ defaultCampaignId, darkMode = true, onPlaceToken, onRegisterAddCreature }) {
  const campaignList = useMemo(normalizeCampaigns, []);
  const creatureNames = useMemo(parseCreatureNames, []);
  const firstCampaignId = campaignList?.[0]?.id || '';
  const [manualLogText, setManualLogText] = useState('');
  const [manualCombatantName, setManualCombatantName] = useState('');
  const [vitalsOpen, setVitalsOpen] = useState(null);

  const savedPos = (() => {
    try {
      return JSON.parse(localStorage.getItem('herculesButtonPos'));
    } catch {
      return null;
    }
  })();

  const [buttonPos, setButtonPos] = useState(savedPos || { x: 24, y: 140 });
  const savedWindowPos = (() => {
    try {
      return JSON.parse(localStorage.getItem('herculesWindowPos'));
    } catch {
      return null;
    }
  })();

  const [windowPos, setWindowPos] = useState(savedWindowPos || { x: 120, y: 76 });
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const windowDragOffset = useRef({ x: 0, y: 0 });
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
  const eventsBottomRef = useRef(null);

  useEffect(() => {
    eventsBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [events.length]);

  const activeSessionId = session?.id || null;
  const activeSessionIdRef = useRef(null);
  const campaignIdRef = useRef(campaignId || null);

  useEffect(() => {
    activeSessionIdRef.current = session?.id || null;
  }, [session?.id]);

  useEffect(() => {
    campaignIdRef.current = campaignId || null;
  }, [campaignId]);

  useEffect(() => {
    localStorage.setItem('herculesButtonPos', JSON.stringify(buttonPos));
  }, [buttonPos]);

  useEffect(() => {
    localStorage.setItem('herculesWindowPos', JSON.stringify(windowPos));
  }, [windowPos]);

  useEffect(() => {
    if (!campaignId && firstCampaignId) {
      setCampaignId(firstCampaignId);
    }
  }, [campaignId, firstCampaignId]);

  const loadEvents = useCallback(async sid => {
    const sessionId = sid || activeSessionIdRef.current;

    if (!sessionId) {
      setEvents([]);
      return;
    }

    const { data, error } = await supabase
      .from('hercules_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load Hercules events:', error);
      return;
    }

    setEvents(data || []);
  }, []);

  const loadInitiative = useCallback(async sid => {
    const sessionId = sid || activeSessionIdRef.current;

    if (!sessionId) {
      setInitiative([]);
      return;
    }

    const { data, error } = await supabase
      .from('hercules_initiative')
      .select('*')
      .eq('session_id', sessionId)
      .order('turn_order', { ascending: false })
      .order('tie_breaker', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load Hercules initiative:', error);
      setInitiative([]);
      return;
    }

    const normalized = (data || []).map(row => ({
      ...row,
      total: Number(row.turn_order ?? row.roll ?? 0),
      roll: Number(row.roll ?? 0),
      modifier: Number(row.modifier ?? 0),
      character_name: row.character_name || 'Unknown',
    }));

    setInitiative(normalized);
  }, []);

  const getTiedInitiativeGroups = () => {
    const groups = initiative.reduce((acc, row) => {
      const score = Number(row.total ?? row.turn_order ?? row.roll ?? 0);
      if (!acc[score]) acc[score] = [];
      acc[score].push(row);
      return acc;
    }, {});

    return Object.values(groups).filter(group => group.length > 1);
  };

  const hasInitiativeTies = getTiedInitiativeGroups().length > 0;

  const nextTurn = async () => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid || initiative.length === 0) return;
    setSaving(true);

    // Skip dead combatants
    const alive = initiative.filter(r => r.status !== 'dead');
    if (alive.length === 0) { setSaving(false); return; }

    const currentIndex = session?.current_turn ?? 0;
    const currentInAlive = alive.findIndex((r, i) => {
      const globalIndex = initiative.indexOf(r);
      return globalIndex >= currentIndex;
    });
    const nextAliveIndex = (currentInAlive + 1) % alive.length;
    const nextCombatant = alive[nextAliveIndex];
    const nextGlobalIndex = initiative.indexOf(nextCombatant);

    await supabase.from('hercules_sessions').update({ current_turn: nextGlobalIndex }).eq('id', sid);

    await supabase.from('hercules_events').insert({
      session_id: sid,
      type: 'turn_advance',
      actor_name: 'The Architect',
      description: `Turn advances to ${nextCombatant.character_name}.`,
    });

    await loadSession();
    setSaving(false);
  };

  const resolveArchitectsEdict = useCallback(async () => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid) return;

    const tiedGroups = getTiedInitiativeGroups();
    if (tiedGroups.length === 0) {
      console.log('No initiative ties to resolve.');
      return;
    }

    setSaving(true);

    for (const group of tiedGroups) {
      const results = group.map(row => ({
        row,
        tieBreaker: Math.floor(Math.random() * 20) + 1,
      }));

      for (const result of results) {
        const { error } = await supabase
          .from('hercules_initiative')
          .update({ tie_breaker: result.tieBreaker })
          .eq('id', result.row.id);

        if (error) {
          console.error('Failed to apply Architect Edict:', error);
        }
      }

      const names = results
        .map(result => {
          const name = result.row.character_name || result.row.actor_name || 'Combatant';
          return `${name} ${result.tieBreaker}`;
        })
        .join(', ');

      const tiedScore = Number(group[0].total ?? group[0].turn_order ?? group[0].roll ?? 0);

      const { error: eventError } = await supabase.from('hercules_events').insert({
        session_id: sid,
        type: 'architect_edict',
        actor_name: 'The Architect',
        actor_id: null,
        description: `Architect's Edict resolves an initiative tie at ${tiedScore}: ${names}.`,
      });

      if (eventError) {
        console.error('Failed to log Architect Edict:', eventError);
      }
    }

    await loadInitiative(sid);
    await loadEvents(sid);

    setSaving(false);
  }, [session, loadEvents, loadInitiative]);

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
    const sessionId = session?.id;

    if (!sessionId) return undefined;

    activeSessionIdRef.current = sessionId;

    const channel = supabase
      .channel(`hercules-dm-${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hercules_events',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          await loadEvents(sessionId);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hercules_initiative',
          filter: `session_id=eq.${sessionId}`,
        },
        async () => {
          await loadInitiative(sessionId);
        }
      )
      .subscribe();

    loadEvents(sessionId);
    loadInitiative(sessionId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.id, loadEvents, loadInitiative]);

  const startCombat = async () => {
    if (!campaignId) return;

    setSaving(true);

    await supabase
      .from('hercules_sessions')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('campaign_id', String(campaignId))
      .eq('status', 'active');

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
      activeSessionIdRef.current = data.id;

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

    if (error) {
      console.error('Failed to start Hercules combat:', error);
    }

    setSaving(false);
  };

  // FIX 1: was referencing undefined `sid` — use `session.id` consistently
  const endCombat = async () => {
    const sid = session?.id || activeSessionIdRef.current;

    if (!sid) return;

    setSaving(true);

    const { error: eventError } = await supabase.from('hercules_events').insert({
      session_id: sid,
      type: 'combat_end',
      actor_name: 'Dungeon Master',
      description: 'Combat has ended.',
    });

    if (eventError) {
      console.error('Failed to log Hercules combat end:', eventError);
    }

    const { error: sessionError } = await supabase
      .from('hercules_sessions')
      .update({
        status: 'ended',
      })
      .eq('id', sid);

    if (sessionError) {
      console.error('Failed to end Hercules combat:', sessionError);
      setSaving(false);
      return;
    }

    activeSessionIdRef.current = null;
    setSession(null);
    setEvents([]);
    setInitiative([]);
    setSaving(false);
  };

  const rollBoardTokens = useCallback(async () => {
    const sid = session?.id || activeSessionIdRef.current;

    if (!sid || !campaignId) return;

    setSaving(true);

    const { data: vttSession, error: tokenError } = await supabase
      .from('vtt_sessions')
      .select('tokens')
      .eq('campaign_id', String(campaignId))
      .maybeSingle();

    if (tokenError) {
      console.error('Failed to load VTT tokens:', tokenError);
      setSaving(false);
      return;
    }

    const tokens = Array.isArray(vttSession?.tokens) ? vttSession.tokens : [];

    if (tokens.length === 0) {
      console.warn('No VTT tokens found for campaign:', campaignId);
      setSaving(false);
      return;
    }

    const { data: existingRows, error: initiativeError } = await supabase
      .from('hercules_initiative')
      .select('*')
      .eq('session_id', sid);

    if (initiativeError) {
      console.error('Failed to load existing initiative:', initiativeError);
      setSaving(false);
      return;
    }

    const alreadyRolled = new Set(
      (existingRows || []).map(row =>
        String(row.character_id || row.character_name || '').toLowerCase()
      )
    );

    const rowsToInsert = tokens
      .filter(token => {
        const tokenId = String(
          token.id ||
          token.token_id ||
          token.character_id ||
          token.name ||
          token.label ||
          ''
        ).toLowerCase();

        return tokenId && !alreadyRolled.has(tokenId);
      })
      .map(token => {
        const roll = Math.floor(Math.random() * 20) + 1;
        const modifier = Number(token.initiative_modifier ?? token.modifier ?? 0);
        const turnOrder = roll + modifier;

        const tokenId = String(
          token.id ||
          token.token_id ||
          token.character_id ||
          token.name ||
          token.label ||
          crypto.randomUUID()
        );

        const tokenName =
          token.name ||
          token.character_name ||
          token.creatureName ||
          token.creature_name ||
          token.label ||
          'Token';

        return {
          session_id: sid,
          character_id: tokenId,
          character_name: tokenName,
          roll,
          modifier,
          turn_order: turnOrder,
        };
      });

    if (rowsToInsert.length === 0) {
      console.log('All VTT tokens are already in initiative.');
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('hercules_initiative')
      .insert(rowsToInsert);

    if (insertError) {
      console.error('Failed to roll board tokens into initiative:', insertError);
      setSaving(false);
      return;
    }

    await supabase.from('hercules_events').insert(
      rowsToInsert.map(row => ({
        session_id: sid,
        type: 'initiative',
        actor_name: row.character_name,
        actor_id: row.character_id,
        description: `${row.character_name} was rolled into initiative by the DM.`,
      }))
    );

    await loadInitiative(sid);
    await loadEvents(sid);

    setSaving(false);
  }, [campaignId, loadEvents, loadInitiative, session]);

  // FIX 2: was an unclosed function that swallowed approveEvent/denyEvent/customOutcome inside it;
  // FIX 3: was missing the actual creature insert after resolving sid
  const addCreature = useCallback(async creatureName => {
    if (!creatureName || !campaignId) return;

    let sid = session?.id || activeSessionIdRef.current;

    if (!sid) {
      const { data, error } = await supabase
        .from('hercules_sessions')
        .insert({
          campaign_id: String(campaignId),
          status: 'active',
          current_turn: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create Hercules session for creature:', error);
        return;
      }

      if (data) {
        setSession(data);
        activeSessionIdRef.current = data.id;
        sid = data.id;
      }
    }

    if (!sid) return;

    const tokenId = crypto.randomUUID();
    const tokenLabel = creatureName.slice(0, 4).toUpperCase();

    // 1. Create token on the VTT board.
    const { data: vttSession, error: vttLoadError } = await supabase
      .from('vtt_sessions')
      .select('*')
      .eq('campaign_id', String(campaignId))
      .maybeSingle();

    if (vttLoadError) {
      console.error('Failed to load VTT session for creature token:', vttLoadError);
    }

    const existingTokens = Array.isArray(vttSession?.tokens) ? vttSession.tokens : [];

    const newToken = {
      id: tokenId,
      token_id: tokenId,
      name: creatureName,
      label: tokenLabel,
      creatureName,
      type: 'enemy',
      color: creatureColor(creatureName),
      x: 50,
      y: 50,
    };

    if (vttSession?.id) {
      const { error: vttUpdateError } = await supabase
        .from('vtt_sessions')
        .update({
          tokens: [...existingTokens, newToken],
          updated_at: new Date().toISOString(),
        })
        .eq('id', vttSession.id);

      if (vttUpdateError) {
        console.error('Failed to add creature token to VTT session:', vttUpdateError);
      }
    } else {
      const { error: vttInsertError } = await supabase
        .from('vtt_sessions')
        .insert({
          campaign_id: String(campaignId),
          tokens: [newToken],
          fog_zones: [],
          pending_moves: [],
        });

      if (vttInsertError) {
        console.error('Failed to create VTT session with creature token:', vttInsertError);
      }
    }

    // Also call the live VTT callback if DMView/VTTCanvas has it wired.
    onPlaceToken?.(newToken);

    // 2. Auto-roll initiative for that token.
    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = 0;
    const turnOrder = roll + modifier;

    const { error: initiativeError } = await supabase
      .from('hercules_initiative')
      .insert({
        session_id: sid,
        character_id: tokenId,
        character_name: creatureName,
        roll,
        modifier,
        turn_order: turnOrder,
      });

    if (initiativeError) {
      console.error('Failed to add creature to initiative:', initiativeError);
      return;
    }

    // 3. Log event in safe Hercules event shape.
    const { error: eventError } = await supabase
      .from('hercules_events')
      .insert({
        session_id: sid,
        type: 'enemy_added',
        actor_name: creatureName,
        actor_id: tokenId,
        description: `${creatureName} entered the map and rolled initiative: d20 ${roll} = ${turnOrder}.`,
      });

    if (eventError) {
      console.error('Failed to log creature entry:', eventError);
    }

    await Promise.all([loadEvents(sid), loadInitiative(sid)]);
  }, [session, campaignId, loadEvents, loadInitiative, onPlaceToken]);

  // Expose addCreature so DMView can call it programmatically (e.g. from VTT token placement)
  useEffect(() => {
    onRegisterAddCreature?.(addCreature);
  }, [addCreature, onRegisterAddCreature]);

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

  const rollCombatantAction = async row => {
    const sid = session?.id || activeSessionIdRef.current;

    if (!sid || !row) return;

    const actorName = row.character_name || row.actor_name || 'Combatant';
    const actionName = window.prompt(`What is ${actorName} doing?`, 'Attack');

    if (!actionName?.trim()) return;

    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = 0;
    const total = roll + modifier;

    const { error } = await supabase.from('hercules_events').insert({
      session_id: sid,
      type: 'action',
      actor_name: actorName,
      actor_id: row.character_id ? String(row.character_id) : null,
      description: `${actorName} used ${actionName.trim()}: d20 ${roll}${modifier ? ` + ${modifier}` : ''} = ${total}.`,
    });

    if (error) {
      console.error('Failed to log combatant action:', error);
      return;
    }

    await loadEvents(sid);
  };

  const markCombatantDead = async row => {
    const sid = session?.id || activeSessionIdRef.current;
    if (!sid || !row?.id) return;

    const actorName = row.character_name || 'Combatant';

    const { error } = await supabase
      .from('hercules_initiative')
      .update({
        status: 'dead',
      })
      .eq('id', row.id);

    if (error) {
      console.error('Failed to mark combatant dead:', error);
      return;
    }

    await supabase.from('hercules_events').insert({
      session_id: sid,
      type: 'death',
      actor_name: actorName,
      actor_id: row.character_id ? String(row.character_id) : null,
      description: `${actorName} has been marked dead.`,
    });

    await loadInitiative(sid);
    await loadEvents(sid);
  };

  const addManualLogEntry = async () => {
    const sid = session?.id || activeSessionIdRef.current;

    if (!sid || !manualLogText.trim()) return;

    setSaving(true);

    const { error } = await supabase.from('hercules_events').insert({
      session_id: sid,
      type: 'dm_note',
      actor_name: 'The Architect',
      actor_id: null,
      description: manualLogText.trim(),
    });

    if (error) {
      console.error('Failed to add manual Hercules log entry:', error);
      setSaving(false);
      return;
    }

    setManualLogText('');
    await loadEvents(sid);

    setSaving(false);
  };

  const addManualCombatant = async () => {
    const sid = session?.id || activeSessionIdRef.current;
    const name = manualCombatantName.trim();
    if (!sid || !name) return;

    setSaving(true);

    const roll = Math.floor(Math.random() * 20) + 1;
    const modifier = 0;
    const turnOrder = roll + modifier;
    const tokenId = crypto.randomUUID();

    const { error } = await supabase.from('hercules_initiative').insert({
      session_id: sid,
      character_id: tokenId,
      character_name: name,
      roll,
      modifier,
      turn_order: turnOrder,
    });

    if (error) {
      console.error('Failed to add manual combatant:', error);
      setSaving(false);
      return;
    }

    await supabase.from('hercules_events').insert({
      session_id: sid,
      type: 'enemy_added',
      actor_name: name,
      actor_id: tokenId,
      description: `${name} was added manually to combat with initiative d20 ${roll} = ${turnOrder}.`,
    });

    setManualCombatantName('');
    await Promise.all([loadInitiative(sid), loadEvents(sid)]);
    setSaving(false);
  };

  const removeCombatantFromTracker = async row => {
    const sid = session?.id || activeSessionIdRef.current;

    if (!sid || !row?.id) {
      console.error('Missing session or initiative row:', { sid, row });
      return;
    }

    const actorName = row.character_name || row.actor_name || 'Combatant';

    const confirmed = window.confirm(`Remove ${actorName} from initiative?`);
    if (!confirmed) return;

    setSaving(true);

    const { data, error } = await supabase
      .from('hercules_initiative')
      .delete()
      .eq('id', row.id)
      .select();

    if (error) {
      console.error('Failed to remove combatant from tracker:', error);
      setSaving(false);
      return;
    }

    if (!data || data.length === 0) {
      console.warn('No initiative row was deleted:', row);
      setSaving(false);
      return;
    }

    setInitiative(prev => prev.filter(item => item.id !== row.id));

    await supabase.from('hercules_events').insert({
      session_id: sid,
      type: 'removed',
      actor_name: actorName,
      actor_id: row.character_id ? String(row.character_id) : null,
      description: `${actorName} was removed from the initiative tracker.`,
    });

    await loadInitiative(sid);
    await loadEvents(sid);

    setSaving(false);
  };

  const startDrag = event => {
    const point = event.touches ? event.touches[0] : event;

    dragOffset.current = {
      x: point.clientX - buttonPos.x,
      y: point.clientY - buttonPos.y,
    };

    moved.current = false;
    setIsDragging(true);
  };

  const startWindowDrag = event => {
    const point = event.touches ? event.touches[0] : event;

    windowDragOffset.current = {
      x: point.clientX - windowPos.x,
      y: point.clientY - windowPos.y,
    };

    setIsWindowDragging(true);
  };

  const onWindowMove = useCallback(
    event => {
      if (!isWindowDragging) return;

      const point = event.touches ? event.touches[0] : event;

      const shellWidth = Math.min(1100, window.innerWidth - 48);
      const shellHeight = Math.min(760, window.innerHeight - 110);

      const nextX = point.clientX - windowDragOffset.current.x;
      const nextY = point.clientY - windowDragOffset.current.y;

      setWindowPos({
        x: Math.max(8, Math.min(window.innerWidth - shellWidth - 8, nextX)),
        y: Math.max(8, Math.min(window.innerHeight - shellHeight - 8, nextY)),
      });
    },
    [isWindowDragging, windowPos.x, windowPos.y]
  );

  const stopWindowDrag = useCallback(() => {
    setIsWindowDragging(false);
  }, []);

  const onMove = useCallback(
    event => {
      if (!isDragging) return;

      const point = event.touches ? event.touches[0] : event;

      const clamp = (x, y) => ({
        x: Math.max(8, Math.min(window.innerWidth - 90, x)),
        y: Math.max(8, Math.min(window.innerHeight - 90, y)),
      });

      const nextPosition = clamp(
        point.clientX - dragOffset.current.x,
        point.clientY - dragOffset.current.y
      );

      moved.current = true;
      setButtonPos(nextPosition);
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
        <HerculesLogoImage hovered={hovered} darkMode={darkMode} size={135} />
      </button>

      {open && (
        <div
          className="hercules-shell combat-shell"
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

            {session && (
              <button
                type="button"
                onClick={rollBoardTokens}
                disabled={saving}
                style={goldButton()}
              >
                Roll Board Tokens
              </button>
            )}
            {session && initiative.length > 0 && (
              <button type="button" onClick={nextTurn} disabled={saving} style={{ ...goldButton(), background: 'rgba(200,168,74,0.28)', border: '1px solid rgba(200,168,74,0.8)', fontWeight: 700 }}>
                Next Turn ▶
              </button>
            )}
            {session && (
              <button
                type="button"
                onClick={resolveArchitectsEdict}
                disabled={!hasInitiativeTies || saving}
                title="Resolve tied initiative rolls"
                style={{
                  ...goldButton(),
                  opacity: !hasInitiativeTies || saving ? 0.45 : 1,
                  cursor: !hasInitiativeTies || saving ? 'default' : 'pointer',
                }}
              >
                Architect's Edict
              </button>
            )}

            <button type="button" onClick={() => setOpen(false)} style={plainButton()}>
              Close
            </button>
          </div>

          <div
            className="hercules-main combat-main combat-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '270px 1fr 320px',
              gap: 12,
              padding: 12,
              minHeight: 0,
            }}
          >
            <div className="hercules-panel initiative-panel" style={panelStyle()}>
              <SectionTitle>Initiative</SectionTitle>

              {!session && <EmptyText>No active combat.</EmptyText>}

              {session && initiative.length === 0 && <EmptyText>Waiting for players to roll initiative.</EmptyText>}

              <div style={{ overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', gap: 0 }}>
  {initiative.map((row, index) => {
    const isCreature = !row.character_id;
    const displayName = row.character_name || row.actor_name || 'Unknown';
    const isDead = row.status === 'dead';
    const isActiveTurn = index === (session?.current_turn ?? 0) && !isDead;
    return (
      <div key={row.id} style={{ marginBottom: 6 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: isActiveTurn ? 'rgba(200,168,74,0.12)' : COLORS.card,
          border: `1px solid ${isActiveTurn ? 'rgba(200,168,74,0.35)' : COLORS.border}`,
          borderRadius: 8, padding: '9px 10px',
          opacity: isDead ? 0.45 : 1,
          textDecoration: isDead ? 'line-through' : 'none',
          boxShadow: isActiveTurn ? '0 0 0 2px rgba(200,168,74,0.55)' : 'none',
        }}>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {isActiveTurn && <div style={{ fontSize: 7, color: '#e8c84a', fontFamily: "'Cinzel', serif", letterSpacing: '0.12em', marginBottom: 2 }}>▶ ACTIVE TURN</div>}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <div style={{ color: isActiveTurn ? '#e8c84a' : COLORS.text, fontWeight: isActiveTurn ? 700 : 400, fontFamily: "'Cinzel', serif", fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {index + 1}. {displayName}
              </div>
              <div style={{ fontSize: 7, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', color: isCreature ? '#e08b7d' : '#9fe0aa', background: isCreature ? 'rgba(180,55,45,0.12)' : 'rgba(80,180,100,0.10)', border: `1px solid ${isCreature ? 'rgba(220,90,70,0.35)' : 'rgba(100,200,120,0.3)'}`, borderRadius: 3, padding: '1px 5px', flexShrink: 0 }}>
                {isCreature ? 'ENEMY' : 'PC'}
              </div>
            </div>
            <div style={{ color: COLORS.dim, fontSize: 10 }}>d20 {row.roll}{row.modifier ? ` + ${row.modifier}` : ''}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            <IconButton title="Roll action" onClick={() => rollCombatantAction(row)} border="rgba(200,168,74,0.45)" color="#e8c84a">🎲</IconButton>
            <IconButton title="Mark dead" onClick={() => markCombatantDead(row)} disabled={row.status === 'dead'} border="rgba(220,90,70,0.45)" color="#e0a092">☠</IconButton>
            <IconButton title="Remove" onClick={() => removeCombatantFromTracker(row)} border="rgba(220,90,70,0.35)" color="#b98a7f">✕</IconButton>
            {Number(row.tie_breaker || 0) > 0 && <span style={{ color: '#e8c84a', fontSize: 9 }}>{row.tie_breaker}</span>}
            <IconButton title="Vitals / Stamina / Resolve" onClick={() => setVitalsOpen(v => v === row.id ? null : row.id)} border={vitalsOpen === row.id ? 'rgba(224,90,90,0.7)' : 'rgba(224,90,90,0.3)'} color={vitalsOpen === row.id ? '#f08080' : '#c07070'}>♥</IconButton>
            <div style={{ color: '#e8d9a7', fontSize: 18, fontFamily: 'Georgia, serif', minWidth: 22, textAlign: 'right' }}>{row.total}</div>
          </div>
        </div>
        {vitalsOpen === row.id && (
          <VitalsPanel row={row} onClose={() => setVitalsOpen(null)} campaignId={campaignId} />
        )}
      </div>
    );
  })}
</div>
            </div>

            <div className="hercules-panel combat-log-panel" style={panelStyle()}>
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

                <div ref={eventsBottomRef} />
              </div>
            </div>

            <div className="hercules-panel scribe-panel" style={panelStyle()}>
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

              <SectionTitle>Scribe Rulings</SectionTitle>
              {session && (
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input
                    value={manualCombatantName}
                    onChange={event => setManualCombatantName(event.target.value)}
                    onKeyDown={event => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        addManualCombatant();
                      }
                    }}
                    placeholder="Add combatant..."
                    disabled={saving}
                    style={{
                      flex: 1,
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      color: COLORS.text,
                      borderRadius: 6,
                      padding: '7px 9px',
                      fontFamily: 'Georgia, serif',
                      fontSize: 11,
                      outline: 'none',
                    }}
                  />

                  <button
                    type="button"
                    onClick={addManualCombatant}
                    disabled={saving || !manualCombatantName.trim()}
                    style={{
                      ...goldButton(),
                      padding: '7px 9px',
                      opacity: saving || !manualCombatantName.trim() ? 0.45 : 1,
                    }}
                  >
                    Add
                  </button>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 10,
                  flexShrink: 0,
                }}
              >
                <input
                  value={manualLogText}
                  onChange={event => setManualLogText(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      addManualLogEntry();
                    }
                  }}
                  placeholder="Add DM note to combat log..."
                  disabled={!session || saving}
                  style={{
                    flex: 1,
                    background: COLORS.card,
                    border: `1px solid ${COLORS.border}`,
                    color: COLORS.text,
                    borderRadius: 6,
                    padding: '8px 10px',
                    fontFamily: 'Georgia, serif',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />

                <button
                  type="button"
                  onClick={addManualLogEntry}
                  disabled={!session || saving || !manualLogText.trim()}
                  style={{
                    ...goldButton(),
                    opacity: !session || saving || !manualLogText.trim() ? 0.45 : 1,
                    cursor: !session || saving || !manualLogText.trim() ? 'default' : 'pointer',
                  }}
                >
                  Add
                </button>
              </div>

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
                    style={{
                      textAlign: 'left',
                      background: COLORS.card,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 6,
                      color: COLORS.text,
                      padding: '8px 10px',
                      cursor: 'pointer',
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

function initiativeRow(active) {
  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: active ? 'rgba(200,168,74,0.12)' : COLORS.card,
    border: `1px solid ${active ? 'rgba(200,168,74,0.35)' : COLORS.border}`,
    borderRadius: 8,
    padding: '9px 10px',
    marginBottom: 4,
  };
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

function IconButton({ children, title, onClick, disabled = false, border, color }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 24,
        height: 24,
        minWidth: 24,
        padding: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: disabled ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.045)',
        border: `1px solid ${border}`,
        color,
        borderRadius: 5,
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 12,
        lineHeight: 1,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {children}
    </button>
  );
}