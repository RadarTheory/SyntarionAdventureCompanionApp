import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getRandomDirection = () => {
  const angle = Math.PI * (0.2 + Math.random() * 0.6);

  return {
    x: Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1),
    y: Math.sin(angle) * (Math.random() > 0.5 ? 1 : -1),
  };
};

const FubinGame = ({ config, mode, playerTwo, soloStart }) => {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const scoreRef = useRef(score);
  const smokeRef = useRef({ burning: false, timer: 0 });
  const [challenger, setChallenger] = useState('');

  const stateRef = useRef({
    width: 1280,
    height: 720,
    ball: { x: 0, y: 0, vx: 0, vy: 0, speed: 0 },
    leftPaddle: { y: 0, vy: 0 },
    rightPaddle: { y: 0, vy: 0 },
    lastTime: 0,
    paused: true,
    simMode: 'idle',
  });

  const getGoalHeight = () => config.board.goalHeightRatio * stateRef.current.height;
  const borderWidth = config.board.borderWidth;

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    if (playerTwo) {
      setChallenger(playerTwo.name);
      setScore({ left: 0, right: 0 });
      smokeRef.current = { burning: false, timer: 0 };
    }
  }, [playerTwo]);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let animationFrame = 0;
    let active = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
    };

    const resetBall = (direction) => {
      const { width, height } = stateRef.current;
      const dir = getRandomDirection();
      stateRef.current.ball = {
        x: width / 2,
        y: height / 2,
        vx: direction * Math.abs(dir.x),
        vy: dir.y,
        speed: config.ball.baseSpeed,
      };
    };

    const resetGame = () => {
      const { width, height } = stateRef.current;
      stateRef.current.leftPaddle.y = height / 2 - config.paddle.height / 2;
      stateRef.current.rightPaddle.y = height / 2 - config.paddle.height / 2;
      resetBall(1);
      stateRef.current.paused = false;
      stateRef.current.lastTime = performance.now();
      setShowInstructions(false);
    };

    const playBell = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const ctxAudio = new AudioContext();
      const osc = ctxAudio.createOscillator();
      const gain = ctxAudio.createGain();
      osc.type = 'sine';
      osc.frequency.value = config.sound.goalTone;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctxAudio.destination);
      osc.start();
      osc.stop(ctxAudio.currentTime + config.sound.duration);
      osc.onended = () => ctxAudio.close();
    };

    const smokeTrigger = () => {
      smokeRef.current = { burning: true, timer: 0 };
    };

    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const drawFence = () => {
      const { width, height } = stateRef.current;
      const gap = getGoalHeight();
      ctx.save();
      ctx.fillStyle = '#1f201c';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = config.board.wallColor;
      ctx.fillRect(0, 0, borderWidth, height);
      ctx.fillRect(width - borderWidth, 0, borderWidth, height);
      ctx.fillRect(0, 0, width, borderWidth);
      ctx.fillRect(0, height - borderWidth, width, borderWidth);
      ctx.clearRect(0, height / 2 - gap / 2, borderWidth, gap);
      ctx.clearRect(width - borderWidth, height / 2 - gap / 2, borderWidth, gap);
      ctx.globalCompositeOperation = 'source-over';

      const drawVines = (x, y, count, horizontal) => {
        for (let i = 0; i < count; i += 1) {
          const offset = (i / count) * (horizontal ? width : height);
          const thickness = 8 + Math.random() * 6;
          ctx.strokeStyle = config.board.vineColor;
          ctx.lineWidth = thickness;
          ctx.beginPath();
          ctx.moveTo(x + (horizontal ? offset : 0), y + (horizontal ? 0 : offset));
          ctx.bezierCurveTo(
            x + (horizontal ? offset + 10 : 25),
            y + (horizontal ? 30 : offset + 40),
            x + (horizontal ? offset + 20 : 15),
            y + (horizontal ? 60 : offset + 90),
            x + (horizontal ? offset : 0),
            y + (horizontal ? 90 : offset + 140),
          );
          ctx.stroke();
        }
      };

      drawVines(0, 4, 7, true);
      drawVines(0, 4, 5, false);
      drawVines(width - borderWidth, 0, 6, false);
      drawVines(0, height - borderWidth, 9, true);

      for (let i = 0; i < 16; i += 1) {
        ctx.fillStyle = config.board.flowerColor;
        const rx = Math.random() * width;
        const ry = Math.random() * height;
        ctx.beginPath();
        ctx.arc(rx, ry, 2 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };

    const drawScoreboard = () => {
      const { width, height } = stateRef.current;
      const sbWidth = config.scoreboard.width;
      const sbHeight = config.scoreboard.height;
      const x = width / 2 - sbWidth / 2;
      const y = height / 2 - sbHeight / 2;
      const currentScore = scoreRef.current;

      ctx.save();
      ctx.globalAlpha = config.scoreboard.opacity;
      ctx.fillStyle = config.scoreboard.woodColor;
      ctx.strokeStyle = '#3b281c';
      ctx.lineWidth = 5;
      roundRect(x, y, sbWidth, sbHeight, 18);
      ctx.fill();
      ctx.stroke();
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = config.scoreboard.burnColor;
      ctx.font = 'bold 44px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${currentScore.left}  -  ${currentScore.right}`, width / 2, height / 2);

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
      ctx.fillStyle = config.paddle.woodColor;
      ctx.fillRect(x, y, config.paddle.width, config.paddle.height);
      ctx.strokeStyle = config.paddle.edgeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, config.paddle.width, config.paddle.height);
      ctx.restore();
    };

    const drawBall = () => {
      const ball = stateRef.current.ball;
      const speedRange = config.ball.baseSpeed - config.ball.minSpeed;
      const trailLength = speedRange > 0
        ? ((ball.speed - config.ball.minSpeed) / speedRange) * config.ball.trailMax
        : 0;

      if (ball.speed > config.ball.minSpeed + 1) {
        ctx.save();
        const endX = ball.x - ball.vx * trailLength * 0.022;
        const endY = ball.y - ball.vy * trailLength * 0.022;
        const grad = ctx.createLinearGradient(ball.x, ball.y, endX, endY);
        grad.addColorStop(0, 'rgba(120, 220, 255, 0.05)');
        grad.addColorStop(0.25, 'rgba(112, 143, 255, 0.22)');
        grad.addColorStop(0.6, 'rgba(183, 133, 255, 0.42)');
        grad.addColorStop(1, 'rgba(210, 245, 255, 0.9)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.fillStyle = config.ball.woodColor;
      ctx.shadowColor = config.ball.glowColor;
      ctx.shadowBlur = ball.speed > config.ball.minSpeed + 1 ? 32 : 0;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, config.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(170, 230, 243, 0.28)';
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 3, config.ball.radius * 0.45, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const handleKeyboard = (event) => {
      const { rightPaddle, leftPaddle } = stateRef.current;
      if (mode !== 'menu') {
        if (event.key === 'ArrowUp') rightPaddle.vy = -config.paddle.speed;
        if (event.key === 'ArrowDown') rightPaddle.vy = config.paddle.speed;
        if (event.key === 'w') leftPaddle.vy = -config.paddle.speed;
        if (event.key === 's') leftPaddle.vy = config.paddle.speed;
      }
    };

    const handleKeyUp = (event) => {
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        stateRef.current.rightPaddle.vy = 0;
      }
      if (event.key === 'w' || event.key === 's') {
        stateRef.current.leftPaddle.vy = 0;
      }
    };

    const aiMove = (targetY, currentY) => {
      const delta = targetY - (currentY + config.paddle.height / 2);
      return clamp(delta * 0.7, -config.paddle.speed * 0.75, config.paddle.speed * 0.75);
    };

    const update = (time) => {
      const dt = Math.min(0.032, (time - stateRef.current.lastTime) / 1000);
      stateRef.current.lastTime = time;
      const { width, height, ball, leftPaddle, rightPaddle } = stateRef.current;
      if (stateRef.current.paused) return;

      if (mode === 'single') leftPaddle.vy = aiMove(ball.y, leftPaddle.y);
      if (stateRef.current.simMode === 'background') {
        leftPaddle.vy = aiMove(ball.y, leftPaddle.y);
        rightPaddle.vy = aiMove(ball.y * 0.96, rightPaddle.y);
      }

      leftPaddle.y = clamp(leftPaddle.y + leftPaddle.vy * dt, borderWidth, height - borderWidth - config.paddle.height);
      rightPaddle.y = clamp(rightPaddle.y + rightPaddle.vy * dt, borderWidth, height - borderWidth - config.paddle.height);

      ball.x += ball.vx * ball.speed * dt;
      ball.y += ball.vy * ball.speed * dt;

      const topEdge = borderWidth + config.ball.radius;
      const bottomEdge = height - borderWidth - config.ball.radius;
      if (ball.y <= topEdge || ball.y >= bottomEdge) {
        ball.vy *= -1;
        ball.y = clamp(ball.y, topEdge, bottomEdge);
      }

      const goalTop = height / 2 - getGoalHeight() / 2;
      const goalBottom = height / 2 + getGoalHeight() / 2;
      const bandLeft = borderWidth + config.ball.radius;
      const bandRight = width - borderWidth - config.ball.radius;
      const inGoal = ball.y >= goalTop && ball.y <= goalBottom;

      const paddleHit = (paddleX, paddleY, direction) => {
        const withinY = ball.y >= paddleY - config.ball.radius
          && ball.y <= paddleY + config.paddle.height + config.ball.radius;
        if (!withinY) return false;

        if (direction === 1) {
          const paddleRight = paddleX + config.paddle.width;
          if (ball.vx < 0 && ball.x - config.ball.radius <= paddleRight && ball.x - config.ball.radius >= paddleX) {
            ball.vx = Math.abs(ball.vx);
            ball.vy = 0.6 * (ball.y - (paddleY + config.paddle.height / 2)) / (config.paddle.height / 2);
            ball.x = paddleRight + config.ball.radius + 1;
            ball.speed = clamp(ball.speed + 18, config.ball.minSpeed, config.ball.baseSpeed + 60);
            return true;
          }
        }

        if (direction === -1) {
          const paddleRight = paddleX + config.paddle.width;
          if (ball.vx > 0 && ball.x + config.ball.radius >= paddleX && ball.x + config.ball.radius <= paddleRight) {
            ball.vx = -Math.abs(ball.vx);
            ball.vy = 0.6 * (ball.y - (paddleY + config.paddle.height / 2)) / (config.paddle.height / 2);
            ball.x = paddleX - config.ball.radius - 1;
            ball.speed = clamp(ball.speed + 18, config.ball.minSpeed, config.ball.baseSpeed + 60);
            return true;
          }
        }

        return false;
      };

      const leftBlocked = paddleHit(borderWidth, leftPaddle.y, 1);
      const rightBlocked = paddleHit(width - borderWidth - config.paddle.width, rightPaddle.y, -1);

      if (!leftBlocked && !rightBlocked && (ball.x <= bandLeft || ball.x >= bandRight)) {
        if (!inGoal) {
          ball.vx *= -1;
          ball.x = clamp(ball.x, bandLeft, bandRight);
          ball.speed = clamp(ball.speed + 12, config.ball.minSpeed, config.ball.baseSpeed + 40);
        }
      }

      if (ball.x < bandLeft - 20 && inGoal && ball.vx < 0) {
        setScore((prev) => ({ ...prev, right: prev.right + 1 }));
        playBell();
        smokeTrigger();
        resetBall(1);
      }

      if (ball.x > bandRight + 20 && inGoal && ball.vx > 0) {
        setScore((prev) => ({ ...prev, left: prev.left + 1 }));
        playBell();
        smokeTrigger();
        resetBall(-1);
      }

      ball.speed = Math.max(ball.speed - 15 * dt, config.ball.minSpeed);
      if (smokeRef.current.burning) {
        smokeRef.current.timer = Math.min(smokeRef.current.timer + dt, 1);
        if (smokeRef.current.timer >= 1) smokeRef.current.burning = false;
      }
    };

    const draw = () => {
      const { width, height } = stateRef.current;
      ctx.clearRect(0, 0, width, height);
      drawFence();
      drawScoreboard();
      drawPaddle(borderWidth + 2, stateRef.current.leftPaddle.y);
      drawPaddle(width - borderWidth - config.paddle.width - 2, stateRef.current.rightPaddle.y);
      drawBall();
    };

    const loop = (time) => {
      update(time);
      draw();
      if (active) animationFrame = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', handleKeyboard);
    window.addEventListener('keyup', handleKeyUp);

    if (mode === 'menu') {
      stateRef.current.simMode = 'background';
      stateRef.current.paused = false;
      stateRef.current.ball = {
        x: stateRef.current.width / 2,
        y: stateRef.current.height / 2,
        vx: 0.78,
        vy: 0.45,
        speed: 260,
      };
      stateRef.current.leftPaddle.y = stateRef.current.height / 2 - config.paddle.height / 2;
      stateRef.current.rightPaddle.y = stateRef.current.height / 2 - config.paddle.height / 2;
      stateRef.current.lastTime = performance.now();
    } else {
      stateRef.current.simMode = 'idle';
      resetGame();
    }

    animationFrame = requestAnimationFrame(loop);

    return () => {
      active = false;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', handleKeyboard);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [config, mode, playerTwo, soloStart]);

  return (
    <div className="fubin-frame" ref={overlayRef} data-challenger={challenger}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      {showInstructions && (
        <div style={{ position: 'absolute', inset: '24px', display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
          <div style={{ textAlign: 'center', background: 'rgba(3,9,12,0.72)', padding: '18px 22px', borderRadius: '18px' }}>
            <h2 style={{ margin: 0, fontSize: '1.6rem', color: '#e8c040', fontFamily: "'Cinzel', serif" }}>Fubin</h2>
            <p style={{ margin: '12px 0 0', color: '#d3d0c7', fontFamily: 'Georgia, serif' }}>
              Press Play to begin. W/S for left paddle, Arrow keys for right.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FubinGame;
