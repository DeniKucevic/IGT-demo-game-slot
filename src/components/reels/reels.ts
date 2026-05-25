import { Container, Graphics } from 'pixi.js';

import { COLORS } from '@shared';
import type { GameConfig } from '@shared/config';
import { REEL_STRIPS } from '@shared/config';
import { REEL_GAP, ROW_GAP } from '@shared/layout';
import type { WinLine } from '@shared/types';

import { createReel } from './reel';

// Helper to generate failsafe positions in case we do not get server response
// in the failsafe time we set
const generateFailsafePositions = (rowCount: number): number[] => {
  const pos0 = Math.floor(Math.random() * REEL_STRIPS[0].length);

  const valid1 = REEL_STRIPS[1]
    .map((_, p) => p)
    .filter(
      (p) =>
        !Array.from(
          { length: rowCount },
          (_, row) =>
            REEL_STRIPS[0][(pos0 + row) % REEL_STRIPS[0].length] ===
            REEL_STRIPS[1][(p + row) % REEL_STRIPS[1].length],
        ).some(Boolean),
    );

  const pos1 = valid1[Math.floor(Math.random() * valid1.length)] ?? 0;
  return REEL_STRIPS.map((strip, i) =>
    i === 0 ? pos0 : i === 1 ? pos1 : Math.floor(Math.random() * strip.length),
  );
};

export type ReelGroup = {
  root: Container;
  /** Starts all reels spinning. Generates failsafe stop positions internally. */
  spin: (onReelStopped?: () => void) => void;
  /**
   * Schedules each reel to stop at the given position.
   * `onAllStopped` fires after the last reel completes its deceleration.
   * Call after `spin()`, at any point before FAILSAFE_TIMEOUT elapses.
   */
  land: (stopPositions: number[], onAllStopped: () => void) => void;
  highlightWins: (winLines: WinLine[]) => void;
  clearHighlights: () => void;
  width: number;
  height: number;
};

/**
 * Grid of reels clipped to the visible play area.
 * Coordinates spin/stop across all columns and counts completions internally.
 * @param config - Provides reelCount and rowCount.
 * @param symbolSize - Base symbol size in pixels; passed to each reel for speed scaling.
 */
export const createReelGroup = (config: GameConfig, symbolSize: number): ReelGroup => {
  const { reelCount, rowCount } = config;
  const symbolStep = symbolSize + ROW_GAP;
  const viewH = rowCount * symbolStep - ROW_GAP;
  const viewW = reelCount * (symbolSize + REEL_GAP) - REEL_GAP;

  const root = new Container();
  const maskShape = new Graphics().rect(0, 0, viewW, viewH).fill(COLORS.maskFill);
  root.mask = maskShape;
  root.addChild(maskShape);

  const reels = Array.from({ length: reelCount }, (_, reelIndex) => {
    const reel = createReel(reelIndex, symbolSize, rowCount);
    reel.container.x = reelIndex * (symbolSize + REEL_GAP);
    root.addChild(reel.container);
    return reel;
  });

  let stoppedCount = 0;
  let allStoppedCallback: (() => void) | null = null;

  const land = (stopPositions: number[], onAllStopped: () => void): void => {
    allStoppedCallback = onAllStopped;
    reels.forEach((reel, reelIndex) => reel.land(stopPositions[reelIndex]));
  };

  const spin = (onReelStopped?: () => void): void => {
    stoppedCount = 0;
    allStoppedCallback = null;
    const failsafePositions = generateFailsafePositions(rowCount);

    reels.forEach((reel, reelIndex) => {
      reel.spin(failsafePositions[reelIndex], () => {
        onReelStopped?.();
        stoppedCount++;
        if (stoppedCount === reelCount) allStoppedCallback?.();
      });
    });
  };

  const highlightWins = (winLines: WinLine[]): void => {
    winLines.forEach(({ row, matchCount }) => {
      for (let reelIndex = 0; reelIndex < matchCount; reelIndex++)
        reels[reelIndex].highlightRow(row, true);
    });
  };

  const clearHighlights = (): void => {
    reels.forEach((r) => r.clearHighlights());
  };

  return {
    root,
    spin,
    land,
    highlightWins,
    clearHighlights,
    width: viewW,
    height: viewH,
  };
};
