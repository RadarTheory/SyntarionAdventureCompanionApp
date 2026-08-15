import { useMemo, useState } from 'react';
import { GameBackButton, GameButton, GamePanel, GameOverlay } from './GameUI';
import { recordLotjarrsGameResult } from './gameStats';
import { useDevice } from './useDevice';

const BOARD_SIZE = 7;
const MAX_DISSONANCE = 8;
const PHRASE_LIMIT = 12;

const NOTES = [
  { id: 'root', name: 'Root', mark: 'R', color: '#8fcd91', bg: 'rgba(89,139,86,0.28)' },
  { id: 'river', name: 'River', mark: 'V', color: '#7ccbe3', bg: 'rgba(66,139,164,0.26)' },
  { id: 'stone', name: 'Stone', mark: 'T', color: '#d2c5a8', bg: 'rgba(160,144,112,0.24)' },
  { id: 'wind', name: 'Wind', mark: 'W', color: '#dfe8ba', bg: 'rgba(197,210,143,0.22)' },
  { id: 'leaf', name: 'Leaf', mark: 'L', color: '#b7df70', bg: 'rgba(130,172,64,0.23)' },
  { id: 'moon', name: 'Moon', mark: 'M', color: '#d5c5ff', bg: 'rgba(151,128,208,0.24)' },
  { id: 'silence', name: 'Silence', mark: '-', color: '#c5bda8', bg: 'rgba(190,180,154,0.16)' },
];

const VOICES = [
  { id: 'aelir', name: 'Aelir', color: '#f0d06f' },
  { id: 'sareth', name: 'Sareth', color: '#7fd5bd' },
  { id: 'maeven', name: 'Maeven', color: '#e89282' },
  { id: 'iloth', name: 'Iloth', color: '#b59cff' },
  { id: 'vaelor', name: 'Vaelor', color: '#8fb8ff' },
  { id: 'qirren', name: 'Qirren', color: '#bfe07a' },
  { id: 'thalen', name: 'Thalen', color: '#efad66' },
  { id: 'nymera', name: 'Nymera', color: '#e6a8d7' },
];

const VERSES = [
  {
    id: 'many-voices',
    title: 'No Voice Stands Alone',
    text: 'Score a phrase with at least five different Voices.',
    test: ({ voices }) => voices.size >= 5,
  },
  {
    id: 'four-notes',
    title: 'The Grove Answers In Four',
    text: 'Score a phrase with at least four non-Silence Notes.',
    test: ({ notes }) => notes.size >= 4,
  },
  {
    id: 'held-silence',
    title: 'Silence Is Also Song',
    text: 'Score a phrase containing exactly one Silence.',
    test: ({ cells }) => cells.filter((cell) => cell.note === 'silence').length === 1,
  },
  {
    id: 'river-memory',
    title: 'River Remembers Stone',
    text: 'Score a phrase containing River and Stone.',
    test: ({ notes }) => notes.has('river') && notes.has('stone'),
  },
  {
    id: 'moon-root',
    title: 'Moon Over Root',
    text: 'Score a phrase containing Moon and Root.',
    test: ({ notes }) => notes.has('moon') && notes.has('root'),
  },
  {
    id: 'no-repeat',
    title: 'Unbroken Listening',
    text: 'Score a phrase with no non-Silence Note appearing more than twice.',
    test: ({ counts }) => Object.entries(counts).every(([note, count]) => note === 'silence' || count <= 2),
  },
];

const HOW_TO_PLAY = [
  'Choose 6, 7, or 8 Voices in the lobby. Each Voice is a player seat.',
  'On your turn, choose one Note, then place it on any empty space of the 7x7 song-grid.',
  'Rows and columns are phrases. A phrase scores as soon as all seven spaces in that row or column are filled.',
  'Everyone who contributed to a scored phrase gains Resonance. The player who completes it gains extra Resonance.',
  'If the phrase matches the Current Verse, it scores more and the next Verse is revealed.',
  'If the phrase misses the Verse, or if too few Voices helped carry it, Dissonance rises.',
  'Three connected copies of the same non-Silence Note also raise Dissonance.',
  'Silence reduces Dissonance by one when placed, but it can make some Verses harder to satisfy.',
  `Seal ${PHRASE_LIMIT} phrases before Dissonance reaches ${MAX_DISSONANCE}. If the Worldsong breaks, no one wins.`,
];

