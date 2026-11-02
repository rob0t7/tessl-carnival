import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const CASTS = 10;
/** The stream is an oval loop the ducks float round. */
export const STREAM = { x: WIDTH / 2, y: 280, rx: 310, ry: 150 } as const;
/** Radians per second the ducks travel round the stream. */
export const DUCK_SPEED = 0.5;
export const HOOK_SPEED = 600;
export const HOOK_TOP = 50;
export const CATCH_RADIUS = 26;
/** The number on each duck's base, in order round the stream. */
export const DUCK_VALUES = [10, 20, 10, 50, 10, 30, 10, 20] as const;

export interface Duck {
  /** Where the duck is round the stream, in radians. */
  angle: number;
  value: number;
}

export interface Hook {
  x: number;
  y: number;
  /** The depth the hook was cast to. */
  targetY: number;
  phase: 'lowering' | 'raising';
  /** The number on the duck it caught, if any. */
  caught?: number;
}

export interface HookADuckState {
  ducks: Duck[];
  hook?: Hook;
  casts: number;
  score: number;
  phase: 'playing' | 'over';
}

export function createState(): HookADuckState {
  const ducks = DUCK_VALUES.map((value, i) => ({
    angle: (Math.PI * 2 * i) / DUCK_VALUES.length,
    value,
  }));
  return { ducks, casts: CASTS, score: 0, phase: 'playing' };
}

export function duckPosition(duck: Duck): { x: number; y: number } {
  return {
    x: STREAM.x + STREAM.rx * Math.cos(duck.angle),
    y: STREAM.y + STREAM.ry * Math.sin(duck.angle),
  };
}

/** The duck closest to the hook, if one is within reach of it. */
export function duckUnderHook(state: HookADuckState, x: number, y: number): Duck | undefined {
  let best: Duck | undefined;
  let bestDistance = CATCH_RADIUS;
  for (const duck of state.ducks) {
    const pos = duckPosition(duck);
    const distance = Math.hypot(pos.x - x, pos.y - y);
    if (distance <= bestDistance) {
      best = duck;
      bestDistance = distance;
    }
  }
  return best;
}

/** Lowers the hook towards the aim point. Returns false if nothing was cast. */
export function cast(state: HookADuckState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.casts === 0 || state.hook) return false;
  state.hook = {
    x: Math.min(Math.max(aimX, 0), WIDTH),
    y: HOOK_TOP,
    targetY: Math.min(Math.max(aimY, HOOK_TOP), HEIGHT),
    phase: 'lowering',
  };
  state.casts -= 1;
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: HookADuckState, dt: number): void {
  for (const duck of state.ducks) {
    duck.angle = (duck.angle + DUCK_SPEED * dt) % (Math.PI * 2);
  }

  const hook = state.hook;
  if (hook?.phase === 'lowering') {
    hook.y = Math.min(hook.y + HOOK_SPEED * dt, hook.targetY);
    if (hook.y === hook.targetY) {
      const duck = duckUnderHook(state, hook.x, hook.y);
      if (duck) {
        hook.caught = duck.value;
        state.score += duck.value;
      }
      hook.phase = 'raising';
    }
  } else if (hook?.phase === 'raising') {
    hook.y = Math.max(hook.y - HOOK_SPEED * dt, HOOK_TOP);
    if (hook.y === HOOK_TOP) state.hook = undefined;
  }

  if (state.casts === 0 && !state.hook) state.phase = 'over';
}

function drawDuck(ctx: CanvasRenderingContext2D, x: number, y: number, value: number) {
  const { colors } = theme;
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.ellipse(x, y, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 14, y - 14, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.stripeA;
  ctx.beginPath();
  ctx.moveTo(x + 22, y - 16);
  ctx.lineTo(x + 32, y - 12);
  ctx.lineTo(x + 22, y - 10);
  ctx.fill();
  ctx.fillStyle = colors.background;
  ctx.font = canvasFont('small', 'bold');
  ctx.textAlign = 'center';
  ctx.fillText(String(value), x - 4, y + 6);
}

function draw(ctx: CanvasRenderingContext2D, state: HookADuckState, aim: { x: number; y: number }) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  // The stream, round an island in the middle.
  ctx.strokeStyle = colors.wood;
  ctx.lineWidth = 76;
  ctx.beginPath();
  ctx.ellipse(STREAM.x, STREAM.y, STREAM.rx, STREAM.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = colors.water;
  ctx.lineWidth = 64;
  ctx.stroke();
  ctx.fillStyle = colors.surface;
  ctx.beginPath();
  ctx.ellipse(STREAM.x, STREAM.y, STREAM.rx - 38, STREAM.ry - 38, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const duck of state.ducks) {
    const pos = duckPosition(duck);
    drawDuck(ctx, pos.x, pos.y, duck.value);
  }

  // The rod hangs over the aim until a cast, then the hook drops from it.
  const hookX = state.hook ? state.hook.x : aim.x;
  const hookY = state.hook ? state.hook.y : HOOK_TOP;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(hookX - 60, HOOK_TOP - 8, 66, 8);
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hookX, HOOK_TOP);
  ctx.lineTo(hookX, hookY);
  ctx.stroke();
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hookX - 6, hookY, 6, 0, Math.PI);
  ctx.stroke();
  if (state.hook?.caught !== undefined) {
    drawDuck(ctx, hookX, hookY + 20, state.hook.caught);
  }

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Casts ${state.casts}/${CASTS}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of casts! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const hookADuck: CarnivalGame = {
  id: 'hook-a-duck',
  name: 'Hook a Duck',
  description: 'Lower your hook onto a passing duck. The number on its base is your score.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    const aim = { x: WIDTH / 2, y: STREAM.y };

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
        cast(state, aim.x, aim.y);
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
        recordScore(hookADuck.id, state.score);
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

export default hookADuck;
