import { useEffect, useMemo, useState } from 'react';
import E from './elddimgatesEngine.js';

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

function describeAction(action) {
  if (!action) return 'Ready.';
  if (action.type === 'move') return `Move ${coord(action.from)} to ${coord(action.to)}`;
  if (action.type === 'exchange') return `Envoy exchange ${coord(action.from)} and ${coord(action.to)}`;
  if (action.type === 'place') return `Place ${cap(action.gateId?.includes('a') ? 'arcane' : action.gateId?.includes('m') ? 'mechanist' : 'civic')} gate`;
  if (action.type === 'rotate') return `Rotate gate ${action.gateId}`;
  return cap(action.type);
}

function ActionButton({ active, disabled, danger, children, onClick, title }) {
  return <button type="button" disabled={disabled} onClick={onClick} title={title} className={'eg-btn' + (active ? ' active' : '') + (danger ? ' danger' : '')}>{children}</button>;
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
      <button type="button" className="eg-seat-ready" disabled={!value || locked} onClick={onReady}>{ready ? 'Ready' : 'Mark Ready'}</button>
    </div>
  );
}

function HowToPlayPanel() {
  return (
    <div className="eg-menu-card eg-howto">
      <div className="eg-panel-title">How to Play</div>
      <div className="eg-howto-grid">
        <section><b>Goal</b><p>Win by moving your Consul onto the opposing High Gate, or by leaving the enemy Consul in check with no legal reply.</p></section>
        <section><b>Turns</b><p>On your turn, move one council piece, exchange with an Envoy, place a reserve gate, or rotate a placed gate.</p></section>
        <section><b>Gates</b><p>Gates block channels. A Consul may pass through their own gates, but no gate may seal all routes for either Consul.</p></section>
        <section><b>Grand Square</b><p>Control d4 to rotate enemy gates. Gold also has one Charter that can attach a gate action after a main action.</p></section>
      </div>
    </div>
  );
}

function ElddimgatesMenu({ onExit, mode, setMode, seats, ready, setSeat, toggleReady, startMatch }) {
  const challengeReady = !!seats[1] && !!seats[2] && ready[1] && ready[2];
  const canStart = mode === 'challenge' ? challengeReady : true;
  return (
    <div className="eg-shell eg-menu-shell">
      <style>{styles}</style>
      <button type="button" className="eg-back" onClick={onExit}>Back to Bag</button>
      <div className="eg-menu-hero">
        <div className="eg-kicker">A Game of the Divided City</div>
        <h1>Elddimgates</h1>
        <p>Choose your table, claim your council, then open the gates.</p>
      </div>
      <main className="eg-menu-grid">
        <section className="eg-menu-card eg-mode-card">
          <div className="eg-panel-title">Play</div>
          <div className="eg-mode-list">
            {Object.entries(MATCH_MODES).map(([id, item]) => (
              <button key={id} type="button" className={'eg-mode-option' + (mode === id ? ' active' : '')} onClick={() => { setMode(id); if (id === 'challenge') { setSeat(1, ''); setSeat(2, ''); } }}>
                <span>{item.label}</span><em>{item.detail}</em>
              </button>
            ))}
          </div>
          <button type="button" className="eg-start-match" disabled={!canStart} onClick={startMatch}>{mode === 'challenge' ? 'Begin Challenge' : 'Begin Match'}</button>
        </section>
        <section className="eg-menu-card eg-checkin-card">
          <div className="eg-panel-title">Player Check-In</div>
          {mode === 'challenge' ? (
            <div className="eg-seat-grid">
              <SeatCard player={1} value={seats[1]} ready={ready[1]} locked={false} onName={(name) => setSeat(1, name)} onReady={() => toggleReady(1)} />
              <SeatCard player={2} value={seats[2]} ready={ready[2]} locked={false} onName={(name) => setSeat(2, name)} onReady={() => toggleReady(2)} />
            </div>
          ) : (
            <div className="eg-ai-contract"><b>Stone</b><span>{mode === 'ai' ? 'You' : 'Player 1'}</span><b>Gold</b><span>{mode === 'ai' ? 'Elddimgates AI' : 'Player 2'}</span></div>
          )}
          <p className="eg-checkin-note">{mode === 'challenge' ? 'Challenge mode requires both seats to be claimed and both players to mark ready before the board opens.' : 'This mode starts immediately with the seats shown above.'}</p>
        </section>
        <HowToPlayPanel />
      </main>
      <footer className="eg-footer">Syntarion - Games of Soteria</footer>
    </div>
  );
}

