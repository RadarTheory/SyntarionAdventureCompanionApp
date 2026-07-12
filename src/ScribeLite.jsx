import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   SCRIBE LITE — site-wide FAQ chat, zero API
   ───────────────────────────────────────────────────────────────────────────
   Emotion videos live in /public/scribe/ (LOWERCASE filenames).
   Full state machine — all fourteen clips in play:
     RESTING (rotate, one finishes → another begins):  idle, waiting, study
     RESEARCHING (loop while matching):                 thinking, loading
     welcome      — chat opens
     disappearing — chat closes (plays out, then hides)
     happy        — greetings, who-are-you
     ok           — thanks, "did you mean" suggestions
     goodbye      — farewells
     helpful      — standard answers
     spell        — lore & magic answers (Soteria, races, stats...)
     tinker       — technical answers (bugs, VTT, wrong character)
     sad          — no match found
     mad          — rudeness/spam (file: scribe-angry-transp)
   Mapping lives in EMOTION_FILE / IDLE_POOL / THINKING_POOL below.
   Missing videos fail gracefully: the quill glyph shows instead.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── 1. THE KNOWLEDGE BASE ─────────────────────────────────────────────────
   Each intent:
     id        unique name
     emotion   which video plays with the answer
     keywords  { token: weight } — weights sum toward the match score
     phrases   substrings worth a big bonus when found verbatim
     answer    what the Scribe says (string OR array for multi-bubble)
     chips     follow-up quick-reply buttons offered after the answer
   To teach the Scribe something new, add an entry here. That's it.        */

