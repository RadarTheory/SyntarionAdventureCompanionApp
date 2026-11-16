import { useCallback, useEffect, useRef, useState } from 'react';
import AstragalTray from './AstragalTray';
import { DICE_SKINS, resolveDice } from './lib/astragalDice.js';
import { COLORS } from './constants';
import { playSfxByKey } from './soundLibrary';
import { loadFinishes } from "./lib/diceFinishStore.js";
import { loadOfficialFinishes } from "./lib/diceFinishBundle.js";

const DIE_TYPES = [4, 6, 8, 10, 12, 20, 100];
const DICE_COUNTS = [1, 2, 3, 4, 5, 6, 8, 10];

function calculateModifier(score = 10) {
  return Math.floor((score - 10) / 2);
}

export default function Astragal(props) {
  const [finishes, setFinishes] = useState({});
  useEffect(() => {
    let active = true;
    Promise.allSettled([loadFinishes(), loadOfficialFinishes()]).then(([local, official]) => {
      if (!active) return;
      setFinishes({ ...local.value, ...official.value });
    });
    return () => { active = false; };
  }, []);
  return <AstragalRoller {...props} customFinishes={finishes} />;
}

export function AstragalRoller({
  character,
  actionName = 'Astragal',
  statKey = 'will',
  rollType = 'check',
  itemBonus = 0,
  conditionBonus = 0,
  occurrenceBonus = 0,
  temporaryBonus = 0,
  onResult,
  customFinishes = {},
  preferredSkin = null,
}) {
  const [dieSides, setDieSides] = useState(20);
  const [diceCount, setDiceCount] = useState(1);
  const [flatModifier, setFlatModifier] = useState(0);
  const [purpose, setPurpose] = useState('');
  const [mode, setMode] = useState('normal');
  const [rolling, setRolling] = useState(false);
  const [skin, setSkin] = useState('bone');
  const [trayStatus, setTrayStatus] = useState({ ready: false, error: null });
  const [rollError, setRollError] = useState(null);
  const trayRef = useRef(null), rollingRef = useRef(false), mountedRef = useRef(true);
  const handleTrayStatus = useCallback(status => setTrayStatus(status), []);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const savedIds = Object.keys(customFinishes).filter(id => id !== 'draft');
  const finishes = savedIds.length ? customFinishes : { bone: DICE_SKINS.bone, ...customFinishes };
  const selectedSkin = preferredSkin && finishes[preferredSkin] ? preferredSkin : finishes[skin] ? skin : savedIds[0] ?? 'bone';

  const effectiveDiceCount =
    dieSides === 20 && mode !== 'normal'
      ? 2
      : diceCount;

  const handleRoll = async () => {
    if (rollingRef.current || !trayStatus.ready) return;
    rollingRef.current = true;
    setRolling(true); setResult(null); setRollError(null);
    const rawScore = character?.stats?.[statKey] ?? character?.data?.stats?.[statKey] ?? 10;
    const statScore = Number.isFinite(Number(rawScore)) ? Number(rawScore) : 10;
    const statModifier = calculateModifier(statScore);
    const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
    const totalBonus = statModifier + [itemBonus, conditionBonus, occurrenceBonus, temporaryBonus, flatModifier].reduce((sum, value) => sum + number(value), 0);
    try {
      const physical = await trayRef.current.roll({ sides: dieSides, count: effectiveDiceCount, skin: finishes[selectedSkin] });
      if (!mountedRef.current) return;
      const resolved = resolveDice({ sides: dieSides, count: effectiveDiceCount, mode, physicalValues: physical.values });
      const payload = {
        type: 'ROLL', actorId: character?.id || null, actorName: character?.name || 'Unknown',
        actionName: purpose.trim() || actionName, rollType,
        notation: dieSides === 20 && mode !== 'normal'
          ? `${mode} d20${flatModifier >= 0 ? '+' : ''}${flatModifier}`
          : `${diceCount}d${dieSides}${flatModifier >= 0 ? '+' : ''}${flatModifier}`,
        statKey, statScore, statModifier, itemBonus: number(itemBonus), conditionBonus: number(conditionBonus),
        occurrenceBonus: number(occurrenceBonus), temporaryBonus: number(temporaryBonus), flatModifier: number(flatModifier),
        ...resolved, totalBonus, total: resolved.diceTotal + totalBonus, mode,
        timestamp: new Date().toISOString(), rollId: globalThis.crypto.randomUUID(),
        source: 'astragal-physics-v1', randomSource: 'web-crypto', skin: selectedSkin,
        physicalDice: physical.physicalDice, durationMs: physical.durationMs,
      };
      setResult(payload); setHistory(previous => [payload, ...previous.slice(0, 14)]);
      try {
        if (resolved.crit === 'critical_success') playSfxByKey('ui-dice-crit-success');
        if (resolved.crit === 'critical_failure') playSfxByKey('ui-dice-crit-fail');
      } catch { /* Audio must never invalidate a completed roll. */ }
      try { await onResult?.(payload); }
      catch { if (mountedRef.current) setRollError('Your roll stands, but the campaign log could not save it. Keep this result.'); }
    } catch (error) {
      if (mountedRef.current) setRollError(error.message || 'The cast could not finish. Please try again.');
    } finally {
      rollingRef.current = false;
      if (mountedRef.current) setRolling(false);
    }
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
          aria-label="Number of dice"
          value={diceCount}
          onChange={e => setDiceCount(Number(e.target.value))}
          disabled={rolling || (dieSides === 20 && mode !== 'normal')}
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
          aria-label="Die type"
          disabled={rolling}
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
          disabled={rolling}
          value={flatModifier}
          onChange={e => setFlatModifier(Number(e.target.value))}
          title="Flat modifier"
          aria-label="Flat modifier"
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
              disabled={rolling}
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
        type="button"
        onClick={handleRoll}
        disabled={rolling || !trayStatus.ready}
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

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: COLORS.dim, fontSize: 11 }}>
        Dice finish
        <select aria-label="Dice finish" value={selectedSkin} onChange={event => setSkin(event.target.value)} disabled={rolling || !!preferredSkin} style={{ ...selectStyle, minWidth: 0 }}>
          {Object.entries(finishes).map(([id, finish]) => <option key={id} value={id} style={{ background: '#231d17' }}>{finish.name}</option>)}
        </select>
      </label>
      {onResult && (
        <label style={{ display: 'grid', gap: 6, marginBottom: 10, color: COLORS.dim, fontSize: 11 }}>
          Roll purpose
          <input
            value={purpose}
            onChange={event => setPurpose(event.target.value)}
            disabled={rolling}
            maxLength={120}
            placeholder="e.g. Search the room"
            style={selectStyle}
          />
        </label>
      )}
      <AstragalTray ref={trayRef} onStatus={handleTrayStatus} critical={result?.crit} logo={finishes[result?.skin]?.logo} />
      <div role="status" aria-live="polite" style={{ color: COLORS.dim, fontSize: 10, lineHeight: 1.5, marginBottom: 12 }}>
        {rolling && !result ? 'Dice in motion — waiting for them to settle.' : result ? (result.crit === 'critical_success' ? 'Natural 20. Critical success.' : result.crit === 'critical_failure' ? 'Natural 1. Critical failure.' : 'Cast complete · the settled faces are your result.') : trayStatus.ready ? 'Physical dice · cast to roll.' : trayStatus.error ? '3D tray unavailable.' : 'Preparing the dice tray…'}
        {dieSides === 100 && <div>Each d100 is one die numbered 1–100.</div>}
        {dieSides === 4 && <div>Read the d4 at its upper point.</div>}
      </div>
      {(rollError || trayStatus.error) && <div role="alert" style={{ color: '#efb98a', fontSize: 12, lineHeight: 1.5, marginBottom: 12 }}>{rollError || trayStatus.error}</div>}

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
