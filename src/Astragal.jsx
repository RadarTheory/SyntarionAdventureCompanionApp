import { useState } from 'react';
import { COLORS } from './constants';

const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const DICE_COUNTS = [1, 2, 3, 4, 5, 6, 8, 10];

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function calculateModifier(score = 10) {
  return Math.floor((score - 10) / 2);
}

function getCritState(dieSides, diceResults, mode) {
  if (dieSides !== 20) return null;

  const natural = mode === 'disadvantage'
    ? Math.min(...diceResults)
    : mode === 'advantage'
      ? Math.max(...diceResults)
      : diceResults[0];

  if (natural === 20) return 'critical_success';
  if (natural === 1) return 'critical_failure';

  return null;
}

export default function Astragal({
  character,
  actionName = 'Astragal',
  statKey = 'will',
  rollType = 'check',
  itemBonus = 0,
  conditionBonus = 0,
  occurrenceBonus = 0,
  temporaryBonus = 0,
  onResult,
}) {
  const [dieSides, setDieSides] = useState(20);
  const [diceCount, setDiceCount] = useState(1);
  const [flatModifier, setFlatModifier] = useState(0);
  const [mode, setMode] = useState('normal');
  const [rolling, setRolling] = useState(false);
  const [diceFaces, setDiceFaces] = useState([]);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const effectiveDiceCount =
    dieSides === 20 && mode !== 'normal'
      ? 2
      : diceCount;

  const handleRoll = () => {
    if (rolling) return;

    setRolling(true);
    setResult(null);

    const statScore = character?.stats?.[statKey] || 10;
    const statModifier = calculateModifier(statScore);

    const totalBonus =
      statModifier +
      itemBonus +
      conditionBonus +
      occurrenceBonus +
      temporaryBonus +
      flatModifier;

    let ticks = 0;

    const interval = setInterval(() => {
      setDiceFaces(
        Array.from(
          { length: effectiveDiceCount },
          () => rollDie(dieSides)
        )
      );

      ticks += 1;

      if (ticks >= 14) {
        clearInterval(interval);

        const finalRolls = Array.from(
          { length: effectiveDiceCount },
          () => rollDie(dieSides)
        );

        let usedRolls = finalRolls;

        if (dieSides === 20 && mode === 'advantage') {
          usedRolls = [Math.max(...finalRolls)];
        }

        if (dieSides === 20 && mode === 'disadvantage') {
          usedRolls = [Math.min(...finalRolls)];
        }

        const diceTotal = usedRolls.reduce((sum, n) => sum + n, 0);
        const total = diceTotal + totalBonus;
        const crit = getCritState(dieSides, finalRolls, mode);

        const payload = {
          type: 'ROLL',
          actorId: character?.id || null,
          actorName: character?.name || 'Unknown',
          actionName,
          rollType,
          notation:
            dieSides === 20 && mode !== 'normal'
              ? `${mode} d20${flatModifier >= 0 ? '+' : ''}${flatModifier}`
              : `${diceCount}d${dieSides}${flatModifier >= 0 ? '+' : ''}${flatModifier}`,
          statKey,
          statScore,
          statModifier,
          itemBonus,
          conditionBonus,
          occurrenceBonus,
          temporaryBonus,
          flatModifier,
          diceResults: finalRolls,
          usedRolls,
          diceTotal,
          totalBonus,
          total,
          crit,
          mode,
          timestamp: new Date().toISOString(),
        };

        setDiceFaces(finalRolls);
        setResult(payload);
        setHistory(prev => [payload, ...prev.slice(0, 14)]);
        setRolling(false);

        onResult?.(payload);
      }
    }, 70);
  };

  const selectStyle = {
    flex: 1,
    background: 'rgba(240,238,235,0.06)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    padding: 8,
    color: COLORS.text,
    fontFamily: "'Cinzel', serif",
    outline: 'none',
  };

  return (
    <div
      style={{
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.text,
          }}
        >
          Astragal
        </div>

        <div
          style={{
            fontSize: 10,
            color: COLORS.dim,
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            marginTop: 2,
          }}
        >
          Fate cast in bone
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <select
          value={diceCount}
          onChange={e => setDiceCount(Number(e.target.value))}
          disabled={dieSides === 20 && mode !== 'normal'}
          style={{
          ...selectStyle,
          background: '#2b2118',
          color: '#f0eeeb',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
        }}
        >
          {DICE_COUNTS.map(n => (
           <option
          key={n}
          value={n}
          style={{
            background: '#2b2118',
            color: '#f0eeeb',
          }}
        >
          {n}
        </option>
          ))}
        </select>

              <select
          value={dieSides}
          onChange={e => setDieSides(Number(e.target.value))}
          style={{
            ...selectStyle,
            background: '#2b2118',
            color: '#f0eeeb',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
          }}
        >
          {DIE_TYPES.map(sides => (
            <option
              key={sides}
              value={sides}
              style={{
                background: '#2b2118',
                color: '#f0eeeb',
              }}
            >
              d{sides}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={flatModifier}
          onChange={e => setFlatModifier(Number(e.target.value))}
          title="Flat modifier"
          style={{
            width: 72,
            background: 'rgba(240,238,235,0.06)',
            border: `1px solid ${COLORS.border}`,
            borderRadius: 6,
            padding: 8,
            color: COLORS.text,
            fontFamily: "'Cinzel', serif",
            textAlign: 'center',
            outline: 'none',
          }}
        />
      </div>

      {dieSides === 20 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {[
            ['normal', 'Normal'],
            ['advantage', 'Adv'],
            ['disadvantage', 'Dis'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              style={{
                flex: 1,
                background:
                  mode === value
                    ? COLORS.magicBg
                    : 'rgba(240,238,235,0.04)',
                border: `1px solid ${
                  mode === value ? COLORS.magic : COLORS.border
                }`,
                borderRadius: 6,
                padding: '7px 8px',
                cursor: 'pointer',
                color: mode === value ? COLORS.magicText : COLORS.dim,
                fontFamily: "'Cinzel', serif",
                fontSize: 8,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={handleRoll}
        disabled={rolling}
        style={{
          width: '100%',
          background: COLORS.magicBg,
          border: `1px solid ${COLORS.magic}`,
          borderRadius: 8,
          padding: '10px 14px',
          cursor: rolling ? 'default' : 'pointer',
          color: COLORS.magicText,
          fontFamily: "'Cinzel', serif",
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          opacity: rolling ? 0.6 : 1,
          marginBottom: 14,
        }}
      >
        {rolling
          ? 'Rolling…'
          : dieSides === 20 && mode !== 'normal'
            ? `Roll ${mode}`
            : `Roll ${diceCount}d${dieSides}`}
      </button>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 14,
        }}
      >
        {diceFaces.map((face, i) => (
          <div
            key={`${face}-${i}`}
            style={{
              width: 52,
              height: 52,
              borderRadius: 10,
              background: 'rgba(240,238,235,0.05)',
              border: `1px solid ${COLORS.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Cinzel', serif",
              fontSize: 20,
              color: COLORS.text,
              transform: rolling
                ? `rotate(${(i + 1) * 24}deg) scale(1.04)`
                : 'rotate(0deg) scale(1)',
              transition: 'all 0.08s ease',
            }}
          >
            {face}
          </div>
        ))}
      </div>

      {result && (
        <div
          style={{
            background: 'rgba(240,238,235,0.03)',
            border: `1px solid ${
              result.crit === 'critical_success'
                ? COLORS.magic
                : result.crit === 'critical_failure'
                  ? COLORS.warn
                  : COLORS.border
            }`,
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color:
                result.crit === 'critical_success'
                  ? COLORS.magic
                  : result.crit === 'critical_failure'
                    ? COLORS.warn
                    : COLORS.dim,
              marginBottom: 8,
            }}
          >
            {result.crit === 'critical_success'
              ? 'Critical Success'
              : result.crit === 'critical_failure'
                ? 'Critical Failure'
                : 'Roll Result'}
          </div>

          <div
            style={{
              fontSize: 28,
              fontFamily: "'Cinzel', serif",
              color:
                result.crit === 'critical_failure'
                  ? COLORS.warn
                  : COLORS.magic,
              marginBottom: 10,
            }}
          >
            {result.total}
          </div>

          <div
            style={{
              fontSize: 11,
              color: COLORS.textSub,
              fontFamily: 'Georgia, serif',
              lineHeight: 1.7,
            }}
          >
            Dice: {result.diceResults.join(', ')}
            <br />
            Used: {result.usedRolls.join(', ')}
            <br />
            Dice Total: {result.diceTotal}
            <br />
            Stat Modifier: {result.statModifier >= 0 ? '+' : ''}
            {result.statModifier}
            <br />
            Flat Modifier: {result.flatModifier >= 0 ? '+' : ''}
            {result.flatModifier}
            <br />
            Total Bonus: {result.totalBonus >= 0 ? '+' : ''}
            {result.totalBonus}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: 8,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.dim,
              marginBottom: 8,
            }}
          >
            Recent Casts
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 120,
              overflowY: 'auto',
            }}
          >
            {history.slice(0, 5).map((entry, i) => (
              <div
                key={`${entry.timestamp}-${i}`}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  fontSize: 10,
                  color: COLORS.textSub,
                  fontFamily: 'Georgia, serif',
                  borderBottom: `1px solid ${COLORS.border}`,
                  paddingBottom: 5,
                }}
              >
                <span>{entry.notation}</span>
                <span>{entry.total}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}