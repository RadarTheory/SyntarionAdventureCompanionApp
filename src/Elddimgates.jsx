// Elddimgates.jsx — playable board for Elddimgates (hotseat; Realtime multiplayer phase 2)
// Requires: src/elddimgatesEngine.js and token art in public/elddimgates/ (lowercase):
//   consul-stone.png ... warden-stone.png, consul-gold.png ... warden-gold.png
import { useMemo, useState } from 'react';
import E from './elddimgatesEngine.js';

const GOLD = '#c8a84a';
const GOLD_DIM = 'rgba(200,168,74,0.35)';
const CELL = 76;          // px per square
const CH = 10;            // px per channel groove
const PITCH = CELL + CH;  // square + one channel
const BOARD = 7 * CELL + 8 * CH;

const COLORWAY = { 1: 'stone', 2: 'gold' };
const tokenSrc = (piece) => `/elddimgates/${piece.type}-${COLORWAY[piece.owner]}.png`;

// board px for square (f,r) under a viewpoint (viewer's home rank at bottom)
function cellXY(f, r, pov) {
  const vf = pov === 2 ? 6 - f : f;
  const vr = pov === 2 ? r : 6 - r;
  return { x: CH + vf * PITCH, y: CH + vr * PITCH };
}
// board px for hinge intersection (x,y)
function hingeXY(hx, hy, pov) {
  const vf = pov === 2 ? 7 - hx : hx;
  const vr = pov === 2 ? hy : 7 - hy;
  return { x: vf * PITCH + CH / 2, y: vr * PITCH + CH / 2 };
}

function Token({ piece, x, y, mirrored, selected, onClick }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      onClick={onClick}
      style={{
        position: 'absolute', left: x, top: y, width: CELL, height: CELL,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default', zIndex: 3,
        filter: selected ? 'drop-shadow(0 0 10px rgba(232,200,74,0.9))' : 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))',
      }}
    >
      {failed ? (
        <div style={{
          width: CELL * 0.72, height: CELL * 0.72, borderRadius: '50%',
          background: piece.owner === 1 ? '#4a4640' : '#7a5f2c',
          border: `2px solid ${GOLD}`, color: '#f0e6c8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: 22,
        }}>
          {piece.type[0].toUpperCase()}
        </div>
      ) : (
        <img
          src={tokenSrc(piece)}
          alt={piece.type}
          draggable={false}
          onError={() => setFailed(true)}
          style={{
            width: CELL * 0.94, height: CELL * 0.94, objectFit: 'contain',
            transform: mirrored ? 'scaleX(-1)' : 'none',
          }}
        />
      )}
    </div>
  );
}

