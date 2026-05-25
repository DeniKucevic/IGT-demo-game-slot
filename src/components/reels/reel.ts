import { Container, Ticker } from 'pixi.js';

import { REEL_STRIPS } from '@shared/config';
import { ROW_GAP } from '@shared/layout';

import { createSymbolSlot } from './symbols';

const ACCEL_DURATION = 400;
const MIN_SPIN_DURATION = 700;
const DECEL_DURATION = 480;
const FAILSAFE_TIMEOUT = 5000;
const BASE_MAX_SPEED = 2.6;
const STOP_STAGGER = 500;

type ReelPhase = 'idle' | 'accel' | 'spin' | 'decel' | 'done';

type ReelState = {
  phase: ReelPhase;
  elapsed: number;
  totalElapsed: number;
  position: number;
  startPos: number;
  targetPos: number;
  pendingStopIndex: number | null;
  decelTargetTime: number | null;
};

export type Reel = {
  container: Container;
  /** Starts the spin animation. `land()` must be called separately once the server responds. */
  spin: (failsafePos: number, onStopped: () => void) => void;
  /** Schedules deceleration to `stopIndex`. Safe to call before or during the spin phase. */
  land: (stopIndex: number) => void;
  highlightRow: (row: number, on: boolean) => void;
  clearHighlights: () => void;
};

// https://easings.net/
const easeIn = (t: number): number => t * t;
const easeOutBounce = (t: number): number => {
  if (t < 0.75) {
    const s = t / 0.75;
    return 1.04 * (1 - (1 - s) * (1 - s));
  }
  return 1.04 - 0.04 * ((t - 0.75) / 0.25);
};

/**
 * Single reel column. Scrolls a virtual strip of symbols using PixiJS Ticker.
 * `spin()` and `land()` are decoupled - start the spin immediately, call `land()`
 * whenever the server responds. If no `land()` arrives within FAILSAFE_TIMEOUT,
 * the reel stops at `failsafePos` automatically.
 * @param reelIndex - Column index (0-based); selects the strip from REEL_STRIPS.
 * @param symbolSize - Symbol height/width in pixels; controls scroll speed scaling.
 * @param rowCount - Visible rows; reel allocates rowCount + 2 slots to hide scroll edges.
 */
export const createReel = (reelIndex: number, symbolSize: number, rowCount: number): Reel => {
  const strip = REEL_STRIPS[reelIndex];
  const symbolStep = symbolSize + ROW_GAP;
  const SLOT_COUNT = rowCount + 2;
  const maxSpeed = (BASE_MAX_SPEED * (symbolSize / 100)) / symbolStep;

  const container = new Container();

  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const slot = createSymbolSlot(symbolSize);
    slot.setSymbol(strip[i % strip.length]);
    container.addChild(slot.container);
    return slot;
  });

  const state: ReelState = {
    phase: 'idle',
    elapsed: 0,
    totalElapsed: 0,
    position: 0,
    startPos: 0,
    targetPos: 0,
    pendingStopIndex: null,
    decelTargetTime: null,
  };

  const updateSlots = (): void => {
    const scrollFraction = state.position - Math.floor(state.position);
    const stripIndex = Math.floor(state.position);
    for (let i = 0; i < SLOT_COUNT; i++) {
      slots[i].container.y = (i - 1 - scrollFraction) * symbolStep;
      const symbolIndex =
        strip[(((stripIndex - 1 + i) % strip.length) + strip.length) % strip.length];
      slots[i].setSymbol(symbolIndex);
    }
  };

  updateSlots();

  const land = (stopIndex: number): void => {
    state.pendingStopIndex = stopIndex;
    const minRequiredTime = ACCEL_DURATION + MIN_SPIN_DURATION;
    state.decelTargetTime =
      Math.max(state.totalElapsed, minRequiredTime) + reelIndex * STOP_STAGGER;
  };

  const spin = (failsafePos: number, onStopped: () => void): void => {
    state.phase = 'accel';
    state.elapsed = 0;
    state.totalElapsed = 0;
    state.pendingStopIndex = null;
    state.decelTargetTime = null;

    const sharedTicker = Ticker.shared;

    // Here is all the timed logic using pixijs tick
    const onTick = (ticker: Ticker): void => {
      const dt = ticker.deltaMS;
      state.elapsed += dt;
      state.totalElapsed += dt;

      if (state.phase === 'accel') {
        const progress = Math.min(state.elapsed / ACCEL_DURATION, 1);
        state.position += maxSpeed * easeIn(progress) * dt;
        if (progress >= 1) {
          state.phase = 'spin';
          state.elapsed = 0;
        }
      } else if (state.phase === 'spin') {
        state.position += maxSpeed * dt;

        // Failsafe if server never responds
        if (state.pendingStopIndex === null && state.totalElapsed >= FAILSAFE_TIMEOUT) {
          state.pendingStopIndex = failsafePos;
          state.decelTargetTime = state.totalElapsed + reelIndex * STOP_STAGGER;
        }

        if (
          state.pendingStopIndex !== null &&
          state.decelTargetTime !== null &&
          state.totalElapsed >= state.decelTargetTime
        ) {
          // We divide by 2 to get average
          const minDecelDistance = maxSpeed * DECEL_DURATION * 0.5;
          let targetPos = state.pendingStopIndex;
          while (targetPos <= state.position + minDecelDistance) targetPos += strip.length;
          state.targetPos = targetPos;
          state.startPos = state.position;
          state.phase = 'decel';
          state.elapsed = 0;
        }
      } else if (state.phase === 'decel') {
        const progress = Math.min(state.elapsed / DECEL_DURATION, 1);
        state.position =
          state.startPos + (state.targetPos - state.startPos) * easeOutBounce(progress);
        if (state.elapsed >= DECEL_DURATION) {
          state.position = state.targetPos % strip.length;
          state.pendingStopIndex = null;
          state.phase = 'done';
          sharedTicker.remove(onTick);
          onStopped();
        }
      }
      updateSlots();
    };

    sharedTicker.add(onTick);
  };

  const highlightRow = (row: number, on: boolean): void => {
    slots[row + 1].highlight(on);
  };
  const clearHighlights = (): void => {
    slots.forEach((s) => s.highlight(false));
  };

  return { container, spin, land, highlightRow, clearHighlights };
};
