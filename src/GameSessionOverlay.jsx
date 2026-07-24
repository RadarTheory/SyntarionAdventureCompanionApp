import { useEffect, useState } from 'react';
import supabase from './lib/supabase';
import { getCheckedInCharacterIds } from './lib/sessionEvents';
import { useActiveGameSession } from './lib/session';
import { useDevice } from './useDevice';
import { GameButton, GamePanel } from './GameUI';
import Elddimgates from './Elddimgates';
import PlayDriftstone from './PlayDriftstone';
import E from './elddimgatesEngine.js';

// ─── GameSessionOverlay ────────────────────────────────────────────────────────
// Lets a DM pull a mini-game into an active Campaign/DM View session as an
// in-fiction moment (a tavern bet, a wager on the docks, etc.) without leaving
// the session. Full-viewport modal, backdrop pattern borrowed from
// HandbookBookmark.jsx; seats can be assigned to the DM, a checked-in
// character, an NPC, or (Elddimgates only) handed to the Scribe to play as an
// AI opponent — Driftstone has no LLM/local-AI hook reachable from outside its
// own iframe, so its seat picker skips the Scribe option.
//
// Assigning a checked-in character to a seat is a real cross-device challenge:
// a `game_lark_matches` row is created and the target player's own CampaignView
// (subscribed via Supabase Realtime, same pattern HerculesPlayer.jsx uses for
// initiative) shows an Accept/Decline toast. Accepting mounts this same
// component in "join mode" (`joinMatch` prop) on the player's device.
//
// For Elddimgates, once accepted both sides share one synced `game_state` row
// (see the `syncKey`/`mySeat`/`isHost` props on <Elddimgates>) — true two-device
// play. Driftstone has no serializable state to sync (it's a static iframe), so
// accepting a Driftstone challenge just confirms readiness; the match itself
// still plays out locally on whichever device hosts it, same as before.
// ─────────────────────────────────────────────────────────────────────────────

const GAMES = [
  { id: 'elddimgates', name: 'Elddimgates', subtitle: 'A game of passage and authority', enabled: true, seated: true, supportsAi: true },
  { id: 'driftstone', name: 'Driftstone', subtitle: 'A two-player strategy of stone and tide', enabled: true, seated: true, supportsAi: false },
];

function seatOptions(characters, npcs, supportsAi) {
  return [
    { key: 'dm', kind: 'dm', label: 'Myself (DM)' },
    ...(supportsAi ? [{ key: 'scribe', kind: 'scribe', label: 'The Scribe (AI plays this seat)' }] : []),
    ...characters.map(c => ({ key: `character:${c.character_id}`, kind: 'character', id: c.character_id, label: c.character_name || 'Unnamed character' })),
    ...npcs.map(n => ({ key: `npc:${n.id}`, kind: 'npc', id: n.id, label: n.name || 'Unnamed NPC' })),
  ];
}

function seatLabel(gameId, seatNum) {
  if (gameId === 'elddimgates') return `Seat ${seatNum} — ${seatNum === 1 ? 'Stone' : 'Gold'}`;
  return `Player ${seatNum}`;
}

// Local-only play (no real player involved): what Elddimgates' seatConfig needs.
function toSeatConfig(option) {
  if (!option) return null;
  const label = option.kind === 'dm' ? 'The DM' : option.kind === 'scribe' ? 'The Scribe' : option.label;
  return { label, aiControlled: option.kind === 'scribe' };
}

// What gets persisted to game_lark_matches.seat_1/seat_2.
function dbSeatShape(option) {
  if (!option) return null;
  return { kind: option.kind, label: toSeatConfig(option).label, character_id: option.kind === 'character' ? option.id : null };
}

// Reconstructs Elddimgates' seatConfig shape from a persisted row's seat_1/seat_2.
function seatConfigFromDbShape(dbSeat) {
  if (!dbSeat) return null;
  return { label: dbSeat.label, aiControlled: dbSeat.kind === 'scribe' };
}

function SeatSelect({ label, options, value, onChange }) {
  return (
    <div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(215,180,90,0.7)', marginBottom: 8 }}>{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%', minHeight: 44, borderRadius: 8, border: '1px solid rgba(215,180,90,0.28)',
          background: '#100c07', color: '#ead9aa', padding: '0 12px', boxSizing: 'border-box', fontSize: 15,
        }}
      >
        <option value="">Choose who plays this seat...</option>
        {options.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function CloseButton({ onClick, isMobile }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute', top: isMobile ? 10 : 18, left: isMobile ? 10 : 18, zIndex: 2,
        border: '1px solid rgba(215,180,90,0.44)', borderRadius: 8,
        background: 'linear-gradient(180deg, rgba(27,21,12,0.96), rgba(8,6,4,0.88))', color: '#d7c79a',
        padding: isMobile ? '9px 12px' : '10px 16px', fontFamily: "'Cinzel', serif", fontSize: isMobile ? 10 : 9,
        fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', cursor: 'pointer',
      }}
    >
      Close
    </button>
  );
}

