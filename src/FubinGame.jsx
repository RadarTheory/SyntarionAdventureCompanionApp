// FubinGame.jsx — Syntarion | Fubin Game Engine v2.0
// Drop-in replacement for FubinGame.jsx
// Improvements: offscreen canvas background, win condition, better AI,
// touch controls, tunnel-proof collision, pooled AudioContext.

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';

// ── Utilities ────────────────────────────────────────────────────────────────

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getRandomDirection = () => {
  const angle = Math.PI * (0.2 + Math.random() * 0.6);
  return {
    x: Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1),
    y: Math.sin(angle) * (Math.random() > 0.5 ? 1 : -1),
  };
};

// Sweep-based segment intersection — tunnel-proof collision
// Returns fraction t [0,1] at which moving circle crosses a vertical wall segment,
// or null if no crossing this frame.
const sweepCircleVsVerticalSegment = (ball, prevX, prevY, wallX, segTop, segBottom, radius) => {
  const dx = ball.x - prevX;
  if (Math.abs(dx) < 0.0001) return null;

  const t = (wallX - prevX) / dx;
  if (t < 0 || t > 1) return null;

  const hitY = prevY + (ball.y - prevY) * t;
  if (hitY + radius >= segTop && hitY - radius <= segBottom) return t;
  return null;
};

// ── Audio pool ───────────────────────────────────────────────────────────────

let sharedAudioCtx = null;

const getAudioCtx = () => {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    sharedAudioCtx = new AudioContext();
  }
  return sharedAudioCtx;
};

