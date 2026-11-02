import { describe, expect, it } from 'vitest';
import {
  HOLE_RADIUS,
  POINTS_PER_WHACK,
  ROUND_SECONDS,
  SPAWN_INTERVAL,
  UP_TIME,
  createState,
  isMoleUp,
  spawnInterval,
  step,
  upTime,
  whack,
} from './game';

const first = () => 0;

describe('whack-a-mole', () => {
  it('starts with a full clock, no score and every hole empty', () => {
    const state = createState();
    expect(state.timeLeft).toBe(ROUND_SECONDS);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.holes).toHaveLength(9);
    expect(state.holes.some(isMoleUp)).toBe(false);
  });

  it('pops a mole up from a hole when the spawn timer runs out', () => {
    const state = createState();
    step(state, SPAWN_INTERVAL.start, first);
    expect(state.holes[0].moleTimeLeft).toBeGreaterThan(0);
    expect(state.holes.filter(isMoleUp)).toHaveLength(1);
  });

  it('drops a mole back down when its time is up', () => {
    const state = createState();
    state.holes[0].moleTimeLeft = 0.5;
    state.nextSpawn = 10;
    step(state, 0.6, first);
    expect(isMoleUp(state.holes[0])).toBe(false);
  });

  it('scores a whack on a mole that is up and sends it down', () => {
    const state = createState();
    const hole = state.holes[4];
    hole.moleTimeLeft = 1;
    expect(whack(state, hole.x, hole.y - HOLE_RADIUS * 0.4)).toBe(true);
    expect(state.score).toBe(POINTS_PER_WHACK);
    expect(isMoleUp(hole)).toBe(false);
  });

  it('scores nothing for a whack on an empty hole', () => {
    const state = createState();
    const hole = state.holes[4];
    expect(whack(state, hole.x, hole.y)).toBe(false);
    expect(state.score).toBe(0);
  });

  it('cannot whack the same mole twice', () => {
    const state = createState();
    const hole = state.holes[0];
    hole.moleTimeLeft = 1;
    whack(state, hole.x, hole.y);
    expect(whack(state, hole.x, hole.y)).toBe(false);
    expect(state.score).toBe(POINTS_PER_WHACK);
  });

  it('pops moles up faster, for less time, as the round goes on', () => {
    const state = createState();
    expect(spawnInterval(state)).toBe(SPAWN_INTERVAL.start);
    expect(upTime(state)).toBe(UP_TIME.start);
    state.timeLeft = ROUND_SECONDS / 2;
    expect(spawnInterval(state)).toBeLessThan(SPAWN_INTERVAL.start);
    expect(upTime(state)).toBeLessThan(UP_TIME.start);
    state.timeLeft = 0;
    expect(spawnInterval(state)).toBeCloseTo(SPAWN_INTERVAL.end);
    expect(upTime(state)).toBeCloseTo(UP_TIME.end);
  });

  it('ends the round when the clock runs out, and clears the moles', () => {
    const state = createState();
    state.timeLeft = 0.1;
    state.holes[2].moleTimeLeft = 1;
    step(state, 0.2, first);
    expect(state.phase).toBe('over');
    expect(state.timeLeft).toBe(0);
    expect(state.holes.some(isMoleUp)).toBe(false);
  });

  it('ignores whacks once the round is over', () => {
    const state = createState();
    const hole = state.holes[0];
    hole.moleTimeLeft = 1;
    state.phase = 'over';
    expect(whack(state, hole.x, hole.y)).toBe(false);
    expect(state.score).toBe(0);
  });

  it('keeps popping moles up through a whole round', () => {
    const state = createState();
    let popped = 0;
    let wasUp = 0;
    while (state.phase === 'playing') {
      step(state, 0.05, first);
      const up = state.holes.filter(isMoleUp).length;
      if (up > wasUp) popped += up - wasUp;
      wasUp = up;
    }
    expect(popped).toBeGreaterThan(ROUND_SECONDS / SPAWN_INTERVAL.start);
  });
});
