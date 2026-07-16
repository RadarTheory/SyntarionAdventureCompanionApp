import './fubin.css';
import FubinGame from './FubinGame';

const DEFAULT_CONFIG = {
  board: {
    borderWidth: 28,
    goalHeightRatio: 0.38,
    wallColor: '#3a2e1c',
    vineColor: '#2a3a1a',
    flowerColor: '#c8a84a',
  },
  ball: {
    radius: 12,
    baseSpeed: 320,
    minSpeed: 180,
    trailMax: 80,
    glowColor: '#7dd3fc',
    woodColor: '#d4a574',
  },
  paddle: {
    width: 18,
    height: 90,
    speed: 520,
    woodColor: '#8b6520',
    edgeColor: '#c49028',
  },
  scoreboard: {
    width: 160,
    height: 72,
    opacity: 0.88,
    woodColor: '#5c3a1e',
    burnColor: '#e8c040',
  },
  sound: {
    goalTone: 523,
    duration: 0.4,
  },
};

export default function Fubin({ onHome }) {
  return (
    <div className="fubin-shell open">
      <button className="fubin-back" onClick={onHome}>
        Back
      </button>
      <FubinGame config={DEFAULT_CONFIG} mode="single" playerTwo={null} soloStart onHome={onHome} />
    </div>
  );
}