const playBell = (frequency, duration) => {
  const ctx = getAudioCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

// ── Win score constant ───────────────────────────────────────────────────────

const WIN_SCORE = 7;

// ── Component ────────────────────────────────────────────────────────────────

const FubinGame = ({ config, mode, playerTwo, soloStart }) => {
  const canvasRef    = useRef(null);
  const overlayRef   = useRef(null);
  const bgCanvasRef  = useRef(null); // offscreen background canvas

  const [showInstructions, setShowInstructions] = useState(true);
  const [score,            setScore]            = useState({ left: 0, right: 0 });
  const [winner,           setWinner]           = useState(null); // 'left' | 'right' | null
  const [challenger,       setChallenger]       = useState('');

  const scoreRef   = useRef(score);
  const winnerRef  = useRef(null);
  const smokeRef   = useRef({ burning: false, timer: 0 });

  // AI state — per-side reaction delay simulation
  const aiRef = useRef({
    left:  { targetY: 0, reactionTimer: 0, reactionDelay: 0.12, errorOffset: 0 },
    right: { targetY: 0, reactionTimer: 0, reactionDelay: 0.10, errorOffset: 0 },
  });

  const stateRef = useRef({
    width:        1280,
    height:       720,
    ball:         { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
    prevBall:     { x: 0, y: 0 },
    leftPaddle:   { y: 0, vy: 0 },
    rightPaddle:  { y: 0, vy: 0 },
    lastTime:     0,
    paused:       true,
    simMode:      'idle',
  });

  const getGoalHeight  = () => config.board.goalHeightRatio * stateRef.current.height;
  const borderWidth    = config.board.borderWidth;

  // ── Sync refs ──────────────────────────────────────────────────────────────

  useEffect(() => { scoreRef.current = score; }, [score]);

  useEffect(() => {
    if (playerTwo) {
      setChallenger(playerTwo.name);
      setScore({ left: 0, right: 0 });
      setWinner(null);
      winnerRef.current = null;
      smokeRef.current  = { burning: false, timer: 0 };
    }
  }, [playerTwo]);

  // ── Reset helpers ──────────────────────────────────────────────────────────

  const resetBall = useCallback((direction) => {
    const { width, height } = stateRef.current;
    const dir = getRandomDirection();
    const ball = {
      x:     width  / 2,
      y:     height / 2,
      vx:    direction * Math.abs(dir.x),
      vy:    dir.y,
      speed: config.ball.baseSpeed,
    };
    stateRef.current.ball     = ball;
    stateRef.current.prevBall = { x: ball.x, y: ball.y };
  }, [config.ball.baseSpeed]);

  const resetGame = useCallback(() => {
    const { width, height } = stateRef.current;
    stateRef.current.leftPaddle.y  = height / 2 - config.paddle.height / 2;
    stateRef.current.rightPaddle.y = height / 2 - config.paddle.height / 2;
    resetBall(1);
    stateRef.current.paused   = false;
    stateRef.current.lastTime = performance.now();
    setShowInstructions(false);
    setWinner(null);
    winnerRef.current = null;
    setScore({ left: 0, right: 0 });
    smokeRef.current = { burning: false, timer: 0 };
  }, [config.paddle.height, resetBall]);

  // ── Offscreen background canvas ────────────────────────────────────────────
  // Draws once per resize — eliminates per-frame Math.random() flicker.

  const renderBackground = useCallback((width, height) => {
    if (!bgCanvasRef.current) {
      bgCanvasRef.current = document.createElement('canvas');
    }
    const bg  = bgCanvasRef.current;
    bg.width  = Math.round(width  * window.devicePixelRatio);
    bg.height = Math.round(height * window.devicePixelRatio);
    const bx  = bg.getContext('2d');
    bx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);

    const bw = borderWidth;

    // Base fill
    bx.fillStyle = '#1f201c';
    bx.fillRect(0, 0, width, height);

    // Border walls
    bx.fillStyle = config.board.wallColor;
    bx.fillRect(0, 0, bw, height);
    bx.fillRect(width - bw, 0, bw, height);
    bx.fillRect(0, 0, width, bw);
    bx.fillRect(0, height - bw, width, bw);

    // Goal openings
    const gap = config.board.goalHeightRatio * height;
    bx.clearRect(0,         height / 2 - gap / 2, bw,       gap);
    bx.clearRect(width - bw, height / 2 - gap / 2, bw,       gap);

    // Vines — drawn once, static
    const drawVines = (x, y, count, horizontal) => {
      for (let i = 0; i < count; i++) {
        const offset    = (i / count) * (horizontal ? width : height);
        const thickness = 8 + Math.random() * 6;
        bx.strokeStyle = config.board.vineColor;
        bx.lineWidth   = thickness;
        bx.beginPath();
        bx.moveTo(
          x + (horizontal ? offset : 0),
          y + (horizontal ? 0 : offset),
        );
        bx.bezierCurveTo(
          x + (horizontal ? offset + 10 : 25),
          y + (horizontal ? 30 : offset + 40),
          x + (horizontal ? offset + 20 : 15),
          y + (horizontal ? 60 : offset + 90),
          x + (horizontal ? offset : 0),
          y + (horizontal ? 90 : offset + 140),
        );
        bx.stroke();
      }
    };

    drawVines(0,           4,              7, true);
    drawVines(0,           4,              5, false);
    drawVines(width - bw,  0,              6, false);
    drawVines(0,           height - bw,    9, true);

    // Flowers — static, drawn once
    for (let i = 0; i < 16; i++) {
      bx.fillStyle = config.board.flowerColor;
      bx.beginPath();
      bx.arc(
        Math.random() * width,
        Math.random() * height,
        2 + Math.random() * 2,
        0,
        Math.PI * 2,
      );
      bx.fill();
    }
  }, [borderWidth, config.board]);

  // ── Main game loop ─────────────────────────────────────────────────────────

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrame = 0;
    let active         = true;

    // Touch state
    const touches = { left: null, right: null };

    // ── Resize ───────────────────────────────────────────────────────────────

    const resize = () => {
      const rect      = canvas.getBoundingClientRect();
      canvas.width    = Math.round(rect.width  * window.devicePixelRatio);
      canvas.height   = Math.round(rect.height * window.devicePixelRatio);
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      stateRef.current.width  = rect.width;
      stateRef.current.height = rect.height;
      renderBackground(rect.width, rect.height);
    };

    // ── Draw helpers ─────────────────────────────────────────────────────────

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h,     x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y,         x + r, y);
      ctx.closePath();
    };

    const drawBackground = () => {
      const { width, height } = stateRef.current;
      if (bgCanvasRef.current) {
        ctx.drawImage(bgCanvasRef.current, 0, 0, width, height);
      }
    };

    const drawScoreboard = () => {
      const { width, height } = stateRef.current;
      const sbWidth   = config.scoreboard.width;
      const sbHeight  = config.scoreboard.height;
      const x         = width  / 2 - sbWidth  / 2;
      const y         = height / 2 - sbHeight / 2;
      const cur       = scoreRef.current;

      ctx.save();
      ctx.globalAlpha  = config.scoreboard.opacity;
      ctx.fillStyle    = config.scoreboard.woodColor;
      ctx.strokeStyle  = '#3b281c';
      ctx.lineWidth    = 5;
      roundRect(x, y, sbWidth, sbHeight, 18);
      ctx.fill();
      ctx.stroke();
      ctx.shadowColor  = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur   = 18;
      ctx.stroke();
      ctx.shadowBlur   = 0;
      ctx.globalAlpha  = 1;
      ctx.fillStyle    = config.scoreboard.burnColor;
      ctx.font         = 'bold 44px Inter, system-ui, sans-serif';
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${cur.left}  –  ${cur.right}`, width / 2, height / 2);

      if (smokeRef.current.burning) {
        const alpha = 1 - smokeRef.current.timer;
        ctx.fillStyle = `rgba(225,235,245,${0.22 * alpha})`;
        ctx.beginPath();
        ctx.arc(width / 2, height / 2 - 6, 38 + smokeRef.current.timer * 42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawPaddle = (x, y) => {
      ctx.save();
      ctx.fillStyle   = config.paddle.woodColor;
      ctx.fillRect(x, y, config.paddle.width, config.paddle.height);
      ctx.strokeStyle = config.paddle.edgeColor;
      ctx.lineWidth   = 3;
      ctx.strokeRect(x, y, config.paddle.width, config.paddle.height);
      ctx.restore();
    };

    const drawBall = () => {
      const ball       = stateRef.current.ball;
      const speedRange = config.ball.baseSpeed - config.ball.minSpeed;
      const trailLen   = speedRange > 0
        ? ((ball.speed - config.ball.minSpeed) / speedRange) * config.ball.trailMax
        : 0;

      if (ball.speed > config.ball.minSpeed + 1) {
        const endX = ball.x - ball.vx * trailLen * 0.022;
        const endY = ball.y - ball.vy * trailLen * 0.022;
        ctx.save();
        const grad = ctx.createLinearGradient(ball.x, ball.y, endX, endY);
        grad.addColorStop(0,    'rgba(120,220,255,0.05)');
        grad.addColorStop(0.25, 'rgba(112,143,255,0.22)');
        grad.addColorStop(0.6,  'rgba(183,133,255,0.42)');
        grad.addColorStop(1,    'rgba(210,245,255,0.90)');
        ctx.strokeStyle = grad;
        ctx.lineWidth   = 14;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(endX,   endY);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle   = config.ball.woodColor;
      ctx.shadowColor = config.ball.glowColor;
      ctx.shadowBlur  = ball.speed > config.ball.minSpeed + 1 ? 32 : 0;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, config.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(170,230,243,0.28)';
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 3, config.ball.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    // ── Win screen overlay (drawn on canvas) ──────────────────────────────────

    const drawWinScreen = () => {
      const { width, height } = stateRef.current;
      const cur = scoreRef.current;
      const w   = winnerRef.current;
      if (!w) return;

      const label = w === 'left' ? 'LEFT WINS' : 'RIGHT WINS';

      ctx.save();
      ctx.fillStyle = 'rgba(3,9,12,0.78)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle    = '#e8c040';
      ctx.font         = `bold ${Math.round(width * 0.065)}px 'Cinzel', serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = '#e8c04088';
      ctx.shadowBlur   = 28;
      ctx.fillText(label, width / 2, height / 2 - 38);

      ctx.fillStyle  = '#d3d0c7';
      ctx.font       = `${Math.round(width * 0.028)}px Georgia, serif`;
      ctx.shadowBlur = 0;
      ctx.fillText(`${cur.left} – ${cur.right}`, width / 2, height / 2 + 20);

      ctx.fillStyle  = '#888';
      ctx.font       = `${Math.round(width * 0.018)}px Georgia, serif`;
      ctx.fillText('Press SPACE or tap to play again', width / 2, height / 2 + 62);
      ctx.restore();
    };

    // ── Keyboard ──────────────────────────────────────────────────────────────

    const handleKeyDown = (e) => {
      const { rightPaddle, leftPaddle } = stateRef.current;

      // Restart on win
      if (winnerRef.current && e.key === ' ') {
        resetGame();
        return;
      }

      if (mode !== 'menu') {
        if (e.key === 'ArrowUp')   rightPaddle.vy = -config.paddle.speed;
        if (e.key === 'ArrowDown') rightPaddle.vy =  config.paddle.speed;
        if (e.key === 'w')         leftPaddle.vy  = -config.paddle.speed;
        if (e.key === 's')         leftPaddle.vy  =  config.paddle.speed;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'ArrowUp'   || e.key === 'ArrowDown') stateRef.current.rightPaddle.vy = 0;
      if (e.key === 'w'         || e.key === 's')         stateRef.current.leftPaddle.vy  = 0;
    };

    // ── Touch controls ────────────────────────────────────────────────────────
    // Left half of screen → left paddle, right half → right paddle.

    const getTouchPaddleY = (clientY) => {
      const rect = canvas.getBoundingClientRect();
      return ((clientY - rect.top) / rect.height) * stateRef.current.height
        - config.paddle.height / 2;
    };

    const handleTouchStart = (e) => {
      e.preventDefault();
      if (winnerRef.current) { resetGame(); return; }

      const rect = canvas.getBoundingClientRect();
      Array.from(e.changedTouches).forEach((t) => {
        const side = t.clientX < rect.left + rect.width / 2 ? 'left' : 'right';
        touches[side] = t.identifier;
      });
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      Array.from(e.changedTouches).forEach((t) => {
        const targetY = getTouchPaddleY(t.clientY);
        if (t.identifier === touches.left && mode !== 'single' && stateRef.current.simMode !== 'background') {
          stateRef.current.leftPaddle.y = clamp(
            targetY,
            borderWidth,
            stateRef.current.height - borderWidth - config.paddle.height,
          );
          stateRef.current.leftPaddle.vy = 0;
        }
        if (t.identifier === touches.right) {
          stateRef.current.rightPaddle.y = clamp(
            targetY,
            borderWidth,
            stateRef.current.height - borderWidth - config.paddle.height,
          );
          stateRef.current.rightPaddle.vy = 0;
        }
      });
    };

    const handleTouchEnd = (e) => {
      Array.from(e.changedTouches).forEach((t) => {
        if (t.identifier === touches.left)  touches.left  = null;
        if (t.identifier === touches.right) touches.right = null;
      });
    };

    // ── Improved AI ───────────────────────────────────────────────────────────
    // Uses reaction delay and imperfect target (error offset) so it misses sometimes.

    const updateAI = (side, paddleRef, dt) => {
      const ai   = aiRef.current[side];
      const ball = stateRef.current.ball;
      const { height } = stateRef.current;

      ai.reactionTimer += dt;

      // Only update target after reaction delay elapses
      if (ai.reactionTimer >= ai.reactionDelay) {
        ai.reactionTimer = 0;
        // Introduce positional error that scales inversely with difficulty
        ai.errorOffset   = (Math.random() - 0.5) * config.paddle.height * 0.55;
        ai.targetY       = ball.y + ai.errorOffset;
        // Randomise next reaction delay slightly
        ai.reactionDelay = 0.08 + Math.random() * 0.10;
      }

      const delta = ai.targetY - (paddleRef.y + config.paddle.height / 2);
      paddleRef.vy = clamp(delta * 0.9, -config.paddle.speed * 0.78, config.paddle.speed * 0.78);
    };

    // ── Tunnel-proof paddle collision ─────────────────────────────────────────

    const resolvePaddleCollision = (paddleX, paddleY, direction) => {
      const ball     = stateRef.current.ball;
      const prevBall = stateRef.current.prevBall;
      const r        = config.ball.radius;
      const pw       = config.paddle.width;
      const ph       = config.paddle.height;

      // Wall X the ball must cross
      const wallX     = direction === 1 ? paddleX + pw : paddleX;
      const segTop    = paddleY - r;
      const segBottom = paddleY + ph + r;

      // Check if ball crossed this wall segment this frame
      const t = sweepCircleVsVerticalSegment(ball, prevBall.x, prevBall.y, wallX, segTop, segBottom, r);
      if (t === null) return false;

      // Only resolve if ball is moving toward the paddle
      if (direction === 1  && ball.vx >= 0) return false;
      if (direction === -1 && ball.vx <= 0) return false;

      // Reflect and add spin based on hit position on paddle
      const hitFrac = clamp((ball.y - paddleY) / ph, 0, 1);
      ball.vx       = direction === 1 ? Math.abs(ball.vx) : -Math.abs(ball.vx);
      ball.vy       = (hitFrac - 0.5) * 1.6;
      ball.x        = direction === 1 ? wallX + r + 1 : wallX - r - 1;
      ball.speed    = clamp(ball.speed + 18, config.ball.minSpeed, config.ball.baseSpeed + 60);
      return true;
    };

    // ── Score / win check ─────────────────────────────────────────────────────

    const handleGoal = (scoringSide, nextBallDirection) => {
      playBell(config.sound.goalTone, config.sound.duration);
      smokeRef.current = { burning: true, timer: 0 };

      setScore((prev) => {
        const next = {
          ...prev,
          [scoringSide]: prev[scoringSide] + 1,
        };
        scoreRef.current = next;

        if (next[scoringSide] >= WIN_SCORE) {
          winnerRef.current        = scoringSide;
          stateRef.current.paused  = true;
          setWinner(scoringSide);
        } else {
          resetBall(nextBallDirection);
        }
        return next;
      });
    };

    // ── Update ────────────────────────────────────────────────────────────────

    const update = (time) => {
      const dt = Math.min(0.032, (time - stateRef.current.lastTime) / 1000);
      stateRef.current.lastTime = time;

      const { width, height, ball, leftPaddle, rightPaddle } = stateRef.current;
      if (stateRef.current.paused) return;

      // Store previous position for sweep collision
      stateRef.current.prevBall = { x: ball.x, y: ball.y };

      // AI control
      if (mode === 'single') updateAI('left', leftPaddle, dt);
      if (stateRef.current.simMode === 'background') {
        updateAI('left',  leftPaddle,  dt);
        updateAI('right', rightPaddle, dt);
      }

      // Move paddles (only if not being driven by touch directly)
      leftPaddle.y  = clamp(leftPaddle.y  + leftPaddle.vy  * dt, borderWidth, height - borderWidth - config.paddle.height);
      rightPaddle.y = clamp(rightPaddle.y + rightPaddle.vy * dt, borderWidth, height - borderWidth - config.paddle.height);

      // Move ball
      ball.x += ball.vx * ball.speed * dt;
      ball.y += ball.vy * ball.speed * dt;

      // Top / bottom wall bounce
      const topEdge    = borderWidth + config.ball.radius;
      const bottomEdge = height - borderWidth - config.ball.radius;
      if (ball.y <= topEdge || ball.y >= bottomEdge) {
        ball.vy  *= -1;
        ball.y    = clamp(ball.y, topEdge, bottomEdge);
      }

      // Goal zone geometry
      const goalTop    = height / 2 - getGoalHeight() / 2;
      const goalBottom = height / 2 + getGoalHeight() / 2;
      const bandLeft   = borderWidth + config.ball.radius;
      const bandRight  = width - borderWidth - config.ball.radius;
      const inGoal     = ball.y >= goalTop && ball.y <= goalBottom;

      // Paddle collisions (sweep-based)
      const leftHit  = resolvePaddleCollision(borderWidth,                             leftPaddle.y,   1);
      const rightHit = resolvePaddleCollision(width - borderWidth - config.paddle.width, rightPaddle.y, -1);

      // Side wall bounce (non-goal sections)
      if (!leftHit && !rightHit && (ball.x <= bandLeft || ball.x >= bandRight)) {
        if (!inGoal) {
          ball.vx  *= -1;
          ball.x    = clamp(ball.x, bandLeft, bandRight);
          ball.speed = clamp(ball.speed + 12, config.ball.minSpeed, config.ball.baseSpeed + 40);
        }
      }

      // Goal detection
      if (ball.x < bandLeft - 20 && inGoal && ball.vx < 0) {
        handleGoal('right', 1);
      }
      if (ball.x > bandRight + 20 && inGoal && ball.vx > 0) {
        handleGoal('left', -1);
      }

      // Friction
      ball.speed = Math.max(ball.speed - 15 * dt, config.ball.minSpeed);

      // Smoke decay
      if (smokeRef.current.burning) {
        smokeRef.current.timer = Math.min(smokeRef.current.timer + dt, 1);
        if (smokeRef.current.timer >= 1) smokeRef.current.burning = false;
      }
    };

    // ── Draw ──────────────────────────────────────────────────────────────────

    const draw = () => {
      const { width, height } = stateRef.current;
      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawScoreboard();
      drawPaddle(borderWidth + 2,                                         stateRef.current.leftPaddle.y);
      drawPaddle(width - borderWidth - config.paddle.width - 2,           stateRef.current.rightPaddle.y);
      drawBall();
      if (winnerRef.current) drawWinScreen();
    };

    // ── Loop ──────────────────────────────────────────────────────────────────

    const loop = (time) => {
      update(time);
      draw();
      if (active) animationFrame = requestAnimationFrame(loop);
    };

    // ── Setup ─────────────────────────────────────────────────────────────────

    resize();
    window.addEventListener('resize',   resize);
    window.addEventListener('keydown',  handleKeyDown);
    window.addEventListener('keyup',    handleKeyUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  handleTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   handleTouchEnd);

    if (mode === 'menu') {
      stateRef.current.simMode      = 'background';
      stateRef.current.paused       = false;
      stateRef.current.ball         = { x: stateRef.current.width / 2, y: stateRef.current.height / 2, vx: 0.78, vy: 0.45, speed: 260 };
      stateRef.current.prevBall     = { x: stateRef.current.ball.x, y: stateRef.current.ball.y };
      stateRef.current.leftPaddle.y = stateRef.current.height / 2 - config.paddle.height / 2;
      stateRef.current.rightPaddle.y= stateRef.current.height / 2 - config.paddle.height / 2;
      stateRef.current.lastTime     = performance.now();
    } else {
      stateRef.current.simMode = 'idle';
      resetGame();
    }

    animationFrame = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize',   resize);
      window.removeEventListener('keydown',  handleKeyDown);
      window.removeEventListener('keyup',    handleKeyUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove',  handleTouchMove);
      canvas.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [config, mode, playerTwo, soloStart, resetGame, resetBall, renderBackground]);

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <div className="fubin-frame" ref={overlayRef} data-challenger={challenger}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }}
      />

      {/* Instructions overlay — shown before first serve */}
      {showInstructions && !winner && (
        <div style={{ position: 'absolute', inset: '24px', display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', background: 'rgba(3,9,12,0.72)', padding: '18px 22px', borderRadius: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#e8c040', fontFamily: "'Cinzel', serif" }}>
              Fubin
            </h2>
            <p style={{ margin: '12px 0 4px', color: '#d3d0c7', fontFamily: 'Georgia, serif' }}>
              Press Play to begin.
            </p>
            <p style={{ margin: '4px 0 0', color: '#888', fontFamily: 'Georgia, serif', fontSize: '0.9em' }}>
              W / S &nbsp;·&nbsp; Arrow keys &nbsp;·&nbsp; Touch supported
            </p>
            <p style={{ margin: '8px 0 0', color: '#e8c040aa', fontFamily: 'Georgia, serif', fontSize: '0.85em' }}>
              First to {WIN_SCORE} wins
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FubinGame;
