import { Container, Graphics, Ticker } from "pixi.js";
import type { GameConfig } from "../shared/config";
import { REEL_GAP, REEL_STRIPS, ROW_GAP } from "../shared/config";
import { createSymbolSlot } from "./symbols";
import { COLORS } from "../shared/colors";
import type { WinLine } from "../shared/types";

const ACCEL_DURATION = 400;
const MIN_SPIN_DURATION = 700;
const DECEL_DURATION = 480;
const REEL_STOP_DELAY = 320;
const BASE_MAX_SPEED = 2.6; // ms at symbolSize=100

type ReelPhase = "idle" | "accel" | "spin" | "decel" | "done";

type ReelState = {
  phase: ReelPhase;
  elapsed: number;
  position: number; // continuous float in symbol units
  startPos: number; // captured when decel begins
  targetPos: number; // integer symbol index to land on
  pendingStopIndex: number | null;
  slots: ReturnType<typeof createSymbolSlot>[];
};

export type ReelGroup = {
  root: Container;
  spin: (onReelStopped?: (reelIndex: number) => void) => void;
  land: (stopPositions: number[], onAllStopped: () => void) => void;
  highlightWins: (winLines: WinLine[]) => void;
  clearHighlights: () => void;
  width: number;
  height: number;
};

// https://easings.net/#
const easeIn = (t: number): number => t * t;
const easeOutBounce = (t: number): number => {
  if (t < 0.75) {
    const s = t / 0.75;
    return 1.04 * (1 - (1 - s) * (1 - s));
  }
  return 1.04 - 0.04 * ((t - 0.75) / 0.25);
};

export const createReelGroup = (
  config: GameConfig,
  symbolSize: number,
): ReelGroup => {
  const { reelCount, rowCount } = config;
  const symbolStep = symbolSize + ROW_GAP;
  const viewH = rowCount * symbolStep - ROW_GAP;
  const viewW = reelCount * (symbolSize + REEL_GAP) - REEL_GAP;

  const maxSpeed = (BASE_MAX_SPEED * (symbolSize / 100)) / symbolStep;
  const SLOT_COUNT = rowCount + 2;

  const root = new Container();
  const maskShape = new Graphics()
    .rect(0, 0, viewW, viewH)
    .fill(COLORS.maskFill);
  root.mask = maskShape;
  root.addChild(maskShape);

  const states: ReelState[] = [];

  // Updates all slot positions and textures for the current position
  const updateSlots = (state: ReelState, reelIndex: number): void => {
    const strip = REEL_STRIPS[reelIndex];
    const scrollFraction = state.position - Math.floor(state.position);
    const stripIndex = Math.floor(state.position);

    for (let i = 0; i < SLOT_COUNT; i++) {
      state.slots[i].container.y = (i - 1 - scrollFraction) * symbolStep;
      const symbolIndex =
        strip[
          (((stripIndex - 1 + i) % strip.length) + strip.length) % strip.length
        ];
      state.slots[i].setSymbol(symbolIndex);
    }
  };

  for (let reelIndex = 0; reelIndex < reelCount; reelIndex++) {
    const reelContainer = new Container();
    reelContainer.x = reelIndex * (symbolSize + REEL_GAP);
    root.addChild(reelContainer);

    const strip = REEL_STRIPS[reelIndex];
    const slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
      const slot = createSymbolSlot(symbolSize);
      slot.setSymbol(strip[i % strip.length]);
      reelContainer.addChild(slot.container);
      return slot;
    });

    const state: ReelState = {
      phase: "idle",
      elapsed: 0,
      position: 0,
      startPos: 0,
      targetPos: 0,
      pendingStopIndex: null,
      slots,
    };
    states.push(state);
    updateSlots(state, reelIndex);
  }

  let stoppedReelsCount = 0;
  let allStoppedCallback: (() => void) | null = null;

  const land = (stopPositions: number[], onAllStopped: () => void): void => {
    allStoppedCallback = onAllStopped;
    states.forEach((state, reelIndex) => {
      state.pendingStopIndex = stopPositions[reelIndex];
    });
  };

  const spin = (onReelStopped?: (reelIndex: number) => void): void => {
    stoppedReelsCount = 0;
    allStoppedCallback = null;

    states.forEach((state, reelIndex) => {
      state.phase = "accel";
      state.elapsed = 0;
      state.pendingStopIndex = null;

      setTimeout(() => {
        const sharedTicker = Ticker.shared;

        const onTick = (ticker: Ticker): void => {
          const dt = ticker.deltaMS;
          state.elapsed += dt;

          if (state.phase === "accel") {
            const progress = Math.min(state.elapsed / ACCEL_DURATION, 1);
            state.position += maxSpeed * easeIn(progress) * dt;
            if (progress >= 1) {
              state.phase = "spin";
              state.elapsed = 0;
            }
          } else if (state.phase === "spin") {
            state.position += maxSpeed * dt;

            if (
              state.pendingStopIndex !== null &&
              state.elapsed >= MIN_SPIN_DURATION
            ) {
              const strip = REEL_STRIPS[reelIndex];
              const minDecelDistance = maxSpeed * DECEL_DURATION * 0.5;
              let targetPos = state.pendingStopIndex;
              // Find nearest copy of stopIndex ahead of current position
              while (targetPos <= state.position + minDecelDistance)
                targetPos += strip.length;

              state.targetPos = targetPos;
              state.startPos = state.position;
              state.phase = "decel";
              state.elapsed = 0;
            }
          } else if (state.phase === "decel") {
            const progress = Math.min(state.elapsed / DECEL_DURATION, 1);
            state.position =
              state.startPos +
              (state.targetPos - state.startPos) * easeOutBounce(progress);

            if (state.elapsed >= DECEL_DURATION) {
              state.position = state.targetPos;
              state.phase = "done";
              sharedTicker.remove(onTick);
              stoppedReelsCount++;
              onReelStopped?.(reelIndex);

              if (stoppedReelsCount === reelCount) {
                allStoppedCallback?.();
              }
            }
          }

          updateSlots(state, reelIndex);
        };

        sharedTicker.add(onTick);
      }, reelIndex * REEL_STOP_DELAY);
    });
  };

  // Only highlights the symbols that matched (reels 0..matchCount-1 for each line)
  const highlightWins = (winLines: WinLine[]): void => {
    winLines.forEach(({ row, matchCount }) => {
      for (let reelIndex = 0; reelIndex < matchCount; reelIndex++) {
        states[reelIndex].slots[row + 1].highlight(true);
      }
    });
  };

  const clearHighlights = (): void => {
    states.forEach((state) => {
      state.slots.forEach((slot) => slot.highlight(false));
    });
  };

  return { root, spin, land, highlightWins, clearHighlights, width: viewW, height: viewH };
};
