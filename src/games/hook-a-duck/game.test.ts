import { describe, expect, it } from 'vitest';
import {
  CASTS,
  DUCK_SPEED,
  DUCK_VALUES,
  HOOK_TOP,
  cast,
  createState,
  duckPosition,
  duckUnderHook,
  step,
} from './game';

/** Casts at a duck and runs the hook down and back up again. */
function castAndLand(state: ReturnType<typeof createState>, x: number, y: number) {
  cast(state, x, y);
  for (let i = 0; i < 200 && state.hook; i++) step(state, 0.01);
}

describe('hook a duck', () => {
  it('starts with every cast left and no score', () => {
    const state = createState();
    expect(state.casts).toBe(CASTS);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.ducks.map((d) => d.value)).toEqual([...DUCK_VALUES]);
  });

  it('floats the ducks round the stream in a loop', () => {
    const state = createState();
    const start = duckPosition(state.ducks[0]);
    step(state, 1);
    expect(duckPosition(state.ducks[0])).not.toEqual(start);
    step(state, (Math.PI * 2) / DUCK_SPEED - 1);
    const back = duckPosition(state.ducks[0]);
    expect(back.x).toBeCloseTo(start.x);
    expect(back.y).toBeCloseTo(start.y);
  });

  it('uses one cast per cast, and only one hook at a time', () => {
    const state = createState();
    expect(cast(state, 400, 300)).toBe(true);
    expect(state.casts).toBe(CASTS - 1);
    expect(cast(state, 400, 300)).toBe(false);
    expect(state.casts).toBe(CASTS - 1);
  });

  it('cannot cast once the casts are used up', () => {
    const state = createState();
    state.casts = 0;
    expect(cast(state, 400, 300)).toBe(false);
    expect(state.hook).toBeUndefined();
  });

  it('scores the number on the duck the hook lands on', () => {
    const state = createState();
    state.ducks = [{ angle: Math.PI / 2, value: 50 }];
    const pos = duckPosition(state.ducks[0]);
    cast(state, pos.x, pos.y);
    const hook = state.hook!;
    // Start the hook just above the duck, and back the duck up by one step's
    // drift, so the hook lands right on it.
    hook.y = hook.targetY - 1;
    state.ducks[0].angle -= DUCK_SPEED * 0.01;
    step(state, 0.01);
    expect(hook.caught).toBe(50);
    expect(state.score).toBe(50);
  });

  it('scores nothing when the hook misses', () => {
    const state = createState();
    castAndLand(state, 400, 280);
    expect(state.score).toBe(0);
    expect(state.hook).toBeUndefined();
  });

  it('brings the hook back up after it lands', () => {
    const state = createState();
    cast(state, 400, 280);
    step(state, 1);
    expect(state.hook?.phase).toBe('raising');
    step(state, 1);
    expect(state.hook).toBeUndefined();
    expect(HOOK_TOP).toBeLessThan(280);
  });

  it('finds the duck under the hook, and nothing far from it', () => {
    const state = createState();
    const pos = duckPosition(state.ducks[3]);
    expect(duckUnderHook(state, pos.x + 5, pos.y)).toBe(state.ducks[3]);
    expect(duckUnderHook(state, 400, 280)).toBeUndefined();
  });

  it('ends the round once the last cast is back up', () => {
    const state = createState();
    state.casts = 1;
    cast(state, 400, 280);
    step(state, 0.01);
    expect(state.phase).toBe('playing');
    castAndLand(state, 0, 0);
    expect(state.phase).toBe('over');
    expect(cast(state, 400, 280)).toBe(false);
  });
});