const INTENTS = [
  {
    id: 'what-is-syntarion',
    emotion: 'helpful',
    keywords: { syntarion: 3, what: 1, about: 1, app: 1, game: 1, system: 1 },
    phrases: ['what is syntarion', 'what is this app', 'what is this'],
    answer: "Syntarion is the Adventure Module Companion for the world of Soteria — a tabletop RPG platform where you forge characters, join campaigns, and play at a live virtual tabletop with your Dungeon Master, The Architect.",
    chips: ['How do I create a character?', 'What are the races?', 'What is Soteria?'],
  },
  {
    id: 'create-character',
    emotion: 'helpful',
    keywords: { create: 2, make: 2, new: 1, character: 3, adventurer: 3, forge: 2, build: 2, start: 1, wizard: 1 },
    phrases: ['create a character', 'make a character', 'new character', 'forge an adventurer'],
    answer: "Tap PLAY on the home screen, then choose Create New Adventurer. The Forge walks you step by step — race, class, stats, backstory — and submits your adventurer to the DM for approval. Once approved, they're bound to a campaign.",
    chips: ['How do I claim a character?', 'What are the classes?', 'What happens after approval?'],
  },
  {
    id: 'claim-character',
    emotion: 'helpful',
    keywords: { claim: 3, claimable: 3, roster: 2, premade: 2, existing: 1, character: 1, pick: 1 },
    phrases: ['claim a character', 'claim an adventurer', 'premade character'],
    answer: "If the DM has prepared adventurers for the taking, go to PLAY → Claim an Adventurer. You'll see the roster of unclaimed heroes — choose one and they become yours.",
    chips: ['How do I create a character?', 'How do campaigns work?'],
  },
  {
    id: 'approval',
    emotion: 'helpful',
    keywords: { approval: 3, approved: 3, pending: 2, waiting: 2, submitted: 2, review: 1, dm: 1 },
    phrases: ['after approval', 'been approved', 'still pending'],
    answer: "After you submit an adventurer, the DM reviews them. Once approved and assigned to a campaign, the CAMPAIGNS button appears on your home screen — that's your gateway to the table.",
    chips: ['How do campaigns work?', 'What is the VTT?'],
  },
  {
    id: 'campaigns',
    emotion: 'helpful',
    keywords: { campaign: 3, campaigns: 3, join: 2, session: 2, table: 1, play: 1, module: 2 },
    phrases: ['how do campaigns work', 'join a campaign'],
    answer: "Campaigns live inside Modules — self-contained adventures in Soteria. Once your approved adventurer is assigned to one, open CAMPAIGNS from the home screen to reach your character panel, party info, session log, and the virtual tabletop.",
    chips: ['What is the VTT?', 'What is a session?'],
  },
  {
    id: 'vtt',
    emotion: 'tinker',
    keywords: { vtt: 3, map: 2, tabletop: 2, token: 2, fog: 2, move: 1, board: 1, grid: 1 },
    phrases: ['virtual tabletop', 'what is the vtt', 'move my token'],
    answer: [
      "The VTT is the living battle map. Your DM reveals the world through the fog of war as you explore, and your token marks where you stand.",
      "To move: drag your token where you want to go. Your DM sees the request and approves or denies it — the Architect keeps the world honest.",
    ],
    chips: ['How does combat work?', 'What is fog of war?'],
  },
  {
    id: 'fog',
    emotion: 'tinker',
    keywords: { fog: 3, war: 1, hidden: 2, reveal: 2, dark: 1, see: 1, covered: 1 },
    phrases: ['fog of war', "can't see the map"],
    answer: "The fog of war hides what your party hasn't discovered yet. As your DM reveals zones, the map opens up. If the whole map is dark, your party simply hasn't ventured there — or the session hasn't begun.",
    chips: ['What is the VTT?'],
  },
  {
    id: 'combat',
    emotion: 'helpful',
    keywords: { combat: 3, fight: 2, battle: 2, attack: 2, initiative: 2, hercules: 2, turn: 1, damage: 1 },
    phrases: ['how does combat work', 'how do i attack'],
    answer: "Combat runs through the Hercules system. The DM sets initiative and broadcasts turn order to the table. On your turn, declare your intent — your action, your target — and the dice and the DM decide your fate.",
    chips: ['What are AP?', 'What is initiative?'],
  },
  {
    id: 'ap-economy',
    emotion: 'helpful',
    keywords: { ap: 3, action: 2, points: 2, economy: 2, spend: 1, cost: 1 },
    phrases: ['action points', 'what are ap'],
    answer: "AP — Action Points — are the currency of every turn in Syntarion. Each action has a cost, and how you spend your AP shapes the fight. Spend boldly or hold in reserve; that choice is the heart of the system.",
    chips: ['How does combat work?'],
  },
  {
    id: 'stats',
    emotion: 'spell',
    keywords: { stats: 3, stat: 3, magic: 2, tech: 2, attributes: 2, eight: 1, axes: 1 },
    phrases: ['what are the stats', 'magic and tech'],
    answer: "Syntarion runs on 8 stats split across two great axes: Magic and Tech. Where your adventurer falls between the arcane and the mechanical defines what they can do — and who they are in Soteria.",
    chips: ['What are the classes?', 'What are the races?'],
  },
  {
    id: 'races',
    emotion: 'spell',
    keywords: { races: 3, race: 3, species: 2, pamorph: 2, bloodline: 2, kind: 1 },
    phrases: ['what are the races', "pa'morph"],
    answer: "Soteria is home to 15 playable races, including the shapeshifting Pa'morph bloodlines. Each race carries its own history in the world — you'll meet them all in the Forge when creating an adventurer.",
    chips: ['How do I create a character?', 'What are the classes?'],
  },
  {
    id: 'classes',
    emotion: 'spell',
    keywords: { classes: 3, class: 3, job: 1, role: 1, sixteen: 1 },
    phrases: ['what are the classes'],
    answer: "There are 16 classes spanning the Magic–Tech spectrum. The Forge shows you each one during character creation, with their icons, roles, and leanings.",
    chips: ['What are the stats?', 'How do I create a character?'],
  },
  {
    id: 'soteria',
    emotion: 'spell',
    keywords: { soteria: 3, world: 2, lore: 2, setting: 2, lockcaste: 2, veinrunner: 2, novel: 1 },
    phrases: ['what is soteria'],
    answer: "Soteria is the world all of this lives in — a disc-world where magic and machinery collide, chronicled in the novels of Theonhex Media & Publishing and played out at this very table. Your campaigns are written into its history.",
    chips: ['What is Syntarion?'],
  },
  {
    id: 'dm-mode',
    emotion: 'spell',
    keywords: { dm: 3, sigil: 3, architect: 2, dungeon: 1, master: 1, mode: 1, password: 1 },
    phrases: ['dm mode', 'what is the sigil', 'become a dm'],
    answer: "DM Mode is the Architect's seat — module management, campaign control, the DM side of the VTT. It's sealed behind a sigil (a passphrase). If you're meant to hold the key, you already know it.",
    chips: ['How do campaigns work?'],
  },
  {
    id: 'tour',
    emotion: 'helpful',
    keywords: { tour: 3, tutorial: 2, guide: 2, howto: 2, help: 1, learn: 1, onboarding: 2 },
    phrases: ['how to play', 'show me around', 'restart the tour'],
    answer: "Tap HOW TO PLAY on the home screen any time — the full guided tour walks you through the world, the Forge, and the table, chapter by chapter.",
    chips: ['How do I create a character?', 'What is the VTT?'],
  },
  {
    id: 'dice',
    emotion: 'helpful',
    keywords: { dice: 3, roll: 3, die: 2, d20: 1, check: 1 },
    phrases: ['roll dice', 'how do i roll'],
    answer: "Rolls happen at the table during sessions — declare what you're attempting, and your DM will call for the check. The dice decide; the Architect interprets.",
    chips: ['How does combat work?'],
  },
  {
    id: 'driftstone',
    emotion: 'helpful',
    keywords: { driftstone: 3, bag: 2, games: 1, board: 1, lotjarr: 2 },
    phrases: ["lotjarr's bag", 'bag of games'],
    answer: "Lótjarr's Bag of Games holds Driftstone — a two-player strategy board game from Soteria, played pass-and-play on a 7×7 board. Grab a friend and open the bag from the home screen.",
    chips: [],
  },
  {
    id: 'legal',
    emotion: 'helpful',
    keywords: { legal: 3, privacy: 3, terms: 2, eula: 2, policy: 2, data: 1, ai: 1, disclosure: 1 },
    phrases: ['privacy policy', 'terms of service', 'my data'],
    answer: "The Terms of Service, EULA, Privacy Policy, and AI Disclosure are all available from the legal gate you accepted on first visit — and in Settings. Short version: your story is yours; we guard the archive.",
    chips: [],
  },
  {
    id: 'bug-report',
    emotion: 'tinker',
    keywords: { bug: 3, broken: 3, error: 2, wrong: 2, issue: 2, crash: 2, problem: 2, glitch: 2, report: 1 },
    phrases: ['found a bug', 'something is broken', 'not working'],
    answer: "A crack in the archive! Tell your DM directly — describe what you were doing, what you expected, and what happened instead. The Architect maintains these halls personally.",
    chips: [],
  },
  {
    id: 'wrong-character',
    emotion: 'tinker',
    keywords: { wrong: 3, character: 2, someone: 2, elses: 2, not: 1, mine: 2, showing: 1 },
    phrases: ['wrong character', 'not my character', "someone else's character"],
    answer: "Seeing an adventurer that isn't yours usually means a claim mix-up. Tell your DM which character you should see and which one appears — they can rebind it on their end.",
    chips: ['Found a bug'],
  },
];

