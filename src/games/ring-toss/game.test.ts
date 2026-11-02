import { describe, expect, it } from 'vitest';
import {
  FLIGHT_TIME,
  HAND,
  NECK_RADIUS,
  RINGS_PER_ROUND,
  bottleAt,
  createState,
  step,
  sway,
  toss,
} from './game';

describe('ring toss', () => {
  it('starts with a full set of rings and no score', () => {
    const state = createState();
    expect(state.rings).toBe(RINGS_PER_ROUND);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.bottles.length).toBeGreaterThan(0);
  });

  it('uses one ring per toss', () => {
    const state = createState();
    expect(toss(state, 400, 200)).toBe(true);
    expect(state.rings).toBe(RINGS_PER_ROUND - 1);
    expect(state.ring).not.toBeNull();
  });

  it('throws one ring at a time', () => {
    const state = createState();
    toss(state, 400, 200);
    expect(toss(state, 400, 200)).toBe(false);
    expect(state.rings).toBe(RINGS_PER_ROUND - 1);
  });

  it('cannot toss once the rings run out', () => {
    const state = createState();
    state.rings = 0;
    expect(toss(state, 400, 200)).toBe(false);
    expect(state.ring).toBeNull();
  });

  it('never throws backwards, even when aimed below the hand', () => {
    const state = createState();
    toss(state, 400, HAND.y + 100);
    expect(state.ring!.toY).toBeLessThan(HAND.y);
  });

  it('lands the ring off the aim by the sway at the moment of the throw', () => {
    const state = createState();
    state.time = 0.4;
    const drift = sway(state);
    toss(state, 300, 200);
    expect(state.ring!.toX).toBeCloseTo(300 + drift);
  });

  it('scores a ring that lands on a bottle neck', () => {
    const state = createState();
    const bottle = state.bottles[0];
    state.time = 0; // no sway
    toss(state, bottle.x, bottle.y);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(bottle.points);
    expect(bottle.ringers).toBe(1);
    expect(state.landed).toEqual([{ x: bottle.x, y: bottle.y, ringer: true }]);
  });

  it('scores nothing for a ring that misses every neck', () => {
    const state = createState();
    toss(state, 2, 470);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(0);
    expect(state.landed[0].ringer).toBe(false);
  });

  it('keeps the ring in the air until its flight is over', () => {
    const state = createState();
    const bottle = state.bottles[0];
    toss(state, bottle.x, bottle.y);
    step(state, FLIGHT_TIME / 2);
    expect(state.ring).not.toBeNull();
    expect(state.score).toBe(0);
  });

  it('scores bottles further back higher', () => {
    const state = createState();
    const back = state.bottles.reduce((a, b) => (b.y < a.y ? b : a));
    const front = state.bottles.reduce((a, b) => (b.y > a.y ? b : a));
    expect(back.points).toBeGreaterThan(front.points);
  });

  it('finds a neck within its radius and misses outside it', () => {
    const state = createState();
    const bottle = state.bottles[0];
    expect(bottleAt(state, bottle.x + NECK_RADIUS - 1, bottle.y)).toBe(bottle);
    expect(bottleAt(state, bottle.x + NECK_RADIUS + 1, bottle.y)).toBeUndefined();
  });

  it('ends the round when the last ring has landed', () => {
    const state = createState();
    state.rings = 1;
    toss(state, 400, 200);
    step(state, FLIGHT_TIME / 2);
    expect(state.phase).toBe('playing');
    step(state, FLIGHT_TIME);
    expect(state.phase).toBe('over');
  });
});
