import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const ROUND_SECONDS = 30;
export const POINTS_PER_WHACK = 10;
export const HOLE_RADIUS = 46;
const COLUMNS = 3;
const ROWS = 3;

/** Seconds between pop-ups, and how long a mole stays up, at the start and end of a round. */
export const SPAWN_INTERVAL = { start: 1.0, end: 0.35 } as const;
export const UP_TIME = { start: 1.3, end: 0.6 } as const;

export interface Hole {
  x: number;
  y: number;
  /** Seconds left before the mole drops back down, or 0 when the hole is empty. */
  moleTimeLeft: number;
  /** Seconds since this hole's mole was whacked, or undefined if it wasn't. */
  whackedAge?: number;
}

export interface WhackAMoleState {
  holes: Hole[];
  timeLeft: number;
  /** Seconds until the next mole pops up. */
  nextSpawn: number;
  score: number;
  phase: 'playing' | 'over';
}

export function createState(): WhackAMoleState {
  const holes: Hole[] = [];
  const spacingX = WIDTH / (COLUMNS + 1);
  const top = 150;
  const spacingY = 120;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLUMNS; col++) {
      holes.push({ x: spacingX * (col + 1), y: top + spacingY * row, moleTimeLeft: 0 });
    }
  }
  return {
    holes,
    timeLeft: ROUND_SECONDS,
    nextSpawn: SPAWN_INTERVAL.start,
    score: 0,
    phase: 'playing',
  };
}

/** How far through the round we are, from 0 at the start to 1 at the end. */
function progress(state: WhackAMoleState): number {
  return 1 - state.timeLeft / ROUND_SECONDS;
}

function lerp(range: { start: number; end: number }, t: number): number {
  return range.start + (range.end - range.start) * t;
}

/** Seconds between pop-ups right now. Moles pop up faster as the round goes on. */
export function spawnInterval(state: WhackAMoleState): number {
  return lerp(SPAWN_INTERVAL, progress(state));
}

/** How long a mole popping up right now stays up. */
export function upTime(state: WhackAMoleState): number {
  return lerp(UP_TIME, progress(state));
}

export function isMoleUp(hole: Hole): boolean {
  return hole.moleTimeLeft > 0;
}

/**
 * Whacks whatever is at the point. Returns true and scores if a mole was up
 * there, and false for a miss.
 */
export function whack(state: WhackAMoleState, x: number, y: number): boolean {
  if (state.phase !== 'playing') return false;
  const hole = state.holes.find(
    (h) => isMoleUp(h) && Math.hypot(x - h.x, y - (h.y - HOLE_RADIUS * 0.4)) <= HOLE_RADIUS,
  );
  if (!hole) return false;
  hole.moleTimeLeft = 0;
  hole.whackedAge = 0;
  state.score += POINTS_PER_WHACK;
  return true;
}

/**
 * Advances the game by `dt` seconds. `random` picks which empty hole the next
 * mole pops up from, and returns a number in [0, 1) like Math.random.
 */
export function step(state: WhackAMoleState, dt: number, random: () => number = Math.random) {
  if (state.phase !== 'playing') return;

  state.timeLeft = Math.max(0, state.timeLeft - dt);
  for (const hole of state.holes) {
    hole.moleTimeLeft = Math.max(0, hole.moleTimeLeft - dt);
    if (hole.whackedAge !== undefined) {
      hole.whackedAge += dt;
      if (hole.whackedAge >= 0.3) hole.whackedAge = undefined;
    }
  }

  if (state.timeLeft === 0) {
    for (const hole of state.holes) hole.moleTimeLeft = 0;
    state.phase = 'over';
    return;
  }

  state.nextSpawn -= dt;
  if (state.nextSpawn <= 0) {
    const empty = state.holes.filter((h) => !isMoleUp(h) && h.whackedAge === undefined);
    if (empty.length > 0) {
      const hole = empty[Math.floor(random() * empty.length)];
      hole.moleTimeLeft = upTime(state);
    }
    state.nextSpawn = spawnInterval(state);
  }
}

function draw(ctx: CanvasRenderingContext2D, state: WhackAMoleState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  for (const hole of state.holes) {
    // The hole.
    ctx.fillStyle = colors.wood;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y, HOLE_RADIUS + 6, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.surface;
    ctx.beginPath();
    ctx.ellipse(hole.x, hole.y, HOLE_RADIUS, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    if (isMoleUp(hole)) {
      // The mole, clipped so it rises out of the hole.
      ctx.save();
      ctx.beginPath();
      ctx.rect(hole.x - HOLE_RADIUS, hole.y - HOLE_RADIUS * 2, HOLE_RADIUS * 2, HOLE_RADIUS * 2);
      ctx.clip();
      const headY = hole.y - HOLE_RADIUS * 0.4;
      ctx.fillStyle = colors.wood;
      ctx.beginPath();
      ctx.arc(hole.x, headY, HOLE_RADIUS * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.text;
      ctx.beginPath();
      ctx.arc(hole.x - 12, headY - 8, 5, 0, Math.PI * 2);
      ctx.arc(hole.x + 12, headY - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colors.stripeA;
      ctx.beginPath();
      ctx.arc(hole.x, headY + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (hole.whackedAge !== undefined) {
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1 - hole.whackedAge / 0.3;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y - HOLE_RADIUS * 0.4, 20 + hole.whackedAge * 120, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Time ${Math.ceil(state.timeLeft)}s`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Time's up! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const whackAMole: CarnivalGame = {
  id: 'whack-a-mole',
  name: 'Whack-a-Mole',
  description: 'Whack the moles before they duck back down. They get quicker as time runs out.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const onDown = (event: PointerEvent) => {
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      whack(
        state,
        ((event.clientX - rect.left) / rect.width) * WIDTH,
        ((event.clientY - rect.top) / rect.height) * HEIGHT,
      );
    };
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't skip the round.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(whackAMole.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default whackAMole;