export default function Elddimgates({ onExit }) {
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchMode, setMatchMode] = useState('ai');
  const [seats, setSeats] = useState({ 1: 'Player', 2: 'Elddimgates AI' });
  const [ready, setReady] = useState({ 1: false, 2: false });
  const [state, setState] = useState(() => E.createGame());
  const [selected, setSelected] = useState(null);
  const [gateMode, setGateMode] = useState(null);
  const [charterArmed, setCharterArmed] = useState(false);
  const [pendingMain, setPendingMain] = useState(null);
  const [autoFlip, setAutoFlip] = useState(true);
  const [manualPov, setManualPov] = useState(1);
  const [message, setMessage] = useState('Select a council piece or place a reserve gate.');

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

  const aiTurn = matchStarted && matchMode === 'ai' && state.toMove === AI_PLAYER && !ended && !pendingMain;
  const humanTurn = !aiTurn;

  useEffect(() => {
    if (!aiTurn) return undefined;
    const timer = window.setTimeout(() => {
      const action = chooseAiAction(state);
      if (!action) return;
      try {
        const next = E.applyAction(state, action);
        setState(next);
        setMessage('AI: ' + describeAction(action));
      } catch (err) {
        setMessage(err?.message || 'AI could not find a legal action.');
      }
      setSelected(null);
      setGateMode(null);
      setCharterArmed(false);
    }, 650);
    return () => window.clearTimeout(timer);
  }, [aiTurn, state]);

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
      setState(next);
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
      <button type="button" className="eg-back" onClick={onExit}>Back to Bag</button>

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
              {ended && <ActionButton active onClick={() => { setState(E.createGame()); cancelIntent(); }}>New Game</ActionButton>}
            </div>
          </div>
        </aside>

        <section className="eg-board-wrap">
          <div className="eg-board-title"><span>{selectedPiece ? `${PLAYERS[selectedPiece.owner].name} ${PIECE_META[selectedPiece.type].label}` : selectedGate ? `${PLAYERS[selectedGate.owner].name} ${cap(selectedGate.kind)} Gate` : 'The City is Open'}</span><b>{pendingMain ? 'Charter action required' : inCheck ? 'Consul in check' : 'Grand Square d4'}</b></div>
          <div className="eg-board-frame">
            <div className="eg-board" style={{ width: BOARD, height: BOARD }}>
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
        </section>

        <aside className="eg-side right">
          <div className="eg-panel"><div className="eg-panel-title">Quick Reference</div><div className="eg-reference"><p><b>Passage:</b> move your Consul onto the enemy High Gate.</p><p><b>Political:</b> checkmate the opposing Consul.</p><p><b>Grand Square:</b> holding d4 lets you rotate enemy gates.</p><p><b>Sealing:</b> no gate may close every route for either Consul.</p></div></div>
          <LogPanel log={state.log} />
          <button type="button" className="eg-menu-return" onClick={() => setMatchStarted(false)}>Return to Game Menu</button>
        </aside>
      </main>
      <footer className="eg-footer">Syntarion - Games of Soteria</footer>
    </div>
  );
}

