import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const RINGS_PER_ROUND = 8;
/** Seconds a ring spends in the air. */
export const FLIGHT_TIME = 0.6;
/** How close to the middle of a neck a ring has to land, in pixels. */
export const NECK_RADIUS = 14;
/** How far the throwing hand sways from the aim, in pixels. */
export const SWAY = 24;
const SWAY_SPEED = 3;
export const HAND = { x: WIDTH / 2, y: HEIGHT - 30 } as const;
const ROWS = [
  { y: 130, points: 30 },
  { y: 210, points: 20 },
  { y: 290, points: 10 },
];
const BOTTLES_PER_ROW = 5;

export interface Bottle {
  x: number;
  /** Where the neck is: rings land here. */
  y: number;
  points: number;
  ringers: number;
}

export interface Ring {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  /** Seconds since the throw. */
  age: number;
}

export interface Landed {
  x: number;
  y: number;
  ringer: boolean;
}

export interface RingTossState {
  bottles: Bottle[];
  ring: Ring | null;
  landed: Landed[];
  rings: number;
  score: number;
  /** Seconds since the round started, which drives the sway. */
  time: number;
  phase: 'playing' | 'over';
}

export function createState(): RingTossState {
  const spacing = WIDTH / (BOTTLES_PER_ROW + 1);
  const bottles = ROWS.flatMap((row) =>
    Array.from({ length: BOTTLES_PER_ROW }, (_, i) => ({
      x: spacing * (i + 1),
      y: row.y,
      points: row.points,
      ringers: 0,
    })),
  );
  return {
    bottles,
    ring: null,
    landed: [],
    rings: RINGS_PER_ROUND,
    score: 0,
    time: 0,
    phase: 'playing',
  };
}

/** How far the throw drifts sideways from the aim at this moment. */
export function sway(state: RingTossState): number {
  return SWAY * Math.sin(state.time * SWAY_SPEED);
}

/** The bottle a ring landing at (x, y) rings, if any. */
export function bottleAt(state: RingTossState, x: number, y: number): Bottle | undefined {
  return state.bottles.find((b) => Math.hypot(x - b.x, y - b.y) <= NECK_RADIUS);
}

/** Throws one ring towards the aim point. Returns false if nothing was thrown. */
export function toss(state: RingTossState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.rings === 0 || state.ring) return false;
  state.ring = {
    fromX: HAND.x,
    fromY: HAND.y,
    toX: aimX + sway(state),
    toY: Math.min(aimY, HAND.y - 1),
    age: 0,
  };
  state.rings -= 1;
  return true;
}

/** Where a ring in the air is now. */
export function ringPosition(ring: Ring): { x: number; y: number } {
  const t = Math.min(ring.age / FLIGHT_TIME, 1);
  return {
    x: ring.fromX + (ring.toX - ring.fromX) * t,
    y: ring.fromY + (ring.toY - ring.fromY) * t,
  };
}

/** Advances the game by `dt` seconds. */
export function step(state: RingTossState, dt: number): void {
  state.time += dt;

  const ring = state.ring;
  if (ring) {
    ring.age += dt;
    if (ring.age >= FLIGHT_TIME) {
      const bottle = bottleAt(state, ring.toX, ring.toY);
      if (bottle) {
        bottle.ringers += 1;
        state.score += bottle.points;
      }
      state.landed.push({ x: ring.toX, y: ring.toY, ringer: bottle !== undefined });
      state.ring = null;
    }
  }

  if (state.rings === 0 && !state.ring) state.phase = 'over';
}

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, state: RingTossState, aim: { x: number; y: number }) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  for (const row of ROWS) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(0, row.y + 44, WIDTH, 8);
    ctx.fillStyle = colors.muted;
    ctx.font = canvasFont('small');
    ctx.textAlign = 'left';
    ctx.fillText(`${row.points}`, 12, row.y + 40);
  }

  for (const bottle of state.bottles) {
    ctx.fillStyle = colors.water;
    ctx.fillRect(bottle.x - 14, bottle.y + 14, 28, 30);
    ctx.fillRect(bottle.x - 5, bottle.y - 4, 10, 20);
    ctx.fillStyle = colors.surface;
    ctx.fillRect(bottle.x - 6, bottle.y - 8, 12, 5);
  }

  ctx.lineWidth = 4;
  for (const ring of state.landed) {
    ctx.strokeStyle = ring.ringer ? colors.accent : colors.muted;
    ctx.globalAlpha = ring.ringer ? 1 : 0.5;
    drawRing(ctx, ring.x, ring.y + (ring.ringer ? 6 : 30), 12);
  }
  ctx.globalAlpha = 1;

  if (state.ring) {
    const { x, y } = ringPosition(state.ring);
    const t = Math.min(state.ring.age / FLIGHT_TIME, 1);
    ctx.strokeStyle = colors.accent;
    drawRing(ctx, x, y, 22 - 10 * t);
  }

  // The aim marker, swaying where the next ring will land.
  if (state.phase === 'playing' && !state.ring && state.rings > 0) {
    const x = aim.x + sway(state);
    const y = Math.min(aim.y, HAND.y - 1);
    ctx.strokeStyle = colors.danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.moveTo(x, y - 8);
    ctx.lineTo(x, y + 8);
    ctx.stroke();
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Rings ${state.rings}/${RINGS_PER_ROUND}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of rings! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const ringToss: CarnivalGame = {
  id: 'ring-toss',
  name: 'Ring Toss',
  description: 'Land rings on the bottle necks. Bottles further back score more.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    const aim = { x: WIDTH / 2, y: HEIGHT / 2 };

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const onMove = (event: PointerEvent) => Object.assign(aim, toCanvas(event));
    const onDown = (event: PointerEvent) => {
      Object.assign(aim, toCanvas(event));
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        toss(state, aim.x, aim.y);
      }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(ringToss.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state, aim);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default ringToss;