/* ─── Small-talk (handled before FAQ matching) ─────────────────────────── */
const SMALL_TALK = [
  {
    test: t => /^(hi|hello|hey|yo|greetings|hail|good (morning|evening|afternoon))\b/.test(t),
    emotion: 'happy',
    answer: "Hail, adventurer! I am the Scribe — keeper of answers. Ask me anything about Syntarion.",
    chips: ['What is Syntarion?', 'How do I create a character?', 'How to play'],
  },
  {
    test: t => /\b(thanks|thank you|thx|ty|appreciated|cheers)\b/.test(t),
    emotion: 'ok',
    answer: "The archive is always open to you. Anything else?",
    chips: [],
  },
  {
    test: t => /\b(bye|goodbye|farewell|later|cya)\b/.test(t),
    emotion: 'goodbye',
    answer: "May your rolls be high. Farewell!",
    chips: [],
  },
  {
    test: t => /\b(stupid|dumb|idiot|useless|trash|suck|shut up|hate you)\b/.test(t),
    emotion: 'mad',
    answer: "...The Scribe records that in the annals. Now — did you have an actual question about Syntarion?",
    chips: ['What is Syntarion?', 'How to play'],
  },
  {
    test: t => /\b(who are you|what are you)\b/.test(t),
    emotion: 'happy',
    answer: "I am the Scribe of Syntarion — I keep the answers so the Architect can keep the world. Ask away.",
    chips: ['What is Syntarion?', 'How to play'],
  },
];