// Mount this conditionally from the parent (`{showGameLauncher && <GameSessionOverlay .../>}`,
// matching the existing showX + DraggablePanel convention in DMView/CampaignView) rather than
// passing an `open` prop — that way each launch starts from a clean, freshly-mounted state.
//
// Pass `joinMatch` (an accepted game_lark_matches row) instead of campaignId/sessionId to mount
// this in the player's "I accepted a challenge" view — it skips straight to play.
export default function GameSessionOverlay({ onClose, campaignId, sessionId, onToast, joinMatch = null }) {
  const { isMobile } = useDevice();
  const derivedSessionId = useActiveGameSession(campaignId);
  const effectiveSessionId = sessionId || derivedSessionId;
  const [step, setStep] = useState(joinMatch ? 'play' : 'pick');
  const [selectedGame, setSelectedGame] = useState(joinMatch?.game_id || null);
  const [characters, setCharacters] = useState([]);
  const [npcs, setNpcs] = useState([]);
  const [seat1Key, setSeat1Key] = useState('');
  const [seat2Key, setSeat2Key] = useState('');
  const [matchRow, setMatchRow] = useState(null);

  useEffect(() => {
    if (joinMatch) return undefined;
    let cancelled = false;
    (async () => {
      const [checkins, npcResult] = await Promise.all([
        getCheckedInCharacterIds(effectiveSessionId),
        supabase.from('npcs').select('id, name').order('name'),
      ]);
      if (cancelled) return;
      setCharacters(checkins || []);
      if (npcResult?.error) console.warn('[GameSessionOverlay] Failed to load NPCs:', npcResult.error.message);
      setNpcs(npcResult?.data || []);
    })();
    return () => { cancelled = true; };
  }, [effectiveSessionId, joinMatch]);

  // While waiting on a challenge, watch for the target player's response.
  useEffect(() => {
    if (step !== 'waiting' || !matchRow?.id) return undefined;
    const channel = supabase.channel('gamelark-wait-' + matchRow.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_lark_matches' }, (payload) => {
        if (payload.new?.id !== matchRow.id) return;
        setMatchRow(payload.new);
        if (payload.new.status === 'accepted') setStep('play');
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [step, matchRow?.id]);

  const currentGame = GAMES.find(g => g.id === selectedGame);
  const options = seatOptions(characters, npcs, !!currentGame?.supportsAi);
  const seat1 = options.find(o => o.key === seat1Key) || null;
  const seat2 = options.find(o => o.key === seat2Key) || null;
  const canStart = !!seat1 && !!seat2;

  const activeMatch = joinMatch || matchRow;
  const effectiveGame = joinMatch ? joinMatch.game_id : selectedGame;
  const effectiveSeatConfig = activeMatch
    ? { 1: seatConfigFromDbShape(activeMatch.seat_1), 2: seatConfigFromDbShape(activeMatch.seat_2) }
    : { 1: toSeatConfig(seat1), 2: toSeatConfig(seat2) };
  // The DM's own client always controls whichever seat the challenged player
  // didn't take (an NPC/DM/Scribe seat still needs a client driving it, and
  // only the DM has one) — the player's own client controls their assigned seat.
  const mySeat = joinMatch
    ? joinMatch.challenged_seat
    : (matchRow ? (matchRow.challenged_seat === 1 ? 2 : 1) : null);

  const beginMatch = async () => {
    const gameName = currentGame?.name || 'a game';
    const challengedEntry = [[1, seat1], [2, seat2]].find(([, seat]) => seat?.kind === 'character');

    if (!challengedEntry) {
      setStep('play');
      return;
    }

    const [challengedSeatNum, challengedOption] = challengedEntry;
    const { data: match, error } = await supabase.from('game_lark_matches').insert({
      campaign_id: String(campaignId),
      session_id: effectiveSessionId || null,
      game_id: selectedGame,
      seat_1: dbSeatShape(seat1),
      seat_2: dbSeatShape(seat2),
      challenged_character_id: String(challengedOption.id),
      challenged_seat: challengedSeatNum,
      status: 'pending',
      game_state: selectedGame === 'elddimgates' ? E.createGame() : null,
    }).select().single();

    if (error || !match) {
      console.warn('[GameSessionOverlay] Failed to create GameLark challenge:', error?.message);
      onToast?.({ title: 'Challenge Failed', body: 'Could not send the challenge — try again.' });
      return;
    }

    setMatchRow(match);
    onToast?.({
      title: 'Challenge Sent',
      body: `${challengedOption.label} (as ${seatLabel(selectedGame, challengedSeatNum)}) has been challenged to ${gameName}. Waiting for a response...`,
    });
    setStep('waiting');
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 300000, background: 'rgba(10,7,4,0.68)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', display: 'grid', placeItems: 'center', padding: isMobile ? 8 : 24, boxSizing: 'border-box' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative', width: '100%', height: '100%', maxWidth: 1400, maxHeight: '100%',
          borderRadius: 16, overflow: 'auto', border: '1px solid rgba(215,180,90,0.3)',
          boxShadow: '0 40px 140px rgba(0,0,0,0.75)', background: '#0a0704',
        }}
      >
        {step === 'play' && effectiveGame === 'elddimgates' ? (
          <Elddimgates
            embedded
            seatConfig={effectiveSeatConfig}
            syncKey={activeMatch?.id || null}
            mySeat={mySeat}
            isHost={!joinMatch}
            onExit={onClose}
          />
        ) : step === 'play' && effectiveGame === 'driftstone' && !joinMatch ? (
          <PlayDriftstone onHome={onClose} onToast={onToast} />
        ) : step === 'play' && effectiveGame === 'driftstone' && joinMatch ? (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', padding: 24, boxSizing: 'border-box', textAlign: 'center', fontFamily: 'Georgia, serif' }}>
            <CloseButton onClick={onClose} isMobile={isMobile} />
            <div style={{ maxWidth: 360 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e8c84a', marginBottom: 12 }}>Challenge Accepted</div>
              <p style={{ color: 'rgba(235,220,178,0.72)', fontStyle: 'italic', lineHeight: 1.5 }}>
                Driftstone plays out on one shared screen — let your DM know you're ready, and they'll bring up the board.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ height: '100%', overflowY: 'auto', padding: isMobile ? '48px 16px 24px' : '56px 40px 40px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}>
            <CloseButton onClick={onClose} isMobile={isMobile} />

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(215,180,90,0.72)', marginBottom: 8 }}>
                Call a Game to the Table
              </div>
              <h1 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: '#f0dfad', fontSize: 'clamp(24px, 4vw, 36px)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                {step === 'pick' ? 'Choose a Game' : step === 'waiting' ? 'Challenge Sent' : 'Assign the Seats'}
              </h1>
            </div>

            {step === 'pick' && (
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 700, margin: '0 auto' }}>
                {GAMES.map(game => (
                  <button
                    key={game.id}
                    type="button"
                    disabled={!game.enabled}
                    onClick={() => { setSelectedGame(game.id); setStep(game.seated ? 'seats' : 'play'); }}
                    style={{
                      width: 260, minHeight: 140, padding: 20, borderRadius: 12, textAlign: 'left',
                      border: `1px solid ${game.enabled ? 'rgba(215,180,90,0.34)' : 'rgba(215,180,90,0.14)'}`,
                      background: game.enabled ? 'linear-gradient(150deg, rgba(240,238,235,0.05), rgba(9,7,4,0.88))' : 'rgba(20,16,10,0.5)',
                      cursor: game.enabled ? 'pointer' : 'default', opacity: game.enabled ? 1 : 0.5,
                      color: '#d9c9a4', position: 'relative',
                    }}
                  >
                    {!game.enabled && (
                      <span style={{ position: 'absolute', top: 10, right: 10, fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(232,210,142,0.7)', border: '1px solid rgba(215,180,90,0.32)', borderRadius: 999, padding: '3px 8px' }}>
                        Coming Soon
                      </span>
                    )}
                    <div style={{ fontFamily: "'Cinzel', serif", color: '#ead9aa', fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>{game.name}</div>
                    <div style={{ fontSize: 13, fontStyle: 'italic', color: 'rgba(235,220,178,0.55)', lineHeight: 1.45 }}>{game.subtitle}</div>
                  </button>
                ))}
              </div>
            )}

            {step === 'seats' && (
              <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <GamePanel style={{ display: 'grid', gap: 20 }}>
                  <SeatSelect label={seatLabel(selectedGame, 1)} options={options} value={seat1Key} onChange={setSeat1Key} />
                  <SeatSelect label={seatLabel(selectedGame, 2)} options={options} value={seat2Key} onChange={setSeat2Key} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <GameButton variant="secondary" onClick={() => setStep('pick')}>Back</GameButton>
                    <GameButton variant="primary" full disabled={!canStart} onClick={beginMatch}>Begin Match</GameButton>
                  </div>
                </GamePanel>
              </div>
            )}

            {step === 'waiting' && (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <GamePanel style={{ textAlign: 'center' }}>
                  {matchRow?.status === 'declined' ? (
                    <>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e0a092', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Challenge Declined</div>
                      <p style={{ color: 'rgba(235,220,178,0.62)', fontStyle: 'italic', marginBottom: 18 }}>They're not up for it right now.</p>
                      <GameButton variant="secondary" full onClick={() => { setMatchRow(null); setStep('seats'); }}>Back to Seats</GameButton>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, color: '#e8c84a', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Waiting for a Response</div>
                      <p style={{ color: 'rgba(235,220,178,0.62)', fontStyle: 'italic', marginBottom: 18 }}>The board opens automatically once they accept.</p>
                      <GameButton variant="secondary" full onClick={() => { setMatchRow(null); setStep('seats'); }}>Cancel</GameButton>
                    </>
                  )}
                </GamePanel>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