function emptyBoard() {
  return Array.from({ length: BOARD_SIZE * BOARD_SIZE }, () => null);
}

function indexOf(row, col) {
  return row * BOARD_SIZE + col;
}

function makePlayers(count, names = []) {
  return VOICES.slice(0, count).map((voice, index) => ({
    ...voice,
    name: names[index]?.trim() || voice.name,
    score: 0,
    phrases: 0,
    listening: [
      'Mercy must lead strength.',
      'A true song leaves room.',
      'Memory must bend before it breaks.',
      'Discord is a question, not a crime.',
      'The root and river are one promise.',
      'The moon hears what daylight misses.',
      'No harmony is owned.',
      'The world answers careful hands.',
    ][index],
  }));
}

function noteById(id) {
  return NOTES.find((note) => note.id === id) || NOTES[0];
}

function analyzeLine(cells) {
  const voices = new Set();
  const notes = new Set();
  const counts = {};
  cells.forEach((cell) => {
    voices.add(cell.player);
    if (cell.note !== 'silence') notes.add(cell.note);
    counts[cell.note] = (counts[cell.note] || 0) + 1;
  });
  return { cells, voices, notes, counts };
}

function lineCells(board, kind, n) {
  return Array.from({ length: BOARD_SIZE }, (_, i) => {
    const row = kind === 'row' ? n : i;
    const col = kind === 'row' ? i : n;
    return board[indexOf(row, col)];
  });
}

function completedLines(board, scored) {
  const lines = [];
  for (let n = 0; n < BOARD_SIZE; n += 1) {
    [['row', n], ['col', n]].forEach(([kind, value]) => {
      const key = `${kind}-${value}`;
      const cells = lineCells(board, kind, value);
      if (!scored.includes(key) && cells.every(Boolean)) lines.push({ key, kind, value, ...analyzeLine(cells) });
    });
  }
  return lines;
}

function sameNoteCluster(board, startIndex, noteId) {
  if (noteId === 'silence') return 0;
  const seen = new Set([startIndex]);
  const stack = [startIndex];
  while (stack.length) {
    const current = stack.pop();
    const row = Math.floor(current / BOARD_SIZE);
    const col = current % BOARD_SIZE;
    [[row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]].forEach(([r, c]) => {
      if (r < 0 || c < 0 || r >= BOARD_SIZE || c >= BOARD_SIZE) return;
      const next = indexOf(r, c);
      if (seen.has(next) || board[next]?.note !== noteId) return;
      seen.add(next);
      stack.push(next);
    });
  }
  return seen.size;
}

