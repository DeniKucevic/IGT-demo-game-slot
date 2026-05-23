import { MIN_MATCH_COUNT, REEL_STRIPS, type GameConfig } from '../shared/config';
import type { WinLine } from '../shared/types';
import { getWinTier, TIER_PRIZE_MULT } from '../shared/types';

type EvaluateLines = { winningLines: WinLine[]; prize: number };
type ServerResponse = { status: number; data: string };

const evaluateLines = (grid: number[][], rowCount: number, reelCount: number): EvaluateLines => {
  const winningLines: WinLine[] = [];
  let prize = 0;

  for (let row = 0; row < rowCount; row++) {
    const first = grid[0][row];
    let matchCount = 1;
    for (let reelIndex = 1; reelIndex < reelCount; reelIndex++) {
      if (grid[reelIndex][row] === first) matchCount++;
      else break;
    }
    if (matchCount >= MIN_MATCH_COUNT) {
      const tier = getWinTier(matchCount, reelCount);
      winningLines.push({ row, matchCount, tier });
      prize += TIER_PRIZE_MULT[tier];
    }
  }

  return { winningLines, prize };
};

export const getSimulatedResponse = (config: GameConfig): ServerResponse => {
  const { reelCount, rowCount } = config;

  const reelPositions = Array.from({ length: reelCount }, (_, i) =>
    Math.floor(Math.random() * REEL_STRIPS[i].length),
  );

  const grid = reelPositions.map((pos, reelIndex) => {
    const strip = REEL_STRIPS[reelIndex];
    return Array.from({ length: rowCount }, (_, row) => strip[(pos + row) % strip.length]);
  });

  const { winningLines, prize } = evaluateLines(grid, rowCount, reelCount);
  const response = { reelPositions, winningLines, prize };
  // Status and everything
  return {
    status: 200,
    data: JSON.stringify(response),
  };
};