/* ─── 2. THE NLU ENGINE ─────────────────────────────────────────────────────
   normalize → expand synonyms → score every intent → threshold decision   */

const SYNONYMS = {
  char: 'character', chars: 'character', characters: 'character', pc: 'character',
  toon: 'character', hero: 'adventurer', adventurers: 'adventurer',
  campaigns: 'campaign', maps: 'map', tokens: 'token', rolls: 'roll',
  rolled: 'roll', rolling: 'roll', fighting: 'fight', fights: 'fight',
  battles: 'battle', bugs: 'bug', errors: 'error', broke: 'broken',
  glitches: 'glitch', gm: 'dm', dungeonmaster: 'dm', tut: 'tutorial',
  tutorials: 'tutorial', stat: 'stats', attribute: 'attributes',
  password: 'sigil', passphrase: 'sigil', login: 'sigil',
  creating: 'create', created: 'create', making: 'make', built: 'build',
  claiming: 'claim', claimed: 'claim', approve: 'approval', approving: 'approval',
  species: 'race', racial: 'race', jobs: 'class', archetype: 'class',
  boardgame: 'driftstone', lotjarrs: 'lotjarr',
};

const STOPWORDS = new Set([
  'a','an','the','i','me','my','you','your','is','are','was','were','be',
  'do','does','did','can','could','would','should','will','to','of','in',
  'on','at','for','with','and','or','but','it','its','this','that','how',
  'please','tell','get','have','has','want','need','know','if','so','up',
]);

