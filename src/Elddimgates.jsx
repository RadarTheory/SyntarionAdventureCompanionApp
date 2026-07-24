import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import E from './elddimgatesEngine.js';
import supabase from './lib/supabase';
import { GameButton, GameBackButton } from './GameUI';
import { chooseScribeElddimgatesAction } from './lib/scribeSeat';
import { describeAction } from './lib/elddimgatesDescribe';
import { recordLotjarrsGameResult } from './gameStats';

const CELL = 68;
const CH = 12;
const PITCH = CELL + CH;
const BOARD = 7 * CELL + 8 * CH;
const GOLD = '#d7b45a';

const PLAYERS = {
  1: { name: 'Stone', council: 'Stone Council', className: 'stone' },
  2: { name: 'Gold', council: 'Gold Council', className: 'gold' },
};

const PIECE_META = {
  consul: { label: 'Consul', role: 'Voice of the City', letter: 'C' },
  praetor: { label: 'Praetor', role: 'Commander', letter: 'P' },
  legionary: { label: 'Legionary', role: 'The Line', letter: 'L' },
  magister: { label: 'Magister', role: 'The Attuned', letter: 'M' },
  artifex: { label: 'Artifex', role: 'Engineer', letter: 'A' },
  envoy: { label: 'Envoy', role: 'Diplomat', letter: 'E' },
  warden: { label: 'Warden', role: 'Keeper of Keys', letter: 'W' },
};

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const COLORWAY = { 1: 'stone', 2: 'gold' };
const keyOf = (f, r) => f + ',' + r;
const tokenSrc = (piece) => `/elddimgates/${piece.type}-${COLORWAY[piece.owner]}.png`;
const coord = (p) => FILES[p.f] + (p.r + 1);
const cap = (value) => String(value || '').replace(/^./, c => c.toUpperCase());
const MATCH_MODES = {
  ai: { label: 'Play AI', detail: 'Take Stone against an automated Gold council.' },
  local: { label: 'Local Duel', detail: 'Two players share this device and pass the board.' },
  challenge: { label: 'Challenge Player', detail: 'Players claim seats, mark ready, and begin when both agree.' },
};
const AI_PLAYER = 2;

function actionScore(state, action) {
  let score = Math.random() * 0.25;
  if (action.type === 'move') {
    const piece = state.pieces[keyOf(action.from.f, action.from.r)];
    const target = state.pieces[keyOf(action.to.f, action.to.r)];
    if (target) score += target.type === 'consul' ? 100 : 8;
    if (piece?.type === 'consul') score += action.to.r <= 1 ? 4 : 0;
    if (action.to.f === 3 && action.to.r === 0) score += piece?.type === 'consul' ? 80 : 0;
    if (action.to.f === 3 && action.to.r === 3) score += 3;
  }
  if (action.type === 'place') score += 1.2;
  if (action.type === 'rotate') score += 0.8;
  return score;
}

function chooseAiAction(state) {
  const actions = E.getLegalActions(state);
  if (!actions.length) return null;
  return [...actions].sort((a, b) => actionScore(state, b) - actionScore(state, a))[0];
}


function cellXY(f, r, pov) {
  const vf = pov === 2 ? 6 - f : f;
  const vr = pov === 2 ? r : 6 - r;
  return { x: CH + vf * PITCH, y: CH + vr * PITCH };
}

function hingeXY(hx, hy, pov) {
  const vf = pov === 2 ? 7 - hx : hx;
  const vr = pov === 2 ? hy : 7 - hy;
  return { x: vf * PITCH + CH / 2, y: vr * PITCH + CH / 2 };
}

function ActionButton({ active, disabled, danger, children, onClick, title }) {
  return (
    <GameButton variant={danger ? 'danger' : 'secondary'} active={active} disabled={disabled} onClick={onClick} title={title} style={{ minHeight: 36 }}>
      {children}
    </GameButton>
  );
}

// Scales the board to fit whatever width is actually available (phones,
// split-screen, etc.) instead of relying on the frame's scroll-to-see-more.
function useBoardScale(boardSize) {
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const compute = () => {
      const available = el.clientWidth;
      if (!available) return;
      setScale(Math.min(1, available / boardSize));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener('resize', compute);
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); };
  }, [boardSize]);
  return [wrapRef, scale];
}

function Token({ piece, x, y, selected, threatened, onClick }) {
  const [failed, setFailed] = useState(false);
  const meta = PIECE_META[piece.type] || { label: piece.type, letter: '?' };
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className={'eg-token ' + PLAYERS[piece.owner].className + (selected ? ' selected' : '') + (threatened ? ' threatened' : '')} style={{ left: x + 4, top: y + 4 }} title={`${PLAYERS[piece.owner].name} ${meta.label} - ${meta.role}`}>
      <span className="eg-token-core">
        {failed ? <span className="eg-token-fallback">{meta.letter}</span> : <img src={tokenSrc(piece)} alt={meta.label} draggable={false} onError={() => setFailed(true)} />}
      </span>
    </button>
  );
}

function Gate({ gate, pov, legalRotate, onRotate }) {
  const { x, y } = hingeXY(gate.hinge.x, gate.hinge.y, pov);
  const horizontal = gate.orientation === 'h';
  const len = 2 * CELL + CH;
  return (
    <button type="button" className={'eg-gate ' + PLAYERS[gate.owner].className + (legalRotate ? ' rotatable' : '')} onClick={legalRotate ? onRotate : undefined} disabled={!legalRotate} title={legalRotate ? 'Rotate gate' : `${PLAYERS[gate.owner].name} ${cap(gate.kind)} Gate`} style={{ left: horizontal ? x - len / 2 : x - CH / 2, top: horizontal ? y - CH / 2 : y - len / 2, width: horizontal ? len : CH, height: horizontal ? CH : len }}>
      <span className="eg-hinge" />
    </button>
  );
}

function ReserveGate({ gate, selected, onClick }) {
  return <button type="button" className={'eg-reserve-gate ' + PLAYERS[gate.owner].className + (selected ? ' selected' : '')} onClick={onClick}><span>{cap(gate.kind)}</span><small>{gate.id.toUpperCase()}</small></button>;
}

