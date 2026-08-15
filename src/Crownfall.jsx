import { useState } from 'react';
import { GameBackButton, GameButton, GameOverlay, GamePanel } from './GameUI';
import { recordLotjarrsGameResult } from './gameStats';
import { useDevice } from './useDevice';

const MAX_PLAYERS = 8;
const START_INFLUENCE = 3;
const CARD_TYPES = ['Blade', 'Veil', 'Coin', 'Oath', 'Spy', 'Usurper', 'Witness', 'Mercy'];
const CLAIMS = ['The Heir', 'The Butcher', 'The Loyalist', 'The Betrayer', 'The Pretender', 'The Martyr'];
const COLORS = ['#f0d06f', '#d87b72', '#8fc6ff', '#9fe0a2', '#c5a5ff', '#e8a75d', '#7fd5bd', '#e6a8d7'];

const CARD_TEXT = {
  Blade: 'Adds +1 power to your next accusation.',
  Veil: 'Reduces accusations against you by 1 this round.',
  Coin: 'Gain +1 Influence immediately.',
  Oath: 'Protect another claimant from 1 accusation this round.',
  Spy: 'Reveal a claimant claim or wager in the court log.',
  Usurper: 'During Fall Defense, redirect one accusation back at an accuser.',
  Witness: 'Force a claimant accusation to be public.',
  Mercy: 'During Fall Defense, prevent your Fall once.',
};

const RULES = [
  'Crownfall is a 6-8 player hot-seat court game of hidden wagers, accusations, and survival.',
  'Each claimant starts with 3 Influence, a secret Claim, and one hidden Favor wager on another claimant.',
  'Each round, surviving claimants draw one Court Card, scheme, then secretly accuse another claimant.',
  'The claimant with the most accusation power becomes Marked. The Black Mark loses accusation ties.',
  'A Marked claimant may spend Influence or use defensive cards to survive. Otherwise they Fall.',
  'Fallen claimants get a Last Word: Curse, Bequeath, Expose, or Silence.',
  'When only two claimants remain, they choose Claim, Strike, or Yield in a final hidden showdown.',
  'Personal victory scores 3 points. Each Favor wager placed behind the winner scores 1 point.',
];