function normalize(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // strip accents (Lótjarr → lotjarr)
    .replace(/[^a-z0-9\s']/g, ' ')
    .replace(/'/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(normText) {
  return normText
    .split(' ')
    .map(t => SYNONYMS[t] || t)
    .filter(t => t && !STOPWORDS.has(t));
}

function scoreIntent(intent, tokens, normText) {
  let score = 0;
  for (const tok of tokens) {
    if (intent.keywords[tok]) score += intent.keywords[tok];
  }
  for (const phrase of intent.phrases || []) {
    if (normText.includes(phrase)) score += 4;
  }
  return score;
}

const ANSWER_THRESHOLD = 3;   // ≥ this → confident answer
const SUGGEST_THRESHOLD = 1.5; // ≥ this → "did you mean" suggestions

function matchQuery(rawText) {
  const normText = normalize(rawText);

  for (const st of SMALL_TALK) {
    if (st.test(normText)) return { type: 'smalltalk', ...st };
  }

  const tokens = tokenize(normText);
  const scored = INTENTS
    .map(intent => ({ intent, score: scoreIntent(intent, tokens, normText) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length && scored[0].score >= ANSWER_THRESHOLD) {
    return { type: 'answer', intent: scored[0].intent };
  }
  if (scored.length && scored[0].score >= SUGGEST_THRESHOLD) {
    return { type: 'suggest', suggestions: scored.slice(0, 3).map(s => s.intent) };
  }
  return { type: 'nomatch' };
}

/* Human-readable label for an intent (used in "did you mean" chips) */
const INTENT_LABELS = {
  'what-is-syntarion': 'What is Syntarion?',
  'create-character': 'How do I create a character?',
  'claim-character': 'How do I claim a character?',
  'approval': 'What happens after approval?',
  'campaigns': 'How do campaigns work?',
  'vtt': 'What is the VTT?',
  'fog': 'What is fog of war?',
  'combat': 'How does combat work?',
  'ap-economy': 'What are AP?',
  'stats': 'What are the stats?',
  'races': 'What are the races?',
  'classes': 'What are the classes?',
  'soteria': 'What is Soteria?',
  'dm-mode': 'What is DM Mode?',
  'tour': 'How to play',
  'dice': 'How do I roll dice?',
  'driftstone': "What is Lótjarr's Bag?",
  'legal': 'Privacy & terms',
  'bug-report': 'Found a bug',
  'wrong-character': 'Wrong character showing',
};

/* ─── 3. EMOTION VIDEO PLAYER ─────────────────────────────────────────── */
const IDLE_POOL = ['idle', 'waiting', 'study'];       // resting rotation
const THINKING_POOL = ['thinking', 'loading'];        // researching rotation
const LOOPING = new Set(THINKING_POOL);               // these loop until answered
const RESTING = new Set(IDLE_POOL);                   // these chain into each other

const EMOTION_FILE = {
  idle: 'scribe-idle-transp',
  waiting: 'scribe-waiting-transp',
  study: 'scribe-study-transp',
  thinking: 'scribe-thinking-transp',
  loading: 'scribe-loading-transp',
  welcome: 'scribe-welcome-transp',
  disappearing: 'scribe-disappearing-transp',
  happy: 'scribe-happy-transp',
  ok: 'scribe-ok-transp',
  goodbye: 'scribe-goodbye-transp',
  helpful: 'scribe-helpful-transp',
  spell: 'scribe-spell-transp',
  tinker: 'scribe-tinker-transp',
  sad: 'scribe-sad-transp',
  mad: 'scribe-angry-transp',
  glitch: 'scribe-glitch-transp',
};

const randomFrom = (arr, not) => {
  const pool = arr.filter(e => e !== not);
  return pool[Math.floor(Math.random() * pool.length)] || arr[0];
};

function ScribeFace({ emotion, size = 84, stage = false, forceLoop = false, onEnded }) {
  const [failed, setFailed] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => { setFailed(false); }, [emotion]);

  return (
    <div style={{
      width: size, height: size,
      borderRadius: stage ? 0 : '50%', overflow: 'hidden',
      border: stage ? 'none' : '1px solid rgba(200,168,74,0.35)',
      background: stage ? 'transparent' : '#1c1815',
      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {!failed ? (
        <video
          ref={videoRef}
          key={emotion}
          src={`/scribe/${EMOTION_FILE[emotion] || 'scribe-idle-transp'}.mp4`}
          autoPlay muted playsInline
          loop={forceLoop || LOOPING.has(emotion)}
          onEnded={onEnded}
          onError={() => setFailed(true)}
          onContextMenu={e => e.preventDefault()}
          style={{ width: '100%', height: '100%', objectFit: stage ? 'contain' : 'cover', pointerEvents: 'none', mixBlendMode: 'screen' }}
        />
      ) : (
        <span style={{ fontSize: size * 0.45 }} role="img" aria-label="Scribe">🖋️</span>
      )}
    </div>
  );
}

/* ─── 4. THE WIDGET ─────────────────────────────────────────────────────── */
export default function ScribeLite() {
  const [open, setOpen] = useState(false);
  const [emotion, setEmotion] = useState('idle');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const emotionTimer = useRef(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  const emotionRef = useRef('idle');
  const pendingRef = useRef(null);

  useEffect(() => { emotionRef.current = emotion; }, [emotion]);

  /* Return to rest: pick a different resting clip than the current one */
  const goIdle = useCallback(() => {
    setEmotion(prev => randomFrom(IDLE_POOL, prev));
  }, []);

  /* Resolve whatever emotion is queued behind the glitch */
  const handlePending = useCallback(() => {
    clearTimeout(emotionTimer.current);
    const p = pendingRef.current;
    pendingRef.current = null;
    if (!p) { goIdle(); return; }
    setEmotion(p.emo);
    if (!LOOPING.has(p.emo) && !RESTING.has(p.emo)) {
      emotionTimer.current = setTimeout(goIdle, p.holdMs ?? 8000);
    }
  }, [goIdle]);

  /* Every emotion change passes through the glitch clip first */
  const playEmotion = useCallback((emo, holdMs = 8000) => {
    clearTimeout(emotionTimer.current);
    if (emotionRef.current === emo) return;
    pendingRef.current = { emo, holdMs };
    setEmotion('glitch');
    /* fallback: if glitch video is missing, onEnded never fires */
    emotionTimer.current = setTimeout(handlePending, 900);
  }, [handlePending]);

  /* A clip finished: glitch resolves its target, others glitch to rest */
  const handleClipEnd = useCallback(() => {
    clearTimeout(emotionTimer.current);
    if (emotionRef.current === 'glitch') { handlePending(); return; }
    pendingRef.current = { emo: randomFrom(IDLE_POOL, emotionRef.current) };
    setEmotion('glitch');
    emotionTimer.current = setTimeout(handlePending, 900);
  }, [handlePending]);

  useEffect(() => () => clearTimeout(emotionTimer.current), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const openChat = () => {
    setOpen(true);
    playEmotion('welcome');
    if (messages.length === 0) {
      setMessages([{
        from: 'scribe',
        text: "Hail! I am the Scribe. Ask me anything about Syntarion — or pick a scroll below.",
        chips: ['What is Syntarion?', 'How do I create a character?', 'How to play', 'How does combat work?'],
      }]);
    }
  };

  const pushScribe = (text, chips = []) => {
    const parts = Array.isArray(text) ? text : [text];
    setMessages(prev => [
      ...prev,
      ...parts.map((p, i) => ({
        from: 'scribe', text: p,
        chips: i === parts.length - 1 ? chips : [],
      })),
    ]);
  };

  const ask = (rawText) => {
    const text = rawText.trim();
    if (!text || busy) return;
    setInput('');
    setMessages(prev => [...prev, { from: 'user', text }]);
    setBusy(true);
    playEmotion(randomFrom(THINKING_POOL));

    /* The "researching" pause — sells the character, debounces spam */
    setTimeout(() => {
      const result = matchQuery(text);
      setBusy(false);

      if (result.type === 'smalltalk') {
        playEmotion(result.emotion);
        pushScribe(result.answer, result.chips);
      } else if (result.type === 'answer') {
        playEmotion(result.intent.emotion || 'helpful');
        pushScribe(result.intent.answer, result.intent.chips);
      } else if (result.type === 'suggest') {
        playEmotion('ok');
        pushScribe(
          "Hmm — the archives hold a few scrolls that might be what you seek:",
          result.suggestions.map(s => INTENT_LABELS[s.id]).filter(Boolean)
        );
      } else {
        playEmotion('sad');
        pushScribe(
          "I searched the archives, but found no scroll on that. Try asking another way — or pick from what I do know:",
          ['What is Syntarion?', 'How do I create a character?', 'What is the VTT?', 'Found a bug']
        );
      }
    }, 700 + Math.random() * 500);
  };

  /* Close with a disappearing act, then hide the panel */
  const closeChat = () => {
    clearTimeout(emotionTimer.current);
    pendingRef.current = null;
    setEmotion('disappearing');
    emotionTimer.current = setTimeout(() => {
      setOpen(false);
      goIdle();
    }, 1100);
  };

  /* ── Launcher (closed state) ── */
  if (!open) return (
    <button
      onClick={openChat}
      aria-label="Ask the Scribe"
      style={{
        position: 'fixed', bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24,
        zIndex: 1900, width: isMobile ? 68 : 84, height: isMobile ? 68 : 84,
        borderRadius: '50%', border: '1px solid rgba(200,168,74,0.5)',
        background: '#13100d', cursor: 'pointer', padding: 0,
        boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <ScribeFace emotion="idle" size={isMobile ? 64 : 80} forceLoop />
    </button>
  );

  /* ── Chat panel (open state) ── */
  return (
    <div style={{
      position: 'fixed', zIndex: 1900,
      bottom: isMobile ? 0 : 24, right: isMobile ? 0 : 24,
      left: isMobile ? 0 : 'auto',
      width: isMobile ? '100%' : 380,
      height: isMobile ? '85svh' : 640,
      maxHeight: isMobile ? '85svh' : 'calc(100svh - 48px)',
      background: '#13100d',
      border: '1px solid rgba(200,168,74,0.3)',
      borderRadius: isMobile ? '14px 14px 0 0' : 14,
      boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: 'Georgia, serif',
      paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0,
    }}>
      {/* Header — the Scribe takes the stage */}
      <div style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        padding: '12px 14px 10px', borderBottom: '1px solid rgba(200,168,74,0.18)',
        background: '#171310',
      }}>
        <ScribeFace emotion={emotion} size={isMobile ? 180 : 220} stage onEnded={handleClipEnd} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700,
            letterSpacing: '0.14em', color: '#f0eeeb',
          }}>THE SCRIBE</div>
          <div style={{
            fontSize: 11, fontStyle: 'italic',
            color: busy ? '#c8a84a' : 'rgba(240,238,235,0.4)',
            transition: 'color 0.3s',
          }}>
            {busy ? 'consulting the archives…' : 'keeper of answers'}
          </div>
        </div>
        <button
          onClick={closeChat}
          aria-label="Close"
          style={{
            position: 'absolute', top: 8, right: 10,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'rgba(240,238,235,0.45)', fontSize: 22, lineHeight: 1, padding: 6,
          }}
        >×</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '85%',
              padding: '10px 13px',
              borderRadius: m.from === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
              background: m.from === 'user' ? '#c8a84a' : '#1c1815',
              color: m.from === 'user' ? '#13100d' : '#f0eeeb',
              border: m.from === 'user' ? 'none' : '1px solid rgba(200,168,74,0.18)',
              fontSize: 13.5, lineHeight: 1.55,
            }}>{m.text}</div>
            {m.chips?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {m.chips.map((chip, j) => (
                  <button key={j} onClick={() => ask(chip)} style={{
                    background: 'transparent',
                    border: '1px solid rgba(200,168,74,0.4)',
                    borderRadius: 999, padding: '5px 12px',
                    color: '#c8a84a', fontSize: 11.5, cursor: 'pointer',
                    fontFamily: 'Georgia, serif',
                  }}>{chip}</button>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div style={{
            alignSelf: 'flex-start', padding: '10px 14px', borderRadius: '12px 12px 12px 3px',
            background: '#1c1815', border: '1px solid rgba(200,168,74,0.18)',
            color: 'rgba(240,238,235,0.5)', fontSize: 13, fontStyle: 'italic',
          }}>
            <span className="scribe-dots">searching the shelves</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid rgba(200,168,74,0.18)', background: '#171310' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(input)}
          placeholder="Ask the Scribe…"
          style={{
            flex: 1, background: '#1c1815',
            border: '1px solid rgba(200,168,74,0.25)', borderRadius: 8,
            padding: '10px 13px', fontSize: 16, color: '#f0eeeb',
            outline: 'none', fontFamily: 'Georgia, serif',
          }}
        />
        <button onClick={() => ask(input)} disabled={busy || !input.trim()} style={{
          background: input.trim() && !busy ? '#c8a84a' : '#333',
          color: '#13100d', border: 'none', borderRadius: 8,
          padding: '0 16px', fontWeight: 700, cursor: input.trim() && !busy ? 'pointer' : 'default',
          fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.08em',
        }}>ASK</button>
      </div>

      <style>{`
        .scribe-dots::after {
          content: '';
          animation: scribeDots 1.4s steps(4, end) infinite;
        }
        @keyframes scribeDots {
          0% { content: ''; }
          25% { content: '.'; }
          50% { content: '..'; }
          75% { content: '...'; }
        }
      `}</style>
    </div>
  );
}