export default function QuyntharasChorus({ onExit }) {
  const { isMobile } = useDevice();
  const [phase, setPhase] = useState('lobby');
  const [lobbyCount, setLobbyCount] = useState(6);
  const [lobbyNames, setLobbyNames] = useState(() => VOICES.map((voice) => voice.name));
  const [readySeats, setReadySeats] = useState(() => Array.from({ length: 8 }, () => false));
  const [rulesOpen, setRulesOpen] = useState(false);
  const [playerCount, setPlayerCount] = useState(6);
  const [players, setPlayers] = useState(() => makePlayers(6));
  const [board, setBoard] = useState(() => emptyBoard());
  const [current, setCurrent] = useState(0);
  const [selectedNote, setSelectedNote] = useState('root');
  const [verseIndex, setVerseIndex] = useState(0);
  const [scoredLines, setScoredLines] = useState([]);
  const [dissonance, setDissonance] = useState(0);
  const [log, setLog] = useState(['Quynthe\'ra listens. Choose 6-8 Voices and begin the first phrase.']);
  const [finished, setFinished] = useState(null);

  const activeVerse = VERSES[verseIndex % VERSES.length];
  const activePlayer = players[current];
  const filled = board.filter(Boolean).length;
  const phraseCount = scoredLines.length;

  const rankedPlayers = useMemo(
    () => [...players].sort((a, b) => (b.score - a.score) || (b.phrases - a.phrases)),
    [players],
  );

  const allSeatsReady = readySeats.slice(0, lobbyCount).every(Boolean);

  const startGame = () => {
    if (!allSeatsReady) return;
    reset(lobbyCount, lobbyNames, 'play');
  };

  const reset = (count = playerCount, names = players.map((player) => player.name), nextPhase = phase) => {
    setPlayerCount(count);
    setPlayers(makePlayers(count, names));
    setBoard(emptyBoard());
    setCurrent(0);
    setSelectedNote('root');
    setVerseIndex(0);
    setScoredLines([]);
    setDissonance(0);
    setLog(['Quynthe\'ra listens. Choose a Note and place the first Echo.']);
    setFinished(null);
    setPhase(nextPhase);
  };

  const returnToLobby = () => {
    setPhase('lobby');
    setFinished(null);
  };

  const finishGame = (nextPlayers, nextDissonance, reason) => {
    const ordered = [...nextPlayers].sort((a, b) => (b.score - a.score) || (b.phrases - a.phrases));
    const broken = nextDissonance >= MAX_DISSONANCE;
    const winner = ordered[0];
    recordLotjarrsGameResult('quyntharas-chorus', {
      playerName: winner.name,
      outcome: broken ? 'loss' : 'win',
      score: broken ? 0 : winner.score,
      scoreLabel: broken ? 'Worldsong broken' : `${winner.score} resonance`,
      meta: { dissonance: nextDissonance, phrases: phraseCount, reason },
    });
    setFinished({ winner, broken, reason, ordered });
  };

  const placeNote = (cellIndex) => {
    if (finished || board[cellIndex]) return;

    const note = noteById(selectedNote);
    const nextBoard = [...board];
    nextBoard[cellIndex] = { player: activePlayer.id, note: selectedNote };

    let nextDissonance = selectedNote === 'silence' ? Math.max(0, dissonance - 1) : dissonance;
    const nextPlayers = players.map((player) => ({ ...player }));
    const messages = [`${activePlayer.name} sings ${note.name}.`];

    if (sameNoteCluster(nextBoard, cellIndex, selectedNote) >= 3) {
      nextDissonance += 1;
      messages.push(`${note.name} repeats too tightly; Dissonance rises.`);
    }

    const newLines = completedLines(nextBoard, scoredLines);
    const nextScored = [...scoredLines];
    let nextVerseIndex = verseIndex;

    newLines.forEach((line) => {
      const verseMet = activeVerse.test(line);
      const thinPhrase = line.voices.size < 4 || line.notes.size < 3;
      line.voices.forEach((voiceId) => {
        const player = nextPlayers.find((p) => p.id === voiceId);
        if (!player) return;
        player.score += verseMet ? 2 : 1;
        player.phrases += 1;
      });
      const lead = nextPlayers[current];
      lead.score += verseMet ? 2 : 1;
      nextScored.push(line.key);
      if (verseMet) {
        messages.push(`${activeVerse.title} resolves. The phrase enters the Worldsong.`);
        nextVerseIndex += 1;
      } else {
        nextDissonance += 1;
        messages.push(`The phrase is complete, but it misses ${activeVerse.title}.`);
      }
      if (thinPhrase) {
        nextDissonance += 1;
        messages.push('Too few Voices carried the line; the grove tightens.');
      }
    });

    const nextCurrent = (current + 1) % players.length;
    setBoard(nextBoard);
    setPlayers(nextPlayers);
    setDissonance(nextDissonance);
    setScoredLines(nextScored);
    setVerseIndex(nextVerseIndex);
    setCurrent(nextCurrent);
    setLog((items) => [...messages, ...items].slice(0, 8));

    if (nextDissonance >= MAX_DISSONANCE) {
      finishGame(nextPlayers, nextDissonance, 'Dissonance overcame the Worldsong.');
    } else if (nextScored.length >= PHRASE_LIMIT || nextBoard.every(Boolean)) {
      finishGame(nextPlayers, nextDissonance, nextScored.length >= PHRASE_LIMIT ? 'The final Verse was sealed.' : 'The 7x7 song-grid is full.');
    }
  };

  if (phase === 'lobby') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 18%, rgba(58,69,42,0.36), transparent 34%), linear-gradient(145deg, #080604 0%, #11100b 56%, #060504 100%)',
        color: '#e9dec3',
        fontFamily: 'Georgia, serif',
        padding: '76px 24px 26px',
        boxSizing: 'border-box',
      }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');`}</style>
        <GameBackButton onClick={onExit} />

        <main style={{
          width: 'min(1040px, 100%)',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'minmax(360px, 0.9fr) minmax(420px, 1.1fr)',
          gap: 18,
          alignItems: 'start',
        }}>
          <section>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.22em', color: 'rgba(191,224,122,0.72)', textTransform: 'uppercase', marginBottom: 8 }}>
                Lotjarr's Bag of Games
              </div>
              <h1 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: isMobile ? 28 : 36, letterSpacing: '0.08em', color: '#f0dfad' }}>
                Quynthe'ra's Chorus
              </h1>
              <p style={{ margin: '10px 0 0', color: 'rgba(233,222,195,0.66)', lineHeight: 1.6, fontStyle: 'italic' }}>
                Seat the Voices, read the rite, then fill the 7x7 song-grid without breaking the Worldsong.
              </p>
            </div>

            <GamePanel title="How To Play">
              <ol style={{ margin: 0, paddingLeft: 20, display: 'grid', gap: 9, color: 'rgba(233,222,195,0.72)', fontSize: 13, lineHeight: 1.45 }}>
                {HOW_TO_PLAY.map((rule) => <li key={rule}>{rule}</li>)}
              </ol>
            </GamePanel>
          </section>

          <aside style={{ display: 'grid', gap: 14 }}>
            <GamePanel title="Lobby">
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                {[6, 7, 8].map((count) => (
                  <GameButton
                    key={count}
                    active={lobbyCount === count}
                    onClick={() => setLobbyCount(count)}
                    style={{ flex: 1 }}
                  >
                    {count} Voices
                  </GameButton>
                ))}
              </div>

              <div style={{ display: 'grid', gap: 9, marginBottom: 16 }}>
                {VOICES.slice(0, lobbyCount).map((voice, index) => (
                  <div key={voice.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '16px 1fr auto',
                    gap: 10,
                    alignItems: 'center',
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: voice.color }} />
                    <input
                      value={lobbyNames[index]}
                      onChange={(event) => {
                        const next = [...lobbyNames];
                        next[index] = event.target.value;
                        setLobbyNames(next);
                      }}
                      style={{
                        width: '100%',
                        minHeight: 38,
                        borderRadius: 8,
                        border: '1px solid rgba(215,180,90,0.22)',
                        background: 'rgba(8,6,4,0.52)',
                        color: '#e9dec3',
                        fontFamily: 'Georgia, serif',
                        fontSize: 13,
                        padding: '0 11px',
                        outline: 'none',
                      }}
                    />
                    <GameButton
                      active={readySeats[index]}
                      onClick={() => {
                        const next = [...readySeats];
                        next[index] = !next[index];
                        setReadySeats(next);
                      }}
                      style={{ minWidth: 86 }}
                    >
                      {readySeats[index] ? 'Ready' : 'Unready'}
                    </GameButton>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <GameButton full onClick={() => setRulesOpen(true)}>Rules</GameButton>
                <GameButton variant="primary" full disabled={!allSeatsReady} onClick={startGame}>Start</GameButton>
              </div>
              {!allSeatsReady && (
                <div style={{ marginTop: 10, color: 'rgba(233,222,195,0.45)', fontSize: 12, fontStyle: 'italic' }}>
                  Every selected Voice must mark ready before the Chorus begins.
                </div>
              )}
            </GamePanel>
          </aside>
        </main>

        <RulesOverlay open={rulesOpen} onClose={() => setRulesOpen(false)} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 50% 18%, rgba(58,69,42,0.36), transparent 34%), linear-gradient(145deg, #080604 0%, #11100b 56%, #060504 100%)',
      color: '#e9dec3',
      fontFamily: 'Georgia, serif',
      padding: '76px 24px 26px',
      boxSizing: 'border-box',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&display=swap');`}</style>
      <GameBackButton onClick={onExit} />

      <main style={{
        width: 'min(1220px, 100%)',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'minmax(420px, 1fr) minmax(320px, 380px)',
        gap: 20,
        alignItems: 'start',
      }}>
        <section>
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.22em', color: 'rgba(191,224,122,0.72)', textTransform: 'uppercase', marginBottom: 8 }}>
              Lotjarr's Bag of Games
            </div>
            <h1 style={{ margin: 0, fontFamily: "'Cinzel', serif", fontSize: 34, letterSpacing: '0.08em', color: '#f0dfad' }}>
              Quynthe'ra's Chorus
            </h1>
            <p style={{ maxWidth: 680, margin: '10px 0 0', color: 'rgba(233,222,195,0.64)', lineHeight: 1.6, fontStyle: 'italic' }}>
              A 6-8 Voice song-grid of Tel'ari philosophy: score your truth, but do not break the Worldsong.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              <GameButton onClick={() => setRulesOpen(true)}>How To Play</GameButton>
              <GameButton onClick={returnToLobby}>Lobby</GameButton>
            </div>
          </div>

          <GamePanel style={{ padding: 18 }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(46px, 1fr))`,
              gap: isMobile ? 5 : 7,
              maxWidth: 676,
              margin: '0 auto',
            }}>
              {board.map((cell, i) => {
                const row = Math.floor(i / BOARD_SIZE);
                const col = i % BOARD_SIZE;
                const note = cell ? noteById(cell.note) : null;
                const owner = cell ? players.find((player) => player.id === cell.player) : null;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => placeNote(i)}
                    disabled={!!cell || !!finished}
                    title={cell ? `${owner?.name || 'Voice'}: ${note.name}` : `Row ${row + 1}, Column ${col + 1}`}
                    style={{
                      aspectRatio: '1 / 1',
                      borderRadius: 8,
                      border: cell ? `1px solid ${owner?.color || '#d7c79a'}` : '1px solid rgba(215,180,90,0.2)',
                      background: cell
                        ? `radial-gradient(circle at 50% 38%, ${note.bg}, rgba(8,6,4,0.86) 72%)`
                        : ((row + col) % 2 ? 'rgba(240,238,235,0.035)' : 'rgba(215,180,90,0.045)'),
                      boxShadow: cell ? `inset 0 0 0 2px rgba(0,0,0,0.32), 0 0 18px ${owner?.color || '#000'}22` : 'inset 0 1px 0 rgba(255,244,204,0.04)',
                      color: note?.color || 'rgba(233,222,195,0.28)',
                      cursor: cell || finished ? 'default' : 'pointer',
                      display: 'grid',
                      placeItems: 'center',
                      padding: 0,
                      position: 'relative',
                    }}
                  >
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: 19, fontWeight: 700 }}>{note?.mark || ''}</span>
                    {owner && (
                      <span style={{
                        position: 'absolute',
                        bottom: 5,
                        right: 6,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: owner.color,
                        boxShadow: '0 0 10px rgba(255,255,255,0.12)',
                      }} />
                    )}
                  </button>
                );
              })}
            </div>
          </GamePanel>
        </section>

        <aside style={{ display: 'grid', gap: 14 }}>
          <GamePanel title="Table">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", color: activePlayer.color, fontSize: 15, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{activePlayer.name}</div>
                <div style={{ color: 'rgba(233,222,195,0.56)', fontStyle: 'italic', fontSize: 12, marginTop: 4 }}>{activePlayer.listening}</div>
              </div>
              <div style={{ textAlign: 'right', color: 'rgba(233,222,195,0.58)', fontFamily: "'Cinzel', serif", fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Turn<br />{filled + 1}
              </div>
            </div>
          </GamePanel>

          <GamePanel title="Current Verse">
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, color: '#f0dfad', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>{activeVerse.title}</div>
            <div style={{ color: 'rgba(233,222,195,0.68)', lineHeight: 1.5, fontSize: 13 }}>{activeVerse.text}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <Meter label="Phrases" value={phraseCount} max={PHRASE_LIMIT} />
              <Meter label="Dissonance" value={dissonance} max={MAX_DISSONANCE} danger />
            </div>
          </GamePanel>

          <GamePanel title="Choose Note">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {NOTES.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNote(note.id)}
                  style={{
                    minHeight: 42,
                    borderRadius: 9,
                    border: selectedNote === note.id ? `1px solid ${note.color}` : '1px solid rgba(215,180,90,0.22)',
                    background: selectedNote === note.id ? note.bg : 'rgba(8,6,4,0.42)',
                    color: selectedNote === note.id ? note.color : 'rgba(233,222,195,0.68)',
                    fontFamily: "'Cinzel', serif",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {note.name}
                </button>
              ))}
            </div>
          </GamePanel>

          <GamePanel title="Voices">
            <div style={{ display: 'grid', gap: 7 }}>
              {rankedPlayers.map((player, index) => (
                <div key={player.id} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', gap: 8, alignItems: 'center', color: player.id === activePlayer.id ? '#f0dfad' : 'rgba(233,222,195,0.62)', fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: player.color }} />
                  <span>{index + 1}. {player.name}</span>
                  <b style={{ fontFamily: "'Cinzel', serif", color: player.color }}>{player.score}</b>
                </div>
              ))}
            </div>
          </GamePanel>

          <GamePanel title="Log">
            <div style={{ display: 'grid', gap: 8 }}>
              {log.map((item, index) => (
                <div key={`${item}-${index}`} style={{ color: index === 0 ? '#f0dfad' : 'rgba(233,222,195,0.55)', fontSize: 12, lineHeight: 1.4 }}>
                  {item}
                </div>
              ))}
            </div>
          </GamePanel>
        </aside>
      </main>

      <GameOverlay open={!!finished}>
        {finished && (
          <>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.2em', color: finished.broken ? '#e89282' : '#bfe07a', textTransform: 'uppercase', marginBottom: 12 }}>
              {finished.broken ? 'Worldsong Broken' : 'Worldsong Sealed'}
            </div>
            <h2 style={{ margin: '0 0 10px', fontFamily: "'Cinzel', serif", color: '#f0dfad' }}>
              {finished.broken ? 'No Voice Prevails' : `${finished.winner.name} Carries The Last Note`}
            </h2>
            <p style={{ color: 'rgba(233,222,195,0.68)', lineHeight: 1.55, marginBottom: 20 }}>{finished.reason}</p>
            <div style={{ display: 'grid', gap: 8, marginBottom: 20 }}>
              {finished.ordered.map((player, index) => (
                <div key={player.id} style={{ display: 'grid', gridTemplateColumns: '24px 1fr auto', gap: 10, color: 'rgba(233,222,195,0.72)', fontSize: 13 }}>
                  <span>{index + 1}</span>
                  <span>{player.name}</span>
                  <b style={{ color: player.color }}>{player.score}</b>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <GameButton variant="primary" full onClick={() => reset(playerCount, players.map((player) => player.name), 'play')}>New Chorus</GameButton>
              <GameButton full onClick={onExit}>Back To Bag</GameButton>
            </div>
          </>
        )}
      </GameOverlay>
      <RulesOverlay open={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}

function RulesOverlay({ open, onClose }) {
  return (
    <GameOverlay open={open} onClose={onClose}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, letterSpacing: '0.2em', color: '#bfe07a', textTransform: 'uppercase', marginBottom: 12 }}>
        How To Play
      </div>
      <h2 style={{ margin: '0 0 14px', fontFamily: "'Cinzel', serif", color: '#f0dfad' }}>Quynthe'ra's Chorus</h2>
      <ol style={{ margin: '0 0 20px', paddingLeft: 20, textAlign: 'left', display: 'grid', gap: 9, color: 'rgba(233,222,195,0.72)', fontSize: 13, lineHeight: 1.45 }}>
        {HOW_TO_PLAY.map((rule) => <li key={rule}>{rule}</li>)}
      </ol>
      <GameButton variant="primary" full onClick={onClose}>Return</GameButton>
    </GameOverlay>
  );
}

function Meter({ label, value, max, danger = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Cinzel', serif", fontSize: 8, letterSpacing: '0.12em', color: 'rgba(233,222,195,0.55)', textTransform: 'uppercase', marginBottom: 6 }}>
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div style={{ height: 7, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: danger ? '#d86f66' : '#bfe07a' }} />
      </div>
    </div>
  );
}
