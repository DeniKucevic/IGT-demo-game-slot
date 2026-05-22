import { REEL_STRIPS, type GameConfig } from "../shared/config";
import type { ServerResponse, WinLine } from "../shared/types";
import { getWinTier, TIER_PRIZE_MULT } from "../shared/types";

const evaluateLines = (
  grid: number[][],
  rowCount: number,
  reelCount: number,
): { winningLines: WinLine[]; prize: number } => {
  const winningLines: WinLine[] = [];
  let prize = 0;

  for (let row = 0; row < rowCount; row++) {
    const first = grid[0][row];
    let matchCount = 1;
    for (let reelIndex = 1; reelIndex < reelCount; reelIndex++) {
      if (grid[reelIndex][row] === first) matchCount++;
      else break;
    }
    if (matchCount >= 2) {
      const tier = getWinTier(matchCount, reelCount);
      winningLines.push({ row, matchCount, tier });
      prize += TIER_PRIZE_MULT[tier];
    }
  }

  return { winningLines, prize };
};

export const getResponseData = (config: GameConfig): ServerResponse => {
  const { reelCount, rowCount } = config;

  const reelPositions = Array.from({ length: reelCount }, (_, reelIndex) =>
    Math.floor(Math.random() * REEL_STRIPS[reelIndex].length),
  );

  const grid = reelPositions.map((pos, reelIndex) => {
    const strip = REEL_STRIPS[reelIndex];
    return Array.from(
      { length: rowCount },
      (_, row) => strip[(pos + row) % strip.length],
    );
  });

  const { winningLines, prize } = evaluateLines(grid, rowCount, reelCount);
  return { reelPositions, winningLines, prize };
};