function LogPanel({ log }) {
  const recent = [...(log || [])].slice(-6).reverse();
  return (
    <div className="eg-panel eg-log-panel">
      <div className="eg-panel-title">Record</div>
      {recent.length ? recent.map((entry, index) => <div key={index} className="eg-log-row"><span>{entry.turn}</span><b>{PLAYERS[entry.player]?.name || 'Council'}</b><em>{describeAction(entry.action)}{entry.charter ? ' - Charter' : ''}</em></div>) : <div className="eg-empty">No moves recorded.</div>}
    </div>
  );
}

function SeatCard({ player, value, ready, onName, onReady, locked }) {
  return (
    <div className={'eg-seat-card ' + PLAYERS[player].className + (ready ? ' ready' : '')}>
      <div className="eg-seat-top"><span>Player {player}</span><b>{PLAYERS[player].name}</b></div>
      <input value={value || ''} onChange={(event) => onName(event.target.value)} disabled={locked} placeholder="Claim seat..." />
      <GameButton variant={ready ? 'primary' : 'secondary'} full disabled={!value || locked} onClick={onReady} style={{ marginTop: 9 }}>{ready ? 'Ready' : 'Mark Ready'}</GameButton>
    </div>
  );
}

function HowToPlayPanel() {
  const rules = [
    ['Goal', 'Reach the opposing High Gate or leave the enemy Consul with no legal reply.'],
    ['Turns', 'Move a council piece, exchange with an Envoy, place a reserve gate, or rotate a placed gate.'],
    ['Gates', 'Gates block channels. Your Consul may pass through your own gates.'],
    ['Grand Square', 'Control d4 to rotate enemy gates. Gold can spend Charter for a chained gate action.'],
  ];
  return (
    <div className="eg-howto eg-menu-codex">
      <div className="eg-panel-title">Rules Codex</div>
      <div className="eg-howto-grid">
        {rules.map(([title, body], i) => (
          <section key={title}>
            <span>{String(i + 1).padStart(2, '0')}</span>
            <b>{title}</b>
            <p>{body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}

function ElddimgatesMenu({ onExit, mode, setMode, seats, ready, setSeat, toggleReady, startMatch }) {
  const challengeReady = !!seats[1] && !!seats[2] && ready[1] && ready[2];
  const canStart = mode === 'challenge' ? challengeReady : true;
  const modeEntries = Object.entries(MATCH_MODES);
  const activeIndex = Math.max(0, modeEntries.findIndex(([id]) => id === mode));
  const activeMode = MATCH_MODES[mode];
  const seatRows = mode === 'challenge'
    ? [
        ['Stone', seats[1] || 'Unclaimed', ready[1] ? 'Ready' : 'Waiting'],
        ['Gold', seats[2] || 'Unclaimed', ready[2] ? 'Ready' : 'Waiting'],
      ]
    : [
        ['Stone', mode === 'ai' ? 'You' : 'Player 1', 'Active'],
        ['Gold', mode === 'ai' ? 'Elddimgates AI' : 'Player 2', mode === 'ai' ? 'Automated' : 'Active'],
      ];

  return (
    <div className="eg-shell eg-menu-shell">
      <style>{styles}</style>
      <GameBackButton onClick={onExit} />
      <div className="eg-menu-bg" aria-hidden="true"><span /><span /><span /></div>

      <header className="eg-menu-hero">
        <div className="eg-kicker">A Game of the Divided City</div>
        <h1>Elddimgates</h1>
        <p>Choose a table. Claim a council. Open the gates.</p>
      </header>

      <main className="eg-menu-stage">
        <section className="eg-menu-card eg-mode-card">
          <div className="eg-panel-title">Select Table</div>
          <div className="eg-mode-list" role="tablist" aria-label="Match type">
            {modeEntries.map(([id, item], index) => (
              <button key={id} type="button" className={'eg-mode-option' + (mode === id ? ' active' : '')} onClick={() => { setMode(id); if (id === 'challenge') { setSeat(1, ''); setSeat(2, ''); } }}>
                <i>{String(index + 1).padStart(2, '0')}</i>
                <span>{item.label}</span>
                <em>{item.detail}</em>
              </button>
            ))}
          </div>
        </section>

        <section className="eg-menu-card eg-command-card">
          <div className="eg-command-orbit" aria-hidden="true"><span /><span /><span /></div>
          <div className="eg-panel-title">Table Locked</div>
          <div className="eg-selected-mode"><span>{String(activeIndex + 1).padStart(2, '0')}</span><b>{activeMode.label}</b><em>{activeMode.detail}</em></div>
          <div className="eg-council-ledger">
            {seatRows.map(([side, name, state]) => <div key={side}><b>{side}</b><span>{name}</span><em>{state}</em></div>)}
          </div>
          {mode === 'challenge' && (
            <div className="eg-seat-grid">
              <SeatCard player={1} value={seats[1]} ready={ready[1]} locked={false} onName={(name) => setSeat(1, name)} onReady={() => toggleReady(1)} />
              <SeatCard player={2} value={seats[2]} ready={ready[2]} locked={false} onName={(name) => setSeat(2, name)} onReady={() => toggleReady(2)} />
            </div>
          )}
          <p className="eg-checkin-note">{mode === 'challenge' ? 'Both councils must claim seats and mark ready before the gates open.' : 'This mode begins immediately with the councils shown above.'}</p>
          <GameButton variant="primary" full disabled={!canStart} onClick={startMatch} style={{ marginTop: 16, minHeight: 50, borderRadius: 12 }}>{mode === 'challenge' ? 'Begin Challenge' : 'Begin Match'}</GameButton>
        </section>

        <HowToPlayPanel />
      </main>
      <footer className="eg-footer">Syntarion - Games of Soteria</footer>
    </div>
  );
}

export default function Elddimgates({ onExit, embedded = false, seatConfig = null, syncKey = null, mySeat = null, isHost = false }) {
  const [matchStarted, setMatchStarted] = useState(!!seatConfig);
  const [matchMode, setMatchMode] = useState('ai');
  const [seats, setSeats] = useState(() => (seatConfig
    ? { 1: seatConfig[1]?.label || 'Stone Council', 2: seatConfig[2]?.label || 'Gold Council' }
    : { 1: 'Player', 2: 'Elddimgates AI' }));
  const [ready, setReady] = useState({ 1: !!seatConfig, 2: !!seatConfig });
  const [state, setState] = useState(() => E.createGame());
  const [selected, setSelected] = useState(null);
  const [gateMode, setGateMode] = useState(null);
  const [charterArmed, setCharterArmed] = useState(false);
  const [pendingMain, setPendingMain] = useState(null);
  const [autoFlip, setAutoFlip] = useState(true);
  const [manualPov, setManualPov] = useState(1);
  const [message, setMessage] = useState('Select a council piece or place a reserve gate.');
  const recordedResultRef = useRef(null);

  const setSeat = (player, name) => {
    setSeats(prev => ({ ...prev, [player]: name }));
    setReady(prev => ({ ...prev, [player]: false }));
  };

  const toggleReady = (player) => setReady(prev => ({ ...prev, [player]: !prev[player] }));

  const resetGameState = () => {
    setState(E.createGame());
    setSelected(null);
    setGateMode(null);
    setCharterArmed(false);
    setPendingMain(null);
    setAutoFlip(true);
    setManualPov(1);
    setMessage('Select a council piece or place a reserve gate.');
  };

  const startMatch = () => {
    resetGameState();
    if (matchMode === 'ai') {
      setSeats({ 1: 'Player', 2: 'Elddimgates AI' });
      setReady({ 1: true, 2: true });
    } else if (matchMode === 'local') {
      setSeats({ 1: 'Player 1', 2: 'Player 2' });
      setReady({ 1: true, 2: true });
    }
    setMatchStarted(true);
  };

  // Networked mode (a GameLark challenge was accepted): the match's game_state
  // in Supabase is the single source of truth. Load it once, then subscribe to
  // remote updates; every local move is written back via applyAndSync below
  // instead of only touching local state, so both seats' clients stay in sync.
  useEffect(() => {
    if (!syncKey) return undefined;
    let cancelled = false;
    supabase.from('game_lark_matches').select('game_state').eq('id', syncKey).maybeSingle()
      .then(({ data }) => { if (!cancelled && data?.game_state) setState(data.game_state); });
    const channel = supabase.channel('gamelark-match-' + syncKey)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_lark_matches' }, (payload) => {
        if (payload.new?.id !== syncKey || !payload.new?.game_state) return;
        setState(payload.new.game_state);
      })
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [syncKey]);

  const applyAndSync = useCallback((next) => {
    setState(next);
    if (syncKey) {
      supabase.from('game_lark_matches').update({ game_state: next, updated_at: new Date().toISOString() }).eq('id', syncKey);
    }
  }, [syncKey]);

  const [boardWrapRef, boardScale] = useBoardScale(BOARD);
  const legal = useMemo(() => E.getLegalActions(state), [state]);
  const charterOptions = useMemo(() => pendingMain ? E.getLegalCharterActions(state) : [], [pendingMain, state]);
  const pov = autoFlip ? state.toMove : manualPov;
  const ended = state.status.phase === 'ended';
  const inCheck = E.isCheck(state, state.toMove);
  const selectedPiece = selected ? state.pieces[keyOf(selected.f, selected.r)] : null;
  const enemyAttacks = useMemo(() => E.attackedSquares(state, state.toMove === 1 ? 2 : 1), [state]);

  const pieceMoves = selected ? legal.filter(a => (a.type === 'move' || a.type === 'exchange') && a.from.f === selected.f && a.from.r === selected.r) : [];
  const placements = gateMode ? legal.filter(a => a.type === 'place' && a.gateId === gateMode) : [];
  const moveTargets = Object.fromEntries((pendingMain ? [] : pieceMoves).map(a => [keyOf(a.to.f, a.to.r), a]));
  const currentReserve = pendingMain ? state.gates.filter(g => !g.placed && g.owner === 2) : state.gates.filter(g => !g.placed && g.owner === state.toMove);
  const activePlacements = pendingMain ? charterOptions.filter(a => a.type === 'place' && a.gateId === gateMode) : placements;
  const activeRotations = pendingMain ? charterOptions : legal;
  const placedGates = state.gates.filter(g => g.placed);
  const selectedGate = gateMode ? state.gates.find(g => g.id === gateMode) : null;

  const statusText = ended ? (state.status.winner ? `${PLAYERS[state.status.winner].name} wins by ${state.status.reason === 'passage' ? 'Passage' : 'Political Victory'}` : `Draw - ${state.status.reason}`) : pendingMain ? 'Charter pending - choose one unanswered gate action' : `${PLAYERS[state.toMove].council} to move${inCheck ? ' - CHECK' : ''}`;

  useEffect(() => {
    if (!matchStarted || !ended) {
      if (!ended) recordedResultRef.current = null;
      return;
    }
    const key = `${state.turn}:${state.status.winner || 'draw'}:${state.status.reason}`;
    if (recordedResultRef.current === key) return;
    recordedResultRef.current = key;
    recordLotjarrsGameResult('elddimgates', {
      playerName: state.status.winner ? (seats[state.status.winner] || PLAYERS[state.status.winner].name) : 'Draw',
      outcome: state.status.winner ? 'win' : 'draw',
      score: state.status.winner ? 1 : 0,
      scoreLabel: state.status.winner ? (state.status.reason === 'passage' ? 'Passage' : 'Political') : state.status.reason,
      meta: { mode: matchMode, reason: state.status.reason },
    });
  }, [matchStarted, ended, state.turn, state.status.winner, state.status.reason, seats, matchMode]);

  const seatAiControlled = !!seatConfig?.[state.toMove]?.aiControlled;
  const aiTurn = matchStarted && !ended && !pendingMain && ((matchMode === 'ai' && state.toMove === AI_PLAYER) || seatAiControlled);
  // Hotseat (no syncKey): whoever's at this device can act for either seat.
  // Networked: only the client whose mySeat matches the side to move may act.
  const humanTurn = !aiTurn && (syncKey ? mySeat === state.toMove : true);

  useEffect(() => {
    if (!aiTurn) return undefined;
    // When networked, only the host drives AI/Scribe seats — the Scribe has
    // no client of its own, so letting both sides fire this would double-move.
    if (syncKey && !isHost) return undefined;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const action = seatAiControlled
        ? (await chooseScribeElddimgatesAction(state, legal, seats[state.toMove])) || chooseAiAction(state)
        : chooseAiAction(state);
      if (cancelled || !action) return;
      try {
        const next = E.applyAction(state, action);
        applyAndSync(next);
        setMessage((seatAiControlled ? `${seats[state.toMove]}: ` : 'AI: ') + describeAction(action));
      } catch (err) {
        setMessage(err?.message || 'AI could not find a legal action.');
      }
      setSelected(null);
      setGateMode(null);
      setCharterArmed(false);
    }, 650);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [aiTurn, state, seatAiControlled, seats, legal, syncKey, isHost, applyAndSync]);

  if (!matchStarted) {
    return <ElddimgatesMenu onExit={onExit} mode={matchMode} setMode={setMatchMode} seats={seats} ready={ready} setSeat={setSeat} toggleReady={toggleReady} startMatch={startMatch} />;
  }


  const commit = (action) => {
    if (!action || ended || !humanTurn) return;
    if (charterArmed && state.toMove === 2 && state.charterAvailable && !pendingMain) {
      setPendingMain(action);
      setSelected(null);
      setGateMode(null);
      setMessage('Charter armed. Choose a gate placement or rotation to attach.');
      return;
    }
    try {
      const next = pendingMain ? E.applyAction(state, { ...pendingMain, charter: action }) : E.applyAction(state, action);
      applyAndSync(next);
      setMessage(describeAction(action));
    } catch (err) {
      setMessage(err?.message || 'That action is not legal.');
    }
    setSelected(null);
    setGateMode(null);
    setCharterArmed(false);
    setPendingMain(null);
  };

  const cancelIntent = () => {
    setSelected(null);
    setGateMode(null);
    setCharterArmed(false);
    setPendingMain(null);
    setMessage('Intent cleared.');
  };

  const squares = [];
  for (let f = 0; f < 7; f++) for (let r = 0; r < 7; r++) squares.push({ f, r });

  return (
    <div className="eg-shell">
      <style>{styles}</style>
      <GameBackButton onClick={onExit} label={embedded ? 'Close' : 'Back to Bag'} />

      <header className="eg-header">
        <div>
          <div className="eg-kicker">A Game of the Divided City</div>
          <h1>Elddimgates</h1>
          <p>Passage, authority, and the roads between.</p>
        </div>
        <div className="eg-status-card"><span>Turn {state.turn}</span><strong>{statusText}</strong><em>{aiTurn ? 'The AI is considering the channels.' : message}</em></div>
      </header>

      <main className="eg-layout">
        <aside className="eg-side">
          <div className="eg-panel eg-council-panel">
            <div className="eg-panel-title">Seat of Authority</div>
            <div className={'eg-turn-orb ' + PLAYERS[state.toMove].className}>{PLAYERS[state.toMove].name}</div>
            <div className="eg-stat-grid"><span>Stone<b>{seats[1]}</b></span><span>Gold<b>{seats[2]}</b></span><span>Legal actions<b>{legal.length}</b></span><span>Dead council<b>{state.deadCouncil}</b></span><span>Charter<b>{state.charterAvailable ? 'Ready' : 'Spent'}</b></span></div>
          </div>

          <div className="eg-panel">
            <div className="eg-panel-title">Reserve Gates</div>
            <div className="eg-reserve-list">
              {currentReserve.length ? currentReserve.map(gate => <ReserveGate key={gate.id} gate={gate} selected={gateMode === gate.id} onClick={() => { if (!humanTurn) return; setGateMode(gateMode === gate.id ? null : gate.id); setSelected(null); setMessage(`${cap(gate.kind)} gate selected.`); }} />) : <div className="eg-empty">No reserve gates.</div>}
            </div>
          </div>

          <div className="eg-panel">
            <div className="eg-panel-title">Command</div>
            <div className="eg-command-stack">
              <ActionButton active={charterArmed} disabled={!humanTurn || state.toMove !== 2 || !state.charterAvailable || ended || pendingMain} onClick={() => setCharterArmed(v => !v)}>{charterArmed ? 'Charter Armed' : 'Invoke Charter'}</ActionButton>
              <ActionButton active={autoFlip} onClick={() => { setAutoFlip(v => !v); setManualPov(pov); }}>{autoFlip ? 'Auto-Flip On' : 'Auto-Flip Off'}</ActionButton>
              {!autoFlip && <ActionButton onClick={() => setManualPov(v => v === 1 ? 2 : 1)}>Flip Board</ActionButton>}
              <ActionButton danger disabled={!humanTurn} onClick={cancelIntent}>Clear Intent</ActionButton>
              {ended && !syncKey && <ActionButton active onClick={() => { setState(E.createGame()); cancelIntent(); }}>New Game</ActionButton>}
            </div>
          </div>
        </aside>

        <section className="eg-board-wrap">
          <div className="eg-board-title"><span>{selectedPiece ? `${PLAYERS[selectedPiece.owner].name} ${PIECE_META[selectedPiece.type].label}` : selectedGate ? `${PLAYERS[selectedGate.owner].name} ${cap(selectedGate.kind)} Gate` : 'The City is Open'}</span><b>{pendingMain ? 'Charter action required' : inCheck ? 'Consul in check' : 'Grand Square d4'}</b></div>
          <div className="eg-board-frame">
            <div className="eg-board-scaler" ref={boardWrapRef}>
            <div className="eg-board-sizer" style={{ width: BOARD * boardScale, height: BOARD * boardScale }}>
            <div className="eg-board" style={{ width: BOARD, height: BOARD, transform: `scale(${boardScale})` }}>
              <div className="eg-board-grid" />
              {squares.map(({ f, r }) => {
                const { x, y } = cellXY(f, r, pov);
                const key = keyOf(f, r);
                const target = moveTargets[key];
                const piece = state.pieces[key];
                const grand = f === 3 && r === 3;
                const high = f === 3 && (r === 0 || r === 6);
                const attacked = enemyAttacks[key];
                return <button type="button" key={key} className={'eg-square ' + ((f + r) % 2 === 0 ? 'light' : 'dark') + (grand ? ' grand' : '') + (high ? ' high' : '') + (target ? ' target' : '') + (attacked ? ' attacked' : '')} style={{ left: x, top: y, width: CELL, height: CELL }} onClick={() => { if (ended || !humanTurn) return; if (target) return commit(target); if (!pendingMain && piece && piece.owner === state.toMove) { setSelected({ f, r }); setGateMode(null); setMessage(`${PLAYERS[piece.owner].name} ${PIECE_META[piece.type].label} at ${coord({ f, r })}.`); } else { setSelected(null); } }}><span className="eg-square-label">{FILES[f]}{r + 1}</span></button>;
              })}

              {activePlacements.map((a, i) => {
                const { x, y } = hingeXY(a.hinge.x, a.hinge.y, pov);
                const horizontal = a.orientation === 'h';
                const len = 2 * CELL + CH;
                return <button type="button" key={`${a.gateId}-${i}`} className="eg-placement" onClick={() => humanTurn && commit(a)} style={{ left: horizontal ? x - len / 2 : x - CH / 2, top: horizontal ? y - CH / 2 : y - len / 2, width: horizontal ? len : CH, height: horizontal ? CH : len }} title="Place gate here" />;
              })}

              {placedGates.map(gate => {
                const rotAction = activeRotations.find(a => a.type === 'rotate' && a.gateId === gate.id);
                return <Gate key={gate.id} gate={gate} pov={pov} legalRotate={humanTurn && !!rotAction && !ended} onRotate={() => commit(rotAction)} />;
              })}

              {Object.entries(state.pieces).map(([key, piece]) => {
                const [f, r] = key.split(',').map(Number);
                const { x, y } = cellXY(f, r, pov);
                const own = humanTurn && piece.owner === state.toMove && !ended && !pendingMain;
                const selectedHere = selected && selected.f === f && selected.r === r;
                return <Token key={key} piece={piece} x={x} y={y} selected={selectedHere} threatened={piece.type === 'consul' && E.isCheck(state, piece.owner)} onClick={own ? () => { setSelected({ f, r }); setGateMode(null); setMessage(`${PLAYERS[piece.owner].name} ${PIECE_META[piece.type].label} selected.`); } : undefined} />;
              })}
            </div>
            </div>
            </div>
          </div>
        </section>

        <aside className="eg-side right">
          <div className="eg-panel"><div className="eg-panel-title">Quick Reference</div><div className="eg-reference"><p><b>Passage:</b> move your Consul onto the enemy High Gate.</p><p><b>Political:</b> checkmate the opposing Consul.</p><p><b>Grand Square:</b> holding d4 lets you rotate enemy gates.</p><p><b>Sealing:</b> no gate may close every route for either Consul.</p></div></div>
          <LogPanel log={state.log} />
          {embedded ? (
            <GameButton variant="secondary" full onClick={onExit}>Close Game</GameButton>
          ) : (
            <GameButton variant="secondary" full onClick={() => setMatchStarted(false)}>Return to Game Menu</GameButton>
          )}
        </aside>
      </main>
      <footer className="eg-footer">Syntarion - Games of Soteria</footer>
    </div>
  );
}

const styles = `
.eg-shell { min-height: 100vh; background: radial-gradient(circle at 50% 8%, rgba(80,58,22,0.18), transparent 34%), linear-gradient(180deg, #100b06 0%, #050403 100%); color: #d6c7a5; font-family: Georgia, serif; padding: 24px clamp(14px, 2vw, 34px) 42px; box-sizing: border-box; position: relative; overflow-x: hidden; }
.eg-header { max-width: 1280px; margin: 0 auto 18px; min-height: 92px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding-left: 86px; }
.eg-kicker, .eg-panel-title { font-family: 'Cinzel', serif; color: rgba(215,180,90,0.72); font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase; }
.eg-header h1 { margin: 3px 0 4px; font-family: 'Cinzel', serif; color: #f0dfad; font-size: clamp(28px, 4vw, 44px); letter-spacing: 0.2em; text-transform: uppercase; text-shadow: 0 0 28px rgba(215,180,90,0.15); }
.eg-header p { margin: 0; color: rgba(235,220,178,0.55); font-style: italic; font-size: 13px; }
.eg-status-card { min-width: 310px; border: 1px solid rgba(215,180,90,0.24); border-radius: 12px; padding: 13px 16px; background: linear-gradient(145deg, rgba(240,238,235,0.05), rgba(10,8,5,0.78)); box-shadow: inset 0 1px 0 rgba(255,244,204,0.08), 0 16px 40px rgba(0,0,0,0.35); }
.eg-status-card span { display: block; font-family: 'Cinzel', serif; font-size: 8px; letter-spacing: 0.18em; color: rgba(215,180,90,0.62); text-transform: uppercase; }
.eg-status-card strong { display: block; margin-top: 5px; color: #f0dfad; font-family: 'Cinzel', serif; font-size: 13px; letter-spacing: 0.09em; text-transform: uppercase; }
.eg-status-card em { display: block; margin-top: 5px; color: rgba(235,220,178,0.62); font-size: 12px; }
.eg-layout { max-width: 1280px; margin: 0 auto; display: grid; grid-template-columns: minmax(210px, 250px) minmax(590px, 1fr) minmax(220px, 260px); gap: 18px; align-items: start; }
.eg-side { display: grid; gap: 12px; }
.eg-panel { border: 1px solid rgba(215,180,90,0.2); border-radius: 12px; background: linear-gradient(160deg, rgba(240,238,235,0.045), rgba(11,8,5,0.82)); box-shadow: 0 18px 40px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,244,204,0.06); padding: 14px; }
.eg-panel-title { margin-bottom: 12px; }
.eg-turn-orb { height: 72px; border-radius: 10px; display: grid; place-items: center; font-family: 'Cinzel', serif; font-size: 18px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; border: 1px solid rgba(215,180,90,0.28); background: radial-gradient(circle, rgba(215,180,90,0.12), rgba(8,6,4,0.86) 72%); }
.eg-turn-orb.stone { color: #efeee7; box-shadow: inset 0 0 24px rgba(255,255,255,0.055); }
.eg-turn-orb.gold { color: #f4ce64; box-shadow: inset 0 0 24px rgba(215,180,90,0.1); }
.eg-stat-grid { display: grid; grid-template-columns: 1fr; gap: 7px; margin-top: 12px; }
.eg-stat-grid span { display: flex; justify-content: space-between; color: rgba(235,220,178,0.52); font-size: 12px; }
.eg-stat-grid b { color: #ead9aa; font-weight: 700; }
.eg-reserve-list, .eg-command-stack { display: grid; gap: 8px; }
.eg-reserve-gate { min-height: 36px; border-radius: 8px; border: 1px solid rgba(215,180,90,0.24); color: #d8c797; background: linear-gradient(180deg, rgba(30,23,12,0.88), rgba(9,7,5,0.9)); cursor: pointer; font-family: 'Cinzel', serif; text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; box-shadow: inset 0 1px 0 rgba(255,244,204,0.06); display: flex; align-items: center; justify-content: space-between; padding: 0 12px; touch-action: manipulation; }
.eg-reserve-gate small { opacity: 0.48; }
.eg-reserve-gate.selected { border-color: rgba(244,206,100,0.84); color: #f4ce64; box-shadow: 0 0 22px rgba(215,180,90,0.13), inset 0 1px 0 rgba(255,244,204,0.16); }
.eg-board-wrap { min-width: 0; }
.eg-board-title { display: flex; justify-content: space-between; align-items: baseline; gap: 18px; margin: 0 0 10px; padding: 0 4px; }
.eg-board-title span { font-family: 'Cinzel', serif; color: #f0dfad; letter-spacing: 0.12em; text-transform: uppercase; font-size: 12px; }
.eg-board-title b { color: rgba(215,180,90,0.62); font-size: 11px; font-weight: 400; font-style: italic; }
.eg-board-frame { overflow: hidden; padding: 18px; border-radius: 18px; border: 1px solid rgba(215,180,90,0.2); background: radial-gradient(circle at 50% 42%, rgba(215,180,90,0.08), transparent 64%), linear-gradient(150deg, rgba(38,29,14,0.86), rgba(7,5,3,0.95)); box-shadow: 0 30px 80px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,244,204,0.06); }
.eg-board-scaler { width: 100%; display: flex; justify-content: center; }
.eg-board-sizer { margin: 0 auto; }
.eg-board { position: relative; background: #070604; border-radius: 12px; border: 2px solid rgba(215,180,90,0.26); box-shadow: inset 0 0 0 1px rgba(255,236,176,0.06), inset 0 0 54px rgba(0,0,0,0.78); transform-origin: top left; }
.eg-board-grid { position: absolute; inset: 0; opacity: 0.72; background: repeating-linear-gradient(90deg, #18110a 0, #18110a 12px, transparent 12px, transparent 80px), repeating-linear-gradient(0deg, #18110a 0, #18110a 12px, transparent 12px, transparent 80px); border-radius: 10px; }
.eg-square { position: absolute; z-index: 1; border: 1px solid rgba(255,236,176,0.035); border-radius: 6px; background: linear-gradient(145deg, #261d10, #141008); cursor: pointer; padding: 0; box-shadow: inset 0 1px 0 rgba(255,244,204,0.035); touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.eg-square.dark { background: linear-gradient(145deg, #20170c, #100c07); }
.eg-square.grand { background: radial-gradient(circle, rgba(215,180,90,0.32), #171008 76%); box-shadow: inset 0 0 0 1px rgba(244,206,100,0.26), 0 0 20px rgba(215,180,90,0.12); }
.eg-square.high { box-shadow: inset 0 0 0 2px rgba(215,180,90,0.34), inset 0 0 24px rgba(215,180,90,0.06); }
.eg-square.target { outline: 2px solid rgba(120,210,140,0.86); outline-offset: -4px; background: radial-gradient(circle, rgba(80,180,110,0.22), #151009 72%); }
.eg-square.attacked:not(.target) { box-shadow: inset 0 0 0 1px rgba(156,74,58,0.17); }
.eg-square-label { position: absolute; left: 5px; bottom: 4px; color: rgba(235,220,178,0.16); font-size: 9px; font-family: 'Cinzel', serif; pointer-events: none; }
.eg-token { position: absolute; z-index: 8; width: 60px; height: 60px; padding: 0; border: 0; background: transparent; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.eg-token:disabled { cursor: default; }
.eg-token-core { width: 60px; height: 60px; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle, rgba(10,8,5,0.98), rgba(0,0,0,0.72)); border: 1px solid rgba(215,180,90,0.22); box-shadow: 0 8px 18px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,244,204,0.08); }
.eg-token img { width: 68px; height: 68px; object-fit: contain; display: block; filter: drop-shadow(0 4px 5px rgba(0,0,0,0.62)); }
.eg-token.gold .eg-token-core { border-color: rgba(226,189,84,0.46); }
.eg-token.stone .eg-token-core { border-color: rgba(230,226,214,0.32); }
.eg-token.selected .eg-token-core { border-color: rgba(244,206,100,0.94); box-shadow: 0 0 24px rgba(244,206,100,0.34), inset 0 1px 0 rgba(255,244,204,0.2); }
.eg-token.threatened .eg-token-core { box-shadow: 0 0 24px rgba(210,64,48,0.36), inset 0 0 16px rgba(210,64,48,0.12); }
.eg-token-fallback { color: #ead9aa; font-family: 'Cinzel', serif; font-weight: 700; font-size: 20px; }
.eg-gate, .eg-placement { position: absolute; z-index: 6; border: 0; padding: 0; border-radius: 999px; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.eg-gate { background: linear-gradient(90deg, #7a756b, #c9c2ad, #7a756b); box-shadow: 0 5px 10px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.18); }
.eg-gate.gold { background: linear-gradient(90deg, #73561c, #e2bd54, #73561c); }
.eg-gate.rotatable { cursor: pointer; box-shadow: 0 0 18px rgba(244,206,100,0.32), 0 5px 10px rgba(0,0,0,0.55); }
.eg-hinge { position: absolute; left: 50%; top: 50%; width: 16px; height: 16px; transform: translate(-50%, -50%); border-radius: 50%; background: #080604; border: 2px solid #d7b45a; box-shadow: 0 0 8px rgba(215,180,90,0.45); }
.eg-placement { background: rgba(122,214,142,0.32); border: 1px solid rgba(122,214,142,0.88); cursor: pointer; box-shadow: 0 0 18px rgba(122,214,142,0.28); }
.eg-reference p { margin: 0 0 10px; color: rgba(235,220,178,0.62); font-size: 12px; line-height: 1.45; }
.eg-reference b { color: #ead9aa; }
.eg-log-panel { min-height: 180px; }
.eg-log-row { display: grid; grid-template-columns: 28px 48px 1fr; gap: 8px; align-items: start; padding: 8px 0; border-top: 1px solid rgba(215,180,90,0.09); font-size: 11px; color: rgba(235,220,178,0.58); }
.eg-log-row span, .eg-log-row b { font-family: 'Cinzel', serif; color: rgba(215,180,90,0.66); font-size: 9px; text-transform: uppercase; }
.eg-log-row em { font-style: normal; }
.eg-empty { color: rgba(235,220,178,0.36); font-size: 12px; font-style: italic; }
.eg-footer { position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); font-family: 'Cinzel', serif; font-size: 7px; letter-spacing: 0.18em; text-transform: uppercase; color: rgba(215,180,90,0.18); }
.eg-menu-shell { min-height: 100vh; display: flex; flex-direction: column; align-items: center; isolation: isolate; background: radial-gradient(circle at 50% 18%, rgba(215,180,90,0.13), transparent 30%), radial-gradient(circle at 12% 70%, rgba(100,78,34,0.12), transparent 34%), linear-gradient(180deg, #100a05 0%, #050302 100%); }
.eg-menu-shell::before { content: ""; position: fixed; inset: 0; z-index: -3; pointer-events: none; background-image: linear-gradient(rgba(215,180,90,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(215,180,90,0.025) 1px, transparent 1px); background-size: 88px 88px; mask-image: radial-gradient(circle at 50% 42%, black, transparent 76%); }
.eg-menu-bg { position: fixed; inset: 0; z-index: -2; overflow: hidden; pointer-events: none; }
.eg-menu-bg::before { content: ""; position: absolute; width: min(78vw, 980px); aspect-ratio: 1; left: 50%; top: 53%; transform: translate(-50%, -50%) rotate(8deg); border-radius: 50%; border: 1px solid rgba(215,180,90,0.11); background: repeating-conic-gradient(from 12deg, rgba(215,180,90,0.08) 0deg 2deg, transparent 2deg 11deg), radial-gradient(circle, transparent 0 28%, rgba(215,180,90,0.07) 28.3% 28.7%, transparent 29% 49%, rgba(215,180,90,0.06) 49.4% 49.8%, transparent 50%); opacity: 0.58; filter: drop-shadow(0 0 60px rgba(215,180,90,0.08)); }
.eg-menu-bg span { position: absolute; width: 1px; height: 64vh; top: 20%; left: calc(50% + var(--x, 0px)); background: linear-gradient(180deg, transparent, rgba(215,180,90,0.18), transparent); transform: rotate(var(--r, 0deg)); opacity: 0.32; }
.eg-menu-bg span:nth-child(1) { --x: -360px; --r: 28deg; }.eg-menu-bg span:nth-child(2) { --x: 0px; --r: -14deg; }.eg-menu-bg span:nth-child(3) { --x: 340px; --r: 18deg; }
.eg-menu-hero { width: min(1120px, 100%); min-height: 224px; display: grid; place-items: center; align-content: end; text-align: center; padding: 58px 20px 32px; position: relative; }
.eg-menu-hero::after { content: ""; width: 128px; height: 1px; margin-top: 18px; background: linear-gradient(90deg, transparent, rgba(215,180,90,0.5), transparent); }
.eg-menu-hero h1 { margin: 10px 0 10px; font-family: 'Cinzel', serif; color: #f4e4b4; font-size: clamp(44px, 7vw, 82px); line-height: 0.95; letter-spacing: 0.24em; text-transform: uppercase; text-shadow: 0 0 28px rgba(215,180,90,0.22), 0 10px 42px rgba(0,0,0,0.85); }
.eg-menu-hero p { margin: 0; color: rgba(235,220,178,0.68); font-size: 15px; font-style: italic; }
.eg-menu-stage { width: min(1160px, 100%); display: grid; grid-template-columns: minmax(300px, 0.9fr) minmax(360px, 1.1fr); gap: 20px; align-items: stretch; }
.eg-menu-card { position: relative; overflow: hidden; border: 1px solid rgba(215,180,90,0.24); border-radius: 14px; background: linear-gradient(150deg, rgba(38,29,14,0.58), rgba(7,5,3,0.9) 62%, rgba(0,0,0,0.94)); box-shadow: 0 34px 100px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,244,204,0.08); padding: 18px; }
.eg-menu-card::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(135deg, rgba(255,244,204,0.08), transparent 34%), radial-gradient(circle at 78% 18%, rgba(215,180,90,0.09), transparent 35%); opacity: 0.7; }
.eg-menu-card > * { position: relative; z-index: 1; }
.eg-mode-card { min-height: 360px; display: flex; flex-direction: column; }
.eg-mode-list { display: grid; gap: 11px; flex: 1; }
.eg-mode-option { min-height: 86px; display: grid; grid-template-columns: 42px 1fr; grid-template-rows: auto auto; gap: 4px 14px; align-items: center; text-align: left; border: 1px solid rgba(215,180,90,0.18); border-radius: 10px; background: linear-gradient(90deg, rgba(8,6,4,0.9), rgba(21,14,7,0.72)); color: #d9c9a4; padding: 13px 16px; cursor: pointer; touch-action: manipulation; box-shadow: inset 0 1px 0 rgba(255,244,204,0.04); transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease, background 150ms ease; }
.eg-mode-option:hover { transform: translateX(4px); border-color: rgba(215,180,90,0.45); }
.eg-mode-option i { grid-row: 1 / span 2; width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(215,180,90,0.28); color: rgba(215,180,90,0.72); font-family: 'Cinzel', serif; font-size: 10px; font-style: normal; }
.eg-mode-option span { display: block; font-family: 'Cinzel', serif; color: #ead9aa; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; }
.eg-mode-option em { display: block; color: rgba(235,220,178,0.52); font-size: 12px; line-height: 1.35; }
.eg-mode-option.active { transform: translateX(8px); border-color: rgba(244,206,100,0.82); background: linear-gradient(90deg, rgba(68,48,15,0.56), rgba(10,7,4,0.86)); box-shadow: 0 0 32px rgba(215,180,90,0.15), inset 0 0 0 1px rgba(255,244,204,0.06); }
.eg-mode-option.active i { background: rgba(215,180,90,0.14); color: #f4ce64; border-color: rgba(244,206,100,0.72); }
.eg-command-card { min-height: 360px; padding: 22px; }
.eg-command-orbit { height: 136px; margin: 4px auto 4px; width: 136px; position: relative; border-radius: 50%; border: 1px solid rgba(215,180,90,0.28); background: radial-gradient(circle, rgba(215,180,90,0.18), rgba(8,6,4,0.92) 58%, rgba(0,0,0,0.95)); box-shadow: 0 0 42px rgba(215,180,90,0.14), inset 0 0 28px rgba(0,0,0,0.7); }
.eg-command-orbit::before, .eg-command-orbit::after { content: ""; position: absolute; inset: 18px; border-radius: 50%; border: 1px dashed rgba(215,180,90,0.22); }
.eg-command-orbit::after { inset: 42px; border-style: solid; background: radial-gradient(circle, rgba(244,206,100,0.2), transparent 60%); }
.eg-command-orbit span { position: absolute; left: 50%; top: 50%; width: 82%; height: 1px; background: linear-gradient(90deg, transparent, rgba(215,180,90,0.54), transparent); transform-origin: 0 0; transform: rotate(var(--r, 0deg)); }
.eg-command-orbit span:nth-child(1) { --r: 0deg; }.eg-command-orbit span:nth-child(2) { --r: 60deg; }.eg-command-orbit span:nth-child(3) { --r: 120deg; }
.eg-selected-mode { text-align: center; margin: 8px 0 18px; }
.eg-selected-mode span { display: inline-grid; place-items: center; width: 24px; height: 24px; margin-bottom: 7px; border-radius: 50%; border: 1px solid rgba(215,180,90,0.32); color: rgba(215,180,90,0.72); font-family: 'Cinzel', serif; font-size: 9px; }
.eg-selected-mode b { display: block; font-family: 'Cinzel', serif; font-size: 20px; letter-spacing: 0.14em; text-transform: uppercase; color: #f0dfad; }
.eg-selected-mode em { display: block; max-width: 360px; margin: 7px auto 0; color: rgba(235,220,178,0.52); font-size: 12px; line-height: 1.4; }
.eg-council-ledger { display: grid; gap: 8px; margin-top: 12px; }
.eg-council-ledger div { display: grid; grid-template-columns: 72px 1fr auto; gap: 12px; align-items: center; min-height: 38px; padding: 0 12px; border-radius: 8px; border: 1px solid rgba(215,180,90,0.13); background: rgba(0,0,0,0.24); }
.eg-council-ledger b { font-family: 'Cinzel', serif; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: #ead9aa; }.eg-council-ledger span { color: rgba(235,220,178,0.75); }.eg-council-ledger em { color: rgba(215,180,90,0.62); font-size: 11px; font-style: normal; }
.eg-seat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
.eg-seat-card { border: 1px solid rgba(215,180,90,0.2); border-radius: 10px; padding: 12px; background: rgba(0,0,0,0.22); }
.eg-seat-card.ready { border-color: rgba(114,198,132,0.62); box-shadow: inset 0 0 24px rgba(114,198,132,0.055); }
.eg-seat-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(215,180,90,0.64); }
.eg-seat-top b { color: #ead9aa; }
.eg-seat-card input { width: 100%; min-height: 38px; border-radius: 8px; border: 1px solid rgba(215,180,90,0.24); background: #100c07; color: #ead9aa; padding: 0 10px; box-sizing: border-box; font-size: 15px; }
.eg-checkin-note { margin: 13px 0 0; color: rgba(235,220,178,0.5); font-size: 12px; line-height: 1.45; font-style: italic; text-align: center; }
.eg-menu-codex { grid-column: 1 / -1; padding: 16px 18px 18px; }
.eg-howto-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
.eg-howto section { min-height: 116px; border: 1px solid rgba(215,180,90,0.13); border-radius: 10px; padding: 14px; background: linear-gradient(180deg, rgba(0,0,0,0.2), rgba(0,0,0,0.34)); }
.eg-howto section span { display: block; font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.14em; color: rgba(215,180,90,0.46); margin-bottom: 10px; }
.eg-howto b { font-family: 'Cinzel', serif; color: #ead9aa; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.eg-howto p { margin: 7px 0 0; color: rgba(235,220,178,0.58); font-size: 12px; line-height: 1.45; }
@media (max-width: 1120px) { .eg-menu-stage { grid-template-columns: 1fr; } .eg-howto-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .eg-header { padding-left: 0; padding-top: 44px; flex-direction: column; align-items: center; text-align: center; } .eg-layout { grid-template-columns: 1fr; } .eg-side { grid-template-columns: repeat(2, minmax(0, 1fr)); } .eg-side.right { grid-template-columns: 1fr; } .eg-status-card { min-width: min(100%, 360px); } }
@media (max-width: 680px) { .eg-menu-hero { min-height: 190px; padding-top: 74px; } .eg-menu-hero h1 { letter-spacing: 0.14em; } .eg-seat-grid, .eg-howto-grid { grid-template-columns: 1fr; } .eg-council-ledger div { grid-template-columns: 58px 1fr; } .eg-council-ledger em { display: none; } .eg-shell { padding-left: 10px; padding-right: 10px; } .eg-side { grid-template-columns: 1fr; } .eg-board-frame { padding: 10px; } .eg-header h1 { font-size: 25px; } }
`;