const styles = `
.eg-shell { min-height: 100vh; background: radial-gradient(circle at 50% 8%, rgba(80,58,22,0.18), transparent 34%), linear-gradient(180deg, #100b06 0%, #050403 100%); color: #d6c7a5; font-family: Georgia, serif; padding: 24px clamp(14px, 2vw, 34px) 42px; box-sizing: border-box; position: relative; overflow-x: hidden; }
.eg-back { position: fixed; top: 18px; left: 18px; z-index: 20; border: 1px solid rgba(215,180,90,0.44); border-radius: 8px; background: linear-gradient(180deg, rgba(27,21,12,0.96), rgba(8,6,4,0.88)); color: #d7c79a; padding: 10px 16px; font-family: 'Cinzel', serif; font-size: 9px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; cursor: pointer; box-shadow: 0 12px 32px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,236,176,0.11); }
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
.eg-reserve-gate, .eg-btn { min-height: 36px; border-radius: 8px; border: 1px solid rgba(215,180,90,0.24); color: #d8c797; background: linear-gradient(180deg, rgba(30,23,12,0.88), rgba(9,7,5,0.9)); cursor: pointer; font-family: 'Cinzel', serif; text-transform: uppercase; letter-spacing: 0.1em; font-size: 9px; box-shadow: inset 0 1px 0 rgba(255,244,204,0.06); }
.eg-reserve-gate { display: flex; align-items: center; justify-content: space-between; padding: 0 12px; }
.eg-reserve-gate small { opacity: 0.48; }
.eg-reserve-gate.selected, .eg-btn.active { border-color: rgba(244,206,100,0.84); color: #f4ce64; box-shadow: 0 0 22px rgba(215,180,90,0.13), inset 0 1px 0 rgba(255,244,204,0.16); }
.eg-btn:disabled { opacity: 0.35; cursor: default; }
.eg-btn.danger { color: rgba(235,220,178,0.6); }
.eg-board-wrap { min-width: 0; }
.eg-board-title { display: flex; justify-content: space-between; align-items: baseline; gap: 18px; margin: 0 0 10px; padding: 0 4px; }
.eg-board-title span { font-family: 'Cinzel', serif; color: #f0dfad; letter-spacing: 0.12em; text-transform: uppercase; font-size: 12px; }
.eg-board-title b { color: rgba(215,180,90,0.62); font-size: 11px; font-weight: 400; font-style: italic; }
.eg-board-frame { overflow: auto; padding: 18px; border-radius: 18px; border: 1px solid rgba(215,180,90,0.2); background: radial-gradient(circle at 50% 42%, rgba(215,180,90,0.08), transparent 64%), linear-gradient(150deg, rgba(38,29,14,0.86), rgba(7,5,3,0.95)); box-shadow: 0 30px 80px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,244,204,0.06); }
.eg-board { position: relative; margin: 0 auto; background: #070604; border-radius: 12px; border: 2px solid rgba(215,180,90,0.26); box-shadow: inset 0 0 0 1px rgba(255,236,176,0.06), inset 0 0 54px rgba(0,0,0,0.78); }
.eg-board-grid { position: absolute; inset: 0; opacity: 0.72; background: repeating-linear-gradient(90deg, #18110a 0, #18110a 12px, transparent 12px, transparent 80px), repeating-linear-gradient(0deg, #18110a 0, #18110a 12px, transparent 12px, transparent 80px); border-radius: 10px; }
.eg-square { position: absolute; z-index: 1; border: 1px solid rgba(255,236,176,0.035); border-radius: 6px; background: linear-gradient(145deg, #261d10, #141008); cursor: pointer; padding: 0; box-shadow: inset 0 1px 0 rgba(255,244,204,0.035); }
.eg-square.dark { background: linear-gradient(145deg, #20170c, #100c07); }
.eg-square.grand { background: radial-gradient(circle, rgba(215,180,90,0.32), #171008 76%); box-shadow: inset 0 0 0 1px rgba(244,206,100,0.26), 0 0 20px rgba(215,180,90,0.12); }
.eg-square.high { box-shadow: inset 0 0 0 2px rgba(215,180,90,0.34), inset 0 0 24px rgba(215,180,90,0.06); }
.eg-square.target { outline: 2px solid rgba(120,210,140,0.86); outline-offset: -4px; background: radial-gradient(circle, rgba(80,180,110,0.22), #151009 72%); }
.eg-square.attacked:not(.target) { box-shadow: inset 0 0 0 1px rgba(156,74,58,0.17); }
.eg-square-label { position: absolute; left: 5px; bottom: 4px; color: rgba(235,220,178,0.16); font-size: 9px; font-family: 'Cinzel', serif; pointer-events: none; }
.eg-token { position: absolute; z-index: 8; width: 60px; height: 60px; padding: 0; border: 0; background: transparent; cursor: pointer; }
.eg-token:disabled { cursor: default; }
.eg-token-core { width: 60px; height: 60px; display: grid; place-items: center; border-radius: 50%; background: radial-gradient(circle, rgba(10,8,5,0.98), rgba(0,0,0,0.72)); border: 1px solid rgba(215,180,90,0.22); box-shadow: 0 8px 18px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,244,204,0.08); }
.eg-token img { width: 68px; height: 68px; object-fit: contain; display: block; filter: drop-shadow(0 4px 5px rgba(0,0,0,0.62)); }
.eg-token.gold .eg-token-core { border-color: rgba(226,189,84,0.46); }
.eg-token.stone .eg-token-core { border-color: rgba(230,226,214,0.32); }
.eg-token.selected .eg-token-core { border-color: rgba(244,206,100,0.94); box-shadow: 0 0 24px rgba(244,206,100,0.34), inset 0 1px 0 rgba(255,244,204,0.2); }
.eg-token.threatened .eg-token-core { box-shadow: 0 0 24px rgba(210,64,48,0.36), inset 0 0 16px rgba(210,64,48,0.12); }
.eg-token-fallback { color: #ead9aa; font-family: 'Cinzel', serif; font-weight: 700; font-size: 20px; }
.eg-gate, .eg-placement { position: absolute; z-index: 6; border: 0; padding: 0; border-radius: 999px; }
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
.eg-menu-shell { display: flex; flex-direction: column; align-items: center; }
.eg-menu-hero { width: min(960px, 100%); min-height: 210px; display: grid; place-items: center; align-content: center; text-align: center; padding: 58px 20px 24px; }
.eg-menu-hero h1 { margin: 8px 0 8px; font-family: 'Cinzel', serif; color: #f0dfad; font-size: clamp(34px, 6vw, 64px); letter-spacing: 0.22em; text-transform: uppercase; text-shadow: 0 0 34px rgba(215,180,90,0.17); }
.eg-menu-hero p { margin: 0; color: rgba(235,220,178,0.58); font-size: 14px; font-style: italic; }
.eg-menu-grid { width: min(1120px, 100%); display: grid; grid-template-columns: minmax(260px, 0.9fr) minmax(300px, 1fr); gap: 18px; align-items: stretch; }
.eg-menu-card { border: 1px solid rgba(215,180,90,0.22); border-radius: 16px; background: linear-gradient(150deg, rgba(240,238,235,0.055), rgba(9,7,4,0.88)); box-shadow: 0 28px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,244,204,0.07); padding: 18px; }
.eg-mode-list { display: grid; gap: 10px; }
.eg-mode-option { text-align: left; border: 1px solid rgba(215,180,90,0.2); border-radius: 10px; background: linear-gradient(145deg, rgba(25,19,10,0.86), rgba(7,5,3,0.92)); color: #d9c9a4; padding: 14px; cursor: pointer; }
.eg-mode-option span { display: block; font-family: 'Cinzel', serif; color: #ead9aa; font-size: 12px; letter-spacing: 0.13em; text-transform: uppercase; }
.eg-mode-option em { display: block; margin-top: 6px; color: rgba(235,220,178,0.52); font-size: 12px; line-height: 1.45; }
.eg-mode-option.active { border-color: rgba(244,206,100,0.78); box-shadow: 0 0 30px rgba(215,180,90,0.13), inset 0 1px 0 rgba(255,244,204,0.12); }
.eg-start-match, .eg-menu-return { width: 100%; min-height: 42px; margin-top: 14px; border-radius: 9px; border: 1px solid rgba(244,206,100,0.64); background: linear-gradient(180deg, rgba(77,58,22,0.92), rgba(16,11,6,0.95)); color: #f0dfad; font-family: 'Cinzel', serif; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; }
.eg-start-match:disabled { opacity: 0.36; cursor: default; }
.eg-seat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.eg-seat-card { border: 1px solid rgba(215,180,90,0.2); border-radius: 12px; padding: 13px; background: rgba(0,0,0,0.2); }
.eg-seat-card.ready { border-color: rgba(114,198,132,0.62); box-shadow: inset 0 0 24px rgba(114,198,132,0.055); }
.eg-seat-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(215,180,90,0.64); }
.eg-seat-top b { color: #ead9aa; }
.eg-seat-card input { width: 100%; min-height: 36px; border-radius: 8px; border: 1px solid rgba(215,180,90,0.24); background: #100c07; color: #ead9aa; padding: 0 10px; box-sizing: border-box; }
.eg-seat-ready { width: 100%; min-height: 34px; margin-top: 9px; border-radius: 8px; border: 1px solid rgba(215,180,90,0.28); background: rgba(9,7,4,0.9); color: #d8c797; font-family: 'Cinzel', serif; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; }
.eg-seat-card.ready .eg-seat-ready { border-color: rgba(114,198,132,0.62); color: #aee0b6; }
.eg-checkin-note { margin: 13px 0 0; color: rgba(235,220,178,0.46); font-size: 12px; line-height: 1.45; font-style: italic; }
.eg-ai-contract { display: grid; grid-template-columns: 80px 1fr; gap: 10px 14px; border: 1px solid rgba(215,180,90,0.16); border-radius: 12px; padding: 16px; background: rgba(0,0,0,0.22); }
.eg-ai-contract b { font-family: 'Cinzel', serif; color: #ead9aa; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.eg-ai-contract span { color: rgba(235,220,178,0.62); }
.eg-howto { grid-column: 1 / -1; }
.eg-howto-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.eg-howto section { border-top: 1px solid rgba(215,180,90,0.18); padding-top: 12px; }
.eg-howto b { font-family: 'Cinzel', serif; color: #ead9aa; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; }
.eg-howto p { margin: 7px 0 0; color: rgba(235,220,178,0.58); font-size: 12px; line-height: 1.5; }
.eg-menu-return { margin-top: 0; border-color: rgba(215,180,90,0.28); background: linear-gradient(180deg, rgba(30,23,12,0.86), rgba(9,7,5,0.9)); color: #d8c797; }
@media (max-width: 1120px) { .eg-menu-grid { grid-template-columns: 1fr; } .eg-howto-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .eg-header { padding-left: 0; padding-top: 44px; flex-direction: column; align-items: center; text-align: center; } .eg-layout { grid-template-columns: 1fr; } .eg-side { grid-template-columns: repeat(2, minmax(0, 1fr)); } .eg-side.right { grid-template-columns: 1fr; } .eg-status-card { min-width: min(100%, 360px); } }
@media (max-width: 680px) { .eg-seat-grid, .eg-howto-grid { grid-template-columns: 1fr; } .eg-shell { padding-left: 10px; padding-right: 10px; } .eg-side { grid-template-columns: 1fr; } .eg-board-frame { padding: 10px; } .eg-header h1 { font-size: 25px; } }
`;
