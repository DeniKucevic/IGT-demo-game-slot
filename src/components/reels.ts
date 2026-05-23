import { Container, Graphics } from "pixi.js";
import type { GameConfig } from "../shared/config";
import { REEL_GAP, REEL_STRIPS, ROW_GAP } from "../shared/config";
import { COLORS } from "../shared/colors";
import type { WinLine } from "../shared/types";
import { createReel } from "./reel";

const REEL_STOP_DELAY = 320;

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
  spin: (onReelStopped?: (reelIndex: number) => void) => void;
  land: (stopPositions: number[], onAllStopped: () => void) => void;
  highlightWins: (winLines: WinLine[]) => void;
  clearHighlights: () => void;
  width: number;
  height: number;
};

export const createReelGroup = (
  config: GameConfig,
  symbolSize: number,
): ReelGroup => {
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
    reels.forEach((reel, i) => reel.land(stopPositions[i]));
  };

  const spin = (onReelStopped?: (reelIndex: number) => void): void => {
    stoppedCount = 0;
    allStoppedCallback = null;
    const failsafePositions = generateFailsafePositions(rowCount);

    reels.forEach((reel, reelIndex) => {
      setTimeout(() => {
        reel.spin(failsafePositions[reelIndex], () => {
          stoppedCount++;
          onReelStopped?.(reelIndex);
          if (stoppedCount === reelCount) {
            allStoppedCallback?.();
          }
        });
      }, reelIndex * REEL_STOP_DELAY);
    });
  };

  const highlightWins = (winLines: WinLine[]): void => {
    winLines.forEach(({ row, matchCount }) => {
      for (let reelIndex = 0; reelIndex < matchCount; reelIndex++) {
        reels[reelIndex].highlightRow(row, true);
      }
    });
  };

  const clearHighlights = (): void => {
    reels.forEach((reel) => reel.clearHighlights());
  };

  return { root, spin, land, highlightWins, clearHighlights, width: viewW, height: viewH };
};
