import { Container, Graphics, Ticker } from "pixi.js";
import type { GameConfig } from "../config";
import { REEL_GAP, ROW_GAP, SYMBOLS } from "../config";
import { createSymbolSprite } from "./symbols";
import { COLORS } from "../colors";

const TOTAL_REPS = 10;

const ACCEL_DURATION = 400; // ramp up from 0 to full speed
const MIN_SPIN_DURATION = 700; // at full speed before decel is allowed
const DECEL_DURATION = 480; // ramp down from full speed to stop
const REEL_STOP_DELAY = 320; // between each reel starting its sequence (left → right)

const BASE_MAX_SPEED = 2.6;

type ReelPhase = "idle" | "accel" | "spin" | "decel" | "done";

type ReelState = {
  container: Container;
  phase: ReelPhase;
  elapsed: number;
  targetY: number;
  decelStartY: number;
};

export type ReelGroup = {
  root: Container;
  spin: (
    stopPositions: number[],
    onAllStopped: () => void,
    onReelStopped?: (reelIndex: number) => void,
  ) => void;
  width: number;
  height: number;
};

// Easing functions
const easeIn = (t: number): number => {
  return t * t;
};

const easeOutBounce = (t: number): number => {
  if (t < 0.75) {
    const s = t / 0.75;
    return 1.04 * (1 - (1 - s) * (1 - s));
  }
  return 1.04 - 0.04 * ((t - 0.75) / 0.25);
};

// We build a strip of symbols
const buildStrip = (symbolSize: number): Container => {
  const total = SYMBOLS.length * TOTAL_REPS;
  const strip = new Container();
  for (let i = 0; i < total; i++) {
    const symbolIndex = i % SYMBOLS.length;
    const sprite = createSymbolSprite(
      symbolIndex,
      SYMBOLS[symbolIndex],
      symbolSize,
    );
    sprite.y = i * (symbolSize + ROW_GAP);
    strip.addChild(sprite);
  }
  return strip;
};

export const createReelGroup = (
  config: GameConfig,
  symbolSize: number,
): ReelGroup => {
  const { reelCount, rowCount } = config;
  const symbolStep = symbolSize + ROW_GAP;

  const cycleLength = SYMBOLS.length * symbolStep;

  const viewH = rowCount * symbolStep - ROW_GAP;
  const viewW = reelCount * (symbolSize + REEL_GAP) - REEL_GAP;

  // Adjust speed based on sprite size
  const maxSpeed = BASE_MAX_SPEED * (symbolSize / 100);

  const root = new Container();

  // Graphics mask clips symbols to the visible window
  // Mask shape needs fill propery, color does not matter
  const maskShape = new Graphics()
    .rect(0, 0, viewW, viewH)
    .fill(COLORS.maskFill);
  root.mask = maskShape;
  root.addChild(maskShape);

  const states: ReelState[] = [];

  for (let r = 0; r < reelCount; r++) {
    const strip = buildStrip(symbolSize);
    strip.x = r * (symbolSize + REEL_GAP);
    strip.y = 0;
    root.addChild(strip);
    states.push({
      container: strip,
      phase: "idle",
      elapsed: 0,
      targetY: 0,
      decelStartY: 0,
    });
  }

  const spin = (stopPositions: number[], onAllStopped: () => void): void => {
    let stoppedReelsCount = 0;

    states.forEach((state, reelIndex) => {
      state.phase = "accel";
      state.elapsed = 0;

      const targetInPixels = -stopPositions[reelIndex] * symbolStep;

      setTimeout(() => {
        const ticker = Ticker.shared;

        const onTick = (t: Ticker): void => {
          const dt = t.deltaMS;
          state.elapsed += dt;

          if (state.phase === "accel") {
            const progress = Math.min(state.elapsed / ACCEL_DURATION, 1);
            // Move strip
            state.container.y =
              state.container.y - maxSpeed * easeIn(progress) * dt;
            if (progress >= 1) {
              // Change state
              state.phase = "spin";
              // Reset time
              state.elapsed = 0;
            }
          } else if (state.phase === "spin") {
            // Move
            state.container.y = state.container.y - maxSpeed * dt;

            if (state.elapsed >= MIN_SPIN_DURATION) {
              let nearestLandingY = targetInPixels;
              while (nearestLandingY > state.container.y) {
                nearestLandingY = nearestLandingY - cycleLength;
              }
              while (state.container.y - nearestLandingY > cycleLength) {
                nearestLandingY = nearestLandingY + cycleLength;
              }

              state.targetY = nearestLandingY;
              state.decelStartY = state.container.y;
              state.phase = "decel";
              state.elapsed = 0;
            }
          } else if (state.phase === "decel") {
            const progress = Math.min(state.elapsed / DECEL_DURATION, 1);
            const decelDistance = state.decelStartY - state.targetY;

            state.container.y =
              state.decelStartY - decelDistance * easeOutBounce(progress);

            if (state.elapsed >= DECEL_DURATION) {
              state.container.y = state.targetY;
              state.phase = "done";
              ticker.remove(onTick);
              stoppedReelsCount++;

              if (stoppedReelsCount === reelCount) {
                states.forEach((st, ri) => {
                  st.container.y = -stopPositions[ri] * symbolStep;
                });
                onAllStopped();
              }
            }
          }
        };

        ticker.add(onTick);
      }, reelIndex * REEL_STOP_DELAY);
    });
  };

  return { root, spin, width: viewW, height: viewH };
};