export default function Elddimgates({ onExit }) {
  const [state, setState] = useState(() => E.createGame());
  const [selected, setSelected] = useState(null);        // {f,r} of selected own piece
  const [gateMode, setGateMode] = useState(null);        // gateId being placed
  const [charterArmed, setCharterArmed] = useState(false);
  const [pendingMain, setPendingMain] = useState(null);  // main action awaiting charter attachment
  const [autoFlip, setAutoFlip] = useState(true);
  const [manualPov, setManualPov] = useState(1);

  const pov = autoFlip ? state.toMove : manualPov;
  const legal = useMemo(() => E.getLegalActions(state), [state]);
  const inCheck = E.isCheck(state, state.toMove);
  const ended = state.status.phase === 'ended';

  // actions currently offered to the click layer
  const pieceMoves = selected
    ? legal.filter((a) => (a.type === 'move' || a.type === 'exchange')
        && a.from.f === selected.f && a.from.r === selected.r)
    : [];
  const placements = gateMode
    ? legal.filter((a) => a.type === 'place' && a.gateId === gateMode)
    : [];

  const commit = (action) => {
    // Charter flow: P2 armed → hold the main action, choose a gate action next
    if (charterArmed && state.toMove === 2 && state.charterAvailable && !pendingMain) {
      setPendingMain(action);
      setSelected(null); setGateMode(null);
      return;
    }
    try {
      const next = pendingMain
        ? E.applyAction(state, { ...pendingMain, charter: action })
        : E.applyAction(state, action);
      setState(next);
    } catch (err) {
      console.warn('[Elddimgates] rejected:', err.message);
    }
    setSelected(null); setGateMode(null);
    setCharterArmed(false); setPendingMain(null);
  };

  // charter gate options (computed on the state as-if main action applied is engine's job;
  // we approximate the picker with current-legality and let the engine veto on commit)
  const charterOptions = pendingMain
    ? E.getLegalCharterActions(state)
    : [];

  const squares = [];
  for (let f = 0; f < 7; f++) for (let r = 0; r < 7; r++) squares.push({ f, r });

  const moveTargets = {};
  for (const a of (pendingMain ? [] : pieceMoves)) moveTargets[`${a.to.f},${a.to.r}`] = a;

  const placedGates = state.gates.filter((g) => g.placed);
  const reserve = state.gates.filter((g) => !g.placed && g.owner === state.toMove);
  const activePlacements = pendingMain ? charterOptions.filter(a => a.type === 'place' && a.gateId === gateMode) : placements;

  return (
    <div style={{
      minHeight: '100vh', background: '#080604', color: '#c8b89a',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: 'Georgia, serif', padding: '24px 16px 48px', position: 'relative',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');`}</style>

      <button type="button" onClick={onExit} style={{
        position: 'fixed', top: 18, left: 18, background: 'rgba(10,8,6,0.82)',
        border: '1px solid rgba(232,200,116,0.35)', borderRadius: 8, padding: '10px 16px',
        cursor: 'pointer', color: '#c8b89a', fontFamily: "'Cinzel', serif",
        fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', zIndex: 100,
      }}>← Back</button>

      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, letterSpacing: '0.18em', color: '#e8d9a7', margin: '8px 0 2px' }}>
        ELDDIMGATES
      </div>
      <div style={{ fontSize: 11, fontStyle: 'italic', color: GOLD_DIM, marginBottom: 14 }}>
        {ended
          ? state.status.winner
            ? `${state.status.winner === 1 ? 'Stone' : 'Gold'} council wins by ${state.status.reason === 'passage' ? 'Passage' : 'Political Victory'}`
            : `Draw — ${state.status.reason}`
          : pendingMain
            ? 'Charter: choose one unanswered gate action'
            : `${state.toMove === 1 ? 'Stone' : 'Gold'} council to move${inCheck ? ' — CHECK' : ''}`}
      </div>

      {/* board */}
      <div style={{ position: 'relative', width: BOARD, height: BOARD, background: '#141008', borderRadius: 6, border: `2px solid ${GOLD_DIM}`, boxShadow: '0 12px 48px rgba(0,0,0,0.6)' }}>
        {/* squares */}
        {squares.map(({ f, r }) => {
          const { x, y } = cellXY(f, r, pov);
          const grand = f === 3 && r === 3;
          const high = f === 3 && (r === 0 || r === 6);
          const key = `${f},${r}`;
          const target = moveTargets[key];
          const light = (f + r) % 2 === 0;
          return (
            <div key={key}
              onClick={() => {
                if (ended) return;
                if (target) { commit(target); return; }
                const p = state.pieces[key];
                if (!pendingMain && p && p.owner === state.toMove) { setSelected({ f, r }); setGateMode(null); }
                else setSelected(null);
              }}
              style={{
                position: 'absolute', left: x, top: y, width: CELL, height: CELL,
                background: grand ? 'rgba(200,168,74,0.28)' : light ? '#241c10' : '#1b1409',
                outline: high ? `2px solid ${GOLD_DIM}` : 'none', outlineOffset: -3,
                boxShadow: target ? 'inset 0 0 0 3px rgba(120,200,120,0.75)' : 'none',
                cursor: target ? 'pointer' : 'default',
              }}
            />
          );
        })}

        {/* placed gates */}
        {placedGates.map((g) => {
          const { x, y } = hingeXY(g.hinge.x, g.hinge.y, pov);
          const horizontal = g.orientation === 'h';
          const len = 2 * CELL + CH;
          const rotAction = (pendingMain ? charterOptions : legal).find((a) => a.type === 'rotate' && a.gateId === g.id);
          return (
            <div key={g.id}
              onClick={() => { if (!ended && rotAction) commit(rotAction); }}
              title={rotAction ? 'Rotate gate' : `${g.kind} gate`}
              style={{
                position: 'absolute', zIndex: 4,
                left: horizontal ? x - len / 2 : x - CH / 2,
                top: horizontal ? y - CH / 2 : y - len / 2,
                width: horizontal ? len : CH,
                height: horizontal ? CH : len,
                background: g.owner === 1 ? '#6f675c' : '#8a6d2f',
                borderRadius: 4, cursor: rotAction ? 'pointer' : 'default',
                boxShadow: rotAction ? '0 0 8px rgba(232,200,74,0.5)' : '0 2px 4px rgba(0,0,0,0.6)',
              }}
            >
              <div style={{
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                width: 14, height: 14, borderRadius: '50%', background: GOLD, border: '2px solid #3a2f14',
              }} />
            </div>
          );
        })}

        {/* legal gate placement slots */}
        {activePlacements.map((a, i) => {
          const { x, y } = hingeXY(a.hinge.x, a.hinge.y, pov);
          const horizontal = a.orientation === 'h';
          const len = 2 * CELL + CH;
          return (
            <div key={i} onClick={() => commit(a)} style={{
              position: 'absolute', zIndex: 5,
              left: horizontal ? x - len / 2 : x - CH / 2,
              top: horizontal ? y - CH / 2 : y - len / 2,
              width: horizontal ? len : CH,
              height: horizontal ? CH : len,
              background: 'rgba(120,200,120,0.35)', borderRadius: 4, cursor: 'pointer',
            }} />
          );
        })}

        {/* pieces */}
        {Object.entries(state.pieces).map(([key, piece]) => {
          const [f, r] = key.split(',').map(Number);
          const { x, y } = cellXY(f, r, pov);
          const own = piece.owner === state.toMove && !ended && !pendingMain;
          const isSel = selected && selected.f === f && selected.r === r;
          return (
            <Token key={key} piece={piece} x={x} y={y}
              mirrored={piece.owner === pov}
              selected={isSel}
              onClick={own ? () => { setSelected({ f, r }); setGateMode(null); } : undefined}
            />
          );
        })}
      </div>

      {/* controls */}
      <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(pendingMain ? state.gates.filter(g => !g.placed && g.owner === 2) : reserve).map((g) => (
          <button key={g.id} type="button"
            onClick={() => { setGateMode(gateMode === g.id ? null : g.id); setSelected(null); }}
            style={{
              background: gateMode === g.id ? 'rgba(200,168,74,0.18)' : 'rgba(240,238,235,0.04)',
              border: `1px solid ${gateMode === g.id ? GOLD : GOLD_DIM}`, borderRadius: 8,
              padding: '8px 14px', cursor: 'pointer', color: '#c8b89a',
              fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
            Place {g.kind} gate
          </button>
        ))}
        {state.toMove === 2 && state.charterAvailable && !ended && !pendingMain && (
          <button type="button" onClick={() => setCharterArmed(!charterArmed)} style={{
            background: charterArmed ? 'rgba(200,120,40,0.22)' : 'rgba(240,238,235,0.04)',
            border: `1px solid ${charterArmed ? '#c87828' : GOLD_DIM}`, borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer', color: charterArmed ? '#e8a860' : '#c8b89a',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            {charterArmed ? 'Charter armed' : 'Invoke Charter'}
          </button>
        )}
        <button type="button" onClick={() => { setAutoFlip(!autoFlip); setManualPov(pov); }} style={{
          background: 'rgba(240,238,235,0.04)', border: `1px solid ${GOLD_DIM}`, borderRadius: 8,
          padding: '8px 14px', cursor: 'pointer', color: '#c8b89a',
          fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {autoFlip ? 'Auto-flip: on' : 'Auto-flip: off'}
        </button>
        {!autoFlip && (
          <button type="button" onClick={() => setManualPov(manualPov === 1 ? 2 : 1)} style={{
            background: 'rgba(240,238,235,0.04)', border: `1px solid ${GOLD_DIM}`, borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer', color: '#c8b89a',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            Flip board
          </button>
        )}
        {ended && (
          <button type="button" onClick={() => setState(E.createGame())} style={{
            background: 'rgba(200,168,74,0.14)', border: `1px solid ${GOLD}`, borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer', color: '#e8d9a7',
            fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
          }}>
            New game
          </button>
        )}
      </div>

      <div style={{
        position: 'fixed', bottom: 20, fontFamily: "'Cinzel', serif", fontSize: 7,
        letterSpacing: '0.16em', color: 'rgba(200,168,74,0.2)', textTransform: 'uppercase',
      }}>
        Syntarion · Games of Soteria
      </div>
    </div>
  );
}