function shuffle(items) {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function makeDeck() {
  return shuffle(Array.from({ length: 4 }).flatMap((_, set) => CARD_TYPES.map((type) => ({ id: `${type}-${set}-${Math.random()}`, type }))));
}

function makePlayers(names, count) {
  const claims = shuffle(Array.from({ length: count }, (_, i) => CLAIMS[i % CLAIMS.length]));
  return names.slice(0, count).map((name, i) => ({
    id: `p${i}`,
    name: name.trim() || `Claimant ${i + 1}`,
    color: COLORS[i],
    influence: START_INFLUENCE,
    claim: claims[i],
    cards: [],
    wagerTargetId: '',
    eliminated: false,
    accusationTargetId: '',
    accusationPower: 1,
    veil: 0,
    protectedBy: '',
    witnessTargetId: '',
  }));
}

function activePlayers(players) {
  return players.filter((player) => !player.eliminated);
}

function phaseName(phase) {
  return {
    lobby: 'Court Gathering',
    wager: 'The Secret Favor',
    draw: 'Draw Court Cards',
    scheme: 'Scheme & Whispers',
    accuse: 'Simultaneous Accusation',
    fall: 'Fall Defense',
    lastword: 'Last Word',
    final: 'Final Two',
    gameover: 'Coronation',
  }[phase] || phase;
}

export default function Crownfall({ onExit }) {
  const { isMobile } = useDevice();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [phase, setPhase] = useState('lobby');
  const [lobbyCount, setLobbyCount] = useState(6);
  const [names, setNames] = useState(['Aurel', 'Vesper', 'Corvin', 'Marrow', 'Selene', 'Bastien', 'Ivara', 'Renwick']);
  const [ready, setReady] = useState(Array.from({ length: MAX_PLAYERS }, () => false));
  const [players, setPlayers] = useState(() => makePlayers(names, lobbyCount));
  const [deck, setDeck] = useState(() => makeDeck());
  const [round, setRound] = useState(1);
  const [turnIndex, setTurnIndex] = useState(0);
  const [blackMarkHolderId, setBlackMarkHolderId] = useState('');
  const [markedId, setMarkedId] = useState('');
  const [winnerId, setWinnerId] = useState('');
  const [finalActions, setFinalActions] = useState({});
  const [lastFallenId, setLastFallenId] = useState('');
  const [log, setLog] = useState(['The court has not yet gathered.']);

  const allReady = ready.slice(0, lobbyCount).every(Boolean);
  const survivors = activePlayers(players);
  const current = survivors[turnIndex % Math.max(survivors.length, 1)];
  const winner = players.find((player) => player.id === winnerId);

  const addLog = (message) => setLog((items) => [message, ...items].slice(0, 10));

  const start = () => {
    const nextPlayers = makePlayers(names, lobbyCount);
    setPlayers(nextPlayers);
    setDeck(makeDeck());
    setRound(1);
    setTurnIndex(0);
    setBlackMarkHolderId(nextPlayers[0].id);
    setMarkedId('');
    setWinnerId('');
    setFinalActions({});
    setLastFallenId('');
    setLog(['The crowns are set before the empty throne. Place secret Favor wagers.']);
    setPhase('wager');
  };

  const updatePlayer = (id, patch) => {
    setPlayers((items) => items.map((player) => (player.id === id ? { ...player, ...patch } : player)));
  };

  const nextTurnOr = (nextPhase) => {
    if (turnIndex + 1 >= survivors.length) {
      setTurnIndex(0);
      setPhase(nextPhase);
      return;
    }
    setTurnIndex((index) => index + 1);
  };

  const placeWager = (targetId) => {
    if (!current || targetId === current.id) return;
    updatePlayer(current.id, { wagerTargetId: targetId });
    addLog(`${current.name} places a sealed Favor.`);
    nextTurnOr('draw');
  };

  const drawCards = () => {
    let nextDeck = [...deck];
    const nextPlayers = players.map((player) => {
      if (player.eliminated) return player;
      if (nextDeck.length === 0) nextDeck = makeDeck();
      const [card, ...rest] = nextDeck;
      nextDeck = rest;
      return { ...player, cards: [...player.cards, card] };
    });
    setDeck(nextDeck);
    setPlayers(nextPlayers);
    setPhase('scheme');
    setTurnIndex(0);
    addLog(`Round ${round}: surviving claimants draw Court Cards.`);
  };

  const playCard = (cardId, targetId = '') => {
    const card = current?.cards.find((item) => item.id === cardId);
    if (!current || !card) return;
    const removeCard = (player) => ({ ...player, cards: player.cards.filter((item) => item.id !== cardId) });
    let nextPlayers = players.map((player) => (player.id === current.id ? removeCard(player) : player));
    const setFor = (id, fn) => {
      nextPlayers = nextPlayers.map((player) => (player.id === id ? fn(player) : player));
    };

    if (card.type === 'Coin') setFor(current.id, (player) => ({ ...player, influence: player.influence + 1 }));
    if (card.type === 'Blade') setFor(current.id, (player) => ({ ...player, accusationPower: player.accusationPower + 1 }));
    if (card.type === 'Veil') setFor(current.id, (player) => ({ ...player, veil: player.veil + 1 }));
    if (card.type === 'Oath' && targetId) setFor(targetId, (player) => ({ ...player, protectedBy: current.id }));
    if (card.type === 'Witness' && targetId) setFor(targetId, (player) => ({ ...player, witnessTargetId: current.id }));
    if (card.type === 'Spy' && targetId) {
      const target = nextPlayers.find((player) => player.id === targetId);
      const wagerTarget = nextPlayers.find((player) => player.id === target?.wagerTargetId);
      addLog(`${current.name} spies on ${target?.name}: ${target?.claim}, Favor behind ${wagerTarget?.name || 'no one'}.`);
    } else {
      addLog(`${current.name} plays ${card.type}.`);
    }

    setPlayers(nextPlayers);
  };

  const passScheme = () => {
    nextTurnOr('accuse');
    if (turnIndex + 1 >= survivors.length) addLog('The hall goes quiet. Accusations are chosen.');
  };

  const accuse = (targetId) => {
    if (!current || targetId === current.id) return;
    const nextPlayers = players.map((player) => (player.id === current.id ? { ...player, accusationTargetId: targetId } : player));
    setPlayers(nextPlayers);
    const target = players.find((player) => player.id === targetId);
    addLog(current.witnessTargetId ? `${current.name} is witnessed accusing ${target?.name}.` : `${current.name} seals an accusation.`);
    if (turnIndex + 1 >= survivors.length) resolveAccusations(nextPlayers);
    else setTurnIndex((index) => index + 1);
  };

  const resolveAccusations = (sourcePlayers = players) => {
    const sourceSurvivors = activePlayers(sourcePlayers);
    const totals = {};
    sourceSurvivors.forEach((player) => {
      if (!player.accusationTargetId) return;
      totals[player.accusationTargetId] = (totals[player.accusationTargetId] || 0) + player.accusationPower;
    });
    sourcePlayers.forEach((player) => {
      if (!player.eliminated) totals[player.id] = Math.max(0, (totals[player.id] || 0) - player.veil - (player.protectedBy ? 1 : 0));
    });
    const max = Math.max(...Object.values(totals), 0);
    const tied = Object.keys(totals).filter((id) => totals[id] === max);
    const marked = tied.includes(blackMarkHolderId) ? blackMarkHolderId : tied[0];
    setMarkedId(marked);
    setPhase('fall');
    setTurnIndex(0);
    addLog(`${sourcePlayers.find((p) => p.id === marked)?.name} is Marked by the court.`);
  };

  const defend = (method) => {
    const marked = players.find((player) => player.id === markedId);
    if (!marked) return;
    const has = (type) => marked.cards.find((card) => card.type === type);
    if (method === 'influence' && marked.influence > 0) {
      const nextPlayers = players.map((player) => (player.id === marked.id ? { ...player, influence: player.influence - 1 } : player));
      beginNextRound(`${marked.name} spends Influence and survives.`, nextPlayers);
      return;
    }
    if (method === 'mercy' && has('Mercy')) {
      const nextPlayers = players.map((player) => (player.id === marked.id ? { ...player, cards: player.cards.filter((card) => card.id !== has('Mercy').id) } : player));
      beginNextRound(`${marked.name} is spared by Mercy.`, nextPlayers);
      return;
    }
    if (method === 'usurper' && has('Usurper')) {
      const nextPlayers = players.map((player) => (player.id === marked.id ? { ...player, cards: player.cards.filter((card) => card.id !== has('Usurper').id), influence: player.influence + 1 } : player));
      beginNextRound(`${marked.name} turns the accusation aside with Usurper.`, nextPlayers);
      return;
    }
    fall(marked.id);
  };

  const fall = (id) => {
    const fallen = players.find((player) => player.id === id);
    const nextPlayers = players.map((player) => (player.id === id ? { ...player, eliminated: true } : player));
    setPlayers(nextPlayers);
    setLastFallenId(id);
    setBlackMarkHolderId(id);
    addLog(`${fallen?.name} Falls. Their crown is laid beside the throne.`);
    if (activePlayers(nextPlayers).length <= 2) {
      setPhase('final');
      setFinalActions({});
    } else {
      setPhase('lastword');
    }
  };

  const lastWord = (action, targetId = '') => {
    const fallen = players.find((player) => player.id === lastFallenId);
    let nextPlayers = players.map((player) => ({ ...player }));
    const target = nextPlayers.find((player) => player.id === targetId);
    if (action === 'Curse' && target) target.influence = Math.max(0, target.influence - 1);
    if (action === 'Bequeath' && target) target.influence += 1;
    if (action === 'Expose' && target) addLog(`${fallen?.name} exposes ${target.name}: ${target.claim}.`);
    beginNextRound(`${fallen?.name}'s Last Word: ${action}.`, nextPlayers);
  };

  const beginNextRound = (message, nextPlayers = players) => {
    const cleansed = nextPlayers.map((player) => ({
      ...player,
      accusationTargetId: '',
      accusationPower: 1,
      veil: 0,
      protectedBy: '',
      witnessTargetId: '',
    }));
    setPlayers(cleansed);
    setMarkedId('');
    setRound((value) => value + 1);
    setTurnIndex(0);
    setPhase('draw');
    addLog(message);
  };

  const chooseFinal = (action) => {
    if (!current) return;
    const next = { ...finalActions, [current.id]: action };
    setFinalActions(next);
    addLog(`${current.name} chooses their final gesture.`);
    if (Object.keys(next).length >= 2) resolveFinal(next);
    else setTurnIndex(1);
  };

  const resolveFinal = (actions) => {
    const [a, b] = survivors;
    const aw = actions[a.id];
    const bw = actions[b.id];
    let winnerPlayer = null;
    if (aw === bw) {
      winnerPlayer = a.influence === b.influence ? (a.id === blackMarkHolderId ? b : a) : (a.influence > b.influence ? a : b);
    } else if ((aw === 'Claim' && bw === 'Yield') || (aw === 'Strike' && bw === 'Claim') || (aw === 'Yield' && bw === 'Strike')) {
      winnerPlayer = a;
    } else {
      winnerPlayer = b;
    }
    setWinnerId(winnerPlayer.id);
    setPhase('gameover');
    const favorPoints = players.filter((player) => player.wagerTargetId === winnerPlayer.id).length;
    recordLotjarrsGameResult('crownfall', {
      playerName: winnerPlayer.name,
      outcome: 'win',
      score: 3 + favorPoints,
      scoreLabel: `${3 + favorPoints} favor`,
      meta: { winner: winnerPlayer.name, final: actions },
    });
    addLog(`${winnerPlayer.name} claims the Crown.`);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% 0%, rgba(151,105,35,0.2), transparent 34%), linear-gradient(145deg, #080604, #15100c 55%, #050403)', color: '#eadfc6', fontFamily: 'Georgia, serif', padding: '76px 24px 26px', boxSizing: 'border-box' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&display=swap');`}</style>
      <GameBackButton onClick={onExit} />
      <main style={{ width: 'min(1220px, 100%)', margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(430px, 1fr) minmax(330px, 390px)', gap: 18, alignItems: 'start' }}>
        <section>
          <Header phase={phase} round={round} survivors={survivors.length} count={players.length || lobbyCount} onRules={() => setRulesOpen(true)} onRestart={() => setPhase('lobby')} />
          {phase === 'lobby' ? (
            <Lobby names={names} setNames={setNames} ready={ready} setReady={setReady} count={lobbyCount} setCount={setLobbyCount} allReady={allReady} onStart={start} />
          ) : (
            <Court players={players} blackMarkHolderId={blackMarkHolderId} markedId={markedId} winnerId={winnerId} />
          )}
        </section>
        <aside style={{ display: 'grid', gap: 14 }}>
          {phase !== 'lobby' && <ActionPanel phase={phase} current={current} players={players} markedId={markedId} finalActions={finalActions} onWager={placeWager} onDraw={drawCards} onPlayCard={playCard} onPassScheme={passScheme} onAccuse={accuse} onDefend={defend} onLastWord={lastWord} onFinal={chooseFinal} />}
          {phase === 'gameover' && winner && <GamePanel title="Coronation"><p style={{ marginTop: 0, color: '#f0dfad' }}>{winner.name} wins Crownfall.</p><ScoreTable players={players} winnerId={winnerId} /><GameButton variant="primary" full onClick={() => setPhase('lobby')}>New Court</GameButton></GamePanel>}
          <GamePanel title="Court Log">
            <div style={{ display: 'grid', gap: 8 }}>{log.map((item, i) => <div key={`${item}-${i}`} style={{ color: i === 0 ? '#f0dfad' : 'rgba(234,223,198,0.58)', fontSize: 12, lineHeight: 1.4 }}>{item}</div>)}</div>
          </GamePanel>
        </aside>
      </main>
      <Rulebook open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}

function Header({ phase, round, survivors, count, onRules, onRestart }) {
  return (
    <GamePanel style={{ marginBottom: 16, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.22em', color: 'rgba(240,208,111,0.66)', textTransform: 'uppercase', marginBottom: 7 }}>Lotjarr's Bag of Games</div>
          <h1 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: 34, letterSpacing: '0.11em', color: '#f0dfad' }}>Crownfall</h1>
          <div style={{ marginTop: 7, color: 'rgba(234,223,198,0.64)', fontSize: 13 }}>{phaseName(phase)} / Round {round}</div>
        </div>
        <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
          <Badge label="Claimants" value={`${survivors}/${count}`} />
          <GameButton onClick={onRules}>Rules</GameButton>
          <GameButton onClick={onRestart}>Lobby</GameButton>
        </div>
      </div>
    </GamePanel>
  );
}

function Badge({ label, value }) {
  return <div style={{ minWidth: 92, border: '1px solid rgba(215,180,90,0.24)', borderRadius: 10, padding: '8px 10px', background: 'rgba(8,6,4,0.42)' }}><div style={{ fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.14em', color: 'rgba(234,223,198,0.5)', textTransform: 'uppercase' }}>{label}</div><b style={{ color: '#f0dfad' }}>{value}</b></div>;
}

function Lobby({ names, setNames, ready, setReady, count, setCount, allReady, onStart }) {
  return (
    <GamePanel title="Court Lobby">
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>{[6, 7, 8].map((n) => <GameButton key={n} active={count === n} onClick={() => setCount(n)} style={{ flex: 1 }}>{n} Players</GameButton>)}</div>
      <div style={{ display: 'grid', gap: 9 }}>{names.slice(0, count).map((name, i) => <div key={i} style={{ display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 10, alignItems: 'center' }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i] }} /><input value={name} onChange={(e) => { const next = [...names]; next[i] = e.target.value; setNames(next); }} style={{ minHeight: 38, borderRadius: 8, border: '1px solid rgba(215,180,90,0.22)', background: 'rgba(8,6,4,0.52)', color: '#eadfc6', padding: '0 11px', fontFamily: 'Georgia, serif' }} /><GameButton active={ready[i]} onClick={() => { const next = [...ready]; next[i] = !next[i]; setReady(next); }}>{ready[i] ? 'Ready' : 'Unready'}</GameButton></div>)}</div>
      <GameButton variant="primary" full disabled={!allReady} onClick={onStart} style={{ marginTop: 16 }}>Begin Crownfall</GameButton>
    </GamePanel>
  );
}

function Court({ players, blackMarkHolderId, markedId, winnerId }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>{players.map((player) => <GamePanel key={player.id} style={{ opacity: player.eliminated ? 0.44 : 1, borderColor: player.id === markedId ? 'rgba(216,111,102,0.8)' : player.id === winnerId ? 'rgba(191,224,122,0.8)' : undefined }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><div><div style={{ fontFamily: "'Cinzel', serif", color: player.color, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{player.name}</div><div style={{ fontSize: 12, color: 'rgba(234,223,198,0.58)', marginTop: 5 }}>{player.eliminated ? 'Fallen' : `${player.influence} Influence`}</div></div><div style={{ color: player.id === blackMarkHolderId ? '#c5a5ff' : 'rgba(234,223,198,0.28)', fontFamily: "'Cinzel', serif" }}>{player.id === blackMarkHolderId ? 'Mark' : ''}</div></div><div style={{ marginTop: 12, fontSize: 12, color: 'rgba(234,223,198,0.62)' }}>Claim: {player.claim}</div><div style={{ marginTop: 8, fontSize: 12, color: 'rgba(234,223,198,0.46)' }}>Cards: {player.cards.length}</div></GamePanel>)}</div>;
}

function ActionPanel({ phase, current, players, markedId, finalActions, onWager, onDraw, onPlayCard, onPassScheme, onAccuse, onDefend, onLastWord, onFinal }) {
  const [target, setTarget] = useState('');
  if (!current && phase !== 'draw') return null;
  const targets = players.filter((player) => !player.eliminated && player.id !== current?.id);
  const marked = players.find((player) => player.id === markedId);
  return (
    <GamePanel title="Action">
      {phase === 'wager' && <><Lead current={current} text="Place your hidden Favor behind another claimant." /><Select targets={targets} value={target} onChange={setTarget} /><GameButton variant="primary" full disabled={!target} onClick={() => { onWager(target); setTarget(''); }}>Seal Favor</GameButton></>}
      {phase === 'draw' && <><p style={{ color: 'rgba(234,223,198,0.66)', lineHeight: 1.5 }}>Deal one Court Card to each surviving claimant.</p><GameButton variant="primary" full onClick={onDraw}>Draw Cards</GameButton></>}
      {phase === 'scheme' && <><Lead current={current} text="Play one Court Card, or pass." /><div style={{ display: 'grid', gap: 8 }}>{current.cards.map((card) => <div key={card.id} style={{ border: '1px solid rgba(215,180,90,0.2)', borderRadius: 9, padding: 10 }}><b style={{ color: '#f0dfad' }}>{card.type}</b><div style={{ color: 'rgba(234,223,198,0.58)', fontSize: 12, margin: '5px 0 8px' }}>{CARD_TEXT[card.type]}</div>{['Oath', 'Spy', 'Witness'].includes(card.type) && <Select targets={targets} value={target} onChange={setTarget} />}<GameButton full onClick={() => { onPlayCard(card.id, target); setTarget(''); }}>Play</GameButton></div>)}</div><GameButton variant="primary" full onClick={onPassScheme} style={{ marginTop: 10 }}>Pass Scheme</GameButton></>}
      {phase === 'accuse' && <><Lead current={current} text={`Choose an accusation target. Power: ${current.accusationPower}.`} /><Select targets={targets} value={target} onChange={setTarget} /><GameButton variant="primary" full disabled={!target} onClick={() => { onAccuse(target); setTarget(''); }}>Accuse</GameButton></>}
      {phase === 'fall' && marked && <><Lead current={marked} text="The court has Marked this claimant." /><div style={{ display: 'grid', gap: 8 }}><GameButton full disabled={marked.influence <= 0} onClick={() => onDefend('influence')}>Spend Influence</GameButton><GameButton full disabled={!marked.cards.some((card) => card.type === 'Mercy')} onClick={() => onDefend('mercy')}>Play Mercy</GameButton><GameButton full disabled={!marked.cards.some((card) => card.type === 'Usurper')} onClick={() => onDefend('usurper')}>Play Usurper</GameButton><GameButton variant="danger" full onClick={() => onDefend('fall')}>Fall</GameButton></div></>}
      {phase === 'lastword' && <><p style={{ color: 'rgba(234,223,198,0.66)' }}>The fallen claimant speaks once more.</p><Select targets={players.filter((p) => !p.eliminated)} value={target} onChange={setTarget} /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{['Curse', 'Bequeath', 'Expose', 'Silence'].map((action) => <GameButton key={action} onClick={() => { onLastWord(action, target); setTarget(''); }}>{action}</GameButton>)}</div></>}
      {phase === 'final' && <><Lead current={current} text="Final Two: Claim beats Yield, Strike beats Claim, Yield beats Strike." /><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>{['Claim', 'Strike', 'Yield'].map((action) => <GameButton key={action} active={finalActions[current.id] === action} onClick={() => onFinal(action)}>{action}</GameButton>)}</div></>}
    </GamePanel>
  );
}

function Lead({ current, text }) {
  return <div style={{ marginBottom: 12 }}><div style={{ fontFamily: "'Cinzel', serif", color: current.color, fontSize: 14, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{current.name}</div><div style={{ color: 'rgba(234,223,198,0.62)', fontSize: 12, marginTop: 5 }}>{text}</div></div>;
}

function Select({ targets, value, onChange }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: '100%', minHeight: 38, borderRadius: 8, border: '1px solid rgba(215,180,90,0.24)', background: '#100c08', color: '#eadfc6', padding: '0 10px', marginBottom: 10 }}><option value="">Choose target...</option>{targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}</select>;
}

function ScoreTable({ players, winnerId }) {
  return <div style={{ display: 'grid', gap: 7, marginBottom: 14 }}>{players.map((player) => { const points = (player.id === winnerId ? 3 : 0) + players.filter((p) => p.wagerTargetId === player.id && player.id === winnerId).length; return <div key={player.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', color: player.id === winnerId ? '#f0dfad' : 'rgba(234,223,198,0.58)', fontSize: 12 }}><span>{player.name}</span><b>{points}</b></div>; })}</div>;
}

function Rulebook({ open, onClose }) {
  return <GameOverlay open={open} onClose={onClose}><div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.2em', color: '#f0d06f', textTransform: 'uppercase', marginBottom: 12 }}>Rulebook</div><h2 style={{ margin: '0 0 14px', fontFamily: "'Cinzel', serif", color: '#f0dfad' }}>Crownfall</h2><ol style={{ margin: '0 0 20px', paddingLeft: 20, textAlign: 'left', display: 'grid', gap: 9, color: 'rgba(234,223,198,0.72)', fontSize: 13, lineHeight: 1.45 }}>{RULES.map((rule) => <li key={rule}>{rule}</li>)}</ol><GameButton variant="primary" full onClick={onClose}>Return</GameButton></GameOverlay>;
}
